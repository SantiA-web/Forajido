/**
 * 🔫 LOS ESCOPETEROS DE LAS CARRETAS (etapa 4 del campo con vida, paso 2B, parte 1; los números en
 * CAMPO.carretas.guardias, data/campo.js) *(Santi, 2026-11-26: "voy con tus recomendaciones"; "propongo que el
 * escopetero pueda bajarse y ser un guardia a pie"; "en las carretas de carga sí quiero un escopetero al lado")*.
 *
 * Va sentado al lado del conductor, con el arma cruzada. CÓMO PELEA:
 *  1. **Se da cuenta** si le apuntas a la carreta desde menos de `ve` metros, si te acercas con el arma afuera a menos
 *     de `cerca`, si oye un tiro a menos de `oye`, o si frenas la carreta o matas al conductor. Tarda `reaccion` en
 *     reaccionar. El conductor, entonces, apura a los caballos.
 *  2. **Con la carreta andando**, te tira desde el asiento.
 *  3. **Con la carreta parada** (la frenaste, o mataste al conductor), **se baja** y pelea a pie: camina hasta el otro
 *     lado de la carreta, de espaldas a ti, y se cubre detrás. Agachado no lo ves ni le pegas; se asoma un rato para
 *     tirar (ahí sí). Si te mueves alrededor, cambia de lado.
 *  4. Muere con dos tiros (los de cualquier arma tuya: `danio.aGuardia` por bala, por el factor del arma), como los
 *     guardias del tren.
 *
 * SUS BALAS valen lo mismo que las tuyas *(memoria: "lo que choca o golpea vale igual para guardias y jugador")*: la
 * lona las para siempre; la madera, si el que tira está a pie y tú estás agachado detrás (si estás parado, se te ve
 * por encima y te apunta a ti). Cada perdigón de un escopetazo te pega aunque te acabe de pegar otro.
 *
 * ⚠️ DIBUJO: el guardia del tren (no hay gente nueva dibujada para el campo *(Santi: "no vamos a dibujar cosas nuevas
 * de personas")*).
 */
import { dibujarPersona, tendidoNuevo, dibujarAviso } from '../entities/figura.js';
import { aspectoDe } from '../entities/estiloNuevo/gente.js';
import { ARMAS_GUARDIA } from '../data/armasGuardia.js';
import { columnaDe, tocaCuerpo, enCuerpo } from './cuerpos.js';

/**
 * `carretas` (world/carretas.js), `C` (CAMPO.carretas), `PROF`, `audio`, `decir`, `T` (TC.carreta),
 * `james()`: { x, y (los pies, ya con lo alto del terreno), pecho (la y del pecho), agachado, aPie },
 * `herirJames(puntos, perdigon)`: le pega a James.
 */
