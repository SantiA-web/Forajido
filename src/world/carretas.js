/**
 * 🛞 LAS CARRETAS DE LOS CAMINOS (etapa 4 del campo con vida, paso 1; los números en CAMPO.carretas, data/campo.js)
 * *(Santi, 2026-11-25: "pondría varios tipos de carretas… de menos a más"; "arrancá por el 1")*.
 *
 * Lo que hay en este paso: carretas que andan por los caminos del plano (data/plano.js), de un lado al otro, por su
 * derecha. Antes que la carreta se ve su polvo, que sube. Todavía sin caballos ni conductor (el dibujo de los caballos
 * viene después, *Santi: "los caballos (que serían los nuestros) se los ponemos después"*), sin asalto y sin subirse.
 *
 * DÓNDE ESTÁ CADA UNA SALE DE LA HORA, NO DE UN SORTEO CADA VEZ: cada día, cada camino tira su suerte para cada
 * sentido (siempre la misma para el mismo día) y, si sale, una carreta parte a la mañana de una punta. Anda sólo con luz
 * (mañana y tarde): de noche y de madrugada queda parada donde la agarró la noche, y sigue al otro día. Así, si te vas
 * y vuelves, está donde tiene que estar. Lo único que se guarda es cuánto la atrasaste parándote adelante (o la
 * adelantaste asustándola: entonces va rápida, y el atraso se vuelve negativo).
 *
 * El dibujo, de la carreta de Blender (entities/estiloNuevo/carreta.js), que es provisorio: Santi dibuja la suya
 * *(Santi: "darme el tiempo de encargarme yo de la carreta")*. De acá sólo se leen sus puntos (`x`/`y`, el suelo), así
 * que cambiar el dibujo no toca esto.
 */
import { CONFIG } from '../data/config.js';
import { dibujoCarreta, mapaCarreta } from '../entities/estiloNuevo/carreta.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';
import { dibujarNubeDeAire } from './estiloNuevo/polvo.js';

