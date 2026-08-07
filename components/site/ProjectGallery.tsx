'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ProjectGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, images.length]);

  if (!images.length) return null;
  const current = images[index];

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setLightbox(true)}
        className="group block w-full text-left"
        title="Click to view fullscreen"
      >
        <div className="relative overflow-hidden rounded-2xl ring-1 ring-line shadow-card">
          <img src={current} alt={alt} className="w-full max-h-[520px] object-cover group-hover:scale-[1.01] transition-transform duration-500" />
          <span className="absolute bottom-3 right-3 bg-ink/70 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur">
            ⛶ View fullscreen
          </span>
        </div>
      </button>

      {images.length > 1 && (
        <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setIndex(i)}
              className={`shrink-0 rounded-xl overflow-hidden ring-2 transition-all ${
                i === index ? 'ring-accent' : 'ring-transparent hover:ring-line'
              }`}
            >
              <img src={img} alt="" className="w-20 h-14 object-cover" />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-ink/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              type="button"
              className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 text-white text-xl grid place-items-center hover:bg-white/20"
              onClick={() => setLightbox(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <button
              type="button"
              className="absolute left-3 md:left-8 w-11 h-11 rounded-full bg-white/10 text-white text-xl grid place-items-center hover:bg-white/20 disabled:opacity-30"
              onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + images.length) % images.length); }}
              disabled={images.length < 2}
              aria-label="Previous"
            >
              ‹
            </button>
            <img
              src={current}
              alt={alt}
              className="max-w-full max-h-full rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              className="absolute right-3 md:right-8 w-11 h-11 rounded-full bg-white/10 text-white text-xl grid place-items-center hover:bg-white/20 disabled:opacity-30"
              onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % images.length); }}
              disabled={images.length < 2}
              aria-label="Next"
            >
              ›
            </button>
            {images.length > 1 && (
              <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-sm font-semibold">
                {index + 1} / {images.length} — use ← → keys
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
