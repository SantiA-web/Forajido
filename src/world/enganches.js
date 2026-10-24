/**
 * 🆕 LOS ENGANCHES QUE SE ESTIRAN Y SE ENCOGEN (fase 2 de "LOS ENGANCHES", ver NOTAS-DISENO.md) *(Santi: "la mecánica
 * es que se encojan y se alarguen los enganches, en el de pasajeros se notará más porque va más rápido que el de
 * carga"; eligió la C: pasajeros de 36 a 60, carga de 42 a 54)*.
 *
 * EL TREN ES UNA GRILLA FIJA, y mover los vagones de verdad sería rehacer los choques, los caminos de los guardias y
 * las balas. Lo que se mueve es EL DIBUJO: cada vagón se corre unos puntos, con todo lo que lleva adentro.
 *
 * 🚂 UN TREN DE VERDAD, CON PESO *(Santi: "el movimiento de los vagones está muy trabado y diferente al del enganche.
 * No me siento, como jugador, en un tren en movimiento")*. La primera versión movía cada enganche con su propio vaivén,
 * la cámara con otro y la luz con otro: tres cosas que no se conocían. Ahora es UNA cuenta: cada vagón es un peso
 * (`p`, cuánto se corrió de su lugar; `v`, a qué velocidad), y cada enganche, un resorte entre dos vagones, con
 * topes en las puntas (el largo mínimo y el máximo: ahí chocan). La locomotora tira de la punta y el tirón corre
 * hacia atrás de vagón en vagón, solo; la vía, despareja, empuja cada vagón un poquito, siempre. De la misma cuenta
 * sale todo: el largo de cada enganche, cuánto se corre tu vagón contra el desierto (lo que antes hacía el vaivén
 * de la cámara) y el meneo de los faroles (un péndulo colgado de tu vagón: frena el vagón, el farol sigue).
 *
 * LOS TIRONES (CONFIG.enganches): en el de pasajeros, cada tanto, con aviso antes (el crujido y las cadenas que
 * tiemblan); en el de carga el tirón es el traqueteo de siempre (`empezarTiron`, desde scenes/raidScene.js).
 */
import { CONFIG } from '../data/config.js';
import { PALETA } from '../engine/paleta.js';

/** Los enganches de este tren (los tramos 'enganche', de punta a punta) y sus vagones, cada uno con su peso. */
export function crearEnganches(train, rng, estado = []) {
  const S = train.map.size, K = CONFIG.enganches;
  const tipo = train.tipoTren && train.tipoTren.id === 'carga' ? 'carga' : 'pasajeros';
  const [min, max] = K.rango[tipo];
  const lista = (train.tramos || []).filter((t) => t.tipo === 'enganche').map((t) => ({
    x0: t.colStart * S, x1: (t.colStart + t.cols) * S, largo: (t.cols) * S, tenso: 0,
  }));
  // Un vagón más que enganches: el de antes del primero y uno después de cada uno (el último lleva la locomotora).
  // Cada uno con su vía despareja: dos ondas lentas a su compás.
  const vagones = Array.from({ length: lista.length + 1 }, () => ({
    p: 0, v: 0,
    ondas: [0, 1].map(() => ({
      vel: K.viaVel[0] + rng.next() * (K.viaVel[1] - K.viaVel[0]), fase: rng.next() * Math.PI * 2,
    })),
  }));
  const cada = K.tironCada[tipo];
  const frenos = estado.includes('frenosDañados');
  const FR = K.frenos;
  return {
    tipo, lista, vagones, min, max, reloj: 0, tiron: null, frenos,
    proximoFrenazo: frenos ? FR.cada[0] + rng.next() * (FR.cada[1] - FR.cada[0]) : Infinity,
    proximoArrancon: Infinity,
    fuerza: K.fuerza[tipo],
    meneo: 0, pendulo: { a: 0, w: 0 }, meneoAgua: 0, agua: { a: 0, w: 0 }, vAncla: 0,
    // (En el de carga no: su tirón lo pone el traqueteo.)
    proximo: cada ? cada[0] + rng.next() * (cada[1] - cada[0]) : Infinity,
  };
}

/**
 * EMPIEZA UN TIRÓN: `sentido` 1 estira (la locomotora acelera), -1 encoge (frena). `aviso`: cuánto dura el aviso
 * antes del golpe. Devuelve true (para que el que lo llama haga sonar el crujido).
 */
export function empezarTiron(E, sentido, aviso = CONFIG.enganches.tironAviso) {
  E.tiron = { sentido, t: 0, aviso };
  return true;
}

/** Arranca y frena despacio (de 0 a 1). */
const suave = (t) => t * t * (3 - 2 * t);

