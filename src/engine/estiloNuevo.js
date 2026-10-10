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

/**
 * EL BORDE FINO DE LA GENTE (`CONFIG.estilo.bordeFino`). La grilla se come
 * cualquier cosa más fina que un punto, así que el borde se dibuja DESPUÉS de
 * pasar el cuadro por la grilla: mientras se dibuja el mundo, la gente se
 * marca en una máscara (con la misma cámara) y lo que se dibuja delante de
 * ella la tapa; al final, en cada punto que no es gente y toca uno que sí, se
 * traza una línea de un píxel de pantalla del lado que lo toca.
 */
let mascara = null, mascaraCtx = null, chicaM = null, chicaMCtx = null, hayGente = false;
function laMascara(cv) {
  if (!mascara || mascara.width !== cv.width || mascara.height !== cv.height) {
    mascara = document.createElement('canvas');
    mascara.width = cv.width; mascara.height = cv.height;
    mascaraCtx = mascara.getContext('2d');
  }
  return mascaraCtx;
}

export const estiloNuevo = {
  get activo() { return activo; },
  /**
   * La luz del lugar, en pasos, para la gente del estilo nuevo: la pone la
   * escena antes de dibujar (ver raidScene.js) y la lee figura.js. Fuera de
   * los vagones nuevos no hay (`null`): ahí manda la oscuridad de siempre.
   */
  luzEn: null,
  /** Marca una persona en la máscara del borde fino, donde se acaba de dibujar con `ctx`. */
  marcarGente(ctx, img, x, y, w, h) {
    if (!activo || !CONFIG.estilo.bordeFino) return;
    const m = laMascara(ctx.canvas);
    m.setTransform(ctx.getTransform());
    m.imageSmoothingEnabled = false;
    m.globalCompositeOperation = 'source-over';
    m.drawImage(img, x, y, w, h);
    hayGente = true;
  },
  /** Lo que se dibuja delante de la gente le tapa el borde. */
  taparGente(ctx, img, x, y, w, h) {
    if (!activo || !CONFIG.estilo.bordeFino || !hayGente) return;
    const m = laMascara(ctx.canvas);
    m.setTransform(ctx.getTransform());
    m.globalCompositeOperation = 'destination-out';
    m.drawImage(img, x, y, w, h);
    m.globalCompositeOperation = 'source-over';
  },
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
    if (hayGente) this.bordeFino(ctx, w, h, k);
    ctx.restore();
    renderer.nuevoCuadro();
    renderer.text(T.estiloNuevo, 4, renderer.height - 6, '#e8b84a', 'left');
  },

  /** Traza el borde fino alrededor de lo marcado en la máscara, y la limpia. */
  bordeFino(ctx, w, h, k) {
    if (!chicaM || chicaM.width !== w || chicaM.height !== h) {
      chicaM = document.createElement('canvas');
      chicaM.width = w; chicaM.height = h;
      chicaMCtx = chicaM.getContext('2d', { willReadFrequently: true });
    }
    chicaMCtx.imageSmoothingEnabled = false;
    chicaMCtx.clearRect(0, 0, w, h);
    chicaMCtx.drawImage(mascara, 0, 0, w, h);
    const a = chicaMCtx.getImageData(0, 0, w, h).data;
    const es = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 128;
    ctx.fillStyle = '#140c1c';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (es(x, y)) continue;
      if (es(x - 1, y)) ctx.fillRect(x * k, y * k, 1, k);
      if (es(x + 1, y)) ctx.fillRect(x * k + k - 1, y * k, 1, k);
      if (es(x, y - 1)) ctx.fillRect(x * k, y * k, k, 1);
      if (es(x, y + 1)) ctx.fillRect(x * k, y * k + k - 1, k, 1);
    }
    mascaraCtx.setTransform(1, 0, 0, 1, 0, 0);
    mascaraCtx.clearRect(0, 0, mascara.width, mascara.height);
    hayGente = false;
  },
};
