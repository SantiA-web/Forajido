/**
 * 🏜️ EL SUELO DE AFUERA, EN EL ESTILO NUEVO: el mismo que se ve por el portón abierto del cerrado.
 *
 * *(Santi: "al estar dentro del tren se sigue viendo un plano marrón aburrido con líneas negras muy gruesas. Quiero
 * que iguales el dibujo del fondo a cómo se ve dentro del portón abierto de la pared lejana")*. Afuera quedaban las
 * capas del dibujo viejo (las franjas del parallax y las rayas de velocidad), de la resolución vieja. Ahora es tierra
 * vista desde arriba, en la grilla de puntos y con la paleta. Todo pasa a la misma velocidad, la del suelo
 * (`estiloNuevo.desfile`).
 *
 * 🔁 DOS VUELTAS ANTES DE ESTA: primero, granitos de un punto y manchitas de borde comido *(Santi: "al ser tan pequeños
 * los detalles se ve como sucio y hace mucho ruido")*; después, manchas grandes de ruido *(Santi: "está todo como
 * camuflado. Parece que el tren está andando sobre un pantalón militar")*. Entre cuatro opciones *(Santi: "quiero la
 * opción B pero ponele los arbustitos y piedras de la opción C")*: tierra de un solo tono con LAS VETAS DEL VIENTO,
 * largas y finitas a lo largo de la vía (la arena que peina el viento), y encima LAS JARILLAS y LOS GRUPOS DE PIEDRAS,
 * grandes y espaciados. De noche, un escalón entero menos, sin tramado.
 *
 * El dibujo sale de los puntos del MUNDO (columna y fila), así el portón y el afuera son la misma tierra: cada uno
 * pide su pedazo a `pintarSuelo`.
 */
import { CONFIG } from '../../data/config.js';
import { DENSIDAD } from '../../engine/renderer.js';
import { iluminar } from '../../engine/luz.js';

const PASO = CONFIG.estilo.punto / DENSIDAD;
const hash = (x, y) => ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000) / 1000;
const md = (a, n) => ((a % n) + n) % n;

/** La vuelta del dibujo, en puntos: después se repite (múltiplo de 4 y de 44, para que no se note la costura). */
const VUELTA = 1540;

/** El tramo donde se sortea cada veta (una o ninguna por tramo y por fila) y el cuadro de cada cosa suelta, en puntos. */
const TRAMO = 44, CUADRO = 44, FILAS = 22;

/**
 * Las cosas sueltas, en mapas de letras (`.` es tierra): LA JARILLA (9×6: las hojas claras arriba, el pie oscuro y
 * su sombra en la tierra), LA PIEDRA GRANDE (5×4) con una chica al lado (4×3) —la cara de arriba agarra el sol, el
 * costado gris, la sombra abajo— y LA MATA de pasto seco (5×3).
 */
const JARILLA = ['...h.h...', '.hgghggh.', 'hggdggdgh', '.gdgggdg.', '..ddgdd..', '...sss...'];
const PIEDRA_G = ['.aaa.', 'aabbc', 'abbbc', '.sss.'];
const PIEDRA = ['.aa.', 'abbc', '.ss.'];
const MATA = ['h.g.h', '.ggg.', '.ddd.'];
const COLOR = { a: 25, b: 24, c: 23, s: 34, h: 43, g: 27, d: 26 };

/**
 * Pinta en `ind` (Int16Array de `w`×`h`, índices de la paleta) el suelo de los puntos del mundo desde (`p0`, `q0`),
 * corrido `k` puntos (lo que pasó el tren).
 */
