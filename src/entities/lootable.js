/**
 * Botín: cualquier cosa que se pueda robar manteniendo [E].
 *
 * La clave de diseño es que el botín cuesta TIEMPO. Una bolsa son 0,6s;
 * la caja fuerte son 4s parado en el peor lugar del vagón y haciendo ruido.
 * De ahí sale la tensión: cada segundo robando es un segundo menos para huir.
 */

import { CONFIG } from '../data/config.js';
import { LOOT_TYPES } from '../data/wagons.js';
import { pieza, tono, NEGRO } from '../world/piezas.js';

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

/** Un punto de dibujo: un cuarto de unidad, con la lupa de ×4. */
const PUNTO = 0.25;

/**
 * 🔁 LA BOLSA Y LA CAJA FUERTE, A LA RESOLUCIÓN NUEVA (etapa 4).
 *
 * Eran dos o tres rectángulos de unidades enteras: con la lupa, la bolsa de
 * monedas eran dos ladrillos amarillos de veinte por dieciséis puntos. Ahora
 * cada una es una PIEZA que se arma una sola vez (el mismo taller que el vagón
 * y la gente, `world/piezas.js`) y después sólo se estampa.
 *
 * LO QUE TIENE QUE DECIR CADA UNA no cambió, y es lo único que importa: la
 * bolsa es blanda, de arpillera y atada arriba; la caja fuerte es de chapa,
 * dura y remachada; y la reventada tiene la tapa colgando de un costado,
 * porque en un vagón donde ya volaste algo tenés que saber de un vistazo cuál
 * te va a costar ocho segundos y cuál es levantar y seguir.
 */
/**
 * 🔻 UNA BOLSA NO ES UN RECTÁNGULO. La primera versión era un cuadrado con un
 * nudo arriba y se leía como un CAJÓN DORADO, que es justo lo que no puede
 * ser: en el tren de carga hay cajones de verdad y confundirlos sería confundir
 * lo que te llevás con lo que hay que romper. Lo que la hace bolsa es la
 * SILUETA: angosta arriba, panzona abajo, con las esquinas comidas y los
 * pliegues de la arpillera bajando desde la atadura.
 */
function piezaBolsa(color) {
  const W = 40, H = 36;
  return pieza(`bolsa|${color}`, W, H, (p) => {
    const tela = tono(color, 0.74), luz = tono(color, 1.02), sombra = tono(color, 0.48);
    // La silueta, por filas: de angosta arriba a panzona abajo y de vuelta.
    const filas = [[13, 14], [11, 18], [9, 22], [7, 26], [6, 28], [6, 28], [7, 26], [9, 22]];
    const alturas = [3, 3, 3, 4, 5, 4, 3, 2];
    let y = 8;
    for (let i = 0; i < filas.length; i++) {
      const [x0, an] = filas[i], alto = alturas[i];
      p(x0 - 2, y, an + 4, alto, NEGRO);
      p(x0, y, an, alto, tela);
      y += alto;
    }
    // La luz cae de arriba a la izquierda; abajo, la sombra del bulto apoyado.
    p(10, 12, 9, 10, luz);
    p(8, 24, 24, 4, sombra);
    // Los pliegues, que bajan desde la atadura: sin ellos vuelve a ser un bulto.
    for (const [px, py, ph] of [[15, 11, 12], [21, 12, 14], [26, 14, 9]]) {
      p(px, py, 1, ph, sombra);
    }
    // La boca atada y lo que asoma: eso dice que adentro hay plata.
    p(14, 1, 12, 8, NEGRO);
    p(16, 2, 8, 6, tono(color, 0.6));
    p(15, 4, 10, 2, '#6a5334');
    p(19, 0, 3, 3, '#6a5334');
    p(18, 5, 3, 2, luz);
    p(22, 6, 2, 2, luz);
  });
}

