/**
 * 🧗 ESTAR ARRIBA DEL TREN — etapa 1 del techo nuevo. Ver NOTAS-DISENO.md.
 *
 * *(Santi: "traeme una propuesta para el techo. Quiero casi que rehacerlo al
 * completo" — y después: "¿y si lo hacemos al techo visto desde arriba?")*
 *
 * NO CAMBIA NINGUNA REGLA. Todo lo que hay acá es lo que se ve y se oye: que
 * subir se sienta alto, peligroso y con el tren yendo a toda máquina. Las
 * reglas (carteles, huecos, tiros desde abajo) siguen en `CONFIG.techo` y en
 * raidScene.js, sin un número tocado.
 *
 * LA CÁMARA NO SE INCLINA, Y FUE DECIDIDO: se queda la de siempre, alta, que
 * deja ver la cara de las cosas (el pórtico se lee alto y el cajón bajo). La
 * altura se cuenta con cinco señales que una vista desde arriba sí puede dar:
 *
 *   1. LA LUPA BAJA (`lupa`): arriba ves un tercio más de mundo — más desierto
 *      y los jinetes de los dos lados. Arriba se ve más lejos.
 *   2. LA SOMBRA DEL TREN sobre el desierto, del lado de allá. Es la señal más
 *      clara de altura que tiene una vista de arriba, y se estira a medida que
 *      el sol baja con el reloj del asalto.
 *   3. EL VIENTO: rayas y polvo que te cruzan hacia la cola, más rápido cuanto
 *      más corre el tren (el mismo tirón del traqueteo).
 *   4. EL HUMO DE LA LOCOMOTORA, que te pasa por encima de a bancos. De noche,
 *      con chispas. Es tenue a propósito: tapa el paisaje, no el juego.
 *   5. EL BAMBOLEO: el tren se mece de costado contra el desierto, que se queda
 *      quieto. Adentro no se nota; arriba sí.
 *
 * Todo entra y sale de a poco con `peso` (0 adentro, 1 arriba), para que subir
 * y bajar no peguen un salto.
 */

import { CONFIG } from '../data/config.js';

export function crearSensacionTecho() {
  return {
    peso: 0,
    rayas: [],
    polvo: [],
    humo: [],
    chispas: [],
    humoTimer: 0,
  };
}

/** Suave al entrar y al salir, no en línea recta. */
function suave(t) { return t * t * (3 - 2 * t); }

/**
 * Cada cuadro. `velMult` es el tirón del traqueteo (1 = marcha normal): el
 * viento y el humo corren con él, igual que el desierto.
 */
