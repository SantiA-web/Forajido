/**
 * EL TREN DEL GALOPE, EN TRES CUARTOS — el que se ve desde el caballo.
 *
 * *(Santi: "en la cabalgata el tren se debería ver como se ve un tren desde
 * afuera. Se ve muy feo que se vea el interior del tren cuando el jugador
 * todavía ni entró")*
 *
 * 🔁 PRIMERO SE HIZO DE COSTADO, Y ESTABA MAL *(Santi: "El galope lo hiciste
 * como si fuera plano o una vista de costado. Recuerda que tiene que ser 3/4,
 * es decir que se debería ver parte del techo del tren, parte del lomo del
 * caballo y el ala del sombrero")*. Todo el juego va en tres cuartos: la
 * cámara está alta y mira en diagonal hacia abajo, así que de un vagón se ve la
 * pared de este lado Y la tapa del techo. Los vagones abiertos muestran lo que
 * llevan, visto desde arriba.
 *
 * LA REGLA DE LAS DOS CARAS, igual que en el asalto (`CONFIG.tresCuartos`): lo
 * vertical se pinta con su alto (la pared, la caja, un domo) y lo horizontal se
 * pinta como una FRANJA ENCIMA (la tapa del techo, el piso de la plataforma, el
 * carbón). La franja es corta a propósito: es la profundidad del vagón, vista
 * de muy de costado.
 *
 * ES SÓLO DIBUJO. Lee los tramos del tren armado (`train.tramos`) y los pinta
 * en su lugar, apoyados sobre la vía en `base`. No toca la grilla, los choques
 * ni nada que el galope use para decidir.
 *
 * Las medidas van EN ALTO SOBRE LA VÍA: `pieza(k, x, y, w, h)` pinta un
 * rectángulo cuyo borde de ABAJO queda `y` px por encima de la vía.
 */

import { CONFIG } from '../data/config.js';
import { APROXIMACION } from '../data/horse.js';

/**
 * Las medidas del vagón, en px.
 *
 * `caja` 48 la eligió Santi sobre una imagen con 32, 48 y 64 (con 32 el vagón
 * era una tira). `tapa` es la profundidad del techo vista desde la cámara: un
 * cuarto de la pared más o menos, como en la imagen de referencia que pasó.
 */
export const MEDIDAS = {
  bastidor: 12,
  caja: 48,
  /** El borde del techo que se ve de frente, antes de la tapa. */
  alero: 3,
  tapa: 14,
};
const M = MEDIDAS;
const ARRIBA_DE_LA_CAJA = M.bastidor + M.caja;

/** Los costados de la góndola: más bajos que un vagón, con el carbón asomando. */
const LADO_GONDOLA = 28;

/** La chapa de paso del enganche: su frente y su tapa. */
const PLACA = { frente: 2, tapa: 8 };

/** Dónde caés si saltás a un techo: a la mitad de la tapa. */
export const ALTO_DEL_TECHO = ARRIBA_DE_LA_CAJA + M.alero + M.tapa / 2;

/** Dónde caés si saltás a un enganche: a la mitad de la chapa. */
export const ALTO_DEL_ENGANCHE = M.bastidor + PLACA.frente + PLACA.tapa / 2;

/**
 * Dónde van las ventanillas de los coches, dentro de la pared. Las comparten el
 * dibujo del vagón y el galope (el fogonazo del que te va a tirar sale de ahí).
 */
const VENTANILLA = { desde: 20, alto: 14 };

/** A qué altura sobre la vía queda el CENTRO de una ventanilla. */
export const ALTURA_VENTANILLA = M.bastidor + VENTANILLA.desde + VENTANILLA.alto / 2;

