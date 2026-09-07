const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', 'uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function buildStorage(subdir) {
  const dest = path.join(ROOT, subdir);
  ensureDir(dest);
  return multer.diskStorage({
    destination: function (_req, _file, cb) {
      cb(null, dest);
    },
    filename: function (_req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
}

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false);
  }
};

function createUploader(subdir) {
  return multer({
    storage: buildStorage(subdir),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  });
}

const upload = createUploader('events');

module.exports = upload;
module.exports.createUploader = createUploader;
