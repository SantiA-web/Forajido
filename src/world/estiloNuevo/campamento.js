/**
 * 🏕️ EL CAMPAMENTO EN EL ESTILO NUEVO *(Santi eligió "redibujar y darle vida", 2026-11-08)*.
 *
 *  - El mismo desierto y las mismas mesetas del galope, con un claro de tierra pisada en el medio.
 *  - La fogata tiene 8 cuadros de llama. De noche la luz sale de ella, por escalones, sobre EL MISMO dibujo: el suelo y
 *    las cosas se aclaran cerca del fuego y se apagan lejos. De día está apagada: piedras, leños quemados y un hilo de humo.
 *  - Cada cosa es su propio mapa de letras, hecho a mano. Van sin contorno, con el volumen en los tonos, igual que los
 *    obstáculos del galope.
 *
 * Todo lo que se dibuja acá adentro usa las medidas de la pantalla ideal del campamento (la escena mueve el lienzo).
 */
import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar, escalon } from '../../engine/luz.js';
import { PALETA, RGB, sombrear } from '../../engine/paleta.js';
import { pintarSuelo, estamparPlantas, SIN_VIA } from './suelo.js';
import { dibujarHorizonteNuevo } from './horizonte.js';
import { OBSTACULOS, dibujarObstaculoNuevo } from './obstaculos.js';
import { estiloNuevo } from '../../engine/estiloNuevo.js';
import * as CABALLO from '../../assets/caballoCampamento.js';
import { PELOS, PELOS_NOCHE } from '../../entities/estiloNuevo/caballo.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;
export const enGrilla = (v) => Math.round(v / PASO) * PASO;

// ─────────────────────────── LA LUZ ───────────────────────────

/**
 * 🔁 LA LUZ DEL FUEGO ES CÁLIDA Y TIEMBLA POCO *(Santi: "titila con mucha intencidad, además, hay solo tres colores de luz y me
 * gustaría que hubieran más, y el desierto no se tiene que ver del mismo color que si fuera de día")*. El alcance cambia apenas
 * dos unidades para cada lado: medido, en cada latido cambia un 3 % del suelo iluminado (antes, un 15,5 %). Lo vivo lo da la llama.
 */
const ALCANCE = [152, 153, 151, 154];
/** Cuántos latidos por segundo. */
const LATIDOS = 6;
const PULSO = [0, 1, 2, 3, 2, 1, 0, 1];
export const pulsoEn = (t) => PULSO[Math.floor(t * LATIDOS) % 8];

/** En qué parte de cada escalón va el tramado. */
const TRAMA = [0.36, 0.72];
/** La arena con la luz del fuego, de lejos a al lado: siete tonos cálidos. Ni al lado del fuego llega al color de día. */
const ARENA_AL_FUEGO = [3, 47, 4, 5, 6, 44, 7];
const NIVEL_MAXIMO = 6.6;

/** En qué tono de esa escala está ese lugar. El piso se ve aplastado, así que la distancia en `y` vale más. */
function nivelDelFuego(x, y, fuego, pulso) {
  const t = Math.max(0, 1 - Math.hypot(x - fuego.x, (y - fuego.y) / 0.7) / ALCANCE[pulso]);
  const f = NIVEL_MAXIMO * t ** 0.8;
  // Escalones parejos, con el tramado sólo en la franja donde uno pasa al otro.
  const piso = Math.floor(f), resto = (f - piso - TRAMA[0]) / (TRAMA[1] - TRAMA[0]);
  return piso + Math.max(0, Math.min(0.99, resto));
}
/** Los escalones que se oscurece lo que no es arena. Siempre uno menos que de día, aunque esté al lado del fuego. */
const luzDeNivel = (n) => Math.min(-1, -3 + n / 2.2);
/** Lo mismo, para las cosas y la gente. */
export const luzDelFuego = (x, y, fuego, pulso) => luzDeNivel(nivelDelFuego(x, y, fuego, pulso));

/** El suelo de noche: la arena con su escala cálida, y lo demás (plantas, mesetas) con la luz de siempre. */
function sueloDeNoche(ind, W, H, nivel) {
  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x, i = ind[k], o = k * 4;
    if (i < 0) continue;
    const n = Math.max(0, Math.min(6, escalon(nivel(x, y), x, y)));
    let c;
    if (i === 37) c = ARENA_AL_FUEGO[n];
    else if (i === 36) c = ARENA_AL_FUEGO[Math.max(0, n - 1)];
    else if (i === 38) c = ARENA_AL_FUEGO[Math.min(6, n + 1)];
    else c = sombrear(i, Math.round(luzDeNivel(n)));
    const rgb = RGB[c];
    out[o] = rgb[0]; out[o + 1] = rgb[1]; out[o + 2] = rgb[2]; out[o + 3] = 255;
  }
  return out;
}

// ─────────────────────────── EL FONDO ───────────────────────────

const ARENA = 37, PISADA = [36, 38];
const azar = (x, y) => {
  const n = Math.imul(x, 73856093) ^ Math.imul(y, 19349663);
  return (Math.imul(n ^ (n >>> 13), 1274126177) >>> 0) / 4294967296;
};

let fondos = {}, claveFondo = '', indiceSuelo = null, plantas = [];
let capasCielo = null, capaNubes = null, nubesPintadas = '';

/**
 * 🌬️ El viento: 8 cuadros, a 0,2 segundos cada uno. Y las nubes, hacia la izquierda: 🔁 6 puntos por segundo *(Santi: "el
 * movimiento de las nubes es muy lento y pausado, debería ser más fluido")*. La grilla no deja correrlas menos de un punto
 * (3 píxeles): lo que las hace fluidas es dar esos pasos seguido.
 */
const SEGUNDOS_VIENTO = 0.2, NUBES_POR_SEGUNDO = 6;
export const vientoEn = (t) => Math.floor(t / SEGUNDOS_VIENTO) % 8;

