/**
 * EL CABALLO A LA CARRERA Y SU JINETE, en tres cuartos.
 *
 * Nació en el galope (scenes/rideScene.js) y se mudó acá cuando los jinetes de
 * la ley del asalto necesitaron el mismo animal: son el mismo caballo, y
 * dibujarlo dos veces sería mantener dos caballos que con el tiempo dejarían de
 * parecerse. Ver NOTAS-DISENO.md para todo lo que se decidió sobre él (las
 * nueve poses, las patas al ritmo de los cascos, la pose de corredor).
 *
 * TODO VA CON `r.rect` Y `r.line`, sin tocar el contexto directo: la silueta
 * del jinete detrás de la pared del tren (`siluetaDeJinete`, raidScene) pinta
 * esto mismo con un renderer de un solo color.
 */

import { CONFIG } from '../data/config.js';
import { tono } from './figura.js';
import { NEGRO, OJOS_ESTADO } from '../data/siluetas.js';

/**
 * CUÁNDO PISA CADA PATA dentro de la zancada, en segundos: son los mismos
 * tres golpes de `zancada` en engine/audio.js (0 / 85 / 175 ms). Es el galope
 * de tres tiempos, el "tucu-TÚN": primero la trasera de allá, después juntas
 * la trasera de acá y la delantera de allá, y al final —el golpe fuerte— la
 * delantera de acá, que es la que guía. Después, las cuatro en el aire.
 */
export const GOLPES = { traseraAlla: 0, traseraAca: 0.085, delanteraAlla: 0.085, delanteraAca: 0.175 };

/**
 * EL CABALLO EN TRES CUARTOS, A LA CARRERA. Los cascos quedan en `y + 7`,
 * donde va la sombra; el lomo en `y - 5`.
 *
 * *(Santi: "que el caballo tenga más pose de corredor")*: el cuerpo es más
 * largo y más bajo que parado, el cuello va estirado hacia adelante con la
 * cabeza baja, y la cola y la crin vuelan para atrás, ondeando con la zancada.
 *
 * @param zancada  `{ t, T }`: segundos desde que empezó la zancada y cuánto dura.
 *                 `null` si está parado (las patas van derechas).
 * @param trote    cuánto sube o baja el lomo este cuadro (px)
 * @param esfuerzo 0 … 1: qué tan a fondo corre
 * @param pose     -4 … 4 (ver `poseDelCaballo` en scenes/rideScene.js)
 *
 * LAS NUEVE POSES salen de cuatro medidas, calculadas con `p = pose / 2` y
 * redondeadas a píxeles enteros:
 *  - el LARGO del cuerpo se acorta al girar (de 22 a 15);
 *  - el cuerpo va en DOS MITADES a distinta altura: hacia las vías la de
 *    adelante queda más arriba que el anca, hacia abajo al revés;
 *  - el LOMO se ve más alejándose (se lo mira más de arriba) y menos viniendo;
 *  - la CABEZA: alejándose, chica y alta; viniendo, grande, baja y de frente.
 *
 * LAS PATAS tienen muslo y caña (4 + 4 px) y se doblan. Cada una sigue su
 * ciclo: apoya estirada hacia adelante, barre hacia atrás mientras el cuerpo
 * pasa por encima, y vuelve por el aire doblada. Las de allá van más oscuras
 * y se dibujan antes que el cuerpo; las de acá, después.
 */
