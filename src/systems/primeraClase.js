/**
 * 🆕 P4 · LA VIDA EN PRIMERA CLASE *(Santi: "deberían hacer otras cosas como caminar hasta la barra, pedir
 * algo, el bartender servir, que hablen entre ellos. No deberían ser estáticos")*.
 *
 * Mientras nada pasa en el vagón, cada tanto (`CONFIG.primeraClase.cada`) un rico se levanta de su sillón,
 * nunca más de `dePie` a la vez, y hace una de dos cosas:
 *  - VA A LA BARRA: se para delante del mostrador; el bartender se acerca por detrás de la barra, le sirve
 *    y él toma ahí un rato; después vuelve a su sillón con la copa.
 *  - VISITA A OTRO RICO: se para del lado del pasillo del sillón del otro, mirándolo, y charlan un rato.
 *
 * EL GUARDAESPALDAS TOMA POSICIONES *(Santi: "el rico camina por un vagón, no por todo un tren")*: no sabe
 * adónde va su rico hasta que llega, así que lo sigue de lejos, sin pegarse (a `distancia`), y recién un
 * momento después de que el rico llegó (`demora`) va a su puesto:
 *  - el rico sentado: detrás del respaldo de su sillón, mirando al pasillo;
 *  - el rico en la barra: en el marco de la puerta del vagón o en el de la puertita de la barra, según de
 *    qué lado de la barra se paró, mirando al pasillo;
 *  - el rico de visita: del otro lado de la mesita del sillón que visita, mirando al pasillo (el
 *    guardaespaldas del que está sentado sigue detrás de su sillón).
 *
 * Todo esto es sólo mientras está tranquilo: si un rico deja de estar tranquilo (te vio, lo encañonás) o
 * su guardaespaldas sale de la ronda, nada de acá los toca — siguen las reglas de siempre
 * (entities/passenger.js, systems/ai.js).
 */
import { CONFIG } from '../data/config.js';
import { WAGONS } from '../data/wagons.js';
import { findPath } from '../engine/pathfind.js';
import { moveAndCollide, distance } from '../engine/collision.js';

const ARRIBA = -Math.PI / 2, ABAJO = Math.PI / 2, DERECHA = 0;
/** Los lugares delante de la barra (columna, fila del vagón) y dónde se para el guardaespaldas para cada uno. */
const BARRA = [
  { c: 2, r: 4, guardia: { c: 1, r: 5, mira: DERECHA } },   // del lado de la puerta del vagón: en su marco
  { c: 3, r: 4, guardia: { c: 1, r: 5, mira: DERECHA } },
  { c: 4, r: 4, guardia: { c: 6, r: 2, mira: ABAJO } },     // del lado de la puertita: en su marco
];
/** Detrás de la barra, por dónde camina el bartender (fila y de qué columna a qué columna). */
const DETRAS = { r: 2, c0: 1, c1: 4 };
/** Delante del estante de las botellas (contra la pared del fondo), donde se para a ordenarlo. */
const ESTANTE = { r: 1, c0: 1, c1: 4 };

const azar = (a, b) => a + Math.random() * (b - a);

/** El estado de cada vagón de primera clase (se arma la primera vez). */
function vagonDe(world, w) {
  const v = world.train && world.train.wagons && world.train.wagons[w];
  if (!v || v.id !== 'primeraClase') return null;
  if (v._pc) return v._pc;
  const S = world.map.size, c0 = Math.round(v.x / S);
  const p = WAGONS.primeraClase;
  const en = (c, r) => ({ x: (c0 + c) * S + S / 2, y: r * S + S / 2 });
  const ricos = world.passengers.filter((pa) => pa.wagon === w && pa.apoyaPies);
  for (const pa of ricos) {
    pa.casa = { x: pa.x, y: pa.y, c: Math.round(pa.x / S - 0.5) - c0, r: Math.floor(pa.y / S) };
    if (pa.escolta) pa.escolta.puestoCasa = { ...pa.escolta.puesto, mira: pa.escolta.facingPuesto };
  }
  v._pc = {
    en, c0, layout: p.layout, ricos,
    bartender: world.passengers.find((pa) => pa.wagon === w && pa.bartender) || null,
    siguiente: azar(...CONFIG.primeraClase.primero),
  };
  return v._pc;
}

