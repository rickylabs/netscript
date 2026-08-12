# Research — #1548 Fresh Streams browser resolver cannot see Aspire VITE service references

Delegated read-only sub-agent (Claude · Opus 5, `drift.md` D-1), bounded brief. Finished **within
budget** — 15 tool calls, ~2 min — after the earlier #1398 pass had to be stopped at 72 calls. Every
claim carries a `path:line` citation; the unverified list is part of the finding.

## The read path today

`packages/plugin-streams-core/src/application/stream-url-resolver.ts`:

- `getBrowserServiceEndpoint()` (`:54-72`) calls `readImportMetaEnvironment(import.meta)` at `:60` —
  **`import.meta` is passed as a value argument**.
- `readImportMetaEnvironment` (`:74-79`) reaches `meta.env` through a **parameter binding**, guarded
  by `'env' in meta` and `isEnvironmentRecord` (`:81-88`).
- Both keys are then read by **computed index** — `env[fullKey]`, `env[shortKey]` (`:64,:68`) — for
  `VITE_services__streams__http__0` and `VITE_STREAMS_URL`.
- The whole browser branch is wrapped in `try { … } catch { return undefined }` (`:59,69-71`), so
  **every failure is silent**. That is why the symptom is a generic "URL not found" rather than
  anything pointing at env reading.

The thrown message (`:128-132`) is a **verbatim match** with the issue text.

**Precedence** in `getStreamsUrl()` (`:99-133`): `DURABLE_STREAMS_URL` (Deno-gated) → 
`services__streams__http__0` (Deno-gated) → **browser `VITE_*` branch** → throw. There is no default
or `localhost` fallback. The browser branch is third and is the **only** branch reachable in a
browser bundle.

## The reported cause: code shape confirmed, build semantics deliberately not asserted

Two independent reasons the value is unreachable by static substitution — the issue names the first,
the research found the second:

1. The literal expression `import.meta.env.VITE_services__streams__http__0` **never appears in
   source**; `import.meta` crosses a function boundary as a value (`:60` → `:77-78`).
2. Even given a bag, the keys are read by **computed index** (`:64,:68`), not as static member
   expressions.

**Repo-internal corroboration, which is stronger than a claim about Vite:** this codebase's own
first-party Vite plugin injects env by emitting `define` entries keyed exactly as
`` `import.meta.env.${mapping.target}` `` (`packages/fresh/src/application/vite/vite.ts:195`, applied
at `:311-335`). That mechanism is textual/static-expression substitution **by construction** — it
cannot reach a value-passed `import.meta` nor a computed index. So the failure is explicable purely
from this repo's own substitution machinery, without asserting anything about Vite's internals.

The sub-agent explicitly **did not** verify Vite's runtime behaviour for a bare `import.meta`, nor
how Fresh's Vite pipeline treats a JSR dependency module, and said so rather than asserting it.

## A first-party Vite plugin already exists — this is not net-new infrastructure

`createNetScriptVitePlugin()` (`packages/fresh/src/application/vite/vite.ts:282`, `enforce: 'pre'`,
`:307-309`) already carries a typed env-injection API: `NetScriptViteEnvMapping` (`:76-83`),
`envMappings`/`env` options (`:99-102`), and `buildDefineEntries()` (`:183-199`). It has tests
(`vite.test.ts`).

But the scaffold template
(`packages/cli/src/kernel/assets/app/vite.config.ts.template`) wires the plugin **without**
`envMappings` or `env` — it passes only `appRoot`, `workspaceRoot`, `aliasEntries`, `watchPaths`,
`routeManifest`. The define machinery is present and currently unused by generated apps.

## The SDK already solved this shape

`packages/sdk/src/discovery/browser-env.ts` splits a **pure** `getBrowserServiceUrlFromEnv(env, …)`
(`:35-54`) from the `import.meta` access (`:65`), and that pure function **is unit-tested** —
`packages/sdk/tests/discovery/env-ordering_test.ts:24,41,56` cover browser-full-key precedence,
shorthand fallback, and server fallback with an **injected env bag**.

That is exactly the asymmetry here: the injectable function is testable and tested; the
`import.meta`-reading function is neither.

## Test coverage: none

**There are no unit tests for `stream-url-resolver.ts`'s URL resolution at all.** The nine test files
in `packages/plugin-streams-core/tests/` never reference `getStreamsUrl`. The only repo-wide
references pass an explicit `baseUrl` and bypass resolution entirely
(`plugins/streams/services/src/sse-contract_conformance_test.ts:108`,
`packages/fresh/src/runtime/streams/create-stream-db_test.ts:22`). Nothing simulates a browser or
Vite environment.

## Options, with published-surface impact (no recommendation made by research)

| Option | Surface impact | Note |
| --- | --- | --- |
| Literal `import.meta.env.VITE_*` member expressions inline | **none** — `getBrowserServiceEndpoint` is not exported (`mod.ts:19` exports only `buildStreamUrl`, `getStreamsAuth`, `getStreamsUrl`) | key strings are fully known: `STREAMS_RESOURCE_NAME` is a compile-time constant (`constants.ts:5`) |
| Split reader from lookup, SDK-style | additive export **if** the pure fn is exported | makes the browser path unit-testable without a Vite build |
| Add `envMappings` to the scaffold template | changes generated output + CLI template, not the package API | only helps if the read pattern is one `define` can reach — i.e. must pair with the literal-read change |
| New `transform` hook rewriting the JSR module | none | most fragile; couples the framework to a bundler's module graph |
| Documented required `baseUrl` override | none | zero-code docs fix, but pushes discovery onto every consumer and contradicts the resolver's stated purpose (`:42-53`) |

## Explicitly not verified

- Vite's actual behaviour for a value-passed `import.meta`, for computed indexing of
  `import.meta.env`, and for JSR dependency modules under Fresh's Vite pipeline.
- That the Aspire AppHost in fact injects both VITE variables into the dashboard process — the naming
  helper exists (`packages/aspire/src/application/build-vite-env-var-name.ts`) but the injection path
  was not traced.
- Any runtime reproduction; no gates, tests, or builds were run.
- Whether `vite.test.ts` covers `buildDefineEntries`.
