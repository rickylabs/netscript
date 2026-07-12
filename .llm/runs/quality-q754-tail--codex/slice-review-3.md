# Slice Review 3 — quality-q754-tail--codex

- **Reviewer session:** Claude Opus 4.8 (`claude-opus-4-8`), independent opposite-family Tier-A
  slice review (generator = Codex). Read-only over the working tree.
- **Run:** `quality-q754-tail--codex`
- **Baseline HEAD:** `6d7c3d54` (`fix(quality): prove sdk and fresh ui boundaries`)
- **Slice scope reviewed:** uncommitted working-tree diff over HEAD, limited to
  `packages/plugin-ai-core` and `packages/plugin-auth-core` (plus this artifact).
- **Slice intent (plan L6):** normalize the shared plugin error vocabulary into a typed oRPC
  `ErrorMap` through a Standard-Schema guard in each core package, eliminating the last two
  `as unknown as Parameters<typeof oc.errors>[0]` double-casts with zero allowances / zero ignores.

## Change set (exactly in scope)

| Path | Status | Nature |
| --- | --- | --- |
| `packages/plugin-ai-core/src/contracts/v1/base-error-adapter.ts` | new | 36-line guard + adapter |
| `packages/plugin-ai-core/src/contracts/v1/base-error-adapter_test.ts` | new | adapter unit test |
| `packages/plugin-ai-core/src/contracts/v1/ai.contract.ts` | mod | cast → `CONTRACT_BASE_ERRORS satisfies ErrorMap` |
| `packages/plugin-ai-core/tests/contracts/ai-contract-soundness_test.ts` | mod | +runtime error-map assertion |
| `packages/plugin-auth-core/src/contracts/v1/base-error-adapter.ts` | new | byte-identical adapter |
| `packages/plugin-auth-core/src/contracts/v1/base-error-adapter_test.ts` | new | adapter unit test |
| `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts` | mod | cast → `{ ...CONTRACT_BASE_ERRORS, ...AUTH_SPECIFIC_ERRORS } satisfies ErrorMap` |
| `packages/plugin-auth-core/tests/contracts/auth-contract-soundness_test.ts` | mod | +runtime error-map assertion |

No files outside the two named roots changed. No `deno.json`/export-map churn. No lock churn.

## Correctness verification (the central question)

**Do the cast replacements genuinely validate and narrow `unknown`, rather than suppress it?** — Yes,
verified against source declarations:

- Shared `BasePluginErrorDefinition.data` is genuinely `unknown`
  (`packages/plugin/src/contract-base/domain/base-errors.ts:44`). The looseness is real, not a
  reviewer artifact.
- oRPC 1.14.6 (`@orpc/contract` shared decl): `AnySchema = StandardSchemaV1<any, any>`;
  `ErrorMapItem<T extends AnySchema> = { status?; message?; data?: T }`;
  `ErrorMap = { [k in ORPCErrorCode]?: ErrorMapItem<AnySchema> }`; `ORPCErrorCode =
  CommonORPCErrorCode | (string & {})` (open string).
- `@standard-schema/spec@1.1.0`: `StandardSchemaV1.Props` requires `version: 1`, `vendor: string`,
  `validate: fn` (and optional `types`).
- **Guard soundness:** `isStandardSchema` checks `isRecord`, `'~standard' in value`, then
  `standard.version === 1 && typeof standard.vendor === 'string' && typeof standard.validate ===
  'function'` — i.e. exactly the required members of `StandardSchemaV1.Props`. The
  `value is AnySchema` predicate is therefore a *sound* narrowing of `unknown`, not an assertion of
  convenience. `types` is optional so its omission is correct.
- **Adapter return** `{ data: definition.data, message, status }` assigns the guard-narrowed
  `AnySchema` into `data?: AnySchema`, `string` into `message?`, `number` into `status?`. The
  declared return `ContractErrorDefinition = NonNullable<ErrorMap[keyof ErrorMap]>` resolves to
  `ErrorMapItem<AnySchema>`. The value structurally satisfies it **with no cast**.
- **`satisfies ErrorMap`** is a compile-time structural check with no type erasure; it replaces the
  old `as unknown as` double-cast, and it holds because the three (AI) / five (auth) keys are valid
  open-string `ORPCErrorCode`s and each entry is a genuine `ErrorMapItem<AnySchema>`.
- **Real runtime validation, not dead code:** `CONTRACT_BASE_ERRORS` is a module-scope const, so the
  three `toContractErrorDefinition(...)` calls execute at import; a non-Standard-Schema `data` would
  throw `TypeError` at load. Zod v4 schemas back `BASE_PLUGIN_ERRORS`, so the guard passes — and the
  soundness tests (which import the contract) prove the guard ran without throwing.
- **Behavior preserved:** the reconstructed map carries the same `data` schema references, messages,
  and statuses as before. Auth spreads `AUTH_SPECIFIC_ERRORS` last, so its 422 `VALIDATION_ERROR`
  spelling still wins (`auth.contract.ts:174-179,181-183`). No consumer-visible change.

