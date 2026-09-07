Estoy desarrollando Forajido, un western pixel art de asaltos a trenes en
HTML/CSS/JS vanilla, en `C:\dev\forajido`. Antes de proponer o tocar nada, leé
completos `README.md`, `NOTAS-DISENO.md` y `src/data/config.js` — ahí está el
contexto del proyecto, el detalle de cada sistema, y cómo trabajar conmigo.
No me resumas lo que dicen: son la memoria real del proyecto entre sesiones,
así que confiá en ellos más que en cualquier cosa que yo te diga de memoria.
`NOTAS-DISENO.md` es grande: usá Grep para ir a la sección que necesites en vez
de leerlo entero de punta a punta cada vez.

## LO QUE VAMOS A HACER EN ESTA SESIÓN: el vagón de armas

Es la **Fase 6a** del plan de "variedad de lo que pasa en los trenes". Lo
elegí como próximo paso por tres motivos: no arrastra ningún sistema nuevo
(reusa los explosivos que ya existen), es contenido como cualquier otro vagón,
y **es lo que enciende al Dinamitero**, un tipo de guardia que ya está
construido, medido y esperando exactamente esto.

**Ojo: el vagón de armas NO está diseñado todavía, sólo nombrado.** No
empieces a construir: planteame primero el plan concreto (qué archivos, en qué
orden) y las decisiones de diseño abiertas con 2-3 opciones cada una. Cosas
que hay que cerrar conmigo: qué tiene adentro y qué se puede hacer con eso
(¿te reponés dinamita?, ¿las cajas de munición explotan si les disparás?),
cuántos guardias lleva, qué tamaño tiene, si entra en la composición del tren
estándar o es otra cosa.

Lo que sí está decidido de antes: **cuando exista este vagón, se prende el
Dinamitero** (`VARIANTES_GUARDIA.dinamitero.chance` de 0 a 0,20 en
`src/data/modifiers.js` — el valor con el que se probó está anotado ahí al
lado).

Dónde vive lo que vas a necesitar:
- `src/data/wagons.js` — el catálogo de vagones (`WAGONS`), con la leyenda de
  tiles y las reglas de forma arriba de todo: 10 filas, filas 0 y 9 todas
  pared, filas 4 y 5 empiezan y terminan con `+`, ancho libre pero parejo.
- `src/data/train.js` — `TRAIN_TYPES`, la composición de cada tipo de tren.
- `src/data/explosives.js`, `src/systems/explosives.js`,
  `src/entities/explosive.js` — todo el sistema de dinamita, que es lo que
  este vagón tiene que reusar.
- `src/world/train.js` — el armador del tren (`buildTrain`).

## Cómo trabajar conmigo

- Soy principiante programando: explicame en español simple.
- Antes de construir algo grande, planteame el plan concreto (qué archivos, en
  qué orden) y esperá mi confirmación. Si hay un número o una decisión de
  diseño sin cerrar, preguntame — con 2-3 opciones concretas, el EFECTO medido
  o calculado de cada una, y una recomendada con su razón. No lo dejes
  abierto. Esto funciona muy bien: cada vez que hubo un número por decidir se
  me mostró en una tabla con el resultado de cada opción y elegí con eso
  delante. Y tené en cuenta que muchas veces NO elijo ninguna de las tres: las
  opciones sirven para que yo vea el rango, no para que elija una sí o sí.
- Cuando te doy una idea y la implementación termina siendo distinta de lo que
  pedí, decímelo directo y ajustá. Y si en el medio de construir tenés que
  apartarte de lo acordado, decímelo AL ENTREGAR, no lo dejes escondido en el
  código.
