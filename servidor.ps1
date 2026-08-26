# Servidor local mínimo para jugar el prototipo.
#
# ¿Por qué hace falta? Porque el juego usa módulos de JavaScript (import/export)
# y los navegadores los bloquean si abrís el index.html directo desde el disco.
# Este script sirve la carpeta por http://localhost:8080 sin instalar nada.
#
# Uso: doble clic en jugar.bat  (o bien: click derecho > Ejecutar con PowerShell)

param([switch]$NoBrowser, [int]$Port = 0)

# 8080 de siempre. El parámetro -Port (o la variable PORT) existe sólo para
# poder levantar un segundo servidor sin pelearse con el que ya está abierto.
$port = if ($Port -gt 0) { $Port }
        elseif ($env:PORT) { [int]$env:PORT }
        else { 8080 }
$root = $PSScriptRoot

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.wav'  = 'audio/wav'
  '.mp3'  = 'audio/mpeg'
  '.ogg'  = 'audio/ogg'
  '.ttf'  = 'font/ttf'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
  $listener.Start()
} catch {
  Write-Host "No se pudo abrir el puerto $port. Puede que ya haya un servidor corriendo." -ForegroundColor Red
  Read-Host "Enter para cerrar"
  exit 1
}

Write-Host ""
Write-Host "  FORAJIDO - servidor local" -ForegroundColor Yellow
Write-Host "  http://localhost:$port/" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Dejá esta ventana abierta mientras jugás."
Write-Host "  Ctrl+C para cerrar el servidor."
Write-Host ""

if (-not $NoBrowser) { Start-Process "http://localhost:$port/" }

while ($listener.IsListening) {
  try {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $path = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
    if ($path -eq '/') { $path = '/index.html' }

    $candidate = Join-Path $root ($path.TrimStart('/') -replace '/', '\')
    $full = [System.IO.Path]::GetFullPath($candidate)

    if ($full.StartsWith($root) -and (Test-Path -LiteralPath $full -PathType Leaf)) {
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $type = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }

      $response.ContentType = $type
      $response.Headers.Add('Cache-Control', 'no-store')
      $response.ContentLength64 = $bytes.Length
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Host ("  200  " + $path)
    } else {
      $response.StatusCode = 404
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 - no encontrado: $path")
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Host ("  404  " + $path) -ForegroundColor Red
    }

    $response.OutputStream.Close()
  } catch {
    # Una petición cancelada por el navegador no debe tumbar el servidor.
  }
}
