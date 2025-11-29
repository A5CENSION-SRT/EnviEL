import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// Function to detect commands in user prompt
function detectCommand(prompt: string): { type: string; params: Record<string, string | number> } | null {
  const promptLower = prompt.toLowerCase();
  
  // Verify/Update event patterns
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
      if (promptLower.includes('review')) status = 'under_review';
      return {
        type: 'VERIFY_EVENT',
        params: { eventId: parseInt(match[1]), status }
      };
    }
  }
  
  // Get specific event patterns
  const getEventPattern = /(?:get|show|what(?:'s| is)|details?\s+(?:of|for|about)?|tell\s+me\s+about)\s+(?:event\s+)?(?:#)?(\d+)/i;
  const getEventMatch = promptLower.match(getEventPattern);
  if (getEventMatch) {
    return {
      type: 'GET_EVENT',
      params: { eventId: parseInt(getEventMatch[1]) }
    };
  }
  
  // Summary patterns
  if (promptLower.includes('summary') || promptLower.includes('overview') || promptLower.includes('report') || promptLower.includes('how many')) {
    let period = 'today';
    if (promptLower.includes('week')) period = 'week';
    if (promptLower.includes('month')) period = 'month';
    if (promptLower.includes('all')) period = 'all';
    
    let eventType = null;
    const types = ['gunshot', 'chainsaw', 'vehicle', 'animal_distress'];
    for (const type of types) {
      if (promptLower.includes(type)) {
        eventType = type;
        break;
      }
    }
    
    return {
      type: 'GET_SUMMARY',
      params: { period, eventType: eventType || '' }
    };
  }
  
  // Check nodes patterns
  if (promptLower.includes('node') || promptLower.includes('sensor') || promptLower.includes('battery') || promptLower.includes('network')) {
    if (promptLower.includes('status') || promptLower.includes('health') || promptLower.includes('check') || promptLower.includes('how')) {
      return {
        type: 'CHECK_NODES',
        params: {}
      };
    }
  }
  
  // List events patterns
  if (promptLower.includes('list') || promptLower.includes('show all') || promptLower.includes('all events') || promptLower.includes('pending') || promptLower.includes('critical')) {
    const filters: Record<string, string> = {};
    
    const types = ['gunshot', 'chainsaw', 'vehicle', 'animal_distress', 'trap_sound'];
    for (const type of types) {
      if (promptLower.includes(type)) {
        filters.type = type;
        break;
      }
    }
    
    const statuses = ['pending', 'verified', 'false_positive', 'under_review'];
    for (const status of statuses) {
      if (promptLower.includes(status)) {
        filters.status = status === 'verified' ? 'verified_poaching' : status;
        break;
      }
    }
    
    const severities = ['critical', 'high', 'medium', 'low'];
    for (const severity of severities) {
      if (promptLower.includes(severity)) {
        filters.severity = severity;
        break;
      }
    }
    
    return {
      type: 'LIST_EVENTS',
      params: filters
    };
  }
  
  // Dispatch patrol
  if (promptLower.includes('dispatch') || promptLower.includes('send patrol') || promptLower.includes('respond')) {
    const eventMatch = promptLower.match(/(?:event\s+)?(?:#)?(\d+)/);
    if (eventMatch) {
      return {
        type: 'DISPATCH_PATROL',
        params: { eventId: parseInt(eventMatch[1]) }
      };
    }
  }
  
  return null;
}

// Execute database commands
async function executeCommand(command: { type: string; params: Record<string, string | number> }): Promise<{ success: boolean; data?: unknown; message: string }> {
  try {
    switch (command.type) {
      case 'VERIFY_EVENT': {
        const { eventId, status } = command.params;
        const updateData: Record<string, unknown> = { 
          verification_status: status,
          verified_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('poaching_events')
          .update(updateData)
          .eq('id', eventId)
          .select('*, sensor_nodes(name, zone)');
        
        if (error) throw error;
        if (!data || data.length === 0) {
          return { success: false, message: `Event #${eventId} not found.` };
        }
        return { 
          success: true, 
          data: data[0], 
          message: `Event #${eventId} verification status updated to "${status}".` 
        };
      }
      
      case 'GET_EVENT': {
        const { eventId } = command.params;
        const { data, error } = await supabase
          .from('poaching_events')
          .select('*, sensor_nodes(name, zone, gps_lat, gps_lon, battery_level)')
          .eq('id', eventId)
          .single();
        
        if (error) throw error;
        if (!data) {
          return { success: false, message: `Event #${eventId} not found.` };
        }
        return { success: true, data, message: `Found event #${eventId}.` };
      }
      
      case 'GET_SUMMARY': {
        const { period, eventType } = command.params;
        let query = supabase.from('poaching_events').select('*');
        
        if (period === 'today') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          query = query.gte('timestamp', today.toISOString());
        } else if (period === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          query = query.gte('timestamp', weekAgo.toISOString());
        }
        
        if (eventType) {
          query = query.eq('event_type', eventType);
        }
        
        const { data, error } = await query.order('timestamp', { ascending: false });
        if (error) throw error;
        
        const stats = {
          total: data?.length || 0,
          byStatus: {} as Record<string, number>,
          bySeverity: {} as Record<string, number>,
          byType: {} as Record<string, number>,
          highConfidence: 0,
          critical: 0
        };
        
        data?.forEach(event => {
          stats.byStatus[event.verification_status] = (stats.byStatus[event.verification_status] || 0) + 1;
          stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;
          stats.byType[event.event_type] = (stats.byType[event.event_type] || 0) + 1;
          if (event.confidence > 0.9) stats.highConfidence++;
          if (event.severity === 'critical') stats.critical++;
        });
        
        return { 
          success: true, 
          data: { events: data?.slice(0, 10), stats }, 
          message: `Summary for ${period}: ${stats.total} total events, ${stats.critical} critical, ${stats.highConfidence} high-confidence detections.` 
        };
      }
      
      case 'CHECK_NODES': {
        const { data, error } = await supabase
          .from('sensor_nodes')
          .select('*')
          .order('id');
        
        if (error) throw error;
        
        const online = data?.filter(n => n.status === 'online').length || 0;
        const offline = data?.filter(n => n.status === 'offline').length || 0;
        const lowBattery = data?.filter(n => n.battery_level < 30).length || 0;
        
        return { 
          success: true, 
          data: { nodes: data, stats: { online, offline, lowBattery, total: data?.length } }, 
          message: `Network status: ${online} online, ${offline} offline, ${lowBattery} low battery. Total ${data?.length} nodes.` 
        };
      }
      
      case 'LIST_EVENTS': {
        let query = supabase.from('poaching_events').select('*, sensor_nodes(name, zone)');
        
        if (command.params.type) {
          query = query.eq('event_type', command.params.type);
        }
        if (command.params.status) {
          query = query.eq('verification_status', command.params.status);
        }
        if (command.params.severity) {
          query = query.eq('severity', command.params.severity);
        }
        
        const { data, error } = await query.order('timestamp', { ascending: false }).limit(15);
        if (error) throw error;
        
        return { 
          success: true, 
          data, 
          message: `Found ${data?.length || 0} events matching your criteria.` 
        };
      }
      
      case 'DISPATCH_PATROL': {
        const { eventId } = command.params;
        const { data, error } = await supabase
          .from('poaching_events')
          .update({ response_dispatched: true })
          .eq('id', eventId)
          .select();
        
        if (error) throw error;
        return { 
          success: true, 
          data, 
          message: `Patrol response marked as dispatched for event #${eventId}.` 
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

// Call Gemini API
async function callGemini(prompt: string, context?: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  
  const fullPrompt = context 
    ? `${SYSTEM_PROMPT}\n\nContext from database:\n${context}\n\nUser query: ${prompt}`
    : `${SYSTEM_PROMPT}\n\nUser query: ${prompt}`;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
    }
    
    // Detect if user is issuing a command
    const command = detectCommand(prompt);
    let commandResult = null;
    let context = '';
    
    if (command) {
      commandResult = await executeCommand(command);
      context = `Command executed: ${command.type}\nResult: ${JSON.stringify(commandResult, null, 2)}`;
    }
    
    // Generate AI response with context
    const aiResponse = await callGemini(prompt, context);
    
    return NextResponse.json({
      reply: aiResponse,
      command_executed: !!command,
      command_result: commandResult
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: `Failed to process request: ${error}` },
      { status: 500 }
    );
  }
}
