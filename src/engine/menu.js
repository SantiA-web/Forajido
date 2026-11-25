/**
 * EL MENÚ DE OPCIONES — una pregunta con respuestas, abajo y angosto.
 *
 * Nació adentro de `scenes/interiorScene.js` para que el armero pudiera
 * PREGUNTARTE en vez de soltarte una frase, y se sacó acá cuando el campamento
 * necesitó lo mismo para elegir con qué salís (`cajón` y `poste`).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POR QUÉ ES UN MÓDULO Y NO UNA ESCENA: no interrumpe lo que estás haciendo,
 * se apoya encima. Va abajo y ocupa poco para que **se siga viendo el mundo por
 * detrás** — seguís parado adentro de la armería, o al lado de tu fogata,
 * mientras elegís. Una pantalla aparte convertiría "revolver el cajón" en un
 * trámite de inventario, que es exactamente lo que este juego no quiere ser.
 *
 * MIENTRAS ESTÁ ABIERTO NO TE MOVÉS, y tampoco es una traba técnica: tenés las
 * dos manos ocupadas. Se corta con [ESC] o eligiendo la opción de salida, que
 * existe para que decir que no sea una respuesta y no un botón de cerrar.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * NO SABE QUÉ SIGNIFICAN LAS OPCIONES. Recibe una lista de `{ id, texto }` y
 * devuelve cuál elegiste; qué hacer con eso es de quien lo abrió. Por eso el
 * mismo menú sirve para comprar un caballo, cambiar de revólver o darle de
 * comer al animal, sin saber nada de ninguna de las tres cosas.
 */

import { PALETA } from './paleta.js';
import { CONFIG } from '../data/config.js';
import { estiloNuevo } from './estiloNuevo.js';
import { esPapel, dibujarPapel, letrasDe, hastaLetras, papelCrudo, semillaDe } from './papeles.js';

/**
 * 🎭 LAS ESCENAS, DE A UNO *(Santi, 2026-11-23: "la historia es muy buena, pero no la estamos mostrando como se
 * merece"; eligió mi recomendación A)*: en vez de un párrafo entero de golpe, la escena va **paso por paso**: cada uno
 * dice lo suyo con su cara y su nombre, las letras salen de a poco y se pasa con [E]; las respuestas, recién al final.
 * Los papeles (la carta, el diario, el cartel) se ven grandes, en el medio: engine/papeles.js.
 * `LETRAS_POR_CUADRO`: lo rápido que se escribe (a 60 cuadros por segundo, unas 90 letras por segundo).
 */
const LETRAS_POR_CUADRO = 1.5;

/**
 * 📜 EL DIÁLOGO EN PAPEL DE ÉPOCA *(Santi, 2026-11-14: "quiero cambiarle totalmente la interfaz del dialogo"; eligió
 * "la caja ancha con figura pero con papel de época", y en todos lados)*: un papel viejo a lo ancho de la pantalla,
 * abajo, con la figura del que habla agrandada en un recuadro a la izquierda (o las dos, si hablan dos), su nombre en
 * tinta roja de sello, lo que dice en tinta sepia y las respuestas debajo. Los colores son los del mapa de rutas
 * (world/estiloNuevo/mapaViejo.js): el mismo papel y la misma tinta.
 */
const PAPEL = PALETA[37], PAPEL_SUCIO = PALETA[36], PAPEL_CLARO = PALETA[38], BORDE = PALETA[34];
const TINTA = PALETA[32], TINTA_SUAVE = PALETA[34], SELLO = PALETA[8], SOMBRA = PALETA[0];
/**
 * 🔁 Del que habla se ve SÓLO LA CARA, agrandada *(Santi: "la persona que habla debería verse solo su rostro agrandado,
 * no todo el cuerpo")*: se lo dibuja entero ×4 y el recuadro corta todo lo que no sea la cabeza con el sombrero y el
 * arranque de los hombros. `ALTO_PERSONA`: de los pies a la copa del sombrero, en unidades del mundo.
 */
const ESCALA_FIGURA = 4, MARCO = { w: 44, h: 44 }, ALTO_PERSONA = 22;

