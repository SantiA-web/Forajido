Estoy desarrollando Forajido, un western pixel art de asaltos a trenes en
HTML/CSS/JS vanilla, en `C:\dev\forajido`. Antes de proponer o tocar nada, leé
completos `README.md`, `NOTAS-DISENO.md` y `src/data/config.js` — ahí está el
contexto del proyecto, el detalle de cada sistema, y cómo trabajar conmigo.
No me resumas lo que dicen: son la memoria real del proyecto entre sesiones,
así que confiá en ellos más que en cualquier cosa que yo te diga de memoria.
`NOTAS-DISENO.md` es grande: usá Grep para ir a la sección que necesites en vez
de leerlo entero de punta a punta cada vez.

## LO QUE HICIMOS LA SESIÓN PASADA

Tres cosas, y las tres están **subidas** (tres commits separados). Sólo la
tercera la jugué; las otras dos no.

### 1. Dos arreglos del Dinamitero (salieron de jugarlo)

*"Habíamos decidido que el dinamitero no siempre estará en su vagón, pero cada
vez que hago un asalto lo encuentro ahí."*

- **Su ronda era idéntica en todos los asaltos.** Arrancaba siempre en el centro
  del vagón y siempre hacia adelante, y nada más de su ronda era al azar: estaba
  adentro en los segundos 0-4, 26-36, 54-63 y 81-91, **siempre**. Y llegar al
  vagón lleva 17,4 s caminando derecho (más peleando), así que la llegada real
  caía siempre sobre la misma ventana. Ahora arranca en un punto al azar de su
  vuelta y para un lado al azar.
- **Una puerta trabada del sorteo lo encerraba** (52% del tiempo adentro con
  una, 70% con dos). Ahora lleva **la llave del tren**: la abre y sigue. Abrirla
  no la destraba — se cierra detrás suyo y para vos sigue trabada — pero te deja
  **3,2 s** para colarte si lo venías siguiendo.

### 2. Atmósfera: el pueblo tiene cielo

*"Las mecánicas se sienten muy bien pero no me siento dentro del Viejo Oeste."*

El cielo del pueblo era **código muerto**: `puebloCielo` existía en la paleta
pero la "loma detrás del pueblo" se dibujaba desde `y=0` y lo tapaba entero.
Toda la paleta de exteriores vivía en la misma franja de marrones y no había un
solo color frío contra el cual leerlos como cálidos.

Ahora el pueblo tiene cielo (azul polvoriento de día, degradado por bandas) y el
campamento de día tiene **sombras** —todas para el mismo lado— y **matorrales y
piedras** afuera del claro. La noche no se tocó.

### 3. La pólvora se reparte por todo el tren

*"Cuando hay un vagón de armas en el tren, no sólo ahí dentro habrían barriles,
sino que afectaría a todo el tren."*

- Cuando hay vagón de armas, **casi todos los vagones llevan barriles** (el de
  pasajeros nunca). Son ~8-9 por tren.
- **No todos te dan dinamita.** Todos explotan (franja roja, se ve de lejos),
  pero sólo uno de cada tres tiene un cartucho para llevarse — y ésos se ven
  porque tienen **tres cartuchos asomando por la tapa**, que es una señal que ya
  existía. Salen ~3 cartuchos por tren: justo lo que te entra encima.
- **El vagón de armas es ahora un vagón de paso**: 24 columnas (como el ganado),
  dos guardias, una bolsa, cuatro barriles y **ninguna isla de cobertura**. Los
  barriles frenan balas, así que la única cobertura del vagón es la cosa que
  explota.
- Y **bajó del 50% al 25%** de los trenes estándar, porque ahora no cambia un
  vagón: cambia el tren entero.

### 4. Dónde cae el vagón de armas respecto del blindado

Era el problema que quedaba anotado de la sesión anterior, y terminó siendo más
grande de lo que parecía. **El Dinamitero necesita vecinos en los que se pueda
entrar de los DOS lados.** El blindado no lo es (su puerta de chapa no se empuja
desde afuera) y el final del tren tampoco. Con cualquiera de los dos al lado, su
ronda se acorta a 640-700 px en vez de ~1050 y pasa **55% del tiempo adentro
contra el 41% normal**: "esperá a que salga" deja de existir.

