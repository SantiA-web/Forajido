/**
 * LO QUE SE SUELTA ADENTRO DEL TREN: barriles y cajones.
 *
 * Este archivo define QUÉ es un rodante y cómo se dibuja. Cuándo aparece y qué
 * pasa cuando te alcanza lo maneja `scenes/raidScene.js`, igual que con los
 * carteles del techo.
 *
 * POR QUÉ TIENE VIDA. Un obstáculo que sólo se esquiva es un reflejo; uno que
 * además se puede reventar es una DECISIÓN, porque la munición es cara (el
 * Colt lleva 6 tiros y tarda 3,5 segundos en recargar). Ver el barril venir y
 * elegir entre gastarle dos balas o salirte del pasillo es exactamente el tipo
 * de pregunta que este juego hace en todos lados.
 *
 * SE VEN DISTINTOS Y SE MUEVEN DISTINTO, aunque hagan lo mismo. El barril rueda
 * (las duelas le corren por encima) y el cajón tumbea de canto, a los saltos.
 * Es la misma regla que separa a un guardia común de uno blindado: si dos cosas
 * se comportan igual pero se llaman distinto, no existe la diferencia.
 */

import { CONFIG } from '../data/config.js';
import { dibujarCuerpoCajon } from './cajon.js';
import { dibujarDanio, etapaDeDanio } from './danio.js';
import { pieza, tono, NEGRO } from '../world/piezas.js';
import { PALETA, sombrear } from '../engine/paleta.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';
import { pintarTapando, pintarBaulRodando } from '../world/caidas.js';

export const TIPOS_RODANTE = ['barril', 'cajon'];

/**
 * @param opciones  `dir` (-1 hacia la cola, +1 hacia la locomotora), `velocidad`
 *   y `vida` propias. Sin nada, sale un barril de los de siempre: rueda hacia
 *   la cola a la velocidad de `CONFIG.rodante`. La RES de una estampida
 *   (`tipo: 'res'`) es el mismo cuerpo con otros tres números y otro dibujo —
 *   no hizo falta una entidad nueva, y así comparte gratis la colisión, el
 *   empujón y el "sólo te pega una vez".
 */
export function createRodante(x, y, tipo, rng, opciones = {}) {
  const c = CONFIG.rodante;
  const vida = opciones.vida ?? c.vida;
  return {
    x, y,
    hw: opciones.hw ?? c.hw,
    hh: opciones.hh ?? c.hh,
    tipo,
    vida,
    vidaMax: vida,
    alive: true,

    /** Para qué lado va y a qué velocidad. Un barril: -1. Una res: +1. */
    dir: opciones.dir ?? -1,
    velocidad: opciones.velocidad ?? c.velocidad,

    /**
     * Una res no se revienta a tiros como un barril: es un bicho vivo que
     * pasa de largo. `balea: false` la saca del sistema de disparo sin
     * inventarle una regla aparte (ver systems/combat.js).
     */
    balea: opciones.balea ?? true,

    /** Cuánto lleva rodado. Es lo que mueve las duelas y el tumbo del cajón. */
    giro: rng ? rng.range(0, 6.28) : 0,
    hitFlash: 0,

    /** Cuánto le queda de recorrido antes de perderse (sólo la estampida). */
    alcance: opciones.alcance ?? Infinity,

    /** Ya te pegó: no te puede volver a pegar con el mismo. */
    golpeo: false,

    /** A quiénes ya atropelló, para no aturdir dos veces al mismo guardia. */
    atropellados: null,

    /**
     * SÓLO EL CAJÓN DE PÓLVORA EMPUJADO (`tipo: 'polvora'`, Fase 6a).
     *
     * `cargado` decide lo único que importa de él: si al romperse explota o se
     * hace astillas. Y `puertasRotas` evita que le pegue dos veces a la misma
     * puerta mientras la cruza — el mismo truco que ya usan las balas.
     */
    cargado: opciones.cargado ?? false,
    /** Si el que empujaste todavía tenía su cartucho, sigue teniéndolo rodando. */
    tieneCartucho: opciones.tieneCartucho ?? false,
    puertasRotas: null,

    /**
     * 🧳 SÓLO LA VALIJA DEL FRENAZO (`tipo: 'valija'`): no rueda, se desliza, y el piso la va frenando (`roce`, en
     * unidades por segundo cada segundo) hasta que queda tirada (`quieta`). `variante`: cuál de las tres.
     */
    roce: opciones.roce ?? 0,
    quieta: false,
    variante: opciones.variante ?? 0,
  };
}

