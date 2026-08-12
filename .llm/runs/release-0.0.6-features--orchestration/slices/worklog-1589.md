# Worklog — #1589 coherent Fresh/SDK cache-provider closure

## Design

- **Public surface:** no Fresh, SDK, telemetry, or CLI export changes. Consumer-visible output is a
  generated `.netscript` dependency-closure preflight plus generated `deps:closure`, `dev`, and
  `build` task wiring.
- **Domain vocabulary:** `NetScriptWebRuntimeClosure`, `ResolvedPackageIdentity`, `ClosureMember`,
  `ClosureFinding`, and the finite Fresh/SDK/optional-telemetry member list.
- **Ports / seams:** init evaluates the resolved import-map fragment through a pure closure
  classifier. The emitted consumer edge uses `import.meta.resolve()` and local package-manifest
  reads, then feeds normalized identities into the same policy shape. No general resolver port or DI
  container is introduced.
- **Constants:** the closure package names, Fresh export subpaths, SDK export subpaths, diagnostic
  code/name, and generated verifier/task filename are finite constants. Tests compare subpath
  constants to the packages' real export maps.
- **Commit slices:** S1 establishes closure semantics + init rejection + generated verifier and is
  proved by focused negative/positive tests. S2 wires generated tasks and is proved by consumer
  execution plus the scaffold runtime smoke. Both update this worklog/context evidence when they
  eventually run.
- **Deferred scope:** peer metadata, `globalThis`, cache/partial behavior, arbitrary scoped import
  maps/direct literals, and automated repair.
- **Contributor path:** update the finite closure policy when Fresh/SDK exports change; add identity
  normalization cases beside the generated verifier; change task invocation only in the workspace
  and app manifest generators.

## Plan-phase evidence

- PLAN-EVAL: **pending; hard stop**. No implementation file has been changed.
- Baseline: branch parent `fc312f211`; carried brief/triage commit `a317933d`.
- Scratch Deno 2.9.5 resolver probes distinguished the reported split and accepted coherent JSR and
  local-source mappings.
- `deno.lock`: unchanged.
- Required implementation boundaries from the brief remain untouched.

## PLAN-EVAL attention

The evaluator should decide whether the explicit generated-workspace boundary is sufficient for
#1589. The first cut does not claim complete coverage of hand-authored direct literal JSR imports or
per-referrer scoped import maps. Expanding to those graphs would materially widen the design and
must happen before implementation, not during it.