function armarIndices(W, H, ox, oy, hyPantalla, claro) {
  const ind = new Int16Array(W * H);
  const dentro = (x, y) => Math.hypot(x - claro.x, (y - claro.y) / 0.7) < claro.radio;
  // El claro: sin plantas adentro. Se mira con el pie de cada planta, para que no queden mitades.
  pintarSuelo(ind, W, H, 0, 0, 0, {
    via: SIN_VIA, campo: true, horizonte: hyPantalla, plantas,
    claro: (px, py) => dentro(px * PASO - ox, py * PASO - oy),
  });
  // La tierra pisada: más puntos cuanto más cerca del medio.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x;
    if (ind[k] !== ARENA) continue;
    const d = Math.hypot(x * PASO - ox - claro.x, (y * PASO - oy - claro.y) / 0.7) / claro.radio;
    if (d >= 1) continue;
    const z = azar(x, y);
    if (z < 0.006 + 0.05 * (1 - d) ** 2) ind[k] = PISADA[z < 0.016 ? 1 : 0];
  }
  return ind;
}

/**
 * El cielo y el suelo. 🔁 El cielo se vuelve a pintar cada vez que las nubes avanzan un punto *(Santi: "que las nubes se muevan
 * lentamente")*, y el suelo se arma una sola vez por cada cuadro del viento y cada pulso de la llama. Se dibuja sin mover el
 * lienzo; `ox`, `oy` es dónde cae el origen del campamento.
 */
export function dibujarFondoCampamento(ctx, { ancho, alto, ox, oy, hy, dia, fuego, claro, pulso, t }) {
  const W = Math.ceil(ancho / PASO), H = Math.ceil(alto / PASO);
  const clave = [W, H, ox, oy, hy].join('|');
  if (clave !== claveFondo) { fondos = {}; indiceSuelo = null; plantas = []; capasCielo = null; capaNubes = null; nubesPintadas = ''; claveFondo = clave; }
  const hyPantalla = hy + oy;
  const lienzoPara = (partes, nubes = 0, sobre = null) => {
    const cv = sobre || document.createElement('canvas');
    if (!sobre) { cv.width = W + 2; cv.height = H; }
    const g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    g.imageSmoothingEnabled = false;
    g.setTransform(1 / PASO, 0, 0, 1 / PASO, 0, 0);
    dibujarHorizonteNuevo(g, { hy: hyPantalla, ancho, avance: 0, dia, nubes, partes });
    return cv;
  };
  capasCielo ||= {};
  capasCielo[dia ? 'd' : 'n'] ||= { cielo: lienzoPara('cielo'), tierra: lienzoPara('tierra') };
  const { cielo, tierra } = capasCielo[dia ? 'd' : 'n'];
  const nubes = Math.floor(t * NUBES_POR_SEGUNDO);
  if (dia && nubesPintadas !== nubes) { capaNubes = lienzoPara('nubes', nubes, capaNubes); nubesPintadas = nubes; }
  const viento = vientoEn(t), id = (dia ? 'dia' : pulso) + '|' + viento;
  if (!fondos[id]) {
    indiceSuelo ||= armarIndices(W, H, ox, oy, hyPantalla, claro);
    const ind = estamparPlantas(indiceSuelo, W, H, plantas, viento, hyPantalla);
    const capa = document.createElement('canvas');
    capa.width = W; capa.height = H;
    capa.getContext('2d').putImageData(new ImageData(dia
      ? iluminar({ ancho: W, alto: H, indices: ind, campo: () => 0 })
      : sueloDeNoche(ind, W, H, (x, y) => nivelDelFuego(x * PASO - ox, y * PASO - oy, fuego, pulso)), W, H), 0, 0);
    fondos[id] = capa;
  }
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  const ancho2 = (W + 2) * PASO;
  ctx.drawImage(cielo, 0, 0, ancho2, H * PASO);
  if (dia) ctx.drawImage(capaNubes, 0, 0, ancho2, H * PASO);
  ctx.drawImage(tierra, 0, 0, ancho2, H * PASO);
  ctx.drawImage(fondos[id], 0, 0, W * PASO, H * PASO);
  ctx.imageSmoothingEnabled = prev;
}

// ─────────────────────────── LOS DIBUJOS ───────────────────────────
// (En cada mapa, `.` es vacío. Las letras son de ese mapa: su color está en la tabla que va con él.)

const SOMBRA = { s: 36, S: 35 };

/** 🪨 LA FOGATA: las piedras en rueda, con las cenizas adentro. El fuego va encima. Pie: el medio de la rueda. */
const RUEDA = {
  pie: [17, 12],
  colores: { ...SOMBRA, L: 25, M: 24, D: 23, K: 31, a: 24, c: 23, n: 31, b: 1 },
  mapa: [
    '...........LLM.LLLM.LLM.........',
    '......LLM.MMMDKMMMDKMMD.LLM.....',
    '....LLMMDKDDKcccccccKDDKMMMD....',
    '...MMMDDKcccccnnnnncccccKDDMMD..',
    '..LLMDKccccnnnnbbbnnnncccKDLLM..',
    '.LMMDKcccnnnbbbbbbbbbnnncccKMMMD',
    '.MMDDccnnnnbbbbbbbbbbbnnnncKDDDD',
    'LLMKccnnnbbbbbbbbbbbbbbbnnncKLLM',
    'MMDcccnnnnbbbbbbbbbbbbbnnnnccMMD',
    'DLLMccannnnbbbbbbbbbbbnnnnaccLMD',
    '.MMMLLMcaannnnnnnnnnnnnaacLLMMD.',
    '.DDMMMDLLMcaaaaaaaaaaacLLMMMDDD.',
    '..KDDDKMMMDLLLM.LLLLMDMMMDKDDK..',
    '..sKKKSDDDKMMMDKMMMMDKDDDKSKKs..',
    '...ssSSKKKSKDDKSKDDKSKKKSSSss...',
    '.....sssSSSSKKSSSKKSSSSsss......',
    '.........sssssssssssss..........',
  ],
};

