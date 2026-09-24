/**
 * LOS TRES REFUGIOS DE LA HUIDA: la quebrada, el vado del río y el bosque de
 * rocas.
 *
 * *(Santi: "que hayan diferentes caminos para tomar y que sea aleatorio el
 * destino a dónde llegas: puede ser un río, una quebrada o un bosque de
 * rocas", y después: "que literalmente el caballo pueda cabalgar hacia el
 * norte o sur en vez de solo hacia el este")*
 *
 * CADA UNO ESTÁ EN UN LUGAR DEL CAMPO, y el campo es abierto: no hay un camino
 * que te lleve, hay tres lugares y vos elegís hacia cuál galopás.
 *
 * HAY DOS FORMAS DE REFUGIO:
 *
 *  - **El anillo** (el bosque de rocas, y el río cuando llegue su región): un
 *    aro con una entrada de unos sesenta grados. Adentro la ley no entra, pero
 *    la entrada hay que encontrarla, y si le pegás al aro te clavás contra él.
 *  - **El paredón** (la quebrada): una pared atravesada en tu camino con un
 *    hueco angosto, y el refugio es **el otro lado**. Ver `PAREDON`.
 *
 * ⚠️ DIBUJO SIMPLE (por vestir): bloques con junta y canto iluminado, agua con
 * reflejos, peñascos con su sombra.
 */

import { escalarColor } from './trenTresCuartos.js';

/**
 * 🗺️ CADA REFUGIO ES DE SU REGIÓN *(Santi: "eliminaría el río y lo dejaría
 * para otra región —región pradera o bosque—, hoy estamos en desierto")*.
 *
 * El río no se borró: quedó esperando su región. Cuando la huida pase por
 * pradera, `refugiosDeLaRegion('pradera')` lo devuelve y todo lo demás —el
 * anillo, el vado, el dibujo de lejos— ya está escrito.
 */
export const DESTINOS = {
  quebrada: {
    id: 'quebrada', region: 'desierto',
    nombre: 'LA QUEBRADA', cartel: '¡ADENTRO DE LA QUEBRADA!',
  },
  bosque: {
    id: 'bosque', region: 'desierto',
    nombre: 'EL BOSQUE DE ROCAS', cartel: '¡ADENTRO DEL BOSQUE DE ROCAS!',
  },
  rio: {
    id: 'rio', region: 'pradera',
    nombre: 'EL RÍO', cartel: '¡CRUZASTE EL RÍO!',
  },
};

/** Los refugios que pueden salir en esta región. */
export function refugiosDeLaRegion(region = 'desierto') {
  return Object.keys(DESTINOS).filter((id) => DESTINOS[id].region === region);
}

/** El grosor de la pared de un refugio, hacia adentro del radio. */
export const PARED = 26;

/**
 * 🧱 LA QUEBRADA NO ES UN ANILLO: ES UN PAREDÓN *(Santi: "diría que sea una
 * pared de rocas infinita se podría decir, con un hueco estrecho y esa
 * sensación de oscuridad")*.
 *
 * Y eso cambia qué significa llegar. En un anillo, "adentro" es el centro;
 * acá **el refugio es el otro lado**, y el momento de ganar es pasar el hueco.
 * Es un umbral y no un destino difuso, que es mucho mejor final para una
 * corrida.
 *
 * El bosque de rocas sigue siendo anillo: acá cambia sólo la quebrada.
 */
/**
 * 🏜️ Y LO QUE VIENE DESPUÉS DE LA BOCA *(Santi, con una foto de la Quebrada de
 * La Troya: "yo pensaba que era algo como esta foto; que luego de la puerta de
 * la quebrada sigue siendo estrecho y sigue habiendo pared de rocas")*.
 *
 * Tenía razón, y el error era más de fondo que el dibujo: una pared de 26 de
 * espesor con un agujero nunca se iba a parecer a eso, por más que se le
 * rompiera el borde. Una quebrada es un **macizo de roca con una garganta
 * metida adentro**: entrás por la boca y seguís entre dos paredes.
 *
 * Y eso mejora el final de la corrida: **ellos frenan en la boca** —ahí no
 * entran— así que el último tramo lo hacés solo, entre las paredes.
 */
