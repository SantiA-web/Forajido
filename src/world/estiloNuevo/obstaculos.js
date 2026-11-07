/**
 * 🌵 LOS OBSTÁCULOS DE LA CABALGATA, EN EL ESTILO NUEVO: la roca, el arbusto, el cactus y el montículo.
 *
 * *(Santi eligió "los 4, grandes y con volumen")*. Eran rectángulos del dibujo viejo, chiquitos al lado del caballo.
 * Ahora cada uno es un mapa dibujado a mano en la grilla, del ancho de su choque (`obstaculoRadios`, data/horse.js:
 * lo que ves es lo que te frena) y del alto real al lado del caballo (la gente mide 30 puntos, 1,7 m):
 *
 *  - LA ROCA (27 puntos, 1,5 m): una piedra grande con otra más chica apoyada. La tapa agarra el sol, el frente —el que
 *    da a la cámara— queda en sombra, con sus grietas, y la sombra cae para acá y a la izquierda.
 *  - EL ARBUSTO (24): una mata de jarilla grande, las copas claras arriba y las ramas secas asomando al pie.
 *  - EL CACTUS (21, 2,5 m de alto): un cardón, con tres brazos que salen bajos y suben derechos, redondo (la luz en el
 *    costado de la derecha). 🔁 Primero fue un saguaro: el cardón es más nuestro y no es el de todos los westerns.
 *  - EL MONTÍCULO (16): un lomo de arena clara, bajo, con la cresta al sol. El más perdonador, y se lee así.
 *
 * El sol viene de allá y un poco de la derecha, como en el resto del afuera. De noche, el mismo dibujo con los
 * escalones de luz del suelo. Golpeados (cuando los chocás ya no frenan, y por eso no pueden seguir parados): la roca
 * queda en pedazos, el arbusto aplastado, el cactus tumbado y el montículo desparramado.
 */
import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar } from '../../engine/luz.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;

/** Los colores de las letras (índices de la paleta). */
const COLOR = {
  // La piedra: la tapa al sol, el costado, el frente en sombra y las grietas.
  L: 25, l: 24, M: 23, K: 31,
  // Los verdes, de oscuro a claro, y las ramas secas.
  D: 42, d: 26, g: 27, h: 43, t: 33,
  // La arena: la cresta, el lomo y la ladera.
  W: 38, F: 37, f: 36,
  // La sombra en la tierra.
  s: 34, S: 33,
};

