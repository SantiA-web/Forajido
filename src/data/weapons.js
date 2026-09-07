/**
 * Catálogo de armas. Agregar un arma nueva = agregar una entrada acá.
 * Ningún sistema debe conocer los nombres de las armas por dentro.
 *
 * EL COLT ES LA VARA. Sus números no significan nada en el aire: significan
 * algo en relación a las armas que van a existir. Está afinado a propósito con
 * lugar para arriba y para abajo — si el Colt disparara rapidísimo, el Smith no
 * tendría cómo ser "más rápido" sin volverse absurdo, y si llegara lejísimos,
 * el Rifle de Caza no tendría con qué distinguirse.
 *
 * Y no es "el arma débil que vas a reemplazar": es el arma que te obliga a
 * jugar con cuidado. Con guardias de 3 de vida son dos por tambor y después
 * TRES segundos vendido recargando, así que no podés abrir fuego alegremente.
 * La tienda, más adelante, no te va a vender poder: te va a vender permiso
 * para hacer ruido.
 */

export const WEAPONS = {
  colt: {
    id: 'colt',
    name: 'Revólver Colt',
    short: 'COLT',
    damage: 1,           // 2, 3 o 4 tiros según el guardia
    fireRate: 0.40,      // segundos entre disparos
    magazine: 6,
    /**
     * Se recarga por la compuerta, bala por bala — de a una, contando. El
     * Smith & Wesson de la época se partía al medio y expulsaba las seis de
     * un saque: la brecha (3,0 contra 1,0) no es licencia de diseño, es la
     * diferencia que había de verdad entre los dos revólveres.
     *
     * Subió de 2,0 a 3,0 y después a 3,5, las dos veces jugando. Con 2,0 un
     * segundo de diferencia contra el Smith no se sentía a nada — "en la
     * práctica no se siente que haya valido cada centavo". Con 3,5 son DOS
     * SEGUNDOS Y MEDIO de diferencia: el Colt tarda tres veces y media lo que
     * el Smith, y esa es la clase de número que se nota parado detrás de un
     * asiento con alguien asomándose.
     */
    reloadTime: 3.5,
    bulletSpeed: 330,
    spread: 0.035,       // preciso: esa es su virtud

    /**
     * CUÁNTO CIERRA AL APUNTAR (clic derecho). Ver CONFIG.mira.
     *
     * 🐛 ERA 0,010 (un tercio de `spread`), Y CON LA MIRA DIBUJADA ESO LO
     * VOLVÍA UN RIFLE.
     *
     * *(Santi, jugando: "por más que el Colt tenga más puntería que el Smith,
     * no puede parecer un rifle")*
     *
     * A la distancia normal de un tiroteo (60-120px), 0,010 daba un círculo
     * de 1-2px: por debajo del piso de dibujo, así que en la práctica se veía
     * un puntito clavado sin abertura — la misma lectura que un arma de mira
     * telescópica, no la de un revólver bien sostenido.
     *
     * LA REGLA NUEVA, Y ES LA MISMA PARA LAS DOS ARMAS: **apuntar corta la
     * dispersión A LA MITAD, siempre.** No es sólo más prolijo que dos números
     * sueltos por arma — es lo que evita que cualquier revólver futuro pueda
     * volverse sniper por apuntar: hay un tope de cuánto ayuda el gesto,
     * pareja para todo el catálogo. El Colt sigue siendo el más fino del
     * juego (0,0175 contra 0,0425 del Smith apuntado) pero el círculo ya no
     * desaparece: sigue habiendo una moneda al aire, chica, pero real.
     */
    spreadApuntado: 0.0175,

    /**
     * EL RETROCESO — cada disparo te ensucia el próximo, un rato.
     *
     * *(idea de Santi: "que al disparar haya un pequeño retroceso, dependiendo
     * el arma, que agrande el círculo tanto apuntando como sin apuntar. Obvio
     * que apuntando el retroceso va a ser menor")*
     *
     * Se suma a `dispersionActual()` (entities/player.js) — el MISMO mecanismo
     * que ya usa el sacudón del tren (`CONFIG.traqueteo.dispersionExtra`), sólo
     * que ahora lo dispara cada tiro tuyo en vez del vagón entero. Por eso se
     * ve en el círculo Y afecta la bala real a la vez, sin un sistema aparte.
     *
     * `retroceso: 0,0175` es el 50% de `spread` (0,035) — decidido con Santi
     * después de mostrarle el radio resultante. Apuntando pesa la mitad de
     * ESTE número (la misma regla de `spreadApuntado`, aplicada de nuevo), y
     * se apaga solo en `CONFIG.mira.retrocesoDecayTiempo` (0,40s) si no volvés
     * a disparar — que es EXACTAMENTE la cadencia del Colt (`fireRate`). No es
     * casualidad: a su ritmo normal, el retroceso de un tiro termina de bajar
     * justo cuando sale el siguiente — el Colt disparado con calma nunca lo
     * acumula. El Smith (más rápido) o una ráfaga de pánico sí, porque no le
     * da tiempo a bajar entre tiro y tiro.
     */
    retroceso: 0.0175,

    range: 240,          // px que recorre la bala antes de perderse

    /**
     * CUÁNTOS VAGONES DE MÁS DESPIERTA UN TIRO, más allá del propio —y sólo
     * cuenta UNA VEZ QUE LA ALARMA YA ESTÁ SONANDO (`spreadAlarm`,
     * raidScene.js): antes de eso, el vagón donde disparaste entero y los dos
     * de al lado ya reaccionan siempre, sin depender de esto — ver la nota
     * completa en el `bus.on('noise', ...)` de raidScene.js.
     *
     * 🐛 BAJADO DE 1 A 0 — Santi: "quiero que bajes el ruido que hacen el
     * Colt y el Smith". Antes ESTE número decidía "el Colt en 1 es la vara,
     * ninguna arma debería bajar de acá" — pero eso era de cuando `noise`
     * era la ÚNICA forma en que un disparo alertaba a alguien. Ahora que el
     * vagón propio (rojo) y los dos de al lado (amarillo) reaccionan SIEMPRE,
     * sin que haga falta que la alarma ya esté sonando, este número dejó de
     * ser "cuánto te delata un tiro" y pasó a ser sólo "cuánto empeora
     * ADEMÁS un tiro mientras el tren ya te está cazando". En 0, un Colt o
     * un Smith disparado con la alarma sonando no suma NADA por encima de lo
     * que ya suma cualquier tiro (su propio vagón, siempre) — la escopeta o
     * el rifle, cuando existan, son los que deberían tener este número por
     * encima de 0.
     */
    noiseWagons: 0,

    price: 0,
    hint: 'El que traés desde siempre. Seis balas y buena puntería.',
  },

  /**
   * EL SMITH & WESSON — la primera arma que se compra, y la primera decisión
   * de la tienda.
   *
   * NO ES UN COLT MEJOR, y eso es todo el diseño: dispara más rápido y se
   * recarga en la mitad de tiempo, pero lleva UNA BALA MENOS y tira más
   * sucio. Sin ese costo no sería una decisión, sería un ascenso.
   *
   * La recarga no es licencia de diseño: el Colt se carga por la compuerta,
   * bala por bala, y el Smith de la época se partía al medio y expulsaba
   * todas de un saque. La diferencia existía de verdad.
   *
   * NO CAMBIA EL RUIDO (`noiseWagons: 0`, igual que el Colt). Sigue siendo
   * un revólver: lo que se compra acá es velocidad de mano, no permiso para
   * hacer escándalo. El ruido es el precio de la escopeta y del rifle, no
   * de este.
   */
  smith: {
    id: 'smith',
    name: 'Smith & Wesson',
    short: 'SMITH',
    damage: 1,
    fireRate: 0.28,      // contra 0,40 del Colt
    magazine: 5,         // una menos: ese es el costo
    reloadTime: 1.0,     // se parte al medio y las expulsa todas de un saque
    bulletSpeed: 330,
    spread: 0.085,       // contra 0,035: notablemente más sucio de lejos

    /**
     * APUNTANDO MEJORA, PERO SIGUE SIENDO SUCIO — y ahí está su carácter.
     *
     * Misma regla que el Colt (ver su ficha): apuntar corta la dispersión A LA
     * MITAD. 0,0425 sigue siendo más grueso que el Colt SIN apuntar (0,035).
     * Eso es a propósito: apuntar no le puede borrar el defecto que lo define,
     * porque entonces comprarlo sería un ascenso y no una decisión. El Smith
     * es mano rápida, no pulso fino — el que quiere clavarla de lejos se queda
     * con el Colt, y el que quiere resolver rápido de cerca paga con precisión.
     *
     * Y esto le da a la tienda algo nuevo que vender que además SE VE: no un
     * número en una ficha, sino un círculo que cierra distinto.
     */
    spreadApuntado: 0.0425,

    /**
     * MÁS RETROCESO QUE EL COLT — mismo 50% de `spread` (ver la ficha del
     * Colt para el porqué completo), pero como el Smith parte de 0,085, ese
     * 50% es 0,0425. Y como dispara más rápido (0,28s contra 0,40s del Colt)
     * y `CONFIG.mira.retrocesoDecayTiempo` es el mismo 0,40s para las dos
     * armas, el Smith NUNCA llega a limpiarse entre tiro y tiro disparando a
     * su propio ritmo — el retroceso se acumula solo, aunque dispares tranquilo.
     * Es la otra cara de ser "mano rápida": lo que ganás en cadencia lo
     * perdés en pulso, sin que haga falta un número aparte para decirlo.
     */
    retroceso: 0.0425,

    range: 220,
    noiseWagons: 0,

    price: 600,
    hint: 'Se parte al medio y escupe las cinco. Rápido y sucio.',
  },
};

export const DEFAULT_WEAPON = 'colt';
