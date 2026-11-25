/**
 * 📖 EL LIBRO DE JAMES, LA PRIMERA PÁGINA (HISTORIA-DESIERTO.md, "El objetivo: que el Cuervo pese") *(Santi,
 * 2026-11-23: "no existe un objetivo claro, el jugador no sabe hacia dónde va ni por qué"; eligió la A1: "hago ya la
 * primera página del libro de James, simple")*. Con [L] en el campamento.
 *
 * Lo que dice: hacia dónde va (la barra de la fama del Cuervo, "Cole viene cuando el Cuervo pese", y la recompensa,
 * que también lo trae), cómo anda con J.Mc. (si el Cuervo no suena hace días, si desconfía y cobra de más, lo que le
 * debes) y lo que está abierto (los encargos con su tren, el maletín que tienes, la paga con su día). Todo lo que
 * decide la historia se ve acá *(Santi: "poner condiciones a cosas que el jugador no ve lo empeora")*. El resto del
 * libro (lo que pasó, con su día) viene después.
 */
import { PALETA } from '../engine/paleta.js';
import { papel, TINTAS } from '../engine/menu.js';
import { TH } from '../text/historia.js';
import { T } from '../text/es.js';
import { HISTORIA } from '../data/historia.js';
import { TIEMPO } from '../data/tiempo.js';
import { fechaDe } from '../systems/tiempo.js';
import { trenConMarca } from '../systems/horario.js';
import { completarHistoria, hay, diasSinSonar, diasSinBajar, jmcDesconfiaDeLaFama, coleViene } from '../systems/historia.js';
import { deudaConJmc } from '../systems/libreta.js';
import { tentadoSinFama } from '../systems/tentacion.js';
import { BANDA } from '../data/banda.js';

const { TINTA, TINTA_SUAVE, SELLO, PAPEL_SUCIO } = TINTAS;
const HOJA = { w: 300, h: 214 };
/** La barra: su alto, y el color de lo vacío (una tinta muy aguada). */
const BARRA = { alto: 7, vacio: PALETA[37] };

