# PLAN-EVAL — chore-release-one-shot--tooling

- Plan evaluator session: openhands / minimax-M3 / 2026-06-29
- Run: `chore-release-one-shot--tooling`
- Branch: `chore/release-one-shot` (off `origin/main`)
- Surface / archetype: **SCOPE-tools** — `.llm/tools/`, `.github/workflows/`, new skill. Repo/harness
  tooling (NOT package/plugin framework code).
- Scope overlays: WSL Codex daemon-attached implementation lane; harness evaluator separation.
- Baseline: alpha.11 shipped (verified against current `main`).
- Trigger metadata: action_run `28304587059`, PR `#164`, output_mode `pr-comment`,
  model `openrouter/minimax/minimax-m3`.

## Spot-checks against current `main` (research.md re-baseline)

| Claim (research.md)                                                                     | Verified |
| --------------------------------------------------------------------------------------- | -------- |
| `.llm/tools/deps/bump-version.ts` is a thin shim over native `deno bump-version`         | ✓        |
| `.llm/tools/deps/prod-install.ts:28` builds `['ci','--prod','--frozen']`                | ✓        |
| Deno 2.9.0 rejects `deno ci --frozen` with `unexpected argument '--frozen' found`        | ✓ (live) |
| Both `publish.yml` and `e2e-cli-prod.yml` trigger on `release: types:[published]`       | ✓        |
| `agentic:sync-claude` regenerates `.claude/skills/` from `.agents/skills/`               | ✓ (deno.json:51–52) |
| `deno bump-version prerelease` at workspace root bumps 32 members (27 pkg + 5 plugin)   | ✓ (live, copy of main) |
| `deno bump-version` at workspace root does **NOT** update root `deno.json` `"version"`    | ✓ (live) |
| `deno bump-version` does NOT update `deno.lock` `@netscript/*` ranges                     | ✓ (live) |
| `deno.lock` v5 is JSON; sed `0.0.1-alpha.11` → `0.0.1-alpha.12` leaves it valid for `deno ci` (exit 0) | ✓ (live) |

## Per-decision findings (D1–D6)

### D1 — `deno task release:cut` orchestrator (issue #122) — **PASS**

The plan's "two gaps" framing is **empirically confirmed**:
- `deno bump-version prerelease` at the workspace root updates the 32 member `deno.json` files but
  **does not** update the root `deno.json` `"version"` field (live-confirmed on a copy of main;
  root stayed at `0.0.1-alpha.11` after the bump, members went to `0.0.1-alpha.12`).
- `deno.lock` `@netscript/*` ranges are **not** touched by `bump-version` either (live: 43
  `@netscript/*` refs in the lockfile, all stayed `0.0.1-alpha.11`).

The plan's fill-in (root `deno.json` write + sed-rewrite `deno.lock` `@netscript/*` ranges) is the
right call. The lock-rewrite safety claim (no `deno cache --reload`, no lock deletion — AGENTS.md
rule 6) is **empirically sound**: after sed-rewriting the version string in a copy of the live lock,
`deno ci` exits 0 (only unrelated npm build-script warnings).

The residue check (step 3: `git grep -nE '<old-version>'` across `*.json` + `deno.lock`) is
defense-in-depth for sed misses and is correct.

No additional members would be missed by the plan's `packages/*` + `plugins/*` globbing (verified
27 packages + 5 plugins = 32 members, matches live count). The plan's "27 + 5 = 32" math is correct
once you accept that `cli-e2e` is a workspace member too (the plan does not miscount; the table in
research.md does not enumerate, but the live count matches the workspace array).

### D2 — Drop `--frozen` from `deps:prod-install` (issue #146) — **PASS**

Empirically verified on Deno 2.9.0 at `/opt/hosted-toolchain/deno/2.9.0/x64/deno`:
- `deno ci --frozen` → `error: unexpected argument '--frozen' found` (exit 1)
- `deno task deps:prod-install` → same error in 10ms

