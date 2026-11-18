/**
 * SIMULADOR DE LA BANDA NUEVA (BANDA-NUEVA.md, v3). Juega miles de partidas de 30 golpes con distintos jugadores y
 * mide lo que pasa: a quién se pierde y por qué, las traiciones (todas con señal), la lealtad, la plata, las peleas,
 * las negativas y el pronóstico de los papeles. Es una maqueta de las REGLAS, no del juego: el asalto se resume en
 * unas pocas tiradas (botín, heridos, presos).
 *
 * Correr: node simulador/banda2.js   → escribe simulador/resultados-banda2.md
 */
import { writeFileSync } from 'node:fs';

// ── TODOS LOS NÚMEROS (los de BANDA-NUEVA.md, más los del asalto resumido) ──
export const N = {
  golpes: 30,
  pasoLealtad: true,                 // con lealtad 5, +1 paso en su papel; con 1 o menos, −1
  regiones: [1, 9, 17, 25],          // en qué golpe empieza cada parte del viaje
  subeEn: [9, 17, 25],               // en qué golpes sube la tentación (al llegar a una parte nueva)
  lealtad: { max: 5, inicio: { tommy: 4, frank: 3, santiago: 3 } },
  tentacion: { inicio: { tommy: 0, frank: 1, santiago: 1 } },
  libreta: { max: 3, dura: 2, diferencia: 2, diferenciaFrio: 3 },
  reparto: { va: 0.12, ambicioso: 0.18, conformista: 0.06, queda: 0.05, generoso: 1.25 },
  olla: 10, botella: 15, medico: 100, fianza: 400, calmar: 15, pararPelea: 40,
  // Lo que pide J.Mc. por golpe (presión de plata) y el botín.
  // (J.Mc. más las compras del pueblo: armas, balas, caballos. Hipótesis para que la plata apriete.)
  jmc: 200, botin: { min: 200, max: 800 },
  // Los que chocan por cómo son: cada golpe, esta chance de que un par que se lleva bien pase a roces.
  choques: { 'santiago-tommy': 0.1, 'frank-santiago': 0.1 },
  // Escalera del pronóstico: pasos → [bien, flojo, mal].
  escalera: { 2: [90, 8, 2], 1: [80, 14, 6], 0: [70, 20, 10], '-1': [55, 25, 20], '-2': [40, 30, 30], '-3': [25, 30, 45] },
  // El asalto resumido.
  asalto: {
    pasajero: { bien: 1.15, flojo: 1.0, malHerido: 0.4, malPreso: 0.2 },
    sinPasajero: 0.75,               // 🔁 ronda 2: sin la banda el botín tiene que bajar de verdad (antes 0,9)
    caballos: { flojo: 0.9, mal: 0.55, malPresoPasajero: 0.3 },   // 🔁 antes 0,7
    herida: 2,                       // golpes que se pierde un herido
  },
  // Momentos: chance por golpe de que alguien pida algo, y lo que cuesta concederlo.
  pedido: { chance: 0.6, costo: 50 },
  // El precio de cortar una traición: 1ª plata, 2ª algo que duele, 3ª algo de la historia (plata grande y queja a otro), 4ª no se corta.
  cortar: [80, 80, 200], cortesMax: 3,   // 🔁 ronda 2: la segunda cuesta $80 y además le duele a otro
  // Tentación: tope 4 hasta la montaña, 5 en la montaña. Ofertas: cada tantos golpes alguien recibe una (+1).
  // 🔁 ronda 2 medida: con tope 5 en la montaña, el que cuida a la banda perdía a alguien en 1 de cada 4 partidas. Tope 4 siempre.
  tentacionMax: 4, tentacionMaxMontana: 4, ofertaCada: 4,
  // Cuando gana una marca de lealtad, se le pasa una de tentación (lo que lo ata a la banda le saca las ganas de irse).
  lealtadBajaTentacion: 1,
  salioBienHasta: 1,                 // "Salió bien" da favor sólo si el papel tenía estos pasos o menos
  // Las promesas de J.Mc. que se rompen solas: en qué golpe y a cuántos. Si mientes y se entera: +3 y queja doble.
  promesas: { 17: 1, 25: 2 }, promesaSube: 2, mentiraSeEntera: 0.5, mentiraSube: 3,
  // Desde el bosque, la señal muestra dos sospechosos. Vigilar cuesta esto y acierta siempre.
  sospechososDesde: 17, vigilar: 50,
  // La montaña: lealtad hasta 4, la olla más cara.
  // (🔁 La lealtad tope 4 en la montaña se probó y se sacó: con ella el que cuida perdía a dos en 6 de cada 10.)
  montana: 25, lealtadMaxMontana: 5, ollaMontana: 20,
  limites: { tommyCiviles: 4, santiagoCarta: 12, santiagoPide: 150, frankNombre: 20 },
  // (Los límites enfrentan a dos: la plata de Santiago sale de la parte de los otros; el tren de Frank lleva civiles y Tommy no quiere.)
};

