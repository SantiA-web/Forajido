Estoy desarrollando Forajido, un western pixel art de asaltos a trenes en
HTML/CSS/JS vanilla, en `C:\dev\forajido`. Antes de proponer o tocar nada, leé
completos `README.md`, `NOTAS-DISENO.md` y `src/data/config.js` — ahí está el
contexto del proyecto, el detalle de cada sistema, y cómo trabajar conmigo.
No me resumas lo que dicen: son la memoria real del proyecto entre sesiones,
así que confiá en ellos más que en cualquier cosa que yo te diga de memoria.
`NOTAS-DISENO.md` es grande (11.000 líneas): usá Grep para ir a la sección que
necesites en vez de leerlo entero cada vez.

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

**El tren veloz quedó en reserva** (`peso: 0`), con sus seis vagones cortos
intactos. Lo único que se pierde de verdad es su reloj de 90 s.

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
- **El galope no tiene paisaje**: le faltan siluetas de meseta en la capa lejana
  del parallax.
- **Fase 6b** (vagón de guardias dormidos), **Fase 7** (curva, enganche roto,
  incendio, noche extrema) y **Fase 8** (el ladrón rival, lo más grande).

## Pendientes sueltos

- El **`$NaN` en el HUD del campamento**: ya no puede quedar pegado (ver
  `numero()` en `state/gameState.js`). **Si vuelve a aparecer, la consola (F12)
  dice qué campo llegó mal** — esa línea es lo que falta para cerrarlo del todo.
- La **cantina** (contratar compañeros) sigue sin existir.
- El precio del hacha (900) sigue sin confirmar: el bosque no existe.
- `alertaEnPuerta` (systems/ai.js) sigue sin que nadie la llame: candidata a
  limpieza.
- En el código los barriles de pólvora se llaman `cajon` / `cajonPolvora`.

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

El **tren veloz** (`peso: 0`), la dificultad **Alta vigilancia** (`peso: 0`), y en
`src/data/modifiers.js` el **Pistolero** (ojo: se apagó ANTES de que se arreglaran
sus dos bugs, así que nunca se lo vio funcionando bien) y el **civil encubierto**.
Son llaves, no amputaciones.

### Dónde está cada cosa nueva

```
src/data/objetos.js     el catálogo de mercadería: niveles, formas, valores
src/data/perista.js     las reglas de precio (limpio + escalones de honor)
src/engine/grilla.js    la grilla que acomoda bultos (no sabe nada de western)
src/data/wagons.js      el vagón `almacen`, y las siluetas del botín físico
src/data/train.js       los dos tipos de tren, y el veloz en reserva
```
