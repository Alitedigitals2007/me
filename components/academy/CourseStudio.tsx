'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/admin/ImageUploader';

interface Course {
  id: number; title: string; slug: string; description: string; price: string; status: string;
  delivery: string; level: string; duration: string; image_url: string; link: string; order_index: number;
}
interface Lesson {
  id: number; title: string; content: string; video_url: string; material_url: string;
  material_name: string; order_index: number; is_free_preview: boolean; module_id: number | null;
}
interface Mod { id: number; title: string; order_index: number; lessons: Lesson[] }
interface Assignment { id: number; title: string; instructions: string; due_at: string | null; max_score: number }
interface Question { id: number; question: string; options: string[]; correct_index: number }
interface Quiz { id: number; title: string; pass_pct: number; questions: Question[] }
interface ClassSession { id: number; title: string; starts_at: string; join_url: string; recording_url: string }

const input = 'rounded-xl bg-paper ring-1 ring-line px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent w-full';
const btn = 'px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white disabled:opacity-60';
const btnGhost = 'px-5 py-2.5 rounded-full text-sm font-semibold ring-1 ring-line hover:ring-accent/50';

export default function CourseStudio({
  course, modules, assignments, quizzes, sessions
}: {
  course: Course; modules: Mod[]; assignments: Assignment[]; quizzes: Quiz[]; sessions: ClassSession[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'basics' | 'curriculum' | 'assignments' | 'quizzes' | 'classes'>('curriculum');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editingLesson, setEditingLesson] = useState<number | null>(null);
  const [expandedQuiz, setExpandedQuiz] = useState<number | null>(null);

  async function call(entity: string, method: 'POST' | 'PATCH' | 'DELETE', body: Record<string, unknown> | null, id?: number) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/academy/${entity}${id ? `/${id}` : ''}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json().catch(() => null);
      if (res.status === 401) { window.location.href = '/login?next=/admin'; return false; }
      if (!res.ok) { setError(data?.error || 'Action failed'); return false; }
      router.refresh();
      return true;
    } catch {
      setError('Action failed');
      return false;
    } finally {
      setBusy(false);
    }
  }

  // --- Basics form ---
  const [basics, setBasics] = useState({
    title: course.title, slug: course.slug, description: course.description, price: String(course.price),
    status: course.status, delivery: course.delivery, level: course.level, duration: course.duration,
    image_url: course.image_url, link: course.link, order_index: course.order_index
  });

  // --- New item forms ---
  const [newModule, setNewModule] = useState('');
  const [lessonForm, setLessonForm] = useState({ module_id: 0, title: '', content: '', video_url: '', material_url: '', material_name: '', order_index: 0, is_free_preview: false });
  const [assignForm, setAssignForm] = useState({ title: '', instructions: '', due_at: '', max_score: 100 });
  const [quizForm, setQuizForm] = useState({ title: '', pass_pct: 60 });
  const [qForm, setQForm] = useState({ question: '', o1: '', o2: '', o3: '', o4: '', correct: 0 });
  const [classForm, setClassForm] = useState({ title: '', starts_at: '', join_url: '', recording_url: '' });

  const allLessons = modules.flatMap((m) => m.lessons);

  const TABS: [typeof tab, string][] = [
    ['curriculum', 'Curriculum'],
    ['basics', 'Basics'],
    ['assignments', 'Assignments'],
    ['quizzes', 'Quizzes'],
    ['classes', 'Live classes']
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${tab === key ? 'bg-accent text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]' : 'bg-card ring-1 ring-line hover:ring-accent/50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {tab === 'basics' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await call('courses', 'PATCH', { ...basics, price: Number(basics.price) || 0 }, course.id);
            if (ok) setBasics((b) => ({ ...b }));
          }}
          className="rounded-2xl bg-card ring-1 ring-line p-5 space-y-3 max-w-2xl"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <input className={input} value={basics.title} onChange={(e) => setBasics({ ...basics, title: e.target.value })} placeholder="Title" required />
            <input className={input} value={basics.slug} onChange={(e) => setBasics({ ...basics, slug: e.target.value })} placeholder="slug-url" />
            <input className={input} type="number" min={0} step="100" value={basics.price} onChange={(e) => setBasics({ ...basics, price: e.target.value })} placeholder="Price (0 = free)" />
            <input className={input} value={basics.level} onChange={(e) => setBasics({ ...basics, level: e.target.value })} placeholder="Level (e.g. Beginner)" />
            <input className={input} value={basics.duration} onChange={(e) => setBasics({ ...basics, duration: e.target.value })} placeholder="Duration (e.g. 6 weeks)" />
            <input className={input} type="number" value={basics.order_index} onChange={(e) => setBasics({ ...basics, order_index: Number(e.target.value) || 0 })} placeholder="Sort order" />
            <select className={input} value={basics.status} onChange={(e) => setBasics({ ...basics, status: e.target.value })}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select className={input} value={basics.delivery} onChange={(e) => setBasics({ ...basics, delivery: e.target.value })}>
              <option value="internal">Hosted here</option>
              <option value="external">External link</option>
            </select>
            {basics.delivery === 'external' && (
              <input className={input} value={basics.link} onChange={(e) => setBasics({ ...basics, link: e.target.value })} placeholder="External course URL" />
            )}
            <div className="sm:col-span-2">
              <ImageUploader label="Course image" folder="courses" value={basics.image_url} onChange={(url) => setBasics((b) => ({ ...b, image_url: url }))} />
            </div>
          </div>
          <textarea className={`${input} h-24`} value={basics.description} onChange={(e) => setBasics({ ...basics, description: e.target.value })} placeholder="Description" />
          <button className={btn} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </form>
      )}

      {tab === 'curriculum' && (
        <div className="space-y-5">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await call('modules', 'POST', { course_id: course.id, title: newModule, order_index: modules.length })) setNewModule('');
            }}
            className="flex gap-2 max-w-xl"
          >
            <input className={input} value={newModule} onChange={(e) => setNewModule(e.target.value)} placeholder="New module / section title" required />
            <button className={btn} disabled={busy}>+ Add module</button>
          </form>

          <LessonForm
            busy={busy}
            form={lessonForm}
            setForm={setLessonForm}
            modules={modules}
            onSubmit={async () => {
              const { module_id, ...rest } = lessonForm;
              if (await call('lessons', 'POST', { ...rest, course_id: course.id, module_id: module_id || null })) {
                setLessonForm({ module_id: lessonForm.module_id, title: '', content: '', video_url: '', material_url: '', material_name: '', order_index: 0, is_free_preview: false });
              }
            }}
          />

          {allLessons.length === 0 && modules.length === 0 && (
            <p className="text-sm text-muted rounded-2xl bg-card ring-1 ring-line p-6">No content yet — add a module and lessons above.</p>
          )}

          {modules.map((m) => (
            <div key={m.id} className="rounded-2xl bg-card ring-1 ring-line p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display font-bold uppercase text-sm text-accent">{m.title}</p>
                {m.id > 0 && (
                  <AdminApiButtonMini url={`/api/admin/academy/modules/${m.id}`} method="DELETE" label="Delete module" confirmText="Delete module (lessons stay, ungrouped)?" busy={busy} />
                )}
              </div>
              <div className="mt-3 space-y-2">
                {m.lessons.map((l) => (
                  <div key={l.id} className="rounded-xl bg-paper ring-1 ring-line p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted font-mono">#{l.order_index}</span>
                      <span className="text-sm font-semibold flex-1 min-w-0 truncate">{l.title}</span>
                      {l.is_free_preview && <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Free</span>}
                      {l.video_url && <span className="text-xs">🎬</span>}
                      {l.material_url && <span className="text-xs">📄</span>}
                      <button onClick={() => setEditingLesson(editingLesson === l.id ? null : l.id)} className="text-xs font-semibold text-accent">{editingLesson === l.id ? 'Close' : 'Edit'}</button>
                      <AdminApiButtonMini url={`/api/admin/academy/lessons/${l.id}`} method="DELETE" label="✕" confirmText="Delete this lesson?" busy={busy} />
                    </div>
                    {editingLesson === l.id && (
                      <InlineLessonEdit
                        lesson={l}
                        modules={modules}
                        busy={busy}
                        onSave={async (f) => {
                          const ok = await call('lessons', 'PATCH', {
                            title: f.title, content: f.content, video_url: f.video_url, material_url: f.material_url,
                            material_name: f.material_name, order_index: Number(f.order_index) || 0,
                            is_free_preview: f.is_free_preview, module_id: f.module_id || null
                          }, l.id);
                          if (ok) setEditingLesson(null);
                        }}
                      />
                    )}
                  </div>
                ))}
                {m.lessons.length === 0 && <p className="text-xs text-muted">No lessons in this module yet.</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'assignments' && (
        <div className="space-y-5 max-w-3xl">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await call('assignments', 'POST', { course_id: course.id, ...assignForm, due_at: assignForm.due_at || '', max_score: Number(assignForm.max_score) || 100 })) {
                setAssignForm({ title: '', instructions: '', due_at: '', max_score: 100 });
              }
            }}
            className="rounded-2xl bg-card ring-1 ring-line p-5 space-y-3"
          >
            <p className="text-xs font-black uppercase tracking-widest text-accent">New assignment</p>
            <input className={input} value={assignForm.title} onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })} placeholder="Title" required />
            <textarea className={`${input} h-24`} value={assignForm.instructions} onChange={(e) => setAssignForm({ ...assignForm, instructions: e.target.value })} placeholder="Instructions — what should students submit?" />
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-xs text-muted">Deadline
                <input className={`${input} mt-1`} type="datetime-local" value={assignForm.due_at} onChange={(e) => setAssignForm({ ...assignForm, due_at: e.target.value })} />
              </label>
              <label className="text-xs text-muted">Max score
                <input className={`${input} mt-1`} type="number" min={1} value={assignForm.max_score} onChange={(e) => setAssignForm({ ...assignForm, max_score: Number(e.target.value) || 100 })} />
              </label>
            </div>
            <button className={btn} disabled={busy}>+ Add assignment</button>
          </form>

          {assignments.length === 0 && <p className="text-sm text-muted">No assignments yet.</p>}
          {assignments.map((a) => (
            <div key={a.id} className="rounded-2xl bg-card ring-1 ring-line p-5">
              <div className="flex items-center gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-xs text-muted">
                    {a.due_at ? `Due ${new Date(a.due_at).toLocaleString('en-GB')}` : 'No deadline'} · max {a.max_score}
                  </p>
                </div>
                <div className="ml-auto">
                  <AdminApiButtonMini url={`/api/admin/academy/assignments/${a.id}`} method="DELETE" label="Delete" confirmText="Delete assignment and its submissions?" busy={busy} />
                </div>
              </div>
              {a.instructions && <p className="text-sm text-muted mt-2 whitespace-pre-wrap break-words">{a.instructions}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'quizzes' && (
        <div className="space-y-5 max-w-3xl">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await call('quizzes', 'POST', { course_id: course.id, title: quizForm.title, pass_pct: Number(quizForm.pass_pct) || 60 })) {
                setQuizForm({ title: '', pass_pct: 60 });
              }
            }}
            className="rounded-2xl bg-card ring-1 ring-line p-5 flex flex-wrap gap-3 items-end"
          >
            <label className="text-xs text-muted flex-1 min-w-40">Quiz title
              <input className={`${input} mt-1`} value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="e.g. Final quiz" required />
            </label>
            <label className="text-xs text-muted w-28">Pass %
              <input className={`${input} mt-1`} type="number" min={1} max={100} value={quizForm.pass_pct} onChange={(e) => setQuizForm({ ...quizForm, pass_pct: Number(e.target.value) || 60 })} />
            </label>
            <button className={btn} disabled={busy}>+ Add quiz</button>
          </form>

          {quizzes.length === 0 && <p className="text-sm text-muted">No quizzes yet.</p>}
          {quizzes.map((q) => (
            <div key={q.id} className="rounded-2xl bg-card ring-1 ring-line p-5">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-semibold">{q.title}</p>
                  <p className="text-xs text-muted">{q.questions.length} questions · pass {q.pass_pct}%</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => setExpandedQuiz(expandedQuiz === q.id ? null : q.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-paper ring-1 ring-line">
                    {expandedQuiz === q.id ? 'Close' : 'Questions'}
                  </button>
                  <AdminApiButtonMini url={`/api/admin/academy/quizzes/${q.id}`} method="DELETE" label="Delete" confirmText="Delete quiz and its questions?" busy={busy} />
                </div>
              </div>

              {expandedQuiz === q.id && (
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  {q.questions.map((qq, i) => (
                    <div key={qq.id} className="flex items-start gap-3 rounded-xl bg-paper ring-1 ring-line p-3">
                      <span className="text-xs text-muted font-mono mt-0.5">{i + 1}.</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold break-words">{qq.question}</p>
                        <div className="grid grid-cols-2 gap-1 mt-1.5">
                          {qq.options.map((o, oi) => (
                            <span key={oi} className={`text-xs px-2 py-1 rounded ${oi === qq.correct_index ? 'bg-emerald-500/10 text-emerald-700 font-bold' : 'text-muted'}`}>
                              {String.fromCharCode(65 + oi)}. {o} {oi === qq.correct_index ? '✓' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                      <AdminApiButtonMini url={`/api/admin/academy/questions/${qq.id}`} method="DELETE" label="✕" confirmText="Delete question?" busy={busy} />
                    </div>
                  ))}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const options = [qForm.o1, qForm.o2, qForm.o3, qForm.o4].map((o) => o.trim()).filter(Boolean);
                      if (options.length < 2) { setError('Provide at least 2 options'); return; }
                      if (await call('questions', 'POST', { quiz_id: q.id, question: qForm.question, options, correct_index: Math.min(qForm.correct, options.length - 1), order_index: q.questions.length })) {
                        setQForm({ question: '', o1: '', o2: '', o3: '', o4: '', correct: 0 });
                      }
                    }}
                    className="rounded-xl bg-paper ring-1 ring-line p-4 space-y-3"
                  >
                    <p className="text-xs font-black uppercase tracking-widest text-accent">Add question</p>
                    <input className={input} value={qForm.question} onChange={(e) => setQForm({ ...qForm, question: e.target.value })} placeholder="Question" required />
                    <div className="grid sm:grid-cols-2 gap-2">
                      {([['o1', 0], ['o2', 1], ['o3', 2], ['o4', 3]] as const).map(([key, idx]) => (
                        <label key={key} className="flex items-center gap-2">
                          <input type="radio" name={`correct-${q.id}`} checked={qForm.correct === idx} onChange={() => setQForm({ ...qForm, correct: idx })} className="accent-accent shrink-0" title="Correct answer" />
                          <input className={input} value={qForm[key]} onChange={(e) => setQForm({ ...qForm, [key]: e.target.value })} placeholder={`Option ${String.fromCharCode(65 + idx)}${idx < 2 ? ' *' : ''}`} required={idx < 2} />
                        </label>
                      ))}
                    </div>
                    <button className={btn} disabled={busy}>+ Add question</button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'classes' && (
        <div className="space-y-5 max-w-3xl">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await call('sessions', 'POST', { course_id: course.id, ...classForm })) {
                setClassForm({ title: '', starts_at: '', join_url: '', recording_url: '' });
              }
            }}
            className="rounded-2xl bg-card ring-1 ring-line p-5 space-y-3"
          >
            <p className="text-xs font-black uppercase tracking-widest text-accent">Schedule live class</p>
            <input className={input} value={classForm.title} onChange={(e) => setClassForm({ ...classForm, title: e.target.value })} placeholder="Class title" required />
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-xs text-muted">Starts
                <input className={`${input} mt-1`} type="datetime-local" value={classForm.starts_at} onChange={(e) => setClassForm({ ...classForm, starts_at: e.target.value })} required />
              </label>
              <label className="text-xs text-muted">Join link (Zoom/Meet)
                <input className={`${input} mt-1`} value={classForm.join_url} onChange={(e) => setClassForm({ ...classForm, join_url: e.target.value })} placeholder="https://…" />
              </label>
            </div>
            <label className="text-xs text-muted">Recording link (after class)
              <input className={`${input} mt-1`} value={classForm.recording_url} onChange={(e) => setClassForm({ ...classForm, recording_url: e.target.value })} placeholder="https://…" />
            </label>
            <button className={btn} disabled={busy}>+ Add class</button>
          </form>

          {sessions.length === 0 && <p className="text-sm text-muted">No classes scheduled yet.</p>}
          {sessions.map((s) => (
            <div key={s.id} className="rounded-2xl bg-card ring-1 ring-line p-5 flex items-center gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{s.title}</p>
                <p className="text-xs text-muted">{new Date(s.starts_at).toLocaleString('en-GB')}</p>
                {s.join_url && <p className="text-xs text-accent truncate">{s.join_url}</p>}
              </div>
              <div className="ml-auto">
                <AdminApiButtonMini url={`/api/admin/academy/sessions/${s.id}`} method="DELETE" label="Delete" confirmText="Delete this class?" busy={busy} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminApiButtonMini({ url, method, label, confirmText, busy }: { url: string; method: 'DELETE'; label: string; confirmText?: string; busy: boolean }) {
  const router = useRouter();
  const [localBusy, setLocalBusy] = useState(false);
  return (
    <button
      disabled={busy || localBusy}
      onClick={async () => {
        if (confirmText && !window.confirm(confirmText)) return;
        setLocalBusy(true);
        try {
          const res = await fetch(url, { method });
          if (res.status === 401) { window.location.href = '/login?next=/admin'; return; }
          const data = await res.json().catch(() => null);
          if (!res.ok) window.alert(data?.error || 'Action failed');
          else router.refresh();
        } catch {
          window.alert('Action failed');
        } finally {
          setLocalBusy(false);
        }
      }}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-paper ring-1 ring-line text-ink-soft hover:ring-danger/40 transition-all disabled:opacity-50"
    >
      {localBusy ? '…' : label}
    </button>
  );
}

function LessonForm({
  form, setForm, modules, onSubmit, busy, compact = false, submitLabel = 'Add lesson'
}: {
  form: { module_id: number; title: string; content: string; video_url: string; material_url: string; material_name: string; order_index: number; is_free_preview: boolean };
  setForm: (f: typeof form) => void;
  modules: Mod[];
  onSubmit: (f: typeof form) => void | Promise<void>;
  busy: boolean;
  compact?: boolean;
  submitLabel?: string;
}) {
  const [showAdvanced, setShowAdvanced] = useState(!!form.video_url || !!form.material_url || !!form.content);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className={`rounded-2xl bg-card ring-1 ring-line p-4 space-y-3 ${compact ? '' : 'max-w-3xl'}`}
    >
      {!compact && <p className="text-xs font-black uppercase tracking-widest text-accent">Add lesson</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lesson title" required />
        <select className={input} value={form.module_id} onChange={(e) => setForm({ ...form, module_id: Number(e.target.value) })}>
          <option value={0}>— No module —</option>
          {modules.filter((m) => m.id > 0).map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      </div>

      {showAdvanced && (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-muted">Video link (YouTube/Vimeo/Drive — plays embedded, not downloadable)
              <input className={`${input} mt-1`} value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=…" />
            </label>
            <label className="text-xs text-muted">Material link (opens in browser — view only)
              <div className="grid sm:grid-cols-2 gap-2 mt-1">
                <input className={input} value={form.material_name} onChange={(e) => setForm({ ...form, material_name: e.target.value })} placeholder="Label (e.g. Class notes)" />
                <input className={input} value={form.material_url} onChange={(e) => setForm({ ...form, material_url: e.target.value })} placeholder="https://…" />
              </div>
            </label>
          </div>
          <textarea className={`${input} h-32`} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Lesson content / notes (students read this)" />
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="text-xs text-muted">Order
              <input className={`${input} mt-1`} type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) || 0 })} />
            </label>
            <label className="flex items-center gap-2 text-xs text-muted mt-5">
              <input type="checkbox" checked={form.is_free_preview} onChange={(e) => setForm({ ...form, is_free_preview: e.target.checked })} className="accent-accent" />
              Free preview (no enrollment needed)
            </label>
          </div>
        </>
      )}

      <div className="flex gap-2 flex-wrap">
        {!showAdvanced && (
          <button type="button" onClick={() => setShowAdvanced(true)} className={btnGhost}>+ Content, video & material</button>
        )}
        <button className={btn} disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}

function InlineLessonEdit({
  lesson, modules, busy, onSave
}: {
  lesson: Lesson;
  modules: Mod[];
  busy: boolean;
  onSave: (f: { module_id: number; title: string; content: string; video_url: string; material_url: string; material_name: string; order_index: number; is_free_preview: boolean }) => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    module_id: lesson.module_id || 0,
    title: lesson.title,
    content: lesson.content,
    video_url: lesson.video_url,
    material_url: lesson.material_url,
    material_name: lesson.material_name,
    order_index: lesson.order_index,
    is_free_preview: lesson.is_free_preview
  });
  return (
    <div className="mt-3">
      <LessonForm busy={busy} form={form} setForm={setForm} modules={modules} compact submitLabel="Save lesson" onSubmit={onSave} />
    </div>
  );
}
