// EL TIROTEO MÍNIMO. Apuntás con el mouse y disparás con clic; los guardias
// alertados te tiran. Va encima de prueba.js sin tocar su lógica de sigilo.
const TIRO = {
  velocidad: 210,        // como bulletSpeed del juego
  cadencia: 0.35,        // segundos entre tiros tuyos (manteniendo el clic)
  alto: 9,               // la bala viaja a la altura de la mano, 9 unidades sobre el piso
  vidaGuardia: 2, vidasJugador: 3, oido: 230,
  guardiaCadencia: 1.1, guardiaAlcance: 130, guardiaDesvio: 0.12, invulnerable: 0.6,
};
let balas = [], fogonazos = [], ultimoMouse = null, quiereDisparar = false, enfriar = 0, golpe = 0;

// ------------------------------------------------------------- el mouse
function aMundo(ev) {
  const r = cv.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  const sx = (ev.clientX - r.left) * 1920 / r.width, sy = (ev.clientY - r.top) * 1080 / r.height;
  const k = zoom === 2 ? 2 : 1;
  const tx = zoom === 2 ? Math.round(960 - jugador.x * ESC * 2) : 0, ty = zoom === 2 ? Math.round(540 - jugador.y * ESC * 2) : 0;
  return { x: (sx - tx) / k / ESC, y: (sy - ty) / k / ESC };
}
cv.addEventListener('mousemove', (e) => { ultimoMouse = { clientX: e.clientX, clientY: e.clientY }; jugador.apunta = true; });
cv.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  ultimoMouse = { clientX: e.clientX, clientY: e.clientY }; jugador.apunta = true; quiereDisparar = true;
});
addEventListener('mouseup', () => { quiereDisparar = false; });
cv.addEventListener('contextmenu', (e) => e.preventDefault());

// ------------------------------------------------------------ la partida
const partidaBase = nuevaPartida;
nuevaPartida = function () {
  partidaBase();
  balas = []; fogonazos = []; enfriar = 0; golpe = 0;
  jugador.vidas = TIRO.vidasJugador; jugador.apunta = ultimoMouse != null;
  for (const gd of guardias) { gd.vida = TIRO.vidaGuardia; gd.recarga = 0.8; }
};
nuevaPartida();

const piesDe = (o) => o.y + (o.tipo === 'pasajero' ? 2.8 : HH);

function disparar(o, ang, desvio) {
  const a = ang + (Math.random() * 2 - 1) * desvio;
  const x = o.x + Math.cos(a) * 7, y = piesDe(o) + Math.sin(a) * 7;
  balas.push({ x, y, dx: Math.cos(a), dy: Math.sin(a), de: o, vida: 1.5 });
  fogonazos.push({ x, y, t: 0.06 });
}

/** Un tiro se oye lejos: todo guardia vivo a menos de 230 se pone en alerta mirando hacia ahí. */
function ruido(o) {
  for (const gd of guardias) {
    if (gd.muerto || Math.hypot(gd.x - o.x, gd.y - o.y) > TIRO.oido) continue;
    gd.estado = 'alerta'; gd.sosp = 1; gd.sinVer = 0; gd.mira = Math.atan2(o.y - gd.y, o.x - gd.x);
  }
}

function herir(o, b) {
  if (o === jugador) {
    if (golpe > 0) return;
    jugador.vidas--; golpe = TIRO.invulnerable;
    fogonazos.push({ x: b.x, y: b.y, t: 0.12, sangre: true });
    if (jugador.vidas <= 0) { jugador.muerto = true; quiereDisparar = false; }
    return;
  }
  fogonazos.push({ x: b.x, y: b.y, t: 0.12, sangre: o.tipo === 'guardia' });
  if (o.tipo !== 'guardia') return;
  o.vida--; o.estado = 'alerta'; o.sosp = 1; o.sinVer = 0; o.mira = Math.atan2(b.de.y - o.y, b.de.x - o.x);
  if (o.vida <= 0) { o.muerto = true; o.estado = 'calma'; o.modo = 'quieto'; }
}

