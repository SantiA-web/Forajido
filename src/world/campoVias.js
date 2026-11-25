/**
 * 🛤️ LAS VÍAS DEL CAMPO (scenes/campoScene.js), A LA MEDIDA DEL GALOPE *(Santi, 2026-11-24: "las vías del tren se ven
 * muy chiquitas y apretadas, vos ves eso y ni en las esquinas entra un vagón. Hay que calcular cuánto hay que
 * agrandar"; eligió agrandar el mundo ×3)*. 🔁 Desde el mismo día las líneas salen del plano (data/plano.js), no de
 * los circuitos del papel.
 *
 * LAS MEDIDAS SALEN DEL GALOPE (`viaDeCampo` en world/estiloNuevo/suelo.js), que tiene la vía y el tren en su tamaño de
 * verdad. Allá la vía va de este a oeste, así que lo que mide de arriba a abajo está achatado por la cámara: 16 entre
 * rieles en pantalla son 26 de verdad. Acá la vía va para cualquier lado, así que se guarda la medida de verdad y se
 * achata según para dónde vaya cada tramo (`ACHATA`).
 *
 * LAS ESQUINAS SE VUELVEN CURVAS: un vagón mide ~500, el tren entero ~4.500, y un tren no dobla en ángulo. Cada esquina
 * se redondea con un arco de `CURVA.radio` (unos 3 vagones), más cerrado sólo si el tramo no da.
 */
import { ACHATA } from './destinos.js';
import { copiarPegado } from './estiloNuevo/suelo.js';

/** Medidas de verdad (sin achatar), del galope. */
export const VIA = {
  trocha: 13,         // del centro a cada riel (26 entre rieles)
  terraplen: 24,      // del centro al borde del terraplén
  durmiente: 18,      // del centro a cada punta del durmiente
  cadaDurmiente: 12,  // uno cada tanto, a lo largo
};
export const CURVA = { radio: 1500, paso: 10 };

const COLOR = {
  terraplen: '#8f8478', terraplenSombra: '#6e655c', durmiente: '#4a3424', riel: '#b9bcc2', rielSombra: '#3a3430',
  // La vía muerta: rieles oxidados y el terraplén comido por la tierra.
  rielViejo: '#8a5a3a', terraplenViejo: '#a39072',
};

/**
 * Arma las vías: cada ruta (`rutas`, con sus `puntos`) pasada al mundo con `aMundo(px, py)` → `[x, yDeVerdad]` (sin
 * achatar), con las esquinas redondeadas y un punto cada `CURVA.paso`. Devuelve la lista de puntos ya achatados
 * (`[x, y]`), una por ruta, cuáles están muertas, y un índice para buscar rápido lo que está cerca.
 */
