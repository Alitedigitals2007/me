'use client';

import { motion } from 'framer-motion';
import { BlogCard } from './Cards';
import type { BlogPost } from '@/lib/types';

const EASE = [0.16, 1, 0.3, 1] as const;

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 }
  }
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.97, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.65, ease: EASE }
  }
};

export default function BlogGrid({ posts }: { posts: BlogPost[] }) {
  return (
    <motion.div
      className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
    >
      {posts.map((p) => (
        <motion.div key={p.id} variants={item} className="h-full [&>a]:h-full">
          <BlogCard p={p} />
        </motion.div>
      ))}
    </motion.div>
  );
}
