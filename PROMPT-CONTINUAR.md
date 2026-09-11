Estoy desarrollando Forajido, un western pixel art de asaltos a trenes en
HTML/CSS/JS vanilla, en `C:\dev\forajido`. Antes de proponer o tocar nada, leé
completos `README.md`, `NOTAS-DISENO.md` y `src/data/config.js` — ahí está el
contexto del proyecto, el detalle de cada sistema, y cómo trabajar conmigo.
No me resumas lo que dicen: son la memoria real del proyecto entre sesiones,
así que confiá en ellos más que en cualquier cosa que yo te diga de memoria.
`NOTAS-DISENO.md` es grande (9.700 líneas): usá Grep para ir a la sección que
necesites en vez de leerlo entero cada vez.

## LA SESIÓN PASADA: EL SONIDO

El juego **no tenía sonido en cuatro de sus seis pantallas** y la tormenta no se
oía. Eso se cerró. Todo está subido (ocho commits) y la documentación al día.

### Lo que hay ahora

- **Capas de fondo con nombre y volumen ajustable en vivo** (`audio.ambiente`,
  `audio.volumen`). Antes había un único fondo fijo. Es la base de todo lo demás.
- **La tormenta se oye, en TRES capas**: `chapa` (el repiqueteo del techo, sólo
  bajo techo), `agua` y `viento` (suben a la intemperie). Al cruzar un enganche,
  entrar al vagón de ganado o subir al techo, **se oye que quedaste expuesto** —
  que es justo cuando los jinetes te pueden pegar un tiro. Más truenos cada
  9-22 s, uno de cada cuatro cerca.
- **Y la tormenta ahora te TAPA en vez de delatarte.** `hearMult` pasó de 1,4 a
  **0,55**: iba para el lado contrario desde la Fase 1 y nadie lo había
  cuestionado. Como el clima se ve en el mapa antes de elegir la vía, la tormenta
  pasó de lotería a decisión — esperarla para entrar callado.
- **Campamento** (desierto + fogata, que suena sólo de noche porque de día está
  apagada), **pueblo**, **mapa** (lo más callado: es un papel, no un lugar) y
  **galope** (viento + zancadas).
- **El viento respira**: dos osciladores lentos de períodos que no encajan
  modulan volumen **y** filtro. Sin eso, ruido filtrado a volumen constante suena
  a disco rayado, no a aire.
- **Las zancadas del caballo** son "tucu-TÚN" —tres pisadas y silencio—, no un
  pulso parejo: un cuadrúpedo no pisa a intervalos iguales.
- **Música: una guitarra criolla y una armónica.** La criolla puntea un arpegio
  que NO PARA (Am-F-G-Am, vuelta cada ~14 s): es la base. La armónica pasa por
  arriba con frases sorteadas de una pentatónica menor y nunca repite. **Sólo en
  el campamento y el pueblo** — en el asalto y el galope el sonido es información
  y una melodía taparía lo que hay que oír.

### Las tres lecciones que costaron

1. **Sonido regular = sonido de máquina.** El viento constante sonaba a estática;
   los cascos parejos, a máquina de coser. Lo que hace que algo se lea como un
   fenómeno natural no es el timbre: es que **varíe**.
2. **Me pasé de mano evitando el bucle.** La primera música eran frases sueltas
   separadas por silencios largos, y Santi: *"no parece música, sino sonidos
   aislados"*. Tenía razón: **sin nada que una una nota con la siguiente quedan
   ruiditos**. Lo que no puede repetirse es la MELODÍA, no el acompañamiento.
3. **"Un fondo que se nota deja de ser un fondo" no vale para todo.** Con ese
   criterio los cascos quedaron inaudibles, y los cascos **no son un fondo, son
   el personaje**: son lo único que te dice cómo corre el animal que llevás
   abajo. Subieron ×2,6.

## LO QUE FALTA JUGAR

Esto es lo más importante que le puedo decir al que siga.

**Ya jugué y ajusté**: el sonido de la tormenta, el ambiente de las cuatro
escenas, los cascos y las dos primeras versiones de la música.

