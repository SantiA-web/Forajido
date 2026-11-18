/**
 * ⚖️ EL SIMULADOR DEL ÁNIMO *(Santi, 2026-11-15: "es el pilar más grande que sostiene al juego"; tiene que estar
 * "quirúrgicamente controlado y equilibrado")*.
 *
 * Juega miles de partidas de 30 asaltos, sin dibujar nada, con cuatro clases de jugador (el que cuida a la banda, el
 * tacaño, el violento y el descuidado), y mide lo que le pasa a la banda: cuántos se van, cuántas veces alguien se
 * niega, cuánto tardan las habilidades en aparecer y en volver, cuándo se pone gris una marca, cuánto se mueve el humor.
 * Usa las MISMAS reglas que va a usar el juego (src/systems/animo.js) y los MISMOS números (src/data/rasgos.js): lo
 * que se mide acá es lo que después se juega.
 *
 * Lo que el juego todavía no tiene (cada cuánto llega una carta, cuánto falla el pasajero…) lo imagina `MUNDO`, acá
 * abajo: son supuestos del simulador, no números del juego.
 *
 * Correrlo, desde C:\dev\forajido:   node simulador/simulador.js
 * Escribe las tablas en simulador/resultados.md.
 */

import { writeFileSync } from 'node:fs';
import { ANIMO, HUMOR, MARCA, RASGOS_DE, palabraDeHumor, nivelDeMarca, esPersonalidad } from '../src/data/rasgos.js';
import { BANDA, LEALTAD, PLAN, palabraDeLealtad } from '../src/data/banda.js';
import {
  fuerza, tiene, moverHumor, moverLealtad, nuevoDia, actividad, disposicion, cambioDeFalla, practicar,
  moverPersonalidad, revisarSiSeVa, habilidadesIniciales,
} from '../src/systems/animo.js';

// ─────────────────────────────────────────────────────────────── lo que el simulador imagina del juego
const MUNDO = {
  asaltos: 30,
  partidas: Number(process.env.PARTIDAS) || 4000,
  /** 📅 Los días entre un asalto y el siguiente (el último es el del asalto), sorteados entre estos. */
  diasEntre: [2, 3],
  /** Cada día, la chance de que a uno le llegue una carta o una noticia de su historia, y de que sea mala. */
  carta: 0.032, cartaMala: 0.6,
  /** Cada día, la chance de que haya un momento; y si lo hay, que sea una pelea entre dos (si no, alguien te pide algo). */
  momento: 0.4, pelea: 0.3,
  /** El pasajero: lo que falla de base, y lo que ayuda ser buen actor. */
  pasajeroFalla: 0.2, actorAyuda: 0.1,
  /** Los caballos: lo que ayuda ser veloz en las riendas. */
  riendasAyuda: 0.1,
  /** Si al pasajero le sale mal: lo hieren, o cae preso. (Los días que tarda en curarse son los del juego: PLAN.herida.) */
  heridoSiFalla: 0.35, presoSiFalla: 0.15,
  /** Lo que sale bien el asalto (cada puesto que falla le resta). */
  asaltoBien: 0.85, porFalla: 0.15,
  /** Si hay huida, el de los caballos tira desde el caballo: practica la puntería. */
  huida: 0.4,
  /** Días que tarda en volver el que sale por la fianza, y días preso hasta que se lo pierde (si no pagás). */
  fianzaTarda: 2, presoPerdido: 12,
  /** Cada día: la ocasión de darle la botella al alcohólico de malas, y la de sacársela. */
  ocasionDar: 0.4, ocasionBotella: 0.14,
  /** Cada día: la chance de que el divertido tenga con qué organizar algo, y de que el de las cartas se siente a jugar. */
  ocasionActividad: 0.4, juegaCartas: 0.2,
  /**
   * 🎯 Practicar: el que practica se va el día entero (sólo en los días sin asalto, para que no falte al asalto).
   * Desde cuántos días sin usarla lo mandás a practicar una habilidad que tiene, para no perderla.
   */
  practicaDesde: 4,
};

