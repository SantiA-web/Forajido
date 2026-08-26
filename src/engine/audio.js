/**
 * Audio sintetizado con la Web Audio API.
 *
 * No hay ni un solo archivo de sonido: todo se genera con ruido y osciladores.
 * Es feo comparado con sonido grabado, pero cuesta cero y sirve para lo que
 * importa ahora, que es sentir el ritmo del tiroteo. Cuando el juego funcione,
 * se reemplaza cada función por un sample sin tocar nada más.
 *
 * Los navegadores no dejan sonar nada hasta que el usuario toca algo, así que
 * el contexto se crea con el primer clic o la primera tecla.
 */

import { CONFIG } from '../data/config.js';

export function createAudio() {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let ambience = null;
  let clackHandle = null;
  let wantAmbience = false;

  function unlock() {
    if (ctx || !CONFIG.audio.enabled) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = CONFIG.audio.master;
    master.connect(ctx.destination);

    // Un segundo de ruido blanco reutilizado por todos los efectos.
    const length = ctx.sampleRate;
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    // El asalto ya había pedido el sonido de fondo antes del primer clic.
    if (wantAmbience) startAmbience();
  }

  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  const now = () => ctx.currentTime;

  /** Golpe de ruido filtrado: disparos, impactos, golpes. */
  function noise({ duration = 0.1, cutoff = 2000, endCutoff = 200, gain = 0.4, type = 'lowpass', q = 1 }) {
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(cutoff, now());
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, endCutoff), now() + duration);

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, now());
    amp.gain.exponentialRampToValueAtTime(0.0001, now() + duration);

    src.connect(filter).connect(amp).connect(master);
    src.start();
    src.stop(now() + duration + 0.02);
  }

  /** Tono con caída de frecuencia: cuerpos, gritos, silbatos. */
  function tone({ from = 440, to = 220, duration = 0.2, gain = 0.2, type = 'sine', delay = 0 }) {
    if (!ctx) return;
    const t = now() + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + duration);

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(amp).connect(master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  const sfx = {
    playerShot() {
      noise({ duration: 0.14, cutoff: 3200, endCutoff: 240, gain: 0.5 });
      tone({ from: 110, to: 45, duration: 0.12, gain: 0.32, type: 'sine' });
    },

    enemyShot() {
      noise({ duration: 0.12, cutoff: 1700, endCutoff: 180, gain: 0.24 });
      tone({ from: 85, to: 40, duration: 0.1, gain: 0.14, type: 'sine' });
    },

    /** El martillo del arma: es el aviso de que un guardia va a disparar. */
    cock() {
      noise({ duration: 0.03, cutoff: 5200, endCutoff: 3000, gain: 0.16, type: 'highpass', q: 2 });
      noise({ duration: 0.03, cutoff: 4200, endCutoff: 2600, gain: 0.12, type: 'highpass', q: 2 });
    },

    hitFlesh() {
      noise({ duration: 0.07, cutoff: 900, endCutoff: 120, gain: 0.34 });
      tone({ from: 190, to: 70, duration: 0.09, gain: 0.16, type: 'triangle' });
    },

    hitWall() {
      noise({ duration: 0.05, cutoff: 2600, endCutoff: 800, gain: 0.16 });
    },

    /** El AVISO del traqueteo: un crujido de madera, todavía sin efecto. */
    trenCruje() {
      noise({ duration: 0.22, cutoff: 900, endCutoff: 500, gain: 0.1, type: 'bandpass', q: 3 });
      noise({ duration: 0.16, cutoff: 700, endCutoff: 400, gain: 0.08, type: 'bandpass', q: 4 });
    },

    /** El sacudón cuando el tren acelera: un resoplido grave que sube. */
    trenAcelera() {
      noise({ duration: 0.4, cutoff: 500, endCutoff: 1400, gain: 0.22, type: 'lowpass' });
      tone({ from: 55, to: 90, duration: 0.35, gain: 0.18, type: 'sawtooth' });
    },

    /** El sacudón cuando el tren frena: un chirrido metálico. */
    trenFrena() {
      noise({ duration: 0.45, cutoff: 3400, endCutoff: 900, gain: 0.24, type: 'highpass', q: 1.5 });
      tone({ from: 260, to: 90, duration: 0.4, gain: 0.16, type: 'sawtooth' });
    },

    playerHurt() {
      tone({ from: 320, to: 90, duration: 0.28, gain: 0.3, type: 'sawtooth' });
      noise({ duration: 0.12, cutoff: 700, endCutoff: 100, gain: 0.28 });
    },

    kill() {
      tone({ from: 240, to: 60, duration: 0.35, gain: 0.18, type: 'triangle' });
      noise({ duration: 0.18, cutoff: 700, endCutoff: 90, gain: 0.22 });
    },

    scream() {
      tone({ from: 900, to: 420, duration: 0.42, gain: 0.16, type: 'sawtooth' });
      tone({ from: 1350, to: 600, duration: 0.36, gain: 0.08, type: 'triangle', delay: 0.05 });
    },

    loot() {
      tone({ from: 880, to: 880, duration: 0.07, gain: 0.16, type: 'square' });
      tone({ from: 1320, to: 1320, duration: 0.11, gain: 0.14, type: 'square', delay: 0.07 });
    },

    strongbox() {
      noise({ duration: 0.3, cutoff: 1400, endCutoff: 160, gain: 0.4 });
      tone({ from: 160, to: 60, duration: 0.4, gain: 0.24, type: 'square' });
    },

    /** Silbato: alarma y llegada de refuerzos. */
    whistle() {
      tone({ from: 1500, to: 1900, duration: 0.22, gain: 0.13, type: 'square' });
      tone({ from: 1900, to: 1400, duration: 0.3, gain: 0.13, type: 'square', delay: 0.2 });
    },

    escape() {
      tone({ from: 300, to: 700, duration: 0.3, gain: 0.2, type: 'triangle' });
      tone({ from: 700, to: 1050, duration: 0.35, gain: 0.16, type: 'triangle', delay: 0.16 });
    },

    captured() {
      tone({ from: 260, to: 70, duration: 0.9, gain: 0.24, type: 'sawtooth' });
    },

    cover() {
      noise({ duration: 0.06, cutoff: 900, endCutoff: 200, gain: 0.14 });
    },

    /** El aire del golpe cuando no toca a nadie. */
    swing() {
      noise({ duration: 0.13, cutoff: 1800, endCutoff: 500, gain: 0.16, type: 'bandpass', q: 1.5 });
    },

    /** Un golpe que sí conecta. */
    melee() {
      noise({ duration: 0.09, cutoff: 600, endCutoff: 110, gain: 0.42 });
      tone({ from: 150, to: 55, duration: 0.12, gain: 0.22, type: 'triangle' });
    },

    /** La mecha prendiendo: un chisporroteo corto y agudo. */
    fuse() {
      noise({ duration: 0.35, cutoff: 6000, endCutoff: 2600, gain: 0.1, type: 'highpass', q: 1.2 });
    },

    /** El estruendo. Grave, largo y con la tierra cayendo después. */
    explosion() {
      noise({ duration: 0.7, cutoff: 900, endCutoff: 45, gain: 0.85 });
      tone({ from: 90, to: 22, duration: 0.75, gain: 0.5, type: 'sine' });
      tone({ from: 200, to: 40, duration: 0.35, gain: 0.28, type: 'sawtooth' });
      noise({ duration: 0.5, cutoff: 3000, endCutoff: 400, gain: 0.2, type: 'highpass' });
    },

    /** El degüello por la espalda: corto y feo, sin estruendo. */
    takedown() {
      noise({ duration: 0.16, cutoff: 1100, endCutoff: 130, gain: 0.3 });
      tone({ from: 220, to: 48, duration: 0.3, gain: 0.14, type: 'sawtooth', delay: 0.05 });
    },

    /**
     * EL CAZARRECOMPENSAS ACECHANDO. Una tabla que cruje bajo una bota, lejos,
     * atrás. No es un disparo ni un grito — tiene que sonar a alguien caminando
     * despacio, no a peligro inminente. Se toca cada tanto mientras acecha
     * (ver `systems/boss.js`), no en loop: un crujido constante deja de
     * notarse a los cinco segundos.
     */
    acechando() {
      noise({ duration: 0.14, cutoff: 500, endCutoff: 140, gain: 0.11, type: 'bandpass', q: 0.9 });
    },

    /** El pasador de hierro de la tranquera, corriéndose. Metal sobre madera. */
    tranquera() {
      noise({ duration: 0.12, cutoff: 2400, endCutoff: 700, gain: 0.22, type: 'bandpass', q: 1.4 });
      tone({ from: 180, to: 120, duration: 0.18, gain: 0.14, type: 'square', delay: 0.06 });
    },

    /**
     * LA MANADA SALIENDO. Grave y sostenido —los cascos— con un mugido encima
     * para que no se confunda con una explosión: esto no revienta, ARRANCA.
     */
    estampida() {
      noise({ duration: 0.9, cutoff: 340, endCutoff: 120, gain: 0.5 });
      tone({ from: 70, to: 55, duration: 0.9, gain: 0.3, type: 'sine' });
      tone({ from: 320, to: 180, duration: 0.5, gain: 0.16, type: 'sawtooth', delay: 0.12 });
    },
  };

  /** Fondo continuo: el traqueteo del tren. Es lo que hace que el vagón viva. */
  function startAmbience() {
    wantAmbience = true;
    if (!ctx || ambience) return;

    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;

    const amp = ctx.createGain();
    amp.gain.value = 0.16;

    src.connect(filter).connect(amp).connect(master);
    src.start();
    ambience = { src, amp };

    // Clac-clac de las juntas de la vía.
    clackHandle = setInterval(() => {
      if (!ctx) return;
      noise({ duration: 0.05, cutoff: 420, endCutoff: 90, gain: 0.13 });
      setTimeout(() => noise({ duration: 0.05, cutoff: 380, endCutoff: 80, gain: 0.1 }), 130);
    }, 900);
  }

  function stopAmbience() {
    wantAmbience = false;
    if (clackHandle) { clearInterval(clackHandle); clackHandle = null; }
    if (!ambience) return;
    try { ambience.src.stop(); } catch { /* ya estaba parado */ }
    ambience = null;
  }

  return {
    unlock,
    startAmbience,
    stopAmbience,
    /** Toca un efecto por nombre; si el audio no arrancó todavía, no pasa nada. */
    play(name) {
      if (!ctx || !CONFIG.audio.enabled) return;
      const fn = sfx[name];
      if (fn) fn();
    },
  };
}
