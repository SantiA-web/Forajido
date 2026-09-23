/**
 * A DÓNDE LLEGA LA HUIDA: la quebrada, el vado del río y el bosque de rocas.
 *
 * *(Santi: "me gustaría que podás tomar el camino en algunas ocasiones. O sea,
 * que hayan diferentes caminos para tomar y que sea aleatorio el destino a
 * dónde llegas: puede ser un río, una quebrada o un bosque de rocas. Lo que no
 * me cerraba en la quebrada es que se crea para el jugador, cuando en realidad
 * el jugador debería meterse ahí")*.
 *
 * ESA ES LA IDEA CENTRAL DE ESTE ARCHIVO: **el destino está en el terreno, no
 * alrededor tuyo**. Cada uno es una BARRERA que cruza el campo entero en un
 * punto fijo del camino, con una o dos ENTRADAS a una altura fija. Viene hacia
 * vos porque el mundo desfila; si estás enfrente de una entrada, pasás; si no,
 * te comés la pared y tenés que buscarla con los jinetes encima.
 *
 * La barrera vieja hacía lo contrario —se dibujaba centrada en el jugador— y
 * por eso no se leía como un lugar.
 *
 * ⚠️ DIBUJO SIMPLE (por vestir), pero con volumen: bloques con junta y canto
 * iluminado, agua con orillas y reflejos, y piedras con su sombra.
 */

import { escalarColor } from './trenTresCuartos.js';

/** Cuánto ocupa una barrera a lo largo del camino. */
export const GROSOR = 22;

export const DESTINOS = {
  quebrada: {
    id: 'quebrada',
    nombre: 'LA QUEBRADA',
    /** Lo que se ve venir de lejos, para poder elegir el camino a tiempo. */
    anuncio: 'paredones',
    cartel: '¡ADENTRO DE LA QUEBRADA!',
  },
  rio: {
    id: 'rio',
    nombre: 'EL RÍO',
    anuncio: 'alamos',
    cartel: '¡CRUZASTE EL RÍO!',
  },
  bosque: {
    id: 'bosque',
    nombre: 'EL BOSQUE DE ROCAS',
    anuncio: 'penascos',
    cartel: '¡ADENTRO DEL BOSQUE DE ROCAS!',
  },
};

/**
 * UNA BARRERA, DIBUJADA. `sx` es dónde cae en la pantalla su borde de este
 * lado; `huecos` son las franjas por donde se pasa.
 *
 * Se dibuja de arriba abajo del campo, saltándose los huecos, así que lo que
 * ves es exactamente lo que te frena.
 */
export function dibujarBarrera(r, { tipo, sx, huecos, y0, y1, dia, suelo }) {
  const c = (hex) => (dia ? hex : escalarColor(hex, 0.55));
  const tramos = tramosSinHuecos(y0, y1, huecos);
  for (const [a, b] of tramos) {
    if (tipo === 'rio') agua(r, c, sx, a, b);
    else if (tipo === 'bosque') penascos(r, c, sx, a, b, suelo);
    else roca(r, c, sx, a, b, suelo);
  }
  // El vado del río se ve: agua baja con piedras, no un agujero en el agua.
  if (tipo === 'rio') for (const h of huecos) vado(r, c, sx, h.y0, h.y1);
  // Y las entradas de roca tienen su sombra en el borde.
  if (tipo !== 'rio') for (const h of huecos) bocaDeEntrada(r, c, sx, h.y0, h.y1);
}

/** Lo que queda de [y0, y1] después de sacarle los huecos. */
function tramosSinHuecos(y0, y1, huecos) {
  const orden = [...huecos].sort((a, b) => a.y0 - b.y0);
  const tramos = [];
  let y = y0;
  for (const h of orden) {
    if (h.y0 > y) tramos.push([y, Math.min(h.y0, y1)]);
    y = Math.max(y, h.y1);
  }
  if (y < y1) tramos.push([y, y1]);
  return tramos.filter(([a, b]) => b - a > 1);
}

/**
 * PAREDÓN DE ROCA. Bloques de 16 con su junta, su canto iluminado arriba y la
 * cara de este lado en sombra: es lo que le da espesor a la pared en vez de
 * dejarla como una lámina.
 */
function roca(r, c, sx, y0, y1, suelo) {
  const alto = y1 - y0;
  r.rect(sx, y0, GROSOR, alto, c('#6a5a4a'));
  for (let y = y0; y < y1; y += 16) {
    const h = Math.min(16, y1 - y);
    const s = revolver(Math.round(sx + suelo) * 0 + Math.round(y) * 13);
    const tonos = ['#6f5f4d', '#63543f', '#5a4c3d', '#75664f'];
    r.rect(sx, y, GROSOR, h, c(tonos[s % 4]));
    r.rect(sx, y, GROSOR, 1, c('#463a2e'));          // junta
    r.rect(sx, y + 1, GROSOR - (s % 5), 1, c('#8a7a63')); // canto con luz
    if (s % 5 === 0) r.rect(sx + 4 + (s % 9), y + 2, 1, h - 3, c('#3a2f26'));
  }
  // La cara de este lado, la que mirás: en sombra, y su remate arriba.
  r.rect(sx, y0, 2, alto, c('#4a3e33'));
  r.rect(sx + GROSOR - 2, y0, 2, alto, c('#3f342b'));
  r.rect(sx, y0, GROSOR, 1, c('#9a8a73'));
  r.rect(sx, y1 - 1, GROSOR, 1, c('#2e2620'));
}

