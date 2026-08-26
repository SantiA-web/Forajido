Estoy desarrollando "Forajido", un western pixel art de asaltos a trenes en
HTML/CSS/JS vanilla (sin frameworks, sin bundler). El proyecto vive en
`C:\dev\forajido`. Quiero que sigas como programador principal y arquitecto,
igual que en el chat anterior donde construimos la fase 1.

Antes de proponer nada, leé estos tres archivos del proyecto — tienen todo el
contexto de diseño y no quiero repetirlo en este prompt:

- `C:\dev\forajido\README.md` — cómo jugar, controles, qué hace cada sistema
- `C:\dev\forajido\NOTAS-DISENO.md` — ideas ya aceptadas con su fase asignada,
  ideas a validar, ideas descartadas
- `C:\dev\forajido\src\data\config.js` — todos los números de balance actuales

## Dónde está el proyecto

Windows, sin Node ni Python real instalados. El juego corre con
`jugar.bat` (doble clic), que levanta un servidor local en PowerShell
(`servidor.ps1`) sobre `http://localhost:8080/` — no hace falta instalar nada.

## Arquitectura (no cambiar sin buena razón)

- Canvas 2D para el mundo del juego, DOM/CSS para la interfaz (HUD, menús).
- `gameState` es un único objeto plano y serializable: todo lo que sobrevive
  entre asaltos vive ahí y en ningún otro lado.
- El contenido va en `src/data/*.js` (números, vagones, armas), nunca
  hardcodeado en los sistemas. Agregar contenido no debe tocar código de lógica.
- `src/engine/` no sabe nada de western; es reutilizable.
- Event bus (`src/engine/bus.js`) conecta los sistemas entre sí: combate no
  llama a reputación directamente, emite eventos y quien le interesa escucha.
- Estructura de carpetas: `engine/ scenes/ entities/ systems/ world/ ui/
  state/ data/ text/`.
- Todos los textos visibles en español están centralizados en `src/text/es.js`.
- Sin arte real todavía: todo son rectángulos de colores a propósito. No
  metas sprites ni sonidos grabados hasta que se pida explícitamente.
- Audio 100% sintetizado con Web Audio API (`src/engine/audio.js`), cero
  archivos de sonido.

## Principio que guía todo

jugabilidad > profundidad de sistemas > narrativa > cantidad de contenido > gráficos

No construyas nada que no se haya validado jugando. Cuando agregues un
sistema nuevo, después probalo corriendo el juego de verdad (con el navegador
MCP o instrumentando `window.FORAJIDO` desde la consola) — no alcanza con que
compile, tiene que comportarse bien.

## Qué existe ya (fase 1, terminada y jugada)

Un asalto completo a UN vagón de tren, jugable de punta a punta:

- Jugador: movimiento, disparo, recarga, cobertura (`Shift`/`Espacio` para
  pegarse a una pared, clic derecho para asomarse hasta un 70% del cuerpo),
  agacharse (`Ctrl`, mitad de velocidad y mitad de sospecha), cuerpo a cuerpo
  (`F`: degüello silencioso por la espalda a un guardia desprevenido, golpe
  aturdidor de frente).
- Guardias con IA en capas: patrulla con ronda de puntos → sospecha
  progresiva (barra visible, no detección binaria) → combate. En combate
  buscan cobertura real (verificada con línea de tiro), se asoman lo mínimo
  necesario para tener tiro, disparan en ráfagas, NO disparan a ciegas a tu
  última posición (solo una ráfaga de contención de gracia), no se pisan
  entre ellos, no se disparan a través de un compañero, y SÍ pueden matarse
  entre ellos por fuego cruzado. Puntería con dispersión que crece con la
  distancia (~20% de acierto de lejos, más peligrosos de cerca). Reconocen
  cadáveres y dan alarma si ven uno.
- Pasajeros: NPCs que solo miran hacia un lado (se los puede rodear por
  atrás), entran en pánico y gritan si te ven, lo que alerta a los guardias.
- Sistema de alarma: al ser detectado, llegan refuerzos desde el vagón de al
  lado cada ~11s (hasta 3), con su propia ronda de patrulla si te pierden.
- Botín en capas: bolsas rápidas (0.6s) + caja fuerte lenta y ruidosa (4s).
- Bono de "trabajo limpio": escapar sin que suene la alarma duplica el botín
  — el sigilo tiene que competir económicamente con la fuerza bruta.
- Reloj del asalto (90s) + zona de escape en la puerta de entrada.
- Resultado: escapás con el botín, o te capturan (perdés todo, texto de
  prisión ya escrito pero sin sistema real detrás todavía).
- Todo esto fue jugado y ajustado en varias vueltas de feedback real del
  usuario — no son números arbitrarios, vienen de partidas jugadas.

## Lo que se decidió NO hacer todavía (a propósito)

Arte real, sonido grabado, campamento, historia, fama/recompensa/honor como
sistemas activos, caballos, compañeros, tienda, guardado, regiones, más de un
vagón. Todo esto espera a que el núcleo del asalto completo (fase 2) funcione.

## FASE 2 — lo que hay que construir ahora

El asalto completo, no solo un vagón. Cuatro tramos, en este orden:

1. **Aproximación a caballo** — el jugador galopa al lado del tren antes de
   entrar. Nuevo esquema de control (no es el mismo que caminar en el vagón).
2. **Abordaje** — saltar al techo o a un enganche entre vagones.
3. **Varios vagones enganchados** (5 a 7) — se recorren en secuencia, cada
   uno con su propia composición de guardias/botín/pasajeros usando el
   sistema de plantillas de `src/data/wagons.js` que ya existe.
4. **Escape** — saltar del tren en movimiento. Importante: la salida YA NO
   es "volver a la puerta de entrada". Cuanto más adentro del tren estés
   cuando decidís irte, más lejos y más caro es volver a la salida. Ese es
   el mecanismo que crea la decisión real de "¿un vagón más, o me bajo ya?"
   — con un solo vagón esto no se podía probar de verdad.

Una idea ya aceptada y anotada en NOTAS-DISENO.md para esta fase: agentes de
la ley cabalgando al costado del tren, disparando hacia adentro por las
ventanillas. Requiere un tile nuevo de "ventanilla" (bloquea el paso, NO
bloquea la visión, deja pasar las balas — hoy pared y asiento bloquean las
tres cosas). Aparecen según recompensa del jugador + vagón + tiempo
transcurrido + dificultad del tren. Sirve para romper la comodidad de la
cobertura interior, que hoy puede volverse demasiado segura.

Hay también una idea "a validar" (caja fuerte con contenido desconocido en
vez de rango fijo) que está pendiente de decisión del usuario — no la
implementes sin preguntar primero, está documentada en NOTAS-DISENO.md.

## Cómo trabajar conmigo

- Soy principiante en programación. Explicame las decisiones técnicas en
  español simple, no des por sentado jerga.
- No implementes nada grande sin explicarme primero el plan y esperar mi
  confirmación, tal como se hizo para arrancar la fase 1.
- Priorizá que cada pieza nueva sea jugable y divertida por sí sola antes de
  sumar la siguiente — no construyas todo el sistema de golpe.
- Cuando termines algo, probalo vos mismo corriendo el juego antes de
  decirme que está listo.
