/**
 * 💰 LA PANTALLA DEL REPARTO, POR CABEZA *(BANDA-NUEVA.md, "El reparto: por cabeza"; Santi, 2026-11-18: "quiero que
 * la codicia pague en este juego al largo plazo y premie al que cuida de los suyos (Micah vs Arthur Morgan)")*.
 *
 * Se abre sola al volver al campamento de un asalto con botín (lo deja anotado scenes/resultsScene.js en
 * `campamento.reparto`). Un papel como el de la ficha, con uno de la banda por renglón: qué hizo (fue a un papel o se
 * quedó), cuánto espera, cuánto le das, y LO QUE VA A ANOTAR si le das eso, antes de confirmar. Así nadie se enoja
 * "de la nada": ves la queja antes de dejarlo con poco.
 *  - [1] LO QUE ESPERAN, [2] GENEROSO (un cuarto más), [3] NADA: para todos de una.
 *  - [W][S] elegir a uno, [A][D] de a $5 (nunca más de lo que tienes).
 *  - [E] reparte: la plata sale de tu bolsa y cada uno anota en su libreta (systems/libreta.js, `repartir`).
 * No se puede cerrar sin repartir: el botín se reparte siempre al volver (darle nada a todos también es repartir).
 * Los números, en `REPARTO` (data/libreta.js); los textos, en `T.libreta.reparto`.
 */

import { PALETA } from '../engine/paleta.js';
import { papel, cara, TINTAS } from '../engine/menu.js';
import { BANDA, MIEMBRO } from '../data/banda.js';
import { REPARTO } from '../data/libreta.js';
import { esperaDe, generosoDe, consecuenciaDelReparto, repartir, cuotaDeJmc, cobrarJmc, pagarOllaDeLaVuelta, ollaDeLaVuelta } from '../systems/libreta.js';
import { T } from '../text/es.js';
import { despuesDelReparto } from '../systems/fogata.js';

const { TINTA, TINTA_SUAVE, SELLO, PAPEL_SUCIO, PAPEL_CLARO } = TINTAS;
/** El papel: el ancho fijo; el alto, según cuántos son. Las columnas, desde el borde izquierdo. */
// (🔁 400 → 460 de ancho: "Queja: Ya no me das como antes" se salía del papel.)
const HOJA = { w: 460, arriba: 54, renglon: 36, abajo: 42 };
const COL = { nombre: 52, espera: 172, leDas: 216, anota: 266 };
const CARA = { lado: 30, escala: 3 };

