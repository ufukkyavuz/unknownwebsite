# joke® studio — website

Studio site for **joke® studio** (formerly "unknown® studio"; the rename is complete everywhere visible).
Plain static HTML/CSS/JS, no build step, deployed on Vercel from `main`.

## Working with the owner
- The owner (Ufuk) writes in casual Turkish; **reply in Turkish**, short and direct.
- They are a designer, not a developer: give click-by-click steps when they have to do something themselves.
- They can't hear audio inside the chat widget and prefer direct links / files.
- Before anything that goes live (pushing to `main`), say what will change; they approve, then push.

## Run it locally
```bash
python3 -m http.server 8140   # then open http://localhost:8140
```
No dependencies. Test both desktop (1440×900) and mobile (390×844) widths.

## Deploy
- Push/merge to `main` → Vercel production deploy (team **UFO**, slug `ufo1`, project `unknownwebsite`,
  id `prj_kpVWBpysnTFWxuNZF6ZlTWl9t0yu`, team id `team_gozoar1jGphmNKv8ch3qIiI9`).
- Other branches / PRs get a preview URL from the Vercel bot comment.
- `.vercelignore` keeps `CLAUDE.md` and `tools/` out of the deployed site.

## Files
| Path | What |
|---|---|
| `index.html` | Home page. Converted from a Claude Design export; big inline-styled markup + one `Component` class at the bottom (`_setup*` methods: nav, hero scroll, service rows, budget pills, contact submit, section panels). |
| `work-*.html` | Case-study pages (Alix Avien, INO Beauty, Muse Lab, Buzzfy, Foundby.me, Kind People, Hansgrohe) + `work-all.html` (mobile "See all"). |
| `hero-smile.js` | Hero animation, 8 s loop: dot-matrix "digital" smiley (pixels sampled from the logo) → logo spray-painted in through a mask → glitch-out → reboot. Canvas covers only the smile; mask is low-res; static holds skip redraws. |
| `spray.js` | Green spray-paint marks. `data-spray="underline|scribble|circle|splat"` on an element; `data-spray-delay`, `data-spray-trigger`. Exposes `window.JokeSpray = { Paint, bez }` (used by hero-smile). Brand green `#CCFF01`. |
| `uploads/opt/joke-smile.webp` / `uploads/joke-smile.png` | The joke® smiley logo (724×837, transparent). Source: Figma file `2dUT2JUuwfITmXhKdqBpcC`, node `9:5`. A real SVG export would be sharper. |
| `uploads/opt/spray-edge.png` | Rough sprayed edge used as the mask on the "What we do" hover fill. |
| `uploads/opt/` | Optimized images that pages load directly. |
| `api/contact.js` | Contact form endpoint (Resend). |
| `tools/optimize-images.py` | `--scan` lists heavy images loaded directly; `--fix` writes optimized copies to `uploads/opt/`. Run after adding new project images. |
| `_ds/joke-studio-design-system-…/` | Design tokens/fonts (Space Grotesk, DM Sans, Space Mono) from Claude Design. |

## Where the effects live
- Hero: `<canvas id="hero-smile">` (replaced the old background video; `uploads/girl-space-web.mp4` is now unused).
- "Don't Expect." → `data-spray="underline"` (delayed to land after the smile).
- Contact "normal?" → `data-spray="scribble"`. Footer logo → `data-spray="circle"`.
- "What we do" row hover → CSS layer in `_setupServiceRows` (the `wipe` div): green `#CCFF01` with the spray-edge mask,
  animated with `transform` only. Don't go back to canvas fills there; that froze the page.
- Nav / mobile menu / footer logo: smile image + "joke®" wordmark at 26px.

## Contact form
`_setupContactSubmit` POSTs JSON to **`/api/contact`** (`api/contact.js`, a Vercel function), which validates it and emails it via **Resend**.
Fields: name, brand, email, need, budget (selected pill), website. Name + email are required. The page shows success only when the function answers `{ ok: true }`; any failure or a 20 s timeout shows "Couldn't send — try again".
- Vercel env vars (Production): `RESEND_API_KEY` (required), `CONTACT_TO` (default `ufukkyavuz51@gmail.com`), `CONTACT_FROM` (default `onboarding@resend.dev`).
- Until `jokestudio.co` is verified in Resend, the default sender can only deliver to the Resend account's own email, so sign up with the same address as `CONTACT_TO`.
- Once the domain is verified in Resend, set `CONTACT_FROM` to e.g. `joke studio <hello@jokestudio.co>`. `hello@jokestudio.co` has no MX record yet, so it cannot receive mail.
- Replaced FormSubmit (formsubmit.co), which returned Cloudflare 522 timeouts on 2026-10-22.
- The function is not served by `python3 -m http.server`; test it with `vercel dev` or on a preview deploy.

## Open items (as of 2026-10-22)
1. **Domain `jokestudio.co`** (registered at GoDaddy, nameservers `ns27/ns28.domaincontrol.com`), not connected yet:
   - Vercel → project → Settings → Domains → add `jokestudio.co`, plus `www.jokestudio.co` redirecting to it (308).
   - GoDaddy DNS: `A @ 76.76.21.21` (remove the parked `3.33.130.190` / `15.197.148.33`), `CNAME www cname.vercel-dns.com`, turn off Forwarding.
   - Verify: `dig +short jokestudio.co` → `76.76.21.21`, then Vercel shows "Valid Configuration".
2. **Rename** GitHub repo `ufukkyavuz/unknownwebsite` → `jokestudio` and the Vercel project → `jokestudio` (Settings → General).
   No `®` in names. GitHub redirects the old URL; Vercel tracks the repo by id.
3. Set `RESEND_API_KEY` in Vercel and test the form (see Contact form).
4. Optional: delete unused `uploads/girl-space-web.mp4`; get the logo as SVG from Figma.

## History (short)
Claude Design export → static site → mobile fixes (autoplay, single-row "Trusted by", 4 works + "See all", hide Brand DNA,
bigger prev/next) → image optimization → hero video swap → joke® rebrand with chrome icons + green spray/drip accents →
per-spot spray variants, hover-only row fill, `#CCFF01` → hero digital→spray smile using the real logo → jank fixes →
email form → merged to `main` (PR #1).