/** ¿Está tranquilo? (vivo, despierto, sin nadie encima). */
const tranquilo = (pa) => pa && pa.alive && pa.state === 'idle' && !pa.dormido && !(pa.robProgress > 0) && !pa.revelando;
const enRonda = (e) => e && e.alive && e.state === 'patrol';

export function actualizarPrimeraClase(world, dt) {
  if (!world.train || !world.train.wagons) return;
  world.train.wagons.forEach((v, w) => {
    if (v.id !== 'primeraClase') return;
    const V = vagonDe(world, w);
    if (!V) return;
    // Con el jugador lejos, los guardias se congelan (CONFIG.raid.cullPatrolDistance, ver updateEnemies en
    // scenes/raidScene.js): los ricos también, o se irían caminando sin su guardaespaldas.
    const cull = CONFIG.raid.cullPatrolDistance, p = world.player;
    if (p && V.ricos.some((pa) => pa.escolta && pa.escolta.alive && Math.abs(pa.escolta.x - p.x) > cull)) return;
    actualizarVagon(world, V, dt);
  });
}

function actualizarVagon(world, V, dt) {
  const C = CONFIG.primeraClase;
  // Si alguien del vagón dejó de estar tranquilo, nadie empieza nada nuevo.
  const calma = V.ricos.every((pa) => !pa.alive || tranquilo(pa)) && V.ricos.every((pa) => !pa.escolta || enRonda(pa.escolta));
  if (calma) {
    V.siguiente -= dt;
    if (V.siguiente <= 0) {
      V.siguiente = azar(...C.cada);
      empezarAlgo(world, V);
    }
  }
  for (const pa of V.ricos) {
    const R = pa.rutina;
    if (R && !tranquilo(pa)) {   // se asustó: lo de siempre
      if (R.anfitrion && R.anfitrion.visitado === pa) R.anfitrion.visitado = null;
      pa.rutina = null;
      continue;
    }
    if (R) actualizarRico(world, V, pa, R, dt);
    actualizarEscolta(world, V, pa, dt);
  }
  if (V.bartender) actualizarBartender(world, V, V.bartender, dt);
}

/** Elige a un rico sentado y qué va a hacer. */
function empezarAlgo(world, V) {
  const C = CONFIG.primeraClase;
  const dePie = V.ricos.filter((pa) => pa.rutina).length;
  if (dePie >= C.dePie) return;
  const sentados = V.ricos.filter((pa) => tranquilo(pa) && !pa.rutina && pa.sentado && !pa.visitado);
  if (!sentados.length) return;
  const pa = sentados[Math.floor(Math.random() * sentados.length)];
  const libres = BARRA.filter((L) => !V.ricos.some((o) => o.rutina && o.rutina.barra === L));
  const anfitriones = sentados.filter((o) => o !== pa);
  const quiere = Math.random() < C.barra ? 'barra' : 'visita';
  // (🆕 Sin bartender tranquilo, nadie va a la barra: sólo se visitan *(Santi)*.)
  const hayBartender = V.bartender && tranquilo(V.bartender);
  if ((quiere === 'barra' || !anfitriones.length) && hayBartender && libres.length && !V.ricos.some((o) => o.rutina && o.rutina.barra)) {
    const L = libres[Math.floor(Math.random() * libres.length)];
    // (Pegado al mostrador, no en el medio de la casilla: quedaba a medio paso de la barra.)
    const P = V.en(L.c, L.r);
    salir(world, V, pa, { modo: 'yendo', destino: 'barra', barra: L, punto: { x: P.x, y: P.y - world.map.size / 2 + CONFIG.primeraClase.pegadoBarra }, mira: ARRIBA });
  } else if (anfitriones.length) {
    const h = anfitriones[Math.floor(Math.random() * anfitriones.length)];
    const arriba = h.casa.r < 5;
    const r = arriba ? h.casa.r + 1 : h.casa.r - 1;
    h.visitado = pa;
    // (Pegado al sillón del otro, del lado del pasillo: en el medio de la casilla parecía que no estaba con él.)
    const P = V.en(h.casa.c, r), S = world.map.size, pegado = CONFIG.primeraClase.pegadoVisita;
    const punto = { x: P.x, y: arriba ? P.y - S / 2 + pegado : P.y + S / 2 - pegado };
    salir(world, V, pa, { modo: 'yendo', destino: 'visita', anfitrion: h, punto, mira: arriba ? ARRIBA : ABAJO });
  }
}