export const PAREDON = {
  /**
   * LARGO TOTAL, mitad para cada lado del hueco. "Infinita" de verdad dejaría
   * encerrado al que llega mal; 2.600 es tan largo que rodearla ni se piensa
   * —errarle 300 unidades son unos tres segundos corrigiendo— pero sigue
   * teniendo dos puntas.
   */
  largo: 2600,

  /**
   * EL ANCHO DEL HUECO. La vista mide 538 unidades de ancho y tu caballo, 9:
   * con 90 se entra de casualidad y con 34 hay que llegar casi derecho (y con
   * un jinete colgado eso es cruel). 60 se ve de lejos y exige apuntar.
   */
  hueco: 60,

  /**
   * CUÁNTO MIDE LA GARGANTA hacia adentro del macizo. Son unos dos segundos a
   * galope: 150 es un zaguán y 450 son cuatro segundos de pasillo después de
   * que ya se terminó la tensión.
   */
  garganta: 260,

  /**
   * Y CUÁNTO SE CIERRA ADENTRO. La boca mide 60; adentro baja a 46, que se
   * siente que se cierra sin que vayas rebotando de pared a pared (con 32, sí).
   */
  ancho: 46,

  /** Cuánto se corre de costado la garganta de la boca al fondo: la curva. */
  curva: 70,
};

/**
 * POR DÓNDE VA LA GARGANTA a cada profundidad. Una curva suave que arranca y
 * termina derecha (`s² (3 − 2s)`), así que no hay ningún codo donde encajarse.
 */
function centroDeLaGarganta(v) {
  const s = Math.max(0, Math.min(1, v / PAREDON.garganta));
  return PAREDON.curva * s * s * (3 - 2 * s);
}

/** Y cuánto mide de ancho: la boca se cierra en el primer cuarto. */
function anchoDeLaGarganta(d, v) {
  const s = Math.max(0, Math.min(1, v / (PAREDON.garganta * 0.3)));
  return d.hueco + (PAREDON.ancho - d.hueco) * s;
}

/**
 * 🧭 HACIA DÓNDE HAY QUE IR PARA ENTRAR A ESTE REFUGIO.
 *
 * 🐛 Con el anillo alcanzaba con su centro, pero con la garganta no: apenas
 * pasabas la boca, la brújula te seguía apuntando **a la boca**, o sea que
 * adentro te mandaba a salir. Afuera apunta a la boca; adentro, a un tramo más
 * profundo, siguiendo la curva.
 */
export function puntoDeEntrada(d, x, y) {
  if (!esPared(d)) return { x: d.x, y: d.y };
  const { v } = enLaPared(d, x, y);
  if (v < PARED / 2) return { x: d.x, y: d.y };
  const t = Math.min(PAREDON.garganta + 6, v + 90);
  return desdeLaPared(d, centroDeLaGarganta(t), t);
}

/** ¿Este refugio es un paredón o un anillo? */
export const esPared = (d) => d.forma === 'pared';

/**
 * LAS COORDENADAS DE LA PARED. `u` es a lo largo del paredón (0 en el hueco) y
 * `v` es a lo ancho: negativo del lado del que venís, positivo del otro. Todo
 * en el mundo sin achatar, como el resto de las cuentas de la huida.
 */
function enLaPared(d, x, y) {
  const dx = x - d.x;
  const dy = (y - d.y) / ACHATA;
  return {
    u: dx * Math.cos(d.rumboPared) + dy * Math.sin(d.rumboPared),
    v: -dx * Math.sin(d.rumboPared) + dy * Math.cos(d.rumboPared),
  };
}

/** Y la vuelta: de coordenadas de la pared al mundo. */
function desdeLaPared(d, u, v) {
  const dx = u * Math.cos(d.rumboPared) - v * Math.sin(d.rumboPared);
  const dy = u * Math.sin(d.rumboPared) + v * Math.cos(d.rumboPared);
  return { x: d.x + dx, y: d.y + dy * ACHATA };
}

/**
 * ¿ESTE PUNTO ESTÁ CONTRA LA PARED DEL REFUGIO? Devuelve lo que hay que
 * corregir para sacarlo de ahí, o `null` si está libre (afuera, adentro, o
 * justo en la entrada).
 *
 * Es la misma cuenta que usa el dibujo, así que la pared que ves es la que te
 * frena.
 */
