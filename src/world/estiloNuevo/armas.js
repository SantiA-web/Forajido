/**
 * 🧨 EL VAGÓN DE ARMAS, EN EL ESTILO NUEVO *(Santi eligió la pared verde militar, armeros y cajones, el barril rajado con su
 * reguero, y los cuatro detalles: la ametralladora bajo la lona, la arena y el NO FUMAR, el farol con reja y las balas de cañón)*.
 *
 *  - LA PARED, de tablas verdes con la franja roja (ver la pared del fondo en world/estiloNuevo/vagones.js).
 *  - ARRIBA: LOS ARMEROS contra la pared, con los fusiles parados en hilera y cajones de munición delante. En el tercer bloque,
 *    LA AMETRALLADORA bajo su lona, con el cartel y los baldes de arena en la pared. Son adorno: no se usan ni se roban.
 *  - ABAJO: LOS CAJONES con las marcas de la munición y LA PILA DE BALAS DE CAÑÓN en su marco.
 *  - LO QUE SE CAE CON LOS FRENOS ROTOS va en `w._armas` y lo dibuja world/caidas.js (`armas`): los fusiles de a tres, los
 *    cajones de arriba de las pilas y las balas de cañón. Lo que queda fijo no se cae nunca.
 *
 * Todos los mapas son a mano, punto por punto.
 */
import { pintarCajon, TAM_TORRE } from '../caidas.js';

const MAD = 5, MAD_L = 6, MAD_S = 4, MAD_SS = 3;
const dibujo = (pq, x, y, filas, col) => filas.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') pq(x + q, y + j, col[fila[q]]); });

/** El fusil parado en el armero, con el caño para arriba. Uno de cada tres lleva la correa de cuero. */
export const FUSIL = [
  '..o..', '.oHo.', '.oMo.', '.oMo.', '.oMo.', '.oMo.', '.oMo.', '.oMo.', '.oMo.', '.oMo.', '.oMo.', '.oMo.',
  '.oCo.', '.oco.', '.oCo.', '.oco.', '.oCo.', '.oMoo', '.oMMo', '.oCoo', '.oCo.', '.oCCo', 'oCCCo', 'oCCco', 'oCCco', 'oCcco', 'ooooo',
];
export const FUSIL_CORREA = [
  '..o..', '.oHo.', '.oMo.', '.oMo.', '.oMoo', '.oMSo', '.oMSo', '.oMSo', '.oMSo', '.oMSo', '.oMSo', '.oMSo',
  '.oCSo', '.ocSo', '.oCSo', '.ocSo', '.oCSo', '.oMSo', '.oMSo', '.oCSo', '.oCSo', '.oCSo', 'oCCSo', 'oCCSo', 'oCCco', 'oCcco', 'ooooo',
];
export const COL_FUSIL = { o: 0, H: 25, M: 24, C: 5, c: 4, S: 47 };

/** El farol de seguridad: la jaula de fierro alrededor del vidrio, para que no llegue una chispa a la pólvora. */
const FAROL_REJA = ['..ooo..', '.oKKKo.', 'oKoKoKo', 'oyoYoyo', 'oyoYoyo', 'oyoYoyo', 'oKoKoKo', '.oKKKo.', '..ooo..'];

/** El balde de arena colgado de la pared, rojo, con la arena a la vista. */
const BALDE_ARENA = [
  '...ooooo...',
  '..o.....o..',
  '.o.......o.',
  'oooooooooo.',
  'oAAaAAaAAo.',
  'oaAAaAAaAo.',
  'oooooooooo.',
  'oBRRRRRRro.',
  'oBRRRRRRro.',
  '.oBRRRRro..',
  '.oBRRRRro..',
  '.oBRRRRro..',
  '..oooooo...',
];
const COL_BALDE = { o: 0, A: 37, a: 6, B: 10, R: 9, r: 8 };

