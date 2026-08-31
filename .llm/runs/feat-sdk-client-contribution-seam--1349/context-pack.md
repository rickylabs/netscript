# Context Pack — #1349 typed SDK client-contribution seam

## Current state

- Branch: `feat/sdk-client-contribution-seam`
- Run: `.llm/runs/feat-sdk-client-contribution-seam--1349/`
- Authority: Accepted RFC 0001 and the approved cycle-2 plan (`plan-eval.md` = `PASS`)
- Active scope: Slice 1 only — public contract, tuple/key algebra, compatibility proofs
- Status: implementation and amended gates complete; one Slice-1 commit/draft-PR handoff remains

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

## Locked boundaries

- `port` and `timeout` remain accepted and deprecated; #1351 owns their disposition.
- Protocol v1 has no dependency ordering, priority, or environment field.
- Desktop keeps its existing excess-property rejection; runtime unsupported-transport handling is a
  later slice.
- Slice 1 contains no adapter, preparation epoch, transport, cache runtime, or stable-v1 behavior.
- The types-accepted-but-unconsumed intermediate must not publish.
- `deno.lock` is byte-identical. No product file outside the approved Slice-1 ceiling changed.

## Final evidence

| Gate                                             | Result                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| RFC fixture + three named compatibility fixtures | PASS, all exact `deno check --unstable-kv` commands exit 0          |
| Scoped SDK check/lint/fmt                        | PASS over exactly 91 TS/TSX files; all stdout non-empty             |
| Full scoped SDK test wrapper                     | PASS, 79 passed / 0 failed / 0 ignored                              |
| `quality:scan` / `arch:check`                    | PASS / PASS                                                         |
| SDK publish dry-run                              | PASS; evidence is on stderr (`8129` bytes), with normal zero stdout |
| JSR audit                                        | PASS (exit 0); authoritative dry-run has no real slow-type failure  |
| Lock and ceiling checks                          | PASS                                                                |

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

The final leaf rerun reproduces `totalErrors=3`, all `private-type-ref`, in those same files.

## Handoff constraints

- Commit the Slice-1 product files, `worklog.md`, and this context pack together as the single slice
  commit, then push with an explicit refspec.
- Open a draft PR against `main` with `Refs #1349` and `Part of #1348`; merging leaves #1349 open.
- Do not apply readiness labels, tick acceptance boxes, dispatch an evaluator, or merge.