/** A qué altura cae el que salta arriba de este vagón: la góndola es más baja. */
export function alturaDeAterrizaje(vagon) {
  if (vagon && vagon.carbon) return M.bastidor + LADO_GONDOLA + M.tapa / 2;
  return ALTO_DEL_TECHO;
}

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
export function dibujarTrenTresCuartos(r, train, base, camX, anchoVista, opciones = {}) {
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

/**
 * EL TECHO EN TRES CUARTOS: la sombra que tira sobre la pared, el alero que se
 * ve de frente y la TAPA, que es lo que la cámara alta ve de arriba. Encima de
 * la tapa, lo que tenga cada vagón:
 *
 *   linterna   la sobreelevación de los coches de gente, con sus ventilaciones
 *   pasarela   las tablas por donde caminan los guardafrenos, en los furgones
 *   escotilla  la tapa blindada, con remaches
 */
function techo(k, x0, ancho, detalle) {
  const { r, c, P } = k;
  const y = ARRIBA_DE_LA_CAJA;
  r.ctx.globalAlpha = 0.28;
  pieza(k, x0 + 2, y - 3, ancho - 4, 3, '#000');
  r.ctx.globalAlpha = 1;
  pieza(k, x0, y, ancho, M.alero, c(P.techo));
  pieza(k, x0 + 1, y + M.alero, ancho - 2, M.tapa, c(P.tapa));
  pieza(k, x0 + 1, y + M.alero + M.tapa - 1, ancho - 2, 1, c(P.tapaLuz));

  const yt = y + M.alero;
  if (detalle === 'linterna' && ancho > 40) {
    pieza(k, x0 + 14, yt + 4, ancho - 28, 3, c(P.techo));
    pieza(k, x0 + 14, yt + 7, ancho - 28, 4, c(P.tapaLuz));
    for (let vx = x0 + 22; vx < x0 + ancho - 20; vx += 24) pieza(k, vx, yt + 4, 3, 2, c(P.marco));
  } else if (detalle === 'pasarela') {
    pieza(k, x0 + 2, yt + 5, ancho - 4, 4, c(P.pasarela));
    for (let px = x0 + 6; px < x0 + ancho - 2; px += 6) pieza(k, px, yt + 5, 1, 4, c(escalarColor(P.pasarela, 0.7)));
  } else if (detalle === 'escotilla') {
    const cx = x0 + ancho / 2;
    pieza(k, cx - 9, yt + 4, 18, 2, c(P.remache));
    pieza(k, cx - 9, yt + 6, 18, 5, c(escalarColor(P.blindado, 1.2)));
    for (let rx = x0 + 6; rx < x0 + ancho - 4; rx += 8) pieza(k, rx, yt + 2, 1, 1, c(P.remache));
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
  pieza(k, x0 + 2, M.bastidor - 3, ancho - 4, 3, c(P.bastidor));

  const y0 = M.bastidor;
  const alto = M.caja;
  const vy = y0 + VENTANILLA.desde;

  switch (familiaDe(p)) {
    case 'coche': {
      /**
       * LOS COCHES DE GENTE: caja barnizada, una hilera de ventanillas, las dos
       * puertas de las puntas y la linterna en el techo. Es el vagón que más se
       * repite en el tren de pasajeros, así que es el que tiene que leerse
       * primero como "acá viaja gente, y esa gente te puede ver".
       */
      const caja = P.coche[p.id] || P.coche.pasajeros;
      pieza(k, x0 + 2, y0, ancho - 4, alto, c(caja));
      pieza(k, x0 + 2, y0 + 4, ancho - 4, 1, c(escalarColor(caja, 0.7)));
      pieza(k, x0 + 5, y0 + 2, 10, alto - 8, c(escalarColor(caja, 0.62)));
      pieza(k, x0 + ancho - 15, y0 + 2, 10, alto - 8, c(escalarColor(caja, 0.62)));
      for (let wx = x0 + 22; wx + 9 <= x0 + ancho - 20; wx += 14) ventanilla(k, wx, vy, 9, VENTANILLA.alto);
      if (p.id === 'primeraClase') pieza(k, x0 + 2, y0 + 15, ancho - 4, 1, c(P.filete));
      techo(k, x0, ancho, 'linterna');
      break;
    }

    case 'blindado': {
      // Chapa y remaches, sin una sola ventanilla: desde afuera no te ve nadie,
      // y el dibujo lo dice antes que la regla (ver `tieneVentanillas`).
      pieza(k, x0 + 2, y0, ancho - 4, alto, c(P.blindado));
      for (let rx = x0 + 6; rx < x0 + ancho - 4; rx += 6) {
        pieza(k, rx, y0 + alto - 5, 1, 1, c(P.remache));
        pieza(k, rx, y0 + 4, 1, 1, c(P.remache));
      }
      for (let sx = x0 + 22; sx + 6 < x0 + ancho - 20; sx += 26) pieza(k, sx, y0 + 30, 7, 2, c(P.remache));
      const cx = x0 + ancho / 2;
      pieza(k, cx - 14, y0 + 3, 28, alto - 9, c(escalarColor(P.blindado, 0.8)));
      pieza(k, cx - 1, y0 + 3, 2, alto - 9, c(P.remache));
      techo(k, x0, ancho, 'escotilla');
      break;
    }

    case 'caboose': {
      // El cabús: rojo, dos ventanillas y la garita arriba, apoyada a media
      // tapa, desde donde la tripulación mira el tren entero.
      pieza(k, x0 + 2, y0, ancho - 4, alto, c(P.caboose));
      ventanilla(k, x0 + 14, vy, 10, VENTANILLA.alto);
      ventanilla(k, x0 + ancho - 24, vy, 10, VENTANILLA.alto);
      pieza(k, x0 + ancho / 2 - 7, y0 + 2, 14, alto - 8, c(escalarColor(P.caboose, 0.62)));
      techo(k, x0, ancho, null);
      const gx = x0 + ancho / 2 - 16;
      const gy = ARRIBA_DE_LA_CAJA + M.alero + 4;
      pieza(k, gx, gy, 32, 12, c(P.caboose));
      ventanilla(k, gx + 5, gy + 3, 7, 6);
      ventanilla(k, gx + 20, gy + 3, 7, 6);
      pieza(k, gx - 2, gy + 12, 36, 2, c(P.techo));
      pieza(k, gx - 1, gy + 14, 34, 7, c(P.tapa));
      break;
    }

    case 'ganado': {
      /**
       * EL DE GANADO VA ABIERTO, Y DESDE ARRIBA SE VEN LAS VACAS: el lomo de
       * cada una asoma por encima de las tablas de este lado, y más atrás está
       * la baranda del otro costado. No hay tapa de techo — hay aire.
       */
      pieza(k, x0 + 2, y0, ancho - 4, alto + M.tapa, c(escalarColor(P.ganado, 0.35)));
      for (let bx = x0 + 8, i = 0; bx + 20 < x0 + ancho - 6; bx += 24, i++) {
        const cabeceo = Math.round(Math.sin(k.t * 1.4 + i * 1.9));
        const pelo = i % 3 === 1 ? P.vacaClara : P.vaca;
        const fondo = (i % 2) * 4;   // unas más hacia el otro costado que otras
        pieza(k, bx, y0 + alto - 8 + fondo, 20, 14, c(pelo));
        pieza(k, bx + 2, y0 + alto + 4 + fondo, 16, 2, c(escalarColor(pelo, 1.25)));
        pieza(k, bx + (i % 2 ? -4 : 19), y0 + alto - 2 + fondo + cabeceo, 6, 7, c(pelo));
      }
      // La baranda del otro costado, al fondo de la tapa.
      pieza(k, x0 + 2, y0 + alto + M.tapa - 3, ancho - 4, 3, c(P.ganado));
      // Las tablas de este lado, que tapan las patas.
      for (let ty = y0 + 3; ty < y0 + alto - 2; ty += 8) {
        pieza(k, x0 + 2, ty, ancho - 4, 3, c(P.ganado));
        pieza(k, x0 + 2, ty + 2, ancho - 4, 1, c(escalarColor(P.ganado, 1.25)));
      }
      for (let px = x0 + 2; px < x0 + ancho - 2; px += 16) pieza(k, px, y0, 3, alto, c(escalarColor(P.ganado, 0.8)));
      pieza(k, x0 + ancho - 5, y0, 3, alto, c(escalarColor(P.ganado, 0.8)));
      pieza(k, x0 + 2, y0 + alto - 2, ancho - 4, 2, c(escalarColor(P.ganado, 1.3)));
      break;
    }

    case 'plataforma': {
      // Chata: el piso visto desde arriba y la carga amarrada, con su tapa.
      pieza(k, x0 + 2, y0, ancho - 4, 4, c(P.plataforma));
      pieza(k, x0 + 2, y0 + 4, ancho - 4, M.tapa, c(escalarColor(P.plataforma, 1.25)));
      for (let ty = y0 + 7; ty < y0 + 4 + M.tapa; ty += 4) pieza(k, x0 + 2, ty, ancho - 4, 1, c(P.plataforma));
      const [carga, cargaLuz] = CONFIG.colors.cargo.plataforma;
      for (let bx = x0 + 10, i = 0; bx + 26 < x0 + ancho - 8; bx += 34, i++) {
        const h = 12 + (i % 3) * 6;
        const by = y0 + 7;
        pieza(k, bx, by, 26, h, c(carga));
        pieza(k, bx, by + h, 26, 7, c(cargaLuz));
        pieza(k, bx + 12, by, 2, h + 7, c(P.bastidor));
      }
      for (const sx of [x0 + 4, x0 + ancho - 7]) pieza(k, sx, y0 + 4, 3, 12, c(P.plataforma));
      break;
    }

    case 'gondola': {
      /**
       * LA GÓNDOLA: costados bajos de chapa y, desde arriba, la boca entera
       * llena de carbón hasta el tope. Es lo que hace creíble que arriba se
       * camine sobre el carbón.
       */
      const L = CONFIG.colors.locomotora;
      const lado = LADO_GONDOLA;
      pieza(k, x0 + 3, y0 + lado, ancho - 6, M.tapa, c(L.carbon));
      for (let i = 0; i < ancho / 5; i++) {
        pieza(k, x0 + 5 + ((i * 37) % (ancho - 12)), y0 + lado + 2 + ((i * 5) % (M.tapa - 4)), 2, 1, c(L.carbonLuz));
      }
      pieza(k, x0 + 2, y0 + lado + M.tapa - 1, ancho - 4, 1, c(escalarColor(P.gondola, 1.5)));
      // El montón asoma por encima del borde de allá.
      for (let sx = x0 + 4, i = 0; sx < x0 + ancho - 4; sx += 3, i++) {
        const h = 2 + Math.round(Math.sin(i * 0.33) * 1.5 + Math.sin(i * 1.1));
        if (h > 0) pieza(k, sx, y0 + lado + M.tapa, 3, h, c(L.carbon));
      }
      pieza(k, x0 + 2, y0, ancho - 4, lado, c(P.gondola));
      pieza(k, x0 + 2, y0 + lado - 2, ancho - 4, 2, c(escalarColor(P.gondola, 1.5)));
      for (let rx = x0 + 10; rx < x0 + ancho - 6; rx += 14) pieza(k, rx, y0, 2, lado, c(escalarColor(P.gondola, 1.3)));
      break;
    }

    case 'refrigerado': {
      // Casi blanco, con una puerta pesada y las bocas del hielo en el techo.
      pieza(k, x0 + 2, y0, ancho - 4, alto, c(P.refrigerado));
      for (let px = x0 + 7; px < x0 + ancho - 4; px += 6) pieza(k, px, y0 + 1, 1, alto - 2, c(escalarColor(P.refrigerado, 0.86)));
      const cx = x0 + ancho / 2;
      pieza(k, cx - 13, y0 + 2, 26, alto - 8, c(escalarColor(P.refrigerado, 0.72)));
      pieza(k, cx + 7, y0 + 20, 4, 3, c(P.remache));
      techo(k, x0, ancho, null);
      const yt = ARRIBA_DE_LA_CAJA + M.alero;
      for (const hx of [x0 + 10, x0 + ancho - 22]) {
        pieza(k, hx, yt + 4, 12, 2, c(P.techo));
        pieza(k, hx, yt + 6, 12, 4, c(P.tapaLuz));
      }
      break;
    }

    default: {
      /**
       * LOS FURGONES (correo, almacén, armas, guardias…): tablas verticales, la
       * puerta corrediza en el medio y la pasarela en el techo. Si la plantilla
       * lleva ventanillas, un par chiquitas y altas — hay gente adentro.
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
      techo(k, x0, ancho, 'pasarela');
    }
  }
}

/**
 * EL ENGANCHE: la barra de tiro y la chapa de paso, con su tapa. Por acá se ve
 * el desierto del otro lado, y es a donde saltás.
 */
function dibujarEnganche(k, x0, ancho) {
  const { c, P } = k;
  pieza(k, x0 - 3, M.bastidor - 3, ancho + 6, 2, c(P.bastidor));
  pieza(k, x0 + ancho / 2 - 3, M.bastidor - 5, 6, 6, c(P.ruedas));
  pieza(k, x0 - 2, M.bastidor, ancho + 4, PLACA.frente, c(escalarColor(P.bastidor, 1.6)));
  pieza(k, x0 - 2, M.bastidor + PLACA.frente, ancho + 4, PLACA.tapa, c(escalarColor(P.bastidor, 2.4)));
  pieza(k, x0 + ancho / 2 - 1, M.bastidor + PLACA.frente, 2, PLACA.tapa, c(P.bastidor));
}

/**
 * LA COLA: la plataforma abierta del último vagón, con su piso visto de arriba
 * y sus dos barandas, la de este lado y la del otro.
 */
function dibujarCola(k, x0, ancho) {
  const { c, P } = k;
  const piso = M.bastidor + PLACA.frente;
  pieza(k, x0 + 4, M.bastidor - 3, ancho - 4, 3, c(P.bastidor));
  rueda(k, x0 + ancho - 10, 5);
  pieza(k, x0 + 4, M.bastidor, ancho - 4, PLACA.frente, c(escalarColor(P.bastidor, 1.6)));
  pieza(k, x0 + 4, piso, ancho - 4, PLACA.tapa, c(escalarColor(P.bastidor, 2.4)));
  pieza(k, x0 + 4, piso + PLACA.tapa + 12, ancho - 4, 1, c(P.techoLuz));           // la de allá
  for (let px = x0 + 5; px < x0 + ancho; px += 8) pieza(k, px, piso, 2, 18, c(P.techoLuz));
  pieza(k, x0 + 4, piso + 16, ancho - 4, 2, c(P.techoLuz));                         // la de acá
  pieza(k, x0 + 4, piso + 20, 4, 4, k.noche ? '#ff5a3a' : '#b8452f');                // el farol rojo
}

/**
 * LA LOCOMOTORA, apuntando a la derecha. De atrás para adelante: el ténder
 * con su carbón visto desde arriba, la cabina con su techo, la caldera —un
 * cilindro, así que se le ve el lomo con luz—, los domos, la chimenea con su
 * boca negra, el faro y el miriñaque. Tres ruedas motrices con su biela y el
 * humo yéndose para atrás.
 *
 * A lo largo usa las mismas posiciones que la de arriba (`drawLocomotora` en
 * world/train.js), así que ocupa exactamente su tramo. A lo alto se dibujó
 * para un techo de 49 px y se ESTIRA con `f`, o quedaba más baja que los
 * vagones. Las tapas y las ruedas no se estiran.
 */
function dibujarLocomotora(k, x0) {
  const { r, base, t, c } = k;
  const L = CONFIG.colors.locomotora;
  const P = k.P;
  const f = (ARRIBA_DE_LA_CAJA + 5) / 49;
  const s = (v) => Math.round(v * f);
  const p = (x, y, w, h, color) => pieza(k, x0 + x, s(y), w, Math.max(1, s(h)), c(color));
  const q = (x, y, w, h, color) => pieza(k, x0 + x, y, w, h, c(color));   // sin estirar

  p(0, 9, 12, 3, L.hierroBorde);

  // --- El ténder: el frente y el carbón visto de arriba ---
  p(10, 9, 140, 4, L.hierroBorde);
  p(12, 13, 136, 26, L.hierro);
  p(12, 13, 136, 1, L.rojo);
  const yt = s(39);
  q(12, yt - 2, 136, 2, L.rojo);
  q(12, yt, 136, M.tapa, L.carbon);
  for (let i = 0; i < 40; i++) q(14 + ((i * 37) % 130), yt + 2 + ((i * 5) % (M.tapa - 4)), 3, 2, L.carbonLuz);
  for (let i = 0; i < 34; i++) q(16 + i * 4, yt + M.tapa, 4, 1 + ((i * 5) % 3), L.carbon);
  for (const rx of [30, 48, 112, 130]) rueda(k, x0 + rx, 5);

  // --- La cabina ---
  p(150, 9, 10, 3, L.hierroBorde);
  p(160, 13, 78, 38, L.hierro);
  p(160, 13, 78, 2, L.rojo);
  p(175, 30, 22, 14, P.marco);
  pieza(k, x0 + 177, s(32), 18, s(10), k.vidrio);
  const yc = s(51);
  q(155, yc, 88, 3, L.techoCabina);
  q(156, yc + 3, 86, M.tapa, L.techoLuz);
  q(156, yc + 2 + M.tapa, 86, 1, escalarColor(L.techoLuz, 1.25));
  rueda(k, x0 + 206, 6);

  // --- Estribo y caldera: el frente en sombra y el lomo con luz ---
  p(238, 13, 190, 2, L.hierroBorde);
  p(238, 15, 190, 1, L.rojo);
  p(238, 16, 172, 28, L.hierro);
  p(238, 16, 172, 5, L.hierroBorde);
  const yl = s(44);
  q(238, yl, 172, 8, L.hierroLuz);
  q(238, yl + 8, 172, 2, L.hierro);
  for (const bx of [262, 318, 374]) {
    p(bx, 16, 3, 28, L.hierroBorde);
    q(bx, yl, 3, 10, L.hierroBorde);
  }
  q(278, yl + 3, 8, 5, L.laton);               // la campana
  q(279, yl + 8, 6, 2, L.latonLuz);
  q(310, yl + 2, 24, 8, L.laton);              // el domo de vapor
  q(313, yl + 10, 18, 3, L.latonLuz);
  q(346, yl + 2, 18, 6, L.hierroLuz);          // el de arena
  q(348, yl + 8, 14, 2, escalarColor(L.hierroLuz, 1.3));

  // --- Caja de humo, chimenea con su boca, y faro ---
  p(410, 14, 28, 32, L.hierroBorde);
  q(410, yl, 28, 10, L.hierro);
  const ych = yl + 6;
  const cano = s(16);
  q(413, ych, 12, cano, L.hierroBorde);
  q(409, ych + cano, 20, 4, L.hierro);
  q(409, ych + cano + 4, 20, 5, L.hierroLuz);
  pieza(k, x0 + 412, ych + cano + 5, 14, 3, '#0a090b');
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

  // --- El humo, saliendo de la boca y yéndose para atrás ---
  const boca = ych + cano + 9;
  for (let i = 0; i < 8; i++) {
    const edad = (t * 0.9 + i / 8) % 1;
    r.ctx.save();
    r.ctx.globalAlpha = 0.42 * (1 - edad);
    circulo(r, x0 + 419 - edad * 160, base - boca - 4 - edad * 34 + Math.sin(i * 1.7 + t) * 3,
      5 + edad * 15, c(L.humo));
    r.ctx.restore();
  }
}
