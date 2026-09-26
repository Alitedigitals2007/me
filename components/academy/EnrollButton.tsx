'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EnrollButton({
  courseId,
  loggedIn,
  price,
  loginNext
}: {
  courseId: number;
  loggedIn: boolean;
  price: number;
  loginNext: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function enroll() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/academy/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  }

  if (!loggedIn) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/academy/login?next=${encodeURIComponent(loginNext)}`}
          className="bg-gradient-cta text-white font-semibold px-7 py-3.5 rounded-full shadow-[0_8px_24px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 transition-all"
        >
          {price > 0 ? `Enroll — ₦${price.toLocaleString()}` : 'Enroll free'}
        </Link>
        <span className="text-xs text-muted">Account required — takes 20 seconds.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={enroll}
        disabled={loading}
        className="bg-gradient-cta text-white font-semibold px-7 py-3.5 rounded-full shadow-[0_8px_24px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 transition-all disabled:opacity-60"
      >
        {loading ? 'Please wait…' : price > 0 ? `Pay ₦${price.toLocaleString()}` : 'Enroll free'}
      </button>
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}
