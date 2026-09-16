/**
 * EL CAJÓN DE PÓLVORA — lo que hay adentro del vagón de armas (Fase 6a).
 *
 * Este archivo dice QUÉ es un cajón y cómo se dibuja. Qué pasa cuando se
 * prende vive en systems/explosives.js, igual que el guardia y su IA viven
 * separados.
 *
 * ES UN SOLO OBJETO CON DOS VERBOS OPUESTOS, y ahí está todo su diseño:
 *
 *   [E] sostenido  → te llevás un cartucho (el único lugar del juego donde se
 *                    repone algo: ver `CONFIG.player.dynamiteMax`).
 *   tres balazos   → se prende, y arrastra al resto de los cajones del vagón.
 *
 * No hace falta elegir de antemano cuál de los dos: el mismo cajón sirve para
 * las dos cosas hasta que uno de los dos pasa. Si entrás con la dinamita
 * llena, lo que te sobra sigue siendo una bomba puesta en el mapa.
 *
 * NO FRENA EL PASO, igual que una caja fuerte o una bolsa: se le camina por
 * encima. Sí FRENA LAS BALAS (systems/combat.js), que es lo que le permite
 * ser cobertura — una cobertura que aguanta tres tiros y después te mata.
 */

import { CONFIG } from '../data/config.js';
import { EXPLOSIVES } from '../data/explosives.js';
import { dibujarVida } from './figura.js';
import { pieza, tono, NEGRO } from '../world/piezas.js';

export function createCajon(x, y, tieneCartucho = true) {
  const t = EXPLOSIVES.cajonPolvora;

  return {
    x, y,
    hw: 7, hh: 6,

    /**
     * ¿HAY UN CARTUCHO ARMADO ADENTRO, O SÓLO PÓLVORA SUELTA?
     *
     * *(Santi: "no siempre vas a poder sacar un trozo de dinamita de un barril.
     * Al acercarte te vas a dar cuenta de si se puede o no")*
     *
     * NO ES LO MISMO QUE `cargado`, y la diferencia es todo el sistema:
     * `cargado` dice si EXPLOTA —lo tienen todos— y esto dice si te podés
     * llevar algo. Un barril sin cartucho es igual de peligroso y no te da
     * nada.
     *
     * Es lo que permitió repartir pólvora por todo el tren sin volver
     * infinita la dinamita (ver `chanceCartucho` en data/explosives.js).
     */
    tieneCartucho,

    vida: t.vida,
    vidaMax: t.vida,
    alive: true,

    /**
     * ¿TODAVÍA TIENE PÓLVORA ADENTRO?
     *
     * *(Santi: "vos sacás la dinamita de un barril y ya no se puede explotar,
     * pero el barril sigue estando")*
     *
     * Es la pieza que le da al vagón su decisión más linda: **sacarle el
     * cartucho a un cajón es desactivar una bomba**. Un cajón vacío sigue ahí
     * —sigue frenando balas, sigue siendo cobertura, se sigue pudiendo
     * empujar— pero ya no vuela ni entra en la cadena.
     *
     * Y de paso pone el techo que hacía falta: cada cajón da UNA dinamita y
     * queda vacío, así que el vagón entrega cinco en total y se acaba. Sin
     * esto sería una fuente inagotable con sólo volver a pasar.
     */
    cargado: true,

    /** Lo que llevás abierto con [E]. Se reinicia si soltás, como una bolsa. */
    progreso: 0,

    /** En qué vagón está: es lo que decide a quién arrastra la cadena. */
    wagon: 0,

    hitFlash: 0,
  };
}

/**
 * Devuelve true si con este golpe se rompió.
 *
 * QUÉ PASA DESPUÉS DEPENDE DE SI TENÍA PÓLVORA: uno cargado se prende (y
 * arrastra al vagón entero), uno vacío se hace astillas y ya. Esta función no
 * decide eso — sólo dice que se rompió; quien la llama mira `c.cargado`.
 */
export function dañarCajon(c, cantidad) {
  if (!c.alive) return false;
  c.vida -= cantidad;
  c.hitFlash = CONFIG.feel.hitFlash;
  if (c.vida <= 0) {
    c.vida = 0;
    return true;
  }
  return false;
}

