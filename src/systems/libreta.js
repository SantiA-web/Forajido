/**
 * 📒 LA LIBRETA, LA LEALTAD DE 0 A 5 Y EL ÁNIMO — LAS REGLAS *(BANDA-NUEVA.md, etapa 2)*. Los números, en
 * data/libreta.js; son los mismos que el simulador (simulador/banda3.js).
 *
 * Lo que guarda en cada uno de la banda (`gameState.banda[id]`):
 *  - `libreta`: `{ favores, quejas, conGanasHasta, deMalasHasta }`. Cada línea: `{ motivo, dia, chica }`. `motivo` es
 *    una clave: la de un evento ('pedidoSi') o la de un momento del campamento ('m:forastero'); el texto, en
 *    text/es.js (`T.libreta.motivos`).
 *  - `lealtad`, de 0 a 5 (con `lealtad5: true`: las partidas de antes venían de 0 a 10 y se pasan a la mitad).
 *
 * 🌉 EL PUENTE CON LO DE ANTES: todo lo que ya existía (los saludos, "¿Cómo estás?", la práctica) lee el humor de 1 a
 * 100 en palabras. Mientras la libreta manda, `humor` ya no se mueve solo: es una copia del ánimo
 * (`sincronizar`), con un número que cae justo en su palabra (con ganas → contento).
 */

import { LIBRETA, LEALTAD5, NO_QUIERE, REPARTO, OLLA, JMC } from '../data/libreta.js';
import { marcaFuerte, fuerza, contradecir } from './animo.js';
import { COMIDA } from '../data/comida.js';
// (De la historia, sólo los números: importar systems/historia.js de acá arma un círculo —banda → libreta → historia →
// horario → tiempo → … → fogata → banda— y el juego no arranca.)
import { HISTORIA } from '../data/historia.js';

/** El humor de 1 a 100 que corresponde a cada ánimo (cae justo en la palabra de `HUMOR.palabras`). */
const HUMOR_DE = { conGanas: 80, tranquilo: 57, deMalas: 32, furioso: 10 };

/** (Una partida de antes, o uno nuevo: le arma la libreta y pasa la lealtad de 0–10 a 0–5.) */
export function completarLibreta(e) {
  if (!LIBRETA.activa || !e) return;
  const nueva = !e.libreta;
  if (nueva) e.libreta = { favores: [], quejas: [], conGanasHasta: -1, deMalasHasta: -1 };
  if (!e.lealtad5) {
    e.lealtad = Math.max(0, Math.min(LEALTAD5.max, Math.round((e.lealtad ?? 6) / 2)));
    e.lealtad5 = true;
  }
  if (nueva) sincronizar(e, 0);
}

/** La palabra de la lealtad de 0 a 5. */
export function palabraDeLealtad5(n) {
  return LEALTAD5.palabras.find((p) => n >= p.desde).id;
}

/**
 * 🙂 EL ÁNIMO DE HOY: 'conGanas', 'tranquilo', 'deMalas' o 'furioso'. Más favores que quejas, con ganas; más quejas,
 * de malas; de malas con la lealtad en 1 o 0, furioso. Recién ganó o perdió una marca: con ganas o de malas unos días.
 */
export function animo(e, dia) {
  const L = e && e.libreta;
  if (!L) return 'tranquilo';
  const q = L.quejas.length, f = L.favores.length;
  const deMalas = q > f || dia <= L.deMalasHasta;
  if (deMalas && e.lealtad <= LEALTAD5.baja) return 'furioso';
  if (deMalas) return 'deMalas';
  if (f > q || dia <= L.conGanasHasta) return 'conGanas';
  return 'tranquilo';
}

/** 🌉 Copia el ánimo al humor de antes (ver arriba), y olvida lo que había decidido hoy para los papeles. */
export function sincronizar(e, dia) {
  if (!e || !e.libreta) return;
  e.humor = HUMOR_DE[animo(e, dia)];
  e.disposiciones = null;
}

/**
 * 📝 ANOTA un favor (`'f'`) o una queja (`'q'`). `veces`: doble = dos líneas. Como mucho `LIBRETA.max` por lado: la más
 * vieja se cae.
 */
export function anotar(e, lado, motivo, dia, { veces = 1, chica = false } = {}) {
  if (!e || !e.libreta) return false;
  const lista = lado === 'f' ? e.libreta.favores : e.libreta.quejas;
  for (let i = 0; i < Math.min(LIBRETA.vecesMax, veces); i++) {
    lista.push({ motivo, dia, chica });
    if (lista.length > LIBRETA.max) lista.shift();
  }
  sincronizar(e, dia);
  return true;
}