Ahora el sorteo garantiza tres cosas: el de armas **nunca es el primero ni el
último**, y **nunca cae pegado al blindado** (siempre un vagón de por medio).
Hay dos reglas nuevas, `posicionMaxima` y `posicionRelativa`.

*(Santi: "50% de probabilidad que se encuentre después y 50% que se encuentre
antes")* — quedó en **25% antes / 75% después**, y no por capricho: con todas
las restricciones, del lado "antes" existe **una sola combinación posible**
(armas 5 / blindado 3) contra seis del otro. Un 50/50 habría hecho que la mitad
de los trenes tuvieran siempre el mismo par de posiciones.

Y salió una propiedad que no se buscó: tres de cada cuatro veces **la pólvora
queda de camino a la caja fuerte**, cuya puerta se abre justamente con dinamita.

### 5. El sonido: la tormenta y las cuatro pantallas mudas

`startAmbience` se llamaba en **un solo lugar de todo el juego** (el asalto), así
que el campamento, el pueblo, el mapa y el galope estaban mudos. Y la tormenta
era **un solo número** (`hearMult: 1.4`): te cambiaba el sigilo y no se oía.

- El motor pasó a tener **capas con nombre y volumen ajustable en vivo**, en vez
  de un fondo único y fijo. Es la base de todo lo demás.
- **La tormenta son tres capas**: `chapa` (el repiqueteo del techo, sólo bajo
  techo), `agua` y `viento` (suben a la intemperie). Al cruzar un enganche,
  entrar al vagón de ganado o subir al techo, **se oye que quedaste expuesto** —
  que es justo cuando los jinetes te pueden pegar un tiro.
- **Truenos** cada 9-22 s, uno de cada cuatro cerca. No hacen nada todavía: se
  decidió que esta vuelta sólo se oyeran.
- **Campamento** (desierto + fogata, que sólo suena de noche porque de día está
  apagada), **pueblo**, **mapa** (lo más callado: es un papel, no un lugar) y
  **galope** (viento + cascos, con la cadencia atada a la velocidad del caballo).

### 6. Dos arreglos de sonido salidos de escucharlo

Los primeros que vinieron del oído y no de una medición. Los dos diagnósticos
apuntaban al mismo error: **sonido regular = sonido de máquina**.

- *"El viento parece un disco rayado"* — y era literalmente eso: ruido filtrado a
  volumen constante. Lo que hace que se lea como aire no es el filtro, es que
  VARÍE. Ahora dos osciladores lentos de períodos que no encajan (6,5 y 10,5 s)
  modulan el volumen **y el filtro** — una ráfaga real además se abre, no es sólo
  más fuerte. Y como cae casi a cero entre ráfagas, el viento dejó de ser
  permanente. Perillas: `vientoProfundidad` y `vientoCada`.
- *"Los cascos galopan muy rápido, debería ser tucutún-tucutún"* — el error era
  conceptual: **la unidad no es el casco, es la zancada**. Un cuadrúpedo pisa en
  grupos y después hay silencio (las cuatro patas en el aire). Ahora son tres
  pisadas apretadas con la tercera acentuada, y lo que se estira al aflojar es el
  SILENCIO entre zancadas, no la zancada. El total de pisadas quedó igual que
  antes: no se bajó la cantidad, se la agrupó.

### 7. Los cascos más fuertes, y hay música

- **Los cascos subieron ×2,6** *(Santi: "quedaron muy bajos en volumen")*. El
  criterio estaba mal, no el número: se habían elegido con la regla de "un fondo
  que se nota deja de ser un fondo", y **los cascos no son un fondo, son el
  personaje**. Perilla nueva: `zancadaVolumen`.
- **Hay una armónica y una guitarra, y por eso mismo NO hay un tema.** Son frases
  sueltas separadas por silencios, sorteadas de una escala pentatónica menor (que
  no tiene notas que suenen mal juntas, así que el azar nunca saca una frase
  fea). Un bucle de ocho compases sería insoportable en una pantalla donde te
  quedás un rato.
- **Suena sólo en el campamento y el pueblo.** En el asalto y el galope no, a
  propósito: ahí el sonido es información.

> Y una lección de medición: contar osciladores para saber "¿cuántas notas suenan
> acá?" NO funciona. `tone()` programa la frecuencia para un instante futuro, así
> que al arrancar `frequency.value` todavía lee **440** — que es La, o sea una
> nota de la escala. Cada disparo contaba como música. Lo que resolvió la
> pregunta fue mirar la ESTRUCTURA (`updateMusica` se llama desde dos lugares y
> sólo dos), no el sonido.

## ⚠️ EL SONIDO CASI NO SE ESCUCHÓ

Es la advertencia más importante de esta sesión. Se verificó por consola que las
capas existen, que los volúmenes cambian cuando corresponde, que la cadencia de
los cascos sigue a la velocidad y que no se filtra ninguna capa entre escenas.
Pero **si suena a lluvia sobre una chapa, a un trueno o a cascos, no lo sabe
nadie todavía.**

No hay un `foto.ps1` para el oído: un cambio visual se puede mirar, éste no. Los
números de `CONFIG.ambiente` y `CONFIG.tormenta` salieron de razonar, no de
escuchar, y **la corrección casi seguro es para abajo** — un fondo que se nota
deja de ser un fondo.

## LO QUE HAY QUE MIRAR JUGÁNDOLO

La pólvora la jugué una vez y salieron dos ajustes (los barriles del comedor al
pasillo, y el 25%). **Lo demás no se jugó nunca.**

- **¿8-9 barriles por tren es mucho?** La perilla de cuántos es
  `cajonesExtra` en cada vagón (se sortean 1-2 de las candidatas).
- **¿3 cartuchos por tren alcanzan?** Es un cargamento lleno justo. La perilla es
  `EXPLOSIVES.cajonPolvora.chanceCartucho` (0,34).
- **¿Se distingue de cerca el que tiene cartucho del que no?** Es toda la idea
  de "al acercarte te das cuenta". Ampliado se distingue; jugando no lo sé.
- **¿El vagón de armas sin islas es tenso o es injusto?** Perdió sus siete
  coberturas y lo único que queda son los barriles.
- **¿Se nota que el vagón de armas es especial ahora que sale 1 de cada 4?**
- **¿El Dinamitero se siente impredecible?** Ya no lo vas a encontrar en el mismo
  momento dos asaltos seguidos.
- **¿Se nota dónde cae el vagón de armas?** Queda en el 2 (38%), el 3 (24%), el
  4 (12%) o el 5 (25%) — nunca el primero ni el último.
- **¿Se siente distinto el tren donde el blindado aparece ANTES que el de
  armas?** Es una de cada cuatro veces, y es siempre la misma forma: armas en el
  5, blindado en el 3. Si se vuelve reconocible de más, la perilla es
  `chanceAntes`.
- **TODO EL SONIDO.** Es lo que más necesita oídos y lo único que no pude probar:
  ¿la lluvia suena a chapa? ¿el trueno suena a trueno y no a explosión? ¿los
  cascos marcan el ritmo o molestan? ¿algún fondo se nota de más? Las perillas
  son `CONFIG.ambiente` y `CONFIG.tormenta`, y casi seguro hay que bajarlas.
- **¿Se nota al cruzar un enganche que cambia la lluvia?** Es la única parte del
  sonido que además es información.
- **¿La tormenta quedó DEMASIADO buena?** `hearMult` pasó de 1,4 a **0,55** y
  ahora es la noche del ladrón: a dos baldosas y media un guardia ya no te oye
  caminar. Se eligió el valor más fuerte de tres a propósito. Si un vagón con un
  solo guardia se vuelve trivial, la perilla está en `data/modifiers.js`.
- **¿Se elige el tren por el clima?** Es lo que el cambio busca: que la lluvia en
  el mapa sea un motivo para tomar ESA vía. Si eso no pasa jugando, el clima
  sigue siendo decorado.
- **¿La música cansa?** Si molesta, **lo primero a probar es ALARGAR los
  silencios (`armonicaCada`, `guitarraCada`), no bajar el volumen**: los
  silencios son el instrumento más importante de los dos. Y si suena a alguien
  probando el instrumento en vez de a una melodía, la perilla es cuántas notas
  tiene cada frase (`tocarFrase` en engine/audio.js).
- **¿Los 3,2 s de la puerta que él abre se usan, o no se notan?** Es la jugada
  más escondida de todo lo que se construyó.
- **¿El cielo del pueblo y las sombras del campamento cambian algo de verdad?**
- Y de sesiones anteriores, sin calibrar: la frecuencia de los paquetes, el 25%
  de la caja oculta, `CONFIG.honor.*`, `CONFIG.enemy.traicion*`, `RIDER_SPAWN.*`,
  `CONFIG.raid.rachaBonus*` y `rescate*`, `LOOT_TYPES.strongbox.jackpot*`.

## Cómo trabajar conmigo

- Soy principiante programando: explicame en español simple.
- Antes de construir algo grande, planteame el plan concreto (qué archivos, en
  qué orden) y esperá mi confirmación. Si hay un número o una decisión de
  diseño sin cerrar, preguntame — con 2-3 opciones concretas, el EFECTO medido
  o calculado de cada una, y una recomendada con su razón. No lo dejes
  abierto. Esto funciona muy bien: cada vez que hubo un número por decidir se
  me mostró en una tabla con el resultado de cada opción y elegí con eso
  delante. Y tené en cuenta que muchas veces NO elijo ninguna de las tres: las
  opciones sirven para que yo vea el rango, no para que elija una sí o sí. La
  última vez elegí una opción y le agregué una condición propia encima — la de
  los barriles sin cartucho salió así.
- Cuando te doy una idea y la implementación termina siendo distinta de lo que
  pedí, decímelo directo y ajustá. Y si en el medio de construir tenés que
  apartarte de lo acordado, decímelo AL ENTREGAR, no lo dejes escondido en el
  código.
- **Mostrame las cosas visuales en vez de describírmelas.** Lo del cielo del
  pueblo se decidió viendo dos maquetas (azul y atardecer) pintadas encima del
  juego sin tocar un archivo. Eso valió más que cualquier explicación.
- Cuando algo se pueda verificar jugando, hacelo de verdad, no sólo midiendo
  código.

### Lecciones de arnés de prueba (esto ahorró horas)

- **La mitad de los "no funciona" son del arnés, no del código.** Antes de
  creerle a una medición en cero, verificá que el escenario sea válido: que el
  punto donde ponés al jugador NO sea sólido (`map.isSolidAt`) y que HAYA
  línea de visión de verdad (`hasLineOfSight(..., map.blocksSightAt)`).
- **🆕 Y que el mundo siga VIVO.** Un Dinamitero "trabado 80 segundos" resultó
  ser el mundo entero congelado: el jugador había muerto y la escena ya no se
  actualizaba. Ningún enemigo se movía, ni los que estaban disparando. Si medís
  corridas largas, forzá `player.health` y `player.alive` cada cuadro, o chequeá
  que sigan vivos antes de creerle a nada.
- **🆕 `Math.round(y / tileSize)` sobre un `tileCenter` miente.** `tileCenter`
  devuelve `row*16+8`, así que redondear da SIEMPRE la fila siguiente. Es
  `Math.floor`. Me hizo creer que unos barriles estaban en la fila equivocada.
- **No inventes objetos internos del juego**: un `player.cover` armado a mano
  reventó el sistema de cobertura — si necesitás al jugador parapetado, buscá un
  punto con `findCoverSurface` y mandá `Shift`, como haría él.
- **No muevas al jugador siguiendo a lo que estás midiendo** (`player.x =
  guardia.x - 300`): crea un lazo de realimentación. Fijalo y dejalo ahí.
- **No reasignes los arrays del mundo** (`w.passengers = [...]`): la escena
  guarda su propia referencia. Usá `splice` sobre el mismo array.
- **El mapa NO re-sortea los trenes en cada `goTo('mapa')`.** Para muestrear el
  sorteo real hay que dejar correr el tiempo. (Para la composición sola alcanza
  con importar `sortearComposicion` y llamarla miles de veces: es pura.)
- **Cuando una entidad "no se mueve", dibujá una grilla de solidez alrededor
  suyo** (tile por tile, `#` sólido y `.` libre).
- **Cuando un cambio tiene dos ingredientes, medí cada uno por separado.**
- **Un guardia lejos del jugador no se actualiza** (`CONFIG.raid.
  cullPatrolDistance`, 700px): un resultado en cero puede ser el cull. El
  Dinamitero, el Sheriff y el jefe están exentos.
- **`0` es falsy — cuidado con `campo || default`**, y **el `??` tiene su propia
  trampa**: `Math.abs(x - (marca ?? x))` da SIEMPRE 0 la primera vez.
- **🆕 Si lo que medís es un CICLO, muestreá por cuadro y no por segundo.** Una
  muestra por segundo simulado sobre una ronda de ~44 s aliasea feo: dio "32-34%
  del tiempo adentro" donde la medición cuadro a cuadro (6.000 muestras en vez
  de 80) da 41%. El error fue lo bastante grande como para hacerme reportar que
  un número estaba clavado en el objetivo cuando no lo estaba.
