'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

export const COURSE_TEXT_ANIMATIONS = [
  'none',
  'gradient',
  'typewriter',
  'rise',
  'stagger',
  'glitch'
] as const;

export type CourseTextAnimation = (typeof COURSE_TEXT_ANIMATIONS)[number];

export default function AnimatedCourseText({
  text,
  animation = 'none',
  speed = 1,
  className = ''
}: {
  text: string;
  animation?: string;
  speed?: number;
  className?: string;
}) {
  const safeSpeed = Math.min(3, Math.max(1, Number(speed) || 1));
  const [reduced, setReduced] = useState(false);
  const [typed, setTyped] = useState(0);
  const chars = useMemo(() => Array.from(text || ''), [text]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(media.matches);
    const onChange = () => setReduced(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (animation !== 'typewriter' || reduced) {
      setTyped(chars.length);
      return;
    }
    setTyped(0);
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setTyped((n) => {
          if (n >= chars.length) {
            if (interval) clearInterval(interval);
            return n;
          }
          return n + 1;
        });
      }, Math.max(18, 55 / safeSpeed));
    }, Math.max(0, 180 / safeSpeed));
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [animation, chars.length, reduced, safeSpeed]);

  if (animation === 'gradient') {
    return <span className={`text-gradient-animated ${className}`}>{text}</span>;
  }

  if (animation === 'glitch') {
    return (
      <span className={`glitch-text ${className}`} data-text={text}>
        {text}
      </span>
    );
  }

  if (animation === 'typewriter') {
    const shown = reduced ? text : chars.slice(0, typed).join('');
    return (
      <span className={className}>
        <span className="sr-only">{text}</span>
        <span aria-hidden>
          {shown}
          {!reduced && typed < chars.length && <span className="text-cursor">|</span>}
        </span>
      </span>
    );
  }

  if (animation === 'rise' || animation === 'stagger') {
    const words = text.split(/(\s+)/);
    return (
      <span className={className}>
        {words.map((word, index) =>
          /^\s+$/.test(word) ? (
            <span key={index}> </span>
          ) : (
            <span key={index} className="inline-block overflow-hidden align-bottom pb-[0.06em]">
              <motion.span
                className="inline-block"
                initial={
                  reduced
                    ? false
                    : animation === 'rise'
                      ? { y: '110%' }
                      : { opacity: 0, scale: 0.82, filter: 'blur(6px)' }
                }
                animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{
                  duration: (animation === 'rise' ? 0.6 : 0.5) / safeSpeed,
                  delay: (index * 0.06) / safeSpeed,
                  ease: [0.16, 1, 0.3, 1]
                }}
              >
                {word}
              </motion.span>
            </span>
          )
        )}
      </span>
    );
  }

  return <span className={className}>{text}</span>;
}
