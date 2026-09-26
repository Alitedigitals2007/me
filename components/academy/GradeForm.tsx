'use client';

import { useState } from 'react';

export default function GradeForm({ submissionId, maxScore }: { submissionId: number; maxScore: number }) {
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function grade(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(score);
    if (!Number.isFinite(n) || n < 0 || n > maxScore) {
      setError(`Score must be between 0 and ${maxScore}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/academy/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: n, feedback })
      });
      const data = await res.json();
      if (res.status === 401) { window.location.href = '/login?next=/admin'; return; }
      if (!res.ok) throw new Error(data.error || 'Grade failed');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grade failed');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={grade} className="mt-3 flex flex-wrap items-end gap-3 border-t border-line pt-3">
      <label className="text-xs text-muted">
        Score / {maxScore}
        <input
          type="number"
          min={0}
          max={maxScore}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          required
          className="mt-1 w-24 rounded-xl bg-paper ring-1 ring-line px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <label className="text-xs text-muted flex-1 min-w-48">
        Feedback
        <input
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Great work on…"
          className="mt-1 w-full rounded-xl bg-paper ring-1 ring-line px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <button disabled={loading} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white disabled:opacity-60">
        {loading ? 'Saving…' : 'Save grade'}
      </button>
      {error && <span className="text-sm text-danger">{error}</span>}
    </form>
  );
}
