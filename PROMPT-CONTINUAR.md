Estoy desarrollando Forajido, un western pixel art de asaltos a trenes en
HTML/CSS/JS vanilla, en `C:\dev\forajido`. Antes de proponer o tocar nada, leé
completos `README.md`, `NOTAS-DISENO.md` y `src/data/config.js` — ahí está el
contexto del proyecto, el detalle de cada sistema, y cómo trabajar conmigo.
No me resumas lo que dicen: son la memoria real del proyecto entre sesiones,
así que confiá en ellos más que en cualquier cosa que yo te diga de memoria.
`NOTAS-DISENO.md` es grande: usá Grep para ir a la sección que necesites en vez
de leerlo entero de punta a punta cada vez.

## Cómo trabajar conmigo

- Soy principiante programando: explicame en español simple.
- Antes de construir algo grande, planteame el plan concreto (qué archivos,
  en qué orden) y esperá mi confirmación. Si hay un número o una decisión de
  diseño sin cerrar, preguntame — con 2-3 opciones concretas, el EFECTO
  medido o calculado de cada una, y una recomendada con su razón. No lo dejes
  abierto. Esto funciona muy bien: cada vez que hubo un número por decidir,
  se me mostró en una tabla con el resultado de cada opción y elegí con eso
  delante. Y tené en cuenta que muchas veces no elijo ninguna de las tres:
  esta sesión, sobre "¿qué hace distinto al Pistolero?", contesté con algo
  propio ("gatillo velocísimo, tiene un revólver en cada mano, se cubre poco,
  se suele parar en medio del pasillo"). Las opciones sirven para que yo vea
  el rango, no para que elija una sí o sí.
- Cuando te doy una idea y la implementación previa termina siendo distinta
  de lo que pedí, decímelo así de directo la próxima vez y ajustá — no hace
  falta que te disculpes de más, pero tampoco sigas de largo con un supuesto
  mal armado. Y si en el medio de construir tenés que apartarte de lo que
  acordamos, decímelo al entregar, no lo dejes escondido en el código.
- Cuando algo se pueda verificar jugando, hacelo de verdad, no sólo midiendo
  código — pero el panel del navegador de este entorno casi nunca compone
  frames (el screenshot normal falla con "not displayed, so the page is not
  compositing"). Verificá igual, por consola, manejando el motor a mano:
  FORAJIDO.services.scenes.update(1/60) + FORAJIDO.services.input.endFrame()
  en loop, disparando teclas con
  window.dispatchEvent(new KeyboardEvent('keydown'/'keyup', {code: 'KeyE'}))
  (los eventos de teclado sí llegan; los de mouse en el canvas no siempre, ahí
  conviene mutar input.mouse.x/y/down directamente — y OJO, la cámara sigue al
  jugador, así que fijar el mouse en coordenadas de pantalla una sola vez y
  dejar correr varios cuadros hace que el ángulo/posición real se corra solo:
  resincronizá el mouse contra el mundo en cada cuadro de la prueba. La cuenta
  es `input.mouse.x = puntoDelMundoX - camera.x`). Cada escena expone su
  estado en FORAJIDO.services.<nombre> (camp, town, interior, mapa, ride,
  raid, train, tienda) para poder inspeccionar sin ver la pantalla — ojo que
  `services.raid` ES el world directo (raid.enemies, raid.doors, raid.player),
  no un objeto con un `.world` adentro.
  Para forzar un asalto directo desde consola sin jugar el galope:
  `FORAJIDO.services.scenes.goTo('raid', { alarmaInicial: true, boardAt: N })`
  — y para probar clima/estado/comportamientos/variantes del sistema de
  "variedad de trenes" (ver más abajo), pasalos directo en el mismo objeto:
  `{ clima, estado: [...], comportamientos: [...], variantes: [...],
  encubiertos: [...], composicion: [...] }`.

### Lecciones de arnés de prueba (esta sesión perdí mucho tiempo con esto)

- **La mitad de los "no funciona" de esta sesión eran del arnés, no del
  código.** Antes de creerle a una medición en cero, verificá que el
  escenario sea válido: que el punto donde ponés al jugador NO sea sólido
  (`map.isSolidAt`) y que HAYA línea de visión de verdad
  (`hasLineOfSight(..., map.blocksSightAt)`). Poner al jugador "al lado" de
  un pasajero lo pone detrás de un asiento la mitad de las veces, y ahí nadie
  ve a nadie. Construí el escenario buscando un punto válido en un bucle, no
  a ojo.
- **No reasignes los arrays del mundo** (`w.passengers = [...]`): la escena
  guarda su PROPIA referencia a ese array, así que reasignar la propiedad
  deja a la escena actualizando el array viejo y la prueba mide un mundo
  fantasma. Usá `splice` sobre el mismo array
  (`w.enemies.splice(0)`, `w.passengers.splice(0, len, unSolo)`).
- **El mapa NO re-sortea los trenes en cada `goTo('mapa')`** — los trenes son
  objetos persistentes que siguen su circuito. Si querés muestrear el sorteo
  real (por ejemplo para probar un gate que depende de `gameState`), tenés que
  dejar correr el tiempo con `scenes.update` y juntar los trenes nuevos a
  medida que cierran vuelta, o vas a estar mirando 40 veces los mismos cinco
  trenes sorteados antes de tu cambio.
- **Cuando una entidad "no se mueve" y no se entiende por qué, dibujá una
  grilla de solidez alrededor suyo** (tile por tile, marcando `#` sólido, `.`
  libre, y la posición de la entidad y del jugador). Esta sesión eso mostró
  de un vistazo que el guardia estaba metido en el hueco entre dos bloques de
  asientos, con salida sólo arriba y abajo — algo que ninguna medición de
  distancias había dejado ver en media hora.
- **Para encontrar la causa real de un bug de comportamiento, interceptar los
  eventos del bus ayuda mucho** (parchear `services.raid.bus.emit` para
  loguear qué evento salta y en qué cuadro). Un mismo síntoma puede tener dos
  causas distintas.
- **Un guardia lejos del jugador no se actualiza** (`CONFIG.raid.
  cullPatrolDistance`, 700px) — así que si armás una prueba con el jugador
  forzado lejos de un guardia en particular, ese guardia se congela del todo
  y un resultado en cero puede ser el arnés.
- **`0` es falsy en JavaScript — cuidado con `campo || default` cuando un
  campo puede valer 0 A PROPÓSITO.** Ya nos pasó con `noiseWagons`; esta
  sesión el mismo patrón apareció con `dynamite` (ahora
  `options.dynamite ?? tipo.dynamite ?? 0`). Cada vez que un número de config
  pase a valer 0 de verdad, grepear ese campo buscando `|| ` cerca.
- **Ojo con el caché del módulo en una pestaña vieja.** Si editás un .js y
  volvés a medir en la MISMA pestaña sin recargar, el bucle real del juego
  puede seguir con el código viejo (los `import()` sueltos de una prueba sí
  traen el archivo fresco). Si una medición contradice a la anterior sin que
  el código haya cambiado, recargá antes de seguir debuggeando.
- **No le creas a una corrida chica.** Miles de tiradas si es una
  probabilidad, varias corridas completas si es un comportamiento.
- Cuando midas algo con un bot, cerrá siempre con una corrida COMPLETA
  (30-60 s de asalto real con todo encendido), no sólo con la prueba
  aislada.

### Mirar

- Para MIRAR algo de verdad (un dibujo, una composición, un color), usá
  foto.ps1 que está en la raíz del proyecto: se levanta con
  `powershell -NoProfile -ExecutionPolicy Bypass -File foto.ps1`, y desde la
  consola del navegador se le manda el canvas (o un recorte ampliado con un
  canvas propio, escalado con `imageSmoothingEnabled = false`) con fetch a
  http://localhost:8099/<nombre>. Para que el canvas tenga algo dibujado hace
  falta forzar un `render()` a mano primero
  (`FORAJIDO.services.scenes.render(FORAJIDO.services.renderer)`). Y para
  encuadrar bien el recorte, calculá la posición en PANTALLA de lo que querés
  ver: `x - camera.x`, `y - camera.y`.
- **Para cualquier cambio visual, mirar no es opcional.** Esta sesión, otra
  vez, mirar encontró dos cosas que ninguna medición podía dar: las
  cartucheras del Pistolero eran marrones sobre el piso marrón del vagón (no
  se veían: se movieron encima del torso y en claro), y el cartel "¡ERA DE LA
  LEY!" se encimaba con el `!` de alerta del guardia.
- Acordate de cerrar el receptor y borrar los .png de prueba al terminar.

### Servidor

- Se levanta con `C:\dev\forajido\jugar.bat` o
  `powershell -NoProfile -ExecutionPolicy Bypass -File servidor.ps1 -NoBrowser -Port <N>`
  (el flag `-ExecutionPolicy Bypass` hace falta en este entorno). Si el 8080
  ya está en uso por otra sesión mía, no lo toques: levantá otro con -Port en
  algo como 8082. Al terminar, cerrá con Stop-Process sólo los procesos que
  vos arrancaste (filtrá por CommandLine).

### Documentación

- Actualizá README.md y NOTAS-DISENO.md cuando cerremos algo — son la memoria
  del proyecto entre sesiones, no documentación opcional. Y este mismo archivo
  (PROMPT-CONTINUAR.md) reescribilo al final de la sesión enfocado en la
  sesión que termina, no lo vayas acumulando: el detalle histórico ya vive en
  README.md, NOTAS-DISENO.md y el git log.

## El proyecto ya está publicado

Repositorio real de GitHub, público: `https://github.com/SantiA-web/Forajido`.
Publicado con GitHub Pages en `https://santia-web.github.io/Forajido/`.

**Cuando cerremos algo y yo pida subirlo**, el flujo es: `git add -A`,
`git commit -m "..."`, `git push`. La identity de git ya está configurada
SÓLO en este repositorio — no hace falta tocarla. No uses `--force` salvo que
yo lo pida explícitamente.

**Ojo: sigue habiendo varias sesiones de trabajo sin commitear.** Al momento
de escribir esto, `git status` da 39 archivos. Todo lo que se describe abajo
vive sólo en el disco, no en git. Si te pido subir, corré `git status` de
nuevo antes de asumir cuánto es.

## Estado del proyecto (a esta fecha — confirmalo leyendo los archivos)

**Fase 2** (el asalto al tren) y **Fase 3** (campamento → pueblo → mapa →
tienda) siguen construidas y jugables de punta a punta, con el sistema
completo de reputación (`fame`/`bounty`/`honor`) y la escalada de refuerzos.

El plan en curso es el que yo llamo **"variedad de lo que pasa en los
trenes"**: *"conozco estos vagones, pero nunca sé exactamente qué me voy a
encontrar."* Son 8 fases. **Están cerradas la 1, la 2, la primera mitad de la
3 y la 4 entera.** La 3b (durmiendo) la salteé a propósito (ver abajo).

Todo esto SÓLO le pasa al tren estándar (`tipoTren.modificadores`,
data/train.js): el veloz y el de carga ya tienen identidad propia.

### Ajustes que pedí jugando (primera tanda)

Empecé a jugarlo y a pedir ajustes sobre la marcha, que es como conviene
seguir. Hechos y verificados:

1. **Recargar te frena**: mientras recargás caminás a 55 px/s en vez de 78
   (la velocidad de ir de costado; reusa `direccionCostado`).
2. **La pareja que conversa se avisa**: si uno se pone en amarillo, el otro
   también, **un segundo después** (`CONVERSANDO_CONTAGIO`). Antes ninguno
   sabía con quién estaba hablando.
3. **Los vecinos ya no cruzan por un tiro**: un disparo sigue poniendo en
   rojo tu vagón y en amarillo los dos de al lado, pero ésos **se quedan en
   el suyo** (`alertaEnGuardia`). Antes cruzaban 2-3 y llegabas a tener 6
   encima. ⚠️ OJO: con la ALARMA sonando siguen viniendo como siempre — sin
   esa condición, disparar te sacaba perseguidores de encima.
4. **`alertaActivada` de 20% a 10%**: subir con el tren ya sobre aviso pasó
   a ser raro.

5. **🐛 Los guardias plantados se empujaban y se iban a la deriva.** Lo vi
   jugando ("parecen que están hablando pero uno empuja al otro"). Eran dos
   cosas: nacían a 9px cuando el mínimo entre guardias es 13 (vibraban en el
   lugar, 94px cada 10 s), y sobre todo **no tenían a dónde volver** — el
   compañero que patrulla los empujaba y quedaban a la deriva (medido: 326px
   de recorrido, terminando a 260px uno del otro). Ahora tienen `puesto` y
   vuelven caminando, recuperando hacia dónde miraban.
   ⚠️ Mi primer arreglo fue PEOR: hacer inamovible al plantado dejaba
   **prensado** al que se metiera entre dos (18px de hueco, 13 de separación
   mínima por lado). Anotado: en un pasillo angosto, hacer inamovible a
   alguien crea una trampa para el que pase.

### Las cajas fuertes, rehechas (segunda tanda de ajustes jugando)

Pedidos míos, los cuatro hechos y verificados:

1. **8 segundos** en vez de 6,5 (`CONFIG.loot.strongboxTime`). Ahora las dos
   cajas del juego tardan lo mismo.
2. **Disparar o recargar interrumpe** la apertura. Con el arma en la mano no
   se abre una caja.
3. **El progreso NO se pierde**: volvés y seguís desde donde ibas (medido:
   3 s + 5,02 s = 8,02). Sólo las cajas — las bolsas se siguen reiniciando.
4. **La dinamita las revienta**: quedan abiertas con el botín a la vista y
   levantarlo cuesta lo que una bolsa (0,6 s). No te regala la plata, te
   ahorra el forcejeo — y cuesta un cartucho de dos más la alarma segura. Se
   dibujan distintas de las cerradas.

**🐛 Y un bug que encontré jugando: la caja oculta quedaba ENCERRADA dentro
de un corral.** Los corrales del vagón de ganado son bloques huecos, y el
interior (suelo libre rodeado de 'C') pasaba el filtro de "pegado al mueble":
22 de 48 cajas que caían ahí eran inalcanzables. Arreglado con un relleno por
inundación desde el pasillo — un escondite sólo vale si se puede llegar
caminando. Es genérico: cualquier vagón futuro con un rincón cerrado queda
cubierto sin acordarse de este caso.

**Lo de los CINCO guardias en el correo no era un bug**: el correo trae 3 de
fábrica (6 con redada). Medido, el pico cerca tuyo ahí es 3 sin alarma, **5
con la alarma sonando** y 8 con redada. Los dos de más son los que llegan de
otros vagones — o sea la retirada funcionando, que es justo lo que decidimos
no tocar.

Descartado con datos: pedí que se vieran los enganches desde el caballo
porque me encontraba guardias ahí, pero medimos que **ninguno nace ni
patrulla hasta un enganche** (el que aparece es uno alertado buscándote), así
que lo dejé. El combate durante el galope sería un sistema nuevo, no un
ajuste.

### ⚠️ IMPORTANTE: los tres tipos de guardia quedaron EN RESERVA

Jugué el Pistolero, salieron dos bugs, los arreglamos, y al final decidí
**dejar los tres personajes nuevos apagados** (`chance: 0`) y seguir con el
resto del plan: *"dejemos de lado a los personajes por ahora"*. Pistolero,
Dinamitero y civil encubierto están construidos, medidos y documentados
enteros — lo único apagado es que salgan sorteados, y el valor con el que se
probó cada uno está escrito al lado del cero en `data/modifiers.js`.

Lo ÚNICO de la Fase 4 que está prendido y jugable hoy es la **puerta
bloqueada**.

### Lo que esta sesión agregó (Fase 4) — NADA DE ESTO LO JUGUÉ TODAVÍA

1. **Puerta bloqueada** (`ESTADO_TREN.puertaBloqueada`, 15%): una, dos o tres
   puertas de madera al azar nacen trabadas — hay que romperlas a tiros.
   Reusa entero el mecanismo `trabada` del Cazarrecompensas. Cantidad
   sorteada por peso 70/20/10 (promedio 1,4). Matar al Cazarrecompensas ya no
   abre las que venían trabadas de fábrica (`trabadaDeOrigen`).
2. **El Pistolero** (`GUARD_TYPES.pistolero`): dos revólveres, tandas de 4
   tiros casi pegados (2,8 balas/s contra 0,77 de un guardia común), +40% de
   dispersión y **no busca cobertura nunca** (flag `evitaCobertura`, que apaga
   `needsCover` en `doCombat` y lo deja caer en la rama de "sin cobertura" que
   ya existía). Aparece sólo con `bounty >= 300` **Y** `honor <= -10`, y ahí
   20% por guardia común.
   **Lo jugué y salieron DOS bugs, los dos arreglados en la misma sesión:**
   - No se sentía rápido: `tryFire` (systems/ai.js) leía la constante global
     en vez del perfil del guardia, así que sus tres números de cadencia no se
     aplicaban. Arreglado (no-op para todos los demás, verificado sobre 350
     guardias) y los valores subidos a 4 balas / 0,40 s.
   - "Se para en el pasillo y después se frena": plantarse en el medio del
     pasillo lo pone donde caminan sus compañeros, y con uno en la línea de
     tiro `allyInLine` no lo deja disparar — pero él no buscaba cobertura ni
     se reubicaba, así que se quedaba clavado (medido: de 2,6 balas/s a 0,2,
     100% quieto). Ahora: si te ve pero lo tapan, **se corre al costado y si
     no puede, se adelanta**; si te pierde de vista, **se cubre** a los 0,6 s
     (`CONFIG.enemy.descubiertoBloqueoMax`) y suelta la cobertura apenas te
     vuelve a ver.
3. **El Dinamitero** (`GUARD_TYPES.dinamitero`): construido entero pero con
   `chance: 0` — espera el vagón de armas (Fase 6), como pedí. Reusa el
   sistema de tirar dinamita del blindado sin tocar una línea de ai.js.
4. **El civil encubierto** (`GUARD_TYPES.encubierto`): un pasajero por vagón
   (10% por pasajero, ~1,1 por tren) que se revela **cuando le das la
   espalda** (64px, coseno −0,3 contra la mira, sostenido 0,8 s), avisa 1,1 s
   sacando el arma (con el martillo del revólver) y recién ahí se convierte
   en guardia de verdad — sale de `passengers`, entra en `enemies`, y sigue
   vestido de civil.

**Tercer eje de sorteo nuevo:** `VARIANTES_GUARDIA` (data/modifiers.js) se
juega POR GUARDIA (clima/estado son del tren, comportamientos del vagón). El
permiso se calcula en mapScene (que conoce `gameState`) y viaja como dato:
`world/train.js` sigue sin leer el estado de la partida.

### Dos cosas donde me aparté de lo acordado (y por qué)

- Al Pistolero le sumé `burstDelay` 0,28 → 0,16, que no estaba en la tabla
  que aprobé. Es la lectura literal de "un revólver en cada mano". Si no me
  gusta, se saca de `GUARD_TYPES.pistolero.ai`. (Después, jugándolo, subí
  además `burstSize` a 4 y bajé `fireCooldown` a 0,40 — eso sí lo elegí yo
  sobre una tabla.)

### Una lección de medición que costó cara

El Pistolero se "verificó" midiendo **balas en 30 segundos contra un guardia
común**: 44 contra 6, un 7× que parecía confirmar todo. Pero esa diferencia
venía ENTERA de que no se cubre; su cadencia propia no se estaba aplicando
por un bug, y la medición del efecto TOTAL lo tapó. **Cuando un cambio tiene
dos ingredientes, medí cada uno por separado** — acá el que lo encontró fue
mirar los intervalos entre bala y bala (0,38 s, o sea el ritmo del guardia
común) en vez del total.
- El civil encubierto iba a revelarse sólo estando tranquilo o amenazado, y
  medido así casi no se activaba nunca (para que le des la espalda tenés que
  estar cerca, y cerca te ve y entra en pánico). Ahora se revela desde
  cualquier estado: **el pánico es parte del disfraz**. Lo único que lo frena
  es que lo tengas encañonado robándole.

### Un agujero viejo que quedó anotado, no arreglado

Un guardia que empieza a pelear metido ENTRE los asientos elige una cobertura
del otro lado de un bloque y se queda empujando contra el respaldo sin
disparar: a menos de `routeDistance` (150px) la IA va en línea recta sin
rodear, y el `stuckTimer` no lo suelta porque se mueve unos píxeles y lo
resetea. No se veía porque todos los guardias entran caminando por el pasillo
desde lejos (y desde lejos sí calculan ruta). Lo esquivé para el encubierto
(`evitaCobertura` + levantarlo al pasillo), pero el agujero sigue ahí.

## El plan de "variedad de trenes" — qué falta

3b. **Durmiendo** — SALTEADA a propósito: *"requiere que sea de noche, y que
    sea de noche significa otras cosas, no solo 'es de noche'"*. Arrastra un
    sistema entero que no existe. Va junto con el vagón de guardias dormidos
    (Fase 6) cuando hagamos la vuelta de la noche.
5. **PRIMERA MITAD HECHA** (`data/paquetes.js`, nuevo). Los **paquetes**: un
   objetivo valioso con su custodia, metido en un vagón cualquiera — 20% por
   vagón con pasajeros, o sea que **uno de cada dos asaltos trae alguno**.
   Están construidos y PRENDIDOS los dos que elegí:
   - **Pasajero rico**: lleva $150-250 (contra $25-70) pero tarda 2,2 s en
     soltarlo (contra 1,4).
     Se lo reconoce por el **sombrero de copa** (la silueta más alta del
     tren); antes era idéntico a cualquier pasajero.
   - **Caja fuerte oculta** (segunda vuelta, rehecha sobre mi idea): es DEL
     TREN (25%), cae en cualquier vagón menos el blindado, y **tres pasajeros
     cualesquiera** saben dónde está. Al amenazar a uno te dice
     `VAGÓN 3: DEBAJO DE UNA MESA` — y nada más: **la caja no se marca**,
     aparece recién cuando la tenés al lado. Cuatro escondites según el vagón
     (ventana / asiento / mesa / corral), sacados del layout del vagón, no de
     una lista a mano. Vale $400-900 y tarda 8 s.
   - La **pista** del pasajero rico es el guardaespaldas: un guardia plantado
     al lado que dice "VIGILANDO", reusando el cartel de la Fase 3.
   Los otros dos ya tienen decisión tomada, aunque no estén construidos:
   - **Objeto especial**: elegí que **no sea plata** — un objeto que se lleva
     y se vende después en el pueblo. Eso necesita un INVENTARIO, que hoy no
     existe, así que es una sesión aparte (y de paso es lo que después
     habilita cosas como el hacha o los objetos únicos).
   - **Comerciante**: lo dejé para más adelante, cuando exista algún sistema
     de gente con la que se habla (la cantina, por ejemplo).
   - **Cómo se encuentra la caja oculta** (decidido): **te la delata un
     pasajero cuando lo amenazás** — ata dos sistemas que ya existen y le da
     a robar pasajeros un motivo nuevo además de la plata suelta.
6. Los dos vagones nuevos: **de armas** (reusa el sistema de explosivos, y es
   lo que prende al Dinamitero, que ya está construido esperándolo) y de
   guardias dormidos (depende de 3b).
7. Curva, enganche roto, incendio, noche con oscuridad extrema — lo más nuevo
   y grande; la oscuridad merece su propia sesión.
8. El ladrón rival, al final — un personaje autónomo, no bloquea nada.

`frenosDañados` y `listaAbierta` (ESTADO_TREN) siguen como llaves apagadas.

## Lo que queda pendiente, sin fecha fija

- **Jugar la Fase 4** — es lo más natural para abrir la próxima sesión, pero
  preguntame primero.
- **Números de esta sesión sin calibrar jugando**: `CHANCE_PAQUETE` (20% por
  vagón con pasajeros → uno de cada dos trenes trae uno), el botín y el
  tiempo del pasajero rico ($150-250 / 2,2 s) y de la caja oculta ($400-900 /
  8 s); la chance de `puertaBloqueada` (15%) y su distribución 70/20/10; los cinco números del
  perfil del Pistolero y su 20% de aparición; el piso de bounty 300 /
  honor −10; `CHANCE_CIVIL_ENCUBIERTO` (10% por pasajero → 74% de los trenes
  traen alguno, que puede ser mucho), `ENCUBIERTO_RADIO` (64),
  `ENCUBIERTO_COSENO` (−0,3), `ENCUBIERTO_ESPERA` (0,8) y
  `ENCUBIERTO_DURACION` (1,1).
- Números de sesiones anteriores en la misma situación: los pesos de
  `COMPORTAMIENTOS_VAGON`, `CONVERSANDO_*`, las chances de `CLIMA`/
  `ESTADO_TREN`, el piso de redada (250), `CONFIG.honor.*`,
  `CONFIG.enemy.traicion*`, `CONFIG.alert.interval*`, `RIDER_SPAWN.*`,
  `CONFIG.raid.rachaBonus*`/`rescate*`, `LOOT_TYPES.strongbox.jackpot*`.
- El `$NaN` en el HUD del campamento sigue sin mirarse.
- El precio del hacha (900) sigue sin confirmar — la región del bosque no
  existe.
- La cantina (compañeros) sigue sin existir.
- `alertaEnPuerta` (systems/ai.js) sigue sin que nadie la llame: candidata a
  limpieza si sigue así.
