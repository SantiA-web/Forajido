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
   * VELOCIDAD 1. **142 px/s ABSOLUTOS**, contra los 90 del tren: le saca 52 al
   * tren cuando lo apurás, y al trote (71) el tren le saca 19. O sea que este
   * caballo **no se puede dar el lujo de demorarse**: cada segundo que no
   * galopa, el tren se le va.
   *
   * (Antes este número era 52 y significaba otra cosa: la velocidad RELATIVA al
   * tren, con el tren tratado como si estuviera quieto. Ver `trenVelocidad` en
   * APROXIMACION para por qué cambió y por qué el 52 sigue vivo adentro del 142.)
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

    sprintSpeed: 142,
    brakeSpeed: 85,

    /**
     * ACELERACIÓN 1 (px/s²). Era 320, igual que el Mustang: una stat que no
     * distinguía a nadie. Desde el envión de la huida ([ESPACIO], ver
     * `HUIDA.jugador.impulso`) decide QUÉ TAN RÁPIDO entra ese tirón, y con
     * 240 este caballo tarda 0,27 s en llegar arriba — o sea que un toque
     * corto casi no le rinde. Es el mismo animal de siempre: tiene fondo, pero
     * hay que pedírselo con tiempo.
     *
     * En la aproximación al tren (rideScene) esto casi no se nota: son
     * centésimas sobre una corrida de 40 segundos.
     */
    aceleracion: 240,

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

    /**
     * VELOCIDAD 5. **180 px/s ABSOLUTOS**, el doble que el tren (90): le saca
     * 90 galopando, y **al trote (90) le sigue el paso exacto**.
     *
     * AHÍ ESTÁ LO QUE PEDÍA SANTI, y es la diferencia de verdad entre los dos
     * caballos: *"dependiendo la velocidad del caballo es cuánto se puede dar el
     * lujo de pegarse o esquivar obstáculos"*. El Mustang puede aflojar, rodear
     * un cactus con calma y no perder un metro; el Criollo, cada segundo que no
     * galopa, se atrasa. La stat dejó de ser sólo "llego antes" y pasó a ser
     * "cuánto me puedo distraer".
     */
    sprintSpeed: 180,
    brakeSpeed: 85,

    /**
     * ACELERACIÓN 4 (px/s²). El tirón le entra en 0,16 s, así que un toque
     * corto de [ESPACIO] ya lo pone arriba: es el caballo del golpe seco. Le
     * dura poco (aguanteMax 60), pero lo que da, lo da al toque.
     */
    aceleracion: 520,
    aguanteMax: 60,
    aguanteGasto: 6,

    saltoTolerancia: 5,
    saltoPreciso: 8,

    saltoDistancia: 20,

    precio: 1200,
  },
};

/**
 * CADA CUÁNTO PUEDE IMPULSAR ESTE CABALLO, en segundos *(Santi: "la
 * aceleración que sea lo que indique cada cuánto podés usar el impulso y qué
 * tan rápido es")*.
 *
 * Sale de la ACELERACIÓN y de nada más, para que no haya dos números diciendo
 * lo mismo: 240 (nivel 1) son 9 segundos de espera y 620 (nivel 5) son 4. En el
 * medio, la recta. El Mustang (520) queda en 5,3.
 */
