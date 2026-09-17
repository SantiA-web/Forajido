/**
 * Prueba de trabajo: dibuja al jinete GRANDE en las poses que se le pidan, para
 * poder mirarle la espalda, las manos y las piernas de cerca. No es parte del
 * juego: se importa desde la consola y queda como `window.ZOOM`, que devuelve
 * la foto como dataURL:
 *
 *   ZOOM(poses, densidad, esfuerzo, quieto, pelaje)  →  ZOOM([-4, 0], 16)
 */
import { dibujarAnimal, dibujarJinete, cargada } from '../../src/entities/caballo.js';

await cargada;

function hacerRenderer(ctx, D) {
  const q = (v) => Math.round(v * D) / D;
  return {
    ctx,
    rect(x, y, w, h, color, alpha = 1) {
      if (w <= 0 || h <= 0) return;
      ctx.globalAlpha = alpha; ctx.fillStyle = color;
      ctx.fillRect(q(x), q(y), Math.max(1 / D, q(w)), Math.max(1 / D, q(h)));
      ctx.globalAlpha = 1;
    },
    box(x, y, hw, hh, c, a = 1) { this.rect(x - hw, y - hh, hw * 2, hh * 2, c, a); },
    line(x1, y1, x2, y2, c, a = 1, g = 1) {
      ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = g;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.globalAlpha = 1;
    },
    circle(x, y, rad, c, a = 1) {
      ctx.globalAlpha = a; ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    },
    text() {}, poly() {},
  };
}

window.ZOOM = (poses, D = 8, esfuerzo = 1, quieto = false, pelaje = null) => {
  const CW = 46, CH = 44;
  const c = document.createElement('canvas');
  c.width = CW * poses.length * D;
  c.height = CH * D;
  const ctx = c.getContext('2d');
  ctx.setTransform(D, 0, 0, D, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#c8a06a';
  ctx.fillRect(0, 0, CW * poses.length, CH);
  const r = hacerRenderer(ctx, D);
  const T = 0.56;
  const zancada = quieto ? null : { t: 0.22, T };
  const trote = quieto ? 0 : Math.round(Math.cos((0.22 / T - 0.15) * Math.PI * 2) * 1.2);
  const rebote = quieto ? 0 : Math.cos((0.22 / T - 0.25) * Math.PI * 2) * 1.2 * 0.5;
  poses.forEach((pose, i) => {
    const x = i * CW + CW / 2;
    const y = CH * 0.66;
    r.rect(x - 22, y + 7, 44, 0.25, '#8a6a42');
    const m = dibujarAnimal(r, x, y, zancada, trote, esfuerzo, pose, pelaje);
    dibujarJinete(r, m.asiento.x, m.asiento.y + rebote, pose, esfuerzo * 2, {}, m);
    m.adelante();
    ctx.fillStyle = '#3a2418';
    ctx.font = '4px system-ui, sans-serif';
    ctx.fillText(`pose ${pose}`, x - 8, 5);
  });
  return c.toDataURL('image/png');
};
