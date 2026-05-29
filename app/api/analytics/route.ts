import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const db               = getDb();
  const { searchParams } = new URL(request.url);
  const range            = searchParams.get('range') ?? '7d';

  const now   = new Date();
  const start = new Date();
  switch (range) {
    case '24h': start.setDate(now.getDate() - 1);  break;
    case '30d': start.setDate(now.getDate() - 30); break;
    case '90d': start.setDate(now.getDate() - 90); break;
    default:    start.setDate(now.getDate() - 7);
  }

  const events = db.prepare(`
    SELECT * FROM poaching_events
    WHERE timestamp >= ?
    ORDER BY timestamp ASC
  `).all(start.toISOString());

  const nodes = db.prepare('SELECT * FROM sensor_nodes ORDER BY id').all();

  return NextResponse.json({ events, nodes });
}
