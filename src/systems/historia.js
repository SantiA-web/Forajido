/**
 * 📖 EL MOTOR DE CADENAS (HISTORIA.md; *Santi, 2026-11-22: "vamos con la cadena"*). Las escenas son datos
 * (data/escenas.js) con la forma de los momentos del campamento (data/momentos.js): quién la trae, cuándo puede pasar
 * y sus opciones. Lo que este archivo agrega es lo que las cadenas necesitan para preguntar "si pasó X, N días después":
 *
 *  - **Los hechos** (`C.historia.hechos`): lo que pasó, con el momento en que pasó (el día y la parte del día). No se
 *    borran. `hay`, `diasDesde`, `despuesDe`, `anotar`. Cada escena que pasó es también un hecho, con su id
 *    (`h_manda`…): lo anota `elegir` en data/momentos.js.
 *  - **Los encargos** (`C.historia.encargos`): un pedido que marca un tren del horario (data/historia.js,
 *    `ENCARGOS`). Abierto mientras el tren no pasó; al volver de ese tren, "adentro" (lo que hiciste se elige con un
 *    cartel, *Santi eligió la A*); si el tren pasa sin ti, perdido.
 *  - **Las marcas** (`MARCAS`): los trenes que pone la historia sola (la paga de la mina, los de los Rennick).
 *  - **📣 La fama del Cuervo**: lo que la sube y cuándo viene Cole (`subirFama`, `famaDelGolpeNueva`, `coleViene`).
 *
 * 🔁 2026-11-23: por días y partes del día, no por asaltos *(Santi: "Nadie sabe cuántos asaltos va a durar la región o
 * el juego, deja de medirlo así… Que sea por días y por partes de día")*. Antes un hecho guardaba el asalto en que pasó
 * y se preguntaba "cuántos golpes desde"; ahora guarda el momento, y se pregunta "cuántos días desde".
 *
 * Quién trae cada escena: uno de la banda, `carta` (J.Mc.), `recado` (la gente del pueblo, por ahora con un recado:
 * *Santi eligió la recomendación*) o `james` (lo que pasa adentro del tren y lo que vive James: se abre solo al llegar).
 */
import { HISTORIA, ENCARGOS, MARCAS, RENNICK_SIN_VETERANO } from '../data/historia.js';
import { TIEMPO } from '../data/tiempo.js';
import { marcarTren, trenConMarca } from './horario.js';

/** Si la historia escrita está prendida (si no, el juego de antes: la carta y el maletín). */
export function historiaActiva() {
  return HISTORIA.activa;
}

/** Lo que se guarda de la historia en la partida (`g.campamento.historia`), siempre el mismo objeto. */
export function completarHistoria(g) {
  const C = g.campamento;
  if (!C) return null;
  if (!C.historia) C.historia = {};
  const H = C.historia;
  if (!H.hechos) H.hechos = {};
  if (!H.encargos) H.encargos = {};
  if (!H.dentro) H.dentro = [];
  if (!H.marcas) H.marcas = {};
  if (!H.recados) H.recados = {};
  if (!H.recadosPerdidos) H.recadosPerdidos = [];
  return H;
}

// ─────────────────────────── 📅 el momento ───────────────────────────

/**
 * EL MOMENTO DE AHORA, en un solo número que sólo crece: el día por 4, más la parte en el orden del calendario
 * (madrugada, mañana, tarde, noche: el día cambia al llegar la madrugada, ver systems/tiempo.js). Sirve para "la mañana
 * después de…": que sea de mañana y que el momento de ahora sea mayor que el del hecho.
 */
const ORDEN_DEL_DIA = { madrugada: 0, manana: 1, tarde: 2, noche: 3 };
export function ahora(g) {
  const t = g.tiempo || { dia: 0, parte: TIEMPO.parteInicial };
  return t.dia * 4 + ORDEN_DEL_DIA[TIEMPO.partes[t.parte]];
}
/** El día de la partida, como lo cuenta el guion: el primero es el día 1. */
export function diaDeHoy(g) {
  return (g.tiempo ? g.tiempo.dia : 0) + 1;
}
/** La parte del día de ahora: 'manana', 'tarde', 'noche' o 'madrugada'. */
export function parteDeHoy(g) {
  return TIEMPO.partes[g.tiempo ? g.tiempo.parte : TIEMPO.parteInicial];
}

// ─────────────────────────── los hechos ───────────────────────────

/** ¿Pasó? */
export function hay(g, hecho) {
  const H = completarHistoria(g);
  return !!H && H.hechos[hecho] != null;
}

