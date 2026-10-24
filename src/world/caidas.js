/**
 * 🧳 LO QUE SE CAE Y LO QUE SALE POR EL PASILLO EN LOS GOLPES DEL TREN (fase 4 de "LOS ENGANCHES", ver NOTAS-DISENO.md)
 * *(Santi: "las cosas no caigan de la nada sino que sea mucho más realista… repisas en las paredes con valijas y que
 * esas sean las que caen: si el tren acelera se va hacia atrás, si frena caen hacia adelante")*.
 *
 * DOS CLASES DE COSAS, y todo se ve antes:
 *  - DESDE ARRIBA (`objetos`): lo que está en una repisa. Cae en el lugar, justo debajo, corrido un poco para el lado
 *    del golpe. Al que esté ahí: liviano, la mitad de la vida; pesado, lo mata *("mínimo que te saque la mitad")*.
 *  - POR EL PASILLO (`pilas`): las pilas de equipaje junto a las puertas. Lo de arriba de la pila sale deslizándose
 *    por el pasillo (lo mueve scenes/raidScene.js, como rodante); el baúl de abajo, que pesa, se queda.
 *
 * CUÁNDO: el frenazo (`sentido` -1: lo de la repisa se corre hacia la locomotora, y sale la pila de la puerta de
 * atrás) y el arrancón (+1: hacia la cola, la pila de la puerta de adelante). Con los tirones comunes, no.
 *
 * SE GASTA: cada cosa cae una sola vez, y queda tirada donde cayó. En cada golpe se cae una parte (`CONFIG.caidas.cae`).
 *
 * SE LEE: en el aviso, lo que va a caer se tambalea y se corre al borde, y en el piso crece su sombra, justo donde va a
 * caer (`zonas`, que también leen los guardias para salirse).
 *
 * Hechos: el de pasajeros (portaequipajes), primera clase (las botellas de la barra, las arañas del techo y un baúl
 * grande en el rincón de cada puerta) y el correo (las sacas de los casilleros, el cajón chico de cada pila de
 * encomiendas y los carros de las puntas). Los demás, de a uno: ver el plan en las notas.
 */
import { CONFIG } from '../data/config.js';
import { PALETA, sombrear } from '../engine/paleta.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';
import { aceleracionEn } from './enganches.js';

const PASO = () => CONFIG.estilo.punto / 4;

/** Un número de 0 a 1 que depende sólo de los dos que le pasás (para que cada vagón salga siempre igual). */
const azar = (a, b) => ((((a * 73856093) ^ (b * 19349663)) >>> 0) % 1000) / 1000;

/**
 * LO QUE PUEDE IR EN UNA REPISA DEL VAGÓN DE PASAJEROS. `hw`: medio ancho en el mundo (para el golpe); `peso`.
 * El baúl, de vez en cuando (uno cada tantas repisas): pesa, y mata.
 */
const COSAS = {
  valija: { hw: 7, peso: 'liviano' },
  sombrerera: { hw: 5, peso: 'liviano' },
  canasta: { hw: 5, peso: 'liviano' },
  baul: { hw: 7, peso: 'pesado' },
};

/** Arma lo de todo el tren: las repisas y las pilas de cada vagón que ya las tiene. */
export function crearCaidas(train) {
  const C = { objetos: [], pilas: [], impactos: [], sueltos: [], papeles: [] };
  const map = train.map, S = map.size, tc = CONFIG.tresCuartos;
  for (const w of train.wagons) {
    if (w.id === 'primeraClase') { primeraClase(C, train, w); continue; }
    if (w.id === 'correo') { correo(C, train, w); continue; }
    if (w.id !== 'pasajeros') continue;
    const cols = Math.round(w.width / S);
    const casilla = (c, f) => (map.grid[f] || [])[w.colStart + c];
    // LOS PORTAEQUIPAJES: en cada tramo liso de la pared del fondo, entre dos ventanas.
    const ventanas = [];
    for (let c = 0; c < cols; c++) {
      if (casilla(c, 0) !== 'W' || casilla(c - 1, 0) === 'W') continue;
      let d = c; while (casilla(d + 1, 0) === 'W') d++;
      ventanas.push([c, d]);
    }
    let filasArriba = 0; while (casilla(Math.floor(cols / 2), filasArriba) === '#' || casilla(Math.floor(cols / 2), filasArriba) === 'W') filasArriba++;
    const yPiso = filasArriba * S;
    // La repisa, en la pared: a esta altura (en el mundo) apoya lo que lleva (ver `REPISA` en world/estiloNuevo/vagones.js).
    const yRepisa = -tc.alturaPared + CONFIG.caidas.repisaPuntos * PASO();
    // Los faroles de la pared (los mismos de world/estiloNuevo/vagones.js): lo de la repisa les deja lugar.
    const F = CONFIG.tresCuartos.faroles, cuantos = Math.max(1, Math.floor((cols - 2) / F.cadaColumnas));
    const sobra = cols - cuantos * F.cadaColumnas, faroles = [];
    for (let q = 0; q < cuantos; q++) {
      let c = Math.round(sobra / 2 + (q + 0.5) * F.cadaColumnas);
      for (let d = 0; d < 4 && casilla(c, 0) === 'W'; d++) c += (d % 2 ? -(d + 1) : d + 1);
      faroles.push(w.x + (c + 0.5) * S);
    }
    for (let k = 0; k + 1 < ventanas.length; k++) {
      const x0 = w.x + (ventanas[k][1] + 1) * S, x1 = w.x + ventanas[k + 1][0] * S;
      // Dos lugares por repisa: los más lejos del farol, si hay uno en esta pared.
      const lugares = [0.22, 0.5, 0.78].map((t) => x0 + (x1 - x0) * t)
        .map((x) => ({ x, lejos: Math.min(99, ...faroles.map((fx) => Math.abs(fx - x))) }))
        .filter((l) => l.lejos >= 12).sort((p, q) => q.lejos - p.lejos).slice(0, 2).sort((p, q) => p.x - q.x);
      for (let q = 0; q < lugares.length; q++) {
        const h = azar(w.colStart + k * 7, q);
        const tipo = h < 0.12 ? 'baul' : h < 0.55 ? 'valija' : h < 0.8 ? 'sombrerera' : 'canasta';
        const x = lugares[q].x;
        C.objetos.push({
          tipo, ...COSAS[tipo], x, xRepisa: x, yRepisa, yPared: yPiso, yPiso: yPiso + 6 + Math.round(azar(k, q + 3) * 10),
          variante: Math.floor(azar(q, k + w.colStart) * 3),
          estado: 'repisa', t: 0, dir: 0, wagon: w.id,
        });
      }
    }
    // LAS PILAS JUNTO A LAS PUERTAS: las casillas 'L' del plano (data/wagons.js).
    for (let f = filasArriba; f < map.rows; f++) for (let c = 0; c < cols; c++) {
      if (casilla(c, f) !== 'L' || casilla(c, f - 1) === 'L') continue;
      let f2 = f; while (casilla(c, f2 + 1) === 'L') f2++;
      const atras = c < cols / 2;   // la de la puerta de atrás (la cola): sale cuando frena
      C.pilas.push({
        x: w.x + (c + 0.5) * S, yTope: f * S, yBase: (f2 + 1) * S, atras,
        // Lo que sale: dos valijas encima del baúl.
        arriba: [{ variante: Math.floor(azar(c, f) * 3) }, { variante: Math.floor(azar(f, c + 1) * 3) }],
        estado: 'quieta', t: 0, wagon: w.id,
      });
    }
  }
  return C;
}

/**
 * 🥃 PRIMERA CLASE *(Santi eligió "botellas y arañas" y "uno grande por puerta": en la pared baja, entre ventanas con
 * cortinas y faroles, no entran repisas, y los ricos no viajan con el equipaje encima)*:
 *  - LAS BOTELLAS DEL ESTANTE DE LA BARRA, en tres tramos (livianas): caen detrás de la barra, sobre el bartender o
 *    sobre quien se esconda ahí, y dejan vidrios y un charco de licor. El estante queda vacío.
 *  - DOS ARAÑAS DE BRONCE colgadas sobre la alfombra del pasillo (pesadas: matan): lo único que te alcanza parado en
 *    el medio. Se hamacan con el tren; caen menos seguido (`prob`).
 *  - UN BAÚL GRANDE EN EL RINCÓN DE CADA PUERTA, fuera del paso: choca del tamaño del baúl (`bloqueaCaida`), y en el
 *    golpe sale deslizándose por el pasillo (frena: el de la puerta de atrás; acelera: el de adelante) y deja el lugar.
 * Lo que queda tirado de las botellas y las arañas no se desliza ni se rompe más (`fijo`): ya está roto.
 */
function primeraClase(C, train, w) {
  const map = train.map, S = map.size, tc = CONFIG.tresCuartos, P = PASO();
  const cols = Math.round(w.width / S);
  const casilla = (c, f) => (map.grid[f] || [])[w.colStart + c];
  let filasArriba = 0; while (casilla(Math.floor(cols / 2), filasArriba) === '#' || casilla(Math.floor(cols / 2), filasArriba) === 'W') filasArriba++;
  const yPared = filasArriba * S, x0 = Math.floor(w.x / P) * P, yArr = -tc.alturaPared, yCara = 8;
  // Las botellas: el estante está sobre los primeros 'T' de la barra (como en world/estiloNuevo/vagones.js).
  let b0 = -1, b1 = -1;
  for (let c = 0; c < cols; c++) if (casilla(c, filasArriba + 2) === 'T') { if (b0 < 0) b0 = c; b1 = c; }
  b1 -= 1;
  if (b0 >= 0) {
    const ex = Math.round((w.x + b0 * S - x0) / P) + 2, ex1 = Math.round((w.x + (b1 + 1) * S - x0) / P) - 2;
    for (let k = 0; k < 3; k++) {
      const a = ex + Math.floor(((ex1 - ex) * k) / 3), b = ex + Math.floor(((ex1 - ex) * (k + 1)) / 3);
      const x = x0 + ((a + b) / 2) * P;
      C.objetos.push({
        tipo: 'botellas', peso: 'liviano', hw: ((b - a) * P) / 2, x, xRepisa: x, yRepisa: yArr + (yCara + 27) * P,
        yPared, yPiso: yPared + 14, pa: a, pb: b, x0, yArr, filas: [yCara + 14, yCara + 27], ex,
        estado: 'repisa', t: 0, dir: 0, fijo: true, wagon: w.id,
      });
    }
  }
  // Las arañas, sobre la alfombra, en los huecos entre las mesitas de arriba más cerca de un tercio y de dos tercios
  // del vagón (🔁 colgadas encima de una mesita parecían un candelabro apoyado en ella).
  const yPasillo = 5 * S, fila = filasArriba + 1, huecos = [];
  for (let c = 1; c < cols - 3; c++) {
    if (casilla(c - 1, fila) !== 'N' || casilla(c, fila) !== '.') continue;
    let d = c; while (casilla(d + 1, fila) === '.') d++;
    if (d - c >= 2 && casilla(d + 1, fila) === 'S') huecos.push(w.x + ((c + d + 1) / 2) * S);
  }
  const lugares = huecos.length >= 2
    ? [1 / 3, 2 / 3].map((t) => huecos.reduce((m, h) => (Math.abs(h - (w.x + w.width * t)) < Math.abs(m - (w.x + w.width * t)) ? h : m)))
    : [w.x + w.width / 3, w.x + (2 * w.width) / 3];
  for (const x of lugares) {
    C.objetos.push({
      tipo: 'arana', peso: 'pesado', hw: 12, x, xRepisa: x, yRepisa: yPasillo - CONFIG.caidas.alturaArana, yPared,
      yPiso: yPasillo, zonaY: [12, 10], prob: 0.6, estado: 'repisa', t: 0, dir: 0, fijo: true, wagon: w.id,
    });
  }
  // Los baúles: el de la puerta de atrás, en el rincón de abajo; el de adelante, en el de arriba.
  // (🔁 Pegados a la pared de la punta, la de la puerta *(Santi: "hoy los veo muy al medio")*: antes iban una
  // columna más adentro.)
  const pegado = CONFIG.tresCuartos.paredPunta + 11 + 1;
  for (const [c, f, atras, x] of [[1, 6, true, w.x + pegado], [cols - 2, 3, false, w.x + w.width - pegado]]) {
    if (casilla(c, f) !== '.' || casilla(atras ? c + 1 : c - 1, f) !== '.') continue;
    C.pilas.push({
      tipo: 'baul', x, yTope: f * S + 2, yBase: (f + 1) * S - 2, hw: 11, hh: 5, atras,
      arriba: [], estado: 'quieta', t: 0, wagon: w.id,
    });
  }
}

