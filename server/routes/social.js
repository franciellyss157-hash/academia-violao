const express = require('express');
const { pool } = require('../db');
const { requireUser, withPhotos } = require('../auth');

const safeRouter = require('../lib/safeRouter');
const router = safeRouter();
router.use(requireUser);

const FREE_LIKES = 10;
const VIP_LIKES = 50;

async function notify(userId, type, title, body, data = {}) {
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, body, data) VALUES ($1,$2,$3,$4,$5)`,
    [userId, type, title, body, JSON.stringify(data)]
  );
}

router.post('/likes/:userId', async (req, res) => {
  const targetId = req.params.userId;
  if (targetId === req.user.id) return res.status(400).json({ error: 'Não é possível curtir você mesmo.' });

  const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1 AND role = 'user'`, [targetId]);
  const target = rows[0];
  if (!target) return res.status(404).json({ error: 'Perfil não encontrado.' });
  if (target.status !== 'active') return res.status(400).json({ error: 'Perfil indisponível.' });

  const blocked = await pool.query(
    `SELECT 1 FROM blocks WHERE (user_id=$1 AND blocked_user_id=$2) OR (user_id=$2 AND blocked_user_id=$1)`,
    [req.user.id, targetId]
  );
  if (blocked.rowCount) return res.status(403).json({ error: 'Interação não permitida.' });

  const today = new Date().toISOString().slice(0, 10);
  const sameDay = req.user.likes_date && new Date(req.user.likes_date).toISOString().slice(0, 10) === today;
  const used = sameDay ? req.user.likes_today : 0;
  const limit = req.user.vip ? VIP_LIKES : FREE_LIKES;
  if (used >= limit) {
    return res.status(429).json({
      error: `Você usou suas ${limit} curtidas de hoje. Volte amanhã ou ative o VIP para ${VIP_LIKES} por dia.`,
    });
  }

  await pool.query('UPDATE users SET likes_today = $1, likes_date = $2 WHERE id = $3', [
    used + 1,
    today,
    req.user.id,
  ]);
  await pool.query(
    'INSERT INTO likes (from_user, to_user) VALUES ($1,$2) ON CONFLICT (from_user,to_user) DO NOTHING',
    [req.user.id, targetId]
  );

  const back = await pool.query('SELECT 1 FROM likes WHERE from_user = $1 AND to_user = $2', [
    targetId,
    req.user.id,
  ]);
  const mutual = back.rowCount > 0 || target.demo_likes_back;

  if (!mutual) {
    if (!target.demo) {
      await notify(targetId, 'nova_curtida', 'Alguém sussurrou por você', `${req.user.name} curtiu seu perfil.`, {
        userId: req.user.id,
      });
    }
    return res.json({ match: false, likesLeft: limit - used - 1 });
  }

  if (target.demo_likes_back && back.rowCount === 0) {
    await pool.query(
      'INSERT INTO likes (from_user, to_user) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [targetId, req.user.id]
    );
  }

  const a = req.user.id < targetId ? req.user.id : targetId;
  const b = req.user.id < targetId ? targetId : req.user.id;
  const created = await pool.query(
    `INSERT INTO matches (user_a, user_b) VALUES ($1,$2)
     ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = matches.user_a
     RETURNING *`,
    [a, b]
  );
  const matchId = created.rows[0].id;

  await notify(req.user.id, 'match', 'É um match!', `Você e ${target.name} se curtiram.`, { matchId });
  if (!target.demo) {
    await notify(targetId, 'match', 'É um match!', `Você e ${req.user.name} se curtiram.`, { matchId });
  }

  res.json({ match: true, matchId, likesLeft: limit - used - 1 });
});

router.get('/likes/received', async (req, res) => {
  const unlocked = await pool.query(
    `SELECT 1 FROM sticker_unlocks WHERE user_id = $1 AND pack IN ('plus','vip')`,
    [req.user.id]
  );
  if (!req.user.vip && !unlocked.rowCount) {
    return res.status(402).json({
      error: 'Ver quem curtiu você faz parte do Pacote Plus e da Área VIP.',
      code: 'beneficio_plus',
    });
  }
  const { rows } = await pool.query(
    `SELECT u.* FROM likes l JOIN users u ON u.id = l.from_user
     WHERE l.to_user = $1 AND u.status = 'active'
     ORDER BY l.created_at DESC LIMIT 50`,
    [req.user.id]
  );
  res.json({ people: await withPhotos(rows) });
});

