/* Monta il video della pagina di iscrizione, uno per lingua.
   Uso:  node scripts/monta-video-iscrizione.mjs [it en si ta]

   Il filmato che c'era prima esisteva solo in italiano: chi si iscriveva
   leggendo il sito in inglese, in singalese o in tamil si trovava mezzo
   schermo in una lingua che non aveva scelto. Non esisteva nemmeno un
   sorgente da cui rifarlo, quindi il montaggio nasce qui: le scene sono
   HTML e CSS, i testi stanno in una tabella, e da quella tabella escono
   quattro filmati identici in tutto tranne che nelle parole.

   Come funziona: l'animazione non gira da sola. `disegna(t)` mette la pagina
   nello stato esatto del secondo `t`, il browser fotografa, e i fotogrammi
   finiscono in ffmpeg attraverso una pipe. Niente attese, niente fotogrammi
   persi: lo stesso comando dà sempre lo stesso file.

   I font: Clash Grotesk e Satoshi sono quelli del sito; per il singalese e il
   tamil servono i Noto, che non stanno nel repo — si scaricano da Google
   Fonts al primo giro e restano in .cache-font/.                            */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(RADICE, '.cache-font');
const USCITA = path.join(RADICE, 'assets', 'video');
const FF = process.env.FFMPEG || path.join(RADICE, 'node_modules', 'ffmpeg-static', 'ffmpeg');

const L = 1280, A = 800, FPS = 24;

