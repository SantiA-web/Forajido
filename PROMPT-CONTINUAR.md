Estoy desarrollando Forajido, un western pixel art de asaltos a trenes en
HTML/CSS/JS vanilla, en `C:\dev\forajido`. Antes de proponer o tocar nada, leé
completos `README.md`, `NOTAS-DISENO.md` y `src/data/config.js` — ahí está el
contexto del proyecto, el detalle de cada sistema, y cómo trabajar conmigo.
No me resumas lo que dicen: son la memoria real del proyecto entre sesiones,
así que confiá en ellos más que en cualquier cosa que yo te diga de memoria.
`NOTAS-DISENO.md` es grande (11.000 líneas): usá Grep para ir a la sección que
necesites en vez de leerlo entero cada vez.

## LO ÚLTIMO (2026-11-27): LAS CARRETAS PULIDAS

Santi me dejó a cargo de pulir las carretas, con jueces revisando cada tanda (detalle en NOTAS-DISENO, 2026-11-27):
- **El escopetero a pie** (`src/world/escopeteros.js`): se cubre de verdad detrás de la carreta, recarga sólo
  escondido, usa piedras cuando lo acosas, baja y sube caminando, esquiva piedras y matas, y no se lo engaña al volver.
- **Las piedras y las lonas paran las balas**, para todos.
- **Sin tirones** al galopar al lado de una carreta (frena y arranca de a poco; el dibujo no salta de grilla).
- **Los pasajeros y el conductor vuelven a subir** caminando al terminar el asalto; la carreta los espera.
- **En fila sin encimarse**; **la vuelta de la mina** paga ~$160 (la muestra de mineral vale [110, 150]).

⚠️ Probado con el banco y medido, pero Santi jugó sólo la primera tanda ("Bastante mejor"); lo de los pasajeros, la
fila, el esquive y la vuelta de la mina todavía no lo jugó.

⏭️ **Sigue: etapa 5 del campo con vida** (campamentos de paso y viaje rápido): plan con opciones primero. Quedan de las
carretas, que Santi no considera necesarios: la carreta se esfuma cerca del pueblo, los desvíos no se guardan al
recargar, el día de las carretas puede desfasarse, el daño de los perdigones, el conductor aparece de golpe al bajarse.

## ANTES (2026-11-26): LAS CARRETAS DEL CAMPO Y SUS ASALTOS (etapa 4 del campo con vida)

- **Las carretas andan por los caminos** (`src/world/carretas.js`, números en `CAMPO.carretas` de `src/data/campo.js`)
  *(Santi, 2026-11-25: "pondría varios tipos de carretas… de menos a más")*: colonos (con lona), carga y mina (sin lona;
  la de la mina de ida lleva el cofre de la paga) y la diligencia *(Santi: "ármala vos a la diligencia")*. Dibujo de
  Blender pasado a puntos (`src/entities/estiloNuevo/carreta.js`, `src/assets/carreta*Puntos.js`), sin caballos todavía.
  Dónde está cada una sale del horario, no de un sorteo: el reloj de las carretas se guarda en la partida y nunca va para
  atrás; los atrasos y sustos duran todo el viaje. Andan sólo con luz. Rodean lo que está parado acordándose del lado
  (si los dos lados están tapados, esperan), se cruzan de frente cada una por su derecha y no se pisan.
- **Asaltarlas** (`src/world/asaltoCarreta.js`): frenarla apuntándole al conductor o cortándole el paso; el conductor
  se baja con las manos arriba; `[E]` para la plata, la carga, los pasajeros, el cofre o la caja del correo, cada cosa con
  su barra de tiempo (si te alejas, queda a medias). Recompensa por tipo (colonos $30, carga $60, mina $120, diligencia
  $150) sólo si quedan testigos; matar al conductor baja el honor siempre.
- **Los guardias**: el escopetero sentado al lado del conductor (`src/world/escopeteros.js`; algunos con Winchester) que
  se baja y pelea cubierto detrás de la carreta, y la escolta a caballo de la mina y la diligencia (`src/world/escolta.js`).
  Con guardias vivos nadie se rinde ("¡Ni lo sueñes! ¡Llevo escolta!"); se calman si te alejas más que el alcance de sus
  armas. La diligencia, de día, **escapa campo traviesa** hasta un pueblo buscando el camino entre piedras y barrancas,
  y te denuncia sólo si la amenazaste.
- **Dónde pega una bala** (`src/world/cuerpos.js`): cada persona del campo es una columna del tamaño de lo que se ve
  *(Santi: "fijate la hitbox de los guardias…")*.
