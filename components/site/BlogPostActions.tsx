'use client';

import { useState, useEffect } from 'react';

interface BlogPostActionsProps {
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

export default function BlogPostActions({ slug, title, initialLikes }: BlogPostActionsProps) {
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
    fetch(`/api/blog/like/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.like_count !== undefined) setLikes(data.like_count);
        if (data.liked !== undefined) setLiked(data.liked);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (showComments) {
      fetch(`/api/blog/comments/${slug}`)
        .then(res => res.json())
        .then(data => setComments(data.comments || []));
    }
  }, [showComments, slug]);

  async function handleLike() {
    if (loading) return;
    try {
      const res = await fetch(`/api/blog/like/${slug}`, { method: 'POST' });
      const data = await res.json();
      if (data.liked !== undefined) {
        setLiked(data.liked);
        setLikes(prev => data.liked ? prev + 1 : prev - 1);
      }
    } catch (e) {
      console.error('Like failed', e);
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;
    setCommenting(true);
    try {
      const res = await fetch(`/api/blog/comments/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), comment: comment.trim() })
      });
      if (res.ok) {
        setName('');
        setComment('');
        const data = await fetch(`/api/blog/comments/${slug}`).then(r => r.json());
        setComments(data.comments || []);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to post comment');
      }
    } catch (e) {
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

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-4 text-muted text-sm">
        <div className="w-12 h-5 bg-paper rounded animate-pulse"></div>
        <div className="w-20 h-5 bg-paper rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t border-line pt-8 space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleLike}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
            liked 
              ? 'bg-accent/10 text-accent ring-1 ring-accent/30' 
              : 'bg-paper text-ink-soft ring-1 ring-line hover:ring-accent/50'
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-paper text-ink-soft ring-1 ring-line hover:ring-accent/50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{comments.length} Comments</span>
        </button>

        <button
          onClick={() => setShareOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-paper text-ink-soft ring-1 ring-line hover:ring-accent/50 transition-colors ml-auto"
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
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              required
              maxLength={80}
              className="w-full rounded-lg bg-paper ring-1 ring-line px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
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

          {comments.length > 0 && (
            <div className="border-t border-line pt-6 space-y-4">
              <h3 className="font-display font-bold text-lg">{comments.length} Comment{comments.length !== 1 ? 's' : ''}</h3>
              {comments.map((c) => (
                <div key={c.id} className="rounded-xl bg-card ring-1 ring-line p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-semibold text-sm">{c.name}</span>
                    <span className="text-xs text-muted">{new Date(c.created_at).toLocaleDateString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <p className="text-sm text-ink-soft whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          {comments.length === 0 && showComments && (
            <p className="text-muted text-center py-8">No comments yet. Be the first!</p>
          )}
        </div>
      )}

      {shareOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center p-4" onClick={() => setShareOpen(false)}>
          <div className="bg-card rounded-2xl shadow-lift ring-1 ring-line p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-lg mb-4">Share this post</h3>
            <p className="text-sm text-muted mb-6 truncate">{title}</p>
            <div className="grid grid-cols-4 gap-3">
              <button onClick={() => handleShare('twitter')} className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-paper ring-1 ring-line hover:ring-accent/50 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-sky-500">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 9.24-3.363.92-8.8-9.693-5.327 7.79-3.286-.954L.43 11.493l8.32-9.663 8.494 9.228zm0 0" />
                </svg>
                <span className="text-xs font-semibold">Twitter</span>
              </button>
              <button onClick={() => handleShare('linkedin')} className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-paper ring-1 ring-line hover:ring-accent/50 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-blue-700">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="text-xs font-semibold">LinkedIn</span>
              </button>
              <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-paper ring-1 ring-line hover:ring-accent/50 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.472.099-.174.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a19.79 19.79 0 0 1-4.944-1.132 17.8 17.8 0 0 1-4.126-3.37 20.5 20.5 0 0 1-2.89-4.817C1.56 13.906.33 13.61 0 13.156v-.362c.376-.52.978-.803 1.856-1.238a34.035 34.035 0 0 1 5.284-4.146 14.3 14.3 0 0 1 3.185-1.44c1.645-.375 3.184-.663 4.833-.786 1.635-.112 3.27-.112 4.828 0 1.653.123 3.187.41 4.833.786 1.502.43 2.849 1.03 3.932 1.82 1.067.777 1.86 1.744 2.388 2.848.637 1.299.637 2.646.52 3.876-.11 1.262-.31 1.894-.83 2.475a16.5 16.5 0 0 1-4.521 5.074c-1.617 1.262-3.35 2.172-5.472 2.528-.507.084-1.015.134-1.522.134zm4.074-4.464c-.418.694-1.246 1.164-2.025 1.262-.779.087-1.758-.298-2.463-.992-.705-.694-1.01-1.443-1.083-1.722-.074-.272-.458-.694-.087-1.082.488-.507 1.298-.675 2.125-.719.71-.027 1.408.134 1.767.447.348.306.625.779.699 1.138.087.418-.2.918-.719 1.262-.42.272-1.016.372-1.556.372-.735 0-1.353-.298-1.872-.94zm5.934-6.96c-.135.372-.568.867-1.277 1.164-.71.306-1.42.373-2.275.298-.854-.074-1.664-.41-2.36-1.06-.695-.676-.967-1.376-1.01-1.706-.043-.329.306-.616.704-.77.398-.149 1.06-.298 1.776-.223.705.074 1.41.306 2.025 1.01.615.71.694 1.695.497 2.417-.185.71-.644 1.164-1.04 1.413z" />
                </svg>
                <span className="text-xs font-semibold">WhatsApp</span>
              </button>
              <button onClick={() => handleShare('facebook')} className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-paper ring-1 ring-line hover:ring-accent/50 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                  <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4Z" />
                </svg>
                <span className="text-xs font-semibold">Facebook</span>
              </button>
            </div>
            <button onClick={() => handleShare('copy')} className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-paper ring-1 ring-line hover:ring-accent/50 transition-colors w-full mt-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span className="text-xs font-semibold">Copy link</span>
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