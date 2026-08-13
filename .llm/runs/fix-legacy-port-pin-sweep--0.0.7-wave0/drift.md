# Drift — legacy-port-pin-sweep

## 2026-08-13 — significant — filed manifest-removal assumption is stale

- The first focused structured test proved that deleting `servicePort` and `backgroundPort` from
  `plugins/streams/scaffold.plugin.json` is not mechanical on current main.
- `packages/plugin/src/protocol/manifest.ts` currently requires `officialSource.backgroundPort` and
  validates `serviceEntrypoint`, `serviceConfigKey`, and `servicePort` as an atomic all-present or
  all-omitted service shape. The shipped manifest becomes invalid when the two numbers are removed.
- The maintainer official-copy adapter also still projects `backgroundPort`, and it treats the
  service triple as the discriminator for an official service source. Therefore the issue's claim
  that the installer ignores both values is true only of the newer plugin-owned install allocator,
  not of the shared manifest/copy compatibility surface.
- The invalid manifest/fixture deletion was restored immediately. Fixing the schema and copy
  compatibility contract requires undeclared files and is a genuine rescope owned by the topic
  orchestrator/coordinator.

## 2026-08-13 — significant — explicit-URL contract needs undeclared tests

- The proposed auth command correctly rejects an omitted `--stream-url` with actionable Aspire
  discovery guidance.
- The focused structured reporter found two current tests that deliberately call `session list`
  without the option. Updating them (and adding the required error-path assertion) requires
  `auth-plugin-command_test.ts`, which is outside the frozen four-file surface.
- No test was edited and no broken source slice was committed. The proposed auth source diff remains
  in the working tree for orchestrator inspection.

## PLAN-EVAL correction

The pre-edit `PLAN-EVAL: N/A` was justified from the issue and discovery boundary, but the first
contract test falsified the filed assumption that manifest cleanup was mechanical. Any expanded
schema/copy remedy now contains a material compatibility decision and requires a revised plan plus
separate PLAN-EVAL. If the orchestrator instead narrows the leaf to the explicit-URL behavior and
authorizes only the focused test surface, PLAN-EVAL can remain N/A because that remedy is mechanical.
