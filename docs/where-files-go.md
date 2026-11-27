# Where each file goes

## Synced automatically

These repos copy brand files in with their `brand:sync` script (`pnpm brand:sync`, or `npm run brand:sync` in the game repos). Run it after a change here is released; the website's copies the latest release, by its tag.

| Repo | What it takes |
|---|---|
| [website](https://github.com/xena-studios/website) | Favicon, iOS icon, link preview, logos, horizon, product marks, plugin icons, MostWanted's wordmark and key art, Airfields' icon and its current season's key art |
| [tools](https://github.com/xena-studios/tools) | The studio's look, as xenastudios.co has it: `tokens/colors.css`, `logo/xena-studios.svg`, `logo/xena.svg`, `scene/horizon.svg`, `avatar/favicon.svg`, `avatar/apple-touch-icon.png`, `social/og-card.png` |
| [plugins](https://github.com/xena-studios/plugins) (in `docs/`) | The docs site's logo, favicon, plugin icons and link preview (`social/docs-og.png`) |
| airfields (private, `brand/`, with `npm run brand:sync`) | `airfields/` and `airfields/themes/`: the wordmark, monogram, icons and server icon, permanent and per season, each season's pixel scene and key art (`scene*.png`, `banner-scene.png`, `key-art.png`, `scene.json`, the depth layers in `layers/`), and `tokens/airfields.json`. The game repo builds its site art, link previews, Discord banners and README banner from them |
| mostwanted (private, in `website/`) | `logo/xena.svg`, for the site's footer. Its own icons, banners and key art are made in the game repo and copied back into `mostwanted/official/` |

## Copied by hand

| Where | File |
|---|---|
| GitHub org avatar, Modrinth org icon | `avatar/avatar.png` |
| X / Twitter and Discord | `social/x-header.png`, `social/discord-banner.png` |
| Google Workspace | `workspace/logo.png` |
| Team profile photos | `people/<name>.png` |
| MostWanted avatar and favicon | Made in the game repo (`mostwanted/official/icon.png`, `favicon.png`) |
| Airfields Discord icon, bot avatar, store logo | `airfields/icon.png`, or `airfields/themes/<id>/icon.png` while that season runs |
| Airfields listings and video thumbnails | `airfields/themes/<id>/key-art.png` while that season runs |
| Modrinth icons and description banners | `neoskript/icon.png`, `neoskript/banner.png`, `plugins/<id>/icon.png`, `plugins/<id>/banner.png` |

## Linking files

Pages that show a file from here without copying it (READMEs, Modrinth pages) link a **release**, through jsDelivr, pinned to the major version:

```
https://cdn.jsdelivr.net/gh/xena-studios/brand@1/badges/xena/compact/modrinth.svg
```

`@1` follows every v1.x release, so a fix or a new asset reaches every page once it's released, and a breaking change (v2) never does until the link says so. A file linked from `main` (`raw.githubusercontent.com/xena-studios/brand/main/...`) changes the moment anything merges here, with no release and no way back, so new links shouldn't use it. [Badges](badges.md) says which badges go where.

jsDelivr caches a version range for up to a week; [purge](https://www.jsdelivr.com/tools/purge) the file's URL to show a new release sooner.

## README banners

Every README shows its banner straight from a release, through jsDelivr (`https://cdn.jsdelivr.net/gh/xena-studios/brand@1/<file>`), as [Linking files](#linking-files) says, rather than a copy in the repo. The [org's README layout](https://github.com/xena-studios/.github#readme-layout) puts it first.

| Repo | File |
|---|---|
| raptor | `raptor/banner.png` |
| neoskript | `neoskript/banner.png` |
| mostwanted | `mostwanted/banner.png` |
| airfields | Built in the game repo from the synced files (`brand/out/banner-1600x500.png`), and kept there |
| plugins | `github/plugins-banner.png`, plus `plugins/<id>/banner.png` per plugin and `github/plugin-docs-banner.png` for `docs/` |
| website | `github/website-banner.png` |
| .github | `github/dotgithub-banner.png`, and the profile's header is `social/x-header.png` |
| hallow | `github/hallow-banner.png` |
| tools | `github/tools-banner.png` |
| brand | `github/brand-banner.png` (used directly) |

The org profile (`.github` repo) links its logos and icons the same way, and writes its plugin table from `tokens/plugins-catalog.json`.

## Social previews

Upload in each repo under **Settings → General → Social preview**. GitHub has no API for this, so it's always by hand.

| Repo | File |
|---|---|
| brand, website, .github, hallow, tools | `github/brand.png`, `github/website.png`, `github/dotgithub.png`, `github/hallow.png`, `github/tools.png` |
| plugins | `github/plugins.png` |
| neoskript, mostwanted | `neoskript/social.png`, `mostwanted/social.png` |
| airfields | `airfields/social.png` |
| raptor | Made in its own repo |
| raptor-status | `raptor/official/og.png`, Raptor's own link preview |