- **No le creas a una corrida chica.** 🆕 Con 6 tiradas el arranque al azar del
  Dinamitero parecía sesgado (5 de 6 para el mismo lado, 0 de 6 adentro del
  vagón); con 200, perfectamente uniforme. Era ruido. Miles de tiradas si es una
  probabilidad, varias corridas completas si es un comportamiento. Y cerrá
  siempre con una corrida COMPLETA de 30-60 s con todo encendido.
- **Ojo con el caché del módulo**: si editás un .js y volvés a medir en la misma
  pestaña sin recargar, el bucle real puede seguir con el código viejo.
- **Y el bucle real del juego corre en paralelo a tus mediciones.** Entre dos
  llamadas a la consola el mundo avanza solo. Si necesitás un estado exacto,
  hacé todo en una sola llamada.

### Mirar

- **🆕 El panel del navegador de este entorno SÍ compone frames** (antes casi
  nunca): `computer{action:"screenshot"}` funciona. Para ver algo chico,
  `zoom` no está soportado — lo que sí funciona es **redibujar un recorte
  ampliado sobre el propio canvas** con `getImageData` + `drawImage`, dentro de
  un `requestAnimationFrame` propio (si no, el bucle del juego te lo pisa).
- **🆕 `FORAJIDO.config` (minúscula) es el CONFIG vivo**, y mutarle un color y
  volver a renderizar cambia la pantalla al instante. Es la forma de probar
  paletas sin tocar archivos.
