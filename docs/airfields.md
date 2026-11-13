# Airfields

![Airfields](../airfields/banner.png)

Airfields Gold on a high-altitude night. Xena adds the XENA STUDIOS endorsement, the `//` kicker and the horizon. The game itself is in xena-studios/airfields (private).

- **Tagline:** Sky-mining PvP on Java & Bedrock.
- **Summary:** A sky-mining PvP Minecraft server for Java and Bedrock. Mine floating islands, fight ore mobs, forge your gear and hold KOTH.
- **Name:** always **Airfields**, one word with a capital A. Handles and the domain add MC (`airfieldsmc`, airfieldsmc.com). In listings, pair it with what it is: *Airfields — Sky-Mining PvP*.

## Marks

<img src="../airfields/wordmark.png" width="420" alt="AIRFIELDS wordmark"> &nbsp; <img src="../airfields/icon.png" width="96" alt="Airfields icon">

- **Wordmark:** **AIRFIELDS** in Unbounded Black, outlined, with a gold face lit from above, a bronze extrusion and one ink outline around it all, so it holds on dark and light. Always use the file and never retype it.
- **Monogram:** the **A** in the same treatment, for small and square spots.
- **Icon:** the monogram standing on a small horizon, on a `sky-raised` tile with a soft gold glow, 6/32 corners. It clears Discord's circle crop. At 64px and below (the favicon, the Minecraft server list) the A grows to fill the tile and the horizon drops out.
- **Clear space:** the exported files include it. **Minimum size:** the wordmark 96px wide, the icon 16px.
- **Don't** recolour the gold, add a second outline, set the name in another face, or put the seasonal cap on the permanent files.

## Colour

| Token | Hex | Role |
|---|---|---|
| `gold` | `#FFD93D` | **Airfields Gold**, the one accent: buttons, highlights, the horizon's rim |
| `gold-daylight` | `#7A5600` | Gold text on light backgrounds |
| `sky` | `#0B1022` | Background |
| `sky-raised` | `#151B38` | Cards, icon tile, planet body |
| `sky-rule` | `#283058` | Borders |
| `text` | `#F6F4EE` | Text on dark |
| `muted` | `#A7ADC6` | Secondary text, kickers |
| `ink` | `#1A1405` | Text on light and on gold, the logo's outline |
| `cloud` | `#F6F7FB` | Light backgrounds |
| `gold-light`, `gold-deep`, `bronze`, `bronze-dark` | `#FFF3B0`, `#F0B312`, `#A8700A`, `#5A3A06` | The wordmark's metal, for illustration only |

Airfields Gold sits at OKLCH hue 96, a lemon gold, so it stays clear of the plugin family's amber (xUtilities, hue 81) and MostWanted's Desert Orange (hue 60). In [`tokens/airfields.css`](../tokens/airfields.css) (`--airfields-*`) and [`tokens/airfields.json`](../tokens/airfields.json). Use `gold-daylight`, not `gold`, for text on white.

## Type

- **Unbounded** (Black for the wordmark, Bold for headings) and **Figtree** for taglines and text.
- **JetBrains Mono** for the `//` kicker, as on every Xena banner. The game's website uses IBM Plex Mono for labels.

## Seasons

The game changes its look with the season; the permanent brand above doesn't. Each season is a **theme**: its own sky, horizon rim and glow, and one layer over the letters (winter's snow cap). A theme may add weather to its own graphics (winter's falling snow), which the permanent files never have. Theme files are in `airfields/themes/<id>/`, and the theme definitions are in `themes` in [`scripts/airfields-brand.ts`](../scripts/airfields-brand.ts).

### Winter (2026)

<img src="../airfields/themes/winter/wordmark.png" width="420" alt="AIRFIELDS wordmark with a snow cap"> &nbsp; <img src="../airfields/themes/winter/icon.png" width="96" alt="Airfields winter icon">

A snow cap on every letter, a navy sky with an aurora glow and falling snow, and an aurora-teal horizon. For the game's site, Discord and listings while the winter season runs.

| Token | Hex | Role |
|---|---|---|
| `navy` | `#0A1230` | The season's sky |
| `night`, `night-raised` | `#111C45`, `#1B2A62` | Planet body, cards |
| `frost`, `frost-shade` | `#F4F9FF`, `#9CC2E9` | Snow, the cap's shadow |
| `aurora-teal`, `aurora-violet` | `#3CF2C6`, `#9A7BFF` | The horizon's rim and the glow, never text |

In [`airfields/themes/winter/colors.json`](../airfields/themes/winter/colors.json).

To add a season: add a theme to `themes` (copy winter's: `sky`, `body`, `rim`, `glow`, and optionally `cap` and `scenery`), run `pnpm build:airfields`, and commit `airfields/themes/<id>/`. The game repo then syncs it (its `brand:sync`).

## Files

| File | Use |
|---|---|
| `airfields/wordmark` | The wordmark, transparent |
| `airfields/monogram` | The A, transparent |
| `airfields/icon` | Avatar, Discord, store (512) |
| `airfields/favicon` | Favicon (64) |
| `airfields/server-icon` | The Minecraft server list's `server-icon.png` (64×64, square) |
| `airfields/banner` | README banner (1920×600) |
| `airfields/social` | GitHub social preview (1280×640) |
| `airfields/themes/<id>/` | The season's wordmark, monogram, icon, server icon, banner and social preview |

Colours and copy are in [`scripts/airfields-brand.ts`](../scripts/airfields-brand.ts). `pnpm build:airfields` rebuilds only these files and needs only Unbounded, Figtree and JetBrains Mono (see [Building](building.md#fonts)).
