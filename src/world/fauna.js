/**
 * 🦌 LOS ANIMALES DEL CAMPO (etapa 3 del campo con vida; los números en CAMPO.caza, data/campo.js)
 * *(Santi, 2026-11-24: "haría que el berrendo sea considerablemente el más rápido (en la realidad suelen alcanzar hasta
 * 90km/h) y le agregaría algo especial que valga la pena cazarlo. También agregaría el zorro rojo, pelaje muy caro. A
 * diferencia del coyote, es que el coyote molesta. Y agregaría un animal argentino: el guanaco")*.
 *
 *  - **Dónde**: el campo en celdas; cada día cada celda cerca de ti tira su suerte según su zona (llano, lomas, cerca
 *    del agua). Siempre la misma suerte para el mismo día: si vuelves, los animales están (los que no cazaste).
 *  - **El berrendo**: el más rápido; no se lo alcanza. Es curioso: quieto un rato, se acerca a mirarte. Sus cuernos se
 *    venden como trofeo.
 *  - **El coyote molesta**: llega a lo que dejaste muerto, se lo come, y mientras anda cerca espanta a los demás.
 *  - **El zorro rojo**: de noche y a la madrugada, solo y arisco; el pelaje, caro.
 *  - **El guanaco**: una sola tropilla, la de un estanciero que la trajo del sur y se le escapó, en las Lomas del Oeste.
 *    En esta frontera no hay guanacos: por eso son tan pocos y su cuero es el más caro. Cada uno que cazas tarda días
 *    en volver (se guarda en la partida).
 *
 * ⚠️ DIBUJO DE PRUEBA: figuras básicas con rectángulos (los animales los dibuja Santi). 🆕 El venado, si
 * `CAMPO.caza.dibujoNuevo.venado`: la prueba del camino "B" (3D de Blender pasado a puntos; ver assets/venadoPuntos.js).
 */
import { CONFIG } from '../data/config.js';
import { dibujoVenado, mapaVenado } from '../entities/estiloNuevo/venado.js';
import { dibujoBerrendo, mapaBerrendo } from '../entities/estiloNuevo/berrendo.js';
import { estiloNuevo } from '../engine/estiloNuevo.js';

const TIPOS = ['liebre', 'berrendo', 'venado', 'coyote', 'zorro', 'guanaco'];

function hash(a, b, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Distancia de un punto a una línea (en el mundo, con lo de arriba y abajo desachatado). */
function aLinea(pts, x, y, prof) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = (by - ay) / prof, l = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + ((y - ay) / prof) * dy) / l));
    d = Math.min(d, Math.hypot(x - (ax + t * dx), (y - ay) / prof - t * dy));
  }
  return d;
}

/**
 * `relieve` (world/campoRelieve.js), `deX`/`deY` (del plano al mundo), `PROF`, `C` (CAMPO.caza), `galope` (el del
 * Criollo, la medida de las velocidades), `ANCHO`/`ALTO` (el mundo), `partida()` (gameState.campo, donde se guarda la
 * tropilla de guanacos).
 */
