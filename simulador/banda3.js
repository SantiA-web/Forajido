/**
 * SIMULADOR DE LA BANDA, v4 (BANDA-NUEVA.md). A diferencia de banda2.js, juega por DÍAS y con TODO lo que la banda
 * hace: las tareas del día (mirar un tren, bajar al pueblo, practicar, cazar, cartas, curar, cocinar, vender), los
 * cuatro papeles del golpe (caballos, pasajero, telégrafo, vigía), la huida, el perista, las habilidades con marcas que
 * se aprenden y se oxidan, las personalidades en escalones, y la cantina (contratados).
 * *(Santi, 2026-11-17: "todo debe servir para algo")*: por eso también mide CUÁNTO SIRVE cada cosa (la plata que se
 * pierde si se apaga).
 *
 * Es una maqueta de las REGLAS: el asalto se resume en tiradas.
 * Correr: node simulador/banda3.js   (PARTIDAS=1000 para ir rápido; SIM='{"…"}' para variar números)
 */
import { writeFileSync } from 'node:fs';

// ── TODOS LOS NÚMEROS ──
export const N = {
  golpes: 30,
  diasEntreGolpes: [2, 3],
  regiones: { pradera: 9, bosque: 17, montana: 25 },
  lealtad: { max: 5, inicio: { tommy: 4, frank: 3, santiago: 3 } },
  tentacion: { inicio: { tommy: 0, frank: 1, santiago: 1 }, max: 4, maxMontana: 5 },   // en la montana puede alcanzar a un leal de 5: el final aprieta
  libreta: { max: 3, dias: 5, diferencia: 2, diferenciaFrio: 3 },
  salioBienHasta: 2,                  // 🔁 con 1, practicar te sacaba lealtad (con habilidad salia +2 y no habia favor)
  salioBienEn2: 0.5,                  // 🔁 v5: con +2 el favor sale 1 de cada 2 (si no, "con ganas → sale bien → favor" se alimentaba solo)
  motivoUnico: false,                 // variante: "un motivo no se repite en la libreta"
  reparto: { va: 0.12, ambicioso: 0.18, queda: 0.05, generoso: 1.25,
    // 🔁 v4: "la banda se lleva un tercio": una bolsa fija que se reparte en partes (el que fue, entera; el que se
    // quedó, media; el Ambicioso, una y media). Así perder a uno no te ahorra nada. (null = porcentaje por cabeza.)
    // 🔁 v11 (Santi, 2026-11-18): por cabeza otra vez (null). Con el error del contratado arreglado, el que cuida gana
    // igual a todos; el tercio (1 / 3) queda como variante.
    bolsa: null, parteQueda: 0.5, parteAmbicioso: 1.5 },
  // 🔁 v5: la olla por día ($5 por persona; cazar cubre ese día). Calmar y parar, más caros (siempre convenían).
  ollaDia: 5, ollaDiaMontana: 8, botella: 15, medico: 60 /* 🔁 v9: a $100 casi no valía (−2 puntos por $131) */, fianza: 400, calmar: 40, pararPelea: 80, jmc: 200,
  // 🔁 v6: más dura (con la de antes, el que cuida tenía casi todo bien y la partida era plana).
  escalera: { 2: [88, 9, 3], 1: [78, 15, 7], 0: [67, 21, 12], '-1': [52, 26, 22], '-2': [37, 30, 33], '-3': [22, 30, 48] },
  // El tren: el botín sale entre min y max; una parte son objetos que hay que vender.
  botin: { min: 200, max: 800, objetos: 0.3, pasajeros: 0.6, ultimoGolpe: 2 },
  // 🔁 Los trenes: el horario de pasajeros lo sabes siempre; los de carga llegan por rumores (pagan más, pero 1 de
  // cada 4 es falso: si vas sin mirarlo, esperas en la vía y no pasa nada). Mirar un tren dice si es cierto y qué trae.
  info: { carga: [300, 1000], falso: 0.25, buenaVistaCaja: 1.1, vaSinMirar: 0.5 },
  // Los papeles: multiplicador del botín por resultado (y sin nadie).
  papeles: {
    caballos: { bien: 1, flojo: 0.9, mal: 0.55, nadie: 0.55, presoPasajero: 0.3 },
    pasajero: { bien: 1.15, flojo: 1, mal: 1, nadie: 0.75, malPreso: 0.2, malHerido: 0.4 },
    // (Los papeles nuevos, vacíos, dejan todo como hoy: son algo que se suma, no un castigo por no tenerlos.)
    vigia: { bien: 1.25, flojo: 1.1, mal: 1, nadie: 1 },
    telegrafo: { bien: -2, flojo: -1, mal: 0, nadie: 0 },   // jinetes de la ley de menos en la huida
  },
  rolesFuturos: true,                  // telégrafo y vigía (si es false, sólo caballos y pasajero, como hoy)
  // La huida: cada jinete que te alcanza te hace perder un poco de lo robado (bolsas que se caen) y puede herir.
  // Con dos o más de la banda a caballo, le tiran a la ley: un jinete menos.
  // 🔁 v6: la ley sale con 4 (con 3 y al menos uno siempre, el telégrafo no valía casi nada).
  huida: { jinetes: 4, heridaPorJinete: 0.04, botinPorJinete: 0.05, bandaTira: 2, herida: 6 /* días, como la brújula */, llegaTarde: 0.5 },
  cocinero: 1.05,                      // James con un tiro más: un poco más de botín
  perista: { comun: 0.6, negociante: 0.8 },
  cartas: { gana: 30, conBaraja: 2 / 3, sinBaraja: 1 / 3, pelea: 1 / 6, recompensaPelea: 30 },   // una noche por golpe
  rumorPueblo: { base: 0.2 /* 🔁 v8: como tarea, con 5 sólo convenía mandar a Santiago */, labia: 0.2, baraja: 0.1, alcoholico: 0.1, curioso: 0.25 },
  cazarSin: 0.5,
  curar: 3, medicoDias: 3,
  recompensa: { porGolpe: 50, civiles: 100, pendenciero: 30, botinPor1000: 0.08, tope: 0.3 },
  // 🔁 v5: la tiene al llegar a 5 marcas y la pierde recién al bajar de 3 (antes, con una sola marca oxidada).
  habilidad: { marcas: 5, pierdeDebajo: 3, usoGolpe: 1, practica: 0.5, conGanas: 0.5, oxidaCada: 6, recuperar: 2 },
  escalon: [1, 0.5, 0.2],             // fuerte, gris, casi blanca: chance de que su regla corra
  bajarCada: 4,
  pedido: { chance: 0.5, costo: 50 },
  pasoLealtad5: false,                // 🔁 v5: sin el +1 por lealtad 5 (con él, 67% de los papeles en +2: casi todo salía bien)
  ofertaCada: 4, ofertaCadaMontana: 3,   // 🔁 v5: en la montaña, una oferta por golpe (sólo a la banda de la historia)
  ofertaLey: 600,                     // con la recompensa de 600 o más, llega la oferta de la ley (+1 a uno)
  promesas: { bosque: 1, montana: 2 }, promesaSube: 2, mentiraSeEntera: 1 / 4 /* 🔁 v10: con 1 de 3, mentir nunca ganaba nada */, mentiraSube: 4,
  sospechososDesde: 17, vigilar: 50,
  // 🔁 v5: el precio de cortar crece con tu plata (si no, $80 contra $2600 se pagaba siempre sin pensar).
  cortar: [80, 80, 200], cortarParte: [0.1, 0.15, 0.25], cortesMax: 2,   // 🔁 v6: la 3ª señal no se corta con plata (el que corta todo nunca sentía el final)
  // 🔁 v7: 1 de cada 20 (con 1 de 10 había una discusión cada 2 o 3 golpes: rutina, no un momento).
  choques: { 'santiago-tommy': 0.05, 'frank-santiago': 0.05, 'frank-tommy': 0.05 },
  limites: { tommyCiviles: 4, santiagoPide: 150, santiagoDias: 6, frankVuelve: 4 },
  // 🔁 v6: el contratado cobra una parte del tercio, como uno más (media si es a sueldo y se quedó). Con sueldo fijo
  // ($30), el tacaño cambiaba la banda por contratados y ganaba más que el que la cuida.
  // 🔁 v6b: y no sale del tercio sino de tu bolsa: un noveno del botín (la parte de uno con la banda entera). Si salía
  // del tercio, contratar era gratis para ti y siempre convenía.
  contratado: { parte: true, noveno: true, divisor: 6 /* media parte: un dieciochoavo del botín */, sueldo: 30, adelanto: 40, porTrabajo: 55, lealtad: 3, max: 4, labia: 0.8,
    // 🔁 v11 (Santi, 2026-11-18: "los contratados deberían cobrar un sueldo chico por semana más lo que ya estaba puesto";
    // "la banda, tercio o no, sí debería ser casi que indispensable si querés llevarte buen dinero"). 0 = apagado.
    semanal: 20,       // pesos por semana (7 días) a cada contratado que sigue con vos, además de su parte
    pasosMenos: 1,     // pasos de menos en cualquier papel: no conocen tu forma de trabajar ni a la banda
    quedaCobra: false, // por cabeza: el contratado que se quedó cobra la parte del que se queda (false: sólo el sueldo de la semana)
  },
  ofertaContratados: true,
  // 🔁 v8 (ronda 7)
  acostumbra: 2,                      // dos generosos seguidos: el tercero ya no es favor, y darle lo normal es queja
  serioNoSeAlegra: false, serioSinPedido: false, serioSinGanas: false,   // (sin favor por generoso era demasiado: 90 → 55 de cada 100)
  // 🔁 v9 (ronda 8): las decisiones de la historia, que cada salida gane en algo distinto.
  trenFrankRoces: true,              // asaltar el tren de Frank: Tommy y Frank se pelean (bien → roces, roces → enemigos) y Tommy +1 de tentación
  ejercitoDistraido: true,           // dejar pensar a Tommy: tiene la cabeza en otro lado, −1 paso en sus papeles hasta el bosque
  verdadFavor: true,                 // al que le dijiste la verdad de J.Mc., al llegar a la montaña: favor doble ("me lo dijiste")
  trenFrankRecompensa: 200,             // asaltar el tren de Frank: además, recompensa (mató a un hombre a sangre fría)
  ejercitoQueda: true,
  // 🔁 v10 (ronda 9): que cada salida gane algo que se mide.
  trenFrankNoTommy: true,
  // Preguntas 9 y 14, para medirlas: true es lo que propongo; false, la otra salida.
  huidaTodos: true,                   // 9: el del telégrafo y el vigía llegan a la huida (false: va sólo el de los caballos)
  escaleraTodos: true,                // 14: la escalera decide caballos y pasajero (false: como hoy; caballos según la lealtad, el pasajero lo juegas tú)            // no asaltar el tren de Frank: Tommy, favor doble ("no somos eso")
  ejercitoPremio: 100,                // si Tommy pensó y eligió la banda: recompensa −N. 🔁 v10b: con 200 y +3, pensar era plata gratis
  ejercitoFrenado: true,             // pedirle que no: resentido, −1 paso hasta el bosque (y pensando ya no se distrae)               // si lo dejaste pensar y al llegar al bosque sigue: eligió la banda (+1 lealtad, −2 tentación)
  sueldoLealtad: 4,                   // 🔁 v9: con 3 era un peor contratar por trabajo; a sueldo llega más fiel                   // lealtad con la que llega el contratado a sueldo
  verdadQueja: true,                  // decirle la verdad de J.Mc. también duele: una queja (mentir pasa a ser un dilema)
  valienteBrujula: true,              // la brújula: al Valiente cuesta esposarlo (preso la mitad) y lo hieren más (el doble)
  despuesDePelea: 'roces',            // 🔁 v7: después de una pelea que no paraste, vuelven a roces (si no, peleaban todas las noches)
  // 🔁 v7 (ronda 6): las decisiones de la historia pesan.
  ejercitoSi: 4, ejercitoNo: 0, ejercitoNoQuejas: 1,   // dejarlo pensar: +4 y favor; pedirle que no: sin tentación y queja (antes +1 y queja doble: dejarlo pensar ganaba siempre)
  mentiraSenal: true,                 // la mentira descubierta es, además, una señal en el momento
  trenFrankCiviles: 2, trenFrankNo: 1 /* 🔁 v10: con 2, no asaltarlo perdía a Frank el doble y el tren se asaltaba siempre */,   // no asaltarlo: Frank, queja doble y +2 de tentación                // el tren de Frank le cuenta a Tommy como dos golpes con civiles
  echadoVende: true,                  // el echado sabe tus planes: el golpe siguiente, botín a la mitad
  botellaCualquiera: true,            // la botella borra cualquier queja (con sólo las chicas no servía)
  echadoRecompensa: 300,              // 🔁 v6: el de la historia que echas se va sabiendo tus planes
  razonDoble: true,                   // 🔁 v6: dar la razón: el que pierde, queja doble (si no, calmar pagando no valía)
  jinetesMin: 1,                      // 🔁 v6: siempre sale al menos un jinete (con telégrafo bien y dos tirando, no llegaba nadie)
  frankNoTelegrafo: true, divertidoSoloDeMalas: true,   // (siempre: negativas 1 de cada 9; sólo de malas: 1 de cada 16, la meta)             // 🔁 v6: el Divertido no quiere ir solo al poste
  favorChicoTarea: false,             // 🔁 medido: regalaba lealtad (no se compra lealtad con tareas)
  // "No quiere ir de X": sólo va con ganas. 🔁 Con "sólo de malas" se negaban 1 de cada 90 golpes; así, 1 de cada 14
  // (la meta de la brújula: cuidándolos, 1 de cada 15), sin costar lealtad ni plata.
  noQuiereTranquilo: true,
  apagar: [],                         // para medir cuánto vale cada cosa: ['mirar','cazar','cartas','practicar','pueblo','vender','curar','cocinar']
};

