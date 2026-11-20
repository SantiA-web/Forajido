/**
 * 🍖 LA COMIDA, EN PORCIONES — LAS REGLAS. Los números, en data/comida.js (`COMIDA`); son los del simulador
 * (simulador/banda3.js v15).
 *
 * Lo que guarda (en `gameState.campamento`):
 *  - `despensa`: una lista de partidas `{ n, vence, carne }`: cuántas porciones, el último día en que se pueden comer y
 *    si es carne (cazada o pescada: se echa a perder antes) o provisiones (compradas).
 */

import { COMIDA } from '../data/comida.js';
import { anotar } from './libreta.js';

/** La región en la que anda la banda, por los golpes que lleva (ver `COMIDA.regionDesde`). */
export function regionDeLaBanda(g) {
  const n = (g.campamento && g.campamento.asaltos) || 0, R = COMIDA.regionDesde;
  return n >= R.montana ? 'montana' : n >= R.bosque ? 'bosque' : n >= R.pradera ? 'pradera' : 'desierto';
}

/** Los que comen: los de la banda que están en el campamento (el preso, no), y James. */
export function comensales(g) {
  const banda = Object.values(g.banda || {}).filter((e) => e && e.esta).length;
  return banda + (COMIDA.james ? 1 : 0);
}

function hoy(g) { return g.tiempo ? g.tiempo.dia : 0; }

/** La despensa (la arma con lo de `COMIDA.inicio` la primera vez). */
export function despensa(g) {
  const C = g.campamento || (g.campamento = {});
  if (!C.despensa) C.despensa = COMIDA.inicio ? [{ n: COMIDA.inicio, vence: hoy(g) + COMIDA.duraProvision, carne: false }] : [];
  return C.despensa;
}

/** Cuántas porciones hay. */
export function porciones(g) {
  return despensa(g).reduce((t, p) => t + p.n, 0);
}

/**
 * Para cuántos días alcanza lo que hay, con los que comen hoy (`cuantos` para preguntar por otra cantidad). Cuenta lo
 * que se echa a perder antes de comerlo.
 */
export function diasQueAlcanza(g, cuantos = comensales(g)) {
  if (cuantos <= 0) return Infinity;
  const lista = despensa(g).map((p) => ({ ...p })).sort((a, b) => a.vence - b.vence);
  let dia = hoy(g), dias = 0;
  for (;;) {
    dia++;
    let falta = cuantos;
    for (const p of lista) { if (p.vence < dia || !p.n) continue; const t = Math.min(p.n, falta); p.n -= t; falta -= t; if (!falta) break; }
    if (falta) return dias;
    dias++;
    if (dias > 999) return dias;
  }
}

/**
 * 🍽️ COMEN (al empezar cada día): se tira lo vencido y cada uno come una porción, primero lo que vence antes. Si no
 * alcanza, ese día no come nadie de lo que falta y cada uno anota una queja chica (una a la vez, como la de la olla).
 * Devuelve `{ comen, faltan, quejas, tirado }`.
 */
export function comerDelDia(g, dia) {
  if (!COMIDA.activo) return null;
  const C = g.campamento || (g.campamento = {});
  const antes = despensa(g);
  const tirado = antes.filter((p) => p.vence < dia).reduce((t, p) => t + p.n, 0);
  const lista = antes.filter((p) => p.vence >= dia && p.n > 0).sort((a, b) => a.vence - b.vence);
  const comen = comensales(g);
  let falta = comen;
  for (const p of lista) { const t = Math.min(p.n, falta); p.n -= t; falta -= t; if (!falta) break; }
  C.despensa = lista.filter((p) => p.n > 0);
  const quejas = [];
  if (falta > 0) {
    for (const [id, e] of Object.entries(g.banda || {})) {
      if (!e || !e.esta || !e.libreta || e.libreta.quejas.some((q) => q.motivo === 'comida')) continue;
      anotar(e, 'q', 'comida', dia, { chica: true });
      quejas.push(id);
    }
  }
  return { comen, faltan: falta, quejas, tirado };
}

// ─────────────────────────── 🛒 EL ALMACÉN ───────────────────────────

/** Lo que sale una porción hoy, y lo que pagan por una. */
export function precioPorcion(g) { return COMIDA.precio[regionDeLaBanda(g)]; }
export function precioVenta(g) { return Math.floor(precioPorcion(g) / 2); }

/** Lo que sale llevar `n` porciones juntas (con el descuento del pack si es uno). */
export function precioDe(g, n) {
  const pack = COMIDA.packs.find((p) => p.n === n);
  return Math.round(n * precioPorcion(g) * (1 - (pack ? pack.descuento : 0)));
}

/** Compra `n` porciones (provisiones secas). Devuelve lo que pagó, o null si no alcanza la plata. */
export function comprar(g, n) {
  const costo = precioDe(g, n);
  if (g.money < costo) return null;
  g.money -= costo;
  despensa(g).push({ n, vence: hoy(g) + COMIDA.duraProvision, carne: false });
  return costo;
}

/** Vende `n` porciones: primero la carne que se vence antes. Devuelve lo que cobró (o null si no hay tantas). */
export function vender(g, n) {
  if (porciones(g) < n) return null;
  const lista = despensa(g).sort((a, b) => (b.carne - a.carne) || (a.vence - b.vence));
  let falta = n;
  for (const p of lista) { const t = Math.min(p.n, falta); p.n -= t; falta -= t; if (!falta) break; }
  g.campamento.despensa = lista.filter((p) => p.n > 0);
  const cobro = n * precioVenta(g);
  g.money += cobro;
  return cobro;
}
