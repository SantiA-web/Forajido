/**
 * 🎯 LA MIRA NUEVA, LA MISMA EN EL TREN, EN EL CAMPO Y EN LA HUIDA *(Santi, 2026-11-26: "propongo que sea un puntito como
 * el de GTA V que esté relleno. Al apretar click derecho el puntito se achica más. Sería igual en todas las armas menos
 * en la escopeta que sería como un paréntesis \"(   )\"... No eliminaría la dispersión, solo que ahora no se ve"; y "se
 * achica y se agranda según la distancia, eso no debería haber estado desde un principio")*.
 *
 * 🔁 Antes era un círculo que mostraba la dispersión (en el campo, además, crecía con la distancia). Ahora el tamaño
 * es fijo: suelta o apuntando (clic derecho). La dispersión sigue igual en los tiros; sólo dejó de dibujarse.
 *
 * Dibujada a mano, punto por punto, en la grilla de la pantalla (CONFIG.estilo.punto píxeles por punto): mide lo mismo
 * con cualquier lupa. `x`, `y`: donde apunta, en lo que tenga puesto el lienzo (mundo o pantalla).
 * Letras: o el borde (el más oscuro de la paleta, para que se vea sobre la arena y de noche), x el relleno.
 */
import { PALETA } from '../../engine/paleta.js';
import { CONFIG } from '../../data/config.js';

/** El punto, suelto. */
const PUNTO = [
  '.ooo.',
  'oxxxo',
  'oxxxo',
  'oxxxo',
  '.ooo.',
];
/** El punto, apuntando. */
const PUNTO_CHICO = [
  '.o.',
  'oxo',
  '.o.',
];
/** El paréntesis de la escopeta, el de la izquierda (el de la derecha es el mismo, dado vuelta). */
const PARENTESIS = [
  '..oo',
  '.oxo',
  'oxo.',
  'oxo.',
  'oxo.',
  'oxo.',
  'oxo.',
  '.oxo',
  '..oo',
];

/**
 * `apuntado`: de 0 a 1 (el clic derecho); pasada la mitad, la mira cerrada. `escopeta`: los paréntesis. `bloqueada`:
 * el relleno en rojo, cuando el gatillo no va a hacer nada (recargando, escondido, tumbado).
 */
export function dibujarMira(r, x, y, { apuntado = 0, escopeta = false, bloqueada = false } = {}) {
  const ctx = r.ctx, T = ctx.getTransform(), k = CONFIG.estilo.punto, M = CONFIG.mira;
  const cx = Math.floor((T.a * x + T.c * y + T.e) / k), cy = Math.floor((T.b * x + T.d * y + T.f) / k);
  const cerrada = apuntado > 0.5;
  const relleno = PALETA[bloqueada ? M.rellenoBloqueado : cerrada ? M.rellenoApuntando : M.relleno], borde = PALETA[0];
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  const pintar = (mapa, ox, oy, espejo) => mapa.forEach((fila, j) => {
    for (let i = 0; i < fila.length; i++) {
      const ch = fila[espejo ? fila.length - 1 - i : i];
      if (ch === '.') continue;
      ctx.fillStyle = ch === 'o' ? borde : relleno;
      ctx.fillRect((ox + i) * k, (oy + j) * k, k, k);
    }
  });
  if (escopeta) {
    const s = cerrada ? M.escopetaApuntando : M.escopeta, w = PARENTESIS[0].length, h = PARENTESIS.length;
    pintar(PARENTESIS, cx - s - (w - 1), cy - (h >> 1), false);
    pintar(PARENTESIS, cx + s, cy - (h >> 1), true);
  } else {
    const m = cerrada ? PUNTO_CHICO : PUNTO, h = m.length;
    pintar(m, cx - (h >> 1), cy - (h >> 1), false);
  }
  ctx.restore();
}
