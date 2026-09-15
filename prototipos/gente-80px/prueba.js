// PRUEBA JUGABLE A 72 PX. Va aparte del juego y se tira cuando se decida.
// Todo se mueve en unidades del juego (las de hoy) y se dibuja ×4: es
// justamente el plan, la lógica no cambia y sólo cambia cómo se pinta.
const ESC = 4, OX = 8, OY = 6, PI = Math.PI;

// Lo ya elegido y lo que se cambia jugando (arranca con lo recomendado).
const TAMANO = 80, VELOCIDAD = 78, RITMO_CAMINATA = 14;
const RITMOS_TROTE = [12, 16, 20], PROPS = ['A', 'Bs', 'B'];
let ritmo = 2, prop = 'A', largo = '1';
const LARGOS_ORDEN = ['hoy', '1', '2'];
/** Cuánto mide el dibujo (en puntos de pantalla). Las piernas largas lo hacen más alto. */
function medidas() {
  const s = TAMANO / 72, lp = PROPORCIONES[prop].piernas;
  return { s, W: Math.ceil(72 * s) + 2 * OX, H: Math.ceil((80 + lp) * s) + OY, CX: Math.round(24 * s) + OX, PIE: Math.round((74 + lp) * s) + OY };
}
const cv = document.getElementById('c');
cv.width = 1920; cv.height = 1080;
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const fondo = new Image();
fondo.src = FONDO;

// ------------------------------------------------ el vagón y los números
const CONF = {
  velocidad: 78, despacio: 40, patrulla: 24,
  vista: 118, apertura: 0.95, sospCerca: 2.2, sospLejos: 0.45, sospMoviendo: 1.5, sospDespacio: 0.45,
  memoria: 4.0, olvido: 0.15, oidoRadio: 58, oidoRitmo: 0.55,
};
const PISO = { x0: 2, x1: 460, y0: 80, y1: 195 };
const ASIENTOS = [
  ...[0, 95, 191, 287, 383].map((x) => ({ x, y: 84, w: 31, h: 18 })),
  ...[31, 127, 223, 319, 415].map((x) => ({ x, y: 164, w: 31, h: 18 })),
];
const HW = 4.5, HH = 3.5;

function libre(x, y, yo) {
  if (x - HW < PISO.x0 || x + HW > PISO.x1 || y - HH < PISO.y0 || y + HH > PISO.y1) return false;
  if (ASIENTOS.some((a) => x + HW > a.x && x - HW < a.x + a.w && y + HH > a.y && y - HH < a.y + a.h)) return false;
  return ![jugador, ...guardias, ...pasajeros].some((o) => o !== yo && !o.muerto && Math.abs(o.x - x) < 8 && Math.abs(o.y - y) < 6);
}

// ------------------------------------------------------------- dibujos
const cache = new Map();
function vistaDe(angulo) {
  const sector = ((Math.round(angulo / (PI / 4)) % 8) + 8) % 8;
  return [[lado, 0, false], [frente, 1, false], [frente, 0, false], [frente, 1, true],
    [lado, 0, true], [espalda, 1, true], [espalda, 0, false], [espalda, 1, false]][sector];
}
function sprite(o) {
  const [fn, g, espejo] = vistaDe(o.dir);
  const modo = o.modo || 'quieto';
  const estado = o.estado === 'calma' ? undefined : o.estado;
  // Vos siempre con el revólver en la mano (apuntás con el mouse); el guardia, cuando te vio.
  const arma = o.tipo === 'jugador' ? !!o.apunta && !o.muerto : o.estado === 'alerta';
  const cuadro = modo === 'quieto' ? 0 : cuadroDe(o);
  const k = [o.tipo, fn.name, g, modo, cuadro, estado, arma, prop, PISADA, largo].join('|');
  if (!cache.has(k)) {
    const m = medidas();
    // Al trotar el torso se va para adelante; de frente o de espaldas no se nota.
    const lateral = fn === lado ? 1 : g ? 0.5 : 0;
    const inclina = (modo === 'trotar' ? 0.1 : modo === 'agachado' ? 0.12 : 0) * lateral;
    const L = Lienzo(m.W, m.H, OX, OY, m.s, deformar(prop, inclina, largo));
    const datos = { tipo: o.tipo, g, estado, arma, piernas: LARGOS[largo].piernas };
    if (modo === 'trotar') datos.trote = cuadro;
    else { datos.paso = cuadro; datos.agachado = modo === 'agachado'; }
    fn(L, datos);
    cache.set(k, L.canvas());
  }
  return { cv: cache.get(k), espejo };
}

