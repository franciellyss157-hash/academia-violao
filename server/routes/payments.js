const express = require('express');
const fs = require('fs');
const { pool } = require('../db');
const { requireUser } = require('../auth');
const { uploadPrivate, privateUrl } = require('../lib/upload');
const { receiptHash, orderCode, evaluateReceipt, DAILY_RECEIPT_LIMIT } = require('../lib/fraud');
const { shapeOrder } = require('../lib/order');

const safeRouter = require('../lib/safeRouter');
const router = safeRouter();
router.use(requireUser);

const PIX_KEY = process.env.PIX_KEY || 'francielly.ss157@gmail.com';
const PIX_HOLDER = process.env.PIX_HOLDER || 'Francielly S.';

router.get('/packages', async (req, res) => {
  const pkgs = await pool.query('SELECT * FROM packages WHERE active = true ORDER BY sort');
  const isAdmin = req.user.role === 'admin';
  const unlocks = isAdmin
    ? { rows: [] }
    : await pool.query('SELECT pack FROM sticker_unlocks WHERE user_id = $1', [req.user.id]);
  res.json({
    packages: pkgs.rows.map((p) => ({ ...p, price: Number(p.price) })),
    credits: isAdmin ? 0 : req.user.credits,
    vip: isAdmin ? false : req.user.vip,
    highlightUntil: isAdmin ? null : req.user.highlight_until,
    unlockedPacks: unlocks.rows.map((r) => r.pack),
    pix: { key: PIX_KEY, holder: PIX_HOLDER },
    dailyReceiptLimit: DAILY_RECEIPT_LIMIT,
  });
});

router.post('/orders', async (req, res) => {
  const packageId = String(req.body.packageId || '');
  const { rows: pkgs } = await pool.query('SELECT * FROM packages WHERE id = $1 AND active = true', [
    packageId,
  ]);
  const pkg = pkgs[0];
  if (!pkg) return res.status(404).json({ error: 'Pacote não encontrado.' });

  let order = null;
  for (let i = 0; i < 5 && !order; i += 1) {
    try {
      const created = await pool.query(
        `INSERT INTO orders (code, user_id, package_id, amount) VALUES ($1,$2,$3,$4) RETURNING *`,
        [orderCode(), req.user.id, pkg.id, pkg.price]
      );
      order = created.rows[0];
    } catch (err) {
      if (err.code !== '23505') throw err;
    }
  }
  if (!order) return res.status(500).json({ error: 'Não foi possível gerar o pedido.' });

  res.status(201).json({
    order: shapeOrder(order),
    package: { ...pkg, price: Number(pkg.price) },
    pix: { key: PIX_KEY, holder: PIX_HOLDER, amount: Number(pkg.price) },
  });
});

router.get('/orders', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.*, p.name AS package_name FROM orders o LEFT JOIN packages p ON p.id = o.package_id
     WHERE o.user_id = $1 ORDER BY o.created_at DESC LIMIT 60`,
    [req.user.id]
  );
  res.json({ orders: rows.map((r) => ({ ...shapeOrder(r), packageName: r.package_name })) });
});

router.get('/orders/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.*, p.name AS package_name FROM orders o LEFT JOIN packages p ON p.id = o.package_id
     WHERE o.id = $1 AND o.user_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Pedido não encontrado.' });
  res.json({ order: { ...shapeOrder(rows[0]), packageName: rows[0].package_name }, pix: { key: PIX_KEY, holder: PIX_HOLDER } });
});

router.post('/orders/:id/receipt', uploadPrivate.single('receipt'), async (req, res) => {
  const cleanup = () => {
    if (req.file) fs.unlink(req.file.path, () => {});
  };

  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.user.id,
  ]);
  const order = rows[0];
  if (!order) {
    cleanup();
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }
  if (!['awaiting_receipt', 'rejected'].includes(order.status)) {
    cleanup();
    return res.status(409).json({ error: 'Este pedido não aceita novos comprovantes.' });
  }
  if (!req.file) return res.status(400).json({ error: 'Anexe a foto do comprovante.' });

  const payerName = String(req.body.payerName || '').trim();
  const amountPaid = req.body.amountPaid === undefined || req.body.amountPaid === ''
    ? null
    : Number(String(req.body.amountPaid).replace(',', '.'));
  if (!payerName) {
    cleanup();
    return res.status(400).json({ error: 'Informe o nome do pagador.' });
  }

  const buffer = fs.readFileSync(req.file.path);
  const hash = receiptHash(buffer);

  const todayCount = await pool.query(
    `SELECT count(*)::int AS n FROM receipt_submissions WHERE user_id = $1 AND created_at::date = current_date`,
    [req.user.id]
  );
  const duplicate = await pool.query(
    `SELECT 1 FROM receipt_submissions WHERE hash = $1 AND order_id <> $2 LIMIT 1`,
    [hash, order.id]
  );

  const verdict = evaluateReceipt({
    expectedAmount: order.amount,
    informedAmount: amountPaid,
    hash,
    existingHashes: duplicate.rowCount ? [hash] : [],
    receiptsToday: todayCount.rows[0].n,
  });

  if (verdict.blocked) {
    cleanup();
    return res.status(429).json({
      error: `Limite de ${DAILY_RECEIPT_LIMIT} comprovantes por dia atingido. Tente novamente amanhã.`,
    });
  }

  await pool.query(
    `INSERT INTO receipt_submissions (order_id, user_id, hash, amount_paid, payer_name)
     VALUES ($1,$2,$3,$4,$5)`,
    [order.id, req.user.id, hash, amountPaid, payerName]
  );

  const mergedFlags = Array.from(new Set([...(order.flags || []), ...verdict.flags]));
  const updated = await pool.query(
    `UPDATE orders SET status = 'under_review', receipt_url = $1, receipt_hash = $2,
       amount_paid = $3, payer_name = $4, flags = $5, reject_reason = NULL, updated_at = now()
     WHERE id = $6 RETURNING *`,
    [privateUrl(req.file), hash, amountPaid, payerName, JSON.stringify(mergedFlags), order.id]
  );

  for (const flag of verdict.flags) {
    await pool.query(
      `INSERT INTO admin_alerts (kind, order_id, user_id, message) VALUES ('fraude',$1,$2,$3)`,
      [order.id, req.user.id, `Pedido ${order.code}: ${flag}`]
    );
  }

  await pool.query(
    `INSERT INTO notifications (user_id, type, title, body, data)
     VALUES ($1,'pagamento','Comprovante enviado','Seu pedido está em análise. Avisaremos assim que o ADM revisar.',$2)`,
    [req.user.id, JSON.stringify({ orderId: order.id })]
  );

  res.json({ order: shapeOrder(updated.rows[0]), flags: verdict.flags });
});

module.exports = router;
