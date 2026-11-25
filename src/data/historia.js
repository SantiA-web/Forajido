/**
 * 📖 LA HISTORIA — LOS NÚMEROS Y LOS ENCARGOS (HISTORIA.md y HISTORIA-DESIERTO.md; *Santi, 2026-11-22: "vamos con la
 * cadena"*). Las reglas del motor, en systems/historia.js; las escenas, en data/escenas.js; los textos, en
 * text/historia.js.
 *
 * Las decisiones son de dos tipos *(Santi)*: las **Diarias** (la botella, los civiles, el reparto: las de siempre) y
 * las **de Historia**, escritas a mano: "si pasó X, en N golpes pasa Z, a menos que hagas K". Nada de "cada N golpes".
 * ⚠️ Los montos son provisorios: se miden en el simulador antes de darlos por buenos.
 *
 * 🔁 2026-11-23: todo por días, no por asaltos *(Santi: "Nadie sabe cuántos asaltos va a durar la región o el juego,
 * deja de medirlo así… Que sea por días y por partes de día")*. El desierto ya no termina en un asalto: termina con la
 * salida, después del tren de Cole; y Cole viene por la fama o la recompensa (`fama`, abajo).
 */
export const HISTORIA = {
  /** 🔑 La llave: con false el juego vuelve a la carta y el maletín de antes (y entregar el maletín termina todo). */
  activa: true,
  /** "El Cuervo" en el diario: la mañana después del primer golpe de `botin` o más, o `igualDias` días después del
   *  primer golpe que salió bien, aunque no haya sido grande. */
  cuervo: { botin: 300, igualDias: 7 },
  /**
   * 📣 LA FAMA DEL CUERVO (HISTORIA-DESIERTO.md, "La fama"; medida en `simulador/fama.js`) *(Santi: "Asaltos ganados y
   * que renombren al Cuervo deberían subirla… Matar guardias y civiles sube la recompensa, también debería subir la
   * fama"; "La recompensa debería subir con la fama")*. Lo de antes (un jefe, algo raro en el botín, tres golpes
   * limpios) sigue sumando como siempre (data/tratos.js, `famaSube`).
   *  - `golpeBien`: volviste con botín; `golpeGrande`: y fue de `grandeDesde` o más. `diario`: "El Cuervo", una vez.
   *  - `guardia`, `civil`: cada uno muerto (fama mala, pero fama).
   *  - `recompensa`: lo que sube la recompensa por cada punto de fama (la mitad).
   *  - `cole`: Cole viene cuando la fama llega a `fama` o la recompensa a `recompensa` *(Santi eligió 300 o $900)*.
   */
  fama: {
    golpeBien: 10, golpeGrande: 10, grandeDesde: 300, diario: 30,
    guardia: 3, civil: 5,
    recompensa: 0.5,
    cole: { fama: 300, recompensa: 900 },
  },
  /**
   * ✉️ LAS CARTAS DE J.Mc. POR LA FAMA (HISTORIA-DESIERTO.md, "Cuando la fama sube, y cuando no") *(Santi: "si
   * conseguiste una buena fama, John debería felicitarte… Si el jugador falló los asaltos… le mandará una carta
   * diciéndole que los asaltos tienen que ser efectivos")*.
   *  - `buenTrabajo`: la primera vez que la fama llega acá (la mitad del camino), "hiciste un buen trabajo".
   *  - LA CUENTA: el Cuervo "sonó" cuando la fama subió `minimo` o más desde la última vez *(Santi, 2026-11-23: eligió
   *    20 y no 22: "con un asalto bien hecho y con buen botín ya llegarías"; con 20 alcanza un golpe grande sin matar a
   *    nadie, con 22 había que matar un guardia)*. 🔁 Antes contaba si subía algo: un guardia muerto (+3) ya la
   *    reiniciaba, y J.Mc. casi nunca se enteraba de que el Cuervo no sonaba.
   *  - `efectivos` días sin sonar: "que sean efectivos". `desconfia` días: J.Mc. desconfía y cobra `cuotaDesconfia` por
   *    golpe, hasta que el Cuervo vuelva a sonar. `rennick` días: los Rennick matan a tres en un tren, J.Mc. le paga
   *    al diario para que diga que fue el Cuervo, y Cole viene *(Santi: "falsifica que los Cuervos asaltaron un tren…
   *    ese tren en realidad lo asaltaron los Rennick y a John le vino como anillo al dedo")*: la deuda sube
   *    `deudaRennick` y la recompensa `recompensaRennick` (la ley cree que mataste a tres).
   */
  /**
   * 🍺 LOS RECADOS CON ROSA (HISTORIA-DESIERTO.md, "Quién te escribe al campamento") *(Santi: "no pueden llegar cartas
   * de cualquiera al campamento, si un capataz sabe la ubicación de la banda, un marshal o sheriff cómo no la va a
   * saber"; eligió la recomendación)*. El capataz, Rosa y Dagget dejan el recado en la cantina; llega al campamento
   * cuando tú o uno de la banda bajan al pueblo. Si en `espera` días nadie baja, el que lo dejó se cansa y se pierde.
   * `alPerderse`: lo que queda anotado entonces (el capataz que nadie atendió es lo mismo que decirle que no).
   */
  recados: {
    espera: 4,
    alPerderse: {
      h_capataz: ['sinTratoCapataz'],
      h_parte1: ['sinParteCapataz1'],
      h_parte2: ['sinParteCapataz2'],
      h_se_seca: ['elDesiertoSeSeco'],
    },
  },
  /**
   * 😈 LAS OFERTAS DE OTRAS BANDAS (HISTORIA-DESIERTO.md, "Las ofertas a la banda") 🔁 *(reemplazan a "una oferta
   * cada 4 golpes", que Santi no quería: "nada de cada N asaltos")*. Cuando el Cuervo no suena, la banda del Cuervo
   * deja de valer: a los `dias` sin sonar (contados como la cuenta de J.Mc.: vuelve a empezar cuando suena), otra banda
   * le habla al que menos te quiere de los que están `quienes` (nunca al Honorable). Una oferta por cada número de
   * `dias`. Con el Cuervo sonando, nadie se quiere ir.
   */
  ofertas: {
    dias: [6, 12],
    quienes: ['dudoso', 'aPuntoDeIrse'],
  },
  jmc: {
    buenTrabajo: 150,
    minimo: 20,
    efectivos: 6, desconfia: 12, rennick: 22,
    cuotaDesconfia: 250,
    deudaRennick: 200, recompensaRennick: 200,
  },
  montos: {
    capataz: 40,        // lo que cobra el capataz por decirte cuándo pasa la paga
    parteCapataz: 60,   // su parte de cada paga
    plataCasa: 60,      // lo que pide Santiago para mandar a su familia
    plataNorte: 80,     // lo que le adelantas antes de irse al norte
    venderMaletin: 150, // lo que paga el perista por el maletín
    sobre: 80,          // la plata del sobre del maletín, si lo abres y te lo quedas
    recompensaVender: 200, // lo que sube tu recompensa si vendes lo de J.Mc.
    libroCapataz: 120,  // lo que paga el capataz por el libro de la mina
    llave: 150,         // lo que hay en la caja fuerte que abre la llave del guardia
    multaGuardia: 150,  // lo que sube la deuda con J.Mc. si matas a su hombre
    dagget: 100,        // lo que sube tu recompensa si Dagget te persigue
  },
};