/** ¿Choca acá un baúl de los que esperan junto a las puertas? (Para `isSolidForMovementAt` de la escena.) */
export function bloqueaCaida(C, x, y) {
  for (const p of C.pilas) {
    if ((p.tipo !== 'baul' && p.tipo !== 'carro') || p.estado === 'suelto') continue;
    if (Math.abs(x - p.x) < p.hw && Math.abs(y - (p.yTope + p.yBase) / 2) < p.hh) return true;
  }
  return false;
}

/**
 * EL AVISO DE UN GOLPE (`sentido`: -1 frena, +1 acelera). Elige qué se va a caer de las repisas (una parte de lo que
 * queda) y qué pila se va a soltar.
 */
export function avisarCaidas(C, sentido, rng) {
  const K = CONFIG.caidas;
  for (const o of C.objetos) {
    if (o.estado !== 'repisa' || !rng.chance(K.cae * (o.prob ?? 1))) continue;
    o.estado = 'aviso'; o.t = 0; o.dir = -sentido;
    /**
     * 🔁 CADA UNA A SU MANERA *(Santi: "caen de forma muy estructurada… parece intencional: caen a la vez y caen de
     * igual manera… hay que cambiar esto para que se vea más espontáneo")*: se larga un poco después del golpe
     * (`demora`), tarda lo suyo en llegar (`dura`), se corre más o menos (`correA`) y cae un poco más acá o más allá
     * (`yPiso`). Se sortea en el aviso: la sombra y lo que leen los guardias ya son los de esa caída.
     */
    if (o.tipo !== 'botellas') {
      o.yPiso0 = o.yPiso0 ?? o.yPiso;
      o.demora = rng.range(0, K.demoraMax) * (o.tipo === 'arana' ? 0.4 : 1);
      o.dura = K.caeDura * rng.range(0.8, 1.3);
      o.correA = (o.corre ?? K.corre) * (o.corre ? rng.range(0.8, 1.2) : rng.range(0.3, 1.8));
      o.yPiso = o.fijo ? o.yPiso0 : o.yPiso0 + rng.range(-4, 4);
    }
  }
  for (const p of C.pilas) {
    if (p.estado !== 'quieta' || (!p.arriba.length && p.tipo !== 'baul' && p.tipo !== 'carro')) continue;
    if (p.atras === (sentido < 0)) { p.estado = 'aviso'; p.t = 0; }
  }
}

/** EL GOLPE: lo avisado se cae, y las pilas avisadas largan lo de arriba (en `C.sueltos`, para la escena). */
export function golpearCaidas(C) {
  // (Cada uno arranca a su tiempo: hasta que el reloj llega a cero sigue en su lugar, tambaleándose.)
  for (const o of C.objetos) if (o.estado === 'aviso') { o.estado = 'cae'; o.t = -(o.demora || 0); }
  for (const p of C.pilas) {
    if (p.estado !== 'aviso') continue;
    const dir = p.atras ? 1 : -1;
    // El baúl grande sale él mismo, y deja el rincón libre.
    if (p.tipo === 'baul') {
      p.estado = 'suelto';
      C.sueltos.push({ x: p.x + dir * 2, y: (p.yTope + p.yBase) / 2, dir, variante: 3, demora: 0, mueble: true, hw: 11, hh: 5, vida: 3, lento: 0.8 });
      continue;
    }
    // 🛒 El carro de correo sale rodando él mismo, y deja su lugar.
    if (p.tipo === 'carro') {
      p.estado = 'suelto';
      // (Aguanta cinco tiros *(Santi: "haría que los carritos tengan hasta 5 de vida")*.)
      C.sueltos.push({ x: p.x + dir * 2, y: (p.yTope + p.yBase) / 2, dir, variante: 4, demora: 0, mueble: true, hw: p.hw, hh: 6, vida: 5, lento: 0.9, ancho: p.ancho, hondo: p.hondo });
      continue;
    }
    p.estado = 'quieta';
    p.arriba.forEach((v, i) => C.sueltos.push({ x: p.x + dir * (6 + i * 10), y: (p.yTope + p.yBase) / 2, dir, variante: v.variante, demora: i * 0.12 }));
    p.arriba = [];
  }
}

/**
 * 🧳 UN SACUDÓN MUEVE LO TIRADO *(Santi: "que pase a formar parte del suelo (para no molestar) pero que estando en el
 * suelo se mueva con el movimiento del tren")*: no choca con nadie, pero se desliza para el lado contrario al tirón
 * (frena: hacia la locomotora) y se para contra lo que tenga delante. `golpe`: 'frenazo', 'arrancon' o 'tiron'.
 */
export function empujarCaidas(C, sentido, golpe) {
  const v = CONFIG.caidas.empujon[golpe] || 0;
  for (const o of C.objetos) if (o.estado === 'piso' && !o.fijo) o.vx = -sentido * v * (0.8 + 0.4 * azar(Math.round(o.xRepisa), Math.round(o.x)));
}

/** El cuerpo de lo tirado, para las balas (pegado al piso, del ancho de lo que es). */
const cuerpo = (o) => ({ x: o.x, y: o.yPiso - 3, hw: o.hw, hh: 3 });

/**
 * 🧳 UNA BALA QUE PASA POR ENCIMA DE ALGO TIRADO LE PEGA Y LO ROMPE *(Santi: "si un disparo o dinamita va ahí que le
 * pegue y lo rompa")*. Cualquier bala, tuya o de un guardia: es una cosa en el piso, no un problema que el juego te
 * pone a vos. Devuelve lo que rompió (o null).
 */
export function romperConBala(C, x, y) {
  for (const o of C.objetos) {
    if (o.estado !== 'piso' || o.fijo) continue;
    const b = cuerpo(o);
    if (Math.abs(x - b.x) <= b.hw && Math.abs(y - b.y) <= b.hh) { o.estado = 'roto'; o.vx = 0; return o; }
  }
  return null;
}

/** Y la dinamita, todo lo tirado que agarre la onda. Devuelve cuántas cosas rompió. */
export function romperEnRadio(C, x, y, radio) {
  let n = 0;
  for (const o of C.objetos) {
    if (o.estado !== 'piso' || o.fijo || Math.hypot(o.x - x, o.yPiso - 3 - y) > radio) continue;
    o.estado = 'roto'; o.vx = 0; n++;
  }
  return n;
}

/** Avanza las caídas. Cuando algo llega al piso deja un impacto en `C.impactos` (la escena hace el daño). */
export function actualizarCaidas(C, dt, map) {
  const K = CONFIG.caidas;
  for (const o of C.objetos) {
    if (o.estado === 'aviso') o.t += dt;
    if (o.estado !== 'cae') continue;
    o.t += dt;
    // 🥃 Las botellas caen escalonadas (`botellasDemora`): pegan cuando llegan las primeras, y el tramo queda en el
    // piso cuando llegó la última.
    if (o.tipo === 'botellas') {
      if (!o.pego && o.t >= K.caeDura) { o.pego = true; C.impactos.push({ ...zonaDe(o), peso: o.peso, x: o.x, y: o.yPiso, tipo: o.tipo }); }
      if (o.t >= K.caeDura + K.botellasDemora) o.estado = 'piso';
      continue;
    }
    if (o.t >= (o.dura || K.caeDura)) {
      o.estado = 'piso';
      o.x = o.xRepisa + o.dir * (o.correA ?? o.corre ?? K.corre);
      C.impactos.push({ ...zonaDe(o), peso: o.peso, x: o.x, y: o.yPiso, tipo: o.tipo });
      // 🐛 Si cayó sobre un asiento, rebota al piso (lo que cae en su lugar, como las botellas o la araña, no): al hueco libre más cercano (primero para el lado del golpe). Arriba
      // del asiento lo tapaba el respaldo, y en el piso se ordena con la gente por donde apoya.
      if (map && !o.fijo) for (let d = 0; d <= 24; d += 2) {
        const libre = [o.x + o.dir * d, o.x - o.dir * d].find((x) => !map.isSolidAt(x - o.hw, o.yPiso - 3) && !map.isSolidAt(x + o.hw, o.yPiso - 3));
        if (libre !== undefined) { o.x = libre; break; }
      }
    }
  }
  for (const p of C.pilas) if (p.estado === 'aviso') p.t += dt;
  // Lo tirado que un sacudón empujó: se desliza y el piso lo va frenando; contra un asiento, se para.
  const roce = CONFIG.caidas.roceSuelo;
  for (const o of C.objetos) {
    if (o.estado !== 'piso' || !o.vx) continue;
    const dx = o.vx * dt, s = Math.sign(o.vx);
    if (map && map.isSolidAt(o.x + dx + s * o.hw, o.yPiso - 3)) o.vx = 0;
    else o.x += dx;
    const v = Math.abs(o.vx) - roce * dt;
    o.vx = v > 0 ? s * v : 0;
  }
}

/** Donde pega (en el mundo): debajo de la repisa, corrido para el lado del golpe. */
function zonaDe(o) {
  const K = CONFIG.caidas, x = o.xRepisa + o.dir * (o.correA ?? o.corre ?? K.corre);
  const [arriba, abajo] = o.zonaY || [K.alcance, 4];
  return { x0: x - o.hw - 2, x1: x + o.hw + 2, y0: o.yPiso - arriba, y1: o.yPiso + abajo };
}

/**
 * LAS ZONAS DE PELIGRO de lo que está por pasar (para los guardias): donde va a caer algo, y el pasillo por donde va
 * a salir lo de una pila. `sentido` de la pila: para dónde sale.
 */
