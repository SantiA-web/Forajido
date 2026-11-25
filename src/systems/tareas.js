/**
 * 📋 LAS TAREAS DEL CALENDARIO — QUÉ HACE CADA UNA *(BANDA-NUEVA.md, "Las tareas del día"; Santi, 2026-11-18: "seguí
 * con las tareas del calendario")*. Los números, en data/tareas.js y data/comida.js (caza y pesca); dónde va cada una
 * en la hoja y cuándo sale, en systems/pizarra.js.
 *
 * Una tarea en curso vive en `e.practica` (como practicar y mirar un tren, para que todo lo de antes —quién está en el
 * campamento, quién puede ir a un golpe— siga andando): `{ tarea, datos, quedan, dePizarra, enCampo, empezo }`.
 * `quedan`: las partes del día que faltan para que vuelva; al llegar a cero, `terminar` cuenta lo que trajo.
 * `enCampo`: la hace en el campamento (curar, cocinar): se lo ve ahí.
 *
 * Lo que el jugador tiene que saber va a `campamento.noticias` como 'tarea:id:qué:dato:dato' (scenes/campScene.js lo
 * pone en palabras).
 */

import { TAREAS } from '../data/tareas.js';
import { COMIDA } from '../data/comida.js';
import { MIEMBRO } from '../data/banda.js';
import { fuerza, tiene, practicar } from './animo.js';
import { regionDeLaBanda, despensa, diasQueAlcanza, comensales, comprar } from './comida.js';
import { rumorDeCarga, rumorFalso } from './horario.js';
import { alBajarAlPueblo } from './historia.js';
import { RUMORES } from '../data/tareas.js';
import { tasarLote } from '../data/perista.js';
import { TRATOS } from '../data/tratos.js';
import { oferta, jugadas, resolver, jugadaDe, quimicaQueImporto } from './tratos.js';
import { contextoDeVenta, aplicarTrato, sacarVendido, cerradoHoy, libretaDelTrato } from './tratosEnJuego.js';

/** Cuántas partes del día dura cada una (hasta que vuelve). Practicar y mirar, en systems/animoEnJuego.js. */
export const DURA = { cazar: 1, pueblo: 1, vender: 1, curar: 1, cartas: 1, cocinar: 1, pescar: 6 };
/** Las que se hacen en el campamento (al que las hace se lo ve). */
const EN_CAMPO = { curar: true, cocinar: true };

function noticia(g, texto) {
  const C = g.campamento || (g.campamento = {});
  (C.noticias = C.noticias || []).push(texto);
}
function hoy(g) { return g.tiempo ? g.tiempo.dia : 0; }
function al(n, azar) { return azar() * 100 < n; }
function entre(min, max, azar) { return min + Math.floor(azar() * (max - min + 1)); }

/** En la montaña, bajar al pueblo ocupa la mañana y la tarde. */
export function puebloLejos(g) {
  return TAREAS.pueblo.montana && regionDeLaBanda(g) === 'montana';
}

/** Lo que se le puede vender al perista (lo de la historia, como el maletín, no). */
export function paraVender(g) {
  return ((g.owned && g.owned.objetos) || []).filter((o) => !o.historia);
}

/** El herido al que más le falta para curarse (no el que cura). */
export function heridoParaCurar(g, quien) {
  let mejor = null;
  for (const [id, e] of Object.entries(g.banda || {})) {
    if (id === quien || !e || !e.esta || !(e.herido > 0)) continue;
    if (!mejor || e.herido > g.banda[mejor].herido) mejor = id;
  }
  return mejor;
}

/** Si ya jugó alguien a las cartas desde el último golpe. */
export function yaHuboCartas(g) {
  return !!(g.campamento && g.campamento.cartasYa);
}

/**
 * QUE SALGA A UNA TAREA (lo llama la pizarra cuando empieza su parte). Devuelve si salió: si no hay nada que hacer
 * (nada que vender, nadie herido, ya hubo cartas) se queda descansando.
 */
export function empezarTarea(g, id, t, ahora, azar = Math.random) {
  const e = g.banda[id], que = t.que;
  if (que === 'vender' && !paraVender(g).length) return false;
  if (que === 'curar' && (!tiene(e, 'curandero') || !heridoParaCurar(g, id))) return false;
  if (que === 'cocinar' && !tiene(e, 'cocinero')) return false;
  if (que === 'cartas') { if (yaHuboCartas(g)) return false; g.campamento.cartasYa = true; }
  const quedan = que === 'pueblo' && puebloLejos(g) ? 2 : DURA[que];
  if (!quedan) return false;
  e.practica = { tarea: que, datos: t, quedan, dePizarra: true, enCampo: !!EN_CAMPO[que], empezo: ahora, hab: null };
  e.papel = null;
  // 🍲 (Cocinar se hace al llegar la noche: la carne de hoy se sala antes de que se pase.)
  if (que === 'cocinar') cocinar(g, id);
  return true;
}

