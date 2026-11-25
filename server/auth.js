const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'sussurro-dev-secret-change-me';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'francielly.ss157@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  (ADMIN_PASSWORD ? bcrypt.hashSync(ADMIN_PASSWORD, 10) : null);

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

function sign(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

function ageFrom(birthdate) {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age;
}

function userPublic(u, photos) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    bio: u.bio,
    city: u.city,
    interests: u.interests || [],
    intent: u.intent,
    visibility: u.visibility,
    credits: u.credits,
    vip: u.vip,
    verified: u.verified,
    verificationStatus: u.verification_status,
    selfieUrl: u.selfie_url || null,
    status: u.status,
    flagged: u.flagged,
    highlightUntil: u.highlight_until,
    role: u.role,
    createdAt: u.created_at,
    birthdate: u.birthdate,
    age: ageFrom(u.birthdate),
    photos: photos || [],
  };
}

async function withPhotos(rows) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const { rows: pics } = await pool.query(
    'SELECT user_id, url FROM photos WHERE user_id = ANY($1::uuid[]) ORDER BY position',
    [ids]
  );
  const map = {};
  for (const p of pics) (map[p.user_id] = map[p.user_id] || []).push(p.url);
  return rows.map((r) => userPublic(r, map[r.id] || []));
}

async function requireUser(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : typeof req.query.token === 'string'
      ? req.query.token
      : null;
  if (!token) return res.status(401).json({ error: 'Não autenticado' });
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
  }
  if (payload.role === 'admin') {
    req.user = { id: 'admin', role: 'admin', email: payload.email, name: 'ADM Sussurro' };
    return next();
  }
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [payload.sub]);
  if (!rows[0]) return res.status(401).json({ error: 'Sessão inválida' });
  if (rows[0].status === 'banned') return res.status(403).json({ error: 'Sua conta foi banida.' });
  if (rows[0].status === 'suspended')
    return res.status(403).json({ error: 'Sua conta está suspensa para análise.' });
  req.user = rows[0];
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito ao ADM' });
  next();
}

async function adminAttemptsInWindow() {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM admin_attempts
     WHERE email = $1 AND success = false AND created_at > now() - ($2 || ' minutes')::interval`,
    [ADMIN_EMAIL, WINDOW_MINUTES]
  );
  return rows[0].n;
}

async function adminLogin(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!ADMIN_HASH) {
    return res
      .status(503)
      .json({ error: 'ADMIN_PASSWORD não configurado no servidor. Configure a variável de ambiente.' });
  }

  const failures = await adminAttemptsInWindow();
  if (failures >= MAX_ATTEMPTS) {
    const { rows } = await pool.query(
      `SELECT ceil(extract(epoch from (min(created_at) + ($2 || ' minutes')::interval - now())))::int AS secs
       FROM admin_attempts WHERE email = $1 AND success = false
       AND created_at > now() - ($2 || ' minutes')::interval`,
      [ADMIN_EMAIL, WINDOW_MINUTES]
    );
    const secs = Math.max(rows[0]?.secs || 60, 30);
    return res.status(423).json({
      error: `Muitas tentativas. Tente novamente em ${Math.ceil(secs / 60)} min.`,
      retryAfterSeconds: secs,
    });
  }

  const emailOk = email === ADMIN_EMAIL;
  const passOk = bcrypt.compareSync(password, ADMIN_HASH);
  await pool.query('INSERT INTO admin_attempts (email, success) VALUES ($1,$2)', [
    email || '(vazio)',
    emailOk && passOk,
  ]);

  if (!emailOk || !passOk) {
    const left = MAX_ATTEMPTS - failures - 1;
    return res.status(401).json({
      error:
        left > 0
          ? `Credenciais do ADM inválidas. ${left} tentativa(s) restante(s).`
          : 'Acesso bloqueado por 15 minutos.',
      attemptsLeft: Math.max(left, 0),
    });
  }

  return res.json({
    token: sign({ sub: 'admin', role: 'admin', email: ADMIN_EMAIL }),
    user: { id: 'admin', name: 'ADM Sussurro', email: ADMIN_EMAIL, role: 'admin' },
  });
}

module.exports = {
  JWT_SECRET,
  ADMIN_EMAIL,
  ADMIN_HASH,
  sign,
  ageFrom,
  userPublic,
  withPhotos,
  requireUser,
  requireAdmin,
  adminLogin,
};
