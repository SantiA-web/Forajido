/**
 * LOS TRES REFUGIOS DE LA HUIDA: la quebrada, el vado del río y el bosque de
 * rocas.
 *
 * *(Santi: "que hayan diferentes caminos para tomar y que sea aleatorio el
 * destino a dónde llegas: puede ser un río, una quebrada o un bosque de
 * rocas", y después: "que literalmente el caballo pueda cabalgar hacia el
 * norte o sur en vez de solo hacia el este")*
 *
 * CADA UNO ESTÁ EN UN LUGAR DEL CAMPO, y el campo es abierto: no hay un camino
 * que te lleve, hay tres lugares y vos elegís hacia cuál galopás. Un refugio es
 * un **anillo** de roca, de agua o de peñascos con una **entrada** de unos
 * sesenta grados: adentro la ley no entra, pero la entrada hay que encontrarla,
 * y si le pegás al anillo te clavás contra él.
 *
 * ⚠️ DIBUJO SIMPLE (por vestir): bloques con junta y canto iluminado, agua con
 * reflejos, peñascos con su sombra.
 */

import { escalarColor } from './trenTresCuartos.js';

/**
 * 🗺️ CADA REFUGIO ES DE SU REGIÓN *(Santi: "eliminaría el río y lo dejaría
 * para otra región —región pradera o bosque—, hoy estamos en desierto")*.
 *
 * El río no se borró: quedó esperando su región. Cuando la huida pase por
 * pradera, `refugiosDeLaRegion('pradera')` lo devuelve y todo lo demás —el
 * anillo, el vado, el dibujo de lejos— ya está escrito.
 */
export const DESTINOS = {
  quebrada: {
    id: 'quebrada', region: 'desierto',
    nombre: 'LA QUEBRADA', cartel: '¡ADENTRO DE LA QUEBRADA!',
  },
  bosque: {
    id: 'bosque', region: 'desierto',
    nombre: 'EL BOSQUE DE ROCAS', cartel: '¡ADENTRO DEL BOSQUE DE ROCAS!',
  },
  rio: {
    id: 'rio', region: 'pradera',
    nombre: 'EL RÍO', cartel: '¡CRUZASTE EL RÍO!',
  },
};

/** Los refugios que pueden salir en esta región. */
export function refugiosDeLaRegion(region = 'desierto') {
  return Object.keys(DESTINOS).filter((id) => DESTINOS[id].region === region);
}

/** El grosor de la pared de un refugio, hacia adentro del radio. */
export const PARED = 26;

/**
 * ¿ESTE PUNTO ESTÁ CONTRA LA PARED DEL REFUGIO? Devuelve lo que hay que
 * corregir para sacarlo de ahí, o `null` si está libre (afuera, adentro, o
 * justo en la entrada).
 *
 * Es la misma cuenta que usa el dibujo, así que la pared que ves es la que te
 * frena.
 */
export function chocaConElRefugio(d, x, y) {
  const dx = x - d.x;
  const dy = (y - d.y) / ACHATA;
  const dist = Math.hypot(dx, dy);
  if (dist > d.radio + 6 || dist < d.radio - PARED - 6) return null;
  const a = Math.atan2(dy, dx);
  if (enLaEntrada(d, a)) return null;
  // Empujar hacia afuera o hacia adentro, lo que esté más cerca.
  const haciaAfuera = dist > d.radio - PARED / 2;
  const objetivo = haciaAfuera ? d.radio + 7 : d.radio - PARED - 7;
  return { x: d.x + Math.cos(a) * objetivo, y: d.y + Math.sin(a) * objetivo * ACHATA };
}

/** ¿Ya estás adentro? */
export function adentroDelRefugio(d, x, y) {
  const dx = x - d.x;
  const dy = (y - d.y) / ACHATA;
  return Math.hypot(dx, dy) < d.radio - PARED - 4;
}

/** En tres cuartos lo redondo se ve aplastado: un círculo es una elipse. */
export const ACHATA = 0.62;

function enLaEntrada(d, a) {
  const dif = Math.atan2(Math.sin(a - d.mira), Math.cos(a - d.mira));
  return Math.abs(dif) < d.abertura / 2;
}

/**
 * EL REFUGIO, DIBUJADO. Se dibuja por sectores: cada uno es un trozo de pared
 * con su sombra, y los que caen en la entrada no se dibujan — por ahí se pasa.
 */
export function dibujarRefugio(r, d, dia) {
  const c = (hex) => (dia ? hex : escalarColor(hex, 0.55));
  const pasos = 48;
  const trozos = [];
  for (let i = 0; i < pasos; i++) {
    const a = (i / pasos) * Math.PI * 2 - Math.PI;
    if (enLaEntrada(d, a)) continue;
    trozos.push({ a, y: d.y + Math.sin(a) * d.radio * ACHATA });
  }
  // De atrás hacia adelante, para que los de abajo tapen a los de arriba.
  trozos.sort((p, q) => p.y - q.y);

  // La sombra que el anillo tira hacia adentro: es lo que lo hace un lugar.
  r.ctx.save();
  r.ctx.globalAlpha = 0.22;
  r.ctx.fillStyle = '#000';
  r.ctx.beginPath();
  r.ctx.ellipse(d.x, d.y, (d.radio - PARED) * 1.02, (d.radio - PARED) * ACHATA * 1.02, 0, 0, Math.PI * 2);
  r.ctx.fill();
  r.ctx.restore();

  for (const t of trozos) {
    const x = d.x + Math.cos(t.a) * (d.radio - PARED / 2);
    const y = d.y + Math.sin(t.a) * (d.radio - PARED / 2) * ACHATA;
    if (d.tipo === 'rio') agua(r, c, x, y, t.a);
    else if (d.tipo === 'bosque') penasco(r, c, x, y, t.a);
    else roca(r, c, x, y, t.a);
  }
}

