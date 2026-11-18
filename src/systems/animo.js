/**
 * 🙂 EL ÁNIMO DE LA BANDA: HUMOR, LEALTAD, HABILIDADES Y PERSONALIDADES *(ver BRUJULA.md, "Rasgos, lealtad y humor")*.
 *
 * Las reglas, sin números: los números están todos en `ANIMO` (data/rasgos.js). Este archivo no sabe nada del dibujo ni
 * de las escenas: recibe el estado de uno de la banda (`gameState.banda[id]`) y lo cambia. Así lo usan igual el
 * simulador (simulador/simulador.js), que juega miles de partidas para equilibrar los números, y el juego.
 *
 * 🔁 Desde 2026-11-15 lo usa también el juego, por systems/animoEnJuego.js *(Santi: "conectá todo lo del ánimo")*.
 *
 * Lo que guarda en el estado de cada uno, además de `lealtad`, `humor` y `rasgos`:
 *  - `habilidades`: de cada habilidad que alguna vez practicó, `{ tiene, techo, ultimo }`: si la tiene hoy, lo más
 *    alto que llegó (para recuperarla más rápido) y el último día que la usó. Lo que sabe (0 a 100) va en `rasgos`.
 *  - `animo`: lo del día (`dia`, `inicio`: el humor con que arrancó, para el tope diario), lo que pasó hace poco
 *    (`recientes`, para que lo repetido rinda menos), los días del divertido sin actividad (`sinActividad`) y si ya
 *    avisó que se va (`avisado`).
 */

import { ANIMO, HUMOR, MARCA, esPersonalidad, palabraDeHumor } from '../data/rasgos.js';

/** Qué tan fuerte es una personalidad en él, de 0 a 1 (0 si no la tiene). */
export function fuerza(e, id) {
  return esPersonalidad(id) && e.rasgos && e.rasgos[id] ? e.rasgos[id] / 100 : 0;
}

/**
 * 🗣️ SI ESA PERSONALIDAD SE LE NOTA: mientras su marca no está gris (`MARCA.gris`). Para lo que un rasgo HACE y no se
 * puede hacer a medias (Confiable no se niega a los caballos; Valiente aguanta un tiro más): con la marca gris, ya no.
 */
export function marcaFuerte(e, id) {
  return fuerza(e, id) * 100 >= MARCA.gris;
}

/** Si tiene hoy esa habilidad. */
export function tiene(e, id) {
  return !!(e.habilidades && e.habilidades[id] && e.habilidades[id].tiene);
}

/**
 * 🗞️ LA CHANCE DE QUE TRAIGA UN RUMOR en una visita nueva (de 0 a 1), y el rasgo que más pesó (para contar de dónde lo
 * sacó). Ver `ANIMO.rumores` en data/rasgos.js: la base, más cada rasgo que hace hablar por su fuerza (las habilidades,
 * enteras si las tiene hoy).
 */
export function chanceDeRumor(e) {
  const R = ANIMO.rumores;
  let chance = R.base, porque = null, mas = 0;
  for (const id of ['alcoholico', 'curioso']) {
    const n = R[id] * fuerza(e, id);
    chance += n;
    if (n > mas) { mas = n; porque = id; }
  }
  for (const id of ['baraja', 'labia']) {
    if (!tiene(e, id)) continue;
    const n = R[id];
    chance += n;
    if (n > mas) { mas = n; porque = id; }
  }
  return { chance: Math.min(100, chance) / 100, porque };
}

function animoDe(e) {
  if (!e.animo) e.animo = { dia: 0, inicio: e.humor, recientes: {}, sinActividad: 0, avisado: false };
  return e.animo;
}

/**
 * MOVER EL HUMOR. `motivo` (opcional): si lo mismo pasó hace poco, rinde menos (la tercera botella de la semana casi
 * no sube nada). Al serio se le mueve menos. Nunca pasa del tope del día, sumando todo lo de ese día.
 * Devuelve cuánto se movió de verdad.
 */
export function moverHumor(e, n, motivo = null, dia = null) {
  // (📒 Con la libreta, el humor es una copia del ánimo: no se mueve solo. Ver systems/libreta.js.)
  if (e.libreta) return 0;
  const a = animoDe(e);
  if (motivo && dia != null) {
    const R = ANIMO.repetido;
    const antes = (a.recientes[motivo] || []).filter((d) => dia - d < R.ventana);
    n *= Math.pow(R.factor, antes.length);
    a.recientes[motivo] = [...antes, dia];
  }
  n *= 1 - (1 - ANIMO.serio) * fuerza(e, 'serio');
  const previo = e.humor, tope = ANIMO.topeDia;
  const piso = Math.max(1, a.inicio - tope), techo = Math.min(HUMOR.max, a.inicio + tope);
  e.humor = Math.max(piso, Math.min(techo, e.humor + n));
  return e.humor - previo;
}