/** Los leños que se queman, cruzados. De día, además, es todo lo que queda. */
const LENA = {
  pie: [13, 7],
  colores: { w: 6, W: 5, d: 4, k: 3, n: 1, e: 44, E: 45 },
  mapa: [
    '...............wWdk',
    '...kdw.......wWdknk',
    '...kdWw....wWdkkn..',
    '....kdWwwWwWdkk....',
    '.....nkdWwWdknn....',
    '..wWddkkdWwddkkdWw.',
    'wWdkknekkndWwkkkdWw',
    'dkknneEennkkdWweknk',
    '.nnkkeeennnkkdWwkn.',
    '.......nnn....kkn..',
  ],
};

/**
 * 🔥 LA LLAMA, 8 CUADROS. Son del mismo ancho y cambian las lenguas: la del medio sube y se tuerce, y las de los costados
 * nacen, crecen y se cortan. Pie: el medio de abajo.
 */
const LLAMA = {
  pie: [9, 0],
  colores: { r: 44, n: 45, a: 28, b: 29 },
  cuadros: [
    [
      '.......r........',
      '.......rr.......',
      '......rnr.......',
      '......rnr....r..',
      '.....rnnr...rr..',
      '.r...rnnnr..rnr.',
      '.rr..rnannr.rnr.',
      '.rnr.rnaanr.rnnr',
      '.rnrrnaaanrrnnnr',
      '..rnnnaaaanrnanr',
      '..rnnaabaanrnanr',
      '..rnnaabbaannanr',
      '..rnaabbbaaanar.',
      '...rnabbbbaaanr.',
      '...rnaabbbbaanr.',
      '....rnaabbaanr..',
      '.....rnnaannr...',
    ],
    [
      '........r.......',
      '.......rr.......',
      '.......rnr......',
      '......rnnr......',
      '......rnnr..r...',
      '.....rnnnr.rr...',
      '.r...rnanr.rnr..',
      '.rr.rnnaanrrnr..',
      '.rnrrnaaanrrnnr.',
      '.rnnrnaaanrnnnr.',
      '..rnnnaabanrnanr',
      '..rnnaabbanrnanr',
      '..rnaabbbaannanr',
      '...rnabbbbaaanr.',
      '...rnaabbbbaanr.',
      '....rnaabbaanr..',
      '.....rnnaannr...',
    ],
    [
      '.................',
      '.........r.......',
      '........rr.......',
      '........rnr......',
      '.......rnnr......',
      '..r....rnnr.r....',
      '..rr..rnnanrrr...',
      '.rnr..rnaanrrnr..',
      '.rnrrrnaaanrnnr..',
      '.rnnrnaaabanrnnr.',
      '..rnnnaabbanrnanr',
      '..rnnaabbbaannanr',
      '..rnaabbbbbaanar.',
      '...rnabbbbbaaanr.',
      '...rnaabbbbaanr..',
      '....rnaabbaanr...',
      '.....rnnaannr....',
    ],
    [
      '.................',
      '.................',
      '.........r.......',
      '.........rr......',
      '...r....rnr......',
      '...rr...rnnr.r...',
      '..rnr..rnnanrr...',
      '..rnr.rrnaanrnr..',
      '.rnnrrrnaaanrnr..',
      '.rnnnrnaabanrnnr.',
      '..rnnnaabbanrnanr',
      '..rnnaabbbaannanr',
      '..rnaabbbbbaanar.',
      '...rnabbbbbaaanr.',
      '...rnaabbbbaanr..',
      '....rnaabbaanr...',
      '.....rnnaannr....',
    ],
    [
      '......r.........',
      '......rr........',
      '.....rnr........',
      '.....rnr........',
      '.....rnnr..r....',
      '...r.rnnr..rr...',
      '...rrrnanr.rnr..',
      '..rnrrnanrrrnr..',
      '..rnrnaaanrnnr..',
      '..rnnnaaaanrnnr.',
      '..rnnaabaanrnanr',
      '..rnnaabbaannanr',
      '..rnaabbbaaanar.',
      '...rnabbbbaaanr.',
      '...rnaabbbbaanr.',
      '....rnaabbaanr..',
      '.....rnnaannr...',
    ],
    [
      '................',
      '.....r..........',
      '.....rr.........',
      '....rnr.........',
      '....rnr......r..',
      '...rnnr.....rr..',
      '...rnnnr...rnr..',
      '.r.rnannr..rnr..',
      '.rrrnaanr.rnnr..',
      '.rnrnaaanrrnnr..',
      '..rnnaaaanrnanr.',
      '..rnnaabaanrnanr',
      '..rnaabbaannanr.',
      '...rnabbbaaanar.',
      '...rnaabbbaaanr.',
      '....rnaabbaanr..',
      '.....rnnaannr...',
    ],
    [
      '................',
      '................',
      '......r.........',
      '.....rr.........',
      '.....rnr.....r..',
      '....rnnr....rr..',
      '.r..rnnnr..rnr..',
      '.rr.rnannr.rnr..',
      '.rnrrnaanrrnnr..',
      '.rnnrnaaanrnnnr.',
      '..rnnnaaaanrnanr',
      '..rnnaabbanrnanr',
      '..rnaabbbaannanr',
      '...rnabbbbaaanr.',
      '...rnaabbbbaanr.',
      '....rnaabbaanr..',
      '.....rnnaannr...',
    ],
    [
      '.........r......',
      '.........rr.....',
      '........rnr.....',
      '........rnr.....',
      '.r.....rnnr.....',
      '.rr....rnnnr....',
      '.rnr..rnnanr.r..',
      '.rnr..rnaanrrr..',
      '.rnnrrnaaanrnr..',
      '..rnnnaaaanrnnr.',
      '..rnnaabaanrnanr',
      '..rnnaabbaannanr',
      '..rnaabbbaaanar.',
      '...rnabbbbaaanr.',
      '...rnaabbbbaanr.',
      '....rnaabbaanr..',
      '.....rnnaannr...',
    ],
  ],
};

/**
 * 🍲 LA OLLA, colgada de un palo apoyado en dos horquetas clavadas a los lados del fuego. Va delante de la llama: las
 * lenguas la lamen por abajo y por los costados. Pie: el medio, a la altura de las piedras.
 */
