/**
 * EL MUNDO DEL PROTOTIPO: el tren del juego, levantado en tres dimensiones.
 *
 * ⚠️ ESTO ES UN PROTOTIPO, no el juego. Está escrito para contestar UNA
 * pregunta —"¿el asalto se siente mejor adentro del vagón?"— y para tirarse a
 * la basura sin culpa si la respuesta es que no.
 *
 * 🎯 LA IDEA QUE HACE QUE ESTO VALGA COMO PRUEBA: el vagón NO está inventado.
 * Se genera leyendo el MISMO `layout` que juega el 2D (`data/wagons.js`): los
 * catorce recovecos de los asientos, las ventanillas donde van, el enganche al
 * aire libre. Si fuera un pasillo dibujado a ojo, comparar 2D contra 3D no
 * probaría nada — se estarían comparando dos mapas distintos.
 *
 * *(Santi, después de jugar la primera versión: "el vagón que me diste es
 * diminuto, agrandalo teniendo en cuenta las dimensiones del 2D")* — tenía
 * razón: medía 12 m de largo por 2,8 de ancho, o sea tres veces y media más
 * corto y la mitad de ancho que el vagón que juega él.
 *
 * 📏 LA ESCALA: **1 baldosa del 2D = 1 metro**. Sale de la HUELLA del cuerpo
 * (`CONFIG.player.hw 4.5, hh 3.5` → 9x7 unidades ≈ 55 cm de ancho de persona),
 * que es la medida honesta para un plano de piso. La otra cuenta posible —el
 * alto del dibujo, `ALTO_PERSONA 20` ≈ 1,75 m— daría 1,4 m por baldosa, pero
 * los muñecos de tres cuartos SIEMPRE se dibujan más altos de lo que miden, así
 * que inflaría el vagón un 40%.
 *
 * Con eso, el vagón de pasajeros mide 40 x 10 baldosas = **40 m de largo por
 * 10 de ancho** (6 de interior: 2 de pasillo y 2 de asientos por banda).
 *
 * LA APUESTA DEL ESTILO (el de Barony, el de Quake): en el 3D caro lo que
 * cuesta es el arte. Acá las texturas son 32x32 dibujadas con código y los
 * guardias son estampas planas. Nada de esto necesita un modelador.
 */

import * as THREE from 'three';
import { WAGONS, TRAMOS } from '../src/data/wagons.js';

/**
 * LA RECETA DE UN TRAMO DEL TREN. Los vagones viven en `WAGONS` y los pedazos
 * que no son vagones —el enganche al aire libre— en `TRAMOS`: los dos tienen
 * `layout`, así que el prototipo los trata igual.
 */
export const receta = (id) => WAGONS[id] || TRAMOS[id];

/** Cuántos metros mide una baldosa del 2D. Ver el comentario de arriba. */
export const BALDOSA = 1;

/** Alturas, en metros. */
export const ALTO = 2.5;
const ALTO_ASIENTO = 1.0;
const ALTO_CARGA = 1.5;

/**
 * DE QUÉ ESTÁ HECHO EL TREN DEL PROTOTIPO. Dos vagones y el enganche, igual
 * que antes, pero ahora son los vagones de verdad: el de pasajeros (donde
 * entrás, lleno de recovecos) y el blindado (corto, con cajones de carga y la
 * caja fuerte al fondo).
 */
export const COMPOSICION = ['pasajeros', 'enganche', 'blindado'];

/** Qué carácter del layout es piso pisable y cuál es macizo, y cuánto mide. */
const PISO = new Set(['.', '+', 'E']);
const ALTURA = { '#': ALTO, 'W': ALTO, 'S': ALTO_ASIENTO, 'C': ALTO_CARGA };

// ---------------------------------------------------------------- texturas

/**
 * UNA TEXTURA DIBUJADA CON CÓDIGO. Es el mismo oficio que el resto del juego
 * —rectangulitos de colores— sólo que después se pega sobre una cara.
 *
 * `NearestFilter` es lo que la deja a píxeles en vez de borrosa: sin eso, todo
 * el estilo se pierde.
 */