export function pintarSuelo(ind, w, h, p0, q0, k) {
  const U0 = p0 + k;
  const pv = (x, y, i) => { if (x >= 0 && y >= 0 && x < w && y < h) ind[y * w + x] = i; };
  const estampar = (mapa, sx, sy) => {
    for (let j = 0; j < mapa.length; j++) for (let i = 0; i < mapa[j].length; i++) {
      const l = mapa[j][i];
      if (l !== '.') pv(sx + i, sy + j, COLOR[l]);
    }
  };
  // La tierra, de un tono (35).
  ind.fill(35, 0, w * h);
  // Las vetas del viento, cada tres filas: de 10 a 34 puntos de largo y uno de alto, más oscuras o más claras.
  for (let y = 0; y < h; y++) {
    const q = q0 + y;
    if (md(q, 3) !== 0 || enLaVia(q * PASO)) continue;
    for (let n = Math.floor(U0 / TRAMO) - 1; n <= Math.floor((U0 + w) / TRAMO) + 1; n++) {
      const nn = md(n, VUELTA / TRAMO), hz = hash(nn * 7 + 3, q * 13 + 1);
      if (hz > 0.45) continue;
      const largo = 10 + Math.floor(hash(nn, q * 5) * 24), x0 = n * TRAMO + Math.floor(hash(q, nn) * (TRAMO - 8)) - U0;
      const col = hz < 0.3 ? 34 : 36;
      for (let i = 0; i < largo; i++) pv(x0 + i, y, col);
    }
  }
  // Las cosas sueltas, una o ninguna por cuadro.
  for (let n = Math.floor(U0 / CUADRO) - 1; n <= Math.floor((U0 + w) / CUADRO) + 1; n++) {
    const nn = md(n, VUELTA / CUADRO);
    for (let m = Math.floor((q0 - FILAS) / FILAS) * FILAS; m <= q0 + h; m += FILAS) {
      const hz = hash(nn * 13 + m, 41);
      const sx = n * CUADRO + Math.round(hash(nn, m) * (CUADRO - 10)) - U0, sy = m + Math.floor(hash(m, nn) * (FILAS - 7)) - q0;
      if (enLaVia((sy + q0) * PASO - 2) || enLaVia((sy + q0 + 6) * PASO)) continue;
      if (hz < 0.34) estampar(JARILLA, sx, sy);
      else if (hz < 0.5) { estampar(PIEDRA_G, sx, sy); estampar(PIEDRA, sx + 6, sy + 2); }
      else if (hz < 0.62) estampar(MATA, sx, sy);
    }
  }
  pintarVia(ind, w, h, U0, q0, pv);
}

/**
 * 🛤️ LA VÍA, EN EL ESTILO NUEVO *(Santi: "revisá todo lo de las vías: texturas, colores, formas… teniendo en cuenta la
 * perspectiva de la cámara"; eligió las recomendaciones)*. Se ve sólo por los huecos (los enganches), pero va pintada
 * en el mismo suelo, así pasa con él. Antes era el dibujo viejo: puntos tres veces más chicos que los del resto (la
 * grava se leía como polvo), colores fuera de la paleta, los durmientes borroneados en una franja y los rieles dos rayas
 * centradas con el piso del vagón. Ahora, de arriba para abajo (en el mundo, `VIA`):
 *
 *  - TODO CORRIDO PARA ABAJO, unos 9: el piso del vagón va levantado sobre las ruedas, como un metro, y con esta
 *    cámara lo alto se dibuja más arriba y lo bajo más abajo. La vía está en el suelo, debajo del vagón.
 *  - EL TERRAPLÉN es un lomo de piedra: arriba plano, con los durmientes, y una ladera a cada lado. La de allá le da la
 *    espalda a la cámara y casi no se ve (una tirita); la de acá le da la cara y se ve entera *(Santi: "debería haber
 *    más debajo por una cuestión de perspectiva")*. Las dos de la misma piedra gris, con piedras que se distinguen
 *    (la cara de arriba clara, la de abajo en sombra) y el borde mordido contra la tierra.
 *  - LOS DURMIENTES, de madera, cruzados, uno cada 44 puntos: pasan con el suelo (a 5 unidades por cuadro se siguen
 *    con la vista; el borroneado era de cuando el suelo saltaba 15). El sol viene de allá y un poco de la derecha (la
 *    luz de los ventanales cae corriéndose a la izquierda): el canto derecho agarra luz, la sombra cae a la izquierda,
 *    y el canto de acá, el que da a la cámara, más oscuro. Con su veta.
 *  - LOS RIELES, encima, cada uno sobre su placa de asiento en cada durmiente: la cara de arriba que brilla, el costado
 *    que da a la cámara, más oscuro, y la sombra que tiran hacia acá.
 */