const GLIFOS = {
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '..#..', '.....', '..#..'],
  '!': ['##', '##', '##', '##', '##', '..', '##'],
};
/** Los avisos, del mismo tamaño que hoy: cada cuadradito del signo mide 4×4. */
function signo(x, abajo, cual, llenado) {
  const gl = GLIFOS[cual], k = 4, w = gl[0].length * k, h = gl.length * k;
  const x0 = Math.round(x - w / 2), y0 = Math.round(abajo - h - (llenado != null ? 12 : 0));
  for (const [col, pad] of [[NEGRO, 2], [cual === '?' ? '#f8d830' : '#ff3a2a', 0]]) {
    ctx.fillStyle = col;
    gl.forEach((f, j) => [...f].forEach((ch, i) => {
      if (ch === '#') ctx.fillRect(x0 + i * k - pad, y0 + j * k - pad, k + 2 * pad, k + 2 * pad);
    }));
  }
  if (llenado != null) {
    ctx.fillStyle = NEGRO; ctx.fillRect(Math.round(x) - 18, abajo - 8, 36, 8);
    ctx.fillStyle = llenado > 0.66 ? '#f09030' : '#f8d830';
    ctx.fillRect(Math.round(x) - 16, abajo - 6, Math.round(32 * llenado), 4);
  }
}

// ------------------------------------------------------------- la gente
let jugador, guardias, pasajeros, zoom = 1;
function nuevaPartida() {
  const guardia = (x, y, dir, ruta, i) => ({ tipo: 'guardia', x, y, dir, ruta, i, espera: 0, sosp: 0, sinVer: 99, estado: 'calma', fase: 0, quieto: 99 });
  jugador = { tipo: 'jugador', x: 240, y: 127.5, dir: -PI / 2, fase: 0, quieto: 99, estado: 'calma' };
  guardias = [
    guardia(166, 127.5, PI, [[60, 127.5], [200, 127.5]], 0),
    guardia(330, 143.5, 0, [[300, 143.5], [440, 143.5], [440, 120], [300, 120]], 1),
  ];
  pasajeros = [
    { tipo: 'pasajero', x: 134, y: 95.2, dir: PI / 2, base: PI / 2, estado: 'calma' },
    { tipo: 'pasajero', x: 358, y: 95.2, dir: PI / 2, base: PI / 2, estado: 'calma' },
    { tipo: 'pasajero', x: 262, y: 175.2, dir: -PI / 2, base: -PI / 2, estado: 'calma' },
  ];
}

const dif = (a, b) => ((b - a + 3 * PI) % (2 * PI)) - PI;
const girar = (a, b, max) => { const d = dif(a, b); return a + Math.max(-max, Math.min(max, d)); };
/** Un paso cada tantas unidades recorridas: trotando, las del 1-2-3; caminando, 14. */
function andar(o, dist, dt) {
  const r = o.modo === 'trotar' ? RITMOS_TROTE[ritmo] : RITMO_CAMINATA;
  if (dist > 0.05) { o.fase += dist / r; o.quieto = 0; } else o.quieto += dt;
}
/**
 * Dos pasos son 8 cuadros. Trotando son 8 dibujos seguidos; caminando, 5
 * dibujos en este orden: paso 1, a mitad, juntos, a mitad del otro lado, paso 2...
 */
const CICLO_CAMINATA = [1, 3, 0, 4, 2, 4, 0, 3];
function cuadroDe(o) {
  if (o.quieto > 0.07) return 0;
  const i = Math.floor((((o.fase % 2) + 2) % 2) * 4) % 8;
  return o.modo === 'trotar' ? i : CICLO_CAMINATA[i];
}
function desplazar(o, dx, dy) {
  const x0 = o.x, y0 = o.y;
  if (libre(o.x + dx, o.y, o)) o.x += dx;
  if (libre(o.x, o.y + dy, o)) o.y += dy;
  return Math.hypot(o.x - x0, o.y - y0);
}

