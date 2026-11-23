/**
 * 🔥 LA FOGATA — LAS REGLAS (los números y el porqué, en data/fogata.js). Las relaciones viven en
 * `g.campamento.relaciones` ('frank-santiago': 'roces'); la fogata de esta noche, en `g.campamento.fogata`
 * (`{ par, a, b, estado, resuelta }`), y la deciden los momentos `discusion` y `pelea` (data/momentos.js).
 */
import { FOGATA } from '../data/fogata.js';
import { BANDA, herir } from '../data/banda.js';
import { fuerza, tiene, practicar } from './animo.js';
import { anotar, borrarQueja } from './libreta.js';

const IDS = BANDA.map((m) => m.id);
const PEOR = { bien: 'roces', roces: 'enemigos', enemigos: 'enemigos' };

/** La clave de un par, siempre en el mismo orden: 'frank-santiago'. */
export const parDe = (a, b) => [a, b].sort().join('-');

/** Las relaciones de la partida (las arma la primera vez). */
export function relaciones(g) {
  const C = g.campamento;
  if (!C) return {};
  if (!C.relaciones) C.relaciones = { ...FOGATA.inicio };
  return C.relaciones;
}

/** Cómo están esos dos: 'bien', 'roces' o 'enemigos'. */
export function relacion(g, a, b) {
  return relaciones(g)[parDe(a, b)] || 'bien';
}

/** Los que son enemigos de `id`. */
export function enemigosDe(g, id) {
  if (!FOGATA.activa) return [];
  return Object.entries(relaciones(g)).filter(([p, e]) => e === 'enemigos' && p.split('-').includes(id))
    .map(([p]) => p.split('-').find((x) => x !== id));
}

/** ¿Va al golpe con un enemigo? (Los dos van un paso abajo.) */
export function conEnemigoEnElPlan(g, id) {
  return enemigosDe(g, id).some((o) => g.banda[o] && g.banda[o].esta && g.banda[o].papel);
}

/** Se llevan peor: bien → roces → enemigos. */
export function empeorar(g, a, b) {
  const R = relaciones(g), p = parDe(a, b);
  if (R[p]) R[p] = PEOR[R[p]];
}

/**
 * 💰 EL REPARTO DESPAREJO (scenes/reparto.js): a uno un cuarto más de lo que esperaba (`gen`) y al otro lo esperado o
 * menos, se llevan peor. `filas`: `[{ id, espera, da }]`; `generosoDe`: lo que cuenta como generoso.
 */
export function despuesDelReparto(g, filas, generosoDe) {
  if (!FOGATA.activa) return [];
  const out = [];
  const de = filas.filter((f) => f.espera > 0 && g.banda[f.id] && g.banda[f.id].esta);
  for (let i = 0; i < de.length; i++) for (let k = i + 1; k < de.length; k++) {
    const [x, y] = [de[i], de[k]];
    const genX = x.da >= generosoDe(x.espera), genY = y.da >= generosoDe(y.espera);
    if ((genX && y.da <= y.espera) || (genY && x.da <= x.espera)) { empeorar(g, x.id, y.id); out.push(parDe(x.id, y.id)); }
  }
  return out;
}

/**
 * 🔥 LA NOCHE DEL GOLPE (la llama `visitaNueva` al volver de un asalto): los choques por cómo son, y el par que peor se
 * lleva queda para la fogata (`g.campamento.fogata`). Si la de la vez pasada quedó sin resolver (no fuiste a hablarles),
 * es como dejarlo: discutían, pasan a enemigos. Devuelve las noticias (`'fogataSinResolver:frank-santiago'`, etc.).
 */
export function prepararFogata(g, azar = Math.random) {
  const C = g.campamento, notas = [];
  if (!FOGATA.activa || !C) return notas;
  const R = relaciones(g);
  const vieja = C.fogata;
  if (vieja && !vieja.resuelta && vieja.estado === 'roces' && R[vieja.par] === 'roces') {
    R[vieja.par] = 'enemigos';
    notas.push(`fogataSinResolver:${vieja.a}:${vieja.b}`);
  }
  C.fogata = null;
  const aca = IDS.filter((id) => g.banda[id] && g.banda[id].esta && !g.banda[id].preso);
  for (const p of Object.keys(R)) if (R[p] === 'bien' && azar() < FOGATA.choque && p.split('-').every((id) => aca.includes(id))) R[p] = 'roces';
  // (El par que peor se lleva, de los que están; si empatan, el que suma menos lealtad.)
  const lealDe = (p) => p.split('-').reduce((t, id) => t + (g.banda[id].lealtad || 0), 0);
  const pares = Object.entries(R).filter(([p, e]) => e !== 'bien' && p.split('-').every((id) => aca.includes(id)))
    .sort(([p1, e1], [p2, e2]) => (e1 === e2 ? lealDe(p1) - lealDe(p2) : e1 === 'enemigos' ? -1 : 1));
  if (pares.length) {
    const [p, estado] = pares[0], [a, b] = p.split('-');
    C.fogata = { par: p, a, b, estado, resuelta: false };
  }
  // 😄 El Divertido, junto al fuego: le borra una queja chica a otro (al Serio no le llega), una vez por golpe.
  const dia = g.tiempo ? g.tiempo.dia : 0;
  for (const id of aca) {
    const e = g.banda[id];
    if (!e.libreta || fuerza(e, 'divertido') <= 0 || azar() >= fuerza(e, 'divertido')) continue;
    const otro = aca.find((o) => o !== id && g.banda[o].libreta && g.banda[o].libreta.quejas.some((q) => q.chica)
      && !(azar() < fuerza(g.banda[o], 'serio')));
    if (!otro) continue;
    const q = borrarQueja(g.banda[otro], dia, true);
    if (q) notas.push(`fogataRie:${id}:${otro}:${q.motivo}`);
  }
  return notas;
}

