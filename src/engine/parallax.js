/**
 * Fondo en capas a distinta velocidad.
 *
 * No sabe nada de trenes ni de western: recibe capas y las hace pasar. Vive en
 * engine/ porque es la misma pieza para cualquier cosa que se mueva rápido.
 *
 * POR QUÉ IMPORTA TANTO ACÁ. Tanto en el asalto como en el galope, la cámara va
 * pegada al tren, así que **el tren está quieto en pantalla**. Lo único que
 * cuenta que la cosa se mueve es el fondo. Si el fondo va lento, el tren parece
 * estacionado y el caballo, un dibujo.
 *
 * Las dos reglas que hacen que funcione:
 *
 *  1. **La diferencia entre capas es lo que da la sensación, no la velocidad de
 *     una sola.** Los cerros del fondo casi no se mueven; el rastrojo de la vía
 *     vuela. Esa diferencia es la que el ojo lee como profundidad y velocidad.
 *     Una sola capa, por rápida que vaya, se lee como un fondo que parpadea.
 *
 *  2. **Lo cercano tiene que ser chico y denso.** Un manchón grande que cruza
 *     rápido se lee como un objeto que pasa; muchas rayitas chicas se leen como
 *     el suelo yéndose. Por eso la capa de adelante son piedritas y pasto, no
 *     arbustos.
 */

/**
 * @param r        el renderer
 * @param capas    lista de { v, sep, alto, ancho, color, y }
 *                 v = px por segundo, sep = separación entre elementos
 * @param scroll   segundos acumulados
 * @param ancho    ancho de la zona a cubrir (normalmente r.width)
 */
export function drawParallax(r, capas, scroll, ancho) {
  for (const capa of capas) {
    const cuantos = Math.ceil(ancho / capa.sep) + 2;
    const w = capa.ancho ?? capa.sep * 0.5;
    for (let i = 0; i < cuantos; i++) {
      const x = wrap(i * capa.sep - scroll * capa.v, -90, ancho + 90);
      r.rect(x, capa.y, w, capa.alto, capa.color);
    }
  }
}

/**
 * Rayas de velocidad: líneas finas que cruzan la pantalla a toda velocidad.
 *
 * Es el truco más barato y más efectivo que hay para vender rapidez, y funciona
 * porque no representa nada — el ojo las lee como "esto va rapidísimo" sin
 * preguntarse qué son. Van pocas y tenues: si se ven demasiado, el juego pasa
 * de rápido a sucio.
 */
export function drawSpeedLines(r, scroll, ancho, opciones = {}) {
  const {
    cantidad = 7,
    velocidad = 1500,
    largo = 22,
    color = '#6b5a44',
    alpha = 0.35,
    desde = 0,
    hasta = 0,
    semilla = 1.7,
  } = opciones;

  if (hasta <= desde) return;

  r.ctx.globalAlpha = alpha;
  for (let i = 0; i < cantidad; i++) {
    // Cada raya tiene su propia altura y su propio desfase, si no se ven como
    // una grilla marchando y el efecto se desarma.
    const carril = desde + ((i * semilla * 37) % (hasta - desde));
    const v = velocidad * (0.7 + ((i * 13) % 7) / 10);
    const x = wrap(i * 97 - scroll * v, -largo - 10, ancho + largo);
    r.rect(x, carril, largo, 1, color);
  }
  r.ctx.globalAlpha = 1;
}

function wrap(value, min, max) {
  const span = max - min;
  return ((((value - min) % span) + span) % span) + min;
}
