import { NextRequest, NextResponse } from 'next/server';
import { getImage } from '@/lib/uploads';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const image = await getImage(id);
    if (!image) {
      // Return a placeholder instead of 404 to avoid broken images
      return new NextResponse(null, { status: 404 });
    }
    // Never render active content (HTML/SVG) inline from user uploads
    const unsafe = /text\/html|image\/svg/i.test(image.contentType);
    const contentType = unsafe ? 'application/octet-stream' : image.contentType;
    return new NextResponse(new Uint8Array(image.buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': unsafe ? 'private, no-store' : 'public, max-age=31536000, immutable',
        'Content-Disposition': `${unsafe ? 'attachment' : 'inline'}; filename="${image.filename}"`
      }
    });
  } catch (e) {
    console.error('image serve', e);
    return new NextResponse(null, { status: 500 });
  }
}