# Gera amostras de voz neural (pt-BR) para você ouvir e escolher.
# Uso: clique em "Run" neste bloco ou rode no PowerShell:  .\tools\amostra-voz.ps1
# Cria um ambiente Python isolado em tools\tts-venv, instala o pacote edge-tts e gera
# 5 frases com cada voz em tools\amostras\<voz>\. Só as frases abaixo são enviadas ao serviço.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$venv = Join-Path $PSScriptRoot 'tts-venv'
$out = Join-Path $PSScriptRoot 'amostras'

if (-not (Test-Path "$venv\Scripts\python.exe")) {
  Write-Host 'Criando ambiente Python isolado...'
  python -m venv $venv
}
$py = "$venv\Scripts\python.exe"
Write-Host 'Instalando edge-tts (uma vez)...'
& $py -m pip install --quiet --disable-pip-version-check edge-tts

$frases = [ordered]@{
  '1-oi'       = 'Olá! Que bom ter você aqui! Qual ilha deseja explorar?'
  '2-letra'    = 'Esta é a letra dê. Dê!'
  '3-cor'      = 'Esta é o azul. Toca na cor igual a esta.'
  '4-elogio'   = 'Isso! Você olhou com atenção!'
  '5-caixa'    = 'Da caixa saiu... banana! Qual letra começa banana? Toca nela.'
}
$vozes = @('pt-BR-FranciscaNeural', 'pt-BR-ThalitaMultilingualNeural')

foreach ($voz in $vozes) {
  $dir = Join-Path $out $voz
  New-Item -ItemType Directory -Force $dir | Out-Null
  foreach ($k in $frases.Keys) {
    $arq = Join-Path $dir "$k.mp3"
    Write-Host "  $voz / $k"
    & $py -m edge_tts --voice $voz --rate=-10% --text $frases[$k] --write-media $arq
  }
}
Write-Host ''
Write-Host "Pronto. Amostras em: $out"
Write-Host 'Abra as pastas e ouça os 5 arquivos de cada voz.'
