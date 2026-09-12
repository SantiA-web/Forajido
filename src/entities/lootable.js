/**
 * Botín: cualquier cosa que se pueda robar manteniendo [E].
 *
 * La clave de diseño es que el botín cuesta TIEMPO. Una bolsa son 0,6s;
 * la caja fuerte son 4s parado en el peor lugar del vagón y haciendo ruido.
 * De ahí sale la tensión: cada segundo robando es un segundo menos para huir.
 */

import { CONFIG } from '../data/config.js';
import { LOOT_TYPES } from '../data/wagons.js';

export function createLootable(x, y, typeId, rng) {
  const type = LOOT_TYPES[typeId];

  /**
   * EL JACKPOT (ver LOOT_TYPES.strongbox en data/wagons.js) se tira ACÁ, al
   * armar el vagón — el valor ya queda fijo adentro de la caja, como el
   * sorteo normal. No sabés cuál te tocó hasta que la abrís, exactamente
   * igual que con cualquier otra caja fuerte.
   */
  const esJackpot = typeId === 'strongbox' && rng.chance(type.jackpotChance);
  const value = esJackpot
    ? rng.int(type.jackpotMin, type.jackpotMax)
    : rng.int(type.min, type.max);

  return {
    x, y,
    hw: 6, hh: 5,
    typeId,
    name: type.name,
    value,
    jackpot: esJackpot,
    /**
     * Cuánto tarda en abrirse. El tipo puede traer el suyo (`tiempo`, hoy
     * sólo la caja oculta con 8 s); si no, siguen los dos de siempre.
     */
    duration: type.tiempo ?? (typeId === 'strongbox' ? CONFIG.loot.strongboxTime : CONFIG.loot.bagTime),
    noisy: type.noisy,
    progress: 0,
    taken: false,

    /**
     * ESCONDIDO: no se dibuja, no se puede abrir, no existe para el jugador —
     * hasta que algo lo revela. Hoy lo usa la caja fuerte oculta (Fase 5, ver
     * data/paquetes.js), que aparece cuando un pasajero del vagón te dice
     * dónde está.
     *
     * Es una marca del BOTÍN y no una lista aparte en la escena a propósito:
     * así todo lo que ya recorre `world.loot` (el dibujo, el buscador de lo
     * que tenés al alcance, el conteo de resultados) sigue funcionando con un
     * solo chequeo de más, y cualquier cosa que se esconda en el futuro lo
     * hereda gratis.
     */
    oculto: false,

    /**
     * REVENTADA CON DINAMITA (ver `reventarCaja`, más abajo). Una caja fuerte
     * volada ya no hay que forzarla: queda abierta en el piso y lo único que
     * falta es levantar lo que tenía adentro.
     */
    reventada: false,
  };
}

/**
 * LA DINAMITA ABRE CAJAS FUERTES.
 *
 * *(Santi: "si no querés intentar abrirlas, podés explotarla con dinamita")*
 *
 * Es la segunda cerradura que la dinamita rompe en este juego, y por el mismo
 * motivo que la primera (la puerta del blindado): hay cosas que no se abren
 * con paciencia. Lo que cambia es el precio — uno de tus dos cartuchos, y la
 * alarma sonando sí o sí, contra ocho segundos quieto y de espaldas.
 *
 * NO TE REGALA LA PLATA, TE AHORRA EL FORCEJEO. La caja queda abierta y el
 * botín sigue ahí: hay que llegar hasta ella y levantarlo, y eso ahora cuesta
 * lo mismo que una bolsa (`bagTime`). En Forajido la plata siempre se junta
 * yendo hasta ella; volarla no es una excepción, es un atajo.
 *
 * Y si estaba escondida, el estruendo la descubre: no se puede reventar algo
 * y que siga siendo un secreto.
 */
export function reventarCaja(l) {
  if (l.taken || l.reventada) return false;
  l.reventada = true;
  l.oculto = false;
  l.duration = CONFIG.loot.bagTime;
  l.progress = 0;
  return true;
}

/** ¿Es una caja fuerte? (las dos: la de siempre y la oculta) */
export function esCajaFuerte(l) {
  return l.typeId === 'strongbox' || l.typeId === 'cajaOculta';
}

