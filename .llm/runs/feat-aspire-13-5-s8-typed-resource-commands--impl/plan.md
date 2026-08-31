# Plan — S8 typed db-cli-mode resource commands

The epic research plan is ratified and explicitly says no further ordinary PLAN-EVAL is required
for its implementation slices. This run therefore records PLAN-EVAL as N/A while retaining a
separate Fable 5 IMPL-EVAL before readiness.

## Design

### Contract

Each configured database gains one generated `<db>-cli` resource with typed `migrate`, `seed`, and
`reset` commands. Commands accept `timeout`; `reset` additionally requires `confirm=true` before
the runtime edge can mutate data. Every callback resolves to `{ success, message }`.
`RESOURCE_DEFAULTS.DbCliModeExcludeFromMcp` owns the D-6 policy and causes exactly those CLI
resources to emit `.excludeFromMcp()`. User-facing resources are not excluded and no resource is
hidden.

The CLI database adapter first bounds database readiness with
`aspire wait <db> --status healthy --timeout <n>`. It detects a matching running AppHost from
`aspire ps --format Json`, routes resident operations through
`aspire resource <db>-cli <op> --<args> --non-interactive --nologo`, and retains the scoped
standalone fallback. Wait exits 17 and 18 map to messages naming the database and timeout.

### Architecture spine

- Entry points: generated AppHost `tryHandleDbCliMode` and CLI database-operation dispatch.
- Contract types: existing NetScript database configuration and `DbOperation` request types plus
  emitted Aspire `CommandOptions.arguments`.
- Orchestration: generated CLI resource registration and `DbOperationRunner`.
- Ports: existing `AspireCommandExecutor` and lifecycle lock; no new generic abstraction.
- Adapters: `DenoAspireCommandExecutor` and the emitted `run-tool.mts` runtime edge.
- Constants: command definitions, readiness timeout/exit codes, and
  `RESOURCE_DEFAULTS.DbCliModeExcludeFromMcp`.

IO remains in the emitted runtime edge or concrete adapter (A7/A11); the TypeScript generator only
renders deterministic source. The existing database and Aspire configuration axes are extended
without introducing a parallel plugin or framework mechanism.

## Slices

1. Add RED grep and MCP-ownership generator gates with a durable receipt.
2. Emit typed commands, confirmation/timeout behavior, `excludeFromMcp`, and remove the 13.4 seam;
   make generator tests green and record the SDK member table.
3. Regenerate snapshots/assets barrel and prove `check:assets-barrel`.
4. Add running-AppHost detection, typed resource routing, bounded wait, standalone fallback, and
   fake-process unit coverage for every branch.
5. Render a PostgreSQL consumer, restore Aspire 13.5.3 without starting it, type-check it, cite
   restored signatures/hashes, remove scratch, and commit the receipt. Restore and watch failures
   are real findings under the re-proven D-39 host state; no historical inotify waiver applies.
6. Add the unexecuted Phase-B E2E gate path, prefer a typed command where restart is avoidable,
   retain restart fallback, run Phase-A static/scaffold/quality gates, and draft the #411 comment.

Every slice is a separate commit, is pushed with the explicit branch refspec, and receives a draft
PR trail comment. Phase-B live receipts remain unchecked until a supervisor grants a runtime lease.

## D-216 repair slice

PLAN-EVAL remains N/A under the ratified epic plan and the owner's explicit prohibition on a
self-dispatched evaluator. The supervisor owns any delta IMPL-EVAL after product bytes move.

1. Preserve the two requested CI ZIPs and job logs under ignored `.llm/tmp/`, verify their artifact
   digests, and report the exact absence of Prisma `code`/`meta` rather than assigning a guessed
   Prisma code.
2. Compare S8 with its exact converged main parent `6c195acaf`, trace the old executable resource
   injection and new typed callback through the operation runner, generator, and tool runner, and
   confirm the relevant Aspire 13.5.3 API from primary source.
3. Add a focused generator regression named for late-bound allocated-resource resolution. Run it
   against the unfixed generator first and retain the failing assertion as RED proof.
