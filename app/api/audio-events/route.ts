import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface PlaybackEvent {
  fileName: string;
  audioType: string;
  duration: number;
  timestamp: number;
  receivedAt: string;
  confidence: number;
  mlDetectionType: 'gunshot' | 'animal' | 'noise';
}

const recentEvents: PlaybackEvent[] = [];
const MAX_RECENT_EVENTS = 50;

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
  return NextResponse.json(recentEvents);
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

    recentEvents.unshift(event);
    if (recentEvents.length > MAX_RECENT_EVENTS) {
      recentEvents.pop();
    }

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
