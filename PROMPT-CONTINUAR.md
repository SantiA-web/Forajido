Estoy desarrollando Forajido, un western pixel art de asaltos a trenes en HTML/CSS/JS vanilla, en `C:\dev\forajido`. Antes de proponer nada, leé completos `README.md`, `NOTAS-DISENO.md` y `src/data/config.js` — ahí está todo el contexto del proyecto, el detalle de cada sistema, y cómo trabajar conmigo. No lo repito acá, pero te resumo dónde estamos y cómo seguimos.

## Dónde estamos

**Fase 2 (el asalto al tren) está cerrada y jugada del todo**, los cinco pasos (A, A+, B, C con enganche y techo, D). Confirmado jugando dos veces que la duda *"¿un vagón más, o me bajo?"* aparece de verdad.

**Fase 3 (todo lo que rodea al asalto) está en construcción.** Ya construidos y jugados:
- **Campamento** (`camp`): fogata, poste del caballo (`E` alimenta, `F` te lleva al pueblo), carpa (duerme y cambia de día a noche), cajón, cartel (te manda al mapa).
- **Pueblo** (`town`): calle con cámara, cuatro locales, vecinos con los que se puede hablar.
- **Los cuatro interiores** (`interior`, contenido en `data/interiors.js`): armería y establo (sólo de día), cantina y oficina del sheriff (siempre abiertas). Cada uno con muebles sólidos, una franja de pared donde cuelga lo decorativo (estante de armas, cartelera, lámparas — nunca en el piso), y gente con la que hablar. **Ninguno vende nada todavía.**
- **Mapa de rutas** (`mapa`): papel de época, seis vías con cruces y túneles, se elige con el mouse. Todos los trenes salen iguales por ahora (`composicion`/`dificultad` en `null` en `data/region.js`, listo para cuando se diferencien).
- **Día y noche** (`gameState.esDeDia`): dormir en la carpa lo cambia; decide qué está abierto en el pueblo. Se ve por la luz y la fogata, nunca por un cartel de texto.
- **Cárcel y horca** (`prision`): si te capturan, la fianza es tu recompensa y se cobra con lo que tengas; por encima de `CONFIG.prision.umbralHorca` (900) te cuelgan aunque tengas plata, y ahí se termina la partida.

El ciclo completo funciona de punta a punta: `camp → mapa → ride → raid → results → (prision si te agarran) → camp`.

## La tarea que sigue AHORA

**Construir el flujo de compra**, una sola vez, y engancharlo en armería y establo (los dos locales más baratos de resolver):

- **Armería:** vender el **Smith & Wesson** (ya diseñado en NOTAS-DISENO, catálogo de armas: más rápido de disparar y recargar, pero 5 balas y más dispersión — no necesita mecánica nueva, dispara una bala como el Colt, sólo cambian los números en `data/weapons.js`).
- **Establo:** vender un **segundo caballo** en `data/horse.js` — un caballo mejor no anda más rápido, perdona más el salto (`saltoPreciso` más ancho), tanto al enganche como al techo.
- La cantina (compañeros) y los mini jefes quedan para después: son sistemas más caros y no dependen de esto.

Antes de tocar código, diseñá el flujo de compra conmigo con preguntas de opción múltiple si hace falta (cómo se elige, cómo se confirma, qué pasa si no alcanza la plata, si el arma/caballo comprado se equipa al toque o hay que confirmar).

## Cómo trabajar conmigo

- Soy principiante programando: explicame en español simple.
- Planteame el plan y esperá confirmación antes de construir algo grande. Usá preguntas de opción múltiple cuando haya que decidir algo de diseño.
- Cuando algo se pueda probar jugando, hacelo jugando de verdad, no sólo midiendo — pero **el panel del navegador casi nunca compone frames en esta sesión** (screenshot falla con "not displayed, so the page is not compositing"). Verificá igual, por consola, manejando el motor a mano: `FORAJIDO.services.scenes.update(1/60)` + `FORAJIDO.services.input.endFrame()` en loop, disparando teclas con `window.dispatchEvent(new KeyboardEvent(...))`. Cada escena expone su estado en `FORAJIDO.services.<nombre>` (`camp`, `town`, `interior`, `mapa`, `ride`, `raid`, `train`) para poder verificar sin ver la pantalla.
- Para los interiores en particular, no alcanza con probar puntos sueltos — hacé una inundación (flood fill) desde la puerta usando `FORAJIDO.services.interior.libre(x,y)` (la misma colisión del juego) para confirmar que todo punto de interacción es alcanzable y que nada de la pared se puede atravesar. Quedó anotado en NOTAS-DISENO como el método a repetir cada vez que se toque un cuarto.
- Actualizá `README.md` y `NOTAS-DISENO.md` cuando cerremos algo — son la memoria del proyecto entre sesiones.
- El servidor local se levanta con `C:\dev\forajido\jugar.bat` (o desde el panel del navegador con `preview_start` apuntando a `http://localhost:8080`, si hay un `.claude/launch.json` configurado — si no existe, armalo).
