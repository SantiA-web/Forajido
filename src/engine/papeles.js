/**
 * 📜 LOS PAPELES DE LA HISTORIA *(Santi, 2026-11-23: "siento que la historia es muy buena, pero no la estamos mostrando
 * como se merece"; eligió mi recomendación B: "que los papeles se vean como papeles")*. Lo que el jugador tiene en la
 * mano no se lee en la caja de diálogo de abajo: se ve grande, en el medio, como el papel que es.
 *  - **La carta** (J.Mc.): una hoja con letra de mano, la firma y el lacre.
 *  - **La nota** (un papel clavado en un poste, el recado de alguien): más chica y más sucia, sin lacre.
 *  - **El diario**: el nombre del diario arriba, la fecha, el titular grande y la nota en columnas.
 *  - **El cartel**: "SE BUSCA", la cara, el nombre, por qué y cuánto pagan.
 * Las respuestas, si las hay, van abajo en el mismo papel. Los usa el menú (engine/menu.js, `escena`).
 *
 * 🔁 PAPEL CRUDO *(Santi, 2026-11-23: "siento que los rectángulos y carteles se ven muy infantil. Deberían verse más
 * crudos, duros y reales"; eligió "B y la carta cruda")*: ya no un rectángulo prolijo con marco, sino un papel de verdad
 * (`papelCrudo`): los bordes rotos, el grano, las orillas más oscuras de tanto manosearlo, una o dos manchas, los dobleces
 * de haberlo tenido en el bolsillo. Todo sale siempre igual para el mismo papel (depende del texto, no del azar de cada
 * cuadro: si no, titilaría).
 *
 * 🖋️ LA PLUMA DE CADA UNO *(Santi: "para la época habían dos tipos de lapiceras: las que se tenían que meter en tintero y
 * las que no. Para gente de élite quiero que uses la lapicera que no. Para las personas como Rosa usa las otras y que se
 * vea cómo va perdiendo intensidad la tinta en el papel")*:
 *  - **Estilográfica** (J.Mc. —John McKenzy, rico—, Capizzu): la tinta sale pareja de punta a punta, negro azulado.
 *  - **De tintero** (Rosa, el capataz, Dagget, los Rennick, todos los demás): recién mojada escribe oscuro, y palabra por
 *    palabra se va aclarando hasta que la vuelven a mojar; a veces, al mojarla, cae una gotita.
 */
import { PALETA } from './paleta.js';
import { papel, cara } from './menu.js';
import { estiloNuevo } from './estiloNuevo.js';
import { CONFIG } from '../data/config.js';

// (Las mismas tintas que el papel del diálogo, engine/menu.js. Van con la paleta y no con `TINTAS`: este archivo y el
// menú se importan entre sí, y una constante del otro todavía no existe cuando éste arranca.)
const PAPEL_SUCIO = PALETA[36], BORDE = PALETA[34];
const TINTA = PALETA[32], TINTA_SUAVE = PALETA[34], SELLO = PALETA[8], SOMBRA = PALETA[0];
/** La letra de mano de las cartas, y la de imprenta del diario y los carteles. */
export const LETRAS = {
  mano: { fuente: 'Georgia, "Times New Roman", serif', estilo: 'italic' },
  imprenta: { fuente: 'Georgia, "Times New Roman", serif', estilo: '' },
  titular: { fuente: 'Georgia, "Times New Roman", serif', estilo: 'bold' },
};
const LACRE = PALETA[9], LACRE_OSCURO = PALETA[8], LACRE_BRILLO = PALETA[10], LACRE_NEGRO = PALETA[39];
const sinHalo = { halo: false };
/** Un punto de la grilla, en unidades del mundo (el papel se dibuja de a puntos, como todo). */
const P = CONFIG.estilo.punto / 4;

/**
 * 🖋️ LAS DOS PLUMAS. `fresca`: el color recién mojada; `gastada`: el de cuando ya casi no le queda (la de tintero);
 * `cada`: cada cuántas letras se vuelve a mojar (entre las dos, al azar del papel); `gota`: la chance de que caiga una
 * gotita al mojarla. Los colores van en la capa fina (las letras), que no pasa por la paleta.
 */
