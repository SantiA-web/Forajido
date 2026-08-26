/**
 * LOS CABALLOS Y LA APROXIMACIÓN.
 *
 * Todo el asalto empieza acá: galopando a la par del tren, decidiendo hasta
 * dónde adelantarte antes de saltar. Donde saltás es donde queda el caballo, y
 * eso es lo único que la aproximación le pasa al asalto.
 *
 * LAS TRES REGLAS QUE HACEN QUE ESTO SEA UNA DECISIÓN Y NO UN PASILLO:
 *
 *  1. Sin apretar nada vas A LA PAR del tren. No lo podés perder por distraído:
 *     lo que se decide es DÓNDE subís, no SI subís.
 *
 *  2. El aguante NO se recupera durante la aproximación. Es un presupuesto
 *     fijo: el caballo viene galopando desde antes. Sin esto, alcanzaba con
 *     esperar a que se recargara y llegabas siempre al fondo del tren, que es
 *     tener una sola opción disfrazada de varias.
 *
 *  3. Ir rápido hace el salto más difícil, porque cruzás el enganche en menos
 *     tiempo. Aflojar te da una ventana cómoda, pero te come reloj. Ese es el
 *     canje, y sale solo de la física: no hay barra de destreza ni minijuego.
 *
 * POR QUÉ ESTO ES UN CATÁLOGO Y NO UNA CONSTANTE. Comprar un caballo mejor
 * tiene que sentirse en las manos, no en una estadística. Lo que diferencia a un
 * caballo de otro es sobre todo **cuánto te perdona el salto**: uno bueno te
 * deja clavarlo aunque llegues torcido, el tuyo de ahora no. Eso convierte a la
 * habilidad de saltar en algo que se entrena Y que se puede comprar, sin que
 * comprar reemplace al entrenar. La tienda es fase 3; la estructura, ya está.
 */

/**
 * TRES STATS, DEL 1 AL 5, Y CADA UNA REUSA UN NÚMERO QUE YA EXISTÍA.
 *
 * Ninguna es un sistema nuevo — eso es a propósito, un caballo se compra en
 * fase 3 y no hay presupuesto para inventar mecánica nueva por cada uno:
 *
 *  - VELOCIDAD → `sprintSpeed`. Paga en la persecución (ver APROXIMACION):
 *    un caballo más rápido alcanza la cola antes y le queda más de los 35 s
 *    de `tiempoAproximacion` para adelantarse.
 *  - EQUILIBRIO → `saltoPreciso` / `saltoTolerancia`. Cuánto perdona el
 *    salto al enganche (y a la barra del techo, que escala con esto mismo).
 *  - RESISTENCIA → `aguanteMax` / `aguanteGasto`. Cuánto tren te podés
 *    adelantar antes de quedarte sin fuerzas para seguir acelerando. NO hace
 *    falta un tope aparte (`caballo.maxAdelanto` en config.js ya dice que es
 *    sólo una red de seguridad, nunca un límite activo): el aguante YA ES el
 *    límite real, sale solo de cuánto dura sprintando antes de secarse.
 *
 * LAS ESCALAS (medidas contra el tren de 6 vagones estándar; con trenes de
 * otro largo el límite lo pone el propio tren, no un número fijo acá):
 *
 * Velocidad (sprintSpeed, px/s — tiempo aproximado a la cola, 620px):
 *   1: 52 (~12,0s)  2: 61 (~10,3s)  3: 71 (~8,8s)  4: 80 (~7,9s)  5: 90 (~7,0s)
 *
 * Equilibrio (saltoPreciso / saltoTolerancia):
 *   1: 4/4   2: 8/5   3: 12/6   4: 15/8   5: 22/8 (el techo, no construido)
 *
 * Resistencia (aguanteMax, con aguanteGasto=6 fijo — cuánto avanza antes de
 * secarse, A LA VELOCIDAD DE ESE MISMO CABALLO, porque los dos números se
 * multiplican). Los niveles 1, 3, 4 y 5 son huecos: sólo hay dos caballos
 * construidos, y cada uno se calibró por separado (ver más abajo) para dar
 * un resultado CONCRETO — "el Criollo llega al 3º, el Mustang al 2º" — en
 * vez de partir de una escala pareja e imponérsela a los dos.
 *   1: ??   2: 60 (Mustang)   3: ??   4: ??   5: 160 (Criollo — sí, más
 *   aguante que el "nivel 2": es lento, así que necesita más TIEMPO para
 *   cubrir la misma distancia, y el tiempo también sale del tanque)
 */