const OLLA = {
  pie: [17, 33],
  colores: { w: 6, W: 5, d: 4, k: 3, g: 31, G: 23, h: 24, H: 25, c: 24, n: 0 },
  mapa: [
    'w...w.........................w...w',
    'Wd.Wd.........................Wd.Wd',
    '.WwWd.........................WwWd.',
    '.wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.',
    '.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.',
    '.dWdkkkkkkkkkkkkcGkkkkkkkkkkkkkWdd.',
    '.dWd............Gc.............dWd.',
    '.dWd...........cGGc............dWd.',
    '.dWd.........gHHHHHHg..........dWd.',
    '.dWd........gHGggggGHg.........dWd.',
    '.dWd.......ggHhhGGGGGgg........dWd.',
    '.dWd.......gGhhGGGGGGgg........dWd.',
    '.dWd.......gGhGGGGGGggg........dWd.',
    '.dWd.......ngGGGGGGgggn........dWd.',
    '.dWd........nggggggggn.........dWd.',
    '.dWd..........nnnnnn...........dWd.',
    '.dWd...........................dWd.',
    '.dWd...........................dWd.',
    '.dWd...........................dWd.',
    '.dWd...........................dWd.',
    '.dWd...........................dWd.',
    '.dWd...........................dWd.',
    '.dWd...........................dWd.',
    '.dWd...........................dWd.',
    '.dWd...........................dWd.',
    '.dWd...........................dWd.',
    '.dWd...........................dWd.',
    '.dWd...........................dWd.',
    '.dWd...........................dWd.',
    '.dWd...........................dWd.',
    '.dWd...........................dWd.',
    '.dWk...........................dWk.',
    '.kkk...........................kkk.',
  ],
};

/**
 * ⛺ LA CARPA: A DOS AGUAS, cerrada atrás, con la boca oscura y las solapas recogidas. Se ve el frente y el costado, que se
 * va hacia arriba y a la derecha. Pie: abajo, entre el frente y el costado.
 */
const CARPA = {
  pie: [36, 42],
  colores: { ...SOMBRA, L: 17, l: 16, M: 15, D: 14, K: 14, n: 1, b: 0, w: 5, W: 6, r: 4, c: 13 },
  mapa: [
    '..........................................LL.............',
    '........................................LLlMM............',
    '......................................LLlllMMD...........',
    '....................................LLlllMMMMD...........',
    '..................................LLlllMMMMMMD...........',
    '................................LLlllMMMMMMMMMD..........',
    '..............................LLlllMMMMMMMMMMMD..........',
    '............................LLlllMMMMMMMMMMMMMMD.........',
    '..........................LLlllMMMMMMMMMMMMMMMMD.........',
    '........................LLlllMMMMMMMMMMMMMMMMMMMD........',
    '......................LLlllMMMMMMMMMMMMMMMMMMMMMD........',
    '....................LLlllMMMMMMMMMMMMMMMMMMMMMMMMD.......',
    '...................LLLllMMMMMMMMMMMMMMMMMMMMMMMMMD.......',
    '..................LlLLlDMMMMMMMMMMMMMMMMMMMMMMMMMMD......',
    '..................LlnLlDMMMMMMMMMMDMMMMMMMMMMMMMMMD......',
    '.................LlbbnLDMMMMMMMMMDMMMMMMMMMMMMMMMMMD.....',
    '.................LlbbnLlDMMMMMMMDMMMMMMMMMMMMMMMMMMD.....',
    '................LlnbbbnLDMMMMMMDMMMMMMMMMMMDMMMMMMMMD....',
    '................LlnbbbnLlDMMMMDMMMMMMMMMMMDMMMMMMMMMD....',
    '...............LlnbbbbbnLDMMMDMMMMMMMMMMMDMMMMMMMMMMMD...',
    '...............LlnbbbbbnLlDMDMMMMMMMMMMMDMMMMMMMMMMMMD...',
    '..............LlnbbbbbbbnLDDMMMMMMMMMMMDMMMMMMMMMMMMMMD..',
    '..............LlnbbbbbbbnLlDMMMMMMMMMMDMMMMMMMMMMMMMMMD..',
    '.............LlnbbbbbbbbbnLDMMMMMMMMMDMMMMMMMMMMMMMMMMMD.',
    '.............LlnbbbbbbbbbnLlDMMMMMMMDMMMMMMMMMMMMMMMMMMD.',
    '............LlKbbbbbbbbbbbKLDMMMMMMDMMMMMMMMMMMMMMMMMMDDD',
    '............LlKbbbbbbbbbbbKLlDMMMMDMMMMMMMMMMMMMMMMMDDDDD',
    '...........LlKnbbbbbbbbbbbnKLDMMMDMMMMMMMMMMMMMMMMDDDDDD.',
    '...........LlKnbbbbbbbbbbbnKLlDMDMMMMMMMMMMMMMMMDDDDDDD..',
    '..........LlKnnbbbbbbbbbbbnnKLDDMMMMMMMMMMMMMDDDDDDDDss..',
    '..........LlKcnbbbbbbbbbbbncKLlDMMMMMMMMMMMDDDDDDDDssss..',
    '.........LLlKcnnbbbbbbbbbnncKLLDMMMMMMMMMDDDDDDDDsssss...',
    '.........LllKccnbbbbbbbbbnccKllDMMMMMMMDDDDDDDDssssss....',
    '........LLlKlcnbbbbbbbbbbnclKlLLDMMMMDDDDDDDDssssss......',
    '........LllKlcnbbbbbbbbbbbnclKlLDMMDDDDDDDDssssss........',
    '.......LLlKllcnbbbbbbbbbbbncllKlLDDDDDDDDDssssss.........',
    '.......LllKllcnbbbbbbbbbbbbncllKlLDDDDDDssssss...........',
    '......LLlKlllcnbbbbbbbbbbbnclllKlLLDDDssssss.............',
    '......LllKlMMcnbbbbbbbbbbbncMMlKllLDDsssss...............',
    '.....LLlKlMMMcnbbbbbbbbbbbncMMMlKlLLsssss................',
    '.....LllKlMMMcnbbbbbbbbbbbncMMMlKllLssss.................',
    '....LLlKMMMMcnbbbbbbbbbbbbncMMMMKlLLsss..................',
    '....LllKMMMMcnbbbbbbbbbbbbbncMMMMKllLss..................',
    '.WrSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSrWs.................',
    '.rSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSrs.................',
    '...sssssssssssssssssssssssssssssssssss...................',
  ],
};

