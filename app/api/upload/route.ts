import { NextRequest, NextResponse } from 'next/server';
import { saveUploadFile } from '@/lib/uploads';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const MAX_BYTES = 50 * 1024 * 1024; // 50MB for files
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/epub+zip',
  'application/octet-stream'
];

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const fd = await req.formData();
    const file = fd.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const genericType = !file.type || file.type === 'application/octet-stream';
    const isAllowed = ALLOWED_TYPES.includes(file.type) ||
                      (genericType && file.name.match(/\.(pdf|zip|rar|epub|docx?|xlsx?|pptx?)$/i) !== null);
    if (!isAllowed) {
      return NextResponse.json({ error: 'File type not allowed. Allowed: images, PDF, ZIP, RAR, EPUB, Office docs.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File must be 50MB or smaller' }, { status: 400 });
    }
    const folder = String(fd.get('folder') || 'general').replace(/[^a-z0-9_-]/gi, '');
    const url = await saveUploadFile(file, folder || 'general');
    if (!url) return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    return NextResponse.json({ url });
  } catch (e) {
    console.error('upload', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
