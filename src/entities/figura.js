/**
 * LA PERSONA — SOMBRAS CABEZONAS.
 *
 * *(Santi eligió el estilo en seis láminas; ver data/siluetas.js)*. Toda la
 * gente del juego es una silueta negra, sombreruda y cabezona, y el color
 * sale de sus detalles. Este archivo convierte las tablas de data/siluetas.js
 * en píxeles; los dibujos en sí viven allá.
 *
 * LA CAJA QUE RECIBE LAS BALAS NO CAMBIÓ (decisión de la etapa A): sigue siendo
 * `hw`/`hh`. El dibujo se apoya con los pies en el borde de abajo de esa caja
 * (`pies = y + hh`) y crece hacia arriba. Así todo lo medido —cobertura,
 * puntería, reses, montículos— sigue valiendo.
 *
 * 📏 DE 14 A 19 PÍXELES DE ALTO según el sombrero (la gorra es la más baja, la
 * galera la más alta), sobre 12 de ancho. La etapa B había llegado a 16×24 y
 * se veía como el muñequito de cualquier juego *(Santi: "creo que se ve muy
 * feo")*.
 *
 * 8 DIRECCIONES *(Santi: "quiero que hayan 8 direcciones en vez de 4")*, con
 * 5 dibujos: las tres de la izquierda son las de la derecha en espejo.
 *
 * LOS AVISOS DE ESTADO. Con la gente en negro, el color del cuerpo ya no puede
 * decir si un guardia te vio. Lo dicen los ojos (blancos, amarillos, rojos) y,
 * encima de la cabeza, `dibujarAviso`: un "?" amarillo con la barrita de
 * cuánto le falta para verte, o un "!" rojo fijo mientras pelea *(Santi: "y si
 * solo ponemos el signo de pregunta amarillo o el signo rojo de exclamación
 * por ahora"; eligió "? + barrita" y "! fijo")*.
 *
 * TODO SE DIBUJA CON `r.rect` Y `r.line`, nunca tocando el contexto directo:
 * así un renderer "de un solo color" (la silueta del jinete detrás de la pared,
 * `siluetaDeJinete` en raidScene) puede pintar cualquier figura sin enterarse.
 */

import { CONFIG } from '../data/config.js';
import {
  NEGRO, OJOS_ESTADO, SOMBREROS, CUERPOS, POSTURAS, TIPOS, sombreroDe,
} from '../data/siluetas.js';

/** El alto de una persona con gorra, la más común. */
export const ALTO_PERSONA = 15;

/** El mismo color, multiplicado por `f` (0,7 es 30% más oscuro). */
export function tono(hex, f) {
  if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  const c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}

const OCHO = ['der', 'abajoDer', 'abajo', 'abajoIzq', 'izq', 'arribaIzq', 'arriba', 'arribaDer'];

