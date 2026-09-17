/**
 * MEDIRLE LA SILUETA A LA REFERENCIA (etapa 5b, tercera vuelta).
 *
 * *(Santi: "por qué no simplemente copias (y luego lo adaptas) a la imagen que
 * te mando")*. Tenía razón y es lo que faltaba. Las dos vueltas anteriores
 * sacaron la forma de NÚMEROS DE ANATOMÍA —un caballo mide tanto, el pecho es
 * tal porcentaje de la alzada— y salió un caballo con las medidas correctas y
 * la forma de zorro. Los números no son la forma.
 *
 * Esto hace lo otro: carga la referencia, le saca la silueta, la lleva a
 * NUESTRA escala y la pone **encima** de la nuestra en dos colores. Lo que no
 * coincide se ve; no hay que adivinarlo.
 *
 * CÓMO SE IGUALAN LAS ESCALAS. Por el ANCHO de la caja: las dos siluetas van
 * de la punta de la cola a la punta del hocico, así que ese ancho es lo mismo
 * en las dos. Después se comparan los ALTOS — y esa diferencia, sola, dice si
 * nuestro caballo es demasiado largo y bajo. Es el número que buscamos.
 *
 * La referencia NO se copia al juego: de acá salen el contorno y las
 * proporciones, nada más.
 */

// Con marca de tiempo: si no, el navegador sirve el modulo viejo y uno compara
// contra un caballo que ya no existe (me paso, y perdi una vuelta entera).
const { dibujarAnimal } = await import('../../src/entities/caballo.js?v=' + Date.now());

const DENSIDAD = 4;
const TINTA_REF = '#c2382c';   // la referencia, en rojo
const TINTA_MIA = '#1b2a4a';   // la nuestra, en azul

const hoja = document.getElementById('hoja');
const ctx = hoja.getContext('2d');

/** Un renderer que pinta todo del mismo color (el mismo truco de la silueta). */
function rendererPlano(g, color) {
  const q = (v) => Math.round(v * DENSIDAD) / DENSIDAD;
  return {
    ctx: g, plano: color,
    rect(x, y, w, h) {
      if (w <= 0 || h <= 0) return;
      g.fillStyle = color;
      g.fillRect(q(x), q(y), Math.max(1 / DENSIDAD, q(w)), Math.max(1 / DENSIDAD, q(h)));
    },
    box(x, y, hw, hh) { this.rect(x - hw, y - hh, hw * 2, hh * 2); },
    line(x1, y1, x2, y2, c, a, grosor = 1) {
      g.save();
      g.strokeStyle = color; g.lineWidth = grosor;
      g.beginPath(); g.moveTo(q(x1), q(y1)); g.lineTo(q(x2), q(y2)); g.stroke();
      g.restore();
    },
    circle() {}, text() {}, poly() {},
  };
}

