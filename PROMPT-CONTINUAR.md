Estoy desarrollando Forajido, un western pixel art de asaltos a trenes en
HTML/CSS/JS vanilla, en `C:\dev\forajido`. Antes de proponer o tocar nada, leé
completos `README.md`, `NOTAS-DISENO.md` y `src/data/config.js` — ahí está el
contexto del proyecto, el detalle de cada sistema, y cómo trabajar conmigo.
No me resumas lo que dicen: son la memoria real del proyecto entre sesiones,
así que confiá en ellos más que en cualquier cosa que yo te diga de memoria.
`NOTAS-DISENO.md` es grande: usá Grep para ir a la sección que necesites en vez
de leerlo entero de punta a punta cada vez.

## LO QUE HICIMOS LA SESIÓN PASADA: el vagón de armas (Fase 6a)

Quedó construido y verificado por consola, **pero todavía no lo jugué**. Está
entero en `NOTAS-DISENO.md` (buscar "Fase 6a"); acá va lo mínimo para retomar.

**Qué es:** un vagón nuevo (`armas`, 30 columnas, 3 guardias comunes, 5 bolsas,
sin caja fuerte) que **reemplaza al de ganado en el 50% de los trenes
estándar**, nunca en el vagón 1. Es lo primero de todo el plan de variedad que
cambia de qué está HECHO el tren, y lo único que se ve desde el galope.

**Adentro hay cinco cajones de pólvora, y sirven para dos cosas opuestas:**
`[E]` te llevás un cartucho de dinamita (tope 3, `CONFIG.player.dynamiteMax` —
es el único lugar del juego donde se repone algo), o tres balazos lo prenden y
**arrastra a todos los demás en cadena**. Lo prende cualquier bala, tuya o de un
guardia, y también una dinamita lanzada adentro del vagón. Con el tope en 3,
**sólo uno sirve como reposición: los otros cuatro son bombas puestas**.

**Y tiene siete islas de cobertura** de 2×1 en las filas 3 y 6, escalonadas. Las
verdes son cobertura segura; los cajones también frenan balas pero explotan al
tercer tiro. El corredor (filas 4-5) queda libre a propósito: por ahí pasan las
rondas y por la fila 4 cruza el Dinamitero.

**Y trae un Dinamitero deambulando** entre ese vagón y los dos vecinos, a 46
px/s: vuelta completa ~53 s, nunca más de ~12 s seguidos adentro. Esperar a que
salga es la jugada del vagón. Los tres guardias de adentro son comunes a
propósito (`sinVariantes` en la plantilla): uno con dinamita ahí adentro volaría
todo en su primer ataque y no habría nada que decidir.

**El Dinamitero NO tiene arma de fuego** (segunda vuelta de la misma sesión):
sólo lanza dinamita, **de a dos a la vez y a los dos lados tuyos**, y tarda 5 s
en volver a tener las dos en la mano — cinco segundos en los que está desarmado
del todo, y se ve porque los cartuchos de la bandolera se dibujan según lo que
le queda. No se cubre nunca (parapetado se taparía el tiro a sí mismo) y si te
le pegás retrocede, porque su cartucho tiene un mínimo. Parado justo en el medio
de una tanda perdés 2 de 4 vidas; corriendo apenas ves las mechas, ninguna.

### Lo que hay que mirar jugándolo

- **¿La cadena se lee?** Está escalonada 0,35 s justamente para que se vea
  avanzar y se pueda correr. Medido: los cinco explotan en 1,40 s, y hay que
  **salir para el lado donde no quedan cajones** — correr a lo largo de la
  cadena te mete en el siguiente, y la onda va más rápido que vos.
- **¿Las islas de cobertura alcanzan, o el vagón sigue siendo un pasillo?** Son
  siete y el corredor central quedó libre a propósito.
- **¿Se distinguen las dos coberturas jugando?** Verde = segura, franja roja =
  bomba. En una foto se distinguen; en el medio de un tiroteo no lo sé.
- **¿El Dinamitero se nota, y se le puede tomar el ritmo?** Los números dicen
  que sí (dos vueltas y media por asalto), pero eso es cálculo, no juego.
- **¿Se ve la bandolera vacía?** Es toda la señal de la ventana de 5 s en la
  que está desarmado. Si no se lee jugando, la ventana no existe.
- **¿Las dos dinamitas se leen como dos, y como "para dónde salgo"?** Es la
  pregunta que reemplazó a "¿me corro?".
- **¿0,35 cartuchos por segundo es mucho?** Es el doble de lo que tira un
  guardia del blindado. La perilla es `CONFIG.enemy.dinamiteroRecarga`.
- **¿El tope de 3 cartuchos cambia algo de verdad** en el vagón blindado?
- **¿Volar el vagón se siente una decisión o un accidente?** Si vuela, ese
  tren se quedó sin dónde reponer.
- **¿50% es mucho o poco?** (`sustituciones` en `TRAIN_TYPES.estandar`).

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
  directo (`raid.enemies`, `raid.doors`, `raid.player`, `raid.cajones`), no un
  objeto con un `.world` adentro. Y el estado de la partida es
  `FORAJIDO.state`, no `services.state`.