/** La fogata de esta noche, si es de ese estado ('roces' o 'enemigos') y sigue sin resolver. */
export function fogataDe(g, estado) {
  const F = g.campamento && g.campamento.fogata;
  return F && !F.resuelta && F.estado === estado ? F : null;
}

/** Un tercero (ni `a` ni `b`) que está y tiene esa habilidad. */
function terceroCon(g, a, b, hab) {
  return IDS.find((id) => id !== a && id !== b && g.banda[id] && g.banda[id].esta && tiene(g.banda[id], hab)) || null;
}

/** El que puede calmarlos gratis con su Labia (o null). */
export function quienCalma(g) {
  const F = g.campamento && g.campamento.fogata;
  return F ? terceroCon(g, F.a, F.b, 'labia') : null;
}

/**
 * 🗣️ CÓMO TERMINA LA DISCUSIÓN: 'razon' (ya anotaron los momentos), 'calmar' (vuelven a estar bien) o 'dejar' (pasan
 * a enemigos, salvo que un Divertido que no es ninguno de los dos, según su fuerza, los haga reír: siguen con roces y
 * los dos anotan "nadie nos escuchó"). Devuelve `{ que, divertido, anotes }`.
 */
export function terminarDiscusion(g, como, azar = Math.random) {
  const F = g.campamento.fogata, R = relaciones(g), dia = g.tiempo ? g.tiempo.dia : 0;
  F.resuelta = true;
  if (como === 'calmar') {
    R[F.par] = 'bien';
    const t = quienCalma(g);
    if (t) practicar(g.banda[t], 'labia', dia);
    return { que: 'calmar', por: t, anotes: [] };
  }
  if (como !== 'dejar') return { que: 'razon', anotes: [] };
  const div = IDS.find((id) => id !== F.a && id !== F.b && g.banda[id] && g.banda[id].esta && azar() < fuerza(g.banda[id], 'divertido'));
  if (div) {
    const anotes = [];
    for (const id of [F.a, F.b]) if (anotar(g.banda[id], 'q', 'nadieNosEscucho', dia, { chica: true })) anotes.push({ id, lado: 'q', motivo: 'nadieNosEscucho', veces: 1 });
    return { que: 'divertido', divertido: div, anotes };
  }
  R[F.par] = 'enemigos';
  return { que: 'enemigos', anotes: [] };
}

/**
 * 👊 CÓMO TERMINA LA PELEA: 'parar' (pagaste: vuelven a roces) o 'dejar': queda herido `FOGATA.herida` días el de menos
 * lealtad (si empatan, a la suerte; el Buen cuchillero nunca: el herido es el otro), con queja chica, y vuelven a roces.
 * Devuelve `{ que, herido, anotes }`.
 */
export function terminarPelea(g, como, azar = Math.random) {
  const F = g.campamento.fogata, R = relaciones(g), dia = g.tiempo ? g.tiempo.dia : 0;
  F.resuelta = true;
  R[F.par] = 'roces';
  if (como === 'parar') return { que: 'parar', anotes: [] };
  const [a, b] = [g.banda[F.a], g.banda[F.b]];
  let herido = a.lealtad < b.lealtad ? F.a : b.lealtad < a.lealtad ? F.b : azar() < 0.5 ? F.a : F.b;
  if (tiene(g.banda[herido], 'cuchillero')) herido = herido === F.a ? F.b : F.a;
  herir(g.banda, herido, FOGATA.herida);
  const anotes = anotar(g.banda[herido], 'q', 'laPelea', dia, { chica: true }) ? [{ id: herido, lado: 'q', motivo: 'laPelea', veces: 1 }] : [];
  return { que: 'herido', herido, anotes };
}

