/**
 * 😈 LA TENTACIÓN, LAS SEÑALES Y LAS TRAICIONES — LAS REGLAS (los números y el porqué, en data/tentacion.js; etapa 5,
 * parte 1). Lo que guarda:
 *  - en cada uno de la banda (`gameState.banda[id]`): `tentacion` (0 a 4, 5 en la montaña), `senal` (true mientras
 *    tiene la señal), `cortes` (cuántas veces le pagaste) y `senalOculta` (desde el bosque: el otro de "uno de los
 *    dos", hasta que lo vigiles o lo acuses).
 *  - en el campamento (`gameState.campamento`): `tramo` (la parte del viaje de la última noche de golpe), `ofertaLey`
 *    (ya llegó), `revisarSenales` (falta mirar las señales en la madrugada, después de moverse la lealtad) y
 *    `marcas.leyEspera` (el golpe siguiente, botín a la mitad: ver `applyRaidResult` en state/gameState.js).
 * Lo que hay que contarle al jugador vuelve como noticias ('senal:frank', 'traicion:santiago:seFueConPlata:240'…), con
 * sus textos en text/es.js (`T.tentacion`).
 *
 * ⚠️ Los textos de lo que pasa (la señal, las ofertas, la traición) son provisorios: los reescribimos cuando esté la
 * historia de cada uno *(Santi, 2026-11-22: armar los personajes "como se arma para escribir novelas")*.
 */
import { TENTACION } from '../data/tentacion.js';
import { BANDA, seVa } from '../data/banda.js';
import { fuerza, tiene } from './animo.js';
import { anotar } from './libreta.js';
import { regionDeLaBanda } from './comida.js';
import { relacion } from './fogata.js';

const IDS = BANDA.map((m) => m.id);
const aca = (g) => IDS.filter((id) => g.banda && g.banda[id] && g.banda[id].esta && !g.banda[id].preso);
const diaDe = (g) => (g.tiempo ? g.tiempo.dia : 0);
const honorable = (e) => fuerza(e, 'honorable') > 0;
const alAzar = (lista, azar) => lista[Math.floor(azar() * lista.length)];

/** (Una partida de antes, o uno nuevo: su tentación de arranque.) */
export function completarTentacion(g) {
  if (!TENTACION.activa || !g.banda) return;
  for (const id of IDS) {
    const e = g.banda[id];
    if (!e || e.tentacion != null) continue;
    e.tentacion = fuerza(e, 'rastrero') > 0 ? TENTACION.inicioRastrero : TENTACION.inicio[id] || 0;
    e.senal = false;
    e.cortes = 0;
  }
}

/** Hasta dónde puede llegar la tentación: en la montaña, un punto más (el final aprieta). */
export function topeDeTentacion(g) {
  return regionDeLaBanda(g) === 'montana' ? TENTACION.maxMontana : TENTACION.max;
}

/** Sube (o baja, con `n` negativo) la tentación, entre 0 y el tope. */
export function tentar(g, id, n) {
  const e = g.banda[id];
  if (!e) return;
  e.tentacion = Math.max(0, Math.min(topeDeTentacion(g), (e.tentacion || 0) + n));
}

/** 🤝 Ganó una marca de lealtad (o le sobraron favores en 5): −1 de tentación. Lo llama `alEmpezarElDia`. */
export function alGanarMarca(g, id) {
  if (TENTACION.activa) tentar(g, id, -1);
}

/**
 * 🌙 LA NOCHE DEL GOLPE (la llama `visitaNueva` al volver de un asalto, después de la fogata): la parte del viaje, las
 * ofertas, la oferta de la ley y las señales. Devuelve las noticias.
 */
