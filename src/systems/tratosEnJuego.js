/**
 * LOS TRATOS EN EL JUEGO — lo que arma el contexto desde `gameState` y lo que aplica lo que pasó (TRATOS.md; las
 * reglas puras en systems/tratos.js, los números en data/tratos.js). El mismo patrón que animo.js / animoEnJuego.js.
 *
 * Lo que se guarda, en `g.tratos[id]` (id: 'perista', después 'armero', 'caballerizo'):
 *   rasgos: los suyos (sorteados la primera vez que lo ves; cada partida, otro perista)
 *   conoce: { rasgo: true } los que ya se le notaron (se escriben junto al nombre)
 *   trato, tratoDia: la memoria contigo y cuándo se movió (vuelve hacia 0 un punto cada `bajaCadaDias`)
 *   enojo, enojoHasta: cuánto empeoran sus ofertas y hasta qué día (un regateo o un apretón que salió mal)
 *   cerradoHasta: el día hasta el que no te atiende
 */
import { TRATOS, SORTEO, OFICIOS, QUIMICA } from '../data/tratos.js';
import { honorSegun, quimicaPosible } from './tratos.js';
import { CONFIG } from '../data/config.js';
import { tasarLote, ajustePorHonor } from '../data/perista.js';
import { tiene, fuerza } from './animo.js';
import { deudaConJmc } from './libreta.js';

export const diaDe = (g) => (g.tiempo ? g.tiempo.dia : 0);

/** El tratante (lo crea la primera vez, con sus rasgos sorteados) y su memoria ya bajada con los días. */
export function tratanteDe(g, id, azar = Math.random) {
  g.tratos = g.tratos || {};
  if (!g.tratos[id]) {
    const S = SORTEO[id], rasgos = [];
    if (S) {
      const de = [...S.de];
      rasgos.push(de.splice(Math.floor(azar() * de.length), 1)[0]);
      if (azar() < S.dos) {
        const ok = de.filter((r) => !S.noJuntos.some((p) => p.includes(r) && p.includes(rasgos[0])));
        if (ok.length) rasgos.push(ok[Math.floor(azar() * ok.length)]);
      }
    }
    g.tratos[id] = { rasgos, conoce: {}, trato: 0, tratoDia: diaDe(g), enojo: 0, enojoHasta: -1, cerradoHasta: -1 };
  }
  const t = g.tratos[id], dia = diaDe(g);
  const pasos = Math.floor((dia - t.tratoDia) / TRATOS.trato.bajaCadaDias);
  if (pasos > 0 && t.trato) {
    t.trato = t.trato > 0 ? Math.max(0, t.trato - pasos) : Math.min(0, t.trato + pasos);
    t.tratoDia = dia;
  }
  return t;
}

/** ¿Hoy no te atiende? */
export function cerradoHoy(g, id) {
  return tratanteDe(g, id).cerradoHasta >= diaDe(g);
}

/**
 * EL CONTEXTO DE UNA VENTA al tratante `id` de `objetos`. `quien`: null si vas tú; el miembro de la banda si lo
 * mandaste (no carga tu honor: el lote se tasa sin él, como ya hacía la tarea "vender").
 * 🔁 (2026-11-20) Tu honor ya no suma siempre: lo lee cada tratante a su manera (`honorSegun`, data/tratos.js).
 * Devuelve `{ ctx, lote }` (`lote` es el desglose de `tasarLote`).
 */
