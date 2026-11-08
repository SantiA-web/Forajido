/**
 * EL POLVO QUE LEVANTAN LOS CASCOS.
 *
 * *(Santi, sobre el galope: "añádele una nube de polvo como la de la imagen", y
 * "lo más realista posible")*
 *
 * Vivía adentro del galope (scenes/rideScene.js); se mudó acá cuando la huida
 * lo necesitó también *(Santi: "¿por qué todavía no lo siento como una
 * persecución real del Oeste?" — la primera respuesta es que no se sentía la
 * velocidad)*. Es el MISMO polvo: el caballo del galope y el de la huida
 * levantan tierra igual.
 *
 * NO ES UNA ESTELA PEGADA AL CABALLO: cada casco que pisa levanta sus
 * bocanadas, y esas bocanadas SE QUEDAN DONDE NACIERON, sobre el suelo. El
 * caballo sigue y las deja atrás; ellas crecen, suben un poco, derivan con el
 * viento de la carrera y se deshacen. Eso es lo que se lee como polvo de verdad
 * y no como un humo que el caballo arrastra.
 *
 * ES SÓLO DIBUJO y usa `Math.random`, no el `rng` del juego: si usara el mismo
 * generador que siembra obstáculos y tiros, cada bocanada correría los sorteos
 * de la escena.
 */

import { escalarColor } from './trenTresCuartos.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';
import { dibujarBocanada, dibujarGrano, dibujarNubeDeAire } from './estiloNuevo/polvo.js';

/** Cuántas bocanadas vivas se toleran antes de tirar las más viejas. */
const TOPE = 200;
/**
 * 🆕 En el estilo nuevo, más y que duran más *(Santi: "agregale más polvo detrás, que sea un poco más densa")*: las
 * bocanadas son opacas y dibujadas en la grilla (world/estiloNuevo/polvo.js), y se pisan hasta cerrar la nube.
 */
const NUEVO = { tope: 420, masPorPisada: 4, vidaMas: 0.5, desparejo: 0.3, sube: 6 };
/** ⛈️ El barro: cuántos granos por pisada, cuánto saltan y cuánto quedan en el suelo. */
const BARRO = { granos: 7, tope: 260, gravedad: 420, quedan: 0.6 };
/**
 * ☁️ Los copos de la nube en el aire (se pintan juntos en world/estiloNuevo/polvo.js): uno por pisada. `vida` en
 * segundos; `radio` el que llega a tener a fondo; `sube` cuánto se levanta, en partes del radio; `atras` cuánto
 * detrás del casco nace; `entra` qué parte de la vida tarda en espesarse (así no tapa al caballo que la levanta).
 */
/**
 * ☁️ LA NUBE DE LA PARTIDA *(Santi: "para que se acumule debería ser un mínimo de tres y mientras más hayan más grande
 * es con un límite de cinco"; eligió que cuenten todos los caballos, vos incluido, a menos de unos dos cuerpos)*: cada
 * zancada, el grupo suelta copos grandes detrás suyo. `radio` el de tres caballos; cada uno más suma `masPorCaballo`
 * (en partes del de tres), hasta cinco.
 */
