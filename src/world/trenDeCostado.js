/**
 * EL TREN VISTO DE COSTADO — el que se ve desde el caballo.
 *
 * *(Santi: "en la cabalgata el tren se debería ver como se ve un tren desde
 * afuera. Se ve muy feo que se vea el interior del tren cuando el jugador
 * todavía ni entró")*
 *
 * Hasta acá el galope dibujaba el MISMO tren que el asalto, visto desde arriba
 * con los asientos y la carga a la vista. Ahora el galope tiene cámara baja, y
 * lo que se ve de un tren desde el desierto es su costado: ruedas, bastidor, la
 * caja con ventanillas o puertas, y el techo.
 *
 * ES SÓLO DIBUJO. Lee los tramos del tren armado (`train.tramos`: dónde empieza
 * cada vagón, cada enganche y la locomotora) y los pinta en su lugar, apoyados
 * sobre la vía en `base`. No toca la grilla, los choques ni nada que el galope
 * use para decidir: la marca del salto sigue cayendo en el mismo enganche.
 *
 * Las medidas van EN ALTO SOBRE LA VÍA, no en filas de la grilla: la grilla es
 * la planta del vagón (su ancho visto desde arriba), y de costado lo que manda
 * es la altura, que la planta no tiene.
 */

import { CONFIG } from '../data/config.js';
import { APROXIMACION } from '../data/horse.js';

/**
 * Las alturas del costado, en px sobre la vía.
 *
 * 🔺 LA CAJA SUBIÓ DE 32 A 48 *(elegido por Santi sobre una imagen con 32, 48 y
 * 64)*. El largo de un vagón no se puede tocar —es la planta del juego, unos
 * 640 px— y con 32 de alto se leía como una tira. Con 48 se lee como un vagón
 * y pegado al tren siguen quedando ~114 px de cielo (con 32 eran 130; con 64,
 * 98 y las montañas tapadas del todo). El jinete mide el 42% del vagón.
 */
export const COSTADO = {
  /** Ruedas y bastidor: la caja apoya a esta altura. */
  bastidor: 12,
  /** La caja del vagón. */
  caja: 48,
  /** El techo encima de la caja. */
  techo: 5,
};

/** Hasta dónde llega el techo de un vagón: donde caés si saltás arriba. */
export const ALTO_DEL_TECHO = COSTADO.bastidor + COSTADO.caja + COSTADO.techo;

/** Dónde queda el piso de un enganche, para el salto a la plataforma. */
export const ALTO_DEL_ENGANCHE = COSTADO.bastidor + 2;

/**
 * Dónde van las ventanillas de los coches, dentro de la caja. Las comparten el
 * dibujo del vagón y el galope (el fogonazo del que te va a tirar sale de ahí).
 */
const VENTANILLA = { desde: 20, alto: 14 };

/** A qué altura sobre la vía queda el CENTRO de una ventanilla. */
export const ALTURA_VENTANILLA = COSTADO.bastidor + VENTANILLA.desde + VENTANILLA.alto / 2;

/**
 * '#7a3f28' multiplicado por `f` y de vuelta a hex. De noche todo el tren se
 * pinta con esto: es un solo número por color en vez de una paleta nocturna.
 */
export function escalarColor(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}

/**
 * @param base       la línea de la vía, en coordenadas del mundo
 * @param camX       borde izquierdo de lo que se ve, para no pintar de más
 * @param anchoVista cuánto mundo entra a lo ancho (con el zoom, no la pantalla)
 * @param opciones.noche  apaga la caja y prende las ventanillas
 */
export function dibujarTrenDeCostado(r, train, base, camX, anchoVista, opciones = {}) {
  const noche = !!opciones.noche;
  const P = CONFIG.colors.costado;
  const size = train.map.size;
  const k = {
    r, base, P, noche,
    t: (typeof performance !== 'undefined' ? performance.now() : 0) / 1000,
    c: (hex) => (noche ? escalarColor(hex, 0.42) : hex),
    vidrio: noche ? P.vidrioNoche : P.vidrioDia,
  };

  for (const tramo of train.tramos) {
    const x0 = tramo.colStart * size;
    const ancho = tramo.cols * size;
    if (x0 > camX + anchoVista + 90 || x0 + ancho < camX - 90) continue;
    if (tramo.tipo === 'vagon') dibujarVagon(k, tramo.plantilla, x0, ancho);
    else if (tramo.tipo === 'enganche') dibujarEnganche(k, x0, ancho);
    else if (tramo.tipo === 'salida') dibujarCola(k, x0, ancho);
    else if (tramo.tipo === 'locomotora') dibujarLocomotora(k, x0);
  }
}