4. Extend the generated infrastructure context with one internal connection-string resolver map.
   Container database entries populate it from their concrete resource's
   `connectionStringExpression().getValueAsync()`; external entries retain the configuration-backed
   resolver they explicitly model. The typed callback consumes the resolver and passes the result
   unchanged as both `DATABASE_URL` and the engine-specific variable. SQLite keeps its file URL.
5. Regenerate the embedded asset snapshot. Run focused tests, scoped check/lint/fmt for every
   changed TypeScript file, the package architecture/quality gate, the assets-barrel check, and the
   repository-wide `deno task check`. No Aspire, AppHost, Docker, or runtime E2E command may run.
6. Commit the repair and run evidence, compare the exact remote head immediately before push, and
   push only the explicit branch refspec if it is a fast-forward. Post the harness implementation
   trail without changing labels, lifecycle, milestone, base, S9, or S10.

Doctrine verdict: `packages/cli` remains Archetype 6 / Keep. The generator stays deterministic;
runtime resolution remains in the emitted AppHost edge, and the change introduces no `any`, cast,
lint suppression, public export, package metadata change, or architectural debt.

## D-224 bounded observability slice

PLAN-EVAL is N/A: the owner supplied the exact defect, constraints, acceptance test, verification
set, branch head, and push contract; the remaining design choice is a small bounded retention
policy rather than an architecture decision. The supervisor owns the required separate delta
IMPL-EVAL after product bytes move.

### Locked decisions

- Raise the actionable line cap from 3 to 32. Keep the first 8 actionable lines and the final 24,
  in original order, so the first line remains the command message while late structured fields
  survive long prefixes.
- Cap the persisted/joined actionable detail at 16 KiB of UTF-8, including newline separators.
  Derive a per-line allowance from the line and byte caps and truncate oversized lines on a valid
  UTF-8 boundary with an ellipsis, retaining both a bounded head and a larger bounded tail.
- Keep VT stripping and `Task ` filtering before retention. Keep `actionableStderr` additive and
  unchanged in type; do not parse or prioritize Prisma-specific keys.

### Open-decision sweep

- No must-resolve decisions remain. Exact diagnostic syntax and tool-specific field names are safe
  to defer because the retention policy is generic and deterministic.

### Slice and proving gates

1. Add focused black-box fixtures proving a structured identifier beyond line 3 survives and a
   single enormous line cannot exceed the byte ceiling; capture RED against the current template.
2. Implement the 8-head/24-tail, 32-line, 16-KiB policy in `run-tool.ts.template`; retain the D-07
   ANSI-banner test unchanged and make the focused suite GREEN.
3. Regenerate `embedded.generated.ts`, run focused typed-command tests, scoped check/lint/fmt on
   every changed file, `quality:gate`, repo-wide `deno task check`, and diff-clean
   `check:assets-barrel`; record evidence and push only after a fresh fast-forward remote check.

### Risk register and deferred scope

- Risk: truncating inside a multi-byte character could violate the byte bound or corrupt detail.
  Mitigation: trim encoded bytes to a complete UTF-8 boundary and test the ceiling with multi-byte
  content.
- Risk: tail retention could change the existing message. Mitigation: reserve the first eight
  slots and continue deriving `message` from element zero.
- Risk: generated barrel drift. Mitigation: run generator then the checked-in diff-clean task.
- Deferred: parser heuristics, runtime reruns, seed-path changes, PR lifecycle/base/labels, and any
  S9/S10 work.

## D-227 generated-helper compile repair

PLAN-EVAL is N/A: the owner supplied the reproducible gate, the competing throw sites, the leading
hypothesis to test, the required static regression, the verification set, and the exact push
contract. The work is a bounded generated-source correction inside the existing Archetype-6
template seam; no architecture or public-surface decision remains open. The supervisor retains the
separate IMPL-EVAL responsibility and this session will not dispatch or claim it.

### Locked decisions

- Reproduce `generated.quality-negative` from a fresh local-source PostgreSQL scaffold and retain
  the complete probe stdout/stderr before changing product source.
