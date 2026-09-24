/**
 * PROTOTIPO 3D DEL ASALTO — dos vagones, tres guardias, una caja fuerte.
 *
 * ⚠️ NO ES EL JUEGO. Es un experimento aparte para contestar UNA pregunta:
 * ¿el asalto se siente mejor adentro del vagón que mirándolo desde arriba?
 * No toca ni una línea de lo que ya existe: lo único que le pide prestado al
 * juego es el dibujo de las personas (ver guardias.js).
 *
 * LA CÁMARA ES PRIMERA PERSONA porque es la más barata que hay: no hay que
 * dibujar al jugador, ni animarlo, ni resolver dónde poner la cámara para que
 * no atraviese una pared.
 *
 * ⚠️ Y LO QUE ESTE PROTOTIPO TAMBIÉN PRUEBA, aunque no se vea: en primera
 * persona NO VES LO QUE TENÉS DETRÁS. El sigilo del juego hoy se juega
 * mirando desde arriba, viendo al guardia y su barrita. Acá eso se vuelve
 * oído y nuca. Es otro juego de sigilo, y la pregunta es si es mejor.
 */

import * as THREE from 'three';
import { armarTren, VAGON, LARGO_TOTAL } from './mundo.js';
import { crearGuardia, moverGuardia, voltear } from './guardias.js';

const lienzo = document.getElementById('lienzo');
const hud = {
  objetivo: document.getElementById('objetivo'),
  cartel: document.getElementById('cartel'),
  aviso: document.getElementById('aviso'),
  costo: document.getElementById('costo'),
  tapa: document.getElementById('tapa'),
};

// ------------------------------------------------------------------ escena

const escena = new THREE.Scene();
escena.background = new THREE.Color(0x090a0c);
/**
 * LA NIEBLA NO ES DECORACIÓN: es lo que hace que el fondo del vagón se pierda
 * en la penumbra y que la luz de las lámparas signifique algo. Y de paso tapa
 * el final del tren sin tener que dibujarlo.
 */
escena.fog = new THREE.Fog(0x090a0c, 3, 20);
escena.add(new THREE.AmbientLight(0x4a4436, 1.1));

const camara = new THREE.PerspectiveCamera(74, 16 / 9, 0.05, 40);
const tren = armarTren(escena);
tren.largoVagon = VAGON.largo;
tren.fuelle = VAGON.fuelle;

const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);

/** El lienzo se dibuja CHICO y el navegador lo estira: el look y la velocidad. */
function medir() {
  const alto = 270;
  const w = window.innerWidth || 960;
  const h = window.innerHeight || 540;
  const ancho = Math.max(160, Math.round(alto * (w / h)));
  renderer.setSize(ancho, alto, false);
  camara.aspect = ancho / alto;
  camara.updateProjectionMatrix();
}
window.addEventListener('resize', medir);
medir();

// ----------------------------------------------------------------- jugador

const ALTO_OJOS = 1.62;
const ALTO_AGACHADO = 1.05;

const jugador = {
  x: 0, z: 1.2, y: ALTO_OJOS,
  /** Arrancás mirando al fondo del tren: con giro 0 la cámara mira al revés. */
  giro: Math.PI, mirada: 0,
  agachado: false, corriendo: false,
  balas: 6, recargando: 0,
  vida: 3,
  forzando: 0,
  tieneLaPlata: false,
  vivo: true,
};

const teclas = new Set();
window.addEventListener('keydown', (e) => {
  teclas.add(e.code);
  if (['Space', 'ControlLeft', 'KeyE'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => teclas.delete(e.code));

hud.tapa.addEventListener('click', () => lienzo.requestPointerLock());
document.addEventListener('pointerlockchange', () => {
  hud.tapa.style.display = document.pointerLockElement === lienzo ? 'none' : 'grid';
});
document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== lienzo) return;
  jugador.giro -= e.movementX * 0.0022;
  jugador.mirada = Math.max(-1.2, Math.min(1.2, jugador.mirada - e.movementY * 0.0022));
});
document.addEventListener('mousedown', (e) => {
  if (document.pointerLockElement !== lienzo || e.button !== 0) return;
  tirar();
});

// ---------------------------------------------------------------- guardias

const guardias = [
  crearGuardia(escena, { z0: 3.5, z1: 9, x: 0.15 }),
  crearGuardia(escena, { z0: VAGON.largo + VAGON.fuelle + 1.5, z1: LARGO_TOTAL - 3, x: -0.2 }),
  crearGuardia(escena, { z0: LARGO_TOTAL - 5, z1: LARGO_TOTAL - 1.8, x: 0.3 }),
];