// (Para probar variantes sin tocar el archivo: SIM='{"libreta":{"dura":1}}' node simulador/banda2.js)
function mezclar(a, b) { for (const [k, v] of Object.entries(b)) { if (v && typeof v === 'object' && !Array.isArray(v) && a[k]) mezclar(a[k], v); else a[k] = v; } }
if (process.env.SIM) mezclar(N, JSON.parse(process.env.SIM));

const IDS = ['tommy', 'frank', 'santiago'];
const RASGOS = {
  tommy: ['honorable', 'valiente', 'sentimental', 'riendas'],
  frank: ['alcoholico', 'confiable', 'divertido', 'baraja'],
  santiago: ['frio', 'egoista', 'serio', 'punteria', 'labia'],
};
const NO_QUIERE = { egoista: 'pasajero', cobarde: 'pasajero', pendenciero: 'caballos' };
const AYUDA = { caballos: 'riendas', pasajero: 'actor' };

// ── Azar con semilla ──
function rngDe(semilla) {
  let s = semilla >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ── LOS JUGADORES ──
const JUGADORES = {
  cuidadoso: { nombre: 'Cuida a la banda', reparto: 1, generoso: 0.25, concede: 0.75, fianza: 1, medico: 1, civiles: 0, calma: 0.8, corta: 0.9, echa: 0.05, botella: 0.5, abandona: 0, miente: 0.2, vigila: 0.7, trenFrank: 0.3 },
  tacano: { nombre: 'Tacaño', reparto: 0.5, tacanoHoy: 0.6, generoso: 0, concede: 0.25, fianza: 0.5, medico: 0, civiles: 0, calma: 0.2, corta: 0.4, echa: 0.2, botella: 0.1, abandona: 0, miente: 0.8, vigila: 0, trenFrank: 0.5 },
  violento: { nombre: 'Violento (mata civiles)', reparto: 1, generoso: 0.1, concede: 0.5, fianza: 0.8, medico: 0.5, civiles: 0.6, calma: 0.5, corta: 0.6, echa: 0.1, botella: 0.3, abandona: 0.2, miente: 0.5, vigila: 0.3, trenFrank: 1 },
  descuidado: { nombre: 'Descuidado', reparto: 'azar', generoso: 0, concede: 0.4, fianza: 0.3, medico: 0.2, civiles: 0.2, calma: 0.2, corta: 0.2, echa: 0.1, botella: 0.2, abandona: 0.6, miente: 0.5, vigila: 0, trenFrank: 0.5 },
  optimo: { nombre: 'El que busca la trampa', reparto: 1, generoso: 0, concede: 0.3, fianza: 1, medico: 0, civiles: 0, calma: 1, corta: 1, echa: 0, botella: 1, abandona: 0, miente: 1, vigila: 1, trenFrank: 0, explota: true },
};

const tiene = (m, r) => m.rasgos.includes(r) && !m.aplacadas?.includes(r);

function nuevoMiembro(id) {
  return {
    id, rasgos: RASGOS[id].slice(), lealtad: N.lealtad.inicio[id], tentacion: N.tentacion.inicio[id],
    quejas: [], favores: [], herido: 0, preso: false, fuera: null, sinActividad: 0, cortes: 0, senal: false,
    civiles: 0, botellasQuitadas: 0,
  };
}

function anotar(m, lado, motivo, golpe, chica = false, veces = 1) {
  if (m.fuera) return;
  const lista = lado === 'q' ? m.quejas : m.favores;
  for (let i = 0; i < Math.min(2, veces); i++) {
    lista.push({ motivo, golpe, chica });
    if (lista.length > N.libreta.max) lista.shift();
  }
}

function animo(m) {
  const q = m.quejas.length, f = m.favores.length;
  if (q >= 3 && f === 0) return 'furioso';
  if (q > f) return 'deMalas';
  if (f > q) return 'conGanas';
  return 'tranquilo';
}

function pasos(m, papel, plan, ctx) {
  let p = 0;
  if (tiene(m, AYUDA[papel])) p++;
  const a = animo(m);
  if (a === 'conGanas') p++;
  if (a === 'deMalas' || (a === 'furioso' && tiene(m, 'confiable'))) p--;
  if (m.resaca) p--;
  if (N.pasoLealtad && m.lealtad >= 5) p++;
  if (N.pasoLealtad && m.lealtad <= 1) p--;
  for (const otro of Object.values(plan)) if (otro && otro !== m && ctx.rel[par(m.id, otro.id)] === 'enemigos') p--;
  return Math.max(-3, Math.min(2, p));
}

function resultado(rng, p, stats) {
  stats.pasos[p] = (stats.pasos[p] || 0) + 1;
  const [b, f] = N.escalera[p];
  const r = rng() * 100;
  return r < b ? 'bien' : r < b + f ? 'flojo' : 'mal';
}

function seNiega(m, papel) {
  const a = animo(m);
  if (tiene(m, 'rastrero')) return false;
  if (a === 'furioso') return !tiene(m, 'confiable');
  if (a === 'deMalas') return m.rasgos.some((r) => NO_QUIERE[r] === papel);
  return false;
}

const par = (a, b) => [a, b].sort().join('-');

function partida(J, semilla) {
  const rng = rngDe(semilla);
  const banda = Object.fromEntries(IDS.map((id) => [id, nuevoMiembro(id)]));
  const ctx = { rel: { 'frank-santiago': 'roces', 'frank-tommy': 'bien', 'santiago-tommy': 'bien' } };
  const s = {
    perdidos: [], traiciones: 0, conSenal: 0, cortadas: 0, senales: 0, negativas: 0, peleas: 0, peleasGraves: 0,
    plata: 300, lealtadPorGolpe: [], enCinco: 0, pasos: {}, golpesConQuejas: 0, favores: 0, quejas: 0, vendido: false,
    deuda: 0, plataMin: 300, acusoMal: 0, mentiras: [], salioBien: 0, roles: 0,
  };
  const tope = (g) => (g >= N.montana ? N.tentacionMaxMontana : N.tentacionMax);
  const tentar = (m, n, g) => { m.tentacion = Math.min(tope(g), m.tentacion + n); };
  const activos = () => IDS.map((id) => banda[id]).filter((m) => !m.fuera);
  const disponibles = () => activos().filter((m) => !m.herido && !m.preso && !m.ausente);
  const perder = (m, como, golpe) => { m.fuera = como; s.perdidos.push({ id: m.id, como, golpe }); };

  for (let g = 1; g <= N.golpes; g++) {
    // Parte nueva del viaje: +1 de tentación (menos al Honorable).
    if (N.subeEn.includes(g)) for (const m of activos()) if (!tiene(m, 'honorable')) tentar(m, 1, g);
    // La montaña: nadie pasa de 4 de lealtad.
    if (g === N.montana) for (const m of activos()) m.lealtad = Math.min(N.lealtadMaxMontana, m.lealtad);
    // Una oferta (de otra banda, de la ley, de una mujer…) a uno que no sea Honorable.
    if (g % N.ofertaCada === 0) { const c = activos().filter((m) => !tiene(m, 'honorable') && !m.preso); if (c.length) tentar(c[Math.floor(rng() * c.length)], 1, g); }
    // Las promesas de J.Mc. que se rompen solas.
    if (N.promesas[g]) {
      const c = activos().filter((m) => !m.preso).sort(() => rng() - 0.5).slice(0, N.promesas[g]);
      for (const m of c) {
        if (rng() < J.miente) s.mentiras.push({ m, golpe: g });
        else tentar(m, N.promesaSube, g);
      }
    }
    // Las mentiras: se entera (o no) en los 3 golpes siguientes.
    for (const x of s.mentiras.slice()) {
      if (g > x.golpe && g <= x.golpe + 3 && rng() < N.mentiraSeEntera / 3) {
        tentar(x.m, N.mentiraSube, g); anotar(x.m, 'q', 'Me mentiste', g, false, 2); s.mentiras.splice(s.mentiras.indexOf(x), 1);
      } else if (g > x.golpe + 3) s.mentiras.splice(s.mentiras.indexOf(x), 1);
    }

    // ── LAS SEÑALES PENDIENTES: se resuelven antes de salir, o pasa la traición ──
    for (const m of activos()) {
      if (!m.senal) continue;
      const corta = rng() < J.corta && m.cortes < N.cortesMax;
      const precio = N.cortar[m.cortes] || 0;
      // Desde el bosque no sabes quién es: dos sospechosos. Vigilar acierta; si no, adivinas.
      let acierta = true;
      const otros = activos().filter((o) => o !== m && !o.preso);
      if (corta && g >= N.sospechososDesde && otros.length) {
        if (rng() < J.vigila && s.plata >= N.vigilar + precio) s.plata -= N.vigilar;
        else if (rng() < 0.5) {
          acierta = false; s.acusoMal++;
          const inocente = otros[Math.floor(rng() * otros.length)];
          anotar(inocente, 'q', 'Me acusaste', g, false, 2); tentar(inocente, 1, g);
        }
      }
      if (corta && acierta && s.plata >= precio) {
        s.plata -= precio; m.cortes++; m.tentacion = Math.max(0, m.tentacion - 1); m.senal = false; s.cortadas++;
        if (m.cortes >= 2) { const o = banda[otroDe(m.id, banda)]; if (o && o !== m) anotar(o, 'q', 'Lo que pidió dolió', g); } // desde la segunda, le duele a otro
        continue;
      }
      if (rng() < J.echa) {
        perder(m, 'echado', g); m.senal = false;
        // Los amigos del echado se quejan.
        for (const o of activos()) if (ctx.rel[par(o.id, m.id)] === 'bien') anotar(o, 'q', 'Echaste a mi amigo', g);
        continue;
      }
      // Pasa la traición.
      s.traiciones++; s.conSenal++;
      if (tiene(m, 'egoista')) { s.plata = Math.round(s.plata * 0.75); perder(m, 'seFueConPlata', g); }
      else if (tiene(m, 'rastrero') || tiene(m, 'mentiroso')) { s.vendido = true; perder(m, 'vendioElPlan', g); }
      else perder(m, 'seFue', g);
      m.senal = false;
    }

    // ── EL LÍMITE DE CADA UNO ──
    if (g === N.limites.santiagoCarta && !banda.santiago.fuera) {
      if (rng() < J.concede && s.plata >= N.limites.santiagoPide) {
        s.plata -= N.limites.santiagoPide; banda.santiago.ausente = 2; anotar(banda.santiago, 'f', 'La carta', g);
        // Sale de la parte de los otros: se quejan.
        for (const o of activos()) if (o !== banda.santiago) anotar(o, 'q', 'La plata de Santiago', g);
      }
      else banda.santiago.tentacion = Math.min(5, banda.santiago.tentacion + 2);
    }
    // (Frank se va a buscarlo: se pierde un golpe, y vuelve si su lealtad es 3 o más.)
    if (g === N.limites.frankNombre && !banda.frank.fuera) {
      if (rng() < J.trenFrank) {
        // Asaltas ese tren con Frank: hay civiles. Frank contento; Tommy no quería.
        anotar(banda.frank, 'f', 'Su tren', g, false, 2);
        if (!banda.tommy.fuera) { anotar(banda.tommy, 'q', 'El tren de Frank', g, false, 2); banda.tommy.civiles++; }
        s.trenFrankHoy = true;
      } else { banda.frank.ausente = 1; if (banda.frank.lealtad < 3) perder(banda.frank, 'limite', g); }
    }

    // ── EL PLAN ──
    const plan = { caballos: null, pasajero: null };
    const libres = disponibles().slice().sort(() => rng() - 0.5);
    // (El que busca la trampa pone a cada uno donde rinde más; los demás, en el orden que salga.)
    if (J.explota) libres.sort((a, b) => pasos(b, 'caballos', {}, ctx) - pasos(a, 'caballos', {}, ctx));
    for (const papel of ['caballos', 'pasajero']) {
      for (const m of libres) {
        if (Object.values(plan).includes(m)) continue;
        if (seNiega(m, papel)) { s.negativas++; continue; }
        plan[papel] = m; break;
      }
    }

    // ── EL ASALTO, RESUMIDO ──
    let botin = N.botin.min + rng() * (N.botin.max - N.botin.min);
    const res = {};
    const pasosDe = {};
    for (const papel of ['caballos', 'pasajero']) if (plan[papel]) { pasosDe[papel] = pasos(plan[papel], papel, plan, ctx); res[papel] = resultado(rng, pasosDe[papel], s); s.roles++; }
    // (Un papel difícil —0 pasos o menos— que salió bien deja un favor: "Salió bien". 🔁 ronda 2: antes cualquiera.)
    const salioBien = Object.entries(plan).filter(([p, m]) => m && res[p] === 'bien' && pasosDe[p] <= N.salioBienHasta).map(([, m]) => m);
    if (s.vendido) { botin *= 0.5; s.vendido = false; }
    if (!plan.pasajero) botin *= N.asalto.sinPasajero;
    else if (res.pasajero === 'bien') botin *= N.asalto.pasajero.bien;
    if (!plan.caballos || res.caballos === 'mal') botin *= N.asalto.caballos.mal;
    else if (res.caballos === 'flojo') botin *= N.asalto.caballos.flojo;
    botin = Math.round(botin);
    const civiles = rng() < J.civiles || s.trenFrankHoy; s.trenFrankHoy = false;
    const pas = plan.pasajero;
    if (pas) {
      const r = rng();
      const malCaballo = (!plan.caballos || res.caballos === 'mal') && rng() < N.asalto.caballos.malPresoPasajero;
      const abandona = rng() < J.abandona;
      if ((res.pasajero === 'mal' && r < N.asalto.pasajero.malPreso) || malCaballo || abandona) pas.preso = true;
      else if (res.pasajero === 'mal' && r < N.asalto.pasajero.malPreso + N.asalto.pasajero.malHerido) pas.herido = N.asalto.herida;
    }
    for (const m of activos()) { m.resaca = false; }

    // ── LA NOCHE DEL GOLPE ──
    s.plata += botin;
    // Primero se paga lo que se le debe a J.Mc.
    if (s.deuda) { const p = Math.min(s.deuda, s.plata); s.plata -= p; s.deuda -= p; }
    // Lo que pasó en el asalto.
    for (const m of salioBien) if (!m.preso && !m.herido) { anotar(m, 'f', 'Salió bien', g); s.salioBien++; }
    for (const m of Object.values(plan)) {
      if (!m) continue;
      if (m.preso) {
        anotar(m, 'q', 'Me dejaste preso', g, false, 2);
        if (rng() < J.fianza && s.plata >= N.fianza) { s.plata -= N.fianza; m.preso = false; anotar(m, 'f', 'Pagaste la fianza', g); }
      } else if (m.herido) {
        if (!tiene(m, 'frio')) anotar(m, 'q', 'Me hirieron', g, true, tiene(m, 'sentimental') ? 2 : 1);
        if (rng() < J.medico && s.plata >= N.medico) { s.plata -= N.medico; m.herido = Math.max(0, m.herido - 1); anotar(m, 'f', 'El médico', g); }
      }
    }
    if (civiles) for (const m of activos()) {
      if (tiene(m, 'honorable')) { anotar(m, 'q', 'Civiles', g); m.civiles++; }
      else if (tiene(m, 'sentimental')) anotar(m, 'q', 'Civiles', g);
    }
    // El límite de Tommy.
    if (!banda.tommy.fuera && banda.tommy.civiles >= N.limites.tommyCiviles) perder(banda.tommy, 'seEntrego', g);

    // El reparto.
    const fueron = new Set(Object.values(plan).filter(Boolean));
    const dado = {};
    const generosoHoy = rng() < J.generoso;
    const tacanoDeHoy = J.tacanoHoy != null && rng() < J.tacanoHoy;
    for (const m of activos()) {
      if (m.preso) continue;
      const pct = !fueron.has(m) ? N.reparto.queda : tiene(m, 'ambicioso') ? N.reparto.ambicioso : tiene(m, 'conformista') ? N.reparto.conformista : N.reparto.va;
      const espera = botin * pct;
      let da;
      if (J.reparto === 'azar') da = espera * [0, 0.5, 1, 1.3][Math.floor(rng() * 4)];
      else if (J.tacanoHoy != null) da = espera * (tacanoDeHoy ? J.reparto : 1);
      else da = espera * J.reparto * (generosoHoy ? N.reparto.generoso : 1);
      da = Math.min(da, Math.max(0, s.plata));
      s.plata -= da;
      dado[m.id] = da / Math.max(1, espera);
      if (da <= 0.01 && fueron.has(m)) anotar(m, 'q', 'Nada', g, false, 2);
      else if (da < espera - 0.5) anotar(m, 'q', 'Me diste poco', g);
      else if (da >= espera * N.reparto.generoso - 0.5) anotar(m, 'f', 'Generoso', g, false, tiene(m, 'sentimental') ? 2 : 1);
    }
    // Más a uno que a otro en el mismo golpe: roces.
    const ids = Object.keys(dado);
    for (let i = 0; i < ids.length; i++) for (let k = i + 1; k < ids.length; k++) {
      if (Math.abs(dado[ids[i]] - dado[ids[k]]) >= 0.25) empeorar(ctx, par(ids[i], ids[k]));
    }
    // La olla y J.Mc.
    const olla = activos().length * (g >= N.montana ? N.ollaMontana : N.olla);
    if (s.plata >= olla) s.plata -= olla; else for (const m of activos()) anotar(m, 'q', 'No hay comida', g);
    // J.Mc. cobra lo que hay; lo que falta queda anotado como deuda (visible).
    { const p = Math.min(N.jmc, s.plata); s.plata -= p; s.deuda += N.jmc - p; }

    // Pedidos (un momento).
    if (rng() < N.pedido.chance) {
      const quien = activos()[Math.floor(rng() * activos().length)];
      if (quien) {
        const conc = J.explota ? N.pedido.costo <= 50 && rng() < 0.5 : rng() < J.concede;
        if (conc && s.plata >= N.pedido.costo) { s.plata -= N.pedido.costo; anotar(quien, 'f', 'Pedido', g, false, tiene(quien, 'sentimental') ? 2 : 1); }
        else anotar(quien, 'q', 'Pedido', g);
      }
    }
    // El Egoísta con un botín grande pide su parte (ya cubierto por el reparto si se la diste).

    // Borrar quejas chicas: botella (Alcohólico) y fogata (Divertido), una vez por golpe.
    for (const m of activos()) {
      m.sinActividad++;
      if (tiene(m, 'alcoholico') && rng() < J.botella && s.plata >= N.botella) {
        s.plata -= N.botella; m.sinActividad = 0; m.resaca = true;
        const i = m.quejas.findIndex((q) => q.chica); if (i >= 0) m.quejas.splice(i, 1);
      }
      if (tiene(m, 'divertido')) {
        const otro = activos().find((o) => o !== m && !tiene(o, 'serio') && o.quejas.some((q) => q.chica));
        if (otro) { otro.quejas.splice(otro.quejas.findIndex((q) => q.chica), 1); }
        if (m.sinActividad >= 2) anotar(m, 'q', 'Me aburro', g, true);   // 🔁 ronda 2: a los 2 golpes, como dice el documento
      }
    }

    // Los que chocan por cómo son (Honorable con Egoísta, Alcohólico con Serio).
    for (const [p, ch] of Object.entries(N.choques)) if (ctx.rel[p] === 'bien' && rng() < ch) ctx.rel[p] = 'roces';
    // La fogata: el par que peor se lleva.
    const pares = Object.entries(ctx.rel).filter(([p]) => p.split('-').every((id) => !banda[id].fuera));
    const peor = pares.find(([, e]) => e === 'enemigos') || pares.find(([, e]) => e === 'roces');
    if (peor) {
      const [p, e] = peor, [a, b] = p.split('-').map((id) => banda[id]);
      const hayLabia = activos().some((m) => m !== a && m !== b && tiene(m, 'labia'));
      if (e === 'roces') {
        s.peleas++;
        if (rng() < J.calma && (hayLabia || s.plata >= N.calmar)) { if (!hayLabia) s.plata -= N.calmar; ctx.rel[p] = 'bien'; }
        else if (rng() < 0.5) { const [gana, pierde] = rng() < 0.5 ? [a, b] : [b, a]; anotar(gana, 'f', 'Razón', g); anotar(pierde, 'q', 'Razón al otro', g); }
        else ctx.rel[p] = 'enemigos';
      } else {
        s.peleasGraves++;
        if (rng() < J.calma && (hayLabia || s.plata >= N.pararPelea)) { if (!hayLabia) s.plata -= N.pararPelea; ctx.rel[p] = 'roces'; }
        else { const herido = a.lealtad <= b.lealtad ? a : b; herido.herido = Math.max(herido.herido, 1); anotar(herido, 'q', 'La pelea', g, true); }
      }
    }

    // El ajuste: la libreta mueve la lealtad (una marca como mucho) y se limpia.
    for (const m of activos()) {
      if (m.preso) continue;
      const d = m.favores.length - m.quejas.length, umbral = tiene(m, 'frio') ? N.libreta.diferenciaFrio : N.libreta.diferencia;
      if (d >= umbral && m.lealtad < (g >= N.montana ? N.lealtadMaxMontana : N.lealtad.max)) { m.lealtad++; m.tentacion = Math.max(0, m.tentacion - N.lealtadBajaTentacion); m.quejas = []; m.favores = []; }
      // Con la lealtad ya arriba del todo, una diferencia a favor también le saca una de tentación.
      else if (d >= umbral && m.tentacion > 0) { m.tentacion--; m.quejas = []; m.favores = []; }
      else if (-d >= umbral && m.lealtad > 0) { m.lealtad--; m.quejas = []; m.favores = []; }
      // Lo que vence.
      m.quejas = m.quejas.filter((q) => g - q.golpe < N.libreta.dura);
      m.favores = m.favores.filter((f) => g - f.golpe < N.libreta.dura);
      // La señal.
      if (m.tentacion >= m.lealtad && !m.senal) { m.senal = true; s.senales++; }
    }

    // Heridas y ausencias.
    for (const m of activos()) { if (m.herido) m.herido--; if (m.ausente) m.ausente--; }
    // Los presos sin fianza: el cuidadoso la paga después si junta.
    for (const m of activos()) if (m.preso && rng() < J.fianza && s.plata >= N.fianza) { s.plata -= N.fianza; m.preso = false; anotar(m, 'f', 'Pagaste la fianza', g); }

    s.plataMin = Math.min(s.plataMin, s.plata);
    const act = activos().filter((m) => !m.preso);
    s.lealtadPorGolpe.push(act.length ? act.reduce((t, m) => t + m.lealtad, 0) / act.length : 0);
    s.enCinco += act.filter((m) => m.lealtad === 5).length;
  }
  // Los presos al final cuentan como perdidos.
  for (const m of IDS.map((id) => banda[id])) if (!m.fuera && m.preso) s.perdidos.push({ id: m.id, como: 'preso', golpe: N.golpes });
  return s;
}

function otroDe(id, banda) { return IDS.find((x) => x !== id && !banda[x].fuera); }
function empeorar(ctx, p) { if (!ctx.rel[p]) return; ctx.rel[p] = ctx.rel[p] === 'bien' ? 'roces' : 'enemigos'; }

// ── CORRER Y CONTAR ──
const PARTIDAS = Number(process.env.PARTIDAS) || 4000;
const filas = [];
const pct = (n, t) => `${Math.round((100 * n) / t)}%`;
for (const [clave, J] of Object.entries(JUGADORES)) {
  const r = { pierde: [0, 0, 0, 0], como: {}, quien: { tommy: 0, frank: 0, santiago: 0 }, traiciones: 0, senales: 0, cortadas: 0, negativas: 0, peleas: 0, graves: 0, plata: 0, lealtad: Array(N.golpes).fill(0), enCinco: 0, pasos: {}, golpeTraicion: 0, conSenal: 0, acusoMal: 0, plataMin: Infinity, deuda: 0, salioBien: 0, roles: 0 };
  for (let i = 0; i < PARTIDAS; i++) {
    const s = partida(J, i * 7919 + clave.length);
    const perdidos = s.perdidos.length;
    r.pierde[Math.min(3, perdidos)]++;
    for (const p of s.perdidos) { r.como[p.como] = (r.como[p.como] || 0) + 1; r.quien[p.id]++; }
    r.traiciones += s.traiciones; r.senales += s.senales; r.cortadas += s.cortadas; r.negativas += s.negativas;
    r.peleas += s.peleas; r.graves += s.peleasGraves; r.plata += s.plata; r.enCinco += s.enCinco;
    if (s.senales) r.conSenal++; r.acusoMal += s.acusoMal; r.plataMin = Math.min(r.plataMin, s.plataMin); r.deuda += s.deuda;
    r.salioBien += s.salioBien; r.roles += s.roles;
    s.lealtadPorGolpe.forEach((v, k) => { r.lealtad[k] += v; });
    for (const [k, v] of Object.entries(s.pasos)) r.pasos[k] = (r.pasos[k] || 0) + v;
  }
  filas.push({ clave, J, r });
}

let t = `# Resultados del simulador de la banda nueva (BANDA-NUEVA.md, v3)\n\n${PARTIDAS} partidas de ${N.golpes} golpes por jugador. Es una maqueta de las reglas: el asalto se resume en tiradas.\n\n`;
t += '## 1. A cuántos pierde\n\n| Jugador | Nadie | 1 | 2 | 3 | Traiciones por partida | Señales | Cortadas | Plata al final |\n|---|---|---|---|---|---|---|---|---|\n';
for (const { J, r } of filas) t += `| ${J.nombre} | ${pct(r.pierde[0], PARTIDAS)} | ${pct(r.pierde[1], PARTIDAS)} | ${pct(r.pierde[2], PARTIDAS)} | ${pct(r.pierde[3], PARTIDAS)} | ${(r.traiciones / PARTIDAS).toFixed(2)} | ${(r.senales / PARTIDAS).toFixed(2)} | ${(r.cortadas / PARTIDAS).toFixed(2)} | $${Math.round(r.plata / PARTIDAS)} |\n`;
t += '\n## 2. Cómo se pierden (por cada 100 partidas)\n\n| Jugador | Se fue | Se fue con plata | Vendió el plan | Echado | Su límite | Se entregó (Tommy) | Preso al final |\n|---|---|---|---|---|---|---|---|\n';
for (const { J, r } of filas) { const c = (k) => Math.round((100 * (r.como[k] || 0)) / PARTIDAS); t += `| ${J.nombre} | ${c('seFue')} | ${c('seFueConPlata')} | ${c('vendioElPlan')} | ${c('echado')} | ${c('limite')} | ${c('seEntrego')} | ${c('preso')} |\n`; }
t += '\n## 3. Quién se pierde (por cada 100 partidas)\n\n| Jugador | Tommy | Frank | Santiago |\n|---|---|---|---|\n';
for (const { J, r } of filas) t += `| ${J.nombre} | ${Math.round((100 * r.quien.tommy) / PARTIDAS)} | ${Math.round((100 * r.quien.frank) / PARTIDAS)} | ${Math.round((100 * r.quien.santiago) / PARTIDAS)} |\n`;
t += '\n## 4. La lealtad promedio (de los que quedan), por golpe\n\n| Jugador | Golpe 1 | 5 | 10 | 15 | 20 | 25 | 30 | Golpes-persona en 5 |\n|---|---|---|---|---|---|---|---|---|\n';
for (const { J, r } of filas) { const L = (k) => (r.lealtad[k - 1] / PARTIDAS).toFixed(1); t += `| ${J.nombre} | ${L(1)} | ${L(5)} | ${L(10)} | ${L(15)} | ${L(20)} | ${L(25)} | ${L(30)} | ${(r.enCinco / PARTIDAS).toFixed(1)} |\n`; }
t += '\n## 5. Negativas y peleas (por partida)\n\n| Jugador | Negativas | Discusiones (roces) | Peleas (enemigos) |\n|---|---|---|---|\n';
for (const { J, r } of filas) t += `| ${J.nombre} | ${(r.negativas / PARTIDAS).toFixed(1)} | ${(r.peleas / PARTIDAS).toFixed(1)} | ${(r.graves / PARTIDAS).toFixed(1)} |\n`;
t += '\n## 6. El pronóstico: en cuántos papeles cayó cada escalón\n\n| Jugador | −3 | −2 | −1 | 0 | +1 | +2 |\n|---|---|---|---|---|---|---|\n';
for (const { J, r } of filas) { const tot = Object.values(r.pasos).reduce((a, b) => a + b, 0); t += `| ${J.nombre} | ${['-3', '-2', '-1', '0', '1', '2'].map((k) => pct(r.pasos[k] || 0, tot)).join(' | ')} |\n`; }
t += '\n## 7. Lo nuevo de la ronda 2\n\n| Jugador | Partidas con alguna señal | Acusó mal (por partida) | "Salió bien" por papel | Plata más baja vista | Deuda al final |\n|---|---|---|---|---|---|\n';
for (const { J, r } of filas) t += `| ${J.nombre} | ${pct(r.conSenal, PARTIDAS)} | ${(r.acusoMal / PARTIDAS).toFixed(2)} | ${pct(r.salioBien, r.roles)} | $${Math.round(r.plataMin)} | $${Math.round(r.deuda / PARTIDAS)} |\n`;
writeFileSync(new URL('./resultados-banda2.md', import.meta.url), t);
console.log(t);