- **La mira nueva, la misma en todo el juego** (`src/entities/estiloNuevo/mira.js`) *(Santi: "un puntito como el de GTA
  V que esté relleno… la escopeta… como un paréntesis")*: tamaño fijo; la dispersión sigue pero no se ve.
- **Sin tirones**: el bucle (`src/engine/loop.js`) redondea los cuadros que duran casi justo un paso *(Santi: "se sigue
  viendo esos tirones", la carreta)*.
- **Revisión general con dos revisores** (movimiento y asaltos), que quedaron conformes en la segunda vuelta.

⚠️ Los últimos retoques de la revisión (el grito de la escolta, la escolta que se calma sin escopetero, que paguen sólo
los pasajeros vivos, la diligencia a 0,7 y que deje de buscar camino cuando está perdida) están revisados de sintaxis
pero no jugados.

⏭️ **Pendiente de las carretas**: la lona y las piedras no paran balas contra los sentados; los pasajeros desaparecen al
terminar el asalto; la carreta se esfuma al llegar cerca del pueblo; los desvíos no se guardan al recargar; dos que van
para el mismo lado o por caminos que se cruzan pueden encimarse; el día de las carretas puede desfasarse del del juego;
el escopetero se puede engañar mientras vuelve a subir; la vuelta de la mina vale poco; el daño de los perdigones.
Después: etapa 5 del campo con vida (campamentos de paso y viaje rápido).

## ANTES (2026-11-25): EL CAMPO, SUS ANIMALES Y LA HISTORIA EN PAPELES

- **El campo** *(Santi, 2026-11-24: "con tu caballo recorrés el lugar… como en la huida pero zoom"; "vamos con la
  prueba chica")*: montar en el poste (`F`) ya no lleva al pueblo sino a cabalgar el desierto entero
  (`src/scenes/campoScene.js`, números en `src/data/campo.js`, llave `CAMPO.activa`). Trote y galope con aguante, a pie
  con `F`, `[M]` el mapa, el tiempo pasa mientras cabalgas, la granja de los Hale con la pista de los Rennick, las
  huellas y su campamento escondido, entrar al pueblo y volver al campamento con `[E]`. Dibujo de prueba con figuras
  básicas *(Santi)*.
- **El plano** (`src/data/plano.js`): terreno y vías pensados juntos "visto desde un ingeniero"; líneas de ida y
  vuelta, cada una con a quién lleva; el mapa de papel (`data/region.js`) y el campo salen de ahí. Relieve (mesetas,
  cerros, ríos, caminos de carreta: `world/campoRelieve.js`), vías a la medida del galope (`world/campoVias.js`), la
  lupa en dos tamaños y los bordes con mojones.
- **El campo con vida, etapas 1 a 3 de 6** (plan aprobado el 2026-11-24): 1) el suelo en manchones con la textura que
  eligió; 2) las señales de lejos (humo, fogata, remolinos, buitres: `world/senales.js`); 3) la caza
  (`world/fauna.js`): liebres, berrendos (el más rápido; cuernos de trofeo), venados, coyotes que molestan, zorro rojo
  de noche y la tropilla de guanacos; carnear con `[E]`, la carne a la despensa y los cueros al almacén. ⏭️ Faltan 4)
  carretas y jinetes, 5) campamentos de paso y viaje rápido, 6) la ley que patrulla según la recompensa.
