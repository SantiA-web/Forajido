/**
 * LA REGIÓN DESIERTO — el mapa de rutas.
 *
 * Es un mapa de la época: papel envejecido, tinta marrón y símbolos. No es
 * una pantalla de selección de nivel con la palabra "mapa" encima, y la
 * diferencia no es estética sino de diseño:
 *
 *   - **Las vías se dibujan con el travesaño clásico** (la línea con las
 *     rayitas cruzadas). Es EL símbolo de ferrocarril en cualquier mapa de
 *     1880, y se reconoce sin que nadie lo explique. Una línea pelada sería
 *     un camino.
 *   - **Hay ramales sin servicio.** Si todas las líneas sirvieran siempre,
 *     el mapa sería una lista de botones dibujada bonita. Que uno esté
 *     muerto es lo que convierte mirar el mapa en leerlo.
 *
 * 🔁 EL PAPEL SALE DEL PLANO (`data/plano.js`) *(Santi: "que sí quede coherente. Por ejemplo, por qué pasa por acá,
 * por qué hace esta curva, visto desde un lado de un ingeniero")*. Antes este archivo tenía sus propias vías, que
 * eran CIRCUITOS dibujados para que se vieran lindos; el campo se armó con el plano, con líneas de ida y vuelta, y
 * las dos cosas tienen que ser el mismo mundo. Ahora acá sólo quedan los NOMBRES y de qué lado va cada uno: los
 * lugares, las vías y el terreno se leen del plano y se pasan a símbolos de mapa viejo.
 *
 * Los trenes ya no dan vueltas por el papel: los trae el horario (`systems/horario.js`), y cada línea tiene su
 * chance de pasajeros (`pasajeros`, del plano) *(Santi: "No solo sirven para llevar algo, sino también personas")*.
 *
 * LOS NÚMEROS DEL PLANO SON DE LA PANTALLA VIEJA (384×216), y se estiran en
 * proporción al final de este archivo (`estirarRegion`) a la de hoy.
 */

import { CONFIG } from './config.js';
import { PLANO } from './plano.js';

/**
 * LOS NOMBRES DE LOS LUGARES y de qué lado del símbolo va cada uno (`etiqueta`: izq, der, arriba o abajo). El lado
 * NO es decoración: es el único donde no le pasa una vía por encima. Si se mueve una vía en el plano, hay que volver a
 * mirar los nombres. (La granja y los Rennick no van en el papel: no son de la compañía ni del ferrocarril.)
 */
const NOMBRES = {
  piedraroja:   { tipo: 'pueblo', nombre: 'PIEDRA ROJA',   etiqueta: 'arriba' },
  pasodeloro:   { tipo: 'pueblo', nombre: 'PASO DEL ORO',  etiqueta: 'abajo' },
  fuertebravo:  { tipo: 'pueblo', nombre: 'FUERTE BRAVO',  etiqueta: 'abajo' },
  alamoseco:    { tipo: 'pueblo', nombre: 'ÁLAMO SECO',    etiqueta: 'abajo' },
  sancristobal: { tipo: 'pueblo', nombre: 'SAN CRISTÓBAL', etiqueta: 'abajo' },
  laviuda:      { tipo: 'mina',   nombre: 'MINA LA VIUDA', etiqueta: 'der' },
  puestoseco:   { tipo: 'puesto', nombre: 'PUESTO SECO',   etiqueta: 'arriba' },
};

/** Los nombres de las vías en el papel (los del plano, en mayúsculas; el del norte, corto para que entre). */
const NOMBRES_VIAS = {
  troncal: 'LÍNEA DE LAS LLANURAS',
  mina: 'RAMAL DE LA VIUDA',
  norte: 'LÍNEA DEL NORTE',
  sur: 'RAMAL DE SAN CRISTÓBAL',
  vieja: 'LA VÍA VIEJA',
};

const MARCO = { x: 6, y: 6, w: 372, h: 204 };
const lugarDelPlano = (id) => PLANO.lugares.find((l) => l.id === id);

// --------------------------------------------------------------- las vías