/** Se levanta del sillón y empieza a caminar. */
function salir(world, V, pa, R) {
  pa.sentado = false;
  pa._p3 = null;
  pa.rutina = R;
  rutaHacia(world, pa, R.punto);
}

function rutaHacia(world, pa, punto) {
  const map = world.map, S = map.size;
  const desde = { col: Math.floor(pa.x / S), row: Math.floor(pa.y / S) };
  const ruta = findPath(map, desde, { col: Math.floor(punto.x / S), row: Math.floor(punto.y / S) }) || [punto];
  /**
   * 🐛 EL PRIMER GIRO: el buscador de caminos sólo guarda dónde se dobla, y si dobla en la primera casilla
   * (al levantarse del sillón: un paso al pasillo y después de costado) ese giro no queda. El rico iba en
   * diagonal derecho al segundo punto, frotándose contra el sillón, y tardaba diez segundos en salir. Se
   * agrega la esquina libre entre donde está y el primer punto.
   */
  const P = ruta[0];
  if (P) {
    const pc = Math.floor(P.x / S), pr = Math.floor(P.y / S);
    if (pc !== desde.col && pr !== desde.row) {
      const esquina = !map.isSolidTile(desde.col, pr) ? [desde.col, pr] : [pc, desde.row];
      ruta.unshift(map.tileCenter(esquina[0], esquina[1]));
    }
  }
  // Y al final, el lugar exacto (el buscador termina en el medio de la casilla).
  const U = ruta[ruta.length - 1];
  if (!U || U.x !== punto.x || U.y !== punto.y) ruta.push({ x: punto.x, y: punto.y });
  pa.ruta = ruta;
  pa.rutaI = 0;
}

/** Camina por la ruta; devuelve true al llegar. */
function caminar(world, pa, dt) {
  const vel = CONFIG.primeraClase.velocidad;
  while (pa.ruta && pa.rutaI < pa.ruta.length && distance(pa.x, pa.y, pa.ruta[pa.rutaI].x, pa.ruta[pa.rutaI].y) < 1.5) pa.rutaI++;
  if (!pa.ruta || pa.rutaI >= pa.ruta.length) return true;
  const P = pa.ruta[pa.rutaI];
  const dx = P.x - pa.x, dy = P.y - pa.y, d = Math.hypot(dx, dy);
  const paso = Math.min(d, vel * dt);
  const solido = world.map.isSolidForMovementAt || world.map.isSolidAt;
  moveAndCollide(pa, (dx / d) * paso, (dy / d) * paso, solido);
  pa.facing = Math.atan2(dy, dx);
  return false;
}

function actualizarRico(world, V, pa, R, dt) {
  const C = CONFIG.primeraClase;
  if (R.modo === 'yendo') {
    if (caminar(world, pa, dt)) {
      pa.facing = R.mira;
      R.modo = R.destino === 'barra' ? 'pidiendo' : 'charlando';
      R.llego = 0;
      R.hasta = R.destino === 'barra' ? Infinity : azar(...C.visita);
      if (R.destino === 'barra') V.pedido = pa;
    }
    return;
  }
  if (R.modo === 'pidiendo' || R.modo === 'tomando' || R.modo === 'charlando') {
    R.llego += dt;
    pa.facing = R.mira;
    /**
     * 🆕 NADIE LO ATIENDE: el bartender se asustó (o está escondido, o caído) y los demás no se enteraron. El
     * que pide espera un poco y se vuelve a su sillón sin copa *(Santi: "me gusta la idea del civil rico que
     * se va")*.
     */
    if (R.modo === 'pidiendo' && R.hasta === Infinity && !(V.bartender && tranquilo(V.bartender))) {
      R.sinAtender = true;
      R.hasta = R.llego + azar(...C.sinAtender);
    }
    if (R.modo === 'charlando' && R.anfitrion && !tranquilo(R.anfitrion)) R.hasta = 0;
    if (R.llego >= R.hasta) {
      if (R.anfitrion && R.anfitrion.visitado === pa) R.anfitrion.visitado = null;
      R.modo = 'volviendo';
      R.conCopa = R.destino === 'barra' && !R.sinAtender;
      rutaHacia(world, pa, pa.casa);
    }
    return;
  }
  if (R.modo === 'volviendo') {
    if (caminar(world, pa, dt)) {
      pa.x = pa.casa.x; pa.y = pa.casa.y;
      pa.sentado = true;
      pa.facing = 0;
      // Vuelve de la barra con la copa: se sienta y toma.
      const ahora = performance.now() / 1000;
      if (R.conCopa) pa._p3 = { accion: 'copa', desde: ahora, hasta: ahora + azar(...C.copaAlVolver) };
      pa.rutina = null;
    }
  }
}

