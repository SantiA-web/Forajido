/**
 * Renderer: el canvas y sus utilidades de dibujo.
 *
 * El canvas tiene una resolución interna chica y se estira por CSS en múltiplos
 * ENTEROS. Así cada píxel del juego es un cuadrado perfecto en pantalla: eso es
 * lo que hace que el pixel art se vea nítido.
 *
 * 🔺 EL TAMAÑO INTERNO YA NO ES FIJO: SALE DE LA PANTALLA. *(Santi: "yo quiero
 * que quede como un juego normal de steam")*.
 *
 * Con un tamaño fijo, el múltiplo entero casi nunca llena la ventana y sobra un
 * borde negro (420×236 ×4 = 1680×944 en un monitor de 1920×1080). Ahora se hace
 * al revés, como los juegos de pixel art de Steam: primero se elige el tamaño
 * del píxel —el múltiplo que deja unos `CONFIG.vistaIdeal.height` de alto— y
 * después el ancho y el alto internos son LO QUE ENTRE en la ventana con ese
 * píxel. Siempre llena, siempre nítido; lo que cambia de un monitor a otro es
 * cuánto mundo se ve:
 *
 *   1920×1080  ×4 → 480×270     1366×768  ×3 → 456×256
 *   2560×1440  ×5 → 512×288     3840×2160 ×8 → 480×270
 *
 * Se mide en píxeles FÍSICOS (`devicePixelRatio`): con Windows al 125% el
 * navegador dice que la ventana mide 1536 de ancho, pero la pantalla tiene
 * 1920, y el múltiplo entero tiene que serlo de los píxeles de verdad.
 *
 * `width` y `height` se leen en vivo (son getters): cambian si cambia la
 * ventana, y quien los necesite tiene que leerlos cada vez, no guardarlos.
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

/**
 * El tamaño interno para una ventana de `pw`×`ph` píxeles físicos.
 *
 * @param ideal   el alto que se busca (el múltiplo que más se le acerca)
 * @param minimo  lo mínimo que tiene que entrar: las escenas fijas (campamento,
 *                mapa, interiores, tienda) están armadas para este tamaño, así
 *                que se baja el múltiplo antes que cortarlas.
 * @param anchoMaximo  cuántas veces el alto puede medir el ancho. En un monitor
 *                ultra ancho, más allá de esto se deja una franja a los
 *                costados en vez de mostrar medio desierto de más.
 */
export function medirVista(pw, ph, ideal, minimo, anchoMaximo) {
  let escala = Math.max(1, Math.round(ph / ideal.height));
  while (escala > 1 && (pw / escala < minimo.width || ph / escala < minimo.height)) escala--;
  // `ceil`: sobra menos de un píxel del juego, que queda fuera de la ventana
  // (el body no scrollea). Con `floor` faltaría, y eso es una rayita de borde.
  const height = Math.ceil(ph / escala);
  const width = Math.min(Math.ceil(pw / escala), Math.round(height * anchoMaximo));
  return { width, height, escala };
}

export function createRenderer(canvas, vista) {
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let medido = '';

  function fitToScreen() {
    const dpr = window.devicePixelRatio || 1;
    // Se llama en cada cuadro (ver main.js): si la ventana no cambió, no hace nada.
    const clave = `${window.innerWidth}x${window.innerHeight}@${dpr}`;
    if (clave === medido) return;
    medido = clave;
    const m = medirVista(
      Math.round(window.innerWidth * dpr), Math.round(window.innerHeight * dpr),
      vista.ideal, vista.minimo, vista.anchoMaximo
    );
    if (m.width !== width || m.height !== height) {
      width = m.width;
      height = m.height;
      // Cambiar el tamaño del canvas le borra TODO el estado al contexto,
      // incluido el suavizado: hay que volver a apagarlo cada vez.
      canvas.width = width;
      canvas.height = height;
      ctx.imageSmoothingEnabled = false;
    }
    canvas.style.width = (width * m.escala) / dpr + 'px';
    canvas.style.height = (height * m.escala) / dpr + 'px';
  }

  /**
   * `resize` no alcanza, y se midió: al cambiar el tamaño desde las
   * herramientas del navegador no se disparó —ni él ni un ResizeObserver— y el
   * juego quedó en 456×256 dentro de una ventana de 1600×900. Por eso main.js
   * además lo llama en cada cuadro; con la comparación de arriba, cuesta leer
   * dos números. El evento queda para que reaccione aunque el bucle esté parado.
   */
  window.addEventListener('resize', fitToScreen);
  fitToScreen();

  return {
    ctx,
    canvas,
    get width() { return width; },
    get height() { return height; },
    fitToScreen,

    /**
     * DÓNDE VA UNA ESCENA ARMADA PARA `CONFIG.view`, centrada en la pantalla de
     * hoy. El campamento, el mapa, los interiores y la tienda están pensados
     * para ese tamaño; se dibujan corridos por esto y su fondo llena lo que
     * sobra alrededor. Siempre enteros, o los píxeles quedarían a medias.
     */
    get centro() {
      return {
        x: Math.floor((width - vista.minimo.width) / 2),
        y: Math.floor((height - vista.minimo.height) / 2),
      };
    },

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