function textura(w, h, dibujo) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  dibujo(x, w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  /**
   * 🐛 SIN ESTO, LOS COLORES OSCUROS SALEN MUCHO MÁS CLAROS DE LO QUE SON. El
   * dibujo se hace en un canvas, que trabaja en sRGB (los mismos colores de
   * siempre, los de `#4b3826`); si no se le avisa, three lo toma como si ya
   * estuviera en luz lineal y lo vuelve a convertir al pintarlo. El cielo de
   * noche, que es casi negro, terminaba siendo una pared celeste.
   */
  t.colorSpace = THREE.SRGBColorSpace;
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

/** Granito de ruido encima de un color, que es lo que saca el plano plástico. */
function grano(x, semilla, claro, oscuro, n = 32) {
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const r = revolver(i * semilla + j * 7 + semilla);
      if (r > 0.84) pintar(x, claro, i, j);
      else if (r < 0.13) pintar(x, oscuro, i, j);
    }
  }
}

/** El piso de tablones de las bandas. */
const madera = () => textura(32, 32, (x) => {
  pintar(x, '#4b3826', 0, 0, 32, 32);
  grano(x, 31, '#563f2a', '#3f2f20');
  for (let j = 0; j < 32; j += 8) pintar(x, '#2c2016', 0, j, 32, 1);
});

/** La alfombra del pasillo: lo único de color del vagón. */
const alfombra = () => textura(32, 32, (x) => {
  pintar(x, '#6b2f28', 0, 0, 32, 32);
  grano(x, 13, '#7a3a30', '#5b2620');
  pintar(x, '#8a5a3c', 0, 0, 32, 2);
  pintar(x, '#8a5a3c', 0, 30, 32, 2);
});

/** Las paredes: madera clara con listón a la altura del hombro y remaches. */
const pared = () => textura(32, 32, (x) => {
  pintar(x, '#6d5942', 0, 0, 32, 32);
  grano(x, 57, '#7b6650', '#5d4b37');
  pintar(x, '#4a3b2b', 0, 22, 32, 2);
  pintar(x, '#8b755a', 0, 21, 32, 1);
  for (let i = 2; i < 32; i += 8) pintar(x, '#93805f', i, 25, 1, 1);
});

/** El respaldo de los asientos: tapizado gastado. */
const tapizado = () => textura(32, 32, (x) => {
  pintar(x, '#5c4a2e', 0, 0, 32, 32);
  grano(x, 71, '#6b5836', '#4c3d25');
  for (let j = 4; j < 32; j += 10) pintar(x, '#47391f', 0, j, 32, 1);
});

/** Los cajones del blindado. */
const cajon = () => textura(32, 32, (x) => {
  pintar(x, '#57432c', 0, 0, 32, 32);
  grano(x, 23, '#634e34', '#463625');
  pintar(x, '#3a2c1d', 0, 0, 32, 2);
  pintar(x, '#3a2c1d', 0, 30, 32, 2);
  pintar(x, '#3a2c1d', 0, 0, 2, 32);
  pintar(x, '#3a2c1d', 30, 0, 2, 32);
  pintar(x, '#6d573a', 2, 14, 28, 2);
});

/** El techo, más oscuro: es lo que hace que el vagón se sienta bajo. */
const techo = () => textura(32, 32, (x) => {
  pintar(x, '#3b3128', 0, 0, 32, 32);
  grano(x, 17, '#453a2f', '#332a22');
  pintar(x, '#2b241d', 0, 0, 32, 2);
});

/** El metal de las puertas, del enganche y de la caja fuerte. */
const metal = () => textura(32, 32, (x) => {
  pintar(x, '#4a4a4e', 0, 0, 32, 32);
  grano(x, 41, '#57575c', '#3c3c40');
  for (let i = 2; i < 32; i += 9) { pintar(x, '#6a6a70', i, 2, 1, 2); pintar(x, '#6a6a70', i, 28, 1, 2); }
});