/**
 * ✉️ LOS ENCARGOS *(Santi: "John debería hacer pedidos concretos a la banda (cómo hicimos con el maletín antes)... que
 * libere a alguien en el tren, o que hable con un guardia... o gente del pueblo... o algún miembro de la banda")*.
 * Cada uno marca un tren del horario (`tipo`), o va en el tren de otra marca (`en`: el libro y el sobrino van en el de
 * la paga). `dias`: a cuántos días de la carta sale su tren ("unos 4 días después"; sin `dias`, el primero que haya,
 * desde mañana). Lo que haces adentro, mientras no estén las mecánicas del tren, se elige con un cartel al volver *(Santi
 * eligió la A)*. `de`: quién lo pidió (si se te pasa el tren, lo nota él).
 */
export const ENCARGOS = {
  maletin: { de: 'jmc', tipo: 'carga', dias: 4 },
  veterano: { de: 'tommy', tipo: 'pasajeros' },
  libro: { de: 'rosa', en: 'paga' },
  guardia: { de: 'jmc', tipo: 'pasajeros' },
  hollister: { de: 'frank', tipo: 'carga' },
  preso: { de: 'jmc', tipo: 'carga' },
  sobrino: { de: 'dagget', en: 'paga2' },
  cole: { de: 'jmc', tipo: 'pasajeros', dias: 4 },
};

/**
 * 🚂 LOS TRENES MARCADOS QUE NO SON ENCARGOS (los pone la historia sola, cuando pasó lo que dice el guion):
 *  - `paga` y `paga2`: la paga de La Viuda. Con trato con el capataz, se sabe día y hora y dice qué es; sin trato, llega
 *    como un rumor de la cantina, sin decir qué es.
 *  - `rennick` y `rennick2`: un tren que era de los Rennick (el mismo día que el del veterano, y otro después del aviso
 *    de Eli). Llega como un rumor de la cantina más: nada dice que es de otros.
 * `tras`: los hechos de los que sale (el primero que pasó); `dias`: cuántos días después de ese hecho pasa el tren.
 * (🔁 Antes, `desde`: el asalto desde el que aparecía.)
 */
export const MARCAS = {
  // "Pagarle $40 → la paga sale en el horario, con su día y su hora, 4 días después." (Sin trato, el rumor, igual.)
  paga: { tipo: 'carga', tras: ['tratoCapataz', 'sinTratoCapataz'], dias: 4 },
  // "10 días después de que pasó la primera."
  paga2: { tipo: 'carga', tras: ['pasoLaPaga'], dias: 10 },
  // "Los dos trenes salen el mismo día: hay que elegir uno." (Ver `ponerMarcas` en systems/historia.js: si dijiste que
  // no al veterano, o Tommy nunca te lo pidió, sale igual.)
  rennick: { tipo: 'carga', tras: ['h_veterano_pide'], dias: 2 },
  // "El rumor que llega 2 días después del aviso de Eli."
  rennick2: { tipo: 'carga', tras: ['avisoEli'], dias: 2 },
};
/** (Si Tommy nunca pidió lo del veterano —no confía en ti—, el tren de los Rennick sale igual desde este día.) */
export const RENNICK_SIN_VETERANO = 14;
