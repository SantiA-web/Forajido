/**
 * Todos los textos visibles del juego, en un solo lugar.
 * El código nunca escribe una frase directamente: siempre pide T.algo
 */

export const T = {
  hud: {
    money: (n) => `$${n}`,

    /** LA MOCHILA ([TAB]) — ver `drawMochila` en scenes/raidScene.js. */
    mochilaTitulo: 'LA MOCHILA',
    mochilaVacia: 'Nada más adentro.',
    mochilaDinamita: (n) => (n === 1 ? 'Un cartucho de dinamita  ·  1' : `${n} cartuchos de dinamita  ·  ${n}`),
    /**
     * La ayuda son DOS renglones desde que la mochila se maneja con el mouse:
     * arriba el mouse (que es lo nuevo y lo que más se usa), abajo el teclado
     * —que sigue funcionando igual— y la advertencia, que es lo más importante
     * de todo: revolver la bolsa no detiene el tren ni a los guardias.
     *
     * En un renglón no entraban: la línea vieja ya medía casi el ancho de la
     * pantalla con tres atajos, y ahora hay cinco.
     */
    mochilaAyuda: '[ARRASTRAR] ACOMODAR     [RUEDA] GIRAR     [CLIC DER.] TIRAR',
    mochilaAyuda2: '[W A S D] ELEGIR   [E] SOLTAR   [TAB] CERRAR   el tren no te espera',
    mochilaSoltado: (que) => `Soltás ${que.toLowerCase()}`,
    mochilaNoSeSuelta: 'La dinamita no se suelta: se tira',
    /**
     * EL PRECIO AL PASAR EL MOUSE POR ENCIMA. Dice "base" a propósito: el
     * perista lo duplica si la mercadería salió limpia y lo mueve un ±20% según
     * tu nombre, y nada de eso se sabe todavía adentro del tren.
     */
    mochilaPrecioBase: (nombre, valor) => `${nombre}  ·  base $${valor}`,
    mochilaCartucho: 'Cartucho de dinamita  ·  no se vende',
    reloading: 'RECARGANDO',
    alarm: 'ALARMA',

    /**
     * "LIMPIO": que nadie haya dado la voz todavía.
     *
     * El doble de botín por salir sin alarma (`raid.cleanBonus`) existía desde
     * hace rato y era INVISIBLE: sólo se enteraba uno en la pantalla de
     * resultados. Con esto la racha se ve mientras jugás, que es cuando sirve
     * para decidir — y hace que perderla se sienta como perder algo.
     */
    limpio: 'LIMPIO',
    lastre: (pct) => `CARGADO −${pct}%`,
    cover: 'A CUBIERTO',
    sneak: 'AGACHADO',
    wagon: (n) => `VAGÓN ${n}`,
    dynamite: (n) => `DINAMITA ${n}`,
    toExit: (n) => (n === 0 ? 'SALIDA' : `SALIDA: ${n} ${n === 1 ? 'VAGÓN' : 'VAGONES'}`),
  },

  prompts: {
    loot: (name) => `[E] ${name}`,
    jackpot: (valor) => `¡EL GOLPE DE TU VIDA! +$${valor}`,
    threaten: '[E] AMENAZAR',
    escape: '[E] ESCAPAR',
    empty: 'SIN BALAS  [R]',
    peek: '[CLIC DER.] ASOMARSE',
    reinforcementEngine: 'VIENEN DE LA LOCOMOTORA',
    yaTeVieron: 'TE VIERON SUBIR',
    trenAlerta: 'YA ESTABAN SOBRE AVISO',
    caisteMal: 'TE OYERON CAER',
    cola: 'TU CABALLO',
    coupling: 'AL AIRE LIBRE',
    boom: '¡PUM!',
    riders: 'LA LEY, AFUERA',
    cazador: 'ALGUIEN SUBIÓ POR TU CABEZA',
    cazadorViene: 'TE DEJÓ DE MIRAR. AHORA VIENE',
    trenCerrado: 'LAS PUERTAS SE TRABARON',
    cazadorMuerto: 'SE ACABÓ EL CAZADOR',
    // No lo mataste vos: cayó en el tiroteo. Deja de perseguirte, pero la ley
    // no te perdona nada por eso (ver el premio en data/bosses.js).
    cazadorCayo: 'EL CAZADOR CAYÓ EN EL TIROTEO',
    cazadorFuria: '¡SE PUSO SERIO!',
    sheriffMuerto: 'CAYÓ EL SHERIFF',
    seRinde: '¡NO DISPARE!',
    sheriffSeVa: 'EL SHERIFF SE REPLIEGA',
    fuseLit: 'MECHA ENCENDIDA',
    noDynamite: 'SIN DINAMITA',
    techo: 'EN EL TECHO',
    bajar: '[E] BAJAR',
    treparCarbon: '[E] TREPAR AL CARBÓN',
    caisteDelTecho: '¡EL CARTEL! TE VIERON CAER',
    caisteAlEnganche: 'NO LLEGASTE AL OTRO TECHO',
    techoAyuda: '[SHIFT] AGACHARSE   [ESPACIO] SALTAR',
    teLlevoPuesto: '¡TE LLEVÓ PUESTO!',
    tranquera: '[E] ABRIR EL CORRAL',
    tranqueraAbierta: '¡SE SUELTA EL GANADO!',

    /**
     * EL CAJÓN DE PÓLVORA (Fase 6a, el vagón de armas).
     *
     * "UN CARTUCHO", en singular, y no "dinamita": es exactamente lo que te
     * llevás — uno — y el jugador ya cuenta cartuchos en el HUD. Y el aviso de
     * lleno dice POR QUÉ no pasa nada, en vez de no decir nada: el cartel
     * sobre tu cabeza siempre tiene que decir qué hace la [E] justo ahora,
     * incluso cuando la respuesta es "nada".
     */
    cartucho: '[E] AGARRAR UN CARTUCHO',
    cartuchoLleno: 'NO TE ENTRA OTRO CARTUCHO',
    cartuchoTomado: '+1 DINAMITA',
    /**
     * PÓLVORA SUELTA: explota igual, pero no hay nada que guardarse.
     *
     * *(Santi: "no siempre vas a poder sacar un trozo de dinamita de un barril.
     * Al acercarte te vas a dar cuenta de si se puede o no")* — esto es el "al
     * acercarte". El dibujo ya lo dice (no le asoman los cartuchos por la
     * tapa), pero el cartel tiene que decir SIEMPRE qué hace la [E] ahora
     * mismo, aunque la respuesta sea "nada", igual que `cartuchoLleno`.
     *
     * Y nombra la pólvora a propósito: sin eso, un barril sin cartucho se
     * leería como uno ya vaciado, y son cosas muy distintas — éste todavía
     * vuela por los aires.
     */
    cajonSinCartucho: 'PÓLVORA SUELTA · NADA QUE LLEVARSE',
    // Empujar el cajón: sale rodando hacia la cola, y a veces salta al vagón
    // de al lado en vez de caerse en la pasarela.
    empujarCajon: '[F] EMPUJAR EL CAJÓN',
    cajonCruza: '¡SALTÓ AL OTRO VAGÓN!',

    trenAcelera: '¡EL TREN ACELERA!',
    trenFrena: '¡FRENA DE GOLPE!',
  },

  /**
   * TEXTO SUELTO, DE AMBIENTE — no le habla al jugador, es lo que el jugador
   * ALCANZA A OÍR de algo que no es para él. Por eso las frases están
   * cortadas a propósito, no son oraciones enteras: es la mitad de una
   * charla ajena, no un cartel.
   */
  ambiente: {
    /**
     * LA CHARLA DE LOS GUARDIAS "CONVERSANDO" (Fase 3, data/modifiers.js).
     *
     * *(pedido de Santi: "debería aparecer el diálogo entre ellos, pero que
     * sea medio cortado, no tan explícito")*
     *
     * Todas arrancan Y terminan con puntos suspensivos, a propósito: ni el
     * principio ni el final de la frase son tuyos, sólo pasaste al lado en
     * el momento justo para agarrar el medio.
     */
    charla: [
      '...y yo le dije que ni loco...',
      '...la paga es una miseria, pero...',
      '...si el jefe se entera, nos cuelga...',
      '...mejor no hablemos de eso acá...',
      '...te juro que lo vi con mis ojos...',
      '...desde lo del año pasado no confío...',
      '...eso mismo pensé yo, pero...',
      '...ni una palabra de esto, ¿eh?...',
    ],

    /**
     * LA CHARLA DE LOS GUARDIAS DE FRANCO (vagón de guardias): la misma idea,
     * pero sobre la mesa de cartas.
     */
    charlaCartas: [
      '...subo dos pesos y...',
      '...ese as no estaba en el mazo...',
      '...barajá vos, que yo no confío...',
      '...otra mano y me acuesto...',
      '...full de reyes, pagá...',
      '...con esta paga ni para apostar...',
    ],

    /**
     * EL GUARDIA "VIGILANDO PUERTA" O "VIGILANDO CAJA" (Fase 3) — a
     * diferencia de la charla (dos puntas, de a ratos), esto es un ESTADO,
     * no una frase suelta: se muestra fijo todo el tiempo que dure, igual
     * que "AGACHADO" o "A CUBIERTO" en el HUD (ver `T.hud`).
     *
     * *(Santi: "quiero que encima de los guardias que vigilan una puerta o
     * una caja fuerte, diga 'vigilando'")*
     */
    vigilando: 'VIGILANDO',

    /**
     * EL CIVIL ENCUBIERTO, cuando termina de sacar el arma (Fase 4).
     *
     * Aparece UNA vez, en el momento exacto en que deja de ser un pasajero.
     * No es una etiqueta permanente como "VIGILANDO": de ahí en adelante es
     * un guardia y se lee como cualquier otro (rojo, arma en la mano). Lo que
     * este cartelito explica es el cambio, no el estado — sin él, un pasajero
     * que de golpe te dispara se leería como un error del juego.
     */
    encubierto: '¡ERA DE LA LEY!',

    /**
     * EL PASAJERO CANTÓ DÓNDE ESTÁ LA CAJA (Fase 5, ver data/paquetes.js).
     *
     * Sale sobre la CAJA, no sobre el pasajero: lo que hay que aprender de
     * ese momento es el lugar, no quién habló. Y dura más que un floater
     * normal (2,6 s) porque es una instrucción, no una celebración — tenés
     * que llegar a leer dónde apareció mientras seguís mirando el pasillo.
     */
    /**
     * LA PISTA QUE SUELTA UN PASAJERO AMENAZADO (Fase 5, data/paquetes.js).
     *
     * *(Santi: "una vez amenazado un civil de alguno de estos tres que el
     * tren aleatorizará, dirá dónde está la caja fuerte diciendo una de estas
     * cuatro pistas")*
     *
     * Dice VAGÓN y ESCONDITE, y nada más: no marca la caja en pantalla. El
     * número de vagón es el mismo que el HUD ya te muestra arriba, así que la
     * pista se lee contra algo que ya sabés leer — y el escondite te dice qué
     * mirar cuando llegues, que es la mitad del trabajo.
     *
     * Es la única vez que este juego te da una instrucción escrita, y se lo
     * permite por un motivo: es una PERSONA hablándote, no la interfaz
     * explicándote. Lo que se puede mostrar se sigue sin escribir — la caja no
     * se dibuja hasta que la encontrás.
     */
    cajaDelatada: '¡LA CAJA!',
    pistaCaja: (vagon, donde) => `VAGÓN ${vagon}: ${donde}`,
    escondites: {
      ventana: 'DEBAJO DE UNA VENTANA',
      asiento: 'DEBAJO DE UN ASIENTO',
      mesa: 'DEBAJO DE UNA MESA',
      corral: 'JUNTO AL CORRAL',
      // Fase 6a: el vagón de armas. El mejor escondite del tren, y el único
      // donde encontrarla puede costarte el vagón entero.
      cajones: 'ENTRE LOS CAJONES',
    },
  },

  /** La huida: los jinetes que quedaban te siguen al escapar (scenes/huidaScene.js). */
  huida: {
    teSiguen: (n) => (n === 1 ? '¡UN JINETE TE SIGUE!' : `¡${n} JINETES TE SIGUEN!`),
    losPerdiste: 'LOS PERDISTE',
    /** El cartel de llegada lo pone el destino (ver world/destinos.js). */
    rumbo: (lugar) => `RUMBO A ${lugar}`,
    pared: '¡LA PARED! ¡BUSCÁ LA ENTRADA!',
    todosCaidos: 'NO QUEDÓ NINGUNO',
    derribado: '¡ABAJO!',
    sinPlata: 'NO TE QUEDA NADA QUE SOLTAR',
    bolsas: (n) => (n === 1 ? 'soltaste 1 bolsa' : `soltaste ${n} bolsas`),
    recargando: 'RECARGANDO',
    /**
     * La inicial de cada refugio en la brújula. Desde que cada uno tiene su
     * terreno (piedras en el bosque, campo limpio en el río, la entrada
     * escondida en la quebrada), saber cuál es cuál es parte de elegir.
     */
    brujula: { quebrada: 'Q', rio: 'R', bosque: 'B' },
    seQuedo: 'SE QUEDÓ ATRÁS',
    /** El caballo se quedó sin fondo: cae al paso hasta que se repone. */
    reventado: '¡EL CABALLO NO DA MÁS!',
    repuesto: 'EL CABALLO SE REPUSO',
    /** El forcejeo: un jinete se te colgó a la par. */
    forcejeo: '¡TE AGARRÓ!',
    forcejeoGolpes: '[E] [E] [E]',
    forcejeoSolto: 'TE SOLTÓ',
    forcejeoChoque: 'LOS SEPARÓ EL GOLPE',
    forcejeoEnvion: 'TE LO SACASTE DE ENCIMA',
    loTiraste: '¡LO TIRASTE DEL CABALLO!',
    aflojan: 'SUS CABALLOS ESTÁN AFLOJANDO',
    atajo: (arma) => `PRUEBA · [1] HUIDA CON CRIOLLO · [2] CON MUSTANG · [3] ARMA: ${arma}`,
    teclas: ['[W A S D] GALOPAR   [ESPACIO] ENVIÓN   [SHIFT] FRENAR', '[CLIC] TIRAR   [R] RECARGAR   [E] ZAFAR'],
  },

  ride: {
    title: 'ALCANZANDO EL TREN',
    reloj: (s) => `${s}s`,
    aguante: 'CABALLO',
    help: 'El caballo queda donde saltes: es tu única salida.',
    keys: '[D] GALOPAR   [A] AFLOJAR   [W/S] ACERCARTE   [ESPACIO] SALTAR',
    fallaste: '¡NO HABÍA DÓNDE AGARRARSE!',
    lejos: '¡DEMASIADO LEJOS PARA SALTAR!',
    choque: '¡LA PIEDRA!',
    teVieron: '¡TE VIERON DESDE LA VENTANILLA!',
    alarmaAviso: 'VAS A ENTRAR CON LA ALARMA SONANDO',
    teDieron: '¡TE DIERON!',
    malherido: '¡ESTÁS MALHERIDO!',
    saltoLimpio: '¡LIMPIO!',
    saltoSucio: 'CAÍSTE A LOS TUMBOS',
    barraAyuda: '[ESPACIO] EN EL VERDE',
    subiste: (n) => (n === 1 ? 'SUBISTE POR LA COLA' : `SUBISTE ENTRE EL ${n - 1} Y EL ${n}`),
  },

  camp: {
    title: 'EL CAMPAMENTO',
    keys: '[W A S D] MOVERSE     [E] USAR     [ALT+ENTER] PANTALLA COMPLETA',
    lejos: 'MEJOR NO ALEJARSE DE LA FOGATA',

    // Lo que dice el cartel sobre tu cabeza cuando estás al lado de cada cosa.
    prompts: {
      fogata: '[E] SENTARSE',
      fogataDe: '[E] LEVANTARSE',
      carpa: '[E] DORMIR',
      cajon: '[E] REVOLVER EL CAJÓN',
      // El caballo es lo único del campamento con DOS verbos: atenderlo y
      // montarlo. Por eso su cartel lleva dos líneas y no una.
      poste: '[E] ATENDER EL CABALLO',
      posteF: '[F] IR AL PUEBLO',
      cartel: '[E] RUTAS DE LA REGIÓN',
      carpaDia: '[E] DORMIR HASTA LA NOCHE',
      carpaNoche: '[E] DORMIR HASTA EL AMANECER',
    },

    // Y lo que contesta al usarla. Los que todavía no tienen sistema detrás
    // dicen lo que hoy SÍ se puede saber, en vez de no hacer nada.
    /**
     * LA FOGATA TE CUENTA CÓMO ESTÁS PARADO — fama y honor, los dos números
     * que hoy no se ven en ningún otro lado fuera de la pantalla de
     * resultados. No hace falta ir a buscarlos: sentarte ya te los dice.
     */
    fogataSentado: (fama, honor) => {
      const palabra = honor >= 30 ? 'te respetan'
        : honor > 0 ? 'confían en vos'
        : honor === 0 ? 'no saben qué pensar de vos'
        : honor > -30 ? 'desconfían de vos'
        : 'te temen';
      const signo = honor >= 0 ? '+' : '';
      return `Junto al fuego: fama ${fama}, honor ${signo}${honor} (${palabra}).`;
    },
    fogataParado: 'Te levantás.',
    amanece: 'Dormís hasta que sale el sol. El pueblo abre.',
    anochece: 'Dormís hasta que cae la noche. El establo y la armería cierran.',
    cajon: (arma, dinamita) => `${arma} · ${dinamita} cartuchos de dinamita`,
    /**
     * Los títulos de los dos menús del campamento. Son preguntas del lugar, no
     * de una persona: en el pueblo te pregunta el armero, acá revolvés vos.
     */
    cajonTitulo: '¿Con qué salís?',
    cajonVacio: 'No hay nada más en el cajón.',
    posteTitulo: '¿Qué hacés con el caballo?',
    posteComer: 'DARLE DE COMER',
    poste: (caballo) => `Le das de comer al ${caballo}. Queda tranquilo.`,
    posteMontar: 'Montás y salís para el pueblo.',
    cartelIr: 'Vas a ver qué trenes pasan por la región.',
  },

  pueblo: {
    title: 'EL PUEBLO',
    keys: '[W A S D] MOVERSE     [E] HABLAR / ENTRAR     [F] VOLVER',

    // Los carteles de las fachadas.
    letreros: {
      establo: 'ESTABLO',
      armeria: 'ARMERÍA',
      cantina: 'CANTINA',
      sheriff: 'SHERIFF',
      /**
       * No dice "PERISTA" ni "COMPRO ROBADO": dice lo que diría un cartel de
       * verdad. Lo que el local es de verdad lo entendés adentro, y eso es
       * exactamente lo informal.
       */
      perista: 'EMPEÑOS',
    },

    prompts: {
      establo: '[E] ESTABLO',
      armeria: '[E] ARMERÍA',
      cantina: '[E] CANTINA',
      sheriff: '[E] OFICINA DEL SHERIFF',
      /**
       * Corto a propósito: este local es la ÚLTIMA puerta de la calle, así que
       * el cartel sobre la cabeza del jugador se dibuja casi contra el borde de
       * la pantalla. Con "[E] CASA DE EMPEÑOS" se salía del cuadro — se vio
       * mirándolo, no midiendo. Y de paso dice lo mismo que la fachada.
       */
      perista: '[E] EMPEÑOS',
      caballo: '[F] VOLVER AL CAMPAMENTO',
      viejo: '[E] HABLAR',
      mujer: '[E] HABLAR',
      borracho: '[E] HABLAR',
      chico: '[E] HABLAR',
    },

    /**
     * Las puertas todavía no venden nada, así que en vez de no hacer nada
     * dicen QUÉ van a vender. Un lugar que anuncia lo que va a ser se lee
     * como un pueblo en obra; uno mudo se lee como un error.
     */
    puertas: {
      establo: 'Caballos. Cerrado hasta que haya con qué comprarlos.',
      armeria: 'Rifles y escopetas colgados de la pared. El de adentro no te da bola.',
      cantina: 'Hay gente que busca trabajo. Todavía no podés contratar a nadie.',
      /**
       * La puerta no dice qué se hace adentro. Dice lo justo para que quieras
       * entrar a ver, que es lo que corresponde a un lugar que no se anuncia.
       */
      perista: 'Una puerta angosta y sin vidriera. Adentro hay luz.',
      /**
       * LA CUENTA REGRESIVA, y este es el lugar donde se puede ver ANTES de
       * que sea tarde (en la cárcel ya la ves, pero ahí llegaste). Por eso el
       * texto cambia de tono: informa mientras hay margen, advierte cuando no.
       */
      sheriff: (recompensa, umbral, cerca) => {
        if (recompensa <= 0) return 'La cartelera está llena de caras. Ninguna es la tuya.';
        if (cerca) return `Tu cartel dice $${recompensa}. A los $${umbral} te cuelgan sin fianza.`;
        return `Hay un cartel con tu cara. Dice $${recompensa}.`;
      },
    },

    // La gente. No hacen nada, y son lo que hace que esto sea un pueblo.
    dichos: {
      viejo: '"Antes pasaban tres trenes por semana. Ahora pasan siete."',
      mujer: '"Vos no sos de acá, ¿no?"',
      borracho: '"...y le dije que el oro estaba en el vagón de atrás."',
      chico: '"¿Es verdad que asaltaron el de las seis?"',
    },
    volver: 'Montás y volvés al campamento.',
    cerrado: (lugar) => `${lugar}. Cerrado hasta que amanezca.`,
  },

  interior: {
    salir: '[E] SALIR',
    ayuda: '[W A S D] MOVERSE     [E] USAR     [ESC] SALIR',

    /**
     * HABLARLE A UN VENDEDOR ABRE UNA PREGUNTA, NO UNA FRASE.
     *
     * Los demás personajes sueltan un dicho y listo. El que vende algo te
     * pregunta qué querés, porque es el único con el que la conversación
     * puede TERMINAR EN ALGO. Que la pregunta sea distinta en cada local es
     * lo que evita que los dos se lean como el mismo empleado.
     */
    preguntas: {
      armero: '"¿Qué anda buscando?"',
      caballerizo: '"¿Y? ¿Qué desea?"',
      /**
       * SU PREGUNTA ES LA INVERSA DE LAS OTRAS DOS. Los otros dos te preguntan
       * qué querés llevarte; éste, qué trajiste. Y no dice "vender": dice
       * "traés", que es como se habla cuando lo que se hace no se nombra.
       */
      perista: '"¿Traés algo?"',
    },

    opciones: {
      verArmas: 'COMPRAR UN ARMA',
      verAcero: 'VER ACERO Y FILOS',
      verCaballos: 'COMPRAR UN CABALLO',
      vender: 'MOSTRARLE LO QUE TRAIGO',
      nada: 'NADA, GRACIAS',
    },

    /**
     * EL PRECIO SE DICE DESGLOSADO, y es la única forma de que dos sistemas
     * invisibles se puedan jugar: que la alarma de un asalto que ya terminó
     * siga costándote, y que `honor` tenga un precio.
     *
     * Las dos líneas del medio aparecen sólo si tienen algo que decir: con la
     * mercadería toda caliente no hay bono que mostrar, y con el honor entre
     * −15 y 15 no hay ajuste.
     */
    venta: (t) => {
      const lineas = [];
      lineas.push(t.cantidad === 1
        ? `Mira la única cosa que trajiste. Vale $${t.base}.`
        : `Revisa las ${t.cantidad} cosas del mostrador. Valen $${t.base}.`);
      if (t.bonoLimpio > 0) {
        lineas.push(t.calientes === 0
          ? `"Nadie está buscando esto."   +$${t.bonoLimpio}`
          : `Parte no está marcada.   +$${t.bonoLimpio}`);
      } else if (t.calientes > 0) {
        lineas.push('"Esto lo están buscando." No paga un peso de más.');
      }
      if (t.porHonor > 0) {
        lineas.push(`"Con vos se puede hablar."   +$${t.porHonor}`);
      } else if (t.porHonor < 0) {
        lineas.push(`Te mira, escupe al piso y baja la oferta.   −$${-t.porHonor}`);
      }
      // La última línea es la de más abajo, o sea la que el ojo encuentra
      // primero: el número que de verdad importa.
      lineas.push(`Te paga $${t.total}.`);
      return lineas;
    },

    dialogoAyuda: '[W/S] ELEGIR     [E] ACEPTAR     [ESC] CORTAR',

    prompts: {
      armero: '[E] HABLAR',
      mostradorArmas: '[E] VER LAS ARMAS',
      caballerizo: '[E] HABLAR',
      pesebres: '[E] VER LOS CABALLOS',
      barman: '[E] HABLAR',
      poker: '[E] LA MESA DE PÓKER',
      parroquiano: '[E] HABLAR',
      mesas: '[E] SENTARTE',
      cartelera: '[E] LA CARTELERA',
      ayudante: '[E] HABLAR',
      perista: '[E] HABLAR',
      mostradorEmpenos: '[E] MOSTRAR LO QUE TRAÉS',
      celdas: '[E] LAS CELDAS',
      comensal1: '[E] HABLAR',
      comensal2: '[E] HABLAR',
      jugador1: '[E] HABLAR',
      jugador2: '[E] HABLAR',
    },

    /**
     * Nada de esto vende todavía. En vez de callarse, cada cosa dice qué va a
     * ser: un lugar que anuncia lo que le falta se lee como un pueblo en obra;
     * uno mudo se lee como un error.
     */
    dichos: {
      // Lo que contesta el vendedor cuando le decís que no querés nada. El
      // resto de la conversación ya no vive acá: ver `opciones`, arriba.
      armero: '"Cuando quiera. Fiado no hago, eso sí."',
      caballerizo: '"Como guste. Ahí van a estar."',
      perista: '"Cuando tengas algo, sabés dónde estoy. Y no le digas a nadie."',
      /**
       * Con las manos vacías. No te echa: te avisa qué le interesa — y de paso
       * es donde el juego te dice, sin un tutorial, que lo del tren de carga se
       * vende acá.
       */
      peristaVacio: '"Venís con las manos vacías. Yo compro cosas, no charlas."',
      mostradorEmpenos: 'Una tabla gastada. Acá se apoyan las bolsas.',
      barman: '"Si buscás gente para un trabajo, mirá alrededor."',
      poker: 'Cuatro sillas y una baraja. Nadie reparte todavía.',
      parroquiano: '"A mí no me mires. Yo no vi nada."',
      mesas: 'Te sentás un rato. No hay mucho más que hacer.',
      ayudante: '"El sheriff no está. Y yo no vi tu cara en ningún lado."',
      celdas: 'Vacías. Por ahora.',

      // Los que están sentados: la mitad de por qué la cantina se siente
      // llena. Antes eran figuras mudas; ahora tienen algo para decir.
      comensal1: '"La sopa está fría, pero llena."',
      comensal2: '"No hablo con forasteros. Nada personal."',
      jugador1: '"Envido. Y no me mires así, jugá."',
      jugador2: '"Perdí el sueldo del mes en esta mesa."',

      /** El cartel de "se busca": es donde vive la cuenta regresiva de la horca. */
      cartelera: (recompensa, umbral, cerca) => {
        if (recompensa <= 0) return 'Muchas caras. Ninguna es la tuya, y así conviene.';
        if (cerca) return `Tu cara, y $${recompensa}. A los $${umbral} te cuelgan sin fianza.`;
        return `Ahí está tu cara. Pagan $${recompensa} por ella.`;
      },
    },
  },

  /**
   * LA TIENDA. Casi no tiene texto, y es a propósito: lo que hay que entender
   * acá —cuál es mejor en qué— lo dicen las barras y el dibujo. Lo único que
   * se escribe es lo que no se puede mostrar: el precio y cuál es el tuyo.
   */
  tienda: {
    ayuda: '[A/D] MIRAR     [ESC] VOLVER',
    tuyo: 'EL TUYO',
    precio: (n) => `$${n}`,
    marca: 'la rayita clara es lo que tenés hoy',

    /** El gesto entero: parado frente al que querés, apretás `E` y es tuyo. */
    comprar: (precio) => `[E] COMPRAR $${precio}`,
    comprado: (nombre) => `Ahora el ${nombre} es tuyo.`,
    yaEsTuyo: 'Ya es el tuyo.',
    faltaPlata: (falta) => `Te faltan $${falta}.`,
  },

  mapa: {
    subtitulo: 'RUTAS DEL FERROCARRIL',
    ayuda: 'PASÁ EL CURSOR POR UNA VÍA',
    volver: '[ESC] VOLVER AL CAMPAMENTO',

    // Lo que dice el cartucho de abajo cuando tenés el cursor sobre una vía.
    sinServicio: 'SIN SERVICIO',
    salir: 'CLIC PARA SALIR',
    campamento: 'TU CAMPAMENTO',

    /**
     * LA PRÓXIMA PARADA, que es lo que hace legible todo el sistema.
     *
     * En una parada se vuelve a sortear la escolta; en la terminal cambia el
     * tren entero. Sin decir a dónde va, ver el tren cambiar solo se leería
     * como que el juego hace trampa. Diciéndolo, se puede esperar a propósito.
     */
    paraEn: (lugar) => `PARA EN ${lugar}`,
    vuelveA: (lugar) => `CIERRA VUELTA EN ${lugar}`,
    sigueDeLargo: 'NO PARA EN LA REGIÓN',

    // Las dos vías que entran desde afuera del mapa, cuando no hay ninguno.
    deOtraRegion: 'VIENE DE OTRA REGIÓN',
    sinTrenAhora: 'NINGUNO A LA VISTA',
  },

  /**
   * Lo que queda de la vieja pantalla de abordaje, que la reemplazó el galope
   * (`scenes/rideScene.js`). Era un bloque de veinte frases de las que hoy se
   * usa UNA. Salió a la luz midiendo anchos de texto para la letra nueva: dos
   * de esas frases muertas eran las más largas del juego y no las dibujaba
   * nadie. Se borró el resto.
   */
  boarding: {
    escort: 'ESCOLTA:',
  },

  results: {
    escaped: 'ESCAPASTE',
    capturedTime: 'CAPTURADO',
    capturedDead: 'CAPTURADO',

    subEscaped: 'Llegaste al furgón de cola y saltaste. El caballo estaba ahí.',
    subPrueba: (lo) => `Prueba de la huida con ${lo}. No cuenta para nada.`,
    subTime: 'El tren llegó a la estación con vos adentro.',
    subDead: 'Caíste herido. Te esposaron ahí mismo.',

    loot: 'Botín',
    /**
     * LA MERCADERÍA NO DICE UN PRECIO, DICE CUÁNTAS COSAS SON. Todavía no vale
     * plata: vale lo que te pague el que te la compre.
     */
    objetos: (n) => (n === 1 ? 'Te llevaste 1 cosa' : `Te llevaste ${n} cosas`),
    objetosSinVender: 'Sin vender',
    clean: 'Trabajo limpio',
    racha: (n) => `Racha limpia (${n})`,
    rachaPerdida: (n) => `Se cortó la racha (llevabas ${n})`,
    rescate: 'Casi lo lográs',
    /** La huida: lo que soltaste con los jinetes detrás (ver scenes/huidaScene.js). */
    huida: (n) => (n === 0 ? 'La huida: no te tocaron' : n === 1 ? 'La huida: soltaste 1 bolsa' : `La huida: soltaste ${n} bolsas`),
    huidaJinetes: (n) => (n === 1 ? 'Jinete derribado en la huida' : 'Jinetes derribados en la huida'),
    huidaTirados: (n) => (n === 1 ? 'Jinete que tiraste del caballo' : 'Jinetes que tiraste del caballo'),
    huidaQuebrada: 'Cómo te los sacaste',
    huidaQuebradaSi: (lugar) => `te metiste en ${lugar.toLowerCase()}`,
    /** Los premios de cada refugio (ver data/huida.js, `mundo.premios`). */
    huidaPremioBolsa: (n) => (n === 1
      ? 'Bolsa que rescataste en la quebrada'
      : `Bolsas que rescataste en la quebrada (${n})`),
    huidaPremioBosque: (n) => (n === 1
      ? 'El bosque tapó a tu muerto'
      : `El bosque tapó a tus ${n} muertos`),
    lost: 'Botín que dejaste',
    kills: 'Guardias muertos',
    civilians: 'Civiles muertos',
    alarm: 'Alarma',
    alarmYes: 'sonó',
    alarmNo: 'nunca sonó',
    time: 'Tiempo',
    boarded: 'Subiste al vagón',
    deepest: 'Llegaste hasta el',
    total: 'Dinero total',
    bounty: 'Te identificaron',
    jefe: (nombre) => `Mataste a ${nombre || 'el mini jefe'}`,
    jefeSinRebaja: 'SE ACABÓ',
    fama: 'Se habla de vos',
    bountyTotal: 'Recompensa por tu cabeza',
    honor: 'Cómo te vieron ahí',
    honorTotal: 'Cómo te ven',
    retry: 'VOLVER AL CAMPAMENTO  [R]',

    jailNote: 'Te llevan a prisión.',
    verJail: 'A LA CÁRCEL  [R]',
  },

  prision: {
    titulo: 'LA CÁRCEL',
    tituloHorca: 'LA HORCA',

    // --- Salís ---
    subPago: 'Pagaste la fianza y te soltaron. La ley ya no te busca.',
    subDeuda: 'Les diste todo lo que tenías. No alcanzó, y te lo van a cobrar.',
    subNada: 'No tenías un peso encima. Te soltaron igual, con la deuda a cuestas.',

    deuda: 'Lo que pedían por vos',
    pagado: 'Lo que pagaste',
    restante: 'Lo que seguís debiendo',
    queda: 'Lo que te queda',

    /** El aviso de cuánto falta para la horca. Es la cuenta regresiva. */
    margen: (falta, umbral) => `A los $${umbral} no hay fianza que valga. Te faltan $${falta}.`,
    margenLimpio: (umbral) => `Salís sin deudas. Te cuelgan si alguna vez llegás a los $${umbral}.`,
    salir: 'VOLVER AL CAMPAMENTO  [R]',

    // --- Te cuelgan ---
    subHorca: 'Tu cabeza valía demasiado. No hubo fianza que alcanzara.',
    notaHorca: 'Se termina acá. Otro forajido empezará mañana, con las manos vacías.',
    asaltos: 'Trenes que asaltaste',
    escapes: 'Veces que escapaste',
    muertos: 'Gente que mataste',
    robado: 'Lo que llegaste a juntar',
    deNuevo: 'EMPEZAR DE NUEVO  [R]',
  },
};
