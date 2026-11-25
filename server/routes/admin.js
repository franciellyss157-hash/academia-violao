const express = require('express');
const { pool } = require('../db');
const { requireUser, requireAdmin } = require('../auth');
const { shapeOrder } = require('../lib/order');

const safeRouter = require('../lib/safeRouter');
const router = safeRouter();
router.use(requireUser, requireAdmin);

router.get('/stats', async (_req, res) => {
  const { rows } = await pool.query(`SELECT
    (SELECT count(*)::int FROM orders WHERE status = 'under_review') AS pending_review,
    (SELECT count(*)::int FROM orders WHERE status = 'awaiting_receipt') AS awaiting_receipt,
    (SELECT count(*)::int FROM reports WHERE status = 'open') AS open_reports,
    (SELECT count(*)::int FROM users WHERE flagged) AS flagged_users,
    (SELECT count(*)::int FROM users WHERE role = 'user') AS users,
    (SELECT count(*)::int FROM admin_alerts WHERE NOT resolved) AS alerts,
    (SELECT COALESCE(sum(amount),0)::float FROM orders WHERE status = 'approved') AS revenue`);
  res.json(rows[0]);
});

router.get('/orders', async (req, res) => {
  const { status = '', from = '', to = '', q = '' } = req.query;
  const { rows } = await pool.query(
    `SELECT o.*, u.name AS user_name, u.email AS user_email, p.name AS package_name
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN packages p ON p.id = o.package_id
     WHERE ($1 = '' OR o.status = $1)
       AND ($2 = '' OR o.created_at >= $2::date)
       AND ($3 = '' OR o.created_at < ($3::date + interval '1 day'))
       AND ($4 = '' OR u.name ILIKE '%' || $4 || '%' OR u.email ILIKE '%' || $4 || '%' OR o.code ILIKE '%' || $4 || '%')
     ORDER BY o.created_at DESC
     LIMIT 200`,
    [status, from, to, q]
  );
  res.json({ orders: rows.map((r) => ({ ...shapeOrder(r), packageName: r.package_name })) });
});

router.get('/orders/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.*, u.name AS user_name, u.email AS user_email, u.credits AS user_credits,
            u.flagged AS user_flagged, p.name AS package_name
     FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN packages p ON p.id = o.package_id
     WHERE o.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Pedido não encontrado.' });
  const subs = await pool.query(
    `SELECT id, hash, amount_paid, payer_name, created_at FROM receipt_submissions
     WHERE order_id = $1 ORDER BY created_at DESC`,
    [req.params.id]
  );
  res.json({
    order: { ...shapeOrder(rows[0]), packageName: rows[0].package_name, userCredits: rows[0].user_credits, userFlagged: rows[0].user_flagged },
    submissions: subs.rows,
  });
});

