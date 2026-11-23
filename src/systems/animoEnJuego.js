/**
 * 🙂 EL ÁNIMO, CONECTADO AL JUEGO *(Santi, 2026-11-15: "conectá todo lo del ánimo")*.
 *
 * Las reglas son las de systems/animo.js y los números los de data/rasgos.js: los MISMOS que mide el simulador
 * (simulador/simulador.js). Este archivo sólo dice CUÁNDO pasa cada cosa en el juego:
 *  - **Cada día que empieza** (systems/tiempo.js, `pasar`): el humor vuelve un poco a lo normal y empuja la lealtad,
 *    los demás contagian, lo que no se usa se olvida, y el alcohólico toma esa noche (o no).
 *  - **La práctica** *(Santi: "el NPC se toma el día completo … en la noche descansa y las otras partes no lo vas a ver
 *    en el campamento")*: cuatro partes del día desde que lo mandás; al terminar, cuenta un tercio de un uso de verdad.
 *  - **Al armar el plan** (el mapa): puede no querer el puesto, según su humor y quién es. Se sortea una vez por día y
 *    por puesto (si no, bastaría con volver a hacer clic).
 *  - **Después del asalto** (scenes/resultsScene.js): lo que vivió la banda (heridos, civiles, el asalto que salió mal)
 *    y el puesto que hizo cuenta como un uso de su habilidad.
 *  - **Los momentos del campamento** (data/momentos.js) mueven el humor con `eventoDeAnimo`.
 *
 * Lo que el jugador tiene que saber (aprendió, perdió, domina, volvió de practicar) va a `campamento.noticias`, y se
 * cuenta al llegar al campamento o al despertar en la carpa.
 */

import { ANIMO, HUMOR, RASGOS_DE, palabraDeHumor, esPersonalidad } from '../data/rasgos.js';
import { BANDA, palabraDe } from '../data/banda.js';
import { nuevoDia, moverHumor, moverLealtad, practicar, fuerza, disposicion, habilidadesIniciales, tiene, marcaFuerte, actividad, contradecir } from './animo.js';
import { volvioElEspia } from './horario.js';
// 📒 La libreta (BANDA-NUEVA.md, etapa 2): con ella, cada cosa que pasa se anota como favor o queja.
import { LIBRETA, EVENTOS_LIBRETA } from '../data/libreta.js';
import { COMIDA } from '../data/comida.js';
import { TIEMPO } from '../data/tiempo.js';
import { comerDelDia, diasQueAlcanza } from './comida.js';
import { terminarTareas } from './tareas.js';
import { alGanarMarca, revisarSenalesDeLaMadrugada } from './tentacion.js';
import { completarLibreta, anotar, borrarQueja, caducar, revisarMarca, disposicionLibreta, sincronizar, pagarLaOlla, animo as animoLibreta } from './libreta.js';

const IDS = BANDA.map((m) => m.id);
const E = ANIMO.eventos;

/**
 * Cuántas partes del día se va a practicar (el día entero). 🔁 Con la pizarra, la mañana y la tarde: sale a la mañana
 * y vuelve a la noche (`TIEMPO.pizarra.partesTarea`).
 */
export const PARTES_DE_PRACTICA = TIEMPO.pizarra.activo ? TIEMPO.pizarra.partesTarea : 4;
/** La parte del día en que el que practica descansa en el campamento: la noche. */
const PARTE_NOCHE = 2;
/**
 * 🎯 Lo que se puede mandar a practicar hoy (sólo hablado: los dibujos de cada actividad vienen después *(Santi:
 * "todavía no dibujes las latas. Que solo sea hablado")*). Las que se usan en los puestos del asalto, y la baraja.
 */
export const PRACTICABLES = ['punteria', 'riendas', 'cuchillero', 'actor', 'baraja'];

function noticia(g, texto) {
  if (!g.campamento) return;
  (g.campamento.noticias = g.campamento.noticias || []).push(texto);
}