- Para forzar un asalto sin jugar el galope:
  `FORAJIDO.services.scenes.goTo('raid', { boardAt: N, alarmaInicial: true })`,
  y para probar el sistema de variedad pasale en el mismo objeto:
  `{ clima, estado: [...], comportamientos: [...], variantes: [...],
  encubiertos: [...], paquetes: [...], cajaOculta: true, composicion: [...] }`.
  Para que salga el vagón nuevo, poné `'armas'` en `composicion`.

### Lecciones de arnés de prueba (esto ahorró horas)

- **La mitad de los "no funciona" son del arnés, no del código.** Antes de
  creerle a una medición en cero, verificá que el escenario sea válido: que el
  punto donde ponés al jugador NO sea sólido (`map.isSolidAt`) y que HAYA
  línea de visión de verdad (`hasLineOfSight(..., map.blocksSightAt)`). Poner
  al jugador "al lado" de alguien lo pone detrás de un asiento la mitad de las
  veces. **Y no inventes objetos internos del juego**: un `player.cover` armado
  a mano reventó el sistema de cobertura — si necesitás al jugador parapetado,
  buscá un punto con `findCoverSurface` y mandá `Shift`, como haría él.
- **No muevas al jugador siguiendo a lo que estás midiendo** (`player.x =
  guardia.x - 300`): crea un lazo de realimentación y los resultados salen
  cualquier cosa. Fijalo en un punto y dejalo ahí.
- **No reasignes los arrays del mundo** (`w.passengers = [...]`): la escena
  guarda su propia referencia, así que reasignar deja a la escena actualizando
  el array viejo. Usá `splice` sobre el mismo array.
- **El mapa NO re-sortea los trenes en cada `goTo('mapa')`** — son objetos
  persistentes que siguen su circuito. Para muestrear el sorteo real hay que
  dejar correr el tiempo con `scenes.update` y juntar los trenes nuevos a
  medida que cierran vuelta. (Para muestrear SÓLO la composición alcanza con
  importar `sortearComposicion` y llamarla miles de veces: es pura.)
- **Cuando una entidad "no se mueve" y no se entiende por qué, dibujá una
  grilla de solidez alrededor suyo** (tile por tile, `#` sólido y `.` libre).
- **Cuando un cambio tiene dos ingredientes, medí cada uno por separado.**
- **Un guardia lejos del jugador no se actualiza** (`CONFIG.raid.
  cullPatrolDistance`, 700px): un resultado en cero puede ser el cull.
- **`0` es falsy — cuidado con `campo || default`** cuando un campo puede valer
  0 a propósito. Ya pasó tres veces (`noiseWagons`, `dynamite`, y ahora
  `flying` en `createExplosive`, que daba por sentado que todo lo que explota
  se lanza). **Y el `??` tiene su propia trampa**: `Math.abs(x - (marca ?? x))`
  da SIEMPRE 0 la primera vez, porque compara el valor contra sí mismo — así
  una marca de referencia nunca se inicializaba y un guardia se daba vuelta 41
  veces en 150 s creyendo estar trabado.
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
  marrón, carteles encimados, una pista que no se leía, y esta vez el cajón de
  pólvora, que era otro marrón sobre el piso marrón y se leía como una sombra.
  **Contra un fondo del mismo tono lo que despega un objeto es un contorno
  oscuro y un cuerpo CLARO**, no más color; y **nada de 1 px se ve**.
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

**Todo está subido.** Ya no hay backlog: quedamos en subir al cerrar cada cosa
para que no se vuelva a acumular. El flujo es `git add -A`, `git commit`,
`git push`; la identity ya está configurada en el repo y no hay que tocarla.
Nada de `--force` salvo que yo lo pida.

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
  cualquier vagón menos el blindado, con cinco escondites posibles).
- **Cajas fuertes**: 8 segundos, disparar o recargar interrumpe, el progreso
  no se pierde, y la dinamita las revienta.
- **El vagón de armas** (nuevo, ver arriba): 50% de los trenes estándar, con
  sus tres cajones de pólvora y su Dinamitero deambulando.

### En reserva (construidos, medidos y apagados con chance 0)

En `src/data/modifiers.js`, con el valor con el que se probó anotado al lado:

- **Pistolero** (20% por guardia común, sólo con recompensa ≥300 Y honor
  ≤−10). Ojo: lo apagué ANTES de que se arreglaran sus dos bugs, así que
  nunca lo vi funcionando bien. Prenderlo es cambiar un 0.
- **Civil encubierto** (10% por pasajero; se revela cuando le das la espalda).
- La **variante suelta** del Dinamitero sigue en 0 a propósito: el Dinamitero
  ya está en el juego como el que da vueltas por el vagón de armas, y
  repartir dos o tres más al azar le sacaría sentido a mirar dónde está.

## Lo que falta del plan

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

- **Calibrar jugando** los números que se eligieron sobre tablas: todo lo del
  vagón de armas (ver arriba), la frecuencia de los paquetes, el 25% de la
  caja oculta, cuánto da el pasajero rico ($150-250 / 2,2 s), la caja oculta
  ($400-900 / 8 s), y de sesiones anteriores `CONFIG.honor.*`,
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