**NO se jugó todavía:**

- **La música nueva** (el arpegio criollo continuo). Las anteriores las escuché;
  ésta no. Si molesta, la perilla es `armonicaCada` —que la melodía entre menos
  seguido— antes que cualquier volumen: lo que cansa de un fondo casi siempre es
  la melodía repetida, no el acompañamiento.
- **Los cascos al nuevo volumen** (×2,6).
- **La tormenta dada vuelta.** Ahora es la noche del ladrón: a dos baldosas y
  media un guardia ya no te oye caminar. Se eligió el valor más fuerte de tres a
  propósito. ¿Un vagón con un solo guardia se volvió trivial? ¿Se elige el tren
  por el clima? Si eso no pasa, el clima sigue siendo decorado.
- **Dónde cae el vagón de armas.** Ahora nunca es el primero ni el último, y
  nunca queda pegado al blindado (siempre un vagón de por medio). Una de cada
  cuatro veces el blindado aparece ANTES, y ése es siempre el mismo tren (armas
  en el 5, blindado en el 3): ¿se vuelve reconocible de más? Perilla:
  `chanceAntes`.

Y de sesiones anteriores, sin calibrar: la frecuencia de los paquetes, el 25% de
la caja oculta, `CONFIG.honor.*`, `CONFIG.enemy.traicion*`, `RIDER_SPAWN.*`,
`CONFIG.raid.rachaBonus*` y `rescate*`, `LOOT_TYPES.strongbox.jackpot*`.

## ⚠️ EL SONIDO CASI NO SE PUEDE VERIFICAR DESDE LA CONSOLA

Es la advertencia más importante para el que siga. Se puede comprobar que las
capas existen, que los volúmenes cambian cuando corresponde, que la cadencia
sigue a la velocidad y que no se filtra nada entre escenas. Pero **si suena a
lluvia sobre una chapa, a un trueno o a una criolla, no hay forma de saberlo
desde acá**. No hay un `foto.ps1` para el oído: un cambio visual se puede mirar,
éste no.

Todos los números de `CONFIG.ambiente` y `CONFIG.tormenta` salieron de razonar,
no de escuchar. **El sonido se corrige con mi oído, no con mediciones.**

## Cómo trabajar conmigo

- Soy principiante programando: explicame en español simple.
- Antes de construir algo grande, planteame el plan concreto (qué archivos, en
  qué orden) y esperá mi confirmación. Si hay un número o una decisión de diseño
  sin cerrar, preguntame — con 2-3 opciones concretas, el EFECTO medido o
  calculado de cada una, y una recomendada con su razón. No lo dejes abierto.
  Esto funciona muy bien: cada vez que hubo un número por decidir se me mostró en
  una tabla con el resultado de cada opción y elegí con eso delante. Y muchas
  veces NO elijo ninguna de las tres, o elijo una y le agrego una condición
  propia encima: las opciones sirven para que yo vea el rango.
- **Decime cuando algo que pido está mal.** Lo de la tormenta iba al revés desde
  hacía meses y nadie lo había cuestionado; cuando lo dije, la respuesta correcta
  fue medir y mostrarme la consecuencia, no obedecer y listo. Lo mismo cuando mi
  regla tenía un caso que se contradecía: marcámelo antes de construir.
- Cuando la implementación termina distinta de lo que pedí, decímelo directo. Y
  si en el medio tenés que apartarte de lo acordado, decímelo AL ENTREGAR, no lo
  dejes escondido en el código.
- **Mostrame las cosas visuales en vez de describírmelas.** El cielo del pueblo
  se decidió viendo dos maquetas pintadas encima del juego sin tocar un archivo.
  Valió más que cualquier explicación.

### Lecciones de arnés de prueba (esto ahorró horas)

- **La mitad de los "no funciona" son del arnés, no del código.** Verificá que el
  escenario sea válido: que el punto donde ponés al jugador NO sea sólido
  (`map.isSolidAt`) y que HAYA línea de visión de verdad.
