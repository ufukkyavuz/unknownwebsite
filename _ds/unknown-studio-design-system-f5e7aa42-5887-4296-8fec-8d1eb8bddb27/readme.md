# unknown® studio — Design System

> Visual identity, component library, and UI kit for **unknown® studio** — a premium creative agency specializing in scroll-stopping product visuals, social media campaigns, brand content, and AI-assisted visual production.

---

## Sources & References

This design system was built from the following sources:

| Source | URL / Path | Notes |
|---|---|---|
| Studio website repo | `github.com/ufukkyavuz/unknownwebsite` | Empty at time of build — brand new project |
| INO Beauty client repo | `github.com/ufukkyavuz/inocosmetic-ad` | Production pipeline + CLAUDE.md |
| Muse Lab client repo | `github.com/ufukkyavuz/muselab-reklam` (private) | Product catalog + Figma reference |
| Muse Lab Figma | `figma.com/design/hf9MUY6NmmVYtEQ2AEhYys/MUSE-LAB` | Visual production reference |
| INO Beauty Figma | `figma.com/design/ej8JpbRaZU1qH7rdYxLvGP/INO--Visuals` | Creative direction reference |

The studio's own brand identity (`unknownwebsite` repo) was empty at build time. The visual language documented here was derived from the brand brief, client work aesthetics, and editorial direction.

---

## Brand Overview

**unknown® studio** is a visual production studio that creates campaign visuals, social media content, and AI-assisted creative systems for brands that refuse to look ordinary. Their clients include:

- **INO Beauty** — SPF skincare, multi-use serums, cosmetics. White luxury aesthetic.
- **Muse Lab** — Skincare serums. Dark blue editorial aesthetic (#273A97, Source Code Pro).
- **Pharmodern** — Pharmaceutical-adjacent wellness brand.
- **kitUP** — (details TBC)

The studio positions itself as anti-corporate, editorial, and slightly alien — "clean weird."

---

## Content Fundamentals

### Voice & Tone
- **Direct.** No hedging, no corporate softening. Say what you mean.
- **Confident but not arrogant.** The studio knows it's good; it doesn't need to shout.
- **Slightly provocative.** "Brands that don't want to look ordinary." "Got a brand that looks too normal?"
- **Curious.** References to the unknown, the unexplained, the experimental.

### Copywriting Rules
- **No exclamation marks.** They read cheap on premium work.
- **No emoji** — ever. This is editorial, not casual.
- **Sentence case** for headlines and all body copy.
- **ALL CAPS** only for micro-labels, badge text, and category tags (sparingly).
- **"We" for the studio,** "you / your" for clients and brands.
- Short sentences. Long sentences break the rhythm.
- Use the registered mark **®** as a brand motif — "unknown® studio" always, never "Unknown Studio".

### Copy Examples (from the brief)
- Hero: *"Visuals for brands that don't want to look ordinary."*
- Sub: *"We create product campaigns, social media visuals and AI-assisted creative systems that make brands impossible to ignore."*
- Contact: *"Got a brand that looks too normal? Let's fix that."*
- Services label: *"What we do"* — not "Our Services"
- CTA: *"See the work"* / *"Start a project"* — not "View portfolio" / "Contact us"

---

## Visual Foundations

### Colors
| Token | Value | Usage |
|---|---|---|
| `--color-offwhite` | `#F4F1EA` | Page background — warm, not stark |
| `--color-ink` | `#0B0B0B` | Primary text, fills, borders |
| `--color-alien-green` | `#B7FF5A` | Primary accent — CTAs, hover dots, process numbers |
| `--color-violet` | `#A48CFF` | Secondary accent — AI, The Lab, experiments |
| `--color-beige` | `#D6C7B1` | Warm fill — neutral cards, secondary surfaces |
| `--color-metal` | `#D8D8D8` | Borders, dividers |

### Typography
- **Display / Headlines:** Space Grotesk 700 — bold, geometric, slightly alien. Tight letter-spacing (-0.025em to -0.04em) at large sizes.
- **Body:** DM Sans 400/500 — clean, readable, unobtrusive. 1.65 line-height for running copy.
- **Mono:** Space Mono — token values, code, technical labels.
- Hero sizes up to `--text-hero` (144px / 9rem) for maximum impact.
- Note: These are Google Fonts substitutes. Client may supply proprietary font files for production. If so, update `tokens/typography.css` with local `@font-face` rules.

### Layout & Spacing
- Max content width: **1200px** (`--max-w-content`)
- Horizontal page padding: `clamp(24px, 5vw, 80px)` — responsive gutter
- Section vertical spacing: **80–160px** (`--space-20` to `--space-40`)
- Base unit: **4px** — all spacing tokens are multiples of 4
- Grid: editorial asymmetric grids preferred; 12-col base

### Backgrounds & Surfaces
- **Page background:** `#F4F1EA` — the signature warm off-white
- **Dark sections:** `#0B0B0B` — used for hero inversions and contact sections
- **Cards:** Soft off-white-2 (`#EDEAE2`) — slightly deeper than page BG
- **No gradients** on backgrounds (exception: very subtle radial vignettes on full-bleed dark sections)
- **No textures** — clean, flat surfaces only

### Cards
- Border-radius: `var(--radius-lg)` = 22px
- Shadow: `var(--shadow-xs)` at rest → `var(--shadow-lg)` on hover
- Hover: lift by 6px (`translateY(-6px)`) + image scale 5%
- Service cards: full dark inversion on hover (ink background, off-white text, green accent dot)

### Borders
- Default: `var(--color-metal)` (#D8D8D8) — 1px or 1.5px
- Subtle: `var(--color-offwhite-3)` — for card outlines
- Strong: `var(--color-ink)` — for active/selected states

### Animation & Motion
- **Primary easing:** `var(--ease-spring)` = `cubic-bezier(0.16, 1, 0.3, 1)` — overshoot, bouncy
- **Standard easing:** `var(--ease-standard)` = `cubic-bezier(0.4, 0, 0.2, 1)`
- **Hover transitions:** 220ms base duration
- **Card lifts:** 380ms slow duration
- **Image scales:** 600ms slower duration
- **Orbital UFO rings:** 12–18s linear rotation — imperceptibly slow

### Hover States
- Buttons: slight darken + translateY(-1px) lift
- Project cards: image scale-up + card lift
- Service cards: full background inversion (ink)
- Tags/chips: border + fill invert (ink background, off-white text)
- Links: no underline by default; opacity-based or color shift

### Press/Active States
- Buttons: slight opacity reduction (0.85) + translateY(0) reset
- Tags: instant color lock

### Corner Radii
- Small UI elements: `--radius-sm` (8px) — inputs, small chips
- Cards: `--radius-lg` (22px) — the signature rounded card
- Pill shapes: `--radius-full` (9999px) — all buttons and badge pills
- Images within cards: `0` (inherit from parent overflow:hidden)

### Shadows
- Ink-tinted (not pure black, not blue-shifted)
- Very low opacity (5–18%)
- Only used on white/light surfaces — not on dark sections

### Image Style
- Product visuals: ultra-realistic, hyper-detailed, photographic quality
- Campaign style: editorial, dramatic lighting, shallow DOF
- Background: white/neutral OR full-bleed atmospheric (no stock business photos)
- Color temperature: warm skin tones, blue sky accents (per client Muse Lab), white minimalism (per client INO Beauty)
- No grain, no hipster filters

### UFO Decorative Motif
The studio's signature visual element — an abstract orbital shape suggesting "craft of unknown origin":
- Central dark ellipse body (the craft)
- Two concentric orbital rings (solid + dashed)
- Accent dots: alien green + soft violet at orbital positions
- CSS animation: imperceptibly slow rotation (12–18s)
- Used in: Hero section float, section dividers, loading states
- Must remain subtle — not cartoonish

---

## Iconography

### Approach
unknown® studio uses **minimal, purposeful iconography** — not decorative icon sets.

- **No icon library.** No Lucide, no Heroicons, no Feather icons.
- **Geometric primitives:** Circles (dots), lines, and the orbital ring motif replace conventional icons.
- **The ® mark** is used as a brand motif within the logotype — never as a generic symbol.
- **Section numbers:** Large alien-green numerals ("01", "02"…) replace section icons.
- **Status dots:** Small filled circles (5–8px) in alien green signal activity/highlights.
- **Emoji:** Never used in studio's own brand communications.

### Client Logo Assets
- `assets/logos/muse-lab-logo.svg` — Muse Lab SVG vector logo (dark blue #273A97)
- `assets/logos/muse-lab-logo.png` — Muse Lab rasterized logo

### Product Images
- `assets/products/ino-broad.png` — INO Beauty Broad Spectrum SPF 50+
- `assets/products/muselab-golden-hour.png` — Muse Lab Golden Hour BB Tinted Glow
- `assets/products/muselab-shine-bright.png` — Muse Lab Shine Bright Tinted Glow Serum
- `assets/products/muselab-cherry-blush.png` — Muse Lab Cherry Cream Blush
- `assets/products/muselab-all-products.png` — Muse Lab full product range

---

## File Index

```
unknown® studio Design System
├── styles.css                     ← Global entry point (import list only)
├── tokens/
│   ├── colors.css                 ← Base palette + semantic aliases
│   ├── typography.css             ← Google Fonts + type scale tokens
│   ├── spacing.css                ← Spatial scale, radii, shadows, motion
│   └── reset.css                  ← Base browser reset
├── components/
│   └── core/
│       ├── Button.jsx + .d.ts + .prompt.md    ← Pill CTA, 5 variants
│       ├── Badge.jsx  + .d.ts + .prompt.md    ← Uppercase label chip
│       ├── Card.jsx   + .d.ts + .prompt.md    ← Project / service / process card
│       ├── Tag.jsx    + .d.ts + .prompt.md    ← Filter chip / category tag
│       ├── Input.jsx  + .d.ts + .prompt.md    ← Underline form input
│       └── core.card.html                     ← Component showcase card
├── guidelines/
│   ├── color-base.card.html       ← 6-color palette swatches
│   ├── color-ink-scale.card.html  ← Ink opacity scale
│   ├── color-accents.card.html    ← Green + violet accent pair
│   ├── color-semantic.card.html   ← Semantic token grid
│   ├── type-display.card.html     ← Space Grotesk headline specimen
│   ├── type-body.card.html        ← DM Sans body specimen
│   ├── type-scale.card.html       ← Full type scale
│   ├── spacing.card.html          ← Spacing token bars
│   ├── radii.card.html            ← Border radius scale
│   ├── shadows.card.html          ← Shadow scale
│   ├── brand-logo.card.html       ← Logotype treatments
│   ├── brand-ufo.card.html        ← UFO orbital motif
│   └── motion.card.html           ← Duration + easing tokens
├── assets/
│   ├── logos/
│   │   ├── muse-lab-logo.svg
│   │   └── muse-lab-logo.png
│   └── products/
│       ├── ino-broad.png
│       ├── muselab-golden-hour.png
│       ├── muselab-shine-bright.png
│       ├── muselab-cherry-blush.png
│       └── muselab-all-products.png
└── ui_kits/
    └── website/
        └── index.html             ← unknown® studio website prototype
```
