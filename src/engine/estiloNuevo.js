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
 * imagen chica —un punto cada `CONFIG.estilo.punto` (3) del lienzo— y se
 * agranda sin suavizar. Así es IMPOSIBLE que algo quede con otro tamaño de
 * punto. El lienzo siempre tiene 4 puntos por unidad del mundo, así que la
 * grilla siempre es de 0,75 unidades: en 1080p son 640×360 puntos.
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
    const k = CONFIG.estilo.punto;
    const w = Math.ceil(cv.width / k), h = Math.ceil(cv.height / k);
    if (!chico || chico.width !== w || chico.height !== h) {
      chico = document.createElement('canvas');
      chico.width = w; chico.height = h;
      chicoCtx = chico.getContext('2d', { willReadFrequently: true });
    }
    // Sin suavizar: toma el punto del medio de cada cuadrado de 3×3. Lo nuevo
    // ya está dibujado en la grilla y sale exacto; lo viejo pierde detalle.
    chicoCtx.imageSmoothingEnabled = false;
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
