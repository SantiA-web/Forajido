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
 * grande en el rincón de cada puerta), el correo (las sacas de los casilleros, el cajón chico de cada pila de
 * encomiendas y los carros de las puntas), el de guardias (los estantes, el armero y la munición) y el comedor (la
 * alacena, la vajilla de las mesas y los barriles de comida) y el dormitorio (el lavatorio, el saco del perchero, y en
 * los rincones de las puertas un baúl de camarote y una pila de valijas). Los demás, de a uno: ver el plan en las notas.
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
  const C = { objetos: [], pilas: [], impactos: [], sueltos: [], papeles: [], estantes: [], rayas: [], derrames: [], charcos: [], train, reloj: 0 };
  const map = train.map, S = map.size, tc = CONFIG.tresCuartos;
  for (const w of train.wagons) {
    if (w.id === 'primeraClase') { primeraClase(C, train, w); continue; }
    if (w.id === 'correo') { correo(C, train, w); continue; }
    if (w.id === 'guardias') { guardias(C, train, w); continue; }
    if (w.id === 'comedor') { comedor(C, train, w); continue; }
    if (w.id === 'dormitorio') { dormitorio(C, train, w); continue; }
    // (🚂 El caboose espera a que el dibujo fijo ubique sus cosas: ver `armarPendientes`.)
    if (w.id === 'caboose') { (C.porArmar = C.porArmar || []).push(w); continue; }
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
    // (🛢️ Los barriles, cada uno el suyo: los que quedan parados.)
    if (p.tipo === 'barriles' && p.estado !== 'suelto') {
      for (const b of p.barriles) if (Math.abs(x - (p.x + b.dx)) < 6 && Math.abs(y - (p.yBase - 3)) < 3.5) return true;
      continue;
    }
    if ((p.tipo !== 'baul' && p.tipo !== 'carro' && p.tipo !== 'municion' && p.tipo !== 'valijas') || p.estado === 'suelto') continue;
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
    // 🍽️ La vajilla de las mesas no se cae de una repisa: se desliza por la tabla (ver `deslizarVajilla`).
    if (o.enMesa) { if (o.estado === 'repisa') planearVajilla(o, sentido, rng); continue; }
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
    if (p.tipo === 'barriles') {
      if (p.estado !== 'quieta' || !p.barriles.length || p.atras !== (sentido < 0)) continue;
      // (Nada todo a la vez: cada uno se vuelca o no, y a su tiempo; pero alguno siempre.)
      p.estado = 'aviso'; p.t = 0;
      for (const b of p.barriles) { b.cae = rng.chance(K.barril.cae); b.demora = rng.range(0, 0.5); }
      if (!p.barriles.some((b) => b.cae)) p.barriles[rng.int(0, p.barriles.length - 1)].cae = true;
      continue;
    }
    if (p.estado !== 'quieta' || (!p.arriba.length && p.tipo !== 'baul' && p.tipo !== 'carro' && p.tipo !== 'municion' && p.tipo !== 'rueda' && p.tipo !== 'barrilAgua')) continue;
    if (p.atras === (sentido < 0)) { p.estado = 'aviso'; p.t = 0; }
  }
}

