# IMPL-EVAL — #1387 Slice 7 (MCP access result contract)

**Evaluator:** Anthropic Claude, separate session, opposite family to the Codex author. No head was
moved, nothing committed or pushed, and nothing was posted to GitHub. No runtime gate was run and no
lease was acquired.
**Certified head:** content `897a06cd7170ca021da1836b3cbcbf790cf97a2f` (evidence heads
`8e20cf708d4f53df5b5cb8626edeedc2e6b9bd12` — receipts + worklog/context-pack — and
`f60c851991b82834366b6d45dbe24c7b9cc9d7d8` — `tier-a-slice-7.md` — verified product-neutral).
**Verdict:** **PASS** at `897a06cd7170ca021da1836b3cbcbf790cf97a2f`.

## Ceiling

| Check | Method | Result |
| --- | --- | --- |
| Five authorized files | `git diff --name-status ae90bb264..897a06cd7` | exactly `operation-access.ts` (A), `tool-contracts.ts` (M), `list-service-operations-flow.ts` (M), `get-operation-schema-flow.ts` (M), `openapi-projection.ts` (M) — no other product path |
| Corpus carrier scope | `check:mcp-export-corpus --check` semantics + worklog | `export-surface-corpus.generated.ts` is the standing ceiling-exempt generated carrier (plan.md § corpus, lines 138–142; gate = regen + byte-compare) |
| Slice 6 receipt archive move | `git show 897a06cd7 --name-status` | nine R100 renames into `receipts/slice-6-11e83f064/`, byte-identical |
| `deno.lock` byte-identical | sha256 at both heads | `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` == `edfa0c24…`, 0-line diff |
| Evidence heads product-neutral | `git show 8e20cf708/8e20cf708` name-status | `8e20cf708` = 8 receipts + `evidence-set.json` + worklog/context-pack; `f60c85199` = `tier-a-slice-7.md` only — no product paths |

## Bounded and credential-free — read the type, not the name

`operation-access.ts:2-11`:

```ts
export interface OperationAccessSummary {
  readonly authentication: 'none' | 'optional' | 'required';
  readonly securitySchemes: readonly string[];
  readonly scopes: readonly string[];
  readonly roles: readonly string[];
}
```

- Carries **no credential values and no principal data**: only a finite tri-state, scheme *names*,
  and open string arrays for scopes/roles. No token, header value, principal id, or secret anywhere.
- Confirmed a **genuine projection**, not a re-export or structural copy. It is a new interface in a
  new file; `grep` over `packages/mcp/src` shows **zero imports from `packages/service`**.
  `ProcedureAccessPolicy` (`packages/service/src/auth/contract-policy.ts:20-26`) differs in kind:
  two-state `authentication`, `requiredScopes`/`requiredRoles`, no `securitySchemes`. The MCP type
  is deliberately narrow for the MCP output surface — the plan's "MCP must not import from
  `packages/service` for this" is satisfied.
- The corpus renders `authentication: unknown` / `securitySchemes: unknown` because the corpus
  serializer prints unions and array-typed members as `unknown` (the same rendering `tags` already
  had at base) — a serialization artifact, not a source-type weakening. Source types are exact.

## Genuinely optional, in both places

- **TypeScript:** `readonly access?: OperationAccessSummary` present on both
  `ServiceOperationSummary` (`list-service-operations-flow.ts:18`) and
  `GetOperationSchemaResult` (`get-operation-schema-flow.ts:27`).
- **JSON-schema `outputShapes`:** `access` is a declared property in both shapes but **absent from
  both required arrays**:
  - `list_service_operations` operations row: required = `['operation','method','path','summary','tags']`
  - `get_operation_schema`: required = `['service','operation','method','path','view','schema','curlExample','authNote']`
- The two representations agree: optional in TS, not required in JSON-schema. No "optional in one,
  effectively required in the other" asymmetry.
- Inside `access` itself all four sub-fields are required (complete summary or nothing) in both the
  TS interface and the `operationAccessShape` required array — internally consistent, not an
  optionality contradiction.

## No population — verified by absence, not by trust

Full base→content diffs of both flow files contain **only** two additions each: the
`OperationAccessSummary` type import and the optional field on the result interface. Verified by
`git diff ae90bb264 897a06cd7` on both flows (all added lines enumerated) and by reading the
current implementation bodies:

