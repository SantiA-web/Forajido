/**
 * 📅 EL TIEMPO: EL CALENDARIO Y LAS PARTES DEL DÍA *(Santi, 2026-11-15: "medir solo por asaltos sería empobrecer el
 * juego")*. Las reglas están en systems/tiempo.js; acá, los números.
 *
 * Lo que eligió Santi:
 *  - **Cuatro partes por día**: mañana y tarde con luz de día y la fogata apagada; noche y madrugada con luz de noche y
 *    la fogata prendida *(Santi: "cuatro partes para que no haya parte del medio por tema de iluminación")*.
 *  - **Empieza el 6 de agosto.**
 *  - **El tiempo pasa sólo con acciones** *(Santi: "sí, con acciones")*: quedarse parado en el campamento no lo gasta.
 *  - **Entre asalto y asalto, 2 o 3 días**, contando el viaje y el descanso.
 */
export const TIEMPO = {
  /** El día en que empieza la partida. (El año no se muestra: sólo hace que los días de la semana caigan bien.) */
  inicio: { anio: 1881, mes: 7, dia: 6 },   // (mes: 0 es enero → 7 es agosto)
  /** La parte del día en que arranca: de noche, con la fogata prendida (el campamento se ve mejor así). */
  parteInicial: 2,
  /** Las cuatro partes, en orden, y cuáles son con luz de día. */
  partes: ['manana', 'tarde', 'noche', 'madrugada'],
  deDia: [true, true, false, false],
  /** La parte en que empieza un día nuevo del calendario: la madrugada (después de la medianoche). */
  cambiaElDia: 3,

  /**
   * LO QUE GASTA CADA COSA, en partes del día.
   *  - Ir al pueblo: una parte (el viaje y lo que hagas allá).
   *  - Salir a un asalto: una parte de viaje antes (el asalto se juega con la luz de la parte siguiente) y dos al
   *    volver (el asalto y la vuelta).
   */
  cuesta: { pueblo: 1, viajeAlTren: 1, asaltoYVuelta: 2 },

  /** En la carpa, "esperar varios días": las opciones. */
  esperarDias: [1, 2, 3, 5, 7],
  /** Cuántos días adelante muestra el calendario en "lo que viene". */
  avisoDias: 14,

  /**
   * 📋 LA PIZARRA ADENTRO DEL CALENDARIO (systems/pizarra.js, scenes/calendario.js) *(Santi, 2026-11-18: "y si la
   * pizarra la ponemos junto al calendario")*. Lo que eligió: `dias` a la vista ("7 días"), sin el mes entero, las
   * tareas también hablándoles ("En los dos lados") y [Espacio] una parte, [Shift]+[Espacio] un día. Practicar y
   * mirar ocupan la mañana y la tarde (`partesTarea`: el que sale a la mañana vuelve a la noche).
   */
  pizarra: { activo: true, dias: 7, partesTarea: 2 },
};
