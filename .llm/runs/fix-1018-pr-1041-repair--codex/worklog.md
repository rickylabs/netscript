# Worklog

## Design

### Public surface

- Preserve the emitted `/v1/ai` contract-bound router and all six route implementations.
- Preserve the descriptor capabilities for chat, models, tools, embeddings, and transcription.
- Keep package contracts unchanged; generated code owns wire-boundary normalization.

### Gate collection

- Collect 23 install emissions and 16 add-resource emissions.
- Treat each render as a logical sample for the 39-sample release claim.
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

Pending implementation and gates.

