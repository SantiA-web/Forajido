/**
 * ⛈️ LA TORMENTA QUE SE VE, EN EL ESTILO NUEVO *(Santi: "hacemos la tormenta y las partículas de la lluvia"; eligió las
 * gotas en diagonal, las salpicaduras, la arena mojada con charcos y los relámpagos)*.
 *
 * Hasta acá la tormenta del galope era el cielo gris y el sonido: no caía una gota. Ahora:
 *
 *  - LAS GOTAS, en diagonal: rayitas en la grilla, inclinadas por el viento. 🔁 EN EL MUNDO, NO EN LA PANTALLA
 *    *(Santi: "la lluvia tapa la pantalla cuando debería verse como parte del escenario"; eligió "gotas que caen al
 *    piso")*: antes iban pintadas encima de todo, como un vidrio mojado. Ahora cada gota cae sobre un lugar del suelo
 *    y salpica justo ahí; se queda con el suelo cuando galopás, se ordena con lo demás (el tren y los caballos tapan
 *    a las que caen detrás) y las del otro lado de la vía son cortas y apagadas. El panel queda limpio.
 *  - LAS SALPICADURAS, en el suelo: una coronita que salta y un anillo que se abre, en 8 cuadros dibujados a mano.
 *    🔁 Sólo donde pega una gota, y sólo en la tierra *(Santi: "impacta y hace partículas en el cielo, cuando eso no
 *    tiene ningún sentido")*: antes se sorteaban por toda la vista, cielo incluido.
 *  - LOS CHARCOS: tres dibujados a mano, sembrados por la arena (los pinta world/estiloNuevo/suelo.js, con la arena
 *    mojada un escalón más oscura). Reflejan el gris del cielo.
 *  - LOS RELÁMPAGOS: con el trueno cercano, el rayo dibujado a lo lejos (dos, a mano) y un fogonazo blanco de toda la
 *    pantalla que se apaga en un momento; con el lejano, apenas un parpadeo.
 *
 * Es sólo dibujo y usa `Math.random`, no el `rng` del juego (como el polvo de los cascos).
 */
import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { PALETA } from '../../engine/paleta.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;

/** Los números de la lluvia. */
export const LLUVIA = {
  /** Cuántas gotas a la vez en la vista. */
  gotas: 750,
  /** Cuánto caen (unidades del mundo por segundo), las de cerca y las del otro lado de la vía. */
  caeCerca: 230, caeLejos: 150,
  /** Cuánto se corre cada gota mientras cae (por unidad de altura): la inclinación del viento, la misma del dibujo. */
  sesgo: 0.5,
  /** Cuánto se ven las gotas (1, enteras). */
  transparencia: 0.55,
  /** Cuánto dura cada salpicadura. */
  dura: 0.32,
  /** El fogonazo del relámpago: cuánto blanquea y cuánto dura; el rayo, cuánto se ve. */
  fogonazo: 0.45, fogonazoDura: 0.35, parpadeo: 0.12, rayoDura: 0.22,
};

/** Los colores de las gotas: [cerca, lejos], de día (con tormenta) y de noche. */
const GOTA = { dia: [25, 24], noche: [20, 19] };

/**
 * LA FORMA DE CADA GOTA, punto por punto desde la cabeza (abajo) hacia la cola (arriba): baja de a dos filas por cada
 * columna que se corre, que es la inclinación que da el viento de frente.
 */
const FORMA_CERCA = [[0, 0], [0, -1], [1, -2], [1, -3], [2, -4], [2, -5]];
const FORMA_LEJOS = [[0, 0], [0, -1], [1, -2]];

/**
 * LA SALPICADURA, 8 cuadros de 7×3 a mano: la gota pega (x, clara), salta en dos gotitas que se abren y caen, y queda
 * un anillo (r, oscuro) que se abre y se borra.
 */
