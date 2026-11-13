![Xena Studios brand. XENA STUDIOS and the title "Brand" over the Ion Blue planet horizon, with "Logos, colours and graphics for every Xena brand."](github/brand-banner.png)

**Logos, colours and graphics for every Xena brand.**

Every logo, colour token and graphic for Xena Studios and its products. Almost all of it is generated from code by [`scripts/build.ts`](scripts/build.ts); the `official/` folders hold files made in a product's own repo and copied here, so this repo has the whole set.

## How the brands fit together

| Tier | Brands | Identity |
|---|---|---|
| **Studio** | Xena Studios | Type only, Ion Blue on deep space |
| **Products** | Raptor, NeoSkript | Each has its own mark, colours and type, endorsed by XENA STUDIOS |
| **Servers** | MostWanted, Airfields | Our Minecraft servers. The same as products, plus a game look of their own: pixel key art, a block wordmark, and seasons (Airfields) |
| **Plugins** | xUtilities, zChat, xLimbo | One shared system: a pixel glyph and an accent each |

Two things tie them together: the **XENA STUDIOS** endorsement (on banners, previews and key art; on a product's own website, only in the footer) and the planet **horizon**. Every brand also has its own accent, and no two share one.

<img src="logo/xena-studios.png" width="360" alt="XENA STUDIOS"> &nbsp; <img src="raptor/icon.png" width="64" alt="Raptor"> <img src="neoskript/icon.png" width="64" alt="NeoSkript"> <img src="mostwanted/icon.png" width="64" alt="MostWanted"> <img src="airfields/icon.png" width="64" alt="Airfields"> <img src="plugins/xutilities/icon.png" width="64" alt="xUtilities"> <img src="plugins/zchat/icon.png" width="64" alt="zChat"> <img src="plugins/xlimbo/icon.png" width="64" alt="xLimbo">

## What's where

| Folder | What's in it |
|---|---|
| `logo/`, `avatar/` | The Xena Studios logo in every version and colour, and the X avatar and favicons |
| `social/`, `scene/` | Xena's social graphics (X header, Discord banner, link previews) and the bare horizon |
| `github/` | README banners and social previews for the org's own repos (brand, website, .github, plugins) |
| `people/`, `workspace/` | Team profile photos and the Google Workspace logo |
| `raptor/`, `neoskript/` | Each product's marks, icon, banner and social preview |
| `mostwanted/`, `airfields/` | Each server's marks, icon, banner and social preview; `airfields/themes/<season>/` for the seasons |
| `plugins/` | Each plugin's icon, banner and social preview, and the stepped pixel horizon they share |
| `<brand>/official/` | Files made in that product's own repo, copied in as they are (see the brand's guide) |
| `tokens/` | Every brand's colours, as CSS custom properties and JSON |
| `scripts/` | The build: `build.ts` draws everything, `<brand>-brand.ts` holds each brand's colours, marks and copy, `verify.ts` is what CI runs |
| `types/` | Type declarations for opentype.js, used by the build |

Every SVG has a PNG beside it. Both are committed, so other repos can link or copy them without building.

## Guides

| Guide | What's in it |
|---|---|
| [Xena Studios](docs/xena.md) | The logo, Ion Blue, type, the horizon, repo cards, team photos |
| [Raptor](docs/raptor.md) | Signal Red, the raptor and claw marks |
| [NeoSkript](docs/neoskript.md) | Neo Magenta and the `.sk` mark |
| [MostWanted](docs/mostwanted.md) | Desert Orange, the block wordmark and the pixel desert |
| [Airfields](docs/airfields.md) | Airfields Gold, the gold wordmark, and the seasonal themes |
| [Plugins](docs/plugins.md) | The pixel-glyph system, and how to add a plugin |
| [Where each file goes](docs/where-files-go.md) | Which file to upload or copy where |
| [Building](docs/building.md) | Fonts, the build, and checks |

Colour tokens for every brand are in [`tokens/`](tokens/), as CSS and JSON.

## Build

Needs Node 24 and pnpm. The build also needs fonts that aren't in the repo; see [Building](docs/building.md).

```sh
pnpm install
pnpm build    # regenerate every asset
pnpm check    # rebuild, and fail if anything committed is out of date
pnpm verify   # no fonts needed: what CI runs
```

## Making changes

- Changes go through pull requests, and `check` has to pass. Run `pnpm check` first and commit the regenerated files with your change.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org): `feat:` for a new or changed asset, plus `fix:`, `docs:`, `build:` and `ci:`.
- Other repos only pick up a change when they copy it in. The website, the plugin docs and the two game repos have a `brand:sync` script; everything else is copied by hand. [Where each file goes](docs/where-files-go.md) lists it all.
- A new product, server or plugin gets its own `scripts/<id>-brand.ts`, a folder, tokens and a guide in `docs/`, and an accent no other brand uses (compare OKLCH hues: the guides list them).

## Licence

All rights reserved. The logos, graphics, tokens and scripts are © Xena Studios and aren't licensed for other use. No font files are in the repo: Ethnocentric appears only as outlines, as its licence allows, and the other faces are under the [SIL Open Font License](https://openfontlicense.org).
