/**
 * LA PERSONA — GENTE CURTIDA A 80 PX.
 *
 * *(Santi, después de jugar las sombras cabezonas: "le quita la crudeza del
 * Salvaje Oeste… parecían personajes como del Beholder")*. Toda la gente del
 * juego se dibuja con el arte decidido en `prototipos/gente-80px/`: caras
 * quemadas por el sol, ropa gastada, piernas largas y trote con empuje. Los
 * dibujos en sí viven en `entities/gente/`; este archivo es el puente con el
 * juego.
 *
 * LA CAJA QUE RECIBE LAS BALAS NO CAMBIÓ: sigue siendo `hw`/`hh`. El dibujo se
 * apoya con los pies en el borde de abajo de esa caja (`pies = y + hh`) y crece
 * hacia arriba, así que la cobertura, la puntería y todo lo medido siguen
 * valiendo igual que con las siluetas.
 *
 * 🧠 CADA FIGURA SE ARMA UNA SOLA VEZ. Dibujar estas personas punto por punto
 * en cada cuadro sería carísimo: se arma un canvas por combinación (tipo,
 * vista, modo, cuadro, estado…), se guarda, y después sólo se estampa. Lo que
 * cambia seguido —el destello de un balazo, la orilla de un jefe— se resuelve
 * con variantes teñidas del mismo dibujo.
 *
 * 📏 20 UNIDADES DE ALTO con sombrero (80 puntos de pantalla), sobre una caja
 * que sigue midiendo lo mismo. Un punto de dibujo es un cuarto de unidad,
 * porque el juego mira el mundo con la lupa de ×4 (ver `DENSIDAD`).
 */

import { CONFIG } from '../data/config.js';
import { ROPA, Lienzo, deformar, NEGRO, armaLarga } from './gente/dibujo.js';
import { frente, espalda } from './gente/frente.js';
import { lado, ladoConHuesos, huesosDeLado } from './gente/costado.js';
import { tendido, TENDIDO } from './gente/tendido.js';
import { tresCuartosConHuesos } from './gente/tresCuartos.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';
import { lienzoJugador, PIES as PIES_NUEVO, ANCHO as ANCHO_NUEVO, ALTO as ALTO_NUEVO } from './estiloNuevo/jugador.js';

/** Las tablas que traducen el nombre del juego al nombre del dibujo. */
export { ROPA_DE_LOOK, ROPA_DE_JEFE } from './gente/dibujo.js';

/** El alto de una persona con sombrero, en unidades del mundo. */
export const ALTO_PERSONA = 20;

/** El mismo color, multiplicado por `f` (0,7 es 30% más oscuro). */
export function tono(hex, f) {
  if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  const c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}

const OCHO = ['der', 'abajoDer', 'abajo', 'abajoIzq', 'izq', 'arribaIzq', 'arriba', 'arribaDer'];

/** Cada dirección: qué dibujo le toca, si va girado tres cuartos y si va en espejo. */
const VISTA = {
  der: ['lado', lado, 0, false],
  abajoDer: ['diagF', frente, 1, false],
  abajo: ['frente', frente, 0, false],
  abajoIzq: ['diagF', frente, 1, true],
  izq: ['lado', lado, 0, true],
  arribaIzq: ['diagE', espalda, 1, true],
  arriba: ['espalda', espalda, 0, false],
  arribaDer: ['diagE', espalda, 1, false],
};

/**
 * DE UN ÁNGULO A UNA DE LAS OCHO DIRECCIONES. El ángulo va como en todo el
 * juego: 0 a la derecha y creciendo hacia abajo de la pantalla, así que
 * "abajo" es mirar a la cámara y "arriba" es darle la espalda.
 */
export function direccionDe(angulo) {
  const a = Math.atan2(Math.sin(angulo), Math.cos(angulo));
  return OCHO[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8];
}

/** Si en esa dirección se le ve la cara (y por lo tanto el pecho). */
export function deFrente(angulo) {
  const v = VISTA[direccionDe(angulo)][0];
  return v !== 'espalda' && v !== 'diagE';
}

/**
 * EN QUÉ PUNTO DEL PASO VA. Se deduce de cuánto se movió desde el cuadro
 * anterior y se guarda en la propia entidad, en campos que empiezan con
 * `_andar`. Es SÓLO DIBUJO: nada del juego lee esos campos.
 *
 * Devuelve `null` si hace unos cuadros que no se mueve (parado).
 */
