# Research — actual main and public transport

Observed 2026-11-11. Source #2610 and all its comments, the #2474 maintainer
handoff, and assignment #832 were read. #832 had no orchid-triage comment.
Default branch is `main`; remote HEAD/main and local baseline matched
`12c981104c1d13812d7119798911a0937e74348c` before writing evidence.
The worktree was initially clean. No other checkout was edited.

## Ownership

Source #2610 has no assignee. Source timeline links only the existing consumer
PR, consumer issue, maintainer handoff and this assignment. Exact #2610 PR search
returned none; the open-PR inventory contains no SDK GET repair. Broader dedupe
and no-store searches found older unrelated work; the title-only dedupe result
was a merged Fresh/Preact module-ID fix, not this failure. The only open harness
inbox title for this source was #832. No second owner/PR was verified. Recheck
before implementation because these observations can become stale.

## Dependencies and published boundary

SDK manifest version: 0.0.9. oRPC manifest range: ^1.15.5. Native module graph and
root lock resolve SDK client/fetch/plugins/standard to **1.15.5**. The consumer
report uses **1.16.1**, which is not the local locked graph. The repository
`deps:latest --filter @orpc/client` stable-channel tool reported **1.16.2**;
being newer does not establish a fix. No lock, dependency manifest or cache was
deleted, reloaded or changed. GitHub's latest non-prerelease is v0.0.9,
published 2026-11-03; the #2474 stable-release handoff links the release and green
publication/production E2E. No release was dispatched by this run.

## Source chain

- `packages/sdk/src/internal/transport-policy.ts`: every logical GET is eligible;
  force-cache has an explicit cache context, default always matches with `{}`;
  no no-store group exists. Cache resolution itself recognizes no-store.
- `packages/sdk/src/client/http-client-link.ts`: adapts those group descriptors
  directly into the released `DedupeRequestsPlugin`. The final fetch adapter
  reads cache and signal only from its received context.
- Installed `@orpc/client@1.15.5/dist/plugins/index.mjs`,
  `DedupeRequestsPlugin.#execute`: replaces the logical context with group.context
  and replaces the request signal with `toBatchAbortSignal(signals)`. Equality
  includes encoded body, headers, method and URL; safe equivalent requests
  coalesce within a deferred queue, not a persistent response cache.
- Its public `dist/plugins/index.d.mts` exposes `filter` and static groups whose
  context is explicitly used for the rest of the request lifecycle. There is no
  merge-caller-context option to enable. The proposed correction uses that
  supported filter/group contract, not private upstream methods.
- Installed `@orpc/standard-server@1.15.5/dist/batch/index.mjs`: no effective batch
  signal when any input is unsignalled; otherwise abort waits for every input.
  This plugin does not independently reject one aborted dedupe subscriber.
- Installed client `dist/adapters/fetch/index.mjs`: standard request becomes a
  real Request with the effective signal; init initially only specifies redirect.
  Consequently `init.signal` absence does not prove the Request lost its signal.
- `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts`: resolves
  `callOptions.signal ?? callOptions.context.signal`, prepares per epoch, then
  carries that effective signal to the upstream link. Contributions consume
  their declared context before dedupe; retry remains outside the HTTP group.

## Public reproducer and observed RED

The source report links the immutable consumer regression at
`44309a0f7f6da31286bdc99527231b7feab4de1f`. Read-only retrieval confirmed it asserts
actual fetch `[cache, signal instanceof AbortSignal]` equals `['no-store', true]`.
The associated server adapter uses public `createServiceClient`, the canonical
bearer contribution, and a real combined request/deadline signal. Consumer code,
routes and tests were not edited or executed here.

`get-context.repro_test.ts` exercises the current public workspace SDK, native
contract GETs and canonical bearer contribution, replacing only the final network
boundary. It sends no network traffic and starts no server or application.
The SDK Request, codec, contribution preparation, retry plugin, dedupe plugin,
header generation and response decoding remain real.

Structured baseline result: **5 PASS / 5 assertion FAIL / 0 ignored**, exit 1.
Failures: explicit no-store plus init signal; metadata-only no-store; public
GET init signal; no-store/default sharing a fetch; cancelled subscriber waiting
for an unsignalled peer. Controls: default GET coalescing, force-cache metadata,
contributed identity isolation, effective single-request abort, elapsed deadline.
The evidence therefore does not claim all baseline actual cancellation is broken,
or any demonstrated cross-tenant disclosure.

## Review boundary and publication hygiene

This is plan evidence, not product acceptance. Independent exact-plan review and
parent continuation are absent. No evaluator/design agent was dispatched.
Local raw module graph/reports/receipts retain operational fields and are excluded
by this run's `.gitignore`. Public evidence is a clearly identified normalized
derivative with relative paths, source hashes and raw artifact SHA-256 digests;
it must not be mistaken for the original command receipt. The committed test and
commands allow the reviewer to independently reproduce the observations.
