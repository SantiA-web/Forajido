/**
 * 😈 LA TENTACIÓN, LAS SEÑALES Y LAS TRAICIONES — LOS NÚMEROS (BANDA-NUEVA.md, "La tentación" y "Las señales y las
 * traiciones"; etapa 5, parte 1) *(Santi, 2026-11-22: "sí, arrancá con la parte 1")*. Las reglas, en
 * systems/tentacion.js. Son los del simulador (simulador/banda3.js v19: `N.tentacion`, `N.ofertaCada`, `N.cortar`…).
 *
 * Cada uno de la banda tiene **tentación** de 0 a `max` (en la montaña, `maxMontana`: el final aprieta).
 *  - **Sube**: al llegar a un tramo nuevo del viaje (+1, salvo al Honorable); una **oferta** cada `ofertaCada` golpes
 *    (`ofertaCadaMontana` en la montaña) a uno al azar (al Honorable nunca); la **oferta de la ley**, una vez, cuando tu
 *    recompensa llega a `ofertaLey` (+1 a uno, no al Honorable); y al que **acusaste sin razón** (+1).
 *  - **Baja**: cuando gana una marca de lealtad (o le sobran favores con la lealtad en 5), −1; y cuando le **pagas** su
 *    señal, −1.
 *  - **La señal**: la noche del golpe (y la madrugada que sigue, después de moverse la lealtad), si la tentación
 *    alcanza a la lealtad. Queda hasta que la resuelvas: **pagar** (`cortar`, o la parte de tu plata de `cortarParte`, lo
 *    que sea más; la 2ª vez, además, una queja al de más lealtad de los otros; la 3ª ya no se paga), **echarlo** (se va
 *    sabiendo tus planes: recompensa +`echadoRecompensa` y el golpe siguiente la ley te espera, botín a la mitad; los
 *    que estaban bien con él, queja) o **salir al golpe igual**: entonces traiciona.
 *  - **Desde el bosque** (`sospechososDesde`) la señal no dice quién: "uno de los dos". **Vigilar** (`vigilar`, gratis
 *    con un Rastreador) lo revela; pagar sin vigilar es **acusar**: si te equivocas, el inocente anota queja doble y +1
 *    de tentación, y el verdadero se va esa misma noche.
 *  - **Qué traición**: el Egoísta se va con `seLleva` de tu bolsa; el Rastrero o el Mentiroso, con tu recompensa en
 *    `ofertaLey` o más, te vende (botín a la mitad); los demás se van sin llevarse nada.
 * Medido (simulador v19, 3000 partidas): el que cuida a la banda ve alguna señal en 51 de cada 100 partidas y tiene
 * 0,05 traiciones por partida; el tacaño, señal siempre y 2,4 traiciones.
 */
export const TENTACION = {
  /** 🔑 La llave: con false no hay tentación, ni señales, ni traiciones. */
  activa: true,
  inicio: { tommy: 0, frank: 1, santiago: 1 },
  /** El Rastrero arranca con esto (los contratados, etapa 6). */
  inicioRastrero: 2,
  max: 4,
  maxMontana: 5,
  ofertaCada: 4,
  ofertaCadaMontana: 3,
  ofertaLey: 600,
  cortar: [80, 80],
  cortarParte: [0.1, 0.15],
  echadoRecompensa: 300,
  /** Desde este golpe (el bosque) la señal no dice quién. */
  sospechososDesde: 17,
  vigilar: 50,
  /** Lo que se lleva el Egoísta de tu bolsa al irse. */
  seLleva: 0.25,
};