**Duplicate local adapter choice:** the two adapter files are byte-identical. Placing a single
shared adapter in `packages/plugin` is *out of the seven-root scope*, would add a new public symbol
to the shared surface, and would reopen the `data: unknown` design. Duplicating a local boundary
adapter is consistent with plan L6 and the AP-9 mitigation ("keep guards local to each genuine
boundary; no speculative shared abstraction"). Accepted; noted as a future consolidation candidate
only if a third consumer appears — not a defect.

**Public/publish surface:** `toContractErrorDefinition` / `base-error-adapter.ts` are **not**
re-exported from any `mod.ts` (grep confirmed internal-only). Publish surface unchanged.

## Tests

- AI soundness test reads `aiContractV1.models['~orpc'].errorMap`; auth reads
  `authContractV1.signin['~orpc'].errorMap`, then asserts `data['~standard'].version === 1` and
  `validate` is a function for each code — a real, non-vacuous end-to-end proof that the adapter
  output reached the compiled contract (undefined lookups would fail the `assert`).
- Adapter unit tests cover the positive path (Zod object accepted, status preserved) and the primary
  negative path (`{}` → `TypeError` with the exact message).
- **Minor observation (non-blocking):** the unit tests do not individually exercise the
  `version !== 1`, non-string `vendor`, or non-function `validate` branches. The guard is trivial and
  the runtime map + `{}` case cover the boundary; adding those cases would be a nicety, not a
  correctness gap.

## Independently reproduced gates (read-only)

| Gate | Command | Result |
| --- | --- | --- |
| Seven-root scanner | `scan-code-quality.ts` over the 7 roots `--max-allow 4` | `{"ok":true,"findings":[],"allowCount":0,"allowances":[]}` ✓ |
| Repo `quality:scan` | `deno task quality:scan` | `ok:true`; 19 allowances all pre-existing in cli/sagas/workers/triggers — **none** in the 7 roots ✓ |
| Scoped check (AI) | `run-deno-check.ts --root packages/plugin-ai-core` | 9 files, 0 occurrences ✓ |
| Scoped check (auth) | `run-deno-check.ts --root packages/plugin-auth-core` | 25 files, 0 occurrences ✓ |
| Scoped lint (both) | `run-deno-lint.ts` per root | 0 findings ✓ |
| Scoped fmt (both) | `run-deno-fmt.ts` per root | 0 findings ✓ |
| AI tests | `deno task test` | **4 passed / 0 failed** ✓ |
| Auth tests | `deno task test` | **29 passed / 0 failed** ✓ |
| Doctrine (AI) | `check-doctrine.ts --root packages/plugin-ai-core` | **FAIL=0** WARN=1 (pre-existing 310-line schemas file, untouched) ✓ |
| Doctrine (auth) | `check-doctrine.ts --root packages/plugin-auth-core` | **FAIL=0** WARN=2/INFO=1 (pre-existing) ✓ |
| Publish dry-run (AI) | `deno publish --dry-run --allow-dirty` | exit 0, clean ✓ |
| Publish dry-run (auth) | `deno publish --dry-run --allow-dirty` | exit 0, clean ✓ |
| Doc lint (AI) | `run-deno-doc-lint.ts --root packages/plugin-ai-core` | 2 privateTypeRef, pre-existing ✓ |
| Doc lint (auth) | `run-deno-doc-lint.ts --root packages/plugin-auth-core` | 2 privateTypeRef, pre-existing ✓ |
| Lock hygiene | `git diff --exit-code -- deno.lock`; status | exit 0; no root/package lock churn ✓ |
| Cast/ignore sweep | grep added lines | both `as unknown as Parameters<…>` removed; **no** new cast/ignore/`any` added ✓ |

### Line-cap delta (verified)

- `ai.contract.ts`: 472 → **476** (+4), under its 500 file cap — no new WARN.
- `auth.contract.ts`: **517 → 517** (unchanged). The 517 > 500 WARN is **pre-existing at HEAD**
  (baseline is 517), so slice 3 does **not** introduce or deepen a line-cap violation. New adapter
  file is 36 lines.

### Doc-lint baseline (verified pre-existing)

The 2 privateTypeRef diagnostics per package are `AiContractDefinitionShape →
AiContractDefinitionShapeInternal` and `aiContractV1 → Implementer` (oRPC), on export lines
unchanged by the slice (present at HEAD as lines 415/439, shifted to 419/443 only by the +4 growth).
The slice adds no new private-type-ref; publish dry-run is unaffected.

All claimed evidence in the worklog/handoff reproduced exactly (scanner ok/0/0; AI 4 / auth 29;
scoped check/lint/fmt zero; both publish dry-runs green; doctrine FAIL 0; AI 476 vs 472 / auth 517;
locks clean).

## Verdict

`PASS`

No unresolved correctness or acceptance defect. The final two type-erasure casts are eliminated by a
sound runtime Standard-Schema guard plus `satisfies ErrorMap`, with zero allowances, zero ignores,
preserved runtime error-map behavior, unchanged public/publish surface, no lock churn, and no new or
deepened doctrine violation. The two-plugin-core slice completes the run's `allowCount: 0` /
0-findings goal across all seven roots.

### Non-blocking notes for IMPL-EVAL / close

1. Adapter is duplicated byte-for-byte across the two cores by deliberate scope+AP-9 choice; revisit
   consolidation into a shared seam only if/when a third consumer and an in-scope `packages/plugin`
   edit are authorized (that would also let `BasePluginErrorDefinition.data: unknown` be typed at the
   source).
2. Adapter unit tests could add explicit `version!=1` / bad-`vendor` / bad-`validate` negative cases;
   current coverage is adequate.
3. `auth.contract.ts` remains over the 500-line cap (pre-existing debt, not owned by this slice).
