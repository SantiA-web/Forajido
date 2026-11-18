/**
 * 📋 LA FICHA DE LA BANDA *(Santi, 2026-11-15: "dale, hacé las fichas primero")*: [TAB] en el campamento.
 *
 * Un papel de época, como el del diálogo (engine/menu.js), con uno de la banda por hoja: su cara agrandada, su nombre,
 * cómo está con vos (la lealtad) y cómo anda hoy (el humor), en palabras, y sus rasgos como sellos de tinta. Los
 * rasgos van todos iguales, sin decir cuáles son habilidades y cuáles personalidad *(Santi: "disfrazados de lo
 * mismo")*; la tinta de cada sello dice qué tan fuerte es (ver `nivelDeMarca` en data/rasgos.js): fuerte, gris o casi
 * blanca.
 *
 * 🙂 🔁 Desde 2026-11-15 se mueve de verdad (systems/animoEnJuego.js): las habilidades que pierde no se ven, y la que domina lleva su estrellita (se equilibran en el
 * simulador; ver BRUJULA.md, "Rasgos, lealtad y humor").
 *
 * 📒 Desde la etapa 2 de BANDA-NUEVA.md: la lealtad en cinco marcas (y su palabra), el ánimo, y abajo la libreta con
 * sus favores y sus quejas, cada una con su motivo (las chicas, las que no son por algo que hiciste tú, con un ○).
 *
 * Mientras está abierta no te movés, igual que con el diálogo.
 */

import { PALETA } from '../engine/paleta.js';
import { papel, cara, TINTAS } from '../engine/menu.js';
import { MIEMBRO, palabraDe } from '../data/banda.js';
import { nivelDeMarca, palabraDeHumor, esPersonalidad } from '../data/rasgos.js';
import { T } from '../text/es.js';
import { LEALTAD5 } from '../data/libreta.js';

const { TINTA, TINTA_SUAVE, SELLO, PAPEL_SUCIO } = TINTAS;
/** La tinta de cada sello según qué tan fuerte es el rasgo *(Santi: "gris… y más blanca")*. */
const TINTA_DE = { fuerte: TINTA, gris: PALETA[24], blanca: PALETA[25] };
/** El papel, centrado; la cara, agrandada ×5 (un poco más que en el diálogo, que es más bajo). */
// (📒 🔁 152 → 214 de alto: abajo va la libreta.)
const HOJA = { w: 300, h: 214 }, CARA = { lado: 64, escala: 5 };
/** 🌉 El humor de antes (una copia del ánimo, ver systems/libreta.js) → la palabra del ánimo. */
const ANIMO_DE = { contento: 'conGanas', tranquilo: 'tranquilo', deMalas: 'deMalas', furioso: 'furioso' };

