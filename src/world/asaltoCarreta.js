/**
 * 🛞🔫 ASALTAR UNA CARRETA (etapa 4 del campo con vida, paso 2; los números en CAMPO.carretas.asalto, data/campo.js)
 * *(Santi, 2026-11-25: "pasemos a lo siguiente, el paso 2 de la carreta"; "arrancá con tus numeros y los guardias para
 * el 2B")*.
 *
 * CÓMO SE HACE:
 *  1. **Frenarla**: le apuntas al conductor (clic derecho, con la mira encima de él) desde menos de `frena.metros`
 *     durante `frena.apuntar` segundos. Grita "¡Alto!", frena, **se baja** y se queda parado al costado, del lado
 *     tuyo, con las manos arriba *(Santi, 2026-11-26: "se me hace muy difícil matar al colono en la carreta cuando no
 *     me está viendo"; eligió que se baje)*: así se lo ve desde cualquier lado.
 *  2. **Robarla**: cerca de ella, [E]: la plata del conductor, la de los pasajeros (la diligencia: bajan en fila detrás
 *     del cochero), la carga (comida en la de colonos, bultos de mercadería en
 *     la de carga), el cofre de la paga (la de la mina yendo a la mina) o la caja del correo (la diligencia), que se
 *     fuerzan en `cofre.forzar` segundos, al lado
 *     de la carreta), o dejarlo ir. La plata (también la del cofre y la del correo) va directo a tu bolsillo; la carga
 *     (comida, bultos, mineral) va en el caballo hasta el campamento, y si caes preso se pierde.
 *  3. **Si te vas** (más lejos que `frena.cerca` y sin apuntarle) durante `frena.suelta` segundos, se sube y sigue su
 *     camino. Al seguir, apura a los caballos (`CAMPO.carretas.susto`).
 *  4. **Las cuentas, al terminar** (ver `cuentas`): si quedó alguien que te vio —el conductor o el escopetero vivos, o
 *     alguien de otra carreta que pasaba cerca—, sube la recompensa y la fama. Sin testigos, nada. Matar al conductor
 *     baja el honor siempre (lo sabes tú).
 * El escopetero (las de carga y de mina; world/escopeteros.js) y la escolta a caballo (la de la mina; world/escolta.js)
 * pelean: ver ahí.
 * Cada viaje se roba una sola vez: queda anotado en la partida (`carretasAsaltadas`), con su conductor muerto si lo
 * mataste (entonces la carreta queda parada donde estaba).
 *
 * ⚠️ DIBUJO: el conductor es el pasajero del tren (sentado en el pescante; bajado, de pie con las manos arriba).
 * 🔁 (Decía que el de verdad lo dibujaba Santi: no. *Santi: "yo nunca dibujé ni voy a dibujar personas"*.)
 */
import { dibujarPersona, tendidoNuevo } from '../entities/figura.js';
import { aspectoDe } from '../entities/estiloNuevo/gente.js';
import { crearEscopeteros } from './escopeteros.js';
import { crearEscolta } from './escolta.js';
import { columnaDe, tocaCuerpo, enCuerpo } from './cuerpos.js';

