import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const db               = getDb();
  const { searchParams } = new URL(request.url);
  const status           = searchParams.get('status');
  const type             = searchParams.get('type');
  const severity         = searchParams.get('severity');
  const since            = searchParams.get('since');
  const until            = searchParams.get('until');
  const limit            = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);

  const conditions: string[]              = [];
  const bindParams: (string | number)[]   = [];

  if (status   && status   !== 'all') { conditions.push('e.verification_status = ?'); bindParams.push(status); }
  if (type     && type     !== 'all') { conditions.push('e.event_type = ?');           bindParams.push(type); }
  if (severity && severity !== 'all') { conditions.push('e.severity = ?');             bindParams.push(severity); }
  if (since)                          { conditions.push('e.timestamp >= ?');           bindParams.push(since); }
  if (until)                          { conditions.push('e.timestamp <= ?');           bindParams.push(until); }

  const where  = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const events = db.prepare(`
    SELECT
      e.*,
      n.name    AS node_name,
      n.zone    AS node_zone,
      n.gps_lat AS gps_lat,
      n.gps_lon AS gps_lon
    FROM poaching_events e
    LEFT JOIN sensor_nodes n ON e.node_id = n.id
    ${where}
    ORDER BY e.timestamp DESC
    LIMIT ?
  `).all(...bindParams, limit);

  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const db   = getDb();
  const body = await request.json();
  const { node_id, event_type, severity, confidence, verification_status, raw_amplitude, audio_url } = body;

  if (!node_id || !event_type || !severity || confidence === undefined) {
    return NextResponse.json(
      { error: 'node_id, event_type, severity, and confidence are required' },
      { status: 400 }
    );
  }

  const result = db.prepare(`
    INSERT INTO poaching_events
      (node_id, event_type, severity, confidence, verification_status, raw_amplitude, audio_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    node_id,
    event_type,
    severity,
    confidence,
    verification_status ?? 'pending',
    raw_amplitude       ?? null,
    audio_url           ?? null,
  );

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
