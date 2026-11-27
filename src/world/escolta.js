/**
 * 🐎🔫 LA ESCOLTA A CABALLO (etapa 4 del campo con vida, paso 2B, parte 2; los números en CAMPO.carretas.guardias.escolta,
 * data/campo.js) *(Santi, 2026-11-26: "voy con tus recomendaciones": la carreta de la mina, con dos jinetes de escolta)*.
 *
 * CÓMO ANDAN Y CÓMO PELEAN:
 *  1. **Escoltan**: van detrás de la carreta, uno de cada lado (`atras`, `lado`), al paso de ella.
 *  2. **Se dan cuenta** como el escopetero (le apuntas a la carreta, te acercas con el arma afuera, oyen un tiro, la
 *     frenas o matas a alguien de ella); y si se dan cuenta ellos, también él (y al revés).
 *  3. **Pelean montados**: galopan hasta quedar a entre `cerca` y `lejos` metros de ti y te rodean, repartidos (`orbita`,
 *     `separa`), esquivando piedras, matas y carretas (`esquiva`), con el
 *     Winchester encarado; tiran cuando llegan a apuntar. Moviéndose, la bala se les abre más (`punteria.andando`).
 *  4. **Te sueltan** si te alejas más de `sueltan` metros de la carreta: vuelven a escoltarla. Su caballo es un poco más
 *     lento que el Criollo (`velocidad`): a galope tendido, con un caballo bueno, te les escapas.
 *  5. Mueren con dos tiros, como los guardias del tren. El caballo queda ensillado donde cayó el jinete.
 *
 * SUS BALAS: las de los escopeteros (world/escopeteros.js, `soltar`): la lona las para; la madera no, que tiran desde
 * arriba del caballo *(Santi: "si vas a caballo con la madera no pase nada")*.
 *
 * ⚠️ DIBUJO: el jinete de la ley de la huida (un guardia del tren montado, con el rifle encarado: E4) sobre el caballo del
 * campo. No hay gente nueva *(Santi: "no vamos a dibujar cosas nuevas de personas")*.
 */
import { dibujarAnimal, dibujarJinete, dibujarSilla } from '../entities/caballo.js';
import { tendidoNuevo } from '../entities/figura.js';
import { aspectoDe } from '../entities/estiloNuevo/gente.js';
import { ARMAS_GUARDIA } from '../data/armasGuardia.js';
import { CONFIG } from '../data/config.js';
import { columnaMontado, tocaCuerpo } from './cuerpos.js';

/**
 * `carretas`, `C` (CAMPO.carretas), `PROF`, `audio`, `james()` y `herirJames` (ver world/escopeteros.js),
 * `escopeteros` (para avisarse entre ellos y para tirar sus balas), `galope` (el del Criollo), `libre(x, y)`: si un
 * caballo puede estar ahí (sin piedra, mata, carreta ni barranca), `hoy()`: el día (los muertos quedan hasta el otro).
 */