- **Y que el mundo siga VIVO.** Un Dinamitero "trabado 80 segundos" resultó ser
  el mundo entero congelado: el jugador había muerto. Si medís corridas largas,
  forzá `player.health` y `player.alive` cada cuadro.
- **El bucle real del juego corre en paralelo a tus mediciones.** Entre dos
  llamadas a la consola el mundo avanza solo. Si necesitás un estado exacto,
  hacé todo en una sola llamada.
- **No le creas a una corrida chica.** Con 6 tiradas un sorteo uniforme parecía
  sesgado; con 200, perfecto. Miles de tiradas si es una probabilidad, corridas
  completas de 30-60 s si es un comportamiento.
- **`Math.round(y / tileSize)` sobre un `tileCenter` miente** (devuelve
  `row*16+8`, así que redondear da siempre la fila siguiente). Es `Math.floor`.
- **Y para el audio hay una trampa propia:** `tone()` programa la frecuencia con
  `setValueAtTime` para un instante futuro, así que al arrancar el oscilador
  `frequency.value` todavía lee **440**. Contar osciladores para saber "qué notas
  suenan" NO funciona — cada disparo cuenta como un La. Lo que resolvió esa
  pregunta fue mirar la ESTRUCTURA (qué escena llama a `updateMusica`), no el
  sonido. **La verificación correcta no siempre es la más parecida a lo que
  querés saber.**
- **No inventes objetos internos del juego**: un `player.cover` armado a mano
  reventó el sistema de cobertura.
- **No muevas al jugador siguiendo a lo que estás midiendo**: crea un lazo de
  realimentación.
- **No reasignes los arrays del mundo** (`w.passengers = [...]`): usá `splice`.
- **Un guardia lejos del jugador no se actualiza** (`CONFIG.raid.
  cullPatrolDistance`, 700 px). El Dinamitero, el Sheriff y el jefe están exentos.
- **`0` es falsy — cuidado con `campo || default`.** Ya pasó cuatro veces; la
  última fue un `caballo.velMax` que no existe, tapado por un `|| velocidad` que
  hacía que la cadencia nunca cambiara.

### Mirar y oír

- **El panel del navegador compone frames**: `computer{action:"screenshot"}`
  funciona. Para ver algo chico, `zoom` no está soportado — lo que funciona es
  **redibujar un recorte ampliado sobre el propio canvas** con `getImageData` +
  `drawImage`, dentro de un `requestAnimationFrame` propio (si no, el bucle del
  juego te lo pisa).
- **`FORAJIDO.config` (minúscula) es el CONFIG vivo**: mutarle un color y volver
  a renderizar cambia la pantalla al instante. Es la forma de probar paletas sin
  tocar archivos.
- También está `foto.ps1` (raíz) para recortes ampliados por `fetch`.
- **El audio no suena hasta que el usuario toca algo** (regla del navegador).
  Para probar por consola: `window.dispatchEvent(new PointerEvent('pointerdown'))`
  y esperar ~150 ms antes de medir.
- **Para cualquier cambio visual, mirar no es opcional.** Encontró cosas que
  ninguna medición daba: cartucheras invisibles sobre un piso del mismo tono, y
  matas del campamento saliendo en diagonales perfectas porque las dos fórmulas
  de posición eran lineales en el índice.

### Servidor y cómo lo abro

- **El juego está publicado y siempre al día**: `https://santia-web.github.io/Forajido/`.
  No necesita servidor y es lo que uso para jugar.
- Para probar cambios **antes** de subirlos, yo abro `jugar.bat` (raíz).
- Para vos: `powershell -NoProfile -ExecutionPolicy Bypass -File servidor.ps1 -NoBrowser -Port 8082`
  (el `-ExecutionPolicy Bypass` hace falta). **Ojo: tu servidor se muere al
  terminar la sesión**, y si el puerto queda ocupado por uno zombi, usá otro.
  **Si hay un `servidor.ps1` sin `-Port` corriendo, ése es MÍO (el 8080) y no se
  toca.**

### Documentación y git