export function actualizarSensacionTecho(s, dt, { enTecho, velMult, ancho, alto, centroY, rng }) {
  const c = CONFIG.techo.sensacion;
  const paso = dt / Math.max(0.01, c.transicion);
  s.peso = enTecho ? Math.min(1, s.peso + paso) : Math.max(0, s.peso - paso);

  const vel = Math.max(0.2, velMult);

  // --- El viento: sólo nace arriba, pero lo que ya está en el aire termina su viaje.
  if (enTecho) {
    const V = c.viento;
    s.rayasTimer = (s.rayasTimer || 0) - dt * vel;
    while (s.rayasTimer <= 0) {
      s.rayasTimer += V.rayaCada;
      s.rayas.push({
        x: ancho + 4, y: rng.range(0, alto),
        largo: rng.range(V.rayaLargo[0], V.rayaLargo[1]),
        v: rng.range(V.rayaVel[0], V.rayaVel[1]),
        a: rng.range(0.35, 1),
      });
    }
    s.polvoTimer = (s.polvoTimer || 0) - dt * vel;
    while (s.polvoTimer <= 0) {
      s.polvoTimer += V.polvoCada;
      s.polvo.push({
        x: ancho + 2, y: rng.range(0, alto),
        v: rng.range(V.polvoVel[0], V.polvoVel[1]),
        fase: rng.range(0, Math.PI * 2),
      });
    }
  }
  for (let i = s.rayas.length - 1; i >= 0; i--) {
    const r = s.rayas[i];
    r.x -= r.v * vel * dt;
    if (r.x + r.largo < 0) s.rayas.splice(i, 1);
  }
  for (let i = s.polvo.length - 1; i >= 0; i--) {
    const p = s.polvo[i];
    p.x -= p.v * vel * dt;
    p.fase += dt * 7;
    p.y += Math.sin(p.fase) * 6 * dt;
    if (p.x < -2) s.polvo.splice(i, 1);
  }

  // --- El humo: llega de a bancos, desde la locomotora (adelante = derecha).
  const H = c.humo;
  if (enTecho) {
    s.humoTimer -= dt;
    if (s.humoTimer <= 0) {
      s.humoTimer = rng.range(H.cada[0], H.cada[1]);
      const n = Math.round(rng.range(H.bocanadas[0], H.bocanadas[1]));
      const yBanco = centroY + rng.range(-H.dispersionY, H.dispersionY);
      for (let i = 0; i < n; i++) {
        s.humo.push({
          x: ancho + 20 + i * rng.range(H.separacion[0], H.separacion[1]),
          y: yBanco + rng.range(-10, 10),
          vy: rng.range(-4, 4),
          edad: 0,
          vida: rng.range(H.vida[0], H.vida[1]),
          r0: rng.range(H.radio[0] * 0.6, H.radio[0]),
          // Cada bocanada es un racimo de tres o cuatro nubecitas, no un
          // disco: un círculo solo se lee como burbuja, no como humo.
          racimo: Array.from({ length: 3 + Math.floor(rng.range(0, 2)) }, () => ({
            dx: rng.range(-0.8, 0.8), dy: rng.range(-0.5, 0.5), escala: rng.range(0.45, 0.8),
          })),
        });
      }
    }
  }
  for (let i = s.humo.length - 1; i >= 0; i--) {
    const h = s.humo[i];
    h.edad += dt;
    h.x -= H.vel * vel * dt;
    h.y += h.vy * dt;
    if (h.edad >= h.vida || h.x < -H.radio[1] * 2) { s.humo.splice(i, 1); continue; }
    // De noche la chimenea escupe chispas adentro del humo.
    if (h.chispaTimer === undefined) h.chispaTimer = rng.range(0, 0.4);
    h.chispaTimer -= dt;
    if (h.chispaTimer <= 0) {
      h.chispaTimer = rng.range(0.15, 0.5);
      s.chispas.push({ x: h.x + rng.range(-6, 6), y: h.y + rng.range(-6, 6), vy: rng.range(-12, 12), vida: rng.range(0.4, 0.9) });
    }
  }
  for (let i = s.chispas.length - 1; i >= 0; i--) {
    const k = s.chispas[i];
    k.vida -= dt;
    k.x -= (H.vel + 40) * vel * dt;
    k.y += k.vy * dt;
    if (k.vida <= 0) s.chispas.splice(i, 1);
  }
}

/** La lupa de este cuadro: la del mundo adentro, la del techo arriba, y el pasaje entre las dos. */
export function lupaDelTecho(s, lupaMundo) {
  const c = CONFIG.techo.sensacion;
  return lupaMundo + (c.lupa - lupaMundo) * suave(s.peso);
}

/**
 * Cuánto se mece el tren de costado (en Y de la pantalla), redondeado al punto
 * de dibujo para que no se vea borroso. El desierto NO se mece: es eso, que el
 * tren se mueva contra un suelo quieto, lo que se lee como balanceo.
 */
export function bamboleoDelTecho(s, reloj, densidad) {
  const c = CONFIG.techo.sensacion;
  const b = c.bamboleo;
  // Dos ondas que no coinciden: con una sola se ve como un péndulo de reloj.
  const y = (Math.sin(reloj * b.vel * Math.PI * 2) * 0.7 +
             Math.sin(reloj * b.vel * 2.37 * Math.PI * 2 + 1.3) * 0.3) * b.amplitud * suave(s.peso);
  const d = densidad || 1;
  return Math.round(y * d) / d;
}

/**
 * 🌗 LA SOMBRA DEL TREN SOBRE EL DESIERTO, del lado de allá.
 *
 * La luz del juego viene de este lado (el alero de acá tiene el canto
 * iluminado y el de allá está en sombra), así que la sombra cae detrás del
 * tren, sobre la franja de arriba. Va pegada a cada vagón y se corta en los
 * enganches, como el tren. Se estira a medida que el sol baja (`sol`, de 1 al
 * principio del asalto a `solAlFinal`). De noche y en la tormenta no hay sol
 * que tire sombra.
 *
 * Se dibuja SIEMPRE, también adentro: la sombra del tren no desaparece porque
 * vos entres a un vagón. Arriba simplemente se ve más, por la lupa.
 *
 * `despX` es el corrimiento del mundo en pantalla; `bordeY`, dónde termina el
 * desierto de arriba y empieza el tren (en coordenadas de pantalla).
 */