let alarma = false;
function avisar() {
  if (!alarma) {
    alarma = true;
    hud.aviso.textContent = '¡TE VIERON!';
  }
  // El que grita despierta a los demás: lo mismo que hace el juego de arriba.
  for (const g of guardias) if (g.vivo) g.sospecha = Math.max(g.sospecha, 0.8);
}

// --------------------------------------------------------------- disparar

const fogonazo = new THREE.PointLight(0xffd8a0, 0, 6, 2);
escena.add(fogonazo);
let fogonazoT = 0;

const rayo = new THREE.Raycaster();
function tirar() {
  if (!jugador.vivo || jugador.recargando > 0) return;
  if (jugador.balas <= 0) { jugador.recargando = 1.4; return; }
  jugador.balas -= 1;
  fogonazoT = 0.07;

  rayo.setFromCamera(new THREE.Vector2(0, 0), camara);
  const blancos = guardias.filter((g) => g.vivo).map((g) => g.mesh);
  const toque = rayo.intersectObjects(blancos, false)[0];
  if (toque) {
    const g = guardias.find((x) => x.mesh === toque.object);
    if (g) { voltear(g, escena); avisar(); }
  }
}

// -------------------------------------------------------------- moverse

function chocar(x, z) {
  const p = tren.paredes;
  const nx = Math.max(p.x0, Math.min(p.x1, x));
  let nz = Math.max(p.z0, Math.min(p.z1, z));
  let fx = nx;
  // El fuelle es angosto: en esa franja hay que ir por el medio.
  const enFuelle = nz > VAGON.largo - 0.3 && nz < VAGON.largo + VAGON.fuelle + 0.3;
  if (enFuelle) fx = Math.max(-0.45, Math.min(0.45, nx));
  // Y los asientos: cajas contra las que no se pasa.
  for (const c of tren.choques) {
    if (c.alto < 0.45) continue;   // los asientos bajos se esquivan solos
    if (fx > c.x0 - 0.28 && fx < c.x1 + 0.28 && nz > c.z0 - 0.28 && nz < c.z1 + 0.28) {
      // Se sale por donde menos haya entrado.
      const salirX = fx < (c.x0 + c.x1) / 2 ? c.x0 - 0.28 : c.x1 + 0.28;
      const salirZ = nz < (c.z0 + c.z1) / 2 ? c.z0 - 0.28 : c.z1 + 0.28;
      if (Math.abs(salirX - fx) < Math.abs(salirZ - nz)) fx = salirX; else nz = salirZ;
    }
  }
  return [fx, nz];
}

function moverme(dt) {
  if (!jugador.vivo) return;
  jugador.agachado = teclas.has('ControlLeft') || teclas.has('ControlRight');
  jugador.corriendo = teclas.has('ShiftLeft') && !jugador.agachado;

  const adelante = (teclas.has('KeyW') ? 1 : 0) - (teclas.has('KeyS') ? 1 : 0);
  const costado = (teclas.has('KeyD') ? 1 : 0) - (teclas.has('KeyA') ? 1 : 0);
  const vel = (jugador.agachado ? 1.1 : jugador.corriendo ? 3.4 : 2.2) * dt;

  if (adelante || costado) {
    const largo = Math.hypot(adelante, costado) || 1;
    // Adelante y el costado derecho, tal como los entiende la cámara.
    const dx = (-Math.sin(jugador.giro) * adelante + Math.cos(jugador.giro) * costado) / largo;
    const dz = (-Math.cos(jugador.giro) * adelante - Math.sin(jugador.giro) * costado) / largo;
    const [nx, nz] = chocar(jugador.x + dx * vel, jugador.z + dz * vel);
    jugador.x = nx; jugador.z = nz;
  }

  const objetivoY = jugador.agachado ? ALTO_AGACHADO : ALTO_OJOS;
  jugador.y += (objetivoY - jugador.y) * Math.min(1, dt * 12);

  camara.position.set(jugador.x, jugador.y, jugador.z);
  camara.rotation.set(jugador.mirada, jugador.giro, 0, 'YXZ');
}

// -------------------------------------------------------------- objetivo

