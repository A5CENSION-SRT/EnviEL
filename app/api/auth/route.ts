import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getDb } from '@/lib/db';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? 'ranger@ecoguard.org';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'sentinel123';

export async function POST(request: Request) {
  const db                   = getDb();
  const { email, password }  = await request.json();

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const sessionId = randomBytes(32).toString('hex');
  db.prepare("INSERT INTO sessions (id) VALUES (?)").run(sessionId);

  const response = NextResponse.json({ success: true });
  response.cookies.set('session', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  });
  return response;
}

export async function DELETE(request: Request) {
  const db          = getDb();
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match        = cookieHeader.match(/session=([^;]+)/);
  if (match) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(match[1]);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('session', '', { maxAge: 0, path: '/' });
  return response;
}
