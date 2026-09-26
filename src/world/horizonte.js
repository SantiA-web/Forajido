/**
 * EL HORIZONTE DE LEJOS: la franja de cielo con montañas que asoma arriba de
 * todo, con su sol o su luna.
 *
 * 🔁 Esto vivía adentro de `rideScene.js` y era del galope nada más. Se sacó
 * acá para que la huida use **el mismo cielo**, no uno parecido: las dos
 * escenas pasan en el mismo desierto, y dos cordilleras distintas se notan.
 * Es el mismo criterio con el que el suelo se siembra desde `world/desierto.js`
 * en las dos.
 *
 * *(El cielo de lejos lo eligió Santi: "que se pueda ver el cielo y las
 * montañas a lo lejos" — sin romper la vista de tres cuartos donde se juega.)*
 *
 * ⚠️ VA EN COORDENADAS DE PANTALLA, no del mundo: está lejísimos, así que ni el
 * zoom lo achica ni la cámara lo mueve. Lo único que lo corre es `avance`, y
 * poquito: esa diferencia entre las dos cordilleras es lo que el ojo lee como
 * distancia (ver engine/parallax.js).
 */

/**
 * Un entero revuelto a partir de otro, siempre el mismo para el mismo número:
 * para sembrar cosas quietas sin que salgan en fila.
 */
function revolver(n) {
  let t = (n * 374761393 + 668265263) | 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177);
  return (t ^ (t >>> 16)) >>> 0;
}

/**
 * UNA CORDILLERA, apoyada en el horizonte `hy`, en columnas de 2 px. La altura
 * sale de tres ondas superpuestas: nunca se repite a la vista, y es la misma
 * forma cada vez que se dibuja (no titila).
 */
export function cordillera(r, hy, desplazo, altoMax, color, semilla, mesetas) {
  for (let sx = 0; sx < r.width; sx += 2) {
    const u = sx + desplazo;
    let h = 0.5 + 0.28 * Math.sin(u * 0.011 + semilla)
      + 0.16 * Math.sin(u * 0.031 + semilla * 2.3)
      + 0.07 * Math.sin(u * 0.093 + semilla * 5.1);
    h = Math.max(0.08, Math.min(1, h));
    if (mesetas) h = Math.round(h * 5) / 5;
    const alto = Math.round(h * altoMax);
    r.rect(sx, hy - alto, 2, alto, color);
  }
}

/** El sol de día; de noche la luna en cuarto y las estrellas. Van en pantalla. */
export function dibujarAstro(r, hy, dia, C) {
  const cx = Math.round(r.width * 0.78);
  const cy = Math.round(hy * 0.4);
  const disco = (x, y, radio, color, alpha = 1) => {
    r.ctx.save();
    r.ctx.globalAlpha = alpha;
    r.ctx.fillStyle = color;
    r.ctx.beginPath();
    r.ctx.arc(x, y, radio, 0, Math.PI * 2);
    r.ctx.fill();
    r.ctx.restore();
  };
  if (dia) {
    disco(cx, cy, 13, C.sol, 0.16);
    disco(cx, cy, 6, C.sol);
    return;
  }
  /**
   * Las estrellas quedan clavadas a la pantalla: están a distancia infinita.
   *
   * 🐛 Primero eran `(i * 137) % ancho` y `(i * 71) % alto`, y salieron en
   * DIAGONALES: rayitas que parecían estrellas fugaces congeladas. Es el mismo
   * error que ya tuvieron las matas del campamento, y se arregla igual.
   */
  for (let i = 0; i < 40; i++) {
    r.ctx.globalAlpha = 0.3 + (i % 3) * 0.25;
    r.rect(revolver(i) % r.width, revolver(i + 977) % Math.max(1, hy - 8), 1, 1, C.estrella);
  }
  r.ctx.globalAlpha = 1;
  disco(cx, cy, 5, C.luna);
  disco(cx + 2, cy - 2, 4, C.nocheArriba);
}

/**
 * LA FRANJA ENTERA: cielo degradado, astro, las dos cordilleras y la bruma que
 * las apoya en el suelo.
 *
 * @param hy       alto de la franja en px de pantalla; 0 o menos, no dibuja nada
 * @param avance   cuánto se corrió el mundo, para el parallax
 * @param dia      de día o de noche
 * @param C        `colors.cielo`
 * @param tinte    cómo oscurecer cada color (de noche)
 * @param arriba   el par de colores del degradado, ya elegido por la escena
 * @param altoMax  cuánta montaña entra en una franja "llena" (44 px en el galope)
 */
export function dibujarHorizonte(r, { hy, avance, dia, C, tinte, cielo, altoMax = 44, tormenta = false }) {
  if (hy <= 0) return;
  r.cielo(0, 0, r.width, hy, cielo[0], cielo[1], 6);
  if (!tormenta && hy > 20) dibujarAstro(r, hy, dia, C);
  /**
   * Dos cordilleras que se corren con lo que avanzaste sobre el SUELO. La de
   * atrás casi no se mueve y la de adelante un poco más: esa diferencia es la
   * que el ojo lee como distancia. Crecen con la franja, así que se hunden en
   * el horizonte a medida que ésta se achica.
   */
  const escala = hy / altoMax;
  cordillera(r, hy, avance * 0.015, 26 * escala, tinte(tormenta ? C.montanaTormenta : C.montanaLejos), 1.3, true);
  cordillera(r, hy, avance * 0.05, 11 * escala, tinte(C.montanaCerca), 4.1, false);
  r.rect(0, hy, r.width, 1, tinte(C.bruma));
}
