import pool from './db';

const MAX_BYTES = 50 * 1024 * 1024;

export async function saveUploadFile(file: File | null, folder = 'general'): Promise<string> {
  if (!file) return '';
  const buffer = Buffer.from(await file.arrayBuffer());
  
  if (buffer.length > MAX_BYTES) {
    throw new Error('File must be 50MB or smaller');
  }
  const allowedTypes = ['image/', 'application/pdf', 'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/epub+zip', 'application/octet-stream'];
  const isAllowed = allowedTypes.some(type => file.type.startsWith(type)) || allowedTypes.includes(file.type) || file.name.match(/\.(pdf|zip|rar|epub|docx?|xlsx?|pptx?)$/i);
  if (!isAllowed) {
    throw new Error('File type not allowed');
  }

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  
  const { rows } = await pool.query(
    `INSERT INTO uploaded_images (filename, content_type, data, folder, size_bytes)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [`upload.${ext}`, file.type, buffer, folder, buffer.length]
  );

  return `/api/image/${rows[0].id}`;
}

export async function getImage(id: string): Promise<{ buffer: Buffer; contentType: string; filename: string } | null> {
  const { rows } = await pool.query(
    `SELECT data, content_type, filename FROM uploaded_images WHERE id = $1`,
    [id]
  );
  if (!rows.length) return null;
  return {
    buffer: rows[0].data,
    contentType: rows[0].content_type,
    filename: rows[0].filename
  };
}

export function hasCloudinaryConfigured(): boolean {
  return false;
}
