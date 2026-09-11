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

    // La escena ya había pedido su fondo antes del primer clic: se repone acá.
    reponerCapas();
    if (wantAmbience) startAmbience();
  }

  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  const now = () => ctx.currentTime;

  /**
   * Golpe de ruido filtrado: disparos, impactos, golpes.
   *
   * `delay` y `attack` existen por el TRUENO y son lo único que se le agregó a
   * esta función desde que se escribió. Todo lo demás del juego es un golpe que
   * empieza a todo volumen y cae — un disparo, un puñetazo—, pero un trueno
   * lejano **crece**: si arranca a full se oye como una explosión al lado, que
   * es justo lo contrario. Los valores por defecto dejan el comportamiento de
   * siempre intacto.
   */
  function noise({
    duration = 0.1, cutoff = 2000, endCutoff = 200, gain = 0.4,
    type = 'lowpass', q = 1, delay = 0, attack = 0,
  }) {
    if (!ctx) return;
    const t0 = now() + delay;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(cutoff, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, endCutoff), t0 + duration);

    const amp = ctx.createGain();
    if (attack > 0) {
      amp.gain.setValueAtTime(0.0001, t0);
      amp.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    } else {
      amp.gain.setValueAtTime(gain, t0);
    }
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    src.connect(filter).connect(amp).connect(master);
    src.start(t0);
    src.stop(t0 + duration + 0.02);
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
     * UNA ZANCADA ENTERA — el "tucu-TÚN", no un tic.
     *
     * *(Santi, jugándolo: "los cascos del caballo galopan muy rápido. Hoy es más
     * un 'tuc-tuc-tuc-tuc-tuc' rápido, y debería ser un 'tucutún-tucutún' más
     * pausado y acorde a un cuadrúpedo")*
     *
     * 🐛 LA PRIMERA VERSIÓN TOCABA UN GOLPE SUELTO cada X segundos, parejo. Eso
     * no es un caballo: **un animal de cuatro patas no pisa a intervalos
     * iguales**. Un galope es un GRUPO de pisadas juntas y después un silencio —
     * el momento en que las cuatro patas están en el aire. Golpes parejos suenan
     * a máquina, y era exactamente lo que se oía.
     *
     * Así que la unidad no es el casco: es la ZANCADA. Tres pisadas apretadas
     * (0 / 85 / 175 ms) y el silencio lo pone el intervalo hasta la próxima.
     *
     * LA TERCERA ES LA ACENTUADA — más grave y más fuerte. Es la que hace el
     * "TÚN" y la que convierte tres ruiditos en un ritmo con forma; sin ella se
     * oyen tres golpes iguales y vuelve a sonar a máquina, sólo que de a tres.
     */
    zancada() {
      noise({ duration: 0.045, cutoff: 400, endCutoff: 100, gain: 0.085 });
      noise({ duration: 0.045, cutoff: 360, endCutoff: 95,  gain: 0.075, delay: 0.085 });
      noise({ duration: 0.065, cutoff: 300, endCutoff: 70,  gain: 0.125, delay: 0.175 });
    },

    /**
     * UN CHASQUIDO DE LA FOGATA. Igual que el casco: chiquito a propósito.
     * Lo que hace viva a una fogata no es el volumen, es que los chasquidos
     * caigan IRREGULARES — por eso el reloj que lo llama tiene variación.
     */
    chispa() {
      noise({ duration: 0.045, cutoff: 2600, endCutoff: 700, gain: 0.075, type: 'bandpass', q: 2 });
    },

    /**
     * EL TRUENO LEJANO — el que se oye la mayor parte del tiempo.
     *
     * CRECE Y SE APAGA, no golpea. Es toda la diferencia con la explosión que
     * está más arriba en este mismo archivo: una explosión arranca a full y
     * cae; un trueno lejano llega rodando desde el horizonte. Por eso se le
     * agregó `attack` a `noise()` — sin eso esto sonaba a dinamita al lado.
     *
     * Y NO PUEDE CONFUNDIRSE CON UNA EXPLOSIÓN, porque en este juego una
     * explosión significa que algo acaba de pasar. Se separan por tres cosas:
     * dura el triple, no tiene nada agudo (la explosión lleva un `highpass`
     * encima) y no sacude la cámara.
     */
    truenoLejos() {
      noise({ duration: 2.4, cutoff: 260, endCutoff: 50, gain: 0.16, attack: 0.7 });
      noise({ duration: 1.8, cutoff: 150, endCutoff: 40, gain: 0.12, attack: 0.5, delay: 0.3 });
      tone({ from: 48, to: 26, duration: 2.0, gain: 0.1, type: 'sine', delay: 0.2 });
    },

    /**
     * EL TRUENO CERCA — el que te hace levantar la cabeza.
     *
     * Éste SÍ golpea primero: el chasquido seco del rayo y, atrás, el retumbe
     * largo. El orden importa — crack primero, rumor después — porque es el
     * único momento en que la tormenta deja de ser un fondo y se vuelve un
     * evento.
     */
    truenoCerca() {
      noise({ duration: 0.18, cutoff: 7000, endCutoff: 1800, gain: 0.3, type: 'highpass', q: 0.8 });
      noise({ duration: 0.5, cutoff: 1800, endCutoff: 200, gain: 0.34 });
      noise({ duration: 2.6, cutoff: 320, endCutoff: 45, gain: 0.3, attack: 0.12, delay: 0.1 });
      tone({ from: 70, to: 24, duration: 2.2, gain: 0.2, type: 'sine', delay: 0.08 });
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

  /**
   * --- LAS CAPAS DE FONDO ---
   *
   * Ruido continuo y filtrado, con NOMBRE y con volumen que se puede mover en
   * vivo. Antes había un solo fondo, escrito a mano y fijo: el traqueteo del
   * tren, que se prendía y se apagaba y nada más.
   *
   * POR QUÉ HIZO FALTA: la lluvia sobre la chapa no es un sonido, son tres —
   * el repiqueteo en el techo, el siseo del agua y el viento— y **cuánto suena
   * cada uno depende de dónde estés parado**. Bajo techo te golpea la chapa;
   * en el enganche o arriba del tren te moja a vos. Eso no se puede hacer
   * prendiendo y apagando: hay que poder subir una y bajar otra sin cortes.
   *
   * Cada capa es una fuente de ruido en loop → filtro → volumen → master. La
   * receta no cambia nunca; lo que se mueve es el volumen.
   */
  const capas = new Map();
  /** Lo que se pidió antes del primer clic, para reponerlo al desbloquear. */
  const capasPendientes = new Map();

  function ambiente(nombre, receta) {
    capasPendientes.set(nombre, receta);
    if (!ctx || capas.has(nombre)) return;

    const { cutoff = 400, q = 1, type = 'lowpass', gain = 0.1, respira = null } = receta;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.value = cutoff;

    const amp = ctx.createGain();
    amp.gain.value = gain;

    src.connect(filter).connect(amp).connect(master);
    src.start();

    const lfos = respira ? soplar(amp, filter, gain, cutoff, respira) : [];
    capas.set(nombre, { src, amp, filter, lfos });
  }

  /**
   * EL VIENTO TIENE QUE RESPIRAR, O SUENA A DISCO RAYADO.
   *
   * *(Santi, jugándolo: "el 'viento' no debería estar como sonido permanente y
   * además no parece sonido de viento, sino como que fuera un disco rayado")*
   *
   * Y tenía toda la razón: **ruido blanco filtrado a volumen constante no suena
   * a aire, suena a estática.** Lo que hace que el oído lea "viento" no es el
   * filtro — es que VARÍE. Un nivel fijo lo lee como una máquina.
   *
   * DOS OSCILADORES LENTOS Y DE PERÍODOS QUE NO ENCAJAN, que es el mismo truco
   * que el juego ya usa para el latido de la fogata (`Math.sin(scroll*7)` +
   * `Math.sin(scroll*13)` en campScene). Con uno solo el viento sube y baja como
   * un metrónomo y se nota el bucle; con dos que nunca coinciden, la suma no se
   * repite de forma audible.
   *
   * SOPLA TAMBIÉN SOBRE EL FILTRO, no sólo sobre el volumen. Una ráfaga real no
   * es "lo mismo más fuerte": además se abre, se vuelve más aguda. Modular las
   * dos cosas a la vez es lo que separa una ráfaga de una perilla de volumen.
   *
   * Y CON `profundidad` CERCA DE 1 EL FONDO DESAPARECE ENTRE RÁFAGA Y RÁFAGA,
   * que es la otra mitad del pedido: el viento deja de ser permanente sin que
   * nadie lo apague.
   */
  function soplar(amp, filter, base, cutoff, { profundidad = 0.7, cada = 7 }) {
    const lfos = [];
    // Los dos períodos son primos entre sí a propósito: 1 y 1,61 no vuelven a
    // coincidir nunca en un tiempo que se pueda oír como repetición.
    for (const [periodo, parte] of [[cada, 0.6], [cada * 1.61, 0.4]]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 1 / periodo;

      const prof = ctx.createGain();
      prof.gain.value = base * profundidad * parte;
      osc.connect(prof).connect(amp.gain);
      osc.start();
      lfos.push(osc);

      // Y la misma ráfaga abre el filtro: más fuerte Y más aguda.
      const brillo = ctx.createGain();
      brillo.gain.value = cutoff * 0.35 * parte;
      osc.connect(brillo).connect(filter.frequency);
    }
    return lfos;
  }

  /**
   * Sube o baja una capa. `rampa` en segundos: sin ella el cambio es un salto
   * y se oye el click. Con 0,25 s la lluvia "entra" al salir al enganche en vez
   * de aparecer de golpe.
   */
  function volumen(nombre, valor, rampa = 0.25) {
    const receta = capasPendientes.get(nombre);
    if (receta) receta.gain = valor;
    const c = capas.get(nombre);
    if (!c || !ctx) return;
    c.amp.gain.cancelScheduledValues(now());
    c.amp.gain.setValueAtTime(Math.max(0.0001, c.amp.gain.value), now());
    c.amp.gain.linearRampToValueAtTime(Math.max(0.0001, valor), now() + rampa);
  }

  function quitarAmbiente(nombre) {
    capasPendientes.delete(nombre);
    const c = capas.get(nombre);
    if (!c) return;
    try { c.src.stop(); } catch { /* ya estaba parado */ }
    // Los osciladores del soplido también, o quedan corriendo para siempre
    // modulando un nodo que ya no suena.
    for (const osc of c.lfos || []) { try { osc.stop(); } catch { /* ya estaba */ } }
    capas.delete(nombre);
  }

  function quitarTodoElAmbiente() {
    for (const nombre of [...capas.keys()]) quitarAmbiente(nombre);
    capasPendientes.clear();
  }

  /** Repone las capas que se pidieron antes de que el navegador nos dejara sonar. */
  function reponerCapas() {
    for (const [nombre, receta] of [...capasPendientes]) ambiente(nombre, receta);
  }

  /** Fondo continuo: el traqueteo del tren. Es lo que hace que el vagón viva. */
  function startAmbience() {
    wantAmbience = true;
    ambiente('tren', { cutoff: 220, gain: 0.16 });
    if (!ctx || clackHandle) return;

    // Clac-clac de las juntas de la vía.
    clackHandle = setInterval(() => {
      if (!ctx) return;
      noise({ duration: 0.05, cutoff: 420, endCutoff: 90, gain: 0.13 });
      noise({ duration: 0.05, cutoff: 380, endCutoff: 80, gain: 0.1, delay: 0.13 });
    }, 900);
  }

  function stopAmbience() {
    wantAmbience = false;
    if (clackHandle) { clearInterval(clackHandle); clackHandle = null; }
    quitarAmbiente('tren');
  }

  return {
    unlock,
    startAmbience,
    stopAmbience,
    /** Capas de fondo con nombre: ver la nota de `ambiente`, más arriba. */
    ambiente,
    volumen,
    quitarAmbiente,
    quitarTodoElAmbiente,
    /** Toca un efecto por nombre; si el audio no arrancó todavía, no pasa nada. */
    play(name) {
      if (!ctx || !CONFIG.audio.enabled) return;
      const fn = sfx[name];
      if (fn) fn();
    },
  };
}
