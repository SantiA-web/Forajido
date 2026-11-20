/**
 * 📋 LA PIZARRA, ADENTRO DEL CALENDARIO — LAS REGLAS *(BANDA-NUEVA.md, "La pizarra"; Santi, 2026-11-18: "y si la
 * pizarra la ponemos junto al calendario, o sea que sea lo mismo, juntarlo de alguna forma para que sean menos teclas y
 * funciones")*. La hoja está en scenes/calendario.js; lo que hace cada tarea, en systems/tareas.js; los números, en
 * `TIEMPO.pizarra` (data/tiempo.js), data/tareas.js y data/comida.js.
 *
 * Cada uno de la banda tiene una casilla por parte del día (mañana, tarde y noche; la madrugada duerme). Lo que ocupa
 * cada tarea, en `celdasDe` (y la lista entera en data/tareas.js).
 *  - **Se repite sola**: lo que pones un día queda puesto los días que siguen, hasta que lo cambies (`rutina`).
 *    Mirar un tren, pescar, las cartas y vender, no: son de ese día (`unaVez`). Una de esas encima de lo de siempre lo
 *    tapa sólo ese día.
 *  - **Sale cuando empieza su parte** *(🔁 antes, sólo a la mañana)*: cada uno que está en el campamento (no herido, no
 *    en un golpe, no en otra tarea) sale a lo que tiene puesto. Las de la mañana y la tarde salen a la mañana.
 *
 * Lo que guarda, en `gameState.campamento.pizarra`:
 *  - `rutina[id][parte]`: `[{ desde, tarea }]`, de menor a mayor `desde`: la tarea de un día es la última que empezó
 *    antes o ese mismo día.
 *  - `unaVez[id][dia][parte]`: una tarea sólo de ese día (`null`: ese día descansa, aunque la rutina diga otra cosa).
 * Una tarea: `{ que: 'practicar', hab }`, `{ que: 'mirar', tren }`, `{ que: 'pueblo', para: 'rumores' | 'comida' }`,
 * `{ que: 'cazar' }`… La pesca, el segundo día, `{ que: 'pescar', sigue: true, desde }` (no sale: ya está afuera).
 */

import { TIEMPO } from '../data/tiempo.js';
import { completarTiempo } from './tiempo.js';
import { conocidos, momento, finDelDia, ahora } from './horario.js';
import { mandarAPracticar, mandarAEspiar, trenesMirados } from './animoEnJuego.js';
import { empezarTarea, puebloLejos } from './tareas.js';

/** Las partes que tienen casilla, por su número en `TIEMPO.partes`: mañana, tarde y noche. */
export const PARTES_PIZARRA = [0, 1, 2];
const MANANA = 0, TARDE = 1, NOCHE = 2;
/** Las tareas que ocupan la mañana y la tarde. */
const DE_DOS = { practicar: true, mirar: true };
/** Las que no se repiten solas. */
const UNA_VEZ = { mirar: true, pescar: true, cartas: true, vender: true };
/** Dónde puede ir cada una (las partes en que se puede poner). */
export const VA_EN = {
  practicar: [MANANA, TARDE], mirar: [MANANA, TARDE], cazar: [MANANA], pescar: [MANANA],
  pueblo: [MANANA, TARDE], vender: [MANANA, TARDE], curar: [MANANA, TARDE], cartas: [NOCHE], cocinar: [NOCHE],
};

function pizarra(g) {
  const C = g.campamento || (g.campamento = {});
  return C.pizarra || (C.pizarra = { rutina: {}, unaVez: {} });
}

/** La tarea que tiene `id` ese día en esa parte (o null: descansa). */
export function tareaEn(g, id, dia, parte) {
  const P = pizarra(g);
  const u = P.unaVez[id] && P.unaVez[id][dia];
  if (u && parte in u) return u[parte];
  let t = null;
  for (const x of (P.rutina[id] && P.rutina[id][parte]) || []) if (x.desde <= dia) t = x.tarea;
  return t;
}

