/**
 * LÁMINA DEL VAGÓN — el mismo pedazo de tren dibujado de tres maneras.
 *
 * Es una prueba FUERA del juego, como fue `prototipos/gente-80px/`: acá no hay
 * jugabilidad, sólo dibujo, para poder elegir el estilo antes de tocar el
 * código del tren.
 *
 * LAS TRES COLUMNAS:
 *   HOY  — lo que dibuja el juego ahora mismo, copiado de world/train.js.
 *   A    — el mismo vagón con el detalle de la gente nueva, sobrio.
 *   B    — lo mismo, más gastado: manchas, nudos, remiendos, paja.
 *
 * TODO SE MIDE EN PUNTOS DE DIBUJO (1 punto = 1 píxel de pantalla = un cuarto
 * de unidad del mundo, porque el juego mira con la lupa de ×4). Una casilla del
 * tren mide 16 unidades, o sea 64 PUNTOS: ése es el lienzo de cada casilla.
 * Una persona mide 80 puntos de alto, así que un tile es un poco más bajo que
 * una persona — la escala está bien y no hay que tocarla.
 */

const T = 64;                 // una casilla, en puntos
const U = 4;                  // una unidad del mundo, en puntos

// Los colores son LOS DE HOY (data/config.js): esto es una prueba de detalle,
// no de paleta. Si cambiáramos las dos cosas de una no sabríamos cuál mejoró.
const C = {
  fuera: '#0d0b0c',
  piso: '#6d4a30',
  pared: '#3a2a1f',
  asiento: '#8a5a34',
  ventana: '#2f4a52',
  vidrio: '#7fb2bd',
  enganche: '#2a2320',
  engancheBorde: '#171210',
  carga: '#9c7a45',           // el vagón correo: cajones y arpillera
  cargaLuz: '#b89257',
};
const NEGRO = '#1a120c';      // la misma orilla oscura que usa la gente

const ALTO_PARED = 20 * U;
const ALTO_ASIENTO = 5 * U;
const ALTO_CARGA = 7 * U;

/** El mismo color multiplicado por `f` (0,7 es 30% más oscuro). */
function tono(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}

/**
 * UN NÚMERO FIJO PARA CADA CASILLA. No es azar de verdad: si lo fuera, la veta
 * de la madera cambiaría en cada cuadro y el piso titilaría entero.
 */
function sorteo(a, b, c = 0) {
  let n = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) % 1000;
}

/** El pedazo de vagón que se dibuja. Cada letra es una casilla del juego. */
const MAPA = [
  '###WW###X#',
  '##########',
  '..........',
  '.SS..CC..+',
  '.SS..CC..+',
  '..........',
  '.........+',
  '########X#',
].map((f) => f.split(''));

// La columna del enganche: arriba y abajo es el vacío, se ve el desierto pasar.
MAPA[0][9] = '#'; MAPA[1][9] = '#'; MAPA[7][9] = '#';
for (const f of [2, 5]) MAPA[f][9] = '+';

const FILAS = MAPA.length;
const COLS = MAPA[0].length;

/** Un pincel que pinta en PUNTOS, con el panel ya corrido a su lugar. */
function pincel(ctx, ox, oy) {
  return (x, y, w, h, color) => {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = color;
    ctx.fillRect(ox + Math.round(x), oy + Math.round(y), Math.round(w), Math.round(h));
  };
}

// ---------------------------------------------------------------- EL PISO

function pisoHoy(p, x, y) {
  p(x, y, T, T, C.piso);
  p(x, y + T - U, T, U, tono(C.piso, 0.86));
}

/**
 * EL PISO NUEVO: TABLAS DE VERDAD. Hoy el piso es un solo tono con una raya
 * cada 16 unidades, o sea una tabla tan alta como la mitad de una persona.
 * Acá la tabla mide 4 unidades (16 puntos): cuatro por casilla, cada una con su
 * tono, su veta y sus clavos.
 */