export const SALPICADURA = [
  ['.......', '.......', '...x...'],
  ['.......', '..x.x..', '...r...'],
  ['.x...x.', '.......', '..rrr..'],
  ['x.....x', '.......', '.r...r.'],
  ['.......', 'x.....x', '.r...r.'],
  ['.......', '.......', 'r.....r'],
  ['.......', '.......', 'r....r.'],
  ['.......', '.......', '.r.....'],
];
const COLOR_SALPICADURA = { dia: { x: 22, r: 25 }, noche: { x: 21, r: 20 } };

/** EL RAYO, dos dibujados a mano (W el centro, blanco, de dos puntos; g el resplandor). 🔁 De un punto de ancho no se veía. */
export const RAYOS = [
  [
    '.....gWWg.....',
    '.....gWWg.....',
    '....gWWg......',
    '....gWWg......',
    '...gWWg.......',
    '...gWWWg......',
    '....gWWWg.....',
    '.....gWWg.....',
    '.....gWWg.....',
    '....gWWg......',
    '...gWWg.......',
    '...gWWg.ggg...',
    '..gWWgggWWWg..',
    '..gWWWWWgggg..',
    '...gWWg..gWWg.',
    '...gWWg...gWg.',
    '....gWWg...g..',
    '....gWWg......',
    '.....gWWg.....',
    '.....gWWg.....',
    '....gWWg......',
    '....gWWg......',
    '...gWWg.......',
    '...gWWg.......',
    '..gWWg........',
    '..gWWWg.......',
    '...gWWWg......',
    '....gWWg......',
    '....gWWg......',
    '...gWWg.......',
    '...gWg........',
    '..gWg.........',
    '..gWg.........',
    '...g..........',
  ],
  [
    '......gWWg....',
    '......gWWg....',
    '.......gWWg...',
    '.......gWWg...',
    '......gWWWg...',
    '.....gWWWg....',
    '....gWWWg.....',
    '....gWWg......',
    '....gWWWg.....',
    '.....gWWWg....',
    '......gWWg....',
    '......gWWg....',
    '.....gWWg.....',
    '....gWWWgg....',
    '...gWWgWWWg...',
    '..gWWg.gggWg..',
    '..gWWg....gWg.',
    '...gWWg....g..',
    '...gWWg.......',
    '....gWWg......',
    '....gWWg......',
    '...gWWg.......',
    '...gWWg.......',
    '..gWWg........',
    '..gWWg........',
    '...gWWg.......',
    '...gWWg.......',
    '....gWg.......',
    '....gWg.......',
    '.....g........',
  ],
];
// (El resplandor en celeste medio: sobre el gris claro del horizonte, un borde más claro no se veía.)
const COLOR_RAYO = { W: 30, g: 21 };

