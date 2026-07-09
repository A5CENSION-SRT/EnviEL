import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const debugLogPath = path.join(process.cwd(), 'ml_debug_log.json');
    
    // Check if the debug log file exists
    if (!fs.existsSync(debugLogPath)) {
      return NextResponse.json({
        stats: {
          total_windows: 0,
          gunshot_detections: 0,
          avg_confidence: 0,
          last_updated: null
        },
        recent_history: [],
        message: 'No debug log available yet. Start the Python bridge to generate logs.'
      });
    }

    const logContent = fs.readFileSync(debugLogPath, 'utf-8');
    const debugData = JSON.parse(logContent);

    return NextResponse.json(debugData);
  } catch (error) {
    console.error('Error reading debug log:', error);
    return NextResponse.json(
      { error: 'Failed to read debug log' },
      { status: 500 }
    );
  }
}