/* ── I testi ──────────────────────────────────────────────────────────── */
const T = {
  it: {
    s1a: 'Questura. Moduli.', s1b: 'In una lingua che non è la tua.',
    s2t: 'Vivere in Italia,', s2e: 'senza perderti.',
    s2s: 'La piattaforma della comunità srilankese in Italia.',
    s3t: 'Chiedi.', s3e: 'Nella tua lingua.',
    s3d: 'Devo rinnovare il permesso: da dove comincio?',
    s3r: 'Puoi presentare la domanda fino a 60 giorni prima della scadenza. Ti preparo la lista dei documenti.',
    s4t: 'Tutto', s4e: 'chiaro.',
    s4l: ['Codice fiscale', 'Permesso di soggiorno', 'SPID e residenza', 'Lavoro e busta paga', 'Cittadinanza'],
    s4b: 'Guide passo passo',
    s5t: 'Al sicuro,', s5e: 'sempre.',
    s5s: 'Archivio privato e promemoria automatici prima di ogni scadenza.',
    s5f: 'Permesso_di_soggiorno_2026.pdf', s5n: 'Scade fra 74 giorni',
    s6t: 'Non sei', s6e: 'mai solo.',
    s6n: [['9', 'fasi del percorso'], ['10', 'guide pratiche'], ['40', 'strumenti e servizi'], ['4', 'lingue']],
    s7s: 'Tutta l\'Italia, spiegata semplice.', s7b: 'Registrati gratis',
    s7n: '100% gratuito · Nessuna carta di credito',
  },
  en: {
    s1a: 'Questura. Forms.', s1b: 'In a language that is not yours.',
    s2t: 'Living in Italy,', s2e: 'without getting lost.',
    s2s: 'The platform of the Sri Lankan community in Italy.',
    s3t: 'Just ask.', s3e: 'In your language.',
    s3d: 'I have to renew my permit: where do I start?',
    s3r: 'You can apply up to 60 days before it expires. I will get your document list ready.',
    s4t: 'All', s4e: 'clear.',
    s4l: ['Tax code', 'Residence permit', 'SPID and residency', 'Work and payslip', 'Citizenship'],
    s4b: 'Step-by-step guides',
    s5t: 'Safe,', s5e: 'always.',
    s5s: 'A private archive and automatic reminders before every deadline.',
    s5f: 'Residence_permit_2026.pdf', s5n: 'Expires in 74 days',
    s6t: 'You are', s6e: 'never alone.',
    s6n: [['9', 'stages of the journey'], ['10', 'practical guides'], ['40', 'tools and services'], ['4', 'languages']],
    s7s: 'All of Italy, explained simply.', s7b: 'Sign up free',
    s7n: '100% free · No credit card',
  },
  si: {
    s1a: 'Questura. පෝරම.', s1b: 'ඔබේ නොවන භාෂාවකින්.',
    s2t: 'ඉතාලියේ ජීවත් වීම,', s2e: 'නොමඟ නොයා.',
    s2s: 'ඉතාලියේ සිටින ශ්‍රී ලාංකික ප්‍රජාවගේ වේදිකාව.',
    s3t: 'අහන්න.', s3e: 'ඔබේ භාෂාවෙන්.',
    s3d: 'මට වාසි බලපත්‍රය අලුත් කළ යුතුයි: කොහෙන් පටන් ගන්නද?',
    s3r: 'කල් ඉකුත් වීමට දින 60කට පෙර ඉල්ලුම් කළ හැකියි. ලේඛන ලැයිස්තුව මම සූදානම් කරන්නම්.',
    s4t: 'සියල්ල', s4e: 'පැහැදිලියි.',
    s4l: ['බදු අංකය', 'වාසි බලපත්‍රය', 'SPID සහ පදිංචිය', 'රැකියාව සහ වැටුප් පත්‍රය', 'පුරවැසිභාවය'],
    s4b: 'පියවරෙන් පියවර මාර්ගෝපදේශ',
    s5t: 'ආරක්ෂිතව,', s5e: 'සැමවිටම.',
    s5s: 'පෞද්ගලික ලේඛනාගාරයක් සහ සෑම කල් ඉකුත්වීමකට පෙර ස්වයංක්‍රීය මතක් කිරීම්.',
    s5f: 'වාසි_බලපත්‍රය_2026.pdf', s5n: 'දින 74කින් කල් ඉකුත් වේ',
    s6t: 'ඔබ කිසිදා', s6e: 'තනිවම නොවේ.',
    s6n: [['9', 'ගමනේ අදියර'], ['10', 'ප්‍රායෝගික මාර්ගෝපදේශ'], ['40', 'මෙවලම් සහ සේවා'], ['4', 'භාෂා']],
    s7s: 'මුළු ඉතාලියම, සරලව පැහැදිලි කර.', s7b: 'නොමිලේ ලියාපදිංචි වන්න',
    s7n: '100% නොමිලේ · ණය කාඩ්පතක් අවශ්‍ය නැත',
  },
  ta: {
    s1a: 'Questura. படிவங்கள்.', s1b: 'உங்களுடையது அல்லாத ஒரு மொழியில்.',
    s2t: 'இத்தாலியில் வாழ்வது,', s2e: 'வழி தவறாமல்.',
    s2s: 'இத்தாலியில் உள்ள இலங்கைச் சமூகத்தின் தளம்.',
    s3t: 'கேளுங்கள்.', s3e: 'உங்கள் மொழியில்.',
    s3d: 'என் வதிவு அனுமதியைப் புதுப்பிக்க வேண்டும்: எங்கிருந்து தொடங்குவது?',
    s3r: 'காலாவதியாகும் 60 நாட்களுக்கு முன்பே விண்ணப்பிக்கலாம். ஆவணப் பட்டியலை நான் தயார் செய்கிறேன்.',
    s4t: 'எல்லாம்', s4e: 'தெளிவு.',
    s4l: ['வரிக் குறியீடு', 'வதிவு அனுமதி', 'SPID மற்றும் வதிவிடம்', 'வேலை மற்றும் ஊதியச் சீட்டு', 'குடியுரிமை'],
    s4b: 'படிப்படியான வழிகாட்டிகள்',
    s5t: 'பாதுகாப்பாக,', s5e: 'எப்போதும்.',
    s5s: 'தனிப்பட்ட ஆவணக் காப்பகம், ஒவ்வொரு காலக்கெடுவுக்கும் முன் தானியங்கு நினைவூட்டல்கள்.',
    s5f: 'வதிவு_அனுமதி_2026.pdf', s5n: '74 நாட்களில் காலாவதியாகும்',
    s6t: 'நீங்கள் ஒருபோதும்', s6e: 'தனியாக இல்லை.',
    s6n: [['9', 'பயணத்தின் கட்டங்கள்'], ['10', 'நடைமுறை வழிகாட்டிகள்'], ['40', 'கருவிகளும் சேவைகளும்'], ['4', 'மொழிகள்']],
    s7s: 'இத்தாலி முழுவதும், எளிமையாக விளக்கப்பட்டது.', s7b: 'இலவசமாகப் பதிவு செய்க',
    s7n: '100% இலவசம் · கடன் அட்டை தேவையில்லை',
  },
};