function moverBalas(dt) {
  const quedan = [];
  for (const b of balas) {
    let viva = true;
    // En pasitos, para que una bala rápida no atraviese a nadie entre cuadro y cuadro.
    for (let i = 0; i < 4 && viva; i++) {
      b.x += b.dx * TIRO.velocidad * dt / 4; b.y += b.dy * TIRO.velocidad * dt / 4;
      if (b.x < PISO.x0 || b.x > PISO.x1 || b.y < PISO.y0 || b.y > PISO.y1) { viva = false; break; }
      if (ASIENTOS.some((a) => b.x > a.x && b.x < a.x + a.w && b.y > a.y && b.y < a.y + a.h)) {
        viva = false; fogonazos.push({ x: b.x, y: b.y, t: 0.08, astilla: true }); break;
      }
      for (const o of [jugador, ...guardias, ...pasajeros]) {
        if (o === b.de || o.muerto) continue;
        if (b.de.tipo === 'guardia' && o.tipo === 'guardia') continue;
        if (Math.abs(b.x - o.x) < 5 && Math.abs(b.y - piesDe(o)) < 4) { viva = false; herir(o, b); break; }
      }
    }
    if (viva && (b.vida -= dt) > 0) quedan.push(b);
  }
  balas = quedan;
}

// ----------------------------------------------------------- actualizar
const actualizarBase = actualizar;
actualizar = function (dt) {
  if (jugador.muerto) teclas.clear();
  actualizarBase(dt);
  golpe = Math.max(0, golpe - dt); enfriar -= dt;
  const m = ultimoMouse && !jugador.muerto ? aMundo(ultimoMouse) : null;
  if (m && Number.isFinite(m.x) && Number.isFinite(m.y)) {
    // Se apunta desde la mano (a la altura del pecho), no desde los pies.
    jugador.dir = Math.atan2(m.y - (piesDe(jugador) - TIRO.alto), m.x - jugador.x);
    if (quiereDisparar && enfriar <= 0) { disparar(jugador, jugador.dir, 0.03); enfriar = TIRO.cadencia; ruido(jugador); }
  }
  for (const gd of guardias) {
    if (gd.muerto || gd.estado !== 'alerta' || jugador.muerto) continue;
    gd.recarga -= dt;
    const d = Math.hypot(jugador.x - gd.x, jugador.y - gd.y), ang = Math.atan2(jugador.y - gd.y, jugador.x - gd.x);
    if (gd.recarga <= 0 && d < TIRO.guardiaAlcance && Math.abs(dif(gd.dir, ang)) < 0.4) {
      disparar(gd, gd.dir, TIRO.guardiaDesvio); gd.recarga = TIRO.guardiaCadencia;
    }
  }
  moverBalas(dt);
  fogonazos = fogonazos.filter((f) => (f.t -= dt) > 0);
};

// -------------------------------------------------------------- dibujar
function dibujarTiroteo() {
  for (const b of balas) {
    const x = b.x * ESC, y = b.y * ESC, yh = (b.y - TIRO.alto) * ESC;
    // La sombrita en el piso dice por dónde va la bala de verdad.
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 1, 6, 3);
    ctx.strokeStyle = '#ffe8a0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - b.dx * 22, yh - b.dy * 22); ctx.lineTo(x, yh); ctx.stroke();
  }
  for (const f of fogonazos) {
    const r = f.sangre ? 6 : f.astilla ? 5 : 10;
    ctx.fillStyle = f.sangre ? '#b0302a' : f.astilla ? '#c89a60' : '#ffd860';
    ctx.fillRect(Math.round(f.x * ESC - r / 2), Math.round((f.y - TIRO.alto) * ESC - r / 2), r, r);
  }
  // Lo que no se mueve con la cámara: las vidas y el golpe.
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < TIRO.vidasJugador; i++) {
    const x = 1900 - 44 * (i + 1);
    ctx.fillStyle = NEGRO; ctx.fillRect(x - 3, 17, 38, 38);
    ctx.fillStyle = i < jugador.vidas ? '#c8342a' : '#3a2a22'; ctx.fillRect(x, 20, 32, 32);
  }
  if (golpe > 0) { ctx.fillStyle = `rgba(200,40,30,${(golpe * 0.4).toFixed(2)})`; ctx.fillRect(0, 0, 1920, 1080); }
  if (jugador.muerto) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 470, 1920, 140);
    ctx.fillStyle = '#e8dcc0'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Te bajaron — R para empezar de nuevo', 960, 558);
  }
  ctx.restore();
}
