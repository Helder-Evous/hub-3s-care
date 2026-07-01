// =============================================================================
// Validação VISUAL LOCAL do S2-3 (Card Operacional do CRC) — Controle de Lead.
// -----------------------------------------------------------------------------
// USO LOCAL / MANUAL — NÃO faz parte do build nem do CI. Roda no SEU PC, com
// login real no Supabase DEV. NÃO contém credenciais: lê de variáveis de ambiente.
//
//   CRC_EMAIL="..." CRC_PASSWORD="..." APP_URL="http://localhost:8080" \
//     node scripts/validate-s2-3.local.mjs
//
// Pré-requisitos:
//   1) `bun run dev` rodando (APP_URL, padrão http://localhost:8080);
//   2) `.env` apontando para o Supabase DEV (xcqfdnymadeqeuacqotu);
//   3) Chrome/Chromium instalado. O script usa puppeteer-core:
//      - por padrão tenta o canal "chrome"; ou defina CHROME_PATH.
//
// READ-ONLY: apenas navega, captura screenshots e logs. Não muta dados.
// Saídas em tmp/s2-3-validation/ (ignorado pelo Git) + report.md.
// =============================================================================
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let puppeteer;
try {
  puppeteer = require("puppeteer-core");
} catch {
  console.error("[erro] puppeteer-core não encontrado. Rode `bun install` na raiz.");
  process.exit(1);
}

const APP_URL = (process.env.APP_URL || "http://localhost:8080").replace(/\/+$/, "");
const CRC_EMAIL = process.env.CRC_EMAIL;
const CRC_PASSWORD = process.env.CRC_PASSWORD;
const OUT = "tmp/s2-3-validation";

