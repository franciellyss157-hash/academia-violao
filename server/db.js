const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  birthdate date NOT NULL,
  terms_accepted_at timestamptz NOT NULL DEFAULT now(),
  role text NOT NULL DEFAULT 'user',
  bio text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  interests text[] NOT NULL DEFAULT '{}',
  intent text NOT NULL DEFAULT 'namoro',
  visibility text NOT NULL DEFAULT 'public',
  credits integer NOT NULL DEFAULT 5,
  vip boolean NOT NULL DEFAULT false,
  highlight_until timestamptz,
  verified boolean NOT NULL DEFAULT false,
  verification_status text NOT NULL DEFAULT 'none',
  selfie_url text,
  status text NOT NULL DEFAULT 'active',
  flagged boolean NOT NULL DEFAULT false,
  consecutive_rejections integer NOT NULL DEFAULT 0,
  likes_date date,
  likes_today integer NOT NULL DEFAULT 0,
  demo boolean NOT NULL DEFAULT false,
  demo_likes_back boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photos_user_idx ON photos(user_id);

CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_user, to_user)
);
CREATE INDEX IF NOT EXISTS likes_to_idx ON likes(to_user);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text text,
  sticker_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_match_idx ON messages(match_id, created_at);

CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  pack text NOT NULL DEFAULT 'free',
  emoji text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  image_url text,
  text_overlay text,
  emoji_overlay text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sticker_unlocks (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pack text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, pack)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  credits integer NOT NULL DEFAULT 0,
  benefit text NOT NULL DEFAULT '',
  perks jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id text NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'awaiting_receipt',
  receipt_url text,
  receipt_hash text,
  amount_paid numeric(10,2),
  payer_name text,
  reject_reason text,
  flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_hash_idx ON orders(receipt_hash);

CREATE TABLE IF NOT EXISTS receipt_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hash text NOT NULL,
  amount_paid numeric(10,2),
  payer_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS receipt_hash_idx ON receipt_submissions(hash);
CREATE INDEX IF NOT EXISTS receipt_user_idx ON receipt_submissions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  title text NOT NULL,
  place text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS appointments_user_idx ON appointments(user_id, starts_at);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, blocked_user_id)
);

