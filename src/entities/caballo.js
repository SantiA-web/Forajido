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
import { tono, dibujarPersona } from './figura.js';

/**
 * LAS MEDIDAS DEL CABALLO, en unidades del mundo *(elegido sobre tres: la
 * proporcion real)*. Un caballo mide 2,4 m de largo y 1,6 m a la cruz, y una
 * persona 1,8: con la escala del juego —una persona son 20 unidades— eso da
 * exactamente 26 de largo por 17 al lomo. Antes medía 22 por 12 y el jinete
 * habia que dibujarlo a menos de la mitad para que entrara.
 */
const ALTO_BARRIL = 9;      // el grosor del cuerpo, del lomo a la panza
const LARGO_PATA = 4.5;     // cada tramo: muslo y cania
const ALTO_SENTADO = 5;     // del asiento a donde apoya la figura sentada
const OJO = '#1a120c';

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
  const pelo = colors.horse;
  const luz = tono(pelo, 1.3);
  const sombra = tono(pelo, 0.72);
  const crin = colors.horseMane;
  const casco = tono(pelo, 0.45);

  const p = pose / 2;                      // de -2 a 2, la escala de las medidas
  const giro = Math.abs(p);
  const largo = 26 - giro * 4;             // se acorta al girar
  const atras = x - largo / 2;
  const medio = x;
  const frente = x + largo / 2;

  const lomo = y - 10 + trote;             // el lomo, 17 unidades sobre el suelo
  const barriga = lomo + ALTO_BARRIL;
  const fy = p * 1.5;                      // la mitad de adelante sube o baja
  const ry = -fy;                          // el anca, al revés
  const lomoAlto = Math.max(0, 3 - p);
  const T = zancada ? zancada.T : 1;
  const vuelta = zancada ? zancada.t / T : 0;
  const flamea = Math.sin(vuelta * Math.PI * 2) * esfuerzo * 1.5;

  /**
   * UNA PATA. `golpe` es cuándo apoya (ver `GOLPES`). La pisada dura ~0,24 s:
   * mientras apoya, el ángulo va de +0,55 rad (estirada adelante) a −0,6
   * (atrás); en el aire vuelve, con la rodilla doblada — la delantera dobla
   * hacia atrás y la trasera hacia adelante, como las de verdad.
   *
   * 🔁 LA PATA ES UNA PATA Y NO UN PALO (etapa 5): el muslo va grueso, la caña
   * fina y abajo el casco, más oscuro. Con la lupa, las dos rayas de una unidad
   * de antes eran dos tablones de cuatro puntos de ancho.
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
    const y0 = lomo + oy + ALTO_BARRIL - 1;
    const rx = cadera + Math.sin(ang) * LARGO_PATA;
    const rodilla = y0 + Math.cos(ang) * LARGO_PATA;
    const a2 = ang + (delantera ? -1.3 : 0.9) * dobla;
    const cx = rx + Math.sin(a2) * LARGO_PATA;
    const cy = rodilla + Math.cos(a2) * LARGO_PATA;
    r.line(cadera, y0, rx, rodilla, color, 1, 2);        // el muslo, grueso
    r.line(rx, rodilla, cx, cy, color, 1, 1.25);         // la caña, fina
    r.rect(cx - 0.75, cy - 0.5, 1.5, 1.5, casco);        // el casco
  };
  pata(atras + 4, ry, GOLPES.traseraAlla, false, sombra);
  pata(frente - 5, fy, GOLPES.delanteraAlla, true, sombra);

  // La cola, volando para atrás. Alejándose, el anca da a la cámara y cuelga.
  const colaLargo = 4 + esfuerzo * 5;
  if (pose < 0) {
    r.rect(atras - 3.5, lomo + ry + 1, 2.5, 3, crin);
    r.rect(atras - 2.5, lomo + ry + 1 + flamea, 3.5, 5 + esfuerzo * 2, crin);
  } else {
    r.rect(atras - 2.5, lomo + ry, 3.5, 2.5, crin);
    r.rect(atras - 1 - colaLargo, lomo + ry + 1 + flamea, colaLargo, 2.5, crin);
    r.rect(atras - 3 - colaLargo, lomo + ry + 2.5 + flamea, 3.5, 1.25, tono(crin, 0.8));
  }

  /**
   * EL CUERPO, en dos mitades a distinta altura. 🔁 Con la lupa se le puede
   * dibujar el MÚSCULO: el lomo iluminado arriba, la panza en sombra abajo y
   * la línea del ijar, que es lo que separa el anca del costillar.
   */
  const mitad = (x0, x1, dy) => {
    const yy = lomo + dy;
    r.rect(x0, yy, x1 - x0, ALTO_BARRIL, pelo);
    r.rect(x0, yy, x1 - x0, 1.25, luz);
    r.rect(x0, yy + ALTO_BARRIL - 2, x1 - x0, 2, sombra);
  };
  mitad(atras, medio, ry);
  mitad(medio, frente, fy);
  // La línea del ijar y el anca redondeada.
  r.rect(medio - 0.5, lomo + Math.min(ry, fy) + 2, 1, ALTO_BARRIL - 4, tono(pelo, 0.86));
  r.rect(atras, lomo + ry + 1, 1.5, ALTO_BARRIL - 2, tono(pelo, 0.9));
  if (lomoAlto > 0) {
    r.rect(atras + 1, lomo + ry - lomoAlto, medio - atras, lomoAlto, luz);
    r.rect(medio, lomo + fy - lomoAlto, frente - medio - 1, lomoAlto, luz);
  }

  /**
   * LA CRIN, EN MECHONES. 🔻 Era un rectángulo oscuro de 3,5 × 7,5 unidades
   * pegado al cuello y, al lado del jinete, se leía como una CAJA atada a la
   * montura. Una crin no es un bloque: son pelos de distinto largo, y basta
   * con que el borde de abajo sea disparejo para que se lea.
   */
  const mechones = (x0, y0, ancho, dir) => {
    const largos = [4, 6.5, 5, 7.5, 6, 4.5, 7, 5.5];
    for (let i = 0; i * 1.25 < ancho; i++) {
      const l = largos[i % largos.length] * (1 + esfuerzo * 0.25);
      r.rect(x0 + i * 1.25 * dir, y0, 1.25, l, i % 2 ? crin : tono(crin, 1.25));
    }
  };

  // El cuello y la cabeza.
  const hy = lomo + fy;
  if (pose < 0) {
    /**
     * 🐛 El cuello subía derecho y de cerca el caballo era una llama. Un cuello
     * que se aleja se ACORTA, no se estira; la distancia la cuenta la cabeza,
     * que queda chica y un poco más alta.
     */
    const cabeza = hy - 11 + (p + 1);
    r.rect(frente - 5, hy - 7, 5, 9, pelo);
    r.rect(frente - 4, cabeza, 6, 5, pelo);
    r.rect(frente - 3.5, cabeza - 1, 4, 1.25, luz);
    r.rect(frente - 4, cabeza - 2.5, 1.25, 2.5, pelo);                 // las orejas, de atrás
    r.rect(frente + 0.75, cabeza - 2.5, 1.25, 2.5, pelo);
    mechones(frente - 6.5, hy - 7.5, 6, 1);
  } else if (pose > 0) {
    const baja = p;                        // cuánto baja el cuello
    const bajaCabeza = p * 2;              // y la cabeza, el doble
    r.rect(frente - 5, hy - 7 + baja, 6, 10, pelo);
    r.rect(frente - 1, hy - 8.5 + bajaCabeza, 7.5, 9, pelo);
    r.rect(frente, hy - 9.5 + bajaCabeza, 5, 1.25, luz);
    r.rect(frente, hy - 1 + bajaCabeza, 5, 2.5, sombra);               // el hocico, de frente
    r.rect(frente - 1, hy - 11 + bajaCabeza, 1.25, 2.5, pelo);         // las dos orejas
    r.rect(frente + 5.25, hy - 11 + bajaCabeza, 1.25, 2.5, pelo);
    mechones(frente - 6.5, hy - 6.5 + baja, 6, 1);
  } else {
    // De perfil A LA CARRERA: el cuello estirado hacia adelante y la cabeza
    // baja, casi en línea con el lomo.
    r.rect(frente - 5, hy - 7, 7.5, 10, pelo);                         // el cuello
    r.rect(frente - 4, hy - 8, 5, 1.25, luz);
    r.rect(frente + 1.5, hy - 9.5, 8.5, 6, pelo);                      // la cabeza
    r.rect(frente + 2.5, hy - 10.5, 6, 1.25, luz);
    r.rect(frente + 9, hy - 7.5, 2.5, 4, sombra);                      // el hocico
    r.rect(frente + 8.5, hy - 6, 1.5, 1, tono(pelo, 0.3));             // la nariz
    r.rect(frente + 1.5, hy - 12, 2.5, 2.5, pelo);                     // la oreja, echada atrás
    r.rect(frente + 3, hy - 8, 1.25, 1.25, OJO);                       // el ojo
    mechones(frente - 7, hy - 9.5, 9, 1);                              // la crin
  }
  // La crin vuela a la carrera: dos mechones sueltos hacia atrás.
  if (esfuerzo > 0.3) {
    r.rect(frente - 9, hy - 10 + flamea, 2.5, 1.25, crin);
    r.rect(frente - 10.5, hy - 7.5 - flamea, 2.5, 1.25, crin);
  }

  /**
   * LA MANTA Y LA MONTURA, sobre el lomo. 🔁 Ahora también el ESTRIBO, que
   * cuelga del costado: es lo que hace que el jinete se lea sentado EN algo y
   * no apoyado encima.
   */
  const my = lomo + Math.min(ry, fy) - lomoAlto;
  /**
   * 🔻 LA MONTURA VA BAJA. El primer intento la levantaba seis unidades sobre
   * el lomo y, al lado del jinete, el bulto oscuro se leía como una VALIJA
   * atada al costado. Una montura de verdad es casi plana: lo que sobresale son
   * los dos borrenes, y miden un dedo.
   */
  /**
   * 🔻 Y SE ANGOSTA AL GIRAR. De frente o de espaldas el caballo se ve
   * escorzado, pero la manta seguía midiendo 12 unidades de ancho: asomaba a los
   * dos costados del jinete como un par de alas rojas. Lo que se ve de una
   * montura cuando el animal te da la cola es su ancho, no su largo.
   */
  const anchoM = 12 - giro * 3.5;
  r.rect(medio - anchoM / 2, my + 1, anchoM, lomoAlto + 3, '#7a2f26');  // la manta
  r.rect(medio - anchoM / 2, my + 1, anchoM, 1, '#a04a3a');
  r.rect(medio - anchoM / 2 + 1.5, my, anchoM - 3, 3, '#3a2418');       // el asiento
  r.rect(medio - anchoM / 2 + 1.25, my - 1.5, 1.75, 2, '#22150d');      // los borrenes
  r.rect(medio + anchoM / 2 - 3, my - 1, 1.5, 1.75, '#22150d');
  r.rect(medio - 1, barriga - 3, 1, 4.5, '#2a1c12');                   // la correa del estribo
  r.rect(medio - 2, barriga + 1, 3, 1.5, '#6a5334');

  pata(atras + 2, ry, GOLPES.traseraAca, false, pelo);
  pata(frente - 7, fy, GOLPES.delanteraAca, true, pelo);
}