/** MOVER LA LEALTAD: al frío casi no se le mueve, al sentimental más. Entre 0 y 10. */
export function moverLealtad(e, n, max = 10) {
  // (📒 Con la libreta, la lealtad de 0 a 5 se mueve sólo de a una marca, cada noche. Ver systems/libreta.js.)
  if (e.libreta) return;
  n *= 1 - ANIMO.frio * fuerza(e, 'frio');
  n *= 1 + (ANIMO.sentimental - 1) * fuerza(e, 'sentimental');
  e.lealtad = Math.max(0, Math.min(max, e.lealtad + n));
}

/**
 * EMPIEZA UN DÍA (una visita al campamento) para toda la banda: el humor de ayer empuja la lealtad, el humor vuelve
 * un poco a su punto de descanso, los de buen o mal humor contagian a los demás, el divertido sin actividad se
 * apaga, y las habilidades sin uso se olvidan. `descanso`: el punto de descanso de cada uno (por id).
 * Devuelve lo que el jugador notaría: `[{ id, que: 'perdio', habilidad }]`.
 */
export function nuevoDia(banda, ids, dia, descanso) {
  const notas = [];
  const presentes = ids.filter((id) => banda[id] && banda[id].esta);
  // (El contagio se calcula con el humor de ayer de todos, antes de mover a nadie.)
  const ayer = Object.fromEntries(presentes.map((id) => [id, banda[id].humor]));
  for (const id of presentes) {
    const e = banda[id], a = animoDe(e);
    a.dia = dia;
    a.inicio = e.humor;
    // 1. El humor de ayer empuja la lealtad.
    moverLealtad(e, ANIMO.aLealtad.find((t) => e.humor >= t.desde).n);
    // 2. Vuelve un poco a su punto de descanso (no cuenta para el tope: es el paso del tiempo).
    const base = descanso[id] ?? 50;
    e.humor += (base - e.humor) * ANIMO.vuelta * (1 - (1 - ANIMO.serio) * fuerza(e, 'serio'));
    a.inicio = e.humor;
    // 3. El contagio de los demás, con tope.
    let empuje = 0;
    for (const otro of presentes) if (otro !== id) empuje += (ayer[otro] - 50) * ANIMO.contagio.porPunto;
    moverHumor(e, Math.max(-ANIMO.contagio.tope, Math.min(ANIMO.contagio.tope, empuje)));
    // 4. El divertido sin actividad.
    const div = fuerza(e, 'divertido');
    if (div > 0) {
      a.sinActividad++;
      if (a.sinActividad > ANIMO.divertido.aguanta) moverHumor(e, -ANIMO.divertido.castigo * div);
    }
    // 5. Lo que no usa, se le olvida.
    for (const [hab, h] of Object.entries(e.habilidades || {})) {
      // (⭐ La que tiene estrellita no se olvida nunca.)
      if (h.estrella || dia - h.ultimo <= ANIMO.habilidad.gracia) continue;
      e.rasgos[hab] = Math.max(0, (e.rasgos[hab] || 0) - ANIMO.habilidad.olvido);
      if (h.tiene && e.rasgos[hab] < ANIMO.habilidad.pierde) {
        h.tiene = false;
        moverHumor(e, ANIMO.habilidad.humorPierde);
        notas.push({ id, que: 'perdio', habilidad: hab });
      }
    }
  }
  return notas;
}

/** El divertido hizo una actividad: le sube a él y contagia a los demás presentes. */
export function actividad(banda, ids, id, dia) {
  const e = banda[id], div = fuerza(e, 'divertido');
  if (div <= 0) return;
  animoDe(e).sinActividad = 0;
  moverHumor(e, ANIMO.divertido.actividad * div, 'actividad', dia);
  for (const otro of ids) if (otro !== id && banda[otro] && banda[otro].esta) moverHumor(banda[otro], ANIMO.divertido.contagia * div, 'actividadDe' + id, dia);
}

/**
 * CÓMO HACE SU PUESTO HOY, según su humor: `seNiega`, `malaGana`, `normal` o `potenciado`. `azar()` da un número de 0 a
 * 1 (Math.random en el juego; uno con semilla en el simulador, para que se pueda repetir). Con `puesto`, además puede
 * negarse por su personalidad (ver `ANIMO.niegaPorPuesto`).
 */
