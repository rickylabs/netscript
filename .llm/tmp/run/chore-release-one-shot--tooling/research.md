# research.md — One-shot deterministic release automation

Run-id: `chore-release-one-shot--tooling`
Baseline: **origin/main** (alpha.11 shipped). Author/implement against origin/main, NOT any stale worktree.

## Problem (user mandate 2026-06-28)

Cutting a release currently costs the supervisor large token spend and hazardous trial-and-error:
each cut the supervisor hand-writes one-off `.sh` scripts, hits tooling bugs, and trial-and-errors
the publish/e2e ordering. A release must be ONE deterministic, gated command + a documented skill,
runnable by a cheap implementation agent — not Opus improvising scripts.

## Ground truth (verified)

Tooling files are current vs origin/main (Explore diff: `.llm/tools/deps/` + `run-publish-dry-run.ts`
show no diff). Workflow files in the stale worktree differ from main; trust LIVE main + the alpha.11
publish-run step list, not the stale worktree line numbers.

### Defect 1 — #122: version bump is not workspace-coordinated
- `deno task version:bump` → `.llm/tools/deps/bump-version.ts` is a thin wrapper over native
  `deno bump-version` with a `--cwd`. It bumps a single member/cwd; it does NOT coordinate:
  (a) root `deno.json` version, (b) every `packages/*/deno.json` + `plugins/*/deno.json`,
  (c) `deno.lock` `@netscript/*` ranges. Every release needs manual edits to root deno.json + lock.

### Defect 2 — #146: `deps:prod-install` passes a flag Deno 2.9 rejects
- `.llm/tools/deps/prod-install.ts` builds `['ci','--prod','--frozen']`. **LIVE on alpha.11 main,
  Deno 2.9.0**: `deno task deps:prod-install` → `error: unexpected argument '--frozen' found /
  Usage: deno ci --prod` and dies in 7ms before any install. `deno ci` is already frozen/clean by
  definition. Fix = remove `--frozen`. (The true gate `deno ci --prod` passes clean with no lock
  churn — verified live.) NOTE: an Explore pass misread this as "not a bug" because it only saw the
  flag present; it did not know Deno 2.9 rejects it. The bug is real.

### Defect 3 — #123: publish vs e2e-cli-prod race
- Both `.github/workflows/publish.yml` and `.github/workflows/e2e-cli-prod.yml` trigger on
  `on: release: types: [published]` concurrently. e2e-cli-prod installs `jsr:@netscript/cli@<ver>`;
  if it starts before publish finishes uploading to JSR, it pulls a missing/old version and fails.
  **Observed live on alpha.11**: the release-triggered e2e-cli-prod failed at `scaffold.plugin-list`
  (resolving `@netscript@alpha.11` from JSR before upload finished); a manual re-run AFTER publish
  completed passed clean. `concurrency.cancel-in-progress:false` does not enforce ordering.

### Defect 4 — #133: no text-import / publish preflight gate
- No static gate catches the class of bug that broke prod CLI repeatedly (modules reading bundled
  assets via `Deno.readTextFile(import.meta-relative)` / `fromFileUrl` / `resolve(bare)` instead of
  text import attributes — see the locked rule "JSR-safe asset embedding = text imports"). Today only
  `run-publish-dry-run.ts` (per-member `deno publish --dry-run`) runs; it does not catch this.

## Existing assets to reuse (do NOT reinvent)
- `run-publish-dry-run.ts` (per-member dry-run, catalog-materialized) — keep as a gate.
- `jsr-provision-packages.ts` (Ensure JSR packages exist) — already in publish.yml.
- `run-publish.ts` / workspace publish — the real publish, already in publish.yml.
- `jsr-set-package-settings.ts` (Apply JSR settings) — already in publish.yml.
- `release-readiness.ts` fitness roll-up — optional pre-gate.
- Release/tag/Release-creation is the GitHub Release event that drives publish.yml (OIDC). Keep that
  trigger model; do not move publishing into a local `deno publish` step.

## Constraints
- `.llm/tools/` is harness tooling, NOT framework `packages/`/`plugins/` source → WSL Codex implements.
- No new type casts. No lock deletion / no `deno cache --reload` without approval (the bump
  coordinator must update the lock deterministically without a forbidden reload — prefer
  `deno install`/`deno ci` lock refresh, or in-place `@netscript/*` range rewrite as version:bump
  already does for members, extended to root+lock).
- Stage files by explicit path. Push slice branch via explicit refspec.