export const HORSES = {
  /**
   * EL CRIOLLO — el que tenés al empezar. Nivel 1 en las tres stats, a
   * propósito: es el punto de comparación de todos los demás, y tiene que
   * sentirse claramente peor en la mano, no sólo en la ficha.
   *
   * VELOCIDAD 1 (52, era 90). A esta velocidad, apretar `D` casi no te
   * adelanta más que soltar las riendas (`alcanceSpeed` = 55): es el caballo
   * que no tiene fuerzas ni apurándolo.
   *
   * EQUILIBRIO 1 (preciso 4, era 9). La zona limpia es apenas el 14% de la
   * ventana total del enganche — la mayoría de tus saltos con este caballo
   * van a salir sucios (despiertan el vagón) aunque apuntes bien. Bajó
   * porque jugando con los números viejos NUNCA hacía falta calcular: la
   * ventana ya perdonaba de más y comprar el Mustang no cambiaba nada que se
   * sintiera.
   */
  criollo: {
    id: 'criollo',
    name: 'Criollo',
    short: 'CRIOLLO',
    hint: 'El que tenías atado atrás del rancho. Cansado y torpe.',

    sprintSpeed: 52,
    brakeSpeed: 85,
    aceleracion: 320,

    /**
     * RESISTENCIA: calibrada para que llegue al 3º enganche y no al 4º.
     *
     * 100 (el número de siempre) YA NO ALCANZA: bajarle la velocidad a este
     * caballo hizo que tardara más en cubrir la misma distancia, y el
     * aguante se gasta por SEGUNDO galopando, no por metro — así que ir más
     * lento también sale más caro en aguante. Con 100, medido con un piloto
     * que esquiva, se quedaba corto en las 5 de 5 corridas.
     *
     * Con 160 llega 5/5, con 5-8s de margen sobre el reloj de la
     * aproximación — no sobre el aguante: a esta velocidad, lo que más
     * aprieta ya no es el tanque, es el tiempo total (ver
     * `APROXIMACION.tiempoAproximacion`, que subió de 35 a 40 por esto
     * mismo). Y se queda corto del 4º siempre, que es como tiene que ser.
     */
    aguanteMax: 160,
    aguanteGasto: 6,

    saltoTolerancia: 4,
    saltoPreciso: 4,

    saltoDistancia: 20,

    precio: 0,
  },

  /**
   * EL MUSTANG — antes Overo. Cambió de identidad, no sólo de nombre:
   * dejó de ser "el Criollo pero mejor" para ser un animal salvaje, no manso.
   *
   * VELOCIDAD 5 (90, sin cambios — es el mismo número de siempre, ahora es
   * el techo de la escala). Alcanza la cola en la mitad de tiempo que el
   * Criollo.
   *
   * EQUILIBRIO 2 (preciso 8 / tolerancia 5, bajó de 15/8). Ya NO es el
   * caballo manso que perdona el salto — el hint viejo ("con éste el
   * enganche perdona") ya no aplica y hay que cambiarlo.
   *
   * RESISTENCIA 2 (aguanteMax 60). Medido con el piloto que esquiva: llega
   * al 2º enganche 5 de 5 veces con ~27s de reloj de sobra, y al 3º **cero**
   * de 5 — a sus 90 px/s el tanque se seca bastante antes.
   *
   * LA IDENTIDAD QUE QUEDA: rápido para llegar, corto de aliento una vez
   * ahí, y torpe al caer. Sirve para entrar rápido y bajarte pronto — no
   * para empujarlo vagón adentro con confianza.
   */
  mustang: {
    id: 'mustang',
    name: 'Mustang',
    short: 'MUSTANG',
    hint: 'Volador, pero no tiene fondo. No es de aterrizar fino.',

    sprintSpeed: 90,
    brakeSpeed: 85,
    aceleracion: 320,
    aguanteMax: 60,
    aguanteGasto: 6,

    saltoTolerancia: 5,
    saltoPreciso: 8,

    saltoDistancia: 20,

    precio: 400,
  },
};

export const DEFAULT_HORSE = 'criollo';

/** El caballo que estás montando ahora. */
export function caballoActual(gameState) {
  return HORSES[gameState && gameState.horse] || HORSES[DEFAULT_HORSE];
}

/**
 * LO QUE NO DEPENDE DEL CABALLO: las reglas del terreno y del tren.
 *
 * Está separado a propósito. Comprar un animal nuevo no cambia dónde están las
 * piedras ni cuánto tardan los guardias en verte; si estos números vivieran
 * dentro de cada caballo, agregar uno significaría copiar y pegar diez valores
 * que no tienen nada que ver con él, y tarde o temprano uno quedaría distinto
 * por error.
 */