function pisoNuevo(p, x, y, col, fila, sucio) {
  for (let i = 0; i < 4; i++) {
    const py = y + i * 16;
    const s = sorteo(col, fila * 4 + i);
    const tabla = tono(C.piso, 0.93 + (s % 6) * 0.025);

    p(x, py, T, 16, tabla);
    p(x, py, T, 1, tono(tabla, 1.12));            // el filo iluminado de la tabla
    p(x, py + 15, T, 1, tono(C.piso, 0.58));      // la junta entre tabla y tabla

    // La veta: dos rayas largas y flojas, nunca en el mismo lugar.
    p(x + (s % 4) * 9, py + 4, 12 + (s % 5) * 5, 1, tono(tabla, 0.9));
    p(x + 24 - (s % 3) * 8, py + 10, 10 + ((s >> 2) % 4) * 6, 1, tono(tabla, 0.92));

    // Los clavos, uno en cada punta de la tabla: son los que dicen "esto es
    // una tabla clavada" y no una franja de color.
    for (const cx of [4, T - 6]) {
      p(x + cx, py + 6, 2, 2, tono(C.piso, 0.5));
      p(x + cx, py + 6, 2, 1, tono(C.piso, 1.2));
    }

    if (sucio) {
      // Un nudo cada tanto, y el desgaste del paso en el medio del vagón.
      if (s % 7 === 0) {
        p(x + 20 + (s % 3) * 7, py + 5, 5, 5, tono(C.piso, 0.62));
        p(x + 21 + (s % 3) * 7, py + 6, 3, 3, tono(C.piso, 0.74));
      }
      if (s % 5 === 0) p(x + (s % 6) * 8, py + 12, 14, 2, tono(C.piso, 0.84));
    }
  }
}

// ------------------------------------------------------------- LA PARED

/**
 * LA PARED DEL FONDO es UN BLOQUE POR COLUMNA, no una casilla por vez: la tapa
 * levantada arriba y una cara alta abajo. Así lo hace el juego hoy y así se
 * queda — lo que cambia es lo que tiene dibujado encima.
 */
function paredHoy(p, x, pie, conVentana) {
  const tapa = tono(C.pared, 1.28), brillo = tono(C.pared, 1.5);
  p(x, -ALTO_PARED, T, pie + ALTO_PARED, tapa);
  p(x, -ALTO_PARED, T, U, brillo);
  p(x, pie - ALTO_PARED, T, ALTO_PARED, C.pared);
  p(x, pie - U, T, U, tono(C.pared, 0.55));
  if (conVentana) {
    p(x + 2 * U, pie - ALTO_PARED + 4 * U, T - 4 * U, ALTO_PARED - 10 * U, C.ventana);
    p(x + 3 * U, pie - ALTO_PARED + 5 * U, T - 6 * U, ALTO_PARED - 12 * U, C.vidrio);
    p(x + 3 * U, pie - ALTO_PARED + 5 * U, T - 6 * U, 2 * U, tono(C.vidrio, 1.25));
  }
}

function paredNueva(p, x, pie, conVentana, col, sucio) {
  const tapa = tono(C.pared, 1.28);
  const cara = C.pared;
  const arriba = pie - ALTO_PARED;

  // La TAPA (el canto de arriba de la pared, que se ve porque miramos en tres
  // cuartos): chapa con su costura y sus remaches.
  p(x, -ALTO_PARED, T, pie + ALTO_PARED, tapa);
  p(x, -ALTO_PARED, T, 2, tono(C.pared, 1.55));
  p(x, -ALTO_PARED + 6, T, 1, tono(C.pared, 1.05));
  for (let i = 0; i < 4; i++) p(x + 6 + i * 16, -ALTO_PARED + 2, 2, 2, tono(C.pared, 1.75));

  // LA CARA: tablas VERTICALES, al revés que el piso, para que pared y piso no
  // se confundan en una sola textura.
  p(x, arriba, T, ALTO_PARED, cara);
  for (let i = 0; i < 4; i++) {
    const tx = x + i * 16;
    const s = sorteo(col, i, 7);
    p(tx, arriba, 16, ALTO_PARED, tono(cara, 0.95 + (s % 5) * 0.03));
    p(tx, arriba, 1, ALTO_PARED, tono(cara, 1.25));        // el filo de la tabla
    p(tx + 15, arriba, 1, ALTO_PARED, tono(cara, 0.62));   // la junta
    if (sucio && s % 4 === 0) p(tx + 4, arriba + 10 + (s % 5) * 8, 7, 1, tono(cara, 0.78));
  }
  // El zócalo y la sombra donde la pared se apoya en el piso.
  p(x, pie - 5 * U, T, 2 * U, tono(cara, 1.18));
  p(x, pie - 3 * U, T, 3 * U, tono(cara, 0.5));

  if (conVentana) ventana(p, x + 2 * U, arriba + 3 * U, T - 4 * U, ALTO_PARED - 9 * U, sucio);
}

