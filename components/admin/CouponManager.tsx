'use client';

import { useState } from 'react';

export interface AdminCoupon {
  id: number;
  code: string;
  description: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_discount: number;
  applies_to: 'all' | 'courses' | 'products';
  course_id: number | null;
  listing_id: number | null;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  max_uses_per_customer: number;
  min_order: number;
  is_active: boolean;
  created_at: string;
}

interface Option {
  id: number;
  title: string;
}

interface FormState {
  code: string;
  description: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  max_discount: string;
  applies_to: 'all' | 'courses' | 'products';
  course_id: string;
  listing_id: string;
  starts_at: string;
  expires_at: string;
  max_uses: string;
  max_uses_per_customer: string;
  min_order: string;
  is_active: boolean;
}

const input = 'rounded-xl bg-paper ring-1 ring-line px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent w-full';
const label = 'text-xs font-semibold text-ink-soft';
const btn = 'px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white disabled:opacity-60';
const btnGhost = 'px-4 py-2 rounded-full text-xs font-semibold ring-1 ring-line hover:ring-accent/50';

const BLANK: FormState = {
  code: '',
  description: '',
  discount_type: 'percent',
  discount_value: '10',
  max_discount: '0',
  applies_to: 'all',
  course_id: '',
  listing_id: '',
  starts_at: '',
  expires_at: '',
  max_uses: '',
  max_uses_per_customer: '0',
  min_order: '0',
  is_active: true
};

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function money(n: number): string {
  return `₦${Number(n || 0).toLocaleString()}`;
}

function couponState(c: AdminCoupon) {
  if (!c.is_active) return { label: 'Paused', className: 'bg-ink/5 text-muted' };
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) {
    return { label: 'Expired', className: 'bg-danger/10 text-danger' };
  }
  if (c.max_uses !== null && c.used_count >= c.max_uses) {
    return { label: 'Used up', className: 'bg-warning/15 text-warning' };
  }
  if (c.starts_at && new Date(c.starts_at).getTime() > Date.now()) {
    return { label: 'Scheduled', className: 'bg-accent/10 text-accent' };
  }
  return { label: 'Active', className: 'bg-success/10 text-success' };
}

