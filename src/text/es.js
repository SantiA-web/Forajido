/**
 * Todos los textos visibles del juego, en un solo lugar.
 * El código nunca escribe una frase directamente: siempre pide T.algo
 */
// (✉️ Lo que pide J.Mc. y en cuántos días: los números viven en un solo lugar.)
import { ENCARGO } from '../data/encargo.js';
import { JMC } from '../data/libreta.js';

/** ✉️ Lo que le debes a J.Mc. (ver systems/libreta.js; acá sin importarlo, para no dar la vuelta). */
// 🔥 (Los dos de la fogata de esta noche: "Frank y Santiago".)
const CORTO_FOGATA = { frank: 'Frank', santiago: 'Santiago', tommy: 'Tommy' };
const parDeLaFogata = (g) => { const F = g.campamento.fogata; return `${CORTO_FOGATA[F.a] || F.a} y ${CORTO_FOGATA[F.b] || F.b}`; };
const deudaDe = (g) => (g && g.campamento && g.campamento.jmc && g.campamento.jmc.deuda) || 0;

export const T = {
  /** El cartelito de la prueba del estilo nuevo (engine/estiloNuevo.js). */
  estiloNuevo: 'ESTILO NUEVO, EN PRUEBA · [F9]',
  hud: {
    money: (n) => `$${n}`,

    /** LA MOCHILA ([TAB]) — ver `drawMochila` en scenes/raidScene.js. */
    mochilaTitulo: 'LA MOCHILA',
    mochilaVacia: 'Nada más adentro.',
    mochilaAlforjas: (n, usadas, max, valor) => `En el caballo: ${n} ${n === 1 ? 'cosa' : 'cosas'}  ·  ${usadas}/${max}  ·  $${valor}`,
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
    mochilaSoltado: (que) => `Sueltas ${que.toLowerCase()}`,
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

  /**
   * 🧪 DE PRUEBA (`CONFIG.golpe.pruebaZonas`): en qué zona pegó tu bala. Se
   * saca junto con esa llave.
   */
  pruebaZona: {
    cabeza: 'DISPARASTE A LA CABEZA',
    torso: 'DISPARASTE AL TORSO',
    piernas: 'DISPARASTE A LAS PIERNAS',
    // La bala le pegó sin que lo tuvieras bajo la mira: la zona se sorteó.
    sinBlanco: ' (SIN APUNTARLE)',
    // La puntería la mandó a la zona de al lado.
    querias: (z) => ` (QUERÍAS ${{ cabeza: 'LA CABEZA', torso: 'EL TORSO', piernas: 'LAS PIERNAS' }[z]})`,
  },

  prompts: {
    loot: (name) => `[E] ${name}`,
    jackpot: (valor) => `¡EL GOLPE DE TU VIDA! +$${valor}`,
    threaten: '[E] AMENAZAR',
    // ✉️ Buscar el doble fondo del maletín, en los vagones donde puede ir.
    revisar: '[E] REVISAR',
    escape: '[E] ESCAPAR',
    // Un guardia que vació el arma (ver data/armasGuardia.js).
    recargo: '¡RECARGO!',
    // 🤝 El compañero dice en qué anda (systems/companero.js).
    companeroSigilo: 'en silencio',
    companeroPelea: '¡a los tiros!',
    companeroCae: '¡CAYÓ TU COMPAÑERO!',
    // 📣 Lo que contesta a cada orden ([F] y [V]).
    companeroOrden: {
      voy: '¡voy!', cubro: 'cubro aquí', teSigo: 'te sigo', loRobo: 'lo agarro',
      noEntra: 'no me entra', muyLejos: 'muy lejos', ahiNo: 'ahí no', sinReparo: 'no hay reparo',
      // 🎭 Las formas de ser ([1] [2] [3]): "entendido" al pedírsela, y la nueva cuando cambia.
      entendido: 'entendido…', pasivo: 'ahora, pasivo', agresivo: 'ahora, agresivo', ladron: 'ahora, ladrón',
      // 🎭 El pasajero de la banda.
      abro: 'la abro', abierta: 'abierta', basta: 'ya no puedo arriesgarme', soloEso: 'sólo un guardia o una puerta trabada',
    },
    // La escuadra (ver systems/escuadra.js): uno tira para que el otro avance.
    teCubro: '¡TE CUBRO!',
    avanzo: '¡AVANZO!',
    // El que sale a buscarte un ángulo (systems/escuadra.js, el rodeo).
    teRodeo: '¡TE RODEO!',
    // Lo que se cae o viene por el pasillo en los frenos rotos (systems/peligro.js).
    cuidadoArriba: '¡CUIDADO ARRIBA!',
    seViene: '¡SE VIENE!',
    // Etapa 3 (systems/escuadra.js): el que cuida la vuelta al caballo, y el
    // que te vio cruzar una puerta.
    cuidoSalida: '¡CUIDO LA SALIDA!',
    seFueAtras: '¡SE FUE PARA ATRÁS!',
    seFueAdelante: '¡SE FUE PARA ADELANTE!',
    // El primer guardia que te ve, con poca recompensa (ver CONFIG.rendicion).
    alto: '¡ALTO! ¡MANOS ARRIBA!',
    rendirse: '[H] RENDIRTE',
    alforjas: (usadas, max) => `[E] A LAS ALFORJAS  ${usadas}/${max}`,
    alforjasCargadas: (n, usadas, max) => `${n === 1 ? 'UNA COSA' : `${n} COSAS`} AL CABALLO  ${usadas}/${max}`,
    empty: 'SIN BALAS  [R]',
    peek: '[CLIC DER.] ASOMARSE',
    reinforcementEngine: 'VIENEN DE LA LOCOMOTORA',
    yaTeVieron: 'TE VIERON SUBIR',
    trenAlerta: 'YA ESTABAN SOBRE AVISO',
    frenosRotos: 'ESTE TREN TIENE LOS FRENOS ROTOS',
    aplastado: '¡APLASTADO!',
    teCayoEncima: '¡TE CAYÓ ENCIMA!',
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
    techoAyuda: '[SHIFT] CUERPO A TIERRA   [ESPACIO] SALTAR   [D][D] CORRER',
    perdistePie: '¡PERDISTE PIE!',
    teAgarraste: '¡TE AGARRASTE DEL ALERO!',
    colgadoAyuda: (tecla) => `MANTÉN [${tecla}] PARA SUBIR`,
    teCaisteDelTren: '¡TE CAÍSTE DEL TREN!',
    teQuemaste: '¡TE QUEMASTE!',
    teLlevoPuesto: '¡TE ARROLLÓ!',
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
    empujarCajon: '[E] EMPUJAR EL CAJÓN',
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
      '...mejor no hablemos de eso aquí...',
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
      '...baraja tú, que yo no confío...',
      '...otra mano y me acuesto...',
      '...full de reyes, paga...',
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
    // ✉️ El maletín de J.Mc.: aparece igual que la caja.
    maletinDelatado: '¡EL MALETÍN!',
    // ✉️ 🔁 Ya no aparece al pasar: está en un doble fondo, y revisando el lugar justo sale (o no sale nada).
    dobleFondo: 'TENÍA DOBLE FONDO',
    nadaAqui: 'NADA AQUÍ',
    // 🗞️ Lo que se lee al registrar al encargado (el rumor se cuenta en el campamento).
    hojaDeRuta: 'UNA HOJA DE RUTA',
    papelMaletin: (vagon, donde) => `UN PAPEL: EL MALETÍN, VAGÓN ${vagon}, ${donde}`,
    pistaCaja: (vagon, donde) => `VAGÓN ${vagon}: ${donde}`,
    escondites: {
      ventana: 'DEBAJO DE UNA VENTANA',
      asiento: 'DEBAJO DE UN ASIENTO',
      mesa: 'DEBAJO DE UNA MESA',
      corral: 'JUNTO AL CORRAL',
      // Fase 6a: el vagón de armas. El mejor escondite del tren, y el único
      // donde encontrarla puede costarte el vagón entero.
      cajones: 'ENTRE LOS CAJONES',
      // El caboose (los dos trenes) y los del tren de carga.
      escritorio: 'DEBAJO DEL ESCRITORIO',
      carga: 'ENTRE LA CARGA',
      hielo: 'ENTRE EL HIELO',
      bultos: 'ENTRE LOS BULTOS',
    },
    /** 📜 El papel que encontrás en lo que saqueaste (tren de carga). */
    // Corto, como lo que dicen los pasajeros: largo se salía de la pantalla.
    papelCaja: (vagon, donde) => `UN PAPEL: VAGÓN ${vagon}, ${donde}`,
  },

  /** La huida: los jinetes que quedaban te siguen al escapar (scenes/huidaScene.js). */
  huida: {
    teSiguen: (n) => (n === 1 ? '¡UN JINETE TE SIGUE!' : `¡${n} JINETES TE SIGUEN!`),
    losPerdiste: 'LOS PERDISTE',
    /** El cartel de llegada lo pone el destino (ver world/destinos.js). */
    rumbo: (lugar) => `RUMBO A ${lugar}`,
    pared: '¡LA PARED! ¡BUSCA LA ENTRADA!',
    todosCaidos: 'NO QUEDÓ NINGUNO',
    derribado: '¡ABAJO!',
    // 🎭 La banda en la huida.
    bandaContigo: (nombres) => `${nombres.join(' Y ')} ${nombres.length > 1 ? 'GALOPAN' : 'GALOPA'} CONTIGO`,
    bandaHerido: (nombre) => `¡LE DIERON A ${nombre}!`,
    // 🐎 [F]: se separa y se lleva a la mitad.
    separarAyuda: '[F] QUE SE LLEVE A LA MITAD',
    // 📡 🔭 El del telégrafo y el vigía, que llegan a mitad de la huida.
    llegan: (nombres) => `¡LLEGA${nombres.length > 1 ? 'N' : ''} ${nombres.join(' Y ')}!`,
    seSepara: (nombre, n) => `${nombre} SE LLEVA A ${n === 1 ? 'UNO' : n}`,
    noAlcanza: 'NO HAY A QUIÉN LLEVARSE',
    vuelve: (nombre) => `${nombre} VUELVE`,
    gano: (nombre) => `¡${nombre} SE LOS SACÓ DE ENCIMA!`,
    loSiguen: (nombre, n) => `${nombre}: ${n === 1 ? '1 JINETE' : n + ' JINETES'} DETRÁS`,
    loDejaste: (nombre) => `DEJASTE SOLO A ${nombre}`,
    loAgarraron: (nombre) => `¡AGARRARON A ${nombre}!`,
    escapoHerido: (nombre) => `${nombre} ESCAPA HERIDO`,
    vieneHerido: (nombre) => `¡${nombre} VIENE HERIDO!`,
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

    /** 🪢 El lazo: el aviso, el enganche y las tres formas de zafar. */
    lazoViene: '¡REVOLEA EL LAZO!',
    lazoFallo: 'EL LAZO PASÓ DE LARGO',
    enlazado: '¡TE ENLAZARON!',
    lazoCortado: '¡CORTASTE LA SOGA!',
    lazoChoque: 'LA SOGA SE CORTÓ EN EL GOLPE',
    lazoEnvion: 'EL ENVIÓN TE SOLTÓ',
    lazoSolto: 'SE LE ESCAPÓ LA SOGA',
    lazoTirador: '¡LE PEGASTE Y SOLTÓ!',
    aflojan: 'SUS CABALLOS ESTÁN AFLOJANDO',
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
    // 🗞️ El título del papel con los avisos largos al llegar (ver `avisar` en scenes/campScene.js).
    enElCampamento: 'En el campamento',
    title: 'EL CAMPAMENTO',
    keys: '[W A S D] MOVERSE     [E] USAR     [TAB] LA BANDA     [C] CALENDARIO     [L] EL LIBRO     [ALT+ENTER] PANTALLA COMPLETA',
    lejos: 'MEJOR NO ALEJARSE DE LA FOGATA',
    // 🧪 El atajo de prueba de los guardias (ver campScene.js). Sacarlo con él.
    atajoCorreo: 'PRUEBA · [2] ESCOPETA · [3] WINCHESTER · [4] 1ª CLASE · [5] CUCHILLO · [6] SHERIFF · [7] TORMENTA (SHIFT: HUIDA)',
    atajoArmaSi: (arma) => `PRUEBA: TIENES ${arma}`,
    atajoEscopetaSi: 'PRUEBA: TIENES LA ESCOPETA',
    atajoEscopetaNo: 'PRUEBA: VOLVISTE A TU ARMA',
    atajoCuchilloSi: 'PRUEBA: TIENES EL CUCHILLO',
    atajoCuchilloNo: (arma) => `PRUEBA: VOLVISTE A ${arma}`,
    atajoRecompensa: (n) => `PRUEBA: RECOMPENSA $${n}`,

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
      companero: '[E] HABLAR CON TU COMPAÑERO',
      // 🤠 La banda: "[E] HABLAR CON SANTIAGO".
      miembro: (nombre) => `[E] HABLAR CON ${nombre.toUpperCase()}`,
      // 📅 🔁 La carpa ya no da vuelta el día: abre el papel para descansar o esperar (ver `T.tiempo.carpa`).
      carpaDia: '[E] DESCANSAR',
      // 🔥 Lo que aparece para un momento (ver data/momentos.js).
      carta: '[E] LEER LA CARTA',
      recado: '[E] LEER EL RECADO',
      forastero: '[E] HABLAR CON EL FORASTERO',
      carpaNoche: '[E] DESCANSAR',
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
        : honor > 0 ? 'confían en ti'
        : honor === 0 ? 'no saben qué pensar de ti'
        : honor > -30 ? 'desconfían de ti'
        : 'te temen';
      const signo = honor >= 0 ? '+' : '';
      return `Junto al fuego: fama ${fama}, honor ${signo}${honor} (${palabra}).`;
    },
    fogataParado: 'Te levantas.',
    amanece: 'Duermes hasta que sale el sol. El pueblo abre.',
    anochece: 'Duermes hasta que cae la noche. El establo y la armería cierran.',
    cajon: (arma, dinamita) => `${arma} · ${dinamita} cartuchos de dinamita`,
    /**
     * Los títulos de los dos menús del campamento. Son preguntas del lugar, no
     * de una persona: en el pueblo te pregunta el armero, acá revolvés vos.
     */
    cajonTitulo: '¿Con qué sales?',
    cajonVacio: 'No hay nada más en el cajón.',
    posteTitulo: '¿Qué haces con el caballo?',
    // 🎭 Tu compañero: cómo va a estar en el próximo asalto (ver `FORMAS` en systems/companero.js).
    companeroTitulo: '¿Cómo vamos hoy?',
    /**
     * 🤠 LA BANDA EN EL CAMPAMENTO (ver data/banda.js). Hablar con uno: lo que te dice depende de su lealtad (la
     * palabra, nunca el número). ⚠️ Textos míos de arranque: Santi los corrige.
     */
    banda: {
      // Cómo está con vos, en una palabra (ver LEALTAD.palabras).
      palabras: { firme: 'firme', conforme: 'conforme', dudoso: 'dudoso', aPuntoDeIrse: 'a punto de irse' },
      // 🙂 El humor, en una palabra (ver HUMOR.palabras en data/rasgos.js).
      humor: { contento: 'contento', tranquilo: 'tranquilo', deMalas: 'de malas', furioso: 'furioso' },
      // 📋 La ficha de cada uno ([TAB] en el campamento).
      ficha: {
        lealtad: 'Lealtad',
        // (📒 🔁 "Ánimo": desde la libreta sale de lo que anotó, no de un número escondido.)
        humor: 'Ánimo',
        libreta: 'Libreta',
        favores: 'Favores',
        quejas: 'Quejas',
        nada: '(nada)',
        rasgos: 'Rasgos',
        ayuda: '[A/D] OTRO     [TAB/ESC] CERRAR',
      },
      /**
       * 🗣️ 🔁 LO PRIMERO QUE TE DICE AL ACERCARTE, según su lealtad Y su humor de hoy: 4 × 4 por persona *(VOCES.md,
       * aprobado: "Las voces de la brujula están bien")*. Santiago habla poco y te dice "McCoy", nunca "jefe"; Frank
       * habla mucho y dice "jefe"; Tommy te habla de usted.
       */
      saludo: {
        santiago: {
          firme: { contento: '"Buen día, McCoy. Hoy sí."', tranquilo: '"McCoy. Lo que haga falta."', deMalas: '"Hoy no estoy para charlas. Pero cuenta conmigo."', furioso: '"No ahora, McCoy."' },
          conforme: { contento: '"¿Hay trabajo? Bien."', tranquilo: '"¿Qué necesitas, McCoy?"', deMalas: '"Habla rápido."', furioso: 'Se da vuelta. "…¿Qué?"' },
          dudoso: { contento: '"Hoy me alcanza. Mañana veremos."', tranquilo: '"Dime que esto nos acerca a algo, McCoy."', deMalas: '"¿Otra vez tú?"', furioso: '"Cuidado con lo que vas a pedirme."' },
          aPuntoDeIrse: { contento: '"No te confundas. Sigo contando los días."', tranquilo: '"No sé cuánto más me quedo, McCoy."', deMalas: '"Cada día que pasa, México queda más lejos."', furioso: '"Ya tengo mi caballo ensillado."' },
        },
        frank: {
          firme: { contento: '"¡McCoy! Siéntate, que hay para los dos."', tranquilo: '"Jefe. ¿Te conté la del caballo tuerto?"', deMalas: '"Mal día, jefe. Pero aquí estoy."', furioso: '"Hoy no me hables de trenes."' },
          conforme: { contento: '"¡Ja! Jefe, ¿qué se festeja?"', tranquilo: '"¿Qué pasa, jefe? Estoy despierto, estoy despierto."', deMalas: '"Si es trabajo, mañana."', furioso: '"Déjame con la botella, jefe."' },
          dudoso: { contento: '"Hoy te perdono todo, jefe. Hoy."', tranquilo: '"Si vienes a sermonearme, hazlo rápido."', deMalas: '"¿Y ahora qué hice?"', furioso: '"Una palabra más y me voy al pueblo."' },
          aPuntoDeIrse: { contento: '"No te acostumbres a verme así."', tranquilo: '"No me mires así. Ya sé lo que estás pensando."', deMalas: '"Hay otras bandas, ¿sabes?"', furioso: '"Me voy a ir, jefe. Te aviso para que no digas."' },
        },
        tommy: {
          firme: { contento: '"¡Señor McCoy! ¿Cuándo salimos?"', tranquilo: '"Listo para lo que diga, señor."', deMalas: '"Perdone, señor. No dormí bien."', furioso: '"Señor, necesito estar solo un rato."' },
          conforme: { contento: '"¡Hoy podría montar hasta Texas!"', tranquilo: '"Aquí estoy, señor. ¿Qué hacemos?"', deMalas: '"Sí, señor. Lo que diga."', furioso: '"¿Puede ser otro día, señor?"' },
          dudoso: { contento: '"Hoy fue un buen día. ¿Verdad, señor?"', tranquilo: '"Señor... ¿esto es lo que hacía mi padre?"', deMalas: '"¿Usted duerme bien, señor?"', furioso: '"Mi padre nunca habría hecho esto."' },
          aPuntoDeIrse: { contento: '"No sé si quedarme, señor. Pero hoy no."', tranquilo: '"Esto no es lo que me prometieron."', deMalas: '"¿Para qué me trajo, señor?"', furioso: '"Me voy al ejército. Ellos sí tienen honor."' },
        },
      },
      /**
       * 🗣️ "¿CÓMO ESTÁS?": contesta con su humor, o con lo que le pasó hace poco si fue algo fuerte (ver `comoEsta` en
       * scenes/campScene.js). Ya no dice "está conforme contigo": eso se lee en la ficha.
       */
      comoEsta: {
        santiago: {
          contento: '"Bien."', tranquilo: '"Pensando en mi mujer."', deMalas: '"Pregúntame cuando haya reparto."', furioso: '"¿Para qué preguntas, McCoy?"',
          fianza: '"Tres noches en una celda. ¿Tú cómo crees?"',
          herido: '"Me dieron. Ya va a cerrar."',
          mexico: '"Mi mujer ya tiene su dinero. Con eso me alcanza."',
          miParte: '"Ahora sí. Gracias, McCoy."',
        },
        frank: {
          contento: '"¡Como nunca, jefe!"', tranquilo: '"Con sed."', deMalas: '"Mal, jefe. Ya se me pasa."', furioso: '"No me preguntes, jefe."',
          resaca: '"Con la cabeza partida."',
          esposa: '"Hoy hace años que la enterré."',
          botella: '"Seco como el desierto, jefe. Alguien me quitó la botella."',
          herido: '"Me agujerearon, jefe. Pásame la botella y no me mires."',
          fianza: '"La comida de la cárcel, jefe. No se la deseo a nadie."',
        },
        tommy: {
          contento: '"¡Muy bien, señor!"', tranquilo: '"Pensando en mi padre."', deMalas: '"Bien, señor. Supongo."', furioso: '"Prefiero no hablar, señor."',
          civiles: '"Esa gente del vagón… ¿tenía que pasar, señor?"',
          adelante: '"¡Fui adelante, señor! ¿Vio cómo lo hice?"',
          herido: '"Duele, señor. Pero no me quejo."',
          fianza: '"¿Por qué me dejó ahí, señor?"',
        },
      },
      // 🃏 La mano de cartas con Frank (sólo si es Bueno con la baraja; una por día).
      mano: 'Jugar una mano de cartas.',
      manoTexto: '"¿Una mano, jefe? Si gano, me quedo con la botella."',
      manoGana: '"¡Ja! La botella es mía, jefe." Reparte otra vez, aunque ya no queda nada que ganar.',
      manoPierde: '"Bah. Me tocaron malas." Pero se ríe, y los demás se acercan al fuego.',
      // Las respuestas de James.
      comoAndas: '¿Cómo estás?',
      nada: 'Nada. Sigue.',
      // Si está herido, se agrega a lo de arriba.
      herido: 'Todavía se está curando.',
      // 🎯 Mandarlo a practicar (sólo hablado por ahora *(Santi: "Que solo sea hablado, luego el dibujo")*).
      practicar: 'Ve a practicar algo.',
      practicarTitulo: (nombre) => `¿Qué practica ${nombre}?`,
      // 🔁 (Con la pizarra: sale a la mañana, vuelve a la noche, y lo sigue haciendo hasta que lo cambies.)
      practicarCuerpo: 'Sale a la mañana y vuelve a la noche. Lo sigue haciendo los días que siguen: se cambia en el calendario [C].',
      practicarOpcion: (hab, tiene, domina) => `${hab}${domina ? ' (la domina)' : tiene ? ' (la tiene)' : ''}`,
      practicarVolver: 'Mejor no.',
      seVaAPracticar: (nombre, hab) => `${nombre} se va a practicar "${hab}". Vuelve a la noche.`,
      vaAPracticarManana: (nombre, hab) => `${nombre} va a practicar "${hab}" desde mañana temprano.`,
      practicando: (hab) => `Hoy practica "${hab}".`,
      // 🕵️ Mandarlo a mirar un tren (etapa C, ver `abrirEspia` en scenes/campScene.js).
      espiar: 'Ve a mirar un tren.',
      espiarTitulo: (nombre) => `¿Qué tren va a mirar ${nombre}?`,
      espiarCuerpo: 'Sale a la mañana y a la noche vuelve con lo que vio. Si el tren pasa antes de que vuelva, no sirve.',
      seVaAEspiar: (nombre, via) => `${nombre} sale a mirar el tren de ${via}. Vuelve a la noche.`,
      vaAEspiarManana: (nombre, via) => `${nombre} sale mañana temprano a mirar el tren de ${via}.`,
      espiando: 'Hoy anda mirando un tren.',
      // 🎭 Los papeles del asalto (ver PAPELES en data/banda.js), como se leen en el mapa.
      papeles: { caballos: 'Los caballos', pasajero: 'De pasajero', telegrafo: 'El telégrafo', vigia: 'De vigía' },
      // 🔥 Cuando alguien se va por la lealtad en 0 (ver data/momentos.js).
      seFue: (nombre) => `${nombre} se fue durante la noche.`,
    },
    /**
     * 🔥 LOS MOMENTOS DEL CAMPAMENTO (ver data/momentos.js). `titulo` arriba, `texto` lo que pasa, `opciones` lo que
     * podés contestar y `resultado` lo que pasa después. El tipo firma "J.Mc." *(Santi: "al tipo ponele las siglas
     * J.Mc. Que es 'John Mckenzy'")*: el nombre completo todavía no se dice.
     */
    /** 🎭 Lo que trajo el asalto, al llegar (ver `cerrarAsalto` en data/momentos.js). */
    noticias: {
      tommyCumplida: 'Tommy está orgulloso: le cumpliste.',
      tommyRota: 'Tommy esperaba ir en este asalto. No te lo perdona.',
      // 🗣️ Tommy pidió ir adelante (ver `adelante` en data/momentos.js).
      tommyAdelante: 'Tommy fue adelante, como pidió. Vuelve contento, le haya ido como le haya ido.',
      tommyAdelanteRoto: 'Le dijiste a Tommy que iría adelante, y no lo mandaste.',
      forasteroAgradecido: 'El forastero cumplió: la ley tardó en llegar.',
      forasteroSoplon: 'El forastero era un soplón: la ley sabía que venías.',
      // 🗞️ Fuiste a esperar a una vía y no pasó nada (ver `esperar` en scenes/mapScene.js).
      sinTren: 'Esperaste en la vía hasta la noche. No pasó ningún tren.',
      // ⛓️ El pasajero de la banda que quedó en el tren, y cuando vuelve.
      preso: (nombre) => `${nombre} quedó preso en el tren. Para sacarlo, hay que pagar la fianza en la oficina del sheriff.`,
      volvio: (nombre) => `${nombre} volvió. No te perdona que lo dejaras varado en el tren.`,
      // 🙂 Las habilidades (`hab`: su nombre, como en la ficha).
      gano: (nombre, hab) => `${nombre} aprendió "${hab}".`,
      recupero: (nombre, hab) => `${nombre} recuperó "${hab}".`,
      perdio: (nombre, hab) => `${nombre} perdió "${hab}": hace mucho que no la usa.`,
      // (🟤 Perdió una marca y todavía la tiene: ver `ANIMO.habilidad.marcas`.)
      oxida: (nombre, hab) => `A ${nombre} se le está oxidando "${hab}": si no la usa, la va a perder.`,
      estrella: (nombre, hab) => `${nombre} domina "${hab}". Ya no la va a olvidar.`,
      practico: (nombre, hab) => `${nombre} volvió de practicar "${hab}".`,
      // 📒 Ganó o perdió una marca de lealtad esa noche (`palabra`: cómo quedó).
      // 🍲 (No alcanzó para la olla del día: ver `pagarLaOlla` en systems/libreta.js.)
      // ✉️ (J.Mc. en cuotas: systems/libreta.js.)
      jmcDeuda: (paga) => 'De lo que trajiste, J.Mc. se cobró primero los $' + paga + ' que le debías.',
      jmcCobro: (lleva, deuda) => 'J.Mc. se lleva $' + lleva + ' de este golpe' + (Number(deuda) ? '. Le debes $' + deuda + ': te los cobra del próximo.' : '.'),
      sinOlla: (costo) => 'No alcanzó para la olla ($' + costo + ' por día): hoy la banda no come, y se queja.',
      // 🍖 (La despensa: systems/comida.js.)
      sinComida: 'No queda comida: hoy la banda no comió, y se queja. En el almacén del pueblo venden.',
      pocaComida: (dias) => Number(dias) ? 'Queda comida para ' + dias + (Number(dias) === 1 ? ' día.' : ' días.') : 'Mañana no hay qué comer.',
      // 📋 (Lo que trajeron de las tareas del calendario: systems/tareas.js. `quien` puede ser "Frank y Santiago".)
      tarea: {
        cazar: (quien, varios, n, dias) => Number(n)
          ? `${quien} ${varios ? 'volvieron' : 'volvió'} de cazar con ${n} porciones. La comida alcanza para ${dias} ${Number(dias) === 1 ? 'día' : 'días'}.`
          : `${quien} ${varios ? 'volvieron' : 'volvió'} de cazar sin nada.`,
        pescar: (quien, varios, n, dias) => `${quien} volvió de pescar con ${n} porciones. La comida alcanza para ${dias} ${Number(dias) === 1 ? 'día' : 'días'}.`,
        puebloNada: (quien) => `${quien} volvió del pueblo sin ningún rumor.`,
        pelea: (quien, varios, n) => `${quien} se agarró a trompadas en la cantina: tu recompensa sube $${n}.`,
        compra: (quien, varios, n, costo, falto) => Number(n)
          ? `${quien} compró ${n} porciones en el almacén por $${costo}.` + (Number(falto) ? ' No alcanzó la plata para más.' : '')
          : Number(falto) ? `${quien} fue al almacén, pero no alcanzó la plata.` : `${quien} fue al almacén: ya había comida de sobra.`,
        cartas: (quien, varios, dif, pelea) => (Number(dif) > 0 ? `${quien} ganó $${dif} a las cartas.` : Number(dif) < 0 ? `${quien} perdió $${-dif} a las cartas.` : `${quien} jugó a las cartas: ni ganó ni perdió.`)
          + (Number(pelea) ? ` Se armó una pelea: tu recompensa sube $${pelea}.` : ''),
        curar: (quien, varios, otro, quedan) => `${quien} curó a ${otro}` + (Number(quedan) ? `: le faltan ${quedan} ${Number(quedan) === 1 ? 'día' : 'días'}.` : ': ya está sano.'),
        cocinar: (quien, varios, salo) => `${quien} cocinó un guiso` + (Number(salo) ? ` y saló la carne de hoy (${salo} porciones): ahora dura el doble.` : '.')
          + ' Si sales al golpe esta noche o mañana, entras con un tiro más de vida.',
        // 🤝 (`como`: lo que pasó en el trato, systems/tareas.js: a aceptó, r regateó, rm regateó mal, p apretó, pm apretó y
        // le cerraron, c pagó el chantaje, h lo chantajearon y habló, n se volvió sin vender; `rec`: lo que subió tu recompensa.)
        // (🧪 f se pelearon, v lo chantajearon y se volvió sin pagar; `quimica`: lo que pasó entre los dos, 'palabra.loCalma'.)
        vender: (quien, varios, total, como, guarda, rec, quimica = '') => ({
          f: `${quien} y el perista se fueron a las manos. No vendió nada.`,
          v: `El perista chantajeó a ${quien}, y se volvió sin vender. Por ahora no habló.`,
          a: `${quien} le vendió lo robado al perista por $${total}.`,
          r: `${quien} le vendió lo robado al perista por $${total}, regateando.`,
          rm: `${quien} quiso regatear con el perista y le salió mal: lo vendió por $${total}.`,
          p: `${quien} apretó al perista y sacó $${total}.`,
          pm: `${quien} quiso apretar al perista y le cerró la puerta. Lo robado sigue aquí.`,
          c: `El perista chantajeó a ${quien}: le pagó $${total} por callarse.`,
          h: `El perista chantajeó a ${quien}, y habló. Lo robado sigue aquí.`,
          n: `${quien} se volvió del perista sin vender.`,
        }[como] || `${quien} le vendió lo robado al perista por $${total}.`)
          + quimica.split('.').filter(Boolean).map((q) => ({
            idioma: ' Hablaron el mismo idioma: plata.',
            palabra: ' Se dieron la mano como gente de palabra.',
            loEnfrenta: ' Lo enfrentó en vez de pagar.',
            noSeEntienden: ' No se entendieron.',
            niSeInmuta: ' Ni pestañeó: el perista no se animó a chantajearlo.',
            nervioso: ' El perista se puso nervioso con él.',
            seCaenBien: ' Se cayeron bien.',
            loCalma: ' Lo calmó: el perista no fue con el chisme.',
            loAsusta: ' El perista le tuvo miedo.',
            loHuele: ' El perista le olió el miedo.',
          }[q] || '')).join('')
          + (Number(rec) > 0 ? ` Tu recompensa sube $${rec}.` : '')
          + (Number(guarda) ? ' Algo no cierra: parece que se guardó una parte.' : ''),
      },
      marcaGano: (nombre, palabra) => `${nombre} confía más en ti: ahora está ${{ firme: 'firme', conforme: 'conforme', dudoso: 'dudoso', aPuntoDeIrse: 'a punto de irse' }[palabra] || palabra}.`,
      marcaPerdio: (nombre, palabra) => `${nombre} confía menos en ti: ahora está ${{ firme: 'firme', conforme: 'conforme', dudoso: 'dudoso', aPuntoDeIrse: 'a punto de irse' }[palabra] || palabra}.`,
    },
    momentos: {
      encargo: {
        titulo: 'Una carta junto al fuego',
        // (🔁 ✉️ Con un pedido que se puede cumplir *(Santi: "que la carta tenga un objetivo más concreto a cumplir")*.)
        // (✉️ 🔁 Con J.Mc. en cuotas, `JMC` en data/libreta.js: $200 de cada tren y, en 15 días, el maletín.)
        texto: JMC.activo
          ? `Alguien la dejó mientras dormías. "De cada tren que asaltes me dejarás $${JMC.porGolpe} junto a tu carpa. Y en ${ENCARGO.dias} días paso por tu campamento, de noche: deja el maletín de cuero que viaja en el tren de carga, y te diré dónde vieron a tu padre por última vez. —J.Mc."`
          : `Alguien la dejó mientras dormías. "En ${ENCARGO.dias} días paso por tu campamento, de noche. Deja junto a tu carpa $${ENCARGO.dinero} y el maletín de cuero que viaja en el tren de carga, y te diré dónde vieron a tu padre por última vez. —J.Mc."`,
        opciones: { contar: 'Contarle a la banda lo que te prometió', guardar: 'Guardártelo' },
        resultado: {
          contar: 'Se lo cuentas a la banda. Nadie dice nada, pero todos se quedan mirando el fuego.',
          guardar: 'Doblas la carta y te la guardas en el bolsillo.',
        },
      },
      botella: {
        titulo: 'Frank',
        texto: '"Una más y me voy a dormir, jefe." La botella está casi vacía, y mañana hay trabajo.',
        opciones: { quitar: 'Quitarle la botella', dejar: 'Dejarlo' },
        // (🗣️ Según el humor con que lo agarras: `contento`, `tranquilo` y `mal` (de malas o furioso). Ver `porHumor`.)
        resultado: {
          quitar: {
            contento: '"Bueno, bueno. Hoy te la doy, jefe." Te la da riéndose.',
            tranquilo: '"Está bien, está bien..." Te la da de mala gana.',
            mal: '"¿Ahora también me cuidas la botella?" La deja en el suelo y se va.',
          },
          dejar: {
            contento: '"¡Ese es mi jefe!" Brinda por ti, por el caballo y por la luna.',
            tranquilo: '"¡Ese es mi jefe!" Mañana va a tener la cabeza partida.',
            mal: '"Por lo menos algo sale bien hoy." Se la termina solo, mirando el fuego.',
          },
        },
      },
      tommyEntrar: {
        titulo: 'Tommy',
        texto: '"Déjeme entrar al tren con usted, señor. Sé disparar."',
        opciones: { todavia: 'Todavía no', proximo: 'En el próximo' },
        resultado: {
          todavia: {
            contento: '"Sí, señor. Voy a estar listo cuando me diga."',
            tranquilo: '"Sí, señor." Se va a limpiar el revólver sin mirarte.',
            mal: '"¿Y cuándo, señor?" Se va sin esperar la respuesta.',
          },
          proximo: {
            contento: '"¡Gracias, señor! ¡No lo voy a defraudar!"',
            tranquilo: '"¡Gracias, señor! No lo voy a defraudar."',
            mal: '"Gracias, señor." Por primera vez en días, sonríe.',
          },
        },
      },
      mexico: {
        titulo: 'Santiago',
        texto: '"Llegó carta de México. Mi mujer necesita dinero. ¿Me adelantas mi parte?"',
        opciones: { dar: 'Darle $50', despues: 'Después del reparto' },
        resultado: {
          dar: {
            contento: '"Gracias, McCoy." Esa noche escribe una carta larga.',
            tranquilo: '"Gracias, McCoy. No me lo voy a olvidar."',
            mal: '"…Gracias." Es lo único que dice en toda la noche.',
          },
          despues: {
            contento: '"Después, entonces." Lo dice sin enojo.',
            tranquilo: '"Después. Siempre después."',
            mal: '"Mi mujer no come después, McCoy."',
          },
        },
      },
      reparto: {
        titulo: 'Frank y Santiago',
        texto: '"Ese botín lo ganamos todos." "Algunos más que otros." Los dos te miran a ti.',
        opciones: {
          parejo: (n) => `Parejo para todos (−$${n})`,
          guardo: 'Lo guardo yo: yo entré al tren',
          santiago: (n) => `Más para Santiago (−$${n})`,
          frank: (n) => `Más para Frank (−$${n})`,
        },
        resultado: {
          parejo: 'Repartes en cuatro partes iguales. Frank brinda por eso.',
          guardo: 'Nadie te discute. Pero esa noche nadie te habla.',
          santiago: '"¿Y por qué él?", dice Frank, y escupe al fuego.',
          frank: '"Al que más grita, más le toca", dice Santiago, y se va a dormir sin cenar.',
        },
      },
      /**
       * 🔥 LA FOGATA (etapa 4, data/fogata.js): la noche del golpe, los dos que peor se llevan. Discuten por el próximo
       * golpe (qué tren, quién va de pasajero), cada uno con su voz (VOCES.md): Santiago dice "McCoy"; Frank, "jefe";
       * Tommy habla de usted.
       */
      discusion: {
        titulo: (nombre, g) => parDeLaFogata(g),
        texto: (nombre, g) => ({
          'frank-santiago': 'Junto al fuego, la voz sube. "Al próximo no voy con él, McCoy", dice Santiago. "No le confío ni los caballos." "¿Y tú qué sabes de caballos?", le contesta Frank. Los dos te miran.',
          'frank-tommy': '"El chico quiere ir adelante y no sabe ni cargar el revólver, jefe." "Por lo menos yo llego sobrio, Frank." Los dos esperan que digas algo.',
          'santiago-tommy': '"Para Tommy todo es honor. El honor no paga, McCoy." "Usted sólo piensa en su parte, Santiago." Los dos esperan que digas algo.',
        }[g.campamento.fogata.par] || 'Discuten junto al fuego por el próximo golpe. Los dos te miran.'),
        opciones: {},
        resultado: {},
      },
      pelea: {
        titulo: (nombre, g) => parDeLaFogata(g),
        texto: (nombre, g) => `${parDeLaFogata(g)} ya no se hablan. Esta noche, junto al fuego, uno empuja al otro. Van a irse a las manos.`,
        opciones: {},
        resultado: {},
      },
      fogata: {
        op: {
          razon: (n) => `Darle la razón a ${n}`,
          calmar: (n) => `Calmarlos con una botella (−$${n})`,
          calmarLabia: (n) => `Que ${n} los calme (con su labia)`,
          dejar: 'Que lo arreglen solos',
          parar: (n) => `Meterte en el medio y pagar la ronda (−$${n})`,
          noMeterse: 'No meterte',
        },
        res: {
          razon: (gana, pierde) => `${gana} asiente. ${pierde} se levanta y se va a dormir lejos del fuego.`,
          serio: (n) => `A ${n} no le importa ganar.`,
          calmar: 'Pones una botella en el medio y hablan hasta tarde. Al final se dan la mano.',
          calmarLabia: (n) => `${n} se mete con una historia larga y los hace reír. Al final se dan la mano.`,
          enemigos: (a, b) => `Los dejas. Siguen hasta que se apaga el fuego. Desde esta noche, ${a} y ${b} no se hablan.`,
          divertido: (n) => `Los dejas. ${n} se mete con un chiste y al final todos se ríen. No pasó a mayores, pero nadie los escuchó.`,
          parar: 'Te metes en el medio y pagas la ronda para todos. Por esta noche, alcanza.',
          herido: (n, dias) => `Ruedan por el suelo hasta que uno no se levanta. ${n} queda herido ${dias} días. Después, cada uno a su manta.`,
        },
        rie: (div, otro, motivo) => `${div} se pasa la noche contando historias junto al fuego. ${otro} se olvida de una queja: "${motivo}".`,
        sinResolver: (a, b) => `${a} y ${b} siguieron discutiendo sin ti. Ya no se hablan.`,
      },
      // 🎭 Lo que vuelve del asalto (etapa 6).
      civiles: {
        titulo: 'Tommy',
        texto: '"Esa gente no tenía armas, señor. Mi padre nunca hubiera hecho algo así."',
        opciones: { defender: 'Eran ellos o yo', perdon: 'Tienes razón. Me equivoqué' },
        resultado: {
          defender: {
            contento: '"Sí, señor. Supongo." No parece convencido.',
            tranquilo: 'Tommy no contesta. Se aleja del fuego.',
            mal: '"Ellos o usted. Ya veo." Se aleja del fuego.',
          },
          perdon: {
            contento: 'Tommy asiente, aliviado. Frank se ríe por lo bajo: "Ahora pide perdón el jefe."',
            tranquilo: 'Tommy asiente. Frank se ríe por lo bajo: "Ahora pide perdón el jefe."',
            mal: '"Ya no sirve de nada, señor. Pero gracias."',
          },
        },
      },
      // 🗣️ Santiago, Egoísta, pide su parte él solo (ver `miParte` en data/momentos.js).
      miParte: {
        titulo: 'Santiago',
        texto: '"Mucho dinero el de ayer. Mi parte. Ahora."',
        opciones: {
          dar: (d) => `Dársela (−$${d})`,
          no: 'Cuando haya reparto',
          trato: (d) => `"Si no te quejas en el próximo" (−$${d})`,
        },
        resultado: {
          dar: { contento: '"Bien." Cuenta los billetes dos veces.', tranquilo: '"Gracias, McCoy." Una vez, y en serio.', mal: 'Los cuenta sin decir nada.' },
          no: { contento: '"Como digas, McCoy." Pero lo anota.', tranquilo: '"Después. Siempre después."', mal: '"¿Y cuándo hay reparto, McCoy?"' },
          trato: { contento: '"Trato." Te da la mano.', tranquilo: '"Trato. Sin quejarme."', mal: '"Trato." No te da la mano.' },
        },
      },
      // 🗣️ Tommy, Valiente, pide el puesto peligroso (ver `adelante` en data/momentos.js).
      adelante: {
        titulo: 'Tommy',
        texto: '"Señor, déjeme ir adelante esta vez. Adentro del tren, de pasajero."',
        opciones: { si: 'Irás de pasajero', no: 'Todavía no' },
        resultado: {
          si: { contento: '"¡Gracias, señor! No se va a arrepentir."', tranquilo: '"Gracias, señor." Se queda limpiando el revólver hasta tarde.', mal: '"Gracias, señor. Lo necesitaba."' },
          no: { contento: '"Está bien, señor. La próxima."', tranquilo: '"Sí, señor." No te mira.', mal: '"Siempre la próxima, señor."' },
        },
      },
      herido: {
        titulo: (n) => n,
        texto: (n) => `${n} tiene la herida mal vendada. "Esto necesita un médico de verdad, McCoy."`,
        opciones: { medico: (d) => `Pagarle un médico (−$${d})`, nada: 'Ya se le va a pasar' },
        resultado: {
          medico: (n) => `El médico del pueblo cobra caro y no hace preguntas. ${n} se va a recuperar antes.`,
          nada: (n) => `${n} se aprieta el vendaje y no dice nada más.`,
        },
      },
      caballoTarde: {
        titulo: (n) => n,
        texto: (n) => `Todos se acuerdan de cuánto tardó el caballo. ${n} no te mira a los ojos.`,
        opciones: { reprochar: 'Casi me matan por tu culpa', dejar: 'Le puede pasar a cualquiera' },
        resultado: {
          reprochar: (n) => `${n} aprieta los dientes. Los demás asienten: el jefe tiene razón.`,
          dejar: (n) => `"No va a volver a pasar", dice ${n}.`,
        },
      },
      deMas: {
        titulo: (n) => n,
        texto: '"Mucho dinero el de ayer, ¿no? ¿Y nuestra parte?"',
        opciones: { algo: (d) => `Darles algo (−$${d})`, mio: 'Es mío: yo entré al tren' },
        resultado: {
          algo: 'Cuentan los billetes junto al fuego. Por ahora alcanza.',
          mio: '"Ya veo." Esa noche hablan en voz baja, lejos de ti.',
        },
      },
      forastero: {
        titulo: 'Un forastero',
        // (🔁 🗞️ Ahora pide provisiones y paga con lo que sabe *(Santi: "puede informar de un tren de carga, pide agua y
        // suministros a cambio [...] ahora te saca 70 dólares")*.)
        texto: 'Un hombre herido se acerca al fuego. "Agua y algo de comida para el camino, por favor... Le pago con algo que sé: un tren de carga."',
        opciones: { ayudar: (n) => `Darle agua y provisiones ($${n})`, echar: 'Echarlo' },
        resultado: {
          ayudar: 'Tommy le da su cantimplora y le llenan las alforjas. El hombre se va antes del amanecer.',
          echar: 'Se va arrastrando una pierna. Santiago no te habla en toda la noche.',
        },
      },
      // La lealtad en 0: avisa una vez.
      aviso: {
        santiago: '"Si esto sigue así, me voy, McCoy."',
        frank: '"Una más de estas y me busco otra banda."',
        tommy: '"Señor... no sé si puedo seguir con usted."',
        ok: 'Entendido.',
      },
      /**
       * ✉️ LA NOCHE DE J.Mc. (ver `revisarEncargo` en data/momentos.js): la carta aparece de nuevo junto a la carpa
       * esa noche, hasta el amanecer. Mentir *(Santi: "puede mentir y decir que el maletín no lo consiguió y entonces
       * se quedará con los documentos")* sólo se ofrece si tienes las dos cosas.
       */
      entrega: {
        titulo: 'La noche de J.Mc.',
        texto: JMC.activo
          ? (n, g) => `Es la noche que dijo la carta. Antes del amanecer, J.Mc. pasará junto a tu carpa. Pidió el maletín de cuero${deudaDe(g) ? ` y los $${deudaDe(g)} que le debes` : ''}.`
          : `Es la noche que dijo la carta. Antes del amanecer, J.Mc. pasará junto a tu carpa. Pidió $${ENCARGO.dinero} y el maletín de cuero.`,
        opciones: {
          entregar: JMC.activo ? 'Dejar el maletín (paga lo que le debes)' : `Dejar los $${ENCARGO.dinero} y el maletín`,
          mentir: JMC.activo
            ? (d) => (d ? `Dejar los $${d} que le debes y decir que no encontraste el maletín` : 'Decir que no encontraste el maletín')
            : `Dejar sólo los $${ENCARGO.dinero} y decir que no encontraste el maletín`,
          nada: 'No dejar nada',
        },
        resultado: {
          entregar: JMC.activo ? 'Dejas el maletín junto a la carpa. Antes del amanecer ya no está.' : 'Dejas el dinero y el maletín junto a la carpa. Antes del amanecer ya no están.',
          mentir: `Dejas ${JMC.activo ? 'una nota' : 'el dinero y una nota'}. El maletín, con sus documentos, se queda contigo. A la mañana hay otra carta: "Ese maletín viajaba en el tren. No cumpliste. Tienes ${ENCARGO.dias} días más. —J.Mc."`,
          nada: `No dejas nada. A la mañana hay otra carta: "No cumpliste. Tienes ${ENCARGO.dias} días más. —J.Mc."`,
        },
      },
      // ✉️ No estabas esa noche: la carta que te espera.
      plazo: {
        titulo: 'Otra carta',
        texto: JMC.activo
          ? `"Pasé por tu campamento y no había nada. No cumpliste. Tienes ${ENCARGO.dias} días más para dejarme el maletín junto a tu carpa. Y no olvides lo de cada tren. —J.Mc."`
          : `"Pasé por tu campamento y no había nada. No cumpliste. Tienes ${ENCARGO.dias} días más: $${ENCARGO.dinero} y el maletín, junto a tu carpa. —J.Mc."`,
        opciones: { leer: 'Guardar la carta' },
        resultado: { leer: 'Te la guardas en el bolsillo. Esta vez no puedes faltar.' },
      },
      // ✉️ Al pasar el tiempo y caer en la noche de J.Mc.
      esLaNoche: 'Esta noche pasa J.Mc.: la carta está junto a la carpa.',
      /**
       * 🏁 EL FINAL *(Santi: "que se quede ahí el juego. O sea, es el único final por ahora")*.
       */
      fin: {
        titulo: 'Fin',
        texto: 'A la mañana, donde estaba el maletín, hay una carta más: "Cumpliste. Pronto sabrás dónde vieron a tu padre. —J.Mc."\n\nAquí termina la partida, por ahora.',
        otra: 'Empezar de nuevo',
      },
      seguir: 'Seguir.',
      // Lo que cambió, abajo del resultado: en palabras, nunca en números.
      cambio: (nombre, palabra) => `${nombre} ahora está ${palabra} contigo.`,
      // 🙂 Cuando le cambia el humor (la palabra).
      cambioHumor: (nombre, palabra) => `${nombre} anda ${palabra}.`,
      pagaste: (n) => `Pagaste $${n}.`,
    },
    formas: {
      pasivo: 'PASIVO · se cuida, te cubre y no empieza nada',
      agresivo: 'AGRESIVO · acuchilla a los de espaldas y avanza',
      ladron: 'LADRÓN · va detrás de todo botín que vea',
    },
    companeroDice: {
      pasivo: '"Con cuidado, entonces. Yo te cubro."',
      agresivo: '"Al que me dé la espalda, lo duermo."',
      ladron: '"Tú ocúpate de ellos. Yo, del dinero."',
    },
    posteComer: 'DARLE DE COMER',
    poste: (caballo) => `Le das de comer al ${caballo}. Queda tranquilo.`,
    posteMontar: 'Montas y sales hacia el pueblo.',
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
      almacen: 'ALMACÉN',
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
      almacen: '[E] ALMACÉN',
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
      armeria: 'Rifles y escopetas colgados de la pared. El de adentro ni te mira.',
      cantina: 'Hay gente que busca trabajo. Todavía no puedes contratar a nadie.',
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
      mujer: '"Tú no eres de aquí, ¿verdad?"',
      borracho: '"...y le dije que el oro estaba en el vagón de atrás."',
      chico: '"¿Es verdad que asaltaron el de las seis?"',
    },
    volver: 'Montas y vuelves al campamento.',
    /** 🛒 EL ALMACÉN (systems/comida.js): se compra y se vende comida por porciones. */
    almacen: {
      nombre: 'Almacén',
      hay: (n, dias, comen) => 'Tienes ' + n + (n === 1 ? ' porción' : ' porciones') + ': ' + (dias ? 'alcanza para ' + dias + (dias === 1 ? ' día' : ' días') : 'no alcanza ni para hoy') + ' (comen ' + comen + ').',
      precios: (p, v) => 'La porción, $' + p + '. Te pago $' + v + ' por cada una.',
      comprar: (n, costo) => (n === 1 ? 'Comprar 1 porción' : 'Comprar ' + n + ' porciones') + ' - $' + costo,
      vender: (n, cobro) => (n === 1 ? 'Vender 1 porción' : 'Vender ' + n + ' porciones') + ' - $' + cobro,
      /** 🦌 Los cueros y los cuernos de la caza, todos juntos. */
      cueros: (n, cobro) => 'Vender lo que cazaste (' + n + (n === 1 ? ' pieza' : ' piezas') + ') - $' + cobro,
      nada: 'Nada más',
    },
    cerrado: (lugar) => `${lugar}. Cerrado hasta que amanezca.`,
    /**
     * 🗞️ EL DIARIO que vende el chico (ver `abrirDiario` en scenes/townScene.js). Las pistas dicen qué se despacha y
     * más o menos cuándo (`cuando`, por el día de la semana, empezando el domingo): nunca la vía ni el día. Cada una
     * apunta a una vía (por los pueblos o la mina por los que pasa), y eso lo deduce el jugador.
     */
    diario: {
      precio: 5,
      chico: 'El chico de los diarios',
      nombre: 'El Eco de la Región',
      pregon: (n) => `"¡Diario, diario! Las noticias de la semana por $${n}, señor."`,
      sinPlata: (n) => `"Son $${n}, señor. Vuelva cuando tenga."`,
      comprar: (n) => `Comprar uno ($${n})`,
      no: 'Ahora no',
      doblar: 'Doblar el diario',
      cuando: ['el fin de semana', 'a principios de semana', 'a principios de semana', 'a mitad de semana',
        'a mitad de semana', 'antes del fin de semana', 'el fin de semana'],
      pistas: {
        troncal: (c) => `Los ganaderos de las llanuras embarcan su ganado ${c}.`,
        mina: (c) => `La Mina La Viuda despacha su mineral ${c}.`,
        norte: (c) => `En Álamo Seco esperan un cargamento de herramientas ${c}.`,
        sur: (c) => `Los comerciantes de San Cristóbal esperan mercadería ${c}.`,
      },
      nada: 'Esta semana no se habla de cargamentos.',
      otras: [
        'Se busca maestra para la escuela de Paso del Oro.',
        'El sheriff pide a los vecinos que no anden armados por la calle.',
        'Subió el precio del whisky en la cantina.',
        'Una tormenta tumbó el molino de los Ramírez.',
        'Llega un circo a Fuerte Bravo el mes que viene.',
      ],
    },
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
      perista: '"¿Traes algo?"',
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
    /**
     * 🤝 LOS TRATOS (TRATOS.md, systems/tratos.js): el papel de un trato con cualquier tratante. Cada jugada dice su
     * plata, su chance "de cada 100" y lo que pasa si no sale; la línea del tratante tiene la voz de su rasgo (así se
     * le van notando, jugando).
     */
    tratos: {
      oficio: { perista: 'EMPEÑOS', armero: 'ARMERÍA', caballerizo: 'ESTABLO' },
      rasgo: { ambicioso: 'ambicioso', cobarde: 'cobarde', valiente: 'valiente', rastrero: 'rastrero', honorable: 'honorable', curioso: 'curioso' },
      titulo: (oficio, conocidos) => oficio + ' · ' + (conocidos.length ? conocidos.join(', ') : '?'),
      // Lo que mira (con lo que ya se desglosaba: lo limpio y tu nombre).
      mira: (t) => (t.cantidad === 1 ? 'Mira la única cosa que trajiste: $' + t.base : 'Revisa las ' + t.cantidad + ' cosas: $' + t.base)
        + (t.bonoLimpio > 0 ? ', +$' + t.bonoLimpio + ' porque nadie las busca' : '')
        + (t.porHonor > 0 ? ', +$' + t.porHonor + ' por tu nombre' : t.porHonor < 0 ? ', −$' + (-t.porHonor) + ' por tu nombre' : '') + '.',
      dice: {
        ambicioso: (m, te, grande) => (grande ? '"Ahora sí hablamos. $' + m + '."' : '"Por esto, $' + m + '. Tráeme más y hablamos."'),
        cobarde: (m, te) => (te ? 'Mira la puerta antes de mirarte a ti. "$' + m + '... ¿está bien?"' : '"$' + m + '. Y rápido, por favor."'),
        valiente: (m, te) => (te ? '"Sé quién eres. Me da igual. $' + m + '."' : '"$' + m + '. Lo tomas o lo dejas."'),
        rastrero: (m) => '"No pregunto de dónde sale. $' + m + '."',
        honorable: (m, te, grande, honor) => (honor > 15 ? '"Contigo se puede hablar. $' + m + '."' : honor < -15 ? '"Tu nombre no te ayuda. $' + m + '."' : '"Te doy $' + m + ', y es mi palabra."'),
        otro: (m) => '"Te doy $' + m + '."',
      },
      enojado: (m) => '"Todavía me acuerdo de la otra vez. $' + m + '."',
      chantaje: (x) => '"Sé de dónde salió esto. $' + x + ', y me olvido de tu cara."',
      op: {
        aceptar: (m) => 'Aceptar: $' + m,
        aceptarChantaje: (m) => 'Aceptar: $' + m + ' y se calla',
        regatear: (m, c, por, siNo) => 'Regatear: $' + m + ' (' + c + ' de cada 100' + por + ') · si no, $' + siNo,
        apretar: (m, c, por, sopla) => 'Apretarlo: $' + m + ' (' + c + ' de cada 100' + por + ') · si no, cierra' + (sopla ? ' · y sopla' : ''),
        apretarChantaje: (m, c, por, sopla) => 'Apretarlo: $' + m + ' (' + c + ' de cada 100' + por + ') · si no, habla' + (sopla ? ' · y sopla' : ''),
        irte: 'Irte',
        irteChantaje: (c) => 'Irte (habla ' + c + ' de cada 100)',
      },
      // La razón que más pesa, al lado de la chance.
      por: { cartel: 'tu cartel', buscado: 'te buscan', conocido: 'te conocen', temido: 'te temen', fama: 'tu fama', cobarde: 'se asusta', ambicioso: 'es duro', trato: 'te conoce', negociante: 'sabe negociar' },
      resultado: {
        vendio: (m) => 'Te paga $' + m + '.',
        regateo: (m) => 'Lo piensa. "Está bien." Te paga $' + m + '.',
        regateoMal: (m) => 'No le gustó nada. "Ahora te doy $' + m + '."',
        apreto: (m) => 'Traga saliva. Te paga $' + m + '.',
        apretoChantaje: (m) => 'Se le va el color. "Está bien, está bien." Te paga $' + m + '.',
        apretoMal: 'Te cierra la puerta en la cara. "Vuelve mañana."',
        sopla: (n) => 'Cuando sales, lo ves ir derecho a lo del sheriff.   Recompensa +$' + n,
        pagoChantaje: (m) => 'Cuenta los billetes. Te da $' + m + '. "Yo no te vi."',
        habla: (n) => '"Tú lo quisiste." Esa tarde, el sheriff sabe de dónde salió.   Recompensa +$' + n,
        callo: 'No dice nada. Por ahora.',
        teVas: 'Juntas tus cosas y te vas.',
        cerrado: '"Hoy no. Vuelve mañana."',
      },
    },

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
        lineas.push(`"Contigo se puede hablar."   +$${t.porHonor}`);
      } else if (t.porHonor < 0) {
        lineas.push(`Te mira, escupe al piso y baja la oferta.   −$${-t.porHonor}`);
      }
      // La última línea es la de más abajo, o sea la que el ojo encuentra
      // primero: el número que de verdad importa.
      lineas.push(`Te paga $${t.total}.`);
      return lineas;
    },

    /**
     * 💰 EL AYUDANTE DEL SHERIFF, cuando hay un cartel con tu cara. Nunca dice
     * "pagar la recompensa": lo que se compra es que el cartel se pierda.
     */
    ayudante: {
      pregunta: (precio) => `"Por $${precio}, ese cartel se pierde."`,
      limpiar: (precio) => `LIMPIAR MI NOMBRE ($${precio})`,
      nada: '"Como quieras. El cartel sigue ahí."',
      falta: (precio, falta) => [`"Con eso no alcanza. Vuelve con $${precio}."`, `Te faltan $${falta}.`],
      seguro: (queda) => `"¿Seguro? Te quedan $${queda}."`,
      pagar: 'SÍ, PAGAR',
      mejorNo: 'MEJOR NO',
      pagado: (precio) => [`Cuenta los $${precio} sin apuro y arranca tu cartel.`, '"Nunca te vi."'],
      // ⛓️ La fianza del de la banda que quedó preso.
      fianzaPregunta: (nombre, precio) => `"Tenemos a ${nombre} en la celda. Sale por $${precio}."`,
      fianza: (nombre, precio) => `PAGAR LA FIANZA DE ${nombre.toUpperCase()} ($${precio})`,
      fianzaNada: (nombre) => `"${nombre} se queda donde está, entonces."`,
      fianzaPagada: (nombre) => [`Abre la celda. ${nombre} sale sin mirarte.`, '"Que no lo vuelva a ver por aquí."'],
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
      mostradorEmpenos: '[E] MOSTRAR LO QUE TRAES',
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
      perista: '"Cuando tengas algo, sabes dónde estoy. Y no le digas a nadie."',
      /**
       * Con las manos vacías. No te echa: te avisa qué le interesa — y de paso
       * es donde el juego te dice, sin un tutorial, que lo del tren de carga se
       * vende acá.
       */
      peristaVacio: '"Vienes con las manos vacías. Yo compro cosas, no charlas."',
      mostradorEmpenos: 'Una tabla gastada. Aquí se apoyan las bolsas.',
      barman: '"Si buscas gente para un trabajo, mira alrededor."',
      poker: 'Cuatro sillas y una baraja. Nadie reparte todavía.',
      parroquiano: '"A mí no me mires. Yo no vi nada."',
      mesas: 'Te sientas un rato. No hay mucho más que hacer.',
      ayudante: '"El sheriff no está. Y yo no vi tu cara en ningún lado."',
      celdas: 'Vacías. Por ahora.',

      // Los que están sentados: la mitad de por qué la cantina se siente
      // llena. Antes eran figuras mudas; ahora tienen algo para decir.
      comensal1: '"La sopa está fría, pero llena."',
      comensal2: '"No hablo con forasteros. Nada personal."',
      jugador1: '"Subo la apuesta. Y no me mires así, juega."',
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
    marca: 'la rayita clara es lo que tienes hoy',

    /** El gesto entero: parado frente al que querés, apretás `E` y es tuyo. */
    comprar: (precio) => `[E] COMPRAR $${precio}`,
    comprado: (nombre) => `Ahora el ${nombre} es tuyo.`,
    yaEsTuyo: 'Ya es el tuyo.',
    faltaPlata: (falta) => `Te faltan $${falta}.`,
  },

  /**
   * 🎭 EL PLAN, ADENTRO DEL ASALTO (ver `PLAN` en data/banda.js).
   */
  /**
   * 🎭 LOS NOMBRES DE LOS RASGOS (data/rasgos.js). Habilidades y personalidades se nombran igual, sin decir cuál es
   * cuál *(Santi: "disfrazados de lo mismo")*.
   */
  /** 📅 EL TIEMPO (data/tiempo.js): las partes del día, el calendario y la carpa. */
  /**
   * 🗞️ LOS RUMORES DE TRENES DE CARGA (ver systems/horario.js): quién te lo cuenta, con el día ("jueves 21") y la vía
   * ("la Línea del Norte"). Se anotan en el horario como RUMOR: el día sí, la parte del día no.
   */
  /**
   * 🕵️ LO QUE CUENTA EL QUE FUE A MIRAR UN TREN (ver `volvioElEspia` en systems/horario.js). Los vagones, de atrás para
   * adelante, numerados como en los papeles del asalto.
   */
  espia: {
    // 🔁 En dos niveles *(Santi: "Si no tiene nada debería informar el tipo de tren, el vagón especial que tocará y el
    // objeto de la trama [...] Si tiene algo que lo ayude [...] la parte de la escolta, la cantidad de vagones y su
    // ubicación, y cuál de todas es la caja fuerte con más recompensa")*.
    basico: (nombre, cuando, via, tipo, especial) => `${nombre} volvió de mirar el tren del ${cuando} por ${via}: es ${tipo}, ${especial}.`,
    maletinVa: ' Y lleva el maletín de J.Mc.',
    completo: (lista, escolta) => ` Lleva ${lista.length} vagones (de atrás para adelante: ${lista.join(', ')}) y escolta ${escolta}.`,
    caja: (n, vagon) => ` La caja fuerte con más plata va en el vagón ${n} (${vagon}).`,
    maletin: (n, vagon, donde) => ` El maletín va en el vagón ${n} (${vagon}), ${donde}.`,
    especiales: { guardias: 'con vagón de guardias', primeraClase: 'con primera clase', armas: 'con vagón de armas', plataforma: 'sin vagón de armas' },
    falso: (nombre, via) => `${nombre} volvió de ${via}: preguntó en la estación y no sale ningún tren de carga. El rumor era falso.`,
    tarde: (nombre) => `${nombre} volvió tarde: el tren ya había pasado.`,
    tipos: { carga: 'de carga', pasajeros: 'de pasajeros' },
    vagones: {
      pasajeros: 'pasajeros', comedor: 'comedor', correo: 'correo', ganado: 'ganado', blindado: 'blindado',
      armas: 'armas', almacen: 'almacén', caboose: 'caboose', guardias: 'guardias', primeraClase: 'primera clase',
      plataforma: 'plataforma', gondola: 'góndola', refrigerado: 'refrigerado', cerrado: 'cerrado', dormitorio: 'dormitorio',
    },
  },

  rumores: {
    dias: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    vias: {
      troncal: 'la Línea de las Llanuras', mina: 'el Ramal de la Viuda', norte: 'la Línea del Norte',
      sur: 'el Ramal de San Cristóbal',
    },
    // (Santi: "Frank, al ser alcohólico, va a la cantina seguido y es el que trae los rumores".)
    // 🔁 Ya no sólo Frank: cualquiera de la banda, y dónde lo oyó según el rasgo que más pesó (ver `chanceDeRumor`).
    banda: (nombre, donde, dia, via) => `${nombre} ${donde}: dicen que el ${dia} pasa uno de carga por ${via}.`,
    dondeLoOyo: {
      alcoholico: 'volvió de la cantina',
      baraja: 'volvió de la mesa de póker',
      labia: 'le sacó charla a un guardafrenos',
      curioso: 'anduvo averiguando',
      pueblo: 'volvió del pueblo',
    },
    hoja: (dia, via) => `La hoja de ruta del encargado: el ${dia} sale uno de carga por ${via}.`,
    forastero: (dia, via) => `"Que Dios se lo pague. El ${dia} pasa uno de carga por ${via}. Lo sé de buena fuente."`,
    // 🗞️ (Lo que trae el Mentiroso: se dice que es dudoso.)
    dudoso: ' Viniendo de él, es dudoso.',
  },

  tiempo: {
    partes: { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche', madrugada: 'Madrugada' },
    // (En minúscula, para "hasta la mañana".)
    partesMin: { manana: 'mañana', tarde: 'tarde', noche: 'noche', madrugada: 'madrugada' },
    meses: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    // De lunes a domingo, como un calendario de pared.
    semana: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    // 🚂 (Para el horario: empieza el domingo, como `fechaDe(...).semana`.)
    semanaLarga: ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'],
    fecha: (dia, mes) => `${dia} de ${mes}`,
    // El cartelito del campamento: "6 de agosto · Noche".
    cartel: (fecha, parte) => `${fecha} · ${parte}`,
    secura: (nombre) => `${nombre} se cura`,
    // ✉️ La noche que pasa J.Mc.
    jmc: 'Pasa J.Mc. (de noche)',
    curado: (nombre) => `${nombre} ya está curado.`,
    ahora: (fecha, parte) => `Es el ${fecha}, a la ${parte}.`,
    carpa: {
      titulo: 'La carpa',
      cuerpo: 'El tiempo pasa sólo si lo dejas pasar.',
      descansar: (parte) => `Descansar hasta la ${parte}`,
      dormir: 'Dormir hasta la mañana',
      esperar: 'Esperar varios días',
      nada: 'Nada',
      esperarTitulo: '¿Cuántos días?',
      dias: (n, hasta) => `${n === 1 ? '1 día' : n + ' días'} (hasta el ${hasta})`,
      viene: 'Lo que viene:',
      vieneNada: 'No hay nada marcado en estos días.',
      volver: 'Mejor no',
    },
    calendario: {
      viene: 'Lo que viene',
      vieneNada: 'Nada marcado.',
      hoy: (fecha, parte) => `Hoy: ${fecha}, ${parte}`,
      ayudaMes: '[A/D] OTRO MES     [C/ESC] CERRAR',
      // 📋 (La pizarra adentro del calendario: scenes/calendario.js.)
      ayuda: '[WASD] MOVERSE   [E] TAREA   [ESPACIO] UNA PARTE   [SHIFT+ESPACIO] UN DÍA   [C] CERRAR',
      trenes: 'Trenes',
      letraParte: ['M', 'T', 'N'],
      mananaYTarde: 'mañana y tarde',
      corto: { punteria: 'PUNT', riendas: 'RIEN', cuchillero: 'CUCH', actor: 'ACTO', baraja: 'BARA', mirar: 'MIRA',
        // 📋 (Las tareas nuevas: en una barra de dos o tres casillas, y en una sola, `cortito`.)
        cazar: 'CAZA', pescar: 'PESC', pueblo: 'PUEB', comida: 'ALMA', vender: 'VEND', curar: 'CURA', cartas: 'CART', cocinar: 'COCI' },
      cortito: { cazar: 'CZ', pescar: 'PE', pueblo: 'PB', comida: 'AL', vender: 'VE', curar: 'CU', cartas: 'CT', cocinar: 'CO' },
      tren: (tipo, via, cuando, como) => `Tren de ${tipo}, ${via}, ${cuando}${como}`,
      deRumor: ' (un rumor)', delHorario: ' (del horario)', mirado: '. Ya lo miraron.',
      // 🗞️ (De dónde salió el rumor y cuánto es cierto.)
      rumorDe: {
        cantina: (n) => ` (cantina: cierto ${n} de cada 100)`,
        dudoso: (n) => ` (dudoso: cierto ${n} de cada 100)`,
        forastero: (n) => ` (forastero: cierto ${n} de cada 100)`,
        papeles: () => ' (papeles del tren: cierto)',
      },
      sinTrenes: 'No pasa ningún tren que sepas.',
      jmc: 'Esa noche pasa J.Mc.',
      noche: 'de noche descansa (las tareas de la noche vienen después)',
      descansa: 'descansa',
      practica: (hab) => `practica "${hab}"`,
      mira: (via) => `mira el tren de ${via}`,
      pesca: (dia) => `está pescando (vuelve el ${dia} a la noche)`,
      haceRumores: 'baja al pueblo a buscar rumores',
      haceComida: 'baja al almacén a comprar comida',
      hace: { cazar: 'sale a cazar', vender: 'le vende lo robado al perista', curar: 'cura a un herido', cartas: 'juega a las cartas en la cantina', cocinar: 'cocina' },
      celda: (nombre, animo, cuando, que) => `${nombre} (${animo}) · ${cuando}: ${que}`,
      yaPaso: ' (ya empezó)',
      herido: (nombre, cuando) => `${nombre} está herido: se cura el ${cuando}.`,
      oxida: (nombre, hab, dias) => `${nombre}: "${hab}", ` + (dias ? `${dias} ${dias === 1 ? 'día' : 'días'} para oxidarse` : 'se oxida hoy'),
      comida: (n, dias, comen) => `Comida: ${n} ${n === 1 ? 'porción' : 'porciones'}, ` + (dias ? `alcanza para ${dias} ${dias === 1 ? 'día' : 'días'}` : 'no alcanza ni para mañana') + ` (comen ${comen}).`,
      menuTitulo: (nombre, cuando) => `${nombre}, ${cuando}`,
      menuPracticar: (hab, la) => `Practicar "${hab}"` + (la ? ' (ya la tiene)' : ''),
      menuMirar: 'Mirar un tren',
      menuPracticarCual: 'Practicar…',
      practicarTitulo: (nombre) => `¿Qué practica ${nombre}?`,
      menuCon: (texto, rasgos) => `${texto} (${rasgos})`,
      menuCazar: 'Salir a cazar',
      menuPescar: 'Ir a pescar (dos días)',
      menuRumores: 'Bajar al pueblo a buscar rumores',
      menuComida: (dias) => `Bajar al almacén a comprar comida (para ${dias} días)`,
      menuVender: 'Venderle lo robado al perista',
      // 🧪 (La química con el perista, si ya le conoces algo: "lo pone nervioso 80 de 100".)
      menuQuimica: (texto, cosas) => texto + ' · ' + cosas.join(', '),
      quimica: (id, chance) => ({
        idioma: 'hablan el mismo idioma', palabra: 'gente de palabra', loEnfrenta: 'no se deja chantajear',
        noSeEntienden: 'no se entienden', niSeInmuta: 'no se deja chantajear', nervioso: 'lo pone nervioso',
        porFuera: 'se arreglan por fuera', seCaenBien: 'se caen bien', loCalma: 'lo calma', loAsusta: 'lo asusta',
        pelea: 'se pelean', loHuele: 'le huele el miedo', aEspaldas: 'se arreglan por fuera',
      }[id] || id) + ' ' + chance + ' de 100',
      menuCurar: 'Curar a un herido',
      menuCartas: 'Jugar a las cartas en la cantina',
      menuCocinar: 'Cocinar',
      menuDescansar: 'Descansar',
      menuNada: 'Dejarlo así',
      menuCuerpo: 'Practicar y mirar un tren ocupan la mañana y la tarde; cazar, la mañana; pescar, dos días. Lo que pones sigue los días que siguen, hasta que lo cambies; mirar, pescar y vender son sólo ese día.',
      menuCuerpoNoche: 'A las cartas se juega una vez entre golpe y golpe.',
      mirarTitulo: (nombre) => `¿Qué tren va a mirar ${nombre}?`,
    },
  },

  rasgos: {
    // Habilidades.
    punteria: 'Buena puntería', riendas: 'Veloz en las riendas', cuchillero: 'Buen cuchillero', ganzua: 'Ganzúa',
    manoLigera: 'Mano ligera', actor: 'Buen actor', aguante: 'Aguante', baraja: 'Bueno con la baraja', labia: 'Labia',
    negociante: 'Buen negociante', vista: 'Buena vista', rastreador: 'Rastreador', telegrafista: 'Telegrafista',
    cocinero: 'Cocinero', curandero: 'Curandero', dinamitero: 'Dinamitero', leer: 'Sabe leer',
    // Personalidades.
    valiente: 'Valiente', cobarde: 'Cobarde', ambicioso: 'Ambicioso', conformista: 'Conformista', frio: 'Frío',
    sentimental: 'Sentimental', egoista: 'Egoísta', generoso: 'Generoso', honorable: 'Honorable', rastrero: 'Rastrero',
    confiable: 'Confiable', mentiroso: 'Mentiroso', paciente: 'Paciente', impulsivo: 'Impulsivo', orgulloso: 'Orgulloso',
    humilde: 'Humilde', pendenciero: 'Pendenciero', pacifico: 'Pacífico', supersticioso: 'Supersticioso',
    esceptico: 'Escéptico', divertido: 'Divertido', serio: 'Serio', alcoholico: 'Alcohólico', vengativo: 'Vengativo',
    curioso: 'Curioso', jugador: 'Jugador', loco: 'Loco',
  },

  /**
   * 🔖 LO QUE HACE CADA RASGO, en corto, para el cartelito que sale al pasar el mouse por un sello de la ficha *(Santi,
   * 2026-11-23: "al pasar el cursor por encima te dice que es ese rasgo y brevemente que hace")*. Sale de las tablas
   * de BANDA-NUEVA.md ("Las habilidades" y "Las personalidades"). Los que todavía no hacen nada no tienen.
   */
  rasgosQueHace: {
    tipo: { habilidad: 'Habilidad', personalidad: 'Personalidad' },
    punteria: 'De vigía, además de avisar, dispara. En la huida tumba a un jinete. Siempre vuelve con caza.',
    riendas: 'Con los caballos rinde más. En la huida lo hieren la mitad de las veces.',
    cuchillero: 'De pasajero rinde más. En una pelea de la fogata, el herido es siempre el otro.',
    ganzua: 'Abre puertas trabadas y cajas sin llave. Con él en la banda, revisas el maletín en la mitad del tiempo.',
    manoLigera: 'De pasajero roba bolsillos. En las cartas también, aunque a veces lo ven.',
    actor: 'De pasajero rinde más. Le miente al sheriff: la fianza sale a la mitad.',
    aguante: 'Puede ir herido a un golpe. Sus heridas duran la mitad.',
    baraja: 'Gana a las cartas y saca más rumores.',
    labia: 'Saca más rumores, calma las discusiones y consigue gente más barata.',
    negociante: 'El perista le paga mejor y en la armería le cobran menos.',
    vista: 'De vigía rinde más, también de noche. Al mirar un tren, lo ve todo.',
    rastreador: 'En la huida recupera la mitad de las bolsas que se caen. Sabe encontrar al traidor.',
    telegrafista: 'En el telégrafo rinde más. En la estación consigue un rumor cierto.',
    cocinero: 'Cocina la caza del día y te cura un poco. En el pueblo puede vender guisos.',
    curandero: 'Las heridas se curan tres días antes. Cose esa misma noche al herido de una pelea.',
    dinamitero: 'Se encarga de la dinamita.',
    leer: 'Lee los papeles del tren y el diario: rumores ciertos. Puede abrir el maletín.',
    honorable: 'Nunca te vende. Pero se queja de cada golpe con civiles muertos.',
    valiente: 'No huye y cuesta atraparlo. Pero en la huida lo hieren el doble.',
    sentimental: 'Cada favor le pesa el doble. Cada queja, también.',
    alcoholico: 'Con una botella olvida una queja y saca más rumores. Al otro día, resaca.',
    confiable: 'Aunque esté furioso, va igual. Pero si rompes tu palabra, se queja el doble.',
    divertido: 'En la fogata le borra quejas a otro. Si pasa tres días sin cartas, se aburre y se queja.',
    frio: 'Las heridas no le dejan quejas. Pero le cuesta cambiar lo que piensa de ti.',
    egoista: 'Preso, se escapa solo. Pero si se va, se lleva un cuarto de tu bolsa.',
    serio: 'Su humor casi no se mueve. Pero nadie lo levanta, y ganar una discusión no le importa.',
    cobarde: 'En la huida nunca lo hieren. Pero no dispara.',
    ambicioso: 'Si le das lo que espera, rinde más. Pero espera más que los otros.',
    rastrero: 'Nunca dice que no. Pero es más fácil que te traicione.',
    pendenciero: 'De pasajero los guardias se rinden antes. Pero en el pueblo se mete en peleas.',
    mentiroso: 'De pasajero tardan en descubrirlo. Pero sus rumores son dudosos.',
    curioso: 'Ve mucho y saca más rumores. Pero se mete en tus secretos.',
    pacifico: 'Para las peleas de la fogata. Pero no acuchilla ni dispara.',
  },

  plan: {
    // Lo que te dice el pasajero al subir.
    datos: (quien, cajas, guardias) => `${quien}: ${cajas.length ? (cajas.length === 1 ? 'LA CAJA FUERTE VA EN EL VAGÓN ' + cajas[0] : 'HAY CAJAS FUERTES EN LOS VAGONES ' + cajas.slice(0, -1).join(', ') + ' Y ' + cajas[cajas.length - 1]) : 'NO HAY CAJA FUERTE'} · ${guardias} GUARDIAS EN EL TREN`,
    comoDistraer: (quien) => `[Q] ${quien} DISTRAE A UN GUARDIA (UNA VEZ)`,
    // 🎭 Lo que te dice cuando le hablás (Santi, 2026-11-14).
    hablar: (quien) => `[E] HABLAR CON ${quien}`,
    psst: 'PSST…',
    // 🐎 Llamar al de los caballos desde un enganche.
    llamar: (quien) => `[E] LLAMAR A ${quien} CON LOS CABALLOS`,
    viene: (quien) => `${quien} VIENE CON LOS CABALLOS`,
    noViene: (quien) => `${quien} NO VIENE: SÓLO TE ESPERA DONDE ENTRASTE`,
    // ⛓️ El pasajero de la banda esposado, tirado, liberado; y esperarlo en el caballo.
    esposaron: (quien) => `ESPOSARON A ${quien}`,
    tirado: (quien) => `${quien} QUEDÓ TIRADO`,
    liberar: (quien) => `[E] LIBERAR A ${quien}`,
    levantar: (quien) => `[E] LEVANTAR A ${quien}`,
    vamos: '¡VAMOS!',
    soltar: (quien) => `[E] SOLTAR A ${quien}`,
    agarrar: (quien) => `[E] AGARRAR A ${quien}`,
    esperandoA: (quien) => `ESPERANDO A ${quien}`,
    atrapado: (quien, tirado) => tirado ? `${quien} ESTÁ TIRADO` : `${quien} ESTÁ ESPOSADO`,
    irseSinEl: 'MANTÉN [E] PARA IRTE SIN ÉL',
    loVieron: (quien) => `¡VIERON A ${quien}!`,
    oculta: (vagon, donde) => `LA CAJA OCULTA ESTÁ EN EL VAGÓN ${vagon}, ${donde}`,
    sinOculta: 'ESTE TREN NO TRAE CAJA OCULTA',
    cajas: (cajas) => cajas.length === 0 ? 'NO HAY OTRAS CAJAS FUERTES'
      : cajas.length === 1 ? `HAY UNA CAJA FUERTE EN EL VAGÓN ${cajas[0]}`
      : `HAY CAJAS FUERTES EN LOS VAGONES ${cajas.slice(0, -1).join(', ')} Y ${cajas[cajas.length - 1]}`,
    distrae: (quien) => `${quien} LO DISTRAE`,
    nadieCerca: 'NO HAY NINGÚN GUARDIA CERCA',
    caballoNoEsta: (quien) => quien ? `¡${quien} NO LLEGÓ CON EL CABALLO!` : '¡NADIE TRAJO EL CABALLO!',
    esperando: (s) => `EL CABALLO TODAVÍA NO LLEGA · ${s}`,
    llego: (quien) => quien ? `¡AHÍ VIENE ${quien} CON EL CABALLO!` : '¡AHÍ VIENE EL CABALLO!',
    // 📡 🔭 Cómo le fue al del telégrafo y al vigía (se dice al rato de subir), y el grito del vigía.
    telegrafo: {
      bien: (quien) => `${quien} CORTÓ EL CABLE: LA LEY SALE CON DOS MENOS`,
      flojo: (quien) => `${quien} CORTÓ EL CABLE TARDE: LA LEY SALE CON UNO MENOS`,
      mal: (quien) => `${quien} NO PUDO CORTAR EL CABLE`,
    },
    vigia: {
      bien: (quien) => `${quien} VIGILA DESDE LA LOMA`,
      flojo: (quien) => `${quien} VIGILA, PERO DE LEJOS`,
      mal: (quien) => `${quien} NO VE NADA DESDE LA LOMA`,
    },
    vigiaGrita: (quien) => `¡${quien} GRITA: VIENEN DE LA LOCOMOTORA!`,
  },
  /**
   * 📒 LA LIBRETA (BANDA-NUEVA.md, etapa 2): lo que cada uno anota de lo que le hiciste. Con su voz, en primera persona
   * ("Me diste poco"). `motivos`: una clave de evento ('pedidoSi') o de momento ('m:forastero'), con el texto del
   * favor (`f`) y el de la queja (`q`), o uno solo.
   */
  libreta: {
    animo: { conGanas: 'con ganas', tranquilo: 'tranquilo', deMalas: 'de malas', furioso: 'furioso' },
    anota: (nombre, lado, texto, veces = 1) => (lado === 'borra'
      ? `${nombre} se olvida de una queja: "${texto}".`
      : `${nombre} lo anota${veces > 1 ? ' dos veces' : ''}: ${lado === 'f' ? 'favor' : 'queja'}, "${texto}".`),
    // Los pasos del pronóstico, con su motivo (ver `pronostico` en data/banda.js).
    pasos: { habilidad: 'sabe hacerlo', conGanas: 'con ganas', malaGana: 'de malas', malaGanaSerio: 'de malas, pero es serio', enemigo: 'con su enemigo', lealtad: 'a punto de irse', resaca: 'con resaca', noche: 'de noche', madrugada: 'de madrugada' },
    pronostico: (nombre, bien) => `${nombre}: SALE BIEN ${bien} DE CADA 100`,
    // 🎚️ Lo que contradice una personalidad (ver `BAJA` en data/rasgos.js): la cuenta, y cuando baja.
    baja: {
      por: {
        honorable: 'otro golpe con civiles', valiente: 'lo hirieron', sentimental: 'se fue uno de la banda',
        alcoholico: 'le sacaste la botella', confiable: 'rompiste tu palabra', divertido: 'se aburre',
        frio: 'lo dejaste preso', egoista: 'fuiste generoso con él', serio: 'volvió con ganas',
      },
      porOtro: 'algo lo cambió',
      cuenta: (nombre, rasgo, por, n, de) => `${nombre}, ${rasgo} (${n} de ${de}): ${por}.`,
      bajo: (nombre, rasgo, por, ahora) => `${nombre}, ${rasgo}: ${por}. Se le gasta: queda en ${ahora} de 100.`,
    },
    motivos: {
      otroFavor: 'Le gustó lo que hiciste',
      otraQueja: 'No le gustó lo que hiciste',
      pedidoSi: 'Me diste lo que pedí',
      pedidoNo: 'No me diste lo que pedí',
      peleaGana: 'Me diste la razón',
      peleaPierde: 'Le diste la razón al otro',
      repartoParejo: 'Repartiste parejo',
      repartoGuardo: 'Te guardaste el botín',
      herido: 'Me hirieron',
      dejadoAtras: 'Me dejaste preso',
      abandonado: 'Me dejaste solo',
      fianza: 'Pagaste mi fianza',
      civilesHonorable: 'Mataste civiles',
      civilesSentimental: 'Mataste civiles',
      adelanteCumplido: 'Me mandaste adelante',
      salioBien: 'Salió bien',
      promesaTommy: { f: 'Cumpliste tu palabra', q: 'Rompiste tu palabra' },
      'm:encargo': { f: 'Me contaste lo de J.Mc.', q: 'No me contaste lo de J.Mc.' },
      'm:entrega': { f: 'Hiciste bien con J.Mc.', q: 'No me gustó lo de J.Mc.' },
      'm:plazo': { f: 'Hiciste bien con J.Mc.', q: 'No cumpliste con J.Mc.' },
      'm:tommyEntrar': { f: 'Me prometiste ir adentro', q: 'No me dejaste entrar' },
      'm:mexico': { f: 'Me diste para mi familia', q: 'No me diste para mi familia' },
      'm:reparto': { f: 'Me diste mi parte', q: 'No me diste mi parte' },
      'm:civiles': { f: 'Pediste perdón por los civiles', q: 'No me gustó lo de los civiles' },
      'm:herido': { f: 'Me pagaste el médico', q: 'No me pagaste el médico' },
      'm:caballoTarde': { f: 'Me dejaste pasar lo del caballo', q: 'Me reprochaste lo del caballo' },
      'm:deMas': { f: 'Me diste algo de más', q: 'Te quedaste con todo' },
      'm:miParte': { f: 'Me diste mi parte', q: 'No me diste mi parte' },
      'm:adelante': { f: 'Me dejaste ir adelante', q: 'No me dejaste ir adelante' },
      'm:forastero': { f: 'Ayudaste al forastero', q: 'Echaste al forastero' },
      // (🔥 La fogata.)
      'm:discusion': { f: 'Me diste la razón', q: 'Le diste la razón al otro' },
      'm:pelea': { f: 'Paraste la pelea', q: 'No paraste la pelea' },
      // (💰 El reparto, por cabeza: scenes/reparto.js.)
      repartoNada: 'No me diste nada',
      repartoPoco: 'Me diste poco',
      repartoMiseria: 'Una miseria',
      repartoGeneroso: 'Fuiste generoso',
      repartoYaNo: 'Ya no me das como antes',
      olla: 'No hubo para la olla',
      // (🤝 El chantaje o el soplo del perista: TRATOS.md, "La banda".)
      peristaSucio: 'Nos ensuciamos con el perista',
      // (😄 El Divertido, a los días sin cartas.)
      meAburro: 'Me aburro',
      // (🔥 La fogata.)
      nadieNosEscucho: 'Nadie nos escuchó',
      laPelea: 'Me lastimaron en la pelea',
      peristaDuro: 'Así se trata a un perista',
      comida: 'No hubo qué comer',
      // (😈 La señal: acusaste al que no era; le pagaste dos veces a otro; echaste a su amigo.)
      meAcusaste: 'Me acusaste sin razón',
      loQuePidio: 'A él le diste, a mí no',
      echasteAMiAmigo: 'Echaste a mi amigo',
    },
    /** 💰 LA PANTALLA DEL REPARTO (scenes/reparto.js). */
    reparto: {
      titulo: 'EL REPARTO',
      botin: (n) => 'BOTÍN: $' + n,
      fue: { caballos: 'Fue con los caballos', pasajero: 'Fue de pasajero', telegrafo: 'Fue al telégrafo', vigia: 'Fue de vigía' },
      quedo: 'Se quedó',
      espera: 'ESPERA',
      leDas: 'LE DAS',
      anota: 'LO QUE ANOTA',
      favor: (t) => 'Favor: ' + t,
      queja: (t) => 'Queja: ' + t,
      quejaDoble: (t) => 'Queja doble: ' + t,
      loEspera: 'Ya lo espera',
      nada: 'Conforme',
      bolsa: (tienes, quedan) => 'TU BOLSA: $' + tienes + '   TE QUEDAN: $' + quedan,
      botones: { espera: '[1] LO QUE ESPERAN', generoso: '[2] GENEROSO', nada: '[3] NADA' },
      ayuda: '[W][S] ELEGIR   [A][D] DE A $5   [E] REPARTIR',
      jmc: (lleva, debe) => 'J.MC.: $' + lleva + (debe ? '  (LE DEBERÁS $' + debe + ')' : ''),
      // 🍲 (La olla de los días de la vuelta, que se paga al repartir.)
      olla: (costo) => 'OLLA: $' + costo,
      sinOlla: (costo) => 'OLLA: $' + costo + ' (NO ALCANZA)',
      ollaPaga: (costo) => 'La olla de los días de vuelta: $' + costo + '.',
      ollaNo: (costo) => 'No alcanzó para la olla de los días de vuelta ($' + costo + '): la banda no comió, y se queja.',
      hecho: (total) => 'Repartiste $' + total + '.',
      nadieAnota: 'Nadie anota nada.',
    },
  },
  /**
   * 😈 LA TENTACIÓN, LAS SEÑALES Y LAS TRAICIONES (etapa 5, parte 1; data/tentacion.js, systems/tentacion.js).
   * ⚠️ PROVISORIOS: los reescribimos cuando esté la historia de cada uno *(Santi, 2026-11-22: armar los personajes "como
   * se arma para escribir novelas")*. Cada uno con su voz (VOCES.md): Santiago dice "McCoy"; Frank, "jefe"; Tommy
   * habla de usted.
   */
  tentacion: {
    noticias: {
      tramo: (region) => ({
        pradera: 'Dejaron atrás el desierto. En la pradera hay más pueblos, más trenes y más gente que ofrece cosas.',
        bosque: 'Entraron al bosque. Aquí nadie los conoce, y eso a algunos les da ideas.',
        montana: 'Empiezan a subir a la montaña. El final está cerca, y cada uno piensa en lo suyo.',
      }[region] || 'Llegaron a otra parte del viaje.'),
      oferta: (nombre, tipo) => ({
        otraBanda: `En el pueblo, unos hombres de otra banda le ofrecieron a ${nombre} irse con ellos.`,
        mujer: `${nombre} conoció a una mujer en el pueblo. Habla de quedarse.`,
      }[tipo] || `A ${nombre} le ofrecieron algo en el pueblo. No dice qué.`),
      // 😈 (Cuando el Cuervo no suena: la historia del desierto.)
      ofertaSinFama: (nombre, dias) => `Hace ${dias} días que nadie habla del Cuervo. Unos jinetes de otra banda pasaron cerca del campamento y hablaron con ${nombre}: "Con ese no vas a ningún lado. Vente con nosotros."`,
      ofertaLey: (nombre) => `Tu cabeza ya vale mucho. Alguien de la ley le habló a ${nombre}: el perdón, a cambio de entregarte.`,
      senal: (nombre) => ({
        Santiago: 'Santiago volvió del pueblo con botas nuevas. No dice de dónde sacó la plata.',
        Frank: 'Frank pasó la noche hablando con unos jinetes que no son de aquí. Cuando te acercaste, se callaron.',
        Tommy: 'Tommy escribió una carta y no te dijo para quién.',
      }[nombre] || `${nombre} anda raro: se calla cuando llegas.`) + ' Si sales al próximo golpe así, no va a estar.',
      senalDos: (a, b) => `Alguien volvió del pueblo con botas nuevas: ${a} o ${b}. No sabes cuál. Si sales al próximo golpe así, no va a estar.`,
      traicion: (nombre, como, plata) => ({
        seFue: `${nombre} no apareció en la vía. Se fue de la banda.`,
        seFueConPlata: `${nombre} no apareció en la vía. Cuando volviste, faltaba su manta… y $${plata} de tu bolsa.`,
        vendio: `${nombre} no apareció en la vía: le vendió tus planes a la ley. Van a estar esperándote.`,
      }[como] || `${nombre} se fue de la banda.`),
      leyEspera: (perdido) => `La ley sabía que venías y te estaba esperando: perdiste la mitad del botín ($${perdido}).`,
    },
    /** Lo que se habla con el de la señal (en la charla de siempre, la primera opción). */
    charla: {
      opcion: 'Tenemos que hablar',
      texto: (nombre) => ({
        Santiago: '"¿Las botas? Las gané a las cartas, McCoy." No te mira. "Aunque si la parte fuera más grande, uno no tendría que andar buscando."',
        Frank: '"Me ofrecieron un trabajo, jefe. Mejor paga, menos tiros." Escupe al fuego. "No dije que sí. Todavía."',
        Tommy: '"No es nada, señor." Guarda la carta. "Sólo… a veces pienso si esto es lo que yo quería."',
      }[nombre] || `${nombre} no te mira a los ojos.`),
      duda: (a, b) => `Uno de los dos, ${a} o ${b}, anda en algo. No sabes cuál.`,
      yaNo: 'Ya no alcanza con plata.',
      pagar: (n) => `Darle lo que pide para quedarse (−$${n})`,
      acusar: (n) => `Es él: darle lo que pide (−$${n})`,
      vigilar: (n) => `Vigilarlo esta noche (−$${n})`,
      vigilarGratis: (n) => `Que ${n} lo siga esta noche`,
      echar: 'Echarlo de la banda',
      ahoraNo: 'Ahora no',
      pagado: (nombre, n) => `Le das $${n}. ${nombre} los guarda sin decir nada.`,
      sigue: (nombre) => `Pero ${nombre} sigue pensando en irse: todavía lo tienta.`,
      seQueda: (nombre) => `Por ahora, ${nombre} se queda.`,
      esEl: (nombre) => `Lo sigues hasta el pueblo. Era ${nombre}.`,
      noEsEl: (nombre, real) => `Lo sigues toda la noche: ${nombre} no hizo nada raro. Era ${real}.`,
      equivocado: (nombre) => `No era ${nombre}. Te mira como si no te conociera.`,
      // (Acusaste al que no era: el de la señal se va esa misma noche.)
      seVaDeNoche: (nombre, como, plata) => ({
        seFue: `${nombre} juntó sus cosas antes del amanecer y se fue.`,
        seFueConPlata: `${nombre} se fue antes del amanecer. Con él se fueron $${plata} de tu bolsa.`,
        vendio: `${nombre} se fue antes del amanecer, a contarle tus planes a la ley.`,
      }[como] || `${nombre} se fue de la banda.`),
      echado: (nombre, n) => `Le dices que se vaya. ${nombre} junta sus cosas y se va sin mirar atrás. Sabe tus planes: tu recompensa sube $${n} y la ley te va a estar esperando en el próximo golpe.`,
    },
    /** El papelito del plan, si sales con la señal. */
    plan: 'TIENE LA SEÑAL: SI SALES, NO VA',
    ficha: { tentacion: 'Tentación', senal: 'SEÑAL', duda: '¿SEÑAL?' },
  },
  mapa: {
    subtitulo: 'RUTAS DEL FERROCARRIL',
    ayuda: 'PASA EL CURSOR POR UNA VÍA',
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
    /**
     * 🎭 EL PLAN: quién hace cada papel en el próximo asalto (ver PAPELES en data/banda.js) *(Santi eligió repartirlos
     * en el mapa)*. Con un clic en el renglón, o con [1] y [2], va pasando por los que pueden ir y por "nadie".
     */
    plan: 'EL PLAN',
    papeles: { caballos: '[1] CABALLOS', pasajero: '[2] PASAJERO', telegrafo: '[3] TELÉGRAFO', vigia: '[4] VIGÍA' },
    nadie: 'NADIE',
    // 🙅 Cuando uno no quiere el puesto hoy (por su humor o por quién es).
    noQuiere: (nombre) => `${nombre} NO QUIERE`,
    sinTrenAhora: 'NINGUNO A LA VISTA',
    /**
     * 🚂 EL HORARIO, en el cartucho (ver `dibujarCartucho` en scenes/mapScene.js): el título, cada renglón ("JUEVES 21,
     * NOCHE · CARGA"), lo que cuesta el viaje a la vía y el tren al que ya no llegás.
     */
    horario: 'EL HORARIO · [ESC] VOLVER',
    dia: (semana, n) => `${semana} ${n}`,
    viaje: (n) => (n === 1 ? 'VIAJE: 1 PARTE' : `VIAJE: ${n} PARTES`),
    noLlegas: 'NO LLEGAS',
    sinTrenes: 'NO HAY TRENES ANOTADOS',
    // 🗞️ Un tren del que sólo te contaron, y el segundo clic para ir a esperar a una vía.
    rumor: 'RUMOR',
    // 🗞️ De dónde salió el rumor y cuántas de cada 100 es cierto (los papeles, siempre).
    rumorDe: {
      cantina: (n) => `CANTINA ${n}/100`, dudoso: (n) => `DUDOSO ${n}/100`, forastero: (n) => `FORASTERO ${n}/100`,
      papeles: () => 'PAPELES: CIERTO',
    },
    esperarOtraVez: 'CLIC OTRA VEZ: ESPERAR AQUÍ',
    // 🕵️ Uno que fue a mirar alguien de la banda: el renglón y, señalándolo, la escolta y el vagón del maletín.
    visto: 'VISTO',
    cierto: 'CIERTO',
    escolta: (s) => `ESCOLTA ${s}`,
    cajaEn: (n) => ` · CAJA: V${n}`,
    maletinEn: (n) => ` · MALETÍN: V${n}`,
    conMaletin: ' · CON EL MALETÍN',
    especial: { guardias: 'CON GUARDIAS', primeraClase: 'CON PRIMERA CLASE', armas: 'CON VAGÓN DE ARMAS', plataforma: 'SIN VAGÓN DE ARMAS' },
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
    rendicion: 'TE RENDISTE',

    subEscaped: 'Llegaste al furgón de cola y saltaste. El caballo estaba ahí.',
    subPrueba: (lo) => `Prueba ${lo}. No cuenta para nada.`,
    subTime: 'Tu caballo no dio más y se quedó atrás. El tren llegó a la estación contigo adentro.',
    subDead: 'Caíste herido. Te esposaron ahí mismo.',
    subRendicion: 'Levantaste las manos. Te esposaron sin un tiro más.',
    // Lo que te ahorraste por rendirte: los $300 de que te agarren (CONFIG.bounty.capturaFlat).
    rendicionAhorro: 'Por rendirte, no te suman',

    loot: 'Botín',
    /**
     * LA MERCADERÍA NO DICE UN PRECIO, DICE CUÁNTAS COSAS SON. Todavía no vale
     * plata: vale lo que te pague el que te la compre.
     */
    objetos: (n) => (n === 1 ? 'Te llevaste 1 cosa' : `Te llevaste ${n} cosas`),
    objetosSinVender: 'Sin vender',
    // Perdiste, pero el caballo volvió con las alforjas: marcadas.
    objetosCaballo: (n) => (n === 1 ? 'Tu caballo volvió con 1 cosa' : `Tu caballo volvió con ${n} cosas`),
    objetosMarcados: 'Marcadas',
    clean: 'Trabajo limpio',
    racha: (n) => `Racha limpia (${n})`,
    rachaPerdida: (n) => `Se cortó la racha (llevabas ${n})`,
    rescate: 'Casi lo logras',
    /** La huida: lo que soltaste con los jinetes detrás (ver scenes/huidaScene.js). */
    huida: (n) => (n === 0 ? 'La huida: no te tocaron' : n === 1 ? 'La huida: soltaste 1 bolsa' : `La huida: soltaste ${n} bolsas`),
    huidaJinetes: (n) => (n === 1 ? 'Jinete derribado en la huida' : 'Jinetes derribados en la huida'),
    huidaTirados: (n) => (n === 1 ? 'Jinete que tiraste del caballo' : 'Jinetes que tiraste del caballo'),
    // 📡 🔭 El telégrafo y el vigía.
    papel: { telegrafo: (n) => `${n}, en el telégrafo`, vigia: (n) => `${n}, de vigía` },
    papelRes: {
      telegrafo: { bien: 'Cortó el cable: dos jinetes menos', flojo: 'Lo cortó tarde: un jinete menos', mal: 'No lo pudo cortar' },
      vigia: { bien: 'Vio venir los refuerzos: 20 s más', flojo: 'Los vio tarde: 10 s más', mal: 'No vio nada' },
    },
    huidaQuebrada: 'Cómo te los sacaste',
    huidaQuebradaSi: (lugar) => `te metiste en ${lugar.toLowerCase()}`,
    /** Los premios de cada refugio (ver data/huida.js, `mundo.premios`). */
    huidaPremioBolsa: (n) => (n === 1
      ? 'Bolsa que rescataste en la quebrada'
      : `Bolsas que rescataste en la quebrada (${n})`),
    /** 💰 Quedaron todos muertos: volviste a buscar la mitad de lo que se te cayó. */
    huidaRecogidas: (n) => (n === 1
      ? 'Bolsa que recogiste del camino'
      : `Bolsas que recogiste del camino (${n})`),
    /** 🐎 El que se separó con [F] y dejaste solo. */
    huidaAbandonado: (nombre) => `${nombre}, al que dejaste solo`,
    huidaAbandonadoComo: { sano: 'volvió sano', herido: 'volvió herido', preso: 'lo agarró la ley' },
    huidaPreso: (nombre) => `${nombre}, en la huida`,
    huidaPresoComo: 'lo agarró la ley',
    huidaPremioBosque: (n) => (n === 1
      ? 'El bosque tapó a tu muerto'
      : `El bosque tapó a tus ${n} muertos`),
    lost: 'Botín que dejaste',
    kills: 'Guardias muertos',
    civilians: 'Civiles muertos',
    companero: 'Tu compañero',
    companeroFinal: { escapo: 'se fue contigo', quedo: 'quedó en el tren', cayo: 'cayó' },
    companeroMuertos: 'Los que mató él',
    companeroBotin: (plata, cosas) => [plata ? `$${plata}` : '', cosas ? `${cosas} ${cosas === 1 ? 'cosa' : 'cosas'}` : ''].filter(Boolean).join(' y '),
    companeroTrajo: 'Lo que robó él',
    companeroSeLlevo: 'Lo que se llevó él',
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
    fama: 'Se habla de ti',
    famaCuervo: 'La fama del Cuervo',
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

    deuda: 'Lo que pedían por ti',
    pagado: 'Lo que pagaste',
    restante: 'Lo que sigues debiendo',
    queda: 'Lo que te queda',

    /** El aviso de cuánto falta para la horca. Es la cuenta regresiva. */
    margen: (falta, umbral) => `A los $${umbral} no hay fianza que valga. Te faltan $${falta}.`,
    margenLimpio: (umbral) => `Sales sin deudas. Te cuelgan si alguna vez llegas a los $${umbral}.`,
    salir: 'VOLVER AL CAMPAMENTO  [R]',

    // --- Te cuelgan ---
    subHorca: 'Tu cabeza valía demasiado. No hubo fianza que alcanzara.',
    notaHorca: 'Se termina aquí. Otro forajido empezará mañana, con las manos vacías.',
    asaltos: 'Trenes que asaltaste',
    escapes: 'Veces que escapaste',
    muertos: 'Gente que mataste',
    robado: 'Lo que llegaste a juntar',
    deNuevo: 'EMPEZAR DE NUEVO  [R]',
  },
};