// ----------------------------------------------------------------- piezas

/** `rect` medido desde la vía: `y` es a qué altura queda su borde de ABAJO. */
function pieza(k, x, y, w, h, color) {
  k.r.rect(x, k.base - y - h, w, h, color);
}

function circulo(r, x, y, radio, color) {
  r.ctx.fillStyle = color;
  r.ctx.beginPath();
  r.ctx.arc(Math.round(x), Math.round(y), radio, 0, Math.PI * 2);
  r.ctx.fill();
}

/**
 * UNA RUEDA, CON UN RAYO QUE GIRA. El rayo es lo que dice que el tren anda:
 * el tren está quieto en pantalla (la cámara lo sigue), así que sin algo que
 * gire se vería estacionado. Gira a la velocidad real del tren sobre la vía.
 */
function rueda(k, cx, radio) {
  const { r, base, t, c, P } = k;
  const cy = base - radio;
  circulo(r, cx, cy, radio, c(P.ruedas));
  circulo(r, cx, cy, Math.max(1, radio - 2), c(P.ruedaLuz));
  circulo(r, cx, cy, Math.max(1, radio - 3), c(P.ruedas));
  const a = (t * APROXIMACION.trenVelocidad) / radio;
  r.line(cx, cy, cx + Math.cos(a) * (radio - 1), cy + Math.sin(a) * (radio - 1), c(P.ruedaLuz));
}

/** Un bogie: el carrito de dos ejes que va debajo de cada punta del vagón. */
function bogie(k, cx) {
  pieza(k, cx - 11, 4, 22, 3, k.c(k.P.bastidor));
  rueda(k, cx - 6, 5);
  rueda(k, cx + 6, 5);
}

/** El techo curvo de siempre, con o sin linterna (la sobreelevación de los coches). */
function techo(k, x0, ancho, linterna) {
  const { c, P } = k;
  const y = COSTADO.bastidor + COSTADO.caja;
  pieza(k, x0, y, ancho, COSTADO.techo, c(P.techo));
  pieza(k, x0, y + COSTADO.techo - 1, ancho, 1, c(P.techoLuz));
  if (linterna && ancho > 40) {
    pieza(k, x0 + 14, y + COSTADO.techo, ancho - 28, 3, c(P.techo));
    pieza(k, x0 + 14, y + COSTADO.techo + 2, ancho - 28, 1, c(P.techoLuz));
  }
}

/** Una ventanilla: marco oscuro y vidrio. De día refleja el cielo; de noche está prendida. */
function ventanilla(k, x, y, w, h) {
  pieza(k, x - 1, y - 1, w + 2, h + 2, k.c(k.P.marco));
  pieza(k, x, y, w, h, k.vidrio);
  if (!k.noche) pieza(k, x, y + h - 3, w, 2, escalarColor(k.vidrio, 1.18));
}

// ----------------------------------------------------------------- vagones

/** Qué dibujo le toca a cada plantilla. Lo que no está acá es un furgón. */
function familiaDe(p) {
  if (p.carbon) return 'gondola';
  if (['pasajeros', 'primeraClase', 'dormitorio', 'comedor'].includes(p.id)) return 'coche';
  if (['ganado', 'plataforma', 'blindado', 'caboose', 'refrigerado'].includes(p.id)) return p.id;
  return 'furgon';
}