/** 🍾 Borra una queja (la botella del Alcohólico: cualquiera; la fogata del Divertido, sólo una chica). */
export function borrarQueja(e, dia, soloChica = false) {
  if (!e || !e.libreta) return null;
  const i = e.libreta.quejas.findIndex((q) => !soloChica || q.chica);
  if (i < 0) return null;
  const [q] = e.libreta.quejas.splice(i, 1);
  sincronizar(e, dia);
  return q;
}

/** 📅 Se le caen las líneas viejas (cada una dura `LIBRETA.dias` días). */
export function caducar(e, dia) {
  if (!e || !e.libreta) return;
  const vale = (x) => dia - x.dia < LIBRETA.dias;
  e.libreta.favores = e.libreta.favores.filter(vale);
  e.libreta.quejas = e.libreta.quejas.filter(vale);
  sincronizar(e, dia);
}

/**
 * 🤝 CADA NOCHE, LA MARCA: con `diferencia` favores más que quejas gana una (el Frío necesita `diferenciaFrio`); con
 * `diferencia` quejas más, pierde una. Si se mueve, la libreta se limpia. Devuelve 'gano', 'perdio', 'lleno' (ganó
 * con la lealtad ya en 5: se limpia igual) o null.
 */
export function revisarMarca(e, dia) {
  if (!e || !e.libreta || !e.esta) return null;
  const L = e.libreta, d = L.favores.length - L.quejas.length;
  const umbral = marcaFuerte(e, 'frio') ? LIBRETA.diferenciaFrio : LIBRETA.diferencia;
  let que = null;
  if (d >= umbral) {
    que = e.lealtad < LEALTAD5.max ? 'gano' : 'lleno';
    e.lealtad = Math.min(LEALTAD5.max, e.lealtad + 1);
    L.conGanasHasta = dia + LIBRETA.marcaAnimoDias;
    L.deMalasHasta = -1;
  } else if (-d >= umbral && e.lealtad > 0) {
    que = 'perdio';
    e.lealtad--;
    L.deMalasHasta = dia + LIBRETA.marcaAnimoDias;
    L.conGanasHasta = -1;
  }
  if (que) { L.favores = []; L.quejas = []; }
  sincronizar(e, dia);
  return que;
}

/** 🙅 Si no quiere ir de ese papel por quién es (ver `NO_QUIERE`): sólo va con ganas. */
export function noQuiere(e, papel, animoHoy = null) {
  // (El Confiable no se niega nunca a los caballos.)
  if (papel === 'caballos' && marcaFuerte(e, 'confiable')) return false;
  // (😄 El Divertido no quiere el telégrafo —solo en un poste— sólo de malas: tranquilo, va. BANDA-NUEVA.md.)
  return Object.entries(NO_QUIERE).some(([p, lista]) => lista.includes(papel) && marcaFuerte(e, p) && (p !== 'divertido' || animoHoy === 'deMalas'));
}

/**
 * 🎭 CÓMO HACE ESE PAPEL HOY: 'seNiega', 'malaGana' (−1 paso), 'normal' o 'potenciado' (+1 paso). Furioso se niega a
 * todo (el Confiable va igual, de mala gana); al papel que "no quiere", sólo va con ganas.
 */
export function disposicionLibreta(e, papel, dia) {
  const a = animo(e, dia);
  if (a === 'furioso') return marcaFuerte(e, 'confiable') ? 'malaGana' : 'seNiega';
  if (papel && a !== 'conGanas' && noQuiere(e, papel, a)) return 'seNiega';
  return a === 'conGanas' ? 'potenciado' : a === 'deMalas' ? 'malaGana' : 'normal';
}

// ─────────────────────────── 💰 EL REPARTO, POR CABEZA ───────────────────────────
// (Los números en `REPARTO`, data/libreta.js. La pantalla, en scenes/reparto.js.)

/** La parte del botín que espera: el que fue, el Ambicioso que fue, o el que se quedó. */
export function parteDe(e, fue) {
  if (!fue) return REPARTO.queda;
  return marcaFuerte(e, 'ambicioso') ? REPARTO.ambicioso : REPARTO.va;
}

/** Cuánto espera, en pesos. */
export function esperaDe(e, fue, botin) {
  return Math.round(botin * parteDe(e, fue));
}

/** Cuánto es "generoso" para él: un cuarto más de lo que espera. */
export function generosoDe(espera) {
  return Math.round(espera * REPARTO.generoso);
}

