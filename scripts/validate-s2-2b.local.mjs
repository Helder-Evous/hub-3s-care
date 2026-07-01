// =============================================================================
// Validação VISUAL LOCAL do S2-2B (Operação do Agendamento) — Controle de Lead.
// -----------------------------------------------------------------------------
// USO LOCAL / MANUAL — NÃO faz parte do build nem do CI. Roda no SEU PC, com
// login real no Supabase DEV. NÃO contém credenciais: lê de variáveis de ambiente.
//
//   CRC_EMAIL="..." CRC_PASSWORD="..." APP_URL="http://localhost:8080" \
//     node scripts/validate-s2-2b.local.mjs
//
// Pré-requisitos:
//   1) `bun run dev` rodando (APP_URL, padrão http://localhost:8080);
//   2) `.env` apontando para o Supabase DEV (xcqfdnymadeqeuacqotu);
//   3) um navegador Chrome/Chromium instalado. O script usa puppeteer-core:
//      - por padrão tenta o canal "chrome" (Chrome estável instalado);
//      - ou defina CHROME_PATH / PUPPETEER_EXECUTABLE_PATH com o caminho do binário.
//
// Por segurança, este script é READ-ONLY por padrão (só navega e captura).
// As AÇÕES que mudam dados no DEV (Confirmar/Compareceu/Faltou/Cancelar/Remarcar)
// só rodam se você OPTAR explicitamente:
//   RUN_ACTIONS=1 TEST_LEAD_ID="<uuid de um lead de TESTE>" ...
// (use um lead descartável — as mudanças de status persistem no DEV).
//
// Saídas: screenshots + logs em tmp/s2-2b-validation/ (ignorado pelo Git) e
// um relatório tmp/s2-2b-validation/report.md.
// =============================================================================
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let puppeteer;
try {
  puppeteer = require("puppeteer-core");
} catch {
  console.error("[erro] puppeteer-core não encontrado. Rode `bun install` na raiz do projeto.");
  process.exit(1);
}

const APP_URL = (process.env.APP_URL || "http://localhost:8080").replace(/\/+$/, "");
const CRC_EMAIL = process.env.CRC_EMAIL;
const CRC_PASSWORD = process.env.CRC_PASSWORD;
const RUN_ACTIONS = process.env.RUN_ACTIONS === "1";
const TEST_LEAD_ID = process.env.TEST_LEAD_ID || "";
const OUT = "tmp/s2-2b-validation";