- `createListServiceOperationsFlow` maps rows to exactly
  `{ operation, method, path, summary, tags }` — `access` never computed, never assigned
  (`list-service-operations-flow.ts:52-59`).
- `createGetOperationSchemaFlow` returns exactly
  `{ service, operation, method, path, view, schema, curlExample, authNote }` — no `access`
  (`get-operation-schema-flow.ts:68-75`).
- `authNote` unchanged byte-for-byte: the sole assignment site
  `authNote: OPENAPI_CURL_AUTH_NOTE` (`get-operation-schema-flow.ts:74`) is present identically at
  base and content; `OPENAPI_CURL_AUTH_NOTE` is untouched.
- Because `access` is never populated, the tightened `operations.items` schema (which is a delta on
  top of the prior opaque array and matches the actual row keys with `additionalProperties: false`)
  is truthful against real runtime rows — the list rows emit exactly the five required keys. The
  schema tightening is in plan scope (the plan authorizes editing `tool-contracts.ts`) and is
  self-consistent.

## Constructibility proof — typed, not asserted

`tool-contracts.ts:39-47`:

```ts
const operationAccessExample: OperationAccessSummary = {
  authentication: 'required',
  securitySchemes: ['bearerAuth'],
  scopes: ['catalog:read'],
  roles: ['reader'],
};
```

- The **annotation is present** (`: OperationAccessSummary`) — a real typed literal, not
  `as OperationAccessSummary`, not `unknown`. A breaking interface change (e.g., dropping a member
  or changing the authentication union) fails `deno check` at this exact literal.
- Wired into the schema: `operationAccessShape` spreads `{ ...objectSchema(...), examples:
  [operationAccessExample] }`, and `operationAccessShape` is the value of `access` in both
  `outputShapes` entries; `TOOL_OUTPUT_SCHEMAS` wraps each shape via `createToolSchema`, so the
  example rides the advertised JSON schema. Checked by reading `tool-contracts.ts:31-52, 356-382`,
  `397-405`.
- The example itself is credential-free (scheme name `bearerAuth`, scopes `['catalog:read']`, roles
  `['reader']`), so even the schema metadata leaks nothing.

## Corpus delta — 7 654 → 7 655, decoded not counted

Both corpus versions were gzip/base64-decoded from the committed `generated.ts` at each head:

| Metric | Base `ae90bb264` | Content `897a06cd7` |
| --- | --- | --- |
| Entries | 7 654 | 7 655 |
| Content-only keys | — | exactly 1: `@netscript/mcp` `.` `./openapi-projection` `OperationAccessSummary` (interface) |
| Base-only keys | 0 | — |
| Other signature-change keys | 0 | 0 (only the two widened interfaces, below) |

The only other corpus deltas are the two pre-existing symbols whose signatures the slice widened
intentionally: `GetOperationSchemaResult` and `ServiceOperationSummary` gain `readonly access?:
OperationAccessSummary`. `tags: unknown` was already `unknown` at base. No unrelated symbol moved.

The checked-in payload hash matches the gate receipt exactly:
`sha256(gzip payload) = 2a9b042c69a1a4bc358a2363a161227238b031722b254fa7889a8542998f2620`, equal to
the `mcp-export-corpus` receipt's provenance hash. And `check:mcp-export-corpus --check`
(`generate-export-surface-corpus.ts:468-478`) regenerates from live `deno doc` and byte-compares,
so the PASS is a true freshness proof, not a padded claim.

## Evidence integrity — all eight receipts at the content head

| Receipt | `argv` | durationMs | started→finished consistent | gitHead == actualGitHead |
| --- | --- | --- | --- | --- |
| check | `deno task check --include ^packages/mcp/` | 1 458 | ✓ | `897a06cd7…` == `897a06cd7…` |
| lint | `deno task lint --include ^packages/mcp/` | 607 | ✓ | ✓ |
| fmt-check | `deno task fmt:check --include ^packages/mcp/` | 577 | ✓ | ✓ |
| test | `deno task test packages/mcp/tests` | 7 500 | ✓ | ✓ — stdout `{"passed":136,"failed":0,"totalResults":136}` |
| exports-drift | `deno task docs:exports-drift` | 3 499 | ✓ | ✓ — "Exports & Symbols drift check: PASS" |
| mcp-export-corpus | `deno task check:mcp-export-corpus` | 8 380 | ✓ | ✓ — stdout `symbolCount: 7655` |
| quality-gate | `deno task quality:gate` | 10 209 | ✓ | ✓ — mcp doctrine FAIL=0 (WARNs pre-existing) |
| publish-dry-run | `deno task publish:dry-run` | 36 506 | ✓ | ✓ — stderr `Success Dry run complete` for full workspace |

