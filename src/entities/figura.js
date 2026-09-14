/**
 * LA PERSONA DE CUERPO ENTERO — tres cuartos, etapa B.
 *
 * *(Santi eligió 4 direcciones; el alto empezó en 16 y pasó a 24, ver abajo)*. Hasta acá cada persona del
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
 * 📏 16×24, NO 16×16 *(Santi: "hacelo 16x24")*. Con 16 de alto la ropa y los
 * detalles no se iban a notar. 16×24 es el CUADRO donde se dibuja, como el
 * 16×32 de Stardew Valley: el cuerpo no lo llena de ancho *(eligió "delgado,
 * como Stardew")* — torso de 9, con brazos 11, y sólo el sombrero ancho llega
 * a 15. Así una persona no ocupa un asiento entero (16) y se ve el de al lado.
 *
 * Las filas, de abajo hacia arriba, con `pies` justo debajo de las botas:
 *
 *   pies-24 … pies-22   la copa del sombrero (la galera del rico sube a -27)
 *   pies-22             el ala vista desde arriba (tres cuartos)
 *   pies-21             el ala de frente (tapa la frente)
 *   pies-20 … pies-18   la cara: sombra del ala, los ojos, la quijada
 *   pies-17 … pies-9    el torso: camisa, el cinto en -10 y la cadera en -9
 *   pies-8  … pies-1    las piernas, con las botas en las dos de abajo
 */

import { CONFIG } from '../data/config.js';

export const ALTO_PERSONA = 24;

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
  const sombra = tono(f.cuerpo, 0.86);
  const pielSombra = tono(f.piel, 0.8);

  /**
   * CUÁNTO BAJA TODO LO DE ARRIBA según la postura: agachado y sentado, 6 px
   * (las piernas se doblan); de rodillas, entre 7 y 0 según `alzado`, que es lo
   * que deja ver a un rendido pararse de a poco antes de traicionarte.
   */
  const baja = postura === 'agachado' || postura === 'sentado' ? 6
    : postura === 'rodillas' ? Math.round(7 * (1 - (f.alzado || 0)))
      : 0;
  const torsoY = pies - 17 + baja;
  const cabezaY = pies - 21 + baja;

  // --- El arma, si le da la espalda a la cámara va DETRÁS del cuerpo ---
  const arma = f.arma;
  const dibujarArma = () => {
    if (!arma) return;
    // Sale de la mano: a la altura del pecho, al costado del torso.
    const ax = x + (costado ? lado * 3 : (dir === 'frente' ? 5 : -5));
    const ay = torsoY + 4;
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
      r.rect(lado > 0 ? x : x - 6, pies - 4, 7, 2, pantalon);
      const canilla = lado > 0 ? x + 5 : x - 6;
      r.rect(canilla, pies - 3, 2, 2, pantalon);
      r.rect(canilla + (lado > 0 ? 0 : -1), pies - 1, 3, 1, BOTA);
    } else {
      r.rect(x - 3, pies - 3, 3, 2, pantalon);
      r.rect(x + 1, pies - 3, 3, 2, pantalon);
      r.rect(x - 3, pies - 1, 3, 1, BOTA);
      r.rect(x + 1, pies - 1, 3, 1, BOTA);
    }
  } else if (postura === 'agachado' || (postura === 'rodillas' && baja > 1)) {
    // Doblado: las piernas se ven cortas y abiertas, las rodillas adelante.
    const alto = Math.max(2, 8 - baja);
    r.rect(x - 4, pies - alto, 3, alto, pantalon);
    r.rect(x + 2, pies - alto, 3, alto, pantalon);
    r.rect(x - 5, pies - 1, 4, 1, BOTA);
    r.rect(x + 2, pies - 1, 4, 1, BOTA);
  } else if (costado) {
    // De costado, una pierna adelante y otra atrás según el paso. Cada pierna
    // tiene 3 de ancho; la de atrás, más oscura; la bota apunta hacia adelante.
    const pierna = (corrida, color) => {
      const izquierda = x + corrida - 1;
      r.rect(izquierda, pies - 8, 3, 6, color);
      r.rect(izquierda + (lado > 0 ? 0 : -1), pies - 2, 4, 2, BOTA);
    };
    pierna(-lado * (zancada === 0 ? 1 : 2), tono(pantalon, 0.8));
    pierna(lado * (zancada === 0 ? 0 : 2), pantalon);
  } else {
    // De frente o de espaldas, la pierna que avanza se levanta un píxel.
    const izq = zancada > 0 ? 1 : 0;
    const der = zancada < 0 ? 1 : 0;
    r.rect(x - 3, pies - 8, 3, 6 - izq, pantalon);
    r.rect(x + 1, pies - 8, 3, 6 - der, pantalon);
    r.rect(x - 3, pies - 2 - izq, 3, 2, BOTA);
    r.rect(x + 1, pies - 2 - der, 3, 2, BOTA);
  }

  // --- El torso: camisa, cinto y cadera, con los brazos ---
  if (costado) {
    r.rect(x - 3, torsoY, 7, 7, f.cuerpo);
    r.rect(lado > 0 ? x - 3 : x + 3, torsoY, 1, 7, sombra);   // la espalda, en sombra
    r.rect(x - 3, torsoY + 7, 7, 1, oscuro);
    r.rect(x - 3, torsoY + 8, 7, 1, pantalon);
    if (!f.brazosArriba) {
      // El brazo va y viene al revés que la pierna de adelante.
      const bx = x - 1 - lado * zancada;
      r.rect(bx, torsoY + 1, 2, 6, oscuro);
      r.rect(bx, torsoY + 7, 2, 1, f.piel);
    }
  } else {
    r.rect(x - 4, torsoY, 9, 7, f.cuerpo);
    r.rect(x + 3, torsoY, 1, 7, sombra);
    r.rect(x - 4, torsoY + 7, 9, 1, oscuro);
    r.rect(x - 4, torsoY + 8, 9, 1, pantalon);
    if (!f.brazosArriba) {
      r.rect(x - 5, torsoY + 1, 1, 6, oscuro);
      r.rect(x + 5, torsoY + 1, 1, 6, oscuro);
      r.rect(x - 5, torsoY + 7, 1, 1, f.piel);
      r.rect(x + 5, torsoY + 7, 1, 1, f.piel);
    }
  }

  // --- La cabeza ---
  if (dir === 'espalda') {
    r.rect(x - 3, cabezaY, 7, 3, PELO);
    r.rect(x - 2, cabezaY + 3, 5, 1, f.piel);                  // la nuca
  } else if (costado) {
    r.rect(x - 2, cabezaY, 5, 4, f.piel);
    r.rect(x - 2, cabezaY + 1, 5, 1, pielSombra);              // la sombra del ala
    r.rect(lado > 0 ? x - 2 : x + 1, cabezaY, 2, 3, PELO);     // el pelo de atrás
    r.rect(x + lado, cabezaY + 2, 1, 1, BOTA);                 // el ojo
    r.rect(x + lado * 3, cabezaY + 2, 1, 1, f.piel);           // la nariz
  } else {
    r.rect(x - 3, cabezaY, 7, 4, f.piel);
    r.rect(x - 3, cabezaY + 1, 7, 1, pielSombra);
    r.rect(x - 3, cabezaY + 1, 1, 2, PELO);                    // las patillas
    r.rect(x + 3, cabezaY + 1, 1, 2, PELO);
    r.rect(x - 1, cabezaY + 2, 1, 1, BOTA);                    // los ojos
    r.rect(x + 1, cabezaY + 2, 1, 1, BOTA);
  }

  // --- El sombrero ---
  const s = f.sombrero || { tipo: 'ala', color: CONFIG.colors.playerHat };
  let arriba = cabezaY - 1;
  if (s.tipo !== 'ninguno') {
    const ala = { ala: 13, ancho: 15, chico: 9, copa: 11 }[s.tipo] || 13;
    const copaAncho = s.tipo === 'chico' ? 5 : 7;
    const copaAlto = s.tipo === 'copa' ? 6 : s.tipo === 'chico' ? 2 : 3;
    const luz = tono(s.color, 1.5);
    const izqAla = x - Math.floor(ala / 2);
    const izqCopa = x - Math.floor(copaAncho / 2);
    // Tres cuartos: se ve el ala de frente y, encima, un poco del ala por arriba.
    r.rect(izqAla, cabezaY, ala, 1, s.color);
    r.rect(izqAla + 1, cabezaY - 1, ala - 2, 1, tono(s.color, 1.2));
    r.rect(izqCopa, cabezaY - copaAlto, copaAncho, copaAlto, s.color);
    r.rect(izqCopa, cabezaY - copaAlto, copaAncho, 1, luz);
    if (s.cinta) r.rect(izqCopa, cabezaY - 1, copaAncho, 1, s.cinta);
    arriba = cabezaY - copaAlto;
  } else if (dir !== 'espalda') {
    r.rect(x - 3, cabezaY, 7, 1, PELO);
  }

  // Las manos en alto van por delante del ala del sombrero.
  if (f.brazosArriba) {
    for (const bx of [x - 6, x + 6]) {
      r.rect(bx, cabezaY - 4, 1, torsoY - cabezaY + 6, f.cuerpo);
      r.rect(bx, cabezaY - 5, 1, 2, f.piel);
    }
    r.rect(x - 5, torsoY + 1, 1, 1, f.cuerpo);
    r.rect(x + 5, torsoY + 1, 1, 1, f.cuerpo);
    arriba = Math.min(arriba, cabezaY - 5);
  }

  if (dir !== 'espalda') dibujarArma();

  return { x, torsoY, torsoH: 9, cabezaY, arriba };
}

