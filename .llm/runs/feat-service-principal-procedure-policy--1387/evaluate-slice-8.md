# IMPL-EVAL — #1387 Slice 8 (MCP/agent access projection, behavior)

**Evaluator:** separate Claude session, opposite family to the Codex-authored content.
**Certified content head:** `ce9bd3e8b5b7e06dd21785dfe452efb94a909bf3`
**Evidence head:** `34796d147c0ecd1d391e884b02fe20f421ad3a51` (HEAD of this worktree, clean)
**Base:** `edb3831b6` · **PR:** rickylabs/netscript #1762, draft, `Refs #1387 — partial`
**Plan:** `plan.md` § Slice 8 · **Tier-A:** `tier-a-slice-8.md` · **SKILL:** `netscript-harness`

## Verdict

**PASS** — certified at content head `ce9bd3e8b5b7e06dd21785dfe452efb94a909bf3`.

Every criterion was verified by reading the changed source against Slice 6's forward projection and
the tests, plus an independent re-run of all eight contracted gates at the content head. No
runtime lease was acquired; no E2E/Aspire/Docker/browser gate ran.

## 1. Ceiling — correct, not a shortfall

Exactly five of seven authorized files changed:

- `packages/mcp/src/domain/openapi/operation-access.ts` — adds `deriveOperationAccessSummary`
- `packages/mcp/src/application/flows/list-service-operations-flow.ts`
- `packages/mcp/src/application/flows/get-operation-schema-flow.ts`
- `packages/mcp/tests/operation-index_test.ts`
- `packages/mcp/tests/openapi-read-tools_test.ts`

`operation-index.ts` and `packages/mcp/tests/fixtures/openapi/no-db-generated-openapi.json` are
genuinely unneeded, not skipped: `indexOpenApiOperations` already retains each raw operation object
**without mutation** (`readonly operation: OpenApiObject`), so `operation.security` and
`operation['x-netscript-roles']` are reachable from prior-slice work (verified at `edb3831b6`).
`deno.lock` is byte-identical between base and content head (SHA-256 `edfa0c24…d1820c` at both).

## 2. Reverse mapping — exact and defensive

Read line by line against the four contracted cases (base `openapi.ts` forward mapping verified at
`edb3831b6`: `none`→`security: []`; `optional`→`[{},{bearerAuth:[]}]`; `required`→
`[{bearerAuth:[...scopes]}]` + `x-netscript-roles`):

- **No own `security` key** (or non-array) → `undefined`. ✓
- **`security: []`** → `{ authentication: 'none', securitySchemes: [], scopes: [], roles }`. ✓
- **Empty-object alternative present** (`optional` = at least one `{}` requirement) → `optional`,
  schemes from non-empty alternatives' keys, scopes from their values, roles `[]` — matching Slice 6
  which never writes roles alongside `optional`. ✓
- **No empty alternative** → `required`, scopes from requirement values, roles from
  `x-netscript-roles`. ✓

Defensive parsing is real, not cosmetic: `isSecurityRequirement` filters non-object entries
(null/primitives/arrays) from `security`; `stringArray` filters non-string members of
`x-netscript-roles`; all-invalid `security` → `undefined`. No throw, no silent corruption.

## 3. Absence is genuine

Both flows conditionally spread `...(access ? { access } : {})`, so an undeclared operation emits no
`access` key. The test proves it with `Object.hasOwn(rows[0]!, 'access') === false` and
`Object.hasOwn(details[0]!, 'access') === false` — an own-property check, not equality/undefined.

## 4. Curl guidance — four genuinely distinct states, no secrets

Read from `curlGuidance`: undeclared → bare `curl -X METHOD 'URL'` with the unchanged
`OPENAPI_CURL_AUTH_NOTE`; `none` → appends `# Public operation…`; `optional` → appends
`# Optional authentication…`; `required` → replaces the command with
`curl -X METHOD -H 'Authorization: Bearer <credential>' 'URL'`. All four produce distinct
`curlExample` and `authNote` strings — asserted via `new Set(...).size === 4` on both — and the
`required` case is a literal placeholder, never a fabricated token (asserted via
`.includes('Bearer <credential>')`). The undeclared/default case is **byte-for-byte** the pre-Slice-8
behavior: same `curlExample` template and same `OPENAPI_CURL_AUTH_NOTE` constant (unchanged), no
added comment. No secrets are solicited, embedded, or echoed.

## 5. Corpus and lock — correctly unchanged

The slice only populates the `access?` optional fields that Slice 7 already added to
`GetOperationSchemaResult`/`ServiceOperationSummary`; it exports no new symbol and edits no `mod.ts`.
The `mcp-export-corpus` carrier is byte-identical to Slice 7's end state (SHA-256 `2a9b042c…f2620`,
7 655 symbols) — verified against the archived Slice 7 receipt. `deno.lock` byte-identical (see § 1).

## 6. Evidence integrity

Seven top-level receipts, each `gitHead == actualGitHead == ce9bd3e8b…`; verified by `argv`
(correct scoped invocations) and `durationMs` (positive, plausible: check 409 ms, lint 666 ms,
fmt 658 ms, test 6 864 ms, quality 9 960 ms, corpus 8 194 ms, publish 36 121 ms), not by exitCode
alone. `evidence-set.json` is `SUFFICIENT`, zero reasons. Slices 1–7 archived sets are present,
their receipts point at their own content heads (Slice 2's three gates at the documented
supplementary head `04d22e7e1` from the prior E-1 fix), and the archives are byte-untouched across
Slice 8 (`git diff edb3831b6..34796d14` over `receipts/slice-*` is empty). Top level holds only
Slice 8's set.

## Independent verification (read-only; no lease acquired)

Re-ran all contracted gates at the content head with the repo wrappers, all PASS:
scoped check (116 files / 0 diagnostics), scoped lint (115 / 0), scoped fmt (115 / 0), MCP tests
(**138 / 0**, matching the receipt), `quality:gate` (exit 0, FAIL=0), `mcp-export-corpus` (7 655,
identical SHA), `publish:dry-run` (exit 0), and the MCP JSR audit (`audit-jsr-package.ts`, exit 0,
3 existing warnings — two folder-cardinality, one slow-type). Working tree left clean.

## Findings

None blocking.

**Non-blocking observations (stated plainly):**

1. The plan's Slice 8 Tier-A list names "MCP JSR audit", but it has no durable receipt in the top
   level — it was recorded in `worklog.md` as a direct package audit (same as Slice 7). I confirmed
   independently that it passes (exit 0, 3 existing warnings), so this is an evidence-format
   consistency note, not a correctness gap.
2. The PR #1762 body's `## Slices` checklist is stale (only Slice 1 checked though S2–S8 have
   landed) and the body text is the Slice 1-era summary. The body correctly retains the protected
   `Refs #1387 — partial` wording with **no** auto-close keyword, and `worklog.md` records that the
   structured Slice 8 implementation comment was posted. PR-body governance is `netscript-pr`'s
   concern and is not an IMPL-EVAL gate; noted for the record.

## Gate closure for the slice

All Slice 8 named Tier-A gates verified (check/lint/fmt, MCP tests, quality:gate, mcp-export-corpus,
deno.lock hash, publish dry-run, MCP JSR audit). Evidence standard met: every PASS row carries a
command/file/trace.
