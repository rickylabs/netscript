# Plan: generated triggers KV adapter bootstrap

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.5--orchestration/slices/w2-a-1325` |
| Branch | `fix/triggers-generated-kv-adapter-bootstrap` |
| Phase | `plan-eval` |
| Target | `plugins/triggers`, shared generated-runtime invariant, scaffold runtime E2E |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Archetype and doctrine verdict

Archetype 5 is controlling because the product defect is generated userland glue owned by the
first-party triggers plugin. The service overlay adds real Aspire health and structured-log proof.
The doctrine verdict remains **Refactor**; this focused fix will not deepen the accepted
verification-shape or connector-convergence debt.

## Goal

Make generated triggers deterministic and healthy with Redis/Garnet and Deno KV, while adding a
shared, enumerated behavioral invariant that prevents any first-party KV-backed background runtime
from shipping without an effective provider bootstrap.

## Scope

- Add a RED-first behavioral test that executes generated trigger glue under selected-provider
  initialization and fails when Redis registration is absent or inert.
- Reuse the core-owned `@netscript/kv/redis` registration entrypoint in trigger glue; do not fork
  provider detection or registration in the plugin.
- Replace the saga-only text assertion with, or supplement it by, the same shared behavioral seam.
- Enumerate all KV-backed first-party background runtimes in scaffold.runtime and require generated
  project health JSON, exact Aspire resource health/endpoints, and structured startup logs.
- Exercise Redis/Garnet and `CACHE_PROVIDER=denokv` without editing generated files.

## Non-Scope

- Trigger connector SOUND convergence, missing service routes, or raw HMAC routing.
- Plugin folder restructuring or closing the verification-shape debt.
- New KV provider types, dynamic provider loading, dependency upgrades, release/canary publication,
  merge, or issue closure.

## Hidden Scope

- Generated-module execution must distinguish an effective registration side effect from inert
  import text.
- The full runtime suite must install/register triggers as a background resource, not merely copy
  its plugin package.
- Runtime evidence must survive isolated ports and shared-host ownership rules.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| LD-1 | `@netscript/kv` remains the sole provider-selection and adapter-registration authority. | A5/A10 and plugin thinness; existing core seam is sufficient. |
| LD-2 | Trigger glue composes the existing `@netscript/kv/redis` side-effect entrypoint before importing/starting trigger runtime. | Matches the saga seam and preserves server-only opt-in. |
| LD-3 | RED proof executes generated output and initializes the selected provider; no assertion may pass solely because a string import exists. | Issue acceptance explicitly rejects inert emitted imports. |
| LD-4 | A shared enumerated test/runtime contract names every KV-backed first-party background runtime (currently sagas and triggers; workers included if research proves it uses the shared KV lifecycle). | Prevents sibling drift without a second plugin-specific mechanism. |
| LD-5 | Provider scenarios are finite constants (`redis`/`garnet` selection family and `denokv`) used by the behavioral and E2E gates. | Deterministic extension axis; avoids stringly scattered cases. |
| LD-6 | Aspire evidence uses `start --isolated`, exact AppHost/resource waits, health JSON/endpoints, structured OTEL logs, and exact owned cleanup. | Service overlay and owner contract; process survival is insufficient. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Add a public KV registry-inspection API | safe to defer / rejected | Existing runtime behavior is the proof; new public surface would be test-driven API pollution. |
| Move runtime bootstrap generation into core | safe to defer / rejected | Static server-entry composition remains thin plugin glue; provider convention already lives in core. |
| Which runtimes are KV-backed | resolved now | Workers, sagas, and triggers all consume the shared KV lifecycle in their real startup paths; enumerate all three. |
| Exact focused Redis proof | resolved now | Import emitted glue with `import.meta.main === false`, then invoke core `getKv()` under forced Redis selection. The missing/inert bootstrap deterministically throws the core “adapter is not registered” error before any network connection; the registered path proceeds beyond that boundary. Real connectivity/health remains Aspire evidence. |

No decision that would force rework remains open. PLAN-EVAL must still challenge whether the
focused probe and the two-provider generated-project evidence are sufficient.

## Commit Slices

| # | Slice | Proving gate | Files |
| - | --- | --- | --- |
| 1 | RED: shared behavioral generated-runtime provider invariant | focused Deno test fails before implementation, then passes | plugin resource tests and/or shared test support; run artifacts |
| 2 | Thin trigger bootstrap composition | focused triggers+sagas generator tests; `verify-plugin` | trigger runtime stub; focused tests; run artifacts |
| 3 | Enumerated generated-project runtime health for every KV-backed first-party background runtime and both providers | focused CLI E2E unit tests plus isolated runtime evidence | `packages/cli/e2e/**`; run artifacts |
| 4 | Publish/fitness and serialized release verdict | scoped wrappers, `quality:gate`, `arch:check`, doc-lint, publish dry-run, granted one-pass `scaffold.runtime` | evidence-only run artifacts unless a gate exposes an owned fix |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Import order appears correct but registration is inert | Execute emitted module and force selected-provider initialization. |
| Deno module cache contaminates provider scenarios | Run each scenario in an isolated subprocess/generated workspace. |
| Full E2E only proves default Garnet | Add explicit Deno KV provider scenario with generated-file immutability check. |
| Shared-host resource collision or foreign cleanup | Leak-check before/after; isolated start; exact AppHost path; mutate only positively owned resources. |
| Scope expands into connector/runtime redesign | Stop and report rescope; preserve both accepted debt entries. |
| Lockfile churn from validation | Scoped check wrapper uses `--deno-arg --no-lock`; inspect raw git status after gates. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-9 | risk | One enumerated invariant, not duplicated saga/trigger helpers. |
| AP-11 | intentional core edge | Registration side effect remains explicit in generated service entrypoints, never hidden in generic core import. |
| AP-18 | risk | Behavioral execution and health assertions replace text-only generated-string proof. |
| AP-19 | risk | Generated runtime/provider permissions and env remain declared and exercised. |
| AP-24 | risk | Finite provider/runtime data is enumerated; no duplicated switches. |
| AP-25 | risk | Process/env/network effects stay at generated runtime and E2E adapter edges. |

## Fitness Gates

F-1, F-3, F-5 through F-19 for Archetype 5 apply as required/subtype. Existing accepted debt is
reported as `DEBT_ACCEPTED`, never silently treated as fixed. F-13 is required because generated
long-running runtime behavior changes.

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `plugins/triggers — doctrine verdict Refactor` | none | Run `verify-plugin`; do not claim closure or restructure. |
| `triggers-connector-sound-deferred` | none | Service connector untouched. |

## Validation Plan

1. Focused RED/generated-runtime tests (record the pre-fix nonzero exit).
2. Focused triggers/sagas plugin tests and both `verify-plugin.ts` commands.
3. Focused CLI E2E tests for the new enumeration/health gate.
4. Scoped check/lint/fmt wrappers over each changed root (`--ext ts,tsx`; check adds
   `--deno-arg --no-lock` and `--deno-arg --unstable-kv`).
5. `rtk proxy deno task quality:gate` and `rtk proxy deno task arch:check`.
6. `deno task doc:lint --root plugins/triggers --pretty`, relevant plugin/core JSR audit, and
   `rtk proxy deno task publish:dry-run` because a publishable plugin surface is touched.
7. Read-only leak-check, isolated generated AppHost runs for Garnet and Deno KV, exact resource
   waits, endpoint/health JSON and OTEL logs, exact AppHost-scoped teardown, post-run leak-check.
8. Once otherwise green: write `EXPENSIVE-GATE-REQUEST`, push, notify orchestrator, wait for grant,
   then run exactly `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` once.
9. Review-thread gate before handoff; set `status:impl-eval`; ask orchestrator for separate IMPL-EVAL.

## Deferred Scope

- Connector convergence and verification-shape remediation remain under their accepted debt owners.
- No release action is authorized; the milestone orchestrator owns merge and canary.

## Drift Watch

- Any need for a new public core API, non-generated state, runtime topology redesign, foreign
  resource mutation, or inability to prove both providers is significant drift and requires rescope.