export function zonasDePeligro(C, S) {
  const z = [];
  for (const o of C.objetos) if (o.estado === 'aviso' || o.estado === 'cae') z.push(zonaDe(o));
  for (const p of C.pilas) {
    if (p.estado !== 'aviso') continue;
    const dir = p.atras ? 1 : -1, largo = CONFIG.caidas.pasilloLargo;
    z.push({ x0: dir > 0 ? p.x : p.x - largo, x1: dir > 0 ? p.x + largo : p.x, y0: 4 * S - 2, y1: 6 * S + 2, pasillo: true });
  }
  return z;
}

// --------------------------------------------------------------------------------------------------------- dibujo

/** El pintor de cada cosa: puntos de la paleta, a la luz del lugar (como la gente). */
function pintor(ctx, ox, oy, luz) {
  const P = PASO();
  return (x, y, w, h, i) => {
    ctx.fillStyle = PALETA[i === 0 ? 0 : sombrear(i, luz)];
    ctx.fillRect((ox + x) * P, (oy + y) * P, w * P, h * P);
  };
}

/**
 * 🐛 PINTAR TAPANDO EL BORDE DE LA GENTE *(Santi: "la valija debería taparme los pies, pero no dejar el borde negro
 * 1x1")*: el borde fino de la gente se pone al final, encima de todo, salvo donde algo que está delante lo tapa
 * (`taparGente`, engine/estiloNuevo.js). Pintado directo, la valija tapaba los pies pero el borde quedaba encima. Ahora
 * se pinta en un lienzo (de `w`×`h` puntos, con lugar alrededor para el polvo) y se estampa como las puertas.
 */
let lienzo = null;
export function pintarTapando(ctx, ox, oy, w, h, luz, pintar) {
  const P = PASO(), M = 6;
  if (!lienzo) lienzo = document.createElement('canvas');
  lienzo.width = w + 2 * M; lienzo.height = h + 2 * M;
  const c = lienzo.getContext('2d');
  pintar((x, y, ww, hh, i) => { c.fillStyle = PALETA[i === 0 ? 0 : sombrear(i, luz)]; c.fillRect(x + M, y + M, ww, hh); });
  const X = (ox - M) * P, Y = (oy - M) * P, W = lienzo.width * P, H = lienzo.height * P;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(lienzo, X, Y, W, H);
  estiloNuevo.taparGente(ctx, lienzo, X, Y, W, H);
}

/**
 * LAS SOMBRAS EN EL PISO (van con el piso, debajo de todo): mientras algo está por caer, su sombra crece donde va a
 * pegar (un punteado que se va llenando), y es lo que avisa dónde no hay que estar.
 */
export function dibujarSombrasDeCaidas(r, C, corrido, dia = true) {
  const K = CONFIG.caidas, P = PASO(), ctx = r.ctx;
  for (const o of C.objetos) {
    // 🥃 La araña no tiene la sombra de aviso: la avisa su propia sombra (o su luz) temblando, ver `dibujarLuzDeArana`.
    if (o.tipo === 'arana') { if (o.estado === 'repisa' || o.estado === 'aviso' || (o.estado === 'cae' && o.t < 0)) corrido(o.x, () => dibujarLuzDeArana(r, o, dia))(); continue; }
    // 🥃 Las botellas tampoco *(Santi: "no deberían tener sombras al caer como la araña")*: las avisa su tambaleo.
    if (o.tipo === 'botellas') continue;
    if (o.estado !== 'aviso' && o.estado !== 'cae') continue;
    const f = o.estado === 'cae' ? 1 : Math.min(1, o.t / K.aviso);
    const z = zonaDe(o);
    corrido((z.x0 + z.x1) / 2, () => {
      const cx = Math.round((z.x0 + z.x1) / 2 / P), cy = Math.round(o.yPiso / P);
      const rw = Math.max(2, Math.round((o.hw / P) * (0.4 + 0.6 * f))), rh = Math.max(1, Math.round(3 * (0.4 + 0.6 * f)));
      // (🔁 De la madera oscura del piso, punteada, y llena sólo en el centro al final: negra y llena parecía un
      // agujero en el piso.)
      ctx.fillStyle = PALETA[32];
      for (let y = -rh; y <= rh; y++) for (let x = -rw; x <= rw; x++) {
        const d = (x / rw) ** 2 + (y / rh) ** 2;
        if (d > 1) continue;
        const lleno = (x + y) % 2 === 0 ? d < 0.4 + 0.6 * f : f > 0.7 && d < 0.35;
        if (lleno) ctx.fillRect((cx + x) * P, (cy + y) * P, P, P);
      }
    })();
  }
}

/**
 * LO QUE SE ORDENA CON LA GENTE (`{ base, draw }`): lo que está en la repisa (contra la pared del fondo: detrás de
 * todos), lo que cae, lo que quedó tirado y las pilas.
 */
export function cosasDeCaidas(r, C, corrido) {
  const K = CONFIG.caidas, out = [];
  for (const o of C.objetos) {
    // En la repisa, contra la pared del fondo: detrás de todos. Cayendo y tirado, delante de los asientos del fondo
    // (cae sobre ellos), que terminan dos filas más abajo.
    const delante = o.yPared + 2 * CONFIG.tileSize + 0.02;
    let x = o.xRepisa, y = o.yRepisa, base = o.yPared, frame = 'arriba';
    if (o.estado === 'aviso') {
      // Se tambalea (un punto, de un lado al otro) y se va corriendo al borde.
      const f = Math.min(1, o.t / K.aviso);
      x += o.dir * f * 2 * PASO() + (Math.floor(o.t * 14) % 2 ? PASO() : 0);
    } else if (o.estado === 'cae' && o.t < 0) {
      // Todavía no se largó: sigue tambaleándose en su lugar.
      x += o.dir * 2 * PASO() + (Math.floor(o.t * 14) % 2 ? PASO() : 0);
    } else if (o.estado === 'cae') {
      const f = Math.min(1, o.t / (o.dura || K.caeDura)), corre = o.correA ?? o.corre ?? K.corre;
      // (El cajón de la pila se va de costado primero y después cae: la mitad del camino, antes.)
      x += o.dir * corre * (o.corre ? Math.min(1, f * 2) : f);
      y = o.yRepisa + (o.yPiso - o.yRepisa) * f * f;
      base = delante;
    } else if (o.estado === 'piso' || o.estado === 'roto') {
      // 🐛 Tirado, se ordena por donde apoya, como cualquiera *(Santi: "la valija se pone por delante")*: delante de
      // todos, te tapaba aunque pasaras más cerca de la pantalla.
      x = o.x; y = o.yPiso; base = o.yPiso; frame = o.estado;
    }
    // (🥃 Las botellas y la araña tienen su propio dibujo: ver `dibujarBotellas` y `dibujarArana`.)
    if (o.tipo === 'botellas') { out.push({ base: o.estado === 'repisa' || o.estado === 'aviso' ? o.yPared : o.yPiso, draw: corrido(o.xRepisa, () => dibujarBotellas(r, o)) }); continue; }
    if (o.tipo === 'arana') { out.push({ base: o.yPiso + (o.estado === 'piso' ? 0 : 20), draw: corrido(o.xRepisa, () => dibujarArana(r, o, x, y)) }); continue; }
    // (📦 El cajón de la pila, sobre la pila, se ordena con ella; cayendo y en el piso, como cualquiera.)
    if (o.tipo === 'cajonChico' && (o.estado === 'repisa' || o.estado === 'aviso')) base = o.basePila;
    if (o.tipo === 'cajonChico' && o.estado === 'cae') base = o.yPiso;
    out.push({ base, draw: corrido(o.xRepisa, () => dibujarCosa(r, o.tipo, frame, x, y, o.variante)) });
  }
  for (const p of C.pilas) {
    if (p.estado === 'suelto') continue;
    out.push({ base: p.yBase, draw: corrido(p.x, () => dibujarPila(r, p)) });
  }
  return out;
}

/** UNA COSA, parada (`arriba`: en la repisa o cayendo) o tirada en el piso, con la base en (x, y) del mundo. */
function dibujarCosa(r, tipo, frame, x, y, variante) {
  const P = PASO();
  const luz = estiloNuevo.luzEn ? Math.round(estiloNuevo.luzEn(x, Math.max(y, 34)) || 0) : 0;
  const D = DIBUJOS[tipo][frame];
  pintarTapando(r.ctx, Math.round(x / P) - Math.floor(D.w / 2), Math.round(y / P) - D.h, D.w, D.h, luz, (R) => D.pintar(R, variante));
}

/**
 * LOS DIBUJOS, punto por punto. Cada cosa tiene tres: parada (en la repisa, y mientras cae), tirada (en el piso) y rota
 * (de un tiro o de la dinamita: lo que queda). Las valijas son las mismas tres del frenazo (cuero, tapiz, baulito) y el
 * baúl, uno grande con cantoneras.
 */