export function esperaDelImpulso(caballo) {
  const acc = caballo.aceleracion || 240;
  const espera = 9 - ((acc - 240) * 5) / 380;
  return Math.max(3.5, Math.min(10, Math.round(espera * 10) / 10));
}

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
   * trámite.
   *
   * Y ACÁ ES DONDE PESA LA VELOCIDAD DEL CABALLO. La brecha se cierra a
   * `sprintSpeed − trenVelocidad`, así que un animal más rápido llega antes a la
   * cola y le sobra reloj para adelantarse. Con 240 px la diferencia entre dos
   * caballos era medio segundo, o sea nada: la stat existía en la ficha y no en
   * las manos.
   *
   * ALCANZAR LA COLA SIGUE SIENDO GRATIS: no cuesta aguante (el caballo viene
   * lanzado) y —desde esta vuelta— tampoco le come reloj al asalto. Ver
   * `cobrarTiempoAlAsalto`, abajo. Lo que cuesta es todo lo que te adelantes
   * MÁS ALLÁ de la cola.
   *
   * 🔍 SEGUNDA VUELTA · SUBIÓ DE 620 A 1000, Y NO FUE POR LA DISTANCIA EN SÍ.
   *
   * *(Santi, después de mirar a su hermano jugarlo por primera vez: "se siente
   * muy aburrida la parte del galope previo al salto al tren")*
   *
   * Lo aburrido no era la duración: era que **no había nada que hacer ni nada
   * que mirar**. Medido, la causa estaba en la pantalla: el tren ocupa 160 de
   * los 216 px de alto (el 74%), así que sobraban 56 px para el terreno, y de
   * ahí salían los 38 px de carril. En 38 px no entra un desierto, no entra una
   * diagonal y no entran obstáculos que valga la pena esquivar.
   *
   * Por eso esta vuelta cambia las tres cosas juntas —zoom, campo y distancia—
   * y no sólo el número de acá: alargar la persecución sin haber abierto antes
   * el espacio habría hecho el problema MÁS largo, no menor.
   *
   * 🐛 TERCERA VUELTA · 1000 ERA DEMASIADO, Y ROMPÍA LO QUE VENÍA A ARREGLAR.
   *
   * *(Santi: "no es lo que esperaba. Aquí parece una pista de carreras con
   * obstáculos, yo no quiero eso, quiero que el tren se vea a lo lejos y el
   * caballo se va acercando hacia él")*
   *
   * LA CAUSA, Y ES DE GEOMETRÍA PURA: con el zoom lejano en 0,5 la pantalla
   * muestra 768 px de mundo a lo ancho. Con el tren a 1000 px, **el tren no
   * entraba en pantalla**: los primeros diez segundos eran galopar hacia un
   * horizonte vacío mientras te venían obstáculos de frente. Eso es
   * literalmente una pista de carreras, y ninguna cantidad de campo ni de
   * cactus lo iba a arreglar — el problema era que faltaba la única cosa hacia
   * la que se supone que estás yendo.
   *
   * AHORA 600, ELEGIDO PARA QUE EL TREN SE VEA DESDE EL PRIMER CUADRO. Con el
   * zoom lejano en 0,4 la vista abarca 960 px, y la cola queda dibujada a unos
   * 348 px del borde izquierdo de la pantalla (de 384): arriba a la derecha,
   * chiquito, exactamente "a lo lejos".
   */
  inicioDetras: 600,

  /**
   * 🐛 EL TREN NO SE MOVÍA. Y era gravísimo, como dijo Santi.
   *
   * *(Santi: "el tren literalmente parece no moverse. Es un problema gravísimo,
   * porque si yo me quedo quieto o me demoro en esquivar los obstáculos, el tren
   * debería irse")*
   *
   * DOS CAUSAS INDEPENDIENTES, medidas:
   *
   *  1. **Mecánica:** sin tocar ninguna tecla, el caballo se acercaba solo a 55
   *     px/s (`alcanceSpeed`, ya borrado). Era imposible quedarse atrás. El
   *     galope no era una persecución: era una cinta transportadora.
   *  2. **Visual:** los obstáculos vivían en el MISMO marco que el tren, así que
   *     el tren estaba clavado respecto de los cactus. Se veía estacionado en el
   *     desierto. Ahora el suelo desfila hacia atrás a esta velocidad (ver
   *     `suelo` en scenes/rideScene.js) y el tren se ve viajando de verdad.
   *
   * EL MODELO NUEVO ES DE VELOCIDADES ABSOLUTAS, y lo corrigió Santi cuando le
   * ofrecí uno peor: *"no funcionaría así. El tren se mueve a una cierta
   * velocidad, los caballos a otra. Dependiendo la velocidad del caballo es
   * cuánto se puede dar el lujo de pegarse o esquivar obstáculos"*. Antes
   * `sprintSpeed` era la velocidad RELATIVA al tren (con el tren tratado como si
   * estuviera quieto); ahora cada caballo tiene su velocidad real y lo que
   * decide todo es la RESTA.
   *
   * 90 NO ES UN NÚMERO NUEVO, es el que conserva el balance ya jugado: los
   * `sprintSpeed` absolutos se eligieron para que la resta contra estos 90 dé
   * exactamente las ventajas relativas de siempre (Criollo +52, Mustang +90), o
   * sea que el Criollo sigue llegando al 3er enganche y el Mustang al 2º.
   */
  trenVelocidad: 90,

  /**
   * CUÁNTO TERRENO PODÉS PERDER más allá de donde arrancaste, antes de que el
   * juego te frene por una pared invisible.
   *
   * 300 px es un castigo real y legible —el tren se te va, lo ves irse— sin que
   * el caballo termine tan atrás que quede fuera de cámara y estés manejando a
   * ciegas. Quien te cierra la escena si te demorás demasiado es el RELOJ, que
   * ya existía y ya es el precio de todo lo demás en este juego.
   */
  atrasMaximo: 300,

  /**
   * A QUÉ VELOCIDAD VA EL CABALLO SIN APRETAR NADA, como fracción de su galope.
   *
   * Es el número que hace que la velocidad del caballo signifique "cuánto me
   * puedo distraer", que es justo lo que pidió Santi:
   *
   *   Criollo:  142 × 0,5 = 71  → el tren le saca 19 px/s. No puede demorarse.
   *   Mustang:  180 × 0,5 = 90  → EMPATA con el tren. Puede rodear un obstáculo
   *                               con calma y no perder un metro.
   *
   * Es una fracción y no un valor fijo justamente por eso: un caballo mejor
   * trota más rápido, así que el lujo de distraerse se compra con la misma stat
   * que la velocidad punta.
   */
  troteFactor: 0.5,

  /**
   * Y CHOCANDO CASI SE PARA. Un choque ya no es "perdés un poco de envión": es
   * el tren sacándote 90 px/s enteros mientras te reincorporás. Ahí está el
   * precio real de esquivar mal, que antes no existía porque durante el choque
   * la velocidad relativa quedaba en 0 y el tren te esperaba.
   */
  choqueFactor: 0.15,

  /**
   * LAS RIENDAS — cuánto tarda el caballo en cambiar de rumbo de un extremo al
   * otro (0,45 s, elegido por Santi).
   *
   * *(Santi: "el jugador no controla el caballo, controla al jinete que tira de
   * las riendas del caballo, y eso se debería notar en la jugabilidad y
   * movimiento del caballo")*
   *
   * No es un filtro cosmético: el caballo **no cambia de dirección al instante**
   * y sigue derivando un momento cuando soltás. Medio segundo es lo que se
   * necesita para que se lea "estoy tirando de las riendas de algo que pesa" sin
   * arruinar la maniobra que no se puede arruinar — alinear el enganche para
   * saltar, que pide precisión fina.
   */
  giroTiempo: 0.45,

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
   *
   * 🔍 TERCERA SUBIDA · 40 → 55, y por el mismo motivo que las dos anteriores.
   *
   * `inicioDetras` pasó de 620 a 1000 px, o sea que alcanzar la cola pasó de
   * 11,4 s a 18,3 s. Los 15 s de más son EXACTAMENTE esos 6,9 s de persecución
   * extra más un poco de margen: el objetivo es que lo que te queda DESPUÉS de
   * tocar la cola —que es donde vive la decisión de hasta qué enganche
   * adelantarte— no cambie ni un segundo respecto de lo ya jugado y confirmado.
   *
   * Si no se subiera, alargar la persecución sería en los hechos recortar el
   * alcance máximo del Criollo, y el 3er enganche volvería a ser inalcanzable —
   * el mismo error que ya se cometió y corrigió dos veces con este número.
   *
   * Y BAJÓ A 45 cuando `inicioDetras` volvió de 1000 a 600 (ver ahí). El
   * criterio es siempre el mismo y por eso el número sube y baja: lo que tiene
   * que quedar constante es **el margen DESPUÉS de tocar la cola**, que es donde
   * vive la decisión de hasta qué enganche adelantarte. 600 px son ~10,9 s de
   * persecución, más los ~29 s de margen de siempre, da 40 — con 45 queda un
   * respiro extra para la diagonal y los obstáculos del desierto, que es tiempo
   * que antes no hacía falta porque no había nada que esquivar.
   *
   * 🔍 Y ESTUVO A PUNTO DE SUBIR A 48 POR RUIDO — vale anotarlo.
   *
   * Al agrandar los obstáculos (`obstaculoRadios`), una corrida del caso límite
   * —el Criollo llegando al 3er enganche— dio 5 de 6 con 5,0 s de margen, contra
   * los 8,1 s de antes. Parecía una regresión clara contra el estándar escrito
   * de ese caso, así que se subió el reloj a 48 para compensar... y el resultado
   * EMPEORÓ (4 de 6). Con más reloj no puede ir peor: la señal era ruido.
   *
   * Medido en serio —10 corridas por serie, misma política de piloto, mismo
   * reloj, cambiando SÓLO los radios— el efecto real de agrandar los obstáculos
   * es de **+0,2 choques por corrida**, y el margen no se mueve de forma
   * distinguible (5,5 s con los radios viejos contra 6,2 s con los nuevos, o sea
   * al revés de lo que "mostraba" la corrida chica).
   *
   * Se quedó en 45. La lección es la de siempre en este archivo: **no se ajusta
   * un número calibrado contra una muestra de seis corridas de un caso que ya
   * era marginal de por sí.**
   */
  tiempoAproximacion: 45,

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

  /**
   * --- EL CAMPO: ya no es un carril, es un desierto ---
   *
   * `carrilLejos` PASÓ DE 46 A 150, y es el cambio que hace posible todo lo que
   * Santi pidió: moverse "en diagonal libremente hacia el tren", esquivar
   * cactus y montículos, y arrancar "desde una esquina mucho más atrás".
   *
   * ANTES ERAN 38 PX DE ALTO ÚTIL (de 8 a 46) — poco más de dos baldosas. En esa
   * franja no cabía una diagonal: apretabas W o S y en medio segundo estabas
   * contra el tope. Por eso el galope se sentía sobre rieles, y por eso los
   * obstáculos eran un trámite en vez de una maniobra.
   *
   * NO CABE EN PANTALLA A ZOOM 1, Y ESTÁ BIEN: el tren mide 160 px de alto y la
   * pantalla 216, así que 150 px de campo sólo entran con el zoom alejado. De
   * ahí sale el zoom dinámico (`zoomLejos`/`zoomCerca`, abajo) — no es un efecto
   * decorativo, es lo que hace que este campo exista.
   *
   * `carrilCerca` NO SE TOCA. Es la distancia mínima al tren, y de ella cuelgan
   * `saltoDistancia`, `verDistancia` y todo el nudo de "para saltar hay que
   * arrimarse, y arrimarse es donde te ven". Lo que se agranda es el lado
   * lejano, o sea el desierto — no la zona de peligro.
   *
   * 🐛 TERCERA VUELTA · 150 → 330. La diagonal seguía sin existir.
   *
   * Con 150 px de campo y 1000 px de distancia horizontal, la aproximación era
   * 87% horizontal: la diagonal era un detalle, no el movimiento. Ahora la
   * relación se dio vuelta —600 de largo contra 282 de profundidad hasta la
   * vía— y **arrancás abajo del todo**, así que ir hacia el tren es literalmente
   * ir en diagonal: hacia adelante y hacia arriba, todo el tiempo, eligiendo tu
   * propia línea entre los obstáculos.
   *
   * Y ES LO QUE HACE QUE EL TREN SE VEA COMO ALGO LEJANO en vez de como una
   * pared al costado: lo mirás desde 282 px de distancia y desde abajo, no
   * pegado al hombro.
   */
  carrilCerca: 8,
  carrilLejos: 330,

  /**
   * Subió de 62 a 105 junto con el campo. Con 150 px de alto y la velocidad
   * vieja, cruzar de la esquina lejana al tren tomaba 2,3 s de apretar una
   * tecla sin hacer nada más — eso no es una diagonal, es un trámite vertical.
   * A 105 px/s son 1,35 s, parecido a lo que costaba cruzar el carril viejo:
   * el campo se agrandó, la sensación de manejo no.
   */
  velVertical: 105,

  /**
   * EL ZOOM DINÁMICO — lejos ves el desierto, cerca ves el tren.
   *
   * *(idea de Santi, mejorando una propuesta peor: se le ofrecieron tres zooms
   * fijos y contestó "yo haría que el tren pase a ser 80px, pero a medida que
   * el caballo se acerca se va haciendo más zoom")*
   *
   * RESUELVE LA ÚNICA OBJECIÓN QUE TENÍA EL ZOOM FIJO DE 0,5. A esa escala el
   * tren mide 80 px y se ve muchísimo paisaje —que es lo que se buscaba— pero
   * las ventanillas, los enganches y la marca verde del salto quedan diminutos,
   * y de esas tres cosas depende clavar el salto. Con el zoom atado a la
   * distancia, el tren chico existe SÓLO mientras galopás lejos, que es
   * exactamente cuando no necesitás ese detalle. Para cuando importa, ya estás
   * a escala 1.
   *
   * Y de paso hace algo que ningún zoom fijo podía: **la escena se va cerrando
   * sobre el tren a medida que lo alcanzás**, así que el propio encuadre cuenta
   * que te estás acercando, sin una sola línea de texto.
   *
   * 0,4 Y NO 0,5: es lo que hace que el tren ENTRE en pantalla desde el primer
   * cuadro (960 px de vista contra los 600 de distancia). A esa escala el tren
   * mide 64 px de alto — chiquito, allá arriba a la derecha, que es justamente
   * como Santi lo pidió: *"quiero que el tren se vea a lo lejos"*.
   */
  zoomLejos: 0.4,
  zoomCerca: 1.0,          // pegado a la cola: escala 1, como el asalto

  /**
   * A qué distancia de la cola empieza a cerrarse el zoom.
   */
  zoomDistancia: 520,

  /**
   * Y DESDE ACÁ PARA ADELANTE EL ZOOM YA NO SE MUEVE MÁS.
   *
   * Los últimos 140 px se recorren a escala 1 fija. Sin este tope el zoom
   * seguiría corrigiéndose décimas justo mientras estás alineando el salto, y
   * una cámara que se mueve sola mientras apuntás algo es peor que cualquier
   * zoom fijo. La transición tiene que TERMINAR antes de que empiece a importar
   * el detalle.
   */
  zoomFijoDesde: 140,

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
   *
   * 🔍 SEGUNDA VUELTA · DE 130 A 85, porque ahora hay campo donde sembrarlos.
   *
   * Con el carril viejo (38 px de alto) los obstáculos no podían ser densos: en
   * una franja tan angosta, dos piedras seguidas eran un muro sin salida. Con
   * 150 px de campo hay lugar para rodearlos, así que pueden venir más seguido
   * — y recién ahí "esquivar cosas mientras galopás" es una maniobra y no un
   * trámite.
   *
   * Y SE SIEMBRAN EN TODO EL CAMPO, no sólo al borde: ver `sembrarObstaculos`
   * en scenes/rideScene.js. Los cactus y montículos que pidió Santi son tipos
   * nuevos del mismo sistema, no un sistema aparte.
   */
  obstaculoCada: 85,

  /**
   * CADA OBSTÁCULO PEGA SEGÚN SU TAMAÑO — y antes no era así.
   *
   * *(Santi: "haría que los obstáculos sean un poquito más peligrosos. Deberían
   * ser más grandes, pero no tanto. Y no todos por igual")*
   *
   * 🐛 LOS CUATRO CHOCABAN CON EL MISMO RADIO 7, aunque se dibujan muy
   * distintos: un montículo bajo de 14 px de ancho y un cactus flaco de tronco
   * te frenaban exactamente igual. Eso contradice una regla que este proyecto
   * tiene escrita desde que se afinó la hitbox de los guardias —*"la caja que
   * ves siempre es la caja que te puede matar"*— y hacía que el desierto se
   * sintiera parejo y despersonalizado: daba lo mismo qué esquivaras.
   *
   * MEDIDO ANTES DE TOCAR: con un piloto que NO esquiva nunca, sólo **1 choque
   * por corrida**. Por eso no daban miedo — casi no existían.
   *
   * Los cuatro números salen de la SILUETA, no de un ajuste al azar, y el
   * promedio sube de 7 a 8,25 (un 18%): "un poquito más grandes, pero no tanto".
   */
  obstaculoRadios: {
    /** La piedra: la huella más grande y lo único sólido de verdad acá. */
    roca: 10,
    /** Ancho y enredoso: te agarra las patas aunque le pases por el borde. */
    arbusto: 9,
    /** De tronco angosto — por eso no es el más grande — pero no querés tocarlo. */
    cactus: 8,
    /**
     * El más perdonador, y a propósito: es un montón de arena. Le podés pisar
     * el borde y seguir. Que exista un obstáculo barato es lo que hace que
     * elegir POR DÓNDE pasar sea una decisión y no sólo "esquivá todo".
     */
    monticulo: 6,
    /**
     * 🗿 LA AGUJA DEL BOSQUE DE PIEDRAS: angosta y alta. Su huella es chica
     * —más que la roca— porque adentro del manchón hay una cada 38 unidades y
     * con la huella de una roca no quedaría por dónde pasar.
     */
    aguja: 7,
  },

  /** Para cualquier tipo que no esté en la tabla de arriba. */
  obstaculoRadio: 8,
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