/**
 * 🎬 LA FRANJA DE CINE (ver `franja`): el margen a los costados, el tamaño de la letra y lo que hay entre renglones; los
 * escalones de arriba (cuánto más arriba, alto de cada uno y cuán oscuro) y el negro de la franja. Los colores de las
 * letras van en la capa fina, que no pasa por la paleta.
 */
const FRANJA = { margen: 16, tam: 9, entre: 12, fundido: 12 };
/** (El orden en que se prenden los puntos de un cuadrado de 4×4 al tramar.) */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/**
 * 🎬 Lo más que entra en una franja: si lo que se dice o se cuenta es más largo, se parte en varias (por párrafos y, si
 * hace falta, por oraciones). 🔁 Con la página entera del prólogo la franja tapaba medio campamento.
 */
const LETRAS_POR_FRANJA = 260;

/** 🎬 Dónde cae el renglón `n` (o el alto de los `n` primeros): los renglones en blanco entre párrafos, a media altura. */
function altoDe(n, renglones) {
  let y = 0;
  for (let i = 0; i < n; i++) y += renglones[i] ? FRANJA.entre : FRANJA.entre / 2;
  return y;
}

/** 🎬 Parte los pasos de texto largos en varios del mismo tipo y del mismo que habla (los papeles no se tocan). */
function trocear(pasos) {
  const out = [];
  for (const p of pasos) {
    if ((p.tipo !== 'dice' && p.tipo !== 'narra') || !p.texto || p.texto.length <= LETRAS_POR_FRANJA) { out.push(p); continue; }
    const trozos = [];
    for (const parrafo of p.texto.split(/\n\s*\n/)) {
      const oraciones = parrafo.match(/[^.!?…]+[.!?…]+["»”)]*\s*|[^.!?…]+$/g) || [parrafo];
      let actual = '';
      for (const o of oraciones) {
        if (actual && (actual + o).length > LETRAS_POR_FRANJA) { trozos.push(actual.trim()); actual = ''; }
        actual += o;
      }
      if (actual.trim()) trozos.push(actual.trim());
    }
    // (Párrafos cortos seguidos van juntos, con su línea en blanco, mientras entren.)
    const juntos = [];
    for (const t of trozos) {
      const ult = juntos[juntos.length - 1];
      if (ult && (ult + '\n\n' + t).length <= LETRAS_POR_FRANJA) juntos[juntos.length - 1] = ult + '\n\n' + t; else juntos.push(t);
    }
    juntos.forEach((t) => out.push({ ...p, texto: t }));
  }
  return out;
}

const LETRA_FRANJA = { fuente: 'Georgia, "Times New Roman", serif', estilo: '' };
const NOMBRE = '#a3402a', DICHO = '#ddd0b4', NARRADO = '#a3967c', OPCION = '#8a7d66', OPCION_ELEGIDA = '#eee2c6', AYUDA = '#6c6050';

/**
 * 📜 LA CARA DE ALGUIEN EN SU RECUADRO (el diálogo y la ficha de la banda): un recuadro de papel más sucio, como un
 * grabado pegado, con la persona dibujada entera agrandada ×`escala` y cortada para que se vea sólo la cabeza.
 * `dibujar(r, x, pies)` dibuja a la persona parada en `x, pies`.
 */
export function cara(r, dibujar, mx, my, w = MARCO.w, h = MARCO.h, escala = ESCALA_FIGURA, estilo = {}) {
  r.rect(mx - 1, my - 1, w + 2, h + 2, estilo.borde || BORDE);
  // (🔁 `dibujar.fondo`: `[cielo, piso]` de la parte del día, si el que dibuja lo trae y `estilo.cielo`: el que habla en la franja, parado afuera. El cartel de se busca, no.)
  const fondo = estilo.cielo && dibujar && dibujar.fondo;
  if (fondo) {
    const horizonte = Math.round(h * 0.6);
    r.rect(mx, my, w, horizonte, PALETA[fondo[0]]);
    r.rect(mx, my + horizonte, w, h - horizonte, PALETA[fondo[1]]);
  } else r.rect(mx, my, w, h, estilo.fondo || PAPEL_SUCIO);
  const ctx = r.ctx;
  ctx.save();
  ctx.beginPath();
  ctx.rect(mx, my, w, h);
  ctx.clip();
  // (Los pies quedan muy abajo, fuera del recuadro: arriba entra la copa del sombrero con un poco de aire.)
  const px = mx + w / 2, pies = my + 3 + ALTO_PERSONA * escala;
  ctx.translate(px, pies);
  ctx.scale(escala, escala);
  try { dibujar(r, 0, 0); } finally { ctx.restore(); }
  // 🐛 El contorno de la gente va en otra capa que el recuadro no corta: sin esto, el cuerpo agrandado se veía en
  // líneas por debajo y a los costados del recuadro.
  const ancho = 16 * escala, alto = ALTO_PERSONA * escala;
  estiloNuevo.borrarGente(ctx, mx - ancho, my + h, w + 2 * ancho, alto, true);
  estiloNuevo.borrarGente(ctx, mx - ancho, my - 4, ancho, h + 4, true);
  estiloNuevo.borrarGente(ctx, mx + w, my - 4, ancho, h + 4, true);
  // 🔁 (`estilo.apagar`: la cara gastada, media desteñida, como un retrato viejo *(Santi: "más crudos, duros y
  // reales")*. Le saca color y la oscurece un poco hacia el sepia.)
  if (estilo.apagar) {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = estilo.apagar;
    ctx.fillStyle = '#808080';
    ctx.fillRect(mx, my, w, h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#b89a78';
    ctx.fillRect(mx, my, w, h);
    ctx.restore();
  }
}

/** Las tintas del papel, para lo que se escribe encima fuera de este archivo (la ficha). */
export const TINTAS = { PAPEL, PAPEL_SUCIO, PAPEL_CLARO, BORDE, TINTA, TINTA_SUAVE, SELLO, SOMBRA };

/**
 * 📜 EL PAPEL: su sombra, el papel con manchas de lo gastado, el borde comido en las puntas y una línea de tinta
 * adentro, como un formulario impreso. Las manchas salen siempre en el mismo lugar (no titilan): dependen de la
 * posición, no del azar.
 */
export function papel(r, x, y, w, h) {
  // 🔁 PAPEL CRUDO *(Santi, 2026-11-23: "los rectángulos y carteles se ven muy infantil. Deberían verse más crudos,
  // duros y reales")*: la libreta, el reparto y el calendario, en el mismo papel roto y manoseado que las cartas
  // (engine/papeles.js). El de antes queda abajo, sin usar, por si hay que volver.
  papelCrudo(r, x, y, w, h, semillaDe(`${Math.round(w)}x${Math.round(h)}`), { tono: 'carta', manchas: 1, soloAbajo: true });
}

/** (🔁 El papel de antes: rectángulo con marco impreso. Sin usar desde el papel crudo.) */
export function papelViejo(r, x, y, w, h) {
  const ctx = r.ctx;
  // 🐛 El contorno de la gente se pinta al final de todo: sin borrarlo acá, la gente que queda detrás del papel
  // se veía en líneas por encima. (La figura del recuadro se dibuja después, así que ella sí lleva el suyo.)
  estiloNuevo.borrarGente(ctx, x, y, w + 2, h + 2, true);
  ctx.globalAlpha = 0.45;
  r.rect(x + 2, y + 2, w, h, SOMBRA);
  ctx.globalAlpha = 1;
  r.rect(x, y, w, h, PAPEL);
  // Lo gastado: manchitas más sucias y más claras. 🔁 Antes iban por todo el papel y, cuando caían sobre las letras,
  // parecían tachaduras o basura en el texto: ahora van sólo en el margen, entre el borde y la línea impresa, que es
  // donde un papel de verdad se gasta (de agarrarlo).
  for (let i = 0; i < 30; i++) {
    const lado = i % 4, t = ((i * 97 + 31) % 1000) / 1000;
    const mw = lado < 2 ? 2 + (i * 7) % 4 : 1, mh = lado < 2 ? 1 : 2 + (i * 7) % 4;
    const mx = lado < 2 ? x + 2 + Math.round(t * (w - 8)) : lado === 2 ? x + 1 + (i % 2) : x + w - 2 - (i % 2);
    const my = lado >= 2 ? y + 2 + Math.round(t * (h - 8)) : lado === 0 ? y + 1 + (i % 2) : y + h - 2 - (i % 2);
    r.rect(mx, my, mw, mh, i % 3 === 0 ? PAPEL_CLARO : PAPEL_SUCIO);
  }
  // El borde: más sucio, y las puntas comidas.
  r.rect(x, y, w, 1, PAPEL_SUCIO);
  r.rect(x, y + h - 1, w, 1, PAPEL_SUCIO);
  r.rect(x, y, 1, h, PAPEL_SUCIO);
  r.rect(x + w - 1, y, 1, h, PAPEL_SUCIO);
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    r.rect(sx > 0 ? cx : cx - 3, sy > 0 ? cy : cy - 1, 3, 1, SOMBRA);
    r.rect(sx > 0 ? cx : cx - 1, sy > 0 ? cy : cy - 2, 1, 2, SOMBRA);
  }
  // Unas muescas en los bordes largos, donde se rompió.
  for (let i = 1; i < 6; i++) {
    const nx = x + Math.round((w * i) / 6) + ((i * 13) % 9) - 4;
    r.rect(nx, i % 2 ? y : y + h - 1, 2 + (i % 2), 1, SOMBRA);
  }
  // La línea impresa de adentro.
  r.rect(x + 4, y + 3, w - 8, 1, BORDE);
  r.rect(x + 4, y + h - 4, w - 8, 1, BORDE);
  r.rect(x + 4, y + 3, 1, h - 6, BORDE);
  r.rect(x + w - 5, y + 3, 1, h - 6, BORDE);
}

export function crearMenu(audio) {
  let abierto = null;

  /**
   * @param titulo   la pregunta, arriba de todo ("¿Qué desea?")
   * @param opciones lista de `{ id, texto }`
   * @param alElegir se llama con el `id` elegido. Si devuelve `true`, el menú
   *                 queda ABIERTO — sirve para las opciones que cambian algo y
   *                 te dejan seguir eligiendo (cambiar de arma y ver la
   *                 siguiente sin tener que volver a abrir el cajón).
   */
  /**
   * `cuerpo` (opcional): un texto largo entre la pregunta y las respuestas, que se parte en renglones y hace el menú
   * más ancho. Lo usan los momentos del campamento (data/momentos.js).
   */
  /**
   * `extra.figuras` (opcional): quién habla, como funciones `(r, x, pies) => …` que dibujan a cada uno parado en
   * `x, pies` (el menú lo agranda y lo pone en su recuadro). Sin figuras, el papel va sin recuadro.
   */
  function abrir(titulo, opciones, alElegir, cuerpo = null, extra = {}) {
    if (!opciones || opciones.length === 0) return false;
    // (`extra.sel`: con qué opción marcada abre; el almacén vuelve a abrir en la que elegiste.)
    abierto = { titulo, opciones, sel: Math.max(0, Math.min(opciones.length - 1, extra.sel || 0)), alElegir, cuerpo, renglones: null, figuras: extra.figuras || [] };
    audio.play('cover');
    return true;
  }

  /**
   * 🎭 UNA ESCENA PASO POR PASO. `pasos`: `{ tipo: 'dice', quien, nombre, texto }` (uno que habla: con su cara si es de
   * la banda), `{ tipo: 'narra', texto }` (lo que pasa, sin nadie), o un papel (`carta`, `nota`, `diario`, `cartel`:
   * engine/papeles.js). Las `opciones` aparecen en el último paso, cuando terminó de escribirse. `extra.caras`: `{ id:
   * dibujar }` de los que pueden hablar.
   */
  function escena(pasos, opciones, alElegir, extra = {}) {
    if (!pasos || !pasos.length || !opciones || !opciones.length) return false;
    pasos = trocear(pasos);
    abierto = { modo: 'escena', titulo: extra.titulo || '', pasos, i: 0, letras: 0, opciones, sel: 0, alElegir, caras: extra.caras || {}, renglones: null, figuras: [] };
    audio.play('cover');
    return true;
  }

  /** (Lo de la escena abierta: el paso de ahora, si terminó de escribirse y si es el último.) */
  function pasoDeAhora() {
    const p = abierto.pasos[abierto.i];
    return { p, listo: abierto.letras >= letrasDe(p), ultimo: abierto.i === abierto.pasos.length - 1 };
  }

  function cerrar() {
    abierto = null;
    audio.play('cover');
  }

  /** ¿Hay un menú abierto? Quien lo abrió lo usa para congelar su escena. */
  function activo() { return !!abierto; }

  /** 🧪 Lo que dice el papel abierto (para las pruebas): el título, el cuerpo y las opciones. */
  function leer() {
    // (🧪 `ids`: para elegir por id en las pruebas.)
    // (🎭 De una escena, el cuerpo son todos sus pasos juntos, y `pasos` los tipos: para las pruebas.)
    const cuerpo = abierto && abierto.modo === 'escena' ? abierto.pasos.map((p) => [p.nombre, p.titular, p.texto, p.por].filter(Boolean).join(': ')).join('\n\n') : abierto && abierto.cuerpo;
    return abierto ? { titulo: abierto.titulo, cuerpo, opciones: abierto.opciones.map((o) => o.texto), ids: abierto.opciones.map((o) => o.id), pasos: abierto.modo === 'escena' ? abierto.pasos.map((p) => p.tipo) : null } : null;
  }

  /** 🧪 Elegir una opción por su id, como si la hubieras apretado (para las pruebas). */
  function elegirOpcion(id) {
    if (!abierto) return;
    const antes = abierto, seguir = abierto.alElegir(id);
    if (!seguir && abierto === antes) abierto = null;
  }

  /**
   * Devuelve `true` si el menú consumió el input de este cuadro. La escena que
   * lo hospeda tiene que cortar ahí y no procesar su propio movimiento.
   */
  function update(input) {
    if (!abierto) return false;

    // 🎭 La escena: las letras salen de a poco; [E] las termina de escribir, y con todo escrito pasa al que sigue. Las
    // respuestas, recién en el último. [ESC] salta al último paso, y en el último cierra como siempre (vuelve después).
    if (abierto.modo === 'escena') {
      const { p, listo, ultimo } = pasoDeAhora();
      if (!listo) abierto.letras += LETRAS_POR_CUADRO;
      const ok = input.wasPressed('KeyE') || input.wasPressed('Enter') || input.wasPressed('Space');
      if (input.wasPressed('Escape')) {
        if (listo && ultimo) cerrar();
        else { abierto.i = abierto.pasos.length - 1; abierto.letras = 1e9; abierto.renglones = null; }
        return true;
      }
      if (!listo || !ultimo) {
        if (ok && !listo) abierto.letras = letrasDe(p);
        else if (ok) { abierto.i++; abierto.letras = 0; abierto.renglones = null; audio.play('cock'); }
        return true;
      }
    }

    const n = abierto.opciones.length;
    if (input.wasPressed('KeyW') || input.wasPressed('ArrowUp')) {
      abierto.sel = (abierto.sel - 1 + n) % n;
      audio.play('cock');
    }
    if (input.wasPressed('KeyS') || input.wasPressed('ArrowDown')) {
      abierto.sel = (abierto.sel + 1) % n;
      audio.play('cock');
    }
    if (input.wasPressed('KeyE') || input.wasPressed('Enter')) {
      const op = abierto.opciones[abierto.sel];
      const antes = abierto, seguir = abierto.alElegir(op.id);
      // Si la acción pide seguir abierta, se refresca la lista por si los
      // textos cambiaron (el arma equipada ahora es otra).
      // 🔁 (Y si la acción abrió otro papel, ése queda: al esperar días en la carpa, un aviso largo —"no alcanzó para
      // la olla"— abría su papel y éste lo cerraba enseguida, sin que se leyera.)
      if (!seguir && abierto === antes) abierto = null;
    }
    if (input.wasPressed('Escape')) cerrar();
    return true;
  }

  /** Cambia las opciones sin cerrar — para refrescar los textos tras elegir. */
  function refrescar(opciones) {
    if (!abierto) return;
    abierto.opciones = opciones;
    abierto.sel = Math.min(abierto.sel, opciones.length - 1);
  }

  function render(r, colors, ayuda) {
    if (!abierto) return;
    if (abierto.modo === 'escena') { renderEscena(r, ayuda); return; }

    // 🎬 (La misma franja que las escenas: el título arriba, el cuerpo entero, las respuestas.)
    const figuras = abierto.figuras;
    const anchoTexto = anchoDelTexto(r, figuras.length);
    // (Los renglones del cuerpo se arman una vez: se corta por palabras donde ya no entra.)
    if (abierto.cuerpo && (!abierto.renglones || abierto.renglonesAncho !== anchoTexto)) { abierto.renglones = partir(r, abierto.cuerpo, anchoTexto); abierto.renglonesAncho = anchoTexto; }
    const renglones = abierto.renglones || [];
    franja(r, { figuras, nombre: abierto.titulo, renglones, visibles: renglones, color: DICHO, opciones: abierto.opciones, sel: abierto.sel, ayuda });
  }

  /**
   * 🎭 UN PASO DE LA ESCENA: un papel grande en el medio, o abajo el papel del diálogo con la cara y el nombre del que
   * habla y lo que dice escribiéndose. El alto del papel se calcula con el texto entero, para que no crezca mientras se
   * escribe.
   */
  function renderEscena(r, ayuda) {
    const { p, listo, ultimo } = pasoDeAhora();
    const opciones = listo && ultimo ? abierto.opciones : null;
    const sigue = ultimo ? '[E] terminar de leer' : '[E] seguir';
    if (esPapel(p)) { dibujarPapel(r, p, { letras: abierto.letras, opciones, sel: abierto.sel, caras: abierto.caras, ayuda: sigue }); return; }
    const dibujar = p.tipo === 'dice' && abierto.caras[p.quien];
    const anchoTexto = anchoDelTexto(r, dibujar ? 1 : 0);
    // 🐛 (Los renglones se guardan con el ancho con que se partieron: el primer cuadro, antes de que la pantalla tome su
    // tamaño, los partía angostos y la página del prólogo salía en una columna finita.)
    if (!abierto.renglones || abierto.renglonesAncho !== anchoTexto) { abierto.renglones = partir(r, p.texto, anchoTexto); abierto.renglonesAncho = anchoTexto; }
    const renglones = abierto.renglones, nombre = p.tipo === 'dice' ? p.nombre : null;
    // (Lo que pasa, sin nadie que hable, más apagado: se distingue de lo que se dice.)
    franja(r, {
      figuras: dibujar ? [dibujar] : [], nombre, renglones, visibles: hastaLetras(renglones, abierto.letras),
      color: p.tipo === 'narra' ? NARRADO : DICHO, opciones, sel: abierto.sel, ayuda: opciones ? ayuda : sigue,
    });
  }

  /**
   * 🎬 EL FUNDIDO DE ARRIBA DE LA FRANJA: puntos negros de la grilla, cada vez más juntos hacia abajo (un tramado de
   * Bayer de 4×4, el de siempre en pixel art), de `y` a `y + alto`.
   */
  function tramado(r, y, alto) {
    const P = CONFIG.estilo.punto / 4, filas = Math.round(alto / P), cols = Math.ceil(r.width / P) + 1;
    const y0 = Math.round(y / P) * P;
    r.ctx.fillStyle = SOMBRA;
    for (let j = 0; j < filas; j++) {
      const cuanto = (j + 1) / (filas + 1);
      for (let i = 0; i < cols; i++) if (BAYER[(j % 4) * 4 + (i % 4)] / 16 < cuanto) r.rect(i * P, y0 + j * P, P, P, SOMBRA);
    }
  }

  /** 🎬 Lo que queda para el texto a lo ancho, con `n` caras a la izquierda. */
  function anchoDelTexto(r, n) {
    return r.width - 2 * FRANJA.margen - (n ? n * (MARCO.w + 6) + 10 : 0) - 12;
  }

  /**
   * 🎬 LA FRANJA DE CINE *(Santi, 2026-11-23: "los rectángulos y carteles se ven muy infantil. Deberían verse más
   * crudos, duros y reales"; eligió la B)*: abajo, una franja negra que se funde con la noche de arriba por escalones;
   * a la izquierda la cara del que habla, gastada y en marco negro; su nombre en mayúsculas, en rojo apagado; lo que
   * dice en letra clara con serifa, y las respuestas debajo. Sin marco ni papel: el papel queda para lo que se lee
   * (engine/papeles.js).
   */
  function franja(r, { figuras, nombre, renglones, visibles, color, opciones, sel, ayuda }) {
    const ctx = r.ctx, M = FRANJA.margen, E = FRANJA.entre;
    const anchoFiguras = figuras.length ? figuras.length * (MARCO.w + 6) + 10 : 0;
    const tx = M + anchoFiguras + 6, anchoTexto = anchoDelTexto(r, figuras.length);
    const arriba = nombre ? 22 : 10, alto = altoDe(renglones.length, renglones);
    const h = Math.max(arriba + alto + (opciones ? opciones.length * 12 + 10 : 12), figuras.length ? MARCO.h + 16 : 0);
    const by = r.height - 8 - h, top = by - 6;
    // (🐛 El contorno de la gente y los puntos finos se pintan al final: lo que la franja tapa, se borra.)
    estiloNuevo.borrarGente(ctx, 0, top, r.width, r.height - top, true);
    // 🔁 (Negra entera, y arriba un tramado de puntos que se va cerrando: con transparencia, la paleta dejaba ver un
    // fantasma del fuego en rojo a través de la franja.)
    r.rect(0, top, r.width, r.height - top, SOMBRA);
    tramado(r, top - FRANJA.fundido, FRANJA.fundido);
    figuras.forEach((dibujar, i) => cara(r, dibujar, M + i * (MARCO.w + 6), by + 6, MARCO.w, MARCO.h, ESCALA_FIGURA, { borde: SOMBRA, fondo: PALETA[32], cielo: true }));
    const L = { halo: false, letra: LETRA_FRANJA, tam: FRANJA.tam };
    if (nombre) r.text(nombre.toUpperCase(), tx, by + 10, NOMBRE, 'left', { ...L, tam: 7 });
    visibles.forEach((t, i) => r.text(t, tx, by + arriba + altoDe(i, renglones), color, 'left', L));
    (opciones || []).forEach((o, i) => {
      const oy = by + arriba + alto + 6 + i * 12, activa = i === sel;
      if (activa) r.rect(tx - 4, oy - 6, anchoTexto + 8, 12, PALETA[32]);
      r.text((activa ? '▸ ' : '   ') + o.texto, tx, oy, activa ? OPCION_ELEGIDA : OPCION, 'left', { ...L, tam: 8 });
    });
    r.text(ayuda, r.width - M, r.height - 7, AYUDA, 'right', { ...L, tam: 6 });
  }

  /** Parte un texto en renglones que entren en `ancho` (los saltos de línea del texto se respetan). */
  function partir(r, texto, ancho) {
    const out = [];
    for (const parrafo of texto.split('\n')) {
      let linea = '';
      for (const palabra of parrafo.split(' ')) {
        const prueba = linea ? linea + ' ' + palabra : palabra;
        if (linea && r.medir(prueba, FRANJA.tam, LETRA_FRANJA) > ancho) { out.push(linea); linea = palabra; } else linea = prueba;
      }
      out.push(linea);
    }
    return out;
  }

  return { abrir, escena, cerrar, activo, update, refrescar, render, leer, elegirOpcion };
}
