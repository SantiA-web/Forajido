/**
 * 🌵 EL CAMPO — LA PRUEBA CHICA (los números y los lugares, en data/campo.js; los textos, en text/campo.js)
 * *(Santi, 2026-11-24: "con tu caballo recorrés el lugar… como en la huida pero zoom, prácticamente ya está creada…
 * podés cazar, ir por caminos, ver granjas… y podés dar con el campamento de los Rennick pero te tomaría mucho tiempo si
 * no tenés pistas o rastros que seguir"; "vamos con la prueba chica")*.
 *
 * Lo que hay en la prueba:
 *  - **Cabalgar libre** con W/A/S/D, como en la huida: al trote por defecto, a galope con [SHIFT] mientras dure el
 *    aguante. Sin teclas, el caballo se queda quieto.
 *  - **El mundo es el mapa de rutas agrandado**: las vías, los pueblos, la mina y tu campamento donde están en el papel.
 *    [M] muestra el mapa con dónde estás.
 *  - **El tiempo pasa mientras cabalgás** (`segundosPorParte`): una parte del día cada tanto, con su historia.
 *  - **La granja de los Hale**: hablar con la gente; te dan la pista de los Rennick (una zona en el mapa).
 *  - **Las huellas** de la granja al sur, y **el campamento de los Rennick** escondido al final.
 *  - **La caza** (world/fauna.js, CAMPO.caza): liebres, berrendos, venados, coyotes, zorros y la tropilla de guanacos;
 *    con el clic se les tira, se carnean con [E] (lleva un rato) y la carne y los cueros van en el caballo.
 *  - **Entrar al pueblo** (Piedra Roja) y **volver al campamento** con [E].
 *
 * ⚠️ DIBUJO DE PRUEBA: el suelo, las piedras, el caballo y James son los de la huida; los lugares, la gente y los
 * animales son cuadrados y colores básicos *(Santi: "lo del dibujo lo hacemos con cuadrados y figuras y colores básicos
 * o cosas ya hechas")*.
 */
import { CONFIG } from '../data/config.js';
import { dibujarMira as dibujarMiraNueva } from '../entities/estiloNuevo/mira.js';
import { CAMPO } from '../data/campo.js';
import { REGION } from '../data/region.js';
import { TIEMPO } from '../data/tiempo.js';
import { COMIDA } from '../data/comida.js';
import { WEAPONS, DEFAULT_WEAPON } from '../data/weapons.js';
import { caballoActual, APROXIMACION as A, HORSES } from '../data/horse.js';
import { gameState } from '../state/gameState.js';
import { T } from '../text/es.js';
import { TC } from '../text/campo.js';
import { pasar, fechaDe, partesHasta } from '../systems/tiempo.js';
import { despensa } from '../systems/comida.js';
import { anotar, hay, subirFama } from '../systems/historia.js';
import { revisarHistoria } from '../data/momentos.js';
import { crearMenu, papel, TINTAS } from '../engine/menu.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';
import { DENSIDAD } from '../engine/renderer.js';
import { PALETA } from '../engine/paleta.js';
import { dibujarAnimal, dibujarJinete, dibujarSilla, GOLPES } from '../entities/caballo.js';
import { dibujarPersona, faseDeAndar } from '../entities/figura.js';
import { dibujarFogonazo } from '../entities/bullet.js';
import { crearPolvo } from '../world/polvoDeCascos.js';
import { dibujarSueloAbierto } from '../world/estiloNuevo/suelo.js';
import { dibujarObstaculoNuevo, piedraEn } from '../world/estiloNuevo/obstaculos.js';
import { ACHATA } from '../world/destinos.js';
import { armarVias, dibujarVias, crearPintor } from '../world/campoVias.js';
import { armarRelieve } from '../world/campoRelieve.js';
import { crearSenales } from '../world/senales.js';
import { crearFauna } from '../world/fauna.js';
import { crearCarretas } from '../world/carretas.js';
import { crearAsaltoCarreta } from '../world/asaltoCarreta.js';
import { columnaDe, columnaMontado } from '../world/cuerpos.js';
import { PLANO } from '../data/plano.js';
import { HUIDA } from '../data/huida.js';

const PROF = ACHATA;
/** Las patas que levantan polvo en cada zancada (las mismas que la huida). */
const PISADAS = [[GOLPES.traseraAlla, -8], [GOLPES.traseraAca, -6], [GOLPES.delanteraAca, 6]];
const TIPOS_OBSTACULO = ['roca', 'arbusto', 'cactus', 'monticulo'];
/** Cuánto se agranda cada pieza de los lugares (dibujadas chiquitas): a la medida del caballo y de James. */
const ESCALA_PIEZA = { casa: 2.8, carpa: 2.6, fuego: 2, persona: 1.5, caballo: 2, cerco: 2.4 };

