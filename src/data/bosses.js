/**
 * MINI JEFES — gente que sube al tren por VOS, no a custodiarlo.
 *
 * Catálogo, mismo patrón que WEAPONS, HORSES, GUARD_TYPES y RIDERS: acá viven
 * los números y nada más. Cómo piensan está en systems/boss.js y qué son está
 * en entities/boss.js, separados a propósito igual que guardia/IA.
 *
 * LA DIFERENCIA DE FONDO CON UN GUARDIA, Y ES TODA LA IDEA: un guardia es
 * parte del tren y reacciona a que vos entraste. Un mini jefe es parte de TU
 * historia y ya venía en camino antes de que subieras. Por eso no patrulla, no
 * sospecha y no se olvida: nace en modo caza y se muere en modo caza.
 *
 * SOBRE LA VIDA: el techo del juego (`MAX_GUARD_HEALTH`, data/guards.js) sigue
 * en 4 para TODOS los guardias, sin excepción. El Cazarrecompensas es la única
 * excepción a esa regla (`health: 8` más abajo), y no fue la primera idea:
 * se probó primero hacerlo un jefe "de verdad" sólo con IA (cobertura,
 * embestida, visión) y medido, con 4 de vida cualquier jugador lo mataba con
 * medio tambor del Colt sin recibir un rasguño — no era un problema de
 * comportamiento, era aritmética (0,40s por tiro × 5 tiros = 2 segundos). Ver
 * la nota completa en `health` y en NOTAS-DISENO.md.
 */

import { CONFIG } from './config.js';

/** Ningún disparo del juego saca más de 1, y esto no es la excepción. */
const DANIO_DE_BALA = 1;