/** Un bloque del paredón de la quebrada. */
function roca(r, c, x, y, a) {
  const s = revolver(Math.round(a * 100));
  const w = PARED - (s % 6);
  const alto = 18 + (s % 10);
  r.ctx.save();
  r.ctx.globalAlpha = 0.3;
  r.rect(x - w / 2 - 2, y + 1, w + 4, 3, '#000');
  r.ctx.restore();
  r.rect(x - w / 2, y - alto, w, alto, c(['#6f5f4d', '#63543f', '#5a4c3d'][s % 3]));
  r.rect(x - w / 2, y - alto, w, 2, c('#8a7a63'));
  r.rect(x - w / 2, y - alto + 2, 2, alto - 2, c('#4a3e33'));
  if (s % 4 === 0) r.rect(x - w / 2 + 3 + (s % 7), y - alto + 3, 1, alto - 5, c('#3a2f26'));
}

/** Un trozo del río: agua, orilla y brillo. */
function agua(r, c, x, y, a) {
  const s = revolver(Math.round(a * 100) + 11);
  const w = PARED + 2;
  r.rect(x - w / 2, y - 6, w, 10, c('#3f5d6b'));
  r.rect(x - w / 2, y - 7, w, 2, c('#6f8f96'));
  r.rect(x - w / 2 + (s % 6), y - 3, 5 + (s % 4), 1, c('#8fb3b8'));
  r.rect(x - w / 2, y + 3, w, 1, c('#5b6a52'));
}

/** Un peñasco del bosque de rocas. */
function penasco(r, c, x, y, a) {
  const s = revolver(Math.round(a * 100) + 23);
  const w = 14 + (s % 10);
  const alto = 14 + (s % 12);
  r.ctx.save();
  r.ctx.globalAlpha = 0.28;
  r.rect(x - w / 2 - 2, y, w + 5, 3, '#000');
  r.ctx.restore();
  r.rect(x - w / 2, y - alto, w, alto, c(['#5e5346', '#6b5f4f', '#544a3f'][s % 3]));
  r.rect(x - w / 2, y - alto, w, 2, c('#8e8069'));
  r.rect(x + w / 2 - 2, y - alto + 2, 2, alto - 2, c('#3e362d'));
}

/**
 * EL REFUGIO VISTO DE LEJOS, para poder elegir hacia cuál ir desde el
 * arranque: una silueta chiquita en la dirección en la que está. Se dibuja en
 * el mundo, así que crece sola a medida que te acercás.
 */
export function dibujarDeLejos(r, d, dia, escala) {
  const c = (hex) => (dia ? hex : escalarColor(hex, 0.4));
  const s = Math.max(0.35, escala);
  const x = d.x;
  const y = d.y;
  if (d.tipo === 'rio') {
    for (let i = 0; i < 5; i++) {
      const ax = x - 30 * s + i * 15 * s;
      const alto = (22 + (i % 3) * 8) * s;
      r.rect(ax, y - alto, 4 * s, alto, c('#3f5637'));
      r.rect(ax - 2 * s, y - alto, 8 * s, alto * 0.6, c('#4d6a41'));
    }
    r.rect(x - 40 * s, y, 80 * s, 3 * s, c('#5d8391'));
  } else if (d.tipo === 'bosque') {
    for (let i = 0; i < 4; i++) {
      const ax = x - 34 * s + i * 20 * s;
      const alto = (14 + ((i * 5) % 12)) * s;
      r.rect(ax, y - alto, 16 * s, alto, c('#5e5346'));
      r.rect(ax, y - alto, 16 * s, 2 * s, c('#8e8069'));
    }
  } else {
    const alto = 34 * s;
    r.rect(x - 42 * s, y - alto, 34 * s, alto, c('#6b5c4c'));
    r.rect(x + 8 * s, y - alto, 34 * s, alto, c('#6b5c4c'));
    r.rect(x - 42 * s, y - alto, 34 * s, 3 * s, c('#8a7a66'));
    r.rect(x + 8 * s, y - alto, 34 * s, 3 * s, c('#8a7a66'));
    r.rect(x - 8 * s, y - alto * 0.9, 16 * s, alto * 0.9, c('#241d18'));
  }
}

/** El mismo revuelto de siempre: forma sin listas y sin titilar. */
function revolver(n) {
  let t = (n * 374761393 + 668265263) | 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177);
  return (t ^ (t >>> 16)) >>> 0;
}