router.get('/matches', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT m.id AS match_id, m.created_at AS matched_at, u.*,
       (SELECT json_build_object('text', text, 'sticker', sticker_id, 'created_at', created_at, 'sender_id', sender_id)
        FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) AS last_message
     FROM matches m
     JOIN users u ON u.id = CASE WHEN m.user_a = $1 THEN m.user_b ELSE m.user_a END
     WHERE m.user_a = $1 OR m.user_b = $1
     ORDER BY m.created_at DESC`,
    [req.user.id]
  );
  const people = await withPhotos(rows);
  const matches = rows.map((r, i) => ({
    id: r.match_id,
    matchedAt: r.matched_at,
    lastMessage: r.last_message,
    user: people[i],
  }));
  res.json({ matches });
});

router.get('/invites', async (req, res) => {
  const incoming = await pool.query(
    `SELECT i.*, u.name AS from_name FROM invites i JOIN users u ON u.id = i.from_user
     WHERE i.to_user = $1 ORDER BY i.created_at DESC LIMIT 50`,
    [req.user.id]
  );
  const outgoing = await pool.query(
    `SELECT i.*, u.name AS to_name FROM invites i JOIN users u ON u.id = i.to_user
     WHERE i.from_user = $1 ORDER BY i.created_at DESC LIMIT 50`,
    [req.user.id]
  );
  const ids = incoming.rows.map((r) => r.from_user);
  const users = ids.length
    ? (await pool.query('SELECT * FROM users WHERE id = ANY($1::uuid[])', [ids])).rows
    : [];
  const pics = await withPhotos(users);
  const byId = Object.fromEntries(pics.map((p) => [p.id, p]));
  res.json({
    incoming: incoming.rows.map((r) => ({ ...r, from: byId[r.from_user] || null })),
    outgoing: outgoing.rows,
  });
});

router.post('/invites', async (req, res) => {
  const toUserId = String(req.body.toUserId || '');
  const message = String(req.body.message || '').slice(0, 200);
  if (!toUserId) return res.status(400).json({ error: 'Escolha alguém para convidar.' });
  if (toUserId === req.user.id) return res.status(400).json({ error: 'Convite inválido.' });

  const target = await pool.query(`SELECT * FROM users WHERE id = $1 AND role = 'user'`, [toUserId]);
  if (!target.rows[0]) return res.status(404).json({ error: 'Perfil não encontrado.' });

  const exists = await pool.query(
    `SELECT 1 FROM invites WHERE from_user = $1 AND to_user = $2 AND status = 'pending'`,
    [req.user.id, toUserId]
  );
  if (exists.rowCount) return res.status(409).json({ error: 'Você já enviou um convite para esta pessoa.' });

  const { rows } = await pool.query(
    `INSERT INTO invites (from_user, to_user, message) VALUES ($1,$2,$3) RETURNING *`,
    [req.user.id, toUserId, message]
  );
  if (!target.rows[0].demo) {
    await notify(toUserId, 'convite', 'Novo convite', `${req.user.name} enviou um convite para você.`, {
      inviteId: rows[0].id,
    });
  }
  res.status(201).json({ invite: rows[0] });
});

router.patch('/invites/:id', async (req, res) => {
  const action = req.body.action;
  if (!['accept', 'decline'].includes(action)) return res.status(400).json({ error: 'Ação inválida.' });

  const { rows } = await pool.query(`SELECT * FROM invites WHERE id = $1 AND to_user = $2`, [
    req.params.id,
    req.user.id,
  ]);
  const invite = rows[0];
  if (!invite) return res.status(404).json({ error: 'Convite não encontrado.' });
  if (invite.status !== 'pending') return res.status(409).json({ error: 'Convite já respondido.' });

  await pool.query('UPDATE invites SET status = $1 WHERE id = $2', [
    action === 'accept' ? 'accepted' : 'declined',
    invite.id,
  ]);

  if (action === 'accept') {
    const a = req.user.id < invite.from_user ? req.user.id : invite.from_user;
    const b = req.user.id < invite.from_user ? invite.from_user : req.user.id;
    await pool.query(
      `INSERT INTO matches (user_a, user_b) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [a, b]
    );
    await notify(invite.from_user, 'convite', 'Convite aceito', `${req.user.name} aceitou seu convite.`);
  }
  res.json({ ok: true });
});

router.post('/block/:userId', async (req, res) => {
  await pool.query(
    'INSERT INTO blocks (user_id, blocked_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [req.user.id, req.params.userId]
  );
  res.json({ ok: true });
});

router.delete('/block/:userId', async (req, res) => {
  await pool.query('DELETE FROM blocks WHERE user_id = $1 AND blocked_user_id = $2', [
    req.user.id,
    req.params.userId,
  ]);
  res.json({ ok: true });
});

router.post('/reports', async (req, res) => {
  const targetUserId = String(req.body.targetUserId || '');
  const reason = String(req.body.reason || '').trim();
  const details = String(req.body.details || '').slice(0, 800);
  if (!targetUserId || !reason) return res.status(400).json({ error: 'Informe o motivo da denúncia.' });

  await pool.query(
    `INSERT INTO reports (reporter_id, target_user_id, reason, details) VALUES ($1,$2,$3,$4)`,
    [req.user.id, targetUserId, reason.slice(0, 120), details]
  );
  await pool.query(
    `INSERT INTO admin_alerts (kind, user_id, message) VALUES ('denuncia',$1,$2)`,
    [targetUserId, `Nova denúncia: ${reason}`]
  );
  res.status(201).json({ ok: true });
});

module.exports = { router, notify };