CREATE TABLE IF NOT EXISTS admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  order_id uuid,
  user_id uuid,
  message text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  success boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inspiration (
  id text PRIMARY KEY,
  kind text NOT NULL,
  text text NOT NULL
);
`;

const PACKAGES = [
  {
    id: 'basic',
    name: 'Pacote Básico',
    price: '0.99',
    credits: 20,
    benefit: '20 créditos de conversa + Destaque de perfil por 24h',
    perks: { highlight: true },
    sort: 1,
  },
  {
    id: 'plus',
    name: 'Pacote Plus',
    price: '1.99',
    credits: 50,
    benefit: '50 créditos de conversa + figurinhas exclusivas',
    perks: { stickerPack: 'plus', seeLikes: true },
    sort: 2,
  },
  {
    id: 'vip',
    name: 'Área VIP',
    price: '9.99',
    credits: 120,
    benefit: 'Selo VIP, perfil em destaque, mais curtidas por dia e figurinhas premium',
    perks: { vip: true, highlight: true, stickerPack: 'vip', seeLikes: true },
    sort: 3,
  },
];

const STICKERS = [
  ['free', '❤️', 'Amor'], ['free', '💖', 'Coração brilhante'], ['free', '💘', 'Flecha'],
  ['free', '💝', 'Presente'], ['free', '💞', 'Laço'], ['free', '🩷', 'Querido'],
  ['plus', '😘', 'Beijo voando'], ['plus', '💋', 'Beijo'], ['plus', '😽', 'Beijinho'],
  ['plus', '😚', 'Ciúme'], ['plus', '💐', 'Buquê'], ['plus', '🌷', 'Tulipa'],
  ['vip', '🥰', 'Apaixonado'], ['vip', '😍', 'Olhar de amor'], ['vip', '🌹', 'Rosa'],
  ['vip', '🫦', 'Sedução'], ['vip', '✨', 'Brilho'], ['vip', '🔥', 'Desejo'],
];

const INSPIRATION = [
  ['f1', 'frase', 'O amor não se explica, se sussurra.'],
  ['f2', 'frase', 'Existe um silêncio que só duas pessoas apaixonadas escutam.'],
  ['f3', 'frase', 'Quem te faz sentir em casa nunca foi um estranho.'],
  ['f4', 'frase', 'Deixe o coração falar baixinho — ele raramente erra.'],
  ['f5', 'frase', 'Todo encontro começa com uma coragem pequena.'],
  ['f6', 'frase', 'Há belezas que só aparecem quando alguém presta atenção.'],
  ['f7', 'frase', 'Sussurre. O que é verdadeiro não precisa de barulho.'],
  ['f8', 'frase', 'Amar é escolher a mesma pessoa todos os dias.'],
  ['a1', 'abertura', 'Seu perfil me deixou curioso: qual foi a última coisa que te fez sorrir sozinho(a)?'],
  ['a2', 'abertura', 'Sinceridade total: qual música você colocaria para nós dois?'],
  ['a3', 'abertura', 'Eu apostaria que você tem uma história boa sobre a sua foto favorita.'],
  ['a4', 'abertura', 'Café da manhã ou jantar à luz de velas? Escolha com cuidado.'],
  ['a5', 'abertura', 'Qual foi o último lugar que te fez pensar “preciso voltar aqui com alguém”?'],
  ['a6', 'abertura', 'Três coisas que te conquistam em cinco minutos — pode listar?'],
  ['a7', 'abertura', 'Você parece do tipo que dança na cozinha. Acertei?'],
  ['a8', 'abertura', 'Se hoje fosse um capítulo de livro, qual seria o título?'],
];

const DEMO_USERS = [
  ['00000000-0000-4000-8000-000000000001', 'Helena Duarte', 27, 'Salvador, BA', 'Fotografia, vinho e viagens longas. Acredito em conversas que duram até o sol nascer.', ['Fotografia', 'Vinho', 'Viagens', 'Música'], 'relacionamento_serio', true],
  ['00000000-0000-4000-8000-000000000002', 'Rafael Nogueira', 31, 'São Paulo, SP', 'Chef nas horas vagas, corredor por teimosia. Procuro alguém para dividir a sobremesa.', ['Gastronomia', 'Corrida', 'Cinema'], 'namoro', true],
  ['00000000-0000-4000-8000-000000000003', 'Isabela Reis', 24, 'Rio de Janeiro, RJ', 'Arquiteta, apaixonada por jazz e por finais de semana sem pressa.', ['Jazz', 'Arquitetura', 'Praia', 'Dança'], 'algo_casual', false],
  ['00000000-0000-4000-8000-000000000004', 'Lucas Prado', 29, 'Belo Horizonte, MG', 'Designer, plantador de suculentas. Bom ouvinte e péssimo dançarino.', ['Design', 'Plantas', 'Séries', 'Café'], 'namoro', true],
  ['00000000-0000-4000-8000-000000000005', 'Camila Torres', 33, 'Curitiba, PR', 'Médica veterinária. Vivo com dois gatos e um bom livro. Busco amizade sincera.', ['Animais', 'Livros', 'Trilhas'], 'amizade', false],
  ['00000000-0000-4000-8000-000000000006', 'Beatriz Lima', 26, 'Recife, PE', 'Publicitária, apaixonada por forró e por gente que ri alto.', ['Forró', 'Publicidade', 'Praia', 'Petiscos'], 'relacionamento_serio', true],
];

const DEMO_PHOTOS = {
  '00000000-0000-4000-8000-000000000001': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&h=900&q=80',
  '00000000-0000-4000-8000-000000000002': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&h=900&q=80',
  '00000000-0000-4000-8000-000000000003': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&h=900&q=80',
  '00000000-0000-4000-8000-000000000004': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&h=900&q=80',
  '00000000-0000-4000-8000-000000000005': 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&h=900&q=80',
  '00000000-0000-4000-8000-000000000006': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&h=900&q=80',
};

async function seed() {
  for (const p of PACKAGES) {
    await pool.query(
      `INSERT INTO packages (id, name, price, credits, benefit, perks, sort)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.name, p.price, p.credits, p.benefit, JSON.stringify(p.perks), p.sort]
    );
  }

  for (const [pack, emoji, label] of STICKERS) {
    await pool.query(
      `INSERT INTO stickers (pack, emoji, label)
       SELECT $1,$2,$3 WHERE NOT EXISTS (
         SELECT 1 FROM stickers WHERE owner_id IS NULL AND pack=$1 AND emoji=$2
       )`,
      [pack, emoji, label]
    );
  }

  for (const [id, kind, text] of INSPIRATION) {
    await pool.query(
      `INSERT INTO inspiration (id, kind, text) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING`,
      [id, kind, text]
    );
  }

  const demoHash = bcrypt.hashSync('demo-sussurro-2026', 8);
  for (const [id, name, age, city, bio, interests, intent, likesBack] of DEMO_USERS) {
    const birth = new Date();
    birth.setFullYear(birth.getFullYear() - age);
    const email = `${name.split(' ')[0].toLowerCase()}@demo.sussurro`;
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, birthdate, bio, city, interests, intent, demo, demo_likes_back, verified, verification_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,true,'approved')
       ON CONFLICT (id) DO NOTHING`,
      [id, name, email, demoHash, birth.toISOString().slice(0, 10), bio, city, interests, intent, likesBack]
    );
    const photo = DEMO_PHOTOS[id];
    if (photo) {
      await pool.query(
        `INSERT INTO photos (user_id, url, position)
         SELECT $1,$2,0 WHERE NOT EXISTS (SELECT 1 FROM photos WHERE user_id=$1)`,
        [id, photo]
      );
    }
  }
}

async function init() {
  await pool.query(SCHEMA);
  await seed();
}

module.exports = { pool, init };
