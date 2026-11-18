/**
 * 🔥 LOS MOMENTOS DEL CAMPAMENTO *(ver BRUJULA.md, "El campamento: corto y con presión"; etapa 3 de la rebanada del
 * desierto)*: cada visita al campamento pasa algo que pide una decisión, y la decisión le cambia la lealtad a la banda.
 *
 * Cómo funciona:
 *  - Una **visita nueva** es cuando llegás al campamento de afuera (al empezar, después de un asalto, al salir de la
 *    cárcel); ir al pueblo o al mapa y volver es la misma visita.
 *  - En cada visita nueva se elige **un momento** de los que todavía no pasaron y pueden pasar ahora (\`cuando\`): el de
 *    más \`prioridad\` primero, y entre los de igual prioridad, al azar. Cada uno pasa una vez por partida.
 *  - El que lo trae (\`quien\`: uno de la banda, la carta o el forastero) tiene un "!" encima; con [E] se abre.
 *  - **La lealtad en 0** *(Santi eligió lo que propuse: "me gusta lo recomendado")*: la primera visita en 0 te avisa
 *    ("si esto sigue así, me voy"); si en la visita siguiente sigue en 0, se va durante la noche.
 *
 * Lo que dice cada uno está en text/es.js (\`T.camp.momentos\`). ⚠️ Los números (cuánta lealtad, cuánto dinero) son de
 * primer tanteo. Las \`marca\`s quedan anotadas para lo que viene (la resaca de Frank en su papel, la promesa a Tommy,
 * el forastero que capaz es un soplón): todavía no hacen nada.
 */
import { BANDA, MIEMBRO, cambiarLealtad, seVa } from './banda.js';
import { ANIMO } from './rasgos.js';
import { moverPersonalidad, marcaFuerte, actividad } from '../systems/animo.js';
import { eventoDeAnimo, multDelReparto, recordar, anotarPor } from '../systems/animoEnJuego.js';
import { ENCARGO } from './encargo.js';
import { rumorDelForastero } from '../systems/horario.js';

/**
 * 🙂 🔁 LOS MOMENTOS MUEVEN EL HUMOR *(Santi: "conectá todo lo del ánimo", 2026-11-15)*. Cada opción dice qué evento del
 * ánimo le pasa a quién (`animo`: `{ id: 'evento' }` o `[[id, 'evento', cuánto rinde, motivo]]`), con los números de
 * `ANIMO.eventos` (data/rasgos.js): los mismos que mide el simulador. Esos eventos ya traen su parte de lealtad, así
 * que la `lealtad` suelta de antes (+1, −2…) quedó sólo donde el simulador no tiene nada (la carta, el forastero).
 * `personalidad`: `[[id, rasgo, cuánto]]` (sacarle la botella baja el alcohólico; dársela lo sube).
 */
const IDS = BANDA.map((m) => m.id);

/**
 * 🎭 LAS MARCAS, EN EL ASALTO QUE SIGUE (etapa 5). Se llama al terminar cada asalto de verdad, antes de que se vacíen
 * los papeles:
 *  - `promesaATommy`: si le diste un papel, cumpliste (+1); si no, se la rompiste (−2). Si estaba herido, no cuenta.
 *  - `frankResaca`: dura un solo asalto (lo que hace está en `sortearPlan`, data/banda.js).
 *  - `forastero` ('agradecido' o 'soplon', sorteado al ayudarlo): ya hizo lo suyo en este asalto; queda la noticia.
 * Lo que hay que contarle al jugador va a `noticias` y se dice al llegar al campamento.
 */
