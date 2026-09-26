'use client';

import { useState } from 'react';

export default function AssignmentSubmit({
  assignmentId,
  initialContent,
  initialFileUrl
}: {
  assignmentId: number;
  initialContent?: string;
  initialFileUrl?: string;
}) {
  const [content, setContent] = useState(initialContent || '');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let fileUrl = initialFileUrl || '';
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const up = await fetch('/api/student/upload', { method: 'POST', body: fd });
        const upData = await up.json();
        if (!up.ok) throw new Error(upData.error || 'File upload failed');
        fileUrl = upData.url;
      }
      const res = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, file_url: fileUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <p className="text-sm text-emerald-600 font-semibold">✓ Submitted — your admin will review it and you will see the grade here.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-3 mt-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        maxLength={20000}
        placeholder="Type your answer here…"
        className="w-full rounded-xl bg-paper ring-1 ring-line px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent resize-y break-words"
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold text-muted cursor-pointer ring-1 ring-line rounded-full px-4 py-2 hover:ring-accent/50 transition-all">
          {file ? `📎 ${file.name.slice(0, 24)}` : '📎 Attach file (optional)'}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.zip,.png,.jpg,.jpeg,.webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <button
          type="submit"
          disabled={loading || (!content.trim() && !file)}
          className="bg-gradient-cta text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Submit assignment'}
        </button>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
      <p className="text-[11px] text-muted">Submissions are sent over AJAX — the page will not reload.</p>
    </form>
  );
}