/** Las casillas `[dia, parte]` que ocupa la tarea `t` puesta en `dia`/`parte`. */
export function celdasDe(g, t, dia, parte) {
  if (!t) return [[dia, parte]];
  if (t.que === 'pescar') {
    const d = t.sigue ? t.desde : dia;
    return [[d, MANANA], [d, TARDE], [d, NOCHE], [d + 1, MANANA], [d + 1, TARDE]];
  }
  if (DE_DOS[t.que] || (t.que === 'pueblo' && puebloLejos(g))) return [[dia, MANANA], [dia, TARDE]];
  return [[dia, parte]];
}

/** ¿Se puede cambiar esa casilla? Las que no empezaron, y la de la parte de ahora (el que sale, sale ahí). */
export function sePuedeCambiar(g, dia, parte) {
  return momento(dia, parte) >= ahora(g);
}

/** ¿Se puede poner `t` ahí? Todas sus casillas, y las de lo que tapa, tienen que poder cambiarse. */
export function sePuedePoner(g, id, dia, parte, t) {
  const celdas = celdasDe(g, t, dia, parte);
  for (const [d, p] of celdas) {
    if (!sePuedeCambiar(g, d, p)) return false;
    for (const [d2, p2] of celdasDe(g, tareaEn(g, id, d, p), d, p)) if (!sePuedeCambiar(g, d2, p2)) return false;
  }
  return true;
}

function deUnaVez(P, id, dia, parte) {
  const u = P.unaVez[id] && P.unaVez[id][dia];
  return !!(u && parte in u);
}

function escribir(P, id, dia, parte, t, unaVez) {
  const u = (P.unaVez[id] = P.unaVez[id] || {});
  if (unaVez) { (u[dia] = u[dia] || {})[parte] = t; return; }
  // (Lo de una vez de ese día se borra: ahora manda la rutina.)
  if (u[dia]) { delete u[dia][parte]; if (!Object.keys(u[dia]).length) delete u[dia]; }
  const R = (P.rutina[id] = P.rutina[id] || {});
  const lista = (R[parte] = (R[parte] || []).filter((x) => x.desde !== dia));
  lista.push({ desde: dia, tarea: t });
  lista.sort((a, b) => a.desde - b.desde);
}

function borrarUnaVez(P, id, dia, parte) {
  const u = P.unaVez[id] && P.unaVez[id][dia];
  if (!u) return;
  delete u[parte];
  if (!Object.keys(u).length) delete P.unaVez[id][dia];
}

/**
 * PONER UNA TAREA en la casilla `dia`/`parte` de `id` (`null`: descansar). Llena todas sus casillas; lo que había
 * debajo se saca entero (una de dos partes, las dos; la pesca, sus dos días). Si es de las que se repiten, queda puesta
 * desde ese día en adelante; si es de una vez, tapa sólo ese día. Si es la parte de ahora, sale ahora.
 */
export function ponerTarea(g, id, dia, parte, tarea) {
  const P = pizarra(g);
  const una = !!(tarea && UNA_VEZ[tarea.que]);
  const nuevas = celdasDe(g, tarea, dia, parte);
  const clave = ([d, p]) => d + ':' + p;
  const enNuevas = new Set(nuevas.map(clave));
  // Lo que tapa: lo de cada casilla nueva, entero.
  const sacar = new Map();
  for (const [d, p] of nuevas) for (const c of celdasDe(g, tareaEn(g, id, d, p), d, p)) if (tareaEn(g, id, c[0], c[1])) sacar.set(clave(c), c);
  for (const [k, [d, p]] of sacar) {
    if (enNuevas.has(k)) continue;
    // (Si lo que se saca era de una vez, se borra; si era la rutina: con una tarea de una vez, descansa sólo ese
    // día; con una que se repite, descansa desde ese día.)
    if (deUnaVez(P, id, d, p)) { borrarUnaVez(P, id, d, p); if (tareaEn(g, id, d, p)) escribir(P, id, d, p, null, true); }
    else escribir(P, id, d, p, null, una);
  }
  for (const [d, p] of nuevas) {
    const t = tarea && tarea.que === 'pescar' && d !== dia ? { que: 'pescar', sigue: true, desde: dia } : tarea;
    escribir(P, id, d, p, t, una);
  }
  // (La parte de ahora: si ya había salido a otra cosa en esta misma parte, vuelve y sale a esta.)
  const ti = completarTiempo(g), ya = ahora(g);
  const toca = [...nuevas, ...sacar.values()].find(([d, p]) => momento(d, p) === ya);
  if (toca) {
    const e = g.banda[id];
    if (e && e.practica && e.practica.dePizarra && e.practica.empezo === ya) e.practica = null;
    arrancarUno(g, id, ti.parte);
  }
}

