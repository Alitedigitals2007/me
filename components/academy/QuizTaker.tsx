'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Q {
  id: number;
  question: string;
  options: string[];
}

export default function QuizTaker({ quizId, questions, passPct }: { quizId: number; questions: Q[]; passPct: number }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean; certificate: string | null } | null>(null);

  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/student/quizzes/${quizId}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit');
      setResult({ score: data.score, total: data.total, passed: data.passed, certificate: data.certificate });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-3xl bg-card ring-1 ring-line shadow-card p-8 text-center">
        <p className="text-5xl mb-3">{result.passed ? '🎉' : '🔁'}</p>
        <h2 className="font-display font-extrabold uppercase text-2xl">
          {result.passed ? 'Passed!' : 'Not passed yet'}
        </h2>
        <p className="text-muted mt-2">
          You scored <span className="text-ink font-bold">{result.score}/{result.total}</span> ({Math.round((result.score / result.total) * 100)}%) — pass mark {passPct}%
        </p>
        {result.certificate && (
          <Link href="/dashboard#certificates" className="inline-block mt-4 text-emerald-600 font-semibold underline">
            🎓 Certificate issued — view it
          </Link>
        )}
        <div className="mt-6">
          <button
            onClick={() => { setResult(null); setAnswers({}); }}
            className="rounded-full bg-card ring-1 ring-line px-6 py-3 text-sm font-semibold hover:ring-accent/50 transition-all"
          >
            Retake quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={q.id} className="rounded-3xl bg-card ring-1 ring-line shadow-card p-6">
          <p className="text-xs font-black uppercase tracking-widest text-accent mb-2">Question {qi + 1} of {questions.length}</p>
          <p className="font-semibold">{q.question}</p>
          <div className="grid sm:grid-cols-2 gap-2 mt-4">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                className={`text-left rounded-xl px-4 py-3 text-sm ring-1 transition-all ${
                  answers[q.id] === oi ? 'bg-accent text-white ring-accent' : 'bg-paper ring-line hover:ring-accent/40'
                }`}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        onClick={submit}
        disabled={loading || answeredCount < questions.length}
        className="w-full sm:w-auto bg-gradient-cta text-white font-semibold px-8 py-3.5 rounded-full shadow-[0_8px_24px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
      >
        {loading ? 'Scoring…' : `Submit quiz (${answeredCount}/${questions.length} answered)`}
      </button>
    </div>
  );
}