export function chocaConElRefugio(d, x, y, esLey) {
  if (esPared(d)) return chocaConElParedon(d, x, y, esLey);
  const dx = x - d.x;
  const dy = (y - d.y) / ACHATA;
  const dist = Math.hypot(dx, dy);
  if (dist > d.radio + 6 || dist < d.radio - PARED - 6) return null;
  const a = Math.atan2(dy, dx);
  if (enLaEntrada(d, a)) return null;
  // Empujar hacia afuera o hacia adentro, lo que esté más cerca.
  const haciaAfuera = dist > d.radio - PARED / 2;
  const objetivo = haciaAfuera ? d.radio + 7 : d.radio - PARED - 7;
  return { x: d.x + Math.cos(a) * objetivo, y: d.y + Math.sin(a) * objetivo * ACHATA };
}

/**
 * CONTRA EL PAREDÓN. Es la misma idea que contra el anillo —devuelve a dónde
 * hay que correrte, o `null` si estás libre— pero en coordenadas de la pared:
 * te frena si estás dentro de su grosor, dentro de su largo y fuera del hueco.
 */
function chocaConElParedon(d, x, y, esLey) {
  const { u, v } = enLaPared(d, x, y);
  const cara = PARED / 2;
  const G = PAREDON;

  // Delante del macizo o pasado el fondo de la garganta: campo libre.
  if (v < -cara - 6 || v > G.garganta + 10) return null;
  // Y a los costados del paredón, también.
  if (Math.abs(u) > d.largo / 2 && v < G.garganta) return null;

  /**
   * ¿VA POR LA GARGANTA? El centro se corre con la profundidad (la curva) y el
   * ancho se cierra después de la boca.
   *
   * ⚠️ PARA LA LEY, LA GARGANTA ES ROCA. No entran: frenan en la boca, y por
   * eso el último tramo lo hacés solo. Es lo que convierte a la garganta en el
   * final de la corrida y no en un pasillo más.
   */
  const uc = centroDeLaGarganta(v);
  const w = anchoDeLaGarganta(d, v);
  const dentroDeLaGarganta = Math.abs(u - uc) < w / 2 - 4;
  if (dentroDeLaGarganta && !esLey) return null;

  /**
   * Contra la cara de afuera te salís hacia adelante, al campo.
   *
   * 🐛 Y LA LEY SALE SIEMPRE PARA AFUERA, esté donde esté del macizo. La
   * primera versión los corría contra la pared de la garganta igual que a vos,
   * así que los que alcanzaban a meter el hocico en la boca quedaban **adentro**
   * raspando: medidos, 1,2 segundos por corrida de ley adentro de la quebrada,
   * que es justo lo que no tiene que pasar.
   */
  if (v < cara || esLey) return desdeLaPared(d, u, -cara - 7);

  // Ya adentro del macizo: te corre contra la pared de la garganta.
  const lado = u >= uc ? 1 : -1;
  return desdeLaPared(d, uc + lado * (w / 2 - 4), v);
}

/**
 * ¿YA ESTÁS ADENTRO? En el anillo, adentro es el centro. En el paredón,
 * **adentro es del otro lado**: cruzaste el hueco.
 */
export function adentroDelRefugio(d, x, y) {
  if (esPared(d)) {
    /**
     * EN LA QUEBRADA SE GANA AL FONDO DE LA GARGANTA, no en la boca. Es lo que
     * hace que el tramo de adentro exista: entrás, ellos se quedan afuera, y
     * recién cuando llegaste al fondo estás a salvo.
     */
    const { u, v } = enLaPared(d, x, y);
    return v > PAREDON.garganta - 14 && Math.abs(u - centroDeLaGarganta(v)) < d.hueco;
  }
  const dx = x - d.x;
  const dy = (y - d.y) / ACHATA;
  return Math.hypot(dx, dy) < d.radio - PARED - 4;
}

/** En tres cuartos lo redondo se ve aplastado: un círculo es una elipse. */
export const ACHATA = 0.62;

function enLaEntrada(d, a) {
  const dif = Math.atan2(Math.sin(a - d.mira), Math.cos(a - d.mira));
  return Math.abs(dif) < d.abertura / 2;
}

/**
 * EL REFUGIO, DIBUJADO. Se dibuja por sectores: cada uno es un trozo de pared
 * con su sombra, y los que caen en la entrada no se dibujan — por ahí se pasa.
 */
