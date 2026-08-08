import { NextRequest, NextResponse } from 'next/server';
import { getImage } from '@/lib/uploads';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const file = await getImage(id);
    if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
    });
  } catch (e) {
    console.error('file download', e);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}