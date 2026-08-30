# Context Pack: plugin doctor generator-selected source authority

## Current Phase

PLAN-EVAL cycle 1 returned harness `PASS` / PR `APPROVED` at plan commit `13402d3f`. S7 is committed
red-before, S8 owns the shared AI selector and v1 inspection document, and S9 now consumes and
validates that document fail-closed through the installed generator's injected `ProcessPort`.

## S7 Evidence

Authorized path 6 now contains a real AI project case:

- workspace `./plugins/*` with the repository AI plugin copied locally;
- appsettings installs `plugin-ai`;
- one ready tool, discoverable `ai/tools/skill-loader.ts` factory, and one agent;
- real installed generation through `DenoFileSystem` + `DenoProcess`;
- assertion that the generated tools registry legitimately excludes `skill-loader.ts`;
- complete project file-byte snapshot before doctor and equality assertion after doctor;
- healthy doctor assertion.

At the S6 product head the structured focused suite exits `1`: 5 passed / 1 failed. The sole failure
is `plugin doctor stays healthy when AI generation excludes the skill-loader factory`, raising
`RemoteError`. This is the required red for F1. The existing
`installed-runtime-registry-integration_test.ts` is untouched.

## Binding PLAN-EVAL Amendments

- PE-5: the integration-test interpretation is overturned. The ceiling is exactly eleven paths;
  S7 and layer-3 no-write proof live in path 6.
- PE-2: S8 adds a plain `inspectAiRegistries(files, targets)`-style builder in path 10. On the same
  fixture and for every declared target, its `sourceFiles` must deep-equal
  `compileAiRegistry(files, target).files`, including order. The CLI entrypoint only serializes it.
- PE-9: path 2 is expected to cross the 500-line F-1 cap. That is a doctrine `WARN`; the coordinator
  forbids the split parser file and `arch:check` fails only on `fail` totals. Record, do not conceal.
- PE-10: S9 uses neutral title `Runtime registry inspection`; the protocol prefix disambiguates.
- PE-8: S10 runs `check:mcp-export-corpus` as a raw reproducible command, not a catalog gate.
- Sweep-1: generator authority with zero selected sources across all targets still throws
  `EmptyPluginRegistryError`.
- PE-11: `supervisor.md` now records the PLAN-EVAL pass rather than `N/A`.

## S8 State

- AI manifest advertises `inspectionProtocol: 1`.
- `selectAiRegistrySources` is the only selection pipeline used by both `compileAiRegistry` and the
  plain `inspectAiRegistries` builder.
- The CLI inspect path validates its required invocation args, loads the inline manifest JSON, and
  directly serializes the builder's v1 document without compile writes/progress logs.
- PE-2 is proven on one two-target fixture: every inspect `sourceFiles` array deep-equals the matching
  compile `files` array, including order; inspect writes remain empty.
- Focused AI compiler suite: 9/0. Full structured AI plugin suite: 32/0. S8 structured check/format:
  zero diagnostics/findings.

## S9 State

- Only a present `inspectionProtocol` key activates inspection. Integer `1` invokes the same external
  generator with the exact inspect suffix, inline manifest JSON, and neither write permission nor a
  manifest sidecar; absence performs the unchanged legacy walk without a child process.
- Advertised-version, process, JSON/schema, exact-target-set, duplicate, canonical-path, and
  regular-file failures all retain the generator-inspection prefix and never fall back.
- Doctor evidence identifies generator-selected versus legacy manifest-discovered sources, uses the
  neutral wrapper title, and preserves `EmptyPluginRegistryError` for an all-empty inspected result.
- Installed-generator plus focused-doctor structured suites are 15/0. The real AI doctor case is
  healthy and its complete project byte snapshot is unchanged. Exact six-file check/lint/fmt are
  clean, `quality:gate` exits 0, and raw lock diff exits 0.
- Path 2 is 673 lines and produces the expected PE-9 F-1 `WARN`; CLI doctrine totals remain
  `FAIL=0`. The ruled ceiling prevents a new parser file, so this is recorded scope pressure.

## Locked Contract

- Optional `runtimeRegistryGenerator.inspectionProtocol: 1`.
- Only a present key activates inspection. V1 uses
  `--inspect --inspection-protocol 1 --manifest-json <json>`, with neither `--manifest` nor
  `--allow-write`, and accepts one strict JSON stdout document.
- Invalid advertised declaration, process failure, or invalid response fails closed; no fallback.
- Absent key retains the legacy manifest walk and no dry-run child process.
- AI owns one pure selector shared by inspect and compile; host owns only generic report validation.
- Strict schema/version, exact target set, duplicates, safe project-relative paths, and regular-file
  validation.

## Remaining Slices

1. S10 — exact author-owned gates and evidence; required `scaffold.runtime` remains
   supervisor-coordinated under the singleton lease.

Each slice commits, explicitly pushes, posts one structured PR comment, updates PR evidence, and
reconciles before the next.

## Boundaries

- Exactly eleven enumerated product/test paths. Any other path is rescope-and-stop into `drift.md`.
- No workers/sagas/triggers adoption; F4 is follow-up.
- No author-run `e2e:cli`, Aspire, Docker, browser, or runtime lease work.
- No `deno.lock` change, merge, draft flip, labels, issue/acceptance edits, or self-verdict.
- `scaffold.runtime` is required later, but the supervisor obtains and sequences the lease.
