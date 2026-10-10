/**
 * 🎨 ESTILO NUEVO · P3 — LA GENTE DEL TREN: GUARDIAS Y PASAJEROS.
 *
 * El mismo cuerpo que el jugador (27 puntos: cabeza 8, torso 9, piernas 10),
 * las mismas piernas y el mismo paso (las toma de jugador.js), y encima lo
 * suyo, dibujado a mano en cada vista: la cabeza (pelo y cara), el sombrero,
 * la barba y la ropa. Cada cosa es un mapa aparte y se apilan, así las
 * variantes se combinan sin dibujar cada combinación *(Santi: "variables que
 * harían que los personajes sean más únicos: barba, sombrero, ropa, color de
 * cabello y formas mínimas de cuerpo… para añadir más realismo y humanidad")*.
 *
 * PASO 1 (hoja de prueba): el guardia y el pasajero base en las 5 vistas, y
 * algunas variantes de frente y en diagonal de frente para ver si se
 * distinguen. Todavía no se usa en el juego.
 *
 * Los mapas usan las letras de colores del jugador (ver C en jugador.js) más
 * tres nuevas: `A` y `a` el pelo (base y sombra) y `E` la estrella. Cada
 * personaje cambia qué color es cada letra (ver COLORES), y una letra puesta
 * en null no se dibuja (así el pasajero no lleva funda).
 */
import { iluminar } from '../../engine/luz.js';
import { VISTAS, C, linea, OX, OY, ANCHO, ALTO } from './jugador.js';

const mapa = (y, filas) => ({ y, filas });

// ------------------------------------------------------------------ cabezas
/**
 * LA CABEZA SIN SOMBRERO, con el pelo CORTO: la cara (3 filas, de la 4 a la
 * 6) y el cuello. De frente se ve la cara entera con el pelo en las sienes;
 * de costado, la nuca con pelo y la nariz adelante; de espaldas, todo pelo.
 */
const CABEZA = {
  frente: mapa(2, [
    '.........aAa',
    '........aAAAa',
    '........apppa',
    '........pPPPp',
    '........qpPpq',
    '.........qpq',
  ]),
  diagF: mapa(2, [
    '..........aAa',
    '.........aAAAa',
    '........aappp',
    '........apPPPp',
    '.........qpPPq',
    '..........qpq',
  ]),
  lado: mapa(2, [
    '.........aAa',
    '........aAAAA',
    '........aappp',
    '........aaPPPn',
    '.........apPq',
    '.........qpq',
  ]),
  diagE: mapa(2, [
    '.........aAa',
    '........aAAAa',
    '........aAAAp',
    '........aAAap',
    '.........ppp',
    '.........ppp',
  ]),
  espalda: mapa(2, [
    '.........aAa',
    '........aAAAa',
    '........aAAAa',
    '........aAAAa',
    '.........ppp',
    '.........ppp',
  ]),
};

/**
 * OTROS PEINADOS (sin sombrero se ven): `costado` peinado al costado, con la
 * raya; `pelado` sin pelo arriba, sólo en las sienes. Por ahora de frente y
 * en diagonal de frente (hoja de prueba).
 */
const PEINADOS = {
  costado: {
    frente: mapa(2, ['........aAAAa', '........AaAAA']),
    diagF: mapa(2, ['.........aAAAa', '.........AaAAA']),
  },
  pelado: {
    frente: mapa(2, ['.........pPp', '........pPPPp']),
    diagF: mapa(2, ['..........pPp', '.........pPPPp']),
  },
};
/**
 * LAS BARBAS, sobre la cara (`B`, del color del pelo, un poco más oscuro):
 * bigote, candado (bigote y barbilla), patillas, completa corta. Afeitado es
 * no dibujar nada. Por ahora de frente y en diagonal de frente.
 */
const BARBAS = {
  bigote: { frente: mapa(5, ['.........BBB']), diagF: mapa(5, ['..........BBB']) },
  candado: { frente: mapa(5, ['.........BBB', '..........B']), diagF: mapa(5, ['..........BBB', '...........B']) },
  patillas: { frente: mapa(4, ['........B...B', '........B...B']), diagF: mapa(4, ['.........B', '.........B']) },
  completa: { frente: mapa(4, ['........B...B', '........BBBBB', '.........BBB']), diagF: mapa(4, ['.........B', '.........BBBB', '..........BBB']) },
};

