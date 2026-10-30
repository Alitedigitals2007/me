import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';

export const runtime = 'nodejs';

// Fetch photos from a public Google Drive folder
async function fetchGoogleDrivePhotos(folderId: string): Promise<any[]> {
  try {
    // Use the Google Drive API to list files (requires no auth for public folders)
    const apiKey = process.env.GOOGLE_API_KEY;
    let url = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and mimeType contains 'image/' and trashed=false`;
    
    if (apiKey) {
      url += `&key=${apiKey}&fields=files(id,name,mimeType,size)&pageSize=100`;
    } else {
      // Fallback: embed URL approach for public folders
      return [];
    }
    
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    
    if (!data.files) return [];
    
    return data.files.map((file: any) => ({
      id: file.id,
      url: `https://drive.google.com/uc?export=view&id=${file.id}`,
      alt: file.name || '',
      is_drive: true
    }));
  } catch (e) {
    console.error('Google Drive fetch error:', e);
    return [];
  }
}

// GET - public endpoint for birthday photos/settings
export async function GET(req: NextRequest) {
  try {
    // Get settings
    const settingsRes = await getPool().query(
      `SELECT birthday_date, title, subtitle, google_drive_folder, use_drive_photos 
       FROM birthday_settings ORDER BY id DESC LIMIT 1`
    );
    const settings = settingsRes.rows[0] || {
      birthday_date: '2026-10-30',
      title: 'Happy Birthday Alite',
      subtitle: 'Atilola Israel Ayomide · 30 Oct 2026',
      google_drive_folder: '1Ck8R9eLPfv3CvvjRBI9jwNjUWhbKAKrs',
      use_drive_photos: true
    };

    // Get photos from database ordered by sort_order
    const photosRes = await getPool().query(
      `SELECT url, alt, is_drive FROM birthday_photos ORDER BY sort_order ASC, created_at DESC`
    );
    let dbPhotos = photosRes.rows.map((row, i) => ({
      id: i + 1,
      url: row.url,
      alt: row.alt,
      isDrive: row.is_drive
    }));

    // If use_drive_photos is enabled, fetch from Google Drive and merge
    if (settings.use_drive_photos && settings.google_drive_folder) {
      const drivePhotos = await fetchGoogleDrivePhotos(settings.google_drive_folder);
      // Prepend drive photos (they come first, admin can reorder)
      const driveWithId = drivePhotos.map((p, i) => ({ ...p, id: Date.now() + i }));
      dbPhotos = [...driveWithId, ...dbPhotos];
    }

    return NextResponse.json({ settings, photos: dbPhotos });
  } catch (e) {
    console.error('birthday GET', e);
    return NextResponse.json({ 
      settings: {
        birthday_date: '2026-10-30',
        title: 'Happy Birthday Alite',
        subtitle: 'Atilola Israel Ayomide · 30 Oct 2026',
        google_drive_folder: '1Ck8R9eLPfv3CvvjRBI9jwNjUWhbKAKrs',
        use_drive_photos: true
      },
      photos: []
    });
  }
}
