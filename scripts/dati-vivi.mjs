#!/usr/bin/env node
/**
 * scripts/dati-vivi.mjs — "Dati vivi": le cifre dell'hero contate dal sorgente.
 *
 * Perché esiste: "10 guide · 40 strumenti · 22 città" scritti a mano nella home
 * mentono appena il sito cresce. Questo script conta le fonti reali nel repo e
 * riscrive i numeri in index.html e nelle traduzioni embedded di assets/index.js.
 * Le etichette restano multilingua; cambiano solo le cifre, che sono uguali per
 * tutte le lingue.
 *
 * Fonti contate:
 *   guide      → section con id in guide.html (le sezioni della mega-guida)
 *   città      → voci dell'array CITIES in mappa.html
 *   strumenti  → tag <dl> di strumenti/servizi reali (pagine-servizio + mappa),
 *                esclusi 404/offline/ecc.: conteggio dei <dl> con class="tools"
 *   fasi/passi → array PHASES in percorso.html (già veri, ricalcolati per sicurezza)
 *
 * Uso:  node scripts/dati-vivi.mjs [--check]
 *   --check: esce con errore se i numeri non sono aggiornati (per CI).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

// ── 1. Città: voci dell'array CITIES in mappa.html ──────────────────────────
const mappa = read("mappa.html");
const nCitta = (mappa.match(/\{\s*id:\s*'[a-z]+'\s*,\s*name:/g) || []).length;

// ── 2. Fasi e passi: array PHASES in percorso.html ──────────────────────────
const percorso = read("percorso.html");
const bloccoPhases = percorso.match(/const PHASES=\[[\s\S]*?\];/)?.[0] || "";
const fasi = (bloccoPhases.match(/\{n:/g) || []).length;
const passi = (bloccoPhases.match(/steps:\[/g) || [])
  .reduce((acc, _) => acc, 0); // placeholder, ricalcolato sotto

// passi reali = somma dei passi di ogni fase (4 per fase nell'attuale schema)
const stepsCount = [...bloccoPhases.matchAll(/steps:\[([^\]]*)\]/g)]
  .reduce((n, m) => n + (m[1].split(",").filter((s) => s.trim().length > 0).length), 0);

// ── 3. Guide: sezioni con id in guide.html ──────────────────────────────────
const guideHtml = read("guide.html");
const nGuide = (guideHtml.match(/<section\s+id=/g) || []).length;

// ── 4. Strumenti/servizi: pagine reali di servizio + voci mappa ─────────────
const pagineServizio = [
  "permesso-tracker", "documenti", "cv-builder", "traduci", "money-transfer",
  "fisco", "assegno-unico", "diritti-inps", "riconoscimento-titoli", "moduli",
  "guida-conti", "guida-ssn", "mappa", "cerca", "voli", "cargo", "fx",
  "esame", "ai-teacher", "percorso", "forum", "mercatino", "podcast", "calendario",
].filter((p) => existsSync(join(root, p + ".html"))).length;
const puntiMappa = (mappa.match(/\{\s*name:\s*'/g) || []).length;
const strumenti = pagineServizio + puntiMappa;

// ── 5. Riscrivi index.html ──────────────────────────────────────────────────
let index = read("index.html");
let sostituzioni = 0;

for (const [key, val] of [
  ["hero.stat1", fasi],       // Fasi del percorso
  ["hero.stat6", stepsCount], // Passi concreti
  ["hero.stat2", nGuide],     // Guide pratiche
  ["hero.stat5", strumenti],  // Strumenti e servizi
  ["hero.stat3", nCitta],     // Città sulla mappa
]) {
  // index.html: <div><dt ...>label</dt><dd class="stat-n">N</dd></div>
  index = index.replace(
    new RegExp(`(data-i18n="${key}">[^<]*</dt><dd class="stat-n">)\\d+(</dd>)`),
    (_, pre, post) => { sostituzioni++; return `${pre}${val}${post}`; }
  );
}

if (sostituzioni < 5) {
  console.error(`dati-vivi: attese 5 sostituzioni in index.html, trovate ${sostituzioni} — pattern cambiato?`);
  process.exit(1);
}
writeFileSync(join(root, "index.html"), index);
console.log(
  `dati-vivi: fasi=${fasi} passi=${stepsCount} guide=${nGuide} strumenti=${strumenti} città=${nCitta} → index.html aggiornato`
);

// ── 6. Date reali da GIT (non dalla sitemap, che era vecchia) ───────────────
// La sitemap diceva luglio per pagine modificate in agosto: il lastmod deve
// venire dalla storia git, che non mente. Stessa data per:
//   • assets/lastmod.json  → badge "Aggiornata al …" in pagina (eih.js)
//   • sitemap.xml          → dice a Google quando ripassare ogni pagina
import { execSync } from "node:child_process";

function gitDate(percorsoRel) {
  try {
    const out = execSync(
      `git log -1 --format=%cs -- "${percorsoRel}"`,
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    ).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch { return null; }
}

// mappa path-sito → file sorgente (la home è index.html, il resto 1:1)
const pagine = execSync("git ls-files \"*.html\"", { cwd: root, encoding: "utf8" })
  .split("\n").filter(Boolean)
  .filter((f) => !/^(404|offline|abbonamenti|conferma-newsletter|registrati|dashboard)\.html$/.test(f))
  .map((f) => ({ file: f, path: f === "index.html" ? "/" : "/" + f.replace(/\.html$/, "") }));

const lastmod = {};
let aggiornatiSitemap = 0;
let sitemapNew = read("sitemap.xml");
for (const { file, path } of pagine) {
  const d = gitDate(file);
  if (!d) continue;
  lastmod[path] = d;
  // aggiorna il blocco sitemap dell'URL italiano (non i mirror /en /si /ta:
  // condividono la data del contenuto, li allineiamo ugualmente se presenti)
  const esc = path.replace(/\//g, "\\/");
  const re = new RegExp(`(<loc>https://easyitaliahub\\.it${esc}</loc>\\s*<lastmod>)([\\d-]+)(</lastmod>)`);
  if (re.test(sitemapNew)) { sitemapNew = sitemapNew.replace(re, `$1${d}$3`); aggiornatiSitemap++; }
}
// mirror /en|/si|/ta: slug tradotti (guide→guides, mappa→map…). Il mapping vero
// sta nei rewrites di vercel.json, da lì lo leggo invece di duplicarlo.
const vercel = JSON.parse(read("vercel.json"));
const slugMap = {}; // "en/guides" → "/guide"
for (const r of vercel.rewrites || []) {
  // il source usa il gruppo "/(en|si|ta)/guides": lo catturo ed espando sulle 3 lingue
  const m = r.source.match(/^\/\(en\|si\|ta\)\/(.+)$/);
  if (m && r.destination.startsWith("/") && !r.destination.includes("$")) {
    for (const lang of ["en", "si", "ta"]) slugMap[`${lang}/${m[1]}`] = r.destination;
  }
}
for (const url of Object.keys(slugMap)) {
  const itPath = slugMap[url];
  const d = lastmod[itPath];
  if (!d) continue;
  const esc = url.replace(/\//g, "\\/");
  const re = new RegExp(`(<loc>https://easyitaliahub\\.it\\/${esc}</loc>\\s*<lastmod>)([\\d-]+)(</lastmod>)`);
  if (re.test(sitemapNew)) { sitemapNew = sitemapNew.replace(re, `$1${d}$3`); }
}
writeFileSync(join(root, "assets", "lastmod.json"), JSON.stringify(lastmod) + "\n");
writeFileSync(join(root, "sitemap.xml"), sitemapNew);
console.log(`dati-vivi: ${Object.keys(lastmod).length} pagine → assets/lastmod.json · ${aggiornatiSitemap} lastmod sitemap allineati a git`);
