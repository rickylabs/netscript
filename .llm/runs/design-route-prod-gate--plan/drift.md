# Drift Log: `/design` production exclusion

No divergence from issue #1481, RFC 0005, the requested scope, or doctrine was identified during Phase 1 planning.

Future entries are append-only. In particular, implementation must record drift before expanding beyond `packages/cli/**` plus this run directory, weakening fail-closed runtime polarity, sharing one exclusion signal, or changing the hosted-only E2E constraint.

## D-1 — Runtime suite selector omitted from plan file list

- **Severity:** minor
- **Observed:** The plan names the new gate definition, gate ID, and `suite-registry_test.ts`, but omits `packages/cli/e2e/suites/scaffold/capability-suites.ts`. That existing file is the sole selector that maps registered gate IDs into `scaffold.runtime`/`scaffold.runtime.sqlite`.
- **Ruling:** Add the new gate ID to the existing `RUNTIME_GATES` list immediately after `scaffold.init`, as required by the approved gate ordering. Do not create a new gate file or directory child.
- **Scope effect:** One additional existing file under authorized `packages/cli/**`; no architecture, mechanism, or acceptance change.
- **Evidence:** `createScaffoldCapabilityGates()` registers `createGeneratedQualityGates()`, while `createScaffoldCapabilitySuite()` selects only IDs listed by `capability-suites.ts`.
