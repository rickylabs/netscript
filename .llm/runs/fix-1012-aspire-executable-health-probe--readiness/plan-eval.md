# PLAN-EVAL — fix-1012-aspire-executable-health-probe--readiness

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

- Run: `fix-1012-aspire-executable-health-probe--readiness`
- Plan under evaluation: `plan.md` @ `7c6b28fb6`
- Archetype: 6 — CLI / Tooling · overlay: service
- Note: a prior `plan-eval.md` in this run was written by the implementation session itself and
  attributed to a "Qwen/OpenRouter" evaluator. That lane is retired for the 0.0.3 fix train and no
  such session ran. This file replaces it. A generator does not evaluate its own plan.

## Plan-Gate checklist

| Item | Result | Evidence (independently checked by the evaluator) |
| --- | --- | --- |
| Research present, current, re-baselined | PASS | `research.md` re-derived against `main` @ `3ab64720f`, which matches this worktree's merge-base. Findings 1-6 spot-checked at source, not taken on report. |
| Root cause independently reproducible | PASS | `generate-register-apps.ts` gates the probe on `type === 'app' && entry.Port` while `needsHttpEndpoint()` returns `true` unconditionally for `type === 'app'`. `MINIMAL_APP` carries `Port: 8000`; `UNPINNED_APP` (what `init` scaffolds) does not — so the #954 regression test passes while every fresh scaffold emits an endpoint and no probe. |
| Scope-2 evidence (services/plugins actually serve the probe path) | PASS | `packages/service/src/builder/service-builder-impl.ts:370-378` registers `/health`, `/health/live`, `/health/ready`. `packages/plugin/src/service/presentation/create-plugin-service.ts:179` calls `builder.withHealth(...)` **unconditionally** — I read the surrounding block; it sits outside every `if`. Both claims verified at source. |
| Blast radius of a newly-failing probe bounded | PASS (condition C1) | No generated resource `waitFor`s a service or plugin: the only `waitFor` edges are `infrastructure.primaryDatabase` (services/plugins/background), `waitForCompletion` for the desktop prebuild, and `withCacheReference` → cache. A service that fails its new probe turns amber; it does not stall siblings. |
| Decisions locked with rationale | PASS | D1-D5 in `plan.md`. D1 correctly relocates the precondition from host-port pinning to endpoint existence — the actual defect. D3's reuse of `RESOURCE_DEFAULTS.AppHealthCheckPath` across three resource classes is right on the value, imprecise on the name (see C2). |
| Open-decision sweep | PASS | One open item — live AppHost dead-port test feasibility. Correctly framed as feasibility, not a deferred decision, and the plan pre-commits to stating the generator-level floor honestly rather than claiming coverage. Right disposition for acceptance box 3. |
| Risk register | PASS | Four risks, each mitigated. The one that matters — a custom `Entrypoint` serving no `/health` — is named and mitigated by the `HealthCheckPath: false` opt-out. |
| Commit slicing | PASS | One bounded slice, well under limits, with its gate and file set enumerated. |
| Gate set | PASS | The six scoped gates specified in the brief, plus `quality:gate` and `doc:lint` for the public-surface change. Appropriate: this slice does change a published type in `@netscript/aspire`. |
| Deferred scope explicit | PASS | `tauri`/`desktop`/`task`/background/tools untouched; no CLI health-reporting consumer invented; Aspire's upstream collapse of zero reports to `Healthy` explicitly disclaimed as not NetScript-owned. |
| Public-surface posture | PASS | Two optional fields added to `ServiceEntry`/`PluginEntry`, mirroring `AppEntry`. Additive; no export-map or entrypoint change. |

## Hardest read of my own framing

The brief I wrote produced D2 and D3, so those get the adversarial pass:

- **D2 (services + plugins) is scope expansion beyond the issue's reproduction.** The issue
  reproduced on an app. I widened it because acceptance box 1 says "an executable resource," not
  "an app." I still judge that correct — leaving services and plugins unprobed would satisfy the
  reproduction while leaving the stated criterion false — but it is a **default behaviour change
  for existing projects**: a service whose `Entrypoint` was overridden to something that does not
  use `defineService` flips from green to `Unhealthy` on upgrade. The opt-out exists and the blast
  radius is bounded, so this is a documentation obligation, not a blocker.
  **C1: the PR body must call this out as a behaviour change with the `HealthCheckPath: false`
  migration note.** It is also why this slice should not be marked ready without a human reading
  that note.
- **D3 reuses `AppHealthCheckPath` for non-app resources.** That constant's JSDoc in
  `packages/aspire/constants.ts` is written entirely about the scaffolded Fresh app and #954.
  Reusing it verbatim for services and plugins makes the doc wrong at the point of reuse.
  **C2: update that JSDoc, or add a correctly-named sibling constant.** Minor — and exactly the
  drift my framing invited by naming the constant in the brief.
- **My brief asserted the cause.** The plan reproduced it independently (`deno eval` against
  `generateRegisterApps` with `UNPINNED_APP`) rather than restating my claim. That is the correct
  handling, and it is why this passes rather than being a plan that is only as good as my framing.

## Verdict

`PASS` — implementation may proceed, subject to C1 (PR documents the behaviour change and the
`HealthCheckPath: false` migration) and C2 (fix the reused constant's JSDoc). Neither is
load-bearing on the fix itself; both are re-checked at IMPL-EVAL.
