import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db     = getDb();
  const { id } = await params;

  const event = db.prepare(`
    SELECT
      e.*,
      n.name          AS node_name,
      n.zone          AS node_zone,
      n.gps_lat,
      n.gps_lon,
      n.battery_level AS node_battery
    FROM poaching_events e
    LEFT JOIN sensor_nodes n ON e.node_id = n.id
    WHERE e.id = ?
  `).get(id);

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db     = getDb();
  const { id } = await params;
  const body   = await request.json();
  const { verification_status, response_dispatched, notes } = body;

  const sets: string[]                     = [];
  const values: (string | number | null)[] = [];

  if (verification_status !== undefined) {
    sets.push('verification_status = ?');
    values.push(verification_status);
    sets.push("verified_at = datetime('now')");
  }
  if (response_dispatched !== undefined) {
    sets.push('response_dispatched = ?');
    values.push(response_dispatched ? 1 : 0);
  }
  if (notes !== undefined) {
    sets.push('notes = ?');
    values.push(notes);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(id);
  db.prepare(`UPDATE poaching_events SET ${sets.join(', ')} WHERE id = ?`).run(...values);

  return NextResponse.json({ success: true });
}