// ------------------------------------------------------------------ sombreros
/**
 * LOS SOMBREROS, de la fila 0 a la 3 (tapan el pelo de arriba). `h H k` el
 * fieltro o la paja de la luz a la sombra, `x` la punta del ala en sombra,
 * `b` la cinta.
 *  plano  el del guardia: copa baja y ala ancha y derecha, que deja ver la cara.
 *  bombin el del pasajero: copa redonda y ala corta.
 */
const SOMBREROS = {
  plano: {
    frente: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '....xkkkkkkkkkkkx']),
    diagF: mapa(0, ['.........hHHHk', '.........bbbbb', '....hhhhHHHHHHHkkkk', '.....xkkkkkkkkkkkx']),
    lado: mapa(0, ['.........hHHk', '.........bbbb', '...hhhhHHHHHHHkkk', '....xkkkkkkkkkkx']),
    diagE: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '....xkkkkkkkkkkkx']),
    espalda: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '....xkkkkkkkkkkkx']),
  },
  // El otro del guardia: chico, con el ala curvada para arriba y echado atrás (se ve el pelo y más cara).
  curvo: {
    frente: mapa(0, ['.........hHk', '......h.hHHHk.k', '......hhbbbbbkk']),
    diagF: mapa(0, ['..........hHk', '.......h.hHHHk.k', '.......hhbbbbbkk']),
  },
  // El de paja del civil: ala ancha que cae un poco en las puntas.
  paja: {
    frente: mapa(0, ['........hHHHk', '........bbbbb', '...hhhhHHHHHHHkkkk', '..xkkkkkkkkkkkkkkx']),
    diagF: mapa(0, ['.........hHHHk', '.........bbbbb', '....hhhhHHHHHHHkkkk', '...xkkkkkkkkkkkkkkx']),
  },
  bombin: {
    frente: mapa(0, ['.........hHk', '........hHHHk', '........bbbbb', '.......hHHHHHk']),
    diagF: mapa(0, ['..........hHk', '.........hHHHk', '.........bbbbb', '........hHHHHHk']),
    lado: mapa(0, ['.........hHk', '........hHHHk', '........bbbbb', '.......hHHHHHkk']),
    diagE: mapa(0, ['.........hHk', '........hHHHk', '........bbbbb', '.......hHHHHHk']),
    espalda: mapa(0, ['.........hHk', '........hHHHk', '........bbbbb', '.......hHHHHHk']),
  },
};

// ------------------------------------------------------------------ torsos
/**
 * LOS TORSOS, de la fila 8 a la 16 (la 16 es el cinto). `L C c` la camisa,
 * `U V v w` el chaleco, `y` los botones, `E` la estrella, `R` la corbata.
 *  guardia  chaleco de la compañía abierto en V sobre la camisa, con la
 *           estrella del lado izquierdo del pecho (de frente, a la derecha de
 *           la pantalla).
 *  pasajero chaleco sobre la camisa y la corbata.
 */
