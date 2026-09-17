/**
 * EL CABALLO A LA CARRERA Y SU JINETE, en tres cuartos.
 *
 * Nació en el galope (scenes/rideScene.js) y se mudó acá cuando los jinetes de
 * la ley del asalto necesitaron el mismo animal: son el mismo caballo, y
 * dibujarlo dos veces sería mantener dos caballos que con el tiempo dejarían de
 * parecerse. Ver NOTAS-DISENO.md para todo lo que se decidió sobre él (las
 * nueve poses, las patas al ritmo de los cascos, la pose de corredor).
 *
 * 🔁 ETAPA 5b — EL CABALLO A RESOLUCIÓN DE ARTE *(Santi: "quisiera que el
 * caballo sea más realista como la imagen")*. Era lo último que quedaba sin
 * migrar: ~50 rectángulos y rayas dibujados en vivo, en unidades del mundo,
 * mientras que la gente, el vagón y el desierto ya se dibujan punto por punto.
 * El caballo mide 104 × 68 PUNTOS: ahí entra la silueta curva, el músculo, el
 * ojo y el hocico. Con dos rectángulos, no.
 *
 * QUÉ SE GUARDA Y QUÉ NO. El cuerpo, el cuello, la cabeza, la crin pegada, la
 * montura y el estribo son lo mismo cuadro a cuadro para una pose dada: van en
 * una LÁMINA por pose (nueve). Las patas, la cola y el pelo que vuela cambian
 * todo el tiempo y se siguen dibujando en vivo — y las patas, sobre todo,
 * porque cada casco apoya en el instante justo en que SUENA su golpe
 * (`GOLPES`), y congelarlas en cuadros rompería el "tucu-TÚN".
 */

import { CONFIG } from '../data/config.js';
import { tono, dibujarPersona } from './figura.js';
import { pieza, piezaTenida, PUNTO } from '../world/piezas.js';

/**
 * LAS MEDIDAS DEL CABALLO, en unidades del mundo *(elegido sobre tres: la
 * proporcion real)*. Un caballo mide 2,4 m de largo y 1,6 m a la cruz, y una
 * persona 1,8: con la escala del juego —una persona son 20 unidades— eso da
 * exactamente 26 de largo por 17 al lomo. Antes medía 22 por 12 y el jinete
 * habia que dibujarlo a menos de la mitad para que entrara.
 */
const P = 4;                // puntos de dibujo por unidad (la lupa de ×4)
const LARGO = 26;           // el barril: de la punta del anca a la paleta
const ALTO_SENTADO = 7;     // del asiento a donde apoya la figura sentada
const OJO = '#1a120c';

/**
 * CUÁNDO PISA CADA PATA dentro de la zancada, en segundos: son los mismos
 * tres golpes de `zancada` en engine/audio.js (0 / 85 / 175 ms). Es el galope
 * de tres tiempos, el "tucu-TÚN": primero la trasera de allá, después juntas
 * la trasera de acá y la delantera de allá, y al final —el golpe fuerte— la
 * delantera de acá, que es la que guía. Después, las cuatro en el aire.
 */
export const GOLPES = { traseraAlla: 0, traseraAca: 0.085, delanteraAlla: 0.085, delanteraAca: 0.175 };

// ------------------------------------------------------- la silueta del cuerpo

/**
 * EL PERFIL DEL CUERPO, COLUMNA POR COLUMNA.
 *
 * 🔻 Un caballo NO ES UN RECTÁNGULO, y hasta ahora lo era: dos rectángulos de
 * alto parejo, uno por mitad. Lo que le da forma a un caballo de verdad es que
 * el anca es redonda, el lomo hace una curva que baja y vuelve a subir en la
 * cruz, y la panza es MÁS HONDA ADELANTE (en la cincha, atrás de la pata
 * delantera) que atrás, donde el ijar va recogido. Eso es lo que hace que se
 * lea como un animal y no como un banco con patas.
 *
 * Cada lista es [fracción del largo, hondo en PUNTOS bajo la línea de la cruz],
 * del anca (0) a la paleta (1). `entre` interpola suave, así que la curva sale
 * sola y no hay que escribir las 104 columnas a mano.
 *
 * LAS MEDIDAS SON LAS DE UN CABALLO DE VERDAD. El barril mide 104 puntos y un
 * caballo 2,40 m, así que UN PUNTO SON 2,3 cm y todo lo demás sale de ahí: el
 * pecho hondo 72 cm son 32 puntos, la cabeza de 60 cm son 26, el cuello de
 * 75 cm son 32. El primer intento los puso a ojo y el cuello le salió de 46
 * puntos: con la cabeza pegada atrás quedaba un solo cono largo, y el caballo
 * tenía cara de oso hormiguero.
 */
