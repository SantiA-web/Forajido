/**
 * Un cartucho de dinamita encendido, ya en el aire o en el piso.
 *
 * Este archivo solo dice QUÉ es y cómo se dibuja. Qué hace al explotar está en
 * systems/explosives.js, igual que el guardia y su IA viven separados.
 */

import { CONFIG } from '../data/config.js';
import { EXPLOSIVES } from '../data/explosives.js';
import { pieza, tono, NEGRO } from '../world/piezas.js';

export function createExplosive({ x, y, targetX, targetY, typeId, owner, fuse }) {
  const type = EXPLOSIVES[typeId];

  return {
    x, y,
    typeId,
    type,
    owner,                 // 'player' | 'enemy'
    fuse,                  // lo que le queda de mecha
    alive: true,

    /**
     * Vuelo: va hasta el punto donde cae y ahí se queda, chispeando.
     *
     * 🐛 NO TODO LO QUE EXPLOTA SE LANZA. Desde la Fase 6a hay explosivos que
     * NACEN donde van a reventar: el cajón de pólvora del vagón de armas, que
     * ya estaba puesto ahí (ver `prenderCajon`, systems/explosives.js). Con
     * `flying: true` a secas, `moverEnVuelo` le calculaba el paso con el
     * `throwSpeed` de su tipo — que el cajón no tiene, porque nadie lo tira —
     * y `0 <= NaN` da false, así que en vez de cortar el vuelo seguía adelante
     * y le escribía `NaN` en la posición. El síntoma aparecía después y en
     * otro lado: el tilemap reventando al preguntar por la casilla `NaN`.
     *
     * Se arregla acá y no dándole un `throwSpeed` de mentira al cajón, porque
     * la pregunta de verdad no es a qué velocidad vuela: es si vuela.
     */
    targetX, targetY,
    flying: !(targetX === x && targetY === y),

    // Solo para el dibujo: da vueltas en el aire y sube y baja.
    spin: 0,
    flightTotal: Math.hypot(targetX - x, targetY - y) || 1,
  };
}

/**
 * Dibuja el cartucho.
 *
 * La mecha se ve: cuanto menos le queda, más rápido parpadea y más grande es la
 * chispa. Es la única información que el jugador necesita para decidir si se
 * queda o se va, y tiene que leerse sin contar segundos.
 */
/** Un punto de dibujo: un cuarto de unidad, con la lupa de ×4. */
const PUNTO = 0.25;

/**
 * 🔁 EL CARTUCHO DE DINAMITA, A LA RESOLUCIÓN NUEVA (etapa 4).
 *
 * Eran dos rectángulos de unidades enteras: con la lupa, un ladrillo rojo de
 * veinticuatro por dieciséis puntos con una raya. Ahora es un cartucho: el
 * papel encerado con su brillo, las dos bandas de la etiqueta y la MECHA
 * saliendo de la punta, que es lo que dice que está encendido incluso en el
 * cuadro en el que la chispa parpadea apagada.
 */
export function piezaDinamita(rojo, banda) {
  const W = 26, H = 14;
  return pieza(`dinamita|${rojo}|${banda}`, W, H, (p) => {
    p(0, 3, W - 6, H - 6, NEGRO);
    p(2, 5, W - 10, H - 10, rojo);
    p(2, 5, W - 10, 2, tono(rojo, 1.3));        // el papel encerado brilla arriba
    p(2, H - 7, W - 10, 2, tono(rojo, 0.66));
    p(5, 5, 3, H - 10, banda);                  // las dos bandas de la etiqueta
    p(13, 5, 3, H - 10, banda);
    // La mecha, saliendo de la punta y curvándose para arriba.
    p(W - 8, 6, 4, 2, '#6a5334');
    p(W - 5, 4, 2, 3, '#6a5334');
    p(W - 4, 1, 2, 3, '#7e6440');
  });
}

export function drawExplosive(r, ex) {
  const c = CONFIG.colors;
  const t = ex.type;
  const restante = Math.max(0, ex.fuse) / t.fuse;

  // Mientras vuela describe un arco: sube y baja. Es puro dibujo.
  let altura = 0;
  if (ex.flying) {
    const falta = Math.hypot(ex.targetX - ex.x, ex.targetY - ex.y);
    const avance = 1 - Math.min(1, falta / ex.flightTotal);
    altura = Math.sin(avance * Math.PI) * 9;
  }

  const y = ex.y - altura;

  // Sombra en el piso: sin esto no se entiende que está por el aire.
  if (altura > 0.5) {
    r.ctx.globalAlpha = 0.3;
    r.box(ex.x, ex.y + 3, 3, 1, '#000');
    r.ctx.globalAlpha = 1;
  }

  // El cartucho. Se arma una vez y se estampa (ver world/piezas.js).
  const img = piezaDinamita(c.dynamite, c.dynamiteBand);
  r.ctx.drawImage(img, ex.x - (img.width * PUNTO) / 2, y - (img.height * PUNTO) / 2,
    img.width * PUNTO, img.height * PUNTO);

  // La chispa: parpadea cada vez más rápido a medida que se acaba la mecha.
  const ritmo = 6 + (1 - restante) * 26;
  const encendida = Math.floor(ex.spin * ritmo) % 2 === 0;
  if (encendida) {
    const tam = 1 + Math.round((1 - restante) * 2);
    r.box(ex.x, y - 4, tam, tam, restante < 0.35 ? '#fff4c0' : '#ffb45c');
  }

  // En el piso y a punto de reventar, un aro de aviso.
  if (!ex.flying && restante < 0.45) {
    r.circle(ex.x, ex.y, t.lethalRadius, '#ff7a4a', 0.16 + (1 - restante) * 0.2);
  }
}