export function dibujarRefugio(r, d, dia, vista) {
  const c = (hex) => (dia ? hex : escalarColor(hex, 0.55));
  if (esPared(d)) {
    // Suelto (sin la lista de la escena): se dibuja entero, de atrás para
    // adelante. La escena usa `trozosDelParedon` para ordenarlo con todo lo demás.
    const cerca = vista || { x: d.x, y: d.y, w: 1e9, h: 1e9 };
    const t = trozosDelParedon(d, dia, cerca).sort((p, q) => p.y - q.y);
    for (const k of t) k.draw(r);
    return;
  }
  const pasos = 48;
  const trozos = [];
  for (let i = 0; i < pasos; i++) {
    const a = (i / pasos) * Math.PI * 2 - Math.PI;
    if (enLaEntrada(d, a)) continue;
    trozos.push({ a, y: d.y + Math.sin(a) * d.radio * ACHATA });
  }
  // De atrás hacia adelante, para que los de abajo tapen a los de arriba.
  trozos.sort((p, q) => p.y - q.y);

  // La sombra que el anillo tira hacia adentro: es lo que lo hace un lugar.
  r.ctx.save();
  r.ctx.globalAlpha = 0.22;
  r.ctx.fillStyle = '#000';
  r.ctx.beginPath();
  r.ctx.ellipse(d.x, d.y, (d.radio - PARED) * 1.02, (d.radio - PARED) * ACHATA * 1.02, 0, 0, Math.PI * 2);
  r.ctx.fill();
  r.ctx.restore();

  for (const t of trozos) {
    const x = d.x + Math.cos(t.a) * (d.radio - PARED / 2);
    const y = d.y + Math.sin(t.a) * (d.radio - PARED / 2) * ACHATA;
    if (d.tipo === 'rio') agua(r, c, x, y, t.a);
    else if (d.tipo === 'bosque') penasco(r, c, x, y, t.a);
    else roca(r, c, x, y, t.a);
  }
}

// --------------------------------------------------------------- el paredón

/** Lo alto que es el paredón. Es lo que lo hace una pared y no un murito. */
const ALTO_PARED = 54;
/** Cuánto mide cada bloque a lo largo. */
const BLOQUE = 15;

/**
 * 🧱 EL PAREDÓN, TROZO POR TROZO.
 *
 * ⚠️ DEVUELVE LOS TROZOS EN VEZ DE DIBUJARLOS, y es a propósito: una pared de
 * 2.600 unidades cruza la pantalla entera, así que no puede ordenarse por
 * profundidad como UNA cosa — el jugador que está al sur tiene que taparla y
 * el que está al norte tiene que quedar detrás. Cada bloque entra por separado
 * en la lista que la escena ordena por `y`.
 *
 * Sólo se arman los que se ven: de los 173 bloques del paredón, en pantalla
 * entran unos 40.
 */
