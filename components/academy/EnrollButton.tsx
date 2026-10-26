'use client';

import { useState } from 'react';
import Link from 'next/link';

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
  const [applying, setApplying] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [error, setError] = useState('');

  async function applyCoupon(): Promise<AppliedCoupon | null> {
    const code = couponCode.trim();
    if (!code) {
      setError('Enter a coupon code.');
      return null;
    }
    setApplying(true);
    setError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, context: 'course', item_id: courseId })
      });
      const data = await res.json();
      if (!res.ok) {
        setApplied(null);
        setError(data.error || 'This coupon could not be applied.');
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
      setError('Could not check this coupon right now.');
      return null;
    } finally {
      setApplying(false);
    }
  }

  async function enroll() {
    setLoading(true);
    setError('');
    try {
      let activeCoupon = applied;
      if (!activeCoupon && couponCode.trim()) {
        activeCoupon = await applyCoupon();
        if (!activeCoupon) { setLoading(false); return; }
      }
      const res = await fetch('/api/academy/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, coupon_code: activeCoupon?.code || '' })
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

  const total = applied ? applied.total : price;

  return (
    <div className="flex flex-col gap-3 max-w-lg">
      {price > 0 && (
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setApplied(null);
                setError('');
              }}
              placeholder="Coupon code (optional)"
              className="rounded-full bg-paper ring-1 ring-line px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-accent w-full max-w-[240px]"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={applying || loading || !couponCode.trim()}
              className="rounded-full ring-1 ring-line px-4 py-2.5 text-xs font-semibold hover:ring-accent/50 transition disabled:opacity-50"
            >
              {applying ? 'Checking…' : 'Apply'}
            </button>
          </div>
          {applied && (
            <p className="text-xs mt-2 text-emerald-700 font-semibold">
              {applied.code} applied — {money(applied.discount)} off
              <span className="text-muted font-normal ml-2 line-through">{money(applied.original)}</span>
              <span className="text-ink ml-1.5">{money(applied.total)}</span>
            </p>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={enroll}
          disabled={loading}
          className="bg-gradient-cta text-white font-semibold px-7 py-3.5 rounded-full shadow-[0_8px_24px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 transition-all disabled:opacity-60"
        >
          {loading ? 'Please wait…' : total > 0 ? `Pay ${money(total)}` : 'Enroll free'}
        </button>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </div>
  );
}
