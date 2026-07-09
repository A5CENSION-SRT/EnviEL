#!/usr/bin/env node

/**
 * Generate sample WAV audio files for demonstration
 * Creates synthetic audio tones for Gunshot and Animal detection categories
 * Run with: node scripts/generate-audio-samples.js
 */

const fs = require('fs');
const path = require('path');

// WAV file parameters
const SAMPLE_RATE = 44100;
const BYTES_PER_SAMPLE = 2;
const NUM_CHANNELS = 1;

// Create directories if they don't exist
const gunshotDir = path.join(__dirname, '../public/audio/gunshot');
const animalDir = path.join(__dirname, '../public/audio/animal');

if (!fs.existsSync(gunshotDir)) {
  fs.mkdirSync(gunshotDir, { recursive: true });
}
if (!fs.existsSync(animalDir)) {
  fs.mkdirSync(animalDir, { recursive: true });
}

/**
 * Generate a WAV file with synthetic audio
 * @param {string} filepath - Where to save the file
 * @param {number} durationMs - Duration in milliseconds
 * @param {function} generatorFn - Function that generates samples (0-1 normalized)
 */
function generateWAV(filepath, durationMs, generatorFn) {
  const numSamples = Math.floor((durationMs * SAMPLE_RATE) / 1000);
  const audioData = Buffer.alloc(numSamples * BYTES_PER_SAMPLE);

  for (let i = 0; i < numSamples; i++) {
    const sample = generatorFn(i, SAMPLE_RATE);
    // Clamp and convert to 16-bit PCM
    const clamped = Math.max(-1, Math.min(1, sample));
    const pcm = Math.floor(clamped * 32767);
    audioData.writeInt16LE(pcm, i * BYTES_PER_SAMPLE);
  }

  const wavData = createWAVHeader(audioData, SAMPLE_RATE, NUM_CHANNELS);
  fs.writeFileSync(filepath, wavData);
  console.log(`✓ Created ${path.relative(process.cwd(), filepath)} (${durationMs}ms)`);
}

/**
 * Create WAV file header and combine with audio data
 */
function createWAVHeader(audioData, sampleRate, numChannels) {
  const bytesPerSecond = sampleRate * numChannels * BYTES_PER_SAMPLE;
  const blockAlign = numChannels * BYTES_PER_SAMPLE;
  const subchunk2Size = audioData.length;
  const chunkSize = 36 + subchunk2Size;

  const header = Buffer.alloc(44);
  let offset = 0;

  // RIFF chunk descriptor
  header.write('RIFF', offset);
  offset += 4;
  header.writeUInt32LE(chunkSize, offset);
  offset += 4;
  header.write('WAVE', offset);
  offset += 4;

  // fmt sub-chunk
  header.write('fmt ', offset);
  offset += 4;
  header.writeUInt32LE(16, offset); // Subchunk1Size
  offset += 4;
  header.writeUInt16LE(1, offset); // AudioFormat (1 = PCM)
  offset += 2;
  header.writeUInt16LE(numChannels, offset);
  offset += 2;
  header.writeUInt32LE(sampleRate, offset);
  offset += 4;
  header.writeUInt32LE(bytesPerSecond, offset);
  offset += 4;
  header.writeUInt16LE(blockAlign, offset);
  offset += 2;
  header.writeUInt16LE(16, offset); // BitsPerSample
  offset += 2;

  // data sub-chunk
  header.write('data', offset);
  offset += 4;
  header.writeUInt32LE(subchunk2Size, offset);

  return Buffer.concat([header, audioData]);
}

/**
 * Gunshot sound: rapid burst with high amplitude
 * Simulates the sharp, sudden nature of a gunshot
 */
function gunshotGenerator(sample, sampleRate) {
  const t = sample / sampleRate;
  const burstDuration = 0.1; // 100ms burst
  const decayStart = burstDuration;

  if (t < burstDuration) {
    // Rapid clicking/burst phase
    const clicks = 8;
    const clickFreq = clicks / burstDuration;
    const clickPhase = (t * clickFreq) % 1;
    
    // Multiple frequency components for realistic gunshot
    const freq1 = 300 * Math.sin(clickPhase * Math.PI * 2);
    const freq2 = 600 * Math.sin(clickPhase * Math.PI * 4);
    
    const baseFreq = 200 + freq1 + freq2;
    const envelope = Math.exp(-t * 20); // Decay envelope
    
    return envelope * (
      0.7 * Math.sin(2 * Math.PI * baseFreq * t) +
      0.3 * Math.sin(2 * Math.PI * (baseFreq * 1.5) * t)
    );
  } else if (t < decayStart + 0.2) {
    // Echo/tail phase with lower frequencies
    const decayTime = t - decayStart;
    const envelope = Math.exp(-decayTime * 15);
    return envelope * 0.4 * Math.sin(2 * Math.PI * 150 * t);
  }
  
  return 0;
}

/**
 * Animal distress sound: howling/growling pattern
 * Simulates animal distress or alarm calls
 */
function animalGenerator(sample, sampleRate) {
  const t = sample / sampleRate;
  
  // Frequency modulation to create animal-like qualities
  const baseFreq = 150;
  const modulationFreq = 3;
  const modulationDepth = 80;
  
  // Create varying frequency (like an animal call)
  const freqModulation = modulationDepth * Math.sin(2 * Math.PI * modulationFreq * t);
  const frequency = baseFreq + freqModulation;
  
  // Amplitude envelope with multiple peaks (like distress calls)
  const peakCount = Math.floor(t * 2) + 1; // 2 peaks per second
  const timeInPeak = (t * 2) % 1;
  const peakEnvelope = Math.exp(-Math.pow((timeInPeak - 0.5) * 2, 2) * 3);
  
  // Overall decay over time
  const decayEnvelope = Math.exp(-t * 0.5);
  
  return decayEnvelope * peakEnvelope * (
    0.6 * Math.sin(2 * Math.PI * frequency * t) +
    0.2 * Math.sin(2 * Math.PI * (frequency * 0.5) * t) +
    0.1 * Math.cos(2 * Math.PI * (frequency * 1.5) * t)
  );
}

// Generate Gunshot samples
console.log('\n🔫 Generating Gunshot Detection Audio Samples...');
generateWAV(path.join(gunshotDir, 'detection_001.wav'), 3500, gunshotGenerator);
generateWAV(path.join(gunshotDir, 'detection_002.wav'), 2800, gunshotGenerator);
generateWAV(path.join(gunshotDir, 'detection_003.wav'), 4100, gunshotGenerator);
generateWAV(path.join(gunshotDir, 'detection_004.wav'), 3200, gunshotGenerator);
generateWAV(path.join(gunshotDir, 'detection_005.wav'), 3800, gunshotGenerator);

// Generate Animal samples
console.log('\n🦁 Generating Animal Detection Audio Samples...');
generateWAV(path.join(animalDir, 'detection_001.wav'), 5200, animalGenerator);
generateWAV(path.join(animalDir, 'detection_002.wav'), 4600, animalGenerator);
generateWAV(path.join(animalDir, 'detection_003.wav'), 6100, animalGenerator);
generateWAV(path.join(animalDir, 'detection_004.wav'), 4900, animalGenerator);
generateWAV(path.join(animalDir, 'detection_005.wav'), 5400, animalGenerator);

console.log('\n✅ All audio samples generated successfully!\n');
