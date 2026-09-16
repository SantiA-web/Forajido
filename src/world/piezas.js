/**
 * LAS PIEZAS DEL TREN — el vagón dibujado al detalle de la gente (etapa 3).
 *
 * *(Elegido sobre la lámina de `prototipos/vagon/`: el detalle sobrio en todo
 * el vagón y el desgaste SÓLO donde quiere decir algo)*. Una casilla del tren
 * mide 16 unidades del mundo, o sea **64 PUNTOS DE DIBUJO** con la lupa de ×4.
 * Hasta acá el piso de esa casilla eran dos rectángulos —un color plano y una
 * raya—, y al lado de una persona de 80 puntos dibujada punto por punto el
 * vagón quedaba liso.
 *
 * 🧠 CADA PIEZA SE ARMA UNA SOLA VEZ, igual que la gente (ver `entities/
 * figura.js`): se dibuja en un lienzo aparte, se guarda, y después el tren sólo
 * la ESTAMPA. Dibujar veinte rectángulos por casilla en cada cuadro, con un
 * vagón entero en pantalla, costaría cien veces lo que cuesta una estampa.
 *
 * NO HAY AZAR. La veta de la madera y las manchas salen de un número fijo por
 * casilla (`sorteo`): si fueran azar de verdad, el piso titilaría entero en
 * cada cuadro. Y como las variantes son POCAS (cuatro), lo que se guarda son
 * cuatro dibujos y no uno por casilla del tren.
 *
 * EL DESGASTE ES INFORMACIÓN, NO RUIDO. El vagón ocupa toda la pantalla y no
 * tiene que competir con la gente, así que lo gastado va sólo donde significa
 * algo: el piso del PASILLO (por donde pasa todo el mundo), la marca estarcida
 * del cajón del correo, el polvo abajo de la ventanilla y el cuero pelado de
 * algunos asientos.
 */

/** Un punto de dibujo, en unidades del mundo (la lupa del juego es ×4). */
export const PUNTO = 0.25;
/** Una casilla y una unidad del mundo, en puntos de dibujo. */
const T = 64;
const U = 4;
/** La misma orilla oscura que lleva la gente. */
const NEGRO = '#1a120c';
/** Cuántas variantes hay de cada pieza. Pocas, para guardar pocos dibujos. */
const VARIANTES = 4;

/** El mismo color multiplicado por `f` (0,7 es 30% más oscuro). */
function tono(hex, f) {
  if (typeof hex !== 'string' || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  const c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}

/**
 * UN NÚMERO FIJO PARA CADA CASILLA, entre 0 y 999. No es azar: la misma
 * casilla saca siempre el mismo número, así la veta no cambia entre cuadros.
 */
export function sorteo(a, b, c = 0) {
  let n = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) % 1000;
}

/** Qué variante le toca a la casilla (col, fila) de cada tipo de pieza. */
export function varianteDe(col, fila, semilla = 0) {
  return sorteo(col, fila, semilla) % VARIANTES;
}

// ------------------------------------------------------- el lienzo y la caja

const guardadas = new Map();

/** Arma la pieza la primera vez que se pide, y después la devuelve guardada. */
function armar(clave, hacer) {
  let img = guardadas.get(clave);
  if (!img) { img = hacer(); guardadas.set(clave, img); }
  return img;
}

/** Cuantas piezas hay guardadas y cuanto ocupan. Existe para poder medirlo. */
export function piezasGuardadas() {
  let bytes = 0;
  for (const img of guardadas.values()) bytes += img.width * img.height * 4;
  return { cuantas: guardadas.size, kb: Math.round(bytes / 1024) };
}

/** Un lienzo de `w`×`h` PUNTOS, con un pincel que pinta en puntos. */
function lienzo(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const g = c.getContext('2d');
  const p = (x, y, ancho, alto, color) => {
    if (ancho <= 0 || alto <= 0) return;
    g.fillStyle = color;
    g.fillRect(Math.round(x), Math.round(y), Math.round(ancho), Math.round(alto));
  };
  return { c, p };
}