export function crearFauna({ relieve, deX, deY, PROF, C, galope, ANCHO, ALTO, partida }) {
  NUEVOS = C.dibujoNuevo || {}; ACHATADO = PROF;
  let reloj = 0, diaPoblado = null, cadaPoblar = 0;
  /** Los grupos de cada celda del día: 'ci,cj' → [animales]. */
  let celdas = new Map();
  let activos = [];
  const aguas = [...relieve.arroyos, ...relieve.rios];
  const G = C.guanacos, guanacoX = deX(G.x), guanacoY = deY(G.y);

  /** La zona de (x, y): 'lomas', 'agua', 'llano', o null donde no anda nada (arriba de algo, en el agua). */
  function zonaEn(x, y) {
    if (x < 0 || y < 0 || x > ANCHO || y > ALTO || relieve.formaEn(x, y)) return null;
    const s = relieve.sueloEn(x, y);
    if (s.agua) return null;
    if (s.lomas) return 'lomas';
    if (aguas.some((a) => aLinea(a.pts, x, y, PROF) < 500)) return 'agua';
    return 'llano';
  }
  // (La zona se mira de a cuadraditos de 40 y se guarda: mirarla cada cuadro, por cada animal, costaba más de 1 ms.)
  const zonas = new Map();
  function zonaGuardada(x, y) {
    const clave = Math.floor(x / 40) + ',' + Math.floor(y / 40);
    if (zonas.has(clave)) return zonas.get(clave);
    if (zonas.size > 40000) zonas.clear();
    const z = zonaEn(x, y);
    zonas.set(clave, z);
    return z;
  }
  const sePuede = (x, y) => zonaGuardada(x, y) !== null;

  function nuevo(tipo, x, y, celda) {
    return { tipo, x, y, vx: 0, vy: 0, vivo: true, carneado: false, comido: false, mira: hash(x, y) < 0.5 ? -1 : 1,
      fase: hash(y, x) * 6, pasto: hash(x, y, 3) * 3, susto: 0, de: null, zz: 0, celda, muerte: 0, objetivo: null, come: 0, alerta: 0,
      herida: 0, desangra: 0, agujeros: 0, gotaEn: null };
  }

  /** Un grupo de `tipo` alrededor de (cx, cy), con la suerte `k`. */
  function grupo(tipo, cx, cy, k, celda, cuantos = null) {
    const A = C.animales[tipo], lista = [];
    const n = cuantos ?? A.grupo[0] + Math.floor(hash(k, 5) * (A.grupo[1] - A.grupo[0] + 1));
    for (let i = 0; i < n; i++) {
      const ang = hash(k, i, 7) * Math.PI * 2, r = C.grupo * Math.sqrt(hash(k, i, 9));
      const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r * PROF;
      if (sePuede(x, y)) lista.push(nuevo(tipo, x, y, celda));
    }
    return lista;
  }

  /** Lo que hay hoy en la celda (ci, cj). */
  function poblarCelda(ci, cj, dia) {
    const lista = [];
    const cx = (ci + 0.2 + 0.6 * hash(ci, cj, dia * 3 + 1)) * C.celda, cy = (cj + 0.2 + 0.6 * hash(ci, cj, dia * 3 + 2)) * C.celda;
    const zona = zonaEn(cx, cy);
    if (zona) {
      const Z = C.zonas[zona];
      if (hash(ci, cj, dia * 7 + 3) < Z.chance) {
        const tipos = TIPOS.filter((t) => Z[t]), total = tipos.reduce((s, t) => s + Z[t], 0);
        let sorteo = hash(ci, cj, dia * 7 + 4) * total, tipo = tipos[0];
        for (const t of tipos) { if (sorteo < Z[t]) { tipo = t; break; } sorteo -= Z[t]; }
        lista.push(...grupo(tipo, cx, cy, ci * 7919 + cj * 104729 + dia, ci + ',' + cj));
      }
    }
    // El zorro: en cualquier lado (aparte de lo demás); se ve sólo de noche y a la madrugada (ver `poblar`).
    if (hash(ci, cj, dia * 7 + 5) < C.zorro.chance) {
      const zx = (ci + hash(ci, cj, dia * 7 + 6)) * C.celda, zy = (cj + hash(ci, cj, dia * 7 + 8)) * C.celda;
      if (sePuede(zx, zy)) lista.push(nuevo('zorro', zx, zy, ci + ',' + cj));
    }
    return lista;
  }

  /** La tropilla de guanacos de hoy: los que no cazaste en los últimos `nace` días. */
  function poblarGuanacos(dia) {
    const p = partida();
    if (!p.guanacos) p.guanacos = [];
    p.guanacos = p.guanacos.filter((d) => dia - d < G.nace);
    const quedan = G.cuantos - p.guanacos.length;
    if (quedan <= 0) return [];
    // (Andan por las lomas: cada día en otro lado de su zona.)
    const a = hash(dia, 11) * Math.PI * 2, r = G.radio * 0.6 * hash(dia, 13);
    return grupo('guanaco', guanacoX + Math.cos(a) * r, guanacoY + Math.sin(a) * r * PROF, dia * 31 + 17, 'guanacos', quedan);
  }

  /** Puebla las celdas cerca de (x, y); al cambiar el día, todo de nuevo (lo muerto de ayer ya no está). */
  function poblar(x, y, dia, parte) {
    if (dia !== diaPoblado) { celdas = new Map(); diaPoblado = dia; }
    const r = C.hasta;
    for (let cj = Math.floor((y - r) / C.celda); cj <= Math.floor((y + r) / C.celda); cj++) {
      for (let ci = Math.floor((x - r) / C.celda); ci <= Math.floor((x + r) / C.celda); ci++) {
        const clave = ci + ',' + cj;
        if (!celdas.has(clave)) celdas.set(clave, poblarCelda(ci, cj, dia));
      }
    }
    if (!celdas.has('guanacos') && Math.hypot(guanacoX - x, (guanacoY - y) / PROF) < r + G.radio) celdas.set('guanacos', poblarGuanacos(dia));
    // Activos: los de las celdas cerca (los de lejos quedan guardados, quietos, donde estaban).
    const lejos = r * 1.4;
    activos = [];
    // (El zorro vivo, de día, está en la cueva.)
    const zorros = C.zorro.partes.includes(parte);
    for (const [, lista] of celdas) {
      for (const a of lista) {
        if (a.tipo === 'zorro' && a.vivo && !zorros) continue;
        if (Math.abs(a.x - x) < lejos && Math.abs(a.y - y) < lejos) activos.push(a);
      }
    }
  }

  // ── Mover ──
  /**
   * `yo` { x, y }, `quieto` (segundos sin moverte), `dia`, `parte`.
   * 👂👁️ LOS SENTIDOS *(Santi: "los animales deberían tener vista y oído, depende cual tendrá más o menos")*: `como`
   * { ruido, vista } dice cuánto hacés de ruido y cuánto se te ve según cómo vas (CAMPO.caza.sentidos.como); `tapado(a)`,
   * si ese animal no te puede ver (metido en un arbusto, o agachado detrás de una roca o un arbusto); `noche`.
   */
  function actualizar(dt, { yo, quieto, dia, parte, como = { ruido: 1, vista: 1 }, tapado = () => false, noche = false }) {
    reloj += dt;
    cadaPoblar -= dt;
    if (cadaPoblar <= 0 || dia !== diaPoblado) { cadaPoblar = 0.5; poblar(yo.x, yo.y, dia, parte); }
    llamarCoyotes();
    const coyotes = activos.filter((a) => a.tipo === 'coyote' && a.vivo);
    for (const a of activos) {
      if (!a.vivo) continue;
      const A = C.animales[a.tipo], TI = C.tiros;
      // 🩸 Herido: corre más lento cuanto peor está, deja gotas y se desangra (cae en `sangra` × aguante / herida s).
      const vel = A.vel * galope * (a.herida > 0 ? Math.max(TI.lentoMin, 1 - 0.5 * a.herida / A.aguante) : 1);
      if (a.herida > 0) {
        a.desangra += dt;
        if (!a.gotaEn || Math.hypot(a.x - a.gotaEn[0], a.y - a.gotaEn[1]) > TI.gotaCada) { a.gotaEn = [a.x, a.y]; gotas.push({ x: a.x, y: a.y, t: reloj }); }
        if (a.desangra >= TI.sangra * A.aguante / a.herida) { morir(a); continue; }
      }
      const d = Math.hypot(a.x - yo.x, (a.y - yo.y) / PROF);
      // Hasta dónde te nota: por la vista (si no estás tapado; de noche menos) o por el oído, lo que sea más.
      const SN = C.sentidos;
      const vista = tapado(a) ? 0 : A.vista * como.vista * (noche ? A.veDeNoche ?? SN.noche : 1);
      let alcance = Math.max(vista, A.oido * como.ruido);
      a.susto = Math.max(0, a.susto - dt);
      // 🐺 El coyote espanta a los demás.
      if (a.tipo !== 'coyote') {
        for (const c of coyotes) if (Math.hypot(a.x - c.x, (a.y - c.y) / PROF) < C.coyote.espanta) { a.susto = Math.max(a.susto, 1); a.de = [c.x, c.y]; }
      }
      // 🦌 El berrendo curioso: si estás quieto, no huye (salvo muy cerca) y se acerca a mirarte.
      const K = C.curiosidad;
      a.curioso = a.tipo === 'berrendo' && quieto >= K.quieto && a.susto <= 0 && d < K.radio;
      if (a.curioso) alcance = Math.min(alcance, K.asusta);
      /**
       * ⚠️ PRIMERO SE PONE ALERTA, DESPUÉS HUYE: deja de comer, levanta la cabeza y te mira. Si te quedás quieto o te
       * agachás (y te deja de notar), se calma; si seguís, huye, y con él todo su grupo. Muy cerca, huye sin avisar.
       */
      if (d < alcance && a.susto <= 0) {
        a.alerta += dt / SN.alerta;
        a.mira = Math.sign(yo.x - a.x) || a.mira;
        if (a.alerta >= 1 || d < alcance * SN.sinAviso) espantarGrupo(a, yo);
      } else a.alerta = Math.max(0, a.alerta - dt / SN.calma);
      let ir = null, rapido = 0;
      if (a.susto > 0 && d < alcance) a.de = [yo.x, yo.y];
      if (a.alerta > 0.25 && a.susto <= 0) { a.vx = a.vy = 0; continue; }
      if (a.susto > 0 && a.de) { ir = [a.x - a.de[0], (a.y - a.de[1]) / PROF]; rapido = vel; }
      else if (a.curioso && d > K.hasta) { ir = [yo.x - a.x, (yo.y - a.y) / PROF]; rapido = K.vel * galope; }
      else if (a.tipo === 'coyote' && a.objetivo && !a.objetivo.comido && !a.objetivo.carneado) {
        // A la carroña; ahí, a comer.
        const o = a.objetivo, dO = Math.hypot(o.x - a.x, (o.y - a.y) / PROF);
        if (dO > 10) { ir = [o.x - a.x, (o.y - a.y) / PROF]; rapido = 0.35 * galope; }
        else { a.come += dt; if (a.come >= C.coyote.come) { o.comido = true; a.objetivo = null; } }
      }
      if (ir) {
        let ang = Math.atan2(ir[1], ir[0]);
        if (rapido > 0.5 * galope) {
          if (A.zigzag) { a.zz -= dt; if (a.zz <= 0) { a.zz = 0.35 + hash(a.fase, reloj) * 0.3; a.lado = -(a.lado || 1); } ang += 0.8 * a.lado; }
          else ang += Math.sin(a.fase) * 0.4;
          a.fase += dt * 2;
        }
        a.vx = Math.cos(ang) * rapido; a.vy = Math.sin(ang) * rapido * PROF;
      } else {
        // Pastan: a veces dan unos pasos.
        a.pasto -= dt;
        if (a.pasto <= 0) {
          a.pasto = 2 + hash(a.fase, reloj) * 4;
          const ang = hash(reloj, a.fase) * Math.PI * 2;
          a.vx = Math.cos(ang) * 14; a.vy = Math.sin(ang) * 14 * PROF;
        }
        a.vx *= 1 - Math.min(1, dt * 0.8); a.vy *= 1 - Math.min(1, dt * 0.8);
      }
      const nx = a.x + a.vx * dt, ny = a.y + a.vy * dt;
      if (sePuede(nx, ny)) { a.x = nx; a.y = ny; a.anda = (a.anda || 0) + Math.hypot(a.vx, a.vy / PROF) * dt; } else { a.vx = -a.vx; a.vy = -a.vy; a.fase += 1.3; }
      if (Math.abs(a.vx) > 1) a.mira = Math.sign(a.vx);
    }
  }

  /** 🐺 A lo que quedó muerto sin carnear, a los `llega` segundos, viene un coyote desde lejos. */
  function llamarCoyotes() {
    for (const m of activos) {
      if (m.vivo || m.carneado || m.comido || m.tipo === 'coyote' || m.coyote || reloj - m.muerte < C.coyote.llega) continue;
      const ang = hash(m.x, m.y, 21) * Math.PI * 2, cx = m.x + Math.cos(ang) * 600, cy = m.y + Math.sin(ang) * 600 * PROF;
      if (!sePuede(cx, cy)) continue;
      const c = nuevo('coyote', cx, cy, m.celda);
      c.objetivo = m;
      m.coyote = c;
      const lista = celdas.get(m.celda);
      if (lista) lista.push(c);
      activos.push(c);
    }
  }

  /** Éste y los de su especie que andan con él (a menos de `sentidos.grupo`) huyen de vos. */
  function espantarGrupo(a, yo) {
    for (const b of activos) {
      if (!b.vivo || b.tipo !== a.tipo || Math.hypot(b.x - a.x, (b.y - a.y) / PROF) > C.sentidos.grupo) continue;
      b.susto = C.sentidos.huye; b.de = [yo.x, yo.y]; b.alerta = 0;
    }
  }

  /** Todo lo vivo a menos de `radio` de (x, y) se espanta y huye de ahí. */
  function espantar(x, y, radio) {
    for (const a of activos) if (a.vivo && Math.hypot(a.x - x, (a.y - y) / PROF) < radio) { a.susto = 4; a.de = [x, y]; }
  }

  function morir(a) {
    a.vivo = false; a.vx = a.vy = 0; a.muerte = reloj; a.alerta = 0;
    if (a.tipo === 'guanaco') { const p = partida(); (p.guanacos = p.guanacos || []).push(diaPoblado); }
  }

  /**
   * 🎯 LA BALA DE (x0, y0) A (x1, y1) EN ESTE CUADRO: el primer animal vivo que cruza y en qué zona (cabeza, corazón o
   * cuerpo; ver `zonasDe`), o null. Se mira de a puntitos de una unidad: la cabeza de un venado mide 3.
   */
  function impacto(x0, y0, x1, y1, meta) {
    const largo = Math.hypot(x1 - x0, y1 - y0), pasos = Math.max(1, Math.ceil(largo));
    const cerca = activos.filter((a) => a.vivo && Math.abs(a.x - (x0 + x1) / 2) < largo / 2 + 30 && Math.abs(a.y - (y0 + y1) / 2) < largo / 2 + 40);
    if (!cerca.length) return null;
    const cajas = cerca.map((a) => [a, zonasDe(a)]);
    for (let i = 1; i <= pasos; i++) {
      const x = x0 + ((x1 - x0) * i) / pasos, y = y0 + ((y1 - y0) * i) / pasos;
      for (const [a, Z] of cajas) {
        const zona = zonaDelBalazo(Z, x, y);
        if (zona) return dondeApunto(a, Z, meta) || { a, zona, x, y };
      }
    }
    return null;
  }
  // 🔁 (Se ve de costado: la bala que cruza la pantalla no entra por el pecho del que te mira, pega donde pusiste la
  // mira. Si la mira estaba sobre el animal, esa zona; si no —la bala se desvió y lo rozó—, la primera que cruza.)
  function dondeApunto(a, Z, meta) {
    if (!meta) return null;
    const [x, y] = meta;
    const zona = zonaDelBalazo(Z, x, y);
    return zona ? { a, zona, x, y } : null;
  }

  /**
   * 🩸 EL BALAZO *(Santi: "un disparo a la cabeza los abate al instante al igual que cerca del corazón, un tiro en las otras
   * zonas lo deja sangrando, huye a menor velocidad y deja el rastro de sangre")*: `fuerza` (la del arma, ya con la
   * distancia) por lo que vale la zona (`tiros.zonas`). Si llega al aguante, cae en el acto; si no, queda herido y huye
   * de `desde` con todo su grupo. Lo que no pega en la cabeza le hace un agujero al cuero. Devuelve si murió.
   */
  function herir(a, fuerza, zona, x, y, desde) {
    const A = C.animales[a.tipo];
    a.herida += fuerza * C.tiros.zonas[zona];
    if (zona !== 'cabeza') a.agujeros++;
    for (let i = 0; i < 5; i++) salpicones.push({ x, y, vx: (hash(i, reloj, x) - 0.5) * 30, vy: -hash(reloj, i, y) * 25, t: reloj });
    if (a.herida >= A.aguante) { morir(a); return true; }
    espantarGrupo(a, { x: desde[0], y: desde[1] });
    return false;
  }

  // 🩸 Las gotas del rastro (duran `tiros.gotaDura` s) y lo que salpica el balazo.
  const gotas = [], salpicones = [];
  function dibujarSangre(r) {
    while (gotas.length && reloj - gotas[0].t > C.tiros.gotaDura) gotas.shift();
    // 🔁 (De a un punto no se veía sobre la tierra: cada gota es una manchita de dos o tres puntos, siempre la misma.)
    const P = 0.75;
    for (const g of gotas) {
      const x = Math.round(g.x / P) * P, y = Math.round(g.y / P) * P, h = hash(x, y, 7);
      r.rect(x, y, 2 * P, P, '#8e1c12');
      r.rect(x + (h < 0.5 ? -P : 2 * P), y + (h < 0.25 || h > 0.75 ? -P : P), P, P, '#6a1a14');
    }
    for (let i = salpicones.length - 1; i >= 0; i--) {
      const s = salpicones[i], t = reloj - s.t;
      if (t > 0.35) { salpicones.splice(i, 1); continue; }
      r.rect(s.x + s.vx * t, s.y + s.vy * t + 60 * t * t, 0.8, 0.8, '#a02418');
    }
  }

  /** Lo muerto sin carnear a menos de `al` de (x, y). */
  const presaCerca = (x, y, al) => activos.find((a) => !a.vivo && !a.carneado && !a.comido && Math.hypot(a.x - x, (a.y - y) / PROF) < al);

  return {
    actualizar, espantar, impacto, herir, dibujarSangre, presaCerca,
    get activos() { return activos; },
    /** Para las señales (los buitres): lo que hay, menos lo que ya se comió el coyote. */
    paraBuitres: () => activos.filter((a) => !a.comido),
    /** Lo que se dibuja. */
    visibles: () => activos.filter((a) => !a.carneado && !a.comido),
    dibujar,
    get reloj() { return reloj; },
  };
}

