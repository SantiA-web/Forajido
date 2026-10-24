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
 * Por ahora, el vagón de pasajeros (los demás, de a uno: ver el plan en las notas).
 */
import { CONFIG } from '../data/config.js';
import { PALETA, sombrear } from '../engine/paleta.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';

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
  const C = { objetos: [], pilas: [], impactos: [], sueltos: [] };
  const map = train.map, S = map.size, tc = CONFIG.tresCuartos;
  for (const w of train.wagons) {
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
 * EL AVISO DE UN GOLPE (`sentido`: -1 frena, +1 acelera). Elige qué se va a caer de las repisas (una parte de lo que
 * queda) y qué pila se va a soltar.
 */
export function avisarCaidas(C, sentido, rng) {
  const K = CONFIG.caidas;
  for (const o of C.objetos) {
    if (o.estado !== 'repisa' || !rng.chance(K.cae)) continue;
    o.estado = 'aviso'; o.t = 0; o.dir = -sentido;
  }
  for (const p of C.pilas) {
    if (p.estado !== 'quieta' || !p.arriba.length) continue;
    if (p.atras === (sentido < 0)) { p.estado = 'aviso'; p.t = 0; }
  }
}

/** EL GOLPE: lo avisado se cae, y las pilas avisadas largan lo de arriba (en `C.sueltos`, para la escena). */
export function golpearCaidas(C) {
  for (const o of C.objetos) if (o.estado === 'aviso') { o.estado = 'cae'; o.t = 0; }
  for (const p of C.pilas) {
    if (p.estado !== 'aviso') continue;
    p.estado = 'quieta';
    const dir = p.atras ? 1 : -1;
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
  for (const o of C.objetos) if (o.estado === 'piso') o.vx = -sentido * v * (0.8 + 0.4 * azar(Math.round(o.xRepisa), Math.round(o.x)));
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
    if (o.estado !== 'piso') continue;
    const b = cuerpo(o);
    if (Math.abs(x - b.x) <= b.hw && Math.abs(y - b.y) <= b.hh) { o.estado = 'roto'; o.vx = 0; return o; }
  }
  return null;
}

/** Y la dinamita, todo lo tirado que agarre la onda. Devuelve cuántas cosas rompió. */
export function romperEnRadio(C, x, y, radio) {
  let n = 0;
  for (const o of C.objetos) {
    if (o.estado !== 'piso' || Math.hypot(o.x - x, o.yPiso - 3 - y) > radio) continue;
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
    if (o.t >= K.caeDura) {
      o.estado = 'piso';
      o.x = o.xRepisa + o.dir * K.corre;
      C.impactos.push({ ...zonaDe(o), peso: o.peso, x: o.x, y: o.yPiso, tipo: o.tipo });
      // 🐛 Si cayó sobre un asiento, rebota al piso: al hueco libre más cercano (primero para el lado del golpe). Arriba
      // del asiento lo tapaba el respaldo, y en el piso se ordena con la gente por donde apoya.
      if (map) for (let d = 0; d <= 24; d += 2) {
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
  const K = CONFIG.caidas, x = o.xRepisa + o.dir * K.corre;
  return { x0: x - o.hw - 2, x1: x + o.hw + 2, y0: o.yPiso - K.alcance, y1: o.yPiso + 4 };
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
export function dibujarSombrasDeCaidas(r, C, corrido) {
  const K = CONFIG.caidas, P = PASO(), ctx = r.ctx;
  for (const o of C.objetos) {
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
    } else if (o.estado === 'cae') {
      const f = Math.min(1, o.t / K.caeDura);
      x += o.dir * K.corre * f;
      y = o.yRepisa + (o.yPiso - o.yRepisa) * f * f;
      base = delante;
    } else if (o.estado === 'piso' || o.estado === 'roto') {
      // 🐛 Tirado, se ordena por donde apoya, como cualquiera *(Santi: "la valija se pone por delante")*: delante de
      // todos, te tapaba aunque pasaras más cerca de la pantalla.
      x = o.x; y = o.yPiso; base = o.yPiso; frame = o.estado;
    }
    out.push({ base, draw: corrido(o.xRepisa, () => dibujarCosa(r, o.tipo, frame, x, y, o.variante)) });
  }
  for (const p of C.pilas) {
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
  const ox = Math.round(p.x / P) - 11, base = Math.round(p.yBase / P) - 2;
  pintarTapando(r.ctx, ox + 1, base - 17, 20, 17, luz, (R) => DIBUJOS.baul.arriba.pintar(R));
  p.arriba.forEach((v, i) => {
    pintarTapando(r.ctx, ox + 2 + (i ? tiembla : -tiembla), base - 17 - 13 - i * 12, 18, 16, luz, (R) => valijaParada(R, v.variante));
  });
}
