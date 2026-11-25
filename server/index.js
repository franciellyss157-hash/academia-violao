const express = require('express');
const cors = require('cors');
const { init } = require('./db');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

const allowedOrigins = new Set(
  String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);
if (process.env.BASE44_PUBLIC_HOST_SUFFIX) {
  allowedOrigins.add(`https://3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`);
  allowedOrigins.add(`https://4000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`);
}
allowedOrigins.add('http://localhost:3000');
allowedOrigins.add('http://localhost:8081');
allowedOrigins.add('http://localhost:4000');

const sandboxDomain = process.env.BASE44_SANDBOX_HOST_DOMAIN;

function originAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    if (sandboxDomain && (host === sandboxDomain || host.endsWith(`.${sandboxDomain}`))) return true;
    if (/^(3000|4000)-[a-z0-9-]+\./i.test(host)) return true;
  } catch {
    return false;
  }
  return false;
}

app.use(
  cors({
    origin: (origin, cb) => cb(null, originAllowed(origin)),
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.use('/api', require('./routes/misc'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/profile'));
app.use('/api', require('./routes/social').router);
app.use('/api', require('./routes/chat'));
app.use('/api', require('./routes/stickers'));
app.use('/api', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));

app.use((err, _req, res, _next) => {
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ error: `Falha no upload: ${err.message}` });
  }
  if (err && /imagem/i.test(err.message || '')) {
    return res.status(400).json({ error: err.message });
  }
  console.error('[api]', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

const PORT = Number(process.env.PORT || 4000);

init()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => console.log(`[api] Sussurro API em http://0.0.0.0:${PORT}`));
  })
  .catch((err) => {
    console.error('[api] falha ao iniciar', err);
    process.exit(1);
  });