export function nocheDelGolpe(g, azar = Math.random) {
  const C = g.campamento, notas = [];
  if (!TENTACION.activa || !C || !g.banda) return notas;
  completarTentacion(g);
  // 🧭 Un tramo nuevo del viaje: +1 a todos, salvo al Honorable.
  const region = regionDeLaBanda(g);
  if (C.tramo == null) C.tramo = 'desierto';
  if (C.tramo !== region) {
    C.tramo = region;
    for (const id of aca(g)) if (!honorable(g.banda[id])) tentar(g, id, 1);
    notas.push('tramo:' + region);
  }
  // 💌 Una oferta cada tantos golpes, a uno al azar (al Honorable nunca).
  const cada = region === 'montana' ? TENTACION.ofertaCadaMontana : TENTACION.ofertaCada;
  const tentables = aca(g).filter((id) => !honorable(g.banda[id]));
  if (C.asaltos > 0 && C.asaltos % cada === 0 && tentables.length) {
    const id = alAzar(tentables, azar);
    tentar(g, id, 1);
    notas.push(`oferta:${id}:${region === 'montana' ? 'mujer' : alAzar(['otraBanda', 'mujer'], azar)}`);
  }
  // ⭐ La oferta de la ley, una vez, cuando tu recompensa llega a tanto.
  if (!C.ofertaLey && (g.bounty || 0) >= TENTACION.ofertaLey && tentables.length) {
    C.ofertaLey = true;
    const id = alAzar(tentables, azar);
    tentar(g, id, 1);
    notas.push('ofertaLey:' + id);
  }
  notas.push(...revisarSenales(g, azar));
  // (Y otra vez en la madrugada, después de moverse la lealtad: BANDA-NUEVA, "La noche del golpe", pasos 3 y 7.)
  C.revisarSenales = true;
  return notas;
}

/**
 * 👢 LAS SEÑALES: al que la tentación le alcanza a la lealtad. Desde el bosque, no se sabe quién: "uno de los dos" (el
 * de la señal y otro al azar, en un orden que no lo delata). Devuelve las noticias.
 */
export function revisarSenales(g, azar = Math.random) {
  const C = g.campamento, notas = [];
  if (!TENTACION.activa || !C || !g.banda) return notas;
  completarTentacion(g);
  for (const id of aca(g)) {
    const e = g.banda[id];
    if (e.senal || !e.libreta || e.tentacion < e.lealtad) continue;
    e.senal = true;
    const otros = aca(g).filter((o) => o !== id);
    if ((C.asaltos || 0) >= TENTACION.sospechososDesde && otros.length) {
      // (Mejor uno que no esté ya en otra señal: si no, hablar con él resolvería sólo una.)
      const enOtra = (o) => g.banda[o].senal || aca(g).some((r) => g.banda[r].senalOculta === o);
      const libres = otros.filter((o) => !enOtra(o));
      const otro = alAzar(libres.length ? libres : otros, azar);
      e.senalOculta = otro;
      const par = azar() < 0.5 ? [id, otro] : [otro, id];
      notas.push(`senalDos:${par[0]}:${par[1]}`);
    } else notas.push('senal:' + id);
  }
  return notas;
}

/** (La madrugada después de un golpe: las señales otra vez, ya movida la lealtad. Lo llama `alEmpezarElDia`.) */
export function revisarSenalesDeLaMadrugada(g, azar = Math.random) {
  const C = g.campamento;
  if (!C || !C.revisarSenales) return [];
  C.revisarSenales = false;
  return revisarSenales(g, azar);
}

/**
 * 🕵️ Lo que hay que hablar con `id`: `{ real, otro }` si está en una señal (la suya, o "uno de los dos" de otro), o
 * null. `oculta`: todavía no se sabe cuál de los dos es.
 */
export function senalDe(g, id) {
  const e = g.banda && g.banda[id];
  if (!TENTACION.activa || !e || !e.esta) return null;
  if (e.senal) return { real: id, otro: e.senalOculta || null, oculta: !!e.senalOculta };
  const real = IDS.find((r) => g.banda[r] && g.banda[r].esta && g.banda[r].senal && g.banda[r].senalOculta === id);
  return real ? { real, otro: id, oculta: true } : null;
}

/** 💵 Cuánto pide para quedarse (o null: la 3ª vez ya no se paga con plata). */
export function precioDeLaSenal(g, id) {
  const e = g.banda[id], c = e.cortes || 0;
  if (c >= TENTACION.cortar.length) return null;
  return Math.max(TENTACION.cortar[c], Math.round((g.money || 0) * TENTACION.cortarParte[c]));
}

/** 🔎 El que puede seguirlo gratis (un Rastrero no: un Rastreador de la banda, que no sea ninguno de los dos), o null. */
export function rastreadorPara(g, a, b) {
  return aca(g).find((id) => id !== a && id !== b && tiene(g.banda[id], 'rastreador')) || null;
}

/** 🔎 VIGILAR: se sabe cuál de los dos es. Cuesta `vigilar` (gratis con un Rastreador). Devuelve `{ real, pago }`. */
export function vigilar(g, id) {
  const s = senalDe(g, id);
  if (!s || !s.oculta) return null;
  const gratis = !!rastreadorPara(g, s.real, s.otro);
  const pago = gratis ? 0 : Math.min(TENTACION.vigilar, g.money || 0);
  g.money -= pago;
  g.banda[s.real].senalOculta = null;
  return { real: s.real, pago, gratis };
}

