## What this changes

<!-- Which assets change, and why. Link the issue it fixes: "Fixes #123". -->

## Checklist

- [ ] The regenerated files are committed (`pnpm build`; CI's `check` fails otherwise)
- [ ] The guide in `docs/` and [where each file goes](https://github.com/xena-studios/brand/blob/main/docs/where-files-go.md) are updated for new, renamed or resized files
- [ ] A new brand or plugin uses an accent no other brand has

<!-- After merging: run the Release workflow when it's worth releasing. Links to `brand@1` (READMEs, Modrinth pages, the org profile) and brand.xenastudios.co follow the release; repos that copy files (website and the plugins' docs with `pnpm brand:sync`, airfields and mostwanted with `npm run brand:sync`) need a sync after it. -->
