/**
 * LA SILUETA DEL CABALLO, PLANA (etapa 5b, segunda vuelta).
 *
 * *(Santi, mirando el primer intento: "está horrible. Parece más a un zorro
 * bugeado que a un caballo y encima estuviste 40min para hacerlo")*.
 *
 * TENÍA RAZÓN EN LAS DOS COSAS, y la segunda explica la primera: el método
 * estuvo mal. Se fueron ajustando números mirando el dibujo COMPLETO —con
 * sombreado, músculo, montura y jinete encima— así que cada vuelta era cara y
 * LA SILUETA, que es lo único que decide si se lee como caballo, nunca se miró
 * sola. Esta lámina es esa mirada: el animal pintado de un solo color, sin un
 * detalle, que es como se compara contra una referencia.
 *
 * El error de fondo era de PROPORCIÓN, no de detalle. Un caballo es casi
 * CUADRADO: del pecho al anca mide más o menos lo mismo que su alzada a la
 * cruz. El cuerpo estaba hecho de 104 puntos de largo por 68 de alto — un 50%
 * más largo de lo que va. Ese tubo largo y bajo es el zorro. (Los "2,4 m" de
 * las notas del proyecto son de HOCICO A COLA, y se habían usado para el
 * cuerpo solo.)
 */

import { dibujarAnimal, dibujarJinete } from '../../src/entities/caballo.js';

const DENSIDAD = 4;
const TINTA = '#20160e';

const hoja = document.getElementById('hoja');
const ctx = hoja.getContext('2d');

/**
 * El renderer de siempre, pero con `plano`: pinta TODO del mismo color. Es el
 * mismo truco que usa el asalto para la sombra del jinete detrás de la pared
 * del tren, así que no hay un dibujo aparte que mantener.
 */
function hacerRenderer(ctx, plano) {
  const q = (v) => Math.round(v * DENSIDAD) / DENSIDAD;
  const c = (col) => plano || col;
  return {
    ctx, plano,
    rect(x, y, w, h, color) {
      if (w <= 0 || h <= 0) return;
      ctx.fillStyle = c(color);
      ctx.fillRect(q(x), q(y), Math.max(1 / DENSIDAD, q(w)), Math.max(1 / DENSIDAD, q(h)));
    },
    box(x, y, hw, hh, color) { this.rect(x - hw, y - hh, hw * 2, hh * 2, color); },
    line(x1, y1, x2, y2, color, alpha = 1, grosor = 1) {
      ctx.save();
      ctx.globalAlpha = plano ? 1 : alpha;
      ctx.strokeStyle = c(color);
      ctx.lineWidth = grosor;
      ctx.beginPath();
      ctx.moveTo(q(x1), q(y1));
      ctx.lineTo(q(x2), q(y2));
      ctx.stroke();
      ctx.restore();
    },
    circle() {}, text() {}, poly() {},
  };
}

const zancada = { t: 0.22, T: 0.56 };
const trote = Math.round(Math.cos((zancada.t / 0.56 - 0.15) * Math.PI * 2) * 1.2);
const rebote = Math.cos((zancada.t / 0.56 - 0.25) * Math.PI * 2) * 1.2 * 0.5;

const FILAS = [
  { et: 'la silueta sola, al triple', z: 3, jinete: false, poses: [0] },
  { et: 'con el jinete, al triple', z: 3, jinete: true, poses: [0] },
  { et: 'el giro entero, al doble', z: 2, jinete: false, poses: [-4, -2, 0, 2, 4] },
  { et: 'tamaño real, como se ve jugando', z: 1, jinete: true, poses: [-4, -2, 0, 2, 4] },
];

// Cada fila se dibuja en su propio lienzo y después se pegan todas.
const trozos = FILAS.map((fila) => {
  const W = 46 * fila.poses.length;
  const H = 40;
  const c = document.createElement('canvas');
  c.width = W * DENSIDAD;
  c.height = H * DENSIDAD;
  const g = c.getContext('2d');
  g.setTransform(DENSIDAD, 0, 0, DENSIDAD, 0, 0);
  g.imageSmoothingEnabled = false;
  const r = hacerRenderer(g, TINTA);
  fila.poses.forEach((pose, i) => {
    const x = i * 46 + 23;
    const y = 24;
    const m = dibujarAnimal(r, x, y, zancada, trote, 1, pose);
    if (fila.jinete) dibujarJinete(r, m.asiento.x, y - 10 + rebote, pose, 2, {}, m.riendas);
    m.adelante();
  });
  return { c, fila };
});

const anchoTotal = Math.max(...trozos.map((t) => t.c.width * t.fila.z)) + 40;
const altoTotal = trozos.reduce((s, t) => s + t.c.height * t.fila.z + 34, 20);
hoja.width = anchoTotal;
hoja.height = altoTotal;
ctx.imageSmoothingEnabled = false;
ctx.fillStyle = '#c9a877';
ctx.fillRect(0, 0, anchoTotal, altoTotal);

let y = 14;
for (const { c, fila } of trozos) {
  ctx.fillStyle = '#5a4028';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText(fila.et, 20, y + 12);
  y += 20;
  ctx.drawImage(c, 20, y, c.width * fila.z, c.height * fila.z);
  y += c.height * fila.z + 14;
}
