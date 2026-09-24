/**
 * EL MUNDO DEL PROTOTIPO: dos vagones, un fuelle y una caja fuerte.
 *
 * ⚠️ ESTO ES UN PROTOTIPO, no el juego. Está escrito para contestar UNA
 * pregunta —"¿el asalto se siente mejor adentro del vagón?"— y para tirarse a
 * la basura sin culpa si la respuesta es que no. Por eso todo es lo más barato
 * posible: cajas, texturas hechas con código y nada de modelos.
 *
 * LA APUESTA DEL ESTILO (el de Barony, el de Quake): en el 3D caro lo que
 * cuesta es el arte. Acá un vagón es una caja con agujeros, las texturas son
 * 32×32 dibujadas a mano con un canvas, y los guardias son estampas planas.
 * Nada de esto necesita un modelador.
 */

import * as THREE from 'three';

/** Medidas en METROS, que es lo que entiende el 3D. Un vagón de verdad. */
export const VAGON = {
  ancho: 2.8,
  alto: 2.4,
  largo: 12,
  /** El fuelle entre los dos vagones. */
  fuelle: 1.4,
};

/** Lo que mide el tren entero, de la puerta de entrada al fondo. */
export const LARGO_TOTAL = VAGON.largo * 2 + VAGON.fuelle;

// ---------------------------------------------------------------- texturas

/**
 * UNA TEXTURA DIBUJADA CON CÓDIGO. Es el mismo oficio que el resto del juego
 * —rectangulitos de colores— sólo que después se pega sobre una cara.
 *
 * `NearestFilter` es lo que la deja a píxeles en vez de borrosa: sin eso, todo
 * el estilo se pierde.
 */
function textura(w, h, dibujo, repetir = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  dibujo(x, w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repetir[0], repetir[1]);
  return t;
}

/** El revuelto de siempre: forma sin listas y sin titilar. */
function revolver(n) {
  let t = (n * 374761393 + 668265263) | 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177);
  return ((t ^ (t >>> 16)) >>> 0) / 4294967296;
}

function pintar(x, color, px, py, w = 1, h = 1) {
  x.fillStyle = color;
  x.fillRect(px, py, w, h);
}

/** El piso: tablones con veta. */
const madera = (repetir) => textura(32, 32, (x) => {
  pintar(x, '#4b3826', 0, 0, 32, 32);
  for (let i = 0; i < 32; i++) {
    for (let j = 0; j < 32; j++) {
      const r = revolver(i * 31 + j * 7);
      if (r > 0.82) pintar(x, '#563f2a', i, j);
      else if (r < 0.14) pintar(x, '#3f2f20', i, j);
    }
  }
  // Las juntas entre tablones.
  for (let j = 0; j < 32; j += 8) pintar(x, '#2c2016', 0, j, 32, 1);
}, repetir);

/** La alfombra del pasillo: lo único de color del vagón. */
const alfombra = (repetir) => textura(32, 32, (x) => {
  pintar(x, '#6b2f28', 0, 0, 32, 32);
  for (let i = 0; i < 32; i++) {
    for (let j = 0; j < 32; j++) {
      const r = revolver(i * 13 + j * 91);
      if (r > 0.86) pintar(x, '#7a3a30', i, j);
      else if (r < 0.1) pintar(x, '#5b2620', i, j);
    }
  }
  pintar(x, '#8a5a3c', 0, 0, 32, 2);
  pintar(x, '#8a5a3c', 0, 30, 32, 2);
}, repetir);

/** Las paredes: madera clara con listón y remaches. */
const pared = (repetir) => textura(32, 32, (x) => {
  pintar(x, '#6d5942', 0, 0, 32, 32);
  for (let i = 0; i < 32; i++) {
    for (let j = 0; j < 32; j++) {
      const r = revolver(i * 57 + j * 23);
      if (r > 0.88) pintar(x, '#7b6650', i, j);
      else if (r < 0.12) pintar(x, '#5d4b37', i, j);
    }
  }
  pintar(x, '#4a3b2b', 0, 22, 32, 2);   // el listón de la mitad
  pintar(x, '#8b755a', 0, 21, 32, 1);
  for (let i = 2; i < 32; i += 8) pintar(x, '#93805f', i, 25, 1, 1);
}, repetir);