export function cerrarAsalto(g) {
  const C = g.campamento, M = C.marcas, b = g.banda;
  C.noticias = C.noticias || [];
  if (M.promesaATommy) {
    delete M.promesaATommy;
    if (esta(g, 'tommy') && !b.tommy.herido) {
      const cumpliste = !!b.tommy.papel;
      // (📒 Con la libreta: favor, o queja doble por la palabra rota.)
      if (b.tommy.libreta) anotarPor(g, 'tommy', cumpliste ? 1 : -2, 'promesaTommy');
      else cambiarLealtad(b, 'tommy', cumpliste ? 1 : -2);
      C.noticias.push(cumpliste ? 'tommyCumplida' : 'tommyRota');
    }
  }
  delete M.frankResaca;
  // 🗣️ Tommy pidió ir adelante: si lo mandaste de pasajero, contento aunque le haya ido mal; si no, se la rompiste.
  if (M.adelanteTommy) {
    delete M.adelanteTommy;
    if (esta(g, 'tommy')) {
      const cumpliste = b.tommy.papel === 'pasajero';
      eventoDeAnimo(g, 'tommy', cumpliste ? 'adelanteCumplido' : 'pedidoNo');
      C.noticias.push(cumpliste ? 'tommyAdelante' : 'tommyAdelanteRoto');
    }
  }
  // 🗣️ El trato con Santiago dura un asalto.
  delete M.tratoSantiago;
  if (M.forastero) {
    C.noticias.push(M.forastero === 'soplon' ? 'forasteroSoplon' : 'forasteroAgradecido');
    delete M.forastero;
  }
}

/** Lo que se guarda del campamento en la partida (\`gameState.campamento\`). */
export function campamentoInicial() {
  return {
    visitas: 0,        // visitas nuevas
    asaltos: 0,        // asaltos hechos (de verdad, no las pruebas)
    vistos: [],        // los momentos que ya pasaron
    marcas: {},        // lo que quedó anotado de cada decisión
    avisados: {},      // los que ya avisaron que se van (lealtad en 0)
    pendientes: [],    // lo que espera que vayas a hablar: [{ id, quien }]
    noticias: [],      // 🎭 lo que se cuenta al llegar (ver `cerrarAsalto`)
  };
}
export function completarCampamento(c) {
  return { ...campamentoInicial(), ...(c || {}) };
}

const esta = (g, id) => !!(g.banda && g.banda[id] && g.banda[id].esta);
/** Si recién volviste de un asalto (lo que pasó en él todavía no se habló). */
const recien = (g) => !!(g.ultimoAsalto && g.ultimoAsalto.recien);

/**
 * 🎭 LOS NÚMEROS DE LO QUE VUELVE DEL ASALTO (etapa 6). ⚠️ De primer tanteo, salvo los del reparto, que son de Santi.
 *  - `repartoDesde`: el botín desde el que se pelea el reparto (y desde el que alguien pregunta por su parte).
 *  - `repartoCada`: después de un reparto, cuántos asaltos tienen que pasar para que haya otro.
 *  - `medico`: lo que cuesta el médico de un herido. `algo`: la parte que das cuando te preguntan (del botín).
 *  - `porVisita`: cuántas situaciones puede haber como mucho en una visita (BRUJULA: "una o dos").
 */
export const REACCIONES = { repartoDesde: 501, repartoCada: 4, medico: 100, algo: 0.15, porVisita: 2, adelanteCada: 4 };

/** 🗣️ Si Santiago está y se le nota lo egoísta (entonces pide su parte él solo: ver `miParte`). */
const santiagoEgoista = (g) => esta(g, 'santiago') && marcaFuerte(g.banda.santiago, 'egoista');

/** Si ya pasaron los asaltos que tienen que pasar desde el último reparto. */
function repartoDisponible(g) {
  const C = g.campamento;
  return C.ultimoReparto == null || C.asaltos - C.ultimoReparto >= REACCIONES.repartoCada;
}

/** Quién trae ese momento (algunos dependen de lo que pasó: el herido, el de los caballos). */
export function quienTrae(id, g) {
  const q = MOMENTOS[id].quien;
  return typeof q === 'function' ? q(g) : q;
}

/**
 * Cada momento: quién lo trae, cuándo puede pasar y sus opciones. Cada opción: \`lealtad\` (cuánto sube o baja a
 * quién), \`dinero\` (lo que te cuesta) y \`marca\` (qué queda anotado). \`opciones\` puede ser una función de la partida
 * (el reparto depende de cuánto trajiste).
 */
