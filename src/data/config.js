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
     * LA RACHA — cada asalto LIMPIO (escapaste, sin que sonara la alarma)
     * seguido suma ESTE bonus aparte, arriba del de `cleanBonus`. Se corta
     * con cualquier otra cosa: te agarraron, o escapaste con la alarma ya
     * sonando.
     *
     * *(pedido de Santi, siguiendo la idea del "efecto casino" — un premio
     * que crece mientras sostenés algo, y que da miedo perder: "hagamos que
     * suba un 8% con techo en 150%")*
     *
     * A racha 1 (tu primer asalto limpio, sin ningún otro antes) ya suma
     * +8% — el premio se siente apenas lo extendés, no recién en el próximo.
     * El techo (150%) se alcanza en la racha 19 (8 × 19 = 152, topado): un
     * asalto limpio ahí paga el botín ×3,5 entre `cleanBonus` (×2) y esto
     * (×1,5) — un número grande a propósito, para que sostener una racha
     * larga se sienta como el verdadero golpe de tu vida.
     */
    rachaBonusPorNivel: 0.08,
    rachaBonusTecho: 1.50,

    /**
     * EL RESCATE — "casi lo logro" en vez de todo o nada.
     *
     * *(último de la lista que Santi dejó ordenada: "un 'casi lo logro' en
     * vez de todo-o-nada" — hoy que te agarren o mueras te hace perder el
     * 100% de lo juntado en el asalto, aunque hayas estado a un paso del
     * caballo)*
     *
     * NO ES UNA FRACCIÓN FIJA: escala con qué tan cerca del caballo (el
     * `exitZone` del tren) estabas en el momento exacto de la captura. Es lo
     * que hace que el nombre sea literal — morir a metros de la salida es un
     * CASI de verdad, y se paga distinto que morir en la otra punta del
     * tren, que es simplemente un fracaso.
     *
     * `rescateFraccionMax` (50%) rige a `rescateDistanciaCerca` (200px) o
     * menos; `rescateFraccionMin` (10%) rige a `rescateDistanciaLejos`
     * (2500px) o más; en el medio, interpola. Elegidos por Santi sobre una
     * tabla de tres opciones calculadas contra un botín de $1000: $500 cerca
     * / $100 lejos con éstos — bastante para que doler menos cuando estuviste
     * a nada, pero sigue siendo un fracaso real si morís lejos, no un premio
     * consuelo que borra la apuesta de todo el asalto.
     */
    rescateFraccionMax: 0.50,
    rescateFraccionMin: 0.10,
    rescateDistanciaCerca: 200,
    rescateDistanciaLejos: 2500,

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

    /**
     * 🐛 ERAN 5x5 — UN CUADRADO GORDO, FÁCIL DE ACERTAR SIN QUERER.
     *
     * *(Santi, después de medir la mira: "el problema ya no se debe al
     * círculo, sino a la hitbox de los personajes. Yo haría que los guardias
     * y yo y las personas en general, sean rectángulos en vez de cuadrados
     * gordos y muy fácil de disparar")*
     *
     * Con 5x5 (10x10 en total), la mira recién arreglada seguía sin importar
     * en la práctica: a la distancia típica de un tiroteo (60-120px) la
     * dispersión real del Colt daba un radio de 2 a 4px, MENOR que el propio
     * cuerpo del guardia — así que apuntar al centro casi garantizaba
     * pegarle, sin importar qué tan abierto se viera el círculo. El problema
     * nunca fue sólo la mira: la caja que recibía la bala era demasiado
     * grande para que la dispersión significara algo.
     *
     * POR QUÉ SE ACHICA MÁS EL ALTO (`hh`) QUE EL ANCHO (`hw`), Y NO PAREJO:
     * los vagones son PASILLOS, mucho más largos que anchos, así que la
     * inmensa mayoría de los tiros del juego salen casi horizontales (a lo
     * largo del pasillo). En un tiro horizontal, lo que decide si pasa de
     * largo o pega es la altura del blanco (`hh`), no su ancho — el ancho
     * (`hw`) casi no entra en juego salvo en los tiros cruzados de lado a
     * lado. Por eso el recorte tiene que ser más grande en altura: es la
     * dimensión que de verdad protege en el 90% de los tiroteos.
     *
     * LOS NÚMEROS SON LOS QUE PIDIÓ SANTI: -10% de ancho, -30% de alto.
     * 5 → 4,5 de ancho; 5 → 3,5 de alto. Sigue siendo una persona reconocible
     * (9x7), no una regla, y ahora el Colt SUELTO ya falla alguna vez a
     * distancia típica de combate sin apuntar — que es justo lo que hace que
     * apuntar (y la mira que lo dibuja) valgan la pena.
     *
     * El sprite se dibuja con este mismo tamaño (`drawPlayer`, no un número
     * aparte): la caja que ves siempre es la caja que te puede matar.
     */
    hw: 4.5, hh: 3.5,

    health: 4,
    invulnTime: 0.6,     // invulnerabilidad tras recibir un impacto
    knockback: 26,
    coverReach: 11,      // a qué distancia detecta una pared para cubrirse
    peekOffset: 8,       // cuánto se asomaría del todo
    peekMax: 0.7,        // pero no se asoma del todo: solo hasta el 70%
    peekSpeed: 9,        // qué tan rápido se asoma (mayor = más brusco)
    peekShootAt: 0.5,    // hay que estar asomado más de esto para poder disparar
    dynamite: 2,         // cartuchos con los que SALÍS (después saldrá del inventario)

    /**
     * EL TOPE — cuántos podés LLEGAR A LLEVAR encima.
     *
     * Sale 2 y el tope es 3: hasta la Fase 6a los dos números eran el mismo,
     * porque no había forma de conseguir un cartucho más. Los cajones de
     * pólvora del vagón de armas (data/wagons.js) dan +1 cada uno, y este
     * número es lo que decide cuánto significa haber ido hasta ahí.
     *
     * ELEGIDO SOBRE UNA TABLA DE TRES (2 / 3 / 4), por lo que habilita cada
     * uno contra el vagón blindado —que es donde la dinamita de verdad se
     * gasta— y cuánto reloj te ahorra reventar una caja fuerte en vez de
     * forcejearla (8 s cada una):
     *
     *   2  el vagón sólo te devuelve lo gastado; si llegás con dos, no te da
     *      nada y la mitad de las veces es un vagón vacío.
     *   3  puerta del blindado + DOS cajas reventadas: ~16 s de un asalto de
     *      145 (11%). Tenés que elegir cuál caja volás y cuál abrís a mano.
     *   4  puerta + las dos del blindado + una más: ~24 s (17%), y el vagón
     *      blindado —"el premio y la trampa"— se resuelve entero con
     *      explosivos sin forcejear nada.
     */
    dynamiteMax: 3,

    /**
     * CAMINAR DE COSTADO O DE ESPALDAS, RESPECTO A HACIA DÓNDE APUNTÁS, ES MÁS
     * LENTO.
     *
     * *(idea de Santi: "si el personaje está tocando la D y el arma apunta
     * hacia enfrente, avanza normalmente. Pero si estuviera tocando la D y
     * mirando hacia abajo con el puntero, estaría caminando de costado, y ahí
     * es donde se debería penalizar")*
     *
     * HASTA ACÁ CAMINAR RENDÍA IGUAL PARA CUALQUIER LADO: de frente, de costado
     * o de espaldas a tu propia mira, mismos px/s. Con mouse+WASD eso permite
     * correr en una dirección mientras apuntás para otra sin pagar nada por
     * eso — que es cómodo, pero le saca sentido a la idea de "encarar" algo.
     *
     * SE MIDE CON UN PRODUCTO PUNTO, no con un ángulo: `moveDirX/Y` (ver
     * `updateFree`, entities/player.js) ya es un vector UNITARIO hacia dónde
     * caminás, y `(cos(p.aim), sin(p.aim))` es el vector unitario hacia dónde
     * apuntás. Su producto punto YA ES el coseno del ángulo entre los dos, sin
     * necesidad de `atan2` ni de comparar ángulos: 1 = exactamente de frente,
     * 0 = exactamente de costado, −1 = exactamente de espaldas.
     *
     * DOS TRAMOS, no una curva sola: de frente (1) a costado (0) interpola
     * hacia `direccionCostado`, y de costado (0) a espaldas (−1) interpola
     * hacia `direccionAtras`. Así los dos números se puede afinar cada uno por
     * separado — con una sola interpolación de −1 a 1, el de costado saldría
     * forzado al promedio de los otros dos y no se podría elegir.
     */

    /**
     * RENDIMIENTO EXACTAMENTE DE COSTADO (perpendicular a la mira). 0,70 no es
     * un número inventado para esto: junto con `direccionAtras`, se calculó
     * contra algo que el juego ya mide en otro lado — cuánto podés correrte
     * dentro de `enemy.aimTime` (0,30 s), la ventana entre que un guardia
     * levanta el arma y dispara. De frente cubrís 23px en esa ventana; de
     * costado, con 0,70, bajás a 16px.
     */
    direccionCostado: 0.70,

    /**
     * RENDIMIENTO EXACTAMENTE DE ESPALDAS (moverte al revés de tu propia
     * mira). 0,50 REUSA el precio que el juego ya cobra en TRES lugares
     * distintos (agacharse, apuntar con clic derecho, deslizarse a cubierto):
     * `sneakSpeed`/`mira.velocidad`/`coverSpeed` son los tres 40 px/s, el 51%
     * de `speed` (78). No se inventó un precio nuevo — se usó el que el juego
     * ya tenía escrito para "esto cuesta caro". En la ventana de reacción de
     * 0,30s de un guardia, retroceder así cubre apenas 12px: casi no alcanza
     * para salir del marco de una ventana.
     */
    direccionAtras: 0.50,
  },

  /**
   * LA MIRA — el círculo que reemplazó a la cruz del cursor.
   *
   * *(idea de Santi: "el puntero para disparar no debería ser una cruz.
   * Debería ser un círculo. Y al tocar el clic derecho el círculo se cierra.
   * Y dependiendo del arma se cierra más o menos. Y al estar con el shift
   * contra una pared y tocás clic derecho para salir a apuntar, el círculo ya
   * está cerradito")*
   *
   * ANTES NO HABÍA MIRA: la cruz era el cursor del sistema operativo
   * (`cursor: crosshair` en styles/main.css). O sea que la precisión del arma
   * —el número más importante del combate después del daño— era completamente
   * invisible: la sentías fallando, sin saber por qué.
   *
   * EL RADIO ES LA DISPERSIÓN DE VERDAD, no un símbolo de ella:
   * `tan(spread) × distancia al punto donde apuntás`. Por eso el círculo se
   * abre solo cuando apuntás lejos (que es exactamente lo que le pasa a la
   * bala) y por eso **el balanceo del tren veloz se ve**: `dispersionExtra` ya
   * se sumaba al disparo desde que existe el traqueteo, y ahora esa suma tiene
   * dónde mostrarse. No hubo que inventar una señal nueva para un sistema
   * viejo: alcanzó con dibujar el número que ya estaba.
   *
   * Es la misma regla de siempre — lo que se puede mostrar no se escribe.
   */
  mira: {
    /**
     * CUÁNTO TARDA EN CERRARSE con el clic derecho apretado, y en abrirse al
     * soltarlo. Es la mitad del precio de apuntar (la otra es `velocidad`).
     *
     * Si apuntar fuera instantáneo y gratis, la respuesta óptima sería
     * "apuntá siempre" y no habría ninguna decisión: sería un botón que hay
     * que tener apretado. 0,35 s es un tiro y pico del Colt (0,40 de cadencia)
     * — lo suficiente para que abrir fuego de inmediato y apuntar primero sean
     * dos jugadas distintas, y poco para que no se sienta pesado.
     */
    tiempoCierre: 0.35,

    /**
     * A qué velocidad caminás mientras apuntás. Es `player.coverSpeed`/
     * `sneakSpeed` (40), o sea la misma media velocidad que ya cuesta
     * agacharse y deslizarse pegado a una pared: el juego ya tiene UN precio
     * de movimiento y esto no inventa otro.
     *
     * Cobra en tiempo y exposición, nunca en vida — la misma familia de
     * castigo que el barril, la caja fuerte y el salto sucio.
     */
    velocidad: 40,

    /**
     * 🐛 HUBO UN "escala: 4" ACÁ, Y HABÍA QUE SACARLO — ROMPÍA LA PROMESA
     * CENTRAL DE TODO EL SISTEMA.
     *
     * *(Santi, jugando: "si se hace el círculo más grande es para que se
     * pierda puntería. Ahora mismo eso no pasa: mientras el enemigo esté en
     * el puntito de adentro, le pega igual, por más que el círculo sea
     * grande")*
     *
     * La causa: medí la legibilidad del círculo con una captura exportada a
     * 3x (`foto.ps1`) y, sin tener la resolución real delante, concluí que
     * un cono honesto era ilegible y necesitaba un empujón. Lo que no até es
     * que **`fitToScreen`
     * (engine/renderer.js) YA agranda el canvas entero por CSS, en un
     * múltiplo entero según la pantalla** — medido en esta máquina, ×4. — y
     * ANTES de que el juego dibuje un solo píxel. El `escala: 4` que agregué
     * se multiplicaba ENCIMA de eso: el círculo que se veía en pantalla no
     * era 4 veces más grande que la dispersión real, era **dieciséis**.
     *
     * Y esa mentira tiene una consecuencia jugable exacta, que es la que
     * Santi encontró: la dispersión real del Colt a distancia de combate
     * (¡60-120px!) es de pocos píxeles — MENOR que el propio cuerpo de un
     * guardia (10px de diámetro). Apuntando al centro, casi cualquier tiro
     * cae adentro del guardia sin importar qué tan "grande" se viera el
     * círculo, porque el círculo mostraba una imprecisión que el arma nunca
     * tuvo. El Colt siempre fue así de preciso —es su virtud, está escrito en
     * su ficha desde la fase 1— pero antes de la mira nadie podía verlo y
     * esperar otra cosa.
     *
     * AHORA EL RADIO ES LITERAL, sin ningún multiplicador. La legibilidad la
     * da la pantalla (el ×4 de `fitToScreen`, o lo que corresponda en cada
     * monitor), no un maquillaje encima. Un círculo grande vuelve a
     * significar lo único que le puede dar sentido: que ESTA bala, con ESTE
     * arma, a ESTA distancia, tiene una chance real de no pegarle a lo que
     * apuntás.
     */
    escala: 1,

    /**
     * 🐛 EL CÍRCULO YA NO SE PROYECTA AL PUNTO DONDE APUNTÁS — SE MIDE
     * SIEMPRE A LA MISMA DISTANCIA.
     *
     * *(Santi: "cuando el círculo está más cerca tuyo o más lejos, debería
     * ser del mismo tamaño. El círculo mide una posible dispersión. Por más
     * de que vos tengás el círculo cerca tuyo, la dispersión sin apuntar
     * debería ser la misma")*
     *
     * HASTA ACÁ EL RADIO ERA `tan(dispersión) × distancia AL PUNTO DONDE
     * APUNTÁS` — literal: el cono de tiro proyectado exactamente donde iba a
     * caer la bala. Eso fue a propósito (ver el historial arriba, "el
     * círculo ES la dispersión, no una figura que la representa") y seguía
     * siendo cierto para lo que medía: si apuntabas lejos, el círculo se
     * abría porque a esa distancia la MISMA dispersión angular cubre más
     * terreno — eso es física, no una mentira.
     *
     * PERO ESO SIGNIFICABA QUE EL CÍRCULO CAMBIABA DE TAMAÑO SEGÚN A DÓNDE
     * SEÑALARAS, y Santi no quiere esa lectura: quiere que el círculo diga
     * "así de sucia es esta arma, en este estado" — una medida del ARMA, no
     * del punto exacto que estés mirando en este instante.
     *
     * `distanciaReferencia` reemplaza la distancia real por una fija: el radio
     * se calcula SIEMPRE como si apuntaras a esta distancia, apuntes a donde
     * apuntes.
     *
     * LO QUE NO CAMBIA, Y ES IMPORTANTE: esto es sólo el DIBUJO.
     * `dispersionActual()` (entities/player.js), que es la que de verdad
     * decide hacia dónde se desvía la bala en `shoot()`, no lee este número —
     * el tiro real sigue siendo más fácil de acertar de cerca que de lejos,
     * exactamente igual que antes y después de este cambio. Tocar
     * `distanciaReferencia` no mueve ni un número de letalidad ya afinado
     * (hitbox de los guardias, vida, nada): sólo cambia qué tan grande se VE
     * el círculo. Es la razón por la que este número es seguro de tocar solo.
     *
     * 🐛 SEGUNDA VUELTA · ERA 120, Y ESO HACÍA QUE APUNTAR SE SINTIERA INÚTIL.
     *
     * *(Santi, después de medir: "de 10 tiros a 60px, ¿9 van al medio del
     * círculo?" — y al confirmarlo: "quiero cambiar eso, porque sino es al
     * pedo que el jugador apunte con clic derecho si siempre la bala va a ir
     * al medio del círculo. Hagamos que sea 6 de 10 tiros van al medio y 4 a
     * la orilla")*
     *
     * MEDIDO ANTES DE TOCAR NADA: con 120, a la distancia típica de combate
     * real (60px, la mitad de la referencia) el 91% de los tiros caían en la
     * mitad interna del círculo — el círculo se veía mucho más grande de lo
     * que en la práctica ibas a fallar. La causa no era la dispersión (esa
     * medía uniforme y correcta a 120px, verificado con 4000 tiros) sino que
     * 120 estaba calibrado para el extremo LEJANO de "distancia típica de
     * combate (60-120px)", no para donde de verdad pasa la mayoría de los
     * tiroteos.
     *
     * 80 SALIÓ DE PROBAR VARIOS VALORES CONTRA EL PEDIDO EXACTO (60% adentro
     * de la mitad, a 60px): 70 da 53%, 78 da 59%, **80 da 61%**, 85 da 64%.
     * Elegido el más cercano a la mitad exacta que pidió Santi. Como el radio
     * de más arriba en este mismo archivo (120), no es casualidad que caiga
     * cerca de 60×1,33 ≈ el punto donde `k = distancia/referencia = 0,75`,
     * que es el mismo `k` que ya daba 60/40 al medir la distancia de 90px
     * contra el 120 viejo — la proporción es lo único que importa, no el
     * valor absoluto de ninguno de los dos números.
     */
    distanciaReferencia: 80,

    /**
     * EL RETROCESO — cada disparo te ensucia el próximo, un rato.
     *
     * *(idea de Santi: "que al disparar haya un pequeño retroceso, dependiendo
     * el arma, que agrande el círculo tanto apuntando como sin apuntar. Obvio
     * que apuntando el retroceso va a ser menor" — y al preguntarle cuánto y
     * por cuánto tiempo: "que baje un 50%" [del kick] y "0,40s" [de duración])*
     *
     * El monto por disparo vive en cada arma (`weapons.js`, campo
     * `retroceso`: 50% de su propio `spread`) porque es una característica
     * del arma, como el daño o la cadencia. Acá sólo van los dos números que
     * SON parejos para todo el catálogo:
     */

    /**
     * CUÁNTO TARDA EN APAGARSE SOLO, si no volvés a disparar. 0,40s es
     * EXACTAMENTE la cadencia del Colt (`fireRate`) — no es casualidad: a su
     * ritmo normal, el retroceso de un tiro termina de bajar justo cuando
     * sale el siguiente, así que el Colt disparado con calma nunca lo
     * acumula. El Smith (0,28s entre tiros) o una ráfaga de pánico sí, porque
     * no les da tiempo a bajar del todo entre uno y el siguiente.
     *
     * La baja es LINEAL y a la velocidad propia del arma equipada
     * (`w.retroceso / retrocesoDecayTiempo` por segundo, ver `updatePlayer`
     * en entities/player.js): si se acumularon dos kicks seguidos, tarda el
     * doble en bajar del todo — no hay un timer que se reinicia por tiro, es
     * una cantidad que sube y baja.
     */
    retrocesoDecayTiempo: 0.40,

    /**
     * TOPE DURO — no es una decisión de sensación, es una red de seguridad
     * técnica. Sin esto, vaciar un cargador entero disparando más rápido de
     * lo que decae (posible con el Smith, o en pánico) podría acumular
     * retroceso sin límite. 0,12 es unas tres veces el kick del Smith
     * (0,0425): de sobra para que se sienta "descontrolado" en una ráfaga
     * larga, sin volverse infinito.
     */
    retrocesoMax: 0.12,

    /**
     * EL PULSO SE PUEDE IR — el círculo deja de ser una garantía.
     *
     * *(Santi: "el círculo es literalmente del tamaño del guardia, en
     * realidad hasta más pequeño. Entonces no importa la dispersión, porque
     * yo pongo el círculo del arma 'dentro' del guardia y es un tiro
     * asegurado" — y después, la solución: "¿y si hacemos que la dispersión
     * de las balas de cualquier arma en realidad pueda salir del círculo? El
     * círculo es una idea de lo que puede pasar, no una garantía")*
     *
     * MEDIDO ANTES DE TOCAR NADA: el Colt apuntado da un círculo de 2,1px a
     * distancia típica (120px) — la caja de un guardia mide 4,5×3,5. Centrado
     * en el guardia, ESE círculo entraba entero adentro de la caja: no había
     * ningún ángulo posible, adentro del rango que el arma podía tirar, que
     * cayera afuera. Por eso apuntar bien con el Colt era matemáticamente un
     * tiro seguro, no sólo "muy probable" — el máximo de la dispersión
     * uniforme (`spread`, engine/rng.js) coincidía exacto con el radio
     * dibujado, así que el círculo SIEMPRE decía la verdad completa.
     *
     * LA IDEA DE SANTI: que diga la verdad la mayoría de las veces, no
     * todas. `fallaChance` es la probabilidad de que el pulso se vaya de
     * verdad en un tiro puntual; `fallaMultiplicador`, cuánto se agranda la
     * dispersión ESE tiro (ver `rng.spreadDeTiro`). El resultado, con el Colt
     * apuntado a 120px: la mayoría de las veces sigue siendo el mismo
     * círculo clavado de siempre, pero 15 de cada 100 tiros usan una
     * dispersión 2,5 veces mayor — bastante para que el guardia a veces
     * quede afuera, aunque hayas apuntado perfecto y el círculo se viera dentro
     * suyo. El Colt sigue siendo, por lejos, el arma más precisa del juego
     * (esto no le tocó un solo número de precisión): lo que cambió es que
     * "más precisa" dejó de significar "infalible".
     *
     * PAREJO PARA TODOS, como el resto de las reglas de este archivo: se
     * aplica en `shoot()` (jugador), `fire()` (guardias), `soltarBala()` (el
     * Cazarrecompensas) y el disparo de los jinetes — cualquiera con un arma
     * de verdad puede tener un tiro que se le va, no sólo vos.
     *
     * NO SE DIBUJA NADA QUE LO ANUNCIE, a propósito: si el círculo mostrara
     * "esto puede fallar 15% de las veces" dejaría de ser una idea del arma
     * para volver a ser una promesa exacta — la que Santi pidió sacar.
     */
    fallaChance: 0.15,
    fallaMultiplicador: 2.5,

    /**
     * TOPES DEL DIBUJO, en píxeles de la pantalla interna (384x216).
     *
     * `radioMin` es sólo un piso para que el trazo no desaparezca del todo en
     * los tiros más clavados — a esa distancia el impacto ya es prácticamente
     * seguro pase lo que pase, así que el piso no miente nada que importe.
     * `radioMax` frena al Smith suelto apuntando a la otra punta del vagón,
     * que si no taparía media pantalla.
     */
    radioMin: 2,
    radioMax: 40,

    /**
     * 🐛 HABÍA UN PUNTO EN EL CENTRO, Y HABÍA QUE SACARLO.
     *
     * *(Santi: "no debería existir un puntito dentro del círculo. Y la
     * dispersión del tiro debería ser dentro del círculo — cierto porcentaje
     * de que la bala vaya al medio, pero también cierto porcentaje que la
     * bala vaya a las orillas")*
     *
     * La mecánica YA hacía exactamente eso: `rng.spread()` (engine/rng.js) es
     * una distribución UNIFORME entre −dispersión y +dispersión, no una
     * campana que favorezca el centro. Medido con 400 tiros por caso: la
     * desviación real da `spread/√3`, que es justo lo que corresponde a una
     * uniforme — la bala tiene la misma chance de caer cerca del borde que
     * cerca del medio. Eso nunca fue el problema.
     *
     * EL PROBLEMA ERA EL DIBUJO: un puntito fijo en el centro se lee como "la
     * bala va a ir ACÁ, el círculo de alrededor es sólo el margen de error" —
     * la lectura exactamente contraria a la que tiene que tener una
     * dispersión uniforme, donde el borde importa tanto como el centro. Sacar
     * el punto y dejar sólo el anillo hace que el círculo entero sea la
     * respuesta, no una decoración alrededor de un centro con privilegio.
     */

    color: '#f2e4c9',
    colorApuntando: '#fff6d0',
    /**
     * ROJO CUANDO NO PODÉS DISPARAR — escondido detrás de la cobertura sin
     * asomarte, recargando, o tumbado. El círculo ya está en el lugar donde
     * mirás, así que es el mejor sitio del juego para decir "ahora no".
     */
    colorBloqueado: '#c86a52',
    alpha: 0.75,
  },

  enemy: {
    speed: 46,
    patrolSpeed: 24,

    /**
     * Mismo recorte que el jugador y por el mismo motivo — ver la nota
     * completa en CONFIG.player.hw/hh. Vale para todo guardia común, incluido
     * el Sheriff y su escolta (nacen con `createEnemy`, no tienen tamaño
     * propio). El Cazarrecompensas SÍ tiene el suyo (entities/boss.js, 6x6):
     * es un jefe con su propia vida y su propia pelea, afinada aparte, y no
     * entra en este recorte.
     */
    hw: 4.5, hh: 3.5,

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

    /**
     * EL DINAMITERO — los tres números que lo separan de los del blindado.
     *
     * Van aparte de `throwCooldown` a propósito, aunque hoy `dinamiteroRecarga`
     * valga lo mismo (5 s): son dos personajes distintos usando la misma arma.
     * Los cuatro del vagón blindado la tiran de a una, para sacarte de una
     * cobertura, y tienen revólver para todo lo demás. Éste no tiene nada más,
     * así que si algún día hay que aflojarlo o endurecerlo se toca acá sin
     * mover al blindado (y al revés).
     */

    /**
     * CUÁNTO TARDA EN VOLVER A TENER LAS DOS EN LA MANO. Elegido por Santi
     * (pidió 4 y lo subió a 5 antes de construir).
     *
     * ES LA VENTANA, no un tiempo muerto: mientras corre, este tipo está
     * literalmente desarmado — no tiene con qué contestar. Y se VE, porque los
     * cartuchos de la bandolera se dibujan según lo que le queda (ver
     * `drawEnemy`, entities/enemy.js). Sin eso la ventana existiría y no se
     * podría aprovechar, que es lo mismo que no existir.
     *
     * Con 5 s más los 0,7 de encender la mecha, tira una tanda cada 5,7 s:
     * **0,351 cartuchos por segundo, exactamente el doble** de lo que tira hoy
     * un guardia del blindado (0,175 — uno cada 5,7 s).
     */
    dinamiteroRecarga: 5.0,

    /** Cuántas lanza de una. Ver `puntosDeTanda` (systems/ai.js). */
    dinamiteroPorTanda: 2,

    /**
     * A QUÉ DISTANCIA DEL JUGADOR CAE CADA UNA — una para cada lado, sobre la
     * línea que va de él a vos.
     *
     * LA CUENTA QUE LO DECIDE: parado justo en el medio tenés que quedar en el
     * BORDE de las dos (1 de daño cada una, 2 de tus 4) y no en el centro de
     * ninguna. O sea que quedarse quieto duele pero no mata — lo que mata es
     * correr hacia una de las dos sin mirar.
     *
     * 🐛 ERA 40, Y ESO LO HACÍA MORTAL. 40 es exactamente `lethalRadius`… y el
     * chequeo es `d <= lethalRadius`, o sea INCLUSIVO: a 40 px clavados estás
     * ADENTRO del radio letal de las dos, no en el borde. Medido: 3 + 3, muerto
     * de una sola tanda. La cuenta estaba bien pensada y mal medida por un
     * signo de igual. Con 50, `50 > 40` deja el centro afuera y `50 <= 68` te
     * deja adentro del borde: 1 + 1, como corresponde.
     *
     * Y DEJA SALIDA: los dos centros quedan a 100 px entre sí, así que el
     * primer punto seguro está a 118 px del medio. Con los 2,16 s de mecha con
     * los que la sueltan, a 78 px/s cubrís 168. Se sale, pero hay que arrancar
     * ya — que es exactamente lo que tiene que costar.
     */
    dinamiteroSeparacion: 50,

    /**
     * SU BRAZO Y SU VENTANA — los dos números que hacen que la tanda separada
     * exista de verdad.
     *
     * 🐛 SIN ESTOS DOS, LA SEPARACIÓN NO PASABA NUNCA. Medido con el alcance
     * normal de la dinamita (`throwRange`, 104 px) y el jugador a 100: la de
     * "más allá tuyo" quería caer a 140 px del que la tira, `throwTarget` la
     * clampeaba a 104 — o sea 4 px más allá del jugador — y la tanda terminaba
     * separada 44 px en vez de 80, con una cayéndole **encima**. Eso son 3 + 1
     * = las 4 vidas de una sola tanda, exactamente lo contrario de la cuenta
     * con la que se eligió `dinamiteroSeparacion`.
     *
     * `dinamiteroAlcance` (150) es cuánto vuela SU cartucho: más lejos que el
     * tuyo (104), y es lo justo — no tiene otra cosa, y vos le podés contestar
     * con el revólver desde cualquier distancia. `dinamiteroRangoMax` (100) es
     * hasta dónde decide tirar, y sale de una cuenta: 100 + 50 de separación =
     * 150, o sea que **en toda su ventana útil le alcanza para poner las dos
     * donde corresponde**. Si se mueve uno hay que mover el otro — y también
     * si se mueve `dinamiteroSeparacion`.
     *
     * 100 sigue estando cómodamente por encima de los 92 px a los que se
     * planta la rama de "sin cobertura" (systems/ai.js), que es donde este
     * tipo pelea por no cubrirse nunca.
     *
     * Reemplazan a `throwMaxRange` (150) sólo para él; el del blindado sigue
     * con los números de siempre.
     */
    dinamiteroAlcance: 150,
    dinamiteroRangoMax: 100,

    /**
     * HASTA DÓNDE RETROCEDE cuando lo tenés encima, por encima de
     * `throwMinRange`. Los 12 px de más son histéresis: sin ellos se frenaría
     * justo en el límite y volvería a entrar en zona muerta con que te movieras
     * un paso, entrando y saliendo del retroceso sin decidir nada.
     */
    dinamiteroMargen: 12,

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

    /**
     * EL PÁNICO — tercera versión. Ya no es "está cerca": es "lo vi, está
     * expuesto, y viene derecho hacia mí". Historia completa en
     * NOTAS-DISENO.md; acá el resumen de la versión que quedó.
     *
     * *(Santi, la definición final: "si un guardia ve al jugador sin
     * cobertura y yendo en dirección hacia él, su prioridad será disparar una
     * ráfaga de cinco balas a quemarropa. Si el guardia está sin cobertura,
     * disparará la ráfaga mientras se mueve a una. Si el guardia ya está
     * contra una cobertura, sólo hará la ráfaga")*
     *
     * TRES CONDICIONES, LAS TRES A LA VEZ (ver `doCombat` en systems/ai.js):
     *  1. `engaged` — el guardia te ve de verdad, ahora, no "te vio hace rato".
     *  2. `!isHidden(player)` — estás expuesto. Si estás tapado y sin
     *     asomarte, esto no aplica: seguís siendo invisible como siempre.
     *  3. Venís CAMINANDO hacia él — no apuntando hacia él, CAMINANDO. Con
     *     mouse+WASD se puede apuntar para un lado y correr para otro, así
     *     que el gesto de "cargar" se lee del movimiento (`player.moveDirX/Y`,
     *     ver entities/player.js), no de la mira. `panicoCoseno` es el coseno
     *     del cono que cuenta como "hacia él": 0,3 es un primer número, no
     *     medido — un cono bastante abierto (±72°) para no exigir un beeline
     *     perfecto. Si en la práctica dispara con el jugador caminando de
     *     costado, hay que subirlo.
     *
     * SIN TOPE DE DISTANCIA A PROPÓSITO. La versión anterior exigía estar a
     * menos de 42px, y por eso nunca disparaba: para cuando el jugador
     * cruzaba esa línea, muchas veces ya lo había matado. Ahora la prioridad
     * se activa apenas se cumplen las tres condiciones, y se vuelve
     * "a quemarropa" sola, porque el jugador sigue acercándose mientras el
     * guardia sigue disparando.
     *
     * LA RESPUESTA DEPENDE DE SI EL GUARDIA YA TIENE DÓNDE ESCONDERSE:
     *  - Sin cobertura (todavía buscándola o yendo hacia ella): dispara
     *    MIENTRAS camina — no abandona el plan, lo hace a la vez.
     *  - Ya en cobertura: sólo dispara. Nada de esconderse entre ráfaga y
     *    ráfaga (`coverHoldMin/Max` no aplica), nada de calma que fingir.
     *
     * LO QUE NO CAMBIA: el aviso antes de disparar (`aimTime`) sigue siendo
     * el mismo. El pánico le saca la calma, no el telegrafiado — ningún
     * peligro de este juego dispara sin que el cuerpo lo anuncie primero.
     */
    panicoCoseno: 0.3,
    panicoBurstSize: 5,
    panicoSpreadExtra: 0.08,

    /**
     * EL REPLIEGUE DEL HERIDO — un guardia al que le queda un tiro de vida, con
     * un compañero cerca, se saca del medio mientras el otro sostiene.
     *
     * *(idea de Santi, de la misma conversación que dio la ráfaga de pánico:
     * "que un guardia con poca vida y un compañero cerca se repliegue mientras
     * el otro lo cubre")*
     *
     * ES LA SEGUNDA DE LAS TRES CONDUCTAS de esa conversación (la ráfaga de
     * pánico ya está; rendirse de rodillas sigue sin construir). Las tres
     * apuntan al mismo problema: *"tengo que pelear contra una situación
     * generada por personas y no contra muñecos"*. Hasta acá un guardia peleaba
     * exactamente igual con la vida llena que con el último punto, solo o
     * acompañado.
     *
     * REUSA CASI TODO LO QUE YA EXISTÍA, como estaba anotado en NOTAS-DISENO:
     *  - La detección del golpe es la misma que la del Cazarrecompensas
     *    (`reaccionarAlGolpe`, systems/boss.js): comparar la vida contra el
     *    cuadro anterior en vez de engancharse a `damageEnemy`. Así funciona
     *    igual venga el golpe de una bala, del cuchillo o de una dinamita, sin
     *    tocar una línea de combat.js, melee.js ni explosives.js.
     *  - El que cubre usa `defensivo`, la misma marca que ya llevan los tres
     *    guardias del Sheriff: no avanza, pelea desde donde está.
     *  - El que se retira camina SIN DISPARAR, igual que `reagruparse`
     *    (systems/sheriff.js) — mientras se va está expuesto, y ésa es tu
     *    ventana para castigarlo. Todo lo que hace un enemigo en este juego
     *    tiene un momento en que se le puede pegar.
     *
     * PASA UNA SOLA VEZ POR GUARDIA (`yaSeReplego`). Sin ese tope, un guardia
     * con 1 de vida al que rozás dos veces se pasaría el asalto entrando y
     * saliendo del repliegue, y eso ya no se lee como miedo: se lee como una IA
     * en un bucle.
     */

    /**
     * CON CUÁNTA VIDA SE QUIEBRA. 1 = el último golpe posible, sea cual sea su
     * tipo: un guardia común (2) se repliega tras el primer balazo, uno blindado
     * (3 o 4) tras el segundo o el tercero. Se eligió esto por sobre "la mitad
     * de su vida máxima" porque es lo único que se lee igual para todos: **un
     * tiro más y se muere**, y eso el jugador ya lo sabe sin ninguna barra de
     * vida en pantalla.
     */
    repliegueVidaUmbral: 1,

    /**
     * QUÉ TAN CERCA TIENE QUE ESTAR EL COMPAÑERO. 90px, el mismo número que la
     * `CORREA` de la escolta del Sheriff (systems/sheriff.js) y por el mismo
     * motivo: es la distancia a la que dos guardias siguen siendo un grupo y no
     * dos tipos sueltos que casualmente están en el mismo vagón.
     *
     * SIN COMPAÑERO NO SE REPLIEGA, Y ÉSA ES LA REGLA CENTRAL. Un guardia solo,
     * herido y acorralado no se va caminando: ése es exactamente el caso que la
     * otra idea pendiente (rendirse de rodillas) va a resolver algún día. Acá el
     * repliegue es una maniobra de a dos, no una huida.
     */
    repliegueRadioCompanero: 90,

    /**
     * HASTA DÓNDE SE ALEJA antes de volver a pelear normal. 110px no es un
     * número redondo: está justo por debajo de `spreadFarDistance` (130), o sea
     * el punto donde la puntería de un guardia ya es la peor posible. Se retira
     * hasta dejar de estar en la distancia donde se muere rápido, y ni un metro
     * más — no está escapando del tren, se está sacando del medio.
     *
     * Se mide contra el JUGADOR y no contra el punto de partida, así que si lo
     * seguís, sigue retrocediendo. El terreno lo ganás vos.
     */
    repliegueDistancia: 110,

    /**
     * CUÁNTO SOSTIENE EL QUE CUBRE. 3 segundos salen de una cuenta, no de una
     * sensación: 110px a `speed` (46 px/s) son 2,4 s de caminata, más el medio
     * segundo que tarda en arrancar. Es lo que de verdad dura la maniobra; ni
     * uno más, para que el que cubrió vuelva enseguida a ser un guardia normal
     * que te puede venir a buscar.
     */
    repliegueCubrirTiempo: 3.0,

    /**
     * EL GUARDIA SOLO, ACORRALADO, SE RINDE — en vez de pelear hasta morir.
     *
     * *(idea pendiente desde la conversación del pánico y el repliegue: "un
     * guardia solo, sin salida, a veces se rinde de rodillas". Era la tercera
     * de las tres conductas — la ráfaga de pánico y el repliegue del herido ya
     * estaban. Retomada para engancharla con `honor`, que hasta ahora no tenía
     * nada que lo moviera)*
     *
     * SE JUEGA EN EL MISMO LUGAR QUE EL REPLIEGUE (`considerarRepliegue`,
     * systems/ai.js) y por el mismo motivo lo comparte: las dos son la
     * respuesta de un guardia a "me quedan un tiro de vida, y alguien me está
     * cazando". LA DIFERENCIA ES `buscarCompanero`. Si encuentra uno, se
     * repliega (ya construido). **Si está solo, no tiene con quién retirarse —
     * y ahí, en vez de plantarse a morir como un muñeco, tira el arma.**
     *
     * NO ES SEGURO: es una tirada. `rendicionChanceBase` es la chance con
     * `honor` en cero (ni temido ni respetado); `rendicionPorHonor` la mueve
     * por cada punto de `gameState.honor` — para arriba si sos respetado, para
     * abajo (con piso) si sos temido. Un forajido temido de verdad casi no ve
     * rendiciones: los guardias ya saben que los vas a matar igual, así que no
     * tienen nada que ganar entregándose. Uno respetado ve bastantes más.
     *
     * SE JUEGA UNA SOLA VEZ POR GUARDIA (`yaConsideroRendirse`, en
     * entities/enemy.js) — igual que el repliegue: si perdió la tirada, sigue
     * peleando normal y no se le vuelve a preguntar cada cuadro.
     *
     * 🐛 BAJADA DE 0,25 A 0,15, Y AGREGADO `rendicionSoloMinimo` — Santi,
     * jugándolo: "el guardia que pide piedad pasa demasiado seguido. Cuando
     * está él y otro guardia en el mismo vagón, no importa que uno esté en
     * una punta y otro en la otra, NO PUEDE PEDIR PIEDAD."
     *
     * MEDIDO ANTES DE TOCAR NADA: dos guardias del mismo vagón, arrancando a
     * 288px (puntas opuestas), convergen a 63px en 6 segundos — SIEMPRE,
     * porque los dos se alertan y vienen a buscarte casi al instante. Para
     * cuando alguno baja al umbral de vida, ya están bien adentro de
     * `repliegueRadioCompanero` (90px). Por eso "una punta y la otra" no
     * cambiaba nada: para el momento que importa, la posición inicial ya no
     * existe. Y con ~11 guardias en 4-6 vagones, el ÚLTIMO de cada bolsón de
     * 2+ siempre termina solo tarde o temprano — eso es lo que se sentía
     * "demasiado seguido": no un guardia particular tirando la moneda
     * mucho, sino que casi todo vagón termina en ese momento.
     *
     * LA CHANCE BAJA (0,25 → 0,15) responde a la frecuencia. Y
     * `rendicionSoloMinimo` responde a la otra mitad del problema: antes se
     * tiraba la moneda en el mismo cuadro en que quedaba solo (su compañero
     * podía morir un instante antes). Ahora tiene que llevar
     * `rendicionSoloMinimo` segundos SEGUIDOS sin compañero antes de
     * considerarlo — si en el medio aparece uno (o revive la cuenta porque
     * el que lo cubría todavía no murió), el timer se corta. No cambia CÓMO
     * se mide "solo" (sigue siendo `buscarCompanero`, tiempo real): cambia
     * que ahora tiene que sostenerse, no ser un instante.
     */
    rendicionChanceBase: 0.15,
    rendicionPorHonor: 0.0025,
    rendicionChanceMin: 0.03,
    rendicionChanceMax: 0.75,
    rendicionSoloMinimo: 1.5,

    /**
     * LA TRAICIÓN — un rendido puede pararse y dispararte por la espalda.
     *
     * *(pedido de Santi, jugando la rendición: "quiero implementar que puede
     * haber una cierta probabilidad de que el guardia se levante y te dispare
     * por la espalda. Debería como irse poniendo de pie, para que si el
     * jugador esté atento le de tiempo para reaccionar. La probabilidad
     * debería incrementar con la recompensa")*
     *
     * ERA LA IDEA ORIGINAL DE LA RENDICIÓN, dejada afuera a propósito la vez
     * pasada ("con la posibilidad de traición, avisada con el cuerpo" — ver
     * NOTAS-DISENO.md) para no construir las dos cosas de una. Ahora se
     * retoma.
     *
     * SE RE-CHEQUEA CADA `traicionCheckCada` SEGUNDOS, no una sola vez al
     * rendirse (decidido con Santi): cuanto más lo dejás vivo cerca tuyo sin
     * resolverlo, más chances tuvo de intentarlo — la misma idea de "el
     * tiempo cuesta" que ya sostiene la caja fuerte, la dinamita y el galope.
     * Volver rápido a rematarlo, o alejarte de verdad, corta el riesgo.
     *
     * SÓLO SI TE ALEJASTE (`traicionRadioMinimo`): "por la espalda" necesita
     * que se la hayas dado de verdad, no que sigas parado mirándolo — un
     * rendido no se anima a nada mientras lo tenés encañonado.
     *
     * LA CHANCE LA MUEVE `gameState.bounty` (cuánto pagan por tu cabeza), NO
     * `honor` — son preguntas distintas: `honor` decidió si se arrodilló;
     * `bounty` decide si, ya de rodillas, se anima a jugársela. Con
     * `bounty` en 0, casi nunca; cerca de `prision.umbralHorca` (1200, el
     * techo real de recompensa que se juega), hasta ~40%.
     */
    traicionCheckCada: 3.0,
    traicionRadioMinimo: 50,
    traicionChanceBase: 0.05,
    traicionPorBounty: 0.0003,
    traicionChanceMin: 0.02,
    traicionChanceMax: 0.40,

    /**
     * CUÁNTO TARDA EN PARARSE DEL TODO. Es el tiempo de reacción real: si lo
     * atacás en cualquier momento mientras esto corre (mismo gesto de
     * rematar de siempre), lo cortás ahí. 1,1s — más que el `aimTime` de un
     * guardia normal (0,30s, ya apuntando) porque acá el aviso ES la única
     * seña: no hay brazo que se levanta aparte, el cuerpo entero parándose
     * tiene que alcanzar para leerse y reaccionar.
     */
    traicionDuracion: 1.1,

    /**
     * NINGÚN GUARDIA ENTRA SOLO AL VAGÓN DONDE ESTÁS.
     *
     * *(decidido con Santi después de medir por qué el repliegue del herido no
     * se veía nunca jugando)*
     *
     * EL PROBLEMA, MEDIDO, Y ES MÁS GRANDE QUE UNA CONDUCTA SUELTA: muestreando
     * 64 segundos de tiroteo real, **258 de 258 muestras eran de un guardia
     * peleando SOLO**. Nunca dos a la vez. El combate de Forajido era, en la
     * práctica, una sucesión de duelos 1 contra 1 — y contra un duelo no hay
     * ninguna conducta de grupo que pueda aparecer.
     *
     * Y EL TREN NO TENÍA LA CULPA: con el jugador plantado, la alarma sonando y
     * sin disparar un tiro, sí se juntan (hasta 4 en el veloz). Lo que rompía
     * los grupos era la velocidad a la que el jugador mata: dos tiros de Colt
     * son 0,42 s, así que cada guardia moría antes de que llegara el siguiente.
     * Medido, las llegadas se parten en dos poblaciones: los del vagón propio o
     * el de al lado llegan con 0-0,5 s de diferencia, y los de más lejos gotean
     * con huecos de 2,7 a 14,3 s.
     *
     * LA REGLA NUEVA no toca CUÁNTOS guardias hay ni CUÁNTA vida tienen — sólo
     * CUÁNDO entran. Por eso conserva el balance medido de la fase 2 (los
     * tiempos de ida y vuelta, la vida gastada por vagón): lo único que cambia
     * es que te regala unos segundos antes de un encuentro más duro.
     *
     * Y NO ES UNA CONDUCTA NUEVA: un guardia esperando parapetado en su vagón
     * es exactamente lo que ya hacen los de ADELANTE desde que existe la alarma
     * (`alertaEnGuardia`, systems/ai.js) — "se despierta, no se mueve". Lo
     * único que se agrega es un motivo más para hacerlo, y un reloj.
     */

    /**
     * CUÁNTO ESPERA ANTES DE ENTRAR SOLO IGUAL.
     *
     * Elegido por Santi sobre los 13 huecos de llegada medidos: con 4 s se
     * agrupan **7 de 13** (54%). Espera lo que tarda un compañero del vagón de
     * al lado, pero no lo que tarda uno de tres vagones — y si nadie llega,
     * entra igual, así que el jugador que ya limpió el tren de atrás no queda
     * esperando a un fantasma que no existe.
     *
     * No es un número inventado: es `suspicionMemory` (4,0), el tiempo que este
     * archivo ya usa para "cuánto aguanta un guardia antes de aflojar".
     */
    esperaCompanero: 4.0,

    /**
     * A QUÉ DISTANCIA CUENTA COMO "VENGO ACOMPAÑADO". 120px, un poco más que el
     * radio del repliegue (90): para replegarse hace falta tener al otro al
     * lado, pero para entrar juntos por una puerta alcanza con venir en el
     * mismo tramo de pasillo.
     */
    radioGrupo: 120,

    /**
     * HASTA DÓNDE LLEGA EL LLAMADO del que no quiere entrar solo
     * (`llamarCompaneros`). Va aparte de `radioGrupo` a propósito: es la perilla
     * de DIFICULTAD de todo este sistema, y hay que poder moverla sin tocar la
     * regla de con quién se considera acompañado.
     *
     * Es corto (120px, no los 320 de `shoutRadius`) porque está llamando al de
     * al lado para cruzar una puerta, no dando la alarma general: si despertara
     * medio tren, quedarse callado dejaría de servir para nada.
     *
     * ⚠️ EN 0 QUEDA APAGADO — el guardia espera igual, pero no llama a nadie.
     * Es la forma de volver al balance previo sin desarmar el sistema.
     */
    radioLlamado: 120,

    /**
     * ESPERA UNA SOLA VEZ POR GUARDIA (`yaEsperó`). Si no, un guardia que te
     * persigue por cuatro vagones se plantaría en cada puerta y nunca te
     * alcanzaría — pasaría de "esperan para entrar juntos" a "no llegan nunca",
     * que es peor que el problema original.
     */
    /**
     * CUÁNTO AGUANTA SIN PODER DISPARAR EL GUARDIA QUE NO SE CUBRE (hoy, el
     * Pistolero: `evitaCobertura` en data/guards.js) ANTES DE IR A CUBRIRSE.
     *
     * *(Santi, jugándolo: "hay veces que se para en medio del pasillo y
     * empieza a dispararme. Pero luego se frena [...] Si es un bug
     * soluciónalo, sino lo es: que se meta detrás de una cobertura")*
     *
     * Plantarse en el medio del pasillo lo pone justo donde caminan sus
     * compañeros para llegar hasta el jugador, así que seguido tiene a uno
     * en la línea de tiro y `allyInLine` no lo deja disparar. Sin esto se
     * quedaba clavado ahí, sin disparar y sin moverse: medido, de 2,6 balas
     * por segundo a 0,2, y 100% del tiempo quieto.
     *
     * 0,6 s es bastante más que el `cooldown` de 0,3 que ya se pone solo
     * cuando hay un compañero en la línea: uno que le cruza por delante
     * caminando no alcanza para mandarlo a esconderse — tiene que estar
     * tapado de verdad. Y apenas recupera el tiro suelta la cobertura y
     * vuelve al pasillo, así que su identidad se pierde sólo mientras no
     * puede usarla.
     */
    descubiertoBloqueoMax: 0.6,

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

  /**
   * CUERPO A CUERPO — lo que es del SISTEMA, no del arma.
   *
   * El daño, la velocidad y si el golpe por la espalda mata o noquea salen del
   * arma equipada (`data/melee.js`). Acá quedan las cosas que no cambian por lo
   * que lleves en la mano: a qué distancia alcanzás a alguien, con qué arco,
   * cuánto lo aturde el golpe y cuánto ruido hace cada situación. Un cuchillo y
   * un hacha no cambian el largo de tu brazo.
   */
  melee: {
    /**
     * CUÁNTO DURA UN DESMAYO (culata por la espalda, ver data/melee.js).
     *
     * 25 s es más de la mitad del asalto más corto (el tren veloz, 90 s) y casi
     * un sexto del estándar (145 s): alcanza de sobra para cruzar el vagón,
     * abrir lo que haya y salir. O sea que noquear SÍ resuelve el problema — lo
     * que no hace es resolverlo para siempre, y ésa es toda la diferencia con
     * el cuchillo.
     *
     * No se eligió más largo a propósito: un noqueo de un minuto sería un
     * degüello con otro nombre, y el cuchillo dejaría de tener sentido. Ni más
     * corto: si el tipo se levanta antes de que termines de robar el vagón, la
     * culata no sirve para nada y volvemos a tener una sola arma.
     */
    noqueoDuracion: 25,

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

    /**
     * Mismo recorte proporcional que el jugador y los guardias (-10% de
     * ancho, -30% de alto sobre el 4x4 de siempre) — ver CONFIG.player.hw/hh
     * para el porqué completo. Un pasajero no pelea, pero también recibe
     * balas perdidas (dinamita, tiroteos cruzados) y merece la misma regla.
     */
    hw: 3.6, hh: 2.8,

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

    /**
     * `max` YA NO ES UN TECHO DURO — es el piso garantizado.
     *
     * *(pedido de Santi, probando la traición: "quiero probar eso de que a
     * medida que pasa el tiempo más se intensifica el peligro. Podríamos
     * hacer que suban guardias... desde la locomotora")*
     *
     * ANTES, pasados los primeros 4 (a los 20, 36, 52 y 68 segundos con el
     * ritmo de siempre), no entraba nadie más aunque te quedaras el resto del
     * asalto — la escalada se aplanaba justo cuando más debería pesar
     * quedarse. Ahora, pasado `max`, siguen entrando, pero CADA VEZ MÁS
     * SEGUIDO: `intervalDecay` le resta segundos al intervalo por cada uno de
     * más, hasta el piso `intervalMin`. Con los números de abajo: el 5º llega
     * a los 81s (13s de intervalo), el 8º ya cada 6s — el mismo ritmo que
     * tenías al principio del asalto, pero ahora sin parar.
     *
     * `maxAbsoluto` sigue siendo un techo, pero técnico, no de dificultad:
     * ningún asalto real llega tan lejos sin que pase algo antes (te agarran,
     * escapás, o se acaba el reloj) — está para que un asalto colgado de
     * verdad no genere guardias sin fin.
     */
    max: 4,
    intervalMin: 6,
    intervalDecay: 3,
    maxAbsoluto: 12,
  },

  /**
   * LA MOCHILA — el lugar que llevás en la espalda, y lo único que decide
   * cuánto te podés llevar.
   *
   * *(Santi: "yo haría que al apretar TAB se despliegue el inventario de la
   * mochila [...] que tenga 16 slots (cuadrados). Y bueno, cada objeto que robes
   * ocupe más o menos espacio. Mientras más ocupada tengas la mochila, más
   * lento va el personaje. Es más, haría que la dinamita también ocupe lugar en
   * esta mochila")*
   *
   * REEMPLAZÓ A `CONFIG.peso`, QUE YA NO EXISTE. Aquél hacía que **la plata**
   * encima te frenara (2% por cada $100, sólo en el tren de carga y sólo
   * después de la alarma). Dos sistemas para la misma cosa era confuso, y el de
   * la mochila es mejor por tres motivos:
   *
   *   - **Es físico.** No te frena lo que VALE, te frena lo que ABULTA. Unos
   *     documentos lacrados de $1.500 no pesan; un saco de café de $60, sí.
   *   - **Vale en los dos trenes**, en vez de ser la rareza de uno.
   *   - **Y la dinamita entra en la misma cuenta**, que es lo que hace que los
   *     dos trenes te pidan equiparte distinto sin una sola regla nueva: en el
   *     de pasajeros se roba plata (que no ocupa lugar) y la mochila queda
   *     libre para explosivos; en el de carga, cada cartucho es una caja que no
   *     te llevás.
   *
   * LO QUE SE PERDIÓ, y hay que dejarlo escrito: la regla de *"mientras nadie
   * dio la voz, cargás lo que quieras sin costo"*. La reemplaza el colchón de
   * abajo, que hace lo mismo por otra vía — media mochila es gratis siempre.
   */
  mochila: {
    /**
     * DIECISÉIS CASILLAS, y cada cosa ocupa de 1 a 4 (ver `slots` en
     * data/objetos.js). Se llenan en orden, consecutivas: no hay que acomodar
     * nada, entra o no entra.
     *
     * Elegido por Santi. Contra los ~23 botines de un tren de carga, y con los
     * tamaños que tienen, te llevás cuatro cajones grandes o una decena de
     * cosas chicas: bastante menos de la mitad del tren.
     */
    casillas: 16,

    /**
     * LA GRILLA: 4 columnas × 4 filas. Lo que pidió Santi.
     *
     * Y no es sólo cómo se dibuja: **es dónde tiene que entrar cada cosa**. Un
     * cajón de 2×2 necesita un cuadrado libre, un atado de 3×1 tres casillas en
     * fila (o tres en una columna, acostado). Ver `engine/grilla.js`.
     *
     * Con 4×4, un atado largo cruza la mochila casi entera y deja una sola
     * columna suelta al costado: es angosta a propósito, porque es lo que hace
     * que el orden en que agarrás las cosas importe.
     */
    columnas: 4,
    filas: 4,

    /**
     * QUÉ FORMA TIENE UN CARTUCHO DE DINAMITA. Una casilla: es lo más chico
     * que hay, y entra en cualquier rendija que quede.
     *
     * Que sea 1×1 y no 2×1 es una decisión: tres cartuchos son 3 de 16, o sea
     * que llevar explosivos completos es barato en lugar. Lo que cuesta es
     * llevarlos **y** un cajón grande.
     */
    formaDinamita: [1, 1],

    /**
     * EL COLCHÓN — hasta acá no te frena nada.
     *
     * Con 0,5, media mochila es gratis: podés llevar tres cartuchos y un par de
     * cosas sin notarlo. De ahí en adelante el freno sube derecho hasta
     * `frenoMaximo` con la mochila llena.
     *
     * EXISTE PARA QUE LLENARLA SEA UNA DECISIÓN Y NO UN IMPUESTO. Sin colchón,
     * cualquier cosa que agarres te castiga un poco, y "agarrá lo que puedas"
     * pasa a ser "no agarres nada" — que es el error contrario.
     */
    sinCostoHasta: 0.5,

    /**
     * EL TOPE DEL FRENO, con la mochila LLENA.
     *
     * NACIÓ EN 0,35 porque era exactamente el `maximo` que tenía `CONFIG.peso`,
     * ya afinado — se heredó el número sin volver a medirlo contra la mochila.
     *
     * 🔻 BAJÓ A 0,25 DESPUÉS DE JUGARLA — *(Santi: "yo haría que el movimiento se
     * penalice menos ahora. Pondría que pase de 35% a un 25%")*. Caminando a 78:
     *
     *   casillas   antes (0,35)       ahora (0,25)
     *   8 / 16     78 px/s (nada)     78 px/s (nada)
     *   12 / 16    64 px/s  (−17,5%)  68 px/s  (−12,5%)
     *   14 / 16    58 px/s  (−26%)    63 px/s  (−19%)
     *   16 / 16    51 px/s  (−35%)    58 px/s  (−25%)
     *
     * El colchón (`sinCostoHasta`) no se tocó: media mochila sigue siendo
     * gratis. Lo que cambia es sólo cuánto pesa la mitad de arriba.
     */
    frenoMaximo: 0.25,
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
     *
     * 🐛 SUBIÓ DE 6,5 A 8 — *(Santi, jugándolo: "creo que hay una caja que se
     * abre en 6 segundos, quiero que se cambie a 8 segundos")*. Y ahora las
     * dos cajas del juego tardan lo mismo: la oculta (data/wagons.js) ya
     * estaba en 8. Ocho segundos quieto y de espaldas, en un vagón que ya te
     * oyó — y el blindado tiene DOS, o sea dieciséis segundos de un asalto de
     * 145.
     *
     * Y ahora ese precio se puede pagar en cuotas o esquivar del todo: el
     * progreso ya no se pierde si te interrumpen (ver `l.progress` en
     * scenes/raidScene.js) y la dinamita revienta la caja sin esperar nada.
     */
    strongboxTime: 8,
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
   * EL HONOR (`gameState.honor`) — CÓMO TE VEN, no cuánto te conocen (`fame`)
   * ni si pagan por tu cabeza (`bounty`). Los tres números contestan preguntas
   * distintas a propósito (ver la nota en NOTAS-DISENO.md).
   *
   * Estaba en el estado desde la fase 1 y nada lo movía nunca. Lo primero que
   * lo engancha es la rendición (`CONFIG.enemy.rendicionChanceBase` y
   * compañía, más arriba): un guardia solo y acorralado se arrodilla en vez de
   * pelear a muerte, y qué hacés con él — o qué hacés SIN que te lo pregunten,
   * matando a alguien que ya se rindió — es lo que mueve esto.
   *
   * NO SON NÚMEROS MEDIDOS TODAVÍA: son el primer valor razonable para
   * arrancar a jugar y ajustar, la misma forma en que se afinó todo lo demás
   * de este archivo.
   */
  honor: {
    /** Dejaste ir a un guardia rendido — no lo tocaste, y el asalto terminó. */
    perdonarRendido: 12,

    /**
     * NOQUEO LIMPIO: elegiste la culata en vez del filo, por la espalda, a
     * alguien que nunca te vio venir. La mitad de la idea original que
     * había quedado afuera cuando se construyó `rendido`/`honor` (ver la
     * tabla en NOTAS-DISENO.md, sección "El honor").
     *
     * Sube POCO a propósito — sólo 3, un cuarto de `perdonarRendido` — porque
     * es una decisión que tomás ANTES de saber si iba a hacer falta: cada vez
     * que llevás la culata en vez del cuchillo, ya estás dejando la puerta
     * abierta a esto. Perdonar a un rendido es una decisión consciente en el
     * momento; noquear por la espalda es casi un hábito de equipamiento. Si
     * pesara igual, equiparte la culata sería la jugada dominante para
     * `honor` y el resto de la tabla dejaría de importar.
     */
    noquearLimpio: 3,

    /**
     * Rematar a alguien que ya se había rendido — te miraba a la cara,
     * indefenso, y lo matarte igual. El golpe más fuerte de la lista: es
     * literalmente romper la palabra que el juego te ofreció.
     */
    rematarRendido: -20,

    /**
     * Rematar a alguien que noqueaste vos mismo (culata + filo). Pesa menos
     * que rematar a un rendido: no te miró a los ojos pidiendo que pares, ni
     * siquiera sabe que pasó.
     */
    rematarNoqueado: -8,

    /**
     * Por cada pasajero muerto. Reusa `summary.civilians`, el mismo conteo
     * que ya alimenta `bounty.pesoCivil` — no hace falta un contador aparte.
     */
    matarCivil: -15,

    /**
     * Bonus al escapar sin haber matado a NADIE (ni un guardia, ni un jinete,
     * ni un civil — `summary.kills === 0`). Noquear no cuenta como matar, así
     * que un asalto entero resuelto a culatazos y sigilo cae acá.
     */
    asaltoSinSangre: 15,
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

  /**
   * LA TORMENTA, QUE HASTA AHORA NO SE OÍA.
   *
   * *(Santi: "recuerda que en la Tormenta se tiene que sentir como una: truenos
   * y lluvia impactando en un techo de chapa")*
   *
   * Existía desde la Fase 1 como UN SOLO NÚMERO (`hearMult: 1.4`, los guardias
   * te oyen 40% más lejos) y nada más. O sea: una tormenta que te cambiaba el
   * sigilo y que no se veía ni se escuchaba. El jugador pagaba un precio por
   * algo que no estaba ahí.
   *
   * SON TRES CAPAS Y NO UNA, y es lo que la hace sonar a tormenta de verdad:
   *
   *   `chapa`  el repiqueteo sobre el techo del vagón. Es un ruido con una
   *            resonancia metálica alta (`q` grande, `cutoff` en la zona donde
   *            canta una chapa). Es la capa que sólo existe BAJO TECHO.
   *   `agua`   el siseo del agua cayendo. Está siempre, y sube a la intemperie
   *            — afuera te moja a vos, no a la chapa de arriba.
   *   `viento` el fondo grave. Sólo afuera: adentro del vagón no hay viento.
   *
   * Y ESO CONVIERTE AL SONIDO EN INFORMACIÓN. Al cruzar un enganche, al entrar
   * al vagón de ganado (que va al aire libre) o al subirte al techo, la chapa
   * se apaga y el agua y el viento suben. **Se oye cuándo estás expuesto**, que
   * es exactamente cuando los jinetes de afuera te pueden pegar un tiro. No
   * hizo falta inventar una señal: el clima ya era la señal.
   */
  tormenta: {
    /** Volumen de cada capa, bajo techo y a la intemperie. */
    chapaAdentro:  0.085,
    chapaAfuera:   0.006,
    aguaAdentro:   0.020,
    aguaAfuera:    0.060,
    vientoAdentro: 0.004,
    vientoAfuera:  0.045,

    /**
     * Cuánto tarda en cruzar de un estado al otro. 0,35 s: lo suficiente para
     * que no se oiga un click al pisar el enganche, y poco para que el cambio
     * se sienta al pasar la puerta y no tres pasos después.
     */
    rampa: 0.35,

    /**
     * CADA CUÁNTO UN TRUENO, en segundos, y cuánto varía. Un trueno cada 9-22 s
     * en un asalto de ~145 s son unos ocho o nueve: suficiente para que la
     * tormenta esté viva, lejos del ruido constante que deja de oírse.
     */
    truenoCada: 9,
    truenoVariacion: 13,

    /**
     * QUÉ PROPORCIÓN CAE CERCA. Uno de cada cuatro. El cercano es el único que
     * corta el fondo y levanta la cabeza, así que si fueran la mitad dejaría de
     * ser un susto y pasaría a ser el ritmo de la tormenta.
     */
    chanceCerca: 0.25,

    /** En el galope estás a la intemperie y sobre un caballo: suena más. */
    galopeMult: 1.35,
  },

  /**
   * EL FONDO DE CADA LUGAR — y por qué antes no había ninguno.
   *
   * `startAmbience` se llamaba en UN solo lugar de todo el juego (el asalto), o
   * sea que el campamento, el pueblo, el mapa y el galope estaban **mudos**:
   * cuatro de las seis pantallas, incluido el galope, que es la más cinética
   * que tiene el juego.
   *
   * LA REGLA DE TODOS ESTOS NÚMEROS ES QUE SON CHICOS. Un fondo que se nota
   * deja de ser un fondo y se vuelve un zumbido: lo que tiene que pasar es que
   * el silencio se sienta raro cuando lo sacás, no que el ruido se oiga cuando
   * está. Si algo hay que corregir jugando, casi seguro es para abajo.
   */
  ambiente: {
    /**
     * EL CAMPAMENTO. De noche el fondo es el fuego y el desierto; de día no hay
     * fogata encendida (es el reloj del juego), así que queda sólo el viento.
     *
     * `chispaCada` tiene variación grande a propósito: un chasquido cada 0,9 s
     * exactos suena a metrónomo, no a fuego.
     */
    campNocheGain: 0.030,
    campDiaGain:   0.022,
    campFuegoGain: 0.026,
    chispaCada: 0.55,
    chispaVariacion: 1.1,

    /** El pueblo: una calle de tierra al sol. De noche baja y se aquieta. */
    puebloDiaGain:   0.026,
    puebloNocheGain: 0.014,

    /**
     * EL MAPA es lo más callado del juego, y tiene que serlo: estás en tu
     * campamento mirando un papel. Es el mismo viento del campamento, más bajo
     * todavía — lo justo para que no se corte el mundo al abrir el cartel.
     */
    mapaGain: 0.012,

    /**
     * EL GALOPE. El viento de ir rápido, y las zancadas.
     *
     * 🔻 `zancadaCada` REEMPLAZÓ A `cascoCada`, y no es un cambio de nombre.
     * Antes se tocaba UN golpe cada 0,20 s, parejo: 3,7 por segundo, que es lo
     * que Santi oyó como *"tuc-tuc-tuc-tuc rápido"*. Un cuadrúpedo no pisa a
     * intervalos iguales — pisa en GRUPOS con un silencio en el medio (las
     * cuatro patas en el aire). Ahora la unidad es la zancada entera, que ya
     * trae sus tres pisadas adentro (ver `zancada` en engine/audio.js).
     *
     * 0,62 s a fondo son **1,6 zancadas por segundo**, que es el ritmo real de
     * un caballo a galope tendido. Al trote y aflojando se estira solo.
     */
    galopeVientoGain: 0.030,
    zancadaCada: 0.62,

    /**
     * CUÁNTO SE OYE EL CABALLO. Multiplica las tres pisadas de una zancada a la
     * vez (ver `zancada` en engine/audio.js).
     *
     * 🔺 SUBIÓ DE 1 A 2,6 DESPUÉS DE JUGARLO — *(Santi: "el sonido de los cascos
     * del caballo quedaron muy bajos en volumen")*. La primera versión se eligió
     * con el criterio de "un fondo que se nota deja de ser un fondo", y para los
     * cascos ese criterio estaba mal: **no son un fondo, son el personaje**. Son
     * lo único que te dice cómo está corriendo el animal que llevás abajo.
     *
     * Las tres pisadas se mueven juntas a propósito: lo que se ajusta es cuánto
     * se oye el caballo, no el equilibrio interno de la zancada — el acento de
     * la tercera es lo que le da la forma de "tucu-TÚN" y no se toca.
     */
    zancadaVolumen: 2.6,

    /**
     * CUÁNTO RESPIRA EL VIENTO — ver `soplar` en engine/audio.js.
     *
     * `profundidad` cerca de 1 es lo que hace que **entre ráfaga y ráfaga casi
     * no se oiga nada**: el viento deja de ser un fondo permanente sin que nadie
     * lo apague. Con 0 vuelve a ser el disco rayado de antes.
     *
     * `cada` son los segundos de la ráfaga larga; adentro hay otra de período
     * distinto para que la suma no se repita de forma audible.
     */
    vientoProfundidad: 0.85,
    vientoCada: 6.5,

    /**
     * LA MÚSICA — ver `updateMusica` en engine/audio.js.
     *
     * 🔺 LA PRIMERA VERSIÓN NO SONABA A MÚSICA — *(Santi: "no parece música,
     * sino sonidos aislados")*. Estaba armada toda con silencios para no caer en
     * un bucle, y se pasó: **sin nada que una una nota con la siguiente quedan
     * ruiditos**, por afinados que estén. Ahora la guitarra es un arpegio
     * CONTINUO —la base— y la armónica pasa por arriba cada tanto.
     *
     * Y ES MÚSICA DE FONDO, o sea que la regla que manda es *no alterar al
     * jugador* — *(Santi: "no puede alterar al jugador")*. De ahí salen tres
     * decisiones que parecen tímidas y no lo son:
     *
     *  - **La guitarra suena MENOS que antes** aunque ahora toque todo el
     *    tiempo (0,055 → 0,034). Lo que decide cuánto molesta un fondo no es el
     *    volumen de cada nota sino cuánto ocupa en total.
     *  - **Ninguna nota entra de golpe**: la criolla tiene ataque blando y la
     *    armónica más todavía. Nada acá tiene que poder sobresaltarte.
     *  - **El pulso es lento** (0,42 s). Un arpegio rápido arrastra la atención
     *    y te apura; uno lento se vuelve parte del lugar.
     *
     * Si al jugarlo molesta, la perilla es `armonicaCada` (que entre menos
     * seguido) antes que el volumen: lo que cansa de una música de fondo casi
     * siempre es la MELODÍA repetida, nunca el acompañamiento.
     */
    armonicaVolumen: 0.040,
    armonicaCada: 11,
    armonicaVariacion: 13,

    guitarraVolumen: 0.034,
    /** Cada cuánto cae una púa del arpegio. Es el pulso de todo lo demás. */
    pulsoCada: 0.42,
  },

  colors: {
    /**
     * EL SUELO DEL GALOPE — arena de día, oscuro de noche.
     *
     * *(Santi: "poné el suelo color arena (como el del campamento) y cuando es
     * de noche estará oscuro y si es de día estará como el color arena del
     * campamento")*
     *
     * `desiertoDia` NO es un color nuevo: es exactamente `campDesiertoDia`, el
     * desierto que rodea al campamento de día. Reusarlo en vez de inventar otro
     * ocre es lo que hace que las dos escenas se lean como el mismo mundo — el
     * campamento y el galope pasan en el mismo desierto, así que tienen que
     * tener el mismo suelo. Si algún día se retoca la paleta del campamento,
     * este también tiene que moverse.
     *
     * SON DOS COLORES Y NO UNO CON UN VELO ENCIMA, por el mismo motivo que el
     * campamento tiene dos paletas propias (ver `campSueloDia` más abajo): la
     * noche del desierto no es "la arena, pero más oscura". Es tierra sin luz,
     * con otro tono, no la misma imagen bajada de brillo.
     *
     * `outside` (el negro casi puro de antes) queda porque es el color del
     * VACÍO —lo que se ve por los enganches del tren— y eso no es suelo ni
     * cambia con la hora.
     */
    desiertoDia:   '#8a6f47',
    desiertoNoche: '#1b1610',

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
    /**
     * EL CIELO DEL PUEBLO — y por qué antes no existía.
     *
     * 🐛 `puebloCielo` era CÓDIGO MUERTO. `render` limpiaba la pantalla con él,
     * pero `dibujarTierra` pintaba "la loma detrás del pueblo" desde `y=0`
     * (`townScene.js`) y lo tapaba entero, en un marrón escrito a mano que ni
     * siquiera estaba en esta paleta. O sea que el pueblo no tenía cielo: tenía
     * una loma de 72 px de alto, del mismo tono que la tierra.
     *
     * *(Santi, jugándolo: "las mecánicas se sienten muy bien pero no me siento
     * dentro del Viejo Oeste")* — mirando las cuatro pantallas, ésta era la
     * causa más grande y la más barata de arreglar. TODA la paleta de exteriores
     * vivía en la misma franja de marrones (`desiertoDia` #8a6f47, `puebloTierra`
     * #9c7f56, `campSueloDia` #a08053) y no había un solo color frío en el juego
     * contra el cual esos ocres se leyeran como cálidos.
     *
     * Son DOS colores porque un cielo plano no es un cielo: el aire se aclara y
     * se ensucia hacia el horizonte, y esa diferencia es la que da la distancia.
     * Se dibuja con `r.cielo` (engine/renderer.js), en bandas y no en degradado
     * continuo — el porqué está allá.
     */
    puebloCielo:          '#7c96a8',
    puebloCieloHorizonte: '#cdc5ac',
    /** La loma de atrás, ya empolvada por la distancia. */
    puebloLoma:    '#9c8a6e',
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
    // Rendido: ni el gris de patrulla ni el rojo de combate — un color que no
    // usa ningún otro estado, para que se lea como lo que es, "ya no pelea".
    enemyRendido: '#e6ddc4',
    /**
     * LA CABEZA DEL GUARDIA — franja de piel entre el ala del sombrero y el
     * cuerpo (ver `drawEnemy`, entities/enemy.js).
     *
     * *(Santi, jugando: "el jugador parece que mata conos en vez de guardias
     * de ley")* — y tenía razón, aunque no era culpa del recorte de la
     * hitbox (medido: 1px de diferencia, no alcanza). La causa era vieja: el
     * ala del sombrero tocaba directo al cuerpo, sin un solo píxel de
     * transición. Sin cabeza, sin brazos y con el cuerpo pintado del color de
     * ESTADO (gris/amarillo/rojo, nunca de piel), la silueta entera son dos
     * bloques apilados — la misma lectura que un cono o un hongo.
     *
     * Un color aparte, que no es el de ningún estado ni el del sombrero, es
     * lo mínimo para que el ojo separe "cabeza" de "sombrero" y de "torso".
     */
    enemyPiel:  '#c8a878',
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
      /**
       * VAGÓN DE ARMAS: verde oliva apagado, el único verde del tren.
       *
       * No es un capricho de paleta — es lo único que hace que se note de un
       * vistazo en qué vagón estás, y este vagón necesita decirlo más que
       * ninguno: entrar sin darse cuenta a tirotear acá adentro es la peor
       * cosa que te puede pasar en el tren. Verde para no confundirse con el
       * marrón del comedor, el tostado del correo ni el gris azulado de la
       * chapa del blindado.
       */
      armas:     ['#55603f', '#6e7a4e'],   // cajones de munición estibados

      /**
       * VAGÓN ALMACÉN: estantería clara, el interior más luminoso del tren.
       *
       * LA INTENCIÓN ERA QUE SE PARECIERA AL CORREO Y MIRÁNDOLO NO SE PARECE:
       * salta a la vista. Se deja así después de ver las dos pantallas una al
       * lado de la otra, por algo que sólo apareció mirando — **las estanterías
       * del correo casi se funden con el piso** (su `#9c7a45` está a un paso
       * del `#6d4a30` del suelo), así que ese vagón no tiene de dónde ceder
       * contraste. Un almacén igual de apagado habría sido un segundo vagón
       * ilegible en vez de uno reconocible.
       *
       * Y es el único vagón del tren de carga donde de verdad conviene frenar,
       * así que que se note de lejos no está mal. Si alguna vez molesta, el
       * arreglo es bajarle luz a estos dos tonos — no subírsela al correo, que
       * es de otro tren y ya está jugado.
       */
      almacen:   ['#8a7a5c', '#a39371'],
      blindado:  ['#4a5058', '#626a74'],   // chapa de acero
      cola:      ['#6b4f36', '#87664a'],   // equipaje amontonado
      pasajeros: ['#8a5a34', '#a06b3f'],
      /**
       * LOS VAGONES NUEVOS (etapa 1, ver NOTAS-DISENO.md). Colores de arranque:
       * se miran en pantalla y se corrigen. El de la góndola es el único casi
       * negro del tren, y es a propósito: es carbón.
       */
      // 🐛 Era ['#6e4a32', '#8a5e40']: el mismo marrón que el piso (#6d4a30), así
      // que la estufa y el escritorio no se veían. Se vio mirándolo — el mismo
      // error que dejó invisible la mochila dibujada en la espalda.
      caboose:      ['#4e4844', '#6a635c'],   // la estufa de hierro de la tripulación
      dormitorio:   ['#7a5a48', '#94705c'],   // literas de los camarotes
      guardias:     ['#5c5a46', '#767356'],   // mesas de cartas y catres
      primeraClase: ['#7a3a3e', '#94494e'],   // sillones de terciopelo
      cerrado:      ['#9c7a45', '#b89257'],   // la estiba del correo liviano
      plataforma:   ['#5f5344', '#7a6b58'],   // maquinaria y cajones amarrados
      gondola:      ['#2e2a28', '#46413c'],   // montículos de carbón
      refrigerado:  ['#8a4a46', '#a65f5a'],   // reses colgadas
      default:   ['#7a5436', '#94663f'],
    },

    /**
     * LA LOCOMOTORA — etapa 2 de los trenes nuevos (ver `drawLocomotora` en
     * world/train.js).
     *
     * HIERRO CASI NEGRO CON TRES ACENTOS, y cada uno tiene un trabajo: el
     * LATÓN de los domos y la campana es lo que la hace brillar a lo lejos, el
     * ROJO de los bordes (el mismo del sello del mapa) es lo que dice "esto es
     * una máquina de la época" y no un vagón más oscuro, y el FARO es lo único
     * cálido de la punta del tren. El resto es a propósito apagado: es fondo,
     * no es donde se juega.
     */
    locomotora: {
      hierro:      '#2b2a2e',
      hierroLuz:   '#46454c',
      hierroBorde: '#161519',
      rojo:        '#8c2f26',
      laton:       '#c9a24a',
      latonLuz:    '#e8c77a',
      techoCabina: '#5a3626',
      techoLuz:    '#744632',
      carbon:      '#1c1a19',
      carbonLuz:   '#34302d',
      agua:        '#3b474d',
      humo:        '#8f8980',
      faro:        '#ffd08a',
    },
  },
};