export function crearEscolta({ carretas, C, PROF, audio, james, escopeteros, galope, libre = () => true, hoy = () => 0 }) {
  const G = C.guardias, K = G.escolta, M = carretas.POR_METRO;
  /** Los jinetes vivos, por carreta: { [id]: [jinete, …] }. Los muertos, en el estado de la carreta (`escolta`). */
  const jinetes = {};

  const estados = () => carretas.estados();
  const estadoDe = (id) => estados()[id] || (estados()[id] = {});
  // (🔁 Por dibujo antes que por tipo: la de la mina yendo, con la paga, `minaIda`, lleva más que la de vuelta, con
  // mineral. Revisión: de vuelta no valía nunca la pena.)
  const cuantos = (c) => (G.activa && (K.en[c.dibujo] ?? K.en[c.tipo])) || 0;
  const muertoEn = (id, i) => { const E = estados()[id]; return !!(E && E.escolta && E.escolta[i]); };

  /** Dónde va el jinete `i` escoltando: detrás de la carreta, a un lado (el 0 a la izquierda, el 1 a la derecha). */
  function puesto(c, i) {
    const l = (i % 2 ? 1 : -1) * K.lado * M, a = -K.atras * M * (1 + Math.floor(i / 2) * 0.8);
    return { x: c.x + c.dx * a - c.dy * l, y: c.y + (c.dy * a + c.dx * l) * PROF };
  }

  /** Los jinetes de la carreta (se arman la primera vez que se la ve, en su puesto). */
  function de(c) {
    let L = jinetes[c.id];
    if (!L) {
      L = jinetes[c.id] = [];
      for (let i = 0; i < cuantos(c); i++) {
        if (muertoEn(c.id, i)) continue;
        const p = puesto(c, i), E = estados()[c.id];
        // (🔁 Herido, sigue herido: antes, al volver a armarse la lista, volvía con la vida llena.)
        const vida = E && E.heridos && E.heridos[i] != null ? E.heridos[i] : G.vida;
        L.push({ i, cid: c.id, x: p.x, y: p.y, rumbo: Math.atan2(c.dy, c.dx), vel: 0, gallop: 0, pose: 0, vida, alerta: false, reaccion: 0,
          empuna: 0, apunta: 0, balas: ARMAS_GUARDIA[K.arma].cargador, recarga: 0, giro: i % 2 ? 1 : -1, mira: 0 });
      }
    }
    return L;
  }

  /** Que se den cuenta los de la carreta `id` (y el escopetero de ella). */
  function alertar(id) {
    const L = jinetes[id];
    if (L) for (const j of L) { j.calma = 0; if (!j.alerta) { j.alerta = true; j.reaccion = G.reaccion; } }
    const c = carretas.activas.find((o) => o.id === id);
    if (c) escopeteros.alertar(c);
  }

  /**
   * La silla del jinete en el mundo: la del último dibujo (`j.asiento`, lo que la corre el caballo según la vista), o
   * `SILLA` unidades arriba de sus pies si todavía no se dibujó. 🔁 El pecho era 2,1 m sobre el suelo: arriba del sombrero.
   */
  const SILLA = -10.5;
  const silla = (j) => ({ x: j.x + (j.asiento ? j.asiento.dx : 0), y: j.y + (j.asiento ? j.asiento.dy : SILLA) });
  const pecho = (j) => { const s = silla(j); return { x: s.x, y: s.y - G.james.montado * M }; };

  /**
   * Mover al jinete hacia (tx, ty) con velocidad hasta `vmax` (u/s), girando de a poco como el caballo tuyo.
   * 🪨 Esquiva: mira `esquiva` metros adelante por donde quiere ir; si hay algo, prueba corrido a un costado y al otro,
   * cada vez más abierto, hasta encontrar paso. Si igual se topa, frena *(Santi: "atraviesan las piedras")*.
   */
  function ir(j, tx, ty, vmax, dt) {
    const vx = tx - j.x, vy = (ty - j.y) / PROF, l = Math.hypot(vx, vy);
    const quiere = l < 2 ? 0 : Math.min(vmax, l * 2);
    j.vel += (quiere - j.vel) * Math.min(1, dt * 3);
    if (l > 2) {
      let objetivo = Math.atan2(vy, vx);
      const lejos = Math.min(K.esquiva * M, l), hay = (a) => !libre(j.x + Math.cos(a) * lejos, j.y + Math.sin(a) * lejos * PROF) || !libre(j.x + Math.cos(a) * lejos * 0.5, j.y + Math.sin(a) * lejos * 0.5 * PROF);
      if (hay(objetivo)) for (const d of [0.4, 0.8, 1.2, 1.6, 2.1, 2.6]) {
        if (!hay(objetivo + d * j.giro)) { objetivo += d * j.giro; break; }
        if (!hay(objetivo - d * j.giro)) { objetivo -= d * j.giro; break; }
      }
      const dif = Math.atan2(Math.sin(objetivo - j.rumbo), Math.cos(objetivo - j.rumbo)), paso = K.giro * dt;
      j.rumbo += Math.abs(dif) < paso ? dif : Math.sign(dif) * paso;
    }
    const nx = j.x + Math.cos(j.rumbo) * j.vel * dt, ny = j.y + Math.sin(j.rumbo) * j.vel * PROF * dt;
    if (libre(nx, ny)) { j.x = nx; j.y = ny; } else j.vel *= 0.3;
    j.gallop += dt * (j.vel / galope);
    const crudo = Math.sin(j.rumbo) * 4;
    if (Math.abs(crudo - j.pose) > 0.8) j.pose = Math.max(-4, Math.min(4, Math.round(crudo)));
  }

  /** Cada cuadro. `apuntando`, `mira`, `empuna`, `parada(c)`: como en los escopeteros. */
  function actualizar(dt, { apuntando, mira, empuna, parada }) {
    if (!G.activa) return;
    const yo = james(), A = ARMAS_GUARDIA[K.arma], vmax = K.velocidad * galope;
    const vistas = new Set();
    for (const c of carretas.activas) {
      if (!cuantos(c)) continue;
      vistas.add(c.id);
      const L = de(c);
      const d = Math.hypot(c.x - yo.x, (c.y - yo.y) / PROF) / M;
      // (Si el escopetero se dio cuenta, ellos también.)
      const esc = escopeteros.gente[c.id];
      // (Sólo si estás cerca: el escopetero queda alerta para siempre, y si no te volvían a correr apenas te soltaban.)
      if (d < K.sueltan && L.some((j) => !j.alerta) && (esc && esc.alerta || parada(c) || (d < G.cerca && empuna > 0.5)
        || (apuntando && mira && d < G.ve && Math.hypot(mira.x - c.x, (mira.y - c.y) / PROF) < G.apuntarA * M))) alertar(c.id);
      for (const j of L) {
        const lejos = Math.hypot(j.x - c.x, (j.y - c.y) / PROF) / M;
        // (Te sueltan: te fuiste lejos de la carreta. Vuelven a su puesto, todavía con el rifle a mano.)
        if (j.alerta && d > K.sueltan) { j.alerta = false; j.empuna = 0; j.ang = null; }
        // (🔁 Y se calman con el escopetero: él calmado, la carreta andando y tú a más de `defensa.suelta`. Antes, un tiro
        // de caza los echaba encima tuyo cada vez que pasabas a menos de 120 m.)
        // (Sin escopetero —muerto—, con su propia cuenta: `calma` segundos desde que algo los alertó.)
        if (j.alerta) j.calma = (j.calma || 0) + dt;
        if (j.alerta && (!esc || !esc.alerta) && j.calma > G.defensa.calma && !parada(c) && d > G.defensa.suelta) { j.alerta = false; j.empuna = 0; j.ang = null; }
        if (!j.alerta || j.reaccion > 0) {
          if (j.reaccion > 0) j.reaccion -= dt;
          const p = puesto(c, j.i);
          // (Al paso de la carreta; si quedó lejos, galopa hasta su puesto.)
          const antes = { x: j.x, y: j.y };
          ir(j, p.x, p.y, lejos > 8 ? vmax : vmax * 0.5, dt);
          // 🆕 (Trabado contra una barranca —esquiva mirando sólo unos metros adelante— o muy lejos de su carreta, y tú
          // sin verlo: vuelve a su puesto. Apareció con la diligencia que escapa campo traviesa: el jinete quedaba
          // atrás para siempre.)
          j.trabado = lejos > 8 && Math.hypot(j.x - antes.x, (j.y - antes.y) / PROF) < 0.2 * M * dt ? (j.trabado || 0) + dt : 0;
          const teVe = Math.hypot(j.x - yo.x, (j.y - yo.y) / PROF) / M < K.ocultoA || Math.hypot(p.x - yo.x, (p.y - yo.y) / PROF) / M < K.ocultoA;
          if (!teVe && (j.trabado > 2 || lejos > K.lejosDeSuCarreta) && libre(p.x, p.y)) { j.x = p.x; j.y = p.y; j.vel = 0; j.trabado = 0; j.rumbo = Math.atan2(c.dy, c.dx); }
          j.empuna = Math.max(0, j.empuna - dt * 2);
          continue;
        }
        pelear(j, yo, A, vmax, dt);
      }
    }
    // (Los de una carreta que ya no está —llegó, o quedó lejos—: si no están peleando, se van con ella.)
    for (const id of Object.keys(jinetes)) {
      if (vistas.has(id)) continue;
      jinetes[id] = jinetes[id].filter((j) => j.alerta);
      if (!jinetes[id].length) { delete jinetes[id]; continue; }
      for (const j of jinetes[id]) {
        if (Math.hypot(j.x - yo.x, (j.y - yo.y) / PROF) / M > K.sueltan) { j.alerta = false; j.ang = null; }
        else pelear(j, yo, ARMAS_GUARDIA[K.arma], vmax, dt);
      }
    }
  }

  /**
   * Pelear: quedar a entre `cerca` y `lejos` metros de ti, rodeándote, y tirar. Cada uno tiene su ángulo alrededor
   * tuyo (`ang`), que gira despacio (`orbita`, todos para el mismo lado) y se aparta del de los otros si quedan a menos
   * de `separa` radianes *(Santi: "terminan del mismo lado, casi encimados")*.
   */
  function pelear(j, yo, A, vmax, dt) {
    const d = Math.hypot(j.x - yo.x, (j.y - yo.y) / PROF);
    if (j.ang == null) j.ang = Math.atan2((j.y - yo.y) / PROF, j.x - yo.x);
    j.ang += K.orbita * dt;
    for (const L of Object.values(jinetes)) for (const o of L) {
      if (o === j || o.ang == null || !o.alerta) continue;
      const da = Math.atan2(Math.sin(j.ang - o.ang), Math.cos(j.ang - o.ang));
      if (Math.abs(da) < K.separa) j.ang += (da >= 0 ? 1 : -1) * K.aparta * dt;
    }
    const quiere = Math.max(K.cerca, Math.min(K.lejos, d / M)) * M;
    ir(j, yo.x + Math.cos(j.ang) * quiere, yo.y + Math.sin(j.ang) * quiere * PROF, vmax, dt);
    // El rifle: lo encara si estás a tiro.
    // (🔁 La distancia de verdad, desachatada, como la tuya.)
    const p = pecho(j), dist = Math.hypot(yo.x - p.x, (yo.pecho - p.y) / PROF);
    j.mira = Math.atan2(yo.pecho - p.y, yo.x - p.x);
    const aTiro = dist < A.alcance * G.alcance;
    j.empuna = Math.max(0, Math.min(1, j.empuna + (aTiro ? dt * 2 : -dt * 2)));
    if (j.recarga > 0) { j.recarga -= dt; if (j.recarga <= 0) j.balas = A.cargador; return; }
    if (!aTiro || j.empuna < 1) { j.apunta = 0; return; }
    j.apunta += dt;
    if (j.apunta < A.apuntar * G.apuntar) return;
    j.apunta = -A.cadencia * G.cadencia;
    j.balas -= 1;
    if (j.balas <= 0) { j.recarga = A.recarga; audio.play('recargaGuardia'); }
    const abre = j.vel > galope * 0.3 ? K.punteria.andando : K.punteria.quieto;
    escopeteros.soltar(p, j.mira, K.arma, { aPie: false, de: null, punteria: abre });
  }

  /** 💥 Una bala tuya: si le pega a un jinete, 'escopetero' (herido) o 'muerto', con la carreta; si no, null. */
  /** 🎯 Si tu bala (este tramo) toca a un jinete: { id, j, u } (el primero), o null (world/cuerpos.js). */
  function toca(x0, y0, x1, y1) {
    if (!G.activa) return null;
    let mejor = null;
    for (const id of Object.keys(jinetes)) for (const j of jinetes[id]) {
      const s = silla(j), u = tocaCuerpo(x0, y0, x1, y1, columnaMontado(s.x, s.y, G.columna, M));
      if (u !== null && (!mejor || u < mejor.u)) mejor = { id, j, u };
    }
    return mejor;
  }

  /** Le pega tu bala al jinete `j` de la carreta `id`: { que: 'escopetero' | 'muerto', id }. */
  function herir(id, j, fuerza = 1) {
    alertar(id);
    // (🔁 Herido, reacciona ya: antes, si lo herías sin que se hubiera dado cuenta, tardaba la reacción entera.)
    j.reaccion = Math.min(j.reaccion, 0.2);
    j.vida -= G.danio.aGuardia * fuerza;
    const E = estadoDe(id);
    if (j.vida > 0) { if (!E.heridos) E.heridos = {}; E.heridos[j.i] = j.vida; return { que: 'escopetero', id }; }
    if (!E.escolta) E.escolta = {};
    E.escolta[j.i] = { x: j.x, y: j.y, espejo: Math.cos(j.rumbo) < 0, aspecto: aspectoDe(j, 'guardia'), rumbo: j.rumbo, pose: j.pose, dia: hoy() };
    jinetes[id] = jinetes[id].filter((o) => o !== j);
    return { que: 'muerto', id };
  }

  /** 💥 Un tiro tuyo en (x, y): lo oyen los de las carretas a menos de `oye`. */
  function oirTiro(x, y) {
    for (const c of carretas.activas) if (cuantos(c) && Math.hypot(c.x - x, (c.y - y) / PROF) < G.oye * M) { de(c); alertar(c.id); }
  }

  /** Si la carreta tiene escolta viva (son testigos). */
  const vivos = (c) => !!c && (jinetes[c.id] || []).length > 0;

  /** 🐎 Lo que se dibuja, para ordenarlo con lo demás: [{ y, draw }]. */
  function cosas(r, noche, enVista) {
    const out = [];
    const T0 = CONFIG.ambiente.zancadaCada;
    for (const id of Object.keys(jinetes)) {
      for (const j of jinetes[id]) {
        if (!enVista(j.x, j.y)) continue;
        out.push({ y: j.y + 7, draw: () => {
          const quieto = j.vel < 8, zancada = quieto ? null : { t: ((j.gallop % T0) + T0) % T0, T: T0 };
          const trote = zancada ? Math.round(Math.cos((zancada.t / T0 - 0.15) * Math.PI * 2) * 1.2) : 0;
          const alOeste = Math.cos(j.rumbo) < 0;
          sombra(r, j.x, j.y);
          r.ctx.save();
          if (alOeste) { r.ctx.translate(Math.round(j.x) * 2, 0); r.ctx.scale(-1, 1); }
          const montura = dibujarAnimal(r, j.x, j.y, zancada, trote, 1, j.pose, null, noche);
          // (Hacia dónde apunta, en el dibujo: dado vuelta si el caballo va al oeste.)
          let ang = j.mira;
          if (alOeste) ang = Math.atan2(Math.sin(Math.PI - ang), Math.cos(Math.PI - ang));
          dibujarJinete(r, montura.asiento.x, montura.asiento.y, j.pose, 2, { detalles: 'ley', ent: j, empuna: j.empuna > 0 ? j.empuna : undefined, ang }, montura);
          // (Dónde quedó la silla: para pegarle donde se ve. Dado vuelta, del otro lado.)
          j.asiento = { dx: (alOeste ? -1 : 1) * (montura.asiento.x - j.x), dy: montura.asiento.y - j.y };
          montura.adelante();
          r.ctx.restore();
        } });
      }
    }
    // Los muertos, tirados; y su caballo, ensillado y quieto al lado.
    for (const E of Object.values(estados())) {
      if (!E || !E.escolta) continue;
      for (const m of Object.values(E.escolta)) {
        if (!enVista(m.x, m.y) || (m.dia ?? hoy()) < hoy() - 1) continue;
        out.push({ y: m.y + 4, draw: () => tendidoNuevo(r, m.x, m.y + 4, { tipo: 'guardia', modo: 'muerto', sangre: true, espejo: m.espejo, aspecto: m.aspecto }) });
        const hx = m.x + (m.espejo ? 1 : -1) * 2.2 * M, hy = m.y - 0.6 * M;
        out.push({ y: hy + 7, draw: () => {
          sombra(r, hx, hy);
          r.ctx.save();
          if (m.espejo) { r.ctx.translate(Math.round(hx) * 2, 0); r.ctx.scale(-1, 1); }
          dibujarSilla(r, dibujarAnimal(r, hx, hy, null, 0, 1, m.pose, null, noche));
          r.ctx.restore();
        } });
      }
    }
    return out;
  }

  function sombra(r, x, y) {
    r.ctx.save();
    r.ctx.globalAlpha = 0.25; r.ctx.fillStyle = '#000';
    r.ctx.beginPath(); r.ctx.ellipse(x, y + 7, 12, 2.5, 0, 0, Math.PI * 2); r.ctx.fill();
    r.ctx.restore();
  }

  return {
    actualizar, alertar, oirTiro, toca, herir, vivos, cosas,
    /** Hasta cuántos metros llega su Winchester. */
    alcance: () => ARMAS_GUARDIA[K.arma].alcance * G.alcance / M,
    reiniciar() { for (const k of Object.keys(jinetes)) delete jinetes[k]; },
    /** Para probar desde la consola. */
    get jinetes() { return jinetes; },
  };
}
