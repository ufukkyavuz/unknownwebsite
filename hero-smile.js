// Hero smile: boots up as a dot-matrix "digital" smiley, then glitches apart while the same face
// gets spray-painted over it in green. Draws into <canvas id="hero-smile">; needs spray.js (window.JokeSpray).
(() => {
  const cv = document.getElementById('hero-smile');
  if (!cv) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const p = (t, s, d) => clamp((t - s) / d);
  const eo = x => 1 - Math.pow(1 - x, 3);
  const rand = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // Timeline (s): pixels boot, blink once, then the spray takes over.
  const BOOT = 0.25, BLINK = 2.0, SPRAY = 2.9;
  let W, H, dpr, cx, cy, R, cell, pixels, paint, raf = 0, start = 0;

  // Smiley shape test in face-local units (radius 1).
  function lit(x, y) {
    const d = Math.hypot(x, y);
    if (Math.abs(d - .9) < .085) return 'ring';
    for (const ex of [-.34, .34]) if (((x - ex) / .1) ** 2 + ((y + .26) / .17) ** 2 < 1) return 'eye';
    const md = Math.hypot(x, y - .02), a = Math.atan2(y - .02, x);
    if (Math.abs(md - .52) < .075 && a > .38 && a < Math.PI - .38) return 'mouth';
    return null;
  }

  function layout() {
    const box = cv.parentElement.getBoundingClientRect();
    W = box.width; H = box.height; dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const mobile = W <= 768;
    cx = mobile ? W * .5 : W * .7; cy = mobile ? H * .3 : H * .47;
    R = mobile ? Math.min(W * .34, H * .2) : Math.min(H * .3, W * .2);
    cell = R / 13;
    const r = rand(7);
    pixels = [];
    for (let gy = -15; gy <= 15; gy++) for (let gx = -15; gx <= 15; gx++) {
      const x = gx / 13, y = gy / 13;
      if (Math.hypot(x, y) > 1.12) continue;
      pixels.push({ x: cx + gx * cell, y: cy + gy * cell, kind: lit(x, y), on: BOOT + r() * .9, off: SPRAY + r() * 1.1, jx: (r() - .5) * 2, row: gy });
    }
    const { Paint, bez } = window.JokeSpray, P = new Paint(), ring = [];
    for (let i = 0; i <= 110; i++) { const a = -2.2 + i / 110 * Math.PI * 2.12; ring.push([cx + Math.cos(a) * R * .9 * (1 + .025 * Math.sin(i * .3)), cy + Math.sin(a) * R * .9]); }
    P.stroke(ring, { w: R * .2, t0: SPRAY, dur: .6, seed: 3 });
    P.splat(cx - R * .34, cy - R * .26, R * .2, { t0: SPRAY + .62, dur: .18, seed: 5 });
    P.splat(cx + R * .34, cy - R * .26, R * .2, { t0: SPRAY + .74, dur: .18, seed: 6 });
    const mouth = bez([cx - R * .52, cy + R * .12], [cx - R * .3, cy + R * .62], [cx + R * .32, cy + R * .64], [cx + R * .56, cy + R * .1], 60);
    P.stroke(mouth, { w: R * .17, t0: SPRAY + .88, dur: .45, seed: 9 });
    P.drip(mouth[18][0], mouth[18][1] + R * .03, R * .2, { w: R * .06, t0: SPRAY + 1.2, dur: .9 });
    P.drip(mouth[40][0], mouth[40][1] + R * .03, R * .12, { w: R * .045, t0: SPRAY + 1.28, dur: .8 });
    P.drip(cx - R * .62, cy + R * .6, R * .14, { w: R * .06, t0: SPRAY + .5, dur: .8 });
    paint = P;
  }

  function frame(t) {
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    const blink = t > BLINK && t < BLINK + .16;
    const glitch = t > SPRAY - .25 && t < SPRAY + 1.3;
    const s = cell * .62;
    for (const px of pixels) {
      const gone = p(t, px.off, .18);
      if (gone >= 1) continue;
      let x = px.x, y = px.y;
      if (glitch) x += px.jx * cell * 3 * Math.max(0, Math.sin(t * 40 + px.row)) * (1 - gone);
      const shown = px.kind && !(blink && px.kind === 'eye') ? eo(p(t, px.on, .12)) : 0;
      // unlit grid dot
      c.globalAlpha = .07 * (1 - gone); c.fillStyle = '#F8F7F3';
      c.fillRect(x - s / 4, y - s / 4, s / 2, s / 2);
      if (shown > 0) {
        c.globalAlpha = shown * (1 - gone);
        c.shadowColor = 'rgba(248,247,243,.6)'; c.shadowBlur = cell * .6;
        c.fillRect(x - s / 2, y - s / 2, s, s);
        c.shadowBlur = 0;
      }
    }
    c.globalAlpha = 1;
    // faint scanlines over the digital phase
    const scan = 1 - p(t, SPRAY + .3, .8);
    if (scan > 0) { c.globalAlpha = .06 * scan; c.fillStyle = '#000'; for (let y = cy - R * 1.2; y < cy + R * 1.2; y += 4) c.fillRect(cx - R * 1.2, y, R * 2.4, 2); c.globalAlpha = 1; }
    paint.draw(c, t);
  }

  function run() {
    layout();
    if (reduce) { frame(99); return; }
    start = performance.now();
    const end = paint.end + .1;
    const tick = now => { const t = (now - start) / 1000; frame(t); if (t < end) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  }
  addEventListener('resize', () => { cancelAnimationFrame(raf); layout(); frame(99); });
  const ready = () => window.JokeSpray ? run() : setTimeout(ready, 30);
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', ready) : ready();
})();