export function sombraDelTren(r, train, despX, bordeY, { sol, hayLuz }) {
  if (!hayLuz) return;
  const c = CONFIG.techo.sensacion.sombra;
  const largo = c.largo * (1 + c.estiraAlAtardecer * (1 - sol));
  const ancho = r.width;
  const ctx = r.ctx;
  ctx.save();
  for (const w of train.wagons) {
    const x = w.x - despX;
    if (x > ancho || x + w.width < 0) continue;
    // Tres bandas, más oscura pegada al tren: en pixel art una sombra se
    // escalona, no se difumina.
    // La banda 0 va pegada al tren; cada una más lejos es más clara y se
    // corre un poco hacia la cola, que es para donde está bajando el sol.
    const banda = Math.max(1, Math.round(largo / 3));
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = c.alfa * (1 - i * 0.3);
      r.rect(x - c.corrimiento * i, bordeY - banda * (i + 1), w.width, banda, c.color);
    }
  }
  ctx.restore();
}

/**
 * El viento y el humo, encima de todo y en coordenadas de PANTALLA (no del
 * mundo): es aire que te pasa por delante, no algo apoyado en el tren.
 */
export function dibujarSensacionTecho(r, s, { dia, camY = 0 }) {
  const c = CONFIG.techo.sensacion;
  const peso = suave(s.peso);
  if (peso <= 0 && !s.humo.length) return;
  const ctx = r.ctx;
  const punto = 1 / (r.densidad || 1);
  ctx.save();

  // El humo primero: el viento le pasa por delante.
  const H = c.humo;
  const colorHumo = dia ? H.colorDia : H.colorNoche;
  for (const h of s.humo) {
    const t = h.edad / h.vida;
    const radio = h.r0 + (H.radio[1] - h.r0) * t;
    // Entra de a poco y se deshace al final.
    const a = H.alfa * Math.min(1, t * 6) * (1 - t) * Math.max(peso, 0.001);
    if (a <= 0.005) continue;
    // El racimo, con el aire estirándolo hacia la cola: las nubecitas se
    // superponen y donde se pisan queda más denso, que es lo que le da cuerpo.
    ctx.globalAlpha = a * 0.6;
    for (const n of h.racimo) {
      bocanada(r, h.x + n.dx * radio, h.y - camY + n.dy * radio, radio * n.escala, colorHumo);
    }
  }
  if (!dia) {
    for (const k of s.chispas) {
      ctx.globalAlpha = Math.min(1, k.vida * 2) * peso;
      r.rect(k.x, k.y - camY, punto * 2, punto * 2, H.chispa);
    }
  }

  const V = c.viento;
  for (const p of s.polvo) {
    ctx.globalAlpha = V.polvoAlfa * peso;
    r.rect(p.x, p.y, punto * 2, punto * 2, dia ? V.polvoDia : V.polvoNoche);
  }
  for (const ra of s.rayas) {
    ctx.globalAlpha = V.rayaAlfa * ra.a * peso;
    r.rect(ra.x, ra.y, ra.largo, punto * 2, dia ? V.rayaDia : V.rayaNoche);
  }
  ctx.restore();
}

/**
 * Una bocanada de humo en pixel art: un disco escalonado de a dos unidades,
 * con un núcleo más denso. Con `arc` del canvas sale suavizado y desentona con
 * todo lo demás.
 */
function bocanada(r, cx, cy, radio, color) {
  const paso = 2;
  // Achatada y estirada: el viento la tira hacia atrás.
  const alto = radio * 0.75;
  for (let dy = -alto; dy < alto; dy += paso) {
    const f = (dy + paso / 2) / alto;
    const medio = radio * 1.25 * Math.sqrt(Math.max(0, 1 - f * f));
    if (medio < 1) continue;
    const x0 = Math.round(cx - medio);
    r.rect(x0, Math.round(cy + dy), Math.round(medio * 2), paso, color);
  }
}