- También está `foto.ps1` (raíz del proyecto): se levanta con
  `powershell -NoProfile -ExecutionPolicy Bypass -File foto.ps1` y desde la
  consola se le manda un recorte ampliado con `fetch` a
  `http://localhost:8099/<nombre>`. Hay que forzar un `render()` antes.
  Cerrá el receptor y borrá los .png al terminar.
- **Para cualquier cambio visual, mirar no es opcional.** Encontró cosas que
  ninguna medición podía dar: cartucheras marrones invisibles sobre un piso
  marrón, y esta vez **las matas del campamento saliendo en diagonales
  perfectas** porque las dos fórmulas de posición eran lineales en el índice.

### Servidor

- `powershell -NoProfile -ExecutionPolicy Bypass -File servidor.ps1 -NoBrowser -Port 8082`
  (el `-ExecutionPolicy Bypass` hace falta). **Si hay un `servidor.ps1` sin
  `-Port` corriendo, ése es MÍO (el 8080) y no se toca**: levantá el tuyo en
  otro puerto y cerrá sólo ése al terminar, filtrando por CommandLine.
- Ojo: al filtrar procesos por CommandLine, el propio proceso de la consulta se
  cuenta a sí mismo.
- 🆕 El servidor de fondo se cae al terminar la sesión. Si el juego "no aparece
  en el navegador", es eso: no hay nada roto, hay que volver a levantarlo. Yo lo
  abro con `jugar.bat`.