/**
 * LE SACASTE EL CARTUCHO. Deja de ser una bomba para siempre, y sigue siendo
 * todo lo demás: un bulto que frena balas, tapa el paso y se puede empujar.
 */
export function vaciarCajon(c) {
  c.cargado = false;
  // Sacaste el único que había: ya no queda nada que llevarse ni que explote.
  c.tieneCartucho = false;
}

export function updateCajon(c, dt) {
  c.hitFlash = Math.max(0, c.hitFlash - dt);
}

// ------------------------------------------------------------------- dibujo

/**
 * TIENE QUE GRITAR "ESTO ES PÓLVORA" DE UN VISTAZO.
 *
 * El vagón entero está dibujado con cajones ('C' en el layout), así que un
 * cajón más, marrón sobre marrón, sería invisible — es exactamente el error
 * de las cartucheras marrones sobre el piso marrón que ya nos comimos una vez.
 *
 * 🐛 Y LA PRIMERA VERSIÓN LO COMETIÓ IGUAL. Mirándola ampliada ×10 con
 * `foto.ps1`: el cuerpo era `#4a3a2a` sobre un piso `#6d4a30`/`#7a5436` — otro
 * marrón, apenas más oscuro— así que el cajón se leía como una SOMBRA en el
 * piso y no como un bulto. Y las dos mechas de 1 px que asomaban por la tapa
 * directamente no existían en pantalla. Ninguna medición podía dar eso.
 *
 * LO QUE LO ARREGLA SON TRES COSAS, y ninguna es "más color":
 *  1. Un CONTORNO casi negro. Es lo único que despega de verdad un objeto de
 *     un fondo del mismo tono — la sombra sola no alcanzaba.
 *  2. Madera CLARA en vez de oscura. Contra un piso marrón medio, lo que se
 *     separa es lo claro; lo oscuro se lee como agujero o como sombra.
 *  3. TRES CARTUCHOS ROJOS asomando por arriba, gordos y con su banda clara —
 *     los mismos dos colores que tiene el cartucho que llevás en la mano. La
 *     franja roja cruzada dice "peligro"; los cartuchos dicen QUÉ hay adentro,
 *     que es la mitad que faltaba (el cajón también es la reposición).
 */
/**
 * EL CUERPO DEL CAJÓN. Lo comparten el que está quieto en el vagón y el que
 * va rodando por el pasillo (`drawRodante`), para que sean obviamente la misma
 * cosa en dos situaciones y no dos dibujos parecidos.
 *
 * SON TRES ESTADOS Y CADA SEÑAL DICE UNA COSA DISTINTA:
 *
 *   franja roja cruzada  → ESTO EXPLOTA. La tienen todos los cargados, se ve
 *                          de lejos, y es lo único que importa en un tiroteo.
 *   cartuchos asomando   → y además hay uno para llevarte. Son chicos: se ven
 *                          cuando estás al lado, no desde la otra punta.
 *   tapa abierta y hueco → ya le sacaste el cartucho. No explota más.
 *
 * El del medio es el que trajo la pólvora al resto del tren: un barril con
 * franja y sin cartuchos es igual de peligroso y no te da nada (ver
 * `chanceCartucho` en data/explosives.js).
 */
/** Un punto de dibujo: un cuarto de unidad, con la lupa de ×4. */
export const PUNTO = 0.25;

/**
 * 🔁 EL CAJÓN, A LA RESOLUCIÓN NUEVA (etapa 4).
 *
 * Eran cinco rectángulos de unidades enteras. Ahora es una PIEZA que se arma
 * una sola vez (`world/piezas.js`) con las tablas de la tapa, los flejes de
 * hierro de los cantos y la orilla oscura de dos puntos que tiene todo lo
 * demás. El tamaño va en la clave porque el cajón que RUEDA se achata y se
 * ensancha con el tumbo, y cada medida es un dibujo distinto.
 *
 * LO QUE DICE SIGUE SIENDO LO MISMO, que es lo único que no se podía tocar:
 * la franja roja cruzada = cargado (si te lo empujan encima, te mata); el
 * hueco oscuro = vacío, "de acá ya saqué lo que había"; y los cartuchos
 * asomando por detrás de la tapa, dibujados ANTES del cuerpo para que se lea
 * que salen de adentro.
 */