/**
 * Estampa una pieza con su esquina de arriba a la izquierda en (x, y), medido
 * en UNIDADES del mundo. La pieza está en puntos, así que se dibuja a un
 * cuarto de unidad por punto: queda pixel a pixel con la lupa.
 */
export function estampar(r, img, x, y) {
  r.ctx.drawImage(img, x, y, img.width * PUNTO, img.height * PUNTO);
}

// ------------------------------------------------------------------- el piso

/**
 * EL PISO: TABLAS DE VERDAD. Antes la "tabla" medía 16 unidades, la mitad de
 * una persona. Ahora mide 4 (16 puntos): cuatro por casilla, cada una con su
 * tono, su veta y sus clavos.
 *
 * `pasillo` agrega el desgaste del paso: es el único lugar del piso donde va,
 * porque es el único donde significa algo.
 */
export function piezaPiso(color, variante, pasillo) {
  return armar(`piso|${color}|${variante}|${pasillo ? 1 : 0}`, () => {
    const { c, p } = lienzo(T, T);
    for (let i = 0; i < 4; i++) {
      const py = i * 16;
      const s = sorteo(variante, i, 101);
      const tabla = tono(color, 0.93 + (s % 6) * 0.025);

      p(0, py, T, 16, tabla);
      p(0, py, T, 1, tono(tabla, 1.12));        // el filo iluminado de la tabla
      p(0, py + 15, T, 1, tono(color, 0.58));   // la junta entre tabla y tabla

      // La veta: dos rayas largas y flojas, nunca en el mismo lugar.
      p((s % 4) * 9, py + 4, 12 + (s % 5) * 5, 1, tono(tabla, 0.9));
      p(24 - (s % 3) * 8, py + 10, 10 + ((s >> 2) % 4) * 6, 1, tono(tabla, 0.92));

      // Los clavos, uno en cada punta: son los que dicen "esto es una tabla
      // clavada" y no una franja de color.
      for (const cx of [4, T - 6]) {
        p(cx, py + 6, 2, 2, tono(color, 0.5));
        p(cx, py + 6, 2, 1, tono(color, 1.2));
      }

      if (pasillo) {
        // Por acá pasa todo el mundo: la madera está lustrada y hay un nudo
        // cada tanto. Sólo en el pasillo.
        if (s % 3 === 0) p((s % 6) * 8, py + 11, 16 + (s % 4) * 5, 3, tono(color, 1.06));
        if (s % 7 === 0) {
          p(20 + (s % 3) * 7, py + 5, 5, 5, tono(color, 0.62));
          p(21 + (s % 3) * 7, py + 6, 3, 3, tono(color, 0.74));
        }
      }
    }
    return c;
  });
}

// ------------------------------------------------------------------ la pared

/**
 * EL CANTO DE ARRIBA de la pared: lo vemos porque el juego mira en tres
 * cuartos. Chapa con su costura y sus remaches.
 */
export function piezaCantoPared(color) {
  return armar(`canto|${color}`, () => {
    const alto = 8;
    const { c, p } = lienzo(T, alto);
    p(0, 0, T, alto, tono(color, 1.28));
    p(0, 0, T, 2, tono(color, 1.55));
    p(0, 6, T, 1, tono(color, 1.05));
    for (let i = 0; i < 4; i++) p(6 + i * 16, 2, 2, 2, tono(color, 1.75));
    return c;
  });
}

/**
 * LA CARA de la pared: tablas VERTICALES, al revés que el piso, para que pared
 * y piso no se confundan en una sola textura. Abajo el zócalo y la sombra con
 * la que la pared se apoya en las tablas.
 */
