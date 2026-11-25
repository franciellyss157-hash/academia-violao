const express = require('express');
const path = require('path');
const { pool } = require('../db');
const { requireUser } = require('../auth');
const { filePath } = require('../lib/upload');

const safeRouter = require('../lib/safeRouter');
const router = safeRouter();

router.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

router.get('/inspiration', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM inspiration ORDER BY kind, id');
  res.json({
    phrases: rows.filter((r) => r.kind === 'frase').map((r) => ({ id: r.id, text: r.text })),
    openers: rows.filter((r) => r.kind === 'abertura').map((r) => ({ id: r.id, text: r.text })),
  });
});

router.get('/files/public/:name', requireUser, (req, res) => {
  res.sendFile(filePath('public', req.params.name));
});

router.get('/files/private/:name', requireUser, async (req, res) => {
  const name = path.basename(req.params.name);
  if (req.user.role === 'admin') return res.sendFile(filePath('private', name));

  const url = `/api/files/private/${name}`;
  const { rowCount } = await pool.query(
    `SELECT 1 FROM orders WHERE user_id = $1 AND receipt_url = $2
     UNION SELECT 1 FROM users WHERE id = $1 AND selfie_url = $2`,
    [req.user.id, url]
  );
  if (!rowCount) return res.status(403).json({ error: 'Arquivo privado.' });
  res.sendFile(filePath('private', name));
});

router.get('/appointments', requireUser, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.*, u.name AS partner_name, u.id AS partner_id
     FROM appointments a
     LEFT JOIN matches m ON m.id = a.match_id
     LEFT JOIN users u ON u.id = CASE
        WHEN m.user_a = $1 THEN m.user_b
        WHEN m.user_b = $1 THEN m.user_a
        ELSE NULL END
     WHERE a.user_id = $1
     ORDER BY a.starts_at ASC`,
    [req.user.id]
  );
  res.json({ appointments: rows });
});

router.post('/appointments', requireUser, async (req, res) => {
  const title = String(req.body.title || '').trim();
  const startsAt = String(req.body.startsAt || '');
  if (!title) return res.status(400).json({ error: 'Dê um nome ao encontro.' });
  const date = new Date(startsAt);
  if (!startsAt || Number.isNaN(date.getTime()))
    return res.status(400).json({ error: 'Informe a data e hora do encontro.' });

  const matchId = req.body.matchId || null;
  if (matchId) {
    const ok = await pool.query(
      'SELECT 1 FROM matches WHERE id = $1 AND (user_a = $2 OR user_b = $2)',
      [matchId, req.user.id]
    );
    if (!ok.rowCount) return res.status(403).json({ error: 'Match inválido.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO appointments (user_id, match_id, title, place, notes, starts_at)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, matchId, title, String(req.body.place || '').slice(0, 120), String(req.body.notes || '').slice(0, 300), date.toISOString()]
  );

  if (matchId) {
    const m = await pool.query('SELECT * FROM matches WHERE id = $1', [matchId]);
    const otherId = m.rows[0].user_a === req.user.id ? m.rows[0].user_b : m.rows[0].user_a;
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1,'encontro','Encontro agendado',$2,$3)`,
      [otherId, `${req.user.name} marcou: ${title}`, JSON.stringify({ appointmentId: rows[0].id })]
    );
  }

  res.status(201).json({ appointment: rows[0] });
});

router.patch('/appointments/:id', requireUser, async (req, res) => {
  const status = ['confirmed', 'done', 'canceled'].includes(req.body.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ error: 'Status inválido.' });
  const { rows } = await pool.query(
    'UPDATE appointments SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [status, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Encontro não encontrado.' });
  res.json({ appointment: rows[0] });
});

router.delete('/appointments/:id', requireUser, async (req, res) => {
  await pool.query('DELETE FROM appointments WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.user.id,
  ]);
  res.json({ ok: true });
});

module.exports = router;
