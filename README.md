# Xena Studios — Brand

![Xena Studios](social/x-header.png)

The Xena Studios identity: type only, one display face, Ion Blue on deep space, and a single planet horizon.

## Logo

The logo is the Ethnocentric type itself. There is no symbol. Use the widest version that fits.

| Version | Use | Files |
|---|---|---|
| **XENA STUDIOS** | Primary. Site header, banners, docs | `logo/xena-studios*.svg` |
| **XENA** | Short form. Tight horizontal space, merch | `logo/xena*.svg` |
| **X** | Monogram. Avatar, favicon, app icon | `logo/x*.svg`, `avatar/` |

Each comes in four colours: default (`text`), `-blue`, `-white` and `-black`. Every SVG has a PNG beside it.

<img src="logo/xena-studios.png" width="420" alt="XENA STUDIOS"> &nbsp; <img src="logo/xena-blue.png" width="200" alt="XENA"> &nbsp; <img src="avatar/avatar.png" width="96" alt="X avatar">

- **Clear space**: half the cap height on every side (the exported files include it).
- **Minimum size**: XENA STUDIOS 120px wide, XENA 64px wide, X 16px.
- **Backgrounds**: blue versions on `void` or `space` only. On light or photographic backgrounds, use white or black.
- **Don't** add a symbol, stars, outlines, gradients on the type, or a second accent colour. Don't set Ethnocentric in lowercase or as live web text.

## Colour

Ion Blue is the only accent. It lights the X and the horizon; everything else is neutral.

| Token | Hex | Role |
|---|---|---|
| `void` | `#06080D` | Page background |
| `space` | `#0A0E16` | Tiles, avatar |
| `surface` | `#121824` | Raised panels, planet body |
| `line` | `#222B3B` | Hairlines, borders |
| `muted` | `#8A93A6` | Secondary text, taglines |
| `text` | `#EDF1F7` | Primary text, logo |
| `accent` | `#5CB4FF` | Ion Blue: X, horizon glow |

Available as [`tokens/colors.css`](tokens/colors.css) (`--xena-*`) and [`tokens/colors.json`](tokens/colors.json).

## Typography

| Role | Face | Notes |
|---|---|---|
| Logo / display | **Ethnocentric** (Typodermic) | Caps only, always outlined |
| Taglines, labels | **JetBrains Mono** Light / Regular | Taglines in Light, labels in Regular with wide tracking |

Raptor graphics follow Raptor's own type rules (see [Raptor](#raptor)).

**Ethnocentric licence.** The free Typodermic desktop licence covers logos and outlined images only. It does not allow webfonts, shipping the font in apps or sites, or sharing the font file. So the font is **not** in this repo, and every Ethnocentric letter in these files is a vector path. If live Ethnocentric text is ever needed on a website, buy a webfont licence from Typodermic first.

## Horizon

Every Xena graphic uses the same scene: a flat `void` sky and one huge planet whose Ion Blue limb arcs across the bottom. Nothing else, no stars. Raptor's banner uses the same horizon in Raptor's colours (Ink sky, Signal Red limb).

| File | Size | Use |
|---|---|---|
| `social/x-header` | 1500×500 | X / Twitter header |
| `social/discord-banner` | 960×540 | Discord server banner |
| `social/og-card` | 1200×630 | Link preview for xenastudios.co |
| `avatar/avatar` | 512×512 | GitHub org and social avatars |
| `avatar/favicon` | 64×64 | Favicon |
| `scene/horizon` | 2400×900 | The horizon alone, no type: website and slide backgrounds |

## People

Team profile photos (Google account, GitHub, Discord) use the avatar's style with the person's initial: Ion Blue on a `space` tile. They're square; Google and Discord crop them to a circle. Add someone to `people` in `scripts/build.mjs` and rebuild.

| File | Person |
|---|---|
| [`people/zachary.png`](people/zachary.png) | Zachary, Founder |

## Google Workspace