export function armarVias(rutas, aMundo) {
  const vias = rutas.map((ruta) => {
    const P = ruta.puntos.map(([x, y]) => aMundo(x, y));
    const cerrada = ruta.circular && P.length > 2 && P[0][0] === P[P.length - 1][0] && P[0][1] === P[P.length - 1][1];
    if (cerrada) P.pop();
    // (Una línea puede pedir su radio: las patas del triángulo de la mina son cortas y cerradas.)
    return suavizar(P, cerrada, ruta.radio || CURVA.radio).map(([x, y]) => [x, y * ACHATA]);
  });
  const muerta = rutas.map((r) => r.servicio === false);
  // El índice: por celda, qué tramos pasan (para chocar y para dibujar sólo lo que se ve).
  const CELDA = 400, indice = new Map();
  vias.forEach((v, i) => {
    for (let k = 0; k < v.length - 1; k++) {
      const cx = Math.floor(v[k][0] / CELDA), cy = Math.floor(v[k][1] / CELDA), clave = cx + ',' + cy;
      if (!indice.has(clave)) indice.set(clave, []);
      indice.get(clave).push([i, k]);
    }
  });
  /** Los tramos (ruta, punto) que caen en el rectángulo. */
  function tramosEn(x0, y0, x1, y1) {
    const lista = [];
    for (let cx = Math.floor(x0 / CELDA) - 1; cx <= Math.floor(x1 / CELDA); cx++) {
      for (let cy = Math.floor(y0 / CELDA) - 1; cy <= Math.floor(y1 / CELDA); cy++) {
        const t = indice.get(cx + ',' + cy);
        if (t) lista.push(...t);
      }
    }
    return lista;
  }
  /** Si (x, y) está a menos de `d` (de verdad) de una vía. */
  function cerca(x, y, d) {
    for (const [i, k] of tramosEn(x - d, y - d, x + d, y + d)) {
      const [ax, ay] = vias[i][k], [bx, by] = vias[i][k + 1];
      if (aSegmento(x, y / ACHATA, ax, ay / ACHATA, bx, by / ACHATA) < d) return true;
    }
    return false;
  }
  /** El punto de vía más cerca de (x, y), con para dónde va la vía ahí. */
  function masCerca(x, y, d = 1500) {
    let mejor = null;
    for (const [i, k] of tramosEn(x - d, y - d, x + d, y + d)) {
      const p = vias[i][k], dist = Math.hypot(p[0] - x, (p[1] - y) / ACHATA);
      if (!mejor || dist < mejor.d) {
        const q = vias[i][k + 1];
        mejor = { d: dist, x: p[0], y: p[1], rumbo: Math.atan2((q[1] - p[1]) / ACHATA, q[0] - p[0]), ruta: i };
      }
    }
    return mejor;
  }
  // Cuánto se lleva recorrido de cada ruta en cada punto (de verdad): para poner los durmientes siempre en el mismo lugar.
  const acum = vias.map((v) => {
    const a = [0];
    for (let k = 1; k < v.length; k++) a.push(a[k - 1] + Math.hypot(v[k][0] - v[k - 1][0], (v[k][1] - v[k - 1][1]) / ACHATA));
    return a;
  });
  return { vias, muerta, acum, tramosEn, cerca, masCerca };
}

/**
 * Redondea las esquinas de una línea (en medidas de verdad): cada esquina, un arco de círculo que toca los dos tramos.
 * 🔁 Era una curva de Bézier, pero en las vueltas grandes se cerraba mucho en el medio (el radio de la punta quedaba
 * en la mitad del pedido); el arco tiene el mismo radio en toda la curva, como una vía de verdad. También sirve para los
 * arroyos, los ríos y los caminos (con otro `radio`).
 */
export function suavizar(P, cerrada = false, radioPedido = CURVA.radio, cada = CURVA.paso) {
  const n = P.length, salida = [];
  const esquina = (i) => {
    const A = P[(i - 1 + n) % n], B = P[i], C = P[(i + 1) % n];
    const ab = Math.hypot(B[0] - A[0], B[1] - A[1]), bc = Math.hypot(C[0] - B[0], C[1] - B[1]);
    const u1 = [(B[0] - A[0]) / ab, (B[1] - A[1]) / ab], u2 = [(C[0] - B[0]) / bc, (C[1] - B[1]) / bc];
    const giro = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1])));
    if (giro < 0.02) return [B];
    // Lo que se come la curva de cada tramo: con el radio, o la mitad del tramo si no da.
    const t = Math.min(radioPedido * Math.tan(giro / 2), ab / 2, bc / 2);
    const T1 = [B[0] - u1[0] * t, B[1] - u1[1] * t];
    // El centro del arco: desde T1, de costado (hacia donde dobla) a la distancia del radio.
    const radio = t / Math.tan(giro / 2), lado = Math.sign(u1[0] * u2[1] - u1[1] * u2[0]) || 1;
    const O = [T1[0] - u1[1] * radio * lado, T1[1] + u1[0] * radio * lado];
    const a0 = Math.atan2(T1[1] - O[1], T1[0] - O[0]);
    const pasos = Math.max(2, Math.ceil((radio * giro) / cada)), pts = [];
    for (let s = 0; s <= pasos; s++) {
      const a = a0 + lado * giro * (s / pasos);
      pts.push([O[0] + Math.cos(a) * radio, O[1] + Math.sin(a) * radio]);
    }
    return pts;
  };
  const recta = (p, q) => {
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]), pasos = Math.max(1, Math.ceil(l / cada)), pts = [];
    for (let s = 1; s < pasos; s++) pts.push([p[0] + (q[0] - p[0]) * s / pasos, p[1] + (q[1] - p[1]) * s / pasos]);
    return pts;
  };
  const curvas = [];
  for (let i = 0; i < n; i++) curvas.push(cerrada || (i > 0 && i < n - 1) ? esquina(i) : [P[i]]);
  for (let i = 0; i < n; i++) {
    salida.push(...curvas[i]);
    if (i < n - 1 || cerrada) {
      const fin = curvas[i][curvas[i].length - 1], ini = curvas[(i + 1) % n][0];
      salida.push(...recta(fin, ini));
    }
  }
  if (cerrada) salida.push(salida[0]);
  return salida;
}

