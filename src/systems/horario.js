/**
 * 🚂 EL HORARIO DE TRENES *(ver BRUJULA.md, "Elegir el tren: el horario"; Santi: "esta decisión del mapa con trenes
 * que cambian constantemente fue literal de las primeras decisiones que tomé en este proyecto, y creo que es hora de
 * cambiarla"; "vamos con todas tus recomendaciones")*.
 *
 * Reemplaza a los trenes que daban vueltas en el mapa en segundos de verdad: el juego se mide en días que pasan con
 * acciones, y un tren que cambia cada minuto no se puede planear (ni mandar a nadie a mirarlo).
 *
 *  - Cada día trae `HORARIO.porDia` trenes, cada uno en una vía y en una parte del día, armado entero de una vez (el
 *    tipo, los vagones, el clima, lo que pasa adentro). El horario cubre siempre los próximos `HORARIO.dias` días.
 *  - El que no asaltaste, pasó y se fue.
 *  - Salir a un tren hace pasar el tiempo hasta que pasa; el viaje cuesta según lo lejos que quede la vía del
 *    campamento (`viajeDe`), así que a uno muy cercano capaz que ya no llegás.
 *
 * Vive en `gameState.horario`: `{ hasta, trenes }` (`hasta`: el último día ya armado).
 *
 * 🗞️ LO QUE SABÉS DE CADA TREN (etapa B, BRUJULA: "Lo que sabés de cada tren"), en `tren.sabes`:
 *  - 'horario': los de pasajeros, que están en el horario publicado. Se sabe el día y la parte.
 *  - null: los de carga, que no se publican. No aparecen hasta que alguien te cuenta.
 *  - 'rumor': te contaron la vía y el día, no la parte *(BRUJULA: "un rumor da la vía y el día")*. Se queda en la
 *    lista hasta que termina ese día, haya pasado o no: si se borrara al pasar, verías a qué hora pasó.
 *  - `falso: true`: un rumor que no es nada (el forastero, 50 y 50). Nunca pasa.
 *  - 🔁 `visto` ('basico' o 'completo'): lo fue a mirar uno de la banda (el espía, etapa C). No cambia `sabes`: un
 *    rumor sigue sin la parte del día. Lo que cuenta depende de quién fue (ver `volvioElEspia`).
 * Y a una vía se la puede ir a esperar sin saber nada (`esperarEnVia`): si pasa un tren, lo asaltás; si no, perdiste
 * el día.
 */
import { REGION } from '../data/region.js';
import { WAGONS } from '../data/wagons.js';
import { sortearTipoTren, sortearDificultad, TRAIN_TYPES } from '../data/train.js';
import {
  CLIMA, CLIMA_POR_DEFECTO, sortearClima, sortearEstadoTren, sortearComportamiento,
  variantesPermitidas, sortearCivilEncubierto,
} from '../data/modifiers.js';
import { sortearPaquete, CHANCE_CAJA_OCULTA } from '../data/paquetes.js';
import { sortearComposicion, ESCONDITES_DEL_MALETIN } from '../world/train.js';
import { createRng } from '../engine/rng.js';
import { completarTiempo, fechaDe } from './tiempo.js';
import { TIEMPO } from '../data/tiempo.js';

/**
 * LOS NÚMEROS DEL HORARIO.
 *  - `porDia`: trenes por día en toda la región (BRUJULA: "unos dos"; medido: con 2, entre asalto y asalto hay de
 *    3 a 6 para elegir — ver la nota en NOTAS-DISENO).
 *  - `dias`: cuántos días adelante está armado.
 *  - `viaje`: lo que cuesta llegar a una vía, en partes del día, según lo lejos que pase del campamento (en unidades
 *    del mapa): hasta `cerca`, 1; hasta `lejos`, 2; más, 3. Medido en el mapa de hoy: la del Desierto, la del Norte y
 *    la de la Mina quedan a 1; la de las Llanuras y la del Territorio, a 2; el Ramal del Río, a 3.
 */