/** Devuelve true si con este tiro se rompió. */
export function dañarRodante(ro, cantidad) {
  if (!ro.alive) return false;
  ro.vida -= cantidad;
  ro.hitFlash = CONFIG.feel.hitFlash;
  if (ro.vida <= 0) {
    ro.vida = 0;
    ro.alive = false;
    return true;
  }
  return false;
}

export function updateRodante(ro, dt) {
  ro.hitFlash = Math.max(0, ro.hitFlash - dt);
  // `freno`: lo pone la escena cada cuadro según la casilla (el carbón, 0,5).
  const paso = ro.velocidad * (ro.freno ?? 1) * dt;
  ro.x += ro.dir * paso;
  ro.alcance -= paso;
  ro.giro += (ro.velocidad / 9) * dt;
  /**
   * 🥃 EL BAÚL GRANDE NO SE DESLIZA: SE VUELCA (`vuelta`, en octavos: ver `pintarBaulRodando`). Al frenarse termina el
   * cuarto de vuelta que estaba dando hasta quedar de plano (nunca se queda de canto), y cada vez que un lado golpea el
   * piso lo cuenta (`golpesDeLado`: la escena pone el ruido y el polvo). Quieto, su choque depende de cómo quedó.
   */
  if (ro.variante === 3 && ro.tipo === 'valija') {
    if (!ro.quieta) {
      const K = CONFIG.caidas.baulVuelca, v0 = ro.vuelta || 0;
      // En qué cuarto de vuelta está, contado para el lado que va (para saber cuándo un lado tocó el piso).
      const cuarto = (v) => (ro.dir > 0 ? Math.floor(v / 2) : Math.ceil(v / 2));
      ro.velocidad = Math.max(0, ro.velocidad - ro.roce * dt);
      let p = paso;                                   // lo que ya avanzó arriba, a su velocidad
      const termina = ro.velocidad < 28;
      if (termina) {                                  // sin envión: termina el cuarto de vuelta, despacio
        const extra = Math.max(0, 28 * (ro.freno ?? 1) * dt - paso);
        ro.x += ro.dir * extra; p += extra;
      }
      ro.vuelta = v0 + (ro.dir * p) / K;
      if (termina) {
        const meta = ro.dir > 0 ? Math.ceil(v0 / 2 - 1e-6) * 2 : Math.floor(v0 / 2 + 1e-6) * 2;
        if ((ro.dir > 0 && ro.vuelta >= meta) || (ro.dir < 0 && ro.vuelta <= meta)) { ro.vuelta = meta; ro.velocidad = 0; ro.quieta = true; }
      }
      if (cuarto(ro.vuelta) !== cuarto(v0)) ro.golpesDeLado = (ro.golpesDeLado || 0) + 1;
      if (ro.quieta) {
        const c = ((Math.round(ro.vuelta) % 8) + 8) % 8;
        ro.hw = c === 2 || c === 6 ? 7.5 : 11;
      }
    }
  } else if (ro.roce) {
    ro.velocidad = Math.max(0, ro.velocidad - ro.roce * dt);
    if (ro.velocidad === 0) ro.quieta = true;
  }
  // 🧳 La que sale de una pila, de costado del pasillo, entra en él (`yMeta`) mientras se desliza.
  if (ro.yMeta != null && !ro.quieta) {
    const d = ro.yMeta - ro.y;
    ro.y += Math.sign(d) * Math.min(Math.abs(d), 220 * dt);
  }
}

// ------------------------------------------------------------------- dibujo

