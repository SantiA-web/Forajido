/**
 * EL CABALLO Y SU JINETE.
 *
 * 🔻 ETAPA 5c — EL CABALLO DEJÓ DE DIBUJARSE Y PASÓ A SER UN SPRITE.
 *
 * *(Santi, después de cinco intentos míos: "se ve no tan bien… ¿y si navegas
 * por internet y me otorgas links que me lleven a texturas o siluetas de
 * caballos pixel art?" — y terminó generando el suyo con una página de pixel
 * art.)* El caballo es de él y es muchísimo mejor que cualquiera de las cinco
 * versiones que salieron de acá.
 *
 * QUÉ SE APRENDIÓ, porque costó caro. Un caballo NO se calcula. Las cinco
 * versiones sacaban la forma de fórmulas —puntos de control, curvas
 * interpoladas, ángulos y senos— y una fórmula da una silueta correcta en
 * promedio que nunca está DIBUJADA. Hasta copiarle el contorno a una
 * referencia columna por columna dio algo que se defendía de lejos y se caía
 * de cerca. Lo que faltaba no era resolución: nuestra caja da 140 × 108 puntos
 * y ahí adentro entra un caballo hermoso — se comprobó metiendo la referencia
 * achicada a esa misma caja.
 *
 * LO QUE SÍ SIGUE SIENDO NUESTRO, y por eso este archivo no desapareció: el
 * JINETE (es la gente del juego, sentada), las RIENDAS, y el enganche de los
 * cuadros del galope al reloj del sonido.
 *
 * TODO VA CON `r.rect`, `r.line` Y UNA ESTAMPA: la silueta del jinete detrás de
 * la pared del tren (`siluetaDeJinete`, raidScene) pinta esto mismo con un
 * renderer de un solo color, y la hoja se tiñe entera para eso.
 */

import { dibujarPersona } from './figura.js';
import { PUNTO } from '../world/piezas.js';
import {
  HOJA, CELDA_ANCHO, CELDA_ALTO, DIRECCIONES, FILA_QUIETO, MEDIDAS, POR_POSE,
} from '../assets/caballoHoja.js';

const ALTO_SENTADO = 7;     // del asiento a donde apoya la figura sentada

/**
 * EL SPRITE VA AL DOBLE, y no es una elección de gusto: está medido. El caballo
 * de la hoja tiene el lomo a 33 puntos del suelo; al doble son 66, y el nuestro
 * estaba a 68. Al natural quedaba un petiso con un jinete gigante encima.
 *
 * El precio es que sus píxeles son de 2 × 2 mientras los de la gente son de
 * 1 × 1. Se miró al lado de un guardia antes de decidirlo y no se pelean.
 */
const ESCALA = 2;
const PASO = PUNTO * ESCALA;              // media unidad del mundo por punto del sprite

/**
 * CUÁNDO PISA CADA PATA dentro de la zancada, en segundos: son los mismos
 * tres golpes de `zancada` en engine/audio.js (0 / 85 / 175 ms). Es el galope
 * de tres tiempos, el "tucu-TÚN". Ya no mueven patas dibujadas, pero siguen
 * siendo de dónde salen el polvo de los cascos y el sonido, así que quedan.
 */
export const GOLPES = { traseraAlla: 0, traseraAca: 0.085, delanteraAlla: 0.085, delanteraAca: 0.175 };

/**
 * LA HOJA SE CARGA UNA VEZ. Viene como `data:` adentro de un `.js`, así que no
 * hay ni pedido al servidor ni espera de red — pero la imagen igual se decodifica
 * en otro momento, así que hasta que esté lista no se dibuja nada. Son uno o dos
 * cuadros al arrancar el juego.
 */
const hoja = new Image();
let lista = false;
/**
 * Se cumple cuando la hoja terminó de cargar. El JUEGO no la necesita —redibuja
 * todos los cuadros y al segundo o tercero ya está— pero las pruebas dibujan
 * UNA sola vez, y sin esperarla salía el jinete flotando sin caballo debajo.
 */
export const cargada = new Promise((listo) => {
  hoja.onload = () => { lista = true; listo(); };
  hoja.onerror = () => listo();
});
hoja.src = HOJA;