/** El techo, más oscuro: es lo que hace que el vagón se sienta bajo. */
const techo = (repetir) => textura(16, 16, (x) => {
  pintar(x, '#3b3128', 0, 0, 16, 16);
  for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
    if (revolver(i * 17 + j * 3) > 0.9) pintar(x, '#453a2f', i, j);
  }
  pintar(x, '#2b241d', 0, 0, 16, 1);
}, repetir);

/** El metal de las puertas y de la caja fuerte. */
const metal = (repetir) => textura(16, 16, (x) => {
  pintar(x, '#4a4a4e', 0, 0, 16, 16);
  for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
    const r = revolver(i * 41 + j * 11);
    if (r > 0.85) pintar(x, '#57575c', i, j);
    else if (r < 0.15) pintar(x, '#3c3c40', i, j);
  }
  for (let i = 1; i < 16; i += 5) { pintar(x, '#6a6a70', i, 1); pintar(x, '#6a6a70', i, 14); }
}, repetir);

// ------------------------------------------------------------------ armado

const mat = (tex, opciones = {}) => new THREE.MeshLambertMaterial({ map: tex, ...opciones });

/**
 * ARMA LOS DOS VAGONES y devuelve lo que el resto necesita: la escena, las
 * cajas contra las que se choca y dónde está la caja fuerte.
 *
 * Las paredes no son cajas: son PLANOS sueltos mirando para adentro. Con eso
 * alcanza —nunca ves el vagón por afuera— y es la mitad de triángulos.
 */