const LOMO = [
  [0.00, 12],   // la punta del anca, atrás de todo
  [0.08, 4],
  [0.20, 2],    // la grupa
  [0.40, 5],
  [0.55, 6],    // el lomo, lo más hundido
  [0.75, 3],
  [0.90, 0],    // LA CRUZ: es la altura de referencia, el cero
  [1.00, 5],    // la paleta, que el cuello tapa
];
const PANZA = [
  [0.00, 22],   // debajo de la cola
  [0.10, 27],   // el muslo
  [0.25, 25],   // el ijar, recogido
  [0.45, 29],
  [0.65, 31],
  [0.82, 32],   // la cincha, lo más hondo (72 cm)
  [0.93, 30],
  [1.00, 24],   // el codo
];

/** Interpola suave entre los puntos de control de un perfil. */
function entre(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const t = (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * (t * t * (3 - 2 * t));
    }
  }
  return pts[pts.length - 1][1];
}

/**
 * TODAS LAS MEDIDAS DE UNA POSE, en PUNTOS y relativas al ancla: el punto
 * (medio del cuerpo, altura de la cruz). Las usan las dos mitades del dibujo —
 * la lámina, para saber de qué tamaño hacerse; y el dibujo en vivo, para saber
 * dónde nacen las patas y dónde estampar la lámina.
 *
 * 🔻 ACÁ ESTÁ EL ARREGLO DE "SÓLO MUEVE EL CUELLO" *(Santi: "cuando dobla con
 * W o S, es como que solo mueve el cuello el caballo cuando en realidad
 * debería mover todo el cuerpo")*. Tenía razón: lo único que cambiaba de forma
 * era la cabeza. El cuerpo se acortaba un 30% y las patas se quedaban clavadas
 * en el mismo lugar, así que el ojo no registraba el giro. Ahora giran las
 * cuatro cosas que giran de verdad:
 *
 *  1. EL CUERPO SE ACORTA MUCHO MÁS (de 26 a 14, no a 18): es escorzo, y el
 *     escorzo tiene que exagerarse o no se lee.
 *  2. APARECE EL ANCA O EL PECHO: yéndose se ve la grupa de atrás, viniendo se
 *     ve el pecho. Es la masa del animal vista de punta, y es lo que más dice
 *     "está girado".
 *  3. LAS PATAS CONVERGEN: de perfil las cuatro están repartidas a lo largo;
 *     de punta se juntan, y las de allá se esconden detrás de las de acá. A
 *     cambio se separan de costado, que es como se ven de atrás.
 *  4. LA ZANCADA SE ACHICA EN PANTALLA: el barrido de las patas es para
 *     adelante y para atrás, así que de punta casi no se ve.
 */
function medidas(pose) {
  const p = pose / 2;                       // -2 … 2
  const g = Math.abs(pose) / 4;             // 0 de perfil, 1 de lleno al giro
  const hacia = Math.sign(pose);            // -1 se aleja (a las vías), +1 viene
  const largo = LARGO - g * 8;              // 26 … 18 unidades: el escorzo
  const L = Math.round(largo * P);          // el barril, en puntos
  const atras = -L / 2;
  const frente = L / 2;

  /**
   * LA MASA VISTA DE PUNTA. 🔻 El primer intento la dibujaba como un CÍRCULO
   * perfecto y se leía como una pelota pegada al anca. Un anca de verdad es un
   * huevo: ancha y redonda arriba, angostándose abajo hacia donde salen las
   * patas. Y va metida dentro del cuerpo, no colgando atrás.
   */
  const capa = g * 17;
  const capaX = hacia < 0 ? atras + capa * 0.10 : frente - capa * 0.45;
  const capaRx = capa * 0.55;
  const capaRy = hacia < 0 ? 18 : 16;
  const capaY = (hacia < 0 ? 15 : 19) - hacia * p * 3;

  /**
   * EL CUELLO Y LA CABEZA. A la carrera el cuello va estirado y la cabeza casi
   * en línea con el lomo — no levantada, que es pose de caballo parado. El
   * cuello NACE ADENTRO DEL CUERPO (en la cruz, no en el borde de adelante) y
   * la cabeza sale en ÁNGULO respecto del cuello: ese quiebre, la garganta, es
   * lo que hace que se lean como dos cosas y no como un cono.
   *
   * Girando, el cuello se acorta (se va de punta) y la cabeza se corre: chica y
   * más alta cuando se aleja, grande y más baja cuando viene hacia la cámara.
   */
  const cuelloX = atras + L * 0.70;
  const nucaX = cuelloX + (36 - g * 16);
  const nucaY = -12 + p * 7;
  const cabezaL = 24 - g * 6 * hacia;
  const cabezaH = 12 + g * 2 * hacia;
  const cabezaCae = 13;                     // cuánto baja el hocico bajo la nuca

  // Dónde nacen las patas, en puntos desde el medio.
  const cadera = atras + L * 0.14;
  const paleta = atras + L * 0.86;
  const lateral = 3 + g * 8;                // la de acá contra la de allá

  const hocicoX = nucaX + cabezaL;
  const hocicoY = nucaY + cabezaCae;

  return {
    p, g, hacia, largo, L, atras, frente,
    capa, capaX, capaRx, capaRy, capaY,
    cuelloX, nucaX, nucaY, cabezaL, cabezaH, cabezaCae,
    cadera, paleta, lateral,
    // Cuánto se inclina el barril: la punta de adelante baja si el caballo
    // viene hacia la cámara, y sube si se aleja.
    ladea: p * 3,
    // En UNIDADES, que es lo que usa el dibujo en vivo.
    caderaU: cadera / P, paletaU: paleta / P, lateralU: lateral / P,
    caderaY: (entre(PANZA, 0.14) - 0.72 * p * 3) / P,   // la panza, ya ladeada
    paletaY: (entre(PANZA, 0.86) + 0.72 * p * 3) / P,   // y sobre la paleta, más honda
    asientoU: (atras + L * 0.63) / P,       // la montura, atrás de la cruz
    colaU: (hacia < 0 ? capaX : atras + 2) / P,
    colaYU: (entre(LOMO, 0.03) - 0.94 * p * 3) / P,
    riendasU: { x: (hocicoX - 9) / P, y: (hocicoY + cabezaH * 0.55) / P },
  };
}