const TORSOS = {
  guardia: {
    frente: mapa(8, ['.......CUCCCVc', '........UVCEv', '........UVEeE', '........UVyEv', '........UVVvv', '........VVyvv', '........VVVvw', '........VVyvw', '........WyGyW']),
    diagF: mapa(8, ['.......CUVCCvc', '........UUVCE', '........UVVEe', '........UVVyE', '........UVVvv', '........UVVyw', '........VVVvw', '........VVVyw', '........WyWGy']),
    lado: mapa(8, ['.......UVVvC', '.......UVVvc', '.......UVVve', '.......UVVvE', '.......UVVvy', '.......UVVvv', '.......VVVvw', '.......VVVvw', '.......WWyWG']),
    diagE: mapa(8, ['.......CVVVCvc', '........UVVcv', '........UVVVv', '........UVVvv', '........UVVvv', '........UVVvv', '........VVVvw', '........VVVvw', '........WWWWW']),
    espalda: mapa(8, ['.......CVVCVVc', '........UVcVv', '........UVVVv', '........UVVvv', '........UVVvv', '........VVVvv', '........VVVvw', '........VVVvw', '........WWWWW']),
  },
  pasajero: {
    frente: mapa(8, ['.......CUCRCVc', '........UCRCv', '........UVRVv', '........UVyvv', '........UVVvv', '........UVyvv', '........VVVvw', '........VVyvw', '........WyGyW']),
    diagF: mapa(8, ['.......CUVCRvc', '........UUCRv', '........UVVRv', '........UVVyv', '........UVVvv', '........UVVyv', '........VVVvw', '........VVVvw', '........WyWGy']),
    lado: mapa(8, ['.......UVVvC', '.......UVVvR', '.......UVVvR', '.......UVVvv', '.......UVVvy', '.......UVVvv', '.......VVVvw', '.......VVVvw', '.......WWyWG']),
    diagE: mapa(8, ['.......CVVVCvc', '........UVVcv', '........UVVVv', '........UVVvv', '........UVVvv', '........UVVvv', '........VVVvw', '........VVVvw', '........WWWWW']),
    espalda: mapa(8, ['.......CVVCVVc', '........UVcVv', '........UVVVv', '........UVVvv', '........UVVvv', '........VVVvv', '........VVVvw', '........VVVvw', '........WWWWW']),
  },
};

// ------------------------------------------------------------------ colores
/**
 * DE QUÉ COLOR ES CADA LETRA, por personaje (sobre los del jugador). Los
 * números son de la paleta de 48 y van por escalas, así la luz los mueve sin
 * inventar colores (ver engine/paleta.js).
 */
const PIELES = {
  clara: { P: 13, p: 12, q: 11, n: 17 },
  media: { P: 12, p: 11, q: 47, n: 13 },
  oscura: { P: 11, p: 47, q: 1, n: 12 },
};
const PELOS = {
  negro: { A: 2, a: 1, B: 1 },
  castano: { A: 4, a: 3, B: 3 },
  rubio: { A: 6, a: 5, B: 5 },
  canas: { A: 15, a: 14, B: 14 },
};
/** Los tres colores de compañía que se prueban en la hoja: chaleco y pantalón. */
export const UNIFORMES = {
  gris: { U: 25, V: 24, v: 23, w: 31, I: 24, T: 23, t: 31 },
  verde: { U: 43, V: 27, v: 26, w: 42, I: 27, T: 26, t: 42 },
  bordo: { U: 10, V: 9, v: 8, w: 39, I: 24, T: 23, t: 31 },
};
/** El color de cada sombrero (el del guardia y el bombín, negros; el de paja, claro con cinta). */
const COLOR_SOMBRERO = {
  plano: { h: 46, H: 2, k: 1, x: 1, b: 31 },
  curvo: { h: 46, H: 2, k: 1, x: 1, b: 31 },
  bombin: { h: 46, H: 2, k: 1, x: 1, b: 31 },
  paja: { h: 38, H: 37, k: 6, x: 5, b: 33 },
};
const BASE = {
  guardia: {
    L: 17, C: 16, c: 15,                     // camisa clara
    y: 1, E: 45, e: 29, W: 1, G: 28,         // botones oscuros, la estrella de bronce con su brillo, cinto
  },
  pasajero: {
    L: 17, C: 16, c: 15,                     // camisa clara
    U: 35, V: 34, v: 33, w: 32, y: 1,        // chaleco marrón
    R: 9, W: 1, G: 25,                       // corbata roja, cinto
    I: 24, T: 23, t: 31,                     // pantalón gris
    F: null, f: null,                        // sin funda
  },
};

// ------------------------------------------------------------------ dibujo
/**
 * UN CUADRO DE ALGUIEN: `tipo` ('guardia' | 'pasajero'), `vista`, `piernas`
 * (las del jugador: 'quieto', 'W0'…), y sus variantes: `sombrero`, `piel`,
 * `pelo`, `uniforme`. Devuelve los índices de color.
 */