/** El momento en que pasó (o null). */
export function desde(g, hecho) {
  const H = completarHistoria(g);
  return H && H.hechos[hecho] != null ? H.hechos[hecho] : null;
}

/** Cuántos días del calendario pasaron desde que pasó (−1 si no pasó). El mismo día: 0. */
export function diasDesde(g, hecho) {
  const m = desde(g, hecho);
  return m == null ? -1 : (g.tiempo ? g.tiempo.dia : 0) - Math.floor(m / 4);
}

/** Si pasó y ya es otra parte del día (para "la mañana después de…": `parteDeHoy(g) === 'manana' && despuesDe(…)`). */
export function despuesDe(g, hecho) {
  const m = desde(g, hecho);
  return m != null && ahora(g) > m;
}

/** Lo anota (con el momento de ahora). Lo que ya pasó no se pisa: vale la primera vez. */
export function anotar(g, ...hechos) {
  const H = completarHistoria(g);
  if (!H) return;
  for (const h of hechos) if (H.hechos[h] == null) H.hechos[h] = ahora(g);
}

// ─────────────────────────── 📣 la fama del Cuervo ───────────────────────────

/**
 * 📣 SUBE LA FAMA (HISTORIA-DESIERTO.md, "La fama"), y con ella la recompensa: la mitad *(Santi: "La recompensa debería
 * subir con la fama")*. Anota el día, para las cartas de J.Mc. ("seis días y ni una línea en los diarios").
 * `conRecompensa: false` cuando la recompensa ya la suma otro (el golpe: ver `applyRaidResult` en state/gameState.js,
 * que la muestra en los resultados). Devuelve cuánto subió la recompensa.
 */
export function subirFama(g, n, { conRecompensa = true } = {}) {
  if (!(n > 0)) return 0;
  g.fame = (g.fame || 0) + n;
  const H = completarHistoria(g);
  if (H) H.famaSubio = ahora(g);
  // ✉️ (La cuenta de J.Mc.: si desde la última vez subió `minimo` o más, el Cuervo sonó: vuelve a empezar, y si
  // desconfiaba, deja de cobrar de más.)
  if (H && H.cuenta && H.cuenta.etapa < 3) {
    H.cuenta.suma += n;
    if (H.cuenta.suma >= HISTORIA.jmc.minimo) H.cuenta = { desde: ahora(g), suma: 0, etapa: 0 };
  }
  const rec = Math.round(n * HISTORIA.fama.recompensa);
  if (conRecompensa) g.bounty = (g.bounty || 0) + rec;
  return rec;
}

/**
 * 📣 LA FAMA DE UN GOLPE, con la tabla nueva: un golpe que salió bien (+10, y +10 más si fue grande), cada guardia
 * muerto (+3) y cada civil (+5). Los guardias y los civiles cuentan aunque te agarren: ya están muertos. (Lo de antes
 * —algo raro en el botín, la racha limpia— lo suma `famaDelGolpe` en systems/tratosEnJuego.js.)
 */
export function famaDelGolpeNueva(summary) {
  const F = HISTORIA.fama;
  let n = (summary.kills || 0) * F.guardia + (summary.civilians || 0) * F.civil;
  const botin = summary.outcome === 'escaped' ? summary.money || 0 : 0;
  if (botin > 0) n += F.golpeBien + (botin >= F.grandeDesde ? F.golpeGrande : 0);
  return n;
}

/**
 * 🎯 Si ya pesa el Cuervo: la fama o la recompensa llegaron a lo de Cole. O J.Mc. le hizo creer que sí: los Rennick
 * mataron a tres y el diario dijo que fue el Cuervo (`jmcTeInvento`).
 */
export function coleViene(g) {
  const C = HISTORIA.fama.cole;
  return (g.fame || 0) >= C.fama || (g.bounty || 0) >= C.recompensa || hay(g, 'jmcTeInvento');
}

/**
 * ✉️ LAS CARTAS DE J.Mc. POR LA FAMA (data/historia.js, `jmc`): mira la cuenta y devuelve las cartas que tocan ahora
 * (ids de data/escenas.js: `h_jmc_bien`, `h_jmc_efectivos`, `h_jmc_desconfia`, `h_jmc_rennick`). La cuenta empieza
 * cuando leíste la primera carta. Después de "Cole viene" ya no escribe por esto.
 */
