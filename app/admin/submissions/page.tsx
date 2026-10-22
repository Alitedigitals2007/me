import AdminHeader from '@/components/admin/AdminHeader';
import GradeForm from '@/components/academy/GradeForm';
import getPool from '@/lib/db';
import { ensureAcademySchema } from '@/lib/academy-schema';
import { getAdmin } from '@/lib/admin-auth';
import { notFound } from 'next/navigation';

export const metadata = { title: 'Submissions' };
export const dynamic = 'force-dynamic';

export default async function AdminSubmissionsPage() {
  const admin = await getAdmin();
  if (!admin) notFound();
  await ensureAcademySchema();

  const { rows } = await getPool().query(
    `SELECT sub.id, sub.content, sub.file_url, sub.status, sub.score, sub.feedback, sub.submitted_at, sub.graded_at,
            a.title AS assignment_title, a.max_score, a.instructions, a.due_at,
            c.title AS course_title, c.slug AS course_slug,
            st.name AS student_name, st.email AS student_email
     FROM submissions sub
     JOIN assignments a ON a.id = sub.assignment_id
     JOIN courses c ON c.id = a.course_id
     JOIN students st ON st.id = sub.student_id
     ORDER BY (sub.status = 'pending') DESC, sub.submitted_at DESC
     LIMIT 200`
  );
  const pending = rows.filter((r) => r.status === 'pending');
  const graded = rows.filter((r) => r.status !== 'pending');

  const submissionIds = rows.map((r) => r.id);
  const [{ rows: history }, { rows: attempts }] = await Promise.all([
    submissionIds.length
      ? getPool().query(
          `SELECT submission_id, content, file_url, submitted_at FROM submission_history
           WHERE submission_id = ANY($1::int[]) ORDER BY submitted_at ASC`,
          [submissionIds]
        )
      : Promise.resolve({ rows: [] as any[] }),
    getPool().query(
      `SELECT qa.id, qa.quiz_id, qa.answers, qa.score, qa.total, qa.passed, qa.attempted_at,
              q.title AS quiz_title, q.is_final_exam, q.pass_pct, c.title AS course_title,
              st.name AS student_name, st.email AS student_email
       FROM quiz_attempts qa
       JOIN quizzes q ON q.id=qa.quiz_id
       JOIN courses c ON c.id=q.course_id
       JOIN students st ON st.id=qa.student_id
       ORDER BY qa.attempted_at DESC
       LIMIT 100`
    )
  ]);

  const historyBySubmission = new Map<number, any[]>();
  for (const h of history) {
    const list = historyBySubmission.get(h.submission_id) || [];
    list.push(h);
    historyBySubmission.set(h.submission_id, list);
  }

  const quizIds = [...new Set(attempts.map((a) => a.quiz_id))] as number[];
  const { rows: attemptQuestions } = quizIds.length
    ? await getPool().query(
        `SELECT id, quiz_id, question, options, correct_index FROM quiz_questions
         WHERE quiz_id = ANY($1::int[]) ORDER BY quiz_id, order_index ASC, id ASC`,
        [quizIds]
      )
    : { rows: [] as any[] };
  const questionsByQuiz = new Map<number, any[]>();
  for (const q of attemptQuestions) {
    const list = questionsByQuiz.get(q.quiz_id) || [];
    list.push(q);
    questionsByQuiz.set(q.quiz_id, list);
  }

  return (
    <div className="space-y-6">
      <AdminHeader title="Submissions" sub={`${pending.length} to grade · ${attempts.length} quiz attempts saved · Telegram alert on every submission`} />

      <section>
        <h2 className="font-display font-bold uppercase text-lg mb-3">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted rounded-2xl bg-card ring-1 ring-line p-6">Nothing to grade — all caught up.</p>
        ) : (
          <div className="space-y-4">
            {pending.map((s) => (
              <div key={s.id} className="rounded-2xl bg-card ring-1 ring-line p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full">{s.course_title}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">Pending</span>
                  <span className="text-xs text-muted ml-auto">{new Date(s.submitted_at).toLocaleString('en-GB')}</span>
                </div>
                <h3 className="font-display font-bold text-base mt-2">{s.assignment_title}</h3>
                <p className="text-xs text-muted mt-0.5">
                  {s.student_name} · {s.student_email} · max {s.max_score}
                  {s.due_at ? ` · due ${new Date(s.due_at).toLocaleDateString('en-GB')}` : ''}
                </p>
                {s.instructions && <p className="text-xs text-muted mt-2 italic break-words whitespace-pre-wrap">“{s.instructions}”</p>}
                <div className="mt-3 rounded-xl bg-paper ring-1 ring-line p-4">
                  <p className="text-sm text-ink-soft whitespace-pre-wrap break-words">{s.content || '— (file submission only) —'}</p>
                  {s.file_url && (
                    <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent font-semibold underline mt-2 inline-block">
                      📎 Open attached file
                    </a>
                  )}
                </div>
                {(historyBySubmission.get(s.id)?.length || 0) > 0 && (
                  <details className="mt-3 rounded-xl bg-paper ring-1 ring-line p-3">
                    <summary className="text-xs font-semibold text-accent cursor-pointer">
                      All saved responses ({historyBySubmission.get(s.id)?.length})
                    </summary>
                    <div className="mt-2 space-y-2">
                      {[...(historyBySubmission.get(s.id) || [])].reverse().map((h) => (
                        <div key={h.id} className="rounded-lg bg-card ring-1 ring-line p-3">
                          <p className="text-[11px] text-muted">{new Date(h.submitted_at).toLocaleString('en-GB')}</p>
                          <p className="text-sm text-ink-soft whitespace-pre-wrap break-words mt-1">{h.content || '— (file submission only) —'}</p>
                          {h.file_url && (
                            <a href={h.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent font-semibold underline mt-1 inline-block">
                              📎 Attached file
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                <GradeForm submissionId={s.id} maxScore={s.max_score} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display font-bold uppercase text-lg mb-3">Graded ({graded.length})</h2>
        {graded.length === 0 ? (
          <p className="text-sm text-muted">No graded submissions yet.</p>
        ) : (
          <div className="rounded-2xl bg-card ring-1 ring-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-paper text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="text-left px-5 py-3">Student</th>
                    <th className="text-left px-5 py-3">Assignment</th>
                    <th className="text-left px-5 py-3">Course</th>
                    <th className="text-left px-5 py-3">Score</th>
                    <th className="text-left px-5 py-3">Feedback</th>
                    <th className="text-left px-5 py-3">Responses</th>
                    <th className="text-left px-5 py-3">Graded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {graded.map((s) => (
                    <tr key={s.id} className="hover:bg-ink/[0.02]">
                      <td className="px-5 py-3">
                        <p className="font-semibold">{s.student_name}</p>
                        <p className="text-xs text-muted">{s.student_email}</p>
                      </td>
                      <td className="px-5 py-3">{s.assignment_title}</td>
                      <td className="px-5 py-3 text-xs">{s.course_title}</td>
                      <td className="px-5 py-3 font-bold">{s.score ?? '—'}/{s.max_score}</td>
                      <td className="px-5 py-3 text-xs text-muted max-w-56 truncate" title={s.feedback || ''}>{s.feedback || '—'}</td>
                      <td className="px-5 py-3 text-xs">
                        {(historyBySubmission.get(s.id)?.length || 0) === 0 ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <details>
                            <summary className="text-accent font-semibold cursor-pointer">{historyBySubmission.get(s.id)?.length} saved</summary>
                            <div className="mt-2 space-y-2 max-w-sm">
                              {[...(historyBySubmission.get(s.id) || [])].reverse().map((h) => (
                                <div key={h.id} className="rounded-lg bg-paper ring-1 ring-line p-2">
                                  <p className="text-[10px] text-muted">{new Date(h.submitted_at).toLocaleString('en-GB')}</p>
                                  <p className="text-xs text-ink-soft whitespace-pre-wrap break-words mt-1">{h.content || '— (file only) —'}</p>
                                  {h.file_url && (
                                    <a href={h.file_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent font-semibold underline mt-1 inline-block">
                                      📎 File
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">{s.graded_at ? new Date(s.graded_at).toLocaleDateString('en-GB') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display font-bold uppercase text-lg mb-3">Quiz attempts ({attempts.length})</h2>
        {attempts.length === 0 ? (
          <p className="text-sm text-muted rounded-2xl bg-card ring-1 ring-line p-6">No quiz attempts yet.</p>
        ) : (
          <div className="rounded-2xl bg-card ring-1 ring-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-paper text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="text-left px-5 py-3">Student</th>
                    <th className="text-left px-5 py-3">Test</th>
                    <th className="text-left px-5 py-3">Course</th>
                    <th className="text-left px-5 py-3">Score</th>
                    <th className="text-left px-5 py-3">Result</th>
                    <th className="text-left px-5 py-3">Attempted</th>
                    <th className="text-left px-5 py-3">Answers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {attempts.map((a) => {
                    const answers = (a.answers || {}) as Record<string, number>;
                    const qs = questionsByQuiz.get(a.quiz_id) || [];
                    return (
                      <tr key={a.id} className="hover:bg-ink/[0.02] align-top">
                        <td className="px-5 py-3">
                          <p className="font-semibold">{a.student_name}</p>
                          <p className="text-xs text-muted">{a.student_email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p>{a.quiz_title}</p>
                          {a.is_final_exam && <span className="inline-block text-[10px] font-black uppercase text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1">Final exam</span>}
                        </td>
                        <td className="px-5 py-3 text-xs">{a.course_title}</td>
                        <td className="px-5 py-3 font-bold">{a.score}/{a.total}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${a.passed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                            {a.passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted">{new Date(a.attempted_at).toLocaleString('en-GB')}</td>
                        <td className="px-5 py-3">
                          {qs.length === 0 ? (
                            <span className="text-xs text-muted">—</span>
                          ) : (
                            <details>
                              <summary className="text-xs font-semibold text-accent cursor-pointer">View answers</summary>
                              <ol className="mt-2 space-y-2 max-w-md">
                                {qs.map((q, qi) => {
                                  const selected = answers[String(q.id)];
                                  const correct = selected === q.correct_index;
                                  return (
                                    <li key={q.id} className="rounded-lg bg-paper ring-1 ring-line p-2">
                                      <p className="text-xs font-semibold break-words">{qi + 1}. {q.question}</p>
                                      <p className={`text-xs mt-1 ${correct ? 'text-emerald-700' : 'text-danger'}`}>
                                        Answer: {selected !== undefined ? q.options[selected] : 'Not answered'} {correct ? '✓' : '✗'}
                                      </p>
                                      {!correct && <p className="text-xs text-muted">Correct: {q.options[q.correct_index]}</p>}
                                    </li>
                                  );
                                })}
                              </ol>
                            </details>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
