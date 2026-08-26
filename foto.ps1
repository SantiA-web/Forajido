# SACARLE UNA FOTO A LA PANTALLA DEL JUEGO.
#
# ¿Para qué existe? Porque cuando el juego se maneja desde una consola remota
# —que es como se verifica todo en este proyecto— muchas veces la ventana no
# está componiendo cuadros y no se puede sacar una captura normal. El canvas
# SÍ se dibuja igual; lo que falta es una forma de traer esa imagen al disco.
#
# Esto es esa forma: un receptor mínimo. El juego le manda el canvas y esto lo
# guarda como PNG, al lado de este archivo.
#
# Uso:
#   1. Doble clic acá (o: powershell -File foto.ps1)
#   2. En la consola del navegador (F12), con el juego abierto:
#
#        fetch('http://localhost:8099/loquesea', {
#          method: 'POST',
#          headers: { 'Content-Type': 'text/plain' },
#          body: document.getElementById('game').toDataURL('image/png')
#        })
#
#   3. Queda `loquesea.png` en esta carpeta.
#
# Para mirar UNA parte en grande (por ejemplo un caballo del establo), primero
# se recorta y se agranda con un canvas aparte, y se manda ése:
#
#   const c = document.createElement('canvas');
#   c.width = 76 * 4; c.height = 64 * 4;
#   const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
#   x.drawImage(document.getElementById('game'), 140, 34, 76, 64, 0, 0, 304, 256);
#   fetch('http://localhost:8099/zoom', { method:'POST',
#     headers:{'Content-Type':'text/plain'}, body: c.toDataURL('image/png') });
#
# No tiene NADA que ver con el juego: es una herramienta de taller. Se puede
# borrar sin que se rompa nada.

$dir = $PSScriptRoot
$puerto = 8099

$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$puerto/")

try {
  $l.Start()
} catch {
  Write-Host "No se pudo abrir el puerto $puerto. ¿Ya hay uno corriendo?" -ForegroundColor Red
  Read-Host "Enter para cerrar"
  exit 1
}

Write-Host ""
Write-Host "  FORAJIDO - receptor de capturas" -ForegroundColor Yellow
Write-Host "  http://localhost:$puerto/<nombre>" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Las fotos quedan en $dir"
Write-Host "  Ctrl+C para cerrar."
Write-Host ""

while ($l.IsListening) {
  try {
    $ctx = $l.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    # Sin esto el navegador no deja mandar nada desde la página del juego.
    $res.Headers.Add('Access-Control-Allow-Origin', '*')
    $res.Headers.Add('Access-Control-Allow-Headers', '*')

    if ($req.HttpMethod -eq 'POST') {
      $sr = New-Object System.IO.StreamReader($req.InputStream, $req.ContentEncoding)
      $body = $sr.ReadToEnd()
      $sr.Close()

      $b64 = $body -replace '^data:image/png;base64,', ''
      $nombre = $req.Url.AbsolutePath.TrimStart('/')
      if (-not $nombre) { $nombre = 'foto' }
      $nombre = ($nombre -replace '[^\w\-]', '_')

      $ruta = Join-Path $dir ($nombre + '.png')
      [System.IO.File]::WriteAllBytes($ruta, [System.Convert]::FromBase64String($b64))
      Write-Host ("  guardada  " + $nombre + ".png")
    }

    $bytes = [System.Text.Encoding]::UTF8.GetBytes('ok')
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
    $res.OutputStream.Close()
  } catch {
    Write-Host ("  error: " + $_.Exception.Message) -ForegroundColor Red
  }
}
