const express = require('express');
const { pool } = require('../db');
const { requireUser } = require('../auth');
const { uploadPublic, publicUrl } = require('../lib/upload');

const safeRouter = require('../lib/safeRouter');
const router = safeRouter();
router.use(requireUser);

const PACK_LABELS = {
  free: 'Corações',
  plus: 'Beijos exclusivos',
  vip: 'Paixão premium',
  meus: 'Minhas figurinhas',
};

router.get('/stickers', async (req, res) => {
  const unlocks = await pool.query('SELECT pack FROM sticker_unlocks WHERE user_id = $1', [req.user.id]);
  const unlocked = new Set(['free', ...unlocks.rows.map((r) => r.pack)]);
  if (req.user.vip) {
    unlocked.add('plus');
    unlocked.add('vip');
  }

  const { rows } = await pool.query(
    `SELECT * FROM stickers WHERE owner_id IS NULL OR owner_id = $1 ORDER BY pack, created_at`,
    [req.user.id]
  );

  const packs = Object.entries(PACK_LABELS).map(([id, name]) => ({
    id,
    name,
    unlocked: id === 'meus' ? true : unlocked.has(id),
    stickers: rows
      .filter((s) => (id === 'meus' ? s.owner_id === req.user.id : s.owner_id === null && s.pack === id))
      .map((s) => ({
        id: s.id,
        emoji: s.emoji,
        label: s.label,
        imageUrl: s.image_url,
        textOverlay: s.text_overlay,
        emojiOverlay: s.emoji_overlay,
        pack: s.pack,
        mine: Boolean(s.owner_id),
      })),
  }));

  res.json({ packs });
});

router.post('/stickers', uploadPublic.single('photo'), async (req, res) => {
  const text = String(req.body.text || '').slice(0, 24);
  const emoji = String(req.body.emoji || '').slice(0, 8);
  if (!req.file && !emoji) return res.status(400).json({ error: 'Envie uma foto ou escolha um emoji.' });

  const { rows } = await pool.query(
    `INSERT INTO stickers (owner_id, pack, emoji, label, image_url, text_overlay, emoji_overlay)
     VALUES ($1,'meus',$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, emoji, text || 'Minha figurinha', publicUrl(req.file), text || null, emoji || null]
  );
  res.status(201).json({ sticker: rows[0] });
});

router.delete('/stickers/:id', async (req, res) => {
  await pool.query('DELETE FROM stickers WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