// (🔁 Grande de verdad y cerrada *(Santi: "una nube de polvo grande literal, y que tape lo que se ponga entremedio")*.
// 🔁 Y UNA PELOTA EN LO ALTO, NO UNA ESTELA *(Santi: "que sea una nube tipo pelota en lo alto, más que una estela")*:
// antes el grupo soltaba copos que quedaban en el suelo, y como el grupo avanza se armaba una tira larga. Ahora cada
// grupo tiene UNA nube que lo sigue detrás, un poco atrasada, levantada en el aire y redonda: un bollo de varios
// bultos que se mueven despacio. Cuando el grupo se desarma, la pelota se queda donde estaba, sube y se deshace.)
//   radio: la de 3 caballos; masPorCaballo: cuánto crece por cada uno más (hasta `tope`); alto: a cuánto del suelo va
//   el centro (en radios); atras: cuánto detrás del grupo (en radios); sigue: qué tan rápido va hacia donde le toca;
//   junta: a cuánto se reconoce que es la misma pelota; seDeshace: segundos que tarda en irse sin grupo; bultos: los
//   que la forman alrededor del centro.
// (🔁 QUIETA EN EL AIRE, NO PEGADA A LOS CABALLOS *(Santi: "es como que se mueve junto con los caballos y eso no
// debería ocurrir")*: la pelota nace donde el grupo levanta la tierra y se queda ahí, creciendo mientras el grupo le
// pasa cerca; cuando el grupo se aleja más de `junta`, nace otra donde va. Las de atrás suben y se deshacen.
// 🔁 Y MENOS PERFECTA *(Santi: "se ve muy perfecta, muy circular")*: más bultos, desparejos y más afuera, que se van
// abriendo cada uno a su ritmo, y el borde comido por un ruido fijo en el mundo (world/estiloNuevo/polvo.js).)
// (🔁 Cada pelota nueva, bien separada de la anterior, y las de atrás se van más rápido: muy juntas y muy largas se
// pegaban en una estela otra vez.)
const GRUPO = { radio: 60, masPorCaballo: 0.3, tope: 5, alto: 1.1, atras: 0.5, junta: 330,
  seDeshace: 2, espesor: 4.2, crece: 1.0, bultos: 9, suelta: 0.6, sube: 9 };
const COPOS = { tope: 260, vida: 3.2, vidaMas: 1.0, radio: 26, radioMas: 10, sube: 0.6, atras: 10, entra: 0.1, espesor: 1.6 };

