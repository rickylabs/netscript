# IMPL-EVAL — PR #817 (prod E2E inner min-dep-age follow-up)

- **Verdict: PASS**
- Evaluator: Claude · Opus 4.8 · high (`review_codex_light`, supervisor-dispatched; opposite-family
  to the Codex Sol·low generator; separate session)
- Subject: worktree `/home/codex/repos/b10-minage`, branch `fix/e2e-prod-inner-min-dep-age` @
  `36626863`, base `main` @ `2a1c8ed9` (squash-merge of #813)
- Skills: netscript-harness, netscript-cli, netscript-tools, rtk
- Protocol: `evaluator/protocol.md` (IMPL-EVAL) + `verdict-definitions.md`
- Archetype: 6 — CLI / Tooling; owned surface is an E2E command builder (no product surface)

## Rationale

The single locked slice (S1: swap the one published-JSR AI-lifecycle `deno x jsr:…/cli` invocation
for a direct `deno run https://jsr.io/@netscript/plugin-ai/<version>/cli.ts`, assert the full command
array, defer product mitigation) is complete and correctly bounded. The root-cause mechanism is
independently verified by live reproduction, the semantic test asserts the full command array and
fails-closed, the decisive consumer proof reproduces green, no product source is touched, and no
suppression or doctrine violation is introduced. Every `PASS` condition in
`verdict-definitions.md` is met.

## Probe results

| # | Probe | Result | Evidence |
|---|-------|--------|----------|
| 1 | Mechanism + scope discipline (harness-only) | PASS | `git diff --stat`: only `packages/cli/e2e/{src,tests}` + `.llm/runs/**`; zero product source |
| 2 | Semantic test asserts full command array | PASS | focused test 5/5; `assertEquals(command, […full array…])` incl. flag + version-derived URL |
| 3 | **Decisive live consumer proof** | PASS | fresh temp project + published beta.10 `cli.ts` the harness way → exit 0, tool generated; inner plugin-ai package resolution **absent**; flag proven to govern the single resolver |
| 4 | PR body seeds deferred beta.11 scope | PASS | "Follow-up: user-facing 24-hour window (beta.11 seed)" names shipped-CLI + generated-project policy as deferred |
| 5 | No new suppressions; changed-file quality | PASS | 0 suppressions added; scoped check/lint/fmt 88/0; `quality:scan` ok:true, 0 findings |

### 1 — Mechanism understood; scope is harness-only (blocking → clear)

`git diff origin/main...HEAD --stat` touches only two code files —
`packages/cli/e2e/src/application/gates/scaffold/plugin-install-gates.ts` (+ helper rename +2/-2 in
the argv) and `packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts` (±2) — plus run
artifacts under `.llm/runs/`. Both code files are the CLI **E2E test harness**; no
`packages/cli/src`, `plugins/**`, `services/**`, or generated-project source changes. The two
non-`fix` commits on the branch (`b55c47d1`, `b0ab7ee4`) are run-artifact-only (drift/context/plan/
research/supervisor/worklog). Confirmed: this changes **only** the e2e harness command construction.

The mechanism (research.md / PR body): Deno 2.9.3 `deno x jsr:…/cli` resolves+installs the JSR
executable then re-execs it as an internal `deno run` child whose argv drops
`--minimum-dependency-age` (and disables config discovery for a `jsr:` main), so the child's
version-resolution of the freshly published package falls back to the default and refuses it. The
fix consolidates resolution into one process by loading the plugin CLI via its exact file URL.

Completeness: the AI-lifecycle gate was the **only** JSR `deno x`/`'x'` call site in the e2e suite
(`grep` for `'x'` / `deno x` across `packages/cli/e2e` → none remaining; the non-JSR branch already
used `deno run`). No sibling straggler was missed.

### 2 — Semantic test asserts the full command array

`deno test -A --unstable-kv packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts` →
**5 passed / 0 failed** (Deno 2.9.3). The `published AI lifecycle gate reuses the published CLI
version` test asserts the entire array via `assertEquals`, including `'deno','run','-A',
'--minimum-dependency-age=0','https://jsr.io/@netscript/plugin-ai/0.0.1-beta.9/cli.ts','add','tool',
'e2e-tool', …`. Dropping the flag or reverting the transport shifts/omits an element → array
equality fails closed. Assertion strength is adequate to guard the fix.

### 3 — Decisive live consumer proof (blocking → clear, reproduced independently)

Reproduced the generator's consumer validation with a fresh temp project (isolated `DENO_DIR` to
force real registry fetches) and the exact harness command form:

```
deno run -A --minimum-dependency-age=0 \
  https://jsr.io/@netscript/plugin-ai/0.0.1-beta.10/cli.ts \
  add tool e2e-tool --workspaceRoot=<tmp>
```

→ **exit 0**, output byte-matches the generator's claim:
`{"code":0,"message":"add tool: 1 artifact(s).","data":{"status":"applied","createdFiles":["ai/tools/e2e-tool.ts"],…}}`
and `ai/tools/e2e-tool.ts` was created.

