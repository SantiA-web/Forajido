/**
 * 📅 EL CALENDARIO *(Santi, 2026-11-15: "para poder ver planes y algo más ampliado apretás algún botón y se abre el
 * calendario"; eligió la [C])*.
 *
 * Una hoja de papel de época, como la ficha y el diálogo: el mes con sus días (de lunes a domingo), hoy con un círculo
 * de tinta de sello, los días que ya pasaron tachados, y un punto en los días que tienen algo marcado. Al costado, "lo
 * que viene": qué pasa cada día. Con [A] y [D] se pasa de mes.
 *
 * Hoy lo único con fecha es quién se cura cuándo (ver `loQueViene` en systems/tiempo.js); los trenes con día y las
 * deudas se marcan acá cuando existan.
 */

import { PALETA } from '../engine/paleta.js';
import { papel, TINTAS } from '../engine/menu.js';
import { MIEMBRO } from '../data/banda.js';
import { TIEMPO } from '../data/tiempo.js';
import { completarTiempo, fechaDe, diaDe, loQueViene } from '../systems/tiempo.js';
import { T } from '../text/es.js';

const { TINTA, TINTA_SUAVE, SELLO, PAPEL_SUCIO } = TINTAS;
const HOJA = { w: 330, h: 196 }, CELDA = { w: 24, h: 19 };

export function crearCalendario(audio) {
  let abierto = null;   // { corrimiento: meses desde el de hoy }

  function abrir() { abierto = { corrimiento: 0 }; audio.play('cock'); return true; }
  function cerrar() { abierto = null; }
  function activo() { return !!abierto; }

  function update(input) {
    if (!abierto) return false;
    if (input.wasPressed('KeyA') || input.wasPressed('ArrowLeft')) { abierto.corrimiento--; audio.play('cock'); }
    if (input.wasPressed('KeyD') || input.wasPressed('ArrowRight')) { abierto.corrimiento++; audio.play('cock'); }
    if (input.wasPressed('Escape') || input.wasPressed('KeyC')) cerrar();
    return true;
  }

  function render(r, g) {
    if (!abierto) return;
    const t = completarTiempo(g), Tt = T.tiempo, C = Tt.calendario, sinHalo = { halo: null };
    const hoy = fechaDe(t.dia);
    // El mes que se mira.
    const m0 = hoy.mes + abierto.corrimiento;
    const anio = hoy.anio + Math.floor(m0 / 12), mes = ((m0 % 12) + 12) % 12;
    const marcas = loQueViene(g, 400);
    const conMarca = new Set(marcas.map((x) => x.dia));

    r.ctx.globalAlpha = 0.5;
    r.rect(0, 0, r.width, r.height, PALETA[0]);
    r.ctx.globalAlpha = 1;
    const x = Math.round((r.width - HOJA.w) / 2), y = Math.round((r.height - HOJA.h) / 2);
    papel(r, x, y, HOJA.w, HOJA.h);

    // El nombre del mes, como encabezado de almanaque.
    const nombreMes = Tt.meses[mes];
    const titulo = nombreMes[0].toUpperCase() + nombreMes.slice(1);
    r.text(titulo, x + 14, y + 20, SELLO, 'left', { tam: 12, halo: null });
    r.rect(x + 14, y + 29, r.medir(titulo, 12) + 4, 1, TINTA_SUAVE);

    // La grilla: de lunes a domingo.
    const gx = x + 14, gy = y + 40;
    Tt.semana.forEach((d, i) => r.text(d, gx + i * CELDA.w + CELDA.w / 2, gy, TINTA_SUAVE, 'center', sinHalo));
    r.rect(gx, gy + 6, CELDA.w * 7, 1, PAPEL_SUCIO);
    const enElMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
    const primero = (new Date(Date.UTC(anio, mes, 1)).getUTCDay() + 6) % 7;   // (0 = lunes)
    for (let d = 1; d <= enElMes; d++) {
      const pos = primero + d - 1, col = pos % 7, fila = Math.floor(pos / 7);
      const cx = gx + col * CELDA.w + CELDA.w / 2, cy = gy + 16 + fila * CELDA.h;
      const n = diaDe(anio, mes, d);
      const antes = n < 0, paso = n < t.dia && !antes, esHoy = n === t.dia;
      r.text(String(d), cx, cy, antes ? PALETA[25] : paso ? TINTA_SUAVE : TINTA, 'center', sinHalo);
      // Los que ya pasaron, tachados con una raya, como en un almanaque de pared.
      if (paso) for (let k = 0; k < 9; k++) r.rect(cx - 5 + k, cy + 4 - k, 1, 1, TINTA_SUAVE);
      // Hoy, en un círculo de tinta de sello.
      if (esHoy) circulo(r, cx, cy, 9, 7, SELLO);
      if (conMarca.has(n)) r.rect(cx - 1, cy + 6, 2, 2, SELLO);
    }

    // Al costado: hoy, y lo que viene.
    const lx = gx + CELDA.w * 7 + 16, ancho = x + HOJA.w - 14 - lx;
    const parte = Tt.partesMin[TIEMPO.partes[t.parte]];
    r.text(C.hoy(Tt.fecha(hoy.dia, Tt.meses[hoy.mes]), parte), lx, y + 20, TINTA, 'left', sinHalo);
    r.text(C.viene, lx, y + 40, TINTA_SUAVE, 'left', sinHalo);
    r.rect(lx, y + 46, ancho, 1, PAPEL_SUCIO);
    // (✉️ La noche de J.Mc. se anota siempre, aunque falte más que eso.)
    const proximas = marcas.filter((x2) => x2.que === 'jmc' || x2.dia - t.dia <= TIEMPO.avisoDias);
    if (!proximas.length) r.text(C.vieneNada, lx, y + 56, TINTA_SUAVE, 'left', sinHalo);
    proximas.slice(0, 8).forEach((mk, i) => {
      const f = fechaDe(mk.dia);
      const que = mk.que === 'secura' ? Tt.secura(MIEMBRO[mk.quien].corto) : mk.que === 'jmc' ? Tt.jmc : mk.que;
      r.text(`${f.dia} ${Tt.meses[f.mes].slice(0, 3)}.`, lx, y + 56 + i * 12, SELLO, 'left', sinHalo);
      r.text(que, lx + 34, y + 56 + i * 12, TINTA, 'left', sinHalo);
    });

    r.text(C.ayuda, x + HOJA.w - 10, y + HOJA.h - 9, TINTA_SUAVE, 'right', { tam: 7, halo: null });
  }

  /** Un círculo hecho a mano con tinta: un óvalo de puntos, apenas abierto arriba (como uno trazado con pluma). */
  function circulo(r, cx, cy, rx, ry, tinta) {
    for (let a = 0.35; a < Math.PI * 2 + 0.1; a += 0.12) {
      r.rect(Math.round(cx + Math.cos(a - Math.PI / 2) * rx), Math.round(cy + Math.sin(a - Math.PI / 2) * ry), 1, 1, tinta);
    }
  }

  return { abrir, cerrar, activo, update, render };
}