- Cuando algo se pueda verificar jugando, hacelo de verdad, no sólo midiendo
  código — pero el panel del navegador de este entorno casi nunca compone
  frames (el screenshot normal falla con "not displayed, so the page is not
  compositing"). Verificá igual, por consola, manejando el motor a mano:
  `FORAJIDO.services.scenes.update(1/60)` + `FORAJIDO.services.input.endFrame()`
  en loop, disparando teclas con
  `window.dispatchEvent(new KeyboardEvent('keydown'/'keyup', {code: 'KeyE'}))`
  (los eventos de teclado sí llegan; los de mouse no, ahí hay que mutar
  `input.mouse.x/y/down` directamente — y la cuenta para apuntar a un punto del
  mundo es `input.mouse.x = puntoX - camera.x`, recalculada EN CADA CUADRO
  porque la cámara sigue al jugador).
- Cada escena expone su estado en `FORAJIDO.services.<nombre>` (camp, town,
  interior, mapa, ride, raid, train, tienda). Ojo: `services.raid` ES el world
  directo (`raid.enemies`, `raid.doors`, `raid.player`), no un objeto con un
  `.world` adentro.
- Para forzar un asalto sin jugar el galope:
  `FORAJIDO.services.scenes.goTo('raid', { boardAt: N, alarmaInicial: true })`,
  y para probar el sistema de variedad pasale en el mismo objeto:
  `{ clima, estado: [...], comportamientos: [...], variantes: [...],
  encubiertos: [...], paquetes: [...], cajaOculta: true, composicion: [...] }`.

### Lecciones de arnés de prueba (esto ahorró horas)

- **La mitad de los "no funciona" son del arnés, no del código.** Antes de
  creerle a una medición en cero, verificá que el escenario sea válido: que el
  punto donde ponés al jugador NO sea sólido (`map.isSolidAt`) y que HAYA
  línea de visión de verdad (`hasLineOfSight(..., map.blocksSightAt)`). Poner
  al jugador "al lado" de alguien lo pone detrás de un asiento la mitad de las
  veces.
- **No muevas al jugador siguiendo a lo que estás midiendo** (`player.x =
  guardia.x - 300`): crea un lazo de realimentación y los resultados salen
  cualquier cosa. Fijalo en un punto y dejalo ahí.
- **No reasignes los arrays del mundo** (`w.passengers = [...]`): la escena
  guarda su propia referencia, así que reasignar deja a la escena actualizando
  el array viejo. Usá `splice` sobre el mismo array.
- **El mapa NO re-sortea los trenes en cada `goTo('mapa')`** — son objetos
  persistentes que siguen su circuito. Para muestrear el sorteo real hay que
  dejar correr el tiempo con `scenes.update` y juntar los trenes nuevos a
  medida que cierran vuelta.
- **Cuando una entidad "no se mueve" y no se entiende por qué, dibujá una
  grilla de solidez alrededor suyo** (tile por tile, `#` sólido y `.` libre).
  Eso mostró de un vistazo que un guardia estaba metido en el hueco entre dos
  bloques de asientos.
- **Cuando un cambio tiene dos ingredientes, medí cada uno por separado.** El
  Pistolero se "verificó" midiendo balas totales (44 contra 6, un 7×) y ese
  número tapó que su cadencia propia no se aplicaba por un bug: la diferencia
  venía entera del otro ingrediente.
- **Un guardia lejos del jugador no se actualiza** (`CONFIG.raid.
  cullPatrolDistance`, 700px): un resultado en cero puede ser el cull.
- **`0` es falsy — cuidado con `campo || default`** cuando un campo puede valer
  0 a propósito. Ya pasó dos veces (`noiseWagons`, `dynamite`). Usar `??`.
- **No le creas a una corrida chica**: miles de tiradas si es una
  probabilidad, varias corridas completas si es un comportamiento. Y cerrá
  siempre con una corrida COMPLETA de 30-60 s con todo encendido.
- **Ojo con el caché del módulo**: si editás un .js y volvés a medir en la
  misma pestaña sin recargar, el bucle real del juego puede seguir con el
  código viejo.

### Mirar

- Para MIRAR de verdad un dibujo, una composición o un color, usá `foto.ps1`
  (raíz del proyecto): se levanta con
  `powershell -NoProfile -ExecutionPolicy Bypass -File foto.ps1` y desde la
  consola del navegador se le manda un recorte ampliado con `fetch` a
  `http://localhost:8099/<nombre>`. Hay que forzar un `render()` antes
  (`FORAJIDO.services.scenes.render(FORAJIDO.services.renderer)`), y para
  encuadrar bien calculá la posición en pantalla (`x - camera.x`) y clampeala
  al canvas (384x216) o la foto sale en blanco.
- **Para cualquier cambio visual, mirar no es opcional.** Encontró cosas que
  ninguna medición podía dar: cartucheras marrones invisibles sobre un piso
  marrón, carteles encimados, y una pista que no se leía.
- Cerrá el receptor y borrá los .png al terminar.

### Servidor

- `powershell -NoProfile -ExecutionPolicy Bypass -File servidor.ps1 -NoBrowser -Port 8082`
  (el `-ExecutionPolicy Bypass` hace falta). **Si hay un `servidor.ps1` sin
  `-Port` corriendo, ése es MÍO (el 8080) y no se toca**: levantá el tuyo en
  otro puerto y cerrá sólo ése al terminar, filtrando por CommandLine.
- Ojo: al filtrar procesos por CommandLine, el propio proceso de la consulta
  se cuenta a sí mismo — no te asustes si "queda 1".

### Documentación

- Actualizá `README.md` y `NOTAS-DISENO.md` cuando cerremos algo: son la
  memoria del proyecto, no documentación opcional. Y reescribí este archivo
  (`PROMPT-CONTINUAR.md`) al final de la sesión, enfocado en la sesión que
  termina — no lo vayas acumulando: el detalle histórico ya vive en los otros
  dos y en el git log.

## El proyecto está publicado, y AL DÍA en git

Repositorio público: `https://github.com/SantiA-web/Forajido`, publicado con
GitHub Pages en `https://santia-web.github.io/Forajido/`.

**Todo está subido** (commit `7a38439`, "Variedad de trenes: modificadores,
comportamientos, paquetes y cajas fuertes"). Ya no hay backlog: quedamos en
subir al cerrar cada cosa para que no se vuelva a acumular. El flujo es
`git add -A`, `git commit`, `git push`; la identity ya está configurada en el
repo y no hay que tocarla. Nada de `--force` salvo que yo lo pida.

## Estado del proyecto

**Fase 2** (el asalto) y **Fase 3** (campamento → pueblo → mapa → tienda)
están construidas y jugables, con reputación completa (`fame`/`bounty`/
`honor`) y refuerzos que escalan.

El plan en curso es **"variedad de lo que pasa en los trenes"**: *"conozco
estos vagones, pero nunca sé exactamente qué me voy a encontrar."* Todo esto
SÓLO le pasa al tren estándar (`tipoTren.modificadores`): el veloz y el de
carga tienen identidad propia y quedan afuera.

### Lo que está prendido y jugable hoy

- **Clima**: tormenta (se oye 40% más lejos), 20% de los trenes estándar.
- **Estado del tren**: alerta ya activada (10%), redada (15%, sólo con
  recompensa ≥250), puerta bloqueada (15%, y traba 1/2/3 puertas con pesos
  70/20/10).
- **Comportamiento por vagón**: conversando / vigilando puerta / vigilando
  caja. Sale algo en el 98% de los trenes.
- **Paquetes** (`src/data/paquetes.js`): pasajero rico con guardaespaldas
  (20% por vagón con pasajeros) y **caja fuerte oculta** (25% por tren, en
  cualquier vagón menos el blindado). Tres pasajeros al azar del tren saben
  dónde está y te lo dicen al amenazarlos con una pista tipo
  `VAGÓN 3: DEBAJO DE UNA MESA`; la caja no se marca, aparece recién cuando
  la tenés al lado.
- **Cajas fuertes**: 8 segundos, disparar o recargar interrumpe, el progreso
  no se pierde, y la dinamita las revienta (quedan abiertas y el botín se
  levanta como una bolsa).

### En reserva (construidos, medidos y apagados con chance 0)

En `src/data/modifiers.js`, con el valor con el que se probó anotado al lado:

- **Pistolero** (20% por guardia común, sólo con recompensa ≥300 Y honor
  ≤−10). Ojo: lo apagué ANTES de que se arreglaran sus dos bugs, así que
  nunca lo vi funcionando bien. Prenderlo es cambiar un 0.
- **Dinamitero** (espera este vagón de armas).
- **Civil encubierto** (10% por pasajero; se revela cuando le das la espalda).

## Lo que falta del plan, después del vagón de armas

- **Fase 6b**: el vagón de guardias dormidos — depende de la Fase 3b
  ("durmiendo"), que a su vez necesita **la noche** de verdad. Sesión propia.
- **Fase 5b**: el objeto especial, que decidí que no sea plata sino algo que
  se lleva y **se vende después en el pueblo** — necesita un INVENTARIO, que
  hoy no existe. Sesión propia. (El "comerciante" lo dejé para cuando haya
  algún sistema de gente con la que se habla.)
- **Fase 7**: curva, enganche roto, incendio, y noche con oscuridad extrema
  (un sistema de visión limitada que no existe).
- **Fase 8**: el ladrón rival. No bloquea nada, pero es lo más grande.

## Pendientes sueltos

- **Calibrar jugando** los números que se eligieron sobre tablas: la
  frecuencia de los paquetes (uno de cada dos trenes estándar trae alguno),
  el 25% de la caja oculta, cuánto da el pasajero rico ($150-250 / 2,2 s), la
  caja oculta ($400-900 / 8 s), y de sesiones anteriores `CONFIG.honor.*`,
  `CONFIG.enemy.traicion*`, `RIDER_SPAWN.*`, `CONFIG.raid.rachaBonus*` y
  `rescate*`, `LOOT_TYPES.strongbox.jackpot*`.
- El **`$NaN` en el HUD del campamento**, visto de pasada hace varias sesiones
  y todavía sin mirar.
- El precio del hacha (900) sigue sin confirmar: la región del bosque no
  existe.
- La **cantina** (contratar compañeros) sigue sin existir. Ahora que hay un
  menú compartido (`src/engine/menu.js`) es más barato de construir.
- `alertaEnPuerta` (systems/ai.js) sigue sin que nadie la llame: candidata a
  limpieza.
