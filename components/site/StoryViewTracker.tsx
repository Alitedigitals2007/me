'use client';

import { useEffect, useRef } from 'react';

/** Fires a single unique-view ping for a story when the page mounts. */
export default function StoryViewTracker({ slug }: { slug: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(`/api/stories/view/${slug}`, { method: 'POST', keepalive: true }).catch(() => {});
  }, [slug]);
  return null;
}