/**
 * LA NOCHE QUE SE VE POR LA VENTANILLA.
 *
 * Es una sola textura angosta que se repite y que después main.js va corriendo
 * de costado: eso, y nada más, es "el tren está andando". Es el truco más
 * barato que hay para que el vagón deje de ser un pasillo quieto.
 */
const noche = () => textura(32, 32, (x) => {
  /**
   * De arriba hacia abajo: cielo casi negro, que aclara al acercarse al
   * horizonte; los cerros, MÁS OSCUROS que el cielo (si no, se ven como una
   * mancha clara y parece de día); y abajo el desierto pasando.
   */
  for (let j = 0; j < 21; j++) {
    const t = j / 20;
    const c = Math.round(5 + t * 12);
    pintar(x, `rgb(${c},${c + 2},${c + 9})`, 0, j, 32, 1);
  }
  for (let i = 0; i < 32; i++) {
    if (revolver(i * 91) > 0.86) pintar(x, '#8a93aa', i, Math.floor(revolver(i * 7) * 10));
  }
  // Los cerros del fondo, y algún cactus recortado contra el cielo.
  for (let i = 0; i < 32; i++) {
    const cerro = 19 + Math.round(Math.sin(i * 0.55) * 2 + revolver(i * 13) * 2);
    pintar(x, '#0a0b12', i, cerro, 1, 32 - cerro);
    if (revolver(i * 57) > 0.93) pintar(x, '#080910', i, cerro - 3, 1, 3);
  }
  // El suelo pegado a la vía: es lo que de verdad se ve correr.
  pintar(x, '#141210', 0, 26, 32, 6);
  for (let i = 0; i < 32; i++) {
    for (let j = 26; j < 32; j++) {
      const r = revolver(i * 29 + j * 71);
      if (r > 0.88) pintar(x, '#1d1a16', i, j);
      else if (r < 0.1) pintar(x, '#0d0c0a', i, j);
    }
  }
});

// ------------------------------------------------------ armado de la malla

/**
 * UN MONTÓN DE CARAS QUE DESPUÉS SE VUELVEN UNA SOLA MALLA.
 *
 * ⚠️ ACÁ ESTÁ LO QUE HACE QUE ESTO CORRA. El tren tiene ~1.200 caras: si cada
 * una fuera su propio objeto, serían 1.200 llamadas de dibujo y el prototipo
 * iría a los tumbos. Se juntan todas las que comparten textura en UNA malla,
 * así el tren entero se dibuja en seis llamadas.
 *
 * Las UV se miden en METROS, no de 0 a 1: así la textura se repite sola una vez
 * por metro y una pared de 40 m no queda con el dibujo estirado.
 */
function malla() {
  return { pos: [], nor: [], uv: [] };
}

function cara(m, verts, normal, uvs) {
  const orden = [0, 1, 2, 0, 2, 3];
  for (const i of orden) {
    m.pos.push(verts[i][0], verts[i][1], verts[i][2]);
    m.nor.push(normal[0], normal[1], normal[2]);
    m.uv.push(uvs[i][0], uvs[i][1]);
  }
}

/** Una tapa horizontal (piso si mira para arriba, techo si mira para abajo). */
function horizontal(m, x0, x1, z0, z1, y, haciaArriba) {
  const v = [[x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0]];
  const uv = [[0, 0], [x1 - x0, 0], [x1 - x0, z1 - z0], [0, z1 - z0]];
  if (haciaArriba) cara(m, v, [0, 1, 0], uv);
  else cara(m, [v[3], v[2], v[1], v[0]], [0, -1, 0], uv);
}

/** Una cara vertical perpendicular al eje X (una pared del costado del vagón). */
function enX(m, x, z0, z1, y0, y1, haciaMasX) {
  const v = haciaMasX
    ? [[x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1]]
    : [[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]];
  // La V va en ALTURA ABSOLUTA, no desde el pie de la cara: así el listón de
  // la pared cae siempre a la misma altura, tanto en el pedazo que baja hasta
  // el piso como en el que arranca arriba del respaldo de un asiento.
  const uv = [[0, y0], [z1 - z0, y0], [z1 - z0, y1], [0, y1]];
  cara(m, v, [haciaMasX ? 1 : -1, 0, 0], uv);
}

