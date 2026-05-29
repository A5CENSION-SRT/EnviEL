import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();

  const totalEvents    = (db.prepare("SELECT COUNT(*) AS c FROM poaching_events").get() as { c: number }).c;
  const criticalEvents = (db.prepare("SELECT COUNT(*) AS c FROM poaching_events WHERE severity = 'critical'").get() as { c: number }).c;
  const nodes          = db.prepare("SELECT status FROM sensor_nodes").all() as { status: string }[];
  const onlineNodes    = nodes.filter(n => n.status === 'online').length;
  const deployedPatrols = (db.prepare(
    "SELECT COUNT(*) AS c FROM patrol_units WHERE status IN ('deployed','responding')"
  ).get() as { c: number }).c;

  // Last event timestamp — used to determine if ML bridge is live
  const lastEvent = db.prepare(
    "SELECT timestamp FROM poaching_events ORDER BY id DESC LIMIT 1"
  ).get() as { timestamp: string } | undefined;

  // Events in the last 60 minutes
  const eventsLastHour = (db.prepare(
    "SELECT COUNT(*) AS c FROM poaching_events WHERE timestamp >= datetime('now', '-1 hour')"
  ).get() as { c: number }).c;

  // Verified accuracy: true_positive / (true_positive + false_positive)
  const verified = db.prepare(
    "SELECT COUNT(*) AS c FROM poaching_events WHERE verification_status = 'verified_poaching'"
  ).get() as { c: number };
  const falsePos = db.prepare(
    "SELECT COUNT(*) AS c FROM poaching_events WHERE verification_status = 'false_positive'"
  ).get() as { c: number };
  const reviewed    = verified.c + falsePos.c;
  const accuracy    = reviewed > 0 ? Math.round((verified.c / reviewed) * 100) : null;

  return NextResponse.json({
    totalEvents,
    criticalEvents,
    onlineNodes,
    totalNodes: nodes.length,
    deployedPatrols,
    lastEventAt:   lastEvent?.timestamp ?? null,
    eventsLastHour,
    accuracy,
  });
}
