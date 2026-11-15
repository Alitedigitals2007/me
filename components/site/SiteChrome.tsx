'use client';

import { usePathname } from 'next/navigation';

const APP_PREFIXES = ['/admin', '/writer'];

export default function SiteChrome({
  nav,
  footer,
  intro,
  children
}: {
  nav: React.ReactNode;
  footer: React.ReactNode;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '/';
  const isAppPage = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isAppPage) return <>{children}</>;

  return (
    <>
      {intro}
      {nav}
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
        {footer}
      </div>
    </>
  );
}
