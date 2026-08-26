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
    range: 240,          // px que recorre la bala antes de perderse

    /**
     * CUÁNTOS VAGONES DESPIERTA UN TIRO.
     *
     * Esta es la propiedad más importante del arma después del daño, y es la
     * que va a diferenciar de verdad a la tienda: el Colt hace el ruido justo
     * para que se entere el vagón de al lado. La escopeta o el rifle van a
     * despertar dos o tres, y esos guardias no aparecen encima tuyo — aparecen
     * DETRÁS, entre vos y el caballo. El ruido no te suma enemigos: te los pone
     * en el camino de vuelta.
     *
     * El Colt en 1 es la vara. Ninguna arma debería bajar de acá.
     */
    noiseWagons: 1,

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
   * NO CAMBIA EL RUIDO (`noiseWagons: 1`). Sigue siendo un revólver: lo que
   * se compra acá es velocidad de mano, no permiso para hacer escándalo. El
   * ruido es el precio de la escopeta y del rifle, no de este.
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
    range: 220,
    noiseWagons: 1,

    price: 250,
    hint: 'Se parte al medio y escupe las cinco. Rápido y sucio.',
  },
};

export const DEFAULT_WEAPON = 'colt';
