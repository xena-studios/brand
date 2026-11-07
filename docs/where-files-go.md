# Where each file goes

## Synced automatically

These repos copy brand files in with `pnpm brand:sync`. Run it after a change here merges.

| Repo | What it takes |
|---|---|
| [website](https://github.com/xena-studios/website) | Favicon, iOS icon, link preview, logos, horizon, product marks, plugin icons, MostWanted's wordmark and key art |
| [plugins](https://github.com/xena-studios/plugins) (in `docs/`) | The docs site's logo, favicon, plugin icons and link preview (`social/docs-og.png`) |

## Copied by hand

| Where | File |
|---|---|
| GitHub org avatar, Modrinth org icon | `avatar/avatar.png` |
| Org profile header (`.github` repo) | `social/x-header.png`, as `profile/assets/header.png` |
| Org profile logos and icons (`.github` repo) | `raptor/logo-dark.png`, `raptor/logo-light.png`, `neoskript/logo-dark.png`, `neoskript/logo-light.png`, `mostwanted/official/wordmark.png`, `plugins/<id>/icon.png`, into `profile/assets/` |
| X / Twitter and Discord | `social/x-header.png`, `social/discord-banner.png` |
| Google Workspace | `workspace/logo.png` |
| Team profile photos | `people/<name>.png` |
| MostWanted avatar and favicon | `mostwanted/icon.png`, `mostwanted/favicon.png` |
| Modrinth icons and description banners | `neoskript/icon.png`, `neoskript/banner.png`, `plugins/<id>/icon.png`, `plugins/<id>/banner.png` |

## README banners

Each repo keeps its banner at `.github/assets/banner.png`.

| Repo | File |
|---|---|
| raptor | `raptor/banner.png` |
| neoskript | `neoskript/banner.png` |
| mostwanted | `mostwanted/banner.png` |
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
| raptor | Made in its own repo |
