/**
 * 📋 LA FICHA DE LA BANDA *(Santi, 2026-11-15: "dale, hacé las fichas primero")*: [TAB] en el campamento.
 *
 * Un papel de época, como el del diálogo (engine/menu.js), con uno de la banda por hoja: su cara agrandada, su nombre,
 * cómo está con vos (la lealtad) y cómo anda hoy (el humor), en palabras, y sus rasgos como sellos de tinta; la tinta
 * de cada sello dice qué tan fuerte es (ver `nivelDeMarca` en data/rasgos.js): fuerte, gris o casi blanca.
 *
 * 🔖 🔁 Desde 2026-11-23 los dos tipos se distinguen *(Santi: "los rasgos ponelos como sellos de tinta con un dibujo si
 * es habilidad y si es de personalidad la letra en mayúscula y al pasar el cursor por encima te dice que es ese rasgo y
 * brevemente que hace")*: la habilidad, un sello redondo con su dibujo (data/sellos.js); la personalidad, un sello con
 * el nombre en mayúsculas. Antes iban iguales, "disfrazados de lo mismo". Con el mouse encima, el cartelito.
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
import { nivelDeMarca, palabraDeHumor, esPersonalidad, ANIMO, BAJA } from '../data/rasgos.js';
import { contadorDe } from '../systems/animo.js';
import { marcasDe } from '../systems/animo.js';
import { T } from '../text/es.js';
import { LEALTAD5 } from '../data/libreta.js';
import { gameState } from '../state/gameState.js';
import { senalDe, topeDeTentacion } from '../systems/tentacion.js';
import { TENTACION } from '../data/tentacion.js';
import { DIBUJO_DE_SELLO } from '../data/sellos.js';
import { CONFIG } from '../data/config.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';

/** Un punto de la grilla, en unidades (los sellos se dibujan de a puntos, como todo). */
const P = CONFIG.estilo.punto / 4;
/** 🔖 El sello de una habilidad: un aro de `aro` puntos de diámetro con el dibujo de 13×13 en el medio. */
const ARO = 21;
/** 🔖 La letra de los sellos de personalidad: mayúsculas de imprenta, gruesas, como las de un sello de goma. */
const LETRA_SELLO = { fuente: 'Georgia, "Times New Roman", serif', estilo: 'bold' };
/** 🔖 El cartelito: su ancho y los colores (van en la capa fina, como las letras de la franja del diálogo). */
const CARTELITO = { ancho: 150, nombre: '#c0553a', tipo: '#8a7d66', texto: '#ddd0b4' };
/** (Un número de 0 a 1 que sale siempre igual para el mismo punto del mismo sello: lo gastado no titila.) */
function azarFijo(a, b, c) {
  let h = Math.imul(a * 73856093 ^ b * 19349663 ^ c * 83492791, 2654435761);
  h ^= h >>> 15;
  return ((h >>> 0) % 1000) / 1000;
}
function semillaDeRasgo(t) { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return h; }

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
    // (🔖 Dónde está el mouse, para el cartelito de los sellos.)
    if (abierta && input.mouse) abierta.raton = { x: input.mouse.x, y: input.mouse.y };
    if (input.wasPressed('Escape') || input.wasPressed('Tab')) cerrar();
    return true;
  }

  function render(r, banda) {
    if (!abierta) return;
    const id = abierta.ids[abierta.i], m = MIEMBRO[id], e = banda[id];
    if (!m || !e) return;
    const B = T.camp.banda, F = B.ficha, sinHalo = { halo: false };

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
    r.text(m.nombre, tx, y + 22, SELLO, 'left', { tam: 12, halo: false });
    r.rect(tx, y + 31, r.medir(m.nombre, 12) + 4, 1, TINTA_SUAVE);
    // De cuántas hojas.
    r.text(`${abierta.i + 1} / ${abierta.ids.length}`, x + HOJA.w - 14, y + 16, TINTA_SUAVE, 'right', { tam: 7, halo: false });

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
    // 😈 La tentación: un triangulito por punto, llenos los que tiene (hasta 4; 5 en la montaña). Y la señal: si no se
    // sabe cuál de los dos es, con signo de pregunta.
    if (TENTACION.activa && e.tentacion != null) {
      const TF = T.tentacion.ficha, tope = topeDeTentacion(gameState);
      r.text(TF.tentacion, tx, y + 74, TINTA_SUAVE, 'left', sinHalo);
      for (let k = 0; k < tope; k++) triangulito(r, tx + 52 + k * 8, y + 71, k < e.tentacion);
      const s = senalDe(gameState, id);
      if (s) r.text(s.oculta ? TF.duda : TF.senal, tx + 52 + tope * 8 + 4, y + 74, SELLO, 'left', { tam: 7, halo: false });
    }

    // Los rasgos: sellos de tinta, uno al lado del otro, y bajan de renglón cuando no entran.
    const ry0 = y + 14 + CARA.lado + 16;
    r.text(F.rasgos, x + 14, ry0, TINTA_SUAVE, 'left', sinHalo);
    r.rect(x + 14, ry0 + 6, HOJA.w - 28, 1, PAPEL_SUCIO);
    let sx = x + 14, sy = ry0 + 14;
    const zonas = [];
    for (const [rasgo, fuerza] of Object.entries(e.rasgos || {})) {
      // (🙂 De las habilidades, sólo las que tiene hoy: las que perdió o está aprendiendo no se ven.)
      const h = !esPersonalidad(rasgo) && e.habilidades ? e.habilidades[rasgo] : null;
      if (!esPersonalidad(rasgo) && e.habilidades && !(h && h.tiene)) continue;
      const nombre = T.rasgos[rasgo] || rasgo;
      const tinta = TINTA_DE[nivelDeMarca(rasgo, fuerza)];
      // (⭐ La que domina lleva su estrellita en la punta del sello *(Santi: "pasa a tener una estrellita")*.)
      const estrella = !!(h && h.estrella);
      // (🟤 ■■■□□ La que se está oxidando lleva sus marcas en la punta, como los cuadraditos de la lealtad: las que le
      // quedan llenas, la media llena hasta la mitad.)
      const M = ANIMO.habilidad.marcas, marcas = h && M.activo && !estrella ? marcasDe(e, rasgo) : null;
      const oxida = marcas != null && marcas < M.total;
      // (🎚️ □■■□ La personalidad que contradijiste: un cuadradito lleno por vez, de `BAJA.cada` − 1; a la siguiente baja.)
      const contra = esPersonalidad(rasgo) ? contadorDe(e, rasgo) : 0;
      const nc = BAJA.cada - 1;
      const extra = estrella ? 8 : oxida ? 6 * M.total + 2 : contra ? 6 * nc + 2 : 0;
      // 🔖 La habilidad, redonda con su dibujo; la personalidad, con el nombre en mayúsculas.
      const habil = !esPersonalidad(rasgo) && !!DIBUJO_DE_SELLO[rasgo];
      const mayus = nombre.toUpperCase(), L = { halo: false, tam: 7, letra: LETRA_SELLO };
      const h2 = ARO * P, w = habil ? ARO * P + (extra ? extra + 2 : 0) : Math.ceil(r.medir(mayus, 7, LETRA_SELLO)) + 14 + extra;
      if (sx + w > x + HOJA.w - 14) { sx = x + 14; sy += h2 + 6; }
      const semilla = semillaDeRasgo(rasgo);
      if (habil) selloDeHabilidad(r, sx, sy, rasgo, tinta, semilla);
      else {
        selloDePersonalidad(r, sx, sy, w - extra, h2, tinta, semilla);
        r.text(mayus, sx + (w - extra) / 2, sy + h2 / 2 + 0.5, tinta, 'center', L);
        gastarLetras(r, sx + 3, sy + 3, w - extra - 6, h2 - 6, semilla);
      }
      zonas.push({ x: sx, y: sy, w, h: h2, rasgo, habil, nombre });
      if (estrella) estrellita(r, sx + w - 11, sy + 5, SELLO);
      if (contra) for (let k = 0; k < nc; k++) {
        const mx = sx + w - 7 - 6 * (nc - 1 - k) - 4, my = sy + 5;
        if (k < contra) r.rect(mx, my, 5, 5, SELLO);
        else { r.rect(mx, my, 5, 1, TINTA_SUAVE); r.rect(mx, my + 4, 5, 1, TINTA_SUAVE); r.rect(mx, my, 1, 5, TINTA_SUAVE); r.rect(mx + 4, my, 1, 5, TINTA_SUAVE); }
      }
      if (oxida) for (let k = 0; k < M.total; k++) {
        const mx = sx + w - 7 - 6 * (M.total - 1 - k) - 4, my = sy + 5, lleno = marcas - k;
        if (lleno >= 1) r.rect(mx, my, 5, 5, SELLO);
        else {
          r.rect(mx, my, 5, 1, TINTA_SUAVE); r.rect(mx, my + 4, 5, 1, TINTA_SUAVE); r.rect(mx, my, 1, 5, TINTA_SUAVE); r.rect(mx + 4, my, 1, 5, TINTA_SUAVE);
          if (lleno > 0) r.rect(mx, my + 2, 5, 3, SELLO);
        }
      }
      sx += w + 8;
    }
    abierta.zonas = zonas;

    // 📒 La libreta: los favores a la izquierda, las quejas a la derecha, de la más nueva a la más vieja.
    if (e.libreta) {
      const ly = y + 146, col = (HOJA.w - 28) / 2;
      r.text(F.libreta, x + 14, ly, TINTA_SUAVE, 'left', sinHalo);
      r.rect(x + 14, ly + 6, HOJA.w - 28, 1, PAPEL_SUCIO);
      const columna = (titulo, lista, cx, lado) => {
        r.text(titulo, cx, ly + 15, lado === 'f' ? TINTA : SELLO, 'left', { tam: 7, halo: false });
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

    r.text(F.ayuda, x + HOJA.w - 10, y + HOJA.h - 9, TINTA_SUAVE, 'right', { tam: 7, halo: false });

    // 🔖 Con el mouse encima de un sello: qué es y qué hace.
    const m2 = abierta.raton, z = m2 && zonas.find((q) => m2.x >= q.x && m2.x <= q.x + q.w && m2.y >= q.y && m2.y <= q.y + q.h);
    if (z) cartelito(r, z, m2);
  }

  /**
   * 🔖 EL CARTELITO DE UN SELLO: una tira oscura, como la del diálogo, con el nombre en mayúsculas, si es habilidad o
   * personalidad, y lo que hace (T.rasgosQueHace). Abajo del sello, corrido para que no se salga de la pantalla.
   */
  function cartelito(r, z, raton) {
    const Q = T.rasgosQueHace, C = CARTELITO, letra = { fuente: 'Georgia, "Times New Roman", serif', estilo: '' };
    const texto = Q[z.rasgo] || '', ancho = C.ancho;
    const renglones = [];
    let linea = '';
    for (const palabra of texto.split(' ')) {
      const prueba = linea ? linea + ' ' + palabra : palabra;
      if (linea && r.medir(prueba, 7, letra) > ancho - 12) { renglones.push(linea); linea = palabra; } else linea = prueba;
    }
    if (linea) renglones.push(linea);
    const h = 18 + renglones.length * 9;
    const cx = Math.max(4, Math.min(r.width - ancho - 4, raton.x + 6));
    let cy = z.y + z.h + 4;
    if (cy + h > r.height - 4) cy = z.y - h - 4;
    estiloNuevo.borrarGente(r.ctx, cx, cy, ancho, h, true);
    // (Negro entero: con transparencia, la paleta lo pasaba a azul.)
    r.rect(cx, cy, ancho, h, PALETA[0]);
    r.rect(cx, cy, ancho, P, PALETA[34]);
    const sin = { halo: false, letra };
    r.text(z.nombre.toUpperCase(), cx + 6, cy + 8, C.nombre, 'left', { ...sin, tam: 7, letra: LETRA_SELLO });
    r.text(Q.tipo[z.habil ? 'habilidad' : 'personalidad'], cx + ancho - 6, cy + 8, C.tipo, 'right', { ...sin, tam: 6 });
    renglones.forEach((t, i) => r.text(t, cx + 6, cy + 19 + i * 9, C.texto, 'left', { ...sin, tam: 7 }));
  }

  /** 🔖 El sello de una habilidad: el aro de tinta y el dibujo adentro, con puntos que no agarraron tinta. */
  function selloDeHabilidad(r, sx, sy, rasgo, tinta, semilla) {
    const x0 = Math.round(sx / P) * P, y0 = Math.round(sy / P) * P, c = (ARO - 1) / 2;
    for (let j = 0; j < ARO; j++) for (let i = 0; i < ARO; i++) {
      const d = Math.hypot(i - c, j - c);
      if (d >= c - 1.2 && d <= c + 0.4 && azarFijo(i, j, semilla) > 0.1) r.rect(x0 + i * P, y0 + j * P, P, P, tinta);
    }
    const D = DIBUJO_DE_SELLO[rasgo], o = (ARO - 13) / 2;
    D.forEach((fila, j) => { for (let i = 0; i < 13; i++) if (fila[i] === '#' && azarFijo(i + 40, j, semilla) > 0.08) r.rect(x0 + (o + i) * P, y0 + (o + j) * P, P, P, tinta); });
  }

  /** 🔖 El sello de una personalidad: el marco grueso de un sello de goma, gastado en algunos puntos. */
  function selloDePersonalidad(r, sx, sy, w, h, tinta, semilla) {
    const x0 = Math.round(sx / P) * P, y0 = Math.round(sy / P) * P, cols = Math.round(w / P), filas = Math.round(h / P);
    for (let j = 0; j < filas; j++) for (let i = 0; i < cols; i++) {
      const borde = i < 2 || j < 2 || i >= cols - 2 || j >= filas - 2;
      if (borde && azarFijo(i, j, semilla) > 0.12) r.rect(x0 + i * P, y0 + j * P, P, P, tinta);
    }
  }

  /** 🔖 Lo gastado de las letras de un sello: puntitos de papel encima, en la capa de las letras. */
  function gastarLetras(r, x, y, w, h, semilla) {
    const fino = estiloNuevo.lienzoFino(r.ctx);
    if (fino === r.ctx) return;
    fino.save();
    fino.fillStyle = PALETA[37];
    for (let k = 0; k < Math.round(w / 3); k++) {
      fino.fillRect(x + azarFijo(k, 1, semilla) * w, y + azarFijo(k, 2, semilla) * h, 0.5, 0.5);
    }
    fino.restore();
  }

  /** 📒 El texto de una línea de la libreta. */
  function textoDe(motivo, lado) {
    const L = T.libreta.motivos, m = L[motivo];
    const t = m && (typeof m === 'string' ? m : m[lado]);
    return t || (lado === 'f' ? L.otroFavor : L.otraQueja);
  }

  /** 😈 Un triangulito de 5×4 puntos, a mano: lleno o sólo el borde. */
  function triangulito(r, ex, ey, lleno) {
    const MAPA = lleno ? ['..#..', '.###.', '.###.', '#####'] : ['..#..', '.#.#.', '.#.#.', '#####'];
    MAPA.forEach((fila, j) => { for (let i = 0; i < 5; i++) if (fila[i] === '#') r.rect(ex + i, ey + j, 1, 1, lleno ? SELLO : TINTA_SUAVE); });
  }

  /** ⭐ La estrellita, de 5×5 puntos, dibujada a mano: la punta arriba, los brazos y las dos patas. */
  function estrellita(r, ex, ey, tinta) {
    const MAPA = ['..#..', '#####', '.###.', '.#.#.', '#...#'];
    MAPA.forEach((fila, j) => { for (let i = 0; i < 5; i++) if (fila[i] === '#') r.rect(ex + i, ey + j, 1, 1, tinta); });
  }

  return { abrir, cerrar, activa, update, render };
}
