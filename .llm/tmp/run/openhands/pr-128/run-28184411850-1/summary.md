# Run Summary — PLAN-EVAL for `chore-deno-2.9-adoption--adoption-plan`

## Summary

PLAN-EVAL (separate evaluator session) for the Deno 2.9.0 adoption plan on branch
`chore/deno-2.9-adoption` (baseline `origin/main@c0020a1b`, includes #126). Read-only
spot-verification of plan claims (version-pin sites, scope, debt entries, gates) before rendering
the verdict per `evaluator/plan-protocol.md`. **Verdict: `PASS`** — all 8 Plan-Gate boxes are
satisfied; the plan is decision-complete; C0–C4 are supervisor-implementable; C5/C6 are correctly
deferred. Three non-blocking slice-time corrections are noted.

## Changes

- **Created** `.llm/tmp/run/chore-deno-2.9-adoption--adoption-plan/plan-eval.md` — the
  full PLAN-EVAL deliverable (checklist + open-decision sweep + verdict + slice-time corrections).
- **Created** `.llm/tmp/run/chore-deno-2.9-adoption--adoption-plan/pr-comment-body.md` — the
  rendered PR comment body for the harness to post (cycle 1, `output_mode: pr-comment`).
- **No commits** — read-only evaluation session. Branch `chore/deno-2.9-adoption` is unchanged
  from baseline `c0020a1b`.

## Validation

Spot-verifications performed against current `main` (all passed):

1. **Pin-site inventory** — 7 sites / 5 files confirmed:
   - `.github/toolchain.env:7` — canonical env var.
   - `.github/workflows/ci.yml:47,68,98` — hardcoded `deno-version`.
   - `.github/workflows/e2e-cli.yml:57,87` — hardcoded `deno-version`.
   - `.github/workflows/publish.yml:62` — hardcoded `deno-version` (plan/research cite `:23`; F-1).
   - `.github/workflows/openhands-agent.yml:286,398` — env-var-driven.
2. **`deno.json` task sites** — `ci:quality` at `:22` (shells `run-parallel-tasks.ts`); `check`
   at `:23`; `fmt:check` at `:49`; `lint` at `:50`; `e2e:cli` at `:47`.
3. **Unstable array** — `deno.json:13-18` = `["kv","temporal","tsgo","worker-options","raw-imports"]`;
   none stabilized in 2.9; `--unstable-kv` remains pervasive.
4. **`run-parallel-tasks.ts`** — 52-line hand-rolled `Promise.all` runner; no other consumers
   (`grep -rn` confirmed); C1's deletion is safe.
5. **C5 deferral grounding** — `MYSQL_ADAPTER_PACKAGE = "prisma-adapter-mysql"` at
   `packages-copier.ts:74`; `pruneMysqlAdapterFromDatabasePackage:203-230`;
   `PACKAGE_TO_LOCAL_PATH` at `import-resolver.ts:84-131` and `local-import-resolver.ts:6-40+`.
   All three C5 blockers (subpath resolution, `catalog:` against source, MySQL-adapter prune on
   immutable source) are concrete and real.
6. **Compression-off bump risk** — no `automaticCompression` references anywhere in
   `packages/`/`plugins/`/`deno.json`/`.github`. Plan correctly catches this via C0's
   `scaffold.runtime` gate.
7. **`ci.yml` lock install path** — lines 50, 71, 101 run `deno install` without `--frozen`;
   non-fatal on reseed; D6 approval gate correctly routes this.
8. **Deno 2.9 https-asset blocker claim** — confirmed: 2.9 release notes focus on tooling/publish
   improvements; the CLI-on-JSR asset blocker is independently addressed by PR #127 (correctly
   decoupled from this program).

## Responses to review comments or issue comments

None. This is a PLAN-EVAL session with no in-PR comment to reply to. The verdict itself is
posted as a new top-level PR comment via `pr-comment-body.md` (cycle 1, `output_mode: pr-comment`).

## Remaining risks

- **F-1 — `publish.yml:23` citation should be `:62`.** Cosmetic; slice shape unchanged.
- **F-2 — `docs/site/_plan/00-README.md:57`** contains a "Deno 2.8" contextual sentence not
  currently in C3's scope. Recommend folding into C3 for consistency.
- **F-3 — `aspire/package.json` arch-debt reference is unverifiable** (no entry in
  `arch-debt.md`). Non-blocking; either file a new entry or rephrase D5.
- **C5/C6 are deferred** (correctly) and remain forward-looking follow-up work after this
  plan lands.
- **D6 lock reseed** requires explicit user approval per AGENTS.md; plan correctly routes
  through an approval gate.
- **Bump risk** (`Deno.serve` compression-off #35486 + min-dep-age #35458 + lock reseed) is
  caught by C0's gate set (`deno task ci` + `e2e:cli scaffold.runtime --cleanup` +
  `publish:dry-run`).

## Verdict

`PASS` — implementation supervision may begin. Per `gates/plan-gate.md`, two `FAIL_PLAN` cycles
then escalate; this is cycle 1 and rendered `PASS`.