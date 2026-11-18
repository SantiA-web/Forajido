/**
 * 🤝 EL COMPAÑERO — el asalto es de a dos.
 *
 * *(Santi: "ahora creo que el compañero quiero que sea más importante, al punto de que no se puede jugar el asalto
 * solo")*. El diseño entero está en NOTAS-DISENO.md ("El compañero: el asalto es de a dos"). Esto es el PRIMER PASO:
 * sube con vos, te sigue por adentro del tren, y tiene muy claro cuándo está en sigilo y cuándo no *(Santi: "Debe
 * tener muy claro cuando está en sigilo y cuando no")*. Lleva un Colt y un cuchillo *(Santi: "Ponele un revólver
 * Colt y un cuchillo a este compañero (se lo puede cambiar él después), pero para empezar")*.
 *
 * ES UN JUGADOR MÁS, SIN TECLADO. Se arma con `createPlayer` (entities/player.js) y se mueve con `updatePlayer`, igual
 * que vos: así le tocan las mismas reglas (las balas, el cuchillo, la recarga, el ruido de los tiros, lo que te tumba).
 * Lo que cambia es quién aprieta las teclas: un teclado de mentira (`teclado`) que maneja su cabeza, acá abajo. Y
 * camina con el mismo buscador de caminos que los guardias (`viajarHacia`, systems/ai.js), que ya sabe esquivar
 * asientos y cruzar puertas.
 *
 * LAS DOS CABEZAS:
 *  - **SIGILO** mientras nadie sabe que están: va agachado (no hace ruido), te sigue un poco atrás y NO TIRA NUNCA.
 *    Si un guardia que no los vio está por descubrirlos y lo tiene de espaldas al alcance, lo degüella con el
 *    cuchillo. Si no, se queda quieto.
 *  - **PELEA** desde que suena la alarma, hay un guardia en combate cerca, le pegan o tirás vos: se para, saca el
 *    Colt y le tira al guardia más cercano que vea. Se queda así hasta que pase un rato (`calma`) sin alarma ni
 *    nadie peleando.
 * Cuando cambia de una a otra lo dice arriba de la cabeza, para que se sepa en qué anda.
 *
 * 📣 LAS ÓRDENES (paso 3, ver NOTAS): con [F] apuntás a algo y él lo hace —un guardia: "atacá ahí"; un botín: "robá
 * aquello"; un lugar: "cubrí acá"— y con [V] "seguime". Mandan sobre todo lo demás menos escaparle a una mecha o a un
 * cajón que rueda. Las cumple aunque lo vean *(Santi: "Los comandos que pueden alertar a un guardia los hace igual")*,
 * y salvo "cubrí acá" nunca se aleja más de un vagón del tuyo.
 *
 * 🎭 LAS TRES FORMAS DE SER (`FORMAS`): cómo decide solo, sin órdenes. Se elige en el campamento (hablándole con [E])
 * y en el asalto con [1] [2] [3], con un ratito hasta que cambia (`CAMBIO_DE_FORMA`). Ninguna empieza un tiroteo.
 *
 * ⚠️ LO QUE FALTA (en orden, ver NOTAS):
 * el techo (hoy, si subís, te espera abajo), ir de jinete, la plata y la cárcel, y su dibujo propio. Hoy usa el
 * dibujo del jugador con otros colores, **provisorio**, sólo para distinguirlo.
 */

import { CONFIG } from '../data/config.js';
import { createPlayer, updatePlayer } from '../entities/player.js';
import { distance, angleDifference, hasLineOfSight, overlapsSolid, moveAndCollide } from '../engine/collision.js';
import { viajarHacia, canSeeFrom } from './ai.js';
import { findCoverPoint, findCoverSurface } from './cover.js';
import { sePuedeAmenazar } from '../entities/passenger.js';
import { robTimeDe } from '../data/paquetes.js';

const K = {
  // A cuánto de vos se queda: un poco atrás (hacia la cola) y en tu misma fila.
  atras: 22,
  // Más cerca que esto no se mueve (si no, tiembla dando pasitos).
  quieto: 10,
  // Si te alejás más que esto, corre aunque esté en sigilo (agachado, igual de callado).
  lejos: 90,
  // Lo que tarda en reaccionar a un blanco nuevo antes del primer tiro, y entre tiros sueltos.
  reaccion: 0.45,
  entreTiros: 0.55,
  // Hasta dónde ve para tirar (el Colt pega bien hasta ahí).
  alcance: 190,
  // El cuchillo: hasta dónde llega, y cuánto de "de espaldas" tiene que estar el guardia (en radianes).
  // (🐛 Era 17, pero el cuchillo llega a 15 (`CONFIG.melee.range`): a esa distancia lo tiraba al aire.)
  cuchillo: 14,
  espaldas: 1.7,
  // Si un guardia ya tiene esta sospecha, está por descubrirlos: es el momento del cuchillo.
  descubre: 0.3,
  // Segundos sin alarma ni nadie peleando para volver a sigilo.
  calma: 6,
  // Cuánto dura arriba de la cabeza el cartel del cambio.
  cartel: 1.6,
  // 🛡️ La cobertura: hasta dónde camina para buscar un reparo, a qué distancia del guardia lo prefiere, cada
  // cuánto vuelve a buscar, y cuánto se acuerda de un guardia que dejó de ver (escondido no ve a nadie).
  buscaReparo: 64,
  reparoIdeal: 80,
  rebuscar: 1,
  recuerdo: 2.5,
  // 📣 Las órdenes: a cuánto del lugar de "cubrí acá" cuenta que llegó (y a cuánto se vuelve si lo corrieron), hasta
  // dónde busca un reparo alrededor de ese lugar, a qué distancia del botín se para a robarlo, y detrás de quién se
  // pone para el cuchillo de "atacá ahí".
  llegaLugar: 5,
  vuelveLugar: 14,
  reparoDelLugar: 40,
  alBotin: 10,
  // 🎭 A cuánto de una puerta trabada la puede destrabar el pasajero de la banda.
  alPuerta: 14,
  /**
   * 🎭 EL PASAJERO DE LA BANDA, DE INCÓGNITO, CAMINA COMO UN PASAJERO *(Santi: "se fue rapidísimo al vagón de
   * pasajeros, debería ser un movimiento más realista")*: a este paso, no al tuyo (78). Corre recién cuando lo
   * descubren, cuando lo liberás o cuando viene al caballo. ⚠️ Primer tanteo: entre la ronda de un guardia (24) y su
   * paso de pelea (46).
   */
  pasoPasajero: 36,
  // 🎭 DESCUBIERTO, A ESCONDERSE: cuánto tiene que estar a la vista de un guardia en su escondite para irse a otro, cada
  // cuánto puede buscar otro, hasta dónde va a buscarlo, y cuánto se queda quieto entre salto y salto cuando se te acerca.
  vistoEnEscondite: 0.4,
  buscaEscondite: 0.8,
  esconditeLejos: 200,
  pausaSalto: 1.2,
  salto: 64,
  caminoFino: 320,    // hasta esta distancia camina con el camino de a 4 unidades (`caminoFino`); más lejos, el de los guardias
  revisaLugar: 0.5,   // cada cuánto mira si el peligro de su lugar cambió (`revisarLugar`)
  giroPeligro: 0.6,   // cuánto tiene que cambiar de lado el peligro (en radianes, unos 35°) para buscar otro reparo
  oyenA: 140,         // con una orden, va agachado sólo si hay un guardia a menos de esto
  // (Se para a unos 6 del punto: así queda a unos 11 del guardia, al alcance del cuchillo.)
  detras: 9,
};

/**
 * 🎒 LO QUE CARGA LE PESA, PERO MENOS QUE A VOS *(Santi: "en el vagón de carga también condiciona su movimiento pero
 * menos que al jugador")*: la misma cuenta que tu mochila (`lastreActual` en scenes/raidScene.js) por este factor.
 * ⚠️ Provisorio: el número va con su tabla cuando lleguemos al ladrón.
 */
export const PESO_COMPANERO = 0.6;

/**
 * 📣 LA [F] DE LAS ÓRDENES (la lee scenes/raidScene.js): cuánto hay que sostenerla sobre un civil para que la orden
 * valga (así nunca es sin querer), cuánto dura la marca de adónde lo mandaste, y a qué distancia de la mira cuenta un
 * botín como "aquello".
 */
export const ORDENES = { civilSostenida: 0.5, marca: 1.2, botinRadio: 14, radio: 40, alPasajero: 12 };
/**
 * 🔁 `radio`: LAS ÓRDENES SON UN CÍRCULO, NO UN PUNTO *(Santi: "quiero que los comandos funcionen no como un punto exacto
 * sino un circulo, un area")*. 40 de radio = 80 de diámetro, 5 casillas: la "B" de la tabla *(Santi: "vamos con lo que
 * recomiendas")*. `alPasajero`: a cuánto se para para amenazar a uno.
 */

/**
 * 🎭 LAS TRES FORMAS DE SER *(decididas con Santi: ver NOTAS-DISENO.md, "Paso 3")*. ⚠️ Los números son un primer tanteo:
 *  - `atras`: a cuánto de vos camina.
 *  - `reparoIdeal`: a qué distancia del guardia le gusta el reparo.
 *  - `entreTiros`: por cuánto se multiplica el rato entre tiro y tiro.
 *  - `acecho`: hasta dónde va a buscar a un guardia de espaldas para el cuchillo (sólo el agresivo; 0 = nunca).
 *  - `avanza`: en pelea, si el blanco está más lejos que esto, se le acerca por el costado en vez de cubrirse
 *    (sólo el agresivo; 0 = nunca).
 *  - `botin`: hasta dónde va solo a agarrar un botín que ve (sólo el ladrón; 0 = nunca).
 *  - `soloAlQueTira`: en pelea le tira sólo a los que les están tirando (los guardias en combate y los jinetes).
 *  - `retrocede`: herido y sin reparo, se aleja del que le pegó.
 */
