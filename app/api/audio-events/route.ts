import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendSMS, isTwilioConfigured } from '@/lib/twilio';

interface PlaybackEvent {
  fileName: string;
  audioType: string;
  duration: number;
  timestamp: number;
  receivedAt: string;
  confidence: number;
  mlDetectionType: 'gunshot' | 'animal' | 'noise';
}

function generateMockMLDetection(audioType: string) {
  const baseConfidence = 0.75 + Math.random() * 0.2;

  if (audioType === 'gunshot') {
    return {
      confidence: Math.min(0.95, baseConfidence + 0.1),
      mlDetectionType: 'gunshot' as const,
    };
  } else if (audioType === 'animal') {
    return {
      confidence: Math.min(0.92, baseConfidence),
      mlDetectionType: 'animal' as const,
    };
  } else {
    const rand = Math.random();
    if (rand < 0.6) {
      return {
        confidence: Math.min(0.88, baseConfidence + 0.05),
        mlDetectionType: 'gunshot' as const,
      };
    } else {
      return {
        confidence: Math.min(0.85, baseConfidence),
        mlDetectionType: 'animal' as const,
      };
    }
  }
}

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT file_name, audio_type, duration, mobile_timestamp, received_at, confidence, ml_detection_type
      FROM audio_events
      ORDER BY id DESC
      LIMIT 50
    `).all() as Array<{
      file_name: string;
      audio_type: string;
      duration: number;
      mobile_timestamp: string;
      received_at: string;
      confidence: number;
      ml_detection_type: string;
    }>;

    const events: PlaybackEvent[] = rows.map(row => ({
      fileName: row.file_name,
      audioType: row.audio_type,
      duration: row.duration,
      timestamp: new Date(row.mobile_timestamp).getTime(),
      receivedAt: row.received_at,
      confidence: row.confidence ?? 0.85,
      mlDetectionType: (row.ml_detection_type ?? row.audio_type) as 'gunshot' | 'animal' | 'noise',
    }));

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching audio events:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileName, audioType, duration, timestamp } = body;

    if (!fileName || !audioType || duration === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, audioType, duration' },
        { status: 400 }
      );
    }

    if (audioType !== 'gunshot' && audioType !== 'animal') {
      return NextResponse.json(
        { error: 'audioType must be "gunshot" or "animal"' },
        { status: 400 }
      );
    }

    const mlDetection = generateMockMLDetection(audioType);

    const event: PlaybackEvent = {
      fileName,
      audioType,
      duration,
      timestamp: timestamp || Date.now(),
      receivedAt: new Date().toISOString(),
      confidence: mlDetection.confidence,
      mlDetectionType: mlDetection.mlDetectionType,
    };

    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO audio_events (file_name, audio_type, duration, mobile_timestamp, received_at, confidence, ml_detection_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileName,
        audioType,
        duration,
        new Date(timestamp || Date.now()).toISOString(),
        new Date().toISOString(),
        mlDetection.confidence,
        mlDetection.mlDetectionType
      );

      // Map correctly: gunshots to 'gunshot', animal sounds to 'animal_distress'
      const eventType = audioType === 'gunshot' ? 'gunshot' : 'animal_distress';
      const severity = mlDetection.confidence > 0.9 ? 'critical'
                     : mlDetection.confidence > 0.8 ? 'high'
                     : mlDetection.confidence > 0.6 ? 'medium' : 'low';

      // Always map to SN-001 (RVCE College Dept of ISE)
      const nodeId = 'SN-001';

      const nowIso = new Date().toISOString();

      db.prepare(`
        INSERT INTO poaching_events (node_id, event_type, confidence, severity, verification_status, notes, timestamp)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
      `).run(
        nodeId,
        eventType,
        mlDetection.confidence,
        severity,
        `Acoustic Detection: ${fileName}`,
        nowIso
      );

      // Send SMS alert for gunshot detections
      if (mlDetection.mlDetectionType === 'gunshot' && isTwilioConfigured()) {
        const alertPhoneNumber = process.env.ALERT_PHONE_NUMBER;
        if (alertPhoneNumber) {
          // Fixed location for all alerts
          const locationLink = 'https://maps.google.com/?q=12.922988,77.500657';

          const message = `GUNSHOT DETECTED\n\nConfidence: ${(mlDetection.confidence * 100).toFixed(1)}%\nSeverity: ${severity.toUpperCase()}\nNode: ${nodeId}\nTime: ${new Date().toLocaleString()}\nLocation: ${locationLink}\n\nPlease investigate immediately.`;
          
          sendSMS({ to: alertPhoneNumber, body: message })
            .then(result => {
              if (!result.success && !result.skipped) {
                console.error('Failed to send SMS alert:', result.error);
              }
            })
            .catch(err => {
              console.error('SMS sending error:', err);
            });
        } else {
          console.warn('ALERT_PHONE_NUMBER not configured. SMS alert not sent.');
        }
      }
    } catch (dbError) {
      console.warn('Could not persist audio event to database:', dbError);
    }

    return NextResponse.json(
      {
        success: true,
        message: `${mlDetection.mlDetectionType.toUpperCase()} detected (${(mlDetection.confidence * 100).toFixed(1)}%)`,
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing audio event:', error);
    return NextResponse.json(
      { error: 'Failed to process audio event' },
      { status: 500 }
    );
  }
}