/** Un número fijo por celda (sin azar: el mismo lugar tiene siempre las mismas piedras). */
function hash(a, b, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** La distancia de un punto a un segmento. */
function aSegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function createCampoScene(services) {
  const { renderer, input, scenes, hud, audio } = services;
  const colors = CONFIG.colors;
  const menu = crearMenu(audio);
  const polvo = crearPolvo(colors.polvo);

  // ── El mundo: el plano (data/plano.js) agrandado ──
  // 🔁 Desde el 2026-11-24 sale del plano y no del mapa de papel *(Santi: "que sí quede coherente… visto desde un
  // ingeniero")*: el papel es lo que se redibuja después desde el plano.
  const caballoBase = () => caballoActual(gameState);
  const M = { x: 6, y: 6, w: 372, h: 204 };
  /** Unidades del mundo por punto del papel. */
  const ESCALA = (CAMPO.minutosDeAncho * 60 * caballoBase().sprintSpeed) / M.w;
  const deX = (px) => (px - M.x) * ESCALA;
  const deY = (py) => (py - M.y) * ESCALA * PROF;
  const ANCHO = M.w * ESCALA, ALTO = M.h * ESCALA * PROF;

  const aMundo = (px, py) => [deX(px), (py - M.y) * ESCALA];
  // 🛤️ Las líneas del plano, a la medida del galope y con las esquinas en curva (world/campoVias.js).
  // 🔺 (Más las patas de los triángulos de vuelta, como vías aparte al final: las de PLANO.lineas no cambian de número.)
  const red = armarVias([...PLANO.lineas, ...PLANO.lineas.flatMap((l) => (l.triangulo || []).map((puntos, i) => (
    { id: l.id + '-vuelta' + i, puntos, radio: 500 })))], aMundo);
  // ⛰️ El relieve (world/campoRelieve.js): lo alto, lo hondo, el agua, las lomas y los caminos.
  const relieve = armarRelieve(PLANO, aMundo, CAMPO.relieve);
  relieve.cortarCon(red, 70);
  /** Donde termina una línea con mesa giratoria (San Cristóbal): el pozo con su puente que gira. */
  const MESAS = PLANO.lineas.filter((l) => l.vuelta === 'mesa').map((l) => { const p = l.puntos[l.puntos.length - 1]; return [deX(p[0]), deY(p[1])]; });
  /** Lo que no se mueve, pintado una vez por pedazo: el suelo del relieve, las vías y lo que va debajo. */
  const pintarFijo = crearPintor((c, x0, y0, lado) => {
    relieve.pintarSuelo(c, x0, y0, lado);
    for (const [mx, my] of MESAS) {
      c.fillStyle = '#6e655c'; c.beginPath(); c.ellipse(mx, my, 70, 70 * PROF, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#4a4038'; c.beginPath(); c.ellipse(mx, my + 3, 62, 62 * PROF, 0, 0, Math.PI * 2); c.fill();
    }
    dibujarVias(c, red, { x: x0, y: y0 }, lado, lado, (a, b) => relieve.debajoDeLaVia(c, a, b));
  }, (x0, y0, lado) => relieve.hayAlgo(x0, y0, lado) || red.tramosEn(x0 - 60, y0 - 60, x0 + lado + 60, y0 + lado + 60).length > 0
    || MESAS.some(([mx, my]) => mx > x0 - 80 && mx < x0 + lado + 80 && my > y0 - 80 && my < y0 + lado + 80));

  // 🏚️ Los lugares, del plano. Los nombres de los pueblos, del mapa de papel.
  const nombreDe = (id) => (REGION.lugares.find((l) => l.id === id) || {}).nombre || id;
  const TIPO_DE = { piedraroja: 'pueblo', pasodeloro: 'pueblo', fuertebravo: 'pueblo', alamoseco: 'pueblo', sancristobal: 'pueblo',
    laviuda: 'mina', puestoseco: 'puesto', campamento: 'campamento', granja: 'granja', rennick: 'rennick' };
  const LUGARES = PLANO.lugares.map((l) => {
    const tipo = TIPO_DE[l.id] || l.id, lugar = { id: tipo, x: deX(l.x), y: deY(l.y), nombre: nombreDe(l.id) };
    if (tipo === 'pueblo') lugar.puebloId = l.id;
    // El pueblo y el puesto crecen AL LADO de la estación, no encima de la vía: las casas, del lado de allá.
    if (tipo === 'pueblo' || tipo === 'puesto') {
      const v = red.masCerca(lugar.x, lugar.y, 900);
      if (v && v.d < 600) { lugar.dibujo = [v.x, v.y - 230 * PROF]; lugar.estacion = [v.x + 60, v.y - 34]; }
    }
    return lugar;
  });
  // Los tanques de agua, al lado de la vía.
  for (const l of PLANO.lineas) for (const [px, py] of l.tanques || []) LUGARES.push({ id: 'tanque', x: deX(px), y: deY(py) - 40 });
  /** Las bocas de los túneles: donde la vía se mete en la sierra. */
  for (const l of PLANO.lineas) for (const [a] of l.tuneles || []) relieve.agregarBoca(deX(a[0]), deY(a[1]));
  const lugar = (id) => LUGARES.find((l) => l.id === id);
  /** El pueblo que existe (townScene): el más cerca de tu campamento. */
  const pueblos = LUGARES.filter((l) => l.id === 'pueblo');
  const PUEBLO_DE_VERDAD = pueblos.slice().sort((a, b) => Math.hypot(a.x - lugar('campamento').x, a.y - lugar('campamento').y)
    - Math.hypot(b.x - lugar('campamento').x, b.y - lugar('campamento').y))[0].puebloId;

  /** Las huellas: un punto cada `cada` unidades, de la granja al campamento de los Rennick. */
  const huellas = [];
  {
    const P = CAMPO.huellas.puntos.map(([x, y]) => [deX(x), deY(y)]);
    for (let i = 0; i < P.length - 1; i++) {
      const [ax, ay] = P[i], [bx, by] = P[i + 1], largo = Math.hypot(bx - ax, by - ay);
      const rumbo = Math.atan2(by - ay, bx - ax);
      for (let d = 0; d < largo; d += CAMPO.huellas.cada) {
        const t = d / largo, n = huellas.length;
        huellas.push({ x: ax + (bx - ax) * t + (hash(n, 7) - 0.5) * 10, y: ay + (by - ay) * t + (hash(n, 9) - 0.5) * 6, rumbo });
      }
    }
  }

  let yo, estado, arma, tiempoParte, carteles, tiros, cerca, mapaAbierto, vista, casco;
  /** 🐎 Hace cuánto sonó tu último tiro (para las carretas que lo oyen). */
  let tiroReciente = 0;
  /** 🌇 La espera hasta la noche: { t, salto } mientras dura (el cielo tapa el desierto). */
  let espera = null;
  /** 🔪 Lo que estás carneando ({ presa, t, total }), y cuánto hace que no te movés (para el berrendo curioso). */
  let carneo = null, quieto = 0, quietoEn = null;
  /** 🚶 El caballo que dejaste al bajarte: { x, y, rumbo, pose, sobre, alto }, o null si vas montado. */
  let caballo = null;

  /** Lo que se guarda en la partida: dónde quedaste, el aguante, lo que encontraste. */
  function guardado() {
    if (!gameState.campo) gameState.campo = { x: null, y: null, rumbo: 0, aguante: 1, vistos: [], enPueblo: false };
    // 🦌 (Lo que lleva el caballo: la carne con su vencimiento, los cueros por animal y los cuernos de berrendo.)
    if (!gameState.campo.carga) gameState.campo.carga = { carne: [], cueros: {}, cuernos: 0 };
    return gameState.campo;
  }

  /** 🔍 La lupa: la del galope de cerca, o la de lejos (la mitad) según lo que estés haciendo. Ver `moverLupa`. */
  let lupaMeta = 1, lupaVista = 1, lupaPide = 1, lupaEspera = 0;
  function lupa() {
    return CAMPO.zoom * lupaVista;
  }
  /** Lo que pide la lupa ahora: 1 (normal) o `CAMPO.lupa.lejos`. */
  function lupaQuePide() {
    const L = CAMPO.lupa;
    // 🚶 A pie, siempre la de cerca: la gente no tiene dibujo chico.
    if (yo.aPie) return 1;
    // Apuntando (clic derecho), la de cerca: se prefiere puntería.
    if (input.mouse.right) return 1;
    // Cerca de un lugar tranquilo, la de cerca.
    for (const l of LUGARES) {
      if (!['pueblo', 'granja', 'campamento'].includes(l.id)) continue;
      const rad = (CAMPO.radios[l.id] || 200) * L.cercaDeLugar;
      if (Math.hypot(l.x - yo.x, (l.y - yo.y) / PROF) < rad) return 1;
    }
    // Arriba de lo alto o al galope, la de lejos.
    if (yo.sobre || yo.alto > 0) return L.lejos;
    if (yo.galope) return L.lejos;
    return 1;
  }
  function moverLupa(dt) {
    const L = CAMPO.lupa, pide = lupaQuePide();
    if (pide !== lupaPide) { lupaPide = pide; lupaEspera = 0; }
    lupaEspera += dt;
    const espera = input.mouse.right ? 0 : pide < 1 ? L.esperaLejos : L.esperaCerca;
    if (lupaEspera >= espera) lupaMeta = pide;
    const paso = (dt * (1 - L.lejos)) / L.pase;
    lupaVista = lupaVista < lupaMeta ? Math.min(lupaMeta, lupaVista + paso) : Math.max(lupaMeta, lupaVista - paso);
  }
  function medirVista() {
    const c = renderer.canvas, z = lupa();
    // 🔁 (Sin redondear: mientras la lupa pasa de un tamaño al otro, la vista crecía a saltos de una unidad y la cámara
    // —que se centra con la mitad— temblaba.)
    vista = { w: (c && c.width ? c.width : 1920) / z, h: (c && c.height ? c.height : 1080) / z };
  }

  function enter(params = {}) {
    hud.hide();
    medirVista();
    estado = guardado();
    arma = WEAPONS[gameState.weapon] || WEAPONS[DEFAULT_WEAPON];
    const desde = params.volviendo && estado.x != null
      ? { x: estado.x, y: estado.y }
      : { x: lugar('campamento').x + 60, y: lugar('campamento').y + 50 };
    if (!params.volviendo) estado.fuePueblo = false;
    estado.enPueblo = false;
    yo = { x: desde.x, y: desde.y, rumbo: estado.rumbo || 0, vel: 0, pose: 0, galope: false, reventado: false, fuego: 0, boca: null, choque: 0,
      sobre: null, alto: 0, escondido: false };
    // (Si quedaste arriba de algo al irte, volvés arriba.)
    const f = relieve.formaEn(yo.x, yo.y);
    if (f) { yo.sobre = f; yo.alto = f.alto; }
    tiempoParte = 0;
    espera = null;
    carteles = [];
    tiros = [];
    yo.balas = arma.magazine; yo.recargando = 0; yo.apuntado = 0; yo.retroceso = 0;
    // 🩸 Tu vida en el campo (CAMPO.carretas.guardias.james): la que te quedó la última vez; se cura en el campamento.
    yo.vida = estado.vida ?? CAMPO.carretas.guardias.james.vida; yo.invuln = 0; yo.perdigon = null; yo.caido = null;
    mapaAbierto = false;
    lupaMeta = lupaVista = lupaPide = 1; lupaEspera = 0;
    casco = 0;
    polvo.limpiar();
    carneo = null; quieto = 0; quietoEn = null; caballo = null;
    asalto.reiniciar();
    audio.ambiente('galope', { cutoff: 420, q: 0.6, type: 'lowpass', gain: CONFIG.ambiente.galopeVientoGain * 0.6,
      respira: { profundidad: CONFIG.ambiente.vientoProfundidad, cada: CONFIG.ambiente.vientoCada } });

    // Para mirar y probar desde la consola: FORAJIDO.services.campo
    services.campo = {
      get yo() { return yo; }, get animales() { return fauna.activos; }, get estado() { return estado; }, fauna, get carneo() { return carneo; },
      LUGARES, huellas, ANCHO, ALTO, ESCALA, deX, deY, red, relieve, M, senales, carretas, asalto,
      ir(id) { const l = lugar(id); if (l) { yo.x = l.x + 40; yo.y = l.y + 40; } },
      get cerca() { return queHayCerca(); }, get lupa() { return lupa(); }, get caballo() { return caballo; }, bajarOSubir: () => bajarOSubir(), obstaculosCerca, get tiros() { return tiros; }, mouse: () => mouseEnElMundo(),
      usar() { const c = queHayCerca(); if (c) usar(c); return c && c.tipo; },
      menu, get mapa() { return mapaAbierto; }, set mapa(v) { mapaAbierto = v; },
      tirarA(a) { a.vivo = false; a.vx = a.vy = 0; },
    };
  }

  function exit() {
    audio.quitarAmbiente('galope');
    { const lienzo = renderer && (renderer.canvas || renderer.ctx.canvas); if (lienzo) lienzo.style.cursor = ''; }
    asalto.terminar();
    if (yo && yo.caido) { estado.x = estado.y = null; estado.vida = CAMPO.carretas.guardias.james.vida; return; }
    if (yo) { const c = yo.aPie && caballo ? caballo : yo; estado.x = c.x; estado.y = c.y; estado.rumbo = c.rumbo; estado.vida = yo.vida; }
  }

  /** 🌵 Cuánto verde hay en (x, y): ver `verdor` (world/campoRelieve.js) y `CAMPO.suelo`. */
  const verdorDelSuelo = (x, y) => relieve.verdor(x, y, CAMPO.suelo);

  /** 📡 Las señales de lejos: el humo, los remolinos y los buitres (world/senales.js, CAMPO.senales). */
  const senales = crearSenales({ LUGARES, deX, deY, verdor: verdorDelSuelo, animales: () => fauna.paraBuitres(), PROF, S: CAMPO.senales });

  /** 🦌 Los animales (world/fauna.js, CAMPO.caza). Las velocidades, en galopes del Criollo. */
  const fauna = crearFauna({ relieve, deX, deY, PROF, C: CAMPO.caza, galope: HORSES.criollo.sprintSpeed, ANCHO, ALTO, partida: () => guardado() });
  /** 🛞 Las carretas de los caminos (world/carretas.js, CAMPO.carretas). */
  const carretas = crearCarretas({ relieve, PROF, C: CAMPO.carretas, galope: HORSES.criollo.sprintSpeed, segundosPorParte: CAMPO.segundosPorParte, partida: () => guardado() });
  /** 🔫 Asaltarlas (world/asaltoCarreta.js, CAMPO.carretas.asalto). */
  const asalto = crearAsaltoCarreta({ carretas, C: CAMPO.carretas, PROF, g: () => gameState, decir: (t, v) => decir(t, v), menu, TC, audio, subirFama,
    james: () => dondeEstaJames(), herirJames: (p, perdigon) => herirJames(p, perdigon), galope: HORSES.criollo.sprintSpeed,
    piedra: (x0, y0, x1, y1, b) => piedraEnElTiro(x0, y0, x1, y1, b),
    // (🪨 Las piedras de un rectángulo: el escopetero se cubre detrás de ellas.)
    rocas: (x0, y0, x1, y1) => obstaculosCerca(x0, y0, x1, y1).filter((ob) => ob.tipo === 'roca' && !ob.golpeado),
    // (Adónde escapa campo traviesa una diligencia: los pueblos.)
    pueblos: () => pueblos,
    // (Dónde puede estar el caballo de un guardia: sin piedra, mata ni carreta, y en el llano —no sube a las mesetas—.)
    libre: (x, y) => { if (chocaCon(x, y)) return false; const p = relieve.moverse(null, x, y, (a, b) => red.cerca(a, b, 70)); return p.ok && !p.sobre; } });

  /**
   * 🛞 Dónde puede estar una carreta (para el rodeo y para la que escapa campo traviesa): sin piedra ni mata, en el
   * llano (no sube a una meseta), y no encima tuyo ni de tu caballo.
   */
  carretas.terreno = (x, y) => {
    // (🔁 Dentro de la región: la que escapa, esquivando cerca del borde, podía salirse del mapa.)
    if (x < 0 || x > ANCHO || y < 0 || y > ALTO) return false;
    const M = carretas.POR_METRO, lejos = (o) => !o || Math.hypot(o.x - x, (o.y - y) / PROF) > CAMPO.carretas.huida.aTi * M;
    if (!lejos(yo) || !lejos(caballo)) return false;
    for (const ob of obstaculosCerca(x - 40, y - 40, x + 40, y + 40)) {
      const radio = A.obstaculoRadios[ob.tipo] ?? A.obstaculoRadio;
      const dx = (ob.x - x) / radio, dy = (ob.y - y) / (radio * 0.5 + 2);
      if (dx * dx + dy * dy < 1) return false;
    }
    const p = relieve.moverse(null, x, y, (a, b) => red.cerca(a, b, 70));
    return p.ok && !p.sobre;
  };

  /**
   * 🧍 Dónde está James para los guardias: el suelo, el pecho (adonde te apuntan) y la `columna` donde les pegan sus
   * balas (world/cuerpos.js; la misma medida que a ellos). Montado, desde la silla del último dibujo (`yo.asiento`).
   */
  function dondeEstaJames() {
    const G = CAMPO.carretas.guardias, K = G.james, M = carretas.POR_METRO, agachado = !!(yo.aPie && yo.agachado);
    const suelo = yo.y - yo.alto;
    if (!yo.aPie) {
      const sx = yo.x + (yo.asiento ? yo.asiento.dx : 0), sy = suelo + (yo.asiento ? yo.asiento.dy : -10.5);
      return { x: yo.x, y: suelo, pecho: sy - K.montado * M, agachado: false, aPie: false, columna: columnaMontado(sx, sy, G.columna, M) };
    }
    return { x: yo.x, y: suelo, pecho: suelo - (agachado ? K.agachado : K.pecho) * M, agachado, aPie: true,
      columna: columnaDe(yo.x, suelo, agachado ? 'agachado' : 'pie', G.columna, M) };
  }

  /**
   * 🩸 Te pegan (los escopeteros): como en el tren, `invulnerable` segundos sin que te vuelvan a pegar, salvo los
   * perdigones del mismo tiro. En 0, caes herido: te esposan ahí mismo y vas preso, como en el tren; lo que llevabas en
   * el caballo se pierde.
   */
  function herirJames(puntos, perdigon) {
    if (yo.caido) return;
    if (yo.invuln > 0 && !(perdigon && perdigon === yo.perdigon)) return;
    if (yo.invuln <= 0) yo.invuln = CAMPO.carretas.guardias.james.invulnerable;
    yo.perdigon = perdigon;
    yo.vida -= puntos;
    audio.play('playerHurt');
    if (yo.vida > 0) return;
    yo.vida = 0;
    yo.caido = { t: CAMPO.carretas.guardias.james.caido };
    // (A caballo, caes al suelo: el caballo queda ahí, ensillado.)
    if (!yo.aPie) { caballo = { x: yo.x, y: yo.y, rumbo: yo.rumbo, pose: yo.pose, sobre: yo.sobre, alto: yo.alto }; yo.aPie = true; yo.vel = 0; yo.y += CAMPO.aPie.bajaAdelante; yo.mira = Math.PI / 2; }
    decir(TC.carreta.caiste, 3);
  }

  // ── Las piedras y las matas: por celda, siempre las mismas ──
  // (Cada celda se arma una sola vez y se guarda: mirar si cae cerca de una vía o de un lugar cuesta.)
  const celdas = new Map();
  function obstaculosDeLaCelda(cx, cy) {
    const clave = cx + ',' + cy;
    if (celdas.has(clave)) return celdas.get(clave);
    const O = CAMPO.obstaculos, lista = [];
    const n = Math.floor(hash(cx, cy) * (O.max + 1));
    for (let i = 0; i < n; i++) {
      const x = (cx + hash(cx, cy, i * 2 + 1)) * O.celda, y = (cy + hash(cx, cy, i * 2 + 2)) * O.celda;
      if (LUGARES.some((l) => Math.hypot(l.x - x, (l.y - y) / PROF) < O.lejosDeLugares)) continue;
      if (red.cerca(x, y, O.lejosDeVias)) continue;
      if (relieve.cercaDeForma(x, y, O.lejosDeRelieve) || relieve.enAguaOCamino(x, y, 30)) continue;
      // 🌵 En la arena lisa, pocas (una piedra o un cactus solo se lee mejor); en lo tupido, todas.
      const P = CAMPO.suelo.piedras;
      if (hash(cx, cy, i + 70) > P + (1 - P) * Math.min(1, verdorDelSuelo(x, y))) continue;
      lista.push({ x, y, tipo: TIPOS_OBSTACULO[Math.floor(hash(cx, cy, i + 40) * TIPOS_OBSTACULO.length)], golpeado: false });
    }
    celdas.set(clave, lista);
    return lista;
  }
  function obstaculosCerca(x0, y0, x1, y1) {
    const O = CAMPO.obstaculos, lista = [];
    for (let cx = Math.floor(x0 / O.celda); cx <= Math.floor(x1 / O.celda); cx++) {
      for (let cy = Math.floor(y0 / O.celda); cy <= Math.floor(y1 / O.celda); cy++) lista.push(...obstaculosDeLaCelda(cx, cy));
    }
    return lista;
  }

  /**
   * 🪨 Dónde se queda en una piedra la bala que va de (x0, y0) a (x1, y1) en este cuadro: { x, y }, o null *(Santi,
   * 2026-11-26: "arreglá que las lonas y piedras paren las balas")*. Se mira sobre el dibujo de la roca, como la lona sobre
   * el de la carreta. `b`: la bala, con dónde salió (`sx`, `sy`), hasta dónde apuntaba (`largo`) y si salió de arriba
   * de un caballo o de un pescante (`alto`): ésa pasa por encima, salvo cerca de adonde iba (`CAMPO.balaEnPiedra`).
   * Vale igual para tus balas y las de los guardias *(memoria: lo que golpea vale igual para todos)*.
   */
  function piedraEnElTiro(x0, y0, x1, y1, b) {
    const rocas = obstaculosCerca(Math.min(x0, x1) - 14, Math.min(y0, y1) - 6, Math.max(x0, x1) + 14, Math.max(y0, y1) + 16)
      .filter((ob) => ob.tipo === 'roca' && !ob.golpeado);
    if (!rocas.length) return null;
    const pasos = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.5));
    for (let i = 1; i <= pasos; i++) {
      const x = x0 + ((x1 - x0) * i) / pasos, y = y0 + ((y1 - y0) * i) / pasos;
      if (b.alto && Math.hypot(x - b.sx, y - b.sy) < CAMPO.balaEnPiedra.altoPasa * b.largo) continue;
      for (const ob of rocas) if (piedraEn(ob, x, y)) return { x, y };
    }
    return null;
  }

  // (🌿 `aPie`: a pie, al arbusto te metés; ver arbustoEn.)
  function chocaCon(x, y, aPie = false) {
    // 🛞 (La carreta choca igual que una piedra: montado te frena el golpe; a pie, no pasás.)
    if (CAMPO.carretas.activa && carretas.choca(x, y + 7)) return { tipo: 'carreta' };
    for (const ob of obstaculosCerca(x - 40, y - 40, x + 40, y + 40)) {
      if (aPie && ob.tipo === 'arbusto') continue;
      const radio = A.obstaculoRadios[ob.tipo] ?? A.obstaculoRadio;
      const dx = (ob.x - x) / (radio + 7), dy = (ob.y - (y + 7)) / (radio * 0.5 + 2);
      if (dx * dx + dy * dy < 1) return ob;
    }
    return null;
  }

  // ── Mover ──
  function update(dt) {
    medirVista();
    polvo.actualizar(dt, 0);
    senales.actualizar(dt);
    for (const c of carteles) c.vida -= dt;
    carteles = carteles.filter((c) => c.vida > 0);

    if (espera) { esperar(dt); return; }
    if (menu.update(input)) return;
    if (mapaAbierto) {
      if (input.wasPressed('KeyM') || input.wasPressed('Escape')) mapaAbierto = false;
      return;
    }
    if (input.wasPressed('KeyM')) { mapaAbierto = true; audio.play('cover'); return; }

    if (!carneo && input.wasPressed('KeyF')) bajarOSubir();
    yo.invuln = Math.max(0, yo.invuln - dt);
    // 🩸 Caído: no te mueves; a los `caido` segundos, preso.
    if (yo.caido) {
      if ((yo.caido.t -= dt) <= 0 && !yo.caido.ido) {
        yo.caido.ido = true;
        const carga = estado.carga;
        carga.carne = []; carga.cueros = {}; carga.cuernos = 0; carga.comida = 0; carga.bultos = [];
        asalto.terminar();
        gameState.stats.captures += 1;
        scenes.goTo('prision');
      }
      return;
    }
    if (carneo) carnear(dt); else if (yo.aPie) moverAPie(dt); else moverme(dt);
    moverLupa(dt);
    moverAnimales(dt);
    moverCarretas(dt);
    apuntar(dt);
    disparar(dt);
    moverBalas(dt);
    pasarElTiempo(dt);
    mirarAlrededor();

    cerca = queHayCerca();
    if (cerca && input.wasPressed('KeyE')) usar(cerca);
    if (input.wasPressed('KeyN') && puedeEsperar()) { espera = { t: 0, salto: false, hacia: gameState.esDeDia ? 'noche' : 'dia' }; audio.play('cover'); }
  }

  /** 🌇 Si se puede esperar (hasta la noche, o hasta el día): cerca de un lugar (no el campamento) o de una carreta. */
  function puedeEsperar() {
    const E = CAMPO.esperar;
    if (!E.activa || carneo) return false;
    // (🔁 No en medio de un asalto ni con una carreta defendiéndose: el salto de horas la movía kilómetros, con el conductor
    // y los pasajeros parados en el desierto.)
    if (CAMPO.carretas.activa && (asalto.ahora || Object.keys(asalto.defensas).length)) return false;
    if (cerca && cerca.lugar && cerca.tipo !== 'campamento') return true;
    return CAMPO.carretas.activa && carretas.activas.some((c) => Math.hypot(c.x - yo.x, (c.y - yo.y) / PROF) < E.carretaA);
  }

  /** 🌇 La espera: el cielo tapa, a la mitad pasa el tiempo hasta la noche, y destapa. El mundo, quieto. */
  function esperar(dt) {
    const E = CAMPO.esperar;
    espera.t += dt;
    if (!espera.salto && espera.t >= E.tapa + E.cielo / 2) {
      espera.salto = true;
      const t = gameState.tiempo || { dia: 0, parte: 0 };
      // (de la mañana o la tarde, a la noche; de la noche o la madrugada, a la mañana)
      const hasta = espera.hacia === 'noche' ? 2 - t.parte : partesHasta(gameState, 0);
      if (hasta > 0) { pasar(gameState, hasta); revisarHistoria(gameState); }
      tiempoParte = 0;
      moverCarretas(0);
    }
    if (espera.t >= E.tapa + E.cielo + E.destapa) { decir(espera.hacia === 'noche' ? TC.esperar.yaNoche : TC.esperar.yaDia, 2.5); espera = null; }
  }

  /** 🦌 Los animales, con lo que necesitan saber de ti: dónde estás, si galopás y cuánto hace que estás quieto. */
  function moverAnimales(dt) {
    if (!CAMPO.caza.activa) return;
    if (!quietoEn || Math.hypot(yo.x - quietoEn.x, yo.y - quietoEn.y) > 0.5) { quieto = 0; quietoEn = { x: yo.x, y: yo.y }; } else quieto += dt;
    const t = gameState.tiempo || { dia: 0, parte: 0 };
    const SN = CAMPO.caza.sentidos;
    tapan = !yo.aPie ? [] : obstaculosCerca(yo.x - SN.tapan - 20, yo.y - SN.tapan - 20, yo.x + SN.tapan + 20, yo.y + SN.tapan + 20)
      .filter((ob) => (ob.tipo === 'roca' || ob.tipo === 'arbusto') && Math.hypot(ob.x - yo.x, (ob.y - yo.y - 7) / PROF) < SN.tapan);
    fauna.actualizar(dt, { yo, quieto, dia: t.dia, parte: TIEMPO.partes[t.parte], como: SN.como[comoVoy()], tapado: tapadoPara, noche: !gameState.esDeDia });
  }

  /** 🛞 Las carretas: donde dice la hora; se paran si estás delante (tú o tu caballo suelto). */
  function moverCarretas(dt) {
    if (!CAMPO.carretas.activa) return;
    const t = gameState.tiempo || { dia: 0, parte: 0 };
    tiroReciente = Math.max(0, tiroReciente - dt);
    const TR = CAMPO.carretas.susto, M = carretas.POR_METRO;
    // 🐎 Lo que la asusta: tu tiro cerca, o tú viniendo al galope hacia ella.
    const asusta = (c) => {
      const ex = c.x - yo.x, ey = (c.y - yo.y) / PROF, d = Math.hypot(ex, ey);
      if (tiroReciente > 0 && d < TR.oye * M) return true;
      return !yo.aPie && yo.galope && d < TR.ve * M && Math.cos(yo.rumbo) * ex + Math.sin(yo.rumbo) * ey > 0;
    };
    // (Las que escapan campo traviesa no frenan porque estés delante: te esquivan —ver `carretas.terreno`—.)
    carretas.actualizar(dt, { dia: t.dia, parte: t.parte, va: tiempoParte }, (c) => asalto.retiene(c) || (!c.suelta && (carretas.delante(c, yo.x, yo.y + 7) || !!(caballo && carretas.delante(c, caballo.x, caballo.y + 7)))), asusta);
    asalto.actualizar(dt, { yo, apuntando: input.mouse.right && !carneo, mira: mouseEnElMundo(), empuna: yo.empuna || 0 });
  }

  /** 👂👁️ Cómo vas, para los sentidos de los animales (ver CAMPO.caza.sentidos.como). */
  function comoVoy() {
    if (!yo.aPie) return yo.vel < 8 ? 'montadoQuieto' : yo.galope ? 'galope' : 'trote';
    if (yo.agachado) return yo.vel > 0 ? 'agachado' : 'agachadoQuieto';
    return yo.vel > 0 ? 'aPie' : 'aPieQuieto';
  }
  /**
   * 🌿 SI ESE ANIMAL NO TE PUEDE VER *(Santi: "estando entre los arbustos no te ven"; "las rocas también tapan")*: metido
   * en un arbusto, nadie; agachado, el que tiene una roca o un arbusto de los de al lado tuyo (`tapan`) en el medio.
   */
  let tapan = [];
  function tapadoPara(a) {
    if (!yo.aPie) return false;
    if (yo.arbusto) return true;
    if (!yo.agachado) return false;
    const px = yo.x, py = (yo.y + 7) / PROF, vx = a.x - px, vy = a.y / PROF - py, L2 = vx * vx + vy * vy;
    for (const ob of tapan) {
      const ox = ob.x - px, oy = ob.y / PROF - py, t = (ox * vx + oy * vy) / L2;
      if (t <= 0 || t >= 1) continue;
      const ex = ox - t * vx, ey = oy - t * vy, R = (A.obstaculoRadios[ob.tipo] ?? A.obstaculoRadio) + 3;
      if (ex * ex + ey * ey < R * R) return true;
    }
    return false;
  }
  /** 🌿 El arbusto en el que estás metido (a pie), o null. */
  function arbustoEn(x, y) {
    const radio = A.obstaculoRadios.arbusto;
    for (const ob of obstaculosCerca(x - 30, y - 30, x + 30, y + 30)) {
      if (ob.tipo !== 'arbusto') continue;
      const dx = (ob.x - x) / radio, dy = (ob.y - (y + 7)) / (radio * 0.5 + 2);
      if (dx * dx + dy * dy < 1) return ob;
    }
    return null;
  }

  /**
   * 🔪 CARNEAR lleva un rato: `carnear` segundos quieto, y mientras tanto el día corre más rápido (`rapidezCarnear`).
   * Si te movés, lo dejás. Al terminar, la carne y el cuero van al caballo, hasta lo que carga (`CAMPO.caza.carga`).
   */
  function empezarCarneo(presa) {
    carneo = { presa, t: 0, total: CAMPO.caza.animales[presa.tipo].carnear };
    yo.vel = 0; yo.galope = false; yo.empuna = 0; yo.trasTiro = 0;
    audio.play('cover');
  }
  function carnear(dt) {
    const mueve = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].some((k) => input.isDown(k));
    if (mueve || carneo.presa.comido) { carneo = null; decir(TC.carneoCortado, 2.5); return; }
    carneo.t += dt;
    tiempoParte += dt * (CAMPO.caza.rapidezCarnear - 1);
    if (carneo.t < carneo.total) return;
    const p = carneo.presa, A = CAMPO.caza.animales[p.tipo], K = CAMPO.caza.carga, carga = estado.carga;
    carneo = null;
    p.carneado = true;
    const n = A.carne[0] + Math.floor(Math.random() * (A.carne[1] - A.carne[0] + 1));
    const llevo = carga.carne.reduce((s, c) => s + c.n, 0), entra = Math.max(0, Math.min(n, K.carne - llevo));
    if (entra > 0) carga.carne.push({ n: entra, vence: (gameState.tiempo ? gameState.tiempo.dia : 0) + COMIDA.caza.desierto.dura });
    const cueros = Object.values(carga.cueros).reduce((s, k) => s + k, 0), cabe = cueros < K.cueros;
    if (cabe) carga.cueros[p.tipo] = (carga.cueros[p.tipo] || 0) + 1;
    // 🩸 El cuero agujereado vale menos: cada tiro que no fue a la cabeza le saca `tiros.cueroAgujero` (lo descuenta el almacén).
    const roto = Math.min(1, CAMPO.caza.tiros.cueroAgujero * (p.agujeros || 0));
    if (cabe && roto > 0) carga.menos = (carga.menos || 0) + A.cuero * roto;
    if (A.trofeo) carga.cuernos = (carga.cuernos || 0) + 1;
    decir(TC.carneaste({ animal: TC.animal[p.tipo], carne: entra, piel: cabe ? TC.piel(p.tipo) : null, cuernos: !!A.trofeo }), 3.5);
    if (n > entra) decir(TC.noCargaCarne(n - entra), 3.5);
    if (!cabe) decir(TC.noCargaCuero, 3.5);
    else if (roto > 0) decir(TC.cueroAgujereado(TC.piel(p.tipo), Math.round(roto * 100)), 3.5);
    audio.play('loot');
  }
  /** Al llegar al campamento, la carne baja a la despensa de la banda (la que se pudrió en el camino, no). */
  function descargar() {
    const carga = estado.carga, hoy = gameState.tiempo ? gameState.tiempo.dia : 0;
    const buena = carga.carne.filter((c) => c.vence >= hoy), n = buena.reduce((s, c) => s + c.n, 0);
    for (const c of buena) despensa(gameState).push({ n: c.n, vence: c.vence, carne: true });
    carga.carne = [];
    // 🔫 Lo de las carretas: la comida (seca, dura como la que se compra) a la despensa, y los bultos con lo demás que
    // se le vende al perista (gameState.owned.objetos).
    const comida = carga.comida || 0, bultos = (carga.bultos || []).length;
    if (comida) despensa(gameState).push({ n: comida, vence: hoy + COMIDA.duraProvision, carne: false });
    if (bultos) gameState.owned.objetos.push(...carga.bultos.map((o) => ({ ...o, dia: hoy })));
    carga.comida = 0; carga.bultos = [];
    if (comida || bultos) decir(TC.carreta.descargaste(bultos, comida), 3);
    return n;
  }

  function moverme(dt) {
    const K = CAMPO.caballo, cab = caballoBase();
    const dx = (input.isDown('KeyD') || input.isDown('ArrowRight') ? 1 : 0) - (input.isDown('KeyA') || input.isDown('ArrowLeft') ? 1 : 0);
    const dy = (input.isDown('KeyS') || input.isDown('ArrowDown') ? 1 : 0) - (input.isDown('KeyW') || input.isDown('ArrowUp') ? 1 : 0);
    const anda = dx !== 0 || dy !== 0;
    // El aguante: a galope se gasta, al trote o quieto se recupera.
    yo.galope = anda && !yo.reventado && (input.isDown('ShiftLeft') || input.isDown('ShiftRight'));
    // El suelo que pisás: las lomas, el arroyo, el vado frenan; el camino ayuda al trote.
    const RL = CAMPO.relieve, suelo = yo.sobre ? null : relieve.sueloEn(yo.x, yo.y);
    yo.escondido = !!(suelo && suelo.arroyo);
    let freno = 1;
    if (suelo) {
      if (suelo.lomas) freno *= RL.lento.lomas;
      if (suelo.arroyo) freno *= RL.lento.arroyo;
      if (suelo.vado) freno *= RL.lento.vado;
      if (suelo.camino && !yo.galope) freno *= RL.camino;
    }
    if (yo.galope) estado.aguante = Math.max(0, estado.aguante - (dt / K.galopeDura) * (suelo && suelo.lomas ? RL.galopeLomas : 1));
    else estado.aguante = Math.min(1, estado.aguante + dt / K.recupera);
    if (estado.aguante <= 0 && !yo.reventado) { yo.reventado = true; decir(TC.cansado); }
    if (yo.reventado && estado.aguante > 0.3) yo.reventado = false;

    if (anda) {
      const objetivo = Math.atan2(dy / PROF, dx);
      const dif = Math.atan2(Math.sin(objetivo - yo.rumbo), Math.cos(objetivo - yo.rumbo));
      const paso = K.giro * dt;
      yo.rumbo += Math.abs(dif) < paso ? dif : Math.sign(dif) * paso;
    }
    const fondo = freno * (!anda ? 0 : yo.reventado ? cab.sprintSpeed * K.paso : yo.galope ? cab.sprintSpeed : cab.sprintSpeed * K.trote);
    yo.vel += (fondo - yo.vel) * Math.min(1, dt * 4);
    if (yo.choque > 0) { yo.choque -= dt; yo.vel *= 0.3; }
    const nx = yo.x + Math.cos(yo.rumbo) * yo.vel * dt, ny = yo.y + Math.sin(yo.rumbo) * yo.vel * PROF * dt;
    pisar(nx, ny, dt);

    const crudo = Math.sin(yo.rumbo) * 4;
    if (Math.abs(crudo - yo.pose) > 0.8) yo.pose = Math.max(-4, Math.min(4, Math.round(crudo)));
    // El reloj de la zancada: más lento al trote. Cada zancada suena y levanta polvo, como en la huida.
    const antes = Math.floor(casco / CONFIG.ambiente.zancadaCada);
    casco += dt * (yo.vel / cab.sprintSpeed);
    if (yo.vel > 30 && Math.floor(casco / CONFIG.ambiente.zancadaCada) !== antes) {
      audio.play('zancada');
      polvo.sembrar({ x: yo.x, y: yo.y - yo.alto, suelo: 0, rumbo: yo.rumbo, fuerza: yo.galope ? 1 : 0.5, cuantas: yo.galope ? 5 : 3, pisadas: PISADAS });
    }
  }

  /**
   * 🚶 A PIE *(Santi: "las mecánicas del jugador dentro de este campo")*: James camina como en el tren (la misma
   * velocidad y los mismos dibujos, 8 direcciones y 8 cuadros) y con [ESPACIO] va agachado, más despacio. Los animales
   * te notan desde más cerca (`CAMPO.caza.sentidos`): así se puede acechar. El caballo descansa mientras tanto.
   * 🌿 Al arbusto te metés casi adentro, más despacio, y te tapa.
   */
  function moverAPie(dt) {
    const P = CAMPO.aPie;
    const dx = (input.isDown('KeyD') || input.isDown('ArrowRight') ? 1 : 0) - (input.isDown('KeyA') || input.isDown('ArrowLeft') ? 1 : 0);
    const dy = (input.isDown('KeyS') || input.isDown('ArrowDown') ? 1 : 0) - (input.isDown('KeyW') || input.isDown('ArrowUp') ? 1 : 0);
    yo.agachado = input.isDown('Space');
    yo.galope = false;
    estado.aguante = Math.min(1, estado.aguante + dt / CAMPO.caballo.recupera);
    if (yo.reventado && estado.aguante > 0.3) yo.reventado = false;
    const suelo = yo.sobre ? null : relieve.sueloEn(yo.x, yo.y);
    yo.escondido = !!(suelo && suelo.arroyo);
    if (!dx && !dy) { yo.vel = 0; pisar(yo.x, yo.y, dt); yo.arbusto = arbustoEn(yo.x, yo.y); return; }
    const largo = Math.hypot(dx, dy);
    yo.vel = (yo.agachado ? P.agachado : P.trota) * (yo.arbusto ? P.enArbusto : 1);
    yo.mira = Math.atan2(dy, dx);
    pisar(yo.x + (dx / largo) * yo.vel * dt, yo.y + (dy / largo) * yo.vel * PROF * dt, dt);
    yo.arbusto = arbustoEn(yo.x, yo.y);
  }

  /** Pisar un lugar nuevo (montado o a pie): lo alto, el agua, las cosas con que se choca y el borde de la región. */
  function pisar(nx, ny, dt) {
    // Lo alto no se cruza: se sube y se baja por las subidas; el agua, por los vados.
    const paso = relieve.moverse(yo.sobre, nx, ny, (x, y) => red.cerca(x, y, 70));
    if (!paso.ok) {
      yo.vel *= 0.2;
      decir(TC.noSePasa[paso.motivo] || TC.noSePasa.barranca, 1.6);
    } else if (!yo.aPie && yo.vel > 20 && !paso.sobre && chocaCon(nx, ny)) {
      yo.choque = 0.35;
      audio.play('hitWall');
    } else if (yo.aPie && !paso.sobre && chocaCon(nx, ny, true)) {
      yo.vel = 0;
    } else {
      if (paso.sobre !== yo.sobre) decir(paso.sobre ? TC.subiste(paso.sobre.nombre) : TC.bajaste, 1.8);
      yo.sobre = paso.sobre; yo.x = nx; yo.y = ny;
    }
    // La altura se sube y se baja de a poco (el sendero).
    const meta = yo.sobre ? yo.sobre.alto : 0, sube = (Math.max(meta, yo.alto) / CAMPO.relieve.subidaTarda) * dt;
    yo.alto = Math.abs(meta - yo.alto) <= sube ? meta : yo.alto + Math.sign(meta - yo.alto) * sube;
    // El borde de la región.
    // 🧱 (Al norte y al oeste no se llega: la sierra y el malpaís. Al este y al sur sí: el cartel dice qué hay más allá.)
    const lado = yo.x < 0 ? 'oeste' : yo.x > ANCHO ? 'este' : yo.y < 0 ? 'norte' : yo.y > ALTO ? 'sur' : null;
    yo.x = Math.max(0, Math.min(ANCHO, yo.x)); yo.y = Math.max(0, Math.min(ALTO, yo.y));
    if (lado && !carteles.some((c) => c.texto === TC.borde[lado])) decir(TC.borde[lado], 3);
  }

  /** 🚶 [F]: bajarte del caballo (frenado) o volver a subir (al lado de él). */
  function bajarOSubir() {
    const P = CAMPO.aPie;
    if (!yo.aPie) {
      if (yo.vel > P.bajarHasta) { decir(TC.frenaParaBajar, 1.6); return; }
      caballo = { x: yo.x, y: yo.y, rumbo: yo.rumbo, pose: yo.pose, sobre: yo.sobre, alto: yo.alto };
      // (Te bajás adelante del caballo, un poco más cerca de la cámara: así no te tapa.)
      yo.aPie = true; yo.vel = 0; yo.y += P.bajaAdelante; yo.mira = Math.PI / 2;
      audio.play('cover');
      return;
    }
    if (Math.hypot(caballo.x - yo.x, (caballo.y - yo.y) / PROF) > P.subir) { decir(TC.caballoLejos, 1.6); return; }
    Object.assign(yo, { x: caballo.x, y: caballo.y, rumbo: caballo.rumbo, pose: caballo.pose, sobre: caballo.sobre, alto: caballo.alto });
    yo.aPie = false; yo.agachado = false; yo.arbusto = null; yo.vel = 0; caballo = null;
    audio.play('cover');
  }

  /** El tiempo pasa mientras cabalgás (no en los menús ni con el mapa abierto). */
  function pasarElTiempo(dt) {
    // 🔁 Sólo el reloj de adentro (las carretas): la parte del día, y la luz, quedan las de la salida. Antes, cada
    // `segundosPorParte` pasaba una parte y la luz cambiaba de golpe *(Santi: "se ve muy directo y fuerte el
    // cambio")*. El tiempo pasa esperando hasta la noche ([N]) y al volver al campamento.
    tiempoParte += dt;
  }

  /** Lo que se ve de lejos: la granja (queda en el mapa) y el campamento de los Rennick. */
  function mirarAlrededor() {
    const g = lugar('granja');
    if (!estado.vistos.includes('granja') && Math.hypot(g.x - yo.x, (g.y - yo.y) / PROF) < 500) estado.vistos.push('granja');
    const r = lugar('rennick');
    if (!estado.vistos.includes('rennick') && Math.hypot(r.x - yo.x, (r.y - yo.y) / PROF) < CAMPO.rennick.seVeDesde) {
      estado.vistos.push('rennick');
      anotar(gameState, 'encontrasteRennick');
      decir(TC.rennick.encontraste, 3.5);
      audio.play('relincho');
    }
  }

  // ── Disparar (a los berrendos) ──
  function mouseEnElMundo() {
    const m = input.mouse;
    const px = m.px !== undefined ? m.px : m.x * DENSIDAD, py = m.py !== undefined ? m.py : m.y * DENSIDAD;
    return { x: camara().x + px / lupa(), y: camara().y + py / lupa() };
  }

  /**
   * 🆕 APUNTAR: con el clic derecho apretado, o un rato después de tirar, James saca el arma y apunta al mouse (el dibujo
   * del tren, ver lienzoJineteApunta). Si no, va con las dos manos en las riendas y el arma en la funda.
   */
  function apuntar(dt) {
    yo.trasTiro = Math.max(0, (yo.trasTiro || 0) - dt);
    yo.fogonazo = Math.max(0, (yo.fogonazo || 0) - dt);
    const quiere = !carneo && (input.mouse.right || yo.trasTiro > 0);
    yo.empuna = Math.max(0, Math.min(1, (yo.empuna || 0) + (quiere ? dt / CAMPO.apuntar.saca : -dt / CAMPO.apuntar.guarda)));
    // 🎯 La mira, como en el asalto: el clic derecho la cierra en `mira.tiempoCierre`, y cada tiro la abre (el retroceso).
    const M = CONFIG.mira, objetivo = input.mouse.right && !carneo ? 1 : 0, paso = dt / M.tiempoCierre;
    yo.apuntado = yo.apuntado < objetivo ? Math.min(1, yo.apuntado + paso) : Math.max(0, yo.apuntado - paso);
    yo.retroceso = Math.max(0, yo.retroceso - (arma.retroceso || 0) / M.retrocesoDecayTiempo * dt);
    // Recargar: [R], o solo al quedarte sin balas. El Winchester, de a una.
    if (yo.recargando > 0) { yo.recargando -= dt; if (yo.recargando <= 0) { yo.recargando = 0; yo.balas = arma.magazine; } }
    else if (input.wasPressed('KeyR') && yo.balas < arma.magazine) recargar();
  }
  function recargar() {
    yo.recargando = arma.reloadTime * (arma.recargaPorBala ? arma.magazine - yo.balas : 1);
    audio.play('cover');
  }

  /**
   * 🎯 CUÁNTO SE PUEDE IR LA BALA (en radianes), la misma cuenta del asalto (`dispersionActual`): la del arma suelta o
   * apuntada, más el retroceso. A caballo andando, por `dispersionACaballo` de la huida; montado y quieto, por
   * `tiros.montadoQuieto`; a pie, como en el asalto.
   */
  function dispersion() {
    const suelta = arma.spread, apuntada = arma.spreadApuntado ?? suelta;
    const base = suelta + (apuntada - suelta) * yo.apuntado + yo.retroceso;
    return base * (yo.aPie ? 1 : yo.vel > 8 ? HUIDA.jugador.dispersionACaballo : CAMPO.caza.tiros.montadoQuieto);
  }

  /**
   * 💥 EL TIRO, COMO EN LA HUIDA Y EL ASALTO *(Santi: "haz el apuntado del jugador como en la huida y el asalto")*: la
   * bala sale de la boca del caño hacia la mira, corrida por la dispersión, y viaja con la velocidad y el alcance del
   * arma. La escopeta, sus perdigones en abanico. La fuerza es la del arma en el asalto (`damage` × `factorBala`, o
   * `factorPerdigon` cada perdigón) y baja con la distancia igual que allá (`caida`).
   */
  function disparar(dt) {
    yo.fuego = Math.max(0, yo.fuego - dt);
    if (!input.mouse.down || yo.fuego > 0 || carneo || yo.recargando > 0) return;
    if (yo.balas <= 0) { recargar(); return; }
    yo.fuego = arma.fireRate || 0.4;
    yo.balas -= 1;
    tiroReciente = 0.2;   // (🐎 las carretas que lo oyen se ponen al trote)
    if (CAMPO.carretas.activa) asalto.oirTiro(yo.x, yo.y);   // (🔫 y los escopeteros que lo oyen se ponen en guardia)
    // (El tiro sale en el momento: el brazo se levanta de golpe y queda arriba un rato.)
    yo.empuna = 1; yo.trasTiro = CAMPO.apuntar.queda; yo.fogonazo = 0.08;
    audio.play(arma.perdigones ? 'escopetazo' : arma.id === 'winchester' ? 'rifleGuardia' : 'playerShot');
    const m = mouseEnElMundo(), C = CAMPO.caza, rng = services.rng;
    const [bx, by] = yo.boca || [yo.x, yo.y - 12];
    const hacia = Math.atan2(m.y - by, m.x - bx), medio = dispersion(), mira = CONFIG.mira;
    // (`meta`: adonde iba la mira, ya corrida por la dispersión: ahí pega si cae sobre el animal; ver fauna.impacto.)
    const lejos = Math.hypot(m.x - bx, m.y - by);
    const bala = (a, fuerza) => {
      const meta = [bx + Math.cos(a) * lejos, by + Math.sin(a) * lejos];
      tiros.push({ x: bx, y: by, vx: Math.cos(a) * arma.bulletSpeed, vy: Math.sin(a) * arma.bulletSpeed, recorrido: 0, fuerza, meta, aPie: !!yo.aPie, sx: bx, sy: by, largo: lejos, alto: !yo.aPie, conductor: CAMPO.carretas.activa ? asalto.apuntado(meta) : null });
    };
    if (arma.perdigones) {
      for (let i = 0; i < arma.perdigones; i++) bala(hacia + (i / (arma.perdigones - 1) - 0.5) * 2 * medio + rng.spread(medio / arma.perdigones), arma.damage * arma.factorPerdigon);
    } else bala(hacia + rng.spreadDeTiro(medio, mira.fallaChance, mira.fallaMultiplicador), arma.damage * (arma.factorBala ?? 1));
    yo.retroceso += arma.retroceso || 0;
    // El tiro (pegue o no) espanta todo lo que hay alrededor… un instante después: la bala llega antes que el susto.
    espantos.push({ t: C.tiros.reaccion, x: yo.x, y: yo.y });
  }

  /** 💥 Las balas en vuelo: avanzan, pegan en el primer animal que cruzan (ver fauna.impacto) o se pierden. */
  let espantos = [];
  function moverBalas(dt) {
    // (Las balas del juego van más lentas que las de verdad, para que se vean: el susto espera a que terminen su vuelo.)
    for (const e of espantos) if (!tiros.length && (e.t -= dt) <= 0) fauna.espantar(e.x, e.y, CAMPO.caza.espantaTiro);
    espantos = espantos.filter((e) => e.t > 0);
    const caida = arma.caida || { plenoHasta: 1, alFinal: 1 };
    for (const b of tiros) {
      const x0 = b.x, y0 = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt; b.antes = [x0, y0];
      b.recorrido += Math.hypot(b.x - x0, (b.y - y0) / PROF);
      if (b.recorrido > arma.range) { b.fin = true; continue; }
      // 🪨 (Una piedra en el medio: la bala llega hasta ahí y no sigue. Lo que esté antes de la piedra, sí le pega.)
      const pi = piedraEnElTiro(x0, y0, b.x, b.y, b), hx = pi ? pi.x : b.x, hy = pi ? pi.y : b.y;
      // 🔫 (El conductor de una carreta: la bala lo mata. La lona la para; la madera, sólo si tiraste a pie.)
      const enCarreta = CAMPO.carretas.activa && asalto.bala(x0, y0, hx, hy, b.conductor, b.aPie, b.fuerza);
      if (enCarreta) { b.fin = true; audio.play(enCarreta === 'tela' || enCarreta === 'madera' ? 'hitWall' : 'hitFlesh'); continue; }
      const golpe = fauna.impacto(x0, y0, hx, hy, b.meta);
      if (!golpe) { if (pi) { b.fin = true; audio.play('hitWall'); } continue; }
      b.fin = true;
      const lejos = b.recorrido / arma.range;
      const fuerza = b.fuerza * (lejos > caida.plenoHasta ? 1 + (caida.alFinal - 1) * (lejos - caida.plenoHasta) / Math.max(0.001, 1 - caida.plenoHasta) : 1);
      const murio = fauna.herir(golpe.a, fuerza, golpe.zona, golpe.x, golpe.y, [yo.x, yo.y]);
      audio.play('hitFlesh');
      if (!murio) decir(TC.heriste(TC.animal[golpe.a.tipo]), 2.5);
    }
    tiros = tiros.filter((b) => !b.fin);
  }

  // ── Usar con [E] ──
  function queHayCerca() {
    const al = CAMPO.alcance;
    const presa = fauna.presaCerca(yo.x, yo.y, al);
    // 🔪 Se carnea a pie *(paso 4: "hoy James carnea montado, y eso no tiene sentido")*: montado, te dice que te bajes.
    if (presa) return { tipo: 'presa', presa, montado: !yo.aPie };
    // 🔫 La carreta que frenaste (montado o a pie).
    const carreta = CAMPO.carretas.activa ? asalto.cerca(yo) : null;
    if (carreta) return { tipo: 'carreta', carreta };
    // 🚶 A pie no se entra a ningún lado: primero, el caballo.
    if (yo.aPie) return caballo && Math.hypot(caballo.x - yo.x, (caballo.y - yo.y) / PROF) <= CAMPO.aPie.subir ? { tipo: 'montar' } : null;
    let mejor = null, dMejor = Infinity;
    for (const l of LUGARES) {
      if (l.id === 'rennick' && !estado.vistos.includes('rennick')) continue;
      const d = Math.hypot(l.x - yo.x, (l.y - yo.y) / PROF);
      const radio = CAMPO.radios[l.id] || al * 2;
      if (d < radio && d < dMejor) { mejor = l; dMejor = d; }
    }
    return mejor ? { tipo: mejor.id, lugar: mejor } : null;
  }

  function usar(c) {
    if (c.tipo === 'montar') { bajarOSubir(); return; }
    if (c.tipo === 'carreta') { asalto.usar(c.carreta, estado.carga); return; }
    if (c.tipo === 'presa') {
      if (c.montado) { decir(TC.bajateParaCarnear, 2); return; }
      empezarCarneo(c.presa);
      return;
    }
    if (c.tipo === 'campamento') {
      const n = descargar();
      if (n) decir(TC.descargaste(n), 3);
      yo.vida = CAMPO.carretas.guardias.james.vida;   // (🩸 en el campamento te curan)
      audio.play('escape');
      scenes.goTo('camp', { desde: estado.fuePueblo ? 'pueblo' : 'campo' });
      return;
    }
    if (c.tipo === 'pueblo') {
      if (c.lugar.puebloId !== PUEBLO_DE_VERDAD) { decir(TC.noHayNada(c.lugar.nombre), 3); return; }
      estado.enPueblo = true;
      estado.fuePueblo = true;
      audio.play('escape');
      scenes.goTo('town');
      return;
    }
    if (c.tipo === 'mina') { decir(TC.mina, 3.5); return; }
    if (c.tipo === 'tanque') { estado.aguante = 1; yo.reventado = false; decir(TC.tanque, 3); audio.play('loot'); return; }
    if (c.tipo === 'puesto') { decir(TC.puesto, 3.5); return; }
    if (c.tipo === 'granja') { hablarEnLaGranja(); return; }
    if (c.tipo === 'rennick') {
      const R = TC.rennick;
      menu.abrir(R.titulo, [{ id: 'mirar', texto: R.opciones.mirar }, { id: 'irse', texto: R.opciones.irse }], (op) => {
        if (op === 'mirar') menu.abrir(R.titulo, [{ id: 'irse', texto: R.opciones.irse }], () => false, R.mirar);
        return op === 'mirar';
      }, R.cuerpo);
    }
  }

  function hablarEnLaGranja() {
    const G = TC.granja;
    const opciones = [{ id: 'rennick', texto: G.opciones.rennick }, { id: 'agua', texto: G.opciones.agua }, { id: 'irse', texto: G.opciones.irse }];
    menu.abrir(G.titulo, opciones, (op) => {
      if (op === 'rennick') {
        const ya = hay(gameState, 'pistaRennick');
        if (!ya) { anotar(gameState, 'pistaRennick'); decir(TC.pistaEnElMapa, 3.5); }
        menu.abrir(G.titulo, [{ id: 'irse', texto: G.opciones.irse }], () => false, ya ? G.rennickYa : G.rennick);
        return true;
      }
      if (op === 'agua') {
        estado.aguante = 1;
        yo.reventado = false;
        menu.abrir(G.titulo, [{ id: 'irse', texto: G.opciones.irse }], () => false, G.agua);
        return true;
      }
      return false;
    }, G.cuerpo);
  }

  function decir(texto, vida = 2.4) {
    carteles = carteles.filter((c) => c.texto !== texto);
    carteles.push({ texto, vida });
  }

  // ── Dibujar ──
  const PASO_CAM = () => (estiloNuevo.activo ? CONFIG.estilo.punto / lupa() : 1 / lupa());
  /**
   * 🔁 La cámara se pega a la grilla sólo con la lupa quieta, como en el galope (`pegarCamara` en rideScene)
   * *(Santi: "se ve raro la diferencia de zoom en la camara, ponelo igual que en el galope")*: durante el pase, pegada
   * a una grilla que cambia de tamaño cada cuadro, saltaba de a pedazos en vez de acercarse o alejarse parejo.
   */
  function camara() {
    const quieta = lupaVista === lupaMeta;
    const p = PASO_CAM(), aPunto = (v) => (quieta ? Math.round(v / p) * p : v);
    return { x: aPunto(yo.x - vista.w / 2), y: aPunto(yo.y - yo.alto - vista.h / 2) };
  }

  function render(r) {
    // 🔁 (`lupa` redondea a entero: en el pase el dibujo saltaba 4 → 3 → 2 mientras la cámara iba con decimales, y
    // quedaba una franja sin pintar y James corrido. En el pase, la lupa libre; quieta es entera igual.)
    r.lupaLibre(lupa());
    medirVista();
    const dia = gameState.esDeDia, noche = !dia;
    r.clear(dia ? colors.desiertoDia : colors.desiertoNoche);
    const cam = camara();
    camDibujo = cam;
    // (El punto del polvo y del humo en el aire: de lejos, el doble, como en el galope.)
    const celdaAire = (CONFIG.estilo.punto / 2) * (lupaVista >= 0.75 ? 1 : 2), conSenales = CAMPO.senales.activa;
    r.ctx.save();
    r.ctx.translate(-cam.x, -cam.y);
    // (🌵 Con los manchones del campo: zonas de matas y zonas de arena lisa, más verde cerca del agua.)
    if (estiloNuevo.activo) dibujarSueloAbierto(r.ctx, cam.x, cam.y, vista.w, vista.h, noche, false, verdorDelSuelo, CAMPO.suelo.sueltas, CAMPO.suelo.textura);

    // 🔁 (Ya no hay sombra negra afuera de la región: el terreno de los bordes sigue del otro lado —ver data/plano.js—
    // y donde se llega al borde lo marcan los mojones.)

    pintarFijo(r.ctx, cam, vista.w, vista.h);
    dibujarHuellas(r, noche);
    if (conSenales) senales.dibujarSuelo(r.ctx, cam, vista, dia, celdaAire / 2);
    polvo.dibujar(r, 0, noche);

    const cosas = [];
    const enVista = (x, y, m = 200) => x > cam.x - m && x < cam.x + vista.w + m && y > cam.y - m && y < cam.y + vista.h + m;
    for (const ob of obstaculosCerca(cam.x - 40, cam.y - 40, cam.x + vista.w + 40, cam.y + vista.h + 60)) {
      // (🌿 El arbusto en que estás metido va encima tuyo: te tapa.)
      cosas.push({ y: ob === yo.arbusto ? yo.y + 7.01 : ob.y, draw: () => dibujarObstaculoNuevo(r.ctx, ob, ob.x, noche, false, { chico: lupa() < 3 }) });
    }
    for (const l of LUGARES) {
      if (!enVista(l.x, l.y, 300)) continue;
      for (const pieza of piezasDe(l, noche)) cosas.push({ y: pieza.y, draw: () => pieza.draw(r) });
    }
    // (La cámara sin pegar a la grilla: los que se mueven se cuentan desde ella, para no dar saltitos a tu lado.)
    const camCruda = { x: yo.x - vista.w / 2, y: yo.y - yo.alto - vista.h / 2 };
    if (CAMPO.caza.activa) for (const a of fauna.visibles()) if (enVista(a.x, a.y)) cosas.push({ y: a.y, draw: () => fauna.dibujar(r, a, noche, camCruda, cam) });
    if (CAMPO.carretas.activa) cosas.push(...carretas.cosas(r, cam, vista, noche, camCruda, (rr, c, gx, gy, antes) => asalto.dibujarConductor(rr, c, gx, gy, noche, antes)));
    if (CAMPO.carretas.activa) cosas.push(...asalto.cosas(r, noche, enVista));
    for (const [mx, my] of mojonesEn(cam)) cosas.push({ y: my, draw: () => dibujarMojon(r, mx, my, noche) });
    // Lo alto: delante o detrás de James según de qué lado de su borde de abajo esté (en la columna de James).
    for (const f of relieve.formas) {
      const c = f.caja;
      if (c.x1 < cam.x || c.x0 > cam.x + vista.w || c.y1 < cam.y || c.y0 - f.alto > cam.y + vista.h) continue;
      const y = yo.x >= c.x0 && yo.x <= c.x1 ? relieve.bordeSur(f, yo.x) : c.y1;
      cosas.push({ y, draw: () => relieve.dibujarForma(r.ctx, f, cam, vista.w, vista.h) });
    }
    // (Arriba de algo, James va después de eso aunque su pie esté "detrás" de la barranca.)
    const miY = yo.sobre ? Math.max(yo.y + 7, relieve.bordeSur(yo.sobre, yo.x) + 1) : yo.y + 7;
    cosas.push({ y: miY, draw: () => dibujarme(r, noche) });
    if (yo.aPie && caballo) cosas.push({ y: caballo.y + 7, draw: () => dibujarCaballoSolo(r, noche) });
    if (conSenales) cosas.push(...senales.cosas(r.ctx, cam, vista, dia, celdaAire));
    if (CAMPO.caza.activa) fauna.dibujarSangre(r);
    cosas.sort((a, b) => a.y - b.y);
    for (const c of cosas) c.draw();
    if (estiloNuevo.activo) polvo.dibujarAire(r, 0, noche, celdaAire);
    // 🛞 (El polvo de las carretas: de día, que es cuando andan.)
    if (CAMPO.carretas.activa && dia) carretas.dibujarAire(r.ctx, cam, vista, celdaAire);
    if (conSenales) senales.dibujarAire(r.ctx, cam, vista, dia, TIEMPO.partes[gameState.tiempo.parte], celdaAire);
    // 💥 Las balas: una raya corta de donde estaban a donde están.
    for (const t of tiros) {
      const [x0, y0] = t.antes || [t.x - t.vx / 60, t.y - t.vy / 60];
      r.ctx.strokeStyle = '#f3e2a0'; r.ctx.lineWidth = 0.6;
      r.ctx.beginPath(); r.ctx.moveTo(x0, y0); r.ctx.lineTo(t.x, t.y); r.ctx.stroke();
    }
    if (CAMPO.carretas.activa) asalto.dibujarBalas(r);
    // 🎯 La mira: el punto relleno, el mismo que en el asalto (entities/estiloNuevo/mira.js); en rojo, recargando.
    // 🔁 (Antes un círculo que crecía con la distancia. Santi: "eso no debería haber estado desde un principio".)
    // El cursor de Windows, escondido mientras se ve la mira; con el menú o el mapa, vuelve.
    const conMira = !menu.activo() && !mapaAbierto && !carneo;
    const lienzo = r.canvas || r.ctx.canvas;
    if (lienzo) lienzo.style.cursor = conMira ? 'none' : '';
    // (Se toma acá, con el lienzo del mundo, y se dibuja al final, encima del velo de la noche: si no, la apagaba.)
    const miraEn = conMira ? { m: mouseEnElMundo(), T: r.ctx.getTransform() } : null;
    r.ctx.restore();

    // 🌙 (De noche, un velo encima del mundo, más claro alrededor de James: el suelo nuevo no tiene noche propia.)
    if (noche) {
      // (Parejo: la grilla del estilo nuevo pasa todo a la paleta, y un degradé quedaba en anillos.)
      r.ctx.fillStyle = 'rgba(10,12,34,0.5)';
      r.ctx.fillRect(0, 0, vista.w, vista.h);
      // (El brillo del fuego, encima del velo: es luz.)
      if (conSenales) { r.ctx.save(); r.ctx.translate(-cam.x, -cam.y); senales.dibujarNoche(r.ctx, cam, vista, celdaAire / 2); r.ctx.restore(); }
    }

    if (miraEn) {
      r.ctx.save(); r.ctx.setTransform(miraEn.T);
      dibujarMiraNueva(r, miraEn.m.x, miraEn.m.y, { apuntado: yo.apuntado, escopeta: !!arma.perdigones, bloqueada: yo.recargando > 0 });
      r.ctx.restore();
    }

    // El panel, con la lupa de siempre.
    r.lupa(DENSIDAD);
    const w = Math.floor(renderer.canvas.width / DENSIDAD), h = Math.floor(renderer.canvas.height / DENSIDAD);
    dibujarPanel(r, w, h, cam);
    if (mapaAbierto) dibujarMapa(r, w, h);
    if (espera) dibujarEspera(r, w, h);
    menu.render(r, colors, T.interior.dialogoAyuda);
  }

  /**
   * 🧱 LOS MOJONES: piedras blanqueadas cada tanto sobre el borde de la región, donde se puede llegar (no adentro de lo
   * alto, ni en el agua, ni encima de la vía). Dicen "hasta aquí" sin un cartel ni una pared invisible a secas.
   */
  function mojonesEn(cam) {
    const CADA = 220, out = [];
    const sirve = (x, y) => !relieve.formaEn(x, y) && !relieve.sueloEn(x, y).agua && !red.cerca(x, y, 60);
    if (cam.y + vista.h > ALTO - 40) {
      for (let x = Math.max(0, Math.floor(cam.x / CADA) * CADA); x <= Math.min(ANCHO, cam.x + vista.w + CADA); x += CADA) if (sirve(x, ALTO)) out.push([x, ALTO]);
    }
    if (cam.x + vista.w > ANCHO - 40) {
      const C = CADA * PROF;
      for (let y = Math.max(0, Math.floor(cam.y / C) * C); y <= Math.min(ALTO, cam.y + vista.h + C); y += C) if (sirve(ANCHO, y)) out.push([ANCHO, y]);
    }
    return out;
  }
  function dibujarMojon(r, x, y, noche) {
    r.ctx.fillStyle = 'rgba(40,24,12,0.35)'; r.ctx.beginPath(); r.ctx.ellipse(x + 2, y, 9, 3, 0, 0, Math.PI * 2); r.ctx.fill();
    r.rect(x - 5, y - 16, 10, 16, noche ? '#7e7464' : '#a89c86');
    r.rect(x + 2, y - 16, 3, 16, noche ? '#5e5648' : '#857a66');
    r.rect(x - 5, y - 20, 10, 5, noche ? '#a8a296' : '#ece4d2');
    r.rect(x - 3, y - 10, 5, 1, noche ? '#4a443a' : '#6e6454');
  }

  function dibujarHuellas(r, noche) {
    const H = CAMPO.huellas;
    for (const h of huellas) {
      const d = Math.hypot(h.x - yo.x, (h.y - yo.y) / PROF);
      if (d > H.seVenDesde) continue;
      r.ctx.globalAlpha = Math.min(1, 1.6 * (1 - d / H.seVenDesde));
      const c = '#3a2a1c', px = -Math.sin(h.rumbo) * 4, py = Math.cos(h.rumbo) * 4 * PROF;
      for (const [hx, hy] of [[h.x + px, h.y + py], [h.x - px + Math.cos(h.rumbo) * 7, h.y - py + Math.sin(h.rumbo) * 7 * PROF]]) {
        r.rect(hx - 1.5, hy - 1, 3, 2, c);
        r.rect(hx - 1.5, hy - 1.75, 3, 0.75, '#c8a878');
      }
    }
    r.ctx.globalAlpha = 1;
  }

  /**
   * 🏚️ UN LUGAR EN PIEZAS, cada una por dónde pisa (para que James pase por delante y por detrás). Cada pieza se dibuja
   * chiquita alrededor de su pie y se agranda con su `escala` (`ESCALA_PIEZA`), así queda a la medida del caballo; y
   * las distancias entre piezas se agrandan con `SEPARA`.
   */
  function piezasDe(l, noche) {
    const os = (c) => c;
    const [x, y] = l.dibujo || [l.x, l.y], SEPARA = 3, E = ESCALA_PIEZA;
    const en = (dx, dy) => [x + dx * SEPARA, y + dy * SEPARA];
    const pieza = ([px, py], s, fn) => ({ y: py, draw: (r) => {
      r.ctx.save(); r.ctx.translate(px, py); r.ctx.scale(s, s); fn(r); r.ctx.restore();
    } });
    // (📡 `chimenea`: las casas que humean la tienen; el humo sale de su punta, world/senales.js.)
    const casa = (p, w, alto, pared, techo, chimenea = false) => pieza(p, E.casa, (r) => {
      r.rect(-w / 2, -alto, w, alto, os(pared));
      if (chimenea) r.rect(w / 2 - 8, -alto - 11, 3, 6, os('#5a4a3c'));
      r.rect(-w / 2 - 1, -alto - 6, w + 2, 6, os(techo));
      r.rect(-2, -7, 4, 7, os('#2a1d14'));
      r.rect(-w / 2 + 3, -alto + 4, 3, 3, noche ? '#e8c060' : '#33281f');
    });
    const carpa = (p, color) => pieza(p, E.carpa, (r) => {
      for (let k = 0; k < 10; k++) r.rect(-10 + k, -k * 1.2 - 1, 20 - 2 * k, 1.2, os(color));
      r.rect(-1, -5, 2, 5, os('#2a1d14'));
    });
    const fuego = (p) => pieza(p, E.fuego, (r) => {
      r.rect(-4, -1, 8, 2, os('#4a3a2a'));
      const t = performance.now() / 120;
      r.rect(-2, -4 - Math.round(Math.sin(t)), 4, 3, '#e08a2a');
      r.rect(-1, -6 - Math.round(Math.cos(t * 1.3)), 2, 2, '#f3d060');
    });
    const persona = (p, ropa) => pieza(p, E.persona, (r) => {
      r.rect(-2, -10, 4, 7, os(ropa)); r.rect(-2, -3, 1, 3, os('#2b2420')); r.rect(1, -3, 1, 3, os('#2b2420'));
      r.rect(-1, -13, 3, 3, os('#c89870')); r.rect(-3, -14, 7, 1, os('#3b2d22')); r.rect(-1, -16, 3, 2, os('#3b2d22'));
    });
    const caballoQuieto = (p, pelaje) => pieza(p, E.caballo, (r) => {
      r.rect(-7, -9, 14, 5, os(pelaje)); r.rect(6, -13, 3, 6, os(pelaje)); r.rect(7, -14, 4, 3, os(pelaje));
      for (const lx of [-6, -3, 3, 5]) r.rect(lx, -4, 1, 4, os('#2b2018'));
    });
    const cerco = (p, w, alto) => pieza(p, E.cerco, (r) => {
      r.rect(0, -4, w, 1, os('#7a5a3a')); r.rect(0, -7, w, 1, os('#7a5a3a'));
      for (let k = 0; k <= w; k += 6) r.rect(k, -8, 1, 8, os('#5e4634'));
      r.rect(0, -alto - 4, 1, alto, os('#5e4634')); r.rect(w, -alto - 4, 1, alto, os('#5e4634'));
    });

    if (l.id === 'campamento') return [carpa(en(0, 0), '#cdbb92'), fuego(en(26, 8)), caballoQuieto(en(-30, 4), '#6b4a30')];
    if (l.id === 'granja') return [casa(en(0, 0), 36, 18, '#a88a62', '#6e4b33', true), cerco(en(22, 24), 40, 14),
      persona(en(12, 10), '#6a7a8a'), caballoQuieto(en(44, 20), '#8a6a4a')];
    if (l.id === 'rennick') {
      if (!estado.vistos.includes('rennick')) return [];
      return [carpa(en(-30, -10), '#9c8a6a'), carpa(en(8, -16), '#8a7a5a'), carpa(en(40, -6), '#a08c68'), fuego(en(8, 10)),
        persona(en(-4, 14), '#5a3a3a'), persona(en(18, 14), '#3a4a3a'),
        caballoQuieto(en(-60, 20), '#4a3020'), caballoQuieto(en(-44, 26), '#6b4a30'), caballoQuieto(en(64, 20), '#2e2218')];
    }
    if (l.id === 'mina') return [pieza(en(0, -10), E.casa, (r) => {
      r.rect(-40, -24, 80, 24, os('#6e5a48')); r.rect(20, -46, 5, 14, os('#3a3430')); r.rect(-30, -34, 60, 12, os('#7c6652'));
      r.rect(-8, -14, 16, 14, os('#1a130e')); r.rect(-10, -16, 20, 2, os('#5e4634'));
    }), casa(en(50, 6), 26, 14, '#8a7258', '#4e3a2a'), persona(en(20, 12), '#5a5048')];
    /** La estación: un galpón largo y bajo con su andén de tablas, pegado a la vía. */
    const estacion = (p, viejo) => pieza(p, E.casa, (r) => {
      r.rect(-26, 0, 52, 3, os(viejo ? '#7a6a58' : '#8a6a48'));
      r.rect(-18, -12, 36, 12, os(viejo ? '#8a7a66' : '#a8865e'));
      r.rect(-20, -16, 40, 4, os(viejo ? '#5a4a3c' : '#6e4b33'));
      r.rect(-4, -8, 5, 8, os('#2a1d14'));
      r.rect(8, -9, 4, 3, viejo ? '#2a1d14' : noche ? '#e8c060' : '#33281f');
    });
    /** El tanque de agua: una tina de madera sobre cuatro patas, con su caño. */
    const tanque = (p) => pieza(p, E.casa, (r) => {
      for (const lx of [-9, -4, 3, 8]) r.rect(lx, -16, 1.5, 16, os('#4e3a2a'));
      r.rect(-11, -30, 22, 14, os('#7a5a3a')); r.rect(-11, -26, 22, 1, os('#4e3a2a')); r.rect(-11, -20, 22, 1, os('#4e3a2a'));
      r.rect(-12, -32, 24, 3, os('#5e4634')); r.rect(10, -22, 6, 2, os('#3a3430')); r.rect(15, -22, 2, 6, os('#3a3430'));
    });
    if (l.id === 'tanque') return [tanque([x, y])];
    if (l.id === 'puesto') return [estacion(l.estacion || [x, y], true), casa(en(30, -10), 22, 12, '#8a7a66', '#5a4a3c', true)];
    if (l.id === 'pueblo') {
      const piezas = l.estacion ? [estacion(l.estacion, false)] : [];
      for (let k = 0; k < 6; k++) {
        piezas.push(casa(en((k % 3 - 1) * 42 + (k > 2 ? 18 : 0), k > 2 ? 34 : 0), 30, 16 + (k % 2) * 6, k % 2 ? '#9a7c58' : '#b09068', '#5e4430', k % 2 === 0));
      }
      piezas.push(persona(en(-10, 16), '#7a5a4a'), persona(en(30, 18), '#4a5a6a'));
      return piezas;
    }
    return [];
  }

  function oscurecer(c) {
    const n = parseInt(c.slice(1), 16), f = 0.55;
    const rr = Math.round(((n >> 16) & 255) * f), gg = Math.round(((n >> 8) & 255) * f), bb = Math.round((n & 255) * f * 1.15);
    return '#' + ((1 << 24) + (rr << 16) + (gg << 8) + Math.min(255, bb)).toString(16).slice(1);
  }

  /**
   * 🐛 DONDE SE DIBUJA JAMES: justo donde la cámara lo centra *(Santi: "al avanzar con el caballo de forma en diagonal
   * se traba")*. La cámara va de a un cuadradito de la grilla y James no: en pantalla quedaba medio cuadradito para un
   * lado o para el otro, y el caballo (que se pega a la grilla de la pantalla) saltaba al de al lado varias veces por
   * segundo. En diagonal, en los dos ejes a la vez. Ahora queda quieto en el medio y lo que se mueve es el suelo.
   */
  let camDibujo = null;
  function dondeMeDibujo() {
    if (!camDibujo) return { x: yo.x, y: yo.y };
    return { x: camDibujo.x + vista.w / 2, y: camDibujo.y + vista.h / 2 + yo.alto };
  }
  /** 🐎 El caballo que dejaste, quieto y ensillado, donde lo dejaste. */
  function dibujarCaballoSolo(r, noche) {
    const c = caballo, cab = caballoBase();
    r.ctx.save();
    r.ctx.translate(0, -c.alto);
    r.ctx.save();
    r.ctx.globalAlpha = 0.25; r.ctx.fillStyle = '#000';
    r.ctx.beginPath(); r.ctx.ellipse(c.x, c.y + 7, 12, 2.5, 0, 0, Math.PI * 2); r.ctx.fill();
    r.ctx.restore();
    if (Math.cos(c.rumbo) < 0) { r.ctx.translate(c.x * 2, 0); r.ctx.scale(-1, 1); }
    const montura = dibujarAnimal(r, c.x, c.y, null, 0, 1, c.pose, cab.id, noche);
    dibujarSilla(r, montura);
    r.ctx.restore();
  }

  /**
   * 🚶 JAMES A PIE: el dibujo del tren (ver jugadorNuevo en entities/figura.js). Sin apuntar mira para donde camina,
   * sin el arma en la mano; apuntando mira al mouse, con su arma.
   */
  function dibujarmeAPie(r, noche) {
    const { x: X, y: Y } = dondeMeDibujo();
    r.ctx.save();
    r.ctx.translate(0, -yo.alto);
    r.ctx.save();
    r.ctx.globalAlpha = 0.25; r.ctx.fillStyle = '#000';
    r.ctx.beginPath(); r.ctx.ellipse(X, Y + 7, 5, 1.5, 0, 0, Math.PI * 2); r.ctx.fill();
    r.ctx.restore();
    const m = mouseEnElMundo();
    const alMouse = Math.atan2(m.y + Math.round(yo.alto) - (yo.y - 10), m.x - yo.x);
    const apunta = yo.empuna > 0;
    // 🔪 Carneando: agachado y mirando al animal.
    const presa = carneo && carneo.presa;
    const angulo = presa ? Math.atan2(presa.y - yo.y, presa.x - yo.x) : apunta ? alMouse : yo.mira ?? Math.PI / 2;
    const enMano = !apunta ? null : arma.perdigones ? 'escopetaListo' : arma.id === 'winchester' ? 'winchesterListo' : { angulo, largo: 7, color: '#8a8074' };
    const fig = dibujarPersona(r, {
      tipo: 'jugador', mascara: false, x: X, pies: Y + 7, angulo, interior: true, luz: noche ? -1 : 0,
      fase: faseDeAndar(yo), postura: yo.agachado || presa || yo.caido ? 'agachado' : 'pie',   // (🩸 caído herido: agachado; no hay James tirado dibujado)
      arma: enMano, armaId: arma.id, empuna: yo.empuna, alza: yo.empuna,
    });
    yo.boca = fig && fig.boca ? [fig.boca.x, fig.boca.y - yo.alto] : null;
    yo.chico = false; yo.hacia = null;
    if (estiloNuevo.activo && yo.fogonazo > 0 && yo.boca) {
      dibujarFogonazo(r, yo.boca[0], yo.boca[1] + yo.alto, alMouse, yo.fogonazo > 0.04 ? 1 : 0.4, null, CONFIG.estilo.punto / 4);
    }
    r.ctx.restore();
  }

  function dibujarme(r, noche) {
    if (yo.aPie) { dibujarmeAPie(r, noche); return; }
    const cab = caballoBase();
    const { x: X, y: Y } = dondeMeDibujo();
    const quieto = yo.vel < 8;
    const T0 = CONFIG.ambiente.zancadaCada;
    const zancada = quieto ? null : { t: (casco % T0 + T0) % T0, T: T0 };
    const trote = zancada ? Math.round(Math.cos((zancada.t / T0 - 0.15) * Math.PI * 2) * 1.2) : 0;
    r.ctx.save();
    r.ctx.translate(0, -yo.alto);
    r.ctx.save();
    r.ctx.globalAlpha = 0.25; r.ctx.fillStyle = '#000';
    r.ctx.beginPath(); r.ctx.ellipse(X, Y + 7, 12, 2.5, 0, 0, Math.PI * 2); r.ctx.fill();
    r.ctx.restore();
    const m = mouseEnElMundo();
    const a = Math.atan2(m.y + Math.round(yo.alto) - (yo.y - 12), m.x - yo.x);
    const armaDir = Math.atan2(Math.sin(a) * PROF, Math.cos(a));
    const alOeste = Math.cos(yo.rumbo) < 0;
    r.ctx.save();
    if (alOeste) { r.ctx.translate(X * 2, 0); r.ctx.scale(-1, 1); }
    const montura = dibujarAnimal(r, X, Y, zancada, trote, 1, yo.pose, cab.id, noche);
    // 🆕 Apuntando: hacia dónde, en el dibujo (dado vuelta si el caballo va al oeste). Sin apuntar, las riendas.
    let enDibujo = Math.atan2(m.y + Math.round(yo.alto) - (yo.y - 16), m.x - yo.x);
    if (alOeste) enDibujo = Math.atan2(Math.sin(Math.PI - enDibujo), Math.cos(Math.PI - enDibujo));
    const larga = arma.id === 'winchester' || arma.id === 'escopeta' ? arma.id : null;
    const ropa = yo.empuna > 0 ? {
      arma: true, armaDir, armaLarga: larga, empuna: yo.empuna, ang: enDibujo,
      armaNueva: larga || (arma.id === 'smith' ? 'smith' : 'colt'),
      apuntaChico: ((Math.round(enDibujo / (Math.PI / 4)) % 8) + 8) % 8,
    } : {};
    const persona = dibujarJinete(r, montura.asiento.x, montura.asiento.y, yo.pose, 2, ropa, montura);
    // (Dónde quedó la silla, para que las balas de los guardias te peguen donde te ves. Dado vuelta, del otro lado.)
    yo.asiento = { dx: (alOeste ? -1 : 1) * (montura.asiento.x - X), dy: montura.asiento.y - Y };
    yo.chico = !!montura.chico;
    yo.hacia = persona && persona.boca && persona.boca.hacia || null;
    const b = persona && persona.boca;
    if (b && (Array.isArray(b) || b.x != null)) {
      const [bx, by] = Array.isArray(b) ? b : [b.x, b.y];
      yo.boca = [alOeste ? X * 2 - bx : bx, by - yo.alto];
    } else yo.boca = null;
    montura.adelante();
    r.ctx.restore();
    // 🆕 El fogonazo dibujado, el del tren (con el punto del jinete chico, de lejos).
    if (estiloNuevo.activo && yo.fogonazo > 0 && yo.boca) {
      const hacia = Math.atan2(m.y + Math.round(yo.alto) - yo.boca[1] - yo.alto, m.x - yo.boca[0]);
      dibujarFogonazo(r, yo.boca[0], yo.boca[1] + yo.alto, hacia, yo.fogonazo > 0.04 ? 1 : 0.4, yo.hacia, CONFIG.estilo.punto / (yo.chico ? 2 : 4));
    }
    r.ctx.restore();
  }

  function dibujarPanel(r, w, h, cam) {
    const { TINTA } = TINTAS;
    // La fecha y la parte del día, arriba.
    const t = gameState.tiempo || { dia: 0, parte: 0 }, f = fechaDe(t.dia);
    const fecha = `${T.tiempo.fecha(f.dia, T.tiempo.meses[f.mes])} · ${T.tiempo.partesMin[TIEMPO.partes[t.parte]]}`;
    r.rect(w / 2 - 70, 3, 140, 12, 'rgba(20,14,10,0.7)');
    r.text(fecha, w / 2, 12, '#e8d8b0', 'center', { tam: 8 });
    // El aguante del caballo.
    r.text(TC.aguante, 8, h - 22, '#e8d8b0', 'left', { tam: 7 });
    // 💥 Las balas que quedan en el arma (o recargando).
    r.text(yo.recargando > 0 ? TC.recargando : TC.balas(yo.balas, arma.magazine), 8, h - 40, '#e8d8b0', 'left', { tam: 7 });
    r.rect(8, h - 18, 60, 5, 'rgba(20,14,10,0.7)');
    r.rect(9, h - 17, Math.round(58 * estado.aguante), 3, yo.reventado ? '#b04030' : '#d8b060');
    r.text(yo.aPie ? TC.ayudaAPie : TC.ayuda, w - 6, h - 6, '#e8d8b0', 'right', { tam: 6 });
    if (yo.escondido) r.text(TC.escondido, 8, h - 30, '#c8d8a8', 'left', { tam: 7 });
    // 🩸 La vida, cuando no está entera.
    if (yo.vida < CAMPO.carretas.guardias.james.vida) r.text(TC.vida(yo.vida), 8, h - 50, yo.vida <= 25 ? '#e06040' : '#e8d8b0', 'left', { tam: 7 });
    // 🦌 Lo que lleva el caballo (si lleva algo).
    const carga = estado.carga, carne = carga.carne.reduce((s, c) => s + c.n, 0), cueros = Object.values(carga.cueros).reduce((s, k) => s + k, 0);
    const bultos = (carga.bultos || []).length;
    if (carne || cueros || carga.cuernos || bultos || carga.comida) r.text(TC.carga(carne, CAMPO.caza.carga.carne, cueros, CAMPO.caza.carga.cueros, carga.cuernos, bultos, carga.comida), 76, h - 22, '#e8d8b0', 'left', { tam: 6 });
    // 🔪 Carneando: la barrita sobre James.
    if (carneo) {
      const sx = Math.round(((yo.x - cam.x) * lupa()) / DENSIDAD), sy = Math.round(((yo.y - yo.alto - cam.y) * lupa()) / DENSIDAD) - 26;
      r.text(TC.carneando, sx, sy - 4, '#f3e2a0', 'center', { tam: 7 });
      r.rect(sx - 20, sy, 40, 4, 'rgba(20,14,10,0.75)');
      r.rect(sx - 19, sy + 1, Math.round(38 * Math.min(1, carneo.t / carneo.total)), 2, '#d8b060');
    }
    // 🔐 Forzando el cofre: la barrita sobre James, como al carnear.
    // (🔁 Y tomando la plata, la carga o lo de los pasajeros, que ahora lleva tiempo; y frenándola, mientras le apuntas al
    // conductor: antes no se sabía si la mira estaba bien puesta.)
    const que = CAMPO.carretas.activa ? asalto.forzandoQue : null;
    const frenando = CAMPO.carretas.activa ? asalto.frenando : null;
    const seVa = CAMPO.carretas.activa && !que && frenando == null ? asalto.seVa : null;
    const forzando = CAMPO.carretas.activa ? asalto.forzando ?? frenando ?? seVa : null;
    if (forzando != null) {
      // (Más arriba que la del carneo: abajo va el cartel de lo que se puede usar.)
      const sx = Math.round(((yo.x - cam.x) * lupa()) / DENSIDAD), sy = Math.round(((yo.y - yo.alto - cam.y) * lupa()) / DENSIDAD) - 40;
      const texto = que === 'cofre' ? TC.carreta.forzando : que ? TC.carreta.tomando[que] : frenando != null ? TC.carreta.frenando : TC.carreta.seVaBarra;
      r.text(texto, sx, sy - 4, '#f3e2a0', 'center', { tam: 7 });
      r.rect(sx - 20, sy, 40, 4, 'rgba(20,14,10,0.75)');
      r.rect(sx - 19, sy + 1, Math.round(38 * forzando), 2, '#d8b060');
    }
    // Lo que se puede usar, sobre la cabeza.
    if (cerca && !carneo && !yo.caido && !menu.activo() && !mapaAbierto) {   // (🩸 caído, nada que usar)
      const U = TC.usar;
      const txt = cerca.tipo === 'pueblo' ? (cerca.lugar.puebloId === PUEBLO_DE_VERDAD ? U.pueblo(cerca.lugar.nombre) : U.puebloLejos(cerca.lugar.nombre))
        : cerca.tipo === 'presa' ? (cerca.montado ? U.presaMontado(TC.animal[cerca.presa.tipo]) : U.presa(TC.animal[cerca.presa.tipo])) : U[cerca.tipo];
      const sx = ((yo.x - cam.x) * lupa()) / DENSIDAD, sy = ((yo.y - yo.alto - cam.y) * lupa()) / DENSIDAD - 22;
      r.text(txt, Math.round(sx), Math.round(sy), '#f3e2a0', 'center', { tam: 7 });
    }
    if (!espera && !menu.activo() && !mapaAbierto && puedeEsperar()) {
      const sx = ((yo.x - cam.x) * lupa()) / DENSIDAD, sy = ((yo.y - yo.alto - cam.y) * lupa()) / DENSIDAD - (cerca ? 32 : 22);
      r.text(gameState.esDeDia ? TC.esperar.noche : TC.esperar.dia, Math.round(sx), Math.round(sy), '#f3e2a0', 'center', { tam: 7 });
    }
    // Los carteles: abajo, en el medio.
    let cy = h - 40;
    for (const c of carteles.slice(-3).reverse()) {
      r.ctx.globalAlpha = Math.min(1, c.vida * 2);
      const lw = Math.min(w - 40, r.medir(c.texto, 7) + 12);
      r.rect(w / 2 - lw / 2, cy - 9, lw, 12, 'rgba(20,14,10,0.75)');
      r.text(c.texto, w / 2, cy, '#f3e2a0', 'center', { tam: 7 });
      cy -= 14;
    }
    r.ctx.globalAlpha = 1;
    void TINTA;
  }

  /**
   * 🌇 EL CIELO DE LA ESPERA. 🔁 Era de franjas de la paleta que cambiaban de a escalones, y el paso a la grilla de 48
   * colores lo hacía saltar *(Santi: "la animación para que se haga noche es muy tildada y trabada")*. Ahora se pinta en
   * la capa fina, la que va encima de la grilla: degradés que se mueven parejo, el sol que baja (o sube) con su brillo,
   * las estrellas que se prenden (o se apagan) titilando y el perfil de las mesetas.
   * Cada cielo: los colores de arriba abajo hasta el horizonte, el del sol y el de la tierra.
   */
  const CIELOS = {
    manana:     { cielo: ['#5a8ccf', '#7aa8d8', '#9cc4e0', '#c4dce6', '#e6eee4'], tierra: '#6a4a32', sol: '#fff6c8' },
    tarde:      { cielo: ['#4a78b0', '#6a98c8', '#8cb6d6', '#b4d2e0', '#dce8e4'], tierra: '#6a4a32', sol: '#fff0a0' },
    atardecer:  { cielo: ['#2e4466', '#5a5a86', '#9a6a86', '#e0884a', '#f4b45a'], tierra: '#4e3424', sol: '#f8a040' },
    crepusculo: { cielo: ['#121a38', '#2a2a52', '#5a3a62', '#a04a4a', '#d4784a'], tierra: '#2e1e1c', sol: '#e05a30' },
    noche:      { cielo: ['#060a1a', '#0a1026', '#111a36', '#1a2444', '#263252'], tierra: '#120c12', sol: '#e05a30' },
    alba:       { cielo: ['#1c2244', '#3a3a6a', '#7a5a86', '#d08a7a', '#f0c088'], tierra: '#3a2620', sol: '#ffd080' },
  };
  const ESTRELLAS = Array.from({ length: 70 }, (_, i) => [((i * 97) % 211) / 211, (((i * 61) % 89) / 89) * 0.62, 0.6 + (i % 4) * 0.25, i * 1.7]);
  const hexA = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const mezclar = (a, b, k) => { const A = hexA(a), B = hexA(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
  const suave = (k) => k * k * (3 - 2 * k);
  /** El cielo a u (0 a 1) del camino: entre los de la lista, parejo. */
  function cieloEn(lista, u) {
    const n = lista.length - 1, x = Math.max(0, Math.min(n, u * n)), i = Math.min(n - 1, Math.floor(x)), k = suave(x - i);
    const A = CIELOS[lista[i]], B = CIELOS[lista[i + 1]];
    return { cielo: A.cielo.map((c, j) => mezclar(c, B.cielo[j], k)), tierra: mezclar(A.tierra, B.tierra, k), sol: mezclar(A.sol, B.sol, k) };
  }
  function dibujarEspera(r, w, h) {
    const E = CAMPO.esperar, t = espera.t, aNoche = espera.hacia === 'noche';
    // (tapa y destapa parejo)
    const tapa = t < E.tapa ? t / E.tapa : t > E.tapa + E.cielo ? 1 - (t - E.tapa - E.cielo) / E.destapa : 1;
    const opaco = suave(Math.max(0, Math.min(1, tapa)));
    if (opaco <= 0) return;
    const u = Math.max(0, Math.min(1, (t - E.tapa) / E.cielo));
    const C = cieloEn(aNoche ? ['tarde', 'atardecer', 'crepusculo', 'noche'] : ['noche', 'alba', 'manana'], u);
    // En la capa fina: encima de la grilla de la paleta, y de las letras y el borde de la gente de antes.
    const f = estiloNuevo.activo ? estiloNuevo.lienzoFino(r.ctx) : r.ctx;
    const horizonte = h * 0.72;
    f.save();
    f.globalAlpha = opaco;
    const g = f.createLinearGradient(0, 0, 0, horizonte);
    C.cielo.forEach((c, j) => g.addColorStop(j / (C.cielo.length - 1), c));
    f.fillStyle = g;
    f.fillRect(0, 0, w, horizonte + 1);
    // las estrellas: se prenden al oscurecer (o se apagan al aclarar), titilando
    const brillo = aNoche ? Math.max(0, (u - 0.55) / 0.4) : Math.max(0, 1 - u / 0.4);
    if (brillo > 0) {
      for (const [ex, ey, tam, fase] of ESTRELLAS) {
        f.globalAlpha = opaco * Math.min(1, brillo) * (0.65 + 0.35 * Math.sin(t * 2.6 + fase));
        f.fillStyle = '#f4f0dc';
        f.fillRect(ex * w, ey * horizonte, tam, tam);
      }
      f.globalAlpha = opaco;
    }
    // el sol: baja a la derecha (o sube a la izquierda), con su brillo alrededor
    const altura = aNoche ? 1 - suave(Math.min(1, u / 0.72)) : suave(Math.max(0, (u - 0.3) / 0.7));
    const R = h * 0.055, sx = w * (aNoche ? 0.64 : 0.36), sy = horizonte + R * 1.2 - altura * (horizonte * 0.62 + R * 1.2);
    if (sy - R < horizonte) {
      const halo = f.createRadialGradient(sx, sy, R * 0.6, sx, sy, R * 4.5);
      halo.addColorStop(0, C.sol); halo.addColorStop(1, 'rgba(0,0,0,0)');
      f.globalAlpha = opaco * 0.35;
      f.fillStyle = halo; f.fillRect(0, 0, w, horizonte);
      f.globalAlpha = opaco;
      f.save();
      f.beginPath(); f.rect(0, 0, w, horizonte); f.clip();
      f.fillStyle = C.sol; f.beginPath(); f.arc(sx, sy, R, 0, Math.PI * 2); f.fill();
      f.restore();
    }
    // la tierra: el desierto lejos, con el perfil de las mesetas (con sus faldas)
    f.fillStyle = C.tierra;
    f.beginPath();
    f.moveTo(0, h); f.lineTo(0, horizonte);
    for (const [x0, ancho, alto] of [[0.05, 0.17, 0.07], [0.31, 0.08, 0.04], [0.68, 0.24, 0.09], [0.9, 0.06, 0.05]]) {
      const a = x0 * w, b = (x0 + ancho) * w, y = horizonte - alto * h;
      f.lineTo(a - 0.035 * w, horizonte); f.lineTo(a, y + alto * h * 0.12); f.lineTo(a + 0.01 * w, y);
      f.lineTo(b - 0.01 * w, y); f.lineTo(b, y + alto * h * 0.15); f.lineTo(b + 0.045 * w, horizonte);
    }
    f.lineTo(w, horizonte); f.lineTo(w, h); f.closePath(); f.fill();
    f.restore();
    // la fecha y la parte, arriba: se ve pasar a la noche (o a la mañana)
    if (opaco > 0.95) {
      const tt = gameState.tiempo || { dia: 0, parte: 0 }, fe = fechaDe(tt.dia);
      r.text(`${T.tiempo.fecha(fe.dia, T.tiempo.meses[fe.mes])} · ${T.tiempo.partesMin[TIEMPO.partes[tt.parte]]}`, Math.round(w / 2), 14, '#f3e2a0', 'center', { tam: 8 });
    }
  }

  /** 🗺️ El mapa: el papel de la región, con lo que sabés y dónde estás. */
  function dibujarMapa(r, w, h) {
    const { TINTA, TINTA_SUAVE, SELLO } = TINTAS;
    r.ctx.globalAlpha = 0.5; r.rect(0, 0, w, h, '#000'); r.ctx.globalAlpha = 1;
    const esc = Math.min((w - 40) / M.w, (h - 50) / M.h);
    const ox = Math.round((w - M.w * esc) / 2), oy = Math.round((h - M.h * esc) / 2) + 4;
    papel(r, ox - 10, oy - 18, Math.round(M.w * esc) + 20, Math.round(M.h * esc) + 30);
    r.text(TC.mapa.titulo, ox, oy - 6, SELLO, 'left', { tam: 9, halo: false });
    // (Lo que el plano pone del otro lado del marco —los bordes—, pegado al marco.)
    const P = (x, y) => [ox + (Math.max(M.x, Math.min(M.x + M.w, x)) - M.x) * esc, oy + (Math.max(M.y, Math.min(M.y + M.h, y)) - M.y) * esc];
    const trazo = (puntos, color, cada = 1) => {
      for (let i = 0; i < puntos.length - 1; i++) {
        const [ax, ay] = P(...puntos[i]), [bx, by] = P(...puntos[i + 1]), n = Math.ceil(Math.hypot(bx - ax, by - ay));
        for (let k = 0; k <= n; k += cada) r.rect(Math.round(ax + (bx - ax) * k / n), Math.round(ay + (by - ay) * k / n), 1, 1, color);
      }
    };
    // 🔁 Desde el plano (data/plano.js): lo alto en contorno, el agua, los caminos punteados, las líneas.
    for (const t of PLANO.relieve) {
      if (t.tipo === 'rio') trazo(t.puntos, '#4f7fa8');
      else if (t.tipo === 'arroyo') trazo(t.puntos, '#7fa3c0', 2);
      else if (t.tipo !== 'lomas') trazo([...t.puntos, t.puntos[0]], TINTA_SUAVE, 2);
    }
    for (const c of PLANO.caminos) trazo(c.puntos, '#9a7a52', 3);
    for (const l of PLANO.lineas) trazo(l.puntos, l.servicio === false ? TINTA_SUAVE : TINTA);
    for (const l of PLANO.lugares) {
      if (!['pueblo', 'mina', 'puesto'].includes(TIPO_DE[l.id])) continue;
      const [x, y] = P(l.x, l.y);
      r.rect(Math.round(x) - 2, Math.round(y) - 2, 4, 4, TINTA);
      r.text(nombreDe(l.id), Math.round(x), Math.round(y) - 4, TINTA, 'center', { tam: 6, halo: false });
    }
    const marca = (px, py, texto, color, arriba = false) => {
      const [x, y] = P(px, py);
      r.rect(Math.round(x) - 2, Math.round(y) - 2, 4, 4, color);
      r.text(texto, Math.round(x), Math.round(y) + (arriba ? -4 : 9), color, 'center', { tam: 6, halo: false });
    };
    const enPlano = (id) => PLANO.lugares.find((l) => l.id === id);
    marca(enPlano('campamento').x, enPlano('campamento').y, TC.mapa.campamento, SELLO);
    if (estado.vistos.includes('granja')) marca(enPlano('granja').x, enPlano('granja').y, TC.mapa.granja, TINTA, true);
    if (hay(gameState, 'pistaRennick') && !estado.vistos.includes('rennick')) {
      const Pi = CAMPO.pistaRennick, [cx, cy] = P(Pi.x, Pi.y), rad = Pi.radio * esc;
      for (let k = 0; k < 48; k++) {
        const a = (k / 48) * Math.PI * 2;
        r.rect(Math.round(cx + Math.cos(a) * rad), Math.round(cy + Math.sin(a) * rad), 1, 1, SELLO);
      }
      r.text(TC.mapa.pista, Math.round(cx), Math.round(cy), SELLO, 'center', { tam: 6, halo: false });
    }
    if (estado.vistos.includes('rennick')) marca(enPlano('rennick').x, enPlano('rennick').y, TC.mapa.rennick, SELLO);
    // Tú: un punto que titila.
    const tx = yo.x / ESCALA + M.x, ty = yo.y / (ESCALA * PROF) + M.y, [x, y] = P(tx, ty);
    if (Math.floor(performance.now() / 300) % 2) r.rect(Math.round(x) - 2, Math.round(y) - 2, 5, 5, '#b02020');
    r.text(TC.ayudaMapa, ox + Math.round(M.w * esc), oy + Math.round(M.h * esc) + 8, TINTA_SUAVE, 'right', { tam: 6, halo: false });
  }

  return { enter, exit, update, render };
}