/**
 * LA MISMA HOJA TEÑIDA DE UN COLOR, para la sombra del jinete detrás de la
 * pared del tren. Se arma la primera vez que hace falta y se guarda.
 */
const tenidas = new Map();
function hojaTenida(color) {
  let c = tenidas.get(color);
  if (!c) {
    c = document.createElement('canvas');
    c.width = hoja.width;
    c.height = hoja.height;
    const g = c.getContext('2d');
    g.drawImage(hoja, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    tenidas.set(color, c);
  }
  return c;
}

/**
 * EL CABALLO A LA CARRERA. Los cascos quedan en `y + 7`, donde va la sombra.
 *
 * @param zancada  `{ t, T }`: segundos desde que empezó la zancada y cuánto dura.
 *                 `null` si está parado (y entonces va el dibujo del quieto).
 * @param trote    ya no se usa: el sprite rebota solo, y sumarle el nuestro lo
 *                 haría temblar. Se recibe para no tocar a quien llama.
 * @param esfuerzo 0 … 1: qué tan a fondo corre (mueve el polvo, no el dibujo).
 * @param pose     -4 … 4 (ver `poseDelCaballo` en scenes/rideScene.js)
 *
 * Devuelve dónde quedaron la montura y el bocado, para que el jinete se siente
 * en una y agarre las riendas del otro.
 */
export function dibujarAnimal(r, x, y, zancada, trote, esfuerzo, pose = 0) {
  const [nombre, achata] = POR_POSE[String(Math.max(-4, Math.min(4, Math.round(pose))))] || POR_POSE['0'];
  const m = MEDIDAS[nombre];
  const fila = DIRECCIONES.indexOf(nombre);

  /**
   * QUÉ CUADRO DEL GALOPE LE TOCA. Sale del MISMO reloj que hace sonar los
   * cascos (`faseDeZancada`, rideScene), así que la animación y el "tucu-TÚN"
   * no se pueden desincronizar: son el mismo número.
   */
  const vuelta = zancada ? (zancada.t / zancada.T) % 1 : 0;
  const col = zancada ? Math.min(7, Math.floor(vuelta * 8)) : fila;
  const filaReal = zancada ? fila : FILA_QUIETO;

  const ancho = CELDA_ANCHO * PASO * achata;
  const alto = CELDA_ALTO * PASO;
  const ox = x - m.centro * PASO * achata;
  const oy = (y + 7) - m.suelo * PASO;

  const asiento = { x: ox + m.sillaX * PASO * achata, y: oy + m.sillaY * PASO };
  const riendas = { x: ox + m.bocadoX * PASO * achata, y: oy + m.bocadoY * PASO };

  const estampa = () => {
    if (!lista || !r.ctx) return;
    r.ctx.drawImage(
      r.plano ? hojaTenida(r.plano) : hoja,
      col * CELDA_ANCHO, filaReal * CELDA_ALTO, CELDA_ANCHO, CELDA_ALTO,
      ox, oy, ancho, alto,
    );
  };

  /**
   * ¿ANTES O DESPUÉS DEL JINETE? Alejándose o de perfil, el caballo entero está
   * más lejos que él y va debajo. Viniendo hacia la cámara su cabeza está MÁS
   * CERCA, así que se estampa después — pero entonces le taparía también el
   * cuerpo, y por eso viniendo se estampa DOS VECES: el cuerpo abajo y la
   * cabeza arriba, recortada.
   */
  const viene = pose >= 2;
  estampa();

  return {
    asiento,
    riendas,
    /** Se llama DESPUÉS del jinete: le vuelve a poner la cabeza por encima. */
    adelante: () => {
      if (!viene || !lista || !r.ctx) return;
      r.ctx.save();
      r.ctx.beginPath();
      // Una caja alrededor del BOCADO: la cabeza está donde está el bocado, y
      // eso vale tanto de perfil como viniendo de frente.
      r.ctx.rect(
        ox + (m.bocadoX - 24) * PASO * achata, oy + (m.bocadoY - 26) * PASO,
        48 * PASO * achata, 42 * PASO,
      );
      r.ctx.clip();
      r.ctx.drawImage(
        r.plano ? hojaTenida(r.plano) : hoja,
        col * CELDA_ANCHO, filaReal * CELDA_ALTO, CELDA_ANCHO, CELDA_ALTO,
        ox, oy, ancho, alto,
      );
      r.ctx.restore();
    },
  };
}

/**
 * UNA CUERDA, en pasitos de un punto para que no la suavice nadie, y con
 * `panza`: cuánto se hunde en el medio. Una rienda no es una recta tirante —
 * cuelga— y acá la panza además la SEPARA de la mandíbula del caballo, que es
 * otra diagonal que va casi para el mismo lado.
 */
function cuerda(r, x1, y1, x2, y2, color, panza = 0) {
  const pasos = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) * 4));
  const alto = 0.25;
  /**
   * SE DIBUJA EN TRAMOS, no punto por punto. Recorre la línea juntando los
   * puntos que caen en la MISMA FILA y pinta cada fila de un rectángulo: se ve
   * exactamente igual —los escaloncitos son los mismos— pero una rienda pasa
   * de cuarenta y cinco rectángulos a ocho. Punto por punto era la parte más
   * cara de dibujar el caballo entero.
   */
  let filaY = null, desde = 0, hasta = 0;
  const soltar = () => {
    if (filaY !== null) r.rect(Math.min(desde, hasta), filaY, Math.abs(hasta - desde) + alto, alto, color);
  };
  for (let i = 0; i <= pasos; i++) {
    const u = i / pasos;
    const px = x1 + (x2 - x1) * u;
    const py = Math.round((y1 + (y2 - y1) * u + Math.sin(u * Math.PI) * panza) * 4) / 4;
    if (py !== filaY) { soltar(); filaY = py; desde = px; }
    hasta = px;
  }
  soltar();
}

