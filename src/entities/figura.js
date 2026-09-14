/**
 * LA PERSONA DE CUERPO ENTERO — tres cuartos, etapa B.
 *
 * *(Santi eligió 16 px de alto y 4 direcciones)*. Hasta acá cada persona del
 * tren era la caja con la que choca vista desde arriba —un rectángulo del color
 * de su estado— con un sombrero encima. En tres cuartos se ve de pie: piernas,
 * torso, cabeza y sombrero, mirando hacia uno de cuatro lados.
 *
 * LA CAJA QUE RECIBE LAS BALAS NO CAMBIÓ (decisión de la etapa A): sigue siendo
 * `hw`/`hh`, a la altura del cuerpo. El dibujo se apoya con los pies en el
 * borde de abajo de esa caja (`pies = y + hh`) y crece hacia arriba. Así todo
 * lo medido —cobertura, puntería, reses, montículos— sigue valiendo.
 *
 * UNA SOLA FIGURA PARA TODOS. El jugador, los guardias, los pasajeros y el jefe
 * son la misma persona con otra ropa: lo que cambia es el color del cuerpo (que
 * sigue diciendo el ESTADO), el sombrero, y las marcas de cada tipo que dibuja
 * cada uno encima (la placa, la estrella, la bandolera). Es la regla que ya
 * tenían los guardias: el tipo se lee en la silueta, el estado en el color.
 *
 * TODO SE DIBUJA CON `r.rect` Y `r.line`, nunca tocando el contexto directo:
 * así un renderer "de un solo color" (la silueta del jinete detrás de la pared,
 * `siluetaDeJinete` en raidScene) puede pintar cualquier figura sin enterarse.
 *
 * Las filas, de abajo hacia arriba, con `pies` en la fila de las botas:
 *
 *   pies-16 … pies-15   la copa del sombrero
 *   pies-14             el ala (tapa la frente)
 *   pies-13 … pies-12   la cara
 *   pies-11 … pies-6    el torso (con el cinto abajo)
 *   pies-5  … pies-1    las piernas y las botas
 */

import { CONFIG } from '../data/config.js';

export const ALTO_PERSONA = 16;

const BOTA = '#2a2320';
const PELO = '#3a2a20';

/** El mismo color, multiplicado por `f` (0,7 es 30% más oscuro). */
export function tono(hex, f) {
  if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  const c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}

/**
 * DE UN ÁNGULO A UNA DE LAS CUATRO DIRECCIONES. El ángulo va como en todo el
 * juego: 0 a la derecha y creciendo hacia abajo de la pantalla, así que
 * "abajo" es mirar a la cámara (de frente) y "arriba" es darle la espalda.
 */
