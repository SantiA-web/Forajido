/**
 * 🩸 EL DAÑO SE VE EN LA COSA, NO EN UNA BARRITA.
 *
 * *(Santi: "eliminar lo que hoy parece arcade, que podría ser los cuadros de
 * vida que aparecen encima del personaje". Y para los objetos: "en vez de
 * barritas, pondría textura: intacta, dañada, muy dañada, rota".)*
 *
 * Dos dibujos, uno para cosas y otro para gente:
 *
 *  - LAS COSAS (puertas, cajones, barriles) pasan por cuatro etapas: intacta,
 *    dañada, muy dañada y rota. La última ya existía —la puerta que se abre de
 *    un balazo, el cajón que se hace astillas—; las dos del medio son agujeros
 *    de bala, rajaduras y astillas levantadas, cada vez más.
 *  - LA GENTE sangra: una mancha por cada tiro que recibió.
 *
 * ⚠️ LA ETAPA TIENE QUE DECIR LO MISMO QUE DECÍA LA BARRITA. Sobre todo en el
 * cajón de pólvora, donde la barrita era la cuenta regresiva de una explosión:
 * "muy dañado" quiere decir "un tiro más y se rompe" en todo lo que aguanta 2 o
 * 3, que es casi todo.
 */

const AGUJERO = '#1a120c';
const BORDE = '#6b5540';
const ASTILLA = '#d4b48a';
const SANGRE = '#8a1c14';
const SANGRE_LUZ = '#c8402c';

/**
 * 0 intacta, 1 dañada, 2 muy dañada. (Rota no se dibuja acá: una cosa rota ya
 * no está, o está abierta.)
 */
export function etapaDeDanio(vida, vidaMax) {
  if (!(vida < vidaMax)) return 0;
  return vida / vidaMax > 0.5 ? 1 : 2;
}

/** Un número fijo por cosa, para que los agujeros no bailen entre cuadros. */
const semillas = new WeakMap();
let proxima = 1;
function semillaDe(obj) {
  let s = semillas.get(obj);
  if (!s) { s = (proxima++ * 2654435761) >>> 0; semillas.set(obj, s); }
  return s;
}
function sorteo(s, i) {
  let h = (s + i * 374761393) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * LA TEXTURA DE DAÑO sobre una cosa, en su rectángulo visible (unidades del
 * mundo). `madera: false` para lo que no se astilla.
 */
export function dibujarDanio(r, obj, x0, y0, ancho, alto, etapa, madera = true) {
  if (!(etapa > 0) || ancho <= 3 || alto <= 3) return;
  const s = semillaDe(obj);
  const P = 0.25;
  const px = (v) => Math.round(v / P) * P;
  const dentro = (i, margen) => ({
    x: px(x0 + margen + sorteo(s, i) * (ancho - margen * 2)),
    y: px(y0 + margen + sorteo(s, i + 50) * (alto - margen * 2)),
  });

  /**
   * 🔺 GRANDE, PARA LEERSE EN PLENO TIROTEO. La primera versión tenía agujeros
   * de 2 puntos y rajaduras de 1: ampliada al doble apenas se veía, y la
   * textura reemplaza a una barrita que se leía de un vistazo. Ahora el
   * agujero mide una unidad (4 puntos) con el borde astillado claro alrededor.
   */
  const agujeros = etapa === 1 ? 2 : 4;
  for (let i = 0; i < agujeros; i++) {
    const a = dentro(i, 2);
    r.rect(a.x - P * 2, a.y - P * 2, P * 8, P * 8, madera ? ASTILLA : BORDE);
    r.rect(a.x - P, a.y - P, P * 6, P * 6, BORDE);
    r.rect(a.x, a.y, P * 4, P * 4, AGUJERO);
  }

  // Las rajaduras, de dos puntos de grueso: una dañada, tres muy dañada.
  const rajas = etapa === 1 ? 1 : 3;
  for (let i = 0; i < rajas; i++) {
    const a = dentro(i + 10, 1.5);
    const largo = 8 + Math.floor(sorteo(s, i + 20) * 8);
    const baja = sorteo(s, i + 30) < 0.5 ? 1 : -1;
    for (let k = 0; k < largo; k++) {
      const dy = Math.floor(k / 2) * baja;
      r.rect(a.x + k * P, a.y + dy * P, P, P * 2, AGUJERO);
    }
  }

  // Muy dañada: un pedazo arrancado en una esquina y astillas levantadas.
  if (etapa === 2) {
    const izq = sorteo(s, 40) < 0.5;
    const w = Math.min(ancho * 0.35, 3);
    const h = Math.min(alto * 0.3, 2.5);
    const cx = izq ? x0 : x0 + ancho - w;
    r.rect(px(cx), px(y0), px(w), px(h), AGUJERO);
    r.rect(px(izq ? cx : cx + w * 0.4), px(y0 + h), px(w * 0.6), px(h * 0.6), AGUJERO);
    if (madera) {
      for (let i = 0; i < 4; i++) {
        const a = dentro(i + 60, 1);
        r.rect(a.x, a.y, P * 6, P * 2, ASTILLA);
      }
    }
  }
}

/**
 * LA SANGRE DE LA GENTE: una mancha por tiro recibido, en el torso, hasta
 * tres. `pechoY` y `manoY` salen del dibujo de la persona (figura.js), así la
 * mancha cae en el cuerpo aunque esté agachado o de rodillas.
 *
 * 🔺 Grande y roja: la primera versión, de 3 puntos, sobre el uniforme azul
 * no se distinguía de la costura.
 */
export function dibujarHeridas(r, persona, x, pechoY, manoY, heridas) {
  const n = Math.min(3, Math.max(0, Math.floor(heridas)));
  if (n === 0) return;
  const s = semillaDe(persona);
  const P = 0.25;
  /**
   * Cada herida en SU lugar —el pecho, la panza, el hombro—, con apenas un
   * poco de variación. Sorteadas libres, dos caían una encima de la otra y se
   * leían como una sola: y cuántas son es justo lo que tienen que decir.
   */
  const LUGARES = [[-2.5, 0.05], [0.5, 0.75], [-0.5, 0.4]];
  const alto = Math.max(2, manoY - pechoY + 2);
  for (let i = 0; i < n; i++) {
    const [lx, ly] = LUGARES[i];
    const hx = Math.round((x + lx + (sorteo(s, i) - 0.5) * 0.75) / P) * P;
    const hy = Math.round((pechoY - 1 + ly * alto + (sorteo(s, i + 50) - 0.5) * 0.5) / P) * P;
    r.rect(hx, hy, P * 6, P * 5, SANGRE);
    r.rect(hx + P, hy + P, P * 3, P * 2, SANGRE_LUZ);
    // El chorro que baja.
    r.rect(hx + P * 2, hy + P * 5, P * 2, P * (3 + (i % 2) * 2), SANGRE);
  }
}