Single source location: `.llm/tools/deps/prod-install.ts:28`. Plan correctly identifies the only
fix site. The doc comment at lines 6–7 of `prod-install.ts` also says `--frozen` is implied by `ci`
and desired — this comment must be **replaced** (not just removed), since the new behavior is
"remove the flag entirely, rely on `deno ci` being implicitly frozen" — i.e., the rationale survives
but the flag doesn't. The plan does not explicitly call out the doc-comment rewrite; it is implied
by "remove `--frozen` from the args" but worth pinning in the slice.

`.llm/tools/README.md:99` mentions `--frozen` in passing — must update for consistency. (Plan
implies; not explicit.)

### D3 — Text-import preflight gate (issue #133) — **FAIL_PLAN** (root cause)

The plan's pattern set:
> `Deno.readTextFile(`/`Deno.readFile(` and `fromFileUrl(`/`import.meta.resolve(`/new URL(..., import.meta.url)` used to READ shipped asset files

This has **two distinct problems** that would force rework at IMPL time:

**(a) Over-broad — flags non-reads.** `fromFileUrl(`, `import.meta.resolve(`, and bare
`new URL(..., import.meta.url)` are not reads. They are URL/path constructors and resolvers. On the
current tree:
- `new URL(..., import.meta.url)`: **21 hits** across `packages/` + `plugins/` source — most are
  HTTP URL composition (openapi), fresh route module IDs, test-fixture path constants, and
  `fromFileUrl(new URL(...))` chains (not reads).
- `fromFileUrl(`, `import.meta.resolve(`: similarly common in worker/import composition paths.

Including them turns a single false-positive into ~21+ flagged lines, none of which are actual
bundled-asset reads. The plan's "allowlist legitimate runtime FS use in CLI scaffold I/O via an
explicit ignore list / annotation" mitigation is **vague and unbounded**: it does not pin which uses
are legitimate, so the IMPL session would either ship a giant noisy baseline or ship a false-
positive-prone filter.

**(b) Under-broad — misses the historical prod-CLI break class.** The locked rule "JSR-safe asset
embedding = text imports" was authored because of failures like `openapi.ts:29 → 155`:

```ts
// line 29
const scalarJsUrl = new URL('../../assets/scalar.min.js', import.meta.url);
// line 155 (different line)
const scalarJs = scalarJsCache ?? await Deno.readTextFile(scalarJsUrl);
```

A line-by-line scan cannot connect `scalarJsUrl` (assigned on line 29) to `Deno.readTextFile(
scalarJsUrl)` (used on line 155). The plan's pattern set catches only the **inline** form:
`Deno.readTextFile(new URL(...))` on a single line. There is exactly **one** such match in the tree
(`packages/service/tests/_fixtures/readme-examples_test.ts:3`, in a test file), which is the wrong
file class and the trivial case. The real production violation (`openapi.ts:29 → 155`) is not
caught.

**Required fixes before PASS**:

1. Narrow the pattern set to actual reads only: `Deno.readTextFile(<arg>)` and
   `Deno.readFile(<arg>)` where `<arg>` resolves to a `new URL(..., import.meta.url)`-derived
   value. Drop `fromFileUrl(`, `import.meta.resolve(`, and bare `new URL(..., import.meta.url)`.
2. Lock the cross-line detection approach in the plan. Two viable patterns:
   - **Two-pass scan**: pass 1 collects `const <name> = new URL(..., import.meta.url)` assignments;
     pass 2 flags `Deno.readTextFile(<name>)` / `Deno.readFile(<name>)` references. Simple,
     regex-only, catches the `openapi.ts:29 → 155` case.
   - **AST scan** via Deno's `ts-morph` or `deno_ast`. More robust but heavier. Likely overkill.
   Recommend the two-pass scan; pin it in the plan.
3. Add a unit-test fixture that mimics the cross-line `openapi.ts:29 → 155` pattern (variable
   assigned to a URL, then read in a different function) — this is the **real** positive fixture.
4. Add D3 false-negative (cross-line) to the plan's risk register with mitigation = two-pass scan.

Without these, S2 will either ship a tool that floods CI with false positives on every run, or
ship a tool that misses the exact class of bug it was written to catch. Either outcome undoes the
intent of #133.

### D4 — `workflow_run` gate on `e2e-cli-prod` (issue #123) — **PASS** (with IMPL-level nit)

- `REPLACE` (not "ADD") the `release: types:[published]` trigger on `e2e-cli-prod.yml` is the right
  call — confirmed against current `main`: `e2e-cli-prod.yml` currently has both `release:` and
  `workflow_dispatch:` triggers. After the change, only `workflow_run: workflows:["publish"],
  types:[completed]` + `workflow_dispatch` remain. **No double-fire.**
- Job-level guard `if: github.event_name == 'workflow_dispatch' || github.event.
  workflow_run.conclusion == 'success'` correctly skips publish failures.
- `workflow_dispatch` manual path is preserved with `published-version` input.
- Concurrency group `e2e-cli-prod-${{ github.workflow }}-${{ github.ref }}` + the new
  `workflow_run` trigger handle re-runs correctly (cancel-in-progress is false but the group still
  serializes per-ref runs).
- **Race-free**: `workflow_run: completed` only fires AFTER the publish run ends. Combined with
  the `conclusion == 'success'` guard, e2e-cli-prod runs only after a successful publish — no JSR
  race. ✓

**IMPL-level nit (not a Plan-Gate fail)**: the plan says "resolve the version from the publish run's
release tag (`github.event.workflow_run.head_branch` / associated release)". The `workflow_run`
event payload does NOT expose `inputs` or job outputs from the triggering run. Realistic options
for the IMPL session:

- `gh api repos/:owner/:repo/releases/tags/<tag>` — but you need the tag first.
- Parse `github.event.workflow_run.display_title` (often the release title, e.g. "v0.0.1-alpha.11")
  — fragile.
- `gh api repos/:owner/:repo/actions/runs/<id>` to fetch the resolved `tag` from a step output —
  not exposed in the API; step outputs are not queryable post-hoc.
- Look up the release by querying `gh release list --json tagName --limit 1` (only the latest, racey
  on concurrent releases).

The cleanest option is for the publish job to **also** emit an artifact (e.g., a `version.txt` file
with the resolved version) that e2e-cli-prod downloads via `actions/download-artifact`. But this
requires `actions/upload-artifact` in `publish.yml`, which the plan does not call out. Worth
flagging at IMPL time so the version-resolution step has a concrete, non-racy implementation.

### D5 — New `netscript-release` skill — **PASS** (with wording nit)

Plan: "New `.agents/skills/netscript-release/SKILL.md` (and mirror to `.claude/skills/` per the
generated-mirror rule)".

The wording "mirror to `.claude/skills/`" suggests a hand-edit step. The repo's operating rule
(per `.llm/tools/README.md` and `CLAUDE.md`) is:
> edit `.agents/skills/` source, never hand-edit the `.claude/skills/` mirror

`.claude/skills/` is regenerated by `deno task agentic:sync-claude` and gated by
`deno task agentic:sync-claude:check`. The IMPL session must add the skill to `.agents/skills/`,
run `agentic:sync-claude`, and verify with `agentic:sync-claude:check` (which is in turn gated by
`docs:maintenance`). A hand-mirror would either be silently overwritten at next sync, or fail
`agentic:sync-claude:check` drift detection.

This is a wording-level nit, not a Plan-Gate fail — the IMPL session will see `CLAUDE.md` and the
README and do the right thing. But for clarity, the plan should explicitly say "add to
`.agents/skills/` and run `agentic:sync-claude` (gated by `agentic:sync-claude:check`)". S5 should
list `agentic:sync-claude:check` as one of its slice gates.

### D6 — Non-goals — **PASS**

Keeping the GitHub-Release-triggered OIDC publish (not a local `deno publish`) is the correct call
for two reasons:
1. The current `publish.yml` already has OIDC provenance (`id-token: write`, `contents: write`).
   Local `deno publish` would lose this.
2. The e2e-cli-prod race fix (D4) explicitly relies on `workflow_run` chaining off the publish
   workflow — moving publish local breaks the chain.

No auto-tag (so the merge gate stays explicit) and no new type casts are consistent with the
repo's discipline.

## Scope / lane / slice verdict

- **Scope**: `.llm/tools/` + `.github/workflows/` + new skill is harness tooling, not
  `packages/`/`plugins/` framework code → WSL Codex implementation lane is correct.
- **Slices** (5 total, well under the 30 limit):
  - S1 (D2): smallest, unblocks gate. ✓
  - S2 (D3): preflight + wiring + test. **Needs rework per D3 fixes above before implementation.**
  - S3 (D1): orchestrator + dry-run proof. ✓
  - S4 (D4): workflow change + actionlint. ✓
  - S5 (D5): skill + AGENTS.md + sync-claude. ✓
- **Gates**: lint + fmt + run-deno-check + unit tests + `release:cut --dry-run` proof +
  actionlint. Includes the explicit `--dry-run` proof of the bump path (S3), which is the right
  gate for D1.
- **Slices are independently committable**: each slice's diff is scoped to its decision (S1: 1 file;
  S2: 1 tool + 1 task + 1 workflow line; S3: 1 tool + 1 task; S4: 1 workflow; S5: 1 skill + 1
  AGENTS.md line). ✓

## Open-decision sweep (evaluator-run)

| Decision the plan left open                                                                                         | Forces rework if deferred? | Required fix                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| D3 pattern scope (over-broad — `fromFileUrl`/`import.meta.resolve`/bare `new URL`)                                  | **YES**                    | Lock the scan to `Deno.readTextFile(<arg>)` and `Deno.readFile(<arg>)` only; drop the other three from the pattern set. The IMPL session would otherwise ship a tool that flags 21+ non-reads in the current tree.                                                                                                                                                                          |
| D3 cross-line detection (under-broad — misses `openapi.ts:29 → 155`)                                                | **YES**                    | Pin the two-pass scan (collect `const <name> = new URL(..., import.meta.url)`; flag `Deno.readTextFile(<name>)` / `Deno.readFile(<name>)`). Add a positive fixture that mirrors the production case. The IMPL session would otherwise ship a tool that misses the exact class of bug #133 was authored to catch.                                                                                  |
| D4 version resolution from `workflow_run` event (no concrete API endpoint)                                         | NO (workable at IMPL)      | Suggest `actions/upload-artifact` in `publish.yml` (e.g., `version.txt`) + `actions/download-artifact` in `e2e-cli-prod.yml`. Pin in the plan or leave for IMPL; either way, NOT a Plan-Gate fail.                                                                                                                                                                                          |
| D5 "mirror to `.claude/skills/`" wording                                                                            | NO (correctable at IMPL)   | Plan should explicitly say "add to `.agents/skills/`, run `agentic:sync-claude`, gate via `agentic:sync-claude:check`". Correctable in S5; not a Plan-Gate fail.                                                                                                                                                                                                                              |
| D2 doc-comment + README rewrites for `--frozen`                                                                     | NO                         | Plan implies but does not enumerate. Slice S1 should explicitly include `.llm/tools/README.md:99` and the doc comment at `prod-install.ts:6–7`. Not a Plan-Gate fail; harmless if discovered at IMPL.                                                                                                                                                                                       |
| Risk register — D3 false-negative risk                                                                              | **YES**                    | Add a risk entry: "D3 cross-line miss class (e.g. `openapi.ts:29 → 155`); mitigation = two-pass scan + cross-line positive fixture". The gate item is "Risk register. Risks listed with mitigations."                                                                                                                                                                                         |

## Checklist results

| Plan-Gate item                          | Result     | Evidence / location                                                                                |
| --------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| Research present and current            | **PASS**   | `.llm/tmp/run/chore-release-one-shot--tooling/research.md` (62 lines), re-baselined vs main (line 4). Spot-checks above. |
| Decisions locked                        | **PASS**   | D1–D6 all present with rationale.                                                                  |
| Open-decision sweep                     | **FAIL**   | D3 pattern scope + D3 cross-line detection are unaddressed open decisions that force rework.       |
| Commit slices (< 30, gate + files each) | **PASS**   | 5 slices; each names files + proving gate.                                                          |
| Risk register                           | **FAIL**   | D3 false-negative risk (cross-line miss class) not enumerated; mitigation missing.                  |
| Gate set selected                       | **PASS**   | run-deno-check, run-deno-lint, run-deno-fmt, unit tests, `release:cut --dry-run`, actionlint.      |
| Deferred scope explicit                 | **PASS**   | D6 non-goals enumerated (no local publish, no auto-tag, no new casts).                              |
| jsr-audit surface scan (pkg/plugin)     | **N/A**    | This is SCOPE-tools (harness/repo tooling), not a package/plugin wave. The preflight tool's *output* gates JSR publishability, which is what F-6 covers for downstream cuts — but the plan itself doesn't change package surfaces. |

## Verdict

`FAIL_PLAN`

### Required fixes (cycle 1 of 2)

1. **D3 pattern scope — narrow to reads only.** Rewrite the plan's pattern list to scan only
   `Deno.readTextFile(<arg>)` and `Deno.readFile(<arg>)` calls. Drop `fromFileUrl(`,
   `import.meta.resolve(`, and bare `new URL(..., import.meta.url)` from the scan. Update the unit
   tests to reflect the narrower pattern (the only inline `new URL(...)+readTextFile` case in the
   tree is `packages/service/tests/_fixtures/readme-examples_test.ts:3`, which is a test file and
   may be excluded by the "publishable members" filter — if so, the inline fixture must be
   synthetic).
2. **D3 cross-line detection — pin the two-pass approach.** Specify that the tool collects
   `const <name> = new URL(..., import.meta.url)` assignments first, then flags `Deno.readTextFile
   (<name>)` / `Deno.readFile(<name>)` references. Add a positive fixture that mimics
   `openapi.ts:29 → 155` (URL declared on one line, read on another). This is the load-bearing
   fixture for #133; without it, the preflight can be silently green on a real violation.
3. **D3 risk register entry.** Add an explicit risk: "D3 cross-line miss class (e.g.
   `openapi.ts:29 → 155`); mitigation = two-pass scan + cross-line positive fixture".

### Optional clarifications (non-blocking)

4. **D4 version resolution** — either pin a concrete approach (recommend `actions/upload-artifact`
   in `publish.yml` + `actions/download-artifact` in `e2e-cli-prod.yml`) or explicitly defer to
   IMPL. Either way, the IMPL session should not have to invent the lookup strategy.
5. **D5 `.claude/skills/` wording** — replace "mirror to `.claude/skills/`" with "add to
   `.agents/skills/`, run `deno task agentic:sync-claude`, gate via `deno task agentic:sync-claude
   :check`".
6. **D2 doc-comment + README** — explicitly list `.llm/tools/README.md:99` and
   `prod-install.ts:6–7` in S1's file list (replace the `--frozen` claim in the rationale, since
   the rationale — frozen is desired — survives, but the flag does not).

After the plan addresses fixes 1–3, I will issue `PASS` on cycle 2.

## Notes

- The plan is **substantively correct** for D1, D2, D4, D5, D6 and the scope/lane. The single
  decision that blocks PASS is D3's scan-pattern design — and D3 is the gate the rest of the
  release flow depends on, so getting it right at PLAN level (not IMPL level) is the right place
  to pay the cost.
- D1's lock-rewrite safety is **empirically verified** on a live copy of main (32-member bump +
  sed + `deno ci` exit 0). The plan's confidence here is justified.
- D4's race analysis is correct. The version-resolution nit is the only thing I'd flag for IMPL
  ergonomics; it does not affect Plan-Gate.
- Two `FAIL_PLAN` cycles allowed; this is cycle 1.
