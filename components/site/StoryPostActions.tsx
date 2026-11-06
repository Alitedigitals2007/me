'use client';

import { useState, useEffect } from 'react';

interface StoryPostActionsProps {
  slug: string;
  title: string;
  initialLikes: number;
}

interface Comment {
  id: number;
  name: string;
  content: string;
  created_at: string;
}

export default function StoryPostActions({ slug, title, initialLikes }: StoryPostActionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/stories/like/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.like_count !== undefined) setLikes(data.like_count);
        if (data.liked !== undefined) setLiked(data.liked);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (showComments) {
      fetch(`/api/stories/comments/${slug}`)
        .then((res) => res.json())
        .then((data) => setComments(data.comments || []))
        .catch(() => {});
    }
  }, [showComments, slug]);

  async function handleLike() {
    if (loading) return;
    try {
      const res = await fetch(`/api/stories/like/${slug}`, { method: 'POST' });
      const data = await res.json();
      if (data.liked !== undefined) {
        setLiked(data.liked);
        setLikes((prev) => (data.liked ? prev + 1 : Math.max(prev - 1, 0)));
      }
    } catch {
      /* ignore */
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;
    setCommenting(true);
    try {
      const res = await fetch(`/api/stories/comments/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), content: comment.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setName('');
        setComment('');
        const fetchRes = await fetch(`/api/stories/comments/${slug}`);
        const fetchData = await fetchRes.json();
        setComments(fetchData.comments || []);
      } else {
        alert(data.error || 'Failed to post comment');
      }
    } catch {
      alert('Failed to post comment');
    }
    setCommenting(false);
  }

  async function handleShare(platform: 'twitter' | 'linkedin' | 'whatsapp' | 'facebook' | 'copy') {
    const url = window.location.href;
    const text = title;

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank', 'width=600,height=400');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
    } else if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
    setShareOpen(false);
  }

  return (
    <div className="mt-12 border-t border-line pt-8 space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleLike}
          className={`inline-flex items-center gap-2 px-4 py-3 rounded-full transition-colors ${
            liked ? 'bg-accent/10 text-accent ring-1 ring-accent/30' : 'bg-paper text-ink-soft ring-1 ring-line hover:ring-accent/50'
          }`}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={liked ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" className={liked ? 'text-accent' : ''}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{likes}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-paper text-ink-soft ring-1 ring-line hover:ring-accent/50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{comments.length} Comments</span>
        </button>

        <button
          onClick={() => setShareOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-paper text-ink-soft ring-1 ring-line hover:ring-accent/50 transition-colors ml-auto"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>Share</span>
        </button>
      </div>

      {showComments && (
        <div className="space-y-4">
          <form onSubmit={handleComment} className="space-y-3">
            <h3 className="font-display font-bold text-lg">Add a comment</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              maxLength={80}
              className="w-full rounded-lg bg-paper ring-1 ring-line px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Your comment..."
              required
              maxLength={2000}
              rows={3}
              className="w-full rounded-lg bg-paper ring-1 ring-line px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <button
              type="submit"
              disabled={commenting || !name.trim() || !comment.trim()}
              className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white disabled:opacity-50"
            >
              {commenting ? 'Posting…' : 'Post comment'}
            </button>
          </form>

          {comments.length > 0 ? (
            <div className="border-t border-line pt-6 space-y-4">
              <h3 className="font-display font-bold text-lg">
                {comments.length} Comment{comments.length !== 1 ? 's' : ''}
              </h3>
              {comments.map((c) => (
                <div key={c.id} className="rounded-xl bg-card ring-1 ring-line p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-semibold text-sm">{c.name}</span>
                    <span className="text-xs text-muted">
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                      {new Date(c.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft break-words whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center py-8">No comments yet. Be the first!</p>
          )}
        </div>
      )}

      {shareOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center p-4" onClick={() => setShareOpen(false)}>
          <div className="bg-card rounded-2xl shadow-lift ring-1 ring-line p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-lg mb-4">Share this story</h3>
            <p className="text-sm text-muted mb-6 truncate">{title}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button onClick={() => handleShare('twitter')} className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-paper ring-1 ring-line hover:ring-accent/50 transition-colors">
                <span className="text-lg font-bold text-sky-500">𝕏</span>
                <span className="text-xs font-semibold">Twitter</span>
              </button>
              <button onClick={() => handleShare('linkedin')} className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-paper ring-1 ring-line hover:ring-accent/50 transition-colors">
                <span className="text-lg font-bold text-blue-700">in</span>
                <span className="text-xs font-semibold">LinkedIn</span>
              </button>
              <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-paper ring-1 ring-line hover:ring-accent/50 transition-colors">
                <span className="text-lg font-bold text-green-500">✆</span>
                <span className="text-xs font-semibold">WhatsApp</span>
              </button>
              <button onClick={() => handleShare('facebook')} className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-paper ring-1 ring-line hover:ring-accent/50 transition-colors">
                <span className="text-lg font-bold text-blue-600">f</span>
                <span className="text-xs font-semibold">Facebook</span>
              </button>
            </div>
            <button onClick={() => handleShare('copy')} className="w-full mt-3 rounded-xl bg-paper ring-1 ring-line px-4 py-3 text-xs font-semibold hover:ring-accent/50 transition-colors">
              Copy link
            </button>
            <button onClick={() => setShareOpen(false)} className="mt-4 w-full rounded-lg ring-1 ring-line text-sm font-semibold px-3 py-2 hover:bg-paper transition">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
