import { NextResponse } from 'next/server';
import { getStudent } from '@/lib/student-session';

export const runtime = 'nodejs';

export async function GET() {
  const student = await getStudent();
  return NextResponse.json({ student: student ? { name: student.name, email: student.email } : null });
}
