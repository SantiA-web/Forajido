/**
 * LOS GUARDIAS DEL PROTOTIPO: estampas planas que siempre te miran.
 *
 * 🎯 ACÁ ESTÁ LA IDEA QUE HACE BARATO TODO ESTO. Un guardia en 3D "de verdad"
 * es un modelo con esqueleto y ocho animaciones. Acá es **el mismo dibujo que
 * ya tiene el juego** (`entities/figura.js`, el que se ve desde arriba) pegado
 * en un cartel que gira para quedar siempre de frente a la cámara. Es lo que
 * hacía Doom, y es la razón por la que este prototipo no necesita un modelador.
 *
 * Y como el dibujo del juego ya tiene VISTAS —de frente, de espaldas, de
 * costado—, se elige la vista según hacia dónde está mirando el guardia con
 * respecto a vos. Eso da, gratis, la sensación de que el tipo se da vuelta.
 */

import * as THREE from 'three';
import { dibujarPersona, ALTO_PERSONA } from '../src/entities/figura.js';

/** Cuántas unidades del dibujo entran en un metro del mundo 3D. */
const UNIDADES_POR_METRO = ALTO_PERSONA / 1.75;

/**
 * UN RENDERER DE MENTIRA, para poder llamar al dibujo del juego.
 *
 * `dibujarPersona` necesita dos cosas: `rect` y un `ctx` **que ya venga con la
 * lupa puesta** — adentro hace `drawImage` en unidades del mundo, confiando en
 * que el contexto las convierte a puntos de pantalla. Por eso acá la escala va
 * en el `setTransform` del contexto y no multiplicando cada rectángulo: la
 * primera versión lo hacía al revés y el guardia salía del tamaño de una
 * uña, dibujado en la esquina de la estampa.
 */
function lienzoParaSprite(ancho, alto, escala) {
  const c = document.createElement('canvas');
  c.width = Math.round(ancho * escala);
  c.height = Math.round(alto * escala);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(escala, 0, 0, escala, 0, 0);
  const r = {
    ctx,
    rect(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    },
  };
  return { canvas: c, r };
}

/**
 * DIBUJA UNA ESTAMPA del guardia mirando a tal lado, en tal cuadro de la
 * caminata, y la guarda: son cuatro vistas por dos cuadros, así que se dibujan
 * ocho veces en toda la partida y después se reusan.
 */
const cache = new Map();
function estampa(ropa, angulo, fase, postura) {
  const clave = `${ropa}|${Math.round(angulo * 4)}|${Math.round(fase * 2)}|${postura}`;
  if (cache.has(clave)) return cache.get(clave);

  const ANCHO = 22, ALTO = 24, ESCALA = 5;
  const { canvas, r } = lienzoParaSprite(ANCHO, ALTO, ESCALA);
  dibujarPersona(r, {
    x: ANCHO / 2,
    pies: ALTO - 1,
    tipo: ropa,
    angulo,
    postura,
    fase,
    modo: 'caminar',
  });
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  cache.set(clave, t);
  return t;
}

/**
 * UN GUARDIA. Camina entre dos puntos del pasillo, te va viendo de a poco
 * —la misma sospecha progresiva del juego, en versión corta— y cuando se
 * llena, grita y tira.
 */
