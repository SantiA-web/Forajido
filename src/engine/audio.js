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

  /**
   * --- LOS DOS INSTRUMENTOS ---
   *
   * *(Santi: "me gustaría que añadieras una pequeña armónica y una guitarra de
   * fondo")*
   *
   * Siguen la misma regla que todo el audio del juego: no hay un solo archivo,
   * son osciladores. Lo que los hace sonar a instrumento y no a pitido es la
   * FORMA DE LA NOTA, no la onda — el ataque, la caída y qué armónicos deja
   * pasar el filtro.
   */

  /**
   * LA ARMÓNICA. Tres osciladores apenas desafinados entre sí.
   *
   * Ese desafine es todo el truco: una armónica tiene varias lengüetas sonando
   * juntas y nunca están perfectamente afinadas, y ese batido es lo que el oído
   * reconoce. Con un solo oscilador esto sería un pitido de consola.
   *
   * El ataque es LENTO (60 ms) porque es un instrumento de aire: el sonido
   * empieza cuando el aire ya está pasando, no de golpe como una cuerda.
   */
  function armonica(freq, duracion, gain, delay = 0) {
    if (!ctx) return;
    const t = now() + delay;

    const filtro = ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = freq * 2.2;
    filtro.Q.value = 1.4;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.06);
    amp.gain.setValueAtTime(gain, t + duracion * 0.55);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duracion);

    for (const [mult, tipo, parte] of [[1, 'square', 0.5], [1.004, 'sawtooth', 0.32], [0.996, 'square', 0.28]]) {
      const osc = ctx.createOscillator();
      osc.type = tipo;
      osc.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.value = parte;
      osc.connect(g).connect(filtro);
      osc.start(t);
      osc.stop(t + duracion + 0.05);
    }
    filtro.connect(amp).connect(master);
  }

  /**
   * LA GUITARRA CRIOLLA. Cuerda de nailon, no de acero.
   *
   * *(Santi: "la guitarra tiene que sonar más criolla")*
   *
   * 🔺 LA PRIMERA VERSIÓN ERA UNA CUERDA DE ACERO: ataque de 6 ms y mucha
   * sierra en la mezcla, o sea brillante y con filo. Una criolla es lo
   * contrario, y son tres cosas concretas:
   *
   *  1. **El ataque es más blando** (18 ms contra 6). El nailon tarda más en
   *     arrancar que el acero; ese pequeño retardo es la mitad de por qué una
   *     criolla suena "dulce" y una eléctrica "filosa".
   *  2. **Menos armónicos agudos.** Ahora manda el triángulo y la sierra quedó
   *     de acompañamiento. El nailon tiene mucho menos contenido agudo.
   *  3. **El filtro abre mucho menos** (×3,2 en vez de ×6) y se cierra más
   *     rápido: la nota se redondea enseguida en vez de quedar sonando brillante.
   *
   * El filtro cerrándose mientras la nota cae se queda, porque eso no es del
   * material sino de cualquier cuerda: pierde los agudos antes que los graves, y
   * sin eso suena a órgano apagándose en vez de a cuerda.
   */
  function guitarra(freq, duracion, gain, delay = 0) {
    if (!ctx) return;
    const t = now() + delay;

    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.setValueAtTime(freq * 3.2, t);
    filtro.frequency.exponentialRampToValueAtTime(Math.max(110, freq * 1.15), t + duracion * 0.5);
    filtro.Q.value = 0.6;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.018);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duracion);

    for (const [mult, tipo, parte] of [[1, 'triangle', 0.62], [1, 'sawtooth', 0.16], [2.005, 'sine', 0.14]]) {
      const osc = ctx.createOscillator();
      osc.type = tipo;
      osc.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.value = parte;
      osc.connect(g).connect(filtro);
      osc.start(t);
      osc.stop(t + duracion + 0.05);
    }
    filtro.connect(amp).connect(master);
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
      // 🔺 El volumen salió a una perilla (`CONFIG.ambiente.zancadaVolumen`)
      // porque la primera versión quedó muy baja jugándola — *(Santi: "el
      // sonido de los cascos del caballo quedaron muy bajos en volumen")*. Las
      // tres pisadas se mueven JUNTAS: lo que hay que poder cambiar es cuánto
      // se oye el caballo, no el equilibrio interno de la zancada, que es lo
      // que le da la forma de "tucu-TÚN".
      //
      // 🔺 CADA PISADA SON TRES CAPAS *(Santi: "que tenga el sonido de los
      // cascos al golpear la arena", y "casi que no se escuchan")*:
      //   - el GOLPE sordo de siempre, abajo;
      //   - un TOC de medios, corto: sin él las pisadas vivían por debajo de
      //     400 Hz, que en parlantes chicos directamente no suena;
      //   - la ARENA: un soplido agudo que empieza un instante después del golpe
      //     y dura el doble — la arena que salta, no el casco.
      // La tercera sigue siendo la acentuada (más fuerte y más grave).
      const v = CONFIG.ambiente.zancadaVolumen;
      const pisada = (delay, fuerza, grave) => {
        noise({ duration: 0.06, cutoff: 900 * grave, endCutoff: 110, gain: 0.1 * fuerza * v, delay });
        noise({ duration: 0.035, cutoff: 650 * grave, endCutoff: 280, gain: 0.05 * fuerza * v,
          type: 'bandpass', q: 1.3, delay });
        noise({ duration: 0.11, cutoff: 4200, endCutoff: 1600, gain: 0.035 * fuerza * v,
          type: 'highpass', q: 0.7, attack: 0.006, delay: delay + 0.01 });
      };
      pisada(0, 0.85, 1);
      pisada(0.085, 0.75, 0.95);
      pisada(0.175, 1.25, 0.8);
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

  /**
   * --- LA MÚSICA ---
   *
   * NO ES UN BUCLE, Y ÉSA ES LA DECISIÓN QUE LA SOSTIENE. Un tema de ocho
   * compases repitiéndose es insoportable a los cinco minutos, y este juego se
   * juega en sesiones largas mirando la misma pantalla (el campamento, el
   * pueblo). Así que no hay tema: hay **frases sueltas separadas por
   * silencios**, sorteadas de una escala.
   *
   * LA ESCALA ES PENTATÓNICA MENOR, que es la de la armónica de blues y la que
   * el oído asocia sin pensarlo con desierto y soledad. Y tiene una propiedad
   * que acá importa más que su color: **no tiene notas que suenen mal juntas**,
   * así que se pueden sortear al azar sin que salga nunca una frase fea. Una
   * escala mayor completa necesitaría reglas de armonía; ésta no necesita
   * ninguna.
   *
   * LOS DOS INSTRUMENTOS NO TOCAN JUNTOS a propósito: la guitarra pone una nota
   * grave cada tanto —el suelo— y la armónica pasa por arriba con frases
   * cortas. Si sonaran a la vez y al mismo ritmo serían una canción, y una
   * canción compite con el juego. Así son dos cosas que pasan en el mismo lugar.
   */

  /** La menor pentatónica: A, C, D, E, G, en dos octavas. */
  const ESCALA = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];

  /**
   * LOS ACORDES DEL ARPEGIO — Am, F, G, Am.
   *
   * Los cuatro son de La menor, así que **la escala pentatónica de la armónica
   * cae bien sobre cualquiera de ellos**, en cualquier momento. Eso es lo que
   * permite que los dos instrumentos toquen sueltos, sin coordinarse: no hay
   * forma de que choquen.
   *
   * Se descartó la cadencia andaluza (Am-G-F-**E**), que es más criolla todavía,
   * justamente por eso: el Mi mayor trae un Sol sostenido que pelea con el Sol
   * natural de la pentatónica, y habría obligado a sincronizar la armónica con
   * el acorde. No vale la pena esa complejidad para un fondo.
   *
   * Cada acorde es grave + tres notas de arriba: el pulgar y tres dedos, que es
   * como se puntea una criolla.
   */
  const ACORDES = [
    [110.00, 164.81, 220.00, 261.63],   // Am
    [ 87.31, 174.61, 220.00, 261.63],   // F
    [ 98.00, 146.83, 196.00, 246.94],   // G
    [110.00, 164.81, 220.00, 329.63],   // Am
  ];

  /**
   * EL PATRÓN DEL PUNTEO: grave, y después los de arriba.
   *
   * El 0 es la cuerda grave y suena dos veces por acorde — es lo que marca
   * dónde empieza el compás. Los demás son los dedos subiendo y bajando.
   */
  const PATRON = [0, 1, 2, 3, 0, 2, 3, 1];

  let musicaOn = false;
  let armonicaTimer = 0;
  let pulsoTimer = 0;
  let pasoDelPatron = 0;
  let acordeActual = 0;

  function arrancarMusica() {
    musicaOn = true;
    // La guitarra entra casi enseguida (es la base, y sin base no hay música);
    // la armónica se toma su tiempo, porque entrar a una pantalla y que te
    // reciba una melodía se siente a menú, no a lugar.
    pulsoTimer = 0.4;
    pasoDelPatron = 0;
    acordeActual = 0;
    armonicaTimer = 6 + Math.random() * 8;
  }

  function pararMusica() {
    musicaOn = false;
  }

  /**
   * El reloj va por `dt` desde la escena, igual que el trueno: así se para solo
   * cuando la escena se para.
   *
   * 🔺 ANTES ESTO ERAN NOTAS SUELTAS Y NO SONABA A MÚSICA — *(Santi: "no parece
   * música, sino sonidos aislados")*. La primera versión evitaba el bucle
   * separando todo con silencios largos, y se pasó de largo: sin NADA que una
   * una nota con la siguiente, lo que queda son ruiditos, por más afinados que
   * estén.
   *
   * Lo que convierte sonidos aislados en música es la CONTINUIDAD. Así que la
   * guitarra dejó de ser un evento cada tantos segundos y pasó a ser lo que una
   * guitarra criolla de fondo es de verdad: **un arpegio que no para**. La
   * armónica sigue entrando de a ratos, pero ahora tiene sobre qué apoyarse.
   *
   * Y el bucle deja de importar cuando el que se repite es el acompañamiento:
   * nadie se cansa de un punteo suave: de lo que uno se cansa es de una MELODÍA
   * repetida, y la melodía —la armónica— sigue sin repetirse nunca.
   */
  function updateMusica(dt) {
    if (!musicaOn || !ctx || !CONFIG.audio.enabled) return;
    const m = CONFIG.ambiente;

    pulsoTimer -= dt;
    if (pulsoTimer <= 0) {
      pulsoTimer = m.pulsoCada;
      puntear(m);
    }

    armonicaTimer -= dt;
    if (armonicaTimer <= 0) {
      armonicaTimer = m.armonicaCada + Math.random() * m.armonicaVariacion;
      tocarFrase(m);
    }
  }

  /**
   * Una púa del arpegio. La cuerda grave suena más fuerte y dura más: es la que
   * sostiene el acorde mientras las de arriba pasan por encima.
   *
   * LA VARIACIÓN ES CHIQUITA A PROPÓSITO — algún dedo que se saltea y un poco de
   * volumen al azar. Alcanza para que el punteo no se oiga como una máquina, y
   * es poca para que siga siendo una BASE. Un acompañamiento que llama la
   * atención dejó de ser un acompañamiento.
   */
  function puntear(m) {
    const cuerda = PATRON[pasoDelPatron % PATRON.length];
    /**
     * 🐛 EL ACORDE SE ADELANTABA UNA NOTA. Avanzaba antes de calcular la
     * frecuencia, así que la última púa del patrón ya sonaba con el acorde
     * siguiente — medido: a los 3,4 s aparecía un Fa en medio del La menor.
     * Musicalmente no quedaba mal (es una anticipación, que existe de verdad),
     * pero era un accidente del orden de dos líneas, no una decisión. Ahora se
     * toca la nota y RECIÉN DESPUÉS cambia el acorde.
     */
    const esGrave = cuerda === 0;
    const freq = ACORDES[acordeActual][cuerda];

    pasoDelPatron++;
    if (pasoDelPatron % PATRON.length === 0) {
      acordeActual = (acordeActual + 1) % ACORDES.length;
    }

    // Un dedo que se saltea de vez en cuando. Nunca el grave: ése marca el pulso.
    if (!esGrave && Math.random() < 0.12) return;

    const vol = m.guitarraVolumen * (esGrave ? 1 : 0.66) * (0.88 + Math.random() * 0.24);
    guitarra(freq, esGrave ? 2.2 : 1.5, vol);
  }

  /**
   * Una frase de 2 a 4 notas que CAMINA por la escala en vez de saltar al azar.
   *
   * Notas sorteadas independientes suenan a alguien probando un instrumento;
   * moverse de a uno o dos escalones desde la anterior es lo que las convierte
   * en una melodía. Y la última dura el doble: una frase que termina cortada se
   * oye como un error, una que se apoya al final se oye como una frase.
   */
  function tocarFrase(m) {
    const cuantas = 3 + Math.floor(Math.random() * 3);
    let i = Math.floor(Math.random() * ESCALA.length);
    let cuando = 0;
    for (let n = 0; n < cuantas; n++) {
      const ultima = n === cuantas - 1;
      const dur = ultima ? 1.1 + Math.random() * 0.6 : 0.32 + Math.random() * 0.28;
      /**
       * La última NO suena más fuerte, sólo más larga. Es música de fondo: si la
       * frase termina en un golpe, te hace levantar la vista — que es
       * exactamente lo que un fondo no puede hacer. Se apoya durando, no
       * subiendo.
       */
      armonica(ESCALA[i], dur, m.armonicaVolumen * (ultima ? 0.9 : 0.85), cuando);
      cuando += dur * (ultima ? 1 : 0.7 + Math.random() * 0.35);
      const paso = (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2));
      i = Math.max(0, Math.min(ESCALA.length - 1, i + paso));
    }
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
    /** La música: frases sueltas, no un bucle. Ver la nota de `updateMusica`. */
    arrancarMusica,
    pararMusica,
    updateMusica,
    /** Toca un efecto por nombre; si el audio no arrancó todavía, no pasa nada. */
    play(name) {
      if (!ctx || !CONFIG.audio.enabled) return;
      const fn = sfx[name];
      if (fn) fn();
    },
  };
}
