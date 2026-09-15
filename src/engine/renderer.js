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
 * al revés, como los juegos de pixel art de Steam: la ventana se llena entera,
 * y lo que cambia de un monitor a otro es cuánto mundo se ve.
 *
 * 🔺 Y EL DIBUJO PASÓ A TENER DENSIDAD (ver `DENSIDAD`, más abajo): una unidad
 * del mundo se pinta con 4×4 puntos de pantalla, así el arte puede tener
 * detalle sin que cambie una sola medida de la lógica. Lo que se ve, por
 * monitor, en unidades del mundo:
 *
 *   1920×1080 → 480×270     1366×768  → 342×192 (se ve menos vagón)
 *   2560×1440 → 640×360     3840×2160 → 480×270
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
 * LA DENSIDAD: cuántos puntos de pantalla mide UNA unidad del mundo.
 *
 * El juego se dibuja a través de una lupa fija de ×4. Un guardia que está en la
 * posición 118 sigue estando en la 118: lo único que cambia es que esa unidad
 * se pinta con 4×4 puntos. Así el arte nuevo puede tener detalle de verdad —se
 * dibuja de a cuartos de unidad— sin tocar una sola medida de la lógica: las
 * cajas, las velocidades y las distancias siguen siendo las mismas.
 *
 * El zoom total es `escala * DENSIDAD`. En 1920×1080 son escala 1 y densidad 4:
 * los mismos 4 puntos por unidad de antes, o sea la MISMA porción de vagón.
 */
export const DENSIDAD = 4;

/**
 * El tamaño interno para una ventana de `pw`×`ph` píxeles físicos.
 *
 * @param ideal   el alto que se busca, en unidades del mundo
 * @param anchoMaximo  cuántas veces el alto puede medir el ancho. En un monitor
 *                ultra ancho, más allá de esto se deja una franja a los
 *                costados en vez de mostrar medio desierto de más.
 *
 * Las escenas armadas para `CONFIG.view` (campamento, pueblo, interiores,
 * mapa, tienda) ya no bajan el múltiplo de todos: piden su propia lupa con
 * `escenaFija()`, que baja la densidad hasta que entren.
 */
export function medirVista(pw, ph, ideal, anchoMaximo) {
  // La escala sigue siendo entera, o el punto se deformaría. Con densidad 4,
  // 1920×1080 y 2560×1440 dan escala 1, y 3840×2160 da 2.
  const escala = Math.max(1, Math.floor(ph / (ideal.height * DENSIDAD)));
  // `ceil`: sobra menos de un píxel del juego, que queda fuera de la ventana
  // (el body no scrollea). Con `floor` faltaría, y eso es una rayita de borde.
  const altoPx = Math.ceil(ph / escala);
  const anchoPx = Math.min(Math.ceil(pw / escala), Math.round(altoPx * anchoMaximo));
  // `width` y `height` se devuelven en UNIDADES del mundo, no en puntos: es lo
  // que leen las escenas, y en 1920×1080 siguen dando 480×270.
  return { width: Math.ceil(anchoPx / DENSIDAD), height: Math.ceil(altoPx / DENSIDAD), escala };
}