/** Lo más cerca de (x, y) que pasa la polilínea: `{ i, f, d }` (tramo, fracción del tramo, distancia). */
function masCerca(puntos, x, y) {
  let mejor = { i: 0, f: 0, d: Infinity };
  for (let i = 0; i < puntos.length - 1; i++) {
    const [ax, ay] = puntos[i], [bx, by] = puntos[i + 1];
    const dx = bx - ax, dy = by - ay;
    const f = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    const d = Math.hypot(x - ax - dx * f, y - ay - dy * f);
    if (d < mejor.d) mejor = { i, f, d };
  }
  return mejor;
}

/** En qué fracción del recorrido entero (0 a 1) cae el punto de la vía más cerca de (x, y). */
function fraccionDe(puntos, x, y) {
  const { i, f } = masCerca(puntos, x, y);
  let hasta = 0, total = 0;
  for (let k = 0; k < puntos.length - 1; k++) {
    const l = Math.hypot(puntos[k + 1][0] - puntos[k][0], puntos[k + 1][1] - puntos[k][1]);
    if (k < i) hasta += l;
    if (k === i) hasta += l * f;
    total += l;
  }
  return total ? hasta / total : 0;
}

/**
 * Una línea del plano, pasada a ruta del papel. Las estaciones se vuelven `paradas` (el índice del punto, como
 * las quiere el mapa): si la estación no cae justo en un punto de la vía, se le agrega uno ahí. Los túneles, que el
 * plano marca con sus dos bocas, se vuelven fracciones del recorrido. Las puntas que salen del papel se recortan al
 * borde, para que la vía no tape el marco.
 */
function rutaDesdeLinea(l) {
  const puntos = l.puntos.map(([x, y]) => [
    Math.max(MARCO.x - 2, Math.min(MARCO.x + MARCO.w + 2, x)),
    Math.max(MARCO.y - 2, Math.min(MARCO.y + MARCO.h + 2, y)),
  ]);
  const paradas = [];
  for (const id of l.estaciones || []) {
    const lu = lugarDelPlano(id);
    if (!lu) continue;
    const c = masCerca(puntos, lu.x, lu.y);
    let i;
    if (c.f < 0.08 || Math.hypot(puntos[c.i][0] - lu.x, puntos[c.i][1] - lu.y) < 3) i = c.i;
    else if (c.f > 0.92 || Math.hypot(puntos[c.i + 1][0] - lu.x, puntos[c.i + 1][1] - lu.y) < 3) i = c.i + 1;
    else {
      const [ax, ay] = puntos[c.i], [bx, by] = puntos[c.i + 1];
      puntos.splice(c.i + 1, 0, [ax + (bx - ax) * c.f, ay + (by - ay) * c.f]);
      for (const p of paradas) if (p.i > c.i) p.i++;
      i = c.i + 1;
    }
    paradas.push({ i, lugar: id });
  }
  const tuneles = (l.tuneles || []).map(([a, b]) => {
    const fa = fraccionDe(puntos, a[0], a[1]), fb = fraccionDe(puntos, b[0], b[1]);
    return [Math.min(fa, fb), Math.max(fa, fb)];
  });
  return {
    id: l.id,
    nombre: NOMBRES_VIAS[l.id] || l.nombre.toUpperCase(),
    entraDesdeAfuera: !!l.entraDesdeAfuera,
    servicio: l.servicio !== false,
    pasajeros: l.pasajeros ?? 0.5,
    puntos, paradas, tuneles,
  };
}

// ------------------------------------------------------------- el terreno

const centro = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

/**
 * EL TERRENO DEL PLANO, EN SÍMBOLOS DE MAPA VIEJO: la sierra y el cerro en chevrones (la sierra, a lo largo de su
 * pie), las mesas en su caja rayada, las lomas en dunitas, los ríos en doble línea y los arroyos secos en línea
 * cortada. El malpaís va pegado al borde del oeste, debajo del marco: no se dibuja. Unos cactus sueltos donde no hay
 * nada, para que el llano no quede pelado.
 */
