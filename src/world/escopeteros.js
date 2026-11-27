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
 *     lado de la carreta, de espaldas a ti, y se cubre detrás —o detrás de una piedra cercana, si le conviene más—.
 *     Agachado no lo ves ni le pegas; se asoma un rato para tirar (ahí sí). Si te mueves alrededor, cambia de lado.
 *     Recarga sólo a cubierto.
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
 * `herirJames(puntos, perdigon)`: le pega a James. `piedra(x0, y0, x1, y1, bala)`: si una piedra corta ese tiro;
 * `rocas(x0, y0, x1, y1)`: las piedras en ese rectángulo; `libre(x, y)`: si se puede estar ahí (los pies en y + 7).
 */
export function crearEscopeteros({ carretas, C, PROF, audio, decir, T, james, herirJames, hoy = () => 0, piedra = () => null, rocas = () => [], libre = () => true }) {
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

  /** Hasta dónde llega cada arma en el campo, en unidades (`alcance` por `alcancePor`: la escopeta, más). */
  const alcanceDe = (arma) => ARMAS_GUARDIA[arma].alcance * G.alcance * ((G.alcancePor || {})[arma] || 1);

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

  /**
   * 🧱 Si la carreta está DE VERDAD entre (x, y) y tú, en el suelo: la línea entre los pies de los dos pasa por adentro de
   * su caja (`pie.reparo`: metros atrás y adelante del medio, y a cada lado). 🔁 (2026-11-27, Santi: "no se oculta
   * detrás de la carreta".) Antes alcanzaba con que la línea en la pantalla tocara un punto del dibujo —la lanza, una
   * rueda—: se "escondía" parado en la punta de la lanza, del lado tuyo y a la vista.
   */
  function detras(c, x, y, yo) {
    const B = G.pie.reparo;
    const loc = (px, py) => { const ex = (px - c.x) / M, ey = (py - c.y) / M / PROF; return [ex * c.dx + ey * c.dy, -ex * c.dy + ey * c.dx]; };
    const [a0, b0] = loc(x, y), [a1, b1] = loc(yo.x, yo.y), da = a1 - a0, db = b1 - b0;
    let t0 = 0, t1 = 1;
    for (const [p, q] of [[-da, a0 + B.atras], [da, B.adelante - a0], [-db, b0 + B.ancho], [db, B.ancho - b0]]) {
      if (Math.abs(p) < 1e-9) { if (q < 0) return false; continue; }
      const r = q / p;
      if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
    return t0 <= t1;
  }
  /** 🪨 Si una piedra lo tapa de ti, con el pecho a `alto` metros (la misma cuenta que para tus balas). */
  function tapaRoca(x, y, alto, yo) {
    const py = y - alto * M, largo = Math.hypot(x - yo.x, py - yo.pecho);
    // (🔁 Lejos —más allá de donde te ve, y la mitad más—, no busca piedras: con la línea tan larga, revisar los obstáculos
    // de todo ese rectángulo trababa el juego medio segundo por cuadro, p. ej. el conductor de una carreta que dejaste
    // atrás. A esa distancia ni te tira.)
    if (largo > G.ve * 1.5 * M) return false;
    return !!piedra(yo.x, yo.pecho, x, py, { alto: !yo.aPie, sx: yo.x, sy: yo.pecho, largo });
  }
  /** Si está a cubierto de ti en (x, y) con el pecho a `alto`: detrás de la carreta (de verdad) o de una piedra. */
  const aCubierto = (c, x, y, alto, yo) => (!teVe(x, y, alto, yo) && detras(c, x, y, yo)) || tapaRoca(x, y, alto, yo);
  /** Si desde (x, y), de pie, te puede tirar: ni la carreta ni una piedra en el medio. */
  const tiroLimpio = (x, y, yo) => teVe(x, y, G.cuerpo.pecho, yo) && !tapaRoca(x, y, G.cuerpo.pecho, yo);
  /** 🪨 El punto `th` alrededor de la piedra `ob`, a `pie.roca.lejos` metros de su medio. */
  const rocaPunto = (ob, th) => ({ x: ob.x + Math.cos(th) * G.pie.roca.lejos * M, y: ob.y + Math.sin(th) * G.pie.roca.lejos * M * PROF });
  /** El ángulo del anillo de la carreta más cerca de (x, y). */
  function thCerca(c, x, y) {
    let m = null, dm = 0;
    for (const th of ANGULOS) { const p = anillo(c, th), d = Math.hypot(p.x - x, (p.y - y) / PROF); if (m === null || d < dm) { m = th; dm = d; } }
    return m;
  }
  /** Dónde está ahora en el anillo (si está en una piedra, el punto del anillo más cerca). */
  const thDe = (c, e) => ((e.sitio || e.enCamino) && e.bajado ? thCerca(c, e.bajado.x, e.bajado.y) : e.th);
  /**
   * Dónde cubrirse: el punto del anillo donde no lo ves ni de pie, el más cerca de donde está. `esquina` (el escopetero):
   * mejor uno pegado a una punta —el de al lado ya se ve—, así para asomarse da un paso. 🔁 (Revisión: se escondía en el
   * medio del costado y para asomarse caminaba hasta 2,5 s a la vista, y ahí lo matabas.)
   */
  function cubierto(c, e, yo, evita = null, esquina = false, nulo = false) {
    let mejor = null, mejorEsq = null;
    const paso = Math.PI / 12, ref = thDe(c, e);
    const seVe = (p) => !aCubierto(c, p.x, p.y, G.cuerpo.pecho, yo);
    for (const th of ANGULOS) {
      const p = anillo(c, th);
      if (seVe(p)) continue;
      if (!libreAqui(c, p)) continue;   // (🪨 ahí hay una mata o una piedra)
      if (evita !== null && dAng(th, evita) < G.pie.aparte) continue;   // (no encima del otro)
      if (!mejor || dAng(th, ref) < dAng(mejor.th, ref)) mejor = { th, k: 1 };
      if (esquina && (seVe(anillo(c, th + paso)) || seVe(anillo(c, th - paso))) && (!mejorEsq || dAng(th, ref) < dAng(mejorEsq.th, ref))) mejorEsq = { th, k: 1 };
    }
    return mejorEsq || mejor || (nulo ? null : { th: ref, k: 1 });
  }

  /**
   * 🪨 DÓNDE CUBRIRSE, CON EL ENTORNO (🔁 2026-11-27, Santi: "no usa el entorno"): detrás de la carreta (`cubierto`) o
   * detrás de una piedra a menos de `roca.a` metros de ella. Cada uno cuesta lo que hay que caminar más lo que se camina
   * a la vista (`roca.expuesto` por metro); la piedra, `roca.costo` metros más (la carreta es lo suyo). El más barato.
   */
  function reparo(c, e, yo) {
    const R = G.pie.roca;
    let mejor = null;
    const enAnillo = cubierto(c, e, yo, null, true, true);
    if (enAnillo) mejor = { meta: enAnillo, costo: costoIda(c, e, yo, enAnillo) };
    if (R && e.bajado) {
      const lejos = R.a * M;
      for (const ob of rocas(c.x - lejos, c.y - lejos * PROF, c.x + lejos, c.y + lejos * PROF)) {
        if (Math.hypot(ob.x - c.x, (ob.y - c.y) / PROF) > lejos) continue;
        // (Del lado de la piedra contrario a ti, o un poco corrido, donde de verdad lo tape agachado.)
        const th0 = Math.atan2((ob.y - yo.y) / PROF, ob.x - yo.x);
        let q = null;
        for (const d of [0, 0.4, -0.4, 0.8, -0.8]) {
          const p = rocaPunto(ob, th0 + d);
          if (!libreAqui(c, p) || !tapaRoca(p.x, p.y, G.cuerpo.agachado, yo)) continue;
          q = { roca: ob, th: th0 + d }; break;
        }
        // (Sólo si desde esa piedra puede tirarte: una que lo tapa por todos lados no le sirve para pelear.)
        if (q && !asomoEnRoca(c, ob, q.th, yo, alcanceDe(e.arma))) q = null;
        if (!q) continue;
        // (Acosado —lo sacaste de su reparo o lo heriste hace poco—, la piedra le gusta más: la carreta ya no le sirve.)
        const costo = costoIda(c, e, yo, q) + R.costo - R.acosado * (e.acosado || 0);
        if (!mejor || costo < mejor.costo) mejor = { meta: q, costo };
      }
    }
    return mejor ? mejor.meta : { th: thDe(c, e), k: 1 };
  }
  /**
   * 🪨 Por dónde asomarse desde la piedra \`ob\`, estando en \`th\`: ahí mismo de pie si por encima te ve, o corrido
   * alrededor de ella (hasta un cuarto de vuelta y un poco más) — { roca, th }, el más cerca; null si de ningún lado.
   */
  function asomoEnRoca(c, ob, th0, yo, alcance) {
    for (const d of [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2, 1.6, -1.6]) {
      const th = th0 + d, p = rocaPunto(ob, th);
      if (d && !libreAqui(c, p)) continue;
      if (Math.hypot(yo.x - p.x, (yo.pecho - (p.y - G.cuerpo.pecho * M)) / PROF) > alcance || !tiroLimpio(p.x, p.y, yo)) continue;
      return { roca: ob, th };
    }
    return null;
  }
  /**
   * 🪨 Lo sacaste de su reparo o lo heriste: la piedra le gusta más. (🔁 Revisión con un juez: con tope `roca.acosadoMax`, y
   * sólo si estaba en la carreta: sin lugar tapado sumaba cada 0,3 s sin fin, y de una piedra saltaba a otra.)
   */
  function acosar(e) { if (!e.sitio) e.acosado = Math.min(G.pie.roca.acosadoMax ?? 3, (e.acosado || 0) + 1); }
  /** Si puede pararse en `p` (sin piedra, mata ni carreta). */
  const libreAqui = (c, p) => libre(p.x, p.y - 7);
  /** Los puntos por donde pasaría para llegar a `meta` (para medir cuánto camina y cuánto a la vista). */
  function camino(c, e, meta) {
    const arco = (de, a, n = 6) => { const dif = Math.atan2(Math.sin(a - de), Math.cos(a - de)); return Array.from({ length: n }, (_, i) => anillo(c, de + (dif * (i + 1)) / n)); };
    const aqui = e.bajado || anillo(c, e.th);
    if (meta.roca) {
      const q = rocaPunto(meta.roca, meta.th);
      if (e.sitio === meta.roca) {
        const dif = Math.atan2(Math.sin(meta.th - e.th), Math.cos(meta.th - e.th));
        return [aqui, ...Array.from({ length: 4 }, (_, i) => rocaPunto(meta.roca, e.th + (dif * (i + 1)) / 4))];
      }
      if (e.sitio || e.enCamino) return [aqui, q];
      return [aqui, ...arco(e.th, thCerca(c, q.x, q.y)), q];
    }
    if (e.sitio || e.enCamino) { const v = thCerca(c, aqui.x, aqui.y); return [aqui, anillo(c, v), ...arco(v, meta.th)]; }
    return [aqui, ...arco(e.th, meta.th)];
  }
  function costoIda(c, e, yo, meta) {
    const P = camino(c, e, meta);
    let costo = 0;
    for (let i = 1; i < P.length; i++) {
      const largo = Math.hypot(P[i].x - P[i - 1].x, (P[i].y - P[i - 1].y) / PROF) / M;
      // (🔁 Revisión con un juez: de a un metro. Antes miraba sólo la punta de cada tramo, y el tramo derecho a la piedra
      // —que termina siempre tapado— contaba como escondido aunque cruzara diez metros a la vista.)
      const n = Math.max(1, Math.ceil(largo));
      for (let j = 1; j <= n; j++) {
        const x = P[i - 1].x + ((P[i].x - P[i - 1].x) * j) / n, y = P[i - 1].y + ((P[i].y - P[i - 1].y) * j) / n;
        const visto = !aCubierto(c, x, y, G.cuerpo.pecho, yo);
        costo += (largo / n) * (1 + (visto ? G.pie.roca.expuesto : 0));
      }
    }
    return costo;
  }
  /**
   * Dónde asomarse: el punto (pegado, o `afuera`) desde donde te ve de pie y le llega el arma (`alcance`, en u), el más
   * cerca de su reparo. Si no hay ninguno, null: se queda escondido esperando que te acerques (con la escopeta, de lejos
   * no le sirve asomarse).
   */
  function asomo(c, e, yo, alcance) {
    // 🪨 (Detrás de una piedra: se para ahí mismo si por encima te ve; si no, se corre un poco alrededor de ella.)
    if (e.sitio) return asomoEnRoca(c, e.sitio, e.th, yo, alcance);
    let mejor = null;
    const cerca = [];
    for (const k of [1, G.pie.afuera]) for (const th of ANGULOS) {
      const p = anillo(c, th, k);
      if (Math.hypot(yo.x - p.x, (yo.pecho - (p.y - G.cuerpo.pecho * M)) / PROF) > alcance) continue;
      if (!tiroLimpio(p.x, p.y, yo)) continue;
      const dd = dAng(th, e.th) + (k > 1 ? 0.2 : 0);
      if (!mejor || dd < mejor.dd) mejor = { th, k, dd };
      // (Los que quedan a menos de `asomaHasta` metros del reparo: de ésos, uno sorteado. Así no se asoma siempre por la
      // misma punta, y no se pasea a la vista.)
      if (Math.hypot(p.x - e.bajado.x, (p.y - e.bajado.y) / PROF) < G.pie.asomaHasta * M) cerca.push({ th, k, dd });
    }
    // (El más cerca casi siempre —un paso—; a veces, otro de los cercanos.)
    if (cerca.length) { cerca.sort((a, b) => a.dd - b.dd); return Math.random() < 0.7 ? cerca[0] : cerca[Math.floor(Math.random() * cerca.length)]; }
    return mejor;
  }
  /**
   * 🔀 EL FLANCO *(revisión con un juez: antes salía por la otra punta por el camino más corto, que pasaba por delante
   * tuyo, a la vista y sin tirar)*: la esquina escondida más lejos de donde está, y por qué lado ir para que el camino
   * quede detrás de la carreta (el que tiene menos puntos a la vista). null si no hay otra esquina.
   */
  function esquinaOpuesta(c, e, yo) {
    const paso = Math.PI / 12, v = 2 * Math.PI;
    let lejos = null;
    const seVe = (p, alto = G.cuerpo.pecho) => !aCubierto(c, p.x, p.y, alto, yo);
    for (const th of ANGULOS) {
      const p = anillo(c, th);
      if (seVe(p)) continue;
      if (!seVe(anillo(c, th + paso)) && !seVe(anillo(c, th - paso))) continue;   // (no es esquina)
      if (dAng(th, e.th) < 3 * paso) continue;   // (es la misma)
      if (!lejos || dAng(th, e.th) > dAng(lejos.th, e.th)) lejos = { th, k: 1 };
    }
    if (!lejos) return null;
    const vistos = (dir) => {
      let ida = (((lejos.th - e.th) % v) + v) % v;
      if (dir < 0) ida -= v;
      let n = 0;
      for (let i = 1; i < 8; i++) { const p = anillo(c, e.th + (ida * i) / 8); if (seVe(p, G.cuerpo.agachado)) n++; }
      return n;
    };
    const mas = vistos(1), menos = vistos(-1);
    // (Si los dos caminos se ven, no flanquea: sería regalarse.)
    if (Math.min(mas, menos) > 1) return null;
    return { ...lejos, dir: mas <= menos ? 1 : -1 };
  }

  /**
   * Un paso hacia `e.meta`: true si llegó. Por el anillo de la carreta (`e.meta.dir`, 1 o -1: por qué lado dar la
   * vuelta; si no, el más corto); 🪨 alrededor de una piedra (`e.meta.roca`), o derecho de la carreta a una piedra y al
   * revés (`e.sitio`: la piedra donde está; `e.enCamino`: entre una y otra, fuera del anillo). Si cambia de idea a mitad
   * de camino, sigue derecho desde donde está: nunca salta al anillo. 🔁 (2026-11-27, Santi: "se buguea con la
   * carreta"): del pescante al anillo saltaba metro y medio de golpe; ahora baja caminando (`e.salta`).
   */
  function andar(c, e, dt) {
    if (e.salta) { const p = anillo(c, e.th, e.k); if (!recta(e, p.x, p.y, dt, false)) return false; e.salta = false; }
    const meta = e.meta;
    if (e.sitio && meta.roca === e.sitio) return porPiedra(e, meta, dt);
    if (e.sitio) { e.sitio = null; e.enCamino = true; e.via = null; }
    if (e.enCamino) {
      if (meta.roca) { const q = rocaPunto(meta.roca, meta.th); if (!recta(e, q.x, q.y, dt)) return false; e.enCamino = false; e.sitio = meta.roca; e.th = meta.th; return true; }
      // (A la carreta: derecho al punto del anillo más cerca, y de ahí por el anillo.)
      if (e.via == null) e.via = thCerca(c, e.bajado.x, e.bajado.y);
      const q = anillo(c, e.via);
      if (!recta(e, q.x, q.y, dt)) return false;
      e.enCamino = false; e.th = e.via; e.k = 1; e.via = null;
      return false;
    }
    if (meta.roca) {
      // (De la carreta a una piedra: por el anillo hasta el punto más cerca de ella, y de ahí derecho.)
      const q = rocaPunto(meta.roca, meta.th);
      if (meta.via == null) meta.via = thCerca(c, q.x, q.y);
      if (!porAnillo(c, e, { th: meta.via, k: 1 }, dt)) return false;
      e.enCamino = true; e.via = null;
      return false;
    }
    return porAnillo(c, e, meta, dt);
  }
  /** Un paso por el anillo hacia `m` ({ th, k, dir }): true si llegó. */
  function porAnillo(c, e, m, dt) {
    const w = G.pie.velocidad / (((G.pie.largo + G.pie.ancho) / 2) * e.k) * dt;
    let dif = Math.atan2(Math.sin(m.th - e.th), Math.cos(m.th - e.th));
    if (m.dir) { const v = 2 * Math.PI; dif = (((m.th - e.th) % v) + v) % v; if (m.dir < 0 && dif > 1e-6) dif -= v; }
    e.th += Math.abs(dif) <= w ? dif : Math.sign(dif) * w;
    const dk = m.k - e.k, pk = G.pie.velocidad / G.pie.largo * dt;
    e.k += Math.abs(dk) <= pk ? dk : Math.sign(dk) * pk;
    // 🪨 (2026-11-27, Santi: "al caminar, ninguno de los dos esquiva piedras ni matas".) Si el paso cae en una piedra o
    // una mata, se abre del anillo hasta que pasa (y después vuelve de a poco). Si no hay por dónde, pasa igual: mejor
    // eso que quedarse trabado en el medio de un tiroteo.
    // (🔁 Revisión con un juez: si el destino mismo cae en una mata, llega lo más cerca que puede —si no, vibraba ahí
    // para siempre, y la carreta que esperaba que se subiera no seguía nunca—.)
    const tapado = !libreAqui(c, anillo(c, m.th, m.k)), giro = Math.abs(dif) <= w;
    const p = anillo(c, e.th, e.k);
    if (!libreAqui(c, p)) {
      const th0 = e.th - (giro ? dif : Math.sign(dif) * w);
      for (const [th, k] of [[e.th, e.k + 2 * pk], [th0, e.k + 2 * pk], [e.th, e.k + 4 * pk], [th0, e.k + 4 * pk]]) {
        const q = anillo(c, th, k);
        if (libreAqui(c, q)) { e.th = th; e.k = k; pisar(e, q); if (giro && tapado) { delete m.dir; return true; } return false; }
      }
    }
    pisar(e, p);
    const llego = giro && (Math.abs(dk) <= pk || tapado);
    if (llego && m.dir) delete m.dir;   // (llegado, sin rumbo forzado: si no, un redondeo le haría dar la vuelta entera)
    return llego;
  }
  /** 🪨 Un paso alrededor de su piedra hacia `m.th`: true si llegó. */
  function porPiedra(e, m, dt) {
    const w = G.pie.velocidad / G.pie.roca.lejos * dt, dif = Math.atan2(Math.sin(m.th - e.th), Math.cos(m.th - e.th));
    e.th += Math.abs(dif) <= w ? dif : Math.sign(dif) * w;
    pisar(e, rocaPunto(e.sitio, e.th));
    return Math.abs(dif) <= w;
  }
  /** Un paso derecho hacia (x, y): true si llegó. */
  function recta(e, x, y, dt, esquiva = true) {
    const dx = x - e.bajado.x, dy = (y - e.bajado.y) / PROF, d = Math.hypot(dx, dy), w = G.pie.velocidad * M * dt;
    if (d <= w) { pisar(e, { x, y }); return true; }
    const p = { x: e.bajado.x + (dx / d) * w, y: e.bajado.y + (dy / d) * w * PROF };
    // 🪨 (Si el paso cae en una piedra o una mata, lo rodea: prueba torciendo para un lado y para el otro, cada vez más.
    // Sin salida, pasa igual. Bajando o subiendo al pescante, no: ahí la carreta misma "choca".)
    if (esquiva && !libreAqui(null, p)) {
      const a = Math.atan2(dy, dx);
      for (const g of [0.5, -0.5, 1.0, -1.0, 1.5, -1.5]) {
        const q = { x: e.bajado.x + Math.cos(a + g) * w, y: e.bajado.y + Math.sin(a + g) * w * PROF };
        if (libreAqui(null, q)) { pisar(e, q); return false; }
      }
    }
    pisar(e, p);
    return false;
  }
  /** Lo pone en `p`, mirando para donde se movió (y las piernas, lo que anduvo). */
  function pisar(e, p) {
    const mx = p.x - e.bajado.x, my = (p.y - e.bajado.y) / PROF, mov = Math.hypot(mx, my);
    if (mov > 0.01) { e.mira = Math.atan2(my, mx); e.fase += mov; }
    e.bajado = p;
  }
  /**
   * 🧍 El conductor que se cubre mientras se defienden (world/asaltoCarreta.js): baja por su lado del pescante y anda
   * por el mismo anillo hasta donde no lo ves, lejos del escopetero; si lo ves, se va a otro lado. Nunca se asoma.
   * `p`: { bajado, th, k, meta, mira, fase, camina, t }.
   */
  function cubrir(c, p, dt) {
    const yo = james(), e = gente[c.id], otro = e && e.bajado ? thDe(c, e) : null;
    if (!p.bajado) {
      // (🔁 Si estás de su lado, salta por el otro: antes bajaba siempre por el suyo y rodeaba media carreta a la vista.)
      p.th = thAsiento(deMiLado(c, yo, -1) ? 1 : -1); p.k = 1; p.fase = 0; p.t = 0;
      p.bajado = anillo(c, p.th); p.meta = cubierto(c, p, yo, otro);
    }
    p.t += dt;
    const choca = otro !== null && dAng(p.meta.th, otro) < G.pie.aparte;
    if (!p.camina && p.t > 0.5 && (choca || !aCubierto(c, p.bajado.x, p.bajado.y, G.cuerpo.agachado, yo))) { p.meta = cubierto(c, p, yo, otro); p.t = 0; }
    p.camina = !andar(c, p, dt);
    if (!p.camina) p.mira = Math.atan2((yo.y - p.bajado.y) / PROF, yo.x - p.bajado.x);
  }
  /** Si James está del lado `lado` de la carreta (1: el del escopetero, a la derecha; -1: el del conductor). */
  const deMiLado = (c, yo, lado) => ((yo.x - c.x) * -c.dy + ((yo.y - c.y) / PROF) * c.dx) * lado * Math.sign(G.escopetero.lado) > 0;
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
    if (!si) { if (e.vuelve) { e.vuelve = false; e.sube = false; e.plan = 'cubrirse'; e.meta = reparo(c, e, james()); } return false; }
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
    // (🔁 2026-11-27: el Winchester carga de a una: con dos que le faltan tarda dos de diez, no todo. La escopeta, de dos
    // cartuchos, siempre lo mismo.)
    e.recarga = e.recargaTotal = A.cargador > 2 ? A.recarga * Math.max(0.3, (A.cargador - e.balas) / A.cargador) : A.recarga;
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
  const alcance = (c) => alcanceDe(de(c).arma) / M;

  /** 💥 Un tiro tuyo en (x, y): lo oyen los que están a menos de `oye`. */
  function oirTiro(x, y) {
    // (🔁 Un tiro que oye ya alerta también renueva la amenaza —`avisar`—: antes sólo el primero contaba.)
    for (const c of carretas.activas) if (Math.hypot(c.x - x, (c.y - y) / PROF) < G.oye * M) { alertar(c); if (tiene(c)) de(c).avisar = true; }
  }

  /**
   * Cada cuadro. `apuntando`, `mira`: tu clic derecho y dónde está; `empuna`: si tienes el arma afuera (0 a 1);
   * `parada(c)`: si la carreta está frenada por ti o con el conductor muerto.
   */
  let quieto = 0, quietoEn = null;
  function actualizar(dt, { apuntando, mira, empuna, parada }) {
    if (!G.activa) return;
    reloj += dt;
    const yo = james();
    // (Cuánto hace que James no se mueve: para que lo flanqueen si se planta.)
    if (quietoEn && Math.hypot(yo.x - quietoEn.x, (yo.y - quietoEn.y) / PROF) < 0.5 * M) quieto += dt; else { quieto = 0; quietoEn = { x: yo.x, y: yo.y }; }
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
      // 🔁 (2026-11-27, Santi: "recarga enfrente mío, lo que lo deja desprotegido".) A pie, la recarga avanza sólo escondido:
      // si tiene que moverse, la deja y la sigue cuando llega a cubierto. Antes empezaba a cargar al quedarse sin balas,
      // parado y a la vista.
      if (e.recarga > 0 && (!e.bajado || e.plan === 'escondido')) { e.recarga -= dt; if (e.recarga <= 0) e.balas = A.cargador; }
      // (🪨 Lo acosado se le pasa de a poco: uno cada `roca.calma` segundos.)
      if (e.acosado) e.acosado = Math.max(0, e.acosado - dt / G.pie.roca.calma);
      // 🔙 Volviendo al pescante (se terminó la defensa): camina por el anillo hasta su lado y se sube.
      if (e.bajado && e.vuelve) {
        e.camina = true; e.oculto = false; e.apunta = 0; e.plan = null; e.meta = { th: thAsiento(1), k: 1 };
        // (🔁 Del anillo al asiento caminando, no de un salto: `e.sube`.)
        if (e.sube || andar(c, e, dt)) {
          e.sube = true;
          const S = asiento(c);
          if (recta(e, S.x, S.y, dt, false)) { e.bajado = null; e.vuelve = false; e.sube = false; e.camina = false; e.subio = true; }
        }
        continue;
      }
      if (!parada(c)) e.subio = false;
      // (Si la carreta sigue —la soltaste—, se vuelve a subir: no se queda a pie en el medio del campo.)
      if (e.bajado && !parada(c)) { e.bajado = null; e.camina = false; e.oculto = false; e.apunta = 0; e.plan = null; e.sitio = null; e.enCamino = false; e.salta = e.sube = false; e.via = null; e.flanquea = false; e.acosado = 0; e.heridoEspera = 0; }
      // (3) Bajarse: con la carreta parada.
      // (🔁 Con la carreta casi quieta —`ritmo`: ahora frena de a poco—: si no, se bajaba y se iba deslizando con ella.)
      if (!e.bajado && parada(c) && !e.subio && (!c.anda || (c.ritmo ?? 1) < 0.4)) {
        // (Se baja por su lado del pescante, al anillo, y va a cubrirse.)
        // (🔁 Si estás de su lado, salta por el otro. 🔁 Y baja caminando desde el asiento: `e.salta`.)
        e.th = thAsiento(deMiLado(c, yo, 1) ? -1 : 1); e.k = 1; e.sitio = null; e.enCamino = false; e.via = null;
        const S = asiento(c);
        e.bajado = { x: S.x, y: S.y }; e.salta = true;
        e.plan = 'cubrirse'; e.meta = reparo(c, e, yo); e.oculto = false; e.t = 0;
      }
      if (e.bajado) {
        e.t += dt;
        // Camina por el anillo (a cubrirse o a asomarse), de pie y a la vista.
        if (e.plan === 'cubrirse' || e.plan === 'asomarse') {
          e.camina = true; e.oculto = false;
          // (🔁 2026-11-27: asomándose, se para apenas te tiene a tiro —nada en el medio y le llega el arma—, no recién
          // en el punto elegido: antes seguía caminando a la vista hasta allá.)
          const yaTeTiene = e.plan === 'asomarse' && !e.salta && tiroLimpio(e.bajado.x, e.bajado.y, yo)
            && Math.hypot(yo.x - e.bajado.x, (yo.pecho - (e.bajado.y - G.cuerpo.pecho * M)) / PROF) < alcanceDe(e.arma);
          if (!andar(c, e, dt) && !yaTeTiene) continue;
          e.camina = false; e.t = 0;
          // (🔁 Revisión con un juez: si no hay dónde taparse y llegó a la vista, no se agacha a cargar enfrente tuyo:
          // te tira si te tiene a tiro.)
          if (e.plan === 'cubrirse' && e.balas > 0 && !aCubierto(c, e.bajado.x, e.bajado.y, G.cuerpo.agachado, yo) && tiroLimpio(e.bajado.x, e.bajado.y, yo)
            && Math.hypot(yo.x - e.bajado.x, (yo.pecho - (e.bajado.y - G.cuerpo.pecho * M)) / PROF) < alcanceDe(e.arma)) {
            e.plan = 'tirar'; e.tiros = 0; e.oculto = false; e.flanquea = false;
            e.apunta = A.apuntar * G.apuntar - ((G.pie.primerTiro || {})[e.arma] ?? 0.5);
            continue;
          }
          if (e.plan === 'cubrirse') {
            e.plan = 'escondido'; e.oculto = true;
            e.espera = G.pie.escondido[0] + Math.random() * (G.pie.escondido[1] - G.pie.escondido[0]) + (e.heridoEspera || 0);
            e.heridoEspera = 0;
            // (🔀 Llegó a la otra esquina flanqueando: se asoma enseguida, por donde no lo esperas.)
            if (e.flanquea) { e.espera = 0.2; e.flanquea = false; }
            if (e.balas < A.cargador) recargar(e, A);   // (escondido, aprovecha para cargar)
          } else {
            // (🔁 Llega con el tiro casi listo: apuntaba escondido. Antes empezaba a apuntar recién ahí.)
            e.plan = 'tirar'; e.tiros = 0;
            e.apunta = A.apuntar * G.apuntar - ((G.pie.primerTiro || {})[e.arma] ?? 0.5);
          }
          continue;
        }
        // Escondido, agachado: si te moviste y ahora lo ves, se va a otro lado; si no, espera (y termina de cargar).
        if (e.plan === 'escondido') {
          if (e.t > 0.3 && !aCubierto(c, e.bajado.x, e.bajado.y, G.cuerpo.agachado, yo)) {
            // (🔁 Lo flanqueaste y te ve: primero te tira uno desde ahí, si llega y tiene balas; después cambia de lado.
            // Antes se paraba y caminaba a otro reparo sin tirar.)
            if (e.balas > 0 && e.recarga <= 0 && tiroLimpio(e.bajado.x, e.bajado.y, yo) && Math.hypot(yo.x - e.bajado.x, (yo.pecho - (e.bajado.y - G.cuerpo.pecho * M)) / PROF) < alcanceDe(e.arma)) {
              e.plan = 'tirar'; e.t = 0; e.oculto = false; e.tiros = G.pie.rafaga - 1;
              e.apunta = A.apuntar * G.apuntar - ((G.pie.primerTiro || {})[e.arma] ?? 0.5);
            } else { acosar(e); e.plan = 'cubrirse'; e.meta = reparo(c, e, yo); }
            continue;
          }
          if (e.balas < A.cargador && e.recarga <= 0) recargar(e, A);
          // (Cargando, espera a terminar sólo si no le alcanzan las balas para una ráfaga: si no, deja y se asoma.)
          if (e.t < e.espera || (e.recarga > 0 && e.balas < G.pie.rafaga)) continue;
          // (🔀 Si te plantaste cerca, va por detrás de la carreta a la otra esquina y se asoma desde ahí: el flanco.)
          if (!e.sitio && !e.enCamino && quieto > G.pie.flanquea && d < G.pie.flanqueaA) {
            const f = esquinaOpuesta(c, e, yo);
            quieto = 0;
            if (f) { e.plan = 'cubrirse'; e.meta = f; e.flanquea = true; continue; }
          }
          const m = asomo(c, e, yo, alcanceDe(e.arma));
          if (!m) {
            // (🪨 Desde la piedra ya no te puede tirar por ningún lado —te moviste—: vuelve a la carreta.)
            if (e.sitio) { const q = cubierto(c, e, yo, null, true, true); if (q) { e.plan = 'cubrirse'; e.meta = q; continue; } }
            e.t = 0; continue;   // (no hay de dónde verte: espera)
          }
          e.plan = 'asomarse'; e.meta = m; e.oculto = false;
          e.recarga = 0;   // (deja de cargar: sale con las que tiene)
          continue;
        }
        // Asomado, de pie: te apunta y tira `rafaga` tiros; sin balas, si dejó de verte o pasado `asomadoMax`, a cubrirse.
        if (e.balas <= 0 || e.tiros >= G.pie.rafaga || e.t > G.pie.asomadoMax || !tiroLimpio(e.bajado.x, e.bajado.y, yo)) {
          e.plan = 'cubrirse'; e.meta = reparo(c, e, yo);
          continue;
        }
      }
      // (2) Tirar (desde el asiento, o asomado): apunta `A.apuntar` segundos y tira, si llega.
      const p = pecho(c, e);
      if (!p) continue;
      e.mira = Math.atan2(yo.pecho - p.y, yo.x - p.x);
      // (🔁 Revisión con un juez: sentado, si empezó a cargar lejos y te acercas, tira con las que le quedan.)
      if (!e.bajado && e.recarga > 0 && e.balas > 0 && Math.hypot(yo.x - p.x, (yo.pecho - p.y) / PROF) <= alcanceDe(e.arma)) e.recarga = 0;
      if (e.balas <= 0 || e.recarga > 0) continue;
      // (🔁 La distancia de verdad, desachatada, como la tuya: antes, arriba y abajo llegaba un 66 % más lejos.)
      // (🔁 2026-11-27: sentado y sin alcanzarte, aprovecha para cargar. Antes, escapando con una bala de dos, la guardaba
      // para siempre.)
      if (Math.hypot(yo.x - p.x, (yo.pecho - p.y) / PROF) > alcanceDe(e.arma)) { e.apunta = 0; if (!e.bajado && e.balas < A.cargador) recargar(e, A); continue; }
      e.apunta += dt;
      if (e.apunta < A.apuntar * G.apuntar) continue;
      // (Lo que tarda en volver a tener el tiro. 🔁 Asomado, la pausa del arma entre dos tiros —`rafagaPausa`—: antes
      // volvía a apuntar desde el principio, y entre tiro y tiro quedaba 2 o 3 s parado a la vista.)
      e.apunta = e.bajado ? A.apuntar * G.apuntar - (A.rafagaPausa ?? 0.6) : -A.cadencia * G.cadencia;
      tirar(c, e, p, yo, A);
    }
    moverBalas(dt);
  }

  function tirar(c, e, p, yo, A) {
    e.balas -= 1;
    e.tiros = (e.tiros || 0) + 1;
    if (e.balas <= 0 && !e.bajado) recargar(e, A);   // (a pie, recarga recién a cubierto)
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
    // (🪨 `sx`, `sy`, `largo`, `alto`: para la piedra —ver `piedraEnElTiro` en scenes/campoScene.js—: siempre te tiran a ti.)
    const J = james(), largo = Math.hypot(J.x - p.x, J.pecho - p.y);
    const sale = (a, danio, perdigon) => balas.push({ x: p.x, y: p.y, vx: Math.cos(a) * A.velocidadBala, vy: Math.sin(a) * A.velocidadBala, recorrido: 0, alcance: alcanceDe(armaId), danio, perdigon, aPie, de, sx: p.x, sy: p.y, largo, alto: !aPie });
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
      // 🪨 (Una piedra en el medio: la bala llega hasta ahí.)
      const pi = piedra(x0, y0, b.x, b.y, b), fx = pi ? pi.x : b.x, fy = pi ? pi.y : b.y;
      // ¿Te pega? (en este tramo)
      const u = tocaCuerpo(x0, y0, fx, fy, yo.columna), pega = u !== null;
      const hx = pega ? x0 + (fx - x0) * u : fx, hy = pega ? y0 + (fy - y0) * u : fy;
      // La carreta en el medio: la lona siempre; la madera si él está a pie, como a ti *(memoria: lo que golpea vale
      // igual para todos)*. 🔁 Antes, sólo si tú estabas agachado: él te pegaba a través de la carreta y tú a él no.
      const t = carretas.tela(x0, y0, hx, hy, b.aPie, b.de);
      if (t) { b.fin = true; audio.play('hitWall'); continue; }
      if (pega) { b.fin = true; herirJames(b.danio, b.perdigon); }
      else if (pi) { b.fin = true; audio.play('hitWall'); }
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
      // 🧺 (Sentado: la lona de otra carreta en el medio, o la suya si estás detrás del pescante, la para.)
      if (!e.bajado) {
        const t = carretas.tela(x0, y0, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, false, null), J = james(), s = carretas.asiento(c);
        if (t && t.que === 'tela' && (t.c.id !== c.id || (J.x - s.x) * c.dx + ((J.y - s.y) / PROF) * c.dy < 0)) continue;
      }
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
    if (e.vida > 0) {
      // (🔁 Herido a pie, a cubierto ya, y espera más antes de volver a asomarse. Antes seguía asomado con su ráfaga.)
      if (e.bajado && !e.vuelve) { acosar(e); e.flanquea = false; e.plan = 'cubrirse'; e.meta = reparo(c, e, james()); e.heridoEspera = G.pie.herido; }
      return 'escopetero';
    }
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

  /**
   * 🔁 (2026-11-27, Santi: "se buguea con la carreta".) Delante o detrás de la carreta: según de qué lado de su eje esté,
   * no según su altura comparada con el medio de ella. En diagonal, uno parado al costado de adelante quedaba "más al
   * norte" que el medio y se dibujaba debajo de la carreta, metido adentro.
   */
  function ordenJunto(c, p) {
    const H = C.huella, ex = (p.x - c.x) / M, ey = (p.y - c.y) / M / PROF;
    const a = ex * c.dx + ey * c.dy, b = -ex * c.dy + ey * c.dx;
    if (Math.abs(b) > G.pie.ancho + 1 || a < -H.atras - 1.5 || a > H.adelante + 1.5) return p.y;
    const ac = Math.max(-H.atras, Math.min(H.adelante, a));
    return c.y + (p.y - (c.y + c.dy * ac * M * PROF)) + 0.01;
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
      out.push({ y: ordenJunto(c, e.bajado), draw: () => {
        const nuevo = { arma: e.arma, empuna: e.oculto || e.camina ? 0 : 1, funda: false, aspecto: aspectoDe(e, 'guardia') };
        if (e.oculto && !e.camina) nuevo.piernas = 'agachado'; else if (!e.camina) nuevo.piernas = 'quieto';
        const fig = dibujarPersona(r, { tipo: 'guardia', x: e.bajado.x, pies: e.bajado.y, angulo: e.mira, interior: true, luz: noche ? -1 : 0, fase: e.camina ? e.fase / 4 : null, modo: 'caminar', nuevo });
        // (El tambor que se llena, sólo mientras carga de verdad: escondido. Caminando, la carga está en pausa.)
        if (e.recarga > 0 && e.plan === 'escondido' && fig) dibujarAviso(r, e.bajado.x, fig.arriba, 'recarga', 1 - e.recarga / (e.recargaTotal || 1));
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
    reiniciar() { balas = []; for (const k of Object.keys(gente)) delete gente[k]; quieto = 0; quietoEn = null; },
    /** Para probar desde la consola. */
    get gente() { return gente; }, get balas() { return balas; }, aCubierto, tiroLimpio, detras,
  };
}