/**
 * VOLVIERON DE SUS TAREAS (lo llama `pasaUnaParte`, systems/animoEnJuego.js): `lista` son `[id, practica]` de los que
 * terminaron en esta parte. Los que cazaron juntos, una sola presa.
 */
export function terminarTareas(g, lista, azar = Math.random) {
  const cazadores = lista.filter(([, p]) => p.tarea === 'cazar').map(([id]) => id);
  if (cazadores.length) cazar(g, cazadores, azar);
  for (const [id, p] of lista) {
    if (p.tarea === 'pescar') pescar(g, id, azar);
    else if (p.tarea === 'pueblo') pueblo(g, id, p.datos, azar);
    else if (p.tarea === 'cartas') cartas(g, id, azar);
    else if (p.tarea === 'curar') curar(g, id);
    else if (p.tarea === 'vender') vender(g, id, azar);
  }
}

/** Usó una habilidad en una tarea: le cuenta como un uso de verdad (lo que aprendió o perdió, a las noticias). */
function usar(g, id, hab) {
  const e = g.banda[id];
  if (!tiene(e, hab)) return;
  const r = practicar(e, hab, hoy(g));
  if (r) noticia(g, `${r}:${id}:${hab}`);
}

/** Carne a la despensa: dura lo de la región. Devuelve la partida (el Cocinero la puede salar esa noche). */
function aLaDespensa(g, n) {
  const p = { n, vence: hoy(g) + COMIDA.caza[regionDeLaBanda(g)].dura, carne: true, cazada: hoy(g) };
  despensa(g).push(p);
  return p;
}

// ─────────────────────────── 🦌 cazar ───────────────────────────

/**
 * Los que salieron a cazar esa mañana, juntos: la chance de la región, más la puntería si alguno la tiene, más el
 * Rastreador si alguno lo es (y entonces la presa sale más grande).
 */
function cazar(g, ids, azar) {
  const C = COMIDA.caza, R = C[regionDeLaBanda(g)];
  const punt = ids.find((id) => tiene(g.banda[id], 'punteria'));
  const ras = ids.find((id) => tiene(g.banda[id], 'rastreador'));
  const chance = Math.min(1, R.chance + (punt ? C.punteria.chance : 0) + (ras ? C.rastreador.chance : 0));
  if (punt) usar(g, punt, 'punteria');
  if (ras) usar(g, ras, 'rastreador');
  let n = 0;
  if (azar() < chance) {
    n = Math.round(entre(R.min, R.max, azar) * (ras ? C.rastreador.por : 1)) + (punt ? C.punteria.porciones : 0);
    aLaDespensa(g, n);
  }
  noticia(g, `tarea:${ids.join('+')}:cazar:${n}:${diasQueAlcanza(g)}`);
}

// ─────────────────────────── 🎣 pescar ───────────────────────────

/** Siempre trae algo: de `min` a `max` porciones; el Paciente más, el Impulsivo menos (por su fuerza). */
function pescar(g, id, azar) {
  const P = COMIDA.pesca, e = g.banda[id];
  let por = 1;
  if (azar() < fuerza(e, 'paciente')) por *= P.paciente;
  if (azar() < fuerza(e, 'impulsivo')) por *= P.impulsivo;
  const n = Math.max(1, Math.round(entre(P.min, P.max, azar) * por));
  aLaDespensa(g, n);
  noticia(g, `tarea:${id}:pescar:${n}:${diasQueAlcanza(g)}`);
}

// ─────────────────────────── 🗞️ el pueblo ───────────────────────────

function pueblo(g, id, datos, azar) {
  const e = g.banda[id], P = TAREAS.pueblo;
  // 📖 (Frank, desde el asalto 6, ve el cartel de Santiago en la oficina de Dagget: ver data/escenas.js.)
  alBajarAlPueblo(g, id);
  // 😤 (El Pendenciero se agarra a trompadas en la cantina: tu recompensa sube.)
  if (azar() < fuerza(e, 'pendenciero')) { g.bounty = (g.bounty || 0) + P.pendenciero; noticia(g, `tarea:${id}:pelea:${P.pendenciero}`); }
  if (datos && datos.para === 'comida') { comprarComida(g, id); return; }
  let chance = P.base + P.alcoholico * fuerza(e, 'alcoholico') + P.curioso * fuerza(e, 'curioso')
    + (tiene(e, 'labia') ? P.labia : 0) + (tiene(e, 'baraja') ? P.baraja : 0);
  const mentiroso = fuerza(e, 'mentiroso') > 0;
  if (mentiroso) chance *= P.mentiroso;
  for (const hab of ['labia', 'baraja']) usar(g, id, hab);
  if (!al(chance, azar)) { noticia(g, `tarea:${id}:puebloNada`); return; }
  // 🗞️ (De dónde viene, y cuánto es cierto: la cantina, 75 de cada 100; el Mentiroso, "dudoso", 50. Ver `RUMORES`.)
  const de = mentiroso ? 'dudoso' : 'cantina';
  const falso = azar() * 100 >= RUMORES[de];
  const tren = falso ? rumorFalso(g, de) : rumorDeCarga(g, 4, de) || rumorFalso(g, de);
  if (!tren) { noticia(g, `tarea:${id}:puebloNada`); return; }
  noticia(g, `rumor:${id}:${tren.id}:pueblo`);
}

