# IMPL-EVAL, final round 2 — Tokens v2 S1b

**Verdict: PASS (implementation and local gates only). This is not READY: remote required checks are not certified.**

The only blocker from round 1 is fixed, and I read the evidence directly at the committed checkpoint `f12d6388d`. I made no edits and ran no shell commands.

## Round-1 blocker: fixed

- **The six token-only documents left the theme catalogue.** They now live in `docs/design-system/token-presets/{ledger,signal,glass,macos-27,apple-classic,fluent-2-web}/`. `docs/design-system/themes/` keeps only the full language specs, so the site's `parseTheme` loader never sees a non-conforming `DESIGN.md`.
- **The docs-site build passes.**
  - `clean-prose-check.log` records PASS with exit 0 at `f12d6388d`; `gitHead` equals `actualGitHead`.
  - The Lume build completes with 798 files and 253 rendered HTML pages, and the 93 registry artifacts build.
  - The provenance file list shows only the original theme pages under `design-system/themes/`.
- **The registry synchronizer** (`packages/fresh-ui/scripts/sync-theme-registry.ts`):
  - **Inventory guard (`:11-14`):** the import throws unless the names in `theme-items.json` exactly match `theme-${preset.id}` for every entry in `TOKEN_PRESETS`. This closes my earlier note that the two sets were never compared.
  - **Path resolution (`:20-26`):** a language uses `themes/<lang>` when its full spec exists, otherwise `token-presets/<lang>`. Only `NotFound` triggers the fallback; any other error is re-thrown.
  - Generated targets stay at `.agents/skills/fresh-ui-theme-<id>/`.
- **Tests:** `tests/registry-theme-docs.test.ts` checks:
  - every preset theme exists, and the count equals `TOKEN_PRESETS.length`;
  - each `DESIGN.md`/`SKILL.md` comes from one of the two allowed sources;
  - the embedded content is byte-identical to the canonical file;
  - the static `buildRegistry` artifacts carry exactly two documents per theme, plus the seed, matching the embedded bytes.

## Evidence read directly

| Gate | Result |
| --- | --- |
| Clean assets, prose, corpus, publish | PASS, exit 0, at `f12d6388d` |
| Clean quality gate | PASS at `f12d6388d` |
| docs:accuracy | PASS at `f12d6388d` |
| release:preflight | All four scans PASS |
| Root check (`root-check.json`) | 3,996 files in 34 batches, 0 failed batches, 0 findings |
| Token tests after the doc move (`post-doc-token-tests`) | 41 pass / 0 fail |
| Relocated theme-doc tests | 10 pass / 0 fail |
| `registry-complete-tests` | 283 pass / 0 fail |
| Already recorded and still valid | CLI token 10/0; 265-file package check with 0 findings; template lint 0; CSS baseline superset plus the 6,000-byte gzip cap; native publish budget |

The `check-assets-barrel` and root-check gaps I flagged in round 1 are resolved by the clean receipts and the real `root-check.json` report.

## Accepted, not called green

- **Runtime is UNPROVEN.** The Docker daemon is absent, which the owner allows. The one-pass suite was attempted and exited 1 at the prerequisite step, leaving 0 owned survivors; foreign resources were not touched.
- **Inherited audit findings are unchanged.** Doc lint still has the baseline 124 diagnostics, with the tokens entrypoint at 0. The JSR auditor's `contracts.json` @module finding is also unchanged.
- **The mixed emphasis source name is recorded A1/A2 debt.** It has an owner, a target, a cost and a gate, and the README documents the consumer limitation.
- **The contrast report stands at 531 failing pairs out of 9,132 uses.** The burn-down stays OPEN, and the PR keeps `Refs #2450`.

## Not certified here (separate conditions for READY)

1. Commit the evidence. After that commit, only run-directory files may differ from the `f12d6388d` source.
2. Move the PR out of draft and let CI run. Remote required checks are SKIPPED on the draft today.
3. Verify every required check is green at that exact final head.
4. Then post READY with the head and the paths to `failing-pairs.json` and `failing-pairs.md`. No labels and no merge; Cockpit merges.
