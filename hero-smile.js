// Hero smile: the joke® smiley loops between a dot-matrix "digital" version and the spray-painted logo.
// The digital pixels are sampled from the logo itself; the spray state reveals the real logo artwork
// through a mask painted with spray.js strokes. Draws into <canvas id="hero-smile">.
(() => {
  const cv = document.getElementById('hero-smile');
  if (!cv) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const p = (t, s, d) => clamp((t - s) / d);
  const eo = x => 1 - Math.pow(1 - x, 3);
  const rand = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // Loop timeline (s)
  const MASK = .4;
  const LOOP = 8, BOOT = 0, BLINK = 1.8, SPRAY = 2.6, OUT = 6.9;
  // Logo artwork geometry in its own pixels (uploads/opt/joke-smile.webp is 724×837).
  const LW = 724, LH = 837, RING = { x: 362, y: 372, r: 313 };
  const EYES = [[258, 150, 318], [430, 142, 330]];
  const MOUTH = [[172, 400], [262, 548], [462, 566], [552, 372]];
  const DRIPS = [[210, 690, 748], [287, 690, 832], [172, 430, 482], [557, 430, 498], [437, 320, 372]];

  const img = new Image();
  img.src = 'uploads/opt/joke-smile.webp';
  const layer = document.createElement('canvas'), mask = document.createElement('canvas');
  let W, H, dpr, k, ox, oy, bx, by, bw, bh, cell, pixels, paint, sprayEnd, raf = 0, start = 0, visible = true, sprite, cached = false;

  function layout() {
    const box = cv.parentElement.getBoundingClientRect();
    W = box.width; H = box.height; dpr = Math.min(1.5, devicePixelRatio || 1);
    const mobile = W <= 768;
    const cx = mobile ? W * .5 : W * .7, cy = mobile ? H * .3 : H * .47;
    const h = mobile ? Math.min(W * .78, H * .42) : Math.min(H * .72, W * .42);
    k = h / LH; ox = cx - LW / 2 * k; oy = cy - LH / 2 * k;
    // the canvas only covers the smile (plus room for glitch offsets), not the whole hero
    const pad = 110; bx = ox - pad; by = oy - pad; bw = LW * k + 2 * pad; bh = LH * k + 2 * pad;
    Object.assign(cv.style, { inset: 'auto', left: bx + 'px', top: by + 'px', width: bw + 'px', height: bh + 'px' });
    cv.width = layer.width = Math.round(bw * dpr); cv.height = layer.height = Math.round(bh * dpr);
    // coverage only, so the mask can be coarse: the logo's own edges come from the artwork
    mask.width = Math.round(bw * MASK); mask.height = Math.round(bh * MASK);

    // sample the artwork onto a dot-matrix grid
    const step = 24, s = document.createElement('canvas');
    s.width = Math.ceil(LW / step); s.height = Math.ceil(LH / step);
    const sc = s.getContext('2d'); sc.drawImage(img, 0, 0, s.width, s.height);
    const data = sc.getImageData(0, 0, s.width, s.height).data, r = rand(7);
    cell = step * k; pixels = [];
    // one pre-rendered glowing pixel, stamped with drawImage instead of per-pixel shadowBlur
    const g = Math.ceil(cell * 2.2); sprite = document.createElement('canvas'); sprite.width = sprite.height = Math.ceil(g * dpr);
    const sp = sprite.getContext('2d'); sp.scale(dpr, dpr); sp.fillStyle = '#F8F7F3'; sp.shadowColor = 'rgba(248,247,243,.55)'; sp.shadowBlur = cell * .6;
    sp.fillRect(g / 2 - cell * .32, g / 2 - cell * .32, cell * .64, cell * .64); sprite._g = g; cached = false;
    for (let gy = 0; gy < s.height; gy++) for (let gx = 0; gx < s.width; gx++) {
      const lx = (gx + .5) * step, ly = (gy + .5) * step;
      if (Math.hypot(lx - RING.x, ly - RING.y) > RING.r * 1.18 && ly < LH * .8) continue;
      const a = data[(gy * s.width + gx) * 4 + 3] / 255;
      const eye = EYES.some(([ex, y0, y1]) => Math.abs(lx - ex) < 40 && ly > y0 - 10 && ly < y1 + 10);
      pixels.push({ x: ox + lx * k, y: oy + ly * k, on: a > .38, eye, t: r() * .8, off: r() * 1.0, jx: r() - .5, row: gy });
    }

    // reveal mask: flat spray passes along the artwork's own strokes
    const { Paint, bez } = window.JokeSpray, P = new Paint(), L = (x, y) => [ox + x * k, oy + y * k];
    const ring = [];
    for (let i = 0; i <= 120; i++) { const a = -2.1 + i / 120 * Math.PI * 2.1; ring.push(L(RING.x + Math.cos(a) * RING.r, RING.y + Math.sin(a) * RING.r)); }
    P.stroke(ring, { w: 140 * k, t0: SPRAY, dur: .55, seed: 3, flat: true });
    EYES.forEach(([ex, y0, y1], i) => P.stroke([L(ex, y0 - 20), L(ex, y1 + 10)], { w: 92 * k, t0: SPRAY + .58 + i * .14, dur: .14, seed: 5 + i, flat: true }));
    P.stroke(bez(L(...MOUTH[0]), L(...MOUTH[1]), L(...MOUTH[2]), L(...MOUTH[3]), 60).concat([L(560, 360)]), { w: 108 * k, t0: SPRAY + .9, dur: .36, seed: 9, flat: true });
    DRIPS.forEach(([x, y0, y1], i) => P.stroke([L(x, y0 - 20), L(x, y1 + 12)], { w: 46 * k, t0: SPRAY + 1.22 + i * .07, dur: .5, seed: 20 + i, flat: true }));
    paint = P; sprayEnd = P.end;
  }

  function frame(T) {
    const t = reduce ? SPRAY + 3 : T;
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
    c.setTransform(dpr, 0, 0, dpr, -bx * dpr, -by * dpr);

    // ---- digital pixels: boot, blink, dissolve under the spray, reboot after the glitch-out
    const glitch = (t > SPRAY - .2 && t < SPRAY + 1.2) || t > OUT;
    const s = cell * .64;
    if (t < sprayEnd + .1) {
      const blink = t > BLINK && t < BLINK + .15;
      for (const px of pixels) {
        const gone = p(t, SPRAY + px.off, .2);
        if (gone >= 1) continue;
        let x = px.x;
        if (glitch) x += px.jx * cell * 4 * Math.max(0, Math.sin(t * 38 + px.row * 1.7)) * (1 - gone);
        c.globalAlpha = .06 * (1 - gone); c.fillStyle = '#F8F7F3';
        c.fillRect(x - s / 4, px.y - s / 4, s / 2, s / 2);
        const shown = px.on && !(blink && px.eye) ? eo(p(t, BOOT + px.t, .14)) * (1 - gone) : 0;
        if (shown > 0) { c.globalAlpha = shown; c.drawImage(sprite, x - sprite._g / 2, px.y - sprite._g / 2, sprite._g, sprite._g); }
      }
      c.globalAlpha = 1;
      const scan = 1 - p(t, SPRAY + .2, .8);
      if (scan > 0) { c.globalAlpha = .07 * scan; c.fillStyle = '#000'; for (let y = oy; y < oy + LH * k; y += 4) c.fillRect(ox - cell, y, LW * k + 2 * cell, 2); c.globalAlpha = 1; }
    }

    // ---- spray: the logo shows through wherever the can has passed
    if (t < SPRAY) cached = false;
    if (t >= SPRAY) {
      // once the can is done the composite never changes, so build it once per loop
      if (!(cached && t > sprayEnd)) {
        const m = mask.getContext('2d');
        m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, mask.width, mask.height);
        m.setTransform(MASK, 0, 0, MASK, -bx * MASK, -by * MASK);
        paint.draw(m, t, true);
        const l = layer.getContext('2d');
        l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, layer.width, layer.height);
        l.setTransform(dpr, 0, 0, dpr, -bx * dpr, -by * dpr);
        l.drawImage(img, ox, oy, LW * k, LH * k);
        l.globalCompositeOperation = 'destination-in'; l.setTransform(1, 0, 0, 1, 0, 0); l.drawImage(mask, 0, 0, layer.width, layer.height);
        cached = t > sprayEnd;
      }
      c.setTransform(1, 0, 0, 1, 0, 0);
      // overspray haze while painting
      const haze = .14 * (1 - p(t, sprayEnd, .6));
      if (haze > 0) { c.globalAlpha = haze; c.drawImage(mask, 0, 0, cv.width, cv.height); c.globalAlpha = 1; }
      if (t > OUT) {
        // glitch-out: slice the painted logo sideways while it fades, then the loop reboots
        const g = p(t, OUT, LOOP - OUT), slices = 14, sh = layer.height / slices, r = rand(Math.floor(t * 24));
        c.globalAlpha = 1 - eo(g);
        for (let i = 0; i < slices; i++) c.drawImage(layer, 0, i * sh, layer.width, sh, (r() - .5) * 90 * dpr * g * 2, i * sh, layer.width, sh);
        c.globalAlpha = 1;
      } else c.drawImage(layer, 0, 0);
    }
  }

  // Holds where nothing moves: draw once on entry, then skip frames until the next phase.
  let lastHold = null;
  const holdOf = t => t > 1.05 && t < BLINK ? 'd1' : t > BLINK + .2 && t < SPRAY - .2 ? 'd2' : t > sprayEnd + .7 && t < OUT ? 's' : null;
  function loop(now) {
    if (!visible) { raf = 0; return; }
    const t = ((now - start) / 1000) % LOOP, hold = holdOf(t);
    if (!hold || hold !== lastHold) frame(t);
    lastHold = hold;
    if (!reduce) raf = requestAnimationFrame(loop);
  }
  function run() {
    layout(); start = performance.now(); lastHold = null;
    raf = requestAnimationFrame(loop);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(cv);
  }
  addEventListener('resize', () => { if (img.complete && window.JokeSpray) { layout(); if (reduce) frame(0); } });
  const ready = () => (window.JokeSpray && img.complete && img.naturalWidth) ? run() : setTimeout(ready, 30);
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', ready) : ready();
})();