export function piezaCaraPared(color, altoPuntos, variante) {
  const alto = Math.max(4, Math.round(altoPuntos));
  return armar(`cara|${color}|${alto}|${variante}`, () => {
    const { c, p } = lienzo(T, alto);
    p(0, 0, T, alto, color);
    for (let i = 0; i < 4; i++) {
      const tx = i * 16;
      const s = sorteo(variante, i, 707);
      p(tx, 0, 16, alto, tono(color, 0.95 + (s % 5) * 0.03));
      p(tx, 0, 1, alto, tono(color, 1.25));        // el filo de la tabla
      p(tx + 15, 0, 1, alto, tono(color, 0.62));   // la junta
    }
    if (alto >= 5 * U) {
      p(0, alto - 5 * U, T, 2 * U, tono(color, 1.18));   // el zócalo
      p(0, alto - 3 * U, T, 3 * U, tono(color, 0.5));    // la sombra del pie
    } else {
      p(0, alto - 2, T, 2, tono(color, 0.5));
    }
    return c;
  });
}

/**
 * LA VENTANILLA tiene que gritar "esto no es pared": por acá te entran las
 * balas. Marco oscuro de 2 puntos —la misma orilla que la gente—, el vidrio
 * con el reflejo cruzado, el travesaño y el polvo abajo.
 */
export function piezaVentana(marco, vidrio, anchoPuntos, altoPuntos) {
  const w = Math.round(anchoPuntos), h = Math.round(altoPuntos);
  return armar(`ventana|${marco}|${vidrio}|${w}|${h}`, () => {
    const { c, p } = lienzo(w + 4, h + 4);
    p(0, 0, w + 4, h + 4, NEGRO);              // la orilla
    p(2, 2, w, h, marco);                      // el marco
    const vx = 5, vy = 5, vw = w - 6, vh = h - 6;
    p(vx, vy, vw, vh, tono(vidrio, 0.82));     // el vidrio, apagado
    // El reflejo: una banda en diagonal, escalonada.
    for (let i = 0; i < vh; i++) {
      const rx = vx + Math.round(i * 0.8);
      p(rx, vy + i, Math.min(8, vx + vw - rx), 1, tono(vidrio, 1.12));
    }
    p(vx, vy, vw, 2, tono(vidrio, 1.3));                 // la luz de arriba
    p(vx, vy + Math.round(vh / 2), vw, 2, marco);        // el travesaño
    // El polvo del desierto, abajo del vidrio. Va SIEMPRE: en este tren el
    // polvo no es un adorno suelto, es dónde está pasando el juego.
    p(vx + 2, vy + vh - 4, vw - 6, 2, tono(vidrio, 0.68));
    return c;
  });
}

// ------------------------------------------------------------- los asientos

/**
 * EL ASIENTO. Lo que lo separa de un cajón es el RESPALDO: una tabla parada
 * atrás con sus listones, y adelante el almohadón hundido con sus botones. Sin
 * el respaldo, cualquier bulto cuadrado en el piso es un cajón.
 *
 * `conCara` es la cara de adelante, la que le da el volumen: sólo la lleva el
 * asiento que no tiene otro asiento pegado abajo.
 */
