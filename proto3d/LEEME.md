# Prototipo 3D — el tren del juego, por dentro

**Esto no es el juego.** Es un experimento aparte, escrito para contestar **una
sola pregunta**:

> ¿El asalto se siente mejor **adentro** del vagón que mirándolo desde arriba?

Si la respuesta es no, se borra la carpeta y no pasó nada: no toca ni una línea
del juego. Lo único que le pide prestado es el **dibujo de las personas**
(`src/entities/figura.js`) y los **planos de los vagones**
(`src/data/wagons.js`), y sólo para leerlos.

## El vagón es el del 2D, no uno inventado

⚠️ **Esto es lo que hace que la comparación valga.** La primera versión tenía un
pasillo dibujado a ojo de 12 m por 2,8 — tres veces y media más corto y la mitad
de ancho que el vagón que jugás. Comparar contra eso no probaba nada: eran dos
mapas distintos.

Ahora el 3D se **genera leyendo el `layout`** de `data/wagons.js`, baldosa por
baldosa. Los catorce recovecos de los asientos, las ventanillas donde van, el
enganche al aire libre: todo sale del mismo texto que juega el 2D.

**La escala es 1 baldosa = 1 metro.** Sale de la huella del cuerpo
(`CONFIG.player.hw 4.5, hh 3.5` → 9×7 unidades ≈ 55 cm de ancho de persona), que
es la medida honesta para un plano de piso. La otra cuenta posible —el alto del
dibujo, `ALTO_PERSONA 20` ≈ 1,75 m— daría 1,4 m por baldosa, pero los muñecos de
tres cuartos siempre se dibujan más altos de lo que miden.

| | Baldosas del 2D | Metros en el 3D |
|---|---|---|
| Vagón de pasajeros | 40 × 10 | 40 × 10 |
| Interior | 6 | 6 |
| Pasillo | 2 | 2 |
| Enganche | 3 columnas | 3 m al aire libre |
| Vagón blindado | 30 × 10 | 30 × 10 |
| **El tren entero** | 73 columnas | **73 m** |
| Alto del vagón | — | 2,5 |

**Las velocidades también salen del 2D**, si no 40 metros se sienten un galpón:
`CONFIG.player.speed` son 78 unidades por segundo = **4,9 m/s**, y
`CONFIG.enemy.patrolSpeed` son 24 = 1,5 m/s. La vista del guardia es
`viewDistance 118` = 7,4 m. Cruzar el tren caminando tarda **14 segundos**, los
mismos que tarda en el 2D.

**Y los guardias están donde están en el 2D**: cada vagón trae sus rondas
(`enemies[].path`) y el prototipo las lee. Son cinco.

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
- El objetivo: forzar la caja del vagón blindado y volver a la puerta

## Qué mirar mientras lo jugás

1. **¿Da más tensión o menos?** Es lo único que importa.
2. **No ves lo que tenés detrás.** El sigilo de hoy se juega mirando desde
   arriba, viendo al guardia y su barrita. Acá eso se vuelve oído y nuca:
   **es otro juego de sigilo**, no el mismo con otra cámara. ¿Te gusta más?
3. **Los recovecos.** Son los mismos catorce del 2D. Metido ahí, al que viene
   por el pasillo lo ves recién cuando pasa por delante. ¿Funcionan mejor o
   peor que vistos desde arriba?
4. **El enganche.** Tres metros al aire libre entre dos vagones, sin dónde
   esconderse y con los dos vagones viéndote. En el 2D es un tramo más; acá es
   un lugar.

## Por qué es barato (y por qué se eligió este estilo)

Lo caro del 3D es el arte, no el motor. Con el estilo de Barony/Quake:

| | En 3D "normal" | Acá |
|---|---|---|
| Un vagón | Modelado y texturizado a mano | **El layout del 2D**, levantado con código (`mundo.js`) |
| Las paredes | Materiales, mapas | Texturas de 32×32 **dibujadas con código** |
| Un guardia | Modelo + esqueleto + 8 animaciones | **El dibujo que ya tiene el juego**, pegado en un cartel que gira (`guardias.js`) |
| El jugador | Modelo + animaciones + cámara que no atraviese paredes | **Nada**: en primera persona no te ves |

Medido: **~0,2 ms por cuadro**, 3.700 triángulos, 23 llamadas de dibujo. Las
~1.200 caras del tren se juntan en **seis mallas** (una por textura): si cada
cara fuera su propio objeto serían 1.200 llamadas y esto iría a los tumbos.
El lienzo se dibuja a 384×270 y lo estira el navegador: de ahí salen el aspecto
a píxeles y la velocidad. Probado con 12.000 cuadros de teclas al azar, sin un
solo error y sin quedarse nunca trabado dentro de una pared.

## Lo que el prototipo NO contesta

*(Santi, sobre la primera versión: "quiero saber si sos consciente de que este
prototipo no está ni cerca de un prototipo real" — tenía razón, y esta lista es
lo que todavía falta.)*

- **No hay sonido.** En primera persona el oído es la mitad de la tensión, y es
  lo que reemplaza a ver atrás. Sin audio, lo del sigilo no se puede juzgar.
- **El disparo no es un acto.** No hay revólver en pantalla, ni retroceso, ni
  cuerpo en el piso: el guardia se evapora.
- **El tren casi no se mueve.** Por ahora sólo corre el paisaje de las
  ventanillas; falta el bamboleo y el cabeceo en las juntas de la vía.
- **Los guardias no se comportan.** Caminan y tiran. No se cubren detrás de un
  asiento, no reaccionan a un cadáver, no se buscan entre ellos.
- **Cómo se ven los guardias de cerca.** Las estampas son el dibujo de tres
  cuartos, hecho para verse desde arriba; a la altura de los ojos se nota. En
  una versión de verdad habría que generar sprites de frente.
- **Si conviene mudar el juego entero.** Eso sigue siendo el trabajo grande:
  42.900 líneas y 167 funciones de dibujo pensadas para un mundo plano.

## Los archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | La página, el HUD y el cartel de entrada |
| `mundo.js` | Levanta el tren desde el layout del 2D, las texturas y las luces |
| `guardias.js` | Las estampas y la IA corta (patrulla, te ve de a poco, grita, tira) |
| `main.js` | La cámara, el movimiento, el disparo, el objetivo y el bucle |
| `vendor/three.module.js` | La librería 3D (three.js r160, licencia MIT) |
