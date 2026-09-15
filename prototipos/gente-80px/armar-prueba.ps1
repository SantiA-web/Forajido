# Junta la prueba jugable en UN solo archivo (dibujos + código + fondo adentro).
$s = $PSScriptRoot
$leer = { param($n) [IO.File]::ReadAllText((Join-Path $s $n), [Text.Encoding]::UTF8) }
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $s 'escena-fondo.png')))

$cabeza = @'
<!doctype html>
<meta charset="utf-8">
<title>Forajido - prueba 72 px</title>
<style>
  html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
  canvas { position: absolute; inset: 0; margin: auto; width: 100vw; height: 56.25vw;
           max-height: 100vh; max-width: 177.78vh; image-rendering: pixelated; cursor: crosshair; }
  #ayuda { position: fixed; left: 12px; top: 10px; color: #e8dcc0; font: 14px sans-serif;
           background: rgba(0,0,0,.6); padding: 6px 10px; border-radius: 4px; }
</style>
<canvas id="c"></canvas>
<div id="ayuda">Mouse: apuntar &middot; Clic: disparar &middot; WASD o flechas: trotar &middot; Shift: agachado, lento y sin ruido &middot; Z: ampliar &times;2 &middot; R: empezar de nuevo &middot; F: pantalla completa<br><span id="opciones"></span></div>
<script>
'@

$js = (& $leer 'l72-base.js') + "`n" + (& $leer 'l72-frente.js') + "`n" + (& $leer 'l72-lado.js') + "`n" + (& $leer 'l72-cabezas.js') + "`n" +
      "const FONDO = 'data:image/png;base64," + $b64 + "';`n" + (& $leer 'prueba.js') + "`n" + (& $leer 'tiroteo.js')

$html = $cabeza + $js + "</script>`n"
[IO.File]::WriteAllText((Join-Path $s 'Prueba-72.html'), $html, (New-Object Text.UTF8Encoding $false))
"armado: " + (Get-Item (Join-Path $s 'Prueba-72.html')).Length + " bytes"