const DIBUJOS = {
  valija: {
    arriba: { w: 18, h: 16, pintar: (R, v) => valijaParada(R, v) },
    piso: { w: 20, h: 11, pintar: (R, v) => valijaTirada(R, v) },
    // Rota: abierta de par en par, la tapa para un lado y la ropa desparramada (una camisa, un pañuelo, unas medias).
    roto: { w: 26, h: 11, pintar: (R, v) => {
      const [tapa, canto] = [[12, 47], [9, 33], [43, 27]][v];
      R(0, 3, 11, 8, 0); R(1, 4, 9, 6, canto); R(2, 5, 7, 4, 16); R(3, 6, 3, 2, 17); R(6, 7, 2, 1, 15);
      R(12, 2, 10, 7, 0); R(13, 3, 8, 5, tapa); R(13, 7, 8, 1, canto);
      R(23, 6, 3, 3, 0); R(24, 7, 1, 1, 17);
      R(9, 0, 4, 3, 0); R(10, 1, 2, 1, 20);
      R(16, 9, 5, 2, 0); R(17, 9, 3, 1, 9);
    } },
  },
  sombrerera: {
    // La caja redonda de los sombreros: la tapa (vista de arriba, un óvalo claro), la faja de la tapa y el cuerpo de
    // cartón a rayas; tirada, de costado y con la tapa salida al lado.
    arriba: { w: 14, h: 13, pintar: (R, v) => {
      const raya = [[39, 9], [26, 27], [18, 19]][v];
      R(2, 0, 10, 1, 0); R(1, 1, 12, 1, 0); R(0, 2, 14, 10, 0); R(1, 12, 12, 1, 0);
      R(2, 1, 10, 1, 16); R(1, 2, 12, 2, 16); R(1, 2, 12, 1, 17);
      R(1, 4, 12, 2, raya[1]); R(1, 5, 12, 1, raya[0]);
      R(1, 6, 12, 6, 15);
      for (let x = 2; x < 13; x += 3) R(x, 6, 1, 6, raya[1]);
      R(1, 11, 12, 1, 14);
    } },
    piso: { w: 22, h: 10, pintar: (R, v) => {
      const raya = [[39, 9], [26, 27], [18, 19]][v];
      // El cuerpo acostado (un rectángulo con la boca redonda a la izquierda) y la tapa caída al lado.
      R(0, 2, 14, 8, 0); R(1, 1, 12, 1, 0);
      R(1, 2, 12, 7, 15); for (let x = 3; x < 13; x += 3) R(x, 2, 1, 7, raya[1]);
      R(1, 3, 3, 5, 14); R(2, 4, 1, 3, 0);
      R(15, 5, 7, 5, 0); R(16, 6, 5, 2, 16); R(16, 8, 5, 1, raya[1]);
    } },
    // Rota: el cartón aplastado (un óvalo chato, con las rayas torcidas) y el sombrero de paja que llevaba, afuera.
    roto: { w: 22, h: 8, pintar: (R, v) => {
      const raya = [[39, 9], [26, 27], [18, 19]][v];
      R(0, 3, 13, 5, 0); R(1, 4, 11, 3, 15); R(2, 4, 1, 3, raya[1]); R(5, 5, 1, 2, raya[1]); R(9, 4, 1, 2, raya[1]);
      R(1, 4, 4, 1, 16);
      R(14, 3, 8, 4, 0); R(15, 4, 6, 2, 7); R(16, 2, 4, 2, 0); R(17, 3, 2, 1, 6); R(15, 5, 6, 1, 39);
    } },
  },
  canasta: {
    // La canasta de mimbre con su asa; tirada, volcada, con lo que llevaba desparramado (pan y manzanas).
    arriba: { w: 14, h: 14, pintar: (R) => {
      R(3, 0, 8, 1, 0); R(2, 1, 1, 4, 0); R(11, 1, 1, 4, 0); R(3, 1, 8, 1, 5);
      R(0, 4, 14, 10, 0);
      R(1, 5, 12, 2, 4); R(2, 5, 3, 1, 12); R(7, 5, 2, 1, 10);
      R(1, 7, 12, 6, 6);
      for (let y = 7; y < 13; y += 2) for (let x = 1 + (y % 4 === 1 ? 1 : 0); x < 13; x += 2) R(x, y, 1, 1, 5);
      R(1, 12, 12, 1, 4);
    } },
    piso: { w: 22, h: 10, pintar: (R) => {
      R(0, 1, 12, 9, 0); R(1, 2, 10, 7, 6);
      for (let y = 2; y < 9; y += 2) for (let x = 1 + (y % 4 === 0 ? 1 : 0); x < 11; x += 2) R(x, y, 1, 1, 5);
      R(1, 2, 3, 7, 3);
      R(13, 4, 4, 3, 0); R(14, 5, 2, 1, 12);
      R(17, 7, 3, 3, 0); R(18, 8, 1, 1, 10);
      R(13, 8, 3, 2, 0); R(14, 8, 1, 1, 9);
    } },
    // Rota: el mimbre reventado, las varillas sueltas, y lo de adentro por el piso.
    roto: { w: 24, h: 9, pintar: (R) => {
      R(0, 4, 10, 5, 0); R(1, 5, 8, 3, 6); for (let x = 1; x < 9; x += 2) R(x, 5 + (x % 3 ? 1 : 0), 1, 1, 5);
      R(10, 2, 1, 4, 5); R(12, 6, 4, 1, 5); R(3, 2, 5, 1, 5);
      R(13, 3, 4, 3, 0); R(14, 4, 2, 1, 12);
      R(18, 5, 3, 3, 0); R(19, 6, 1, 1, 10);
      R(21, 2, 3, 3, 0); R(22, 3, 1, 1, 9);
    } },
  },
  saca: {
    // 📮 La saca de correo de lona, echada, con la boca atada y la chapita de bronce (la misma de
    // world/estiloNuevo/vagones.js); rota, la lona abierta y las cartas desparramadas.
    arriba: { w: 14, h: 8, pintar: (R) => dibujarMapa(R, 0, 0, SACA, LONA) },
    piso: { w: 14, h: 8, pintar: (R) => dibujarMapa(R, 0, 0, SACA, LONA) },
    roto: { w: 24, h: 9, pintar: (R) => {
      dibujarMapa(R, 0, 1, ['..oooooo..', '.oLLLLLLo.', 'oLCCCCCCko', 'occccccco.', '.oooooooo.'], LONA);
      for (const [cx, cy] of [[11, 2], [15, 5], [19, 1], [13, 7], [21, 6], [17, 3]]) { R(cx, cy, 3, 2, 0); R(cx, cy, 2, 1, 17); }
    } },
  },
  cajonChico: {
    // 📦 El cajón chico de encomiendas, de tablas, con los zunchos de fierro (el mismo de la pila); roto, las tablas
    // astilladas y los paquetes que llevaba.
    arriba: { w: 16, h: 19, pintar: (R) => cajonDeTablas(R, 14, 8, 9) },
    piso: { w: 16, h: 19, pintar: (R) => cajonDeTablas(R, 14, 8, 9) },
    roto: { w: 26, h: 10, pintar: (R) => {
      R(0, 6, 9, 3, 0); R(1, 7, 7, 1, 4); R(10, 4, 7, 3, 0); R(11, 5, 5, 1, 5); R(3, 2, 2, 4, 0); R(3, 3, 1, 2, 4);
      R(17, 7, 3, 2, 0); R(18, 7, 1, 1, 31);
      dibujarMapa(R, 15, 0, PAQUETE.slice(0, 6), PAPEL);
    } },
  },
  baul: {
    // El baúl de viaje: la tapa combada, las tablas, las cantoneras y las dos correas; pesa (mata). Tirado, cae de
    // plano y se le salta la tapa.
    arriba: { w: 20, h: 17, pintar: (R) => {
      R(1, 0, 18, 1, 0); R(0, 1, 20, 16, 0);
      R(1, 1, 18, 5, 12); R(2, 1, 16, 1, 13); R(1, 3, 18, 1, 11);
      R(1, 6, 18, 1, 0);
      R(1, 7, 18, 9, 11); R(1, 10, 18, 1, 47); R(1, 13, 18, 1, 47);
      R(1, 1, 1, 15, 6); R(18, 1, 1, 15, 6); R(1, 7, 18, 1, 6); R(1, 15, 18, 1, 6);
      for (const x of [5, 14]) R(x, 1, 1, 15, 32);
      R(9, 7, 2, 3, 7); R(9, 8, 1, 1, 0);
    } },
    piso: { w: 22, h: 15, pintar: (R) => {
      R(0, 0, 22, 15, 0);
      R(1, 1, 20, 3, 13); R(1, 1, 20, 1, 0); R(2, 2, 18, 1, 12);
      R(1, 5, 20, 9, 11); R(1, 8, 20, 1, 47); R(1, 11, 20, 1, 47);
      R(1, 4, 20, 1, 6); R(1, 13, 20, 1, 6); R(1, 4, 1, 10, 6); R(20, 4, 1, 10, 6);
      for (const x of [6, 15]) R(x, 4, 1, 10, 32);
    } },
    // Roto: la tapa arrancada, las tablas astilladas y las cantoneras sueltas; adentro, la ropa.
    roto: { w: 26, h: 14, pintar: (R) => {
      R(0, 4, 18, 10, 0); R(1, 5, 16, 8, 11); R(2, 6, 14, 5, 16); R(4, 7, 5, 2, 17); R(10, 8, 4, 2, 20);
      R(1, 11, 16, 1, 47); R(1, 5, 1, 8, 6); R(16, 5, 1, 8, 6);
      R(19, 1, 7, 9, 0); R(20, 2, 5, 7, 12); R(20, 4, 5, 1, 11); R(20, 2, 1, 7, 6);
      R(5, 1, 6, 3, 0); R(6, 2, 4, 1, 11);
      R(13, 0, 3, 3, 0); R(14, 1, 1, 1, 6);
    } },
  },
};

/** La valija parada: las mismas tres de entities/rodante.js (`dibujarValija`), sin el polvo ni los saltitos. */
function valijaParada(R, v) {
  if (v === 1) {
    R(1, 3, 16, 13, 0); R(0, 5, 18, 10, 0);
    R(6, 0, 6, 1, 0); R(5, 1, 1, 3, 0); R(12, 1, 1, 3, 0); R(6, 1, 6, 1, 33);
    R(2, 4, 14, 1, 7); R(1, 5, 16, 1, 6);
    R(1, 6, 16, 7, 9);
    for (let y = 7, j = 0; y < 12; y += 2, j++) for (let x = 2 + (j % 2) * 2; x < 16; x += 4) { R(x, y, 1, 1, 10); R(x + 1, y + 1, 1, 1, 28); }
    R(15, 6, 2, 7, 8);
    R(1, 13, 16, 2, 33); R(1, 13, 16, 1, 34);
  } else if (v === 2) {
    R(0, 2, 18, 14, 0); R(1, 1, 16, 1, 0);
    R(1, 2, 16, 4, 43); R(1, 4, 16, 1, 27);
    R(1, 6, 16, 1, 0);
    R(1, 7, 16, 8, 27); R(1, 10, 16, 1, 26); R(1, 13, 16, 1, 26);
    R(1, 2, 1, 13, 6); R(16, 2, 1, 13, 6); R(1, 7, 16, 1, 6);
    R(8, 7, 2, 3, 7); R(8, 8, 1, 1, 0);
  } else {
    R(7, 0, 4, 1, 0); R(6, 1, 1, 2, 0); R(11, 1, 1, 2, 0); R(7, 1, 4, 1, 47);
    R(0, 2, 18, 14, 0);
    R(1, 3, 16, 4, 12); R(1, 3, 16, 1, 13);
    R(1, 7, 16, 1, 47);
    R(1, 8, 16, 7, 11); R(1, 14, 16, 1, 47);
    R(1, 8, 2, 2, 47); R(15, 8, 2, 2, 47); R(1, 13, 2, 2, 47); R(15, 13, 2, 2, 47);
    for (const x of [4, 13]) { R(x, 3, 1, 12, 47); R(x, 10, 1, 2, 7); }
    R(8, 7, 2, 2, 7); R(8, 8, 2, 1, 6);
  }
}

/** La valija tirada: de plano, se ve la cara grande (con las correas o el dibujo) y un canto finito abajo. */
function valijaTirada(R, v) {
  R(0, 0, 20, 11, 0);
  if (v === 1) {
    R(1, 1, 18, 7, 9);
    for (let y = 2, j = 0; y < 7; y += 2, j++) for (let x = 2 + (j % 2) * 2; x < 18; x += 4) { R(x, y, 1, 1, 10); R(x + 1, y + 1, 1, 1, 28); }
    R(1, 1, 1, 7, 7); R(18, 1, 1, 7, 7);
    R(1, 8, 18, 2, 33);
  } else if (v === 2) {
    R(1, 1, 18, 7, 43); R(1, 4, 18, 1, 27);
    R(1, 1, 1, 7, 6); R(18, 1, 1, 7, 6);
    R(1, 8, 18, 2, 27); R(1, 8, 18, 1, 6);
  } else {
    R(1, 1, 18, 7, 12); R(1, 1, 18, 1, 13);
    for (const x of [5, 14]) { R(x, 1, 1, 9, 47); R(x, 4, 1, 1, 7); }
    R(1, 8, 18, 2, 11); R(1, 9, 18, 1, 47);
    R(19, 3, 1, 4, 47);
  }
}

