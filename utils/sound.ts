
// Simple synthesizer to avoid external dependencies
let audioCtx: AudioContext | null = null;

export const playChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    // Reuse the context to prevent "Too many AudioContexts" error
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(e => console.error("Audio resume failed", e));
    }

    const ctx = audioCtx;
    
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Envelope
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // "Ding" (E5)
    playNote(659.25, now, 1.5);
    // "Dong" (C5)
    playNote(523.25, now + 0.4, 2.0);

  } catch (e) {
    console.error("Audio playback failed", e);
  }
};