/**
 * 💵 PAGARLE A `id` LO QUE PIDE (si no se sabe cuál de los dos es, es **acusarlo**). Devuelve:
 *  - `{ que: 'pago', precio, sigue, queja }`: −1 de tentación; `sigue`: la señal sigue (todavía le alcanza) y se puede
 *    volver a pagar; `queja`: la 2ª vez, el de más lealtad de los otros ("le sacaste a él para darle a este").
 *  - `{ que: 'equivocado', inocente, traicion }`: acusaste al que no era: queja doble y +1 de tentación para él, y el
 *    de la señal se va esa misma noche (`traicion`, lo de `traicionar`).
 */
export function pagarLaSenal(g, id) {
  const s = senalDe(g, id), dia = diaDe(g);
  if (!s) return null;
  if (s.oculta && id !== s.real) {
    anotar(g.banda[id], 'q', 'meAcusaste', dia, { veces: 2 });
    tentar(g, id, 1);
    return { que: 'equivocado', inocente: id, traicion: traicionar(g, s.real) };
  }
  const e = g.banda[id], precio = precioDeLaSenal(g, id);
  if (precio == null || (g.money || 0) < precio) return null;
  g.money -= precio;
  e.cortes = (e.cortes || 0) + 1;
  e.senalOculta = null;
  tentar(g, id, -1);
  e.senal = e.tentacion >= e.lealtad;
  let queja = null;
  if (e.cortes >= 2) {
    // (Si empatan, el que llegó primero: el orden de la banda.)
    const otros = aca(g).filter((o) => o !== id && g.banda[o].libreta);
    queja = otros.reduce((mejor, o) => (!mejor || g.banda[o].lealtad > g.banda[mejor].lealtad ? o : mejor), null);
    if (queja) anotar(g.banda[queja], 'q', 'loQuePidio', dia);
  }
  return { que: 'pago', precio, sigue: e.senal, queja };
}

/**
 * 🚪 ECHARLO: se va sin traicionar, pero sabiendo tus planes: tu recompensa sube y el golpe siguiente la ley te espera.
 * Los que estaban bien con él, queja. Devuelve `{ quejas: [id] }`.
 */
export function echar(g, id) {
  const e = g.banda[id], dia = diaDe(g);
  e.senal = false;
  e.senalOculta = null;
  const quejas = aca(g).filter((o) => o !== id && g.banda[o].libreta && relacion(g, o, id) === 'bien');
  for (const o of quejas) anotar(g.banda[o], 'q', 'echasteAMiAmigo', dia);
  seVa(g.banda, id);
  g.bounty = (g.bounty || 0) + TENTACION.echadoRecompensa;
  g.campamento.marcas.leyEspera = true;
  return { quejas };
}

/**
 * 🐍 TRAICIONA: el Egoísta se va con un cuarto de tu bolsa ('seFueConPlata'); el Rastrero o el Mentiroso, con tu
 * recompensa alta, te vende ('vendio': el golpe siguiente, botín a la mitad); los demás se van ('seFue'). Devuelve
 * `{ id, como, plata }`.
 */
export function traicionar(g, id) {
  const e = g.banda[id];
  e.senal = false;
  e.senalOculta = null;
  let como = 'seFue', plata = 0;
  if (fuerza(e, 'egoista') > 0) {
    como = 'seFueConPlata';
    plata = Math.floor((g.money || 0) * TENTACION.seLleva);
    g.money -= plata;
  } else if ((fuerza(e, 'rastrero') > 0 || fuerza(e, 'mentiroso') > 0) && (g.bounty || 0) >= TENTACION.ofertaLey) {
    como = 'vendio';
    g.campamento.marcas.leyEspera = true;
  }
  seVa(g.banda, id);
  return { id, como, plata };
}

/**
 * 🚂 SALES AL GOLPE (lo llama `salir` en scenes/mapScene.js, antes de irse): el que tiene la señal traiciona y no va.
 * Devuelve las noticias, que se cuentan al volver.
 */
export function traicionesAlSalir(g) {
  if (!TENTACION.activa || !g.banda) return [];
  return aca(g).filter((id) => g.banda[id].senal).map((id) => {
    const t = traicionar(g, id);
    return `traicion:${t.id}:${t.como}:${t.plata}`;
  });
}