/** (Una partida de antes del ánimo: completa las habilidades con las que trae.) */
export function completarAnimo(banda) {
  for (const id of IDS) {
    const e = banda && banda[id];
    if (!e) continue;
    if (!e.habilidades) e.habilidades = habilidadesIniciales(e.rasgos || {});
    completarLibreta(e);
    if (e.humor == null) e.humor = HUMOR.descanso[id] ?? 50;
    // 🗣️ (Una partida de antes de las voces: le suma las personalidades nuevas —Serio, Divertido, Sentimental—.)
    if (!e.conVoces) {
      e.rasgos = e.rasgos || {};
      for (const [r, n] of Object.entries(RASGOS_DE[id] || {})) if (esPersonalidad(r) && e.rasgos[r] == null) e.rasgos[r] = n;
      e.conVoces = true;
    }
  }
}

/**
 * 🗣️ LO QUE LE PASÓ HACE POCO, para que "¿Cómo estás?" conteste con eso (VOCES.md: "con lo que le pasó hace poco"):
 * los eventos del ánimo y lo que elegiste en sus momentos ('mexico:dar'), con el día. Se guardan los últimos.
 */
export function recordar(g, id, que) {
  const e = g.banda && g.banda[id];
  if (!e) return;
  const dia = g.tiempo ? g.tiempo.dia : 0;
  e.pasado = [...(e.pasado || []).filter((p) => dia - p.dia < 8), { que, dia }].slice(-10);
}

/** Si le pasó eso en los últimos `dias` días. */
export function lePaso(g, e, que, dias = 3) {
  const dia = g.tiempo ? g.tiempo.dia : 0;
  return (e.pasado || []).some((p) => p.que === que && dia - p.dia < dias);
}

/**
 * 🃏 UNA MANO DE CARTAS CON FRANK *(VOCES.md, la opción de Bueno con la baraja: "¿Una mano, jefe? Si gano, me quedo con
 * la botella")*. Una por día. Le cuenta como actividad (Divertido: le sube a él y contagia a los demás), y como práctica
 * de la baraja sin perder el día. Devuelve si ganó él, a quién le cambió la palabra del humor y lo que pasó con la
 * baraja.
 */
export function jugarUnaMano(g, id, azar = Math.random) {
  const b = g.banda, e = b[id], dia = g.tiempo ? g.tiempo.dia : 0;
  e.manoDia = dia;
  const aca = IDS.filter((x) => b[x] && b[x].esta);
  const antes = Object.fromEntries(aca.map((x) => [x, palabraDeHumor(b[x].humor)]));
  const gano = azar() < 0.5;
  actividad(b, aca, id, dia);
  eventoDeAnimo(g, id, gano ? 'manoGana' : 'manoPierde');
  const habAntes = !!(e.habilidades && e.habilidades.baraja && e.habilidades.baraja.estrella);
  const r = practicar(e, 'baraja', dia, ANIMO.habilidad.practica, { como: 'mano' });
  const baraja = !habAntes && e.habilidades.baraja.estrella ? 'estrella' : r;
  const humores = aca.map((x) => ({ id: x, humor: palabraDeHumor(b[x].humor) })).filter((c) => c.humor !== antes[c.id]);
  return { gano, humores, baraja };
}

