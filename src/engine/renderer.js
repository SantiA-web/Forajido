/**
 * Renderer: el canvas y sus utilidades de dibujo.
 *
 * El canvas tiene una resolución interna chica (384x216) y se estira por CSS
 * en múltiplos ENTEROS. Así cada píxel del juego es un cuadrado perfecto en
 * pantalla: eso es lo que hace que el pixel art se vea nítido.
 */

/**
 * EL TEXTO DEL JUEGO — pensado para que se LEA.
 *
 * Estaba en Courier New a 8px con una sombrita de 1px abajo a la derecha, y
 * se entendía mal por dos motivos distintos:
 *
 *  1. **Courier New es demasiado fina a este tamaño.** Es una tipografía de
 *     máquina de escribir: sus trazos son de un píxel y a 8px se deshacen.
 *     Verdana está diseñada justamente para tamaños chicos —letras anchas,
 *     aberturas grandes— y aguanta 8px sin volverse un borrón.
 *
 *  2. **La sombra tapaba de un solo lado.** Servía sobre fondos oscuros y no
 *     servía sobre los claros. Ahora hay un HALO en las ocho direcciones, así
 *     que el texto se despega de cualquier fondo: el suelo del vagón, la
 *     tierra del pueblo o el papel del mapa.
 *
 * EL TAMAÑO NO SUBIÓ, y no hizo falta. Medido a 8px contra las frases más
 * largas del juego, Verdana sale MÁS ANGOSTA que Courier New (298→282 px en el
 * cartel de teclas del galope, 331→276 en el más largo del pueblo): una
 * monoespaciada gasta el mismo ancho en una "i" que en una "m", y ahí es donde
 * pierde. O sea que se lee mejor Y ocupa menos.
 *
 * El color del halo se puede pasar, y no es un capricho: en el mapa el halo va
 * del color del PAPEL, no negro. Es como se hace en cartografía de verdad —la
 * etiqueta "recorta" el fondo en vez de traer una sombra— y además un contorno
 * negro sobre papel sepia rompería la paleta entera del mapa.
 */
const TEXTO = {
  fuente: 'Verdana, Tahoma, "DejaVu Sans", sans-serif',
  tam: 8,
};

const HALO = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0],           [1, 0],
  [-1, 1],  [0, 1],  [1, 1],
];

/** '#8a7a5c' -> [138, 122, 92]. Para poder interpolar entre dos colores. */
function hexARgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const mezcla = (a, b, t) => Math.round(a + (b - a) * t);

export function createRenderer(canvas, width, height) {
  const ctx = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;
  ctx.imageSmoothingEnabled = false;

  function fitToScreen() {
    const scale = Math.max(
      1,
      Math.floor(Math.min(window.innerWidth / width, window.innerHeight / height))
    );
    canvas.style.width = width * scale + 'px';
    canvas.style.height = height * scale + 'px';
  }

  window.addEventListener('resize', fitToScreen);
  fitToScreen();

  return {
    ctx,
    canvas,
    width,
    height,
    fitToScreen,

    clear(color) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
    },

    /**
     * UN DEGRADADO VERTICAL DIBUJADO POR BANDAS, no con el gradient del canvas.
     *
     * El gradient real produce cientos de tonos intermedios y bordes
     * difuminados: en una pantalla de 384x216 donde todo lo demás es de color
     * plano, eso se lee como un error de compresión, no como un cielo. Ocho
     * bandas se leen como pixel art y son lo que hace cualquier juego del
     * género.
     *
     * Existe por el cielo del pueblo, pero no sabe nada de pueblos: es un
     * degradado, y el galope lo usa para las bandas del desierto.
     */
    cielo(x, y, w, h, colorArriba, colorAbajo, bandas = 8) {
      const a = hexARgb(colorArriba);
      const b = hexARgb(colorAbajo);
      const alto = h / bandas;
      for (let i = 0; i < bandas; i++) {
        const t = bandas === 1 ? 0 : i / (bandas - 1);
        ctx.fillStyle = `rgb(${mezcla(a[0], b[0], t)},${mezcla(a[1], b[1], t)},${mezcla(a[2], b[2], t)})`;
        // El último se estira hasta el final: con alturas que no dividen justo,
        // redondear cada banda por separado deja una costura de fondo a la vista.
        const y0 = Math.round(y + i * alto);
        const y1 = i === bandas - 1 ? Math.round(y + h) : Math.round(y + (i + 1) * alto);
        ctx.fillRect(Math.round(x), y0, Math.round(w), y1 - y0);
      }
    },

    /** Rectángulo lleno, con coordenadas redondeadas para no ver bordes borrosos. */
    rect(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    },

    /** Rectángulo centrado en (x, y). Cómodo para entidades. */
    box(x, y, halfW, halfH, color) {
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(x - halfW),
        Math.round(y - halfH),
        Math.round(halfW * 2),
        Math.round(halfH * 2)
      );
    },

    /** Circunferencia (solo el contorno). Para radios de explosión y de ruido. */
    circle(x, y, radius, color, alpha = 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.max(1, radius), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },

    /**
     * Un velo de color sobre TODA la pantalla.
     *
     * Es como se hace la noche: se dibuja la escena con sus colores normales y
     * encima va un velo azulado. La alternativa —tener dos paletas completas
     * de cada cosa— significa mantener dos juegos de colores para siempre y
     * que cualquier objeto nuevo nazca a medias.
     */
    tinte(color, alpha) {
      if (!alpha) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    },

    line(x1, y1, x2, y2, color, alpha = 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
      ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
      ctx.stroke();
      ctx.restore();
    },

    /**
     * Texto chiquito, pensado para etiquetas dentro del mundo.
     *
     * @param opciones.tam  para agrandarlo en algún lugar puntual
     * @param opciones.halo color del contorno. `null` lo saca del todo; por
     *   defecto es negro, que es lo que sirve en las escenas oscuras. El mapa
     *   pasa el color del papel (ver el comentario de TEXTO, arriba).
     */
    text(str, x, y, color, align = 'center', opciones = {}) {
      const tam = opciones.tam || TEXTO.tam;
      const halo = opciones.halo === undefined ? '#000' : opciones.halo;

      ctx.font = `${tam}px ${TEXTO.fuente}`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';

      const px = Math.round(x);
      const py = Math.round(y);

      if (halo) {
        ctx.fillStyle = halo;
        for (const [dx, dy] of HALO) ctx.fillText(str, px + dx, py + dy);
      }

      ctx.fillStyle = color;
      ctx.fillText(str, px, py);
    },
  };
}
