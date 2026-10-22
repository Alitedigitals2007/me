import { NextRequest, NextResponse } from 'next/server';
import getPool from '@/lib/db';
import { getAdmin } from '@/lib/admin-auth';
import { ensureAcademySchema } from '@/lib/academy-schema';

export const runtime = 'nodejs';

const FIELDS: Record<string, string[]> = {
  courses: ['title', 'slug', 'description', 'price', 'status', 'delivery', 'level', 'duration', 'image_url', 'link', 'order_index', 'is_own_product'],
  modules: ['course_id', 'title', 'order_index'],
  lessons: ['course_id', 'module_id', 'title', 'content', 'video_url', 'material_url', 'material_name', 'order_index', 'is_free_preview'],
  assignments: ['course_id', 'lesson_id', 'title', 'instructions', 'due_at', 'max_score'],
  quizzes: ['course_id', 'lesson_id', 'title', 'pass_pct', 'is_final_exam'],
  questions: ['quiz_id', 'question', 'options', 'correct_index', 'order_index'],
  sessions: ['course_id', 'title', 'starts_at', 'join_url', 'recording_url'],
  certificates: ['student_id', 'course_id', 'code']
};

const REQUIRED: Record<string, string[]> = {
  courses: ['title'],
  modules: ['title', 'course_id'],
  lessons: ['title', 'course_id'],
  assignments: ['title', 'course_id'],
  quizzes: ['title', 'course_id'],
  questions: ['question', 'quiz_id'],
  sessions: ['title', 'starts_at', 'course_id'],
  certificates: ['student_id', 'course_id']
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const { entity } = await params;
    if (!FIELDS[entity]) return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
    await ensureAcademySchema();
    const body = await req.json();

    if (entity === 'questions' && Array.isArray(body.questions)) {
      const quizId = Number(body.quiz_id);
      if (!Number.isInteger(quizId) || quizId <= 0) {
        return NextResponse.json({ error: 'quiz_id is required' }, { status: 400 });
      }
      const prepared = (body.questions as Array<Record<string, unknown>>)
        .map((q) => {
          const options = Array.isArray(q.options)
            ? (q.options as unknown[]).map((o) => String(o).trim()).filter(Boolean)
            : [];
          let correct = Number(q.correct_index);
          if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) correct = 0;
          return { question: String(q.question || '').trim(), options, correct };
        })
        .filter((q) => q.question && q.options.length >= 2);

      if (!prepared.length) return NextResponse.json({ error: 'No valid questions to import' }, { status: 400 });
      if (prepared.length > 500) return NextResponse.json({ error: 'Import at most 500 questions at a time' }, { status: 400 });

      const { rows: quizRows } = await getPool().query('SELECT id FROM quizzes WHERE id=$1', [quizId]);
      if (!quizRows.length) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

      const client = await getPool().connect();
      try {
        await client.query('BEGIN');
        const { rows: orderRows } = await client.query(
          'SELECT COALESCE(MAX(order_index), -1)::int AS max FROM quiz_questions WHERE quiz_id=$1',
          [quizId]
        );
        let order = (orderRows[0]?.max ?? -1) + 1;
        for (const q of prepared) {
          await client.query(
            'INSERT INTO quiz_questions (quiz_id, question, options, correct_index, order_index) VALUES ($1, $2, $3, $4, $5)',
            [quizId, q.question, JSON.stringify(q.options), q.correct, order]
          );
          order += 1;
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
      return NextResponse.json({ ok: true, count: prepared.length });
    }

    for (const key of REQUIRED[entity] || []) {
      if (body[key] === undefined || body[key] === null || body[key] === '') {
        return NextResponse.json({ error: `${key} is required` }, { status: 400 });
      }
    }

    const data: Record<string, unknown> = {};
    for (const col of FIELDS[entity]) {
      if (body[col] !== undefined) data[col] = body[col] === '' && (col.endsWith('_at') || col === 'lesson_id') ? null : body[col];
    }

    if (entity === 'courses') {
      if (!data.slug) data.slug = slugify(String(data.title));
      let slug = String(data.slug);
      const { rows } = await getPool().query('SELECT id FROM courses WHERE slug=$1', [slug]);
      if (rows.length) {
        const { rows: r2 } = await getPool().query('SELECT COUNT(*)::int AS n FROM courses');
        slug = `${slug}-${r2[0].n + 1}`;
        data.slug = slug;
      }
    }

    if (entity === 'certificates') {
      const code = String(data.code || '') || `ALITE-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Date.now().toString(36).toUpperCase().slice(-4)}`;
      const { rows } = await getPool().query(
        `INSERT INTO certificates (student_id, course_id, code) VALUES ($1, $2, $3)
         ON CONFLICT (student_id, course_id) DO NOTHING RETURNING id, code`,
        [data.student_id, data.course_id, code]
      );
      if (!rows.length) return NextResponse.json({ error: 'This student already has a certificate for this course.' }, { status: 409 });
      return NextResponse.json({ ok: true, item: rows[0] });
    }

    const keys = Object.keys(data);
    const cols = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await getPool().query(
      `INSERT INTO ${entity} (${cols}) VALUES (${placeholders}) RETURNING *`,
      keys.map((k) => data[k])
    );
    if (entity === 'quizzes' && rows[0]?.is_final_exam) {
      await getPool().query('UPDATE quizzes SET is_final_exam=false WHERE course_id=$1 AND id<>$2', [rows[0].course_id, rows[0].id]);
    }
    return NextResponse.json({ ok: true, item: rows[0] });
  } catch (e) {
    console.error('academy create', e);
    return NextResponse.json({ error: 'Create failed' }, { status: 500 });
  }
}
