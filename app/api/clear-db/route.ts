import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();
    
    // Clear audio events and poaching events, but retain the stationary node details
    db.prepare("DELETE FROM audio_events").run();
    db.prepare("DELETE FROM poaching_events").run();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing database:', error);
    return NextResponse.json({ error: 'Failed to clear database' }, { status: 500 });
  }
}
