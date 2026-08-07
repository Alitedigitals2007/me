'use client';

import { useState } from 'react';
import TimelineForm, { type TimelineField } from '@/components/admin/TimelineForm';
import ActionButton from '@/components/admin/ActionButton';
import type { EducationItem, RoleItem, Course } from '@/lib/types';

type Item = EducationItem | RoleItem | Course;

export default function TimelineManager({
  table,
  title,
  fields,
  items
}: {
  table: 'education' | 'roles' | 'courses';
  title: string;
  fields: TimelineField[];
  items: Item[];
}) {
  const [editing, setEditing] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display font-extrabold uppercase text-3xl">{title}</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm((v) => !v);
          }}
          className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white"
        >
          {showForm ? 'Close' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <div className="mt-6">
          <TimelineForm table={table} fields={fields} editing={editing} onDone={() => setShowForm(false)} />
        </div>
      )}

      <div className="mt-6 space-y-2">
        {items.length ? (
          items.map((it) => {
            const d = it as unknown as Record<string, unknown>;
            const heading = String(d.title || d.institution || '');
            const sub = String(d.org || d.program || '');
            return (
              <div key={String(d.id)} className="flex items-center justify-between gap-4 rounded-xl bg-card ring-1 ring-line px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{heading}</p>
                  <p className="text-xs text-muted truncate">
                    {sub}
                    {d.start_date ? ` · ${String(d.start_date)}${d.end_date ? ` – ${d.end_date}` : ''}` : ''}
                    {d.price ? ` · ₦${Number(d.price).toLocaleString()}` : ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditing(it);
                      setShowForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-paper ring-1 ring-line text-ink-soft hover:ring-accent/50"
                  >
                    Edit
                  </button>
                  <ActionButton
                    url={`/api/admin/content/${table}/delete/${d.id}`}
                    label="Delete"
                    tone="danger"
                    confirmText="Delete this item?"
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted rounded-2xl bg-card ring-1 ring-line p-8 text-center">Nothing here yet.</p>
        )}
      </div>
    </div>
  );
}