/** Cada obstáculo: su mapa parado, su mapa golpeado y dónde tiene el pie (columna, fila) en cada uno. */
export const OBSTACULOS = {
  roca: {
    pie: [13, 17],
    mapa: [
      '..........LLLL.............',
      '.......LLLLLLLLL...........',
      '.....LLLLLLLLLLLLL.........',
      '...lLLLLLLLLLLLLLLL........',
      '..llLLLLLLLLLLLLLLLl.......',
      '..lllLLLLLLLLLLLLLll.......',
      '.lllllLLLLLLLLLLLlll..LLL..',
      '.MlllllllLLLLLlllllM.LLLLL.',
      '.MMlllllllllllllllMMLLLLLLL',
      'MMMMMllllllllllllMMMlllLLLl',
      'MMMMMMMMlllllllMMMMMlllllll',
      'MMMKMMMMMMMMMMMMMMMMMlllllM',
      'MMMKKMMMMMMMMMMMKMMMMMMlMMM',
      'KMMMKMMMMMMMMMMMKKMMMMMMMMM',
      'KMMMMKMMMMMMMMMMMKMMMMMMMMK',
      'KKMMMMMMMMMMMMMMMMMMKMMMMKK',
      'SKKMMMMMMMMMMMMMMMMMKKMMKKs',
      'SSKKKKKMMMMMMMMMMMKKKKKKKss',
      'SSSSSKKKKKKKKKKKKKKKSSSsss.',
      '.SSSSSSSSSSSSSSSSSSSSsss...',
      '..ssssssssssssssssss.......',
    ],
    golpeadoPie: [10, 3],
    golpeado: [
      '...LL.......ll.....LL.',
      '..lMMM.....lMM....lMMK',
      '.SsMKK..L..SMK..SsKKK.',
      'SSsss..lMs..ss.SSss...',
      '.......sss............',
    ],
  },
  arbusto: {
    pie: [12, 13],
    mapa: [
      '.........h..h...........',
      '.....h..hgh.hgh..h......',
      '....hgh.hgghgggh.hgh....',
      '...hgghhgggggggghgggh...',
      '..hgggggggggdggggggghh..',
      '.hggggdgggggggggdgggghh.',
      '.ggggggggdgggggggggghgg.',
      'hgggdgggggggggdggggghggh',
      'gggggggdggggggggggggdggg',
      '.ddgggggggddgggggggggdd.',
      '.dddddgggdddddggggddddd.',
      '..dddddddddddddddddddd..',
      '...dDdddDdddddDddddDd...',
      '....D.ttD.tt.tD.tt.D....',
      '..sssDsttsssstDsstsDsss.',
      '.sssssssssssssssssssss..',
    ],
    golpeadoPie: [10, 2],
    golpeado: [
      '...h..g..hg.g.h.......',
      '.hgdgDdgdDgddghg.h....',
      'sDtDtgDttDdtDgtDhgd...',
      'ssssssssssssssssssss..',
    ],
  },
  // 🔁 EL CARDÓN *(Santi eligió "cerros de colores", que trae los cardones en vez de los saguaros)*: el tronco y tres
  // brazos que salen bajos y suben derechos casi hasta arriba, como un candelabro. Es el mismo ancho del choque.
  cactus: {
    pie: [10, 39],
    mapa: [
      '.........dgh.........',
      '........Ddghg........',
      '........Ddghg........',
      '........Ddghg..dgh...',
      '........Ddghg.Ddgh...',
      '........Ddghg.Ddgh...',
      '..dgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh...',
      '.Ddgh...Ddghg.Ddgh.dh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...Ddghg.DdghDdh',
      '.Ddgh...DdghghhhghDdh',
      '.Ddgh...DdghgggggDdh.',
      '.Ddgh...Ddghgdddd.Ddh',
      '.Ddgh...Ddghg.....Ddh',
      '.DdghhhhDdghg.....Ddh',
      '.DgggggggDdghg....Ddh',
      '..ddddddDdghghhhhhgdh',
      '........Ddghgggggggd.',
      '........Ddghgddddddd.',
      '........Ddghg........',
      '........Ddghg........',
      '........Ddghg........',
      '.....ssDDdghggss.....',
      '...ssssssssssss......',
      '..sssssssss..........',
    ],
    golpeadoPie: [27, 5],
    golpeado: [
      '....dgh.......................',
      '....Dgh.......................',
      '.hhhhhhhhhhhhhhhhhhhhhhh..Ddg.',
      'hggggggggggggggggggggggghhDdgh',
      'ggdgggdgggdgggdgggdgggdggDddg.',
      'ddddddddddddddddddddddddd.DDd.',
      '.ssssssssssssssssssssssssssss.',
    ],
  },
  monticulo: {
    pie: [8, 6],
    mapa: [
      '.....fFFFf......',
      '...fFFWWFFFf....',
      '..fFFWWWFFFFf...',
      '.fFFFFFFFFFFFf..',
      'fffFFFFFFFFffff.',
      'ffffffffffffffff',
      '.sffffffffffffs.',
      '..ssssssssssss..',
    ],
    golpeadoPie: [7, 1],
    golpeado: [
      '..fFFFFFFFFf....',
      'ffffffffffffff..',
      '.ssssssssssss...',
    ],
  },
};

const guardados = new Map();
function lienzo(tipo, golpeado, luz) {
  const clave = tipo + '|' + (golpeado ? 1 : 0) + '|' + luz;
  if (guardados.has(clave)) return guardados.get(clave);
  const O = OBSTACULOS[tipo], mapa = golpeado ? O.golpeado : O.mapa;
  const an = Math.max(...mapa.map((f) => f.length)), al = mapa.length;
  const indices = new Int16Array(an * al).fill(-1);
  mapa.forEach((fila, j) => {
    for (let i = 0; i < fila.length; i++) if (fila[i] !== '.') indices[j * an + i] = COLOR[fila[i]];
  });
  const cv = document.createElement('canvas');
  cv.width = an; cv.height = al;
  cv.getContext('2d').putImageData(new ImageData(iluminar({ ancho: an, alto: al, indices, campo: () => luz }), an, al), 0, 0);
  const g = { img: cv, pie: golpeado ? O.golpeadoPie : O.pie, an, al };
  guardados.set(clave, g);
  return g;
}

/** ¿Este tipo tiene su dibujo nuevo? (La aguja y el mojón son de la huida, que sigue en el dibujo viejo.) */
export const tieneObstaculoNuevo = (tipo) => !!OBSTACULOS[tipo];

/**
 * Dibuja el obstáculo con el pie en (`ox`, `ob.y`), en el mundo (`ctx` con la cámara puesta). Se apoya en un punto
 * entero de la grilla, como el suelo con el que corre.
 */
export function dibujarObstaculoNuevo(ctx, ob, ox, noche) {
  const L = lienzo(ob.tipo, ob.golpeado, noche ? CONFIG.tresCuartos.sueloNoche : 0);
  const x = Math.round(ox / PASO) * PASO - L.pie[0] * PASO, y = Math.round(ob.y / PASO) * PASO - L.pie[1] * PASO;
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(L.img, x, y, L.an * PASO, L.al * PASO);
  ctx.imageSmoothingEnabled = prev;
}
