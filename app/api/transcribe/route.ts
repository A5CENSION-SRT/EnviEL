import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio_file') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }
    
    // Convert audio file to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    
    // Determine MIME type
    const mimeType = audioFile.type || 'audio/webm';
    
    // Call Gemini API with inline audio data for transcription
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
              parts: [
                { text: 'Transcribe the following audio accurately. Only return the transcribed text, nothing else.' },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Audio
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          }
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini transcription error:', errorText);
      return NextResponse.json(
        { error: `Transcription failed: ${response.status}` },
        { status: 500 }
      );
    }
    
    const data = await response.json();
    const transcription = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return NextResponse.json({ transcription });
    
  } catch (error) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      { error: `Failed to transcribe audio: ${error}` },
      { status: 500 }
    );
  }
}
