'use client';
import { useState } from 'react';

export function BuyNow({ listingId, title, priceLabel }: { listingId: number; title: string; priceLabel: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function buy() {
    setErr('');
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Enter a valid email.'); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/marketplace/buy/${listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok || !data.url) { setErr(data.error || 'Could not start checkout.'); setBusy(false); return; }
      window.location.href = data.url;
    } catch {
      setErr('Network error. Please try again.');
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-gradient-cta text-white text-sm font-semibold px-3 py-2 hover:opacity-90 transition"
      >
        Buy now — {priceLabel}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center p-4" onClick={() => !busy && setOpen(false)}>
          <div className="bg-card rounded-2xl shadow-lift ring-1 ring-line p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-lg mb-1">Buy {title}</h3>
            <p className="text-sm text-muted mb-4">We&apos;ll redirect you to Paystack to pay {priceLabel}. You&apos;ll receive the item by email.</p>
            <label className="block text-xs font-semibold text-muted mb-1">Your email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
              autoFocus
            />
            {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="flex-1 rounded-lg ring-1 ring-line text-sm font-semibold px-3 py-2 hover:bg-paper transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={buy}
                disabled={busy}
                className="flex-1 rounded-lg bg-gradient-cta text-white text-sm font-semibold px-3 py-2 hover:opacity-90 transition disabled:opacity-50"
              >
                {busy ? 'Redirecting…' : 'Continue to Paystack'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
