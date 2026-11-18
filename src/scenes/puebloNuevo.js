/**
 * 🏚️ EL PUEBLO NUEVO, por ahora EN BLOQUES (ver data/puebloNuevo.js): sirve para caminarlo y ajustar el plano antes de dibujar.
 *
 * `E` entra o mira; `F`, al lado del caballo, vuelve al campamento, igual que el pueblo de antes.
 */

import { CONFIG } from '../data/config.js';
import { PLANO, EDIFICIOS, CERCOS, SITIOS, POZO, ARBOLES, solidos } from '../data/puebloNuevo.js';
import { INTERIORES } from '../data/interiors.js';
import { gameState } from '../state/gameState.js';
import { createCamera } from '../engine/camera.js';
import { DENSIDAD } from '../engine/renderer.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';
import { T } from '../text/es.js';
import { dibujarPersona, faseDeAndar } from '../entities/figura.js';

const COLOR = {
  tierra: '#c8a878', calle: '#a67e58', atras: '#b08a62',
  tienda: ['#a8743e', '#7e5230'], casa: ['#886244', '#6a4a32'], lugar: ['#6e6250', '#4a4a52'],
  iglesia: '#a67e58', cerco: '#5a3820', zona: '#9a8a6a', pozo: '#7a7a80', caballo: '#5a3820',
};
const MEDIO_ANCHO = 4, MEDIO_FONDO = 2;

