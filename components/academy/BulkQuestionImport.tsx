'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ParsedQuestion {
  key: string;
  include: boolean;
  question: string;
  options: string[];
  correct: number;
}

const EXAMPLE = `What does HTML stand for?
A) Hyper Text Markup Language *
B) High Tech Modern Language
C) Home Tool Markup Language
D) Hyperlink Text Machine Language

Which tag creates a link?
A) <link>
B) <a> *
C) <href>
D) <url>`;

function parseOption(line: string): { text: string; correct: boolean } {
  let text = line.trim();
  let correct = false;

  text = text.replace(/^[A-Za-z][).:\-]\s*/, '');
  text = text.replace(/^\d+[).:\-]\s*/, '');
  text = text.replace(/^[-•]\s*/, '');

  if (/^\[[xX]\]/.test(text)) {
    correct = true;
    text = text.replace(/^\[[xX]\]\s*/, '');
  }
  if (/^[*✓✔]/.test(text)) {
    correct = true;
    text = text.replace(/^[*✓✔]\s*/, '');
  }
  if (/[*✓✔]\s*$/.test(text)) {
    correct = true;
    text = text.replace(/\s*[*✓✔]\s*$/, '');
  }
  if (/\(\s*correct(?:\s+answer)?\s*\)/i.test(text)) {
    correct = true;
    text = text.replace(/\s*\(\s*correct(?:\s+answer)?\s*\)/i, '');
  }

  return { text: text.trim(), correct };
}

function parseBulkQuestions(input: string): ParsedQuestion[] {
  const blocks = input.split(/\n\s*\n+/);
  const parsed: ParsedQuestion[] = [];

  blocks.forEach((block, blockIndex) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 3) return;

    const question = lines[0].replace(/^(?:Q\s*\d+\s*[:.)-]?\s*|\d+\s*[.)]\s*)/i, '').trim();
    if (!question) return;

    const options: string[] = [];
    let correct = 0;

    for (const line of lines.slice(1)) {
      const option = parseOption(line);
      if (!option.text) continue;
      if (option.correct) correct = options.length;
      options.push(option.text);
    }

    if (options.length >= 2) {
      parsed.push({
        key: `${blockIndex}-${parsed.length}`,
        include: true,
        question,
        options,
        correct
      });
    }
  });

  return parsed;
}

export default function BulkQuestionImport({ quizId }: { quizId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState<ParsedQuestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedCount = parsed.filter((q) => q.include).length;

  function update(key: string, patch: Partial<ParsedQuestion>) {
    setParsed((list) => list.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  }

  async function copyExample() {
    try {
      await navigator.clipboard.writeText(EXAMPLE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setRaw(EXAMPLE);
    }
  }

  async function importQuestions() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const questions = parsed
        .filter((q) => q.include)
        .map((q) => ({ question: q.question, options: q.options, correct_index: q.correct }));
      if (!questions.length) throw new Error('Tick at least one question to import.');

      const res = await fetch('/api/admin/academy/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz_id: quizId, questions })
      });
      if (res.status === 401) {
        window.location.href = '/login?next=/admin';
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Bulk import failed');

      setNotice(`${data.count} question${data.count === 1 ? '' : 's'} imported.`);
      setRaw('');
      setParsed([]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bulk import failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl bg-paper ring-1 ring-line p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2 rounded-full text-xs font-semibold bg-card ring-1 ring-line hover:ring-accent/50 transition-all"
      >
        {open ? 'Close bulk import' : 'Bulk import questions'}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">
              Paste questions separated by a blank line. Tick the correct answer with <b>*</b>, <b>✓</b>, or <b>[x]</b>.
            </p>
            <button
              type="button"
              onClick={copyExample}
              className="text-xs font-semibold text-accent hover:underline"
            >
              {copied ? 'Example copied' : 'Copy example format'}
            </button>
          </div>

          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={8}
            placeholder={EXAMPLE}
            className="w-full rounded-xl bg-card ring-1 ring-line px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent resize-y font-mono"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const next = parseBulkQuestions(raw);
                setParsed(next);
                setError(next.length ? '' : 'No valid questions found. Leave a blank line between questions and include at least 2 options.');
                setNotice('');
              }}
              disabled={!raw.trim()}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-gradient-cta text-white disabled:opacity-50"
            >
              Preview questions
            </button>
            <button
              type="button"
              onClick={() => { setRaw(''); setParsed([]); setError(''); setNotice(''); }}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-card ring-1 ring-line"
            >
              Clear
            </button>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {notice && <p className="text-sm text-emerald-600 font-semibold">{notice}</p>}

          {parsed.length > 0 && (
            <>
              <p className="text-xs text-muted">
                Review below. Tick the correct answer for each question, and untick any question you do not want to import.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {parsed.map((q, qi) => (
                  <div key={q.key} className={`rounded-xl p-3 ring-1 transition-opacity ${q.include ? 'bg-card ring-line' : 'bg-card/50 ring-line opacity-60'}`}>
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={q.include}
                        onChange={(e) => update(q.key, { include: e.target.checked })}
                        className="mt-1 accent-accent shrink-0"
                        title="Import this question"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold break-words">{qi + 1}. {q.question}</p>
                        <div className="grid sm:grid-cols-2 gap-1 mt-2">
                          {q.options.map((option, oi) => (
                            <label
                              key={oi}
                              className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ring-1 cursor-pointer transition-colors ${
                                q.correct === oi ? 'ring-emerald-500 bg-emerald-500/10 text-emerald-700 font-bold' : 'ring-line bg-paper'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`bulk-correct-${q.key}`}
                                checked={q.correct === oi}
                                onChange={() => update(q.key, { correct: oi })}
                                className="accent-accent shrink-0"
                              />
                              <span className="break-words">{String.fromCharCode(65 + oi)}. {option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setParsed((list) => list.filter((x) => x.key !== q.key))}
                        className="text-xs font-semibold text-muted hover:text-danger"
                        title="Remove question"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={importQuestions}
                disabled={busy || selectedCount === 0}
                className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-cta text-white disabled:opacity-60"
              >
                {busy ? 'Importing…' : `Import ${selectedCount} question${selectedCount === 1 ? '' : 's'}`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
