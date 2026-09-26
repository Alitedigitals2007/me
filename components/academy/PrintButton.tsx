'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full bg-gradient-cta text-white font-semibold px-5 py-2 text-xs"
    >
      Print / Save as PDF
    </button>
  );
}
