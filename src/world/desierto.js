/**
 * EL DESIERTO — uno solo, para el galope y para los costados del tren.
 *
 * *(Santi, después de jugar el asalto: "la parte de afuera no parece desierto,
 * parece un vacío oscuro" … y después del primer arreglo: "se sigue viendo
 * demasiado feo")*. El primer intento le puso el color del desierto y las
 * rayitas del parallax a la franja de los costados, y no alcanzó: esas rayitas
 * son de la RESOLUCIÓN VIEJA. Lo que faltaba es lo mismo que arregló la gente y
 * el vagón — dibujar las cosas del suelo con el detalle nuevo.
 *
 * Y HAY UNA SOLA SIEMBRA, no dos. El galope ya tenía su pasto, sus piedras, sus
 * matas y sus cactus; el asalto no tenía nada. Ahora los dos llaman a
 * `sembrarDesierto` con el mismo sorteo, así que el afuera del tren ES el mismo
 * lugar por el que venías galopando, y no dos sitios que se parecen.
 *
 * NO HAY AZAR: cada cosa sale de un número fijo por celda. Si fuera azar, el
 * desierto cambiaría entero en cada cuadro.
 */

import { pieza, tono, NEGRO } from './piezas.js';

/** Un punto de dibujo: un cuarto de unidad, con la lupa de ×4. */
const PUNTO = 0.25;
/** El lado de la celda donde puede caer una cosa, en unidades. */
const CELDA = 30;

/** Las manchas de suelo son elipses achatadas, como todo en tres cuartos. */
const ACHATA_SUELO = 0.62;

