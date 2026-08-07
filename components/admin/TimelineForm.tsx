'use client';

import { useState } from 'react';
import type { EducationItem, RoleItem, Course } from '@/lib/types';

export interface TimelineField {
  name: string;
  label: string;
  type?: 'text' | 'textarea';
  required?: boolean;
}

export default function TimelineForm({
  table,
  fields,
  editing,
  onDone
}: {
  table: 'education' | 'roles' | 'courses';
  fields: TimelineField[];
  editing?: EducationItem | RoleItem | Course | null;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const item = editing as Record<string, unknown> | null;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const fd = new FormData(e.currentTarget);
        if (item) {
          fd.set('order_index', String((item as unknown as { order_index?: number }).order_index ?? 0));
        }
        try {
          const res = await fetch(
            item
              ? `/api/admin/content/${table}/edit/${item.id}`
              : `/api/admin/content/${table}`,
            { method: 'POST', body: fd }
          );
          if (!res.ok) throw new Error();
          onDone();
          window.location.reload();
        } catch {
          window.alert('Save failed');
          setBusy(false);
        }
      }}
      className="rounded-2xl bg-card ring-1 ring-line p-5 grid sm:grid-cols-2 gap-3"
    >
      <h3 className="sm:col-span-2 font-display font-bold uppercase text-lg">
        {item ? 'Edit' : 'Add'} {table.slice(0, -1)}
      </h3>
      {item && <input type="hidden" name="id" value={String(item.id)} />}
      {fields.map((f) => (
        <label key={f.name} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
          <span className="text-xs font-semibold text-ink-soft">{f.label}</span>
          {f.type === 'textarea' ? (
            <textarea
              name={f.name}
              required={f.required}
              rows={2}
              defaultValue={String(item?.[f.name] ?? '')}
              className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
          ) : (
            <input
              name={f.name}
              required={f.required}
              defaultValue={String(item?.[f.name] ?? '')}
              className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
          )}
        </label>
      ))}
      <label>
        <span className="text-xs font-semibold text-ink-soft">Order</span>
        <input
          name="order_index"
          type="number"
          defaultValue={String((item as unknown as { order_index?: number })?.order_index ?? 0)}
          className="mt-1 w-full rounded-lg bg-paper ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <div className="flex items-end justify-end gap-2">
        {item && (
          <button type="button" onClick={onDone} className="px-4 py-2 rounded-lg text-sm font-semibold bg-paper ring-1 ring-line">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={busy}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-cta text-white disabled:opacity-50"
        >
          {busy ? 'Saving…' : item ? 'Save changes' : 'Add'}
        </button>
      </div>
    </form>
  );
}