/** El guardaespaldas: lo sigue de lejos mientras camina; cuando el rico llegó, un momento después, a su puesto. */
function actualizarEscolta(world, V, pa, dt) {
  const e = pa.escolta, C = CONFIG.primeraClase;
  if (!enRonda(e) || !e.puestoCasa || !pa.alive) return;
  const R = pa.rutina;
  const caminando = R && (R.modo === 'yendo' || R.modo === 'volviendo');
  if (caminando) {
    e.esperando = null;
    if (distance(e.x, e.y, pa.x, pa.y) > C.distancia) e.puesto = { x: pa.x, y: pa.y };
    else e.puesto = { x: e.x, y: e.y };
    e.facingPuesto = Math.atan2(pa.y - e.y, pa.x - e.x);
    return;
  }
  // Ya llegó (o está sentado): ¿dónde le toca?
  let destino;
  if (!R) destino = { ...e.puestoCasa };
  else if (R.destino === 'barra') { const G = R.barra.guardia; destino = { ...V.en(G.c, G.r), mira: G.mira }; }
  else destino = puestoDeVisita(world, V, pa, R);
  if (!e.puesto || Math.hypot(e.puesto.x - destino.x, e.puesto.y - destino.y) > 1) {
    if (e.esperando == null) e.esperando = azar(...C.demora);
    e.esperando -= dt;
    if (e.esperando > 0) { e.puesto = { x: e.x, y: e.y }; return; }
  }
  e.esperando = null;
  e.puesto = { x: destino.x, y: destino.y };
  e.facingPuesto = destino.mira;
}

/** Del otro lado de la mesita del sillón que visita, mirando al pasillo (o, si ahí hay pared, al lado). */
function puestoDeVisita(world, V, pa, R) {
  if (R.puestoGuardia) return R.puestoGuardia;
  const h = R.anfitrion.casa, arriba = h.r < 5, mira = arriba ? ABAJO : ARRIBA;
  const libre = (c, r) => (V.layout[r] || '')[c] === '.';
  const vr = arriba ? h.r + 1 : h.r - 1;
  const [c, r] = [[h.c + 2, h.r], [h.c + 2, vr], [h.c - 2, vr]].find(([c, r]) => libre(c, r)) || [h.c + 1, vr];
  R.puestoGuardia = { ...V.en(c, r), mira };
  return R.puestoGuardia;
}

/**
 * El bartender: cuando un rico llega a la barra, va por detrás del mostrador hasta enfrente de él, le
 * sirve (`servir`, `CONFIG.primeraClase.servir` segundos) y vuelve a su lugar a secar copas.
 */
function actualizarBartender(world, V, bt, dt) {
  const C = CONFIG.primeraClase;
  if (!bt.casaBarra) bt.casaBarra = { x: bt.x, y: bt.y };
  bt._pcV = V;
  if (!tranquilo(bt)) { bt.sirve = null; bt.sirviendo = null; bt.ordenando = false; bt.arrimado = 0; return; }
  const pedido = V.pedido;
  if (pedido && (!tranquilo(pedido) || !pedido.rutina || pedido.rutina.modo !== 'pidiendo')) V.pedido = null;
  if (V.pedido && !bt.sirve) {
    const c = Math.max(DETRAS.c0, Math.min(DETRAS.c1, V.pedido.rutina.barra.c));
    bt.sirve = { a: V.pedido, punto: V.en(c, DETRAS.r), t: 0 };
    bt.ordenando = false;
    rutaHacia(world, bt, bt.sirve.punto);
  }
  const S = bt.sirve;
  if (S) {
    bt.arrimado = Math.max(0, (bt.arrimado || 0) - C.arrimeVelocidad * dt);
    if (!caminar(world, bt, dt)) return;
    bt.facing = ABAJO;
    S.t += dt;
    bt.sirviendo = S.t;
    if (S.t >= C.servir) {
      // Servido: el rico toma ahí un rato y el bartender vuelve.
      const R = S.a.rutina;
      if (R && R.modo === 'pidiendo') { R.modo = 'tomando'; R.llego = 0; R.hasta = azar(...C.enLaBarra); }
      V.pedido = null;
      bt.sirve = null; bt.sirviendo = null;
      bt.tarea = null;   // de vuelta a secar copas
      rutaHacia(world, bt, bt.casaBarra);
    }
    return;
  }
  bt.sirviendo = null;
  tareaDelBartender(world, V, bt, dt);
}

