'use client';

import { useState } from 'react';

export default function LessonComplete({ lessonId, initiallyDone }: { lessonId: number; initiallyDone: boolean }) {
  const [done, setDone] = useState(initiallyDone);
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function mark() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/student/lessons/${lessonId}/complete`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save');
      setDone(true);
      if (data.certificate) setCertificate(data.certificate);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setLoading(false);
    }
  }

  if (certificate) {
    return (
      <div className="rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30 p-4 flex flex-wrap items-center gap-3">
        <span className="font-semibold text-emerald-700">🎓 Course completed — certificate issued!</span>
        <a href="/dashboard#certificates" className="text-sm font-bold text-emerald-700 underline">View certificate</a>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={mark}
        disabled={done || loading}
        className={`px-6 py-3 rounded-full font-semibold transition-all ${
          done ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/30' : 'bg-gradient-cta text-white shadow-[0_8px_24px_rgba(79,70,229,0.35)] hover:-translate-y-0.5'
        } disabled:cursor-default`}
      >
        {loading ? 'Saving…' : done ? '✓ Completed' : 'Mark as complete'}
      </button>
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}