export function crearFicha(audio) {
  let abierta = null;   // { ids, i, figuraDe }

  /** `ids`: los de la banda que se muestran, en orden; `figuraDe(id)`: cómo se dibuja cada uno (la cara). */
  function abrir(ids, i = 0, figuraDe = () => null) {
    if (!ids.length) return false;
    abierta = { ids, i: Math.max(0, Math.min(ids.length - 1, i)), figuraDe };
    audio.play('cock');
    return true;
  }
  function cerrar() { abierta = null; }
  function activa() { return !!abierta; }

  /** Devuelve true mientras está abierta (así la escena no mueve al jugador). */
  function update(input) {
    if (!abierta) return false;
    const n = abierta.ids.length;
    if (input.wasPressed('KeyA') || input.wasPressed('ArrowLeft')) { abierta.i = (abierta.i - 1 + n) % n; audio.play('cock'); }
    if (input.wasPressed('KeyD') || input.wasPressed('ArrowRight')) { abierta.i = (abierta.i + 1) % n; audio.play('cock'); }
    if (input.wasPressed('Escape') || input.wasPressed('Tab')) cerrar();
    return true;
  }

  function render(r, banda) {
    if (!abierta) return;
    const id = abierta.ids[abierta.i], m = MIEMBRO[id], e = banda[id];
    if (!m || !e) return;
    const B = T.camp.banda, F = B.ficha, sinHalo = { halo: null };

    // El mundo, más oscuro detrás: la hoja es lo que importa.
    r.ctx.globalAlpha = 0.5;
    r.rect(0, 0, r.width, r.height, PALETA[0]);
    r.ctx.globalAlpha = 1;

    const x = Math.round((r.width - HOJA.w) / 2), y = Math.round((r.height - HOJA.h) / 2);
    papel(r, x, y, HOJA.w, HOJA.h);

    // La cara.
    const dibujar = abierta.figuraDe(id);
    if (dibujar) cara(r, dibujar, x + 14, y + 14, CARA.lado, CARA.lado, CARA.escala);

    // El nombre, en tinta de sello, con su raya.
    const tx = x + 14 + CARA.lado + 14;
    r.text(m.nombre, tx, y + 22, SELLO, 'left', { tam: 12, halo: null });
    r.rect(tx, y + 31, r.medir(m.nombre, 12) + 4, 1, TINTA_SUAVE);
    // De cuántas hojas.
    r.text(`${abierta.i + 1} / ${abierta.ids.length}`, x + HOJA.w - 14, y + 16, TINTA_SUAVE, 'right', { tam: 7, halo: null });

    // Cómo está con vos y cómo anda hoy, en palabras.
    const renglon = (etiqueta, valor, ry) => {
      r.text(etiqueta, tx, ry, TINTA_SUAVE, 'left', sinHalo);
      r.text(valor, tx + 52, ry, TINTA, 'left', sinHalo);
    };
    renglon(F.lealtad, B.palabras[palabraDe(e)], y + 46);
    // (📒 La lealtad de 0 a 5, en marcas: llenas las que tiene.)
    if (e.lealtad5) {
      const mx = tx + 52 + Math.ceil(r.medir(B.palabras[palabraDe(e)])) + 8;
      for (let k = 0; k < LEALTAD5.max; k++) {
        const cx = mx + k * 8, cy = y + 43;
        if (k < e.lealtad) r.rect(cx, cy, 5, 5, SELLO);
        else { r.rect(cx, cy, 5, 1, TINTA_SUAVE); r.rect(cx, cy + 4, 5, 1, TINTA_SUAVE); r.rect(cx, cy, 1, 5, TINTA_SUAVE); r.rect(cx + 4, cy, 1, 5, TINTA_SUAVE); }
      }
    }
    const h = palabraDeHumor(e.humor ?? 50);
    renglon(F.humor, e.libreta ? T.libreta.animo[ANIMO_DE[h]] : B.humor[h], y + 60);

    // Los rasgos: sellos de tinta, uno al lado del otro, y bajan de renglón cuando no entran.
    const ry0 = y + 14 + CARA.lado + 16;
    r.text(F.rasgos, x + 14, ry0, TINTA_SUAVE, 'left', sinHalo);
    r.rect(x + 14, ry0 + 6, HOJA.w - 28, 1, PAPEL_SUCIO);
    let sx = x + 14, sy = ry0 + 14;
    for (const [rasgo, fuerza] of Object.entries(e.rasgos || {})) {
      // (🙂 De las habilidades, sólo las que tiene hoy: las que perdió o está aprendiendo no se ven.)
      const h = !esPersonalidad(rasgo) && e.habilidades ? e.habilidades[rasgo] : null;
      if (!esPersonalidad(rasgo) && e.habilidades && !(h && h.tiene)) continue;
      const nombre = T.rasgos[rasgo] || rasgo;
      const tinta = TINTA_DE[nivelDeMarca(rasgo, fuerza)];
      // (⭐ La que domina lleva su estrellita en la punta del sello *(Santi: "pasa a tener una estrellita")*.)
      const estrella = !!(h && h.estrella);
      const w = Math.ceil(r.medir(nombre)) + 12 + (estrella ? 8 : 0), h2 = 15;
      if (sx + w > x + HOJA.w - 14) { sx = x + 14; sy += h2 + 6; }
      sello(r, sx, sy, w, h2, tinta);
      r.text(nombre, sx + (w - (estrella ? 8 : 0)) / 2, sy + h2 / 2 + 0.5, tinta, 'center', sinHalo);
      if (estrella) estrellita(r, sx + w - 11, sy + 5, SELLO);
      sx += w + 8;
    }

    // 📒 La libreta: los favores a la izquierda, las quejas a la derecha, de la más nueva a la más vieja.
    if (e.libreta) {
      const ly = y + 146, col = (HOJA.w - 28) / 2;
      r.text(F.libreta, x + 14, ly, TINTA_SUAVE, 'left', sinHalo);
      r.rect(x + 14, ly + 6, HOJA.w - 28, 1, PAPEL_SUCIO);
      const columna = (titulo, lista, cx, lado) => {
        r.text(titulo, cx, ly + 15, lado === 'f' ? TINTA : SELLO, 'left', { tam: 7, halo: null });
        if (!lista.length) r.text(F.nada, cx + 7, ly + 26, TINTA_SUAVE, 'left', sinHalo);
        lista.slice().reverse().forEach((l, k) => {
          const yy = ly + 26 + k * 11;
          // (○ La chica: un aro de 4×4.)
          if (l.chica) { r.rect(cx, yy - 2, 4, 1, TINTA_SUAVE); r.rect(cx, yy + 1, 4, 1, TINTA_SUAVE); r.rect(cx, yy - 2, 1, 4, TINTA_SUAVE); r.rect(cx + 3, yy - 2, 1, 4, TINTA_SUAVE); }
          // (En la letra de siempre: en la chica, la de 7, se borroneaba.)
          r.text(textoDe(l.motivo, lado), cx + 7, yy, TINTA, 'left', sinHalo);
        });
      };
      columna(F.favores, e.libreta.favores, x + 14, 'f');
      columna(F.quejas, e.libreta.quejas, x + 14 + col + 4, 'q');
    }

    r.text(F.ayuda, x + HOJA.w - 10, y + HOJA.h - 9, TINTA_SUAVE, 'right', { tam: 7, halo: null });
  }

  /** 📒 El texto de una línea de la libreta. */
  function textoDe(motivo, lado) {
    const L = T.libreta.motivos, m = L[motivo];
    const t = m && (typeof m === 'string' ? m : m[lado]);
    return t || (lado === 'f' ? L.otroFavor : L.otraQueja);
  }

  /** ⭐ La estrellita, de 5×5 puntos, dibujada a mano: la punta arriba, los brazos y las dos patas. */
  function estrellita(r, ex, ey, tinta) {
    const MAPA = ['..#..', '#####', '.###.', '.#.#.', '#...#'];
    MAPA.forEach((fila, j) => { for (let i = 0; i < 5; i++) if (fila[i] === '#') r.rect(ex + i, ey + j, 1, 1, tinta); });
  }

  /** Un sello de goma: el marco doble, con una punta gastada (que no salga perfecto, como un sello de verdad). */
  function sello(r, sx, sy, w, h, tinta) {
    r.rect(sx, sy, w, 1, tinta);
    r.rect(sx, sy + h - 1, w, 1, tinta);
    r.rect(sx, sy, 1, h, tinta);
    r.rect(sx + w - 1, sy, 1, h, tinta);
    // La línea de adentro, cortada en una punta.
    r.rect(sx + 2, sy + 2, w - 7, 1, tinta);
    r.rect(sx + 2, sy + h - 3, w - 4, 1, tinta);
    r.rect(sx + 2, sy + 2, 1, h - 4, tinta);
    r.rect(sx + w - 3, sy + 5, 1, h - 7, tinta);
  }

  return { abrir, cerrar, activa, update, render };
}