export const PLUMAS = {
  // ✍️ `letra` y `escala`: la letra de mano de cada pluma *(Santi: "que la letra se vea como una letra escrita a mano del
  // estilo de la época")*: la estilográfica, caligrafía fina de gente con plata (Pinyon Script); la de tintero, una
  // cursiva común (Cedarville Cursive). Las dos son libres (OFL), en src/assets/letras. `escala`: cuánto más grande
  // que el tamaño del papel, porque las letras de mano son más chicas a igual tamaño.
  estilografica: { fresca: '#1d1a2e', gastada: '#1d1a2e', letra: { fuente: '"Pinyon Script", Georgia, serif', estilo: '' }, escala: 1.45 },
  // (🔁 La gastada, más oscura que antes: con #8a6a44 sobre el papel no se leía.)
  tintero: { fresca: '#1a0e06', gastada: '#5c432c', cada: [55, 95], gota: 0.45, letra: { fuente: '"Cedarville Cursive", Georgia, serif', estilo: '' }, escala: 1.25 },
};
/** Quién escribe con cuál (por la firma). Los que no están, con la de tintero. */
const PLUMA_DE = { 'J.Mc.': 'estilografica', Capizzu: 'estilografica' };
const plumaDe = (p) => PLUMAS[p.pluma || PLUMA_DE[p.firma] || 'tintero'];

/**
 * ✍️ CARGAR LAS LETRAS DE MANO. Hasta que llegan se escribe con la de antes (Georgia); `letrasCargadas` cuenta las que
 * llegaron, y los papeles vuelven a partir sus renglones cuando cambia (con otra letra, otro ancho). Las rutas van
 * sueltas entre comillas para que armar-archivo.ps1 las meta adentro del juego en un archivo.
 */
let letrasCargadas = 0;
const ARCHIVOS_DE_LETRAS = [
  ['Pinyon Script', 'src/assets/letras/PinyonScript-Regular.ttf'],
  ['Cedarville Cursive', 'src/assets/letras/Cedarville-Cursive.ttf'],
];
if (typeof FontFace !== 'undefined' && typeof document !== 'undefined') {
  for (const [nombre, ruta] of ARCHIVOS_DE_LETRAS) {
    const url = ruta.startsWith('data:') ? ruta : new URL('../../' + ruta, import.meta.url).href;
    new FontFace(nombre, `url(${url})`).load().then((f) => { document.fonts.add(f); letrasCargadas++; }).catch(() => {});
  }
}

/** Parte un texto en renglones que entren en `ancho`, con esa letra y ese tamaño. */
export function partirCon(r, texto, ancho, tam, letra) {
  const out = [];
  for (const parrafo of texto.split('\n')) {
    let linea = '';
    for (const palabra of parrafo.split(' ')) {
      const prueba = linea ? linea + ' ' + palabra : palabra;
      if (linea && r.medir(prueba, tam, letra) > ancho) { out.push(linea); linea = palabra; } else linea = prueba;
    }
    out.push(linea);
  }
  return out;
}

/** Los renglones, pero sólo las primeras `letras` letras (lo que ya se "escribió"). */
export function hastaLetras(renglones, letras) {
  const out = [];
  let quedan = letras;
  for (const t of renglones) {
    if (quedan <= 0) break;
    out.push(t.slice(0, Math.max(0, quedan)));
    quedan -= t.length;
  }
  return out;
}

/** Cuántas letras tiene un papel (para saber cuándo terminó de escribirse). */
export function letrasDe(p) {
  if (p.tipo === 'diario') return (p.titular || '').length + (p.texto || '').length;
  if (p.tipo === 'cartel') return 1;
  return (p.texto || '').length;
}

// ------------------------------------------------------------------ el azar fijo de cada papel