/**
 * EL JINETE: UNA PERSONA DEL JUEGO, SENTADA (etapa 5).
 *
 * 🔁 Era lo último que quedaba del dibujo viejo: una sombra cabezona negra de
 * nueve unidades, o sea MENOS DE MEDIA PERSONA. No se podía arreglar solo
 * porque el jinete y el caballo son UNA SOLA IMAGEN. Con el caballo a su tamaño
 * de verdad (26 de largo por 17 al lomo, contra una persona de 20) ahora sí
 * entra, y el jinete es exactamente la misma gente que camina por el vagón.
 *
 * 🔻 ETAPA 5b — CÓMO REACCIONA AL CABALLO *(Santi: "se debería mejorar como
 * reacciona el personaje ante la inclinación y movimientos del caballo, porque
 * hoy en día es muy malo")*. Tenía razón, y eran cuatro cosas distintas:
 *
 *  1. LA INCLINACIÓN ERA UN CORRIMIENTO DE COSTADO. Se deslizaba en X y nada
 *     más: no se doblaba. Ahora el torso ROTA sobre la montura, que es lo que
 *     hace un jinete de verdad — se dobla de la cintura, no se corre del
 *     asiento.
 *  2. EL GIRO LE SALTABA DE GOLPE. Iba de perfil hasta la pose 3 y ahí, en un
 *     cuadro, pasaba a mirar de frente. Y resulta que la gente YA TIENE las
 *     vistas de tres cuartos (`diagF` y `diagE` en figura.js) y el jinete era
 *     el único que no las usaba: ahora el ángulo sale del rumbo y la vista se
 *     elige sola, así que el giro pasa por el medio.
 *  3. IBA SOLDADO AL LOMO. Subía y bajaba EXACTAMENTE lo mismo que el animal.
 *     Un jinete amortigua con las piernas y la cintura: el torso sube la mitad
 *     y un instante más tarde (`rebote`, que lo calcula el galope a partir de
 *     la misma zancada). Eso es lo que separa a una persona montada de una
 *     calcomanía pegada.
 *  4. NO TENÍA LAS MANOS EN LAS RIENDAS, que es lo que ata visualmente al
 *     jinete con la cabeza del caballo.
 *
 * `inclina`: cuánto se echa hacia adelante, de 0 (parado) a 2 (a fondo).
 * `riendas`: dónde está el bocado, si hay caballo (lo devuelve `dibujarAnimal`).
 */