export function drawLootable(r, l) {
  const col = CONFIG.colors;
  // Escondida: no hay nada que ver. Ni una silueta, ni una sombra — si algo
  // se dibujara, dejaría de estar oculta.
  if (l.oculto) return;
  if (l.taken) {
    r.ctx.globalAlpha = 0.35;
    r.box(l.x, l.y + 2, 5, 2, '#2c221c');
    r.ctx.globalAlpha = 1;
    return;
  }

  /**
   * LA MERCADERÍA NO ES UN CUADRADO AMARILLO — se dibuja como la cosa que es.
   *
   * *(Santi: "lo que recoges no puede parecer lo mismo que en el de pasajeros
   * (un cuadrado amarillo en el piso). Tiene que ser más físico y real. Tienen
   * que haber cajas y cosas apoyadas sobre muebles para llevártelas")*
   *
   * Va ANTES de todo lo demás y con `return`: un objeto no comparte ni una
   * línea con la bolsa de monedas ni con la caja fuerte, porque justamente lo
   * que hay que poder distinguir de un vistazo es **en qué tren estás**. En el
   * de pasajeros se levanta plata; acá se levantan cosas.
   */
  if (l.objeto) { dibujarObjeto(r, l, col); return; }

  const isBox = esCajaFuerte(l);
  const base = isBox ? col.strongbox : col.bagLoot;

  if (isBox && l.reventada) {
    /**
     * REVENTADA: la chapa abierta y lo de adentro a la vista.
     *
     * Se dibuja distinta a una cerrada por un motivo concreto: en un vagón
     * donde ya volaste algo, tenés que poder saber de un vistazo cuál caja
     * todavía te va a costar ocho segundos y cuál es levantar y seguir. La
     * puerta doblada hacia un lado es toda la diferencia.
     */
    r.box(l.x, l.y, 7, 6, '#2b2f36');
    r.box(l.x + 1, l.y, 5, 4, base);
    r.rect(l.x - 7, l.y - 5, 3, 8, '#3c4149');   // la tapa arrancada, colgando
    r.box(l.x + 1, l.y, 2, 1, col.bagLoot);      // lo que hay adentro
  } else if (isBox) {
    r.box(l.x, l.y, 7, 6, '#3c4149');
    r.box(l.x, l.y, 6, 5, base);
    r.box(l.x, l.y, 2, 2, '#3c4149');
  } else {
    r.box(l.x, l.y, 5, 4, '#7a5f1e');
    r.box(l.x, l.y - 1, 4, 3, base);
  }

  // Barra de progreso mientras lo estás abriendo.
  if (l.progress > 0) {
    const w = 16;
    r.rect(l.x - w / 2, l.y - 12, w, 3, '#1a1512');
    r.rect(l.x - w / 2, l.y - 12, w * (l.progress / l.duration), 3, col.bagLoot);
  }
}

/**
 * LA MERCADERÍA DEL TREN DE CARGA, dibujada como lo que es.
 *
 * SIETE SILUETAS Y NO QUINCE, y es a propósito: lo que tiene que decir el dibujo
 * es **qué clase de cosa es** (un cajón, un fardo, un estuche, una chuchería),
 * no cuál exactamente — el nombre lo dice el cartel al levantarla. Un cajón de
 * munición y uno de whisky se ven parecidos porque son las dos cosas parecidas
 * de cargar, que es la única diferencia que importa adentro del vagón.
 *
 * Y EL COLOR LO DA EL NIVEL, como en el TAB: madera para lo común, gris de
 * chapa para lo valioso y dorado para el raro. Así el nivel se lee del color y
 * la forma se lee de la silueta, sin que ninguno de los dos tape al otro.
 *
 * TODAS LLEVAN SOMBRA. Es lo que las apoya en el piso en vez de dejarlas
 * flotando, y es la mitad de por qué esto se siente "físico" y el cuadrado
 * amarillo no.
 */