export function revisarFama(g) {
  const H = completarHistoria(g), C = g.campamento, J = HISTORIA.jmc, cartas = [];
  if (!H || !C.vistos.includes('encargo') || hay(g, 'h_cole_viene') || coleViene(g)) return cartas;
  if (!H.cuenta) H.cuenta = { desde: ahora(g), suma: 0, etapa: 0 };
  if (!H.buenTrabajo && (g.fame || 0) >= J.buenTrabajo) { H.buenTrabajo = true; cartas.push('h_jmc_bien'); }
  const K = H.cuenta, dias = Math.floor((ahora(g) - K.desde) / 4);
  if (K.etapa === 0 && dias >= J.efectivos) { K.etapa = 1; cartas.push('h_jmc_efectivos'); }
  if (K.etapa === 1 && dias >= J.desconfia) { K.etapa = 2; cartas.push('h_jmc_desconfia'); }
  if (K.etapa === 2 && dias >= J.rennick) { K.etapa = 3; cartas.push('h_jmc_rennick'); }
  return cartas;
}

/** ✉️ Si J.Mc. desconfía porque el Cuervo no suena (cobra de más hasta que vuelva a sonar). */
export function jmcDesconfiaDeLaFama(g) {
  const H = g.campamento && g.campamento.historia;
  return historiaActiva() && !!(H && H.cuenta && H.cuenta.etapa === 2);
}

/** ✉️ Cuántos días hace que el Cuervo no suena (desde que la cuenta empezó de nuevo), o null si no empezó. */
export function diasSinSonar(g) {
  const H = g.campamento && g.campamento.historia;
  return H && H.cuenta ? Math.floor((ahora(g) - H.cuenta.desde) / 4) : null;
}

// ─────────────────────────── ✉️ los encargos ───────────────────────────

/** Abre un encargo: marca su tren (el suyo, o el de la marca en la que va). Devuelve el tren, o null. */
export function abrirEncargo(g, id) {
  const E = ENCARGOS[id], H = completarHistoria(g);
  let tren = null;
  if (E.en) {
    tren = trenConMarca(g, E.en);
    if (tren) tren.historia.push(id);
  } else tren = marcarTren(g, id, E.tipo, { sabes: 'horario', desde: E.dias || 1, exacto: !!E.dias });
  H.encargos[id] = { estado: tren ? 'abierto' : 'perdido', desde: ahora(g) };
  if (!tren) anotar(g, 'cerrado_' + id);
  return tren;
}

/** 'abierto', 'adentro' (fuiste: falta elegir qué hiciste), 'traido' (el maletín), 'hecho', 'perdido' o null. */
export function estadoDe(g, id) {
  const H = completarHistoria(g);
  return H && H.encargos[id] ? H.encargos[id].estado : null;
}

/**
 * Lo termina (después de elegir lo que hiciste, o lo que haces con lo que trajiste). Anota `cerrado_<id>`: desde ahí
 * cuentan los días para la carta siguiente de J.Mc. ("3 días después de que se cerró lo del maletín").
 */
export function cerrarEncargo(g, id, estado = 'hecho') {
  const H = completarHistoria(g);
  if (H.encargos[id]) H.encargos[id].estado = estado;
  H.dentro = H.dentro.filter((x) => x !== id);
  anotar(g, 'cerrado_' + id);
}

/** ¿Volviste del tren de ese encargo y falta decir qué hiciste adentro? */
export function enElTren(g, id) {
  const H = completarHistoria(g);
  return !!H && H.dentro.includes(id);
}

/**
 * ✉️ El maletín de J.Mc. va en el tren de su encargo, y en ningún otro. `tren`: el tren que se mira (o los params del
 * asalto, con su `historia`); sin tren, si el encargo está abierto.
 */
export function maletinAbierto(g, tren = null) {
  if (estadoDe(g, 'maletin') !== 'abierto') return false;
  return !tren || (tren.historia || []).includes('maletin');
}

// ─────────────────────────── 🚂 los trenes ───────────────────────────

/**
 * Pone en el horario los trenes que la historia marca sola (`MARCAS`): `dias` días después del primero de sus hechos
 * (`tras`). Y anota `pasoLaPaga` cuando el tren de la primera paga ya pasó (de ahí cuentan los días de la segunda).
 */