export function contextoDeVenta(g, id, objetos, quien = null) {
  const t = tratanteDe(g, id), dia = diaDe(g);
  const sinHonor = tasarLote(objetos, 0);
  const fraccionHonor = quien ? 0 : honorSegun(t.rasgos, ajustePorHonor(g.honor || 0));
  const porHonor = Math.round(sinHonor.total * fraccionHonor);
  const lote = { ...sinHonor, fraccionHonor, porHonor, total: Math.max(0, sinHonor.total + porHonor) };
  const base = objetos.reduce((s, o) => s + o.valor, 0) || 1;
  const caliente = objetos.filter((o) => o.caliente).reduce((s, o) => s + o.valor, 0) / base;
  const recien = objetos.some((o) => o.caliente && o.dia !== undefined && dia - o.dia <= TRATOS.chantaje.recienDias);
  const P = CONFIG.prision;
  const ctx = {
    tipo: 'vende', oficio: id, rasgos: t.rasgos, valor: lote.total, caliente, recien,
    recompensa: g.bounty || 0, fama: g.fame || 0, honor: g.honor || 0,
    trato: t.trato, enojo: t.enojoHasta >= dia ? t.enojo : 0,
    leyCerca: (g.bounty || 0) >= P.umbralHorca * P.avisoCerca, deudaJmc: deudaConJmc(g) > 0,
    quien: quien ? { negociante: tiene(quien, 'negociante'), pendenciero: fuerza(quien, 'pendenciero') > 0, honorable: fuerza(quien, 'honorable') > 0, fuerzas: fuerzasDe(quien) } : null,
  };
  return { ctx, lote };
}

/** Las fuerzas (0 a 100) de los rasgos del que mandas que cuentan para la química (`fuerza` va de 0 a 1). */
export function fuerzasDe(e) {
  return Object.fromEntries([...new Set(QUIMICA.map((q) => q.va))].map((r) => [r, Math.round(100 * fuerza(e, r))]).filter(([, f]) => f > 0));
}

/**
 * LO QUE SE VE AL ELEGIR A QUIÉN MANDAR (el calendario): la química posible con lo que YA le conoces al tratante. Si
 * todavía no le conoces nada, no sabes cómo le va a ir a cada uno: por eso conviene ir tú primero.
 */
export function quimicaConocida(g, id, e) {
  return quimicaPosible(fuerzasDe(e), conocidos(g, id));
}

/**
 * APLICA LO QUE PASÓ (lo que devolvió `resolver`): la recompensa, la memoria, el enojo, si cerró la puerta y los
 * rasgos que se le notaron. La plata y la mercadería las mueve quien llama (sabe qué se vendió).
 */
export function aplicarTrato(g, id, r) {
  const t = tratanteDe(g, id), dia = diaDe(g);
  if (r.recompensa) g.bounty = (g.bounty || 0) + r.recompensa;
  if (r.trato) {
    t.trato = Math.max(TRATOS.trato.min, Math.min(TRATOS.trato.max, t.trato + r.trato));
    t.tratoDia = dia;
  }
  if (r.enojo) { t.enojo = r.enojo.cuanto; t.enojoHasta = dia + r.enojo.dias; }
  if (r.cerrado) t.cerradoHasta = dia;
  for (const rasgo of r.revela) t.conoce[rasgo] = true;
}

/** Saca del inventario lo vendido (lo de la historia, como el maletín, se queda). Mismo array: lo mira todo el juego. */
export function sacarVendido(g) {
  const todos = g.owned.objetos, quedan = todos.filter((o) => o.historia);
  todos.length = 0;
  todos.push(...quedan);
}

/** Los rasgos que ya se le conocen, en el orden en que los tiene. */
export function conocidos(g, id) {
  const t = tratanteDe(g, id);
  return t.rasgos.filter((r) => t.conoce[r]);
}

/**
 * LA FAMA (TRATOS.md, "La fama, sin un sistema aparte"): sube con lo que ya pasa en un golpe. Se llama desde
 * `applyRaidResult` con el summary del asalto.
 */
export function famaDelGolpe(g, summary) {
  if (!TRATOS.activo || summary.outcome !== 'escaped') return 0;
  const F = TRATOS.famaSube;
  let suma = 0;
  if ((summary.objetos || []).some((o) => o.nivel === 'raro' || o.historia)) suma += F.diario;
  if (summary.racha && summary.racha % F.cadaLimpios === 0) suma += F.limpios;
  g.fame = (g.fame || 0) + suma;
  return suma;
}

export { OFICIOS };
