# Worklog — feat/703-streams-cli

## Plan

Base `eac57c5f5ac4c10b9c1cc5b17874ae821b27a20d` verified before edits. This is an
Archetype 6 CLI/tooling slice folded into the `plugins/streams` Archetype 5 thin-plugin surface,
with the docs overlay. PLAN-EVAL is owner-waived by the slice brief (carried drift D1).

1. Implement topic discovery plus `list-topics`, `publish`, `subscribe`, `stats`, `inspect`, and
   `clear` behind injected CLI services; prove with semantic unit and local durable-service tests.
2. Add schema, producer, and consumer resource scaffolders, wire `add-schema`, `add-producer`, and
   `add-consumer`, and prove emitted modules type-check and are discoverable.
3. Add Streams topic health to plugin doctor, expose the top-level `netscript streams` forwarding
   group, add scaffold-runtime E2E gate definitions (without running the suite), and align docs.
4. Run scoped check/lint/fmt, targeted tests, doctrine/doc gates, verify `deno.lock` unchanged,
   commit and push each completed slice.

Risks: producer files do not share one export shape, so discovery is source-based and must tolerate
core-owned producer factories; runtime commands must accept an explicit path when static metadata
is incomplete; generated Fresh code must use stable Fresh 2.x imports. New public exports receive
explicit types and docs to avoid slow types. No dependency version decision is needed: the Streams
client uses the workspace npm catalog entry already pinned for `@durable-streams/client`.

## Design

- Public commands: `list-topics`, `subscribe`, `publish`, `stats`, `inspect`, `clear`,
  `add-schema`, `add-producer`, `add-consumer`; top-level CLI forwards `netscript streams …` to the
  installed plugin `/cli` entrypoint.
- Domain vocabulary: `StreamTopic`, `StreamCollection`, `StreamsCliServices`, scaffold input types,
  and stable command-name constants. Topic identity is a discovered stream path when available,
  otherwise a deterministic project-relative name.
- Ports/seams: topic discovery, runtime client, and artifact writer are injected into `StreamsCli`;
  filesystem and network effects remain in CLI adapters. The existing plugin `ItemScaffolder`
  contract remains the only generation abstraction.
- Generated outputs: schema module; producer module; StreamDB factory, query island, and Fresh 2.x
  seed route. Templates import core/upstream public APIs and do not redefine stream conventions.
- Existing CLI spine remains owned by `packages/cli`; this slice introduces no new spine or
  layer-2 abstract. Root command composition remains registry-driven and declarative.
- Extension axes: existing public command registry (`string` key → command factory) gains
  `streams`; existing plugin resource list gains `schema`, `producer`, and `consumer` descriptors.
- Permission requirements: topic discovery/scaffolding need read/write; runtime verbs need env/net.
- Contributor path: add a verb through the Streams command descriptor list and its service seam;
  add a generated artifact through one resource folder and register it in `resources/mod.ts` and
  `streamsAdapterPlugin.resources`.
- Deferred: dashboard routes/actions, manifest-layer `defineStreamProducer`/`defineStreamConsumer`,
  and execution of `scaffold.runtime` remain outside this slice; the orchestrator owns the full E2E
  run.

## Drift

- D1 (carried, owner-approved): PLAN-EVAL is waived for this implementation lane. A compact plan
  and design checkpoint is recorded here before implementation as directed by the slice brief.

## Evidence

### Slice 1 — topic discovery and runtime verbs

- Added source-based discovery for `streams/*-producer.ts`, `streams/*-stream.ts`, and
  `plugins/*/streams/producer.ts`, including sibling `defineStreamSchema` collection metadata.
- Replaced all five runtime stubs and added `inspect`; `stats` and `inspect` return the
  `inspectStreamTopic` report, while publish uses `createDurableStream`, subscribe reads the
  durable-stream HTTP surface, and clear deletes dev state.
- `deno test --allow-all plugins/streams/tests/cli/streams-cli_test.ts` — PASS, 5/5, including a
  real publish/subscribe round-trip against `DurableStreamTestServer`.
- Scoped wrappers for `plugins/streams`: check PASS (38 files, 0 diagnostics), lint PASS (38 files,
  0 findings), fmt PASS (38 files, 0 findings).
- `git diff --exit-code -- deno.lock` — PASS; no lock change retained.

Reconcile: issue #703 scope remains unchanged. The walker intentionally tolerates core-owned
producer factories that do not expose a literal stream path; those topics use a deterministic
plugin name until explicit metadata is available. No new architecture debt was introduced.

### Slice 2 — schema, producer, and consumer scaffolders

- Added exact `add-schema`, `add-producer`, and `add-consumer` verbs plus equivalent generic plugin
  resources. The outputs are a `defineStreamSchema` module, a `createDurableStream` producer, and a
  StreamDB factory + query island + Fresh 2.x seed route.
- Generated-artifact validation writes all outputs to a temporary project, confirms the topic
  walker discovers `/billing/invoices`, and runs `deno check --no-lock --unstable-kv` across every
  generated `.ts`/`.tsx` module — PASS.
- Targeted Streams tests — PASS, 13/13 across CLI runtime behavior, real server round-trip,
  resource semantics, generated compilation, and discovery.
- Scoped wrappers for `plugins/streams`: check PASS (45 files, 0 diagnostics), lint PASS (45 files,
  0 findings), fmt PASS (45 files, 0 findings).
- `git diff --exit-code -- deno.lock` — PASS.

Reconcile: generated consumer code follows stable Fresh 2.x (`createDefine`, single-context
handler) and remains userland glue over core/upstream primitives. No rescope or architecture-debt
entry is required.
