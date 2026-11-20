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
import { estiloNuevo } from './estiloNuevo.js';

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
 * 📜 LA CARA DE ALGUIEN EN SU RECUADRO (el diálogo y la ficha de la banda): un recuadro de papel más sucio, como un
 * grabado pegado, con la persona dibujada entera agrandada ×`escala` y cortada para que se vea sólo la cabeza.
 * `dibujar(r, x, pies)` dibuja a la persona parada en `x, pies`.
 */
export function cara(r, dibujar, mx, my, w = MARCO.w, h = MARCO.h, escala = ESCALA_FIGURA) {
  r.rect(mx - 1, my - 1, w + 2, h + 2, BORDE);
  r.rect(mx, my, w, h, PAPEL_SUCIO);
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
}

/** Las tintas del papel, para lo que se escribe encima fuera de este archivo (la ficha). */
export const TINTAS = { PAPEL, PAPEL_SUCIO, PAPEL_CLARO, BORDE, TINTA, TINTA_SUAVE, SELLO, SOMBRA };

/**
 * 📜 EL PAPEL: su sombra, el papel con manchas de lo gastado, el borde comido en las puntas y una línea de tinta
 * adentro, como un formulario impreso. Las manchas salen siempre en el mismo lugar (no titilan): dependen de la
 * posición, no del azar.
 */
export function papel(r, x, y, w, h) {
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

  function cerrar() {
    abierto = null;
    audio.play('cover');
  }

  /** ¿Hay un menú abierto? Quien lo abrió lo usa para congelar su escena. */
  function activo() { return !!abierto; }

  /** 🧪 Lo que dice el papel abierto (para las pruebas): el título, el cuerpo y las opciones. */
  function leer() {
    return abierto ? { titulo: abierto.titulo, cuerpo: abierto.cuerpo, opciones: abierto.opciones.map((o) => o.texto) } : null;
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

    const opciones = abierto.opciones, figuras = abierto.figuras;
    // A lo ancho de la pantalla, con un margen; las figuras ocupan su columna a la izquierda.
    const bx = 10, w = r.width - 20;
    const anchoFiguras = figuras.length ? figuras.length * (MARCO.w + 4) + 8 : 0;
    const tx = bx + 12 + anchoFiguras, anchoTexto = w - 24 - anchoFiguras;
    // (Los renglones del cuerpo se arman una vez: se corta por palabras donde ya no entra.)
    if (abierto.cuerpo && !abierto.renglones) abierto.renglones = partir(r, abierto.cuerpo, anchoTexto);
    const renglones = abierto.renglones || [];
    const alto = renglones.length ? renglones.length * 10 + 5 : 0;
    const h = Math.max(24 + alto + opciones.length * 12 + 6, figuras.length ? MARCO.h + 14 : 0);
    const by = r.height - 10 - h;

    papel(r, bx, by, w, h);

    // El que habla, agrandado, cada uno en su recuadro de papel más sucio (como un grabado pegado).
    figuras.forEach((dibujar, i) => cara(r, dibujar, bx + 10 + i * (MARCO.w + 4), by + 7));

    const sinHalo = { halo: null };
    r.text(abierto.titulo, tx, by + 11, renglones.length ? SELLO : TINTA, 'left', sinHalo);
    // Una raya de tinta debajo del nombre, como en un formulario viejo.
    if (renglones.length) r.rect(tx, by + 17, Math.min(anchoTexto, r.medir(abierto.titulo) + 6), 1, TINTA_SUAVE);
    renglones.forEach((t, i) => r.text(t, tx, by + 25 + i * 10, TINTA, 'left', sinHalo));

    opciones.forEach((o, i) => {
      const oy = by + 27 + alto + i * 12;
      const activa = i === abierto.sel;
      if (activa) r.rect(tx - 4, oy - 5, anchoTexto + 8, 11, PAPEL_SUCIO);
      r.text((activa ? '▸ ' : '  ') + o.texto, tx, oy, activa ? SELLO : TINTA_SUAVE, 'left', sinHalo);
    });

    r.text(ayuda, bx + w - 8, by + h - 7, TINTA_SUAVE, 'right', { tam: 7, halo: null });
  }

  /** Parte un texto en renglones que entren en `ancho` (los saltos de línea del texto se respetan). */
  function partir(r, texto, ancho) {
    const out = [];
    for (const parrafo of texto.split('\n')) {
      let linea = '';
      for (const palabra of parrafo.split(' ')) {
        const prueba = linea ? linea + ' ' + palabra : palabra;
        if (linea && r.medir(prueba) > ancho) { out.push(linea); linea = palabra; } else linea = prueba;
      }
      out.push(linea);
    }
    return out;
  }

  return { abrir, cerrar, activo, update, refrescar, render, leer, elegirOpcion };
}
