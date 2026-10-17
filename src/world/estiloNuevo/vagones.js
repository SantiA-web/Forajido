/**
 * 🎨 ESTILO NUEVO · P1 — EL VAGÓN DE PASAJEROS POR DENTRO.
 *
 * La maqueta que aprobó Santi (*"uuuufffff. Espectacular. Me encantó"*), hecha
 * de verdad: el piso de madera gastada, la pared del fondo con sus ventanales y
 * sus faroles, los asientos de cuero rojo y la pared de adelante. De día el sol
 * entra por los ventanales del fondo; de noche se prenden los faroles. Todo en
 * la grilla de puntos (`PASO` unidades del mundo por punto) y con los 48
 * colores de la paleta (engine/paleta.js), iluminado por escalones
 * (engine/luz.js). Sólo se ve con la prueba prendida ([F9]).
 *
 * EL BORDE DE LAS PAREDES ES DEL COLOR DEL VAGÓN *(Santi: "pondría el color de
 * como se ve ese mismo vagón en el galope. O sea, si el vagón se ve morado, el
 * borde es morado. Y así con cualquier vagón")*: sale de
 * `CONFIG.colors.costado.coche`, llevado al color más parecido de la paleta.
 *
 * CADA VAGÓN SE DIBUJA E ILUMINA UNA SOLA VEZ (de día y de noche, por
 * separado) y se guarda en piezas: el piso, la pared del fondo, cada asiento y
 * la pared de adelante. La escena mezcla las piezas altas con la gente,
 * ordenadas por `base`, igual que el dibujo de siempre. Iluminar cuesta (15 ms
 * cada 60.000 puntos); estampar lo ya iluminado, nada.
 *
 * EL DETALLE (la veta, los clavos, los botones) es más tupido donde hay luz:
 * ver `deja` más abajo.
 *
 * 🔻 Simplificaciones de esta etapa: la luz no se hamaca con el meneo del tren
 * (ya está iluminada y guardada) y la gente todavía es la de antes, sin la luz
 * nueva (eso es P2).
 */
import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar } from '../../engine/luz.js';
import { masCercano, sombrear } from '../../engine/paleta.js';
import { estiloNuevo } from '../../engine/estiloNuevo.js';

/** Cuántas unidades del mundo mide un punto de la grilla (0,75 con puntos de 3). */
export const PASO = CONFIG.estilo.punto / DENSIDAD;
const PX = 1 / PASO;

/** Qué vagones ya se dibujan en el estilo nuevo. */
// 🆕 P4: el comedor (el de la gente común: ver `comedor` más abajo) y el dormitorio (ver `dormitorio`).
const NUEVOS = new Set(['pasajeros', 'comedor', 'dormitorio']);

/**
 * LOS VAGONES DEL ESTILO NUEVO de este tren: sus columnas (para que el dibujo
 * viejo las saltee), sus tramos en x (para que las luces viejas no les caigan
 * encima) y sus piezas ya iluminadas.
 */
export function vagonesNuevos(train, dia) {
  const clave = dia ? 'd' : 'n';
  if (train._estiloNuevo && train._estiloNuevo.clave === clave) return train._estiloNuevo;
  const cols = new Set();
  const tramos = [];
  const piso = [], altas = [], luces = [];
  for (const w of train.wagons) {
    if (!NUEVOS.has(w.id)) continue;
    const cuantas = Math.round(w.width / train.map.size);
    for (let c = w.colStart; c < w.colStart + cuantas; c++) cols.add(c);
    tramos.push([w.x, w.x + w.width]);
    const v = vagon(train, w, dia);
    piso.push(...v.piso);
    altas.push(...v.altas);
    luces.push({ x0: w.x, x1: w.x + w.width, luz: v.luz });
  }
  /**
   * LA LUZ EN UN PUNTO DEL MUNDO, en pasos (para la gente, que la recibe
   * pareja): la del vagón nuevo donde esté; afuera de ellos, `null`.
   */
  const luzEn = (x, y) => {
    const l = luces.find((q) => x >= q.x0 && x < q.x1);
    return l ? l.luz(x, y) : null;
  };
  train._estiloNuevo = { clave, cols, tramos, piso, altas, luzEn };
  return train._estiloNuevo;
}

/** Una pieza: un canvas ya iluminado, dónde va (en el mundo) y su `base`. */
function pieza(datos, ancho, alto, x, y, base) {
  const cv = document.createElement('canvas');
  cv.width = ancho; cv.height = alto;
  cv.getContext('2d').putImageData(new ImageData(datos, ancho, alto), 0, 0);
  return { img: cv, x, y, w: ancho * PASO, h: alto * PASO, base };
}

/** Estampa una pieza en el mundo (la cámara ya está puesta y alineada). */
export function estamparPieza(r, p) {
  r.ctx.drawImage(p.img, p.x, p.y, p.w, p.h);
  // Si está delante de alguien, le tapa el borde fino.
  estiloNuevo.taparGente(r.ctx, p.img, p.x, p.y, p.w, p.h);
}

