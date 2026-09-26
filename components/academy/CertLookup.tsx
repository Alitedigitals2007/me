'use client';

import { useState } from 'react';

export default function CertLookup() {
  const [code, setCode] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) window.location.href = `/certificates/${encodeURIComponent(c)}`;
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-wrap gap-3 justify-center">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Certificate code (e.g. ALITE-7F3K)"
        className="flex-1 min-w-[240px] rounded-xl bg-paper ring-1 ring-line px-4 py-3 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        className="bg-gradient-cta text-white text-sm font-semibold px-6 py-3 rounded-xl hover:-translate-y-0.5 transition-all"
      >
        Verify
      </button>
    </form>
  );
}