// ── El dibujo (figuras básicas) ──
/** Qué tan grande se dibuja cada uno (la figura chiquita se agranda, como las piezas de los lugares). */
// (🔁 La liebre iba a 1,2, su tamaño de verdad, y no se entendía qué era: un poco más grande que la real.)
// 🔁 A LA MEDIDA DE JAMES, QUE MIDE 1,80 *(Santi: "adaptá los tamaños a James")*: una unidad son unos 8 cm. El berrendo
// 0,90 m a la cruz y 1,40 de largo, el venado 1,00 y 1,60, el guanaco 1,15 (con la cabeza a 1,80) y 1,70, el coyote 0,60 y
// 1,10. El zorro y la liebre, un poco más grandes que los de verdad: más chicos no se entienden.
const TAM = { liebre: 1.3, berrendo: 1.12, venado: 1.14, coyote: 1, zorro: 1, guanaco: 1.2 };

/**
 * Cada uno: largo y alto del cuerpo, patas, colores (lomo, panza, patas), y lo propio (orejas, cuernos, cola, cuello).
 * Se dibuja mirando a la derecha; si mira a la izquierda, se da vuelta.
 */
const FORMAS = {
  liebre:   { L: 6,  H: 3, P: 2, lomo: '#8a7a62', panza: '#d8ccb4', patas: '#5e5040', cuello: 0, cabeza: [3, 2] },
  berrendo: { L: 15, H: 5, P: 5, lomo: '#b07a44', panza: '#efe6d6', patas: '#5a3e24', cuello: 4, cabeza: [4, 3] },
  venado:   { L: 17, H: 5, P: 6, lomo: '#8a5a34', panza: '#d8c0a0', patas: '#4e3420', cuello: 3, cabeza: [4, 3] },
  coyote:   { L: 13, H: 4, P: 4, lomo: '#9a8a70', panza: '#d0c4a8', patas: '#6a5c48', cuello: 1, cabeza: [4, 3] },
  zorro:    { L: 9,  H: 3, P: 3, lomo: '#c0542a', panza: '#f0e0d0', patas: '#2a1a14', cuello: 1, cabeza: [4, 2] },
  guanaco:  { L: 17, H: 5, P: 7, lomo: '#b08458', panza: '#f0e6d6', patas: '#8a6440', cuello: 4, cabeza: [3, 3] },
};

