/**
 * UNA GRILLA DONDE ACOMODAR COSAS DE DISTINTA FORMA.
 *
 * Vive en `engine/` porque no sabe nada de western ni de trenes: recibe un
 * ancho, un alto y rectángulos, y dice dónde entra cada uno. Lo usa la mochila
 * del jugador (`CONFIG.mochila`), y podría usarlo cualquier otra cosa.
 *
 * LO QUE LA HACE DISTINTA DE CONTAR CASILLAS: con un número alcanza con que
 * sobre lugar. Con formas **tiene que sobrar lugar de la forma correcta**. En
 * una grilla de 4×4, tres atados de 3×1 y un cajón de 2×2 suman 13 de 16 y NO
 * entran juntos — porque los atados acostados dejan tres columnas sueltas de
 * una casilla cada una, y el cajón necesita un cuadrado. Ese "no entra aunque
 * sobre" es todo el juego.
 *
 * ACOMODA SOLA, Y ES A PROPÓSITO. El jugador no arrastra nada: agarra un cajón
 * y el cajón se guarda donde quepa. Hacerlo a mano sería un minijuego de
 * inventario en el medio de un vagón con guardias, y este juego cobra en
 * tiempo y exposición, no en administración.
 *
 * PRIMERO EL HUECO MÁS ARRIBA Y MÁS A LA IZQUIERDA (`first fit`), probando la
 * forma como viene y después acostada. Es el orden que un tipo apurado usaría:
 * lo pone donde entre, no donde quede mejor.
 */

export function crearGrilla(cols, filas) {
  return { cols, filas, entradas: [] };
}

/** ¿Se pisan estos dos rectángulos? */
function pisa(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** ¿Cabe un rectángulo de `w`×`h` en (x, y), sin salirse ni pisar nada? */
function cabeEn(g, x, y, w, h) {
  if (x < 0 || y < 0 || x + w > g.cols || y + h > g.filas) return false;
  const candidato = { x, y, w, h };
  return !g.entradas.some((e) => pisa(candidato, e));
}

/**
 * BUSCA DÓNDE PONER ALGO DE ESTA FORMA. Devuelve `{ x, y, w, h }` o `null`.
 *
 * Prueba la forma como viene y, si no entra, ACOSTADA. Un atado de 3×1 que no
 * encuentra tres casillas en fila puede entrar parado en una columna — y eso es
 * exactamente lo que uno haría con un bulto largo y una mochila medio llena.
 *
 * No modifica nada: sólo dice dónde entraría. Es lo que permite preguntar
 * "¿me entra?" antes de empezar a abrir un botín, sin guardar nada todavía.
 */
export function buscarLugar(g, forma) {
  const [fw, fh] = forma;
  // La forma cuadrada no se prueba dos veces.
  const variantes = fw === fh ? [[fw, fh]] : [[fw, fh], [fh, fw]];
  for (const [w, h] of variantes) {
    for (let y = 0; y <= g.filas - h; y++) {
      for (let x = 0; x <= g.cols - w; x++) {
        if (cabeEn(g, x, y, w, h)) return { x, y, w, h };
      }
    }
  }
  return null;
}

/**
 * GUARDA algo en el primer lugar donde entre. Devuelve la entrada, o `null` si
 * no entró (y en ese caso no toca la grilla).
 *
 * `dato` es lo que quiera quien la use: la mochila guarda ahí el objeto o la
 * marca de un cartucho de dinamita.
 */
export function guardar(g, forma, dato) {
  const lugar = buscarLugar(g, forma);
  if (!lugar) return null;
  const entrada = { ...lugar, dato };
  g.entradas.push(entrada);
  return entrada;
}

/** Saca una entrada (la que devolvió `guardar`). */
export function sacar(g, entrada) {
  const i = g.entradas.indexOf(entrada);
  if (i >= 0) g.entradas.splice(i, 1);
  return i >= 0;
}

/** Saca la ÚLTIMA entrada cuyo dato cumpla la condición. */
export function sacarUltima(g, cumple) {
  for (let i = g.entradas.length - 1; i >= 0; i--) {
    if (cumple(g.entradas[i].dato)) {
      const [fuera] = g.entradas.splice(i, 1);
      return fuera;
    }
  }
  return null;
}

/** Cuántas casillas hay ocupadas. */
export function ocupadas(g) {
  return g.entradas.reduce((suma, e) => suma + e.w * e.h, 0);
}

/**
 * Vacía la grilla sin cambiar el objeto (mismo array, como en el resto del
 * juego). Todavía nadie la llama: el asalto arma una grilla nueva en cada
 * `enter`. Queda porque el día que la mochila sobreviva entre pantallas va a
 * hacer falta vaciarla sin perder la referencia.
 */
export function vaciar(g) {
  g.entradas.length = 0;
}