export function piezaAsiento(color, altoPuntos, conCara, variante) {
  const h = Math.round(altoPuntos);
  return armar(`asiento|${color}|${h}|${conCara ? 1 : 0}|${variante}`, () => {
    const aw = T - 4, ah = T - 4 * U;
    const RESP = 13;                       // lo que mide el respaldo, en puntos
    const alto = ah + 4 + (conCara ? h : 0);
    const { c, p } = lienzo(aw + 4, alto);
    const ax = 2, ay = 2;
    const s = sorteo(variante, 0, 303);

    p(0, 0, aw + 4, alto, NEGRO);

    /**
     * EL RESPALDO, atrás de todo: una tabla parada con sus listones.
     *
     * 🔻 LA PRIMERA VERSIÓN NO ALCANZABA. El respaldo iba apenas más oscuro que
     * el almohadón y, de lejos, una fila de asientos se leía como una fila de
     * cajones. Lo que hace que se lea es el CONTRASTE entre las dos partes:
     * madera oscura arriba, cuero claro abajo, y entre las dos una línea negra.
     */
    p(ax, ay, aw, RESP, tono(color, 0.62));
    p(ax, ay, aw, 3, tono(color, 0.95));
    for (let i = 1; i < 5; i++) p(ax + i * Math.round(aw / 5), ay + 3, 1, RESP - 3, tono(color, 0.44));
    p(ax, ay + RESP - 2, aw, 2, NEGRO);

    // EL ALMOHADÓN: cuero gastado, hundido en el medio.
    const cy = ay + RESP, chh = ah - RESP;
    p(ax, cy, aw, chh, tono(color, 0.9));
    p(ax + 3, cy + 2, aw - 6, chh - 6, tono(color, 1.24));
    p(ax + 6, cy + 5, aw - 12, chh - 12, tono(color, 1.1));
    p(ax, cy + chh - 4, aw, 4, tono(color, 0.66));
    for (let i = 0; i < 3; i++) {
      p(ax + 9 + i * 15, cy + 5, 3, 2, tono(color, 0.5));
      p(ax + 9 + i * 15, cy + chh - 10, 3, 2, tono(color, 0.5));
    }
    p(ax, cy, 4, chh, tono(color, 0.78));              // los brazos
    p(ax + aw - 4, cy, 4, chh, tono(color, 0.6));

    // EL CUERO PELADO, y no en todos: un asiento usado entre varios sanos dice
    // "acá viaja gente"; todos pelados igual sería una textura y nada más.
    if (s % 3 === 0) p(ax + 8 + (s % 4) * 8, cy + 6, 9, 4, tono(color, 0.88));

    if (conCara) {
      const fy = ay + ah;
      p(ax, fy, aw, h, tono(color, 0.58));
      p(ax, fy, aw, 2, tono(color, 0.76));
      // Las patas: sin ellas el asiento flota sobre las tablas.
      p(ax + 3, fy + 5, 5, h - 5, tono(color, 0.4));
      p(ax + aw - 8, fy + 5, 5, h - 5, tono(color, 0.4));
    }
    return c;
  });
}

// ----------------------------------------------------------------- la carga

/**
 * EL CAJÓN: tablas, el fleje de hierro que lo cruza y —sólo en el vagón del
 * correo— la marca estarcida. La marca es el desgaste con sentido de la carga:
 * dice de qué vagón es lo que estás por robar.
 */
export function piezaCajon(base, luz, altoPuntos, conCara, variante, conMarca) {
  const h = Math.round(altoPuntos);
  return armar(`cajon|${base}|${luz}|${h}|${conCara ? 1 : 0}|${variante}|${conMarca ? 1 : 0}`, () => {
    const cw = T, ch = T - 2 * U;
    const alto = ch + 4 + (conCara ? h : 0);
    const { c, p } = lienzo(cw, alto);
    const cy = 2;
    const s = sorteo(variante, 0, 505);

    p(0, 0, cw, alto, NEGRO);
    p(0, cy, cw, ch, base);
    p(0, cy, cw, 3, luz);

    // Las tablas de la tapa, a lo largo.
    for (let i = 0; i < 3; i++) {
      const ty = cy + 4 + i * 16;
      p(2, ty, cw - 4, 14, tono(base, 0.96 + (sorteo(variante, i, 909) % 4) * 0.04));
      p(2, ty, cw - 4, 1, tono(base, 1.14));
      p(2, ty + 13, cw - 4, 1, tono(base, 0.72));
    }
    // El fleje de hierro, con sus dos remaches.
    const fy = cy + Math.round(ch / 2) - 3;
    p(0, fy, cw, 6, '#5e5348');
    p(0, fy, cw, 2, '#7a6e60');
    p(7, fy + 2, 2, 2, '#9a8e7e');
    p(cw - 9, fy + 2, 2, 2, '#9a8e7e');

    if (conMarca && s % 2 === 0) {
      /**
       * LA MARCA ESTARCIDA: un sobre. En algunos cajones y no en todos.
       *
       * 🔻 La primera versión eran tres palitos y en pantalla se leía como una
       * "H" puesta ahí por accidente. Un sobre dice de qué vagón es lo que
       * estás por robar, que es lo único que esta marca tiene que decir.
       */
      const tinta = tono(base, 0.6);
      const mx = 15, my = cy + 9, mw = 18, mh = 12;
      p(mx, my, mw, 1, tinta);
      p(mx, my + mh - 1, mw, 1, tinta);
      p(mx, my, 1, mh, tinta);
      p(mx + mw - 1, my, 1, mh, tinta);
      for (let i = 0; i < 7; i++) {
        p(mx + 1 + i, my + 1 + i, 1, 1, tinta);          // la solapa del sobre
        p(mx + mw - 2 - i, my + 1 + i, 1, 1, tinta);
      }
    }

    if (conCara) {
      const y0 = cy + ch;
      p(0, y0, cw, h, tono(base, 0.6));
      p(0, y0, cw, 2, tono(base, 0.74));
      p(6, y0 + 3, cw - 12, 2, tono(base, 0.5));
    }
    return c;
  });
}