/**
 * 📝 LO QUE VA A ANOTAR si le das `da` (para mostrarlo ANTES de confirmar): una lista de `{ lado, motivo, veces }`,
 * vacía si no anota nada. Con `loEspera: true`, fue generoso pero ya no cuenta como favor.
 */
export function consecuenciaDelReparto(e, fue, espera, da) {
  const seguidos = (e.repartos && e.repartos.generosos) || 0;
  const out = [];
  if (espera <= 0) return out;
  const gen = generosoDe(espera);
  if (da <= 0 && fue) out.push({ lado: 'q', motivo: 'repartoNada', veces: 2 });
  // (🔁 Una miseria: al que fue, menos de 2/3 de lo que espera cuenta como no darle nada. Ver `REPARTO.miseria`.)
  else if (fue && REPARTO.miseria && da < espera * REPARTO.miseria) out.push({ lado: 'q', motivo: 'repartoMiseria', veces: 2 });
  else if (da < espera) out.push({ lado: 'q', motivo: 'repartoPoco', veces: 1 });
  else if (da >= gen) {
    if (seguidos >= REPARTO.acostumbra) out.push({ lado: null, motivo: 'repartoLoEspera', veces: 0 });
    else out.push({ lado: 'f', motivo: 'repartoGeneroso', veces: 1 });
  }
  if (da < gen && seguidos >= REPARTO.acostumbra) out.push({ lado: 'q', motivo: 'repartoYaNo', veces: 1 });
  return out;
}

/**
 * 💰 REPARTE: le paga a cada uno lo que le das (de tu plata) y anota lo que corresponde. `filas`: `[{ id, fue,
 * espera, da }]`. El Sentimental, a veces, lo cuenta doble (según lo fuerte que es). Devuelve lo anotado, para decirlo.
 */
export function repartir(g, filas, azar = Math.random) {
  const dia = g.tiempo ? g.tiempo.dia : 0, anotes = [];
  for (const f of filas) {
    const e = g.banda[f.id];
    if (!e) continue;
    const da = Math.max(0, Math.min(f.da, g.money));
    g.money -= da;
    for (const c of consecuenciaDelReparto(e, f.fue, f.espera, da)) {
      if (!c.lado) continue;
      const veces = c.lado === 'f' && azar() < fuerza(e, 'sentimental') ? 2 : c.veces;
      anotar(e, c.lado, c.motivo, dia, { veces });
      anotes.push({ id: f.id, lado: c.lado, motivo: c.motivo, veces: Math.min(LIBRETA.vecesMax, veces) });
      // (🎚️ Ser generoso con el Egoísta le va sacando lo egoísta: ver `BAJA` en data/rasgos.js.)
      if (c.motivo === 'repartoGeneroso') contradecir(e, 'egoista');
    }
    e.repartos = e.repartos || { generosos: 0 };
    e.repartos.generosos = f.espera > 0 && da >= generosoDe(f.espera) ? e.repartos.generosos + 1 : 0;
  }
  return anotes;
}


// ─────────────────────────── 🍲 LA OLLA ───────────────────────────
// (Los números en `OLLA`, data/libreta.js.)

/** Los que comen de la olla: los de la banda que están en el campamento (el preso, no). */
function comen(g) {
  return Object.entries(g.banda || {}).filter(([, e]) => e && e.esta).map(([id]) => id);
}

/** Lo que cuesta la olla de un día, hoy. */
export function costoDeLaOlla(g) {
  // (🍖 Con la comida en porciones, no hay olla: ver data/comida.js.)
  if (!OLLA.activa || COMIDA.activo) return 0;
  const montana = g.campamento && g.campamento.asaltos >= OLLA.montanaDesde;
  // (Y James, que también come: `OLLA.james`.)
  return (comen(g).length + (OLLA.james ? 1 : 0)) * (montana ? OLLA.diaMontana : OLLA.dia);
}

/**
 * 🍲 PAGA LA OLLA DEL DÍA (al empezar cada día). Devuelve `{ costo, pago }`, y `quejas`: quiénes anotaron que no hubo
 * (los que ya tenían esa queja, no la anotan de nuevo).
 */
export function pagarLaOlla(g, dia) {
  const costo = costoDeLaOlla(g);
  if (!costo) return { costo, pago: true, quejas: [] };
  // 🔁 (Los días de la vuelta, con el reparto pendiente, se pagan al repartir: como en el simulador —botín, deuda,
  // reparto, olla, J.Mc.—. Antes la olla de la vuelta se comía la bolsa antes de repartir: con la deuda de J.Mc.,
  // llegabas al reparto con $0. Ver `pagarOllaDeLaVuelta`.)
  const C = g.campamento;
  if (C && C.reparto) { C.ollaDeLaVuelta = (C.ollaDeLaVuelta || 0) + costo; return { costo, pago: true, quejas: [], despues: true }; }
  return cobrarOlla(g, costo, dia);
}