/**
 * LA VENTANILLA tiene que gritar "esto no es pared": por acá te entran las
 * balas. Marco oscuro de 2 puntos —la misma orilla que la gente—, el vidrio
 * con el reflejo cruzado y el travesaño.
 */
function ventana(p, x, y, w, h, sucio) {
  p(x - 2, y - 2, w + 4, h + 4, NEGRO);            // la orilla
  p(x, y, w, h, C.ventana);                        // el marco
  const vx = x + 3, vy = y + 3, vw = w - 6, vh = h - 6;
  p(vx, vy, vw, vh, C.vidrio);
  p(vx, vy, vw, vh, tono(C.vidrio, 0.82));         // el vidrio, apagado
  // El reflejo: una banda en diagonal, escalonada.
  for (let i = 0; i < vh; i++) {
    const rx = vx + Math.round(i * 0.8);
    p(rx, vy + i, Math.min(8, vx + vw - rx), 1, tono(C.vidrio, 1.12));
  }
  p(vx, vy, vw, 2, tono(C.vidrio, 1.3));           // la luz de arriba
  p(vx, vy + Math.round(vh / 2), vw, 2, C.ventana); // el travesaño
  if (sucio) {
    p(vx + 2, vy + vh - 4, vw - 6, 2, tono(C.vidrio, 0.68));   // el polvo de abajo
    p(vx + vw - 7, vy + 3, 3, 6, tono(C.vidrio, 0.72));
  }
}

/** La pared de adelante, vista desde adentro: sólo un borde bajo. */
function paredBajaHoy(p, x, y) {
  const tapa = tono(C.pared, 1.28);
  p(x, y - 3 * U, T, T + 3 * U, tapa);
  p(x, y - 3 * U, T, U, tono(C.pared, 1.5));
}

function paredBajaNueva(p, x, y, col, sucio) {
  const tapa = tono(C.pared, 1.28);
  p(x, y - 3 * U, T, T + 3 * U, tapa);
  p(x, y - 3 * U, T, 2, tono(C.pared, 1.6));
  p(x, y - 3 * U + 5, T, 1, tono(C.pared, 1.02));
  for (let i = 0; i < 4; i++) p(x + 6 + i * 16, y - 3 * U + 2, 2, 2, tono(C.pared, 1.75));
  if (sucio && sorteo(col, 3, 11) % 3 === 0) p(x + 18, y - 3 * U + 3, 12, 1, tono(C.pared, 0.9));
}

// ------------------------------------------------- ASIENTOS, CARGA, ENGANCHE

function asientoHoy(p, x, y, conCara) {
  p(x + U, y + 2 * U - ALTO_ASIENTO, T - 2 * U, T - 4 * U, C.asiento);
  if (conCara) p(x + U, y + T - 2 * U - ALTO_ASIENTO, T - 2 * U, ALTO_ASIENTO, tono(C.asiento, 0.6));
}

/**
 * EL ASIENTO. Lo que lo tiene que separar de un cajón —que es a lo que se
 * parecía la primera versión— es el RESPALDO: una tabla parada atrás, con sus
 * listones, y adelante el almohadón hundido. Sin el respaldo, cualquier bulto
 * cuadrado en el piso es un cajón.
 */
