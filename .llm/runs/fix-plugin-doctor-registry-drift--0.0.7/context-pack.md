# Context Pack: plugin doctor generator-selected registry/source drift

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-plugin-doctor-registry-drift--0.0.7` |
| Branch | `fix/plugin-doctor-registry-drift` |
| Current phase | `plan-eval handoff` |
| Re-plan baseline | `61b8bf52b50a3cc3e98b67b367d1a1e4a2022807` |
| Archetypes | `6 — CLI / Tooling`; `5 — Plugin Package` |
| Scope overlays | generator-selection reporting protocol; JSR/publish validation |

## Current State

IMPL-EVAL cycle 1 returned `FAIL_FIX` because the implemented doctor's expected set is a manifest
candidate walk, not necessarily the set a plugin generator selects. The code through S5 otherwise
stands. S6 performed research and re-planning only; no product or test path changed.

The concrete blocker is AI: `ai/tools/skill-loader.ts` is manifest-discoverable, but the AI compiler
correctly excludes it because it is a factory rather than an exported ready definition. Correct
generation is followed by an impossible doctor remediation. Workers has the same latent assumption
through profile overlays, `include`, `includeWhenPresent`, plugin directories, and dotfile skipping.

## Re-locked Direction

- Choose generator-owned selected-source reporting, not manifest-encoded selector duplication and
  not a warning downgrade.
- Add an optional manifest capability declaring report protocol version 1. The host passes its
  already-resolved manifest JSON inline to a standard report-only invocation, captures one versioned
  JSON stdout document, grants no write permission, and makes no project-manifest or registry write.
- All four first-party runtime-registry generators adopt the report protocol. Older manifests without
  the capability retain the current path-walk fallback; an advertised reporter that fails or returns
  invalid evidence is an inspection error, never a silent fallback.
- Doctor's bidirectional import/binding comparison and AC2 failure semantics remain. A factory the
  generator rejects is not a definition; a selected definition missing from its registry is an error.
- Workers F4 is closed in this repair.

## Expanded Ceiling

The exact authorized ceiling is the 24-path list in `plan.md`: nine CLI product/test paths (including
a focused report parser/validator), four first-party manifests, and the AI/workers/sagas/triggers
generator and test paths. A 25th product/test path is rescope-and-stop with a significant `drift.md`
entry and supervisor approval.

No product/test implementation is authorized before PLAN-EVAL approval.

## Required Next Regression

S7 must be committed red-before by itself. It creates a generated AI registry containing one ready
tool while the project also contains discoverable `skill-loader.ts`, then asserts doctor remains
healthy. Against the S6 product head, doctor must raise `RemoteError`, producing the recorded expected
failure. No assertion is weakened when later product work makes it green.

## Slice Sequence

1. S6 — research/re-plan commit, explicit push, structured PLAN comment, then stop.
2. Separate PLAN-EVAL — `APPROVED` permits S7; `CHANGES_REQUESTED` returns to plan repair.
3. S7 — AI legitimate-exclusion red-before test only.
4. S8 — AI source-shape report protocol.
5. S9 — workers report protocol and F4 closure.
6. S10 — sagas/triggers report protocol.
7. S11 — host validation/consumption and truthful doctor evidence wording.
8. S12 — expanded focused/static/package/JSR/cascade/lock gates and evaluator handoff.

Each implementation slice must commit, push by explicit refspec, and post its structured comment
before the next begins.

## Gate Position

- Carry forward focused/related CLI suites and exact-ceiling structured check/lint/fmt.
- Add selected non-e2e generator tests and package checks for CLI, AI, workers, sagas, and triggers.
  Do not run broad recursive plugin `test` tasks that can discover `tests/e2e` paths.
- Measure `check:mcp-export-corpus` and `check:publish-assets`; run touched-package doc/publish dry
  runs; keep assets-barrel and agent-docs gates N/A unless scope changes.
- `.llm/tmp/gate-receipts/` is gitignored/local-only. Durable review evidence is the committed
  reproducible command, exact head, exit code, and counts.
- Prove `deno.lock` byte-unchanged with raw `git diff --exit-code -- deno.lock`.
- `e2e:cli`, Aspire, Docker, browser gates, and runtime leases remain prohibited.

## Evidence Corrections

- F3: S3 preserved the `GeneratedPluginRegistry` field shape, but changed `registrableItems` from a
  plugin-wide total to a per-target count. No production consumer reads the value.
- F5: historical receipt files are local-only, not fresh-checkout-verifiable evidence.
- If the base-product/head-tests comparison is mentioned, `0/5` requires `--no-check`; default
  type-checking stops before any test runs.

## Coordinator-Owned Boundaries

No merge, draft transition, relabel, issue edit/closure, acceptance-box mutation, or self-sign-off.
Fresh Tier-A and opposite-family IMPL-EVAL remain mandatory after implementation. No thread IDs,
rollout paths, or daemon handles belong in committed artifacts.
