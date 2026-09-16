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
import { ROPA, Lienzo, deformar, NEGRO } from './gente/dibujo.js';
import { frente, espalda } from './gente/frente.js';
import { lado } from './gente/costado.js';
import { tendido, TENDIDO } from './gente/tendido.js';

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
const RITMO = { trotar: 20, caminar: 14, agachado: 14 };
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

  const modo = postura === 'sentado' || postura === 'rendido' ? postura
    : postura !== 'pie' ? 'agachado'
      : f.fase != null ? (f.modo === 'caminar' ? 'caminar' : 'trotar')
        : 'quieto';
  const sinPaso = modo === 'quieto' || modo === 'sentado' || modo === 'rendido';
  const cuadro = sinPaso ? 0 : cuadroDe(f.fase, modo);
  // Sentado y de rodillas el cuerpo queda más abajo: la cabeza también.
  const baja = modo === 'rendido' ? 3.5 : modo === 'sentado' ? 1.5 : 0;

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
  const arma = !!f.arma;
  const manos = !!f.manosArriba;
  const mochila = Math.min(4, Math.round(f.mochila || 0));

  // El dibujo se arma mirando a la derecha: si va en espejo, asomarse para la
  // derecha del mundo es asomarse para la izquierda del dibujo.
  const asomadoDibujo = asomado ? { dx: espejo ? -asomado.dx : asomado.dx, dy: asomado.dy } : null;

  const esc = f.escala || 1;
  const M = medidas(esc);
  const clave = [tipo, nombre, g, modo, cuadro, estado, arma ? 'a' : '', manos ? 'm' : '', mochila,
    f.panuelo ? 'p' : '', asomadoDibujo ? asomadoDibujo.dx + ',' + asomadoDibujo.dy : '', esc].join('|');
  const img = armar(clave, () => {
    // Al trotar el torso se va para adelante; de frente casi no se nota.
    const lateral = fn === lado ? 1 : g ? 0.5 : 0;
    const inclina = (modo === 'trotar' ? 0.1 : modo === 'agachado' ? 0.12 : 0) * lateral;
    const L = Lienzo(M.ancho, M.alto, OX, OY, M.s, deformar(inclina));
    const datos = {
      tipo, g, estado, arma, manosArriba: manos, mochila,
      asomado: asomadoDibujo, panuelo: !!f.panuelo,
    };
    if (modo === 'trotar') datos.trote = cuadro;
    else { datos.paso = cuadro; datos.agachado = modo === 'agachado'; }
    if (modo === 'sentado' || modo === 'rendido') datos.postura = modo;
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
  return {
    x,
    top: cabeza,
    arriba: manos || postura === 'rendido' ? cabeza - 3 : cabeza,
    manoY: pies - 9 + baja,
    pechoY: pies - 11 + baja,
    vista: nombre,
    espejo,
  };
}

const SIGNO_ALERTA = ['xx', 'xx', 'xx', '..', 'xx'];
const SIGNO_SOSPECHA = ['xxx', '..x', '.xx', '...', '.x.'];

/**
 * EL AVISO ENCIMA DE LA CABEZA, desde `arriba` hacia arriba.
 *
 *  - 'alerta':   un "!" rojo, fijo mientras pelea.
 *  - 'sospecha': un "?" amarillo y, debajo, la barrita de cuánto le falta para
 *    verte (se pone naranja pasado el 66%). La barrita no es adorno: te dice
 *    si llegás a esconderte.
 *
 * Sigue midiendo lo mismo que antes a propósito: los avisos son información
 * para jugar, no dibujo, así que no se achicaron ni se agrandaron con la gente.
 *
 * Devuelve la fila de más arriba que ocupó, para seguir apilando.
 */
export function dibujarAviso(r, x, arriba, estado, llenado = 0) {
  const cx = Math.round(x);
  const signo = (forma, color, y0) => {
    const ox = cx - Math.floor(forma[0].length / 2);
    forma.forEach((fila, i) => {
      for (let j = 0; j < fila.length; j++) if (fila[j] !== '.') r.rect(ox + j, y0 + i, 1, 1, color);
    });
  };
  if (estado === 'alerta') {
    signo(SIGNO_ALERTA, '#ff3a2a', arriba - 7);
    return arriba - 8;
  }
  if (estado === 'sospecha') {
    r.rect(cx - 6, arriba - 4, 12, 2, '#1a1512');
    r.rect(cx - 6, arriba - 4, Math.round(12 * Math.min(1, llenado)), 2, llenado > 0.66 ? '#e07a4a' : '#e0c44a');
    signo(SIGNO_SOSPECHA, '#f8d830', arriba - 10);
    return arriba - 11;
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
