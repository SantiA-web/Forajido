/**
 * 🎯 A QUIÉN LE ESTÁS APUNTANDO, Y A QUÉ PARTE DEL CUERPO.
 *
 * *(Santi: "me pasa que hoy les disparo a la cabeza y no les hago daño")*.
 *
 * EL PROBLEMA ERA DE TRES CUARTOS, NO DE PUNTERÍA. En esta vista, más arriba en
 * la pantalla puede querer decir "más alto" o "más al fondo", y la bala no
 * distingue: viaja por el piso. Cuando ponías la mira en la cabeza de un
 * guardia, la bala iba hacia el punto del PISO que está detrás de él —17
 * unidades más al fondo que sus pies— y le pasaba por arriba. De abajo o de
 * arriba igual le pegaba (el camino cruza sus pies), pero de costado, nunca.
 *
 * LA SOLUCIÓN: si la mira está sobre el cuerpo de alguien, la bala va a SUS
 * PIES —a su lugar en el piso—, y la altura a la que apuntaste dice la ZONA
 * (cabeza, torso, piernas). Todo lo demás queda como estaba: la bala sigue
 * viajando por el piso, así que las paredes, los asientos y la cobertura
 * frenan exactamente lo mismo que antes. Por eso no cambia el equilibrio: se
 * le pega tanto como antes al que le apuntabas a los pies, sólo que ahora
 * también cuando le apuntás al cuerpo.
 *
 * 💥 Y CADA ZONA SACA DISTINTO (`danioDeBala`, abajo): la mira dice qué
 * parte querés, la puntería y la distancia deciden si le pegás ahí, y el arma
 * y la distancia, cuánto saca.
 */

import { CONFIG } from '../data/config.js';

/**
 * El cuerpo de alguien TAL COMO SE VE, en unidades del mundo: `{ x0, x1, y0,
 * y1, pies }`, con `y0` arriba (la cabeza). `clase`: 'guardia', 'pasajero',
 * 'jinete' o 'jugador'.
 */
export function cajaDeGolpe(ent, clase) {
  const G = CONFIG.golpe;
  if (clase === 'jinete') {
    // El caballo y el jinete juntos: los cascos en `y + 7` y la cabeza del
    // jinete bastante más arriba (ver `drawRider`, entities/rider.js).
    return { x0: ent.x - ent.hw, x1: ent.x + ent.hw, y0: ent.y - G.jineteAlto, y1: ent.y + 7, pies: ent.y + 7 };
  }
  // Tirado en el piso (noqueado, o tumbado por un tiro en la pierna): acostado.
  if ((clase === 'guardia' && (ent.inconsciente > 0 || ent.caido > 0)) || (clase === 'jugador' && ent.tumbado > 0)) {
    const T = G.tendido;
    return { x0: ent.x - T.ancho, x1: ent.x + T.ancho, y0: ent.y - T.arriba, y1: ent.y + T.abajo, pies: ent.y + ent.hh, tendido: true };
  }
  const pies = ent.y + ent.hh;
  let alto = G.alto * (ent.esJefe ? G.escalaJefe : 1);
  // De rodillas (rendido) el cuerpo queda más abajo (ver `baja` en figura.js).
  if (ent.rendido) alto -= G.bajaRendido;
  const ancho = G.ancho * (ent.esJefe ? G.escalaJefe : 1);
  return { x0: ent.x - ancho, x1: ent.x + ancho, y0: pies - alto, y1: pies, pies };
}

/** La zona del cuerpo a esta altura de la pantalla. */
function zonaEn(caja, py) {
  if (caja.tendido) return 'torso';
  const G = CONFIG.golpe;
  const f = (py - caja.y0) / (caja.y1 - caja.y0);
  return f < G.cabeza ? 'cabeza' : f < G.cabeza + G.torso ? 'torso' : 'piernas';
}

/**
 * ¿HAY ALGUIEN BAJO LA MIRA? Si hay varios encimados, el de más adelante (el
 * que tiene los pies más abajo en la pantalla): es el que se ve, y el que se ve
 * es al que le apuntás.
 *
 * Devuelve `{ x, y, alto, zona }`: `x`/`y` son sus pies en el piso (hacia donde
 * va la bala) y `alto` es a qué altura del cuerpo apuntaste, en unidades sobre
 * los pies (para dibujar la bala a esa altura). O `null` si no hay nadie.
 */