export const APROXIMACION = {
  /**
   * ARRANCÁS DETRÁS DEL TREN, Y LEJOS.
   *
   * Alcanzarlo es la rampa de entrada: durante esos segundos el tren se te va
   * acercando y ahí sí se lee la velocidad, porque tenés una referencia contra
   * la que medirte. Arrancar ya emparejado no se sentía a nada.
   *
   * ERAN 240 PX, O SEA DOS SEGUNDOS Y MEDIO: no era una persecución, era un
   * trámite. Ahora son 620, que a 90 px/s son unos SIETE SEGUNDOS galopando a
   * fondo — y once si te quedás sin hacer nada, porque sin apretar `D` el
   * caballo cierra la brecha a `alcanceSpeed` y nada más.
   *
   * Y ACÁ ES DONDE VA A PESAR LA VELOCIDAD DEL CABALLO. La brecha se cierra a
   * `sprintSpeed`, así que un animal más rápido llega antes a la cola y le
   * sobra reloj para adelantarse. Con 240 px la diferencia entre dos caballos
   * era medio segundo, o sea nada: la stat existía en la ficha y no en las
   * manos. Con 620 hay dónde notarla.
   *
   * ALCANZAR LA COLA SIGUE SIENDO GRATIS: no cuesta aguante (el caballo viene
   * lanzado) y —desde esta vuelta— tampoco le come reloj al asalto. Ver
   * `cobrarTiempoAlAsalto`, abajo. Lo que cuesta es todo lo que te adelantes
   * MÁS ALLÁ de la cola.
   */
  inicioDetras: 620,
  alcanceSpeed: 55,

  /**
   * 40, no 35 ni 25. Subió dos veces por el mismo motivo exacto: un tope que
   * hace imposible la opción más cara no la encarece, la BORRA.
   *
   * De 25 a 35 fue por el galope en general (con 25 el tercer enganche era
   * inalcanzable para cualquier caballo). De 35 a 40 fue por el Criollo en
   * particular: a su Velocidad 1 (52 px/s), con el aguante ya calibrado
   * para que le alcance a llegar al 3º enganche, el reloj de 35s le daba
   * apenas 0,6-2,5s de margen — al borde de que una piedra mal esquivada lo
   * dejara afuera por mala suerte, no por mal jugado. Con 40, el margen sube
   * a 5-8s, consistente en 6 de 6 corridas.
   *
   * NO CAMBIA NADA PARA UN CABALLO RÁPIDO: al Mustang lo frena el aguante,
   * no el reloj — llega al 2º enganche con ~27s de sobra tanto con 35 como
   * con 40, así que subir este número no le regala nada de más.
   */
  tiempoAproximacion: 40,

  /**
   * EL PRECIO DE ADELANTARSE, Y ES EL QUE SOSTIENE TODA LA DECISIÓN.
   *
   * Cada segundo que pasás galopando se le descuenta al reloj del asalto. No es
   * un castigo inventado: el tren avanza mientras vos te acomodás.
   *
   * Sin esto el galope se rompía solo. El aguante no sirve para nada adentro del
   * vagón y el reloj de la aproximación tampoco, así que adelantarse salía
   * gratis y "llegar siempre al tercer enganche" era la única jugada.
   *
   * PERO EL RELOJ ARRANCA EN LA COLA, NO EN LA LARGADA. Los segundos que
   * tardás en ALCANZAR el tren no se le cobran al asalto; sólo se cobran los
   * que gastás adelantándote más allá de la cola.
   *
   * El motivo es el mismo por el que alcanzar la cola nunca costó aguante:
   * **un costo que todos pagan igual y que no se puede evitar no es una
   * decisión, es un número menos en el reloj.** Si la persecución se cobrara,
   * alargarla de 240 a 620 px le habría sacado cinco segundos a TODOS los
   * asaltos por igual —y eso no es alargar la persecución, es bajar
   * `raid.duration` por la ventana, justo el número que la fase 2 dejó
   * confirmado jugando.
   */
  cobrarTiempoAlAsalto: true,

  // --- El carril: la franja por la que galopás, al costado del tren ---
  carrilCerca: 8,
  carrilLejos: 46,
  velVertical: 62,

  /**
   * FALLAR EL SALTO. Trastabillás: el caballo se te va para atrás un momento y
   * perdés aguante. No te caés ni perdés el asalto — el castigo es que el tren
   * te gana terreno y el enganche que querías te queda atrás.
   */
  trastabillaTiempo: 1.0,
  trastabillaEmpuje: 70,
  trastabillaAguante: 15,

  /**
   * QUE TE VEAN DESDE LAS VENTANILLAS.
   *
   * A más de `verDistancia` del costado del tren, nadie te ve. TIENE QUE SER
   * MENOR QUE `carrilLejos`, si no la zona segura no existe y te ven siempre
   * (pasó). Y MAYOR que `saltoDistancia`: para saltar hay que arrimarse, y
   * arrimarse es justo lo que te expone. Ahí está el nudo de la escena.
   *
   * El vagón blindado no tiene ventanillas: ahí sos invisible. El de ganado va
   * al aire libre, con barandas en vez de paredes, y es el peor del tren.
   */
  verDistancia: 30,
  verRate: 0.62,
  verRateGanado: 1.15,

  /**
   * Y CUANDO TE DESCUBREN, TE DISPARAN.
   *
   * Antes que te vieran tenía una consecuencia sólo diferida: entrabas al asalto
   * con la alarma sonando. Se pagaba tarde, cuando ya te habías olvidado de por
   * qué. Ahora se paga en el acto — hay plomo saliendo de esas ventanillas — y
   * te deja dos salidas claras: alejarte del tren o acelerar para dejar ese
   * vagón atrás.
   *
   * NO PODÉS MORIR GALOPANDO: la vida tiene piso 1. Perder el asalto antes de
   * haber subido al tren sería el peor castigo posible por el peor motivo. Pero
   * la vida que perdés te la llevás adentro, y empezar un asalto con 1 de vida
   * es durísimo. El castigo es real sin ser terminal.
   */
  disparoAviso: 0.55,     // el fogonazo antes del tiro, para poder reaccionar
  disparoCadencia: 1.1,   // cada cuánto te tira cada vagón que te descubrió
  disparoSpread: 0.30,    // mucha: van a caballo y desde un tren en movimiento
  disparoVelocidad: 200,
  disparoAlcance: 130,    // más lejos que esto ni lo intentan
  disparoEspanto: 55,     // cuánto te frena el caballo al recibir un tiro
  invulnTras: 1.2,        // gracia tras un impacto, para no comerse tres seguidos

  /**
   * OBSTÁCULOS DEL TERRENO.
   *
   * Su gracia no es el choque: es que **para esquivarlos hay que moverse**, y
   * moverse a veces significa pegarte al tren, que es justo donde te ven.
   *
   * Chocar NO cuesta aguante, y es a propósito. Con 8 por piedra, cuatro o cinco
   * choques te comían medio presupuesto y el tercer enganche pasaba a ser
   * inalcanzable. Peor: el alcance máximo quedaba a merced de dónde hubieran
   * caído las piedras. El aguante tiene que ser un presupuesto que administrás,
   * no una lotería.
   */
  obstaculoCada: 130,
  obstaculoRadio: 7,
  obstaculoFrenado: 0.55,
  obstaculoAguante: 0,

  /**
   * EL SALTO AL TECHO — la otra mitad del paso C (ver NOTAS-DISENO.md).
   *
   * Es un tercer destino posible del MISMO salto (`Espacio`), no una tecla
   * aparte: si estás sobre el enganche, saltás a él; si estás sobre el
   * cuerpo de un vagón CON TECHO, saltás arriba. Gasta del mismo aguante y
   * reloj que cualquier otro salto — no hay presupuesto aparte.
   *
   * LA EXCEPCIÓN A LA REGLA DEL PROYECTO, Y HAY QUE DECIRLA. Todo el resto
   * del juego sostiene que "la destreza sale de la física, no hay barra de
   * timing ni minijuego". El salto al enganche la cumple: hay un punto
   * concreto que apuntar (el centro de la pasarela) y tu propia velocidad
   * decide cuánto margen tenés.
   *
   * El techo NO tiene un punto que apuntar: es una franja continua de 40
   * columnas. La primera versión intentó sacarle destreza a la geometría
   * igual —el grado salía de qué tan pegado al tren estabas— y no funcionó:
   * no se sentía a nada, porque no había nada que clavar. Por eso acá, y
   * SÓLO acá, se usa una barra: primer Espacio la abre, segundo Espacio la
   * frena. Verde limpio, amarillo sucio, rojo no llegás.
   *
   * La regla del proyecto pasa a ser: geometría cuando hay un punto que
   * apuntar, barra cuando el destino es una franja.
   */
  barraVelocidad: 1.25,   // pasadas por segundo del puntero
  barraVerde: 0.15,       // media anchura de la zona limpia (0..0,5 desde el centro)
  barraAmarillo: 0.34,    // y hasta acá, sucio. Más allá, rojo.
};
