/**
 * LO QUE SE SUELTA ADENTRO DEL TREN: barriles y cajones.
 *
 * Este archivo define QUÉ es un rodante y cómo se dibuja. Cuándo aparece y qué
 * pasa cuando te alcanza lo maneja `scenes/raidScene.js`, igual que con los
 * carteles del techo.
 *
 * POR QUÉ TIENE VIDA. Un obstáculo que sólo se esquiva es un reflejo; uno que
 * además se puede reventar es una DECISIÓN, porque la munición es cara (el
 * Colt lleva 6 tiros y tarda 3,5 segundos en recargar). Ver el barril venir y
 * elegir entre gastarle dos balas o salirte del pasillo es exactamente el tipo
 * de pregunta que este juego hace en todos lados.
 *
 * SE VEN DISTINTOS Y SE MUEVEN DISTINTO, aunque hagan lo mismo. El barril rueda
 * (las duelas le corren por encima) y el cajón tumbea de canto, a los saltos.
 * Es la misma regla que separa a un guardia común de uno blindado: si dos cosas
 * se comportan igual pero se llaman distinto, no existe la diferencia.
 */

import { CONFIG } from '../data/config.js';

export const TIPOS_RODANTE = ['barril', 'cajon'];

/**
 * @param opciones  `dir` (-1 hacia la cola, +1 hacia la locomotora), `velocidad`
 *   y `vida` propias. Sin nada, sale un barril de los de siempre: rueda hacia
 *   la cola a la velocidad de `CONFIG.rodante`. La RES de una estampida
 *   (`tipo: 'res'`) es el mismo cuerpo con otros tres números y otro dibujo —
 *   no hizo falta una entidad nueva, y así comparte gratis la colisión, el
 *   empujón y el "sólo te pega una vez".
 */
export function createRodante(x, y, tipo, rng, opciones = {}) {
  const c = CONFIG.rodante;
  const vida = opciones.vida ?? c.vida;
  return {
    x, y,
    hw: opciones.hw ?? c.hw,
    hh: opciones.hh ?? c.hh,
    tipo,
    vida,
    vidaMax: vida,
    alive: true,

    /** Para qué lado va y a qué velocidad. Un barril: -1. Una res: +1. */
    dir: opciones.dir ?? -1,
    velocidad: opciones.velocidad ?? c.velocidad,

    /**
     * Una res no se revienta a tiros como un barril: es un bicho vivo que
     * pasa de largo. `balea: false` la saca del sistema de disparo sin
     * inventarle una regla aparte (ver systems/combat.js).
     */
    balea: opciones.balea ?? true,

    /** Cuánto lleva rodado. Es lo que mueve las duelas y el tumbo del cajón. */
    giro: rng ? rng.range(0, 6.28) : 0,
    hitFlash: 0,

    /** Cuánto le queda de recorrido antes de perderse (sólo la estampida). */
    alcance: opciones.alcance ?? Infinity,

    /** Ya te pegó: no te puede volver a pegar con el mismo. */
    golpeo: false,

    /** A quiénes ya atropelló, para no aturdir dos veces al mismo guardia. */
    atropellados: null,
  };
}

/** Devuelve true si con este tiro se rompió. */
export function dañarRodante(ro, cantidad) {
  if (!ro.alive) return false;
  ro.vida -= cantidad;
  ro.hitFlash = CONFIG.feel.hitFlash;
  if (ro.vida <= 0) {
    ro.vida = 0;
    ro.alive = false;
    return true;
  }
  return false;
}

export function updateRodante(ro, dt) {
  ro.hitFlash = Math.max(0, ro.hitFlash - dt);
  const paso = ro.velocidad * dt;
  ro.x += ro.dir * paso;
  ro.alcance -= paso;
  ro.giro += (ro.velocidad / 9) * dt;
}

// ------------------------------------------------------------------- dibujo