export function crearLibro(audio) {
  let abierto = false;

  function abrir() { abierto = true; audio.play('cock'); return true; }
  function cerrar() { abierto = false; }
  function activo() { return abierto; }

  /** Devuelve true mientras está abierto (así la escena no mueve al jugador). */
  function update(input) {
    if (!abierto) return false;
    if (input.wasPressed('Escape') || input.wasPressed('KeyL')) cerrar();
    return true;
  }

  /** Una fecha de la partida en palabras: "14 de agosto". */
  function fecha(dia) {
    const f = fechaDe(dia);
    return T.tiempo.fecha(f.dia, T.tiempo.meses[f.mes]);
  }

  /** El tren de algo marcado, en palabras: "el de carga del 14 de agosto, a la tarde". */
  function cuandoPasa(tren) {
    const L = TH.libro;
    const parte = tren.sabes === 'horario' && tren.parte != null ? L.aLa(T.tiempo.partesMin[TIEMPO.partes[tren.parte]]) : '';
    return L.tren(L.tipo[tren.tipoTren.id] || tren.tipoTren.id, fecha(tren.dia)) + parte;
  }

  /** Lo que está abierto: los encargos con su tren, el maletín que trajiste, la paga con su día. */
  function abiertos(g) {
    const L = TH.libro, H = completarHistoria(g), lista = [];
    // 🍺 (El recado que trajo el que bajó al pueblo, si todavía no lo leíste.)
    if ((g.campamento.pendientes || []).some((p) => p.quien === 'recado')) lista.push(L.recado);
    for (const [id, E] of Object.entries(H.encargos)) {
      if (E.estado === 'traido') { lista.push(L.traido[id] || L.encargo[id]); continue; }
      if (E.estado !== 'abierto') continue;
      const tren = trenConMarca(g, id);
      if (tren) lista.push(`${L.encargo[id] || id}: ${cuandoPasa(tren)}`);
    }
    // (La paga, si hubo trato con el capataz: sabes qué tren es.)
    for (const m of ['paga', 'paga2']) {
      const tren = hay(g, 'tratoCapataz') && trenConMarca(g, m);
      if (tren) lista.push(`${L.paga}: ${cuandoPasa(tren)}`);
    }
    return lista;
  }

  /** Parte un texto en renglones que entran en `ancho`. */
  function partir(r, texto, ancho, tam) {
    const renglones = [];
    let linea = '';
    for (const palabra of texto.split(' ')) {
      const prueba = linea ? linea + ' ' + palabra : palabra;
      if (linea && r.medir(prueba, tam) > ancho) { renglones.push(linea); linea = palabra; } else linea = prueba;
    }
    if (linea) renglones.push(linea);
    return renglones;
  }

  /** Una barra de lo que falta: el marco de tinta, lo lleno en tinta de sello y, si se dice, una marca a la mitad. */
  function barra(r, x, y, w, cuanto, mitad) {
    const lleno = Math.max(0, Math.min(1, cuanto));
    r.rect(x, y, w, BARRA.alto, BARRA.vacio);
    if (lleno > 0) r.rect(x, y, Math.max(1, Math.round(w * lleno)), BARRA.alto, SELLO);
    r.rect(x, y, w, 1, TINTA); r.rect(x, y + BARRA.alto - 1, w, 1, TINTA);
    r.rect(x, y, 1, BARRA.alto, TINTA); r.rect(x + w - 1, y, 1, BARRA.alto, TINTA);
    if (mitad) r.rect(Math.round(x + w * mitad), y - 2, 1, BARRA.alto + 4, TINTA);
  }

  function render(r, g) {
    if (!abierto || !g.campamento) return;
    const L = TH.libro, F = HISTORIA.fama, J = HISTORIA.jmc, sin = { halo: false };

    // El mundo, más oscuro detrás: la hoja es lo que importa.
    r.ctx.globalAlpha = 0.5;
    r.rect(0, 0, r.width, r.height, PALETA[0]);
    r.ctx.globalAlpha = 1;

    const x = Math.round((r.width - HOJA.w) / 2), y = Math.round((r.height - HOJA.h) / 2);
    const ix = x + 14, ancho = HOJA.w - 28;
    papel(r, x, y, HOJA.w, HOJA.h);

    // El título, en tinta de sello, con su raya; el día, a la derecha.
    r.text(L.titulo, ix, y + 22, SELLO, 'left', { tam: 12, halo: false });
    r.rect(ix, y + 31, r.medir(L.titulo, 12) + 4, 1, TINTA_SUAVE);
    r.text(fecha(g.tiempo ? g.tiempo.dia : 0), x + HOJA.w - 14, y + 22, TINTA_SUAVE, 'right', { tam: 7, halo: false });

    // 🎯 Hacia dónde va.
    let yy = y + 46;
    r.text(coleViene(g) ? L.coleYaViene : L.objetivo, ix, yy, TINTA, 'left', sin);
    yy += 13;
    const fama = Math.max(0, Math.round(g.fame || 0)), rec = Math.max(0, Math.round(g.bounty || 0));
    r.text(L.fama, ix, yy, TINTA_SUAVE, 'left', sin);
    r.text(L.deTanto(fama, F.cole.fama), x + HOJA.w - 14, yy, TINTA, 'right', sin);
    barra(r, ix, yy + 4, ancho, fama / F.cole.fama, J.buenTrabajo / F.cole.fama);
    yy += 22;
    r.text(L.recompensa, ix, yy, TINTA_SUAVE, 'left', sin);
    r.text(L.deTantoPlata(rec, F.cole.recompensa), x + HOJA.w - 14, yy, TINTA, 'right', sin);
    barra(r, ix, yy + 4, ancho, rec / F.cole.recompensa, null);
    yy += 17;
    r.text(L.recompensaNota(F.cole.recompensa), ix, yy, TINTA_SUAVE, 'left', { tam: 7, halo: false });

    // ✉️ Cómo anda con J.Mc.
    yy += 13;
    const notas = [];
    const dias = diasSinSonar(g);
    if (!coleViene(g) && jmcDesconfiaDeLaFama(g)) notas.push([L.desconfia(J.cuotaDesconfia), SELLO]);
    else if (!coleViene(g) && dias != null && dias >= 2) {
      // (Lo que viene: a los 6 días la carta; si ya llegó, a los 12 desconfía.)
      const ya = completarHistoria(g).cuenta.etapa >= 1;
      notas.push([L.sinSonar(dias, J.minimo, ya ? J.desconfia : J.efectivos, ya), TINTA]);
    }
    // 😈 (Al que va a tentar otra banda si el Cuervo no suena: que se vea antes, no después.)
    const K = completarHistoria(g).cuenta, O = HISTORIA.ofertas;
    if (!coleViene(g) && K && dias != null && (K.ofertas || 0) < O.dias.length) {
      const tentado = tentadoSinFama(g);
      if (tentado) notas.push([L.tentado(BANDA.find((m) => m.id === tentado).corto, O.dias[K.ofertas || 0] - dias), SELLO]);
    }
    const deuda = deudaConJmc(g);
    if (deuda > 0) notas.push([L.deuda(deuda), TINTA]);
    // 🍺 (Los recados esperan en la cantina: si hace días que nadie baja, que se sepa.)
    const sinBajar = diasSinBajar(g);
    if (sinBajar >= 2) notas.push([L.sinBajar(sinBajar, HISTORIA.recados.espera), TINTA]);
    for (const [t, tinta] of notas) {
      for (const renglon of partir(r, t, ancho, 8)) { r.text(renglon, ix, yy, tinta, 'left', sin); yy += 10; }
    }

    // 📌 Lo que está abierto.
    const ly = Math.max(yy + 4, y + 142);
    r.text(L.abierto, ix, ly, TINTA_SUAVE, 'left', sin);
    r.rect(ix, ly + 6, ancho, 1, PAPEL_SUCIO);
    const lista = abiertos(g);
    if (!lista.length) r.text(L.nada, ix + 7, ly + 18, TINTA_SUAVE, 'left', sin);
    let fy = ly + 18;
    for (const item of lista) {
      if (fy > y + HOJA.h - 18) break;
      r.rect(ix + 1, fy - 3, 3, 3, SELLO);
      for (const renglon of partir(r, item, ancho - 8, 8)) { r.text(renglon, ix + 7, fy, TINTA, 'left', sin); fy += 10; }
      fy += 1;
    }

    r.text(L.ayuda, x + HOJA.w - 10, y + HOJA.h - 9, TINTA_SUAVE, 'right', { tam: 7, halo: false });
  }

  return { abrir, cerrar, activo, update, render };
}
