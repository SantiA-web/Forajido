/**
 * Búsqueda de camino sobre la grilla de tiles.
 *
 * ¿Por qué hace falta ahora y antes no? Porque antes un guardia y el jugador
 * estaban siempre en el mismo vagón, a menos de 40 tiles, y "caminar derecho
 * hacia él" alcanzaba. Ahora un guardia del vagón 4 tiene que llegar al vagón
 * 1: tiene que salir de su fila, encontrar el pasillo, cruzar dos enganches y
 * meterse por la puerta correcta. Caminar derecho contra eso es quedarse
 * trabado contra un asiento para siempre.
 *
 * Usamos una búsqueda en anchura (BFS): se van explorando los tiles vecinos en
 * círculos cada vez más grandes hasta encontrar el destino. Es simple, y como
 * todos los pasos cuestan lo mismo, el primer camino que encuentra es el más
 * corto. No hace falta nada más sofisticado.
 */

/**
 * Devuelve el camino de tiles entre dos puntos, o null si no hay.
 * El camino viene simplificado: solo los puntos donde hay que DOBLAR, porque
 * los tramos rectos el guardia los camina solo.
 *
 * @param map        el tilemap
 * @param from       { col, row } de partida
 * @param to         { col, row } de destino
 * @param maxNodos   tope de seguridad, para no barrer un mapa entero de gusto
 */
export function findPath(map, from, to, maxNodos = 4000) {
  if (from.col === to.col && from.row === to.row) return [];
  if (map.isSolidTile(to.col, to.row)) return null;

  const ancho = map.cols;
  const indice = (col, row) => row * ancho + col;

  // previo[i] guarda de qué tile venimos, para poder rehacer el camino al final.
  const previo = new Map();
  previo.set(indice(from.col, from.row), -1);

  // Cola circular simple: más rápida que hacer shift() sobre un array grande.
  const cola = [[from.col, from.row]];
  let cabeza = 0;
  let visitados = 0;

  while (cabeza < cola.length && visitados < maxNodos) {
    const [col, row] = cola[cabeza++];
    visitados++;

    if (col === to.col && row === to.row) {
      return simplificar(rehacer(previo, indice, ancho, from, to), map);
    }

    // Solo en cruz: nada de diagonales. Los guardias se mueven en ejes.
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc < 0 || nr < 0 || nc >= map.cols || nr >= map.rows) continue;

      const id = indice(nc, nr);
      if (previo.has(id)) continue;
      if (map.isSolidTile(nc, nr)) continue;

      previo.set(id, indice(col, row));
      cola.push([nc, nr]);
    }
  }

  return null;
}

/** Rehace el camino hacia atrás, desde el destino hasta el origen. */
function rehacer(previo, indice, ancho, from, to) {
  const camino = [];
  let actual = indice(to.col, to.row);
  const origen = indice(from.col, from.row);

  while (actual !== origen && actual !== -1 && actual !== undefined) {
    camino.push({ col: actual % ancho, row: Math.floor(actual / ancho) });
    actual = previo.get(actual);
  }
  camino.reverse();
  return camino;
}

/**
 * Deja solo los puntos donde el camino DOBLA.
 *
 * Un camino de 90 tiles en línea recta son 90 puntos que el guardia iría
 * tocando de a uno. Nos quedamos con las esquinas: entre esquina y esquina
 * camina derecho, que es lo que ya sabe hacer.
 */
function simplificar(camino, map) {
  if (camino.length <= 2) return camino.map((t) => map.tileCenter(t.col, t.row));

  const puntos = [];
  for (let i = 1; i < camino.length - 1; i++) {
    const antes = camino[i - 1];
    const ahora = camino[i];
    const luego = camino[i + 1];
    const dobla =
      (ahora.col - antes.col) !== (luego.col - ahora.col) ||
      (ahora.row - antes.row) !== (luego.row - ahora.row);
    if (dobla) puntos.push(ahora);
  }
  puntos.push(camino[camino.length - 1]);

  return puntos.map((t) => map.tileCenter(t.col, t.row));
}
