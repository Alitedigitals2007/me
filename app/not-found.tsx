import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="font-display font-extrabold text-[clamp(4rem,12vw,7rem)] leading-none text-gradient">404</p>
      <h1 className="font-display font-bold uppercase text-2xl mt-2">Page not found</h1>
      <p className="text-muted mt-3">The page you are looking for does not exist — or has been moved.</p>
      <Link href="/" className="inline-block mt-8 bg-gradient-cta text-white font-semibold px-6 py-3 rounded-full">
        Take me home
      </Link>
    </div>
  );
}