/**
 * 🆕 LO QUE HACE EL BARTENDER MIENTRAS NADIE PIDE, de día y de noche (nunca duerme) *(Santi eligió la A)*:
 *  - SECA COPAS en su lugar, de frente al salón (`CONFIG.primeraClase.secar`): ve como cualquiera.
 *  - ORDENA EL ESTANTE (`ordenar`, en total, contando las pausas): da un paso atrás hasta el estante y,
 *    de espaldas, mueve los brazos un rato, para, los vuelve a mover; a veces camina hasta otra parte del
 *    estante y se vuelve a poner de espaldas *(Santi: "solo está de espaldas y mueve los brazos, y cuando
 *    quiere desplazarse solo camina hacia dónde quiere ir")*. De espaldas no te ve de frente: es la ventana
 *    para cruzar, como con los civiles dormidos.
 * `bt.ordenando`: está moviendo los brazos (el dibujo, ver entities/passenger.js).
 */
function tareaDelBartender(world, V, bt, dt) {
  const C = CONFIG.primeraClase;
  /**
   * 🆕 PEGADO AL ESTANTE: su caja choca con la pared a la altura de los hombros y los pies le quedaban lejos.
   * Parado en el estante, el dibujo sube `arrimeEstante` (deslizándose), y baja cuando se va. Sólo el
   * dibujo: su lugar en el juego no cambia.
   */
  const enEstante = bt.tarea && bt.tarea.modo === 'ordenar' && !bt.ruta && bt.tarea.paso && bt.tarea.paso.tipo !== 'camina';
  const meta = enEstante ? C.arrimeEstante : 0, a = bt.arrimado || 0;
  bt.arrimado = a < meta ? Math.min(meta, a + C.arrimeVelocidad * dt) : Math.max(meta, a - C.arrimeVelocidad * dt);
  let T = bt.tarea;
  if (!T) T = bt.tarea = { modo: 'secar', queda: azar(...C.secar) };
  T.queda -= dt;
  bt.ordenando = false;
  if (T.modo === 'secar') {
    if (bt.ruta && !caminar(world, bt, dt)) return;   // volviendo a su lugar
    bt.ruta = null;
    bt.facing = ABAJO;
    if (T.queda <= 0) { bt.tarea = { modo: 'ordenar', queda: azar(...C.ordenar), paso: { tipo: 'camina' } }; alEstante(world, bt); }
    return;
  }
  // Ordenando el estante.
  if (T.queda <= 0) { bt.tarea = { modo: 'secar', queda: azar(...C.secar) }; rutaHacia(world, bt, bt.casaBarra); return; }
  if (bt.ruta && !caminar(world, bt, dt)) return;
  bt.ruta = null;
  bt.facing = ARRIBA;
  const P = T.paso;
  if (P.tipo === 'camina' || (P.t -= dt) <= 0) {
    if (P.tipo === 'brazos' && Math.random() < C.moverse) { T.paso = { tipo: 'camina' }; alEstante(world, bt); return; }
    T.paso = P.tipo === 'brazos' ? { tipo: 'pausa', t: azar(...C.pausa) } : { tipo: 'brazos', t: azar(...C.brazos) };
  }
  bt.ordenando = T.paso.tipo === 'brazos';
}

/** Camina hasta otra parte del estante (otra columna que la que tiene enfrente). */
function alEstante(world, bt) {
  const S = world.map.size, V = bt._pcV;
  const ahora = Math.floor(bt.x / S) - V.c0;
  const cols = [];
  for (let c = ESTANTE.c0; c <= ESTANTE.c1; c++) if (c !== ahora) cols.push(c);
  const c = cols[Math.floor(Math.random() * cols.length)];
  // (Pegado a la pared del estante, no en el medio de la casilla *(Santi: "quiero que se vea más cerca")*.)
  const P = V.en(c, ESTANTE.r);
  rutaHacia(world, bt, { x: P.x, y: P.y - S / 2 + CONFIG.primeraClase.pegadoEstante });
}