/**
 * LAS DOS LÁMINAS DEL CABALLO: el CUERPO (barril, anca o pecho de punta,
 * montura y estribo) y la CABEZA (cuello, crin y cara). Una de cada una por
 * pose, dibujadas una sola vez y estampadas después.
 *
 * 🔻 ¿POR QUÉ DOS Y NO UNA? Porque no siempre van en el mismo orden. Cuando el
 * caballo VIENE HACIA LA CÁMARA (pose 2 para arriba), su cabeza está MÁS CERCA
 * que el jinete, así que tiene que taparlo a él y no al revés. Con una sola
 * lámina el caballo entero se dibujaba primero y el jinete le tapaba la cara:
 * apretando S quedaba un hombre sentado sobre un bulto marrón sin cabeza.
 * Separadas, la cabeza se estampa después del jinete cuando le toca.
 */
function piezaDeCaballo(pose, pelo, crin, parte) {
  const m = medidas(pose);
  const luz = tono(pelo, 1.28);
  const sombra = tono(pelo, 0.70);
  const musculo = tono(pelo, 0.86);
  const borde = tono(pelo, 0.44);
  const crinLuz = tono(crin, 1.3);
  const crinOsc = tono(crin, 0.7);
  const esCabeza = parte === 'cabeza';

  /**
   * La caja: se calcula por pose y no fija, porque de perfil el caballo es
   * largo y bajo y girado es corto y alto. Una caja fija para la peor pose
   * guardaría el triple de memoria en blanco.
   */
  const vuelco = Math.abs(m.ladea) + 2;
  const izq = esCabeza
    ? m.cuelloX - 14
    : Math.min(m.atras - 8, m.capaX - m.capaRx - 4);
  const der = esCabeza
    ? m.nucaX + m.cabezaL + 10
    : Math.max(m.frente + 4, m.capaX + m.capaRx + 4);
  const arr = esCabeza
    ? Math.min(m.nucaY - 14, -12)
    : Math.min(-10 - vuelco, m.capaY - m.capaRy - 4);
  const aba = esCabeza
    ? Math.max(m.nucaY + m.cabezaCae + m.cabezaH + 6, 34)
    : Math.max(44 + vuelco, m.capaY + m.capaRy + 4);
  const ancho = Math.ceil(der - izq);
  const alto = Math.ceil(aba - arr);
  const ax = -izq;                          // dónde cae el ancla dentro del lienzo
  const ay = -arr;

  const clave = `cab|${parte}|${pose}|${pelo}|${crin}`;
  const img = pieza(clave, ancho, alto, (p) => {
    const col = (x, y0, y1, c) => {
      if (y1 > y0) p(ax + x, ay + y0, 1, y1 - y0, c);
    };

    if (esCabeza) {
      // ---------------------------------------------------- cuello y cabeza
      /**
       * El cuello es una cuña: hondo donde nace y fino en la nuca. Se dibuja
       * columna por columna entre dos rectas, así el borde queda en diagonal
       * limpia y no en escalones de rectángulo.
       */
      const nx = m.nucaX, ny = m.nucaY;
      const tramo = Math.max(1, Math.round(nx - m.cuelloX));
      const crestas = [];
      for (let i = 0; i <= tramo; i++) {
        const u = i / tramo;
        const s = u * u * (3 - 2 * u);
        const x = m.cuelloX + i;
        const t = -1 + (ny + 1) * s;
        const b = 30 + (ny + 13 - 30) * s;
        col(x, t, b, pelo);
        col(x, t, t + 1, borde);
        col(x, b - 1, b, borde);
        col(x, t + 1, t + 3, luz);
        col(x, b - 4, b - 1, sombra);
        crestas.push([x, t]);
      }

      /**
       * LA CRIN. 🔻 El primer intento la dibujó como un PEINE: dientes de dos
       * puntos de ancho, todos del mismo largo, uno por medio. De cerca era
       * una cremallera. Una crin es una MASA de pelo con el borde de afuera
       * disparejo, y lo disparejo tiene que ser suave, no de diente en diente.
       */
      for (const [x, t] of crestas) {
        const w = x - m.cuelloX;
        const alt = 6 + Math.sin(w * 0.31) * 2.2 + Math.sin(w * 0.13 + 1) * 1.8;
        col(x, t - alt, t + 3, w % 7 < 3 ? crin : crinLuz);
        col(x, t - alt, t - alt + 2, crinOsc);
      }

      /**
       * LA CABEZA. De perfil es una cuña que sale EN ÁNGULO del cuello y baja:
       * la frente plana arriba, el cachete redondo atrás, el hocico fino
       * adelante. Lleva el ojo, el ollar y la oreja echada para atrás, que es
       * como las lleva un caballo a la carrera.
       */
      const chL = Math.max(8, Math.round(m.cabezaL));
      const chH = m.cabezaH;
      const cae = m.cabezaCae;
      if (m.g < 0.8) {
        for (let i = 0; i <= chL; i++) {
          const u = i / chL;
          const t = ny + u * cae;                       // la frente y la cara
          const b = t + chH - u * (chH * 0.42);         // el hocico se afina
          col(nx + i, t, b, pelo);
          col(nx + i, t, t + 1, borde);
          col(nx + i, b - 1, b, borde);
          col(nx + i, t + 1, t + 2, luz);
        }
        // El cachete: la masa redonda de atrás, contra la garganta.
        for (let i = -3; i <= 7; i++) {
          const d = 7 * Math.sqrt(Math.max(0, 1 - (i / 7) ** 2));
          col(nx + i + 3, ny + 3 - d * 0.4, ny + 4 + d, pelo);
        }
        p(ax + nx + chL - 4, ay + ny + cae - 1, 5, 6, sombra);           // el hocico
        p(ax + nx + chL - 3, ay + ny + cae + 1, 2, 2, tono(pelo, 0.3));  // el ollar
        p(ax + nx + 5, ay + ny + 5, 3, 3, OJO);                          // el ojo
        // La oreja, echada para atrás: se afina hacia la punta, como una hoja.
        for (let j = 0; j < 7; j++) {
          const w = 5 - j * 0.55;
          p(ax + nx + 1 - j * 0.35, ay + ny - 1 - j, w, 1, j > 4 ? crinOsc : pelo);
        }
        p(ax + nx + 1, ay + ny - 3, 2, 3, sombra);                       // el hueco
        p(ax + nx - 3, ay + ny - 5, 3, 5, crinOsc);                      // el tupé
      } else {
        /**
         * DE PUNTA. 🔻 El primer intento era un rectángulo vertical liso y
         * parecía un poste de alambrado. Una cabeza de frente es angosta
         * arriba (la frente), ancha en los cachetes y otra vez fina en el
         * hocico. Y va CLARA: viniendo hacia la cámara le pega la luna de
         * lleno, y así se despega del cuerpo en vez de ser otro bulto igual.
         */
        const an = Math.max(7, Math.round(chH * 0.9));
        const largo = Math.round(chL * 0.95);
        const cara = m.hacia > 0 ? tono(pelo, 1.12) : sombra;
        for (let j = 0; j <= largo; j++) {
          const u = j / largo;
          const w = an * (0.55 + Math.sin(u * Math.PI) * 0.45);
          const x0 = nx - w / 2;
          for (let i = 0; i < Math.round(w); i++) {
            col(x0 + i, ny + j, ny + j + 1, i < 2 ? sombra : cara);
          }
        }
        p(ax + nx - an / 2 - 3, ay + ny - 9, 4, 10, pelo);               // las dos orejas
        p(ax + nx + an / 2 - 1, ay + ny - 9, 4, 10, pelo);
        p(ax + nx - an / 2, ay + ny, an, 1, borde);
        if (m.hacia > 0) {                    // viniendo se le ven los dos ojos
          p(ax + nx - an / 2 + 2, ay + ny + 5, 3, 3, OJO);
          p(ax + nx + an / 2 - 5, ay + ny + 5, 3, 3, OJO);
          p(ax + nx - 4, ay + ny + largo - 6, 8, 6, sombra);             // el hocico
        }
        // La crin, cayendo del otro lado del cuello.
        p(ax + nx - an / 2 - 3, ay + ny - 2, 4, 14, crin);
      }
      return;
    }

    /**
     * Una masa redonda dibujada por columnas. Se achica abajo: un anca es un
     * huevo, no una pelota — se ensancha arriba y se cierra hacia donde salen
     * las patas.
     */
    const bulto = (cx, cy, rx, ry, base) => {
      for (let i = -Math.round(rx); i <= Math.round(rx); i++) {
        const u = Math.abs(i / rx);
        const d = ry * Math.sqrt(Math.max(0, 1 - u * u));
        if (d < 1) continue;
        col(cx + i, cy - d, cy + d * 0.8, base);
        col(cx + i, cy - d, cy - d + 2, borde);
        col(cx + i, cy + d * 0.8 - 2, cy + d * 0.8, borde);
        if (u < 0.6) col(cx + i, cy - d + 2, cy - d + 2 + (7 - u * 9), luz);
        col(cx + i, cy + d * 0.8 - 9, cy + d * 0.8 - 2, sombra);
      }
      /**
       * LA RAYA DEL MEDIO. Es un solo trazo y es lo que convierte una pelota
       * marrón en un anca: separa las dos nalgas. Sin ella, de espaldas el
       * caballo es una roca.
       */
      p(ax + cx - 1, ay + cy - ry + 3, 2, ry * 1.5, musculo);
    };

    // ------------------------------------------------------------ el barril
    for (let i = 0; i < m.L; i++) {
      const f = i / (m.L - 1);
      const x = m.atras + i;
      const dy = (f - 0.5) * 2 * m.ladea;
      const t = entre(LOMO, f) + dy;
      const b = entre(PANZA, f) + dy;
      col(x, t, b, pelo);
      col(x, t, t + 1, borde);              // el contorno de arriba
      col(x, b - 1, b, borde);              // y el de abajo
      col(x, t + 1, t + 4, luz);            // el lomo, iluminado
      col(x, b - 6, b - 1, sombra);         // la panza, en sombra
    }

    /**
     * EL MÚSCULO. Con 104 puntos de largo se le pueden marcar las tres líneas
     * que un ojo reconoce en un caballo: el redondeo del anca, la línea del
     * ijar (que separa el anca del costillar) y la paleta, que baja en
     * diagonal desde la cruz hasta el codo.
     */
    for (let i = 0; i < m.L; i++) {
      const f = i / (m.L - 1);
      const x = m.atras + i;
      const dy = (f - 0.5) * 2 * m.ladea;
      const t = entre(LOMO, f) + dy;
      const b = entre(PANZA, f) + dy;
      if (f > 0.03 && f < 0.26) {           // el anca, redonda
        const u = (f - 0.03) / 0.23;
        col(x, t + 4, t + 5 + Math.sin(u * Math.PI) * 5, musculo);
      }
      if (f > 0.26 && f < 0.32) col(x, t + 7, b - 8, musculo);   // el ijar
      if (f > 0.80 && f < 0.93) {           // la paleta
        const u = (f - 0.80) / 0.13;
        col(x, t + 5 + u * 5, b - 9 + u * 7, musculo);
      }
    }

    // La grupa o el pecho de punta, ENCIMA del barril: girado, esa masa es lo
    // que está más cerca de la cámara.
    if (m.capa > 3) bulto(m.capaX, m.capaY, m.capaRx, m.capaRy, pelo);

    /**
     * LA MANTA Y LA MONTURA. 🔻 Va BAJA: el primer intento la levantaba seis
     * unidades sobre el lomo y, al lado del jinete, el bulto oscuro se leía
     * como una VALIJA atada al costado. Una montura de verdad es casi plana:
     * lo que sobresale son los dos borrenes, y miden un dedo.
     *
     * 🔻 Y SE ANGOSTA AL GIRAR: lo que se ve de una montura cuando el animal
     * te da la cola es su ancho, no su largo (antes asomaba a los dos costados
     * del jinete como un par de alas rojas).
     */
    const sx = m.atras + m.L * 0.63;
    const sw = Math.round(40 - m.g * 22);
    const sf = entre(LOMO, 0.63) + 0.26 * m.ladea;
    p(ax + sx - sw / 2, ay + sf + 1, sw, 9, '#6b2b24');               // la manta
    p(ax + sx - sw / 2, ay + sf + 1, sw, 2, '#8e4234');
    p(ax + sx - sw / 2 + 4, ay + sf - 3, sw - 8, 7, '#3a2418');       // el asiento
    p(ax + sx - sw / 2 + 3, ay + sf - 8, 5, 7, '#22150d');            // los borrenes
    p(ax + sx + sw / 2 - 6, ay + sf - 3, 3, 4, '#22150d');
    p(ax + sx - 2, ay + sf + 9, 2, 12, '#2a1c12');                    // la ación
    p(ax + sx - 5, ay + sf + 20, 8, 4, '#6a5334');                    // el estribo
    p(ax + sx - 4, ay + sf + 21, 6, 2, '#22150d');
  });

  return { img, ax, ay, clave };
}