/** Cada dirección, a qué dibujo corresponde y si va en espejo. */
const VISTA = {
  der: ['lado', false],
  abajoDer: ['diagF', false],
  abajo: ['frente', false],
  abajoIzq: ['diagF', true],
  izq: ['lado', true],
  arribaIzq: ['diagE', true],
  arriba: ['espalda', false],
  arribaDer: ['diagE', false],
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
 * EN QUÉ PUNTO DEL PASO VA. Los guardias y los pasajeros no llevan una fase de
 * caminata (el jugador sí: `stepPhase`), así que se deduce de cuánto se movió
 * desde el cuadro anterior: un paso cada 5 px recorridos. Guarda su memoria en
 * la propia entidad con nombres que empiezan en `_andar`, y es SÓLO DIBUJO:
 * nada del juego lee esos campos.
 *
 * Devuelve `null` si hace unos cuadros que no se mueve (parado, piernas juntas).
 */
export function faseDeAndar(ent) {
  const px = ent._andarX ?? ent.x;
  const py = ent._andarY ?? ent.y;
  const d = Math.hypot(ent.x - px, ent.y - py);
  ent._andarX = ent.x;
  ent._andarY = ent.y;
  // Más de 12 px de un cuadro al otro no es caminar: es un salto o un empujón.
  if (d > 0.05 && d < 12) {
    ent._andarFase = (ent._andarFase || 0) + d / 5;
    ent._andarQuieto = 0;
  } else {
    ent._andarQuieto = (ent._andarQuieto || 0) + 1;
  }
  return ent._andarQuieto > 4 ? null : ent._andarFase || 0;
}

/** De la fase del paso al cuadro de las piernas: 0 parado, 1 y 2 los pasos. */
function pasoDe(fase) {
  if (fase == null) return 0;
  const s = Math.sin(fase * Math.PI);
  return s > 0.35 ? 1 : s < -0.35 ? 2 : 0;
}

function detallesDe(T, vista) {
  if (T[vista]) return T[vista];
  const correr = (d) => (d.corre ? { ...d, dx: d.dx + 1 } : d);
  if (vista === 'diagF') return T.frente.map(correr);
  if (vista === 'diagE') return T.espalda.map(correr);
  return [];
}

const CARTUCHO = '#e03a2a';
const CARTUCHO_BANDA = '#f0d0a8';
const CARTUCHO_VACIO = '#33291f';
const CORREA = '#8a6a4a';

/**
 * LA BANDOLERA DEL DINAMITERO, con los cartuchos que le QUEDAN. Los huecos van
 * en un marrón muerto: **la bandolera vacía tiene que leerse como vacía, no
 * como ausente** — es la única señal de la ventana en la que está desarmado.
 * Caben cuatro; si lleva más, se ve cuántos de cuatro.
 */
function bandolera(poner, izq, cuerpoY, vista, { cargados, total }) {
  const n = Math.min(4, total);
  const hay = Math.min(n, cargados);
  for (let i = 0; i < 4; i++) {
    const y = cuerpoY + 3 + i;
    if (vista === 'espalda' || vista === 'diagE') {
      poner(izq + 2 + 2 * i, y, CORREA);
      poner(izq + 3 + 2 * i, y, CORREA);
      continue;
    }
    if (vista === 'lado') {
      poner(izq + 5, y, CORREA);
      if (i < n) {
        poner(izq + 6, y, i < hay ? CARTUCHO : CARTUCHO_VACIO);
        poner(izq + 7, y, i < hay ? CARTUCHO_BANDA : CARTUCHO_VACIO);
      }
      continue;
    }
    const corre = vista === 'diagF' ? 1 : 0;
    poner(izq + 10 - 2 * i + corre, y, CORREA);
    if (i < n) {
      poner(izq + 8 - 2 * i + corre, y, i < hay ? CARTUCHO : CARTUCHO_VACIO);
      poner(izq + 9 - 2 * i + corre, y, i < hay ? CARTUCHO_BANDA : CARTUCHO_VACIO);
    }
  }
}

/**
 * DIBUJA UNA PERSONA.
 *
 * @param f.tipo          una clave de TIPOS (data/siluetas.js)
 * @param f.x, f.pies     el centro y la fila de abajo de las botas
 * @param f.angulo        hacia dónde mira (radianes)
 * @param f.fase          en qué punto del paso va, o `null` si está parado
 * @param f.postura       'pie' | 'agachado' | 'sentado' | 'rendido'
 * @param f.estado        'calma' | 'sospecha' | 'alerta' | 'aturdido': el color de los ojos
 * @param f.ojos          pisa el color de los ojos (los jefes)
 * @param f.manosArriba   las manos en alto (asaltado); `rendido` ya las lleva
 * @param f.panuelo       rendido: el pañuelo blanco en la mano
 * @param f.arma          { angulo, largo, color, punta, doble } o `null`
 * @param f.cartuchos     el dinamitero: { cargados, total }
 * @param f.orilla        pinta la orilla de la silueta de un color (el jefe furioso)
 * @param f.destello      toda la figura en blanco (le acaban de pegar)
 * @param f.sacudida      px de temblor horizontal (pánico)
 * @param f.extra         (poner, { izq, top, cuerpoY, vista }) para agregar píxeles
 *                        propios (la mochila), en coordenadas mirando a la derecha
 *
 * @returns `{ x, top, arriba, manoY, pechoY, vista, espejo }`: `arriba` es desde
 *   dónde se apilan las cosas encima de la cabeza.
 */
export function dibujarPersona(r, f) {
  const T = TIPOS[f.tipo] || TIPOS.guardia;
  const [vista, espejo] = VISTA[direccionDe(f.angulo ?? Math.PI / 2)];
  const postura = f.postura || 'pie';
  const hat = SOMBREROS[sombreroDe(T.sombrero, vista)];
  const cuerpo = postura === 'pie'
    ? CUERPOS[vista].top.concat(CUERPOS[vista].piernas[pasoDe(f.fase)])
    : POSTURAS[postura];
  const filas = hat.concat(cuerpo);

  const x = Math.round(f.x + (f.sacudida || 0));
  const top = Math.round(f.pies) - filas.length;
  const izq = x - 6;
  const cuerpoY = top + hat.length;
  // Lo que vuela se mueve con el paso; parado, quieto en el cuadro del medio.
  const cuadro = f.fase == null ? 1 : Math.floor(f.fase * 1.5);

  const mapa = new Map();
  const poner = (px, py, c) => mapa.set(px + ',' + py, [px, py, c]);

  let dets = detallesDe(T, vista);
  if (postura !== 'pie') dets = dets.filter((d) => d.capa === 'hat' || d.dy <= 4);
  const pintar = (d) => {
    const lista = d.frames ? d.frames[cuadro % d.frames.length] : d.rows;
    const oy = (d.capa === 'hat' ? top : cuerpoY) + d.dy;
    lista.forEach((fila, i) => {
      for (let j = 0; j < fila.length; j++) {
        if (fila[j] !== '.') poner(izq + d.dx + j, oy + i, T.pal[fila[j]]);
      }
    });
  };

  dets.filter((d) => d.detras).forEach(pintar);

  const conOjos = vista !== 'espalda' && vista !== 'diagE';
  const ojos = f.ojos || (T.ojosEstado ? (OJOS_ESTADO[f.estado] || OJOS_ESTADO.calma) : T.ojos);
  for (let fy = 0; fy < filas.length; fy++) {
    const fila = filas[fy];
    for (let fx = 0; fx < 12; fx++) {
      const ch = fila[fx];
      if (ch === '.') continue;
      poner(izq + fx, top + fy, ch === 'e' && conOjos ? ojos : NEGRO);
    }
  }

  dets.filter((d) => !d.detras).forEach(pintar);
  if (T.bandolera && f.cartuchos && postura !== 'sentado') bandolera(poner, izq, cuerpoY, vista, f.cartuchos);
  if (f.extra) f.extra(poner, { izq, top, cuerpoY, vista });

  if (postura === 'rendido' || f.manosArriba) {
    for (let y = top; y <= cuerpoY + 4; y++) {
      poner(izq - 1, y, NEGRO);
      poner(izq + 12, y, NEGRO);
    }
    if (f.panuelo) {
      for (const [ax, ay] of [[13, -2], [14, -2], [15, -2], [13, -1], [14, -1], [15, -1], [15, 0]]) {
        poner(izq + ax, top + ay, '#f4f0e8');
      }
    }
  }

  if (f.orilla) {
    const orilla = [];
    for (const [k, [px, py, c]] of mapa) {
      if (c !== NEGRO) continue;
      if (!mapa.has((px + 1) + ',' + py) || !mapa.has((px - 1) + ',' + py)
        || !mapa.has(px + ',' + (py + 1)) || !mapa.has(px + ',' + (py - 1))) orilla.push(k);
    }
    for (const k of orilla) mapa.get(k)[2] = f.orilla;
  }

  // --- El arma: sale de la mano. Si apunta para arriba, va detrás del cuerpo.
  const manoY = cuerpoY + (postura === 'pie' ? 6 : 5);
  const arma = f.arma;
  const dibujarArma = () => {
    const cos = Math.cos(arma.angulo);
    const sin = Math.sin(arma.angulo);
    const ax = x + cos * 3;
    const ay = manoY;
    r.line(ax, ay, ax + cos * arma.largo, ay + sin * arma.largo, arma.color);
    if (arma.doble) {
      const nx = -sin * 3;
      const ny = cos * 3;
      r.line(ax + nx, ay + ny, ax + nx + cos * arma.largo, ay + ny + sin * arma.largo, arma.color);
    }
    if (arma.punta) r.rect(ax + cos * (arma.largo + 1), ay + sin * (arma.largo + 1), 1, 1, arma.punta);
  };
  const armaAtras = arma && Math.sin(arma.angulo) < -0.3;
  if (armaAtras) dibujarArma();

  const eje = 2 * izq + 11;
  for (const [px, py, c] of mapa.values()) {
    r.rect(espejo ? eje - px : px, py, 1, 1, f.destello ? '#ffffff' : c);
  }

  if (arma && !armaAtras) dibujarArma();

  return {
    x, top,
    arriba: postura === 'rendido' || f.manosArriba ? top - 3 : top,
    manoY,
    pechoY: cuerpoY + 4,
    vista, espejo,
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
