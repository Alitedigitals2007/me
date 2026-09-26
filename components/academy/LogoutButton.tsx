'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch('/api/student/logout', { method: 'POST' });
        router.push('/academy');
        router.refresh();
      }}
      className="rounded-full ring-1 ring-line px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:ring-accent/50 transition-all"
    >
      Log out
    </button>
  );
}
