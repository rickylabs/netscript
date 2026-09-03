# IMPL-EVAL — #1387 Slice 6 (OpenAPI access projection)

**Evaluator:** Anthropic Claude, separate session, opposite family to the Codex author. No head was
moved, nothing committed or pushed, and nothing was posted to GitHub.
**Certified head:** content `11e83f06426469b48a67c2211d954ac916cd6fda` (evidence head
`3d6e4d239f1c056d894e8e2f7c69b97a54483c6b` verified product-neutral — it adds only `tier-a-slice-6.md`;
the `2d3c148d1` evidence commit adds the 8 receipts + `evidence-set.json`).
**Verdict:** **ACCEPTED_WITH_FINDINGS** at `11e83f06426469b48a67c2211d954ac916cd6fda`.

## Ceiling

| Check | Method | Result |
| --- | --- | --- |
| Two of three authorized files | `git diff --name-status 0dc715633..11e83f064` | exactly `packages/service/src/primitives/openapi.ts` + `packages/service/tests/handlers_test.ts` — no other product path |
| `contract-authorizer_test.ts` untouched is **correct** | diff base..content on that file, plus read of its current content | 0-line diff; the file already carries `createContractAuthorizer rejects optional authentication during construction` (`contract-authorizer_test.ts:27`). LD-8's runtime rejection is proven there; this slice concerns only docs generation, so not touching it is right, not a missed requirement |
| `deno.lock` byte-identical | `sha256sum deno.lock` + diff | `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`; 0-line diff |

## Substance — LD-9's exact mapping, verified against the code

`indexProcedureAccess` (`openapi.ts:90-111`) builds a lookup in both `byOperationId` and `byRoute`
(method+path) using **oRPC's public `traverseContractProcedures`** (`openapi.ts:22,94`) — confirmed a
named root export of the resolved `@orpc/server@1.14.6` (`dist/index.d.mts` line 10; the callback
shape matches `TraverseContractProcedureCallbackOptions { contract; path }` from the package's
`TraverseContractProceduresOptions`). Not a private reimplementation.

`projectProcedureAccess` (`openapi.ts:113-170`), per operation with declared access:

- `none` → `operation.security = []` (`:139`).
- `required` → `security: [{ bearerAuth: [...scopes] }]` and roles into `x-netscript-roles`
  (`:146-151`) — roles live in the extension, not inside `security`, exactly as research requires.
- `optional` → `security: [{}, { bearerAuth: [] }]` (`:142`) — present in the docs **despite** LD-8
  rejecting `optional` at binding. This slice does **not** re-implement that rejection: there is no
  throw anywhere in `openapi.ts`; it only makes the declaration visible.
- No metadata → skipped (`:133-135`); the operation object is returned byte-for-byte as the
  generator produced it.

Matching precedence: `byOperationId` first, `byRoute` second (`:130-132`). This is the right
priority: a custom `operationId` override is the user's explicit identity, and the test proves the
generated spec carries `status.required.custom` while the injection still lands. The byRoute
fallback tolerates an operation whose spec `operationId` differs from its contract-derived key,
defaulting method to `POST` and path to `/{path join}` — aligned with the OpenAPI generator's
convention for path-less procedures. Both maps derive from the same `~orpc` route objects, so
indexed keys and generated spec keys agree on renamed/custom-identity procedures.

## Preservation, proven not assumed

The test (`handlers_test.ts:82-144`) exercises: a custom `operationId`, a `.route({ spec: ... })`
override adding `summary` and `x-user-field`, and asserts all survive verbatim beside the injected
`security`/`x-netscript-roles` (`:135-137`). This is genuine additive post-processing.

**Traced edge — user-supplied `security` on a metadata-bearing procedure (the one case the test
does not cover):** `projectProcedureAccess` *does* unconditionally replace `operation.security` for
any operation whose declared `authentication` is non-absent, including one where the author set
`security` via `.route({ spec: ... })`. I judge this **intentional and coherent**, not a defect:
LD-6 locks "contract metadata wins on disagreement", and the specific-vs-general conflict between
LD-9's authoritative mapping and the general "preserve user-supplied fields" clause must resolve in
favour of LD-9 — otherwise a public (`none`) or required operation could be documented as
authenticated in a way the enforcement (if installed) would deny, which is the drift the plan exists
to prevent. The preservation guarantee is proven for every field the projection does not manage
(summary, `x-user-field`, custom extensions) and for the whole no-metadata case. Remains an untested
contention; recorded as an observation, not a required fix.