/** Letras de 5 de alto, para el cartel. */
const LETRAS = {
  N: ['o..o', 'oo.o', 'o.oo', 'o..o', 'o..o'], O: ['.oo.', 'o..o', 'o..o', 'o..o', '.oo.'], F: ['ooo', 'o..', 'oo.', 'o..', 'o..'],
  U: ['o..o', 'o..o', 'o..o', 'o..o', '.oo.'], M: ['o...o', 'oo.oo', 'o.o.o', 'o...o', 'o...o'], A: ['.oo.', 'o..o', 'oooo', 'o..o', 'o..o'],
  R: ['ooo.', 'o..o', 'ooo.', 'o.o.', 'o..o'], P: ['ooo.', 'o..o', 'ooo.', 'o...', 'o...'], E: ['ooo', 'o..', 'oo.', 'o..', 'ooo'],
  L: ['o..', 'o..', 'o..', 'o..', 'ooo'], G: ['.ooo', 'o...', 'o.oo', 'o..o', '.ooo'], I: ['ooo', '.o.', '.o.', '.o.', 'ooo'],
  V: ['o..o', 'o..o', 'o..o', '.oo.', '.oo.'],
};
/** Escribe en `pq` y devuelve dónde terminó. `gasta(x, y)`: true si en ese punto se saltó la pintura. */
export function escribir(pq, x, y, texto, color, gasta) {
  let tx = x;
  for (const ch of texto) {
    const L = LETRAS[ch];
    if (L) L.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] === 'o' && !(gasta && gasta(tx + q, y + j))) pq(tx + q, y + j, color); });
    tx += L ? L[0].length + 1 : 3;
  }
  return tx;
}
export const anchoTexto = (texto) => [...texto].reduce((s, ch) => s + (LETRAS[ch] ? LETRAS[ch][0].length + 1 : 3), 0) - 1;

/**
 * LA AMETRALLADORA BAJO SU LONA, de costado, mirando a la derecha: la lona crema tapa la culata y la mitad del carro, y por
 * delante asoman los seis caños con sus aros de bronce, la rueda grande de rayos y la cola del carro apoyada en el piso.
 */
const GATLING = [
  '..........oooooooooooooooo.............................',
  '.......oooTTTTTTTTTTTTTTTToooo.........................',
  '.....ooTTTTTTTttTTTTTTTTTTTTTToo.......................',
  '....oTTTTTTTtttTTTTTTTTTTtTTTTTTo......................',
  '...oTTTTTTttTTTTTTTTTTTTTttTTTTTTo.....................',
  '...oTTTTTttTTTTTTTTTTTTTTTttTTTTTTo....................',
  '..oTTTTTTtTTTTTTTTTTTTTTTTTttTTTTTTooooooooooooooooooo.',
  '..oTTTTTttTTTTTTTTTTTTTTTTTTttTTTTToBoHHHHHHHHHHHHHoBo.',
  '..oTTTTTtTTTTTTTTTTTTTTTTTTTTtTTTTToBommmmmmmmmmmmmoBoo',
  '..oTTTTttTTTTTTTTTTTTTTTTTTTTttTTTToboMMMMMMMMMMMMMoboH',
  '..oTTTTtTTTTTTTTTTTTTTTTTTTTTTttTTTobommmmmmmmmmmmmoboH',
  '..oTTTttTTTTTTTTTTTTTTTTTTTTTTTtTTToBoHHHHHHHHHHHHHoBoo',
  '..oTTTtTTTTTTTTTTTTTTTTTTTTTTTTttTTooooooooooooooooooo.',
  '..oTTttTTTTTTTTTTTTTTTTTTTTTTTTTtTTo.oWWo...oWWo.......',
  '.oTTTtTTTTTTTTTooooooooooTTTTTTTttTTo.oWWo.oWWo........',
  '.oTTttTTTTTTToohhhhhhhhhhooTTTTTTtTTo..oWWoWWo.........',
  '.oTTtTTTTTToohhooooooooooohhoTTTTttTo..oWWWo...........',
  '.ottttdTTTohhooWo..oWo...oohhoTTTtTTo..ooo.............',
  '..ootttdTohhoo.oWo.oWo..oWoohhoTTttdo..................',
  '....oootohhoWWo.oWooWo.oWo.ohhottddo...................',
  '.......ooho..oWo.oWoWooWo...ohoodoo....................',
  '.......oho....oWooooooWo....oho.oo.....................',
  'oooo...oho.....oooKKooo.....oho........................',
  'oWWWoo.oho.oWWWWoKKKKoWWWWo.oho........................',
  'oWwwWWooho.oWWWWoKKKKoWWWWo.oho........................',
  '.ooWwwWooho....oooKKooo....ohoo........................',
  '...ooWwWoohoo.oWooooooWo.oohoo.........................',
  '.....oWwWoohoooWoWooWoWoooho...........................',
  '......oWwWoohhooWo.oWo.oohho...........................',
  '.......oWwWoohhooooooooohhoo...........................',
  '........oWwooohhhhhhhhhhoo.............................',
  '.........ooo..oooooooooo...............................',
];
const COL_GATLING = { o: 0, T: 16, t: 15, d: 14, B: 7, b: 6, H: 24, M: 23, m: 31, W: 5, w: 4, h: 6, K: 23 };

