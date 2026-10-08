/**
 * 🎨 LA PALETA DEL ESTILO NUEVO: 48 COLORES, NI UNO MÁS.
 *
 * *(Santi eligió el estilo nuevo, 2026-10-08: "uuuufffff. Espectacular. Me
 * encantó"; y pidió "subiría la paleta, quizá a 48 colores para tener un poco
 * más de variación")*. Ver NOTAS-DISENO.md, "EL ESTILO NUEVO".
 *
 * Todo lo que se dibuje en el estilo nuevo usa sólo estos colores. Eso es lo
 * que hace que un juego se vea "de una sola mano": la gente, el tren, el
 * desierto y los efectos comparten los mismos tonos.
 *
 * LOS COLORES VAN EN ESCALAS, de oscuro a claro (madera, rojo, piel, tela,
 * azul…). La luz no pinta encima: MUEVE cada punto por su escala, uno o dos
 * pasos (ver engine/luz.js). Por eso la noche sale sola del mismo dibujo, y
 * por eso nunca aparece un color que no esté acá.
 */

export const PALETA = [
  '#140c1c', '#2a1e30', '#44324a', '#3a2418', '#5a3820', '#7e5230', '#a8743e', '#d4a060', //  0-7
  '#5a1a20', '#8a2a28', '#c04a34', '#7a4630', '#b27a52', '#e0aa78', '#6e6250', '#9a8a6a', //  8-15
  '#c8b890', '#f0e6c0', '#1c2a44', '#2e4466', '#4a6a90', '#7aa0c0', '#b8d8e8', '#4a4a52', // 16-23
  '#7a7a80', '#b4b0aa', '#2a4a2a', '#4a7a3a', '#e8b84a', '#fff0a0', '#ffffff', '#323038', // 24-31
  '#34221a', '#4e3424', '#6a4a32', '#886244', '#a67e58', '#c8a878', '#e6caa0', '#3e1418', // 32-39
  '#10182c', '#24304a', '#1a2e1e', '#6a9a4a', '#c86a28', '#f09a3a', '#5a4a6a', '#4e2c20', // 40-47
];

/**
 * LAS ESCALAS, de oscuro a claro. Una escala puede tomar prestado un color de
 * otra en las puntas (casi todas terminan abajo en el negro, el 0): así lo más
 * oscuro de la noche es el mismo para todo.
 *
 *   osc   los oscuros (el contorno es el 0)
 *   mad   la madera de las paredes, que de día casi dora
 *   gas   la madera gastada del piso: más marrón y menos amarilla
 *         *(Santi: "el vagón de día parece un vagón de oro")*
 *   are   la arena de afuera
 *   roj   el rojo: tapizados, el pañuelo, la sangre
 *   pie   la piel
 *   tel   la tela clara: camisas, lona, papel
 *   azu   el azul: el cielo, los vidrios, la noche, los uniformes
 *   gri   los grises: el fierro, las armas
 *   ver   los verdes: cactus, matas y la pintura de los vagones
 *   fue   el fuego y el bronce: faroles, fogonazos, el oro
 */
export const ESCALAS = {
  osc: [0, 1, 46, 2],
  mad: [0, 1, 3, 4, 5, 6, 7],
  gas: [0, 1, 32, 33, 34, 35, 36, 38],
  are: [3, 5, 6, 37, 38, 17],
  roj: [0, 39, 8, 9, 10, 13],
  pie: [1, 47, 11, 12, 13, 17],
  tel: [1, 2, 14, 15, 16, 17, 30],
  azu: [0, 40, 18, 41, 19, 20, 21, 22, 30],
  gri: [0, 31, 23, 24, 25, 30],
  ver: [0, 42, 26, 27, 43],
  fue: [3, 5, 44, 28, 45, 29, 30],
};

/** De qué escala es cada color (su "casa") y en qué paso de ella está. */
const CASAS = {
  osc: [0, 1, 46, 2], mad: [3, 4, 5, 6, 7], gas: [32, 33, 34, 35, 36], are: [37, 38],
  roj: [39, 8, 9, 10], pie: [47, 11, 12, 13], tel: [14, 15, 16, 17], azu: [40, 18, 41, 19, 20, 21, 22],
  gri: [31, 23, 24, 25, 30], ver: [42, 26, 27, 43], fue: [44, 28, 45, 29],
};
const CASA = [];
for (const [escala, colores] of Object.entries(CASAS)) {
  for (const i of colores) CASA[i] = [escala, ESCALAS[escala].indexOf(i)];
}

/**
 * EL MISMO COLOR CON `pasos` DE LUZ: positivo aclara, negativo oscurece, por
 * su escala. En la punta se queda ahí (no inventa un color que no existe). El
 * contorno (0) no cambia nunca.
 */
export function sombrear(i, pasos) {
  if (i === 0 || !pasos) return i;
  const [escala, p] = CASA[i];
  const s = ESCALAS[escala];
  return s[Math.max(0, Math.min(s.length - 1, p + pasos))];
}

export const RGB = PALETA.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);

/**
 * EL COLOR DE LA PALETA MÁS PARECIDO a uno cualquiera. Se busca en una tabla
 * armada una sola vez (32 tonos por canal: 32.768 casillas), porque pasar una
 * pantalla entera por la paleta, color por color, costaría 20 ms por cuadro.
 */
let tabla = null;
function armarTabla() {
  tabla = new Uint8Array(32 * 32 * 32);
  for (let r = 0; r < 32; r++) for (let g = 0; g < 32; g++) for (let b = 0; b < 32; b++) {
    const R = r * 8 + 4, G = g * 8 + 4, B = b * 8 + 4;
    let mejor = 0, d0 = Infinity;
    for (let i = 0; i < RGB.length; i++) {
      const c = RGB[i];
      // Se pesa el verde más (el ojo lo nota más): si no, los marrones se van al gris.
      const d = 2 * (R - c[0]) ** 2 + 4 * (G - c[1]) ** 2 + 3 * (B - c[2]) ** 2;
      if (d < d0) { d0 = d; mejor = i; }
    }
    tabla[(r << 10) | (g << 5) | b] = mejor;
  }
}

export function masCercano(r, g, b) {
  if (!tabla) armarTabla();
  return tabla[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)];
}

/** Pasa una imagen entera por la paleta (sólo lo que no es transparente). */
export function cuantizar(imagen) {
  if (!tabla) armarTabla();
  const d = imagen.data;
  for (let k = 0; k < d.length; k += 4) {
    if (d[k + 3] === 0) continue;
    const c = RGB[tabla[((d[k] >> 3) << 10) | ((d[k + 1] >> 3) << 5) | (d[k + 2] >> 3)]];
    d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
  }
  return imagen;
}