export const FORMAS = {
  pasivo:   { atras: 34, reparoIdeal: 110, entreTiros: 1,   acecho: 0,  avanza: 0,  botin: 0,  soloAlQueTira: true,  retrocede: true },
  agresivo: { atras: 18, reparoIdeal: 70,  entreTiros: 0.8, acecho: 60, avanza: 90, botin: 0,  soloAlQueTira: false, retrocede: false },
  ladron:   { atras: 22, reparoIdeal: 90,  entreTiros: 2.2, acecho: 0,  avanza: 0,  botin: 120, soloAlQueTira: false, retrocede: false },
};
/** Las tres, en el orden de las teclas [1] [2] [3] y del menú del campamento. */
export const NOMBRES_DE_FORMA = ['pasivo', 'agresivo', 'ladron'];
/** Cuánto tarda en cambiar de forma en el asalto (de cuando apretás la tecla a cuando cambia). */
export const CAMBIO_DE_FORMA = 2;
/** Después de "seguime", cuántos segundos no sale solo a buscar nada (si no, el ladrón se iría enseguida al botín). */
const SIN_INICIATIVA = 6;

/**
 * 🎯 SU PUNTERÍA: cuánto se desvía cada tiro (en radianes), de `cerca` (a `desde` o menos) a `lejos` (a `hasta`
 * o más), como los guardias (`spreadAt` en systems/ai.js). Encima va el 15% de tiros que se le van, igual que a vos.
 *
 * 🔁 LA "A2" DE LA TABLA *(Santi: "dale con la A2")*. Medido contra un guardia quieto, 80 tiros por distancia: a 50,
 * 95%; a 100, 55%; a 150, 33%. Antes tiraba con la del Colt sin apuntar (0,035 siempre): 98%, 76% y 68%, casi tan
 * bueno como vos, y te hacía el trabajo.
 */
export const PUNTERIA = { cerca: 0.045, lejos: 0.07, desde: 40, hasta: 130 };

/**
 * 🎯 LO QUE LE MUEVE EL PULSO *(Santi: "Siendo disparado, corriendo y estando más tiempo apuntando quieto modifica su
 * puntería, no?")*. Se multiplica sobre `PUNTERIA`:
 *  - **Recién le apunta a uno**: `apuraInicio` (más desvío); **quieto apuntando al mismo**, baja hasta `asentado` en
 *    `asentarse` segundos. Como vos con el clic derecho.
 *  - **Le acaban de pegar**: `golpe` durante `golpeDura` segundos.
 *  - **Tirando mientras camina**: `caminando` (hoy no pasa nunca: se planta para tirar; es para el agresivo).
 */
export const PULSO = { apuraInicio: 1.5, asentado: 0.7, asentarse: 1.5, golpe: 1.6, golpeDura: 1, caminando: 2 };

function pulso(c) {
  const t = Math.min(1, (c.apuntaT || 0) / PULSO.asentarse);
  let f = PULSO.apuraInicio + (PULSO.asentado - PULSO.apuraInicio) * t;
  if (c.golpeT > 0) f *= PULSO.golpe;
  if (c.moving) f *= PULSO.caminando;
  return f;
}

function desvioA(dist) {
  const t = Math.max(0, Math.min(1, (dist - PUNTERIA.desde) / (PUNTERIA.hasta - PUNTERIA.desde)));
  return PUNTERIA.cerca + (PUNTERIA.lejos - PUNTERIA.cerca) * t;
}

/**
 * 🎨 PROVISORIO: los colores del jugador cambiados, para que se distinga hasta que tenga su dibujo propio (paso 6 del
 * plan). Sombrero gris, pañuelo verde, chaleco azul y barba gris. Son índices de la paleta de 48 (engine/paleta.js).
 */
export const COLORES_COMPANERO = {
  h: 25, H: 24, k: 23, K: 31,          // el sombrero gris
  S: 43, R: 27, r: 26,                 // el pañuelo verde
  U: 20, V: 19, v: 41,                 // el chaleco azul
  n: 24,                               // la barba gris
};

export function crearCompanero(x, y, forma = 'pasivo') {
  const c = createPlayer(x, y, 'colt', 'cuchillo');
  // Su propio Colt (una copia): su puntería se ajusta sin tocar la tuya.
  c.weapon = { ...c.weapon };
  Object.assign(c, {
    esCompanero: true,
    modo: 'sigilo',
    colores: COLORES_COMPANERO,
    // Sin pañuelo subido: es el único con la cara a la vista (y así se lo reconoce de un vistazo).
    sinMascara: true,
    blanco: null,
    espera: 0,
    tranquilo: 0,
    cartel: 0,
    teclas: {},
    tirar: false,
    // 🎭 Su forma de ser (ver `FORMAS`), y la que le pediste si está por cambiar.
    forma: FORMAS[forma] ? forma : 'pasivo',
    formaPedida: null,
    formaT: 0,
    // 🎒 Lo que roba (las órdenes de "robá aquello"): suyo hasta la salida; si cae, se pierde.
    carga: [],
    plata: 0,
  });
  return c;
}

/**
 * 🎭 EL DE LA BANDA QUE VA DE PASAJERO, YA ACTIVADO (le hablaste: ver `hablarConElPasajero` en scenes/raidScene.js)
 * *(Santi, 2026-11-14: "El asesinato sería sigiloso al apretar F: se acercaría agachado por detrás de un guardia y lo
 * acuchillaría. Además, puede abrir puertas cerradas")*. Es este mismo compañero con `pasajero: true`, que cambia:
 *  - **Nunca pelea ni tira**: siempre en silencio, y sin la [F] no hace nada solo (ni acuchilla ni roba).
 *  - **Camina parado, como un pasajero más**; sólo se agacha para ir a acuchillar.
 *  - **Te sigue de lejos, pero sólo por los vagones con gente** (lo decide la escena con `estado.seguirHasta`).
 *  - **Las órdenes son dos**: acuchillar a un guardia y abrir una puerta trabada (`{ tipo: 'abrir', puerta }`), y
 *    puede ir a otro vagón a cumplirlas.
 *  - Para los guardias es un pasajero más hasta que lo ven acuchillando (`descubierto`, lo pone la escena).
 * `aspecto`: su ropa, para dibujarlo como al pasajero que era.
 */
export function crearPasajeroDeBanda(x, y, id, aspecto) {
  const c = crearCompanero(x, y, 'pasivo');
  Object.assign(c, { pasajero: true, banda: id, _aspecto: aspecto, descubierto: false, cuchilladas: 0, pegado: false });
  return c;
}

/** El teclado de mentira: lo que su cabeza decidió apretar este cuadro. */
function teclado(c) {
  const t = c.teclas;
  return {
    isDown: (k) => !!t[k],
    anyDown: (...ks) => ks.some((k) => t[k]),
    wasPressed: (k) => t[k] === 'pulso',
    // 🔁 Su cuchillo es la ruedita (la [F] ya no es el cuchillo: es la tecla de las órdenes).
    wheelMoved: () => t.rueda === 'pulso',
    mouse: { down: c.tirar, right: !!c.asoma },
  };
}

/**
 * Un cuadro del compañero. `estado` trae lo que sabe la escena: `alarma` (si sonó) y `player`.
 * Devuelve el cambio de cabeza de este cuadro ('sigilo' o 'pelea') o null, para que la escena lo muestre.
 */