/**
 * Avanza la cuenta. `anclaX`: dónde estás (el péndulo de los faroles cuelga de ese vagón). Devuelve, en el cuadro en
 * que pasa: 'aviso' (arranca un tirón propio: el crujido), 'frenazoAviso' (arranca el chirrido de un frenazo),
 * 'frenazo' (el golpe del frenazo), 'arranconAviso' o 'arrancon' (el arrancón de después), o 'tiron' (el golpe de un
 * tirón común; el sentido, en `E.tiron.sentido`). Cada enganche que se cierra del todo marca `aplasto` en ese cuadro.
 */
export function actualizarEnganches(E, dt, rng, anclaX) {
  const K = CONFIG.enganches, FR = K.frenos;
  E.reloj += dt;
  let evento = null;
  // 🛑 El frenazo, si este tren tiene los frenos rotos: le gana al tirón de siempre, y lo corre para después.
  if (E.frenos && !E.tiron && E.reloj >= E.proximoFrenazo) {
    E.tiron = { sentido: -1, t: 0, aviso: FR.aviso, frenazo: true };
    E.proximoFrenazo = E.reloj + FR.cada[0] + rng.next() * (FR.cada[1] - FR.cada[0]);
    E.proximo = Math.max(E.proximo, E.reloj + FR.aviso + 3);
    evento = 'frenazoAviso';
  }
  // 🚂 Y el arrancón que viene después de cada frenazo (lo agenda el golpe del frenazo, más abajo).
  if (E.frenos && !E.tiron && E.reloj >= E.proximoArrancon) {
    E.tiron = { sentido: 1, t: 0, aviso: FR.arranconAviso, arrancon: true };
    E.proximoArrancon = Infinity;
    E.proximo = Math.max(E.proximo, E.reloj + FR.arranconAviso + 3);
    evento = 'arranconAviso';
  }
  if (!E.tiron && E.reloj >= E.proximo) {
    empezarTiron(E, rng.next() < 0.5 ? 1 : -1);
    const cada = K.tironCada[E.tipo];
    E.proximo = E.reloj + cada[0] + rng.next() * (cada[1] - cada[0]);
    evento = 'aviso';
  }
  const T = E.tiron;
  // Lo que empuja la locomotora: nada en el aviso (sólo se tensan las cadenas); después, un empujón que sube y baja
  // suave. El resto lo hacen los resortes: el tirón llega a cada vagón un poco después que al de adelante.
  let loco = 0;
  const V = E.vagones, n = V.length, base = K.base;
  const lo = E.min - base, hi = E.max - base;
  if (T) {
    const antes = T.t;
    T.t += dt;
    const golpe = T.frenazo ? FR.golpe : K.tironGolpe;
    const tt = (T.t - T.aviso) / golpe;
    if (tt > 0 && tt < 1) loco = T.sentido * (T.frenazo ? FR.fuerza : T.arrancon ? FR.arranconFuerza : E.fuerza) * Math.sin(Math.PI * tt) ** 2;
    if (T.frenazo && antes < T.aviso && T.t >= T.aviso) {
      evento = 'frenazo';
      E.proximoArrancon = E.reloj + FR.arranconCada[0] + rng.next() * (FR.arranconCada[1] - FR.arranconCada[0]);
    }
    if (T.arrancon && antes < T.aviso && T.t >= T.aviso) evento = 'arrancon';
    // (🧳 Y el golpe de un tirón común: lo tirado en el piso se desliza, ver world/caidas.js.)
    if (!T.frenazo && !T.arrancon && antes < T.aviso && T.t >= T.aviso) evento = evento || 'tiron';
    if (T.t > T.aviso + golpe + K.tironCalma) E.tiron = null;
  }
  // El tope de encogido de cada enganche: en el frenazo se corre hasta `cierre` (los vagones casi se tocan); después
  // sigue al enganche mientras se vuelve a abrir, sin empujarlo (`g.lo`).
  const cerrando = T && T.frenazo && T.t >= T.aviso && T.t < T.aviso + FR.golpe + FR.cerrado;
  E.lista.forEach((g, k) => {
    const e = V[k + 1].p - V[k].p;
    g.lo = cerrando ? FR.cierre - base : Math.min(lo, Math.max(g.lo ?? lo, e));
  });
  // En pasitos: con los topes duros, un paso de un cuadro entero se pasaría de largo.
  const PASOS = 4, h = Math.min(dt, 0.05) / PASOS;
  const F = new Array(n);
  for (let s = 0; s < PASOS; s++) {
    const t = E.reloj - dt + (s + 1) * h;
    for (let i = 0; i < n; i++) {
      const w = V[i];
      // La vía despareja, y la vuelta a su lugar (el tren entero no se va: es lo que sobra o falta de velocidad).
      let f = K.via * (Math.sin(t * w.ondas[0].vel * Math.PI * 2 + w.ondas[0].fase) + 0.6 * Math.sin(t * w.ondas[1].vel * Math.PI * 2 + w.ondas[1].fase));
      f += -K.vuelta * w.p - K.vueltaFreno * w.v;
      F[i] = f;
    }
    F[n - 1] += loco;
    for (let k = 0; k < n - 1; k++) {
      const e = V[k + 1].p - V[k].p, de = V[k + 1].v - V[k].v;
      let f = -K.resorte * e - K.freno * de;
      // Los topes: más allá del largo máximo (o del mínimo) choca, duro.
      if (e > hi) f -= K.tope * (e - hi) + K.topeFreno * de;
      else if (e < E.lista[k].lo) f -= K.tope * (e - E.lista[k].lo) + K.topeFreno * de;
      F[k + 1] += f;
      F[k] -= f;
    }
    for (let i = 0; i < n; i++) { V[i].v += F[i] * h; V[i].p += V[i].v * h; }
  }
  E.lista.forEach((g, k) => {
    const e = V[k + 1].p - V[k].p;
    g.largo = (g.x1 - g.x0) + e;
    g.estira = base + e;
    g.tenso = T && T.t < T.aviso ? 1 : 0;
    // 🦵 EL CHOQUE CONTRA EL TOPE (`choque`: 1 estirado, -1 encogido, sólo en el cuadro en que llega): es lo que te
    // hace trastabillar (scenes/raidScene.js).
    const fuera = e > hi ? 1 : e < lo ? -1 : 0;
    g.choque = fuera && fuera !== g.fuera && E.reloj - (g.ultimoChoque ?? -9) > K.choqueCada ? fuera : 0;
    if (g.choque) g.ultimoChoque = E.reloj;
    g.fuera = fuera;
    // 🛑 Se cerró del todo (`aplasto`, sólo en el cuadro en que pasa): al que esté adentro lo aplastan.
    const cerrado = g.estira <= FR.aplasta;
    g.aplasto = cerrado && !g.cerrado;
    g.cerrado = cerrado;
  });

  // 🏮 EL PÉNDULO DE LOS FAROLES, colgado de tu vagón: lo empuja lo que acelera el vagón, para el otro lado.
  const ancla = V[indiceDeVagon(E, anclaX ?? 0)];
  const acel = (ancla.v - E.vAncla) / Math.max(1e-4, dt);
  E.vAncla = ancla.v;
  const pendular = (P, vel, freno) => {
    const om = Math.PI * 2 * vel;
    P.w += (-om * om * P.a - freno * P.w - acel * K.penduloEmpuje) * dt;
    P.a += P.w * dt;
    return 1.3 * Math.tanh(P.a / 1.3);
  };
  E.meneo = pendular(E.pendulo, K.penduloVel, K.penduloFreno);
  // 💧 Y el agua de los barriles, que se hamaca con el mismo vagón *(Santi: "el agua creo que se sigue moviendo con el
  // movimiento anterior")*.
  E.meneoAgua = pendular(E.agua, K.aguaVel, K.aguaFreno);
  return evento;
}

