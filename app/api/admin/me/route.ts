import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await getAdmin();
  return NextResponse.json({ admin: admin ? { username: admin.username ?? 'Admin' } : null });
}