export function armarTren(escena) {
  const choques = [];   // cajas AABB contra las que camina el jugador
  const lamparas = [];

  const geoPlano = new THREE.PlaneGeometry(1, 1);

  function plano(material, x, y, z, ancho, alto, rotY = 0, rotX = 0) {
    const m = new THREE.Mesh(geoPlano, material);
    m.position.set(x, y, z);
    m.scale.set(ancho, alto, 1);
    m.rotation.set(rotX, rotY, 0);
    escena.add(m);
    return m;
  }

  function caja(material, x, y, z, ancho, alto, largo, solido = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, largo), material);
    m.position.set(x, y, z);
    escena.add(m);
    if (solido) {
      choques.push({ x0: x - ancho / 2, x1: x + ancho / 2, z0: z - largo / 2, z1: z + largo / 2, alto: y + alto / 2 });
    }
    return m;
  }

  const matPiso = mat(alfombra([1, 8]));
  const matTabla = mat(madera([2, 8]));
  const matPared = mat(pared([6, 1]));
  const matTecho = mat(techo([2, 10]));
  const matMetal = mat(metal([2, 2]));

  const mitad = VAGON.ancho / 2;

  /** UN VAGÓN, de z0 a z1. */
  function vagon(z0, z1, conAsientos) {
    const largo = z1 - z0;
    const zc = (z0 + z1) / 2;

    // Piso: alfombra en el pasillo, madera a los costados.
    plano(matPiso, 0, 0, zc, 1.2, largo, 0, -Math.PI / 2);
    plano(matTabla, -(mitad + 1.2) / 2 + 0.1, 0.001, zc, mitad - 0.6, largo, 0, -Math.PI / 2);
    plano(matTabla, (mitad + 1.2) / 2 - 0.1, 0.001, zc, mitad - 0.6, largo, 0, -Math.PI / 2);
    // Techo.
    plano(matTecho, 0, VAGON.alto, zc, VAGON.ancho, largo, 0, Math.PI / 2);
    // Paredes largas, mirando para adentro.
    plano(matPared, -mitad, VAGON.alto / 2, zc, largo, VAGON.alto, Math.PI / 2);
    plano(matPared, mitad, VAGON.alto / 2, zc, largo, VAGON.alto, -Math.PI / 2);

    // Ventanas: rectángulos negros con marco, que es lo que da la noche afuera.
    for (let i = 0; i < 5; i++) {
      const z = z0 + 1.6 + i * ((largo - 3.2) / 4);
      for (const lado of [-1, 1]) {
        plano(new THREE.MeshBasicMaterial({ color: 0x0a0c12 }), lado * (mitad - 0.02), 1.5, z, 0.9, 0.7, lado * Math.PI / 2);
      }
    }

    // Asientos: cajas bajas a los dos lados del pasillo.
    if (conAsientos) {
      for (let i = 0; i < 4; i++) {
        const z = z0 + 2 + i * 2.4;
        for (const lado of [-1, 1]) {
          caja(matTabla, lado * (mitad - 0.45), 0.25, z, 0.8, 0.5, 1.1);
          caja(matPiso, lado * (mitad - 0.2), 0.75, z, 0.3, 0.6, 1.1, false);
        }
      }
    }

    // Una lámpara de aceite cada tanto: es toda la luz que hay.
    for (let i = 0; i < 3; i++) {
      const z = z0 + largo * (0.2 + i * 0.3);
      const luz = new THREE.PointLight(0xffb86a, 6, 7, 2);
      luz.position.set(0, VAGON.alto - 0.35, z);
      escena.add(luz);
      lamparas.push(luz);
      const bombita = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 6, 5),
        new THREE.MeshBasicMaterial({ color: 0xffd9a0 })
      );
      bombita.position.copy(luz.position);
      escena.add(bombita);
    }
  }

  // Vagón A (por donde entrás) y vagón B (el de la caja).
  vagon(0, VAGON.largo, true);
  vagon(VAGON.largo + VAGON.fuelle, LARGO_TOTAL, true);

  // El fuelle: más angosto y oscuro, para que se sienta el paso de uno a otro.
  const zf = VAGON.largo + VAGON.fuelle / 2;
  plano(matTabla, 0, 0, zf, 1.2, VAGON.fuelle, 0, -Math.PI / 2);
  plano(matTecho, 0, VAGON.alto - 0.3, zf, 1.2, VAGON.fuelle, 0, Math.PI / 2);
  for (const lado of [-1, 1]) {
    plano(matMetal, lado * 0.6, (VAGON.alto - 0.3) / 2, zf, VAGON.fuelle, VAGON.alto - 0.3, lado * Math.PI / 2);
    // Los tabiques que angostan el paso, a los dos lados de cada puerta.
    for (const z of [VAGON.largo, VAGON.largo + VAGON.fuelle]) {
      caja(matMetal, lado * (mitad / 2 + 0.3), VAGON.alto / 2, z, mitad - 0.6, VAGON.alto, 0.12);
    }
  }

  // La pared del fondo y la de la entrada, para que el tren termine en algo.
  plano(matMetal, 0, VAGON.alto / 2, LARGO_TOTAL, VAGON.ancho, VAGON.alto, Math.PI);
  plano(matMetal, 0, VAGON.alto / 2, 0, VAGON.ancho, VAGON.alto, 0);

  /**
   * LA CAJA FUERTE, al fondo del segundo vagón. Es el objetivo: se fuerza
   * manteniendo [E] cerca de ella.
   */
  const caja1 = caja(matMetal, 0.7, 0.45, LARGO_TOTAL - 1.2, 0.9, 0.9, 0.8);
  const rueda = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.04, 6, 12),
    new THREE.MeshLambertMaterial({ color: 0x8a8a90 })
  );
  rueda.position.set(0.7, 0.5, LARGO_TOTAL - 1.62);
  escena.add(rueda);

  // Los límites del pasillo: no se sale del tren.
  const paredes = { x0: -mitad + 0.25, x1: mitad - 0.25, z0: 0.35, z1: LARGO_TOTAL - 0.35 };

  return {
    choques,
    paredes,
    lamparas,
    rueda,
    cajaFuerte: { x: 0.7, y: 0.5, z: LARGO_TOTAL - 1.62, mesh: caja1 },
    /** Por dónde entraste: volver acá con la plata es ganar. */
    salida: { x: 0, z: 0.9 },
  };
}