export function crearEscopeteros({ carretas, C, PROF, audio, decir, T, james, herirJames, hoy = () => 0 }) {
  const G = C.guardias, M = carretas.POR_METRO;
  /** Lo de cada uno mientras se lo ve (no se guarda; muerto, sí: en el estado de la carreta, `esc`). */
  const gente = {};
  /** Las balas de los escopeteros. */
  let balas = [];
  let perdigonId = 0;

  const estados = () => carretas.estados();
  const estadoDe = (id) => estados()[id] || (estados()[id] = {});
  const buscar = (id) => carretas.activas.find((c) => c.id === id) || null;

  /** Si la carreta lleva escopetero (y está vivo). */
  function tiene(c) {
    if (!G.activa || !G.escopetero.en.includes(c.tipo)) return false;
    const E = estados()[c.id];
    return !(E && E.esc && E.esc.muerto);
  }
  /** Si la carreta llevaba escopetero (vivo o muerto): para correr al conductor a su lado del pescante. */
  const lleva = (c) => G.activa && G.escopetero.en.includes(c.tipo);

  /** Un número de 0 a 1 fijo para cada viaje (para sortear su arma). */
  const suerte = (id) => { let h = 7; for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 2654435761); return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };
  function de(c) {
    let e = gente[c.id];
    if (!e) {
      // 🔁 (Algunos llevan otra arma —`escopetero.otra`: [arma, de 0 a 1 cuántos]—: con escopeta todos, un Colt o
      // un Winchester de lejos les ganaba siempre sin riesgo.)
      const otra = (G.escopetero.otra || {})[c.tipo];
      const arma = otra && suerte(c.id) < otra[1] ? otra[0] : G.escopetero.arma[c.tipo] || 'escopeta';
      e = gente[c.id] = { id: c.id, arma, vida: G.vida, alerta: false, reaccion: 0, bajado: null, apunta: 0, balas: ARMAS_GUARDIA[arma].cargador, recarga: 0, ciclo: 0, oculto: false, fase: 0, mira: Math.PI / 2 };
    }
    return e;
  }

  /** El asiento del escopetero: a la derecha del conductor. */
  const asiento = (c) => carretas.asiento(c, G.escopetero.lado);

  /**
   * Dónde tiene el pecho (para pegarle y para tirar desde ahí). A pie y agachado, más bajo; y null sólo si de verdad lo
   * tapa la carreta: si lo ves agachado, le pegas *(Santi: "parece que la carreta absorbe mi bala")*.
   */
  function pecho(c, e) {
    if (e.bajado) {
      const alto = e.oculto ? G.cuerpo.agachado : G.cuerpo.pecho;
      if (e.oculto && !teVe(e.bajado.x, e.bajado.y, alto, james())) return null;
      return { x: e.bajado.x, y: e.bajado.y - alto * M };
    }
    const S = asiento(c);
    return { x: S.x, y: S.y - (S.alto + C.asalto.conductor.pecho) * M };
  }

  /** 🎯 Su columna (world/cuerpos.js): para pegarle y para saber si le apuntabas. null si lo tapa la carreta. */
  function cuerpo(c, e) {
    if (e.bajado) {
      if (e.oculto && !teVe(e.bajado.x, e.bajado.y, G.cuerpo.agachado, james())) return null;
      return columnaDe(e.bajado.x, e.bajado.y, e.oculto ? 'agachado' : 'pie', G.columna, M);
    }
    const S = asiento(c);
    return columnaDe(S.x, S.y - S.alto * M, 'sentado', G.columna, M);
  }

  /**
   * 🔁 A PIE, ALREDEDOR DE LA CARRETA *(Santi, 2026-11-26: "la atraviesan, no usan los espacios, es como si tuvieran
   * que estar pegados a ella")*. Antes caminaba derecho hasta el otro lado (cruzándola) y se asomaba ahí mismo, con la
   * carreta en el medio. Ahora anda por un anillo alrededor de ella (`anillo`: un rectángulo de puntas redondeadas, más
   * largo y ancho que la carreta: nunca la cruza), se cubre donde no lo ves y se asoma por una punta o un poco más
   * afuera (`afuera`), donde la carreta no está entre los dos.
   * `th`: el ángulo en el anillo (0, adelante; π/2, a su izquierda); `k`: 1 pegado, más grande más afuera.
   */
  function anillo(c, th, k = 1) {
    const co = Math.cos(th), si = Math.sin(th);
    const a = G.pie.largo * k * Math.sign(co) * Math.sqrt(Math.abs(co)), b = G.pie.ancho * k * Math.sign(si) * Math.sqrt(Math.abs(si));
    return { x: c.x + (c.dx * a - c.dy * b) * M, y: c.y + (c.dy * a + c.dx * b) * M * PROF };
  }
  /** Si te ve (y lo ves) desde el suelo en (x, y) con el pecho a `alto` metros: la carreta no está en el medio. */
  const teVe = (x, y, alto, yo) => !carretas.tela(x, y - alto * M, yo.x, yo.pecho, true, null);
  const ANGULOS = Array.from({ length: 24 }, (_, i) => i * Math.PI / 12);
  const dAng = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  /** Dónde cubrirse: el punto del anillo donde no lo ves ni de pie, el más cerca de donde está. */
  function cubierto(c, e, yo, evita = null) {
    let mejor = null;
    for (const th of ANGULOS) {
      const p = anillo(c, th);
      if (teVe(p.x, p.y, G.cuerpo.pecho, yo)) continue;
      if (evita !== null && dAng(th, evita) < G.pie.aparte) continue;   // (no encima del otro)
      if (!mejor || dAng(th, e.th) < dAng(mejor.th, e.th)) mejor = { th, k: 1 };
    }
    return mejor || { th: e.th, k: 1 };
  }
  /**
   * Dónde asomarse: el punto (pegado, o `afuera`) desde donde te ve de pie y le llega el arma (`alcance`, en u), el más
   * cerca de su reparo. Si no hay ninguno, null: se queda escondido esperando que te acerques (con la escopeta, de lejos
   * no le sirve asomarse).
   */
  function asomo(c, e, yo, alcance) {
    let mejor = null;
    for (const k of [1, G.pie.afuera]) for (const th of ANGULOS) {
      const p = anillo(c, th, k);
      if (Math.hypot(yo.x - p.x, (yo.pecho - (p.y - G.cuerpo.pecho * M)) / PROF) > alcance) continue;
      if (!teVe(p.x, p.y, G.cuerpo.pecho, yo)) continue;
      const dd = dAng(th, e.th) + (k > 1 ? 0.2 : 0);
      if (!mejor || dd < mejor.dd) mejor = { th, k, dd };
    }
    return mejor;
  }
  /** Un paso por el anillo hacia `e.meta`: true si llegó. */
  function andar(c, e, dt) {
    const w = G.pie.velocidad / (((G.pie.largo + G.pie.ancho) / 2) * e.k) * dt;
    const dif = Math.atan2(Math.sin(e.meta.th - e.th), Math.cos(e.meta.th - e.th));
    e.th += Math.abs(dif) <= w ? dif : Math.sign(dif) * w;
    const dk = e.meta.k - e.k, pk = G.pie.velocidad / G.pie.largo * dt;
    e.k += Math.abs(dk) <= pk ? dk : Math.sign(dk) * pk;
    const p = anillo(c, e.th, e.k), mx = p.x - e.bajado.x, my = (p.y - e.bajado.y) / PROF, mov = Math.hypot(mx, my);
    if (mov > 0.01) { e.mira = Math.atan2(my, mx); e.fase += mov; }
    e.bajado = p;
    return Math.abs(dif) <= w && Math.abs(dk) <= pk;
  }
  /**
   * 🧍 El conductor que se cubre mientras se defienden (world/asaltoCarreta.js): baja por su lado del pescante y anda
   * por el mismo anillo hasta donde no lo ves, lejos del escopetero; si lo ves, se va a otro lado. Nunca se asoma.
   * `p`: { bajado, th, k, meta, mira, fase, camina, t }.
   */
  function cubrir(c, p, dt) {
    const yo = james(), e = gente[c.id], otro = e && e.bajado ? e.th : null;
    if (!p.bajado) {
      p.th = thAsiento(-1); p.k = 1; p.fase = 0; p.t = 0;
      p.bajado = anillo(c, p.th); p.meta = cubierto(c, p, yo, otro);
    }
    p.t += dt;
    const choca = otro !== null && dAng(p.meta.th, otro) < G.pie.aparte;
    if (!p.camina && p.t > 0.5 && (choca || teVe(p.bajado.x, p.bajado.y, G.cuerpo.agachado, yo))) { p.meta = cubierto(c, p, yo, otro); p.t = 0; }
    p.camina = !andar(c, p, dt);
    if (!p.camina) p.mira = Math.atan2((yo.y - p.bajado.y) / PROF, yo.x - p.bajado.x);
  }
  /** El punto del anillo al pie de su asiento (`lado` 1: el del escopetero; -1: el del conductor). */
  const thAsiento = (lado) => Math.atan2(lado * G.escopetero.lado / G.pie.ancho, C.asalto.conductor.adelante / G.pie.largo);
  /**
   * 🔙 Volver a subirse caminando, antes de que la carreta siga *(Santi: "fijate lo que no probaste o no quedó": se
   * subían de golpe)*. `si` false: se queda (otra amenaza). Devuelve true cuando ya está sentado (o nunca se bajó).
   */
  function subir(c, si = true) {
    const e = gente[c.id];
    // (🔁 Si ya se había subido y lo amenazas de nuevo, se vuelve a bajar: antes quedaba sentado toda esa defensa.)
    if (!e || !e.bajado) { if (!si && e) e.subio = false; return true; }
    if (!si) { if (e.vuelve) { e.vuelve = false; e.plan = 'cubrirse'; e.meta = cubierto(c, e, james()); } return false; }
    e.vuelve = true;
    return false;
  }
  /** El conductor que se cubría, de vuelta al pie de su asiento: true cuando llegó. */
  function volver(c, p, dt) {
    p.meta = { th: thAsiento(-1), k: 1 };
    p.camina = !andar(c, p, dt);
    return !p.camina;
  }
  /** Si James ve (y puede pegarle) a alguien agachado en el suelo en (x, y). */
  const loVe = (x, y) => teVe(x, y, G.cuerpo.agachado, james());

  /** Recargar (escondido, o al quedarse sin balas): suena, y arriba de la cabeza el tambor que se llena, como en el tren. */
  function recargar(e, A) {
    if (e.recarga > 0 || e.balas >= A.cargador) return;
    e.recarga = e.recargaTotal = A.recarga;
    audio.play('recargaGuardia');
  }

  /**
   * Que se dé cuenta (si no se había dado). `ultima`: cuándo lo amenazaron por última vez (para calmarse). `avisar`:
   * para que el asalto lo cuente como amenaza (world/asaltoCarreta.js).
   */
  function alertar(c) {
    if (!tiene(c)) return;
    const e = de(c);
    e.ultima = reloj;
    if (e.alerta) return;
    e.alerta = true; e.avisar = true;
    e.reaccion = G.reaccion;
    carretas.asustar(c.id);
  }
  let reloj = 0;

  /** Hasta cuántos metros llega el arma del escopetero de `c`. */
  const alcance = (c) => ARMAS_GUARDIA[de(c).arma].alcance * G.alcance / M;

  /** 💥 Un tiro tuyo en (x, y): lo oyen los que están a menos de `oye`. */
  function oirTiro(x, y) {
    for (const c of carretas.activas) if (Math.hypot(c.x - x, (c.y - y) / PROF) < G.oye * M) alertar(c);
  }

  /**
   * Cada cuadro. `apuntando`, `mira`: tu clic derecho y dónde está; `empuna`: si tienes el arma afuera (0 a 1);
   * `parada(c)`: si la carreta está frenada por ti o con el conductor muerto.
   */
  function actualizar(dt, { apuntando, mira, empuna, parada }) {
    if (!G.activa) return;
    reloj += dt;
    const yo = james();
    for (const c of carretas.activas) {
      if (!tiene(c)) continue;
      const e = de(c), d = Math.hypot(c.x - yo.x, (c.y - yo.y) / PROF) / M;
      // (1) Darse cuenta (y, ya alerta, seguir amenazado).
      const aLaCarreta = apuntando && mira && Math.hypot(mira.x - c.x, (mira.y - c.y) / PROF) < G.apuntarA * M;
      const teNota = (aLaCarreta && d < G.ve) || (d < G.cerca && empuna > 0.5), nota = teNota || parada(c);
      if (nota) alertar(c);
      // (🔁 Apuntarle a la carreta o acercarte con el arma afuera renueva la amenaza cada vez, no sólo la primera: si no,
      // se subían aunque estuvieras a 3 m con el arma en la mano. Que esté frenada, no: si no, nunca se calmarían.)
      if (teNota) e.avisar = true;
      if (!e.alerta) continue;
      // 🔁 (Se calma: sentado, sin amenazas en `defensa.calma` segundos y tú a más de `defensa.suelta`. Antes quedaba
      // alerta para siempre: un tiro de caza lejos y te tiraba cada vez que pasabas.)
      if (!e.bajado && !nota && reloj - (e.ultima ?? reloj) > G.defensa.calma && d > G.defensa.suelta) { e.alerta = false; e.apunta = 0; continue; }
      if (e.reaccion > 0) { e.reaccion -= dt; continue; }
      const A = ARMAS_GUARDIA[e.arma];
      if (e.recarga > 0) { e.recarga -= dt; if (e.recarga <= 0) e.balas = A.cargador; }
      // 🔙 Volviendo al pescante (se terminó la defensa): camina por el anillo hasta su lado y se sube.
      if (e.bajado && e.vuelve) {
        e.camina = true; e.oculto = false; e.apunta = 0; e.plan = null; e.meta = { th: thAsiento(1), k: 1 };
        if (andar(c, e, dt)) { e.bajado = null; e.vuelve = false; e.camina = false; e.subio = true; }
        continue;
      }
      if (!parada(c)) e.subio = false;
      // (Si la carreta sigue —la soltaste—, se vuelve a subir: no se queda a pie en el medio del campo.)
      if (e.bajado && !parada(c)) { e.bajado = null; e.camina = false; e.oculto = false; e.apunta = 0; e.plan = null; }
      // (3) Bajarse: con la carreta parada.
      if (!e.bajado && parada(c) && !e.subio) {
        // (Se baja por su lado del pescante, al anillo, y va a cubrirse.)
        e.th = thAsiento(1); e.k = 1;
        e.bajado = anillo(c, e.th); e.plan = 'cubrirse'; e.meta = cubierto(c, e, yo); e.oculto = false; e.t = 0;
      }
      if (e.bajado) {
        e.t += dt;
        // Camina por el anillo (a cubrirse o a asomarse), de pie y a la vista.
        if (e.plan === 'cubrirse' || e.plan === 'asomarse') {
          e.camina = true; e.oculto = false; e.apunta = 0;
          if (!andar(c, e, dt)) continue;
          e.camina = false; e.t = 0;
          if (e.plan === 'cubrirse') {
            e.plan = 'escondido'; e.oculto = true;
            e.espera = G.pie.escondido[0] + Math.random() * (G.pie.escondido[1] - G.pie.escondido[0]);
            if (e.balas < A.cargador) recargar(e, A);   // (escondido, aprovecha para cargar)
          } else { e.plan = 'tirar'; e.tiros = 0; }
          continue;
        }
        // Escondido, agachado: si te moviste y ahora lo ves, se va a otro lado; si no, espera (y termina de cargar).
        if (e.plan === 'escondido') {
          if (e.t > 0.3 && teVe(e.bajado.x, e.bajado.y, G.cuerpo.agachado, yo)) { e.plan = 'cubrirse'; e.meta = cubierto(c, e, yo); continue; }
          if (e.t < e.espera || e.recarga > 0) continue;
          const m = asomo(c, e, yo, A.alcance * G.alcance);
          if (!m) { e.t = 0; continue; }   // (no hay de dónde verte: espera)
          e.plan = 'asomarse'; e.meta = m; e.oculto = false;
          continue;
        }
        // Asomado, de pie: te apunta y tira `rafaga` tiros; sin balas, si dejó de verte o pasado `asomadoMax`, a cubrirse.
        if (e.balas <= 0 || e.tiros >= G.pie.rafaga || e.t > G.pie.asomadoMax || !teVe(e.bajado.x, e.bajado.y, G.cuerpo.pecho, yo)) {
          e.plan = 'cubrirse'; e.meta = cubierto(c, e, yo);
          continue;
        }
      }
      // (2) Tirar (desde el asiento, o asomado): apunta `A.apuntar` segundos y tira, si llega.
      const p = pecho(c, e);
      if (!p) continue;
      e.mira = Math.atan2(yo.pecho - p.y, yo.x - p.x);
      if (e.balas <= 0 || e.recarga > 0) continue;
      // (🔁 La distancia de verdad, desachatada, como la tuya: antes, arriba y abajo llegaba un 66 % más lejos.)
      if (Math.hypot(yo.x - p.x, (yo.pecho - p.y) / PROF) > A.alcance * G.alcance) { e.apunta = 0; continue; }
      e.apunta += dt;
      if (e.apunta < A.apuntar * G.apuntar) continue;
      e.apunta = -A.cadencia * G.cadencia;   // (lo que tarda en volver a tener el tiro)
      tirar(c, e, p, yo, A);
    }
    moverBalas(dt);
  }

  function tirar(c, e, p, yo, A) {
    e.balas -= 1;
    e.tiros = (e.tiros || 0) + 1;
    if (e.balas <= 0) recargar(e, A);
    soltar(p, Math.atan2(yo.pecho - p.y, yo.x - p.x), e.arma, { aPie: !!e.bajado, de: e.bajado ? null : c.id, punteria: G.punteria[e.arma] });
  }

  /**
   * Una bala (o un escopetazo) desde `p` hacia `hacia`, con el arma `armaId` de los guardias. `aPie`: si el que tira está
   * a pie (la madera te cubre si estás agachado); `de`: la carreta en que va sentado (no la cuenta); `punteria`: cuánto
   * se le abre la bala (la escopeta, su abanico). También la usa la escolta (world/escolta.js).
   */
  function soltar(p, hacia, armaId, { aPie = false, de = null, punteria = 0.05 } = {}) {
    const A = ARMAS_GUARDIA[armaId];
    audio.play(A.perdigones ? 'escopetazo' : 'rifleGuardia');
    const sale = (a, danio, perdigon) => balas.push({ x: p.x, y: p.y, vx: Math.cos(a) * A.velocidadBala, vy: Math.sin(a) * A.velocidadBala, recorrido: 0, alcance: A.alcance, danio, perdigon, aPie, de });
    if (A.perdigones) {
      const id = ++perdigonId, medio = A.abanico / 2;
      for (let i = 0; i < A.perdigones; i++) sale(hacia + (i / (A.perdigones - 1) - 0.5) * 2 * medio + (Math.random() - 0.5) * medio / A.perdigones, G.danio.aJames * (A.factorPerdigon || 1), id);
    } else sale(hacia + (Math.random() - 0.5) * 2 * punteria, G.danio.aJames, null);
  }

  function moverBalas(dt) {
    const yo = james();
    for (const b of balas) {
      const x0 = b.x, y0 = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.recorrido += Math.hypot(b.x - x0, b.y - y0);
      if (b.recorrido > b.alcance) { b.fin = true; continue; }
      // ¿Te pega? (en este tramo)
      const u = tocaCuerpo(x0, y0, b.x, b.y, yo.columna), pega = u !== null;
      const hx = pega ? x0 + (b.x - x0) * u : b.x, hy = pega ? y0 + (b.y - y0) * u : b.y;
      // La carreta en el medio: la lona siempre; la madera si él está a pie, como a ti *(memoria: lo que golpea vale
      // igual para todos)*. 🔁 Antes, sólo si tú estabas agachado: él te pegaba a través de la carreta y tú a él no.
      const t = carretas.tela(x0, y0, hx, hy, b.aPie, b.de);
      if (t) { b.fin = true; audio.play('hitWall'); continue; }
      if (pega) { b.fin = true; herirJames(b.danio, b.perdigon); }
    }
    balas = balas.filter((b) => !b.fin);
  }

  /**
   * 💥 Una bala tuya de (x0, y0) a (x1, y1): si le pega a un escopetero, lo hiere (`fuerza`: la de tu arma) y devuelve
   * 'escopetero' (o 'muerto' si lo mató); si no, null. `apuntadoA`: 'e|' + id si al disparar le apuntabas a él.
   */
  /**
   * 🎯 Si tu bala (este tramo) toca a un escopetero: { c, u } (u: en qué parte del tramo; el primero), o null. No lo
   * hiere: eso lo decide el asalto, que mira a quién le pega primero (world/asaltoCarreta.js).
   */
  function toca(x0, y0, x1, y1) {
    if (!G.activa) return null;
    let mejor = null;
    for (const c of carretas.activas) {
      if (!tiene(c)) continue;
      const e = de(c), u = tocaCuerpo(x0, y0, x1, y1, cuerpo(c, e));
      if (u === null) continue;
      // (A pie, si la carreta queda entre la bala y él, la para ella: no se le pega a través.)
      if (e.bajado && carretas.tela(x0, y0, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, true, null)) continue;
      if (!mejor || u < mejor.u) mejor = { c, u };
    }
    return mejor;
  }

  /** Si al disparar le apuntabas a un escopetero a la vista: su carreta. */
  function apuntado(meta) {
    if (!G.activa || !meta) return null;
    for (const c of carretas.activas) {
      if (!tiene(c)) continue;
      if (enCuerpo(meta[0], meta[1], cuerpo(c, de(c)))) return c.id;
    }
    return null;
  }

  /** Le pega una bala tuya al escopetero de `c`: 'escopetero', o 'muerto' si lo mató. */
  function herir(c, fuerza) {
    const e = de(c);
    alertar(c);
    // (🔁 Herido no se queda pensando: se tira detrás de la carreta casi ya. Antes esperaba la reacción entera sentado, y
    // el segundo tiro de lejos lo mataba.)
    e.reaccion = Math.min(e.reaccion, 0.2);
    e.vida -= G.danio.aGuardia * fuerza;
    if (e.vida > 0) return 'escopetero';
    const S = asiento(c), E = estadoDe(c.id);
    // (Sentado, cae al costado de su lado del pescante; a pie, donde estaba.)
    const px = -c.dy, py = c.dx;
    const sx = e.bajado ? e.bajado.x : S.x + px * G.escopetero.caido * M, sy = e.bajado ? e.bajado.y : S.y + py * G.escopetero.caido * M * PROF;
    E.esc = { muerto: true, x: sx, y: sy, espejo: Math.cos(e.mira) < 0, aspecto: aspectoDe(e, 'guardia'), dia: hoy() };
    delete gente[c.id];
    return 'muerto';
  }

  /** Si hay un escopetero vivo en la carreta (es testigo). */
  const vivo = (c) => !!c && tiene(c);

  /**
   * 🧍 Sentado: con la carreta, igual que el conductor (`antes`: si se lo llama antes de dibujarla). Lo bajado y lo
   * muerto va aparte, en `cosas`.
   */
  function dibujarSentado(r, c, gx, gy, noche, antes) {
    if (!tiene(c)) return;
    const e = de(c);
    if (e.bajado) return;
    if (antes !== (c.tipo === 'colono' && c.vista.startsWith('nor'))) return;
    const S = asiento(c), x = gx + (S.x - c.x), y = gy + (S.y - c.y);
    const alza = e.alerta && e.reaccion <= 0;
    const fig = dibujarPersona(r, { tipo: 'guardia', x, pies: y - S.alto * M, angulo: alza ? e.mira : Math.atan2(c.dy, c.dx), interior: true, luz: noche ? -1 : 0,
      nuevo: { arma: e.arma, empuna: alza ? 1 : 0, funda: false, aspecto: aspectoDe(e, 'guardia'), piernas: 'sentado' } });
    if (e.recarga > 0 && fig) dibujarAviso(r, x, fig.arriba, 'recarga', 1 - e.recarga / (e.recargaTotal || 1));
    // (🆕 El "!" mientras reacciona: que se lea que se dio cuenta. Revisión: sólo levantaba el arma.)
    else if (e.alerta && e.reaccion > 0 && fig) dibujarAviso(r, x, fig.arriba, 'alerta');
  }

  /** Lo que va en el suelo (bajados y muertos), para ordenarlo con lo demás: [{ y, draw }]. */
  function cosas(r, noche, enVista) {
    const out = [];
    // (Los muertos, de todas las carretas: aunque la suya haya seguido viaje, quedan tirados hasta el otro día.)
    for (const E of Object.values(estados())) {
      const m = E && E.esc;
      if (m && m.muerto && enVista(m.x, m.y) && (m.dia ?? hoy()) >= hoy() - 1) out.push({ y: m.y, draw: () => tendidoNuevo(r, m.x, m.y, { tipo: 'guardia', modo: 'muerto', sangre: true, espejo: m.espejo, aspecto: m.aspecto || aspectoDe(m, 'guardia') }) });
    }
    for (const c of carretas.activas) {
      if (!lleva(c)) continue;
      const E = estados()[c.id];
      if (E && E.esc && E.esc.muerto) continue;
      const e = gente[c.id];
      if (!e || !e.bajado || !enVista(e.bajado.x, e.bajado.y)) continue;
      out.push({ y: e.bajado.y, draw: () => {
        const nuevo = { arma: e.arma, empuna: e.oculto || e.camina ? 0 : 1, funda: false, aspecto: aspectoDe(e, 'guardia') };
        if (e.oculto && !e.camina) nuevo.piernas = 'agachado'; else if (!e.camina) nuevo.piernas = 'quieto';
        const fig = dibujarPersona(r, { tipo: 'guardia', x: e.bajado.x, pies: e.bajado.y, angulo: e.mira, interior: true, luz: noche ? -1 : 0, fase: e.camina ? e.fase / 4 : null, modo: 'caminar', nuevo });
        if (e.recarga > 0 && fig) dibujarAviso(r, e.bajado.x, fig.arriba, 'recarga', 1 - e.recarga / (e.recargaTotal || 1));
      } });
    }
    return out;
  }

  /** Las balas de ellos (rayitas, como las tuyas). */
  function dibujarBalas(r) {
    if (!balas.length) return;
    r.ctx.strokeStyle = '#f3e2a0'; r.ctx.lineWidth = 0.6;
    r.ctx.beginPath();
    for (const b of balas) { r.ctx.moveTo(b.x - b.vx / 60, b.y - b.vy / 60); r.ctx.lineTo(b.x, b.y); }
    r.ctx.stroke();
  }

  return {
    tiene, lleva, alertar, alcance, oirTiro, actualizar, toca, apuntado, cubrir, loVe, subir, volver, vivo, herir, dibujarSentado, cosas, dibujarBalas, soltar,
    reiniciar() { balas = []; for (const k of Object.keys(gente)) delete gente[k]; },
    /** Para probar desde la consola. */
    get gente() { return gente; }, get balas() { return balas; },
  };
}