// ------------------------------------------- la pasarela, la salida, la baranda

/** LA PASARELA del enganche: chapa estriada con el hierro por el medio. */
export function piezaPasarela(color, borde) {
  return armar(`pasarela|${color}|${borde}`, () => {
    const { c, p } = lienzo(T, T);
    p(0, 0, T, T, color);
    p(0, 0, T, 2 * U, borde);
    p(0, T - 2 * U, T, 2 * U, borde);
    p(0, 2 * U, T, 1, tono(color, 1.6));
    // El estriado antideslizante: líneas largas, que es lo que se ve de una
    // chapa estriada desde arriba (una nube de rayitas se leía como suciedad).
    for (let j = 0; j < 4; j++) {
      p(3, 14 + j * 9, T - 6, 2, tono(color, 1.45));
      p(3, 16 + j * 9, T - 6, 1, tono(color, 0.7));
    }
    // El hierro del enganche.
    p(3 * U, 5 * U, 2 * U, 6 * U, tono(color, 0.5));
    p(11 * U, 5 * U, 2 * U, 6 * U, tono(color, 0.5));
    p(3 * U, 5 * U, 2 * U, 1, tono(color, 1.7));
    p(11 * U, 5 * U, 2 * U, 1, tono(color, 1.7));
    return c;
  });
}

/** LA SALIDA: la chapa del estribo con la luz de afuera entrando. */
export function piezaSalida(color, luz) {
  return armar(`salida|${color}|${luz}`, () => {
    const { c, p } = lienzo(T, T);
    p(0, 0, T, T, color);
    p(2 * U, 2 * U, T - 4 * U, T - 4 * U, luz);
    p(2 * U, 2 * U, T - 4 * U, 2, tono(luz, 1.3));
    // Los escalones del estribo, que es por donde se baja del tren.
    for (let i = 0; i < 3; i++) {
      p(3 * U, 3 * U + i * 10, T - 6 * U, 2, tono(luz, 0.72));
      p(3 * U, 3 * U + i * 10 + 2, T - 6 * U, 1, tono(luz, 1.15));
    }
    return c;
  });
}

/** LA BARANDA del ganado y las plataformas: postes y travesaño, al aire libre. */
export function piezaBaranda(color, luz, altoPuntos) {
  const h = Math.round(altoPuntos);
  return armar(`baranda|${color}|${luz}|${h}`, () => {
    const { c, p } = lienzo(T, T + h);
    p(2 * U, 2, 2 * U, 10 * U + h, color);          // los dos postes
    p(11 * U, 2, 2 * U, 10 * U + h, color);
    p(2 * U, 2, 2 * U, 2, luz);
    p(11 * U, 2, 2 * U, 2, luz);
    p(0, 5 * U, T, 4 * U, color);                   // el travesaño
    p(0, 5 * U, T, 1, luz);
    p(0, 9 * U - 1, T, 1, tono(color, 0.6));
    return c;
  });
}
