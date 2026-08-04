# Drift Log: StreamDB wrapper type preservation

Drift is append-only.

## 2026-08-04 — Milestone evaluation composition

- **What:** No duplicate local formal PLAN-EVAL or IMPL-EVAL is launched.
- **Source:** Owner W5-V2 brief; `workflow/milestone-run.md` evaluator protocol; orchestrator ruling D6.
- **Expected:** Normal `run-loop.md` launches separate local formal evaluator sessions.
- **Actual:** Evaluation composes the PR draft→ready augment and milestone orchestrator pre-merge gate.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan-eval.md`, `supervisor.md`, plan gate row

## 2026-08-04 — Foreign lock state at bootstrap

- **What:** `deno.lock` contains one unstaged queue dependency addition before W5-V2 work.
- **Source:** Opening raw `git status` and `git diff -- deno.lock`.
- **Expected:** Clean baseline.
- **Actual:** One foreign insertion for `jsr:@netscript/queue@0.0.4`.
- **Severity:** minor
- **Action:** accept and exclude
- **Evidence:** Explicit-path staging is required for every slice; final commit-range audit must show no lock change.

## 2026-08-04 — Consumer fixture package identity

- **What:** The compile-only consumer fixture uses its own no-workspace config and pins the TanStack DB versions consumed by `@tanstack/react-db`.
- **Source:** S1 RED-first execution and `deno task deps:why` inspection.
- **Expected:** The direct upstream control compiles while only the framework wrapper fails.
- **Actual:** The package-root config resolved two nominal TanStack DB identities (`0.6.8` and `0.6.17`), causing an unrelated control failure; the isolated consumer config removes that false signal.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `tests/type-fixtures/streamdb-consumer-deno.json`; valid RED contains exactly the two wrapper `unknown` diagnostics and the direct control compiles.

## 2026-08-04 — Published-doc baseline and upstream npm references

- **What:** Full-package doc lint and the JSR audit remain non-zero on unrelated existing package debt; restoring upstream inference adds four `private-type-ref` diagnostics because Deno treats the npm package's exported declaration aliases as private documentation nodes.
- **Source:** S2 full export-map `deno doc --lint` and JSR audit.
- **Expected:** Published-package gates complete without introducing a local fork of upstream collection inference.
- **Actual:** Publish dry-run and its slow-types check pass. Full doc lint reports 44 errors: 40 in existing route/query/streams surfaces and four at the new upstream type references. The JSR audit retains unrelated `./ai` and `./vite` module-tag failures.
- **Severity:** minor/process
- **Action:** accept for composed evaluator review; do not copy the upstream collection conditional into NetScript merely to silence a documentation-graph limitation.
- **Evidence:** S2 command transcripts, successful publish dry-run, and the same-fixture upstream parity proof.