function ponerMarcas(g) {
  const H = completarHistoria(g), hoy = g.tiempo ? g.tiempo.dia : 0;
  if (H.marcas.paga && !trenConMarca(g, 'paga')) anotar(g, 'pasoLaPaga');
  for (const [m, M] of Object.entries(MARCAS)) {
    if (H.marcas[m]) continue;
    // (El día del hecho del que sale: el primero de `tras` que pasó.)
    const momentos = M.tras.map((h) => desde(g, h)).filter((x) => x != null);
    let diaDelTren = momentos.length ? Math.floor(Math.min(...momentos) / 4) + M.dias : null;
    if (m === 'rennick') {
      // 🚂 "El veterano o el tren de los Rennick: salen el mismo día." Si aceptaste, el mismo día que el del veterano;
      // si no (o Tommy nunca lo pidió), sale igual.
      const delVeterano = trenConMarca(g, 'veterano');
      if (delVeterano) diaDelTren = delVeterano.dia;
      else if (diaDelTren == null && diaDeHoy(g) >= RENNICK_SIN_VETERANO) diaDelTren = hoy + 2;
    }
    if (diaDelTren == null) continue;
    // (El rumor llega unos días antes del tren: se marca desde que pasó el hecho, no el día del tren.)
    const conTrato = m.startsWith('paga') && hay(g, 'tratoCapataz');
    const como = conTrato ? { sabes: 'horario' } : { sabes: 'rumor', de: 'cantina' };
    const tren = marcarTren(g, m, M.tipo, { ...como, desde: Math.max(1, diaDelTren - hoy), exacto: true });
    if (tren) H.marcas[m] = tren.id;
  }
}

/**
 * 🚂 AL VOLVER DE UN TREN (la noche del golpe): lo que llevaba ese tren pasa a "adentro" (el cartel de lo que hiciste)
 * y las marcas se anotan como hechos. Y el primer golpe que salió bien y el primer golpe grande (para "El Cuervo" en
 * el diario). Devuelve las noticias.
 */
function alVolverDelTren(g) {
  const H = completarHistoria(g), U = g.ultimoAsalto, noticias = [];
  if (U && (U.botin || 0) > 0) anotar(g, 'primerGolpeBien');
  if (U && (U.botin || 0) >= HISTORIA.cuervo.botin) anotar(g, 'primerGolpeGrande');
  for (const m of (U && U.historia) || []) {
    if (ENCARGOS[m]) {
      if (!H.encargos[m]) continue;
      if (m === 'maletin') {
        const lo = !!(g.owned && g.owned.objetos.some((o) => o.id === 'maletin'));
        H.encargos[m].estado = lo ? 'traido' : 'perdido';
        if (!lo) { anotar(g, 'perdisteMaletin', 'cerrado_maletin'); noticias.push('hSinMaletin'); }
      } else {
        H.encargos[m].estado = 'adentro';
        if (!H.dentro.includes(m)) H.dentro.push(m);
      }
    // 🐛 (La paga cuenta como asaltada sólo si volviste con algo: si fuiste a ese tren y te fue mal, el capataz no
    // tiene de qué pedir su parte *(Santi: "pagué 40 dólares al capataz… no asalté el tren y después me pidió su
    // parte")*.)
    } else if (m === 'paga') anotar(g, (U.botin || 0) > 0 ? 'pagaAsaltada' : 'pagaFallada');
    else if (m === 'paga2') anotar(g, (U.botin || 0) > 0 ? 'paga2Asaltada' : 'paga2Fallada');
    else if (m === 'rennick') anotar(g, 'pisasteRennick');
    else if (m === 'rennick2') anotar(g, 'pisasteRennick2');
  }
  return noticias;
}

/** Los encargos cuyo tren pasó sin ti: perdidos. Devuelve `[{ id, de }]` (lo que le pasa a cada uno, en momentos.js). */
function revisarEncargos(g) {
  const H = completarHistoria(g), perdidos = [];
  for (const [id, E] of Object.entries(H.encargos)) {
    if (E.estado !== 'abierto' || trenConMarca(g, id)) continue;
    E.estado = 'perdido';
    anotar(g, 'perdiste_' + id, 'cerrado_' + id);
    perdidos.push({ id, de: ENCARGOS[id].de });
  }
  return perdidos;
}

// ─────────────────────────── 🍺 los recados con Rosa ───────────────────────────

/**
 * 🍺 UN RECADO QUEDA EN LA CANTINA (data/historia.js, `recados`): la escena del recado ya puede pasar, pero espera a que
 * alguien baje al pueblo. Devuelve si lo dejó ahora (cada uno, una vez).
 */
export function dejarRecado(g, id) {
  const H = completarHistoria(g);
  if (H.recados[id]) return false;
  H.recados[id] = { desde: ahora(g), estado: 'cantina' };
  return true;
}

/** Los recados que nadie fue a buscar en `espera` días: perdidos. Rosa lo cuenta la próxima vez que alguien baja. */
function vencerRecados(g) {
  const H = completarHistoria(g), R = HISTORIA.recados;
  for (const [id, x] of Object.entries(H.recados)) {
    if (x.estado !== 'cantina' || ahora(g) - x.desde < R.espera * 4) continue;
    perderRecado(g, id);
  }
}