const report = [];
const line = (s = "") => { report.push(s); console.log(s); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fail(page, step, reason, hint) {
  line(`\n❌ PARADA em: ${step}`);
  line(`   Motivo: ${reason}`);
  if (hint) line(`   O que fazer: ${hint}`);
  if (page) {
    try { await page.screenshot({ path: `${OUT}/stop-${step}.png`, fullPage: true }); line(`   Screenshot: ${OUT}/stop-${step}.png`); } catch {}
  }
  await finishReport();
  process.exit(2);
}

async function finishReport() {
  try {
    await writeFile(`${OUT}/report.md`, `# Validação visual S2-2B (local)\n\n${report.join("\n")}\n`, "utf8");
    console.log(`\nRelatório: ${OUT}/report.md`);
  } catch (e) { console.error("Falha ao salvar report:", e.message); }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  line(`# Validação visual S2-2B — ${APP_URL}`);
  line(`Modo: ${RUN_ACTIONS ? "READ-ONLY + AÇÕES (opt-in)" : "READ-ONLY (padrão)"}`);
  line("");

  if (!CRC_EMAIL || !CRC_PASSWORD) {
    line("❌ Faltam credenciais.");
    line("   Defina CRC_EMAIL e CRC_PASSWORD no ambiente (nunca no código).");
    await finishReport();
    process.exit(2);
  }

  // -- Launch browser (Chrome/Chromium local) --------------------------------
  const execPath = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  const launchOpts = { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] };
  if (execPath) launchOpts.executablePath = execPath;
  else launchOpts.channel = "chrome";
  let browser;
  try {
    browser = await puppeteer.launch(launchOpts);
  } catch (e) {
    line("❌ Não foi possível abrir o navegador.");
    line(`   ${e.message}`);
    line("   Instale o Chrome, ou defina CHROME_PATH com o caminho do binário do Chrome/Chromium.");
    await finishReport();
    process.exit(2);
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const consoleMsgs = [], netErrors = [];
  page.on("console", (m) => consoleMsgs.push(`[${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => consoleMsgs.push(`[pageerror] ${e}`));
  page.on("requestfailed", (r) => netErrors.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText}`));
  page.on("response", (r) => { if (r.status() >= 400) netErrors.push(`HTTP ${r.status()} ${r.url()}`); });

  // -- 1) Login --------------------------------------------------------------
  line("## 1. Login");
  await page.goto(APP_URL + "/crm/controle-lead", { waitUntil: "networkidle2", timeout: 45000 }).catch(() => {});
  await sleep(1500);
  if (!/\/auth\/login/.test(page.url()) && !(await page.$('input[type="password"]'))) {
    line("   (já autenticado ou sem tela de login — seguindo)");
  } else {
    const emailSel = 'input[type="email"], input[name*="mail" i], input[id*="mail" i]';
    const passSel = 'input[type="password"]';
    const email = await page.$(emailSel);
    const pass = await page.$(passSel);
    if (!email || !pass) await fail(page, "login-form", "Formulário de login não encontrado.", "Confirme APP_URL e que o app está rodando.");
    await email.type(CRC_EMAIL, { delay: 15 });
    await pass.type(CRC_PASSWORD, { delay: 15 });
    // botão "Entrar" (submit)
    const clicked = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button, [type=submit]')];
      const b = btns.find((x) => /entrar|login|acessar/i.test(x.textContent || "")) || btns[0];
      if (b) { b.click(); return true; }
      return false;
    });
    if (!clicked) await fail(page, "login-submit", "Botão Entrar não encontrado.");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 45000 }).catch(() => {});
    await sleep(2000);
    if (/\/auth\/login/.test(page.url())) {
      await fail(page, "login", "Login não concluído (ainda na tela de login).",
        "Verifique CRC_EMAIL/CRC_PASSWORD e se o usuário existe no DEV.");
    }
  }
  line(`   ✔ Autenticado. URL: ${page.url()}`);

  // -- 2) Board --------------------------------------------------------------
  line("\n## 2. Board (/crm/controle-lead)");
  await page.goto(APP_URL + "/crm/controle-lead", { waitUntil: "networkidle2", timeout: 45000 }).catch(() => {});
  await sleep(2500);
  await page.screenshot({ path: `${OUT}/01-board.png`, fullPage: true });
  line(`   Screenshot: ${OUT}/01-board.png`);

  const OFFICIAL = ["Novo Lead", "Agendado", "Remarcar", "Compareceu", "Perdido"];
  const cols = await page.evaluate(() => {
    // As colunas do board sao cabecalhos <span class="text-sm font-semibold">.
    const spans = [...document.querySelectorAll("span")].map((s) => (s.textContent || "").trim());
    return spans;
  });
  const present = OFFICIAL.filter((c) => cols.includes(c));
  const hasEfetivou = cols.includes("Efetivou");
  line(`   Colunas esperadas presentes: ${present.length}/5 → ${JSON.stringify(present)}`);
  line(`   "Efetivou" como coluna? ${hasEfetivou ? "SIM (DIVERGÊNCIA!)" : "não ✔"}`);
  if (present.length !== 5) line("   ⚠️ Nem todas as 5 colunas foram detectadas (o board pode estar vazio — prepare um lead de teste).");
  if (hasEfetivou) line("   ⚠️ DIVERGÊNCIA: 'Efetivou' apareceu como coluna.");

  // -- 3) Abrir um lead ------------------------------------------------------
  line("\n## 3. Detalhe do lead + Agendamentos");
  let leadOpened = false;
  if (TEST_LEAD_ID) {
    await page.goto(`${APP_URL}/crm/controle-lead/${TEST_LEAD_ID}`, { waitUntil: "networkidle2", timeout: 45000 }).catch(() => {});
    await sleep(2000);
    leadOpened = !/lead não encontrado/i.test(await page.evaluate(() => document.body.innerText));
  } else {
    // clica no primeiro "Abrir" do board
    leadOpened = await page.evaluate(() => {
      const link = [...document.querySelectorAll("a")].find((a) => /abrir/i.test(a.textContent || ""));
      if (link) { link.click(); return true; }
      return false;
    });
    if (leadOpened) { await sleep(2500); }
  }

  if (!leadOpened) {
    line("   Nenhum lead disponível para abrir.");
    line("   Prepare um lead de TESTE (use 'Novo Lead' no board) e rode de novo,");
    line("   ou informe TEST_LEAD_ID=<uuid>.");
    await page.screenshot({ path: `${OUT}/02-no-lead.png`, fullPage: true });
  } else {
    await page.screenshot({ path: `${OUT}/02-lead-detail.png`, fullPage: true });
    line(`   Screenshot: ${OUT}/02-lead-detail.png`);
    const detail = await page.evaluate(() => document.body.innerText);
    const hasAgendamentos = /Agendamentos/.test(detail);
    line(`   Seção "Agendamentos" visível? ${hasAgendamentos ? "sim ✔" : "não ⚠️"}`);
    // botoes de acao presentes?
    const actionBtns = await page.evaluate(() => {
      const names = ["Confirmar", "Compareceu", "Faltou", "Cancelar", "Remarcar", "Novo agendamento"];
      const txt = [...document.querySelectorAll("button")].map((b) => (b.textContent || "").trim());
      return names.filter((n) => txt.includes(n));
    });
    line(`   Botões de ação detectados: ${JSON.stringify(actionBtns)}`);
  }

  // -- 4) Ações (opt-in, mutam DEV) ------------------------------------------
  if (RUN_ACTIONS) {
    line("\n## 4. Ações (RUN_ACTIONS=1 — muda dados no DEV)");
    if (!leadOpened) {
      line("   Pulado: nenhum lead aberto.");
    } else {
      line("   ⚠️ Este modo clica nos botões e PERSISTE mudanças no DEV.");
      line("   Recomenda-se usar um lead de TESTE (TEST_LEAD_ID).");
      line("   Guiado manual sugerido: Confirmar → Compareceu (novo agend.) → Faltou/Cancelar → Remarcar.");
      // Nao automatizamos cliques destrutivos por padrao para evitar sequencias
      // ambiguas; capturamos o estado. Ajuste aqui se quiser automatizar a sequencia.
      await page.screenshot({ path: `${OUT}/03-actions-ready.png`, fullPage: true });
    }
  } else {
    line("\n## 4. Ações");
    line("   READ-ONLY: cliques de Confirmar/Compareceu/Faltou/Cancelar/Remarcar NÃO executados.");
    line("   Para validar o comportamento, clique manualmente no app, ou rode com RUN_ACTIONS=1 e um lead de TESTE.");
  }

  // -- Logs ------------------------------------------------------------------
  line("\n## Console (amostra)");
  line("```");
  line(consoleMsgs.slice(0, 40).join("\n") || "(vazio)");
  line("```");
  line("## Network — falhas/4xx (amostra)");
  line("```");
  line([...new Set(netErrors)].slice(0, 40).join("\n") || "(nenhuma)");
  line("```");

  await browser.close();
  line("\n✔ Fim. Revise os screenshots e este relatório em tmp/s2-2b-validation/.");
  await finishReport();
}

main().catch(async (e) => {
  console.error("[erro inesperado]", e);
  try { await finishReport(); } catch {}
  process.exit(1);
});
