import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `
## System Prompt for SentinelSound: Edge-AI Poaching Alert System

You are SentinelSound AI, an advanced voice-enabled assistant for the Bandipur National Park acoustic sensor network. You help park rangers and wildlife officials:

- Monitor real-time poaching events detected by ESP32 acoustic sensors
- Review and verify ML classifier detections (gunshots, chainsaws, vehicles, animal distress)
- Update event verification status (pending, verified_poaching, false_positive, under_review)
- Get analytics summaries and trends
- Check sensor node health and battery status
- Coordinate patrol responses

**Available Commands (detect and execute these):**
1. VERIFY_EVENT - Update verification status (e.g., "mark event 5 as verified poaching", "confirm false positive for event 3")
2. GET_EVENT - Get details of a specific event by ID
3. GET_SUMMARY - Get summary of events (today, week, high-confidence, by type)
4. LIST_EVENTS - List events filtered by type/status/severity
5. CHECK_NODES - Check sensor node status and health
6. DISPATCH_PATROL - Mark response dispatched for an event

**Behavioral Guidelines:**
- Be concise and action-oriented - rangers need quick information in the field
- Prioritize critical and high-confidence detections
- Always mention confidence scores when discussing events
- For gunshot detections above 90% confidence, flag as urgent
- Use clear, professional ranger communication style
- Confirm actions before executing critical operations

**Event Types:** gunshot, chainsaw, vehicle, animal_distress, human_voice, explosion, trap_sound
**Verification Status:** pending, verified_poaching, false_positive, under_review
**Severity Levels:** low, medium, high, critical

Always provide actionable insights and be ready to assist with patrol coordination.
`;