- Independently compile `aspire/.helpers/run-tool.mts` and
  `aspire/.helpers/register-infrastructure.mts` against that scaffold's restored SDK and report
  exact diagnostics.
- If the emitted late-bound resolver is invalid, repair the generator/template while preserving
  execution-time resolution through `connectionStringExpression()` and D-224's bounded
  actionable-stderr behavior. Use the restored TypeScript SDK's actual value-resolution member;
  do not weaken the quality probe or generated check/lint tasks.
- Add a static generator regression that renders and compiles the emitted helper pair in a
  temporary restored-SDK consumer. Capture its failure against the unfixed template before making
  it green.

### Slice and proving gates

1. Scaffold locally, run the full negative probe capture, compile both emitted helpers, and record
   the exact throw and diagnostics in `research.md`/`worklog.md`.
2. Add the emitted-helper compile regression and retain its RED result against `bbf866d59`.
3. Repair the emitting template/generator, regenerate `embedded.generated.ts`, and make the focused
   regression and existing generator tests green.
4. Run scoped structured check/lint/fmt for changed TypeScript, `quality:gate`, repo-wide
   `deno task check`, `gen:assets-barrel`, and diff-clean `check:assets-barrel`; commit only owned
   files, compare the remote branch immediately before push, and push only if fast-forward.

### Risk register and deferred scope

- Risk: a string-only assertion can accept source that the Aspire SDK rejects. Mitigation: the new
  regression invokes the compiler against a checked-in minimal contract copied from the restored
  Aspire SDK rather than matching a method name; the manual consumer proof also compiles against
  the complete restored SDK.
- Risk: test scaffolding accidentally starts runtime resources. Mitigation: permit only scaffold,
  restore/package resolution, and `deno` check/test/lint/fmt commands; no Aspire, Docker, AppHost,
  or E2E runtime suite.
- Risk: repairing the type error changes late binding or stderr retention. Mitigation: retain the
  existing semantic generator assertions and D-224 tests alongside the compile regression.
- Deferred: runtime confirmation of `database.seed`, PR base/lifecycle/labels, rebase, S9/S10 work,
  and formal IMPL-EVAL dispatch.

## D-231 graph-injected typed-command repair

PLAN-EVAL is N/A: the owner supplied the decisive runtime error, the supported prior mechanism,
the required negative/static coverage, the exact verification set, and the no-runtime/push
contract. The change is a bounded correction inside the existing Archetype-6 generated command
edge. No architecture or public-surface decision remains open, and this session will neither
dispatch nor claim IMPL-EVAL.

### Locked decisions

- Container databases do not resolve a connection string inside a typed-command callback. The
  callback stages the operation request and starts the already-declared `<db>-cli` executable; its
  graph-construction-time `.withEnvironment(..., target.resource)`, `.withReference(...)`, and
  `.waitFor(...)` annotations remain the sole Container connection-string mechanism.
- The emitted runner writes one bounded result record after the graph-injected child finishes so
  the typed command can return the real task result. It reuses D-224's bounded actionable stderr;
  it does not add another unbounded capture.
- External mode retains its explicit `builder.getConfiguration().getConnectionString(...)`
  resolver. SQLite retains its `file:./...` URL and direct typed-command child path.
- Do not call `ReferenceExpression.getValue()`, `getValueAsync()`, or another guessed capability.
  The 13.5.3 command context exposes no supported connection-string accessor.

### Open-decision sweep

- No must-resolve decisions remain. Runtime execution is intentionally deferred to CI by the
  owner's no-runtime constraint.

### Slice and proving gates

1. Extend the D-227 emitted-helper regression and focused generator assertions so Container output
   rejects in-callback resource-expression resolution and requires the graph-injected executable
   path; run against `a2b227941` and retain the failing result as RED proof.
2. Remove Container resolver emission, carry database mode into the typed target, stage/start the
   explicit resource for Container commands, and persist a bounded runner result. Preserve External,
   SQLite, D-224, and the typed command arguments/result surface.
