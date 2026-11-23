/**
 * LOS TRATOS — los números (TRATOS.md en la raíz cuenta el porqué de cada uno).
 *
 * *(Santi, 2026-11-19: "tenés recompensa alta, depende de 'quien es el perista' te puede chantajear diciendo 'o me lo
 * das a este precio o hablo' o le puede dar miedo y ser un punto a favor"; "Este sistema te lo voy a dejar a vos";
 * "recuerda que es un complemento y no un juego de regateo"; "para cualquier tipo de vendedor/comprador")*
 *
 * Acá van SÓLO NÚMEROS, cada cosa con su llave para apagarla. Las reglas están en systems/tratos.js (puras: las usa
 * igual el simulador) y lo que toca el estado del juego en systems/tratosEnJuego.js. Las chances van "de cada 100".
 */
export const TRATOS = {
  activo: true,

  // Lo que el otro ve de ti.
  tramos: { buscado: 200, cartel: 600 },          // la recompensa: desconocido / buscado / tu cara en el cartel
  // `fame` (va en cientos: matar a un jefe da +100 o +150): nadie / se habla de ti / leyenda. Y lo que la sube además
  // del jefe: un golpe que sale en el diario (algo raro, o el maletín) y cada `cadaLimpios` golpes limpios seguidos.
  fama: { seHabla: 100, leyenda: 300 },
  famaSube: { diario: 40, limpios: 30, cadaLimpios: 3 },
  // 📒 LA BANDA LO ANOTA (TRATOS.md, "La banda"): sólo el chantaje y el apretar que termina en soplo, una vez por
  // visita, y cada uno según la fuerza de su rasgo (Tommy, Honorable al 80: 8 de cada 10). Que no sea rutina.
  libreta: { activo: true, honorable: { lado: 'q', motivo: 'peristaSucio' }, pendenciero: { lado: 'f', motivo: 'peristaDuro' } },
  honor: { respetado: 40, temido: -40 },          // abre el fiado / suma a apretar

  // La memoria de cada tratante contigo: cada punto mueve su primera oferta un `porPunto`. 🔁 Medido (v17): si aceptar
  // sumaba un punto, aceptar siempre le ganaba a todo; ahora sólo la mueve lo grande: baja si lo aprietas o te vas de
  // un chantaje, sube cumpliendo un encargo o pagando un fiado (etapas 2 y 3).
  trato: { min: -1, max: 2, porPunto: 0.05, bajaCadaDias: 5 },

  // Si falla, se ENOJA: sus ofertas empeoran `siNo` por `recuerdaDias` días (y mientras está enojado no se le regatea).
  // 🔁 Medido (v17): con 3 días, o bajando además la memoria, regatear perdía contra aceptar siempre; con el día de
  // hoy, regatear da +3% con casi todos y −2% con el Ambicioso: depende de con quién.
  regatear: { activo: true, chance: 50, mas: 0.15, siNo: 0.10, ambicioso: -20, porTrato: 10, recuerdaDias: 0 },

  // Apretar: sólo si te conocen (recompensa, fama u honor temido); nunca con el Valiente.
  apretar: {
    activo: true, desconocido: 15, buscado: 25, cartel: 40, temido: 10, fama: 10, cobarde: 30, tope: 80,
    mas: 0.25, sopla: 30,                          // el Cobarde sopla SIEMPRE que lo aprietas: +$30 de recompensa
    // Si falla: te cierra hasta mañana, queda enojado (más que con un regateo) y pierdes un punto de memoria. 🔁 Medido
    // (v17): si el punto se perdía también cuando salía bien, apretar al Cobarde rendía menos que regatear.
    siNo: 0.15, recuerdaDias: 5,
  },

  // El chantaje del Rastrero: buscado o más + mercadería caliente recién robada.
  chantaje: {
    activo: true, chance: 1 / 3, leyCerca: 1 / 2, paga: 0.55, habla: 0.5, recompensa: 100, recienDias: 2,
    conDeuda: 0.45,                                // con deuda con J.Mc. pendiente, paga todavía menos
  },

  // El Ambicioso: su primera oferta, un 10% peor; pero por un lote grande (desde `loteGrande`) paga un 10% MÁS. Así
  // con él conviene juntar antes de vender (y de paso dejar que se enfríe lo caliente).
  ambicioso: { peor: 0.10, loteGrande: 500, mejor: 0.10 },
  rastrero: { caliente: 0.25 },                    // paga lo caliente un 25% más (no le importa de dónde salió)

  fiado: { activo: true, mas: 0.10, dias: 5, sopla: 30 },

  // Uno de la banda que va a vender (la tarea "vender"): mismas jugadas, sus rasgos eligen.
  mandado: { negociante: 67 },

  // Comprar abre el papel desde este precio (el perista lo abre siempre).
  desde: 80,

  // Lo que se muestra: chances entre estos topes (nunca "seguro").
  chanceMin: 5, chanceMax: 95,
};

/**
 * LOS OFICIOS: cuánto ofrece de entrada sobre lo que vale (al comprarte) o sobre su precio (al venderte), y qué
 * jugadas permite. Primero el perista; los demás quedan listos para la etapa 2 (TRATOS.md, "Por etapas").
 */
