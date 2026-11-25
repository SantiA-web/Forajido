/**
 * 📡 LAS SEÑALES DE LEJOS (etapa 2 del campo con vida; los números en CAMPO.senales, data/campo.js)
 * *(Santi aprobó el plan del campo con vida el 2026-11-24: "voy con tus recomendaciones")*.
 *
 * El campo es grande y desolado: casi nunca hay más de una cosa viva en pantalla. Lo que tira al jugador para un lado
 * son las señales que se ven de lejos, y detrás de cada una hay algo:
 *  - **El humo**: las chimeneas de los pueblos, la granja y el puesto; la fogata de tu campamento; el humo negro de la
 *    mina. Los Rennick no humean (están escondidos). De noche no se ve el humo: se ve el brillo del fuego.
 *  - **Los remolinos de polvo**: de día, en la arena lisa. Sólo el viento: no hay nada detrás, pero se parecen al polvo
 *    de los jinetes (etapa 4), y eso es lo que tiene gracia.
 *  - **Los buitres**: dan vueltas sobre lo muerto: los restos (cada uno con su historia) y lo que cazás.
 *
 * Todo sale de la hora (sin azar guardado): el mismo momento en el mismo lugar se ve siempre igual.
 * ⚠️ DIBUJO DE PRUEBA: los huesos son figuras básicas (los animales los dibuja Santi).
 */
import { PALETA } from '../engine/paleta.js';
import { dibujarNubeDeAire } from './estiloNuevo/polvo.js';
import { dibujarUnBuitre } from './estiloNuevo/buitres.js';

const TRAMA = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Los colores del humo (luz, medio, sombra): gris claro el de las casas, casi negro el de la mina. */
const HUMO_CLARO = { L: 25, D: 25, S: 24 };
const HUMO_NEGRO = { L: 24, D: 23, S: 31 };
/** El hueso: claro, su sombra y lo oscuro de abajo (el cuero seco). */
const HUESO = { L: 17, S: 16, O: 14 };