/** LA PILA JUNTO A LA PUERTA: el baúl grande abajo (no se mueve) y, encima, lo que todavía no salió. */
function dibujarPila(r, p) {
  const P = PASO();
  const luz = estiloNuevo.luzEn ? Math.round(estiloNuevo.luzEn(p.x, p.yBase - 4) || 0) : 0;
  // En el aviso se sacude contra la puerta.
  const tiembla = p.estado === 'aviso' && Math.floor(p.t * 16) % 2 ? 1 : 0;
  // 🥃 El baúl grande de primera clase, solo.
  if (p.tipo === 'baul') {
    pintarTapando(r.ctx, Math.round(p.x / P) - 15 + tiembla, Math.round(p.yBase / P) - 20, 30, 20, luz, pintarBaulGrande);
    return;
  }
  // 🛒 El carro de correo, esperando en su lugar (en el aviso se sacude sobre sus ruedas).
  if (p.tipo === 'carro') {
    const L = medidasCarro(p.ancho, p.hondo);
    pintarTapando(r.ctx, Math.round(p.x / P) - Math.round(L.w / 2) + tiembla, Math.round(p.yBase / P) - L.h, L.w, L.h, luz, (R) => pintarCarro(R, p.ancho, p.hondo, 0, p.semilla));
    return;
  }
  const ox = Math.round(p.x / P) - 11, base = Math.round(p.yBase / P) - 2;
  pintarTapando(r.ctx, ox + 1, base - 17, 20, 17, luz, (R) => DIBUJOS.baul.arriba.pintar(R));
  p.arriba.forEach((v, i) => {
    pintarTapando(r.ctx, ox + 2 + (i ? tiembla : -tiembla), base - 17 - 13 - i * 12, 18, 16, luz, (R) => valijaParada(R, v.variante));
  });
}

/**
 * 🥃 EL BAÚL GRANDE DE PRIMERA CLASE, de viaje, para un mes: la tapa combada en dos tonos de cuero, la costura de la
 * tapa, las tablas, las cantoneras de bronce, dos correas con su hebilla y la cerradura. (También lo usa el que sale
 * deslizándose: entities/rodante.js.)
 */
export function pintarBaulGrande(R) {
  R(1, 0, 28, 1, 0); R(0, 1, 30, 19, 0);
  R(1, 1, 28, 6, 12); R(2, 1, 26, 1, 13); R(1, 4, 28, 1, 11);
  R(1, 7, 28, 1, 0);
  R(1, 8, 28, 11, 11); R(1, 11, 28, 1, 47); R(1, 15, 28, 1, 47); R(1, 18, 28, 1, 47);
  for (const [x, y] of [[1, 1], [27, 1], [1, 16], [27, 16]]) { R(x, y, 2, 3, 6); R(x, y, 1, 1, 7); }
  R(1, 7, 28, 1, 6);
  for (const x of [8, 20]) { R(x, 1, 2, 18, 32); R(x, 9, 2, 2, 7); R(x, 10, 1, 1, 0); }
  R(14, 7, 2, 4, 7); R(14, 9, 1, 1, 0);
}

/**
 * 🥃 LAS BOTELLAS DEL ESTANTE, en su tramo: las mismas botellas y copas que dibujaba el estante (el dibujo fijo ahora
 * deja sólo las repisas, ver world/estiloNuevo/vagones.js). En el aviso tintinean (una sí y una no, de a un punto);
 * cayendo, cinco botellas en el aire; en el piso, el charco de licor y los vidrios, con un pico entero.
 */
function dibujarBotellas(r, o) {
  const P = PASO(), K = CONFIG.caidas;
  const luz = estiloNuevo.luzEn ? Math.round(estiloNuevo.luzEn(o.x, o.yPiso) || 0) : 0;
  const ox = Math.round(o.x0 / P), oy = Math.round(o.yArr / P);
  const R = pintor(r.ctx, ox, oy, luz);
  const cx = Math.round(o.x / P), py = Math.round(o.yPiso / P), ancho = Math.round(o.hw / P);
  const Q = pintor(r.ctx, 0, 0, luz);
  if (o.estado === 'repisa' || o.estado === 'aviso' || o.estado === 'cae') {
    /**
     * 🔁 CADA BOTELLA, LA SUYA *(Santi: "por más de que caigan juntas dentro de un mismo grupo deberían caer unas antes y
     * otras después… deberían vibrar o tambalearse en la estantería antes de caer")*: en el aviso, cada una se
     * tambalea a su compás (se corre un punto para un lado y para el otro, y salta), cada vez más; en el golpe, cada una
     * se larga a su tiempo (`botellasDemora`), cae derecho desde su lugar y, al llegar al piso, se hace vidrios.
     */
    const COLORES = [27, 5, 22, 26, 10, 7];
    const fuerza = o.estado === 'aviso' ? Math.min(1, o.t / K.aviso) : 1;
    for (const ry of o.filas) {
      for (let bx = o.ex + 2, n = 0; bx < o.pb - 1; bx += 4 + (n % 3 === 1 ? 2 : 0), n++) {
        if (bx < o.pa) continue;
        const copa = n % 5 === 3;
        const col = COLORES[(n * 7 + ry) % COLORES.length], alto = copa ? 4 : 7 + (n % 2) * 2;
        const demora = azar(n * 13 + ry, Math.round(o.x)) * K.botellasDemora;
        let dx = 0, dy = 0;
        if (o.estado === 'aviso' || (o.estado === 'cae' && o.t < demora)) {
          const fase = Math.floor((o.estado === 'cae' ? K.aviso + o.t : o.t) * (12 + (n % 4) * 3) + n);
          if (fuerza > 0.25) dx = fase % 4 === 0 ? 1 : fase % 4 === 2 ? -1 : 0;
          if (fuerza > 0.6 && fase % 3 === 0) dy = -1;
        } else if (o.estado === 'cae') {
          const f = Math.min(1, (o.t - demora) / K.caeDura), alFondo = py - (oy + ry);
          if (f >= 1) {
            // Llegó: vidrios en el piso, donde cayó.
            const gx = ox + bx;
            Q(gx - 1, py, 1, 1, 22); Q(gx + 1, py - 1, 1, 1, 30); Q(gx + 2, py + 1, 1, 1, col); Q(gx, py + 1, 1, 1, 4);
            continue;
          }
          dy = Math.round(alFondo * f * f);
          /**
           * 🔁 CAYENDO, SE DA VUELTA *(Santi: "las botellas al caer deberían cambiar su dibujo y hacer como que se dan
           * vuelta, porque ahora parece que caen con la tapa apuntando hacia arriba")*: cada una gira a su manera (para
           * un lado o para el otro, de media vuelta a vuelta y media en toda la caída), en los 8 dibujos de
           * `BOTELLA_GIRA`. La copa, de boca para arriba o para abajo.
           */
          const gira = (0.5 + azar(n * 7 + ry, Math.round(o.x) + 3)) * (azar(Math.round(o.x), n + ry) < 0.5 ? -1 : 1);
          const cuadro = (((Math.round(f * gira * 8)) % 8) + 8) % 8;
          const cx0 = bx + 1, cy0 = ry - Math.round(alto / 2) + dy;
          if (copa) {
            const boca = cuadro >= 2 && cuadro <= 5;
            R(bx, cy0 - 2, 3, 4, 0); R(bx + 1, boca ? cy0 - 2 : cy0 - 1, 1, 3, 22);
            continue;
          }
          const mapa = BOTELLA_GIRA[cuadro];
          const mx = cx0 - Math.floor(mapa[0].length / 2), my = cy0 - Math.floor(mapa.length / 2);
          mapa.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') R(mx + q, my + j, 1, 1, fila[q] === 'c' ? col : fila[q] === 'h' ? 30 : 0); });
          continue;
        }
        const x = bx + dx, top = ry - alto + dy;
        if (copa) { R(x, top, 3, 4, 0); R(x + 1, top + 1, 1, 3, 22); continue; }
        R(x, top, 3, alto, 0); R(x + 1, top - 2, 1, 2, 0);
        R(x + 1, top + 1, 1, alto - 1, col); R(x + 1, top + 2, 1, 1, 30);
      }
    }
    return;
  }
  // En el piso: el charco (un óvalo de licor, con su brillo) y los vidrios desparramados; un pico de botella entero.
  for (let y = -2; y <= 2; y++) for (let x = -ancho; x <= ancho; x++) {
    if ((x / ancho) ** 2 + (y / 2.5) ** 2 > 1) continue;
    Q(cx + x, py + y, 1, 1, y === -1 && x % 3 === 0 ? 6 : 4);
  }
  for (let k = 0; k < 9; k++) {
    const gx = cx - ancho + Math.floor(azar(k, Math.round(o.x)) * 2 * ancho), gy = py - 3 + Math.floor(azar(Math.round(o.x), k) * 7);
    Q(gx, gy, 1, 1, k % 3 ? 22 : 30);
  }
  Q(cx + 2, py - 1, 4, 2, 0); Q(cx + 3, py - 1, 2, 1, 27);
}

/**
 * 🥃 LO QUE SE VE DE LA ARAÑA MIENTRAS CUELGA *(Santi: "las arañas no se deberían ver. Me gustaría que de día se sepa
 * por una sombra y que de noche iluminen. Se sabrá si algo está por caer por cómo tambalea esa luz o sombra")*: de
 * día, su sombra sobre la alfombra (un óvalo con los seis brazos, oscureciendo lo que pisa); de noche, el charco de luz
 * cálida de sus velas (aclarando, en anillos). Las dos se hamacan con el meneo del tren y, en el aviso, tiemblan fuerte
 * para un lado y para el otro. Al caer se apaga (o se va la sombra): ahí se ve la araña.
 */
function dibujarLuzDeArana(r, o, dia) {
  const P = PASO(), ctx = r.ctx;
  const tiembla = o.estado === 'aviso' ? (Math.floor(o.t * 14) % 2 ? 2 : -2) + Math.round(Math.sin(o.t * 9) * 2) : 0;
  const cx = Math.round(o.x / P) + Math.round((estiloNuevo.meneo || 0) * 2) + tiembla, cy = Math.round(o.yPiso / P);
  ctx.save();
  if (dia) {
    // La sombra: más oscura en el medio (el tronco y la bellota) y punteada hacia los brazos.
    ctx.globalCompositeOperation = 'multiply';
    // (🔁 Más fuerte y más grande: el paso por la paleta se comía la primera, y casi no se veía.)
    ctx.fillStyle = 'rgba(30, 15, 25, 0.6)';
    const rw = 18, rh = 5;
    for (let y = -rh; y <= rh; y++) for (let x = -rw; x <= rw; x++) {
      const d = (x / rw) ** 2 + (y / rh) ** 2;
      if (d > 1) continue;
      if (d < 0.45 || ((x + y) % 2 === 0 && d < 0.85) || (Math.abs(x) % 6 === 0 && (x + y) % 2 === 0)) ctx.fillRect((cx + x) * P, (cy + y) * P, P, P);
    }
  } else {
    // La luz: tres anillos que se suman, más fuerte en el medio.
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 170, 90, 0.09)';
    for (const [rw, rh] of [[30, 10], [21, 7], [12, 4]]) {
      for (let y = -rh; y <= rh; y++) for (let x = -rw; x <= rw; x++) {
        if ((x / rw) ** 2 + (y / rh) ** 2 > 1) continue;
        ctx.fillRect((cx + x) * P, (cy + y) * P, P, P);
      }
    }
  }
  ctx.restore();
}