/**
 * EL JINETE: UNA PERSONA DEL JUEGO, SENTADA (etapa 5).
 *
 * 🔁 Era lo último que quedaba del dibujo viejo: una sombra cabezona negra de
 * nueve unidades, o sea MENOS DE MEDIA PERSONA. No se podía arreglar solo —
 * *(intentado en la etapa 2c: la persona nueva montada en el caballo viejo se
 * veía peor)*— porque el jinete y el caballo son UNA SOLA IMAGEN. Con el
 * caballo a su tamaño de verdad (26 de largo por 17 al lomo, contra una
 * persona de 20) ahora sí entra, y el jinete es exactamente la misma gente que
 * camina por el vagón.
 *
 * `inclina`: cuánto se echa hacia adelante de la cintura para arriba. A la
 * carrera un jinete no va sentado derecho: acompaña al caballo.
 */
export function dibujarJinete(r, x, asiento, pose = 0, inclina = 0, ropa = {}) {
  const quien = ropa.detalles || 'jugador';
  /**
   * De perfil salvo en las poses extremas, donde el caballo ya se ve de frente
   * o de espaldas: el jinete mira para donde mira el animal.
   */
  const angulo = pose >= 3 ? Math.PI / 2 : pose <= -3 ? -Math.PI / 2 : 0;
  dibujarPersona(r, {
    tipo: quien === 'ley' ? 'jineteLey' : 'jugador',
    x: x + inclina * 0.6,
    pies: asiento + ALTO_SENTADO,
    angulo,
    postura: 'sentado',
    estado: ropa.estado,
    destello: ropa.destello,
    panuelo: quien === 'jugador',
  });
}