function piezaCajon(W, H, cargado, golpeado, cartucho, dyn, band) {
  const clave = `cajonc|${W}|${H}|${cargado ? 1 : 0}|${golpeado ? 1 : 0}|${cartucho ? 1 : 0}|${dyn}`;
  const ARRIBA = 20;                       // lugar para los cartuchos que asoman
  return pieza(clave, W + 4, H + 4 + ARRIBA, (p) => {
    const y0 = ARRIBA;
    const madera = golpeado ? '#fff' : '#a8814e';
    const tapa   = golpeado ? '#fff' : '#c49b63';

    if (cartucho && !golpeado) {
      for (const dx of [-16, 0, 16]) {
        const cx = Math.round(W / 2) + dx;
        p(cx - 2, y0 - 14, 6, 18, NEGRO);
        p(cx, y0 - 12, 3, 16, dyn);
        p(cx, y0 - 9, 3, 3, band);
      }
    }

    p(0, y0, W + 4, H + 4, NEGRO);
    p(2, y0 + 2, W, H, madera);
    // Las tablas de la tapa, a lo largo.
    for (let i = 0; i * 13 < H; i++) {
      const ty = y0 + 3 + i * 13;
      const alto = Math.min(12, y0 + 2 + H - ty);
      if (alto <= 1) break;
      p(3, ty, W - 2, alto, golpeado ? '#fff' : tono(madera, 0.96 + (i % 3) * 0.06));
      p(3, ty, W - 2, 1, golpeado ? '#fff' : tapa);
    }
    // Los flejes de hierro de los cantos: es lo que lo hace un cajón de carga
    // y no una caja de madera cualquiera.
    p(2, y0 + 2, 4, H, golpeado ? '#fff' : tono(madera, 0.62));
    p(W - 2, y0 + 2, 4, H, golpeado ? '#fff' : tono(madera, 0.62));

    if (cargado && !golpeado) {
      const fy = y0 + Math.round(H / 2) - 6;
      p(2, fy, W, 12, dyn);
      p(2, fy, W, 3, band);
      p(2, fy + 11, W, 1, tono(dyn, 0.6));
    } else if (!golpeado) {
      const fy = y0 + Math.round(H / 2) - 6;
      p(8, fy, W - 12, 12, '#2f2419');
      p(8, fy, W - 12, 2, '#6b5842');
      p(10, fy + 3, W - 16, 6, '#211a12');
    }
  });
}

export function dibujarCuerpoCajon(r, x, y, hw, hh, cargado, golpeado, tieneCartucho = cargado) {
  const col = CONFIG.colors;
  const W = Math.max(8, Math.round((hw * 2) / PUNTO));
  const H = Math.max(8, Math.round((hh * 2) / PUNTO));
  const img = piezaCajon(W, H, cargado, golpeado, tieneCartucho && !golpeado,
    col.dynamite, col.dynamiteBand);
  // La pieza tiene lugar arriba para los cartuchos: se ancla por el cuerpo.
  r.ctx.drawImage(img, x - (img.width * PUNTO) / 2, y - hh - 21 * PUNTO,
    img.width * PUNTO, img.height * PUNTO);
}
export function drawCajon(r, c) {
  const w = c.hw, h = c.hh;
  const golpeado = c.hitFlash > 0;

  // La sombra: lo despega del piso y lo hace leer como un bulto y no como una
  // mancha pintada en el suelo. Mismo truco que los barriles.
  r.ctx.globalAlpha = 0.35;
  r.box(c.x, c.y + h, w - 1, 2, '#000');
  r.ctx.globalAlpha = 1;

  dibujarCuerpoCajon(r, c.x, c.y, w, h, c.cargado, golpeado, c.tieneCartucho);

  /**
   * CUÁNTO LE QUEDA, sólo si ya le pegaste. Las mismas rayitas que usan los
   * guardias y los barriles: si el juego ya tiene una forma de decir "cuánto
   * aguanta esto", inventar otra sólo obliga a aprender dos.
   *
   * Y acá importan más que en ningún otro lado, porque son la cuenta
   * regresiva de una explosión: el que le pegó dos tiros sin querer tiene que
   * poder ver que le queda uno.
   */
  if (c.vida < c.vidaMax) dibujarVida(r, c.x, c.y - h - 3, c.vida, c.vidaMax, { ancho: 13 });
}