/** En qué vagón (de la cuenta) cae `x`: el de antes del primer enganche que todavía no empezó. */
function indiceDeVagon(E, x) {
  let i = 0;
  while (i < E.lista.length && x >= (E.lista[i].x0 + E.lista[i].x1) / 2) i++;
  return i;
}

/**
 * CUÁNTO SE CORRE EL DIBUJO EN `x`: lo que se corrió su vagón; dentro de un enganche, entre lo de un vagón y lo del
 * otro (se estira parejo).
 */
export function corrimientoEn(E, x) {
  const V = E.vagones;
  for (let k = 0; k < E.lista.length; k++) {
    const g = E.lista[k];
    if (x <= g.x0) return V[k].p;
    if (x < g.x1) return V[k].p + ((V[k + 1].p - V[k].p) * (x - g.x0)) / (g.x1 - g.x0);
  }
  return V[V.length - 1].p;
}

/** Los puntos del dibujo, en la grilla de quien los lleva (`ox`: el borde del vagón del que cuelgan). */
function pintor(ctx, PASO) {
  return (x, y, w, h, i, ox = 0) => {
    ctx.fillStyle = PALETA[i];
    ctx.fillRect(ox + Math.round((x - ox) / PASO) * PASO, Math.round(y / PASO) * PASO, Math.max(1, Math.round(w)) * PASO, Math.max(1, Math.round(h)) * PASO);
  };
}