/* ── La sequenza: apertura e chiusura di ogni scena, in secondi ────────── */
const SCENE = [
  { id: 's1', da: 0.0, a: 5.6, buio: true },
  { id: 's2', da: 5.6, a: 11.4, buio: true },
  { id: 's3', da: 11.4, a: 17.6, buio: false },
  { id: 's4', da: 17.6, a: 23.6, buio: false },
  { id: 's5', da: 23.6, a: 29.2, buio: true },
  { id: 's6', da: 29.2, a: 35.0, buio: false },
  { id: 's7', da: 35.0, a: 41.0, buio: true },
];
const DURATA = SCENE[SCENE.length - 1].a;

/* ── I font ───────────────────────────────────────────────────────────── */
// Fontshare non pubblica indirizzi stabili per i singoli file: si chiede il
// foglio di stile, come fa ogni pagina del sito, e da lì si prendono i woff2.
const FONT_SITO = 'https://api.fontshare.com/v2/css?f[]=clash-grotesk@600,700&f[]=satoshi@500,700&display=swap';
const FONT_NOTO = {
  si: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;700&display=swap',
  ta: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;700&display=swap',
};

async function scarica(url, dove) {
  if (existsSync(dove)) return readFileSync(dove);
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36' } });
  if (!r.ok) throw new Error('font non scaricato: ' + url + ' → ' + r.status);
  const b = Buffer.from(await r.arrayBuffer());
  writeFileSync(dove, b);
  return b;
}