/** Un número fijo entre 0 y 2³²−1 para cada celda. */
function revolver(n) {
  let h = n >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 2246822507);
  h ^= h >>> 13; h = Math.imul(h, 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/**
 * LAS COSAS DEL SUELO, dibujadas una sola vez cada una.
 *
 * `noche` no es un adorno: de noche el suelo está oscuro y lo que hay ENCIMA
 * agarra la luna. Por eso hay dos juegos de piezas y no uno teñido al vuelo.
 */
function piezaAdorno(tipo, C, noche) {
  const t = (hex, f) => tono(hex, noche ? f * 0.5 : f);
  const clave = `des|${tipo}|${noche ? 'n' : 'd'}`;
  switch (tipo) {
    case 'pasto':
      return pieza(clave, 24, 20, (p) => {
        const verde = t(C.pasto, 1), claro = t(C.pasto, 1.35), oscuro = t(C.pasto, 0.7);
        for (const [x, alto, w] of [[2, 13, 2], [7, 18, 2], [12, 11, 2], [17, 15, 2]]) {
          p(x, 20 - alto, w, alto, verde);
          p(x, 20 - alto, w, 3, claro);
        }
        p(1, 18, 20, 2, oscuro);
      });

    case 'piedrita':
      return pieza(clave, 20, 14, (p) => {
        p(1, 4, 18, 9, NEGRO);
        p(2, 5, 16, 7, t(C.piedrita, 1));
        p(3, 5, 12, 3, t(C.piedritaLuz, 1));
        p(2, 10, 16, 2, t(C.piedrita, 0.66));
        p(5, 7, 4, 2, t(C.piedrita, 0.8));
      });

    case 'mata':
      return pieza(clave, 72, 40, (p) => {
        const hoja = t(C.mata, 1), luz = t(C.mataLuz, 1), sombra = t(C.mata, 0.62);
        // Tres matorrales pegados: una mata no es un rectángulo, es un montón.
        for (const [x, y, w, h] of [[4, 16, 26, 18], [22, 8, 30, 22], [42, 18, 26, 16]]) {
          p(x - 2, y - 2, w + 4, h + 4, NEGRO);
          p(x, y, w, h, hoja);
          p(x + 3, y + 2, w - 10, 6, luz);
          p(x, y + h - 4, w, 4, sombra);
        }
        // Las ramitas que asoman por arriba.
        for (const [x, y, h] of [[16, 10, 7], [34, 2, 7], [52, 12, 7]]) p(x, y, 2, h, sombra);
      });

    case 'cactus':
      return pieza(clave, 32, 56, (p) => {
        const verde = t(C.cactus, 1), luz = t(C.cactus, 1.3), sombra = t(C.cactus, 0.62);
        const brazo = (x, y, w, h) => {
          p(x - 2, y - 2, w + 4, h + 4, NEGRO);
          p(x, y, w, h, verde);
          p(x, y, 3, h, luz);
          p(x + w - 3, y, 3, h, sombra);
        };
        brazo(12, 4, 9, 50);                    // el tronco
        brazo(4, 20, 8, 7); brazo(4, 14, 7, 9); // el brazo de la izquierda
        brazo(20, 28, 8, 7); brazo(21, 22, 7, 9); // y el de la derecha
        // Las costillas y las espinas: sin ellas es un palo verde.
        for (let i = 0; i < 6; i++) {
          p(16, 10 + i * 7, 1, 4, sombra);
          p(11, 12 + i * 8, 1, 1, luz);
          p(21, 16 + i * 8, 1, 1, luz);
        }
      });

    case 'mancha':
    default:
      return pieza(clave, 56, 12, (p) => {
        const tierra = t(C.tierraOscura, 1);
        p(6, 2, 44, 8, tierra);
        p(0, 4, 56, 4, tierra);
        p(10, 3, 20, 2, t(C.tierraOscura, 1.3));
      });
  }
}

/**
 * SIEMBRA EL DESIERTO sobre un rectángulo.
 *
 * `desplaza` es cuánto corrió el suelo: con eso las mismas celdas desfilan
 * hacia atrás en vez de quedar clavadas a la pantalla. `saltar(x, y)` deja
 * agujeros donde no tiene que haber nada (la vía, el tren).
 *
 * `escala` achica lo que se siembra: los costados del tren son una franja
 * angosta y vista de más lejos que el campo del galope.
 */
export function sembrarDesierto(r, opciones) {
  const {
    x0, y0, x1, y1, desplaza = 0, noche = false,
    colores, saltar = null, escala = 1, semilla = 0, grandes = null,
  } = opciones;
  if (x1 <= x0 || y1 <= y0) return;

  const cx0 = Math.floor((x0 + desplaza) / CELDA) - 1;
  const cx1 = Math.ceil((x1 + desplaza) / CELDA) + 1;
  const cy0 = Math.floor(y0 / CELDA) - 1;
  const cy1 = Math.ceil(y1 / CELDA) + 1;

  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const h = revolver(cx * 7919 + cy * 104729 + semilla);
      const suerte = h % 9;
      if (suerte > 4) continue;             // cuatro de cada nueve celdas, vacías
      const wx = cx * CELDA + ((h >>> 8) % CELDA) - desplaza;
      const wy = cy * CELDA + ((h >>> 16) % CELDA);
      if (wx < x0 - 20 || wx > x1 + 20 || wy < y0 || wy > y1) continue;
      if (saltar && saltar(wx, wy)) continue;

      /**
       * ⚠️ LAS COSAS GRANDES NO VAN EN CUALQUIER LADO, y esto es una regla de
       * JUEGO y no de dibujo: en el campo por donde galopás hay obstáculos de
       * verdad —piedras y cactus que te frenan—, así que un adorno que se les
       * parezca es una trampa. Donde `grandes` dice que no, sólo va lo chico y
       * apagado: pasto, piedritas y manchas de tierra.
       */
      const dejaGrandes = !grandes || grandes(wx, wy);
      let tipo;
      if (suerte <= 1) tipo = 'pasto';
      else if (suerte === 2) tipo = 'piedrita';
      else if (suerte === 3) tipo = dejaGrandes && (h & 1) ? 'mata' : 'mancha';
      else if (dejaGrandes) tipo = 'cactus';
      else continue;
      const img = piezaAdorno(tipo, colores, noche);
      const w = img.width * PUNTO * escala;
      const alto = img.height * PUNTO * escala;
      // Apoyado por abajo: `wy` es donde toca el suelo, no donde empieza.
      r.ctx.drawImage(img, wx - w / 2, wy - alto, w, alto);
    }
  }
}