const VIA = { piedra: [28, 158], durmiente: [38, 140], rieles: [53, 125] };
const enLaVia = (y) => y >= VIA.piedra[0] - 2 && y < VIA.piedra[1] + 2;
const DURMIENTE = 44, ANCHO_DURMIENTE = 12;
const PIEDRAS_VIA = [['.l', 'dl'], ['.ll', 'dl.', 'd..'], ['ll', 'dd'], ['.l.', 'dll', '.d.']];
function pintarVia(ind, w, h, U0, q0, pv) {
  const Y = (u) => Math.round(u / PASO) - q0;
  const B0 = Y(VIA.piedra[0]), B1 = Y(VIA.piedra[1]), T0 = Y(VIA.durmiente[0]), T1 = Y(VIA.durmiente[1]);
  if (B1 < 0 || B0 >= h) return;
  const get = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? ind[y * w + x] : -1);
  // 1. La piedra: gris (23), con el borde mordido de a dos puntos arriba y abajo.
  for (let x = 0; x < w; x++) {
    const u = md(U0 + x, VUELTA), b = u >> 1;
    const arriba = B0 + Math.floor(hash(b, 3) * 3), abajo = B1 - Math.floor(hash(b, 9) * 4);
    for (let y = arriba; y < abajo; y++) pv(x, y, 23);
  }
  // 2. Las piedras sueltas del balasto, de tres formas (todas iguales se leían como rayitas): la luz arriba a la
  //    derecha (24), de donde viene el sol, y la sombra abajo a la izquierda (31).
  const CX = 5, CY = 4;
  for (let n = Math.floor(U0 / CX) - 1; n <= Math.floor((U0 + w) / CX) + 1; n++) {
    const nn = md(n, VUELTA / CX);
    for (let m = Math.floor((B0 + q0) / CY) * CY; m < B1 + q0; m += CY) {
      const hz = hash(nn * 11 + 5, m * 7 + 2);
      if (hz > 0.55) continue;
      const sx = n * CX + Math.floor(hash(nn, m + 1) * 3) - U0, sy = m + Math.floor(hash(m, nn + 3) * 2) - q0;
      const forma = PIEDRAS_VIA[Math.floor(hz / 0.55 * PIEDRAS_VIA.length) % PIEDRAS_VIA.length];
      let libre = true;
      for (let j = 0; j < forma.length && libre; j++) for (let i = 0; i < forma[j].length; i++) if (forma[j][i] !== '.' && get(sx + i, sy + j) !== 23) { libre = false; break; }
      if (!libre) continue;
      for (let j = 0; j < forma.length; j++) for (let i = 0; i < forma[j].length; i++) {
        const l = forma[j][i];
        if (l !== '.') pv(sx + i, sy + j, l === 'l' ? 24 : 31);
      }
    }
  }
  // 3. Los durmientes.
  const rieles = VIA.rieles.map(Y);
  for (let n = Math.floor(U0 / DURMIENTE) - 1; n <= Math.floor((U0 + w) / DURMIENTE) + 1; n++) {
    const nn = md(n, VUELTA / DURMIENTE), x0 = n * DURMIENTE - U0, x1 = x0 + ANCHO_DURMIENTE;
    // (Cada uno apenas distinto: corrido un punto para arriba o para abajo, y alguno más gastado.)
    const dy = Math.floor(hash(nn, 17) * 3) - 1, gastado = hash(nn, 29) < 0.3;
    const t0 = T0 + dy, t1 = T1 + dy;
    for (let y = t0 + 1; y <= t1 + 1; y++) pv(x0 - 1, y, 31);                       // la sombra, a la izquierda
    for (let y = t0; y < t1; y++) for (let x = x0; x < x1; x++) pv(x, y, gastado ? 34 : 33);
    for (let y = t0; y < t1; y++) pv(x1 - 1, y, gastado ? 35 : 34);                 // el canto que agarra el sol
    for (let x = x0; x < x1; x++) { pv(x, t1, 32); pv(x, t1 + 1, 32); }            // el canto de acá
    // La veta: dos rayas a lo largo, cortadas.
    for (const vx of [x0 + 3, x0 + 7]) {
      for (let y = t0 + 2; y < t1 - 2; y++) if (hash(nn * 5 + vx - x0, y + q0) < 0.7) pv(vx, y, 32);
    }
    // Las placas de asiento, debajo de cada riel, con sus clavos.
    for (const ry of rieles) {
      for (let y = ry - 3; y <= ry + 3; y++) for (let x = x0 - 1; x <= x1; x++) pv(x, y, 31);
      pv(x0 + 1, ry - 3, 24); pv(x1 - 2, ry + 3, 24);
    }
  }
  // 4. Los rieles: la cara de arriba (25), su borde (24), el costado que da a la cámara (23) y la sombra hacia acá.
  for (const ry of rieles) {
    for (let x = 0; x < w; x++) {
      pv(x, ry - 2, 25); pv(x, ry - 1, 24); pv(x, ry, 23); pv(x, ry + 1, 23);
      const debajo = get(x, ry + 2);
      pv(x, ry + 2, debajo === 33 || debajo === 34 || debajo === 35 ? 32 : 31);
    }
  }
}

