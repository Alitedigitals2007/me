import { NextRequest, NextResponse } from 'next/server';
import { getImage } from '@/lib/uploads';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const file = await getImage(id);
    if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Paid product files require a completed purchase; everything else is publicly servable
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      const paidFile = await pool.query(
        `SELECT EXISTS (
           SELECT 1 FROM marketplace_purchases p
            WHERE p.listing_id = l.id AND p.status = 'completed'
         ) AS purchased
         FROM marketplace_listings l
         WHERE l.file_id = $1::uuid AND l.delivery_type = 'file'
         LIMIT 1`,
        [id]
      );
      if (paidFile.rows.length && !paidFile.rows[0].purchased) {
        return NextResponse.json({ error: 'Purchase required to download this file' }, { status: 403 });
      }
    }

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