## Bearer security-scheme component

Added only when `needsBearerScheme` is set (i.e., ≥1 `optional`/`required` operation) — `:159-169`
is the sole write site. Spread order keeps an existing scheme:
`{ ...spec.components?.securitySchemes, [BEARER]: spec.components?.securitySchemes?.[BEARER] ?? { type:'http', scheme:'bearer' } }`.
A user/generator-supplied `bearerAuth` definition is preserved; the default is supplied only when
absent. (Not directly exercisable through the current `createOpenAPISpec` surface, since the
generator emits no pre-existing scheme — the test asserts the default and the code path is verified
by inspection.)

## Corpus / lock (unchanged from Slice 5's end state — correct result)

| Check | Evidence | Verdict |
| --- | --- | --- |
| Corpus | `mcp-export-corpus.json` stdout tail: `sha256 eaf4183a…, symbolCount 7654` — byte-identical sha256 to the archived Slice 5 corpus receipt | Correct: this slice alters runtime output of the existing `createOpenAPISpec`; all new symbols (`indexProcedureAccess`, `projectProcedureAccess`, `routeKey`, types, constant) are module-private, no exported signature or JSDoc changed |
| Lock | SHA-256 `edfa0c24…`, 0-line diff | Correct |

## Evidence integrity

All eight receipts at `gitHead == actualGitHead == 11e83f064…`; verified by `argv` and positive
`durationMs`, never by `exitCode` alone. Every receipt carries work-bearing output (check/lint/fmt:
48 files, 0 failed batches; doc-lint: exitCode 0 with service entrypoints; quality-gate: 44 KB;
publish-dry-run: 342 KB stderr, 30 619 ms; test: TAP `passed 102 / failed 0`; corpus: symbolCount).

| Receipt | argv | durationMs | work output |
| --- | --- | --- | --- |
| `1387-s6-check` | `deno task check --include ^packages/service/` | 412 | 48 files, 0 diagnostics |
| `1387-s6-lint` | `deno task lint --include ^packages/service/` | 488 | 48 files, 0 findings |
| `1387-s6-fmt-check` | `deno task fmt:check --include ^packages/service/` | 405 | 48 files, 0 findings |
| `1387-s6-test` | `deno task test packages/service/tests` | 5 785 | TAP 102/102 |
| `1387-s6-doc-lint` | `deno task doc:lint --root packages/service` | 470 | exitCode 0 |
| `1387-s6-quality-gate` | `deno task quality:gate` | 7 845 | 44 KB output |
| `1387-s6-mcp-export-corpus` | `deno task check:mcp-export-corpus` | 6 919 | 7 654 symbols |
| `1387-s6-publish-dry-run` | `deno task publish:dry-run` | 30 619 | 342 KB stderr |

`evidence-set.json`: `SUFFICIENT`, 0 reasons, `immutableHead 11e83f064…`, all 8 expected gate ids
matched. Top-level `receipts/` holds exactly Slice 6's set (8 receipts + evidence-set) plus the five
archive dirs — no stale top-level receipt (D-6 lesson honored). Archived sets with their attested
heads: slice-1 `2ddd6048`, slice-2 `f9b32b4f7`, slice-3 `c297064aa`, slice-4 `9cc8c4c5f`,
slice-5 `c2cbfbf0b` — present and untouched.

## Independent re-runs (this session, evidence head)

| Gate | Method | Result |
| --- | --- | --- |
| Narrow check | `deno check` on both changed files, cold | 0 diagnostics |
| Tests | `deno test --allow-all packages/service/tests/handlers_test.ts` then the full suite | 5/5 handlers tests including the projection test; full suite 102/102 |
| `traverseContractProcedures` publicness | resolved `@orpc/server@1.14.6` d.mts inspection | named root export, matching callback types |

No `e2e:cli`, Aspire, Docker, or browser gate was run; no runtime lease held or acquired.

## Process verification

