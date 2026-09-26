'use client';

import { useState } from 'react';

export default function IssueCertForm({
  students, courses
}: {
  students: { id: number; name: string; email: string }[];
  courses: { id: number; title: string }[];
}) {
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function issue(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/academy/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: Number(studentId), course_id: Number(courseId) })
      });
      const data = await res.json();
      if (res.status === 401) { window.location.href = '/login?next=/admin'; return; }
      if (!res.ok) throw new Error(data.error || 'Issue failed');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Issue failed');
      setLoading(false);
    }
  }

  if (!students.length || !courses.length) {
    return <p className="text-sm text-muted">Need at least one student and one course to issue manually.</p>;
  }

  return (
    <form onSubmit={issue} className="flex flex-wrap items-end gap-3">
      <label className="text-xs text-muted">
        Student
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
          className="mt-1 rounded-xl bg-paper ring-1 ring-line px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Choose…</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
        </select>
      </label>
      <label className="text-xs text-muted">
        Course
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          required
          className="mt-1 rounded-xl bg-paper ring-1 ring-line px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Choose…</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </label>
      <button disabled={loading} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white disabled:opacity-60">
        {loading ? 'Issuing…' : 'Issue certificate'}
      </button>
      {error && <span className="text-sm text-danger">{error}</span>}
    </form>
  );
}