export function dibujarAnimal(r, x, y, zancada, trote, esfuerzo, pose = 0) {
  const colors = CONFIG.colors;
  const lomo = y - 5 + trote;
  const luz = tono(colors.horse, 1.3);
  const p = pose / 2;                      // de -2 a 2, la escala de las medidas
  const giro = Math.abs(p);
  const largo = Math.round(22 - giro * 3.5);
  const atras = Math.round(x - largo / 2);
  const medio = Math.round(x);
  const frente = Math.round(x + largo / 2);
  const fy = Math.round(p * 1.5);         // la mitad de adelante
  const ry = -fy;                          // el anca, al revés
  const lomoAlto = Math.round(3 - p);      // cuánto lomo se ve: 5 … 1
  const T = zancada ? zancada.T : 1;
  const vuelta = zancada ? zancada.t / T : 0;
  const flamea = Math.round(Math.sin(vuelta * Math.PI * 2) * esfuerzo);

  /**
   * UNA PATA. `golpe` es cuándo apoya (ver `GOLPES`). La pisada dura ~0,24 s
   * (como mucho media zancada): mientras apoya, el ángulo va de +0,55 rad
   * (estirada adelante) a −0,6 (atrás); en el aire vuelve, con la rodilla
   * doblada — la delantera dobla hacia atrás y la trasera hacia adelante,
   * como las de verdad. Al girar la zancada se ve más corta, por la diagonal.
   */
  const pata = (cadera, oy, golpe, delantera, color) => {
    let ang = 0;
    let dobla = 0;
    if (zancada) {
      const u = ((((zancada.t - golpe) % T) + T) % T) / T;
      const apoyo = Math.min(0.45, 0.24 / T);
      if (u < apoyo) {
        ang = 0.55 - 1.15 * (u / apoyo);
      } else {
        const v = (u - apoyo) / (1 - apoyo);
        ang = -0.6 + 1.15 * v * v * (3 - 2 * v);
        dobla = Math.sin(v * Math.PI);
      }
      ang *= (0.45 + esfuerzo * 0.55) * (1 - giro * 0.25);
    }
    const y0 = lomo + oy + 5;
    const rx = cadera + Math.sin(ang) * 4;
    const rodilla = y0 + Math.cos(ang) * 4;
    const a2 = ang + (delantera ? -1.3 : 0.9) * dobla;
    const cx = rx + Math.sin(a2) * 4;
    const cy = rodilla + Math.cos(a2) * 4;
    r.line(cadera, y0, rx, rodilla, color);
    r.line(cadera + 1, y0, rx + 1, rodilla, color);
    r.line(rx, rodilla, cx, cy, color);
    r.line(rx + 1, rodilla, cx + 1, cy, color);
  };
  pata(atras + 3, ry, GOLPES.traseraAlla, false, colors.horseDark);
  pata(frente - 4, fy, GOLPES.delanteraAlla, true, colors.horseDark);

  // La cola, volando para atrás. Alejándose, el anca da a la cámara y cuelga.
  const colaLargo = 3 + Math.round(esfuerzo * 4);
  if (pose < 0) {
    r.rect(atras - 3, lomo + ry + 1, 2, 2, colors.horseMane);
    r.rect(atras - 2, lomo + ry + 1 + flamea, 3, 4 + Math.round(esfuerzo * 2), colors.horseMane);
  } else {
    r.rect(atras - 2, lomo + ry, 3, 2, colors.horseMane);
    r.rect(atras - 1 - colaLargo, lomo + ry + 1 + flamea, colaLargo, 2, colors.horseMane);
    r.rect(atras - 3 - colaLargo, lomo + ry + 2 + flamea, 3, 1, colors.horseMane);
  }

  // El cuerpo en dos mitades, cada una a su altura, y el lomo encima.
  r.rect(atras, lomo + ry, medio - atras, 7, colors.horse);
  r.rect(medio, lomo + fy, frente - medio, 7, colors.horse);
  r.rect(atras, lomo + ry + 5, medio - atras, 2, colors.horseDark);
  r.rect(medio, lomo + fy + 5, frente - medio, 2, colors.horseDark);
  if (lomoAlto > 0) {
    r.rect(atras + 1, lomo + ry - lomoAlto, medio - atras, lomoAlto, luz);
    r.rect(medio, lomo + fy - lomoAlto, frente - medio - 1, lomoAlto, luz);
  }

  // El cuello y la cabeza.
  const hy = lomo + fy;
  if (pose < 0) {
    /**
     * 🐛 El cuello medía 9 − pose (hasta 11 px) y subía derecho: mirado de
     * cerca el caballo era una llama. Un cuello que se aleja se ACORTA, no se
     * estira; la distancia la cuenta la cabeza, que queda chica y un poco más
     * alta.
     */
    const cabeza = hy - 9 + Math.round((p + 1) / 2);
    r.rect(frente - 4, hy - 6, 4, 7, colors.horse);
    r.rect(frente - 3, cabeza, 5, 4, colors.horse);
    r.rect(frente - 2, cabeza - 1, 3, 1, luz);
    r.rect(frente - 3, cabeza - 2, 1, 2, colors.horse);                 // las orejas, de atrás
    r.rect(frente, cabeza - 2, 1, 2, colors.horse);
    r.rect(frente - 5, hy - 7, 2, 6, colors.horseMane);
  } else if (pose > 0) {
    const baja = Math.round(p);            // cuánto baja el cuello
    const bajaCabeza = Math.round(p * 2);  // y la cabeza, el doble
    r.rect(frente - 4, hy - 6 + baja, 5, 8, colors.horse);
    r.rect(frente - 1, hy - 7 + bajaCabeza, 6, 7, colors.horse);
    r.rect(frente, hy - 8 + bajaCabeza, 4, 1, luz);
    r.rect(frente, hy - 1 + bajaCabeza, 4, 2, colors.horseDark);       // el hocico, de frente
    r.rect(frente - 1, hy - 9 + bajaCabeza, 1, 2, colors.horse);       // las dos orejas
    r.rect(frente + 4, hy - 9 + bajaCabeza, 1, 2, colors.horse);
    r.rect(frente - 5, hy - 6 + baja, 2, 6, colors.horseMane);
  } else {
    // De perfil A LA CARRERA: el cuello estirado hacia adelante y la cabeza
    // baja, casi en línea con el lomo. Parado la llevaba arriba, erguida.
    r.rect(frente - 4, hy - 6, 6, 8, colors.horse);                     // el cuello
    r.rect(frente - 3, hy - 7, 4, 1, luz);
    r.rect(frente + 1, hy - 8, 7, 5, colors.horse);                     // la cabeza
    r.rect(frente + 2, hy - 9, 5, 1, luz);
    r.rect(frente + 7, hy - 6, 2, 3, colors.horseDark);                 // el hocico
    r.rect(frente + 1, hy - 10, 2, 2, colors.horse);                    // la oreja, echada atrás
    r.rect(frente - 5, hy - 8, 3, 6, colors.horseMane);                 // la crin
  }
  // La crin vuela a la carrera: dos mechones sueltos hacia atrás.
  if (esfuerzo > 0.3) {
    r.rect(frente - 7, hy - 8 + flamea, 2, 1, colors.horseMane);
    r.rect(frente - 8, hy - 6 - flamea, 2, 1, colors.horseMane);
  }

  // La manta y la montura, sobre el lomo.
  r.rect(medio - 5, lomo - lomoAlto, 9, lomoAlto + 3, '#7a2f26');
  r.rect(medio - 4, lomo - lomoAlto, 7, Math.max(2, lomoAlto), '#3a2418');

  pata(atras + 1, ry, GOLPES.traseraAca, false, colors.horse);
  pata(frente - 6, fy, GOLPES.delanteraAca, true, colors.horse);
}

