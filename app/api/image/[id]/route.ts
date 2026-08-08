import { NextRequest, NextResponse } from 'next/server';
import { getImage } from '@/lib/uploads';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const image = await getImage(id);
    if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return new NextResponse(new Uint8Array(image.buffer), {
      headers: {
        'Content-Type': image.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${image.filename}"`
      }
    });
  } catch (e) {
    console.error('image serve', e);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}