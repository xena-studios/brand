# Plugins

![xUtilities](../plugins/xutilities/banner.png)

The small plugins share one family look, endorsed by XENA STUDIOS.

<img src="../plugins/xutilities/icon.png" width="96" alt="xUtilities icon"> &nbsp; <img src="../plugins/zchat/icon.png" width="96" alt="zChat icon"> &nbsp; <img src="../plugins/xlimbo/icon.png" width="96" alt="xLimbo icon"> &nbsp; <img src="../plugins/xrewind/icon.png" width="96" alt="xRewind icon">

## The system

- **Icon:** a 16×16 pixel glyph (Minecraft's item size) on a `raised` tile with a soft glow in the plugin's accent. Every glyph is lit the same way and stays crisp on Modrinth.
- **Name:** the first letter in the accent and the rest in `text`, set in Space Grotesk Bold. Keep the lowercase prefix: xUtilities, zChat, xLimbo.
- **Banner:** XENA STUDIOS, the `//` kicker, the icon and name, a two-tone headline, and the horizon with a pixel-stepped rim.
- **Accent:** one per plugin, and never one that another brand uses.

**Adding a plugin:** `pnpm new-plugin <id> <Name> <category>` (such as `pnpm new-plugin xshop Shop Economy`) adds a placeholder glyph and an entry in [`scripts/plugin-brand.ts`](../scripts/plugin-brand.ts), marked `released: false`, with an accent picked to stay clear of every other Xena accent; it prints four more that would. Draw the glyph, write the headline, summary and blurb, then rebuild. `pnpm build:plugins` rebuilds only the plugin family, and doesn't need Ethnocentric: the family draws XENA STUDIOS from the committed `logo/xena-studios.svg`.

**The catalog:** [`tokens/plugins-catalog.json`](../tokens/plugins-catalog.json) has everything another repo needs to list the family: each plugin's name, category, tagline, blurb, Modrinth summary, whether it's released, its accent with a readable text colour and the docs' tints, and its icon and banner. The plugins repo copies it with `pnpm brand:sync` and builds its README, docs home page, sidebar and accents from it, so a plugin's words and colours are written once, here. `pnpm build` writes it, or `pnpm catalog` on its own. `pnpm verify` fails when it's out of date, and when two accents anywhere in the studio are under 0.07 apart in OKLab, the point where they read as one colour.

## Lineup

| Plugin | Accent | Glyph | Headline |
|---|---|---|---|
| **xUtilities** | `#F5B83D` amber | Wrench | Every command you need. *None you don't.* |
| **zChat** | `#5EE08A` green | Chat bubble | Format your chat. *Keep it clean.* |
| **xLimbo** | `#B48CFF` violet | Block over a glass floor | Never drop *a player again.* |
| **xRewind** | `#3DD6C6` teal | Rewind button | Every change, logged. *Any of it, undone.* |
| **xPlots** (not released yet) | `#A9D750` lime, OKLCH hue 126 | Signpost | Rentable plots, *set up in a minute.* |
| **xTeleport** (not released yet) | `#CE41E3` fuchsia, OKLCH hue 322 | Pin over the ring it lands in | Every teleport *your server needs.* |
| **xVote** (not released yet) | `#4D7BFD` cobalt, OKLCH hue 266 | A ticked ballot over its box | Votes in. *Rewards out.* |
| **xBans** (not released yet) | `#D70E3A` crimson, OKLCH hue 20 | Gavel on its block | Bans, mutes and warnings. *Nothing slips through.* |
| **xMoney** (not released yet; working name) | `#10AC79` emerald, OKLCH hue 163 | Coin | The economy and Vault, *in one plugin.* |
| **xStats** (not released yet) | `#3EC407` vivid green, OKLCH hue 140 | Podium | Every player's stats, *on your own website.* |
| **xBackup** (not released yet) | `#9EEDFD` ice, OKLCH hue 212, pale | Safe with its dial | Backups that cost nothing. *Restores you can trust.* |

A plugin that's being built can be marked `released: false` in [`scripts/plugin-brand.ts`](../scripts/plugin-brand.ts): it gets its own icon, banner and social preview, but stays off the family's cards and horizon until its first release.

### Modrinth titles and summaries

Modrinth's search ranks a word in the title above everything else, so each title is the name and what the plugin is. The summary is the line under it in search results.

| Plugin | Title | Summary |
|---|---|---|
| **xUtilities** | xUtilities: Lightweight Essentials | Lightweight essentials for Paper and Folia: gamemode, fly, speed, heal, feed, /back, /top and repair, with anvils, crafting tables and other workstations anywhere. Add your own link commands like /discord, and switch off any command. |
| **zChat** | zChat: Chat Formatting & Filter | Chat formatting per rank, a chat filter that's hard to dodge, mentions, private messages, cooldowns and anti-spam, in one light chat plugin. Each message is drawn once, however many players see it. For Paper and Folia. |
| **xLimbo** | xLimbo: Limbo & Fallback Server | A limbo and fallback server for Velocity and BungeeCord. When your main server goes down, players wait in a safe void world instead of being kicked, then go back with /join, or on their own once it's up. For Paper. |
| **xRewind** | xRewind: Block Logger & Rollback | Block logger and rollback, and a free CoreProtect alternative: see who placed, broke or took what, then preview a rollback and undo it. Uses CoreProtect's commands and imports its history. For Paper and Folia. |
| **xMoney** | xMoney: Economy & Vault Provider | An economy that is its own Vault: balances, /pay, /baltop and a ledger of every change, with the Vault and VaultUnlocked APIs built in, so shop and jobs plugins work without Vault.jar. Imports from EssentialsX, CMI or any Vault economy. For Paper and Folia. |
| **xBackup** | xBackup: Incremental Backups & Restore | Incremental backups for Paper and Folia: only what changed is stored, chunk by chunk, with a save pause of milliseconds. Copies to S3, WebDAV, SFTP, FTP, Google Drive, OneDrive and Dropbox, and restores from the command line or on the next start. |
| **xPlots** | xPlots: Rentable Plots | Rentable plots for box and PvP servers: select an area and it's split into a grid of plots, each with its sign. Players rent with Vault or an item, add members and pay ahead; expired plots reset themselves. For Paper. |
| **xTeleport** | xTeleport: Homes, TPA, Warps & RTP | Homes, TPA, warps, spawn and random teleport in one light plugin, with warmups, cooldowns and costs through Vault. Imports homes and warps from EssentialsX. For Paper and Folia. |
| **xVote** | xVote: Vote Rewards & Votifier | Vote rewards with a built-in Votifier for Paper and Folia: keeps NuVotifier's keys and tokens, rewards per site, streaks and every Nth vote, a vote party, leaderboards, and offline votes paid on join. Imports VotingPlugin and SuperbVote totals. |
| **xBans** | xBans: Bans, Mutes & Warnings | Bans, mutes, warnings and kicks for Paper and Folia, free and open source. Checked from memory at every join and chat message, with templates, staff limits, alts and IP bans. Uses LiteBans' commands and imports its history. |
| **xStats** | xStats: Player Stats, Leaderboards & Website | Player stats, leaderboards and a stats website your server hosts itself: playtime that leaves out AFK time, kills, blocks and any placeholder, with daily, weekly and monthly leaderboards, PlaceholderAPI and in-world boards. For Paper and Folia. |

## Colour

| Token | Hex | Role |
|---|---|---|
| `bg` | `#121116` | Banner background |
| `raised` | `#1B1A21` | Icon tile, planet body |
| `rule` | `#2A2832` | Borders |
| `text` | `#F2F0F5` | Names, headlines |
| `muted` | `#9C99A8` | Kickers, secondary text |

In [`tokens/plugins.css`](../tokens/plugins.css) (`--plugin-*`, plus `--plugin-<id>` for each accent) and [`tokens/plugins.json`](../tokens/plugins.json).

## Type

- **Space Grotesk** Bold for names and headlines.
- **JetBrains Mono** for kickers and labels.

## Files

| File | Size | Use |
|---|---|---|
| `plugins/<id>/icon` | 512×512 | Modrinth icon |
| `plugins/<id>/banner` | 1920×600 | Modrinth description and README banner |
| `plugins/<id>/social` | 1280×640 | GitHub social preview |
| `plugins/horizon` | 2400×900 | The family horizon alone: the docs home page |
| `social/docs-og` | 1200×630 | docs.xenastudios.co link preview |