export function drawRodante(r, ro) {
  const col = CONFIG.colors;

  /**
   * EL POLVO QUE DEJA ATRÁS. No es adorno: quieto, un barril se confunde con
   * la carga que hay dibujada por todo el vagón, y en este juego todo lo que
   * te puede lastimar se anuncia antes (el guardia levanta el arma, la mecha
   * parpadea). La estela dice "esto viene en serio" de un vistazo, y encima
   * marca para qué lado va.
   */
  for (let i = 0; i < 6; i++) {
    const d = (ro.giro * 22 + i * 7) % 42;
    const t = 1 - d / 42;
    r.ctx.globalAlpha = t * 0.45;
    // Color CLARO a propósito: el polvo del galope es marrón porque cae sobre
    // la tierra, pero acá el piso ya es madera marrón y ahí desaparecería.
    // Y sale del lado contrario al que va, sea cual sea (`dir`).
    r.rect(ro.x - ro.dir * (ro.hw + d), ro.y - 4 + (i % 3) * 4 + Math.sin(d * 0.3) * 2,
      3, 1 + Math.round(t * 2), '#c0a884');
    r.ctx.globalAlpha = 1;
  }

  // La sombra, que es lo que lo despega del piso y lo hace leer como un bulto
  // y no como una mancha pintada en el suelo.
  r.ctx.globalAlpha = 0.3;
  r.box(ro.x, ro.y + ro.hh - 1, ro.hw - 1, 2, '#000');
  r.ctx.globalAlpha = 1;

  if (ro.tipo === 'res') dibujarRes(r, ro, col);
  else if (ro.tipo === 'cajon') dibujarCajon(r, ro, col);
  else dibujarBarril(r, ro, col);

  // Cuánto le queda, sólo si ya le pegaste. Las mismas rayitas que usan los
  // guardias: si el juego ya tiene una forma de decir "cuánto aguanta esto",
  // inventar otra sólo obliga a aprender dos.
  if (ro.balea && ro.vida < ro.vidaMax) {
    const ancho = 3;
    const total = ro.vidaMax * (ancho + 1) - 1;
    for (let i = 0; i < ro.vidaMax; i++) {
      r.rect(ro.x - total / 2 + i * (ancho + 1), ro.y - ro.hh - 6, ancho, 2,
        i < ro.vida ? '#e0c44a' : '#4a3a2a');
    }
  }
}

/**
 * EL BARRIL, visto desde arriba.
 *
 * Rueda con el eje cruzado al pasillo, así que desde arriba es un rectángulo:
 * los aros de metal quedan fijos cerca de las puntas (van alrededor del
 * barril, o sea a lo largo del pasillo) y las DUELAS corren en el otro sentido
 * y se desplazan mientras gira. Ese desplazamiento es todo lo que hace que se
 * lea "esto está rodando" y no "esto se desliza".
 */
function dibujarBarril(r, ro, col) {
  const w = ro.hw, h = ro.hh;
  const madera = ro.hitFlash > 0 ? '#fff' : col.seat;
  const oscuro = ro.hitFlash > 0 ? '#fff' : '#5b3d27';

  // El cuerpo, con las puntas comidas: un rectángulo pelado se lee como una
  // tabla, y con las esquinas mordidas se lee como algo redondo.
  r.rect(ro.x - w, ro.y - h + 2, w * 2, h * 2 - 4, madera);
  r.rect(ro.x - w + 2, ro.y - h, w * 2 - 4, h * 2, madera);
  r.rect(ro.x - w + 2, ro.y - h, w * 2 - 4, 2, col.seatTop);

  // Las duelas: líneas cruzadas al pasillo que se corren con el giro.
  for (let i = 0; i < 4; i++) {
    const d = ((ro.giro + i * 0.9) % 3.6) / 3.6;
    const px = Math.round(ro.x - w + 1 + d * (w * 2 - 2));
    r.rect(px, ro.y - h + 2, 1, h * 2 - 4, oscuro);
  }

  // Los dos aros de metal, quietos: son la referencia contra la que se ve
  // moverse a las duelas.
  r.rect(ro.x - w + 1, ro.y - h + 3, w * 2 - 2, 2, col.strongbox);
  r.rect(ro.x - w + 1, ro.y + h - 5, w * 2 - 2, 2, col.strongbox);
}

/**
 * LA RES, vista desde arriba y a la carrera.
 *
 * Tiene que leerse de un vistazo como ALGO VIVO y no como un bulto más: por
 * eso el lomo se balancea al trote (`giro`), lleva la mancha clara del pelaje
 * y los cuernos van adelante, marcando para dónde corre. Un rectángulo marrón
 * más se habría confundido con un cajón, y confundir tu propia jugada con una
 * amenaza sería el peor error de lectura posible.
 */