/**
 * 🕵️ Los trenes que puede salir a mirar el día `dia`: los que sabes, que nadie está mirando ya, y que pasan después de
 * que vuelva (a la noche de ese día). Un rumor, si su día no termina antes.
 */
export function paraMirarEl(g, dia, id = null) {
  const vuelve = momento(dia, NOCHE);
  const otros = [];
  for (const o of Object.keys(g.banda || {})) {
    if (o === id) continue;
    const t = tareaEn(g, o, dia, MANANA);
    if (t && t.que === 'mirar') otros.push(t.tren);
  }
  const ya = [...trenesMirados(g), ...otros];
  return conocidos(g).filter((tr) => !tr.visto && !ya.includes(tr.id)
    && (tr.sabes === 'rumor' ? finDelDia(tr.dia) : momento(tr.dia, tr.parte)) > vuelve);
}

/** 🗞️ Si otro de la banda ya baja al pueblo ese día (uno solo por día). */
export function otroBajaAlPueblo(g, dia, id) {
  return Object.keys(g.banda || {}).some((o) => o !== id
    && [MANANA, TARDE].some((p) => { const t = tareaEn(g, o, dia, p); return t && t.que === 'pueblo'; }));
}

/** Si `id` puede salir a una tarea ahora: está en el campamento, sano, libre, y no se fue a un golpe. */
function libre(g, id) {
  const e = g.banda && g.banda[id];
  const C = g.campamento || {};
  return !!e && e.esta && !e.herido && !e.preso && !e.practica && !(C.golpeEnCurso && e.papel);
}

function arrancarUno(g, id, parte) {
  if (!libre(g, id) || !PARTES_PIZARRA.includes(parte)) return false;
  const dia = completarTiempo(g).dia, t = tareaEn(g, id, dia, parte);
  if (!t || t.sigue) return false;
  // (Las de dos partes salen a la mañana; si a la mañana no pudo, ese día no sale.)
  if (celdasDe(g, t, dia, parte)[0][1] !== parte) return false;
  const ya = ahora(g);
  if (t.que === 'practicar') mandarAPracticar(g, id, t.hab);
  else if (t.que === 'mirar') {
    // (Si el tren ya no se puede mirar —lo asaltaste, o ya lo miró otro—, se queda.)
    if (!paraMirarEl(g, dia, id).some((tr) => tr.id === t.tren)) return false;
    mandarAEspiar(g, id, t.tren);
  } else return empezarTarea(g, id, t, ya);
  g.banda[id].practica.dePizarra = true;
  g.banda[id].practica.empezo = ya;
  return true;
}

/** ☀️ EMPIEZA UNA PARTE DEL DÍA (lo llama `pasar`, systems/tiempo.js): cada uno sale a lo que tiene puesto ahí. */
export function arrancarTareas(g, parte = MANANA) {
  if (!TIEMPO.pizarra.activo || !g.banda) return;
  for (const id of Object.keys(g.banda)) arrancarUno(g, id, parte);
}

/**
 * La casilla libre más cercana para una tarea de dos partes que se pide hablando *(Santi: "En los dos lados")*: hoy si
 * todavía es de mañana, si no mañana.
 */
export function proximoDiaLibre(g) {
  const t = completarTiempo(g);
  return sePuedeCambiar(g, t.dia, MANANA) ? t.dia : t.dia + 1;
}
