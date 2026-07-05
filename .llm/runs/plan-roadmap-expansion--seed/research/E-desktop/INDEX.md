# Topic E — external research (B3)

Distilled, cited external research feeding the six mandated research tasks in `specs/topic-E-desktop-deploy.md` §6.

## Files

| File | Covers | Feeds spec §6 task(s) |
| --- | --- | --- |
| `deno-desktop-full-surface.md` | Full `deno desktop` surface distilled from the 17 local doc pages already read (see `matrix/E-desktop/deno-desktop-docs-matrix.md`), citing the official Deno doc mirror. | #1 |
| `rfc14-nitro-packaging-prior-art.md` | Nitro `deno_server` preset, Tauri v2 updater (`latest.json`+Ed25519/Minisign), Electron/Squirrel updater prior art, and how each compares to `Deno.autoUpdate()`. | #5 |
| `turso-sync-offline-first.md` | Turso Sync (`pull()`/`push()`, Last-Push-Wins, `transform` hook), and its relationship to the tursodb single-writer constraint. | #6 |

Tasks #2 (issue graph), #3 (sdk link-mode + service seam), #4 (eis-chat option ladder) are
in-repo/GitHub-sourced and covered in `analysis/E-desktop/` instead — no external research was
needed for those beyond the live `gh issue view` fetches already recorded there.