function vagon(train, w, dia) {
  const map = train.map, S = map.size, tc = CONFIG.tresCuartos;
  // El origen, alineado a la grilla: si no, el vagón quedaría corrido medio
  // punto de todo lo demás y la grilla lo partiría.
  const x0 = Math.floor(w.x / PASO) * PASO;
  /**
   * 🔁 LA PARED DE ADELANTE, SIEMPRE DEL MISMO GRUESO *(Santi: "lo siento más chico de lo normal…
   * por la pared de más acá")*: el comedor tiene una sola fila de pared abajo (el de pasajeros, dos), y
   * dibujada en su lugar quedaba finita y el vagón se veía chico. Ahora crece para abajo lo que le
   * falta: se ve como la del de pasajeros y no tapa a nadie de adentro. (La del fondo no: para arriba
   * la cámara no llega, y quedaba cortada.)
   */
  const medioW = w.colStart + Math.floor(Math.round(w.width / S) / 2);
  const paredW = (f) => { const t = (map.grid[f] || [])[medioW]; return t === '#' || t === 'W'; };
  let fb = 0; while (fb < map.rows && paredW(map.rows - 1 - fb)) fb++;
  const yArriba = -tc.alturaPared;
  // 🔁 La pared de adelante llega sólo hasta el borde del mapa *(Santi: "la
  // pared del vagón cercana a la pantalla la veo muy alta. La haría más
  // chata")*: antes colgaba `alturaCaraAfuera` (18) más abajo.
  const yAbajo = map.rows * S + Math.max(0, 2 - fb) * S;
  const W = Math.ceil((w.x + w.width - x0) * PX);
  const H = Math.round((yAbajo - yArriba) * PX);
  const ax = (u) => Math.round((u - x0) * PX);
  const ay = (u) => Math.round((u - yArriba) * PX);
  const cols = Math.round(w.width / S);
  const casilla = (c, f) => (map.grid[f] || [])[w.colStart + c];

  // ---- los colores (índices de la paleta)
  const cc = CONFIG.colors.costado;
  const hex = cc.coche[w.id] || cc.coche.pasajeros;
  const n = parseInt(hex.slice(1), 16);
  const BORDE = masCercano((n >> 16) & 255, (n >> 8) & 255, n & 255);
  const BORDE_L = sombrear(BORDE, 1), BORDE_S = sombrear(BORDE, -1), BORDE_SS = sombrear(BORDE, -2);

  // ---- las capas: una por pieza, todas del tamaño del vagón
  const capa = () => ({ i: new Int16Array(W * H).fill(-1), m: new Uint8Array(W * H) });
  const PISO = capa(), FONDO = capa(), FRENTE = capa(), ASIENTOS = capa();
  const pone = (c) => (x, y, i, emite) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    c.i[y * W + x] = i; c.m[y * W + x] = emite ? 1 : 0;
  };
  const rect = (c) => { const p = pone(c); return (x, y, ww, hh, i, emite) => { for (let j = 0; j < hh; j++) for (let q = 0; q < ww; q++) p(x + q, y + j, i, emite); }; };

  // ---- dónde están las cosas
  const corridas = (fila) => {
    const out = [];
    for (let c = 0; c < cols; c++) {
      if (casilla(c, fila) !== 'W' || casilla(c - 1, fila) === 'W') continue;
      let d = c; while (casilla(d + 1, fila) === 'W') d++;
      out.push([c, d]);
    }
    return out;
  };
  const ventanasFondo = corridas(0), ventanasFrente = corridas(map.rows - 1);
  // Cuántas filas de pared tiene arriba y abajo (el de pasajeros, dos; el comedor, una): el
  // adentro empieza en la primera fila que no es pared, a la mitad del vagón.
  const medio = Math.floor(cols / 2);
  const esPared = (f) => { const t = casilla(medio, f); return t === '#' || t === 'W'; };
  let filasArriba = 0; while (filasArriba < map.rows && esPared(filasArriba)) filasArriba++;
  let filasAbajo = 0; while (filasAbajo < map.rows && esPared(map.rows - 1 - filasAbajo)) filasAbajo++;
  const yPisoArriba = filasArriba * S, yPisoAbajo = (map.rows - filasAbajo) * S;   // el adentro (32 y 128 en el de pasajeros)

  /**
   * LOS FAROLES, EN LA PARED DEL FONDO, uno cada `faroles.cadaColumnas`
   * columnas como los de siempre, corridos a la tabla más cercana si les toca
   * un ventanal. (Los de siempre colgaban sobre el pasillo y sólo se veía la
   * luz; en la maqueta que aprobó Santi van en la pared.)
   */
  const F = CONFIG.tresCuartos.faroles;
  const cuantos = Math.max(1, Math.floor((cols - 2) / F.cadaColumnas));
  const sobra = cols - cuantos * F.cadaColumnas;
  const faroles = [];
  for (let q = 0; q < cuantos; q++) {
    let c = Math.round(sobra / 2 + (q + 0.5) * F.cadaColumnas);
    for (let d = 0; d < 4 && casilla(c, 0) === 'W'; d++) c += (d % 2 ? -(d + 1) : d + 1);
    faroles.push(ax(w.x + (c + 0.5) * S));
  }
  /**
   * 🆕 EN EL DORMITORIO, UNA LÁMPARA CHICA POR CAMAROTE DE ARRIBA, en la pared del fondo junto al
   * tabique de su derecha (ver `dormitorio` más abajo). Los de abajo reciben la luz que cruza el pasillo.
   */
  const tabiques = [];
  if (w.id === 'dormitorio') {
    for (let c = 1; c < cols - 1; c++) if (casilla(c, filasArriba) === '#' && casilla(c - 1, filasArriba) !== '#') tabiques.push(c);
    faroles.length = 0;
    for (const c of tabiques) faroles.push(ax(w.x + c * S) - 6);
  }
  /**
   * 🔁 LOS CAMAROTES DE ABAJO TAMBIÉN TIENEN SU LÁMPARA *(Santi: "de noche se ve demasiado raro, oscuro y
   * muy violeta")*: sin ninguna, quedaban en lo más oscuro, y la madera en lo oscuro cae en los violetas
   * de la paleta. Va colgada en la cara del tabique del pasillo, a la derecha del tabique de cada uno.
   */
  const lamparasAbajo = [];
  if (w.id === 'dormitorio') {
    const fUlt = map.rows - filasAbajo - 1;
    for (let c = 1; c < cols - 1; c++) {
      if (casilla(c, fUlt) !== '#' || casilla(c - 1, fUlt) === '#') continue;
      let fp = fUlt; while (casilla(c, fp - 1) === '#') fp--;     // la fila del tabique del pasillo
      lamparasAbajo.push({ x: ax(w.x + (c + 1) * S) + 7, fila: fp });
    }
  }

  // ===== LA LUZ, por escalones
  const tope = ay(yPisoAbajo);
  const campo = dia
    ? (x, y) => {
      if (y < 8) return 0;
      let f = y < ay(yPisoArriba) ? -1 : 0;
      // La cara de afuera de la pared de adelante da la espalda al sol.
      if (y >= ay(yPisoAbajo - tc.alturaParedBaja) + 8) return -1;
      if (y >= ay(yPisoAbajo - tc.alturaParedBaja)) return 0;
      // El sol que entra por cada ventanal del fondo y cae en diagonal al piso.
      const y0 = ay(yPisoArriba);
      for (const [c0, c1] of ventanasFondo) {
        const vx = ax(w.x + c0 * S) + 3, vw = ax(w.x + (c1 + 1) * S) - 3 - vx;
        if (y > y0 && y < tope) {
          const xs = vx + 4 - (y - y0) * 0.5;
          const dentro = Math.min(x - xs, xs + vw - 6 - x, y - y0, (tope - 8) - y);
          f += Math.max(0, Math.min(1, dentro / 3));
        }
      }
      return f;
    }
    : (x, y) => {
      if (y >= ay(yPisoAbajo - tc.alturaParedBaja) + 8) return -2;
      // Un escalón entero: con -1,6 TODO el piso quedaba tramado (Santi: "cansa
      // un poco la vista"). El tramado va sólo en el borde de la luz.
      // La pared del fondo, un escalón menos oscura: con -2 quedaba negra y se
      // perdían las tablas.
      let f = y < ay(yPisoArriba) ? -1 : -2;
      const yCharco = ay(yPisoArriba) + Math.round((tope - ay(yPisoArriba)) * 0.32);
      // (🆕 En el comedor, más tenues: la luz de querosén de la gente común. En el dormitorio, lámparas
      // chicas, una por camarote.)
      const tenue = w.id === 'comedor' ? 0.8 : 1;
      for (const fx of faroles) {
        f += tenue * 2.6 * Math.max(0, 1 - Math.hypot((x - fx) / 80, (y - yCharco) / 50));
        f += 2.4 * Math.max(0, 1 - Math.hypot((x - fx) / 26, (y - 26) / 18));
      }
      // (🆕 Las de los camarotes de abajo del dormitorio: el charco en su camarote.)
      for (const L of lamparasAbajo) {
        const ly = ay((L.fila + 1.5) * S);
        f += 2.6 * Math.max(0, 1 - Math.hypot((x - L.x) / 60, (y - ly) / 40));
      }
      return f;
    };

  /**
   * 🔁 EL DETALLE VUELVE, MÁS TUPIDO DONDE HAY LUZ *(Santi: "cuando dije que no
   * tenga tanto detalle no me refería a eliminarlo por completo… agregá detalle
   * a todo el vagón pero que haya más en las zonas iluminadas")*. Cada detalle
   * chico (la veta, un clavo, un botón del asiento) se dibuja o no según la luz
   * que le cae: en lo oscuro queda uno de cada tres; bajo el sol de un ventanal
   * o en el charco de un farol, todos. Así el ojo descansa en la penumbra y
   * encuentra la textura donde mira, que es donde hay luz.
   */
  const hash = (x, y) => ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000) / 1000;
  const yPisoA = ay(yPisoArriba);
  const luzSola = (y) => {
    if (dia) return y < yPisoA ? -1 : 0;
    return y < yPisoA ? -1 : -2;
  };
  const realce = (x, y) => Math.max(0, Math.min(1, (campo(x, y) - luzSola(y)) / 1.2));
  const deja = (x, y, semilla = 0, oscuro = 0.33) => hash(x + semilla * 7919, y) < oscuro + (1 - oscuro) * realce(x, y);

  // ===== EL PISO: tablas a lo largo del vagón, de madera gastada
  {
    const r = rect(PISO), p = pone(PISO);
    const y0 = ay(yPisoArriba), y1 = ay(yPisoAbajo + 3);
    for (let y = y0; y < y1; y++) {
      /**
       * 🔁 MENOS DETALLE *(Santi: "hay demasiado detalle y cansa un poco la
       * vista")*: tablas de 8 en vez de 6, una junta cada 170 puntos en vez de
       * 83, sin el gastado salteado y sin la raya clara de cada tabla. Todas
       * del mismo tono: las separa sólo la junta.
       */
      const tabla = Math.floor((y - y0) / 8), off = (tabla * 61 + w.colStart * 11) % 110;
      for (let x = 0; x < W; x++) {
        let i = (y - y0) % 8 === 7 ? 33 : 34;
        if ((x + off) % 110 === 0) i = 33;
        p(x, y, i);
      }
    }
    // El detalle del piso: la veta (rayitas claras u oscuras a lo largo de la
    // tabla) y los dos clavos de cada punta de tabla, junto a la junta.
    for (let y = y0; y < y1 - 8; y += 8) {
      const tabla = Math.floor((y - y0) / 8), off = (tabla * 61 + w.colStart * 11) % 110;
      for (let x = 0; x < W; x++) {
        if ((x + off) % 110 === 0) {
          for (const dx of [-2, 2]) if (deja(x + dx, y + 2, 1)) { p(x + dx, y + 2, 32); p(x + dx, y + 5, 32); }
          continue;
        }
        const h = hash(x, tabla * 13 + 5);
        if (h > 0.035 || !deja(x, y + 3, 2)) continue;
        const largo = 3 + Math.floor(hash(x, tabla) * 5), fila = 1 + Math.floor(h * 1000) % 5;
        const color = hash(tabla, x) < 0.55 ? 35 : 33;
        for (let q = 0; q < largo; q++) if ((x + q + off) % 110 !== 0) p(x + q, y + fila, color);
      }
    }
    r(0, y0, W, 2, 32);                                                   // la sombra de la pared del fondo
    // Las puntas del vagón (las paredes de los costados, vistas desde arriba).
    for (let c = 0; c < cols; c++) for (let f = filasArriba; f < map.rows - filasAbajo; f++) {
      if (casilla(c, f) !== '#') continue;
      // (🆕 Los tabiques del dormitorio van aparte, finos: ver `dormitorio`.)
      if (w.id === 'dormitorio' && c > 0 && c < cols - 1) continue;
      const x = ax(w.x + c * S), x2 = ax(w.x + (c + 1) * S), y = ay(f * S), y2 = ay((f + 1) * S);
      r(x, y, x2 - x, y2 - y, 0);
      r(x + 1, y, x2 - x - 2, y2 - y, BORDE);
      r(x + 1, y, 2, y2 - y, BORDE_L);
      if (casilla(c, f + 1) !== '#') r(x + 1, y2 - 4, x2 - x - 2, 3, BORDE_S);
    }
  }

  // ===== LA PARED DEL FONDO: el borde del color del vagón y la cara de tablas
  const filete = (r, y) => {
    r(0, y, W, 1, 0); r(0, y + 1, W, 2, BORDE_L); r(0, y + 3, W, 3, BORDE); r(0, y + 6, W, 1, BORDE_S); r(0, y + 7, W, 1, 0);
  };
  {
    const r = rect(FONDO), p = pone(FONDO);
    const yCara = 8, yPie = ay(yPisoArriba);
    filete(r, 0);
    for (let x = 0; x < W; x++) for (let y = yCara; y < yPie; y++) p(x, y, x % 14 === 0 ? 1 : 3);
    for (let x = 7; x < W; x += 14) {
      if (deja(x, yCara + 2, 3)) p(x, yCara + 2, 5);
      if (deja(x, yPie - 5, 4)) p(x, yPie - 5, 5);
      // La veta de cada tabla: una o dos rayitas a lo alto.
      for (let k = 0; k < 2; k++) {
        const vx = x - 5 + Math.floor(hash(x, k + 9) * 11), vy = yCara + 4 + Math.floor(hash(k, x) * (yPie - yCara - 14));
        // En la pared, la veta casi sólo donde llega la luz: en lo oscuro parecían manchitas sueltas.
        if (vx % 14 === 0 || !deja(vx, vy, 5 + k, 0.08)) continue;
        const largo = 3 + Math.floor(hash(vx, vy) * 4);
        for (let q = 0; q < largo; q++) p(vx, vy + q, 4);
      }
    }
    r(0, yPie - 2, W, 2, 1);
    for (const [c0, c1] of ventanasFondo) {
      const vx = ax(w.x + c0 * S) + 3, vw = ax(w.x + (c1 + 1) * S) - 3 - vx;
      const vy = yCara + 10, vh = Math.round((yPie - yCara) * 0.55);
      r(vx - 1, vy - 1, vw + 2, vh + 2, 0);
      r(vx, vy, vw, vh, 5);
      r(vx + 2, vy + 2, vw - 4, vh - 4, dia ? 21 : 18);
      r(vx + Math.floor(vw / 2) - 1, vy + 2, 2, vh - 4, 5);
      r(vx + 2, vy + Math.floor(vh / 2), vw - 4, 1, 5);
      if (dia) {
        for (let q = 0; q < 5; q++) p(vx + 4 + q, vy + 3 + q, 22);
        for (let q = 0; q < 3; q++) p(vx + Math.floor(vw / 2) + 3 + q, vy + Math.floor(vh / 2) + 2 + q, 22);
      } else {
        p(vx + 5, vy + 4, 21); p(vx + vw - 6, vy + 6, 20); p(vx + 9, vy + vh - 6, 20);
      }
    }
    // 🆕 En el dormitorio, el perchero de cada camarote de arriba, con el saco colgado.
    if (w.id === 'dormitorio') for (const fx of faroles) {
      const hx = fx - 22, hy = yCara + 9;
      r(hx - 1, hy, 4, 2, 0); r(hx, hy, 2, 1, 24);                       // el gancho
      // El saco: los hombros caídos, el cuerpo y la manga, de paño marrón.
      r(hx - 4, hy + 2, 10, 15, 0);
      r(hx - 3, hy + 3, 8, 13, 33); r(hx - 3, hy + 3, 8, 1, 34); r(hx - 3, hy + 4, 1, 11, 34);
      r(hx + 1, hy + 4, 1, 11, 32); r(hx + 3, hy + 6, 1, 9, 32);          // la abertura y la manga
    }
    for (const fx of faroles) {
      const y = yCara + 12;
      r(fx - 3, y - 2, 7, 1, 0); r(fx - 1, y - 1, 3, 1, 28);
      r(fx - 3, y, 7, 9, 0);
      r(fx - 2, y + 1, 5, 7, dia ? 25 : 29, !dia);
      r(fx, y + 2, 1, 5, dia ? 24 : 30, !dia);
      r(fx - 3, y + 8, 7, 1, 28); r(fx - 1, y + 9, 3, 1, 6);
    }
  }


  /**
   * 🆕 P4 · EL COMEDOR, EL DE LA GENTE COMÚN *(Santi: "este comedor sea 'pobre'… clase baja, la
   * madera de las mesas y/o sillas podrían estar astilladas, las cortinas sucias y algunas apenas un
   * poco rotas")*. Gastado, no destruido: lo que se usa mucho y se arregla como se puede.
   *
   * LAS CORTINAS, de tela cruda desteñida, en cada ventanal del fondo *(Santi eligió mezclarlas)*: casi
   * todas anudadas a un costado (1) o corridas a medias (2), alguna con una mancha o un agujerito, y
   * una sola por vagón caída y rasgada abajo (3). **De día así; de noche, cerradas** *(Santi)*.
   */
  if (w.id === 'comedor') {
    const r = rect(FONDO), p = pone(FONDO);
    const yCara = 8, yPie = ay(yPisoArriba);
    const rota = Math.floor(hash(w.colStart, 3) * ventanasFondo.length);
    const TELA = 15, LUZ_T = 16, PLIEGUE = 14, MANCHA = 4;
    // Un paño: el borde oscuro, los pliegues que bajan y el ruedo. `roto`: el ruedo rasgado.
    const panio = (x, ancho, desde, largo, roto = false) => {
      for (let q = 0; q < ancho; q++) {
        const baja = roto ? Math.floor(hash(x + q, desde) * 4) : 0;
        const fin = desde + largo - baja;
        p(x + q, fin, 0);
        for (let y = desde; y < fin; y++) {
          const borde = q === 0 || q === ancho - 1;
          // (Los pliegues, cada cuatro y de a uno, oscuros; la luz sólo en el lomo de cada uno, arriba:
          // con un pliegue claro y uno oscuro cada tres parecía una persiana.)
          const lomo = q % 4 === 2 && y < desde + 4;
          p(x + q, y, borde ? 0 : y === fin - 1 ? PLIEGUE : q % 4 === 0 ? PLIEGUE : lomo ? LUZ_T : TELA);
        }
      }
    };
    const mancha = (x, y) => { r(x, y, 2, 2, MANCHA); p(x + 2, y + 1, MANCHA); };
    ventanasFondo.forEach(([c0, c1], k) => {
      const vx = ax(w.x + c0 * S) + 3, vw = ax(w.x + (c1 + 1) * S) - 3 - vx;
      const vy = yCara + 10, vh = Math.round((yPie - yCara) * 0.55);
      const tipo = k === rota ? 3 : hash(k + 1, w.colStart) < 0.5 ? 1 : 2;
      const sucia = hash(k, w.colStart + 7) < 0.4;
      // La barra de fierro.
      r(vx - 3, vy - 4, vw + 6, 1, 0); r(vx - 3, vy - 3, vw + 6, 1, 31);
      const desde = vy - 2, largo = vh + 4;
      const mitad = Math.ceil(vw / 2) + 2;
      if (!dia) {
        // De noche, cerradas: los dos paños se juntan en el medio (la rasgada, uno solo de punta a punta).
        if (tipo === 3) panio(vx - 2, vw + 4, desde, largo - 2, true);
        else { panio(vx - 2, mitad, desde, largo); panio(vx + vw + 2 - mitad, mitad, desde, largo); }
        if (tipo === 2) p(vx + 3, vy + 9, 18);                          // el agujerito
        if (sucia) mancha(vx + vw - 8, vy + vh - 6);
        return;
      }
      if (tipo === 1) {
        // Recogida y anudada a un costado (la barra no corre); el otro paño, caído.
        const nudo = vy + Math.round(vh * 0.45);
        panio(vx - 2, 6, desde, nudo - desde);
        r(vx - 2, nudo, 6, 3, 0); r(vx - 1, nudo, 4, 2, PLIEGUE);
        panio(vx - 3, 8, nudo + 3, desde + largo - nudo - 3);
        panio(vx + vw - 4, 6, desde, largo);
        if (sucia) mancha(vx - 1, nudo + 7);
      } else if (tipo === 2) {
        const a = Math.round(vw * 0.38) + 2;
        panio(vx - 2, a, desde, largo); panio(vx + vw + 2 - a, a, desde, largo);
        r(vx + 3, vy + 9, 2, 1, 21);                                     // el agujerito, con el cielo atrás
        if (sucia) mancha(vx + vw - a + 3, vy + vh - 5);
      } else {
        // Una sola, caída y rasgada abajo: la otra no está.
        panio(vx - 2, Math.round(vw * 0.55) + 2, desde, largo - 4, true);
        if (sucia) mancha(vx + 2, vy + 6);
      }
    });
  }

  // ===== LOS ASIENTOS: respaldo a la izquierda, almohadón de cuero y patas
  const ANCHO_ASIENTO = 15;
  const asientos = [];
  // (En el dormitorio las 'S' son camas: ver `dormitorio` más abajo.)
  if (w.id !== 'dormitorio') {
    const r = rect(ASIENTOS);
    const sube = Math.round(tc.alturaAsiento * 1.7 * PX);
    for (let c = 0; c < cols; c++) for (let f = 1; f < map.rows - 1; f++) {
      if (casilla(c, f) !== 'S' || casilla(c, f - 1) === 'S') continue;
      let fin = f; while (casilla(c, fin + 1) === 'S') fin++;
      const x = ax(w.x + c * S), x2 = ax(w.x + (c + 1) * S);
      const y = ay(f * S) - sube, y2 = ay((fin + 1) * S);
      /**
       * 🔁 15 PUNTOS DE FONDO, no la casilla entera (21) *(Santi: "achicar apenas el
       * sillón para que queden con los pies sobre el piso"; eligió 15 de 21/15/13)*:
       * el almohadón termina antes y los pies del que está sentado quedan en el
       * piso. La casilla sigue entera en el juego (delante queda una franja de unas
       * 4 unidades donde van los pies).
       */
      const bw = Math.min(x2 - x, ANCHO_ASIENTO), bh = y2 - y;
      // El contorno va por pieza (respaldo y almohadón): con uno solo para la
      // caja entera, arriba del almohadón quedaba un bloque negro.
      r(x, y, 7, bh - 3, 0);
      r(x + 5, y + sube - 3, bw - 5, bh - sube, 0);
      r(x + 1, y + 1, 5, bh - 8, 8);                           // el respaldo
      r(x + 1, y + 1, 5, 1, 10); r(x + 2, y + 2, 1, bh - 10, 9);
      r(x + 6, y + sube - 2, bw - 7, bh - sube - 6, 9);        // el almohadón
      r(x + 6, y + sube - 2, bw - 7, 1, 10);
      for (let q = y + sube + 2; q < y + bh - 10; q += 6) {
        for (const bx of [x + 9, x + bw - 5]) if (bx < x + bw - 2 && deja(bx, q, 6)) r(bx, q, 1, 1, 8);
      }
      for (let q = y + 4; q < y + bh - 10; q += 6) if (deja(x + 3, q, 7)) r(x + 3, q, 1, 1, 39);
      r(x + 1, y + bh - 8, bw - 2, 4, 39);                     // la cara de adelante
      r(x + 1, y + bh - 8, bw - 2, 1, 8);
      r(x + 2, y + bh - 4, 2, 3, 3); r(x + bw - 4, y + bh - 4, 2, 3, 3);   // las patas
      asientos.push({ x, y, w: bw, h: bh, base: (fin + 1) * S - 0.01 });
    }
  }

  /**
   * 🆕 P4 · LAS MESAS DEL COMEDOR, de madera pelada (sin barniz), con un banco sin respaldo a cada
   * lado *(Santi eligió la B)*. La tapa con la orilla gastada, las tablas, las marcas de los jarros y
   * alguna astilla; encima, la vajilla de lata esmaltada (blanca con el borde azul): unas servidas,
   * otras a medio comer, otras ya vacías. Cada mesa y cada banco es una pieza (se mezclan con la gente).
   */
  const MESAS = capa();
  const muebles = [];
  if (w.id === 'comedor') {
    const r = rect(MESAS), p = pone(MESAS);
    const MAD = 5, MAD_L = 6, MAD_S = 4, MAD_SS = 3;
    // Un mapa chico de colores: cada letra, un color (`.` vacío).
    const dibujo = (x, y, filas, col) => filas.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') p(x + q, y + j, col[fila[q]]); });
    const LATA = { o: 0, b: 20, w: 17, s: 16, c: 3, h: 4, g: 24, G: 25, d: 23, p: 6, P: 7 };
    const PLATO = ['.bbbbb.', 'bwwwwwb', 'bwwwwwb', '.bbbbb.'];
    const PLATO_LLENO = ['.bbbbb.', 'bwchcwb', 'bwhchwb', '.bbbbb.'];
    const PLATO_MEDIO = ['.bbbbb.', 'bwwchwb', 'bwwwwwb', '.bbbbb.'];
    const JARRO = ['bbb.', 'wwwb', 'swwb', 'sww.'];
    const CAFETERA = ['.dd..', 'gGgg.', 'gGggd', 'gggg.', 'dddd.'];
    const PAN = ['.pPp.', 'ppppp', '.hhh.'];
    for (let c = 0; c < cols; c++) for (let f = filasArriba; f < map.rows - filasAbajo; f++) {
      if (casilla(c, f) !== 'C' || casilla(c - 1, f) === 'C' || casilla(c, f - 1) === 'C') continue;
      let c2 = c; while (casilla(c2 + 1, f) === 'C') c2++;
      let f2 = f; while (casilla(c, f2 + 1) === 'C') f2++;
      const x = ax(w.x + c * S), x2 = ax(w.x + (c2 + 1) * S), y = ay(f * S), y2 = ay((f2 + 1) * S);
      const base = (f2 + 1) * S - 0.01;
      // --- los bancos, uno a cada lado (sin respaldo): el asiento de tablas, su canto y las patas
      for (const bc of [c - 1, c2 + 1]) {
        if (casilla(bc, f) !== 'B') continue;
        // 🔁 Pegado a la mesa, con una unidad para las piernas (como el choque, ver 'B' en world/tilemap.js).
        const derecha = bc > c, bx = ax(w.x + bc * S + (derecha ? 1 : 4)), bw = ax(w.x + bc * S + (derecha ? 12 : 15)) - bx;
        // 🔁 Más bajos *(Santi: "las mesas quedaron muy altas al igual que los bancos")*: el asiento a
        // 7 puntos del piso (unos 45 cm, con la gente de 27 puntos).
        const ALTO_BANCO = 7, by = y - ALTO_BANCO + 3, bh = y2 - ALTO_BANCO - by;
        r(bx - 1, by - 1, bw + 2, bh + 4, 0);
        r(bx, by, bw, bh, MAD);
        r(bx, by, 1, bh, MAD_L);                                       // la orilla a la luz
        r(bx + Math.floor(bw / 2), by, 1, bh, MAD_S);                  // la junta de las dos tablas
        for (let q = by + 4; q < by + bh - 2; q += 5) if (deja(bx + 3, q, 11)) p(bx + 3 + (q % 3), q, MAD_S);
        r(bx, by + bh, bw, 2, MAD_SS); r(bx, by + bh, bw, 1, MAD_S);    // el canto
        const pata = y2 - (by + bh + 2);
        for (const px of [bx + 1, bx + bw - 3]) { r(px - 1, by + bh + 2, 4, pata, 0); r(px, by + bh + 2, 2, pata - 1, MAD_SS); }
        muebles.push({ x: bx - 1, y: by - 1, w: bw + 2, h: y2 - by + 1, base: base - 0.01 });
      }
      // --- la mesa: la tapa de tablas, su canto y las patas
      // 🔁 La tapa a 11 puntos del piso (unos 75 cm): el canto de 3 y las patas de 8.
      const ALTO_MESA = 11, ancho = x2 - x - 4, ty = y - ALTO_MESA + 2, hondo = y2 - ALTO_MESA - ty;
      r(x + 1, ty - 1, ancho + 2, hondo + 5, 0);
      r(x + 2, ty, ancho, hondo, MAD);
      r(x + 2, ty, ancho, 1, MAD_L);
      for (let q = ty + 7; q < ty + hondo - 2; q += 7) r(x + 2, q, ancho, 1, MAD_S);   // las juntas de las tablas
      // La orilla de adelante, gastada de tanto apoyar los codos (clara, salteada).
      for (let q = 0; q < ancho; q++) if (hash(x + q, ty) < 0.55) p(x + 2 + q, ty + hondo - 1, MAD_L);
      // La veta y las marcas de los jarros (anillos oscuros), más donde hay luz.
      for (let k = 0; k < 6; k++) {
        const vx = x + 4 + Math.floor(hash(c * 7 + k, f) * (ancho - 8)), vy = ty + 2 + Math.floor(hash(k, c * 5 + f) * (hondo - 5));
        if (!deja(vx, vy, 12 + k)) continue;
        if (k < 2) { p(vx, vy, MAD_S); p(vx + 2, vy, MAD_S); p(vx + 1, vy - 1, MAD_S); p(vx + 1, vy + 1, MAD_S); }
        else for (let q = 0; q < 3 + k % 3; q++) p(vx + q, vy, k % 2 ? MAD_S : MAD_L);
      }
      // Una astilla: un pedazo que falta en una esquina de adelante.
      const astilla = hash(c, f + 31) < 0.5 ? x + 3 : x + ancho - 1;
      p(astilla, ty + hondo - 1, 0); p(astilla + 1, ty + hondo - 1, 0); p(astilla, ty + hondo - 2, MAD_S);
      r(x + 2, ty + hondo, ancho, 3, MAD_SS); r(x + 2, ty + hondo, ancho, 1, MAD_S);   // el canto
      const pata = y2 - (ty + hondo + 3);
      for (const px of [x + 4, x2 - 6]) { r(px - 1, ty + hondo + 3, 4, pata, 0); r(px, ty + hondo + 3, 2, pata - 1, MAD_SS); }
      // --- lo de encima: 0 servida, 1 a medio comer, 2 vacía
      const estado = Math.floor(hash(c * 3 + 1, f * 5 + w.colStart) * 3);
      const filasPlato = [ty + Math.round(hondo * 0.22), ty + Math.round(hondo * 0.62)];
      const lados = [x + 4, x2 - 13];
      lados.forEach((lx, li) => filasPlato.forEach((py, pi) => {
        const k = li * 2 + pi, h = hash(c + k, f + 17);
        if (estado === 2 && h < 0.6) return;
        dibujo(lx + (li ? 0 : 1), py, estado === 0 ? PLATO_LLENO : estado === 1 && h < 0.5 ? PLATO_MEDIO : PLATO, LATA);
        if (h > 0.35) dibujo(li ? lx - 5 : lx + 8, py - 1, JARRO, LATA);
      }));
      const cx = x + Math.floor(ancho / 2);
      if (estado < 2) dibujo(cx - 2, ty + Math.round(hondo * 0.3), CAFETERA, LATA);
      if (estado === 0) dibujo(cx - 3, ty + Math.round(hondo * 0.62), PAN, LATA);
      // (La mesa va ANTES de la gente sentada en sus bancos, que se ordena por el borde de abajo del
      // banco: así se les ven los brazos apoyados; lo de las piernas que cae debajo de la tapa no se
      // dibuja, ver `mesa` en estiloNuevo/gente.js.)
      muebles.push({ x: x + 1, y: ty - 1, w: ancho + 2, h: y2 - ty + 1, base });
    }
  }

  /**
   * 🆕 P4 · EL DORMITORIO, DE CLASE MEDIA *(Santi eligió la B: pagaron más que el asiento, pero no son
   * ricos)*: madera barnizada pero vieja, la frazada de lana, todo prolijo y sencillo. Un escalón entre
   * el comedor y primera clase.
   *
   * LOS TABIQUES DE LOS CAMAROTES, bajos y cortados (`ALTO_TABIQUE`): la tapa arriba y, si debajo hay
   * piso, la cara de tablas hacia acá. Así se ve adentro del camarote; altos, taparían la cama. Cada
   * casilla es una pieza, para mezclarse con la gente.
   *
   * LAS CORTINAS DE PAÑO VERDE en la abertura de cada camarote *(Santi eligió la A)*: de día recogidas a
   * los dos costados; de noche cerradas, y tapan la vista (la casilla 'Q', ver world/tilemap.js).
   *
   * LA CAMA *(la A: una por camarote)*: un catre sencillo, en vertical, con la almohada arriba (donde va
   * la cabeza del que duerme, ver passenger.js).
   */
  if (w.id === 'dormitorio') {
    const r = rect(MESAS), p = pone(MESAS);
    // (🔁 21 puntos, por el hombro *(Santi eligió 21 de 10/16/21/27: "las veo muy bajitas")*.)
    // (🔁 Las camas, primero: la pared del pasillo de los camarotes de arriba les tapa los pies *(Santi:
    // "te dije claramente que cortes la cama para que parezca que la pared del dormitorio la tapa")*.
    // Todo va en la misma capa; pintada después, la cama quedaba encima de la pared.)
    const MAD_SS = 1, MAD_S = 3, MAD = 4, MAD_L = 5;
    /**
     * Las camas. 🔁 Más sencillas *(Santi: "que las camas se vean menos premium")*: un catre de madera
     * sin cabecera, el colchón con la sábana cruda, una almohada chata y una frazada de lana parda, lisa.
     */
    const SAB = 16, SAB_S = 15, LANA = 14, LANA_L = 15, ALTO_CAMA = 8;
    for (let c = 0; c < cols; c++) for (let f = filasArriba; f < map.rows - filasAbajo; f++) {
      if (casilla(c, f) !== 'S' || casilla(c - 1, f) === 'S' || casilla(c, f - 1) === 'S') continue;
      let c2 = c; while (casilla(c2 + 1, f) === 'S') c2++;
      let f2 = f; while (casilla(c, f2 + 1) === 'S') f2++;
      const x = ax(w.x + c * S) + 1, x2 = ax(w.x + (c2 + 1) * S) - 1, y = ay(f * S), y2 = ay((f2 + 1) * S);
      // (🔁 En vertical, la cabecera arriba, contra la pared *(Santi: "las camas en vertical")*. Del largo
      // de una persona entera acostada (27 puntos), con la almohada y apenas lugar a los pies *(Santi: "arma
      // la cama para el cuerpo parado de un personaje"; con las dos casillas enteras "quedó larguísima")*.
      // Lo que sobra de la casilla, piso. En los camarotes de arriba, la pared del pasillo le tapa los pies
      // *(Santi: "hacé de cuenta que la tapa la pared")*.)
      const LARGO_CAMA = 30;
      const ty = y - ALTO_CAMA + 3, tf = ty + LARGO_CAMA;                 // la tapa (el colchón), de ty a tf
      const ancho = x2 - x;
      // El colchón con la sábana.
      r(x, ty - 1, ancho, tf - ty + 2, 0);
      r(x + 1, ty, ancho - 2, tf - ty, SAB);
      // La almohada, chata, arriba.
      r(x + 2, ty + 1, ancho - 4, 6, SAB_S); r(x + 3, ty + 2, ancho - 6, 4, SAB);
      // La frazada, lisa, con la sábana doblada apenas encima.
      const fy = ty + 9;
      r(x + 1, fy, ancho - 2, tf - fy, LANA);
      r(x + 1, fy, ancho - 2, 2, SAB_S);
      r(x + 1, fy + 2, 1, tf - fy - 2, LANA_L);
      // El canto hacia acá (los pies): la frazada cae un poco y el catre con las patas.
      r(x, tf, ancho, ALTO_CAMA, 0);
      r(x + 1, tf, ancho - 2, 2, LANA);
      r(x + 1, tf + 2, ancho - 2, 2, MAD_S); r(x + 1, tf + 2, ancho - 2, 1, MAD);
      r(x + 2, tf + 4, 2, ALTO_CAMA - 5, MAD_SS); r(x2 - 4, tf + 4, 2, ALTO_CAMA - 5, MAD_SS);
      muebles.push({ x, y: ty - 1, w: ancho, h: y2 - (ty - 1), base: (f2 + 1) * S - 0.03 });
      /**
       * 🆕 EL LAVATORIO de cada camarote *(Santi eligió la A: "para que no se vea tan vacío")*: un
       * mueblecito de madera con la palangana y la jarra de loza (blanca con el borde azul). SIN CHOQUE
       * *(Santi: "al ser pegado a la pared no quiero que tenga colisión")*: es sólo dibujo, se mezcla con
       * la gente por su borde de abajo. Sólo arriba, contra la pared del fondo, al lado de la cabecera.
       */
      const arribaDelPasillo = f < map.rows / 2;
      /**
       * 🆕 EN LOS CAMAROTES DE ABAJO, UNA ALFOMBRA en vez del lavatorio *(Santi: "en las habitaciones
       * cercanas a la pantalla quedó mal… pon alfombras… un poco desteñidas, y algunas un poco rotas")*:
       * en el piso libre entre el tabique y la cama (en el piso: no choca con nada). De lana, roja, azul o
       * verde gastadas: la guarda, el campo con un rombo, el fleco en las puntas; desteñida a manchas, y
       * algunas con un agujero, una punta comida o el fleco deshilachado.
       */
      if (!arribaDelPasillo) {
        const pp = pone(PISO);
        // (🔁 Sorteadas en cada tren *(Santi: "que se sortearan de manera aleatoria para que no todos los
        // trenes tengan las mismas alfombras en el mismo lugar")*: el número va guardado en el tren, así
        // de día y de noche son las mismas.)
        const sa = train._semillaAlfombras ?? (train._semillaAlfombras = Math.floor(Math.random() * 9973));
        let cl = c; while (casilla(cl - 1, f) !== '#' && cl > 0) cl--;
        const ax0 = ax(w.x + cl * S) + 4, ax1 = ax(w.x + c * S) - 5, ay0 = ay(f * S) + 4, ay1 = ay((f2 + 1) * S) - 5;
        const h = hash(c + sa, f + 31);
        const [BASE, CLARO, OSC] = [[11, 12, 47], [19, 20, 40], [26, 27, 42]][Math.floor(h * 3)];
        const rota = hash(c + 5 + sa, f) < 0.6, agujero = rota && hash(c + sa, f + 3) < 0.5;
        const hx = ax0 + 6 + Math.floor(hash(c + sa, 9) * (ax1 - ax0 - 16)), hy = ay0 + 4 + Math.floor(hash(9, c + sa) * (ay1 - ay0 - 10));
        const mx = (ax0 + ax1) / 2, my = (ay0 + ay1) / 2;
        for (let yy = ay0; yy < ay1; yy++) for (let xx = ax0; xx < ax1; xx++) {
          const bx = Math.min(xx - ax0, ax1 - 1 - xx), by = Math.min(yy - ay0, ay1 - 1 - yy), b = Math.min(bx, by);
          // La punta comida (abajo a la derecha) y el agujero.
          if (rota && !agujero && (ax1 - 1 - xx) + (ay1 - 1 - yy) < 5) continue;
          if (agujero && Math.abs(xx - hx) + Math.abs(yy - hy) * 1.5 < 3) continue;
          let i = b < 2 ? OSC : b === 2 ? CLARO : BASE;
          // El rombo del medio.
          const rombo = Math.abs(xx - mx) / ((ax1 - ax0) / 2 - 5) + Math.abs(yy - my) / ((ay1 - ay0) / 2 - 4);
          if (b > 3 && rombo < 0.55 && rombo > 0.38) i = OSC;
          if (b > 3 && rombo < 0.2) i = CLARO;
          // Desteñida a manchas (el sol y los pies).
          if (i !== CLARO && hash(Math.floor(xx / 3) + sa, Math.floor(yy / 2) + c * 7) < 0.14) i = i === OSC ? BASE : CLARO;
          pp(xx, yy, i);
        }
        // El fleco, en las dos puntas (deshilachado: le faltan hilos).
        for (let yy = ay0 + 1; yy < ay1 - 1; yy += 2) for (const xx of [ax0 - 1, ax1]) if (!(rota && hash(xx + sa, yy) < 0.4)) pp(xx, yy, 16);
        continue;
      }
      let lx = x2 + 3;
      const LW = 14, LD = 7, LH = 11;
      const lyA = arribaDelPasillo ? ay(f * S) : ay(f * S) + 4;          // el piso donde apoya, atrás
      const lt = lyA - LH, lf = lt + LD;                                   // la tapa: de lt a lf; la cara, de lf a lyA + LD
      r(lx - 1, lt - 1, LW + 2, lyA + LD - lt + 1, 0);
      // La tapa del mueble.
      r(lx, lt, LW, LD, MAD); r(lx, lt, LW, 1, MAD_L);
      // La palangana, redonda, con el borde azul.
      r(lx + 3, lt + 1, 6, 1, 20); r(lx + 2, lt + 2, 1, 3, 20); r(lx + 9, lt + 2, 1, 3, 20); r(lx + 3, lt + 5, 6, 1, 20);
      r(lx + 3, lt + 2, 6, 3, 17); r(lx + 4, lt + 2, 2, 1, 30);
      // La jarra, parada al costado, con su contorno.
      r(lx + 9, lt - 4, 5, 10, 0);
      r(lx + 10, lt - 3, 3, 8, 17); r(lx + 10, lt - 3, 3, 1, 30); r(lx + 12, lt - 2, 1, 7, 16);
      // La cara: dos puertitas y las patas.
      r(lx, lf, LW, LH - 2, MAD_S); r(lx, lf, LW, 1, MAD);
      r(lx + Math.floor(LW / 2), lf + 1, 1, LH - 4, MAD_SS);
      r(lx + Math.floor(LW / 2) - 2, lf + 4, 1, 1, 28); r(lx + Math.floor(LW / 2) + 2, lf + 4, 1, 1, 28);
      r(lx + 1, lyA + LD - 2, 2, 2, MAD_SS); r(lx + LW - 3, lyA + LD - 2, 2, 2, MAD_SS);
      muebles.push({ x: lx - 1, y: lt - 4, w: LW + 2, h: lyA + LD - lt + 4, base: (lyA + LD) * PASO + yArriba });
    }
    const ALTO_TABIQUE = 21, GRUESO = 6;
    const interior = (c, f) => c > 0 && c < cols - 1 && f >= filasArriba && f < map.rows - filasAbajo;
    const esTabique = (c, f) => casilla(c, f) === '#' && interior(c, f);
    // 🔁 Finos, por el medio de la casilla (ocupando la casilla entera parecían mesas): un núcleo de
    // `GRUESO` puntos que se estira hacia cada tabique vecino.
    const nucleo = (c, f) => {
      const x = ax(w.x + c * S), x2 = ax(w.x + (c + 1) * S), y = ay(f * S), y2 = ay((f + 1) * S);
      const mx = Math.round((x + x2) / 2), my = Math.round((y + y2) / 2), g = GRUESO / 2;
      return { x, x2, y, y2, cx0: mx - g, cx1: mx + g, cy0: my - g, cy1: my + g };
    };
    for (let c = 1; c < cols - 1; c++) for (let f = filasArriba; f < map.rows - filasAbajo; f++) {
      if (!esTabique(c, f)) continue;
      const N = nucleo(c, f);
      // (🔁 Abajo, hasta la pared de adelante *(Santi: "la pared interior de las habitaciones de más cerca a
      // la pantalla no llegan al final")*: terminaba en el medio de su última casilla.)
      const contraAfuera = f + 1 >= map.rows - filasAbajo && (casilla(c, f + 1) === '#' || casilla(c, f + 1) === 'W');
      const arr = esTabique(c, f - 1), aba = esTabique(c, f + 1) || contraAfuera;
      // (🔁 Junto a la abertura de un camarote, el tabique llega hasta el borde de su casilla, que es pared
      // entera en el juego: si no, la abertura dibujada era más ancha que el paso *(Santi: "la cortina
      // quedó muy larga")*.)
      const abre = (q) => casilla(q, f) === '.' || casilla(q, f) === 'Q';
      const horiz = esTabique(c - 1, f) || esTabique(c + 1, f);
      const izq = esTabique(c - 1, f) || (horiz && abre(c - 1)), der = esTabique(c + 1, f) || (horiz && abre(c + 1));
      // Los tramos de la tapa (en el piso; después se suben ALTO_TABIQUE): el horizontal y el vertical.
      const tramos = [[izq ? N.x : N.cx0, N.cy0, der ? N.x2 : N.cx1, N.cy1]];
      // (Contra la pared de afuera, la tapa baja también lo que mide de alto: llega a la pared de adelante.)
      if (arr || aba) tramos.push([N.cx0, arr ? N.y : N.cy0, N.cx1, aba ? N.y2 + (contraAfuera ? ALTO_TABIQUE : 0) : N.cy1]);
      const H = ALTO_TABIQUE;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      // Primero el contorno de todos los tramos, después el relleno (así no queda una raya en la junta).
      for (const [a, b, cc, d] of tramos) {
        const caraAbajo = !(aba && a === N.cx0 && cc === N.cx1) || !aba;
        const fin = d - H + (caraAbajo && (d === N.cy1 || !aba) ? H : 0);
        r(a - 1, b - H - 1, cc - a + 2, fin - (b - H) + 2, 0);
        x0 = Math.min(x0, a - 1); y0 = Math.min(y0, b - H - 1); x1 = Math.max(x1, cc + 1); y1 = Math.max(y1, fin + 1);
      }
      // (🔁 La tapa, del color del vagón, como el borde de las paredes de afuera *(Santi: "el borde de las
      // paredes interiores es igual al del piso, entonces se confunde")*.)
      for (const [a, b, cc, d] of tramos) {
        r(a, b - H, cc - a, d - b, BORDE);
        r(a, b - H, cc - a, 1, BORDE_L);
      }
      // La cara de tablas hacia acá, debajo del tramo horizontal (y del vertical si termina acá).
      const caras = [];
      if (!aba) caras.push([izq ? N.x : N.cx0, der ? N.x2 : N.cx1, N.cy1]);
      else if (izq || der) {
        if (izq) caras.push([N.x, N.cx0, N.cy1]);
        if (der) caras.push([N.cx1, N.x2, N.cy1]);
      }
      for (const [a, cc, yb] of caras) {
        r(a, yb - H, cc - a, H, MAD_S);
        r(a, yb - H, cc - a, 1, MAD_SS);
        for (let q = a + 3; q < cc - 1; q += 7) r(q, yb - H + 2, 1, H - 4, MAD_SS);
        r(a, yb - 1, cc - a, 1, 0);
        y1 = Math.max(y1, yb);
      }
      muebles.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, base: (f + 1) * S - 0.02 });
    }
    // Las lámparas de los camarotes de abajo, en la cara del tabique del pasillo.
    for (const L of lamparasAbajo) {
      const yb = nucleo(1, L.fila).cy1, y = yb - ALTO_TABIQUE + 4, fx = L.x;
      r(fx - 3, y - 2, 7, 1, 0); r(fx - 1, y - 1, 3, 1, 28);
      r(fx - 3, y, 7, 9, 0);
      r(fx - 2, y + 1, 5, 7, dia ? 25 : 29, !dia);
      r(fx, y + 2, 1, 5, dia ? 24 : 30, !dia);
      r(fx - 3, y + 8, 7, 1, 28);
    }
    // Las cortinas: en cada abertura de dos casillas entre tabiques, en la línea del tabique.
    const PANIO = 26, PANIO_L = 27, PANIO_S = 42;
    for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 2; c < cols - 2; c++) {
      const libre = (q) => casilla(q, f) === '.' || casilla(q, f) === 'Q';
      if (!(esTabique(c - 1, f) && libre(c) && libre(c + 1) && esTabique(c + 2, f))) continue;
      const A = nucleo(c - 1, f), B = nucleo(c + 2, f);
      // (🔁 De tabique a tabique *(Santi: "hay un espacio de unos pixeles entre el borde de la pared y el de
      // la cortina")*: el paso entero, las dos casillas.)
      const x = A.x2, x2 = B.x, yb = A.cy1, y = A.cy0 - ALTO_TABIQUE - 3;
      r(x, y, x2 - x, 1, 0); r(x, y + 1, x2 - x, 1, 24);                  // la barra
      const panio = (px, ancho) => {
        r(px, y + 2, ancho, yb - y - 2, 0);
        for (let q = 1; q < ancho - 1; q++) for (let jj = y + 3; jj < yb - 1; jj++) p(px + q, jj, q % 3 === 0 ? PANIO_S : q % 3 === 1 && jj < y + 6 ? PANIO_L : PANIO);
      };
      if (dia) { panio(x, 6); panio(x2 - 6, 6); }                         // recogidas a los costados
      else panio(x, x2 - x);                                              // cerrada
      muebles.push({ x, y, w: x2 - x, h: yb - y, base: (f + 1) * S - 0.02 });
    }
  }

  // ===== LA PARED DE ADELANTE: el borde y, debajo, su cara de afuera
  {
    const r = rect(FRENTE), p = pone(FRENTE);
    const yTope = ay(yPisoAbajo - tc.alturaParedBaja), yCaraFin = H - 1;
    filete(r, yTope);
    for (let x = 0; x < W; x++) for (let y = yTope + 8; y < yCaraFin - 3; y++) p(x, y, x % 12 === 0 ? BORDE_SS : BORDE_S);
    r(0, yCaraFin - 3, W, 3, 31); r(0, yCaraFin, W, 1, 0);
    /**
     * Las ventanillas de afuera, más chicas y arriba, como las ve el galope.
     * 🔁 Primero ocupaban casi toda la cara, y la pared de afuera —que está de
     * espaldas al sol y no es donde se juega— le ganaba al adentro.
     */
    for (const [c0, c1] of ventanasFrente) {
      const vx = ax(w.x + c0 * S) + 5, vw = ax(w.x + (c1 + 1) * S) - 5 - vx;
      const vy = yTope + 12, vh = Math.max(5, Math.round((yCaraFin - yTope - 12) * 0.45));
      r(vx - 1, vy - 1, vw + 2, vh + 2, 0);
      // De noche, desde afuera las ventanillas se ven prendidas (como en el galope).
      r(vx, vy, vw, vh, dia ? 19 : 44, !dia);
      if (!dia) r(vx + 1, vy + 1, vw - 2, vh - 2, 28, true);
      r(vx + Math.floor(vw / 2) - 1, vy, 2, vh, 0);
      if (dia) for (let q = 0; q < 3; q++) p(vx + 2 + q, vy + 1 + q, 20);
    }
  }

  const iluminado = (c) => iluminar({ ancho: W, alto: H, indices: c.i, marcas: c.m, campo });
  const recorte = (datos, x, y, ww, hh) => {
    const out = new Uint8ClampedArray(ww * hh * 4);
    for (let j = 0; j < hh; j++) out.set(datos.subarray(((y + j) * W + x) * 4, ((y + j) * W + x + ww) * 4), j * ww * 4);
    return out;
  };
  const enMundo = (x, y) => [x0 + x * PASO, yArriba + y * PASO];

  const resultado = { piso: [], altas: [], luz: (ux, uy) => Math.round(campo(ax(ux), ay(Math.min(uy, yPisoAbajo - 1)))) };
  resultado.piso.push(pieza(iluminado(PISO), W, H, x0, yArriba, 0));
  const yPie = ay(yPisoArriba);
  resultado.altas.push(pieza(recorte(iluminado(FONDO), 0, 0, W, yPie), W, yPie, x0, yArriba, yPisoArriba - 0.01));
  const asi = iluminado(ASIENTOS);
  for (const a of asientos) {
    const [mx, my] = enMundo(a.x, a.y);
    resultado.altas.push(pieza(recorte(asi, a.x, a.y, a.w, a.h), a.w, a.h, mx, my, a.base));
  }
  if (muebles.length) {
    const me = iluminado(MESAS);
    for (const m of muebles) {
      const [mx, my] = enMundo(m.x, m.y);
      resultado.altas.push(pieza(recorte(me, m.x, m.y, m.w, m.h), m.w, m.h, mx, my, m.base));
    }
  }
  const yF = ay(yPisoAbajo - tc.alturaParedBaja);
  const [, myF] = enMundo(0, yF);
  resultado.altas.push(pieza(recorte(iluminado(FRENTE), 0, yF, W, H - yF), W, H - yF, x0, myF, map.rows * S - 0.01));
  return resultado;
}