export function aSegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Normal de un tramo, achatada: hacia dónde quedan los rieles y las puntas de los durmientes. */
export function normalAchatada(a, b) {
  const dx = b[0] - a[0], dy = (b[1] - a[1]) / ACHATA, l = Math.hypot(dx, dy) || 1;
  return [-dy / l, (dx / l) * ACHATA];
}

/**
 * Dibuja lo que se ve de las vías: el terraplén de piedra (con su borde de acá en sombra), los durmientes cruzados y los
 * dos rieles. Todo achatado según para dónde va cada tramo. `debajo(a, b)` (si viene) dibuja lo que va bajo un tramo
 * antes del terraplén: el puente sobre el río, el caballete sobre un arroyo.
 */
export function dibujarVias(ctx, red, cam, ancho, alto, debajo = null) {
  const todos = red.tramosEn(cam.x - 60, cam.y - 60, cam.x + ancho + 60, cam.y + alto + 60);
  if (!todos.length) return;
  const normal = normalAchatada;
  if (debajo) for (const [i, k] of todos) debajo(red.vias[i][k], red.vias[i][k + 1]);
  for (const muertas of [true, false]) {
    const tramos = todos.filter(([i]) => red.muerta[i] === muertas);
    if (!tramos.length) continue;
    const linea = (color, w, off, extraY = 0) => {
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
      ctx.beginPath();
      for (const [i, k] of tramos) {
        const a = red.vias[i][k], b = red.vias[i][k + 1], n = normal(a, b);
        ctx.moveTo(a[0] + n[0] * off, a[1] + n[1] * off + extraY);
        ctx.lineTo(b[0] + n[0] * off, b[1] + n[1] * off + extraY);
      }
      ctx.stroke();
    };
    // 1. El terraplén: una franja ancha de piedra, y abajo su sombra (la ladera que da a la cámara). Cada tramo es un
    // cuadrilátero, y van todos en un solo relleno *(🔁 antes cada tramo era un trazo aparte: la vía sola costaba 8 ms)*.
    const franja = (color, bajar) => {
      ctx.fillStyle = color; ctx.beginPath();
      for (const [i, k] of tramos) {
        const a = red.vias[i][k], b = red.vias[i][k + 1], n = normal(a, b), w = VIA.terraplen;
        // (Un poco más largo de cada punta, para que no queden rendijas entre tramos en las curvas.)
        const dx = (b[0] - a[0]) * 0.15, dy = (b[1] - a[1]) * 0.15;
        ctx.moveTo(a[0] - dx + n[0] * w, a[1] - dy + n[1] * w + bajar);
        ctx.lineTo(b[0] + dx + n[0] * w, b[1] + dy + n[1] * w + bajar);
        ctx.lineTo(b[0] + dx - n[0] * w, b[1] + dy - n[1] * w + bajar);
        ctx.lineTo(a[0] - dx - n[0] * w, a[1] - dy - n[1] * w + bajar);
        ctx.closePath();
      }
      ctx.fill();
    };
    franja(COLOR.terraplenSombra, 3);
    franja(muertas ? COLOR.terraplenViejo : COLOR.terraplen, 0);
    // 2. Los durmientes: uno cada `cadaDurmiente` a lo largo de la vía (en la muerta faltan muchos).
    ctx.strokeStyle = COLOR.durmiente; ctx.lineWidth = 3; ctx.lineCap = 'butt';
    ctx.beginPath();
    for (const [i, k] of tramos) {
      const a = red.vias[i][k], b = red.vias[i][k + 1], n = normal(a, b);
      // (Contados desde el principio de la ruta, para que no salten al moverse la cámara.)
      const d0 = red.acum[i][k], d1 = red.acum[i][k + 1], largo = d1 - d0 || 1;
      for (let d = Math.ceil(d0 / VIA.cadaDurmiente) * VIA.cadaDurmiente; d < d1; d += VIA.cadaDurmiente) {
        if (muertas && (Math.round(d / VIA.cadaDurmiente) * 7919) % 5 < 2) continue;
        const t = (d - d0) / largo, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
        ctx.moveTo(x - n[0] * VIA.durmiente, y - n[1] * VIA.durmiente);
        ctx.lineTo(x + n[0] * VIA.durmiente, y + n[1] * VIA.durmiente);
      }
    }
    ctx.stroke();
    // 3. Los rieles, con su sombra hacia acá.
    const riel = muertas ? COLOR.rielViejo : COLOR.riel;
    linea(COLOR.rielSombra, 1.5, VIA.trocha, 1);
    linea(COLOR.rielSombra, 1.5, -VIA.trocha, 1);
    linea(riel, 1.5, VIA.trocha);
    linea(riel, 1.5, -VIA.trocha);
  }
}