export const MOMENTOS = {
  // 1. El primer encargo del tipo (J.Mc.): siempre lo primero.
  encargo: {
    quien: 'carta', prioridad: 100,
    cuando: () => true,
    opciones: [
      { id: 'contar', lealtad: { santiago: 1, frank: 1, tommy: 1 }, marca: 'bandaSabeLaPromesa' },
      { id: 'guardar' },
    ],
  },
  /**
   * ✉️ LA NOCHE DE J.Mc. No los elige la visita (`cuando` da siempre no): los pone `revisarEncargo` cuando toca.
   * Lo que siente la banda, sólo si les mostraste la primera carta (`bandaSabeLaPromesa`) *(Santi: "la banda se
   * enterará de todo esto dependiendo de si la primer carta el jugador se las mostró o se la guardó para él")*:
   *  - Cumplir: Tommy (honorable) contento; Santiago (frío, egoísta) molesto, porque la plata no se repartió.
   *  - Mentir: Tommy se enoja; Frank (confiable), un poco; a Santiago le gusta.
   *  - No cumplir (o no estar esa noche): Tommy molesto.
   */
  entrega: {
    quien: 'carta', repite: true,
    cuando: () => false,
    opciones: (g) => {
      const puede = g.money >= ENCARGO.dinero && tieneMaletin(g);
      const sabe = !!g.campamento.marcas.bandaSabeLaPromesa;
      return [
        ...(puede ? [
          { id: 'entregar', dinero: ENCARGO.dinero, pagoEntero: true, encargo: 'cumplido', animo: sabe ? { tommy: 'pedidoSi', santiago: 'pedidoNo' } : {} },
          { id: 'mentir', dinero: ENCARGO.dinero, pagoEntero: true, encargo: 'mentira', animo: sabe ? [['tommy', 'peleaPierde'], ['frank', 'pedidoNo', 0.5], ['santiago', 'pedidoSi']] : [] },
        ] : []),
        { id: 'nada', encargo: 'fallado', animo: sabe ? { tommy: 'pedidoNo' } : {} },
      ];
    },
  },
  plazo: {
    quien: 'carta', repite: true,
    cuando: () => false,
    opciones: (g) => [{ id: 'leer', encargo: 'fallado', animo: g.campamento.marcas.bandaSabeLaPromesa ? { tommy: 'pedidoNo' } : {} }],
  },
  // 2. Frank tomó de más la noche antes del asalto.
  botella: {
    quien: 'frank',
    cuando: (g) => g.campamento.vistos.includes('encargo'),
    opciones: [
      { id: 'quitar', animo: { frank: 'sacarBotella' }, personalidad: [['frank', 'alcoholico', -ANIMO.personalidad.contra]], sinResaca: 'frank' },
      // (🗣️ Y cuenta como actividad para el Divertido: "cartas, una botella".)
      { id: 'dejar', animo: [['frank', 'botella', 1, 'botella']], personalidad: [['frank', 'alcoholico', ANIMO.personalidad.aFavor]], marca: 'frankResaca', actividad: 'frank' },
    ],
  },
  // 3. Tommy quiere entrar al tren con vos.
  tommyEntrar: {
    quien: 'tommy',
    cuando: (g) => g.campamento.asaltos >= 1,
    opciones: [
      { id: 'todavia', animo: { tommy: 'pedidoNo' } },
      { id: 'proximo', animo: { tommy: 'pedidoSi' }, marca: 'promesaATommy' },
    ],
  },
  // 4. Santiago recibe noticias de México.
  mexico: {
    quien: 'santiago',
    cuando: (g) => g.campamento.asaltos >= 1 && g.money >= 50,
    opciones: [
      { id: 'dar', animo: { santiago: 'pedidoSi' }, dinero: 50 },
      { id: 'despues', animo: { santiago: 'pedidoNo' } },
    ],
  },
  /**
   * 5. La pelea por el reparto: recién vuelto de un asalto con mucho botín.
   * 🔁 Ya no pasa una sola vez *(Santi: "que ese botín sea de 501 mínimo. Y no pasa en tres asaltos seguidos")*: vuelve
   * con `REACCIONES.repartoDesde` o más, y después de uno pasan `REACCIONES.repartoCada - 1` asaltos sin otro.
   */
  reparto: {
    quien: 'frank', tambien: ['santiago'], prioridad: 50, repite: true,
    cuando: (g) => recien(g) && g.ultimoAsalto.botin >= REACCIONES.repartoDesde && repartoDisponible(g),
    opciones: (g) => {
      const b = g.ultimoAsalto ? g.ultimoAsalto.botin : 0;
      // (🙂 El reparto rinde distinto según quién es: al ambicioso y al egoísta el "me lo guardo" les pega más.)
      const todos = (parejo) => IDS.filter((id) => g.banda[id]).map((id) => [id, parejo ? 'repartoParejo' : 'repartoGuardo', multDelReparto(g.banda[id], parejo)]);
      return [
        // Parejo: cada uno de los cuatro, un cuarto. Vos das tres cuartos.
        { id: 'parejo', animo: todos(true), dinero: Math.round((b * 3) / 4) },
        { id: 'guardo', animo: todos(false) },
        { id: 'santiago', animo: { santiago: 'pedidoSi', frank: 'pedidoNo' }, dinero: Math.round(b / 4) },
        // (🆕 Y al revés *(Santi: "debería también aparecer la opción de darle más a Santiago y no solo darle más a
        // Frank")*.)
        { id: 'frank', animo: { frank: 'pedidoSi', santiago: 'pedidoNo' }, dinero: Math.round(b / 4) },
      ];
    },
  },
  /**
   * 🎭 LO DEL ASALTO VUELVE (etapa 6; Santi eligió las cuatro). Pasan cada vez que se da el caso, recién vuelto.
   */
  // 7. Mataste civiles: Tommy, que quiere honor, te lo reprocha.
  civiles: {
    quien: 'tommy', prioridad: 60, repite: true,
    cuando: (g) => recien(g) && g.ultimoAsalto.civiles > 0,
    opciones: [
      { id: 'defender', animo: { tommy: 'pedidoNo' } },
      { id: 'perdon', animo: { tommy: 'pedidoSi', frank: 'pedidoNo' } },
    ],
  },
  // 8. A uno de la banda le pegaron: el médico cuesta, pero lo cura un asalto antes.
  herido: {
    quien: (g) => ((g.ultimoAsalto && g.ultimoAsalto.heridos) || []).find((id) => esta(g, id)) || null,
    prioridad: 60, repite: true,
    cuando: (g) => recien(g) && !!MOMENTOS.herido.quien(g),
    opciones: (g) => {
      const id = MOMENTOS.herido.quien(g);
      return [
        // (📅 El médico le saca 3 días de herida: era un asalto, y ahora las heridas van por días.)
        { id: 'medico', animo: { [id]: 'pedidoSi' }, dinero: REACCIONES.medico, cura: 3, pagoEntero: true },
        { id: 'nada', animo: { [id]: 'pedidoNo' } },
      ];
    },
  },
  // 9. El caballo llegó tarde: se lo reprochás (los demás lo ven) o lo dejás pasar.
  caballoTarde: {
    quien: (g) => (g.ultimoAsalto && g.ultimoAsalto.caballoTarde) || null,
    prioridad: 55, repite: true,
    cuando: (g) => recien(g) && !!g.ultimoAsalto.caballoTarde && esta(g, g.ultimoAsalto.caballoTarde),
    opciones: (g) => {
      const id = g.ultimoAsalto.caballoTarde;
      return [
        { id: 'reprochar', animo: { [id]: 'peleaPierde' } },
        { id: 'dejar', animo: { [id]: 'pedidoSi' } },
      ];
    },
  },
  // 10. Te llevaste mucho y no hubo reparto: Santiago pregunta por su parte.
  deMas: {
    quien: (g) => (esta(g, 'santiago') ? 'santiago' : 'frank'), prioridad: 45, repite: true,
    cuando: (g) => recien(g) && g.ultimoAsalto.botin >= REACCIONES.repartoDesde && !repartoDisponible(g) && !santiagoEgoista(g),
    opciones: (g) => [
      { id: 'algo', animo: { santiago: 'pedidoSi', frank: 'pedidoSi' }, dinero: Math.round(g.ultimoAsalto.botin * REACCIONES.algo) },
      { id: 'mio', animo: { santiago: 'pedidoNo', frank: 'pedidoNo' } },
    ],
  },
  /**
   * 🗣️ 11. "MI PARTE. AHORA." *(VOCES.md, la opción de Egoísta)*: en lugar del "¿y nuestra parte?" de los dos, viene
   * Santiago solo a pedir la suya. Si además es Frío, se puede hacer un trato: se la das si hace el próximo sin quejarse
   * (en el próximo asalto no se niega a ningún puesto).
   */
  miParte: {
    quien: 'santiago', prioridad: 45, repite: true,
    cuando: (g) => recien(g) && g.ultimoAsalto.botin >= REACCIONES.repartoDesde && !repartoDisponible(g) && santiagoEgoista(g),
    opciones: (g) => {
      const parte = Math.round(g.ultimoAsalto.botin / 4);
      const ops = [
        { id: 'dar', animo: { santiago: 'pedidoSi' }, dinero: parte },
        { id: 'no', animo: { santiago: 'peleaPierde' } },
      ];
      if (marcaFuerte(g.banda.santiago, 'frio')) ops.push({ id: 'trato', animo: [['santiago', 'pedidoSi', 0.5]], dinero: parte, marca: 'tratoSantiago' });
      return ops;
    },
  },
  /**
   * 🗣️ 12. "SEÑOR, DÉJEME IR ADELANTE ESTA VEZ" *(VOCES.md, la opción de Valiente)*: Tommy pide el puesto peligroso (de
   * pasajero, adentro del tren). Si le decís que sí y lo mandás, vuelve contento aunque le vaya mal; si no lo mandás, se
   * la rompiste. Como mucho una vez cada `REACCIONES.adelanteCada` asaltos.
   */
  adelante: {
    quien: 'tommy', prioridad: 10, repite: true,
    cuando: (g) => {
      const C = g.campamento, e = g.banda.tommy;
      return C.asaltos >= 2 && marcaFuerte(e, 'valiente') && !e.herido && !C.marcas.adelanteTommy && !C.marcas.promesaATommy
        && C.asaltos - (C.ultimoAdelante ?? -99) >= REACCIONES.adelanteCada;
    },
    opciones: [
      { id: 'si', animo: { tommy: 'pedidoSi' }, marca: 'adelanteTommy' },
      { id: 'no', animo: { tommy: 'pedidoNo' } },
    ],
  },
  // 6. Un herido pide agua y avisa que la ley viene por el oeste.
  forastero: {
    quien: 'forastero',
    cuando: (g) => g.campamento.visitas >= 2,
    opciones: [
      // (🔁 🗞️ Ayudarlo cuesta $70 de provisiones, y a cambio cuenta de un tren de carga: ver `rumorDelForastero`.)
      { id: 'ayudar', lealtad: { tommy: 1 }, marca: 'forasteroAyudado', dinero: 70, pagoEntero: true },
      { id: 'echar', lealtad: { santiago: -1 } },
    ],
  },
};