/** `ancla` y `cam`: la cámara sin pegar a la grilla y la pegada (ver dibujarVenado). */
function dibujar(r, a, noche = false, ancla = null, cam = null) {
  if (nuevo(a)) { dibujarVenado(r, a, noche, ancla, cam); return; }
  const s = TAM[a.tipo];
  r.ctx.save(); r.ctx.translate(a.x, a.y); r.ctx.scale(s, s); r.ctx.translate(-a.x, -a.y);
  (a.vivo ? parado : tendido)(r, a, FORMAS[a.tipo]);
  r.ctx.restore();
}

/** Dónde va cada parte del parado, sin escalar ni dar vuelta (mirando a la derecha). */
function geometria(a, F) {
  const x = Math.round(a.x), y = Math.round(a.y), m = Math.round(F.L / 2);
  const corre = Math.hypot(a.vx, a.vy) > 40;
  const top = y - F.P - F.H;
  // (⚠️ Pastando, la cabeza abajo; alerta, bien arriba: así se lee que te notó.)
  const pasta = !corre && !(a.alerta > 0.25) && !a.curioso && a.herida <= 0 && a.tipo !== 'coyote' && a.tipo !== 'zorro';
  const sube = pasta ? -2 : F.cuello + (a.alerta > 0.25 ? 2 : 0);
  const [cw, ch] = F.cabeza, cx = x + m - 2 + (pasta ? 1 : 0), cy = top - sube;
  return { x, y, m, corre, top, pasta, sube, cw, ch, cx, cy };
}

