/**
 * LOS OBSTÁCULOS DEL DESIERTO: la roca, el arbusto, el cactus y el montículo.
 *
 * Vivían adentro del galope (scenes/rideScene.js); se mudaron acá cuando la
 * huida los necesitó también *(Santi: "que hayan obstáculos al igual que en el
 * galope previo")*. Un solo dibujo para las dos escenas: la piedra que te frena
 * en el galope es la misma que te frena huyendo.
 *
 * `radio` es la huella del choque (`APROXIMACION.obstaculoRadios`, data/horse.js):
 * la sombra del piso se dibuja con él, así que lo que ves es lo que te frena.
 */
export function dibujarObstaculoDesierto(r, ob, ox, radio) {
  if (ob.golpeado) {
    r.rect(ox - 5, ob.y - 2, 10, 3, '#3a2b20');
    return;
  }

  r.ctx.globalAlpha = 0.22;
  r.rect(ox - radio, ob.y + 2, radio * 2, 3, '#000');
  r.ctx.globalAlpha = 1;

  /**
   * EN TRES CUARTOS CADA UNO MUESTRA SU PARTE DE ARRIBA: la roca tiene su cara
   * de frente en sombra y la tapa con luz, el arbusto es una mata de copas
   * iluminadas arriba, y el cactus lleva la luz en el costado y en las puntas.
   * Las siluetas mantienen el ancho de siempre, que es lo que va con su radio.
   */
  if (ob.tipo === 'roca') {
    // La más grande y la única realmente sólida: 20 px de ancho.
    r.rect(ox - 10, ob.y - 4, 20, 8, '#4e453e');
    r.rect(ox - 9, ob.y - 10, 18, 6, '#6e6359');
    r.rect(ox - 7, ob.y - 12, 11, 2, '#6e6359');
    r.rect(ox - 6, ob.y - 11, 6, 1, '#8a7e70');
  } else if (ob.tipo === 'arbusto') {
    r.rect(ox - 9, ob.y - 3, 18, 6, '#33401f');
    r.rect(ox - 8, ob.y - 7, 8, 5, '#4d5c34');
    r.rect(ox - 1, ob.y - 9, 9, 6, '#4d5c34');
    r.rect(ox - 5, ob.y - 8, 3, 1, '#66773f');
    r.rect(ox + 2, ob.y - 9, 4, 1, '#66773f');
  } else if (ob.tipo === 'cactus') {
    // La silueta más ALTA del desierto (la que más se distingue de lejos),
    // pero de tronco angosto — por eso su radio no es el mayor.
    r.rect(ox - 3, ob.y - 16, 6, 21, '#3f6b3a');
    r.rect(ox - 3, ob.y - 16, 2, 21, '#4f8247');
    r.rect(ox - 2, ob.y - 18, 4, 2, '#5d9452');
    r.rect(ox - 7, ob.y - 9, 4, 3, '#3f6b3a');
    r.rect(ox - 8, ob.y - 13, 3, 5, '#3f6b3a');
    r.rect(ox - 8, ob.y - 14, 3, 1, '#5d9452');
    r.rect(ox + 3, ob.y - 5, 4, 3, '#3f6b3a');
    r.rect(ox + 6, ob.y - 10, 3, 6, '#3f6b3a');
    r.rect(ox + 6, ob.y - 11, 3, 1, '#5d9452');
  } else {
    /**
     * Montículo de arena: bajo y chato, el más perdonador de los cuatro.
     *
     * 🐛 SUS TONOS ERAN CASI EL DEL SUELO NUEVO (#8a7350 contra #8a6f47) y
     * sobre la arena de día **desaparecía**: quedaba un obstáculo que te
     * frena y no se ve, que es lo único que este juego no se permite.
     *
     * Se arregla con RELIEVE en vez de con un color: una falda en sombra
     * abajo y una cresta iluminada arriba. Así no depende de contrastar
     * contra un fondo en particular — la sombra es más oscura que la arena y
     * más clara que la noche, y la cresta al revés, así que el montículo se
     * lee con las dos paletas sin necesidad de una versión por hora.
     */
    r.rect(ox - 6, ob.y - 1, 12, 4, '#6b5334');
    r.rect(ox - 5, ob.y - 3, 10, 3, '#a68a5c');
    r.rect(ox - 3, ob.y - 5, 6, 3, '#c4a878');
  }
}
