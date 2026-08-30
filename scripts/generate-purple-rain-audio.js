import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Synthesize a high-quality 44.1kHz stereo WAV recording of Purple Rain progression
export function generatePurpleRainAudio() {
  const sampleRate = 44100;
  const durationSeconds = 88; // 1 minute 28 seconds of rich audio
  const numChannels = 2;
  const totalSamples = sampleRate * durationSeconds;
  
  // WAV header (44 bytes) + 16-bit stereo PCM
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Helper to write ASCII
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF Chunk
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Purple Rain Chord Progressions: Bb -> Gm -> F -> Eb
  // Measure length = 8 seconds each
  const chords = [
    // Chord 1: Bb
    { bass: 116.54, notes: [233.08, 293.66, 349.23, 466.16], duration: 8 },
    // Chord 2: Gm
    { bass: 98.00,  notes: [196.00, 233.08, 293.66, 392.00], duration: 8 },
    // Chord 3: F
    { bass: 87.31,  notes: [174.61, 220.00, 261.63, 349.23], duration: 8 },
    // Chord 4: Eb
    { bass: 77.78,  notes: [155.56, 196.00, 233.08, 311.13], duration: 8 },
  ];

  let offset = 44;
  const loopDuration = 32; // 4 chords * 8s

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const loopT = t % loopDuration;
    const chordIndex = Math.floor(loopT / 8) % chords.length;
    const chord = chords[chordIndex];
    const chordT = loopT % 8;

    // Pluck / strum decay envelope
    const pluckEnv = Math.exp(-chordT * 0.45);
    const sustainedEnv = 0.35 + 0.65 * Math.exp(-chordT * 0.2);

    // Warm deep bass note
    let bass = Math.sin(2 * Math.PI * chord.bass * t) * 0.45;
    bass += Math.sin(2 * Math.PI * (chord.bass * 2) * t) * 0.25;

    // Polyphonic chords with gentle chorus detuning
    let chordSignal = 0;
    for (let n = 0; n < chord.notes.length; n++) {
      const freq = chord.notes[n];
      // Subtle stereo detune
      const voice1 = Math.sin(2 * Math.PI * freq * t);
      const voice2 = Math.sin(2 * Math.PI * (freq * 1.002) * t);
      const voice3 = Math.sin(2 * Math.PI * (freq * 0.998) * t);
      // Soft electric guitar harmonic
      const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.2;
      chordSignal += (voice1 + voice2 * 0.7 + voice3 * 0.7 + harmonic) * (0.22 / chord.notes.length);
    }

    // Lead melodic phrase (iconic Purple Rain guitar melody motifs)
    let lead = 0;
    const melodyTime = t % 16;
    if (melodyTime > 2) {
      // Gentle melodic notes floating on top: F4, G4, F4, D4, C4, Bb3
      let leadFreq = 349.23;
      if (melodyTime > 12) leadFreq = 466.16;
      else if (melodyTime > 9) leadFreq = 392.00;
      else if (melodyTime > 6) leadFreq = 349.23;
      else if (melodyTime > 4) leadFreq = 293.66;
      
      const leadVibrato = Math.sin(2 * Math.PI * 5.5 * t) * 2.5;
      const leadEnv = Math.exp(-(melodyTime % 2.5) * 0.8);
      lead = Math.sin(2 * Math.PI * (leadFreq + leadVibrato) * t) * 0.22 * leadEnv;
    }

    // Master fade in (first 2 seconds) and fade out (last 4 seconds)
    let masterEnv = 1.0;
    if (t < 2.5) masterEnv = t / 2.5;
    if (t > durationSeconds - 4.5) masterEnv = (durationSeconds - t) / 4.5;

    const left = (bass * 0.5 + chordSignal * pluckEnv * 0.65 + chordSignal * sustainedEnv * 0.35 + lead * 0.8) * masterEnv * 0.75;
    const right = (bass * 0.5 + chordSignal * pluckEnv * 0.65 + chordSignal * sustainedEnv * 0.35 + lead * 0.75) * masterEnv * 0.75;

    // Convert to 16-bit signed PCM
    const sampleL = Math.max(-1, Math.min(1, left)) * 0x7FFF;
    const sampleR = Math.max(-1, Math.min(1, right)) * 0x7FFF;

    view.setInt16(offset, sampleL, true);
    view.setInt16(offset + 2, sampleR, true);
    offset += 4;
  }

  const outDir = path.resolve(__dirname, '../public/music/purple-rain-2017');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPathWav = path.join(outDir, '01-purple-rain.wav');
  const outPathMp3 = path.join(outDir, '01-purple-rain.mp3');

  fs.writeFileSync(outPathWav, Buffer.from(buffer));
  fs.writeFileSync(outPathMp3, Buffer.from(buffer)); // Also write as .mp3 so both URLs resolve
  console.log(`Generated ${durationSeconds}s Purple Rain audio at:`, outPathWav, 'and', outPathMp3);
}

generatePurpleRainAudio();
