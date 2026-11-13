# MostWanted

![MostWanted](../mostwanted/banner.png)

Desert Orange on dusk. Xena adds the XENA STUDIOS endorsement and the `//` kicker. The game itself is in xena-studios/mostwanted (private, proprietary), at mostwantedmc.com; its resource pack is public at [xena-studios/mostwanted-pack](https://github.com/xena-studios/mostwanted-pack).

- **Tagline:** Cops vs. prisoners on Java & Bedrock.
- **Summary:** A Jailbreak-style cops vs. prisoners Minecraft server, for Java and Bedrock. Break out, rob the town, and stay ahead of the guards.
- **Name:** always **MostWanted**, one word with a capital M and W. Handles and the domain add MC (`mostwantedmc`, mostwantedmc.com). In listings, pair it with "Minecraft", since "Most Wanted" alone is a crowded search.

## Marks

<img src="../mostwanted/official/wordmark.png" width="420" alt="MOSTWANTED wordmark"> &nbsp; <img src="../mostwanted/icon.png" width="96" alt="MostWanted icon">

- **Wordmark:** **MOSTWANTED** in blocky Minecraft-style letters. It's pixel art, not a font, so always use the file and never retype it.
- **Monogram:** **MW** in the same style, for small and square spots.
- **Icon:** two, for two places. The game's own icon is the monogram over the pixel desert (`mostwanted/official/icon.png`): the avatar, Discord, the favicon and the server list, everywhere players see MostWanted. `mostwanted/icon` is the monogram on a `dusk-raised` tile with a soft orange glow, for Xena's own pages (the org profile, xenastudios.co), where it sits beside the other products' tiles.
- **Key art:** the wordmark over the blurred pixel desert at sunset. This is MostWanted's horizon, used on its banners, site and listings.

## Colour

| Token | Hex | Role |
|---|---|---|
| `orange` | `#FF9933` | The one accent: buttons, highlights |
| `orange-daylight` | `#B34700` | Orange text on light backgrounds |
| `dusk` | `#150D09` | Background |
| `dusk-raised` | `#21150F` | Cards, icon tile |
| `dusk-rule` | `#3B2A20` | Borders |
| `text` | `#FBF4EC` | Text on dark |
| `muted` | `#B8A797` | Secondary text, kickers |
| `ink` | `#1C110B` | Text on light and on orange |
| `sand-light` | `#FBF6F0` | Light backgrounds |
| `sand`, `amber`, `burnt`, `clay` | `#EEBD3B`, `#E29020`, `#C46002`, `#893500` | The wordmark's bands, for illustration only |

In [`tokens/mostwanted.css`](../tokens/mostwanted.css) (`--mostwanted-*`) and [`tokens/mostwanted.json`](../tokens/mostwanted.json). Use `orange-daylight`, not `orange`, for text on white. In-game colours are in the game's own brand doc, in its private repo.

## Type

- **Lilita One** for taglines and headlines on graphics.
- **JetBrains Mono** for the `//` kicker.

## Files

| File | Use |
|---|---|
| `mostwanted/banner` | README banner (1920×600) |
| `mostwanted/social` | GitHub social preview (1280×640) |
| `mostwanted/icon` | The tile icon, for Xena's own pages: the org profile, xenastudios.co (1024) |
| `mostwanted/favicon` | The tile icon at 64 |
| `mostwanted/official/icon.png` | The game's icon: avatar, Discord, store (1024) |
| `mostwanted/official/favicon.png`, `server-icon.png` | The game's favicon (32) and Minecraft server-list icon (64) |
| `mostwanted/official/wordmark.png`, `monogram.png` | The logos |
| `mostwanted/official/desert.png` | The pixel desert, unblurred |
| `mostwanted/official/key-art.png` | Key art (1920×1080): site hero, listings, thumbnails |

Colours and copy are in [`scripts/mostwanted-brand.ts`](../scripts/mostwanted-brand.ts). `mostwanted/official/` isn't built here: it's copied from the game repo (`brand/source/` for the logos and the desert; `brand/out/key-art-1920x1080.png`, `icon-1024.png`, `favicon-32.png` and `server-icon.png`). Refresh it when those change.