/** 📅 EMPIEZA UN DÍA (lo llama `pasar` al llegar la madrugada). */
export function alEmpezarElDia(g, dia, azar = Math.random) {
  if (!g.banda) return;
  completarAnimo(g.banda);
  for (const n of nuevoDia(g.banda, IDS, dia, HUMOR.descanso)) {
    if (n.que === 'perdio') noticia(g, `perdio:${n.id}:${n.habilidad}`);
    // (🟤 Perdió una marca: se está oxidando.)
    if (n.que === 'oxida') noticia(g, `oxida:${n.id}:${n.habilidad}`);
  }
  // 😄 EL DIVERTIDO QUE SE ABURRE (BANDA-NUEVA.md, "Las personalidades"): con la libreta, a los `aguanta` días sin
  // cartas ni nada que hacer, según su fuerza, queja chica "Me aburro", y se le va lo divertido (ver `BAJA`). (El
  // diseño decía 3 días; el juego y el simulador ya usaban 5: `ANIMO.divertido.aguanta`.)
  for (const id of IDS) {
    const e = g.banda[id];
    if (!e || !e.libreta || !e.esta || !e.animo || fuerza(e, 'divertido') <= 0) continue;
    if (e.animo.sinActividad < ANIMO.divertido.aguanta || azar() >= fuerza(e, 'divertido')) continue;
    e.animo.sinActividad = 0;
    anotar(e, 'q', 'meAburro', dia, { chica: true });
    noticia(g, `libreta:${id}:q:meAburro`);
    contradecir(e, 'divertido');
  }
  // 📒 Cada noche: se caen las líneas viejas de la libreta y se mira si gana o pierde una marca (una por noche).
  for (const id of IDS) {
    const e = g.banda[id];
    if (!e || !e.libreta || !e.esta) continue;
    caducar(e, dia);
    const que = revisarMarca(e, dia);
    if (que === 'gano' || que === 'perdio') noticia(g, `${que === 'gano' ? 'marcaGano' : 'marcaPerdio'}:${id}:${palabraDe(e)}`);
    // 😈 (Ganó una marca, o le sobraron favores con la lealtad en 5: −1 de tentación. Ver data/tentacion.js.)
    if (que === 'gano' || que === 'lleno') alGanarMarca(g, id);
  }
  // 😈 La madrugada después de un golpe: las señales otra vez, ya movida la lealtad (BANDA-NUEVA, pasos 3 y 7).
  for (const n of revisarSenalesDeLaMadrugada(g, azar)) noticia(g, n);
  // 🍲 La olla del día que empieza (después de mirar las marcas: la queja de hoy cuenta para la noche de mañana).
  // Sólo se avisa cuando no alcanzó.
  if (g.tiempo && g.money != null) {
    const olla = pagarLaOlla(g, dia);
    // (Una sola vez, aunque duermas varios días sin plata.)
    if (!olla.pago && !(g.campamento && (g.campamento.noticias || []).includes('sinOlla:' + olla.costo))) noticia(g, 'sinOlla:' + olla.costo);
  }
  // 🍖 Comen de la despensa (data/comida.js). Se avisa si no hubo, o (una vez cada vez que baja) si queda para poco.
  if (g.tiempo && COMIDA.activo) {
    const c = comerDelDia(g, dia), C = g.campamento;
    // (Si ya no hubo, el "queda para poco" de antes sobra.)
    if (c && c.faltan) {
      C.noticias = (C.noticias || []).filter((n) => !n.startsWith('pocaComida'));
      if (!C.noticias.includes('sinComida')) noticia(g, 'sinComida');
      C.avisoComida = true;
    }
    else {
      const d = diasQueAlcanza(g);
      if (d <= COMIDA.avisaDias && !C.avisoComida) { noticia(g, 'pocaComida:' + d); C.avisoComida = true; }
      if (d > COMIDA.avisaDias) C.avisoComida = false;
    }
  }
  // 🍾 El alcohólico toma esa noche según lo fuerte que es (80: cuatro noches de cada cinco). Con resaca, falla más
  // con los caballos (`PLAN.resaca`).
  for (const id of IDS) {
    const e = g.banda[id];
    if (e && e.esta) e.resaca = azar() < fuerza(e, 'alcoholico');
  }
}

/** 🎯 PASA UNA PARTE DEL DÍA para los que están practicando. Al terminar, cuenta lo practicado. */
export function pasaUnaParte(g) {
  if (!g.banda) return;
  // 📋 (Los que vuelven de las tareas nuevas —cazar, el pueblo, las cartas…—: se cuentan todos juntos al final, porque
  // los que cazaron juntos traen una sola presa. Ver systems/tareas.js.)
  const volvieron = [];
  for (const id of IDS) {
    const e = g.banda[id];
    if (!e || !e.practica) continue;
    if (!e.esta) { e.practica = null; continue; }
    e.practica.quedan--;
    if (e.practica.quedan > 0) continue;
    if (e.practica.tarea) { volvieron.push([id, e.practica]); e.practica = null; continue; }
    const hab = e.practica.hab;
    // 🕵️ (El que fue a mirar un tren no practicó nada: cuenta lo que vio. Ver `volvioElEspia` en systems/horario.js.)
    if (e.practica.espia) {
      // (🔁 Lo que trae depende de quién es *(Santi: "que la calidad de la info obtenida dependa de algún rasgo")*:
      // con Buena vista, el informe completo siempre; si es curioso, según lo fuerte que es; si no, el básico.)
      const completo = tiene(e, 'vista') || Math.random() < fuerza(e, 'curioso');
      const { que, tren } = volvioElEspia(g, e.practica.espia, completo);
      e.practica = null;
      if (que !== 'nada') noticia(g, `espia:${id}:${tren.id}:${que}:${tren.ruta}`);
      continue;
    }
    e.practica = null;
    const estrellaAntes = !!(e.habilidades && e.habilidades[hab] && e.habilidades[hab].estrella);
    const r = practicar(e, hab, g.tiempo ? g.tiempo.dia : 0, ANIMO.habilidad.practica, { como: 'practica' });
    const estrella = !estrellaAntes && e.habilidades[hab].estrella;
    noticia(g, `${estrella ? 'estrella' : r || 'practico'}:${id}:${hab}`);
  }
  if (volvieron.length) terminarTareas(g, volvieron);
}