/** La caja que ocupa de verdad lo dibujado en un lienzo (lo que no es transparente). */
function caja(datos, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (datos[(y * w + x) * 4 + 3] > 40) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * La silueta de una imagen: todo lo que no es fondo, pintado de un color.
 * El fondo se detecta por la esquina — sirve tanto para blanco como para
 * transparente.
 */
function siluetaDeImagen(img, color) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height);
  const p = d.data;
  const f = [p[0], p[1], p[2], p[3]];
  const rgb = parseInt(color.slice(1), 16);
  const [cr, cg, cb] = [(rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255];
  for (let i = 0; i < p.length; i += 4) {
    const esFondo = p[i + 3] < 40
      || (f[3] > 40 && Math.abs(p[i] - f[0]) < 26 && Math.abs(p[i + 1] - f[1]) < 26 && Math.abs(p[i + 2] - f[2]) < 26);
    if (esFondo) { p[i + 3] = 0; continue; }
    p[i] = cr; p[i + 1] = cg; p[i + 2] = cb; p[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  return { c, caja: caja(p, c.width, c.height) };
}

/** Nuestro caballo, dibujado plano en su propio lienzo. */
function miSilueta(pose) {
  const W = 70, H = 46;
  const c = document.createElement('canvas');
  c.width = W * DENSIDAD; c.height = H * DENSIDAD;
  const g = c.getContext('2d');
  g.setTransform(DENSIDAD, 0, 0, DENSIDAD, 0, 0);
  g.imageSmoothingEnabled = false;
  const r = rendererPlano(g, TINTA_MIA);
  const m = dibujarAnimal(r, 35, 26, { t: 0.22, T: 0.56 }, 0, 1, pose);
  m.adelante();
  const d = g.getImageData(0, 0, c.width, c.height);
  return { c, caja: caja(d.data, c.width, c.height) };
}

/**
 * EL CONTORNO DEL CUERPO, columna por columna: el primer píxel pintado
 * (el lomo) y el último de esa MISMA corrida seguida (la panza).
 *
 * La corrida seguida es la clave: sobre el barril arranca en el lomo y termina
 * en la panza, y no sigue de largo hasta el casco porque entre la panza y la
 * pata hay fondo. Es exactamente el par de números que necesitan `LOMO` y
 * `PANZA` en caballo.js — los mismos que yo venía inventando a ojo.
 */
function contornoCuerpo(canvas, cj, columnas, escala) {
  const g = canvas.getContext('2d');
  const d = g.getImageData(cj.x0, cj.y0, cj.w, cj.h).data;
  const out = [];
  for (let i = 0; i < columnas; i++) {
    const x = Math.min(cj.w - 1, Math.round((i / (columnas - 1)) * (cj.w - 1)));
    let t = null, b = null;
    for (let y = 0; y < cj.h; y++) {
      const hay = d[(y * cj.w + x) * 4 + 3] > 40;
      if (hay && t === null) t = y;
      else if (!hay && t !== null) { b = y - 1; break; }
    }
    if (t !== null && b === null) b = cj.h - 1;
    out.push(t === null ? null : [Math.round(t * escala), Math.round(b * escala)]);
  }
  return out;
}

/** El contorno de arriba: para cada columna, el primer píxel pintado. */
function contornoDeArriba(canvas, cj, columnas) {
  const g = canvas.getContext('2d');
  const d = g.getImageData(cj.x0, cj.y0, cj.w, cj.h).data;
  const out = [];
  for (let i = 0; i < columnas; i++) {
    const x = Math.min(cj.w - 1, Math.round((i / (columnas - 1)) * (cj.w - 1)));
    let y = null;
    for (let yy = 0; yy < cj.h; yy++) {
      if (d[(yy * cj.w + x) * 4 + 3] > 40) { y = yy / cj.h; break; }
    }
    out.push(y);
  }
  return out;
}

const cargar = (u) => new Promise((ok, no) => {
  const i = new Image();
  i.onload = () => ok(i);
  i.onerror = () => no(new Error('no se pudo cargar ' + u));
  i.src = u;
});

(async () => {
  const ref = siluetaDeImagen(await cargar('referencias/perfil.png'), TINTA_REF);
  const mia = miSilueta(0);

  // Igualamos por el ANCHO de la caja: las dos van de la cola al hocico.
  const escala = mia.caja.w / ref.caja.w;
  const refW = Math.round(ref.caja.w * escala);
  const refH = Math.round(ref.caja.h * escala);
  const Z = 3;

  const ancho = 20 + refW * Z + 30 + mia.caja.w * Z + 60 + Math.max(refW, mia.caja.w) * Z + 20;
  const alto = Math.max(mia.caja.h, refH) * Z + 200;
  hoja.width = ancho; hoja.height = alto;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#efe6d5';
  ctx.fillRect(0, 0, ancho, alto);

  const dibujarRef = (dx, dy) => ctx.drawImage(
    ref.c, ref.caja.x0, ref.caja.y0, ref.caja.w, ref.caja.h,
    dx, dy, refW * Z, refH * Z,
  );
  const dibujarMia = (dx, dy) => ctx.drawImage(
    mia.c, mia.caja.x0, mia.caja.y0, mia.caja.w, mia.caja.h,
    dx, dy, mia.caja.w * Z, mia.caja.h * Z,
  );

  const base = 130 + Math.max(mia.caja.h, refH) * Z;   // el piso, donde apoyan
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = '#3a2a18';
  ctx.fillText('LA REFERENCIA (rojo) y LA NUESTRA (azul), al mismo ancho', 20, 24);
  ctx.fillText('izquierda: una al lado de la otra   ·   derecha: superpuestas', 20, 44);

  dibujarRef(20, base - refH * Z);
  dibujarMia(20 + refW * Z + 30, base - mia.caja.h * Z);

  const ox = 20 + refW * Z + mia.caja.w * Z + 60;
  ctx.globalAlpha = 0.55;
  dibujarRef(ox, base - refH * Z);
  dibujarMia(ox, base - mia.caja.h * Z);
  ctx.globalAlpha = 1;

  const porc = Math.round((mia.caja.h / refH) * 100);
  ctx.fillStyle = '#7a2016';
  ctx.fillText(`referencia: ${refW} × ${refH} puntos`, 20, base + 26);
  ctx.fillStyle = '#1b2a4a';
  ctx.fillText(`la nuestra: ${mia.caja.w} × ${mia.caja.h} puntos  →  ${porc}% del alto de la referencia`, 20, base + 46);

  window.MEDIDA = {
    ref: { w: refW, h: refH },
    mia: { w: mia.caja.w, h: mia.caja.h },
    altoRelativo: porc,
    cuerpoRef: contornoCuerpo(ref.c, ref.caja, 44, escala),
    cuerpoMio: contornoCuerpo(mia.c, mia.caja, 44, 1),
  };
  window.LISTO = true;
})();