function mezclar(a, b) { for (const [k, v] of Object.entries(b)) { if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object') mezclar(a[k], v); else a[k] = v; } }
if (process.env.SIM) mezclar(N, JSON.parse(process.env.SIM));

const IDS = ['tommy', 'frank', 'santiago'];
const PERSONALIDAD = {
  tommy: ['honorable', 'valiente', 'sentimental'],
  frank: ['alcoholico', 'confiable', 'divertido'],
  santiago: ['frio', 'egoista', 'serio'],
};
const HABILIDAD = { tommy: ['riendas'], frank: ['baraja'], santiago: ['punteria', 'labia'] };
const NO_QUIERE = { egoista: ['pasajero'], cobarde: ['pasajero', 'vigia'], pendenciero: ['caballos'], valiente: ['vigia'], divertido: [] };
if (N.frankNoTelegrafo) NO_QUIERE.divertido = ['telegrafo'];
const AYUDA = { caballos: 'riendas', pasajero: ['actor', 'cuchillero'], vigia: 'buenaVista', telegrafo: 'telegrafista' };
const HABS_CONTRATADO = ['telegrafista', 'buenaVista', 'actor', 'cuchillero', 'curandero', 'cocinero', 'negociante', 'riendas', 'punteria', 'rastreador'];
const PERS_CONTRATADO = ['ambicioso', 'cobarde', 'rastrero', 'pendenciero', 'mentiroso', 'curioso', 'pacifico', 'confiable', 'valiente'];

function rngDe(semilla) {
  let s = semilla >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ── LOS JUGADORES ──
// practica: qué habilidades le faltan a la banda y las practica; contrata: 'no' | 'sueldo' | 'trabajo'.
const BASE = { dejaIrTommy: 0.5, reparto: 1, generoso: 0, concede: 0.5, fianza: 1, medico: 1, civiles: 0, calma: 0.5, corta: 0.6, echa: 0.1, botella: 0.5, abandona: 0, miente: 0.5, vigila: 0.5, trenFrank: 0.5, tareas: true, practica: true, contrata: 'no', vende: true, mira: true };
const JUGADORES = {
  cuidadoso: { ...BASE, nombre: 'Cuida a la banda', generoso: 0.5, concede: 0.9, calma: 0.9, corta: 1, echa: 0.05, miente: 0.1, vigila: 1, trenFrank: 0.5 },
  cuidaContrata: { ...BASE, nombre: 'Cuida y contrata a sueldo', generoso: 0.5, concede: 0.9, calma: 0.9, corta: 1, echa: 0.05, miente: 0.1, vigila: 1, trenFrank: 0.5, contrata: 'sueldo' },
  cuidaPorTrabajo: { ...BASE, nombre: 'Cuida y contrata por trabajo', generoso: 0.5, concede: 0.9, calma: 0.9, corta: 1, echa: 0.05, miente: 0.1, vigila: 1, trenFrank: 0.5, contrata: 'trabajo' },
  sinTareas: { ...BASE, nombre: 'Cuida, pero no usa los días', generoso: 0.5, concede: 0.9, calma: 0.9, corta: 1, echa: 0.05, miente: 0.1, vigila: 1, trenFrank: 0.5, tareas: false, practica: false, mira: false },
  tacano: { ...BASE, nombre: 'Tacaño', reparto: 0.5, tacanoHoy: 0.6, concede: 0.25, fianza: 0.5, medico: 0, calma: 0.2, corta: 0.4, echa: 0.2, botella: 0.1, miente: 0.8, vigila: 0 },
  violento: { ...BASE, nombre: 'Violento (mata civiles)', generoso: 0.1, fianza: 0.8, medico: 0.5, civiles: 0.6, abandona: 0.2, trenFrank: 1 },
  descuidado: { ...BASE, nombre: 'Descuidado', reparto: 'azar', concede: 0.4, fianza: 0.3, medico: 0.2, civiles: 0.2, calma: 0.2, corta: 0.2, botella: 0.2, abandona: 0.6, vigila: 0, tareas: false, practica: false, mira: false },
  tacanoContrata: { ...BASE, nombre: 'Tacaño que cambia la banda por contratados', reparto: 0.5, tacanoHoy: 0.6, concede: 0.25, fianza: 0.5, medico: 0, calma: 0.2, corta: 0.4, echa: 0.2, botella: 0.1, miente: 0.8, vigila: 0, contrata: 'sueldo' },
  echaContrata: { ...BASE, nombre: 'Echa al que da señal y contrata', generoso: 0.5, concede: 0.9, calma: 0.9, corta: 0, echa: 1, miente: 0.1, vigila: 1, trenFrank: 0.5, contrata: 'trabajo' },
  optimo: { ...BASE, nombre: 'El que busca la trampa', concede: 0.3, medico: 0, calma: 1, corta: 1, echa: 0, botella: 1, miente: 1, vigila: 1, trenFrank: 0, explota: true, contrata: 'sueldo' },
};

// ── LOS MIEMBROS ──
function habilidades(lista) { return Object.fromEntries(lista.map((h) => [h, { marcas: N.habilidad.marcas, ultimoUso: 0, tuvo: true, activa: true }])); }
function nuevoMiembro(id) {
  return {
    id, nombre: id, deLaHistoria: true, pers: Object.fromEntries(PERSONALIDAD[id].map((p) => [p, { escalon: 0, cuenta: 0 }])),
    hab: habilidades(HABILIDAD[id]), lealtad: N.lealtad.inicio[id], tentacion: N.tentacion.inicio[id],
    quejas: [], favores: [], herido: 0, preso: false, fuera: null, ausente: 0, cortes: 0, senal: false, civiles: 0,
    ultimaDiversion: 0, resaca: false, deMalasHasta: -1, favorTareaGolpe: -1, cuentaPaga: 0,
  };
}
function nuevoContratado(rng, n, dia) {
  const h = HABS_CONTRATADO[Math.floor(rng() * HABS_CONTRATADO.length)];
  const p = PERS_CONTRATADO[Math.floor(rng() * PERS_CONTRATADO.length)];
  return {
    id: 'c' + n, contratado: true, pers: { [p]: { escalon: 0, cuenta: 0 } }, hab: habilidades([h]), lealtad: N.contratado.lealtad,
    tentacion: p === 'rastrero' ? 2 : 0, quejas: [], favores: [], herido: 0, preso: false, fuera: null, ausente: 0, cortes: 0,
    senal: false, civiles: 0, ultimaDiversion: dia, resaca: false, deMalasHasta: -1, favorTareaGolpe: -1, cuentaPaga: 0, golpesPagados: 0,
  };
}

// ¿Corre la regla de esta personalidad hoy? (fuerte siempre; gris 1 de 2; casi blanca 1 de 5)
function corre(rng, m, p) { const x = m.pers[p]; return !!x && rng() < N.escalon[x.escalon]; }
const tieneP = (m, p) => !!m.pers[p];          // para lo que se ve sin tirada (no quiere ir de, etc.)
const sabe = (m, h) => !!(m.hab[h] && m.hab[h].activa);
function revisarHab(x) { if (x.marcas >= N.habilidad.marcas) x.activa = true; else if (x.marcas < N.habilidad.pierdeDebajo) x.activa = false; }
function bajar(m, p) { const x = m.pers[p]; if (!x || x.escalon >= 2) return; if (++x.cuenta >= N.bajarCada) { x.cuenta = 0; x.escalon++; } }

function usar(m, h, dia, cuanto) {
  if (!m.hab[h]) m.hab[h] = { marcas: 0, ultimoUso: dia, tuvo: false };
  const x = m.hab[h];
  const rapido = x.tuvo && x.marcas >= 2 ? N.habilidad.recuperar : 1;
  const antes = x.activa;
  x.marcas = Math.min(N.habilidad.marcas, x.marcas + cuanto * rapido);
  x.ultimoUso = dia;
  revisarHab(x);
  if (x.activa && !antes) { x.tuvo = true; return true; }
  return false;
}
function oxidar(m, dia) {
  for (const x of Object.values(m.hab)) if (x.marcas > 0 && dia - x.ultimoUso >= N.habilidad.oxidaCada) { x.marcas = Math.max(0, x.marcas - 1); x.ultimoUso = dia; revisarHab(x); }
}

function anotar(m, lado, motivo, dia, chica = false, veces = 1) {
  if (m.fuera || m.contratado) return;
  const lista = lado === 'q' ? m.quejas : m.favores;
  // Un motivo no se repite en la libreta: si ya está, se renueva (vuelve a durar 5 días) y no suma otra línea.
  if (N.motivoUnico) { const ya = lista.filter((x) => x.motivo === motivo); if (ya.length) { for (const x of ya) x.dia = dia; return; } }
  for (let i = 0; i < Math.min(2, veces); i++) { lista.push({ motivo, dia, chica }); if (lista.length > N.libreta.max) lista.shift(); }
}
function animo(m, golpe) {
  const q = m.quejas.length, f = m.favores.length;
  const deMalas = q > f || golpe <= m.deMalasHasta;
  if (deMalas && m.lealtad <= 1) return 'furioso';
  if (deMalas) return 'deMalas';
  if (f > q || golpe <= (m.conGanasHasta ?? -1)) return 'conGanas';
  return 'tranquilo';
}
const par = (a, b) => [a, b].sort().join('-');
const apagado = (t) => N.apagar.includes(t);
function pasos(m, papel, plan, ctx, golpe) {
  let p = 0;
  const ay = [].concat(AYUDA[papel]);
  if (ay.some((h) => sabe(m, h))) p++;
  const a = animo(m, golpe);
  if (a === 'conGanas' && !(N.serioSinGanas && tieneP(m, 'serio'))) p++;
  if ((a === 'deMalas' && !tieneP(m, 'serio')) || (a === 'furioso' && tieneP(m, 'confiable'))) p--;
  if (m.resaca) p--;
  if (N.pasoLealtad5 && m.lealtad >= 5) p++;
  if (m.lealtad <= 1) p--;
  if (m.contratado) p -= N.contratado.pasosMenos;
  if (m.distraidoHasta && golpe < m.distraidoHasta) p--;
  if (!m.contratado) for (const o of Object.values(plan)) if (o && o !== m && !o.contratado && ctx.rel[par(m.id, o.id)] === 'enemigos') p--;
  return Math.max(-3, Math.min(2, p));
}
function seNiega(m, papel, golpe) {
  const a = animo(m, golpe);
  if (tieneP(m, 'rastrero')) return false;
  if (a === 'furioso') return !(tieneP(m, 'confiable'));
  // El Divertido sólo se niega al poste de malas (tranquilo, va igual): N.divertidoSoloDeMalas.
  if (a === 'deMalas' || (N.noQuiereTranquilo && a === 'tranquilo')) return Object.keys(m.pers).some((p) => (NO_QUIERE[p] || []).includes(papel) && !(p === 'divertido' && a === 'tranquilo' && N.divertidoSoloDeMalas)) && !(papel === 'caballos' && tieneP(m, 'confiable'));
  return false;
}
function tirada(rng, p, s) { s.pasos[p] = (s.pasos[p] || 0) + 1; const [b, f] = N.escalera[p]; const r = rng() * 100; return r < b ? 'bien' : r < b + f ? 'flojo' : 'mal'; }

// ── UNA PARTIDA ──
function partida(J, semilla) {
  const rng = rngDe(semilla);
  const banda = Object.fromEntries(IDS.map((id) => [id, nuevoMiembro(id)]));
  const ctx = { rel: { 'frank-santiago': 'roces', 'frank-tommy': 'bien', 'santiago-tommy': 'bien' } };
  const s = {
    perdidos: [], traiciones: 0, senales: 0, cortadas: 0, negativas: 0, planeados: 0, peleas: 0, graves: 0,
    plata: 300, deuda: 0, recompensa: 0, objetos: 0, pasos: {}, plataMin: 300, acusoMal: 0, mentiras: [],
    papelVacio: 0, papelesTot: 0, aprendidas: 0, oxidadas: 0, contratados: 0, sueldos: 0, contratadosTraicion: 0,
    porTarea: {}, cartas: 0, perista: 0, vendioPlan: false, lealtadFinal: 0, tentFinal: 0,
  };
  let contratados = [];
  let ncon = 0;
  const historia = () => IDS.map((id) => banda[id]).filter((m) => !m.fuera);
  const todos = () => historia().concat(contratados.filter((c) => !c.fuera));
  const libres = () => todos().filter((m) => !m.herido && !m.preso && !m.ausente);
  const perder = (m, como, golpe) => { m.fuera = como; if (!m.contratado) s.perdidos.push({ id: m.id, como, golpe }); else s.contratadosTraicion++; };
  const tope = (g) => (g >= N.regiones.montana ? N.tentacion.maxMontana : N.tentacion.max);
  const tentar = (m, n, g) => { m.tentacion = Math.min(tope(g), m.tentacion + n); };
  const sortear = (a, b) => a + Math.floor(rng() * (b - a + 1));
  // Los límites, en un golpe sorteado dentro de su parte del viaje.
  const L = {
    carta: sortear(N.regiones.pradera, N.regiones.bosque - 1),
    ejercito: sortear(N.regiones.pradera, N.regiones.bosque - 1),
    nombre: sortear(N.regiones.bosque, N.regiones.montana - 1),
    promesaBosque: sortear(N.regiones.bosque, N.regiones.bosque + 3),
    promesaMontana: sortear(N.regiones.montana, N.regiones.montana + 3),
  };
  let dia = 0;
  let cantina = [];
  const tareaHecha = (t) => { s.porTarea[t] = (s.porTarea[t] || 0) + 1; };

  for (let g = 1; g <= N.golpes; g++) {
    // ── LA PARTE DEL VIAJE ──
    if (Object.values(N.regiones).includes(g)) for (const m of historia()) if (!tieneP(m, 'honorable')) tentar(m, 1, g);
    if (N.ejercitoQueda && g === N.regiones.bosque && s.ofertaEjercito && !banda.tommy.fuera) { const t = banda.tommy; t.lealtad = Math.min(N.lealtad.max, t.lealtad + 1); t.tentacion = Math.max(0, t.tentacion - 2); s.ofertaEjercito = false; anotar(t, 'f', 'Elegí la banda', dia); if (N.ejercitoPremio) s.recompensa = Math.max(0, s.recompensa - N.ejercitoPremio); }
    if (N.verdadFavor && g === N.regiones.montana) for (const m of historia()) if (m.dijeVerdad) anotar(m, 'f', 'Me dijiste la verdad', dia, false, 2);
    const cada = g >= N.regiones.montana ? N.ofertaCadaMontana : N.ofertaCada;
    // 🔁 v6: las ofertas también les llegan a los contratados (N.ofertaContratados): sin eso, cambiar la banda por
    // contratados era tan seguro como cuidarla.
    if (g % cada === 0) { const c = (N.ofertaContratados ? todos() : historia()).filter((m) => !tieneP(m, 'honorable') && !m.preso); if (c.length) tentar(c[Math.floor(rng() * c.length)], 1, g); }
    if (!s.ofertaLey && s.recompensa >= N.ofertaLey) { s.ofertaLey = true; const c = historia().filter((m) => !tieneP(m, 'honorable') && !m.preso); if (c.length) tentar(c[Math.floor(rng() * c.length)], 1, g); }
    // La oferta del ejército a Tommy: una escena con elección.
    if (g === L.ejercito && !banda.tommy.fuera) {
      if (rng() < J.dejaIrTommy) { s.ofertaEjercito = true; tentar(banda.tommy, N.ejercitoSi, g); anotar(banda.tommy, 'f', 'Confiaste en mí', dia); if (N.ejercitoDistraido && !N.ejercitoFrenado) banda.tommy.distraidoHasta = N.regiones.bosque; }
      else { tentar(banda.tommy, N.ejercitoNo, g); anotar(banda.tommy, 'q', 'No me dejaste ir', dia, false, N.ejercitoNoQuejas); if (N.ejercitoFrenado) banda.tommy.distraidoHasta = N.regiones.bosque; }
    }
    for (const [gp, n] of [[L.promesaBosque, N.promesas.bosque], [L.promesaMontana, N.promesas.montana]]) {
      if (g !== gp) continue;
      for (const m of historia().filter((x) => !x.preso).sort(() => rng() - 0.5).slice(0, n)) {
        if (rng() < J.miente) s.mentiras.push({ m, golpe: g }); else { tentar(m, N.promesaSube, g); m.dijeVerdad = true; if (N.verdadQueja) anotar(m, 'q', 'La verdad de J.Mc.', dia); }
      }
    }
    for (const x of s.mentiras.slice()) {
      if (g > x.golpe && g <= x.golpe + 3 && rng() < 1 - Math.pow(1 - N.mentiraSeEntera, 1 / 3)) { tentar(x.m, N.mentiraSube, g); anotar(x.m, 'q', 'Me mentiste', dia, false, 2); if (N.mentiraSenal && !x.m.senal) { x.m.senal = true; s.senales++; } s.mentiras.splice(s.mentiras.indexOf(x), 1); }
      else if (g > x.golpe + 3) s.mentiras.splice(s.mentiras.indexOf(x), 1);
    }

    // ── LAS SEÑALES: se resuelven antes de salir ──
    for (const m of todos()) {
      while (m.senal && !m.fuera) {
        const corta = rng() < J.corta && m.cortes < N.cortesMax;
        const precio = Math.max(N.cortar[m.cortes] || 0, Math.round(s.plata * (N.cortarParte[m.cortes] || 0)));
        let acierta = true;
        const otros = todos().filter((o) => o !== m && !o.preso);
        if (corta && g >= N.sospechososDesde && otros.length) {
          const rastreador = todos().some((o) => sabe(o, 'rastreador'));
          if (rastreador) { /* lo encuentra gratis */ }
          else if (rng() < J.vigila && s.plata >= N.vigilar + precio) s.plata -= N.vigilar;
          else if (rng() < 0.5) {
            acierta = false; s.acusoMal++;
            const ino = otros[Math.floor(rng() * otros.length)];
            anotar(ino, 'q', 'Me acusaste', dia, false, 2); tentar(ino, 1, g);
          }
        }
        if (corta && acierta && s.plata >= precio) {
          s.plata -= precio; m.cortes++; m.tentacion = Math.max(0, m.tentacion - 1); s.cortadas++;
          if (m.cortes >= 2) { const o = otros.find((x) => !x.contratado); if (o) anotar(o, 'q', 'Lo que pidió dolió', dia); }
          m.senal = m.tentacion >= m.lealtad;   // si todavía lo alcanza, la señal sigue y se puede volver a pagar
          continue;
        }
        m.senal = false;
        if (rng() < J.echa) { perder(m, 'echado', g); if (!m.contratado) { s.recompensa += N.echadoRecompensa; if (N.echadoVende) s.vendioPlan = true; } for (const o of historia()) if (!m.contratado && ctx.rel[par(o.id, m.id)] === 'bien') anotar(o, 'q', 'Echaste a mi amigo', dia); break; }
        s.traiciones++;
        if (m.id === 'tommy' && s.ofertaEjercito) { s.recompensa *= 2; perder(m, 'declaro', g); }
        else if (tieneP(m, 'egoista')) { s.plata = Math.round(s.plata * 0.75); perder(m, 'seFueConPlata', g); }
        else if ((tieneP(m, 'rastrero') || tieneP(m, 'mentiroso')) && s.recompensa >= N.ofertaLey) { s.vendioPlan = true; perder(m, 'vendioElPlan', g); }
        else perder(m, 'seFue', g);
      }
    }

    // ── LOS LÍMITES ──
    if (g === L.carta && !banda.santiago.fuera) {
      if (rng() < J.concede && s.plata >= N.limites.santiagoPide) {
        s.plata -= N.limites.santiagoPide; banda.santiago.ausente = N.limites.santiagoDias; anotar(banda.santiago, 'f', 'La carta', dia);
        for (const o of historia()) if (o !== banda.santiago) anotar(o, 'q', 'La plata de Santiago', dia);
      } else tentar(banda.santiago, 2, g);
    }
    let trenFrank = false;
    if (g === L.nombre && !banda.frank.fuera) {
      if (rng() < J.trenFrank) { trenFrank = true; anotar(banda.frank, 'f', 'Su tren', dia, false, 2); if (!banda.tommy.fuera && N.trenFrankRoces) { const pr = par('frank', 'tommy'); ctx.rel[pr] = ctx.rel[pr] === 'bien' ? 'roces' : 'enemigos'; tentar(banda.tommy, 1, g); } if (N.trenFrankRecompensa) s.recompensa += N.trenFrankRecompensa; if (!banda.tommy.fuera) { anotar(banda.tommy, 'q', 'El tren de Frank', dia, false, 2); banda.tommy.civiles += N.trenFrankCiviles - 1; } }
      else { if (N.trenFrankNoTommy && !banda.tommy.fuera) anotar(banda.tommy, 'f', 'No somos eso', dia, false, 2); banda.frank.ausente = 3; anotar(banda.frank, 'q', 'No fuimos por él', dia, false, 2); tentar(banda.frank, N.trenFrankNo, g); if (banda.frank.lealtad < N.limites.frankVuelve) perder(banda.frank, 'limite', g); }
    }

    // ── LA CANTINA: contratar (sólo si hay papeles vacíos) ──
    const papelesDelTren = (tipo) => ['caballos', ...(tipo === 'pasajeros' ? ['pasajero'] : []), ...(N.rolesFuturos ? ['telegrafo', 'vigia'] : [])];
    if (dia % 3 === 0 || !cantina.length) cantina = [nuevoContratado(rng, ++ncon, dia), nuevoContratado(rng, ++ncon, dia)];
    const faltan = () => 2 + (N.rolesFuturos ? 2 : 0) - historia().filter((m) => !m.preso && !m.herido).length - contratados.filter((c) => !c.fuera).length;
    if (J.contrata === 'sueldo' && faltan() > 0 && s.plata >= 300) {
      const quiero = ['telegrafista', 'buenaVista', 'actor', 'cuchillero', 'riendas'];
      cantina.sort((a, b) => quiero.indexOf(Object.keys(b.hab)[0]) - quiero.indexOf(Object.keys(a.hab)[0]));
      const c = cantina.shift();
      const labia = todos().some((m) => sabe(m, 'labia'));
      c.sueldo = N.contratado.sueldo * (labia ? N.contratado.labia : 1);
      s.plata -= N.contratado.adelanto; c.lealtad = N.sueldoLealtad; contratados.push(c); s.contratados++;
    }

    // ── LOS DÍAS ENTRE GOLPES ──
    const dias = sortear(N.diasEntreGolpes[0], N.diasEntreGolpes[1]);
    const rumores = [];                 // { botin, falso, visto }
    let cazado = false, cocinado = false, mejorCaja = false, cartasEsteGolpe = false, diasCazados = 0;
    for (let d = 0; d < dias; d++) {
      dia++;
      for (const m of todos()) { oxidar(m, dia); m.quejas = m.quejas.filter((q) => dia - q.dia < N.libreta.dias); m.favores = m.favores.filter((f) => dia - f.dia < N.libreta.dias); }
      for (const m of todos()) { if (m.herido) m.herido--; if (m.ausente) m.ausente--; }
      // El Divertido: 5 días sin nada → queja.
      for (const m of historia()) if (tieneP(m, 'divertido') && dia - m.ultimaDiversion >= 5 && corre(rng, m, 'divertido')) { anotar(m, 'q', 'Me aburro', dia, true); m.ultimaDiversion = dia; }
      if (!J.tareas) continue;
      // Las tareas: cada libre hace una. (El jugador las reparte por prioridad.)
      // 🔁 v5: por partes del día (brújula). Cada uno tiene mañana, tarde y noche. Mirar y practicar: mañana y tarde.
      // Pueblo, curar: una parte. Cazar: la mañana. Cartas: la noche.
      for (const m of libres()) m.partes = { m: true, t: true, n: true };
      const usa = { dia: ['m', 't'], m: ['m'], n: ['n'], una: null };
      const libreEn = (x, como) => { if (como === 'una') return x.partes.m || x.partes.t; return usa[como].every((p) => x.partes[p]); };
      const ocupar = (x, como) => { if (como === 'una') { if (x.partes.m) x.partes.m = false; else x.partes.t = false; } else for (const p of usa[como]) x.partes[p] = false; };
      const disp = libres().slice();
      const tomar = (filtro, como = 'dia') => { const x = disp.find((y) => libreEn(y, como) && filtro(y)); if (x) ocupar(x, como); return x || null; };
      let cazadoHoy = false;
      const gusta = (m, t) => { if (N.favorChicoTarea && m.favorTareaGolpe !== g) { m.favorTareaGolpe = g; anotar(m, 'f', 'Le gustó ' + t, dia, true); } };
      // 1) Curar al herido (sólo el Curandero).
      const herido = todos().find((m) => m.herido > 0);
      if (herido && !apagado('curar')) { const c = tomar((m) => sabe(m, 'curandero'), 'una'); if (c) { herido.herido = Math.max(0, herido.herido - N.curar); usar(c, 'curandero', dia, 1); tareaHecha('curar'); } }
      // 2) Mirar un tren (el primer día).
      // (Se mira un rumor sin ver; si no hay, el último día se mira el de pasajeros para saber dónde va la caja.)
      const sinVer = rumores.find((r) => !r.visto);
      if (J.mira && !apagado('mirar') && (sinVer || (d === dias - 1 && !mejorCaja))) {
        const m = tomar((x) => sabe(x, 'buenaVista') || tieneP(x, 'curioso')) || tomar(() => true);
        if (m) { if (sinVer) sinVer.visto = true; if (sabe(m, 'buenaVista') || tieneP(m, 'curioso')) { mejorCaja = true; usar(m, 'buenaVista', dia, sabe(m, 'buenaVista') ? 1 : 0); } tareaHecha('mirar'); }
      }
      // 3) Cocinar la noche antes del golpe.
      if (cazadoHoy && !apagado('cocinar')) { const c = tomar((m) => sabe(m, 'cocinero'), 'n'); if (c) { cocinado = true; usar(c, 'cocinero', dia, 1); tareaHecha('cocinar'); } }
      // 4) Vender lo robado.
      if (J.vende && s.objetos > 0 && !apagado('vender')) { const v = tomar((m) => sabe(m, 'negociante'), 'una'); const pct = v ? N.perista.negociante : null; if (v) { let p = s.objetos * pct; if (tieneP(v, 'rastrero')) p *= 0.75; s.plata += p; s.perista += p; s.objetos = 0; usar(v, 'negociante', dia, 1); tareaHecha('vender'); } }
      // 5) Cazar, cartas (lo de cada uno) antes de practicar.
      if (!apagado('cazar')) { const m = tomar((x) => sabe(x, 'punteria'), 'm'); /* 🔁 v6: el Rastreador ya no caza (pisaba a Puntería) */ if (m) { cazado = true; cazadoHoy = true; diasCazados++; usar(m, 'punteria', dia, 1); gusta(m, 'cazar'); tareaHecha('cazar'); } }
      if (!apagado('cartas') && !cartasEsteGolpe) { const m = tomar((x) => sabe(x, 'baraja'), 'n'); if (m) { cartasEsteGolpe = true; if (rng() < N.cartas.pelea) s.recompensa += N.cartas.recompensaPelea; const gana = rng() < (sabe(m, 'baraja') ? N.cartas.conBaraja : N.cartas.sinBaraja); const dif = gana ? N.cartas.gana : -N.cartas.gana; s.plata += dif; s.cartas += dif; usar(m, 'baraja', dia, 1); m.ultimaDiversion = dia; if (tieneP(m, 'divertido')) gusta(m, 'las cartas'); tareaHecha('cartas'); } }
      // 6) Practicar lo que falta para los papeles.
      if (J.practica && !apagado('practicar')) {
        const falta = ['telegrafista', 'buenaVista', 'actor'].filter((h) => !todos().some((m) => sabe(m, h)));
        for (const h of falta) {
          const m = tomar((x) => !x.contratado && x.hab[h]?.marcas > 0) || tomar((x) => !x.contratado);
          if (!m) break;
          const a = animo(m, g);
          if (usar(m, h, dia, N.habilidad.practica + (a === 'conGanas' ? N.habilidad.conGanas : 0))) s.aprendidas++;
          tareaHecha('practicar');
        }
      }
      // 7) Bajar al pueblo (rumores): el que tenga una parte libre (uno por día: es la tarea de ir).
      for (const m of disp.filter((x) => libreEn(x, 'una')).slice(0, 1)) {
        if (apagado('pueblo')) break;
        ocupar(m, 'una');
        const R = N.rumorPueblo;
        let ch = R.base + (sabe(m, 'labia') ? R.labia : 0) + (sabe(m, 'baraja') ? R.baraja : 0) + (corre(rng, m, 'alcoholico') ? R.alcoholico : 0) + (corre(rng, m, 'curioso') ? R.curioso : 0);
        if (tieneP(m, 'mentiroso')) ch *= 0.5;
        if (sabe(m, 'labia')) usar(m, 'labia', dia, 1);
        if (rng() < ch) rumores.push({ botin: N.info.carga[0] + rng() * (N.info.carga[1] - N.info.carga[0]), falso: rng() < (tieneP(m, 'mentiroso') ? 0.5 : N.info.falso), visto: false });
        if (corre(rng, m, 'pendenciero')) s.recompensa += N.recompensa.pendenciero;
        tareaHecha('pueblo');
      }
    }
    // (Sin el negociante, James vende él mismo, al 60%, cuando pasa por el pueblo.)
    if (J.vende && s.objetos > 0) { const p = s.objetos * N.perista.comun; s.plata += p; s.perista += p; s.objetos = 0; }

    // ── EL TREN: se elige el mejor de los que conoces ──
    let botin = N.botin.min + rng() * (N.botin.max - N.botin.min);   // el de pasajeros del horario
    let tipo = rng() < N.botin.pasajeros ? 'pasajeros' : 'carga';
    // Los rumores: el visto y cierto, si paga más, se elige; uno sin ver, a veces se arriesga.
    const visto = rumores.filter((r) => r.visto && !r.falso).sort((a, b) => b.botin - a.botin)[0];
    const ciego = rumores.find((r) => !r.visto);
    if (visto && visto.botin > botin) { botin = visto.botin; tipo = 'carga'; }
    else if (!visto && ciego && rng() < N.info.vaSinMirar) { tipo = 'carga'; botin = ciego.falso ? 0 : ciego.botin; if (ciego.falso) s.rumorFalso = (s.rumorFalso || 0) + 1; }
    if (mejorCaja) botin *= N.info.buenaVistaCaja;
    if (cocinado) botin *= N.cocinero;
    if (g === N.golpes) botin *= N.botin.ultimoGolpe;
    botin *= 1 - Math.min(N.recompensa.tope, (s.recompensa / 1000) * N.recompensa.botinPor1000);

    // ── EL PLAN ──
    const papeles = papelesDelTren(tipo);
    const plan = {};
    const candidatos = libres().filter((m) => !m.contratado || m.sueldo || m.porTrabajo);
    // Contratar por un trabajo, si falta gente.
    if (J.contrata === 'trabajo' && candidatos.length < papeles.length && s.plata >= N.contratado.porTrabajo + 200) {
      const c = cantina.shift() || nuevoContratado(rng, ++ncon, dia); c.porTrabajo = true; candidatos.push(c); s.contratados++;
      if (N.contratado.parte) contratados.push(c); else { s.plata -= N.contratado.porTrabajo; s.sueldos += N.contratado.porTrabajo; }
    }
    const orden = J.explota || J.generoso > 0 ? papeles : papeles.slice().sort(() => rng() - 0.5);
    let negoEsteGolpe = false;   // las negativas se cuentan por golpe (con alguna), no por intento
    for (const papel of orden) {
      const lista = candidatos.filter((m) => !Object.values(plan).includes(m));
      if (J.explota || J.generoso > 0) lista.sort((a, b) => pasos(b, papel, plan, ctx, g) - pasos(a, papel, plan, ctx, g));
      else lista.sort(() => rng() - 0.5);
      lista.sort((a, b) => (a.contratado ? 1 : 0) - (b.contratado ? 1 : 0));   // los contratados sólo llenan lo que la banda deja vacío
      // El plan muestra "no quiere" al asignar: el que mira el plan no le pide ese papel si tiene otro a mano.
      if (J.explota || J.generoso > 0) lista.sort((a, b) => (seNiega(a, papel, g) ? 1 : 0) - (seNiega(b, papel, g) ? 1 : 0));
      for (const m of lista) {
        s.planeados++;
        if (seNiega(m, papel, g)) { if (!negoEsteGolpe) s.negativas++; negoEsteGolpe = true; continue; }
        plan[papel] = m; break;
      }
    }

    // ── EL GOLPE, RESUMIDO ──
    const res = {}, pasosDe = {};
    for (const papel of papeles) {
      s.papelesTot++;
      const m = plan[papel];
      const P = N.papeles[papel];
      if (!m) { s.papelVacio++; res[papel] = 'nadie'; if (papel !== 'telegrafo') botin *= P.nadie; continue; }
      pasosDe[papel] = pasos(m, papel, plan, ctx, g);
      if (!N.escaleraTodos && papel === 'caballos') pasosDe[papel] = Math.max(-3, Math.min(2, m.lealtad - 3));   /* como hoy: sólo la lealtad, con el punto medio en 3 */
      if (!N.escaleraTodos && papel === 'pasajero') pasosDe[papel] = 0;   /* como hoy: lo juegas tú (un jugador promedio) */
      res[papel] = tirada(rng, pasosDe[papel], s);
      if (papel !== 'telegrafo') botin *= P[res[papel]];
      for (const h of [].concat(AYUDA[papel])) if (m.hab[h]) usar(m, h, dia, N.habilidad.usoGolpe);
      if (papel === 'vigia' && sabe(m, 'punteria')) usar(m, 'punteria', dia, 1);
    }
    if (s.vendioPlan) { botin *= 0.5; s.vendioPlan = false; }
    botin = Math.round(botin);
    const civiles = rng() < J.civiles || trenFrank;
    // El pasajero.
    const pas = plan.pasajero;
    if (pas) {
      const r = rng();
      const malCaballo = (res.caballos === 'mal' || res.caballos === 'nadie') && rng() < N.papeles.caballos.presoPasajero;
      if ((res.pasajero === 'mal' && r < N.papeles.pasajero.malPreso * (N.valienteBrujula && corre(rng, pas, 'valiente') ? 0.5 : 1)) || malCaballo || rng() < J.abandona) pas.preso = true;
      else if (res.pasajero === 'mal' && r < N.papeles.pasajero.malPreso + N.papeles.pasajero.malHerido && !tieneP(pas, 'cobarde')) pas.herido = N.huida.herida;
    }
    // La huida: los de afuera a caballo.
    const jinetesBase = N.huida.jinetes + (plan.telegrafo ? N.papeles.telegrafo[res.telegrafo] : 0);
    const enHuida = (N.huidaTodos ? ['caballos', 'telegrafo', 'vigia'] : ['caballos']).map((p) => plan[p]).filter(Boolean);
    let jinetes = jinetesBase - (enHuida.some((m) => sabe(m, 'punteria') && !corre(rng, m, 'cobarde')) ? 1 : 0);
    if (enHuida.filter((m) => !tieneP(m, 'cobarde')).length >= N.huida.bandaTira) jinetes--;
    jinetes = Math.max(N.jinetesMin || 0, jinetes);
    const rastreador = enHuida.some((m) => sabe(m, 'rastreador'));
    botin = Math.round(botin * (1 - jinetes * N.huida.botinPorJinete * (rastreador ? 0.5 : 1)));
    for (const m of enHuida) {
      let ch = corre(rng, m, 'cobarde') ? 0 : jinetes * N.huida.heridaPorJinete * (corre(rng, m, 'valiente') ? (N.valienteBrujula ? 2 : 0.5) : 1) * (m === plan.caballos ? 1 : N.huida.llegaTarde);
      if (rng() < ch) { m.herido = Math.max(m.herido, sabe(m, 'aguante') ? Math.ceil(N.huida.herida / 2) : N.huida.herida); if (tieneP(m, 'valiente')) bajar(m, 'valiente'); }
    }
    for (const m of todos()) m.resaca = false;

    // ── LA NOCHE DEL GOLPE ──
    const plata = Math.round(botin * (1 - N.botin.objetos));
    s.objetos += botin - plata;
    s.plata += plata;
    if (s.deuda) { const p = Math.min(s.deuda, s.plata); s.plata -= p; s.deuda -= p; }
    s.recompensa += N.recompensa.porGolpe + (civiles ? N.recompensa.civiles : 0);
    // 2. Se anota el golpe.
    for (const [papel, m] of Object.entries(plan)) {
      if (!m) continue;
      if (res[papel] === 'bien' && pasosDe[papel] <= N.salioBienHasta && !m.preso && !m.herido && (pasosDe[papel] < 2 || rng() < N.salioBienEn2)) anotar(m, 'f', 'Salió bien', dia);
      if (res[papel] === 'mal' && Object.keys(m.pers).some((p) => (NO_QUIERE[p] || []).includes(papel))) anotar(m, 'q', 'Me pusiste donde no quería', dia);
      if (m.preso) {
        anotar(m, 'q', 'Me dejaste preso', dia, false, 2);
        if (corre(rng, m, 'egoista')) m.seEscapa = g + 2;
        const fianza = todos().some((o) => sabe(o, 'actor') && o !== m) ? N.fianza / 2 : N.fianza;
        if (rng() < J.fianza && s.plata >= fianza) { s.plata -= fianza; m.preso = false; anotar(m, 'f', 'Pagaste la fianza', dia); }
      } else if (m.herido) {
        if (!corre(rng, m, 'frio')) anotar(m, 'q', 'Me hirieron', dia, true, corre(rng, m, 'sentimental') ? 2 : 1);
        const cura = todos().some((o) => sabe(o, 'curandero'));
        if (!cura && rng() < J.medico && s.plata >= N.medico) { s.plata -= N.medico; m.herido = Math.max(0, m.herido - N.medicoDias); anotar(m, 'f', 'El médico', dia); }
      }
    }
    if (civiles) for (const m of historia()) {
      if (tieneP(m, 'honorable')) { anotar(m, 'q', 'Civiles', dia); m.civiles++; }
      else if (corre(rng, m, 'sentimental')) anotar(m, 'q', 'Civiles', dia);
    }
    if (!banda.tommy.fuera && banda.tommy.civiles >= N.limites.tommyCiviles) { s.recompensa *= 2; perder(banda.tommy, 'seEntrego', g); }
    // El reparto (sólo la banda de la historia; los contratados cobran su sueldo).
    const fueron = new Set(Object.values(plan).filter(Boolean));
    const dado = {};
    const generosoHoy = rng() < J.generoso;
    const tacanoHoy = J.tacanoHoy != null && rng() < J.tacanoHoy;
    const R = N.reparto;
    const partes = (m) => (!fueron.has(m) ? R.parteQueda : tieneP(m, 'ambicioso') ? R.parteAmbicioso : 1);
    const cobranC = N.contratado.parte ? contratados.filter((c) => !c.fuera && (fueron.has(c) || c.sueldo)) : [];
    const totalPartes = historia().filter((m) => !m.preso).reduce((t, m) => t + partes(m), 0) + (N.contratado.noveno ? 0 : cobranC.reduce((t, c) => t + (fueron.has(c) ? 1 : R.parteQueda), 0));
    for (const m of historia()) {
      if (m.preso) continue;
      const pct = R.bolsa ? (R.bolsa * partes(m)) / totalPartes : !fueron.has(m) ? R.queda : tieneP(m, 'ambicioso') ? R.ambicioso : R.va;
      const espera = botin * pct;
      let da;
      if (J.reparto === 'azar') da = espera * [0, 0.5, 1, 1.3][Math.floor(rng() * 4)];
      else if (J.tacanoHoy != null) da = espera * (tacanoHoy ? J.reparto : 1);
      else da = espera * J.reparto * (generosoHoy ? N.reparto.generoso : 1);
      da = Math.min(da, Math.max(0, s.plata)); s.plata -= da;
      dado[m.id] = da / Math.max(1, espera);
      if (da <= 0.01 && fueron.has(m)) anotar(m, 'q', 'Nada', dia, false, 2);
      else if (da < espera - 0.5) anotar(m, 'q', 'Me diste poco', dia);
      else if (da >= espera * N.reparto.generoso - 0.5) {
        m.genSeguidos = (m.genSeguidos || 0) + 1;
        const acostumbrado = N.acostumbra && m.genSeguidos > N.acostumbra;   // 🔁 v8: el tercero seguido ya no es favor: lo espera
        if (!acostumbrado && !(N.serioNoSeAlegra && corre(rng, m, 'serio'))) anotar(m, 'f', 'Generoso', dia, false, corre(rng, m, 'sentimental') ? 2 : 1);
        if (tieneP(m, 'egoista')) bajar(m, 'egoista');
      }
      if (da < espera * N.reparto.generoso - 0.5) { if (N.acostumbra && (m.genSeguidos || 0) >= N.acostumbra) anotar(m, 'q', 'Ya no me das como antes', dia); m.genSeguidos = 0; }
    }
    const ids = Object.keys(dado);
    for (let i = 0; i < ids.length; i++) for (let k = i + 1; k < ids.length; k++) {
      const [a, b] = [dado[ids[i]], dado[ids[k]]];
      if ((a >= N.reparto.generoso - 0.01 && b <= 1.01) || (b >= N.reparto.generoso - 0.01 && a <= 1.01)) { const p = par(ids[i], ids[k]); if (ctx.rel[p]) ctx.rel[p] = ctx.rel[p] === 'bien' ? 'roces' : 'enemigos'; }
    }
    // Sueldos de los contratados: 1 de cada 18 pesos del botín (un sexto del tercio), de tu bolsa; si no fue, la mitad.
    for (const c of contratados.filter((x) => !x.fuera)) {
      // 🔁 v6: sin nadie de la banda de la historia, el tercio es de los contratados (si no, perder a todos te lo ahorraba).
      const sinBanda = totalPartes === 0, partesC = cobranC.reduce((t, x) => t + (fueron.has(x) ? 1 : R.parteQueda), 0);
      if (N.contratado.parte && R.bolsa) c.sueldo = !cobranC.includes(c) ? 0 : Math.round(botin * R.bolsa * (fueron.has(c) ? 1 : R.parteQueda) / (sinBanda ? Math.max(1, partesC) : N.contratado.noveno ? N.contratado.divisor : Math.max(1, totalPartes)));
      // 🔁 v11: por cabeza, el contratado cobra su porcentaje como uno más (antes cobraba 0: el tercio era null).
      else if (N.contratado.parte) c.sueldo = !cobranC.includes(c) ? 0 : Math.round(botin * (fueron.has(c) ? R.va : N.contratado.quedaCobra ? R.queda : 0));
      if (N.contratado.semanal && !c.porTrabajo) c.sueldo += Math.round((N.contratado.semanal * dias) / 7);
      if (s.plata >= c.sueldo) { s.plata -= c.sueldo; s.sueldos += c.sueldo; c.golpesPagados++; if (c.golpesPagados % 3 === 0) c.lealtad = Math.min(N.contratado.max, c.lealtad + 1); }
      else if (c.debe) perder(c, 'sinPaga', g); else c.debe = true;
    }
    contratados = contratados.filter((c) => !c.fuera && !c.porTrabajo);
    // La olla (cazar la paga) y J.Mc.
    const olla = (dias - diasCazados) * todos().length * (g >= N.regiones.montana ? N.ollaDiaMontana : N.ollaDia);
    if (s.plata >= olla) s.plata -= olla; else for (const m of historia()) anotar(m, 'q', 'No hay comida', dia);
    { const p = Math.min(N.jmc, s.plata); s.plata -= p; s.deuda += N.jmc - p; }
    // Pedidos.
    if (rng() < N.pedido.chance) {
      const h = historia().filter((m) => !m.preso); const q = h[Math.floor(rng() * h.length)];
      if (q) { if (rng() < J.concede && s.plata >= N.pedido.costo) { s.plata -= N.pedido.costo; if (!(N.serioSinPedido && corre(rng, q, 'serio'))) anotar(q, 'f', 'Pedido', dia, false, corre(rng, q, 'sentimental') ? 2 : 1); } else anotar(q, 'q', 'Pedido', dia); }
    }
    // La botella del Alcohólico (una vez por golpe; borra cualquier queja). Se gasta sólo si tenía queja y se la negaste.
    for (const m of historia()) if (tieneP(m, 'alcoholico')) {
      if (m.quejas.length && rng() < J.botella && s.plata >= N.botella) { /* (se la da cuando tiene una queja) */ if (corre(rng, m, 'alcoholico')) { s.plata -= N.botella; m.resaca = true; m.ultimaDiversion = dia; const i = m.quejas.findIndex((q) => q.chica || N.botellaCualquiera); if (i >= 0) m.quejas.splice(i, 1); } }
      else if (m.quejas.length) bajar(m, 'alcoholico');
    }
    // 3. La lealtad.
    for (const m of historia()) {
      if (m.preso) continue;
      const d = m.favores.length - m.quejas.length, umbral = corre(rng, m, 'frio') ? N.libreta.diferenciaFrio : N.libreta.diferencia;
      if (d >= umbral) { if (m.lealtad < N.lealtad.max) m.lealtad++; m.tentacion = Math.max(0, m.tentacion - 1); m.quejas = []; m.favores = []; m.conGanasHasta = g + 1; }
      else if (-d >= umbral && m.lealtad > 0) { m.lealtad--; m.quejas = []; m.favores = []; m.deMalasHasta = g + 1; }
    }
    // 5. La fogata.
    for (const [p, ch] of Object.entries(N.choques)) if (ctx.rel[p] === 'bien' && rng() < ch) ctx.rel[p] = 'roces';
    const pares = Object.entries(ctx.rel).filter(([p]) => p.split('-').every((id) => !banda[id].fuera && !banda[id].preso));
    const lealDe = (p) => p.split('-').reduce((t, id) => t + banda[id].lealtad, 0);
    pares.sort((a, b) => lealDe(a[0]) - lealDe(b[0]));
    const peor = pares.find(([, e]) => e === 'enemigos') || pares.find(([, e]) => e === 'roces');
    if (peor) {
      const [p, e] = peor, [a, b] = p.split('-').map((id) => banda[id]);
      const labia = todos().some((m) => m !== a && m !== b && sabe(m, 'labia'));
      if (e === 'roces') {
        s.peleas++;
        if (rng() < J.calma && (labia || s.plata >= N.calmar)) { if (!labia) s.plata -= N.calmar; ctx.rel[p] = 'bien'; }
        else if (rng() < 0.5) { const [gana, pierde] = rng() < 0.5 ? [a, b] : [b, a]; anotar(gana, 'f', 'Razón', dia); anotar(pierde, 'q', 'Razón al otro', dia, false, N.razonDoble ? 2 : 1); }
        else if (!historia().some((m) => m !== a && m !== b && tieneP(m, 'divertido') && corre(rng, m, 'divertido'))) ctx.rel[p] = 'enemigos';   // 🔁 v7: sólo si la discusión es entre otros dos   // el Divertido lo hace reír
      } else {
        s.graves++;
        if (rng() < J.calma && (labia || s.plata >= N.pararPelea)) { if (!labia) s.plata -= N.pararPelea; ctx.rel[p] = 'roces'; }
        else {
          let her = a.lealtad < b.lealtad ? a : b.lealtad < a.lealtad ? b : (rng() < 0.5 ? a : b);
          if (sabe(her, 'cuchillero')) her = her === a ? b : a;
          her.herido = Math.max(her.herido, 2); anotar(her, 'q', 'La pelea', dia, true); if (N.despuesDePelea) ctx.rel[p] = N.despuesDePelea; /* 🔁 v7: se desahogan */
        }
      }
    }
    // 6. Las señales.
    for (const m of todos()) if (m.tentacion >= m.lealtad && !m.senal) { m.senal = true; s.senales++; }
    // Los presos: la fianza después.
    for (const m of historia()) if (m.preso && m.seEscapa && g >= m.seEscapa) { m.preso = false; m.seEscapa = 0; }
    for (const m of historia()) if (m.preso && rng() < J.fianza && s.plata >= N.fianza) { s.plata -= N.fianza; m.preso = false; anotar(m, 'f', 'Pagaste la fianza', dia); }
    s.plataMin = Math.min(s.plataMin, s.plata);
  }
  for (const m of IDS.map((id) => banda[id])) if (!m.fuera && m.preso) s.perdidos.push({ id: m.id, como: 'preso', golpe: N.golpes });
  // Lo que sabe la banda al final.
  s.habilidadesFinal = historia().reduce((t, m) => t + Object.values(m.hab).filter((x) => x.marcas >= N.habilidad.marcas).length, 0);
  s.plata += s.objetos * N.perista.comun;
  return s;
}

// ── CORRER Y CONTAR ──
const PARTIDAS = Number(process.env.PARTIDAS) || 3000;
export function correr(J, partidas = PARTIDAS) {
  const r = { pierde: [0, 0, 0, 0], como: {}, quien: { tommy: 0, frank: 0, santiago: 0 }, conSenal: 0, senales: 0, traiciones: 0, cortadas: 0, negativas: 0, planeados: 0, peleas: 0, graves: 0, plata: 0, plataMin: Infinity, pasos: {}, vacio: 0, papeles: 0, aprendidas: 0, habFinal: 0, contratados: 0, sueldos: 0, contratadosTraicion: 0, tareas: {}, cartas: 0, perista: 0 };
  for (let i = 0; i < partidas; i++) {
    const s = partida(J, i * 7919 + 13);
    r.pierde[Math.min(3, s.perdidos.length)]++;
    for (const p of s.perdidos) { r.como[p.como] = (r.como[p.como] || 0) + 1; r.quien[p.id]++; }
    if (s.senales) r.conSenal++;
    for (const k of ['senales', 'traiciones', 'cortadas', 'negativas', 'planeados', 'peleas', 'graves', 'plata', 'aprendidas', 'contratados', 'sueldos', 'contratadosTraicion', 'cartas', 'perista']) r[k] += s[k];
    r.habFinal += s.habilidadesFinal; r.vacio += s.papelVacio; r.papeles += s.papelesTot;
    r.plataMin = Math.min(r.plataMin, s.plataMin);
    for (const [k, v] of Object.entries(s.pasos)) r.pasos[k] = (r.pasos[k] || 0) + v;
    for (const [k, v] of Object.entries(s.porTarea)) r.tareas[k] = (r.tareas[k] || 0) + v;
  }
  r.n = partidas;
  return r;
}

const esPrincipal = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (esPrincipal) {
  const pct = (a, b) => `${Math.round((100 * a) / b)}%`;
  const filas = Object.entries(JUGADORES).map(([k, J]) => ({ k, J, r: correr(J) }));
  let t = `# Resultados del simulador de la banda v11 (banda3.js)\n\n${PARTIDAS} partidas de ${N.golpes} golpes por jugador, por días, con tareas, cuatro papeles y la cantina.\n\n`;
  t += '## 1. A cuántos pierde\n\n| Jugador | Nadie | 1 | 2 | 3 | Ve alguna señal | Traiciones | Plata al final |\n|---|---|---|---|---|---|---|---|\n';
  for (const { J, r } of filas) t += `| ${J.nombre} | ${pct(r.pierde[0], r.n)} | ${pct(r.pierde[1], r.n)} | ${pct(r.pierde[2], r.n)} | ${pct(r.pierde[3], r.n)} | ${pct(r.conSenal, r.n)} | ${(r.traiciones / r.n).toFixed(2)} | $${Math.round(r.plata / r.n)} |\n`;
  t += '\n## 2. Cómo se pierden (por cada 100 partidas)\n\n| Jugador | Se fue | Con plata | Vendió | Declaró (Tommy) | Echado | Límite | Se entregó | Preso |\n|---|---|---|---|---|---|---|---|---|\n';
  for (const { J, r } of filas) { const c = (k) => Math.round((100 * (r.como[k] || 0)) / r.n); t += `| ${J.nombre} | ${c('seFue')} | ${c('seFueConPlata')} | ${c('vendioElPlan')} | ${c('declaro')} | ${c('echado')} | ${c('limite')} | ${c('seEntrego')} | ${c('preso')} |\n`; }
  t += '\n## 3. Quién se pierde (por cada 100 partidas)\n\n| Jugador | Tommy | Frank | Santiago |\n|---|---|---|---|\n';
  for (const { J, r } of filas) t += `| ${J.nombre} | ${Math.round((100 * r.quien.tommy) / r.n)} | ${Math.round((100 * r.quien.frank) / r.n)} | ${Math.round((100 * r.quien.santiago) / r.n)} |\n`;
  t += '\n## 4. Los papeles y las negativas\n\n| Jugador | Papeles vacíos | Se niega (1 de cada…) | Discusiones | Peleas |\n|---|---|---|---|---|\n';
  for (const { J, r } of filas) t += `| ${J.nombre} | ${pct(r.vacio, r.papeles)} | ${r.negativas ? Math.round(r.n * N.golpes / r.negativas) + ' golpes' : 'nunca'} | ${(r.peleas / r.n).toFixed(1)} | ${(r.graves / r.n).toFixed(1)} |\n`;
  t += '\n## 5. El pronóstico\n\n| Jugador | −3 | −2 | −1 | 0 | +1 | +2 |\n|---|---|---|---|---|---|---|\n';
  for (const { J, r } of filas) { const tot = Object.values(r.pasos).reduce((a, b) => a + b, 0); t += `| ${J.nombre} | ${['-3', '-2', '-1', '0', '1', '2'].map((k) => pct(r.pasos[k] || 0, tot)).join(' | ')} |\n`; }
  t += '\n## 6. Las habilidades, la cantina y las tareas\n\n| Jugador | Habilidades aprendidas | Que tiene al final la banda | Contratados | Sueldos pagados | Contratados que se fueron mal | Cartas | Perista |\n|---|---|---|---|---|---|---|---|\n';
  for (const { J, r } of filas) t += `| ${J.nombre} | ${(r.aprendidas / r.n).toFixed(1)} | ${(r.habFinal / r.n).toFixed(1)} | ${(r.contratados / r.n).toFixed(1)} | $${Math.round(r.sueldos / r.n)} | ${(r.contratadosTraicion / r.n).toFixed(2)} | $${Math.round(r.cartas / r.n)} | $${Math.round(r.perista / r.n)} |\n`;
  // 7. Cuánto vale cada cosa: se apaga de a una, con el que cuida a la banda.
  const base = correr(JUGADORES.cuidadoso);
  const vale = (nombre, cambio, J = JUGADORES.cuidadoso) => {
    const guardado = JSON.parse(JSON.stringify(N));
    mezclar(N, cambio);
    const r = correr(J);
    for (const k of Object.keys(N)) delete N[k];
    Object.assign(N, guardado);
    return `| ${nombre} | ${Math.round((r.plata - base.plata) / base.n)} | ${Math.round((100 * (r.pierde[0] - base.pierde[0])) / base.n)} |\n`;
  };
  t += '\n## 7. Cuánto vale cada cosa (el que cuida a la banda, apagándola)\n\nPlata al final y partidas sin perder a nadie, comparado con tenerla.\n\n| Sin… | Plata | Sin perder a nadie (puntos) |\n|---|---|---|\n';
  for (const tarea of ['mirar', 'pueblo', 'cazar', 'cartas', 'practicar']) t += vale('la tarea "' + tarea + '"', { apagar: [tarea] });
  t += vale('el vigía', { papeles: { vigia: { bien: 1, flojo: 1 } } });
  t += vale('el telégrafo', { papeles: { telegrafo: { bien: 0, flojo: 0 } } });
  t += vale('los dos papeles nuevos (como hoy)', { rolesFuturos: false });
  t += vale('usar los días (ninguna tarea)', {}, JUGADORES.sinTareas);
  t += vale('ser generoso a veces', {}, { ...JUGADORES.cuidadoso, generoso: 0 });
  t += vale('calmar (dar la razón o dejarlo)', {}, { ...JUGADORES.cuidadoso, calma: 0 });
  t += vale('cortar las señales', {}, { ...JUGADORES.cuidadoso, corta: 0 });
  t += vale('la botella', {}, { ...JUGADORES.cuidadoso, botella: 0 });
  t += vale('conceder pedidos', {}, { ...JUGADORES.cuidadoso, concede: 0 });
  t += vale('asaltar el tren de Frank (nunca)', {}, { ...JUGADORES.cuidadoso, trenFrank: 0 });
  t += vale('→ asaltar el tren de Frank (siempre)', {}, { ...JUGADORES.cuidadoso, trenFrank: 1 }).replace('| → ', '| (al revés) ');
  t += vale('dejar pensar a Tommy (nunca)', {}, { ...JUGADORES.cuidadoso, dejaIrTommy: 0 });
  t += vale('decir la verdad de J.Mc. (mentir siempre)', {}, { ...JUGADORES.cuidadoso, miente: 1 });
  t += vale('→ y contratando uno a sueldo', {}, JUGADORES.cuidaContrata).replace('| → y', '| (al revés) con');
  t += vale('→ y contratando por trabajo', {}, JUGADORES.cuidaPorTrabajo).replace('| → y', '| (al revés) con');
  writeFileSync(new URL('./resultados-banda3.md', import.meta.url), t);
  console.log(t);
}
export { JUGADORES, partida };