export function dibujarJinete(r, x, asiento, pose = 0, inclina = 0, ropa = {}, riendas = null) {
  const quien = ropa.detalles || 'jugador';
  /**
   * EL RUMBO MANDA LA VISTA, y en pasos: de perfil (pose 0-1) a tres cuartos
   * (2) a de frente o de espaldas (3-4). `direccionDe` redondea a la más
   * cercana de ocho, así que esto sale solo.
   */
  const angulo = (pose / 4) * (Math.PI / 2);

  /**
   * SE DOBLA DE LA CINTURA. La rotación es sobre el asiento, no sobre los
   * pies: un jinete que se echa adelante deja la cadera donde está.
   */
  const dobla = -inclina * 0.11;
  const gira = -pose * 0.012;                // y se vuelca un poco hacia adentro
  const sx = x;
  const sy = asiento + ALTO_SENTADO;

  if (r.ctx && (dobla || gira)) {
    r.ctx.save();
    r.ctx.translate(sx, sy);
    r.ctx.rotate(dobla + gira);
    r.ctx.translate(-sx, -sy);
  }

  /**
   * LA MONTURA, y va acá y no en el caballo: el sprite que generó Santi es un
   * caballo PELADO. Sin silla ni estribos el jinete flotaba encima del lomo, y
   * ésa era la mitad de por qué se leía "pegado".
   *
   * Va DEBAJO de la persona y encima del animal: primero la carona, después el
   * asiento. Se angosta con el giro, igual que el caballo.
   */
  const anchoM = (6.5 - Math.abs(pose) * 0.55) * (r.ctx ? 1 : 0);
  if (anchoM > 0) {
    r.rect(sx - anchoM / 2, asiento + 0.75, anchoM, 2, '#6b2b24');
    r.rect(sx - anchoM / 2, asiento + 0.75, anchoM, 0.5, '#8e4234');
    r.rect(sx - anchoM / 2 + 1, asiento - 0.75, anchoM - 2, 2, '#3a2418');
    r.rect(sx - anchoM / 2 + 0.75, asiento - 1.75, 1.25, 1.25, '#22150d');
  }

  const persona = dibujarPersona(r, {
    tipo: quien === 'ley' ? 'jineteLey' : 'jugador',
    x: sx,
    pies: sy,
    angulo,
    postura: 'montado',
    estado: ropa.estado,
    destello: ropa.destello,
    panuelo: quien === 'jugador',
  });

  /**
   * EL ESTRIBO, después de la persona: la ación baja del asiento y el fierro
   * queda DEBAJO de la bota, no al lado. Es un detalle chico pero es el que
   * explica por qué el pie está donde está.
   */
  if (anchoM > 0 && Math.abs(pose) < 3) {
    const ex = sx + 1.25;
    r.rect(ex - 0.25, asiento + 1.5, 0.5, 4.5, '#2a1c12');
    r.rect(ex - 1.25, sy - 0.5, 2.5, 1, '#6a5334');
  }

  if (r.ctx && (dobla || gira)) r.ctx.restore();

  /**
   * LAS RIENDAS. Dos tiras finas de la mano al bocado. Van DESPUÉS de soltar
   * la rotación porque el jinete se dobla pero la rienda no: es una cuerda
   * tirante entre dos puntos, y tiene que seguir llegando a la boca del animal
   * esté el jinete como esté.
   */
  if (riendas && persona) {
    const mx = sx + 3 + inclina * 0.8;
    const my = (persona.manoY ?? sy - 9) + dobla * 6;
    /**
     * 🐛 SE DIBUJAN EN PASITOS DE UN PUNTO, no con `r.line`. Una raya fina en
     * diagonal el canvas la SUAVIZA, y una rienda de un punto suavizada no
     * queda fina: queda un borrón claro y despintado, que al lado de la cabeza
     * del caballo parecía un palo de luz. Acá no hay nada suavizado — todo el
     * juego son rectángulos de puntos enteros — así que la cuerda también.
     */
    cuerda(r, mx, my, riendas.x, riendas.y, '#2a1c12', 1.6);
  }

  return persona;
}
