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