export function trozosDelParedon(d, dia, cerca) {
  const c = (hex) => (dia ? hex : escalarColor(hex, 0.55));
  const trozos = [];
  const mitad = d.largo / 2;
  const borde = d.hueco / 2;

  /**
   * 🏜️ PRIMERO, EL MACIZO VISTO DESDE ARRIBA. Va detrás de todo (`y` muy
   * chico) porque es suelo: la meseta de roca, el piso de la garganta y la
   * sombra que las paredes tiran adentro.
   */
  trozos.push({ y: -1e9, draw: (r) => mesetaDelMacizo(r, c, d) });

  /**
   * Y LAS DOS PAREDES DE LA GARGANTA, hacia adentro.
   *
   * ⚠️ LA PARED DE ADELANTE VA RECORTADA. En tres cuartos, la pared que queda
   * entre la cámara y vos taparía al caballo entero mientras cruzás: de las dos
   * se dibuja entera la del fondo, y la de adelante queda como un borde bajo.
   * Es el recorte de siempre de los juegos vistos desde arriba.
   */
  for (let v = 4; v <= PAREDON.garganta; v += BLOQUE) {
    const uc = centroDeLaGarganta(v);
    const w = anchoDeLaGarganta(d, v);
    const lados = [-1, 1].map((lado) => {
      const u = uc + lado * (w / 2 + BLOQUE * 0.45);
      return { u, p: desdeLaPared(d, u, v) };
    });
    lados.sort((a, b) => a.p.y - b.p.y);
    lados.forEach((k, orden) => {
      if (Math.abs(k.p.x - cerca.x) > cerca.w || Math.abs(k.p.y - cerca.y) > cerca.h) return;
      const i = Math.round(v / BLOQUE) * 31 + (k.u > uc ? 7 : 3);
      const recorte = orden === 0 ? 1 : 0.36;
      trozos.push({ y: k.p.y, draw: (r) => bloqueDePared(r, c, k.p.x, k.p.y, k.u, i, false, recorte) });
    });
  }

  for (let u = -mitad; u <= mitad; u += BLOQUE) {
    if (Math.abs(u) < borde) continue;
    const i = Math.round(u / BLOQUE);
    /**
     * 🐛 LA CARA DEL PAREDÓN NO ES UNA REGLA *(Santi: "parece más un muro de
     * un castillo que una quebrada")*. Cada bloque se adelanta o se retira un
     * poco, así que el frente queda dentado y la línea de la base deja de ser
     * recta. Es lo que más separa una roca de una tapia — el tope parejo y la
     * cara plana son literalmente cómo se dibuja una muralla.
     *
     * El retiro se queda dentro del grosor (26), así que la pared que ves
     * sigue siendo la que te frena.
     */
    const retiro = (ruido(i, 7) - 0.5) * 11 + Math.sin(u * 0.011) * 4;
    const p = desdeLaPared(d, u, retiro);
    if (Math.abs(p.x - cerca.x) > cerca.w || Math.abs(p.y - cerca.y) > cerca.h) continue;
    // El bloque que da al hueco se dibuja en sombra: es el canto de la grieta.
    const alBorde = Math.abs(Math.abs(u) - borde) < BLOQUE;
    trozos.push({ y: p.y, draw: (r) => bloqueDePared(r, c, p.x, p.y, u, i, alBorde, 1) });
  }

  /**
   * LA OSCURIDAD DEL HUECO. Dos cosas, y las dos importan: el fondo de la
   * grieta casi negro —lo que se ve entre las dos puntas— y la sombra larga
   * que la pared tira hacia el lado del que venís. Sin la sombra, el paredón
   * es una cerca; con ella, es alto.
   */
  return trozos;
}

/**
 * LO ALTO QUE ES EL PAREDÓN EN CADA PUNTO. Tres ondas de distinto largo: el
 * perfil sube y baja de a poco en vez de tener todos los bloques parejos, que
 * es lo que hacía que la primera versión se leyera como una tapia de ladrillos
 * y no como un farallón.
 */
function alturaDeLaPared(u) {
  const onda = Math.sin(u * 0.0047) * 8
             + Math.sin(u * 0.019 + 1.7) * 5
             + Math.sin(u * 0.052 + 0.4) * 2.5;
  const s = revolver(Math.round(u / BLOQUE));
  // Cada tanto, una aguja que sobresale del resto.
  const aguja = s % 11 === 0 ? 13 + (s % 7) : 0;
  return Math.round(ALTO_PARED + onda + (s % 5) + aguja);
}

/**
 * LOS ESTRATOS, y acá está la clave de que parezca roca.
 *
 * 🐛 En la primera versión cada bloque sorteaba sus propias capas, así que las
 * juntas no coincidían con las del bloque de al lado y quedaba una empalizada.
 * Ahora las bandas se cuentan **desde la base**, que es la misma para todos los
 * bloques vecinos: las vetas se continúan a lo largo del paredón, como en un
 * corte de roca de verdad.
 */
/** El color de la arenisca de la quebrada: uno solo para todo el macizo. */
const ROCA = '#8a6049';

/** Un ruido de 0 a 1, fijo para cada bloque. */
function ruido(i, sal) {
  return (revolver(i * 2654435761 + sal) % 1024) / 1024;
}

/**
 * UN BLOQUE DE ROCA DEL MACIZO.
 *
 * 🏜️ LA TEXTURA SALE DE LA FOTO QUE PASÓ SANTI (la Quebrada de La Troya): no
 * hay hiladas horizontales, hay **erosión vertical** —chorreaduras de arriba
 * abajo— y la pared está **picada de huecos**, en tonos rojizos. Los estratos
 * prolijos que tenía antes eran justamente lo que la hacía parecer mampostería.
 *
 * `recorte` es cuánto se dibuja de su altura: las paredes de la garganta que
 * quedan entre la cámara y el jugador van recortadas a un borde bajo, si no
 * taparían al caballo mientras cruza.
 */