- Plan-Gate: PLAN-EVAL cycles 1–2 returned `FAIL_PLAN` with bounded fixes; cycle 2's sole narrowed
  item (F-2′) was owner-accepted on the diff with no further cycle (D-3), approving the gate set
  that names Slice 6's stops. No design text changed.
- Design checkpoint: `worklog.md` § Design recorded before implementation.
- Commit slices: Slice 6 content commit `11e83f064` matches the plan's Slice 6 ceiling exactly.
- Per-slice named gates: all eight receipted at the content head and independently green here.
- Debt delta: `.llm/harness/debt/arch-debt.md` 0-line diff; no new debt entry introduced.
- No speculative seams: every new private symbol is used; no dead code introduced.

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| low | `worklog.md` and `context-pack.md` were **not updated for Slice 6** — the F-1 resume-docs class recurs. `worklog.md` ends at Slice 5; `context-pack.md` still says "Current phase: `impl` — Slice 5 content complete; awaiting Tier-A / IMPL-EVAL" and "Do not begin Slice 6 until Slice 5 is accepted". A fresh session trusting only these files would be materially misled about run position, exactly the gap the Slice 4 IMPL-EVAL flagged and the catch-up commit `61ee0a25c` was meant to close. The commit trail (`11e83f064`/`2d3c148d1`/`3d6e4d239`), `tier-a-slice-6.md`, and receipt archives are current, so no evidence is lost — this is a docs-maintenance gap, not an evidence gap. | worklog grep for Slice 6: absent; context-pack lines 9, 71-74 | docs catch-up (worklog + context-pack Slice 6 section), same shape as the earlier F-1 fix |
| low | The plan-named "service JSR audit" for Slice 6 has no separately recorded direct run; the 8th receipt is `publish:dry-run`. This is the run-wide convention, not a new gap: the runner catalog cannot receipt `audit-jsr-package` (D-5), Slice 1 established the receipted full publish dry-run as the durable publishability backstop, and the Slice 5 IMPL-EVAL recorded the identical E-1 convention note. This slice changes no exported declaration or JSDoc, so the audit outcome is structurally unchanged. `publish:dry-run` covers F-6 at a superset level. | tier-a-slice-6.md has no JSR row; plan.md Slice 6 stop names "service JSR audit"; publish-dry-run receipt PASS | none — convention note; optionally re-run `audit-jsr-package.ts --root packages/service` at Slice 6 for symmetry with Slices 1/5 |

## Observations (considered, not defects)

- **`security` overwrite on metadata-bearing procedures:** the projection unconditionally assigns
  `operation.security` for declared-access operations, replacing any user-supplied `security` from
  `.route({ spec })`. Consistent with the locked precedence (LD-6 metadata-authority over LD-9's
  authoritative mapping); the conflict case is untested. Fine as designed; coverage could be added.
- **Preservation of a pre-existing `bearerAuth` scheme:** code-verified via spread order and the
  `??` default in `:159-169`; not directly testable through the current `createOpenAPISpec` surface.

## Verdict

| Field | Value |
| --- | --- |
| Verdict | **ACCEPTED_WITH_FINDINGS** at `11e83f06426469b48a67c2211d954ac916cd6fda` |
| Rationale | LD-9's mapping is implemented exactly for all four access states and proven by direct assertion (`none`→`security: []`, `required`→bearer-with-scopes + `x-netscript-roles`, `optional`→`[{}, { bearerAuth: [] }]` visible in docs without re-implementing LD-8, no-metadata→`Object.hasOwn`-verified untouched). `traverseContractProcedures` is oRPC's genuine public API; `byOperationId`-first matching is correct and exercised by a custom-operationId override. Preservation of user-supplied operation fields is proven, and the one untested conflict (user `security` on a metadata-bearing op) resolves coherently under LD-6. Ceiling respected exactly; lock and corpus unchanged as expected; all eight receipts verified by `argv`/`durationMs`/`gitHead` with work-bearing output; archives 1–5 intact; top level holds only Slice 6's set; independently re-run check + 102/102 tests at the evidence head. The two findings are both non-blocking documentation/convention items (F-1-class worklog/context-pack catch-up; JSR-audit-by-dry-run convention), not substance or evidence gaps. |