/**
 * 🏜️ LAS MANCHAS DE TERRENO: lo que hace que el campo sea un LUGAR.
 *
 * *(Santi, sobre el intento anterior, que fue ponerle un horizonte: "lo siento
 * ajeno al sector por dónde corren los caballos… quedó horrible". Y después, la
 * explicación exacta: "en el galope no te deja pasar al otro lado de la vía del
 * tren (o sea, acercarte al fondo). En el escape sí podés ir por dónde querás".)*
 *
 * ⚠️ ÉSA ES LA REGLA, Y ES DE CÁMARA. Un fondo pintado sólo aguanta si hay algo
 * que te impida llegar hasta él — en el galope, la vía. Donde podés cabalgar a
 * cualquier lado no hay "lejos" que se pueda falsear: **el paisaje lo tiene que
 * hacer el suelo**, que es adonde sí vas.
 *
 * Son manchas grandes y achatadas —la misma vista de tres cuartos que todo lo
 * demás— sorteadas por celda, sin azar: la misma celda da siempre la misma
 * mancha, así que el desierto no titila ni cambia cuando volvés sobre tus pasos.
 *
 * ⚠️ Y VAN EN TONOS DEL MISMO COLOR, no en colores distintos. Es la lección que
 * dejó la quebrada: con cinco colores el paredón se veía como un órgano de
 * tubos. Lo que separa una zona de otra acá es la LUZ, no el tinte.
 */

/**
 * 🐛 LAS FILAS SE CUENTAN DESDE EL TAMAÑO, no son un número fijo. Con 16 filas
 * una mancha grande quedaba en escalones de siete unidades: se leía como una
 * escalera, no como una mancha de tierra. Ahora hay una fila y media por unidad
 * de alto, o sea filas de menos de un punto de pantalla.
 */
const filasDe = (ry) => Math.max(8, Math.min(220, Math.round(ry * 1.5)));

/** Los tonos, como factores del color del suelo. */
const TONOS = [1.11, 0.89, 0.79, 1.05];

/**
 * ⚠️ CUÁNTAS CELDAS TIENEN MANCHA VA APARTE DEL TONO, y sale de bits distintos
 * del mismo sorteo. Antes los dos salían del mismo resto, así que bajar la
 * cantidad también borraba tonos: con tres de cada diez celdas llenas, uno de
 * los cuatro tonos no aparecía nunca.
 *
 * Y tiene que quedar suelo base sin mancha: si todas tuvieran, no habría contra
 * qué leerlas y el desierto volvería a ser un color liso, sólo que otro.
 */
const DE_CADA = 10;