function bloqueDePared(r, c, x, y, u, i, alBorde, recorte = 1) {
  const s = revolver(i);
  const alto = Math.max(10, Math.round(alturaDeLaPared(u) * recorte));
  const w = BLOQUE + 3;
  const x0 = x - w / 2;
  const mod = (k, m) => ((k % m) + m) % m;

  // La sombra al pie: es lo que la despega del suelo.
  r.ctx.save();
  r.ctx.globalAlpha = 0.3;
  r.rect(x0 - 2, y, w + 4, 6, '#000');
  r.ctx.restore();

  /**
   * EL CUERPO: **un solo tono de arenisca para todo el paredón**, con una
   * variación mínima por bloque.
   *
   * 🐛 Antes cada bloque sacaba su color de una paleta de cinco, y con las
   * chorreaduras encima el resultado era una **columnata**: se veía bloque por
   * bloque, como caños de órgano. La roca es una sola masa; lo que cambia de un
   * lado a otro es la luz, no el material.
   */
  const base = escalarColor(ROCA, 0.93 + ruido(i, 3) * 0.14);
  r.rect(x0, y - alto, w, alto, c(base));

  /**
   * LAS CHORREADURAS: franjas verticales que bajan desde el tope, unas más
   * oscuras y otras más claras. Es lo que hace la lluvia sobre la arenisca, y
   * es lo contrario de una hilada.
   */
  const cuantas = 3 + (s % 3);
  for (let k = 0; k < cuantas; k++) {
    const gx = x0 + 1 + Math.floor(ruido(i * 5 + k, 11) * (w - 2));
    const ancho = ruido(i + k, 23) > 0.7 ? 2 : 1;
    const largo = Math.round(alto * (0.35 + ruido(i + k, 37) * 0.6));
    const tono = ruido(i + k, 41) > 0.55 ? '#5a3b2e' : '#9c7560';
    r.rect(gx, y - alto + 1, ancho, largo, c(tono));
  }

  /**
   * Y LOS HUECOS (tafoni): la roca picada de la foto. Van en el medio de la
   * cara, nunca contra el borde, para que no se coman la silueta.
   */
  const huecos = 3 + (s % 4);
  for (let k = 0; k < huecos; k++) {
    const hx = x0 + 2 + Math.floor(ruido(i * 7 + k, 59) * (w - 5));
    const hy = y - alto + 3 + Math.floor(ruido(i * 11 + k, 61) * Math.max(1, alto - 7));
    const tam = ruido(i + k, 67) > 0.72 ? 2 : 1;
    r.rect(hx, hy, tam + 1, tam, c('#4a3025'));
    r.rect(hx, hy + tam, tam + 1, 1, c('#a4806a'));
  }

  /**
   * LA CRESTA VA ROTA, no plana: el bloque se parte en tres columnitas que
   * suben distinto. Un tope parejo con escaloncitos es un almenado.
   */
  const tercio = Math.ceil(w / 3);
  for (let k = 0; k < 3; k++) {
    const cx = x0 + k * tercio;
    const cw = Math.min(tercio, x0 + w - cx);
    if (cw <= 0) break;
    const sube = Math.round((ruido(i * 3 + k, 19) - 0.3) * 8 * recorte);
    const techo = y - alto - Math.max(0, sube);
    if (sube > 0) r.rect(cx, techo, cw, sube + 2, c(base));
    r.rect(cx, techo, cw, 1, c(escalarColor(ROCA, 1.28)));
  }

  /** La falda de pedregullo: la roca se desprende y se amontona al pie. */
  const pie = 3 + Math.round(ruido(i, 31) * 4);
  for (let k = 0; k < pie; k++) {
    const ancho = w - k * 2 - Math.round(ruido(i + k, 53) * 3);
    if (ancho <= 2) break;
    r.rect(x0 + k + 1, y + k, ancho, 1, c(k < 2 ? '#7a5a46' : '#66483a'));
  }

  // El bloque que mira a la boca va en sombra: es el canto de la grieta.
  if (alBorde) {
    r.ctx.save();
    r.ctx.globalAlpha = 0.5;
    r.rect(x0, y - alto - 6, w, alto + 6, '#000');
    r.ctx.restore();
  }
}