export function actualizarCompanero(c, dt, world, estado) {
  const p = estado.player;
  c.cartel = Math.max(0, c.cartel - dt);
  if (!c.alive) return null;
  /**
   * ⛓️ ESPOSADO EN EL PISO (o con un guardia esposándolo, o arrastrado por vos): no se mueve solo. Lo maneja la escena
   * (ver `actualizarEsposar` y `arrastrarPasajero` en scenes/raidScene.js).
   */
  if (c.esposado || c.esposandolo || c.arrastrado) {
    c.teclas = {}; c.tirar = false; c.asoma = false; c.moving = false;
    if (c.cover) c.cover = null;
    return null;
  }
  // ¿Le pegaron? (la vida bajó desde el cuadro anterior)
  if (c.vidaAntes != null && c.health < c.vidaAntes) c.golpeT = PULSO.golpeDura;
  c.vidaAntes = c.health;
  c.golpeT = Math.max(0, (c.golpeT || 0) - dt);

  // --- ¿Sigilo o pelea? ---
  const peleaCerca = world.enemies.some((e) => e.alive && !(e.inconsciente > 0) && e.state === 'combat' &&
    (distance(e.x, e.y, c.x, c.y) < 260 || distance(e.x, e.y, p.x, p.y) < 260));
  // (🎭 El pasajero de la banda no pelea nunca: siempre en silencio.)
  const peligro = !c.pasajero && (estado.alarma || peleaCerca || c.hitFlash > 0 || p.muzzle > 0);
  if (c.pasajero && c.hitFlash > 0) c.pegado = true;
  let cambio = null;
  if (peligro) {
    c.tranquilo = 0;
    if (c.modo !== 'pelea') { c.modo = 'pelea'; cambio = 'pelea'; c.espera = K.reaccion; }
  } else if (c.modo === 'pelea') {
    c.tranquilo += dt;
    if (c.tranquilo > K.calma) { c.modo = 'sigilo'; cambio = 'sigilo'; c.blanco = null; }
  }
  if (cambio) c.cartel = K.cartel;

  // --- 🎭 La forma que le pediste: cambia pasado un ratito ---
  if (c.formaPedida) {
    c.formaT -= dt;
    if (c.formaT <= 0) { c.forma = c.formaPedida; c.formaPedida = null; c.aviso = c.forma; }
  }
  const forma = FORMAS[c.forma] || FORMAS.pasivo;
  c.sinIniciativa = Math.max(0, (c.sinIniciativa || 0) - dt);

  // --- La orden que le diste, si sigue valiendo; si no tiene ninguna, la que se da él según su forma ---
  let orden = ordenVigente(c, p, estado);
  if (!orden && !c.pasajero && !c.sinIniciativa && p.alive && !p.enTecho) orden = iniciativa(c, p, world, estado, forma);
  c.robando = false;

  // --- 📣 "Cubrí acá": de cara a qué peligro, en qué reparo del círculo, y si ya llegó ---
  const lugar = orden && orden.tipo === 'cubrir' ? orden : null;
  if (lugar) revisarLugar(c, dt, world, lugar, estado);
  const dLugar = lugar ? distance(c.x, c.y, lugar.x, lugar.y) : 0;
  // (Llega cuando está casi encima, o cerca y ya no avanza: a 5 apretaba el [Shift] antes de tiempo.)
  const enLugar = !!lugar && (lugar.llego ? dLugar <= K.vuelveLugar : (dLugar <= 2 || (dLugar <= K.llegaLugar && !c.moving)));

  // --- Qué aprieta ---
  c.teclas = {};
  c.tirar = false;
  c.asoma = false;
  let mira = null;          // adónde apunta
  let destino = null;       // adónde camina

  /**
   * 🧨 UNA MECHA ENCENDIDA CERCA: SE VA *(Santi: "no sé si entiende la dinamita")*. La misma regla que los guardias
   * (`explosivoPeligroso` en systems/ai.js): una dinamita tirada (tuya o de un guardia) a menos de su `fleeRadius` y
   * sin pared de por medio. Se despega del reparo y corre para el lado contrario; no tira mientras tanto.
   */
  const mecha = dinamitaCerca(c, world);
  /**
   * 🛢️ Y UN CAJÓN DE PÓLVORA QUE VIENE RODANDO POR SU CARRIL: se sale del carril, como los guardias
   * (`reaccionarAlCajon` en systems/ai.js). Lo primero es eso, siempre: es lo único que evita el atropello.
   */
  const cajon = mecha ? null : cajonQueViene(c, world);
  c.huyendo = !!(mecha || cajon);
  if (mecha) {
    if (c.cover) c.teclas.ShiftLeft = 'pulso';
    c.reparo = null;
    const lado = c.x >= mecha.x ? 1 : -1;
    destino = { x: c.x + lado * 48, y: c.y };
  } else if (cajon) {
    if (c.cover) c.teclas.ShiftLeft = 'pulso';
    c.reparo = null;
    if (!c.ladoCajon || c.cajonVisto !== cajon) { c.ladoCajon = c.y < cajon.y ? -1 : 1; c.cajonVisto = cajon; }
    // Si del lado elegido hay pared, el otro.
    const yDestino = c.y + c.ladoCajon * 24;
    if (world.map.isSolidAt(c.x, yDestino)) c.ladoCajon = -c.ladoCajon;
    destino = { x: c.x, y: c.y + c.ladoCajon * 24 };
  } else if (orden && orden.tipo === 'abrir') {
    /**
     * 🎭 "ABRÍ ESA PUERTA" (sólo el pasajero de la banda): va hasta la puerta trabada, sin agacharse, y la destraba
     * (`estado.abrirPuerta`). Callado: no es romperla a tiros.
     */
    const d = orden.puerta;
    if (distance(c.x, c.y, d.x, d.y) > K.alPuerta) destino = { x: d.x, y: d.y };
    else {
      mira = d;
      if (estado.abrirPuerta) estado.abrirPuerta(c, d);
      c.orden = null;
      c.aviso = 'abierta';
    }
  } else if (orden && orden.tipo === 'robar') {
    /**
     * 📣 "ROBÁ AQUELLO": va hasta el botín (agachado si están en silencio), se para y lo agarra en el mismo tiempo que
     * vos, sin tirar mientras tanto (robar es de dos manos, como para vos). Lo que agarra es suyo hasta la salida.
     */
    // (🔁 Con el círculo: todo lo del círculo, de a uno, lo más cerca primero —ver `ordenVigente`—. Y también amenaza
    // a los pasajeros para sacarles la plata, como vos con la [E].)
    if (c.cover) c.teclas.ShiftLeft = 'pulso';
    if (c.modo === 'sigilo') c.teclas.Space = true;
    const q = orden.botin || orden.pasajero;
    if (c.robaQue !== q) { c.robaQue = q; c.robaT = 0; }
    const llega = orden.botin ? K.alBotin : ORDENES.alPasajero;
    if (distance(c.x, c.y, q.x, q.y) > llega) { destino = { x: q.x, y: q.y }; c.robaT = 0; }
    else {
      mira = q;
      c.robaT = (c.robaT || 0) + dt;
      c.robando = true;
      const tarda = orden.botin ? (q.duration || 0.6) : robTimeDe(q);
      if (c.robaT >= tarda) {
        c.robaT = 0;
        if (orden.botin) {
          if (!(estado.tomarBotin && estado.tomarBotin(c, q))) {
            c.aviso = 'noEntra';
            orden.botines = orden.botines.filter((l) => l !== q);   // no le entra: lo deja y sigue con lo demás
          }
        } else if (estado.robarPasajero) estado.robarPasajero(c, q);
      }
    }
  } else if (c.pasajero && (c.liberado || c.vieneAlCaballo)) {
    /**
     * ⛓️ 🐎 LIBERADO, O LLAMADO AL CABALLO: corre con vos, por donde sea, sin esconderse *(Santi: "Si solo está esposado
     * correrá con él"; "el caballo espera hasta que llegue")*.
     */
    if (c.cover) c.teclas.ShiftLeft = 'pulso';
    c.escondite = null;
    c.agachadoEscondido = false;
    c.corre = true;
    const lado = p.x >= c.x ? -1 : 1;
    destino = { x: p.x + lado * 14, y: p.y };
    if (distance(c.x, c.y, destino.x, destino.y) < K.quieto) destino = null;
  } else if (c.pasajero && c.descubierto && !orden) {
    const h = esconderse(c, dt, world, p, estado);
    destino = h.destino; mira = h.mira;
    if (h.shift) c.teclas.ShiftLeft = 'pulso';
    // (Quieto en el escondite o entre salto y salto, agachado.)
    if (!destino && c.agachadoEscondido) c.teclas.Space = true;
  } else if (orden && orden.tipo === 'atacar' && c.modo === 'sigilo') {
    /**
     * 📣 "ATACÁ AHÍ" EN SILENCIO: agachado hasta la espalda del marcado y el cuchillo. Nunca el Colt: en silencio no
     * empieza un tiroteo *(Santi: "NUNCA puede empezar un tiroteo solo")*. Si lo ven en el camino, lo hace igual.
     */
    c.teclas.Space = true;
    const e = orden.blanco;
    /**
     * 🐛 DE VERDAD POR LA ESPALDA: el cuchillo es silencioso sólo desde atrás (`isFromBehind`, systems/melee.js).
     * Si el punto justo detrás cae en un asiento, prueba un poco más a un lado o al otro; y no acuchilla hasta estar
     * ahí (antes llegaba por el costado y el guardia lo oía).
     */
    const mirada = e.facing != null ? e.facing : Math.atan2(c.y - e.y, c.x - e.x) + Math.PI;
    let espalda = null;
    for (const giro of [0, 0.6, -0.6, 1.1, -1.1]) {
      const a = mirada + Math.PI + giro;
      const q = { x: e.x + Math.cos(a) * K.detras, y: e.y + Math.sin(a) * K.detras };
      if (!world.map.isSolidAt(q.x, q.y)) { espalda = q; break; }
    }
    const desdeAtras = Math.abs(angleDifference(mirada, Math.atan2(c.y - e.y, c.x - e.x))) > Math.PI - CONFIG.melee.backArc * 0.9;
    if (distance(c.x, c.y, e.x, e.y) <= K.cuchillo && (desdeAtras || !espalda || e.facing == null)) {
      mira = e;
      if (c.meleeTimer <= 0) c.teclas.rueda = 'pulso';
    } else destino = espalda || { x: e.x, y: e.y };
  } else if (c.modo === 'sigilo') {
    // (🎭 El pasajero de la banda, sin orden, es un pasajero más: parado y sin cuchillo.)
    if (!c.pasajero) {
      c.teclas.Space = true;  // agachado: no hace ruido al caminar
      const victima = presaDelCuchillo(c, p, world, !forma.acecho);
      if (victima) {
        mira = victima;
        if (c.meleeTimer <= 0) c.teclas.rueda = 'pulso';
      }
    }
  } else {
    // Pelea: el guardia más cercano que vea, con un ratito para reaccionar cuando cambia.
    // 📣 Con "atacá ahí", el marcado primero (también un civil: sólo así le tira a uno).
    const forzado = orden && orden.tipo === 'atacar' ? orden.blanco : null;
    const visto = forzado
      ? (hasLineOfSight(c.x, c.y, forzado.x, forzado.y, world.map.blocksSightAt) && distance(c.x, c.y, forzado.x, forzado.y) <= K.alcance ? forzado : null)
      : elegirBlanco(c, world, forma.soloAlQueTira);
    c.recuerdo = visto ? K.recuerdo : Math.max(0, (c.recuerdo || 0) - dt);
    // Escondido detrás del reparo (o yendo hacia él) no ve a nadie: sigue con el último que vio, un rato.
    const b = visto || (c.blanco && c.blanco.alive && c.recuerdo > 0 ? c.blanco : null);
    if (b !== c.blanco) { c.blanco = b; c.apuntaT = 0; if (b) c.espera = Math.max(c.espera, K.reaccion); }
    else if (b) c.apuntaT = (c.apuntaT || 0) + dt;
    c.espera = Math.max(0, c.espera - dt);
    c.reparoT = Math.max(0, (c.reparoT || 0) - dt);
    // 📣 En el lugar de "cubrí acá" se queda aunque te vayas (`lugar`, arriba).
    const teDeja = !lugar && distance(c.x, c.y, p.x, p.y) > K.lejos;
    // (El agresivo no se esconde: tira y avanza. Sólo se cubre si lo mandaste a "cubrí acá".)
    const seCubre = !forma.avanza || !!lugar;
    const ancla = lugar || p;
    if (b) c.weapon.spread = c.weapon.spreadApuntado = desvioA(distance(c.x, c.y, b.x, b.y)) * pulso(c);

    /**
     * 🛡️ A CUBIERTO, CON TU MISMA COBERTURA (la de [Shift]): pegado al reparo los de enfrente no lo ven ni le pegan, y
     * para tirar se asoma (tu clic derecho). Se esconde mientras recarga y cuando le acaban de pegar. Sale si te
     * alejás o si ya no queda nadie de quien cubrirse.
     */
    if (lugar && !enLugar) {
      // 📣 🐛 Yendo a su lugar (o al nuevo, si le diste otra orden o cambió el peligro): se despega del reparo en el
      // que estaba y camina, sin tirar. Antes se quedaba pegado al viejo y la orden nueva no hacía nada.
      if (c.cover) c.teclas.ShiftLeft = 'pulso';
      lugar.llego = false;
      destino = { x: lugar.x, y: lugar.y };
    } else if (lugar && !lugar.llego) {
      lugar.llego = true;
      if (!c.cover) c.teclas.ShiftLeft = 'pulso';
      if (b) mira = b;
    } else if (c.cover) {
      if (lugar ? false : (teDeja || !b)) c.teclas.ShiftLeft = 'pulso';
      else if (b) {
        mira = b;
        c.asoma = c.reloadTimer <= 0 && c.golpeT < PULSO.golpeDura * 0.5;
        if (visto && c.peek >= CONFIG.player.peekShootAt && c.espera <= 0 && c.fireTimer <= 0) {
          c.tirar = true; c.espera = K.entreTiros * forma.entreTiros;
        }
      }
    } else if (b && !lugar && forma.retrocede && c.golpeT > 0 && !b.side && !c.reparo) {
      /**
       * 🎭 EL PASIVO, HERIDO Y SIN REPARO, RETROCEDE: se aleja del que le pegó (para tu lado si puede), sin tirar.
       */
      const a = Math.atan2(c.y - b.y, c.x - b.x);
      const q = { x: c.x + Math.cos(a) * 36, y: c.y + Math.sin(a) * 36 };
      destino = world.map.isSolidAt(q.x, q.y) ? { x: p.x, y: p.y } : q;
    } else if (b) {
      // Sin reparo: busca uno cerca (y que no lo aleje de vos); mientras camina hasta ahí no tira.
      // (Contra un jinete no: está afuera, y el reparo de adentro no tapa de la ventanilla. Le tira parado.)
      if (seCubre && !lugar && !c.reparo && c.reparoT <= 0 && !b.side) {
        c.reparoT = K.rebuscar;
        const r = findCoverPoint(world.map, c.x, c.y, b.x, b.y, [], forma.reparoIdeal, K.alcance);
        c.reparo = r && distance(c.x, c.y, r.x, r.y) < K.buscaReparo &&
          distance(r.x, r.y, ancla.x, ancla.y) < (lugar ? K.reparoDelLugar : K.lejos) ? r : null;
      }
      if (c.reparo && distance(c.x, c.y, c.reparo.x, c.reparo.y) < 4) {
        c.teclas.ShiftLeft = 'pulso';     // se pega (si ahí no hay pared, sigue parado y tira)
        c.reparo = null;
        c.reparoT = K.rebuscar * 2;
      }
      if (c.reparo) destino = { x: c.reparo.x, y: c.reparo.y };
      else {
        // Parado, como antes (y sólo le tira al que ve).
        mira = b;
        /**
         * 🐛 Y APUNTANDO (tu clic derecho): así la bala pasa por encima de la cobertura baja, la barra *(Santi: "no sabe
         * distinguir una cobertura baja de una cobertura normal, porque en la barra sus balas pegaban en ella en vez de
         * pasar por encima")*. Tirando sin apuntar, como vos, pegaba en la madera (`tiraPorEncima`, entities/player.js).
         */
        c.asoma = true;
        if (visto && c.espera <= 0 && c.fireTimer <= 0) { c.tirar = true; c.espera = K.entreTiros * forma.entreTiros; }
        /**
         * 🎭 EL AGRESIVO AVANZA POR EL COSTADO: si el blanco está lejos, se le acerca abriéndose a un lado (siempre el
         * mismo para ese blanco), tirando mientras camina (con el pulso de caminando). Sin pasarse de la correa.
         */
        if (forma.avanza && !b.side && distance(c.x, c.y, b.x, b.y) > forma.avanza) {
          if (c.flancoDe !== b) { c.flancoDe = b; c.flanco = Math.random() < 0.5 ? -1 : 1; }
          const a = Math.atan2(b.y - c.y, b.x - c.x) + c.flanco * 0.5;
          let q = { x: c.x + Math.cos(a) * 30, y: c.y + Math.sin(a) * 30 };
          if (world.map.isSolidAt(q.x, q.y)) q = { x: c.x + Math.cos(a - c.flanco) * 30, y: c.y + Math.sin(a - c.flanco) * 30 };
          const dentro = !estado.vagonDe || Math.abs(estado.vagonDe(q.x) - estado.vagonDe(p.x)) <= 1;
          if (dentro && !world.map.isSolidAt(q.x, q.y)) destino = q;
        }
      }
    } else if (forzado) {
      // 📣 El marcado no está a la vista: va a buscarlo.
      if (c.cover) c.teclas.ShiftLeft = 'pulso';
      destino = { x: forzado.x, y: forzado.y };
    } else {
      c.reparo = null;
      // 🔫 Sin nadie a tiro, recarga aunque le queden balas (como harías vos), para no quedarse seco en el próximo.
      if (c.ammo < c.weapon.magazine && c.reloadTimer <= 0) c.teclas.KeyR = 'pulso';
    }
  }
  // En silencio también: si quedó con el tambor a medias de la pelea, lo llena.
  if (c.modo === 'sigilo' && !mecha && c.ammo < c.weapon.magazine && c.reloadTimer <= 0) c.teclas.KeyR = 'pulso';

  /**
   * 📣 "CUBRÍ ACÁ": camina hasta el lugar y al llegar se pega a la pared o al mueble que tenga al lado (tu [Shift]; si
   * no hay nada, se queda parado). Si lo corren de ahí (una mecha, un cajón, ir a un reparo), vuelve.
   */
  if (lugar && !mecha && !cajon && !destino && !mira) {
    if (!enLugar) {
      lugar.llego = false;
      if (c.cover) c.teclas.ShiftLeft = 'pulso';   // (🐛 se despega del reparo viejo)
      destino = { x: lugar.x, y: lugar.y };
    } else if (!lugar.llego) {
      lugar.llego = true;
      if (!c.cover) c.teclas.ShiftLeft = 'pulso';
    }
  }
  // Ya en su lugar y sin nadie a quien apuntar: mira al peligro (la puerta o el guardia) *(Santi: "que sepa hacia
  // dónde mirar")*.
  if (lugar && enLugar && !mira && !destino && lugar.peligro) mira = { x: lugar.peligro.x, y: lugar.peligro.y };

  // Te sigue, salvo que esté degollando, tirando, cubierto, yendo a un reparo o cumpliendo una orden.
  // Si subiste al techo, te espera abajo (subir con vos va aparte, ver NOTAS).
  // (En silencio y sin orden no se queda pegado a nada: sale del reparo para seguirte.)
  if (!orden && c.cover && c.modo === 'sigilo' && !mira) c.teclas.ShiftLeft = 'pulso';
  if (!orden && !mira && !destino && !c.cover && !p.enTecho && p.alive && !(c.pasajero && (c.descubierto || c.liberado || c.vieneAlCaballo))) {
    const lado = p.x >= c.x ? -1 : 1;
    destino = { x: p.x + lado * forma.atras, y: p.y };
    // 🎭 El pasajero de la banda, sólo por los vagones con gente (la escena dice hasta dónde).
    if (c.pasajero && estado.seguirHasta) destino = estado.seguirHasta(c, destino);
    if (destino && distance(c.x, c.y, destino.x, destino.y) < K.quieto) destino = null;
  }

  // El mundo como lo ve él: su teclado, su mira, y él como "el jugador" para las cosas del arma y del cuchillo.
  const suyo = Object.create(world);
  suyo.input = teclado(c);
  suyo.player = c;
  suyo.revolviendo = false;
  const apunto = mira || destino || { x: c.x + Math.cos(c.aim), y: c.y + Math.sin(c.aim) };
  suyo.aimX = apunto.x; suyo.aimY = apunto.y;
  suyo.aimAlto = null; suyo.aimZona = null;
  // Su recarga no es la tuya: los guardias que esperan "que recargues" te esperan a vos.
  suyo.bus = { emit: (n, d) => { if (n !== 'jugadorRecarga') world.bus.emit(n, d); }, on: (...a) => world.bus.on(...a) };
  // Sus tiros no sacuden tu pantalla.
  suyo.camera = { shake() {} };

  /**
   * 🔁 AGACHADO SÓLO SI LO PUEDEN OÍR *(Santi: "se tarda mucho")*: con una orden iba siempre agachado, y a paso de
   * agachado cruzar un vagón eran 20 s. Ahora, con una orden, sólo si hay un guardia a menos de `oyenA` (y siempre
   * para acuchillar). Sin orden, como antes: agachado cerca tuyo en silencio.
   */
  const lejos = distance(c.x, c.y, p.x, p.y) > K.lejos;
  const oyen = world.enemies.some((e) => e.alive && !(e.inconsciente > 0) && !e.rendido && distance(e.x, e.y, c.x, c.y) < K.oyenA);
  const agachado = c.pasajero ? (!!(c.orden && c.orden.tipo === 'atacar') || !!c.agachadoEscondido) && !c.huyendo && !c.corre
    : c.modo === 'sigilo' && !c.huyendo && (c.orden ? (oyen || c.orden.tipo === 'atacar') : !lejos);
  if (c.modo === 'sigilo' && destino) c.teclas.Space = agachado;

  const x0 = c.x, y0 = c.y;
  updatePlayer(c, dt, suyo);
  // Empezó a recargar: lo avisa arriba de la cabeza (la escena lo lee en `c.aviso`).
  if (c.reloadTimer > 0 && !c.recargando) c.aviso = 'recarga';
  c.recargando = c.reloadTimer > 0;

  // Camina con el buscador de caminos de los guardias (esquiva asientos y cruza puertas).
  if (destino && !c.tumbado && !c.trastabilla) {
    // (🎒 Y lo que carga lo frena: `c.lastre`, que pone la escena.)
    // (🎭 El pasajero de la banda de incógnito, al paso de un pasajero: `K.pasoPasajero`.)
    const deIncognito = c.pasajero && !c.descubierto && !c.liberado && !c.vieneAlCaballo;
    const vel = (agachado ? CONFIG.player.sneakSpeed : deIncognito ? K.pasoPasajero : CONFIG.player.speed) * (1 - (c.lastre || 0));
    const antes = c.facing;
    c.facing = c.aim;
    /**
     * 🐛 EL CAMINO FINO *(Santi: "se traba con las habitaciones del vagón dormitorio y con sillones en el vagón de
     * pasajeros [...] se tilda en ir desde una cobertura hacia el pasillo")*: el buscador de caminos de los guardias va
     * por casillas, y en el estilo nuevo los sillones, las piezas del dormitorio y la pared finita del fondo frenan sin
     * ser casillas sólidas: caminaba derecho y se trababa. Hasta `caminoFino` de distancia busca el camino de a 4
     * unidades con su cuerpo entero (`caminoFino`), y lo camina cortando derecho hasta el punto más lejos al que llega
     * sin chocar. Lo rehace cada 2 s, si el destino se movió o si se quedó trabado.
     */
    const mov = world.solidoParaJugador || world.map.isSolidForMovementAt || world.map.isSolidAt;
    const meta = Math.abs(destino.x - c.x) <= K.caminoFino ? siguientePaso(c, dt, mov, destino) : null;
    if (meta) {
      const dx = meta.x - c.x, dy = meta.y - c.y, d = Math.hypot(dx, dy);
      const paso = Math.min(d, vel * dt);
      if (d > 0.01) {
        const ax = c.x, ay = c.y;
        moveAndCollide(c, dx / d * paso, dy / d * paso, mov);
        c.facing = Math.atan2(dy, dx);
        if (Math.hypot(c.x - ax, c.y - ay) < paso * 0.3) c.caminoF.trabado += dt;
      }
    } else {
      // (De lejos, si el destino cae en una casilla sólida, el de los guardias no tiene adónde ir: lo mando a la
      // casilla libre de al lado y, ya cerca, sigue el camino fino.)
      let hacia = destino;
      const T = world.map.size, col = Math.floor(destino.x / T), row = Math.floor(destino.y / T);
      if (world.map.isSolidTile(col, row)) {
        let mejor = null;
        for (const [dc, dr] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
          if (world.map.isSolidTile(col + dc, row + dr)) continue;
          const q = world.map.tileCenter(col + dc, row + dr);
          if (!mejor || distance(q.x, q.y, c.x, c.y) < distance(mejor.x, mejor.y, c.x, c.y)) mejor = q;
        }
        if (mejor) hacia = mejor;
      }
      viajarHacia(c, dt, suyo, hacia.x, hacia.y, vel);
    }
    c.aim = c.facing;
    c.facing = antes;
  }
  c.moving = Math.hypot(c.x - x0, c.y - y0) > 0.05;
  return cambio;
}

