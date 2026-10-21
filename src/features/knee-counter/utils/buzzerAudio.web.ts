/**
 * Web Audio API synthesizer for playing a loud referee buzzer/whistle tone
 * when countdown timer completes. Runs client-side with no external audio file dependencies.
 */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioCtx();
  }
  return audioCtx;
}

export function playRefereeBuzzer(durationMs = 1200): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const duration = durationMs / 1000;

    // Dual-tone buzzer (sports referee buzzer: fundamental 880Hz + harmonic 1760Hz + 440Hz base)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(880, now);

    osc2.type = "square";
    osc2.frequency.setValueAtTime(1760, now);

    osc3.type = "sawtooth";
    osc3.frequency.setValueAtTime(440, now);

    // Envelope: Sharp loud attack, sustain, rapid decay at end
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.85, now + 0.04);
    gainNode.gain.setValueAtTime(0.85, now + duration - 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    osc3.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + duration);
    osc2.stop(now + duration);
    osc3.stop(now + duration);
  } catch (err) {
    // Graceful fallback if Web Audio is blocked by browser policy
    console.warn("Could not play referee buzzer audio:", err);
  }
}
