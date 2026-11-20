/**
 * 📅 EL CALENDARIO *(Santi, 2026-11-15: "para poder ver planes y algo más ampliado apretás algún botón y se abre el
 * calendario"; eligió la [C])*, 🔁 CON LA PIZARRA ADENTRO *(Santi, 2026-11-18: "y si la pizarra la ponemos junto al
 * calendario, o sea que sea lo mismo, juntarlo de alguna forma para que sean menos teclas y funciones")*.
 *
 * Una hoja de papel de época con `TIEMPO.pizarra.dias` días a la vista *(Santi: "7 días")*, cada uno en sus partes
 * (una angosta para la madrugada, que sólo lleva trenes, y la mañana, la tarde y la noche):
 *  - arriba, la fila de los TRENES (los del horario, los rumores sobre el día entero), la noche de J.Mc.;
 *  - una fila por cada uno de la banda con lo que tiene puesto (las reglas, en systems/pizarra.js), y una cruz el día
 *    que se cura;
 *  - abajo, lo que dice la casilla marcada, para cuántos días alcanza la comida y lo que se está por oxidar.
 * [WASD] mueve la marca (y corre los días), [E] pone una tarea, [Espacio] hace pasar una parte del día y
 * [Shift]+[Espacio] un día entero *(Santi: "Una parte; con Shift, un día")*. La carpa abre esta misma hoja. El mes
 * entero ya no está *(Santi: "Sacarla")*; con la llave `TIEMPO.pizarra.activo` apagada, vuelve.
 */

import { PALETA } from '../engine/paleta.js';
import { papel, TINTAS } from '../engine/menu.js';
import { MIEMBRO } from '../data/banda.js';
import { TIEMPO } from '../data/tiempo.js';
import { palabraDeHumor } from '../data/rasgos.js';
import { completarTiempo, fechaDe, diaDe, loQueViene } from '../systems/tiempo.js';
import { conocidos, momento, ahora } from '../systems/horario.js';
import { tareaEn, ponerTarea, sePuedeCambiar, sePuedePoner, paraMirarEl, otroBajaAlPueblo, VA_EN, PARTES_PIZARRA } from '../systems/pizarra.js';
import { paraVender, yaHuboCartas, mejoraDe } from '../systems/tareas.js';
import { tiene } from '../systems/animo.js';
import { TAREAS } from '../data/tareas.js';
import { quimicaConocida } from '../systems/tratosEnJuego.js';
import { PRACTICABLES } from '../systems/animoEnJuego.js';
import { diasParaOxidarse } from '../systems/animo.js';
import { porciones, diasQueAlcanza, comensales } from '../systems/comida.js';
import { COMIDA } from '../data/comida.js';
import { T } from '../text/es.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';
import { CONFIG } from '../data/config.js';

const { TINTA, TINTA_SUAVE, SELLO, PAPEL_SUCIO } = TINTAS;

/**
 * 🔤 LAS LETRAS, EN PÍXELES DE 1×1 *(Santi, 2026-11-18: "la parte de los escritos ponelo en pixeles de 1x1 y poneles el
 * filtro que usamos para los bordes de los personajes, porque ahora mismo se entiende muy poco")*: la grilla de 3×3 se
 * comía las letras chicas (la "t" parecía una "L"). Van en la capa fina, que se pone encima después de la grilla, con
 * el contorno de un píxel del color del borde de la gente (`bordeFino`, engine/estiloNuevo.js).
 */
const BORDE_GENTE = '#140c1c';
function fino(r, tam) {
  return { tam, lienzo: estiloNuevo.lienzoFino(r.ctx), halo: BORDE_GENTE, haloPx: CONFIG.estilo.bordeGente };
}
const HOJA = { w: 404, h: 226 }, CELDA = { w: 24, h: 19 };
/** La hoja de días: el ancho de la columna de los nombres, de la madrugada y de cada parte; el alto de una fila. */
const G = { nombres: 54, madrugada: 8, parte: 13, fila: 13 };
const DIA_W = G.madrugada + 3 * G.parte;
const MADRUGADA = TIEMPO.cambiaElDia, NOCHE = 2;
/** El ánimo en palabras (como la ficha). */
const ANIMO_DE = { contento: 'conGanas', tranquilo: 'tranquilo', deMalas: 'deMalas', furioso: 'furioso' };
/** Cuántos días de anticipo avisa lo que se oxida. */
const AVISA_OXIDO = 3;