/**
 * EL JINETE, sentado con el asiento en `asiento`. En tres cuartos se le ven
 * los hombros de arriba y, sobre todo, EL ALA DEL SOMBRERO: una elipse ancha
 * con la copa en el medio *(Santi: "y el ala del sombrero")*.
 *
 * `inclina`: cuántos px se echa hacia adelante de la cintura para arriba. A
 * la carrera un jinete no va sentado derecho: acompaña al caballo.
 *
 * `ropa`: `{ detalles, destello, estado }` (ver adentro). Por defecto, vos;
 * los jinetes de la ley pasan `detalles: 'ley'`.
 *
 * El ala va en FILAS DE RECTÁNGULOS (una elipse pixelada) y no con `ellipse`
 * del contexto, por la silueta de un solo color (ver el comentario de arriba).
 */
export function dibujarJinete(r, x, asiento, pose = 0, inclina = 0, ropa = {}) {
  const colors = CONFIG.colors;
  /**
   * 🔁 EN SOMBRA *(Santi: "en el galope, el jugador va montado en un caballo
   * normal, como el de ahora, pero el jugador sí es negro durante el galope")*.
   * Cabezón y negro, como toda la gente del juego (data/siluetas.js); el
   * caballo sigue siendo el de siempre.
   *
   * `ropa.detalles`: 'jugador' (pañuelo rojo al viento y cinta roja) o 'ley'
   * (cinta azul e insignia, los jinetes del asalto). `ropa.destello` lo pinta
   * todo de blanco (le pegaron) y `ropa.estado` es el color de los ojos del de
   * la ley.
   */
  const quien = ropa.detalles || 'jugador';
  const tinte = (c) => (ropa.destello ? '#ffffff' : c);
  const negro = tinte(NEGRO);
  const i = inclina;

  r.rect(x - 1, asiento, 3, 5, negro);                                      // la bota
  r.rect(x - 3, asiento - 4, 6, 4, negro);                                  // la cadera
  r.rect(x - 3 + i, asiento - 9, 6, 5, negro);                              // el torso
  if (pose >= 0) {
    // El brazo adelante y las riendas: sin ellos el cuerpo era un bloque liso.
    r.rect(x + 2 + i, asiento - 6, 4, 2, negro);
    r.rect(x + 6 + i, asiento - 5 + Math.round(pose / 2), 4, 1, tinte(colors.horseMane));
  }
  r.rect(x - 3 + i, asiento - 12, 7, 3, negro);                             // la cabeza, grande

  // El ala: alejándose se la ve más de arriba (más abierta); viniendo, menos.
  const filas = Math.round(2.5 - pose * 0.2) >= 3 ? [10, 14, 14, 10] : [12, 14, 12];
  const altoAla = asiento - 13 - Math.floor(filas.length / 2);
  filas.forEach((ancho, k) => r.rect(x + i - ancho / 2, altoAla + k, ancho, 1, negro));
  r.rect(x - 3 + i, altoAla - 4, 6, 4, negro);                              // la copa

  // Los ojos, bajo el ala: de frente los dos, de costado uno, de espaldas ninguno.
  const ojos = tinte(quien === 'ley' ? OJOS_ESTADO[ropa.estado || 'calma'] : '#f0e0c0');
  if (pose > 0) {
    r.rect(x - 2 + i, asiento - 11, 1, 1, ojos);
    r.rect(x + 1 + i, asiento - 11, 1, 1, ojos);
  } else if (pose === 0) {
    r.rect(x + 2 + i, asiento - 11, 1, 1, ojos);
  }

  if (quien === 'jugador') {
    const rojo = tinte('#c8342a');
    r.rect(x - 3 + i, asiento - 9, 6, 1, rojo);                             // el pañuelo
    r.rect(x - 6 + i, asiento - 9, 3, 1, rojo);                             // las puntas, al viento
    r.rect(x - 8 + i, asiento - 8, 2, 1, rojo);
    r.rect(x - 3 + i, altoAla - 1, 6, 1, rojo);                             // la cinta del sombrero
  } else {
    r.rect(x - 3 + i, altoAla - 1, 6, 1, tinte('#4a78b8'));                 // la cinta azul de la ley
    if (pose >= 0) r.rect(x + 1 + i, asiento - 7, 1, 2, tinte('#ffffff'));  // la insignia
  }
}