Upload [`workspace/logo.png`](workspace/logo.png) (320×132, Google's maximum) in the Admin console under **Account → Account settings → Personalization → Logo → Custom logo**. It shows at the top of Gmail, Calendar and Drive, and can take up to 3 days to appear.

<img src="workspace/logo.png" width="160" alt="Workspace logo">

It's the short **XENA** form in black on a transparent background. Google frames the logo in white, so a dark tile looks like a box with a border; and XENA STUDIOS is illegible at the ~40px height Gmail draws it.

## Raptor

![Raptor](raptor/banner.png)

Raptor keeps its own identity, taken from [`docs/DESIGN.md`](https://github.com/xena-studios/raptor/blob/main/docs/DESIGN.md) in `xena-studios/raptor` ("The Console": Signal Red on warm Ink). Xena supplies only the horizon and the XENA STUDIOS endorsement.

### Marks

<img src="raptor/official/logo-dark.png" width="300" alt="Raptor logo"> &nbsp; <img src="raptor/icon.png" width="64" alt="Raptor icon">

- **Full logo**: the running raptor in Signal Red beside the **RAPTOR** wordmark (Archivo ExtraBold 800, 0.06em tracking, outlined). Wherever the wordmark appears, the raptor is beside it, and the raptor never appears without the wordmark.
- **Small mark**: the R whose leg is a raptor's sickle claw, in Signal Red on its own. For 32px+ spots with no room for the full logo. Never beside the wordmark.
- **Favicon / app icon / avatar**: the claw R in Ink (`on-signal`) on a Signal Red tile with 6/32 corners.
- One flat colour per mark: no gradients, outlines or shadows. The wordmark is Bone on dark, Graphite on light; the red switches to its Daylight value on light.

### Colour

| Token | oklch | Hex | Role |
|---|---|---|---|
| `signal-red` | `oklch(0.66 0.19 25)` | `#F05653` | The one accent: raptor, marks, primary action |
| `signal-red-daylight` | `oklch(0.545 0.215 25)` | `#D01025` | Signal Red on light backgrounds |
| `on-signal` | `oklch(0.17 0.03 25)` | `#1B0A09` | Claw R on the red tile |
| `ink` | `oklch(0.145 0.012 25)` | `#0F0808` | Page / banner background |
| `ink-raised` | `oklch(0.185 0.013 25)` | `#181110` | Cards, planet body |
| `ink-rule` | `oklch(0.3 0.012 25)` | `#342C2B` | Borders, dividers |
| `bone` | `oklch(0.96 0.005 25)` | `#F5F0F0` | Text, wordmark on dark |
| `ash` | `oklch(0.68 0.011 25)` | `#9F9695` | Secondary text, kickers |
| `graphite` | `oklch(0.18 0.018 25)` | `#190F0E` | Text, wordmark on light |

The full set, including Daylight and state colours (`ok`, `warn`, `danger`), is in [`tokens/raptor.css`](tokens/raptor.css) and [`tokens/raptor.json`](tokens/raptor.json). Neutrals are tinted toward red (hue 25). Red means the action, the place, or what's live, never decoration. Green, amber and danger mean state only.

### Type

- **Hanken Grotesk** for sentences: headlines 700 with -0.025em tracking, body 400.
- **JetBrains Mono** for everything machines say and every control: labels, buttons, numbers, and the uppercase `//` kicker (+0.18em).
- **Archivo** is only the wordmark's letters.

### Files

| File | Use |
|---|---|
| `raptor/banner` | README banner, 1920×600 (PNG @2×) |
| `raptor/logo-dark`, `raptor/logo-light` | Full logo for dark / light backgrounds |
| `raptor/icon` | Favicon, app icon, avatar (512) |
| `raptor/mark` | Small claw R mark |
| `raptor/official/` | Verbatim copies from the Raptor repo: docs logos, favicon, and the site's `og.png` link preview |

The paths and tokens are vendored in [`scripts/raptor-brand.mjs`](scripts/raptor-brand.mjs) from `web/src/lib/brand.ts` and `docs/DESIGN.md`. If Raptor's marks or colours change, update that file, refresh `raptor/official/`, and rebuild.

## Build

Every asset is generated by [`scripts/build.mjs`](scripts/build.mjs).

```sh
npm install
cp /path/to/Ethnocentric-Regular.otf .local-fonts/   # your own licensed copy
# Hanken Grotesk 700 (OFL, Google Fonts) → .local-fonts/HankenGrotesk-700.ttf
npm run build
```

JetBrains Mono is read from `~/Library/Fonts` by default. Override font paths with `ETHNOCENTRIC=`, `MONO=`, `MONO_LIGHT=` and `HANKEN_BOLD=`.
