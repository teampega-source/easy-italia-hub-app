// ---------------------------------------------------------------------------
// placeholderTextures.ts — texture PROCEDURALI di fallback (nessun binario, nessuna rete).
//
// L'intro carica prima le immagini reali in /public/parallax/. Se un file manca
// (es. in preview prima di aver generato gli asset), si genera al volo una
// texture placeholder via <canvas> così lo shader/il parallax restano dimostrabili.
// Le depth map placeholder sono gradienti radiali/lineari coerenti col concept.
//
// SOSTITUZIONE ASSET REALI: basta mettere i file in /public/parallax/ coi nomi
// della naming convention (vedi public/parallax/README.md) e i placeholder non
// vengono più usati.
// ---------------------------------------------------------------------------

const W = 1376;
const H = 768;

function canvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return [c, c.getContext('2d')!];
}

// Sfondo golden-hour + qualche forma per dare "soggetto" al parallax.
export function makeColorPlaceholder(index: number): HTMLCanvasElement {
  const [c, ctx] = canvas();

  const skies: [string, string, string][] = [
    ['#123', '#2a6f5a', '#e8c07a'], // Sri Lanka: colline → cielo caldo
    ['#0b1e3a', '#4a6a9a', '#f0d59a'], // nuvole: blu → oro all'orizzonte
    ['#241016', '#7a3b2e', '#f2c766'], // discesa Italia: terra scura → cielo oro
  ];
  const [top, mid, bottom] = skies[index] || skies[0];

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Sole/foschia caldo verso l'orizzonte
  const sun = ctx.createRadialGradient(W * 0.5, H * 0.62, 10, W * 0.5, H * 0.62, W * 0.5);
  sun.addColorStop(0, 'rgba(255,220,150,0.55)');
  sun.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);

  // Soggetti stilizzati (colline / nuvole / skyline) per rendere visibile la profondità
  ctx.globalAlpha = 0.9;
  if (index === 0) {
    hills(ctx, ['#0d3b2e', '#155a43', '#1e7a58'], 0.55);
  } else if (index === 1) {
    clouds(ctx);
  } else {
    skyline(ctx);
  }
  ctx.globalAlpha = 1;

  // Foschia atmosferica sull'orizzonte: dà profondità aerea (lontano = più lattiginoso).
  haze(ctx);
  // Grana filmica sottile: rompe le bande dei gradienti, look cinematografico.
  grain(ctx, 0.05);

  // Tag discreto (l'intro carica le foto reali appena presenti in /public/parallax/).
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('anteprima · scena ' + (index + 1), 22, 34);

  return c;
}

// Banda di foschia calda sull'orizzonte (prospettiva aerea).
function haze(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, H * 0.4, 0, H * 0.72);
  g.addColorStop(0, 'rgba(255,235,200,0)');
  g.addColorStop(0.5, 'rgba(255,232,196,0.22)');
  g.addColorStop(1, 'rgba(255,235,200,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, H * 0.4, W, H * 0.32);
}

// Grana monocromatica leggera via ImageData (deterministica per frame, low-cost).
function grain(ctx: CanvasRenderingContext2D, amount: number) {
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 255 * amount;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

// Depth map: bianco = vicino (in basso/primo piano), nero = lontano (orizzonte).
export function makeDepthPlaceholder(index: number): HTMLCanvasElement {
  const [c, ctx] = canvas();

  // Base: gradiente verticale (orizzonte lontano in alto, primo piano vicino in basso).
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a0a0a');
  g.addColorStop(0.55, '#5a5a5a');
  g.addColorStop(1, '#f2f2f2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Soggetti in primo piano più "vicini" (più chiari)
  ctx.globalCompositeOperation = 'lighter';
  if (index === 2) {
    // skyline: blocchi verticali chiari nel piano medio/vicino
    ctx.fillStyle = 'rgba(180,180,180,0.9)';
    for (let i = 0; i < 6; i++) {
      const x = W * (0.15 + i * 0.12);
      ctx.fillRect(x, H * 0.55, W * 0.06, H * 0.45);
    }
  }
  ctx.globalCompositeOperation = 'source-over';

  return c;
}

function hills(ctx: CanvasRenderingContext2D, colors: string[], baseY: number) {
  colors.forEach((col, i) => {
    const y = H * (baseY + i * 0.14);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 40) {
      ctx.lineTo(x, y + Math.sin((x / W) * Math.PI * (2 + i)) * 24 * (i + 1));
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
  });
}

function clouds(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(255,245,230,0.85)';
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * W;
    const y = H * (0.45 + Math.random() * 0.5);
    const r = 40 + Math.random() * 90;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.6, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // sagoma "Italia" lontana all'orizzonte
  ctx.fillStyle = 'rgba(40,60,90,0.5)';
  ctx.fillRect(W * 0.42, H * 0.4, W * 0.16, H * 0.03);
}

function skyline(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(30,18,20,0.85)';
  for (let i = 0; i < 6; i++) {
    const x = W * (0.15 + i * 0.12);
    ctx.fillRect(x, H * 0.55, W * 0.06, H * 0.45);
  }
  // "pista" con luci in primo piano
  ctx.strokeStyle = 'rgba(255,210,120,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W * 0.35, H);
  ctx.lineTo(W * 0.48, H * 0.7);
  ctx.moveTo(W * 0.65, H);
  ctx.lineTo(W * 0.52, H * 0.7);
  ctx.stroke();
}
