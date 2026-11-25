const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');

function ensureDirs() {
  for (const sub of ['public', 'private']) {
    fs.mkdirSync(path.join(UPLOAD_DIR, sub), { recursive: true });
  }
}
ensureDirs();

function storageFor(visibility) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(UPLOAD_DIR, visibility)),
    filename: (_req, file, cb) => {
      const ext = (path.extname(file.originalname || '') || '.jpg').toLowerCase().slice(0, 5);
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  });
}

const imageFilter = (_req, file, cb) => {
  if (!/^image\//.test(file.mimetype)) return cb(new Error('Envie um arquivo de imagem'));
  cb(null, true);
};

const uploadPublic = multer({
  storage: storageFor('public'),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadPrivate = multer({
  storage: storageFor('private'),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: imageFilter,
});

function publicUrl(file) {
  return file ? `/api/files/public/${file.filename}` : null;
}
function privateUrl(file) {
  return file ? `/api/files/private/${file.filename}` : null;
}
function filePath(visibility, name) {
  const safe = path.basename(name);
  return path.join(UPLOAD_DIR, visibility, safe);
}

module.exports = { UPLOAD_DIR, uploadPublic, uploadPrivate, publicUrl, privateUrl, filePath };