/** Las opciones de un momento ya armadas para esta partida. */
export function opcionesDe(id, g) {
  const M = MOMENTOS[id];
  return typeof M.opciones === 'function' ? M.opciones(g) : M.opciones;
}

/** Si están todos los que hacen falta (el que lo trae y los que también están). */
function estanTodos(M, g) {
  const q = typeof M.quien === 'function' ? M.quien(g) : M.quien;
  if (!q) return false;
  const ids = [q, ...(M.tambien || [])].filter((x) => MIEMBRO[x]);
  return ids.every((id) => esta(g, id));
}

/**
 * 🏕️ UNA VISITA NUEVA AL CAMPAMENTO: los que estaban en 0 y ya habían avisado se van; los que llegan a 0 avisan; y se
 * elige un momento. Devuelve los nombres de los que se fueron (para contarlo al llegar). \`azar\`: para las pruebas.
 */
export function visitaNueva(g, azar = Math.random) {
  const C = g.campamento;
  C.visitas++;
  const seFueron = [];
  // (Lo que quedó sin atender de la visita anterior: los avisos se vuelven a decidir abajo; los momentos se pierden.)
  C.pendientes = [];
  for (const m of BANDA) {
    const e = g.banda[m.id];
    if (!e || !e.esta) continue;
    // (🙂 🔁 Avisa con la lealtad debajo de `ANIMO.seVaDebajoDe` (1), como en el simulador; antes, en 0.)
    if (e.lealtad >= ANIMO.seVaDebajoDe) { delete C.avisados[m.id]; continue; }
    if (C.avisados[m.id]) { seVa(g.banda, m.id); delete C.avisados[m.id]; seFueron.push(m.corto); continue; }
    C.avisados[m.id] = true;
    C.pendientes.push({ id: 'aviso', quien: m.id });
  }
  // Un momento: de los que pueden pasar, el de más prioridad; entre iguales, al azar.
  let posibles = Object.entries(MOMENTOS)
    .filter(([id, M]) => (M.repite || !C.vistos.includes(id)) && estanTodos(M, g) && M.cuando(g))
    .map(([id, M]) => ({ id, quien: quienTrae(id, g), p: M.prioridad || 0 }));
  /**
   * 🔁 HASTA DOS POR VISITA (`REACCIONES.porVisita`; antes era uno): el de más prioridad, y entre iguales al azar; cada
   * uno lo trae alguien distinto. (Si al que le toca ya tiene un aviso pendiente, primero el aviso.)
   */
  for (let n = 0; n < REACCIONES.porVisita && posibles.length; n++) {
    const max = Math.max(...posibles.map((x) => x.p));
    const tope = posibles.filter((x) => x.p === max);
    const elegido = tope[Math.floor(azar() * tope.length)];
    if (!C.pendientes.some((p) => p.quien === elegido.quien)) {
      C.pendientes.push({ id: elegido.id, quien: elegido.quien });
      // (El reparto cuenta desde que se planteó, aunque no vayas a hablar: si no, volvería en cada asalto.)
      if (elegido.id === 'reparto') C.ultimoReparto = C.asaltos;
      if (elegido.id === 'adelante') C.ultimoAdelante = C.asaltos;
    }
    posibles = posibles.filter((x) => x !== elegido && x.quien !== elegido.quien);
  }
  if (g.ultimoAsalto) g.ultimoAsalto.recien = false;
  return seFueron;
}

