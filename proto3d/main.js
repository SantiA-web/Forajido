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
import { armarTren, receta } from './mundo.js';
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
escena.fog = new THREE.Fog(0x090a0c, 3, 22);
/**
 * LA LUZ DE FONDO. Con el vagón chico alcanzaba con una penumbra apenas
 * insinuada; con 40 metros de largo y 6 de ancho hay mucho más para iluminar,
 * así que sube — si no, el vagón es una cueva y no se ve ni el pasillo.
 */
escena.add(new THREE.AmbientLight(0x6b6050, 1.4));

const camara = new THREE.PerspectiveCamera(74, 16 / 9, 0.05, 90);
const tren = armarTren(escena);

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

/**
 * LAS RONDAS TAMBIÉN SALEN DEL 2D. Cada vagón del juego trae sus guardias con
 * su recorrido (`enemies[].path`, en columnas y filas del layout); acá se toma
 * la primera y la última columna de ese recorrido y el guardia camina entre
 * esas dos. Son los mismos guardias, en los mismos lugares, que los que te
 * esperan cuando jugás el asalto desde arriba.
 */
const guardias = [];
for (const v of tren.cortes) {
  const plantilla = receta(v.id);
  if (!plantilla || !plantilla.enemies) continue;
  for (const e of plantilla.enemies) {
    if (!e.path || e.path.length < 2) continue;
    const cols = e.path.map((p) => p[0]);
    const filas = e.path.map((p) => p[1]);
    const medio = filas.reduce((a, b) => a + b, 0) / filas.length - tren.filas / 2 + 0.5;
    guardias.push(crearGuardia(escena, {
      z0: v.z0 + Math.min(...cols) + 0.5,
      z1: v.z0 + Math.max(...cols) + 0.5,
      // Acá caminan sólo por el pasillo: la ronda del 2D entra y sale de los
      // recovecos, y el prototipo todavía no sabe doblar.
      x: Math.max(-0.5, Math.min(0.5, medio)),
    }));
  }
}

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

/**
 * CHOCAR CONTRA EL TREN. No hay una lista de cajas: se le pregunta a la GRILLA
 * del 2D, baldosa por baldosa, igual que hace el juego de arriba. El cuerpo es
 * un cuadradito de 30 cm, y los dos ejes se prueban por separado: eso es lo que
 * hace que resbales por una pared en vez de quedarte pegado a ella.
 */
const CUERPO = 0.3;

function libre(x, z, alturaOjos) {
  for (const dx of [-CUERPO, CUERPO]) {
    for (const dz of [-CUERPO, CUERPO]) {
      if (tren.esSolido(x + dx, z + dz, alturaOjos)) return false;
    }
  }
  return true;
}

function chocar(x, z, alturaOjos) {
  let nx = jugador.x, nz = jugador.z;
  if (libre(x, nz, alturaOjos)) nx = x;
  if (libre(nx, z, alturaOjos)) nz = z;
  return [nx, nz];
}

function moverme(dt) {
  if (!jugador.vivo) return;
  jugador.agachado = teclas.has('ControlLeft') || teclas.has('ControlRight');
  jugador.corriendo = teclas.has('ShiftLeft') && !jugador.agachado;

  const adelante = (teclas.has('KeyW') ? 1 : 0) - (teclas.has('KeyS') ? 1 : 0);
  const costado = (teclas.has('KeyD') ? 1 : 0) - (teclas.has('KeyA') ? 1 : 0);
  /**
   * LAS VELOCIDADES SALEN DEL 2D TAMBIÉN, si no un vagón de 40 m se siente un
   * galpón: `CONFIG.player.speed` son 78 unidades por segundo y una unidad son
   * 6,25 cm, o sea 4,9 m/s. Es rapidísimo para una persona de verdad, pero es
   * exactamente lo que corre tu personaje hoy — y da la casualidad de que es
   * la velocidad del Quake, que es el estilo que estamos probando.
   */
  const vel = (jugador.agachado ? 2.5 : jugador.corriendo ? 6.5 : 4.9) * dt;

  if (adelante || costado) {
    const largo = Math.hypot(adelante, costado) || 1;
    // Adelante y el costado derecho, tal como los entiende la cámara.
    const dx = (-Math.sin(jugador.giro) * adelante + Math.cos(jugador.giro) * costado) / largo;
    const dz = (-Math.cos(jugador.giro) * adelante - Math.sin(jugador.giro) * costado) / largo;
    const [nx, nz] = chocar(jugador.x + dx * vel, jugador.z + dz * vel, jugador.y);
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
  const cerca = Math.hypot(jugador.x - c.x, jugador.z - c.z) < 1.6;

  if (!jugador.tieneLaPlata) {
    if (cerca && teclas.has('KeyE')) {
      jugador.forzando = Math.min(1, jugador.forzando + dt / 2.2);
      hud.cartel.textContent = `FORZANDO LA CAJA… ${Math.round(jugador.forzando * 100)}%`;
      // Forzar hace ruido: los que estén cerca te empiezan a buscar.
      for (const g of guardias) {
        if (g.vivo && Math.abs(g.z - c.z) < 12) g.sospecha = Math.min(1, g.sospecha + dt * 0.5);
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
  /**
   * EL TREN ESTÁ ANDANDO, y esto es todo lo que hace falta para decirlo: las
   * dos texturas de la noche se corren de costado. La del enganche va casi
   * tres veces más rápido que la de la ventanilla, porque lo que se ve desde
   * la plataforma está mucho más cerca que el cerro del fondo — el mismo
   * truco de siempre para dar profundidad sin dibujar profundidad.
   */
  tren.texNoche.offset.x -= dt * 0.22;
  tren.texCampo.offset.x -= dt * 0.6;

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