/**
 * Si está afuera, en una tarea (no está en el campamento). Con la pizarra: mientras dure la tarea, salvo las que se
 * hacen en el campamento (curar, cocinar). Sin ella, todo el día menos la noche.
 */
export function practicandoAhora(g, id) {
  const e = g.banda && g.banda[id];
  if (!e || !e.practica) return false;
  if (TIEMPO.pizarra.activo) return !e.practica.enCampo;
  return !g.tiempo || g.tiempo.parte !== PARTE_NOCHE;
}

/** 🕵️ Mandarlo a mirar un tren (por su número): se va el día entero desde ahora, como a practicar. */
export function mandarAEspiar(g, id, trenId) {
  const e = g.banda[id];
  e.practica = { hab: null, espia: trenId, quedan: PARTES_DE_PRACTICA };
  e.papel = null;
}

/** 🕵️ Los trenes que ya está mirando alguien (sus números). */
export function trenesMirados(g) {
  return IDS.map((id) => g.banda && g.banda[id] && g.banda[id].practica && g.banda[id].practica.espia).filter(Boolean);
}

/** 🎯 Mandarlo a practicar: se va el día entero desde ahora. */
export function mandarAPracticar(g, id, hab) {
  const e = g.banda[id];
  e.practica = { hab, quedan: PARTES_DE_PRACTICA };
  e.papel = null;
}

/**
 * UNA COSA QUE LE PASA A UNO (un evento de `ANIMO.eventos`): le mueve el humor y la lealtad. `mult`: cuánto rinde (por
 * su personalidad); `motivo`: si lo repetido rinde menos. Devuelve lo que el jugador nota: las palabras que cambiaron
 * (`{ id, lealtad, humor }`), o null.
 */
export function eventoDeAnimo(g, id, evento, mult = 1, motivo = null, azar = Math.random) {
  const e0 = g.banda && g.banda[id];
  // 📒 Con la libreta: el evento se anota como favor o queja (ver `EVENTOS_LIBRETA`). `mult` menos de 1 es la chance
  // de que le pese (los civiles al honorable, según lo fuerte que es); `motivo`, la clave del texto en la libreta.
  if (e0 && e0.libreta) return anotarEvento(g, id, evento, mult, motivo, azar);
  const e = e0, ev = E[evento];
  if (!e || !ev || (!e.esta && !e.preso)) return null;
  const antesL = palabraDe(e), antesH = palabraDeHumor(e.humor);
  const dia = g.tiempo ? g.tiempo.dia : null;
  if (mult > 0) recordar(g, id, evento);
  if (ev.humor) moverHumor(e, ev.humor * mult, motivo, dia);
  if (ev.lealtad) moverLealtad(e, ev.lealtad * mult);
  const ahoraL = palabraDe(e), ahoraH = palabraDeHumor(e.humor);
  return { id, lealtad: ahoraL !== antesL ? ahoraL : null, humor: ahoraH !== antesH ? ahoraH : null };
}

/** 💕 Lo que al Sentimental le pega doble (BANDA-NUEVA.md): el favor de un pedido; la queja de una herida. */
const SENTIMENTAL_DOBLE = ['pedidoSi', 'herido'];

