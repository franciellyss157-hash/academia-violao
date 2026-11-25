const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { sign, userPublic, withPhotos, adminLogin, ageFrom, requireUser } = require('../auth');

const safeRouter = require('../lib/safeRouter');
const router = safeRouter();

const loginHits = new Map();
function throttled(key) {
  const now = Date.now();
  const hits = (loginHits.get(key) || []).filter((t) => now - t < 10 * 60 * 1000);
  loginHits.set(key, hits);
  return hits.length >= 10;
}
function registerHit(key) {
  const hits = loginHits.get(key) || [];
  hits.push(Date.now());
  loginHits.set(key, hits);
}

router.post('/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const birthdate = String(req.body.birthdate || '');
  const acceptedTerms = req.body.acceptedTerms === true;

  if (name.length < 2) return res.status(400).json({ error: 'Informe seu nome completo.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return res.status(400).json({ error: 'E-mail inválido.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
  if (!acceptedTerms)
    return res.status(400).json({ error: 'É necessário aceitar os termos e a política de privacidade.' });

  const birth = new Date(birthdate);
  if (!birthdate || Number.isNaN(birth.getTime()))
    return res.status(400).json({ error: 'Informe uma data de nascimento válida.' });
  const age = ageFrom(birth);
  if (age === null || age < 18)
    return res.status(400).json({ error: 'O Sussurro é exclusivo para maiores de 18 anos.' });

  const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (exists.rowCount) return res.status(409).json({ error: 'Este e-mail já possui conta.' });

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, birthdate)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, email, bcrypt.hashSync(password, 10), birthdate]
  );
  const user = rows[0];
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, body)
     VALUES ($1,'boas_vindas','Bem-vindo(a) ao Sussurro','Você recebeu 5 créditos de conversa de boas-vindas.')`,
    [user.id]
  );

  res.status(201).json({ token: sign({ sub: user.id, role: 'user' }), user: userPublic(user, []) });
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (throttled(`user:${email}`))
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    registerHit(`user:${email}`);
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }
  if (user.status === 'banned') return res.status(403).json({ error: 'Sua conta foi banida.' });
  if (user.status === 'suspended')
    return res.status(403).json({ error: 'Sua conta está suspensa para análise.' });

  const [full] = await withPhotos([user]);
  res.json({ token: sign({ sub: user.id, role: 'user' }), user: full });
});

router.post('/admin/login', adminLogin);

router.get('/me', requireUser, async (req, res) => {
  if (req.user.role === 'admin') {
    return res.json({ user: { id: 'admin', name: 'ADM Sussurro', email: req.user.email, role: 'admin' } });
  }
  const [full] = await withPhotos([req.user]);
  res.json({ user: full });
});

module.exports = router;
