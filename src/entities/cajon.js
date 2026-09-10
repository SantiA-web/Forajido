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
export function dibujarCuerpoCajon(r, x, y, hw, hh, cargado, golpeado, tieneCartucho = cargado) {
  const col = CONFIG.colors;
  const madera = golpeado ? '#fff' : '#a8814e';
  const tapa   = golpeado ? '#fff' : '#c49b63';
  const borde  = golpeado ? '#fff' : '#241b14';

  // LOS CARTUCHOS, asomando por detrás de la tapa. Van ANTES del cuerpo para
  // que la tapa los tape por abajo y se lea que salen de adentro del cajón.
  if (tieneCartucho && !golpeado) {
    for (const dx of [-4, 0, 4]) {
      r.rect(x + dx - 1, y - hh - 4, 3, 5, col.dynamite);
      r.rect(x + dx - 1, y - hh - 3, 3, 1, col.dynamiteBand);
    }
  }

  // El contorno, y encima el cuerpo: el borde oscuro es lo que lo separa del
  // piso marrón, que es del mismo tono que cualquier madera del tren.
  r.rect(x - hw - 1, y - hh - 1, hw * 2 + 2, hh * 2 + 2, borde);
  r.rect(x - hw, y - hh, hw * 2, hh * 2, madera);
  r.rect(x - hw, y - hh, hw * 2, 2, tapa);

  if (cargado && !golpeado) {
    // LA FRANJA ROJA, cruzada de lado a lado: se lee aunque el cajón quede
    // medio tapado por un guardia que le pasa por delante.
    r.rect(x - hw, y - 1, hw * 2, 4, col.dynamite);
    r.rect(x - hw, y - 1, hw * 2, 1, col.dynamiteBand);
  } else if (!golpeado) {
    /**
     * VACÍO: la tapa abierta y el hueco oscuro adentro, en el mismo lugar
     * donde el cargado tiene la franja. No alcanza con SACAR el rojo — un
     * cajón liso se leería como "todavía no lo abrí". El agujero dice
     * "de acá ya saqué lo que había".
     */
    r.rect(x - hw + 2, y - 1, hw * 2 - 4, 4, '#2f2419');
    r.rect(x - hw + 2, y - 1, hw * 2 - 4, 1, '#6b5842');
  }
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
  if (c.vida < c.vidaMax) {
    const ancho = 3;
    const total = c.vidaMax * (ancho + 1) - 1;
    for (let i = 0; i < c.vidaMax; i++) {
      r.rect(c.x - total / 2 + i * (ancho + 1), c.y - h - 6, ancho, 2,
        i < c.vida ? '#e0c44a' : '#4a3a2a');
    }
  }
}
