const express = require('express');
const { pool } = require('../db');
const { requireUser, withPhotos } = require('../auth');

const safeRouter = require('../lib/safeRouter');
const router = safeRouter();
router.use(requireUser);

async function membership(matchId, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM matches WHERE id = $1 AND (user_a = $2 OR user_b = $2)`,
    [matchId, userId]
  );
  return rows[0] || null;
}

router.get('/chats/:matchId', async (req, res) => {
  const match = await membership(req.params.matchId, req.user.id);
  if (!match) return res.status(404).json({ error: 'Conversa não encontrada.' });
  const otherId = match.user_a === req.user.id ? match.user_b : match.user_a;
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [otherId]);
  const [other] = await withPhotos(rows);

  const messages = await pool.query(
    `SELECT m.*, s.emoji, s.image_url, s.text_overlay, s.emoji_overlay, s.pack
     FROM messages m LEFT JOIN stickers s ON s.id = m.sticker_id
     WHERE m.match_id = $1 ORDER BY m.created_at ASC LIMIT 300`,
    [match.id]
  );

  res.json({
    match: { id: match.id, other, credits: req.user.credits },
    messages: messages.rows,
  });
});

router.post('/chats/:matchId/messages', async (req, res) => {
  const match = await membership(req.params.matchId, req.user.id);
  if (!match) return res.status(404).json({ error: 'Conversa não encontrada.' });

  const text = String(req.body.text || '').trim().slice(0, 1000);
  const stickerId = req.body.stickerId || null;
  if (!text && !stickerId) return res.status(400).json({ error: 'Escreva uma mensagem.' });

  if (req.user.credits <= 0) {
    return res.status(402).json({
      error: 'Seus créditos de conversa acabaram. Adquira um pacote para continuar sussurrando.',
      code: 'sem_creditos',
    });
  }

  const updated = await pool.query(
    'UPDATE users SET credits = credits - 1 WHERE id = $1 AND credits > 0 RETURNING credits',
    [req.user.id]
  );
  if (!updated.rowCount) {
    return res.status(402).json({ error: 'Seus créditos de conversa acabaram.', code: 'sem_creditos' });
  }

  if (stickerId) {
    const sticker = await pool.query('SELECT * FROM stickers WHERE id = $1', [stickerId]);
    if (!sticker.rows[0]) return res.status(404).json({ error: 'Figurinha não encontrada.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO messages (match_id, sender_id, text, sticker_id) VALUES ($1,$2,$3,$4) RETURNING *`,
    [match.id, req.user.id, text || null, stickerId]
  );

  const otherId = match.user_a === req.user.id ? match.user_b : match.user_a;
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, body, data)
     VALUES ($1,'mensagem','Nova mensagem',$2,$3)`,
    [otherId, `${req.user.name}: ${text ? text.slice(0, 80) : 'enviou uma figurinha'}`, JSON.stringify({ matchId: match.id })]
  );

  res.status(201).json({ message: rows[0], credits: updated.rows[0].credits });
});

router.get('/notifications', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 60`,
    [req.user.id]
  );
  const unread = rows.filter((r) => !r.read).length;
  res.json({ notifications: rows, unread });
});

router.post('/notifications/read', async (req, res) => {
  if (req.body.id) {
    await pool.query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [
      req.body.id,
      req.user.id,
    ]);
  } else {
    await pool.query('UPDATE notifications SET read = true WHERE user_id = $1', [req.user.id]);
  }
  res.json({ ok: true });
});

module.exports = router;
