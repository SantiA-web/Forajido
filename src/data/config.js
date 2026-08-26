/**
 * TODOS los números ajustables del juego viven acá.
 * Cuando algo "se sienta mal" al jugar, se toca este archivo y nada más.
 */

export const CONFIG = {
  // Resolución interna. El canvas se escala a la pantalla en múltiplos enteros.
  view: { width: 384, height: 216 },

  tileSize: 16,

  raid: {
    /**
     * Los segundos del asalto. Bajó de 170 a 145.
     *
     * Con 170 se podía hacer el tren ENTERO: Santi sacó $1238 (el 72% de un tren
     * promedio, abriendo dos cajas fuertes) y le sobraron un par de segundos.
     * Mientras barrer el tren entre en el reloj, la pregunta "¿cuánto me llevo?"
     * no existe, porque la respuesta es siempre "todo".
     *
     * Y hay un motivo para tocar ESTE número y no otro: jugando, la duda le
     * apareció **mirando el reloj contra la distancia que le faltaba**. O sea
     * que el reloj ya es lo que sostiene la tensión; esto lo hace pesar más.
     */
    duration: 145,
    escapeHold: 1.0,     // segundos manteniendo E en la salida para escapar
    urgentAt: 30,        // el reloj se pone rojo por debajo de esto
    cleanBonus: 1.0,     // +100% del botín si escapás sin que suene la alarma

    /**
     * Tope de lo que la aproximación a caballo le puede comer al asalto.
     *
     * El tiempo que gastás galopando se descuenta de acá (ver data/horse.js).
     * El tope existe para que una aproximación torpe —fallar tres saltos, ir y
     * volver— no arranque el asalto ya perdido. Con 25, el peor caso posible
     * deja 2:25 de reloj.
     */
    maxCobroAproximacion: 25,

    /**
     * Los guardias que están a más de esto del jugador y todavía patrullando
     * no se actualizan. Un tren tiene ~11 guardias repartidos en 4500px; los
     * de tres vagones más allá no cambian nada de lo que ves y cuestan trabajo.
     * Los que ya te vieron (sospechando o en combate) se actualizan SIEMPRE,
     * a cualquier distancia: si no, un perseguidor se congelaría a mitad de
     * camino y la retirada dejaría de dar miedo.
     */
    cullPatrolDistance: 700,
  },

  /**
   * EL CABALLO: dónde te espera, o sea DÓNDE ESTÁ LA ÚNICA SALIDA.
   *
   * El caballo es uno solo y se queda donde lo dejaste. Antes de subir elegís
   * hasta dónde adelantarlo, y ahí subís vos también.
   *
   * Por qué esto importa, medido con el banco de pruebas: ir hacia ADELANTE es
   * más caro que volver. Del vagón 1 al 4 caminando son ~29 s, 2,8 de vida y se
   * muere 1 de cada 3; la vuelta del 4 al caballo son ~23 s, 1,6 de vida y no
   * se murió ni una vez. Volviendo pasás por vagones que ya reventaste, con los
   * perseguidores detrás. Yendo, entrás a vagones frescos que te esperan de
   * frente.
   *
   * O sea que adelantar el caballo no te ahorra la retirada: te ahorra LA IDA,
   * que es la parte que mata. Por eso tiene que costar algo, si no dejarlo
   * siempre lo más adelante posible sería automático — y una decisión que se
   * resuelve sola no es una decisión.
   *
   * El precio es TIEMPO, y desde que existe la aproximación a caballo es un
   * precio literal: los segundos que de verdad tardaste galopando hasta ahí
   * (ver data/horse.js y raid.maxCobroAproximacion). Antes había un descuento
   * fijo de 15 s por enganche, que era un número inventado para simular esto.
   */
  caballo: {
    /**
     * Tope duro de hasta dónde puede llegar el caballo. Ya no lo usa la
     * aproximación —ahí el tope lo pone el aguante del animal— pero sigue
     * valiendo como red de seguridad y para poder entrar a un vagón del fondo
     * desde la consola: FORAJIDO.config.caballo.maxAdelanto = 6
     */
    maxAdelanto: 3,
  },

  player: {
    speed: 78,           // px por segundo
    sneakSpeed: 40,      // agachado (Ctrl): mitad de velocidad, mitad de sospecha
    coverSpeed: 40,      // pegado a una pared te movés más lento
    hw: 5, hh: 5,        // media anchura / media altura de la caja de colisión
    health: 4,
    invulnTime: 0.6,     // invulnerabilidad tras recibir un impacto
    knockback: 26,
    coverReach: 11,      // a qué distancia detecta una pared para cubrirse
    peekOffset: 8,       // cuánto se asomaría del todo
    peekMax: 0.7,        // pero no se asoma del todo: solo hasta el 70%
    peekSpeed: 9,        // qué tan rápido se asoma (mayor = más brusco)
    peekShootAt: 0.5,    // hay que estar asomado más de esto para poder disparar
    dynamite: 2,         // cartuchos por asalto (después saldrá del inventario)
  },

  enemy: {
    speed: 46,
    patrolSpeed: 24,
    hw: 5, hh: 5,

    // La vida NO está acá: depende del tipo de guardia y de qué tan escoltado
    // viaja el tren. Está en data/guards.js, con tope 4.

    // --- Visión y sospecha ---
    viewDistance: 118,
    viewAngle: 0.95,       // media apertura del cono (radianes)
    suspicionNear: 2.2,    // velocidad de sospecha a quemarropa (1 = detectado)
    suspicionFar: 0.45,    // velocidad de sospecha en el límite de la visión
    suspicionMoving: 1.5,  // multiplicador si te estás moviendo
    suspicionSneak: 0.45,  // multiplicador si vas agachado (Ctrl)
    /**
     * CUÁNTO DURAN LOS ESTADOS.
     *
     * Estos números estaban muy cortos y se notaba feo: te disparaban, te
     * escondías dos segundos y ya estaban otra vez de color azul silbando.
     * Un guardia que sabe que hay alguien adentro del tren no se olvida en
     * cuatro segundos. Ahora te buscan, y tardan en aflojar.
     */
    suspicionMemory: 4.0,  // segundos antes de empezar a olvidarte
    suspicionDecay: 0.15,  // y después se olvida despacio
    coverSightDistance: 62,  // desde tan cerca te ven aunque estés cubierto
    hearRadius: 230,       // radio con el que oyen un disparo
    shoutRadius: 320,      // al verte, avisa a los demás en este radio

    /**
     * TUS PISADAS.
     *
     * Caminando hacés ruido, y el ruido no necesita que te vean: un guardia de
     * espaldas te oye igual. Es lo que le da sentido de verdad a agacharse
     * (Espacio), que ahora hace silencio TOTAL: pegado a su espalda, agachado,
     * sos invisible y además inaudible.
     *
     * Va por acumulación continua y no por eventos sueltos: la sospecha sube
     * más rápido cuanto más cerca estés, así que se puede leer y se puede
     * jugar en contra (te alejás y para de subir).
     */
    hearStepRadius: 58,    // ~3,5 baldosas
    hearStepRate: 0.55,    // sospecha por segundo, pegado. Agachado: cero.

    /** Dinamita: cada cuánto puede volver a considerar tirar una. */
    throwCooldown: 5.0,
    throwWindup: 0.7,      // enciende la mecha y recién ahí la tira
    throwMinRange: 62,     // más cerca que esto no la tira: se volaría él
    throwMaxRange: 150,

    // --- Combate ---
    aimTime: 0.30,         // se detiene y levanta el arma antes de disparar
    fireCooldown: 0.75,
    burstSize: 2,          // disparos por asomada
    burstDelay: 0.28,
    bulletSpeed: 210,
    reactionTime: 0.3,

    /**
     * Puntería. Nadie tiene mira láser: la dispersión crece con la distancia.
     * De cerca son peligrosos de verdad; de lejos, la mayoría de los tiros
     * pasan cerca y no pegan. Con spreadFar = 0.28 rad, a 110px las balas caen
     * en una franja de ±30px: contra un blanco de 10px, aciertan ~1 de cada 5.
     */
    spreadNear: 0.09,
    spreadFar: 0.28,
    spreadNearDistance: 40,
    spreadFarDistance: 130,

    // --- Convivencia entre guardias ---
    separation: 13,        // no se pueden pisar entre ellos
    allyBlockRadius: 9,    // no dispara si un compañero está en la línea de tiro
    coverSpacing: 20,      // dos guardias no eligen la misma cobertura

    // --- Cobertura ---
    coverSearchRadius: 108,
    coverMinDistance: 42,   // no se cubre encima del jugador
    coverHoldMin: 0.7,      // cuánto se queda escondido entre asomada y asomada
    coverHoldMax: 1.6,
    repositionAfter: 7,     // si el tiroteo se estanca, busca otra cobertura
    // Cuánto se asoma. Prueba en orden y usa el PRIMERO que le dé línea de
    // tiro: expone lo mínimo necesario, no siempre lo máximo.
    peekSteps: [5, 8, 11],
    loseTargetTime: 9.0,    // cuánto te sigue buscando después de perderte

    // --- Rutas (para cruzar de un vagón a otro) ---
    routeDistance: 150,     // más lejos que esto, va con ruta calculada
    routeRefresh: 1.0,      // cada cuánto recalcula la ruta (el blanco se mueve)

    /**
     * DISPARAR A CIEGAS A TRAVÉS DE UNA PUERTA CERRADA.
     *
     * No es que apunten mal: es que NO VEN. Tiran a donde te vieron por
     * última vez, así que la dispersión es mucho peor que cualquier otro
     * tiro del juego (comparar con spreadFar: 0,28) y la ráfaga es más
     * larga (comparar con burstSize: 2) — están vaciando el cargador contra
     * la madera, no cazando.
     */
    doorBurstSize: 5,
    doorSpread: 0.6,
    doorFireCooldown: 2.2,

    /**
     * DISPARAR A CIEGAS HACIA ARRIBA, A TRAVÉS DEL TECHO.
     *
     * Mismo espíritu que la puerta: no ven, pero oyeron tus pisadas ahí
     * arriba y tiran igual. Números propios (no comparten timers con la
     * puerta) para poder ajustar los dos por separado.
     */
    techoBurstSize: 5,
    techoSpread: 0.6,
    techoFireCooldown: 2.2,

    // --- Cuerpo a cuerpo ---
    meleeRange: 15,         // más cerca que esto deja de disparar y te golpea
    meleeWindup: 0.26,      // levanta el brazo antes de pegarte
    meleeCooldown: 0.95,
    meleeDamage: 1,

    /**
     * CADÁVERES.
     *
     * El que ve un cuerpo en el piso queda "marcado" para el resto del asalto:
     * ya no vuelve nunca a su ronda tranquilo. Es lo que le da peso a dónde
     * matás, no solo a quién.
     */
    bodySightDistance: 62,     // a esta distancia reconoce un cuerpo en el piso
    bodySuspicionRate: 1.3,    // y lo pone nervioso rapidísimo
    spookedDecayFactor: 0.35,  // se olvida a un tercio de velocidad
    spookedFloor: 0.4,         // y su sospecha nunca vuelve a bajar de acá
    spookedPatience: 2.0,      // te busca el doble de tiempo antes de aflojar
  },

  melee: {
    range: 15,
    arc: 1.15,           // media apertura del golpe (radianes)
    cooldown: 0.5,
    swingTime: 0.16,
    damage: 1,
    knockback: 70,
    stagger: 0.45,       // lo que queda aturdido el guardia golpeado
    backArc: 1.25,       // cuán "de espaldas" tiene que estar para el degüello
    quietNoise: 55,      // el ruido de un cuerpo cayendo
    loudNoise: 130,      // el ruido de un forcejeo
  },

  passenger: {
    speed: 66,
    noticeRadius: 40,      // a esta distancia te ve y entra en pánico
    noticeAngle: 1.2,      // pero solo mirando para adelante: se los puede rodear
    noticeBehind: 16,      // salvo que te le pongas literalmente encima
    panicDelay: 0.35,      // lo que tarda en reaccionar y gritar
    shoutRadius: 300,      // el grito alerta a los guardias en este radio

    /**
     * AMENAZAR A UN PASAJERO.
     *
     * Existe para arreglar un problema medido: el blindado y el correo son el
     * 72% del tren, así que los otros cuatro vagones son decorado y nunca hay
     * que elegir entre ellos. Con esto, un vagón de pasajeros pasa de ~$142 a
     * ~$320 y la concentración baja a la mitad.
     *
     * LA REGLA QUE LO HACE UNA DECISIÓN Y NO PLATA GRATIS: te queda un testigo
     * vivo. Le sacás la plata y se queda temblando, pero apenas lo soltás va a
     * gritar. Plata ahora, alarma después — o lo callás, y eso se va a pagar
     * cuando exista el honor.
     *
     * Por eso `robPanicDelay` es el número importante de acá: es cuánto tiempo
     * tenés para irte o para decidir qué hacer con él.
     */
    robTime: 1.4,          // lo que tarda en aflojar la plata
    robMin: 25, robMax: 70,
    robPanicDelay: 4.0,    // y después de soltarlo, cuánto tarda en gritar
  },

  /**
   * LA ALARMA.
   *
   * Antes los refuerzos aparecían de la nada en un enganche. Ahora la presión
   * la hacen los guardias QUE YA EXISTEN: la alarma despierta a los del vagón
   * donde estás y a los de dos vagones para cada lado, y esos vienen caminando
   * hasta vos. Eso arregla dos cosas de una: es coherente (no salen de un vagón
   * que ya limpiaste, porque ahí no queda nadie) y es más difícil, porque en
   * vez de pelear contra dos peleás contra seis.
   *
   * La única gente nueva que entra al tren viene de la LOCOMOTORA, por la punta
   * de adelante. Nunca por atrás: atrás está el aire libre y tu caballo.
   */
  alert: {
    /**
     * CUÁNTOS VAGONES ALCANZA UN GRITO.
     *
     * El alcance de un DISPARO no sale de acá: sale del arma (`noiseWagons` en
     * data/weapons.js). El Colt alcanza un vagón; las armas ruidosas que vengan
     * después van a alcanzar más, y ese va a ser su precio real.
     */
    wagonRadius: 1,

    /**
     * La alarma YA NO se propaga sola con el tiempo.
     *
     * Antes cada 14 segundos se enteraba un vagón más, hicieras lo que hicieras.
     * Eso tenía dos problemas: te sacaba el control (quedarte callado no servía
     * de nada, el tren se enteraba igual) y le comía todo el sentido al ruido
     * por arma, porque si al final se entera todo el mundo, da lo mismo con qué
     * dispares. Ahora la alarma se propaga SOLO cuando hacés ruido.
     */

    firstReinforcement: 20,  // segundos tras la alarma hasta el primero de la locomotora
    interval: 16,
    max: 4,
  },

  loot: {
    bagTime: 0.6,        // botín rápido

    /**
     * LA CAJA FUERTE: botín lento y ruidoso. Subió de 4 a 6,5 segundos.
     *
     * Es el número que decide si la caja fuerte es una APUESTA o un trámite.
     * Con 4 segundos se podía abrir casi de paso; con 6,5 hay que decidir
     * quedarse quieto, de espaldas, en un vagón donde ya sonó el ruido de la
     * anterior — y el blindado tiene DOS, o sea trece segundos de un asalto
     * de 145 parado en el peor lugar del tren.
     *
     * No cambia cuánto dan (`data/wagons.js`): sube lo que cuestan. Es la
     * misma idea que sostiene todo el galope — lo caro no es el botín, es el
     * tiempo que te comés yendo a buscarlo.
     */
    strongboxTime: 6.5,
    radius: 15,          // distancia para poder interactuar
  },

  /**
   * LAS PUERTAS. Una en cada enganche, entre vagón y vagón (y en la entrada
   * desde la cola). El mapa de tiles nunca cambia durante el asalto, así que
   * una puerta no es un tile: es una entidad con estado propio
   * (entities/door.js), parada sobre la pasarela del enganche.
   *
   * LA REGLA: cerrada, tapa la VISTA pero no las balas. Un guardia del otro
   * lado no te ve, pero te puede tirar igual, a ciegas y en ráfagas más
   * largas (`enemy.doorBurstSize` más abajo). Para vos, abrirla es gratis:
   * empujarla (caminar hacia ella) ya la abre. Se vuelve a cerrar sola si
   * nadie queda parado en el marco.
   *
   * LAS DOS DEL BLINDADO NO SIGUEN NADA DE ESO: son chapa. Frenan el paso y
   * frenan las balas, y desde afuera no se empujan. Por eso `health` de acá
   * no les aplica — no hay número de tiros que las abra, sólo la dinamita.
   */
  doors: {
    health: 3,        // tiros que aguanta una puerta común antes de romperse
    closeDelay: 1.6,  // segundos sin nadie en el marco antes de cerrarse sola
  },

  /**
   * EL TECHO — segunda mitad del abordaje (paso C). Ver NOTAS-DISENO.md.
   *
   * No es un segundo tilemap: es una franja angosta paralela al pasillo. Lo
   * que la hace jugable NO son obstáculos clavados que esquivás caminando
   * —esa fue la primera versión y estaba mal— sino COSAS QUE VIENEN HACIA
   * VOS. El tren avanza, y los carteles y gantries de la vía te pasan por
   * encima: no se los puede rodear, hay que decidir rápido AGACHARSE
   * (Shift) o SALTAR (Espacio). Ahí está el juego del techo.
   *
   * Y el techo se CORTA entre vagón y vagón: sobre el enganche no hay nada.
   * Cruzar de un techo al siguiente es un salto que hay que calcular.
   *
   * `centroY` es SIEMPRE 80 (= 5 * tileSize), la línea que separa las filas
   * 4 y 5: todos los vagones miden 10 filas y esas dos son siempre el
   * pasillo/pasarela, así que es la misma línea para el tren entero.
   */
  techo: {
    centroY: 80,
    ancho: 9,            // media anchura pisable: angosto a propósito

    /**
     * LOS OBSTÁCULOS QUE VIENEN HACIA VOS.
     *
     * Aparecen adelante (del lado de la locomotora) y barren el techo hacia
     * la cola. Cada uno pide UNA cosa: los altos hay que agacharse, los
     * bajos hay que saltarlos. Hacer lo otro, o no hacer nada, es chocar.
     */
    obstaculoCada: 2.4,      // segundos entre uno y otro
    obstaculoVel: 165,       // px/s con los que te barren, hacia la cola
    obstaculoAdelanto: 260,  // a qué distancia adelante tuyo aparecen
    obstaculoAncho: 9,       // media anchura de la zona donde te agarra
    obstaculoDanio: 1,
    obstaculoRuido: 280,     // radio (px) del ruido del golpe

    /** Tu salto en el techo: para cruzar huecos Y para pasar los carteles bajos. */
    saltoDuracion: 0.72,
    saltoBoost: 1.45,        // vas más rápido en el aire: es lo que cruza el hueco

    /**
     * CHOCAR NO TE TELETRANSPORTA. Te caés ahí mismo, tardás en levantarte, y
     * el golpe suena tanto que los guardias de abajo saben EXACTAMENTE dónde
     * estás — no "por dónde andaba", exactamente dónde.
     */
    levantarse: 1.0,

    /**
     * BAJAR A PROPÓSITO. Se hace desde el BORDE del techo (a menos de
     * `bajarAlcance` del filo), no parado sobre el enganche: ahí ya no hay
     * techo, ese es justamente el hueco. Descolgarse así es silencioso;
     * pisar el vacío por error hace el mismo viaje pero a los gritos.
     */
    bajarAlcance: 44,
    bajarHold: 0.4,
  },

  /**
   * LO QUE SE SUELTA ADENTRO DEL TREN — barriles y cajones.
   *
   * LA IDEA: que el tren sea un enemigo más, no sólo el escenario. Hasta acá
   * todo lo que te podía lastimar adentro de un vagón era una persona con un
   * arma; el tren en sí era el piso donde pasaban las cosas.
   *
   * ES EL MISMO LENGUAJE QUE LOS CARTELES DEL TECHO (ver `techo`, más arriba),
   * y eso es a propósito: aparece, viene hacia vos, y tenés que leerlo y
   * decidir rápido. Lo que cambia es que acá hay DOS respuestas posibles en vez
   * de una — esquivarlo (salirte del pasillo) o reventarlo a tiros — y por eso
   * tiene vida. Gastar balas en un barril es una decisión de verdad con el
   * Colt: son 6 tiros y tres segundos y medio de recarga.
   *
   * RUEDAN HACIA LA COLA, siempre. No es un capricho: el tren acelera, y lo
   * que está suelto adentro se va para atrás. Entrando, te vienen de frente;
   * volviendo, te alcanzan por la espalda. La misma cosa se lee distinto según
   * para dónde vayas.
   *
   * Y SE CAEN DEL TREN EN EL ENGANCHE. Un barril que llega al borde del vagón
   * se va al vacío, así que el enganche —que no tiene cobertura y te deja
   * servido a los jinetes— pasa a ser el único lugar donde esto no te alcanza.
   * Otro intercambio, no un refugio.
   */
  rodante: {
    vida: 3,             // tiros que aguanta antes de reventar
    velocidad: 135,      // px/s hacia la cola
    hw: 8, hh: 9,        // media anchura / media altura de la caja de golpe

    /**
     * Dónde aparece y cuánta pista necesita.
     *
     * `adelanto` es a qué distancia del jugador se suelta; `pistaMinima` es lo
     * que no se negocia: si en el vagón no entra ese tramo entre el barril y
     * vos, NO aparece. Sin eso, en un vagón corto (el tren veloz los tiene de
     * 224px) podría nacer prácticamente encima tuyo, y este juego no tiene un
     * solo peligro que no se pueda ver venir.
     *
     * `pistaMinima` BAJÓ de 170 a 150 cuando la velocidad subió, y parece al
     * revés pero no lo es: con 170 y los vagones cortos del tren veloz, el
     * barril sólo podía nacer si estabas en el primer cuarto del vagón, así
     * que casi nunca aparecía. 150px a 135 px/s siguen siendo 1,1 segundos de
     * aviso quieto (0,7 si vas corriendo de frente contra él), que alcanza
     * para leerlo y correrte — el hueco entre asientos más cercano está
     * siempre a menos de medio segundo.
     */
    adelanto: 250,
    pistaMinima: 150,

    /** Cada cuánto se suelta una TANDA. Lo pisa el tipo de tren (data/train.js). */
    cada: 3.8,

    /**
     * VIENEN DE A VARIOS, Y ESCALONADOS EN EL TIEMPO — no juntos.
     *
     * Dos barriles pegados uno al lado del otro son UN barril más ancho: te
     * corrés una vez y listo, no agregan ninguna decisión. Separados medio
     * segundo, en cambio, no te alcanza con esquivar y volver al pasillo: hay
     * que quedarse afuera mientras pasa la tanda entera, o gastar 3 balas por
     * cada uno — y una tanda de tres son NUEVE, más de un tambor lleno del
     * Colt. Ahí está la presión: el arma deja de alcanzar para resolverlo.
     */
    rafagaMin: 2,
    rafagaMax: 3,
    rafagaGap: 0.45,     // segundos entre uno y el siguiente de la misma tanda

    /**
     * TE LLEVA PUESTO: caés de espaldas y tardás en levantarte.
     *
     * NO SACA VIDA, y es la decisión de diseño central de todo esto. El precio
     * es tiempo y exposición: un segundo y medio en el piso, sin poder
     * disparar ni moverte, en un vagón donde hay gente apuntándote. Eso ya es
     * carísimo — sumarle daño lo convertiría en el castigo más duro del juego
     * por el error más fácil de cometer.
     */
    levantarse: 1.5,
    empuje: 160,         // con cuánta fuerza te manda para atrás
    ruidoGolpe: 240,     // el porrazo se oye: radio en px
  },

  /**
   * EL TREN TRAICIONERO — balanceo y tirones.
   *
   * Hasta acá el tren era el escenario, o a lo sumo (con `rodante`) algo que
   * te tira cosas encima. Esto es un paso más: EL PROPIO PISO deja de ser
   * confiable un rato. Sólo el tren veloz lo tiene (`TRAIN_TYPES.veloz.
   * traqueteoCada`); el estándar y el de carga quedan intactos.
   *
   * TRES TIEMPOS, siempre los mismos, y es la regla que sostiene todo el
   * sistema: nada te agarra de sorpresa.
   *
   *   1. AVISO (`avisoTiempo`) — un balanceo chico y un crujido. CERO efecto
   *      todavía. Es tu ventana para prepararte: meterte a cubierto, dejar de
   *      apuntar algo fino.
   *   2. EFECTO (`efectoTiempo`) — el sacudón de verdad. Acá pega todo.
   *   3. VUELVE (`volverTiempo`) — se asienta.
   *
   * DOS SABORES, sorteados a medias: ACELERA empuja hacia la COLA (lo suelto
   * se va para atrás) y sacude la carga — dispara barriles extra, reusando el
   * mismo sistema de `rodante`. FRENA empuja hacia la LOCOMOTORA y no suma
   * barriles: frenar no le saca tracción a la carga, se la da.
   *
   * PAREJO PARA TODOS — guardias y jugador, la misma dispersión de más y el
   * mismo empujón. No es que el juego te castigue a vos: es que el piso es
   * peor para cualquiera parado en él. Eso es lo que lo hace justo.
   *
   * A CUBIERTO NO TE ARRASTRA. Estar pegado a una pared es estar afianzado —
   * le da a la cobertura un valor nuevo que hoy no tenía.
   *
   * LOS JINETES DE AFUERA NO SE ENTERAN. Van a caballo; el vagón que se
   * bambolea no es un problema de ellos. Durante un balanceo, la ventanilla se
   * vuelve la parte más peligrosa del vagón sin que haya que decirlo.
   *
   * POR QUÉ SE SUMA Y NO SE MULTIPLICA la dispersión: sumar castiga mucho más
   * al que apunta fino que al que ya tira sucio. El Colt (0,035) casi se
   * triplica; un guardia de lejos (0,28) apenas lo nota. El sacudón te saca a
   * VOS la ventaja de la puntería — que es exactamente lo traicionero que
   * tiene que ser.
   */
  traqueteo: {
    cada: 10,             // segundos entre sacudones, con variación al azar
    avisoTiempo: 0.6,
    efectoTiempo: 1.6,
    volverTiempo: 0.5,

    dispersionExtra: 0.06,  // se SUMA al spread de cualquiera que dispare
    empujePx: 28,            // arrastre total durante el efecto, en píxeles
    barrilesExtra: 2,        // sólo en la variante "acelera"
  },

  /**
   * EL PESO DE LO QUE LLEVÁS ENCIMA — y por qué sólo cuenta después de la alarma.
   *
   * `raid.cleanBonus` ya premiaba con el DOBLE de botín salir sin que sonara la
   * alarma, pero era un número invisible: aparecía recién en la pantalla de
   * resultados, así que jugando no se sentía nada. Esto lo pone en las manos.
   *
   * LA REGLA: mientras nadie dio la voz, cargás lo que quieras y no pesa nada.
   * Apenas suena la alarma, cada tanda de plata que llevás encima te frena un
   * poco — y lo que agarres a partir de ahí te frena más. Un tren limpio es un
   * tren que te podés llevar entero; uno que se despertó te obliga a elegir
   * qué soltar y qué no ir a buscar.
   *
   * POR QUÉ ESTO Y NO OTRA COSA: es la misma familia de castigo que sostiene
   * todo el resto del juego. Acá nada te quita vida por equivocarte — el
   * barril te tumba, la caja fuerte tarda, el salto sucio despierta un vagón.
   * Todos cobran en TIEMPO y EXPOSICIÓN. Que la alarma te vuelva lento en vez
   * de sacarte algo es exactamente esa regla, aplicada por primera vez a
   * "cuánto llevás" en lugar de "cuánto tardaste".
   *
   * Y SUBE DE A POCO, no de golpe (decidido con Santi): así "¿agarro uno más?"
   * es una pregunta que te hacés en CADA botín después de la alarma, y no una
   * sola vez. Un escalón fijo se decide una vez y se olvida.
   */
  peso: {
    porCada: 100,        // cada $100 encima...
    penalizacion: 0.02,  // ...te saca un 2% de velocidad
    /**
     * Techo duro. Con el botín promedio del tren de carga (~$1400) llevarte
     * casi todo da -28%, así que este tope casi no se toca — está para que
     * un tren excepcionalmente rico no te deje literalmente clavado.
     */
    maximo: 0.35,
  },

  /**
   * LA ESTAMPIDA — el ganado como herramienta, no como decorado.
   *
   * Los vagones de ganado existían desde la fase 2 y nunca hicieron nada: eran
   * un pasillo con corrales dibujados. El tren de carga lleva TRES, así que es
   * el único donde esto puede ser una identidad y no un truco suelto
   * (`TRAIN_TYPES.carga.estampida`).
   *
   * ES LA PRIMERA COSA DEL JUEGO QUE VOS LE HACÉS AL TREN, y no al revés. Los
   * barriles te caen encima; la estampida la soltás vos. Por eso es la pieza
   * que hace jugable al sigilo: hasta ahora "ir limpio" era sólo EVITAR pelear,
   * y ahora hay una forma de ABRIR camino sin disparar un tiro.
   *
   * PERO NO ES GRATIS, Y LOS TRES COSTOS IMPORTAN:
   *
   *  1. Abrir la tranquera son `abrirHold` segundos quieto en el pasillo, al
   *     descubierto. Es el mismo precio que la caja fuerte: tiempo parado en
   *     el peor lugar.
   *  2. Hace RUIDO (`ruido`): los guardias alrededor vienen a mirar qué pasó.
   *     No dispara la alarma —no es un tiro— pero tampoco es silencioso.
   *  3. **Las reses te atropellan a vos igual que a ellos.** Corren hacia la
   *     locomotora y no distinguen a nadie. Por eso hay `arranque`: un momento
   *     en que se amontonan antes de salir, que es tu ventana para meterte en
   *     un hueco entre corrales. Soltar la estampida y quedarte parado en el
   *     medio es que te lleve puesto tu propia jugada.
   *
   * Corren hacia la LOCOMOTORA, al revés que los barriles (que van hacia la
   * cola). Es a propósito: los barriles vienen A vos, las reses van DELANTE
   * tuyo. La misma pantalla se lee distinto según qué se te viene encima.
   */
  estampida: {
    abrirHold: 0.9,      // segundos manteniendo [E] para abrir la tranquera
    arranque: 1.0,       // se amontonan antes de salir: tu ventana para correrte
    reses: 5,
    velocidad: 165,      // más rápidas que un barril (135)
    gap: 0.12,           // entre una res y la siguiente: salen en manada
    alcance: 700,        // cuántos px corren antes de perderse adelante
    /**
     * CUÁNTO QUEDA EN EL PISO EL GUARDIA ATROPELLADO.
     *
     * Subió de 1,3 a 3,0 jugando. Con 1,3 el guardia se levantaba antes de que
     * llegaras a rematarlo, así que la estampida no servía para lo único que
     * la hace una herramienta de sigilo: **abrirte la oportunidad**. La cuenta
     * es simple — a 78 px/s cruzar los 100-150px que suele haber hasta el
     * guardia son casi dos segundos, más el tiempo de encarar el degüello.
     * Un aturdimiento más corto que eso es decorativo.
     *
     * Para comparar: un golpe de puño deja 0,45s (`melee.stagger`). Media
     * tonelada de animal a la carrera tiene que valer bastante más que eso.
     */
    aturdeGuardia: 3.0,

    /**
     * Y LA SEGUNDA RES LO MATA. Si la manada le pasa por encima a alguien que
     * YA está en el piso, no lo vuelve a aturdir: lo termina. Es lo que hace
     * que soltar cinco reses y no una signifique algo — la primera lo voltea,
     * las de atrás deciden si se levanta. Y es una muerte silenciosa, que es
     * justo lo que este tren premia... salvo por el cuerpo que queda tirado,
     * y eso ya lo cobra el sistema de cadáveres (`enemy.bodySightDistance`).
     */
    matalAturdido: true,

    ruido: 320,
  },

  /**
   * LA RECOMPENSA (`gameState.bounty`).
   *
   * `bounty` no mide lo que hiciste, mide SI TE IDENTIFICARON haciéndolo. Sin
   * alarma y sin captura, no se mueve nunca, aunque hayas matado o robado
   * muchísimo: si nadie sobrevive para describirte, la ley no tiene a quién
   * buscar. La plata robada no toca esto, va a `fame` (ver applyRaidResult en
   * state/gameState.js).
   */
  bounty: {
    // Por cada guardia o jinete de la ley muerto, CON la alarma sonando.
    pesoGuardia: 15,

    /**
     * Por cada civil (pasajero) muerto, CON la alarma sonando. Bastante más
     * que un guardia: un guardia armado, en su trabajo, es casi el costo
     * esperado del oficio. Un civil nunca representó una amenaza, y matarlo
     * es lo que hace que un cazarrecompensas se levante de la silla.
     */
    pesoCivil: 110,

    /**
     * Por cada pasajero amenazado (le sacaste la plata con [E]), CON la
     * alarma sonando. Mitad de `pesoGuardia`: robar es un delito real —
     * queda un testigo — pero no es matar a nadie.
     */
    pesoAmenaza: 7,

    // Salto fijo si te capturan, APARTE de todo lo demás (tienen tu cara).
    capturaFlat: 300,
  },

  /**
   * LA PRISIÓN — lo que pasa cuando te agarran.
   *
   * El juego NUNCA te mata en el tren: te esposan (te cayeron a tiros) o el
   * tren llega a la estación con vos adentro. Las dos terminan acá.
   *
   * LA FIANZA ES TU RECOMPENSA, Y SE COBRA CON LO QUE TENGAS. Si te alcanza,
   * pagás y la recompensa vuelve a cero. Si no, te sacan todo, la deuda baja
   * por lo que pagaste y salís debiendo el resto.
   *
   * Las dos alternativas obvias se rompen solas, y por eso no están: si salir
   * sin pagar borrara la recompensa, NO PAGAR SERÍA MEJOR QUE PAGAR; y si la
   * deuda quedara intacta, el que cae pobre no sale nunca más de la espiral.
   */
  prision: {
    /**
     * A PARTIR DE ACÁ TE CUELGAN, TENGAS LA PLATA O NO.
     *
     * Que la horca no se pueda comprar es todo el filo del sistema: si el
     * dinero siempre te salvara, la recompensa volvería a ser un precio, y un
     * precio no es una cuenta regresiva. Así queda repartido: la plata te
     * salva del castigo chico, y sólo mantener la recompensa baja te salva
     * del grande.
     *
     * Subió de 900 a 1200 al agregar los escalones de jinetes 700→4 y
     * 1000→5 (`data/riders.js`, `RIDER_SPAWN.maxPorRecompensa`): con 900, la
     * horca caía ANTES de llegar a ver el techo de 5 jinetes, y ese escalón
     * quedaba muerto. Un jugador prolijo (sólo capturas, sin matar) aguanta
     * cuatro; uno que mata gente llega antes. La violencia te mata rápido y
     * el descuido te mata lento, que es el reparto que se busca.
     *
     * ES EL NÚMERO A VIGILAR JUGANDO. Si la horca no llega nunca, bajalo; si
     * llega sin que la hayas visto venir, subilo (o hacé más ruidoso el aviso
     * de la oficina del sheriff).
     */
    umbralHorca: 1200,

    /**
     * Desde qué fracción del umbral el aviso del sheriff se pone urgente.
     * Con 0,6: a partir de $540 deja de informarte y empieza a advertirte.
     */
    avisoCerca: 0.6,
  },

  /**
   * DE DÍA Y DE NOCHE.
   *
   * Dormir en la carpa da vuelta la hora, y eso decide qué está abierto en el
   * pueblo: al establo y a la armería sólo se entra de día; la cantina y la
   * oficina del sheriff no cierran nunca.
   *
   * LA HORA NO SE DICE CON UN CARTEL, SE VE. No hay reloj ni etiqueta en
   * pantalla: lo dicen la luz y la fogata (prendida de noche, apagada de día).
   * Es la misma regla que sostiene el resto del juego — el aro del ruido, la
   * marca del salto, el travesaño de las vías: lo que se puede mostrar no se
   * escribe.
   *
   * El velo de noche se pinta ENCIMA de la escena ya dibujada. La alternativa
   * —dos paletas completas de cada cosa— obligaría a mantener dos juegos de
   * colores para siempre, y cualquier objeto nuevo nacería a medias.
   */
  hora: {
    /** El velo de la noche al aire libre: el pueblo, el campamento. */
    velo: '#0d1226',
    veloAlpha: 0.52,

    /**
     * Adentro es más suave, y no es un capricho: los interiores tienen
     * lámparas. Que la cantina de noche siga siendo un lugar cálido mientras
     * la calle está oscura es justamente lo que hace que entrar se sienta
     * como entrar.
     */
    veloInterior: '#141024',
    veloInteriorAlpha: 0.22,

    /** Las ventanas del pueblo se encienden cuando cae el sol. */
    ventanaEncendida: '#e8b45c',
  },

  /**
   * LA SENSACIÓN DE VELOCIDAD.
   *
   * La cámara va pegada al tren, así que el tren está QUIETO en pantalla: lo
   * único que cuenta que esto se mueve es el fondo. Estos números son los que
   * deciden si el tren parece lanzado o estacionado.
   *
   * La sensación la da **la diferencia entre capas**, no la velocidad de una
   * sola: los cerros casi no se mueven y el rastrojo de la vía vuela. Y lo
   * cercano tiene que ser chico y denso — muchas rayitas se leen como el suelo
   * yéndose; manchones grandes se leen como objetos que pasan.
   *
   * Si alguna vez el tren se siente lento, se toca acá y nada más.
   */
  parallax: {
    /** Multiplicador general. Subilo y todo el mundo acelera. */
    velocidad: 1.0,

    capas: [
      // cerros lejanos: casi quietos, son la referencia de "esto está lejos"
      { v: 110,  sep: 78, alto: 3, color: '#2b211a' },
      { v: 320,  sep: 46, alto: 3, color: '#33271e' },
      // arbustos y matorrales del costado de la vía
      { v: 760,  sep: 30, alto: 2, color: '#3a2b20' },
      // rastrojo pegado a la vía: chico, denso y volando
      { v: 1500, sep: 13, alto: 2, ancho: 5, color: '#4a3628' },
      { v: 2100, sep: 9,  alto: 1, ancho: 4, color: '#5b4530' },
    ],

    /** Las rayas de velocidad, el truco más barato que hay para vender prisa. */
    rayas: { cantidad: 7, velocidad: 2200, largo: 24, color: '#6b5a44', alpha: 0.3 },
  },

  feel: {
    shakeShoot: 0.7,
    shakeHit: 3.2,
    shakeKill: 1.6,
    hitFlash: 0.12,
    muzzleTime: 0.05,
  },

  audio: {
    enabled: true,
    master: 0.5,
  },

  colors: {
    outside:    '#0d0b0c',
    floor:      '#6d4a30',
    floorAlt:   '#7a5436',
    wall:       '#3a2a1f',
    wallTop:    '#4d382a',
    seat:       '#8a5a34',
    seatTop:    '#a06b3f',
    door:       '#2b4a3a',
    doorGlow:   '#57a07a',
    techo:        '#4a3a2c',
    techoBorde:   '#2c221a',
    techoObstaculo: '#6b5a44',

    /**
     * EL CAMPAMENTO, de noche. La paleta entera está construida alrededor de
     * una sola idea: la fogata es la única fuente de luz. Por eso el suelo
     * tiene dos tonos (cerca del fuego y lejos) y el borde se funde con el
     * desierto — el límite de hasta dónde podés caminar no es una pared, es
     * donde se termina la luz.
     */
    campNoche:    '#120f12',
    campSuelo:    '#3a2c22',
    campSueloLejos: '#241c18',
    campFuego:    '#ff9a3c',
    campBrasa:    '#c9482a',
    campTronco:   '#4a3524',
    campCarpa:    '#6b5a44',
    campCarpaSombra: '#463a2c',
    campCajon:    '#7a5436',
    campCartel:   '#8a6b47',

    /**
     * El campamento DE DÍA. Es el único lugar con dos paletas propias en vez
     * de resolverse con el velo, y por un motivo concreto: de noche el suelo
     * no es un suelo, es un charco de luz de la fogata que se apaga hacia
     * afuera. De día eso no existe — hay un claro de tierra pisada y desierto
     * alrededor. Son dos dibujos distintos, no el mismo más oscuro.
     */
    campSueloDia:    '#a08053',
    campDesiertoDia: '#8a6f47',
    campBordeDia:    '#7a6039',
    campCeniza:      '#4a4038',

    /** Los interiores: madera, lámpara y paño verde de la mesa de póker. */
    intPiso:       '#8a6a44',
    intPisoAlt:    '#7d5f3c',
    intPared:      '#4a3524',
    intParedTop:   '#5f4530',
    intMadera:     '#7a5836',
    intMaderaOsc:  '#4a3524',
    intMetal:      '#6b7480',
    intPaño:       '#3d6b4a',
    intPañoBorde:  '#2c5138',
    intLampara:    '#ffd08a',
    intPapel:      '#cdb68d',
    intAlfombra:       '#6b3a34',
    intAlfombraBorde:  '#4a2622',

    /**
     * EL PUEBLO, de día. Al revés que el campamento: allá la luz era una sola
     * fogata en la noche, acá es el sol pegando en la tierra. Que los dos
     * lugares no se parezcan en nada es lo que hace que viajar se sienta como
     * ir a otro lado y no como cambiar de pantalla.
     */
    puebloCielo:   '#8a7a5c',
    puebloTierra:  '#9c7f56',
    puebloTierra2: '#8d7149',
    puebloVereda:  '#6b5236',
    puebloMadera:  '#7a5836',
    puebloMaderaOsc: '#4a3524',
    puebloTecho:   '#5e4530',
    puebloPuerta:  '#33261b',
    puebloLetrero: '#c9b28a',
    puebloVecino:  '#b9a37e',
    puebloVecino2: '#a88f9e',

    /**
     * EL MAPA DE LA REGIÓN — papel de la época.
     *
     * Toda la paleta es UN material: papel viejo y tinta marrón. No hay
     * colores de interfaz (ni azules, ni verdes de menú) porque en cuanto
     * entra uno, el mapa deja de ser un objeto que el forajido desdobla y
     * pasa a ser una pantalla del juego. El único color que se sale de la
     * tinta es el rojo del sello, y justamente por eso se ve.
     */
    mapaPapel:    '#cdb68d',
    mapaPapel2:   '#c2a97e',
    mapaMancha:   '#b49a6c',
    mapaBorde:    '#8a6f47',
    mapaTinta:    '#4a3524',
    mapaTintaSuave: '#7a6144',
    mapaRio:      '#7d8a72',
    mapaSello:    '#8c2f26',
    mapaResalte:  '#3a2a18',
    coupling:     '#2a2320',   // el enganche entre dos vagones
    couplingEdge: '#171210',
    player:     '#e8d5ac',
    playerHat:  '#2e2320',
    playerCover:'#b9a880',
    enemy:      '#8d99a8',
    enemySus:   '#d8c058',
    enemyAlert: '#c86a52',
    enemyDead:  '#3d3835',
    civilian:   '#b98fa8',
    civilianRun:'#d8a8c0',
    bagLoot:    '#d9b04a',
    strongbox:  '#8f9aa6',
    bulletP:    '#ffe9a8',
    bulletE:    '#ff9a63',
    dynamite:     '#b8452f',
    dynamiteBand: '#e8d5ac',
    noiseRing:    '#d8c058',

    // Ventanilla y baranda: se dibujan como huecos, no como pared. Tienen que
    // leerse de un vistazo como "por acá entra una bala".
    window:       '#2f4a52',
    windowGlass:  '#7fb2bd',
    railing:      '#6b5236',
    railingTop:   '#8a6b47',

    // La ley cabalgando afuera
    horse:        '#6a4a33',
    horseDark:    '#4d3524',
    horseMane:    '#3c2a1c',
    rider:        '#c8b48a',
    riderHat:     '#2a2320',
    blood:      '#8c2f26',
    text:       '#f2e4c9',
    textDim:    '#a8977c',

    /**
     * El tile 'C' (carga) se pinta distinto en cada tipo de vagón. Es lo único
     * que hace que, sin arte, se note de un vistazo en qué vagón estás.
     * Cada entrada es [color base, color del borde de arriba].
     */
    cargo: {
      comedor:   ['#6b4526', '#8a5c33'],   // mesas de madera oscura
      correo:    ['#9c7a45', '#b89257'],   // cajones y arpillera
      ganado:    ['#5f5a4e', '#7b7466'],   // rejas de corral, madera gris
      blindado:  ['#4a5058', '#626a74'],   // chapa de acero
      cola:      ['#6b4f36', '#87664a'],   // equipaje amontonado
      pasajeros: ['#8a5a34', '#a06b3f'],
      default:   ['#7a5436', '#94663f'],
    },
  },
};
