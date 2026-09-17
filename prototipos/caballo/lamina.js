/**
 * LA LÁMINA DEL CABALLO (etapa 5b).
 *
 * Dibuja las NUEVE POSES en fila, con y sin jinete, para poder mirar el giro
 * entero de una sola vez. En el juego nunca se ven las nueve juntas —van
 * pasando de a una mientras doblás— y así es imposible saber si el giro se lee
 * o no. Es la misma prueba aparte que usamos para la gente y para el vagón.
 */

import { dibujarAnimal, dibujarJinete, GOLPES } from '../../src/entities/caballo.js';
import { piezasGuardadas } from '../../src/world/piezas.js';

const DENSIDAD = 4;
const CELDA_W = 58;      // unidades del mundo por casillero
const CELDA_H = 40;

const hoja = document.getElementById('hoja');
const ctx = hoja.getContext('2d');

/** Un renderer mínimo: lo que `dibujarAnimal` y la gente le piden al del juego. */
function hacerRenderer(ctx) {
  const q = (v) => Math.round(v * DENSIDAD) / DENSIDAD;
  return {
    ctx,
    rect(x, y, w, h, color, alpha = 1) {
      if (w <= 0 || h <= 0) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(q(x), q(y), Math.max(1 / DENSIDAD, q(w)), Math.max(1 / DENSIDAD, q(h)));
      ctx.globalAlpha = 1;
    },
    box(x, y, hw, hh, color, alpha = 1) { this.rect(x - hw, y - hh, hw * 2, hh * 2, color, alpha); },
    line(x1, y1, x2, y2, color, alpha = 1, grosor = 1) {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = grosor;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
    circle(x, y, rad, color, alpha = 1) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    },
    text() {},
    poly() {},
  };
}

const POSES = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
const FILAS = [
  { etiqueta: 'sin jinete', jinete: false, esfuerzo: 1 },
  { etiqueta: 'con jinete, a fondo', jinete: true, esfuerzo: 1 },
  { etiqueta: 'con jinete, al trote', jinete: true, esfuerzo: 0.35 },
];

const anchoU = CELDA_W * POSES.length;
const altoU = CELDA_H * FILAS.length + 14;
hoja.width = anchoU * DENSIDAD;
hoja.height = altoU * DENSIDAD;
hoja.style.width = `${anchoU * 2}px`;

ctx.setTransform(DENSIDAD, 0, 0, DENSIDAD, 0, 0);
ctx.imageSmoothingEnabled = false;
ctx.fillStyle = '#c8a06a';
ctx.fillRect(0, 0, anchoU, altoU);

const r = hacerRenderer(ctx);

// El instante de la zancada: uno donde las patas estén claramente repartidas.
const T = 0.56;
const zancada = { t: 0.22, T };
const trote = Math.round(Math.cos((zancada.t / T - 0.15) * Math.PI * 2) * 1.2);
const rebote = Math.cos((zancada.t / T - 0.25) * Math.PI * 2) * 1.2 * 0.5;

FILAS.forEach((fila, fi) => {
  const y = 14 + fi * CELDA_H + CELDA_H * 0.62;
  POSES.forEach((pose, pi) => {
    const x = pi * CELDA_W + CELDA_W / 2;
    // La línea del suelo, para ver si los cascos apoyan donde deben.
    r.rect(x - 26, y + 7, 52, 0.25, '#8a6a42');
    const montura = dibujarAnimal(r, x, y, zancada, trote, fila.esfuerzo, pose);
    if (!fila.jinete) montura.adelante();
    if (fila.jinete) {
      dibujarJinete(r, montura.asiento.x, y - 10 + rebote, pose, fila.esfuerzo * 2, {}, montura.riendas);
      montura.adelante();
    }
    if (fi === 0) {
      ctx.fillStyle = '#3a2418';
      ctx.font = '7px system-ui, sans-serif';
      ctx.fillText(`pose ${pose}`, x - 12, 10);
    }
  });
  ctx.fillStyle = '#5a4028';
  ctx.font = '6px system-ui, sans-serif';
  ctx.fillText(fila.etiqueta, 4, 14 + fi * CELDA_H + 8);
});

const g = piezasGuardadas();
ctx.fillStyle = '#3a2418';
ctx.font = '7px system-ui, sans-serif';
ctx.fillText(`${g.cuantas} láminas guardadas · ${g.kb} KB`, 4, altoU - 4);
window.MEDIDA = g;
