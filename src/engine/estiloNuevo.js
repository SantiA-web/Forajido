/**
 * 🧪 EL ESTILO NUEVO, EN PRUEBA (etapa P0) — se prende y se apaga con [F9].
 *
 * *(Santi eligió el estilo nuevo: todo el juego en una grilla de puntos de 3×3,
 * la gente de ~32 puntos sin cara, una paleta cerrada de 48 colores y la luz por
 * escalones; ver NOTAS-DISENO.md, "EL ESTILO NUEVO")*. Y eligió **pasarlo con
 * una tecla de prueba**: mientras se dibuja, el juego normal sigue con el
 * dibujo de hoy, y con [F9] se ve cómo va lo nuevo. Cuando esté todo, lo viejo
 * se apaga.
 *
 * LA GRILLA: el cuadro entero (gente, tren, desierto, efectos) termina en una
 * imagen chica, de `CONFIG.estilo.alto` filas (360), y se agranda sin
 * suavizar. Así es IMPOSIBLE que algo quede con otro tamaño de punto: en
 * 1080p cada punto son 3×3 de pantalla, en 720p 2×2, en 4K 6×6.
 *
 * Por ahora lo único que hace es eso: pasar el dibujo de HOY por la grilla y
 * por la paleta. Se ve tosco a propósito —es el dibujo viejo achicado—; a
 * medida que avancen las etapas, cada cosa se dibuja directamente en la grilla
 * y deja de verse así.
 */
import { CONFIG } from '../data/config.js';
import { cuantizar } from './paleta.js';
import { T } from '../text/es.js';

let activo = /[?&]nuevo\b/.test(location.search);
let chico = null, chicoCtx = null;

export const estiloNuevo = {
  get activo() { return activo; },
  /** [F9]: prender o apagar la prueba. */
  revisar(input) {
    if (input.wasPressed('F9')) activo = !activo;
  },

  /** Lo llama main.js después de dibujar el cuadro. */
  pasar(renderer) {
    if (!activo) return;
    const cv = renderer.canvas, ctx = renderer.ctx;
    // Cuántos puntos de pantalla mide un punto de la grilla: el entero que
    // deja más cerca de `alto` filas (1080 → 3, 720 → 2, 2160 → 6).
    const k = Math.max(1, Math.round(cv.height / CONFIG.estilo.alto));
    const w = Math.ceil(cv.width / k), h = Math.ceil(cv.height / k);
    if (!chico || chico.width !== w || chico.height !== h) {
      chico = document.createElement('canvas');
      chico.width = w; chico.height = h;
      chicoCtx = chico.getContext('2d', { willReadFrequently: true });
    }
    chicoCtx.imageSmoothingEnabled = true;
    chicoCtx.imageSmoothingQuality = 'medium';
    chicoCtx.clearRect(0, 0, w, h);
    chicoCtx.drawImage(cv, 0, 0, w, h);
    if (CONFIG.estilo.paleta) {
      const img = chicoCtx.getImageData(0, 0, w, h);
      chicoCtx.putImageData(cuantizar(img), 0, 0);
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(chico, 0, 0, w * k, h * k);
    ctx.restore();
    renderer.nuevoCuadro();
    renderer.text(T.estiloNuevo, 4, renderer.height - 6, '#e8b84a', 'left');
  },
};