export const HORARIO = { porDia: 2, dias: 7, viaje: { cerca: 40, lejos: 120 } };

const rng = createRng();

/** El momento de una parte de un día, contando partes desde el principio (para comparar y restar). */
export function momento(dia, parte) {
  // (Un día del calendario empieza en la madrugada: madrugada, mañana, tarde, noche.)
  const n = TIEMPO.partes.length;
  return dia * n + ((parte - TIEMPO.cambiaElDia + n) % n);
}
export function ahora(g) {
  const t = completarTiempo(g);
  return momento(t.dia, t.parte);
}

/** Las vías que tienen trenes. */
const VIAS = REGION.rutas.filter((r) => r.servicio !== false && r.puntos.length > 1);

/** Lo más cerca que pasa la vía del campamento, y en qué punto (`[i, f]`: tramo y fracción). */
function puntoMasCercano(ruta) {
  const k = REGION.campamento;
  let mejor = { d: Infinity, i: 0, f: 0 };
  for (let i = 0; i < ruta.puntos.length - 1; i++) {
    const [ax, ay] = ruta.puntos[i], [bx, by] = ruta.puntos[i + 1];
    const dx = bx - ax, dy = by - ay;
    let f = ((k.x - ax) * dx + (k.y - ay) * dy) / (dx * dx + dy * dy || 1);
    f = Math.max(0, Math.min(1, f));
    const d = Math.hypot(k.x - ax - dx * f, k.y - ay - dy * f);
    if (d < mejor.d) mejor = { d, i, f };
  }
  return mejor;
}

/** Cuántas partes del día cuesta llegar a esa vía. */
export function viajeDe(rutaId) {
  const ruta = REGION.rutas.find((r) => r.id === rutaId);
  if (!ruta) return 1;
  const d = puntoMasCercano(ruta).d, V = HORARIO.viaje;
  return d <= V.cerca ? 1 : d <= V.lejos ? 2 : 3;
}

/** Dónde lo esperás: el punto de la vía más cerca del campamento (para dibujarlo en el mapa). */
export function dondeLoEsperas(rutaId) {
  const ruta = REGION.rutas.find((r) => r.id === rutaId);
  const { i, f } = puntoMasCercano(ruta);
  const [ax, ay] = ruta.puntos[i], [bx, by] = ruta.puntos[i + 1];
  return { x: ax + (bx - ax) * f, y: ay + (by - ay) * f, i, f };
}

/**
 * UN TREN ENTERO: tipo, vagones, clima, estado, lo que hace cada vagón, los guardias que pueden ir, los encubiertos,
 * los paquetes y la caja oculta. (🔁 Es lo que hacía el mapa al dar la vuelta cada tren —`nuevoTipo`—, mudado acá sin
 * cambios: las razones de cada sorteo están en la historia de scenes/mapScene.js y en data/modifiers.js.)
 * `bounty` y `honor`: la recompensa y el honor de cuando se arma (deciden la redada y los tipos de guardia).
 */
