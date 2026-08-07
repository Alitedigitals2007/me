import { NextRequest, NextResponse } from 'next/server';
import { saveUploadFile } from '@/lib/uploads';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const file = fd.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images are allowed' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be 5MB or smaller' }, { status: 400 });
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