/** EL RÍO: agua con su orilla, su brillo y la corriente. */
function agua(r, c, sx, y0, y1) {
  const alto = y1 - y0;
  r.rect(sx, y0, GROSOR, alto, c('#3f5d6b'));
  r.rect(sx, y0, 2, alto, c('#6f8f96'));            // la orilla de este lado
  r.rect(sx + GROSOR - 2, y0, 2, alto, c('#31505e'));
  for (let y = y0 + 2; y < y1 - 1; y += 5) {
    const s = revolver(Math.round(y) * 7);
    r.rect(sx + 3 + (s % 8), y, 4 + (s % 5), 1, c('#5d8391'));
    if (s % 3 === 0) r.rect(sx + 10 + (s % 6), y + 2, 3, 1, c('#8fb3b8'));
  }
}

/** EL VADO: por donde se cruza. Agua baja, piedras y el fondo que se ve. */
function vado(r, c, sx, y0, y1) {
  const alto = y1 - y0;
  r.rect(sx, y0, GROSOR, alto, c('#6d7d6a'));
  r.rect(sx, y0, GROSOR, 1, c('#8fb3b8'));
  r.rect(sx, y1 - 1, GROSOR, 1, c('#8fb3b8'));
  for (let y = y0 + 3; y < y1 - 2; y += 6) {
    const s = revolver(Math.round(y) * 19 + 5);
    r.rect(sx + 2 + (s % 14), y, 3, 2, c('#8a7f6a'));
    r.rect(sx + 2 + (s % 14), y, 3, 1, c('#a79a80'));
  }
}

/** EL BOSQUE DE ROCAS: peñascos grandes pegados unos a otros. */
function penascos(r, c, sx, y0, y1, suelo) {
  for (let y = y0; y < y1; y += 12) {
    const h = Math.min(12, y1 - y);
    const s = revolver(Math.round(y) * 29 + 7);
    const ancho = GROSOR - (s % 6);
    const x = sx + (s % 5);
    r.rect(x, y, ancho, h, c(['#5e5346', '#6b5f4f', '#544a3f'][s % 3]));
    r.rect(x, y, ancho, 1, c('#8e8069'));
    r.rect(x + ancho - 1, y, 1, h, c('#3e362d'));
    // La sombra al pie, que es lo que apoya el peñasco en el suelo.
    r.ctx.save();
    r.ctx.globalAlpha = 0.25;
    r.rect(x - 2, y + h - 1, ancho + 4, 2, '#000');
    r.ctx.restore();
  }
}

/** La sombra de la entrada: adentro no hay sol. */
function bocaDeEntrada(r, c, sx, y0, y1) {
  r.ctx.save();
  r.ctx.globalAlpha = 0.5;
  r.rect(sx, y0, GROSOR, y1 - y0, '#1a1410');
  r.ctx.restore();
  r.rect(sx, y0 - 2, GROSOR, 2, c('#9a8a73'));
  r.rect(sx, y1, GROSOR, 2, c('#9a8a73'));
}

/**
 * LO QUE SE VE DE LEJOS DE CADA DESTINO, apoyado en el horizonte. Es lo que te
 * deja ELEGIR el camino antes de llegar a la horquilla: unos paredones, la
 * fila de álamos del río o los peñascos.
 */
export function dibujarAnuncio(r, tipo, x, base, escala, dia) {
  const c = (hex) => (dia ? hex : escalarColor(hex, 0.4));
  const s = Math.max(0.4, escala);
  if (tipo === 'alamos') {
    for (let i = 0; i < 5; i++) {
      const ax = x - 14 * s + i * 7 * s;
      const alto = (10 + (i % 3) * 4) * s;
      r.rect(ax, base - alto, 2 * s, alto, c('#3f5637'));
      r.rect(ax - 1 * s, base - alto, 4 * s, alto * 0.6, c('#4d6a41'));
    }
    r.rect(x - 18 * s, base - 1, 36 * s, 2, c('#5d8391'));
  } else if (tipo === 'penascos') {
    for (let i = 0; i < 4; i++) {
      const ax = x - 16 * s + i * 9 * s;
      const alto = (6 + ((i * 3) % 5)) * s;
      r.rect(ax, base - alto, 8 * s, alto, c('#5e5346'));
      r.rect(ax, base - alto, 8 * s, 1, c('#8e8069'));
    }
  } else {
    // Los paredones de la quebrada, con su tajo en el medio.
    const alto = 16 * s;
    r.rect(x - 20 * s, base - alto, 16 * s, alto, c('#6b5c4c'));
    r.rect(x + 4 * s, base - alto, 16 * s, alto, c('#6b5c4c'));
    r.rect(x - 20 * s, base - alto, 16 * s, 2, c('#8a7a66'));
    r.rect(x + 4 * s, base - alto, 16 * s, 2, c('#8a7a66'));
    r.rect(x - 4 * s, base - alto * 0.9, 8 * s, alto * 0.9, c('#241d18'));
  }
}

/** El mismo revuelto de siempre: forma sin listas y sin titilar. */
function revolver(n) {
  let t = (n * 374761393 + 668265263) | 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177);
  return (t ^ (t >>> 16)) >>> 0;
}
