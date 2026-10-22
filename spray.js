// Green spray-paint accents: underlines, strikes and splats with drips, painted live when they scroll into view.
// Mark a target with data-spray="underline|strike|splat"; the canvas goes into the nearest [data-spray-host]
// (or the parent). Optional: data-spray-delay (ms), data-spray-hover (replays on hover of that ancestor selector).
(() => {
  const GREEN = '#B7FF5A';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const p = (t, s, d) => clamp((t - s) / d);
  const eo = x => 1 - Math.pow(1 - x, 4);
  const rand = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const gauss = r => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
  const bez = (a, b, c, d, n = 60) => Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n, v = 1 - u;
    return [v*v*v*a[0] + 3*v*v*u*b[0] + 3*v*u*u*c[0] + u*u*u*d[0], v*v*v*a[1] + 3*v*v*u*b[1] + 3*v*u*u*c[1] + u*u*u*d[1]];
  });

  class Paint {
    constructor() { this.items = []; }
    stroke(pts, { w, t0 = 0, dur = .45, seed = 1 }) {
      const r = rand(seed), len = [0];
      for (let i = 1; i < pts.length; i++) len.push(len[i-1] + Math.hypot(pts[i][0] - pts[i-1][0], pts[i][1] - pts[i-1][1]));
      const L = len[len.length - 1], dots = [];
      const at = d => { let i = 1; while (i < len.length - 1 && len[i] < d) i++; const u = (d - len[i-1]) / ((len[i] - len[i-1]) || 1); const a = pts[i-1], b = pts[i]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; };
      const step = Math.max(.8, w / 22);
      for (let d = 0; d < L; d += step) {
        const [x, y] = at(d);
        for (let k = 0; k < 5; k++) { const g = gauss(r) * w * .5, a = r() * 6.283; dots.push([d / L, x + Math.cos(a) * g, y + Math.sin(a) * g, (r() * 1.6 + .5) * w / 26, r() * .5 + .2]); }
        if (r() < .5) { const g = w * (1 + r() * 1.3), a = r() * 6.283; dots.push([d / L, x + Math.cos(a) * g, y + Math.sin(a) * g, (r() * 1.2 + .4) * w / 26, r() * .5 + .2]); }
      }
      this.items.push({ k: 's', pts, len, L, w, t0, dur, dots });
      return this;
    }
    splat(x, y, R, { t0 = 0, dur = .3, seed = 2 }) {
      const r = rand(seed), dots = [];
      for (let i = 0; i < 1800; i++) { const d = Math.abs(gauss(r)) * R * .5, a = r() * 6.283; dots.push([d / R, x + Math.cos(a) * d, y + Math.sin(a) * d * .9, (r() * 2 + .6) * R / 120, r() * .5 + .35]); }
      for (let i = 0; i < 30; i++) { const d = R * (.55 + r()), a = r() * 6.283; dots.push([d / R / 1.8, x + Math.cos(a) * d, y + Math.sin(a) * d, (r() * 6 + 2.5) * R / 120, 1]); }
      this.items.push({ k: 'p', x, y, R, t0, dur, dots });
      return this;
    }
    drip(x, y, len, { w, t0 = 0, dur = 1 }) { this.items.push({ k: 'd', x, y, len, w, t0, dur }); return this; }
    get end() { return Math.max(...this.items.map(i => i.t0 + i.dur)); }
    draw(c, t) {
      c.fillStyle = GREEN; c.strokeStyle = GREEN;
      for (const it of this.items) {
        const pr = p(t, it.t0, it.dur); if (pr <= 0) continue;
        if (it.k === 's') {
          const e = eo(pr), D = e * it.L;
          const path = () => { c.beginPath(); c.moveTo(it.pts[0][0], it.pts[0][1]); for (let i = 1; i < it.pts.length && it.len[i] <= D; i++) c.lineTo(it.pts[i][0], it.pts[i][1]); };
          c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
          c.filter = `blur(${it.w * .28}px)`; c.globalAlpha = .55; c.lineWidth = it.w * 1.25; path(); c.stroke();
          c.filter = `blur(${Math.max(.6, it.w * .06)}px)`; c.globalAlpha = 1; c.lineWidth = it.w * .8; path(); c.stroke();
          c.restore();
          for (const [s, x, y, rr, a] of it.dots) { if (s > e) continue; c.globalAlpha = a; c.fillRect(x - rr / 2, y - rr / 2, rr, rr); }
          c.globalAlpha = 1;
        } else if (it.k === 'p') {
          const e = eo(pr);
          c.save(); c.filter = `blur(${it.R * .14}px)`; c.globalAlpha = .7; c.beginPath(); c.ellipse(it.x, it.y, it.R * .42 * e, it.R * .38 * e, .3, 0, 7); c.fill(); c.restore();
          for (const [s, x, y, rr, a] of it.dots) { if (s > e * 1.05) continue; c.globalAlpha = a; c.beginPath(); c.arc(x, y, rr / 2, 0, 7); c.fill(); }
          c.globalAlpha = 1;
        } else {
          const e = 1 - Math.pow(1 - pr, 2.2), L = it.len * e, w = it.w * (1 - .25 * e);
          c.save(); c.filter = 'blur(.5px)'; c.beginPath();
          c.moveTo(it.x - w / 2, it.y); c.lineTo(it.x - w * .32, it.y + L); c.arc(it.x, it.y + L, w * .42 * (1 + .5 * e), Math.PI, 0, true); c.lineTo(it.x + w / 2, it.y); c.closePath(); c.fill();
          c.restore(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(it.x - w * .22, it.y, Math.max(1, w * .12), L * .9); c.fillStyle = GREEN;
        }
      }
    }
  }

  // Build the paint for a target, in canvas-local px. Box (bx,by,bw,bh) is the target inside the canvas.
  function design(kind, bx, by, bw, bh, seed) {
    const r = rand(seed), P = new Paint();
    if (kind === 'underline' || kind === 'strike') {
      const strike = kind === 'strike';
      const w = Math.max(6, bh * (strike ? .2 : .16));
      const y = by + bh * (strike ? .55 : .98);
      const pts = bez([bx - bw * .03, y + bh * .04], [bx + bw * .3, y - bh * .1], [bx + bw * .66, y + bh * .1], [bx + bw * 1.03, y - bh * .06]);
      P.stroke(pts, { w, t0: 0, dur: .42, seed });
      const n = Math.max(2, Math.round(bw / (bh * 1.6)));
      for (let i = 0; i < n; i++) {
        const fx = (i + .5 + (r() - .5) * .6) / n, pt = pts[Math.round(fx * (pts.length - 1))];
        P.drip(pt[0], pt[1], bh * (.18 + r() * .42), { w: w * (.45 + r() * .3), t0: .22 + i * .06 + r() * .1, dur: .9 + r() * .5 });
      }
    } else {
      // Sits a little low-right of the chrome icon so the metal stays readable on top of the paint.
      const R = Math.max(bw, bh) * .78, cx = bx + bw * .6, cy = by + bh * .62, k = innerWidth <= 768 ? .45 : 1;
      P.splat(cx, cy, R, { t0: 0, dur: .3, seed });
      P.drip(cx - R * .15, cy + R * .3, R * (.5 + r() * .6) * k, { w: R * .1, t0: .2, dur: 1.1 });
      P.drip(cx + R * .22, cy + R * .25, R * (.3 + r() * .5) * k, { w: R * .075, t0: .28, dur: .9 });
    }
    return P;
  }

  let seedN = 11;
  function attach(el) {
    const kind = el.dataset.spray, host = el.closest('[data-spray-host]') || el.parentElement;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;pointer-events:none;z-index:' + (kind === 'splat' ? 0 : 2);
    host.insertBefore(cv, kind === 'splat' ? host.firstChild : null);
    if (kind === 'splat') { el.style.position = 'relative'; el.style.zIndex = 1; }
    const seed = seedN++;
    let paint, raf = 0, start = 0, played = false;

    function layout() {
      const hr = host.getBoundingClientRect(), er = el.getBoundingClientRect();
      const M = Math.max(er.height, kind === 'splat' ? er.width : 0) * 1.6;
      const dpr = Math.min(2, devicePixelRatio || 1);
      const W = er.width + 2 * M, H = er.height + 2.6 * M;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      Object.assign(cv.style, { left: (er.left - hr.left - M) + 'px', top: (er.top - hr.top - M) + 'px', width: W + 'px', height: H + 'px' });
      paint = design(kind, M, M, er.width, er.height, seed);
      cv._dpr = dpr;
    }
    function frame(t) {
      const c = cv.getContext('2d');
      c.setTransform(cv._dpr, 0, 0, cv._dpr, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
      paint.draw(c, t);
    }
    function play() {
      played = true; cancelAnimationFrame(raf);
      if (reduce) { frame(99); return; }
      start = performance.now();
      const tick = now => { const t = (now - start) / 1000; frame(t); if (t < paint.end) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    }
    layout();
    const delay = +(el.dataset.sprayDelay || 0);
    new IntersectionObserver((ents, io) => {
      if (ents.some(e => e.isIntersecting)) { io.disconnect(); setTimeout(play, delay); }
    }, { threshold: .6 }).observe(el);
    addEventListener('resize', () => { layout(); if (played) frame(99); });
    if (el.dataset.sprayHover) {
      const h = el.closest(el.dataset.sprayHover);
      if (h && matchMedia('(hover: hover)').matches) h.addEventListener('mouseenter', () => { seedN++; paint = design(kind, ...paintBox(), seedN); play(); });
    }
    function paintBox() { const er = el.getBoundingClientRect(); const M = Math.max(er.height, kind === 'splat' ? er.width : 0) * 1.6; return [M, M, er.width, er.height]; }
  }

  const go = () => document.querySelectorAll('[data-spray]').forEach(attach);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => document.readyState === 'loading' ? addEventListener('DOMContentLoaded', go) : go());
})();
