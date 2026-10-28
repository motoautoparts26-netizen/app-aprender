# Gera TODAS as falas do app com a voz neural escolhida e grava em public/audio.
# Uso (na pasta do projeto):  powershell -ExecutionPolicy Bypass -File tools\gerar-audio.ps1 -Apelido <apelido>
# 1) npx vite-node scripts/falas.ts  → tools/falas.json (lista de frases)
# 2) edge-tts gera um mp3 por frase (só gera o que ainda não existe)
# 3) escreve public/audio/index.json com a lista de arquivos
# Internet é necessária só durante a geração. O app publicado não acessa nada.

# -Voz: pt-BR-FranciscaNeural (só pt-BR, estável) ou pt-BR-ThalitaMultilingualNeural (multilíngue; pode
#       trocar de idioma em frases curtas). -Refazer: apaga tudo e gera de novo com a voz escolhida.
param([string]$Apelido = '', [string]$Voz = 'pt-BR-FranciscaNeural', [switch]$Refazer)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$env:Path = "E:\Program Files\nodejs;" + $env:Path
$venv = Join-Path $PSScriptRoot 'tts-venv'
$py = "$venv\Scripts\python.exe"
if (-not (Test-Path $py)) { python -m venv $venv }
& $py -m pip install --quiet --disable-pip-version-check edge-tts

Write-Host "Montando a lista de falas (sem o nome da criança)..."
npx vite-node scripts/falas.ts
# Remove gravações antigas que contenham um nome (geradas por versões anteriores do script).
$dirAudio = Join-Path $root 'public\audio'
if (Test-Path $dirAudio) {
  Get-ChildItem $dirAudio -Filter '*.mp3' | Where-Object { $_.Name -match '^(home\.greet|session\.end|praise\.6|instr\.detective|instr\.detective\.free|detective\.done)@' } | Remove-Item -Force
}
$lista = Get-Content (Join-Path $PSScriptRoot 'falas.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$dir = Join-Path $root 'public\audio'
New-Item -ItemType Directory -Force $dir | Out-Null
if ($Refazer) {
  Write-Host "Refazendo tudo com a voz ${Voz}: apagando gravações anteriores..."
  Get-ChildItem $dir -Filter *.mp3 | Remove-Item -Force
}
Write-Host "Voz: $Voz"

# Manifesto: texto gravado em cada arquivo. Se o texto mudou no catálogo, a frase é regravada.
$manifestoPath = Join-Path $dir 'manifest.json'
$gravado = @{}
if (Test-Path $manifestoPath) {
  try { $m = Get-Content $manifestoPath -Raw -Encoding UTF8 | ConvertFrom-Json; foreach ($p in $m.PSObject.Properties) { $gravado[$p.Name] = $p.Value } } catch { }
} else {
  # Primeira vez com manifesto: as gravações que já existem são consideradas atuais.
  foreach ($f in $lista) { if (Test-Path (Join-Path $dir $f.file)) { $gravado[$f.file] = $f.text } }
}

$i = 0
$novos = 0
$falhas = @()
$ErrorActionPreference = 'Continue'   # erro numa frase não interrompe as outras
foreach ($f in $lista) {
  $i++
  $arq = Join-Path $dir $f.file
  $existe = (Test-Path $arq) -and ((Get-Item $arq).Length -gt 1000)
  if ($existe -and $gravado[$f.file] -eq $f.text) { continue }
  if ($existe) { Write-Host "   texto mudou, regravando: $($f.file)" -ForegroundColor DarkCyan; Remove-Item $arq -Force }
  Write-Host ("[{0}/{1}] {2}" -f $i, $lista.Count, $f.file)
  $ok = $false
  for ($tent = 1; $tent -le 3 -and -not $ok; $tent++) {
    $saida = & $py -m edge_tts --voice $Voz --rate=-8% --text $f.text --write-media $arq 2>&1
    if ((Test-Path $arq) -and ((Get-Item $arq).Length -gt 1000)) { $ok = $true }
    else {
      if (Test-Path $arq) { Remove-Item $arq -Force }
      Write-Host "   tentativa $tent falhou; aguardando..." -ForegroundColor DarkYellow
      Start-Sleep -Seconds (2 * $tent)
    }
  }
  if ($ok) { $novos++; $gravado[$f.file] = $f.text } else { $falhas += $f.file; Write-Warning "nao gerou: $($f.file)  ($($saida | Select-Object -Last 1))" }
  Start-Sleep -Milliseconds 300   # pausa curta entre frases, para o serviço não recusar
}
# Apaga gravações que saíram da lista (frases trocadas ou removidas), para o app não tocar texto antigo.
$esperados = @{}
foreach ($f in $lista) { $esperados[$f.file] = $true }
$orfaos = Get-ChildItem $dir -Filter *.mp3 | Where-Object { -not $esperados.ContainsKey($_.Name) }
if ($orfaos) { Write-Host ("Removendo {0} gravação(ões) antiga(s): {1}" -f $orfaos.Count, (($orfaos | Select-Object -First 8 -ExpandProperty Name) -join ', ')); $orfaos | Remove-Item -Force }
$index = Get-ChildItem $dir -Filter *.mp3 | Select-Object -ExpandProperty Name
# Manifesto só com os arquivos existentes.
$manifesto = [ordered]@{}
foreach ($n in $index) { if ($gravado.ContainsKey($n)) { $manifesto[$n] = $gravado[$n] } }
[IO.File]::WriteAllText($manifestoPath, ($manifesto | ConvertTo-Json), (New-Object Text.UTF8Encoding $false))
# UTF-8 sem BOM (o Set-Content do Windows PowerShell põe BOM, que o Node não aceita em JSON).
[IO.File]::WriteAllText((Join-Path $dir 'index.json'), ($index | ConvertTo-Json), (New-Object Text.UTF8Encoding $false))
$mb = [math]::Round((Get-ChildItem $dir -Filter *.mp3 | Measure-Object Length -Sum).Sum / 1MB, 1)
Write-Host ''
Write-Host "Pronto: $($index.Count) falas gravadas ($novos novas), $mb MB em public\audio."
if ($falhas.Count -gt 0) {
  Write-Host "$($falhas.Count) frase(s) nao geradas (rode o script de novo para tentar so essas):" -ForegroundColor Yellow
  $falhas | ForEach-Object { Write-Host "  $_" }
}
