# Where each file goes

## Synced automatically

These repos copy brand files in with their `brand:sync` script (`pnpm brand:sync`, or `npm run brand:sync` in the game repos). Run it after a change here merges.

| Repo | What it takes |
|---|---|
| [website](https://github.com/xena-studios/website) | Favicon, iOS icon, link preview, logos, horizon, product marks, plugin icons, MostWanted's wordmark and key art. It has nothing for Airfields yet |
| [plugins](https://github.com/xena-studios/plugins) (in `docs/`) | The docs site's logo, favicon, plugin icons and link preview (`social/docs-og.png`) |
| airfields (private, `brand/`, with `npm run brand:sync`) | `airfields/` and `airfields/themes/`: the wordmark, monogram, icons and server icon, permanent and per season, each season's pixel scene and key art (`scene*.png`, `banner-scene.png`, `key-art.png`, `scene.json`, the depth layers in `layers/`), and `tokens/airfields.json`. The game repo builds its site art, link previews, Discord banners and README banner from them |
| mostwanted (private, in `website/`) | `logo/xena.svg`, for the site's footer. Its own icons, banners and key art are made in the game repo and copied back into `mostwanted/official/` |

## Copied by hand

| Where | File |
|---|---|
| GitHub org avatar, Modrinth org icon | `avatar/avatar.png` |
| Org profile header (`.github` repo) | `social/x-header.png`, as `profile/assets/header.png` |
| Org profile logos and icons (`.github` repo) | `raptor/logo-dark.png`, `raptor/logo-light.png`, `neoskript/logo-dark.png`, `neoskript/logo-light.png`, `<id>-icon.png` from `mostwanted/icon.png`, `airfields/icon.png` and `plugins/<id>/icon.png`, into `profile/assets/` |
| X / Twitter and Discord | `social/x-header.png`, `social/discord-banner.png` |
| Google Workspace | `workspace/logo.png` |
| Team profile photos | `people/<name>.png` |
| MostWanted avatar and favicon | Made in the game repo (`mostwanted/official/icon.png`, `favicon.png`) |
| Airfields Discord icon, bot avatar, store logo | `airfields/icon.png`, or `airfields/themes/<id>/icon.png` while that season runs |
| Airfields listings and video thumbnails | `airfields/themes/<id>/key-art.png` while that season runs |
| Modrinth icons and description banners | `neoskript/icon.png`, `neoskript/banner.png`, `plugins/<id>/icon.png`, `plugins/<id>/banner.png` |

## README banners

Each repo keeps its banner at `.github/assets/banner.png`.

| Repo | File |
|---|---|
| raptor | `raptor/banner.png` |
| neoskript | `neoskript/banner.png` |
| mostwanted | `mostwanted/banner.png` |
| airfields | Built in the game repo from the synced files (`brand/out/banner-1600x500.png`) |
| plugins | `github/plugins-banner.png`, plus `plugins/<id>/banner.png` per plugin and `github/plugin-docs-banner.png` for `docs/` |
| website | `github/website-banner.png` |
| .github | `github/dotgithub-banner.png` |
| brand | `github/brand-banner.png` (used directly) |

## Social previews

Upload in each repo under **Settings → General → Social preview**. GitHub has no API for this, so it's always by hand.

| Repo | File |
|---|---|
| brand, website, .github | `github/brand.png`, `github/website.png`, `github/dotgithub.png` |
| plugins | `github/plugins.png` |
| neoskript, mostwanted | `neoskript/social.png`, `mostwanted/social.png` |
| airfields | `airfields/social.png` |
| raptor | Made in its own repo |