/**
 * EL PISO DEL ENGANCHE, del largo que tiene ahora (debajo de la gente). `corr(x)` es el corrimiento del dibujo (el
 * de scenes/raidScene.js). Para cada uno:
 *  - LAS DOS PLATAFORMAS, una pegada a cada vagón: de chapa remachada, con el canto del lado del hueco.
 *  - LA CHAPA DEL MEDIO, estriada, que se desliza sobre las dos: estirado, apenas las pisa; encogido, las tapa.
 * Cada plataforma va en la grilla de SU vagón: los vagones se corren de a píxel de pantalla, no de a punto, y si no
 * la plataforma iba a los saltitos contra su vagón.
 * Afuera no hay luz de vagón: de noche lo oscurece lo de siempre (la oscuridad de afuera de los vagones).
 */
export function dibujarEnganches(r, E, corr, fila0, fila1, S) {
  const PASO = CONFIG.estilo.punto / 4, punto = pintor(r.ctx, PASO);
  const y0 = fila0 * S, y1 = (fila1 + 1) * S, PLAT = S;
  const ctx = r.ctx;
  for (const g of E.lista) {
    const XL = g.x0 + corr(g.x0), XR = g.x1 + corr(g.x1);
    // 🛑 Cerrado por un frenazo, las plataformas se montan: nada se sale del hueco entre los dos vagones.
    ctx.save();
    ctx.beginPath();
    ctx.rect(XL, y0 - S, Math.max(0, XR - XL), y1 - y0 + 2 * S);
    ctx.clip();
    // La sombra en la grava, debajo del borde de adelante: el enganche va en el aire, sobre la vía.
    punto(XL, y1, (XR - XL) / PASO, 2, 0, XL);
    for (const [a, b, canto, ox] of [[XL, XL + PLAT, XL + PLAT - 2 * PASO, XL], [XR - PLAT, XR, XR - PLAT, XR]]) {
      const w = (b - a) / PASO, h = (y1 - y0) / PASO;
      punto(a, y0, w, h, 0, ox);
      // De chapa remachada, oscura *(Santi eligió la C: las tablas "no me cerraban", se confundían con el piso del
      // vagón)*; la del medio, más clara, se desliza encima.
      // 🐛 Oxidada y no gris: el gris, con el tinte azul de la noche, quedaba azul marino.
      punto(a, y0 + PASO, w, h - 2, 32, ox);
      for (let k = 0; k < 5; k++) punto(a + PASO * (2 + ((k * 7) % Math.max(1, w - 5))), y0 + PASO * (3 + ((k * 5) % Math.max(1, h - 7))), 2, 1, 47, ox);
      for (let y = y0 + PASO * 3; y < y1 - PASO * 2; y += PASO * 4) for (const x of [a + PASO * 2, b - PASO * 3]) punto(x, y, 1, 1, 35, ox);
      punto(canto, y0 + PASO, 2, h - 2, 23, ox);
    }
    // La chapa del medio, estriada, que se desliza sobre las dos plataformas (va con la de atrás, que la sostiene).
    const pa = XL + PLAT - 4, pb = Math.max(pa, XR - PLAT + 4), py0 = y0 + PASO * 3, py1 = y1 - PASO * 3;
    punto(pa - PASO, py0 - PASO, (pb - pa) / PASO + 2, (py1 - py0) / PASO + 2, 0, XL);
    punto(pa, py0, (pb - pa) / PASO, (py1 - py0) / PASO, 23, XL);
    punto(pa, py0, (pb - pa) / PASO, 1, 24, XL);
    for (let y = py0 + PASO * 2, j = 0; y < py1 - PASO; y += PASO * 3, j++) {
      for (let x = pa + PASO * (1 + (j % 2) * 1.5); x < pb - PASO; x += PASO * 3) punto(x, y, 1, 1, 24, XL);   // las estrías
    }
    punto(pa, py1 - PASO, (pb - pa) / PASO, 1, 31, XL);
    ctx.restore();
  }
}

/**
 * LAS CADENAS DE LOS COSTADOS, de poste a poste (uno en la punta de cada plataforma, de cada lado), a la altura de la
 * cintura: miden lo del enganche más largo, así que estirado del todo quedan tirantes y encogido cuelgan lo que les
 * sobra. Es lo que dice de un vistazo cuánto mide el hueco. En el aviso de un tirón tiemblan.
 *
 * 🐛 Sueltas en el aire parecían antenas: cuelgan de un poste de fierro.
 * 🐛 VAN CON LA GENTE, NO CON EL PISO *(Santi: "arreglá eso de las cadenas")*: dibujadas con el piso, el que pasaba
 * detrás de la de adelante quedaba encima de ella. Ahora son dos cosas paradas más, cada una con su base (el pie de
 * sus postes), y se ordenan con todo lo demás: la de atrás queda detrás tuyo; la de adelante, delante.
 * Devuelve [{ base, draw }], para la lista de scenes/raidScene.js.
 */