router.post('/orders/:id/approve', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT o.*, p.credits AS pkg_credits, p.perks, p.name AS pkg_name
       FROM orders o JOIN packages p ON p.id = o.package_id
       WHERE o.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const order = rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }
    if (order.status === 'approved') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Pedido já aprovado.' });
    }
    if (!order.receipt_url) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Pedido sem comprovante anexado.' });
    }

    const perks = order.perks || {};
    await client.query(
      `UPDATE orders SET status = 'approved', reject_reason = NULL, reviewed_at = now(), updated_at = now() WHERE id = $1`,
      [order.id]
    );
    await client.query(
      `UPDATE users SET credits = credits + $1, consecutive_rejections = 0 WHERE id = $2`,
      [order.pkg_credits, order.user_id]
    );
    if (perks.highlight) {
      await client.query(
        `UPDATE users SET highlight_until = GREATEST(COALESCE(highlight_until, now()), now()) + interval '24 hours' WHERE id = $1`,
        [order.user_id]
      );
    }
    if (perks.vip) {
      await client.query('UPDATE users SET vip = true WHERE id = $1', [order.user_id]);
    }
    if (perks.stickerPack) {
      await client.query(
        `INSERT INTO sticker_unlocks (user_id, pack) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [order.user_id, perks.stickerPack]
      );
    }

    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1,'pagamento','Pagamento aprovado',$2,$3)`,
      [
        order.user_id,
        `${order.pkg_name} liberado: +${order.pkg_credits} créditos e benefícios ativos.`,
        JSON.stringify({ orderId: order.id }),
      ]
    );
    await client.query('COMMIT');
    res.json({ ok: true, status: 'approved' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.post('/orders/:id/reject', async (req, res) => {
  const reason = String(req.body.reason || '').trim();
  if (reason.length < 3) return res.status(400).json({ error: 'Informe o motivo da recusa.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    const order = rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }
    if (order.status === 'approved') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Pedido já aprovado não pode ser recusado.' });
    }

    await client.query(
      `UPDATE orders SET status = 'rejected', reject_reason = $1, reviewed_at = now(), updated_at = now() WHERE id = $2`,
      [reason.slice(0, 300), order.id]
    );
    const user = await client.query(
      `UPDATE users SET consecutive_rejections = consecutive_rejections + 1 WHERE id = $1
       RETURNING consecutive_rejections`,
      [order.user_id]
    );
    if (user.rows[0].consecutive_rejections >= 3) {
      await client.query('UPDATE users SET flagged = true WHERE id = $1', [order.user_id]);
      await client.query(
        `INSERT INTO admin_alerts (kind, order_id, user_id, message)
         VALUES ('usuario_suspeito',$1,$2,$3)`,
        [order.id, order.user_id, `Usuário com ${user.rows[0].consecutive_rejections} recusas seguidas — revisar`]
      );
    }
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1,'pagamento','Comprovante recusado',$2,$3)`,
      [
        order.user_id,
        `Motivo: ${reason}. Você pode enviar um novo comprovante.`,
        JSON.stringify({ orderId: order.id }),
      ]
    );
    await client.query('COMMIT');
    res.json({ ok: true, status: 'rejected' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.get('/users', async (req, res) => {
  const { q = '', status = '' } = req.query;
  const { rows } = await pool.query(
    `SELECT u.*,
       (SELECT count(*)::int FROM orders WHERE user_id = u.id AND status = 'approved') AS approved_orders,
       (SELECT count(*)::int FROM orders WHERE user_id = u.id AND status = 'rejected') AS rejected_orders
     FROM users u
     WHERE u.role = 'user'
       AND ($1 = '' OR u.name ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
       AND ($2 = '' OR u.status = $2)
     ORDER BY u.created_at DESC LIMIT 200`,
    [q, status]
  );
  res.json({
    users: rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      status: u.status,
      verified: u.verified,
      verificationStatus: u.verification_status,
      selfieUrl: u.selfie_url,
      flagged: u.flagged,
      consecutiveRejections: u.consecutive_rejections,
      credits: u.credits,
      vip: u.vip,
      age: u.birthdate ? Math.floor((Date.now() - new Date(u.birthdate)) / 31557600000) : null,
      approvedOrders: u.approved_orders,
      rejectedOrders: u.rejected_orders,
      createdAt: u.created_at,
    })),
  });
});

router.patch('/users/:id', async (req, res) => {
  const action = String(req.body.action || '');
  const map = {
    suspend: `status = 'suspended'`,
    ban: `status = 'banned'`,
    reactivate: `status = 'active'`,
    unflag: `flagged = false, consecutive_rejections = 0`,
    verify: `verified = true, verification_status = 'approved'`,
    reject_verification: `verified = false, verification_status = 'rejected'`,
  };
  if (action === 'grant') {
    const amount = Math.max(1, Math.min(1000, Number(req.body.amount) || 0));
    await pool.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [amount, req.params.id]);
    return res.json({ ok: true });
  }
  if (!map[action]) return res.status(400).json({ error: 'Ação inválida.' });
  await pool.query(`UPDATE users SET ${map[action]} WHERE id = $1 AND role = 'user'`, [req.params.id]);
  res.json({ ok: true });
});

router.get('/reports', async (req, res) => {
  const status = req.query.status || 'open';
  const { rows } = await pool.query(
    `SELECT r.*, rep.name AS reporter_name, tgt.name AS target_name, tgt.email AS target_email
     FROM reports r
     JOIN users rep ON rep.id = r.reporter_id
     JOIN users tgt ON tgt.id = r.target_user_id
     WHERE ($1 = '' OR r.status = $1)
     ORDER BY r.created_at DESC LIMIT 100`,
    [status]
  );
  res.json({ reports: rows });
});

router.patch('/reports/:id', async (req, res) => {
  const action = req.body.action === 'resolve' ? 'resolved' : 'dismissed';
  const resolution = String(req.body.resolution || '').slice(0, 300);
  await pool.query(
    `UPDATE reports SET status = $1, resolution = $2, resolved_at = now() WHERE id = $3`,
    [action, resolution, req.params.id]
  );
  res.json({ ok: true });
});

router.get('/packages', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM packages ORDER BY sort');
  res.json({ packages: rows.map((p) => ({ ...p, price: Number(p.price) })) });
});

router.put('/packages/:id', async (req, res) => {
  const fields = [];
  const values = [];
  const set = (col, val) => {
    values.push(val);
    fields.push(`${col} = $${values.length}`);
  };
  if (req.body.price !== undefined && !Number.isNaN(Number(req.body.price)))
    set('price', Math.max(0, Number(req.body.price)));
  if (req.body.credits !== undefined) set('credits', Math.max(0, Number(req.body.credits) || 0));
  if (typeof req.body.benefit === 'string') set('benefit', req.body.benefit.slice(0, 200));
  if (typeof req.body.name === 'string') set('name', req.body.name.slice(0, 60));
  if (typeof req.body.active === 'boolean') set('active', req.body.active);
  if (!fields.length) return res.status(400).json({ error: 'Nada para atualizar.' });

  values.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE packages SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  if (!rows[0]) return res.status(404).json({ error: 'Pacote não encontrado.' });
  res.json({ package: { ...rows[0], price: Number(rows[0].price) } });
});

router.get('/earnings', async (req, res) => {
  const period = ['day', 'week', 'month'].includes(req.query.period) ? req.query.period : 'day';
  const buckets = await pool.query(
    `SELECT to_char(date_trunc($1, reviewed_at), 'YYYY-MM-DD') AS bucket,
            sum(amount)::float AS total, count(*)::int AS orders
     FROM orders WHERE status = 'approved' AND reviewed_at IS NOT NULL
     GROUP BY 1 ORDER BY 1 DESC LIMIT 90`,
    [period]
  );
  const totals = await pool.query(
    `SELECT
       COALESCE(sum(amount) FILTER (WHERE reviewed_at::date = current_date), 0)::float AS today,
       COALESCE(sum(amount) FILTER (WHERE reviewed_at >= date_trunc('week', now())), 0)::float AS week,
       COALESCE(sum(amount) FILTER (WHERE reviewed_at >= date_trunc('month', now())), 0)::float AS month,
       COALESCE(sum(amount), 0)::float AS all_time,
       count(*)::int AS approved_count
     FROM orders WHERE status = 'approved'`
  );
  res.json({ period, buckets: buckets.rows, totals: totals.rows[0] });
});

router.get('/alerts', async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT a.*, u.name AS user_name FROM admin_alerts a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE NOT a.resolved ORDER BY a.created_at DESC LIMIT 100`
  );
  res.json({ alerts: rows });
});

router.patch('/alerts/:id', async (req, res) => {
  await pool.query('UPDATE admin_alerts SET resolved = true WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