/**
 * 🎭 DESCUBIERTO: A ESCONDERSE, Y DESPUÉS A ACERCARSE CON CUIDADO *(Santi: "se esconde en el mueble más cercano, si lo
 * descubren corre a otro, que esté despejado. Cuando no van quedando guardias se va acercando al jugador, pero siempre
 * con precausión")*. No tiene arma para pelear: sólo se cubre.
 *  - **Se esconde**: corre al reparo más cercano que lo tape del guardia más cercano (tu mismo [Shift]: pegado al
 *    mueble, del otro lado no lo ven) y se queda agachado ahí.
 *  - **Si lo ven en el escondite** (`vistoEnEscondite`), busca otro que no vea ningún guardia de los que lo miran.
 *    Si no hay ninguno, se aleja del que lo ve.
 *  - **Cuando quedan pocos** (uno o ninguno despierto en su vagón y los de al lado) y nadie lo ve: se te acerca de a
 *    saltos cortos (`salto`), parando agachado un rato (`pausaSalto`) entre uno y otro. Si alguien lo ve, vuelve a
 *    esconderse.
 * Devuelve `{ destino, mira, shift }`; y deja `c.agachadoEscondido` (va agachado) y `c.corre`.
 */
function esconderse(c, dt, world, p, estado) {
  const map = world.map;
  const despiertos = world.enemies.filter((e) => e.alive && !(e.inconsciente > 0) && !e.rendido && !e.manosArriba && !e.maquinista);
  const loVen = despiertos.filter((e) => distance(e.x, e.y, c.x, c.y) < 220 &&
    canSeeFrom(e.x, e.y, e.facing, c, map, false, e.ai && e.ai.viewDistance, e.ai && e.ai.viewAngle));
  c.vistoT = loVen.length ? (c.vistoT || 0) + dt : 0;
  c.buscaT = Math.max(0, (c.buscaT || 0) - dt);
  c.pausaT = Math.max(0, (c.pausaT || 0) - dt);
  const vagon = estado.vagonDe ? estado.vagonDe(c.x) : 0;
  const cerca = despiertos.filter((e) => !estado.vagonDe || Math.abs(estado.vagonDe(e.x) - vagon) <= 1);
  const r = { destino: null, mira: null, shift: false };
  c.corre = false;
  c.agachadoEscondido = true;

  // --- Quedan pocos y nadie lo ve: se acerca de a saltos ---
  if (cerca.length <= 1 && !loVen.length) {
    if (distance(c.x, c.y, p.x, p.y) < 30) { c.escondite = null; if (c.cover) r.shift = true; return r; }
    if (c.salto && distance(c.x, c.y, c.salto.x, c.salto.y) > 4) {
      if (c.cover) r.shift = true;
      r.destino = c.salto;
      return r;
    }
    if (c.salto) { c.salto = null; c.pausaT = K.pausaSalto; }
    if (c.pausaT > 0) return r;
    const d = distance(c.x, c.y, p.x, p.y), paso = Math.min(K.salto, d - 20);
    const a = Math.atan2(p.y - c.y, p.x - c.x);
    let q = { x: c.x + Math.cos(a) * paso, y: c.y + Math.sin(a) * paso };
    // (Si el punto cae en un mueble, derecho por el pasillo del medio.)
    if (map.isSolidAt(q.x, q.y)) q = { x: c.x + Math.sign(p.x - c.x) * paso, y: p.y };
    c.salto = q;
    c.escondite = null;
    if (c.cover) r.shift = true;
    r.destino = q;
    return r;
  }
  c.salto = null;

  // --- A esconderse ---
  const peligro = (loVen.length ? loVen : cerca).reduce((m, e) => !m || distance(e.x, e.y, c.x, c.y) < distance(m.x, m.y, c.x, c.y) ? e : m, null);
  if (!peligro) return r;
  const quemado = c.escondite && c.vistoT > K.vistoEnEscondite;
  if ((!c.escondite || quemado) && c.buscaT <= 0) {
    c.buscaT = K.buscaEscondite;
    const viejo = c.escondite;
    // "Que esté despejado": desde ese punto, ninguno de los que lo están mirando lo ve.
    const despejado = (q) => !loVen.some((e) => hasLineOfSight(e.x, e.y, q.x, q.y, map.blocksSightAt) &&
      !(map.isSolidAt(q.x + Math.cos(Math.atan2(e.y - q.y, e.x - q.x)) * 13, q.y + Math.sin(Math.atan2(e.y - q.y, e.x - q.x)) * 13)));
    const nuevo = findCoverPoint(map, c.x, c.y, peligro.x, peligro.y, viejo ? [viejo] : [], 60, K.esconditeLejos, despejado);
    c.escondite = nuevo ? { x: nuevo.x, y: nuevo.y } : null;
    if (!c.escondite) {
      // Ningún mueble sirve: se aleja del que lo ve, para tu lado si puede.
      const a = Math.atan2(c.y - peligro.y, c.x - peligro.x);
      const q = { x: c.x + Math.cos(a) * 40, y: c.y + Math.sin(a) * 40 };
      c.huida = map.isSolidAt(q.x, q.y) ? { x: c.x + Math.sign(c.x - peligro.x || 1) * 40, y: c.y } : q;
    } else c.huida = null;
    if (c.cover && c.escondite) r.shift = true;   // se despega del viejo
  }
  if (c.escondite) {
    if (distance(c.x, c.y, c.escondite.x, c.escondite.y) > 4) {
      c.corre = true;
      c.agachadoEscondido = false;
      r.destino = c.escondite;
    } else {
      if (!c.cover) r.shift = true;               // llegó: se pega al mueble
      r.mira = peligro;
    }
  } else if (c.huida) {
    c.corre = true;
    c.agachadoEscondido = false;
    r.destino = c.huida;
    if (distance(c.x, c.y, c.huida.x, c.huida.y) < 4) c.huida = null;
  }
  return r;
}