export function crearPolvo(colores) {
  let nubes = [];
  let granos = [];
  let copos = [];
  // ☁️ Las pelotas de polvo de los grupos (ver GRUPO).
  let pelotas = [];

  return {
    get cantidad() { return nubes.length; },
    get granos() { return granos.length; },
    get copos() { return copos.length; },

    limpiar() { nubes = []; granos = []; copos = []; pelotas = []; },

    /**
     * Una pisada levanta su bocanada.
     *
     * @param x,y     dónde está el animal, en pantalla
     * @param suelo   cuánto terreno lleva corrido la escena (las bocanadas se
     *                guardan en coordenadas del SUELO, para quedarse quietas)
     * @param rumbo   hacia dónde apunta el animal, en radianes
     * @param fuerza  0 a 1: a fondo levanta más tierra que al trote
     * @param pisadas [[espera, dx], ...] cuándo pisa cada casco y dónde cae
     * @param cuantas bocanadas por pisada
     */
    /** `aire`: de qué tamaño es su nube en el aire (1 entera; en grupo, más chica: la grande es la de la partida). */
    sembrar({ x, y, suelo, rumbo = 0, fuerza = 1, pisadas, cuantas = 5, barro = false, aire = 1 }) {
      const nuevo = estiloNuevo.activo;
      // ⛈️ Con lluvia no se levanta polvo: saltan granos de barro (sólo en el estilo nuevo).
      if (nuevo && barro) {
        for (const [cuando, dx] of pisadas) {
          const n = Math.round(BARRO.granos * (0.4 + fuerza * 0.6));
          for (let k = 0; k < n; k++) {
            granos.push({
              espera: cuando, gx: null, x, y, suelo, rumbo,
              dx: dx + Math.random() * 6 - 3, dy: 5 + Math.random() * 3,
              vx: -40 - Math.random() * 60 * fuerza, h: 0, vh: 25 + Math.random() * 45 * fuerza,
              quieto: 0, grande: Math.random() < 0.35, claro: Math.random() < 0.3,
            });
          }
        }
        if (granos.length > BARRO.tope) granos.splice(0, granos.length - BARRO.tope);
        return;
      }
      if (nuevo) {
        cuantas += NUEVO.masPorPisada;
        // ☁️ Y la nube en el aire: un copo por pisada.
        for (const [cuando, dx] of pisadas) {
          copos.push({
            espera: cuando, edad: 0, gx: null, x, y, suelo, rumbo, dx: dx - COPOS.atras,
            vida: COPOS.vida + Math.random() * COPOS.vidaMas,
            radio: (COPOS.radio + Math.random() * COPOS.radioMas) * (0.5 + fuerza * 0.6) * aire,
            fuerza: (0.6 + fuerza * 0.4) * (aire < 1 ? 0.6 : 1),
            // (🔁 La tierra se queda atrás del caballo, para el lado contrario al que corre: antes derivaba igual
            // para cualquier rumbo.)
            vx: -Math.cos(rumbo) * 14 - 4 + Math.random() * 8, vy: -Math.sin(rumbo) * 7 - 2 + Math.random() * 4,
          });
        }
        if (copos.length > COPOS.tope) copos.splice(0, copos.length - COPOS.tope);
      }
      for (const [cuando, dx] of pisadas) {
        for (let n = 0; n < cuantas; n++) {
          nubes.push({
            // (🆕 En el estilo nuevo, un poco antes o después de la pisada: así la nube sale seguida y no a manchones.)
            espera: cuando + (nuevo ? Math.random() * NUEVO.desparejo : 0),
            edad: 0,
            vida: 1.2 + Math.random() * 1.0 + (nuevo ? NUEVO.vidaMas : 0),
            // 🆕 Cuál de las dos bocanadas dibujadas (la grande o la chica), para el estilo nuevo.
            v: Math.random() < 0.45 ? 0 : 1,
            gx: null, gy: null,
            // Se guarda de dónde sale para poder nacer recién cuando pisa.
            x, y, suelo, rumbo,
            dx: dx + Math.random() * 10 - 5,
            dy: 4 + Math.random() * 4,
            vx: -30 + Math.random() * 70,
            vy: -2 - Math.random() * 7 - (nuevo ? NUEVO.sube : 0),
            r0: 1.5 + Math.random(),
            r1: (8 + Math.random() * 9) * (0.55 + fuerza * 0.6),
          });
        }
      }
      const tope = nuevo ? NUEVO.tope : TOPE;
      if (nubes.length > tope) nubes.splice(0, nubes.length - tope);
    },

    /**
     * ☁️ Un grupo de `cuantos` caballos juntos (3 o más) en (`x`, `y`), corriendo hacia `rumbo`: la nube grande.
     * Se llama una vez por zancada; `zancada` (segundos) reparte los dos copos que suelta.
     */
    acumular({ x, y, suelo = 0, rumbo = 0, cuantos = 3 }) {
      if (!estiloNuevo.activo || cuantos < 3) return;
      const n = Math.min(GRUPO.tope, cuantos);
      const radio = GRUPO.radio * (1 + (n - 3) * GRUPO.masPorCaballo);
      // Dónde le toca estar: detrás del grupo, en coordenadas del suelo (el pie de la pelota; el alto se suma al dibujar).
      const tx = x + suelo - Math.cos(rumbo) * radio * GRUPO.atras, ty = y - Math.sin(rumbo) * radio * GRUPO.atras * 0.5;
      let p = null, mejor = GRUPO.junta;
      for (const q of pelotas) {
        if (q.suelta) continue;
        const d = Math.hypot(q.x - tx, q.y - ty);
        if (d < mejor) { mejor = d; p = q; }
      }
      if (!p) {
        p = { x: tx, y: ty, radio: radio * 0.3, fuerza: 0, sola: 0, suelta: false, alza: 0,
          // Cada bulto: hacia dónde (a), a cuánto del centro (d, en radios), de qué tamaño (r), cuánto gira (v) y cuánto se
          // abre (abre). Desparejos a propósito: arriba, más grandes (la tierra sube y se infla).
          bultos: Array.from({ length: GRUPO.bultos }, (_, k) => {
            const a = (k / GRUPO.bultos) * Math.PI * 2 + (Math.random() - 0.5) * 0.9;
            const arriba = Math.sin(a) < 0 ? 1 : 0;
            return { a, d: 0.45 + Math.random() * 0.4, r: 0.28 + Math.random() * 0.25 + arriba * 0.1,
              v: (Math.random() - 0.5) * 0.25, abre: 0.03 + Math.random() * 0.08, fuerza: 0.35 + Math.random() * 0.35 };
          }) };
        pelotas.push(p);
      }
      p.meta = Math.max(p.meta || 0, radio); p.sola = 0;
    },

    /**
     * @param avance cuánto avanzó el suelo desde que se sembró cada bocanada
     *   (se le pasa el `suelo` de ahora; cada bocanada se acuerda del suyo).
     */
    actualizar(dt, suelo) {
      for (const b of nubes) {
        if (b.gx === null) {
          b.espera -= dt;
          if (b.espera > 0) continue;
          // Nace ahora, bajo el casco, en coordenadas del SUELO: se queda ahí.
          // `b.suelo` es el de cuando se sembró, y `suelo` el de ahora: entre
          // los dos, el animal siguió avanzando.
          b.gx = b.x + suelo + b.dx * Math.cos(b.rumbo);
          b.gy = b.y + b.dy + b.dx * Math.sin(b.rumbo);
        }
        b.edad += dt;
        b.gx += b.vx * dt;
        b.gy += b.vy * dt;
        // El aire las frena: salen con el golpe del casco y se quedan flotando.
        b.vx *= Math.max(0, 1 - 2.2 * dt);
        b.vy *= Math.max(0, 1 - 1.2 * dt);
      }
      for (let i = nubes.length - 1; i >= 0; i--) {
        if (nubes[i].gx !== null && nubes[i].edad >= nubes[i].vida) nubes.splice(i, 1);
      }
      for (const c of copos) {
        if (c.gx === null) {
          c.espera -= dt;
          if (c.espera > 0) continue;
          c.gx = c.x + suelo + c.dx * Math.cos(c.rumbo);
          c.gy = c.y + 6 + c.dx * Math.sin(c.rumbo);
        }
        c.edad += dt;
        c.gx += c.vx * dt;
        c.gy += c.vy * dt;
      }
      copos = copos.filter((c) => c.gx === null || c.edad < c.vida);
      // ☁️ Las pelotas: quietas donde nacieron. Crecen mientras el grupo les pasa cerca; sin grupo, se sueltan: siguen
      // subiendo, se abren y se deshacen.
      for (const p of pelotas) {
        p.sola += dt;
        if (!p.suelta && p.sola > GRUPO.suelta) p.suelta = true;
        p.alza += GRUPO.sube * dt;
        if (!p.suelta) {
          p.radio += (p.meta - p.radio) * Math.min(1, GRUPO.crece * dt);
          p.fuerza = Math.min(1, p.fuerza + dt / 0.6);
        } else {
          p.radio += 6 * dt;
          p.fuerza -= dt / GRUPO.seDeshace;
        }
        for (const b of p.bultos) { b.a += b.v * dt; b.d += b.abre * dt; }
      }
      pelotas = pelotas.filter((p) => p.fuerza > 0 || !p.suelta);
      // El barro: salta (`h`, la altura sobre el suelo), cae con su peso y queda un momento donde pegó.
      for (const g of granos) {
        if (g.gx === null) {
          g.espera -= dt;
          if (g.espera > 0) continue;
          g.gx = g.x + suelo + g.dx * Math.cos(g.rumbo);
          g.gy = g.y + g.dy + g.dx * Math.sin(g.rumbo);
        }
        if (g.h > 0 || g.vh > 0) {
          g.gx += g.vx * dt;
          g.vh -= BARRO.gravedad * dt;
          g.h = Math.max(0, g.h + g.vh * dt);
          if (g.h === 0 && g.vh < 0) g.vh = 0;
        } else g.quieto += dt;
      }
      granos = granos.filter((g) => g.gx === null || g.quieto < BARRO.quedan);
    },

    /**
     * Cada bocanada son tres círculos: la sombra abajo a la derecha, el cuerpo y
     * la luz arriba a la izquierda. Crece rápido al principio y después se
     * frena, y se apaga despacio: así se abre como una nube y no como un globo.
     */
    /**
     * ☁️ La nube en el aire, encima de los caballos (se dibuja después que ellos). `celda`: el punto de la grilla con
     * que se ve la escena (el cercano, o el doble cuando los caballos van chicos).
     */
    dibujarAire(r, suelo, noche, celda) {
      if (!estiloNuevo.activo) return;
      const lista = [];
      for (const c of copos) {
        if (c.gx === null) continue;
        const t = Math.min(1, c.edad / c.vida);
        const crece = 1 - (1 - t) * (1 - t);
        const r0 = c.radio * (0.25 + 0.75 * crece);
        // Sube del casco: el centro se levanta hasta que la bola casi despega del suelo.
        const alto = 2 + c.radio * COPOS.sube * crece;
        lista.push({ x: c.gx - suelo, y: c.gy - alto, r: r0, s: COPOS.espesor * c.fuerza * Math.min(1, t / COPOS.entra) * Math.pow(1 - t, 1.3) });
      }
      // Las pelotas: un centro y sus bultos alrededor, redondos (sin achatar), en lo alto.
      for (const p of pelotas) {
        const cx = p.x - suelo, cy = p.y - p.radio * GRUPO.alto - p.alza, s = GRUPO.espesor * Math.max(0, p.fuerza);
        // (🔁 El centro, más fuerte que los bultos: si no, quedaba un pozo en el medio y se pintaba como un agujero.)
        lista.push({ x: cx, y: cy, r: p.radio * 0.7, s: s * 1.4, chato: 0.85 });
        for (const b of p.bultos) {
          lista.push({ x: cx + Math.cos(b.a) * p.radio * b.d, y: cy + Math.sin(b.a) * p.radio * b.d * 0.75, r: p.radio * b.r, s: s * b.fuerza, chato: 0.9 });
        }
      }
      dibujarNubeDeAire(r.ctx, lista, noche, celda);
    },

    dibujar(r, suelo, noche) {
      if (estiloNuevo.activo) {
        const suave = r.ctx.imageSmoothingEnabled;
        r.ctx.imageSmoothingEnabled = false;
        for (const b of nubes) {
          if (b.gx === null) continue;
          dibujarBocanada(r.ctx, b.gx - suelo, b.gy, Math.min(1, b.edad / b.vida), b.v, noche);
        }
        for (const g of granos) if (g.gx !== null) dibujarGrano(r.ctx, g.gx - suelo, g.gy - g.h, g.grande, g.claro, noche);
        r.ctx.imageSmoothingEnabled = suave;
        return;
      }
      const tono = (hex) => (noche ? escalarColor(hex, 0.35) : hex);
      const disco = (cx, cy, radio, color, alpha) => {
        r.ctx.globalAlpha = alpha;
        r.ctx.fillStyle = color;
        r.ctx.beginPath();
        r.ctx.arc(Math.round(cx), Math.round(cy), Math.max(1, radio), 0, Math.PI * 2);
        r.ctx.fill();
      };
      r.ctx.save();
      for (const b of nubes) {
        if (b.gx === null) continue;
        const t = Math.min(1, b.edad / b.vida);
        const radio = b.r0 + (b.r1 - b.r0) * (1 - (1 - t) * (1 - t));
        // Más transparentes que una sola: se pisan varias en el mismo lugar.
        const alpha = 0.42 * Math.pow(1 - t, 1.5);
        const sx = b.gx - suelo;
        disco(sx + radio * 0.25, b.gy + radio * 0.3, radio * 0.85, tono(colores.sombra), alpha * 0.55);
        disco(sx, b.gy, radio, tono(colores.base), alpha);
        disco(sx - radio * 0.3, b.gy - radio * 0.3, radio * 0.55, tono(colores.luz), alpha * 0.7);
      }
      r.ctx.restore();
    },
  };
}