/**
 * ✉️ EL ENCARGO DE J.Mc. (`C.encargo`: `{ vence, fallos, cumplido }`; los números en data/encargo.js).
 *
 * *(Santi eligió todo lo recomendado)*: J.Mc. pasa **la noche del día `vence`, hasta el amanecer** (la noche de ese día
 * y la madrugada del siguiente). La primera vez que estás en el campamento en ese rato, la carta está junto a la carpa
 * (momento `entrega`). Si no estuviste, al volver te espera otra (`plazo`): no cumpliste, y el plazo vuelve a
 * empezar desde que la leés. Se llama al entrar al campamento y cada vez que dejás pasar el tiempo; devuelve el
 * momento que acaba de aparecer (o null), para avisarlo.
 */
export function revisarEncargo(g) {
  const C = g.campamento;
  // (Una partida que ya había leído la primera carta antes de esto: el plazo arranca hoy.)
  if (!C.encargo && C.vistos.includes('encargo')) C.encargo = { vence: g.tiempo.dia + ENCARGO.dias, fallos: 0 };
  const E = C.encargo;
  if (!E || E.cumplido) return null;
  const { dia, parte } = g.tiempo;
  // (La madrugada ya es del día siguiente: ver systems/tiempo.js.)
  const esLaNoche = (dia === E.vence && parte === 2) || (dia === E.vence + 1 && parte === 3);
  const sePaso = dia > E.vence + 1 || (dia === E.vence + 1 && parte !== 3);
  const toca = esLaNoche ? 'entrega' : sePaso ? 'plazo' : null;
  const antes = pendienteDe(g, 'carta');
  if (antes && antes.id === toca) return null;
  C.pendientes = C.pendientes.filter((p) => p.quien !== 'carta');
  if (!toca) return null;
  C.pendientes.push({ id: toca, quien: 'carta' });
  return toca;
}