/** Un número a partir de un texto: el mismo papel, siempre el mismo azar. */
export function semillaDe(t) {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return h >>> 0;
}
function azarDe(semilla) {
  let s = (semilla >>> 0) || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

/** Mezcla dos colores '#rrggbb' (`t`: 0 = el primero, 1 = el segundo). */
function mezclar(a, b, t) {
  const n = (c, i) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
  const m = (i) => Math.round(n(a, i) + (n(b, i) - n(a, i)) * t).toString(16).padStart(2, '0');
  return '#' + m(0) + m(1) + m(2);
}

// ------------------------------------------------------------------ el papel crudo

/** Los tonos de cada papel: la carta, la nota (más sucia), el diario (más claro) y el cartel. */
const TONOS = {
  carta: { base: PALETA[37], sucio: PALETA[36], claro: PALETA[38], mancha: PALETA[35], aro: PALETA[34] },
  nota: { base: PALETA[36], sucio: PALETA[35], claro: PALETA[37], mancha: PALETA[34], aro: PALETA[33] },
  diario: { base: PALETA[38], sucio: PALETA[37], claro: PALETA[17], mancha: PALETA[36], aro: PALETA[35] },
  cartel: { base: PALETA[37], sucio: PALETA[36], claro: PALETA[38], mancha: PALETA[35], aro: PALETA[34] },
};

/**
 * 📜 UN PAPEL DE VERDAD, de a puntos de la grilla: la sombra, el cuerpo con las orillas rotas (cada punto del borde
 * mordido o no), las orillas más oscuras de manosearlo, el grano, `manchas` manchas con su aro de lo que se secó, y
 * `dobleces` dobleces (una raya oscura y una clara abajo, donde la luz pega en el pliegue). `tono`: ver `TONOS`.
 */
export function papelCrudo(r, x, y, w, h, semilla, { tono = 'carta', manchas = 1, dobleces = 0, soloAbajo = false } = {}) {
  const T = TONOS[tono] || TONOS.carta, az = azarDe(semilla), ctx = r.ctx;
  x = Math.round(x / P) * P; y = Math.round(y / P) * P;
  const cols = Math.round(w / P), filas = Math.round(h / P);
  w = cols * P; h = filas * P;
  // 🐛 (El contorno de la gente y los puntos finos se pintan al final: sin borrarlos, se verían encima del papel.)
  estiloNuevo.borrarGente(ctx, x - P, y - P, w + 4 * P, h + 4 * P, true);
  // La sombra, corrida abajo a la derecha.
  ctx.globalAlpha = 0.55;
  r.rect(x + 3 * P, y + 3 * P, w, h, SOMBRA);
  ctx.globalAlpha = 1;
  // El cuerpo: cada columna con su mordida arriba y abajo; los costados, cada fila con la suya.
  const arriba = [], abajo = [], izq = [], der = [];
  for (let i = 0; i < cols; i++) {
    arriba.push(az() < 0.3 ? 1 + Math.floor(az() * 2) : 0);
    abajo.push(az() < 0.3 ? 1 + Math.floor(az() * 2) : 0);
  }
  for (let j = 0; j < filas; j++) {
    izq.push(az() < 0.25 ? 1 : 0);
    der.push(az() < 0.25 ? 1 : 0);
  }
  for (let i = 1; i < cols - 1; i++) r.rect(x + i * P, y + arriba[i] * P, P, h - (arriba[i] + abajo[i]) * P, T.base);
  for (let j = 2; j < filas - 2; j++) {
    if (!izq[j]) r.rect(x, y + j * P, P, P, T.base);
    if (!der[j]) r.rect(x + w - P, y + j * P, P, P, T.base);
  }
  // Las orillas, más sucias: una franja despareja de 1 a 3 puntos, y otra de puntos sueltos más adentro.
  for (let i = 1; i < cols - 1; i++) {
    r.rect(x + i * P, y + arriba[i] * P, P, (1 + Math.floor(az() * 3)) * P, T.sucio);
    const ab = (1 + Math.floor(az() * 3)) * P;
    r.rect(x + i * P, y + h - abajo[i] * P - ab, P, ab, T.sucio);
  }
  for (let j = 2; j < filas - 2; j++) {
    const a1 = (1 + Math.floor(az() * 3)) * P, a2 = (1 + Math.floor(az() * 3)) * P;
    r.rect(x + (izq[j] ? P : 0), y + j * P, a1, P, T.sucio);
    r.rect(x + w - (der[j] ? P : 0) - a2, y + j * P, a2, P, T.sucio);
  }
  const borde = Math.min(cols, filas) * 0.12;
  for (let n = 0; n < (cols + filas) * 3; n++) {
    const lado = Math.floor(az() * 4), d = 3 + Math.floor(az() * az() * borde);
    const i = lado < 2 ? 1 + Math.floor(az() * (cols - 2)) : lado === 2 ? d : cols - 1 - d;
    const j = lado >= 2 ? 2 + Math.floor(az() * (filas - 4)) : lado === 0 ? d : filas - 1 - d;
    r.rect(x + i * P, y + j * P, P, P, T.sucio);
  }
  // El grano: puntos sueltos más sucios y más claros por todo el papel.
  // (🔁 Menos que antes: con el doble parecía lija.)
  const granos = Math.min(1400, Math.round(cols * filas * 0.016));
  for (let n = 0; n < granos; n++) {
    const i = 2 + Math.floor(az() * (cols - 4)), j = 2 + Math.floor(az() * (filas - 4));
    r.rect(x + i * P, y + j * P, P, P, az() < 0.7 ? T.sucio : T.claro);
  }
  // Las manchas: un manchón más oscuro en el medio que se aclara hacia afuera, con el aro de donde se secó.
  for (let m = 0; m < manchas; m++) {
    // (🔁 Hacia una esquina y más rala: en el medio caía arriba de las palabras y no se leían.)
    // (`soloAbajo`: en las hojas con título arriba —la libreta, el reparto— la de arriba tapaba el título.)
    const R = (5 + az() * 8) / P, esq = soloAbajo ? 2 + Math.floor(az() * 2) : Math.floor(az() * 4);
    const ci = esq % 2 ? cols - 4 - az() * cols * 0.18 : 4 + az() * cols * 0.18;
    const cj = esq < 2 ? 4 + az() * filas * 0.15 : filas - 4 - az() * filas * 0.2;
    for (let n = 0; n < R * R * 1.4; n++) {
      const an = az() * Math.PI * 2, rr = R * Math.sqrt(az());
      const i = Math.round(ci + Math.cos(an) * rr), j = Math.round(cj + Math.sin(an) * rr * 0.75);
      if (i < 2 || j < 2 || i >= cols - 2 || j >= filas - 2) continue;
      if (az() < 0.5 - (rr / R) * 0.35) r.rect(x + i * P, y + j * P, P, P, T.mancha);
    }
    // (El aro, cortado y desparejo: 🔁 entero parecía un círculo dibujado.)
    for (let n = 0; n < R * 2.5; n++) {
      const an = az() * Math.PI * 1.4, rr = R * (0.85 + az() * 0.25);
      const i = Math.round(ci + Math.cos(an) * rr), j = Math.round(cj + Math.sin(an) * rr * 0.75);
      if (i < 2 || j < 2 || i >= cols - 2 || j >= filas - 2) continue;
      r.rect(x + i * P, y + j * P, P, P, T.aro);
    }
  }
  // Los dobleces: de lado a lado, con cortes donde el pliegue se gastó.
  for (let d = 1; d <= dobleces; d++) {
    const j = Math.round((filas * d) / (dobleces + 1));
    for (let i = 1; i < cols - 1; i++) {
      if (az() < 0.08) continue;
      r.rect(x + i * P, y + j * P, P, P, T.sucio);
      if (az() < 0.85) r.rect(x + i * P, y + (j + 1) * P, P, P, T.claro);
    }
  }
}

// ------------------------------------------------------------------ la tinta

/**
 * 🖋️ CUÁNDO SE MOJÓ LA PLUMA, para un texto ya partido en renglones: las letras (contadas como `hastaLetras`, sin los
 * saltos de renglón) donde se volvió a mojar —siempre al empezar una palabra— y si ahí cayó una gotita. Se arma una vez
 * por papel.
 */
function mojadas(renglones, pluma, semilla) {
  const out = [{ en: 0, gota: false }];
  if (!pluma.cada) return out;
  const az = azarDe(semilla ^ 0x9e3779b9);
  const [min, max] = pluma.cada;
  let falta = min + az() * (max - min), i = 0;
  for (const t of renglones) {
    for (let k = 0; k < t.length; k++, i++) {
      const empieza = k === 0 || t[k - 1] === ' ';
      if (i - out[out.length - 1].en >= falta && empieza && t[k] !== ' ') {
        out.push({ en: i, gota: az() < pluma.gota });
        falta = min + az() * (max - min);
      }
    }
  }
  return out;
}

/** El color de la tinta en la letra `i`: según cuánto se escribió desde la última vez que se mojó. */
function tintaEn(i, pluma, moj) {
  if (!pluma.cada) return pluma.fresca;
  let k = 0;
  while (k + 1 < moj.length && moj[k + 1].en <= i) k++;
  const desde = moj[k].en, hasta = k + 1 < moj.length ? moj[k + 1].en : desde + pluma.cada[1];
  const t = Math.min(1, (i - desde) / Math.max(1, hasta - desde));
  return mezclar(pluma.fresca, pluma.gastada, Math.pow(t, 0.85));
}

/**
 * 🖋️ ESCRIBE LOS RENGLONES CON ESA PLUMA, hasta `letras` letras: cada renglón en tramos (se corta donde se volvió a
 * mojar), cada tramo con su tinta del principio al final, y la gotita donde cayó.
 */
function escribir(r, renglones, letras, x, y, entre, tam, letra, pluma, moj) {
  let i = 0, quedan = letras;
  const fino = estiloNuevo.lienzoFino(r.ctx);
  renglones.forEach((t, n) => {
    if (quedan <= 0) return;
    const ver = Math.min(t.length, Math.max(0, quedan));
    const yy = y + n * entre;
    const cortes = [0, ...moj.filter((m) => m.en > i && m.en < i + ver).map((m) => m.en - i), ver];
    for (let c = 0; c + 1 < cortes.length; c++) {
      const a = cortes[c], b = cortes[c + 1];
      if (b <= a) continue;
      const xa = x + r.medir(t.slice(0, a), tam, letra);
      const de = tintaEn(i + a, pluma, moj), a2 = tintaEn(i + b - 1, pluma, moj);
      r.text(t.slice(a, b), xa, yy, de, 'left', { ...sinHalo, tam, letra, tinta: [de, a2] });
      // 🔁 LA GOTITA, DE OTRA FORMA *(Santi: "poné la gotita de otra forma")*: antes era un punto suelto delante de la
      // palabra y se leía como un punto de más. Ahora la pluma recién mojada carga de más la primera letra (se repasa
      // corrida apenas, más gorda) y deja un manchón chato encima de su pie, pegado a la letra.
      const m = moj.find((q) => q.en === i + a && q.gota && q.en > 0);
      if (m) {
        const primera = t.slice(a, a + 1), an = r.medir(primera, tam, letra);
        for (const d of [-0.18, 0.18]) r.text(primera, xa + d, yy, pluma.fresca, 'left', { ...sinHalo, tam, letra });
        fino.save();
        fino.fillStyle = pluma.fresca;
        fino.globalAlpha = 0.8;
        fino.beginPath();
        // (🔁 Más arriba, montado sobre el pie de la letra: abajo de todo parecía un subrayado suelto. Dos manchas
        // encimadas para que no salga un óvalo perfecto.)
        fino.ellipse(xa + an * 0.5, yy + tam * 0.17, Math.max(0.5, an * 0.28), tam * 0.07, -0.2, 0, Math.PI * 2);
        fino.fill();
        fino.beginPath();
        fino.ellipse(xa + an * 0.72, yy + tam * 0.2, Math.max(0.3, an * 0.14), tam * 0.06, 0.4, 0, Math.PI * 2);
        fino.fill();
        fino.restore();
      }
    }
    i += t.length;
    quedan -= t.length;
  });
}

// ------------------------------------------------------------------ cada papel

/** El lacre rojo: un círculo de puntos con el borde más oscuro, lo que se escurrió al apretarlo y las iniciales. */
function lacre(r, cx, cy, semilla) {
  const az = azarDe(semilla ^ 0x51ed), R = 7;
  cx = Math.round(cx / P) * P; cy = Math.round(cy / P) * P;
  const rp = R / P;
  for (let j = -rp - 1; j <= rp + 1; j++) {
    for (let i = -rp - 1; i <= rp + 1; i++) {
      const d = Math.hypot(i, j) + (az() - 0.5) * 1.6;
      if (d > rp) continue;
      const col = d > rp - 1.2 ? LACRE_OSCURO : d < rp * 0.45 && az() < 0.35 ? LACRE_OSCURO : az() < 0.08 ? LACRE_BRILLO : LACRE;
      r.rect(cx + i * P, cy + j * P, P, P, col);
    }
  }
  // (Lo que se escurrió al apretar el sello, y el hundido del sello.)
  for (let n = 0; n < 4; n++) {
    const an = az() * Math.PI * 2, largo = 1 + Math.floor(az() * 3);
    for (let k = 0; k <= largo; k++) r.rect(cx + Math.round(Math.cos(an) * (rp + k)) * P, cy + Math.round(Math.sin(an) * (rp + k)) * P, P, P, k === largo ? LACRE_OSCURO : LACRE);
  }
  r.text('JM', cx, cy + 0.5, PALETA[39], 'center', { ...sinHalo, tam: 6, letra: LETRAS.titular });
  void LACRE_NEGRO;
}

/** Las respuestas, abajo del papel. */
function respuestas(r, opciones, sel, x, y, ancho, sombra = TONOS.carta.sucio) {
  if (!opciones) return 0;
  r.rect(x, y - 6, ancho, P, BORDE);
  opciones.forEach((o, i) => {
    const oy = y + 2 + i * 12, activa = i === sel;
    if (activa) r.rect(x - 4, oy - 5, ancho + 8, 11, sombra);
    r.text((activa ? '▸ ' : '  ') + o.texto, x, oy, activa ? SELLO : TINTA_SUAVE, 'left', { ...sinHalo, letra: LETRAS.imprenta, tam: 8 });
  });
  return opciones.length * 12 + 6;
}

const altoRespuestas = (opciones) => (opciones ? opciones.length * 12 + 10 : 0);

/**
 * ✉️ LA CARTA (y la nota): en el medio de la pantalla. `p`: `{ tipo: 'carta' | 'nota', texto, firma, pluma? }`;
 * `letras`: cuánto ya se escribió; `opciones` y `sel`: las respuestas (o null mientras se lee).
 */
function carta(r, p, letras, opciones, sel, ayuda) {
  const nota = p.tipo === 'nota';
  const w = Math.min(nota ? 220 : 260, r.width - 40), tam = nota ? 8 : 9;
  const ancho = w - 40;
  const pluma = plumaDe(p), semilla = semillaDe((p.firma || '') + p.texto);
  const letra = pluma.letra || LETRAS.mano, tamLetra = Math.round(tam * (pluma.escala || 1) * 2) / 2;
  // (Partido con el ancho de hoy: el primer cuadro, antes de que la pantalla tome su tamaño, sale otro.)
  // (✍️ Y con la letra que hay: si la de mano llegó después, se vuelve a partir.)
  if (!p._renglones || p._ancho !== ancho || p._letras !== letrasCargadas) {
    p._renglones = partirCon(r, p.texto, ancho, tamLetra, letra);
    p._ancho = ancho;
    p._letras = letrasCargadas;
    p._mojadas = mojadas(p._renglones, pluma, semilla);
  }
  const ren = p._renglones, entre = tamLetra + 3;
  // (🔁 Sin el hueco de abajo que sobraba debajo de las respuestas.)
  const h = 24 + ren.length * entre + (p.firma ? 18 : 0) + (opciones ? opciones.length * 12 + 14 : 16);
  const x = Math.round(r.width / 2 - w / 2), y = Math.max(8, Math.round(r.height / 2 - h / 2) - 6);
  papelCrudo(r, x, y, w, h, semilla, { tono: nota ? 'nota' : 'carta', manchas: nota ? 2 : 1, dobleces: nota ? 1 : 2 });
  // (La nota lleva el agujero del cuchillo que la clavó, con la rajadura.)
  if (nota) {
    const hx = Math.round((x + w / 2) / P) * P;
    r.rect(hx - P, y + 4 * P, 3 * P, 2 * P, SOMBRA);
    r.rect(hx, y + 6 * P, P, 2 * P, SOMBRA);
  }
  const tx = x + 20;
  escribir(r, ren, letras, tx, y + 24, entre, tamLetra, letra, pluma, p._mojadas);
  let yy = y + 24 + ren.length * entre;
  if (!nota) lacre(r, tx + 8, yy + 6, semilla);
  // (La firma, recién mojada la pluma.)
  if (p.firma && letras >= letrasDe(p)) r.text('— ' + p.firma, x + w - 20, yy + 6, pluma.fresca, 'right', { ...sinHalo, tam: tamLetra + 1, letra });
  yy += p.firma ? 18 : 0;
  respuestas(r, opciones, sel, tx, yy + 8, w - 40, nota ? TONOS.nota.sucio : TONOS.carta.sucio);
  if (!opciones) r.text(ayuda, x + w - 10, y + h - 8, TINTA_SUAVE, 'right', { ...sinHalo, tam: 7, letra: LETRAS.imprenta });
}

/**
 * 🗞️ EL DIARIO: el nombre arriba con sus rayas, la fecha, el titular grande y la nota. A los costados, columnas de
 * otras noticias que no se leen (rayitas de tinta), para que parezca una página y no un cartel. `p`: `{ tipo:
 * 'diario', diario, fecha, titular, texto }`. (Es de imprenta: un diario no se escribe a mano.)
 */
function diario(r, p, letras, opciones, sel, ayuda) {
  const w = Math.min(300, r.width - 30);
  // (🔁 `lado`: las rayitas terminan 18 antes del borde; con 30 se salían del marco del papel.)
  const col = Math.round(w * 0.62), lado = w - col - 44;
  if (!p._titular || p._ancho !== col) {
    p._titular = partirCon(r, p.titular, col, 13, LETRAS.titular);
    p._renglones = partirCon(r, p.texto, col, 8, LETRAS.imprenta);
    p._ancho = col;
  }
  const tit = p._titular, ren = p._renglones;
  const h = 46 + tit.length * 15 + 6 + ren.length * 11 + altoRespuestas(opciones) + 16;
  const x = Math.round(r.width / 2 - w / 2), y = Math.max(8, Math.round(r.height / 2 - h / 2) - 6);
  papelCrudo(r, x, y, w, h, semillaDe(p.titular), { tono: 'diario', manchas: 1, dobleces: 1 });
  // (La tinta de imprenta, gastada y despareja: un negro que no llega a negro.)
  const IMPRENTA = '#241a14', GRIS = '#5e4c3c';
  r.text(p.diario || 'EL ECO DE FUERTE RILEY', x + w / 2, y + 17, IMPRENTA, 'center', { ...sinHalo, tam: 12, letra: LETRAS.titular });
  r.rect(x + 10, y + 9, w - 20, P, TINTA);
  r.rect(x + 10, y + 25, w - 20, P, TINTA);
  r.rect(x + 10, y + 26.5, w - 20, P, TINTA);
  if (p.fecha) r.text(p.fecha, x + w / 2, y + 33, GRIS, 'center', { ...sinHalo, tam: 7, letra: LETRAS.imprenta });
  // El titular y la nota, en la columna grande.
  const cx = x + 14;
  let yy = y + 48;
  tit.forEach((t, i) => r.text(t, cx, yy + i * 15, IMPRENTA, 'left', { ...sinHalo, tam: 13, letra: LETRAS.titular }));
  yy += tit.length * 15 + 4;
  const resto = Math.max(0, letras - p.titular.length);
  hastaLetras(ren, resto).forEach((t, i) => r.text(t, cx, yy + i * 11, IMPRENTA, 'left', { ...sinHalo, tam: 8, letra: LETRAS.imprenta }));
  // Las otras columnas: rayitas de tinta gastada, de largo distinto (siempre las mismas: dependen de la fila).
  const lx = x + 14 + col + 12;
  r.rect(lx - 6, y + 42, P, h - 58 - altoRespuestas(opciones), BORDE);
  for (let fila = 0, ly = y + 46; ly < y + h - 20 - altoRespuestas(opciones); fila++, ly += 4.5) {
    if (fila % 9 === 0) { r.rect(lx, ly, lado - 4, 2 * P, TINTA_SUAVE); continue; }
    r.rect(lx, ly, Math.max(8, lado - ((fila * 17) % 14)), P, fila % 3 ? BORDE : TINTA_SUAVE);
  }
  respuestas(r, opciones, sel, cx, y + h - altoRespuestas(opciones) - 2, w - 28, TONOS.diario.sucio);
  if (!opciones) r.text(ayuda, x + w - 10, y + h - 8, TINTA_SUAVE, 'right', { ...sinHalo, tam: 7, letra: LETRAS.imprenta });
}

/**
 * 🤠 EL CARTEL DE "SE BUSCA": la cara del buscado en su recuadro, el nombre, por qué y cuánto pagan. `p`: `{ tipo:
 * 'cartel', quien, nombre, por, recompensa }` (`quien`: de quién es la cara, si es de la banda).
 */
function cartel(r, p, caras, opciones, sel, ayuda) {
  const w = 170, x = Math.round(r.width / 2 - w / 2);
  if (!p._por) p._por = partirCon(r, p.por || '', w - 30, 8, LETRAS.imprenta);
  const hCara = 64;
  const h = 36 + hCara + 22 + p._por.length * 11 + (p.recompensa ? 22 : 0) + altoRespuestas(opciones) + 14;
  const y = Math.max(8, Math.round(r.height / 2 - h / 2) - 6);
  papelCrudo(r, x, y, w, h, semillaDe(p.nombre || ''), { tono: 'cartel', manchas: 2, dobleces: 0 });
  const IMPRENTA = '#241a14';
  // (Los clavos de las cuatro puntas, de cuando estaba en la pared.)
  for (const [cx, cy] of [[x + 5, y + 5], [x + w - 6, y + 5], [x + 5, y + h - 6], [x + w - 6, y + h - 6]]) r.rect(Math.round(cx / P) * P, Math.round(cy / P) * P, 2 * P, 2 * P, SOMBRA);
  r.text('SE BUSCA', x + w / 2, y + 21, IMPRENTA, 'center', { ...sinHalo, tam: 18, letra: LETRAS.titular });
  const dibujar = p.quien && caras[p.quien];
  const mx = x + w / 2 - hCara / 2, my = y + 34;
  if (dibujar) cara(r, dibujar, mx, my, hCara, hCara, 5, { apagar: 0.75 });
  else { r.rect(mx - 1, my - 1, hCara + 2, hCara + 2, BORDE); r.rect(mx, my, hCara, hCara, PAPEL_SUCIO); }
  let yy = my + hCara + 14;
  r.text(p.nombre, x + w / 2, yy, IMPRENTA, 'center', { ...sinHalo, tam: 11, letra: LETRAS.titular });
  yy += 14;
  p._por.forEach((t, i) => r.text(t, x + w / 2, yy + i * 11, '#4a382a', 'center', { ...sinHalo, tam: 8, letra: LETRAS.imprenta }));
  yy += p._por.length * 11 + 4;
  if (p.recompensa) { r.text(`RECOMPENSA $${p.recompensa}`, x + w / 2, yy + 6, IMPRENTA, 'center', { ...sinHalo, tam: 11, letra: LETRAS.titular }); yy += 22; }
  respuestas(r, opciones, sel, x + 16, yy + 8, w - 32, TONOS.cartel.sucio);
  if (!opciones) r.text(ayuda, x + w - 10, y + h - 8, TINTA_SUAVE, 'right', { ...sinHalo, tam: 7, letra: LETRAS.imprenta });
  void papel;
}

/** ¿Este paso es un papel de los de acá (y no un renglón de diálogo)? */
export const esPapel = (p) => ['carta', 'nota', 'diario', 'cartel'].includes(p.tipo);

/**
 * Dibuja el papel de un paso, sobre el campamento oscurecido: un papel se lee de cerca, y lo de atrás se apaga.
 */
export function dibujarPapel(r, p, { letras, opciones, sel, caras, ayuda }) {
  r.ctx.globalAlpha = 0.55;
  r.rect(0, 0, r.width, r.height, SOMBRA);
  r.ctx.globalAlpha = 1;
  if (p.tipo === 'diario') diario(r, p, letras, opciones, sel, ayuda);
  else if (p.tipo === 'cartel') cartel(r, p, caras || {}, opciones, sel, ayuda);
  else carta(r, p, letras, opciones, sel, ayuda);
}
