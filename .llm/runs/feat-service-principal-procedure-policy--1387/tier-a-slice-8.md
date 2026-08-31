# Tier-A — #1387 Slice 8 (MCP/agent access projection, behavior)

**Content head:** `ce9bd3e8b5b7e06dd21785dfe452efb94a909bf3`
**Evidence head:** `15a5197235cee5b49fa1f5167619b35057055c93` — product-neutral
**Base:** `edb3831b6` · **Verdict:** ACCEPTED

## Ceiling

Five of seven authorized files touched (`operation-index.ts` and the fixture JSON correctly
untouched — the raw operation was already reachable from Slice 6/7's work, so no ceiling file went
unused for a wrong reason, just fewer were needed than authorized). `deno.lock` byte-identical.
Corpus unchanged at 7 655 symbols — the correct result for a slice that populates existing optional
fields rather than exporting anything new, the opposite (and here also correct) expectation from
Slice 7.

## Substance — the reverse of Slice 6's mapping, verified field by field

`deriveOperationAccessSummary` in `operation-access.ts`:

- **Undeclared** (`Object.hasOwn(operation, 'security')` false, or not an array): returns
  `undefined` — `access` stays genuinely absent downstream via `...(access ? { access } : {})` in
  both flows, not a synthesized empty summary.
- **`security: []`** → `authentication: 'none'`, empty schemes/scopes, roles from
  `x-netscript-roles` if present.
- **An empty-object alternative present** (`[{}, {bearerAuth:[]}]`, Slice 6's `optional` shape) →
  `authentication: 'optional'`, schemes from the non-empty alternative's keys, roles deliberately
  empty (Slice 6 never sets roles alongside `optional`).
- **No empty alternative** (`[{bearerAuth: [...scopes]}]`) → `authentication: 'required'`, scopes
  from the requirement's values, schemes from its keys, roles from `x-netscript-roles`.

Defensive parsing throughout (`isSecurityRequirement` filters non-object security entries,
`stringArray` filters non-string array members) — this does not trust the OpenAPI document blindly.

**Curl guidance genuinely differs per state, and never handles secrets.** `none`/`optional` append an
explanatory comment to the same base curl command; `required` is the only state that changes the
command itself, adding `-H 'Authorization: Bearer <credential>'` — a placeholder token, not a
fabricated real-looking secret. The undeclared/default case is **byte-for-byte the original**
`OPENAPI_CURL_AUTH_NOTE` and original curl format — no regression to the legacy behavior.

## The test proves the strong claims, not just the happy path

One test builds a four-operation fixture (undeclared/none/optional/required) and: asserts `access` is
genuinely **absent** via `Object.hasOwn` on both undeclared results (list row and detail result, not
just one); asserts the exact derived value for all three declared states; asserts
`new Set(curlExamples).size === 4` and `new Set(authNotes).size === 4` — proving the four states
produce four genuinely distinct strings, not one template that happens to satisfy loose assertions;
and asserts the required curl example contains `Bearer <credential>` specifically, proving the
no-secrets guidance is real.

## Gate results — all at content head `ce9bd3e8b`, `gitHead == actualGitHead`

| Gate | Outcome | Duration |
| --- | --- | --- |
| `check` (scoped) | PASS | 409 ms |
| `lint` (scoped) | PASS | 666 ms |
| `fmt:check` (scoped) | PASS | 658 ms |
| `test` (MCP) | PASS — **138 passed / 0 failed** | 6 864 ms |
| `quality:gate` | PASS | 9 960 ms |
| `mcp-export-corpus` | PASS, unchanged at 7 655 symbols | 8 194 ms |
| `publish:dry-run` | PASS | 36 121 ms |

Evidence set **SUFFICIENT**, zero reasons. Slices 1–7 archives present and untouched.

## Findings

None.

## Verdict

**ACCEPTED.** Ceiling respected (5 of 7 files, none needed unnecessarily), lock and corpus both
unchanged as expected, all seven receipts PASS, evidence set sufficient, 138/138 tests. The reverse
mapping is exact and defensively parsed; the four-state proof is genuinely discriminating, not
happy-path; the no-secrets constraint is met by construction (a placeholder token, never a real one).