/** 📒 Un evento, en la libreta. Devuelve lo que el jugador nota: `{ id, lealtad: null, humor, anota: { lado, motivo } }`. */
function anotarEvento(g, id, evento, mult, motivo, azar) {
  const e = g.banda[id], ev = EVENTOS_LIBRETA[evento];
  if (!e.esta && !e.preso) return null;
  if (mult > 0) recordar(g, id, evento);
  if (!ev || mult <= 0 || (mult < 1 && azar() >= mult)) return null;
  const dia = g.tiempo ? g.tiempo.dia : 0, antesH = palabraDeHumor(e.humor);
  let anota = null;
  if (ev.borra) { const q = borrarQueja(e, dia); if (q) anota = { lado: 'borra', motivo: q.motivo }; }
  else {
    // (💕 Al Sentimental, el favor de un pedido y la queja de una herida le pegan doble, según su fuerza.)
    const veces = SENTIMENTAL_DOBLE.includes(evento) && azar() < fuerza(e, 'sentimental') ? 2 : ev.veces || 1;
    anotar(e, ev.lado, motivo || evento, dia, { veces, chica: !!ev.chica });
    anota = { lado: ev.lado, motivo: motivo || evento, veces };
  }
  const ahoraH = palabraDeHumor(e.humor);
  return { id, lealtad: null, humor: ahoraH !== antesH ? ahoraH : null, anota };
}

/**
 * 🎚️ LOS AVISOS DE LO QUE BAJÓ UNA PERSONALIDAD (`contradecir`, systems/animo.js), como noticias del campamento:
 * 'baja:tommy:honorable:2:0:80' (quién, qué, la cuenta, si bajó, cuánto quedó).
 */
export function avisosDeBaja(g) {
  const C = g.campamento, out = [];
  for (const [id, e] of Object.entries(g.banda || {})) {
    for (const a of (e && e.avisosBaja) || []) out.push(`baja:${id}:${a.rasgo}:${a.cuenta}:${a.bajo ? 1 : 0}:${a.ahora}`);
    if (e) e.avisosBaja = [];
  }
  if (C) C.noticias = [...(C.noticias || []), ...out];
  return out;
}

/**
 * 📒 LO QUE ANTES SUBÍA O BAJABA LA LEALTAD A MANO (+1, −2 en los momentos): ahora, `n` favores o quejas (como mucho
 * dos). Devuelve lo mismo que `eventoDeAnimo`.
 */
export function anotarPor(g, id, n, motivo) {
  const e = g.banda && g.banda[id];
  if (!e || !e.libreta || !n || (!e.esta && !e.preso)) return null;
  const dia = g.tiempo ? g.tiempo.dia : 0, antesH = palabraDeHumor(e.humor), lado = n > 0 ? 'f' : 'q';
  anotar(e, lado, motivo, dia, { veces: Math.abs(n) });
  const ahoraH = palabraDeHumor(e.humor);
  return { id, lealtad: null, humor: ahoraH !== antesH ? ahoraH : null, anota: { lado, motivo, veces: Math.min(LIBRETA.vecesMax, Math.abs(n)) } };
}

/** 💰 Cuánto rinde el reparto en cada uno, según quién es (los mismos que el simulador). */
export function multDelReparto(e, parejo) {
  const R = E.reparto;
  if (parejo) return 1 - 0.5 * fuerza(e, 'ambicioso');
  return 1 + R.ambicioso * fuerza(e, 'ambicioso') + R.egoista * fuerza(e, 'egoista') + R.conformista * fuerza(e, 'conformista');
}

/**
 * 🙅 SI QUIERE ESE PUESTO HOY: 'seNiega', 'malaGana', 'normal' o 'potenciado'. Se sortea una vez por día y por puesto.
 */
export function disposicionPara(g, id, papel, azar = Math.random) {
  const e = g.banda[id], dia = g.tiempo ? g.tiempo.dia : 0;
  e.disposiciones = e.disposiciones && e.disposiciones.dia === dia ? e.disposiciones : { dia };
  // (📒 Con la libreta no se sortea: sale del ánimo, y el plan lo dice. Ver `disposicionLibreta`.)
  if (!e.disposiciones[papel]) e.disposiciones[papel] = e.libreta ? disposicionLibreta(e, papel, dia) : disposicion(e, azar, papel);
  const d = e.disposiciones[papel];
  const M = (g.campamento && g.campamento.marcas) || {};
  // 🗣️ Tommy pidió ir adelante y le dijiste que sí: el puesto peligroso lo quiere, y va con todo.
  if (papel === 'pasajero' && id === 'tommy' && M.adelanteTommy) return 'potenciado';
  if (d !== 'seNiega') return d;
  // 🗣️ Confiable *(VOCES.md: "no se niega nunca a los caballos, sólo de mala gana")*, mientras se le nota.
  if (papel === 'caballos' && marcaFuerte(e, 'confiable')) return 'malaGana';
  // 🗣️ El trato con Santiago: "te la doy si haces el próximo sin quejarte".
  if (id === 'santiago' && M.tratoSantiago) return 'normal';
  return d;
}