function dibujarRes(r, ro, col) {
  const trote = Math.sin(ro.giro * 2.4) * 1.2;
  const w = ro.hw, h = ro.hh;
  const d = ro.dir;                       // +1 = corre hacia la derecha
  const y = ro.y + trote;
  const cuerpo = ro.hitFlash > 0 ? '#fff' : '#5b4030';
  const lomo   = ro.hitFlash > 0 ? '#fff' : '#7a5a3e';
  const oscuro = ro.hitFlash > 0 ? '#fff' : '#3d2a1e';

  /**
   * LA CLAVE ES LA SILUETA, NO EL DETALLE. A este tamaño (18x14 px) cualquier
   * adorno se convierte en ruido: lo único que separa un animal de un cajón es
   * que NO SEA UN RECTÁNGULO. Por eso el cuerpo termina antes del frente y la
   * cabeza sale aparte, más angosta — ese escalón es lo que se lee.
   *
   * La primera versión dibujaba un rectángulo con otro rectángulo claro
   * adentro y los cuernos sueltos flotando al costado: se leía exactamente
   * como un cajón con tapa, que es la peor confusión posible cuando la mitad
   * de las cosas que ruedan por este pasillo SON cajones.
   */
  const cuerpoAtras = ro.x - d * w;
  const cuello = ro.x + d * (w - 5);

  // El lomo, con el frente y el fondo redondeados a mordiscos.
  r.rect(Math.min(cuerpoAtras, cuello), y - h + 1, w * 2 - 5, h * 2 - 2, cuerpo);
  r.rect(Math.min(cuerpoAtras, cuello) + 1, y - h, w * 2 - 7, h * 2, cuerpo);

  /**
   * La mancha del pelaje va ACOSTADA sobre el lomo y no parada.
   *
   * Vertical se leía como una raya de luz o una tapa; horizontal se lee como
   * el lomo del animal visto desde arriba, que es la vista que tenemos. Y va
   * corrida hacia el anca, porque una mancha centrada vuelve a parecer la tapa
   * de un cajón.
   */
  r.rect(Math.min(cuerpoAtras, cuello) + 2, y - h + 2, w, 4, lomo);
  r.rect(Math.min(cuerpoAtras, cuello) + 1, y - h, w * 2 - 7, 1, oscuro);

  // La cabeza: más angosta y más baja que el cuerpo. Ese escalón es la silueta.
  const cabeza = ro.x + d * (w - 1);
  r.rect(cabeza - 2, y - 3, 4, 6, cuerpo);
  r.rect(cabeza - 2, y - 3, 4, 2, oscuro);

  // Los cuernos, PEGADOS a la cabeza y saliendo hacia afuera y adelante.
  r.rect(cabeza - 1 + d, y - 5, 2, 2, '#d8cdbb');
  r.rect(cabeza - 1 + d, y + 3, 2, 2, '#d8cdbb');

  // Las patas, alternando: es lo que vende la carrera.
  const paso = Math.sin(ro.giro * 5) > 0 ? 1 : -1;
  r.rect(cuerpoAtras + (d > 0 ? 2 : -4), y + h - 2, 2, 2 + paso, oscuro);
  r.rect(cuello - (d > 0 ? 2 : 0), y + h - 2, 2, 2 - paso, oscuro);
}

/** El cajón: cuadrado, angular, y va dando tumbos de canto en vez de rodar. */
function dibujarCajon(r, ro, col) {
  const tumbo = Math.sin(ro.giro * 1.6);
  const w = ro.hw - 1 + Math.abs(tumbo) * 1.5;
  const h = ro.hh - 2 - Math.abs(tumbo) * 1.5;
  const madera = ro.hitFlash > 0 ? '#fff' : col.cargo.correo[0];
  const claro = ro.hitFlash > 0 ? '#fff' : col.cargo.correo[1];

  r.rect(ro.x - w, ro.y - h, w * 2, h * 2, madera);
  r.rect(ro.x - w, ro.y - h, w * 2, 2, claro);

  // Los refuerzos en cruz de las tapas de un cajón de carga.
  r.rect(ro.x - w, ro.y - 1, w * 2, 2, claro);
  r.rect(ro.x - 1, ro.y - h, 2, h * 2, claro);
  r.rect(ro.x - w, ro.y - h, 1, h * 2, '#5b3d27');
  r.rect(ro.x + w - 1, ro.y - h, 1, h * 2, '#5b3d27');
}