// ------------------------------------------------------------ el teclado
const teclas = new Set();
addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  teclas.add(e.code);
  if (e.code === 'KeyR') nuevaPartida();
  if (e.code === 'KeyZ') zoom = zoom === 1 ? 2 : 1;
  if (e.code === 'KeyF') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) ritmo = +e.code.slice(5) - 1;
  if (e.code === 'KeyT') PISADA = PISADA === 'nueva' ? 'vieja' : 'nueva';
  mostrarOpciones();
});
addEventListener('keyup', (e) => teclas.delete(e.code));
addEventListener('blur', () => teclas.clear());

// ----------------------------------------------------------- actualizar
function actualizar(dt) {
  const t = (...c) => c.some((k) => teclas.has(k));
  let dx = (t('KeyD', 'ArrowRight') ? 1 : 0) - (t('KeyA', 'ArrowLeft') ? 1 : 0);
  let dy = (t('KeyS', 'ArrowDown') ? 1 : 0) - (t('KeyW', 'ArrowUp') ? 1 : 0);
  const despacio = t('ShiftLeft', 'ShiftRight');
  const moviendo = dx !== 0 || dy !== 0;
  jugador.modo = despacio ? 'agachado' : moviendo ? 'trotar' : 'quieto';
  if (moviendo) {
    const n = Math.hypot(dx, dy), v = (despacio ? CONF.despacio : VELOCIDAD) * dt / n;
    if (!jugador.apunta) jugador.dir = Math.atan2(dy, dx);
    andar(jugador, desplazar(jugador, dx * v, dy * v), dt);
  } else andar(jugador, 0, dt);

  for (const gd of guardias) {
    if (gd.muerto) { gd.modo = 'quieto'; continue; }
    const ex = jugador.x - gd.x, ey = jugador.y - gd.y, d = Math.hypot(ex, ey), ang = Math.atan2(ey, ex);
    const ve = d < CONF.vista && Math.abs(dif(gd.dir, ang)) < CONF.apertura;
    let sube = 0;
    if (ve) sube += (CONF.sospCerca + (CONF.sospLejos - CONF.sospCerca) * (d / CONF.vista)) * (moviendo ? CONF.sospMoviendo : 1) * (despacio ? CONF.sospDespacio : 1);
    if (moviendo && !despacio && d < CONF.oidoRadio) sube += CONF.oidoRitmo * (1 - d / CONF.oidoRadio);
    let caminado = 0;
    if (gd.estado === 'alerta') {
      gd.sinVer = ve ? 0 : gd.sinVer + dt;
      if (d < CONF.vista * 1.5) gd.dir = girar(gd.dir, ang, 6 * dt);
      // Te persigue trotando mientras te tenga fresco; de cerca se para y te apunta.
      // Si te ve, se para a tirar desde 90; si no, se acerca hasta encontrarte.
      if (d > (ve ? 90 : 34) && gd.sinVer < 2) caminado = desplazar(gd, Math.cos(ang) * 46 * dt, Math.sin(ang) * 46 * dt);
      if (gd.sinVer > 6) { gd.estado = 'sospecha'; gd.sosp = 0.95; gd.sinVer = 0; }
    } else if (sube > 0) {
      gd.sosp = Math.min(1, gd.sosp + sube * dt); gd.sinVer = 0;
      gd.mira = ang;
      gd.dir = girar(gd.dir, ang, 2.5 * dt);
      gd.estado = gd.sosp >= 1 ? 'alerta' : 'sospecha';
    } else {
      gd.sinVer += dt;
      // Aunque dejes de hacer ruido, se sigue dando vuelta hacia donde te oyó.
      if (gd.mira != null) gd.dir = girar(gd.dir, gd.mira, 2.5 * dt);
      if (gd.sinVer > CONF.memoria) gd.sosp = Math.max(0, gd.sosp - CONF.olvido * dt);
      gd.estado = gd.sosp > 0 ? 'sospecha' : 'calma';
      if (gd.estado === 'calma') gd.mira = null;
    }
    if (gd.estado === 'calma') {
      const [tx, ty] = gd.ruta[gd.i];
      const a = Math.atan2(ty - gd.y, tx - gd.x);
      if (gd.espera > 0) gd.espera -= dt;
      else if (Math.hypot(tx - gd.x, ty - gd.y) < 1.5) { gd.i = (gd.i + 1) % gd.ruta.length; gd.espera = 1.2; }
      else {
        gd.dir = girar(gd.dir, a, 5 * dt);
        if (Math.abs(dif(gd.dir, a)) < 0.3) caminado = desplazar(gd, Math.cos(a) * CONF.patrulla * dt, Math.sin(a) * CONF.patrulla * dt);
      }
    }
    gd.modo = caminado > 0.05 ? (gd.estado === 'alerta' ? 'trotar' : 'caminar') : 'quieto';
    andar(gd, caminado, dt);
  }
  for (const p of pasajeros) {
    const d = Math.hypot(jugador.x - p.x, jugador.y - p.y);
    p.dir = d < 50 ? Math.atan2(jugador.y - p.y, jugador.x - p.x) : p.base;
  }
}

