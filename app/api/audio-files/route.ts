import { NextResponse } from 'next/server';

interface AudioFile {
  name: string;
  url: string;
  duration: number;
  type: string;
  timestamp: string;
}

// Mock audio data for demonstration
const MOCK_AUDIO_FILES: Record<string, AudioFile[]> = {
  gunshot: [
    {
      name: 'Detection_gunshot_001.wav',
      url: '/audio/gunshot/detection_001.wav',
      duration: 3500,
      type: 'gunshot',
      timestamp: '2024-01-15 14:32:10',
    },
    {
      name: 'Detection_gunshot_002.wav',
      url: '/audio/gunshot/detection_002.wav',
      duration: 2800,
      type: 'gunshot',
      timestamp: '2024-01-15 13:45:22',
    },
    {
      name: 'Detection_gunshot_003.wav',
      url: '/audio/gunshot/detection_003.wav',
      duration: 4100,
      type: 'gunshot',
      timestamp: '2024-01-15 12:15:05',
    },
    {
      name: 'Detection_gunshot_004.wav',
      url: '/audio/gunshot/detection_004.wav',
      duration: 3200,
      type: 'gunshot',
      timestamp: '2024-01-15 11:22:33',
    },
    {
      name: 'Detection_gunshot_005.wav',
      url: '/audio/gunshot/detection_005.wav',
      duration: 3800,
      type: 'gunshot',
      timestamp: '2024-01-15 10:08:17',
    },
  ],
  animal: [
    {
      name: 'Detection_animal_001.wav',
      url: '/audio/animal/detection_001.wav',
      duration: 5200,
      type: 'animal',
      timestamp: '2024-01-15 14:28:45',
    },
    {
      name: 'Detection_animal_002.wav',
      url: '/audio/animal/detection_002.wav',
      duration: 4600,
      type: 'animal',
      timestamp: '2024-01-15 13:50:12',
    },
    {
      name: 'Detection_animal_003.wav',
      url: '/audio/animal/detection_003.wav',
      duration: 6100,
      type: 'animal',
      timestamp: '2024-01-15 12:30:44',
    },
    {
      name: 'Detection_animal_004.wav',
      url: '/audio/animal/detection_004.wav',
      duration: 4900,
      type: 'animal',
      timestamp: '2024-01-15 11:15:58',
    },
    {
      name: 'Detection_animal_005.wav',
      url: '/audio/animal/detection_005.wav',
      duration: 5400,
      type: 'animal',
      timestamp: '2024-01-15 09:45:22',
    },
  ],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'gunshot';

  // Validate type parameter
  if (type !== 'gunshot' && type !== 'animal') {
    return NextResponse.json(
      { error: 'Invalid type. Must be "gunshot" or "animal"' },
      { status: 400 }
    );
  }

  const audioFiles = MOCK_AUDIO_FILES[type] || [];

  return NextResponse.json(audioFiles);
}
