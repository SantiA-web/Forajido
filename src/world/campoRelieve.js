/**
 * ⛰️ EL RELIEVE DEL CAMPO (scenes/campoScene.js), sacado del plano (data/plano.js) *(Santi, 2026-11-24: "no todo tiene
 * que ser plano, deberían haber distintos niveles de altura: ir por zonas más profundas o zonas elevadas como mesetas y
 * colinas bajas. Además, ríos, caminos marcados por carretas"; y antes de los bordes: "por si después tenemos que
 * agrandar más aún el mapa podemos hacerlo sin romper el borde")*. Los números, en `CAMPO.relieve` (data/campo.js).
 *
 * LO QUE HAY Y CÓMO SE VE EN ESTA CÁMARA (3/4, lo de arriba a abajo achatado):
 *   - **Lo alto** (meseta, cerro, sierra, malpaís): la planta en el suelo, la tapa corrida hacia arriba su `alto`, y entre
 *     las dos la barranca (sólo las caras que miran a la cámara). No se sube ni se baja por la barranca: sólo por las
 *     subidas. Arriba se ve más lejos (la escena aleja la lupa).
 *   - **Lo hondo** (arroyos): una franja de arena con la orilla de enfrente a la vista. Adentro no te ven de lejos.
 *   - **El agua** (ríos): no se cruza, salvo por los vados.
 *   - **Las lomas**: lomitas bajas; el caballo va más lento.
 *   - **Los caminos de carreta**: tierra pisada con dos huellas; al trote se va más rápido.
 */
import { ACHATA } from './destinos.js';
import { suavizar, aSegmento, normalAchatada } from './campoVias.js';

const COLOR = {
  meseta: { cara: '#9a6a48', caraSombra: '#7e5338', veta: '#6e4630', tapa: '#c8955f', borde: '#e0b07a' },
  cerro: { cara: '#8f6a4c', caraSombra: '#735239', veta: '#5e4230', tapa: '#b48a62', borde: '#d0a678' },
  sierra: { cara: '#6e5644', caraSombra: '#58443a', veta: '#46362c', tapa: '#8a6e58', borde: '#a48a70' },
  malpais: { cara: '#5e4636', caraSombra: '#4a372c', veta: '#3a2b22', tapa: '#74584a', borde: '#8a6c5a' },
  subida: '#b8956a', subidaBorde: '#d8b888',
  agua: '#4f7fa8', aguaBrillo: '#7fa8c8', orilla: '#9a8058', vado: '#86a8b8', vadoPiedra: '#b8a07a',
  arroyoOrilla: '#7a5a3c', arroyoFondo: '#b39066', arroyoPiedra: '#8e7456',
  camino: '#d4b88c', huella: '#9a7a52',
  loma: '#d4b88c', lomaSombra: '#a8865e',
  tunel: '#140e0a', tunelPiedra: '#8a7a68',
};

const dentro = (pts, x, y) => {
  let si = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) si = !si;
  }
  return si;
};
const caja = (pts, m = 0) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0: x0 - m, y0: y0 - m, x1: x1 + m, y1: y1 + m };
};
const enCaja = (c, x, y) => x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1;
const tocaCaja = (c, x0, y0, x1, y1) => c.x1 >= x0 && c.x0 <= x1 && c.y1 >= y0 && c.y0 <= y1;
/** Distancia de verdad (sin achatar) de un punto a una línea achatada. */
function aLinea(pts, x, y) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    d = Math.min(d, aSegmento(x, y / ACHATA, pts[i][0], pts[i][1] / ACHATA, pts[i + 1][0], pts[i + 1][1] / ACHATA));
  }
  return d;
}

/**
 * Arma el relieve: `aMundo(px, py)` pasa del papel al mundo de verdad (`[x, yDeVerdad]`, sin achatar); `R` son los
 * números (`CAMPO.relieve`).
 */
