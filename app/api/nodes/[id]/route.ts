import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db              = getDb();
  const { id }          = await params;
  const body            = await request.json();
  const { status, battery_level } = body;

  db.prepare(`
    UPDATE sensor_nodes
    SET status        = COALESCE(?, status),
        battery_level = COALESCE(?, battery_level),
        last_seen     = datetime('now')
    WHERE id = ?
  `).run(status ?? null, battery_level ?? null, id);

  return NextResponse.json({ success: true });
}
