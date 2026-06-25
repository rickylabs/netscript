# Worklog — chore/deno-2.9-adoption

Run: Deno 2.9 adoption (supervisor lane — config / CI / docs only; NO `packages/` source).
Plan: `plan.md` (C0–C4 in scope; C5/C6 deferred). PLAN-EVAL: `plan-eval.md` = **PASS** (OpenHands
minimax-M3, marker comment 4801765964; 3 non-blocking corrections F-1/F-2/F-3).

## Design checkpoint

- Scope is locked to C0–C4. Archetype: none (no package source touched) — this is a toolchain +
  repo-config + docs slice under the documentation-authoring/config exception. Locked decisions
  D1–D6 stand; D6 (lock reseed needs explicit user approval) was NOT triggered (see gate evidence).
- The two plan-flagged risks were empirically de-risked on a side-by-side Deno 2.9.0 binary before
  implementing (see "Risk de-risking" below).

## Implementation slices

### C0 — pin toolchain to Deno 2.9.0 (commit eb4229cb)

- `.github/toolchain.env`: `NETSCRIPT_DENO_VERSION=v2.8.3` → `v2.9.0`.
- `.github/workflows/ci.yml`: 3× `deno-version: "2.8.3"` → `"2.9.0"`.
- `.github/workflows/e2e-cli.yml`: 2× `"2.8.3"` → `"2.9.0"`.
- `.github/workflows/publish.yml`: 1× `"2.8.3"` → `"2.9.0"`.
- Bundled (see commits.md): deletion of `.llm/tools/run-parallel-tasks.ts` (former `ci:quality`
  runner; superseded by C1's native dependency task).

### C1+C2 — modernize deno.json tasks (commit cd6fbc57)

- C1: `ci:quality` rewritten from the hand-rolled `run-parallel-tasks.ts check lint fmt:check
  deps:check` invocation to a native Deno 2.9 dependency task
  `{ "dependencies": ["check", "lint", "fmt:check", "deps:check"] }` (runs concurrently, capped at
  CPU count; a failing dependency propagates its exit code).
- C2: `check`, `lint`, `fmt:check` converted to object form `{ "command": "...", "files": [...] }`
  with input-based caching. Commands are byte-identical to before. `files` for each = the package/
  plugin source globs + the relevant `.llm/tools/run-deno-*.ts` wrapper + `deno.json`; `check` also
  lists `deno.lock` (it resolves deps), while `lint`/`fmt:check` omit `deno.lock` (they do not).

### C3 — refresh toolchain docs to Deno 2.9 (commit 3d18cd13)

- `.agents/skills/netscript-deno-toolchain/SKILL.md`: 2.8→2.9 throughout (description, headings,
  "repo is on" line, catalog/TS-surface section labels, JSR-catalog re-verify note now cites "2.8.3
  and re-verified on 2.9.0"); ADDED a "## Task runner (2.9)" section documenting dependency tasks +
  input-based caching.
- `.claude/skills/netscript-deno-toolchain/SKILL.md`: regenerated mirror via
  `deno task agentic:sync-claude` (NOT hand-edited).
- `AGENTS.md`: "native Deno 2.8 toolchain" → "2.9".
- `.llm/tools/README.md`: "Deno 2.8 dependency commands" → "2.9" (×2).
- `docs/site/_plan/00-README.md`: "Deno 2.8, .NET 10, and Node 22 ..." → "Deno 2.9, ..." (F-2 fix).

### C4 — document publish 2.9 resilience (commit 0467d8c9)

- `.github/workflows/publish.yml`: added an 11-line comment block before the `Publish` step
  documenting the three Deno 2.9 publish-resilience behaviors relied on by the atomic
  whole-workspace publish (`publish-workspace.ts`): skip-already-published (deno#35134),
  continue-after-member-failure (deno#35133), asset inclusion (deno#35331).

## PLAN-EVAL correction follow-ups

- **F-1** — addressed in plan/research wording (non-blocking; no code impact).
- **F-2** — fixed in C3 (`docs/site/_plan/00-README.md` version string).
- **F-3** — `aspire/package.json` missing-companion-lock gap filed as a verifiable arch-debt entry
  (`scaffold-aspire-npm-island-no-lock`) in `.llm/harness/debt/arch-debt.md`, making D5's
  "pre-existing arch-debt" citation honest. Grounded in `render-ts-apphost.ts:51-77` and confirmed
  by the e2e scaffold output (`.llm/tmp/cli-e2e/plugin-smoke-*/aspire/package.json`).

## Risk de-risking (side-by-side Deno 2.9.0, before implementing)

Binary:
`...\scratchpad\deno29\deno.exe` (v2.9.0, stable, shipped 2026-06-25). Scratch configs under
`...\scratchpad\tasktest` and `...\scratchpad\cattest`.

- **C1 dependency-task fail semantics:** verified a failing dependency propagates its exit code
  (boom exits 3 → task exits 3; failcache exits 5 across both runs). Fail-on-any-failure preserved.
- **C2 input-cache safety:** verified unchanged `files` → SKIP ("cached, inputs unchanged"); edited
  input / new matching file / changed config (deno.json in `files`) → RE-RUN; `output` optional;
  globs work; **a previously FAILED run is never cached — it always re-runs** (cache cannot mask a
  stale/failing gate). CI runners start cold, so they always run; the win is the local loop.
- **JSR-in-catalog rejection** re-verified on 2.9.0 (still rejected) before reusing the claim in C3.

## Gate evidence (local, on side-by-side 2.9.0)

- **C1:** `ci:quality` dependency task parses on 2.9.0 and shows "depends on:" with concurrent
  scheduling; failure propagation verified (above).
- **C2:** cache hit/miss/fail-rerun matrix verified (above); all three object-form tasks parse.
- **C3:** `deno run .llm/tools/agentic/validate-claude-surface.ts` OK; `deno.lock` unchanged; all
  edited deno.json/doc files parse on 2.9.0.
- **C4:** `deno task publish:dry-run` on 2.9.0 → "Success / Dry run complete" (EXIT=0); `deno.lock`
  blob `4ac8cb88aa2fca99a9947a1eba1dfa7ef85323cd` **UNCHANGED** — no reseed, **D6 not triggered**.

**Authoritative gate = CI.** `deno task ci` (check-test + quality) and `e2e-cli` scaffold-runtime
(base = main, so it runs) execute on the GitHub Actions 2.9.0 runners after push. Local evidence is
necessary-not-sufficient; the merge verdict is the green CI + IMPL-EVAL pass.

## Lock hygiene

No `deno.lock` churn introduced by any slice. `publish:dry-run` on 2.9.0 left the lock blob
unchanged. No `deno cache --reload`, no lock deletion. If CI on 2.9.0 reseeds the lock, that is
surfaced for explicit user approval per D6 before committing.