/**
 * EL AFUERA ENTERO: una tira de suelo de una vuelta de ancho, pintada una sola vez por cada luz (de día, de noche, la
 * sombra), que se estampa corrida. La noche es la misma tierra con menos luz *(la noche sale del mismo dibujo)*.
 */
const ARRIBA = Math.floor(-240 / PASO), ALTO = Math.ceil(720 / PASO);
const tiras = {};
let indices = null;
/** La tira con `luz` escalones de luz (0 de día; menos, de noche o en la sombra). */
function tira(luz) {
  if (tiras[luz]) return tiras[luz];
  if (!indices) { indices = new Int16Array(VUELTA * ALTO); pintarSuelo(indices, VUELTA, ALTO, 0, ARRIBA, 0); }
  const cv = document.createElement('canvas'); cv.width = VUELTA; cv.height = ALTO;
  // (En la vía, la mitad de escalones: el gris tiene la escala corta y se iba al negro.)
  const campo = (x, y) => (enLaVia((ARRIBA + y) * PASO) ? Math.floor(luz / 2) : luz);
  cv.getContext('2d').putImageData(new ImageData(iluminar({ ancho: VUELTA, alto: ALTO, indices, campo }), VUELTA, ALTO), 0, 0);
  return (tiras[luz] = cv);
}

/**
 * Estampa el suelo en la pantalla (`ctx` en unidades del mundo, sin la cámara): `camX`, `camY` es el mundo que queda
 * en la esquina de arriba a la izquierda; `desfile`, lo que corrió el suelo (en unidades).
 */
