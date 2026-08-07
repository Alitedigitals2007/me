import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

const hasCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function saveUploadFile(file: File | null, folder = 'general'): Promise<string> {
  if (!file) return '';
  const buffer = Buffer.from(await file.arrayBuffer());

  if (hasCloudinary) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `alite/${folder}`, resource_type: 'image' },
        (err, result) => (err ? reject(err) : resolve(result?.secure_url ?? ''))
      );
      stream.end(buffer);
    });
  }

  // Local fallback (dev). On Vercel, configure Cloudinary — filesystem is ephemeral.
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}

export function hasCloudinaryConfigured(): boolean {
  return hasCloudinary;
}
