# =============================================================================
# Hub 3S - Setup do ambiente de desenvolvimento local (Windows / PowerShell)
# -----------------------------------------------------------------------------
# O que faz (uma vez):
#   1) verifica Git e Bun (instala o Bun se faltar, via instalador oficial);
#   2) cria .env a partir de .env.example, se ainda nao existir;
#   3) roda `bun install`.
#
# NAO toca banco, migrations, RLS ou codigo do produto. Nao commita nada.
# Uso (na raiz do repositorio):  powershell -ExecutionPolicy Bypass -File scripts/dev-setup.ps1
# =============================================================================
$ErrorActionPreference = "Stop"

function Info($m)  { Write-Host "[setup] $m" -ForegroundColor Cyan }
function Ok($m)    { Write-Host "[ ok  ] $m" -ForegroundColor Green }
function Warn($m)  { Write-Host "[warn ] $m" -ForegroundColor Yellow }
function Fail($m)  { Write-Host "[erro ] $m" -ForegroundColor Red }

# Garante execucao a partir da raiz do repositorio (pasta pai de /scripts).
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot
Info "Repositorio: $repoRoot"

# 1) Git -----------------------------------------------------------------------
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Fail "Git nao encontrado. Instale em https://git-scm.com/download/win e rode novamente."
    exit 1
}
Ok "Git encontrado: $(git --version)"

# 2) Bun -----------------------------------------------------------------------
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Warn "Bun nao encontrado. Instalando via instalador oficial (bun.sh)..."
    try {
        Invoke-RestMethod -Uri "https://bun.sh/install.ps1" | Invoke-Expression
    } catch {
        Fail "Falha ao instalar o Bun automaticamente. Instale manualmente: https://bun.sh"
        exit 1
    }
    # Atualiza o PATH desta sessao para enxergar o bun recem-instalado.
    $bunBin = Join-Path $env:USERPROFILE ".bun\bin"
    if (Test-Path $bunBin) { $env:PATH = "$bunBin;$env:PATH" }
    if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
        Warn "Bun instalado, mas nao visivel nesta sessao. FECHE e ABRA o PowerShell e rode de novo."
        exit 1
    }
}
Ok "Bun encontrado: $(bun --version)"

# 3) .env ----------------------------------------------------------------------
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Ok ".env criado a partir de .env.example."
        Warn "EDITE o .env e preencha as chaves do Supabase DEV antes de rodar o app."
        Warn "Chaves DEV: https://supabase.com/dashboard/project/xcqfdnymadeqeuacqotu/settings/api"
    } else {
        Warn ".env.example nao encontrado; pulei a criacao do .env."
    }
} else {
    Ok ".env ja existe (mantido)."
}

# 4) Dependencias --------------------------------------------------------------
Info "Instalando dependencias (bun install)..."
bun install
Ok "Dependencias instaladas."

Write-Host ""
Ok "Setup concluido."
Info "Proximo passo: rode  .\scripts\dev.ps1   para subir o app em modo desenvolvimento."
Info "O navegador deve abrir no endereco que o Vite exibir (ex.: http://localhost:3000)."