/** 📦 EL CAJÓN: la tapa arriba, el frente abajo, dos flejes y el candado. */
const CAJON = {
  // 🔁 Rectangular y con las cosas de un cajón de municiones *(Santi: "mejorá la caja de municiones: hacela rectangular")*:
  // tablones, listones en las puntas, manijas de hierro, el cierre y tres balas pintadas al frente. 1,8 m de largo.
  pie: [17, 18],
  colores: { ...SOMBRA, T: 7, t: 6, W: 6, w: 5, d: 4, k: 3, f: 23, F: 24, h: 25, o: 28, O: 29 },
  mapa: [
    '..TTTTTdTTTTTTTTTTTTTTTTTdTTTTTTTt',
    '.Ttttttdttttttttttttttttttdttttttw',
    '.Tdddddddddddddddddddddddddddddddw',
    'Ttttttdtttttttttttttttttttdttttttw',
    'Ttttttdtttttttttttttttttttdttttttw',
    'TttttdtttttttttfhhftttttttdttttttW',
    'kkkkkkkkkkkkkkkfhhfkkkkkkkkkkkkkkk',
    'WWWdWWWWWWWWWWWfFFfWWWWWWWWWWWWWwd',
    'WwwdwwwwwwwwwwwwffwwwwwwwwwwwwWwwd',
    'WdwdddddddddddddddddddddddddddWwwd',
    'WwwdWWWWWWWhWWWWWhWWWWWhWWWWWWWwwd',
    'fFhdwwwwwwhhhwwwhhhwwwhhhwwwwwfFhd',
    'fkhdwwwwwwdddwwwdddwwwdddwwwwwfkhd',
    'fFhdwwwwwwhhhwwwhhhwwwhhhwwwwwfFhd',
    'WdwdwwwwwwhhhwwwhhhwwwhhhwwwwwWwwd',
    'WwwdddddddddddddddddddddddddddWwwd',
    'WwddWWWWWWWWWWWWWWWWWWWWWWWWWWWdwd',
    'dkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkks',
    'sSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs',
    '.sssssssssssssssssssssssssssssssss',
  ],
};

/**
 * 🗺️ EL CARTEL DE LOS ASALTOS: el mapa viejo, clavado a una tabla con un techito *(Santi: "un mapa viejo pegado a un cartel de
 * madera")*. Tiene la vía punteada, el río, dos cerros y la cruz roja, y una punta despegada.
 */
const CARTEL = {
  // 🔁 Ya no es un cartel: es una mesa de madera, con el mapa de rutas extendido arriba *(Santi: "al mapa quiero que lo pongas
  // sobre una mesa de madera en el campamento y borres el formato cartel")*.
  // (El farol de la derecha: desde el campamento siempre apagado *(Santi: "sea de día o de noche el farol está sobre la mesa pero apagado")*.)
  pie: [20, 31],
  colores: { ...SOMBRA, T: 7, t: 6, W: 6, w: 5, d: 4, k: 3, P: 37, p: 36, f: 38, i: 33, a: 19, c: 34, x: 9, o: 35, O: 35, L: 31, M: 23, N: 24, H: 25, G: 15, V: 14 },
  mapa: [
    '..................................LLL...',
    '.................................L...L..',
    '.................................L.M.L..',
    '...TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTLMNMLTd',
    '...TtttttttttttttttttttttttttttttLNHNLtd',
    '..TtttPPPPPPPPPPPPfPPPPPPPPPPPPPLMMMMMLd',
    '..TtttPPcPPPPPPPPPfPPPPPPaPPPPPPLGGVGGLd',
    '.TttttPPccPPPPiiiifiPPPPPaPPPPPpLGVVVGLd',
    '.TttttPPPPPPiiPPPPfPiiiPPaaPPPPPLGVLVGLd',
    '.TttttPpPPiiPPPxPPfPPPPiiPaPPPPPLMMNMMLd',
    'TtttttffffffffffffffffffffffffffLMNHNMLd',
    'TtttttPPiiPPPPPPPPfPPPPPPiiPaPPpLMNNNMLd',
    'TtttttPPPPPPoOPPPPfPPPPPPPPPaPPPLLLLLLLd',
    'TtttttPPPPPoPPOPPPfPPPiiiPPPPPPPtttttttd',
    'TtttttpPPPPPPPPPPPfPPPPPPPPPPPpptttttttd',
    'Tttttttttttttttttttttttttttttttttttttttd',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'WWWWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwd',
    'dddddddddddddddddddddddddddddddddddddddd',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    '.Wwwd..ddk....................ddk..Wwwd.',
    '.Wwwd..ddk....................ddk..Wwwd.',
    '.Wwwd..ddk....................ddk..Wwwd.',
    '.Wwwd..ddk....................ddk..Wwwd.',
    '.Wwwd..ddk....................ddk..Wwwd.',
    '.Wwwd..............................Wwwd.',
    '.Wwwd..............................Wwwd.',
    '.Wwwd..............................Wwwd.',
    '.Wwwd..............................Wwwd.',
    '.Wwwd..............................Wwwd.',
    '.Wwwd..............................Wwwd.',
    '.sSSs..sss....................sss..sSSs.',
  ],
};

/**
 * 🐴 EL POSTE PARA ATAR EL CABALLO *(Santi: "debería estar puesto de forma vertical")*: uno solo, parado, con la soga dada
 * vuelta, así nada le tapa la cabeza al caballo cuando come.
 */