export function armarTren(bounty = 0, honor = 0) {
  const tren = { tipoTren: sortearTipoTren(rng) };
  tren.composicion = sortearComposicion(rng, tren.tipoTren);
  // 🕵️ (En el de carga, en qué vagón va el maletín de J.Mc. si el encargo está abierto: se decide acá, y no al armar el
  // asalto, para que el espía lo pueda ver. El número es el del vagón contando desde atrás, como en los papeles.)
  if (tren.tipoTren.id === 'carga') {
    const posibles = tren.composicion.map((id, i) => (ESCONDITES_DEL_MALETIN[id] ? i + 1 : 0)).filter(Boolean);
    tren.maletinEn = posibles.length ? rng.pick(posibles) : null;
  }
  // 🕵️ (El vagón especial que le tocó —el que pone `sustituciones` en data/train.js: guardias o primera clase; con
  // o sin vagón de armas— y en qué vagón va la caja fuerte con más plata: también se decide acá, para que el espía lo
  // pueda ver. Ver `cajaGordaEn` en world/train.js.)
  const sus = (tren.tipoTren.sustituciones || [])[0];
  tren.especial = sus ? (tren.composicion.includes(sus.por) ? sus.por : sus.de) : null;
  const conCaja = tren.composicion.map((id, i) => ((WAGONS[id].loot || []).some((l) => l.type === 'strongbox') ? i + 1 : 0)).filter(Boolean);
  tren.cajaGordaEn = conCaja.length ? rng.pick(conCaja) : null;
  if (tren.tipoTren.modificadores) {
    tren.clima = sortearClima(rng);
    tren.estado = sortearEstadoTren(rng, bounty);
    tren.comportamientos = tren.composicion.map((id) => {
      if (id === 'blindado' || WAGONS[id].sinComportamiento) return 'normal';
      const patrullas = (WAGONS[id].enemies || []).length;
      const tieneCaja = (WAGONS[id].loot || []).some((l) => l.type === 'strongbox');
      return sortearComportamiento(rng, patrullas >= 2, tieneCaja);
    });
    tren.variantes = variantesPermitidas(bounty, honor);
  } else {
    tren.clima = CLIMA[CLIMA_POR_DEFECTO];
    tren.estado = [];
    tren.comportamientos = tren.composicion.map(() => 'normal');
    tren.variantes = [];
  }
  if (tren.tipoTren.gente) {
    tren.encubiertos = tren.composicion.map((id) => sortearCivilEncubierto(rng, (WAGONS[id].passengers || []).length));
    tren.paquetes = tren.composicion.map((id) => sortearPaquete(rng, (WAGONS[id].passengers || []).length > 0));
  } else {
    tren.encubiertos = tren.composicion.map(() => false);
    tren.paquetes = tren.composicion.map(() => null);
  }
  tren.cajaOculta = rng.chance(CHANCE_CAJA_OCULTA);
  // (⚠️ La escolta, por ahora como antes: se sortea una vez por tren. La reemplaza la custodia, etapa D.)
  tren.dificultad = sortearDificultad(rng);
  return tren;
}

let siguienteId = 1;

/** Los trenes de un día: `porDia`, cada uno en una vía distinta y en una parte del día cualquiera. */
function armarDia(g, dia) {
  const vias = VIAS.slice();
  const out = [];
  for (let n = 0; n < HORARIO.porDia && vias.length; n++) {
    const via = vias.splice(rng.int(0, vias.length - 1), 1)[0];
    const parte = rng.int(0, TIEMPO.partes.length - 1);
    const tren = { id: siguienteId++, dia, parte, ruta: via.id, ...armarTren(g.bounty || 0, g.honor || 0) };
    // 🗞️ (Los de pasajeros están en el horario publicado; los de carga, no.)
    tren.sabes = tren.tipoTren.id === 'carga' ? null : 'horario';
    out.push(tren);
  }
  return out;
}

/** 🗞️ La última parte de un día (la noche): hasta ahí dura un rumor, y hasta ahí esperás en una vía. */
export function finDelDia(dia) {
  return dia * TIEMPO.partes.length + TIEMPO.partes.length - 1;
}
/** 🗞️ La primera parte de un día (la madrugada). */
function empiezaElDia(dia) {
  return dia * TIEMPO.partes.length;
}
/** 🗞️ El momento de un tren, o (si de él sólo sabés el día) el principio de su día: para ordenar la lista. */
function orden(tr) {
  return tr.sabes === 'rumor' ? empiezaElDia(tr.dia) : momento(tr.dia, tr.parte);
}
/** 🗞️ ¿Sigue en el horario? Los rumores, hasta que termina su día; los demás, hasta que pasan. */
function sigue(tr, ya) {
  return tr.sabes === 'rumor' ? finDelDia(tr.dia) >= ya : !tr.falso && momento(tr.dia, tr.parte) > ya;
}