export function pintarSuelo(r, opciones) {
  const { x0, y0, x1, y1, noche = false, base, semilla = 0 } = opciones;
  if (x1 <= x0 || y1 <= y0) return;
  // `tamano: 0` es "sin manchas", para poder comparar el costo contra nada.
  if (opciones.tamano === 0) return;

  /**
   * 🐛 EL TAMAÑO TIENE PISO, y no es una paranoia: probando con un valor
   * diminuto el bucle se comió la pestaña. Recorre `(ancho / tamaño)` celdas,
   * así que un número chico no dibuja manchas chiquitas — **cuelga el juego**.
   * Un número que llega de un archivo de datos nunca puede poder eso.
   */
  const tamano = Math.max(20, opciones.tamano || 120);
  /** Cuántas de cada diez celdas llevan mancha. El resto queda suelo pelado. */
  const llenas = Math.max(0, Math.min(DE_CADA, opciones.llenas ?? 2));

  const cx0 = Math.floor(x0 / tamano) - 1;
  const cx1 = Math.ceil(x1 / tamano) + 1;
  const cy0 = Math.floor(y0 / tamano) - 1;
  const cy1 = Math.ceil(y1 / tamano) + 1;

  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const h = revolver(cx * 15485863 + cy * 32452843 + semilla);
      if (h % DE_CADA >= llenas) continue;
      const zona = TONOS[(h >>> 3) % TONOS.length];

      // El centro cae dentro de la celda, pero la mancha es MÁS GRANDE que la
      // celda: así las vecinas se pisan y el borde no se lee como una grilla.
      const wx = cx * tamano + ((h >>> 6) % tamano);
      const wy = cy * tamano + ((h >>> 14) % tamano);
      const rx = tamano * (0.6 + ((h >>> 22) % 5) / 12);
      const ry = rx * ACHATA_SUELO;
      if (wx + rx < x0 || wx - rx > x1 || wy + ry < y0 || wy - ry > y1) continue;

      /**
       * 🐛 DE NOCHE LA DIFERENCIA HAY QUE ABRIRLA, no cerrarla. Los tonos son
       * multiplicativos y el suelo nocturno ya es casi negro (#1b1610): un
       * factor de 1,11 sobre 27 son TRES valores de diferencia, invisibles,
       * mientras que sobre el 138 del día son quince. La primera versión encima
       * los acercaba a 1 de noche, o sea que borraba las zonas justo cuando
       * menos se veían. Ahora se separa el doble para que la diferencia en
       * pantalla sea parecida a la del día — pero SÓLO lo justo: con el doble y pico
       * las manchas oscuras dejaban de leerse como tierra y parecían pozos.
       */
      const color = tono(base, noche ? 1 + (zona - 1) * 1.6 : zona);
      const filas = filasDe(ry);
      const alto = (2 * ry) / filas;
      for (let i = 0; i < filas; i++) {
        const t = (i + 0.5) / filas * 2 - 1;          // de -1 a 1
        /**
         * El borde no es una elipse limpia: cada fila se corre un poco, y el
         * corrimiento va SUAVE de una fila a la siguiente (se mezclan dos
         * sorteos vecinos). Si cada fila sacara su número suelto el borde
         * quedaría peludo en vez de irregular.
         */
        const k = i / 5;
        const a = (revolver(h + Math.floor(k) * 2654435761) % 1000) / 1000;
        const b = (revolver(h + (Math.floor(k) + 1) * 2654435761) % 1000) / 1000;
        const u = k - Math.floor(k);
        const j = a + (b - a) * (u * u * (3 - 2 * u));
        const medio = rx * Math.sqrt(Math.max(0, 1 - t * t)) * (0.84 + j * 0.16);
        if (medio < 1) continue;
        r.rect(wx - medio, wy - ry + i * alto, medio * 2, alto + 0.4, color);
      }
    }
  }
}

/** Qué zona pisa un punto: para medir cuántas cruza una corrida. */
export function zonaDe(x, y, tamano = 120, llenas = 2, semilla = 0) {
  const cx = Math.floor(x / tamano), cy = Math.floor(y / tamano);
  const h = revolver(cx * 15485863 + cy * 32452843 + semilla);
  // 0 es el suelo pelado; los demás, cada tono.
  return h % DE_CADA >= llenas ? 0 : 1 + ((h >>> 3) % TONOS.length);
}

/**
 * 🛤️ EL LECHO DE LA VÍA VISTO DESDE ARRIBA, pasando a toda velocidad. Es lo que
 * se ve por los huecos del tren en el asalto (`lechoDeLaVia`, raidScene.js).
 *
 * SE DIBUJA UNA VEZ Y SE CORRE. Un tramo de `ANCHO_LECHO` unidades se arma la
 * primera vez que se pide —la piedra, los durmientes, la grava y los dos
 * rieles— y cada cuadro se estampa corrido lo que avanzó el suelo. Cuesta dos o
 * tres estampas por cuadro, no mil rayitas.
 *
 * ⚠️ LA GRAVA VA SORTEADA, NO EN FILAS. La primera versión eran rayitas en siete
 * filas parejas, cada una con su separación fija: con los dos rieles al lado se
 * leía como una ruta con sus líneas pintadas. La piedra de verdad no tiene
 * carriles.
 *
 * ⚠️ Y SIN DURMIENTES SUELTOS, aunque en el galope los haya. Allá el suelo pasa
 * a 90 por segundo; acá, a 900: quince unidades por cuadro, con durmientes cada
 * nueve. Dibujados de a uno parecerían ir para atrás o quedarse quietos —la
 * rueda de carreta de las películas—. A esa velocidad el ojo ve una franja más
 * oscura, y eso es lo que se pinta.
 *
 * @param opciones.arriba      dónde empieza el lecho, en la pantalla
 * @param opciones.alto        cuánto mide de borde a borde, en unidades
 * @param opciones.rieles      a qué distancia del borde de arriba va cada riel
 * @param opciones.durmientes  [desde, hasta], también desde el borde de arriba
 * @param opciones.desplaza    cuánto corrió el suelo, en unidades
 * @param opciones.ancho       hasta dónde hay que cubrir
 */
