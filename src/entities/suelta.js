/**
 * 🍾 LO QUE RUEDA SUELTO POR EL PISO DEL VAGÓN: botellas y latas.
 *
 * *(Santi, pidiendo el balanceo del tren: "me gustaría que haya un pequeño
 * balanceo en el tren para meter más al jugador en el asalto". Es la pieza 2:
 * la 1 fue la luz de los ventanales.)*
 *
 * SON ADORNO, Y A PROPÓSITO. No lastiman, no frenan, no se juntan y no hacen
 * ruido. Lo que hacen es contar que el vagón se mueve: ruedan para el lado al
 * que se inclina —con el MISMO reloj que la luz de los ventanales, así las dos
 * cosas se mecen juntas— y salen disparadas con el tirón del tren.
 *
 * ⚠️ NO SE PARECEN A LOS BARRILES, y eso es una regla de juego. Los barriles y
 * los cajones que ruedan (`rodante.js`) te lastiman; un adorno que se les
 * pareciera sería una trampa —la lección de los adornos del desierto—. Por eso
 * son chicos (una botella acostada mide 7×16 puntos al lado de una persona de
 * 80), de vidrio o de lata, y por eso quedó afuera el "cajón mal atado" que se
 * había pensado al principio.
 *
 * Este archivo dice QUÉ son y cómo se dibujan; cómo se mueven lo maneja
 * `updateSueltas` en scenes/raidScene.js.
 */

import { pieza, estampar, PUNTO, NEGRO } from '../world/piezas.js';

export const TIPOS_SUELTA = ['botella', 'botella', 'lata'];

/**
 * Acostadas a lo ancho del vagón (el eje, en vertical en la pantalla): por eso
 * ruedan a lo largo, hacia la cola o hacia la locomotora, que es hacia donde
 * el tren se sacude.
 */
export function crearSuelta(x, y, tipo, rng) {
  return {
    x, y,
    vx: 0, vy: 0,
    tipo,
    /** Verde o marrón, la botella; con o sin etiqueta, la lata. */
    variante: rng.int(0, 1),
    /** Cuánto giró sobre sí misma: lo que corre el brillo al rodar. */
    giro: rng.range(0, Math.PI * 2),
    /** Una botella que le pegó una bala queda en vidrios, quieta. */
    rota: false,
  };
}

/** Cuánto mide de radio al rodar, en unidades: una vuelta avanza 2π de esto. */
export const RADIO_SUELTA = { botella: 0.9, lata: 0.9 };

const BOTELLA = [
  { cuerpo: '#2f5b35', sombra: '#1d3a22', brillo: '#9fd0a0', etiqueta: '#c9b98a' },
  { cuerpo: '#5a3518', sombra: '#38200d', brillo: '#d8a268', etiqueta: '#d9d0b8' },
];
const LATA = [
  { cuerpo: '#7d8388', sombra: '#4b5055', brillo: '#d6dade', etiqueta: '#8c3a2a' },
  { cuerpo: '#8a7d5e', sombra: '#554a33', brillo: '#e0d4b0', etiqueta: null },
];

/**
 * Cuatro cuadros de la vuelta: en qué columna cae la raya de brillo (−1 = del
 * otro lado, no se ve).
 */
const BRILLO = [2, 3, 4, -1];

function cuadroDe(s) {
  const vuelta = ((s.giro % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return Math.floor((vuelta / (Math.PI * 2)) * 4) % 4;
}

/**
 * 🔺 MÁS GRANDES QUE DE VERDAD, Y CON BORDE. Del tamaño real —una lata de 5×6
 * puntos al lado de una persona de 80— sobre las tablas se veían como una
 * manchita que no se leía como nada. Van un poco agrandadas, como todo lo que
 * hay que reconocer en este juego, y con el borde oscuro que llevan los demás
 * objetos: a este tamaño, sin borde, se confunden con la veta del piso.
 */
function piezaBotella(variante, cuadro) {
  const c = BOTELLA[variante];
  return pieza(`suelta|botella|${variante}|${cuadro}`, 7, 16, (p) => {
    // La silueta, en oscuro: el cuello, los hombros y el cuerpo.
    p(2, 0, 3, 5, NEGRO);
    p(1, 4, 5, 2, NEGRO);
    p(0, 5, 7, 11, NEGRO);
    // Y adentro, el vidrio.
    p(3, 1, 1, 4, c.cuerpo);
    p(2, 5, 3, 1, c.cuerpo);
    p(1, 6, 5, 9, c.cuerpo);
    p(5, 6, 1, 9, c.sombra);          // el lado sin luz
    p(1, 9, 5, 3, c.etiqueta);        // la etiqueta, que da la vuelta con ella
    const b = BRILLO[cuadro];
    if (b >= 0) {
      p(b, 6, 1, 3, c.brillo);
      p(b, 12, 1, 2, c.brillo);
    }
    if (cuadro < 2) p(3, 1, 1, 2, c.brillo);   // el cuello brilla de un lado
  });
}

function piezaLata(variante, cuadro) {
  const c = LATA[variante];
  return pieza(`suelta|lata|${variante}|${cuadro}`, 7, 8, (p) => {
    p(0, 0, 7, 8, NEGRO);
    p(1, 1, 5, 6, c.cuerpo);
    p(5, 1, 1, 6, c.sombra);
    p(1, 1, 5, 1, c.brillo);          // los dos bordes de la tapa
    p(1, 6, 5, 1, c.sombra);
    if (c.etiqueta) p(1, 3, 5, 2, c.etiqueta);
    const b = BRILLO[cuadro];
    if (b >= 0 && b <= 4) p(b, 2, 1, 4, c.brillo);
  });
}

function piezaVidrios(variante) {
  const c = BOTELLA[variante];
  return pieza(`suelta|vidrios|${variante}`, 9, 5, (p) => {
    p(0, 3, 2, 1, c.cuerpo);
    p(3, 1, 1, 1, c.brillo);
    p(4, 4, 2, 1, c.cuerpo);
    p(6, 2, 1, 1, c.cuerpo);
    p(7, 0, 2, 1, c.sombra);
    p(2, 0, 1, 1, c.cuerpo);
  });
}

export function dibujarSuelta(r, s) {
  const img = s.rota
    ? piezaVidrios(s.variante)
    : s.tipo === 'lata' ? piezaLata(s.variante, cuadroDe(s)) : piezaBotella(s.variante, cuadroDe(s));
  const w = img.width * PUNTO;
  const h = img.height * PUNTO;
  if (!s.rota) {
    // La sombra en las tablas: sin ella parece flotando encima del piso.
    r.ctx.globalAlpha = 0.28;
    r.rect(s.x - w / 2 + 0.25, s.y + h / 2 - 0.25, w, 0.5, '#000');
    r.ctx.globalAlpha = 1;
  }
  estampar(r, img, Math.round((s.x - w / 2) / PUNTO) * PUNTO, Math.round((s.y - h / 2) / PUNTO) * PUNTO);
}

/** El color del vidrio o la lata: para las astillas cuando se rompe. */
export function colorDeSuelta(s) {
  return (s.tipo === 'lata' ? LATA : BOTELLA)[s.variante].cuerpo;
}
