# Drift Log: `/design` production exclusion

No divergence from issue #1481, RFC 0005, the requested scope, or doctrine was identified during Phase 1 planning.

Future entries are append-only. In particular, implementation must record drift before expanding beyond `packages/cli/**` plus this run directory, weakening fail-closed runtime polarity, sharing one exclusion signal, or changing the hosted-only E2E constraint.

## D-1 — Runtime suite selector omitted from plan file list

- **Severity:** minor
- **Observed:** The plan names the new gate definition, gate ID, and `suite-registry_test.ts`, but omits `packages/cli/e2e/suites/scaffold/capability-suites.ts`. That existing file is the sole selector that maps registered gate IDs into `scaffold.runtime`/`scaffold.runtime.sqlite`.
- **Ruling:** Add the new gate ID to the existing `RUNTIME_GATES` list immediately after `scaffold.init`, as required by the approved gate ordering. Do not create a new gate file or directory child.
- **Scope effect:** One additional existing file under authorized `packages/cli/**`; no architecture, mechanism, or acceptance change.
- **Evidence:** `createScaffoldCapabilityGates()` registers `createGeneratedQualityGates()`, while `createScaffoldCapabilitySuite()` selects only IDs listed by `capability-suites.ts`.

## D-2 — Cross-feature service-client order assertion omitted from plan file list

- **Severity:** minor
- **Observed:** Hosted core CI at head `98699f4bd` passed both runtime tiers but failed one
  `service-client-runtime-probe_test.ts` assertion. The service-client test required
  `DATABASE_CODEGEN` and `GENERATED_SERVICE_CLIENT_CONTRACT` to be adjacent in both the service and
  runtime suites; #1481 intentionally inserts `SCAFFOLD_DESIGN_PRODUCTION_EXCLUSION` between those
  gates in the runtime suite.
- **Ruling:** Update the existing order assertion to preserve service-suite adjacency while
  explicitly requiring runtime order `DATABASE_CODEGEN` → `SCAFFOLD_DESIGN_PRODUCTION_EXCLUSION` →
  `GENERATED_SERVICE_CLIENT_CONTRACT`. Do not change runtime behavior, skip a test, or weaken either
  product contract.
- **Scope effect:** One additional existing test under authorized `packages/cli/e2e/**`; no public
  surface, mechanism, or runtime change.
- **Evidence:** CI run `33715250151`, job `100523026122`, uploaded `test.report.json`: 5235 passed /
  1 failed, exact diff `21` vs `22` at the named order test.