/** Las cuatro clases de jugador. */
const JUGADORES = {
  cuidadoso: { nombre: 'Cuida a la banda', practica: 0.8, concede: 0.75, parejo: 0.85, civiles: 0, dejaAtras: 0, fianza: 1, botella: 0.5, sacaBotella: 0.5, organiza: 0.5, elige: 'mejor' },
  tacano: { nombre: 'Tacaño', practica: 0.3, concede: 0.3, parejo: 0.25, civiles: 0.1, dejaAtras: 0.1, fianza: 0.8, botella: 0.1, sacaBotella: 0.2, organiza: 0.2, elige: 'mejor' },
  violento: { nombre: 'Violento (mata civiles)', practica: 0.3, concede: 0.5, parejo: 0.6, civiles: 0.6, dejaAtras: 0.2, fianza: 0.8, botella: 0.3, sacaBotella: 0.2, organiza: 0.3, elige: 'mejor' },
  trabajador: { nombre: 'Cuida y le saca la botella a Frank cada vez que puede', practica: 0.8, concede: 0.75, parejo: 0.85, civiles: 0, dejaAtras: 0, fianza: 1, botella: 0, sacaBotella: 1, organiza: 0.5, elige: 'mejor' },
  descuidado: { nombre: 'Descuidado (deja gente atrás)', practica: 0.1, concede: 0.4, parejo: 0.5, civiles: 0.2, dejaAtras: 0.6, fianza: 0.3, botella: 0.2, sacaBotella: 0.1, organiza: 0.2, elige: 'azar' },
};