function dibujarVagon(k, p, x0, ancho) {
  const { c, P } = k;
  bogie(k, x0 + 20);
  bogie(k, x0 + ancho - 20);
  pieza(k, x0 + 2, COSTADO.bastidor - 3, ancho - 4, 3, c(P.bastidor));

  const familia = familiaDe(p);
  const y0 = COSTADO.bastidor;
  const alto = COSTADO.caja;
  const vy = y0 + VENTANILLA.desde;

  switch (familia) {
    case 'coche': {
      /**
       * LOS COCHES DE GENTE: caja barnizada, una hilera de ventanillas, las dos
       * puertas de las puntas y la linterna en el techo. Es el vagón que más se
       * repite en el tren de pasajeros, así que es el que tiene que leerse
       * primero como "acá viaja gente, y esa gente te puede ver".
       */
      const caja = P.coche[p.id] || P.coche.pasajeros;
      pieza(k, x0 + 2, y0, ancho - 4, alto, c(caja));
      pieza(k, x0 + 2, y0 + alto - 2, ancho - 4, 2, c(escalarColor(caja, 1.3)));
      pieza(k, x0 + 2, y0 + 4, ancho - 4, 1, c(escalarColor(caja, 0.7)));
      pieza(k, x0 + 5, y0 + 2, 10, alto - 8, c(escalarColor(caja, 0.62)));
      pieza(k, x0 + ancho - 15, y0 + 2, 10, alto - 8, c(escalarColor(caja, 0.62)));
      for (let wx = x0 + 22; wx + 9 <= x0 + ancho - 20; wx += 14) ventanilla(k, wx, vy, 9, VENTANILLA.alto);
      if (p.id === 'primeraClase') pieza(k, x0 + 2, y0 + 15, ancho - 4, 1, c(P.filete));
      techo(k, x0, ancho, true);
      break;
    }

    case 'blindado': {
      // Chapa y remaches, sin una sola ventanilla: desde afuera no te ve nadie,
      // y el dibujo lo dice antes que la regla (ver `tieneVentanillas`).
      pieza(k, x0 + 2, y0, ancho - 4, alto, c(P.blindado));
      pieza(k, x0 + 2, y0 + alto - 2, ancho - 4, 2, c(escalarColor(P.blindado, 1.3)));
      for (let rx = x0 + 6; rx < x0 + ancho - 4; rx += 6) {
        pieza(k, rx, y0 + alto - 5, 1, 1, c(P.remache));
        pieza(k, rx, y0 + 4, 1, 1, c(P.remache));
      }
      for (let sx = x0 + 22; sx + 6 < x0 + ancho - 20; sx += 26) pieza(k, sx, y0 + 30, 7, 2, c(P.remache));
      const cx = x0 + ancho / 2;
      pieza(k, cx - 14, y0 + 3, 28, alto - 9, c(escalarColor(P.blindado, 0.8)));
      pieza(k, cx - 1, y0 + 3, 2, alto - 9, c(P.remache));
      techo(k, x0, ancho, false);
      break;
    }

    case 'caboose': {
      // El cabús: rojo, dos ventanillas y la garita arriba, desde donde la
      // tripulación mira el tren entero.
      pieza(k, x0 + 2, y0, ancho - 4, alto, c(P.caboose));
      pieza(k, x0 + 2, y0 + alto - 2, ancho - 4, 2, c(escalarColor(P.caboose, 1.3)));
      ventanilla(k, x0 + 14, vy, 10, VENTANILLA.alto);
      ventanilla(k, x0 + ancho - 24, vy, 10, VENTANILLA.alto);
      pieza(k, x0 + ancho / 2 - 7, y0 + 2, 14, alto - 8, c(escalarColor(P.caboose, 0.62)));
      techo(k, x0, ancho, false);
      const gx = x0 + ancho / 2 - 16;
      const gy = y0 + alto + COSTADO.techo;
      pieza(k, gx, gy, 32, 12, c(P.caboose));
      ventanilla(k, gx + 5, gy + 3, 7, 6);
      ventanilla(k, gx + 20, gy + 3, 7, 6);
      pieza(k, gx - 2, gy + 12, 36, 3, c(P.techo));
      break;
    }

    case 'ganado': {
      /**
       * EL DE GANADO VA ABIERTO, Y SE VE LO QUE LLEVA: vacas detrás de las
       * tablas, asomando por las rendijas. Es el vagón sin techo que pisar, y
       * de costado eso se ve — no hay techo, hay aire.
       */
      pieza(k, x0 + 2, y0, ancho - 4, alto, c(escalarColor(P.ganado, 0.35)));
      for (let bx = x0 + 6, i = 0; bx + 22 < x0 + ancho - 4; bx += 26, i++) {
        const cabeceo = Math.round(Math.sin(k.t * 1.4 + i * 1.9));
        const pelo = i % 3 === 1 ? P.vacaClara : P.vaca;
        pieza(k, bx, y0 + 12, 22, 18, c(pelo));
        pieza(k, bx + (i % 2 ? -4 : 20), y0 + 22 + cabeceo, 6, 8, c(pelo));
      }
      for (let ty = y0 + 3; ty < y0 + alto - 2; ty += 8) {
        pieza(k, x0 + 2, ty, ancho - 4, 3, c(P.ganado));
        pieza(k, x0 + 2, ty + 2, ancho - 4, 1, c(escalarColor(P.ganado, 1.25)));
      }
      for (let px = x0 + 2; px < x0 + ancho - 2; px += 16) pieza(k, px, y0, 3, alto, c(escalarColor(P.ganado, 0.8)));
      pieza(k, x0 + ancho - 5, y0, 3, alto, c(escalarColor(P.ganado, 0.8)));
      break;
    }

    case 'plataforma': {
      // Chata: el piso y la carga amarrada encima, a la vista.
      pieza(k, x0 + 2, y0, ancho - 4, 4, c(P.plataforma));
      pieza(k, x0 + 2, y0 + 3, ancho - 4, 1, c(escalarColor(P.plataforma, 1.3)));
      const [carga, cargaLuz] = CONFIG.colors.cargo.plataforma;
      for (let bx = x0 + 10, i = 0; bx + 26 < x0 + ancho - 8; bx += 34, i++) {
        const h = 14 + (i % 3) * 7;
        pieza(k, bx, y0 + 4, 28, h, c(carga));
        pieza(k, bx, y0 + 4 + h - 2, 28, 2, c(cargaLuz));
        k.r.line(bx, k.base - y0 - 4 - h, bx + 28, k.base - y0 - 4, c(P.bastidor));
      }
      for (const sx of [x0 + 4, x0 + ancho - 7]) pieza(k, sx, y0 + 4, 3, 12, c(P.plataforma));
      break;
    }

    case 'gondola': {
      /**
       * LA GÓNDOLA: costados bajos de chapa y el carbón asomando por arriba,
       * hasta el tope. Es lo que hace creíble que arriba se camine sobre el
       * carbón — de costado se ve que está lleno hasta el borde.
       */
      const L = CONFIG.colors.locomotora;
      const lado = 28;
      // El lomo del carbón en ondas suaves: con una altura sorteada por columna
      // se leía como una fila de púas, no como un montón.
      for (let sx = x0 + 4, i = 0; sx < x0 + ancho - 4; sx += 3, i++) {
        const h = 6 + Math.round(Math.sin(i * 0.33) * 2 + Math.sin(i * 1.1));
        pieza(k, sx, y0 + lado, 3, h, c(L.carbon));
        if (i % 3 === 0) pieza(k, sx + 1, y0 + lado + h - 1, 2, 1, c(L.carbonLuz));
      }
      pieza(k, x0 + 2, y0, ancho - 4, lado, c(P.gondola));
      pieza(k, x0 + 2, y0 + lado - 2, ancho - 4, 2, c(escalarColor(P.gondola, 1.5)));
      for (let rx = x0 + 10; rx < x0 + ancho - 6; rx += 14) pieza(k, rx, y0, 2, lado, c(escalarColor(P.gondola, 1.3)));
      break;
    }

    case 'refrigerado': {
      // Casi blanco, con las bocas del hielo en el techo y una puerta pesada.
      pieza(k, x0 + 2, y0, ancho - 4, alto, c(P.refrigerado));
      for (let px = x0 + 7; px < x0 + ancho - 4; px += 6) pieza(k, px, y0 + 1, 1, alto - 2, c(escalarColor(P.refrigerado, 0.86)));
      const cx = x0 + ancho / 2;
      pieza(k, cx - 13, y0 + 2, 26, alto - 8, c(escalarColor(P.refrigerado, 0.72)));
      pieza(k, cx + 7, y0 + 20, 4, 3, c(P.remache));
      techo(k, x0, ancho, false);
      const ty = y0 + alto + COSTADO.techo;
      pieza(k, x0 + 10, ty, 10, 3, c(P.techo));
      pieza(k, x0 + ancho - 20, ty, 10, 3, c(P.techo));
      break;
    }

    default: {
      /**
       * LOS FURGONES (correo, almacén, armas, guardias…): tablas verticales y
       * la puerta corrediza en el medio. Si la plantilla lleva ventanillas, un
       * par chiquitas y altas — hay gente adentro, y te pueden ver.
       */
      const caja = P.furgon[p.id] || P.furgon.default;
      pieza(k, x0 + 2, y0, ancho - 4, alto, c(caja));
      for (let px = x0 + 6; px < x0 + ancho - 4; px += 5) pieza(k, px, y0 + 1, 1, alto - 2, c(escalarColor(caja, 0.8)));
      const cx = x0 + ancho / 2;
      pieza(k, cx - 15, y0 + alto - 3, 30, 2, c(P.bastidor));
      pieza(k, cx - 13, y0 + 2, 26, alto - 7, c(escalarColor(caja, 0.7)));
      k.r.line(cx - 13, k.base - y0 - alto + 5, cx + 12, k.base - y0 - 3, c(escalarColor(caja, 0.9)));
      if (p.layout.some((fila) => fila.includes('W'))) {
        ventanilla(k, x0 + 14, y0 + 32, 8, 7);
        ventanilla(k, x0 + ancho - 22, y0 + 32, 8, 7);
      }
      techo(k, x0, ancho, false);
    }
  }
}

