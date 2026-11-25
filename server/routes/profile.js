const express = require('express');
const { pool } = require('../db');
const { requireUser, withPhotos, userPublic } = require('../auth');
const { uploadPublic, uploadPrivate, publicUrl, privateUrl } = require('../lib/upload');

const safeRouter = require('../lib/safeRouter');
const router = safeRouter();
router.use(requireUser);

const INTENTS = ['amizade', 'namoro', 'relacionamento_serio', 'algo_casual'];
const VISIBILITY = ['public', 'hidden'];

router.get('/profile', async (req, res) => {
  const [full] = await withPhotos([req.user]);
  res.json({ user: full });
});

router.put('/profile', async (req, res) => {
  const fields = [];
  const values = [];
  const set = (col, val) => {
    values.push(val);
    fields.push(`${col} = $${values.length}`);
  };

  if (typeof req.body.name === 'string' && req.body.name.trim().length >= 2)
    set('name', req.body.name.trim());
  if (typeof req.body.bio === 'string') set('bio', req.body.bio.slice(0, 400));
  if (typeof req.body.city === 'string') set('city', req.body.city.slice(0, 80));
  if (Array.isArray(req.body.interests))
    set('interests', req.body.interests.slice(0, 12).map((i) => String(i).slice(0, 30)));
  if (INTENTS.includes(req.body.intent)) set('intent', req.body.intent);
  if (VISIBILITY.includes(req.body.visibility)) set('visibility', req.body.visibility);

  if (!fields.length) return res.status(400).json({ error: 'Nada para atualizar.' });
  values.push(req.user.id);
  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  const [full] = await withPhotos([rows[0]]);
  res.json({ user: full });
});

router.post('/profile/photo', uploadPublic.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Envie uma imagem.' });
  const { rows } = await pool.query(
    `INSERT INTO photos (user_id, url, position)
     VALUES ($1,$2,(SELECT COALESCE(max(position),-1)+1 FROM photos WHERE user_id=$1)) RETURNING *`,
    [req.user.id, publicUrl(req.file)]
  );
  res.status(201).json({ photo: rows[0] });
});

router.delete('/profile/photo/:id', async (req, res) => {
  await pool.query('DELETE FROM photos WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

router.post('/verify/selfie', uploadPrivate.single('selfie'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Envie uma selfie.' });
  await pool.query(
    `UPDATE users SET selfie_url = $1, verification_status = 'pending', verified = false WHERE id = $2`,
    [privateUrl(req.file), req.user.id]
  );
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, body)
     VALUES ($1,'verificacao','Selfie enviada','Nossa equipe vai analisar sua verificação de identidade.')`,
    [req.user.id]
  );
  res.json({ verificationStatus: 'pending' });
});

router.get('/discover', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.* FROM users u
     WHERE u.id <> $1
       AND u.role = 'user'
       AND u.status = 'active'
       AND u.visibility = 'public'
       AND NOT EXISTS (SELECT 1 FROM likes l WHERE l.from_user = $1 AND l.to_user = u.id)
       AND NOT EXISTS (
         SELECT 1 FROM blocks b
         WHERE (b.user_id = $1 AND b.blocked_user_id = u.id)
            OR (b.user_id = u.id AND b.blocked_user_id = $1)
       )
     ORDER BY (u.highlight_until IS NOT NULL AND u.highlight_until > now()) DESC,
              u.vip DESC, random()
     LIMIT 30`,
    [req.user.id]
  );
  res.json({ people: await withPhotos(rows) });
});

router.get('/users/:id', async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1 AND role = 'user'`, [
    req.params.id,
  ]);
  const target = rows[0];
  if (!target) return res.status(404).json({ error: 'Perfil não encontrado.' });

  if (target.visibility === 'hidden' && target.id !== req.user.id) {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM matches WHERE (user_a=$1 AND user_b=$2) OR (user_a=$2 AND user_b=$1)`,
      [req.user.id, target.id]
    );
    if (!rowCount) return res.status(403).json({ error: 'Este perfil está oculto.' });
  }

  const [full] = await withPhotos([target]);
  res.json({ user: full });
});

module.exports = router;