export function drawRodante(r, ro) {
  const col = CONFIG.colors;
  if (ro.tipo === 'valija') { dibujarValija(r, ro); return; }

  /**
   * EL POLVO QUE DEJA ATRÁS. No es adorno: quieto, un barril se confunde con
   * la carga que hay dibujada por todo el vagón, y en este juego todo lo que
   * te puede lastimar se anuncia antes (el guardia levanta el arma, la mecha
   * parpadea). La estela dice "esto viene en serio" de un vistazo, y encima
   * marca para qué lado va.
   */
  for (let i = 0; i < 6; i++) {
    const d = (ro.giro * 22 + i * 7) % 42;
    const t = 1 - d / 42;
    r.ctx.globalAlpha = t * 0.45;
    // Color CLARO a propósito: el polvo del galope es marrón porque cae sobre
    // la tierra, pero acá el piso ya es madera marrón y ahí desaparecería.
    // Y sale del lado contrario al que va, sea cual sea (`dir`).
    r.rect(ro.x - ro.dir * (ro.hw + d), ro.y - 4 + (i % 3) * 4 + Math.sin(d * 0.3) * 2,
      3, 1 + Math.round(t * 2), '#c0a884');
    r.ctx.globalAlpha = 1;
  }

  // La sombra, que es lo que lo despega del piso y lo hace leer como un bulto
  // y no como una mancha pintada en el suelo.
  r.ctx.globalAlpha = 0.3;
  r.box(ro.x, ro.y + ro.hh - 1, ro.hw - 1, 2, '#000');
  r.ctx.globalAlpha = 1;

  if (ro.tipo === 'res') dibujarRes(r, ro, col);
  else if (ro.tipo === 'polvora') dibujarPolvora(r, ro);
  else if (ro.tipo === 'cajon') dibujarCajon(r, ro, col);
  else dibujarBarril(r, ro, col);

  // Cuánto le queda, sólo si ya le pegaste. Las mismas rayitas que usan los
  // guardias: si el juego ya tiene una forma de decir "cuánto aguanta esto",
  // inventar otra sólo obliga a aprender dos.
  if (ro.balea) {
    dibujarDanio(r, ro, ro.x - ro.hw, ro.y - ro.hh, ro.hw * 2, ro.hh * 2, etapaDeDanio(ro.vida, ro.vidaMax));
  }
}

/**
 * EL BARRIL, visto desde arriba.
 *
 * Rueda con el eje cruzado al pasillo, así que desde arriba es un rectángulo:
 * los aros de metal quedan fijos cerca de las puntas (van alrededor del
 * barril, o sea a lo largo del pasillo) y las DUELAS corren en el otro sentido
 * y se desplazan mientras gira. Ese desplazamiento es todo lo que hace que se
 * lea "esto está rodando" y no "esto se desliza".
 */
/** Un punto de dibujo: un cuarto de unidad, con la lupa de ×4. */
const PUNTO = 0.25;
/** En cuántos cuadros se parte una vuelta del barril. */
const CUADROS = 8;

/**
 * 🔁 EL BARRIL, A LA RESOLUCIÓN NUEVA (etapa 4).
 *
 * Era el mismo dibujo pero en unidades enteras: las duelas eran rayas de
 * CUATRO puntos de ancho y los aros de ocho. Ahora las duelas son de un punto,
 * los aros llevan su remache y la madera tiene veta, y la vuelta se parte en
 * ocho cuadros que se guardan una sola vez cada uno (el mismo taller que el
 * vagón y la gente, `world/piezas.js`).
 *
 * Lo que lo hace leer como algo que RUEDA sigue siendo lo mismo: las duelas
 * corren y los aros se quedan quietos. Sin los aros quietos, un barril rodando
 * y un barril deslizándose se dibujan igual.
 */
function piezaBarril(madera, luz, aro, cuadro, golpeado) {
  const W = 40, H = 32;
  return pieza(`barril|${madera}|${aro}|${cuadro}|${golpeado ? 1 : 0}`, W, H, (p) => {
    const cuerpo = golpeado ? '#fff' : madera;
    const duela = golpeado ? '#fff' : tono(madera, 0.62);
    const alto = golpeado ? '#fff' : luz;
    // El cuerpo, con las puntas comidas: un rectángulo pelado se lee como una
    // tabla, y con las esquinas mordidas se lee como algo redondo.
    p(0, 6, W, H - 12, NEGRO);
    p(4, 2, W - 8, H - 4, NEGRO);
    p(2, 8, W - 4, H - 16, cuerpo);
    p(6, 4, W - 12, H - 8, cuerpo);
    p(6, 4, W - 12, 3, alto);
    p(6, H - 7, W - 12, 3, tono(madera, 0.5));
    // Las duelas: cruzadas al pasillo, corriéndose con el giro.
    for (let i = 0; i < 6; i++) {
      const d = ((cuadro / CUADROS) + i / 6) % 1;
      const px = Math.round(3 + d * (W - 7));
      p(px, 6, 1, H - 12, duela);
    }
    // Los dos aros de metal, quietos, con su remache.
    for (const ay of [7, H - 11]) {
      p(1, ay, W - 2, 4, golpeado ? '#fff' : aro);
      p(1, ay, W - 2, 1, golpeado ? '#fff' : tono(aro, 1.25));
      p(11, ay + 1, 2, 2, golpeado ? '#fff' : tono(aro, 0.6));
      p(W - 13, ay + 1, 2, 2, golpeado ? '#fff' : tono(aro, 0.6));
    }
  });
}