function hash(a, b, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Un punto del dibujo, en unidades del mundo (el de cerca). */
const PT = CONFIG.estilo.punto / 4;
/** Unidades del mundo por metro: el dibujo de Blender tiene 30 puntos por 1,80 m. */
const POR_METRO = PT * (30 / 1.8);

/**
 * `relieve` (sus `caminos`, ya en el mundo), `PROF`, `C` (CAMPO.carretas), `galope` (el del Criollo, la medida de las
 * velocidades), `segundosPorParte`, `partida()` (gameState.campo: ahí se guardan los atrasos).
 */
export function crearCarretas({ relieve, PROF, C, galope, segundosPorParte, partida }) {
  const S = segundosPorParte;

  // Cada camino con su largo de verdad (lo de arriba y abajo, desachatado), tramo por tramo.
  const caminos = relieve.caminos.map((c, i) => {
    const pts = c.pts, largos = [0];
    for (let k = 1; k < pts.length; k++) largos.push(largos[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], (pts[k][1] - pts[k - 1][1]) / PROF));
    return { i, nombre: c.nombre, pts, largos, largo: largos[largos.length - 1], V: C.caminos[c.nombre] };
  }).filter((c) => c.V);

  /** Dónde está, a `s` del principio del camino (o del final, de vuelta), corrida a su derecha: { x, y, dx, dy }. */
  function enElCamino(cam, s, vuelta) {
    const d = vuelta ? cam.largo - s : s;
    let k = 1;
    while (k < cam.largos.length - 1 && cam.largos[k] < d) k++;
    const [ax, ay] = cam.pts[k - 1], [bx, by] = cam.pts[k];
    const l = cam.largos[k] - cam.largos[k - 1] || 1, u = Math.max(0, Math.min(1, (d - cam.largos[k - 1]) / l));
    // (el rumbo, de verdad: con lo de arriba y abajo desachatado)
    let dx = (bx - ax) / l, dy = (by - ay) / PROF / l;
    if (vuelta) { dx = -dx; dy = -dy; }
    // A su derecha: con y hacia abajo, la derecha de (dx, dy) es (-dy, dx).
    const lado = C.porLaDerecha;
    return { x: ax + (bx - ax) * u - dy * lado, y: ay + (by - ay) * u + dx * lado * PROF, dx, dy };
  }

  /** Los segundos de luz desde el principio de la partida hasta (día, parte, lo que va de la parte). */
  function luz(dia, parte, va) {
    // (El día cambia a la madrugada: la madrugada es antes de la mañana del mismo día.)
    // 🔁 (Sin tope en la mañana y la tarde: cabalgando la parte ya no cambia, y el reloj de adentro sigue; las carretas
    // siguen andando aunque la luz sea la de la salida. A la noche, paradas donde quedaron al terminar la luz.)
    const dentro = parte === 0 ? va : parte === 1 ? S + va : parte === 2 ? 2 * S : 0;
    return dia * 2 * S + (parte === 2 ? 2 * S : dentro);
  }

  /** Los viajes que pueden andar hoy: los que partieron hace pocos días y todavía no llegaron. */
  function viajes(dia) {
    const out = [];
    for (const cam of caminos) {
      const vel = C.vel.paso * galope, dura = cam.largo / vel;   // segundos de luz que tarda
      // 🔁 (+2: con un día de margen para los atrasos largos —un asalto, o quedarte delante—; con +1 una que todavía
      // andaba podía salir de la lista y esfumarse.)
      const dias = Math.ceil(dura / (2 * S)) + 2;
      for (let d = dia - dias; d <= dia; d++) for (const vuelta of [false, true]) {
        if (hash(d, cam.i, vuelta ? 2 : 1) >= cam.V.chance) continue;
        const sale = d * 2 * S + hash(d, cam.i, vuelta ? 4 : 3) * C.saleHasta * S;
        const tipos = Object.entries(cam.V.tipos), total = tipos.reduce((a, [, p]) => a + p, 0);
        let t = hash(d, cam.i, vuelta ? 6 : 5) * total, tipo = tipos[0][0];
        for (const [n, p] of tipos) { if ((t -= p) < 0) { tipo = n; break; } }
        out.push({ id: `${cam.i}-${d}-${vuelta ? 'v' : 'i'}`, cam, vuelta, sale, vel, tipo });
      }
    }
    return out;
  }

  /** Las ocho vistas, desde el este en el sentido contrario al reloj (de a 45°). */
  const VISTAS = ['este', 'noreste', 'norte', 'noroeste', 'oeste', 'suroeste', 'sur', 'sureste'];

  /** Lo que se ve ahora: { id, x, y, dx, dy, s, anda, tipo, vista, cuadro }. */
  let activas = [], reloj = 0, ahoraLuz = 0;
  /**
   * 🏃 Las que se salieron del camino escapando (`soltar`), en la partida: { id: { x, y, rumbo, s, destino, giro, trabada } }.
   * `terreno(x, y)`: si una carreta puede estar ahí (sin piedra, mata, meseta ni James; lo pone la escena).
   * `alLlegar(c, destino)`: cuando una llega al pueblo (lo pone el asalto: te denuncia).
   */
  const sueltas = () => { const g = partida(); if (!g.carretasSueltas) g.carretasSueltas = {}; return g.carretasSueltas; };
  let terreno = () => true, alLlegar = () => {}, luzAntes = null;
  /** Los segundos que le quedan de susto a cada viaje (no se guarda: si te vas, se calma). */
  const sustos = {};
  /**
   * 🐎 El ritmo de cada viaje ahora (1 = al paso, 0 = parada, más de 1 = apurada; no se guarda). 🔁 (2026-11-27, Santi:
   * "la carreta da tirones cuando galopo"): galopando hacia ella se asustaba y pasaba del paso a la carrera en un cuadro
   * —la diligencia, casi cuatro veces más rápido—, y se paraba en seco si te le ponías adelante. Ahora el ritmo va hacia
   * el que toca de a poco: arranca y apura con `vel.acelera` por segundo, frena con `vel.frena`.
   */
  const ritmos = {};
  /**
   * 🛞 Lo que cada carreta se acuerda entre cuadros (no se guarda): `desvios` (el rodeo: cuántos metros va corrida a su
   * derecha `d`, cuánto tuerce el rumbo `giro`, dónde estaba `s`, si espera detrás de una parada `espera`) y `rastros`
   * (dónde estuvo, para el polvo).
   */
  const desvios = {}, rastros = {};
  const atrasos = () => { const g = partida(); if (!g.atrasosCarretas) g.atrasosCarretas = {}; return g.atrasosCarretas; };
  /** 🔫 Lo que pasó con cada viaje asaltado (world/asaltoCarreta.js): { robada, muerto, s }. Con `s`, queda parada ahí. */
  const estados = () => { const g = partida(); if (!g.carretasAsaltadas) g.carretasAsaltadas = {}; return g.carretasAsaltadas; };

  /** Dónde estaba el viaje `v` a los `l` segundos de luz (con su atraso de ahora). */
  function posicion(v, l) {
    const E = estados()[v.id];
    if (E && E.s != null) return { s: E.s, parada: true, ...enElCamino(v.cam, E.s, v.vuelta) };
    const s = (l - v.sale - (atrasos()[v.id] || 0)) * v.vel;
    if (s < 0 || s > v.cam.largo) return null;
    return { s, ...enElCamino(v.cam, s, v.vuelta) };
  }

  /**
   * Cada cuadro: `tiempo` { dia, parte, va } (va: los segundos de la parte de ahora); `frente(c)`: si hay alguien
   * delante de la carreta (entonces se para y se atrasa); `asusta(c)`: si algo la asusta ahora (entonces va rápida).
   */
  function actualizar(dt, tiempo, frente, asusta) {
    reloj += dt;
    // 🔁 El reloj de las carretas nunca vuelve atrás (revisión, 2026-11-26). Cabalgando, la parte no cambia y el reloj
    // de adentro sigue (`va` sin tope); al esperar la noche, o al volver a entrar, el reloj de afuera podía quedar ANTES
    // del de las carretas, y todas retrocedían cientos de metros (y volvían las que ya habían llegado). Ahora, si el de
    // afuera queda atrás, la diferencia se guarda (`luzExtra`, en la partida) y se sigue desde donde estaban.
    const g = partida(), real = luz(tiempo.dia, tiempo.parte, tiempo.va);
    if (g.luzCarretas != null && real + (g.luzExtra || 0) < g.luzCarretas) g.luzExtra = g.luzCarretas - real;
    ahoraLuz = real + (g.luzExtra || 0);
    g.luzCarretas = ahoraLuz;
    // (Lo que avanzó la luz desde el cuadro anterior: lo que anda una suelta. Con tope, por si cambia el día de golpe.)
    const dl = luzAntes == null ? 0 : Math.max(0, Math.min(0.25, ahoraLuz - luzAntes));
    luzAntes = ahoraLuz;
    const deDia = tiempo.parte === 0 || tiempo.parte === 1;
    // (Los viajes, por el día de las carretas: cabalgando mucho en una mañana, salen los del día siguiente.)
    const A = atrasos(), lista = [], hoy = viajes(Math.floor(ahoraLuz / (2 * S))), ids = new Set(hoy.map((v) => v.id));
    for (const v of hoy) {
      const E0 = estados()[v.id], SU = sueltas()[v.id];
      if (E0 && E0.llego) continue;   // (llegó al pueblo escapando: su viaje terminó ahí)
      // 🏃 (Una suelta que siguió sin ti —te fuiste del campo y pasó el tiempo—: llegó.)
      if (SU && !(E0 && E0.s != null) && SU.luz != null && ahoraLuz - SU.luz > C.huida.llegaSola) { llegar(v, SU); continue; }
      const p = SU ? { s: SU.s, x: SU.x, y: SU.y, dx: Math.cos(SU.rumbo), dy: Math.sin(SU.rumbo), parada: !!(E0 && E0.s != null) } : posicion(v, ahoraLuz);
      // 🔁 (Ya no borra el atraso al terminar el camino: a una que apuraste, el atraso negativo la tiene llegada; si se
      // borraba, aparecía 100 m antes del final y volvía a llegar. Se borra cuando el viaje sale de la lista, abajo.)
      if (!p) continue;
      const c = { ...p, id: v.id, v, tipo: v.tipo, anda: deDia && !p.parada, suelta: !!SU, deDia };
      // 🛞 (Corrida como estaba en el cuadro anterior —el rodeo—: así `frente` mira donde está de verdad.)
      if (!SU) { c.base = { x: c.x, y: c.y, dx: c.dx, dy: c.dy }; poner(c, desvioDe(c)); }
      if (SU && !p.parada) {
        // 🏃 Campo traviesa, a galope, hacia el pueblo (frena sólo si la retienes tú o se defiende).
        SU.luz = ahoraLuz;
        c.anda = deDia && !frente(c) && huir(SU, v, dl);
        c.rapida = c.anda;
        Object.assign(c, { x: SU.x, y: SU.y, s: SU.s, dx: Math.cos(SU.rumbo), dy: Math.sin(SU.rumbo) });
        // (Llegó: a `llega` metros del pueblo; o trabada ya en las afueras —a `llegaCerca`—: de ahí siguen a pie.)
        const falta = Math.hypot(SU.destino.x - SU.x, (SU.destino.y - SU.y) / PROF) / POR_METRO;
        if (falta < C.huida.llega || (falta < C.huida.llegaCerca && SU.trabada > C.huida.atasca)) { llegar(v, SU, c); continue; }
      }
      if (deDia && asusta && asusta(c)) sustos[v.id] = C.susto.dura;
      if (sustos[v.id] > 0) { sustos[v.id] -= dt; if (sustos[v.id] <= 0) delete sustos[v.id]; }
      if (p.parada || SU) { /* (quieta para siempre; o suelta, que ya se movió) */ }
      else if (deDia) {
        // 🐎 Parada si hay alguien delante; rápida si está asustada; si no, al paso. Lo que anda de menos o de más se
        // cuenta como un atraso (la posición sigue saliendo de la hora). 🔁 Antes cambiaba de golpe (ver `ritmos`).
        let meta = frente(c) ? 0 : sustos[v.id] ? rapidaDe(v.tipo) / C.vel.paso : 1;
        // 🚦 (2026-11-27, Santi: "dos carretas que van para el mismo lado pueden encimarse".) Si otra que anda va
        // delante, para el mismo lado y por el mismo camino, a menos de `sigue.ve` metros, ésta se acomoda a su paso; a
        // menos de `sigue.cerca`, frena. Las paradas no cuentan: a ésas las rodea (ver `rodear`).
        if (meta > 0) meta = Math.min(meta, siguiendo(c));
        let r = ritmos[v.id] == null ? 1 : ritmos[v.id];
        r = meta > r ? Math.min(meta, r + C.vel.acelera * dt) : Math.max(meta, r - C.vel.frena * dt);
        ritmos[v.id] = r;
        A[v.id] = (A[v.id] || 0) + dt * (1 - r);
        c.ritmo = r;
        if (r < 0.02) c.anda = false;
        if (r > 1.05) c.rapida = true;
      } else ritmos[v.id] = 0;   // (De noche, quieta: al amanecer arranca de a poco, no con el ritmo de la tarde.)
      // Ocho vistas: la del rumbo de verdad más cercano (cada una cubre 45°). 🔁 Eran cuatro *(Santi: "te pasé 5 vistas para
      // que añadieras las diagonales de la carreta y pase a 8 vistas")*.
      c.vista = VISTAS[(Math.round(Math.atan2(-c.dy, c.dx) / (Math.PI / 4)) + 8) % 8];
      // (El dibujo: el de su tipo; la de la mina yendo a la mina, con la paga en el cofre y la caja vacía.)
      c.dibujo = v.tipo === 'mina' && !v.vuelta ? 'minaIda' : v.tipo;
      // Las ruedas: un rayo de la de atrás por vuelta de 8 cuadros (lo que avanza: C.vueltaRueda metros).
      // 🔁 (Siempre de 0 a 7: reculando, `s` puede quedar negativo, y el resto de un negativo es negativo.)
      c.cuadro = ((Math.floor((c.s / (C.vueltaRueda * POR_METRO)) * 8) % 8) + 8) % 8;
      lista.push(c);
    }
    dtAhora = dt;
    rodear(lista);
    activas = lista;
    // 🌫️ (Dónde estuvo cada una, para el polvo: la suelta y la que rodea no están donde dice la hora.)
    for (const c of lista) {
      if (!c.anda) continue;
      const R = rastros[c.id] || (rastros[c.id] = []);
      R.push({ t: reloj, x: c.x, y: c.y, dx: c.dx, dy: c.dy });
      while (R.length && reloj - R[0].t > C.polvo.vida + 0.5) R.shift();
    }
    // 🧹 Lo de los viajes que ya no andan (terminaron hace días): se olvida. Una suelta que quedó sin llegar, llegó
    // (si no, irse del campo era un truco para que no te denuncie).
    for (const k in A) if (!ids.has(k)) delete A[k];
    for (const k in sustos) if (!ids.has(k)) delete sustos[k];
    for (const k in ritmos) if (!ids.has(k)) delete ritmos[k];
    for (const k in pegadas) if (!ids.has(k)) delete pegadas[k];
    for (const k in desvios) if (!ids.has(k)) delete desvios[k];
    for (const k in rastros) { const R = rastros[k]; if (!ids.has(k) || !R.length || reloj - R[R.length - 1].t > C.polvo.vida + 0.5) delete rastros[k]; }
    const SUS = sueltas();
    for (const k in SUS) {
      if (ids.has(k)) continue;
      const E = estados()[k];
      if (!(E && (E.llego || E.s != null))) llegar({ id: k, tipo: SUS[k].tipo || 'diligencia' }, SUS[k]);
      delete SUS[k];
    }
    // (🔁 Y lo anotado de cada asalto —robada, conductor muerto, pasajeros—: antes se juntaba para siempre en la partida.
    // Después de las sueltas: si no, una que ya había llegado perdía su `llego` y te volvía a denunciar.)
    { const EST = estados(); for (const k in EST) if (!ids.has(k)) delete EST[k]; }
  }

  /** 🏃 Una suelta llegó a su pueblo: su viaje termina ahí y el asalto decide si te denuncia (`alLlegar`). */
  function llegar(v, SU, c = null) {
    const E = estados()[v.id] || (estados()[v.id] = {});
    if (E.llego) return;
    E.llego = true;
    alLlegar(c || { id: v.id, tipo: v.tipo }, SU.destino, SU);
  }

  /** La velocidad de escape de cada tipo, en galopes: la diligencia, liviana, galopa; las pesadas, al trote. */
  const rapidaDe = (tipo) => (C.vel.rapidaDe && C.vel.rapidaDe[tipo]) || C.vel.rapida;

  /**
   * Si una carreta (de `id`, o de los ids de la lista) puede estar en (x, y): el terreno que pone la escena (piedras,
   * matas, mesetas, tú, el borde) y además ninguna otra carreta encima.
   */
  function libre(x, y, fuera) {
    if (!terreno(x, y)) return false;
    const H = C.huella, m = 0.6;
    for (const c of activas) {
      if (c.id === fuera || (Array.isArray(fuera) && fuera.includes(c.id))) continue;
      const ex = x - c.x, ey = (y - c.y) / PROF;
      const largo = ex * c.dx + ey * c.dy, ancho = -ex * c.dy + ey * c.dx;
      if (largo > -(H.atras + m) * POR_METRO && largo < (H.adelante + m) * POR_METRO && Math.abs(ancho) < (H.ancho + m) * POR_METRO) return false;
    }
    return true;
  }

  /**
   * 🛞 La que anda esquiva a las paradas (`C.rodeo`): se corre de costado lo que le falta para pasar a `aparte` metros,
   * entrando y saliendo de a poco, y gira el dibujo según cuánto se corre (no va de costado como un cangrejo).
   */
  /**
   * Por qué lado rodear la parada `o` (`B`: dónde iría la carreta sin rodeo; `b`: dónde queda la parada, de costado):
   * 1, -1, o 0 si no hay paso por ninguno. 🔁 Mira la curva entera —la entrada, el costado y la salida—, no sólo el
   * tramo de al lado de la parada (revisión: al abrirse o al volver podía cruzar una piedra).
   */
  function ladoLibre(c, B, o, b) {
    const R = C.rodeo, H = C.huella, nx = -B.dy, ny = B.dx;
    const ex = (o.x - B.x) / POR_METRO, ey = (o.y - B.y) / POR_METRO / PROF, a0 = ex * B.dx + ey * B.dy;
    const pasa = (lado) => {
      for (let a = -R.largo; a <= R.largo; a += 1.5) {
        const largo = a0 + a;
        if (largo < -H.atras) continue;   // (lo que ya dejó atrás)
        const w = Math.min(1, (R.largo - Math.abs(a)) / R.entra), lat = (b + lado * R.aparte) * w * w * (3 - 2 * w);
        for (const k of [-H.ancho, 0, H.ancho]) {
          const x = B.x + (B.dx * largo + nx * (lat + k)) * POR_METRO, y = B.y + (B.dy * largo + ny * (lat + k)) * POR_METRO * PROF;
          if (!libre(x, y, [c.id, o.id])) return false;
        }
      }
      return true;
    };
    const primero = b > 0 ? -1 : 1;
    return pasa(primero) ? primero : pasa(-primero) ? -primero : 0;
  }
  const rodeos = {};
  let dtAhora = 0;

  /** El desvío de una carreta (lo crea; una parada por un asalto arranca con el que tenía al pararse, `E.d`). */
  function desvioDe(c) {
    if (!desvios[c.id]) { const E = estados()[c.id]; desvios[c.id] = { d: (E && E.d) || 0, giro: 0, s: c.s, espera: false }; }
    return desvios[c.id];
  }
  /** Pone a `c` corrida `D.d` metros a la derecha de su lugar en el camino (`c.base`), con el rumbo torcido `D.giro`. */
  function poner(c, D) {
    const B = c.base, nx = -B.dy, ny = B.dx;
    c.x = B.x + nx * D.d * POR_METRO; c.y = B.y + ny * D.d * POR_METRO * PROF;
    const dx = B.dx + nx * D.giro, dy = B.dy + ny * D.giro, l = Math.hypot(dx, dy) || 1;
    c.dx = dx / l; c.dy = dy / l;
    c.vista = VISTAS[(Math.round(Math.atan2(-c.dy, c.dx) / (Math.PI / 4)) + 8) % 8];
  }

  /** Los ocho vecinos de una casilla (para buscar la ruta). */
  const VECINOS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  /**
   * 🗺️ La ruta de una que escapa, de (x0, y0) al pueblo (x1, y1), rodeando mesetas, agua y otras carretas: una búsqueda
   * en una grilla de `huida.grilla` metros (A*). [[x, y], …] o null si no la encuentra. 🆕 (Revisión: mirando sólo 7 m
   * adelante, contra una barranca con forma de U se quedaba yendo y viniendo para siempre.) Las piedras chicas las
   * esquiva igual mirando adelante, mientras va.
   */
  function ruta(x0, y0, x1, y1, id) {
    const K = C.huida, G = K.grilla * POR_METRO, r = 1.4 * POR_METRO, margen = K.margen * POR_METRO;
    const X0 = Math.min(x0, x1) - margen, Y0 = Math.min(y0, y1) / PROF - margen;
    const W = Math.ceil((Math.abs(x1 - x0) + 2 * margen) / G) + 1, AL = Math.ceil((Math.abs(y1 - y0) / PROF + 2 * margen) / G) + 1;
    const wx = (i) => X0 + i * G, wy = (j) => (Y0 + j * G) * PROF;
    const memo = new Int8Array(W * AL);   // (0: sin mirar; 1: pasa; 2: no)
    const pasa = (i, j) => {
      if (i < 0 || j < 0 || i >= W || j >= AL) return false;
      const k = j * W + i;
      if (!memo[k]) { const x = wx(i), y = wy(j); memo[k] = [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([a, b]) => libre(x + a, y + b * PROF, id)) ? 1 : 2; }
      return memo[k] === 1;
    };
    const si = Math.round((x0 - X0) / G), sj = Math.round((y0 / PROF - Y0) / G);
    const gi = (x1 - X0) / G, gj = (y1 / PROF - Y0) / G, llega = K.llega * POR_METRO;
    const N = W * AL, costo = new Float32Array(N).fill(Infinity), de = new Int32Array(N).fill(-1), hecho = new Uint8Array(N);
    const heap = [];
    const meter = (f, k) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const sacar = () => {
      const top = heap[0], ult = heap.pop();
      if (heap.length) { heap[0] = ult; let i = 0; for (;;) { const l = 2 * i + 1, d = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (d < heap.length && heap[d][0] < heap[m][0]) m = d; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } }
      return top;
    };
    const s0 = sj * W + si;
    costo[s0] = 0; meter(Math.hypot(si - gi, sj - gj), s0);
    let fin = -1, vistos = 0;
    while (heap.length && vistos < K.buscaHasta) {
      const k = sacar()[1];
      if (hecho[k]) continue;
      hecho[k] = 1; vistos++;
      const i = k % W, j = (k / W) | 0;
      if (Math.hypot(wx(i) - x1, (wy(j) - y1) / PROF) < llega) { fin = k; break; }
      for (const [a, b] of VECINOS) {
        const ni = i + a, nj = j + b;
        if (!pasa(ni, nj) || (a && b && (!pasa(i + a, j) || !pasa(i, j + b)))) continue;
        const nk = nj * W + ni, nc = costo[k] + (a && b ? Math.SQRT2 : 1);
        if (nc < costo[nk]) { costo[nk] = nc; de[nk] = k; meter(nc + Math.hypot(ni - gi, nj - gj), nk); }
      }
    }
    if (fin < 0) return null;
    const pts = [];
    for (let k = fin; k >= 0 && k !== s0; k = de[k]) pts.push([wx(k % W), wy((k / W) | 0)]);
    pts.reverse();
    pts.push([x1, y1]);
    return pts;
  }

  /**
   * 🏃 Un paso de una suelta hacia su pueblo, `dl` segundos de luz: a galope, mirando `mira` metros adelante; si por ahí
   * no pasa, prueba más abierto para su lado (y si no, para el otro), y gira de a poco. true si se movió.
   */
  function huir(SU, v, dl) {
    if (dl <= 0) return false;
    // 🔁 (Con su velocidad de escape, `huida.vel`: más que la de un susto en el camino.)
    const K = C.huida, H = C.huella, vel = v.vel * (K.vel / C.vel.paso);
    // (Si entra entera: el medio, la punta y las cuatro esquinas.)
    const cabe = (x, y, a) => {
      const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
      for (const [l, w] of [[0, 0], [H.adelante, 0], [H.adelante, H.ancho], [H.adelante, -H.ancho], [-H.atras, H.ancho], [-H.atras, -H.ancho], [0, H.ancho], [0, -H.ancho], [H.adelante / 2, 0], [-H.atras, 0]]) {
        if (!libre(x + (dx * l + nx * w) * POR_METRO, y + (dy * l + ny * w) * POR_METRO * PROF, v.id)) return false;
      }
      return true;
    };
    const mira = K.mira * POR_METRO;
    // (Mira el camino entero, de a pedazos: si sólo mira lejos, una piedra a 3 m queda entre la punta y la cola, y no la ve.)
    const hay = (a) => [0.15, 0.35, 0.6, 1].some((f) => !cabe(SU.x + Math.cos(a) * mira * f, SU.y + Math.sin(a) * mira * f * PROF, a));
    // 🗺️ (Adónde: al punto siguiente de su ruta —`ruta`, rodeando mesetas—; si no tiene, derecho al pueblo.)
    const RU = SU.ruta, G = K.grilla * POR_METRO;
    if (RU) while (SU.paso < RU.length - 1 && Math.hypot(RU[SU.paso][0] - SU.x, (RU[SU.paso][1] - SU.y) / PROF) < 2 * G) SU.paso++;
    const meta = RU ? RU[SU.paso] : [SU.destino.x, SU.destino.y];
    const progreso = () => (RU ? SU.paso * 1e6 : 0) - Math.hypot(meta[0] - SU.x, (meta[1] - SU.y) / PROF);
    let objetivo = Math.atan2((meta[1] - SU.y) / PROF, meta[0] - SU.x);
    if (hay(objetivo)) {
      let hallo = false;
      for (const d of [0.3, 0.6, 0.9, 1.2, 1.6, 2.0, 2.5]) {
        if (!hay(objetivo + d * SU.giro)) { objetivo += d * SU.giro; hallo = true; break; }
        if (!hay(objetivo - d * SU.giro)) { objetivo -= d * SU.giro; SU.giro = -SU.giro; hallo = true; break; }
      }
      // (Nada libre: gira en el lugar para su lado, a ver si así encuentra salida.)
      if (!hallo) objetivo = SU.rumbo + SU.giro * Math.PI / 2;
    }
    const dif = Math.atan2(Math.sin(objetivo - SU.rumbo), Math.cos(objetivo - SU.rumbo)), g = K.giro * dl;
    const paso = vel * dl, giro = Math.abs(dif) < g ? dif : Math.sign(dif) * g, otro = -(Math.sign(dif) || 1) * g;
    // (Avanza girando hacia donde quiere; si así no entra —una piedra, o tú en la esquina—, derecho; si no, girando para
    // el otro lado. Y si no puede avanzar, al menos gira en el lugar para donde entre.)
    // 🗺️ (Si en `sinAvance` segundos no se acercó ni un metro —a su punto de la ruta, o al pueblo—, busca la ruta otra vez
    // desde donde está; a la segunda que no avanza, cuenta como trabada: si estás cerca, frena y se defiende.)
    const avanzo = (si) => {
      const p = progreso();
      // (Recién buscada la ruta, se toma como punto de partida —sin borrar cuántas veces la buscó: si no, nunca contaba
      // como trabada—.)
      if (SU.mejor == null) { SU.mejor = p; SU.sinAvance = 0; }
      else if (p > SU.mejor + POR_METRO) { SU.mejor = p; SU.sinAvance = 0; SU.replan = 0; SU.perdida = false; }
      else if ((SU.sinAvance = (SU.sinAvance || 0) + dl) > K.sinAvance) {
        SU.sinAvance = 0; SU.mejor = null; SU.replan = (SU.replan || 0) + 1; SU.perdida = SU.replan >= 2;
        // (Busca de nuevo sólo las primeras veces: perdida, ya no —cada búsqueda que no encuentra salida mira 40 000
        // casillas, y repetirla cada 10 s trababa el juego—. Si se destraba sola y avanza, vuelve a poder buscar.)
        if (!SU.perdida) { SU.ruta = ruta(SU.x, SU.y, SU.destino.x, SU.destino.y, v.id); SU.paso = 0; }
      }
      return si;
    };
    for (const r of [SU.rumbo + giro, SU.rumbo, SU.rumbo + otro]) {
      const x = SU.x + Math.cos(r) * paso, y = SU.y + Math.sin(r) * paso * PROF;
      if (!cabe(x, y, r)) continue;
      SU.trabada = 0;
      SU.x = x; SU.y = y; SU.rumbo = r; SU.s += paso;
      return avanzo(true);
    }
    // (Retrocede un poco, girando: los caballos reculan y la trompa se abre hacia donde quiere ir.) 🔁 A una fracción de
    // su paso, no de su galope: con cuatro caballos, una carreta recula despacio.
    // (Y si girando no entra, derecho para atrás: encajonada entre dos cactus, girar no se puede.)
    for (const r of [SU.rumbo + giro, SU.rumbo + otro, SU.rumbo]) {
      const atras = v.vel * dl * K.recula, x = SU.x - Math.cos(r) * atras, y = SU.y - Math.sin(r) * atras * PROF;
      if (!cabe(x, y, r)) continue;
      SU.x = x; SU.y = y; SU.rumbo = r; SU.s = Math.max(0, SU.s - atras);
      SU.trabada = (SU.trabada || 0) + dl * 0.25;   // (reculando cuenta, pero menos: si no sale nunca, se rinde igual)
      return avanzo(true);
    }
    SU.trabada = (SU.trabada || 0) + dl;
    return avanzo(false);
  }

  /**
   * 🏃 Que se salga del camino y escape a uno de `pueblos` ([{ x, y, nombre }]): el más cerca que no quede de tu lado
   * (`yo`: { x, y }). Si todos quedan de tu lado, el más cerca igual.
   */
  function soltar(c, pueblos, yo, motivo = null) {
    if (sueltas()[c.id] || !pueblos.length) return;
    const aYo = Math.atan2((yo.y - c.y) / PROF, yo.x - c.x);
    const dist = (p) => Math.hypot(p.x - c.x, (p.y - c.y) / PROF);
    const lejosDeTi = (p) => { const a = Math.atan2((p.y - c.y) / PROF, p.x - c.x); return Math.abs(Math.atan2(Math.sin(a - aYo), Math.cos(a - aYo))) > Math.PI / 3; };
    const orden = pueblos.slice().sort((a, b) => dist(a) - dist(b));
    const p = orden.find(lejosDeTi) || orden[0];
    // (Para qué lado esquiva primero: el contrario a ti.)
    const lado = Math.sign(-c.dy * (yo.x - c.x) + c.dx * (yo.y - c.y) / PROF) || 1;
    // (`motivo`: por qué escapa —'amenaza' si la amenazaste o le pegaste; null si sólo le tapabas el camino—: al llegar,
    // denuncia sólo si hubo amenaza. `ruta`: por dónde, rodeando mesetas.)
    sueltas()[c.id] = { x: c.x, y: c.y, rumbo: Math.atan2(c.dy, c.dx), s: c.s, destino: { x: p.x, y: p.y, nombre: p.nombre }, giro: -lado, trabada: 0,
      tipo: c.tipo, motivo, luz: ahoraLuz, ruta: ruta(c.x, c.y, p.x, p.y, c.id), paso: 0 };
  }

  /** Que una suelta pase a tener motivo para denunciarte (la amenazaste mientras escapaba). */
  function motivar(id) { const SU = sueltas()[id]; if (SU) SU.motivo = 'amenaza'; }

  /**
   * 🛞 EL RODEO, con memoria (🔁 revisión, 2026-11-26). Cada carreta del camino tiene adónde quiere estar de costado
   * (`objetivo`) y adónde está (`desvios[id].d`); se acerca de a poco, a lo sumo `rodeo.lateral` metros por metro que
   * avanza, y quieta no se mueve de costado. Antes el corrimiento salía de nuevo cada cuadro: si la que rodeaba se
   * frenaba (le apuntabas, se te ponía delante, caía la noche) o la parada seguía viaje, saltaba 5 m de golpe.
   * Lo que esquiva: las paradas, las que esperan detrás de una, y las que vienen de frente por el mismo camino (cada una
   * se corre `rodeo.cruce` metros a su derecha, como en la vida real: antes se atravesaban).
   */
  function rodear(lista) {
    const R = C.rodeo;
    if (!R) return;
    // (Los lados elegidos se olvidan cuando ya no está rodeando esa parada: si vuelve a cruzarla en otro lugar, mira
    // de nuevo el terreno.)
    const usados = new Set();
    const paradas = new Set(lista.filter((o) => !o.anda || (desvios[o.id] && desvios[o.id].espera)));
    for (const c of lista) {
      if (c.suelta || !c.base) continue;
      const B = c.base, D = desvioDe(c), nx = -B.dy, ny = B.dx;
      let objetivo = 0;
      for (const o of lista) {
        if (o === c) continue;
        const ex = (o.x - B.x) / POR_METRO, ey = (o.y - B.y) / POR_METRO / PROF;
        const a = ex * B.dx + ey * B.dy, b = ex * nx + ey * ny;
        let falta = 0;
        if (paradas.has(o) && c.anda) {
          if (Math.abs(a) > R.largo || Math.abs(b) > R.aparte) continue;
          const w = Math.min(1, (R.largo - Math.abs(a)) / R.entra), suave = w * w * (3 - 2 * w);
          // (Para el lado contrario a donde está la parada; si por ahí hay una piedra o una meseta, por el otro. Se
          // decide una vez por parada y queda: si no, cambiaría de lado en el medio. *Santi: "que en el rodeo sí se fije
          // si hay una piedra u obstáculo"*.)
          const clave = c.id + '|' + o.id;
          if (!rodeos[clave]) rodeos[clave] = ladoLibre(c, B, o, b);   // (si no había paso, vuelve a mirar)
          usados.add(clave);
          const lado = rodeos[clave];
          if (lado === 0) { objetivo = null; break; }   // (no hay por dónde: espera)
          // (Adónde tiene que ir, de costado: a `aparte` metros de la parada, por el lado elegido. 🔁 Antes era
          // `aparte - |b|`, que sólo sirve para el lado contrario: por el mismo lado la dejaba pegada a la parada.)
          falta = (b + lado * R.aparte) * suave;
        } else if (o.anda && !o.suelta && o.dx * B.dx + o.dy * B.dy < -0.5 && a > -R.largo && a < R.cruceVe && Math.abs(b) < 2 * R.cruce + 2 * C.huella.ancho) {
          // (De frente, por el mismo camino: a su derecha, de a poco a medida que se acercan.)
          const w = Math.min(1, (R.cruceVe - Math.abs(a)) / R.entra);
          falta = R.cruce * w * w * (3 - 2 * w);
        }
        if (Math.abs(falta) > Math.abs(objetivo)) objetivo = falta;
      }
      const avance = Math.abs(c.s - D.s) / POR_METRO;
      D.s = c.s;
      if (objetivo === null) {
        // (Trabada: ni por un lado ni por el otro. Espera detrás, como si tuviera a alguien delante. 🔁 Si iba apurada,
        // se deshace también lo del susto: si no, "esperando" seguía avanzando y se metía en la parada.)
        if (c.anda) {
          const r = c.ritmo != null ? c.ritmo : c.rapida ? rapidaDe(c.tipo) / C.vel.paso : 1;
          atrasos()[c.id] = (atrasos()[c.id] || 0) + dtAhora * r;
          c.anda = false; c.rapida = false;
          ritmos[c.id] = 0;   // (y arranca de a poco cuando haya paso)
        }
        D.espera = true;
        poner(c, D);
        continue;
      }
      D.espera = false;
      if (avance > 1e-5) {
        const antes = D.d, tope = R.lateral * avance;
        D.d = Math.abs(objetivo - D.d) <= tope ? objetivo : D.d + Math.sign(objetivo - D.d) * tope;
        // (El rumbo se tuerce lo que se corre por metro, y se endereza de a poco: no de golpe al llegar al costado.)
        const giro = (D.d - antes) / avance, k = Math.min(1, avance / 1.5);
        D.giro += (giro - D.giro) * k;
      }
      poner(c, D);
    }
    for (const k in rodeos) if (!usados.has(k)) delete rodeos[k];
  }

  /** 🚦 Hasta qué ritmo puede ir `c` por la que tiene delante en su mismo camino (1 o más si no hay ninguna cerca). */
  function siguiendo(c) {
    const S = C.sigue;
    let tope = Infinity;
    if (!S) return tope;
    for (const o of activas) {
      // (🔁 Revisión con un juez: del mismo camino y para el mismo lado; si no, en un cruce cada una veía a la otra
      // "delante" y se frenaban las dos.)
      if (o.id === c.id || !o.anda || o.suelta || o.dx * c.dx + o.dy * c.dy < 0.7) continue;
      if (o.v && c.v && (o.v.cam !== c.v.cam || o.v.vuelta !== c.v.vuelta)) continue;
      const ex = (o.x - c.x) / POR_METRO, ey = (o.y - c.y) / POR_METRO / PROF;
      const a = ex * c.dx + ey * c.dy, b = -ex * c.dy + ey * c.dx;
      if (a <= 0 || a > S.ve || Math.abs(b) > S.ancho) continue;
      // (Cerca, frena; un poco más lejos, de a poco hasta el paso de la de adelante.)
      const suya = o.ritmo ?? 1, f = (a - S.cerca) / (S.ve - S.cerca);
      tope = Math.min(tope, a < S.cerca ? 0 : suya + Math.max(0, 1 - suya) * f);
    }
    return tope;
  }

  /** 🛞 Cuántos metros va corrida de su camino la carreta `id` ahora (para que quede ahí si se para por un asalto). */
  function desvio(id) { return desvios[id] ? desvios[id].d : 0; }

  /** Si (x, y) cae sobre una carreta (para chocar). Del pie de atrás al pescante, y el ancho de las ruedas. */
  function choca(x, y) {
    const H = C.huella;
    for (const c of activas) {
      const ex = x - c.x, ey = (y - c.y) / PROF;
      const largo = ex * c.dx + ey * c.dy, ancho = -ex * c.dy + ey * c.dx;
      if (largo > -H.atras * POR_METRO && largo < H.adelante * POR_METRO && Math.abs(ancho) < H.ancho * POR_METRO) return c;
    }
    return null;
  }

  /** Si (x, y) está delante de la carreta `c`, en su camino (entonces se para). */
  function delante(c, x, y) {
    const H = C.huella, ex = x - c.x, ey = (y - c.y) / PROF;
    const largo = ex * c.dx + ey * c.dy, ancho = -ex * c.dy + ey * c.dx;
    return largo > 0 && largo < H.paraA * POR_METRO && Math.abs(ancho) < H.ancho * 1.4 * POR_METRO;
  }

  /**
   * 🔁 (2026-11-27, Santi: "la carreta da tirones cuando galopo".) Contada siempre desde la cámara, galopando a su lado
   * —la cámara corriendo más rápido que ella— la carreta avanzaba sobre el suelo a saltos desparejos: medio punto, dos,
   * nada, dos y medio. Ahora se cuenta desde la cámara sólo mientras va a tu paso (ahí sí, si no daba saltitos a tu
   * lado); si no, pegada al suelo, como todo lo quieto. Para no saltar de una a otra, entra a contarse desde la cámara
   * con la diferencia de velocidades por debajo de `pegadaEntra` de la suya, y sale por encima de `pegadaSale`.
   */
  const pegadas = {};
  function desdeDonde(c, ancla) {
    if (!ancla) return null;
    const g = pegadas[c.id], k = 0.25;
    if (!g) { pegadas[c.id] = { x: c.x, y: c.y, ax: ancla.x, ay: ancla.y, vx: 0, vy: 0, cx: 0, cy: 0, conCamara: false, reloj }; return null; }
    // (Si estuvo un rato sin dibujarse —fuera de la pantalla—, empieza de cero: si no, tomaba el salto por velocidad.)
    if (reloj - g.reloj > 0.2) { Object.assign(g, { x: c.x, y: c.y, ax: ancla.x, ay: ancla.y, vx: 0, vy: 0, cx: 0, cy: 0, conCamara: false, reloj }); return null; }
    if (g.reloj !== reloj) {
      // (Las velocidades, suavizadas: el paso de James cambia un poco cada cuadro.)
      g.vx += (c.x - g.x - g.vx) * k; g.vy += (c.y - g.y - g.vy) * k;
      g.cx += (ancla.x - g.ax - g.cx) * k; g.cy += (ancla.y - g.ay - g.cy) * k;
      Object.assign(g, { x: c.x, y: c.y, ax: ancla.x, ay: ancla.y, reloj });
      const suya = Math.hypot(g.vx, g.vy / PROF), dif = Math.hypot(g.vx - g.cx, (g.vy - g.cy) / PROF), cam = Math.hypot(g.cx, g.cy / PROF);
      const q = suya > 1e-4 ? dif / suya : cam > 1e-4 ? 99 : (g.conCamara ? 0 : 99);
      if (g.conCamara && q > C.pegadaSale) g.conCamara = false;
      else if (!g.conCamara && q < C.pegadaEntra) g.conCamara = true;
    }
    return g.conCamara ? ancla : null;
  }

  /**
   * `ancla`: la cámara sin pegar a la grilla (la que sigue a James); `cam`, la pegada. 🔁 Pegada a la grilla de la
   * pantalla nada más, la carreta daba saltitos de un punto para adelante y para atrás cuando ibas a su lado *(Santi:
   * "al moverse da unos pequeños saltitos")*: ella y la cámara se pegaban a la grilla en cuadros distintos. Ahora se
   * cuenta desde la cámara sin pegar: si van juntos, queda quieta en la pantalla; si James está quieto, avanza de a un
   * punto, parejo.
   */
  function dibujar(r, c, noche, ancla, cam, conductor) {
    ancla = desdeDonde(c, ancla);
    const T = r.ctx.getTransform();
    const chico = Math.abs(T.a) * PT < 2, pt = chico ? 2 * PT : PT;
    const fino = !!C.bordeFino && CONFIG.estilo.bordeGente < CONFIG.estilo.punto;
    const D = dibujoCarreta({ tipo: c.dibujo || c.tipo, tam: chico ? 'chico' : 'grande', vista: c.vista, pose: 'rueda', cuadro: c.cuadro, fino }, noche);
    const pegar = (v, esc, corre) => (T.b || T.c ? v : (Math.round((esc * v + corre) / CONFIG.estilo.punto) * CONFIG.estilo.punto - corre) / esc);
    const P = CONFIG.estilo.punto / Math.abs(T.a || 1);
    const desde = (v, a, k) => (ancla && !(T.b || T.c) ? k + Math.round((v - a) / P) * P : v);
    // 🔁 En diagonal, corrida por el camino hasta la raya de la grilla más cercana del lado en que más avanza: así el
    // paso de arriba o abajo cae siempre en el mismo cuadro que uno de costado (o al revés). Antes cada uno daba su paso
    // cuando le tocaba, y cada tanto bajaba un punto sola, sin avanzar *(Santi: "todavía se ven los tirones, puede ser
    // porque va en un camino un poco diagonal?")*.
    let cx = c.x, cy = c.y;
    if (!(T.b || T.c)) {
      const vx = c.dx, vy = c.dy * PROF, deCostado = Math.abs(vx) >= Math.abs(vy);
      const v = deCostado ? vx : vy, a = deCostado ? (ancla ? ancla.x : 0) : (ancla ? ancla.y : 0);
      if (Math.abs(v) > 1e-6) {
        const u = ((deCostado ? cx : cy) - a) / P, corre = ((Math.round(u) - u) * P) / v;
        cx += vx * corre; cy += vy * corre;
      }
    }
    const ox = pegar(desde(cx - D.x * pt, ancla && ancla.x, cam && cam.x), T.a, T.e), oy = pegar(desde(cy - D.y * pt, ancla && ancla.y, cam && cam.y), T.d, T.f);
    const deFrente = c.vista === 'norte' || c.vista === 'sur', enDiagonal = c.vista.length > 5;
    r.ctx.save();
    r.ctx.globalAlpha = 0.25; r.ctx.fillStyle = '#000';
    // 🔁 (La sombra, en el mismo punto pegado que el dibujo: suelta, se deslizaba parejo mientras la carreta avanzaba de a
    // un punto, y las ruedas parecían saltar sobre ella. *Santi: "todavía se ve esos saltitos"*.)
    r.ctx.beginPath(); r.ctx.ellipse(ox + D.x * pt, oy + D.y * pt, deFrente ? 16 : enDiagonal ? 28 : 34, deFrente ? 22 : enDiagonal ? 15 : 9, 0, 0, Math.PI * 2); r.ctx.fill();
    r.ctx.restore();
    // 🧍 (El conductor, con el mismo punto pegado que la carreta: se lo llama antes y después de dibujarla, y él elige.)
    const gx = ox + D.x * pt, gy = oy + D.y * pt;
    if (conductor) conductor(r, c, gx, gy, true);
    r.ctx.drawImage(D.lienzo, ox, oy, D.lienzo.width * pt, D.lienzo.height * pt);
    if (fino) estiloNuevo.marcarGente(r.ctx, D.lienzo, ox, oy, D.lienzo.width * pt, D.lienzo.height * pt);
    if (conductor) conductor(r, c, gx, gy, false);
  }

  /**
   * 🌫️ El polvo: cada `cada` segundos de andar, una bocanada donde estaban las ruedas, que sube, crece y se deshace.
   * Como la carreta está donde dice la hora, la bocanada de hace `a` segundos nace donde estaba hace `a` segundos.
   * Sólo de día y mientras anda (parada no levanta nada).
   */
  function copos(cam, vista) {
    const P = C.polvo, out = [];
    for (const c of activas) {
      if (!c.anda) continue;
      const alto = P.sube * P.vida + P.radio[1];
      if (c.x < cam.x - 120 || c.x > cam.x + vista.w + 120 || c.y < cam.y - 40 || c.y - alto > cam.y + vista.h + 40) continue;
      const R = rastros[c.id] || [];
      for (let n = Math.floor((reloj - P.vida) / P.cada); n <= Math.floor(reloj / P.cada); n++) {
        const a = reloj - n * P.cada;
        if (a < 0 || a > P.vida) continue;
        // 🔁 (Donde estuvo de verdad hace `a` segundos —su rastro—: la que escapa campo traviesa o rodea no está donde
        // dice la hora, y el polvo le salía del camino. Recién llegada a la pantalla, sin rastro tan viejo, de la hora.)
        let p = null;
        if (R.length && R[0].t <= reloj - a) { for (let i = R.length - 1; i >= 0; i--) if (R[i].t <= reloj - a) { p = R[i]; break; } }
        else if (!c.suelta) p = posicion(c.v, ahoraLuz - a);
        if (!p) continue;
        const u = a / P.vida;
        // (de las ruedas de atrás: un poco detrás de la carreta)
        const x = p.x - p.dx * P.atras * POR_METRO + P.viento * a + Math.sin(n * 2.3 + a) * (1 + 3 * u);
        const y = p.y - p.dy * P.atras * POR_METRO * PROF;
        out.push({ x, y: y - P.sube * a * (1 - 0.3 * u), r: P.radio[0] + (P.radio[1] - P.radio[0]) * Math.pow(u, 0.6),
          s: P.espeso * Math.pow(1 - u, 0.9) * Math.min(1, a / 0.4), chato: 0.7 });
      }
    }
    return out;
  }

  /**
   * 🔫 LA TELA PARA LAS BALAS *(Santi, 2026-11-26: "hay que poner que los disparos se detengan en la lona")*: el
   * primer punto del camino de la bala (de x0, y0 a x1, y1) que cae sobre la lona de una carreta (o sobre las bolsas de
   * la de carga, que son de la misma tela), mirando el dibujo punto por punto, como se ve. { c, x, y, que } o null.
   * `aPie`: además la madera, el hierro y la carga *(Santi, 2026-11-26: "al ir a caballo se supone que disparás más
   * arriba que la madera... si vas a caballo con la madera no pase nada pero si vas a pie sí")*. `que`: 'tela' o
   * 'madera'. `excepto`: el id de una carreta que no cuenta (la del escopetero que tira sentado en ella).
   */
  const TELA = new Set(['c', 'k', 'q', 'w', 'a']);
  // (la madera de la caja, el tren y las ruedas, los barriles, los cajones, la pintura y el logo, el hierro, el mineral)
  const MADERA = new Set(['l', 'b', 's', 'e', 'f', 'r', 't', 'd', 'n', 'u', 'v', 'p', 'x', 'y', 'z', 'g', 'i', 'j', 'm']);
  function tela(x0, y0, x1, y1, aPie = false, excepto = null) {
    const largo = Math.hypot(x1 - x0, y1 - y0), pasos = Math.max(1, Math.ceil(largo / (PT / 2)));
    const cerca = activas.filter((c) => Math.abs(c.x - (x0 + x1) / 2) < largo / 2 + 90 && Math.abs(c.y - (y0 + y1) / 2) < largo / 2 + 90);
    if (!cerca.length) return null;
    const mapas = cerca.filter((c) => c.id !== excepto).map((c) => [c, mapaCarreta('grande', c.vista, 'rueda', c.cuadro, c.dibujo || c.tipo)]);
    for (let i = 1; i <= pasos; i++) {
      const x = x0 + ((x1 - x0) * i) / pasos, y = y0 + ((y1 - y0) * i) / pasos;
      for (const [c, D] of mapas) {
        const fila = D.m[Math.floor((y - c.y) / PT + D.y)], ch = fila && fila[Math.floor((x - c.x) / PT + D.x)];
        if (ch && TELA.has(ch)) return { c, x, y, que: 'tela' };
        // (La diligencia, siempre: la caja llega a 2,45 m y el arma de uno montado va a 2,1. *Santi: "¿no es lo
        // suficientemente alta la diligencia?"*)
        if ((aPie || c.tipo === 'diligencia') && ch && MADERA.has(ch)) return { c, x, y, que: 'madera' };
      }
    }
    return null;
  }

  return {
    actualizar, choca, delante, estados, tela, soltar, motivar, desvio, rapidaDe,
    /**
     * Si el viaje `id` se salió del camino escapando; y si está trabado: sin poder seguir hace más de `huida.atasca`, o
     * sin acercarse al pueblo aunque busque otra ruta (`perdida`).
     */
    suelta: (id) => !!sueltas()[id],
    atascada: (id) => !!sueltas()[id] && (sueltas()[id].trabada > C.huida.atasca || !!sueltas()[id].perdida),
    /** Lo que pone la escena y el asalto (ver arriba). */
    set terreno(f) { terreno = f; }, set alLlegar(f) { alLlegar = f; },
    /** 🧍 Dónde va sentado el conductor: el suelo debajo del pescante (x, y) y a cuántos metros del suelo (`alto`). */
    // (`lado`: metros a la derecha del medio del pescante —negativo, a la izquierda—: con escopetero, van uno a cada lado.)
    asiento(c, lado = 0) {
      const K = { ...C.asalto.conductor, ...((C.asalto.conductor.de || {})[c.tipo] || {}) }, a = K.adelante * POR_METRO, l = lado * POR_METRO;
      return { x: c.x + c.dx * a - c.dy * l, y: (c.y + c.dy * a * PROF) + c.dx * l * PROF, alto: K.alto };
    },
    /** 🐎 Que apure a los caballos (la soltaste después de asaltarla). */
    asustar(id) { sustos[id] = C.susto.dura; },
    /** Las que están en la pantalla, para ordenarlas con lo demás: [{ y, draw }]. */
    cosas(r, cam, vista, noche, ancla, conductor) {
      return activas.filter((c) => c.x > cam.x - 80 && c.x < cam.x + vista.w + 80 && c.y > cam.y - 20 && c.y < cam.y + vista.h + 90)
        .map((c) => ({ y: c.y, draw: () => dibujar(r, c, noche, ancla, cam, conductor) }));
    },
    /** El polvo en el aire (después de todo lo de la tierra). */
    dibujarAire(ctx, cam, vista, celda) { const cs = copos(cam, vista); if (cs.length) dibujarNubeDeAire(ctx, cs, false, celda); },
    get activas() { return activas; }, caminos, viajes, luz, POR_METRO,
    /** (Para el banco de pruebas: si se cuenta desde la cámara.) */
    pegadaConCamara: (id) => !!(pegadas[id] && pegadas[id].conCamara),
  };
}