/** Completa la despensa para `comidaDias` días, con los packs que convengan y lo que alcance la plata. */
function comprarComida(g, id) {
  let falta = faltaPara(g, TAREAS.pueblo.comidaDias);
  let n = 0, costo = 0;
  const packs = COMIDA.packs.slice().sort((a, b) => b.n - a.n);
  for (const p of packs) while (falta >= p.n) { const c = comprar(g, p.n); if (c == null) break; n += p.n; costo += c; falta -= p.n; }
  while (falta > 0) { const c = comprar(g, 1); if (c == null) break; n++; costo += c; falta--; }
  noticia(g, `tarea:${id}:compra:${n}:${costo}:${falta > 0 ? 1 : 0}`);
}

/**
 * Cuántas porciones faltan para comer los próximos `dias` días, día por día: como se come, primero lo que se vence
 * antes, y lo que se pasa antes de comerlo no cuenta.
 */
function faltaPara(g, dias) {
  const lista = despensa(g).map((p) => ({ ...p })).sort((a, b) => a.vence - b.vence);
  const comen = comensales(g);
  let falta = 0;
  for (let k = 1; k <= dias; k++) {
    const dia = hoy(g) + k;
    let quedan = comen;
    for (const p of lista) { if (p.vence < dia || !p.n) continue; const t = Math.min(p.n, quedan); p.n -= t; quedan -= t; if (!quedan) break; }
    falta += quedan;
  }
  return falta;
}

// ─────────────────────────── 🃏 cartas ───────────────────────────

function cartas(g, id, azar) {
  const C = TAREAS.cartas, e = g.banda[id], baraja = tiene(e, 'baraja');
  const gana = azar() < (baraja ? C.conBaraja : C.sinBaraja);
  const dif = gana ? C.gana : -Math.min(C.gana, g.money || 0);
  g.money = (g.money || 0) + dif;
  const pelea = azar() < C.pelea;
  if (pelea) g.bounty = (g.bounty || 0) + C.recompensaPelea;
  usar(g, id, 'baraja');
  // (😄 Al Divertido, una noche de cartas lo saca del aburrimiento.)
  if (e.animo) e.animo.sinActividad = 0;
  noticia(g, `tarea:${id}:cartas:${dif}:${pelea ? C.recompensaPelea : 0}`);
}

// ─────────────────────────── 🩹 curar ───────────────────────────

function curar(g, id) {
  const otro = heridoParaCurar(g, id);
  if (!otro) return;
  const h = g.banda[otro];
  h.herido = Math.max(0, h.herido - TAREAS.curar.dias);
  usar(g, id, 'curandero');
  noticia(g, `tarea:${id}:curar:${otro}:${h.herido}`);
}

// ─────────────────────────── 🍲 cocinar ───────────────────────────

/** Sala la carne cazada hoy, y deja un guiso: si sales al golpe esta noche o mañana, James entra con un tiro más. */
function cocinar(g, id) {
  const C = g.campamento, d = hoy(g);
  let salo = 0;
  for (const p of despensa(g)) if (p.carne && p.cazada === d && !p.salada) {
    p.vence = d + COMIDA.caza[regionDeLaBanda(g)].dura * COMIDA.caza.sala;
    p.salada = true;
    salo += p.n;
  }
  C.guiso = d;
  usar(g, id, 'cocinero');
  noticia(g, `tarea:${id}:cocinar:${salo}`);
}

/**
 * 🍲 AL SALIR A UN GOLPE (scenes/mapScene.js): si hay guiso de esta noche o de anoche, James entra con un tiro más.
 * Devuelve cuántos tiros (0 si no hay).
 */
export function guisoParaElGolpe(g) {
  const C = g.campamento;
  if (!C || C.guiso == null) return 0;
  const d = hoy(g), sirve = C.guiso === d || C.guiso === d - 1;
  C.guiso = null;
  return sirve ? TAREAS.cocinar.tiros : 0;
}

// ─────────────────────────── 💰 vender ───────────────────────────