function hash(a, b, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * `LUGARES` (de la escena), `deX`/`deY` (del plano al mundo), `verdor(x, y)`, `animales()` (los de ahora),
 * `PROF` (cuánto se achata lo que va al fondo), `S` (CAMPO.senales).
 */
export function crearSenales({ LUGARES, deX, deY, verdor, animales, PROF, S }) {
  let reloj = 0;

  // ── De dónde sale el humo ──
  // (Las mismas cuentas que las piezas de los lugares en campoScene: `en` separa de a 3, y las casas van ×2,8.)
  const fuentes = [], ventanas = [], fogatas = [];
  LUGARES.forEach((l, n) => {
    const [x, y] = l.dibujo || [l.x, l.y];
    const en = (dx, dy) => [x + dx * 3, y + dy * 3];
    // (El brillo va encima de todo: la ventana de una casa que queda detrás de la estación brillaba a través del techo.)
    const [ex, ey] = l.estacion || [0, -Infinity];
    const tapada = (vx, vy, py) => py < ey && Math.abs(vx - ex) < 28 * 2.8 && vy > ey - 18 * 2.8;
    const casa = ([px, py], w, alto, humea) => {
      const vx = px + (-w / 2 + 4.5) * 2.8, vy = py + (-alto + 5.5) * 2.8;
      if (!tapada(vx, vy, py)) ventanas.push([vx, vy]);
      if (humea) fuentes.push({ id: n * 10 + fuentes.length, x: px + (w / 2 - 6.5) * 2.8, y: py - (alto + 11) * 2.8, pie: py, chimenea: true });
    };
    if (l.id === 'pueblo') {
      for (let k = 0; k < 6; k++) casa(en((k % 3 - 1) * 42 + (k > 2 ? 18 : 0), k > 2 ? 34 : 0), 30, 16 + (k % 2) * 6, k % 2 === 0);
    } else if (l.id === 'granja') casa(en(0, 0), 36, 18, true);
    else if (l.id === 'puesto') casa(en(30, -10), 22, 12, true);
    else if (l.id === 'mina') {
      const [px, py] = en(0, -10);
      fuentes.push({ id: n * 10, x: px + 22.5 * 2.8, y: py - 46 * 2.8, pie: py, negro: true });
    } else if (l.id === 'campamento') {
      const [px, py] = en(26, 8);
      fuentes.push({ id: n * 10, x: px, y: py - 10, pie: py, fogata: true });
      fogatas.push([px, py - 4]);
    }
  });

  // ── Lo muerto: los restos puestos a mano y lo que cazás ──
  const restos = S.restos.map((r, i) => ({ ...r, i, x: deX(r.x), y: deY(r.y) }));
  /** Cuándo cayó cada animal (por el reloj de acá). */
  const muertos = new Map();

  function actualizar(dt) {
    reloj += dt;
    const lista = animales();
    for (const a of lista) if (!a.vivo && !muertos.has(a)) muertos.set(a, reloj);
    // (Al volver a entrar el rebaño es otro: los muertos de antes ya no están.)
    for (const a of muertos.keys()) if (!lista.includes(a)) muertos.delete(a);
  }

  const enVista = (cam, vista, x0, y0, x1, y1) => x1 > cam.x && x0 < cam.x + vista.w && y1 > cam.y && y0 < cam.y + vista.h;

  // ── El humo ──
  /** Las bocanadas de una fuente ahora: nacen cada `cada` segundos, suben, crecen y se van con el viento. */
  function bocanadas(f, fuerza, copos) {
    const H = S.humo, cada = H.cada * (f.fogata ? 1.6 : 1), vida = H.vida * (f.fogata ? 0.6 : f.negro ? 1.2 : 1);
    const grande = f.negro ? 1.4 : f.fogata ? 0.6 : 1;
    for (let n = Math.floor((reloj - vida) / cada); n <= Math.floor(reloj / cada); n++) {
      const a = reloj - (n * cada + hash(n, f.id, 3) * cada * 0.4);
      if (a < 0 || a > vida) continue;
      const u = a / vida;
      copos.push({
        x: f.x + H.viento * a + Math.sin(n * 1.7 + a * 0.5) * (1 + 3 * u),
        y: f.y - H.sube * a * (1 - 0.35 * u),
        r: (H.radio[0] + (H.radio[1] - H.radio[0]) * Math.pow(u, 0.7)) * grande,
        s: H.espeso * fuerza * Math.pow(1 - u, 0.8) * Math.min(1, a / 0.5),
        chato: 0.9,
      });
    }
  }

  /** El humo de lo que se ve (de día). `parte`: la del día; `celda`: el punto de la grilla (el doble, de lejos). */
  function dibujarHumo(ctx, cam, vista, parte, celda) {
    const H = S.humo, alto = H.sube * H.vida + 20, lado = H.viento * H.vida + H.radio[1] * 2;
    const claros = [], negros = [];
    for (const f of fuentes) {
      if (!enVista(cam, vista, f.x - 30, f.y - alto * 1.3, f.x + lado * 1.5, f.pie + 10)) continue;
      const fuerza = f.chimenea ? H.chimeneas[parte] ?? 0 : 1;
      if (fuerza > 0) bocanadas(f, fuerza, f.negro ? negros : claros);
    }
    // (Una nube por color: las chimeneas de un pueblo se juntan arriba, como el humo de verdad.)
    if (claros.length) dibujarNubeDeAire(ctx, claros, false, celda, HUMO_CLARO);
    if (negros.length) dibujarNubeDeAire(ctx, negros, false, celda, HUMO_NEGRO);
  }

  /** 🌙 El brillo del fuego, de noche: la fogata y las ventanas alumbran un poco alrededor (después del velo). */
  function dibujarBrillos(ctx, cam, vista, celda) {
    const B = S.brillo, temblor = 1 + 0.08 * Math.sin(reloj * 7) + 0.05 * Math.sin(reloj * 13);
    for (const [x, y] of fogatas) if (enVista(cam, vista, x - B.fogata, y - B.fogata, x + B.fogata, y + B.fogata)) brillo(ctx, x, y, B.fogata * temblor, celda, 0.9);
    for (const [x, y] of ventanas) if (enVista(cam, vista, x - B.ventana, y - B.ventana, x + B.ventana, y + B.ventana)) brillo(ctx, x, y, B.ventana, celda, 0.6);
  }

  /** Una luz tramada: más tupida en el medio, que se deshace hacia afuera; amarilla adentro, naranja afuera. */
  function brillo(ctx, x, y, radio, celda, fuerza) {
    const ry = radio * PROF;
    const i0 = Math.floor((x - radio) / celda), i1 = Math.ceil((x + radio) / celda);
    const j0 = Math.floor((y - ry) / celda), j1 = Math.ceil((y + ry) / celda);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const dx = ((i + 0.5) * celda - x) / radio, dy = ((j + 0.5) * celda - y) / ry, d = Math.hypot(dx, dy);
      if (d >= 1) continue;
      // (🔁 Era un sol amarillo que tapaba el fuego: ahora el medio queda libre —ahí está el fuego— y alrededor, la
      // tierra alumbrada, naranja y rala.)
      if (d < 0.18) continue;
      const v = Math.pow(1 - d, 2) * fuerza * 16;
      if (TRAMA[(j & 3) * 4 + (i & 3)] >= v) continue;
      ctx.fillStyle = PALETA[d < 0.45 ? 7 : 6];
      ctx.fillRect(i * celda, j * celda, celda, celda);
    }
  }

  // ── Los remolinos ──
  /** Los remolinos de ahora cerca de lo que se ve: { x, y, edad (0 a 1), semilla }. */
  function remolinosAhora(cam, vista) {
    const R = S.remolinos, k = Math.floor(reloj / R.tramo), lista = [];
    const c0 = Math.floor((cam.x - 200) / R.celda), c1 = Math.floor((cam.x + vista.w + 200) / R.celda);
    const f0 = Math.floor((cam.y - 200) / R.celda), f1 = Math.floor((cam.y + vista.h + 200) / R.celda);
    for (let cj = f0; cj <= f1; cj++) for (let ci = c0; ci <= c1; ci++) {
      if (hash(ci, cj, k) > R.chance) continue;
      const t0 = k * R.tramo + hash(ci, cj, k + 7) * (R.tramo - R.dura), tt = reloj - t0;
      if (tt < 0 || tt > R.dura) continue;
      const x0 = (ci + hash(ci, cj, k + 11)) * R.celda, y0 = (cj + hash(ci, cj, k + 13)) * R.celda;
      if (verdor(x0, y0) > R.verdorMax) continue;
      const rumbo = hash(ci, cj, k + 17) * Math.PI * 2;
      lista.push({ x: x0 + Math.cos(rumbo) * R.anda * tt, y: y0 + Math.sin(rumbo) * R.anda * tt * PROF, edad: tt / R.dura, semilla: ci * 31 + cj });
    }
    return lista;
  }

  /** Un remolino: una columna de polvo que se ensancha arriba y se tuerce; al nacer y al morir, más flaco. */
  function dibujarRemolino(ctx, w, celda) {
    const R = S.remolinos, fuerza = Math.min(1, w.edad / 0.15, (1 - w.edad) / 0.2);
    const alto = R.alto * (0.6 + 0.4 * fuerza), copos = [];
    // El polvo que levanta abajo, ancho y chato.
    // (🔁 Con copos chicos y finitos, de lejos era una línea de puntos que no se veía.)
    copos.push({ x: w.x, y: w.y - 2, r: 14 + 6 * fuerza, s: 1.3 * fuerza, chato: 0.4 });
    for (let h = 0; h <= alto; h += 3) {
      const u = h / alto, giro = reloj * 3 + h * 0.12 + w.semilla;
      copos.push({ x: w.x + Math.sin(giro) * (1 + 6 * u), y: w.y - h, r: 5 + 13 * u, s: (1.5 - 0.8 * u) * fuerza, chato: 0.6 });
    }
    dibujarNubeDeAire(ctx, copos, false, celda);
  }

  // ── Los buitres ──
  /** Sobre qué dan vueltas ahora: los restos y lo cazado (después de `llegan` segundos), con qué tan visibles. */
  function carrona() {
    const lista = restos.map((r) => ({ x: r.x, y: r.y, alfa: 1, semilla: r.i + 1 }));
    for (const [a, t] of muertos) {
      const alfa = Math.min(1, (reloj - t - S.buitres.llegan) / 3);
      if (alfa > 0) lista.push({ x: a.x, y: a.y, alfa, semilla: 50 + Math.round(t * 10) });
    }
    return lista;
  }

  /** Cada buitre de cada carroña: dónde está su sombra (en la tierra) y para dónde vuela. */
  function buitresAhora(cam, vista) {
    const B = S.buitres, lista = [];
    for (const c of carrona()) {
      if (!enVista(cam, vista, c.x - 120, c.y - B.alto - 80, c.x + 120, c.y + 60)) continue;
      const cuantos = hash(c.semilla, 1) < 0.5 ? 2 : 3, radio = B.radio[0] + (B.radio[1] - B.radio[0]) * hash(c.semilla, 2);
      for (let b = 0; b < cuantos; b++) {
        const r = radio * (0.8 + 0.4 * hash(c.semilla, b + 3)), a = B.vuelta * reloj + (b * 2 * Math.PI) / cuantos + c.semilla;
        lista.push({ x: c.x + r * Math.cos(a), y: c.y + r * PROF * Math.sin(a), dx: -Math.sin(a), dy: PROF * Math.cos(a), alfa: c.alfa });
      }
    }
    return lista;
  }

  // ── Los huesos (figuras básicas) ──
  /**
   * Un costillar tirado: el espinazo, las costillas paradas, el cráneo y la mancha oscura del cuero. En unidades del
   * mundo (una res mide unos 2 m: 26 unidades), con el punto `g` que se ve (de lejos, el doble: si no, se borraba).
   */
  function dibujarResto(ctx, r, g) {
    const L = { res: 26, buey: 28, caballo: 30, berrendo: 15 }[r.que] || 22, m = L / 2;
    const a = (v) => Math.round(v / g) * g;
    const p = (dx, dy, w, h, c) => {
      ctx.fillStyle = PALETA[c];
      ctx.fillRect(a(r.x + dx), a(r.y + dy), Math.max(g, a(w)), Math.max(g, a(h)));
    };
    p(-m - 2, -0.5, L + 4, 2, HUESO.O);                            // el cuero seco, debajo
    p(-m, -1.5, L - 2, g, HUESO.S);                                // el espinazo
    for (let k = -m + 3; k < m - 5; k += Math.max(2.25, 2 * g)) { p(k, -5, g, 3.5, HUESO.L); p(k + g, -4, g, 2.5, HUESO.S); }  // las costillas
    p(m - 2, -3, 4.5, 2.25, HUESO.L); p(m + 2.5, -1.5, 2.5, g, HUESO.S);  // el cráneo
    p(-m - 4, 0.75, 4, g, HUESO.L); p(-m + 3, 2.25, 5, g, HUESO.L);       // una pata, un hueso suelto
  }

  return {
    actualizar,
    /** En la tierra, antes de lo parado: los huesos y, de día, las sombras de los buitres. */
    dibujarSuelo(ctx, cam, vista, dia, celda) {
      for (const r of restos) if (enVista(cam, vista, r.x - 30, r.y - 20, r.x + 30, r.y + 10)) dibujarResto(ctx, r, celda);
      if (dia) for (const b of buitresAhora(cam, vista)) dibujarUnBuitre(ctx, b.x - S.buitres.alto * 0.3, b.y, b.dx, b.dy, b.alfa, true);
    },
    /** Lo que se para en la tierra y se ordena con lo demás (los remolinos): [{ y, draw }]. */
    cosas(ctx, cam, vista, dia, celda) {
      if (!dia) return [];
      return remolinosAhora(cam, vista).map((w) => ({ y: w.y, draw: () => dibujarRemolino(ctx, w, celda) }));
    },
    /** En el aire, arriba de todo: el humo y los buitres (de día). */
    dibujarAire(ctx, cam, vista, dia, parte, celda) {
      if (!dia) return;
      dibujarHumo(ctx, cam, vista, parte, celda);
      for (const b of buitresAhora(cam, vista)) dibujarUnBuitre(ctx, b.x, b.y - S.buitres.alto, b.dx, b.dy, b.alfa);
    },
    /** 🌙 Después del velo de la noche: el brillo del fuego. */
    dibujarNoche(ctx, cam, vista, celda) { dibujarBrillos(ctx, cam, vista, celda); },
    /** Para el banco de pruebas. */
    get reloj() { return reloj; }, set reloj(v) { reloj = v; }, fuentes, restos, muertos, remolinosAhora,
  };
}
