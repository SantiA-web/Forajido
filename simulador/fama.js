/**
 * 📣 EL SIMULADOR DE LA FAMA DEL DESIERTO (HISTORIA-DESIERTO.md, "El objetivo" y "La fama"; *Santi, 2026-11-23: "pasa
 * estos números al simulador"*). El de la banda (banda3.js) no simula la fama; éste sí, y nada más: los días, los
 * golpes, la fama, la recompensa, cuándo viene Cole y las cartas de J.Mc.
 *
 * Correr:  node simulador/fama.js      (escribe simulador/resultados-fama.md)
 *
 * Lo que NO sabe (y por eso los números son una guía, no la verdad): cuánto botín trae de verdad un golpe del juego
 * (usa el de banda3.js: $200 a $800), cuántos guardias mata cada jugador, y los jefes (no los simula).
 */
import { writeFileSync } from 'node:fs';

// ─────────────────────────── los números a probar (los de HISTORIA-DESIERTO.md) ───────────────────────────
export const F = {
  golpeBien: 10,        // un golpe que salió bien (volviste con botín)
  golpeGrande: 10,      // …y fue de $300 o más
  grandeDesde: 300,
  diario: 30,           // "El Cuervo" en el diario, una vez
  diarioSinGrande: 7,   // si no hubo golpe grande: días después del primer golpe que salió bien
  guardia: 3,           // cada guardia muerto
  civil: 5,             // cada civil muerto
  raro: 40,             // algo raro en el botín (lo de hoy)
  raroChance: 0.08,
  limpios: 30,          // tres golpes limpios seguidos (lo de hoy)
  cadaLimpios: 3,
  // La recompensa: lo de hoy (con la alarma) + la parte de la fama.
  recompensaPorFama: 0.5,
  pesoGuardia: 15, pesoCivil: 110, capturaFlat: 300,
  // Cole viene:
  // (🔁 2026-11-23: Santi eligió 300 o $900 con este mismo simulador.)
  coleFama: 300,
  coleRecompensa: 900,
  // Las cartas de J.Mc.:
  buenTrabajo: 150,     // la mitad del camino
  sinSubir: 6,          // días sin que la fama suba → "que sean efectivos" (y otros tantos → desconfía)
  teLoTraigo: 10,       // ya desconfía y pasan estos días más sin que suba → J.Mc. inventa al Cuervo y trae a Cole
  // Los tratos (data/tratos.js): con 100 "se habla de ti", con 300 "leyenda". Se miden para ver si hay que subirlos.
  seHabla: 100,
  // El tope: si a los 60 días Cole no vino, se corta (para ver quién no llega).
  tope: 60,
  // La cárcel: días que se pierden si te agarran.
  carcel: 5,
};

// ─────────────────────────── cómo juega cada uno ───────────────────────────
// `cada`: días entre golpes; `bien`: chance de volver con botín; `agarran`: chance de que te agarren (del resto);
// `guardias`: guardias muertos por golpe (promedio); `civil`: chance de matar un civil; `alarma`: chance de que suene.
const JUGADORES = {
  bueno: { nombre: 'Roba bien', cada: [2, 3], bien: 0.85, agarran: 0.2, guardias: 1, civil: 0.02, alarma: 0.4 },
  normal: { nombre: 'Normal', cada: [2, 3], bien: 0.7, agarran: 0.25, guardias: 2, civil: 0.08, alarma: 0.6 },
  falla: { nombre: 'Falla mucho', cada: [2, 3], bien: 0.4, agarran: 0.3, guardias: 1.5, civil: 0.05, alarma: 0.7 },
  violento: { nombre: 'Violento (mata civiles)', cada: [2, 3], bien: 0.75, agarran: 0.2, guardias: 4, civil: 0.6, alarma: 1 },
  tranquilo: { nombre: 'Se toma su tiempo', cada: [4, 6], bien: 0.75, agarran: 0.2, guardias: 1.5, civil: 0.05, alarma: 0.5 },
  apurado: { nombre: 'Apurado', cada: [1, 2], bien: 0.6, agarran: 0.3, guardias: 2.5, civil: 0.1, alarma: 0.7 },
  quieto: { nombre: 'Casi no sale de la carpa', cada: [7, 12], bien: 0.5, agarran: 0.3, guardias: 1, civil: 0.02, alarma: 0.5 },
};