export function createRenderer(canvas, vista) {
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let medido = '';
  /**
   * La densidad EN USO. Es ×4 para el mundo, pero las escenas armadas para
   * `CONFIG.view` (campamento, pueblo, interiores, mapa, tienda) no entran con
   * la lupa entera en un monitor chico: ésas dibujan con la que entre.
   */
  let dens = DENSIDAD;

  /** Poner la lupa: de acá en adelante se dibuja en unidades del mundo. */
  const usar = (d) => { dens = d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  /** Al punto de pantalla. Con coordenadas enteras da exactamente lo mismo que antes. */
  const q = (v) => Math.round(v * dens) / dens;
  const anchoU = () => canvas.width / dens;
  const altoU = () => canvas.height / dens;
  const densidadFija = () => Math.max(1, Math.min(
    DENSIDAD,
    Math.floor(canvas.width / vista.minimo.width),
    Math.floor(canvas.height / vista.minimo.height)
  ));

  function fitToScreen() {
    const dpr = window.devicePixelRatio || 1;
    // Se llama en cada cuadro (ver main.js): si la ventana no cambió, no hace nada.
    const clave = `${window.innerWidth}x${window.innerHeight}@${dpr}`;
    if (clave === medido) return;
    medido = clave;
    const m = medirVista(
      Math.round(window.innerWidth * dpr), Math.round(window.innerHeight * dpr),
      vista.ideal, vista.anchoMaximo
    );
    // Ventana de 0 (una pestaña oculta, por ejemplo): no se toca nada, o el
    // canvas quedaría vacío y habría que recargar para recuperarlo.
    if (!m.width || !m.height) return;
    if (m.width !== width || m.height !== height) {
      width = m.width;
      height = m.height;
      // Cambiar el tamaño del canvas le borra TODO el estado al contexto,
      // incluido el suavizado: hay que volver a apagarlo cada vez.
      canvas.width = width * DENSIDAD;
      canvas.height = height * DENSIDAD;
      ctx.imageSmoothingEnabled = false;
      // Cambiar el tamaño también borra la lupa: hay que volver a ponerla.
      usar(dens);
    }
    canvas.style.width = (canvas.width * m.escala) / dpr + 'px';
    canvas.style.height = (canvas.height * m.escala) / dpr + 'px';
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
    get width() { return Math.floor(anchoU()); },
    get height() { return Math.floor(altoU()); },
    /** Cuántos puntos de pantalla mide una unidad ahora mismo. */
    get densidad() { return dens; },
    fitToScreen,

    /** Cada cuadro arranca con la lupa del mundo puesta (lo llama main.js). */
    nuevoCuadro() { usar(DENSIDAD); },
    /**
     * Para las escenas armadas para `CONFIG.view`. En 1920×1080 es la misma
     * lupa del mundo; en un monitor chico baja hasta que la escena entre.
     */
    escenaFija() { usar(densidadFija()); },

    /**
     * DÓNDE VA UNA ESCENA ARMADA PARA `CONFIG.view`, centrada en la pantalla de
     * hoy. El campamento, el mapa, los interiores y la tienda están pensados
     * para ese tamaño; se dibujan corridos por esto y su fondo llena lo que
     * sobra alrededor. Siempre enteros, o los píxeles quedarían a medias.
     */
    get centro() {
      return {
        x: Math.floor((anchoU() - vista.minimo.width) / 2),
        y: Math.floor((altoU() - vista.minimo.height) / 2),
      };
    },

    clear(color) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, anchoU(), altoU());
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
        const y0 = q(y + i * alto);
        const y1 = i === bandas - 1 ? q(y + h) : q(y + (i + 1) * alto);
        ctx.fillRect(q(x), y0, q(w), y1 - y0);
      }
    },

    /** Rectángulo lleno, con coordenadas redondeadas para no ver bordes borrosos. */
    rect(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(q(x), q(y), q(w), q(h));
    },

    /** Rectángulo centrado en (x, y). Cómodo para entidades. */
    box(x, y, halfW, halfH, color) {
      ctx.fillStyle = color;
      ctx.fillRect(
        q(x - halfW),
        q(y - halfH),
        q(halfW * 2),
        q(halfH * 2)
      );
    },

    /** Circunferencia (solo el contorno). Para radios de explosión y de ruido. */
    circle(x, y, radius, color, alpha = 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(q(x) + 0.5, q(y) + 0.5, Math.max(1, radius), 0, Math.PI * 2);
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
      ctx.fillRect(0, 0, anchoU(), altoU());
      ctx.restore();
    },

    line(x1, y1, x2, y2, color, alpha = 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(q(x1) + 0.5, q(y1) + 0.5);
      ctx.lineTo(q(x2) + 0.5, q(y2) + 0.5);
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

      const px = q(x);
      const py = q(y);

      if (halo) {
        ctx.fillStyle = halo;
        for (const [dx, dy] of HALO) ctx.fillText(str, px + dx, py + dy);
      }

      ctx.fillStyle = color;
      ctx.fillText(str, px, py);
    },
  };
}
