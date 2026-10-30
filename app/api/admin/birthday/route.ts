import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';
import { saveUploadFile } from '@/lib/uploads';

export const runtime = 'nodejs';

// POST - Create/update settings and manage photos
export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const fd = await req.formData();
    const action = String(fd.get('action') || 'update');

    if (action === 'update_settings') {
      const birthdayDate = String(fd.get('birthday_date') || '2026-10-30');
      const title = String(fd.get('title') || 'Happy Birthday Alite');
      const subtitle = String(fd.get('subtitle') || 'Atilola Israel Ayomide · 30 Oct 2026');
      const googleDriveFolder = String(fd.get('google_drive_folder') || '1Ck8R9eLPfv3CvvjRBI9jwNjUWhbKAKrs');
      const useDrivePhotos = fd.get('use_drive_photos') === 'on' || fd.get('use_drive_photos') === 'true';

      // Check if settings exist, if so update, otherwise insert
      const existing = await getPool().query('SELECT id FROM birthday_settings LIMIT 1');
      if (existing.rows.length > 0) {
        await getPool().query(
          `UPDATE birthday_settings SET 
            birthday_date=$1, title=$2, subtitle=$3, 
            google_drive_folder=$4, use_drive_photos=$5, updated_at=now()
           WHERE id=$6`,
          [birthdayDate, title, subtitle, googleDriveFolder, useDrivePhotos, existing.rows[0].id]
        );
      } else {
        await getPool().query(
          `INSERT INTO birthday_settings 
            (birthday_date, title, subtitle, google_drive_folder, use_drive_photos)
           VALUES ($1, $2, $3, $4, $5)`,
          [birthdayDate, title, subtitle, googleDriveFolder, useDrivePhotos]
        );
      }
      return NextResponse.json({ ok: true, message: 'Settings updated' });
    }

    if (action === 'add_photo') {
      const file = fd.get('file');
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      const alt = String(fd.get('alt') || '').trim();
      
      // Upload to the existing upload system
      const url = await saveUploadFile(file, 'birthday');
      if (!url) return NextResponse.json({ error: 'Upload failed' }, { status: 500 });

      // Get the next sort order
      const maxRes = await getPool().query('SELECT MAX(sort_order) as max FROM birthday_photos');
      const sortOrder = (maxRes.rows[0]?.max || 0) + 1;

      await getPool().query(
        `INSERT INTO birthday_photos (url, alt, sort_order, is_drive) VALUES ($1, $2, $3, $4)`,
        [url, alt, sortOrder, false]
      );
      return NextResponse.json({ ok: true, url });
    }

    if (action === 'add_drive_photo') {
      const url = String(fd.get('url') || '').trim();
      const alt = String(fd.get('alt') || '').trim();
      const isDrive = fd.get('is_drive') === 'on' || fd.get('is_drive') === 'true';

      if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

      const maxRes = await getPool().query('SELECT MAX(sort_order) as max FROM birthday_photos');
      const sortOrder = (maxRes.rows[0]?.max || 0) + 1;

      await getPool().query(
        `INSERT INTO birthday_photos (url, alt, sort_order, is_drive) VALUES ($1, $2, $3, $4)`,
        [url, alt, sortOrder, isDrive]
      );
      return NextResponse.json({ ok: true });
    }

    if (action === 'reorder') {
      const order = JSON.parse(String(fd.get('order') || '[]'));
      for (const item of order) {
        await getPool().query(
          'UPDATE birthday_photos SET sort_order=$1 WHERE url=$2',
          [item.sort_order, item.url]
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'delete_photo') {
      const url = String(fd.get('url') || '').trim();
      if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });
      await getPool().query('DELETE FROM birthday_photos WHERE url=$1', [url]);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error('birthday admin', e);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