export default function CouponManager({
  coupons,
  courses,
  listings
}: {
  coupons: AdminCoupon[];
  courses: Option[];
  listings: Option[];
}) {
  const [form, setForm] = useState<FormState>(BLANK);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm(BLANK);
    setEditingId(null);
    setError('');
  }

  function startEdit(c: AdminCoupon) {
    setEditingId(c.id);
    setError('');
    setForm({
      code: c.code,
      description: c.description,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      max_discount: String(c.max_discount),
      applies_to: c.applies_to,
      course_id: c.course_id ? String(c.course_id) : '',
      listing_id: c.listing_id ? String(c.listing_id) : '',
      starts_at: toLocalInput(c.starts_at),
      expires_at: toLocalInput(c.expires_at),
      max_uses: c.max_uses === null ? '' : String(c.max_uses),
      max_uses_per_customer: String(c.max_uses_per_customer),
      min_order: String(c.min_order),
      is_active: c.is_active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        code: form.code,
        description: form.description,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value) || 0,
        max_discount: Number(form.max_discount) || 0,
        applies_to: form.applies_to,
        course_id: form.course_id ? Number(form.course_id) : null,
        listing_id: form.listing_id ? Number(form.listing_id) : null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        max_uses: form.max_uses.trim() ? Number(form.max_uses) : null,
        max_uses_per_customer: Number(form.max_uses_per_customer) || 0,
        min_order: Number(form.min_order) || 0,
        is_active: form.is_active
      };
      const res = await fetch(editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        window.location.href = '/login?next=/admin/coupons';
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Could not save coupon.');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save coupon.');
      setBusy(false);
    }
  }

  async function toggleActive(c: AdminCoupon) {
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !c.is_active })
      });
      if (res.status === 401) {
        window.location.href = '/login?next=/admin/coupons';
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Could not update coupon.');
      window.location.reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not update coupon.');
    }
  }

  async function remove(c: AdminCoupon) {
    if (!window.confirm(`Delete coupon "${c.code}"? Coupons with redemptions must be paused instead.`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE' });
      if (res.status === 401) {
        window.location.href = '/login?next=/admin/coupons';
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Could not delete coupon.');
      window.location.reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not delete coupon.');
    }
  }

  const courseTitle = (id: number | null) => courses.find((c) => c.id === id)?.title;
  const listingTitle = (id: number | null) => listings.find((l) => l.id === id)?.title;

  function scopeLabel(c: AdminCoupon): string {
    if (c.course_id) return `Course · ${courseTitle(c.course_id) || `#${c.course_id}`}`;
    if (c.listing_id) return `Product · ${listingTitle(c.listing_id) || `#${c.listing_id}`}`;
    if (c.applies_to === 'courses') return 'All courses';
    if (c.applies_to === 'products') return 'All products';
    return 'Courses & products';
  }

  return (
    <div className="mt-6 grid xl:grid-cols-[1.05fr_1.4fr] gap-6 items-start">
      <form onSubmit={submit} className="rounded-2xl bg-card ring-1 ring-line p-5 space-y-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-accent">
            {editingId ? `Edit coupon #${editingId}` : 'New coupon'}
          </p>
          <p className="text-xs text-muted mt-1">
            Codes are checked again at checkout, and usage limits are enforced atomically. Pending checkouts count for up to 90 minutes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="sm:col-span-2">
            <span className={label}>Code *</span>
            <input
              className={`${input} mt-1 font-mono uppercase`}
              value={form.code}
              onChange={(e) => update('code', e.target.value.toUpperCase())}
              placeholder="e.g. LAUNCH20"
              required
            />
          </label>
          <label className="sm:col-span-2">
            <span className={label}>Description</span>
            <input
              className={`${input} mt-1`}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Shown to customers when the code is applied"
            />
          </label>
          <label>
            <span className={label}>Discount type *</span>
            <select
              className={`${input} mt-1`}
              value={form.discount_type}
              onChange={(e) => update('discount_type', e.target.value as FormState['discount_type'])}
            >
              <option value="percent">Percentage off</option>
              <option value="fixed">Fixed amount off</option>
            </select>
          </label>
          <label>
            <span className={label}>{form.discount_type === 'percent' ? 'Discount (%)' : 'Discount (₦)'} *</span>
            <input
              className={`${input} mt-1`}
              type="number"
              min={0}
              max={form.discount_type === 'percent' ? 100 : undefined}
              step="0.01"
              value={form.discount_value}
              onChange={(e) => update('discount_value', e.target.value)}
              required
            />
          </label>
          <label>
            <span className={label}>Max discount (₦)</span>
            <input
              className={`${input} mt-1`}
              type="number"
              min={0}
              step="0.01"
              value={form.max_discount}
              onChange={(e) => update('max_discount', e.target.value)}
              placeholder="0 = no cap"
            />
          </label>
          <label>
            <span className={label}>Minimum order (₦)</span>
            <input
              className={`${input} mt-1`}
              type="number"
              min={0}
              step="0.01"
              value={form.min_order}
              onChange={(e) => update('min_order', e.target.value)}
            />
          </label>
          <label>
            <span className={label}>Applies to *</span>
            <select
              className={`${input} mt-1`}
              value={form.applies_to}
              onChange={(e) => {
                const value = e.target.value as FormState['applies_to'];
                setForm((f) => ({
                  ...f,
                  applies_to: value,
                  course_id: value === 'products' ? '' : f.course_id,
                  listing_id: value === 'courses' ? '' : f.listing_id
                }));
              }}
            >
              <option value="all">Courses &amp; products</option>
              <option value="courses">Courses only</option>
              <option value="products">Products only</option>
            </select>
          </label>
          <label>
            <span className={label}>Specific course (optional)</span>
            <select
              className={`${input} mt-1`}
              value={form.course_id}
              onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value, listing_id: e.target.value ? '' : f.listing_id }))}
              disabled={form.applies_to === 'products'}
            >
              <option value="">Any course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className={label}>Specific product (optional)</span>
            <select
              className={`${input} mt-1`}
              value={form.listing_id}
              onChange={(e) => setForm((f) => ({ ...f, listing_id: e.target.value, course_id: e.target.value ? '' : f.course_id }))}
              disabled={form.applies_to === 'courses'}
            >
              <option value="">Any product</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={label}>Starts at</span>
            <input
              className={`${input} mt-1`}
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => update('starts_at', e.target.value)}
            />
          </label>
          <label>
            <span className={label}>Expires at</span>
            <input
              className={`${input} mt-1`}
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => update('expires_at', e.target.value)}
            />
          </label>
          <label>
            <span className={label}>Total usage limit</span>
            <input
              className={`${input} mt-1`}
              type="number"
              min={1}
              value={form.max_uses}
              onChange={(e) => update('max_uses', e.target.value)}
              placeholder="Empty = unlimited"
            />
          </label>
          <label>
            <span className={label}>Uses per customer</span>
            <input
              className={`${input} mt-1`}
              type="number"
              min={0}
              value={form.max_uses_per_customer}
              onChange={(e) => update('max_uses_per_customer', e.target.value)}
              placeholder="0 = unlimited"
            />
          </label>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => update('is_active', e.target.checked)}
              className="accent-accent"
            />
            Coupon is active
          </label>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy} className={btn}>
            {busy ? 'Saving…' : editingId ? 'Save changes' : 'Create coupon'}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className={btnGhost}>
              Cancel edit
            </button>
          )}
          {!editingId && coupons.length > 0 && (
            <span className="text-xs text-muted self-center">{coupons.length} coupon{coupons.length === 1 ? '' : 's'} created</span>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {coupons.length === 0 && (
          <p className="text-sm text-muted rounded-2xl bg-card ring-1 ring-line p-8 text-center">
            No coupons yet — create your first discount code.
          </p>
        )}
        {coupons.map((c) => {
          const state = couponState(c);
          const discount =
            c.discount_type === 'percent'
              ? `${c.discount_value}% off${c.max_discount > 0 ? ` (max ${money(c.max_discount)})` : ''}`
              : `${money(c.discount_value)} off`;
          return (
            <div key={c.id} className="rounded-2xl bg-card ring-1 ring-line p-4">
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-mono text-sm font-bold bg-paper ring-1 ring-line px-2 py-1 rounded">{c.code}</code>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${state.className}`}>
                  {state.label}
                </span>
                <span className="text-xs text-muted">{discount}</span>
                <span className="ml-auto text-xs font-semibold text-muted">
                  {c.used_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ''} used
                </span>
              </div>
              {c.description && <p className="text-xs text-muted mt-1.5">{c.description}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span>{scopeLabel(c)}</span>
                {c.min_order > 0 && <span>Min {money(c.min_order)}</span>}
                {c.max_uses_per_customer > 0 && <span>{c.max_uses_per_customer}/customer</span>}
                {c.starts_at && <span>Starts {new Date(c.starts_at).toLocaleString('en-GB')}</span>}
                {c.expires_at && <span>Ends {new Date(c.expires_at).toLocaleString('en-GB')}</span>}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => startEdit(c)} className={btnGhost}>Edit</button>
                <button onClick={() => toggleActive(c)} className={btnGhost}>
                  {c.is_active ? 'Pause' : 'Activate'}
                </button>
                <button
                  onClick={() => remove(c)}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-danger/10 text-danger ring-1 ring-danger/30 hover:bg-danger/15"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