function asientoNuevo(p, x, y, conCara, col, fila, sucio) {
  const ax = x + 2, ay = y + 2 * U - ALTO_ASIENTO;
  const aw = T - 4, ah = T - 4 * U;
  const s = sorteo(col, fila, 3);
  const RESP = 13;                       // lo que mide el respaldo, en puntos

  p(ax - 2, ay - 2, aw + 4, ah + 4 + (conCara ? ALTO_ASIENTO : 0), NEGRO);

  // EL RESPALDO, atrás de todo: una tabla parada, más clara porque le da la luz.
  p(ax, ay, aw, RESP, tono(C.asiento, 0.8));
  p(ax, ay, aw, 3, tono(C.asiento, 1.22));
  for (let i = 1; i < 5; i++) p(ax + i * Math.round(aw / 5), ay + 3, 1, RESP - 3, tono(C.asiento, 0.6));
  p(ax, ay + RESP - 2, aw, 2, tono(C.asiento, 0.45));   // la sombra bajo el respaldo

  // EL ALMOHADÓN: cuero gastado, hundido en el medio.
  const cy = ay + RESP, chh = ah - RESP;
  p(ax, cy, aw, chh, C.asiento);
  p(ax + 3, cy + 2, aw - 6, chh - 5, tono(C.asiento, 1.14));
  p(ax + 6, cy + 5, aw - 12, chh - 11, tono(C.asiento, 1.02));
  p(ax, cy + chh - 3, aw, 3, tono(C.asiento, 0.74));
  // Los botones del tapizado, en dos filas: eso es lo que dice "acá te sentás".
  for (let i = 0; i < 3; i++) {
    p(ax + 9 + i * 15, cy + 5, 2, 2, tono(C.asiento, 0.5));
    p(ax + 9 + i * 15, cy + chh - 9, 2, 2, tono(C.asiento, 0.5));
  }
  // Los brazos, a los costados.
  p(ax, cy, 4, chh, tono(C.asiento, 0.86));
  p(ax + aw - 4, cy, 4, chh, tono(C.asiento, 0.68));

  if (conCara) {
    const fy = y + T - 2 * U - ALTO_ASIENTO;
    p(ax, fy, aw, ALTO_ASIENTO, tono(C.asiento, 0.58));
    p(ax, fy, aw, 2, tono(C.asiento, 0.76));
    // Las patas: sin ellas el asiento flota sobre las tablas.
    p(ax + 3, fy + 5, 5, ALTO_ASIENTO - 5, tono(C.asiento, 0.4));
    p(ax + aw - 8, fy + 5, 5, ALTO_ASIENTO - 5, tono(C.asiento, 0.4));
  }
  if (sucio) {
    p(ax + 8 + (s % 4) * 8, cy + 6, 9, 4, tono(C.asiento, 0.88));   // el cuero pelado
    if (s % 3 === 0) p(ax + 4, ay + 4, 6, RESP - 7, tono(C.asiento, 0.7));
  }
}

function cargaHoy(p, x, y, conCara) {
  p(x, y + U - ALTO_CARGA, T, T - 2 * U, C.carga);
  p(x, y + U - ALTO_CARGA, T, U, C.cargaLuz);
  if (conCara) p(x, y + T - U - ALTO_CARGA, T, ALTO_CARGA, tono(C.carga, 0.6));
}