export function crearCalendario(audio, { menu = null, alPasar = null } = {}) {
  let abierto = null;   // { corrimiento } (meses en el viejo; días en la pizarra) y la marca: { fila, col }

  const conPizarra = () => TIEMPO.pizarra.activo && menu && alPasar;

  function abrir(g = null) {
    abierto = { corrimiento: 0, fila: 1, col: 0 };
    // (La marca arranca en la primera casilla que todavía se puede cambiar: hoy, o mañana a la mañana.)
    if (g && TIEMPO.pizarra.activo) {
      const d = completarTiempo(g).dia;
      abierto.col = PARTES_PIZARRA.findIndex((p) => sePuedeCambiar(g, d, p));
      if (abierto.col < 0) abierto.col = 3;
    }
    audio.play('cock');
    return true;
  }
  function cerrar() { abierto = null; }
  function activo() { return !!abierto; }

  /** Los de la banda que están (una fila cada uno). */
  function filas(g) {
    return Object.entries(g.banda || {}).filter(([, e]) => e && e.esta).map(([id]) => id);
  }

  /** La casilla marcada: el día (número del calendario) y la parte (0 mañana, 1 tarde, 2 noche). */
  function marcada(g) {
    const t = completarTiempo(g);
    return { dia: t.dia + abierto.corrimiento + Math.floor(abierto.col / 3), parte: PARTES_PIZARRA[abierto.col % 3] };
  }

  function update(input, g) {
    if (!abierto) return false;
    if (!conPizarra()) {
      if (input.wasPressed('KeyA') || input.wasPressed('ArrowLeft')) { abierto.corrimiento--; audio.play('cock'); }
      if (input.wasPressed('KeyD') || input.wasPressed('ArrowRight')) { abierto.corrimiento++; audio.play('cock'); }
      if (input.wasPressed('Escape') || input.wasPressed('KeyC')) cerrar();
      return true;
    }
    const n = filas(g).length, cols = TIEMPO.pizarra.dias * 3;
    if (input.wasPressed('KeyW') || input.wasPressed('ArrowUp')) { abierto.fila = (abierto.fila + n) % (n + 1); audio.play('cock'); }
    if (input.wasPressed('KeyS') || input.wasPressed('ArrowDown')) { abierto.fila = (abierto.fila + 1) % (n + 1); audio.play('cock'); }
    if (input.wasPressed('KeyA') || input.wasPressed('ArrowLeft')) {
      // (En la punta, corre los días; para atrás, hasta hoy.)
      if (abierto.col > 0) abierto.col--;
      else if (abierto.corrimiento > 0) { abierto.corrimiento--; abierto.col = 2; }
      audio.play('cock');
    }
    if (input.wasPressed('KeyD') || input.wasPressed('ArrowRight')) {
      if (abierto.col < cols - 1) abierto.col++;
      else { abierto.corrimiento++; abierto.col = cols - 3; }
      audio.play('cock');
    }
    if (input.wasPressed('KeyE') || input.wasPressed('Enter')) elegir(g);
    if (input.wasPressed('Space')) {
      const shift = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
      alPasar(shift ? TIEMPO.partes.length : 1);
    }
    if (input.wasPressed('Escape') || input.wasPressed('KeyC')) cerrar();
    return true;
  }

  // ─────────────────────────── poner una tarea ───────────────────────────

  function cuandoEs(dia, parte) {
    const f = fechaDe(dia), Tt = T.tiempo;
    const que = Tt.partesMin[TIEMPO.partes[parte]];
    return `${T.rumores.dias[f.semana]} ${f.dia}, ${que}`;
  }

  function elegir(g) {
    const ids = filas(g), id = ids[abierto.fila - 1];
    if (!id) return;
    const { dia, parte } = marcada(g), K = T.tiempo.calendario;
    if (!sePuedePoner(g, id, dia, parte, null)) { audio.play('hitWall'); return; }
    const e = g.banda[id], nombre = MIEMBRO[id].corto;
    // (Cada tarea, sólo donde va, si entra entera, y si tiene sentido: lo de mirar, si hay tren; vender, si hay qué;
    // curar y cocinar, si sabe; las cartas, una vez entre golpe y golpe; el pueblo, uno por día.)
    const va = (que, extra = {}) => VA_EN[que].includes(parte) && sePuedePoner(g, id, dia, parte, { que, ...extra });
    const con = (que, texto) => { const m = mejoraDe(g, id, que); return m.length ? K.menuCon(texto, m.map((x) => T.rasgos[x] || x).join(', ')) : texto; };
    const opciones = [];
    if (va('practicar')) opciones.push({ id: 'practicar', texto: K.menuPracticarCual });
    if (va('mirar') && paraMirarEl(g, dia, id).length) opciones.push({ id: 'mirar', texto: K.menuMirar });
    if (va('cazar')) opciones.push({ id: 'cazar', texto: con('cazar', K.menuCazar) });
    if (va('pescar')) opciones.push({ id: 'pescar', texto: con('pescar', K.menuPescar) });
    if (va('pueblo') && !otroBajaAlPueblo(g, dia, id)) {
      opciones.push({ id: 'pueblo:rumores', texto: con('pueblo', K.menuRumores) }, { id: 'pueblo:comida', texto: K.menuComida(TAREAS.pueblo.comidaDias) });
    }
    // 🧪 (Y la química con el perista, si ya le conoces algo: a quién conviene mandar según quién es él. TRATOS.md.)
    if (va('vender') && paraVender(g).length) {
      const q = quimicaConocida(g, 'perista', e);
      const texto = con('vender', K.menuVender);
      opciones.push({ id: 'vender', texto: q.length ? K.menuQuimica(texto, q.slice(0, 2).map((x) => K.quimica(x.id, x.chance))) : texto });
    }
    if (va('curar') && tiene(e, 'curandero')) opciones.push({ id: 'curar', texto: K.menuCurar });
    if (va('cartas') && !yaHuboCartas(g)) opciones.push({ id: 'cartas', texto: con('cartas', K.menuCartas) });
    if (va('cocinar') && tiene(e, 'cocinero')) opciones.push({ id: 'cocinar', texto: K.menuCocinar });
    opciones.push({ id: 'descansar', texto: K.menuDescansar }, { id: 'nada', texto: K.menuNada });
    menu.abrir(K.menuTitulo(nombre, cuandoEs(dia, parte)), opciones, (op) => {
      if (op === 'nada') return false;
      if (op === 'descansar') { ponerTarea(g, id, dia, parte, null); audio.play('cover'); return false; }
      if (op === 'mirar') { elegirTren(g, id, dia, parte); return true; }
      if (op === 'practicar') { elegirPractica(g, id, dia, parte); return true; }
      const [que, para] = op.split(':');
      ponerTarea(g, id, dia, parte, para ? { que, para } : { que });
      audio.play('cover');
      return false;
    }, parte === NOCHE ? K.menuCuerpoNoche : K.menuCuerpo);
  }

  /** Qué va a practicar (las habilidades de los papeles y la baraja). */
  function elegirPractica(g, id, dia, parte) {
    const K = T.tiempo.calendario, e = g.banda[id];
    const opciones = PRACTICABLES.map((hab) => {
      const h = e.habilidades && e.habilidades[hab];
      return { id: hab, texto: K.menuPracticar(T.rasgos[hab], !!(h && h.tiene)) };
    });
    opciones.push({ id: 'no', texto: K.menuNada });
    menu.abrir(K.practicarTitulo(MIEMBRO[id].corto), opciones, (op) => {
      if (op === 'no') return false;
      ponerTarea(g, id, dia, parte, { que: 'practicar', hab: op });
      audio.play('cover');
      return false;
    }, K.menuCuerpo);
  }

  function elegirTren(g, id, dia, parte) {
    const K = T.tiempo.calendario, trenes = paraMirarEl(g, dia, id).slice(0, 6);
    const opciones = trenes.map((tr) => ({ id: String(tr.id), texto: textoDelTren(tr) }));
    opciones.push({ id: 'no', texto: K.menuNada });
    menu.abrir(K.mirarTitulo(MIEMBRO[id].corto), opciones, (op) => {
      if (op === 'no') return false;
      ponerTarea(g, id, dia, parte, { que: 'mirar', tren: Number(op) });
      audio.play('cover');
      return false;
    }, T.camp.banda.espiarCuerpo);
  }

  function textoDelTren(tr) {
    const K = T.tiempo.calendario, f = fechaDe(tr.dia);
    const cuando = `${T.rumores.dias[f.semana]} ${f.dia}` + (tr.sabes === 'rumor' ? '' : `, ${T.tiempo.partesMin[TIEMPO.partes[tr.parte]]}`);
    return K.tren(tr.tipoTren.short.toLowerCase(), T.rumores.vias[tr.ruta] || tr.ruta, cuando, tr.sabes === 'rumor' ? K.deRumor : K.delHorario)
      + (tr.visto ? K.mirado : '');
  }

  // ─────────────────────────── la hoja ───────────────────────────

  function render(r, g) {
    if (!abierto) return;
    if (!conPizarra()) { renderMes(r, g); return; }
    const t = completarTiempo(g), Tt = T.tiempo, K = Tt.calendario, sinHalo = fino(r), chico = fino(r, 7);
    const hoy = fechaDe(t.dia), ids = filas(g), ya = ahora(g);
    const d0 = t.dia + abierto.corrimiento, nDias = TIEMPO.pizarra.dias;

    r.ctx.globalAlpha = 0.5;
    r.rect(0, 0, r.width, r.height, PALETA[0]);
    r.ctx.globalAlpha = 1;
    // (El alto, el justo: las filas, y abajo cuatro renglones y la ayuda.)
    const alto = 52 + (ids.length + 1) * G.fila + 10 + 4 * 10 + 12;
    const x = Math.round((r.width - HOJA.w) / 2), y = Math.round((r.height - alto) / 2);
    papel(r, x, y, HOJA.w, alto);

    // El mes de los días que se ven, y hoy.
    const fm = fechaDe(d0), nombreMes = Tt.meses[fm.mes];
    const titulo = nombreMes[0].toUpperCase() + nombreMes.slice(1);
    r.text(titulo, x + 12, y + 16, SELLO, 'left', fino(r, 12));
    r.rect(x + 12, y + 25, r.medir(titulo, 12) + 4, 1, TINTA_SUAVE);
    r.text(K.hoy(Tt.fecha(hoy.dia, Tt.meses[hoy.mes]), Tt.partesMin[TIEMPO.partes[t.parte]]), x + HOJA.w - 12, y + 16, TINTA, 'right', sinHalo);

    const gx = x + 8 + G.nombres, gy = y + 36;
    const colX = (k, parte) => gx + k * DIA_W + (parte === MADRUGADA ? 0 : G.madrugada + parte * G.parte);
    const ancho = (parte) => (parte === MADRUGADA ? G.madrugada : G.parte);

    // Los días, con sus partes.
    for (let k = 0; k < nDias; k++) {
      const n = d0 + k, f = fechaDe(n), dx = gx + k * DIA_W;
      r.text(`${Tt.semanaLarga[f.semana]} ${f.dia}`, dx + DIA_W / 2, gy, n === t.dia ? SELLO : TINTA, 'center', chico);
      for (const p of PARTES_PIZARRA) r.text(K.letraParte[p], colX(k, p) + G.parte / 2, gy + 9, TINTA_SUAVE, 'center', chico);
      if (k) r.rect(dx - 1, gy - 5, 1, 18 + (ids.length + 1) * G.fila, PAPEL_SUCIO);
    }
    r.rect(gx, gy + 13, nDias * DIA_W, 1, PAPEL_SUCIO);

    const fy = (i) => gy + 16 + i * G.fila;   // la fila i (0: trenes)
    // Lo que ya pasó, sombreado; la parte de ahora, con un marco de tinta de sello.
    for (let k = 0; k < nDias; k++) for (const p of [MADRUGADA, ...PARTES_PIZARRA]) {
      const m = momento(d0 + k, p), cx = colX(k, p);
      if (m < ya) { r.ctx.globalAlpha = 0.6; r.rect(cx, fy(0), ancho(p), (ids.length + 1) * G.fila, PAPEL_SUCIO); r.ctx.globalAlpha = 1; }
      if (m === ya) marco(r, cx, fy(0), ancho(p), (ids.length + 1) * G.fila, SELLO);
    }

    // Los nombres de las filas.
    r.text(K.trenes, x + 10, fy(0) + 7, TINTA_SUAVE, 'left', sinHalo);
    ids.forEach((id, i) => r.text(MIEMBRO[id].corto, x + 10, fy(i + 1) + 7, TINTA, 'left', sinHalo));

    // 🚂 Los trenes: una letra en la parte en que pasa; el rumor, sobre el día entero. ✉️ J.Mc., una J a la noche.
    const trenes = conocidos(g);
    for (let k = 0; k < nDias; k++) {
      const n = d0 + k;
      for (const tr of trenes.filter((x2) => x2.dia === n)) {
        const letra = tr.tipoTren.short[0] + (tr.sabes === 'rumor' ? '?' : '');
        const tinta = tr.visto ? TINTA : SELLO;
        if (tr.sabes === 'rumor') r.text(letra, colX(k, 1) + G.parte / 2, fy(0) + 7, tinta, 'center', chico);
        else r.text(letra, colX(k, tr.parte) + ancho(tr.parte) / 2, fy(0) + 7, tinta, 'center', chico);
      }
    }
    const marcas = loQueViene(g, nDias + abierto.corrimiento + 1);
    for (const mk of marcas) {
      const k = mk.dia - d0;
      if (k < 0 || k >= nDias) continue;
      if (mk.que === 'jmc') r.text('J', colX(k, NOCHE) + G.parte / 2, fy(0) + 7, SELLO, 'center', chico);
      if (mk.que === 'secura') { const i = ids.indexOf(mk.quien); if (i >= 0) r.text('+', colX(k, MADRUGADA) + G.madrugada / 2, fy(i + 1) + 7, SELLO, 'center', chico); }
    }

    // 📋 Las tareas: una barra sobre las casillas que ocupa (las que siguen juntas en el día), con su palabra corta.
    ids.forEach((id, i) => {
      const yy = fy(i + 1);
      for (let k = 0; k < nDias; k++) {
        const n = d0 + k;
        let p = 0;
        while (p < 3) {
          const t = tareaEn(g, id, n, p);
          if (!t) { r.text('·', colX(k, p) + G.parte / 2, yy + 7, TINTA_SUAVE, 'center', chico); p++; continue; }
          let largo = 1;
          while (p + largo < 3 && claveDe(tareaEn(g, id, n, p + largo)) === claveDe(t)) largo++;
          const bx = colX(k, p) + 1, bw = largo * G.parte - 2;
          r.ctx.globalAlpha = 0.25; r.rect(bx, yy + 2, bw, G.fila - 3, t.que === 'mirar' ? SELLO : TINTA); r.ctx.globalAlpha = 1;
          r.text(cortoDe(t, largo), bx + bw / 2, yy + 7, TINTA, 'center', chico);
          p += largo;
        }
      }
    });

    // La marca: un marco en la casilla (las de la mañana y la tarde, las dos juntas).
    const { dia, parte } = marcada(g), km = dia - d0;
    marco(r, colX(km, parte) - 1, fy(abierto.fila) - 1, G.parte + 2, G.fila + 2, TINTA);

    // Abajo: lo que dice la casilla marcada, la comida y lo que se oxida.
    let ly = fy(ids.length + 1) + 10;
    r.rect(x + 10, ly - 6, HOJA.w - 20, 1, PAPEL_SUCIO);
    for (const linea of detalle(g, ids, dia, parte, trenes, marcas)) { r.text(linea, x + 10, ly, TINTA, 'left', sinHalo); ly += 10; }
    if (COMIDA.activo) { r.text(K.comida(porciones(g), diasQueAlcanza(g), comensales(g)), x + 10, ly, TINTA_SUAVE, 'left', sinHalo); ly += 10; }
    const oxidos = [];
    for (const id of ids) {
      const e = g.banda[id];
      for (const [hab, h] of Object.entries(e.habilidades || {})) {
        if (!h.tiene) continue;
        const d = diasParaOxidarse(e, hab, t.dia);
        if (d != null && d <= AVISA_OXIDO) oxidos.push(K.oxida(MIEMBRO[id].corto, T.rasgos[hab] || hab, d));
      }
    }
    if (oxidos.length) r.text(oxidos.slice(0, 3).join('   '), x + 10, ly, SELLO, 'left', sinHalo);

    r.text(K.ayuda, x + HOJA.w - 10, y + alto - 8, TINTA_SUAVE, 'right', chico);
  }

  /** Lo que dice la casilla marcada (uno o dos renglones). */
  function detalle(g, ids, dia, parte, trenes, marcas) {
    const K = T.tiempo.calendario, out = [];
    if (abierto.fila === 0) {
      const aca = trenes.filter((tr) => tr.dia === dia && (tr.sabes === 'rumor' || tr.parte === parte));
      for (const tr of aca.slice(0, 2)) out.push(textoDelTren(tr));
      if (parte === NOCHE && marcas.some((mk) => mk.que === 'jmc' && mk.dia === dia)) out.push(K.jmc);
      if (!out.length) out.push(K.sinTrenes);
      return out;
    }
    const id = ids[abierto.fila - 1], e = g.banda[id];
    const h = palabraDeHumor(e.humor ?? 50), animo = e.libreta ? T.libreta.animo[ANIMO_DE[h]] : T.camp.banda.humor[h];
    const t = tareaEn(g, id, dia, parte);
    let que = K.descansa;
    if (t && t.que === 'mirar') que = K.mira(viaDe(trenes, t.tren));
    else if (t && t.que === 'practicar') que = K.practica(T.rasgos[t.hab]);
    else if (t && t.que === 'pescar') { const f = fechaDe((t.sigue ? t.desde : dia) + 1); que = K.pesca(`${T.rumores.dias[f.semana]} ${f.dia}`); }
    else if (t && t.que === 'pueblo') que = t.para === 'comida' ? K.haceComida : K.haceRumores;
    else if (t) que = K.hace[t.que] || t.que;
    out.push(K.celda(MIEMBRO[id].corto, animo, cuandoEs(dia, parte), que) + (sePuedeCambiar(g, dia, parte) ? '' : K.yaPaso));
    if (e.herido) {
      const cura = marcas.find((mk) => mk.que === 'secura' && mk.quien === id);
      if (cura) { const f = fechaDe(cura.dia); out.push(K.herido(MIEMBRO[id].corto, `${T.rumores.dias[f.semana]} ${f.dia}`)); }
    }
    return out;
  }

  /** Para juntar las casillas de una misma tarea en una barra. */
  function claveDe(t) {
    return t ? [t.que, t.hab, t.tren, t.para].join('|') : '';
  }

  /** La palabra corta de una tarea: más larga si la barra ocupa más de una casilla. */
  function cortoDe(t, largo) {
    const K = T.tiempo.calendario;
    if (t.que === 'practicar') return K.corto[t.hab] || '?';
    if (t.que === 'mirar') return K.corto.mirar;
    const que = t.que === 'pueblo' && t.para === 'comida' ? 'comida' : t.que;
    return (largo > 1 ? K.corto[que] : K.cortito[que]) || '?';
  }

  function viaDe(trenes, trenId) {
    const tr = trenes.find((x2) => x2.id === trenId);
    return tr ? T.rumores.vias[tr.ruta] || tr.ruta : '?';
  }

  function marco(r, x, y, w, h, tinta) {
    r.rect(x, y, w, 1, tinta); r.rect(x, y + h - 1, w, 1, tinta);
    r.rect(x, y, 1, h, tinta); r.rect(x + w - 1, y, 1, h, tinta);
  }

  // ─────────────────────────── el mes (con la llave apagada) ───────────────────────────

  function renderMes(r, g) {
    const t = completarTiempo(g), Tt = T.tiempo, C = Tt.calendario, sinHalo = fino(r);
    const hoy = fechaDe(t.dia);
    const W = 330, H = 196;
    const m0 = hoy.mes + abierto.corrimiento;
    const anio = hoy.anio + Math.floor(m0 / 12), mes = ((m0 % 12) + 12) % 12;
    const marcas = loQueViene(g, 400);
    const conMarca = new Set(marcas.map((x) => x.dia));

    r.ctx.globalAlpha = 0.5;
    r.rect(0, 0, r.width, r.height, PALETA[0]);
    r.ctx.globalAlpha = 1;
    const x = Math.round((r.width - W) / 2), y = Math.round((r.height - H) / 2);
    papel(r, x, y, W, H);

    const nombreMes = Tt.meses[mes];
    const titulo = nombreMes[0].toUpperCase() + nombreMes.slice(1);
    r.text(titulo, x + 14, y + 20, SELLO, 'left', fino(r, 12));
    r.rect(x + 14, y + 29, r.medir(titulo, 12) + 4, 1, TINTA_SUAVE);

    const gx = x + 14, gy = y + 40;
    Tt.semana.forEach((d, i) => r.text(d, gx + i * CELDA.w + CELDA.w / 2, gy, TINTA_SUAVE, 'center', sinHalo));
    r.rect(gx, gy + 6, CELDA.w * 7, 1, PAPEL_SUCIO);
    const enElMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
    const primero = (new Date(Date.UTC(anio, mes, 1)).getUTCDay() + 6) % 7;
    for (let d = 1; d <= enElMes; d++) {
      const pos = primero + d - 1, col = pos % 7, fila = Math.floor(pos / 7);
      const cx = gx + col * CELDA.w + CELDA.w / 2, cy = gy + 16 + fila * CELDA.h;
      const n = diaDe(anio, mes, d);
      const antes = n < 0, paso = n < t.dia && !antes, esHoy = n === t.dia;
      r.text(String(d), cx, cy, antes ? PALETA[25] : paso ? TINTA_SUAVE : TINTA, 'center', sinHalo);
      if (paso) for (let k = 0; k < 9; k++) r.rect(cx - 5 + k, cy + 4 - k, 1, 1, TINTA_SUAVE);
      if (esHoy) circulo(r, cx, cy, 9, 7, SELLO);
      if (conMarca.has(n)) r.rect(cx - 1, cy + 6, 2, 2, SELLO);
    }

    const lx = gx + CELDA.w * 7 + 16, ancho = x + W - 14 - lx;
    const parte = Tt.partesMin[TIEMPO.partes[t.parte]];
    r.text(C.hoy(Tt.fecha(hoy.dia, Tt.meses[hoy.mes]), parte), lx, y + 20, TINTA, 'left', sinHalo);
    r.text(C.viene, lx, y + 40, TINTA_SUAVE, 'left', sinHalo);
    r.rect(lx, y + 46, ancho, 1, PAPEL_SUCIO);
    const proximas = marcas.filter((x2) => x2.que === 'jmc' || x2.dia - t.dia <= TIEMPO.avisoDias);
    if (!proximas.length) r.text(C.vieneNada, lx, y + 56, TINTA_SUAVE, 'left', sinHalo);
    proximas.slice(0, 8).forEach((mk, i) => {
      const f = fechaDe(mk.dia);
      const que = mk.que === 'secura' ? Tt.secura(MIEMBRO[mk.quien].corto) : mk.que === 'jmc' ? Tt.jmc : mk.que;
      r.text(`${f.dia} ${Tt.meses[f.mes].slice(0, 3)}.`, lx, y + 56 + i * 12, SELLO, 'left', sinHalo);
      r.text(que, lx + 34, y + 56 + i * 12, TINTA, 'left', sinHalo);
    });

    r.text(C.ayudaMes, x + W - 10, y + H - 9, TINTA_SUAVE, 'right', fino(r, 7));
  }

  /** Un círculo hecho a mano con tinta: un óvalo de puntos, apenas abierto arriba (como uno trazado con pluma). */
  function circulo(r, cx, cy, rx, ry, tinta) {
    for (let a = 0.35; a < Math.PI * 2 + 0.1; a += 0.12) {
      r.rect(Math.round(cx + Math.cos(a - Math.PI / 2) * rx), Math.round(cy + Math.sin(a - Math.PI / 2) * ry), 1, 1, tinta);
    }
  }

  return { abrir, cerrar, activo, update, render };
}