// ─────────────────────────────────────────────────────────────── azar con semilla (se puede repetir)
function crearAzar(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────────────────────── una partida
const IDS = BANDA.map((m) => m.id);
const DESCANSO = HUMOR.descanso;

function bandaNueva() {
  return Object.fromEntries(IDS.map((id) => [id, {
    lealtad: LEALTAD.inicial[id], humor: DESCANSO[id], esta: true, herido: 0, preso: 0,
    rasgos: { ...RASGOS_DE[id] }, habilidades: habilidadesIniciales(RASGOS_DE[id]),
  }]));
}

function aplicar(e, ef, dia, motivo = null, mult = 1) {
  if (ef.humor) moverHumor(e, ef.humor * mult, motivo, dia);
  if (ef.lealtad) moverLealtad(e, ef.lealtad * mult);
}

function jugarPartida(tipo, semilla) {
  const J = JUGADORES[tipo], azar = crearAzar(semilla), E = ANIMO.eventos;
  const banda = bandaNueva();
  const m = {
    perdidos: [], negativas: 0, puestos: 0, maxCambioDia: 0, dias: 0, practicas: 0, palabras: { contento: 0, tranquilo: 0, deMalas: 0, furioso: 0 },
    aprender: [], recuperar: [], perdidas: [], gris: [], blanca: [], fallos: 0,
  };
  // Para medir cuánto tarda en aprender o recuperar: los usos desde que empezó (o desde que la perdió).
  const usos = {};   // id:hab → { usos, desde: 'cero' | 'perdida' }
  const resaca = {};

  const presentes = () => IDS.filter((id) => banda[id].esta && !banda[id].preso);
  const elegirAzar = (lista) => lista[Math.floor(azar() * lista.length)];

  function practica(id, hab, dia, rinde = 1) {
    const k = id + ':' + hab, e = banda[id];
    if (!tiene(e, hab)) {
      const u = usos[k] || (usos[k] = { usos: 0, desde: (e.habilidades && e.habilidades[hab] && e.habilidades[hab].yaLaTuvo) ? 'perdida' : 'cero' });
      u.usos++;
    }
    const r = practicar(e, hab, dia, rinde);
    if (r) {
      const u = usos[k];
      (r === 'gano' ? m.aprender : m.recuperar).push(u ? u.usos : 1);
      delete usos[k];
    }
  }

  let dia = 0;
  /** 📅 UN DÍA DE CAMPAMENTO: el ánimo de la mañana, la cárcel, las cartas, los momentos y lo de cada uno. */
  function diaDeCampamento(conAsalto = false) {
    dia++;
    m.dias++;
    const notas = nuevoDia(banda, IDS, dia, DESCANSO);
    for (const n of notas) if (n.que === 'perdio') { m.perdidas.push(n.id + ':' + n.habilidad); usos[n.id + ':' + n.habilidad] = { usos: 0, desde: 'perdida' }; }
    for (const id of IDS) {
      const e = banda[id];
      if (e.herido) e.herido--;
      // La cárcel (en días).
      if (e.preso && e.esta) {
        e.preso++;
        if (e.pagado && e.preso > MUNDO.fianzaTarda + 1) { e.preso = 0; e.pagado = false; aplicar(e, E.fianza, dia); }
        else if (!e.pagado && e.preso > MUNDO.presoPerdido) { e.esta = false; m.perdidos.push({ id, dia, por: 'preso' }); }
      }
    }
    const aca = presentes();
    for (const id of aca) {
      if (azar() < MUNDO.carta) {
        const C = E.carta, n = C.min + azar() * (C.max - C.min);
        moverHumor(banda[id], azar() < MUNDO.cartaMala ? -n : n);
      }
    }
    if (azar() < MUNDO.momento) {
      if (aca.length >= 2 && azar() < MUNDO.pelea) {
        const a = elegirAzar(aca), b = elegirAzar(aca.filter((x) => x !== a));
        aplicar(banda[a], E.peleaGana, dia);
        aplicar(banda[b], E.peleaPierde, dia);
      } else if (aca.length) {
        const id = elegirAzar(aca);
        aplicar(banda[id], azar() < J.concede ? E.pedidoSi : E.pedidoNo, dia);
      }
    }
    for (const id of aca) {
      const e = banda[id];
      const alc = fuerza(e, 'alcoholico');
      if (alc > 0) {
        resaca[id] = azar() < alc;   // esta noche tomó
        if (e.humor < ANIMO.disposicion.malaGana && azar() < MUNDO.ocasionDar && azar() < J.botella) {
          aplicar(e, E.botella, dia, 'botella');
          moverPersonalidad(e, 'alcoholico', ANIMO.personalidad.aFavor);
        } else if (azar() < MUNDO.ocasionBotella && azar() < J.sacaBotella) {
          aplicar(e, E.sacarBotella, dia);
          moverPersonalidad(e, 'alcoholico', -ANIMO.personalidad.contra);
          resaca[id] = false;
        }
      }
      if (fuerza(e, 'divertido') > 0 && azar() < MUNDO.ocasionActividad && azar() < J.organiza) actividad(banda, aca, id, dia);
      if ((tiene(e, 'baraja') || fuerza(e, 'jugador') > 0) && azar() < MUNDO.juegaCartas) practica(id, 'baraja', dia);
    }
    // 🎯 Practicar: en los días sin asalto, el jugador manda a practicar el día entero al que tiene una habilidad que se
    //    le está por olvidar (una por persona y por día; los demás siguen en el campamento).
    if (!conAsalto) {
      for (const id of aca) {
        const hab = Object.entries(banda[id].habilidades || {}).find(([, h]) => h.tiene && dia - h.ultimo >= MUNDO.practicaDesde);
        if (!hab || azar() >= J.practica) continue;
        practica(id, hab[0], dia, ANIMO.habilidad.practica);
        m.practicas++;
      }
    }
  }
  /** Al final de cada día: cómo anduvo el humor, y las marcas que se pusieron grises. */
  function finDelDia(asalto) {
    for (const id of presentes()) {
      const e = banda[id];
      m.palabras[palabraDeHumor(e.humor)]++;
      if (e.animo) m.maxCambioDia = Math.max(m.maxCambioDia, Math.abs(e.humor - e.animo.inicio));
      for (const [r, f] of Object.entries(e.rasgos)) {
        if (!esPersonalidad(r)) continue;
        const k = id + ':' + r, nivel = nivelDeMarca(r, f);
        if (nivel !== 'fuerte' && !m.gris.some((g) => g.k === k)) m.gris.push({ k, dia: asalto });
        if (nivel === 'blanca' && !m.blanca.some((g) => g.k === k)) m.blanca.push({ k, dia: asalto });
      }
    }
  }

  for (let asalto = 1; asalto <= MUNDO.asaltos; asalto++) {
    // ── LOS DÍAS DE CAMPAMENTO (el último, el del asalto) ──
    const dias = elegirAzar(MUNDO.diasEntre);
    for (let d = 1; d < dias; d++) { diaDeCampamento(); finDelDia(asalto); }
    diaDeCampamento(true);
    const aca = presentes();

    // ── EL PLAN ──
    const libres = aca.filter((id) => !banda[id].herido);
    const puestos = {};
    const candidatos = (orden) => {
      const sirve = libres.filter((id) => !Object.values(puestos).includes(id));
      if (J.elige === 'azar') return sirve.length ? elegirAzar(sirve) : null;
      // El que elige bien no pone al furioso, si puede.
      const tranquilos = sirve.filter((id) => palabraDeHumor(banda[id].humor) !== 'furioso');
      const lista = (tranquilos.length ? tranquilos : sirve).sort(orden);
      return lista[0] || null;
    };
    puestos.caballos = candidatos((a, b) => (banda[b].rasgos.riendas || 0) - (banda[a].rasgos.riendas || 0));
    puestos.pasajero = candidatos((a, b) => (banda[b].rasgos.actor || 0) - (banda[a].rasgos.actor || 0));

    // ── EL ASALTO ──
    let fallas = 0;
    const disp = {};
    for (const [puesto, id] of Object.entries(puestos)) {
      if (!id) continue;
      m.puestos++;
      disp[puesto] = disposicion(banda[id], azar, puesto);
      if (disp[puesto] === 'seNiega') { m.negativas++; puestos[puesto] = null; }
    }
    const cab = puestos.caballos;
    if (!cab) fallas++;
    else {
      const e = banda[cab];
      const p = PLAN.fallaCaballos[palabraDeLealtad(e.lealtad)] + (resaca[cab] ? PLAN.resaca : 0)
        + cambioDeFalla(disp.caballos) - (tiene(e, 'riendas') ? MUNDO.riendasAyuda : 0);
      if (azar() < p) fallas++;
      practica(cab, 'riendas', dia);
      if (azar() < MUNDO.huida) practica(cab, 'punteria', dia);
    }
    const pas = puestos.pasajero;
    if (pas) {
      const e = banda[pas];
      const p = MUNDO.pasajeroFalla + cambioDeFalla(disp.pasajero) - (tiene(e, 'actor') ? MUNDO.actorAyuda : 0);
      // (🔁 El pasajero usa UNA de las dos en cada asalto, la que haga falta ese día *(Santi: "hacé las dos")*.)
      practica(pas, azar() < 0.5 ? 'actor' : 'cuchillero', dia);
      if (azar() < p) {
        fallas++;
        const r = azar();
        if (r < MUNDO.heridoSiFalla) { e.herido = PLAN.herida; aplicar(e, E.herido, dia); }
        else if (r < MUNDO.heridoSiFalla + MUNDO.presoSiFalla) { e.preso = 1; e.pagado = azar() < J.fianza; }
        if (!e.preso && azar() < J.dejaAtras) {
          aplicar(e, E.dejadoAtras, dia);
          if (azar() < 0.5) { e.preso = 1; e.pagado = azar() < J.fianza; }
        }
      }
    }
    m.fallos += fallas;
    const bien = azar() < MUNDO.asaltoBien - MUNDO.porFalla * fallas;
    const despues = presentes();
    if (bien) {
      const parejo = azar() < J.parejo, R = E.reparto;
      for (const id of despues) {
        const e = banda[id];
        if (parejo) aplicar(e, E.repartoParejo, dia, null, 1 - 0.5 * fuerza(e, 'ambicioso'));
        else aplicar(e, E.repartoGuardo, dia, null, 1 + R.ambicioso * fuerza(e, 'ambicioso') + R.egoista * fuerza(e, 'egoista') + R.conformista * fuerza(e, 'conformista'));
      }
    } else for (const id of despues) aplicar(banda[id], E.asaltoMal, dia);
    if (azar() < J.civiles) {
      for (const id of despues) {
        const e = banda[id];
        aplicar(e, E.civilesResto, dia);
        aplicar(e, E.civilesHonorable, dia, null, fuerza(e, 'honorable'));
        aplicar(e, E.civilesSentimental, dia, null, fuerza(e, 'sentimental'));
      }
    }

    // ── AL FINAL DEL DÍA DEL ASALTO: ¿alguien se va? (se mira una vez por visita) ──
    finDelDia(asalto);
    for (const id of presentes()) if (revisarSiSeVa(banda[id]) === 'seVa') m.perdidos.push({ id, dia: asalto, por: 'lealtad' });
  }
  m.estrellas = IDS.flatMap((id) => Object.entries(banda[id].habilidades || {}).filter(([, h]) => h.estrella).map(([hab, h]) => ({ k: id + ':' + hab, dia: h.ganoEstrella })));
  m.lealtadFinal = IDS.filter((id) => banda[id].esta).map((id) => banda[id].lealtad);
  return m;
}

// ─────────────────────────────────────────────────────────────── las pruebas de laboratorio
/** Cuántos usos tarda en aprender una habilidad de cero, con el humor fijo. */
function usosParaAprender(humor) {
  const e = { humor, lealtad: 5, esta: true, rasgos: {}, habilidades: {} };
  for (let i = 1; i < 100; i++) { e.humor = humor; e.animo = null; if (practicar(e, 'riendas', i)) return i; }
  return Infinity;
}
/** Cuántas prácticas en el campamento tarda en aprenderla de cero (sin usarla nunca de verdad). */
function practicasParaAprender(humor) {
  const e = { humor, lealtad: 5, esta: true, rasgos: {}, habilidades: {} };
  for (let i = 1; i < 200; i++) { e.humor = humor; e.animo = null; if (practicar(e, 'riendas', i, ANIMO.habilidad.practica)) return i; }
  return Infinity;
}
/** La aprende de cero, la deja de usar hasta perderla, y cuenta cuántos usos tarda en recuperarla. */
function usosParaRecuperar(humor) {
  const e = { humor, lealtad: 5, esta: true, rasgos: {}, habilidades: {} };
  let dia = 0;
  while (!tiene(e, 'riendas')) { dia++; e.humor = humor; e.animo = null; practicar(e, 'riendas', dia); }
  // Un par de usos más, como alguien que la usó un tiempo.
  for (let i = 0; i < 2; i++) { dia++; e.humor = humor; practicar(e, 'riendas', dia); }
  let sinUsar = 0;
  const b = { x: e };
  while (tiene(e, 'riendas')) { dia++; sinUsar++; e.humor = humor; nuevoDia(b, ['x'], dia, { x: humor }); e.humor = humor; }
  let u = 0;
  while (!tiene(e, 'riendas')) { dia++; u++; e.humor = humor; e.animo = null; practicar(e, 'riendas', dia); }
  return { sinUsar, u };
}
/** Cuántas veces hay que contradecir una personalidad (sin alimentarla) para que se ponga gris y para que llegue al piso. */
function vecesParaGris(desde) {
  let f = desde, gris = null, n = 0;
  while (f > MARCA.piso) { n++; f = Math.max(MARCA.piso, f - ANIMO.personalidad.contra); if (gris == null && f < MARCA.gris) gris = n; }
  return { gris, blanca: n };
}

// ─────────────────────────────────────────────────────────────── correr todo y armar las tablas
const prom = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const pct = (x) => `${Math.round(x * 100)}%`;
const uno = (x) => (Number.isFinite(x) ? x.toFixed(1) : '—');
const lineas = [];
const escribir = (s = '') => lineas.push(s);

escribir('# Resultados del simulador');
escribir();
escribir(`${MUNDO.partidas} partidas de ${MUNDO.asaltos} asaltos por cada clase de jugador, con la banda de siempre (Santiago, Frank y Tommy). 📅 Entre asalto y asalto, ${MUNDO.diasEntre.join(' o ')} días: una partida dura unos ${Math.round(MUNDO.asaltos * prom(MUNDO.diasEntre))} días.`);
escribir();

const porTipo = {};
for (const tipo of Object.keys(JUGADORES)) {
  const ms = [];
  for (let i = 0; i < MUNDO.partidas; i++) ms.push(jugarPartida(tipo, 1000 + i * 7919));
  porTipo[tipo] = ms;
}

escribir('## 1. Cuántos pierde cada jugador en una partida');
escribir();
escribir('| Jugador | No pierde a nadie | Pierde 1 | Pierde 2 | Pierde 3 | Promedio | Se van por lealtad / quedan presos | Meta |');
escribir('|---|---|---|---|---|---|---|---|');
for (const [tipo, ms] of Object.entries(porTipo)) {
  const n = [0, 0, 0, 0];
  let lea = 0, pre = 0;
  for (const m of ms) { n[Math.min(3, m.perdidos.length)]++; for (const p of m.perdidos) (p.por === 'lealtad' ? lea++ : pre++); }
  const meta = tipo === 'cuidadoso' || tipo === 'trabajador' ? 'pierde a alguien en menos de 1 de cada 10' : 'uno o dos de los tres';
  escribir(`| ${JUGADORES[tipo].nombre} | ${pct(n[0] / ms.length)} | ${pct(n[1] / ms.length)} | ${pct(n[2] / ms.length)} | ${pct(n[3] / ms.length)} | ${uno(prom(ms.map((m) => m.perdidos.length)))} | ${lea} / ${pre} | ${meta} |`);
}
escribir();

escribir('Quién se pierde (en cuántas partidas de cada 100):');
escribir();
escribir('| Jugador | ' + IDS.map((id) => BANDA.find((b) => b.id === id).corto).join(' | ') + ' |');
escribir('|---|' + IDS.map(() => '---').join('|') + '|');
for (const [tipo, ms] of Object.entries(porTipo)) {
  escribir('| ' + JUGADORES[tipo].nombre + ' | ' + IDS.map((id) => pct(ms.filter((m) => m.perdidos.some((p) => p.id === id)).length / ms.length)).join(' | ') + ' |');
}
escribir();

escribir('## 2. Cada cuánto alguien se niega a su puesto');
escribir();
escribir('| Jugador | Negativas por partida | Uno de cada … asaltos | Meta |');
escribir('|---|---|---|---|');
for (const [tipo, ms] of Object.entries(porTipo)) {
  const neg = prom(ms.map((m) => m.negativas));
  const meta = tipo === 'cuidadoso' || tipo === 'trabajador' ? '1 de cada 15' : 'seguido';
  escribir(`| ${JUGADORES[tipo].nombre} | ${uno(neg)} | ${neg ? uno(MUNDO.asaltos / neg) : 'nunca'} | ${meta} |`);
}
escribir();

escribir('## 3. Cómo anda de humor la banda (días en cada palabra)');
escribir();
escribir('| Jugador | Contento | Tranquilo | De malas | Furioso | Lo más que cambió el humor en un día | Lealtad al final (de los que quedan) |');
escribir('|---|---|---|---|---|---|---|');
for (const [tipo, ms] of Object.entries(porTipo)) {
  const t = { contento: 0, tranquilo: 0, deMalas: 0, furioso: 0 };
  for (const m of ms) for (const k in t) t[k] += m.palabras[k];
  const tot = Object.values(t).reduce((a, b) => a + b, 0);
  const max = Math.max(...ms.map((m) => m.maxCambioDia));
  escribir(`| ${JUGADORES[tipo].nombre} | ${pct(t.contento / tot)} | ${pct(t.tranquilo / tot)} | ${pct(t.deMalas / tot)} | ${pct(t.furioso / tot)} | ${uno(max)} (meta: 30 como mucho) | ${uno(prom(ms.flatMap((m) => m.lealtadFinal)))} de 10 |`);
}
escribir();

escribir('## 4. Las habilidades');
escribir();
escribir('Prueba de laboratorio: alguien practica una habilidad de cero, siempre con el mismo humor.');
escribir();
escribir('| Humor | Usos para aprenderla | Días de práctica para aprenderla | Días sin usarla hasta perderla (asaltos) | Usos para recuperarla | Meta |');
escribir('|---|---|---|---|---|---|');
for (const [nombre, h] of [['de malas (35)', 35], ['tranquilo (55)', 55], ['contento (75)', 75]]) {
  const r = usosParaRecuperar(h);
  escribir(`| ${nombre} | ${usosParaAprender(h)} | ${practicasParaAprender(h)} | ${r.sinUsar} (${uno(r.sinUsar / prom(MUNDO.diasEntre))}) | ${r.u} | aprender: 7 (contento 5, de malas 13); perderla: unos 20 días (tranquilo); recuperar: de malas 5, tranquilo 3, contento 2 |`);
}
escribir();
escribir('En las partidas (todas las clases de jugador juntas):');
escribir();
escribir('| | Veces por partida | Usos que tardó (promedio) |');
escribir('|---|---|---|');
const todas = Object.values(porTipo).flat();
escribir(`| Aprendió una habilidad nueva | ${uno(prom(todas.map((m) => m.aprender.length)))} | ${uno(prom(todas.flatMap((m) => m.aprender)))} |`);
escribir(`| Perdió una habilidad | ${uno(prom(todas.map((m) => m.perdidas.length)))} | — |`);
escribir(`| Recuperó una que había perdido | ${uno(prom(todas.map((m) => m.recuperar.length)))} | ${uno(prom(todas.flatMap((m) => m.recuperar)))} |`);
escribir(`| Días de práctica (de uno de la banda) | ${uno(prom(todas.map((m) => m.practicas)))} | — |`);
escribir();
escribir('Cuáles se pierden (en cuántas partidas de cada 100, alguna vez):');
escribir();
{
  const cuenta = {};
  for (const m of todas) for (const k of new Set(m.perdidas)) cuenta[k] = (cuenta[k] || 0) + 1;
  for (const [k, n] of Object.entries(cuenta).sort((a, b) => b[1] - a[1])) escribir(`- ${k}: ${pct(n / todas.length)}`);
}
escribir();
escribir('Por jugador: cuántos días de práctica mandó (sumando a todos), y en cuántas partidas Santiago perdió alguna vez su Buena puntería (la que casi nunca usa en un puesto):');
escribir();
escribir('| Jugador | Días de práctica en la partida (de unos 225 días de los tres) | Santiago pierde la puntería |');
escribir('|---|---|---|');
for (const [tipo, ms] of Object.entries(porTipo)) {
  escribir(`| ${JUGADORES[tipo].nombre} | ${uno(prom(ms.map((m) => m.practicas)))} | ${pct(ms.filter((m) => m.perdidas.includes('santiago:punteria')).length / ms.length)} |`);
}
escribir();
escribir('⭐ La estrellita (llega a ' + ANIMO.habilidad.estrella + ' y no se olvida más), por jugador: cuántas por partida y el día en que llegó la primera.');
escribir();
escribir('| Jugador | Estrellitas por partida | Partidas con alguna | Día de la primera (promedio, de unos 75) |');
escribir('|---|---|---|---|');
for (const [tipo, ms] of Object.entries(porTipo)) {
  const con = ms.filter((m) => m.estrellas.length);
  escribir(`| ${JUGADORES[tipo].nombre} | ${uno(prom(ms.map((m) => m.estrellas.length)))} | ${pct(con.length / ms.length)} | ${uno(prom(con.map((m) => Math.min(...m.estrellas.map((s) => s.dia)))))} |`);
}
escribir();
{
  const cuenta = {};
  for (const m of todas) for (const s of m.estrellas) cuenta[s.k] = (cuenta[s.k] || 0) + 1;
  escribir('Cuáles: ' + Object.entries(cuenta).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ' ' + pct(n / todas.length)).join(' · '));
}
escribir();

escribir('## 5. Las personalidades: cuándo se pone gris una marca');
escribir();
const vg = vecesParaGris(80);
escribir(`Prueba de laboratorio: una personalidad en 80 se pone gris después de **${vg.gris}** veces de contradecirla, y llega a casi blanca (el piso, ${MARCA.piso}) después de **${vg.blanca}**. Meta: "buena parte de la partida, con esfuerzo".`);
escribir();
escribir('| Jugador | Partidas en que alguna marca se puso gris | Asalto en que pasó (promedio) | Partidas en que alguna llegó a casi blanca |');
escribir('|---|---|---|---|');
for (const [tipo, ms] of Object.entries(porTipo)) {
  const con = ms.filter((m) => m.gris.length);
  escribir(`| ${JUGADORES[tipo].nombre} | ${pct(con.length / ms.length)} | ${uno(prom(con.map((m) => m.gris[0].dia)))} | ${pct(ms.filter((m) => m.blanca.length).length / ms.length)} |`);
}
escribir();

const texto = lineas.join('\n') + '\n';
writeFileSync(new URL('./resultados.md', import.meta.url), texto);
console.log(texto);