- Actualizá `README.md` y `NOTAS-DISENO.md` cuando cerremos algo: son la memoria
  del proyecto. Y reescribí este archivo (`PROMPT-CONTINUAR.md`) al final de la
  sesión, **enfocado en la sesión que termina** — no lo vayas acumulando: el
  detalle histórico ya vive en los otros dos y en el git log.
- Repo: `https://github.com/SantiA-web/Forajido`. El flujo es `git add <archivos>`,
  `git commit`, `git push`. Nada de `--force` salvo que yo lo pida. **Se sube al
  cerrar cada cosa**: una vez se acumularon doce archivos y hubo que separarlos
  después.
- Los commits van en **español sin tildes**, título de una línea, y el cuerpo
  cuenta qué se pidió, qué se rompió y qué se midió.

## Estado del proyecto

**Fase 2** (el asalto) y **Fase 3** (campamento → pueblo → mapa → tienda) están
construidas y jugables, con reputación completa (`fame`/`bounty`/`honor`) y
refuerzos que escalan.

El plan en curso es **"variedad de lo que pasa en los trenes"**: *"conozco estos
vagones, pero nunca sé exactamente qué me voy a encontrar."* Todo esto SÓLO le
pasa al tren estándar (`tipoTren.modificadores`).

### Prendido y jugable hoy

- **Clima**: tormenta (20%), que ahora **te tapa** (`hearMult` 0,55) y se oye.
- **Estado del tren**: alerta ya activada (10%), redada (15%, sólo con recompensa
  ≥250), puerta bloqueada (15%).
- **Comportamiento por vagón**: conversando / vigilando puerta / vigilando caja.
- **Paquetes**: pasajero rico con guardaespaldas (20% por vagón con pasajeros) y
  caja fuerte oculta (25% por tren, cinco escondites).
- **El vagón de armas** (25% de los trenes estándar) y, cuando aparece, **pólvora
  repartida por casi todos los vagones** — nunca en el de pasajeros. Son ~8-9
  barriles por tren y sólo uno de cada tres trae un cartucho para llevarse, así
  que salen ~3 dinamitas: justo lo que te entra encima.

### En reserva (construidos, medidos, apagados con chance 0)

En `src/data/modifiers.js`: **Pistolero** (ojo: se apagó ANTES de que se
arreglaran sus dos bugs, así que nunca se lo vio funcionando bien) y **civil
encubierto**. La variante suelta del Dinamitero sigue en 0 a propósito.

## Lo que falta construir

- **Etapa 2 de la pólvora**, planificada y no construida: que el `traqueteo` (el
  tren traicionero, hoy sólo del tren veloz) se prenda en los trenes con pólvora
  y que el sacudón **tumbe un barril al pasillo**. El sistema existe entero y la
  variante "acelera" ya sacude la carga: es conectarlo, no construirlo.
- **El galope no tiene paisaje.** No puede tener cielo (la cámara nunca sube más
  allá del techo del tren) y el degradado en el suelo ya se probó y se descartó —
  se lee como rayas pintadas. Lo que le falta son **siluetas de meseta en la capa
  lejana del parallax**.
- **Música en el asalto y el galope**, si alguna vez se quiere. Se dejó vacío a
  propósito; si se agrega, tendría que apagarse sola con la alarma.
- **Fase 6b**: el vagón de guardias dormidos — depende de la noche de verdad.
- **Fase 5b**: el objeto especial que se vende en el pueblo — necesita un
  INVENTARIO, que hoy no existe.
- **Fase 7**: curva, enganche roto, incendio, y noche con oscuridad extrema.
- **Fase 8**: el ladrón rival. No bloquea nada, pero es lo más grande.

## Pendientes sueltos

- **La partida empieza de noche** (`esDeDia: false` en `gameState`), así que lo
  primero que ve alguien es la versión más oscura de todo — y el cielo del pueblo
  no se ve hasta que dormís. Fue deliberado (que quieras dormir y aprendas el
  sistema solo); ahora tiene un costo nuevo.
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