/**
 * 🎯 LAS ZONAS DEL BALAZO, en el mundo (ya agrandadas y dadas vuelta como se dibuja): la cabeza; el corazón, el tercio de
 * adelante y la mitad de abajo del cuerpo (detrás de la pata delantera); el cuerpo, el resto (lomo, ancas, cuello, patas).
 * Cada zona, una lista de cajas [x, y, ancho, alto].
 */
function zonasDe(a) {
  if (nuevo(a)) return zonasVenado(a);
  const F = FORMAS[a.tipo], s = TAM[a.tipo], g = geometria(a, F);
  const caja = (x, y, w, h) => {
    let X = a.x + (x - a.x) * s, Y = a.y + (y - a.y) * s;
    const W = w * s, H = h * s;
    if (a.mira < 0) X = 2 * a.x - X - W;
    return [X, Y, W, H];
  };
  const tercio = Math.max(2, Math.round(F.L * 0.3));
  return {
    cabeza: [caja(g.cx + 1, g.cy - g.ch + 1, g.cw, g.ch)],
    corazon: [caja(g.x + g.m - tercio, g.top + F.H / 2, tercio, F.H / 2)],
    cuerpo: [caja(g.x - g.m, g.top, F.L, F.H), caja(g.x - g.m, g.y - F.P, F.L, F.P), ...(g.sube > 0 ? [caja(g.cx, g.cy, 2, g.sube + 1)] : [])],
  };
}

