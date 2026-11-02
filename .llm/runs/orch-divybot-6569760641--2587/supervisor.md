# Scaffold activity and sample job — 2026-11-02

- Assignment: #2587; branch `orch/divybot-6569760641`.
- Baseline: `20ba1729ba7b809d90fd4570a82893e5838da807` (merged #2586).
- Implementer: operator-dispatched Codex Astra, requested xhigh effort.
- Profile: operator-supplied Harness leaf; feature tier. No repository profiles read.
- Matrix queried via `deno task agentic:matrix --tier feature --json`.
  Default implementation: Sol xhigh, Muse Spark 1.3 xhigh fallback;
  implementation evaluation: Muse Spark 1.3 xhigh, Opus 5 xhigh fallback.
- Owner override: Astra implementation and separate read-only Codex source review;
  Astra visual review; Cockpit performs cross-family review at READY.
- Public evidence uses repository-relative paths and omits session identifiers.
- Writable product surface: `packages/cli/src/kernel/assets/`,
  `packages/cli/src/kernel/templates/`, `packages/cli/src/kernel/adapters/`,
  `packages/cli/src/public/features/`, `packages/cli/e2e/`,
  `packages/cli/src/generated/`, and generated CLI asset carriers discovered through the
  existing generation tasks. Narrow paths will be locked in plan before implementation.
- Run surface: `.llm/runs/orch-divybot-6569760641--2587/`.
- Disposable generated workspace and private launch/evidence files remain project-owned;
  their absolute locations and session identities are not included in public artifacts.
- `.divybot-goal.md` and final report handoff files must not be committed.
- Stop at READY; do not merge, rebase, force-push, apply labels, or close #2587.

Research refinement: the lifecycle seam belongs to `plugins/workers/bin/runtime.ts` and
its generated glue under `plugins/workers/src/adapter/resources/glue/`. The run may
also write the matching `plugins/workers/src/runtime/` sample-handoff helper and tests,
and CLI asset manifest/carriers. No core worker/queue delivery contract is replaced.