async function raccogliFont() {
  mkdirSync(CACHE, { recursive: true });
  const pezzi = [];
  // I font del sito, quelli che si vedono su ogni pagina
  const cssSito = (await scarica(FONT_SITO, path.join(CACHE, 'fontshare.css'))).toString();
  const blocchi = [...cssSito.matchAll(/@font-face\s*{[^}]*}/g)].map((m) => m[0]);
  for (const blocco of blocchi) {
    const fam = (blocco.match(/font-family:\s*['"]?([^;'"]+)/) || [])[1];
    const peso = (blocco.match(/font-weight:\s*(\d+)/) || [])[1];
    // fontshare scrive indirizzi senza protocollo e fra apici
    let url = (blocco.match(/url\(['"]?((?:https:)?\/\/[^'")]+\.woff2)['"]?\)/) || [])[1];
    if (url && url.startsWith('//')) url = 'https:' + url;
    if (!fam || !peso || !url) continue;
    if (!/Clash Grotesk|Satoshi/i.test(fam) || !['500', '600', '700'].includes(peso)) continue;
    const b = await scarica(url, path.join(CACHE, `${fam.replace(/\s+/g, '')}-${peso}.woff2`));
    pezzi.push(`@font-face{font-family:'${fam.trim()}';font-weight:${peso};font-display:block;src:url(data:font/woff2;base64,${b.toString('base64')}) format('woff2')}`);
  }
  if (!pezzi.length) throw new Error('nessun font del sito scaricato da fontshare');
  // Singalese e tamil: il primo blocco del CSS di Google è il sottoinsieme
  // della scrittura, ed è l'unico che serve.
  for (const [lg, url] of Object.entries(FONT_NOTO)) {
    const css = (await scarica(url, path.join(CACHE, `noto-${lg}.css`))).toString();
    const urls = [...css.matchAll(/https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2/g)].map((m) => m[0]);
    const fam = lg === 'si' ? 'Noto Sans Sinhala' : 'Noto Sans Tamil';
    for (let i = 0; i < Math.min(2, urls.length); i++) {
      const b = await scarica(urls[i], path.join(CACHE, `noto-${lg}-${i}.woff2`));
      pezzi.push(`@font-face{font-family:'${fam}';font-weight:400;font-display:block;src:url(data:font/woff2;base64,${b.toString('base64')}) format('woff2')}`);
      pezzi.push(`@font-face{font-family:'${fam}';font-weight:700;font-display:block;src:url(data:font/woff2;base64,${b.toString('base64')}) format('woff2')}`);
    }
  }
  return pezzi.join('\n');
}

/* ── La pagina ────────────────────────────────────────────────────────── */
function pagina(font, t, lg) {
  const q = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const scritturaLocale = lg === 'si' ? `'Noto Sans Sinhala',` : lg === 'ta' ? `'Noto Sans Tamil',` : '';
  const css = `
${font}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${L}px;height:${A}px;overflow:hidden;background:#0f0d0b}
body{font-family:${scritturaLocale}'Satoshi',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.scena{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0 96px;opacity:0}
.scena.chiaro{background:#faf7f2}
.scena.scuro{background:radial-gradient(120% 90% at 62% 18%,#241d16 0%,#12100d 62%,#0b0a08 100%)}
h1,h2,.num,.marchio{font-family:${scritturaLocale}'Clash Grotesk',system-ui,sans-serif;font-weight:700;letter-spacing:-.025em;line-height:1.04}
.chiaro h1,.chiaro h2{color:#1b1815}
.scuro h1,.scuro h2{color:#fdfbf7}
em{font-style:normal;color:#c2a15e}
.chiaro em{color:#9a7b3c}
.sotto{margin-top:20px;font-size:20px;line-height:1.5;font-weight:400;max-width:44ch}
.scuro .sotto{color:#b9aa96}
.chiaro .sotto{color:#5d5548}
.due{display:flex;align-items:center;gap:64px;width:100%;max-width:1088px}
.due .testo{flex:0 0 40%}
.due .figura{flex:1 1 auto;display:flex;justify-content:center}
/* mattoncini dell'interfaccia, ridisegnati: non sono screenshot */
.scheda{background:#fff;border:1px solid rgba(28,24,20,.1);border-radius:20px;
  box-shadow:0 26px 70px rgba(24,20,16,.16);padding:22px 24px;width:100%;max-width:520px}
.scuro .scheda{background:#1b1713;border-color:rgba(255,255,255,.09);box-shadow:0 26px 70px rgba(0,0,0,.5)}
.capo{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:700;color:#8a7f70;margin-bottom:16px}
.pallino{width:9px;height:9px;border-radius:50%;background:#3fbf7f}
.bolla{border-radius:16px;padding:13px 16px;font-size:16px;line-height:1.5;margin-bottom:11px;max-width:88%}
.bolla.mia{background:#c2a15e;color:#221b10;margin-left:auto;border-bottom-right-radius:5px}
.bolla.sua{background:#f3efe8;color:#231f1a;border-bottom-left-radius:5px}
.scuro .bolla.sua{background:#272119;color:#eee6da}
.voce{display:flex;align-items:center;gap:11px;font-size:17px;color:#2a251f;padding:9px 0;
  border-bottom:1px solid rgba(28,24,20,.07)}
.voce:last-child{border-bottom:0}
.spunta{width:21px;height:21px;border-radius:50%;background:#e8f5ee;color:#1f8f5c;flex:0 0 auto;
  display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.targa{display:inline-flex;align-items:center;gap:7px;background:#f6efdf;color:#7a6026;
  border-radius:99px;padding:6px 14px;font-size:13px;font-weight:700;margin-bottom:14px}
.file{display:flex;align-items:center;gap:13px}
.file .ico{width:40px;height:40px;border-radius:11px;background:#f3efe8;display:flex;
  align-items:center;justify-content:center;font-size:19px}
.scuro .file .ico{background:#272119}
.file .nome{font-size:15px;font-weight:700;color:#eee6da}
.file .quando{font-size:13px;color:#9d9083;margin-top:2px}
.numeri{display:grid;grid-template-columns:1fr 1fr;gap:26px 44px}
.num{font-size:58px;color:#1b1815}
.eti{font-size:15px;color:#5d5548;margin-top:2px}
.marchio{font-size:44px;color:#fdfbf7;margin-top:20px}
.bottone{display:inline-block;margin-top:26px;background:#c2a15e;color:#211a10;
  border-radius:99px;padding:15px 38px;font-size:19px;font-weight:700}
.minuta{margin-top:14px;font-size:14px;color:#8d8175}
.logo{width:96px;height:96px;object-fit:contain}
.centro{text-align:center;display:flex;flex-direction:column;align-items:center}
</style>`;

  const d = T[lg];
  const scene = `
<div class="scena scuro" id="s1"><div class="centro">
  <h1 style="font-size:74px" id="s1a">${q(d.s1a)}</h1>
  <h1 style="font-size:56px;margin-top:26px" id="s1b"><em>${q(d.s1b)}</em></h1>
</div></div>

<div class="scena scuro" id="s2"><div class="centro">
  <h1 style="font-size:86px">${q(d.s2t)}<br><em>${q(d.s2e)}</em></h1>
  <p class="sotto" style="text-align:center">${q(d.s2s)}</p>
</div></div>

<div class="scena chiaro" id="s3"><div class="due">
  <div class="testo"><h2 style="font-size:66px">${q(d.s3t)}<br><em>${q(d.s3e)}</em></h2></div>
  <div class="figura"><div class="scheda" id="s3c">
    <div class="capo"><span class="pallino"></span>Consigliere AI</div>
    <div class="bolla mia">${q(d.s3d)}</div>
    <div class="bolla sua" id="s3r">${q(d.s3r)}</div>
  </div></div>
</div></div>

<div class="scena chiaro" id="s4"><div class="due">
  <div class="testo"><h2 style="font-size:66px">${q(d.s4t)}<br><em>${q(d.s4e)}</em></h2></div>
  <div class="figura"><div class="scheda" id="s4c">
    <span class="targa">✦ ${q(d.s4b)}</span>
    ${d.s4l.map((v, i) => `<div class="voce" data-v="${i}"><span class="spunta">✓</span>${q(v)}</div>`).join('')}
  </div></div>
</div></div>

<div class="scena scuro" id="s5"><div class="due">
  <div class="testo">
    <h2 style="font-size:66px">${q(d.s5t)}<br><em>${q(d.s5e)}</em></h2>
    <p class="sotto">${q(d.s5s)}</p>
  </div>
  <div class="figura"><div class="scheda" id="s5c" style="max-width:440px">
    <div class="file"><span class="ico">📄</span><div>
      <div class="nome" data-no-tr>${q(d.s5f)}</div>
      <div class="quando">${q(d.s5n)}</div>
    </div></div>
  </div></div>
</div></div>

<div class="scena chiaro" id="s6"><div class="due">
  <div class="testo"><h2 style="font-size:66px">${q(d.s6t)}<br><em>${q(d.s6e)}</em></h2></div>
  <div class="figura"><div class="numeri" id="s6c">
    ${d.s6n.map(([n, e], i) => `<div data-n="${i}"><div class="num">${q(n)}</div><div class="eti">${q(e)}</div></div>`).join('')}
  </div></div>
</div></div>

<div class="scena scuro" id="s7"><div class="centro">
  <img class="logo" src="LOGO" alt=""/>
  <div class="marchio">Easy <em>Italia</em> Hub</div>
  <p class="sotto" style="text-align:center">${q(d.s7s)}</p>
  <div class="bottone">${q(d.s7b)}</div>
  <p class="minuta">${q(d.s7n)}</p>
</div></div>`;

  return `<style>${css}${scene}`;
}

/* Lo stato della pagina al secondo `t`. Gira dentro il browser. */
const DISEGNA = `
window.disegna = function (t, SCENE) {
  var lisc = function (x) { return x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3); };
  var dentro = function (t, da, dur) { return lisc((t - da) / dur); };
  SCENE.forEach(function (s) {
    var el = document.getElementById(s.id);
    var attiva = t >= s.da && t < s.a;
    // dissolvenza in entrata e in uscita, mezzo secondo per parte
    var e = dentro(t, s.da, 0.5), u = 1 - dentro(t, s.a - 0.5, 0.5);
    el.style.opacity = attiva ? Math.min(e, u) : 0;
    if (!attiva) { el.style.visibility = 'hidden'; return; }
    el.style.visibility = 'visible';
    var r = t - s.da;               // tempo dentro la scena
    var su = function (n, ritardo, spostamento) {
      if (!n) return;
      var p = dentro(r, ritardo, 0.7);
      n.style.opacity = p;
      n.style.transform = 'translateY(' + ((1 - p) * (spostamento == null ? 26 : spostamento)) + 'px)';
    };
    if (s.id === 's1') { su(document.getElementById('s1a'), 0.2); su(document.getElementById('s1b'), 1.9); }
    if (s.id === 's3') { su(document.getElementById('s3c'), 0.5, 34); su(document.getElementById('s3r'), 2.0, 14); }
    if (s.id === 's4') {
      su(document.getElementById('s4c'), 0.4, 34);
      document.querySelectorAll('#s4c .voce').forEach(function (v, i) { su(v, 0.9 + i * 0.32, 12); });
    }
    if (s.id === 's5') su(document.getElementById('s5c'), 0.6, 30);
    if (s.id === 's6') document.querySelectorAll('#s6c [data-n]').forEach(function (v, i) { su(v, 0.4 + i * 0.28, 20); });
  });
};`;

/* ── Il montaggio ─────────────────────────────────────────────────────── */
async function montaLingua(browser, lg, font, logo) {
  const pag = await browser.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 });
  await pag.setContent(pagina(font, 0, lg).replace('LOGO', logo));
  await pag.addScriptTag({ content: DISEGNA });
  await pag.evaluate(() => document.fonts.ready);
  await pag.waitForTimeout(400);

  const mp4 = path.join(USCITA, `signup-demo.${lg}.mp4`);
  const ff = spawn(FF, [
    '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '25',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', mp4,
  ]);
  ff.stderr.on('data', (b) => process.stderr.write(b));

  const fine = new Promise((ok, ko) => {
    ff.on('close', (c) => (c === 0 ? ok() : ko(new Error('ffmpeg è uscito con ' + c))));
  });

  const totale = Math.round(DURATA * FPS);
  for (let i = 0; i < totale; i++) {
    await pag.evaluate(([t, s]) => window.disegna(t, s), [i / FPS, SCENE]);
    const buf = await pag.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 120 === 0) process.stdout.write(`  ${lg}: ${i}/${totale}\r`);
  }
  ff.stdin.end();
  await fine;
  await pag.close();

  // Il webm serve ai browser che lo preferiscono: si ricava dall'mp4, così i
  // due file mostrano esattamente gli stessi fotogrammi.
  const webm = path.join(USCITA, `signup-demo.${lg}.webm`);
  await new Promise((ok, ko) => {
    const p = spawn(FF, ['-v', 'error', '-i', mp4, '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0',
      '-row-mt', '1', '-deadline', 'good', '-cpu-used', '3', '-an', '-y', webm]);
    p.stderr.on('data', (b) => process.stderr.write(b));
    p.on('close', (c) => (c === 0 ? ok() : ko(new Error('ffmpeg webm è uscito con ' + c))));
  });
  console.log(`  ${lg}: fatto`);
}

const lingue = process.argv.slice(2).filter((a) => T[a]);
const scelte = lingue.length ? lingue : Object.keys(T);
mkdirSync(USCITA, { recursive: true });
const font = await raccogliFont();
const logo = 'data:image/webp;base64,' + readFileSync(path.join(RADICE, 'assets', 'img', 'logo-symbol.webp')).toString('base64');
const browser = await chromium.launch();
for (const lg of scelte) await montaLingua(browser, lg, font, logo);
await browser.close();
console.log('video montati in assets/video/');