/** Si el encargo de J.Mc. sigue abierto (para esconder el maletín en el tren de carga). */
export function encargoAbierto(g) {
  const E = g.campamento && g.campamento.encargo;
  return !!(E && !E.cumplido);
}

/** Si tenés el maletín de J.Mc. entre lo que trajiste del tren. */
export function tieneMaletin(g) {
  return !!(g.owned && g.owned.objetos.some((o) => o.id === 'maletin'));
}

/**
 * ✉️ Lo que pasa con lo que elegiste: `cumplido` (se lleva el maletín y la partida termina: `g.finDelJuego`),
 * `mentira` (te quedás el maletín con sus documentos, pero no cumpliste) o `fallado`. Si no cumpliste, otro plazo.
 */
function resolverEncargo(g, como) {
  const C = g.campamento, E = C.encargo;
  if (!E) return;
  if (como === 'cumplido') {
    const i = g.owned.objetos.findIndex((o) => o.id === 'maletin');
    if (i >= 0) g.owned.objetos.splice(i, 1);
    E.cumplido = true;
    g.finDelJuego = 'jmc';
    return;
  }
  if (como === 'mentira') C.marcas.documentos = true;
  E.fallos++;
  E.vence = g.tiempo.dia + ENCARGO.dias;
}

/** Lo que espera a quien (\`id\` de uno de la banda, 'carta' o 'forastero'), o null. */
export function pendienteDe(g, quien) {
  return (g.campamento.pendientes || []).find((p) => p.quien === quien) || null;
}