export function crearGuardia(escena, { z0, z1, x = 0, ropa = 'guardia' }) {
  const geo = new THREE.PlaneGeometry(22 / UNIDADES_POR_METRO, 24 / UNIDADES_POR_METRO);
  const material = new THREE.MeshBasicMaterial({
    map: estampa(ropa, Math.PI / 2, 0, 'pie'),
    transparent: true,
    alphaTest: 0.5,
    // Sin luz: la estampa ya viene pintada. Con luz quedaría negra en la
    // penumbra y no se vería nada — y para el prototipo alcanza así.
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, (24 / UNIDADES_POR_METRO) / 2 - 0.05, z0);
  escena.add(mesh);

  return {
    mesh, ropa,
    x, z: z0, z0, z1,
    /** Para dónde camina: 1 hacia el fondo, -1 hacia la puerta. */
    dir: 1,
    mirando: 1,
    fase: 0,
    vivo: true,
    sospecha: 0,
    alerta: false,
    apunta: 0,
    cadencia: 0,
    espera: 0,
  };
}

/** Lo que ve un guardia: cono, distancia y nada de paredes en el medio. */
const VISION = { lejos: 9, cono: Math.cos(0.7), cerca: 2.2 };

export function moverGuardia(g, dt, jugador, mundo, avisar) {
  if (!g.vivo) return;

  const dx = jugador.x - g.x;
  const dz = jugador.z - g.z;
  const dist = Math.hypot(dx, dz);

  /**
   * ¿TE VE? Tiene que estar mirando para tu lado y no tener un tabique en el
   * medio. Lo de los tabiques se resuelve con la cuenta más barata que hay:
   * si están en vagones distintos, no se ven — salvo que estés en el fuelle.
   */
  const haciaVos = Math.sign(dz) === g.mirando || dist < VISION.cerca;
  const mismoLado = mismoVagon(g.z, jugador.z, mundo);
  const leVes = dist < VISION.lejos && haciaVos && mismoLado;

  if (leVes) {
    // Más cerca y más rápido te movés, más rápido te ve. Agachado, mucho menos.
    const cerca = 1 - Math.min(1, dist / VISION.lejos);
    const ruido = jugador.agachado ? 0.35 : jugador.corriendo ? 1.3 : 1;
    g.sospecha = Math.min(1, g.sospecha + dt * (0.35 + cerca * 1.1) * ruido);
  } else {
    g.sospecha = Math.max(0, g.sospecha - dt * 0.25);
  }

  if (!g.alerta && g.sospecha >= 1) {
    g.alerta = true;
    avisar(g);
  }

  if (g.alerta) {
    // En alerta no patrulla: se planta, te mira y tira cada tanto.
    g.mirando = dz >= 0 ? 1 : -1;
    g.cadencia -= dt;
    if (g.apunta > 0) {
      g.apunta -= dt;
      if (g.apunta <= 0) g.tira = true;   // lo resuelve main.js, que sabe del jugador
    } else if (g.cadencia <= 0 && leVes) {
      g.apunta = 0.55;
      g.cadencia = 1.6 + Math.random() * 0.8;
    }
  } else {
    // Patrulla: va de una punta a la otra de su pedazo de pasillo.
    g.espera -= dt;
    if (g.espera <= 0) {
      g.z += g.dir * dt * 1.1;
      g.fase += dt * 5;
      if (g.z > g.z1) { g.z = g.z1; g.dir = -1; g.espera = 1.2; }
      if (g.z < g.z0) { g.z = g.z0; g.dir = 1; g.espera = 1.2; }
      g.mirando = g.dir;
    }
  }

  // La estampa: la vista sale de para dónde mira ÉL contra dónde estás VOS.
  const deFrenteAVos = g.mirando * Math.sign(dz || 1) < 0;
  const angulo = deFrenteAVos ? Math.PI / 2 : -Math.PI / 2;
  const quieto = g.alerta || g.espera > 0;
  g.mesh.material.map = estampa(g.ropa, angulo, quieto ? 0 : g.fase, 'pie');
  g.mesh.material.needsUpdate = true;
  g.mesh.position.set(g.x, g.mesh.position.y, g.z);
}

/** Dos puntos están en el mismo vagón si no hay un fuelle entre medio. */
function mismoVagon(za, zb, mundo) {
  const corte1 = mundo.largoVagon;
  const corte2 = mundo.largoVagon + mundo.fuelle;
  const cual = (z) => (z < corte1 ? 0 : z > corte2 ? 2 : 1);
  const a = cual(za), b = cual(zb);
  return a === b || a === 1 || b === 1;
}

/** Lo voltea: en el prototipo, un tiro basta. */
export function voltear(g, escena) {
  g.vivo = false;
  g.alerta = false;
  escena.remove(g.mesh);
}
