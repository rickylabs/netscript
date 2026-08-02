# Plan: preserve resident AppHost during database CLI operations

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1011-db-apphost-lifecycle--codex` |
| Branch | `fix/1011-db-apphost-lifecycle` |
| Phase | `plan` |
| Target | `packages/cli` database operation adapter |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Archetype and Current Doctrine Verdict

Archetype 6 applies because this is user-run `netscript db` command behavior. The current doctrine
verdict for `@netscript/cli` is `Restructure`, but this adapter already sits in the prescribed
kernel adapter layer; the fix must not deepen existing structure debt.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A5 | Lifecycle behavior remains composed through the existing executor seam. |
| A8 | Ownership detection stays with the database adapter rather than presentation code. |
| A13 | The cleanup boundary must explicitly encode which invocation owns the AppHost. |
| A14 | Fake-executor tests preserve the destructive-command invariant. |

## Goal

Ensure detached `netscript db` operations stop only an AppHost they started, never a resident
AppHost observed before the operation.

## Scope

- Probe `aspire describe --apphost ... --format Json` before detached start.
- Track AppHost ownership explicitly through the detached operation.
- Execute `aspire stop` only when this invocation started without a resident instance.
- Add deterministic executor-seam coverage for resident and invocation-owned paths.

## Non-Scope

- No change to the incidental DB-status exit code on empty migration history.
- No generated AppHost/template or `embedded.generated.ts` change.
- No silent change to `studio`; its interactive path remains exactly as-is.
- No full scaffold runtime E2E; scaffold output is unchanged and the user requested scoped gates.

## Hidden Scope

- The preflight probe must treat Aspire's “no running AppHost” non-zero result as absence, while
  malformed/other failures must not create destructive ownership assumptions.
- Cleanup on operation failure must remain best-effort only for invocation-owned hosts.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Probe before `start`, then carry a `startedByInvocation` boolean into `finally`. | Matches the accepted minimum shape and makes destructive cleanup ownership explicit. |
| D2 | A successful `describe` response for the target path means resident; non-zero “not running” means absent. Unexpected probe failures fail closed before `start`. | Never infer ownership when state is ambiguous. |
| D3 | Preserve the interactive `studio` path unchanged. | Acceptance is about detached DB commands; changing interactive lifecycle is unrequested. |
| D4 | Deliver criterion 3 as deterministic integration-style coverage over `AspireCommandExecutor`. | No runnable AppHost fixture exists; the user explicitly accepts this form if reported honestly. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Unique generated DB AppHost identity/backchannel | safe to defer | Requires template/scaffold scope; ownership guard fixes the concrete destructive command. |
| Live PID/backchannel E2E fixture | safe to defer | No checked-in runnable fixture; deterministic command-seam coverage is accepted. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Probe JSON shapes vary | Treat exit status as liveness and keep parsing out of the ownership decision. |
| Probe failure is mistaken for absence | Recognize only Aspire's documented no-running result; throw on other failures. |
| Existing tests assume `start` is first | Update fixtures and assert the full command ordering. |
| Fix accidentally changes `studio` | Retain and rerun its zero-output-call assertion. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-6 helper reinvention | risk | Use the existing executor and Aspire CLI rather than a new process abstraction. |
| AP-9 lifecycle ambiguity | existing defect | Encode ownership explicitly and cover cleanup branches. |
| AP-18 speculative abstraction | risk | Add no new port; the existing executor seam is sufficient. |

## Fitness and Validation Gates

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Targeted behavior | `deno test -A packages/cli/src/kernel/adapters/database/` | exit 0; resident path records no `stop` |
| 2 | Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx --unstable-kv` | exit 0 |
| 3 | Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx` | exit 0 |
| 4 | Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx` | exit 0 |
| 5 | Framework quality | `deno task quality:scan` and `deno task arch:check` | exit 0 or explicitly baseline unrelated findings |
| 6 | Manual A6 review | ownership, layering, no new public surface/permissions/casts | PASS |

## Arch-Debt Implications

No new or deepened architecture debt is expected. Existing CLI restructuring and DB-generate
coupling entries remain unchanged.

## Deferred Scope and Drift Watch

- Defer unique generated DB-operation identity and a live AppHost PID fixture.
- Log significant drift if `aspire start` itself is proven to retire the resident instance even
  when `stop` is suppressed; that would require template/backchannel rescope.

## 2026-08-01 Review Remediation Plan — Supervisor Approved

The owner waived the unavailable open-model Plan-Gate and directed the supervisor to approve this
bounded remediation plan. No `plan-eval.md` is created or implied.

### Locked slices

| Slice | Decision | Proof | Files |
| --- | --- | --- | --- |
| S1 | Serialize probe → start → poll → logs → cleanup with an injected inter-process lease. The default lock uses atomic `Deno.open({ createNew: true })`, records pid/time/token, reclaims dead/expired holders, sleeps through the runner seam, and never masks the operation error on release. | Database adapter tests including ordering, dead-pid reclaim, and thrown-operation release. | `apphost-lifecycle-lock.ts`, its test, `operation-runner.ts`, `operation-runner_test.ts`, run artifacts |
| S2 | Classify only a line-start Aspire no-running diagnostic, allowing whitespace/`error:` prefix; include numeric exit codes for probe and command failures. | Direct helper tests plus exact runner error assertions. | `operation-runner-helpers.ts`, helper test, runner/test |
| S3 | Cover resident AppHost plus non-zero DB status with no stop. | Exact executor sequence test. | `operation-runner_test.ts` |
| S4 | Add a `scaffold.runtime` gate that reuses start metadata/AppHost, runs local `db status`, then requires the original pid and `aspire describe` identity to survive. Land only if the canonical full runtime suite is deterministic and green. | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` exit 0. | E2E gate constant, runtime gate, focused script, run artifacts |

### Lock location decision

Use `<project>/aspire/.aspire/netscript-db-<sha256(apphostPath)>.lock`.
`SCAFFOLD_DIRS.ASPIRE_GENERATED` already defines `.aspire`, and
`packages/cli/src/kernel/assets/workspace/gitignore.template` already ignores `.aspire/`. The hash
keys the advisory lock to the normalized AppHost path without inventing a top-level directory.

### Risks and stop conditions

- Active leases older than `timeoutMs` are reclaimable by design so a wedged process cannot brick
  the project; lease tokens prevent an old holder from deleting a replacement lease.
- Invalid lock contents are reclaimed only after filesystem age exceeds `timeoutMs`.
- S4 stops without a claimed pass if `db status`, pid survival, or describe identity cannot be made
  deterministic in the existing suite. Box 1 remains unmet regardless because project identity is
  unchanged.