3. Regenerate the asset barrel; run focused tests, the existing emitted-helper compile test,
   scoped structured check/lint/fmt, `quality:gate`, repo-wide `deno task check`, and diff-clean
   `check:assets-barrel`. Commit only owned files, compare the exact remote ref immediately before
   push, and push only if fast-forward.

### Risk register and deferred scope

- Risk: staging a request without a completion record can produce a false success. Mitigation: the
  graph-injected runner atomically writes the bounded result only after the task finishes, and the
  callback waits for that record within the requested timeout budget.
- Risk: the repair weakens D-224 diagnostics. Mitigation: the result message is derived from the
  existing bounded `actionableStderr` array and its 16-KiB cap.
- Risk: External or SQLite behavior drifts. Mitigation: focused assertions retain the configuration
  lookup and file URL independently of the Container branch.
- Deferred: runtime execution, PR base/lifecycle/labels, rebase, S9/S10 work, and formal IMPL-EVAL.

## D-233 diagnostic-first migrate repair

PLAN-EVAL is N/A: the owner supplied the exact runtime failure, retained-diagnostic contract,
generic-classification requirement, regression shape, no-runtime boundary, branch head, and push
contract. The only behavioral follow-up is explicitly evidence-gated on the diagnostic CI slice.
A separate opposite-family IMPL-EVAL remains mandatory after the final product head.

### Locked decisions

- Preserve D-224's 32 retained lines, 8/24 head-tail ordering, per-line truncation, and 16-KiB
  serialized UTF-8 ceiling byte-for-byte.
- Select the first retained line matching a generic failure shape as the short failure `message`;
  fall back to the first retained line when no failure-shaped line exists. The heuristic names
  common error grammar, not tools or vendors.
- Serialize both `message` and the unchanged `actionableStderr` array in the typed command result.
  The generated callback still returns Aspire's `{ success, message }` contract, with the promoted
  error first and the bounded context appended for logs.
- Make the Phase-B verifier render both stderr and stdout rather than choosing the first non-empty
  stream.
- Do not repair migrate semantics until the pushed diagnostic slice makes the actual retained
  failure visible in CI. If the evidence confirms the authoring/deploy task mismatch, route typed
  `migrate` to the already-generated non-interactive deploy task without renaming the public typed
  command.

### Open-decision sweep

- Must resolve after diagnostic CI: the exact migrate failure and whether it is owned by S8.
- Safe to defer: tool-specific structured parsing, a new public error schema, and any wider
  migration-command redesign.

### Slices and proving gates

1. Add a RED black-box runner fixture with an informational preamble followed by a failure-shaped
   line; add the generic message selector, typed `actionableStderr` record, and dual-stream Phase-B
   failure formatting. Regenerate the embedded barrel, run focused tests and scoped wrappers,
   commit/push after the required remote check, and use CI as the diagnostic runtime.
2. Read the new CI artifact/log. If it proves an S8-owned migrate task mismatch, add a focused RED
   generator regression, make the smallest task-routing repair, and repeat static gates plus CI.
   If it is outside S8, stop with the exact evidence instead.
3. Re-run D-224 bounded diagnostics, D-227 emitted-helper compilation, and D-231 graph-injection
   guards explicitly; run `quality:gate`, repo structured check, and diff-clean asset-barrel check;
   hand the final head to a separate opposite-family IMPL-EVAL.

### Risk register and deferred scope

- Risk: a broad classifier mistakes an informational line for a failure. Mitigation: use explicit
  failure grammar, keep the full bounded array, and preserve the first-line fallback.
- Risk: adding an array to the result record breaks D-231 parsing. Mitigation: extend the parser and
  compile regression together; keep Aspire's outward result shape unchanged.
- Risk: a task remap changes interactive CLI behavior. Mitigation: scope any confirmed repair to the
  emitted typed command task selection; do not alter generated `db:migrate` itself.
- Deferred: local runtime, Aspire/Docker/AppHost/E2E execution, public package exports, dependencies,
  PR base/lifecycle/labels, and S9/S10 work. JSR audit is N/A because no export, metadata, or JSDoc
  surface changes.
