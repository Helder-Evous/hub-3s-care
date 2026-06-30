# =============================================================================
# Hub 3S - Verificacao do Ambiente local (Windows / PowerShell)
# -----------------------------------------------------------------------------
# Diagnostico claro do ambiente: Git, Bun, .env e qual Supabase esta configurado
# (DEV x PRODUCAO). NAO imprime secrets, publishable completa ou service role —
# apenas o ambiente. Read-only.
#
# Saida: 0 = ok; 1 = invalido / nao confirmado.
# Uso (na raiz):  powershell -ExecutionPolicy Bypass -File scripts/check-env.ps1
# =============================================================================
$ErrorActionPreference = "Stop"

$DEV_ID  = "xcqfdnymadeqeuacqotu"
$PROD_ID = "nndvcsdevbxpgsccyimm"

function Line() { Write-Host "======================================" }
function Head() {
    Line; Write-Host "HUB 3S"; Write-Host "Verificacao do Ambiente"; Line; Write-Host ""
}
function Pass($m) { Write-Host (([char]0x2714) + " $m") -ForegroundColor Green }   # checkmark
function Bad($m)  { Write-Host (([char]0x274C) + " $m") -ForegroundColor Red }     # cross

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot
Head

# --- Git / Bun ---------------------------------------------------------------
if (Get-Command git -ErrorAction SilentlyContinue) { Pass "Git" }
else { Bad "Git nao encontrado"; exit 1 }

if (Get-Command bun -ErrorAction SilentlyContinue) { Pass "Bun" }
else { Bad "Bun nao encontrado (rode scripts/dev-setup.ps1)"; exit 1 }

# --- .env --------------------------------------------------------------------
if (-not (Test-Path ".env")) {
    Write-Host ""
    Bad ".env nao encontrado"
    Write-Host "Configure o arquivo antes de executar (scripts/dev-setup.ps1)."
    exit 1
}
Pass ".env encontrado"

# Carrega CHAVE=VALOR (ignora comentarios/linhas vazias).
$envMap = @{}
Get-Content ".env" | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $k, $v = $line.Split("=", 2)
        $envMap[$k.Trim()] = $v.Trim().Trim('"')
    }
}

$url = $envMap["VITE_SUPABASE_URL"]
$key = $envMap["VITE_SUPABASE_PUBLISHABLE_KEY"]

function Invalido($motivo) {
    Write-Host ""
    Bad ".env invalido"
    Write-Host $motivo
    Write-Host "Configure o arquivo antes de executar."
    exit 1
}

if ([string]::IsNullOrWhiteSpace($url) -or $url -like "*...*") {
    Invalido "VITE_SUPABASE_URL ausente ou com placeholder."
}
Pass "URL encontrada"

if ([string]::IsNullOrWhiteSpace($key) -or $key -like "*...*") {
    Invalido "VITE_SUPABASE_PUBLISHABLE_KEY ausente ou com placeholder."
}
Pass "Publishable encontrada"

# --- Ambiente (NAO imprime valores das chaves) -------------------------------
Write-Host ""
Write-Host "Ambiente:"
Write-Host ""

if ($url -like "*$DEV_ID*") {
    Write-Host ([char]0x1F7E2 + " DEV") -ForegroundColor Green
    Write-Host ""
    Write-Host "Projeto:"; Write-Host $DEV_ID
    Write-Host ""
    # Alerta se a service role estiver preenchida (secreta).
    if (-not [string]::IsNullOrWhiteSpace($envMap["SUPABASE_SERVICE_ROLE_KEY"])) {
        Write-Host "Obs: SUPABASE_SERVICE_ROLE_KEY preenchida (secreta) — nunca commite o .env." -ForegroundColor Yellow
    }
    exit 0
}
elseif ($url -like "*$PROD_ID*") {
    Write-Host ([char]0x1F534 + " PRODUCAO") -ForegroundColor Red
    Write-Host ""
    Write-Host "ATENCAO" -ForegroundColor Red
    Write-Host "Voce esta apontando para o ambiente principal."
    Write-Host ""
    $resp = Read-Host "Digite SIM para continuar"
    if ($resp -eq "SIM") {
        Write-Host "Confirmado pelo usuario (producao)." -ForegroundColor Yellow
        exit 0
    } else {
        Bad "Nao confirmado. Aponte o .env para o DEV ($DEV_ID)."
        exit 1
    }
}
else {
    Write-Host "Ambiente desconhecido (URL nao corresponde a DEV nem a Producao)." -ForegroundColor Yellow
    Write-Host "Projeto esperado para DEV: $DEV_ID"
    exit 1
}
