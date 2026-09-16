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
const ANCHO = Math.ceil(72 * S) + 2 * OX;
const ALTO = Math.ceil(80 * S) + OY;
const CX = Math.round(24 * S) + OX;      // dónde cae el centro del cuerpo
const PIE = Math.round(74 * S) + OY;     // y dónde caen los pies
const PUNTO = 0.25;                      // un punto de dibujo, en unidades

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
  const arriba = pies - ALTO_PERSONA;

  // El renderer de un solo color (la silueta del jinete detrás de la pared) no
  // tiene canvas: ahí se dibuja un bulto con la forma justa y listo.
  if (!r.ctx) {
    r.rect(x - 3, arriba + 3, 6, ALTO_PERSONA - 3, NEGRO);
    r.rect(x - 5, arriba, 10, 3, NEGRO);
    return { x, top: arriba, arriba, manoY: pies - 9, pechoY: pies - 11, vista: nombre, espejo };
  }

  const modo = postura !== 'pie' ? 'agachado'
    : f.fase != null ? (f.modo === 'caminar' ? 'caminar' : 'trotar')
      : 'quieto';
  const cuadro = modo === 'quieto' ? 0 : cuadroDe(f.fase, modo);
  // Los ojos rojos del encubierto entran por acá: es la misma cara de alerta.
  const estado = f.estado && f.estado !== 'calma' ? f.estado : (f.ojos ? 'alerta' : undefined);
  const arma = !!f.arma;
  const manos = !!f.manosArriba;
  const mochila = Math.min(4, Math.round(f.mochila || 0));

  const clave = [tipo, nombre, g, modo, cuadro, estado, arma ? 'a' : '', manos ? 'm' : '', mochila].join('|');
  const img = armar(clave, () => {
    // Al trotar el torso se va para adelante; de frente casi no se nota.
    const lateral = fn === lado ? 1 : g ? 0.5 : 0;
    const inclina = (modo === 'trotar' ? 0.1 : modo === 'agachado' ? 0.12 : 0) * lateral;
    const L = Lienzo(ANCHO, ALTO, OX, OY, S, deformar(inclina));
    const datos = { tipo, g, estado, arma, manosArriba: manos, mochila };
    if (modo === 'trotar') datos.trote = cuadro;
    else { datos.paso = cuadro; datos.agachado = modo === 'agachado'; }
    fn(L, datos);
    return L.canvas();
  });

  const ctx = r.ctx;
  const estampar = (imagen, dx = 0, dy = 0) => {
    ctx.save();
    ctx.translate(x + dx, pies + dy);
    if (espejo) ctx.scale(-1, 1);
    ctx.drawImage(imagen, -CX * PUNTO, -PIE * PUNTO, ANCHO * PUNTO, ALTO * PUNTO);
    ctx.restore();
  };

  // La orilla de los jefes: la misma figura pintada, corrida un punto para
  // cada lado. Es lo que dice si está aturdido, invulnerable o furioso.
  if (f.orilla) {
    const anillo = armar(clave + '|o' + f.orilla, () => tenido(img, f.orilla, 1));
    for (const [dx, dy] of [[-PUNTO, 0], [PUNTO, 0], [0, -PUNTO], [0, PUNTO]]) estampar(anillo, dx, dy);
  }
  estampar(f.destello ? armar(clave + '|flash', () => tenido(img, '#ffe8c0', 0.75)) : img);

  return {
    x,
    top: arriba,
    arriba: manos || postura === 'rendido' ? arriba - 3 : arriba,
    manoY: pies - 9,
    pechoY: pies - 11,
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
 * ⚠️ TODAVÍA ES EL DIBUJO VIEJO, chiquito al lado de la gente nueva: los
 * caídos se rehacen en la etapa 2b.
 *
 * Va con el piso (ver el orden de dibujo del asalto): nunca tapa a nadie.
 */
export function dibujarTendido(r, x, y, opciones = {}) {
  const { sangre = false, respira = 0, grande = false, cinta = null, dormido = false } = opciones;
  const color = opciones.color || NEGRO;
  const cx = Math.round(x);
  const cy = Math.round(y);
  const k = grande ? 1 : 0;
  const late = Math.round(respira);
  if (sangre) {
    r.rect(cx - 9 - k, cy + 1, 19 + k * 2, 4, CONFIG.colors.blood);
    r.rect(cx - 6 - k, cy + 4, 12 + k * 2, 2, tono(CONFIG.colors.blood, 0.8));
  }
  r.rect(cx - 12 - k, cy - 3, 3, 1, color);                       // el sombrero: la copa
  r.rect(cx - 13 - k, cy - 2, 5, 1, color);                       // y el ala
  if (cinta) r.rect(cx - 12 - k, cy - 3, 3, 1, cinta);
  r.rect(cx - 7 - k, cy - 2, 4, 4, color);                        // la cabeza
  r.rect(cx - 3 - k, cy - 2 + late, 8 + k * 2, 5, color);         // el torso
  r.rect(cx - 1, cy - 4 + late, 2, 2, color);                     // un brazo, tirado para arriba
  r.rect(cx + 1, cy + 3, 3, 1, color);                            // el otro
  r.rect(cx + 5 + k, cy - 2, 6, 2, color);                        // las piernas, abiertas
  r.rect(cx + 5 + k, cy + 1, 5, 2, color);
  if (dormido) {
    const z = ['xxx', '..x', '.x.', 'xxx'];
    z.forEach((fila, i) => {
      for (let j = 0; j < 3; j++) if (fila[j] !== '.') r.rect(cx - 6 + j, cy - 10 + i, 1, 1, '#c8d8f0');
    });
  }
}