function dibujarObjeto(r, l, col) {
  const o = l.objeto;
  const base = o.nivel === 'raro' ? '#d8b24a'
    : o.nivel === 'valioso' ? col.strongbox : '#8a6a40';
  const claro = o.nivel === 'raro' ? '#ffe89a'
    : o.nivel === 'valioso' ? '#b9c4d0' : '#a8834f';
  const oscuro = '#3a2b1c';

  // La sombra, primero y siempre: sin ella cualquier cosa parece flotar.
  r.ctx.globalAlpha = 0.3;
  r.box(l.x, l.y + 5, 7, 2, '#000');
  r.ctx.globalAlpha = 1;

  switch (o.dibujo) {
    /** Cajón de madera: tapa, y dos listones cruzados. */
    case 'cajon':
      r.box(l.x, l.y, 7, 5, oscuro);
      r.box(l.x, l.y, 6, 4, base);
      r.rect(l.x - 6, l.y - 1, 12, 1, claro);
      r.rect(l.x - 1, l.y - 4, 2, 8, oscuro);
      break;

    /** Cajón de botellas: la reja de arriba y los cuellos asomando. */
    case 'botellas':
      r.box(l.x, l.y, 7, 5, oscuro);
      r.box(l.x, l.y, 6, 4, base);
      for (const dx of [-4, -1, 2, 5]) r.rect(l.x + dx - 1, l.y - 5, 2, 3, '#5a6a4a');
      break;

    /** Fardo atado: alto, con dos sogas cruzándolo. */
    case 'fardo':
      r.box(l.x, l.y, 6, 5, base);
      r.rect(l.x - 6, l.y - 3, 12, 1, oscuro);
      r.rect(l.x - 6, l.y + 1, 12, 1, oscuro);
      r.box(l.x, l.y - 5, 5, 1, claro);
      break;

    /** Rollo de tela: un cilindro, con la espiral marcada en la punta. */
    case 'rollo':
      r.box(l.x, l.y, 8, 3, base);
      r.rect(l.x - 8, l.y - 3, 3, 6, claro);
      r.rect(l.x + 5, l.y - 3, 3, 6, oscuro);
      break;

    /** Saco: panzón, con la boca atada arriba. */
    case 'saco':
      r.box(l.x, l.y + 1, 6, 4, base);
      r.box(l.x, l.y - 3, 3, 2, base);
      r.rect(l.x - 2, l.y - 4, 4, 1, oscuro);
      break;

    /** Estuche chato: tapa, bisagra y broche. */
    case 'estuche':
      r.box(l.x, l.y, 7, 3, oscuro);
      r.box(l.x, l.y - 1, 6, 2, base);
      r.rect(l.x - 1, l.y - 1, 2, 3, claro);
      break;

    /** Botiquín: la cruz, que es lo único que hay que reconocer. */
    case 'botiquin':
      r.box(l.x, l.y, 6, 4, '#b9b0a0');
      r.rect(l.x - 1, l.y - 3, 2, 6, '#a83c32');
      r.rect(l.x - 4, l.y - 1, 8, 2, '#a83c32');
      break;

    /** Lingotes: tres barras apiladas, escalonadas. Es el raro más grande. */
    case 'lingotes':
      r.box(l.x, l.y + 2, 7, 2, base);
      r.box(l.x - 1, l.y, 6, 2, claro);
      r.box(l.x, l.y - 2, 5, 2, base);
      r.rect(l.x - 6, l.y + 1, 12, 1, oscuro);
      break;

    /** Papeles lacrados: el atado y el sello rojo. */
    case 'papeles':
      r.box(l.x, l.y, 5, 4, '#cdb68d');
      r.rect(l.x - 5, l.y - 1, 10, 1, '#a8977c');
      r.box(l.x + 2, l.y + 1, 1, 1, '#8c2f26');
      break;

    /** Bolsita de polvo de oro: chica, atada, con brillo. */
    case 'bolsita':
      r.box(l.x, l.y + 1, 4, 3, '#a89070');
      r.rect(l.x - 1, l.y - 3, 2, 2, '#6b5236');
      r.box(l.x + 1, l.y, 1, 1, claro);
      break;

    /** Joyero / reloj: cofrecito con tapa clara. Lo más chico del vagón. */
    case 'joyero':
    default:
      r.box(l.x, l.y, 4, 3, oscuro);
      r.box(l.x, l.y - 1, 3, 2, base);
      r.box(l.x, l.y, 1, 1, claro);
      break;
  }

  // El progreso, igual que cualquier otro botín: el mismo lenguaje para todo.
  if (l.progress > 0) {
    const w = 16;
    r.rect(l.x - w / 2, l.y - 12, w, 3, '#1a1512');
    r.rect(l.x - w / 2, l.y - 12, w * (l.progress / l.duration), 3, col.bagLoot);
  }
}