// ------------------------------------------------------------- el dibujo vivo

/**
 * EL CABALLO EN TRES CUARTOS, A LA CARRERA. Los cascos quedan en `y + 7`,
 * donde va la sombra; la cruz en `y - 10`.
 *
 * @param zancada  `{ t, T }`: segundos desde que empezó la zancada y cuánto dura.
 *                 `null` si está parado (las patas van derechas).
 * @param trote    cuánto sube o baja el lomo este cuadro
 * @param esfuerzo 0 … 1: qué tan a fondo corre
 * @param pose     -4 … 4 (ver `poseDelCaballo` en scenes/rideScene.js)
 *
 * Devuelve dónde quedaron la montura y el bocado, para que el jinete se siente
 * en una y agarre las riendas del otro.
 */
export function dibujarAnimal(r, x, y, zancada, trote, esfuerzo, pose = 0) {
  const colors = CONFIG.colors;
  const pelo = colors.horse;
  const crin = colors.horseMane;
  const sombra = tono(pelo, 0.72);
  const casco = tono(pelo, 0.4);
  const m = medidas(pose);

  const medio = x;
  const cruz = y - 10 + trote;              // la línea de la cruz, el cero vertical
  const T = zancada ? zancada.T : 1;
  const vuelta = zancada ? zancada.t / T : 0;
  const flamea = Math.sin(vuelta * Math.PI * 2) * esfuerzo * 1.5;

  /**
   * UNA PATA. `golpe` es cuándo apoya (ver `GOLPES`). La pisada dura ~0,24 s:
   * mientras apoya, el ángulo va de +0,55 rad (estirada adelante) a −0,6
   * (atrás); en el aire vuelve, con la rodilla doblada — la delantera dobla
   * hacia atrás y la trasera hacia adelante, como las de verdad.
   *
   * LA PATA ES UNA PATA Y NO UN PALO: el muslo va grueso, la caña fina, abajo
   * el menudillo y el casco, más oscuro y más ancho en la base.
   *
   * 🔁 `Lp` (cuánto mide cada tramo) ahora VIENE DE AFUERA y es distinto
   * adelante que atrás: la panza es más honda en la cincha que en el ijar, así
   * que de la pata delantera se ve menos tramo libre. Con un solo largo, una de
   * las dos no llegaba al suelo o lo atravesaba.
   */
  const pata = (cadera, y0, Lp, golpe, delantera, color) => {
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
      // De punta casi no se ve el barrido: es para adelante y para atrás.
      ang *= (0.45 + esfuerzo * 0.55) * (1 - m.g * 0.55);
    }
    const rx = cadera + Math.sin(ang) * Lp;
    const ry = y0 + Math.cos(ang) * Lp;
    const a2 = ang + (delantera ? -1.3 : 0.9) * dobla;
    const cx = rx + Math.sin(a2) * Lp;
    const cy = ry + Math.cos(a2) * Lp;
    r.line(cadera, y0, cadera + (rx - cadera) * 0.55, y0 + (ry - y0) * 0.55, color, 1, 2.75);
    r.line(cadera + (rx - cadera) * 0.45, y0 + (ry - y0) * 0.45, rx, ry, color, 1, 2);
    r.line(rx, ry, cx, cy, color, 1, 1.25);             // la caña, fina
    r.rect(cx - 0.6, cy - 1.25, 1.2, 1.25, color);      // el menudillo
    r.rect(cx - 0.9, cy - 0.25, 1.8, 1.5, casco);       // el casco
  };

  const caderaX = medio + m.caderaU;
  const paletaX = medio + m.paletaU;
  const caderaY = cruz + m.caderaY;
  const paletaY = cruz + m.paletaY;
  const largoT = (y + 7 - caderaY) / 2;     // lo que falta hasta el suelo
  const largoD = (y + 7 - paletaY) / 2;
  const lat = m.lateralU;

  // Las de allá van primero y más oscuras: están detrás del cuerpo.
  pata(caderaX - lat, caderaY, largoT, GOLPES.traseraAlla, false, sombra);
  pata(paletaX - lat, paletaY, largoD, GOLPES.delanteraAlla, true, sombra);

  /**
   * LA COLA que vuela para atrás. El nacimiento va en la lámina; lo que se
   * dibuja acá es el pelo suelto, que se alarga con el esfuerzo y ondea con la
   * zancada. Yéndose de punta la cola cuelga por el medio del anca en vez de
   * salir para el costado.
   */
  const colaX = medio + m.colaU;
  const colaY = cruz + m.colaYU;
  const colaL = 5 + esfuerzo * 6;
  if (m.g > 0.5) {
    // De punta la cola cuelga por el medio del anca, no sale para el costado.
    for (let i = 0; i < 5; i++) {
      const u = i / 4;
      r.rect(colaX - 1.5 + u * 0.6, colaY + u * colaL * 0.75,
        3 - u * 1.4, colaL * 0.3, i % 2 ? crin : tono(crin, 0.82));
    }
  } else {
    for (let i = 0; i < 10; i++) {
      const u = i / 9;
      r.rect(colaX - u * colaL - 1.5, colaY + u * u * 4 + flamea * u,
        colaL * 0.18 + 1.5, 3.5 - u * 2.1, i % 2 ? crin : tono(crin, 0.82));
    }
  }

  // -------------------------------------------------------- las dos láminas
  const estampa = (parte) => {
    const { img, ax, ay, clave } = piezaDeCaballo(pose, pelo, crin, parte);
    const lam = r.plano ? piezaTenida(img, clave, r.plano) : img;
    r.ctx.drawImage(
      lam,
      medio - ax * PUNTO, cruz - ay * PUNTO,
      img.width * PUNTO, img.height * PUNTO,
    );
  };
  estampa('cuerpo');
  /**
   * LA CABEZA, ¿ANTES O DESPUÉS DEL JINETE? Depende de para dónde va el
   * animal. Alejándose o de perfil, la cabeza está más lejos que el jinete y
   * va debajo, acá mismo. Viniendo hacia la cámara está MÁS CERCA que él, así
   * que la devolvemos para que el que dibuja la estampe cuando corresponda:
   * después. Sin esto, apretando S quedaba un hombre sentado sobre un bulto
   * marrón sin cabeza.
   */
  const cabezaAdelante = pose >= 2;
  if (!cabezaAdelante) estampa('cabeza');

  // La crin suelta que vuela a la carrera, por encima del cuello.
  if (esfuerzo > 0.3 && m.g < 0.7) {
    const cx0 = medio + m.cuelloX / P;
    r.rect(cx0 - 1.5, cruz - 2.5 + flamea, 2.5, 1.25, crin);
    r.rect(cx0 - 3, cruz + flamea * -1, 2.5, 1.25, tono(crin, 1.2));
  }

  // Las de acá van después: están delante del cuerpo.
  pata(caderaX + lat, caderaY, largoT, GOLPES.traseraAca, false, pelo);
  pata(paletaX + lat, paletaY, largoD, GOLPES.delanteraAca, true, pelo);

  return {
    asiento: { x: medio + m.asientoU, y: cruz },
    riendas: { x: medio + m.riendasU.x, y: cruz + m.riendasU.y },
    // Se llama DESPUÉS del jinete. No hace nada si la cabeza ya se dibujó.
    adelante: () => { if (cabezaAdelante) estampa('cabeza'); },
  };
}