function dibujarBarril(r, ro, col) {
  const cuadro = Math.floor(((ro.giro % 3.6) / 3.6) * CUADROS + CUADROS) % CUADROS;
  const img = piezaBarril(col.seat, col.seatTop, col.strongbox, cuadro, ro.hitFlash > 0);
  r.ctx.drawImage(img, ro.x - (img.width * PUNTO) / 2, ro.y - (img.height * PUNTO) / 2,
    img.width * PUNTO, img.height * PUNTO);
}

/**
 * LA RES, vista desde arriba y a la carrera.
 *
 * Tiene que leerse de un vistazo como ALGO VIVO y no como un bulto más: por
 * eso el lomo se balancea al trote (`giro`), lleva la mancha clara del pelaje
 * y los cuernos van adelante, marcando para dónde corre. Un rectángulo marrón
 * más se habría confundido con un cajón, y confundir tu propia jugada con una
 * amenaza sería el peor error de lectura posible.
 */
function dibujarRes(r, ro, col) {
  const trote = Math.sin(ro.giro * 2.4) * 1.2;
  const w = ro.hw, h = ro.hh;
  const d = ro.dir;                       // +1 = corre hacia la derecha
  const y = ro.y + trote;
  const cuerpo = ro.hitFlash > 0 ? '#fff' : '#5b4030';
  const lomo   = ro.hitFlash > 0 ? '#fff' : '#7a5a3e';
  const oscuro = ro.hitFlash > 0 ? '#fff' : '#3d2a1e';

  /**
   * LA CLAVE ES LA SILUETA, NO EL DETALLE. A este tamaño (18x14 px) cualquier
   * adorno se convierte en ruido: lo único que separa un animal de un cajón es
   * que NO SEA UN RECTÁNGULO. Por eso el cuerpo termina antes del frente y la
   * cabeza sale aparte, más angosta — ese escalón es lo que se lee.
   *
   * La primera versión dibujaba un rectángulo con otro rectángulo claro
   * adentro y los cuernos sueltos flotando al costado: se leía exactamente
   * como un cajón con tapa, que es la peor confusión posible cuando la mitad
   * de las cosas que ruedan por este pasillo SON cajones.
   */
  const cuerpoAtras = ro.x - d * w;
  const cuello = ro.x + d * (w - 5);

  // El lomo, con el frente y el fondo redondeados a mordiscos.
  r.rect(Math.min(cuerpoAtras, cuello), y - h + 1, w * 2 - 5, h * 2 - 2, cuerpo);
  r.rect(Math.min(cuerpoAtras, cuello) + 1, y - h, w * 2 - 7, h * 2, cuerpo);

  /**
   * La mancha del pelaje va ACOSTADA sobre el lomo y no parada.
   *
   * Vertical se leía como una raya de luz o una tapa; horizontal se lee como
   * el lomo del animal visto desde arriba, que es la vista que tenemos. Y va
   * corrida hacia el anca, porque una mancha centrada vuelve a parecer la tapa
   * de un cajón.
   */
  r.rect(Math.min(cuerpoAtras, cuello) + 2, y - h + 2, w, 4, lomo);
  r.rect(Math.min(cuerpoAtras, cuello) + 1, y - h, w * 2 - 7, 1, oscuro);

  // La cabeza: más angosta y más baja que el cuerpo. Ese escalón es la silueta.
  const cabeza = ro.x + d * (w - 1);
  r.rect(cabeza - 2, y - 3, 4, 6, cuerpo);
  r.rect(cabeza - 2, y - 3, 4, 2, oscuro);

  // Los cuernos, PEGADOS a la cabeza y saliendo hacia afuera y adelante.
  r.rect(cabeza - 1 + d, y - 5, 2, 2, '#d8cdbb');
  r.rect(cabeza - 1 + d, y + 3, 2, 2, '#d8cdbb');

  // Las patas, alternando: es lo que vende la carrera.
  const paso = Math.sin(ro.giro * 5) > 0 ? 1 : -1;
  r.rect(cuerpoAtras + (d > 0 ? 2 : -4), y + h - 2, 2, 2 + paso, oscuro);
  r.rect(cuello - (d > 0 ? 2 : 0), y + h - 2, 2, 2 - paso, oscuro);
}