export function cuadroGente({ tipo, vista, piernas = 'quieto', sombrero, piel = 'media', pelo = 'castano', uniforme = 'gris', barba = null, peinado = 'corto', mangas = 'largas', fino = false }) {
  // `sombrero` null es sin sombrero; sin decir nada, el de cada uno.
  const s = sombrero === undefined ? (tipo === 'guardia' ? 'plano' : 'bombin') : sombrero;
  const col = { ...C, ...BASE[tipo], ...(tipo === 'guardia' ? UNIFORMES[uniforme] : {}), ...PIELES[piel], ...PELOS[pelo], ...(s ? COLOR_SOMBRERO[s] : {}) };
  const idx = new Int16Array(ANCHO * ALTO).fill(-1);
  const poner = (x, y, i) => {
    if (i == null) return;
    x += OX; y += OY;
    if (x >= 0 && y >= 0 && x < ANCHO && y < ALTO) idx[y * ANCHO + x] = i;
  };
  const dibujarMapa = (m) => m.filas.forEach((fila, j) => {
    for (let x = 0; x < fila.length; x++) if (fila[x] !== '.') poner(x, m.y + j, col[fila[x]]);
  });
  /** Un brazo colgando: dos de ancho (el de afuera al sol si da a la izquierda) y la mano de 2×2. */
  const brazo = ([sx, sy], izquierda, atras) => {
    const [afuera, adentro] = atras ? [col.c, col.c] : izquierda ? [col.L, col.C] : [col.c, col.C];
    // Arremangada, del codo para abajo se ve el antebrazo.
    const piel = (y) => mangas === 'arremangadas' && y >= sy + 4;
    linea([sx, sy], [sx, sy + 6], (x, y) => {
      const [a, b] = piel(y) ? [atras ? col.p : izquierda ? col.P : col.p, col.p] : [afuera, adentro];
      poner(x, y, izquierda ? a : b); poner(x + 1, y, izquierda ? b : a);
    });
    poner(sx, sy + 7, atras ? col.p : col.P); poner(sx + 1, sy + 7, col.p);
    poner(sx, sy + 8, col.p); poner(sx + 1, sy + 8, col.q);
  };
  const P = VISTAS[vista].piernas[piernas] || VISTAS[vista].piernas.quieto;
  // Los brazos de allá, detrás del cuerpo.
  if (vista === 'lado') brazo([9, 9], false, true);
  if (vista === 'diagF') brazo([13, 9], false, true);
  dibujarMapa(P);
  dibujarMapa(TORSOS[tipo][vista]);
  dibujarMapa(CABEZA[vista]);
  if (PEINADOS[peinado] && PEINADOS[peinado][vista]) dibujarMapa(PEINADOS[peinado][vista]);
  if (barba && BARBAS[barba] && BARBAS[barba][vista]) dibujarMapa(BARBAS[barba][vista]);
  if (s && SOMBREROS[s] && SOMBREROS[s][vista]) dibujarMapa(SOMBREROS[s][vista]);
  // Los brazos de acá.
  if (vista === 'lado') brazo([10, 9], true, false);
  else if (vista === 'diagF') brazo([6, 9], true, false);
  else { brazo([6, 9], true, false); brazo([13, 9], false, false); }

  if (!fino) {
    const lleno = idx.slice();
    for (let y = 0; y < ALTO; y++) for (let x = 0; x < ANCHO; x++) {
      if (lleno[y * ANCHO + x] >= 0) continue;
      const v = (a, b) => a >= 0 && b >= 0 && a < ANCHO && b < ALTO && lleno[b * ANCHO + a] >= 0;
      if (v(x - 1, y) || v(x + 1, y) || v(x, y - 1) || v(x, y + 1)) idx[y * ANCHO + x] = 0;
    }
  }
  return idx;
}

/** El cuadro iluminado, como canvas. */
export function lienzoGente(o, luz = 0) {
  const indices = cuadroGente(o);
  const datos = iluminar({ ancho: ANCHO, alto: ALTO, indices, campo: () => luz });
  const cv = document.createElement('canvas');
  cv.width = ANCHO; cv.height = ALTO;
  cv.getContext('2d').putImageData(new ImageData(datos, ANCHO, ALTO), 0, 0);
  return cv;
}