/**
 * UNA PERSONA TIRADA EN EL PISO: muerta o desmayada. Acostada de costado, con
 * la cabeza a un lado y el sombrero volado. `sangre` agrega el charco (los
 * desmayados no tienen, y es la única seña de que siguen vivos).
 *
 * A la misma escala que la persona de pie: mide lo que mediría acostada.
 *
 * Va con el piso (ver el orden de dibujo del asalto): nunca tapa a nadie.
 */
export function dibujarTendido(r, x, y, opciones = {}) {
  const { cuerpo, piel = CONFIG.colors.enemyPiel, sombrero = '#2a2320', sangre = false, respira = 0, grande = false } = opciones;
  const cx = Math.round(x);
  const cy = Math.round(y);
  const k = grande ? 1 : 0;
  if (sangre) {
    r.rect(cx - 10 - k, cy + 1, 21 + k * 2, 5, CONFIG.colors.blood);
    r.rect(cx - 7 - k, cy + 5, 14 + k * 2, 3, tono(CONFIG.colors.blood, 0.8));
  }
  r.rect(cx + 5 + k, cy, 7, 4, '#4a3a2e');                              // las piernas
  r.rect(cx + 11 + k, cy, 3, 4, BOTA);
  r.rect(cx - 5 - k, cy - 1 + Math.round(respira), 11 + k * 2, 5, cuerpo); // el torso
  r.rect(cx - 5 - k, cy + 3 + Math.round(respira), 11 + k * 2, 1, tono(cuerpo, 0.72));
  r.rect(cx - 9 - k, cy, 4, 4, piel);                                    // la cabeza
  r.rect(cx - 15 - k, cy + 3, 6, 2, sombrero);                           // el sombrero, volado
}
