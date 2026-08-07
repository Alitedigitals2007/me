import ActionButton from '@/components/admin/ActionButton';
import pool from '@/lib/db';
import { formatDateTime } from '@/lib/utils';

export const metadata = { title: 'Messages' };

export default async function MessagesPage() {
  const { rows } = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
  return (
    <div>
      <h1 className="font-display font-extrabold uppercase text-3xl">Messages</h1>
      <div className="mt-8 space-y-3">
        {rows.length ? (
          rows.map((m) => (
            <div key={m.id} className={`rounded-2xl bg-card ring-1 ring-line p-5 ${!m.is_read ? 'ring-accent/40' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-sm">
                  {m.name} <span className="text-muted font-normal">· {m.email}</span>
                </p>
                <span className="text-xs text-muted">{formatDateTime(m.created_at)}</span>
              </div>
              <p className="text-sm text-ink-soft mt-2 whitespace-pre-wrap">{m.message}</p>
              <div className="flex gap-2 mt-4">
                {!m.is_read && <ActionButton url={`/api/admin/messages/read/${m.id}`} label="Mark read" />}
                <ActionButton url={`/api/admin/messages/delete/${m.id}`} label="Delete" tone="danger" confirmText="Delete this message?" />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted rounded-2xl bg-card ring-1 ring-line p-8 text-center">No messages yet.</p>
        )}
      </div>
    </div>
  );
}