export function faseDeAndar(ent) {
  const px = ent._andarX ?? ent.x;
  const py = ent._andarY ?? ent.y;
  const d = Math.hypot(ent.x - px, ent.y - py);
  ent._andarX = ent.x;
  ent._andarY = ent.y;

  /**
   * 🐛 NO ALCANZA CON MIRAR SI SE MOVIÓ: hay que mirar SI AVANZÓ.
   *
   * *(Santi: "hay guardias que llegan contra un obstáculo para ponerse a
   * cubierto y estando en el mismo lugar que disparan siguen trotando")*. Un
   * guardia a cubierto se asoma y se esconde de verdad —unas 5 unidades para
   * cada lado, ver `peekPosition` en systems/ai.js—, así que se mueve todo el
   * tiempo sin ir a ninguna parte. Sumando distancia recorrida, las piernas no
   * paraban nunca. Ahora cada 10 cuadros se mide cuánto se corrió DE PUNTA A
   * PUNTA: menos de 3 unidades (18 por segundo, bastante menos que patrullar)
   * es estar parado, aunque se esté moviendo.
   */
  const ref = ent._andarRef || (ent._andarRef = { x: ent.x, y: ent.y, n: 0, neto: 99 });
  ref.n++;
  if (ref.n >= 10) {
    ref.neto = Math.hypot(ent.x - ref.x, ent.y - ref.y);
    ref.x = ent.x; ref.y = ent.y; ref.n = 0;
  }

  // Más de 12 px de un cuadro al otro no es caminar: es un salto o un empujón.
  if (d > 0.05 && d < 12 && ref.neto > 3) {
    ent._andarRecorrido = (ent._andarRecorrido || 0) + d;
    ent._andarQuieto = 0;
  } else {
    ent._andarQuieto = (ent._andarQuieto || 0) + 1;
  }
  return ent._andarQuieto > 4 ? null : ent._andarRecorrido || 0;
}

/**
 * EL RITMO, elegido jugando: un paso cada 20 unidades trotando y cada 14
 * caminando. A la velocidad del juego (78) eso son 3,9 pasos por segundo; con
 * el ritmo viejo (uno cada 5) eran 15,6 y parecía cámara rápida.
 */
const RITMO = { trotar: 20, caminar: 14, agachado: 14, agazapado: 10, tierra: 6 };
/**
 * Caminando, dos pasos son 8 cuadros con 5 dibujos: paso, a mitad, juntos, a
 * mitad del otro lado, el otro paso. Trotando son 8 dibujos seguidos.
 */
const CICLO_CAMINATA = [1, 3, 0, 4, 2, 4, 0, 3];

function cuadroDe(recorrido, modo) {
  if (recorrido == null) return 0;
  const i = Math.floor((((recorrido / RITMO[modo]) % 2) + 2) % 2 * 4) % 8;
  return modo === 'trotar' ? i : CICLO_CAMINATA[i];
}

// ------------------------------------------------- los dibujos, en memoria
const S = 80 / 72;                       // el alto elegido: 80 puntos
const OX = 8, OY = 6;                    // margen para el ala del sombrero y el arma
const PUNTO = 0.25;                      // un punto de dibujo, en unidades

/**
 * Las medidas del dibujo. Casi siempre es escala 1, pero hay dos excepciones:
 * los jefes son más grandes (su caja también lo es) y el jinete va más chico,
 * porque el caballo todavía es el dibujo viejo y si no lo monta un gigante.
 */
function medidas(esc = 1) {
  const s = S * esc;
  return {
    s,
    ancho: Math.ceil(72 * s) + 2 * OX,
    alto: Math.ceil(80 * s) + OY,
    cx: Math.round(24 * s) + OX,
    pie: Math.round(74 * s) + OY,
  };
}

/**
 * CUÁNTO SE ECHA ADELANTE EL JINETE, por paso de esfuerzo.
 *
 * 🔻 *(Santi: "el jinete está como tirado hacia atrás, debería estar más
 * incorporado")*. Tenía razón y era un signo cambiado: el jinete giraba con
 * `-inclina`, o sea que CUANTO MÁS FUERTE GALOPABA MÁS SE ECHABA PARA ATRÁS
 * —12,6° a fondo—, justo al revés de lo que hace un jinete.
 *
 * Y ahora no se gira el dibujo entero con el canvas sino que se usa el MISMO
 * `deformar` que ya tenía el trote: así el torso se va adelante y LAS PIERNAS
 * SE QUEDAN donde están, que es lo que pasa de verdad. Girando todo, las botas
 * se escapaban del estribo.
 *
 * Son cinco pasos y no un número continuo porque cada figura se guarda
 * dibujada (ver `armar`): con el ángulo libre habría una figura nueva por
 * cuadro. Cinco pasos alcanzan para que se note, y son cinco dibujos.
 *
 * Los cuatro primeros son el galope, del trote al galope tendido. **El quinto
 * es el que se agacha a apuntar**: va más allá de lo que da el galope a fondo
 * a propósito, porque el aviso de que te van a tirar tiene que salirse de lo
 * que el jinete ya viene haciendo, si no no se nota que cambió algo.
 */
const ECHADO = [0.12, 0.2, 0.28, 0.36, 0.52];

const guardados = new Map();
/** Redondeo al punto de pantalla: si no, el dibujo queda borroso. */
const q = (v) => Math.round(v * 4) / 4;

function armar(clave, hacer) {
  let cv = guardados.get(clave);
  if (!cv) {
    // Un tope por las dudas: son unos 40 KB cada uno y las combinaciones que
    // se usan de verdad son pocas, pero una fuga acá se paga en memoria.
    if (guardados.size > 700) guardados.clear();
    cv = hacer();
    guardados.set(clave, cv);
  }
  return cv;
}