function piezaCajaFuerte(base, adentro, reventada) {
  const W = 58, H = 50;
  return pieza(`caja|${base}|${adentro}|${reventada ? 1 : 0}`, W, H, (p) => {
    const chapa = '#3c4149', borde = '#2b2f36', luz = '#5a616b';
    p(0, 2, W, H - 2, NEGRO);
    p(2, 4, W - 4, H - 8, reventada ? borde : chapa);
    p(2, 4, W - 4, 3, luz);                        // la tapa, vista de arriba
    p(2, H - 7, W - 4, 3, borde);
    // Los cantos remachados de una caja de chapa.
    for (const x of [4, W - 8]) {
      p(x, 7, 4, H - 15, tono(chapa, 1.12));
      for (let i = 0; i < 4; i++) p(x + 1, 10 + i * 9, 2, 2, luz);
    }
    if (reventada) {
      /**
       * REVENTADA: el hueco negro y LO DE ADENTRO A LA VISTA, en el color del
       * botín y no en el de la chapa —si el interior fuera gris como el resto,
       * una caja abierta y una cerrada se diferenciarían sólo por la tapa—.
       * Y la tapa arrancada cuelga de un costado, doblada: en un vagón donde ya
       * volaste algo tenés que saber de un vistazo cuál te va a costar ocho
       * segundos y cuál es levantar y seguir.
       */
      p(11, 10, W - 22, H - 22, NEGRO);
      p(13, 12, W - 26, H - 26, tono(adentro, 0.55));
      p(15, 15, W - 30, 7, adentro);
      p(18, 26, 6, 4, tono(adentro, 1.15));
      p(27, 29, 7, 4, tono(adentro, 1.15));
      p(34, 24, 4, 3, tono(adentro, 1.15));
      /**
       * LA TAPA ARRANCADA, caída de costado sobre el borde de la caja.
       *
       * 🔻 El primer intento la colgaba FUERA del lienzo y el navegador la
       * recortaba entera: la caja reventada se veía sin tapa, que es justo el
       * detalle que la distingue. Una pieza no puede dibujar fuera de su propio
       * lienzo — si tiene que asomar, el lienzo tiene que ser más grande.
       */
      p(1, 0, 26, 12, NEGRO);
      p(3, 2, 22, 8, chapa);
      p(3, 2, 22, 3, luz);
      p(6, 6, 16, 2, tono(chapa, 0.66));
      p(23, 3, 4, 8, tono(chapa, 0.8));
    } else {
      p(11, 10, W - 22, H - 22, base);
      p(13, 12, W - 26, 5, tono(base, 1.18));
      // La cerradura: es lo que la hace una caja fuerte y no un cajón de metal.
      p(24, 22, 10, 10, borde);
      p(26, 24, 6, 6, luz);
      p(28, 26, 2, 2, borde);
      p(23, 26, 12, 2, luz);
    }
  });
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
  const img = isBox
    ? piezaCajaFuerte(col.strongbox, col.bagLoot, !!l.reventada)
    : piezaBolsa(col.bagLoot);
  r.ctx.drawImage(img, l.x - (img.width * PUNTO) / 2, l.y - (img.height * PUNTO) / 2,
    img.width * PUNTO, img.height * PUNTO);

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
/**
 * 🔁 LA MERCADERÍA DEL TREN DE CARGA, A LA RESOLUCIÓN NUEVA (etapa 4).
 *
 * *(Santi: "lo que recoges no puede parecer lo mismo que en el de pasajeros (un
 * cuadrado amarillo en el piso). Tiene que ser más físico y real")*. Eso ya
 * estaba resuelto; lo que faltaba era el TAMAÑO DEL PUNTO: cada cosa se dibujaba
 * con tres o cuatro rectángulos de unidades enteras, o sea de cuatro por cuatro
 * puntos cada uno. Un fardo de catorce por diez puntos no entra en eso.
 *
 * Cada una es ahora una pieza guardada, con la orilla oscura de dos puntos que
 * lleva todo lo demás del juego y UN detalle que la identifica: los cuellos de
 * las botellas, las sogas del fardo, la cruz del botiquín, el sello de los
 * papeles. El NIVEL (común, valioso, raro) sigue siendo el color, que es lo que
 * dice de un vistazo cuánto vale sin tener que leer nada.
 */
function piezaObjeto(dibujo, base, claro, oscuro) {
  const W = 48, H = 40, cx = 24, cy = 22;
  return pieza(`obj|${dibujo}|${base}|${claro}`, W, H, (p) => {
    /** Un bloque centrado, con su orilla: es como se dibuja casi todo acá. */
    const caja = (dx, dy, w, h, color, luz) => {
      p(cx + dx - w / 2 - 2, cy + dy - h / 2 - 2, w + 4, h + 4, NEGRO);
      p(cx + dx - w / 2, cy + dy - h / 2, w, h, color);
      if (luz) p(cx + dx - w / 2, cy + dy - h / 2, w, 3, luz);
    };

    switch (dibujo) {
      case 'cajon':                        // tapa y dos listones cruzados
        caja(0, 0, 38, 28, base, claro);
        p(cx - 19, cy - 2, 38, 2, oscuro);
        p(cx - 2, cy - 14, 4, 28, oscuro);
        break;

      case 'botellas':                     // la reja de arriba y los cuellos
        for (const dx of [-13, -5, 3, 11]) {
          p(cx + dx - 2, cy - 24, 6, 12, NEGRO);
          p(cx + dx - 1, cy - 22, 4, 10, '#5a6a4a');
          p(cx + dx - 1, cy - 22, 4, 2, '#7e8e66');
        }
        caja(0, 2, 38, 26, base, claro);
        for (const dx of [-13, -5, 3, 11]) p(cx + dx - 1, cy - 10, 4, 4, oscuro);
        break;

      case 'fardo':                        // alto, con dos sogas cruzándolo
        caja(0, 0, 32, 32, base, claro);
        p(cx - 16, cy - 9, 32, 3, oscuro);
        p(cx - 16, cy + 5, 32, 3, oscuro);
        p(cx - 16, cy - 8, 32, 1, tono(base, 1.2));
        break;

      case 'rollo':                        // un cilindro, con la espiral en la punta
        caja(0, 0, 42, 20, base, claro);
        p(cx - 21, cy - 10, 8, 20, oscuro);
        p(cx - 19, cy - 6, 4, 12, claro);
        p(cx - 18, cy - 3, 2, 6, oscuro);
        p(cx + 13, cy - 10, 8, 20, tono(base, 0.78));
        break;

      case 'saco':                         // panzón, con la boca atada arriba
        caja(0, 4, 28, 24, base, claro);
        p(cx - 7, cy - 16, 14, 10, NEGRO);
        p(cx - 5, cy - 14, 10, 8, tono(base, 0.8));
        p(cx - 6, cy - 11, 12, 3, oscuro);
        p(cx - 9, cy + 2, 4, 12, tono(base, 0.76));
        break;

      case 'estuche':                      // tapa, bisagra y broche
        caja(0, 0, 40, 18, oscuro, null);
        p(cx - 18, cy - 7, 36, 7, base);
        p(cx - 18, cy - 7, 36, 2, claro);
        p(cx - 18, cy - 1, 36, 2, tono(oscuro, 1.6));
        p(cx - 3, cy - 4, 6, 10, claro);
        break;

      case 'botiquin':                     // la cruz, que es lo único que hay que reconocer
        caja(0, 0, 32, 24, '#b9b0a0', '#d6cdbc');
        p(cx - 3, cy - 9, 6, 18, '#a83c32');
        p(cx - 11, cy - 3, 22, 6, '#a83c32');
        p(cx - 11, cy - 3, 22, 1, '#c85a4a');
        break;

      case 'lingotes':                     // tres barras apiladas, escalonadas
        caja(2, 8, 34, 10, base, claro);
        caja(-3, 0, 32, 10, tono(base, 1.1), claro);
        caja(2, -8, 28, 10, base, claro);
        p(cx - 12, cy - 10, 10, 2, '#fff2c0');
        break;

      case 'papeles':                      // el atado y el sello rojo
        caja(0, 0, 28, 22, '#cdb68d', '#e2d0ac');
        p(cx - 14, cy - 3, 28, 3, '#a8977c');
        p(cx - 14, cy + 4, 28, 2, '#a8977c');
        p(cx + 4, cy + 2, 7, 7, NEGRO);
        p(cx + 5, cy + 3, 5, 5, '#8c2f26');
        break;

      case 'bolsita':                      // chica, atada, con brillo
        caja(0, 4, 20, 16, '#a89070', '#c0a888');
        p(cx - 5, cy - 10, 10, 8, NEGRO);
        p(cx - 3, cy - 8, 6, 6, '#6b5236');
        p(cx + 1, cy + 2, 3, 3, claro);
        p(cx + 2, cy + 3, 1, 1, '#fff6d8');
        break;

      case 'joyero':                       // cofrecito con tapa clara
      default:
        caja(0, 2, 24, 16, oscuro, null);
        p(cx - 11, cy - 9, 22, 7, base);
        p(cx - 11, cy - 9, 22, 2, claro);
        p(cx - 2, cy - 4, 5, 8, claro);
        break;
    }
  });
}

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

  const img = piezaObjeto(o.dibujo, base, claro, oscuro);
  r.ctx.drawImage(img, l.x - (img.width * PUNTO) / 2, l.y - (img.height * PUNTO) / 2,
    img.width * PUNTO, img.height * PUNTO);
}
