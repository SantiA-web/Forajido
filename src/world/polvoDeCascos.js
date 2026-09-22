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

/** Cuántas bocanadas vivas se toleran antes de tirar las más viejas. */
const TOPE = 200;

export function crearPolvo(colores) {
  let nubes = [];

  return {
    get cantidad() { return nubes.length; },

    limpiar() { nubes = []; },

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
    sembrar({ x, y, suelo, rumbo = 0, fuerza = 1, pisadas, cuantas = 5 }) {
      for (const [cuando, dx] of pisadas) {
        for (let n = 0; n < cuantas; n++) {
          nubes.push({
            espera: cuando,
            edad: 0,
            vida: 1.2 + Math.random() * 1.0,
            gx: null, gy: null,
            // Se guarda de dónde sale para poder nacer recién cuando pisa.
            x, y, suelo, rumbo,
            dx: dx + Math.random() * 10 - 5,
            dy: 4 + Math.random() * 4,
            vx: -30 + Math.random() * 70,
            vy: -2 - Math.random() * 7,
            r0: 1.5 + Math.random(),
            r1: (8 + Math.random() * 9) * (0.55 + fuerza * 0.6),
          });
        }
      }
      if (nubes.length > TOPE) nubes.splice(0, nubes.length - TOPE);
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
    },

    /**
     * Cada bocanada son tres círculos: la sombra abajo a la derecha, el cuerpo y
     * la luz arriba a la izquierda. Crece rápido al principio y después se
     * frena, y se apaga despacio: así se abre como una nube y no como un globo.
     */
    dibujar(r, suelo, noche) {
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