export const BOSSES = {
  /**
   * EL CAZARRECOMPENSAS.
   *
   * No custodia el tren: te caza a vos. Sube por la cola —igual que vos— y
   * aprieta hacia la locomotora, o sea que se te mete entre el punto donde
   * estés robando y tu caballo. Esa dirección no es decorativa: es la misma
   * moneda con la que el juego cobra todo lo demás (la distancia hasta la
   * salida), aplicada por primera vez a una persona.
   */
  cazarrecompensas: {
    id: 'cazarrecompensas',
    name: 'El Cazarrecompensas',
    short: 'CAZADOR',

    /**
     * CUÁNDO APARECE. Los dos filtros importan:
     *
     * `bountyMinimo` — la recompensa que YA traías al subir a este tren, no lo
     * que hagas durante el asalto (misma regla que el techo de jinetes en
     * data/riders.js). Es lo que hace que la recompensa deje de ser un número
     * en un cartel y pase a ser algo que te persigue.
     *
     * `soloEnTipos` — sólo en el tren estándar. No es una limitación técnica:
     * el veloz ya tiene su enemigo propio (el tren mismo: barriles y
     * traqueteo) y el de carga tiene el suyo (la pregunta del sigilo). Meterle
     * un cazador encima a esos dos les taparía la identidad que costó
     * construirles. El estándar es el que tiene lugar libre — su decisión son
     * los caminos, y un cazador que te corta el camino JUEGA con eso en vez de
     * pisarlo.
     */
    bountyMinimo: 900,
    soloEnTipos: ['estandar'],

    /**
     * OCHO DE VIDA — la única cosa de todo el juego que pasa el techo de 4, y
     * hay que dejar escrito por qué, porque contradice una regla vieja.
     *
     * El techo de `MAX_GUARD_HEALTH` (data/guards.js) existe para una promesa
     * concreta: que el futuro Rifle de Caza (5 de daño) mate **a cualquier
     * guardia** de un solo tiro. Esa promesa se mantiene intacta — ningún
     * guardia pasa de 4 y nada de eso se tocó. Lo que la regla nunca
     * contempló es un mini jefe, que por definición no es un guardia.
     *
     * Y SIN ESTO NO HAY PELEA. Medido con el jugador disparándole de frente:
     * con 4 de vida lo mataba con **5 balas —menos de un tambor del Colt— y
     * sin recibir un solo punto de daño**, esquivara o no esquivara. Se probó
     * primero todo lo que NO era subir la vida (cobertura real, avance de
     * cobertura en cobertura, embestida reactiva al recibir un balazo, arreglar
     * su visión) y ninguna de esas cosas movió el número: no era un problema de
     * IA, era aritmética. 0,40 s por tiro × 5 tiros = 2 segundos.
     *
     * 8 son DOS tambores con una recarga obligada en el medio — y la recarga
     * del Colt son 3,5 segundos (`data/weapons.js`), que es exactamente cuando
     * te embiste. Ahí aparece el ciclo que un jefe tiene que tener: tirás, te
     * carga, esquivás, le pegás en la ventana del aturdido, y recargás bajo
     * presión.
     *
     * Si algún día hay un jefe más, éste es el lugar donde vive la excepción:
     * `data/guards.js` sigue siendo la ley para todo el resto del tren.
     */
    health: 8,

    /**
     * EL ACECHO — no sube corriendo, se hace esperar.
     *
     * *(Santi, después de jugar la primera versión: "no me gusta que venga muy
     * rápido, él se debería hacer esperar. Debería buscarte, pero no corriendo
     * por ahí, sino como si estuviera midiendo tus pasos desde atrás. Y no
     * debería subir tan rápido al tren")*
     *
     * Tenía razón y el diagnóstico es fácil de ver en el código viejo: subía en
     * el segundo 0 y arrancaba a caminar hacia vos a 68 px/s sin parar nunca.
     * Eso no es un cazador, es un perseguidor — y un perseguidor que ya está
     * encima desde el principio deja de dar miedo a los diez segundos, porque
     * ya sabés todo lo que va a hacer.
     *
     * AHORA HACE TRES COSAS, EN ESTE ORDEN:
     *
     *  1. **Tarda en subir** (`subeALos`). El asalto arranca sin él. Vos ya
     *     estás metido en el tren cuando aparece atrás.
     *  2. **Te mide desde atrás** (`distancia`). Te sigue manteniendo el largo
     *     de casi una pantalla, sin disparar un tiro. Lo ves de reojo cuando
     *     mirás para la cola, y no hace nada. Ésa es toda la tensión.
     *  3. **Y ataca cuando te parás a robar.** Ver `atacaSiRobas`.
     */
    acecho: {
      /**
       * Segundos del asalto antes de que suba. Con 145 s de reloj (el
       * estándar), 35 es alrededor del primer cuarto: ya te metiste en el
       * tren, ya resolviste el primer vagón, y recién ahí aparece.
       */
      subeALos: 35,

      /**
       * A qué distancia te sigue.
       *
       * 🐛 ERA 260, Y ESO LO HACÍA INVISIBLE — no "poco intenso": INVISIBLE.
       * La cámara centra en el jugador (`camera.js`) y la pantalla mide 384px,
       * o sea que se ve 192px para cada lado. Con 260 quedaba 68px afuera de
       * cámara SIEMPRE. Santi jugándolo: "no sentí incomodidad alguna" — no
       * podía, porque nunca lo tuvo en pantalla.
       *
       * Ahora en 170: adentro de los 192 visibles, con margen para que la
       * cámara (que tiene suavizado, no sigue en seco) no lo saque de cuadro
       * en cada giro. Lo ves de verdad si mirás para atrás.
       *
       * Sigue por DEBAJO del alcance de su rifle (300) a propósito: te podría
       * tirar desde ahí y elige no hacerlo. Eso es lo que lo hace inquietante
       * en vez de inofensivo.
       */
      distancia: 170,

      /**
       * LO QUE LO SACA DEL ACECHO: QUE TE PARES A ROBAR.
       *
       * Es el mejor disparador posible porque **convierte tu propio objetivo
       * en el riesgo**. Hasta ahora robar sólo costaba TIEMPO (0,6 s una
       * bolsa, 6,5 s la caja fuerte); ahora además lo llama. Cada botín deja
       * de ser "¿me alcanza el reloj?" y pasa a ser "¿me lo quiero traer
       * encima ahora?".
       *
       * Y le da sentido a la caja fuerte como ninguna otra cosa: seis segundos
       * y medio quieto, de espaldas, sabiendo que el tipo que te mide desde
       * atrás acaba de empezar a caminar.
       */
      atacaSiRobas: true,

      /**
       * También ataca si le quedás MUY cerca (te fuiste vos para atrás) o si
       * le disparás. No se deja acechar de vuelta: en cuanto lo encarás, deja
       * de medir.
       */
      distanciaQueLoGatilla: 120,
    },

    /**
     * CÓMO SE CUBRE — y por qué esto es lo que lo hacía fácil de matar.
     *
     * *(Santi, jugando la primera versión: "es MUY FÁCIL matarlo")*
     *
     * La causa era concreta: se plantaba a distancia media y se quedaba ahí
     * disparando, en el medio del pasillo. Un blanco grande y quieto que
     * aguanta cuatro balazos son cuatro balazos — sobra medio tambor del Colt
     * y no hay que hacer nada más que apretar el gatillo.
     *
     * La cobertura la usaba SÓLO para avanzar (`avanzarConCobertura`), nunca
     * para protegerse. Ahora, cuando está en su distancia de trabajo, se
     * parapeta de verdad: se mete detrás de un asiento y **sólo se expone al
     * asomarse para disparar**, igual que un guardia — pero se esconde menos
     * tiempo y se asoma más seguido.
     *
     * ESO NO LE SUBE LA VIDA (sigue en 4, el techo del juego, y no se toca):
     * le sube **cuántas de tus balas llegan a tocarlo**. Matarlo pasa a
     * requerir flanquearlo o cazarlo en la ventana del aturdido — o sea, la
     * mecánica central del juego desde la fase 1, que hasta ahora esta pelea
     * no estaba usando para nada.
     */
    cobertura: {
      holdMin: 0.45,        // un guardia normal: 0,7
      holdMax: 1.05,        // un guardia normal: 1,6
      peekSteps: [5, 8, 11],
      repositionAfter: 5.0, // cada cuánto se busca otro ángulo
    },

    /**
     * 🐛 ERA 68, MÁS LENTO QUE VOS (`CONFIG.player.speed`, 78) — Y ESO LO
     * VOLVÍA INOFENSIVO DE UNA FORMA QUE NO SE VEÍA MIDIENDO NÚMEROS SUELTOS.
     *
     * El razonamiento original decía "si corrés derecho a fondo, le sacás
     * ventaja de a poco". Lo que no decía, y era la parte que importaba: **la
     * distancia entre los dos SÓLO CRECE**. Nunca te alcanza. No hay un
     * segundo mecanismo que lo compense (no bloquea el paso, no hay nada que
     * interrumpa un escape) — así que un jugador que decide correr en línea
     * recta al caballo gana siempre, sin arriesgar nada.
     *
     * Santi, jugándolo: *"ahora probé escapar y es SUPER SENCILLO irme de
     * vuelta a caballo y abandonar al tren"*. Y la misma cuenta explica la
     * otra queja ("es MUY FÁCIL matarlo" seguía sintiéndose así pese a los 8
     * de vida): si podés retroceder disparando sin que jamás te alcance,
     * nunca te arriesgás a la embestida — le sacás el filo al arma que lo
     * hace peligroso, gratis.
     *
     * AHORA IGUALA `CONFIG.player.speed`. Dejó de perder terreno solo con el
     * tiempo: si corrés derecho, se mantiene pegado en vez de quedarse atrás.
     * No lo vuelve imposible de perder — cortarle la línea de visión y las
     * esquinas del tren siguen sirviendo, igual que contra cualquier otra
     * cosa del juego — pero correr en línea recta deja de ser gratis.
     */
    speed: CONFIG.player.speed,

    /**
     * DOS ARMAS, Y EL CORTE ENTRE ELLAS ES LO QUE LE DA FORMA A LA PELEA.
     *
     * De lejos saca el rifle: preciso, lento, un tiro por vez. La respuesta
     * correcta es cortarle la línea de visión, no tirotearlo de frente.
     * De cerca saca el revólver: rápido y en ráfagas. La respuesta correcta
     * ahí es la contraria — no lo dejes quedarse cerca.
     *
     * O sea que el jugador tiene DOS problemas distintos según la distancia, y
     * eso es lo que impide que la pelea se resuelva con una sola posición
     * buena. Los dos hacen 1 de daño: la presión sale de la frecuencia y del
     * lugar donde te obliga a estar, nunca del daño por bala.
     */
    corteDeArma: 90,   // px: más lejos que esto, rifle; más cerca, revólver

    /**
     * HASTA DÓNDE VE — y esto era un bug de los feos, encontrado midiendo.
     *
     * El jefe estaba usando la visión de un guardia común
     * (`CONFIG.enemy.viewDistance`, 118 px) mientras cargaba un rifle que
     * llega a 300 y una distancia de trabajo de 135. O sea que **no te veía
     * desde donde su propio diseño dice que quiere pelear.**
     *
     * La consecuencia, en la traza cuadro a cuadro: pasaba el primer segundo
     * entero en fase `caza` —caminando derecho por el medio del pasillo, sin
     * cubrirse, sin disparar, porque no te estaba viendo— justo mientras el
     * jugador le vaciaba el tambor. No parecía un cazador: parecía alguien
     * cruzando un vagón sin enterarse de que le tiraban. Y era la mitad del
     * "es MUY FÁCIL matarlo".
     *
     * 300 = el alcance de su rifle. Un tirador ve hasta donde llega su arma;
     * si no, el arma es decorativa.
     */
    viewDistance: 300,

    /**
     * A QUÉ DISTANCIA LE GUSTA PELEAR, Y POR QUÉ NO SE TE PEGA.
     *
     * La primera versión no tenía esto y se acercaba todo lo que podía. Medido,
     * salieron dos cosas malas de una:
     *
     *  1. **Su movimiento de firma se volvía imposible.** Terminaba pegado a
     *     unos 54 px, y la embestida necesita al menos `alcanceMin` (60) para
     *     tomar carrera. Se metía solo en un rango muerto donde no podía
     *     embestir nunca: en 45 segundos de prueba, CERO embestidas.
     *  2. **Se volvía un matón, no un jefe.** A esa distancia el revólver casi
     *     no falla: mataba a un jugador quieto y descubierto en 4,0 segundos
     *     (medido, 5 corridas: 3,9 / 4,0 / 3,9 / 4,0 / 4,0).
     *
     * Ahora se planta en `distanciaDeTrabajo` — adentro del rango de embestida
     * y del lado del rifle. Y si le quedás MÁS CERCA que `alcanceMin`,
     * RETROCEDE en vez de quedarse: se separa para tomar carrera. Eso no es un
     * parche para el bug, es lo que un cazador con un rifle haría, y de paso le
     * da al jugador una jugada nueva — pegarse a él lo saca de su mejor
     * distancia, a cambio de tener que aguantarle el revólver de cerca.
     */
    distanciaDeTrabajo: 135,

    rifle: {
      name: 'Rifle de Palanca',
      /**
       * Preciso, pero no infalible: 0,05 está entre el Colt del jugador
       * (0,035) y el Smith (0,085). Un jefe que no falla nunca no se lee como
       * un buen tirador, se lee como un número.
       */
      spread: 0.05,
      aimTime: 0.55,       // avisa BIEN: es el tiro que más duele leer tarde
      fireCooldown: 1.9,
      burstSize: 1,        // un tiro por vez: es de palanca, hay que recargarla
      burstDelay: 0,
      bulletSpeed: 380,
      range: 300,          // llega más lejos que la vista de un guardia (118)
      /**
       * Un rifle es escandaloso. Le despierta DOS vagones a cada tiro (el Colt
       * del jugador despierta 1), así que su sola presencia te empeora el tren
       * aunque no te pegue nunca — pelearlo a los tiros tiene un costo que no
       * es tu vida.
       */
      noiseWagons: 2,
    },

    /**
     * El revólver NO es su arma principal: es lo que saca cuando le quedaste
     * encima. Por eso tira más sucio que el rifle — a esa distancia no está
     * apuntando, se está sacando a alguien de encima.
     *
     * `spread` subió de 0,11 a 0,17 y `fireCooldown` de 0,70 a 0,85 después de
     * medir: con los números viejos acertaba el **64,7%** de sus balas y
     * mataba a un jugador quieto y descubierto en **4,1 segundos**. Para
     * comparar, un guardia normal a 135 px no llegó a matarlo NUNCA en 90 s
     * de prueba — o sea que el jefe no estaba una escala por encima, estaba en
     * otro juego.
     */
    revolver: {
      name: 'Revólver Colt',
      spread: 0.17,
      aimTime: 0.26,       // apenas más rápido que un guardia (0,30)
      fireCooldown: 0.85,
      burstSize: 2,
      burstDelay: 0.20,
      bulletSpeed: 330,
      range: 240,
      noiseWagons: 1,
    },

    danioBala: DANIO_DE_BALA,

    /**
     * LA EMBESTIDA — su movimiento de firma, y la única cosa del juego que
     * hace un enemigo y que no es "dispararte" ni "pegarte".
     *
     * TRES TIEMPOS, igual que el traqueteo del tren veloz (CONFIG.traqueteo) y
     * que la mecha de la dinamita: **avisa, pega, y se recupera**. Ningún
     * peligro de este juego aparece sin telegrafiarse, y un jefe no es la
     * excepción — al contrario, es donde más importa.
     *
     *   1. AVISO (`aviso`) — se planta en seco y encara. Cero movimiento.
     *   2. CARGA (`velocidad`, hasta `alcanceMax`) — sale disparado en línea
     *      recta hacia donde estabas cuando se plantó. NO te sigue: la carga
     *      va a un punto fijo, así que esquivarla es una decisión de posición
     *      y no una tirada de dados.
     *   3. RECUPERO — si te agarró, sigue como si nada. **Si erró, queda
     *      aturdido** (`aturdidoAlFallar`), y ésa es la ventana de castigo.
     *
     * LA VENTANA DE CASTIGO ES EL CORAZÓN DE TODO ESTO. Sin ella la embestida
     * sería sólo un ataque más difícil de esquivar; con ella, esquivarla te
     * REGALA el mejor segundo de la pelea. Un jefe tiene que tener un momento
     * en el que le podés pegar sin que te cueste, y ese momento tiene que
     * salir de haber jugado bien, no de esperar.
     */
    embestida: {
      aviso: 0.55,
      velocidad: 190,       // contra sus 68 caminando: se lee de inmediato
      alcanceMin: 60,       // más cerca que esto no toma carrera, te dispara
      alcanceMax: 220,      // y más lejos que esto no llega: primero se acerca

      /**
       * Lo que te hace si te agarra. `danio: 1`, como todo — el golpe no está
       * para matarte, está para SACARTE DE DONDE ESTABAS. El empujón y el
       * medio segundo largo en el piso son el verdadero costo: te arranca de
       * tu cobertura y te deja en el pasillo, que es exactamente donde no
       * querés estar.
       */
      danio: DANIO_DE_BALA,
      empuje: 120,
      tumbaAlJugador: 0.8,

      /**
       * Y SI FALLA, PAGA. Un segundo largo sin poder hacer nada, a la vista.
       * Está calibrado contra el arma inicial: con el Colt (fireRate 0,40) son
       * dos tiros y medio seguros — un cuarto de su vida por haberlo leído
       * bien. Si esto fuera más corto, esquivar no tendría premio y la
       * embestida sería sólo castigo.
       */
      aturdidoAlFallar: 1.1,

      cooldown: 7.0,

      /**
       * LE PEGASTE: TE EMBISTE. Su respuesta a que le tires.
       *
       * *(Santi: "es MUY FÁCIL matarlo" — y midiendo, la cobertura sola no
       * alcanzaba a arreglarlo)*
       *
       * El problema medido no era que se cubriera mal: era ARITMÉTICA. El Colt
       * dispara cada 0,40 s, el jefe tiene 4 de vida (el techo del juego, que
       * no se toca), así que **cuatro balazos seguidos son 1,2 segundos** y no
       * hay IA que sobreviva a eso. Medido con el jugador abriendo fuego apenas
       * lo ve: muerto en 1,9 s, sin llegar a cubrirse una sola vez.
       *
       * La respuesta no podía ser más vida ni mejor cobertura: tenía que ser
       * **romperle al jugador la posibilidad de tirar cuatro veces seguidas**.
       * Por eso, un impacto le destraba la embestida al instante (`0,3 s` en
       * vez de esperar los 7 de siempre) siempre que estés a distancia de
       * carga.
       *
       * Y eso convierte la pelea en un ciclo de jefe de verdad: le pegás, te
       * carga, tenés que dejar de disparar y esquivar — y si la esquivás,
       * queda aturdido y ahí sí le pegás gratis. El castigo por dispararle es
       * lo que le da ritmo a todo, y sale de un movimiento que ya existía en
       * vez de un número nuevo.
       */
      cooldownTrasGolpe: 0.3,
      /**
       * Si te tiene parapetado y no consigue tiro, no espera el cooldown
       * entero: la embestida es justamente su respuesta a que te escondas. Es
       * el mismo espíritu que la dinamita de los guardias del blindado
       * (`consideraTirarDinamita` en systems/ai.js) — el jefe tiene una
       * herramienta para castigar quedarse quieto detrás de un asiento.
       */
      cooldownSiEstasCubierto: 3.0,

      /**
       * ROMPE PUERTAS CERRADAS AL CHOCAR — la de chapa del blindado (el único
       * del juego además de la dinamita) y también las que él mismo traba al
       * despertar (ver `trabarPuertasDelTren` en raidScene.js): no se
       * encierra con sus propias puertas.
       *
       * Contra la del blindado tiene una consecuencia que juega a tu favor:
       * queda rota PARA SIEMPRE (igual que si la hubieras volado vos), así que
       * si lo llevás hasta ahí te está abriendo el vagón más caro del tren. No
       * es un regalo: para aprovecharlo tenés que sobrevivirlo adentro, que es
       * donde están los guardias que más aguantan.
       */
      rompePuertaBlindada: true,

      ruido: 260,           // el porrazo se oye (px de radio)
    },

    /**
     * LA FASE DE FURIA — a la mitad de la vida, se pone serio.
     *
     * Se dispara UNA sola vez, al cruzar `mitad` por primera vez. Lo único que
     * cambia son los COOLDOWNS: hace las mismas cosas, más seguido. Los
     * tiempos de AVISO no se tocan nunca — un jefe que deja de telegrafiar es
     * un jefe que se volvió injusto, y este juego no tiene un solo peligro que
     * no se pueda ver venir.
     *
     * `invulnerable` existe para que el cambio de fase no se sienta barato: si
     * el destello y el grito pasaran mientras le seguís metiendo balas, el
     * momento se perdería. Medio segundo es lo justo para que se lea.
     */
    furia: {
      // La mitad de `health`. Si se toca la vida, hay que tocar esto: es la
      // mitad real, no un número suelto.
      mitad: 4,
      invulnerable: 0.5,
      embestidaCooldown: 4.5,      // contra 7,0
      disparoMult: 0.75,           // 25% más seguido
      empujeMult: 1.15,
    },

    /**
     * QUÉ TE DEJA MATARLO.
     *
     * `bajaBountyFrac` — se lleva un tercio largo de tu recompensa acumulada,
     * proporcional y no un número fijo: así vale lo mismo matarlo recién
     * cruzado el umbral (900 → −315) que estando al borde de la horca (1150 →
     * −402). Un descuento fijo se volvería insignificante justo cuando más lo
     * necesitás.
     *
     * Y ES LA ÚNICA FORMA DE BAJAR LA RECOMPENSA SIN PASAR POR LA CÁRCEL. Eso
     * es lo que lo convierte en una decisión y no en un obstáculo: podés
     * escaparle todo el asalto (es lo seguro) o podés ir a buscarlo, que es lo
     * único que te saca del camino a la horca sin entregarte.
     *
     * `sumaFama` — y acá `fame` empieza a existir de verdad. Estaba en
     * `gameState` desde la fase 1 y NADA en todo el juego la movía nunca. El
     * primer tipo que la mueve tenía que ser éste: la fama es cuánto te
     * conocen, y matar al que vino a cobrar tu cabeza es exactamente la clase
     * de cosa que se cuenta en una cantina.
     */
    premio: {
      bajaBountyFrac: 0.35,
      sumaFama: 150,
    },

    /**
     * NO CUENTA COMO UN MUERTO MÁS. Matar al tipo que vino a cobrar tu
     * recompensa no puede SUBIRTE la recompensa (`bounty.pesoGuardia`): la
     * respuesta a esa pregunta ya es `premio`, y las dos cosas juntas se
     * anularían entre sí sin que el jugador entienda por qué.
     */
    cuentaComoKill: false,

    /**
     * Se instancia con `createBoss` (entities/boss.js): tiene vida propia por
     * encima del techo, embestida, furia y su propia máquina de estados. El
     * Sheriff, en cambio, nace como un guardia común — ver `spawnComo` en su
     * entrada, más abajo.
     */
    spawnComo: 'jefe',

    color: '#b8543a',
  },

  /**
   * EL SHERIFF — el opuesto del Cazarrecompensas en todo lo que importa.
   *
   * Aquél te caza a vos y su pelea es un duelo; éste **no pelea con vos en
   * absoluto**. Es seguridad del tren, viaja con la escolta, y su gracia no
   * está en lo que te hace de frente sino en lo que le hace al RESTO del tren
   * mientras siga vivo: los guardias que lo rodean pelean mejor, y tu propia
   * arma hace más ruido del que debería.
   *
   * Y NO SE DEFIENDE: se repliega. Apenas suena la alarma sale hacia la
   * locomotora y no vuelve a pelear nunca. Lo difícil no es matarlo —aguanta
   * lo mismo que cualquier guardia— es LLEGAR: cada vagón que avanzás
   * persiguiéndolo es un vagón más lejos de tu caballo, con su escolta
   * encima y con los guardias de ese vagón ya despiertos.
   *
   * **El precio se paga en distancia hasta la salida**, que es la moneda real
   * de este juego desde la fase 2. Por eso no necesita ni vida extra ni
   * movimientos de firma: la presión ya estaba construida en la geografía del
   * tren, y él sólo la usa.
   */
  sheriff: {
    id: 'sheriff',
    name: 'El Sheriff',
    short: 'SHERIFF',

    /**
     * APARECE EN UNA BANDA, Y NO SIEMPRE — decisión de Santi.
     *
     * Entre 600 y 899 de recompensa hay un `probabilidad` de que suba a tu
     * próximo tren estándar. Arriba de 900 ya no aparece: ahí empieza la
     * banda del Cazarrecompensas, y las dos NO se superponen a propósito —
     * nunca hay ambigüedad sobre cuál de los dos te tocó, ni riesgo de
     * comerte los dos juntos.
     *
     * Que sea probabilidad y no un umbral duro fue lo que pidió Santi, y
     * mejora el sistema: un umbral fijo se aprende una vez y después es un
     * trámite ("a partir de X aparece"). Una probabilidad hace que subir a
     * un tren estándar en esa banda sea una apuesta cada vez.
     *
     * Con 40%, en los ~300 puntos de recompensa que dura la banda te lo vas
     * a cruzar un par de veces antes de que aparezca el Cazarrecompensas:
     * suficiente para conocerlo y aprender a leerlo, no tanto como para que
     * se sienta obligatorio.
     *
     * Y va al ESTÁNDAR, no al veloz (que fue la primera idea): el veloz ya es
     * caos con los barriles y el traqueteo, y meterle un jefe encima era
     * apilar dos sistemas de presión que no se hablan entre sí.
     */
    bountyMinimo: 600,
    bountyMaximo: 899,
    probabilidad: 0.40,
    soloEnTipos: ['estandar'],

    /**
     * NACE COMO UN GUARDIA COMÚN (`createEnemy`), no como un jefe.
     *
     * No es una decisión de implementación, es el diseño: "solo es apenas un
     * guardia". Aguanta lo que aguanta cualquier guardia del tren en esa
     * dificultad (2 ó 3 balazos, ver `guardHealth` en data/guards.js) y el
     * techo de 4 se respeta sin excepción — la excepción del Cazarrecompensas
     * no se contagia.
     */
    spawnComo: 'guardia',
    tipoDeGuardia: 'sheriff',

    /**
     * SE REPLIEGA A 64 px/s, más rápido que un guardia (46) y más lento que
     * vos (78). El número está elegido para que perseguirlo SEA posible pero
     * CUESTE: lo alcanzás, pero tardás — y cada segundo que tardás es un
     * segundo más lejos del caballo, con su escolta de por medio.
     *
     * Más rápido que vos sería imposible de alcanzar (y entonces el premio no
     * existiría); a velocidad de guardia lo atropellás en dos pasos y toda la
     * idea de "lo difícil es llegar" se cae.
     */
    velocidadRepliegue: 64,

    /**
     * LOS TRES QUE NO SE LE DESPEGAN — pedido explícito de Santi ("unos tres
     * guardias junto a él; donde él vaya, ellos van").
     *
     * No es una IA de formación nueva: son guardias normales cuya RONDA, en
     * vez de ser un camino fijo del vagón, es él. Todo lo demás (ver, sospechar,
     * cubrirse, disparar) sigue siendo la IA de guardia de siempre.
     *
     * Y se suman a los guardias propios de cada vagón que crucen, que ya
     * estaban ahí: perseguirlo no te enfrenta a tres tipos, te enfrenta a tres
     * MÁS los que ya vivían en ese vagón.
     */
    escolta: {
      cantidad: 3,
      /** A qué distancia lo rodean. Corto: es una escolta, no una patrulla. */
      radio: 26,
    },

    /**
     * LOS DE SU VAGÓN PELEAN MEJOR — y acá no hubo que inventar los números.
     *
     * Son exactamente los de `DIFICULTADES.dura.aiOverrides` (data/train.js):
     * la dificultad "Alta vigilancia", que estaba CONSTRUIDA Y APAGADA desde
     * que se hicieron los tipos de tren (`peso: 0`, nunca sale sorteada).
     * Mejor puntería, menos tiempo de reacción, más velocidad de sospecha y
     * se asoman más seguido.
     *
     * Que el primer uso real de ese sistema sea éste es casi mejor que
     * haberlo sorteado: en vez de un tren que "viene difícil" sin motivo
     * visible, hay un tipo con una estrella en el pecho al que le podés ver
     * la causa y matarla.
     *
     * SÓLO SU VAGÓN, y por eso importa que se repliegue: el aura se mueve con
     * él. El vagón donde está es el peor del tren, y cambia.
     */
    auraDificultad: 'dura',

    /**
     * MIENTRAS VIVA, TU ARMA HACE MÁS RUIDO DEL QUE DEBERÍA.
     *
     * Un vagón más de alcance en cada disparo tuyo (encima de lo que ya dice
     * el arma y el tipo de tren). No te suma enemigos: **te los despierta más
     * atrás**, o sea más lejos en tu camino de vuelta — la misma moneda con la
     * que el juego cobra el ruido desde la fase 2.
     *
     * Es la pieza que hace que valga la pena matarlo aunque no te esté
     * disparando: no lo matás porque sea peligroso, lo matás porque hace que
     * TODO lo demás sea peor.
     */
    ruidoExtraVagones: 1,

    /**
     * Y MATARLO SÓLO DA FAMA — nada de recompensa.
     *
     * Es la diferencia de fondo con el Cazarrecompensas: aquél viene por tu
     * cabeza, así que bajarle la ficha a la ley tiene sentido. El Sheriff no
     * tiene nada que ver con tu recompensa — es seguridad de la compañía. Que
     * te la bajara sería premiarte por matar a un tipo que ni siquiera venía
     * por vos.
     *
     * El premio de verdad es mecánico y se siente al instante: los guardias
     * vuelven a pelear normal y tu arma vuelve a sonar lo de siempre.
     */
    premio: {
      bajaBountyFrac: 0,
      sumaFama: 100,
    },

    /**
     * SÍ cuenta como un muerto más (a diferencia del Cazarrecompensas): es un
     * hombre de la ley al que mataste durante un asalto con la alarma sonando,
     * exactamente el caso que `bounty.pesoGuardia` cobra desde siempre. No hay
     * ningún premio que se le anule, así que no hay motivo para exceptuarlo.
     */
    cuentaComoKill: true,

    color: '#c9a227',
  },
};

