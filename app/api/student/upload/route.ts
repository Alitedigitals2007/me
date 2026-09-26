import { NextRequest, NextResponse } from 'next/server';
import { saveUploadFile } from '@/lib/uploads';
import { getStudent } from '@/lib/student-session';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export async function POST(req: NextRequest) {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  if (!rateLimit(`upload:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429 });
  }
  try {
    const fd = await req.formData();
    const file = fd.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!ALLOWED.includes(file.type) && !file.name.match(/\.(pdf|txt|docx|zip|png|jpg|jpeg|webp)$/i)) {
      return NextResponse.json({ error: 'Allowed: PDF, DOCX, TXT, ZIP, images.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File must be 15MB or smaller' }, { status: 400 });
    const url = await saveUploadFile(file, 'submissions');
    if (!url) return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    return NextResponse.json({ url });
  } catch (e) {
    console.error('student upload', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
