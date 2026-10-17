/**
 * 🆕 LA PUERTITA VAIVÉN DE LA BARRA (primera clase) *(Santi: "animación, colisión y mecánica. La puerta
 * se puede romper con tres balazos, pero los guardias no tiran a lo loco como en una puerta de enganches,
 * porque sí te pueden ver")*.
 *
 *  - **SE ABRE EMPUJÁNDOLA**, como las puertas de los enganches: no frena a nadie. Las dos hojas giran
 *    hacia el lado contrario de quien pasa y, cuando queda libre, vuelven solas (más despacio).
 *  - **NO TAPA LA VISTA**: es baja. Por eso nadie tira a ciegas: te ven por encima.
 *  - **TRES BALAZOS LA ROMPEN**: la bala pasa, pero cada una la marca (una vez por bala, como a la
 *    puerta); al tercero queda una hoja colgando y la otra arrancada, y ya no se mueve.
 *
 * Es la casilla libre del tramo vertical del mostrador ('T' arriba y abajo, ver data/wagons.js). Se
 * dibuja en cada cuadro (gira), con los colores de la paleta y la luz del lugar.
 */
import { CONFIG } from '../data/config.js';
import { PALETA, sombrear } from '../engine/paleta.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';

const VIDA = 3;
const PEGADA = 5;          // como el mostrador (ver `primeraClase` en world/estiloNuevo/vagones.js)
const ALTO = 9;            // en puntos: más baja que el mostrador

/** Las puertitas de este tren (en cada hueco de un mostrador vertical). */
export function crearPortones(train) {
  const { map } = train, S = map.size, PASO = CONFIG.estilo.punto / 4;
  const out = [];
  for (let f = 1; f < map.rows - 1; f++) for (let c = 1; c < map.cols - 1; c++) {
    const g = map.grid;
    if (g[f][c] !== '.' || g[f - 1][c] !== 'T' || g[f + 1][c] !== 'T') continue;
    const y0 = f * S - PEGADA * PASO, y1 = (f + 1) * S - PEGADA * PASO;
    out.push({ x: (c + 0.5) * S, y0, y1, y: (y0 + y1) / 2, hw: S / 2, hh: S / 2, base: (f + 1) * S - 0.02,
      vida: VIDA, rota: false, abre: 0, dir: 1, libre: 0 });
  }
  return out;
}

/** Empujada por cualquiera que pase (vos, un guardia, un pasajero); sola, vuelve. */
export function actualizarPortones(portones, cuerpos, dt) {
  for (const p of portones || []) {
    if (p.rota) continue;
    const quien = cuerpos.find((b) => b && b.alive !== false && Math.abs(b.x - p.x) < p.hw + 3 && Math.abs(b.y - p.y) < p.hh);
    if (quien) {
      // Gira hacia el lado contrario de quien empuja (si ya estaba abierta, sigue para donde iba).
      if (p.abre < 0.1) p.dir = quien.x < p.x ? 1 : -1;
      p.libre = 0;
      p.abre = Math.min(1, p.abre + dt * 8);
    } else {
      p.libre += dt;
      if (p.libre > 0.25) p.abre = Math.max(0, p.abre - dt * 3);
    }
  }
}

/** Una bala que la cruza (cerrada o casi): le saca una vida; sin vida, queda rota. */
export function dañarPorton(p) {
  if (p.rota || p.abre > 0.5) return;
  p.vida -= 1;
  if (p.vida <= 0) { p.rota = true; p.abre = 0; }
}

/** La puertita, con la luz del lugar. */
export function dibujarPorton(r, p) {
  const PASO = CONFIG.estilo.punto / 4, ctx = r.ctx;
  const luz = estiloNuevo.luzEn ? Math.round(estiloNuevo.luzEn(p.x, p.y) || 0) : 0;
  const col = (i) => PALETA[i === 0 ? 0 : sombrear(i, luz)];
  const punto = (x, y, w, h, i) => {
    ctx.fillStyle = col(i);
    ctx.fillRect(Math.round(x / PASO) * PASO, Math.round(y / PASO) * PASO, w * PASO, h * PASO);
  };
  const L = (p.y1 - p.y0) / 2;                      // el largo de cada hoja
  const hojas = p.rota
    ? [{ hx: p.x, hy: p.y0, ang: 0.6, dirY: 1, largo: L * 0.75 }]           // una colgando; la otra, arrancada
    : [{ hx: p.x, hy: p.y0, ang: p.abre * Math.PI / 2, dirY: 1, largo: L }, { hx: p.x, hy: p.y1, ang: p.abre * Math.PI / 2, dirY: -1, largo: L }];
  const alto = ALTO * PASO;
  // Primero el contorno de las dos, después la madera (las hojas se tocan en el medio).
  for (const pasada of [0, 1]) for (const h of hojas) {
    const dx = Math.sin(h.ang) * p.dir, dy = Math.cos(h.ang) * h.dirY;
    const de = Math.abs(dx) > 0.35;                 // de frente: se le ve la cara
    for (let s = 0; s <= h.largo; s += PASO) {
      const x = h.hx + dx * s, y = h.hy + dy * s;
      if (pasada === 0) { punto(x - PASO, y - alto - PASO, 3, de ? ALTO + 2 : 3, 0); continue; }
      punto(x, y - alto, 1, 1, s < PASO ? 5 : 4);                                    // la tapa de la hoja
      if (de) { punto(x, y - alto + PASO, 1, ALTO - 1, 3); }                          // la cara
    }
    if (pasada === 1) {
      // Las marcas de los balazos.
      if (p.vida < VIDA && !p.rota) punto(h.hx + dx * h.largo * 0.5, h.hy + dy * h.largo * 0.5 - alto, 1, 1, 0);
      if (p.vida < VIDA - 1 && !p.rota) punto(h.hx + dx * h.largo * 0.8, h.hy + dy * h.largo * 0.8 - alto + PASO, 1, 1, 0);
      punto(h.hx, h.hy - alto, 1, 2, 7);                                             // la bisagra
      // Cerrada, de la hoja de abajo se ve la punta hacia acá.
      if (!de && h.dirY < 0 && !p.rota) punto(h.hx, h.hy - alto + PASO, 1, ALTO - 1, 3);
    }
  }
  if (p.rota) { punto(p.x + 2 * PASO, p.y1 - PASO, 2, 1, 3); punto(p.x - 3 * PASO, p.y1 - 2 * PASO, 1, 1, 3); }   // astillas
}