/**
 * ¿Sube algún mini jefe a este tren?
 *
 * Se pregunta UNA vez, al armar el asalto, con la recompensa que ya traías
 * (igual que `maxJinetesPara` en data/riders.js). No cambia durante el asalto:
 * subir la recompensa robando no hace aparecer a nadie a mitad de camino.
 *
 * Cada jefe declara su BANDA (`bountyMinimo`/`bountyMaximo`) y, si no es
 * seguro, su `probabilidad`. Las bandas no se superponen a propósito: 600-899
 * es del Sheriff (al 40%) y 900+ del Cazarrecompensas (siempre), así que nunca
 * pueden tocarte los dos en el mismo tren.
 */
export function jefeParaEsteAsalto(bounty, tipoTrenId, rng = null) {
  for (const jefe of Object.values(BOSSES)) {
    if (bounty < jefe.bountyMinimo) continue;
    if (jefe.bountyMaximo !== undefined && bounty > jefe.bountyMaximo) continue;
    if (jefe.soloEnTipos && !jefe.soloEnTipos.includes(tipoTrenId)) continue;

    // Sin `probabilidad`, aparece siempre que se cumpla la banda.
    if (jefe.probabilidad !== undefined) {
      // Sin rng (llamadas de prueba desde la consola) se toma como que salió:
      // es más útil poder forzarlo a mano que hacerlo indeterminado.
      if (rng && rng.range(0, 1) > jefe.probabilidad) continue;
    }
    return jefe;
  }
  return null;
}