/**
 * 📣 UNA ORDEN NUEVA (la da la escena con [F] y [V]). Devuelve lo que dice arriba de la cabeza, o null si no la
 * puede cumplir.
 *  - `{ tipo: 'atacar', blanco }`: un guardia o un civil.
 *  - `{ tipo: 'robar', botin }`: algo del piso, una bolsa, una caja.
 *  - `{ tipo: 'cubrir', x, y }`: un lugar.
 *  - `{ tipo: 'seguir' }`: deja todo y vuelve atrás tuyo.
 */
export function ordenar(c, orden) {
  if (!c || !c.alive) return null;
  c.robaT = 0;
  c.reparo = null;
  if (orden.tipo === 'seguir') {
    c.orden = null;
    c.sinIniciativa = SIN_INICIATIVA;
    return 'teSigo';
  }
  c.orden = { ...orden, llego: false };
  if (orden.tipo === 'cubrir') { c.orden.puesto = false; c.orden.revisaT = 0; c.orden.centro = orden.centro || { x: orden.x, y: orden.y }; }
  elegirDelCirculo(c, c.orden);
  if (orden.tipo === 'atacar') { c.blanco = c.orden.blanco; c.recuerdo = K.recuerdo; }
  return orden.tipo === 'cubrir' ? 'cubro' : orden.tipo === 'robar' ? 'loRobo' : orden.tipo === 'abrir' ? 'abro' : 'voy';
}