const POSTE = {
  pie: [5, 36],
  colores: { ...SOMBRA, T: 7, W: 6, w: 5, d: 4, k: 3, c: 16, C: 15, D: 14 },
  mapa: [
    '...TWw.....',
    '..TWWwd....',
    '..WWwwd....',
    '..WWwwd....',
    '..WWddd....',
    '..WWwwd....',
    '..WWwwd....',
    '..WWwwd....',
    '.cccCCCD...',
    '.ccCCCDD...',
    '.CcccCCD...',
    '..dCCDDd...',
    '..WWwwd....',
    '..WWwwd....',
    '..WdwwD....',
    '..WWwwd....',
    '..WWwwd....',
    '..WWwwd....',
    '..WWwdd....',
    '..WWwwd....',
    '..WWwwd....',
    '..WWwwd....',
    '..WdwwD....',
    '..WWwwd....',
    '..WWwwd....',
    '..WWwdd....',
    '..WWwwd....',
    '..WWwwd....',
    '..WWwwd....',
    '..WdwwD....',
    '..WWwwd....',
    '..WWwwd....',
    '..Wwwdd....',
    '..dwwdk....',
    '.ssddkkSs..',
    'sSSkkkSSss.',
    '.sSSSSSss..',
  ],
};

/** 🌾 LA COMIDA DEL CABALLO, en el piso desde el principio *(Santi: "Lo marroncito en el piso es comida")*. */
const COMIDA = {
  pie: [6, 5],
  colores: { ...SOMBRA, l: 7, h: 6, b: 5, d: 4 },
  mapa: [
    '....lh......',
    '..lhbbhl....',
    '.lhbddbhhl..',
    'lbddbbdbbdh.',
    'bddbddbddbb.',
    '.sSdSSdSdS..',
  ],
};

/** 🪵 EL TRONCO PARA SENTARSE, tirado al lado del fuego, con el corte a la vista. Pie: el medio. */
const TRONCO = {
  // 🔁 A lo largo, con la punta hacia el fondo y el corte con sus anillos hacia acá *(Santi: "poner el tronco en vertical, que
  // apunte hacia el fondo de la pantalla")*. El pie es el medio del tronco: ahí te sentás.
  pie: [8, 15],
  colores: { ...SOMBRA, L: 5, M: 4, D: 3, K: 47, c: 7, C: 6, a: 5 },
  mapa: [
    '.....MLLLLM.....',
    '...DMMLLLLMMD...',
    '..DMMLLLLLLMMD..',
    '.DMMMLLLLLMMMDK.',
    'DMMDMLLLLLMMDMDK',
    'DMMMMLLDLLMMMMDK',
    'DMDMMLLLLLMMDMDK',
    'DMMMMLLLLLMMMMDK',
    'DMMDMLLLLDMMMDDK',
    'DMMMMLLLLLMMDMDK',
    'DMDMMLLLLLMMMMDK',
    'DMMMMLLDLLMMMMDK',
    'DMMDMLLLLLMMDMDK',
    'DMMMMLLLLLMMMMDK',
    'DMDMMLLLLDMMMDDK',
    'DMMMMLLLLLMMDMDK',
    'DMMDMLLLLLMMMMDK',
    'DMMMMLLDLLMMMMDK',
    'DMMcccccccccMDDK',
    'DMcCCCCCCCCCcDDK',
    'DcCCaaaaaaaCCcDK',
    'DcCaCCCCCCCaCcDK',
    'KcCaCaaaaaCaCcKK',
    'KcCaCaCCCaCaCcKK',
    'KcCaCaaaaaCaCcKK',
    'KcCaCCCCCCCaCcKK',
    'KKcCaaaaaaaCcKKs',
    '.KKcCCCCCCCcKKss',
    '..KKcccccccKKss.',
    '...KKKKKKKKKss..',
    '...sSSSSSSSSs...',
    '.....ssssss.....',
  ],
};

/**
 * 🐎 LA MONTURA, APOYADA EN UNA PIEDRA, con su manta y el estribo colgando. 🔁 Más chica, a la medida del caballo *(Santi: "la
 * montura deberíamos achicarla para que concuerde con el tamaño del caballo y la pondría o encima de una piedra o colgada del
 * poste")*: 17 puntos, unos 85 cm. Pie: el medio de la piedra.
 */
const MONTURA = {
  pie: [13, 15],
  colores: { ...SOMBRA, L: 7, M: 6, D: 5, K: 4, N: 3, r: 10, R: 9, x: 8, c: 16, f: 3, F: 4, p: 25, q: 24, t: 23, u: 31 },
  mapa: [
    '......LLM.........MLL.....',
    '.....LMDDK.....LLMMDK.....',
    '.....MDDKKLLLLLMMMDDKN....',
    '.....NKKKNMMMMMDDDKKNN....',
    '......NNNNKKKKKKKKKNN.....',
    '.....rrrrrrrrrrrrrrrrr....',
    '.....rcccccccccccccccr....',
    '....pRRRRRRRRRRRRRRRRRq...',
    '..ppqxRRxRRRxRRRxRRRRxqt..',
    '.ppqqxxxxxxxxxxxxxxxxxqqt.',
    'ppqqqqtfFfqqqtqqqqqtqqttu.',
    'pqqtqqqfqFtqqqqqqtqqqttuu.',
    'qqqqqqtfFfqqqqtqqqqttttuu.',
    'tqqtqqqqqtqqqqqqqttttuuus.',
    'ttttttqqqtttttttttuuuuuSs.',
    '.uuuuttttuuuuuuuuuuuSSSs..',
    '..sSSuuuuSSSSSSSSSSSSss...',
    '....ssSSSSSSSSSSSSsss.....',
  ],
};

/** 🪨 UN PAR DE PIEDRAS SUELTAS. */
const PIEDRAS = {
  pie: [11, 11],
  colores: { ...SOMBRA, L: 25, M: 24, D: 23, K: 31 },
  mapa: [
    '......LLLLM...........',
    '....LLLMMMMD..........',
    '...LLMMMMMDDD.....LLM.',
    '..LMMMMMMDDDD...LLMMMD',
    '..MMMMDMMDDKK..LMMMDDK',
    '.MMMDMMMDDDKK..MMDDDDK',
    '.DMMMMDDDDKKK.DMMDDKKK',
    '.DDDMDDDDKKKK.DDDDKKKs',
    '..KDDDDKKKKSs..KKKKKSs',
    '..sKKKKKSSSs...sSSSSs.',
    '...ssSSSSss.....sss...',
    '.....ssss.............',
  ],
};