/** 🍲 La olla de los días de la vuelta (ver `pagarLaOlla`), al repartir. Devuelve `{ costo, pago, quejas }`, o null. */
export function pagarOllaDeLaVuelta(g, dia) {
  const C = g.campamento, costo = (C && C.ollaDeLaVuelta) || 0;
  if (!costo) return null;
  C.ollaDeLaVuelta = 0;
  return cobrarOlla(g, costo, dia);
}

/** Lo que debe la olla de la vuelta (para la hoja del reparto). */
export function ollaDeLaVuelta(g) {
  return (g.campamento && g.campamento.ollaDeLaVuelta) || 0;
}

/** Paga `costo` de olla, o (si no alcanza) no paga nada y cada uno anota su queja chica. */
function cobrarOlla(g, costo, dia) {
  if (g.money >= costo) { g.money -= costo; return { costo, pago: true, quejas: [] }; }
  const quejas = [];
  for (const id of comen(g)) {
    const e = g.banda[id];
    if (!e.libreta || e.libreta.quejas.some((q) => q.motivo === 'olla')) continue;
    anotar(e, 'q', 'olla', dia, { chica: true });
    quejas.push(id);
  }
  return { costo, pago: false, quejas };
}

// ─────────────────────────── ✉️ J.Mc. EN CUOTAS ───────────────────────────
// (Los números en `JMC`, data/libreta.js.)

/** Lo de J.Mc. en la partida: `{ deuda, roto }`. */
export function completarJmc(g) {
  const C = g.campamento;
  if (!C) return { deuda: 0, roto: false };
  // (🐛 El mismo objeto siempre: si se armaba uno nuevo en cada llamada, la deuda se anotaba en una copia y se perdía.)
  if (!C.jmc) C.jmc = {};
  if (C.jmc.deuda == null) C.jmc.deuda = 0;
  if (C.jmc.roto == null) C.jmc.roto = false;
  return C.jmc;
}

/** Si J.Mc. cobra: desde que leíste su primera carta y mientras no rompas con él. */
export function jmcCobra(g) {
  return JMC.activo && !!(g.campamento && g.campamento.encargo) && !completarJmc(g).roto;
}

/** Lo que le debes a J.Mc. */
export function deudaConJmc(g) {
  return g.campamento ? completarJmc(g).deuda : 0;
}

/** Lo que se va a llevar después del reparto si te quedan `queda`: `{ lleva, debe }` (debe: lo que faltaría). */
export function cuotaDeJmc(g, queda) {
  if (!jmcCobra(g)) return { lleva: 0, debe: 0 };
  const cuota = cuotaJmc(g);
  const lleva = Math.max(0, Math.min(cuota, queda));
  return { lleva, debe: cuota - lleva };
}

/** ✉️ Lo que cobra por golpe: lo de siempre, o más si desconfía porque el Cuervo no suena (data/historia.js, `jmc`). */
export function cuotaJmc(g) {
  // (Lo mismo que `jmcDesconfiaDeLaFama` en systems/historia.js: la cuenta en la etapa 2.)
  const H = g.campamento && g.campamento.historia;
  const desconfia = HISTORIA.activa && !!(H && H.cuenta && H.cuenta.etapa === 2);
  return desconfia ? HISTORIA.jmc.cuotaDesconfia : JMC.porGolpe;
}

/** ✉️ SE LLEVA SU CUOTA del golpe (después del reparto). Devuelve `{ lleva, debe, deuda }`, o null si no cobra. */
export function cobrarJmc(g) {
  if (!jmcCobra(g)) return null;
  const J = completarJmc(g), { lleva, debe } = cuotaDeJmc(g, g.money);
  g.money -= lleva;
  J.deuda += debe;
  return { lleva, debe, deuda: J.deuda };
}

/** ✉️ Lo que le debías, primero, de lo que trajiste (antes del reparto). Devuelve lo que pagaste. */
export function pagarDeudaConJmc(g) {
  if (!jmcCobra(g)) return 0;
  const J = completarJmc(g), paga = Math.max(0, Math.min(J.deuda, g.money));
  g.money -= paga;
  J.deuda -= paga;
  return paga;
}

/** ✉️ Le entregaste el maletín: te perdona la deuda. */
export function perdonarDeuda(g) {
  if (g.campamento) completarJmc(g).deuda = 0;
}
