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

import { LIBRETA, LEALTAD5, NO_QUIERE } from '../data/libreta.js';
import { marcaFuerte } from './animo.js';

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
export function noQuiere(e, papel) {
  // (El Confiable no se niega nunca a los caballos.)
  if (papel === 'caballos' && marcaFuerte(e, 'confiable')) return false;
  return Object.entries(NO_QUIERE).some(([p, lista]) => lista.includes(papel) && marcaFuerte(e, p));
}

/**
 * 🎭 CÓMO HACE ESE PAPEL HOY: 'seNiega', 'malaGana' (−1 paso), 'normal' o 'potenciado' (+1 paso). Furioso se niega a
 * todo (el Confiable va igual, de mala gana); al papel que "no quiere", sólo va con ganas.
 */
export function disposicionLibreta(e, papel, dia) {
  const a = animo(e, dia);
  if (a === 'furioso') return marcaFuerte(e, 'confiable') ? 'malaGana' : 'seNiega';
  if (papel && a !== 'conGanas' && noQuiere(e, papel)) return 'seNiega';
  return a === 'conGanas' ? 'potenciado' : a === 'deMalas' ? 'malaGana' : 'normal';
}