/** La zona en (x, y), o null: con cajas, o punto por punto en el dibujo (el venado nuevo). */
function zonaDelBalazo(Z, x, y) {
  if (Z.fn) return Z.fn(x, y);
  for (const zona of ['cabeza', 'corazon', 'cuerpo']) for (const [ax, ay, aw, ah] of Z[zona]) if (x >= ax && x <= ax + aw && y >= ay && y <= ay + ah) return zona;
  return null;
}

// ── 🦌 EL VENADO NUEVO (prueba del camino "B") ──
let NUEVOS = {}, ACHATADO = 0.62;
const PT = CONFIG.estilo.punto / 4;
// (Un ciclo entero del paso son unos 1,4 m; del galope, unos 5,5 m, como un venado de verdad: en unidades de 8 cm.)
// 🔁 El galope era de 4 m y las patas iban demasiado rápido para lo que avanzaba.
const ZANCADA = { paso: 17, galope: 65 };
/**
 * Los animales con dibujo nuevo (Blender pasado a puntos y retocado): el venado y, 🆕 con el cuerpo del venado cambiado,
 * el berrendo *(Santi: "arrancá con el berrendo así")*. Cada uno se prende con su llave en CAMPO.caza.dibujoNuevo.
 */
const DIBUJOS = {
  venado: { dibujo: dibujoVenado, mapa: mapaVenado },
  berrendo: { dibujo: dibujoBerrendo, mapa: mapaBerrendo },
};
const nuevo = (a) => !!(NUEVOS[a.tipo] && DIBUJOS[a.tipo]);

/**
 * Qué dibujo le toca: la vista (norte, sur, este, oeste: la de su marcha), la pose y el cuadro.
 * Caminar y correr, en las 4 vistas; quieto, pastando o muerto, sólo de costado: del lado hacia el que iba.
 * *(Santi: "las poses de comer y hacer cosas sean solo de costado y caminar y correr" de frente también)*
 */
