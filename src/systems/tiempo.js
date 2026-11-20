/**
 * 📅 EL TIEMPO *(ver data/tiempo.js y BRUJULA.md, "El tiempo")*: en qué día y en qué parte del día estás, hacer pasar
 * el tiempo, y lo que pasa con él (los heridos se curan por días).
 *
 * El tiempo pasa sólo con acciones (dormir o esperar en la carpa, ir al pueblo, salir a un asalto): todo lo que lo
 * gasta llama a `pasar`. `gameState.esDeDia` (que usan el dibujo y el pueblo) ya no se da vuelta a mano: lo pone `pasar`
 * según la parte del día.
 *
 * En `gameState.tiempo`: `dia` (días desde el principio, 0 = el 6 de agosto) y `parte` (0 a 3: mañana, tarde, noche,
 * madrugada).
 */

import { TIEMPO } from '../data/tiempo.js';
import { alEmpezarElDia, pasaUnaParte } from './animoEnJuego.js';
import { arrancarTareas } from './pizarra.js';

export function tiempoInicial() {
  return { dia: 0, parte: TIEMPO.parteInicial };
}

/** (Una partida que no tenía calendario: arranca hoy, en la parte que corresponde a si era de día.) */
export function completarTiempo(g) {
  if (!g.tiempo) g.tiempo = { dia: 0, parte: g.esDeDia ? 0 : TIEMPO.parteInicial };
  g.esDeDia = TIEMPO.deDia[g.tiempo.parte];
  return g.tiempo;
}

/** La fecha de un día de la partida (0 = el primero): `{ dia, mes, anio, semana }` (semana: 0 domingo … 6 sábado). */
export function fechaDe(nDia) {
  const I = TIEMPO.inicio;
  const d = new Date(Date.UTC(I.anio, I.mes, I.dia + nDia));
  return { dia: d.getUTCDate(), mes: d.getUTCMonth(), anio: d.getUTCFullYear(), semana: d.getUTCDay() };
}

/** El número de día de la partida de una fecha (puede ser negativo: antes de empezar). */
export function diaDe(anio, mes, dia) {
  const I = TIEMPO.inicio;
  return Math.round((Date.UTC(anio, mes, dia) - Date.UTC(I.anio, I.mes, I.dia)) / 86400000);
}

/**
 * HACER PASAR `partes` PARTES DEL DÍA. Cada día nuevo que empieza, los heridos de la banda se curan un día. Pone
 * `esDeDia` según la parte. Devuelve `{ dias, curados }`: cuántos días nuevos empezaron y quiénes se curaron.
 * 🔁 El día cambia al llegar la MADRUGADA, no la mañana: la madrugada después de la noche del 6 ya es el 7, como en la
 * vida. (Las partes siguen en el orden mañana, tarde, noche, madrugada; un día del calendario es madrugada, mañana,
 * tarde y noche.)
 */
export function pasar(g, partes) {
  const t = completarTiempo(g);
  let dias = 0;
  const curados = [];
  for (let i = 0; i < partes; i++) {
    t.parte = (t.parte + 1) % TIEMPO.partes.length;
    if (t.parte === TIEMPO.cambiaElDia) {
      t.dia++;
      dias++;
      for (const [id, e] of Object.entries(g.banda || {})) {
        if (e.herido > 0) { e.herido--; if (e.herido === 0 && e.esta) curados.push(id); }
      }
      // 🙂 El día del ánimo (systems/animoEnJuego.js): el humor, la lealtad, lo que se olvida, la botella.
      alEmpezarElDia(g, t.dia);
    }
    // 🎯 Los que están practicando: una parte menos.
    pasaUnaParte(g);
    // 📋 Empieza una parte: cada uno sale a lo que tiene puesto ahí en la pizarra (systems/pizarra.js). (🔁 Antes,
    // sólo la mañana: ahora hay tareas de una parte y de la noche.)
    if (t.parte !== TIEMPO.cambiaElDia) arrancarTareas(g, t.parte);
  }
  g.esDeDia = TIEMPO.deDia[t.parte];
  return { dias, curados };
}

/** Cuántas partes faltan para llegar a la parte `objetivo` (la próxima vez que llegue; nunca 0). */
export function partesHasta(g, objetivo) {
  const t = completarTiempo(g), n = TIEMPO.partes.length;
  return ((objetivo - t.parte + n - 1) % n) + 1;
}

/** Cuántas partes son `dias` días enteros, terminando en la misma parte en que estás. */
export function partesDeDias(dias) {
  return dias * TIEMPO.partes.length;
}

/**
 * LO QUE VIENE en los próximos `dias` días, para el calendario y la carpa: `[{ dia, que, quien }]` ordenado por día.
 * Hoy: quién se cura cuándo. (Los trenes con día y las deudas se suman cuando existan.)
 */
export function loQueViene(g, dias = TIEMPO.avisoDias) {
  const t = completarTiempo(g), out = [];
  for (const [id, e] of Object.entries(g.banda || {})) {
    // (Se cura al empezar el día número `herido` desde hoy.)
    if (e.herido > 0 && e.esta && e.herido <= dias) out.push({ dia: t.dia + e.herido, que: 'secura', quien: id });
  }
  // ✉️ La noche que pasa J.Mc. *(Santi: "sí", a que se vea en el calendario)*.
  const E = g.campamento && g.campamento.encargo;
  if (E && !E.cumplido && E.vence >= t.dia && E.vence - t.dia <= dias) out.push({ dia: E.vence, que: 'jmc' });
  return out.sort((a, b) => a.dia - b.dia);
}
