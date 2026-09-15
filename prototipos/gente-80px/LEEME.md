# Prototipo · La gente a 80 px

Prueba jugable **aparte del juego**, hecha para decidir cómo se ve y cómo se mueve
la gente antes de pasar el juego a más resolución. No la usa el juego: es la
referencia del dibujo y de los números que se eligieron. La historia completa de
las decisiones está en `NOTAS-DISENO.md` ("La gente curtida a 80 px").

## Cómo abrirla

Doble clic en **`Prueba-72.html`**, y **F** para pantalla completa. En un monitor
1920×1080 a pantalla completa se ve exactamente al tamaño real.

- **Mouse:** apuntar · **Clic:** disparar
- **WASD / flechas:** trotar · **Shift:** agachado, lento y sin ruido
- **1 / 2 / 3:** ritmo del trote (un paso cada 12, 16 o 20; arranca en 20)
- **T:** pisada nueva (con empuje) o vieja, para comparar
- **Z:** ampliar ×2 · **R:** empezar de nuevo

## Qué es cada archivo

| Archivo | Qué tiene |
|---|---|
| `l72-base.js` | Colores, la ropa de cada tipo, el lienzo (con borde de 2 puntos, escala nítida y deformación), sombreros y proporciones |
| `l72-frente.js` | De frente, tres cuartos y de espaldas: caminata, trote y agachado |
| `l72-lado.js` | De costado: caminata, trote con empuje, agachado y el brazo que apunta |
| `l72-cabezas.js` | Las cabezas dibujadas a la medida de las piernas largas (reemplazan a las de `l72-base.js`) |
| `prueba.js` | El vagón, el sigilo con los números del juego, la cámara y el dibujo |
| `tiroteo.js` | Apuntar, disparar, balas a la altura de la mano, vidas |
| `escena-fondo.png` | El vagón de hoy, sin gente (se agranda ×4) |
| `armar-prueba.ps1` | Junta todo en `Prueba-72.html` |

`Prueba-72.html` está subido aunque se pueda volver a armar: a diferencia de
`Forajido-jugar.html`, esto es una prueba congelada y conviene poder abrirla
directo. Si se cambia algún `.js`, hay que correr `armar-prueba.ps1`.