export function crearLluvia() {
  // Cada gota: dónde pega (`x` en coordenadas del suelo, `y` en el mundo) y a qué altura va (`h`).
  let gotas = [];
  let salpicaduras = [];
  let fogonazo = 0, fuerza = 0, rayo = null;

  /** Una gota nueva, sobre un lugar de suelo de la vista. `entera`: la primera vez, a cualquier altura de su caída. */
  function nueva(g, vista, suelo, puede, lejos, entera) {
    const [cx, cy, w, h] = vista;
    for (let intento = 0; intento < 8; intento++) {
      const y = cy + Math.random() * (h + 12);
      // Arranca un poco arriba del borde de la vista: cae desde afuera.
      const alto = y - cy + 4 + Math.random() * 16;
      const x = cx - alto * LLUVIA.sesgo - 10 + Math.random() * (w + alto * LLUVIA.sesgo + 20);
      if (puede && !puede(x, y)) continue;
      g.x = x + suelo; g.y = y; g.h = entera ? Math.random() * alto : alto;
      g.lejos = !!(lejos && lejos(y)); g.v = 0.85 + Math.random() * 0.3; g.viva = true;
      return;
    }
    g.viva = false;
  }

  return {
    limpiar() { gotas = []; salpicaduras = []; fogonazo = 0; rayo = null; },

    /** El relámpago: `cerca` con el trueno cercano (rayo y fogonazo), si no un parpadeo. */
    relampago(cerca) {
      fogonazo = cerca ? LLUVIA.fogonazoDura : LLUVIA.fogonazoDura * 0.6;
      fuerza = cerca ? LLUVIA.fogonazo : LLUVIA.parpadeo;
      if (cerca) rayo = { t: LLUVIA.rayoDura, k: Math.floor(Math.random() * RAYOS.length), x: 0.15 + Math.random() * 0.7 };
    },

    /**
     * @param vista  [camX, camY, vistaW, vistaH] del mundo
     * @param suelo  cuánto terreno lleva corrido la escena (el galope; en la huida, 0): las gotas pegan en el suelo
     * @param puede  (x, y) => ¿hay tierra ahí donde caería? (no el cielo ni el tren); sin esto, toda la vista
     * @param lejos  (y) => ¿cae del otro lado de la vía? (la gota corta y apagada)
     * @param arrastre  (y) => a cuánto se va la salpicadura con el suelo. Para el techo, donde las gotas van con el tren y la tierra pasa volando.
     */
    actualizar(dt, vista, { suelo = 0, puede = null, lejos = null, arrastre = null } = {}) {
      for (const s of salpicaduras) { s.t += dt; if (arrastre) s.x -= arrastre(s.y) * dt; }
      salpicaduras = salpicaduras.filter((s) => s.t < LLUVIA.dura);
      if (vista) {
        const [cx, cy, w, h] = vista;
        while (gotas.length < LLUVIA.gotas) { const g = {}; nueva(g, vista, suelo, puede, lejos, true); gotas.push(g); }
        for (const g of gotas) {
          if (!g.viva) { nueva(g, vista, suelo, puede, lejos, false); continue; }
          g.h -= (g.lejos ? LLUVIA.caeLejos : LLUVIA.caeCerca) * g.v * dt;
          const sx = g.x - suelo;
          if (g.h <= 0) {
            // Pegó: salpica ahí mismo, y vuelve a caer desde arriba en otro lado.
            salpicaduras.push({ x: g.x, y: g.y, t: 0, lejos: g.lejos });
            nueva(g, vista, suelo, puede, lejos, false);
          } else if (sx < cx - 80 || sx > cx + w + 40 || g.y < cy - 10 || g.y - g.h > cy + h + 10) {
            // (Se fue de la vista porque te moviste: otra, en lo que se ve.)
            nueva(g, vista, suelo, puede, lejos, true);
          }
        }
      }
      if (fogonazo > 0) fogonazo -= dt;
      if (rayo) { rayo.t -= dt; if (rayo.t <= 0) rayo = null; }
    },

    /**
     * Las salpicaduras, en el mundo (el `ctx` con la cámara puesta). `celda`: el punto de la grilla con que se ve la
     * escena (el cercano, o el doble cuando todo va chico).
     */
    dibujarSalpicaduras(ctx, noche, suelo = 0, celda = PASO, desde = -Infinity, hasta = Infinity) {
      const col = COLOR_SALPICADURA[noche ? 'noche' : 'dia'];
      for (const s of salpicaduras) {
        if (s.y < desde || s.y >= hasta) continue;
        const m = SALPICADURA[Math.min(7, Math.floor((s.t / LLUVIA.dura) * 8))];
        const x0 = Math.round((s.x - suelo) / celda) - 3, y0 = Math.round(s.y / celda) - 2;
        for (let j = 0; j < 3; j++) for (let i = 0; i < 7; i++) {
          const l = m[j][i];
          if (l === '.') continue;
          ctx.fillStyle = PALETA[col[l]];
          ctx.fillRect((x0 + i) * celda, (y0 + j) * celda, celda, celda);
        }
      }
    },

    /**
     * Las gotas que pegan entre `desde` y `hasta` (la y del suelo donde caen), en el mundo: así cada escena las
     * ordena con lo suyo (las que caen detrás del tren, antes del tren; las de delante del caballo, después de él).
     */
    dibujarGotas(ctx, noche, suelo, celda, desde = -Infinity, hasta = Infinity) {
      const [cCerca, cLejos] = GOTA[noche ? 'noche' : 'dia'];
      // (🔁 Un poco transparentes *(Santi: "hacé las gotitas un poco más transparentes")*.)
      const antes = ctx.globalAlpha;
      ctx.globalAlpha = antes * LLUVIA.transparencia;
      for (const g of gotas) {
        if (!g.viva || g.y < desde || g.y >= hasta) continue;
        ctx.fillStyle = PALETA[g.lejos ? cLejos : cCerca];
        const gx = Math.round((g.x - suelo + g.h * LLUVIA.sesgo) / celda), gy = Math.round((g.y - g.h) / celda);
        for (const [dx, dy] of g.lejos ? FORMA_LEJOS : FORMA_CERCA) ctx.fillRect((gx + dx) * celda, (gy + dy) * celda, celda, celda);
      }
      ctx.globalAlpha = antes;
    },

    /**
     * El rayo y el fogonazo, en la pantalla (sin cámara): el fogonazo es la luz de toda la escena. `cielo`: hasta
     * dónde llega el cielo en la pantalla (el rayo cae ahí).
     */
    dibujarEnPantalla(ctx, w, h, noche, cielo) {
      const punto = w / 640, W = Math.ceil(w / punto);
      if (fogonazo > 0) {
        ctx.save();
        ctx.globalAlpha = fuerza * Math.min(1, fogonazo / (LLUVIA.fogonazoDura * 0.6));
        ctx.fillStyle = PALETA[noche ? 22 : 30];
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
      // (El rayo, encima del fogonazo: con el blanco por debajo se perdía.)
      if (rayo && cielo > 24) {
        // (A su tamaño, punto por punto: estirarlo deformaba el dibujo. Si el cielo es más bajo que el rayo, asoma la punta.)
        const m = RAYOS[rayo.k], al = m.length, esc = 1;
        const x0 = Math.round((rayo.x * W) - m[0].length / 2), y0 = Math.round(cielo / punto) - al * esc;
        for (let j = 0; j < al; j++) for (let i = 0; i < m[j].length; i++) {
          const l = m[j][i];
          if (l === '.') continue;
          ctx.fillStyle = PALETA[COLOR_RAYO[l]];
          ctx.fillRect((x0 + i) * punto, (y0 + j * esc) * punto, punto, punto * esc);
        }
      }
    },
  };
}

/** LOS CHARCOS, a mano (o el borde de arena mojada, a el agua, b el cielo que refleja). Los pinta el suelo. */
export const CHARCOS = [
  [
    '...oooooooo...',
    '.ooaaabbaaaoo.',
    'oaaaaaaaabbaao',
    '.ooooaaaaoooo.',
  ],
  [
    '..ooooo..',
    'oaabbaaao',
    '.ooaaaoo.',
  ],
  [
    '.....oooooo.........',
    '..oooaaabbaaoooooo..',
    '.oaaaaaaaaabbaaaaaoo',
    'oaaabbaaaaaaaaaaaoo.',
    '.oooooaaaaaoooooo...',
  ],
  [
    '..........oooooooooooo............',
    '....ooooooaaaaaabbbaaaoooooo......',
    '..ooaaaaaaaaaaaaaaabbbaaaaaaoooo..',
    '.oaaabbbaaaaaaaaaaaaaaaaaaaaaaaoo.',
    'oaaaaaaabbaaaaaaaaaaaaaaaaaaaaoo..',
    '.ooooooaaaaaaaaaaoooooooooooooo...',
  ],
  [
    '......oooooooooo..........',
    '..ooooaaaaabbaaaoooooooo..',
    '.oaaaaaaaaaabbbaaaaaaaaaoo',
    'oaaabbaaaaaaaaaaaaaaaaaoo.',
    '.ooooaaaaaaaaoooooooooo...',
  ],
];
// (El borde, arena empapada más oscura; el agua, el gris claro del cielo; el brillo, casi blanco azulado.)
export const COLOR_CHARCO = { o: 34, a: 25, b: 22 };