/**
 * UNA CUERDA, en pasitos de un punto para que no la suavice nadie, y con
 * `panza`: cuánto se hunde en el medio. Una rienda no es una recta tirante —
 * cuelga— y acá la panza además la SEPARA de la mandíbula del caballo, que es
 * otra diagonal que va casi para el mismo lado.
 */
function cuerda(r, x1, y1, x2, y2, color, panza = 0) {
  const pasos = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) * 4));
  const alto = 0.25;
  /**
   * SE DIBUJA EN TRAMOS, no punto por punto. Recorre la línea juntando los
   * puntos que caen en la MISMA FILA y pinta cada fila de un rectángulo: se ve
   * exactamente igual —los escaloncitos son los mismos— pero una rienda pasa
   * de cuarenta y cinco rectángulos a ocho. Punto por punto era la parte más
   * cara de dibujar el caballo entero.
   */
  let filaY = null, desde = 0, hasta = 0;
  const soltar = () => {
    if (filaY !== null) r.rect(Math.min(desde, hasta), filaY, Math.abs(hasta - desde) + alto, alto, color);
  };
  for (let i = 0; i <= pasos; i++) {
    const u = i / pasos;
    const px = x1 + (x2 - x1) * u;
    const py = Math.round((y1 + (y2 - y1) * u + Math.sin(u * Math.PI) * panza) * 4) / 4;
    if (py !== filaY) { soltar(); filaY = py; desde = px; }
    hasta = px;
  }
  soltar();
}

