/**
 * Sistema de combate: mueve las balas y reparte el daño.
 *
 * No dibuja nada y no sabe qué escena está corriendo. Solo avisa por el bus
 * lo que va pasando ('enemyKilled', 'playerHit', 'impact'), y más adelante
 * los sistemas de fama, recompensa y honor se van a enganchar ahí sin que
 * haya que tocar este archivo.
 */

import { pointInBody } from '../engine/collision.js';
import { damageEnemy } from '../entities/enemy.js';
import { damagePlayer, isHidden } from '../entities/player.js';
import { damageRider } from './riders.js';
import { dañarPuerta } from '../entities/door.js';
import { dañarRodante } from '../entities/rodante.js';
import { dañarCajon } from '../entities/cajon.js';
import { prenderCajon, soltarExplosivo } from './explosives.js';

export function updateBullets(bullets, dt, world) {
  for (const b of bullets) {
    if (!b.alive) continue;

    b.life -= dt;
    if (b.life <= 0) { b.alive = false; continue; }

    b.trailX = b.x;
    b.trailY = b.y;

    // Avanzamos en pasitos para que una bala rápida no atraviese una pared.
    const stepDist = Math.hypot(b.vx, b.vy) * dt;
    const steps = Math.max(1, Math.ceil(stepDist / 4));
    const sx = (b.vx * dt) / steps;
    const sy = (b.vy * dt) / steps;

    for (let i = 0; i < steps && b.alive; i++) {
      b.x += sx;
      b.y += sy;

      /**
       * Ojo: pregunta por blocksBullets, NO por solid. Son cosas distintas
       * desde que existe la ventanilla, que frena el paso pero no las balas.
       *
       * La PUERTA BLINDADA entra en la misma cuenta: es chapa, así que frena
       * la bala igual que una pared. Es la única puerta del tren que lo hace
       * — las comunes son madera y se atraviesan (ver abajo). Eso es lo que
       * hace que al blindado no se le pueda entrar a los tiros por ningún
       * lado: ni caminando, ni disparando. Sólo dinamita.
       */
      /**
       * EL MONTÍCULO DE CARBÓN ('M', la góndola) frena las balas de adentro
       * pero no las del jinete (`fromRider`): te tapa de los guardias, no de
       * los de afuera. Ver `tapaSoloDeAdentro` en world/tilemap.js.
       */
      const pared = world.map.blocksBulletsAt(b.x, b.y) &&
        !(b.fromRider && world.map.tapaSoloDeAdentroAt && world.map.tapaSoloDeAdentroAt(b.x, b.y));
      if (pared || puertaBlindadaEnMedio(b, world)) {
        b.alive = false;
        world.bus.emit('impact', { x: b.x, y: b.y, kind: 'wall' });
        break;
      }

      /**
       * Una puerta común cerrada NO frena la bala (la deja pasar, por eso se
       * puede "disparar a lo loco" a través) pero SÍ la castiga: encajar
       * suficientes la rompe. `_puertasGolpeadas` evita contar dos veces la
       * misma puerta mientras la bala cruza sus 16px en varios pasos de 4px.
       */
      if (world.doors) {
        for (const d of world.doors) {
          if (d.broken || d.open || d.kind === 'blindada') continue;
          if (Math.abs(b.x - d.x) >= d.hw || Math.abs(b.y - d.y) >= d.hh) continue;
          b._puertasGolpeadas = b._puertasGolpeadas || new Set();
          if (b._puertasGolpeadas.has(d)) continue;
          b._puertasGolpeadas.add(d);
          dañarPuerta(d, b.damage);
          world.bus.emit('impact', { x: b.x, y: b.y, kind: 'wall' });
        }
      }

      /**
       * LOS CAJONES DE PÓLVORA DEL VAGÓN DE ARMAS (Fase 6a).
       *
       * FRENAN LA BALA, como cualquier bulto: por eso sirven de cobertura —
       * una cobertura que aguanta tres tiros y después te mata.
       *
       * Y LOS PRENDE CUALQUIER BALA, NO SÓLO LA TUYA. Es lo contrario de la
       * regla de los barriles del tren veloz (justo acá abajo), y es a
       * propósito: aquel es un problema que el juego te pone a VOS para que
       * elijas cómo resolverlo, y éste es un lugar donde **nadie** quiere
       * tirotear. Un guardia que te tira y falla también puede volar el
       * vagón, y eso es exactamente lo que hace que pelear ahí adentro sea
       * mala idea para los dos.
       *
       * Los tres tiros de vida (`EXPLOSIVES.cajonPolvora.vida`) son lo que
       * evita que sea una lotería: una bala perdida no basta, hace falta un
       * tiroteo sostenido contra el MISMO cajón.
       */
      if (world.cajones) {
        let pegoCajon = false;
        for (const cj of world.cajones) {
          if (!cj.alive || !pointInBody(b.x, b.y, cj)) continue;
          b.alive = false;
          pegoCajon = true;
          world.bus.emit('impact', { x: b.x, y: b.y, kind: 'wall' });
          /**
           * `b.owner`: el que hizo saltar la mecha se hace cargo de lo que
           * pase después, aunque haya sido sin querer.
           *
           * Y SÓLO SI TODAVÍA TIENE PÓLVORA. Uno al que ya le sacaste el
           * cartucho se hace astillas como cualquier cajón — es la mitad del
           * sentido de vaciarlos: dejan de ser un peligro. Se reusa
           * `rodanteRoto` para las astillas y el ruido porque es exactamente
           * el mismo efecto que ya existe para un barril reventado.
           */
          if (dañarCajon(cj, b.damage)) {
            if (cj.cargado) {
              prenderCajon(cj, world, b.owner);
            } else {
              cj.alive = false;
              world.bus.emit('rodanteRoto', { x: cj.x, y: cj.y, tipo: 'cajon' });
            }
          }
          break;
        }
        if (pegoCajon) break;
      }

      /**
       * LOS BARRILES Y CAJONES SUELTOS: se pueden reventar a tiros.
       *
       * Va ANTES que todo lo demás porque es un bulto físico: el barril que
       * viene rodando te tapa la línea de tiro al guardia que está detrás, y
       * eso es parte de lo que lo hace molesto de verdad.
       *
       * SÓLO LAS TUYAS. Que un guardia te reviente el barril de casualidad
       * sería resolverte el problema por vos, y este es un problema que el
       * juego te pone a vos para que elijas: esquivarlo o gastarle balas.
       */
      if (world.rodantes) {
        let pegoRodante = false;
        for (const ro of world.rodantes) {
          // `balea: false` son las reses de una estampida: pasan de largo, no
          // se revientan. Dispararle a tu propia manada no la frena.
          if (!ro.balea || !ro.alive || !pointInBody(b.x, b.y, ro)) continue;
          /**
           * LOS BARRILES DEL TREN VELOZ SÓLO LOS REVIENTAN TUS BALAS: que un
           * guardia te resolviera el problema de casualidad sería sacarte una
           * decisión que el juego te puso a vos.
           *
           * EL CAJÓN DE PÓLVORA EMPUJADO ES AL REVÉS y lo baleás vos o lo
           * balean ellos: *(Santi: "el guardia tiene que saber leer el barril
           * y tener dos opciones: o correrse hacia un costado o balearlo para
           * romperlo")*. Ahí está la mitad de la gracia del arma — la mandás
           * rodando y el que la ve venir tiene que decidir algo.
           */
          if (b.owner !== 'player' && ro.tipo !== 'polvora') continue;
          b.alive = false;
          pegoRodante = true;
          const rompio = dañarRodante(ro, b.damage);
          world.bus.emit('impact', { x: b.x, y: b.y, kind: 'wall' });
          if (rompio) {
            // Cargado, deja una mecha encendida donde estaba; vacío, se hace
            // astillas y ya. La misma madera, dos finales.
            if (ro.tipo === 'polvora' && ro.cargado) soltarExplosivo(ro.x, ro.y, world, b.owner);
            else world.bus.emit('rodanteRoto', { x: ro.x, y: ro.y, tipo: ro.tipo });
          }
          break;
        }
        if (pegoRodante) break;
      }

      // Los pasajeros paran balas de cualquiera. Matar civiles es una decisión,
      // no un accidente sin consecuencias: el sistema de honor se enganchará acá.
      let hitCivilian = false;
      for (const pa of world.passengers) {
        if (!pa.alive || !pointInBody(b.x, b.y, pa)) continue;
        b.alive = false;
        pa.alive = false;
        pa.hitFlash = 0.12;
        hitCivilian = true;
        world.bus.emit('impact', { x: b.x, y: b.y, kind: 'flesh' });
        world.bus.emit('passengerKilled', { passenger: pa, byPlayer: b.owner === 'player' });
        break;
      }
      if (hitCivilian) break;

      // Las balas de los guardias también le pegan a otros guardias. Ellos
      // tratan de no dispararle a un compañero, pero si te movés bien pueden
      // llegar a matarse entre ellos.
      let hitEnemy = false;
      for (const e of world.enemies) {
        if (!e.alive || !pointInBody(b.x, b.y, e)) continue;
        b.alive = false;
        hitEnemy = true;
        const died = damageEnemy(e, b.damage, b.x - b.vx, b.y - b.vy);
        world.bus.emit('impact', { x: b.x, y: b.y, kind: 'flesh' });
        if (died) world.bus.emit('enemyKilled', { enemy: e, byPlayer: b.owner === 'player' });
        break;
      }
      if (hitEnemy) break;

      // La ley de afuera. Solo tus balas les llegan: las de ellos salen del
      // tren y se pierden, no se matan entre jinetes.
      if (b.owner === 'player' && world.riders) {
        let hitRider = false;
        for (const rd of world.riders) {
          if (!rd.alive || !pointInBody(b.x, b.y, rd)) continue;
          b.alive = false;
          hitRider = true;
          const murio = damageRider(rd, b.damage);
          world.bus.emit('impact', { x: b.x, y: b.y, kind: 'flesh' });
          if (murio) world.bus.emit('riderKilled', { rider: rd });
          break;
        }
        if (hitRider) break;
      }

      if (b.owner === 'enemy') {
        const p = world.player;

        /**
         * Las balas que entran por la ventanilla pasan POR ENCIMA del que está
         * agachado contra la pared, debajo del marco.
         *
         * Hace falta desde que los jinetes tiran a ciegas: si no, meterse
         * debajo de la ventanilla pasaría de ser el refugio a ser una trampa
         * mortal, porque la ventanilla no frena las balas. Es la misma lógica
         * de la vida real por la que uno se agacha bajo el alféizar.
         */
        if (b.fromRider && isHidden(p)) continue;

        if (p.alive && pointInBody(b.x, b.y, p)) {
          const hurt = damagePlayer(p, b.damage, b.x - b.vx, b.y - b.vy);
          if (hurt) {
            b.alive = false;
            world.bus.emit('impact', { x: b.x, y: b.y, kind: 'flesh' });
            world.bus.emit('playerHit', { x: b.x, y: b.y });
            if (!p.alive) world.bus.emit('playerDown', {});
          }
        }
      }
    }
  }

  // Limpiamos las balas muertas una vez por paso.
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (!bullets[i].alive) bullets.splice(i, 1);
  }
}

/**
 * ¿La bala está justo sobre una puerta blindada entera y cerrada? Entonces se
 * come la chapa y muere ahí. Abierta (alguien la está empujando desde adentro)
 * o rota (la volaron con dinamita) deja pasar, como cualquier hueco.
 */
function puertaBlindadaEnMedio(b, world) {
  if (!world.doors) return false;
  for (const d of world.doors) {
    if (d.kind !== 'blindada' || d.broken || d.open) continue;
    if (Math.abs(b.x - d.x) < d.hw && Math.abs(b.y - d.y) < d.hh) return true;
  }
  return false;
}