function poseVenado(a) {
  const v = Math.hypot(a.vx, a.vy / ACHATADO);
  if (a.vivo && v > 3) a.vista4 = Math.abs(a.vx) >= Math.abs(a.vy) / ACHATADO ? (a.vx > 0 ? 'este' : 'oeste') : (a.vy > 0 ? 'sur' : 'norte');
  if (a.vivo && Math.abs(a.vx) > 3) a.lado = a.vx > 0 ? 'este' : 'oeste';
  const vista = a.vista4 || (a.mira < 0 ? 'oeste' : 'este');
  const deCostado = vista === 'este' || vista === 'oeste' ? vista : a.lado || (a.mira < 0 ? 'oeste' : 'este');
  if (!a.vivo) return { vista: deCostado, pose: 'muerto', cuadro: 0 };
  if (v > 40) return { vista, pose: 'galope', cuadro: Math.floor(((a.anda || 0) / ZANCADA.galope) * 8) % 8 };
  if (v > 3) return { vista, pose: 'paso', cuadro: Math.floor(((a.anda || 0) / ZANCADA.paso) * 8) % 8 };
  return { vista: deCostado, pose: geometria(a, FORMAS[a.tipo]).pasta ? 'pasta' : 'quieto', cuadro: 0 };
}

function dibujarVenado(r, a, noche, ancla = null, cam = null) {
  const T = r.ctx.getTransform();
  // De lejos (un punto no llega a 2 píxeles) va el dibujo chico, como el caballo.
  const chico = Math.abs(T.a) * PT < 2, pt = chico ? 2 * PT : PT;
  const elige = poseVenado(a);
  a.dibujo = elige;
  const fino = !!NUEVOS.bordeFino && CONFIG.estilo.bordeGente < CONFIG.estilo.punto;
  const D = DIBUJOS[a.tipo].dibujo({ tam: chico ? 'chico' : 'grande', ...elige, fino }, noche);
  // (pegado a la grilla de la pantalla, como el caballo: si no, tiembla un punto al correr)
  const pegar = (v, esc, corre) => (T.b || T.c ? v : (Math.round((esc * v + corre) / CONFIG.estilo.punto) * CONFIG.estilo.punto - corre) / esc);
  // 🔁 (Contado desde la cámara sin pegar, como las carretas: pegado a la grilla de la pantalla nada más, el que corría a
  // tu lado daba saltitos de un punto para adelante y para atrás; ella y la cámara se pegaban en cuadros distintos.
  // *Santi: "poneselo a los animales también"*.)
  const P = CONFIG.estilo.punto / Math.abs(T.a || 1);
  const desde = (v, an, k) => (an != null && k != null && !(T.b || T.c) ? k + Math.round((v - an) / P) * P : v);
  const ox = pegar(desde(a.x - D.x * pt, ancla && ancla.x, cam && cam.x), T.a, T.e), oy = pegar(desde(a.y - D.y * pt, ancla && ancla.y, cam && cam.y), T.d, T.f);
  const deFrente = elige.vista === 'norte' || elige.vista === 'sur';
  r.ctx.save();
  r.ctx.globalAlpha = 0.25; r.ctx.fillStyle = '#000';
  // (la sombra, pegada como el dibujo: suelta, se deslizaba debajo de las patas)
  r.ctx.beginPath(); r.ctx.ellipse(ox + D.x * pt, oy + D.y * pt, deFrente ? 4 : 10, deFrente ? 5 : 2, 0, 0, Math.PI * 2); r.ctx.fill();
  r.ctx.restore();
  r.ctx.drawImage(D.lienzo, ox, oy, D.lienzo.width * pt, D.lienzo.height * pt);
  // 🧪 El borde fino de un píxel, el de la gente: se marca en la máscara y se traza al final del cuadro.
  if (fino) estiloNuevo.marcarGente(r.ctx, D.lienzo, ox, oy, D.lienzo.width * pt, D.lienzo.height * pt);
}

/** 🎯 El balazo al venado nuevo: punto por punto en su dibujo de cerca; la cabeza y el corazón, de lo que midió Blender. */
function zonasVenado(a) {
  const d = a.dibujo || poseVenado(a), D = DIBUJOS[a.tipo].mapa('grande', d.vista, d.pose, d.cuadro);
  const x0 = a.x - D.x * PT, y0 = a.y - D.y * PT;
  return { fn: (x, y) => {
    const px = (x - x0) / PT, py = (y - y0) / PT, fila = D.m[Math.floor(py)], ch = fila && fila[Math.floor(px)];
    if (!ch || ch === '.' || ch === 'o') return null;
    if (D.cab && Math.hypot(px - D.cab[0], py - D.cab[1]) <= D.cab[2]) return 'cabeza';
    if (D.cor && Math.hypot(px - D.cor[0], py - D.cor[1]) <= D.cor[2]) return 'corazon';
    return 'cuerpo';
  } };
}

