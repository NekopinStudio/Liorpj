param([switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$address = 'http://127.0.0.1:4182'

function Get-LiorServer {
    try {
        $response = Invoke-RestMethod -Uri "$address/__lior_launcher" -TimeoutSec 2
        if ($response.app -eq 'lior-local-launcher' -and $response.root -eq $projectRoot -and $response.version -eq 2) { return $response }
        throw 'El puerto local esta ocupado por otra aplicacion o por otra copia de Lior.'
    } catch [System.Net.WebException] { return $null }
}

try {
    if (!(Test-Path -LiteralPath (Join-Path $projectRoot 'index.html'))) { throw 'Falta index.html. Conserva el launcher dentro de la carpeta Liorpj.' }
    $server = Get-LiorServer
    if (!$server) {
        $node = Get-Command node.exe -ErrorAction SilentlyContinue
        if (!$node) { throw 'Se necesita Node.js para abrir la ficha local. Instala su version LTS desde https://nodejs.org/.' }
        $serverFile = Join-Path $projectRoot 'tools\lior-launcher.cjs'
        if (!(Test-Path -LiteralPath $serverFile)) { throw 'Falta tools\lior-launcher.cjs.' }
        Start-Process -FilePath $node.Source -ArgumentList ('"' + $serverFile + '"') -WorkingDirectory $projectRoot -WindowStyle Hidden | Out-Null
        for ($attempt = 0; $attempt -lt 30; $attempt++) {
            Start-Sleep -Milliseconds 150
            $server = Get-LiorServer
            if ($server) { break }
        }
        if (!$server) { throw 'No se pudo iniciar Lior. Comprueba que el puerto 4182 este disponible.' }
    }
    if ($CheckOnly) { Write-Output "$address/"; exit 0 }
    Start-Process "$address/"
} catch {
    Write-Host ('No se pudo abrir Lior: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
