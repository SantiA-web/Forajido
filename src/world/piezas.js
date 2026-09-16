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
export const NEGRO = '#1a120c';
/** Cuántas variantes hay de cada pieza. Pocas, para guardar pocos dibujos. */
const VARIANTES = 4;

/** El mismo color multiplicado por `f` (0,7 es 30% más oscuro). */
export function tono(hex, f) {
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

/**
 * UNA PIEZA CUALQUIERA, para lo que no es una casilla del tren: los barriles,
 * el botín, la dinamita. Se arma una sola vez con la misma caja que todo lo
 * demás, así hay UN taller de piezas y no dos.
 *
 * `clave` tiene que llevar TODO lo que cambia el dibujo (el color, el cuadro
 * de la animación, si está golpeado): si dos cosas distintas comparten clave,
 * la segunda se dibuja como la primera.
 */
export function pieza(clave, ancho, alto, dibujar) {
  return armar(clave, () => {
    const { c, p } = lienzo(ancho, alto);
    dibujar(p, c.width, c.height);
    return c;
  });
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
 * EL ASIENTO, MIRANDO A LA LOCOMOTORA.
 *
 * *(Santi, después de jugarlo: "los asientos deberían estar en pares mirando
 * hacia la locomotora... los huecos para cubrirse es la parte que está entre el
 * respaldo de uno de la pareja de asientos y dónde se sienta la gente en otra
 * pareja de asientos")*. La locomotora va a la DERECHA, así que el respaldo
 * queda a la IZQUIERDA y la gente mira para allá.
 *
 * 🔻 LO QUE HACE QUE SE LEA ES QUE EL RESPALDO SE LEVANTA. La primera versión
 * dibujaba el respaldo y el almohadón a la misma altura, y un par se leía como
 * un ROPERO de dos puertas. Un asiento es una tabla ALTA con un almohadón BAJO
 * adelante: en tres cuartos eso son dos alturas distintas, como las paredes y
 * los cajones. El respaldo se levanta 11 unidades —lo que mide el respaldo de
 * un asiento de verdad, y por eso mismo tapa la vista— y el almohadón 5.
 *
 * UN PAR SON DOS ASIENTOS, uno al lado del otro: las dos filas de la banda.
 * Cada uno se dibuja metido para adentro de su casilla, así entre los dos queda
 * una junta y no un bloque corrido.
 *
 * `lados` dice qué vecinos tiene. EL RESPALDO LO DIBUJA LA CASILLA QUE NO TIENE
 * OTRO ASIENTO A SU IZQUIERDA: en el vagón de pasajeros el banco mide una sola
 * baldosa, pero donde el bloque es más profundo (el de observación, el
 * dormitorio) las de la derecha son almohadón y nada más.
 */
export function piezaAsiento(color, altoPuntos, lados = {}, variante) {
  const h = Math.round(altoPuntos);              // lo que se levanta el almohadón
  const R = Math.round(h * 1.7);                 // lo que se levanta el respaldo
  const izq = !!lados.izq, der = !!lados.der;
  const clave = `asiento|${color}|${h}|${izq ? 1 : 0}${der ? 1 : 0}|${variante}`;
  return armar(clave, () => {
    const { c, p } = lienzo(T, T + R);
    const s = sorteo(variante, 0, 303);
    const fy0 = R;                               // el borde de arriba de la casilla
    const y0 = fy0 + 6, y1 = fy0 + T - 6;        // el asiento, metido para adentro
    const alto = y1 - y0;
    const RESP = 16;                             // el fondo del respaldo
    const rx = izq ? 0 : 2;

    // EL RESPALDO: una tabla alta, con su tapa arriba y su cara de este lado.
    if (!izq) {
      const tx = rx, tw = RESP;
      p(tx, y0 - R - 2, tw + 2, alto + 4, NEGRO);
      p(tx, y0 - R, tw, alto, tono(color, 0.88));            // la tapa, vista de arriba
      p(tx, y0 - R, tw, 3, tono(color, 1.18));
      p(tx + tw - 3, y0 - R, 3, alto, tono(color, 0.6));
      p(tx, y1 - R, tw, R, tono(color, 0.54));               // la cara que mira acá
      p(tx, y1 - R, tw, 2, tono(color, 0.72));
      for (const gy of [8, 18, 28]) p(tx + 2, y1 - R + gy, tw - 4, 1, tono(color, 0.36));
    }

    // EL ALMOHADÓN: cuero gastado, más bajo que el respaldo.
    const ax = izq ? 0 : rx + RESP, aw = T - ax - (der ? 0 : 2);
    p(ax, y0 - h - 2, aw + 2, alto + h + 4, NEGRO);
    p(ax, y0 - h, aw, alto, tono(color, 0.94));
    p(ax + 2, y0 - h + 3, aw - 6, alto - 6, tono(color, 1.22));
    p(ax + 5, y0 - h + 6, aw - 12, alto - 12, tono(color, 1.1));
    p(ax + aw - 4, y0 - h, 4, alto, tono(color, 0.74));      // el filo de adelante
    for (let i = 0; i < 2; i++) {
      p(ax + 9 + i * 13, y0 - h + 8, 2, 3, tono(color, 0.52));
      p(ax + 9 + i * 13, y1 - h - 11, 2, 3, tono(color, 0.52));
    }
    p(ax, y1 - h, aw, h, tono(color, 0.58));                 // la cara del almohadón
    p(ax, y1 - h, aw, 2, tono(color, 0.76));
    // Las patas, abajo de todo: sin ellas el asiento flota sobre las tablas.
    p(ax + 2, y1 - 4, 4, 4, tono(color, 0.38));
    p(ax + aw - 6, y1 - 4, 4, 4, tono(color, 0.38));

    // EL CUERO PELADO, y no en todos: uno usado entre varios sanos dice "acá
    // viaja gente"; todos pelados igual sería una textura y nada más.
    if (s % 3 === 0) p(ax + 6 + (s % 3) * 6, y0 - h + 12, 9, 5, tono(color, 0.88));

    return c;
  });
}
/**
 * LA CAMA: la litera del vagón de observación, el camarote del dormitorio y el
 * catre del vagón de guardias.
 *
 * NO ES UN ASIENTO Y NO TIENE QUE PARECERLO. *(Santi: "reacomodá todos los
 * asientos")* — pero de los cinco vagones con casillas 'S', sólo el de
 * pasajeros y el de primera clase tienen asientos de verdad; los otros tres
 * tienen gente durmiendo, y el diseño de cada uno ya lo decía ("dos literas",
 * "camarotes", "mesas de cartas y catres"). Una cama es BAJA y LARGA, con la
 * almohada en la cabecera: si le dibujáramos respaldo sería un asiento raro.
 *
 * La almohada va en la punta que no tiene otra cama a la izquierda: así una
 * cama de dos o tres baldosas tiene una sola cabecera y no tres.
 */
export function piezaCama(madera, altoPuntos, lados = {}, variante) {
  const h = Math.round(altoPuntos);
  const izq = !!lados.izq, der = !!lados.der;
  const clave = `cama|${madera}|${h}|${izq ? 1 : 0}${der ? 1 : 0}|${variante}`;
  return armar(clave, () => {
    const { c, p } = lienzo(T, T + h);
    const s = sorteo(variante, 0, 404);
    const LINO = '#b9ae96', LINO_L = '#d2c8b2', LINO_S = '#8e836e';
    const MANTA = '#6a5a48', MANTA_L = '#86745c';
    const y0 = 5, y1 = T - 5, alto = y1 - y0;      // metida para adentro
    const x0 = izq ? 0 : 3, x1 = der ? T : T - 3;

    p(x0, y0 - h - 2, x1 - x0, alto + h + 4, NEGRO);

    // EL ARMAZÓN de madera, y encima el colchón.
    p(x0, y0 - h, x1 - x0, alto, tono(madera, 0.62));
    p(x0 + 2, y0 - h + 2, x1 - x0 - 4, alto - 4, LINO);
    p(x0 + 2, y0 - h + 2, x1 - x0 - 4, 2, LINO_L);
    p(x0 + 2, y1 - h - 4, x1 - x0 - 4, 2, LINO_S);

    // LA MANTA, doblada sobre la mitad de los pies.
    const mx = izq ? x0 + 2 : x0 + 22;
    p(mx, y0 - h + 2, x1 - mx - 2, alto - 4, MANTA);
    p(mx, y0 - h + 2, x1 - mx - 2, 2, MANTA_L);
    p(mx, y0 - h + 4, 2, alto - 8, MANTA_L);
    for (let i = 0; i < 3; i++) p(mx + 6 + i * 9, y0 - h + 8, 1, alto - 14, tono(MANTA, 0.84));

    // LA ALMOHADA, en la cabecera.
    if (!izq) {
      p(x0 + 4, y0 - h + 5, 15, alto - 12, LINO_L);
      p(x0 + 4, y0 - h + 5, 15, 2, '#e4dcc8');
      p(x0 + 4, y1 - h - 9, 15, 2, LINO_S);
    }

    // La cara de adelante y las patas.
    p(x0, y1 - h, x1 - x0, h, tono(madera, 0.5));
    p(x0, y1 - h, x1 - x0, 2, tono(madera, 0.66));
    p(x0 + 2, y1 - 4, 4, 4, tono(madera, 0.36));
    p(x1 - 6, y1 - 4, 4, 4, tono(madera, 0.36));

    if (s % 3 === 0) p(x0 + 8, y0 - h + 6, 8, 3, LINO_S);   // una arruga
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

// ------------------------------------------------------------- las puertas

/**
 * LA PUERTA DE UN ENGANCHE, parada cruzada sobre la pasarela.
 *
 * *(Santi, después de jugarlo: "se debería mejorar el cómo se ve las puertas
 * entre los enganches")*. Eran un rectángulo de un color con una raya al medio.
 *
 * SON DOS HOJAS, porque el hueco mide tres personas de ancho: madera con sus
 * tablas y su cruz de San Andrés, o chapa con remaches si es la blindada del
 * vagón blindado. Y ABIERTA NO SE DESTIÑE: las hojas se pliegan contra las
 * paredes y el paso queda libre de verdad. Antes la puerta abierta era la misma
 * puerta a medio borrar, y en pleno tiroteo no se distinguía de una cerrada.
 */
export function piezaPuerta(kind, color, abierta) {
  const anchoU = 16, altoU = 32;                 // lo que ocupa la puerta
  const W = anchoU * U, H = altoU * U;           // en puntos: 64 x 128
  return armar(`puerta|${kind}|${color}|${abierta ? 1 : 0}`, () => {
    const { c, p } = lienzo(W, H);
    const chapa = kind === 'blindada';
    // 🔻 LA MADERA VA MÁS CLARA QUE LA PARED. Con el color de la pared la
    // puerta quedaba casi negra contra el enganche, que ya es oscuro: no se
    // veía que había una puerta hasta que chocabas con ella.
    const base = chapa ? color : tono(color, 1.7);
    const marco = tono(base, chapa ? 1.1 : 0.72);

    /** Una hoja, de `y0` a `y1`. */
    const hoja = (y0, y1) => {
      const alto = y1 - y0;
      p(0, y0, W, alto, NEGRO);                            // la orilla
      p(2, y0 + 2, W - 4, alto - 4, marco);                // el marco
      const ix = 7, iy = y0 + 7, iw = W - 14, ih = alto - 14;
      if (ih <= 0) return;
      if (chapa) {
        // CHAPA: una plancha con sus remaches. Nada de tablas: el vagón
        // blindado no se abre a los tiros y tiene que verse que es de hierro.
        p(ix, iy, iw, ih, tono(base, 0.92));
        p(ix, iy, iw, 2, tono(base, 1.3));
        p(ix, iy + ih - 2, iw, 2, tono(base, 0.7));
        for (let j = 0; j < Math.floor(ih / 10); j++) {
          p(ix + 2, iy + 4 + j * 10, 2, 2, tono(base, 1.45));
          p(ix + iw - 4, iy + 4 + j * 10, 2, 2, tono(base, 1.45));
        }
      } else {
        // MADERA: tablas a lo largo de la hoja y la cruz que las amarra.
        p(ix, iy, iw, ih, base);
        for (let j = 0; j * 14 < ih; j++) {
          const ty = iy + j * 14;
          const alt = Math.min(14, iy + ih - ty);
          p(ix, ty, iw, alt, tono(base, 0.95 + (j % 3) * 0.06));
          p(ix, ty, iw, 1, tono(base, 1.22));
          p(ix, ty + alt - 1, iw, 1, tono(base, 0.66));
        }
        // La cruz de San Andrés, escalonada: es lo que dice "esto es una hoja
        // de puerta" y no un pedazo de pared.
        const pasos = Math.max(1, ih - 6);
        for (let k = 0; k < pasos; k++) {
          const dx = Math.round((k / pasos) * (iw - 8));
          p(ix + dx, iy + 3 + k, 5, 1, tono(base, 0.6));
          p(ix + iw - 5 - dx, iy + 3 + k, 5, 1, tono(base, 0.6));
        }
      }
    };

    if (abierta) {
      // Plegadas contra las paredes: queda libre todo el medio.
      hoja(0, 22);
      hoja(H - 22, H);
      return c;
    }

    hoja(0, Math.round(H / 2));
    hoja(Math.round(H / 2), H);
    // Los picaportes, donde se juntan las dos hojas.
    const mitad = Math.round(H / 2);
    p(W - 22, mitad - 9, 5, 6, tono(base, chapa ? 1.6 : 1.5));
    p(W - 22, mitad + 3, 5, 6, tono(base, chapa ? 1.6 : 1.5));
    if (chapa) {
      // El volante de la blindada: la cerradura que sólo abre la dinamita.
      const cx = Math.round(W / 2) - 1, cy = mitad - 1;
      p(cx - 9, cy - 1, 19, 3, tono(base, 1.5));
      p(cx - 1, cy - 9, 3, 19, tono(base, 1.5));
      p(cx - 4, cy - 4, 9, 9, tono(base, 1.2));
      p(cx - 2, cy - 2, 5, 5, tono(base, 0.7));
    }
    return c;
  });
}

/**
 * LA TRANCA de una puerta trabada: un tablón clavado en diagonal, en el rojo
 * que el juego usa para "esto ya no es gratis". Tiene que leerse de lejos: es
 * la diferencia entre "la empujo y listo" y "la tengo que romper a tiros".
 */
export function piezaTranca(rojo) {
  const W = 16 * U, H = 32 * U;
  return armar(`tranca|${rojo}`, () => {
    const { c, p } = lienzo(W, H);
    const pasos = H - 40;
    for (let k = 0; k < pasos; k++) {
      const x = 6 + Math.round((k / pasos) * (W - 20));
      p(x, 20 + k, 14, 1, NEGRO);
      p(x + 1, 20 + k, 12, 1, rojo);
    }
    // Los clavos de las dos puntas.
    p(6, 22, 6, 5, tono(rojo, 0.55));
    p(W - 14, H - 27, 6, 5, tono(rojo, 0.55));
    return c;
  });
}