/**
 * EL CAJÓN DE PÓLVORA EMPUJADO (Fase 6a).
 *
 * Se dibuja con **el mismo cuerpo** que el que está quieto en el vagón
 * (`dibujarCuerpoCajon`, entities/cajon.js) y no con un sprite parecido: es la
 * misma cosa en otra situación, y si se vieran distinto habría que aprender dos
 * objetos donde hay uno. Lo único que se le agrega es el tumbo — un cajón no
 * rueda liso, va de canto.
 *
 * Y la franja roja sigue diciendo lo único que importa mientras viene hacia
 * vos: si el que se te viene encima te tumba o te mata.
 */
function dibujarPolvora(r, ro) {
  // EL TUMBO VA EN PASOS y no continuo: cada medida distinta es una pieza
  // guardada distinta, y con el seno crudo serían cientos.
  const tumbo = Math.round(Math.abs(Math.sin(ro.giro * 1.6)) * 4) / 4;
  const w = ro.hw - 1 + tumbo * 1.5;
  const h = ro.hh - 3 - tumbo * 1.5;
  dibujarCuerpoCajon(r, ro.x, ro.y, w, h, ro.cargado, ro.hitFlash > 0, ro.tieneCartucho);
}

/**
 * EL CAJÓN QUE RUEDA: va dando tumbos de canto en vez de rodar.
 *
 * 🔁 Se dibuja con EL MISMO CUERPO que el que está quieto en el vagón
 * (`dibujarCuerpoCajon`), igual que ya hacía el de pólvora. Antes tenía su
 * propio dibujo, parecido pero no igual, y al pasar todo a la resolución nueva
 * quedó a la vista lo que eso costaba: el que rodaba se veía liso al lado del
 * barril y del que se empuja. Es la misma cosa en otra situación.
 */
function dibujarCajon(r, ro, col) {
  const tumbo = Math.round(Math.abs(Math.sin(ro.giro * 1.6)) * 4) / 4;
  const w = ro.hw - 1 + tumbo * 1.5;
  const h = ro.hh - 2 - tumbo * 1.5;
  dibujarCuerpoCajon(r, ro.x, ro.y, w, h, false, ro.hitFlash > 0, false);
}

/**
 * 🧳 LAS VALIJAS DEL FRENAZO (fase 4 de "LOS ENGANCHES"), en el estilo nuevo *(Santi eligió "barriles, y valijas en
 * pasajeros")*: en el frenazo se caen de entre los asientos y salen deslizándose por el pasillo hacia adelante. No
 * giran (van siempre de costado, a lo largo del pasillo), así que tienen una sola vista; tres, puestas punto por punto:
 *  0 LA VALIJA DE CUERO: la tapa con la manija, las dos correas con su hebilla, las esquinas reforzadas y el cierre
 *    de bronce en la costura de la tapa.
 *  1 EL BOLSO DE TAPIZ (el "carpetbag"): la boca de bronce, el tapiz rojo con su dibujo, el fondo de cuero y la manija.
 *  2 EL BAULITO: la tapa combada en dos verdes, las tablas, las cantoneras de bronce y la cerradura.
 * Mientras se desliza va a los saltitos (un punto, cuadro por medio) y levanta polvo atrás. De noche, la luz del lugar
 * (`luzEn`), como la gente.
 */