function parado(r, a, F) {
  const { x, y, m, corre, top, sube, cw, ch, cx, cy } = geometria(a, F);
  const t = performance.now() / (corre ? 70 : 300);
  r.ctx.save();
  if (a.mira < 0) { r.ctx.translate(x * 2, 0); r.ctx.scale(-1, 1); }
  r.ctx.globalAlpha = 0.25; r.rect(x - m, y - 1, F.L, 2, '#000'); r.ctx.globalAlpha = 1;
  for (const [lx, f] of [[-m + 1, 0], [-m + 3, 1.5], [m - 3, 0.7], [m - 1, 2.2]]) {
    r.rect(x + lx, y - F.P + (corre ? Math.round(Math.sin(t + f)) : 0), 1, F.P, F.patas);
  }
  r.rect(x - m, top, F.L, F.H, F.lomo);
  r.rect(x - m, top + F.H - 2, F.L, 2, F.panza);
  // El cuello y la cabeza, adelante.
  if (sube > 0) r.rect(cx, cy, a.tipo === 'guanaco' ? 3 : 2, sube + 1, F.lomo);
  r.rect(cx + 1, cy - ch + 1, cw, ch, a.tipo === 'guanaco' ? '#6a5a50' : F.lomo);
  propio(r, a.tipo, x, y, m, top, cx, cy, ch, F);
  r.ctx.restore();
}

/** Lo que distingue a cada uno. */
function propio(r, tipo, x, y, m, top, cx, cy, ch, F) {
  if (tipo === 'liebre') {
    r.rect(cx + 1, cy - ch - 3, 1, 4, F.lomo); r.rect(cx + 2, cy - ch - 3, 1, 4, '#5e5040');  // las orejas largas
    r.rect(x - m - 1, top + 1, 1, 1, '#f0e6d6');                                            // la cola blanca
  } else if (tipo === 'berrendo') {
    r.rect(x - m - 1, top, 2, 3, '#efe6d6');                                                 // el anca blanca
    r.rect(cx + 2, cy - ch - 1, 1, 2, '#2b2018');                                            // los cuernos
    r.rect(cx + 1, top + 1, 2, 1, '#efe6d6');                                                // las fajas del cuello
  } else if (tipo === 'venado') {
    r.rect(x - m - 1, top, 1, 2, '#f0e6d6');                                                 // la cola
    r.rect(cx + 1, cy - ch - 3, 1, 3, '#c8b090'); r.rect(cx + 3, cy - ch - 3, 1, 3, '#c8b090');  // la cornamenta
    r.rect(cx, cy - ch - 4, 2, 1, '#c8b090'); r.rect(cx + 3, cy - ch - 4, 2, 1, '#c8b090');
  } else if (tipo === 'coyote') {
    r.rect(cx + 4, cy - ch + 2, 2, 1, F.lomo);                                               // el hocico
    r.rect(cx + 1, cy - ch - 1, 1, 2, F.lomo); r.rect(cx + 3, cy - ch - 1, 1, 2, F.lomo);   // las orejas
    r.rect(x - m - 3, top + 1, 3, 2, '#7a6a54');                                             // la cola caída
    r.rect(x - m - 4, top + 3, 2, 1, '#2a2018');
  } else if (tipo === 'zorro') {
    r.rect(cx + 4, cy - ch + 1, 2, 1, F.lomo);                                               // el hocico
    r.rect(cx + 1, cy - ch - 1, 1, 2, '#2a1a14'); r.rect(cx + 3, cy - ch - 1, 1, 2, '#2a1a14');  // las orejas negras
    r.rect(x - m - 6, top, 6, 2, F.lomo); r.rect(x - m - 7, top, 2, 2, '#f0e0d0');           // la cola larga, punta blanca
  } else if (tipo === 'guanaco') {
    r.rect(cx + 1, cy - ch - 1, 1, 2, '#6a5a50'); r.rect(cx + 3, cy - ch - 1, 1, 2, '#6a5a50');  // las orejas
    r.rect(cx, top, 2, F.H - 2, F.panza);                                                    // el pecho claro
    r.rect(x - m - 1, top, 1, 2, F.lomo);                                                    // la colita
  }
}

/** Muerto: tendido de costado, las patas para un lado. */
function tendido(r, a, F) {
  const x = Math.round(a.x), y = Math.round(a.y), m = Math.round(F.L / 2), lado = a.mira < 0 ? -1 : 1;
  r.rect(x - m, y - 3, F.L, 3, F.lomo);
  r.rect(x - m, y - 1, F.L, 1, F.panza);
  r.rect(lado > 0 ? x + m - 1 : x - m - 2, y - 4, 3, 2, a.tipo === 'guanaco' ? '#6a5a50' : F.lomo);
  for (const lx of [-m + 2, -m + 4, m - 4, m - 2]) r.rect(x + lx, y, 1, 2, F.patas);
}