/**
 * EL JINETE: UNA PERSONA DEL JUEGO, SENTADA (etapa 5).
 *
 * 🔁 Era lo último que quedaba del dibujo viejo: una sombra cabezona negra de
 * nueve unidades, o sea MENOS DE MEDIA PERSONA. No se podía arreglar solo
 * porque el jinete y el caballo son UNA SOLA IMAGEN. Con el caballo a su tamaño
 * de verdad (26 de largo por 17 al lomo, contra una persona de 20) ahora sí
 * entra, y el jinete es exactamente la misma gente que camina por el vagón.
 *
 * 🔻 ETAPA 5b — CÓMO REACCIONA AL CABALLO *(Santi: "se debería mejorar como
 * reacciona el personaje ante la inclinación y movimientos del caballo, porque
 * hoy en día es muy malo")*. Tenía razón, y eran cuatro cosas distintas:
 *
 *  1. LA INCLINACIÓN ERA UN CORRIMIENTO DE COSTADO. Se deslizaba en X y nada
 *     más: no se doblaba. Ahora el torso ROTA sobre la montura, que es lo que
 *     hace un jinete de verdad — se dobla de la cintura, no se corre del
 *     asiento.
 *  2. EL GIRO LE SALTABA DE GOLPE. Iba de perfil hasta la pose 3 y ahí, en un
 *     cuadro, pasaba a mirar de frente. Y resulta que la gente YA TIENE las
 *     vistas de tres cuartos (`diagF` y `diagE` en figura.js) y el jinete era
 *     el único que no las usaba: ahora el ángulo sale del rumbo y la vista se
 *     elige sola, así que el giro pasa por el medio.
 *  3. IBA SOLDADO AL LOMO. Subía y bajaba EXACTAMENTE lo mismo que el animal.
 *     Un jinete amortigua con las piernas y la cintura: el torso sube la mitad
 *     y un instante más tarde (`rebote`, que lo calcula el galope a partir de
 *     la misma zancada). Eso es lo que separa a una persona montada de una
 *     calcomanía pegada.
 *  4. NO TENÍA LAS MANOS EN LAS RIENDAS, que es lo que ata visualmente al
 *     jinete con la cabeza del caballo.
 *
 * `inclina`: cuánto se echa hacia adelante, de 0 (parado) a 2 (a fondo).
 * `riendas`: dónde está el bocado, si hay caballo (lo devuelve `dibujarAnimal`).
 */
