# Worklog

## Design

### Public surface

- Preserve the emitted `/v1/ai` contract-bound router and all six route implementations.
- Preserve the descriptor capabilities for chat, models, tools, embeddings, and transcription.
- Keep package contracts unchanged; generated code owns wire-boundary normalization.

### Gate collection

- Collect every install and add-resource TypeScript/TSX emission.
- Report the measured inventory rather than targeting the brief's estimate.
- De-duplicate only an identical `(plugin, path, text)` emission before writing/checking.
- Reject cross-plugin path collisions and same-plugin differing-text path conflicts.

### Commit slices

1. Harness plan and baseline evidence.
2. Restore and repair the AI router sample.
3. Restore router assertions.
4. Invoke the emitted-sample gate from CI.
5. Extend the gate to the add surface and provide missing default inputs.
6. Validation, implementation evaluation, explicit push, and SHA verification.

### Contributor path

- Resource scaffolders expose deterministic `defaultInput` values.
- The release gate renders plugin-owned scaffolds into a temporary workspace and checks their real text.

## Process

- Owner waived external PLAN-EVAL and IMPL-EVAL; this session proceeds after recording the plan.
- Per owner instruction, commits accumulate locally and are pushed once with an explicit refspec.

## Evidence

- Emitted-sample gate: 40 actual TypeScript/TSX artifact emissions, 30 unique checked paths.
- AI resource tests: 10 passed, 0 failed after restoring the exact router-binding assertion.
- Router negative control: deleting only the `aiRouter` export produced 9 passed / 1 failed; the
  assertion named the missing exact export binding. The export was restored before commit.
- Scoped lint: 52 selected files, 0 findings.
- Scoped format check: 52 selected files, 0 findings.
- Final emitted-sample gate: 40 samples (23 install + 17 add), all 30 de-duplicated paths checked.
- Final plugin suites: 88 passed across 9 steps, 0 failed, 12 ignored.
- Final scoped check: 196 selected files in 2 batches, 0 diagnostics.
- Final scoped lint: 196 selected files, 0 findings.
- Final scoped format: 196 selected files, 0 findings. The wrapper rejected the brief's `--check`
  argument because check mode is already intrinsic, so the supported equivalent was used.
- Full scaffold runtime: 44 gates passed before `behavior.service-health` timed out at 117340 ms;
  the fail-fast suite did not reach the AI route.
- Targeted gate against that generated project: `behavior.ai-chat-route` passed in 1493 ms and
  reported 1 passed / 0 failed.
- CI workflow: explicit `Emitted sample type-check` step runs `deno task check:emitted-samples`.

## IMPL-EVAL corrections

- Replaced the mixed-unit `starterResources.length + add artifacts` count with actual artifact
  counting on both branches. The measured result is 23 install plus 17 add emissions, not the
  earlier estimated 39.
- Replaced the prose-satisfiable router assertion with the exact emitted export statement and
  removed the call-shaped text from its documentation.

## Reconcile

- No package export map or published AI contract changed; `jsr-audit` remained out of scope.
- No new or deepened architecture debt was identified.
- The final full runtime failure is the users-service timeout, while the independently executed
  AI route behavior is green; these are reported as separate artifacts.