/** EL GOLPE: lo avisado se cae, y las pilas avisadas largan lo de arriba (en `C.sueltos`, para la escena). */
export function golpearCaidas(C) {
  // (Cada uno arranca a su tiempo: hasta que el reloj llega a cero sigue en su lugar, tambaleándose.)
  for (const o of C.objetos) if (o.estado === 'aviso') { o.estado = 'cae'; o.t = -(o.demora || 0); }
  for (const o of C.objetos) if (o.enMesa && o.planDx) o.deslizando = true;
  for (const p of C.pilas) {
    if (p.estado !== 'aviso') continue;
    const dir = p.atras ? 1 : -1;
    // El baúl grande sale él mismo, y deja el rincón libre.
    if (p.tipo === 'baul') {
      p.estado = 'suelto';
      C.sueltos.push({ x: p.x + dir * 2, y: (p.yTope + p.yBase) / 2, dir, variante: 3, demora: 0, mueble: true, hw: 11, hh: 5, vida: 3, lento: 0.8, lona: p.lona });
      continue;
    }
    // 🚂 La rueda del freno sale rodando de canto; el barril de agua se vuelca y rueda vacío (ver `caboose`).
    if (p.tipo === 'rueda') {
      p.estado = 'suelto';
      // (🔁 Por su fila, la del cajón, derecho; no baja al pasillo *(Santi: "no quiero que la rueda vaya al pasillo, sino
      // que avance por dónde estaba cuando está apoyada al cajón")*. Hasta pasar el cajón no choca con él.)
      C.sueltos.push({ x: p.x, y: p.yBase - 4, dir, variante: 7, demora: 0, hw: 7, hh: 4, vida: 1, lento: 1.1, porSuFila: true, salida: dir > 0 ? p.cajonX2 + 7 : null });
      continue;
    }
    if (p.tipo === 'barrilAgua') {
      p.estado = 'suelto';
      C.sueltos.push({ x: p.x, y: p.yBase - 3, dir, variante: 6, demora: 0, mueble: true, hw: 9, hh: 5, vida: 4, lento: 0.9, contenido: 2, haciaPasillo: p.dy, agua: { clave: p.clave, baldeX: p.baldeX, baldeY: p.yBase + 2, celdas: p.celdas } });
      continue;
    }
    // 🛢️ Los barriles: los que se vuelcan salen rodando cada uno a su tiempo; los demás se quedan parados.
    if (p.tipo === 'barriles') {
      for (const b of p.barriles) {
        if (!b.cae) continue;
        C.sueltos.push({ x: p.x + b.dx, y: p.yBase - 3, dir, variante: 6, demora: b.demora, mueble: true, hw: 6, hh: 4, vida: 3, lento: 0.9, contenido: b.contenido, haciaPasillo: p.dy });
      }
      p.barriles = p.barriles.filter((b) => !b.cae);
      p.estado = p.barriles.length ? 'quieta' : 'suelto';
      continue;
    }
    // 📦 La pila de munición: las tres cajas salen deslizándose, raspando el piso, una detrás de la otra.
    if (p.tipo === 'municion') {
      p.estado = 'suelto';
      for (let k = 0; k < 3; k++) C.sueltos.push({ x: p.x, y: (p.yTope + p.yBase) / 2 + (k - 1) * 3, dir, variante: 5, demora: k * 0.14, mueble: true, hw: (p.cw * PASO()) / 2, hh: 4, vida: 2, lento: 0.85, ancho: p.cw });
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
    // 🛏️ En la pirámide del dormitorio salen todas (no hay baúl abajo) y el rincón queda libre *(Santi: "hay una valija que
    // nunca se mueve, que queda en la puerta. Ponela en movimiento como las otras")*.
    if (p.tipo === 'valijas') p.estado = 'suelto';
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
    // (🚂 La rueda del freno es de fierro: un tiro no le hace nada.)
    if (o.estado !== 'piso' || o.fijo || o.aguantaBalas) continue;
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
  armarPendientes(C);
  C.reloj = (C.reloj || 0) + dt;
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
      // (🫗 Lo de loza —la jarra y la palangana del lavatorio— se rompe al pegar en el piso.)
      o.estado = o.rompeAlCaer ? 'roto' : 'piso';
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
  for (const o of C.objetos) if (o.deslizando) deslizarVajilla(o, dt);
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
    // (🎩 Lo que no lastima —sombreros, cartucheras, rifles— tampoco avisa.)
    if (o.peso === 'nada') continue;
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
    if (o.tipo === 'rifle') { out.push({ base: o.estado === 'piso' ? o.yPiso : o.estado === 'cae' ? delante : o.yPared, draw: corrido(o.xRepisa, () => dibujarRifle(r, o, x, y)) }); continue; }
    if (o.tipo === 'arana') { out.push({ base: o.yPiso + (o.estado === 'piso' ? 0 : 20), draw: corrido(o.xRepisa, () => dibujarArana(r, o, x, y)) }); continue; }
    // (🍽️ La vajilla —de la alacena y de las mesas— tiene un dibujo por pieza: ver `dibujarVajilla`.)
    if (o.tipo === 'vajilla') { out.push({ base, draw: corrido(o.xRepisa, () => dibujarVajilla(r, o, frame, x, y)) }); continue; }
    // (📦 El cajón de la pila, sobre la pila, se ordena con ella; cayendo y en el piso, como cualquiera.)
    if (o.tipo === 'cajonChico' && (o.estado === 'repisa' || o.estado === 'aviso')) base = o.basePila;
    if (o.tipo === 'cajonChico' && o.estado === 'cae') base = o.yPiso;
    out.push({ base, draw: corrido(o.xRepisa, () => dibujarCosa(r, o.tipo, frame, x, y, o.variante)) });
  }
  for (const p of C.pilas) {
    if (p.estado === 'suelto') continue;
    out.push({ base: p.yBase, draw: corrido(p.x, () => dibujarPila(r, p)) });
  }
  // 🪵 Los estantes y los clavos de la pared (quedan aunque se caiga lo que tenían): detrás de lo que llevan.
  for (const e of C.estantes) out.push({ base: e.yPared - 0.004, draw: corrido(e.x, () => dibujarEstante(r, e)) });
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
  municionCaja: {
    // 📦 La caja de munición, de tablas, con la tapa, lo pintado en la cara y la manija de soga; rota, las tablas y las
    // balas de bronce desparramadas.
    arriba: { w: 12, h: 9, pintar: (R) => cajaDeMunicion(R) },
    piso: { w: 12, h: 9, pintar: (R) => cajaDeMunicion(R) },
    roto: { w: 20, h: 8, pintar: (R) => {
      R(0, 4, 8, 3, 0); R(1, 5, 6, 1, 4); R(9, 2, 6, 3, 0); R(10, 3, 4, 1, 5); R(4, 1, 2, 3, 0); R(4, 2, 1, 1, 4);
      for (const [bx, by] of [[16, 5], [13, 7], [18, 2], [7, 7], [11, 0]]) { R(bx, by, 2, 1, 7); R(bx + 2, by, 1, 1, 28); }
    } },
  },
  sombrero: {
    // 🎩 El sombrero de fieltro: colgado del ala (el mismo que colgaba del clavo); tirado, de plano, el ala ancha y la copa.
    arriba: { w: 15, h: 7, pintar: (R) => dibujarMapa(R, 0, 0, SOMBRERO_COLGADO, SOMB) },
    piso: { w: 15, h: 6, pintar: (R) => dibujarMapa(R, 0, 0, ['....ooooooo....', '..ooHHHHHHHoo..', '.okkHhhhhhHkko.', '.okkkbbbbbkkko.', '..ookkkkkkkoo..', '....ooooooo....'], SOMB) },
  },
  cinto: {
    // 🔫 La cartuchera: colgada del clavo (la misma de siempre); tirada, el cinto enroscado con las balas y la funda.
    arriba: { w: 12, h: 16, pintar: (R) => dibujarMapa(R, 0, 0, CINTO_COLGADO, CU) },
    piso: { w: 16, h: 6, pintar: (R) => dibujarMapa(R, 0, 0, ['..oooooooo......', '.occyccyccoooo..', 'oco......occcco.', '.occyccyccocccco', '..oooooooo.occo.', '...........oo...'], CU) },
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
    pintarTapando(r.ctx, Math.round(p.x / P) - 15 + tiembla, Math.round(p.yBase / P) - 20, 30, 20, luz, (R) => pintarBaulGrande(p.lona ? deLona(R) : R));
    return;
  }
  // 🛏️ La pirámide de valijas del dormitorio: dos acostadas abajo, una al lado de la otra, y una arriba en el medio (los
  // mismos dibujos de la valija tirada). En el aviso, la de arriba se sacude.
  if (p.tipo === 'valijas') {
    const ox = Math.round(p.x / P) - 20, base = Math.round(p.yBase / P);
    const [arriba, izq, der] = p.arriba;
    if (izq) pintarTapando(r.ctx, ox, base - 11, 20, 11, luz, (R) => valijaTirada(R, izq.variante));
    if (der) pintarTapando(r.ctx, ox + 20, base - 11, 20, 11, luz, (R) => valijaTirada(R, der.variante));
    if (arriba) pintarTapando(r.ctx, ox + 10 + tiembla, base - 19, 20, 11, luz, (R) => valijaTirada(R, arriba.variante));
    return;
  }
  // 🚂 La rueda del freno, apoyada contra el cajón: se mueve un punto con el meneo y en el aviso se sacude. (El barril
  // de agua, mientras está parado, lo dibuja el dibujo fijo, con el agua que se mueve.)
  if (p.tipo === 'rueda') {
    const m = Math.round((estiloNuevo.meneo || 0) * 1.4);
    pintarTapando(r.ctx, Math.round(p.x0 / P) + p.px - 9 + m + tiembla, Math.round(p.yArr / P) + p.py - 9, 19, 19, luz, (R) => pintarRueda(R, 0));
    return;
  }
  if (p.tipo === 'barrilAgua') return;
  // 🛢️ Los barriles parados (en el aviso, cada uno se bambolea a su ritmo).
  if (p.tipo === 'barriles') {
    p.barriles.forEach((b, i) => {
      const bam = p.estado === 'aviso' && Math.floor(p.t * (12 + i * 5)) % 2 ? (i % 2 ? 1 : -1) : 0;
      pintarTapando(r.ctx, Math.round((p.x + b.dx) / P) - 8 + bam, Math.round(p.yBase / P) - BARRIL_PARADO.length, 16, BARRIL_PARADO.length, luz, (R) => pintarBarril(R, 'parado', 0, b.contenido));
    });
    return;
  }
  // 📦 La pila de munición, esperando (en el aviso se sacude).
  if (p.tipo === 'municion') {
    pintarTapando(r.ctx, Math.round(p.x / P) - Math.round((2 * p.cw + 1) / 2) - 1 + tiembla, Math.round(p.yBase / P) - 26, 2 * p.cw + 3, 26, luz, (R) => pintarPilaMunicion(R, p.cw));
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
    // (🛢️ Los barriles parados quedan reventados en su lugar, con lo que llevaban por el piso.)
    if (p.tipo === 'barriles') for (const b of p.barriles) barrilRoto(C, p.x + b.dx, p.yBase, b.contenido);
    // (🚂 La rueda, partida; el barril de agua, reventado: el agua al piso y su casilla libre.)
    if (p.tipo === 'rueda') ruedaAcostada(C, p.x, p.yBase, true);
    if (p.tipo === 'barrilAgua') {
      (C.train._ocultos || (C.train._ocultos = new Set())).add(p.clave);
      barrilRoto(C, p.x, p.yBase, 2);
      volcarBarrilAgua(C, { x: p.x, y: p.yBase - 3, hh: 3, baldeX: p.baldeX, baldeY: p.yBase + 2, celdas: p.celdas });
    }
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
  // 📦 Las rayas que dejó en el piso lo que se arrastró raspando (dos marcas paralelas, oscuras).
  r.ctx.fillStyle = PALETA[33];
  for (const q of C.rayas) corrido(q.x, () => { const x = Math.round(q.x / P) * P, y = Math.round(q.y / P) * P; r.ctx.fillRect(x, y, P, P); r.ctx.fillRect(x, y - 3 * P, P, P); })();
  // 🛢️ Lo que fue dejando un barril sin tapa (porotos o harina), un puñado por punto.
  for (const q of C.charcos) corrido(q.x, () => pintarCharco(r, q, P, C.reloj || 0))();
  for (const q of C.derrames) corrido(q.x, () => pintarDerrame(r, q, P, C.reloj || 0))();
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

/**
 * 🎖️ EL VAGÓN DE GUARDIAS *(Santi eligió las recomendaciones: "se deslizan raspando", "sobre cada catre del fondo" y
 * "los rifles caen, sin daño")*:
 *  - UN ESTANTE DE TABLAS SOBRE CADA CATRE DE ARRIBA, en lo libre de la pared (ni ventana ni farol), con dos cajas de
 *    munición (livianas: media vida). Al lado, de un clavo, el sombrero o la cartuchera, uno y uno, como siempre: se
 *    caen sin lastimar.
 *  - LOS TRES WINCHESTER DEL ARMERO se sueltan de sus ganchos y quedan tirados abajo del armero, sin lastimar.
 *  - LA PILA DE MUNICIÓN DEL RINCÓN, junto a la puerta de atrás (las casillas 'R'): en el frenazo las tres cajas
 *    salen deslizándose, raspando el piso (polvo, astillas y rayas), una detrás de la otra. Son bajas y pesadas: se
 *    arrastran, no se vuelcan. Te tiran al piso; quietas chocan, son cobertura y cada sacudón las vuelve a mover.
 */
function guardias(C, train, w) {
  const map = train.map, S = map.size, tc = CONFIG.tresCuartos, P = PASO();
  const cols = Math.round(w.width / S);
  const casilla = (c, f) => (map.grid[f] || [])[w.colStart + c];
  const esPared = (f) => casilla(Math.floor(cols / 2), f) === '#' || casilla(Math.floor(cols / 2), f) === 'W';
  let filasArriba = 0; while (esPared(filasArriba)) filasArriba++;
  const x0 = Math.floor(w.x / P) * P, yArr = -tc.alturaPared, yCara = 8;
  const ax = (u) => Math.round((u - x0) / P), ay = (u) => Math.round((u - yArr) / P);
  const deAx = (pt) => x0 + pt * P, deAy = (pt) => yArr + pt * P;
  const yPared = filasArriba * S, yPie = ay(yPared);
  // Lo ocupado de la pared (como en world/estiloNuevo/vagones.js): las ventanas, los faroles y lo que ya se puso.
  const ventanas = [];
  for (let c = 0; c < cols; c++) {
    if (casilla(c, 0) !== 'W' || casilla(c - 1, 0) === 'W') continue;
    let d = c; while (casilla(d + 1, 0) === 'W') d++;
    ventanas.push([c, d]);
  }
  const F = tc.faroles, cuantos = Math.max(1, Math.floor((cols - 2) / F.cadaColumnas)), sobra = cols - cuantos * F.cadaColumnas;
  const faroles = [];
  for (let q = 0; q < cuantos; q++) {
    let c = Math.round(sobra / 2 + (q + 0.5) * F.cadaColumnas);
    for (let d = 0; d < 4 && casilla(c, 0) === 'W'; d++) c += (d % 2 ? -(d + 1) : d + 1);
    faroles.push(ax(w.x + (c + 0.5) * S));
  }
  const tomados = [];
  const ocupado = (xa, xb) => ventanas.some(([c0, c1]) => xb > ax(w.x + c0 * S) && xa < ax(w.x + (c1 + 1) * S))
    || faroles.some((fx) => xb > fx - 6 && xa < fx + 6) || tomados.some(([a, b]) => xb > a && xa < b);
  const lugar = (xa, xb, ancho) => {
    const medio = (xa + xb) / 2;
    for (let d = 0; d < xb - xa; d++) for (const s of [1, -1]) {
      const x = Math.round(medio + s * d - ancho / 2);
      if (x >= xa - 4 && x + ancho <= xb + 4 && !ocupado(x - 1, x + ancho + 1)) return x;
    }
    return null;
  };
  // --- el armero: el mismo lugar que el dibujo fijo (el tramo de pared más largo sin ventanas, el de la punta).
  {
    const ultima = ventanas.length ? ventanas[ventanas.length - 1][1] + 1 : 0;
    const xa = ax(w.x + ultima * S) + 4, xb = ax(w.x + (cols - 1) * S) - 2, AW = 28, x = lugar(xa, xb, AW);
    if (x != null) {
      tomados.push([x - 2, x + AW + 2]);
      const y = yCara + 9, alto = yPie - yCara - 13, arriba = yCara + 2, largo = y + alto - 5 - arriba;
      for (let k = 0; k < 3; k++) {
        const gx = x + 3 + k * 8, xw = deAx(gx + 2);
        C.objetos.push({
          tipo: 'rifle', peso: 'nada', hw: 3, x: xw, xRepisa: xw, yRepisa: deAy(arriba + largo), yPared, yPiso: yPared + 8 + k * 4,
          px: gx, py: arriba, largo, fijo: true, estado: 'repisa', t: 0, dir: 0, wagon: w.id,
        });
      }
    }
  }
  // --- sobre cada catre de arriba: el estante con dos cajas, y al lado el clavo con el sombrero o la cartuchera.
  let n = 0;
  for (let c = 0; c < cols; c++) {
    if (casilla(c, filasArriba) !== 'S' || casilla(c - 1, filasArriba) === 'S') continue;
    let c2 = c; while (casilla(c2 + 1, filasArriba) === 'S') c2++;
    const xa = ax(w.x + c * S) + 2, xb = ax(w.x + (c2 + 1) * S) - 2;
    // (Si no entra uno de dos cajas, uno chico con una: entre la ventana, el farol y lo colgado, a veces no hay lugar.)
    let EW = 30, xs = lugar(xa, xb, EW);
    if (xs == null) { EW = 16; xs = lugar(xa, xb, EW); }
    const ys = yCara + 24;
    if (xs != null) {
      tomados.push([xs - 2, xs + EW + 2]);
      C.estantes.push({ px: xs, py: ys, w: EW, x: deAx(xs + EW / 2), yPared, x0, yArr });
      for (const bx of EW > 16 ? [xs + 3, xs + 16] : [xs + 2]) {
        const xw = deAx(bx + 6);
        C.objetos.push({
          tipo: 'municionCaja', peso: 'liviano', hw: 5, x: xw, xRepisa: xw, yRepisa: deAy(ys), yPared,
          yPiso: yPared + 7 + Math.round(azar(bx, c) * 8), estado: 'repisa', t: 0, dir: 0, wagon: w.id,
        });
      }
    }
    let sombrero = n++ % 2 === 0, ancho = sombrero ? 15 : 12, alto = sombrero ? 7 : 16;
    // Al costado del estante, si hay lugar; si no, de un clavo debajo del estante, y ahí siempre un sombrero (la
    // cartuchera es larga: bajaba hasta tapar el catre).
    let xh = lugar(xa, xb, ancho), yh = yCara + 8;
    if (xh == null && xs != null) { sombrero = true; ancho = 15; alto = 7; xh = xs + Math.round(EW / 2 - ancho / 2); yh = ys + 5; }
    if (xh == null) continue;
    tomados.push([xh - 1, xh + ancho + 1]);
    C.estantes.push({ clavo: true, px: xh + Math.floor(ancho / 2), py: yh, x: deAx(xh + ancho / 2), yPared, x0, yArr });
    const xw = deAx(xh + Math.floor(ancho / 2));
    C.objetos.push({
      tipo: sombrero ? 'sombrero' : 'cinto', peso: 'nada', hw: 5, x: xw, xRepisa: xw, yRepisa: deAy(yh + alto), yPared,
      yPiso: yPared + 6 + Math.round(azar(c, 7) * 6), fijo: true, estado: 'repisa', t: 0, dir: 0, wagon: w.id,
    });
  }
  // --- la pila de munición del rincón (las 'R').
  for (let f = filasArriba; f < map.rows; f++) for (let c = 0; c < cols; c++) {
    if (casilla(c, f) !== 'R' || casilla(c - 1, f) === 'R' || casilla(c, f - 1) === 'R') continue;
    let c2 = c; while (casilla(c2 + 1, f) === 'R') c2++;
    const x = ax(w.x + c * S) + 1, x2 = ax(w.x + (c2 + 1) * S) - 1, yb = ay((f + 1) * S) - 2;
    const cw = Math.floor((x2 - x - 1) / 2);
    C.pilas.push({
      tipo: 'municion', x: deAx((x + x2) / 2), yTope: deAy(yb - 24), yBase: deAy(yb) + P, hw: ((x2 - x) * P) / 2, hh: 8,
      cw, atras: c < cols / 2, arriba: [], estado: 'quieta', t: 0, wagon: w.id,
    });
  }
}

// (🐛 El ala medía un punto más que la copa y la copa bajaba corrida un punto a la derecha: ahora las dos, de 15 y centradas.)
const SOMBRERO_COLGADO = ['.....ooooo.....', '....oHHHHHo....', '....ohhhhho....', '....obbbbbo....', '.oooohhhhhoooo.', 'okkkkkkkkkkkkko', '.ooooooooooooo.'];
const SOMB = { o: 0, h: 35, H: 36, b: 32, k: 34 };
const CINTO_COLGADO = ['....oooo....', '...occcco...', '..occoocco..', '..oco..oco..', '.oyco..ocyo.', '..oco..oco..', '.oyco..ocyo.', '..oco..oco..', '.oyco..ocyo.', '..oco..oco..', '..oco..oooo.', '.oGGo.occcco', '..oo..occcco', '......occcco', '.......occo.', '........oo..'];
const CU = { o: 0, c: 5, y: 28, G: 7 };

/** 📦 La caja de munición: la tapa, la cara con lo pintado y la manija de soga. 12×9. */
function cajaDeMunicion(R) {
  R(0, 0, 12, 9, 0);
  R(1, 1, 10, 3, 5); R(1, 1, 10, 1, 6);
  R(1, 4, 10, 4, 4); R(1, 4, 1, 4, 3); R(10, 4, 1, 4, 3);
  R(3, 5, 6, 1, 31); R(3, 6, 2, 1, 31);
  R(5, 2, 2, 1, 16);
}

/** 📦 La pila de munición del rincón: dos cajas abajo y una arriba (las del dibujo de siempre), de ancho `cw`. */
export function pintarPilaMunicion(R, cw) {
  const caja = (cx, cy, ww, hh) => {
    R(cx - 1, cy - 1, ww + 2, hh + 2, 0);
    R(cx, cy, ww, 4, 5); R(cx, cy, ww, 1, 6);
    R(cx, cy + 4, ww, hh - 4, 4); R(cx, cy + 4, 1, hh - 4, 3); R(cx + ww - 1, cy + 4, 1, hh - 4, 3);
    R(cx + 3, cy + 6, ww - 6, 1, 31); R(cx + 3, cy + 8, 2, 1, 31);
  };
  caja(1, 13, cw, 12); caja(cw + 2, 13, cw, 12); caja(1 + Math.floor(cw / 2), 2, cw, 11);
}

/** 📦 Una caja de la pila que sale deslizándose (la misma de la pila, de ancho `cw`). */
export function pintarCajaDeslizandose(R, cw) {
  R(0, 0, cw + 2, 14, 0);
  R(1, 1, cw, 4, 5); R(1, 1, cw, 1, 6);
  R(1, 5, cw, 8, 4); R(1, 5, 1, 8, 3); R(cw, 5, 1, 8, 3);
  R(4, 7, cw - 6, 1, 31); R(4, 9, 2, 1, 31);
}

/** 🪵 El estante de tablas (sobre dos ménsulas) o el clavo de la pared. */
function dibujarEstante(r, e) {
  const P = PASO();
  const luz = estiloNuevo.luzEn ? Math.round(estiloNuevo.luzEn(e.x, e.yPared + 4) || 0) : 0;
  const R = pintor(r.ctx, Math.round(e.x0 / P), Math.round(e.yArr / P), luz);
  if (e.clavo) { R(e.px, e.py - 2, 1, 1, 0); R(e.px, e.py - 1, 1, 1, 25); return; }
  R(e.px - 1, e.py, e.w + 2, 3, 0); R(e.px, e.py + 1, e.w, 1, 5); R(e.px, e.py, e.w, 1, 6);
  R(e.px, e.py + 3, e.w, 2, 1);                                          // la sombra en la pared
  for (const mx of [e.px + 2, e.px + e.w - 4]) { R(mx - 1, e.py + 2, 3, 6, 0); for (let q = 0; q < 4; q++) R(mx + (q < 2 ? 0 : 1), e.py + 3 + q, 1, 1, 4); }
}

/**
 * 🔫 EL WINCHESTER DEL ARMERO: parado en su lugar (el mismo dibujo de siempre: el caño con el tubo del cargador, la
 * tapa, el cajón de bronce, la palanca en lazo y la culata); en el aviso se sacude en el gancho; cayendo, derecho
 * para abajo; tirado, acostado en el piso (un dibujo puesto a mano, con la culata a la izquierda).
 */
const ARMA = { o: 0, B: 25, T: 24, w: 5, W: 4, y: 28, Y: 7, D: 31 };
const ABAJO_RIFLE = ['owWo..', 'owWo..', 'oyYYo.', 'oyYYo.', 'oyYYo.', 'owWoY.', 'owWo.Y', 'owWoY.', 'owWWo.', 'owWWWo', 'owWWWo', 'oDDDDo', 'oooooo'];
const RIFLE_TIRADO = [
  '.ooo...........ooooooooooo.',
  'oWWWoooooooooooBBBBBBBBBBBo',
  'oWWWWWwwoyYYyooTTTTTTTTTTo.',
  'oDWWooooo.Y.ooooooooooooo..',
  '.oo.....oYo................',
];
function dibujarRifle(r, o, x, y) {
  const P = PASO(), K = CONFIG.caidas;
  const luz = estiloNuevo.luzEn ? Math.round(estiloNuevo.luzEn(o.x, o.yPiso) || 0) : 0;
  if (o.estado === 'piso') {
    pintarTapando(r.ctx, Math.round(o.x / P) - 13, Math.round(o.yPiso / P) - 5, 27, 5, luz, (R) => dibujarMapa(R, 0, 0, RIFLE_TIRADO, ARMA));
    return;
  }
  const cano = o.largo - ABAJO_RIFLE.length - 2;
  const filas = ['.o....', 'oBo...', ...Array(Math.max(0, cano)).fill('oBTo..'), ...ABAJO_RIFLE];
  const sacude = o.estado === 'aviso' || (o.estado === 'cae' && o.t < 0) ? (Math.floor(o.t * 16) % 2 ? 1 : 0) : 0;
  const ox = Math.round(x / P) - 2 + sacude, oy = Math.round(y / P) - filas.length;
  pintarTapando(r.ctx, ox, oy, 6, filas.length, luz, (R) => dibujarMapa(R, 0, 0, filas, ARMA));
}

// ------------------------------------------------------------------------------------------------------ el comedor

/**
 * 🍽️ LA ALACENA, medida en puntos del dibujo (la usan el dibujo fijo, world/estiloNuevo/vagones.js, y lo que se cae).
 * `ay` pasa del mundo a los puntos; `yA`, la pared del fondo de su fila. El aparador llega hasta 12 unidades de la
 * pared (un metro) y tiene 14 puntos de alto; el estante, playo (4 unidades), sube 26 puntos más desde la mesada.
 * (🔁 Antes el aparador era de 20 unidades: casi dos metros de hondo, una mesada enorme.)
 */
export function medidasAlacena(ay, yA) {
  const ALTO_AP = 14, ALTO_EST = 26;
  const pie = ay(yA + 12), frente = pie - ALTO_AP, mesada = ay(yA + 4) - ALTO_AP;
  const cornisa = mesada - ALTO_EST, techo = ay(yA) - ALTO_AP - ALTO_EST;
  const tablas = [cornisa + 9, cornisa + 18];
  // Donde apoya lo que lleva: en cada tabla y, abajo, en la mesada (contra el estante).
  return { pie, frente, mesada, cornisa, techo, tablas, niveles: [tablas[0], tablas[1], mesada + 3] };
}

/**
 * 🍽️ EL COMEDOR *(Santi eligió "alacena en la punta", que los faroles "solo se hamacan" y los barriles "junto a cada
 * puerta")*:
 *  - LA ALACENA ('V'): lo de sus tres niveles —los platos parados, la cafetera con los jarros, las latas y la olla— se
 *    cae para adelante, al piso de delante del aparador (liviano: media vida).
 *  - LA VAJILLA DE LAS MESAS (la que dibujaba el dibujo fijo, en los mismos lugares): en el frenazo y el arrancón cada
 *    pieza se desliza por la tabla lo suyo (algunas no se mueven), y la que llega a la punta se cae al piso. Es de lata:
 *    no lastima.
 *  - LOS BARRILES DE COMIDA ('R'), uno o dos a cada lado de cada puerta, de porotos o de harina: se vuelcan hacia el
 *    pasillo y salen rodando (como el baúl: te tiran al piso, quietos chocan y son cobertura, y cada sacudón los vuelve
 *    a mover). Al que se le salta la tapa va dejando lo que lleva; reventado, queda el montón.
 * Los faroles no se caen: se hamacan con el tren, como en todos los vagones.
 */
function comedor(C, train, w) {
  const map = train.map, S = map.size, tc = CONFIG.tresCuartos, P = PASO();
  const cols = Math.round(w.width / S);
  const casilla = (c, f) => (map.grid[f] || [])[w.colStart + c];
  const esPared = (f) => casilla(Math.floor(cols / 2), f) === '#' || casilla(Math.floor(cols / 2), f) === 'W';
  let filasArriba = 0; while (esPared(filasArriba)) filasArriba++;
  let filasAbajo = 0; while (esPared(map.rows - 1 - filasAbajo)) filasAbajo++;
  const x0 = Math.floor(w.x / P) * P, yArr = -tc.alturaPared;
  const ax = (u) => Math.round((u - x0) / P), ay = (u) => Math.round((u - yArr) / P);
  const deAx = (pt) => x0 + pt * P, deAy = (pt) => yArr + pt * P;
  // --- la alacena: dos cosas por nivel.
  for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 0; c < cols; c++) {
    if (casilla(c, f) !== 'V' || casilla(c - 1, f) === 'V' || casilla(c, f - 1) === 'V') continue;
    let c2 = c; while (casilla(c2 + 1, f) === 'V') c2++;
    const x = ax(w.x + c * S) + 1, x2 = ax(w.x + (c2 + 1) * S) - 1, aw = x2 - x;
    const A = medidasAlacena(ay, f * S), yPiso = (f + 1) * S;
    const vuelta = azar(w.colStart, 41) < 0.5;
    const niveles = [['platos', 'jarros'], ['latas', 'platos'], ['olla', 'jarros']];
    niveles.forEach((dos, k) => (vuelta ? [...dos].reverse() : dos).forEach((que, q) => {
      const cx = x + Math.round(aw * (q ? 0.71 : 0.29)) + Math.round((azar(k, q + w.colStart) - 0.5) * 6);
      const xw = deAx(cx);
      C.objetos.push({
        tipo: 'vajilla', variante: que, peso: 'liviano', hw: 6, x: xw, xRepisa: xw, yRepisa: deAy(A.niveles[k]), yPared: yPiso,
        yPiso: yPiso + 4 + Math.round(azar(k * 3 + q, w.colStart) * 12), estado: 'repisa', t: 0, dir: 0, wagon: w.id,
      });
    }));
  }
  // --- la vajilla de las mesas: 0 servida, 1 a medio comer, 2 vacía (como la dibujaba el dibujo fijo).
  for (let c = 0; c < cols; c++) for (let f = filasArriba; f < map.rows - filasAbajo; f++) {
    if (casilla(c, f) !== 'C' || casilla(c - 1, f) === 'C' || casilla(c, f - 1) === 'C') continue;
    let c2 = c; while (casilla(c2 + 1, f) === 'C') c2++;
    let f2 = f; while (casilla(c, f2 + 1) === 'C') f2++;
    const x = ax(w.x + c * S), x2 = ax(w.x + (c2 + 1) * S), y = ay(f * S), y2 = ay((f2 + 1) * S);
    const base = (f2 + 1) * S - 0.01;
    const ALTO_MESA = 11, ancho = x2 - x - 4, ty = y - ALTO_MESA + 2, hondo = y2 - ALTO_MESA - ty;
    const mesa = { xa: deAx(x + 2), xb: deAx(x + 2 + ancho) };
    const pieza = (variante, px, py) => {
      const D = VAJILLA[variante].arriba, xw = deAx(px + Math.floor(D[0].length / 2));
      C.objetos.push({
        tipo: 'vajilla', variante, peso: 'nada', hw: (D[0].length * P) / 2, x: xw, xRepisa: xw, yRepisa: deAy(py + D.length),
        yPared: base + 0.002, yPiso: base + 3 + Math.round(azar(px, py) * 8), mesa, enMesa: true, estado: 'repisa', t: 0, dir: 0, wagon: w.id,
      });
    };
    const estado = Math.floor(azar(c * 3 + 1, f * 5 + w.colStart) * 3);
    const filasPlato = [ty + Math.round(hondo * 0.22), ty + Math.round(hondo * 0.62)];
    [x + 4, x2 - 13].forEach((lx, li) => filasPlato.forEach((py, pi) => {
      const k = li * 2 + pi, h = azar(c + k, f + 17);
      if (estado === 2 && h < 0.6) return;
      pieza(estado === 0 ? 'platoLleno' : estado === 1 && h < 0.5 ? 'platoMedio' : 'plato', lx + (li ? 0 : 1), py);
      if (h > 0.35) pieza('jarro', li ? lx - 5 : lx + 8, py - 1);
    }));
    const cx = x + Math.floor(ancho / 2);
    if (estado < 2) pieza('cafetera', cx - 2, ty + Math.round(hondo * 0.3));
    if (estado === 0) pieza('pan', cx - 3, ty + Math.round(hondo * 0.62));
  }
  // --- los barriles de comida, junto a las puertas (las 'R'): uno por casilla, parados al borde del pasillo.
  for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 0; c < cols; c++) {
    if (casilla(c, f) !== 'R' || casilla(c - 1, f) === 'R') continue;
    let c2 = c; while (casilla(c2 + 1, f) === 'R') c2++;
    const dy = f < map.rows / 2 ? 1 : -1;                                   // para dónde queda el pasillo
    const x = w.x + ((c + c2 + 1) / 2) * S;
    const barriles = [];
    // (🔁 Pegados a la pared de la puerta *(Santi: "los pegaría a la pared de la puerta para que no molesten tanto cuando no
    // están rodando")*: antes cada uno iba en el medio de su casilla.)
    const pegado = CONFIG.tresCuartos.paredPunta + 6 + 1, izq = c < cols / 2;
    for (let k = 0; k <= c2 - c; k++) {
      const xb = izq ? w.x + pegado + k * 12.5 : w.x + w.width - pegado - k * 12.5;
      barriles.push({ dx: xb - x, contenido: azar((izq ? c + k : c2 - k) * 5, f + w.colStart) < 0.5 ? 0 : 1 });
    }
    const yBase = dy > 0 ? (f + 1) * S - 3 : f * S + 7;
    C.pilas.push({
      tipo: 'barriles', x, yTope: yBase - 6, yBase, hw: ((c2 - c + 1) * S) / 2, hh: 3, dy, barriles,
      atras: c < cols / 2, arriba: [], estado: 'quieta', t: 0, wagon: w.id,
    });
  }
}

/** 🍽️ En el aviso del golpe, cada pieza de la mesa decide si se mueve, cuánto y cuándo (algunas se quedan). */
function planearVajilla(o, sentido, rng) {
  const K = CONFIG.caidas.vajilla;
  if (rng.chance(K.quieta)) { o.planDx = 0; return; }
  o.planDx = -sentido * rng.range(K.desliza[0], K.desliza[1]);
  o.deslDemora = rng.range(0, 0.3);
  o.correA = rng.range(3, 9);
  o.dura = CONFIG.caidas.caeDura * rng.range(0.6, 0.9);
}

/** 🍽️ La pieza se desliza por la tabla; si llega a la punta de la mesa, se cae (y queda en el piso, como todo). */
function deslizarVajilla(o, dt) {
  if (o.estado !== 'repisa' || !o.planDx) { o.deslizando = false; return; }
  o.deslDemora -= dt;
  if (o.deslDemora > 0) return;
  const s = Math.sign(o.planDx), paso = Math.min(Math.abs(o.planDx), CONFIG.caidas.vajilla.velocidad * dt);
  o.xRepisa += s * paso; o.x = o.xRepisa; o.planDx -= s * paso;
  if (o.xRepisa - o.hw < o.mesa.xa || o.xRepisa + o.hw > o.mesa.xb) {
    o.estado = 'cae'; o.t = 0; o.dir = s; o.enMesa = false; o.deslizando = false; o.yPiso0 = o.yPiso;
    return;
  }
  if (!o.planDx) o.deslizando = false;
}

/**
 * 🍽️ LA VAJILLA, pieza por pieza, puesta a mano: parada (en la mesa o en la alacena), tirada en el piso y rota (de un
 * tiro: abollada). De lata esmaltada, blanca con el borde azul; la cafetera de lata gris; el pan; las latas del café
 * y del azúcar; la olla de fierro.
 */
const VAJILLA_COL = { o: 0, b: 20, w: 17, s: 16, c: 3, h: 4, g: 24, G: 25, d: 23, p: 6, P: 7, R: 9, W: 17, E: 24, e: 23, K: 23, k: 31 };
const VAJILLA = {
  // --- de las mesas
  plato: { arriba: ['.bbbbb.', 'bwwwwwb', 'bwwwwwb', '.bbbbb.'], piso: ['.bbbbb.', 'bwwwwwb', '.bbbbb.'], roto: ['.bb.bb.', 'bwwsswb', '.bbbbb.'] },
  platoLleno: { arriba: ['.bbbbb.', 'bwchcwb', 'bwhchwb', '.bbbbb.'], piso: ['.bbbbb.ch.', 'bwwwwwbhch', '.bbbbb..c.'] },
  platoMedio: { arriba: ['.bbbbb.', 'bwwchwb', 'bwwwwwb', '.bbbbb.'], piso: ['.bbbbb..', 'bwwwwwbh', '.bbbbb..'] },
  jarro: { arriba: ['bbb.', 'wwwb', 'swwb', 'sww.'], piso: ['bbbb..', 'wwwwbc', 'ssss.c'] },
  cafetera: { arriba: ['.dd..', 'gGgg.', 'gGggd', 'gggg.', 'dddd.'], piso: ['.gggg..', 'dGGGGgd', '.gggg.c', '..cccc.'] },
  pan: { arriba: ['.pPp.', 'ppppp', '.hhh.'], piso: ['.pPp.', 'ppppp', '.hhh.'] },
  // --- de la alacena (🔁 los platos, apilados: parados de canto parecían cajitas; la olla, de fierro gris: negra era una mancha)
  platos: {
    arriba: ['...bbbbbbbb...', '.bbwwwwwwwwbb.', 'bwwwsssssswwwb', '.bbwwwwwwwwbb.', '.wwbbbbbbbbww.', '..bbbbbbbbbb..'],
    piso: ['.bbbbb.....bbbbb..', 'bwwwwwb...bwwwwwb.', '.bbbbb.....bbbbb..', '.....bbbbb........', '....bwwwwwb.......', '.....bbbbb........'],
    roto: ['.bb.bb.....bbbbb..', 'bwwsswb...bwswswb.', '.bbbbb.....bb.bb..', '.....bbbbb........', '....bwssswb.......', '.....bb.bb........'],
  },
  jarros: {
    arriba: ['.dd...........', 'gGgg..bbb.bbb.', 'gGggd.wwwbwwwb', 'gggg..swwbswwb', 'dddd..sww.sww.'],
    piso: ['..gggg..........', 'dgGGGgd...bwb...', '..gggg.c..bwwb..', '......ccc..bb.bb', '.......cc....bwb'],
  },
  latas: {
    arriba: ['.oooo..ooo..', 'oRRRRo.oEEo.', 'oWWWWo.oEeo.', 'oRRRRo.oEeo.', 'oRRRRo.oEeo.', '.oooo..ooo..'],
    piso: ['.oooooo......', 'oRRWRRRo.ooo.', '.oooooo.oEeEo', '..cccc...ooo.', '.cc..c.......'],
  },
  olla: {
    arriba: ['....oo....', '..oooooo..', '.oEEEEEEo.', 'oooooooooo', 'oEeeeeekEo', 'oEeeeeekEo', '.oEeeekEo.', '..oooooo..'],
    piso: ['....oooo....oo', '..ooeeeeoo.oEo', '.oEeeeeeeko.oo', 'oEeeeeeeeko...', '.oeeeeeeeko...', '..oooooooo....'],
  },
};

/** 🍽️ Una pieza de vajilla, con la base en (x, y) del mundo. */
function dibujarVajilla(r, o, frame, x, y) {
  const P = PASO(), V = VAJILLA[o.variante];
  const D = frame === 'arriba' ? V.arriba : frame === 'roto' ? (V.roto || V.piso) : V.piso;
  const luz = estiloNuevo.luzEn ? Math.round(estiloNuevo.luzEn(x, Math.max(y, 34)) || 0) : 0;
  const w = D[0].length, h = D.length;
  pintarTapando(r.ctx, Math.round(x / P) - Math.floor(w / 2), Math.round(y / P) - h, w, h, luz, (R) => dibujarMapa(R, 0, 0, D, VAJILLA_COL));
}

/**
 * 🛢️ EL BARRIL DE COMIDA, de duelas de madera con dos zunchos de fierro (como el barril de agua del caboose, más chico).
 * Dibujos puestos a mano: PARADO (la tapa de tablas arriba, las duelas, los zunchos), CAYÉNDOSE (la tapa ya mira para
 * acá, achatada), ACOSTADO (rodando por el pasillo: arriba la panza, con los zunchos en arco, y abajo la tapa de frente)
 * y ROTO (un zuncho suelto, las duelas y el montón de lo que llevaba).
 * Rodando, la tapa da la vuelta en ocho cuadros (las juntas de las tablas y la marca quemada, cada uno a mano en
 * `TAPA_GIRA`) y por la panza corren las juntas de las duelas y el tapón (`PANZA_GIRA`, elegidos a mano para cada
 * cuadro): así se lee que rueda y no que se desliza. Sin tapa, se ve lo de adentro, siempre abajo (`TAPA_ABIERTA`).
 * `contenido`: 0 porotos, 1 harina (el de harina, con la tapa empolvada).
 */
const BARRIL = { o: 0, T: 6, t: 5, j: 4, L: 6, D: 5, d: 4, s: 3, z: 23, Z: 31 };
const TAPA_COL = { o: 0, T: 6, j: 4, r: 3, b: 31, 1: 1 };   // (🔁 la tapa, clara: de noche, en sombra, el barril tumbado era una mancha)
const CONTENIDO_COL = [{ C: 12, c: 47 }, { C: 17, c: 16 }, { C: 33, c: 33 }];   // (🚂 el 2: agua, la madera mojada)
export const BARRIL_PARADO = [
  '...oooooooooo...',
  '..oTTjTTTTjTTo..',
  '.oTTTjTTTTjTTto.',
  '.oLLDDDDDDDDDso.',
  '.ozzzzzzzzzzzzo.',
  '.oZZZZZZZZZZZZo.',
  'oLLDDdDDdDDdDDso',
  'oLLDDdDDdDDdDDso',
  'oLLDDdDDdDDdDDso',
  'oLLDDdDDdDDdDDso',
  'oLLDDdDDdDDdDDso',
  'oLLDDdDDdDDdDDso',
  '.oLDDdDDdDDdDso.',
  '.ozzzzzzzzzzzzo.',
  '.oZZZZZZZZZZZZo.',
  '.oLDDdDDdDDdDso.',
  '..oooooooooooo..',
];
/** La harina que quedó en la tapa del de harina (parado). */
const HARINA_EN_LA_TAPA = [[4, 1], [8, 2], [11, 1], [6, 2], [3, 2], [9, 1]];
/**
 * La panza del acostado, lo poco que se ve por encima de la tapa (desde acá, un barril tumbado es casi todo tapa): el
 * canto de la tapa de allá (el arco), el zuncho de allá en arco y la panza; abajo va la tapa de frente.
 * (🔁 Antes la panza era larga, con los dos zunchos: tumbado se leía como un barril parado.)
 */
const BARRIL_PANZA = [
  '.....oooooo.....',
  '...ooLLLDDDoo...',
  '..oDDzzzzzzDdo..',
  '.odzzZZZZZZzzdo.',
  '.ozZZLLLDDDZZzo.',
  'ozZDDLLLDDDDdZzo',
  'oZdDDLLLDDDDddZo',
  'osdDDDDDDDDDDdso',
  'ossDDDDDDDDDDsso',
  'osssssssssssssso',
  'osssssssssssssso',
];
/** Dónde empieza la panza en cada columna (el arco de la tapa de allá). */
const TOPE_PANZA = [5, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 2, 3, 5];
/** Por cuadro: en qué columnas se ven las juntas de las duelas y dónde va el tapón (corre de izquierda a derecha y se esconde). */
const PANZA_GIRA = [
  { juntas: [4, 7, 11], tapon: [7, 8] },
  { juntas: [2, 5, 10, 13], tapon: [13] },
  { juntas: [4, 7, 11], tapon: [14] },
  { juntas: [2, 5, 10, 13], tapon: [] },
  { juntas: [4, 7, 11], tapon: [] },
  { juntas: [2, 5, 10, 13], tapon: [] },
  { juntas: [4, 7, 11], tapon: [1] },
  { juntas: [2, 5, 10, 13], tapon: [2] },
];
/** La tapa de frente, dando la vuelta (de a un octavo, para el lado de las agujas del reloj): las tablas y la marca. */
const TAPA_GIRA = [
  ['.....oooooo.....', '...oorrrrrroo...', '..orrjTTTTjrro..', '.orTTjTbbTjTTro.', '.orTTjTbbTjTTro.', 'orTTTjTTTTjTTTro', 'orTTTjTTTTjTTTro', 'orTTTjTTTTjTTTro', 'orTTTjTTTTjTTTro', 'orTTTjTTTTjTTTro', '.orTTjTTTTjTTro.', '.orTTjTTTTjTTro.', '..orrjTTTTjrro..', '...oorrrrrroo...', '.....oooooo.....'],
  ['.....oooooo.....', '...oorrrrrroo...', '..orrTTTTjTrro..', '.orTTTTTjTTTTro.', '.orTTTTjTbbTTro.', 'orTTTTjTTbbTTjro', 'orTTTjTTTTTTjTro', 'orTTjTTTTTTjTTro', 'orTjTTTTTTjTTTro', 'orjTTTTTTjTTTTro', '.orTTTTTjTTTTro.', '.orTTTTjTTTTTro.', '..orrTjTTTTrro..', '...oorrrrrroo...', '.....oooooo.....'],
  ['.....oooooo.....', '...oorrrrrroo...', '..orrTTTTTTrro..', '.orTTTTTTTTTTro.', '.orTTTTTTTTTTro.', 'orjjjjjjjjjjjjro', 'orTTTTTTTTbbTTro', 'orTTTTTTTTbbTTro', 'orTTTTTTTTTTTTro', 'orjjjjjjjjjjjjro', '.orTTTTTTTTTTro.', '.orTTTTTTTTTTro.', '..orrTTTTTTrro..', '...oorrrrrroo...', '.....oooooo.....'],
  ['.....oooooo.....', '...oorrrrrroo...', '..orrTjTTTTrro..', '.orTTTTjTTTTTro.', '.orTTTTTjTTTTro.', 'orjTTTTTTjTTTTro', 'orTjTTTTTTjTTTro', 'orTTjTTTTTTjTTro', 'orTTTjTTTTTTjTro', 'orTTTTjTTbbTTjro', '.orTTTTjTbbTTro.', '.orTTTTTjTTTTro.', '..orrTTTTjTrro..', '...oorrrrrroo...', '.....oooooo.....'],
  ['.....oooooo.....', '...oorrrrrroo...', '..orrjTTTTjrro..', '.orTTjTTTTjTTro.', '.orTTjTTTTjTTro.', 'orTTTjTTTTjTTTro', 'orTTTjTTTTjTTTro', 'orTTTjTTTTjTTTro', 'orTTTjTTTTjTTTro', 'orTTTjTTTTjTTTro', '.orTTjTbbTjTTro.', '.orTTjTbbTjTTro.', '..orrjTTTTjrro..', '...oorrrrrroo...', '.....oooooo.....'],
  ['.....oooooo.....', '...oorrrrrroo...', '..orrTTTTjTrro..', '.orTTTTTjTTTTro.', '.orTTTTjTTTTTro.', 'orTTTTjTTTTTTjro', 'orTTTjTTTTTTjTro', 'orTTjTTTTTTjTTro', 'orTjTTTTTTjTTTro', 'orjTTbbTTjTTTTro', '.orTTbbTjTTTTro.', '.orTTTTjTTTTTro.', '..orrTjTTTTrro..', '...oorrrrrroo...', '.....oooooo.....'],
  ['.....oooooo.....', '...oorrrrrroo...', '..orrTTTTTTrro..', '.orTTTTTTTTTTro.', '.orTTTTTTTTTTro.', 'orjjjjjjjjjjjjro', 'orTTTTTTTTTTTTro', 'orTTbbTTTTTTTTro', 'orTTbbTTTTTTTTro', 'orjjjjjjjjjjjjro', '.orTTTTTTTTTTro.', '.orTTTTTTTTTTro.', '..orrTTTTTTrro..', '...oorrrrrroo...', '.....oooooo.....'],
  ['.....oooooo.....', '...oorrrrrroo...', '..orrTjTTTTrro..', '.orTTTTjTTTTTro.', '.orTTbbTjTTTTro.', 'orjTTbbTTjTTTTro', 'orTjTTTTTTjTTTro', 'orTTjTTTTTTjTTro', 'orTTTjTTTTTTjTro', 'orTTTTjTTTTTTjro', '.orTTTTjTTTTTro.', '.orTTTTTjTTTTro.', '..orrTTTTjTrro..', '...oorrrrrroo...', '.....oooooo.....'],
];
const TAPA_ABIERTA = ['.....oooooo.....', '...oorrrrrroo...', '..orr111111rro..', '.or1111111111ro.', '.or1111111111ro.', 'or111111111111ro', 'or111111111111ro', 'or111111111111ro', 'orCCCCCCCCCCCCro', 'orccccccccccccro', '.orccccccccccro.', '.orccccccccccro.', '..orrccccccrro..', '...oorrrrrroo...', '.....oooooo.....'];
const TAPA_CAYENDO = ['.....oooooo.....', '..ooorrrrrrooo..', '.orrTTTTTTTTrro.', 'orTTTTTTTTTTTTro', 'orTTTjTTTTjTTTro', 'orTTTjTTTTjTTTro', 'orTTTTTTTTTTTTro', '.orrTTTTTTTTrro.', '..ooorrrrrrooo..', '.....oooooo.....'];
const BARRIL_ROTO = [
  '..........ooooo.............',
  '.ooooo...oCCCCCo...oooooooo.',
  'oZZZZZo.oCCCCCCCo.oLLDDDDDDo',
  'oZ...Zo.oCcCCCcCCo.oooooooo.',
  'oZZZZZooCCCCcCCCCCo.oooooo..',
  '.ooooo.ocCCCCCCcCCCco.oDDDDo',
  '..c...occcccccccccccco.oooo.',
  '.c..c..ooooooooooooooo..c...',
  '..........c.....c.......c...',
];
const TAPA_TIRADA = ['..oooooooooo..', '.oTTjTTTjTTTo.', 'oTTTjTTTjTTTto', '.ottjtttjttto.', '..oooooooooo..'];
/** Cuánto mide cada pose del barril (16 de ancho). */
export const ALTO_BARRIL = { parado: BARRIL_PARADO.length, inclinado: 17, acostado: 21 };

/**
 * 🛢️ Pinta el barril en su lienzo de 16 de ancho: `pose` 'parado', 'inclinado' o 'acostado'; `cuadro`, la vuelta (0 a 7);
 * `abierto`: se le saltó la tapa.
 */
export function pintarBarril(R, pose, cuadro, contenido, abierto = false) {
  if (pose === 'parado') {
    dibujarMapa(R, 0, 0, BARRIL_PARADO, BARRIL);
    if (contenido) for (const [x, y] of HARINA_EN_LA_TAPA) R(x, y, 1, 1, 17);
    return;
  }
  const k = ((cuadro % 8) + 8) % 8;
  const panza = (filas) => {
    dibujarMapa(R, 0, 0, BARRIL_PANZA.slice(0, filas), BARRIL);
    const G = PANZA_GIRA[pose === 'acostado' ? k : 0];
    for (const jx of G.juntas) for (let y = TOPE_PANZA[jx] + 1; y < filas; y++) {
      const ch = BARRIL_PANZA[y][jx];
      if (ch === 'L' || ch === 'D' || ch === 'd') R(jx, y, 1, 1, ch === 'd' ? 3 : 4);
    }
    for (const tx of G.tapon) { R(tx, TOPE_PANZA[tx] + 4, 1, 1, 0); R(tx, TOPE_PANZA[tx] + 5, 1, 1, 31); }
  };
  // Cayéndose: la tapa de arriba ya casi de frente, y debajo lo que queda a la vista de las duelas.
  if (pose === 'inclinado') { dibujarMapa(R, 0, 6, BARRIL_PARADO.slice(6), BARRIL); dibujarMapa(R, 0, 0, TAPA_CAYENDO, TAPA_COL); return; }
  panza(BARRIL_PANZA.length);
  dibujarMapa(R, 0, 6, abierto ? TAPA_ABIERTA : TAPA_GIRA[k], { ...TAPA_COL, ...CONTENIDO_COL[contenido || 0] });
}

/** 🛢️ El barril reventado: queda en el piso con su montón, y lo que llevaba desparramado alrededor. */
export function barrilRoto(C, x, yPiso, contenido) {
  C.objetos.push({ tipo: 'barril', variante: contenido || 0, peso: 'nada', hw: 10, x, xRepisa: x, yRepisa: yPiso, yPared: yPiso - 2 * CONFIG.tileSize, yPiso, fijo: true, estado: 'roto', t: 0, dir: 0 });
  for (let k = 0; k < 16; k++) derramar(C, x + (azar(k, Math.round(x)) - 0.5) * 32, yPiso - 4 + (azar(Math.round(x), k) - 0.5) * 10, contenido, k % 3);
}

/** 🛢️ La tapa que se le saltó a un barril, tirada en el piso (se desliza con los sacudones, se rompe de un tiro). */
export function tapaSaltada(C, x, yPiso) {
  C.objetos.push({ tipo: 'tapa', peso: 'nada', hw: 5, x, xRepisa: x, yRepisa: yPiso, yPared: yPiso - 2 * CONFIG.tileSize, yPiso, estado: 'piso', t: 0, dir: 0 });
}

/** 🛢️ Un puñado de lo que lleva el barril (porotos o harina), en el piso. */
export function derramar(C, x, y, contenido, k) {
  C.derrames.push({ x, y, c: contenido || 0, k, nace: C.reloj || 0 });
  if (C.derrames.length > 900) C.derrames.shift();
}

/**
 * Un puñado en el piso: porotos (0), harina (1) o agua (2). 🚂 El agua es la madera mojada, más oscura, con algún brillo,
 * y se va secando: en `SECA_AGUA` segundos se achica y desaparece.
 */
const SECA_AGUA = 90;
function pintarDerrame(r, q, P, reloj) {
  const luz = estiloNuevo.luzEn ? Math.round(estiloNuevo.luzEn(q.x, q.y) || 0) : 0;
  const R = pintor(r.ctx, Math.round(q.x / P), Math.round(q.y / P), luz);
  if (q.c === 2) {
    const edad = (reloj - (q.nace || 0)) / SECA_AGUA;
    if (edad >= 1) return;
    if (edad > 0.6) { R(0, 0, 1, 1, 33); return; }
    R(0, 0, 3, 1, 33); if (q.k === 2) R(0, 1, 2, 1, 33); if (q.k === 1) R(1, 0, 1, 1, 30);
    return;
  }
  if (q.c) { R(0, 0, 2, 1, q.k ? 16 : 17); if (q.k === 2) R(1, 1, 1, 1, 16); }
  else { R(0, 0, 1, 1, q.k ? 47 : 12); if (q.k === 2) R(1, 1, 1, 1, 47); }
}

DIBUJOS.barril = {
  roto: { w: 28, h: 9, pintar: (R, v) => dibujarMapa(R, 0, 0, BARRIL_ROTO, { o: 0, Z: 31, L: 6, D: 5, ...CONTENIDO_COL[v || 0] }) },
};
DIBUJOS.tapa = {
  piso: { w: 14, h: 5, pintar: (R) => dibujarMapa(R, 0, 0, TAPA_TIRADA, { o: 0, T: 6, t: 5, j: 4 }) },
  // Rota: partida en dos.
  roto: { w: 16, h: 5, pintar: (R) => { dibujarMapa(R, 0, 0, TAPA_TIRADA.map((f) => f.slice(0, 7)), { o: 0, T: 6, t: 5, j: 4 }); dibujarMapa(R, 9, 0, TAPA_TIRADA.map((f) => f.slice(7)), { o: 0, T: 6, t: 5, j: 4 }); } },
};

// --------------------------------------------------------------------------------------------------- el dormitorio

/**
 * 🛏️ EL DORMITORIO *(Santi eligió "sólo el lavatorio", nada desde arriba en los camarotes de abajo, "el baúl de camarote
 * y pila de valijas: las dos cosas para que no sea todo igual" y que el frenazo despierte a los que duermen)*:
 *  - EL LAVATORIO de cada camarote de arriba: la jarra y la palangana de loza (las mismas que dibujaba el dibujo fijo)
 *    se tambalean, caen delante del mueble y se rompen: quedan los pedazos y el charco que moja la madera. Caen de poca
 *    altura: no lastiman.
 *  - EL SACO del perchero se cae del gancho, sin lastimar.
 *  - EN LOS RINCONES DE LAS PUERTAS, pegados a la pared: en uno, un baúl de camarote de lona y tablas (el de primera
 *    clase, de clase media: se vuelca hacia el pasillo, te tira al piso, quieto choca y cada sacudón lo vuelve a mover);
 *    en el otro, una pila de valijas sobre un baúl que no se mueve (las valijas salen deslizándose). Cuál va en cada
 *    rincón, se sortea en cada tren.
 * (Los que duermen se despiertan con el chirrido: ver `cubrirPasajeros` en scenes/raidScene.js.)
 */
function dormitorio(C, train, w) {
  const map = train.map, S = map.size, tc = CONFIG.tresCuartos, P = PASO();
  const cols = Math.round(w.width / S);
  const casilla = (c, f) => (map.grid[f] || [])[w.colStart + c];
  const esPared = (f) => casilla(Math.floor(cols / 2), f) === '#' || casilla(Math.floor(cols / 2), f) === 'W';
  let filasArriba = 0; while (esPared(filasArriba)) filasArriba++;
  const x0 = Math.floor(w.x / P) * P, yArr = -tc.alturaPared, yCara = 8;
  const ax = (u) => Math.round((u - x0) / P), ay = (u) => Math.round((u - yArr) / P);
  const deAx = (pt) => x0 + pt * P, deAy = (pt) => yArr + pt * P;
  // --- el lavatorio, al lado de la cabecera de cada cama de arriba (las mismas cuentas que world/estiloNuevo/vagones.js).
  for (let c = 0; c < cols; c++) {
    const f = filasArriba;
    if (casilla(c, f) !== 'S' || casilla(c - 1, f) === 'S') continue;
    let c2 = c; while (casilla(c2 + 1, f) === 'S') c2++;
    const lx = ax(w.x + (c2 + 1) * S) - 1 + 3, LD = 7, LH = 11;
    const lyA = ay(f * S), lt = lyA - LH;
    const base = (lyA + LD) * P + yArr, yPiso = base + 3;
    for (const [tipo, px, k] of [['palangana', lx + 2, 0], ['jarra', lx + 9, 1]]) {
      const D = DIBUJOS[tipo].arriba, xw = deAx(px + Math.floor(D.w / 2));
      C.objetos.push({
        tipo, peso: 'nada', hw: 4, x: xw, xRepisa: xw, yRepisa: deAy(lt + 6), yPared: base + 0.001 + k * 0.001,
        yPiso: yPiso + Math.round(azar(c, k + 3) * 4) + k * 2, rompeAlCaer: true, estado: 'repisa', t: 0, dir: 0, wagon: w.id,
      });
    }
  }
  // --- el saco de cada perchero (al lado de cada tabique de arriba, como la lámpara: ver `faroles` del dormitorio).
  for (let c = 1; c < cols - 1; c++) {
    if (casilla(c, filasArriba) !== '#' || casilla(c - 1, filasArriba) === '#') continue;
    const hx = ax(w.x + c * S) - 6 - 22, hy = yCara + 9, xw = deAx(hx + 1);
    C.objetos.push({
      tipo: 'saco', peso: 'nada', hw: 5, x: xw, xRepisa: xw, yRepisa: deAy(hy + 17), yPared: filasArriba * S,
      yPiso: filasArriba * S + 4 + Math.round(azar(c, 5) * 4), corre: 3, estado: 'repisa', t: 0, dir: 0, wagon: w.id,
    });
  }
  // --- los rincones de las puertas: el de atrás, abajo a la izquierda; el de adelante, arriba a la derecha. La pared
  // de la punta del dormitorio va en la línea de adentro de la columna de la punta (`paredAdentro`).
  const baulAtras = azar(w.colStart, 77) < 0.5;
  for (const [c, f, atras] of [[1, 6, true], [cols - 2, 3, false]]) {
    if (casilla(c, f) !== '.' || casilla(atras ? c + 1 : c - 1, f) !== '.') continue;
    const cara = atras ? w.x + S : w.x + (cols - 1) * S;              // la cara de adentro de la pared de la punta
    if (baulAtras === atras) {
      C.pilas.push({
        tipo: 'baul', lona: true, x: cara + (atras ? 1 : -1) * 12, yTope: f * S + 2, yBase: (f + 1) * S - 2, hw: 11, hh: 5, atras,
        arriba: [], estado: 'quieta', t: 0, wagon: w.id,
      });
    } else {
      // (🔁 En pirámide, acostadas: dos abajo y una arriba *(Santi: "me imaginaba algo más como una pirámide de valijas, no
      // una torre, así queda más chata y tapa menos la vista")*. La primera de la lista es la de arriba: sale primero.)
      C.pilas.push({
        tipo: 'valijas', x: cara + (atras ? 1 : -1) * 16, yTope: f * S + 2, yBase: (f + 1) * S - 2, hw: 15, hh: 5, atras,
        arriba: [0, 1, 2].map((i) => ({ variante: Math.floor(azar(c + i, f) * 3) })), estado: 'quieta', t: 0, wagon: w.id,
      });
    }
  }
}

/**
 * 🛏️ EL BAÚL DE CAMAROTE, de clase media: el mismo baúl de primera clase (el mismo dibujo, hecho a mano), pero de lona
 * cruda sobre tablas, con flejes de madera y herrajes de fierro en vez de cuero y bronce. `deLona(R)` devuelve un pintor
 * que cambia esos colores al pintar.
 */
const LONA_DEL_BAUL = { 12: 15, 13: 16, 11: 14, 47: 4, 6: 23, 7: 24, 32: 5 };
export function deLona(R) {
  return (x, y, w, h, i) => R(x, y, w, h, LONA_DEL_BAUL[i] ?? i);
}

// 🫗 La loza del lavatorio y el saco del perchero, puestos a mano: arriba (en su lugar) y rotos/tirados en el piso. El
// charco ('m') es la madera mojada, más oscura, con algún brillo ('h').
const LOZA = { o: 0, b: 20, w: 17, s: 16, h: 30, m: 33 };
const PANO = { o: 0, c: 33, L: 34, d: 32 };
const PALANGANA_ROTA = ['....mmmmmmm...', '..mmmmhmmmmmm.', '.mmbwmmmmwbmmm', 'mmmwwbmmmbbmm.', '.mmmmmmhmmmm..', '...mmmmmmm....'];
const JARRA_ROTA = ['..mmmmmmm...', '.mmwwmhmmmm.', 'mmmmmmmwsmmm', '.mwmmmmmmmm.', '...mmmmm..w.'];
DIBUJOS.palangana = {
  arriba: { w: 8, h: 5, pintar: (R) => dibujarMapa(R, 0, 0, ['.bbbbbb.', 'bwhhwwwb', 'bwwwwwwb', 'bwwwwwwb', '.bbbbbb.'], LOZA) },
  piso: { w: 14, h: 6, pintar: (R) => dibujarMapa(R, 0, 0, PALANGANA_ROTA, LOZA) },
  roto: { w: 14, h: 6, pintar: (R) => dibujarMapa(R, 0, 0, PALANGANA_ROTA, LOZA) },
};
DIBUJOS.jarra = {
  arriba: { w: 5, h: 10, pintar: (R) => dibujarMapa(R, 0, 0, ['ooooo', 'ohhho', 'owwso', 'owwso', 'owwso', 'owwso', 'owwso', 'owwso', 'owwso', 'ooooo'], LOZA) },
  piso: { w: 12, h: 5, pintar: (R) => dibujarMapa(R, 0, 0, JARRA_ROTA, LOZA) },
  roto: { w: 12, h: 5, pintar: (R) => dibujarMapa(R, 0, 0, JARRA_ROTA, LOZA) },
};
const SACO_TIRADO = ['..oooooooo....', '.oLLccccccoo..', 'occcdccccLcco.', 'occcccdcccccco', '.ooccccccdcco.', '...ooooooooo..'];
DIBUJOS.saco = {
  // Colgado: los hombros caídos, el cuerpo, la abertura y la manga, de paño marrón (el mismo del dibujo fijo).
  arriba: { w: 10, h: 15, pintar: (R) => dibujarMapa(R, 0, 0, ['oooooooooo', 'oLLLLLLLLo', 'oLcccdccco', 'oLcccdccco', 'oLcccdcdco', 'oLcccdcdco', 'oLcccdcdco', 'oLcccdcdco', 'oLcccdcdco', 'oLcccdcdco', 'oLcccdcdco', 'oLcccdcdco', 'oLcccdcdco', 'occcccccco', 'oooooooooo'], PANO) },
  // Tirado: arrugado en el piso.
  piso: { w: 14, h: 6, pintar: (R) => dibujarMapa(R, 0, 0, SACO_TIRADO, PANO) },
  roto: { w: 14, h: 6, pintar: (R) => dibujarMapa(R, 0, 0, SACO_TIRADO, PANO) },
};

// ------------------------------------------------------------------------------------------------------ el caboose

/**
 * 🚂 EL CABOOSE *(Santi eligió que la rueda del freno "salga rodando", que caigan los faroles de señales y la cafetera, y
 * que lo mojado "sólo se vea"; el canasto de la leña no se mueve: "es pesadísimo")*:
 *  - LOS DOS FAROLES DE SEÑALES de arriba del cofre (rojo y verde) se tambalean, caen y se les rompe el vidrio de color
 *    (livianos: media vida).
 *  - LA CAFETERA de arriba de la estufa se cae y vuelca el café en el piso (liviana).
 *  - LA RUEDA DEL FRENO DE MANO, apoyada contra el cajón de repuestos, sale rodando por el pasillo de canto (los rayos
 *    dan la vuelta); cuando pierde fuerza se tambalea y cae acostada. Rodando te tira al piso; acostada es parte del
 *    piso: un sacudón la corre, un tiro no le hace nada (es de fierro), la dinamita la parte.
 *  - EL BARRIL DE AGUA se vuelca hacia el pasillo: el agua hace un charco grande, el balde de al lado queda volcado, y
 *    el barril rueda vacío dejando un rastro de agua; lo mojado se va secando de a poco.
 * Las posiciones las anota el dibujo fijo cuando dibuja el vagón (`w._caboose`, world/estiloNuevo/vagones.js): estas
 * cosas se arman recién cuando están (ver `armarPendientes`).
 */
function caboose(C, w) {
  const A = w._caboose, P = PASO(), map = C.train.map, S = map.size;
  const x0 = Math.floor(w.x / P) * P, yArr = -CONFIG.tresCuartos.alturaPared;
  const deAx = (pt) => x0 + pt * P, deAy = (pt) => yArr + pt * P;
  if (A.faroles) A.faroles.lista.forEach((F, k) => {
    const xw = deAx(F.px + 4);
    C.objetos.push({
      tipo: 'farolSenal', variante: F.rojo ? 0 : 1, peso: 'liviano', hw: 5, x: xw, xRepisa: xw, yRepisa: deAy(F.py + 10),
      yPared: A.faroles.base + 0.001 + k * 0.001, yPiso: deAy(A.faroles.yb) + 4 + k * 3, rompeAlCaer: true, estado: 'repisa', t: 0, dir: 0, wagon: w.id,
    });
  });
  if (A.cafetera) {
    const xw = deAx(A.cafetera.px + 3);
    C.objetos.push({
      tipo: 'cafeteraEstufa', peso: 'liviano', hw: 4, x: xw, xRepisa: xw, yRepisa: deAy(A.cafetera.py + 6), yPared: 2 * S,
      yPiso: 2 * S + 3, estado: 'repisa', t: 0, dir: 0, wagon: w.id,
    });
  }
  if (A.rueda) {
    const x = deAx(A.rueda.rx), cols = Math.round(w.width / S);
    C.pilas.push({
      // (Delante del cajón contra el que se apoya: se ordena un poco después que él.)
      tipo: 'rueda', x, yTope: A.rueda.base - 8, yBase: A.rueda.base + 0.005, hw: 7, hh: 4, atras: (x - w.x) / S < cols / 2,
      px: A.rueda.rx, py: A.rueda.ry, x0, yArr, base: A.rueda.base, cajonX2: deAx(A.rueda.cajonX2), arriba: [], estado: 'quieta', t: 0, wagon: w.id,
    });
  }
  if (A.barril) {
    const B = A.barril, cols = Math.round(w.width / S);
    C.pilas.push({
      tipo: 'barrilAgua', clave: B.clave, x: deAx(B.bx + B.bw / 2), yTope: deAy(B.piso) - 6, yBase: deAy(B.piso), hw: 9, hh: 4,
      atras: B.c < cols / 2, dy: B.f < map.rows / 2 ? 1 : -1, baldeX: deAx(B.baldeX + 6), celdas: [B.c, B.c2, B.f, w.colStart],
      arriba: [], estado: 'quieta', t: 0, wagon: w.id,
    });
  }
}

/** 🚂 Las cosas que esperan que el dibujo fijo las ubique (el caboose): se arman la primera vez que están. */
function armarPendientes(C) {
  if (!C.porArmar || !C.porArmar.length) return;
  C.porArmar = C.porArmar.filter((w) => { if (!w._caboose) return true; caboose(C, w); return false; });
}

// 🚂 Los faroles de señales, la cafetera de la estufa, y lo roto/tirado de cada uno, puestos a mano.
const FAROL_SENAL = ['...oo...', '..o..o..', '.oooooo.', 'oKKKKKKo', 'oVvvvvVo', 'oVvLLvVo', 'oVvLLvVo', 'oVvvvvVo', 'oKKKKKKo', '.oooooo.'];
const FAROL_ROTO = ['..oooooo....', '.oKVVVVKo.v.', 'oKVvLLvVKo..', '.oKVVVVKo.vV', '..oooooo..v.', '.....V......'];
const FAROL_COL = [{ o: 0, K: 23, V: 8, v: 9, L: 10 }, { o: 0, K: 23, V: 42, v: 26, L: 43 }];
DIBUJOS.farolSenal = {
  arriba: { w: 8, h: 10, pintar: (R, v) => dibujarMapa(R, 0, 0, FAROL_SENAL, FAROL_COL[v || 0]) },
  piso: { w: 12, h: 6, pintar: (R, v) => dibujarMapa(R, 0, 0, FAROL_ROTO, FAROL_COL[v || 0]) },
  roto: { w: 12, h: 6, pintar: (R, v) => dibujarMapa(R, 0, 0, FAROL_ROTO, FAROL_COL[v || 0]) },
};
const CAFETERA_TIRADA = ['..oooooo....', '.oKkkkkkoo..', 'oKkkkkkkko.c', '.oooooooo.cc', '....ccccccc.'];
DIBUJOS.cafeteraEstufa = {
  arriba: { w: 7, h: 6, pintar: (R) => dibujarMapa(R, 0, 0, ['.ooo...', 'oKKKo..', 'oKkkkoo', 'oKkkko.', 'oKkkko.', 'oooooo.'], { o: 0, K: 25, k: 24 }) },
  piso: { w: 12, h: 5, pintar: (R) => dibujarMapa(R, 0, 0, CAFETERA_TIRADA, { o: 0, K: 25, k: 24, c: 33 }) },
  roto: { w: 12, h: 5, pintar: (R) => dibujarMapa(R, 0, 0, CAFETERA_TIRADA, { o: 0, K: 25, k: 24, c: 33 }) },
};

/**
 * 🚂 LA RUEDA DEL FRENO DE MANO, de frente (19×19): el aro de fierro (más claro arriba), los cuatro rayos y el cubo. Dos
 * dibujos de los rayos, en cruz y en equis, y una mancha de óxido en el aro que da la vuelta (`RUEDA_OXIDO`, puesta a
 * mano para cada uno de los ocho cuadros): rodando se ve girar. Cayéndose, achatada; acostada en el piso, de canto; y
 * partida, de la dinamita.
 */
const RUEDA_COL = { o: 0, A: 24, a: 23, S: 31, H: 24 };
const RUEDA_CRUZ = [
  '......ooooooo......', '....ooAAAAAAAoo....', '...oAAaaaaaaaAAo...', '..oAaaoooooooaaAo..', '.oAaoo...S...ooaAo.',
  '.oAao....S....oaAo.', 'oAao.....S.....oaAo', 'oAao.....S.....oaAo', 'oAao....ooo....oaAo', 'oAaoSSSSoHoSSSSoaAo',
  'oAao....ooo....oaAo', 'oAao.....S.....oaAo', 'oAao.....S.....oaAo', '.oaao....S....oaao.', '.oaaoo...S...ooaao.',
  '..oaaaoooooooaaao..', '...oaaaaaaaaaaao...', '....ooaaaaaaaoo....', '......ooooooo......',
];
const RUEDA_EQUIS = [
  '......ooooooo......', '....ooAAAAAAAoo....', '...oAAaaaaaaaAAo...', '..oAaaoooooooaaAo..', '.oAaoo.......ooaAo.',
  '.oAaoX.......XoaAo.', 'oAao..X.....X..oaAo', 'oAao...X...X...oaAo', 'oAao....ooo....oaAo', 'oAao....oHo....oaAo',
  'oAao....ooo....oaAo', 'oAao...X...X...oaAo', 'oAao..X.....X..oaAo', '.oaaoX.......Xoaao.', '.oaaoo.......ooaao.',
  '..oaaaoooooooaaao..', '...oaaaaaaaaaaao...', '....ooaaaaaaaoo....', '......ooooooo......',
];
const RUEDA_OXIDO = [[[9, 1], [9, 2]], [[15, 3], [14, 3]], [[17, 9], [16, 9]], [[15, 15], [14, 15]], [[9, 17], [9, 16]], [[3, 15], [4, 15]], [[1, 9], [2, 9]], [[3, 3], [4, 3]]];
const RUEDA_CAYENDO = ['......ooooooo......', '...ooAAAAAAAAAoo...', '.ooAaaoooooooaaAoo.', 'oAao.....S.....oaAo', 'oAaoSSSSoooSSSSoaAo', 'oaao.....S.....oaao', '.ooaaoooooooooaaoo.', '...ooaaaaaaaaaoo...', '......ooooooo......'];
const RUEDA_ACOSTADA = ['....ooooooooooo....', '..ooAAAAAAAAAAAoo..', '.oaaoSSSoHoSSSoaao.', '..ooaaaaaaaaaaaoo..', '....ooooooooooo....'];
const RUEDA_ROTA = ['..oooo......oooo......', '.oAaao.SS..oaaAo..oo..', 'oAao....SS.oo...oHo...', '.ooo......SS....oo....', '..........S...........'];

/** 🚂 Pinta la rueda de frente en el cuadro `k` (0 a 7) de la vuelta, en su lienzo de 19×19. */
export function pintarRueda(R, k) {
  k = ((k % 8) + 8) % 8;
  dibujarMapa(R, 0, 0, k % 2 ? RUEDA_EQUIS : RUEDA_CRUZ, { ...RUEDA_COL, X: 31 });
  for (const [x, y] of RUEDA_OXIDO[k]) R(x, y, 1, 1, 47);
}
/** 🚂 Cayéndose, achatada (19×9). */
export function pintarRuedaCayendo(R) { dibujarMapa(R, 0, 0, RUEDA_CAYENDO, RUEDA_COL); }
DIBUJOS.ruedaFreno = {
  piso: { w: 19, h: 5, pintar: (R) => dibujarMapa(R, 0, 0, RUEDA_ACOSTADA, RUEDA_COL) },
  roto: { w: 22, h: 5, pintar: (R) => dibujarMapa(R, 0, 0, RUEDA_ROTA, RUEDA_COL) },
};
/** 🚂 La rueda que terminó de rodar y cayó acostada: parte del piso (un tiro no la rompe; la dinamita, sí). */
export function ruedaAcostada(C, x, yPiso, rota = false) {
  C.objetos.push({ tipo: 'ruedaFreno', peso: 'nada', hw: 9, x, xRepisa: x, yRepisa: yPiso, yPared: yPiso - 2 * CONFIG.tileSize, yPiso, aguantaBalas: true, estado: rota ? 'roto' : 'piso', t: 0, dir: 0 });
}

/**
 * 🚂 EL BARRIL DE AGUA, el del caboose (22 de ancho, el mismo del dibujo fijo), cayéndose y rodando vacío: sin tapa (la
 * boca abierta de frente, oscura) y por la panza las juntas de las duelas y una marca quemada que da la vuelta
 * (`AGUA_GIRA`, a mano para cada cuadro). Parado lo dibuja el dibujo fijo, con el agua que se mueve.
 */
const AGUA_PANZA = [
  '.......oooooooo.......', '.....ooLLLDDDDDoo.....', '....oDLzzzzzzzzDDo....', '...oDzzZZZZZZZZzzdo...', '..odzZZLLLDDDDDZZzdo..',
  '.oszZDLLLLDDDDDDDZzso.', '.ozZDDLLLLDDDDDDDdZzo.', 'ozZdDDLooooooooDDddZzo', 'oZsdDooDDDDDDDDooddsZo', 'ossdoDDDDDDDDDDDDodsso',
  'ossoDDDDDDDDDDDDDDosso', 'osoDDDDDDDDDDDDDDDDoso', 'ooDDDDDDDDDDDDDDDDDDoo', 'ooDDDDDDDDDDDDDDDDDDoo',
];
const TOPE_AGUA = [7, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 3, 4, 5, 7];
const AGUA_BOCA = [
  '.......oooooooo.......', '.....oorrrrrrrroo.....', '....orr11111111rro....', '...or111111111111ro...', '..or11111111111111ro..',
  '.or1111111111111111ro.', '.or1111111111111111ro.', 'or111111111111111111ro', 'or111111111111111111ro', 'or111111111111111111ro',
  'or111111111111111111ro', 'or111111111111111111ro', 'or111111111111111111ro', 'or111111111111111111ro', '.or1111111111111111ro.',
  '.or1111111111111111ro.', '..or11111111111111ro..', '...or111111111111ro...', '....orr11111111rro....', '.....oorrrrrrrroo.....',
  '.......oooooooo.......',
];
const AGUA_CAYENDO = [
  '.......oooooooo.......', '....ooorrrrrrrrooo....', '..oorr1111111111rroo..', '.orr11111111111111rro.', 'or111111111111111111ro',
  'or111111111111111111ro', '.orr11111111111111rro.', '..oorrrrrrrrrrrrrroo..', 'oZZZZZZZZZZZZZZZZZZZZo', 'oLLDDdDDDdDDDdDDDdDDso',
  'oLLDDdDDDdDDDdDDDdDDso', 'oLLDDdDDDdDDDdDDDdDDso', 'ozzzzzzzzzzzzzzzzzzzzo', 'oZZZZZZZZZZZZZZZZZZZZo', 'oLLDDdDDDdDDDdDDDdDDso',
  '.oooooooooooooooooooo.',
];
const AGUA_GIRA = [
  { juntas: [5, 10, 16], marca: [10, 11] }, { juntas: [3, 8, 13, 18], marca: [17] }, { juntas: [5, 10, 16], marca: [20] },
  { juntas: [3, 8, 13, 18], marca: [] }, { juntas: [5, 10, 16], marca: [] }, { juntas: [3, 8, 13, 18], marca: [] },
  { juntas: [5, 10, 16], marca: [1] }, { juntas: [3, 8, 13, 18], marca: [4] },
];
export const ALTO_BARRIL_AGUA = { inclinado: AGUA_CAYENDO.length, acostado: 7 + AGUA_BOCA.length };

/** 🚂 Pinta el barril de agua (22 de ancho): `pose` 'inclinado' o 'acostado'; `cuadro`, la vuelta (0 a 7). */
export function pintarBarrilAgua(R, pose, cuadro) {
  const col = { ...BARRIL, ...TAPA_COL };
  if (pose === 'inclinado') { dibujarMapa(R, 0, 0, AGUA_CAYENDO, col); return; }
  const G = AGUA_GIRA[((cuadro % 8) + 8) % 8];
  dibujarMapa(R, 0, 0, AGUA_PANZA, col);
  for (const jx of G.juntas) for (let y = TOPE_AGUA[jx] + 1; y < AGUA_PANZA.length; y++) {
    const ch = AGUA_PANZA[y][jx];
    if (ch === 'L' || ch === 'D' || ch === 'd') R(jx, y, 1, 1, ch === 'd' ? 3 : 4);
  }
  for (const mx of G.marca) { R(mx, TOPE_AGUA[mx] + 4, 1, 1, 0); R(mx, TOPE_AGUA[mx] + 5, 1, 1, 3); }
  dibujarMapa(R, 0, 7, AGUA_BOCA, col);
}

/** 🚂 El balde del barril de agua, volcado de costado en el piso (la boca oscura a la derecha). */
DIBUJOS.balde = {
  piso: { w: 12, h: 6, pintar: (R) => dibujarMapa(R, 0, 0, ['.oooooooooo.', 'oBBBBBBBBoKo', 'obbbbbbbboKo', 'obbbbbbbboKo', 'oBBBBBBBBoKo', '.oooooooooo.'], { o: 0, B: 24, b: 23, K: 1 }) },
  roto: { w: 12, h: 6, pintar: (R) => dibujarMapa(R, 0, 0, ['.oooooooooo.', 'oBBBBBBBBoKo', 'obbbbbbbboKo', 'obbbbbbbboKo', 'oBBBBBBBBoKo', '.oooooooooo.'], { o: 0, B: 24, b: 23, K: 1 }) },
};

/**
 * 🚂 EL BARRIL DE AGUA SE VUELCA: el charco grande donde cae, el balde volcado al lado (con su charquito), y la casilla
 * donde estaba queda libre (ya no choca). Lo llama la escena cuando el barril termina de volcarse.
 */
export function volcarBarrilAgua(C, ro) {
  const map = C.train.map;
  // (🔁 Un charco de verdad, con su forma: hecho de puñaditos sueltos parecía polvo desparramado.)
  C.charcos.push({ x: ro.x, y: ro.y + ro.hh - 2, grande: true, nace: C.reloj || 0 });
  if (ro.baldeX != null) {
    C.objetos.push({ tipo: 'balde', peso: 'nada', hw: 5, x: ro.baldeX, xRepisa: ro.baldeX, yRepisa: ro.baldeY, yPared: ro.baldeY - 2 * CONFIG.tileSize, yPiso: ro.baldeY, estado: 'piso', t: 0, dir: 0 });
    C.charcos.push({ x: ro.baldeX + 10, y: ro.baldeY + 1, grande: false, nace: C.reloj || 0 });
  }
  if (ro.celdas) {
    const [c0, c1, f, colStart] = ro.celdas;
    for (let c = c0; c <= c1; c++) if (map.grid[f] && map.grid[f][colStart + c] === 'C') map.grid[f][colStart + c] = '.';
  }
}

/**
 * 🚂 EL CHARCO DEL BARRIL DE AGUA (y el chico del balde): la madera mojada, más oscura, con brillos, puesto a mano. Se va
 * secando: pasada la mitad de `SECA_AGUA`, el dibujo achicado; después, nada.
 */
const CHARCO_GRANDE = [
  '.........mmmmmmmmmmm................',
  '....mmmmmmmmmmmmmmmmmmmmm...........',
  '..mmmmmmmhmmmmmmmmmmmmmmmmmmm.......',
  '.mmmmmmmmmhhmmmmmmmmmmmmmmmmmmmm....',
  'mmmmmmmmmmmmmmmmmmmmmmmhmmmmmmmmmm..',
  'mmmmmmmmmmmmmmmmmmmmmmmmhhmmmmmmmmmm',
  '.mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm.',
  '..mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm...',
  '....mmmmmmmmmmmmmmm.mmmmmmmmmm......',
  '.......mmmmmmmmm.......mmmm.........',
];
const CHARCO_CHICO = [
  '......mmmmmmmmm.........',
  '...mmmmmmmmmmmmmmmm.....',
  '.mmmmmmmmmhmmmmmmmmmm...',
  'mmmmmmmmmmmmmmmmmmmmmmm.',
  '.mmmmmmmmmmmmmmmmmmmm...',
  '....mmmmmmm..mmmmm......',
];
function pintarCharco(r, q, P, reloj) {
  const edad = (reloj - (q.nace || 0)) / SECA_AGUA;
  if (edad >= 1) return;
  const D = q.grande && edad < 0.5 ? CHARCO_GRANDE : CHARCO_CHICO;
  const luz = estiloNuevo.luzEn ? Math.round(estiloNuevo.luzEn(q.x, q.y) || 0) : 0;
  const R = pintor(r.ctx, Math.round(q.x / P) - Math.floor(D[0].length / 2), Math.round(q.y / P) - Math.floor(D.length / 2), luz);
  dibujarMapa(R, 0, 0, D, { m: 33, h: 30 });
}