/**
 * EL ENGANCHE: la barra de tiro y la chapa de paso, con aire alrededor. Por
 * acá se ve el llano del fondo, y es a donde saltás.
 */
function dibujarEnganche(k, x0, ancho) {
  const { c, P } = k;
  pieza(k, x0 - 3, COSTADO.bastidor - 3, ancho + 6, 2, c(P.bastidor));
  pieza(k, x0 + ancho / 2 - 3, COSTADO.bastidor - 5, 6, 6, c(P.ruedas));
  pieza(k, x0 - 2, ALTO_DEL_ENGANCHE - 2, ancho + 4, 2, c(escalarColor(P.bastidor, 1.6)));
}

/**
 * LA COLA: la plataforma abierta del último vagón, con su baranda. Es el
 * primer enganche al que llegás, y el único que tiene baranda de fin de tren.
 */
function dibujarCola(k, x0, ancho) {
  const { c, P } = k;
  pieza(k, x0 + 4, COSTADO.bastidor - 3, ancho - 4, 3, c(P.bastidor));
  pieza(k, x0 + 4, ALTO_DEL_ENGANCHE - 2, ancho - 4, 3, c(escalarColor(P.bastidor, 1.6)));
  rueda(k, x0 + ancho - 10, 5);
  const alto = 16;
  for (let px = x0 + 5; px < x0 + ancho; px += 8) pieza(k, px, ALTO_DEL_ENGANCHE + 1, 2, alto, c(P.techoLuz));
  pieza(k, x0 + 4, ALTO_DEL_ENGANCHE + alto, ancho - 4, 2, c(P.techoLuz));
  // El farol rojo de la cola.
  pieza(k, x0 + 4, ALTO_DEL_ENGANCHE + alto + 2, 4, 4, k.noche ? '#ff5a3a' : '#b8452f');
}