function hash(a, b) {
  let h = 0;
  for (const ch of String(a)) h = Math.imul(h ^ ch.charCodeAt(0), 2654435761);
  h = Math.imul(h ^ (b * 374761393), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const entre = ([a, b], u) => Math.round(a + (b - a) * u);

/**
 * `carretas` (world/carretas.js), `C` (CAMPO.carretas), `PROF`, `g()` (gameState), `decir`, `menu`, `TC` (los textos
 * del campo), `audio`, `subirFama` (systems/historia.js), `james()` y `herirJames()` (ver world/escopeteros.js).
 */
export function crearAsaltoCarreta({ carretas, C, PROF, g, decir, menu, TC, audio, subirFama, james, herirJames, galope, libre, pueblos = () => [], piedra = () => null, rocas = () => [] }) {
  const A = C.asalto, M = carretas.POR_METRO, T = TC.carreta;
  /** El asalto de ahora: { id, fase: 'apunta' | 'frenada', t, suelta, tomoPlata, tomoCarga, tomoCofre, testigos, mato, bajado, forzando }. */
  let asalto = null;
  /**
   * 🛡️ Las carretas que se defienden (ver `guardias.defensa` en data/campo.js): { id: { t, frenada, cond } }. `cond`: el
   * conductor bajado y escondido (lo mueve world/escopeteros.js, `cubrir`). `amenaza`: cuándo la amenazaste por última
   * vez (en el reloj de acá), y `golpe`: si le pegaste a ella o a su gente. No se guardan: si te vas, se calman.
   */
  const defensas = {}, amenaza = {}, golpe = {}, gritos = {};
  /**
   * 🚶 VOLVIENDO A SUBIR, terminado el asalto (🔁 2026-11-27, Santi: "los pasajeros desaparecen al terminar el asalto"):
   * por carreta, { cond, lado, pasajeros }. El conductor camina hasta el pie de su asiento y se sube; los pasajeros, hasta
   * la puerta. La carreta los espera (`retiene`). Antes, al terminar, desaparecían todos y él aparecía sentado.
   */
  const volviendo = {};
  let reloj = 0;
  /**
   * 🏃 Una que escapó llegó al pueblo: te denuncia (como un testigo de un robo: `cuentas.recompensa` y la fama de su
   * tipo). Si ya la robaste o mataste al conductor, eso ya se contó.
   */
  carretas.alLlegar = (c, destino, SU) => {
    const E = estados()[c.id] || {};
    if (E.robada || E.muerto) return;
    // 🔁 (Sólo si la amenazaste o le pegaste: si escapó porque le tapabas el camino, llega y no tiene de qué acusarte.
    // Revisión: pasar a caballo por el camino te costaba +150.)
    if (!SU || SU.motivo !== 'amenaza') return;
    // (🔁 Revisión: costaba lo mismo que robarla —y daba su fama— sin llevarte nada: `cuentas.denuncia`.)
    const K = A.cuentas, G = g(), D = K.denuncia || {}, fama = D.fama ?? (K.fama[c.tipo] || 0), n = D.recompensa ?? recompensaDe(c.tipo);
    G.bounty = (G.bounty || 0) + n;
    if (fama > 0) subirFama(G, fama, { conRecompensa: false });
    decir(T.denuncia(T.titulo[c.tipo] || T.titulo.carga, destino.nombre, n), 4.5);
  };
  /** 🔁 La recompensa por robar cada tipo (revisión: era 150 para todas; robar a unos colonos por $17 costaba lo mismo). */
  /** 🔁 La clave de cada carreta para el botín y las cuentas: la de la mina de vuelta es otra (`minaVuelta`). */
  const claveDe = (c) => (c && c.tipo === 'mina' && c.dibujo !== 'minaIda' ? 'minaVuelta' : c ? c.tipo : 'carga');
  const recompensaDe = (tipo) => (typeof A.cuentas.recompensa === 'object' ? A.cuentas.recompensa[tipo] ?? A.cuentas.recompensa.carga : A.cuentas.recompensa);

  /** La cara y la ropa de cada conductor (se sortean una vez por viaje). */
  const conductores = {};

  const estados = () => carretas.estados();
  const estadoDe = (id) => estados()[id] || (estados()[id] = {});
  const buscar = (id) => carretas.activas.find((c) => c.id === id) || null;
  const lejos = (c, yo) => Math.hypot(c.x - yo.x, (c.y - yo.y) / PROF) / M;

  const hoy = () => (g().tiempo ? g().tiempo.dia : 0);
  const escopeteros = crearEscopeteros({ carretas, C, PROF, audio, decir, T, james, herirJames, hoy, piedra, rocas, libre });
  /** 🐎 La escolta a caballo (la de la mina; world/escolta.js). */
  const escolta = crearEscolta({ carretas, C, PROF, audio, james, escopeteros, galope, libre, hoy });

  /** Lo que lleva cada viaje: siempre lo mismo para el mismo viaje. */
  function botinDe(c) {
    const B = A.botin[claveDe(c)] || A.botin[c.tipo] || A.botin.carga;
    return {
      mineral: !!B.mineral,
      plata: entre(B.plata, hash(c.id, 1)),
      comida: B.comida || 0,
      bultos: Array.from({ length: B.bultos || 0 }, (_, i) => entre(B.valor, hash(c.id, 10 + i))),
      // (el cofre de la paga: sólo yendo a la mina)
      // (el cofre de la paga yendo a la mina; la caja del correo de la diligencia)
      cofre: B.cofre && (c.dibujo === 'minaIda' || c.tipo === 'diligencia') ? entre(B.cofre, hash(c.id, 3)) : 0,
      // (🧳 los pasajeros de la diligencia: cuántos, y lo que llevan entre todos)
      pasajeros: B.pasajeros ? entre(B.pasajeros, hash(c.id, 4)) : 0,
      // (Lo de cada uno: si matas a alguno, lo suyo no te lo da nadie.)
      porPasajero: B.pasajeros ? Array.from({ length: entre(B.pasajeros, hash(c.id, 4)) }, (_, i) => entre(B.porPasajero, hash(c.id, 20 + i))) : [],
    };
  }
  /** 🧳 Lo que llevan los pasajeros que siguen vivos (todos, si todavía no bajaron), y cuántos son. */
  function dePasajeros(c, b) {
    const muertos = (estados()[c.id] || {}).pasajerosMuertos || [];
    const vivos = b.porPasajero.filter((_, i) => !muertos.some((m) => m.i === i) && !(asalto && asalto.pasajeros && asalto.pasajeros[i] && asalto.pasajeros[i].muerto));
    return { n: vivos.length, plata: vivos.reduce((s, x) => s + x, 0) };
  }

  /** El pescante del conductor: al medio, o a la izquierda si lleva escopetero. */
  const asientoDe = (c) => carretas.asiento(c, escopeteros.lleva(c) ? -C.guardias.escopetero.lado : 0);
  /** Bajado (la frenaste): dónde está parado. */
  const bajadoDe = (c) => {
    if ((estados()[c.id] || {}).muerto) return null;
    if (asalto && asalto.id === c.id && asalto.bajado) return asalto.bajado;
    if (volviendo[c.id] && volviendo[c.id].cond) return volviendo[c.id].cond;
    const D = defensas[c.id];
    return D && D.cond.bajado ? D.cond.bajado : null;
  };
  /** Si se está defendiendo y el conductor ya se bajó a esconderse. */
  const escondido = (c) => !!(defensas[c.id] && defensas[c.id].cond.bajado) && !(estados()[c.id] || {}).muerto;

  /** El pecho del conductor (para apuntarle y para que lo alcance la bala), en el mundo. */
  function pecho(c) {
    const b = bajadoDe(c);
    if (b) return { x: b.x, y: b.y - A.conductor.pechoDePie * M };
    const S = asientoDe(c);
    return { x: S.x, y: S.y - (S.alto + A.conductor.pecho) * M };
  }

  /** 🎯 La columna del conductor (world/cuerpos.js): sentado en el pescante, o de pie si se bajó. */
  function cuerpoConductor(c) {
    const b = bajadoDe(c), K = C.guardias.columna;
    if (escondido(c)) return columnaDe(b.x, b.y, defensas[c.id].cond.camina ? 'pie' : 'agachado', K, M);
    if (b) return columnaDe(b.x, b.y, 'pie', K, M);
    const S = asientoDe(c);
    return columnaDe(S.x, S.y - S.alto * M, 'sentado', K, M);
  }

  /** Bajarse: al costado del pescante, del lado donde estás tú. */
  function bajar(c, yo, donde = null) {
    const S = asientoDe(c), px = -c.dy, py = c.dx;
    // (Del lado tuyo; o, si ya estaba abajo —escondido, defendiéndose—, del lado donde estaba.)
    const de = donde || yo;
    const lado = Math.sign(px * (de.x - c.x) + py * (de.y - c.y) / PROF) || 1;
    // (A cuánto se baja: el de la carreta, o el de su tipo —la diligencia, más ancha, más lejos—.)
    const baja = ((A.conductor.de || {})[c.tipo] || {}).bajado ?? A.conductor.bajado;
    const alPie = { x: S.x + px * lado * baja * M, y: S.y + py * lado * baja * M * PROF };
    // (`donde`: se rinde ahí mismo. Los pasajeros igual bajan al pie de la puerta de ese lado: si salieran en fila desde
    // donde estaba él —en una punta—, alguno quedaba adentro de la diligencia.)
    asalto.bajado = donde ? { x: donde.x, y: donde.y } : alPie;
    // (🚶 Si los frenas de nuevo mientras volvían a subir, se quedan donde estaban: no saltan a la fila.)
    const V = volviendo[c.id];
    delete volviendo[c.id];
    if (V && V.cond && !donde) asalto.bajado = { x: V.cond.x, y: V.cond.y };
    // 🧳 Los de la diligencia bajan también: en fila detrás del cochero, del mismo lado, con las manos arriba.
    const n = botinDe(c).pasajeros;
    const muertos = (estados()[c.id] || {}).pasajerosMuertos || [];
    asalto.pasajeros = Array.from({ length: n }, (_, i) => {
      const v = V && V.pasajeros.find((p) => p.i === i && !p.adentro && !p.muerto);
      if (v) return { i, x: v.x, y: v.y, ent: v.ent };
      // (🔁 Los que mataste antes siguen muertos donde cayeron: antes, al volver a frenarla, bajaban todos vivos.)
      const m = muertos.find((o) => o.i === i);
      if (m) return { i, x: m.x, y: m.y, muerto: true, ent: conductores[c.id + '|' + i] || (conductores[c.id + '|' + i] = {}) };
      // (Escalonados: uno más afuera y uno más adentro, así de atrás o de frente no quedan encimados.)
      const atras = (i + 1) * A.pasajeros.entre * M, afuera = (i % 2 ? A.pasajeros.afuera : 0) * M * lado;
      return { i, x: alPie.x - c.dx * atras + px * afuera, y: alPie.y + (-c.dy * atras + py * afuera) * PROF, ent: conductores[c.id + '|' + i] || (conductores[c.id + '|' + i] = {}) };
    });
  }

  /** Tapado por la lona: la de los colonos yendo hacia el fondo, con el conductor sentado. */
  const tapado = (c) => c.tipo === 'colono' && c.vista.startsWith('nor') && !bajadoDe(c);

  function apuntaA(c, mira) {
    // (Yendo hacia el fondo, la lona lo tapa entero: alcanza con apuntarle a la carreta, a la altura de la lona. Sólo la
    // de los colonos tiene lona: a las otras se lo ve de espaldas.)
    if (tapado(c)) return Math.hypot(mira.x - c.x, mira.y - (c.y - A.conductor.lona * M)) < A.conductor.lonaMira * M;
    const p = pecho(c);
    if (Math.hypot(mira.x - p.x, mira.y - p.y) < A.conductor.mira * M) return true;
    // (🔁 O a la carreta entera: un arma apuntándole a su carreta es una amenaza. Antes, sólo un círculo en el pecho, y a
    // pie la mira se le salía mientras la carreta seguía andando.)
    const K = A.conductor.carreta;
    return !!K && Math.hypot(mira.x - c.x, (mira.y - (c.y - K.alto * M)) / K.aplasta) < K.radio * M;
  }

  /**
   * Cada cuadro, después de mover las carretas. `apuntando`: si tienes el clic derecho; `mira`: dónde está, en el mundo;
   * `empuna`: si tienes el arma afuera (para los escopeteros).
   */
  function actualizar(dt, { yo, apuntando, mira, empuna = 0 }) {
    if (!A.activa) return;
    reloj += dt;
    defender(dt, yo);
    const parada = (c) => retiene(c) || !!(estados()[c.id] || {}).muerto;
    escopeteros.actualizar(dt, { apuntando, mira, empuna, parada });
    escolta.actualizar(dt, { apuntando, mira, empuna, parada });
    subirse(dt);
    if (asalto) {
      const c = buscar(asalto.id);
      if (!c) { terminar(); return; }
      // (Testigo: alguien de otra carreta que pasa cerca mientras dura.)
      // (🔁 Una carreta con el conductor muerto no ve nada.)
      if (!asalto.testigos && carretas.activas.some((o) => o.id !== c.id && !(estados()[o.id] || {}).muerto && Math.hypot(o.x - c.x, (o.y - c.y) / PROF) < A.cuentas.testigoA * M)) {
        asalto.testigos = true;
        // (🔁 Que se sepa: antes te veían a 90 m sin aviso.)
        if (asalto.fase === 'frenada') decir(T.teVieron, 3);
      }
      const d = lejos(c, yo), apunta = apuntando && d < A.frena.metros && apuntaA(c, mira);
      if (asalto.fase === 'apunta') {
        // (🔁 Salirse un momento baja la cuenta a la mitad de rápido, y se borra recién tras `perdona` segundos sin apuntarle.)
        if (apunta) { asalto.t += dt; asalto.sin = 0; } else { asalto.t = Math.max(0, asalto.t - dt * 0.5); asalto.sin = (asalto.sin || 0) + dt; }
        if (asalto.sin > A.frena.perdona) { asalto = null; return; }
        if (asalto.t >= A.frena.apuntar) { asalto.fase = 'frenada'; asalto.suelta = 0; bajar(c, yo); decir(T.alto, 3); audio.play('cock'); }
        return;
      }
      // 🔐 Forzando el cofre (`cofre.forzar` segundos) o tomando otra cosa (`tomar`): al lado de la carreta, con el mundo
      // andando. 🔁 (Revisión: con el menú abierto todo se congela, también las balas: robar bajo fuego no costaba nada.)
      if (asalto.forzando) {
        const F = asalto.forzando;
        if (d > A.usarA) { asalto.forzando = null; decir(F.que === 'cofre' ? T.dejasteElCofre : T.dejasteAMedias, 2.5); }
        else if ((F.t += dt) >= F.dura) {
          asalto.forzando = null;
          if (F.que === 'cofre') {
            const n = botinDe(c).cofre;
            asalto.tomoCofre = true;
            g().money += n;
            decir(T.forzaste(n), 3); audio.play('loot');
            usar(c, asalto.carga);   // (🔁 como lo demás: vuelve el menú con lo que queda)
          } else { tomar(c, F.que); usar(c, asalto.carga); }
        }
      }
      // Frenada: la tienes mientras le apuntas o estás al lado. Si no, a los `suelta` segundos sigue. (Rendida porque
      // mataste a sus guardias, quizás de lejos: más tiempo para llegar, `sueltaRendido`.)
      asalto.suelta = apunta || d < A.frena.cerca ? 0 : asalto.suelta + dt;
      // (🔁 Te avisa antes de irse, con la barrita: antes se iba sin aviso y lo que quedaba se perdía.)
      if (asalto.suelta >= A.frena.aviso && !asalto.avisoSeVa) { asalto.avisoSeVa = true; decir(T.seVa, 3); }
      if (asalto.suelta <= 0) asalto.avisoSeVa = false;
      if (asalto.suelta >= (asalto.rendida ? A.frena.sueltaRendido : A.frena.suelta)) terminar();
      return;
    }
    if (!apuntando) return;
    for (const c of carretas.activas) {
      const E = estados()[c.id];
      // 🔁 (Ya no pide que ande: parada porque le cortaste el camino, o de noche, también se le apunta. Revisión:
      // cortarle el paso y apuntarle no hacía nada.)
      if (E && (E.robada || E.muerto)) continue;
      // (🔁 Le apuntas pero estás lejos: te lo dice, una vez cada tanto.)
      if (lejos(c, yo) >= A.frena.metros && lejos(c, yo) < A.frena.metros * 2.5 && apuntaA(c, mira)) {
        if (!(reloj - (gritos.lejos ?? -1e9) < 4)) { gritos.lejos = reloj; decir(T.muyLejos, 2); }
        continue;
      }
      if (lejos(c, yo) < A.frena.metros && apuntaA(c, mira)) {
        // 🔁 Con guardias vivos, apuntarle al conductor no lo rinde: es una amenaza, y se defienden (o la diligencia escapa).
        // Antes se bajaba con las manos arriba con el escopetero vivo y peleando.
        if (escopeteros.vivo(c) || escolta.vivos(c)) {
          amenazar(c); escopeteros.alertar(c); escolta.alertar(c.id);
          // (Y el conductor lo dice, una vez cada tanto: que se entienda por qué no se rinde.)
          if (!(reloj - (gritos[c.id] ?? -1e9) < C.guardias.defensa.calma)) { gritos[c.id] = reloj; decir((T.niLoSuenesPor || {})[c.tipo] || T.niLoSuenes, 2.5); }
          continue;
        }
        asalto = { id: c.id, fase: 'apunta', t: dt, suelta: 0, testigos: false };
        return;
      }
    }
  }

  /**
   * 🛡️ DEFENDERSE (`guardias.defensa`): las carretas con guardias que amenazaste frenan si estás adelante o si les
   * pegaste; las otras escapan (eso ya lo hace el susto, world/carretas.js). Frenadas, el escopetero baja a pelear
   * (world/escopeteros.js: la carreta está `parada`) y el conductor se esconde. Sin guardias vivos, se rinde.
   */
  function defender(dt, yo) {
    const K = C.guardias.defensa;
    for (const c of carretas.activas) {
      const E = estados()[c.id] || {}, D = defensas[c.id];
      const guardias = escopeteros.vivo(c) || escolta.vivos(c);
      // (Muerto el conductor, robada, o en un asalto tuyo: no hay defensa que valga.)
      if (E.muerto || E.robada || (asalto && asalto.id === c.id)) { delete defensas[c.id]; continue; }
      // (Le apuntaste o te vio con el arma: el escopetero se alertó. Cuenta como amenaza, cada vez que se alerta de nuevo.
      // 🔁 Antes de mirar si escapa: si no, la diligencia que se enteraba así frenaba a defenderse en vez de escapar.)
      const g0 = escopeteros.gente[c.id];
      if (g0 && g0.avisar) { g0.avisar = false; amenaza[c.id] = reloj; }
      const reciente = amenaza[c.id] != null && reloj - amenaza[c.id] < K.calma;
      // 🏃 Las que escapan (`huida.tipos`, la diligencia), de día: si te pones delante, o la amenazas estando adelante, o
      // le pegas, se sale del camino y va al pueblo (world/carretas.js, `soltar`). Si se traba, frena y se defiende.
      if (C.huida.tipos.includes(c.tipo) && c.deDia) {
        if (!carretas.suelta(c.id)) {
          const vx0 = yo.x - c.x, vy0 = (yo.y - c.y) / PROF;
          const adelante0 = (vx0 * c.dx + vy0 * c.dy) / (Math.hypot(vx0, vy0) || 1) > Math.cos(K.adelante * Math.PI / 180);
          const tapas = carretas.delante(c, yo.x, yo.y + 7);
          if (!D && (tapas || (reciente && (adelante0 || golpe[c.id])))) {
            // (`motivo`: si la amenazaste, al llegar te denuncia; si sólo le tapabas el camino, no.)
            carretas.soltar(c, pueblos(), yo, reciente ? 'amenaza' : null);
            carretas.asustar(c.id);
            decir(T.escapa, 3);
            continue;
          }
          // (🔁 Amenazada de atrás: no frena a pelear; apura por el camino, y su escopetero te tira si lo persigues.)
          if (!D) continue;
        } else {
          // (Amenazada mientras escapa —aunque se esté defendiendo, trabada—: al llegar, te denuncia.)
          if (reciente) carretas.motivar(c.id);
          if (!D) {
            // (Trabada contigo cerca: frena y se defiende. Lejos tuyo, no: se quedaría frenando y siguiendo cada cuadro.)
            if (carretas.atascada(c.id) && lejos(c, yo) < K.suelta && (escopeteros.vivo(c) || escolta.vivos(c))) defensas[c.id] = { t: K.frena, frenada: false, cond: {} };
            continue;
          }
        }
      }
      if (!D) {
        if (!guardias || !reciente) continue;
        // (¿Adelante, en su camino? El ángulo entre su rumbo y donde estás tú.)
        const vx = yo.x - c.x, vy = (yo.y - c.y) / PROF;
        const adelante = (vx * c.dx + vy * c.dy) / (Math.hypot(vx, vy) || 1) > Math.cos(K.adelante * Math.PI / 180);
        // 🔁 (Parada —le cortaste el camino, o es de noche— no puede escapar: se defiende. Antes pedía que anduviera, y
        // cortarle el paso no hacía nada. Y si le pegaste, frena ya: el escopetero se tira detrás de la carreta sin
        // esperar; antes seguía sentado 2 s y el segundo tiro de lejos lo mataba sin que pudiera hacer nada.)
        if (adelante || golpe[c.id] || !c.anda) defensas[c.id] = { t: golpe[c.id] ? K.frena : 0, frenada: false, cond: {} };
        continue;
      }
      D.t += dt;
      if (!D.frenada) { if (D.t >= K.frena) { D.frenada = true; decir(T.seDefienden, 2.5); } continue; }
      // Sin guardias vivos: el conductor sale de donde estaba escondido, con las manos arriba. Es tuya.
      if (!guardias) {
        if (asalto) continue;   // (si estás con otra, espera)
        const donde = D.cond.bajado;
        delete defensas[c.id];
        asalto = { id: c.id, fase: 'frenada', t: 0, suelta: 0, testigos: false, rendida: true };
        bajar(c, yo, donde);
        decir(T.seRinde, 3);
        continue;
      }
      // Pasado el susto y lejos tú: vuelven caminando a sus asientos, se suben y siguen, rápido. Si los amenazas de
      // nuevo mientras vuelven, a cubrirse otra vez.
      // 🔁 (Lejos: a más de `suelta`, o fuera del alcance de sus armas —con `margen`—. Revisión: con la escopeta, entre 10
      // y 40 m nadie hacía nada nunca: ni ellos te alcanzaban ni se iban.)
      const seVan = Math.min(K.suelta, alcanceDe(c) + K.margen);
      // 🔁 (2026-11-27, Santi: "el escopetero se puede engañar mientras vuelve a subir".) Volviendo a sus asientos, si
      // te acercas de nuevo —aunque sea con el arma guardada—, se dan cuenta y vuelven a cubrirse. Antes seguían
      // caminando a la vista mientras llegabas, y lo agarrabas parado al lado del pescante.
      if (D.subiendo && !reciente && lejos(c, yo) < seVan - (K.vuelven ?? 5)) {
        amenaza[c.id] = reloj; D.subiendo = false; escopeteros.subir(c, false); escopeteros.alertar(c); escolta.alertar(c.id);
        // (Y el conductor deja de ir al asiento: se queda donde está y, si lo ves, busca reparo.)
        if (D.cond.bajado) { D.cond.meta = { th: D.cond.th, k: D.cond.k }; D.cond.camina = false; D.cond.t = 1; }
      }
      if (D.subiendo || (!reciente && lejos(c, yo) > seVan)) {
        if (reciente) { D.subiendo = false; escopeteros.subir(c, false); }
        else {
          D.subiendo = true;
          const esc = escopeteros.subir(c, true);
          if (D.cond.bajado && escopeteros.volver(c, D.cond, dt)) D.cond.bajado = null;
          if (esc && !D.cond.bajado) { delete defensas[c.id]; delete golpe[c.id]; carretas.asustar(c.id); decir(T.siguio, 2.5); }
          continue;
        }
      }
      escopeteros.cubrir(c, D.cond, dt);
    }
  }
  /** Hasta cuántos metros te alcanzan los guardias vivos de `c` (el arma más larga). */
  const alcanceDe = (c) => Math.max(escopeteros.vivo(c) ? escopeteros.alcance(c) : 0, escolta.vivos(c) ? escolta.alcance() : 0);
  /** Una amenaza a la carreta `c` (un tiro que oyó; `pego`: si le pegaste a ella o a su gente). */
  function amenazar(c, pego = false) {
    if (!c) return;
    amenaza[c.id] = reloj;
    if (pego) golpe[c.id] = true;
  }

  /** Si la carreta está frenada (por ti, o porque se defiende): entonces no anda. */
  const retiene = (c) => !!(asalto && asalto.id === c.id && asalto.fase === 'frenada') || !!(defensas[c.id] && defensas[c.id].frenada) || !!volviendo[c.id];
  /** Si la frenaste tú (para robarla). */
  const frenadaPorTi = (c) => !!(asalto && asalto.id === c.id && asalto.fase === 'frenada');

  /** La carreta que puedes robar con [E] ahora: la que frenaste, o una con el conductor muerto (que no robaste). */
  function cerca(yo) {
    if (!A.activa || (asalto && asalto.forzando)) return null;
    // (🔁 Primero la que estás asaltando: antes, con otra sin conductor al lado, [E] terminaba la tuya.)
    const actual = asalto ? buscar(asalto.id) : null;
    for (const c of actual ? [actual, ...carretas.activas.filter((o) => o !== actual)] : carretas.activas) {
      const E = estados()[c.id] || {};
      if (E.robada) continue;
      if (!(frenadaPorTi(c) || E.muerto)) continue;
      if (lejos(c, yo) < A.usarA) return c;
    }
    return null;
  }

  /** [E] en la carreta: lo que se puede llevar, y dejarlo ir. */
  function usar(c, carga) {
    const E = estadoDe(c.id);
    if (!asalto || asalto.id !== c.id) {
      if (asalto) terminar();
      asalto = { id: c.id, fase: 'frenada', t: 0, suelta: 0, testigos: false };
    }
    asalto.carga = carga;
    const b = botinDe(c), vivo = !E.muerto;
    const opciones = () => {
      const o = [];
      if (!asalto.tomoPlata && b.plata > 0) o.push({ id: 'plata', texto: vivo ? T.opciones.plata(b.plata) : T.opciones.plataMuerto(b.plata) });
      if (!asalto.tomoCarga && b.comida) o.push({ id: 'carga', texto: T.opciones.comida(b.comida) });
      if (!asalto.tomoCarga && b.bultos.length) o.push({ id: 'carga', texto: b.mineral ? T.opciones.mineral(b.bultos.length) : T.opciones.bultos(b.bultos.length) });
      const P = dePasajeros(c, b);
      if (!asalto.tomoPasajeros && P.n) o.push({ id: 'pasajeros', texto: T.pasajeros(P.n, P.plata) });
      if (!asalto.tomoCofre && b.cofre) o.push({ id: 'cofre', texto: c.tipo === 'diligencia' ? T.cajaCorreo(b.cofre) : T.cofre(b.cofre) });
      o.push({ id: 'irse', texto: vivo ? T.opciones.irse : T.opciones.irseMuerto });
      return o;
    };
    const cuerpo = !vivo ? T.cuerpoMuerto : c.tipo === 'diligencia' ? T.cuerpoDiligencia : b.cofre && !asalto.tomoCofre ? T.cuerpoMina : T.cuerpo;
    const abrir = () => menu.abrir(T.titulo[c.tipo] || T.titulo.carga, opciones(), elegir, cuerpo);
    const elegir = (op) => {
      if (op === 'irse') { terminar(); return false; }
      // (Si no te cabe nada, ni empiezas.)
      if (op === 'carga' && b.comida && A.comidaMax - (carga.comida || 0) <= 0) { decir(T.noCabeComida, 3); return abrir(); }
      if (op === 'carga' && !b.comida && A.bultosMax - (carga.bultos || []).length <= 0) { decir(T.noCabeBultos, 3); return abrir(); }
      // (Se cierra el menú: lo tomas con las manos, al lado de la carreta, con el mundo andando —ver `actualizar`—. 🔁
      // Antes la plata, la carga y los pasajeros se tomaban al instante, con los tiros parados en el aire.)
      asalto.forzando = { t: 0, dura: op === 'cofre' ? A.cofre.forzar : A.tomar, que: op };
      if (op === 'cofre') audio.play('cock');
      return false;
    };
    abrir();
  }

  /** Lo que se toma de la carreta `c` al terminar de juntarlo (`que`: 'plata', 'carga' o 'pasajeros'). */
  function tomar(c, que) {
    const b = botinDe(c), carga = asalto.carga || {};
    if (que === 'plata') {
      asalto.tomoPlata = true;
      g().money += b.plata;
      decir(T.tomaste.plata(b.plata), 3);
    } else if (que === 'carga') {
      if (b.comida) {
        const cabe = Math.max(0, Math.min(b.comida, A.comidaMax - (carga.comida || 0)));
        if (!cabe) { decir(T.noCabeComida, 3); return; }
        carga.comida = (carga.comida || 0) + cabe;
        decir(T.tomaste.comida(cabe), 3);
      } else {
        if (!carga.bultos) carga.bultos = [];
        const cabe = Math.max(0, Math.min(b.bultos.length, A.bultosMax - carga.bultos.length));
        if (!cabe) { decir(T.noCabeBultos, 3); return; }
        // (🔥 Caliente siempre: una carreta asaltada se denuncia al llegar, y el perista lo sabe. Si no, matar al
        // conductor —que deja sin testigos— pagaría el doble: ver `multiplicadorLimpio` en data/perista.js.)
        for (const valor of b.bultos.slice(0, cabe)) carga.bultos.push({ id: b.mineral ? 'mineral' : 'mercaderia', nombre: b.mineral ? T.mineral : T.bulto, nivel: 'comun', slots: 3, forma: [3, 1], dibujo: 'fardo', valor, caliente: true });
        decir(T.tomaste.bultos(cabe), 3);
        if (cabe < b.bultos.length) decir(T.noCabeBultos, 3);
      }
      asalto.tomoCarga = true;
    } else if (que === 'pasajeros') {
      asalto.tomoPasajeros = true;
      const P = dePasajeros(c, b);
      g().money += P.plata;
      decir(T.robastePasajeros(P.plata), 3);
    }
    audio.play('loot');
  }

  /**
   * 💥 La bala de x0, y0 a x1, y1: 'conductor' si lo mata, 'escopetero' o 'muerto' si le pega a un escopetero (o lo
   * mata), 'tela' si se queda en la lona (o en las bolsas), 'madera' si se queda en la madera (sólo tirando a pie:
   * `aPie`; a caballo pasa por arriba), o null. `fuerza`: la de tu arma (para el escopetero).
   * `apuntadoA` (ver `apuntado`): a quién le apuntabas al disparar: si la bala cruza la carreta de él, le pega, que se ve
   * delante de ella. Detrás de la lona (la de colonos yendo hacia el fondo) no se lo alcanza.
   */
  function bala(x0, y0, x1, y1, apuntadoA, aPie = false, fuerza = 1) {
    if (!A.activa) return null;
    /**
     * 🧺 Si la lona queda entre tu bala y el que le iba a pegar (en el punto `u` del tramo) *(Santi, 2026-11-26: "arreglá
     * que las lonas y piedras paren las balas")*. La de otra carreta, siempre; la de la suya, sólo si estás detrás del
     * pescante (la lona va detrás de él: de adelante o del costado delantero lo ves antes que a ella).
     */
    const laLonaLoTapa = (c, u) => {
      const t = carretas.tela(x0, y0, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, false, null);
      return !!t && t.que === 'tela' && (t.c.id !== c.id || detrasDelPescante(c));
    };
    // 🎯 A quién le pega primero (world/cuerpos.js): conductor, pasajero, escopetero o jinete, el que la bala toca antes.
    // 🔁 Antes se miraba en ese orden: con el escopetero sentado pegado al conductor, la bala que iba al escopetero
    // mataba al conductor *(Santi: "sobre todo el que va sentado al lado del conductor")*.
    let mejor = null;
    const ver = (u, que) => { if (u !== null && (!mejor || u < mejor.u)) mejor = { u, ...que }; };
    for (const c of carretas.activas) {
      const E = estados()[c.id];
      if ((E && E.muerto) || tapado(c)) continue;
      const u = tocaCuerpo(x0, y0, x1, y1, cuerpoConductor(c));
      // (Escondido detrás: si la carreta queda en el medio, la para ella.)
      if (u !== null && escondido(c) && carretas.tela(x0, y0, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, true, null)) continue;
      // 🧺 (Sentado, detrás de la lona: la para ella.)
      if (u !== null && !escondido(c) && laLonaLoTapa(c, u)) continue;
      ver(u, { conductor: c });
    }
    if (asalto && asalto.pasajeros) for (const p of asalto.pasajeros) {
      if (p.muerto) continue;
      const u = tocaCuerpo(x0, y0, x1, y1, columnaDe(p.x, p.y, 'pie', C.guardias.columna, M));
      // (Están a pie al lado de la carreta: si queda en el medio, lona o madera, la para ella, como al escopetero bajado.)
      if (u !== null && carretas.tela(x0, y0, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, true, null)) continue;
      ver(u, { pasajero: p });
    }
    for (const id in volviendo) for (const p of volviendo[id].pasajeros) {
      if (p.muerto || p.adentro) continue;
      const u = tocaCuerpo(x0, y0, x1, y1, columnaDe(p.x, p.y, 'pie', C.guardias.columna, M));
      if (u !== null && carretas.tela(x0, y0, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, true, null)) continue;
      ver(u, { volvia: p, id });
    }
    const esc = escopeteros.toca(x0, y0, x1, y1);
    if (esc) ver(esc.u, { esc: esc.c });
    const jin = escolta.toca(x0, y0, x1, y1);
    // (Un jinete detrás de una carreta con lona: la para la lona. La madera no: va más alto.)
    if (jin) { const t = carretas.tela(x0, y0, x0 + (x1 - x0) * jin.u, y0 + (y1 - y0) * jin.u, false, null); if (!(t && t.que === 'tela')) ver(jin.u, { jinete: jin }); }
    if (mejor && mejor.conductor) { matar(mejor.conductor); return 'conductor'; }
    if (mejor && mejor.esc) { amenazar(mejor.esc, true); return trasEscopetero(escopeteros.herir(mejor.esc, fuerza), mejor.esc); }
    if (mejor && mejor.jinete) {
      amenazar(buscar(mejor.jinete.id), true);
      const j = escolta.herir(mejor.jinete.id, mejor.jinete.j, fuerza);
      if (j.que === 'muerto') cuentaGuardia(j.id, T.jinete);
      return j.que;
    }
    // 🧳 Los pasajeros bajados: la bala les pega como a cualquiera *(memoria: lo que golpea vale igual para todos;
    // Santi: "hacé los arreglos")*. Un civil muerto: como matar al conductor, en las cuentas.
    // (🚶 Un pasajero que volvía a subir: un civil muerto, contado ahí mismo, como el conductor de otra carreta.)
    if (mejor && mejor.volvia) {
      const p = mejor.volvia, c = buscar(mejor.id), Ep = estadoDe(mejor.id), K = A.cuentas, G = g();
      p.muerto = true;
      (Ep.pasajerosMuertos || (Ep.pasajerosMuertos = [])).push({ i: p.i, x: p.x, y: p.y });
      if (c) { escopeteros.alertar(c); escolta.alertar(c.id); }
      // (Testigos: siempre —el cochero, los otros pasajeros—.)
      G.honor = (G.honor || 0) + K.matar.honor;
      G.bounty = (G.bounty || 0) + K.matar.recompensa; subirFama(G, K.matar.fama, { conRecompensa: false });
      decir(T.matastePasajero + ' ' + T.cuentas({ recompensa: K.matar.recompensa, fama: K.matar.fama, honor: K.matar.honor, testigo: true }), 4.5);
      return 'conductor';
    }
    if (mejor && mejor.pasajero) {
      const p = mejor.pasajero;
      p.muerto = true;
      // (🔁 Queda anotado en la carreta: no resucita si la vuelves a frenar, y su cuerpo queda.)
      const Ep = estadoDe(asalto.id);
      (Ep.pasajerosMuertos || (Ep.pasajerosMuertos = [])).push({ i: p.i, x: p.x, y: p.y });
      asalto.civiles = (asalto.civiles || 0) + 1;
      const c = buscar(asalto.id);
      if (c) { escopeteros.alertar(c); escolta.alertar(c.id); }
      decir(T.matastePasajero, 3);
      return 'conductor';
    }
    const t = carretas.tela(x0, y0, x1, y1, aPie);
    if (!t) return null;
    const c = t.c, E = estados()[c.id];
    amenazar(c, true);
    // (🔁 Escondido detrás de la carreta, no: la bala la para ella aunque le apuntaras. Y el escopetero, sólo si sigue
    // sentado y a la vista al llegar la bala: si se agachó o se bajó mientras volaba, la carreta lo tapa.)
    // 🧺 (🔁 Antes, si le apuntabas, le pegaba aunque la bala se quedara en la lona: desde atrás se lo mataba a través de
    // ella. Ahora, si la bala se quedó en la lona y estás detrás del pescante, la lona la paró.)
    const laLona = t.que === 'tela' && detrasDelPescante(c);
    if (apuntadoA === c.id && !(E && E.muerto) && !tapado(c) && !escondido(c) && !laLona) { matar(c); return 'conductor'; }
    const e0 = escopeteros.gente[c.id];
    if (apuntadoA === 'e|' + c.id && escopeteros.tiene(c) && !(e0 && (e0.bajado || e0.oculto)) && !laLona) return trasEscopetero(escopeteros.herir(c, fuerza), c);
    return t.que;
  }

  /** 🧺 Si estás detrás del pescante de `c` (del lado de la lona), mirando por el suelo. */
  function detrasDelPescante(c) {
    const J = james(), s = carretas.asiento(c);
    return (J.x - s.x) * c.dx + ((J.y - s.y) / PROF) * c.dy < 0;
  }

  /** Lo que pasa después de pegarle a un escopetero: si murió, las cuentas. */
  function trasEscopetero(que, c) {
    if (que !== 'muerto') return que;
    const muerta = c || carretas.activas.find((o) => (estados()[o.id] || {}).esc && estados()[o.id].esc.muerto && !estados()[o.id].esc.contado);
    if (muerta) { estadoDe(muerta.id).esc.contado = true; cuentaGuardia(muerta.id, T.escopetero); }
    return 'muerto';
  }

  /**
   * 🧾 Un guardia muerto (escopetero o de la escolta), al momento: si quedó un testigo —el conductor, otro guardia de la
   * carreta, o alguien que pasaba—, `guardias.cuentas` de recompensa y fama. `texto`: el cartel.
   */
  function cuentaGuardia(id, texto) {
    const E = estadoDe(id), c = buscar(id);
    const testigo = !E.muerto || escopeteros.vivo(c) || escolta.vivos(c) || !!(asalto && asalto.id === id && asalto.testigos);
    const K = C.guardias.cuentas, G = g();
    if (testigo) { G.bounty = (G.bounty || 0) + K.recompensa; subirFama(G, K.fama, { conRecompensa: false }); }
    decir(texto(testigo ? K : {}), 3.5);
  }

  /**
   * Al disparar, con `meta` adonde va la bala (ya con la dispersión): a quién le apuntabas (el id de la carreta para su
   * conductor, 'e|' + id para su escopetero), vivo y a la vista, o null. Se mira al disparar, no al llegar: la carreta
   * sigue andando mientras la bala vuela, y al llegar la mira ya no le caía encima.
   */
  function apuntado(meta) {
    if (!A.activa || !meta) return null;
    for (const c of carretas.activas) {
      const E = estados()[c.id];
      if (!(E && E.muerto) && !tapado(c) && enCuerpo(meta[0], meta[1], cuerpoConductor(c))) return c.id;
    }
    const e = escopeteros.apuntado(meta);
    return e ? 'e|' + e : null;
  }

  function matar(c) {
    // (🔁 Con otro asalto en curso, no lo corta: éste se cuenta aparte, ahí mismo. Antes la tuya arrancaba y perdías lo
    // que quedaba.)
    if (asalto && asalto.id !== c.id) { matarAparte(c); return; }
    if (!asalto) {
      asalto = { id: c.id, fase: 'frenada', t: 0, suelta: 0, testigos: false };
      // (🚶 Lo mataste mientras volvía a subir: los pasajeros que estaban afuera quedan afuera, donde estaban.)
      const V = volviendo[c.id];
      if (V) {
        if (V.cond) asalto.bajado = { x: V.cond.x, y: V.cond.y };
        const fuera = V.pasajeros.filter((p) => !p.adentro && !p.muerto).map((p) => ({ i: p.i, x: p.x, y: p.y, ent: p.ent }));
        // (Y los que mataste siguen donde cayeron: si no, con `asalto.pasajeros` armado, dejaban de dibujarse.)
        const caidos = ((estados()[c.id] || {}).pasajerosMuertos || []).map((m) => ({ i: m.i, x: m.x, y: m.y, muerto: true, ent: conductores[c.id + '|' + m.i] || (conductores[c.id + '|' + m.i] = {}) }));
        if (fuera.length) asalto.pasajeros = [...fuera, ...caidos];
        delete volviendo[c.id];
      }
    }
    const E = estadoDe(c.id);
    // (Cae donde estaba: bajado, ahí; sentado, al costado del pescante —ver `dibujarConductor`—.)
    const b = asalto.bajado || bajadoDe(c);
    if (b) E.caido = { x: b.x, y: b.y };
    delete defensas[c.id];
    asalto.fase = 'frenada';
    asalto.mato = true;
    E.muerto = true;
    E.s = c.s;   // (sin nadie que la maneje, queda parada donde está)
    E.d = carretas.desvio(c.id);   // (🔁 y corrida como iba, si estaba rodeando a otra: antes saltaba al medio del camino)
    escopeteros.alertar(c);
    escolta.alertar(c.id);
    decir(T.mataste, 3);
  }

  /** El conductor de otra carreta, mientras asaltas una: queda muerto y se cuenta ahí mismo (honor; si alguien lo vio, recompensa y fama). */
  function matarAparte(c) {
    const E = estadoDe(c.id), b = bajadoDe(c);
    if (b) E.caido = { x: b.x, y: b.y };
    // (🚶 Si volvía a subirse, ya no: los pasajeros igual terminan de subir.)
    if (volviendo[c.id]) { volviendo[c.id].cond = null; volviendo[c.id].vivo = false; }
    delete defensas[c.id];
    E.muerto = true; E.s = c.s; E.d = carretas.desvio(c.id);
    escopeteros.alertar(c); escolta.alertar(c.id);
    const K = A.cuentas, G = g();
    const testigo = escopeteros.vivo(c) || escolta.vivos(c) || c.tipo === 'diligencia' ||
      carretas.activas.some((o) => o.id !== c.id && !(estados()[o.id] || {}).muerto && Math.hypot(o.x - c.x, (o.y - c.y) / PROF) < K.testigoA * M);
    G.honor = (G.honor || 0) + K.matar.honor;
    if (testigo) { G.bounty = (G.bounty || 0) + K.matar.recompensa; subirFama(G, K.matar.fama, { conRecompensa: false }); }
    decir(T.mataste + ' ' + T.cuentas({ recompensa: testigo ? K.matar.recompensa : 0, fama: testigo ? K.matar.fama : 0, honor: K.matar.honor, testigo }), 4.5);
  }

  /** 🚶 Un paso de los que vuelven a subir (ver `volviendo`). Cuando están todos arriba, la carreta sigue, asustada. */
  function subirse(dt) {
    for (const id of Object.keys(volviendo)) {
      const V = volviendo[id], c = buscar(id);
      if (!c) { delete volviendo[id]; continue; }
      const w = (A.vuelven ?? 1.4) * M * dt, S = asientoDe(c), px = -c.dy, py = c.dx;
      const baja = ((A.conductor.de || {})[c.tipo] || {}).bajado ?? A.conductor.bajado;
      const andar = (p, x, y) => {
        const dx = x - p.x, dy = (y - p.y) / PROF, d = Math.hypot(dx, dy);
        if (d > 0.01) p.mira = Math.atan2(dy, dx);
        if (d <= w) { p.fase += d; p.x = x; p.y = y; return true; }
        p.x += (dx / d) * w; p.y += (dy / d) * w * PROF; p.fase += w;
        return false;
      };
      // (Él, al pie de su asiento, y arriba.)
      if (V.cond && andar(V.cond, S.x + px * V.lado * baja * M, S.y + py * V.lado * baja * M * PROF)) V.cond = null;
      // (Ellos, a la puerta: al costado del medio de la carreta, del mismo lado.)
      const P = { x: c.x + px * V.lado * baja * M, y: c.y + py * V.lado * baja * M * PROF };
      for (const p of V.pasajeros) if (!p.adentro && !p.muerto && andar(p, P.x, P.y)) p.adentro = true;
      if (!V.cond && V.pasajeros.every((p) => p.adentro || p.muerto)) {
        delete volviendo[id];
        if (V.vivo && !(estados()[id] || {}).muerto) { carretas.asustar(id); decir(T.siguio, 2.5); }
      }
    }
  }

  /**
   * 🧾 LAS CUENTAS (CAMPO.carretas.asalto.cuentas), al terminar: robar con un testigo sube la recompensa y la fama según
   * la carreta; matar al conductor baja el honor siempre, y si alguien lo vio, suma recompensa y fama de civil.
   */
  function terminar() {
    const a = asalto;
    asalto = null;
    if (!a) return;
    const E = estadoDe(a.id), K = A.cuentas, c = buscar(a.id);
    const robo = !!(a.tomoPlata || a.tomoCarga || a.tomoCofre || a.tomoPasajeros), vivo = !E.muerto, escopetero = escopeteros.vivo(c) || escolta.vivos(c);
    // (Los pasajeros: los que quedaron vivos, si bajaron; si no bajaron, los de adentro de la diligencia.)
    const pasajeros = a.pasajeros ? a.pasajeros.some((p) => !p.muerto) : !!(c && c.tipo === 'diligencia');
    const testigo = vivo || a.testigos || escopetero || pasajeros;
    if (robo || a.mato) E.robada = robo || E.robada;
    let recompensa = 0, fama = 0, honor = 0;
    if (robo && testigo) { recompensa += recompensaDe(claveDe(c)); fama += K.fama[claveDe(c)] || 0; }
    if (a.mato) { honor += K.matar.honor; if (a.testigos || escopetero || pasajeros) { recompensa += K.matar.recompensa; fama += K.matar.fama; } }
    if (a.civiles) { honor += K.matar.honor * a.civiles; if (testigo) { recompensa += K.matar.recompensa * a.civiles; fama += K.matar.fama * a.civiles; } }
    const G = g();
    G.bounty = (G.bounty || 0) + recompensa;
    if (fama > 0) subirFama(G, fama, { conRecompensa: false });
    G.honor = (G.honor || 0) + honor;
    // (🚶 Vuelven caminando: él a su asiento, ellos a la puerta; la carreta sigue —asustada— cuando están todos arriba.)
    const quedan = (a.pasajeros || []).filter((p) => !p.muerto);
    if (c && a.fase === 'frenada' && ((vivo && a.bajado) || quedan.length)) {
      const S = asientoDe(c), p0 = quedan[0], b = vivo && a.bajado ? a.bajado : p0 || a.bajado || S;
      const lado = Math.sign(-c.dy * (b.x - c.x) + c.dx * (b.y - c.y) / PROF) || 1;
      volviendo[a.id] = { lado, cond: vivo && a.bajado ? { x: a.bajado.x, y: a.bajado.y, fase: 0, mira: 0 } : null,
        pasajeros: quedan.map((p) => ({ i: p.i, x: p.x, y: p.y, ent: p.ent, fase: 0, mira: 0 })), vivo };
    } else if (vivo) { carretas.asustar(a.id); if (a.fase === 'frenada') decir(T.siguio, 2.5); }
    if (robo || a.mato || a.civiles) decir(T.cuentas({ recompensa, fama, honor, testigo: robo || a.civiles ? testigo : a.testigos || escopetero || pasajeros }), 4.5);
  }

  /**
   * 🧍 El conductor (y el escopetero), sentados en el pescante: (gx, gy) es el suelo de la carreta ya pegado a la grilla
   * (el mismo punto con que se dibuja ella), así van con la carreta sin despegarse. `antes`: si se los llama antes de
   * dibujar la carreta (yendo hacia el fondo, la lona lo tapa: va antes) o después. Bajado o muerto, va en `cosas`.
   */
  function dibujarConductor(r, c, gx, gy, noche, antes) {
    escopeteros.dibujarSentado(r, c, gx, gy, noche, antes);
    const E = estados()[c.id] || {};
    if (bajadoDe(c)) return;
    const S = asientoDe(c);
    const x = gx + (S.x - c.x), y = gy + (S.y - c.y);
    const ent = conductores[c.id] || (conductores[c.id] = {}), aspecto = aspectoDe(ent, 'pasajero');
    if (E.muerto) {
      if (E.caido) return;
      // (Caído al costado de la carreta, a la altura del pescante, del lado de la cámara; encima de ella.)
      if (antes) return;
      let px = -c.dy, py = c.dx;
      if (py < -0.01 || (Math.abs(py) <= 0.01 && px < 0)) { px = -px; py = -py; }
      const a = A.conductor.adelante * 0.5 * M, lado = A.conductor.caido * M;
      tendidoNuevo(r, gx + c.dx * a + px * lado, gy + (c.dy * a + py * lado) * PROF, { tipo: 'pasajero', modo: 'muerto', sangre: true, espejo: c.dx < 0, aspecto });
      return;
    }
    // (Va antes sólo si la lona lo tapa: la de los colonos yendo hacia el fondo. En las abiertas, encima: si no, la
    // lanza y el balancín, que quedan más allá, le pasaban por encima del cuerpo.)
    if (antes !== (c.tipo === 'colono' && c.vista.startsWith('nor'))) return;
    const nuevo = { arma: null, funda: false, aspecto, piernas: 'sentado', accion: 'quieto' };
    dibujarPersona(r, { tipo: 'pasajero', x, pies: y - S.alto * M, angulo: Math.atan2(c.dy, c.dx), interior: true, luz: noche ? -1 : 0, nuevo });
  }

  /** Lo que va en el suelo: el conductor bajado (o muerto donde estaba bajado), los pasajeros y los guardias. [{ y, draw }]. */
  function cosas(r, noche, enVista) {
    const out = [...escopeteros.cosas(r, noche, enVista), ...escolta.cosas(r, noche, enVista)];
    const yo = james();
    // 🧳 Los pasajeros bajados, con las manos arriba, mirándote (los pasajeros del tren).
    if (asalto && asalto.pasajeros && buscar(asalto.id)) {
      for (const p of asalto.pasajeros) {
        if (!enVista(p.x, p.y)) continue;
        if (p.muerto) { out.push({ y: p.y, draw: () => tendidoNuevo(r, p.x, p.y, { tipo: 'pasajero', modo: 'muerto', sangre: true, espejo: p.x > yo.x, aspecto: aspectoDe(p.ent, 'pasajero') }) }); continue; }
        out.push({ y: p.y, draw: () => dibujarPersona(r, { tipo: 'pasajero', x: p.x, pies: p.y, angulo: Math.atan2(yo.y - p.y, yo.x - p.x), interior: true, luz: noche ? -1 : 0,
          nuevo: { arma: null, funda: false, aspecto: aspectoDe(p.ent, 'pasajero'), piernas: 'quieto', brazos: 'arriba' } }) });
      }
    }
    // 🚶 Los que vuelven a subir, caminando.
    for (const id in volviendo) {
      const V = volviendo[id];
      const caminando = (p, ent) => ({ y: p.y, draw: () => dibujarPersona(r, { tipo: 'pasajero', x: p.x, pies: p.y, angulo: p.mira, interior: true, luz: noche ? -1 : 0,
        fase: p.fase / 4, modo: 'caminar', nuevo: { arma: null, funda: false, aspecto: aspectoDe(ent, 'pasajero'), piernas: 'quieto' } }) });
      if (V.cond && enVista(V.cond.x, V.cond.y)) out.push(caminando(V.cond, conductores[id] || (conductores[id] = {})));
      for (const p of V.pasajeros) if (!p.adentro && !p.muerto && enVista(p.x, p.y)) out.push(caminando(p, p.ent));
    }
    for (const c of carretas.activas) {
      const E = estados()[c.id] || {}, b = bajadoDe(c);
      const ent = conductores[c.id] || (conductores[c.id] = {}), aspecto = aspectoDe(ent, 'pasajero');
      // (🔁 Los pasajeros que mataste quedan donde cayeron, también terminado el asalto.)
      if (E.pasajerosMuertos && !(asalto && asalto.id === c.id && asalto.pasajeros)) {
        for (const m of E.pasajerosMuertos) {
          if (!enVista(m.x, m.y)) continue;
          const asp = aspectoDe(conductores[c.id + '|' + m.i] || (conductores[c.id + '|' + m.i] = {}), 'pasajero');
          out.push({ y: m.y, draw: () => tendidoNuevo(r, m.x, m.y, { tipo: 'pasajero', modo: 'muerto', sangre: true, espejo: m.x > c.x, aspecto: asp }) });
        }
      }
      if (E.muerto && E.caido) {
        const m = E.caido;
        if (enVista(m.x, m.y)) out.push({ y: m.y, draw: () => tendidoNuevo(r, m.x, m.y, { tipo: 'pasajero', modo: 'muerto', sangre: true, espejo: m.x > c.x, aspecto }) });
      } else if (b && escondido(c) && enVista(b.x, b.y)) {
        const P = defensas[c.id].cond;
        out.push({ y: b.y, draw: () => dibujarPersona(r, { tipo: 'pasajero', x: b.x, pies: b.y, angulo: P.mira ?? Math.PI / 2, interior: true, luz: noche ? -1 : 0,
          fase: P.camina ? P.fase / 4 : null, modo: 'caminar', nuevo: { arma: null, funda: false, aspecto, piernas: P.camina ? 'quieto' : 'agachado' } }) });
      } else if (b && !(volviendo[c.id] && volviendo[c.id].cond) && enVista(b.x, b.y)) {
        out.push({ y: b.y, draw: () => dibujarPersona(r, { tipo: 'pasajero', x: b.x, pies: b.y, angulo: Math.atan2(yo.y - b.y, yo.x - b.x), interior: true, luz: noche ? -1 : 0,
          nuevo: { arma: null, funda: false, aspecto, piernas: 'quieto', brazos: 'arriba' } }) });
      }
    }
    return out;
  }

  return {
    actualizar, retiene, cerca, usar, bala, apuntado, terminar, dibujarConductor, cosas,
    oirTiro: (x, y) => {
      escopeteros.oirTiro(x, y); escolta.oirTiro(x, y);
      for (const c of carretas.activas) if (Math.hypot(c.x - x, (c.y - y) / PROF) < C.guardias.oye * M) amenazar(c);
    },
    /** Para probar desde la consola. */
    get defensas() { return defensas; },
    dibujarBalas: (r) => escopeteros.dibujarBalas(r),
    /** 🔐 Lo que va del cofre o de lo que estás tomando (0 a 1), o null; y qué es ('cofre', 'plata', 'carga', 'pasajeros'). */
    get forzando() { return asalto && asalto.forzando ? Math.min(1, asalto.forzando.t / asalto.forzando.dura) : null; },
    get forzandoQue() { return asalto && asalto.forzando ? asalto.forzando.que : null; },
    /** ✋ Lo que va de frenarla apuntándole (0 a 1), o null: la barrita mientras le apuntas. */
    get frenando() { return asalto && asalto.fase === 'apunta' ? Math.min(1, asalto.t / A.frena.apuntar) : null; },
    /** ⏳ Lo que falta para que se vaya la que frenaste, si te alejaste (0 a 1, la barrita se vacía), o null. */
    get seVa() {
      if (!asalto || asalto.fase !== 'frenada' || asalto.forzando || asalto.suelta < A.frena.aviso) return null;
      return Math.max(0, 1 - asalto.suelta / (asalto.rendida ? A.frena.sueltaRendido : A.frena.suelta));
    },
    reiniciar() { asalto = null; for (const o of [defensas, amenaza, golpe, gritos, volviendo]) for (const k of Object.keys(o)) delete o[k]; escopeteros.reiniciar(); escolta.reiniciar(); },
    get ahora() { return asalto; },
    escopeteros, escolta,
  };
}
