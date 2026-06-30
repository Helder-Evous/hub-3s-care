# =============================================================================
# Hub 3S - Rodar o app localmente em modo desenvolvimento (Windows / PowerShell)
# -----------------------------------------------------------------------------
# Atalho do dia a dia:
#   1) git pull (atualiza a branch atual);
#   2) bun install (garante dependencias);
#   3) bun run dev (Vite com hot-reload: o navegador atualiza a cada alteracao).
#
# Pre-requisito: rodar `scripts/dev-setup.ps1` ao menos uma vez.
# Uso (na raiz do repositorio):  powershell -ExecutionPolicy Bypass -File scripts/dev.ps1
# Encerrar o servidor: Ctrl + C.
# =============================================================================
$ErrorActionPreference = "Stop"

function Info($m) { Write-Host "[dev] $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[dev] $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "[dev] $m" -ForegroundColor Red }

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Fail "Bun nao encontrado. Rode primeiro:  .\scripts\dev-setup.ps1"
    exit 1
}
if (-not (Test-Path ".env")) {
    Warn "Sem .env: o app pode cair nos defaults do PRINCIPAL (producao)."
    Warn "Rode  .\scripts\dev-setup.ps1  e preencha o .env com as chaves do DEV."
}

# 1) Atualiza a branch atual (nao falha o fluxo se estiver offline).
try {
    Info "Atualizando a branch atual (git pull)..."
    git pull --ff-only
} catch {
    Warn "git pull falhou (offline ou branch sem upstream). Seguindo com o codigo local."
}

# 2) Dependencias.
Info "Garantindo dependencias (bun install)..."
bun install

# 3) Servidor de desenvolvimento (hot-reload).
Info "Subindo o servidor de desenvolvimento (Ctrl+C para sair)..."
Info "Abra no navegador o endereco que aparecer abaixo (ex.: http://localhost:3000)."
bun run dev