/**
 * 🏜️ EL MACIZO VISTO DESDE ARRIBA: la meseta de roca, el piso de la garganta
 * metiéndose adentro, y la sombra que las paredes tiran sobre ese piso.
 *
 * Es SUELO, así que se dibuja detrás de todo lo demás: no tapa a nadie.
 */
function mesetaDelMacizo(r, c, d) {
  const G = PAREDON;
  const mitad = d.largo / 2;
  const P = (u, v) => desdeLaPared(d, u, v);
  const pasos = 14;

  r.ctx.save();

  // 1. La roca, de la cara hasta el fondo del macizo.
  const a = P(-mitad, -PARED / 2), b = P(mitad, -PARED / 2);
  const e = P(mitad, G.garganta + 30), f = P(-mitad, G.garganta + 30);
  r.ctx.fillStyle = c('#4a3228');
  r.ctx.beginPath();
  r.ctx.moveTo(a.x, a.y); r.ctx.lineTo(b.x, b.y);
  r.ctx.lineTo(e.x, e.y); r.ctx.lineTo(f.x, f.y);
  r.ctx.closePath();
  r.ctx.fill();

  // 2. El piso de la garganta: arena clara entre las dos paredes.
  const bordeIzq = [], bordeDer = [];
  for (let k = 0; k <= pasos; k++) {
    const v = (k / pasos) * G.garganta;
    const uc = centroDeLaGarganta(v);
    const w = anchoDeLaGarganta(d, v) / 2;
    bordeIzq.push(P(uc - w, v));
    bordeDer.push(P(uc + w, v));
  }
  r.ctx.fillStyle = c('#7a6149');
  r.ctx.beginPath();
  r.ctx.moveTo(bordeIzq[0].x, bordeIzq[0].y);
  for (const p of bordeIzq) r.ctx.lineTo(p.x, p.y);
  for (let k = bordeDer.length - 1; k >= 0; k--) r.ctx.lineTo(bordeDer[k].x, bordeDer[k].y);
  r.ctx.closePath();
  r.ctx.fill();

  /**
   * 3. Y LA SOMBRA DE LAS PAREDES SOBRE ESE PISO, que es lo que da la
   * oscuridad: la garganta se ensombrece cuanto más adentro, y el fondo queda
   * casi negro. Por eso vale la pena entrar: adentro no te ven.
   */
  r.ctx.fillStyle = '#000';
  for (let k = 0; k < pasos; k++) {
    r.ctx.globalAlpha = 0.18 + (k / pasos) * 0.5;
    r.ctx.beginPath();
    r.ctx.moveTo(bordeIzq[k].x, bordeIzq[k].y);
    r.ctx.lineTo(bordeDer[k].x, bordeDer[k].y);
    r.ctx.lineTo(bordeDer[k + 1].x, bordeDer[k + 1].y);
    r.ctx.lineTo(bordeIzq[k + 1].x, bordeIzq[k + 1].y);
    r.ctx.closePath();
    r.ctx.fill();
  }

  // 4. La sombra que el macizo tira sobre el campo del que llega.
  r.ctx.globalAlpha = 0.22;
  const s0 = P(-mitad, -PARED / 2), s1 = P(mitad, -PARED / 2);
  const s2 = P(mitad, -PARED / 2 - 20), s3 = P(-mitad, -PARED / 2 - 20);
  r.ctx.beginPath();
  r.ctx.moveTo(s0.x, s0.y); r.ctx.lineTo(s1.x, s1.y);
  r.ctx.lineTo(s2.x, s2.y); r.ctx.lineTo(s3.x, s3.y);
  r.ctx.closePath();
  r.ctx.fill();
  r.ctx.restore();
}

/** Un bloque del paredón de la quebrada. */
function roca(r, c, x, y, a) {
  const s = revolver(Math.round(a * 100));
  const w = PARED - (s % 6);
  const alto = 18 + (s % 10);
  r.ctx.save();
  r.ctx.globalAlpha = 0.3;
  r.rect(x - w / 2 - 2, y + 1, w + 4, 3, '#000');
  r.ctx.restore();
  r.rect(x - w / 2, y - alto, w, alto, c(['#6f5f4d', '#63543f', '#5a4c3d'][s % 3]));
  r.rect(x - w / 2, y - alto, w, 2, c('#8a7a63'));
  r.rect(x - w / 2, y - alto + 2, 2, alto - 2, c('#4a3e33'));
  if (s % 4 === 0) r.rect(x - w / 2 + 3 + (s % 7), y - alto + 3, 1, alto - 5, c('#3a2f26'));
}