export const OFICIOS = {
  perista:     { entrada: 0.75, compra: true,  vende: false, caliente: true,  jugadas: ['regatear', 'apretar'] },
  armero:      { entrada: 1,    compra: false, vende: true,  caliente: false, jugadas: ['regatear', 'apretar', 'fiado'] },
  caballerizo: { entrada: 1,    compra: true,  vende: true,  caliente: false, jugadas: ['regatear', 'apretar', 'fiado'] },
};

/**
 * LOS RASGOS DEL TRATANTE: seis, los que cambian algo de verdad (los mismos ids que `PERSONALIDADES`). Cada partida,
 * el perista saca uno o dos de `SORTEO` (nunca dos que se pisen), y así cada partida es otro perista.
 */
export const RASGOS_TRATANTE = ['ambicioso', 'cobarde', 'valiente', 'rastrero', 'honorable', 'curioso'];
export const SORTEO = {
  // 🔁 (2026-11-20) Entra el Honorable: "un ladrón de palabra", el que más te paga si tienes buen nombre.
  perista: { de: ['ambicioso', 'cobarde', 'valiente', 'rastrero', 'honorable'], dos: 0.5, noJuntos: [['cobarde', 'valiente'], ['honorable', 'rastrero']] },
};

/**
 * EL HONOR SEGÚN QUIÉN *(Santi, 2026-11-20: "no siempre con buen honor el perista te da más dinero, es muy depende de
 * quien es el perista, porque tal vez no le importa que seas buena persona")*. El ajuste de siempre (`ajustePorHonor`,
 * de ±3% a ±20%) se multiplica por lo que cada rasgo hace con él: `alto` si tu honor es bueno, `bajo` si es malo. El
 * Honorable lo agranda; el Rastrero lo da vuelta (desconfía del santo, le gusta el que es como él); el Cobarde sólo
 * mira el malo (te tiene miedo); al Valiente y al Ambicioso les da igual. Con dos rasgos se suman; tope `tope`.
 */
export const HONOR_SEGUN = {
  honorable: { alto: 1.5, bajo: 1.5 },
  rastrero: { alto: -1, bajo: -1 },
  cobarde: { alto: 0, bajo: -1 },
  valiente: { alto: 0, bajo: 0 },
  ambicioso: { alto: 0, bajo: 0 },
  tope: 0.3,
};

/**
 * LA QUÍMICA: el que mandas a vender y el tratante *(Santi, 2026-11-20: "que pasa si alguien con Ambición va a
 * negociar con el perista también ambicioso [...] El jugador no solo debería elegir mandar a alguien por habilidad sino
 * también por quien es con el que va a negociar"; "es más probabilidad, no algo asegurado")*.
 *
 * Cada pareja: `va` (el rasgo del que mandas) con `con` (el del tratante). PASA tantas veces de cada 100 como la fuerza
 * de su rasgo (Tommy, Honorable 80: 80 de cada 100). Lo que hace:
 *   regatear / apretar: suma a la chance; aprieta: lo aprieta aunque no sea pendenciero
 *   chantaje: 'nada' (no lo chantajea), 'aprieta' (lo enfrenta), 'seVuelve' (se vuelve sin vender), 'paga'
 *   chantajeX: el chantaje, tantas veces más seguido; guarda: se guarda esa parte (se arreglan por fuera)
 *   noSopla: aunque lo aprieten, no va al sheriff; pelea: se pelean, no vende y tu recompensa sube eso
 */
export const QUIMICA = [
  { id: 'idioma',        va: 'ambicioso',   con: 'ambicioso', regatear: 20 },
  { id: 'palabra',       va: 'honorable',   con: 'honorable', regatear: 15 },
  // (🔁 Medido: sin el +30, enfrentarlo salía mal casi siempre y el perista hablaba 4 veces por partida.)
  { id: 'loEnfrenta',    va: 'valiente',    con: 'rastrero',  chantaje: 'aprieta', apretar: 30 },
  { id: 'noSeEntienden', va: 'honorable',   con: 'rastrero',  regatear: -15, chantaje: 'seVuelve' },
  { id: 'niSeInmuta',    va: 'frio',        con: 'rastrero',  chantaje: 'nada' },
  { id: 'nervioso',      va: 'frio',        con: 'cobarde',   apretar: 20, aprieta: true },
  { id: 'porFuera',      va: 'egoista',     con: 'ambicioso', guarda: 0.25 },
  { id: 'seCaenBien',    va: 'divertido',   con: 'valiente',  regatear: 10 },
  { id: 'loCalma',       va: 'divertido',   con: 'cobarde',   noSopla: true },
  { id: 'loAsusta',      va: 'pendenciero', con: 'cobarde',   apretar: 20 },
  { id: 'pelea',         va: 'pendenciero', con: 'valiente',  pelea: 30 },
  { id: 'loHuele',       va: 'cobarde',     con: 'rastrero',  chantajeX: 2, chantaje: 'paga' },
  { id: 'aEspaldas',     va: 'rastrero',    con: 'rastrero',  chantaje: 'nada', guarda: 0.25 },
];
// (El orden en que gana una reacción al chantaje si pasan dos: Tommy, Valiente y Honorable, lo enfrenta.)
export const CHANTAJE_ORDEN = ['nada', 'aprieta', 'seVuelve', 'paga'];