/**
 * 🥃 LA ARAÑA DE BRONCE, cayendo (colgada no se ve: ver `dibujarLuzDeArana`): el brazo, las seis velas en sus platitos,
 * el aro de arriba y los caireles. En el piso, rota sobre la alfombra (el brazo doblado, las velas y los caireles por
 * todos lados).
 */
function dibujarArana(r, o, x, y) {
  const P = PASO(), K = CONFIG.caidas;
  const luz = estiloNuevo.luzEn ? Math.round(estiloNuevo.luzEn(o.x, o.yPiso) || 0) : 0;
  if (o.estado === 'piso') {
    // Rota sobre la alfombra: el brazo doblado en dos, el tronco suelto, las velas y los caireles desparramados.
    pintarTapando(r.ctx, Math.round(o.x / P) - 17, Math.round(o.yPiso / P) - 11, 34, 12, luz, (R) => {
      R(2, 5, 15, 4, 0); R(3, 6, 13, 2, 6); R(3, 6, 13, 1, 7);
      R(15, 3, 15, 4, 0); R(16, 4, 13, 2, 6); R(16, 4, 13, 1, 7);
      R(12, 7, 7, 4, 0); R(13, 8, 5, 2, 7);
      for (const [cx, cy] of [[4, 4], [9, 4], [20, 2], [26, 2]]) { R(cx - 1, cy, 3, 1, 7); }
      R(1, 1, 1, 3, 17); R(31, 8, 3, 1, 17); R(22, 9, 1, 2, 17); R(7, 10, 3, 1, 17);
      for (const [cx, cy] of [[0, 9], [6, 11], [11, 1], [19, 11], [24, 8], [29, 0], [33, 5], [14, 0]]) R(cx, cy, 1, 1, 22);
    });
    return;
  }
  // Colgada no se ve.
  if (o.estado !== 'cae' || o.t < 0) return;
  const colgada = false, hamaca = 0;
  // (🔁 Más grande, con dos pisos y seis velas: chica, no se entendía qué era.)
  const ox = Math.round(x / P) - 15 + hamaca, oy = Math.round(y / P) - 31;
  pintarTapando(r.ctx, ox, oy, 30, 32, luz, (R) => {
    // La cadena, que sube hasta perderse (el techo no se ve); se inclina con la hamaca.
    if (colgada) for (let k = 0; k < 18; k++) R(14 - Math.round((hamaca * (18 - k)) / 18), k, 2, 1, k % 2 ? 6 : 0);
    R(12, 18, 6, 2, 0); R(13, 18, 4, 1, 7);                                   // la tapa de arriba
    R(8, 20, 14, 2, 0); R(9, 20, 12, 1, 6);                                   // el aro de arriba
    for (const cx of [9, 20]) { R(cx, 17, 1, 3, 17); R(cx, 16, 1, 1, 28); }  // con sus dos velas
    R(13, 22, 4, 7, 0); R(14, 22, 2, 6, 7);                                   // el tronco
    R(0, 26, 30, 3, 0); R(1, 26, 28, 1, 7); R(1, 27, 28, 1, 6);              // el brazo grande
    for (const cx of [2, 7, 12, 17, 22, 27]) { R(cx - 1, 25, 3, 1, 7); R(cx, 21, 1, 4, 17); R(cx, 20, 1, 1, 28); }
    for (const cx of [4, 9, 20, 25]) R(cx, 29, 1, 2, 22);                    // los caireles
    R(14, 29, 2, 2, 6); R(14, 31, 2, 1, 7);                                   // la bellota de abajo
  });
}

/**
 * 🥃 EL BAÚL GRANDE VOLCÁNDOSE, en 8 cuadros por vuelta (de a 45°) *(Santi: "no rueda, sino que se desliza, y eso está
 * mal. No debería ser un barril que ruede pero sí se debería ver el choque de sus lados (rectangulares) que van
 * chocando contra el piso")*. En un lienzo de 36×36 puntos, apoyado en la fila de abajo:
 *  - LOS CUATRO DE PLANO, cada uno dibujado aparte: 0 echado con la tapa arriba (el de siempre, `pintarBaulGrande`),
 *    2 parado sobre una punta (la tapa a la derecha), 4 dado vuelta (la tapa abajo), 6 parado sobre la otra punta (la
 *    tapa a la izquierda).
 *  - LOS CUATRO DE CANTO, a 45°, apoyado en una esquina: cada uno con sus cuatro esquinas puestas a mano (los lados
 *    son diagonales justas, de a un punto), la tapa, las tablas, las dos correas, la cerradura y las cantoneras.
 * Volcándose para adelante (hacia la derecha) va 0, 1, 2… 7; para atrás, al revés. Se queda quieto sólo de plano.
 */
export function pintarBaulRodando(R, cuadro) {
  const c = ((cuadro % 8) + 8) % 8;
  if (c === 0) { pintarBaulGrande((x, y, w, h, i) => R(x + 3, y + 16, w, h, i)); return; }
  if (c === 4) { baulDadoVuelta(R); return; }
  if (c === 2) { baulParado(R, true); return; }
  if (c === 6) { baulParado(R, false); return; }
  // Los de canto: [A, B, C, D] (A–B es el lado de la tapa), la línea de la tapa (A'–B'), las dos correas y la cerradura.
  const CANTO = {
    1: { A: [14, 0], B: [35, 21], C: [21, 35], D: [0, 14], tapa: [[10, 4], [31, 25]], correas: [[[19, 5], [5, 19]], [[30, 16], [16, 30]]], llave: [20, 14] },
    3: { A: [35, 14], B: [14, 35], C: [0, 21], D: [21, 0], tapa: [[31, 10], [10, 31]], correas: [[[19, 30], [5, 16]], [[30, 19], [16, 5]]], llave: [20, 20] },
    5: { A: [21, 35], B: [0, 14], C: [14, 0], D: [35, 21], tapa: [[25, 31], [4, 10]], correas: [[[16, 30], [30, 16]], [[5, 19], [19, 5]]], llave: [14, 20] },
    7: { A: [0, 21], B: [21, 0], C: [35, 14], D: [14, 35], tapa: [[4, 25], [25, 4]], correas: [[[5, 16], [19, 30]], [[16, 5], [30, 19]]], llave: [14, 14] },
  }[c];
  baulDeCanto(R, CANTO);
}

/** Una línea diagonal justa (de a un punto en x y en y), de `a` a `b`. */
function diagonal(R, [x0, y0], [x1, y1], i) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
  for (let k = 0; k <= n; k++) R(x0 + sx * k, y0 + sy * k, 1, 1, i);
}

/** El baúl de canto: el cuerpo, la tapa del lado A–B, las tablas, las correas, la cerradura y las cantoneras. */
function baulDeCanto(R, { A, B, C, D, tapa, correas, llave }) {
  const P4 = [A, B, C, D];
  // ¿El punto está adentro (del lado de adentro de los cuatro lados)?
  const lado = (p, q, x, y) => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);
  const s = Math.sign(lado(A, B, C[0], C[1]));
  const adentro = (x, y) => P4.every((p, k) => Math.sign(lado(p, P4[(k + 1) % 4], x, y)) !== -s);
  const enTapa = (x, y) => Math.sign(lado(tapa[0], tapa[1], x, y)) !== s;
  for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) {
    if (!adentro(x, y)) continue;
    R(x, y, 1, 1, enTapa(x, y) ? 12 : 11);
  }
  // Las tablas del cuerpo: dos líneas paralelas a la tapa, más adentro.
  const hacia = [Math.sign(D[0] - A[0]), Math.sign(D[1] - A[1])];
  for (const k of [8, 11]) {
    const a = [A[0] + hacia[0] * k, A[1] + hacia[1] * k], b = [B[0] + hacia[0] * k, B[1] + hacia[1] * k];
    diagonal(R, a, b, 47);
  }
  diagonal(R, tapa[0], tapa[1], 0);                                   // la costura de la tapa
  for (const [a, b] of correas) diagonal(R, a, b, 32);                // las correas
  R(llave[0], llave[1], 2, 2, 7); R(llave[0], llave[1] + 1, 1, 1, 0); // la cerradura
  for (const [p, q] of [[A, B], [B, C], [C, D], [D, A]]) diagonal(R, p, q, 0);   // el contorno
  for (const p of P4) {                                               // las cantoneras
    const cx = p[0] + Math.sign(18 - p[0]) * 2, cy = p[1] + Math.sign(18 - p[1]) * 2;
    R(cx, cy, 1, 1, 7); R(cx + Math.sign(18 - p[0]), cy, 1, 1, 6);
  }
}

/** El baúl parado sobre una punta (20 de ancho por 30 de alto): la tapa a la derecha (`tapaDerecha`) o a la izquierda. */
function baulParado(R, tapaDerecha) {
  R(8, 6, 20, 30, 0);
  R(9, 7, 18, 28, 11);
  if (tapaDerecha) {
    R(21, 7, 6, 28, 12); R(26, 8, 1, 26, 13); R(20, 7, 1, 28, 0);
    R(16, 7, 1, 28, 47); R(12, 7, 1, 28, 47);
    R(19, 19, 3, 2, 7); R(19, 20, 1, 1, 0);
  } else {
    R(9, 7, 6, 28, 12); R(9, 8, 1, 26, 13); R(15, 7, 1, 28, 0);
    R(19, 7, 1, 28, 47); R(23, 7, 1, 28, 47);
    R(14, 19, 3, 2, 7); R(16, 20, 1, 1, 0);
  }
  for (const y of [13, 27]) { R(9, y, 18, 2, 32); R(17, y, 2, 2, 7); }
  for (const [x, y] of [[9, 7], [25, 7], [9, 32], [25, 32]]) { R(x, y, 2, 3, 6); R(x, y, 1, 1, 7); }
}

/** El baúl dado vuelta: la tapa abajo, apoyado sobre ella; las correas y las cantoneras, igual. */
function baulDadoVuelta(R) {
  R(4, 16, 28, 1, 0); R(3, 17, 30, 18, 0); R(4, 35, 28, 1, 0);
  R(4, 17, 28, 11, 11); R(4, 20, 28, 1, 47); R(4, 24, 28, 1, 47);
  R(4, 28, 28, 1, 0);
  R(4, 29, 28, 6, 12); R(5, 34, 26, 1, 13); R(4, 31, 28, 1, 11);
  for (const [x, y] of [[4, 17], [30, 17], [4, 32], [30, 32]]) { R(x, y, 2, 3, 6); R(x + 1, y + 2, 1, 1, 7); }
  for (const x of [11, 23]) { R(x, 17, 2, 18, 32); R(x, 23, 2, 2, 7); }
  R(17, 26, 2, 4, 7); R(17, 27, 1, 1, 0);
}

/**
 * 🥃 LA BOTELLA QUE GIRA AL CAER, en 8 dibujos puestos punto por punto (de a 45°, girando como las agujas del reloj):
 * 0 parada (el pico arriba), 1 inclinada con el pico arriba a la derecha, 2 acostada con el pico a la derecha, 3 con el
 * pico abajo a la derecha, 4 dada vuelta, 5 pico abajo a la izquierda, 6 acostada con el pico a la izquierda, 7 pico
 * arriba a la izquierda. '#' es el contorno; 'c', el vidrio de su color (también el pico); 'h', el brillo blanco junto
 * al pico, como en la botella parada.
 * 🐛 Con el pico y el contorno oscuros, contra el fondo oscuro del estante no se veía para dónde apuntaba: sólo una
 * rayita de color. El pico va del color de la botella, y el brillo marca la punta.
 */