/** Un trozo del río: agua, orilla y brillo. */
function agua(r, c, x, y, a) {
  const s = revolver(Math.round(a * 100) + 11);
  const w = PARED + 2;
  r.rect(x - w / 2, y - 6, w, 10, c('#3f5d6b'));
  r.rect(x - w / 2, y - 7, w, 2, c('#6f8f96'));
  r.rect(x - w / 2 + (s % 6), y - 3, 5 + (s % 4), 1, c('#8fb3b8'));
  r.rect(x - w / 2, y + 3, w, 1, c('#5b6a52'));
}

/** Un peñasco del bosque de rocas. */
function penasco(r, c, x, y, a) {
  const s = revolver(Math.round(a * 100) + 23);
  const w = 14 + (s % 10);
  const alto = 14 + (s % 12);
  r.ctx.save();
  r.ctx.globalAlpha = 0.28;
  r.rect(x - w / 2 - 2, y, w + 5, 3, '#000');
  r.ctx.restore();
  r.rect(x - w / 2, y - alto, w, alto, c(['#5e5346', '#6b5f4f', '#544a3f'][s % 3]));
  r.rect(x - w / 2, y - alto, w, 2, c('#8e8069'));
  r.rect(x + w / 2 - 2, y - alto + 2, 2, alto - 2, c('#3e362d'));
}

/**
 * EL REFUGIO VISTO DE LEJOS, para poder elegir hacia cuál ir desde el
 * arranque: una silueta chiquita en la dirección en la que está. Se dibuja en
 * el mundo, así que crece sola a medida que te acercás.
 */
export function dibujarDeLejos(r, d, dia, escala) {
  const c = (hex) => (dia ? hex : escalarColor(hex, 0.4));
  const s = Math.max(0.35, escala);
  const x = d.x;
  const y = d.y;
  if (d.tipo === 'rio') {
    for (let i = 0; i < 5; i++) {
      const ax = x - 30 * s + i * 15 * s;
      const alto = (22 + (i % 3) * 8) * s;
      r.rect(ax, y - alto, 4 * s, alto, c('#3f5637'));
      r.rect(ax - 2 * s, y - alto, 8 * s, alto * 0.6, c('#4d6a41'));
    }
    r.rect(x - 40 * s, y, 80 * s, 3 * s, c('#5d8391'));
  } else if (d.tipo === 'bosque') {
    for (let i = 0; i < 4; i++) {
      const ax = x - 34 * s + i * 20 * s;
      const alto = (14 + ((i * 5) % 12)) * s;
      r.rect(ax, y - alto, 16 * s, alto, c('#5e5346'));
      r.rect(ax, y - alto, 16 * s, 2 * s, c('#8e8069'));
    }
  } else {
    /**
     * LA QUEBRADA DE LEJOS: una línea oscura cruzando el horizonte **con el
     * corte a la vista**. Eso es lo único que necesitás para corregir el rumbo
     * antes de llegar, y es lo que hace que errarle al hueco sea culpa tuya.
     */
    const alto = 26 * s;
    const largo = 150 * s;
    const corte = 9 * s;
    r.rect(x - largo, y - alto, largo - corte, alto, c('#5b4d3e'));
    r.rect(x + corte, y - alto, largo - corte, alto, c('#5b4d3e'));
    r.rect(x - largo, y - alto, largo - corte, 2 * s, c('#8a7a66'));
    r.rect(x + corte, y - alto, largo - corte, 2 * s, c('#8a7a66'));
    // El corte, negro: es lo que buscás desde lejos.
    r.rect(x - corte, y - alto * 0.8, corte * 2, alto * 0.8, c('#1d1712'));
  }
}

/** El mismo revuelto de siempre: forma sin listas y sin titilar. */
function revolver(n) {
  let t = (n * 374761393 + 668265263) | 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177);
  return (t ^ (t >>> 16)) >>> 0;
}