### Documentación

- Actualizá `README.md` y `NOTAS-DISENO.md` cuando cerremos algo: son la
  memoria del proyecto, no documentación opcional. Y reescribí este archivo
  (`PROMPT-CONTINUAR.md`) al final de la sesión, enfocado en la sesión que
  termina — no lo vayas acumulando: el detalle histórico ya vive en los otros
  dos y en el git log.
- Los commits de este repo van en **español sin tildes**, con título de una
  línea, y el cuerpo cuenta qué se pidió, qué se rompió y qué se midió.

## El proyecto está publicado, y AL DÍA en git

Repositorio público: `https://github.com/SantiA-web/Forajido`, publicado con
GitHub Pages en `https://santia-web.github.io/Forajido/`.

**Todo está subido.** El flujo es `git add <archivos>`, `git commit`, `git push`.
Nada de `--force` salvo que yo lo pida. Se sube al cerrar cada cosa: la última
vez se acumularon doce archivos sin commitear y hubo que separarlos después.

## Estado del proyecto

**Fase 2** (el asalto) y **Fase 3** (campamento → pueblo → mapa → tienda) están
construidas y jugables, con reputación completa (`fame`/`bounty`/`honor`) y
refuerzos que escalan.

El plan en curso es **"variedad de lo que pasa en los trenes"**: *"conozco estos
vagones, pero nunca sé exactamente qué me voy a encontrar."* Todo esto SÓLO le
pasa al tren estándar (`tipoTren.modificadores`).