/** Lo vende todo (menos lo de la historia), sin tu honor; regatea a veces; el Rastrero se guarda una parte a veces. */
function vender(g, id, azar) {
  const V = TAREAS.vender, e = g.banda[id], objetos = paraVender(g);
  if (!objetos.length) return;
  if (TRATOS.activo) { venderTratando(g, id, e, objetos, azar); return; }
  const lote = tasarLote(objetos, 0);
  const regateo = al(tiene(e, 'negociante') ? V.negociante : V.regatea, azar);
  let total = Math.round(lote.total * (regateo ? 1 + V.mas : 1));
  const guarda = azar() * 100 < V.rastrero * fuerza(e, 'rastrero') ? Math.round(total * V.guarda) : 0;
  total -= guarda;
  g.money = (g.money || 0) + total;
  const todos = g.owned.objetos, quedan = todos.filter((o) => o.historia);
  todos.length = 0;
  todos.push(...quedan);
  usar(g, id, 'negociante');
  noticia(g, `tarea:${id}:vender:${total}:${regateo ? 'r' : 'a'}:${guarda}:0`);
}

/**
 * 🤝 VENDER CON LOS TRATOS (TRATOS.md, "Mandar a otro"): el que va juega con las mismas reglas que tú, y la jugada
 * la eligen sus rasgos (`jugadaDe`): el Buen negociante regatea mejor, el Pendenciero aprieta, el Honorable nunca.
 * No carga tu honor; el soplo y el chantaje sí suben tu recompensa. El Rastrero se guarda una parte, como antes.
 */
function venderTratando(g, id, e, objetos, azar) {
  const V = TAREAS.vender;
  if (cerradoHoy(g, 'perista')) { noticia(g, `tarea:${id}:vender:0:n:0:0`); return; }
  const { ctx } = contextoDeVenta(g, 'perista', objetos, e);
  const of = oferta(ctx, azar);
  const lista = jugadas(ctx, of), j = jugadaDe(ctx.quien, lista, of);
  let r = resolver(ctx, of, j, azar), como = { aceptar: of.chantaje ? 'c' : 'a', regatear: 'r', apretar: 'p', irte: 'n', pelea: 'f' }[j.id];
  aplicarTrato(g, 'perista', r);
  let rec = r.recompensa, sopla = !!r.sopla;
  if (r.sigue) {
    r = resolver(ctx, of, jugadaDe(ctx.quien, r.sigue, { quimica: of.quimica }), azar);
    aplicarTrato(g, 'perista', r);
    rec += r.recompensa; como = 'rm'; sopla = sopla || !!r.sopla;
  }
  if (j.id === 'apretar' && !r.cierra) como = r.habla ? 'h' : 'pm';
  if (j.id === 'irte' && r.habla) como = 'h';
  if (j.id === 'irte' && of.chantaje && !r.habla) como = 'v';
  let total = 0, guarda = 0;
  if (r.cierra) {
    total = r.monto;
    // (Se guarda una parte: el Rastrero, como siempre; y el que se arregló por fuera con el tratante, la química.)
    guarda = of.guarda ? Math.round(total * of.guarda) : azar() * 100 < V.rastrero * fuerza(e, 'rastrero') ? Math.round(total * V.guarda) : 0;
    total -= guarda;
    g.money = (g.money || 0) + total;
    sacarVendido(g);
  }
  usar(g, id, 'negociante');
  // (Y la química que pasó, para que la noticia cuente por qué: 'palabra.loCalma'.)
  noticia(g, `tarea:${id}:vender:${total}:${como}:${guarda}:${rec}:${quimicaQueImporto(of, como).join('.')}`);
  // 📒 (El chantaje o el soplo, a la libreta de la banda: 'libreta:tommy:q:peristaSucio'.)
  for (const a of libretaDelTrato(g, { chantaje: of.chantaje, sopla }, azar)) noticia(g, `libreta:${a.id}:${a.lado}:${a.motivo}`);
}

/** Para que la hoja diga quién hace mejor cada tarea (el rasgo que la mejora y si lo tiene). */
export function mejoraDe(g, id, que) {
  const e = g.banda[id];
  const habs = { cazar: ['rastreador', 'punteria'], pueblo: ['labia', 'baraja'], cartas: ['baraja'], vender: ['negociante'] }[que] || [];
  const pers = { pescar: ['paciente', 'impulsivo'], pueblo: ['curioso', 'alcoholico', 'mentiroso'], vender: ['rastrero'] }[que] || [];
  return [...habs.filter((h) => tiene(e, h)), ...pers.filter((p) => fuerza(e, p) > 0)];
}

export const NOMBRE = (id) => (MIEMBRO[id] ? MIEMBRO[id].corto : id);