export function createPuebloNuevo(services) {
  const { renderer, input, scenes, hud, audio, rng } = services;
  const colors = CONFIG.colors;
  const camera = createCamera(renderer);
  const bounds = { width: PLANO.ancho, height: PLANO.alto };
  const duros = solidos();
  const yo = {};
  let x, y, mirando = Math.PI / 2, mensaje = null, scroll = 0;

  const choca = (px, py) => duros.some(([a, b, c, d]) => px + MEDIO_ANCHO > a && px - MEDIO_ANCHO < c && py + MEDIO_FONDO > b && py - MEDIO_FONDO < d);

  function enter(params = {}) {
    hud.hide();
    const local = params.desde === 'interior' && EDIFICIOS.find((e) => e.id === params.edificio);
    x = local ? local.x : PLANO.caballo.x + 26;
    y = local ? local.frente + 8 : PLANO.caballo.y;
    mensaje = null; scroll = 0;
    camera.snap(x, y, bounds);
    audio.ambiente('calle', {
      cutoff: 340, q: 0.6, type: 'lowpass',
      gain: gameState.esDeDia ? CONFIG.ambiente.puebloDiaGain : CONFIG.ambiente.puebloNocheGain,
      respira: { profundidad: CONFIG.ambiente.vientoProfundidad, cada: CONFIG.ambiente.vientoCada },
    });
    audio.arrancarMusica();
    services.town = {
      get x() { return x; }, get y() { return y; },
      ir(a, b) { x = a; y = b; camera.snap(x, y, bounds); },
      get cerca() { const o = objetoCerca(); return o ? o.id : null; },
      get edificios() { return EDIFICIOS; },
    };
  }

  function objetoCerca() {
    let mejor = null, dist = Infinity;
    const mirar = (o, ox, oy, alcance) => {
      const d = Math.hypot(ox - x, oy - y);
      if (d <= alcance && d < dist) { dist = d; mejor = o; }
    };
    for (const e of EDIFICIOS) {
      if (e.sinPuerta) continue;
      for (const dx of e.puertas || [0]) mirar(e, e.x + dx, e.frente + 6, 22);
      // (Las de atrás se usan desde el otro lado del edificio.)
      for (const dx of e.atras || []) mirar(e, e.x + dx, e.frente - e.fondo - e.alto + 6, 22);
    }
    for (const s of SITIOS) mirar(s, s.x, s.y, 26);
    mirar(POZO, POZO.x, POZO.y + 6, 24);
    mirar({ id: 'caballo' }, PLANO.caballo.x, PLANO.caballo.y, 34);
    return mejor;
  }

  function usar(o) {
    if (o.frase) { mensaje = { texto: o.frase, life: 3 }; audio.play('cover'); return; }
    const interior = INTERIORES[o.id];
    if (interior && interior.soloDeDia && !gameState.esDeDia) {
      mensaje = { texto: T.pueblo.cerrado(interior.nombre), life: 3 };
      audio.play('hitWall');
      return;
    }
    audio.play('cover');
    scenes.goTo('interior', { id: o.id });
  }

  function update(dt) {
    scroll += dt;
    audio.updateMusica(dt);
    if (mensaje && (mensaje.life -= dt) <= 0) mensaje = null;

    let dx = 0, dy = 0;
    if (input.anyDown('KeyA', 'ArrowLeft')) dx -= 1;
    if (input.anyDown('KeyD', 'ArrowRight')) dx += 1;
    if (input.anyDown('KeyW', 'ArrowUp')) dy -= 1;
    if (input.anyDown('KeyS', 'ArrowDown')) dy += 1;
    if (dx || dy) {
      if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
      const v = CONFIG.player.speed * dt;
      // De a un eje por vez: chocando en diagonal contra una pared seguís resbalando.
      const nx = Math.max(10, Math.min(PLANO.ancho - 10, x + dx * v));
      if (!choca(nx, y)) x = nx;
      const ny = Math.max(10, Math.min(PLANO.alto - 6, y + dy * v));
      if (!choca(x, ny)) y = ny;
      mirando = Math.atan2(dy, dx);
    }
    const o = objetoCerca();
    if (o && o.id !== 'caballo' && input.wasPressed('KeyE')) usar(o);
    if (o && o.id === 'caballo' && input.wasPressed('KeyF')) { audio.play('escape'); scenes.goTo('camp', { desde: 'pueblo' }); }
    camera.follow(x, y, bounds, dt);
    camera.update(dt, rng);
  }

  function edificio(r, e, fino) {
    const izq = e.x - e.ancho / 2, [techo, pared] = COLOR[e.tipo];
    const paredY = e.frente - e.alto;
    r.rect(izq, paredY - e.fondo, e.ancho, e.fondo, techo);
    r.rect(izq, paredY, e.ancho, e.alto, pared);
    r.rect(izq, paredY, e.ancho, 1, '#34221a');
    if (!e.sinPuerta) for (const dx of e.puertas || [0]) r.rect(e.x + dx - 5, e.frente - 18, 10, 18, '#34221a');
    // (Marca de la puerta de atrás, en el borde del techo.)
    for (const dx of e.atras || []) r.rect(e.x + dx - 5, paredY - e.fondo, 10, 3, '#f0e6c0');
    fino.push(() => r.text(e.nombre, e.x, paredY - e.fondo / 2, '#f0e6c0', 'center', { halo: '#34221a', lienzo: estiloNuevo.lienzoFino(r.ctx) }));
  }

  function jugador(r) {
    yo.x = x; yo.y = y;
    dibujarPersona(r, { tipo: 'jugador', x, pies: y + 4, angulo: mirando, fase: faseDeAndar(yo), panuelo: true });
  }

  function render(r) {
    if (r.canvas.width / DENSIDAD >= 480 && r.canvas.height / DENSIDAD >= 270) r.lupa(DENSIDAD);
    else r.lupaLibre((2 * DENSIDAD) / CONFIG.estilo.punto);
    r.clear('#000');
    r.ctx.save();
    r.ctx.translate(-camera.renderX, -camera.renderY);

    r.rect(0, 0, PLANO.ancho, PLANO.alto, COLOR.tierra);
    r.rect(0, PLANO.calle.y1, PLANO.ancho, PLANO.calle.y2 - PLANO.calle.y1, COLOR.calle);
    r.rect(100, PLANO.calleAtras.y1, 900, PLANO.calleAtras.y2 - PLANO.calleAtras.y1, COLOR.atras);
    for (const c of PLANO.caminos) r.rect(c.x1, c.y1, c.x2 - c.x1, c.y2 - c.y1, c.principal ? COLOR.iglesia : COLOR.atras);
    r.rect(0, PLANO.calle.y1, PLANO.ancho, PLANO.calle.y2 - PLANO.calle.y1, COLOR.calle);
    for (const s of SITIOS) { const [a, b, c, d] = s.zona; r.rect(a, b, c - a, d - b, COLOR.zona); }
    for (const [a, b, c, d] of CERCOS) r.rect(a, b, c - a, d - b, COLOR.cerco);

    const finos = [], cosas = [];
    for (const e of EDIFICIOS) cosas.push({ base: e.frente, draw: () => edificio(r, e, finos) });
    cosas.push({ base: POZO.y, draw: () => {
      r.rect(POZO.x - POZO.ancho / 2, POZO.y - POZO.fondo - 10, POZO.ancho, POZO.fondo + 10, COLOR.pozo);
      finos.push(() => r.text(POZO.nombre, POZO.x, POZO.y - POZO.fondo - 16, '#34221a', 'center', { halo: '#c8a878', lienzo: estiloNuevo.lienzoFino(r.ctx) }));
    } });
    for (const [ax, ay] of ARBOLES) cosas.push({ base: ay, draw: () => { r.rect(ax - 2, ay - 22, 4, 22, '#5a3820'); r.rect(ax - 7, ay - 30, 14, 10, '#4a7a3a'); } });
    cosas.push({ base: PLANO.caballo.y, draw: () => {
      r.rect(PLANO.caballo.x - 18, PLANO.caballo.y - 20, 36, 20, COLOR.caballo);
      finos.push(() => r.text('TU CABALLO', PLANO.caballo.x, PLANO.caballo.y - 27, '#34221a', 'center', { halo: '#c8a878', lienzo: estiloNuevo.lienzoFino(r.ctx) }));
    } });
    cosas.push({ base: y + 4, draw: () => jugador(r) });
    cosas.sort((a, b) => a.base - b.base).forEach((c) => c.draw());
    for (const s of SITIOS) if (!s.sinRotulo) finos.push(() => r.text(s.nombre, s.x, s.zona[1] + 30, '#34221a', 'center', { halo: '#c8a878', lienzo: estiloNuevo.lienzoFino(r.ctx) }));
    for (const f of finos) f();

    const o = objetoCerca();
    if (o) {
      const texto = o.id === 'caballo' ? T.pueblo.prompts.caballo : T.pueblo.prompts[o.id] || `[E] MIRAR: ${o.nombre}`;
      r.text(texto, x, y - 32, o.id === 'caballo' ? colors.bagLoot : colors.doorGlow, 'center', { lienzo: estiloNuevo.lienzoFino(r.ctx) });
    }
    r.ctx.restore();

    const fino = { lienzo: estiloNuevo.lienzoFino(r.ctx) };
    r.text('EL PUEBLO · PLANO EN BLOQUES', r.width / 2, 12, colors.text, 'center', fino);
    r.text(`$${gameState.money}`, r.width - 8, 12, colors.bagLoot, 'right', fino);
    if (mensaje) r.text(mensaje.texto, r.width / 2, r.height - 28, colors.text, 'center', fino);
    else if (scroll < 9) r.text(T.pueblo.keys, r.width / 2, r.height - 14, colors.textDim, 'center', fino);
  }

  function exit() {
    audio.quitarAmbiente('calle');
    audio.pararMusica();
  }

  return { enter, exit, update, render };
}