/**
 * AL DÍA: saca los que ya pasaron y arma los días que faltan hasta `HORARIO.dias` adelante. Se llama cada vez que se
 * mira el horario (el mapa, el calendario). Devuelve los trenes que vienen, en orden.
 */
export function completarHorario(g) {
  const t = completarTiempo(g);
  if (!g.horario) g.horario = { hasta: t.dia - 1, trenes: [] };
  const H = g.horario;
  const ya = ahora(g);
  H.trenes = H.trenes.filter((tr) => sigue(tr, ya));
  while (H.hasta < t.dia + HORARIO.dias) {
    H.hasta++;
    H.trenes.push(...armarDia(g, H.hasta).filter((tr) => sigue(tr, ya)));
  }
  H.trenes.sort((a, b) => orden(a) - orden(b));
  return H.trenes;
}

/** 🗞️ Los que sabés que vienen (los del horario y los rumores): los que muestra el mapa. */
export function conocidos(g) {
  return completarHorario(g).filter((tr) => tr.sabes);
}

/** Cuántas partes faltan para que pase ese tren. */
export function faltaPara(g, tren) {
  return momento(tren.dia, tren.parte) - ahora(g);
}

/**
 * Si salís ahora, ¿llegás? (Tiene que faltar al menos lo que cuesta el viaje.) 🗞️ De un rumor no sabés la parte:
 * llegás si te queda algo de ese día para esperar.
 */
export function llegas(g, tren) {
  if (tren.sabes === 'rumor') return llegasAlDia(g, tren.ruta, tren.dia);
  return faltaPara(g, tren) >= viajeDe(tren.ruta);
}

/** 🗞️ ¿Llegás a esa vía antes de que termine ese día? */
export function llegasAlDia(g, rutaId, dia) {
  return ahora(g) + viajeDe(rutaId) <= finDelDia(dia);
}

/**
 * 🗞️ ESPERAR EN UNA VÍA *(Santi eligió "Esperar en una vía")*: llegás (lo que cuesta el viaje) y esperás hasta que
 * termina el día (`dia`, o el día en que llegás). El primer tren de verdad que pase por esa vía en ese rato, lo sepas o
 * no, es el que asaltás. Devuelve `{ tren, hasta }`: el tren (o null si no pasa ninguno) y el final de la espera.
 */
export function esperarEnVia(g, rutaId, dia = null) {
  const n = TIEMPO.partes.length;
  const llegada = ahora(g) + viajeDe(rutaId);
  const d = dia === null ? Math.floor(llegada / n) : dia;
  const desde = Math.max(llegada, empiezaElDia(d)), hasta = finDelDia(d);
  let tren = null;
  for (const tr of completarHorario(g)) {
    if (tr.ruta !== rutaId || tr.falso) continue;
    const m = momento(tr.dia, tr.parte);
    if (m < desde || m > hasta) continue;
    if (!tren || m < momento(tren.dia, tren.parte)) tren = tr;
  }
  return { tren, hasta, dia: d };
}

/**
 * 🗞️ UN RUMOR DE CARGA (Frank, la hoja de ruta del Encargado): el tren de carga más cercano que todavía no sabés y al que
 * llegás de verdad (no sólo a su día: a su parte), dentro de `dias` días. Pasa a saberse como rumor. Devuelve el tren, o null si no hay ninguno.
 */
export function rumorDeCarga(g, dias = 4) {
  const hoy = completarTiempo(g).dia;
  const tren = completarHorario(g).find((tr) => !tr.sabes && !tr.falso && tr.tipoTren.id === 'carga'
    && tr.dia <= hoy + dias && faltaPara(g, tr) >= viajeDe(tr.ruta));
  if (tren) tren.sabes = 'rumor';
  return tren || null;
}