export function crearReparto(audio) {
  let abierto = null;   // { filas, i, botin, figuraDe, alListo }

  /**
   * `g`: el gameState (con `campamento.reparto`); `figuraDe(id)`: cómo se dibuja cada uno; `alListo(anotes, total)`:
   * lo que pasa al repartir (decirlo). Devuelve false si no hay a quién repartirle (y deja el reparto hecho).
   */
  function abrir(g, figuraDe, alListo) {
    const pend = g.campamento && g.campamento.reparto;
    if (!pend) return false;
    const fueron = pend.fueron || {};
    // (Los que están en el campamento: el preso no cobra; el que se fue, tampoco.)
    const filas = BANDA.map((m) => m.id).filter((id) => g.banda && g.banda[id] && g.banda[id].esta).map((id) => {
      const fue = !!fueron[id], espera = esperaDe(g.banda[id], fue, pend.botin);
      return { id, papel: fueron[id] || null, fue, espera, da: espera };
    });
    // (Nadie a quien repartirle: J.Mc. cobra igual.)
    if (!filas.length) { g.campamento.reparto = null; pagarOllaDeLaVuelta(g, g.tiempo ? g.tiempo.dia : 0); cobrarJmc(g); return false; }
    abierto = { filas, i: 0, botin: pend.botin, figuraDe, alListo, g };
    ajustarAlaBolsa();
    audio.play('cock');
    return true;
  }
  function activa() { return !!abierto; }

  /** Lo que les das entre todos. */
  function total() { return abierto.filas.reduce((s, f) => s + f.da, 0); }
  /** Que nunca sumen más de lo que tienes (se recorta de abajo para arriba). */
  function ajustarAlaBolsa() {
    let sobra = total() - abierto.g.money;
    for (let k = abierto.filas.length - 1; k >= 0 && sobra > 0; k--) {
      const f = abierto.filas[k], saca = Math.min(f.da, sobra);
      f.da -= saca; sobra -= saca;
    }
  }
  function paraTodos(cuanto) {
    for (const f of abierto.filas) f.da = cuanto(f);
    ajustarAlaBolsa();
    audio.play('cock');
  }

  /** Devuelve true mientras está abierta (así la escena no mueve al jugador). */
  function update(input) {
    if (!abierto) return false;
    const n = abierto.filas.length, f = abierto.filas[abierto.i];
    const p = (...k) => k.some((c) => input.wasPressed(c));
    if (p('KeyW', 'ArrowUp')) { abierto.i = (abierto.i - 1 + n) % n; audio.play('cock'); }
    if (p('KeyS', 'ArrowDown')) { abierto.i = (abierto.i + 1) % n; audio.play('cock'); }
    if (p('KeyA', 'ArrowLeft') && f.da > 0) { f.da = Math.max(0, f.da - REPARTO.paso); audio.play('cock'); }
    if (p('KeyD', 'ArrowRight')) {
      const puede = abierto.g.money - (total() - f.da);
      if (f.da < puede) { f.da = Math.min(puede, f.da + REPARTO.paso); audio.play('cock'); }
    }
    if (p('Digit1', 'Numpad1')) paraTodos((x) => x.espera);
    if (p('Digit2', 'Numpad2')) paraTodos((x) => generosoDe(x.espera));
    if (p('Digit3', 'Numpad3')) paraTodos(() => 0);
    if (p('KeyE', 'Enter', 'Space')) confirmar();
    return true;
  }

  function confirmar() {
    const { g, filas, alListo } = abierto, t = total();
    const anotes = repartir(g, filas);
    // 🔥 (A uno un cuarto más de lo que esperaba y al otro lo esperado o menos: se llevan peor. Ver data/fogata.js.)
    despuesDelReparto(g, filas, generosoDe);
    // 🍲 Después del reparto, la olla de los días de la vuelta (como en el simulador).
    const olla = pagarOllaDeLaVuelta(g, g.tiempo ? g.tiempo.dia : 0);
    // ✉️ Y al final, J.Mc. se lleva su cuota (lo que falte, queda como deuda).
    const jmc = cobrarJmc(g);
    g.campamento.reparto = null;
    abierto = null;
    audio.play('cover');
    if (alListo) alListo(anotes, t, jmc, olla);
  }

  function render(r) {
    if (!abierto) return;
    const R = T.libreta.reparto, sinHalo = { halo: null }, { filas, g } = abierto;
    const alto = HOJA.arriba + filas.length * HOJA.renglon + HOJA.abajo;

    r.ctx.globalAlpha = 0.5;
    r.rect(0, 0, r.width, r.height, PALETA[0]);
    r.ctx.globalAlpha = 1;

    const x = Math.round((r.width - HOJA.w) / 2), y = Math.round((r.height - alto) / 2);
    papel(r, x, y, HOJA.w, alto);

    // El título, en tinta de sello, y el botín.
    r.text(R.titulo, x + 14, y + 17, SELLO, 'left', { tam: 12, halo: null });
    r.rect(x + 14, y + 26, r.medir(R.titulo, 12) + 4, 1, TINTA_SUAVE);
    // (El botín y tu bolsa, arriba a la derecha: abajo se pisaban con los botones.)
    r.text(R.botin(abierto.botin), x + HOJA.w - 14, y + 14, TINTA, 'right', sinHalo);
    // (✉️ 🍲 Lo que te queda, ya con la olla de la vuelta y lo de J.Mc. Si no alcanza para la olla, no se paga.)
    const olla = ollaDeLaVuelta(g), quedan = g.money - total(), comen = quedan >= olla;
    const cuota = cuotaDeJmc(g, comen ? quedan - olla : quedan);
    r.text(R.bolsa(g.money, (comen ? quedan - olla : quedan) - cuota.lleva), x + HOJA.w - 14, y + 27, TINTA_SUAVE, 'right', sinHalo);

    // Las columnas. (En la letra de siempre: en la de 7 se borroneaba.)
    const cy = y + 42;
    r.text(R.espera, x + COL.espera, cy, TINTA_SUAVE, 'left', sinHalo);
    r.text(R.leDas, x + COL.leDas, cy, TINTA_SUAVE, 'left', sinHalo);
    r.text(R.anota, x + COL.anota, cy, TINTA_SUAVE, 'left', sinHalo);
    r.rect(x + 14, cy + 5, HOJA.w - 28, 1, PAPEL_SUCIO);

    filas.forEach((f, k) => {
      const y0 = y + HOJA.arriba + k * HOJA.renglon, e = g.banda[f.id], elegido = k === abierto.i;
      // (El elegido, con el papel más claro detrás: como un renglón marcado con el dedo.)
      if (elegido) r.rect(x + 8, y0 - 1, HOJA.w - 16, HOJA.renglon - 2, PAPEL_CLARO);
      const dibujar = abierto.figuraDe(f.id);
      if (dibujar) cara(r, dibujar, x + 14, y0 + 1, CARA.lado, CARA.lado, CARA.escala);
      r.text(MIEMBRO[f.id].nombre, x + COL.nombre, y0 + 10, SELLO, 'left', sinHalo);
      r.text(f.fue ? R.fue[f.papel] || R.fue.caballos : R.quedo, x + COL.nombre, y0 + 23, TINTA_SUAVE, 'left', sinHalo);
      r.text('$' + f.espera, x + COL.espera, y0 + 16, TINTA_SUAVE, 'left', sinHalo);
      // Lo que le das, con sus flechitas si es el elegido.
      const monto = '$' + f.da, mw = Math.ceil(r.medir(monto));
      r.text(monto, x + COL.leDas + 6, y0 + 16, TINTA, 'left', sinHalo);
      if (elegido) {
        flecha(r, x + COL.leDas, y0 + 13, -1, f.da > 0 ? TINTA : PAPEL_SUCIO);
        flecha(r, x + COL.leDas + 6 + mw + 3, y0 + 13, 1, TINTA);
      }
      // Lo que va a anotar si le das eso.
      const cons = consecuenciaDelReparto(e, f.fue, f.espera, f.da);
      if (!cons.length) r.text(R.nada, x + COL.anota, y0 + 16, TINTA_SUAVE, 'left', sinHalo);
      cons.slice(0, 2).forEach((c, j) => {
        const yy = cons.length === 1 ? y0 + 16 : y0 + 10 + j * 13;
        const texto = T.libreta.motivos[c.motivo];
        const t = !c.lado ? R.loEspera : c.lado === 'f' ? R.favor(texto) : c.veces > 1 ? R.quejaDoble(texto) : R.queja(texto);
        r.text(t, x + COL.anota, yy, !c.lado ? TINTA_SUAVE : c.lado === 'f' ? TINTA : SELLO, 'left', sinHalo);
      });
    });

    // Abajo: los tres botones y las teclas.
    const by = y + alto - 28;
    r.rect(x + 14, by - 9, HOJA.w - 28, 1, PAPEL_SUCIO);
    let bx = x + 14;
    for (const b of ['espera', 'generoso', 'nada']) {
      r.text(R.botones[b], bx, by, TINTA, 'left', sinHalo);
      bx += Math.ceil(r.medir(R.botones[b])) + 14;
    }
    r.text(R.ayuda, x + 14, y + alto - 14, TINTA_SUAVE, 'left', sinHalo);
    if (olla) r.text(comen ? R.olla(olla) : R.sinOlla(olla), x + HOJA.w - 14, y + alto - 14, comen ? TINTA : SELLO, 'right', sinHalo);
    if (cuota.lleva || cuota.debe) r.text(R.jmc(cuota.lleva, cuota.debe), x + HOJA.w - 14, by, cuota.debe ? SELLO : TINTA, 'right', sinHalo);
  }

  /** Una flechita de 3×5 puntos, para un lado (−1 izquierda, 1 derecha). */
  function flecha(r, fx, fy, lado, tinta) {
    for (let k = 0; k < 3; k++) {
      const col = lado < 0 ? fx + k : fx + 2 - k;
      r.rect(col, fy - k, 1, 1 + 2 * k, tinta);
    }
  }

  return { abrir, activa, update, render };
}
