/**
 * Todos los textos visibles del juego, en un solo lugar.
 * El código nunca escribe una frase directamente: siempre pide T.algo
 */

export const T = {
  hud: {
    money: (n) => `$${n}`,
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
    threaten: '[E] AMENAZAR',
    escape: '[E] ESCAPAR',
    empty: 'SIN BALAS  [R]',
    peek: '[CLIC DER.] ASOMARSE',
    reinforcementEngine: 'VIENEN DE LA LOCOMOTORA',
    yaTeVieron: 'TE VIERON SUBIR',
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
    sheriffSeVa: 'EL SHERIFF SE REPLIEGA',
    fuseLit: 'MECHA ENCENDIDA',
    noDynamite: 'SIN DINAMITA',
    techo: 'EN EL TECHO',
    bajar: '[E] BAJAR',
    caisteDelTecho: '¡EL CARTEL! TE VIERON CAER',
    caisteAlEnganche: 'NO LLEGASTE AL OTRO TECHO',
    techoAyuda: '[SHIFT] AGACHARSE   [ESPACIO] SALTAR',
    teLlevoPuesto: '¡TE LLEVÓ PUESTO!',
    tranquera: '[E] ABRIR EL CORRAL',
    tranqueraAbierta: '¡SE SUELTA EL GANADO!',
    trenAcelera: '¡EL TREN ACELERA!',
    trenFrena: '¡FRENA DE GOLPE!',
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
    keys: '[W A S D] MOVERSE     [E] USAR',
    lejos: 'MEJOR NO ALEJARSE DE LA FOGATA',

    // Lo que dice el cartel sobre tu cabeza cuando estás al lado de cada cosa.
    prompts: {
      fogata: '[E] SENTARSE',
      fogataDe: '[E] LEVANTARSE',
      carpa: '[E] DORMIR',
      cajon: '[E] ARMAS Y MUNICIÓN',
      // El caballo es lo único del campamento con DOS verbos: atenderlo y
      // montarlo. Por eso su cartel lleva dos líneas y no una.
      poste: '[E] ALIMENTAR',
      posteF: '[F] IR AL PUEBLO',
      cartel: '[E] RUTAS DE LA REGIÓN',
      carpaDia: '[E] DORMIR HASTA LA NOCHE',
      carpaNoche: '[E] DORMIR HASTA EL AMANECER',
    },

    // Y lo que contesta al usarla. Los que todavía no tienen sistema detrás
    // dicen lo que hoy SÍ se puede saber, en vez de no hacer nada.
    fogataSentado: 'Te sentás al fuego.',
    fogataParado: 'Te levantás.',
    amanece: 'Dormís hasta que sale el sol. El pueblo abre.',
    anochece: 'Dormís hasta que cae la noche. El establo y la armería cierran.',
    cajon: (arma, dinamita) => `${arma} · ${dinamita} cartuchos de dinamita`,
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
    },

    prompts: {
      establo: '[E] ESTABLO',
      armeria: '[E] ARMERÍA',
      cantina: '[E] CANTINA',
      sheriff: '[E] OFICINA DEL SHERIFF',
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
    },

    opciones: {
      verArmas: 'COMPRAR UN ARMA',
      verCaballos: 'COMPRAR UN CABALLO',
      nada: 'NADA, GRACIAS',
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
    subTime: 'El tren llegó a la estación con vos adentro.',
    subDead: 'Caíste herido. Te esposaron ahí mismo.',

    loot: 'Botín',
    clean: 'Trabajo limpio',
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