function detectCommand(prompt: string): { type: string; params: Record<string, string | number> } | null {
  const promptLower = prompt.toLowerCase();

  const verifyPatterns = [
    /(?:verify|confirm|mark)\s+(?:event\s+)?(?:#)?(\d+)\s+(?:as\s+)?(?:verified\s+)?(?:poaching|true\s+positive)/i,
    /(?:event\s+)?(?:#)?(\d+)\s+(?:is\s+)?(?:verified|confirmed)\s+poaching/i,
    /(?:mark|set)\s+(?:event\s+)?(?:#)?(\d+)\s+(?:as\s+)?false\s+positive/i,
    /false\s+positive\s+(?:for\s+)?(?:event\s+)?(?:#)?(\d+)/i,
    /(?:put|set)\s+(?:event\s+)?(?:#)?(\d+)\s+(?:under\s+)?review/i,
  ];

  for (const pattern of verifyPatterns) {
    const match = promptLower.match(pattern);
    if (match) {
      let status = 'verified_poaching';
      if (promptLower.includes('false positive')) status = 'false_positive';
      if (promptLower.includes('review'))         status = 'under_review';
      return { type: 'VERIFY_EVENT', params: { eventId: parseInt(match[1]), status } };
    }
  }

  const getEventMatch = promptLower.match(
    /(?:get|show|what(?:'s| is)|details?\s+(?:of|for|about)?|tell\s+me\s+about)\s+(?:event\s+)?(?:#)?(\d+)/i
  );
  if (getEventMatch) {
    return { type: 'GET_EVENT', params: { eventId: parseInt(getEventMatch[1]) } };
  }

  if (promptLower.includes('summary') || promptLower.includes('overview') ||
      promptLower.includes('report')  || promptLower.includes('how many')) {
    let period = 'today';
    if (promptLower.includes('week'))  period = 'week';
    if (promptLower.includes('month')) period = 'month';
    if (promptLower.includes('all'))   period = 'all';
    let eventType = '';
    for (const t of ['gunshot','chainsaw','vehicle','animal_distress']) {
      if (promptLower.includes(t)) { eventType = t; break; }
    }
    return { type: 'GET_SUMMARY', params: { period, eventType } };
  }

  if ((promptLower.includes('node') || promptLower.includes('sensor') ||
       promptLower.includes('battery') || promptLower.includes('network')) &&
      (promptLower.includes('status') || promptLower.includes('health') ||
       promptLower.includes('check')  || promptLower.includes('how'))) {
    return { type: 'CHECK_NODES', params: {} };
  }

  if (promptLower.includes('list') || promptLower.includes('show all') ||
      promptLower.includes('all events') || promptLower.includes('pending') ||
      promptLower.includes('critical')) {
    const filters: Record<string, string> = {};
    for (const t of ['gunshot','chainsaw','vehicle','animal_distress','trap_sound']) {
      if (promptLower.includes(t)) { filters.type = t; break; }
    }
    for (const s of ['pending','verified','false_positive','under_review']) {
      if (promptLower.includes(s)) {
        filters.status = s === 'verified' ? 'verified_poaching' : s;
        break;
      }
    }
    for (const sv of ['critical','high','medium','low']) {
      if (promptLower.includes(sv)) { filters.severity = sv; break; }
    }
    return { type: 'LIST_EVENTS', params: filters };
  }

  if (promptLower.includes('dispatch') || promptLower.includes('send patrol') ||
      promptLower.includes('respond')) {
    const m = promptLower.match(/(?:event\s+)?(?:#)?(\d+)/);
    if (m) return { type: 'DISPATCH_PATROL', params: { eventId: parseInt(m[1]) } };
  }

  return null;
}

async function executeCommand(
  command: { type: string; params: Record<string, string | number> }
): Promise<{ success: boolean; data?: unknown; message: string }> {
  const db = getDb();
  try {
    switch (command.type) {
      case 'VERIFY_EVENT': {
        const { eventId, status } = command.params;
        const existing = db.prepare('SELECT id FROM poaching_events WHERE id = ?').get(eventId);
        if (!existing) return { success: false, message: `Event #${eventId} not found.` };

        db.prepare(`
          UPDATE poaching_events
          SET verification_status = ?, verified_at = datetime('now')
          WHERE id = ?
        `).run(status, eventId);

        const updated = db.prepare(`
          SELECT e.*, n.name AS node_name, n.zone AS node_zone
          FROM poaching_events e
          LEFT JOIN sensor_nodes n ON e.node_id = n.id
          WHERE e.id = ?
        `).get(eventId);

        return {
          success: true,
          data: updated,
          message: `Event #${eventId} verification status updated to "${status}".`,
        };
      }

      case 'GET_EVENT': {
        const { eventId } = command.params;
        const event = db.prepare(`
          SELECT e.*, n.name AS node_name, n.zone AS node_zone, n.gps_lat, n.gps_lon, n.battery_level
          FROM poaching_events e
          LEFT JOIN sensor_nodes n ON e.node_id = n.id
          WHERE e.id = ?
        `).get(eventId);
        if (!event) return { success: false, message: `Event #${eventId} not found.` };
        return { success: true, data: event, message: `Found event #${eventId}.` };
      }

      case 'GET_SUMMARY': {
        const { period, eventType } = command.params;

        const conditions: string[] = [];
        const bindParams: (string | number)[] = [];

        if (period === 'today') {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          conditions.push('timestamp >= ?');
          bindParams.push(todayStart.toISOString());
        } else if (period === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          conditions.push('timestamp >= ?');
          bindParams.push(weekAgo.toISOString());
        } else if (period === 'month') {
          const monthAgo = new Date();
          monthAgo.setDate(monthAgo.getDate() - 30);
          conditions.push('timestamp >= ?');
          bindParams.push(monthAgo.toISOString());
        }

        if (eventType) {
          conditions.push('event_type = ?');
          bindParams.push(eventType as string);
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const events = db.prepare(
          `SELECT * FROM poaching_events ${where} ORDER BY timestamp DESC`
        ).all(...bindParams) as Record<string, unknown>[];

        const stats = {
          total: events.length,
          byStatus:   {} as Record<string, number>,
          bySeverity: {} as Record<string, number>,
          byType:     {} as Record<string, number>,
          highConfidence: 0,
          critical: 0,
        };

        for (const event of events) {
          const vs = event.verification_status as string;
          const sv = event.severity as string;
          const et = event.event_type as string;
          stats.byStatus[vs]   = (stats.byStatus[vs]   || 0) + 1;
          stats.bySeverity[sv] = (stats.bySeverity[sv] || 0) + 1;
          stats.byType[et]     = (stats.byType[et]     || 0) + 1;
          if ((event.confidence as number) > 0.9) stats.highConfidence++;
          if (sv === 'critical') stats.critical++;
        }

        return {
          success: true,
          data: { events: events.slice(0, 10), stats },
          message: `Summary for ${period}: ${stats.total} total events, ${stats.critical} critical, ${stats.highConfidence} high-confidence detections.`,
        };
      }

      case 'CHECK_NODES': {
        const nodes = db.prepare('SELECT * FROM sensor_nodes ORDER BY id').all() as Record<string, unknown>[];
        const online     = nodes.filter(n => n.status === 'online').length;
        const offline    = nodes.filter(n => n.status === 'offline').length;
        const lowBattery = nodes.filter(n => (n.battery_level as number) < 30).length;
        return {
          success: true,
          data: { nodes, stats: { online, offline, lowBattery, total: nodes.length } },
          message: `Network status: ${online} online, ${offline} offline, ${lowBattery} low battery. Total ${nodes.length} nodes.`,
        };
      }

      case 'LIST_EVENTS': {
        const conditions: string[] = [];
        const bindParams: (string | number)[] = [];

        if (command.params.type) {
          conditions.push('e.event_type = ?');
          bindParams.push(command.params.type);
        }
        if (command.params.status) {
          conditions.push('e.verification_status = ?');
          bindParams.push(command.params.status);
        }
        if (command.params.severity) {
          conditions.push('e.severity = ?');
          bindParams.push(command.params.severity);
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const events = db.prepare(`
          SELECT e.*, n.name AS node_name, n.zone AS node_zone
          FROM poaching_events e
          LEFT JOIN sensor_nodes n ON e.node_id = n.id
          ${where}
          ORDER BY e.timestamp DESC
          LIMIT 15
        `).all(...bindParams);

        return {
          success: true,
          data: events,
          message: `Found ${(events as unknown[]).length} events matching your criteria.`,
        };
      }

      case 'DISPATCH_PATROL': {
        const { eventId } = command.params;
        db.prepare('UPDATE poaching_events SET response_dispatched = 1 WHERE id = ?').run(eventId);
        return {
          success: true,
          message: `Patrol response marked as dispatched for event #${eventId}.`,
        };
      }

      default:
        return { success: false, message: 'Unknown command type.' };
    }
  } catch (error) {
    console.error('Command execution error:', error);
    return { success: false, message: `Error executing command: ${error}` };
  }
}

async function callGemini(prompt: string, context?: string): Promise<string> {
  if (!GEMINI_API_KEY) return generateFallbackResponse(prompt, context);

  const fullPrompt = context
    ? `${SYSTEM_PROMPT}\n\nContext from database:\n${context}\n\nUser query: ${prompt}`
    : `${SYSTEM_PROMPT}\n\nUser query: ${prompt}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      if (response.status === 429 || err?.error?.code === 429) {
        console.warn('Gemini rate limit exceeded, using fallback response');
        return generateFallbackResponse(prompt, context);
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return generateFallbackResponse(prompt, context);
  }
}

function generateFallbackResponse(prompt: string, context?: string): string {
  const promptLower = prompt.toLowerCase();

  if (context?.includes('Command executed')) {
    if (context.includes('GET_SUMMARY'))  return `Summary retrieved from database. Check the dashboard for real-time analytics.`;
    if (context.includes('VERIFY_EVENT')) return `Event verification status updated successfully.`;
    if (context.includes('GET_EVENT'))    return `Event details retrieved. See the command result for full information.`;
    if (context.includes('CHECK_NODES'))  return `Sensor node status retrieved. See the result for details.`;
    return `Command processed successfully.`;
  }

  if (promptLower.includes('hello') || promptLower.includes('hi')) {
    return `SentinelSound AI online. Connected to Bandipur acoustic sensor network.\n\nI can help you:\n• Review events ("What's event #1?")\n• Verify classifications ("Mark event 3 as verified poaching")\n• Check network ("Check sensor nodes")\n• Get summaries ("Today's summary")\n• List events ("Show all gunshot events")`;
  }
  if (promptLower.includes('help')) {
    return `Commands:\n1. "What's event #5?" — get event details\n2. "Mark event 3 as verified poaching" — verify\n3. "False positive for event 7"\n4. "Today's summary" / "Weekly report"\n5. "Show all gunshot events"\n6. "Sensor status"`;
  }
  return `I can help with event details, verification, summaries, node status, and patrol coordination. Try a specific command or check the dashboard.`;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
    }

    const command = detectCommand(prompt);
    let commandResult = null;
    let context = '';

    if (command) {
      commandResult = await executeCommand(command);
      context = `Command executed: ${command.type}\nResult: ${JSON.stringify(commandResult, null, 2)}`;
    }

    const aiResponse = await callGemini(prompt, context);

    return NextResponse.json({
      reply: aiResponse,
      command_executed: !!command,
      command_result: commandResult,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: `Failed to process request: ${error}` }, { status: 500 });
  }
}