export function disposicion(e, azar = Math.random, puesto = null) {
  const palabra = palabraDeHumor(e.humor);
  const niega = ANIMO.seNiega[palabra] || 0;
  if (niega && azar() < niega) return 'seNiega';
  if (puesto && azar() < niegaPorQuienEs(e, puesto)) return 'seNiega';
  if (e.humor < ANIMO.disposicion.malaGana) return 'malaGana';
  if (e.humor >= ANIMO.disposicion.potenciado) return 'potenciado';
  return 'normal';
}

/** La chance de que no quiera ese puesto por su personalidad (todas las que tenga, juntas), según su humor. */
export function niegaPorQuienEs(e, puesto) {
  const tabla = ANIMO.niegaPorPuesto[puesto];
  if (!tabla) return 0;
  let sigue = 1;
  for (const [p, chance] of Object.entries(tabla)) sigue *= 1 - chance * fuerza(e, p);
  return (1 - sigue) * (ANIMO.niegaPorPuestoHumor[palabraDeHumor(e.humor)] ?? 1);
}

/** Cuánto cambia la chance de que le salga mal su puesto, según cómo lo hace hoy. */
export function cambioDeFalla(disp) {
  return disp === 'malaGana' ? ANIMO.malaGanaFalla : disp === 'potenciado' ? ANIMO.potenciadoFalla : 0;
}

/**
 * PRACTICAR UNA HABILIDAD (al usarla en su puesto, o en el campamento). De buen humor aprende más rápido, de mal humor
 * más lento, y por debajo de lo más alto que llegó alguna vez, más rápido (recuperarla es más fácil que aprenderla).
 * Devuelve `'gano'`, `'recupero'` o null. (Si llega a la estrellita, queda `habilidades[hab].estrella`.)
 */
export function practicar(e, hab, dia, rinde = 1) {
  const H = ANIMO.habilidad;
  if (!e.habilidades) e.habilidades = {};
  const h = e.habilidades[hab] || (e.habilidades[hab] = { tiene: false, techo: 0, ultimo: dia });
  h.ultimo = dia;
  const nivel = e.rasgos[hab] || 0;
  // ('rinde': lo que vale este uso; practicar en el campamento vale `ANIMO.habilidad.practica` de uno de verdad.)
  let n = H.porUso * rinde;
  if (e.humor >= ANIMO.disposicion.potenciado) n *= H.buenHumor;
  else if (e.humor < ANIMO.disposicion.malaGana) n *= H.malHumor;
  if (nivel < h.techo) n *= H.recuerda;
  // (⭐ Arriba de lo que hace falta para tenerla, sube más despacio: dominarla cuesta.)
  if (nivel >= H.gana) n *= H.arriba;
  e.rasgos[hab] = Math.min(100, nivel + n);
  h.techo = Math.max(h.techo, e.rasgos[hab]);
  if (!h.estrella && e.rasgos[hab] >= H.estrella) { h.estrella = true; h.ganoEstrella = dia; }
  if (!h.tiene && e.rasgos[hab] >= H.gana) {
    h.tiene = true;
    const antes = h.yaLaTuvo;
    h.yaLaTuvo = true;
    moverHumor(e, H.humorGana);
    return antes ? 'recupero' : 'gano';
  }
  return null;
}

/**
 * CONTRADECIR O ALIMENTAR UNA PERSONALIDAD: `n` negativo la baja (con esfuerzo), positivo la sube. Nunca baja de su
 * piso ni pasa de 100 *(Santi: "jamás haría que una personalidad se pierda por completo")*.
 */
export function moverPersonalidad(e, id, n) {
  if (!e.rasgos || e.rasgos[id] == null) return;
  e.rasgos[id] = Math.max(MARCA.piso, Math.min(100, e.rasgos[id] + n));
}

/**
 * ¿SE VA? Al final de la visita: con la lealtad debajo de `seVaDebajoDe`, la primera vez avisa; si en la visita
 * siguiente sigue igual, se va durante la noche. Devuelve `'avisa'`, `'seVa'` o null.
 */
export function revisarSiSeVa(e) {
  const a = animoDe(e);
  if (e.lealtad >= ANIMO.seVaDebajoDe) { a.avisado = false; return null; }
  if (!a.avisado) { a.avisado = true; return 'avisa'; }
  e.esta = false;
  return 'seVa';
}

/** El estado de las habilidades al empezar: las que trae, ya aprendidas. */
export function habilidadesIniciales(rasgos) {
  const out = {};
  for (const [id, n] of Object.entries(rasgos)) if (!esPersonalidad(id)) out[id] = { tiene: true, techo: n, ultimo: 0, yaLaTuvo: true };
  return out;
}