export const DIBUJOS = { rueda: RUEDA, lena: LENA, olla: OLLA, carpa: CARPA, cajon: CAJON, cartel: CARTEL, poste: POSTE, comida: COMIDA, tronco: TRONCO, montura: MONTURA, piedras: PIEDRAS };

// ─────────────────────────── PASARLOS A IMAGEN ───────────────────────────

/** De letras a índices de la paleta. Las filas pueden ser más cortas: lo que falta a la derecha, vacío. */
function aIndices(mapa, colores) {
  const al = mapa.length, an = Math.max(...mapa.map((f) => f.length));
  const ind = new Int16Array(an * al).fill(-1);
  mapa.forEach((f, j) => { for (let i = 0; i < f.length; i++) if (f[i] !== '.') ind[j * an + i] = colores[f[i]]; });
  return { ind, an, al };
}

const hechos = new Map();

/** La imagen de un dibujo con la luz de ese lugar: cada columna, con la luz del piso que tiene abajo. */
function imagen(clave, mapa, colores, pie, x, base, luz, marca = 2) {
  const k = clave;
  if (hechos.has(k)) return hechos.get(k);
  const { ind, an, al } = aIndices(mapa, colores);
  const marcas = new Uint8Array(an * al).fill(marca);
  const cv = document.createElement('canvas');
  cv.width = an; cv.height = al;
  const datos = iluminar({
    ancho: an, alto: al, indices: ind, marcas,
    campo: (i) => luz(x + (i - pie[0]) * PASO, base),
    pies: (i) => [i, 0],
  });
  cv.getContext('2d').putImageData(new ImageData(datos, an, al), 0, 0);
  const L = { img: cv, an, al };
  hechos.set(k, L);
  return L;
}

function poner(ctx, L, x, y) {
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(L.img, x, y, L.an * PASO, L.al * PASO);
  ctx.imageSmoothingEnabled = prev;
  // El contorno y los puntos finos de la gente se pintan al final de todo: lo que está delante se los tiene que tapar.
  estiloNuevo.taparGente(ctx, L.img, x, y, L.an * PASO, L.al * PASO);
}

/** Una roca o un cardón del galope, tal cual, puesto en el campamento. Su sombra no tapa el borde de la gente. */
const siluetas = {};
export function dibujarDelGalope(ctx, tipo, x, piso, dia) {
  if (tipo === 'algarrobo' && dia) sombraDeLaCopa(ctx, x, piso);
  dibujarObstaculoNuevo(ctx, { tipo, x, y: piso }, x, !dia);
  const D = OBSTACULOS[tipo];
  if (!siluetas[tipo]) {
    const { ind, an, al } = aIndices(D.mapa.map((f) => f.replace(/[sS]/g, '.')), new Proxy({}, { get: () => 1 }));
    const cv = document.createElement('canvas');
    cv.width = an; cv.height = al;
    const g = cv.getContext('2d');
    for (let j = 0; j < al; j++) for (let i = 0; i < an; i++) if (ind[j * an + i] !== -1) g.fillRect(i, j, 1, 1);
    siluetas[tipo] = { img: cv, an, al };
  }
  const S = siluetas[tipo];
  estiloNuevo.taparGente(ctx, S.img, enGrilla(x) - D.pie[0] * PASO, enGrilla(piso) - D.pie[1] * PASO, S.an * PASO, S.al * PASO);
}

/**
 * 🌳 La sombra de la copa, para adelante: el árbol quedó más atrás *(Santi: "el algarrobo está muy encimado al caballo")* y la
 * sombra tiene que seguir llegando hasta las patas *(Santi: "que le de sombra")*. Es la forma de la copa, aplastada: una cuenta.
 */
let sombraCopa = null;
const FILAS_COPA = 37, FILAS_SOMBRA = 28, SOMBRA_ARRANCA = 4;
function sombraDeLaCopa(ctx, x, piso) {
  const D = OBSTACULOS.algarrobo, an = Math.max(...D.mapa.map((f) => f.length));
  if (!sombraCopa) {
    sombraCopa = document.createElement('canvas');
    sombraCopa.width = an; sombraCopa.height = FILAS_SOMBRA;
    const g = sombraCopa.getContext('2d');
    g.fillStyle = 'rgb(' + RGB[35].join(',') + ')';
    for (let j = 0; j < FILAS_SOMBRA; j++) {
      const f = D.mapa[Math.floor((j * FILAS_COPA) / FILAS_SOMBRA)];
      // (Sólo las hojas: el tronco y las ramas dejaban una raya.)
      for (let i = 0; i < f.length; i++) if ('hgdD'.includes(f[i])) g.fillRect(i, j, 1, 1);
    }
  }
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sombraCopa, enGrilla(x) - D.pie[0] * PASO, enGrilla(piso) + SOMBRA_ARRANCA * PASO, an * PASO, FILAS_SOMBRA * PASO);
  ctx.imageSmoothingEnabled = prev;
}

/**
 * Pone uno de los dibujos con el pie en (x, piso). Cada dibujo se arma una vez por pulso de luz.
 * @param id  'carpa', 'cajon', 'cartel', 'poste', 'tronco', 'montura', 'piedras'…
 */
export function dibujarCosa(ctx, id, x, piso, dia, fuego, pulso) {
  const D = DIBUJOS[id];
  const X = enGrilla(x), Y = enGrilla(piso);
  const luz = dia ? () => 0 : (px, py) => luzDelFuego(px, py, fuego, pulso);
  const L = imagen([id, X, Y, dia ? 'd' : pulso].join('|'), D.mapa, D.colores, D.pie, X, Y, luz);
  poner(ctx, L, X - D.pie[0] * PASO, Y - D.pie[1] * PASO);
}

