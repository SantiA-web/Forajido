# Prototipo 3D — dos vagones

**Esto no es el juego.** Es un experimento aparte, escrito para contestar **una
sola pregunta**:

> ¿El asalto se siente mejor **adentro** del vagón que mirándolo desde arriba?

Si la respuesta es no, se borra la carpeta y no pasó nada: no toca ni una línea
del juego. Lo único que le pide prestado es el **dibujo de las personas**
(`src/entities/figura.js`), y sólo para leerlo.

## Cómo abrirlo

Con el servidor de siempre andando (`servidor.ps1`):

```
http://localhost:8082/proto3d/index.html
```

Clic para empezar (el mouse queda capturado; `ESC` lo suelta).

- **W A S D** moverte, **mouse** mirar
- **CLIC** tirar (seis balas, **R** recarga)
- **CTRL** agacharte — hace mucho menos ruido
- **E** mantenerlo apretado frente a la caja fuerte
- El objetivo: forzar la caja del segundo vagón y volver a la puerta

## Qué mirar mientras lo jugás

1. **¿Da más tensión o menos?** Es lo único que importa.
2. **No ves lo que tenés detrás.** El sigilo de hoy se juega mirando desde
   arriba, viendo al guardia y su barrita. Acá eso se vuelve oído y nuca:
   **es otro juego de sigilo**, no el mismo con otra cámara. ¿Te gusta más?
3. **El pasillo es angosto.** Esquivar a un guardia no existe: o te escondés
   antes, o hay tiroteo. ¿Eso mejora el asalto o lo empobrece?
4. **El tren se cruza en once segundos.** Mirá si sigue sintiéndose grande.

## Por qué es barato (y por qué se eligió este estilo)

Lo caro del 3D es el arte, no el motor. Con el estilo de Barony/Quake:

| | En 3D "normal" | Acá |
|---|---|---|
| Un vagón | Modelado y texturizado a mano | Cajas y planos, hechos con código (`mundo.js`) |
| Las paredes | Materiales, mapas | Texturas de 32×32 **dibujadas con código** |
| Un guardia | Modelo + esqueleto + 8 animaciones | **El dibujo que ya tiene el juego**, pegado en un cartel que gira (`guardias.js`) |
| El jugador | Modelo + animaciones + cámara que no atraviese paredes | **Nada**: en primera persona no te ves |

Medido: **0,39 ms por cuadro**, 52 triángulos, 16 llamadas de dibujo. El lienzo
se dibuja a 455×270 y lo estira el navegador: de ahí salen el aspecto a píxeles
y la velocidad.

## Lo que el prototipo NO contesta

- **Si conviene mudar el juego entero.** Eso sigue siendo el trabajo grande:
  42.900 líneas, 167 funciones de dibujo y todos los números medidos, que están
  pensados para un mundo plano.
- **Cómo se ven los guardias de cerca.** Las estampas son el dibujo de tres
  cuartos del juego, hecho para verse desde arriba; a la altura de los ojos se
  nota. En una versión de verdad habría que generar sprites de frente.
- **El resto del juego.** Acá no hay caballos, ni mapa, ni botín, ni huida.

## Los archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | La página, el HUD y el cartel de entrada |
| `mundo.js` | Los dos vagones, las texturas y contra qué se choca |
| `guardias.js` | Las estampas y la IA corta (patrulla, te ve de a poco, grita, tira) |
| `main.js` | La cámara, el movimiento, el disparo, el objetivo y el bucle |
| `vendor/three.module.js` | La librería 3D (three.js r160, licencia MIT) |