/** 🗞️ UN RUMOR QUE NO ES NADA: un tren de carga que no existe, en una vía cualquiera, de 1 a 3 días adelante. */
export function rumorFalso(g) {
  const hoy = completarTiempo(g).dia;
  const tren = {
    id: siguienteId++, dia: hoy + rng.int(1, 3), parte: null, ruta: rng.pick(VIAS).id,
    tipoTren: TRAIN_TYPES.carga, sabes: 'rumor', falso: true,
  };
  completarHorario(g).push(tren);
  completarHorario(g);
  return tren;
}

/**
 * 🗞️ LO QUE TE CUENTA EL FORASTERO *(Santi: "puede informar de un tren de carga [...] El tren de carga puede ser falso
 * o real, 50-50")*: la mitad de las veces uno de verdad (de 1 a 3 días); la otra mitad, uno que no existe. (Si toca uno
 * de verdad y no hay ninguno a mano, también miente: no tiene nada mejor para contar.)
 */
/**
 * 🕵️ EL ESPÍA (etapa C, BRUJULA: "Mandar a uno de la banda a mirarlo"): se va un día entero, como cuando practica
 * (`PARTES_DE_PRACTICA`), y sirve si vuelve antes de que pase el tren. Los trenes que se pueden mandar a mirar: los que
 * sabés (del horario o de un rumor) y todavía no viste, que pasan (o pueden pasar) después de que vuelva, y que no está
 * mirando ya otro (`yaMirando`: los números de esos trenes).
 */
export function espiables(g, partes, yaMirando = []) {
  const ya = ahora(g);
  return conocidos(g).filter((tr) => !tr.visto && !yaMirando.includes(tr.id)
    && (tr.sabes === 'rumor' ? finDelDia(tr.dia) : momento(tr.dia, tr.parte)) - ya > partes);
}

/**
 * 🕵️ LO QUE TRAE EL ESPÍA AL VOLVER: `'visto'` (queda `tren.visto`: 'completo' si `completo`, si no 'basico'),
 * `'falso'` (no existía: se borra del horario), `'tarde'` (ya pasó: un rumor del que no sabías la parte) o `'nada'`
 * (ya no está: lo asaltaste mientras).
 */
export function volvioElEspia(g, trenId, completo = false) {
  const H = g.horario;
  const tren = H && H.trenes.find((t) => t.id === trenId);
  if (!tren) return { que: 'nada', tren: null };
  if (tren.falso) { H.trenes = H.trenes.filter((t) => t !== tren); return { que: 'falso', tren }; }
  if (momento(tren.dia, tren.parte) <= ahora(g)) return { que: 'tarde', tren };
  tren.visto = completo ? 'completo' : 'basico';
  return { que: 'visto', tren };
}

export function rumorDelForastero(g) {
  return (rng.chance(0.5) && rumorDeCarga(g, 3)) || rumorFalso(g);
}

/**
 * 🗞️ LAS PISTAS DEL DIARIO *(Santi: "que sean pistas, no algo muy explícito")*: de los trenes de carga de verdad de la
 * semana (los sepas o no), hasta `cuantas` en vías distintas, con el día de la semana. El diario las dice a medias
 * (ver `T.pueblo.diario`) y NO se anotan en el horario: con eso, se va a esperar a la vía.
 */
export function pistasDelDiario(g, cuantas = 2) {
  const hoy = completarTiempo(g).dia, vistas = new Set(), out = [];
  for (const tr of completarHorario(g)) {
    // (Sólo los que todavía se alcanzan: una pista de un tren al que ya no llegás no sirve de nada.)
    if (tr.falso || tr.tipoTren.id !== 'carga' || tr.dia <= hoy || vistas.has(tr.ruta) || faltaPara(g, tr) < viajeDe(tr.ruta)) continue;
    vistas.add(tr.ruta);
    out.push({ ruta: tr.ruta, semana: fechaDe(tr.dia).semana });
    if (out.length >= cuantas) break;
  }
  return out;
}

/** Sacar un tren del horario (el que asaltaste). */
export function sacarDelHorario(g, id) {
  if (g.horario) g.horario.trenes = g.horario.trenes.filter((tr) => tr.id !== id);
}
