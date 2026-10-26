'use client';
import { useState } from 'react';

interface AppliedCoupon {
  code: string;
  description: string;
  original: number;
  discount: number;
  total: number;
}

function money(n: number): string {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export function BuyNow({
  listingId,
  title,
  price,
  priceLabel
}: {
  listingId: number;
  title: string;
  price: number;
  priceLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [err, setErr] = useState('');

  async function applyCoupon(): Promise<AppliedCoupon | null> {
    const code = couponCode.trim();
    if (!code) {
      setErr('Enter a coupon code.');
      return null;
    }
    setApplying(true);
    setErr('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, context: 'listing', item_id: listingId, email })
      });
      const data = await res.json();
      if (!res.ok) {
        setApplied(null);
        setErr(data.error || 'This coupon could not be applied.');
        return null;
      }
      const next: AppliedCoupon = {
        code: data.code,
        description: data.description || '',
        original: Number(data.original) || price,
        discount: Number(data.discount) || 0,
        total: Number(data.total) || 0
      };
      setApplied(next);
      return next;
    } catch {
      setApplied(null);
      setErr('Could not check this coupon right now.');
      return null;
    } finally {
      setApplying(false);
    }
  }

  async function buy() {
    setErr('');
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Enter a valid email.'); return; }
    setBusy(true);
    try {
      let activeCoupon = applied;
      if (!activeCoupon && couponCode.trim()) {
        activeCoupon = await applyCoupon();
        if (!activeCoupon) { setBusy(false); return; }
      }
      const res = await fetch(`/api/marketplace/buy/${listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, coupon_code: activeCoupon?.code || '' })
      });
      const data = await res.json();
      if (!res.ok || !data.url) { setErr(data.error || 'Could not start checkout.'); setBusy(false); return; }
      window.location.href = data.url;
    } catch {
      setErr('Network error. Please try again.');
      setBusy(false);
    }
  }

  const total = applied ? applied.total : price;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-gradient-cta text-white text-sm font-semibold px-3 py-2 hover:opacity-90 transition"
      >
        Buy now — {money(total)}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center p-4" onClick={() => !busy && setOpen(false)}>
          <div className="bg-card rounded-2xl shadow-lift ring-1 ring-line p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-lg mb-1">Buy {title}</h3>
            <p className="text-sm text-muted mb-4">
              We&apos;ll redirect you to Paystack to pay {money(total)}. You&apos;ll receive the item by email.
            </p>
            <label className="block text-xs font-semibold text-muted mb-1">Your email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
              autoFocus
            />
            <label className="block text-xs font-semibold text-muted mb-1 mt-3">Coupon code (optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setApplied(null);
                  setErr('');
                }}
                placeholder="e.g. LAUNCH20"
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-accent/40"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={applying || busy || !couponCode.trim()}
                className="shrink-0 rounded-lg ring-1 ring-line text-xs font-semibold px-3 py-2 hover:bg-paper transition disabled:opacity-50"
              >
                {applying ? '…' : 'Apply'}
              </button>
            </div>
            {applied && (
              <div className="mt-3 rounded-lg bg-success/10 ring-1 ring-success/30 px-3 py-2 text-xs">
                <p className="font-bold text-success">{applied.code} applied — {money(applied.discount)} off</p>
                {applied.description && <p className="text-ink-soft mt-0.5">{applied.description}</p>}
                <p className="text-ink-soft mt-1">
                  <span className="line-through">{money(applied.original)}</span>
                  <span className="font-bold text-ink ml-2">{money(applied.total)}</span>
                </p>
              </div>
            )}
            {!applied && (
              <p className="text-xs text-muted mt-2">Total: <span className="font-semibold text-ink">{priceLabel}</span></p>
            )}
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
                {busy ? 'Redirecting…' : total > 0 ? `Pay ${money(total)}` : 'Complete purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
