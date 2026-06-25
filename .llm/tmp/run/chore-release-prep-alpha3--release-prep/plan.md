# Plan — chore/release-prep-alpha3

Branch: `chore/release-prep-alpha3` (off `origin/main` `bc72364a`). One PR, two slices.
Archetype: none (no `packages/`/`plugins/` archetype surface beyond test fixtures). Overlays:
`SCOPE-docs.md` (Pages deploy) for Slice 1; supervisor/CI lane. Slice 2 touches `packages/cli`
test source → WSL Codex daemon-attached.

## Locked decisions

### D1 — Docs deploy from `main`, version from manifest (user directive, 2026-06-25)
The docs site lives on and deploys from `main`; `docs/user-site` is preview-only/stale. The version
is read from the repo manifest (`packages/cli/deno.json` via `docs/site/_data.ts` — already built,
F1). No fetch-from-JSR, no per-release branch sync. Confirmed achievable with zero new code on the
docs side (F1/F2).

### D2 — Slice 1: add `.github/workflows/pages.yml` to `main` (CI lane)
New workflow on `main`:
```yaml
on:
  push:
    branches: [main]
    paths: [docs/site/**, .github/workflows/pages.yml]
  release:
    types: [published]
  workflow_dispatch:
```
- Permissions: `contents: read`, `pages: write`, `id-token: write`. Concurrency group `pages`,
  `cancel-in-progress: false` (mirror the docs/user-site original + `e2e-cli-prod.yml`/`publish.yml`
  release pattern).
- Build job: checkout → `denoland/setup-deno@v2` (`deno-version: '2.9.0'`, matching the #128
  toolchain pin — NOT `v2.x`) → in `docs/site`: `deno task build` → `deno task check:links` →
  `deno task check:caveats` → `actions/upload-pages-artifact` (path `docs/site/_site`).
- Deploy job: `actions/deploy-pages` to the `github-pages` environment.
- Port the build/deploy steps **verbatim** from `docs/user-site:.github/workflows/pages.yml` so the
  only deltas are the trigger block + the pinned Deno version. The deployed content is identical
  (F2: 0 divergence) — this changes only *when/where* it builds, not *what*.
- Because the docs build reads `releaseVersion` from `main`'s manifest, a release (whose tag points
  at the bumped `main`) rebuilds docs showing `alpha.3` automatically — concurrent with `publish.yml`
  is fine (manifest, not JSR, is the version source, so no ordering dependency).

### D3 — Slice 2: scaffold version zero-drift in CLI test fixtures (WSL Codex)
Replace every hardcoded `@0.0.1-alpha.2` literal in the test files listed in research F4 with a
value **derived** from `NETSCRIPT_RELEASE_VERSION` (import from
`packages/cli/src/kernel/constants/jsr-specifiers.ts`) — e.g. build expected specifiers as
`` `jsr:@netscript/fresh@${NETSCRIPT_RELEASE_VERSION}` `` or reuse
`netscriptJsrSpecifier(...)` where the test is asserting exactly that function's output. Update the
`import-resolver.ts:164` doc-comment to a version-neutral phrasing (e.g. `@<release>`), not a pinned
literal.
- Add ONE guard test (e.g. `packages/cli/src/kernel/constants/version-drift_test.ts`) that greps the
  CLI `src/**` tree (excluding `deno.json`) and FAILS if any literal `@0.0.1-alpha.N` JSR specifier
  reappears — so future drift can't silently return.
- Do NOT touch `packages/cli/deno.json:3` or `packages/cli/e2e/deno.json:3` (legitimate version
  source rewritten by `bump-version`).
- Zero-cast rule holds (only the 2 accepted casts). No source/runtime behavior change — test-only +
  one doc comment.

## Gates
- Slice 1 (CI): YAML lint via the workflow being syntactically valid; the authoritative proof is the
  workflow appearing in `gh workflow list` after merge + a successful `workflow_dispatch` dry run.
  `actionlint` if available. No `deno`/`packages` impact.
- Slice 2 (CLI tests): `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx`,
  `run-deno-lint.ts` same root, and **the decisive proof**: temporarily bump locally
  (`deno bump-version prerelease`), run `deno test packages/cli` (the touched suites must stay
  green at the bumped version), then revert the local bump. Document the bumped-green evidence in
  worklog.md.
- Repo-wide: `deno task check` + `deno task publish:dry-run` clean; `deno.lock` unchanged (no churn).
- Do NOT run the expensive `e2e:cli scaffold.runtime` here — not required for a CI-config + test-only
  change; it runs at release time via `e2e-cli-prod.yml`.

## Sequencing
1. Slice 2 (Codex) — test fixtures + guard, prove green-at-bumped-version, commit.
2. Slice 1 (Codex) — `pages.yml` on main, commit.
3. Push branch, open PR, IMPL-EVAL (OpenHands qwen3.7-max, separate session).
4. On PASS + green CI → merge to main.
5. THEN (separate step, not this PR): `deno bump-version prerelease` on a release branch → PR →
   merge → tag `v0.0.1-alpha.3` + GitHub Release → fires publish.yml + e2e-cli-prod.yml + pages.yml.

## Design checkpoint
Both slices are low-risk and verifiable. The release-critical insight: F1/F2 mean the only thing
gating the release is the missing `main:pages.yml` (D2) and the test-fixture bump-safety (D3).
Everything else (#112's dynamic version, deploy-from-main, env allow-list) is already in place.
