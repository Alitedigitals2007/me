const fs = require('fs');
const path = require('path');
const multer = require('multer');

const hasCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

let cloudinary = null;
if (hasCloudinary) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

async function saveUpload(file, folder = 'general') {
  if (!file) return '';
  if (cloudinary) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `alite/${folder}`, resource_type: 'image' },
        (err, result) => (err ? reject(err) : resolve(result.secure_url))
      );
      stream.end(file.buffer);
    });
  }
  ensureDir();
  const ext = (file.originalname || 'img').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dest = path.join(UPLOAD_DIR, name);
  fs.writeFileSync(dest, file.buffer);
  return `/uploads/${name}`;
}

module.exports = { upload, saveUpload, hasCloudinary };
