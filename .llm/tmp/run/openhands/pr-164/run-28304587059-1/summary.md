# PLAN-EVAL — `chore/release-one-shot` (PR #164)

**Verdict: `FAIL_PLAN`** (cycle 1 of 2)

Evaluator session: openhands / `openrouter/minimax/minimax-m3` / 2026-06-29
Run: `chore-release-one-shot--tooling`
Branch: `chore/release-one-shot` (off `origin/main`); baseline alpha.11
Surface: SCOPE-tools (`.llm/tools/`, `.github/workflows/`, new skill)
Verifier: I am a separate evaluator session from the plan author. This is PLAN-EVAL only — no
source was committed.

## Summary

I read `.llm/tmp/run/chore-release-one-shot--tooling/research.md` (62 lines, re-baselined vs main),
the full `plan.md` (D1–D6 design + S1–S5 slice plan + gate set), and ground-truthed every claim
against current `main` and against a live copy of the repo.

D1, D2, D4, D5, D6 are **sound**; the scope/lane is **correct** (WSL Codex for harness tooling); the
slices are **independently committable**; the gate set is **complete** (run-deno-check,
run-deno-lint, run-deno-fmt, unit tests, `release:cut --dry-run` proof, actionlint). The single
blocker is **D3 (text-import preflight, #133)**.

## What I verified live

- `deno bump-version prerelease` at workspace root bumps 32 members (27 packages + 5 plugins)
  but **does not** update root `deno.json` `"version"` and **does not** update `deno.lock`. Both
  gaps D1 calls out are real.
- `deno.lock` v5 is JSON; after `sed` rewrite of the 43 `@netscript/*` refs from
  `0.0.1-alpha.11` → `0.0.1-alpha.12`, `deno ci` exits 0. Lock-rewrite is safe without
  `deno cache --reload` / lock deletion.
- `deno ci --frozen` on Deno 2.9.0 rejects with `error: unexpected argument '--frozen' found`.
  `.llm/tools/deps/prod-install.ts:28` is the single source. D2's fix is correct.
- Both `publish.yml` and `e2e-cli-prod.yml` currently trigger on `release: types:[published]`
  concurrently — the JSR race D4 calls out is real.
- `agentic:sync-claude` regenerates `.claude/skills/` from `.agents/skills/`; `.claude/skills/` is
  generated, never hand-edited. The plan's S5 wording is a nit (see "Optional clarifications").

## Per-decision verdicts

| Decision | Issue      | Verdict | Notes                                                                                                              |
| -------- | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| D1       | #122       | PASS    | Workspace bump + root deno.json write + lock sed-rewrite + residue check + `deno ci` proof — all correct.          |
| D2       | #146       | PASS    | Single-line fix at `prod-install.ts:28`; rationale survives in the doc comment; README at line 99 also touched.    |
| D3       | #133       | **FAIL_PLAN** | Pattern set is over-broad **and** misses the cross-line case (see below).                                |
| D4       | #123       | PASS    | `workflow_run: completed` + `conclusion:success` guard is race-free; `workflow_dispatch` preserved; no double-fire. |
| D5       | (new)      | PASS    | Skill is correct; sync mechanism is the only nit (see "Optional clarifications").                                 |
| D6       | (non-goals)| PASS    | OIDC publish stays in `publish.yml`; no auto-tag; no new casts.                                                    |

## D3 — the failure (the only blocker)

The plan's pattern set:
> `Deno.readTextFile(/Deno.readFile(` + `fromFileUrl(/import.meta.resolve(/new URL(..., import.meta.url)` used to READ shipped asset files

**Two independent defects:**

### (1) Over-broad — flags non-reads

`fromFileUrl(`, `import.meta.resolve(`, and bare `new URL(..., import.meta.url)` are **URL/path
constructors**, not reads. In the current tree:

- `new URL(..., import.meta.url)`: **21 hits** across `packages/` + `plugins/` source.
- Most are HTTP URL composition (openapi), fresh route module IDs, test-fixture path constants,
  and `fromFileUrl(new URL(...))` chains — none of which are bundled-asset reads.

Including them turns a single false-positive into ~21+ flagged lines per run. The plan's "allowlist
legitimate runtime FS use via an explicit ignore list / annotation" mitigation is unbounded and
unpinned.

### (2) Under-broad — misses the historical prod-CLI break class

The actual violation pattern the locked rule was authored to prevent:

```ts
// packages/service/src/primitives/openapi.ts:29
const scalarJsUrl = new URL('../../assets/scalar.min.js', import.meta.url);
// ...
// packages/service/src/primitives/openapi.ts:155
const scalarJs = scalarJsCache ?? await Deno.readTextFile(scalarJsUrl);
```

A line-by-line scan cannot connect `scalarJsUrl` (assigned on line 29) to `Deno.readTextFile(
scalarJsUrl)` (used on line 155). The plan's pattern set catches only the **inline** form on a
single line. The real production violation is **not caught**.

The only inline `new URL(...)+readTextFile` case in the tree is
`packages/service/tests/_fixtures/readme-examples_test.ts:3`, which is a test fixture, not a
publishable surface — so even the inline-positive case is wrong-class.

## Required fixes (cycle 1)

1. **D3 — narrow the pattern set.** Scan only `Deno.readTextFile(<arg>)` and `Deno.readFile(<arg>)`
   calls. Drop `fromFileUrl(`, `import.meta.resolve(`, and bare `new URL(..., import.meta.url)` from
   the pattern list.
2. **D3 — pin the cross-line detection.** Specify a two-pass scan: pass 1 collects `const <name> =
   new URL(..., import.meta.url)` assignments; pass 2 flags `Deno.readTextFile(<name>)` /
   `Deno.readFile(<name>)` references. Add a positive fixture that mirrors `openapi.ts:29 → 155`
   (URL declared on one line, read on another).
3. **D3 — add the risk to the risk register.** "D3 cross-line miss class (e.g. `openapi.ts:29 → 155`);
   mitigation = two-pass scan + cross-line positive fixture."

## Optional clarifications (non-blocking)

- **D4** version resolution from `workflow_run` is workable but the API path isn't pinned. Pin in
  the plan or defer to IMPL. Recommend `actions/upload-artifact` (`version.txt`) in `publish.yml`
  + `actions/download-artifact` in `e2e-cli-prod.yml` for a non-racy lookup.
- **D5** wording — replace "mirror to `.claude/skills/`" with "add to `.agents/skills/`, run
  `deno task agentic:sync-claude`, gate via `deno task agentic:sync-claude:check`".
- **D2** file list — explicitly enumerate `.llm/tools/README.md:99` and `prod-install.ts:6–7` in
  S1 (the rationale survives, the flag doesn't).

## Changes

- **None** to source. Plan evaluation only.
- Created `.llm/tmp/run/chore-release-one-shot--tooling/plan-eval.md` (this verdict artifact).
- This `summary.md` (consumed by the workflow to post the PR comment).

## Validation

All spot-checks performed live against a copy of `origin/main` (post-`main` commit; pre-bump at
alpha.11) and against Deno 2.9.0 at `/opt/hosted-toolchain/deno/2.9.0/x64/deno`:

| Check                                                                      | Result |
| -------------------------------------------------------------------------- | ------ |
| `deno bump-version prerelease` updates 32 members                          | ✓      |
| `deno bump-version` does NOT update root `deno.json` `"version"`            | ✓      |
| `deno bump-version` does NOT update `deno.lock` `@netscript/*` ranges       | ✓      |
| `sed '0.0.1-alpha.11/0.0.1-alpha.12/' deno.lock` + `deno ci` → exit 0       | ✓      |
| `deno ci --frozen` on 2.9.0 → `unexpected argument '--frozen' found`        | ✓      |
| `publish.yml` + `e2e-cli-prod.yml` both trigger on `release: types:[published]` | ✓      |
| `new URL(..., import.meta.url)` in `packages/`+`plugins/`                   | 21 hits |
| `Deno.readTextFile(new URL(...))` on a single line                          | 1 hit (test fixture) |
| Cross-line `new URL` decl + `readTextFile` use (e.g. `openapi.ts:29 → 155`)  | ✓ found |

## Responses to PR comments

No PR comments were addressed by this evaluator pass. The verdict is directed at the plan author
for cycle 2.

## Remaining risks

- **D3 false-positives** if the plan is not narrowed: ~21+ false positives per run on the current
  tree. CI noise → ignores → missed real violations.
- **D3 false-negatives** if the cross-line case is not addressed: the historical prod-CLI break
  class slips through. The preflight tool is then silently green on a real violation, defeating
  #133's purpose.
- **D4 version lookup fragility** (non-blocking at PLAN level; flag for IMPL ergonomics).