export function dibujarJinete(r, x, asiento, pose = 0, inclina = 0, ropa = {}, riendas = null) {
  const quien = ropa.detalles || 'jugador';
  /**
   * EL RUMBO MANDA LA VISTA, y en pasos: de perfil (pose 0-1) a tres cuartos
   * (2) a de frente o de espaldas (3-4). `direccionDe` redondea a la más
   * cercana de ocho, así que esto sale solo.
   */
  const angulo = (pose / 4) * (Math.PI / 2);

  /**
   * SE DOBLA DE LA CINTURA. La rotación es sobre el asiento, no sobre los
   * pies: un jinete que se echa adelante deja la cadera donde está.
   */
  const dobla = -inclina * 0.11;
  const gira = -pose * 0.012;                // y se vuelca un poco hacia adentro
  const sx = x;
  const sy = asiento + ALTO_SENTADO;

  if (r.ctx && (dobla || gira)) {
    r.ctx.save();
    r.ctx.translate(sx, sy);
    r.ctx.rotate(dobla + gira);
    r.ctx.translate(-sx, -sy);
  }

  const persona = dibujarPersona(r, {
    tipo: quien === 'ley' ? 'jineteLey' : 'jugador',
    x: sx,
    pies: sy,
    angulo,
    postura: 'sentado',
    estado: ropa.estado,
    destello: ropa.destello,
    panuelo: quien === 'jugador',
  });

  if (r.ctx && (dobla || gira)) r.ctx.restore();

  /**
   * LAS RIENDAS. Dos tiras finas de la mano al bocado. Van DESPUÉS de soltar
   * la rotación porque el jinete se dobla pero la rienda no: es una cuerda
   * tirante entre dos puntos, y tiene que seguir llegando a la boca del animal
   * esté el jinete como esté.
   */
  if (riendas && persona) {
    const mx = sx + 3 + inclina * 0.8;
    const my = (persona.manoY ?? sy - 9) + dobla * 6;
    /**
     * 🐛 SE DIBUJAN EN PASITOS DE UN PUNTO, no con `r.line`. Una raya fina en
     * diagonal el canvas la SUAVIZA, y una rienda de un punto suavizada no
     * queda fina: queda un borrón claro y despintado, que al lado de la cabeza
     * del caballo parecía un palo de luz. Acá no hay nada suavizado — todo el
     * juego son rectángulos de puntos enteros — así que la cuerda también.
     */
    cuerda(r, mx, my, riendas.x, riendas.y, '#2a1c12', 1.6);
  }

  return persona;
}