const report = [];
const line = (s = "") => { report.push(s); console.log(s); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function finishReport() {
  try {
    await writeFile(`${OUT}/report.md`, `# Validação visual S2-3 (local)\n\n${report.join("\n")}\n`, "utf8");
    console.log(`\nRelatório: ${OUT}/report.md`);
  } catch (e) { console.error("Falha ao salvar report:", e.message); }
}

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

async function main() {
  await mkdir(OUT, { recursive: true });
  line(`# Validação visual S2-3 — ${APP_URL}`);
  line("");

  if (!CRC_EMAIL || !CRC_PASSWORD) {
    line("❌ Faltam credenciais. Defina CRC_EMAIL e CRC_PASSWORD no ambiente (nunca no código).");
    await finishReport();
    process.exit(2);
  }

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
    line("   Instale o Chrome ou defina CHROME_PATH com o caminho do binário.");
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
  if (/\/auth\/login/.test(page.url()) || (await page.$('input[type="password"]'))) {
    const email = await page.$('input[type="email"], input[name*="mail" i], input[id*="mail" i]');
    const pass = await page.$('input[type="password"]');
    if (!email || !pass) await fail(page, "login-form", "Formulário de login não encontrado.", "Confirme APP_URL e que o app está rodando.");
    await email.type(CRC_EMAIL, { delay: 15 });
    await pass.type(CRC_PASSWORD, { delay: 15 });
    const clicked = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button, [type=submit]")].find((x) => /entrar|login|acessar/i.test(x.textContent || ""));
      if (b) { b.click(); return true; }
      return false;
    });
    if (!clicked) await fail(page, "login-submit", "Botão Entrar não encontrado.");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 45000 }).catch(() => {});
    await sleep(2000);
    if (/\/auth\/login/.test(page.url())) await fail(page, "login", "Login não concluído.", "Verifique CRC_EMAIL/CRC_PASSWORD e o usuário no DEV.");
  } else {
    line("   (já autenticado — seguindo)");
  }
  line(`   ✔ Autenticado. URL: ${page.url()}`);

  // -- 2) Board --------------------------------------------------------------
  line("\n## 2. Board (/crm/controle-lead)");
  await page.goto(APP_URL + "/crm/controle-lead", { waitUntil: "networkidle2", timeout: 45000 }).catch(() => {});
  await sleep(2500);
  await page.screenshot({ path: `${OUT}/01-board.png`, fullPage: true });
  line(`   Screenshot: ${OUT}/01-board.png`);

  const OFFICIAL = ["Novo Lead", "Agendado", "Remarcar", "Compareceu", "Perdido"];
  const spans = await page.evaluate(() => [...document.querySelectorAll("span")].map((s) => (s.textContent || "").trim()));
  const present = OFFICIAL.filter((c) => spans.includes(c));
  line(`   [1] Colunas 5/5? ${present.length}/5 → ${JSON.stringify(present)}`);
  line(`   [2] "Efetivou" como coluna? ${spans.includes("Efetivou") ? "SIM (DIVERGÊNCIA!)" : "não ✔"}`);

  // -- 3) Card: campos + tentativas + CTA + presença/prioridade/campanha -----
  line("\n## 3. Card operacional");
  const cardText = await page.evaluate(() => {
    const el = [...document.querySelectorAll("a")].find((a) => /abrir/i.test(a.textContent || ""))?.closest("div");
    return document.body.innerText;
  });
  const checks = {
    "[3] Responsável no card": /Responsável/i.test(cardText),
    "[4] Tentativas '0 realizadas'": /0\s+realizadas/i.test(cardText),
    "[5] CTA 'Registrar tentativa'": /Registrar tentativa/i.test(cardText),
    "[6] 'Próxima ação'": /Próxima ação/i.test(cardText),
    "[8] Campanha ausente": !/campanha/i.test(cardText),
  };
  for (const [k, v] of Object.entries(checks)) line(`   ${k}: ${v ? "✔" : "⚠️ revisar"}`);
  // CTA desabilitado?
  const ctaDisabled = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => /registrar tentativa/i.test(x.textContent || ""));
    return b ? b.disabled : null;
  });
  line(`   [5] CTA desabilitado? ${ctaDisabled === true ? "sim ✔" : ctaDisabled === false ? "NÃO ⚠️" : "CTA não encontrado (talvez haja tentativas>0)"}`);

  // screenshot de um card individual
  const firstCard = await page.evaluate(() => {
    const link = [...document.querySelectorAll("a")].find((a) => /abrir/i.test(a.textContent || ""));
    const card = link?.closest("div.relative") || link?.closest("div");
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  if (firstCard && firstCard.width > 0) {
    await page.screenshot({ path: `${OUT}/02-card.png`, clip: { x: Math.max(0, firstCard.x), y: Math.max(0, firstCard.y), width: firstCard.width, height: firstCard.height } });
    line(`   Screenshot do card: ${OUT}/02-card.png`);
  } else {
    line("   ⚠️ Nenhum card encontrado (board vazio? prepare um lead de teste).");
  }

  // -- 4) Abrir + detalhe ----------------------------------------------------
  line("\n## 4. Abrir + detalhe do lead");
  const opened = await page.evaluate(() => {
    const link = [...document.querySelectorAll("a")].find((a) => /abrir/i.test(a.textContent || ""));
    if (link) { link.click(); return true; }
    return false;
  });
  if (opened) {
    await sleep(2500);
    await page.screenshot({ path: `${OUT}/03-detail.png`, fullPage: true });
    const brokeu = /erro|not found|undefined/i.test(await page.evaluate(() => document.body.innerText).catch(() => ""));
    line(`   [10/11] Detalhe abriu. URL: ${page.url()}`);
    line(`   [11] Sinal de quebra no detalhe? ${brokeu ? "⚠️ revisar" : "não ✔"}`);
    line(`   Screenshot: ${OUT}/03-detail.png`);
  } else {
    line("   ⚠️ Link 'Abrir' não encontrado (board vazio?).");
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
  line("\n✔ Fim. Revise screenshots e report em tmp/s2-3-validation/.");
  await finishReport();
}

main().catch(async (e) => {
  console.error("[erro inesperado]", e);
  try { await finishReport(); } catch {}
  process.exit(1);
});