export function dibujarSueloDeAfuera(ctx, camX, camY, ancho, alto, desfile, noche, luz) {
  const T = tira(luz ?? (noche ? CONFIG.tresCuartos.sueloNoche : 0)), k = Math.round(desfile / PASO);
  const p0 = Math.floor(camX / PASO), q0 = Math.floor(camY / PASO);
  const x0 = p0 * PASO - camX, y0 = q0 * PASO - camY;
  const cols = Math.ceil(ancho / PASO) + 2;
  const f0 = Math.max(0, q0 - ARRIBA), f1 = Math.min(ALTO, q0 - ARRIBA + Math.ceil(alto / PASO) + 2);
  if (f1 <= f0) return;
  const yD = y0 + (f0 - (q0 - ARRIBA)) * PASO, hF = f1 - f0;
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  for (let hecho = 0; hecho < cols;) {
    const c = md(p0 + k + hecho, VUELTA), n = Math.min(cols - hecho, VUELTA - c);
    ctx.drawImage(T, c, f0, n, hF, x0 + hecho * PASO, yD, n * PASO, hF * PASO);
    hecho += n;
  }
  ctx.imageSmoothingEnabled = prev;
}

/**
 * Dónde termina abajo la pared de adelante de un vagón (su pie, en el mundo): el borde del mapa, o más abajo si el
 * vagón tiene una sola fila de pared abajo (la misma cuenta que `yAbajo` en world/estiloNuevo/vagones.js).
 */
function pieDelVagon(map, w) {
  const S = map.size, medio = w.colStart + Math.floor(Math.round(w.width / S) / 2);
  const pared = (f) => { const t = (map.grid[f] || [])[medio]; return t === '#' || t === 'W'; };
  let fb = 0; while (fb < map.rows && pared(map.rows - 1 - fb)) fb++;
  return map.rows * S + Math.max(0, 2 - fb) * S;
}

/**
 * 🌗 LA SOMBRA DEL TREN, DEL LADO DE ACÁ *(Santi: "si la luz viene de arriba la sombra no debería proyectarse abajo
 * del tren?")*. 🔁 Iba del lado de allá, y eso contradecía la luz de adentro: el sol que entra por los ventanales del
 * fondo cae en diagonal hacia la pantalla, así que viene de allá y de arriba, y la sombra del tren cae de este lado,
 * corrida hacia la izquierda con la misma inclinación que esa luz (medio punto por punto que baja). Se asoma por
 * debajo de la pared de adelante: la parte de más oscura, pegada al tren, y una más clara en la punta. Se estira con
 * el sol (`sol`, de 1 a 0), como siempre. Por escalones, sobre la misma tierra (nada transparente).
 */
export function sombraDelSuelo(ctx, train, camX, camY, ancho, alto, desfile, sol, corr = () => 0) {
  const c = CONFIG.techo.sensacion.sombra, map = train.map;
  const largo = c.largo * (1 + c.estiraAlAtardecer * (1 - sol));
  const desde = map.rows * map.size;
  for (const [luz, d0, d1] of [[-1, largo * 0.6, largo], [-2, -Infinity, largo * 0.6]]) {
    ctx.save();
    ctx.beginPath();
    let hay = false;
    for (const w of train.wagons) {
      if (w.x - camX > ancho || w.x + w.width - camX < -largo) continue;
      const pie = pieDelVagon(map, w);
      /**
       * 🐛 Corrida con su vagón *(Santi: "cuidado con la sombra: no va parejo al movimiento del tren")*: con los
       * enganches cada vagón se dibuja corrido de su lugar (`corrDibujo`, raidScene.js), y la sombra se quedaba quieta
       * en el lugar de siempre mientras el vagón iba y venía encima. Y desde el mismo punto de la grilla que su dibujo.
       */
      const dx = corr(w.x + w.width / 2);
      const xa = Math.floor(w.x / PASO) * PASO + dx, xb = xa + Math.round(w.width / PASO) * PASO;
      for (let y = Math.round(desde / PASO) * PASO; y < pie + d1; y += PASO) {
        const d = y - pie;
        if (d < d0) continue;
        const corre = Math.round(Math.max(0, d) * 0.5 / PASO) * PASO;
        ctx.rect(xa - corre - camX, y - camY, xb - xa, PASO);
        hay = true;
      }
    }
    if (hay) {
      ctx.clip();
      dibujarSueloDeAfuera(ctx, camX, camY, ancho, alto, desfile, false, luz);
    }
    ctx.restore();
  }
}
