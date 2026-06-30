# =============================================================================
# Hub 3S - Verificacao do .env local (Windows / PowerShell)
# -----------------------------------------------------------------------------
# Confere se o .env existe e se as variaveis essenciais estao preenchidas
# (sem placeholders). NAO imprime os valores das chaves. Read-only.
# Uso (na raiz):  powershell -ExecutionPolicy Bypass -File scripts/check-env.ps1
# =============================================================================
$ErrorActionPreference = "Stop"

function Ok($m)   { Write-Host "[ ok  ] $m" -ForegroundColor Green }
function Warn($m) { Write-Host "[warn ] $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "[erro ] $m" -ForegroundColor Red }

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not (Test-Path ".env")) {
    Fail ".env nao encontrado. Rode  .\scripts\dev-setup.ps1  para cria-lo."
    exit 1
}

# Carrega pares CHAVE=VALOR do .env (ignora comentarios e linhas vazias).
$envMap = @{}
Get-Content ".env" | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $k, $v = $line.Split("=", 2)
        $envMap[$k.Trim()] = $v.Trim().Trim('"')
    }
}

# Essenciais para o cliente (browser). As de servidor sao opcionais.
$required = @("VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY")
$problems = 0

foreach ($key in $required) {
    $val = $envMap[$key]
    if ([string]::IsNullOrWhiteSpace($val)) {
        Fail "$key esta ausente ou vazio."
        $problems++
    } elseif ($val -like "*...*" -or $val -like "*sb_publishable_...*") {
        Warn "$key ainda esta com placeholder; preencha o valor real do DEV."
        $problems++
    } else {
        Ok "$key preenchido."
    }
}

# Alerta de seguranca: service role nunca deve estar exposta indevidamente.
if ($envMap.ContainsKey("SUPABASE_SERVICE_ROLE_KEY") -and
    -not [string]::IsNullOrWhiteSpace($envMap["SUPABASE_SERVICE_ROLE_KEY"])) {
    Warn "SUPABASE_SERVICE_ROLE_KEY preenchida (secreta). Garanta que o .env NUNCA seja commitado."
}

# Aviso se apontar para o ambiente principal (producao).
if ($envMap["VITE_SUPABASE_URL"] -like "*nndvcsdevbxpgsccyimm*") {
    Warn "VITE_SUPABASE_URL aponta para o PRINCIPAL (producao). Para o DEV use xcqfdnymadeqeuacqotu."
}

if ($problems -eq 0) {
    Ok "Ambiente local pronto."
    exit 0
} else {
    Fail "$problems item(ns) a corrigir no .env."
    exit 1
}