function terrenoDesdePlano() {
  const out = [];
  for (const r of PLANO.relieve) {
    if (r.tipo === 'sierra') {
      out.push({ tipo: 'sierra', puntos: r.puntos.filter(([x, y]) => y > 12 && x > 12 && x < 372).map(([x, y]) => [x, y - 6]) });
    } else if (r.tipo === 'cerro') {
      out.push({ tipo: 'sierra', puntos: [centro(r.puntos)] });
    } else if (r.tipo === 'meseta') {
      const xs = r.puntos.map((p) => p[0]), ys = r.puntos.map((p) => p[1]);
      const x = Math.min(...xs), y = Math.min(...ys);
      out.push({ tipo: 'meseta', x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y });
    } else if (r.tipo === 'lomas') {
      const [cx, cy] = centro(r.puntos);
      out.push({ tipo: 'dunas', x: cx, y: cy });
      for (const k of [0, 2]) out.push({ tipo: 'dunas', x: (cx + r.puntos[k][0]) / 2, y: (cy + r.puntos[k][1]) / 2 });
    } else if (r.tipo === 'rio' || r.tipo === 'arroyo') {
      // (Los bordes del plano siguen del otro lado del marco: en el papel se recortan.)
      out.push({ tipo: r.tipo, puntos: r.puntos.map(([x, y]) => [Math.max(MARCO.x + 2, Math.min(MARCO.x + MARCO.w - 2, x)), Math.max(MARCO.y + 2, Math.min(y, MARCO.y + MARCO.h - 4))]) });
    }
  }
  for (const [x, y] of [[132, 150], [160, 50], [318, 70], [268, 182], [44, 176], [118, 60]]) out.push({ tipo: 'cactus', x, y });
  return out;
}

const k = lugarDelPlano('campamento');

export const REGION = {
  nombre: 'REGIÓN DESIERTO',

  /** El marco del papel. Todo lo demás vive adentro. */
  marco: { ...MARCO },

  /** LOS LUGARES: los del plano que tienen nombre en el papel (pueblos, la mina y el puesto). */
  lugares: Object.entries(NOMBRES).map(([id, n]) => {
    const lu = lugarDelPlano(id);
    return { id, ...n, x: lu.x, y: lu.y };
  }),

  /** Dónde estás vos. Marcado con una carpita, como corresponde. */
  campamento: { x: k.x, y: k.y, nombre: 'TU CAMPAMENTO' },

  terreno: terrenoDesdePlano(),

  /**
   * LAS RUTAS, de las líneas del plano.
   *
   *   paradas        `{ i, lugar }` — `i` es el índice dentro de `puntos`.
   *   entraDesdeAfuera  viene de otra región: entra por un borde del papel.
   *   servicio       false = ramal muerto, nunca tiene tren.
   *   pasajeros      de cada 10 trenes de la línea, cuántos son de pasajeros (lo usa el horario).
   *   tuneles        tramos por donde la vía va bajo tierra, en fracciones del recorrido (0 a 1).
   */
  rutas: PLANO.lineas.map(rutaDesdeLinea),
};

/**
 * DE LA PANTALLA VIEJA A LA DE HOY, en proporción (ver `CONFIG.view`).
 *
 * Se mueven las POSICIONES (pueblos, vías, terreno, tu campamento); los tamaños
 * de los símbolos no, para que sigan nítidos. El marco conserva sus 6 px de
 * margen y toma el papel entero.
 */
(function estirarRegion() {
  const kx = CONFIG.view.width / CONFIG.vistaVieja.width;
  const ky = CONFIG.view.height / CONFIG.vistaVieja.height;
  const punto = ([x, y]) => [Math.round(x * kx), Math.round(y * ky)];
  const lugar = (o) => { o.x = Math.round(o.x * kx); o.y = Math.round(o.y * ky); };

  REGION.marco = { x: 6, y: 6, w: CONFIG.view.width - 12, h: CONFIG.view.height - 12 };
  REGION.lugares.forEach(lugar);
  lugar(REGION.campamento);
  for (const t of REGION.terreno) {
    if (t.puntos) t.puntos = t.puntos.map(punto);
    else {
      if (t.w !== undefined) { t.w = Math.round(t.w * kx); t.h = Math.round(t.h * ky); }
      lugar(t);
    }
  }
  for (const r of REGION.rutas) r.puntos = r.puntos.map(punto);
})();
