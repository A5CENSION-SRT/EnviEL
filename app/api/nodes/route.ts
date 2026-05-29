import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db    = getDb();
  const nodes = db.prepare('SELECT * FROM sensor_nodes ORDER BY id').all();
  return NextResponse.json(nodes);
}

export async function POST(request: Request) {
  const db   = getDb();
  const body = await request.json();
  const { id, name, zone, gps_lat, gps_lon, battery_level, status } = body;

  if (!id || !name) {
    return NextResponse.json({ error: 'id and name are required' }, { status: 400 });
  }

  db.prepare(`
    INSERT INTO sensor_nodes (id, name, zone, gps_lat, gps_lon, battery_level, status, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      status        = excluded.status,
      battery_level = excluded.battery_level,
      last_seen     = datetime('now')
  `).run(
    id,
    name,
    zone          ?? 'Unassigned',
    gps_lat       ?? 0,
    gps_lon       ?? 0,
    battery_level ?? 100,
    status        ?? 'online',
  );

  return NextResponse.json({ success: true });
}