/** EL CAJÓN: tablas, fleje de hierro y la marca estarcida del correo. */
function cargaNueva(p, x, y, conCara, col, fila, sucio) {
  const cx = x, cy = y + U - ALTO_CARGA, cw = T, ch = T - 2 * U;
  const s = sorteo(col, fila, 5);

  p(cx, cy - 2, cw, ch + 4 + (conCara ? ALTO_CARGA : 0), NEGRO);
  p(cx, cy, cw, ch, C.carga);
  p(cx, cy, cw, 3, C.cargaLuz);

  // Las tablas de la tapa, a lo largo.
  for (let i = 0; i < 3; i++) {
    const ty = cy + 4 + i * 16;
    p(cx + 2, ty, cw - 4, 14, tono(C.carga, 0.96 + (sorteo(col, fila * 3 + i, 9) % 4) * 0.04));
    p(cx + 2, ty, cw - 4, 1, tono(C.carga, 1.14));
    p(cx + 2, ty + 13, cw - 4, 1, tono(C.carga, 0.72));
  }
  // El fleje de hierro que cruza el cajón, con sus dos remaches.
  p(cx, cy + Math.round(ch / 2) - 3, cw, 6, '#5e5348');
  p(cx, cy + Math.round(ch / 2) - 3, cw, 2, '#7a6e60');
  p(cx + 7, cy + Math.round(ch / 2) - 1, 2, 2, '#9a8e7e');
  p(cx + cw - 9, cy + Math.round(ch / 2) - 1, 2, 2, '#9a8e7e');

  if (conCara) {
    const fy = y + T - U - ALTO_CARGA;
    p(cx, fy, cw, ALTO_CARGA, tono(C.carga, 0.6));
    p(cx, fy, cw, 2, tono(C.carga, 0.74));
    p(cx + 6, fy + 3, cw - 12, 2, tono(C.carga, 0.5));
  }
  if (sucio) {
    // La marca estarcida y un remiendo de arpillera: es el vagón correo.
    p(cx + 16, cy + 8, 3, 9, tono(C.carga, 0.62));
    p(cx + 21, cy + 8, 3, 9, tono(C.carga, 0.62));
    p(cx + 16, cy + 12, 8, 2, tono(C.carga, 0.62));
    if (s % 2 === 0) p(cx + 34, cy + 30, 14, 9, tono(C.carga, 0.82));
  }
}

function engancheHoy(p, x, y) {
  p(x, y, T, T, C.enganche);
  p(x, y, T, 2 * U, C.engancheBorde);
  p(x, y + T - 2 * U, T, 2 * U, C.engancheBorde);
  p(x + 3 * U, y + 5 * U, 2 * U, 6 * U, C.engancheBorde);
  p(x + 11 * U, y + 5 * U, 2 * U, 6 * U, C.engancheBorde);
}

/** LA PASARELA: chapa estriada, con el hierro del enganche por el medio. */
function engancheNuevo(p, x, y, fila, sucio) {
  p(x, y, T, T, C.enganche);
  p(x, y, T, 2 * U, C.engancheBorde);
  p(x, y + T - 2 * U, T, 2 * U, C.engancheBorde);
  p(x, y + 2 * U, T, 1, tono(C.enganche, 1.6));
  // El estriado antideslizante. 🔻 La primera versión era una nube de rayitas
  // en diagonal y la pasarela se leía como un pozo sucio: ahora son cuatro
  // líneas largas, que es lo que se ve de una chapa estriada desde arriba.
  for (let j = 0; j < 4; j++) {
    p(x + 3, y + 14 + j * 9, T - 6, 2, tono(C.enganche, 1.45));
    p(x + 3, y + 16 + j * 9, T - 6, 1, tono(C.enganche, 0.7));
  }
  // El hierro del enganche, por el medio.
  p(x + 3 * U, y + 5 * U, 2 * U, 6 * U, tono(C.enganche, 0.5));
  p(x + 11 * U, y + 5 * U, 2 * U, 6 * U, tono(C.enganche, 0.5));
  p(x + 3 * U, y + 5 * U, 2 * U, 1, tono(C.enganche, 1.7));
  p(x + 11 * U, y + 5 * U, 2 * U, 1, tono(C.enganche, 1.7));
  if (sucio && sorteo(0, fila, 13) % 2 === 0) p(x + 20, y + 40, 18, 2, tono(C.enganche, 1.2));
}

// ------------------------------------------------------------- EL PANEL