/**
 * ¿SIGUE VALIENDO LA ORDEN? Se termina sola si el marcado cayó, se rindió o quedó desmayado, si el botín ya no está,
 * o —salvo "cubrí acá"— si te alejaste más de un vagón de él *(Santi: "El compañero puede alejarse hasta un vagón
 * atrás y un vagón adelante del vagón de dónde está el jugador, a menos que tenga el comando de 'cubrí acá'")*: ahí
 * la deja y vuelve con vos.
 */
function ordenVigente(c, p, estado) {
  const o = c.orden;
  if (!o) return null;
  let termino = false;
  elegirDelCirculo(c, o);
  if (o.tipo === 'atacar') {
    const e = o.blanco;
    termino = !e;
    // (🎭 La que se dio él, el agresivo: si el guardia se da vuelta o empieza a pelear, la deja. Las tuyas, no.)
    if (o.propia && !termino && (e.state === 'combat' || c.modo !== 'sigilo' ||
      Math.abs(angleDifference(e.facing, Math.atan2(c.y - e.y, c.x - e.x))) < K.espaldas)) termino = true;
  } else if (o.tipo === 'robar') termino = !o.botin && !o.pasajero;
  else if (o.tipo === 'abrir') termino = !o.puerta.trabada || o.puerta.broken;
  // (🎭 El pasajero de la banda puede ir a otro vagón a cumplir la orden *(Santi: "Puede abrir puertas de otros vagones
  // o acuchillar a uno de otro vagón")*: no tiene correa.)
  if (!termino && !c.pasajero && o.tipo !== 'cubrir' && estado.vagonDe && Math.abs(estado.vagonDe(c.x) - estado.vagonDe(p.x)) > 1) {
    termino = true;
    c.aviso = 'teSigo';
  }
  if (termino) { c.orden = null; return null; }
  return o;
}

/**
 * 🎭 LO QUE HACE SOLO, SEGÚN SU FORMA (sólo si no le diste ninguna orden). Devuelve una orden "propia" o null:
 *  - **el agresivo**, en silencio: un guardia que no está peleando, de espaldas a él, a la vista y a menos de `acecho`
 *    → va a acuchillarlo (y lo deja si el guardia se da vuelta);
 *  - **el ladrón**, en silencio o a los tiros: un botín a la vista a menos de `botin` que le entre → va a agarrarlo
 *    *(Santi: "entre cubrirte y la plata, la plata")*.
 * Siempre dentro de la correa: a un vagón de vos como mucho.
 */
function iniciativa(c, p, world, estado, forma) {
  const enCorrea = (q) => !estado.vagonDe || Math.abs(estado.vagonDe(q.x) - estado.vagonDe(p.x)) <= 1;
  const ve = (q) => hasLineOfSight(c.x, c.y, q.x, q.y, world.map.blocksSightAt);
  let o = null;
  if (forma.acecho && c.modo === 'sigilo') {
    let d0 = forma.acecho;
    for (const e of world.enemies) {
      if (!e.alive || e.inconsciente > 0 || e.rendido || e.state === 'combat') continue;
      const d = distance(c.x, c.y, e.x, e.y);
      if (d > d0 || !enCorrea(e) || !ve(e)) continue;
      if (Math.abs(angleDifference(e.facing, Math.atan2(c.y - e.y, c.x - e.x))) < K.espaldas) continue;
      d0 = d; o = { tipo: 'atacar', blancos: [e], propia: true };
    }
  }
  if (!o && forma.botin && world.loot) {
    const usadas = c.carga.reduce((s, q) => s + (q.slots || 1), 0);
    let d0 = forma.botin;
    for (const l of world.loot) {
      if (l.taken || l.oculto) continue;
      if (l.guardia && l.guardia.alive && !(l.guardia.inconsciente > 0)) continue;
      if (l.objeto && usadas + (l.objeto.slots || 1) > CONFIG.mochila.casillas) continue;
      const d = distance(c.x, c.y, l.x, l.y);
      // (🐛 No "a la vista": los respaldos de los asientos tapan la vista aunque el botín se vea en el dibujo. Basta
      // con que esté en su mismo vagón.)
      const mismoVagon = !estado.vagonDe || estado.vagonDe(l.x) === estado.vagonDe(c.x);
      if (d > d0 || !enCorrea(l) || !mismoVagon) continue;
      d0 = d; o = { tipo: 'robar', botines: [l], pasajeros: [], propia: true };
    }
  }
  if (o) { c.orden = { ...o, llego: false }; elegirDelCirculo(c, c.orden); }
  return o ? c.orden : null;
}

/**
 * 🎭 PEDIRLE OTRA FORMA DE SER ([1] [2] [3] en el asalto). No cambia en el acto: tarda `CAMBIO_DE_FORMA` segundos.
 * Devuelve lo que contesta arriba de la cabeza, o null si ya era ésa.
 */
export function pedirForma(c, forma) {
  if (!c || !c.alive || !FORMAS[forma]) return null;
  if (forma === (c.formaPedida || c.forma)) return null;
  c.formaPedida = forma === c.forma ? null : forma;
  c.formaT = CAMBIO_DE_FORMA;
  return c.formaPedida ? 'entendido' : c.forma;
}

/**
 * 📣 EL PELIGRO DE SU LUGAR *(Santi eligió "al peligro")*: el guardia más cerca del círculo que él conoce —peleando,
 * sospechando, o a la vista de él o del círculo— en ese vagón o en los de al lado. Si no conoce a ninguno, la puerta
 * más cerca del círculo, del lado de afuera (por ahí pueden entrar). Devuelve `{ x, y, de }`.
 */
function peligroDelArea(c, world, centro, estado) {
  const vagon = estado.vagonDe ? estado.vagonDe(centro.x) : 0;
  const cerca = (q) => !estado.vagonDe || Math.abs(estado.vagonDe(q.x) - vagon) <= 1;
  const ve = (q) => hasLineOfSight(centro.x, centro.y, q.x, q.y, world.map.blocksSightAt) ||
    hasLineOfSight(c.x, c.y, q.x, q.y, world.map.blocksSightAt);
  let mejor = null, d0 = Infinity;
  for (const e of world.enemies) {
    if (!e.alive || e.inconsciente > 0 || e.rendido || e.manosArriba || !cerca(e)) continue;
    if (!(e.state === 'combat' || e.state === 'suspicious' || ve(e))) continue;
    const d = distance(centro.x, centro.y, e.x, e.y);
    if (d < d0) { d0 = d; mejor = e; }
  }
  if (mejor) return { x: mejor.x, y: mejor.y, de: mejor };
  let puerta = null;
  d0 = Infinity;
  for (const d of world.doors || []) {
    const dd = distance(centro.x, centro.y, d.x, d.y);
    if (dd < d0) { d0 = dd; puerta = d; }
  }
  if (!puerta) return { x: centro.x + 60, y: centro.y, de: null };
  const mitad = estado.mitadDelVagon ? estado.mitadDelVagon(centro.x) : centro.x;
  const lado = Math.sign(puerta.x - mitad) || 1;
  return { x: puerta.x + lado * 48, y: puerta.y, de: puerta };
}

/**
 * 📣 ¿CAMBIÓ EL PELIGRO? Cada `revisaLugar` mira de qué lado está; si es la primera vez o el peligro se corrió más de
 * `giroPeligro` (apareció un guardia por otro lado, o el que había caminó), busca otro reparo en el círculo y va.
 */
function revisarLugar(c, dt, world, o, estado) {
  o.revisaT = (o.revisaT || 0) - dt;
  if (o.puesto && o.revisaT > 0) return;
  o.revisaT = K.revisaLugar;
  const pel = peligroDelArea(c, world, o.centro, estado);
  const a = Math.atan2(pel.y - o.centro.y, pel.x - o.centro.x);
  o.peligro = pel;
  if (o.puesto && Math.abs(angleDifference(a, o.peligroA)) < K.giroPeligro) return;
  o.peligroA = a;
  const r = reparoEnArea(c, world, o.centro, pel, estado);
  const q = r || o.centro;
  if (!o.puesto || distance(q.x, q.y, o.x, o.y) > 4) { o.x = q.x; o.y = q.y; o.llego = false; }
  o.puesto = true;
  o.sinReparo = !r;
}

