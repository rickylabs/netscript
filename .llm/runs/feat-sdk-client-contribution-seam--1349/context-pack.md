# Context Pack — #1349 typed SDK client-contribution seam

## Current state

- Branch: `feat/sdk-client-contribution-adapter`
- Run: `.llm/runs/feat-sdk-client-contribution-seam--1349/`
- Authority: Accepted RFC 0001 and approved cycle-2 plan (`plan-eval.md` = `PASS`)
- Base for this slice: exact Slice-2 commit `49a59f488ca93420e90a392e53f37fa80691d3e7`
- Active scope: Slice 3, the final implementation slice
- Status: implementation and SDK-local gates complete; draft handoff proceeds with the full
  scaffold runtime gate not green because of an external Aspire/Postgres resource-start failure

## Landed Slices 1–2

- Slice 1 established the public v1 contribution descriptor/helper/error contract, context and
  query generic propagation, exact server-key algebra, direct-only type omission, Desktop
  excess-property rejection, compatibility defaults, and existing-entrypoint exports.
- Slice 2 established exactly three private adapter responsibilities, immutable preparation, the
  stable-v1 outer logical epoch wrapper, unary prepare-once behavior, reconnect epoch rotation, and
  the private-surface/packed-consumer absence gates.
- `TError` remains the third `ServiceClientMethod` slot. `port` and `timeout` remain accepted and
  deprecated. No internal adapter identity, link, barrel, subpath, or oRPC declaration identity is
  public.

## Slice 3 content

- Construction validates the contribution tuple through `unknown`: exact plain-object shapes,
  protocol/id rules, duplicate id/context/header ownership, reserved context names, Fetch/framework
  header policy, tuple/context/header limits, and forbidden dependency/order/priority/environment
  extras. Desktop rejects even an empty widened `contributions` field at runtime with
  `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`.
- Preparation projects required context, validates declared lowercase string headers and CR/LF
  safety, honors abort without invoking a contributor, and maps resolver/partition failures to
  deterministic framework-authored codes without source causes or secret-bearing messages.
- Partitioned contributions append canonical id-sorted, visible non-secret suffixes to full server
  and TanStack read keys. Empty/invariant tuples preserve the exact old key shapes, invalidation
  prefixes stay unsuffixed, mutation keys stay unsuffixed while their context is forwarded, and
  direct-only services remain available under `clients` but disappear from `queries` and
  `queryUtils` at runtime as well as type level.
- Recursive query utilities cover query, streamed, live, and infinite full keys. Tests also prove
  cross-partition server-cache and persisted-key isolation plus paired generated collection
  key/function wiring.
- README and public entrypoint JSDoc now document the contribution surface, partition visibility,
  direct-only behavior, epoch law, and HTTP-only Desktop boundary. The worked README example is
  compiled by `readme-doctest_test.ts`.
- One isolated consumer integration test proves a contributed header reaches final fetch while the
  SDK still emits a CLIENT span and final `traceparent`; the contributed value appears in neither
  the captured span snapshot nor stderr.

## Final SDK evidence

| Gate | Result |
| ---- | ------ |
| Focused Slice 3 tests | PASS: validation/cache/query/Desktop/docs/observability plus Slice-2 adapter and private-surface tests |
| Structured SDK check | PASS: 99 files, 0 occurrences, `stdout.bytes=305` |
| Structured SDK test | PASS: 113 passed, 0 failed/ignored, `stdout.bytes=289` |
| Structured SDK lint | PASS: 99/99 files, 0 findings/refusals, `stdout.bytes=355` |
| Structured SDK format | PASS: 99/99 files, 0 findings/refusals, `stdout.bytes=304` |
| `quality:scan` / `arch:check` | PASS / PASS; zero quality findings and SDK `FAIL=0` |
| RFC fixture | PASS under exact `deno check --unstable-kv` invocation |
| Private surface / packed consumer | PASS; no new internal export or importable subpath |
| Doc lint | 3 baseline / 0 new under required `--root packages/sdk --pretty` invocation |
| SDK publish dry-run | PASS; evidence is `stderr.bytes=8746`, with expected zero stdout |
| JSR audit | PASS; dry-run `OK`, existing cardinality/banner-derived warnings only |
| MCP export corpus | Not regenerated: public symbol/export delta is zero |
| Lock and ceiling | PASS; `deno.lock` remains byte-identical (`edfa0c24…`) and product edits stay in the Slice-3 ceiling |

Receipts live under `.llm/tmp/gate-receipts/sdk-1349-s3/` and are intentionally uncommitted.

## Scaffold runtime gate

- The canonical one-pass command completed 38 gates and failed at `database.init`: Aspire canceled
  the owned `netscript-db-postgres` start, then its stop operation received a 404 for an already
  missing executable resource. `cleanup.aspire-stop` passed.
- A clean retry after a zero-survivor leak report again passed every pre-database phase and entered
  the Postgres start, but its driver disappeared without a terminal suite summary. It is not
  counted as a pass.
- Read-only ownership reports showed healthy Aspire/Docker probes and zero survivors; final
  `aspire ps --format Json` returned `[]`. No unrelated resource was touched.
- Consequently this draft is not represented as merge-ready. A later merge-readiness session must
  obtain a green canonical scaffold runtime verdict.

## Locked boundaries and handoff

- No descriptor dependency or environment field exists; such fields reject as shape-invalid.
- #1350, #1351, #1352, #1353, #451, #1093, service-preset incoming headers, shipped locale
  contributions, and oRPC v2 migration remain deferred.
- Slice 3 adds no public symbol, internal export, package subpath, or dependency/lock change.
- Commit Slice 3 once on top of `49a59f488`, push by explicit refspec, and open a draft PR covering
  Slices 2 and 3 with `Refs #1349`. Merging leaves #1349 open.
- Apply no labels, tick no acceptance boxes, dispatch no evaluator, and do not merge.