function panel(ctx, ox, oy, estilo) {
  const p = pincel(ctx, ox, oy + ALTO_PARED);
  const hoy = estilo === 'hoy';
  const sucio = estilo === 'b';

  // El fondo: lo de afuera del tren.
  ctx.fillStyle = C.fuera;
  ctx.fillRect(ox, oy, COLS * T, FILAS * T + ALTO_PARED);

  const letra = (c, f) => (MAPA[f] || [])[c];

  // 1) EL PISO, que nunca tapa a nadie.
  for (let f = 0; f < FILAS; f++) {
    for (let c = 0; c < COLS; c++) {
      const t = letra(c, f), x = c * T, y = f * T;
      if (t === '#' || t === 'X') continue;
      if (t === '+') { hoy ? engancheHoy(p, x, y) : engancheNuevo(p, x, y, f, sucio); continue; }
      hoy ? pisoHoy(p, x, y) : pisoNuevo(p, x, y, c, f, sucio);
    }
  }

  // La sombra que la pared del fondo tira sobre las tablas.
  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let c = 0; c < COLS; c++) {
    let r1 = -1;
    while (r1 + 1 < FILAS && (letra(c, r1 + 1) === '#' || letra(c, r1 + 1) === 'W')) r1++;
    if (r1 >= 0 && letra(c, r1 + 1) && letra(c, r1 + 1) !== 'X') {
      p(c * T, (r1 + 1) * T, T, 7 * U, '#000');
    }
  }
  ctx.restore();

  // 2) LO QUE SE LEVANTA DEL PISO, de arriba hacia abajo: lo de más abajo tapa
  //    a lo de atrás, que es toda la gracia de los tres cuartos.
  for (let c = 0; c < COLS; c++) {
    let r1 = -1;
    while (r1 + 1 < FILAS && (letra(c, r1 + 1) === '#' || letra(c, r1 + 1) === 'W')) r1++;
    if (r1 < 0) continue;
    const pie = (r1 + 1) * T;
    let conVentana = false;
    for (let f = 0; f <= r1; f++) if (letra(c, f) === 'W') conVentana = true;
    hoy ? paredHoy(p, c * T, pie, conVentana) : paredNueva(p, c * T, pie, conVentana, c, sucio);
  }

  for (let f = 0; f < FILAS; f++) {
    for (let c = 0; c < COLS; c++) {
      const t = letra(c, f), x = c * T, y = f * T, abajo = letra(c, f + 1);
      if (t === 'S') hoy ? asientoHoy(p, x, y, abajo !== 'S') : asientoNuevo(p, x, y, abajo !== 'S', c, f, sucio);
      if (t === 'C') hoy ? cargaHoy(p, x, y, abajo !== 'C') : cargaNueva(p, x, y, abajo !== 'C', c, f, sucio);
    }
  }

  // La pared de adelante, la última fila.
  for (let c = 0; c < COLS; c++) {
    if (letra(c, FILAS - 1) !== '#') continue;
    hoy ? paredBajaHoy(p, c * T, (FILAS - 1) * T)
        : paredBajaNueva(p, c * T, (FILAS - 1) * T, c, sucio);
  }
}

// ------------------------------------------------------------- LA HOJA

const TITULOS = [
  ['hoy', 'HOY · lo que dibuja el juego'],
  ['a', 'A · el detalle de la gente, sobrio'],
  ['b', 'B · lo mismo, más gastado'],
];

const ANCHO_PANEL = COLS * T;
const ALTO_PANEL = FILAS * T + ALTO_PARED;
const GAP = 18;
const CABEZA = 30;

const hoja = document.getElementById('hoja');
hoja.width = ANCHO_PANEL;
hoja.height = TITULOS.length * (ALTO_PANEL + CABEZA + GAP);
const ctx = hoja.getContext('2d');
ctx.imageSmoothingEnabled = false;

ctx.fillStyle = '#14100e';
ctx.fillRect(0, 0, hoja.width, hoja.height);

TITULOS.forEach(([estilo, titulo], i) => {
  const oy = i * (ALTO_PANEL + CABEZA + GAP);
  ctx.fillStyle = '#d8c8a8';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(titulo, 6, oy + CABEZA / 2);
  panel(ctx, 0, oy + CABEZA, estilo);
});

window.LISTA = true;