/**
 * 🛡️ EL MEJOR REPARO DEL CÍRCULO CONTRA EL PELIGRO (se mudó acá desde la escena: ahora lo vuelve a buscar él cuando
 * el peligro cambia). Puntos cada 4, que quepa su cuerpo entero, con la misma cuenta que tu [Shift]
 * (`findCoverSurface`): lo que tenga más cerca en cruz tiene que quedar del lado del peligro, y seguir valiendo corrido
 * 2 para cada lado (si no, elegía la puntita de un asiento). Del mismo vagón que el círculo. Gana el más cerca del
 * centro; la cobertura baja, un poco antes. Si en el círculo no hay ninguno, busca un poco más afuera *(Santi: "Buscar
 * más afuera")*: 24 y 48 más. Si tampoco, null (se queda en el medio).
 */
function reparoEnArea(c, world, centro, pel, estado) {
  const map = world.map, P = 4, reach = CONFIG.player.coverReach;
  const mov = world.solidoParaJugador || map.isSolidForMovementAt || map.isSolidAt;
  const vagon = estado.vagonDe ? estado.vagonDe(centro.x) : null;
  const cuerpo = (x, y, mas = 0) => ({ x, y, hw: c.hw + mas, hh: c.hh + mas });
  for (const R of [ORDENES.radio, ORDENES.radio + 24, ORDENES.radio + 48]) {
    let mejor = null, puntaje = Infinity;
    for (let py = Math.round((centro.y - R) / P) * P; py <= centro.y + R; py += P) {
      for (let px = Math.round((centro.x - R) / P) * P; px <= centro.x + R; px += P) {
        if (distance(px, py, centro.x, centro.y) > R || overlapsSolid(cuerpo(px, py, 1), mov)) continue;
        const s = findCoverSurface(px, py, c.hw, c.hh, map, reach);
        if (!s) continue;
        const a = Math.atan2(pel.y - s.y, pel.x - s.x);
        if (-s.nx * Math.cos(a) - s.ny * Math.sin(a) < 0.5) continue;
        if (overlapsSolid(cuerpo(s.x, s.y), mov)) continue;
        if (vagon != null && estado.vagonDe(s.x) !== vagon) continue;
        const vale = (qx, qy) => {
          const s2 = findCoverSurface(qx, qy, c.hw, c.hh, map, reach);
          return s2 && s2.nx === s.nx && s2.ny === s.ny;
        };
        if (!vale(s.x, s.y) || !vale(s.x + 2, s.y + 2) || !vale(s.x - 2, s.y - 2) ||
          !vale(s.x + 2, s.y - 2) || !vale(s.x - 2, s.y + 2)) continue;
        const half = s.nx !== 0 ? c.hw : c.hh;
        const bajo = map.cubreBajoAt && map.cubreBajoAt(s.x - s.nx * (half + 2), s.y - s.ny * (half + 2));
        const p = distance(s.x, s.y, centro.x, centro.y) - (bajo ? 8 : 0);
        if (p < puntaje) { puntaje = p; mejor = { x: s.x, y: s.y }; }
      }
    }
    if (mejor) return mejor;
  }
  return null;
}

/**
 * 🐛 EL CAMINO FINO, DE PUNTA A PUNTA: de él a `dest`, de a 4 unidades, con su cuerpo entero contra todo lo que frena
 * el paso (diagonales sin cortar esquinas). Una grilla que abarca a los dos con 24 de margen. Devuelve los puntos (sin
 * el de donde está), terminando en `dest` si ahí cabe; null si no hay camino o la grilla es demasiado grande.
 */
function caminoFino(c, mov, dest) {
  const P = 4, margen = 24;
  const x0 = c.x - Math.ceil((c.x - Math.min(c.x, dest.x) + margen) / P) * P;
  const y0 = c.y - Math.ceil((c.y - Math.min(c.y, dest.y) + margen) / P) * P;
  const ancho = Math.ceil((Math.max(c.x, dest.x) + margen - x0) / P) + 1;
  const alto = Math.ceil((Math.max(c.y, dest.y) + margen - y0) / P) + 1;
  if (ancho * alto > 12000) return null;
  const cuerpo = { x: 0, y: 0, hw: c.hw, hh: c.hh };
  const memo = new Int8Array(ancho * alto);   // 0 sin mirar, 1 cabe, 2 no
  const cabe = (i, j) => {
    if (i < 0 || j < 0 || i >= ancho || j >= alto) return false;
    const id = j * ancho + i;
    if (!memo[id]) { cuerpo.x = x0 + i * P; cuerpo.y = y0 + j * P; memo[id] = overlapsSolid(cuerpo, mov) ? 2 : 1; }
    return memo[id] === 1;
  };
  const si = Math.round((c.x - x0) / P), sj = Math.round((c.y - y0) / P);
  // La meta: la celda donde quepa más cerca del destino (hasta 12 de él).
  let mi = -1, mj = -1, md = Infinity;
  const ci = Math.round((dest.x - x0) / P), cj = Math.round((dest.y - y0) / P);
  for (let j = cj - 3; j <= cj + 3; j++) for (let i = ci - 3; i <= ci + 3; i++) {
    const d = Math.hypot(x0 + i * P - dest.x, y0 + j * P - dest.y);
    if (d < md && d <= 12 && cabe(i, j)) { md = d; mi = i; mj = j; }
  }
  if (mi < 0) return null;
  const alFinal = !overlapsSolid({ x: dest.x, y: dest.y, hw: c.hw, hh: c.hh }, mov);
  if (si === mi && sj === mj) return [alFinal ? { x: dest.x, y: dest.y } : { x: x0 + mi * P, y: y0 + mj * P }];
  // (🐛 Buscando hacia la meta primero —A*—: buscando para todos lados por igual revisaba el vagón entero y había
  // cuadros de 60 ms, tirones que se notan.)
  const N = ancho * alto, inicio = sj * ancho + si, meta = mj * ancho + mi;
  const previo = new Int32Array(N).fill(-2);
  const costo = new Float32Array(N).fill(Infinity);
  const h = (id) => {
    const dx = Math.abs(id % ancho - mi), dy = Math.abs(Math.floor(id / ancho) - mj);
    return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
  };
  // Un montículo chico (de menor a mayor por costo + h).
  const heap = [], prio = [];
  const meter = (id, f) => {
    let k = heap.length; heap.push(id); prio.push(f);
    while (k > 0) {
      const pa = (k - 1) >> 1;
      if (prio[pa] <= prio[k]) break;
      [heap[pa], heap[k]] = [heap[k], heap[pa]]; [prio[pa], prio[k]] = [prio[k], prio[pa]]; k = pa;
    }
  };
  const sacar = () => {
    const top = heap[0], ult = heap.pop(), up = prio.pop();
    if (heap.length) {
      heap[0] = ult; prio[0] = up;
      let k = 0;
      for (;;) {
        const a = 2 * k + 1, b = a + 1;
        let m = k;
        if (a < heap.length && prio[a] < prio[m]) m = a;
        if (b < heap.length && prio[b] < prio[m]) m = b;
        if (m === k) break;
        [heap[m], heap[k]] = [heap[k], heap[m]]; [prio[m], prio[k]] = [prio[k], prio[m]]; k = m;
      }
    }
    return top;
  };
  previo[inicio] = -1;
  costo[inicio] = 0;
  meter(inicio, h(inicio));
  let llego = false, vueltas = 0;
  while (heap.length && vueltas++ < 6000) {
    const id0 = sacar();
    if (id0 === meta) { llego = true; break; }
    const i = id0 % ancho, j = Math.floor(id0 / ancho);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const ni = i + di, nj = j + dj, id = nj * ancho + ni;
      if (ni < 0 || nj < 0 || ni >= ancho || nj >= alto || !cabe(ni, nj)) continue;
      if (di && dj && (!cabe(i + di, j) || !cabe(i, j + dj))) continue;
      const g = costo[id0] + (di && dj ? 1.414 : 1);
      if (g >= costo[id]) continue;
      costo[id] = g;
      previo[id] = id0;
      meter(id, g + h(id));
    }
  }
  if (!llego) return null;
  const puntos = [];
  for (let id = mj * ancho + mi; previo[id] !== -1; id = previo[id]) {
    puntos.push({ x: x0 + (id % ancho) * P, y: y0 + Math.floor(id / ancho) * P });
  }
  puntos.reverse();
  if (alFinal) puntos.push({ x: dest.x, y: dest.y });
  return puntos;
}

/**
 * ¿Puede ir derecho de donde está hasta q sin chocar? Las cuatro puntas de su cuerpo, cada 3 unidades.
 * (🐛 Preguntar "¿esto choca?" en el estilo nuevo es caro: con el cuerpo entero cada 2 eran 3.000 preguntas por cuadro y
 * cuadros de 17 ms, tirones.)
 */
function derecho(c, q, mov) {
  const d = distance(c.x, c.y, q.x, q.y);
  const n = Math.max(1, Math.ceil(d / 3));
  const hw = c.hw - 0.01, hh = c.hh - 0.01;
  for (let k = 1; k <= n; k++) {
    const x = c.x + (q.x - c.x) * k / n, y = c.y + (q.y - c.y) * k / n;
    if (mov(x - hw, y - hh) || mov(x + hw, y - hh) || mov(x - hw, y + hh) || mov(x + hw, y + hh)) return false;
  }
  return true;
}

/**
 * Hacia dónde camina este cuadro por el camino fino (lo guarda en `c.caminoF` y lo rehace cada 2 s, si el destino
 * se movió o si se trabó). El punto más lejos del camino (de los próximos 12) al que llega derecho. null si no hay
 * camino fino: entonces va con el de los guardias.
 */