/** LA BALA DE CAÑÓN, de fierro negro, con el brillo arriba a la izquierda. */
export const BALA_CANON = ['...ooooo...', '..oMMMMMo..', '.oMHHMMMmo.', 'oMHHMMMMMmo', 'oMHMMMMMMmo', 'oMMMMMMMmmo', 'oMMMMMMMmmo', 'oMMMMMMmmmo', '.oMMmmmmmo.', '..ommmmmo..', '...ooooo...'];
export const COL_BALA = { o: 0, H: 24, M: 23, m: 31 };
/** Dónde va cada bala de la pila dentro del marco: primero las de abajo y atrás; arriba de todo, las primeras en salir. */
export const LUGAR_BALAS = [[1, 14], [11, 14], [21, 14], [31, 14], [6, 8], [16, 8], [26, 8], [11, 2], [21, 2]];
/** El marco de tablas donde se apila: el fondo se ve detrás de las balas, y el frente, delante. */
export const MARCO_BALAS = {
  fondo: [
    'oooooooooooooooooooooooooooooooooooooooooo',
    'oLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLo',
    'oDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDo',
    'oooooooooooooooooooooooooooooooooooooooooo',
  ],
  frente: [
    'oooooooooooooooooooooooooooooooooooooooooo',
    'oLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLo',
    'oDDDDjDDDDDDDDDDDDjDDDDDDDDDDDDDjDDDDDDDDo',
    'oddddddddddddddddddddddddddddddddddddddddo',
    'oooooooooooooooooooooooooooooooooooooooooo',
  ],
};
export const COL_MARCO = { o: 0, L: 6, D: 5, d: 4, j: 3 };

