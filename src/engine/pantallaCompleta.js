/**
 * PANTALLA COMPLETA DESDE EL JUEGO — [ALT+ENTER].
 *
 * Es la tecla de los juegos de PC de toda la vida, y por eso ésta y no otra:
 * quien la conoce la prueba sin leer nada. F11 sigue andando (es del
 * navegador), y el tamaño se acomoda igual con cualquiera de las dos porque el
 * renderer escucha el cambio de ventana.
 *
 * EL NAVEGADOR NO DEJA ENTRAR SOLO. Una página no puede ponerse en pantalla
 * completa sin que la persona apriete algo: es una regla de seguridad, no un
 * límite de este código. Por eso es una tecla y no algo que pasa al abrir.
 *
 * Y SE TRABA EL [ESC]. En pantalla completa el navegador usa Escape para
 * salir, y el juego lo usa para volver del mapa y de las tiendas: sin trabarlo,
 * cerrar una tienda te sacaría de la pantalla completa. Con `keyboard.lock`
 * (Chrome y Edge) un toque de Escape llega al juego, y para salir se MANTIENE
 * apretado — el navegador lo avisa arriba al entrar. Donde no existe, no pasa
 * nada: Escape saca de la pantalla completa, como en cualquier página.
 */

export function activarPantallaCompleta() {
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Enter' || !e.altKey) return;
    e.preventDefault();
    alternar();
  });
}

async function alternar() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    if (navigator.keyboard && navigator.keyboard.lock) {
      await navigator.keyboard.lock(['Escape']);
    }
  } catch {
    // Sin permiso (un iframe, un navegador que no deja): se queda como está.
  }
}
