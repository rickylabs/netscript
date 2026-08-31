# Context Pack — #1349 typed SDK client-contribution seam

## Current state

- Branch: `feat/sdk-client-contribution-adapter`
- Run: `.llm/runs/feat-sdk-client-contribution-seam--1349/`
- Authority: Accepted RFC 0001 and the approved cycle-2 plan (`plan-eval.md` = `PASS`)
- Active scope: Slice 2 only — private ports, stable-v1 adapter, and logical-call epoch conformance
- Base: exact merged Slice-1 commit `58a4a10eb`
- Status: implementation and all seven Slice-2 gates complete; one commit/draft-PR handoff remains

## Landed Slice-1 content

- Public contribution protocol/descriptor/cache/prepare/context algebra in
  `packages/sdk/src/ports/sdk-client-contribution.ts`.
- Curried literal-preserving `defineSdkClientContribution()` helper and the fixed redacted
  contribution error/code/diagnostic contract.
- Appended compatibility-default context generics across service clients, query factories, query
  utils, and `defineServices()`, while preserving `TError` in the third method slot.
- Exact three/five server key tuple algebra and the 16-success/17-failure tuple budget.
- Public exports only through the existing root/client/ports/presets surfaces. No `link`,
  `ClientLinkPort`, `ClientLinkCallOptions`, or `internal` export exists.
- The committed RFC fixture now imports the real public surface and retains all original assertions,
  with explicit forbidden-field, Desktop, `TError`, and exact-key proofs.

## Slice-2 content

- Exactly three private adapter responsibilities in
  `src/internal/client-contributions/adapter-ports.ts`, with no internal barrel or package subpath.
- One preparation port that creates a frozen RFC snapshot, projects only contribution-declared
  context keys, invokes each contribution once per logical epoch, and freezes the canonical header
  record and prepared-call channel.
- One stable-v1 adapter that alone interprets upstream procedure nodes and wraps transport dispatch
  in outer logical-call epochs. A non-empty contribution tuple disables the inner retry plugin and
  reuses one prepared value across opening retries; iterator reconnect begins a fresh preparation.
- The existing internal link seam carries the prepared value directly. The same value may cross
  stable-v1 callbacks under a package-private symbol; the symbol never reaches contribution context
  or a public documentation graph.
- `createServiceClient()` consumes the contribution tuple and returns its inferred context. The HTTP
  link derives URL and contributor headers from the prepared value while retaining discovery,
  serialization, dedupe, tracing, final trace injection, fetch, and error ownership.
- Focused runtime tests prove unary count-1, reconnect count-2 with A→B rotation, abort/no-epoch,
  callback snapshot isolation, fresh per-attempt headers, terminal error identity, and both omitted
  and explicit-empty requests byte-identical to the fixed pre-adapter wire snapshot.
- Consumer tests prove four-entrypoint private-name absence, three packed negative imports, and zero
  upstream identity in all new public contribution declarations.

## Locked boundaries

- `port` and `timeout` remain accepted and deprecated; #1351 owns their disposition.
- Protocol v1 has no dependency ordering, priority, or environment field.
- Desktop keeps its existing excess-property rejection; runtime unsupported-transport handling is a
  Slice-3 concern.
- Slice 3 retains construction/header/error validation, cache/query behavior, Desktop runtime
  rejection, public docs, and combined header/CLIENT-span proof; none was pre-empted here.
- No public symbol or export was added in Slice 2. `client-link-factory.ts` remains package-internal.
- `deno.lock` is byte-identical. No product file outside the approved Slice-2 ceiling changed.

## Final Slice-2 evidence

| Gate | Result |
| ---- | ------ |
| Unary retry / HTTP headers | PASS: prepare 1, attempts 2, same prepared identity and bytes, fresh header containers, existing terminal error identity |
| Iterator reconnect / abort | PASS: prepare 2 and attempts `[A,A,B,B]`; abort case remains prepare 1 / transport 1 |
| Callback snapshot | PASS: only declared contribution context and RFC snapshot fields observed; SDK retry/cache/trace fields absent |
| Private surface / packed consumer / zero-oRPC | PASS across four documentation roots, all three negative imports, and every new public symbol |
| Structured SDK check/test/lint/fmt | PASS: 96 files; 95 tests; stdout respectively 305 / 287 / 355 / 304 bytes |
| `quality:scan` / `arch:check` | PASS / PASS |
| RFC fixture | PASS under exact `deno check --unstable-kv` invocation |
| SDK publish dry-run | PASS; evidence is on stderr (8,426 bytes), with normal zero stdout |
| JSR audit | PASS (exit 0); no new portability or actual slow-type finding |
| Doc lint | 3 baseline / 0 new under required `--root packages/sdk --pretty` invocation |
| Lock and ceiling checks | PASS; `deno.lock` byte-identical and no Slice-3/public-export drift |

## Gate 4 amendment — verbatim measurement

Measured verdict on the three `private-type-ref` findings:

| Tree                                   | `totalErrors` |
| -------------------------------------- | ------------- |
| clean `main`                           | **3**         |
| this leaf, with all of Slice 1 present | **3**         |

Same three files in both — `packages/sdk/src/ports/query-client.ts`,
`packages/sdk/src/query-client/query-client-factory.ts`, and
`packages/plugin-streams-core/src/application/create-durable-stream.ts`. **Slice 1 introduces zero
new doc-lint findings.** The third file is not even in `packages/sdk`, so it could never have been
fixed inside this leaf's package boundary.

The final Slice-2 rerun reproduces `totalErrors=3`, all `private-type-ref`, in those same files.

## Handoff constraints

- Commit the Slice-2 product files, `worklog.md`, and this context pack together as the single slice
  commit, then push with an explicit refspec.
- Open a draft PR against `main` with `Refs #1349` and `Part of #1348`; merging leaves #1349 open.
- Do not apply readiness labels, tick acceptance boxes, dispatch an evaluator, or merge.