### Lo que está prendido y jugable hoy

- **Clima**: tormenta (20% de los trenes estándar). **Te TAPA**: `hearMult` 0,55,
  o sea que te oyen la mitad de lejos. Iba al revés (1,4) desde la Fase 1 y nadie
  lo había cuestionado. Y como el clima se ve en el mapa antes de elegir la vía,
  la tormenta pasó a ser una decisión —esperarla para entrar callado— en vez de
  una lotería que sufrís.
- **Estado del tren**: alerta ya activada (10%), redada (15%, sólo con
  recompensa ≥250), puerta bloqueada (15%).
- **Comportamiento por vagón**: conversando / vigilando puerta / vigilando caja.
- **Paquetes**: pasajero rico con guardaespaldas (20% por vagón con pasajeros) y
  caja fuerte oculta (25% por tren, cinco escondites).
- **El vagón de armas y la pólvora repartida** (25% de los trenes estándar).

### En reserva (construidos, medidos y apagados con chance 0)

En `src/data/modifiers.js`, con el valor con el que se probó anotado al lado:
**Pistolero** (ojo: se apagó ANTES de que se arreglaran sus dos bugs, así que
nunca se lo vio funcionando bien) y **civil encubierto**. La variante suelta del
Dinamitero sigue en 0 a propósito.

## Lo que falta

- **Música en el asalto y el galope**, si alguna vez se quiere. Hoy suena sólo en
  el campamento y el pueblo, y afuera de ahí se dejó vacío A PROPÓSITO: en el
  asalto el sonido es información y una melodía taparía lo que hay que oír. Si
  se agrega, tendría que apagarse sola con la alarma.
- **El galope no tiene paisaje.** No puede tener cielo (la cámara nunca sube más
  allá del techo del tren), y el degradado en el suelo ya se probó y se descartó
  — se lee como rayas pintadas. Lo que le falta son **siluetas de meseta en la
  capa lejana del parallax**.
- **Etapa 2 de la pólvora, planificada y no construida**: que el `traqueteo` (el
  tren traicionero, hoy sólo del tren veloz) se prenda en los trenes con pólvora
  y que el sacudón **tumbe un barril al pasillo**. El sistema ya existe entero y
  la variante "acelera" ya sacude la carga: es conectarlo, no construirlo.
- **Fase 6b**: el vagón de guardias dormidos — depende de la noche de verdad.
- **Fase 5b**: el objeto especial que se vende después en el pueblo — necesita un
  INVENTARIO, que hoy no existe.
- **Fase 7**: curva, enganche roto, incendio, y noche con oscuridad extrema.
- **Fase 8**: el ladrón rival. No bloquea nada, pero es lo más grande.

## Pendientes sueltos

- **La partida empieza de noche** (`esDeDia: false` en `gameState`), así que lo
  primero que ve alguien es la versión más oscura de todo — y el cielo nuevo del
  pueblo no se ve hasta que dormís. Fue una decisión deliberada (que quieras
  dormir y aprendas el sistema solo); ahora tiene un costo nuevo.
- El **`$NaN` en el HUD del campamento**, visto de pasada hace varias sesiones y
  todavía sin mirar.
- El precio del hacha (900) sigue sin confirmar: la región del bosque no existe.
- La **cantina** (contratar compañeros) sigue sin existir. Ahora que hay un menú
  compartido (`src/engine/menu.js`) es más barato de construir.
- `alertaEnPuerta` (systems/ai.js) sigue sin que nadie la llame: candidata a
  limpieza.
- En el código los barriles de pólvora se llaman `cajon` / `cajonPolvora`: el
  nombre `barril` ya estaba tomado por los rodantes del tren veloz. Renombrar
  tocaría seis archivos y no cambia nada del juego.
