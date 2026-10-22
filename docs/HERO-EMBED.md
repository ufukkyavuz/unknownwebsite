# joke® hero video — how to drop it into the site

Files (copy into the site repo's `uploads/opt/`):
- `web-joke-hero-1280x720.webm` / `.mp4` + `-poster.jpg`  → desktop
- `web-joke-hero-720x1280.webm` / `.mp4` + `-poster.jpg`  → mobile (portrait)
- `grain.png` → animated film grain laid over the video (the web videos are encoded clean so they stay ~4.5 MB)

`social-joke-hero-*.mp4` have the grain baked in (≈19 MB) — for Instagram / sharing, not the site.

## Markup (replaces the hero content; no text, just the loop)
```html
<section id="hero" style="position:relative;height:100vh;min-height:560px;background:#060706;overflow:hidden;">
  <video id="hero-loop" autoplay muted loop playsinline preload="auto"
         poster="uploads/opt/web-joke-hero-1280x720-poster.jpg"
         style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">
    <source media="(orientation: portrait)" src="uploads/opt/web-joke-hero-720x1280.webm" type="video/webm">
    <source media="(orientation: portrait)" src="uploads/opt/web-joke-hero-720x1280.mp4" type="video/mp4">
    <source src="uploads/opt/web-joke-hero-1280x720.webm" type="video/webm">
    <source src="uploads/opt/web-joke-hero-1280x720.mp4" type="video/mp4">
  </video>
  <div class="hero-grain" aria-hidden="true"></div>
</section>
```

## CSS
```css
.hero-grain{position:absolute;inset:-50%;pointer-events:none;background:url(uploads/opt/grain.png);
  opacity:.16;mix-blend-mode:overlay;animation:grain .5s steps(4) infinite}
@keyframes grain{0%{transform:translate(0,0)}25%{transform:translate(-7%,4%)}50%{transform:translate(5%,-6%)}75%{transform:translate(-4%,-3%)}}
@media (prefers-reduced-motion:reduce){.hero-grain{animation:none}}
```
Note: `<source media>` inside `<video>` is honoured by Chrome/Safari/Firefox (re-added in 2023); if a browser ignores it you just get the landscape file cropped by `object-fit:cover`.

The existing play-retry code in `index.html` (`const v = document.getElementById('hero-video')`) should point at `hero-loop` so iOS/Android still start playback.