export function direccionDe(angulo) {
  const a = Math.atan2(Math.sin(angulo), Math.cos(angulo));
  const q = Math.PI / 4;
  if (a > -q && a <= q) return 'der';
  if (a > q && a <= 3 * q) return 'frente';
  if (a <= -q && a > -3 * q) return 'espalda';
  return 'izq';
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

/**
 * DIBUJA UNA PERSONA.
 *
 * @param f.x, f.pies     el centro y la fila de las botas
 * @param f.dir           'frente' | 'espalda' | 'der' | 'izq' (ver `direccionDe`)
 * @param f.fase          en qué punto del paso va, o `null` si está parado
 * @param f.cuerpo        el color del torso: el ESTADO, en guardias y pasajeros
 * @param f.piel          la cara
 * @param f.pantalon      las piernas (por defecto, un marrón oscuro)
 * @param f.sombrero      { tipo: 'ala' | 'ancho' | 'chico' | 'copa' | 'ninguno', color, cinta }
 * @param f.postura       'pie' | 'agachado' | 'sentado' | 'rodillas'
 * @param f.alzado        de rodillas: 0 arrodillado … 1 ya de pie (la traición)
 * @param f.brazosArriba  las manos en alto (rendido, asaltado)
 * @param f.arma          { angulo, largo, color, punta, doble } o `null`
 * @param f.sacudida      px de temblor horizontal (pánico)
 *
 * @returns dónde quedó cada parte, para que cada tipo le dibuje sus marcas
 *   encima: `{ x, torsoY, torsoH, cabezaY, arriba }`.
 */
export function dibujarFigura(r, f) {
  const x = Math.round(f.x + (f.sacudida || 0));
  const pies = Math.round(f.pies);
  const dir = f.dir || 'frente';
  const costado = dir === 'der' || dir === 'izq';
  const lado = dir === 'izq' ? -1 : 1;
  const postura = f.postura || 'pie';
  const pantalon = f.pantalon || '#4a3a2e';
  const oscuro = tono(f.cuerpo, 0.72);

  /**
   * CUÁNTO BAJA TODO LO DE ARRIBA según la postura: agachado y sentado, 4 px
   * (las piernas se doblan); de rodillas, entre 5 y 0 según `alzado`, que es lo
   * que deja ver a un rendido pararse de a poco antes de traicionarte.
   */
  const baja = postura === 'agachado' || postura === 'sentado' ? 4
    : postura === 'rodillas' ? Math.round(5 * (1 - (f.alzado || 0)))
      : 0;
  const torsoY = pies - 11 + baja;
  const cabezaY = pies - 14 + baja;

  // --- El arma, si le da la espalda a la cámara va DETRÁS del cuerpo ---
  const arma = f.arma;
  const dibujarArma = () => {
    if (!arma) return;
    const ax = x + (costado ? lado * 2 : (dir === 'frente' ? 3 : -3));
    const ay = torsoY + 2;
    const cos = Math.cos(arma.angulo);
    const sin = Math.sin(arma.angulo);
    r.line(ax, ay, ax + cos * arma.largo, ay + sin * arma.largo, arma.color);
    if (arma.doble) {
      // El segundo revólver, corrido a un costado del primero.
      const nx = -sin * 3;
      const ny = cos * 3;
      r.line(ax + nx, ay + ny, ax + nx + cos * arma.largo, ay + ny + sin * arma.largo, arma.color);
    }
    if (arma.punta) r.rect(ax + cos * (arma.largo + 1), ay + sin * (arma.largo + 1), 1, 1, arma.punta);
  };
  if (dir === 'espalda') dibujarArma();

  // --- Las piernas ---
  const paso = f.fase == null ? 0 : Math.sin(f.fase * Math.PI);
  const zancada = paso > 0.35 ? 1 : paso < -0.35 ? -1 : 0;
  if (postura === 'sentado') {
    // Sentado: los muslos hacia adelante y las botas colgando.
    if (costado) {
      r.rect(x - 1, pies - 5, lado * 5, 2, pantalon);
      r.rect(x + lado * 4, pies - 4, lado, 3, BOTA);
    } else {
      r.rect(x - 3, pies - 4, 2, 3, pantalon);
      r.rect(x + 1, pies - 4, 2, 3, pantalon);
      r.rect(x - 3, pies - 2, 2, 1, BOTA);
      r.rect(x + 1, pies - 2, 2, 1, BOTA);
    }
  } else if (postura === 'agachado' || (postura === 'rodillas' && baja > 1)) {
    // Doblado: las piernas se ven cortas y abiertas, las rodillas adelante.
    const alto = Math.max(1, 5 - baja);
    r.rect(x - 3, pies - alto, 2, alto, pantalon);
    r.rect(x + 1, pies - alto, 2, alto, pantalon);
    r.rect(x - 4, pies - 1, 3, 1, BOTA);
    r.rect(x + 1, pies - 1, 3, 1, BOTA);
  } else if (costado) {
    // De costado, una pierna adelante y otra atrás según el paso.
    const adelante = x + lado * (zancada === 0 ? 0 : 1);
    const atras = x - lado * (zancada === 0 ? 1 : 2);
    r.rect(Math.min(atras, atras + lado), pies - 5, 2, 5, tono(pantalon, 0.8));
    r.rect(Math.min(adelante, adelante + lado), pies - 5, 2, 5, pantalon);
    r.rect(Math.min(atras, atras + lado), pies - 1, 2, 1, BOTA);
    r.rect(Math.min(adelante, adelante + lado) + (lado > 0 ? 1 : -1), pies - 1, 2, 1, BOTA);
  } else {
    // De frente o de espaldas, la pierna que avanza se levanta un píxel.
    const izq = zancada > 0 ? 1 : 0;
    const der = zancada < 0 ? 1 : 0;
    r.rect(x - 3, pies - 5, 2, 5 - izq, pantalon);
    r.rect(x + 1, pies - 5, 2, 5 - der, pantalon);
    r.rect(x - 3, pies - 1 - izq, 2, 1, BOTA);
    r.rect(x + 1, pies - 1 - der, 2, 1, BOTA);
  }

  // --- El torso, con el cinto y los brazos ---
  if (costado) {
    r.rect(x - 2, torsoY, 5, 6, f.cuerpo);
    r.rect(x - 2, torsoY + 5, 5, 1, oscuro);
    if (!f.brazosArriba) r.rect(x + lado * (zancada === 0 ? 0 : -zancada), torsoY + 1, 1, 4, oscuro);
  } else {
    r.rect(x - 3, torsoY, 7, 6, f.cuerpo);
    r.rect(x - 3, torsoY + 5, 7, 1, oscuro);
    if (!f.brazosArriba) {
      r.rect(x - 4, torsoY + 1, 1, 4, oscuro);
      r.rect(x + 4, torsoY + 1, 1, 4, oscuro);
    }
  }
  if (f.brazosArriba) {
    r.rect(x - 4, cabezaY - 3, 1, 6, f.cuerpo);
    r.rect(x + 4, cabezaY - 3, 1, 6, f.cuerpo);
    r.rect(x - 4, cabezaY - 4, 1, 1, f.piel);
    r.rect(x + 4, cabezaY - 4, 1, 1, f.piel);
  }

  // --- La cabeza ---
  if (dir === 'espalda') {
    r.rect(x - 2, cabezaY, 5, 3, PELO);
    r.rect(x - 2, cabezaY + 2, 5, 1, f.piel);
  } else if (costado) {
    r.rect(x - 2, cabezaY, 4, 3, f.piel);
    r.rect(x - 2 + (lado > 0 ? 0 : 2), cabezaY, 2, 2, PELO);
    r.rect(x + lado * 2 + (lado > 0 ? 0 : -1), cabezaY + 1, 1, 1, f.piel);   // la nariz
  } else {
    r.rect(x - 2, cabezaY, 5, 3, f.piel);
    r.rect(x - 1, cabezaY + 1, 1, 1, BOTA);   // los ojos
    r.rect(x + 1, cabezaY + 1, 1, 1, BOTA);
  }

  // --- El sombrero ---
  const s = f.sombrero || { tipo: 'ala', color: CONFIG.colors.playerHat };
  let arriba = cabezaY - 2;
  if (s.tipo !== 'ninguno') {
    const ala = { ala: 9, ancho: 11, chico: 7, copa: 9 }[s.tipo] || 9;
    const copaAncho = s.tipo === 'chico' ? 3 : 5;
    const copaAlto = s.tipo === 'copa' ? 5 : s.tipo === 'chico' ? 1 : 2;
    const luz = tono(s.color, 1.5);
    r.rect(x - Math.floor(ala / 2), cabezaY, ala, 1, s.color);
    r.rect(x - Math.floor(copaAncho / 2), cabezaY - copaAlto, copaAncho, copaAlto, s.color);
    r.rect(x - Math.floor(copaAncho / 2), cabezaY - copaAlto, copaAncho, 1, luz);
    if (s.cinta) r.rect(x - Math.floor(copaAncho / 2), cabezaY - 1, copaAncho, 1, s.cinta);
    arriba = cabezaY - copaAlto;
  }

  if (dir !== 'espalda') dibujarArma();

  return { x, torsoY, torsoH: 6, cabezaY, arriba };
}

/**
 * UNA PERSONA TIRADA EN EL PISO: muerta o desmayada. Acostada de costado, con
 * la cabeza a un lado y el sombrero volado. `sangre` agrega el charco (los
 * desmayados no tienen, y es la única seña de que siguen vivos).
 *
 * Va con el piso (ver el orden de dibujo del asalto): nunca tapa a nadie.
 */
export function dibujarTendido(r, x, y, opciones = {}) {
  const { cuerpo, piel = CONFIG.colors.enemyPiel, sombrero = '#2a2320', sangre = false, respira = 0, grande = false } = opciones;
  const cx = Math.round(x);
  const cy = Math.round(y);
  const k = grande ? 1 : 0;
  if (sangre) {
    r.rect(cx - 7 - k, cy + 1, 14 + k * 2, 4, CONFIG.colors.blood);
    r.rect(cx - 5 - k, cy + 4, 9 + k * 2, 2, tono(CONFIG.colors.blood, 0.8));
  }
  r.rect(cx + 3 + k, cy, 5, 3, '#4a3a2e');                             // las piernas
  r.rect(cx + 7 + k, cy, 2, 3, BOTA);
  r.rect(cx - 3 - k, cy - 1 + Math.round(respira), 7 + k * 2, 4, cuerpo); // el torso
  r.rect(cx - 6 - k, cy, 3, 3, piel);                                  // la cabeza
  r.rect(cx - 10 - k, cy + 2, 4, 2, sombrero);                         // el sombrero, volado
}
