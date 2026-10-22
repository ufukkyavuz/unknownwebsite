// Green spray-paint accents, painted live on a canvas.
// Mark a target with data-spray="underline|scribble|circle|splat". The canvas goes into the nearest
// [data-spray-host] (or the parent). Options: data-spray-delay (ms) for scroll-in marks;
// data-spray-trigger="<ancestor selector>" paints on hover/tap of that ancestor instead of on scroll-in.
(() => {
  const GREEN = '#CCFF01';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const p = (t, s, d) => clamp((t - s) / d);
  const eo = x => 1 - Math.pow(1 - x, 3);
  const rand = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const gauss = r => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
  const bez = (a, b, c, d, n = 60) => Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n, v = 1 - u;
    return [v*v*v*a[0] + 3*v*v*u*b[0] + 3*v*u*u*c[0] + u*u*u*d[0], v*v*v*a[1] + 3*v*v*u*b[1] + 3*v*u*u*c[1] + u*u*u*d[1]];
  });
  // Width along a stroke: a quick swell where the can starts, then a long taper to a thin tail.
  // Fill passes stay full width and only ease off at the very end.
  const flatTaper = s => s < .9 ? 1 : 1 - (s - .9) * 5;
  const taper = s => s < .06 ? .7 + 5 * s : Math.max(.07, Math.pow(1 - (s - .06) / .94, .6));

  class Paint {
    constructor() { this.items = []; }
    stroke(pts, { w, t0 = 0, dur = .45, seed = 1, flat = false }) {
      // resample to ~1px spacing so the stamped stroke stays solid
      const r = rand(seed), res = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
        for (let k = 1; k <= n; k++) res.push([ax + (bx - ax) * k / n, ay + (by - ay) * k / n]);
      }
      const N = res.length, dots = [];
      res.forEach(([x, y], i) => {
        const s = i / (N - 1), tw = (flat ? flatTaper(s) : taper(s)) * w;
        for (let k = 0; k < 3; k++) { const g = gauss(r) * tw * .42, a = r() * 6.283; dots.push([s, x + Math.cos(a) * g, y + Math.sin(a) * g, (r() * 1.4 + .5) * Math.max(.7, w / 30), r() * .5 + .25]); }
        if (r() < .35) { const g = tw * (.8 + r() * 1.2), a = r() * 6.283; dots.push([s, x + Math.cos(a) * g, y + Math.sin(a) * g, (r() * 1.1 + .4) * Math.max(.7, w / 30), r() * .45 + .15]); }
      });
      this.items.push({ k: 's', pts: res, w, t0, dur, dots, flat });
      return this;
    }
    splat(x, y, R, { t0 = 0, dur = .28, seed = 2 }) {
      const r = rand(seed), dots = [];
      for (let i = 0; i < 1600; i++) { const d = Math.abs(gauss(r)) * R * .5, a = r() * 6.283; dots.push([d / R, x + Math.cos(a) * d, y + Math.sin(a) * d * .9, (r() * 2 + .6) * R / 120, r() * .5 + .35]); }
      for (let i = 0; i < 26; i++) { const d = R * (.55 + r()), a = r() * 6.283; dots.push([d / R / 1.8, x + Math.cos(a) * d, y + Math.sin(a) * d, (r() * 6 + 2.5) * R / 120, 1]); }
      this.items.push({ k: 'p', x, y, R, t0, dur, dots });
      return this;
    }
    wash(x, y, w, h, { t0 = 0, dur = .3 }) { this.items.push({ k: 'w', x, y, w, h, t0, dur }); return this; }
    drip(x, y, len, { w, t0 = 0, dur = .8 }) { this.items.push({ k: 'd', x, y, len, w, t0, dur }); return this; }
    get end() { return Math.max(...this.items.map(i => i.t0 + i.dur)); }
    draw(c, t) {
      c.fillStyle = GREEN;
      for (const it of this.items) {
        const pr = p(t, it.t0, it.dur); if (pr <= 0) continue;
        if (it.k === 's') {
          const e = eo(pr), last = Math.floor(e * (it.pts.length - 1));
          const stamp = (scale) => { c.beginPath(); for (let i = 0; i <= last; i++) { const [x, y] = it.pts[i], rr = (it.flat ? flatTaper : taper)(i / (it.pts.length - 1)) * it.w * .5 * scale; c.moveTo(x + rr, y); c.arc(x, y, rr, 0, 6.283); } c.fill(); };
          c.save();
          c.filter = `blur(${it.w * .22}px)`; c.globalAlpha = .45; stamp(1.35);
          c.filter = `blur(${Math.max(.5, it.w * .04)}px)`; c.globalAlpha = 1; stamp(.92);
          c.restore();
          for (const [s, x, y, rr, a] of it.dots) { if (s > e) continue; c.globalAlpha = a; c.fillRect(x - rr / 2, y - rr / 2, rr, rr); }
          c.globalAlpha = 1;
        } else if (it.k === 'w') {
          c.globalAlpha = eo(pr); c.fillRect(it.x, it.y, it.w, it.h); c.globalAlpha = 1;
        } else if (it.k === 'p') {
          const e = eo(pr);
          c.save(); c.filter = `blur(${it.R * .1}px)`; c.globalAlpha = .95; c.beginPath(); c.ellipse(it.x, it.y, it.R * .48 * e, it.R * .42 * e, .3, 0, 7); c.fill(); c.restore();
          for (const [s, x, y, rr, a] of it.dots) { if (s > e * 1.05) continue; c.globalAlpha = a; c.beginPath(); c.arc(x, y, rr / 2, 0, 7); c.fill(); }
          c.globalAlpha = 1;
        } else {
          const e = 1 - Math.pow(1 - pr, 2.4), L = it.len * e, w = it.w * (1 - .2 * e);
          c.save(); c.filter = 'blur(.5px)'; c.beginPath();
          c.moveTo(it.x - w / 2, it.y); c.lineTo(it.x - w * .3, it.y + L); c.arc(it.x, it.y + L, w * .4 * (1 + .45 * e), Math.PI, 0, true); c.lineTo(it.x + w / 2, it.y); c.closePath(); c.fill();
          c.restore(); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(it.x - w * .2, it.y, Math.max(1, w * .12), L * .85); c.fillStyle = GREEN;
        }
      }
    }
  }

  // Each kind is its own gesture. Coordinates are canvas-local; (bx,by,bw,bh) is the target box.
  function design(kind, bx, by, bw, bh, seed) {
    const r = rand(seed), P = new Paint();
    if (kind === 'underline') {
      // one confident swoosh that flicks up at the tail
      const w = Math.max(10, bh * .26), y = by + bh * 1.0;
      const pts = bez([bx - bw * .02, y + bh * .02], [bx + bw * .35, y - bh * .06], [bx + bw * .78, y + bh * .1], [bx + bw * 1.06, y - bh * .26]);
      P.stroke(pts, { w, dur: .5, seed });
      P.drip(pts[6][0], pts[6][1] + w * .1, bh * (.12 + r() * .1), { w: w * .42, t0: .32 });
      P.drip(pts[22][0], pts[22][1] + w * .05, bh * (.08 + r() * .08), { w: w * .32, t0: .4 });
    } else if (kind === 'scribble') {
      // quick back-and-forth cross-out
      const w = Math.max(7, bh * .15), pts = [], n = 2;
      for (let i = 0; i <= n; i++) {
        const y = by + bh * (.4 + .24 * i / n) + (r() - .5) * bh * .06;
        const xL = bx - bw * .04 + r() * bw * .06, xR = bx + bw * 1.02 - r() * bw * .06;
        const seg = i % 2 ? bez([xR, y], [bx + bw * .66, y - bh * .1], [bx + bw * .33, y + bh * .1], [xL, y], 24)
                          : bez([xL, y], [bx + bw * .33, y - bh * .1], [bx + bw * .66, y + bh * .1], [xR, y], 24);
        pts.push(...seg);
      }
      P.stroke(pts, { w, dur: .6, seed });
      P.drip(pts[8][0], pts[8][1], bh * (.1 + r() * .08), { w: w * .4, t0: .5 });
    } else if (kind === 'fill') {
      // one fat pass sprayed left to right across the whole row, then the paint settles solid
      const w = bh * 1.35, y = by + bh / 2;
      P.stroke(bez([bx - w * .3, y + (r() - .5) * bh * .08], [bx + bw * .35, y + (r() - .5) * bh * .12], [bx + bw * .65, y + (r() - .5) * bh * .12], [bx + bw + w * .3, y], 60),
        { w, dur: .42, seed, flat: true });
      P.wash(bx, by, bw, bh, { t0: .38, dur: .2 });
    } else if (kind === 'circle') {
      // loose ring that overshoots where it closes; no drips
      const w = Math.max(6, bh * .3), cx = bx + bw / 2, cy = by + bh * .55, rx = bw * .66, ry = bh * .95, pts = [];
      for (let i = 0; i <= 90; i++) { const a = -2.4 + i / 90 * Math.PI * 2.18; pts.push([cx + Math.cos(a) * rx * (1 + .05 * Math.sin(i * .21)), cy + Math.sin(a) * ry]); }
      P.stroke(pts, { w, dur: .55, seed });
    } else {
      // Sits a little low-right of the chrome icon so the metal stays readable on top of the paint.
      const R = Math.max(bw, bh) * 1.05, cx = bx + bw * .58, cy = by + bh * .6;
      P.splat(cx, cy, R, { dur: .26, seed });
      P.drip(cx - R * .15, cy + R * .3, R * (.25 + r() * .2), { w: R * .1, t0: .16, dur: .6 });
      P.drip(cx + R * .22, cy + R * .25, R * (.15 + r() * .15), { w: R * .075, t0: .22, dur: .5 });
    }
    return P;
  }

  let seedN = 11;
  function attach(el) {
    const kind = el.dataset.spray, host = el.closest('[data-spray-host]') || el.parentElement;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const behind = kind === 'splat' || kind === 'fill';
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = `position:absolute;pointer-events:none;z-index:${behind ? 0 : 2};transition:opacity 380ms ease`;
    host.insertBefore(cv, behind ? host.firstChild : null);
    if (kind === 'splat') { el.style.position = 'relative'; el.style.zIndex = 1; }
    let seed = seedN++, paint, raf = 0, played = false, dpr = 1;

    function layout() {
      const hr = host.getBoundingClientRect(), er = el.getBoundingClientRect();
      const M = Math.max(er.height, behind ? er.width : 0) * 1.4;
      dpr = Math.min(2, devicePixelRatio || 1);
      const W = er.width + 2 * M, H = er.height + 2.2 * M;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      Object.assign(cv.style, { left: (er.left - hr.left - M) + 'px', top: (er.top - hr.top - M) + 'px', width: W + 'px', height: H + 'px' });
      paint = design(kind, M, M, er.width, er.height, seed);
    }
    function frame(t) {
      const c = cv.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
      paint.draw(c, t);
    }
    function play() {
      played = true; cancelAnimationFrame(raf); cv.style.opacity = 1;
      if (reduce) { frame(99); return; }
      const start = performance.now();
      const tick = now => { const t = (now - start) / 1000; frame(t); if (t < paint.end) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    }
    layout();
    addEventListener('resize', () => { layout(); if (played) frame(99); });

    const trigger = el.dataset.sprayTrigger && el.closest(el.dataset.sprayTrigger);
    if (trigger) {
      // a fresh splat every time, fading out when the pointer leaves
      const fresh = () => { seed = seedN++; layout(); play(); };
      trigger.addEventListener('mouseenter', fresh);
      trigger.addEventListener('mouseleave', () => { cv.style.opacity = 0; });
      trigger.addEventListener('touchstart', fresh, { passive: true });
      return;
    }
    const delay = +(el.dataset.sprayDelay || 0);
    new IntersectionObserver((ents, io) => {
      if (ents.some(e => e.isIntersecting)) { io.disconnect(); setTimeout(play, delay); }
    }, { threshold: .6 }).observe(el);
  }

  const go = () => document.querySelectorAll('[data-spray]').forEach(attach);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => document.readyState === 'loading' ? addEventListener('DOMContentLoaded', go) : go());
})();