/**
 * Lo que no se mueve, ya pintado, de a pedazos: cada cuadrado de mundo de `LADO` se pinta una sola vez en un lienzo
 * aparte con `pintarPedazo(ctx, x0, y0, lado)` y después sólo se copia. *(Medido el 2026-11-24: dibujar la vía entera
 * cada cuadro llevaba el cuadro de 4 a 16 ms.)* Se guardan los últimos `GUARDA` pedazos; los que quedan lejos se tiran.
 */
export function crearPintor(pintarPedazo, hayAlgo = () => true) {
  const LADO = 400, PX = 2, GUARDA = 24, pedazos = new Map();
  function pedazo(cx, cy) {
    const clave = cx + ',' + cy;
    if (pedazos.has(clave)) {
      const p = pedazos.get(clave);
      pedazos.delete(clave); pedazos.set(clave, p);   // (al final: el más usado último)
      return p;
    }
    const x0 = cx * LADO, y0 = cy * LADO;
    let lienzo = null;
    if (hayAlgo(x0, y0, LADO)) {
      lienzo = document.createElement('canvas');
      lienzo.width = lienzo.height = LADO * PX;
      const c = lienzo.getContext('2d');
      c.setTransform(PX, 0, 0, PX, -x0 * PX, -y0 * PX);
      pintarPedazo(c, x0, y0, LADO);
    }
    pedazos.set(clave, lienzo);
    if (pedazos.size > GUARDA) pedazos.delete(pedazos.keys().next().value);
    return lienzo;
  }
  /** Copia lo que se ve (`ctx` ya con la cámara puesta, en unidades del mundo). */
  return function pintar(ctx, cam, ancho, alto) {
    for (let cx = Math.floor(cam.x / LADO); cx <= Math.floor((cam.x + ancho) / LADO); cx++) {
      for (let cy = Math.floor((cam.y - 10) / LADO); cy <= Math.floor((cam.y + alto) / LADO); cy++) {
        const l = pedazo(cx, cy);
        if (l) copiarPegado(ctx, l, cx * LADO, cy * LADO, LADO, LADO);
      }
    }
  };
}