/**
 * ELEGIR UNA OPCIÓN: aplica lo que cuesta y lo que cambia, lo anota y lo saca de pendientes. Devuelve lo que el
 * jugador tiene que leer: \`cambios\` (\`[{ id, palabra }]\`, sólo los que cambiaron de palabra) y \`dinero\` (lo que pagaste).
 */
export function elegir(g, pendiente, opcionId) {
  const C = g.campamento;
  C.pendientes = C.pendientes.filter((p) => p !== pendiente);
  if (pendiente.id === 'aviso') return { cambios: [], dinero: 0 };
  const op = opcionesDe(pendiente.id, g).find((o) => o.id === opcionId);
  // (Los que se repiten no quedan como vistos; el reparto anota cuándo fue.)
  if (!MOMENTOS[pendiente.id].repite) C.vistos.push(pendiente.id);
  // (El médico: unos días menos de herida.)
  if (op.cura && g.banda[pendiente.quien]) g.banda[pendiente.quien].herido = Math.max(0, g.banda[pendiente.quien].herido - op.cura);
  const dinero = Math.min(op.dinero || 0, g.money);
  g.money -= dinero;
  if (op.marca) C.marcas[op.marca] = true;
  if (pendiente.id === 'encargo') C.encargo = { vence: g.tiempo.dia + ENCARGO.dias, fallos: 0 };
  if (op.encargo) resolverEncargo(g, op.encargo);
  // 🤕 (Al ayudar al forastero se sortea qué era, y se sabe recién después del asalto que sigue.)
  if (op.marca === 'forasteroAyudado') C.marcas.forastero = Math.random() < 0.5 ? 'agradecido' : 'soplon';
  // 🗞️ (Y el tren de carga que cuenta: de verdad o no, 50 y 50.)
  const rumor = op.marca === 'forasteroAyudado' ? rumorDelForastero(g) : null;
  // (📒 `anotes`: lo que anotó cada uno en su libreta, para decirlo abajo del resultado.)
  const cambios = [], humores = [], anotes = [];
  for (const [id, n] of Object.entries(op.lealtad || {})) {
    if (!esta(g, id)) continue;
    if (g.banda[id].libreta) {
      const r = anotarPor(g, id, n, 'm:' + pendiente.id);
      if (r && r.anota) anotes.push({ id, ...r.anota });
      if (r && r.humor) humores.push({ id, humor: r.humor });
      continue;
    }
    const r = cambiarLealtad(g.banda, id, n);
    if (r.cambio) cambios.push({ id, palabra: r.ahora });
  }
  // 🙂 El ánimo: los eventos, la personalidad y la resaca.
  const eventos = Array.isArray(op.animo) ? op.animo : Object.entries(op.animo || {}).map(([id, ev]) => [id, ev]);
  for (const [id, ev, mult = 1, motivo = null] of eventos) {
    if (!esta(g, id)) continue;
    const r = eventoDeAnimo(g, id, ev, mult, g.banda[id].libreta ? motivo || 'm:' + pendiente.id : motivo);
    if (r && r.anota) anotes.push({ id, ...r.anota });
    if (r && r.lealtad && !cambios.some((c) => c.id === id)) cambios.push({ id, palabra: r.lealtad });
    if (r && r.humor) humores.push({ id, humor: r.humor });
  }
  for (const [id, rasgo, n] of op.personalidad || []) if (esta(g, id)) moverPersonalidad(g.banda[id], rasgo, n);
  // 🗣️ (Lo que elegiste queda en lo que le pasó hace poco, para "¿Cómo estás?"; y la botella es una actividad.)
  if (g.banda && g.banda[pendiente.quien]) recordar(g, pendiente.quien, `${pendiente.id}:${opcionId}`);
  if (op.actividad && esta(g, op.actividad)) actividad(g.banda, IDS.filter((id) => esta(g, id)), op.actividad, g.tiempo ? g.tiempo.dia : 0);
  if (op.sinResaca && g.banda[op.sinResaca]) g.banda[op.sinResaca].resaca = false;
  return { cambios, humores, anotes, dinero, rumor };
}