const ANCHO_LECHO = 256;

export function pintarLechoDeVia(r, opciones) {
  const { arriba, alto, rieles, durmientes, desplaza, colores, noche, ancho } = opciones;
  if (!(alto > 2) || !(ancho > 0)) return;
  const img = lechoDibujado(alto, rieles, durmientes, colores, noche);
  const y = Math.round(arriba);
  let x = -((((desplaza % ANCHO_LECHO) + ANCHO_LECHO) % ANCHO_LECHO));
  for (; x < ancho; x += ANCHO_LECHO) {
    r.ctx.drawImage(img, Math.round(x), y, ANCHO_LECHO, img.height * PUNTO);
  }
}

/** Mezcla dos colores: `t` = 0 es todo `a`, 1 es todo `b`. */
function mezcla(a, b, t) {
  const na = parseInt(a.slice(1), 16), nb = parseInt(b.slice(1), 16);
  const c = (s) => Math.round(((na >> s) & 255) * (1 - t) + ((nb >> s) & 255) * t);
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}

function lechoDibujado(alto, rieles, durmientes, colores, noche) {
  const P = (u) => Math.round(u / PUNTO);
  const anchoP = P(ANCHO_LECHO);
  const altoP = P(alto);
  const clave = `lecho|${altoP}|${rieles.map(P).join(',')}|${durmientes.map(P).join(',')}|${noche ? 1 : 0}`;
  return pieza(clave, anchoP, altoP, (p) => {
    // De noche un paso más apagado, igual que el balasto de las franjas de afuera.
    const t = (c, f = 1) => tono(c, (noche ? 0.9 : 1) * f);
    const piedra = t(colores.balasto);

    /**
     * 1. LA PIEDRA, CON EL BORDE MORDIDO. El terraplén no termina en una regla:
     * cada dos puntos el borde entra un poco, y por ahí asoma la tierra de
     * abajo. Es lo que lo hace un montón de piedra y no una franja pintada.
     */
    for (let x = 0; x < anchoP; x += 2) {
      const h = revolver(x * 31 + 7);
      const deArriba = h % 7;
      const deAbajo = (h >>> 8) % 7;
      p(x, deArriba, 2, altoP - deArriba - deAbajo, piedra);
    }

    // 2. Los durmientes, borroneados: más oscuro en el medio, con el borde suave.
    const d0 = P(durmientes[0]), d1 = P(durmientes[1]);
    const dur = t(colores.durmiente);
    p(0, d0, anchoP, d1 - d0, mezcla(piedra, dur, 0.22));
    p(0, d0 + 3, anchoP, d1 - d0 - 6, mezcla(piedra, dur, 0.4));

    // 3. La grava, sorteada: largo, lugar y tono de cada rayita.
    const tonos = [t(colores.grava), t(colores.piedrita), t(colores.balasto, 0.72), t(colores.piedritaLuz)];
    const cuantas = Math.round((anchoP * altoP) / 110);
    for (let i = 0; i < cuantas; i++) {
      const h = revolver(i * 7919 + 1013);
      const h2 = revolver(h + 17);
      const x = h % anchoP;
      const y = 4 + ((h >>> 12) % Math.max(1, altoP - 8));
      const largo = 2 + (h2 % 12);
      const color = tonos[(h2 >>> 8) % tonos.length];
      p(x, y, largo, 1, color);
      // Lo que se pasa del borde vuelve por el otro lado: así el tramo empalma
      // consigo mismo y no se ve la costura.
      if (x + largo > anchoP) p(x - anchoP, y, largo, 1, color);
    }

    // 4. Los rieles: el brillo, el acero y la sombra que tiran sobre la piedra.
    for (const u of rieles) {
      const y = P(u);
      p(0, y - 2, anchoP, 1, t(colores.riel, 1.25));
      p(0, y - 1, anchoP, 3, t(colores.riel));
      p(0, y + 2, anchoP, 2, t(colores.rielSombra));
    }
  });
}