Per the brief, receipts were verified by **argv + durationMs** (computed from
`startedAt`/`finishedAt`, match recorded `durationMs` exactly in all eight), not by exitCode alone —
though all eight also record `exitCode: 0` and `outcome: PASS`. `evidence-set.json` recomputes
`SUFFICIENT` with zero reasons at `immutableHead = 897a06cd7`.

Archived sets: `slice-1-2ddd6048` … `slice-5-c2cbfbf0b` directories are byte-untouched by this
slice's content diff; archive-internal `gitHead`s match their slice labels. `slice-6-11e83f064` was
created by R100 moves from the top level with `gitHead == 11e83f064…` — intact, not a copy. The top
level holds **only** Slice 7's set (8 gate receipts + `evidence-set.json`; no `doc-lint.json` —
correct, since MCP public doc-lint is contracted base-red).

## Gate result cross-checks performed independently

- **MCP public doc-lint base-red verified, not taken on trust:** ran
  `run-deno-doc-lint.ts --root packages/mcp` at both content and base (in a temporary detached
  worktree, removed). `entrypointExitCodes` identical at both heads: `cli.ts: 1`, `mod.ts: 1`,
  `openapi-projection.ts: 0`. The new export file is clean, the red is pre-existing — the exclusion
  is exactly as contracted in `plan.md`.
- **Openapi-projection lint:** the new export line introduces 0 doc-lint findings on that entrypoint.
- **No casts/bypass:** `grep` for `as OperationAccessSummary` / `: unknown` over the slice files shows
  none; the only `: unknown` matches are pre-existing unrelated input/shape typings.
- **Test evidence:** `test.json` inner record confirms `["deno","test","--reporter=tap","--allow-all","packages/mcp/tests"]` → 136 passed / 0 failed, files 0.

## Process trail (context, not a slice defect)

- `worklog.md § Design` exists and precedes implementation.
- Plan-EVAL history: two `FAIL_PLAN` cycles recorded in `plan-eval.md` (cycle 2 escalated to owner
  per protocol); `worklog.md` lines 258–266 record that the coordinator released the leaf under the
  owner-accepted adapter boundary after the five cycle-1 fixes were applied. That escalation trail is
  pre-existing run process — it does not touch Slice 7's content, and Slice 7's plan section
  (`plan.md:265-279`) is implemented exactly as written. Recorded here as context; not a finding
  against this slice.
- Slice 7's gate set meets its plan stop lines (scoped check/lint/fmt, MCP tests, MCP JSR audit via
  `quality:gate` + direct audit, `docs:exports-drift`, `mcp-export-corpus`); `publish-dry-run` is
  superset evidence.
- No `deno.lock` delta, no debt file delta, no doctrine violation introduced (MCP doc-lint red is
  pre-existing and excluded by contract; MCP quality-gate FAIL=0).

## Findings

None.

## Verdict

| Field | Value |
| --- | --- |
| **Verdict** | **PASS** |
| **Certified content head** | `897a06cd7170ca021da1836b3cbcbf790cf97a2f` |
| **Rationale** | Ceiling respected exactly (five authorized files + exempt corpus carrier + Slice 6 archive move; `deno.lock` byte-identical). `OperationAccessSummary` is bounded and credential-free by construction and is a genuine new projection with zero `packages/service` coupling. `access` is optional in both TypeScript interfaces and absent from both JSON-schema required arrays. Neither flow populates `access` and `authNote` is byte-for-byte unchanged — verified by full diffs and current source, not by assertion. Constructibility is proven with a real typed literal (no cast) wired into both schemas' `examples`. Corpus decoded directly: 7 654 → 7 655, exactly the one new exported type, no unrelated symbol moved, payload hash matches the receipt. All eight receipts verify at the content head by argv and durationMs. Independent re-runs confirm the doc-lint base-red exclusion and a clean `openapi-projection` entrypoint. Evidence heads verified product-neutral. |