const BOTELLA_GIRA = [
  ['.c.', '.c.', '###', '#h#', '#c#', '#c#', '#c#', '###'],
  ['....c', '...c.', '..##.', '.#h#.', '#c#..', '##...'],
  ['######..', '#cccchcc', '######..'],
  ['##...', '#c#..', '.#h#.', '..##.', '...c.', '....c'],
  ['###', '#c#', '#c#', '#c#', '#h#', '###', '.c.', '.c.'],
  ['...##', '..#c#', '.#h#.', '.##..', '.c...', 'c....'],
  ['..######', 'cchcccc#', '..######'],
  ['c....', '.c...', '.##..', '.#h#.', '..#c#', '...##'],
];

/**
 * 📮 EL CORREO *(Santi eligió las recomendaciones)*:
 *  - LAS SACAS DE ARRIBA DE LOS CASILLEROS (livianas): una sobre cada mueble de clasificar, contra la pared; en el golpe
 *    se va de cabeza por delante de la mesa y cae al piso del pasillo de atrás.
 *  - EL CAJÓN CHICO DE ARRIBA DE CADA PILA DE ENCOMIENDAS (pesado: mata): se desmorona para el lado del golpe y cae
 *    en el hueco de al lado de la pila, donde uno se esconde.
 *  - LOS CARROS DE MIMBRE DE LAS PUNTAS (las casillas 'R'): en el golpe salen rodando sobre sus ruedas al pasillo
 *    (frena: el de la puerta de atrás; acelera: el de adelante). Como el baúl de primera clase: te tiran al piso,
 *    quietos chocan y son cobertura, y cada sacudón los vuelve a mover hasta que los rompan.
 */
function correo(C, train, w) {
  const map = train.map, S = map.size, tc = CONFIG.tresCuartos, P = PASO();
  const cols = Math.round(w.width / S);
  const casilla = (c, f) => (map.grid[f] || [])[w.colStart + c];
  const esPared = (f) => casilla(Math.floor(cols / 2), f) === '#' || casilla(Math.floor(cols / 2), f) === 'W';
  let filasArriba = 0; while (esPared(filasArriba)) filasArriba++;
  let filasAbajo = 0; while (esPared(map.rows - 1 - filasAbajo)) filasAbajo++;
  const x0 = Math.floor(w.x / P) * P, yArr = -tc.alturaPared;
  const ax = (u) => Math.round((u - x0) / P), ay = (u) => Math.round((u - yArr) / P);
  const deAx = (pt) => x0 + pt * P, deAy = (pt) => yArr + pt * P;
  const tramos = (fila, letra) => {
    const out = [];
    for (let c = 0; c < cols; c++) {
      if (casilla(c, fila) !== letra || casilla(c - 1, fila) === letra) continue;
      let c2 = c; while (casilla(c2 + 1, fila) === letra) c2++;
      let f2 = fila; while (casilla(c, f2 + 1) === letra) f2++;
      out.push({ c, c2, f: fila, f2 });
    }
    return out;
  };
  // Las sacas, sobre los casilleros (la tapa del mueble está `ALTO_CAS` = 22 puntos arriba del borde del piso).
  for (const B of tramos(filasArriba, 'C')) {
    const x = w.x + ((B.c + B.c2 + 1) / 2) * S + (azar(B.c, 5) - 0.5) * S;
    C.objetos.push({
      tipo: 'saca', peso: 'liviano', hw: 7, x, xRepisa: x, yRepisa: deAy(ay(B.f * S) - 22) + P, yPared: B.f * S + 6,
      yPiso: (B.f2 + 1) * S + 12, estado: 'repisa', t: 0, dir: 0, wagon: w.id,
    });
  }
  // Las pilas de encomiendas y los carros, en la fila de adelante.
  const fila = map.rows - filasAbajo - 2;
  for (const B of tramos(fila, 'C')) {
    if (Math.round((B.c - 2) / 6) % 2 === 0) continue;             // (un carro de los del medio: no se mueve)
    const x = ax(w.x + B.c * S) + 2, x2 = ax(w.x + (B.c2 + 1) * S) - 2;
    const yt = ay(B.f * S) + 3, atras = yt + 14;
    // El cajón chico: `cajon(x + 4, atras - 13, 14, 8, 9)` del dibujo de la pila.
    const cx = deAx(x + 11), base = (B.f2 + 1) * S;
    C.objetos.push({
      tipo: 'cajonChico', peso: 'pesado', hw: 6, x: cx, xRepisa: cx, yRepisa: deAy(atras - 13) + P, yPared: base - 2 * S,
      yPiso: base - 6, corre: ((x2 - x) * P) / 2 + 10, basePila: base - 0.005, estado: 'repisa', t: 0, dir: 0, wagon: w.id,
    });
  }
  // 📮 Las cartas sueltas en el piso (las que dibujaba el piso del vagón: ver `papeles`).
  const filaAbajo = map.rows - filasAbajo - 1;
  for (let k = 0; k < 18; k++) {
    const x = w.x + 10 + azar(k, w.colStart + 5) * (w.width - 20), y = (filasArriba + 0.4) * S + azar(w.colStart + 9, k) * ((filaAbajo - filasArriba + 0.2) * S);
    const c = Math.floor((x - w.x) / S), f = Math.floor(y / S);
    if (casilla(c, f) !== '.') continue;
    C.papeles.push({ x, y, vx: 0, vy: 0, z: 0, vz: 0, giro: azar(k, 3) * 4, pisada: k % 3 === 0 });
  }
  for (const B of tramos(fila, 'R')) {
    const x = ax(w.x + B.c * S) + 2, x2 = ax(w.x + (B.c2 + 1) * S) - 2;
    const yt = ay(B.f * S) + 3, yb = ay((B.f2 + 1) * S) - 3;
    C.pilas.push({
      tipo: 'carro', x: deAx((x + x2) / 2), yTope: deAy(yt), yBase: deAy(yb) + P, hw: ((x2 - x) * P) / 2, hh: ((yb - yt) * P) / 2,
      ancho: x2 - x, hondo: yb - yt, semilla: B.c, atras: B.c < cols / 2, arriba: [], estado: 'quieta', t: 0, wagon: w.id,
    });
  }
}

/** Un mapa de letras (`.` es vacío) con su tabla de colores. */
function dibujarMapa(R, x, y, filas, col) {
  filas.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') R(x + q, y + j, 1, 1, col[fila[q]]); });
}
const SACA = ['...oooooooo...', '..oLLLLLLLLoo.', '.oLLCCCCCCCLko', 'oLCCCCCCCCCcko', 'oCCCCCCCYCCcoo', 'oCCCCCCCcccco.', '.occcccccccco.', '..oooooooooo..'];
const PAQUETE = ['oooooooooo', 'oPPPsPPPPo', 'oPPPsPPPPo', 'ossssssSso', 'oppppspppo', 'oppppspppo', 'oqqqqsqqqo', 'oooooooooo'];
const LONA = { o: 0, L: 16, C: 15, c: 14, k: 4, Y: 7 }, PAPEL = { o: 0, P: 37, p: 36, q: 35, s: 17, S: 16 };

/** 📦 Un cajón de tablas como los de la pila (`cajon` en world/estiloNuevo/vagones.js), desde (1, 1). */
function cajonDeTablas(R, an, tapa, alto) {
  R(0, 0, an + 2, alto + tapa + 2, 0);
  R(1, 1, an, tapa, 5); R(1, 1, an, 1, 6);
  for (let q = 6; q < an - 1; q += 5) R(q, 2, 1, tapa - 1, 4);
  R(1, 1 + tapa, an, alto, 4); R(1, 1 + tapa, an, 1, 6);
  for (let q = 1 + tapa + 4; q < tapa + alto; q += 4) R(1, q, an, 1, 3);
  for (const zx of [3, an - 3]) R(zx, 1, 2, tapa + alto, 31);
}

/** 🛒 Lo que ocupa el carro en su lienzo: las manijas a los costados y las sacas que asoman arriba. */
export function medidasCarro(ancho, hondo) {
  return { w: ancho + 8, h: hondo + 24 + 1 };
}

/**
 * 🛒 EL CARRO DE CORREO, el mismo de world/estiloNuevo/vagones.js, en su lienzo (`medidasCarro`): la caja de mimbre
 * con el borde, lleno de sacas grandes con la boca atada, el frente tejido con el zuncho y las esquinas de fierro, las
 * manijas y dos ruedas. `rueda`: el cuadro de las ruedas (0 o 1: giran cuando rueda).
 */
export function pintarCarro(R, ancho, hondo, rueda, semilla = 0, faltan = 0) {
  const x = 4, x2 = x + ancho, yt = 24, yb = yt + hondo;
  const H = 20, ruedas = 4, piso = yb - ruedas, tt = yt - H + 4, tf = piso - H;
  R(x - 1, tt - 1, ancho + 2, piso - tt + 2, 0);
  R(x, tt, ancho, tf - tt, 36); R(x, tt, ancho, 1, 37);
  R(x + 2, tt + 2, ancho - 4, tf - tt - 3, 33);
  const LOMO = ['....oooooooo....', '..ooLLLLLLLLoo..', '.oLLLLCCCCCCLLo.', 'oLLCCCCCCCCCCcco', 'oLCCCCCCCCCCCcco', 'oCCCCCCCCCCCCcco', 'oCCCCCCCCCCCccco', '.oCCCCCCCccccco.', '..occcccccccco..', '...oooooooooo...'];
  for (let sy = tt - 4, j = 0; sy < tf - 6; sy += 8, j++) {
    const cuantas = j % 2 ? 2 : 3, paso = (ancho - 14) / Math.max(1, cuantas - 1);
    for (let q = 0; q < cuantas; q++) {
      if (j === 0 && q < faltan) continue;                 // (las que se le cayeron al salir)
      const sx = Math.round(x - 1 + q * paso + (azar(semilla * 7 + j * 3 + q, 11) - 0.5) * 6), syy = sy + Math.round((azar(semilla * 7 + j * 5 + q + 1, 13) - 0.5) * 4);
      dibujarMapa(R, Math.max(x - 1, Math.min(sx, x2 - 15)), syy, LOMO, LONA);
      if ((j + q) % 2 === 0) dibujarMapa(R, Math.max(x, Math.min(sx, x2 - 15)) + 6, syy - 3, ['.ooo.', 'okkko', '.oko.'], { o: 0, k: 4 });
    }
  }
  for (let yy = tf; yy < piso; yy++) for (let xx = x; xx < x2; xx++) R(xx, yy, 1, 1, yy % 3 === 2 ? 34 : (xx + (yy % 6 < 3 ? 0 : 2)) % 4 < 2 ? 36 : 35);
  R(x, tf, ancho, 1, 37); R(x, tf + 1, ancho, 1, 0);
  R(x, piso - 2, ancho, 2, 31);
  for (const ex of [x, x2 - 2]) { R(ex, tf, 2, piso - tf, 31); R(ex, tf, 1, 1, 23); }
  for (const mx of [x - 3, x2]) { R(mx, tf + 3, 3, 1, 0); R(mx, tf + 7, 3, 1, 0); R(mx === x - 3 ? mx : mx + 2, tf + 3, 1, 5, 0); }
  // Las ruedas, de fierro: los rayos en cruz o en equis, según cómo vayan girando.
  const RUEDA = rueda ? ['.ooo.', 'okKko', 'oKoKo', 'okKko', '.ooo.'] : ['.ooo.', 'oKkKo', 'okoko', 'oKkKo', '.ooo.'];
  for (const wx of [x + 2, x2 - 7]) dibujarMapa(R, wx, yb - 4, RUEDA, { o: 0, K: 23, k: 31 });
}