Two supporting checks isolate the mechanism (so the pass does not rest on beta.10 merely being aged
past its window today):

- **Inner plugin-ai resolution is absent.** In the fresh-`DENO_DIR` fetch log, plugin-ai is pulled
  only as pinned files (`…/0.0.1-beta.10/cli.ts`, `…/src/adapter/**`) plus its *version manifest*
  `…/0.0.1-beta.10_meta.json`. The **package-level** `@netscript/plugin-ai/meta.json`
  version-resolution — the age-gated request that failed in run 29564434302 — is **never issued**.
  The only package-level `meta.json` resolutions (`@netscript/plugin`, `@std/path`, `@std/internal`)
  all occur in the **same** process, governed by the single flag.
- **The flag genuinely governs the single resolver.** Re-running the identical URL form with
  `--minimum-dependency-age=P365D` **fails** with Deno's exact age refusal — "A newer matching
  version was found, but it was not used because it was newer than the specified minimum dependency
  date … the default is 24 hours" — on `@netscript/plugin@0.0.1-beta.10`. This proves the flag
  reaches the actual graph resolver in the one-process URL form; with `=0` the same resolution
  succeeds. The "default is 24 hours" hint corroborates the ~24h real-user window claim.

Minor evidence note (non-blocking): the PR body additionally claims the fresh-temp proof generated
`.netscript/generated/plugin-ai/tools.registry.ts`. My minimal repro (no full scaffold structure)
produced `ai/tools/e2e-tool.ts` + `ai/ai.ts` and the exact result JSON, but I did not observe the
`.netscript/generated/**` registry — most plausibly because the registry-compile step expects the
full scaffolded workspace. The decisive resolution behavior and primary artifact reproduced exactly;
this does not affect the verdict.

### 4 — Deferred user-facing scope seeds a beta.11 issue

PR #817 body carries a dedicated **"Follow-up: user-facing 24-hour window (beta.11 seed)"** section
stating that real users on Deno 2.9.x with fresh projects hit the same failure for ~24h after a
NetScript release, and explicitly defers (a) shipped CLI/plugin dispatch mitigation or a
supported-Deno decision and (b) a generated-project minimum-age policy decision, noting the latter
does not repair the 2.9.3 JSR re-run by itself. This is clear enough to seed a beta.11 product issue
and is correctly deferred, not filed as architecture debt. `Refs #813` (no closing keyword) is
correct for a follow-up that closes no issue.

### 5 — No new suppressions; changed-file quality (independently re-run)

- Diff scan over added lines: no `deno-lint-ignore` / `as unknown as` / `: any` / `@ts-ignore` /
  `@ts-expect-error` / `eslint-disable` introduced.
- Scoped check (`packages/cli/e2e`): 88 files, 0 findings.
- Scoped lint: 88 files, 0 findings.
- Scoped fmt: 88 files, 0 findings.
- `deno task quality:scan`: `ok:true`, `findings:[]` (7 allowances are all pre-existing in
  `public-api.ts` / `producer.ts`; none introduced here).

Worklog's `arch:check` PASS is corroborated by the fact that no `packages/**`/`plugins/**` product
source changed (the e2e harness carries no doctrine fitness surface that could regress).

## Process notes (non-blocking)

- **PLAN-EVAL waived by owner, recorded.** `plan-eval.md` is absent; `drift.md` D-2 records that on
  2026-07-17 the owner explicitly directed S1 to proceed without PLAN-EVAL because the local formal
  evaluator credential was unavailable and evaluations are supervisor-dispatched (commit `b55c47d1`).
  This is the sanctioned blocked-lane handling (owner-authorized fallback recorded in `drift.md`),
  not a silent skip. Noted, non-blocking for IMPL-EVAL.
- **No generator-self-arranged eval artifacts for #817.** The b10-minage run dir contains no
  `plan-eval.md`/`evaluate.md`, and the #817 PR body claims no self-dispatched PASS (only a draft
  "await supervisor-dispatched evaluation" notice). The generator did not self-certify. (The
  pre-existing `evaluate.md` in this slice dir is the prior **#813** IMPL-EVAL for a different
  branch/commit — left untouched; this verdict is written to `evaluate-817.md`.)
- Slice review gate (A1) — the Tier-A sign-off commit is a supervisor action that follows this
  PASS; single-slice run, nothing to reconcile.
- Release-gate / close-gate classes are `n/a` (non-cut follow-up, no issue auto-closed).

## Recommendation

`status:impl-eval` → advance to `status:ready-merge` on owner review. The fix is correct, complete,
minimally scoped to the test harness, and independently verified end-to-end (mechanism +
consumer proof + controlled flag-governs-resolver experiment). File the user-facing 24h-window
follow-up as a beta.11 issue at or before merge so the deferred shipped-CLI/generated-project scope
is not lost.
