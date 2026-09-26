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

import { escalarColor } from './trenTresCuartos.js';

/** El revuelto de siempre: forma fija para cada lugar, sin guardar nada. */
function revolver(n) {
  let t = (n * 374761393 + 668265263) | 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177);
  return (t ^ (t >>> 16)) >>> 0;
}
export function dibujarObstaculoDesierto(r, ob, ox, radio, noche = false) {
  // De noche se apagan como todo lo demás (misma receta que el resto del arte).
  const c = (hex) => (noche ? escalarColor(hex, 0.4) : hex);
  if (ob.golpeado) {
    r.rect(ox - 5, ob.y - 2, 10, 3, c('#3a2b20'));
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
  if (ob.tipo === 'mojon') {
    /**
     * 🏔️ UN MOJÓN: una mesa de las grandes, con su meseta plana arriba.
     *
     * *(Es la parte B de arreglar el fondo. La A —las zonas de terreno— hizo
     * que el suelo fuera un lugar; ésta es la que te da algo QUE VER a lo
     * lejos. Y acá "lejos" es el borde de la pantalla, porque la cámara mira
     * casi desde arriba: por eso el mojón no está pintado en un fondo sino
     * PLANTADO EN EL MUNDO — crece cuando te acercás y le podés pasar al lado,
     * que es lo que el horizonte pintado no podía hacer.)*
     *
     * Saca toda su forma de dónde está plantado, igual que las agujas: no
     * guarda nada y nunca titila.
     */
    const s = revolver(Math.round(ob.x) * 31337 + Math.round(ob.y) * 6271);
    const w = radio;                       // el ancho ES su radio de choque
    const alto = 34 + (s % 26);
    const corona = Math.round(w * (0.62 + ((s >>> 3) % 4) / 20));
    const cuello = Math.round((w + corona) / 2);
    const tonos = ['#7b5442', '#8a6049', '#6d4a3a'];
    const base = tonos[s % tonos.length];

    // La sombra, larga y ancha: es la que dice "esto es grande".
    r.ctx.globalAlpha = 0.3;
    r.rect(ox - w - 2, ob.y - 1, w * 2 + 4, 5, '#000');
    r.ctx.globalAlpha = 1;

    /**
     * El cuerpo en tres escalones que se angostan hacia arriba, cada uno con
     * su repisa iluminada: eso es lo que lo lee como roca estratificada y no
     * como un cajón. Los escalones NO son parejos — el de abajo es el más alto.
     */
    /**
     * ⚠️ CADA ESCALÓN SE CORRE PARA SU LADO. Sin esto los tres salen centrados
     * y el mojón es una torta de bodas: tres rectángulos perfectos, uno arriba
     * del otro. Es el mismo error que tuvo la quebrada cuando parecía un muro
     * de castillo — lo que lo vuelve roca es que las líneas NO estén alineadas.
     */
    const t1 = Math.round(alto * (0.40 + ((s >>> 6) % 4) / 40));
    const t2 = Math.round(alto * (0.74 + ((s >>> 9) % 3) / 40));
    const co1 = ((s >>> 12) % 5) - 2;
    const co2 = ((s >>> 15) % 7) - 3;
    r.rect(ox - w, ob.y - t1, w * 2, t1 + 3, c(base));
    r.rect(ox - cuello + co1, ob.y - t2, cuello * 2, t2 - t1 + 1, c(base));
    r.rect(ox - corona + co2, ob.y - alto, corona * 2, alto - t2 + 1, c(base));
    r.rect(ox - w, ob.y - t1, w * 2, 1, c('#9a7358'));
    r.rect(ox - cuello + co1, ob.y - t2, cuello * 2, 1, c('#9a7358'));

    /** La meseta: la tapa plana con luz, que es la firma de una mesa. */
    r.rect(ox - corona + co2, ob.y - alto - 2, corona * 2, 3, c('#a8815f'));
    r.rect(ox - corona + co2 + 1, ob.y - alto - 2, corona * 2 - 2, 1, c('#c49b74'));

    /**
     * Y el pie no termina en una raya: tres muescas de talud lo rompen. Una
     * mesa apoyada en una línea recta se lee pegada al fondo, no plantada.
     */
    for (let k = 0; k < 3; k++) {
      const q = revolver(s + k * 104729);
      const mx = ox - w + (q % Math.max(1, w * 2 - 6));
      r.rect(mx, ob.y + 1, 4 + (q % 5), 2, c(base));
    }

    // Las chorreaduras verticales y la cara en sombra de un lado.
    for (let k = 0; k < 4; k++) {
      const dx = -corona + 2 + ((s >>> (k * 3)) % Math.max(1, corona * 2 - 3));
      r.rect(ox + dx, ob.y - alto + 2, 1, Math.round(alto * (0.4 + (k % 3) * 0.2)), c('#5a3b2e'));
    }
    r.rect(ox + w - 3, ob.y - t1, 3, t1 + 2, c('#5a3b2e'));

    // Pedregullo al pie, desparramado a los dos lados.
    for (let k = 0; k < 5; k++) {
      const q = revolver(s + k * 7919);
      r.rect(ox - w - 3 + (q % (w * 2 + 6)), ob.y + 1 + (q % 3), 2 + (q % 3), 2, c('#66483a'));
    }
    return;
  }

  if (ob.tipo === 'aguja') {
    /**
     * 🗿 UNA AGUJA DEL BOSQUE DE PIEDRAS: alta, angosta y de base más ancha,
     * como las de la quebrada pero sueltas. Lo que las hace un BOSQUE y no un
     * montón de piedras es que son ALTAS: de lejos se lee un cerco irregular
     * que te tapa, y eso es justo el premio del refugio (adentro no te ven).
     *
     * Cada una saca su forma de dónde está plantada, así que nunca titilan ni
     * hace falta guardarles nada.
     */
    const s = revolver(Math.round(ob.x) * 7919 + Math.round(ob.y));
    const alto = 26 + (s % 22);
    const ancho = 7 + (s % 4);
    const punta = Math.max(2, ancho - 3 - ((s >>> 4) % 2));
    const medio = Math.round((ancho + punta) / 2);

    // La sombra larga: es lo que las despega del suelo y dice que son altas.
    r.ctx.globalAlpha = 0.26;
    r.rect(ox - ancho + 1, ob.y + 1, ancho * 2 + 2, 3, '#000');
    r.ctx.globalAlpha = 1;

    // El cuerpo, afinándose hacia arriba en tres tramos.
    const tonos = ['#7b5442', '#8a6049', '#6d4a3a'];
    const base = tonos[s % tonos.length];
    r.rect(ox - ancho, ob.y - Math.round(alto * 0.34), ancho * 2, Math.round(alto * 0.34) + 3, c(base));
    r.rect(ox - medio, ob.y - Math.round(alto * 0.72), medio * 2, Math.round(alto * 0.4), c(base));
    r.rect(ox - punta, ob.y - alto, punta * 2, Math.round(alto * 0.32) + 1, c(base));

    // La chorreadura de siempre y el canto donde pega el sol.
    r.rect(ox - punta + 1, ob.y - alto + 2, 1, Math.round(alto * 0.6), c('#5a3b2e'));
    r.rect(ox - punta, ob.y - alto, punta * 2, 1, c('#b08e74'));
    r.rect(ox + medio - 2, ob.y - Math.round(alto * 0.7), 2, Math.round(alto * 0.36), c('#5a3b2e'));

    // Pedregullo al pie.
    r.rect(ox - ancho - 1 + (s % 3), ob.y + 2, 3, 2, c('#66483a'));
    return;
  }

  if (ob.tipo === 'roca') {
    // La más grande y la única realmente sólida: 20 px de ancho.
    r.rect(ox - 10, ob.y - 4, 20, 8, c('#4e453e'));
    r.rect(ox - 9, ob.y - 10, 18, 6, c('#6e6359'));
    r.rect(ox - 7, ob.y - 12, 11, 2, c('#6e6359'));
    r.rect(ox - 6, ob.y - 11, 6, 1, c('#8a7e70'));
  } else if (ob.tipo === 'arbusto') {
    r.rect(ox - 9, ob.y - 3, 18, 6, c('#33401f'));
    r.rect(ox - 8, ob.y - 7, 8, 5, c('#4d5c34'));
    r.rect(ox - 1, ob.y - 9, 9, 6, c('#4d5c34'));
    r.rect(ox - 5, ob.y - 8, 3, 1, c('#66773f'));
    r.rect(ox + 2, ob.y - 9, 4, 1, c('#66773f'));
  } else if (ob.tipo === 'cactus') {
    // La silueta más ALTA del desierto (la que más se distingue de lejos),
    // pero de tronco angosto — por eso su radio no es el mayor.
    r.rect(ox - 3, ob.y - 16, 6, 21, c('#3f6b3a'));
    r.rect(ox - 3, ob.y - 16, 2, 21, c('#4f8247'));
    r.rect(ox - 2, ob.y - 18, 4, 2, c('#5d9452'));
    r.rect(ox - 7, ob.y - 9, 4, 3, c('#3f6b3a'));
    r.rect(ox - 8, ob.y - 13, 3, 5, c('#3f6b3a'));
    r.rect(ox - 8, ob.y - 14, 3, 1, c('#5d9452'));
    r.rect(ox + 3, ob.y - 5, 4, 3, c('#3f6b3a'));
    r.rect(ox + 6, ob.y - 10, 3, 6, c('#3f6b3a'));
    r.rect(ox + 6, ob.y - 11, 3, 1, c('#5d9452'));
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
    r.rect(ox - 6, ob.y - 1, 12, 4, c('#6b5334'));
    r.rect(ox - 5, ob.y - 3, 10, 3, c('#a68a5c'));
    r.rect(ox - 3, ob.y - 5, 6, 3, c('#c4a878'));
  }
}
