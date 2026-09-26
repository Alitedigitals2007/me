import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';
import { ensureAcademySchema } from '@/lib/academy-schema';
import { checkAndIssueCertificate } from '@/lib/academy';

export const runtime = 'nodejs';

const PATCHABLE: Record<string, string[]> = {
  courses: ['title', 'slug', 'description', 'price', 'status', 'delivery', 'level', 'duration', 'image_url', 'link', 'order_index', 'is_own_product'],
  modules: ['title', 'order_index'],
  lessons: ['title', 'content', 'video_url', 'material_url', 'material_name', 'order_index', 'is_free_preview', 'module_id'],
  assignments: ['title', 'instructions', 'due_at', 'max_score'],
  quizzes: ['title', 'pass_pct'],
  questions: ['question', 'options', 'correct_index', 'order_index'],
  sessions: ['title', 'starts_at', 'join_url', 'recording_url'],
  students: ['status', 'name'],
  submissions: ['score', 'feedback'],
  enrollments: ['status']
};

const DELETABLE = new Set(['courses', 'modules', 'lessons', 'assignments', 'quizzes', 'questions', 'sessions', 'students', 'certificates', 'enrollments', 'submissions']);

const TABLES: Record<string, string> = {
  courses: 'courses',
  modules: 'modules',
  lessons: 'lessons',
  assignments: 'assignments',
  quizzes: 'quizzes',
  questions: 'quiz_questions',
  sessions: 'class_sessions',
  students: 'students',
  submissions: 'submissions',
  certificates: 'certificates',
  enrollments: 'enrollments'
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ entity: string; id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const { entity, id } = await params;
    const cols = PATCHABLE[entity];
    if (!cols) return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
    await ensureAcademySchema();
    const body = await req.json();

    const data: Record<string, unknown> = {};
    for (const col of cols) {
      if (body[col] !== undefined) data[col] = body[col] === '' && col.endsWith('_at') ? null : body[col];
    }
    const keys = Object.keys(data);
    if (!keys.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

    if (entity === 'submissions') {
      if (data.score !== undefined && data.score !== null) {
        data.status = 'graded';
        data.graded_at = new Date().toISOString();
      }
    }

    const setClause = keys.map((k, i) => `${k}=$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE ${TABLES[entity]} SET ${setClause} WHERE id=$${keys.length + 1} RETURNING *`,
      [...keys.map((k) => data[k]), Number(id)]
    );
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (entity === 'submissions' && rows[0].status === 'graded') {
      try {
        const { rows: sRows } = await pool.query(
          'SELECT s.student_id, a.course_id FROM submissions s JOIN assignments a ON a.id=s.assignment_id WHERE s.id=$1',
          [rows[0].id]
        );
        if (sRows[0]) await checkAndIssueCertificate(sRows[0].student_id, sRows[0].course_id);
      } catch (e) {
        console.error('cert after grade', e);
      }
    }

    return NextResponse.json({ ok: true, item: rows[0] });
  } catch (e) {
    console.error('academy patch', e);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ entity: string; id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const { entity, id } = await params;
    if (!DELETABLE.has(entity)) return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
    await ensureAcademySchema();
    const { rowCount } = await pool.query(`DELETE FROM ${TABLES[entity]} WHERE id=$1`, [Number(id)]);
    if (!rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('academy delete', e);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