function dibujarValija(r, ro) {
  const PASO = CONFIG.estilo.punto / 4, ctx = r.ctx;
  // (🥃 La variante 3 es el baúl grande de primera clase, que sale del rincón de su puerta.)
  const grande = ro.variante === 3;
  const W = grande ? 36 : 18, H = grande ? 36 : 16, piso = ro.y + ro.hh;
  const luz = estiloNuevo.luzEn ? Math.round(estiloNuevo.luzEn(ro.x, piso - 2) || 0) : 0;
  // (🥃 El baúl grande no salta: se vuelca.)
  const salta = !grande && !ro.quieta && ro.velocidad > 60 && Math.floor(ro.giro * 3) % 2 ? 1 : 0;
  const ox = Math.round(ro.x / PASO) - W / 2, oy = Math.round(piso / PASO) - H - salta;
  // (🐛 En su lienzo, para taparle el borde fino al que está detrás: ver `pintarTapando` en world/caidas.js.)
  pintarTapando(ctx, ox, oy, W, H + 1, luz + (ro.hitFlash > 0 ? 2 : 0), (R) => {
  // El polvo que levanta atrás (del lado contrario al que va), mientras se desliza.
  if (!ro.quieta && ro.velocidad > 30) {
    const t = Math.floor(ro.giro * 4), atras = (x) => (ro.dir > 0 ? x : W - 1 - x);
    R(atras(-2 - (t % 3)), H - 2, 1, 1, 37); R(atras(-4 - ((t + 1) % 3)), H - 1, 1, 1, 38); R(atras(-1), H - 3 + (t % 2), 1, 1, 37);
  }
  // La sombra en el piso.
  R(1, H, W - 1, 1, 0);
  if (grande) {
    pintarBaulRodando(R, Math.round(ro.vuelta || 0));
  } else if (ro.variante === 1) {
    // EL BOLSO DE TAPIZ: el contorno con las esquinas de arriba gastadas, la manija, la boca de bronce, el tapiz.
    R(1, 3, 16, 13, 0); R(0, 5, 18, 10, 0);
    R(6, 0, 6, 1, 0); R(5, 1, 1, 3, 0); R(12, 1, 1, 3, 0); R(6, 1, 6, 1, 33);
    R(2, 4, 14, 1, 7); R(2, 4, 14, 1, 7); R(1, 5, 16, 1, 6);
    R(1, 6, 16, 7, 9);
    for (let y = 7, j = 0; y < 12; y += 2, j++) for (let x = 2 + (j % 2) * 2; x < 16; x += 4) { R(x, y, 1, 1, 10); R(x + 1, y + 1, 1, 1, 28); }
    R(15, 6, 2, 7, 8);
    R(1, 13, 16, 2, 33); R(1, 13, 16, 1, 34);
  } else if (ro.variante === 2) {
    // EL BAULITO: la tapa combada, las tablas, las cantoneras y la cerradura.
    R(0, 2, 18, 14, 0); R(1, 1, 16, 1, 0);
    // (🔁 Un paso más claro: de noche el frente se iba al negro.)
    R(1, 2, 16, 4, 43); R(2, 2, 14, 1, 43); R(1, 4, 16, 1, 27);
    R(1, 6, 16, 1, 0);
    R(1, 7, 16, 8, 27); R(1, 10, 16, 1, 26); R(1, 13, 16, 1, 26);
    R(1, 2, 1, 13, 6); R(16, 2, 1, 13, 6); R(1, 7, 16, 1, 6);
    R(8, 7, 2, 3, 7); R(8, 8, 1, 1, 0);
  } else {
    // LA VALIJA DE CUERO. (🔁 Cuero rojizo y no marrón: del marrón del piso no se despegaba.)
    R(7, 0, 4, 1, 0); R(6, 1, 1, 2, 0); R(11, 1, 1, 2, 0); R(7, 1, 4, 1, 47);
    R(0, 2, 18, 14, 0);
    R(1, 3, 16, 4, 12); R(1, 3, 16, 1, 13);
    R(1, 7, 16, 1, 47);
    R(1, 8, 16, 7, 11); R(1, 14, 16, 1, 47);
    R(1, 8, 2, 2, 47); R(15, 8, 2, 2, 47); R(1, 13, 2, 2, 47); R(15, 13, 2, 2, 47);
    for (const x of [4, 13]) { R(x, 3, 1, 12, 47); R(x, 10, 1, 2, 7); }
    R(8, 7, 2, 2, 7); R(8, 8, 2, 1, 6);
  }
  });
}