function objetivo(dt) {
  if (!jugador.vivo) return;
  const c = tren.cajaFuerte;
  const cerca = Math.hypot(jugador.x - c.x, jugador.z - c.z) < 1.3;

  if (!jugador.tieneLaPlata) {
    if (cerca && teclas.has('KeyE')) {
      jugador.forzando = Math.min(1, jugador.forzando + dt / 2.2);
      hud.cartel.textContent = `FORZANDO LA CAJA… ${Math.round(jugador.forzando * 100)}%`;
      // Forzar hace ruido: los que estén cerca te empiezan a buscar.
      for (const g of guardias) {
        if (g.vivo && Math.abs(g.z - c.z) < 8) g.sospecha = Math.min(1, g.sospecha + dt * 0.5);
      }
      if (jugador.forzando >= 1) {
        jugador.tieneLaPlata = true;
        hud.cartel.textContent = '';
        hud.objetivo.textContent = 'OBJETIVO: volver a la puerta del primer vagón';
        tren.rueda.rotation.z += 1;
      }
    } else if (cerca) {
      hud.cartel.textContent = 'MANTENÉ [E] PARA FORZAR LA CAJA';
      jugador.forzando = Math.max(0, jugador.forzando - dt);
    } else {
      hud.cartel.textContent = '';
      jugador.forzando = Math.max(0, jugador.forzando - dt);
    }
  } else if (jugador.z < tren.salida.z + 0.6) {
    terminar('ESCAPASTE CON LA PLATA');
  }
}

let fin = null;
function terminar(texto) {
  if (fin) return;
  fin = texto;
  hud.cartel.textContent = `${texto}\n\n[F5] para probar de nuevo`;
  document.exitPointerLock();
}

// ------------------------------------------------------------------ bucle

let antes = performance.now();
let acumulado = 0, cuadros = 0;

/**
 * UN PASO DEL MUNDO, aparte de dibujar. Está separado por la misma razón que
 * en el juego de arriba: así se puede correr sin pantalla desde la consola
 * para medir, que es como se afinó todo lo demás.
 */
function paso(dt) {
  if (!fin) {
    moverme(dt);
    objetivo(dt);

    for (const g of guardias) {
      moverGuardia(g, dt, jugador, tren, avisar);
      if (g.tira) {
        g.tira = false;
        // Te pega si te ve y no estás tapado: el prototipo no hila más fino.
        const dist = Math.hypot(g.x - jugador.x, g.z - jugador.z);
        if (dist < 12 && Math.random() < 0.55) {
          jugador.vida -= 1;
          hud.aviso.textContent = jugador.vida > 0 ? `¡TE DIERON! (${jugador.vida})` : '';
          if (jugador.vida <= 0) { jugador.vivo = false; terminar('TE AGARRARON'); }
        }
      }
    }

    if (jugador.recargando > 0) {
      jugador.recargando -= dt;
      if (jugador.recargando <= 0) jugador.balas = 6;
    }
    if (teclas.has('KeyR') && jugador.balas < 6 && jugador.recargando <= 0) jugador.recargando = 1.4;
  }
}

function pintar(dt) {
  // El fogonazo: un destello corto pegado a la cámara.
  fogonazoT = Math.max(0, fogonazoT - dt);
  fogonazo.position.copy(camara.position);
  fogonazo.intensity = fogonazoT > 0 ? 14 : 0;

  // La estampa de cada guardia gira para quedar de frente a la cámara.
  for (const g of guardias) if (g.vivo) g.mesh.rotation.y = jugador.giro;

  renderer.render(escena, camara);
}

function cuadro(ahora) {
  requestAnimationFrame(cuadro);
  const dt = Math.min(0.05, (ahora - antes) / 1000);
  antes = ahora;
  const t0 = performance.now();

  paso(dt);
  pintar(dt);

  acumulado += performance.now() - t0; cuadros++;
  if (cuadros >= 30) {
    const sospecha = Math.max(0, ...guardias.filter((g) => g.vivo).map((g) => g.sospecha));
    hud.costo.textContent = `${(acumulado / cuadros).toFixed(2)} ms/cuadro · `
      + `${jugador.balas} balas · sospecha ${Math.round(sospecha * 100)}%`
      + (alarma ? ' · ALARMA' : '');
    acumulado = 0; cuadros = 0;
  }
}
requestAnimationFrame(cuadro);

/** Para mirarlo y medirlo desde la consola, igual que el juego. */
window.PROTO = { escena, camara, jugador, guardias, tren, renderer, teclas, paso, pintar, tirar };