/**
 * 🏁 DESPUÉS DEL ASALTO (antes de que se vacíen los puestos). `s`: el resumen del asalto. Lo que vivió la banda y lo
 * que practicó cada uno en su puesto.
 */
export function despuesDelAsalto(g, s) {
  const b = g.banda;
  completarAnimo(b);
  const aca = IDS.filter((id) => b[id] && b[id].esta);
  const dia = g.tiempo ? g.tiempo.dia : 0;
  // Salió mal: te agarraron, o volviste sin nada.
  const mal = s.outcome !== 'escaped' || !(s.money > 0);
  if (mal) for (const id of aca) eventoDeAnimo(g, id, 'asaltoMal');
  for (const id of s.heridos || []) { eventoDeAnimo(g, id, 'herido'); contradecir(b[id], 'valiente'); }
  // 🎚️ (El Serio que vuelve con ganas: se le va lo serio, de a poco. Ver `BAJA` en data/rasgos.js.)
  for (const id of aca) if (b[id].libreta && animoLibreta(b[id], dia) === 'conGanas') contradecir(b[id], 'serio');
  // 🐎 Se separó en la huida y lo dejaste solo: se enoja (si lo agarraron, ya le pega quedar preso).
  if (s.abandonado && s.abandonado.como !== 'preso') eventoDeAnimo(g, s.abandonado.id, 'abandonado');
  // Mataste civiles: a todos les pesa un poco; al honorable y al sentimental, mucho más.
  if ((s.civilians || 0) > 0) {
    for (const id of aca) {
      eventoDeAnimo(g, id, 'civilesResto');
      eventoDeAnimo(g, id, 'civilesHonorable', fuerza(b[id], 'honorable'));
      eventoDeAnimo(g, id, 'civilesSentimental', fuerza(b[id], 'sentimental'));
      contradecir(b[id], 'honorable');
    }
  }
  // Lo que hizo en su puesto cuenta como un uso de su habilidad: los caballos, las riendas; el pasajero, el cuchillo si
  // acuchilló a alguien y si no, hacerse pasar por pasajero *(Santi: el pasajero usa una sola por asalto)*.
  const usos = [];
  for (const id of IDS) {
    const e = b[id];
    if (!e || !e.papel) continue;
    if (e.papel === 'caballos') usos.push([id, 'riendas']);
    if (e.papel === 'pasajero') usos.push([id, (s.cuchilladas || 0) > 0 ? 'cuchillero' : 'actor']);
    // 📡 🔭 El telégrafo, el telegrafista; el vigía, la buena vista.
    if (e.papel === 'telegrafo') usos.push([id, 'telegrafista']);
    if (e.papel === 'vigia') usos.push([id, 'vista']);
    // (🔭 Y el vigía que además tira: la puntería.)
    if (e.papel === 'vigia' && tiene(e, 'punteria')) usos.push([id, 'punteria']);
  }
  // 📒 "Salió bien": favor para el que hizo bien su papel (con +2 lo tenía fácil: cuenta 1 de cada 2, y se dice).
  if (s.papeles) for (const x of Object.values(s.papeles)) {
    if (!x || x.res !== 'bien' || !b[x.id] || !b[x.id].libreta) continue;
    if (x.pasos >= 2 && Math.random() >= LIBRETA.salioBienEn2) continue;
    anotar(b[x.id], 'f', 'salioBien', dia);
  }
  for (const [id, hab] of usos) {
    const e = b[id];
    const estrellaAntes = !!(e.habilidades[hab] && e.habilidades[hab].estrella);
    const r = practicar(e, hab, dia, 1, { enGolpe: true });
    if (!estrellaAntes && e.habilidades[hab].estrella) noticia(g, `estrella:${id}:${hab}`);
    else if (r) noticia(g, `${r}:${id}:${hab}`);
  }
}
