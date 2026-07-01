# Plan-EVAL Summary — `feat-scaffold-surface-167--runtime-launch-contract`

## Summary

This was a PLAN-EVAL pass only. No implementation was performed; no source was edited and no commits
were made. The plan was verified against the current tree (`feat/scaffold-surface-167`) and emitted
**PASS** with four non-blocking clarification findings for the implementation phase.

## Verdict

**PASS** — every `gates/plan-gate.md` box is checked. Plan may move to IMPL-EVAL phase once minor
findings below are folded into Slice text.

## What I verified (claims grounded against real code; file:line citations kept in plan-eval.md)

- ROOT-CAUSE: Service + background launch from `cwd = <project>/plugins/<name>` matches the broken
  `runtime.wait.workers-api` gate. Confirmed in `generate-register-plugins.ts:47,48,67,74`,
  `generate-register-background.ts:42,66,73`, `appsettings-entry-builders.ts:55-57,99-101`,
  `install-plugin.ts:365-368,381-386`.
- D1 HYBRID contract: `import.meta.url`-relative hazard is real
  (`plugins/workers/bin/combined.ts:8`, `plugins/sagas/services/src/init.ts:13`,
  `plugins/sagas/src/runtime/saga-runner.ts:91`); service cwd-independence preserved by the
  absolute-file-URL bootstrap-module env in `generate-register-plugins.ts:68-69,80`. Hybrid is the
  smallest correct contract.
- SLICE ORDERING: Slice 0 (sagas reconcile) precedes Slice 5 (generator mutation). Each slice has
  its own validating gate. Sagas `scaffold.plugin.json:26,45-47,50` declares
  `backgroundEntrypoint: bin/combined.ts` but `plugins/sagas/bin/` does not exist — Slice 0 is
  necessary, not optional.
- D4 mappings: workers+triggers → glue + `./runtime`; sagas → Slice 0 decides; auth+streams →
  service-only (`./services` export add for streams).
- JSR SURFACE: `deno publish --dry-run --allow-dirty` per touched plugin; `@module` annotations
  already present on the surface that becomes newly exported. Bar is right.
- RISKS R1–R6: All present; R2 mitigation explicitly requires behavior gates (not only
  `runtime.wait.*` health gates) and R5 notes bootstrap env URL stays helper-relative.

## Plan-Gate checklist (`gates/plan-gate.md`)

| Box | Status | Evidence |
|---|---|---|
| Research present and current | ✅ | `research.md` re-baselined against current tree; STEP 1 cited file:line claims re-verified. |
| Decisions locked | ✅ | D1–D4 stated with rationale. |
| Open-decision sweep | ✅ | Only open item is sagas (a) vs (b), localized in Slice 0. |
| Commit slices | ✅ | 7 slices, each with gate + files; <30 files per slice. |
| Risk register | ✅ | R1–R6. |
| Gate set selected | ✅ | Archetype-5 + -6 matrix rows honored. |
| Deferred scope explicit | ✅ | Plan narrowly scoped to runtime-launch contract. |
| jsr-audit publishability | ✅ | `publish --dry-run` per package; `@module` + symbol docs required. |

## Changes

None. PLAN-EVAL is evaluation-only by mandate; per `.llm/harness/evaluator/plan-protocol.md`, no
implementation or commit is permitted before PASS verdict (now PASS) or per a separate IMPL-EVAL.

Files written (no source modifications):

- `.llm/tmp/run/openhands/pr-172/run-28419815466-1/plan-eval.md` — verdict artifact.
- `.llm/tmp/run/openhands/pr-172/run-28419815466-1/plan.md` (archived from upstream run dir).
- `.llm/tmp/run/openhands/pr-172/run-28419815466-1/research.md` (archived from upstream run dir).
- `/home/runner/work/_temp/openhands/28419815466-1/summary.md` (this file).

## Responses to review / issue comments (for the workflow to pick up under `output_mode: pr-comment`)