/**
 * LA LOCOMOTORA DE COSTADO, apuntando a la derecha. De atrás para adelante:
 * ténder con su carbón, cabina, caldera con domos, chimenea, faro y miriñaque.
 * Tres ruedas motrices grandes con su biela, que es lo que más se mueve en todo
 * el tren, y el humo saliendo para atrás.
 *
 * A lo largo usa las mismas posiciones que la de arriba (`drawLocomotora` en
 * world/train.js), así que ocupa exactamente su tramo. A lo alto se dibujó
 * para un vagón de 49 px de techo y se ESTIRA con `f` al alto de hoy: si no,
 * con la caja de 48 la máquina quedaba más baja que los vagones que arrastra.
 * Las ruedas no se estiran — son redondas.
 */
function dibujarLocomotora(k, x0) {
  const { r, base, t, c } = k;
  const L = CONFIG.colors.locomotora;
  const P = k.P;
  const f = ALTO_DEL_TECHO / 49;
  const s = (v) => Math.round(v * f);
  const p = (x, y, w, h, color) => pieza(k, x0 + x, s(y), w, Math.max(1, s(h)), c(color));

  p(0, 9, 12, 3, L.hierroBorde);

  // --- El ténder ---
  for (let i = 0; i < 34; i++) {
    const h = 3 + ((i * 5) % 4);
    p(16 + i * 4, 38, 4, h, L.carbon);
    p(17 + i * 4, 37 + h, 2, 1, L.carbonLuz);
  }
  p(10, 9, 140, 4, L.hierroBorde);
  p(12, 13, 136, 26, L.hierro);
  p(12, 37, 136, 2, L.rojo);
  p(12, 13, 136, 1, L.rojo);
  for (const rx of [30, 48, 112, 130]) rueda(k, x0 + rx, 5);

  // --- La cabina ---
  p(150, 9, 10, 3, L.hierroBorde);
  p(160, 13, 78, 38, L.hierro);
  p(160, 13, 78, 2, L.rojo);
  p(175, 30, 22, 14, P.marco);
  pieza(k, x0 + 177, s(32), 18, s(10), k.vidrio);
  p(155, 51, 88, 4, L.techoCabina);
  p(155, 54, 88, 1, L.techoLuz);
  rueda(k, x0 + 206, 6);

  // --- Estribo y caldera ---
  p(238, 13, 190, 2, L.hierroBorde);
  p(238, 15, 190, 1, L.rojo);
  p(238, 16, 172, 28, L.hierro);
  p(238, 36, 172, 4, L.hierroLuz);
  p(238, 16, 172, 5, L.hierroBorde);
  for (const bx of [262, 318, 374]) p(bx, 16, 3, 28, L.hierroBorde);
  p(278, 44, 8, 6, L.laton);                 // la campana
  p(310, 44, 24, 6, L.laton);                // el domo de vapor
  p(314, 50, 16, 3, L.laton);
  p(314, 47, 5, 3, L.latonLuz);
  p(346, 44, 18, 5, L.hierroLuz);            // el de arena
  p(349, 49, 12, 2, L.hierroLuz);

  // --- Caja de humo, chimenea y faro ---
  p(410, 14, 28, 32, L.hierroBorde);
  p(413, 46, 12, 16, L.hierroBorde);
  p(408, 62, 22, 5, L.hierro);
  p(438, 32, 14, 13, L.hierroBorde);
  pieza(k, x0 + 445, s(35), 6, s(7), L.faro);
  if (k.noche) {
    r.ctx.save();
    r.ctx.globalAlpha = 0.14;
    r.ctx.fillStyle = L.faro;
    r.ctx.beginPath();
    r.ctx.moveTo(x0 + 451, base - s(38));
    r.ctx.lineTo(x0 + 620, base - s(60));
    r.ctx.lineTo(x0 + 620, base - 6);
    r.ctx.fill();
    r.ctx.restore();
  }

  // --- El cilindro, las ruedas motrices y la biela ---
  p(384, 7, 30, 10, L.hierroLuz);
  for (const rx of [392, 418]) rueda(k, x0 + rx, 5);
  for (const rx of [262, 296, 330]) rueda(k, x0 + rx, 9);
  const a = (t * APROXIMACION.trenVelocidad) / 9;
  const bx = Math.cos(a) * 5;
  const by = Math.sin(a) * 5;
  r.rect(x0 + 262 + bx, base - 9 + by - 1, 68, 2, c(L.hierroLuz));
  r.line(x0 + 330 + bx, base - 9 + by, x0 + 396, base - s(12), c(L.hierroLuz));

  // --- El miriñaque, en punta hacia adelante ---
  for (let i = 0; i < 16; i++) {
    p(452 + i * 2, 1, 2, Math.max(2, 16 - i), i % 2 === 0 ? L.rojo : L.hierroBorde);
  }

  // --- El humo, subiendo y yéndose para atrás ---
  for (let i = 0; i < 8; i++) {
    const edad = (t * 0.9 + i / 8) % 1;
    r.ctx.save();
    r.ctx.globalAlpha = 0.42 * (1 - edad);
    circulo(r, x0 + 419 - edad * 160, base - s(70) - edad * 34 + Math.sin(i * 1.7 + t) * 3,
      5 + edad * 15, c(L.humo));
    r.ctx.restore();
  }
}
