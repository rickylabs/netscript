# Research — refactor-303-slow-types-elimination--codex

## Re-baseline

- Carried-in source: issue #303 slice brief and the four existing T4 debt entries.
- Re-derived against required baseline `eac57c5f5ac4c10b9c1cc5b17874ae821b27a20d` on 2026-07-12.
- Changed fact: all four packages already pass Deno 2.9 publish analysis without
  `--allow-slow-types`; only their task strings and debt records remain stale.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The required branch and baseline are active and the opening worktree is clean. | `git -C /home/codex/repos/ns-b9-303 rev-parse HEAD`, `branch --show-current`, `status --short` |
| 2 | `service`, `plugin-triggers-core`, `plugin`, and `contracts` each exit 0 from a package-local no-flag dry-run. | `deno publish --dry-run --allow-dirty` from each package root |
| 3 | No slow-type diagnostic requests an annotation on the current tree. | The four raw dry-run results; each reaches `Success Dry run complete` |
| 4 | Exactly four package tasks still contain the obsolete carve-out. | The four package `deno.json` files named by the brief |
| 5 | Matching open T4 debt entries exist for the same four packages. | `.llm/harness/debt/arch-debt.md` |
| 6 | The root workspace publisher independently hard-codes a global slow-types waiver. | `.llm/tools/release/publish-workspace.ts` `baseArgs` |

## jsr-audit surface scan

- Surface scanned: every export map in the four `deno.json` files plus `deno doc mod.ts` for each
  default entrypoint.
- Slow-type risk: none observed on Deno 2.9. No source annotation or public-surface redesign is
  justified by current diagnostics.
- Other publish warning: `@netscript/plugin` reports two pre-existing unanalyzable dynamic-import
  warnings. They are not slow-type failures and are outside this slice; the dry-run exits 0.

## Open questions

- None that force rework. The current diagnostics resolve the brief's conditional annotation path.