/** El mismo dibujo pintado de un color: el destello del balazo y la orilla del jefe. */
function tenido(img, color, alpha) {
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  const c = cv.getContext('2d');
  c.drawImage(img, 0, 0);
  c.globalCompositeOperation = 'source-atop';
  c.globalAlpha = alpha;
  c.fillStyle = color;
  c.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

/**
 * LA PERSONA. `f` es lo que ya le pasaba el juego a las siluetas:
 * tipo, x, pies, angulo, fase, postura, estado, arma, manosArriba, destello,
 * orilla, sacudida y mochila. Devuelve dónde quedaron la cabeza, la mano y el
 * pecho, para colgarles cosas encima.
 */
export function dibujarPersona(r, f) {
  // 🎨 ESTILO NUEVO (P2): el jugador adentro del vagón, dibujado a mano.
  if (estiloNuevo.activo && f.interior && f.tipo === 'jugador' && r.ctx) return jugadorNuevo(r, f);
  const tipo = ROPA[f.tipo] ? f.tipo : 'guardia';
  const [nombre, fn, g, espejo] = VISTA[direccionDe(f.angulo ?? Math.PI / 2)];
  const postura = f.postura || 'pie';
  const x = q(f.x + (f.sacudida || 0));
  const pies = q(f.pies);
  const arriba = pies - ALTO_PERSONA * (f.escala || 1);

  // El renderer de un solo color (la silueta del jinete detrás de la pared) no
  // tiene canvas: ahí se dibuja un bulto con la forma justa y listo.
  if (!r.ctx) {
    r.rect(x - 3, arriba + 3, 6, ALTO_PERSONA - 3, NEGRO);
    r.rect(x - 5, arriba, 10, 3, NEGRO);
    return { x, top: arriba, arriba, manoY: pies - 9, pechoY: pies - 11, vista: nombre, espejo };
  }

  // 🦴 Cuerpo a tierra y cayendo existen sólo con esqueleto (el jugador de
  // costado); de frente o de espaldas, quedan como agachado.
  const conEsqueleto = (f.tipo || 'guardia') === 'jugador' && VISTA[direccionDe(f.angulo ?? Math.PI / 2)][1] === lado;
  const modo = postura === 'sentado' || postura === 'rendido' || postura === 'montado' ? postura
    : (postura === 'tierra' || postura === 'cayendo') && conEsqueleto ? postura
    : postura === 'agazapado' ? 'agazapado'
    : postura !== 'pie' ? 'agachado'
      : f.fase != null ? (f.modo === 'caminar' ? 'caminar' : 'trotar')
        : 'quieto';
  const sinPaso = modo === 'quieto' || modo === 'sentado' || modo === 'rendido' || modo === 'montado';
  const cuadro = modo === 'cayendo' ? Math.floor((f.reloj || 0) * 10) % 2
    : modo === 'tierra' ? (f.fase == null ? 0 : CICLO_CAMINATA[Math.floor((((f.fase / RITMO.tierra) % 2) + 2) % 2 * 4) % 8])
      : sinPaso ? 0 : cuadroDe(f.fase, modo);
  // El giro de la caída, en pasos (cada figura se guarda dibujada).
  const giro = modo === 'cayendo' ? Math.round((f.giro || 0) / 0.06) : 0;
  const finas = CONFIG.esqueleto.piernas;
  // Sentado y de rodillas el cuerpo queda más abajo: la cabeza también.
  const baja = modo === 'rendido' ? 3.5 : modo === 'sentado' || modo === 'montado' ? 1.5 : 0;

  /**
   * ASOMARSE DESDE UN REPARO ES DOBLARSE, NO CAMINAR.
   *
   * *(Santi: "hay guardias que… estando en el mismo lugar que disparan siguen
   * trotando")*. Cubrirse mueve el cuerpo de verdad (`peekPosition`, en
   * systems/ai.js): con los pies siguiendo esa ida y vuelta, o trotaban en el
   * lugar o se deslizaban. Ahora quien se cubre pasa el punto del reparo como
   * `ancla`: LOS PIES SE QUEDAN AHÍ y el torso sale hasta donde está de verdad.
   */
  let anclaX = x, anclaPies = pies, asomado = null;
  if (f.ancla) {
    const cortar = (v, tope) => Math.max(-tope, Math.min(tope, v));
    // Hasta 6 puntos: más que eso, el torso se despega de las piernas y parece
    // cortado. Lo que falta lo caminan los pies.
    // En pasos de 2 puntos, para no llenar la memoria de dibujos casi iguales.
    const dx = Math.round(cortar((f.x - f.ancla.x) * 4, 6) / 2) * 2;
    const dy = Math.round(cortar((f.pies - f.ancla.pies) * 4, 4) / 2) * 2;
    if (dx || dy) {
      asomado = { dx, dy };
      anclaX = q(x - dx / 4);
      anclaPies = q(pies - dy / 4);
    }
  }
  const estado = f.estado && f.estado !== 'calma' ? f.estado : undefined;
  /**
   * `arma` es `true` para el revólver de siempre, o el nombre de la pose de
   * rifle (`'rifle'` cruzado, `'rifleListo'` encarándote). Las tres se guardan
   * como dibujos distintos, que son tres por vista y por tipo de gente: sólo
   * las usa la ley a caballo de la huida.
   */
  const arma = armaLarga(f.arma) ? f.arma : !!f.arma;
  const manos = !!f.manosArriba;
  const mochila = Math.min(4, Math.round(f.mochila || 0));
  /**
   * LOS CARTUCHOS QUE LE QUEDAN en la correa (hoy, el Dinamitero). El juego
   * manda `{ cargados, total }` y acá se pasa a los CUATRO lugares que tiene
   * dibujada la bandolera: lleva dos dinamitas, así que cada una son dos
   * cartuchos y la correa se vacía entera cuando las tiró las dos.
   *
   * Sólo se calcula para quien lleva bandolera: si no, sería una variante más
   * de figura guardada por cada guardia y por cada dinamita, para nada.
   */
  /**
   * DEL JINETE: cuánto se echa adelante (`echado`) y cuánto abre las piernas
   * (`abre`: los puntos que hay del medio al costado del caballo, medidos sobre
   * la hoja). Los dos llegan redondeados a pasos, para no llenar la memoria de
   * figuras casi iguales.
   */
  const echado = modo === 'montado' ? Math.max(0, Math.min(4, Math.round(f.echado || 0))) : 0;
  const abre = modo === 'montado' ? Math.round(Math.max(0, Math.min(30, f.abre || 0)) / 2) * 2 : 0;

  const cart = ROPA[tipo] && ROPA[tipo].bandolera ? f.cartuchos : null;
  const cartuchos = cart && cart.total > 0
    ? Math.max(0, Math.min(4, Math.round((cart.cargados / cart.total) * 4)))
    : null;

  /**
   * 🎯 AGACHARSE, QUE NO ES LO MISMO QUE ECHARSE ADELANTE. `echado` inclina el
   * cuerpo y **de frente no se ve nada**, porque la inclinación se dibuja de
   * costado (`lateral` vale 0 en la vista de frente). Agacharse, en cambio, es
   * bajar el tronco con los pies quietos, y eso se ve desde cualquier lado.
   *
   * Se aprovecha el mismo mecanismo con el que un guardia se asoma de un
   * reparo: `asomado.dy` baja torso, cabeza y sombrero juntos y deja las
   * piernas donde están. Va en la medida de adentro del dibujo, donde 4 es un
   * punto del mundo.
   */
  const agacha = Math.max(0, Math.min(6, Math.round(f.agacha || 0)));

  /**
   * 🎯 HACIA DÓNDE APUNTA EL BRAZO, cuando quien dibuja quiere mandarlo (hoy,
   * el jugador a caballo tirando para atrás). Es un ángulo **de pantalla**, ya
   * achatado por la vista de tres cuartos.
   *
   * ⚠️ GIRA EL BRAZO, NO EL CUERPO, y eso es a propósito *(Santi, hace varias
   * vueltas: "hay veces que el caballo no cambia de dirección pero el personaje
   * sí, entonces se ve raro")*. Por eso la vista del jinete la sigue mandando
   * el caballo: acá sólo se mueve el brazo del arma.
   *
   * Va en 32 pasos porque cada figura se guarda dibujada: con el ángulo libre
   * habría una figura nueva por cuadro. 🔁 Eran 16 (de a 22,5°): arriba del
   * tren, con la mira moviéndose despacio sobre un jinete, el brazo saltaba
   * de golpe. De a 11° acompaña.
   */
  const armaDir = f.armaDir == null ? null
    : Math.round((f.armaDir / (Math.PI * 2)) * 32 + 64) % 32;
  // El ángulo del arma en el dibujo (que se arma mirando a la derecha).
  const armaDirDibujo = armaDir == null ? null
    : (espejo ? (16 - armaDir + 32) % 32 : armaDir) * (Math.PI * 2 / 32);

  // El dibujo se arma mirando a la derecha: si va en espejo, asomarse para la
  // derecha del mundo es asomarse para la izquierda del dibujo.
  const asomadoDibujo = asomado || agacha
    ? {
      dx: asomado ? (espejo ? -asomado.dx : asomado.dx) : 0,
      dy: (asomado ? asomado.dy : 0) + agacha,
    }
    : null;

  const esc = f.escala || 1;
  const M = medidas(esc);
  const clave = [tipo, nombre, g, modo, cuadro, estado, arma === true ? 'a' : (arma || ''), manos ? 'm' : '', mochila,
    f.panuelo ? 'p' : '', asomadoDibujo ? asomadoDibujo.dx + ',' + asomadoDibujo.dy : '', esc,
    cartuchos == null ? '' : 'c' + cartuchos,
    armaDir == null ? '' : 'd' + armaDir,
    modo === 'montado' ? 'e' + echado + 'a' + abre : '', giro ? 'g' + giro : '', f.sprint ? 's' : ''].join('|');
  // Al trotar y a caballo el torso se va para adelante; de frente casi no se
  // nota, y de espaldas tampoco: por eso `lateral` lo apaga.
  const lateral = fn === lado ? 1 : g ? 0.5 : 0;
  const inclina = (modo === 'trotar' ? 0.1 : modo === 'agachado' ? 0.12 : modo === 'agazapado' ? 0.26
    : modo === 'montado' ? ECHADO[echado] : 0) * lateral;
  /**
   * 🦴 EL JUGADOR DE COSTADO VA CON ESQUELETO (etapa E1, ver `ladoConHuesos`
   * en gente/costado.js). Echarse adelante ya no corta el dibujo en diagonal:
   * el torso GIRA desde la cadera. El resto de la gente sigue como estaba hasta
   * que Santi lo apruebe en el jugador.
   */
  const conHuesos = tipo === 'jugador' && fn === lado;
  /**
   * 🦴 E3 · TRES CUARTOS CON ESQUELETO (gente/tresCuartos.js): por ahora sólo
   * arriba del tren, donde mirás a los jinetes (`f.tresCuartos`). `g` es
   * cuánto gira (1 tres cuartos; menos, más hacia la cámara) y `baja` cuánto
   * baja la vista. Adentro del vagón las diagonales siguen con el dibujo de
   * siempre hasta pasar el esqueleto a todo.
   */
  const tres = tipo === 'jugador' && !!f.tresCuartos && (nombre === 'diagF' || nombre === 'diagE')
    && (modo === 'quieto' || modo === 'agazapado' || modo === 'agachado' || modo === 'caminar' || modo === 'trotar');
  const giro3 = tres ? Math.round((f.tresCuartos.g ?? 1) * 10) / 10 : 1;
  const baja3 = tres ? Math.round((f.tresCuartos.baja ?? 1) * 2) / 2 : 1;
  // 🏃 En el sprint del techo, el torso se echa más adelante.
  const torsoGira = f.sprint && modo === 'trotar' ? CONFIG.esqueleto.sprint : 0;
  const img = armar(tres ? clave + '|t' + giro3 + ',' + baja3 + ',' + finas : conHuesos ? clave + '|h' + finas : clave, () => {
    if (tres) {
      let cuenta = (x, y) => [x, y];
      const LT = Lienzo(M.ancho, M.alto, OX, OY, M.s, (x, y) => cuenta(x, y));
      // El trote no tiene cuadros propios girado: usa los pasos de la caminata.
      const paso = modo === 'trotar' ? CICLO_CAMINATA[cuadro] : cuadro;
      const info = tresCuartosConHuesos(LT, {
        tipo, vista: nombre, g: giro3, vistaBaja: baja3, estado, arma, mochila, finas,
        armaDir: armaDirDibujo, panuelo: !!f.panuelo,
        agazapado: modo === 'agazapado' || modo === 'agachado', paso: modo === 'quieto' ? 0 : paso,
      }, (c) => { cuenta = c; });
      const cv = LT.canvas();
      cv.info = info;
      return cv;
    }
    if (conHuesos) {
      let cuenta = (x, y) => [x, y];
      const LH = Lienzo(M.ancho, M.alto, OX, OY, M.s, (x, y) => cuenta(x, y));
      const datosH = {
        tipo, g, estado, arma, manosArriba: manos, mochila, cartuchos,
        armaDir: armaDirDibujo,
        asomado: asomadoDibujo, panuelo: !!f.panuelo, abre,
      };
      if (modo === 'trotar') datosH.trote = cuadro;
      else {
        datosH.paso = cuadro;
        datosH.agachado = modo === 'agachado' || modo === 'agazapado';
        datosH.agazapado = modo === 'agazapado';
      }
      if (modo === 'sentado' || modo === 'rendido' || modo === 'montado' || modo === 'tierra' || modo === 'cayendo') datosH.postura = modo;
      datosH.giro = giro * 0.06;
      datosH.finas = finas;
      // La cabeza no se inclina con el torso: mira adelante.
      // Las inclinaciones chicas, cortadas en diagonal (`inclina`); el sprint, girado.
      const info = ladoConHuesos(LH, datosH, (c) => { cuenta = c; }, torsoGira
        ? { torso: torsoGira, cabeza: -torsoGira } : { inclina });
      const cv = LH.canvas();
      cv.info = info;
      return cv;
    }
    const L = Lienzo(M.ancho, M.alto, OX, OY, M.s, deformar(inclina));
    const datos = {
      tipo, g, estado, arma, manosArriba: manos, mochila, cartuchos,
      // En pasos de 32, y espejado si la figura se dibuja al revés.
      armaDir: armaDirDibujo,
      asomado: asomadoDibujo, panuelo: !!f.panuelo, abre,
    };
    if (modo === 'trotar') datos.trote = cuadro;
    else {
      datos.paso = cuadro;
      // Agazapado (arriba del tren) es un agachado más hondo: de costado tiene
      // su propio dibujo; de frente y de espaldas usa el agachado de siempre.
      datos.agachado = modo === 'agachado' || modo === 'agazapado';
      datos.agazapado = modo === 'agazapado';
    }
    if (modo === 'sentado' || modo === 'rendido' || modo === 'montado') datos.postura = modo;
    fn(L, datos);
    return L.canvas();
  });

  const ctx = r.ctx;
  const estampar = (imagen, dx = 0, dy = 0) => {
    ctx.save();
    ctx.translate(anclaX + dx, anclaPies + dy);
    if (espejo) ctx.scale(-1, 1);
    ctx.drawImage(imagen, -M.cx * PUNTO, -M.pie * PUNTO, M.ancho * PUNTO, M.alto * PUNTO);
    ctx.restore();
  };

  // La orilla de los jefes: la misma figura pintada, corrida un punto para
  // cada lado. Es lo que dice si está aturdido, invulnerable o furioso.
  if (f.orilla) {
    const anillo = armar(clave + '|o' + f.orilla, () => tenido(img, f.orilla, 1));
    for (const [dx, dy] of [[-PUNTO, 0], [PUNTO, 0], [0, -PUNTO], [0, PUNTO]]) estampar(anillo, dx, dy);
  }
  estampar(f.destello ? armar(clave + '|flash', () => tenido(img, '#ffe8c0', 0.75)) : img);

  const cabeza = arriba + baja;

  /**
   * DÓNDE QUEDARON LAS MANOS DEL JINETE, en unidades del mundo. De acá salen
   * las riendas, y tienen que salir de ACÁ y no de un punto inventado: el
   * torso se echa adelante (`inclina`) y las manos se van con él, así que
   * cualquier número fijo se despegaría en cuanto el caballo apura.
   *
   * Se pasa el punto del dibujo por el MISMO `deformar` con que se dibujó, y
   * de ahí al mundo con la cuenta de `estampar`.
   */
  let mano = null;
  if (modo === 'montado') {
    const [hx, hy] = conHuesos
      ? huesosDeLado({ inclina }).cuerpo(35, 47)
      : deformar(inclina)(...(fn === lado ? [35, 47] : [30, 48]));
    mano = {
      x: anclaX + (espejo ? -1 : 1) * (hx - 24) * PUNTO,
      y: anclaPies + (hy - 74) * PUNTO,
    };
  }

  /**
   * 🎯 DÓNDE QUEDARON LA BOCA DEL CAÑO Y EL HOMBRO DEL ARMA, en el mundo (sólo
   * el esqueleto los sabe). De la boca sale el fogonazo; desde el hombro se
   * apunta, para que el arma dibujada caiga sobre la mira.
   */
  const aMundo = (p) => p && {
    x: anclaX + (espejo ? -1 : 1) * (p[0] * M.s + OX - M.cx) * PUNTO,
    y: anclaPies + (p[1] * M.s + OY - M.pie) * PUNTO,
  };
  const info = img.info || {};

  return {
    x,
    mano,
    boca: aMundo(info.boca),
    hombro: aMundo(info.hombro),
    top: cabeza,
    arriba: manos || postura === 'rendido' ? cabeza - 3 : cabeza,
    manoY: pies - 9 + baja,
    pechoY: pies - 11 + baja,
    vista: nombre,
    espejo,
  };
}

/**
 * 🎨 ESTILO NUEVO · P2: EL JUGADOR DIBUJADO A MANO (entities/estiloNuevo/jugador.js),
 * con la prueba prendida ([F9]) y adentro del vagón. Se para en la grilla
 * (cada 0,75 unidades) y recibe la luz pareja del lugar donde está parado.
 * Devuelve lo mismo que `dibujarPersona`, más la boca del caño.
 */
/**
 * 🔁 OCHO CUADROS POR CICLO (dos pasos) para todo lo que se mueve *(Santi: "a
 * partir de ahora creo que todo debería ser 8 fotogramas")*. Y el trote da un
 * paso cada 19 unidades *(elegido por Santi)*: con 20 los pies patinaban (entre
 * los pies dibujados había 10) y con 16 las piernas iban apuradas ("las piernas
 * avanzan demasiado rápido"). La velocidad no cambia: son 4,1 pasos por segundo.
 */
const PASO_NUEVO = { trotar: 19, caminar: 14, agachado: 14 };
const cuadro8 = (recorrido, modo) => Math.floor((((recorrido / PASO_NUEVO[modo]) % 2) + 2) % 2 * 4) % 8;
function jugadorNuevo(r, f) {
  const PASO = CONFIG.estilo.punto / 4;
  const [vista, , , espejo] = VISTA[direccionDe(f.angulo ?? Math.PI / 2)];
  const agachado = (f.postura || 'pie') !== 'pie';
  let piernas = 'quieto';
  if (agachado) piernas = f.fase != null ? 'G' + cuadro8(f.fase, 'agachado') : 'agachado';
  else if (f.fase != null) {
    if (f.modo === 'caminar') piernas = 'W' + cuadro8(f.fase, 'caminar');
    else piernas = 'R' + cuadro8(f.fase, 'trotar');
  }
  const al = armaLarga(f.arma);
  const arma = !f.arma ? null : al ? (al.cadera ? 'escopeta' : 'winchester') : 'revolver';
  // Para el dibujo nuevo, cuál revólver: el Smith & Wesson es un Schofield; el resto, el Colt.
  const armaNueva = arma === 'revolver' ? (f.armaId === 'smith' ? 'smith' : 'colt') : arma;
  const a = f.angulo ?? 0;
  const ang = espejo ? Math.PI - a : a;
  const x = Math.round(f.x / PASO) * PASO, pies = Math.round(f.pies / PASO) * PASO;
  // Nunca más oscuro que un escalón: a vos te tenés que ver siempre, aunque
  // estés lejos de los faroles.
  const luz = Math.max(-1, estiloNuevo.luzEn ? estiloNuevo.luzEn(f.x, f.pies) : 0);
  const fino = CONFIG.estilo.bordeGente < CONFIG.estilo.punto;
  // El culatazo: de los 8 cuadros, cuál toca.
  const golpe = f.golpe != null ? Math.min(7, Math.floor(f.golpe * 8)) : null;
  // El arma larga, de cruzada (0) a apuntando (1), en 4 pasos (ver jugador.js).
  // El revólver usa el mismo dato para el brazo: 0 con el codo doblado, 1 recto, en 3 pasos.
  const empuna = arma === 'winchester' || arma === 'escopeta' ? Math.round((f.empuna ?? 1) * 3) / 3
    : Math.round((f.alza ?? 0) * 2) / 2;
  // 🔁 El brazo apunta en el mismo paso de 22,5° que el dibujo del arma: con el
  // ángulo exacto, el brazo y el arma se doblaban entre sí *(Santi: "el revolver
  // colt se ve raro al mirar diagonal hacia arriba… parece una banana")*. Es sólo
  // el dibujo: la bala sale hacia donde apuntás, como siempre.
  const L = lienzoJugador({ vista, piernas, arma: armaNueva, ang: Math.round(ang * 8 / Math.PI) * Math.PI / 8, mochila: Math.min(4, Math.round(f.mochila || 0)), fino, golpe, empuna }, luz, !!f.destello);
  const ctx = r.ctx;
  ctx.save();
  ctx.translate(x, pies);
  if (espejo) ctx.scale(-1, 1);
  ctx.drawImage(L.img, -PIES_NUEVO[0] * PASO, -PIES_NUEVO[1] * PASO, ANCHO_NUEVO * PASO, ALTO_NUEVO * PASO);
  if (fino) estiloNuevo.marcarGente(ctx, L.img, -PIES_NUEVO[0] * PASO, -PIES_NUEVO[1] * PASO, ANCHO_NUEVO * PASO, ALTO_NUEVO * PASO);
  ctx.restore();
  const aMundo = (p) => p && { x: x + (espejo ? -1 : 1) * (p[0] - PIES_NUEVO[0]) * PASO, y: pies + (p[1] - PIES_NUEVO[1]) * PASO };
  const top = pies - 27 * PASO;
  return { x, mano: null, boca: aMundo(L.boca), hombro: aMundo(L.hombro), top, arriba: top, manoY: pies - 9, pechoY: pies - 11, vista, espejo };
}

const SIGNO_ALERTA = ['xx', 'xx', 'xx', '..', 'xx'];
const SIGNO_SOSPECHA = ['xxx', '..x', '.xx', '...', '.x.'];
// El tambor de un revólver visto de frente: las recámaras y el eje.
const SIGNO_RECARGA = ['.xxx.', 'x.x.x', 'xxxxx', 'x.x.x', '.xxx.'];

/**
 * EL AVISO ENCIMA DE LA CABEZA, desde `arriba` hacia arriba.
 *
 *  - 'alerta':   un "!" rojo, fijo mientras pelea.
 *  - 'sospecha': un "?" que SE VA LLENANDO de abajo hacia arriba con cuánto le
 *    falta para verte (`llenado`, de 0 a 1): amarillo, y naranja pasado el
 *    66%. Lleno, te vio, y pasa a ser el "!". Te dice si llegás a esconderte.
 *
 * 🔁 ANTES ERA UN "?" FIJO CON UNA BARRITA ABAJO *(Santi: "podrías eliminar esa
 * barrita y hacer que el signo de encima sea el que se vaya pintando?")*. Es la
 * misma información en un solo dibujo, y sin barritas encima de la gente, que
 * es lo que se sacó por "arcade".
 *
 * LOS DOS LLEVAN BORDE NEGRO, como los textos: el "?" vacío es apagado a
 * propósito, y sin borde se perdía contra el piso de madera.
 *
 * Sigue midiendo lo mismo que antes a propósito: los avisos son información
 * para jugar, no dibujo, así que no se achicaron ni se agrandaron con la gente.
 *
 * Devuelve la fila de más arriba que ocupó, para seguir apilando.
 */
export function dibujarAviso(r, x, arriba, estado, llenado = 0) {
  const cx = Math.round(x);
  const B = 0.25;   // el borde: un punto
  const celdas = (forma, y0, dibujar) => {
    const ox = cx - Math.floor(forma[0].length / 2);
    forma.forEach((fila, i) => {
      for (let j = 0; j < fila.length; j++) if (fila[j] !== '.') dibujar(ox + j, y0 + i);
    });
  };
  const borde = (forma, y0) => celdas(forma, y0, (cxx, cy) => r.rect(cxx - B, cy - B, 1 + B * 2, 1 + B * 2, '#000'));

  if (estado === 'alerta') {
    const y0 = arriba - 7;
    borde(SIGNO_ALERTA, y0);
    celdas(SIGNO_ALERTA, y0, (cxx, cy) => r.rect(cxx, cy, 1, 1, '#ff3a2a'));
    return arriba - 8;
  }
  /**
   * 'recarga': el tambor de un revólver que se va llenando de bronce, de abajo
   * hacia arriba, con cuánto le falta para volver a tirar. Mientras se ve,
   * ese guardia no te puede disparar: es tu ventana.
   */
  if (estado === 'recarga') {
    const y0 = arriba - 7;
    const alto = SIGNO_RECARGA.length;
    const lleno = Math.round(Math.min(1, Math.max(0, llenado)) * alto / B) * B;
    const corte = y0 + alto - lleno;
    borde(SIGNO_RECARGA, y0);
    celdas(SIGNO_RECARGA, y0, (cxx, cy) => {
      r.rect(cxx, cy, 1, 1, '#5a5040');
      const desde = Math.max(cy, corte);
      if (desde < cy + 1) r.rect(cxx, desde, 1, cy + 1 - desde, '#e8b84a');
    });
    return arriba - 8;
  }
  if (estado === 'sospecha') {
    const y0 = arriba - 7;
    const alto = SIGNO_SOSPECHA.length;
    // Hasta dónde llega lo pintado, en puntos enteros: de abajo hacia arriba.
    const lleno = Math.round(Math.min(1, Math.max(0, llenado)) * alto / B) * B;
    const corte = y0 + alto - lleno;
    const color = llenado > 0.66 ? '#e07a4a' : '#f8d830';
    borde(SIGNO_SOSPECHA, y0);
    celdas(SIGNO_SOSPECHA, y0, (cxx, cy) => {
      r.rect(cxx, cy, 1, 1, '#5a5040');
      const desde = Math.max(cy, corte);
      if (desde < cy + 1) r.rect(cxx, desde, 1, cy + 1 - desde, color);
    });
    return arriba - 8;
  }
  return arriba;
}

/**
 * UNA PERSONA TIRADA EN EL PISO: muerta o desmayada. Acostada, con un brazo y
 * las piernas abiertas y el sombrero volado al lado (con su cinta, así se sabe
 * quién era). `sangre` agrega el charco; el desmayado no tiene, respira y
 * lleva la "z".
 *
 * El desmayado respira (el pecho sube y baja) y lleva su "z"; el muerto, el
 * charco. Va con el piso (ver el orden de dibujo del asalto): nunca tapa a nadie.
 */
export function dibujarTendido(r, x, y, opciones = {}) {
  const { sangre = false, respira = 0, grande = false, dormido = false } = opciones;
  const tipo = ROPA[opciones.tipo] ? opciones.tipo : 'guardia';
  const late = Math.round(respira) ? 1 : 0;
  const k = grande ? 1.25 : 1;          // los jefes son más grandes
  const cx = q(x), cy = q(y);

  // El charco va primero, abajo de todo.
  if (sangre) {
    r.rect(cx - 12 * k, cy - 1, 24 * k, 6, CONFIG.colors.blood);
    r.rect(cx - 8 * k, cy + 5, 16 * k, 2, tono(CONFIG.colors.blood, 0.8));
  }

  if (!r.ctx) {
    r.rect(cx - 10, cy - 3, 20, 7, opciones.color || NEGRO);
    return;
  }

  const img = armar(['tendido', tipo, late].join('|'), () => {
    const L = Lienzo(TENDIDO.ancho, TENDIDO.alto, 0, 0, 1, null);
    tendido(L, { tipo, late });
    return L.canvas();
  });
  r.ctx.drawImage(
    img,
    cx - TENDIDO.cx * PUNTO * k, cy - TENDIDO.cy * PUNTO * k,
    TENDIDO.ancho * PUNTO * k, TENDIDO.alto * PUNTO * k
  );

  if (dormido) {
    const z = ['xxx', '..x', '.x.', 'xxx'];
    z.forEach((fila, i) => {
      for (let j = 0; j < 3; j++) if (fila[j] !== '.') r.rect(cx - 8 + j, cy - 12 + i, 1, 1, '#c8d8f0');
    });
  }
}