/** Se pierde un recado: lo que significa (`alPerderse`), y queda para que Rosa lo cuente. */
export function perderRecado(g, id) {
  const H = completarHistoria(g), x = H.recados[id];
  if (x) x.estado = 'perdido';
  anotar(g, 'perdisteRecado_' + id, ...(HISTORIA.recados.alPerderse[id] || []));
  if (!H.recadosPerdidos.includes(id)) H.recadosPerdidos.push(id);
  if (g.campamento && !g.campamento.vistos.includes(id)) g.campamento.vistos.push(id);
}

/**
 * 🍺 ALGUIEN BAJÓ AL PUEBLO (`quien`: 'james' o uno de la banda): trae los recados que esperaban en la cantina (los pone
 * en el campamento `revisarHistoria`, en data/momentos.js), y Rosa le cuenta los que se perdieron.
 */
export function recogerRecados(g, quien) {
  if (!historiaActiva() || !g.campamento) return;
  const H = completarHistoria(g), C = g.campamento;
  C.noticias = C.noticias || [];
  vencerRecados(g);
  H.ultimaBajada = ahora(g);
  let traidos = 0;
  for (const x of Object.values(H.recados)) if (x.estado === 'cantina') { x.estado = 'traido'; traidos++; }
  for (const id of H.recadosPerdidos) C.noticias.push('hRecadoPerdido:' + id);
  H.recadosPerdidos = [];
  if (traidos && quien !== 'james') C.noticias.push('hRecadoTraido:' + quien);
}

/** 🍺 Cuántos días hace que nadie baja al pueblo (desde el principio, si nunca bajó nadie). */
export function diasSinBajar(g) {
  const H = completarHistoria(g);
  return Math.floor((ahora(g) - (H.ultimaBajada ?? 0)) / 4);
}

/**
 * 📖 CADA VEZ QUE SE MIRA LA HISTORIA (desde data/momentos.js: en cada visita nueva y cada vez que pasa el tiempo en el
 * campamento): lo del tren del que volviste (`recien`), los encargos perdidos y los trenes nuevos. Devuelve
 * `{ noticias, perdidos }`.
 */
export function antesDeLaVisita(g, recien) {
  completarHistoria(g);
  const noticias = recien ? alVolverDelTren(g) : [];
  const perdidos = revisarEncargos(g);
  ponerMarcas(g);
  vencerRecados(g);
  return { noticias, perdidos };
}

/**
 * 🗺️ Lo que dice el mapa de un tren marcado (la clave del texto, en text/historia.js `mapa`), o null. Los de los
 * Rennick no dicen nada (nadie sabe que son de otros); la paga, sólo con trato con el capataz.
 */
export function etiquetaDelTren(g, tren) {
  for (const m of tren.historia || []) {
    if (ENCARGOS[m] && ['abierto'].includes(estadoDe(g, m))) return m;
    if ((m === 'paga' || m === 'paga2') && hay(g, 'tratoCapataz')) return 'paga';
  }
  return null;
}

// ─────────────────────────── 🏘️ el pueblo ───────────────────────────

/**
 * 🧣 JAMES VUELVE DEL PUEBLO: si "El Cuervo" ya salió en el diario y bajó con el pañuelo puesto, Dagget lo vio de cerca
 * (HISTORIA-DESIERTO.md, "El pañuelo y Dagget"). Devuelve si pasó (la escena la pone momentos.js).
 */
export function alVolverDelPueblo(g) {
  if (!historiaActiva() || !g.campamento) return false;
  if (!hay(g, 'cuervo') || hay(g, 'panueloGuardado') || hay(g, 'daggetVio')) return false;
  anotar(g, 'daggetVio', 'daggetPersigue');
  return true;
}

/**
 * 🗞️ Uno de la banda baja al pueblo (la tarea): Frank, después de que "El Cuervo" salió en el diario, ve el cartel de
 * Santiago (Dagget empieza a colgar carteles). (🔁 Antes, desde el asalto 6.)
 */
export function alBajarAlPueblo(g, id) {
  if (!historiaActiva() || !g.campamento) return;
  if (id === 'frank' && hay(g, 'cuervo')) anotar(g, 'frankBajo');
  // 🍺 (Y trae los recados de Rosa.)
  recogerRecados(g, id);
}

/** 🏁 Si ya terminó el desierto: saliste al norte (después del tren de Cole). */
export function finDelDesierto(g) {
  return hay(g, 'saliste');
}