export function blancoBajoLaMira(mx, my, world) {
  let mejor = null;
  const probar = (ent, clase) => {
    const c = cajaDeGolpe(ent, clase);
    if (mx < c.x0 || mx > c.x1 || my < c.y0 || my > c.y1) return;
    if (mejor && c.pies <= mejor.pies) return;
    mejor = { x: ent.x, y: ent.y, alto: Math.max(0, c.pies - my), zona: zonaEn(c, my), pies: c.pies };
  };
  for (const e of world.enemies) if (e.alive) probar(e, 'guardia');
  for (const pa of world.passengers) if (pa.alive) probar(pa, 'pasajero');
  if (world.riders) for (const rd of world.riders) if (rd.alive) probar(rd, 'jinete');
  return mejor;
}

/** Al fallar la zona que querías, la bala cae en la de al lado. */
function zonaVecina(zona, rng) {
  if (zona !== 'torso') return 'torso';
  return rng.chance(0.25) ? 'cabeza' : 'piernas';
}

/** Qué fracción del alcance ya recorrió la bala: 0 en la boca, 1 en la punta. */
function recorrido(b) {
  if (!(b.rango > 0)) return 0;
  return Math.min(1, Math.hypot(b.x - b.x0, b.y - b.y0) / b.rango);
}

/**
 * 💥 CUÁNTO SACA ESTA BALA A ESTA PERSONA, y en qué parte le pegó. Devuelve
 * `{ puntos, zona }`. `victima`: 'guardia' o 'jugador' (ver CONFIG.golpe.danio).
 *
 * Tres pasos, uno por cada cosa que pidió Santi: *"depende de con qué arma, a
 * qué distancia y dónde le des le baja más o menos vida"*.
 *
 *  1. DÓNDE LE PEGA. Tu bala va a la zona que tenía la mira con una chance que
 *     baja con la distancia y sube apuntando (`acierto`); si falla, a la de al
 *     lado. Las de los guardias —y las tuyas sin nadie bajo la mira— sortean
 *     (`sorteoGuardia`). Al que está tirado en el piso le pega en el cuerpo.
 *  2. CUÁNTO, al azar dentro del rango de esa zona, y el blindado con el
 *     pecho protegido.
 *  3. LA DISTANCIA Y EL ARMA: completo hasta `plenoHasta` del alcance, y de
 *     ahí baja hasta `alFinal` en la punta.
 */
export function danioDeBala(b, persona, victima, rng) {
  const D = CONFIG.golpe.danio;
  const lejos = recorrido(b);

  let zona;
  const tirado = persona.caido > 0 || persona.inconsciente > 0 || persona.tumbado > 0;
  if (tirado) {
    zona = 'torso';
  } else if (b.owner === 'player' && b.zonaElegida) {
    const A = D.acierto;
    const ap = Math.max(0, Math.min(1, b.apuntado || 0));
    const cerca = A.sueltoCerca + (A.apuntadoCerca - A.sueltoCerca) * ap;
    const punta = A.sueltoLejos + (A.apuntadoLejos - A.sueltoLejos) * ap;
    const chance = cerca + (punta - cerca) * lejos;
    zona = rng.chance(chance) ? b.zona : zonaVecina(b.zona, rng);
  } else {
    const S = D.sorteoGuardia;
    const t = rng.next();
    zona = t < S.cabeza ? 'cabeza' : t < S.cabeza + S.torso ? 'torso' : 'piernas';
  }

  const tabla = victima === 'jugador' ? D.contraJugador : D.contraGuardia;
  const [min, max] = tabla[zona];
  let puntos = min + rng.next() * (max - min);
  if (zona === 'torso' && persona.type === 'blindado') puntos *= D.blindadoPecho;

  const caida = b.caida || D.caidaGuardias;
  if (lejos > caida.plenoHasta) {
    const t = (lejos - caida.plenoHasta) / Math.max(0.001, 1 - caida.plenoHasta);
    puntos *= 1 + (caida.alFinal - 1) * t;
  }

  return { puntos: Math.round(puntos), zona };
}