/** 🔥 La fogata entera: rueda, leños, llama (de noche), olla y las chispas o el humo. `t`: el tiempo, para lo que sube. */
export function dibujarFogata(ctx, x, piso, dia, fuego, cuadro, t) {
  const pulso = pulsoEn(t);
  dibujarCosa(ctx, 'rueda', x, piso, dia, fuego, pulso);
  dibujarCosa(ctx, 'lena', x, piso + 2 * PASO, dia, fuego, pulso);
  const X = enGrilla(x), Y = enGrilla(piso);
  if (!dia) {
    const c = LLAMA.cuadros[cuadro];
    const L = imagen('llama|' + cuadro, c, LLAMA.colores, LLAMA.pie, 0, 0, () => 0, 1);
    poner(ctx, L, X - LLAMA.pie[0] * PASO, Y + 2 * PASO - L.al * PASO);
  }
  dibujarCosa(ctx, 'olla', x, piso + 7 * PASO, dia, fuego, pulso);
  // Lo que sube: de noche, chispas; de día, un hilo de humo. Cada una con su hora, así no suben todas juntas.
  const puntos = dia ? 9 : 6;
  for (let i = 0; i < puntos; i++) {
    const vida = (t * (dia ? 0.3 : 0.55) + i * 0.618) % 1;
    const alto = Math.floor(vida * (dia ? 46 : 40));
    const ladeo = Math.round(Math.sin(vida * 7 + i * 2.1) * (dia ? 2 + vida * 3 : 3));
    const px = X + ladeo * PASO, py = Y - (30 + alto) * PASO;
    const c = dia ? (vida < 0.5 ? 24 : 25) : (vida < 0.4 ? 29 : vida < 0.75 ? 45 : 44);
    if (!dia && vida > 0.92) continue;
    ctx.fillStyle = `rgb(${RGB[c].join(',')})`;
    const lado = dia && vida > 0.35 ? 2 : 1;
    ctx.fillRect(px, py, lado * PASO, lado * PASO);
  }
}

/**
 * 🐴 LO QUE HACE EL CABALLO ATADO: quieto un rato, baja la cabeza, come, la levanta y vuelta a empezar. Sale del reloj de la
 * escena. Devuelve qué dibujo y qué cuadro toca.
 */
const VUELTAS_QUIETO = 4, VUELTAS_COMER = 4, CUADRO = 0.2, CUADRO_SUBIR = 0.15;
function queHaceElCaballo(t) {
  const quieto = CABALLO.QUIETO.length * CUADRO * VUELTAS_QUIETO;
  const baja = CABALLO.BAJAR.length * CUADRO;
  const come = CABALLO.COMER.length * CUADRO * VUELTAS_COMER;
  const sube = CABALLO.BAJAR.length * CUADRO_SUBIR;
  let v = t % (quieto + baja + come + sube);
  if (v < quieto) return ['QUIETO', Math.floor(v / CUADRO) % CABALLO.QUIETO.length];
  v -= quieto;
  if (v < baja) return ['BAJAR', Math.min(5, Math.floor(v / CUADRO))];
  v -= baja;
  if (v < come) return ['COMER', Math.floor(v / CUADRO) % CABALLO.COMER.length];
  v -= come;
  return ['BAJAR', Math.max(0, 5 - Math.floor(v / CUADRO_SUBIR))];
}

const { MEDIO, FILA_PISO, COMIDA_COL, QUIJADA } = CABALLO;
/** A cuántas unidades del medio del caballo está el poste. */
const POSTE_DESDE_CABALLO = 27;

/** El caballo con su comida, el poste y la soga. `x`: el medio del caballo; `pelaje`: 'criollo' o 'mustang'. */
export function dibujarCaballoAtado(ctx, x, piso, dia, fuego, t, pelaje) {
  const [nombre, n] = queHaceElCaballo(t);
  const X = enGrilla(x), Y = enGrilla(piso);
  const pulso = pulsoEn(t);
  dibujarCosa(ctx, 'comida', X + (COMIDA_COL - MEDIO) * PASO, Y, dia, fuego, pulso);
  // (🔁 Los mismos colores que en el galope, también de noche *(Santi: "el color del caballo debería coincidir con el del galope
  //  y el resto del juego")*.)
  const pelos = dia ? PELOS : PELOS_NOCHE;
  const colores = pelos[pelaje] || pelos.criollo;
  const luz = () => 0;
  const L = imagen(['caballo', nombre, n, pelaje, dia ? 'd' : 'n', X, Y].join('|'), CABALLO[nombre][n], colores, [MEDIO, FILA_PISO], X, Y, luz);
  poner(ctx, L, X - MEDIO * PASO, Y - FILA_PISO * PASO);

  const xPoste = X + POSTE_DESDE_CABALLO;
  dibujarCosa(ctx, 'poste', xPoste, Y, dia, fuego, pulso);
  // La soga, de la vuelta del poste a la quijada, con un poco de panza. Es una cuenta, no un dibujo.
  const [qx, qy] = nombre === 'QUIETO' ? QUIJADA[0] : nombre === 'COMER' ? QUIJADA[5] : QUIJADA[n];
  const ax = X + (qx - MEDIO) * PASO, ay = Y + (qy - FILA_PISO) * PASO;
  const bx = enGrilla(xPoste), by = Y - 26 * PASO;
  // (Va en la capa fina, como las riendas de los jinetes: en la grilla de 3×3 los puntos de 2 píxeles se perdían.)
  const puntos = [];
  const pasos = Math.ceil(Math.hypot(bx - ax, by - ay) / 0.5);
  for (let i = 0; i <= pasos; i++) {
    const k = i / pasos, panza = Math.sin(Math.PI * k) * 5;
    puntos.push(ax + (bx - ax) * k, ay + (by - ay) * k + panza);
  }
  estiloNuevo.pintarFinos(ctx, puntos, 0.5, PALETA[dia ? 14 : 2]);
}

/** La sombrita de los pies, en puntos: de día un tono más oscuro que la arena; de noche, según la luz que haya. */
export function dibujarSombraDePies(ctx, x, piso, luz) {
  const c = RGB[sombrear(35, Math.round(luz))];
  ctx.fillStyle = `rgb(${c.join(',')})`;
  const X = enGrilla(x), Y = enGrilla(piso);
  ctx.fillRect(X - 5 * PASO, Y - PASO, 11 * PASO, PASO);
  ctx.fillRect(X - 7 * PASO, Y, 15 * PASO, PASO);
  ctx.fillRect(X - 5 * PASO, Y + PASO, 11 * PASO, PASO);
}