export function pintarArmas({ w, map, S, cols, casilla, ax, ay, rMesas, pMesas, rFondo, pFondo, en, muebles, animado, faroles, yFarolA, ventanillas, dia, h, yPisoArriba, filasAbajo, filasArriba, yArriba, PASO, x0 }) {
  const r = rMesas, p = pMesas, rf = rFondo, pf = pFondo;
  const X = (c) => ax(w.x + c * S), Y = (f) => ay(f * S);
  const A = (w._armas = { fusiles: [], cajones: [], balas: null });
  const yCara = 8;
  const yCaeArriba = 3 * S + 4, yCaeAbajo = 7 * S - 2, baseArriba = yPisoArriba + 2 * S;

  // --- las ventanillas, con sus barrotes, como las del almacén: chicas y altas.
  for (const V of ventanillas) {
    const { x, w: an, y, h: alto } = V;
    rf(x - 3, y - 3, an + 6, alto + 6, 0);
    rf(x - 2, y - 2, an + 4, alto + 4, 42); rf(x - 2, y - 2, an + 4, 1, 27); rf(x - 2, y + alto + 1, an + 4, 1, 1);
    rf(x, y, an, alto, dia ? 21 : 18);
    if (dia) { for (let q = 0; q < 4; q++) pf(x + 2 + q, y + 1 + q, 22); }
    rf(x, y + Math.floor(alto / 2), an, 1, 23);
    for (const bx of V.barras) { rf(bx, y, 2, alto, 23); rf(bx, y, 1, alto, 24); }
  }

  // --- el farol con reja, uno solo, colgado del techo: se hamaca. De noche, prendido.
  for (const fx of faroles) {
    const largo = yFarolA - 6;
    animado(fx - 7, 0, 15, largo + FAROL_REJA.length + 3, baseArriba + 0.006, 9, (m, ra, pa) => {
      const dx = Math.round(m * 1.6);
      for (let k = 0; k <= largo; k++) pa(fx + Math.round((dx * k) / largo), 1 + k, k % 2 ? 24 : 0);
      FAROL_REJA.forEach((fila, j) => {
        for (let q = 0; q < fila.length; q++) {
          const ch = fila[q];
          if (ch === '.') continue;
          const vidrio = ch === 'y' || ch === 'Y';
          pa(fx + dx - 3 + q, 2 + largo + j, vidrio ? (dia ? (ch === 'Y' ? 22 : 21) : ch === 'Y' ? 29 : 28) : ch === 'o' ? 0 : 24, vidrio && !dia);
        }
      });
    });
  }

  const bloques = (fila0) => {
    const out = [];
    for (let c = 0; c < cols; c++) {
      if (casilla(c, fila0) !== 'C' || casilla(c - 1, fila0) === 'C') continue;
      let c2 = c; while (casilla(c2 + 1, fila0) === 'C') c2++;
      let f2 = fila0; while (casilla(c, f2 + 1) === 'C') f2++;
      out.push({ c, c2, f: fila0, f2 });
    }
    return out;
  };
  const lugar = (B) => ({ x: X(B.c) + 1, x2: X(B.c2 + 1) - 1, yt: Y(B.f), yb: Y(B.f2 + 1) - 3 });
  // Marca 8: la bala, munición. Marca 9: la llama, pólvora. Marca 1: las XXX.
  const cajon = (cx, piso, an, tapa, alto, marca) => pintarCajon(en(cx - 1, piso - alto - tapa - 1), an, tapa, alto, marca);
  // Lo que se cae de arriba de una pila: el dibujo lo pone world/caidas.js. `v`: tamaño y marca (`TAM_TORRE`).
  const cajonQueCae = (cx, piso, v, base, yPiso) => A.cajones.push({ px: cx, piso, v, base, yPiso, an: TAM_TORRE[v % 10][0] });

  /**
   * EL ARMERO, contra la pared: la tapa vista desde arriba, el fondo en sombra, la bandeja donde apoyan las culatas y la barra
   * con muescas que los sujeta. Los fusiles de `queCaen` no van acá: los dibuja world/caidas.js y se pueden caer.
   */
  const HONDO = 10, ALTO = 33;
  const armero = (x, x2, yt, queCaen) => {
    const an = x2 - x, yS = yt + HONDO, top = yS - ALTO;
    r(x - 1, top - HONDO - 1, an + 2, yS - top + HONDO + 2, 0);
    r(x, top - HONDO, an, HONDO, MAD);
    for (let q = top - HONDO + 3; q < top - 1; q += 3) r(x, q, an, 1, MAD_S);
    r(x, top - 1, an, 1, MAD_L);
    r(x, top, an, ALTO, 42);
    r(x, top, an, 2, 1);
    const yb = yS - 3;
    // Los fusiles fijos, de a uno cada cinco puntos, mientras no sean de los que se caen.
    let n = 0;
    for (let q = x + 3; q + 5 <= x2 - 3; q += 5, n++) {
      const cae = queCaen.some((k) => n >= k && n < k + 3);
      if (cae) { if (queCaen.includes(n)) A.fusiles.push({ px: q, piso: yb, base: baseArriba + 0.002, yPiso: yCaeArriba + (n % 3) * 3, semilla: n }); continue; }
      dibujo(p, q, yb - FUSIL.length, n % 3 === 1 ? FUSIL_CORREA : FUSIL, COL_FUSIL);
    }
    // La bandeja y la barra de arriba, que van delante de los fusiles fijos.
    r(x, yb, an, 3, MAD_S); r(x, yb, an, 1, MAD_L);
    r(x, top + 7, an, 3, 0); r(x, top + 8, an, 1, MAD);
    for (let q = x + 5; q < x2 - 3; q += 5) p(q, top + 8, 1);
    for (const px of [x, x2 - 3]) { r(px, top, 3, ALTO, MAD_S); r(px, top, 1, ALTO, MAD); r(px + 2, top, 1, ALTO, MAD_SS); }
    return yS;
  };

  // --- ARRIBA
  bloques(filasArriba).forEach((B, n) => {
    const L = lugar(B), an = L.x2 - L.x;
    if (n === 0 || n === 1) {
      // UN ARMERO, y delante, los cajones de munición que llegan hasta él.
      const yS = armero(L.x, L.x2, L.yt, n === 0 ? [2] : [1, 16]);
      const tapa = (alto) => L.yb - alto - yS;
      if (n === 0) { cajon(L.x + 1, L.yb, an - 3, tapa(13), 13, 8); cajonQueCae(L.x + 12, L.yb - 13, 82, baseArriba + 0.003, yCaeArriba + 3); }
      else {
        const a1 = Math.floor(an / 2) - 1;
        cajon(L.x, L.yb, a1, tapa(14), 14, 8); cajon(L.x + a1 + 2, L.yb, an - a1 - 3, tapa(13), 13, 9);
        cajonQueCae(L.x + 68, L.yb - 13, 81, baseArriba + 0.003, yCaeArriba + 2);
      }
    } else if (n === 2) {
      // LA AMETRALLADORA: tarima, cajones a los costados y la pared con el cartel y los baldes.
      const yP = L.yt + 4;
      r(L.x, yP, an, L.yb - yP, MAD_SS);
      for (let q = yP + 5; q < L.yb; q += 6) r(L.x, q, an, 1, 1);
      r(L.x - 1, yP - 1, an + 2, 1, 0); r(L.x - 1, L.yb, an + 2, 2, 0);
      const gx = L.x + 26;
      dibujo(p, gx, L.yb - GATLING.length + 1, GATLING, COL_GATLING);
      cajon(L.x + 1, L.yb, 22, 10, 14, 8);
      cajon(L.x2 - 32, L.yb, 30, 8, 13, 9);
      cajon(L.x2 - 28, L.yb - 21, 22, 6, 9, 8);
      // El cartel, clavado en la pared: tablas crema con las letras rojas.
      const txt = 'NO FUMAR', tw = anchoTexto(txt), cx = L.x + 18, cy = yCara + 6;
      rf(cx - 4, cy - 3, tw + 8, 11, 0); rf(cx - 3, cy - 2, tw + 6, 9, 16); rf(cx - 3, cy - 2, tw + 6, 1, 17); rf(cx - 3, cy + 6, tw + 6, 1, 15);
      escribir(pf, cx, cy, txt, 9);
      // Los baldes de arena, de una barra de fierro.
      const bx0 = cx + tw + 10;
      rf(bx0 - 2, cy - 2, 40, 2, 0); rf(bx0 - 2, cy - 2, 40, 1, 24);
      for (const k of [0, 1, 2]) dibujo(pf, bx0 + k * 12, cy - 1, BALDE_ARENA, COL_BALDE);
    } else {
      // El bloque chico del rincón: dos cajones uno encima del otro.
      cajon(L.x, L.yb, an - 2, 13, 13, 9);
      cajon(L.x + 1, L.yb - 26, an - 4, 8, 11, 8);
    }
    muebles.push({ x: L.x - 6, y: 0, w: an + 12, h: L.yb + 6, base: (B.f2 + 1) * S - 0.01 });
  });

  // --- ABAJO
  bloques(map.rows - filasAbajo - 2).forEach((B, n) => {
    const L = lugar(B), an = L.x2 - L.x;
    if (n === 0) {
      // LA PILA DE BALAS DE CAÑÓN (el marco acá; las balas, en world/caidas.js: salen rodando).
      const mx = L.x + Math.floor((an - 42) / 2), pisoM = L.yb, yFondo = pisoM - 28;
      r(L.x, L.yt + 3, an, L.yb - L.yt - 3, MAD_SS); r(L.x - 1, L.yt + 2, an + 2, 1, 0);
      for (let q = L.yt + 8; q < L.yb; q += 6) r(L.x, q, an, 1, 1);
      dibujo(p, mx, yFondo, MARCO_BALAS.fondo, COL_MARCO);
      for (const dx of [0, 40]) { r(mx + dx, yFondo, 2, 28, 0); r(mx + dx, yFondo + 1, 2, 26, MAD_S); }
      r(mx + 1, yFondo + 4, 40, 19, 1);
      A.balas = { px: mx, piso: pisoM - 5, base: (B.f2 + 1) * S - 0.008, yPiso: yCaeAbajo, quedan: LUGAR_BALAS.length };
      // (El frente del marco va en world/caidas.js, delante de las balas.)
    } else if (n === 1 || n === 2) {
      const a1 = Math.floor(an / 2) - 1, a2 = an - a1 - 2;
      cajon(L.x + 2, L.yt + 18, a1 - 3, 9, 15, 9); cajon(L.x + a1 + 3, L.yt + 19, a2 - 3, 9, 13, 8);
      cajon(L.x, L.yb, a1, 10, 13, 8); cajon(L.x + a1 + 2, L.yb, a2, 10, 12, 1);
      cajonQueCae(L.x + (n === 1 ? 56 : 8), L.yb - 13, n === 1 ? 90 : 81, (B.f2 + 1) * S - 0.005, yCaeAbajo - (n === 1 ? 0 : 2));
    } else {
      cajon(L.x + 2, L.yt + 18, an - 5, 9, 14, 8);
      cajon(L.x, L.yb, an - 2, 10, 13, 9);
    }
    if (n !== 0) muebles.push({ x: L.x - 6, y: L.yt - 30, w: an + 12, h: L.yb - L.yt + 36, base: (B.f2 + 1) * S - 0.01 });
    else muebles.push({ x: L.x - 2, y: L.yt, w: an + 4, h: L.yb - L.yt + 5, base: (B.f2 + 1) * S - 0.01 });
  });
}