/** Una cara vertical perpendicular al eje Z (un tabique cruzando el pasillo). */
function enZ(m, z, x0, x1, y0, y1, haciaMasZ) {
  const v = haciaMasZ
    ? [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]
    : [[x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z]];
  const uv = [[0, y0], [x1 - x0, y0], [x1 - x0, y1], [0, y1]];
  cara(m, v, [0, 0, haciaMasZ ? 1 : -1], uv);
}

function aMesh(m, material, escena) {
  if (!m.pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(m.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(m.nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(m.uv, 2));
  const mesh = new THREE.Mesh(g, material);
  escena.add(mesh);
  return mesh;
}

// ------------------------------------------------------------------ armado

/**
 * PEGA LOS LAYOUTS DEL 2D uno al lado del otro y devuelve la grilla entera,
 * fila por fila, como hace `world/train.js` en el juego de arriba.
 */
function armarGrilla() {
  const partes = COMPOSICION.map((id) => receta(id).layout);
  const filas = partes[0].length;
  const grilla = [];
  for (let f = 0; f < filas; f++) grilla.push(partes.map((p) => p[f]).join(''));
  return grilla;
}

/** Dónde empieza y termina cada vagón, en metros a lo largo del tren. */
function cortesDeVagones() {
  const cortes = [];
  let z = 0;
  for (const id of COMPOSICION) {
    const largo = receta(id).layout[0].length;
    cortes.push({ id, z0: z, z1: z + largo });
    z += largo;
  }
  return cortes;
}

/**
 * ARMA EL TREN ENTERO y devuelve lo que el resto del prototipo necesita: por
 * dónde se puede caminar, dónde está la caja fuerte y cuáles son las ventanas
 * (que main.js hace correr para que el tren parezca andando).
 */
export function armarTren(escena) {
  const grilla = armarGrilla();
  const filas = grilla.length;
  const columnas = grilla[0].length;
  const cortes = cortesDeVagones();

  /** El centro del tren cae entre la fila 4 y la 5: ahí va el pasillo. */
  const xDe = (fila) => fila - filas / 2;

  const mPiso = malla(), mTabla = malla(), mPared = malla(), mTecho = malla();
  const mAsiento = malla(), mCajon = malla(), mMetal = malla();
  /** La noche: chica por la ventanilla, de piso a techo en el enganche. */
  const mVentana = malla(), mCielo = malla();

  const ch = (f, c) => (f < 0 || f >= filas || c < 0 || c >= columnas ? 'X' : grilla[f][c]);
  const esPiso = (f, c) => PISO.has(ch(f, c));

  /**
   * HASTA QUÉ ALTURA TAPA LA BALDOSA DE AL LADO, y es la cuenta de la que
   * dependen las ventanillas.
   *
   * 🐛 La primera versión sólo dibujaba una cara cuando al lado había PISO, y
   * eso dejaba dos agujeros: la pared de arriba de los asientos no existía —o
   * sea que no había dónde poner la ventanilla— y por encima del respaldo se
   * veía el vacío negro de afuera. Lo que corresponde es dibujar el pedazo que
   * asoma: de lo que mide el vecino hasta lo que mide ésta.
   *
   * `null` significa "afuera del tren": contra el vacío no se dibuja nada,
   * porque esa cara no se ve nunca desde adentro.
   */
  const tapa = (f, c) => {
    const t = ch(f, c);
    if (t === 'X') return null;
    return PISO.has(t) ? 0 : (ALTURA[t] ?? 0);
  };

  /** Dibuja el pedazo de cara que asoma por encima del vecino, si asoma. */
  const asoma = (m, vecino, alto, dibujar) => {
    if (vecino === null || vecino >= alto) return;
    dibujar(vecino);
  };

  /** El enganche es aire libre: ahí no hay techo ni paredes, se ve la noche. */
  const alAire = (c) => {
    const v = cortes.find((k) => c >= k.z0 && c < k.z1);
    return v && v.id === 'enganche';
  };

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const t = ch(f, c);
      const x0 = xDe(f), x1 = xDe(f + 1), z0 = c, z1 = c + 1;

      if (t === 'X') continue;   // el vacío de afuera: no se dibuja nada

      // El techo va sobre TODO lo que sea parte del vagón, no sólo sobre el
      // piso pisable: si no, arriba de los asientos se abre un pozo negro.
      if (!alAire(c)) horizontal(mTecho, x0, x1, z0, z1, ALTO, false);

      if (PISO.has(t)) {
        // El pasillo lleva alfombra; las bandas, tablones. El enganche, chapa.
        const centro = f === filas / 2 - 1 || f === filas / 2;
        const donde = alAire(c) ? mMetal : centro ? mPiso : mTabla;
        horizontal(donde, x0, x1, z0, z1, 0, true);

        /**
         * 🐛 LAS PUNTAS DEL TREN HAY QUE TAPARLAS A MANO. Las paredes salen de
         * las baldosas macizas, pero en la primera y la última columna las
         * filas del pasillo son '+' (el paso al enganche) y del otro lado no
         * hay nada: sin esto, el tren termina en un agujero negro y se ve el
         * vacío de afuera desde adentro del vagón.
         */
        if (c === 0) enZ(mMetal, z0, x0, x1, 0, ALTO, true);
        if (c === columnas - 1) enZ(mMetal, z1, x0, x1, 0, ALTO, false);

        /**
         * EL ENGANCHE ES AIRE LIBRE, y eso hay que mostrarlo: a los costados
         * del paso no va una pared, va la NOCHE. Es el único lugar del tren
         * desde donde se ve el campo pasando, y es lo que lo vuelve el peor
         * sitio para quedarse parado.
         */
        if (alAire(c)) {
          if (ch(f - 1, c) === 'X') enX(mCielo, x0, z0, z1, 0, ALTO, true);
          if (ch(f + 1, c) === 'X') enX(mCielo, x1, z0, z1, 0, ALTO, false);
        }
        continue;
      }

      const alto = ALTURA[t];
      if (!alto) continue;

      const esPared = t === '#' || t === 'W';
      const m = esPared ? mPared : t === 'S' ? mAsiento : mCajon;

      asoma(m, tapa(f - 1, c), alto, (y) => enX(m, x0, z0, z1, y, alto, false));
      asoma(m, tapa(f + 1, c), alto, (y) => enX(m, x1, z0, z1, y, alto, true));
      asoma(m, tapa(f, c - 1), alto, (y) => enZ(m, z0, x0, x1, y, alto, false));
      asoma(m, tapa(f, c + 1), alto, (y) => enZ(m, z1, x0, x1, y, alto, true));

      // Los asientos y los cajones llevan tapa: te asomás por encima.
      if (alto < ALTO) horizontal(m, x0, x1, z0, z1, alto, true);

      /**
       * LA VENTANILLA. En el 2D la 'W' atraviesa las DOS filas de pared, así
       * que acá se dibuja sólo en la que da al interior: un rectángulo de
       * noche hundido un centímetro en la pared, a la altura de la cabeza.
       */
      if (t === 'W') {
        /**
         * 🐛 EL VIDRIO VA UN PELO POR DELANTE DE LA PARED, NO POR DETRÁS. La
         * primera versión lo hundía dos centímetros "adentro" y por eso no se
         * veía ninguna ventanilla: la pared misma lo tapaba.
         *
         * Y sólo se dibuja del lado que tiene pared a la vista (el mismo
         * `asoma` de arriba): del otro lado hay más pared, y ahí no se ve.
         */
        const Y0 = 1.15, Y1 = 1.95;
        const vidrio = (vecino, x, haciaMasX) => {
          if (vecino === null || vecino >= Y1) return;
          enX(mVentana, x, z0 + 0.1, z1 - 0.1, Y0, Y1, haciaMasX);
        };
        vidrio(tapa(f - 1, c), x0 - 0.02, false);
        vidrio(tapa(f + 1, c), x1 + 0.02, true);
      }
    }
  }

  const mat = (tex) => new THREE.MeshLambertMaterial({ map: tex });

  /**
   * LA PARED SE ESTIRA A LO ALTO A PROPÓSITO. Todo lo demás se mide en metros
   * —una baldosa de textura por metro— pero la pared tiene un listón dibujado
   * a media altura, y si se repitiera cada metro habría tres listones. Con
   * `repeat.y = 1 / ALTO` la textura entra UNA vez de piso a techo y el listón
   * queda donde tiene que quedar: a la altura del hombro.
   */
  const texPared = pared();
  texPared.repeat.set(1, 1 / ALTO);
  aMesh(mPiso, mat(alfombra()), escena);
  aMesh(mTabla, mat(madera()), escena);
  aMesh(mPared, mat(texPared), escena);
  aMesh(mTecho, mat(techo()), escena);
  aMesh(mAsiento, mat(tapizado()), escena);
  aMesh(mCajon, mat(cajon()), escena);
  aMesh(mMetal, mat(metal()), escena);

  /**
   * Las ventanas van SIN luz (`MeshBasicMaterial`): es de noche afuera, la
   * lámpara del vagón no ilumina un cerro a doscientos metros.
   */
  /**
   * La ventanilla usa la textura tal cual —una noche entera por ventana—; el
   * enganche necesita la suya, más estirada, porque ahí se ve de piso a techo.
   * Son dos texturas distintas para poder correrlas a distinta velocidad: lo
   * de afuera del enganche pasa más rápido que lo que se ve por el vidrio.
   */
  const texNoche = noche();
  texNoche.repeat.set(1.1, 1);
  const matVentana = new THREE.MeshBasicMaterial({ map: texNoche, fog: false });
  aMesh(mVentana, matVentana, escena);

  const texCampo = noche();
  texCampo.repeat.set(0.3, 1 / ALTO);
  aMesh(mCielo, new THREE.MeshBasicMaterial({ map: texCampo, fog: false }), escena);

  // --------------------------------------------------------------- luces

  const lamparas = [];
  const largo = columnas;
  for (let z = 4; z < largo; z += 9) {
    if (alAire(Math.floor(z))) continue;
    const luz = new THREE.PointLight(0xffb86a, 8, 13, 2);
    luz.position.set(0, ALTO - 0.35, z);
    escena.add(luz);
    lamparas.push(luz);
    const bombita = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xffca88 })
    );
    bombita.position.copy(luz.position);
    escena.add(bombita);
  }

  // ---------------------------------------------------------- caja fuerte

  const ultimo = cortes[cortes.length - 1];
  const zCaja = ultimo.z1 - 2.2;
  const matMetal = new THREE.MeshLambertMaterial({ map: metal() });
  const cofre = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.9), matMetal);
  cofre.position.set(0.55, 0.5, zCaja);
  escena.add(cofre);
  const rueda = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.045, 6, 12),
    new THREE.MeshLambertMaterial({ color: 0x8a8a90 })
  );
  rueda.position.set(0.55, 0.55, zCaja - 0.47);
  escena.add(rueda);

  /**
   * CONTRA QUÉ SE CHOCA. No hace falta una lista de cajas: la grilla YA dice
   * qué es macizo, igual que en el 2D. Se pregunta la baldosa y listo.
   */
  function esSolido(x, z, alturaOjos = 1.6) {
    const f = Math.floor(x + filas / 2);
    const c = Math.floor(z);
    const t = ch(f, c);
    if (t === 'X') return true;
    const alto = ALTURA[t];
    return alto !== undefined && alto > alturaOjos - 1.4;
  }

  return {
    grilla, filas, columnas, cortes, esSolido,
    largoTotal: columnas,
    lamparas, rueda, texNoche, texCampo,
    cajaFuerte: { x: 0.55, y: 0.5, z: zCaja, mesh: cofre },
    /** Por dónde entraste: volver acá con la plata es ganar. */
    salida: { x: 0, z: 1.2 },
  };
}