The PLAN-EVAL verdict destined for the PR thread (verbatim, suitable for the workflow's PR comment
tool — **NOT** posted directly per the operational contract):

> **PLAN-EVAL: PASS** for the plugin runtime-launch contract plan on
> `feat/scaffold-surface-167` (closes debt `PLUGIN-RUNTIME-DEPENDENCY-ENTRYPOINT-EXPORTS`).
> Verdict ground against the current tree; full evidence in
> `.llm/tmp/run/openhands/pr-172/run-28419815466-1/plan-eval.md`.
>
> Verified:
> 1. Root cause accurate — service + background launch default to
>    `cwd=plugins/<name>` (`generate-register-plugins.ts:47,48,67,74`,
>    `generate-register-background.ts:42,66,73`, `appsettings-entry-builders.ts:55-57,99-101`,
>    `install-plugin.ts:365-368`). Sagas `scaffold.plugin.json:47` declares
>    `backgroundEntrypoint: bin/combined.ts` but `plugins/sagas/bin/` does not exist — Slice 0
>    reconciles.
> 2. D1 Hybrid is sound and #157-thesis-consistent. `import.meta.url`-relative project-path
>    hazard is real (workers `bin/combined.ts:8`, sagas `services/src/init.ts:13` and
>    `src/runtime/saga-runner.ts:91`); service launch is cwd-independent via the helper-relative
>    `NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE` URL.
> 3. Slice ordering is right — Slice 0 sequenced before Slice 5; per-slice gates
>    (`deno task check` + `deno publish --dry-run --allow-dirty`, plus `install-plugin_test.ts` for
>    Slice 4) are individually validating.
> 4. D4 matches the export table — workers+triggers get glue + `./runtime`, sagas is up to Slice
>    0, auth+streams are service-only (streams gains `./services`).
> 5. JSR surface bar (`publish --dry-run` per package) is correct.
> 6. Risks R1–R6 are adequate; R2 verification explicitly relies on behavior gates (not only
>    `runtime.wait.*`); R5 (bootstrap-module env) correctly leaves the helper-relative URL alone.
>
> Non-blocking suggestions for the IMPL-EVAL cycle (failing none of the Plan-Gate boxes):
> - Slice 0: spell out that option (a) is largely a `deno.json` re-export since
>   `sagas/src/runtime/saga-runner.ts` already exposes `runSagaRunner`/`startSagaRuntime`.
> - Slice 2: choose shim, not rename, for "standardize start-fn name" — avoid breaking the
>   already-published `./runtime` API on triggers.
> - Slice 4: lock the glue-resource folder naming (proposed
>   `plugins/<x>/src/adapter/resources/glue/`) before implementing.
> - R5: add a one-liner that `WithEnvironment` env-var propagation is process-scope and survives
>   `jsr:`-launch — remove IMPL-EVAL confusion.
>
> **PLAN-EVAL: PASS** — implementation may begin once the above minor edits are folded into
> Slice text. Bar: `deno task e2e:cli run scaffold.runtime --cleanup` → `failed=0`.

## Remaining risks

(For IMPL-EVAL to re-verify — none of these blocked PASS.)

1. **Aspire `addExecutable(..., ['run', perms, 'jsr:@netscript/plugin-<x>/services'])`** with
   `cwd=projectRoot` — needs a real `aspire start` confirmation in Slice 6 that perms and flags
   (`--node-modules-dir=none`, `--unstable-worker-options`, `withHttpEndpoint`) survive the
   package-spec launch.
2. **Sagas glue (if Slice 0 picks (a))** — the userland glue must pass
   `.netscript/generated/plugin-sagas/sagas.registry.ts` to `runSagaRunner`'s `registryModule`
   option (already parameterized). Verify in Slice 4 gate evidence.
3. **No new `any`/casts** — already constrained by the 2 sanctioned categories in
   `09-anti-patterns-and-fitness-functions.md`. IMPL-EVAL must enforce this.
