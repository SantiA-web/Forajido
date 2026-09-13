# ARMAR EL JUEGO EN UN SOLO ARCHIVO: Forajido-jugar.html
#
# ¿Para qué existe? El juego está partido en decenas de archivos .js que se
# llaman entre sí (`import ... from './x.js'`). El navegador NO deja que se
# llamen así cuando abrís un archivo con doble clic (file://): por eso hasta
# ahora hacía falta servidor.ps1.
#
# Este script mete TODO adentro de un único HTML que se abre con doble clic,
# sin servidor, sin internet y sin cuenta. Se puede copiar a un pendrive.
#
# Cómo lo hace, sin tocar una línea del juego:
#   - Cada archivo .js va adentro del HTML como un "data:" (el código entero,
#     codificado en base64).
#   - Cada `from './x.js'` se reescribe a un nombre fijo (`forajido/data/x.js`),
#     y un "import map" le dice al navegador qué código es cada nombre.
#   - El CSS va en un <style>, y el escenario (canvas, HUD) se copia de index.html.
#
# ⚠️ NO SE ACTUALIZA SOLO. Después de cambiar el juego, volvé a correr esto:
#   doble clic no alcanza para un .ps1; clic derecho → "Ejecutar con PowerShell",
#   o en una consola:  powershell -ExecutionPolicy Bypass -File armar-archivo.ps1

$raiz = $PSScriptRoot
$src = Join-Path $raiz 'src'
$salida = Join-Path $raiz 'Forajido-jugar.html'
$utf8 = New-Object System.Text.UTF8Encoding($false)

$imports = New-Object System.Collections.Generic.List[string]
# Se saltea cualquier copia del repositorio que haya quedado ADENTRO de src (una
# carpeta con su propio .git, como la que deja un `git clone` hecho acá): la
# primera vez se coló una entera y el archivo salió con el juego dos veces.
$copias = Get-ChildItem -Path $src -Recurse -Directory -Force -Filter .git |
  ForEach-Object { $_.Parent.FullName + '\' }
$archivos = Get-ChildItem -Path $src -Recurse -Filter *.js |
  Where-Object { $ruta = $_.FullName; -not ($copias | Where-Object { $ruta.StartsWith($_) }) } |
  Sort-Object FullName

foreach ($f in $archivos) {
  $rel = $f.FullName.Substring($src.Length + 1).Replace('\', '/')
  $carpeta = ''
  if ($rel.Contains('/')) { $carpeta = $rel.Substring(0, $rel.LastIndexOf('/')) }

  $codigo = [System.IO.File]::ReadAllText($f.FullName, $utf8)

  # `from '../data/config.js'` visto desde `systems/` -> `from 'forajido/data/config.js'`
  $codigo = [regex]::Replace($codigo, "(from\s*)(['""])(\.{1,2}/[^'""]+)\2", {
    param($m)
    $partes = New-Object System.Collections.Generic.List[string]
    if ($carpeta) { foreach ($p in $carpeta.Split('/')) { $partes.Add($p) } }
    foreach ($p in $m.Groups[3].Value.Split('/')) {
      if ($p -eq '.') { continue }
      if ($p -eq '..') { $partes.RemoveAt($partes.Count - 1); continue }
      $partes.Add($p)
    }
    return $m.Groups[1].Value + $m.Groups[2].Value + 'forajido/' + ($partes -join '/') + $m.Groups[2].Value
  })

  $b64 = [Convert]::ToBase64String($utf8.GetBytes($codigo))
  $imports.Add("    `"forajido/$rel`": `"data:text/javascript;charset=utf-8;base64,$b64`"")
}

$css = [System.IO.File]::ReadAllText((Join-Path $src 'styles\main.css'), $utf8)

# El escenario sale de index.html, así el archivo y el juego con servidor no se desincronizan.
$index = [System.IO.File]::ReadAllText((Join-Path $raiz 'index.html'), $utf8)
$escenario = [regex]::Match($index, '(?s)<body>(.*?)<script type="module"').Groups[1].Value

$html = @"
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Forajido</title>
  <style>
$css
  </style>
  <script type="importmap">
{
  "imports": {
$($imports -join ",`n")
  }
}
  </script>
</head>
<body>
$escenario
  <script type="module">import 'forajido/main.js';</script>
</body>
</html>
"@

[System.IO.File]::WriteAllText($salida, $html, $utf8)

$kb = [math]::Round((Get-Item $salida).Length / 1KB)
Write-Host ""
Write-Host "  Listo: Forajido-jugar.html ($($archivos.Count) archivos, $kb KB)" -ForegroundColor Yellow
Write-Host "  Abrilo con doble clic."
Write-Host ""