export function cadenasDeEnganches(r, E, corr, fila0, fila1, S) {
  const PASO = CONFIG.estilo.punto / 4, punto = pintor(r.ctx, PASO);
  const y0 = fila0 * S, y1 = (fila1 + 1) * S, PLAT = S, ALTO_POSTE = 8;
  const cosas = [];
  for (const g of E.lista) {
    for (const pie of [y0 + PASO, y1 - PASO * 2]) {
      cosas.push({
        base: pie + PASO,
        draw: () => {
          const XL = g.x0 + corr(g.x0), XR = g.x1 + corr(g.x1);
          const ca = XL + PLAT - PASO * 2, cb = XR - PLAT + PASO, hueco = Math.max(0, cb - ca);
          // 🛑 Cerrado por un frenazo, los postes quedarían metidos en el otro vagón: no se ven.
          if (cb < ca) return;
          const LARGO_CADENA = E.max - 2 * PLAT + PASO * 3;
          const cuelga = Math.min(PASO * 7, Math.sqrt(Math.max(0, LARGO_CADENA * LARGO_CADENA - hueco * hueco)) * 0.5);
          const tiembla = g.tenso ? (Math.floor(E.reloj * 30) % 2 ? PASO : -PASO) * 0.5 : 0;
          const yc = pie - PASO * (ALTO_POSTE - 1);
          for (const [x, ox] of [[ca, XL], [cb, XR]]) {
            punto(x - PASO, yc - PASO, 3, ALTO_POSTE + 1, 0, ox);
            punto(x, yc, 1, ALTO_POSTE, 31, ox);
            punto(x, yc, 1, 1, 24, ox);
          }
          const n = Math.max(1, Math.round(hueco / PASO));
          for (let k = 1; k < n; k++) {
            const t = k / n, x = ca + hueco * t, y = yc + PASO + cuelga * 4 * t * (1 - t) + (k % 2 ? tiembla : 0);
            punto(x, y, 1, 1, k % 2 ? 24 : 0, XL);
          }
        },
      });
    }
  }
  return cosas;
}

/**
 * 🎯 ¿EL TREN SE ESTÁ SACUDIENDO? Desde el golpe de un tirón y por `sacudonDura` segundos *(Santi: "sí, agregalo": que
 * el tirón también te mueva las manos al tirar, como el traqueteo)*. El aviso no: ahí sólo crujen las cadenas.
 */
export function sacudiendo(E) {
  const T = E.tiron;
  return !!T && T.t >= T.aviso && T.t < T.aviso + CONFIG.enganches.sacudonDura;
}

/** ¿Está chirriando un frenazo (el aviso)? Para el cartel y las chispas. */
export function frenazoEnAviso(E) {
  const T = E.tiron;
  return !!T && T.frenazo && T.t < T.aviso;
}

/** El enganche en el que cae `x` (o null). */
export function engancheEn(E, x) {
  return E.lista.find((g) => x >= g.x0 && x < g.x1) || null;
}

/**
 * 🚶 CRUZAR UN ENGANCHE ESTIRADO LLEVA MÁS TIEMPO, Y UNO ENCOGIDO MENOS. La grilla no se estira: el que cruza se dibuja
 * estirado con el enganche (`corrimientoEn`), así que a su paso de siempre se lo veía avanzar más rápido que sus
 * piernas, patinando. Por eso, en el enganche se camina a `ancho / largo`: en pantalla, el paso de siempre; y de
 * yapa, cruzar uno estirado tarda más *(Santi: "se vería mal hacerlo más lento o más rápido… pero vos sos el
 * experto")*. Vale para todos (lo usa `frenoAt`): vos, los guardias, las reses.
 */
export function pasoEn(E, x) {
  const g = engancheEn(E, x);
  return g ? (g.x1 - g.x0) / Math.max(1, g.largo) : 1;
}

/** Las columnas de los enganches (para que el dibujo viejo no las pinte encima). */
export function columnasDeEnganches(E, S) {
  const cols = new Set();
  for (const g of E.lista) for (let c = Math.round(g.x0 / S); c < Math.round(g.x1 / S); c++) cols.add(c);
  return cols;
}
