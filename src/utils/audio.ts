/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SoundEffectType = 'eat' | 'gold' | 'gameover' | 'click' | 'flip' | 'match' | 'move' | 'score2048';

export function playSound(type: SoundEffectType, enabled: boolean): void {
  if (!enabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'eat':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start();
        osc.stop(now + 0.15);
        break;

      case 'gold':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.16); // D6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start();
        osc.stop(now + 0.3);
        break;

      case 'gameover':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(293.66, now); // D4
        osc.frequency.linearRampToValueAtTime(110, now + 0.45); // A2
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start();
        osc.stop(now + 0.5);
        break;

      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392.00, now); // G4
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.start();
        osc.stop(now + 0.06);
        break;

      case 'flip':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(329.63, now); // E4
        osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.08); // C5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start();
        osc.stop(now + 0.1);
        break;

      case 'match':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.2); // E6
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start();
        osc.stop(now + 0.25);
        break;

      case 'move':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.start();
        osc.stop(now + 0.04);
        break;

      case 'score2048':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1046.50, now + 0.06); // C6
        osc.frequency.setValueAtTime(1318.51, now + 0.12); // E6
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start();
        osc.stop(now + 0.22);
        break;
    }
  } catch (e) {
    console.warn('Audio synthesis failed (context probably suspended by browser permissions)', e);
  }
}