// (Azar con semilla, para que dos corridas den lo mismo.)
function azar(semilla) {
  let a = semilla >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const entre = (rng, [a, b]) => a + Math.floor(rng() * (b - a + 1));
// (Cuántos guardias: alrededor del promedio, de 0 al doble.)
const cuantos = (rng, prom) => Math.max(0, Math.round(prom * 2 * rng()));

/** Un desierto. Devuelve lo que pasó. */
function desierto(J, N, rng) {
  let dia = 1, fama = 0, rec = 0, racha = 0, golpes = 0, bien = 0, presos = 0;
  let ultimaSubida = 1, diario = false, primerBien = null, buenTrabajo = null, efectivos = 0, desconfia = null;
  let avisoDia = null, desconfiaDia = null, trae = null, seHabla = null, diasDesconfiando = 0;
  let ofertaLey = null, horca = false;
  const subir = (n) => { if (n > 0) { fama += n; rec += n * N.recompensaPorFama; ultimaSubida = dia; avisoDia = desconfiaDia = null; } };
  // (Las cartas por días sin subir: se miran cada día.)
  const mirarCartas = () => {
    if (buenTrabajo == null && fama >= N.buenTrabajo) buenTrabajo = dia;
    if (seHabla == null && fama >= N.seHabla) seHabla = dia;
    // (Las cartas por días sin subir: "efectivos", después desconfía, después "te lo traigo yo". Subir lo borra.)
    const sin = dia - ultimaSubida;
    if (avisoDia == null && sin >= N.sinSubir) { efectivos++; avisoDia = dia; }
    if (avisoDia != null && desconfiaDia == null && sin >= 2 * N.sinSubir) { desconfiaDia = dia; if (desconfia == null) desconfia = dia; }
    if (desconfiaDia != null) diasDesconfiando++;
    if (desconfiaDia != null && trae == null && sin >= 2 * N.sinSubir + N.teLoTraigo) trae = dia;
    if (ofertaLey == null && rec >= 600) ofertaLey = dia;
    if (rec >= 1200) horca = true;
  };
  while (dia <= N.tope) {
    // Hasta el próximo golpe pasan días (y se miran las cartas).
    const espera = entre(rng, J.cada);
    for (let d = 0; d < espera; d++) {
      dia++;
      if (!diario && primerBien != null && dia - primerBien >= N.diarioSinGrande) { diario = true; subir(N.diario); }
      mirarCartas();
      if (fama >= N.coleFama || rec >= N.coleRecompensa || trae) break;
    }
    if (fama >= N.coleFama || rec >= N.coleRecompensa || trae) break;
    // El golpe.
    golpes++;
    const alarma = rng() < J.alarma;
    const g = cuantos(rng, J.guardias), c = rng() < J.civil ? 1 : 0;
    subir(g * N.guardia + c * N.civil);
    if (alarma) rec += g * N.pesoGuardia + c * N.pesoCivil;
    if (rng() < J.bien) {
      bien++;
      const botin = 200 + rng() * 600;
      let n = N.golpeBien + (botin >= N.grandeDesde ? N.golpeGrande : 0);
      if (rng() < N.raroChance) n += N.raro;
      racha = alarma ? 0 : racha + 1;
      if (racha && racha % N.cadaLimpios === 0) n += N.limpios;
      if (primerBien == null) primerBien = dia;
      // (El diario: la mañana después del primer golpe grande.)
      if (!diario && botin >= N.grandeDesde) { diario = true; n += N.diario; }
      subir(n);
    } else {
      racha = 0;
      if (rng() < J.agarran) { presos++; rec += N.capturaFlat; dia += N.carcel; }
    }
    mirarCartas();
    if (fama >= N.coleFama || rec >= N.coleRecompensa || trae) break;
  }
  const vino = fama >= N.coleFama ? 'fama' : rec >= N.coleRecompensa ? 'recompensa' : trae ? 'jmc' : null;
  return { dia, vino, fama, rec, golpes, bien, presos, buenTrabajo, efectivos, desconfia, ofertaLey, horca, seHabla, diasDesconfiando };
}

/** Muchas partidas de un jugador: los promedios y los porcentajes. */
function correr(J, N = F, n = 3000) {
  const rng = azar(12345);
  const r = [];
  for (let i = 0; i < n; i++) r.push(desierto(J, N, rng));
  const prom = (f) => r.reduce((t, x) => t + f(x), 0) / n;
  const pct = (f) => Math.round((100 * r.filter(f).length) / n);
  const dias = r.filter((x) => x.vino).map((x) => x.dia).sort((a, b) => a - b);
  const p = (q) => (dias.length ? dias[Math.floor(q * (dias.length - 1))] : '—');
  return {
    diasMedio: Math.round(prom((x) => (x.vino ? x.dia : N.tope))), rapido: p(0.1), lento: p(0.9),
    porFama: pct((x) => x.vino === 'fama'), porRec: pct((x) => x.vino === 'recompensa'), porJmc: pct((x) => x.vino === 'jmc'), noLlega: pct((x) => !x.vino),
    seHabla: pct((x) => x.seHabla != null), diaSeHabla: Math.round(prom((x) => x.seHabla || 0) / Math.max(0.01, prom((x) => (x.seHabla ? 1 : 0)))),
    diasDesconfiando: prom((x) => x.diasDesconfiando).toFixed(1),
    golpes: prom((x) => x.golpes).toFixed(1), buenTrabajo: pct((x) => x.buenTrabajo != null),
    diaBuenTrabajo: Math.round(prom((x) => x.buenTrabajo || 0) / Math.max(0.01, prom((x) => (x.buenTrabajo ? 1 : 0)))),
    efectivos: prom((x) => x.efectivos).toFixed(1), desconfia: pct((x) => x.desconfia != null),
    rec: Math.round(prom((x) => x.rec)), ofertaLey: pct((x) => x.ofertaLey != null), horca: pct((x) => x.horca), fama: Math.round(prom((x) => x.fama)),
  };
}

// ─────────────────────────── el informe ───────────────────────────
function tabla(N, titulo) {
  let t = `### ${titulo}\n\n| Jugador | Días hasta Cole (medio) | El 10% más rápido / lento | Por fama | Por recompensa | Lo trae J.Mc. | No llega en ${N.tope} días | Golpes | "Se habla de ti" (${N.seHabla}) | "Buen trabajo" (y el día) | Cartas "efectivos" | Desconfía (días con cuota alta) | Recompensa al final | Oferta de la ley (600) | Pasa la horca (1200) |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
  for (const J of Object.values(JUGADORES)) {
    const r = correr(J, N);
    t += `| ${J.nombre} | ${r.diasMedio} | ${r.rapido} / ${r.lento} | ${r.porFama}% | ${r.porRec}% | ${r.porJmc}% | ${r.noLlega}% | ${r.golpes} | ${r.seHabla}% (día ${r.diaSeHabla}) | ${r.buenTrabajo}% (día ${r.diaBuenTrabajo}) | ${r.efectivos} | ${r.desconfia}% (${r.diasDesconfiando}) | $${r.rec} | ${r.ofertaLey}% | ${r.horca}% |\n`;
  }
  return t + '\n';
}

let md = `# Resultados del simulador de la fama (fama.js)\n\n3000 desiertos por jugador. Empieza el día 1; termina cuando viene Cole (la fama llega a ${F.coleFama} o la recompensa a ${F.coleRecompensa}). Los números de fama son los de HISTORIA-DESIERTO.md.\n\n`;
md += tabla(F, `Lo elegido: Cole con fama ${F.coleFama} o recompensa $${F.coleRecompensa}; buen trabajo en ${F.buenTrabajo}; J.Mc. lo trae a los ${2 * F.sinSubir + F.teLoTraigo} días sin subir`);
for (const [nombre, cambio] of [
  ['"Se habla de ti" en 150 (en vez de 100)', { seHabla: 150 }],
  ['Sin el diario a los 7 días (sólo con un golpe grande)', { diarioSinGrande: 1e9 }],
]) md += tabla({ ...F, ...cambio }, nombre);
writeFileSync(new URL('./resultados-fama.md', import.meta.url), md);
console.log(md);