/**
 * 💥 UNA SOLA DINAMITA DESTRUYE CUALQUIERA DE ESTAS COSAS *(Santi: "una sola dinamita destruye cualquier estructura de
 * estas, no es que le saca uno de vida")*: lo que espera en las repisas y en las pilas, lo que cuelga y lo que quedó
 * tirado, si lo agarra la onda. Lo de las repisas cae roto en el piso; lo que ya estaba roto (botellas, araña) queda
 * donde estaba; los baúles y los carros que esperaban junto a las puertas, hechos astillas (sin choque). Devuelve
 * dónde rompió algo, para las astillas. (Lo que rueda es un rodante: eso lo rompe la escena.)
 */
export function destruirEnRadio(C, x, y, radio) {
  const rotos = [];
  for (const o of C.objetos) {
    if (o.estado === 'roto') continue;
    const oy = o.estado === 'piso' || o.estado === 'cae' ? o.yPiso : o.tipo === 'arana' ? o.yPiso : o.yPared;
    if (Math.hypot((o.estado === 'piso' ? o.x : o.xRepisa) - x, oy - y) > radio) continue;
    if (o.estado !== 'piso') o.x = o.xRepisa;
    o.estado = o.fijo ? 'piso' : 'roto';
    o.vx = 0; o.pego = true;
    rotos.push({ x: o.x, y: o.yPiso });
  }
  for (const p of C.pilas) {
    if (p.estado === 'suelto' || Math.hypot(p.x - x, (p.yTope + p.yBase) / 2 - y) > radio) continue;
    p.estado = 'suelto'; p.arriba = [];
    rotos.push({ x: p.x, y: (p.yTope + p.yBase) / 2 });
  }
  return rotos;
}

/**
 * 🛒 EL CARRO DE CORREO EN DIAGONAL, mientras sale de su lugar hacia el pasillo *(Santi: "que rueden de forma diagonal al
 * pasillo y ahí se acomoden en horizontal")*: visto en ángulo, la boca es un rombo (lleno de sacas) y se ven dos caras
 * de mimbre, la de la izquierda en sombra, con sus cantoneras de fierro y una rueda en cada punta de abajo. Las
 * esquinas, puestas a mano, en un lienzo de 56×62. `rueda`: 0 o 1, los rayos girando.
 */
export function pintarCarroDiagonal(R, rueda, semilla = 0, faltan = 0) {
  const L = [2, 22], T = [28, 6], Rr = [54, 22], B = [28, 38], H = 20;
  const dentro = (x, y) => Math.abs(x - 28) / 26 + Math.abs(y - 22) / 16 <= 1;
  // Las caras: de cada borde de abajo de la boca, para abajo.
  for (let x = 2; x <= 54; x++) {
    const yTop = x <= 28 ? L[1] + ((x - 2) * (B[1] - L[1])) / 26 : B[1] - ((x - 28) * (B[1] - Rr[1])) / 26;
    for (let y = Math.round(yTop); y <= Math.round(yTop) + H; y++) {
      const izq = x <= 28;
      const teje = y % 3 === 2 ? (izq ? 33 : 34) : (x + (y % 6 < 3 ? 0 : 2)) % 4 < 2 ? (izq ? 35 : 36) : (izq ? 34 : 35);
      R(x, y, 1, 1, teje);
    }
    R(x, Math.round(yTop) + H, 1, 2, 0);                                   // el borde de abajo
    R(x, Math.round(yTop) + H - 2, 1, 2, 31);                              // el zuncho de abajo
  }
  // La boca: el rombo, por dentro oscuro y lleno de sacas, con el borde de mimbre.
  for (let y = 6; y <= 38; y++) for (let x = 2; x <= 54; x++) if (dentro(x, y)) R(x, y, 1, 1, 33);
  const LOMO = ['..oooooo..', '.oLLLLLLo.', 'oLCCCCCCco', 'oCCCCCCcco', '.occcccco.', '..oooooo..'];
  const COL = { o: 0, L: 16, C: 15, c: 14 };
  for (const [sx, sy] of [[12, 16], [26, 10], [36, 18], [22, 22], [8, 22], [40, 12]].slice(faltan)) {
    const dx = Math.round((azar(semilla, sx) - 0.5) * 4), dy = Math.round((azar(sy, semilla) - 0.5) * 3);
    LOMO.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.' && dentro(sx + dx + q, sy + dy + j)) R(sx + dx + q, sy + dy + j, 1, 1, COL[fila[q]]); });
  }
  for (const [p, q] of [[L, T], [T, Rr], [Rr, B], [B, L]]) {               // el borde de la boca
    const n = Math.max(Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1]));
    for (let k = 0; k <= n; k++) { const x = Math.round(p[0] + ((q[0] - p[0]) * k) / n), y = Math.round(p[1] + ((q[1] - p[1]) * k) / n); R(x, y, 1, 1, 0); R(x, y + 1, 1, 1, 37); }
  }
  for (const [cx, cy] of [L, B, Rr]) { R(cx - 1, cy, 2, H, 31); R(cx - 1, cy, 1, 1, 23); }   // las cantoneras
  R(0, 22, 1, H + 2, 0); R(55, 22, 1, H + 2, 0);                           // los costados
  // Las ruedas: una en cada punta de abajo y una en la esquina de adelante.
  const RUEDA = rueda ? ['.ooo.', 'okKko', 'oKoKo', 'okKko', '.ooo.'] : ['.ooo.', 'oKkKo', 'okoko', 'oKkKo', '.ooo.'];
  for (const [wx, wy] of [[3, 39], [26, 55], [48, 39]]) RUEDA.forEach((fila, j) => { for (let q = 0; q < 5; q++) if (fila[q] !== '.') R(wx + q, wy + j, 1, 1, { o: 0, K: 23, k: 31 }[fila[q]]); });
}

/**
 * 📮 LAS CARTAS SUELTAS DEL PISO VUELAN CON EL TREN *(Santi: "hay papelitos en el suelo muy chiquitos que me gustaría
 * que vuelen al haber movimientos del tren… en todo momento, teniendo el traqueteo o no")*: cada una siente lo que
 * acelera su vagón (`aceleracionEn`, world/enganches.js) para el lado contrario, como todo lo suelto. En el piso la
 * agarra el roce (con el vaivén suave apenas tiembla o se corre un poco); con un sacudón se desliza, y con uno fuerte
 * se levanta, revolotea dando vueltas y vuelve a caer. Contra lo que choca, rebota.
 */
export function actualizarPapeles(C, dt, E, map) {
  if (!E || !C.papeles.length) return;
  const K = CONFIG.caidas.papeles;
  for (const p of C.papeles) {
    const a = Math.max(-K.tope, Math.min(K.tope, -aceleracionEn(E, p.x) * K.inercia));
    if (p.z <= 0) {
      if (Math.abs(a) > K.pega) {
        p.vx += (a - Math.sign(a) * K.pega) * dt;
        p.vy += (Math.random() - 0.5) * Math.abs(a) * 0.3 * dt;
      }
      if (Math.abs(a) > K.vuela && Math.random() < K.vuelaChance * dt * 60) { p.vz = K.salto * (0.5 + Math.random()); p.z = 0.01; }
      const roce = Math.max(0, 1 - K.roce * dt);
      p.vx *= roce; p.vy *= roce;
    } else {
      // En el aire: lo lleva el envión, revolotea y cae despacio.
      p.vx += a * 0.5 * dt + Math.sin(p.giro * 3) * K.revolotea * dt;
      p.vz -= K.gravedad * dt;
      p.z = Math.max(0, p.z + p.vz * dt);
      p.giro += dt * (4 + Math.abs(p.vx) * 0.2);
      if (p.z === 0) p.vz = 0;
    }
    const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    if (map.isSolidAt(nx, p.y)) p.vx *= -0.3; else p.x = nx;
    if (map.isSolidAt(p.x, ny)) p.vy *= -0.3; else p.y = ny;
  }
}

/**
 * 📮 LOS PAPELITOS: en el piso, con el piso (debajo de todos); en el aire, con su sombrita en el piso y dando vueltas
 * (tres dibujos: de plano, de canto, al revés). Devuelve lo que vuela, para ordenarlo con la gente.
 */
export function dibujarPapeles(r, C, corrido) {
  const P = PASO(), aire = [];
  for (const p of C.papeles) {
    if (p.z > 0.5) { aire.push({ base: p.y, draw: corrido(p.x, () => papel(r, p, P)) }); corrido(p.x, () => sombraDePapel(r, p, P))(); continue; }
    corrido(p.x, () => papel(r, p, P))();
  }
  return aire;
}
function sombraDePapel(r, p, P) {
  r.ctx.fillStyle = PALETA[33];
  r.ctx.fillRect(Math.round(p.x / P) * P, Math.round(p.y / P) * P, 2 * P, P);
}
function papel(r, p, P) {
  const luz = estiloNuevo.luzEn ? Math.round(estiloNuevo.luzEn(p.x, p.y) || 0) : 0;
  const R = pintor(r.ctx, Math.round(p.x / P), Math.round((p.y - p.z) / P), luz);
  if (p.z <= 0.5) {
    R(0, 0, 2, 1, 17); R(2, 0, 1, 1, 30); R(0, 1, 1, 1, 17); R(1, 1, 1, 1, 16); R(2, 1, 1, 1, 17);
    if (p.pisada) R(1, 2, 1, 1, 33);
    return;
  }
  const c = Math.floor(p.giro) % 3;
  if (c === 0) { R(0, 0, 3, 1, 17); R(0, 1, 3, 1, 16); }
  else if (c === 1) { R(1, 0, 1, 2, 30); }
  else { R(0, 0, 2, 1, 16); R(1, 1, 2, 1, 17); }
}

/**
 * 🛒 EL CARRO SUELTA SACAS AL SALIR *(Santi: "que el carrito al moverse hacia el pasillo suelte un par de las cosas que
 * lleva encima y que si te caen en la cabeza es como las otras bolsas")*: una saca se le cae de arriba, para atrás (el
 * carro arranca y ella se queda), y cae al piso donde está; la escena llama esto dos veces, a destiempo. Es liviana.
 */
export function sacaDelCarro(C, x, yArriba, yPiso, dir, rng) {
  const K = CONFIG.caidas;
  C.objetos.push({
    tipo: 'saca', peso: 'liviano', hw: 7, x, xRepisa: x, yRepisa: yArriba, yPared: yPiso - 2 * CONFIG.tileSize, yPiso, yPiso0: yPiso,
    estado: 'cae', t: 0, dir: -dir, demora: 0, dura: K.caeDura * rng.range(0.8, 1.2), correA: rng.range(4, 12), delCarro: true,
  });
}