export function armarRelieve(plano, aMundo, R) {
  const plana = (p) => { const [x, y] = aMundo(p[0], p[1]); return [x, y * ACHATA]; };
  const porPapel = aMundo(1, 0)[0] - aMundo(0, 0)[0];
  /** Una línea del papel, suavizada y achatada. */
  const linea = (puntos, radio, cada = 40) => suavizar(puntos.map((p) => aMundo(p[0], p[1])), false, radio, cada).map(([x, y]) => [x, y * ACHATA]);

  const formas = [], lomas = [], rios = [], arroyos = [], caminos = [];
  for (const r of plano.relieve) {
    if (R.alto[r.tipo] != null) {
      const pts = r.puntos.map(plana);
      // Para cada borde, hacia dónde queda afuera (para saber qué caras ve la cámara).
      const bordes = pts.map((a, i) => {
        const b = pts[(i + 1) % pts.length], n = normalAchatada(a, b);
        const mx = (a[0] + b[0]) / 2 + n[0] * 4, my = (a[1] + b[1]) / 2 + n[1] * 4;
        return { a, b, n: dentro(pts, mx, my) ? [-n[0], -n[1]] : n };
      });
      formas.push({ tipo: r.tipo, nombre: r.nombre, pts, bordes, alto: R.alto[r.tipo], caja: caja(pts),
        subidas: (r.subidas || []).map(plana), corte: null, bocas: [] });
    } else if (r.tipo === 'lomas') {
      const pts = r.puntos.map(plana);
      lomas.push({ pts, caja: caja(pts) });
    } else if (r.tipo === 'rio') {
      const pts = linea(r.puntos, 4000), ancho = r.ancho * porPapel * R.rio;
      rios.push({ nombre: r.nombre, pts, ancho, caja: caja(pts, ancho), vados: (r.vados || []).map(plana) });
    } else if (r.tipo === 'arroyo') {
      const pts = linea(r.puntos, 1500);
      arroyos.push({ nombre: r.nombre, pts, caja: caja(pts, R.anchoArroyo) });
    }
  }
  for (const c of plano.caminos || []) {
    // 🔁 (Sin suavizar: tramos rectos con quiebres, así la carreta va alineada. Ver PLANO.caminos.)
    const pts = c.puntos.map(plana);
    caminos.push({ nombre: c.nombre, pts, caja: caja(pts, R.anchoCamino) });
  }

  const formaEn = (x, y) => formas.find((f) => enCaja(f.caja, x, y) && dentro(f.pts, x, y)) || null;
  const cercaDeSubida = (f, x, y) => f.subidas.some(([sx, sy]) => Math.hypot(sx - x, (sy - y) / ACHATA) < R.subidaAncho);

  /** Qué suelo hay en (x, y): agua, vado, arroyo, camino, lomas. */
  function sueloEn(x, y) {
    const s = { agua: null, vado: false, arroyo: null, camino: null, lomas: false };
    for (const r of rios) {
      if (!enCaja(r.caja, x, y) || aLinea(r.pts, x, y) > r.ancho / 2) continue;
      s.agua = r;
      s.vado = r.vados.some(([vx, vy]) => Math.hypot(vx - x, (vy - y) / ACHATA) < r.ancho / 2 + R.vadoAncho);
    }
    for (const a of arroyos) if (enCaja(a.caja, x, y) && aLinea(a.pts, x, y) < R.anchoArroyo / 2) s.arroyo = a;
    for (const c of caminos) if (enCaja(c.caja, x, y) && aLinea(c.pts, x, y) < R.anchoCamino / 2) s.camino = c;
    s.lomas = lomas.some((l) => enCaja(l.caja, x, y) && dentro(l.pts, x, y));
    return s;
  }

  /**
   * Si se puede pasar a (x, y) estando arriba de `sobre` (o en el suelo si es null). Devuelve `{ ok, sobre, motivo }`.
   * `porVia(x, y)` dice si ahí hay vía: por la trinchera del malpaís se pasa.
   */
  function moverse(sobre, x, y, porVia) {
    if (sobre) {
      if (dentro(sobre.pts, x, y)) return { ok: true, sobre };
      if (cercaDeSubida(sobre, x, y)) return { ok: true, sobre: null };
      return { ok: false, sobre, motivo: 'barranca' };
    }
    const f = formaEn(x, y);
    if (f) {
      if (cercaDeSubida(f, x, y)) return { ok: true, sobre: f };
      if (f.tipo === 'malpais' && porVia(x, y)) return { ok: true, sobre: null };
      return { ok: false, sobre: null, motivo: f.tipo };
    }
    const s = sueloEn(x, y);
    if (s.agua && !s.vado) return { ok: false, sobre: null, motivo: 'agua' };
    return { ok: true, sobre: null };
  }

  /** El borde de abajo de una forma en la columna `x` (para saber qué queda delante y qué detrás). */
  function bordeSur(f, x) {
    let y = -Infinity;
    for (const { a, b } of f.bordes) {
      if ((a[0] <= x) === (b[0] <= x)) continue;
      y = Math.max(y, a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]));
    }
    return y === -Infinity ? f.caja.y1 : y;
  }

  /** Si algo puesto en (x, y) quedaría metido en una forma, pegado a su barranca o tapado por su tapa. */
  function cercaDeForma(x, y, d) {
    for (const f of formas) {
      if (!enCaja({ x0: f.caja.x0 - d, y0: f.caja.y0 - d, x1: f.caja.x1 + d, y1: f.caja.y1 + d + f.alto }, x, y)) continue;
      if (dentro(f.pts, x, y) || dentro(f.pts, x, y + f.alto)) return true;
      for (const { a, b } of f.bordes) if (aSegmento(x, y / ACHATA, a[0], a[1] / ACHATA, b[0], b[1] / ACHATA) < d) return true;
    }
    return false;
  }
  /** Si (x, y) cae en el agua, o sobre un camino. */
  const enAguaOCamino = (x, y, d) => rios.some((r) => enCaja(r.caja, x, y) && aLinea(r.pts, x, y) < r.ancho / 2 + d)
    || caminos.some((c) => enCaja(c.caja, x, y) && aLinea(c.pts, x, y) < R.anchoCamino / 2 + d);

  // ── Dibujar ──
  /** Una franja a lo largo de una línea (achatada como la vía), de `medio` a cada lado, corrida `bajar` hacia abajo. */
  function banda(ctx, pts, medio, color, bajar = 0) {
    ctx.fillStyle = color; ctx.beginPath();
    for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[k], b = pts[k + 1], n = normalAchatada(a, b);
      // (Cada tramo, estirado un poco para que se unan: un quinto de su largo, pero no más que el medio ancho; si no, en
      // los caminos de tramos largos sobresalía una punta en cada esquina.)
      const largo = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, estira = Math.min(0.2, medio / largo);
      const dx = (b[0] - a[0]) * estira, dy = (b[1] - a[1]) * estira;
      ctx.moveTo(a[0] - dx + n[0] * medio, a[1] - dy + n[1] * medio + bajar);
      ctx.lineTo(b[0] + dx + n[0] * medio, b[1] + dy + n[1] * medio + bajar);
      ctx.lineTo(b[0] + dx - n[0] * medio, b[1] + dy - n[1] * medio + bajar);
      ctx.lineTo(a[0] - dx - n[0] * medio, a[1] - dy - n[1] * medio + bajar);
      ctx.closePath();
    }
    ctx.fill();
  }
  function rayas(ctx, pts, off, color, w) {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath();
    for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[k], b = pts[k + 1], n = normalAchatada(a, b);
      ctx.moveTo(a[0] + n[0] * off, a[1] + n[1] * off); ctx.lineTo(b[0] + n[0] * off, b[1] + n[1] * off);
    }
    ctx.stroke();
  }
  /** Lo que va en el suelo (se pinta una vez por pedazo): lomas, ríos y vados, arroyos, caminos. */
  function pintarSuelo(ctx, x0, y0, lado) {
    const x1 = x0 + lado, y1 = y0 + lado;
    // Las lomas: lomitas sueltas, cada una con su lado de sombra.
    for (const l of lomas) {
      if (!tocaCaja(l.caja, x0 - 60, y0 - 60, x1 + 60, y1 + 60)) continue;
      const P = 90;
      for (let gx = Math.floor((x0 - 60) / P); gx <= Math.ceil((x1 + 60) / P); gx++) {
        for (let gy = Math.floor((y0 - 60) / (P * 0.6)); gy <= Math.ceil((y1 + 60) / (P * 0.6)); gy++) {
          const h1 = hash(gx, gy), h2 = hash(gy, gx, 3);
          const x = (gx + h1) * P, y = (gy + h2) * P * 0.6;
          if (!dentro(l.pts, x, y)) continue;
          const rx = 30 + h1 * 26, ry = rx * 0.32;
          ctx.fillStyle = COLOR.lomaSombra; ctx.beginPath(); ctx.ellipse(x, y + 3, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = COLOR.loma; ctx.beginPath(); ctx.ellipse(x - 2, y - 1, rx * 0.94, ry * 0.9, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    for (const a of arroyos) {
      if (!tocaCaja(a.caja, x0, y0, x1, y1)) continue;
      // Hondo: la orilla de enfrente (la de arriba) se ve como una franja más oscura; la de acá queda escondida.
      banda(ctx, a.pts, R.anchoArroyo / 2 + 14, COLOR.arroyoOrilla);
      banda(ctx, a.pts, R.anchoArroyo / 2 - 2, COLOR.arroyoFondo, 6);
    }
    for (const c of caminos) {
      if (!tocaCaja(c.caja, x0, y0, x1, y1)) continue;
      banda(ctx, c.pts, R.anchoCamino / 2, COLOR.camino);
      // 🔁 (Sin las huellas de las ruedas: lisos *(Santi: "a los caminos no les pongas los huecos de las carretas")*.)
    }
    for (const r of rios) {
      if (!tocaCaja(r.caja, x0, y0, x1, y1)) continue;
      banda(ctx, r.pts, r.ancho / 2 + 30, COLOR.orilla);
      banda(ctx, r.pts, r.ancho / 2, COLOR.agua);
      rayas(ctx, r.pts, r.ancho * 0.15, COLOR.aguaBrillo, 1.5);
      for (const [vx, vy] of r.vados) {
        ctx.fillStyle = COLOR.vado; ctx.beginPath();
        ctx.ellipse(vx, vy, R.vadoAncho * 1.2, (r.ancho / 2) * ACHATA * 0.95, 0, 0, Math.PI * 2); ctx.fill();
        // (El vado: agua baja, más clara, con las piedras que asoman.)
        for (let k = 0; k < 22; k++) {
          ctx.fillStyle = COLOR.vadoPiedra;
          ctx.fillRect(vx + (hash(k, 1) - 0.5) * R.vadoAncho * 2, vy + (hash(k, 2) - 0.5) * r.ancho * ACHATA, 8 + hash(k, 3) * 10, 4);
        }
      }
    }
  }
  const hayAlgo = (x0, y0, lado) => [...lomas, ...arroyos, ...caminos, ...rios].some((c) => tocaCaja(c.caja, x0, y0, x0 + lado, y0 + lado));

  /** Lo que va debajo de un tramo de vía: el puente sobre el río, el caballete sobre un arroyo. */
  function debajoDeLaVia(ctx, a, b) {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, n = normalAchatada(a, b);
    const quad = (w, color, bajar = 0) => {
      ctx.fillStyle = color; ctx.beginPath();
      ctx.moveTo(a[0] + n[0] * w, a[1] + n[1] * w + bajar); ctx.lineTo(b[0] + n[0] * w, b[1] + n[1] * w + bajar);
      ctx.lineTo(b[0] - n[0] * w, b[1] - n[1] * w + bajar); ctx.lineTo(a[0] - n[0] * w, a[1] - n[1] * w + bajar);
      ctx.closePath(); ctx.fill();
    };
    if (rios.some((r) => enCaja(r.caja, mx, my) && aLinea(r.pts, mx, my) < r.ancho / 2 + 40)) {
      quad(34, '#2e2a26', 14);   // la sombra del puente en el agua
      quad(34, '#5a4a3c');       // las vigas
    } else if (arroyos.some((c) => enCaja(c.caja, mx, my) && aLinea(c.pts, mx, my) < R.anchoArroyo / 2 + 10)) {
      quad(30, '#6b4a2b');
      ctx.strokeStyle = '#4a3424'; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(mx - n[0] * 26, my - n[1] * 26); ctx.lineTo(mx - n[0] * 26, my - n[1] * 26 + 12);
      ctx.moveTo(mx + n[0] * 26, my + n[1] * 26); ctx.lineTo(mx + n[0] * 26, my + n[1] * 26 + 12);
      ctx.stroke();
    }
  }

  /** Lo alto, entero: la barranca que mira a la cámara, las subidas y la tapa corrida hacia arriba. */
  function dibujarForma(ctx, f, cam = null, ancho = 0, alto = 0) {
    const C = COLOR[f.tipo], H = f.alto;
    // (De la trinchera, sólo el pedazo que se ve: entera son mil puntos y costaba 5 ms por cuadro.)
    const enVista = (lista) => {
      if (!cam) return lista;
      let i0 = -1, i1 = -1;
      lista.forEach(([x], i) => { if (x > cam.x - 300 && x < cam.x + ancho + 300) { if (i0 < 0) i0 = i; i1 = i; } });
      return i0 < 0 ? [] : lista.slice(Math.max(0, i0 - 1), i1 + 2);
    };
    ctx.save();
    if (f.corte) {
      // La trinchera: por donde pasa la vía, el malpaís está cortado.
      ctx.beginPath();
      ctx.rect(f.caja.x0 - 10, f.caja.y0 - H - 10, f.caja.x1 - f.caja.x0 + 20, f.caja.y1 - f.caja.y0 + H + 20);
      for (const { arriba, abajo } of f.corte) {
        const a = enVista(arriba);
        if (!a.length) continue;
        const i0 = arriba.indexOf(a[0]), b = abajo.slice(i0, i0 + a.length).reverse();
        [...a, ...b].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      }
      ctx.clip('evenodd');
    }
    // Las caras: cada borde que mira hacia acá, un cuadrilátero del suelo a la tapa; más claras las que miran al este.
    for (const { a, b, n } of f.bordes) {
      if (n[1] <= 0) continue;
      ctx.fillStyle = n[0] > 0.25 ? C.cara : C.caraSombra;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0], b[1] - H); ctx.lineTo(a[0], a[1] - H);
      ctx.closePath(); ctx.fill();
      // Las vetas de la piedra, a lo largo.
      ctx.strokeStyle = C.veta; ctx.lineWidth = 1.5; ctx.beginPath();
      for (const t of [0.35, 0.7]) { ctx.moveTo(a[0], a[1] - H * t); ctx.lineTo(b[0], b[1] - H * t); }
      ctx.stroke();
    }
    // Las bocas de túnel, en la barranca (van con la forma: así nunca quedan tapadas por ella).
    for (const x of f.bocas) dibujarTunel(ctx, x, bordeSur(f, x));
    // Las subidas: un sendero en diagonal por la barranca.
    for (const [sx, sy] of f.subidas) {
      const w = R.subidaAncho * 0.5;
      ctx.fillStyle = COLOR.subida; ctx.beginPath();
      ctx.moveTo(sx - w, sy + 4); ctx.lineTo(sx + w, sy + 4); ctx.lineTo(sx + w * 0.3, sy - H); ctx.lineTo(sx - w * 0.5, sy - H);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = COLOR.subidaBorde; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(sx - w, sy + 4); ctx.lineTo(sx - w * 0.5, sy - H); ctx.stroke();
    }
    // La tapa.
    ctx.fillStyle = C.tapa; ctx.beginPath();
    f.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - H) : ctx.moveTo(x, y - H)));
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.borde; ctx.lineWidth = 3; ctx.stroke();
    // Arriba, matas y piedras sueltas (siempre las mismas): sin esto la tapa es un plano liso y no se lee como suelo.
    if (cam) {
      const P = 70;
      for (let gx = Math.floor(cam.x / P); gx <= Math.ceil((cam.x + ancho) / P); gx++) {
        for (let gy = Math.floor((cam.y + H) / (P * 0.6)); gy <= Math.ceil((cam.y + alto + H) / (P * 0.6)); gy++) {
          const h1 = hash(gx, gy, 11), h2 = hash(gy, gx, 13);
          if (h1 > 0.45) continue;
          const x = (gx + h2) * P, y = (gy + h1) * P * 0.6;
          if (!dentro(f.pts, x, y)) continue;
          ctx.fillStyle = h2 > 0.5 ? C.veta : C.caraSombra;
          ctx.fillRect(x - 4, y - H - 2, 8 + h1 * 8, 3);
          if (h2 > 0.7) { ctx.fillStyle = '#6a7a3a'; ctx.fillRect(x + 2, y - H - 6, 5, 4); }
        }
      }
    }
    ctx.restore();
    // La pared de la trinchera que mira a la cámara (la del lado de arriba del corte), del suelo a la tapa.
    for (const muro of (f.corte || []).flatMap((c) => c.muros).map(enVista).filter((m) => m.length > 1)) {
      ctx.fillStyle = C.caraSombra; ctx.beginPath();
      muro.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      for (let k = muro.length - 1; k >= 0; k--) ctx.lineTo(muro[k][0], muro[k][1] - H);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = C.veta; ctx.lineWidth = 1.5; ctx.beginPath();
      for (const t of [0.35, 0.7]) muro.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - H * t) : ctx.moveTo(x, y - H * t)));
      ctx.stroke();
      ctx.strokeStyle = C.borde; ctx.lineWidth = 3; ctx.beginPath();
      muro.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - H) : ctx.moveTo(x, y - H)));
      ctx.stroke();
    }
  }

  /** La boca de un túnel: un arco negro con piedras alrededor, donde la vía entra a la sierra. */
  function dibujarTunel(ctx, x, y) {
    ctx.fillStyle = COLOR.tunelPiedra; ctx.beginPath(); ctx.ellipse(x, y, 46, 70, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 46, y - 2, 92, 4);
    ctx.fillStyle = COLOR.tunel; ctx.beginPath(); ctx.ellipse(x, y, 34, 58, 0, Math.PI, Math.PI * 2); ctx.fill();
  }

  /** Una boca de túnel en la barranca de lo alto que hay en (x, y). */
  function agregarBoca(x, y) {
    const f = formas.find((g) => enCaja({ x0: g.caja.x0, y0: g.caja.y0, x1: g.caja.x1, y1: g.caja.y1 + 200 }, x, y));
    if (f) f.bocas.push(x);
  }

  /**
   * Por dónde la vía corta el malpaís: UNA franja a lo largo de cada pedazo de vía que lo cruza, de `ancho` a cada
   * lado, con el lado de arriba subido el alto de la forma (para que también se corte la tapa).
   * 🔁 Eran rectángulos sueltos alrededor de cada punto de la vía; encimados, el recorte "par e impar" los anulaba de a
   * dos y adentro de la trinchera se veían rayas.
   */
  function cortarCon(red, ancho) {
    for (const f of formas) {
      if (f.tipo !== 'malpais') continue;
      const c = { x0: f.caja.x0 - ancho, y0: f.caja.y0 - ancho, x1: f.caja.x1 + ancho, y1: f.caja.y1 + ancho };
      const polis = [];
      red.vias.forEach((v) => {
        let tramo = [];
        const cerrar = () => {
          if (tramo.length >= 2) {
            // La normal de cada punto (de verdad, sin achatar), siempre del lado de arriba.
            const arriba = [], abajo = [], muro = [];
            tramo.forEach((p, k) => {
              const a = tramo[Math.max(0, k - 1)], b = tramo[Math.min(tramo.length - 1, k + 1)];
              let dx = b[0] - a[0], dy = (b[1] - a[1]) / ACHATA;
              const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
              let nx = -dy, ny = dx;
              if (ny > 0) { nx = -nx; ny = -ny; }
              arriba.push([p[0] + nx * ancho, p[1] + ny * ancho * ACHATA - f.alto]);
              // (Sólo adentro del malpaís: afuera, a la entrada de la trinchera, no hay pared.)
              const mx = p[0] + nx * ancho, my = p[1] + ny * ancho * ACHATA;
              muro.push([mx, my, dentro(f.pts, mx, my)]);
              abajo.push([p[0] - nx * ancho, p[1] - ny * ancho * ACHATA]);
            });
            const muros = [];
            let run = [];
            for (const m of muro) { if (m[2]) run.push(m); else { if (run.length > 1) muros.push(run); run = []; } }
            if (run.length > 1) muros.push(run);
            polis.push({ arriba, abajo, muros });
          }
          tramo = [];
        };
        for (const p of v) { if (enCaja(c, p[0], p[1])) tramo.push(p); else cerrar(); }
        cerrar();
      });
      f.corte = polis.length ? polis : null;
    }
  }

  /**
   * 🌵 Cuánto verde hay en (x, y), de 0 (arena lisa) a `S.tupido` (`S` = `CAMPO.suelo`): zonas grandes de un ruido
   * suave, y más cerca del agua. Lo usan el suelo (los manchones de matas) y las piedras del campo.
   */
  function verdor(x, y, S) {
    const yv = y / ACHATA;
    const n = 0.7 * ruido(x / S.escala, yv / S.escala, 1) + 0.3 * ruido(x / (S.escala * 0.35), yv / (S.escala * 0.35), 2);
    const t = Math.max(0, Math.min(1, (n - S.desde) / (S.hasta - S.desde)));
    let v = t * t * (3 - 2 * t) * S.tupido;
    // El agua: la distancia a la orilla del río o del arroyo más cerca.
    const L = S.agua.lejos;
    let d = Infinity;
    for (const r of rios) {
      if (enCaja({ x0: r.caja.x0 - L, y0: r.caja.y0 - L, x1: r.caja.x1 + L, y1: r.caja.y1 + L }, x, y)) d = Math.min(d, aLinea(r.pts, x, y) - r.ancho / 2);
    }
    for (const a of arroyos) {
      if (enCaja({ x0: a.caja.x0 - L, y0: a.caja.y0 - L, x1: a.caja.x1 + L, y1: a.caja.y1 + L }, x, y)) d = Math.min(d, aLinea(a.pts, x, y) - R.anchoArroyo / 2);
    }
    if (d < L) v += S.agua.suma * (1 - Math.max(0, d) / L);
    return Math.min(S.tupido, v);
  }

  return { formas, lomas, rios, arroyos, caminos, formaEn, sueloEn, moverse, bordeSur, cercaDeForma, enAguaOCamino, verdor,
    pintarSuelo, hayAlgo, debajoDeLaVia, dibujarForma, dibujarTunel, cortarCon, agregarBoca };
}

/** Un ruido suave, de 0 a 1: el valor de cada esquina de la grilla, mezclado en curva. */
function ruido(x, y, semilla) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const v = (i, j) => hash(ix + i, iy + j, semilla);
  const a = v(0, 0) + (v(1, 0) - v(0, 0)) * sx, b = v(0, 1) + (v(1, 1) - v(0, 1)) * sx;
  return a + (b - a) * sy;
}

function hash(a, b, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
