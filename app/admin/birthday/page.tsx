'use client';

import { useEffect, useState } from 'react';

type Photo = {
  id: number;
  url: string;
  alt: string;
  isDrive: boolean;
};

type Settings = {
  birthday_date: string;
  title: string;
  subtitle: string;
  google_drive_folder: string;
  use_drive_photos: boolean;
};

type ApiPhoto = {
  url: string;
  alt: string;
  is_drive: boolean;
};

async function fetchApi(path: string, opts?: RequestInit) {
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function AdminBirthday() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchApi('/api/birthday');
        setSettings(data.settings);
        setPhotos((data.photos || []).map((p: ApiPhoto, i: number) => ({
          id: i + 1, url: p.url, alt: p.alt, isDrive: p.is_drive
        })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.append('action', 'update_settings');
      await fetchApi('/api/admin/birthday', { method: 'POST', body: fd });
      const data = await fetchApi('/api/birthday');
      setSettings(data.settings);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('action', 'add_photo');
        fd.append('file', file);
        await fetchApi('/api/admin/birthday', { method: 'POST', body: fd });
      }
      const data = await fetchApi('/api/birthday');
      setPhotos((data.photos || []).map((p: ApiPhoto, i: number) => ({
        id: i + 1, url: p.url, alt: p.alt, isDrive: p.is_drive
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (url: string) => {
    if (!confirm('Delete this photo?')) return;
    try {
      const fd = new FormData();
      fd.append('action', 'delete_photo');
      fd.append('url', url);
      await fetchApi('/api/admin/birthday', { method: 'POST', body: fd });
      const data = await fetchApi('/api/birthday');
      setPhotos((data.photos || []).map((p: ApiPhoto, i: number) => ({
        id: i + 1, url: p.url, alt: p.alt, isDrive: p.is_drive
      })));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-6"><h1 className="text-2xl font-bold mb-4">Birthday Settings</h1><p>Loading...</p></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-display font-bold mb-6">Birthday Settings</h1>
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        <form onSubmit={handleSaveSettings} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1">Birthday Date</label>
            <input type="date" name="birthday_date" className="input w-full"
              defaultValue={settings?.birthday_date || '2026-10-30'} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1">Title</label>
            <input type="text" name="title" className="input w-full" defaultValue={settings?.title || ''} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1">Subtitle</label>
            <input type="text" name="subtitle" className="input w-full" defaultValue={settings?.subtitle || ''} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1">Google Drive Folder ID</label>
            <input type="text" name="google_drive_folder" className="input w-full"
              defaultValue={settings?.google_drive_folder || ''} required />
            <p className="text-xs text-ink-soft mt-1">
              Folder: https://drive.google.com/drive/folders/{settings?.google_drive_folder || '1Ck8R9eLPfv3CvvjRBI9jwNjUWhbKAKrs'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="use_drive_photos" id="use_drive_photos"
              defaultChecked={settings?.use_drive_photos !== false} className="rounded" />
            <label htmlFor="use_drive_photos" className="text-sm font-medium text-ink-soft">
              Load photos from Google Drive folder
            </label>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-fit">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Upload Photos</h2>
        <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} className="block w-full" />
        {uploading && <p className="text-ink-soft mt-2">Uploading...</p>}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Add Google Drive Photos (Direct Links)</h2>
        <p className="text-sm text-ink-soft mb-3">Add 5 photos directly from Google Drive.</p>
        <form id="add-drive-form" onSubmit={async (e) => {
          e.preventDefault();
          const urls = (document.getElementById('drive-urls') as HTMLTextAreaElement).value
            .split('\n').map(s => s.trim()).filter(Boolean);
          for (const url of urls) {
            const fd = new FormData();
            fd.append('action', 'add_drive_photo');
            fd.append('url', url);
            fd.append('is_drive', 'true');
            await fetchApi('/api/admin/birthday', { method: 'POST', body: fd });
          }
          const data = await fetchApi('/api/birthday');
          setPhotos((data.photos || []).map((p: ApiPhoto, i: number) => ({
            id: i + 1, url: p.url, alt: p.alt, isDrive: p.is_drive
          })));
          (document.getElementById('drive-urls') as HTMLTextAreaElement).value = '';
        }} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1">
              Google Drive Photo URLs (one per line - 5 photos)
            </label>
            <textarea id="drive-urls" placeholder="https://drive.google.com/uc?export=view&id=FILE_ID" 
              className="input w-full h-24" required />
          </div>
          <button type="submit" className="btn-primary">Add Drive Photos</button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Manage Photos ({photos.length})</h2>
        {photos.length === 0 ? (
          <p className="text-ink-soft">No photos yet. Upload some above.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="border border-line rounded-lg overflow-hidden">
                <img src={photo.url} alt={photo.alt} className="w-full h-32 object-cover" />
                <div className="p-2">
                  <p className="text-xs text-ink-soft truncate">{photo.url.substring(0, 40)}...</p>
                  <span className="text-xs text-ink-soft">
                    {photo.isDrive ? 'Drive' : 'Upload'}
                  </span>
                </div>
                <div className="flex border-t border-line">
                  <button onClick={() => handleDelete(photo.url)}
                    className="flex-1 text-center py-1 text-sm text-danger hover:bg-ink/5">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
