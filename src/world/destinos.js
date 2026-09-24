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

  /** Cuánto se hunde el hueco: el tramo de penumbra que cruzás. */
  fondo: 40,
};

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
export function chocaConElRefugio(d, x, y) {
  if (esPared(d)) return chocaConElParedon(d, x, y);
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
function chocaConElParedon(d, x, y) {
  const { u, v } = enLaPared(d, x, y);
  const medio = PARED / 2;
  if (Math.abs(v) > medio + 6 || Math.abs(u) > d.largo / 2) return null;
  // El hueco: por ahí se pasa. Se deja un pelo de margen contra cada punta.
  if (Math.abs(u) < d.hueco / 2 - 4) return null;
  // Te salís por el lado que tenés más cerca.
  return desdeLaPared(d, u, v >= 0 ? medio + 7 : -(medio + 7));
}

/**
 * ¿YA ESTÁS ADENTRO? En el anillo, adentro es el centro. En el paredón,
 * **adentro es del otro lado**: cruzaste el hueco.
 */
export function adentroDelRefugio(d, x, y) {
  if (esPared(d)) {
    const { u, v } = enLaPared(d, x, y);
    return v > PARED / 2 + 6 && Math.abs(u) < d.hueco;
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

  for (let u = -mitad; u <= mitad; u += BLOQUE) {
    if (Math.abs(u) < borde) continue;
    const p = desdeLaPared(d, u, 0);
    if (Math.abs(p.x - cerca.x) > cerca.w || Math.abs(p.y - cerca.y) > cerca.h) continue;
    // El bloque que da al hueco se dibuja en sombra: es el canto de la grieta.
    const alBorde = Math.abs(Math.abs(u) - borde) < BLOQUE;
    trozos.push({ y: p.y, draw: (r) => bloqueDePared(r, c, p.x, p.y, u, alBorde) });
  }

  /**
   * LA OSCURIDAD DEL HUECO. Dos cosas, y las dos importan: el fondo de la
   * grieta casi negro —lo que se ve entre las dos puntas— y la sombra larga
   * que la pared tira hacia el lado del que venís. Sin la sombra, el paredón
   * es una cerca; con ella, es alto.
   */
  const boca = desdeLaPared(d, 0, 0);
  trozos.push({ y: boca.y - 0.5, draw: (r) => bocaDeLaQuebrada(r, c, d) });
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
const BANDAS = [7, 5, 9, 6, 11, 5, 8];
const CAPAS = ['#7a6047', '#6b5340', '#856a4e', '#5c4735', '#725a42'];

/** Un bloque del paredón: estratos, canto iluminado, grietas y pedregullo. */
function bloqueDePared(r, c, x, y, u, alBorde) {
  const s = revolver(Math.round(u / BLOQUE));
  const alto = alturaDeLaPared(u);
  // Los bloques se pisan un poco entre sí: sin eso se ven las juntas verticales.
  const w = BLOQUE + 3;
  const x0 = x - w / 2;

  // La sombra al pie: es lo que la despega del suelo y la hace alta.
  r.ctx.save();
  r.ctx.globalAlpha = 0.3;
  r.rect(x0 - 2, y, w + 4, 6, '#000');
  r.ctx.restore();

  // El cuerpo, en bandas contadas DESDE LA BASE para que se continúen.
  let desdeAbajo = 0;
  let banda = 0;
  while (desdeAbajo < alto) {
    const h = Math.min(alto - desdeAbajo, BANDAS[banda % BANDAS.length]);
    const yb = y - desdeAbajo - h;
    r.rect(x0, yb, w, h, c(CAPAS[banda % CAPAS.length]));
    if (h > 2) r.rect(x0, yb + h - 1, w, 1, c('#493c2e'));
    desdeAbajo += h;
    banda += 1;
  }

  // El canto de arriba, donde pega el sol.
  r.rect(x0, y - alto, w, 2, c('#a08d70'));
  r.rect(x0, y - alto + 2, w, 1, c('#8a7758'));

  /**
   * LAS GRIETAS VERTICALES VAN SALTEADAS, no una por bloque: una por bloque es
   * exactamente el dibujo de una pared de ladrillos.
   */
  if (s % 5 === 0) {
    const gx = x0 + 3 + (s % (w - 6));
    const largo = 10 + (s % Math.max(1, alto - 14));
    r.rect(gx, y - alto + 4, 1, largo, c('#3a2f24'));
    r.rect(gx + 1, y - alto + 4, 1, Math.round(largo * 0.6), c('#6d5943'));
  }

  // Pedregullo al pie: lo que se fue desprendiendo del paredón.
  if (s % 3 === 0) {
    const k = (s >>> 5) % 7;
    r.rect(x0 + 2 + k, y + 1, 3 + (k % 3), 2, c('#6a5946'));
    r.rect(x0 + 8 - k, y + 3, 2, 2, c('#5a4b3b'));
  }

  // El bloque que mira al hueco va oscurecido: es el canto de la grieta.
  if (alBorde) {
    r.ctx.save();
    r.ctx.globalAlpha = 0.5;
    r.rect(x0, y - alto, w, alto, '#000');
    r.ctx.restore();
  }
}

/**
 * LA BOCA: el fondo negro entre las dos puntas y la penumbra del paso. Lo que
 * se ve por el hueco no es campo abierto — es la grieta metiéndose adentro.
 */
function bocaDeLaQuebrada(r, c, d) {
  const medio = d.hueco / 2 - 2;
  const alto = alturaDeLaPared(0);
  const esquina = (u, v) => desdeLaPared(d, u, v);

  /**
   * 🐛 LA BOCA SIGUE LA LÍNEA DE LA PARED, CON LOS COSTADOS VERTICALES.
   *
   * La primera versión armaba el pasillo en perspectiva —la boca adelante y el
   * fondo corrido hacia adentro— y con la pared inclinada eso salía **torcido**:
   * un tajo oscuro caído de costado, como una losa apoyada. La profundidad acá
   * no se dibuja: **se pinta**, con tres tonos de sombra cada vez más oscuros.
   */
  const bordes = (u) => {
    const p = esquina(u, 0);
    return p;
  };
  const L = bordes(-medio);
  const R = bordes(medio);

  const tajo = (encoge, arriba, color) => {
    const li = bordes(-medio * encoge);
    const ri = bordes(medio * encoge);
    r.ctx.fillStyle = color;
    r.ctx.beginPath();
    r.ctx.moveTo(li.x, li.y + 2);
    r.ctx.lineTo(ri.x, ri.y + 2);
    r.ctx.lineTo(ri.x, ri.y - alto * arriba);
    r.ctx.lineTo(li.x, li.y - alto * arriba);
    r.ctx.closePath();
    r.ctx.fill();
  };

  r.ctx.save();
  // Tres capas: la boca, el pasillo y el fondo. Cada una más angosta y más
  // oscura que la anterior — eso es lo que se lee como "se mete para adentro".
  tajo(1, 0.92, '#33281e');
  tajo(0.72, 0.84, '#1f1811');
  tajo(0.42, 0.74, '#100d09');

  // Los dos cantos de la grieta, iluminados apenas: marcan dónde está el paso.
  r.rect(L.x - 1, L.y - alto * 0.92, 1, alto * 0.92, c('#6d5b45'));
  r.rect(R.x, R.y - alto * 0.92, 1, alto * 0.92, c('#6d5b45'));

  // La sombra que el paredón tira sobre el campo del que llega.
  r.ctx.globalAlpha = 0.22;
  r.ctx.fillStyle = '#000';
  const s0 = esquina(-d.largo / 2, -PARED / 2);
  const s1 = esquina(d.largo / 2, -PARED / 2);
  const s2 = esquina(d.largo / 2, -PARED / 2 - 20);
  const s3 = esquina(-d.largo / 2, -PARED / 2 - 20);
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