function siguientePaso(c, dt, mov, dest) {
  const cf = c.caminoF || (c.caminoF = { dest: null, puntos: null, t: 0, trabado: 0, mirarT: 0, cortarT: 0, directo: false });
  cf.t -= dt; cf.mirarT -= dt; cf.cortarT -= dt;
  // (Si puede ir derecho, derecho: es lo más barato. Lo mira cada cuarto de segundo.)
  if (cf.mirarT <= 0) { cf.mirarT = 0.25; cf.directo = derecho(c, dest, mov); }
  if (cf.directo && cf.trabado < 0.4) { cf.puntos = null; return dest; }
  if (cf.directo) { cf.directo = false; cf.mirarT = 1; }   // derecho se trababa (un borde): un rato por el camino fino
  if (!cf.puntos || !cf.dest || distance(cf.dest.x, cf.dest.y, dest.x, dest.y) > 16 || cf.t <= 0 || cf.trabado > 0.4) {
    cf.dest = { x: dest.x, y: dest.y };
    cf.puntos = caminoFino(c, mov, dest);
    cf.t = 2; cf.trabado = 0; cf.cortarT = 0;
  }
  const pts = cf.puntos;
  if (!pts || !pts.length) return null;
  if (cf.cortarT <= 0) {
    cf.cortarT = 0.2;
    for (let k = Math.min(pts.length - 1, 8); k > 0; k--) {
      if (derecho(c, pts[k], mov)) { pts.splice(0, k); break; }
    }
  }
  while (pts.length > 1 && distance(c.x, c.y, pts[0].x, pts[0].y) < 1.5) pts.shift();
  return pts[0];
}

/**
 * 🔁 DE LO QUE HABÍA EN EL CÍRCULO, LO QUE SIGUE: saca de la lista lo que ya no cuenta (el guardia caído, rendido o
 * desmayado; el botín agarrado; el pasajero ya amenazado) y se queda con lo más cerca de él. Deja `o.blanco` (atacar)
 * o `o.botin` / `o.pasajero` (robar); vacíos si no queda nada.
 */
function elegirDelCirculo(c, o) {
  const cerca = (lista) => lista.reduce((m, q) => (!m || distance(c.x, c.y, q.x, q.y) < distance(c.x, c.y, m.x, m.y) ? q : m), null);
  if (o.tipo === 'atacar') {
    o.blancos = (o.blancos || []).filter((e) => e.alive && !(e.inconsciente > 0) && !e.rendido && !e.manosArriba);
    o.blanco = cerca(o.blancos);
  } else if (o.tipo === 'robar') {
    o.botines = (o.botines || []).filter((l) => !l.taken);
    o.pasajeros = (o.pasajeros || []).filter((pa) => sePuedeAmenazar(pa));
    const b = cerca(o.botines), pa = cerca(o.pasajeros);
    const bGana = b && (!pa || distance(c.x, c.y, b.x, b.y) <= distance(c.x, c.y, pa.x, pa.y));
    o.botin = bGana ? b : null;
    o.pasajero = bGana ? null : pa;
  }
}

/** ¿Esta orden queda dentro de la correa (un vagón de vos)? "Cubrí acá" puede ir a cualquier lado. */
export function ordenAlAlcance(orden, p, vagonDe) {
  if (orden.tipo === 'cubrir' || orden.tipo === 'seguir') return true;
  return Math.abs(vagonDe(orden.x) - vagonDe(p.x)) <= 1;
}

/**
 * El más cercano que ve y al que le llega el Colt: un guardia, o un jinete de la ley por la ventanilla *(Santi:
 * "aunque pueda dispararles a los jinetes no elige dispararles")*. Los rendidos y los desmayados no cuentan.
 */
function elegirBlanco(c, world, soloAlQueTira = false) {
  let mejor = null, d0 = K.alcance;
  const probar = (e) => {
    const d = distance(c.x, c.y, e.x, e.y);
    if (d > d0) return;
    if (!hasLineOfSight(c.x, c.y, e.x, e.y, world.map.blocksSightAt)) return;
    mejor = e; d0 = d;
  };
  for (const e of world.enemies) {
    if (!e.alive || e.inconsciente > 0 || e.rendido || e.manosArriba) continue;
    // (🎭 El pasivo sólo le tira al que les está tirando: un guardia en combate.)
    if (soloAlQueTira && e.state !== 'combat') continue;
    probar(e);
  }
  for (const rd of world.riders || []) if (rd.alive) probar(rd);
  /**
   * 🐛 SE QUEDA CON EL QUE YA TENÍA mientras lo vea, salvo que otro esté mucho más cerca: con dos a la misma distancia
   * (los dos jinetes, uno de cada lado) saltaba de uno al otro cada cuadro, y como cada cambio le vuelve a dar el
   * ratito para reaccionar, no tiraba nunca.
   */
  const viejo = c.blanco;
  if (viejo && viejo !== mejor && viejo.alive && !(viejo.inconsciente > 0) && !viejo.rendido) {
    const dv = distance(c.x, c.y, viejo.x, viejo.y);
    if (dv <= K.alcance && hasLineOfSight(c.x, c.y, viejo.x, viejo.y, world.map.blocksSightAt) && (!mejor || d0 > dv * 0.7)) return viejo;
  }
  return mejor;
}

/** ¿Un cajón de pólvora rodando hacia él, por su carril? (ver `cajonQueViene` en systems/ai.js: ruedan hacia la cola). */
function cajonQueViene(c, world) {
  for (const ro of world.rodantes || []) {
    if (ro.tipo !== 'polvora' || !ro.alive) continue;
    if (ro.x < c.x || ro.x - c.x > 130) continue;
    if (Math.abs(ro.y - c.y) > ro.hh + c.hh + 6) continue;
    return ro;
  }
  return null;
}

/** Una dinamita encendida que lo alcanza (ver `explosivoPeligroso` en systems/ai.js). */
function dinamitaCerca(c, world) {
  for (const ex of world.explosives || []) {
    if (!ex.alive || !ex.type) continue;
    if (distance(c.x, c.y, ex.x, ex.y) > ex.type.fleeRadius) continue;
    if (!hasLineOfSight(c.x, c.y, ex.x, ex.y, world.map.blocksBulletsAt || world.map.blocksSightAt)) continue;
    return ex;
  }
  return null;
}

/**
 * EL CUCHILLO, SÓLO CUANDO HACE FALTA: un guardia que todavía no está peleando, que ya está por descubrirlos (le
 * sube la sospecha), al alcance y de espaldas a él. Si no, mejor quieto: un muerto de más es un cuerpo que alguien
 * puede encontrar.
 */
function presaDelCuchillo(c, p, world, soloSiDescubre = true) {
  for (const e of world.enemies) {
    if (!e.alive || e.inconsciente > 0 || e.state === 'combat') continue;
    // (🎭 El agresivo no espera a que sospeche: cualquiera de espaldas al alcance.)
    if (soloSiDescubre && (e.suspicion || 0) < K.descubre) continue;
    if (distance(c.x, c.y, e.x, e.y) > K.cuchillo) continue;
    const haciaEl = Math.atan2(c.y - e.y, c.x - e.x);
    if (Math.abs(angleDifference(e.facing, haciaEl)) < K.espaldas) continue;
    return e;
  }
  return null;
}

/**
 * ¿A QUIÉN LE TIRA ESTE JINETE? Igual que los guardias: al que ve por la ventanilla, al más cercano si ve a los dos, y
 * si no ve a ninguno, al de antes. Con vos arriba del techo, a vos (arriba el juego es otro).
 */
export function blancoDelJinete(rd, player, c, world) {
  if (!c || !c.alive || player.enTecho || c.enTecho || (c.pasajero && (!c.descubierto || c.esposado || c.esposandolo))) return player;
  const ve = (q) => q.alive && hasLineOfSight(rd.x, rd.y, q.x, q.y, world.map.blocksSightAt);
  const vC = ve(c), vJ = ve(player);
  if (vC && (!vJ || distance(rd.x, rd.y, c.x, c.y) < distance(rd.x, rd.y, player.x, player.y))) { rd.blancoCompanero = true; return c; }
  if (vJ) { rd.blancoCompanero = false; return player; }
  return rd.blancoCompanero ? c : player;
}

/**
 * ¿A QUIÉN LE TIRA ESTE GUARDIA? Al que ve; si ve a los dos, al más cercano; si no ve a ninguno, al de antes. La
 * escena usa esto para cambiarle "el jugador" al guardia mientras piensa (ver `conBlanco` en scenes/raidScene.js).
 */
export function blancoDelGuardia(e, player, c, world, canSeeFrom) {
  // (🎭 El pasajero de la banda, mientras nadie lo vio acuchillar, es un pasajero más *(Santi: "que un guardia lo vea
  // yendo hacia otro guardia no pasa nada porque lo ve como un pasajero normal")*.)
  // (⛓️ Esposado, o con uno esposándolo, ya no le tiran.)
  if (!c || !c.alive || (c.pasajero && (!c.descubierto || c.esposado || c.esposandolo))) return player;
  const ve = (q) => q.alive && !q.enTecho &&
    canSeeFrom(e.x, e.y, e.facing, q, world.map, e.state !== 'combat', e.ai && e.ai.viewDistance, e.ai && e.ai.viewAngle);
  const vC = ve(c);
  if (vC) {
    const vJ = ve(player);
    if (!vJ || distance(e.x, e.y, c.x, c.y) < distance(e.x, e.y, player.x, player.y)) { e.blancoCompanero = true; return c; }
    e.blancoCompanero = false;
    return player;
  }
  if (ve(player)) { e.blancoCompanero = false; return player; }
  return e.blancoCompanero ? c : player;
}
