# Rodando o Hub 3S localmente (Windows)

Guia para subir o Hub 3S no seu PC e **ver as alterações ao vivo**. O servidor de
desenvolvimento (Vite) tem _hot-reload_: ao salvar um arquivo, o navegador atualiza sozinho.

> **Ambiente padrão: Supabase DEV** (`xcqfdnymadeqeuacqotu`) — seguro para experimentar.
> **Não** use o ambiente principal (produção) para testes.

---

## 1. Pré-requisitos

- **Git** — https://git-scm.com/download/win
- **Bun** — o script de setup instala automaticamente se faltar (ou veja https://bun.sh).
- (Opcional) **Claude Code local**, se você quiser que ele execute estes passos por você.

## 2. Clonar o repositório

```powershell
git clone https://github.com/Helder-Evous/hub-3s-care.git
cd hub-3s-care
```

## 3. Setup (uma vez)

Na raiz do projeto, no PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev-setup.ps1
```

O script: verifica Git/Bun (instala o Bun se faltar), cria o `.env` a partir do
`.env.example` e roda `bun install`.

## 4. Configurar o `.env` (chaves do DEV)

Abra o `.env` (criado no passo anterior) e preencha com as chaves do **Supabase DEV**:

- `VITE_SUPABASE_URL` → `https://xcqfdnymadeqeuacqotu.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` → a chave **publishable (anon)** do DEV
- `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` → mesmos valores (uso no servidor)
- `SUPABASE_SERVICE_ROLE_KEY` → **só** se precisar de SSR/admin local (chave **secreta**)

Pegue as chaves em:
https://supabase.com/dashboard/project/xcqfdnymadeqeuacqotu/settings/api

> **Segurança:** o `.env` é ignorado pelo Git (`.gitignore`) e **nunca** deve ser commitado.
> Nunca exponha a `service_role`. Use só a chave **publishable** no frontend.

Confira se está tudo certo:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-env.ps1
```

## 5. Rodar o app (dia a dia)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev.ps1
```

Isso faz `git pull` + `bun install` + `bun run dev`. Abra no navegador o endereço
que aparecer no terminal (normalmente `http://localhost:3000`). A partir daí, **toda
alteração salva atualiza a tela automaticamente**. Para encerrar: `Ctrl + C`.

## 6. Atualizar (quando houver mudanças no repositório)

```powershell
git pull
```

(O `scripts/dev.ps1` já faz isso a cada execução.)

---

## Solução de problemas

| Sintoma | O que fazer |
|---|---|
| `bun` não é reconhecido após instalar | Feche e reabra o PowerShell (atualiza o PATH) e rode de novo. |
| `scripts ... não pode ser carregado` (política de execução) | Use o prefixo `powershell -ExecutionPolicy Bypass -File ...` mostrado acima. |
| App carrega mas sem dados / erro de auth | Verifique o `.env` (passo 4) e rode `scripts/check-env.ps1`. |
| Está vendo **dados de produção** | Seu `.env` provavelmente aponta para o principal; troque a URL/chave para o **DEV**. |
| Erro `Missing Supabase environment variable(s)` | Uma rota de servidor pediu `SUPABASE_SERVICE_ROLE_KEY`; preencha-a no `.env` (secreta) ou evite essa rota. |
| Porta ocupada | Encerre o processo na porta indicada ou rode em outra porta conforme a config do Vite. |

> **Dica (Claude Code local):** com o Claude Code instalado no seu PC, você pode abrir o
> projeto e pedir: _"leia o RUNNING_LOCALLY.md e configure o ambiente local"_ — ele executa
> os scripts por você (você só preenche as chaves do DEV no `.env`).