- **El venado y el berrendo dibujados** (camino B: 3D de Blender pasado a puntos y retocado;
  `src/assets/venadoPuntos.js`, `src/assets/berrendoPuntos.js`, `src/entities/estiloNuevo/venado.js` y `berrendo.js`;
  llave `CAMPO.caza.dibujoNuevo`). Dos tamaños; quieto, pastando y muerto de costado, caminar y galopar en 4 vistas
  *(Santi)*. Retocado: cabezas, cuernos exagerados del berrendo *(Santi: "más exagerados")*, el muerto simple *(Santi:
  "Figura más simple y sencilla")* y, en el berrendo, **un solo cuerpo en todos los cuadros** *(Santi: "eso es una
  obviedad lo de cuerpo fijo")*. ⏸️ **El pulido queda para cuando se complete el juego** *(Santi, 2026-11-25: "ahí
  recién pulimos bien los dibujos")*: las patas a mano de cada cuadro (el galope recogido son manchas), las vistas
  norte y sur sin retocar, el venado sin cuerpo fijo, y en `berrendo.py` las franjas del cuello cuelgan del torso.
- **La historia en marcha** (2026-11-22 y 23): el motor de cadenas (`src/systems/historia.js`; escenas en
  `data/escenas.js`, números y encargos en `data/historia.js`, textos en `text/historia.js`), **todo por días y no por
  asaltos** *(Santi: "Nadie sabe cuántos asaltos va a durar la región o el juego")*; los papeles que se ven como papeles
  (carta, nota, diario, cartel: `engine/papeles.js`, con letras de mano en `assets/letras/`); las escenas partidas en
  pasos con la cara de quien habla (`systems/pasos.js`); la primera página del libro de James con `[L]` (la barra de
  la fama del Cuervo: `scenes/libro.js`); los sellos de las habilidades en la ficha (`data/sellos.js`); y el simulador
  de la fama (`simulador/fama.js`), con el que Santi eligió Cole con fama 300 o recompensa $900.

⚠️ **Sin jugar de punta a punta.** El campo es una prueba para saber si cabalgar es divertido antes de llenarlo; el
venado y el berrendo no se vieron todavía andando en el juego.

⏭️ **Sigue**: que Santi cabalgue el campo y diga si es divertido; después, la etapa 4 del campo con vida (carretas
y jinetes). Los dibujos se pulen al final.

## ANTES (2026-11-22): LA HISTORIA, Y LAS CADENAS ESCRITAS A MANO

Antes de tocar nada de la historia, leé **`PERSONAJES.md`**: los personajes como para una novela (John, James, su
padre, Santiago, Frank, Tommy, los de afuera y los cuatro pueblos). Manda sobre lo que diga cualquier otra página.

- **Dos tipos de decisiones** *(Santi, 2026-11-22)*: las **Diarias** (repetidas, con peso que se junta) y las **de
  Historia**, cadenas escritas a mano: "si pasó X, en N golpes pasa Z, a menos que hagas K" (como *Beholder:
  Conductor*). **Nada de reglas "cada N golpes".** Los finales y los arcos salen de las dos.
- ✅ **Hecho el esqueleto (`HISTORIA.md`) y el guion del desierto (`HISTORIA-DESIERTO.md`)**, con los encargos y el
  prólogo de James (falta que Santi elija su forma). Golpes: desierto 14, pradera 9, bosque 12, montaña 6.
  ⏭️ **Ahora: el motor de cadenas**, construido con el desierto.
- **El camino** *(Santi: "subilo y vamos con el camino del medio")*: 1) el esqueleto de las cadenas de las cuatro
  regiones, una página por región, que decide también cuántos golpes tiene cada una (Santi pidió alargarlas, para
  que entren la otra banda, el Marshal, la Pinkerton, un prisionero importante y la gente de los pueblos); 2) el
  desierto en detalle, construido con un **motor de cadenas** (hechos, plazos en golpes, condiciones, "a menos
  que"), que se hace una sola vez; 3) subir, que Santi lo pruebe entero "ya casi como juego terminado"; 4) ajustar y
  seguir con la pradera.
- **Etapa 5, parte 1 hecha** (tentación, señal, traición; `src/systems/tentacion.js`) con textos provisorios. Las
  partes 2 y 3 (promesas rotas, el ejército, los límites) se hacen como cadenas de historia. Las reglas que se
  repiten (las ofertas cada 4 golpes, el tramo +1, los choques de la fogata) se reemplazan por hechos escritos.

## ANTES (2026-11-20): LOS TRATOS CON EL PERISTA

Santi me dejó a mí el sistema de tratos (comprar y vender con cualquier tratante). Está todo en **`TRATOS.md`**:
hecha la etapa 1 (el perista, la tarea "vender", el honor según quién, la química del que mandas). Las tiendas
(armero, establo) quedan para después *(Santi, 2026-11-20)*. Falta además que el chantaje y el soplo vayan a la libreta.

## ANTES (2026-11-18): LA BANDA NUEVA, POR ETAPAS

Antes de tocar la banda, leé **`BRUJULA.md`** (qué juego es) y **`BANDA-NUEVA.md`** (la banda rehecha, aprobada;
al final, "Las reglas que no se tocan" y el "Orden de construcción"). El resumen de lo hecho está en
`NOTAS-DISENO.md`, "La brújula, el tiempo, el horario y la banda nueva".

- ✅ **Etapa 1**: el telégrafo y el vigía en el asalto, y que lleguen a la huida.
- ✅ **Etapa 2, parte 1**: la libreta, la lealtad de 0 a 5 y el ánimo en el plan (`src/systems/libreta.js`).
- ✅ **Etapa 2, partes 2 y 3**: la pantalla del reparto por cabeza (`src/scenes/reparto.js`), J.Mc. en cuotas y la
  comida en porciones (`src/systems/comida.js`, reemplaza a la olla).
- ✅ **Etapa 3**: la pizarra dentro del calendario [C] y las tareas (`src/systems/pizarra.js`, `src/systems/tareas.js`);
  los tratos con el perista (`TRATOS.md`).
- ✅ **Etapa 3, parte 4**: los rumores con su origen (`RUMORES` en `src/data/tareas.js`).
- ✅ **Etapa 4**: las personalidades con escalones (`BAJA` en `src/data/rasgos.js`) y la fogata (`src/systems/fogata.js`).
- ✅ **Etapa 5, parte 1**: la tentación, la señal y la traición (`src/systems/tentacion.js`). Lo demás de la etapa 5
  va como cadenas de historia (arriba). ⏭️ Después, la etapa 6 (la cantina con los contratados).

Todo número nuevo va en un solo archivo de datos y se mide primero en `simulador/banda3.js` (`SIM='{...}'` para
probar variantes). Antes de sacar una conclusión del simulador, revisar que la variante corra de verdad.

## LA SESIÓN PASADA: SE REESCRIBIÓ QUÉ ES CADA TREN

Fue la sesión más grande en mucho tiempo: **ocho commits**, todo subido y la
documentación al día. Cambió la estructura del juego, no un número.

### 1. Se acabó el "rápido / lento / punto medio"

Había tres tipos de tren y se distinguían por su **reloj**, que es un eje de
dificultad disfrazado de variedad. Ahora son **dos y se distinguen por lo que
traen adentro**:

| | **Pasajeros** (50%) | **Carga** (50%) |
|---|---|---|
| Qué te ataca | **La gente te delata** | **El tren te ataca a vos** |
| Suyo | paquete, caja oculta, testigos, encubierto, Cazarrecompensas, Sheriff | rodantes, traqueteo, estampida, vagón de armas, **el almacén** |
| Qué se roba | **plata** | **mercadería que hay que vender** |

La regla es **una mecánica, una sola casa**: si aparece en los dos, no distingue
nada. Lo que sí le pasa a los dos es la capa de variedad (clima, redada, puerta
trabada, comportamientos) — antes era exclusiva del estándar, o sea que la mitad
de los asaltos no la veía nunca.


### 2. El vagón almacén, y el tren de carga sin blindado

El almacén **viaja siempre** en el de carga, **cerrado con llave** (dos puertas
de madera trabadas: se abren a tiros, o sea a los gritos), con **dos cajas
fuertes** y **cuatro guardias blindados** encerrados adentro. El vagón blindado
se fue de ese tren: el almacén heredó su papel con otra llave.

### 3. En el de carga se roba mercadería, no plata

Quince objetos en tres niveles (común / valioso / **raro**: reloj de oro,
documentos lacrados, lingotes). El raro sólo sale de una caja del almacén o de
una **caja fuerte oculta**. No se cobra en el tren: hay que venderlo.

### 4. El perista, y `honor` por primera vez cuesta plata

Última puerta de la calle, pegado a la oficina del sheriff, **abierto siempre**.
Compra el lote entero de un gesto y dice el precio desglosado:

- **Mercadería limpia** (la alarma nunca sonó): paga **el doble**. Es el bono de
  trabajo limpio —que se calcula sobre el dinero y por eso no llegaba acá—
  entrando por otra puerta, con el mismo número.
- **Tu nombre**: 0 entre −15 y 15, **±3%** pasando 15, **±8%** pasando 40,
  **±15%** pasando 60, **±20%** pasando 100.

### 5. La mochila: un Tetris de 4×4 con cursor

`TAB` abre una grilla de **dieciséis casillas**. Cada cosa tiene **forma**
(`[1,1]` una chuchería, `[2,1]` un estuche, `[3,1]` un atado, `[2,2]` un cajón) y
los bultos largos **se acuestan solos** si es lo único que cabe.

**No alcanza con que sobre lugar: tiene que sobrar lugar de la forma correcta.**
Tres atados dejan siete casillas libres y un cajón de 2×2 ya no entra.

- **La dinamita ocupa lugar en la misma mochila.** De ahí sale sola la asimetría:
  en el de pasajeros se roba plata (que no ocupa nada) y la mochila queda libre
  para explosivos; en el de carga cada cartucho es una caja que no te llevás.
- **Se puede soltar**: cursor con `W A S D`, `[E]` suelta, y lo soltado **cae al
  piso y se puede volver a levantar**. Sin eso la mochila era un callejón.
- **Mientras revolvés no te movés, no apuntás y no disparás, y el mundo sigue
  andando.** No es una pantalla de gestión: es un tipo parado en un pasillo con
  la bolsa abierta.
- **El bulto te frena** (media mochila gratis, después hasta −35%). Reemplazó a
  `CONFIG.peso`, que te frenaba por lo que la plata VALÍA.
- Se ve la mochila **dibujada en la espalda**, y crece con lo que metés.

### 6. Y el botín se ve como lo que es

Once siluetas (cajón con listones, fardo con sogas, rollo, saco, estuche,
botiquín con su cruz, lingotes apilados, papeles lacrados…), con sombra y
**apoyadas contra la estiba**. Nada que ver con el cuadrado amarillo del tren de
pasajeros.

## ⚠️ NADA DE TODO ESTO ESTÁ JUGADO

Es lo más importante que le puedo decir al que siga. **Jugué la reestructuración
de los trenes y el almacén** (de ahí salieron dos pedidos de esta misma sesión).
**No jugué nada de lo económico ni de la mochila.**

Lo que hay que mirar, en orden:

1. **La mochila de 16 casillas con formas.** ¿Es apretada o generosa? ¿"¿Cuál me
   llevo?" se siente una decisión o una molestia? Es la primera vez que el tamaño
   de la grilla se puede sentir.
2. **Revolver la bolsa sin poder moverte.** ¿Se siente tenso o injusto? Si
   molesta, **pausar es una línea**.
3. **El tren de carga tiene cinco sistemas a la vez** (rodantes, traqueteo,
   estampida, pólvora, el almacén) y pasó del 20% al 50% de los asaltos. ¿Tiene
   carácter o pasan demasiadas cosas? La perilla para bajarle el ruido es subir
   `rodantesCada` (14) y después `traqueteoCada` (24).
4. **El precio del perista.** ¿Vender se siente un premio o un trámite?
5. **El tren de carga se quedó sin ningún guardia duro fuera del almacén.**

### Números sin calibrar de esta sesión

`CONFIG.mochila` (16 casillas, colchón 0,5, freno 0,35), `CHANCE_RARO` (0,18),
`rodantesCada` (14), `traqueteoCada` (24), los valores de los tres niveles de
objeto, los escalones de honor del perista, y el 50/50 entre los dos trenes.

Y de sesiones anteriores, sin calibrar: la frecuencia de los paquetes, el 25% de
la caja oculta, `CONFIG.honor.*`, `CONFIG.enemy.traicion*`, `RIDER_SPAWN.*`,
`CONFIG.raid.rachaBonus*` y `rescate*`, `LOOT_TYPES.strongbox.jackpot*`.

## LO QUE FALTA CONSTRUIR

- **Los documentos que revelan la caja fuerte oculta en el tren de carga.** Es lo
  único que quedó pendiente del pedido de la sesión pasada: en el de pasajeros te
  la delatan los civiles, y en el de carga no hay a quién amenazar, así que la
  pista tiene que ser **documentos que encuentres por el tren**.
- **Un desbalance que quedó anotado a propósito:** con el perista, el honor bajo
  pasó a ser **puro castigo** (menos guardias se rinden Y te pagan menos), sin
  que ser temido dé nada a cambio. El lugar natural para equilibrarlo es **al
  COMPRAR**: al armero no le regateás igual si te tienen miedo.
- **Etapa 2 de la pólvora**: que el sacudón "acelera" tumbe un **barril de
  pólvora** al pasillo. Hoy suelta utilería. El traqueteo y el vagón de armas ya
  viven en el mismo tren, que era la condición que faltaba.
- **Fase 6b** (vagón de guardias dormidos), **Fase 7** (curva, enganche roto,
  incendio, noche extrema) y **Fase 8** (el ladrón rival, lo más grande).

## Pendientes sueltos

- **Los atajos de prueba del campamento** (marcados 🧪 en scenes/campScene.js):
  [2] la escopeta, [3] el Winchester, [4] directo a
  un vagón (pedido por Santi el 2026-10-08, para ver el estilo nuevo con [F9]; desde el
  2026-10-15, al comedor; desde el 2026-10-17, al dormitorio y después a primera clase, que el tren trae
  siempre; desde el 2026-10-22, al enganche de atrás del blindado, con sus puertas empujables), [5] el cuchillo sin comprarlo (2026-10-10, para probar el tajo) y [6] el tren de
  pasajeros con el Sheriff en tu vagón (2026-10-15) y [7] la tormenta (el galope lloviendo; con Shift, la huida;
  2026-11-08, reemplazó a los 950 de recompensa del Cazarrecompensas). El [8] hoy va al techo (con Shift, al techo con tormenta). **Sacarlos antes de mostrar el juego**, junto con la prueba [F9]
  cuando el estilo nuevo esté terminado.
- **Cuánta gente hay en cada vagón** *(Santi, 2026-10-15: "dejemos abierta la posibilidad de sumar
  más y modificar los pasajeros y guardias en ciertos vagones")*: el comedor tiene 5 pasajeros para 10
  mesas y se ve vacío. Revisar pasajeros y guardias vagón por vagón (cambia el juego: más para robar y
  más testigos).
- **El Cazarrecompensas, para después** *(Santi, 2026-10-15: "después pulimos esos detalles del
  Cazarrecompensas, además de que quiero mejorarlo para hacerlo más difícil")*: en la sombra se ve
  casi negro; sus balas salen de un punto fijo y no de la boca del arma; el arma larga desaparece al
  embestir. Y hacerlo más difícil (a diseñar con Santi).
- **Los jinetes más alejados deberían tener menos puntería** *(Santi,
  2026-10-08: "los jinetes más alejados deberían tener menos puntería, pero eso
  lo vemos después")*. Arriba, los de allá van lejos y hoy pegan igual que los
  de acá (`CONFIG.techo.tiroJinetes`). Se ve junto con la C3c (las dos líneas).
- **Los jinetes de allá van al 80%** (elegido por Santi, `costado.allaEscala`),
  y en la línea abierta (C3c) al 75%. Si jugando no se distinguen, bajar la
  abierta a 70 o 65% (`carriles.escalaAllaAbierta`).
- El **`$NaN` en el HUD del campamento**: ya no puede quedar pegado (ver
  `numero()` en `state/gameState.js`). **Si vuelve a aparecer, la consola (F12)
  dice qué campo llegó mal** — esa línea es lo que falta para cerrarlo del todo.
- La **cantina** (contratar compañeros) sigue sin existir.
- El precio del hacha (900) sigue sin confirmar: el bosque no existe.
- `alertaEnPuerta` (systems/ai.js) sigue sin que nadie la llame: candidata a
  limpieza.
- En el código los barriles de pólvora se llaman `cajon` / `cajonPolvora`.
- **El esqueleto de los personajes** (pedido por Santi para más adelante,
  2026-10-04). Hoy cada pose está dibujada con coordenadas sueltas (la cabeza
  en un lugar, el sombrero en otro, el arma en otro), y al mover una pieza las
  demás no se enteran: así salieron el sombrero flotando y las armas cruzando
  el torso al hacer las poses del Winchester y la escopeta. La idea: cada pieza
  pegada a otra (sombrero a la cabeza, mano al brazo, arma a la mano) y una
  pose = cómo se doblan brazos y cabeza. No cambia cómo se ven; hace que cada
  pose o arma nueva salga bien en las 8 direcciones. Conviene antes de la
  escopeta del jugador, los compañeros, los civiles que reaccionan y las
  habilidades (rodar). Trabajo mediano.
- **Guardias: las etapas 1, 2 y 3 están hechas.** La 4 (el jefe del grupo)
  **se descartó** *(Santi: "ya lo hace el sheriff cuando está, y si siempre
  hay uno entonces no tiene sentido el sheriff")*. En su lugar, la **etapa
  final: la auditoría de 800 asaltos** (`banco-inspector.js`) para encontrar
  todo lo que hace ver tontos o inexpertos a los guardias.
- **🗄️ PENDIENTE PARA DESPUÉS: EL PUEBLO NUEVO** (2026-11-10). Santi lo pausó para concentrarse en las mecánicas del asalto: "pasá
  el pueblo a la grilla nueva pero de manera simple [...] el nuevo pueblo déjalo archivado o para después". Hoy se juega el pueblo
  de siempre, con el punto en píxeles enteros (`escenaEntera` en engine/renderer.js) y las letras en la capa fina. El plano nuevo
  está guardado en BLOQUES y sin conectar: `src/data/puebloNuevo.js` y `src/scenes/puebloNuevo.js` (calle principal, 3 caminos,
  calle de atrás angosta, horca enfrente del sheriff, iglesia al final de la calle central más ancha, cementerio, corral, patio de
  tiro). Lo que eligió Santi: tono "desolado en la frontera, no que haya pasado una peste"; pocas construcciones, con callejones
  angostos entre edificios ("serán importantes en la historia"); los techos tapan un poco la calle de atrás; cantina y comedor con
  más de una puerta; banco clausurado; sin casas grandes. **Falta del plano**: el patio de tiro más chico y que se entre hablando
  con el armero, desde la tienda (no por afuera). Después: materiales, dibujar, vida, noche y **el caballo al paso** con sus 8
  GIFs (8 direcciones × 8 cuadros, en `tmp-ref/caballo-camina/`, que no se sube: pedírselos de nuevo si faltan). Para probar el
  plano, volver a conectar `createPuebloNuevo` en scenes/townScene.js.
- **El campamento y el mapa en el estilo nuevo están subidos** (2026-11-08; NOTAS-DISENO.md, "EL CAMPAMENTO Y EL MAPA"), con el
  farol que se prende de noche en el mapa. **Sigue P6: el pueblo y la tienda** (usan `escenaFija`, con el problema de los 2,25 px);
  después P7 (efectos y letras) y P8 (limpieza). Sin probar: salir con clic por una ruta y el mapa en ventanas chicas.
- **El techo en el estilo nuevo está terminado y subido** (2026-11-08; NOTAS-DISENO.md, "EL TECHO EN EL ESTILO NUEVO,
  TERMINADO"): en 3/4, con el tren del galope, y falta jugarlo de corrido. **Lo próximo es seguir con lo que falte de
  dibujo**; Santi: "Las cosas nuevas se harán después de todo lo del dibujo" (espiar por la linterna, túneles, curvas,
  tanques, cubrirse, medir con el bot). También quedan: la huida, el muñeco del polvo; de noche, el Winchester, la escopeta
  y el aro; el Shift+[7] sin probar.
- **El techo nuevo** (plan en NOTAS-DISENO.md, "EL TECHO NUEVO"): cinco
  etapas, de a una y jugando cada una. **La 1 (sentirse arriba) está jugada y
  confirmada; la 1b dejó sus reglas (resbalar, colgarse, caerse del tren) pero
  su dibujo se descartó. Ahora arriba la vista es DE COSTADO, como el galope
  (opción C, elegida por Santi): C1 (corregida a lateral de verdad) y C2 (leer
  el ancho) hechas y sin jugar. Después: arriba se va agazapado (cuerpo a
  tierra con Shift, sprint con doble toque que te hace perder pie) y con
  tormenta es más difícil (opción B). C3a (los jinetes te tiran arriba según
  tu postura, idea de Santi, números B) y la caída al enganche con transición:
  hechas y sin jugar.** C3b (vos les tirás, con la regla del espejo) hecha, y después los de allá
  lejos y a la vista por encima del techo y el tiro de galería (sin raya), sin
  jugar. C3c (los
  jinetes en dos líneas, con la rotación que diseñó Santi) hecha y sin jugar.
  E1, E2 y E3 del esqueleto hechas (E3 sin jugar). **El dibujo cambió de
  rumbo: EL ESTILO NUEVO** (ver NOTAS, "EL ESTILO NUEVO"): pixel art en grilla
  de 3×3, paleta de 48 y gente de 32 sin cara, dibujada a mano. P0 (la base,
  con la prueba en F9), P1 (el vagón de pasajeros) y P2 (el jugador, adentro)
  hechas; sigue **P3, los guardias y los pasajeros**: el paso 1 (el diseño de la
  gente y sus variantes, entities/estiloNuevo/gente.js, todavía sin usar en el
  juego) está cerrado; P3a (las poses y animaciones del guardia común y del
  pasajero, ya en el juego con [F9], los pasajeros que duermen de noche y la gente que fuma) está
  hecha y falta que Santi la juegue; P3b, las variantes: B1-B4 hechas (pelo, piel, barbas, ropa, cuerpos
  y chaqueta), las poses revisadas por tres subagentes jueces (tmp-ref/jueces.js) y B6 sólo el
  sombrero de paja suelto (B5 y lo demás de B6, afuera); P3b cerrada; P3c: el Encargado, el
  blindado, el Pistolero, el Sheriff y el Cazarrecompensas hechos; queda el Dinamitero, que espera a
  que exista su vagón. Sigue **P4, los otros vagones, primero el tren de pasajeros entero**: el
  comedor (el pobre) hecho, con su gente sentada a la mesa (comiendo, tomando del jarro) y el que
  duerme acostado en el banco; el dormitorio (clase media) hecho, con su gente y sus cortinas (se abren al
  pasar y quedan abiertas; los tiros las agujerean y rompen); primera clase (el coche salón con la barra y
  la cobertura baja) hecho, con su gente dibujada (el rico, el bartender, los guardaespaldas); los ricos
  sorteados (2 a 4) con un guardaespaldas cada uno, sentados echados atrás con los pies en el banquito;
  el puro, la copa y el bartender secando hechos, y el borde fino entre brazo y cuerpo en todo el juego;
  la silueta del bartender secando arreglada; los ricos van a la barra y se visitan, con el guardaespaldas
  tomando posiciones y la pistola Volcanic; el bartender que nunca duerme (seca copas y ordena el
  estante de espaldas) y su delantal atado atrás; de perfil, el brazo más centrado y la panza del gordito
  pegada al torso (sin manos volando). Primera clase cerrada; el vagón de guardias
  hecho (cuartel rústico: catres de lona, mesas de pino con la vela, armero, estufa, los de franco
  sentados en cajones de munición que chocan); el correo hecho (casilleros y mesas de clasificar, carros de
  mimbre y cajones de encomiendas, perchero, balanza, reloj); el caboose hecho (escritorio con la taza, estufa
  contra la pared, barril con agua, leña y rueda que se mueven con el tren, una cama); el blindado hecho (jaula,
  cajas fuertes nuevas, parapetos de bolsas con cobertura baja, cofres); LOS ENGANCHES en curso (ver NOTAS, "LOS
  ENGANCHES": fase 1, las puertas finitas, y fase 2, el enganche de chapa que se estira y se encoge con el tren con
  peso, y fase 3, trastabillar, el tiempo de cruzar y el tirón en la puntería, hechas; el techo, para cuando se haga
  en la grilla nueva; fase 4, los frenos rotos, en curso: el frenazo, el aplastamiento y el arrancón hechos, y lo que se
  cae y lo que sale por el pasillo, vagón por vagón (pasajeros, primera clase, correo, guardias, comedor, dormitorio, caboose y blindado hechos, y los guardias ya leen el peligro (systems/peligro.js); el cerrado del tren de carga dibujado en la grilla nueva con sus portones y sus frenos rotos, la cobertura baja para lo caído y la regla de la pared de más acá para las balas, en todos los vagones; el suelo de afuera y la vía en el estilo nuevo (world/estiloNuevo/suelo.js) hechos; el almacén en la grilla nueva con sus frenos rotos (los rollos, el whisky, la escalera que cae última) y las cajas fuertes sorteadas debajo de las ventanillas, hecho; el refrigerado en la grilla nueva (las reses simples que se mecen con el tren, los frenos rotos con la res que se descuelga y el hielo que patina, el vaho y el balazo en las reses) hecho; la plataforma en la grilla nueva (madera o maquinaria, sujeta con cadenas, la lona, el aserrín, lo que rueda y se cae del tren, y lo tirado choca) hecha; el ganado en la grilla nueva (los corrales, los novillos, el piso de arena y paja, los frenos rotos con la tropilla que se escapa) y las puntas del ganado y la plataforma con vallas y tranqueras, hecho; las armas en la grilla nueva (armeros, cajones, la ametralladora bajo la lona, el NO FUMAR, el farol con reja, las balas de cañón y el barril rajado con su reguero que se prende) hechas; la góndola en la grilla nueva (carbón mate y hondo, montones que se corren con su reguero, pared entera sin puertas y escalera de tablas y soga, sin caerse y sin vacas) hecha, y con ella todo el tren de carga; la locomotora que se entra (pasillo, cabina, caldera, maquinista que se rinde, fogonero con pala y un blindado) y las esquinas redondas con choque en todos los vagones con techo, el techo de la locomotora resuelto y los choques de todos los vagones del tamaño de lo que se ve (no se pisa), hechos; el tren desde afuera en la grilla nueva (todos los vagones, la locomotora más corta sólo de afuera y bajo un solo techo, la cola de chapa con su luz roja de noche) hecho; la cabalgata en curso: el caballo de Santi en la grilla, el jinete del jugador y los jinetes de la ley (guardias con el rifle en la funda, en los cuatro cuerpos) hechos; E4 en curso: los de la ley ya sacan el rifle y apuntan dados vuelta en la silla con la cabeza en la culata (sin la raya de aviso), y el fogonazo nuevo en la grilla sale de la boca del caño, también desde el techo (ver NOTAS, "E4 · EL FOGONAZO DE LOS JINETES"); y se caen del caballo para atrás, con el caballo que se abre y el tirado de costado (con y sin chaqueta) levantando polvo (ver NOTAS, "E4 · SE CAEN DEL CABALLO"); el paisaje del galope en la grilla nueva (el desierto, los obstáculos, las mesetas de colores, el cielo con dos capas de siluetas y las mesetas del medio en dos niveles, los buitres), los tres pelos del criollo para los jinetes y el choque desde las patas, hecho (ver NOTAS, "EL PAISAJE DEL GALOPE"); la huida en la grilla nueva (el desierto en campo abierto con la lupa del galope de lejos, sin vetas que titilen; el jugador tirando con el Colt dado vuelta en la silla; el polvo de los cascos con la nube de la partida en lo alto; la tormenta que se ve en el galope y en la huida; las mesetas y agujas de la huida; los algarrobos en el galope y en la huida) hecha (ver NOTAS, "LA HUIDA EN EL ESTILO NUEVO"); los jinetes de la ley en la huida apuntando con su dibujo chico, el brillo del caño antes del tiro y el lazo entero en la grilla (enrollado en el cuerno, revoleo de 1,6 s medido, el tiro y el enlazado con el aro en el pescuezo del caballo) hechos (ver NOTAS, "LOS JINETES DE LA HUIDA"), falta mirarlos de noche; el Winchester y la escopeta tirando desde el caballo y la caída chica de los jinetes hechos (ver NOTAS, "LA HUIDA: EL WINCHESTER"); sigue revisar por qué la huida se siente más lenta que el galope (medida, va igual) y, pendiente, el guardia de a pie apuntando derecho arriba o abajo; ver NOTAS, "E4 · LOS JINETES DE LA LEY APUNTAN"; ver NOTAS, "LA CABALGATA", también sus reglas)), y revisar
  los choques de los otros vagones (que coincidan con lo dibujado) (ver NOTAS, "P4 · LOS OTROS
  VAGONES", y
  "P3 · LA GENTE DEL TREN"). La E4 (los
  jinetes) se hace en P5, ya en el estilo nuevo. Después las
  escalerillas, los obstáculos del mundo (túneles, curvas), medir con el bot y
  los guardias en el techo. Hay código de la vista de arriba del techo sin uso
  para limpiar (ver NOTAS, etapa C1).
- **El servidor de pruebas (8082) no suena**, ni nada con `?mudo` en la
  dirección (`engine/audio.js`).
- **El bot asaltante** (`banco-asaltante.js`, hecho 2026-10-05): vuelve
  herido 9 de cada 10 veces y nunca pasa del vagón ~3, así que mide el
  principio del tren, no el blindado ni el fondo. Si hace falta medir más
  adentro, enseñarle a curarse o a retirarse a tiempo de una pelea.

## Cómo trabajar conmigo

- Soy principiante programando: explicame en español simple.
- Antes de construir algo grande, planteame el plan concreto (qué archivos, en
  qué orden) y esperá mi confirmación. Si hay un número o una decisión de diseño
  sin cerrar, preguntame — con 2-3 opciones concretas, el EFECTO medido o
  calculado de cada una, y una recomendada con su razón. No lo dejes abierto.
  Muchas veces NO elijo ninguna de las tres, o elijo una y le agrego una
  condición propia encima: las opciones sirven para que yo vea el rango.
- **Decime cuando algo que pido está mal, y medímelo.** Esta sesión pasó dos
  veces y las dos veces sirvió: sacar el vagón blindado del tren de carga iba a
  dejarlo MÁS vacío (le sacaba 4 de 12 guardias), y se construyó con dos
  compensaciones. Obedecer y listo hubiera sido peor.
- **Y aceptá cuando yo encuentro algo mal.** Yo vi que la mochila no dejaba
  soltar nada: eso era un agujero de diseño, no un detalle.
- Cuando la implementación termina distinta de lo que pedí, decímelo directo. Y
  si en el medio tenés que apartarte de lo acordado, decímelo AL ENTREGAR, no lo
  dejes escondido en el código.
- **Mostrame las cosas visuales en vez de describírmelas.**

### Lecciones de arnés de prueba (esto ahorró y costó horas)

- **`FORAJIDO.loop.stop()` CONGELA EL MUNDO, y es la herramienta más útil que
  hay.** Se expuso esta sesión después de perder media docena de capturas: el
  bucle corre con `requestAnimationFrame`, así que entre la llamada a la consola
  y la foto el asalto terminaba solo. Con el bucle frenado se pisa cuadro a
  cuadro a mano (`scenes.update(1/60)` + `input.endFrame()`), se dibuja con
  `scenes.render(renderer)` y la foto muestra exactamente lo que dejaste.
- **Si manejás el paso a mano, manejá TODO el cuadro a mano.** Llamar
  `scenes.update()` sin `input.endFrame()` deja las teclas latentes: una venta se
  ejecutó dos veces y parecía un bug del perista.
- **Si tu banco de pruebas consume tiempo de juego, vigilá el reloj del juego.**
  Un bucle que llenaba la mochila se comió los 165 s del asalto, así que `TAB` y
  `E` le llegaban a la pantalla de resultados — y el servicio `raid` que yo
  seguía leyendo era el del asalto viejo, con números plausibles.
- **Sin control no hay medición, hay una anécdota.** Me convencí de que un vagón
  cerrado partía el tren en dos y llegué a codificar el arreglo; el mismo tren
  con la puerta ABIERTA mostró 70 px de diferencia en 200 s.
- **No confundas una conducta de diseño con un síntoma.** Dos veces marqué como
  "trabado" al centinela del blindado, que está quieto a propósito, y una vez al
  Dinamitero, que ya tenía destrabe. Y los guardias de ADELANTE no te vienen a
  buscar: está en el README hace meses.
- **A veces el instrumento correcto no es simular, es mirar los datos.** El bug
  de los guardias trabados no salió en cinco corridas de 90-150 s; apareció
  cruzando estáticamente cada ronda contra cada posición de barril.
- **El parámetro de escena es `tipoTren`, no `tipoTrenId`.**
- **Un guardia lejos del jugador no se actualiza** (`CONFIG.raid.
  cullPatrolDistance`, 700 px). Subilo para medir.
- **Verificá que el escenario sea válido** (que el punto no sea sólido, que haya
  línea de visión) y **que el mundo siga vivo** (forzá `player.health` y
  `player.alive` cada cuadro).
- **No le creas a una corrida chica**: miles de tiradas si es una probabilidad.
- **`Math.round(y / tileSize)` sobre un `tileCenter` miente.** Es `Math.floor`.
- **`0` es falsy — cuidado con `campo || default`.** Ya pasó cinco veces.
- **No inventes objetos internos del juego** ni **reasignes los arrays del
  mundo** (`w.passengers = [...]`): usá `splice`.

### Mirar y oír

- **Para cualquier cambio visual, mirar no es opcional.** Esta sesión encontró
  que la mochila dibujada en la espalda era **invisible** (`#5a4530` contra un
  piso `#6d4a30`: el mismo marrón), que el TAB **mentía** dibujando casillas
  sueltas en vez de bultos, y que dos textos se salían de la pantalla.
- `computer{action:"screenshot"}` funciona; `zoom` **no** está soportado. Para
  ver algo chico, redibujá un recorte ampliado sobre el propio canvas (con el
  bucle frenado ya no hace falta un `requestAnimationFrame` propio).
- **`FORAJIDO.config` es el CONFIG vivo**: mutarlo y volver a renderizar cambia
  la pantalla al instante. Es la forma de probar paletas sin tocar archivos.
- También está `foto.ps1` (raíz) para recortes ampliados por `fetch`.
- **El audio no suena hasta que el usuario toca algo**: `window.dispatchEvent(new
  PointerEvent('pointerdown'))` y esperar ~150 ms.
- **El sonido casi no se puede verificar desde la consola.** Se puede comprobar
  que las capas existen y que los volúmenes cambian, pero si suena a lluvia sobre
  una chapa no hay forma de saberlo desde acá. **El sonido se corrige con mi
  oído.**

### Servidor y cómo lo abro

- **El juego está publicado y siempre al día**: `https://santia-web.github.io/Forajido/`.
  Es lo que uso para jugar, y sirve además como **control del código viejo**
  cuando querés medir un antes/después.
- Para probar cambios antes de subirlos, yo abro `jugar.bat` (raíz).
- Para vos: `powershell -NoProfile -ExecutionPolicy Bypass -File servidor.ps1 -NoBrowser -Port 8082`
  (el `-ExecutionPolicy Bypass` hace falta). **Tu servidor se muere al terminar
  la sesión**; si el puerto queda ocupado, usá otro. **Si hay un `servidor.ps1`
  sin `-Port` corriendo, ése es MÍO (el 8080) y no se toca.**

### Documentación y git

- Actualizá `README.md` y `NOTAS-DISENO.md` cuando cerremos algo, y reescribí
  este archivo (`PROMPT-CONTINUAR.md`) al final de la sesión, **enfocado en la
  sesión que termina** — no lo vayas acumulando: el detalle histórico ya vive en
  los otros dos y en el git log.
- Repo: `https://github.com/SantiA-web/Forajido`. Flujo: `git add <archivos>`,
  `git commit`, `git push`. Nada de `--force` salvo que yo lo pida. **Se sube al
  cerrar cada cosa.**
- Los commits van en **español sin tildes**, título de una línea, y el cuerpo
  cuenta qué se pidió, qué se rompió y qué se midió.

## Estado del proyecto

**Fase 2** (el asalto) y **Fase 3** (campamento → pueblo → mapa → tienda) están
construidas y jugables, con reputación completa (`fame`/`bounty`/`honor`) y
refuerzos que escalan. El ciclo cierra de punta a punta: campamento → mapa →
galope → asalto → resultados → campamento, y ahora también **→ perista**.

El plan en curso sigue siendo **"variedad de lo que pasa en los trenes"**, pero
la sesión pasada le cambió el eje: ya no es sólo *qué te encontrás adentro* sino
**qué clase de tren es**.

### En reserva (construidos, medidos, apagados)

La dificultad **Alta vigilancia** (`peso: 0`), y en
`src/data/modifiers.js` el **Pistolero** (ojo: se apagó ANTES de que se arreglaran
sus dos bugs, así que nunca se lo vio funcionando bien) y el **civil encubierto**.
Son llaves, no amputaciones.

### Dónde está cada cosa nueva

```
src/data/objetos.js     el catálogo de mercadería: niveles, formas, valores
src/data/perista.js     las reglas de precio (limpio + escalones de honor)
src/engine/grilla.js    la grilla que acomoda bultos (no sabe nada de western)
src/data/wagons.js      el vagón `almacen`, y las siluetas del botín físico
src/data/train.js       los dos tipos de tren
```