// -------------------------------------------------------------- dibujar
const CONO = { calma: 'rgba(255,245,220,0.08)', sospecha: 'rgba(248,216,48,0.13)', alerta: 'rgba(255,58,42,0.16)' };
function dibujar() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1920, 1080);
  if (zoom === 2) ctx.setTransform(2, 0, 0, 2, Math.round(960 - jugador.x * ESC * 2), Math.round(540 - jugador.y * ESC * 2));
  ctx.drawImage(fondo, 0, 0, 1920, 1080);
  for (const gd of guardias) {
    if (gd.muerto) continue;
    const ox = gd.x * ESC, oy = (gd.y - 2) * ESC;
    ctx.fillStyle = CONO[gd.estado];
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.arc(ox, oy, CONF.vista * ESC, gd.dir - CONF.apertura, gd.dir + CONF.apertura); ctx.closePath(); ctx.fill();
  }
  const cosas = ASIENTOS.map((a) => ({
    base: a.y + a.h,
    draw: () => ctx.drawImage(fondo, a.x, a.y, a.w, a.h, a.x * ESC, a.y * ESC, a.w * ESC, a.h * ESC),
  }));
  for (const o of [jugador, ...guardias, ...pasajeros]) {
    const hh = o.tipo === 'pasajero' ? 2.8 : HH;
    cosas.push({ base: o.y + hh, draw: () => persona(o, o.y + hh) });
  }
  cosas.sort((a, b) => a.base - b.base);
  for (const c of cosas) c.draw();
  // Los avisos van arriba de todo, para que nada los tape.
  for (const gd of guardias) {
    if (gd.muerto) continue;
    const x = gd.x * ESC, abajo =Math.round((gd.y + HH) * ESC) - medidas().PIE + OY - 6;
    if (gd.estado === 'sospecha') signo(x, abajo, '?', gd.sosp);
    if (gd.estado === 'alerta') signo(x, abajo, '!');
  }
  if (typeof dibujarTiroteo === 'function') dibujarTiroteo();
}
function persona(o, pies) {
  const x = Math.round(o.x * ESC), y = Math.round(pies * ESC);
  const m = medidas();
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(x, y, 16 * m.s, 5 * m.s, 0, 0, 2 * PI); ctx.fill();
  const { cv: img, espejo } = sprite(o);
  ctx.save(); ctx.translate(x, y);
  // Los caídos quedan tirados en el piso (girados), provisorio hasta tener su dibujo.
  if (o.muerto) { ctx.rotate(-PI / 2); ctx.globalAlpha = 0.85; }
  if (espejo) ctx.scale(-1, 1);
  ctx.drawImage(img, -m.CX, -m.PIE);
  ctx.restore();
}

// --------------------------------------------------------------- bucle
function mostrarOpciones() {
  const el = document.getElementById('opciones');
  if (!el) return;
  const r = RITMOS_TROTE[ritmo];
  el.textContent = `Trote (1-2-3): un paso cada ${r} = ${(VELOCIDAD / r).toFixed(1)} pasos/s · Pisada (T): ${PISADA}`;
}
nuevaPartida();
mostrarOpciones();
let antes = null;
function cuadro(t) {
  const dt = antes == null ? 0 : Math.min(0.05, (t - antes) / 1000);
  antes = t;
  actualizar(dt);
  if (fondo.complete) dibujar();
  requestAnimationFrame(cuadro);
}
requestAnimationFrame(cuadro);
