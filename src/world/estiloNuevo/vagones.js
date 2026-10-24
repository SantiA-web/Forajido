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
import { WAGONS, nichoDeCaja } from '../../data/wagons.js';

/** Cuántas unidades del mundo mide un punto de la grilla (0,75 con puntos de 3). */
export const PASO = CONFIG.estilo.punto / DENSIDAD;
const PX = 1 / PASO;

/** Qué vagones ya se dibujan en el estilo nuevo. */
// 🆕 P4: el comedor (el de la gente común: ver `comedor` más abajo), el dormitorio (ver `dormitorio`),
// primera clase (ver `primeraClase`) y el de guardias (ver `guardias`).
// (🆕 Y el correo, el del tren de pasajeros.)
// (🆕 Y el caboose, la casa de la tripulación.)
// (🆕 Y el blindado, la bóveda de chapa.)
const NUEVOS = new Set(['pasajeros', 'comedor', 'dormitorio', 'primeraClase', 'guardias', 'correo', 'caboose', 'blindado']);
/** ¿Este vagón ya se dibuja en el estilo nuevo? (Lo usa world/train.js para las cajas fuertes.) */
export const esVagonNuevo = (id) => NUEVOS.has(id);

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
  // (🆕 El blindado, del gris de su chapa.)
  const hex = (w.id === 'blindado' && cc.blindado) || cc.coche[w.id] || cc.coche.pasajeros;
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
  // (🆕 En primera clase, más seguidas: la luz pareja de los que pagan.)
  const cada = w.id === 'primeraClase' ? 5 : F.cadaColumnas;
  const cuantos = Math.max(1, Math.floor((cols - 2) / cada));
  const sobra = cols - cuantos * cada;
  const faroles = [];
  for (let q = 0; q < cuantos; q++) {
    let c = Math.round(sobra / 2 + (q + 0.5) * cada);
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
  /**
   * 🆕 PRIMERA CLASE: LAS MESITAS, las casillas 'N' delante de cada sillón (chocan como los bancos del
   * comedor, ver world/tilemap.js). Cada una con su VELA, que de noche ilumina alrededor *(Santi: "si es
   * una vela de noche debería iluminar")*.
   */
  const mesitas = [];
  if (w.id === 'primeraClase') {
    for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 0; c < cols; c++) {
      if (casilla(c, f) !== 'N') continue;
      const mx = Math.round((ax(w.x + c * S) + ax(w.x + (c + 1) * S)) / 2) - 9, my = ay((f + 1) * S) - 3;
      mesitas.push({ f, mx, my, vx: mx + 12, vy: my - 16 });
    }
    /**
     * 🔁 LOS FAROLES, EN EL MEDIO DE LA PARED LISA entre dos ventanas *(Santi: "quedaron muy encima de las
     * ventanas, ponlos más al medio")*, y uno sobre la barra (entre el estante y la primera ventana). La
     * luz sale de ellos, así que los acompaña.
     */
    faroles.length = 0;
    let finEstante = 0;
    for (let c = 0; c < cols; c++) if (casilla(c, filasArriba + 2) === 'T') finEstante = c + 1;
    const huecos = [[finEstante - 1, ventanasFondo.length ? ventanasFondo[0][0] : cols - 1]];
    for (let k = 0; k + 1 < ventanasFondo.length; k++) huecos.push([ventanasFondo[k][1] + 1, ventanasFondo[k + 1][0]]);
    for (const [a, b] of huecos) faroles.push(ax(w.x + ((a + b) / 2) * S));
  }
  const lamparasAbajo = [];
  if (w.id === 'dormitorio') {
    const fUlt = map.rows - filasAbajo - 1;
    for (let c = 1; c < cols - 1; c++) {
      if (casilla(c, fUlt) !== '#' || casilla(c - 1, fUlt) === '#') continue;
      let fp = fUlt; while (casilla(c, fp - 1) === '#') fp--;     // la fila del tabique del pasillo
      lamparasAbajo.push({ x: ax(w.x + (c + 1) * S) + 7, fila: fp });
    }
  }

  /**
   * 🆕 EL VAGÓN DE GUARDIAS: dónde van las cosas que dan luz de noche (ver `guardias` más abajo): la vela
   * metida en una botella de cada mesa de cartas y la estufa salamandra, en el hueco entre dos catres de
   * arriba más cerca del medio.
   */
  const velas = [];
  let estufa = null;
  /**
   * 🆕 EL CABOOSE: qué es cada bulto ('C'), por la casilla de arriba a la izquierda (ver el plano en
   * data/wagons.js). Si el plano cambia, lo que no esté acá se dibuja como cofre.
   */
  // (🔁 La estufa, contra la pared y sin choque; en su lugar, los repuestos *(Santi: "se nota un poco raro una estufa en
  // el medio de un vagón, cuando en realidad suelen ir contra la pared"; eligió la B)*.)
  const MUEBLES_CABOOSE = { '1,1': 'escritorio', '1,7': 'carbon', '17,7': 'lena', '5,3': 'repuestos', '12,2': 'cofre', '7,6': 'barril', '13,7': 'lockers' };
  const lucesExtra = [];
  if (w.id === 'caboose') {
    for (const [k, que] of Object.entries(MUEBLES_CABOOSE)) {
      const [c, f] = k.split(',').map(Number);
      if (casilla(c, f) !== 'C') continue;
      if (que === 'escritorio') lucesExtra.push({ x: ax(w.x + (c + 1.6) * S), y: ay((f + 0.5) * S) - 16 });
    }
  }
  if (w.id === 'guardias') {
    for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 0; c < cols; c++) {
      if (casilla(c, f) !== 'C' || casilla(c - 1, f) === 'C') continue;
      let c2 = c; while (casilla(c2 + 1, f) === 'C') c2++;
      const x = ax(w.x + c * S), x2 = ax(w.x + (c2 + 1) * S), y = ay(f * S);
      velas.push({ c, c2, f, x, x2, vx: x2 - 9, vy: y - 22 });
    }
    const huecos = [];
    for (let c = 1; c < cols - 2; c++) if (casilla(c, filasArriba) === '.' && casilla(c - 1, filasArriba) === 'S') huecos.push(c);
    if (huecos.length) {
      const c = huecos.reduce((a, b) => (Math.abs(b + 0.5 - cols / 2) < Math.abs(a + 0.5 - cols / 2) ? b : a));
      // (🔁 Contra la pared *(Santi: "la estufita pégala a la pared y que no tenga colisión")*.)
      estufa = { c, x: ax(w.x + (c + 1) * S), y: ay(yPisoArriba) - 2 };
    }
  }

  // ===== LA LUZ, por escalones
  const tope = ay(yPisoAbajo);
  /**
   * 🆕 EL BLINDADO NO TIENE VENTANILLAS: lo alumbran sólo sus faroles, de día y de noche *(Santi eligió la A: "casi
   * igual de día que de noche, apenas más oscuro de noche")*. Lo que cambia es el piso lejos de los faroles: un
   * escalón más oscuro de noche.
   */
  const campoBlindado = (x, y) => {
    if (y >= ay(yPisoAbajo - tc.alturaParedBaja) + 8) return dia ? -1 : -2;
    let f = y < ay(yPisoArriba) ? -1 : dia ? -1 : -2;
    const yCharco = ay(yPisoArriba) + Math.round((tope - ay(yPisoArriba)) * 0.32);
    for (const fx of faroles) {
      // (2: con 2,4 el medio del charco llegaba al blanco y hacía una crucecita de puntos.)
      f += 2 * Math.max(0, 1 - Math.hypot((x - fx) / 80, (y - yCharco) / 50));
      f += 2.4 * Math.max(0, 1 - Math.hypot((x - fx) / 26, (y - 24) / 18));
    }
    return f;
  };
  const campo = w.id === 'blindado' ? campoBlindado : dia
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
      // (🆕 En el de guardias, como en el comedor: querosén.)
      const tenue = w.id === 'comedor' || w.id === 'guardias' ? 0.8 : w.id === 'primeraClase' ? 0.85 : 1;
      for (const fx of faroles) {
        f += tenue * 2.6 * Math.max(0, 1 - Math.hypot((x - fx) / 80, (y - yCharco) / 50));
        f += 2.4 * Math.max(0, 1 - Math.hypot((x - fx) / 26, (y - 26) / 18));
      }
      // (🆕 Las velas de las mesitas de primera clase: un charco chico.)
      for (const M of mesitas) f += 1.7 * Math.max(0, 1 - Math.hypot((x - M.vx) / 30, (y - M.vy - 6) / 20));
      // (🆕 Las velas de las mesas de cartas del de guardias, y el resplandor de la estufa, abajo.)
      for (const V of velas) f += 1.8 * Math.max(0, 1 - Math.hypot((x - V.vx) / 34, (y - V.vy - 8) / 22));
      if (estufa) f += 1.6 * Math.max(0, 1 - Math.hypot((x - estufa.x) / 34, (y - estufa.y + 4) / 20));
      // (🆕 La lámpara del escritorio del caboose.)
      for (const L of lucesExtra) f += 1.6 * Math.max(0, 1 - Math.hypot((x - L.x) / 30, (y - L.y - 8) / 20));
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
    if (w.id === 'blindado') return y < yPisoA ? -1 : dia ? -1 : -2;
    if (dia) return y < yPisoA ? -1 : 0;
    return y < yPisoA ? -1 : -2;
  };
  const realce = (x, y) => Math.max(0, Math.min(1, (campo(x, y) - luzSola(y)) / 1.2));
  const deja = (x, y, semilla = 0, oscuro = 0.33) => hash(x + semilla * 7919, y) < oscuro + (1 - oscuro) * realce(x, y);

  // ===== EL PISO: tablas a lo largo del vagón, de madera gastada
  {
    const r = rect(PISO), p = pone(PISO);
    const y0 = ay(yPisoArriba), y1 = ay(yPisoAbajo + 3);
    if (w.id === 'blindado') {
      /**
       * 🆕 EL BLINDADO: PISO DE CHAPA, en planchas de dos columnas por una fila, con las juntas oscuras y LOS
       * REMACHES a lo largo de cada junta (uno de los cinco detalles), más donde hay luz. (Sin rayones: bajo el farol
       * se veían como ruido.)
       */
      for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) p(x, y, 24);
      for (let c = 0; c <= cols; c += 2) {
        const jx = ax(w.x + c * S);
        r(jx, y0, 1, y1 - y0, 31);
        for (let y = y0 + 3; y < y1; y += 5) if (deja(jx + 2, y, 60, 0.4)) p(jx + 2, y, 23);
      }
      for (let f = filasArriba + 1; f * S <= yPisoAbajo; f++) {
        const jy = ay(f * S);
        r(0, jy, W, 1, 31);
        for (let x = 3; x < W; x += 6) if (deja(x, jy + 2, 61, 0.4)) p(x, jy + 2, 23);
      }
    } else {
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
    }
    r(0, y0, W, 2, w.id === 'blindado' ? 31 : 32);                        // la sombra de la pared del fondo
    // Las puntas del vagón (las paredes de los costados, vistas desde arriba).
    for (let c = 0; c < cols; c++) for (let f = filasArriba; f < map.rows - filasAbajo; f++) {
      if (casilla(c, f) !== '#') continue;
      // (🆕 Los tabiques del dormitorio van aparte, finos: ver `dormitorio`.)
      if (w.id === 'dormitorio' && c > 0 && c < cols - 1) continue;
      // (🆕 Las dos puntas del vagón, finitas y de arriba a abajo: ver `PUNTAS` más abajo.)
      if (c === 0 || c === cols - 1) continue;
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
    /**
     * 🧳 EL PORTAEQUIPAJES DEL VAGÓN DE PASAJEROS (world/caidas.js), en cada tramo liso de la pared entre dos ventanas:
     * dos varillas de bronce sobre dos ménsulas, y la sombra en la pared. Lo que lleva encima se dibuja aparte (se cae).
     */
    if (w.id === 'pasajeros') {
      const Y = CONFIG.caidas.repisaPuntos;
      for (let k = 0; k + 1 < ventanasFondo.length; k++) {
        const xa = ax(w.x + (ventanasFondo[k][1] + 1) * S) + 4, xb = ax(w.x + ventanasFondo[k + 1][0] * S) - 4;
        r(xa, Y + 2, xb - xa, 2, 1);                                        // la sombra en la pared
        r(xa - 1, Y - 1, xb - xa + 2, 3, 0);
        r(xa, Y, xb - xa, 1, 6); r(xa, Y - 1, xb - xa, 1, 0);
        for (let x = xa + 3; x < xb - 2; x += 6) if (deja(x, Y, 9, 0.4)) p(x, Y, 7);   // el brillo del bronce
        r(xa + 1, Y + 1, xb - xa - 2, 1, 5);                                 // la varilla de abajo
        for (const mx of [xa + 2, xb - 4]) {                                  // las ménsulas
          r(mx - 1, Y + 1, 4, 7, 0);
          for (let q = 0; q < 5; q++) p(mx + (q < 3 ? 0 : 1), Y + 2 + q, 5);
          p(mx + 1, Y + 2, 6); p(mx + 2, Y + 2, 5);
        }
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
    // (🆕 En el correo, más arriba: debajo van los casilleros.)
    const yFarol = w.id === 'correo' ? yCara + 4 : yCara + 12;
    // (🆕 En el blindado no: los suyos cuelgan del techo y se hamacan, ver `blindado`.)
    for (const fx of w.id === 'blindado' ? [] : faroles) {
      const y = yFarol;
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

  /**
   * 🆕 P4 · PRIMERA CLASE, EL COCHE SALÓN *(Santi eligió las recomendaciones: sillones sueltos de
   * terciopelo verde botella, mesitas de madera lustrada; y sumó "una mesa bar con un bartender")*. Lo
   * rico se nota en el cuidado y el espacio, no en el oro: todo hace juego, alineado, la madera lustrada
   * con un punto de brillo donde le da la luz, poco bronce.
   *
   * LA PARED DEL FONDO, con paneles de caoba (la moldura y el brillo arriba a la izquierda de cada uno);
   * LAS CORTINAS DE TERCIOPELO VERDE recogidas con un cordón a los dos lados (de noche, cerradas); sobre
   * la barra, EL ESTANTE con las botellas y las copas.
   */
  if (w.id === 'primeraClase') {
    const r = rect(FONDO), p = pone(FONDO);
    const yCara = 8, yPie = ay(yPisoArriba);
    // Los paneles: de 14 de ancho, la moldura oscura, el campo y el brillo.
    // (🔁 Sin pisar las ventanas: encima del vidrio la dejaban cortada *(Santi)*.)
    // (🔁 Ni los faroles: también quedaban tapados *(Santi: "se le superpone a los faroles")*.)
    const enVentana = (xa, xb) => ventanasFondo.some(([c0, c1]) => xb > ax(w.x + c0 * S) + 1 && xa < ax(w.x + (c1 + 1) * S) - 1)
      || faroles.some((fx) => xb > fx - 5 && xa < fx + 5);
    for (let x0p = 2; x0p + 12 < W; x0p += 16) {
      if (enVentana(x0p, x0p + 12)) continue;
      const py = yCara + 4, ph = yPie - yCara - 9;
      r(x0p, py, 12, ph, 3); r(x0p, py, 12, 1, 1); r(x0p, py, 1, ph, 1);
      r(x0p + 11, py, 1, ph, 5); r(x0p, py + ph - 1, 12, 1, 5);
      if (deja(x0p + 2, py + 2, 8, 0.5)) { p(x0p + 2, py + 2, 6); p(x0p + 3, py + 2, 5); p(x0p + 2, py + 3, 5); }
    }
    r(0, yPie - 4, W, 2, 5); r(0, yPie - 4, W, 1, 6);                   // el zócalo lustrado
    // Los faroles, otra vez encima (las cortinas y el estante de esta pared se pintan después de ellos).
    const farolesEncima = () => { for (const fx of faroles) {
      const y = yCara + 12;
      r(fx - 3, y - 2, 7, 1, 0); r(fx - 1, y - 1, 3, 1, 28);
      r(fx - 3, y, 7, 9, 0);
      r(fx - 2, y + 1, 5, 7, dia ? 25 : 29, !dia);
      r(fx, y + 2, 1, 5, dia ? 24 : 30, !dia);
      r(fx - 3, y + 8, 7, 1, 28); r(fx - 1, y + 9, 3, 1, 6);
    } };
    // Las cortinas de terciopelo.
    const VER = 26, VER_L = 27, VER_S = 42, CORDON = 28;
    const panio = (x, ancho, desde, largo) => {
      for (let q = 0; q < ancho; q++) for (let y = desde; y < desde + largo; y++) {
        const borde = q === 0 || q === ancho - 1 || y === desde + largo - 1;
        p(x + q, y, borde ? 0 : q % 3 === 0 ? VER_S : q % 3 === 1 && y < desde + 5 ? VER_L : VER);
      }
    };
    for (const [c0, c1] of ventanasFondo) {
      const vx = ax(w.x + c0 * S) + 3, vw = ax(w.x + (c1 + 1) * S) - 3 - vx;
      const vy = yCara + 10, vh = Math.round((yPie - yCara) * 0.55);
      r(vx - 11, vy - 5, vw + 22, 1, 0); r(vx - 11, vy - 4, vw + 22, 1, 7);  // la barra, de bronce
      // (🔁 Hasta el piso *(Santi: "que las cortinas lleguen bien hasta el suelo para agregar
      // sofisticación")*, y recogidas AFUERA del marco: encima de la ventana la dejaban cortada.)
      const desde = vy - 3, largo = yPie - 2 - desde;
      if (dia) {
        // Recogidas a los dos lados, con el cordón.
        const nudo = vy + Math.round(vh * 0.6);
        for (const [x, lado] of [[vx - 10, 0], [vx + vw + 3, 1]]) {
          panio(x, 7, desde, nudo - desde);
          panio(x - (lado ? 0 : 1), 8, nudo + 2, desde + largo - nudo - 2);
          r(x - 1, nudo, 9, 2, 0); r(x, nudo, 7, 1, CORDON); p(x + (lado ? 1 : 5), nudo + 1, CORDON); p(x + (lado ? 1 : 5), nudo + 2, CORDON);
        }
      } else {
        const mitad = Math.ceil(vw / 2) + 11;
        panio(vx - 11, mitad, desde, largo); panio(vx + vw + 11 - mitad, mitad, desde, largo);
      }
    }
    // El estante de la barra, sobre los primeros `T` de arriba: dos repisas con botellas y copas.
    let b0 = -1, b1 = -1;
    for (let c = 0; c < cols; c++) if (casilla(c, filasArriba + 2) === 'T') { if (b0 < 0) b0 = c; b1 = c; }
    // (🔁 Sin la última casilla, la del tramo que sube: *(Santi: "la barra choca contra la estantería")*.)
    b1 -= 1;
    if (b0 >= 0) {
      const ex = ax(w.x + b0 * S) + 2, ew = ax(w.x + (b1 + 1) * S) - 2 - ex;
      r(ex - 1, yCara + 2, ew + 2, yPie - yCara - 6, 0);
      r(ex, yCara + 3, ew, yPie - yCara - 8, 1);                          // el fondo del mueble
      // (🥃 Las botellas y las copas van aparte, porque en el frenazo se caen: ver `dibujarBotellas` en world/caidas.js.)
      for (const ry of [yCara + 14, yCara + 27]) {
        r(ex, ry, ew, 2, 5); r(ex, ry, ew, 1, 6);                         // la repisa
      }
    }
    farolesEncima();
  }

  // ===== LOS ASIENTOS: respaldo a la izquierda, almohadón de cuero y patas
  const ANCHO_ASIENTO = 15;
  const asientos = [];
  // (En el dormitorio las 'S' son camas: ver `dormitorio` más abajo.)
  // (🆕 En el de guardias, también: son catres, ver `guardias`.)
  if (w.id !== 'dormitorio' && w.id !== 'guardias' && w.id !== 'caboose') {
    // (🆕 En primera clase, de terciopelo verde botella *(Santi eligió el verde)*; en el de pasajeros, cuero rojo.)
    const TT = w.id === 'primeraClase' ? { 39: 42, 8: 26, 9: 27, 10: 43, 3: 1 } : null;
    const r0 = rect(ASIENTOS);
    const r = (x, y, ww, hh, i) => r0(x, y, ww, hh, TT && TT[i] != null ? TT[i] : i);
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
  // (🆕 Las cortinas del dormitorio, un estado por capa: ver `dormitorio` más abajo.)
  const CORT = w.id === 'dormitorio' ? { c0: capa(), c1: capa(), c2: capa(), abierta: capa(), rota: capa() } : null;
  const cortinasV = [];
  /**
   * 🆕 LO QUE SE MUEVE CON EL TREN (el agua del barril y los troncos del canasto del caboose) *(Santi: "que el
   * barril tenga agua dentro que se va moviendo con el movimiento del tren, a la par")*: varios dibujos, uno por
   * momento del meneo; la pieza muestra el que toca (`estiloNuevo.meneo`, de -1 a 1, lo pone raidScene.js).
   * 🔁 Nueve, para que se mueva suave *(Santi: "que el movimiento del agua sea más fluido")*, y cada uno en su capa
   * chica, del tamaño de la pieza: del tamaño del vagón, iluminar nueve costaba.
   * `animado(x, y, ancho, alto, base, cuantos, dibujar)`: `dibujar(m, r, p)` dibuja cada uno, con `m` de -1 a 1.
   */
  const animadosV = [];
  const animado = (x, y, aw, ah, base, cuantos, dibujar, reloj = 0, fuente = 'meneo') => {
    const capas = Array.from({ length: cuantos }, () => ({ i: new Int16Array(aw * ah).fill(-1), m: new Uint8Array(aw * ah) }));
    capas.forEach((cp, k) => {
      const pa = (px, py, i, emite) => {
        px = Math.round(px) - x; py = Math.round(py) - y;
        if (px < 0 || py < 0 || px >= aw || py >= ah) return;
        cp.i[py * aw + px] = i; cp.m[py * aw + px] = emite ? 1 : 0;
      };
      const ra = (px, py, ww, hh, i, emite) => { for (let j = 0; j < hh; j++) for (let q = 0; q < ww; q++) pa(px + q, py + j, i, emite); };
      dibujar(cuantos > 1 ? (k / (cuantos - 1)) * 2 - 1 : 0, ra, pa);
    });
    // (`reloj`: en vez del meneo, avanza solo, un dibujo cada `reloj` segundos: el humito de la taza.)
    // (`fuente`: 'meneo', el del vagón; 'agua', el del agua, más lento: ver `estiloNuevo.meneoAgua`.)
    animadosV.push({ x, y, w: aw, h: ah, base, capas, reloj, fuente });
  };
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
      // (🆕 Y hasta la pared de la punta del vagón: con la punta finita, terminaba antes y quedaba un hueco.)
      const punta = (q) => (q === 0 || q === cols - 1) && casilla(q, f) === '#';
      const izq = esTabique(c - 1, f) || punta(c - 1) || (horiz && abre(c - 1)), der = esTabique(c + 1, f) || punta(c + 1) || (horiz && abre(c + 1));
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
    /**
     * Las cortinas: en cada abertura de dos casillas entre tabiques, en la línea del tabique. 🔁 Cada
     * estado en su capa (`CORT`): cerrada sana (c0), con algunos agujeros (c1), con muchos (c2),
     * abierta (recogida a los costados) y rota (rasgada y caída). La pieza elige cuál mostrar según la
     * cortina del juego (world/cortinas.js); de día, abiertas.
     */
    const PANIO = 26, PANIO_L = 27, PANIO_S = 42;
    for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 2; c < cols - 2; c++) {
      const libre = (q) => casilla(q, f) === '.' || casilla(q, f) === 'Q';
      if (!(esTabique(c - 1, f) && libre(c) && libre(c + 1) && esTabique(c + 2, f))) continue;
      const A = nucleo(c - 1, f), B = nucleo(c + 2, f);
      // (🔁 De tabique a tabique *(Santi: "hay un espacio de unos pixeles entre el borde de la pared y el de
      // la cortina")*: el paso entero, las dos casillas.)
      const x = A.x2, x2 = B.x, yb = A.cy1, y = A.cy0 - ALTO_TABIQUE - 3;
      for (const [estado, capaE] of Object.entries(CORT)) {
        const rr = rect(capaE), pp = pone(capaE);
        rr(x, y, x2 - x, 1, 0); rr(x, y + 1, x2 - x, 1, 24);              // la barra
        // `roto`: el ruedo rasgado, a distintas alturas.
        const panio = (px, ancho, roto = 0) => {
          for (let q = 0; q < ancho; q++) {
            const fin = yb - (roto ? Math.floor(hash(px + q, f + 7) * roto) : 0);
            for (let jj = y + 2; jj < fin; jj++) {
              const borde = q === 0 || q === ancho - 1 || jj === fin - 1;
              pp(px + q, jj, borde ? 0 : q % 3 === 0 ? PANIO_S : q % 3 === 1 && jj < y + 6 ? PANIO_L : PANIO);
            }
          }
        };
        if (estado === 'abierta') { panio(x, 6); panio(x2 - 6, 6); }
        else if (estado === 'rota') { panio(x, 5, 6); panio(x + 5, 9, Math.round((yb - y) * 0.7)); panio(x2 - 5, 5, 6); }
        else {
          panio(x, x2 - x);
          // Los agujeros de bala: por ahí se ve lo de atrás.
          const n = estado === 'c1' ? 3 : estado === 'c2' ? 7 : 0;
          for (let h = 0; h < n; h++) {
            const hx = x + 3 + Math.floor(hash(h + c, f + 11) * (x2 - x - 7)), hy = y + 5 + Math.floor(hash(f + 3, h + c) * (yb - y - 10));
            rr(hx - 1, hy - 1, 5, 5, 0); rr(hx, hy, 3, 3, -1);
          }
        }
      }
      cortinasV.push({ x, y, w: x2 - x, h: yb - y, base: (f + 1) * S - 0.02, clave: (w.colStart + c) + ',' + f });
    }
  }

  /**
   * 🆕 PRIMERA CLASE: LA BARRA (el mostrador 'T', de caoba lustrada, con la barra de bronce para el pie
   * y unas copas encima), LAS MESITAS (redondas, lustradas, con una lámpara chica; sólo dibujo, no
   * chocan) delante de cada sillón, y LA ALFOMBRA DEL PASILLO, sana y con guarda: lo contrario de las del
   * dormitorio.
   */
  /** El banquito de los pies (en puntos): cuánto se corre desde el borde de la casilla, el ancho y el alto. */
  const BANQUITO = { dx: -3, ancho: 11, alto: 14 };
  if (w.id === 'primeraClase') {
    const r = rect(MESAS), p = pone(MESAS);
    const MAD_SS = 1, MAD_S = 3, MAD = 4, MAD_L = 5, BRILLO = 6, BRONCE = 7;
    /**
     * La barra: como los tabiques del dormitorio, un núcleo de `ANCHO_BARRA` puntos por casilla 'T' que
     * se estira hacia los vecinos (y hasta la pared), con la tapa arriba y, abajo, la cara con los paneles
     * y la barra de bronce para el pie. 🔁 Más angosta *(Santi: "apenas un poco más angosta")* y corrida
     * `PEGADA` puntos hacia la pared del fondo *("apenas un poco más pegada a la pared del fondo")*.
     * La puertita vaivén, en el hueco del tramo vertical, va aparte (world/porton.js).
     */
    // (🔁 12 de alto, una barra de pie *(Santi: "la barra es muy alta… bajala a 12")*: la leen como barra el
    // bronce para el pie, los paneles, las copas y el estante, no la altura.)
    const ALTO_BARRA = 12, PEGADA = 5, ANCHO_BARRA = 12;
    const esBarra = (c, f) => casilla(c, f) === 'T';
    const esPared = (c, f) => casilla(c, f) === '#' || casilla(c, f) === 'W';
    const nucleoB = (c, f) => {
      const x = ax(w.x + c * S), x2 = ax(w.x + (c + 1) * S), y = ay(f * S) - PEGADA, y2 = ay((f + 1) * S) - PEGADA;
      const mx = Math.round((x + x2) / 2), my = Math.round((y + y2) / 2), g = ANCHO_BARRA / 2;
      return { x, x2, y, y2, cx0: mx - g, cx1: mx + g, cy0: my - g, cy1: my + g };
    };
    // (La puertita vaivén ya no va acá: gira, se dibuja en cada cuadro. Ver world/porton.js.)
    const H = ALTO_BARRA;
    const trozos = [];
    for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 0; c < cols; c++) {
      if (!esBarra(c, f)) continue;
      const N = nucleoB(c, f);
      const izq = esBarra(c - 1, f) || esPared(c - 1, f), der = esBarra(c + 1, f), arr = esBarra(c, f - 1) || esPared(c, f - 1), aba = esBarra(c, f + 1);
      const tramos = [[izq ? N.x : N.cx0, N.cy0, der ? N.x2 : N.cx1, N.cy1]];
      // (El tramo que sube llega hasta la pared lisa, entre el estante y la ventana *(Santi: "la barra tiene
      // que pegar en la pared, no en una ventana ni en una estantería")*.)
      const aPared = esPared(c, f - 1) && !izq && !der;
      if (esBarra(c, f - 1) || aba || aPared) tramos.push([N.cx0, esBarra(c, f - 1) || aPared ? N.y : N.cy0, N.cx1, aba ? N.y2 : N.cy1]);
      trozos.push({ c, f, N, tramos, aba, izq, der });
    }
    // Primero el contorno de todo, después el relleno (sin rayas en las juntas).
    for (const T of trozos) for (const [a, b, cc, d] of T.tramos) r(a - 1, b - H - 1, cc - a + 2, d - b + 2, 0);
    for (const T of trozos) {
      for (const [a, b, cc, d] of T.tramos) { r(a, b - H, cc - a, d - b, MAD); r(a, b - H, cc - a, 1, MAD_L); }
      if (deja(T.N.x + 6, T.N.cy0 - H + 2, 9, 0.5) && T.der) r(T.N.x + 6, T.N.cy0 - H + 2, 6, 1, BRILLO);
      // La cara hacia acá: debajo del tramo, si abajo no sigue la barra.
      if (!T.aba) {
        const a = T.izq ? T.N.x : T.N.cx0, cc = T.der ? T.N.x2 : T.N.cx1, yb = T.N.cy1;
        r(a - 1, yb - H, cc - a + 2, H + 1, 0);
        r(a, yb - H, cc - a, H, MAD_S); r(a, yb - H, cc - a, 1, MAD_SS);
        for (let q = a + 2; q < cc - 8; q += 12) { r(q, yb - H + 3, 9, H - 8, MAD_SS); r(q + 1, yb - H + 4, 7, H - 10, MAD_S); }
        r(a, yb - 4, cc - a, 1, BRONCE); r(a, yb - 3, cc - a, 1, 0);
      }
      const xs = T.tramos.flatMap(([a, , cc]) => [a, cc]), ys = T.tramos.flatMap(([, b, , d]) => [b - H, d]);
      const x0 = Math.min(...xs) - 1, y0 = Math.min(...ys) - 10, x1 = Math.max(...xs) + 1, y1 = Math.max(T.N.cy1, ...ys) + 1;
      muebles.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, base: (T.f + 1) * S - 0.02 });
    }
    // Las copas y la botella, sobre el tramo largo (la fila de la cara hacia el pasillo).
    const largo = trozos.filter((T) => !T.aba && T.der);
    if (largo.length) {
      const T0 = largo[0];
      for (const [k, q] of [[0, 9], [1, 22], [2, 26], [1, 70], [0, 110]]) {
        const gx = T0.N.x + q, T = largo.find((t) => gx >= t.N.x && gx + 4 <= t.N.x2);
        if (!T) continue;
        const ty = T.N.cy0 - H;
        if (k === 2) { r(gx, ty - 6, 4, 9, 0); r(gx + 1, ty - 5, 2, 8, 27); r(gx + 1, ty - 8, 2, 3, 0); p(gx + 1, ty - 4, 30); }
        else { r(gx, ty - 2, 4, 4, 0); r(gx + 1, ty - 1, 2, 2, 22); p(gx + 1, ty - 1, 30); }
      }
    }
    // Las mesitas (ver `mesitas` más arriba), con su vela.
    for (const M of mesitas) {
      const { f, mx, my } = M;
      // (🔁 La tapa más grande: con la tapa angosta parecía un poste de farol.)
      const MW = 18, MH = 10;
      const ty = my - MH;
      r(mx - 1, ty - 1, MW + 2, 7, 0);
      r(mx, ty, MW, 5, MAD); r(mx, ty, MW, 1, MAD_L); r(mx + 3, ty + 1, 4, 1, BRILLO);
      r(mx, ty + 4, MW, 1, MAD_S);
      r(mx + Math.floor(MW / 2) - 1, ty + 5, 3, MH - 5, 0); r(mx + Math.floor(MW / 2), ty + 5, 1, MH - 6, MAD_S);
      r(mx + 4, my - 1, MW - 8, 1, 0);
      // 🔁 La vela, en su candelero de bronce, finita y sin contorno grueso (la lámpara de antes "no se
      // nota… por la forma mal hecha y por el borde tan grueso"). De noche, prendida.
      const vx = M.vx;
      r(vx - 1, ty, 3, 1, BRONCE); r(vx, ty - 1, 1, 1, BRONCE);          // el candelero
      r(vx, ty - 5, 1, 4, 17);                                            // la vela
      if (!dia) { p(vx, ty - 6, 29, true); p(vx, ty - 7, 28, true); }   // la llama
      else p(vx, ty - 6, 1);                                               // el pabilo, apagado
      muebles.push({ x: mx - 1, y: ty - 8, w: MW + 2, h: my - ty + 8, base: (f + 1) * S + 0.1 });
    }
    /**
     * 🆕 EL BANQUITO ACOLCHONADO delante de cada sillón, del mismo terciopelo verde, donde el rico apoya
     * los pies *(Santi: "o le pondría un banquito acolchonado o acercaría la mesa… para que apoyen ahí
     * las piernas en TODAS las poses")*. Más bajo que el almohadón del sillón. Sólo dibujo: no choca.
     */
    for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 0; c < cols; c++) {
      if (casilla(c, f) !== 'S' || casilla(c + 1, f) === 'S') continue;
      const BW = BANQUITO.ancho, x0 = ax(w.x + (c + 1) * S) + BANQUITO.dx, yb = ay((f + 1) * S), H = BANQUITO.alto;
      // (🔁 La cara y las patas a la misma altura que las del sillón: un punto más abajo, parecía más
      // cerca de la pantalla *(Santi: "que quede todo alineado con el sillón")*.)
      r(x0 - 1, yb - H - 1, BW + 2, H - 2, 0);   // (🔁 con el borde de abajo, debajo de la cara *(Santi)*)
      r(x0, yb - H, BW, H - 8, 27); r(x0, yb - H, BW, 1, 43);          // el almohadón
      for (let q = x0 + 3; q < x0 + BW - 2; q += 4) r(q, yb - H + 2, 1, 1, 26);   // los botones del capitoné
      r(x0, yb - 8, BW, 4, 42); r(x0, yb - 8, BW, 1, 26);             // la cara de adelante
      r(x0 + 1, yb - 4, 2, 3, 1); r(x0 + BW - 3, yb - 4, 2, 3, 1);   // las patas
      muebles.push({ x: x0 - 1, y: yb - H - 1, w: BW + 2, h: H + 1, base: (f + 1) * S - 0.03 });
    }
    // La alfombra del pasillo.
    const pp = pone(PISO);
    let fa = -1; for (let f = 0; f < map.rows; f++) if (casilla(0, f) === '+' && fa < 0) fa = f;
    if (fa >= 0) {
      const ax0 = ax(w.x + 2 * S), ax1 = ax(w.x + (cols - 2) * S), ay0 = ay(fa * S) + 4, ay1 = ay((fa + 2) * S) - 4;
      for (let yy = ay0; yy < ay1; yy++) for (let xx = ax0; xx < ax1; xx++) {
        const b = Math.min(xx - ax0, ax1 - 1 - xx, yy - ay0, ay1 - 1 - yy);
        let i = b < 2 ? 39 : b === 2 ? 37 : b === 3 ? 39 : 8;
        // El dibujo del campo: rombos chicos en hilera.
        if (b > 4 && Math.abs(((xx - ax0) % 16) - 8) + Math.abs(yy - (ay0 + ay1) / 2) < 3) i = 37;
        pp(xx, yy, i);
      }
    }
  }

  /**
   * 🆕 P4 · EL VAGÓN DE GUARDIAS, UN CUARTEL RÚSTICO *(Santi eligió la A: "gente que trabaja y duerme donde
   * puede"; lo contrario de primera clase)*: madera cruda y gastada, catres de lona verde oliva con la
   * frazada gris doblada, faroles de querosén. Y los cinco detalles *(Santi eligió los cinco)*: el armero
   * con los Winchester, la estufa salamandra con la cafetera (de noche, el resplandor), los sombreros y las
   * cartucheras colgados de un clavo sobre cada catre de arriba, las cajas de munición apiladas en un
   * rincón y la escupidera de lata al lado de una mesa.
   *
   * LAS MESAS DE CARTAS, de pino, con una vela metida en una botella (de noche ilumina); en las de los
   * guardias de franco, los naipes y las monedas. Los guardias se sientan en CAJONES DE MUNICIÓN, uno en
   * cada puesto (las 'J', ver world/tilemap.js), que chocan como las cajas apiladas (las 'U') y las mesas.
   * La estufa, los catres y lo colgado son sólo dibujo (los catres chocan por sus casillas 'S').
   */
  if (w.id === 'guardias') {
    const r = rect(MESAS), p = pone(MESAS);
    const rf = rect(FONDO), pf = pone(FONDO);
    const yCara = 8, yPie = ay(yPisoArriba);
    const dibujo = (pp, x, y, filas, col) => filas.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') pp(x + q, y + j, col[fila[q]]); });
    // --- la pared, cruda: algunas tablas más oscuras, los nudos y los clavos.
    for (let x = 1; x < W; x += 14) {
      const h = hash(x, w.colStart + 3);
      if (h < 0.3) for (let y = yCara; y < yPie - 2; y++) for (let q = 0; q < 13; q++) if (x + q < W) { const k = y * W + x + q; if (FONDO.i[k] === 3) FONDO.i[k] = 1; }
      if (h > 0.55) { const ny = yCara + 6 + Math.floor(hash(x, 5) * (yPie - yCara - 16)), nx = x + 3 + Math.floor(hash(x, 6) * 6);
        if (deja(nx, ny, 21, 0.4)) { pf(nx, ny, 1); pf(nx + 1, ny, 1); pf(nx, ny + 1, 1); pf(nx + 1, ny + 1, 1); pf(nx - 1, ny, 4); pf(nx + 2, ny + 1, 4); } }
    }
    // --- dónde se puede colgar algo en la pared: ni en una ventana ni en un farol.
    const ocupado = (xa, xb) => ventanasFondo.some(([c0, c1]) => xb > ax(w.x + c0 * S) && xa < ax(w.x + (c1 + 1) * S))
      || faroles.some((fx) => xb > fx - 6 && xa < fx + 6);
    const lugar = (xa, xb, ancho) => {
      const medio = (xa + xb) / 2;
      for (let d = 0; d < xb - xa; d++) for (const s of [1, -1]) {
        const x = Math.round(medio + s * d - ancho / 2);
        if (x >= xa - 4 && x + ancho <= xb + 4 && !ocupado(x - 1, x + ancho + 1)) return x;
      }
      return null;
    };
    // --- el armero, en el tramo de pared más largo sin ventanas (de punta, el del costado del vagón).
    {
      const ultima = ventanasFondo.length ? ventanasFondo[ventanasFondo.length - 1][1] + 1 : 0;
      const xa = ax(w.x + ultima * S) + 4, xb = ax(w.x + (cols - 1) * S) - 2;
      const AW = 28, x = lugar(xa, xb, AW);
      if (x != null) {
        // (Más abajo: los caños llegaban al borde de arriba de la pared y quedaban cortados.)
        const y = yCara + 9, alto = yPie - yCara - 13;
        rf(x - 1, y - 1, AW + 2, 4, 0); rf(x, y, AW, 2, 5); rf(x, y, AW, 1, 6);              // el travesaño de arriba
        rf(x - 1, y + alto - 7, AW + 2, 5, 0); rf(x, y + alto - 6, AW, 3, 4); rf(x, y + alto - 6, AW, 1, 5);   // la repisa de abajo
        /**
         * 🔁 EL WINCHESTER, PARADO, CON SU FORMA *(Santi: "no tienen forma y son solo rectángulos… que se
         * distinga la culata, el cañón, que sacándole el color se entienda la silueta")*: arriba, el caño
         * finito con el tubo del cargador al lado; la tapa de madera; el cajón de bronce, más ancho; la
         * palanca en lazo; la garganta angosta y la culata que se ensancha hasta la cantonera.
         */
        // (El caño, más de la mitad del largo, asoma arriba del travesaño; la palanca, de bronce: negra no se
        // veía contra la pared oscura.)
        const ABAJO = [
          'owWo..', 'owWo..',                                               // la tapa de madera
          'oyYYo.', 'oyYYo.', 'oyYYo.',                                     // el cajón de bronce
          'owWoY.', 'owWo.Y', 'owWoY.',                                     // la garganta y la palanca en lazo
          'owWWo.', 'owWWWo', 'owWWWo',                                     // la culata
          'oDDDDo', 'oooooo',                                               // la cantonera
        ];
        const ARMA = { o: 0, B: 25, T: 24, w: 5, W: 4, y: 28, Y: 7, D: 31 };
        for (let k = 0; k < 3; k++) {
          const gx = x + 3 + k * 8, arriba = yCara + 2, largo = y + alto - 5 - arriba, cano = largo - ABAJO.length - 2;
          const filas = ['.o....', 'oBo...', ...Array(Math.max(0, cano)).fill('oBTo..'), ...ABAJO];
          dibujo(pf, gx, arriba, filas, ARMA);
        }
      }
    }
    // --- sobre cada catre de arriba, de un clavo: un sombrero o una cartuchera, uno y uno.
    {
      let n = 0;
      // El sombrero de fieltro, colgado del ala: la copa con la cinta y el ala ancha.
      const SOMBRERO = ['.....ooooo.....', '....oHHHHHo....', '....ohhhhho....', '....obbbbbo....', '.ooooohhhhhoooo.', 'okkkkkkkkkkkkkko', '.oooooooooooooo.'];
      const SOMB = { o: 0, h: 35, H: 36, b: 32, k: 34 };
      // La cartuchera: el cinto doblado sobre el clavo, las balas de bronce en cada tira, la hebilla y la funda.
      const CINTO = ['....oooo....', '...occcco...', '..occoocco..', '..oco..oco..', '.oyco..ocyo.', '..oco..oco..', '.oyco..ocyo.', '..oco..oco..', '.oyco..ocyo.', '..oco..oco..', '..oco..oooo.', '.oGGo.occcco', '..oo..occcco', '......occcco', '.......occo.', '........oo..'];
      const CU = { o: 0, c: 5, y: 28, G: 7 };
      for (let c = 0; c < cols; c++) {
        if (casilla(c, filasArriba) !== 'S' || casilla(c - 1, filasArriba) === 'S') continue;
        let c2 = c; while (casilla(c2 + 1, filasArriba) === 'S') c2++;
        const sombrero = n++ % 2 === 0, M = sombrero ? SOMBRERO : CINTO, ancho = M[0].length;
        const x = lugar(ax(w.x + c * S) + 2, ax(w.x + (c2 + 1) * S) - 2, ancho);
        if (x == null) continue;
        const y = yCara + 8, cx = x + Math.floor(ancho / 2);
        pf(cx, y - 2, 0); pf(cx, y - 1, 25);                                                  // el clavo
        dibujo(pf, x, y, M, sombrero ? SOMB : CU);
      }
    }
    // --- la estufa salamandra (de hierro, panzona, con patas) con la cafetera arriba y el caño hasta el techo.
    if (estufa) {
      const sx = estufa.x, base = ay(yPisoArriba) + 4;
      const EST = { o: 0, h: 31, H: 23, g: 44, G: 45, y: 29 };
      const CUERPO = ['.....oooo.....', '....oHHHHo....', '..oooooooooo..', '..oHhhhhhhho..', '.oHhhhhhhhhho.', '.oHhoooooohho.', '.oHhogGGgohho.', '.oHhoGyyGohho.', '.oHhogGGgohho.', '.oHhoooooohho.', '.oHhhhhhhhhho.', '..oHhhhhhhho..', '..oooooooooo..', '...oHhhhhho...', '..oo......oo..', '..oo......oo..'];
      const sy = base - CUERPO.length;
      // El caño: de la tapa al techo, por delante de la pared.
      rf(sx - 2, yCara, 5, yPie - yCara, 0); rf(sx - 1, yCara, 3, yPie - yCara, 31); rf(sx - 1, yCara, 1, yPie - yCara, 23);
      r(sx - 2, sy - 9, 5, 10, 0); r(sx - 1, sy - 9, 3, 10, 31); r(sx - 1, sy - 9, 1, 10, 23);
      // (La boca, encendida: de noche brilla.)
      CUERPO.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') p(sx - 7 + q, sy + j, EST[fila[q]], !dia && 'gGy'.includes(fila[q])); });
      // La cafetera de lata sobre la tapa, al costado del caño.
      dibujo(p, sx + 2, sy - 5, ['.oo...', 'oKKo..', 'oKkkoo', 'oKkko.', 'ooooo.'], { o: 0, K: 25, k: 24 });
      muebles.push({ x: sx - 8, y: sy - 10, w: 17, h: base - sy + 11, base: yPisoArriba + 3 });
    }
    // --- los catres de lona (las 'S', acostados a lo largo), del largo de una persona: la lona verde
    // oliva estirada en el bastidor de madera, la almohada a la cabecera y la frazada gris doblada a los
    // pies; debajo, las patas en X. Al pie, el baúl de cada uno (lo que sobra de las casillas).
    const LONA = 26, LONA_L = 27, LONA_S = 42, FRA = 24, FRA_L = 25, FRA_S = 23, ALMO = 16, ALMO_S = 15;
    const ALTO_CATRE = 7, LARGO_CATRE = 38;
    for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 0; c < cols; c++) {
      if (casilla(c, f) !== 'S' || casilla(c - 1, f) === 'S') continue;
      let c2 = c; while (casilla(c2 + 1, f) === 'S') c2++;
      const X0 = ax(w.x + c * S) + 2, X1 = ax(w.x + (c2 + 1) * S) - 2, y = ay(f * S), y2 = ay((f + 1) * S);
      const arriba = f < map.rows / 2;
      // La cabecera, contra la pared del costado si la tiene a la derecha; si no, a la izquierda.
      const cabezaDer = casilla(c2 + 1, f) === '#';
      const x = cabezaDer ? X1 - LARGO_CATRE : X0, x2 = x + LARGO_CATRE;
      const ty = y + (arriba ? 2 : 4) - ALTO_CATRE, tf = y2 - 5 - ALTO_CATRE, ancho = LARGO_CATRE;
      r(x - 1, ty - 1, ancho + 2, tf - ty + ALTO_CATRE + 1, 0);
      // El bastidor: el palo de atrás (a la luz) y los travesaños de las puntas.
      r(x, ty, ancho, tf - ty, 4); r(x, ty, ancho, 1, 5);
      // La lona: clara donde la estiran los palos, colgando en el medio (la sombra).
      r(x + 2, ty + 1, ancho - 4, tf - ty - 2, LONA);
      r(x + 2, ty + 1, ancho - 4, 1, LONA_L);
      r(x + 3, ty + Math.floor((tf - ty) / 2), ancho - 6, 2, LONA_S);
      for (let q = 0; q < 3; q++) { const gx = x + 6 + Math.floor(hash(c + q, f) * (ancho - 12)), gy = ty + 2 + Math.floor(hash(f, c + q) * (tf - ty - 4)); if (deja(gx, gy, 23)) { p(gx, gy, LONA_L); p(gx + 1, gy, LONA_L); } }
      // La almohada, a la cabecera.
      const hx = cabezaDer ? x2 - 11 : x + 3;
      r(hx, ty + 2, 8, tf - ty - 4, 0); r(hx + 1, ty + 2, 6, tf - ty - 5, ALMO); r(hx + 1, ty + 2, 6, 1, 30); r(hx + 1, tf - 3, 6, 1, ALMO_S);
      // La frazada gris doblada a los pies: tres pliegues.
      const fx = cabezaDer ? x + 3 : x2 - 14;
      r(fx, ty + 1, 11, tf - ty - 2, 0);
      r(fx + 1, ty + 1, 9, tf - ty - 3, FRA); r(fx + 1, ty + 1, 9, 1, FRA_L);
      for (let q = ty + 4; q < tf - 2; q += 3) r(fx + 1, q, 9, 1, FRA_S);
      // La cara hacia acá: el palo de adelante y las patas en X.
      r(x, tf, ancho, 2, 3); r(x, tf, ancho, 1, 4);
      for (const lx of [x + 2, x2 - 8]) for (let q = 0; q < ALTO_CATRE - 2; q++) { p(lx + q, tf + 2 + q, 3); p(lx + 5 - q, tf + 2 + q, 3); }
      muebles.push({ x: x - 1, y: ty - 1, w: ancho + 2, h: tf + ALTO_CATRE - ty + 1, base: (f + 1) * S - 0.03 });
      // El baúl, al pie: de madera con los cantos de fierro y el candado.
      const BW = 16, bx = cabezaDer ? x - BW - 3 : x2 + 3;
      if (cabezaDer ? bx < X0 - 2 : bx + BW > X1 + 2) continue;
      // (Bajo: con la tapa de todo el fondo del catre parecía un ropero.)
      const bf = tf + 1, bt = bf - 6, BH = 6;
      r(bx - 1, bt - 1, BW + 2, bf - bt + BH + 2, 0);
      r(bx, bt, BW, bf - bt, 4); r(bx, bt, BW, 1, 5);                                      // la tapa
      r(bx + 4, bt, 1, bf - bt, 31); r(bx + BW - 5, bt, 1, bf - bt, 31);                     // los zunchos
      r(bx, bf, BW, BH, 3); r(bx, bf, BW, 1, 4);                                             // la cara
      r(bx + 4, bf, 1, BH, 31); r(bx + BW - 5, bf, 1, BH, 31);
      r(bx + Math.floor(BW / 2) - 1, bf + 1, 2, 2, 28);                                       // el candado
      muebles.push({ x: bx - 1, y: bt - 1, w: BW + 2, h: bf - bt + BH + 2, base: (f + 1) * S - 0.03 });
    }
    // --- las mesas de cartas, de pino.
    const PINO = 36, PINO_L = 37, PINO_S = 35, PINO_SS = 34;
    const enMesa = WAGONS.guardias.enemies.map((e) => e.mesa && e.mesa.join(','));
    for (const V of velas) {
      const { c, f, x, x2 } = V, y = ay(f * S), y2 = ay((f + 1) * S);
      const ALTO_MESA = 11, ancho = x2 - x - 6, ty = y - ALTO_MESA + 2, hondo = y2 - ALTO_MESA - ty;
      r(x + 2, ty - 1, ancho + 2, hondo + 5, 0);
      r(x + 3, ty, ancho, hondo, PINO); r(x + 3, ty, ancho, 1, PINO_L);
      for (let q = ty + 6; q < ty + hondo - 2; q += 6) r(x + 3, q, ancho, 1, PINO_S);
      for (let k = 0; k < 4; k++) { const vx = x + 5 + Math.floor(hash(c * 7 + k, f) * (ancho - 8)), vy = ty + 2 + Math.floor(hash(k, c * 5 + f) * (hondo - 4)); if (deja(vx, vy, 30 + k)) { p(vx, vy, PINO_S); p(vx + 1, vy, PINO_S); } }
      r(x + 3, ty + hondo, ancho, 3, PINO_SS); r(x + 3, ty + hondo, ancho, 1, PINO_S);
      const pata = y2 - (ty + hondo + 3);
      for (const px of [x + 5, x2 - 7]) { r(px - 1, ty + hondo + 3, 4, pata, 0); r(px, ty + hondo + 3, 2, pata - 1, PINO_SS); }
      // La botella con la vela (verde, con la cera chorreada); de noche, prendida.
      const bx = V.vx;
      r(bx - 2, ty - 4, 5, 6, 0); r(bx - 1, ty - 3, 3, 5, 26); p(bx - 1, ty - 3, 27);
      r(bx - 1, ty - 6, 3, 2, 0); p(bx, ty - 6, 26);
      r(bx, ty - 10, 1, 4, 17); p(bx + 1, ty - 7, 17);
      if (!dia) { p(bx, ty - 11, 29, true); p(bx, ty - 12, 28, true); } else p(bx, ty - 11, 0);
      // En las de los de franco, los naipes de cada uno (abiertos en abanico), el pozo de monedas y el mazo;
      // en las otras, el mazo y un jarro de lata.
      const juegan = enMesa.includes(c + ',' + f);
      const naipe = (nx, ny, pinta) => { p(nx, ny, 30); p(nx + 1, ny, 17); p(nx, ny + 1, 17); p(nx + 1, ny + 1, pinta); p(nx, ny + 2, 17); p(nx + 1, ny + 2, 17); };
      const mazo = (mx, my) => { r(mx, my, 3, 4, 0); r(mx, my, 2, 3, 17); p(mx, my, 30); };
      if (juegan) {
        naipe(x + 6, ty + 3, 9); naipe(x + 9, ty + 2, 31); naipe(x + ancho - 4, ty + 3, 9);
        // El pozo: tres pilitas de monedas en el medio.
        for (const [mx, my, alto] of [[x + 14, ty + 4, 3], [x + 17, ty + 5, 2], [x + 15, ty + 7, 1]]) {
          r(mx, my - alto, 2, alto + 1, 7); r(mx, my - alto, 2, 1, 28); p(mx + 1, my, 3);
        }
        mazo(x + 21, ty + 2);
      } else {
        mazo(x + 8, ty + 3);
        dibujo(p, x + 14, ty + 1, ['ooo.', 'oKko', 'okko', 'okk.'], { o: 0, K: 25, k: 24 });
      }
      muebles.push({ x: x + 2, y: ty - 13, w: ancho + 3, h: y2 - ty + 13, base: (f + 1) * S - 0.01 });
    }
    // --- los cajones de munición donde se sientan los guardias de franco (las 'J', ver world/tilemap.js): del
    // tamaño de su choque (7 de largo por 2,25 de fondo, ver world/tilemap.js), bajo: la tapa, justo debajo de
    // los muslos del que está sentado y con el asiento a la altura de la
    // cadera del que está sentado. Siempre están, con guardia o sin él.
    for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 0; c < cols; c++) {
      if (casilla(c, f) !== 'J') continue;
      const cx0 = ax(w.x + c * S + 4.5), cx1 = ax(w.x + c * S + 11.5), fy0 = ay(f * S + 8.5), fy1 = ay(f * S + 10.75), H = 3;
      const CW = cx1 - cx0, tt = fy0 - H, cara = fy1 - H;
      r(cx0 - 1, tt - 1, CW + 2, fy1 - tt + 2, 0);
      r(cx0, tt, CW, cara - tt, 5); r(cx0, tt, CW, 1, 6);                                    // la tapa
      r(cx0, cara, CW, H, 4); r(cx0, cara, CW, 1, 3);                                         // la cara
      r(cx0 + 2, cara + 1, CW - 4, 1, 31);                                                    // lo pintado
      r(cx0, cara, 1, H, 3); r(cx0 + CW - 1, cara, 1, H, 3);
      // (Delante de quien esté detrás del cajón, detrás del que se sienta: su base es la de su caja, y + 3,5.)
      muebles.push({ x: cx0 - 1, y: tt - 1, w: CW + 2, h: fy1 - tt + 2, base: f * S + 10.7 });
    }
    // --- las cajas de munición apiladas (las 'U'): dos abajo y una arriba, en cada tramo.
    for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 0; c < cols; c++) {
      if (casilla(c, f) !== 'U' || casilla(c - 1, f) === 'U') continue;
      let c2 = c; while (casilla(c2 + 1, f) === 'U') c2++;
      const x = ax(w.x + c * S) + 1, x2 = ax(w.x + (c2 + 1) * S) - 1, yb = ay((f + 1) * S) - 2;
      const caja = (cx, cy, ww, hh) => {
        r(cx - 1, cy - 1, ww + 2, hh + 2, 0);
        r(cx, cy, ww, 4, 5); r(cx, cy, ww, 1, 6);
        r(cx, cy + 4, ww, hh - 4, 4); r(cx, cy + 4, 1, hh - 4, 3); r(cx + ww - 1, cy + 4, 1, hh - 4, 3);
        r(cx + 3, cy + 6, ww - 6, 1, 31); r(cx + 3, cy + 8, 2, 1, 31);
      };
      const cw = Math.floor((x2 - x - 1) / 2);
      caja(x, yb - 12, cw, 12); caja(x + cw + 1, yb - 12, cw, 12); caja(x + Math.floor(cw / 2), yb - 23, cw, 11);
      muebles.push({ x: x - 1, y: yb - 24, w: x2 - x + 2, h: 25, base: (f + 1) * S - 0.04 });
    }
    // --- la escupidera de lata, en el piso al lado de la primera mesa de los que juegan.
    {
      const V = velas.find((v) => enMesa.includes(v.c + ',' + v.f));
      if (V) {
        // (🔁 Adelante de la mesa, a la izquierda: al lado, ahora va el cajón del que juega.)
        const ex = V.x - 5, ey = ay((V.f + 1) * S) + 8;
        dibujo(p, ex, ey - 5, ['.oooo.', 'oKkkKo', 'okookO', '.okko.', '..oo..'].map((s) => s.replace('O', 'o')), { o: 0, K: 25, k: 24 });
        muebles.push({ x: ex, y: ey - 5, w: 6, h: 5, base: (V.f + 1) * S + 3 });
      }
    }
  }

  /**
   * 🆕 P4 · EL VAGÓN DE CORREO, EL COCHE POSTAL DE LA COMPAÑÍA *(Santi eligió las recomendaciones y los cinco
   * detalles)*: un vagón de trabajo, prolijo pero gastado, la madera pintada de verde oscuro.
   *  - LAS PILAS DE ARRIBA (las 'C' contra la pared del fondo), LOS MUEBLES DE CLASIFICAR: la mesada con los
   *    casilleros atrás (cartas asomando) y encima los atados de cartas, el sello y la almohadilla.
   *  - LAS DE ABAJO, LAS SACAS DE LONA (con el cordón y la chapita de bronce) y LAS ENCOMIENDAS de papel madera
   *    atadas con cordel, amontonadas.
   *  - Los detalles: el PERCHERO de las sacas abiertas y la BALANZA de los paquetes (las 'P', en los dos
   *    rincones de arriba: chocan), el RELOJ de pared, las CARTAS SUELTAS en el piso y, en la cara de afuera, EL
   *    BRAZO para agarrar la saca sin parar el tren.
   */
  if (w.id === 'correo') {
    const r = rect(MESAS), p = pone(MESAS);
    const rf = rect(FONDO), pf = pone(FONDO), pp = pone(PISO);
    const yCara = 8, yPie = ay(yPisoArriba);
    const dibujo = (pq, x, y, filas, col) => filas.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') pq(x + q, y + j, col[fila[q]]); });
    // --- la pared, pintada de verde oscuro (las tablas, las juntas y la veta).
    const VERDE = { 3: 26, 1: 42, 4: 27 };
    for (let y = yCara; y < yPie; y++) for (let x = 0; x < W; x++) { const k = y * W + x, i = FONDO.i[k]; if (VERDE[i] != null) FONDO.i[k] = VERDE[i]; }
    // --- los muebles de clasificar (las pilas de arriba): la mesada y los casilleros contra la pared.
    const CAS = 5, CAS_L = 6, CAS_S = 4, CAS_SS = 3;
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
    const arriba = bloques(filasArriba), abajo = bloques(map.rows - filasAbajo - 2);
    for (const B of arriba) {
      const x = ax(w.x + B.c * S) + 1, x2 = ax(w.x + (B.c2 + 1) * S) - 1, ancho = x2 - x;
      const yA = B.f * S;
      /**
       * 🔁 DOS MUEBLES *(Santi: "esa mesa arriba no parece una mesa, se ve alta, como si fuera un armario";
       * eligió la A)*: contra la pared, EL CASILLERO, bajo, de cuadraditos con las cartas y abajo las
       * puertitas; adelante, LA MESA DE CLASIFICAR con patas y el travesaño, que deja ver el piso debajo,
       * como las del comedor. Antes era un solo bloque macizo, con la cara cerrada hasta el piso.
       */
      const ALTO_CAS = 22, FONDO_CAS = 5;
      const lt = ay(yA) - ALTO_CAS, lf = ay(yA + FONDO_CAS) - ALTO_CAS, lb = ay(yA + FONDO_CAS);
      r(x - 1, lt - 1, ancho + 2, lb - lt + 1, 0);
      r(x, lt, ancho, lf - lt, CAS); r(x, lt, ancho, 1, CAS_L);                  // la tapa
      r(x, lf, ancho, lb - lf - 1, CAS_SS);
      const finCasillas = lf + 13;
      for (let gx = x + 1; gx + 4 <= x2 - 1; gx += 5) for (let gy = lf + 1; gy + 3 <= finCasillas; gy += 4) {
        r(gx, gy, 4, 3, 1);                                                  // el hueco
        const h = hash(gx + w.colStart, gy);
        if (h < 0.55) r(gx, gy + 1, 4, 2, h < 0.2 ? 30 : 17);               // las cartas que asoman
        if (h < 0.08) p(gx + 1, gy + 1, 9);                                  // una estampilla
      }
      // Abajo, las puertitas del casillero.
      r(x, finCasillas + 1, ancho, lb - finCasillas - 2, CAS_S); r(x, finCasillas + 1, ancho, 1, CAS);
      for (let q = x + Math.floor(ancho / 4); q < x2 - 2; q += Math.floor(ancho / 4)) r(q, finCasillas + 2, 1, lb - finCasillas - 3, CAS_SS);
      muebles.push({ x: x - 1, y: lt - 1, w: ancho + 2, h: lb - lt + 1, base: yA + FONDO_CAS - 0.02 });
      // La mesa: la tapa de tablas, el canto, las patas y el travesaño; debajo se ve el piso.
      const ALTO_MESA = 11, yT0 = yA + 12, yT1 = (B.f2 + 1) * S - 2;
      const mx = x + 1, mw = ancho - 2, ty = ay(yT0) - ALTO_MESA, tf = ay(yT1) - ALTO_MESA, piso = ay(yT1);
      r(mx - 1, ty - 1, mw + 2, tf - ty + 5, 0);
      r(mx, ty, mw, tf - ty, CAS); r(mx, ty, mw, 1, CAS_L);
      for (let q = ty + 7; q < tf - 2; q += 7) r(mx, q, mw, 1, CAS_S);            // las juntas de las tablas
      r(mx, tf, mw, 3, CAS_SS); r(mx, tf, mw, 1, CAS_S);                          // el canto
      const pata = piso - (tf + 3);
      for (const px of [mx + 2, mx + Math.floor(mw / 2) - 1, mx + mw - 5]) { r(px - 1, tf + 3, 4, pata, 0); r(px, tf + 3, 2, pata - 1, CAS_SS); }
      r(mx + 3, piso - 4, mw - 6, 2, 0); r(mx + 4, piso - 4, mw - 8, 1, CAS_S);   // el travesaño
      // Encima: los atados de cartas, cartas sueltas, el sello con su almohadilla.
      const ATADO = ['ooooooo', 'oWWWWWo', 'osssssо', 'oWWWWWo', 'oWWWWWo', 'ooooooo'].map((f) => f.replace('о', 'o'));
      for (let k = 0; k < 6; k++) {
        const ex = mx + 3 + Math.floor(hash(B.c * 5 + k, 3) * (mw - 12)), ey = ty + 2 + Math.floor(hash(k, B.c * 3 + 1) * (tf - ty - 8));
        if (k < 2) dibujo(p, ex, ey, ATADO, { o: 0, W: 30, s: 9 });
        else if (k < 5) { r(ex - 1, ey - 1, 6, 5, 0); r(ex, ey, 4, 3, 17); r(ex, ey, 4, 1, 30); p(ex + 1, ey + 1, 16); }
        else { r(ex, ey + 2, 6, 4, 0); r(ex + 1, ey + 3, 4, 2, 41); r(ex + 7, ey, 3, 6, 0); r(ex + 8, ey, 1, 4, 4); r(ex + 7, ey + 4, 3, 1, 31); }   // la almohadilla y el sello
      }
      muebles.push({ x: mx - 1, y: ty - 1, w: mw + 2, h: piso - ty + 1, base: (B.f2 + 1) * S - 0.01 });
    }
    // --- el reloj de pared, sobre el mueble del medio que no tiene farol encima.
    {
      const libres = arriba.filter((B) => !faroles.some((fx) => fx >= ax(w.x + B.c * S) && fx <= ax(w.x + (B.c2 + 1) * S)));
      if (libres.length) {
        const B = libres.reduce((a, b) => (Math.abs((a.c + a.c2) / 2 - cols / 2) <= Math.abs((b.c + b.c2) / 2 - cols / 2) ? a : b));
        const cx = Math.round((ax(w.x + B.c * S) + ax(w.x + (B.c2 + 1) * S)) / 2), cy = yCara + 8;
        dibujo(pf, cx - 5, cy - 5, ['...ooooo...', '..o55555o..', '.o5wwwwww5o', 'o5wwwkwww5o', 'o5wwwkwww5o', 'o5wwwkkkw5o', 'o5wwwwwww5o', 'o5wwwwwww5o', '.o5wwwwww5o', '..o55555o..', '...ooooo...'].map((f) => f.padEnd(11, '.')), { o: 0, 5: 7, w: 17, k: 0 });
        pf(cx, cy - 6, 28);
      }
    }
    // --- las sacas y las encomiendas, amontonadas (las pilas de abajo).
    const SACA = ['...oooooooo...', '..oLLLLLLLLoo.', '.oLLCCCCCCCLko', 'oLCCCCCCCCCcko', 'oCCCCCCCYCCcoo', 'oCCCCCCCcccco.', '.occcccccccco.', '..oooooooooo..'];
    const SACA_PARADA = ['...ooo...', '..okkko..', '...oko...', '..oLLCo..', '.oLLCCCo.', 'oLLCCCCco', 'oLCCCCCco', 'oLCCYCCco', 'oCCCCCcco', 'oCCCCccco', '.occccco.', '..ooooo..'];
    const PAQUETE = ['oooooooooo', 'oPPPsPPPPo', 'oPPPsPPPPo', 'ossssssSso', 'oppppspppo', 'oppppspppo', 'oqqqqsqqqo', 'oooooooooo'];
    const LONA = { o: 0, L: 16, C: 15, c: 14, k: 4, Y: 7 }, PAPEL = { o: 0, P: 37, p: 36, q: 35, s: 17, S: 16 };
    /**
     * 🔁 LAS PILAS DE ABAJO, UNA SOLA COSA GRANDE CADA UNA *(Santi: "no me convence la parte de abajo"; eligió la
     * C)*: carros de correo y cajones de encomiendas, alternados. Llenan su lugar (el choque, el mismo); sueltas,
     * las cosas chicas dejaban huecos de piso que chocaban y se leían como un montón sin forma.
     *  - EL CARRO: un canasto de mimbre con las esquinas y el borde de fierro, las manijas, dos ruedas, y lleno
     *    de sacas que asoman por arriba.
     *  - EL CAJÓN: de tablas, con los zunchos de fierro y la etiqueta; encima, sacas tiradas y un paquete.
     */
    abajo.forEach((B, n) => {
      const x = ax(w.x + B.c * S) + 2, x2 = ax(w.x + (B.c2 + 1) * S) - 2, ancho = x2 - x;
      const yb = ay((B.f2 + 1) * S) - 3, yt = ay(B.f * S) + 3;
      const h = (k) => hash(B.c * 7 + k, w.colStart);
      // Una saca grande parada, con la boca atada arriba y la chapita de bronce.
      const SACA_GRANDE = ['....ooo.....', '...okkko....', '....oko.....', '...oLLLo....', '..oLLCCCo...', '.oLLCCCCCo..', 'oLLCCCCCCco.', 'oLCCCCCCCcco', 'oLCCCYYCCcco', 'oLCCCCCCCcco', 'oCCCCCCCccco', 'oCCCCCCcccco', '.oCCCCcccco.', '..oooooooo..'];
      if (n % 2 === 0) {
        // --- el carro: la caja de mimbre, alta, sobre dos ruedas, llena de sacas.
        const H = 20, ruedas = 4, piso = yb - ruedas;
        const tt = yt - H + 4, tf = piso - H;                                   // la boca: de tt a tf; el frente, de tf a piso
        r(x - 1, tt - 1, ancho + 2, piso - tt + 2, 0);
        r(x, tt, ancho, tf - tt, 36); r(x, tt, ancho, 1, 37);                   // el borde de mimbre
        r(x + 2, tt + 2, ancho - 4, tf - tt - 3, 33);                           // adentro
        // (🔁 Pocas sacas grandes y desparejas, con la boca atada para arriba: muchas chicas y parejas parecían
        // una pared de piedras.)
        const LOMO = ['....oooooooo....', '..ooLLLLLLLLoo..', '.oLLLLCCCCCCLLo.', 'oLLCCCCCCCCCCcco', 'oLCCCCCCCCCCCcco', 'oCCCCCCCCCCCCcco', 'oCCCCCCCCCCCccco', '.oCCCCCCCcccccо.', '..occcccccccco..', '...oooooooooo...'].map((f) => f.split('о').join('o'));
        const filas = [];
        for (let sy = tt - 4, j = 0; sy < tf - 6; sy += 8, j++) filas.push([sy, j]);
        for (const [sy, j] of filas) {
          const cuantas = j % 2 ? 2 : 3, paso = (ancho - 14) / Math.max(1, cuantas - 1);
          for (let q = 0; q < cuantas; q++) {
            const sx = Math.round(x - 1 + q * paso + (h(j * 3 + q) - 0.5) * 6), syy = sy + Math.round((h(j * 5 + q + 1) - 0.5) * 4);
            dibujo(p, Math.max(x - 1, Math.min(sx, x2 - 15)), syy, LOMO, LONA);
            if ((j + q) % 2 === 0) dibujo(p, Math.max(x, Math.min(sx, x2 - 15)) + 6, syy - 3, ['.ooo.', 'okkko', '.oko.'], { o: 0, k: 4 });   // la boca atada
          }
        }
        // El frente, de mimbre tejido, con el borde de arriba, el zuncho y las esquinas de fierro.
        for (let yy = tf; yy < piso; yy++) for (let xx = x; xx < x2; xx++) p(xx, yy, yy % 3 === 2 ? 34 : (xx + (yy % 6 < 3 ? 0 : 2)) % 4 < 2 ? 36 : 35);
        r(x, tf, ancho, 1, 37); r(x, tf + 1, ancho, 1, 0);
        r(x, piso - 2, ancho, 2, 31);
        for (const ex of [x, x2 - 2]) { r(ex, tf, 2, piso - tf, 31); p(ex, tf, 23); }
        // Las manijas, a los costados del frente.
        for (const mx of [x - 3, x2]) { r(mx, tf + 3, 3, 1, 0); r(mx, tf + 7, 3, 1, 0); r(mx === x - 3 ? mx : mx + 2, tf + 3, 1, 5, 0); }
        // Las ruedas: dos de fierro, adelante.
        const RUEDA = ['.ooo.', 'oKkKo', 'okoko', 'oKkKo', '.ooo.'];
        for (const wx of [x + 2, x2 - 7]) dibujo(p, wx, yb - 4, RUEDA, { o: 0, K: 23, k: 31 });
        muebles.push({ x: x - 4, y: tt - 8, w: ancho + 8, h: yb - tt + 9, base: (B.f2 + 1) * S - 0.01 });
      } else {
        /**
         * --- los cajones de encomiendas, apilados: dos atrás con uno chico arriba, y uno grande adelante con una
         * saca encima y otra parada al lado. 🔁 Varios, de distintos tamaños *(uno solo, con la tapa tan honda,
         * se leía como un mueble alto)*: los frentes a distintas alturas los hacen cajas.
         */
        const cajon = (cx, piso, an, tapa, alto) => {
          const t0 = piso - alto - tapa;
          r(cx - 1, t0 - 1, an + 2, alto + tapa + 2, 0);
          r(cx, t0, an, tapa, 5); r(cx, t0, an, 1, 6);                            // la tapa
          for (let q = cx + 5; q < cx + an - 2; q += 5) r(q, t0 + 1, 1, tapa - 1, 4);
          r(cx, piso - alto, an, alto, 4); r(cx, piso - alto, an, 1, 6);          // el frente
          for (let q = piso - alto + 4; q < piso - 1; q += 4) r(cx, q, an, 1, 3);
          for (const zx of [cx + 2, cx + an - 4]) { r(zx, t0, 2, tapa + alto, 31); }   // los zunchos
          if (an >= 16) { const ex = cx + Math.floor(an / 2) - 4; r(ex - 1, piso - alto + 2, 10, 6, 0); r(ex, piso - alto + 3, 8, 4, 17); r(ex + 1, piso - alto + 4, 5, 1, 33); }   // la etiqueta
        };
        const atras = yt + 14;
        cajon(x, atras, 21, 12, 13);
        cajon(x2 - 18, atras + 1, 18, 10, 11);
        cajon(x + 4, atras - 13 - 12 + 12, 14, 8, 9);
        cajon(x + 1, yb, 26, 10, 13);
        dibujo(p, x + 4 + Math.floor(h(1) * 6), yb - 13 - 10 - 2, SACA, LONA);
        dibujo(p, x2 - 12, yb - SACA_GRANDE.length + 1, h(2) < 0.5 ? SACA_GRANDE : SACA_GRANDE.map((f) => f.split('').reverse().join('')), LONA);
        muebles.push({ x: x - 1, y: atras - 35, w: ancho + 2, h: yb - atras + 36, base: (B.f2 + 1) * S - 0.01 });
      }
    });
    // --- el perchero de las sacas y la balanza (las 'P'): el de la izquierda, el perchero; el otro, la balanza.
    for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 0; c < cols; c++) {
      if (casilla(c, f) !== 'P') continue;
      const x = ax(w.x + c * S) + 2, x2 = ax(w.x + (c + 1) * S) - 2, yb = ay((f + 1) * S) - 2, ancho = x2 - x;
      if (c < cols / 2) {
        // 🔁 El travesaño de fierro con sus patas, y dos sacas panzonas colgando de los ganchos, con la boca
        // abierta arriba *(con el marco cerrado y las sacas finitas parecía una ventana)*.
        const top = yb - 27;
        r(x - 1, top - 1, ancho + 2, 4, 0); r(x, top, ancho, 2, 23); r(x, top, ancho, 1, 24);   // el travesaño
        for (const px of [x, x2 - 2]) { r(px - 1, top + 2, 4, yb - top - 2, 0); r(px, top + 2, 2, yb - top - 3, 31); }   // las patas
        r(x - 3, yb - 2, 7, 3, 0); r(x2 - 4, yb - 2, 7, 3, 0); r(x - 2, yb - 1, 5, 1, 23); r(x2 - 3, yb - 1, 5, 1, 23);   // los pies
        // (Largas, casi hasta el piso: cortas, abajo del perchero quedaba un hueco y parecía un banquito.)
        const COLGADA = ['.ooooooo.', 'o1111111o', 'oL11111Lo', 'oLLLLLLLo', 'oLCCCCCco', 'oLCCCCCco', 'oLCCCCCco', 'oCCCCCCco', 'oCCCCCCco', 'oCCCCYCco', 'oCCCCCCco', 'oCCCCCCco', 'oCCCCCcco', 'oCCCCCcco', 'oCCCCcccо', '.oCCcccco', '.occcccco', '..oooooo.'].map((f) => f.replace('о', 'o'));
        for (const sx of [x + 1, x + ancho - 10]) {
          p(sx + 1, top + 2, 0); p(sx + 7, top + 2, 0);                      // los ganchos
          dibujo(p, sx, top + 3, COLGADA, { o: 0, 1: 1, L: 16, C: 15, c: 14, Y: 7 });
        }
        muebles.push({ x: x - 1, y: top - 1, w: ancho + 2, h: yb - top + 2, base: (f + 1) * S - 0.02 });
      } else {
        // La balanza de pie: la plataforma, la columna y el brazo con la pesa.
        const top = yb - 24;
        r(x, yb - 6, ancho, 6, 0); r(x + 1, yb - 5, ancho - 2, 2, 5); r(x + 1, yb - 3, ancho - 2, 2, 31);   // la plataforma
        r(x2 - 6, top, 4, yb - 6 - top, 0); r(x2 - 5, top + 1, 2, yb - 7 - top, 23); r(x2 - 5, top + 1, 1, yb - 7 - top, 24);   // la columna
        r(x + 1, top, ancho - 3, 3, 0); r(x + 2, top + 1, ancho - 5, 1, 7);  // el brazo de bronce
        r(x + 4, top - 1, 3, 5, 0); r(x + 5, top, 1, 3, 31);                 // la pesa
        dibujo(p, x + 2, yb - 12, PAQUETE.slice(0, 6), PAPEL);              // un paquete en la plataforma
        muebles.push({ x: x - 1, y: top - 2, w: ancho + 2, h: yb - top + 3, base: (f + 1) * S - 0.02 });
      }
    }
    // --- cartas sueltas en el piso, más donde hay luz.
    for (let k = 0; k < 18; k++) {
      const ex = 8 + Math.floor(hash(k, w.colStart + 5) * (W - 16)), ey = ay(yPisoArriba) + 6 + Math.floor(hash(w.colStart + 9, k) * (ay(yPisoAbajo) - ay(yPisoArriba) - 12));
      const c = Math.floor((ex * PASO + x0 - w.x) / S), f = Math.floor((ey * PASO + yArriba) / S);
      if (casilla(c, f) !== '.' || !deja(ex, ey, 40 + k, 0.5)) continue;
      pp(ex, ey, 17); pp(ex + 1, ey, 17); pp(ex + 2, ey, 30); pp(ex, ey + 1, 17); pp(ex + 1, ey + 1, 16); pp(ex + 2, ey + 1, 17);
      if (k % 3 === 0) pp(ex + 1, ey + 2, 33);                                // pisada
    }
  }

  /**
   * 🆕 P4 · EL CABOOSE, LA CASA DE LA TRIPULACIÓN *(Santi eligió las recomendaciones y los cinco detalles)*:
   * madera barnizada vieja, cálida, gastada por el uso; el lugar donde el guarda y los guardafrenos viven el viaje.
   *  - Los rincones: EL ESCRITORIO DEL GUARDA (mesa con patas, papeles, la lámpara, el talonario de guías y la
   *    silla), LA CAJA DEL CARBÓN con la pala, y LA LEÑA apilada con un rollo de soga.
   *  - Los cuatro del medio, desparejos: LA ESTUFA panzona (la cafetera, el caño al techo, de noche encendida),
   *    EL COFRE DE HERRAMIENTAS con los faroles de señales, EL BARRIL DE AGUA con el cucharón y el balde, y EL
   *    BANCO CON LOS LOCKERS.
   *  - UNA SOLA CAMA, la de la tripulación: el catre con la frazada revuelta (la usan por turnos) y un baulcito.
   *  - Los detalles: LA ESCALERITA AL VIGÍA (sube a la torrecita del techo), LAS BANDERAS de señales, EL HORARIO
   *    de trenes clavado, EL RELOJ DE BOLSILLO colgado sobre el escritorio y, afuera, LOS FAROLES ROJOS DE COLA.
   * Formas grandes, que se lean (ver lo que no sirvió en el correo).
   */
  if (w.id === 'caboose') {
    const r = rect(MESAS), p = pone(MESAS);
    const rf = rect(FONDO), pf = pone(FONDO);
    const yCara = 8, yPie = ay(yPisoArriba);
    const dibujo = (pq, x, y, filas, col) => filas.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') pq(x + q, y + j, col[fila[q]]); });
    const MAD = 5, MAD_L = 6, MAD_S = 4, MAD_SS = 3;
    const usados = [];
    const ocupado = (xa, xb) => ventanasFondo.some(([c0, c1]) => xb > ax(w.x + c0 * S) && xa < ax(w.x + (c1 + 1) * S))
      || faroles.some((fx) => xb > fx - 6 && xa < fx + 6) || usados.some(([a, b]) => xb > a && xa < b);
    const lugarEnPared = (cerca, ancho) => {
      const xMin = 4, xMax = W - 4;
      for (let d = 0; d < W; d++) for (const sg of [1, -1]) { const x = Math.round(cerca + sg * d - ancho / 2); if (x > xMin && x + ancho < xMax && !ocupado(x - 2, x + ancho + 2)) { usados.push([x - 2, x + ancho + 2]); return x; } }
      return null;
    };
    const bloque = (c, f) => {
      let c2 = c; while (casilla(c2 + 1, f) === 'C') c2++;
      let f2 = f; while (casilla(c, f2 + 1) === 'C') f2++;
      return { c, f, c2, f2, x: ax(w.x + c * S) + 1, x2: ax(w.x + (c2 + 1) * S) - 1, yt: ay(f * S), yb: ay((f2 + 1) * S) - 2 };
    };
    // --- en la pared: la escalerita al vigía (en el medio), el horario, las banderas y el reloj de bolsillo.
    {
      const ex = lugarEnPared(W / 2, 12);
      if (ex != null) {
        rf(ex + 1, yCara - 6, 10, 6, 0); rf(ex + 2, yCara - 5, 8, 5, 1);                    // la boca de la torrecita, arriba
        for (const rx of [ex, ex + 10]) { rf(rx, yCara - 2, 2, yPie - yCara + 2, 0); rf(rx, yCara - 2, 1, yPie - yCara + 1, 24); }   // los largueros
        for (let y = yCara + 2; y < yPie - 2; y += 5) { rf(ex + 1, y, 10, 2, 0); rf(ex + 2, y, 8, 1, 23); }   // los peldaños
      }
      const hx = lugarEnPared(W * 0.72, 12);
      if (hx != null) {
        const y = yCara + 5;
        rf(hx - 1, y - 1, 14, 18, 0); rf(hx, y, 12, 16, 17); rf(hx, y, 12, 2, 16);           // el papel
        for (let q = y + 4; q < y + 15; q += 2) { rf(hx + 1, q, 4, 1, 33); rf(hx + 7, q, 4, 1, 33); }   // las columnas
        pf(hx + 6, y - 2, 0); pf(hx + 6, y - 1, 25);                                          // el clavo
      }
      const bx = lugarEnPared(W * 0.32, 10);
      if (bx != null) {
        const y = yCara + 6;
        rf(bx - 1, y + 16, 12, 3, 0); rf(bx, y + 17, 10, 1, MAD);                             // el soporte
        for (const [dx, c1, c2] of [[1, 9, 8], [6, 28, 7]]) { rf(dx + bx - 1, y - 1, 4, 18, 0); rf(dx + bx, y, 2, 17, c1); rf(dx + bx + 1, y, 1, 17, c2); rf(dx + bx, y - 3, 2, 3, MAD_S); }   // la roja y la amarilla, enrolladas en su palo
      }
    }
    /**
     * --- 🔁 LA ESTUFA PANZONA, CONTRA LA PARED DEL FONDO y sin choque (en el piso de la primera fila, donde no se
     * camina): de hierro, sobre su chapa, con la cafetera, el caño pegado a la pared hasta el techo y el balde del
     * carbón al lado. De noche, la boca encendida da luz (`estufa`, ver la luz más arriba).
     */
    {
      const ex = lugarEnPared(W * 0.42, 30);
      if (ex != null) {
        const sx = ex + 9, piso = yPie + 6, cx0 = sx - 8;
        const EST = { o: 0, h: 31, H: 23, g: 44, G: 45, y: 29 };
        const CUERPO = ['.......oooooo.......', '......oHHHHHHo......', '...oooooooooooooo...', '...oHHhhhhhhhhhho...', '..oHhhhhhhhhhhhhho..', '.oHhhhhhhhhhhhhhhho.', '.oHhhoooooooooohhho.', '.oHhhogggGGgggohhho.', '.oHhhogGGyyGGgohhho.', '.oHhhogGyyyyGgohhho.', '.oHhhogGGyyGGgohhho.', '.oHhhogggGGgggohhho.', '.oHhhoooooooooohhho.', '.oHhhhhhhhhhhhhhhho.', '..oHhhhhhhhhhhhhho..', '...oooooooooooooo...', '....oHhhhhhhhhho....', '...oHhhhhhhhhhhho...', '...oooooooooooooo...', '...oo..........oo...', '...oo..........oo...'];
        const sy = piso - CUERPO.length;
        rf(sx, yCara, 5, yPie - yCara, 0); rf(sx + 1, yCara, 3, yPie - yCara, 31); rf(sx + 1, yCara, 1, yPie - yCara, 23);   // el caño, por la pared
        r(sx, sy - 6, 5, 7, 0); r(sx + 1, sy - 6, 3, 7, 31); r(sx + 1, sy - 6, 1, 7, 23);
        r(cx0 - 3, piso - 3, 26, 4, 0); r(cx0 - 2, piso - 2, 24, 2, 24);                      // la chapa de abajo
        CUERPO.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') p(cx0 + q, sy + j, EST[fila[q]], !dia && 'gGy'.includes(fila[q])); });
        dibujo(p, sx + 5, sy - 6, ['.ooo...', 'oKKKo..', 'oKkkkoo', 'oKkkko.', 'oKkkko.', 'oooooo.'], { o: 0, K: 25, k: 24 });   // la cafetera
        dibujo(p, cx0 + 21, piso - 11, ['oooooooooo', 'o11111111o', 'oBbbbbbbbo', 'oBbbbbbbbo', 'oBbbbbbbbo', 'oBbbbbbbbo', 'oBbbbbbbbo', '.oBbbbbbo.', '.oBbbbbbo.', '..oooooo..'], { o: 0, 1: 0, B: 24, b: 23 });   // el balde del carbón
        muebles.push({ x: cx0 - 4, y: sy - 8, w: 36, h: piso - sy + 10, base: yPisoArriba + 4 });
        estufa = { x: sx + 2, y: piso - 10 };
      }
    }
    // --- los muebles, por lo que es cada bulto.
    const hechos = new Set();
    for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 0; c < cols; c++) {
      if (casilla(c, f) !== 'C' || casilla(c - 1, f) === 'C' || casilla(c, f - 1) === 'C' || hechos.has(c + ',' + f)) continue;
      hechos.add(c + ',' + f);
      const B = bloque(c, f), que = MUEBLES_CABOOSE[c + ',' + f] || 'cofre';
      const { x, x2, yt, yb } = B, ancho = x2 - x, base = (B.f2 + 1) * S - 0.01;
      if (que === 'escritorio') {
        // La mesa contra la pared, con patas; encima, los papeles, el talonario, el tintero y la lámpara. Adelante, la silla.
        // (🔁 Hondo hasta la mitad de la segunda fila, y la silla adelante: con la mesa sola en la primera fila, la
        // mitad del rincón era piso que chocaba.)
        // (🔁 Otra vez en una fila: la silla tiene ahora su casilla, adelante, y el escritorio choca sólo con la mesa.)
        const ALTO = 11, ty = ay(f * S + 2) - ALTO, tf = ay(f * S + 14) - ALTO, piso = ay(f * S + 14);
        r(x - 1, ty - 1, ancho + 2, tf - ty + 5, 0);
        r(x, ty, ancho, tf - ty, MAD); r(x, ty, ancho, 1, MAD_L);
        r(x, tf, ancho, 3, MAD_SS); r(x, tf, ancho, 1, MAD_S);
        for (const px of [x + 1, x2 - 3]) { r(px - 1, tf + 3, 4, piso - tf - 3, 0); r(px, tf + 3, 2, piso - tf - 4, MAD_SS); }
        r(x + 4, ty + 3, 9, 7, 0); r(x + 5, ty + 4, 7, 5, 17); r(x + 6, ty + 5, 5, 1, 33); r(x + 6, ty + 7, 4, 1, 33);   // los papeles
        r(x + 15, ty + 5, 8, 5, 0); r(x + 16, ty + 6, 6, 3, 9); r(x + 16, ty + 6, 6, 1, 10);   // el talonario de guías
        r(x + 25, ty + 6, 3, 3, 0); p(x + 26, ty + 7, 18);                                     // el tintero
        /**
         * 🆕 LA TAZA DE CAFÉ, de lata esmaltada blanca, con el asa *(idea de Santi)*: de día, vacía; de noche, llena,
         * y tira un humito que sube y se deshace (`animado` con reloj).
         */
        const tx = x + 19, tyz = ty + 10;
        dibujo(p, tx, tyz, ['oooooo.', 'oWccWoo', 'oWWWWo.o', 'oWWWWoo.', '.oooo..'].map((f) => f.slice(0, 7)), { o: 0, W: 30, c: dia ? 16 : 47 });
        if (!dia) animado(tx - 2, tyz - 12, 10, 12, (B.f2 + 1) * S + 0.01, 8, (fase, ra, pa) => {
          const k = Math.round((fase + 1) / 2 * 7);
          // Tres bocanadas que suben, se corren de costado y se van apagando (claras abajo, grises arriba).
          for (let i = 0; i < 3; i++) {
            const t = (k + i * 3) % 8;
            if (t > 6) continue;
            const hx = tx + 2 + Math.round(Math.sin((t + i) * 1.1) * 1.5), hy = tyz - 1 - Math.round(t * 1.6);
            const c = t < 2 ? 30 : t < 4 ? 25 : 24;
            pa(hx, hy, c); if (t < 5) pa(hx + 1, hy, c); if (t < 3) pa(hx, hy - 1, c);
          }
        }, 0.16);
        // La lámpara de querosén: la base, el tubo de vidrio y la llama (de noche, prendida).
        const lx = x2 - 9;
        dibujo(p, lx, ty - 9, ['.ooo.', 'oVvVo', 'oVyVo', 'oVyVo', '.oVo.', '.ooo.', 'oBBBo', 'oBbBo', '.ooo.'], { o: 0, V: 22, v: 30, y: dia ? 22 : 29, B: 7, b: 28 });
        if (!dia) { p(lx + 2, ty - 7, 29, true); p(lx + 2, ty - 6, 28, true); }
        muebles.push({ x: x - 1, y: ty - 10, w: ancho + 2, h: piso - ty + 11, base });
      } else if (que === 'carbon') {
        // El cajón del carbón, abierto y lleno, con la pala clavada.
        const H = 12, tt = yt - H + 6, tf = yb - H;
        r(x - 1, tt - 1, ancho + 2, yb - tt + 2, 0);
        r(x, tt, ancho, tf - tt, MAD_S); r(x + 2, tt + 2, ancho - 4, tf - tt - 3, 0);         // el borde y adentro
        for (let k = 0; k < 40; k++) { const cx = x + 3 + Math.floor(hash(k, c) * (ancho - 7)), cy = tt + 3 + Math.floor(hash(c, k) * (tf - tt - 6)); r(cx, cy, 3, 2, k % 3 ? 31 : 23); p(cx, cy, k % 4 ? 23 : 24); }   // los terrones
        r(x, tf, ancho, H, MAD); r(x, tf, ancho, 1, MAD_L);
        for (let q = tf + 4; q < yb - 1; q += 4) r(x, q, ancho, 1, MAD_S);
        for (const zx of [x + 2, x2 - 4]) r(zx, tf, 2, H, 31);
        // La pala: el cabo de madera que asoma y la hoja clavada en el carbón.
        const px = x + Math.floor(ancho * 0.6);
        r(px - 1, tt - 12, 3, 16, 0); r(px, tt - 11, 1, 14, MAD_L); r(px - 3, tt + 2, 7, 4, 0); r(px - 2, tt + 3, 5, 2, 24);
        muebles.push({ x: x - 4, y: tt - 13, w: ancho + 8, h: yb - tt + 14, base });
      } else if (que === 'lena') {
        /**
         * 🔁 EL CANASTO DE LA LEÑA, bajo, con los troncos parados, la punta para arriba *(Santi: "no tiene sentido
         * que den hacia la pared pero se vea la silueta del círculo… una especie de canasto un poco más bajo… los
         * troncos con el círculo hacia arriba y que se mueven a la par del movimiento del tren")*. Va entero en los
         * dibujos del meneo (`animado`): los troncos se hamacan, el canasto no.
         */
        const H = 9, tt = yt - H + 4, tf = yb - H;
        const TRONCO = ['.oooooo.', 'oKMMMMKo', 'oMmKKmMo', 'oKMMMMKo', 'oBbBBbBo', 'oBbBBbBo', 'oBbBBbBo', 'oBbBBbBo'];
        const filas = [];
        for (let ty0 = tt - 4, j = 0; ty0 < tf - 6; ty0 += 5, j++) {
          const fila = [];
          for (let tx = x + 1 + (j % 2) * 4 + Math.floor(hash(j, c) * 2); tx + 8 <= x2; tx += 8) fila.push(tx);
          filas.push([ty0, fila]);
        }
        animado(x - 3, tt - 8, ancho + 6, yb - tt + 10, base, 9, (m, ra, pa) => {
          ra(x - 1, tt - 1, ancho + 2, yb - tt + 2, 0);
          ra(x, tt, ancho, tf - tt, 35); ra(x, tt, ancho, 1, 37); ra(x + 2, tt + 2, ancho - 4, tf - tt - 3, 32);   // el borde y el fondo
          filas.forEach(([ty0, fila], j) => fila.forEach((tx, q) => {
            // 🔁 Los de la orilla, apretados contra el canasto, quedan quietos; los de adentro se hamacan con el tren y
            // chocan con los vecinos *(Santi: "se están comiendo el borde del canasto… que los troncos que queden
            // apretados… no se muevan")*. 🔁 Se INCLINAN: la punta se va de costado y la base queda en el canasto
            // (subiendo y bajando parecían "teclas de un teclado que se presionan").
            const orilla = j === 0 || j === filas.length - 1 || q === 0 || q === fila.length - 1;
            const n = j * 7 + q;
            const lean = orilla ? 0 : m * (n % 3 === 0 ? 1.6 : 1.1);
            TRONCO.forEach((fil, r) => {
              const corre = Math.round(lean * (1 - r / (TRONCO.length - 1)));
              for (let qq = 0; qq < fil.length; qq++) if (fil[qq] !== '.') pa(tx + qq + corre, ty0 + r, { o: 0, M: 37, m: 36, K: 35, B: 33, b: 32 }[fil[qq]]);
            });
          }));
          // Los bordes de los costados, encima de los troncos: nunca se los comen. (El de atrás no: los troncos
          // sobresalen y quedan delante de él.)
          for (const ex of [x - 1, x2]) ra(ex, tt - 1, 1, yb - tt + 2, 0);
          for (const ex of [x, x2 - 1]) ra(ex, tt, 1, tf - tt, 35);
          // El frente del canasto, de mimbre tejido, delante de los troncos.
          for (let yy = tf; yy < yb; yy++) for (let xx = x; xx < x2; xx++) pa(xx, yy, yy % 3 === 2 ? 34 : (xx + (yy % 6 < 3 ? 0 : 2)) % 4 < 2 ? 36 : 35);
          ra(x, tf, ancho, 1, 37); ra(x, tf + 1, ancho, 1, 0); ra(x - 1, yb, ancho + 2, 1, 0);
          for (const ex of [x, x2 - 1]) ra(ex, tf, 1, yb - tf, 0);
        });
      } else if (que === 'repuestos') {
        /**
         * LOS REPUESTOS DEL TREN: un cajón bajo, de tablas y fierro, con dos zapatas de freno y una cadena enrollada
         * encima, y la rueda del freno de mano apoyada atrás, parada.
         */
        // (🔁 El cajón, en la parte de atrás de su casilla; adelante, apoyada contra su frente, la rueda.)
        const H = 10, piso = ay((f + 1) * S - 6), tt = yt + 4 - H, tf = piso - H;
        r(x - 1, tt - 1, ancho + 2, piso - tt + 2, 0);
        r(x, tt, ancho, tf - tt, MAD); r(x, tt, ancho, 1, MAD_L);
        r(x, tf, ancho, H, MAD_S); r(x, tf, ancho, 1, MAD_L);
        for (let q = tf + 4; q < piso - 1; q += 4) r(x, q, ancho, 1, MAD_SS);
        for (const zx of [x + 2, x2 - 4]) r(zx, tt, 2, piso - tt, 31);
        /**
         * 🔁 LA RUEDA DEL FRENO, APOYADA CONTRA EL FRENTE DEL CAJÓN, del lado de la pantalla *(Santi: "debería estar
         * apoyada contra la caja… del lado más cercano a la pantalla para que se vea bien el dibujo y que ruede
         * apenas, con el movimiento del tren")*: parada en el piso, un poco echada hacia el cajón (achatada), con
         * el aro, los cuatro rayos y el cubo. Con el meneo rueda un poquito: gira y se corre un punto.
         */
        const R = 8, rx0 = x + 12, ry = yb - R - 1;
        animado(rx0 - R - 4, ry - R - 3, 2 * R + 9, 2 * R + 6, (B.f2 + 1) * S, 9, (m, ra, pa) => {
          const rx = rx0 + Math.round(m * 1.4), giro = m * 0.9 + 0.4, ach = 0.92;
          for (let a = 0; a < 80; a++) { const t = (a / 80) * Math.PI * 2; pa(Math.round(rx + Math.cos(t) * (R + 1)), Math.round(ry + Math.sin(t) * (R + 1) * ach), 0); }
          for (let a = 0; a < 80; a++) { const t = (a / 80) * Math.PI * 2; for (const rr of [R, R - 1]) pa(Math.round(rx + Math.cos(t) * rr), Math.round(ry + Math.sin(t) * rr * ach), rr === R ? 24 : 23); }
          for (let a = 0; a < 80; a++) { const t = (a / 80) * Math.PI * 2; pa(Math.round(rx + Math.cos(t) * (R - 2)), Math.round(ry + Math.sin(t) * (R - 2) * ach), 0); }
          for (let k = 0; k < 4; k++) { const t = (k / 4) * Math.PI * 2 + giro; for (let q = 1; q < R - 1; q++) { pa(Math.round(rx + Math.cos(t) * q), Math.round(ry + Math.sin(t) * q * ach), 31); } }
          ra(rx - 1, ry - 1, 3, 3, 0); pa(rx, ry, 24);
          ra(rx - 3, ry + R, 7, 1, 0);                                                          // donde apoya en el piso
        });
        // Encima: dos zapatas de freno (las medialunas de fierro) y la cadena enrollada.
        for (const zx of [x + 5, x + 13]) dibujo(p, zx, tt + 1, ['.oooooo.', 'oKkkkkKo', 'okooooko', 'oo....oo'], { o: 0, K: 24, k: 23 });
        // (🔁 La cadena, enrollada en el piso, adelante a la derecha, junto a la rueda: llena lo que queda de la
        // casilla delante del cajón, que también choca.)
        const CADENA = ['...oooooooo...', '.ooKoKoKoKoo..', 'oKoo......ooKo', 'oo..oooooo..oo', 'oKoo......ooKo', '.ooKoKoKoKoo..', '...oooooooo...'];
        dibujo(p, x2 - 16, yb - CADENA.length, CADENA, { o: 0, K: 25 });
        muebles.push({ x: x - 1, y: tt - 2, w: ancho + 2, h: yb - tt + 3, base });
      } else if (que === 'barril') {
        // El barril de agua, con los zunchos, la tapa y el cucharón colgando; al lado, el balde.
        // (🔁 Más grande, y el balde pegado: con un hueco entre los dos, chocaba el piso.)
        // (🔁 Abierto, con el agua adentro que se mueve con el tren: el barril va entero en los cinco dibujos del
        // meneo, `animado`. El agua se va para un lado y para el otro, con el brillo encima.)
        const bx = x + 2, bw = 22, H = 22, piso = yb, tope = piso - H, BOCA = 6;
        animado(bx - 2, tope - BOCA - 3, x2 - bx + 4, piso - tope + BOCA + 4, base, 9, (d, ra, pa) => {
          ra(bx - 1, tope - BOCA - 1, bw + 2, H + BOCA + 2, 0);
          ra(bx, tope - BOCA, bw, BOCA, MAD_L); ra(bx, tope - 1, bw, 1, MAD_S);                // el borde de la boca
          // El agua: más alta del lado para donde se va (el lado que sube, más claro; el que baja, en sombra), y el
          // brillo corrido.
          for (let xx = bx + 2; xx < bx + bw - 2; xx++) {
            const t = (xx - bx - bw / 2) / (bw / 2), alto = Math.round(-d * t * 1.6);
            for (let yy = tope - BOCA + 1; yy < tope - 1; yy++) pa(xx, yy, yy - alto <= tope - BOCA + 1 ? 21 : yy - alto <= tope - BOCA + 2 ? 20 : yy >= tope - 2 ? 18 : 19);
          }
          ra(bx + Math.floor(bw / 2) - 3 + Math.round(d * 4), tope - BOCA + 2, 4, 1, 22);       // el brillo
          if (Math.abs(d) > 0.4) pa(bx + (d > 0 ? bw - 4 : 3), tope - BOCA + 1, 30);            // la ola contra la duela
          for (let q = 0; q < bw; q++) { const borde = q < 2 || q > bw - 3; ra(bx + q, tope, 1, H - 1, borde ? MAD_SS : q % 4 === 0 ? MAD_S : MAD); }   // las duelas
          for (const zy of [tope + 3, piso - 5]) ra(bx, zy, bw, 2, 31);                       // los zunchos
          ra(bx + bw - 2, tope - BOCA - 2, 1, 10, 0); ra(bx + bw - 3, tope + 3, 3, 2, 0); pa(bx + bw - 2, tope + 3, 24);   // el cucharón colgado del borde
          dibujo(pa, bx + bw - 1, piso - 12, ['oooooooooooo', 'o1111111111o', 'oBbbbbbbbbbo', 'oBbbbbbbbbbo', 'oBbbbbbbbbbo', 'oBbbbbbbbbbo', 'oBbbbbbbbbbo', 'oBbbbbbbbbbo', '.oBbbbbbbbo.', '.oBbbbbbbbo.', '..oooooooo..'], { o: 0, 1: 21, B: 24, b: 23 });   // el balde, con agua
        }, 0, 'agua');
      } else if (que === 'lockers') {
        // El banco con los lockers: el asiento arriba y dos puertitas con su tirador.
        const H = 10, tt = yt + 3 - H, tf = yb - H;
        r(x - 1, tt - 1, ancho + 2, yb - tt + 2, 0);
        r(x, tt, ancho, tf - tt, MAD); r(x, tt, ancho, 1, MAD_L);
        r(x, tf, ancho, H, MAD_S); r(x, tf, ancho, 1, MAD_L);
        const mitad = x + Math.floor(ancho / 2);
        for (const [dx, dw] of [[x + 2, mitad - x - 3], [mitad + 1, x2 - mitad - 3]]) { r(dx, tf + 2, dw, H - 4, MAD_SS); r(dx + 1, tf + 3, dw - 2, H - 6, MAD_S); p(dx + dw - 2, tf + 4, 28); }
        // Una gorra y un par de guantes, olvidados encima.
        dibujo(p, x + 4, tt + 2, ['.oooo.', 'oNNNNo', 'oNnnNoo', '.ooooKo', '.....o'].map((s) => s.slice(0, 7)), { o: 0, N: 19, n: 18, K: 18 });
        dibujo(p, x2 - 10, tt + 3, ['oooo.', 'oGGgo', 'oGgo.', '.oo..'], { o: 0, G: 36, g: 35 });
        muebles.push({ x: x - 1, y: tt - 1, w: ancho + 2, h: yb - tt + 2, base });
      } else {
        // El cofre de herramientas, de tablas y fierro, con los dos faroles de señales encima (rojo y verde).
        const H = 11, tt = yt + 4 - H, tf = yb - H;
        r(x - 1, tt - 1, ancho + 2, yb - tt + 2, 0);
        r(x, tt, ancho, tf - tt, MAD); r(x, tt, ancho, 1, MAD_L);
        r(x, tf, ancho, H, MAD_S); r(x, tf, ancho, 1, MAD_L);
        for (const zx of [x + 2, x2 - 4]) { r(zx, tt, 2, yb - tt, 31); }
        r(x + Math.floor(ancho / 2) - 2, tf + 2, 4, 3, 0); p(x + Math.floor(ancho / 2) - 1, tf + 3, 28);   // el candado
        // (🔁 Grandes: el asa, el techito, el vidrio de color y la base.)
        const FAROL = ['...oo...', '..o..o..', '.oooooo.', 'oKKKKKKo', 'oVvvvvVo', 'oVvLLvVo', 'oVvLLvVo', 'oVvvvvVo', 'oKKKKKKo', '.oooooo.'];
        dibujo(p, x + 4, tt - 8, FAROL, { o: 0, K: 23, V: 8, v: 9, L: 10 });
        dibujo(p, x + 15, tt - 6, FAROL, { o: 0, K: 23, V: 42, v: 26, L: 43 });
        muebles.push({ x: x - 1, y: tt - 5, w: ancho + 2, h: yb - tt + 6, base });
      }
    }
    // --- el reloj de bolsillo, colgado de un clavo sobre el escritorio.
    for (const [k, que] of Object.entries(MUEBLES_CABOOSE)) {
      if (que !== 'escritorio') continue;
      const [c, f] = k.split(',').map(Number);
      if (casilla(c, f) !== 'C') continue;
      const cx = ax(w.x + (c + 0.6) * S), y = yCara + 10;
      pf(cx, y - 3, 0); pf(cx, y - 2, 25);                                                    // el clavo
      rf(cx, y - 1, 1, 2, 7);                                                                 // la cadenita
      dibujo(pf, cx - 3, y + 1, ['.ooooo.', 'oYwwwYo', 'owwkwwo', 'owwkkwo', 'oYwwwYo', '.ooooo.'], { o: 0, Y: 28, w: 17, k: 0 });
    }
    // --- la silla del escritorio (la 'Y'), de espaldas a nosotros: el respaldo de tablillas, el asiento detrás y
    // las patas. 🔁 Con el borde sólo alrededor de cada parte: debajo se ve el piso *(Santi: "la silla y la cama
    // tienen un espacio negro debajo, debería verse el piso")*. Del tamaño de su choque (ver world/tilemap.js).
    for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 0; c < cols; c++) {
      if (casilla(c, f) !== 'Y') continue;
      const sx = ax(w.x + c * S + 3.5), sx2 = ax(w.x + c * S + 12.5), sw = sx2 - sx;
      const atras = ay(f * S + 6), adelante = ay(f * S + 14), ASIENTO = 9, RESPALDO = 13;
      // Las patas de atrás (asoman entre las de adelante) y las de adelante.
      for (const px of [sx + 2, sx2 - 4]) { r(px - 1, atras - ASIENTO, 3, ASIENTO + 1, 0); p(px, atras - ASIENTO + 1, MAD_SS); r(px, atras - ASIENTO + 1, 1, ASIENTO - 1, MAD_SS); }
      for (const px of [sx, sx2 - 2]) { r(px - 1, adelante - ASIENTO, 4, ASIENTO + 1, 0); r(px, adelante - ASIENTO, 2, ASIENTO, MAD_S); }
      r(sx - 1, adelante - 3, sw + 2, 1, 0); r(sx + 1, adelante - 3, sw - 2, 1, MAD_SS);            // el travesaño
      // El asiento (lo que se ve de él) y el respaldo.
      r(sx - 1, atras - ASIENTO - 1, sw + 2, adelante - atras + 2, 0); r(sx, atras - ASIENTO, sw, adelante - atras, MAD); r(sx, atras - ASIENTO, sw, 1, MAD_L);
      const rt = adelante - ASIENTO - RESPALDO;
      r(sx - 1, rt - 1, sw + 2, RESPALDO + 2, 0); r(sx, rt, sw, 2, MAD_L); r(sx, rt + 2, sw, RESPALDO - 2, MAD_S);
      for (let q = sx + 2; q < sx2 - 2; q += 3) r(q, rt + 3, 1, RESPALDO - 5, MAD_SS);
      r(sx, adelante - ASIENTO - 1, sw, 1, MAD_SS);
      muebles.push({ x: sx - 2, y: rt - 2, w: sw + 4, h: adelante - rt + 3, base: f * S + 14 });
    }
    // --- el baulcito (la 'U'), al lado de la cama: llena su casilla.
    for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 0; c < cols; c++) {
      if (casilla(c, f) !== 'U') continue;
      const bx = ax(w.x + c * S) + 1, bw = ax(w.x + (c + 1) * S) - 1 - bx, H = 9;
      const bt = ay(f * S + 2) - H, bf = ay(f * S + 15) - H, piso = ay(f * S + 15);
      r(bx - 1, bt - 1, bw + 2, piso - bt + 2, 0);
      r(bx, bt, bw, bf - bt, MAD); r(bx, bt, bw, 1, MAD_L);                                       // la tapa
      r(bx, bf, bw, H, MAD_S); r(bx, bf, bw, 1, MAD_L);                                           // el frente
      for (const zx of [bx + 2, bx + bw - 4]) r(zx, bt, 2, piso - bt, 31);
      r(bx + Math.floor(bw / 2) - 1, bf + 2, 3, 3, 0); p(bx + Math.floor(bw / 2), bf + 3, 28);   // el candado
      muebles.push({ x: bx - 1, y: bt - 1, w: bw + 2, h: piso - bt + 2, base: (f + 1) * S - 0.04 });
    }
    // --- la cama: una sola, el catre de la tripulación, con la frazada revuelta. 🔁 Del ancho de su columna y del
    // largo de sus dos casillas: con la cama más angosta y el baulcito en la misma casilla, entre los dos el jugador
    // chocaba con el aire *(Santi)*.
    for (let f = filasArriba; f < map.rows - filasAbajo; f++) for (let c = 0; c < cols; c++) {
      if (casilla(c, f) !== 'S' || casilla(c - 1, f) === 'S' || casilla(c, f - 1) === 'S') continue;
      let c2 = c; while (casilla(c2 + 1, f) === 'S') c2++;
      let f2 = f; while (casilla(c, f2 + 1) === 'S') f2++;
      const X0 = ax(w.x + c * S) + 1, X1 = ax(w.x + (c2 + 1) * S) - 1, y = ay(f * S), y2 = ay((f2 + 1) * S);
      const ANCHO = X1 - X0, x = X0, x2 = X1, ALTO = 8;
      const ty = y - ALTO + 3, tf = y2 - 2 - ALTO;
      r(x, ty - 1, ANCHO, tf - ty + 3, 0);
      r(x + 1, ty, ANCHO - 2, tf - ty, MAD_S); r(x + 1, ty, ANCHO - 2, 1, MAD_L);              // el bastidor
      r(x + 2, ty + 1, ANCHO - 4, 6, 15); r(x + 3, ty + 2, ANCHO - 6, 4, 16);                  // la almohada
      // La frazada, revuelta: a cuadros grises y rojos, con un bulto y una punta que cae.
      for (let yy = ty + 6; yy < tf; yy++) for (let xx = x + 2; xx < x2 - 2; xx++) {
        const cuadro = ((xx - x) >> 2) % 2 === ((yy - ty) >> 2) % 2;
        p(xx, yy, cuadro ? 8 : 23);
      }
      r(x + 2, ty + 12, ANCHO - 4, 1, 0); r(x + 4, ty + 18, ANCHO - 7, 1, 0);                  // los pliegues
      r(x - 1, tf - 6, 3, 9, 0); r(x, tf - 5, 2, 7, 8);                                        // la punta que cuelga
      // El canto de adelante y las patas, con el borde sólo alrededor: debajo, el piso.
      r(x, tf, ANCHO, 3, 0); r(x + 1, tf, ANCHO - 2, 2, MAD_S);
      for (const px of [x + 1, x2 - 4]) { r(px - 1, tf + 2, 4, ALTO - 1, 0); r(px, tf + 2, 2, ALTO - 2, MAD_SS); }
      muebles.push({ x: x - 1, y: ty - 1, w: ANCHO + 2, h: tf - ty + ALTO + 1, base: (f2 + 1) * S - 0.03 });
    }
  }

  /**
   * 🆕 P4 · EL VAGÓN BLINDADO, LA BÓVEDA DE CHAPA *(Santi eligió las recomendaciones y los cinco detalles)*: sin
   * ventanillas, chapa gris remachada, alumbrado sólo por los faroles enjaulados que cuelgan del techo y se hamacan
   * con el tren (casi igual de día que de noche: ver `campoBlindado` más arriba).
   *  - EL FONDO: LA JAULA de barrotes a lo largo de la pared, con las sacas de plata y los cajones sellados detrás,
   *    cerrada con cadena y candado.
   *  - ADELANTE (la última fila): ARCONES con flejes y candado y LINGOTES tapados con una lona, desparejos.
   *  - EL MEDIO: PARAPETOS DE SACOS DE ARENA y CAJONES DE CAUDALES mezclados, de distintas alturas. En el mismo
   *    lugar de siempre (las rondas de los guardias no cambian).
   *  - LOS RINCONES: EL ARMERO de chapa con las escopetas, LA CAJA DE DINAMITA de los guardias y los rollos de mecha;
   *    EL PUESTO CONTRA INCENDIOS (los baldes de arena, el hacha, el cajón de arena) con sacos apilados; EL ATRIL DEL
   *    REGISTRO de valores; y el rincón de la segunda caja fuerte.
   *  - LAS CAJAS FUERTES se dibujan aparte, en el juego (entities/lootable.js), contra la jaula y en el rincón, en
   *    casillas que ya chocan (`nichoDeCaja`, data/wagons.js): acá se les deja el lugar vacío.
   *  - Los detalles: LAS TRONERAS con su tapa corrediza, LOS REMACHES del piso de chapa (ver el piso), UN LINGOTE
   *    CAÍDO en el piso, EL SELLO DE LACRE ROTO de un cajón y LA CADENA de la jaula que se hamaca.
   */
  if (w.id === 'blindado') {
    const r = rect(MESAS), p = pone(MESAS);
    const rf = rect(FONDO), pf = pone(FONDO), pp = pone(PISO);
    const yCara = 8, yPie = ay(yPisoArriba);
    const dibujo = (pq, x, y, filas, col) => filas.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') pq(x + q, y + j, col[fila[q]]); });
    const MAD = 5, MAD_L = 6, MAD_S = 4, MAD_SS = 3;
    const X = (c) => ax(w.x + c * S), Y = (f) => ay(f * S);
    const h = (a, b) => hash(a + w.colStart * 3, b);
    const espejo = (filas) => filas.map((f) => f.split('').reverse().join(''));

    // --- la pared: chapas grises remachadas, con una viga cada dos columnas y el zócalo.
    for (let y = yCara; y < yPie; y++) for (let x = 0; x < W; x++) pf(x, y, 24);
    const yJunta = yCara + 19;
    rf(0, yJunta, W, 1, 31); rf(0, yJunta + 1, W, 1, 25);
    for (let x = 2; x < W; x += 6) for (const y of [yCara + 2, yJunta - 2, yJunta + 3, yPie - 7]) if (deja(x, y, 50, 0.5)) { pf(x, y, 25); pf(x, y + 1, 31); }
    for (let c = 0; c <= cols; c += 2) {
      const vx = X(c) - 2;
      rf(vx, yCara, 5, yPie - yCara, 0); rf(vx + 1, yCara, 3, yPie - yCara, 23); rf(vx + 1, yCara, 1, yPie - yCara, 25);
      for (let y = yCara + 3; y < yPie - 3; y += 5) pf(vx + 2, y, 25);
    }
    rf(0, yPie - 3, W, 3, 31); rf(0, yPie - 3, W, 1, 23);
    // --- las troneras, arriba de la jaula: la rendija para tirar y su tapa corrediza, cada una corrida distinto.
    [4.5, 11.5, 19.5].forEach((cc, k) => {
      const tx = ax(w.x + cc * S) - 6, ty = yCara + 7;
      rf(tx - 2, ty - 3, 16, 1, 31); rf(tx - 2, ty + 6, 16, 1, 31);                          // los rieles de la tapa
      rf(tx - 1, ty - 1, 14, 6, 0); rf(tx, ty, 12, 4, 31); rf(tx + 1, ty + 1, 10, 2, 0);   // el marco y la rendija
      const corre = [5, 0, 3][k];
      rf(tx + corre - 1, ty - 2, 9, 8, 0); rf(tx + corre, ty - 1, 7, 6, 24); rf(tx + corre, ty - 1, 7, 1, 25); rf(tx + corre, ty + 4, 7, 1, 23);
      rf(tx + corre + 3, ty + 1, 1, 2, 0);                                                   // el tirador
    });

    // --- los faroles enjaulados, colgados del techo de una cadena: se hamacan con el tren (prendidos siempre).
    const FAROL = ['..ooo..', '.oKKKo.', 'oKKKKKo', 'oKyYyKo', 'oKyYyKo', 'oKyyyKo', 'oKKKKKo', '.ooooo.'];
    for (const fx of faroles) {
      const largo = 9;
      animado(fx - 7, yCara, 15, largo + FAROL.length + 2, yPisoArriba + S + 0.005, 9, (m, ra, pa) => {
        const dx = Math.round(m * 1.6);
        for (let k = 0; k <= largo; k++) pa(fx + Math.round((dx * k) / largo), yCara + k, k % 2 ? 24 : 0);
        FAROL.forEach((fila, j) => { for (let q = 0; q < fila.length; q++) if (fila[q] !== '.') { const ch = fila[q]; pa(fx + dx - 3 + q, yCara + largo + 1 + j, { o: 0, K: 23, y: 28, Y: 29 }[ch], ch === 'y' || ch === 'Y'); } });
      });
    }

    // --- dónde van las cajas fuertes: ahí no se dibuja nada.
    const nichos = new Set();
    for (const L of (WAGONS[w.id] && WAGONS[w.id].loot) || []) {
      if (L.type !== 'strongbox') continue;
      const n = nichoDeCaja(WAGONS[w.id].layout, L.col, L.row);
      if (n) nichos.add(n[0] + ',' + n[1]);
    }
    const libre = (c, f) => casilla(c, f) === 'C' && !nichos.has(c + ',' + f);

    // --- lo que se repite: el cajón de caudales, la saca de plata, las bolsas de arena, el candado.
    const SELLO = ['..o..', '.oRo.', 'oRrRo', 'oRRRo', '.ooo.'];
    const SELLO_ROTO = ['.o....', 'oRo.o.', 'oRroRo', '.oo.Ro', '....o.'];
    const cajon = (cx, piso, an, tapa, alto, sello) => {
      const t0 = piso - alto - tapa;
      r(cx - 1, t0 - 1, an + 2, alto + tapa + 2, 0);
      r(cx, t0, an, tapa, MAD); r(cx, t0, an, 1, MAD_L);
      for (let q = cx + 5; q < cx + an - 3; q += 5) r(q, t0 + 1, 1, tapa - 1, MAD_S);
      r(cx, piso - alto, an, alto, MAD_S); r(cx, piso - alto, an, 1, MAD_L);
      for (let q = piso - alto + 4; q < piso - 1; q += 4) r(cx, q, an, 1, MAD_SS);
      // Las esquineras de fierro, con sus clavos.
      for (const ex of [cx, cx + an - 3]) { r(ex, t0, 3, tapa + alto, 31); for (let q = t0 + 2; q < piso - 1; q += 4) p(ex + 1, q, 25); }
      // El sello de lacre (rojo) colgando de su cordel sobre la junta de la tapa; o roto, el cordel suelto.
      if (sello) {
        const sx = cx + Math.floor(an / 2) - 2;
        r(sx + 2, piso - alto - 2, 1, 4, 16);
        dibujo(p, sx, piso - alto + 2, sello === 'roto' ? SELLO_ROTO : SELLO, { o: 0, R: 9, r: 10 });
        if (sello === 'roto') { p(sx + 6, piso - alto + 5, 16); p(sx + 7, piso - alto + 6, 16); }
      }
    };
    const SACO = ['....ooo.....', '...okkko....', '....oko.....', '...oLLLo....', '..oLLCCCo...', '.oLLCCCCCo..', 'oLLCCCCCCco.', 'oLCCCCCCCcco', 'oLCCCYYCCcco', 'oLCCCCCCCcco', 'oCCCCCCCccco', 'oCCCCCCcccco', '.oCCCCcccco.', '..oooooooo..'];
    const LONA = { o: 0, k: 4, L: 16, C: 15, c: 14, Y: 7 };
    /**
     * 🔁 LAS BOLSAS DE ARENA, GRANDES Y BIEN TRABADAS *(Santi: "las bolsas deberían ser más grandes y estar mejor
     * puestas")*: el parapeto de las trincheras. Cada bolsa del ancho de una columna, panzona, de arpillera marrón,
     * con el pliegue de la punta atada; las hileras del frente trabadas como ladrillos (cada una corrida media bolsa)
     * y arriba la última capa, acostada, vista desde arriba. Antes eran chiquitas y parejas y no se entendían.
     */
    const ARP = { o: 0, L: 37, C: 36, c: 35, s: 34 };
    const filasBolsa = (an, arriba) => {
      const m = (a, mid, b) => a + mid.repeat(Math.max(0, an - a.length - b.length)) + b;
      return arriba
        ? [m('...', 'o', '...'), m('.oo', 'L', 'oo.'), m('oL', 'L', 'Lo'), m('oL', 'C', 'Co'), m('oC', 'C', 'co'), m('.oc', 'c', 'co.'), m('..o', 'c', 'o..'), m('...', 'o', '...')]
        : [m('...', 'o', '...'), m('.oo', 'L', 'oo.'), m('oL', 'C', 'Co'), m('oC', 'C', 'co'), m('oC', 'c', 'co'), m('oc', 'c', 'so'), m('.os', 's', 'so.'), m('..o', 's', 'o..'), m('...', 'o', '...')];
    };
    const bolsa = (x, y, an, arriba) => {
      dibujo(p, x, y, filasBolsa(an, arriba), ARP);
      const k = h(x, y) < 0.5 ? x + 4 : x + an - 5;                                       // el pliegue de la punta atada
      for (let q = 2; q < (arriba ? 6 : 7); q++) p(k, y + q, arriba ? 35 : 34);
      // La trama de la arpillera: puntitos más oscuros salteados (lisas parecían panes).
      for (let q = 3; q < an - 3; q++) for (let rr = 2; rr < (arriba ? 5 : 6); rr++) if (h(x + q * 3, y + rr * 7) < 0.16) p(x + q, y + rr, rr < 4 ? 35 : 34);
    };
    // Los anchos de una hilera de `W`: bolsas de 22, la primera de media si va corrida; nunca un pedacito suelto.
    const anchos = (W, j) => {
      const out = []; let resto = W;
      if (j % 2) { out.push(11); resto -= 11; }
      while (resto > 0) { const a = Math.min(22, resto); if (a < 12 && out.length) out[out.length - 1] += a; else out.push(a); resto -= a; }
      return out;
    };
    const hilera = (xa, xb, y, j, arriba) => {
      let q = xa;
      anchos(xb - xa, j).forEach((a, k) => { bolsa(q, y + Math.round((h(q, y + k) - 0.5) * 2), a + 1, arriba); q += a; });
    };
    // La pila: arriba, las acostadas (de atrás para adelante); el frente, `capas` hileras.
    const sacos = (x, x2, yt, yb, capas) => {
      const alto = capas * 7 + 2, tf = yb - alto, tt = yt + 3 - alto;
      let j = 0;
      // (Las de arriba, contadas desde el frente: así la última pega con la primera hilera del frente, sin piso entre las dos.)
      const ys = []; for (let y = tf - 6; y >= tt - 2; y -= 6) ys.unshift(y);
      for (const y of ys) hilera(x, x2, y, j++, true);
      for (let y = tf; y <= yb - 9; y += 7) hilera(x, x2, y, j++, false);
      return tt - 1;
    };
    const CANDADO = ['.ooo.', 'oKoKo', 'ooooo', 'oBBBo', 'oBbBo', 'oBBBo', '.ooo.'];
    const candado = (x, y) => dibujo(p, x, y, CANDADO, { o: 0, K: 24, B: 7, b: 0 });

    // --- LA JAULA: los tramos de la primera fila que no son rincón ni caja fuerte.
    const fJ = filasArriba, yPisoJ = Y(fJ + 1) - 1, yTopJ = yJunta;
    const esJaula = (c) => libre(c, fJ) && casilla(c, fJ + 1) !== 'C';
    const tramosJ = [];
    for (let c = 1; c < cols - 1; c++) {
      if (!esJaula(c) || esJaula(c - 1)) continue;
      let c2 = c; while (esJaula(c2 + 1)) c2++;
      tramosJ.push([c, c2]);
    }
    for (const [ca, cb] of tramosJ) {
      const x1 = X(ca) + 1, x2 = X(cb + 1) - 1;
      // Detrás de los barrotes: las sacas de plata y los cajones sellados, sobre el piso de la jaula.
      let cx = x1 + 3, k = 0;
      while (cx < x2 - 13) {
        const hk = h(cx, 7), piso = yPie + 13 + Math.floor(h(k, cx) * 5);
        if (hk < 0.45) { dibujo(p, cx, piso - SACO.length, hk < 0.22 ? SACO : espejo(SACO), LONA); cx += 10 + Math.floor(h(k, 3) * 3); }
        else { const an = Math.min(x2 - 3 - cx, 15 + Math.floor(h(k, 5) * 8)); if (an >= 10) cajon(cx, piso, an, 5, 9 + Math.floor(h(k, 9) * 4), h(k, 11) < 0.5); cx += an + 2; }
        k++;
      }
      // Los barrotes, los rieles (arriba, al medio y abajo) y los postes.
      for (let x = x1 + 3; x < x2 - 2; x += 5) { r(x, yTopJ, 2, yPisoJ - yTopJ, 0); r(x + 1, yTopJ, 1, yPisoJ - yTopJ, 24); }
      for (const [ry, alto] of [[yTopJ, 4], [yTopJ + 18, 3], [yPisoJ - 4, 4]]) { r(x1, ry, x2 - x1, alto, 0); r(x1, ry + 1, x2 - x1, alto - 2, 23); r(x1, ry + 1, x2 - x1, 1, 25); }
      const cd = Math.round((ca + cb) / 2);
      const postes = [x1, x2 - 4];
      for (let c = ca + 3; c < cb - 1; c += 3) if (Math.abs(c - cd) > 1) postes.push(X(c) - 2);
      for (const px of postes) { r(px, yTopJ - 2, 5, yPisoJ - yTopJ + 2, 0); r(px + 1, yTopJ - 2, 3, yPisoJ - yTopJ + 1, 23); r(px + 1, yTopJ - 2, 1, yPisoJ - yTopJ + 1, 25); }
      /**
       * 🔁 LA PUERTA DE LA JAULA, REFORZADA *(Santi: "eso de la puerta que mencionaste, quiero que la refuerces")*:
       * más ancha que una columna, con su propio marco de planchuela gruesa, el travesaño en diagonal, las dos
       * bisagras grandes, la cerradura de caja con la cadena enroscada al marco y el candado colgando.
       */
      const dx1 = X(cd) - 3, dx2 = X(cd + 1) + 3, dy1 = yTopJ + 4, dy2 = yPisoJ - 4;
      const marco = [[dx1, dy1, dx2 - dx1, 3], [dx1, dy2 - 3, dx2 - dx1, 3], [dx1, dy1, 3, dy2 - dy1], [dx2 - 3, dy1, 3, dy2 - dy1]];
      for (const [mx, my, mw, mh] of marco) r(mx - 1, my - 1, mw + 2, mh + 2, 0);
      for (const [mx, my, mw, mh] of marco) { r(mx, my, mw, mh, 24); r(mx, my, mw, 1, 25); r(mx, my, 1, mh, 25); }
      // El travesaño en diagonal, de abajo a la izquierda a arriba a la derecha.
      const largo = dx2 - dx1 - 6, sube = dy2 - dy1 - 8;
      for (let pasada = 0; pasada < 2; pasada++) for (let q = 0; q <= largo; q++) {
        const yy = dy2 - 5 - Math.round((q * sube) / largo);
        if (pasada === 0) r(dx1 + 3 + q, yy - 1, 1, 4, 0); else { p(dx1 + 3 + q, yy, 25); p(dx1 + 3 + q, yy + 1, 24); }
      }
      for (const by of [dy1 + 4, dy2 - 9]) { r(dx1 - 3, by - 1, 5, 6, 0); r(dx1 - 2, by, 3, 4, 23); r(dx1 - 2, by, 3, 1, 25); }   // las bisagras
      // La cerradura de caja, en el marco de la derecha, con la cadena enroscada y el candado.
      const lx = dx2 - 2, ly = Math.round((dy1 + dy2) / 2) - 5;
      r(lx - 6, ly - 1, 10, 10, 0); r(lx - 5, ly, 8, 8, 23); r(lx - 5, ly, 8, 1, 25); r(lx - 2, ly + 3, 1, 3, 0);
      for (let q = lx + 2; q <= lx + 8; q += 3) dibujo(p, q, ly + 2, ['.o.', 'oKo', '.o.'], { o: 0, K: 25 });
      for (let q = ly + 4; q <= ly + 8; q += 3) dibujo(p, lx + 7, q, ['.o.', 'oKo', '.o.'], { o: 0, K: 25 });
      candado(lx + 6, ly + 10);
      const ly2 = ly + 2;
      // El cabo suelto de la cadena, colgando del candado: se hamaca con el tren.
      animado(lx, ly2 + 15, 17, 14, yPisoArriba + S + 0.004, 9, (m, ra, pa) => {
        for (let q = 0; q < 10; q++) {
          const ex = lx + 8 + Math.round((m * 2.4 * q) / 9), ey = ly2 + 16 + q;
          if (q % 2) { pa(ex - 1, ey, 0); pa(ex, ey, 25); pa(ex + 1, ey, 0); } else pa(ex, ey, 0);
        }
      });
      muebles.push({ x: x1 - 1, y: yTopJ - 3, w: x2 - x1 + 2, h: yPisoJ - yTopJ + 4, base: yPisoArriba + S - 0.01 });
    }

    // --- LOS RINCONES (dos columnas cada uno).
    const esquina = (c, f) => ({ x: X(c) + 1, x2: X(c + 2) - 1, yt: Y(f), yb: Y(f + 1) - 2 });
    const cI = 1, cD = cols - 3, fU = map.rows - filasAbajo - 1;
    // Arriba a la izquierda, contra la pared: EL ARMERO de chapa, abierto, con cuatro escopetas paradas y la cadena
    // con candado que las traba. (🔁 Sin reja: los barrotes se mezclaban con los caños.)
    if (libre(cI, fJ) && libre(cI, fJ + 1)) {
      const { x, x2 } = esquina(cI, fJ), an = x2 - x, piso = Y(fJ + 1) - 2, alto = 38, prof = 6;
      const ft = piso - alto, tt = ft - prof;
      r(x - 1, tt - 1, an + 2, piso - tt + 2, 0);
      r(x, tt, an, prof, 24); r(x, tt, an, 1, 25);
      r(x, ft, an, alto, 23); r(x, ft, 1, alto, 24); r(x + an - 1, ft, 1, alto, 31);
      r(x, piso - 3, an, 3, 31); r(x, ft, an, 1, 25);
      const mitad = x + Math.floor(an / 2), dy = ft + 3, dh = alto - 9;
      r(x + 2, dy, an - 4, dh, 0); r(x + 3, dy + 1, an - 6, dh - 2, 31);
      r(x + 3, dy + dh - 5, an - 6, 3, 31); r(x + 3, dy + dh - 5, an - 6, 1, 23);                                     // el estante de abajo
      for (const [dx, dw] of [[x + 2, mitad - x - 1], [mitad, x2 - mitad - 2]]) {
        for (const ex of [dx + 3, dx + dw - 6]) {
          r(ex - 1, dy + 2, 4, dh - 12, 0); r(ex, dy + 2, 1, dh - 12, 25); r(ex + 1, dy + 2, 1, dh - 12, 24);     // los dos caños
          r(ex - 1, dy + dh - 11, 5, 3, 0); r(ex, dy + dh - 11, 3, 3, 24); r(ex, dy + dh - 11, 3, 1, 25);                                          // el cerrojo
          r(ex - 1, dy + dh - 8, 5, 7, 0); r(ex, dy + dh - 8, 3, 6, MAD); r(ex, dy + dh - 8, 1, 6, MAD_L);         // la culata
        }
      }
      const cy = dy + 9;
      for (let q = x + 3; q < x2 - 3; q += 3) dibujo(p, q, cy, ['.o.', 'oKo', '.o.'], { o: 0, K: 25 });              // la cadena
      candado(mitad - 2, cy + 1);
      muebles.push({ x: x - 1, y: tt - 1, w: an + 2, h: piso - tt + 2, base: (fJ + 1) * S - 0.01 });
    }
    // Adelante del armero: LA CAJA DE DINAMITA de los guardias, abierta, llena de cartuchos. (🔁 Sin la tapa parada:
    // tapaba el armero con un bloque liso.)
    if (libre(cI, fJ + 1)) {
      const { x, x2, yt, yb } = esquina(cI, fJ + 1), an = x2 - x, alto = 11, tf = yb - alto, tt = yt + 4 - alto;
      r(x - 1, tt - 1, an + 2, yb - tt + 2, 0);
      r(x, tt, an, tf - tt, 9); r(x, tt, an, 1, 10); r(x + 2, tt + 2, an - 4, tf - tt - 3, MAD_SS);                  // el borde y adentro
      for (let y = tt + 2, j = 0; y + 3 <= tf - 1; y += 3, j++) for (let q = x + 2 - (j % 2) * 6; q < x2 - 2; q += 12) {
        const a = Math.max(q, x + 2), b = Math.min(q + 12, x2 - 2);
        r(a, y, b - a, 3, 0); r(a + 1, y + 1, b - a - 2, 1, 9); r(a + 1, y, b - a - 2, 1, 10); if (q + 12 <= x2 - 2) p(q + 10, y + 1, 16);   // los cartuchos
      }
      r(x, tf, an, alto, 9); r(x, tf, an, 1, 10); r(x, yb - 2, an, 2, 8);                                            // el frente, pintado de rojo
      for (const ex of [x, x2 - 3]) r(ex, tt, 3, yb - tt, 31);
      const ex = x + Math.floor(an / 2) - 7;
      r(ex - 1, tf + 3, 16, 6, 0); r(ex, tf + 4, 14, 4, 17);                                                         // el rótulo blanco
      for (let q = ex + 1; q < ex + 13; q += 3) r(q, tf + 5, 2, 2, 0);
      muebles.push({ x: x - 1, y: tt - 1, w: an + 2, h: yb - tt + 2, base: (fJ + 2) * S - 0.01 });
    }
    // Y delante: un cajón bajo con LOS ROLLOS DE MECHA encima y la latita de los fulminantes.
    if (libre(cI, fJ + 2)) {
      const { x, x2, yt, yb } = esquina(cI, fJ + 2), an = x2 - x, alto = 8;
      cajon(x, yb, an, yb - yt - 4, alto);
      const ROLLO = ['..oooooooo..', '.oMMMMMMMMo.', 'oMmooooooMmo', 'oMo......oMo', 'oMmooooooMmo', '.oMMMMMMMMo.', '..oooooooo..'];
      const top = yt + 4 - alto;
      dibujo(p, x + 3, top + 2, ROLLO, { o: 0, M: 36, m: 35 });
      dibujo(p, x + 17, top + 6, ROLLO, { o: 0, M: 36, m: 35 });
      r(x + 15, top + 2, 6, 1, 0); r(x + 15, top + 3, 1, 3, 0);                                                     // la punta suelta
      r(x2 - 9, top + 2, 7, 5, 0); r(x2 - 8, top + 3, 5, 3, 24); r(x2 - 8, top + 3, 5, 1, 25);                         // los fulminantes
      muebles.push({ x: x - 1, y: top - 1, w: an + 2, h: yb - top + 2, base: (fJ + 3) * S - 0.01 });
    }
    // Arriba a la derecha: EL PUESTO CONTRA INCENDIOS: el tablero en la pared con los tres baldes de arena y el hacha.
    // (🔁 El tablero de madera con una franja roja: rojo entero, los baldes rojos no se veían. Y sin el cajón de arena:
    // las bolsas de adelante lo tapaban y sólo asomaba el cabo de la pala.)
    if (libre(cD, fJ)) {
      const { x, x2 } = esquina(cD, fJ), an = x2 - x;
      const by = yCara + 9, bh = yPie - by - 4;
      rf(x, by - 1, an, bh + 2, 0); rf(x + 1, by, an - 2, bh, MAD_S); rf(x + 1, by, an - 2, 3, 9); rf(x + 1, by, an - 2, 1, 10);
      for (let q = by + 6; q < by + bh - 1; q += 5) rf(x + 1, q, an - 2, 1, MAD_SS);
      const BALDE = ['..oooo..', '.o....o.', 'oooooooo', 'oSSSSSSo', 'oRRRRRRo', 'oRrRRRRo', '.oRRRRo.', '.oRrRRo.', '..oooo..'];
      for (const q of [0, 1, 2]) { const bx = x + 2 + q * 9; rf(bx + 3, by + 1, 2, 1, 0); dibujo(pf, bx, by + 2, BALDE, { o: 0, S: 37, R: 9, r: 10 }); }
      const hx = x2 - 7;
      rf(hx, by + 2, 3, bh - 4, 0); rf(hx + 1, by + 3, 1, bh - 6, MAD_L);                                            // el cabo del hacha
      dibujo(pf, hx - 3, by + 1, ['ooooooooo', 'oKKKKkKKo', 'oKKKKk.o.', '.ooooo...'], { o: 0, K: 25, k: 24 });       // la hoja
    }
    // Delante del puesto, las bolsas de arena: una pila alta atrás y una baja adelante (los frentes, a distintas alturas).
    // (🔁 La de atrás, honda hasta la pared: entre el tablero y las bolsas quedaba piso que chocaba.)
    for (const [f, capas, desde] of [[fJ + 1, 3, fJ], [fJ + 2, 1, fJ + 2]]) {
      if (!libre(cD, f)) continue;
      const { x, x2, yb } = esquina(cD, f), yt = Y(desde);
      const tt = sacos(x, x2, yt, yb, capas);
      muebles.push({ x: x - 1, y: tt - 1, w: x2 - x + 2, h: yb - tt + 2, base: (f + 1) * S - 0.01 });
    }
    // Abajo a la izquierda: EL ATRIL DEL REGISTRO de valores, alto, con patas, el libro abierto, el tintero y la pluma.
    const fR = fU - 2;
    if (libre(cI, fR)) {
      const { x, x2, yt, yb } = esquina(cI, fR), an = x2 - x, ALTO = 18;
      const tt = yt + 3 - ALTO, tf = yb - ALTO;
      r(x - 1, tt - 1, an + 2, tf - tt + 5, 0);
      r(x, tt, an, tf - tt, MAD); r(x, tt, an, 1, MAD_S); r(x, tf - 2, an, 2, MAD_L);                             // la tapa, inclinada
      r(x, tf, an, 3, MAD_SS); r(x, tf, an, 1, MAD_S);
      r(x + 3, tf + 3, an - 6, 5, 0); r(x + 4, tf + 3, an - 8, 4, MAD_S); p(x + Math.floor(an / 2), tf + 5, 7);          // el cajoncito
      for (const px of [x + 1, x2 - 3]) { r(px - 1, tf + 3, 4, yb - tf - 3, 0); r(px, tf + 3, 2, yb - tf - 4, MAD_SS); }
      r(x + 2, yb - 5, an - 4, 2, 0); r(x + 3, yb - 5, an - 6, 1, MAD_S);                                           // el travesaño
      // El libro abierto: las dos hojas con sus renglones y el lomo.
      const lx = x + 5, ly = tt + 3, lw = 24, lh = tf - tt - 6;
      r(lx - 1, ly - 1, lw + 2, lh + 2, 0); r(lx, ly, lw, lh, 17); r(lx + Math.floor(lw / 2), ly, 1, lh, 16);
      for (let q = ly + 2; q < ly + lh - 1; q += 2) { r(lx + 2, q, 8, 1, 33); r(lx + 14, q, 7 - (q % 3), 1, 33); }
      r(x2 - 8, tt + 4, 4, 4, 0); r(x2 - 7, tt + 5, 2, 2, 18);                                                       // el tintero
      for (let q = 0; q < 6; q++) p(x2 - 6 + q, tt + 3 - q, q < 2 ? 0 : 17);                                          // la pluma
      muebles.push({ x: x - 1, y: tt - 6, w: an + 2, h: yb - tt + 7, base: (fR + 1) * S - 0.01 });
    }
    // Delante del atril: dos cajones de caudales, el chico arriba del grande.
    if (libre(cI, fR + 1)) {
      const { x, x2, yt, yb } = esquina(cI, fR + 1), an = x2 - x;
      cajon(x, yb, an, yb - yt - 4, 12);
      cajon(x + 3, yb - 16, 20, 5, 8);
      muebles.push({ x: x - 1, y: yb - 32, w: an + 2, h: 34, base: (fR + 2) * S - 0.01 });
    }
    // Abajo a la derecha, el rincón de la otra caja fuerte: un cajón alto detrás (asoma por arriba de la caja) y, al
    // lado, dos cajones de caudales, uno sobre el otro. (🔁 Una saca detrás asomaba como un sombrerito.)
    if (casilla(cD, fR) === 'C') {
      const x = X(cD) + 2, x2 = X(cD + 1) - 1, piso = Y(fR + 1) - 3;
      cajon(x, piso, x2 - x, 5, 24);
      muebles.push({ x: x - 1, y: piso - 31, w: x2 - x + 2, h: 32, base: (fR + 1) * S - 0.02 });
    }
    if (libre(cD + 1, fR) && libre(cD + 1, fR + 1)) {
      const x = X(cD + 1) + 1, x2 = X(cD + 2) - 1, an = x2 - x;
      cajon(x + 1, Y(fR + 1) - 3, an - 2, 6, 15);
      muebles.push({ x: x - 1, y: Y(fR + 1) - 26, w: an + 2, h: 25, base: (fR + 1) * S - 0.01 });
      cajon(x, Y(fR + 2) - 2, an, 10, 11);
      muebles.push({ x: x - 1, y: Y(fR + 2) - 25, w: an + 2, h: 25, base: (fR + 2) * S - 0.01 });
    }

    // --- EL MEDIO: parapetos de bolsas de arena y cajones de caudales, mezclados y de distintas alturas.
    const medios = [];
    for (let f = fJ + 1; f < fU; f++) for (let c = cI + 2; c < cD; c++) {
      if (!libre(c, f) || casilla(c - 1, f) === 'C') continue;
      let c2 = c; while (casilla(c2 + 1, f) === 'C') c2++;
      medios.push({ c, c2, f });
    }
    // (🔁 Las bolsas de arena ya no van acá: son los parapetos 'A', más abajo.)
    const TIPOS = ['sello', 'pila', 'cajon', 'pila', 'cajon', 'pila'];
    medios.forEach((B, n) => {
      const x = X(B.c) + 1, x2 = X(B.c2 + 1) - 1, an = x2 - x, yt = Y(B.f), yb = Y(B.f + 1) - 2, base = (B.f + 1) * S - 0.01;
      const tipo = TIPOS[n % TIPOS.length];
      let top;
      if (tipo === 'sacos' || tipo === 'bajos') top = sacos(x, x2, yt, yb, tipo === 'sacos' ? 3 : 2);
      // 🔁 Más altos y con la tapa honda, hasta el fondo de su casilla *(Santi: "deberían ser un poco más altos para
      // que quede bien con la colisión y el jugador no choque contra el aire… si no pensarán: es muy bajito, cómo
      // esto tapa a un guardia")*: antes la tapa medía dos puntos y detrás quedaba piso que chocaba.
      else if (tipo === 'pila') {
        cajon(x, yb, an, yb - yt - 4, 13);
        cajon(x + 3 + Math.floor(h(B.c, 1) * 8), yb - 17, 22, 7, 10);
        top = yb - 17 - 10 - 7 - 1;
      } else {
        cajon(x, yb, an, yb - yt - 4, 18, tipo === 'sello' ? 'roto' : true);
        top = yt + 4 - 18 - 1;
      }
      muebles.push({ x: x - 1, y: top - 1, w: an + 2, h: yb - top + 2, base });
    });

    /**
     * --- 🔁 LOS PARAPETOS DE BOLSAS DE ARENA ('A'), angostos y largos hacia el fondo y bajos *(Santi: "debería ser al
     * revés… cortalas para hacerlas más bajas, ponelas en vertical"; eligió girar la pila entera)*.
     * 🔁 Y LAS BOLSAS TAMBIÉN A LO LARGO *(Santi: "las bolsas deberían estar puestas también en vertical")*: acostadas
     * hacia el fondo, dos filas una al lado de la otra (la de la derecha corrida media bolsa), cortas y panzonas, con
     * las cuatro puntas pellizcadas; de frente se ven sólo LAS PUNTAS, dos por hilera y dos hileras. Del tamaño de su
     * choque (ver 'A' en world/tilemap.js).
     */
    const PUNTA = ['..oooooo..', '.oLLLLLLo.', 'oLCCCCCCco', 'oCCCsCCcco', 'oCcccccsco', '.osssssso.', '..oooooo..'];
    const larga = (x, y, L) => {
      // Vista de arriba: 10 de ancho y `L` hacia el fondo; más clara a la izquierda (de donde viene la luz).
      const filas = [];
      for (let j = 0; j < L; j++) {
        if (j === 0 || j === L - 1) filas.push('o.oooooo.o');
        else if (j === 1) filas.push('.oLLLLLLo.');
        else if (j === L - 2) filas.push('.osssssso.');
        else filas.push('oLLCCCCcso');
      }
      dibujo(p, x, y, filas, ARP);
      const k = h(x, y) < 0.5 ? y + 3 : y + L - 4;
      r(x + 2, k, 6, 1, 35);                                                                  // el pliegue de la atadura
      for (let q = y + 2; q < y + L - 2; q++) for (let kk = x + 2; kk < x + 8; kk++) if (h(kk * 3, q * 7) < 0.12) p(kk, q, 35);   // la trama
    };
    for (let c = 0; c < cols; c++) for (let f = filasArriba; f < map.rows - filasAbajo; f++) {
      if (casilla(c, f) !== 'A' || casilla(c, f - 1) === 'A') continue;
      let f2 = f; while (casilla(c, f2 + 1) === 'A') f2++;
      const x = X(c) + 1, an = X(c + 1) - 1 - x, yb = Y(f2 + 1) - 2, alto = 13, tf = yb - alto, tt = Y(f) + 3 - alto;
      // Arriba: dos filas de bolsas a lo largo, de atrás para adelante; la de la derecha empieza con media bolsa.
      for (const [bx, corre] of [[x, false], [x + an - 10, true]]) {
        const fin = tf + 3;
        let y = tt, k = 0;
        while (y < fin) {
          let L = corre && k === 0 ? 9 : 16;
          const ultima = fin - y - L < 7;
          if (ultima) L = fin - y;                                                             // la última, hasta el frente
          larga(bx, y, Math.max(6, L));
          if (ultima) break;
          y += L - 2; k++;
        }
      }
      // El frente: las puntas, dos por hilera y dos hileras.
      for (const fy of [tf, tf + 6]) for (const bx of [x, x + an - 10]) dibujo(p, bx, fy, PUNTA, ARP);
      // (Las rayas de adentro, entre bolsa y bolsa, en marrón oscuro: negras parecían los peldaños de una escalera. El
      // borde negro queda sólo en la silueta.)
      for (let yy = tt + 1; yy < yb; yy++) for (let xx = x; xx < x + an + 1; xx++) {
        const k = yy * W + xx, arriba = MESAS.i[k - W], abajo = MESAS.i[k + W];
        const izq = MESAS.i[k - 1], der = MESAS.i[k + 1];
        if (MESAS.i[k] === 0 && arriba > 0 && abajo > 0 && izq !== -1 && der !== -1) MESAS.i[k] = 33;
        // (Y la de entre las dos filas de bolsas, a lo largo.)
        else if (MESAS.i[k] === 0 && izq > 0 && der > 0 && arriba !== -1 && abajo !== -1 && yy > tt + 1 && yy < tf) MESAS.i[k] = 33;
      }
      muebles.push({ x: x - 2, y: tt - 1, w: an + 4, h: yb - tt + 2, base: (f2 + 1) * S - 0.01 });
    }

    // --- ADELANTE: los arcones con sus flejes y los lingotes tapados con lona, desparejos.
    const arcon = (x, x2, yt, yb, alto, saca) => {
      const an = x2 - x, tf = yb - alto, tt = yt + 4 - alto;
      r(x - 1, tt - 1, an + 2, yb - tt + 2, 0);
      // La tapa abovedada: más clara en el lomo.
      const lomo = tt + Math.floor((tf - tt) * 0.55);
      r(x, tt, an, tf - tt, MAD_S); r(x, tt + 2, an, lomo - tt - 2, MAD); r(x, lomo, an, 3, MAD_L); r(x, tf - 1, an, 1, 0);
      r(x, tf, an, alto, MAD_S); r(x, tf, an, 1, MAD);
      for (let q = tf + 4; q < yb - 1; q += 4) r(x, q, an, 1, MAD_SS);
      for (const zx of [x + 3, x + Math.floor(an / 2) - 1, x2 - 6]) { r(zx, tt, 3, yb - tt, 31); for (let q = tt + 2; q < yb - 1; q += 3) p(zx + 1, q, 25); }
      const cx = x + Math.floor(an / 2) + 4;
      r(cx - 3, tf + 1, 7, 7, 0); r(cx - 2, tf + 2, 5, 5, 7); r(cx - 2, tf + 2, 5, 1, 28); p(cx, tf + 4, 0); p(cx, tf + 5, 0);   // la cerradura
      for (const ex of [x - 2, x2 + 1]) r(ex, tf + 3, 1, 4, 0);                                                       // las manijas
      if (saca) dibujo(p, x + 5, tt - 3, ['...oooooooo...', '..oLLLLLLLLoo.', '.oLLCCCCCCCLko', 'oLCCCCCCCCCcko', 'oCCCCCCCYCCcoo', 'oCCCCCCCcccco.', '.occcccccccco.', '..oooooooooo..'], LONA);
      return saca ? tt - 4 : tt - 1;
    };
    const LINGOTE = ['.oooooooo.', 'oYYYYYYYYo', 'oyyyyyyyyo', 'oooooooooo'];
    const ORO = { o: 0, Y: 45, y: 28 };
    const lingotes = (x, x2, yt, yb) => {
      const an = x2 - x, alto = 6, tf = yb - alto, tt = yt + 6 - alto;
      r(x - 1, tt - 1, an + 2, yb - tt + 2, 0);                                                                     // la tarima
      r(x, tt, an, tf - tt, MAD_S); for (let q = tt + 3; q < tf; q += 4) r(x, q, an, 1, MAD_SS);
      r(x, tf, an, alto, MAD_SS); r(x, tf, an, 1, MAD);
      // Los lingotes, en dos pirámides (la de atrás asoma por arriba de la de adelante).
      const piramide = (base, y0, n) => { for (let k = 0; k < 3; k++) for (let q = 0; q < n - k; q++) dibujo(p, base + q * 9 + k * 4, y0 - k * 3, LINGOTE, ORO); };
      const n = Math.floor((an - 4) / 9);
      piramide(x + 2, tt + 2, n); piramide(x + 2, tf - 4, n);
      for (let k = 0; k < 4; k++) p(x + 4 + Math.floor(h(x, k) * (an - 8)), tf - 3 - Math.floor(h(k, x) * 8), 29);   // un brillo
      // La lona: tapa la mitad de la derecha, con los pliegues, la soga y la punta que cae.
      const lx = x + Math.floor(an * 0.42), top = tt - 8;
      for (let y = top; y < yb - 2; y++) {
        const desde = lx + Math.max(0, Math.round((yb - 2 - y) * 0.25) - 3);
        for (let xx = desde; xx < x2; xx++) p(xx, y, xx === desde ? 0 : y === top ? 16 : (xx - desde + Math.floor(h(xx, 2) * 2)) % 6 === 0 ? 14 : 15);
      }
      r(lx, top - 1, x2 - lx, 1, 0); r(x2 - 1, top, 1, yb - top - 2, 14);
      const sy = top + Math.floor((yb - top) * 0.45);
      r(lx + 2, sy, x2 - lx - 2, 1, 4); r(lx + Math.floor((x2 - lx) / 2), sy - 1, 2, 3, 4);                       // la soga
      for (let q = lx + 1; q < x2; q += 3) p(q, yb - 2 + (q % 2), 0);                                                // el borde que cae
      return top - 1;
    };
    const FRENTE_TIPOS = [['arcon', 2], ['lingotes', 3], ['arcon', 2], ['saca', 2], ['lingotes', 3], ['arcon', 2], ['lingotes', 3], ['arcon', 2], ['lingotes', 3], ['saca', 2], ['arcon', 2], ['arcon', 2]];
    {
      let c = 1, n = 0;
      while (c < cols - 1) {
        if (!libre(c, fU)) { c++; continue; }
        let fin = c; while (libre(fin + 1, fU)) fin++;
        const [tipo, cuantas] = FRENTE_TIPOS[n % FRENTE_TIPOS.length];
        const c2 = Math.min(fin, c + cuantas - 1 + (fin - (c + cuantas - 1) === 1 ? 1 : 0));
        const x = X(c) + 2, x2 = X(c2 + 1) - 2, yt = Y(fU), yb = Y(fU + 1) - 2;
        const altos = [11, 13, 9, 12];
        const top = tipo === 'lingotes' ? lingotes(x, x2, yt, yb) : arcon(x, x2, yt, yb, altos[n % altos.length], tipo === 'saca');
        muebles.push({ x: x - 3, y: top - 1, w: x2 - x + 6, h: yb - top + 2, base: (fU + 1) * S - 0.01 });
        c = c2 + 1; n++;
      }
    }

    // --- un lingote caído en el piso, en el pasillo, bajo la luz de un farol.
    {
      const cx = X(14.6), cy = Y(fJ + 3) + 6;
      if (casilla(14, fJ + 3) === '.') { dibujo(pp, cx, cy, LINGOTE, ORO); pp(cx + 3, cy + 1, 29); }
    }
  }

  /**
   * 🆕 LAS PUNTAS DEL VAGÓN, FINITAS Y DE ARRIBA A ABAJO *(Santi: "arreglar la pared esa vertical que está con la
   * puerta: debería ser más fina… debería ocultarse detrás de la pared del tren más cercana a la pantalla… dar la
   * sensación de que continúa hasta topar con la pared… el borde negro no debería estar… y debería continuar hacia
   * arriba y el borde de esta pared debería quedar unido del borde de la pared más lejana")*: una tira del grueso de
   * la pared (`paredPunta`), pegada al borde de afuera, que sube hasta el filete de la pared del fondo (la esquina) y
   * baja hasta perderse detrás de la pared de adelante, sin borde negro abajo. El hueco de la puerta queda a la vista,
   * del alto de la puerta (`altoPuerta`): la pared sigue arriba del marco y abajo. Dos piezas por punta: la de arriba
   * de la puerta, detrás de quien la cruza; la de abajo, delante (y de la hoja de adelante: le tapa el pie).
   */
  const PUNTAS = capa(), puntasV = [];
  {
    const r = rect(PUNTAS);
    const G = Math.max(3, Math.round(tc.paredPunta * PX)), AP = tc.altoPuerta;
    for (const c of [0, cols - 1]) {
      let fd0 = -1, fd1 = -1;
      for (let f = filasArriba; f < map.rows - filasAbajo; f++) if (casilla(c, f) !== '#') { if (fd0 < 0) fd0 = f; fd1 = f; }
      // (🔁 En el dormitorio, en la línea de adentro de la columna de la punta, donde iba la pared vieja, pegada a los
      // camarotes (`paredAdentro`, data/wagons.js; ver `AFUERA` más abajo).)
      const adentro = WAGONS[w.id] && WAGONS[w.id].paredAdentro;
      const x = adentro ? (c === 0 ? ax(w.x + S) - G : ax(w.x + (cols - 1) * S)) : c === 0 ? ax(w.x) : ax(w.x + w.width) - G;
      const tira = (y0, y1) => {
        if (y1 <= y0) return;
        r(x, y0, G, y1 - y0, BORDE); r(x, y0, 1, y1 - y0, 0); r(x + G - 1, y0, 1, y1 - y0, 0);
        r(c === 0 ? x + 1 : x + G - 2, y0, 1, y1 - y0, BORDE_L);
      };
      // (🔁 La de abajo arranca a la altura de la puerta y va delante de la hoja de adelante: está más cerca de la pantalla y
      // le tapa la parte de abajo *(Santi: "la puerta más cercana sí debería estar tapada un poco por la pared")*.)
      const yArr = fd0 < 0 ? H : ay(fd0 * S) - AP, yAb = fd0 < 0 ? H : ay((fd1 + 1) * S) - AP;
      tira(0, yArr);
      tira(yAb, H);
      // (Arriba, la tira se junta con el filete de la pared del fondo: la esquina.)
      const px0 = Math.max(0, x - 1), pw = Math.min(W, x + G + 1) - px0;
      puntasV.push({ x: px0, y: 0, w: pw, h: Math.max(1, yArr), base: (fd0 < 0 ? map.rows : fd0) * S - 0.03 });
      if (yAb < H) puntasV.push({ x: px0, y: yAb, w: pw, h: H - yAb, base: (fd1 + 1) * S + 0.01 });
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
    /**
     * 🆕 EL BRAZO PARA AGARRAR LA SACA (el correo), en la cara de afuera, cerca de la punta de adelante: el
     * poste de fierro con los dos brazos plegados y el gancho en el medio. Con él, el tren levanta la saca
     * colgada en la estación sin parar.
     */
    if (w.id === 'correo') {
      const bx = W - 22, y0 = yTope + 9, y1 = yCaraFin - 5;
      r(bx - 1, y0 - 1, 4, y1 - y0 + 2, 0); r(bx, y0, 2, y1 - y0, 31); r(bx, y0, 1, y1 - y0, 23);   // el poste
      for (const ay0 of [y0 + 1, y1 - 3]) { r(bx - 7, ay0 - 1, 8, 3, 0); r(bx - 6, ay0, 7, 1, 23); }   // los brazos
      const gy = Math.round((y0 + y1) / 2);
      r(bx - 5, gy - 2, 6, 5, 0); r(bx - 4, gy - 1, 4, 1, 24); r(bx - 4, gy + 1, 4, 1, 24); p(bx - 4, gy, 24);   // el gancho
    }
    /**
     * 🆕 LOS FAROLES ROJOS DE COLA (el caboose), en la cara de afuera, en la punta de atrás del tren: los que
     * marcan el final. De noche, prendidos.
     */
    // 🆕 El blindado, por fuera: dos hileras de remaches a lo largo de la chapa.
    if (w.id === 'blindado') for (let x = 3; x < W; x += 6) { p(x, yTope + 10, BORDE_L); p(x, yCaraFin - 6, BORDE_L); }
    if (w.id === 'caboose') {
      const fx = 6, fy = yTope + 9;
      r(fx - 1, fy - 3, 3, 3, 0); r(fx, fy - 2, 1, 2, 23);                                   // el soporte
      r(fx - 3, fy, 8, 10, 0); r(fx - 2, fy + 1, 6, 8, 31);
      r(fx - 1, fy + 2, 4, 5, dia ? 9 : 10, !dia); if (!dia) r(fx, fy + 3, 2, 3, 45, true);    // el vidrio rojo
      r(fx - 2, fy + 8, 6, 1, 23);
    }
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

  /**
   * 🆕 AFUERA DE LA PARED DE LA PUNTA, EN EL DORMITORIO (`paredAdentro`) *(Santi: "poner la pared finita donde iba la
   * otra… sólo en el dormitorio… no agregues las barandas")*: la columna de la punta queda del otro lado de la pared.
   * Se borra (paredes, muebles) y se ve la vía que pasa por debajo, como en el hueco del enganche; sólo queda el piso en
   * las filas del pasillo, el mismo del vagón, que sigue hasta el enganche. Por los costados no se camina: la punta
   * choca entera.
   */
  if (WAGONS[w.id] && WAGONS[w.id].paredAdentro) {
    const borrar = (cp, xa, xb, ya = 0, yb = H) => { for (let y = ya; y < yb; y++) for (let x = Math.max(0, xa); x < Math.min(W, xb); x++) { cp.i[y * W + x] = -1; cp.m[y * W + x] = 0; } };
    const G = Math.max(3, Math.round(tc.paredPunta * PX));
    for (const c of [0, cols - 1]) {
      const xa = c === 0 ? 0 : ax(w.x + (cols - 1) * S) + G, xb = c === 0 ? ax(w.x + S) - G : W;
      for (const cp of [FONDO, FRENTE, ASIENTOS, MESAS]) borrar(cp, xa, xb);
      let fd0 = -1, fd1 = -1;
      for (let f = filasArriba; f < map.rows - filasAbajo; f++) if (casilla(c, f) !== '#') { if (fd0 < 0) fd0 = f; fd1 = f; }
      // El piso, menos en las filas del pasillo.
      if (fd0 < 0) borrar(PISO, xa, xb);
      else { borrar(PISO, xa, xb, 0, ay(fd0 * S)); borrar(PISO, xa, xb, ay((fd1 + 1) * S), H); }
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
  /**
   * 🆕 LAS CORTINAS: una pieza por abertura, con un dibujo por estado; muestra el de su cortina en el
   * juego (`train.cortinasPorClave`, world/cortinas.js). Sin cortina (de día), abierta.
   */
  // 🆕 Lo que se mueve con el tren: una pieza con sus cinco dibujos; muestra el del meneo de ahora.
  if (animadosV.length) {
    for (const A of animadosV) {
      const [mx, my] = enMundo(A.x, A.y);
      const imgs = A.capas.map((cp) => pieza(iluminar({ ancho: A.w, alto: A.h, indices: cp.i, marcas: cp.m, campo: (px, py) => campo(px + A.x, py + A.y) }), A.w, A.h, mx, my, A.base).img);
      resultado.altas.push({
        x: mx, y: my, w: A.w * PASO, h: A.h * PASO, base: A.base,
        get img() {
          if (A.reloj) return imgs[Math.floor(performance.now() / 1000 / A.reloj) % imgs.length];
          const m = (A.fuente === 'agua' ? estiloNuevo.meneoAgua : estiloNuevo.meneo) || 0;
          return imgs[Math.max(0, Math.min(imgs.length - 1, Math.round((m + 1) / 2 * (imgs.length - 1))))];
        },
      });
    }
  }
  if (cortinasV.length) {
    const im = Object.fromEntries(Object.entries(CORT).map(([e, cp]) => [e, iluminado(cp)]));
    for (const k of cortinasV) {
      const [mx, my] = enMundo(k.x, k.y);
      const imgs = {};
      for (const e of Object.keys(im)) imgs[e] = pieza(recorte(im[e], k.x, k.y, k.w, k.h), k.w, k.h, mx, my, k.base).img;
      const vidaMax = CONFIG.cortinas.vida;
      resultado.altas.push({
        x: mx, y: my, w: k.w * PASO, h: k.h * PASO, base: k.base,
        get img() {
          const K = train.cortinasPorClave && train.cortinasPorClave[k.clave];
          if (!K) return imgs.abierta;
          if (K.estado !== 'cerrada') return imgs[K.estado];
          return K.vida > vidaMax * 0.6 ? imgs.c0 : K.vida > vidaMax * 0.3 ? imgs.c1 : imgs.c2;
        },
      });
    }
  }
  // 🆕 Las puntas, finitas (ver `PUNTAS`).
  {
    const pu = iluminado(PUNTAS);
    for (const q of puntasV) {
      const [mx, my] = enMundo(q.x, q.y);
      resultado.altas.push(pieza(recorte(pu, q.x, q.y, q.w, q.h), q.w, q.h, mx, my, q.base));
    }
  }
  const yF = ay(yPisoAbajo - tc.alturaParedBaja);
  const [, myF] = enMundo(0, yF);
  resultado.altas.push(pieza(recorte(iluminado(FRENTE), 0, yF, W, H - yF), W, H - yF, x0, myF, map.rows * S - 0.01));
  return resultado;
}
