# IMPL-EVAL — C1 / #1482, draft PR #2082 (independent opposite-family evaluation)

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `feat-command-c1-contracts--lane-d` |
| Target         | C1 **product head** `e64c841bc9c1a9f967afa357b54f454445807db8` on `feat/command-c1-contracts` (base `6f6cbdf030d7595d1730272d0a74aedd66225069`) |
| Scope          | C1 only: S1–S3 of locked plan.md. C2–C5 and #1932 are later leaves and were **not** required as C1 implementation (none was present in the diff; no circular requirement is raised here). |
| Archetype      | contracts A1 + A4 builder discipline; service A4 (per plan.md §Archetypes) |
| Scope overlays | SCOPE-service (recorded as applied to runtime integrations; no runtime integration in C1) |
| Workload tier  | complex, explicit owner authorization recorded in supervisor.md (Eric, 2026-10-07) |
| Evaluator      | Independent headless evaluator session, 2026-10-07, separate session and opposite vendor family from the OpenAI-generator/implementer lane. Requested route: OpenCode Go / `glm-5.3-flash` with CLI variant `max`, owner-supplied (no paid-route expense decision owed). **Observed identity: this session's model is `opencode-go/glm-5.3-flash` (GLM/Z.ai family); the runtime effort level cannot be attested from inside the session and is not inferred from the CLI flag.** No fallback used. |
| Exact head attested | `e64c841bc9c1a9f967afa357b54f454445807db8` — verified two ways: local `git rev-parse HEAD` on a clean tree, and draft PR #2082 (`OPEN`, draft, base `main`) `headRefOid` equals the same SHA. Commit trail on the PR: plan commits `359d17f…`, `86541a1…`, S1 `5023427…`, S2 `f9d0ccc…`, S3 head `e64c841…` — matches the run records exactly. |
| GitHub state (read-only) | Issue #1482 OPEN (labels as recorded, no milestone); PR #2082 OPEN/draft with per-slice comments and no closing keyword (the body explicitly does not claim `Closes #1482`, so no stale close-gate claim exists; closing reconciliation is supervisor work after this verdict). |

## Process Verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Plan-Gate passed before implementation | PASS | plan-eval.md `PASS` for the whole six-leaf chain at `359d17f4…` in a separate opposite-family session; product implementation begins only at `5023427…` afterward. |
| Design section exists in worklog | PASS | worklog.md `## Design` (public surface, vocabulary, ports, lifecycle, slices, deferred scope, contributor path). |
| Commit slices match design plan | PASS | S1/S2/S3 commits map 1:1 to plan.md slice table rows S1–S3; `git log --oneline` and PR commit list confirm order; S1 and S2 files were subsequently untouched (S3 product delta is exactly one consumer test file, verified by diff). |
| Each slice has a passing gate | PASS | s1/s2/s3-gate-evidence.json with actual argv, head-before-signoff and exits; final batches all exit 0 except the two honestly-retained raw doc-lint exits (see Static Gates). Each per-slice supervisor substantive review exists (s1/s2/s3-supervisor-review.md) — no lane self-certified. |
| No speculative seams (unused files) | PASS | The diff adds exactly the planned S1–S3 files; no executor/store/relay/queue scaffolding or placeholder files exist. |
| Constants used for finite vocabularies | PASS | Bounded literal vocabularies (statuses 409, retryable booleans, kind/phase/capability unions, isolation levels, idempotency modes, record requirements) are exact-named types with runtime guards; quality:scan passed independently (no `any`, no casts, no suppressions introduced). |

## Static Gates (all rerun independently at the exact head)

| Gate | Command (repository-relative) | Result | Evidence / notes |
| ---- | ----------------------------- | ------ | ---------------- |
| Scoped typecheck | `deno run .llm/tools/run-deno-check.ts --root packages/contracts --root packages/service --ext ts --frozen` | **0 diagnostics** (93 files, exit 0) | Independently rerun; matches recorded S3 evidence. |
| Full affected-package tests | `deno test --allow-all --unstable-kv --frozen packages/contracts/tests packages/service/tests` | **180 passed / 0 failed / 0 ignored** | Independently rerun. |
| Lint | `run-deno-lint.ts --root contracts --root service --ext ts` | 0 findings (93 files) | Independently rerun. |
| Format | `run-deno-fmt.ts --root contracts --root service --ext ts` | 0 findings (93 files) | Independently rerun. |
| Doc-lint — service | `deno task doc:lint --root packages/service` | **exit 0**, 0 errors / 0 private-type-ref / 0 missingJSDoc / 0 other (all four entrypoints) | Independently rerun. |
| Doc-lint — contracts | `deno task doc:lint --root packages/contracts` | **raw exit 1 retained**: 17 `privateTypeRef`, 0 missingJSDoc, 0 other | See baseline comparison below. Not suppressed; not treated as a publish verdict. |
| Doc-lint baseline comparison | `deno task`-equivalent doc-lint over the base tree (`6f6cbdf…`) | base: raw exit 1 with **9** privateTypeRef (all real oRPC builder binding: `contract-primitives.ts` 8, `create-crud-contract.ts` 1); head: 17 | **Delta +8, entirely in the new `src/application/command-contract.ts`** (16 at new `./commands.ts` entrypoint minus shared file attribution) — all real `ContractBuilder` / `ContractProcedureBuilderWith*` / `Schema` bindings to `@orpc/contract`. This is exactly the class of the existing documented sanction `docs/architecture/doctrine/02-public-surface.md §Sanctioned exception: slow-types for oRPC-bound packages`, which explicitly names `packages/contracts`. The boundary is respected: service stays at 0; no `--allow-slow-types` override, no waiver text, no type erasure, no suppression. |
| Publish dry-run | `deno publish --allow-dirty --dry-run` in `packages/contracts` and `packages/service` | **both exit 0** with the default (non-overridden) slow-type bar | Independently rerun at the head. The sanctioned doc-lint diagnostic and the publish verdict are therefore evidenced separately, not equated. |
| quality:scan | durable run-gate receipt | PASS exit 0; findings=[]; 7 pre-existing allowances unchanged | Independently rerun with my own receipt. |
| arch:check | durable run-gate receipt | PASS exit 0; FAIL=0; warnings all pre-existing baseline (contracts Result-contract note, generated scalar classes in service, other packages untouched) | Independently rerun. |
| Whole-map docs/symbol drift | `exports-drift` gate | PASS exit 0 (`Reference page coverage: PASS 36/36`) | Independently rerun. |
| Frozen production install | `deno run .llm/tools/deps/prod-install.ts` (`deno ci --prod`) | exit 0; `deno.lock` SHA-256 `75404ed4…` identical before/after (matches recorded gate) | Independently rerun. |
| Whitespace | `git diff --check` | clean (tree clean at head) | Independently rerun. |

## Declaration, publish materialization and clean consumers

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| Emitted declarations | Fresh native `deno pack` archives (contracts + service); all **49** recorded `packedDeclarations` paths present and SHA-256-uniform with the recorded audit (22 contracts + 27 service), including all command modules (`commands.d.ts`, definition/codec/values/failure/canonical/json-codec) | matches | Independently recomputed against `s3-jsr-audit.json`. |
| Clean **declaration** consumer | My own consumer directory built from those pack archives only (`workspace: []`; explicit import map: three package entrypoints + every `.js` in the materialized pack routed to its unmodified companion `.d.ts` + the declared member dependency manifests + release-matched test-only SDK pin). `deno check` of both real-export type fixtures (positive + negative) initial exit 0, `--frozen` exit 0, lock SHA `c687138a…` unchanged — **identical to the recorded declaration-consumer lock** | PASS | Independently constructed; an undeclared-dependency probe (`@netscript/sdk/client` omitted) fails with TS2307, confirming the fixtures exercise declared dependencies only (no ambient shadow types). |
| Clean **source** consumer | My own consumer directory from the published source inventory (per member `publishedSourceFiles`, 24 + 38 files; member `deno.json` materialized from `catalog:` to the exact declared npm ranges), `deno check` initial + `--frozen` exit 0, lock SHA `7f92ef8c…` unchanged — **identical to the recorded source-consumer lock**; runtime consumer test `commands-consumer_test.ts` passes 1/0 with `--frozen` and unchanged lock | PASS | Independently constructed and run. |
| Publication inventory | Published file lists contain all declared entrypoints and command implementations and **no tests and no run artifacts**; `mod.ts` roots byte-unchanged from baseline; JSR metadata checks (scoped name, license, description, valid export maps) pass | verified | `s3-jsr-audit.json` cross-checked against my publish dry-runs and pack inventories. |

## Mutation controls (independent reproduction)

The mutation policy was independently exercised: transient production mutants applied and restored byte-for-byte (SHA-verified), with named failing tests.

| Mutation (independently reproduced) | Test | Effect |
| ----------------------------------- | ---- | ------ |
| S1 `map-literal` (conflict message mutated) | `command contracts opt in to exact errors and preserve route metadata` | mutant exit 1 with the named test; restored exit 0 |
| S1 `status-widening` (`status: 409` → `number`) | `commands-type_test.ts` exactness fixture | mutant exit 1, TS2344 `false does not satisfy true` ( Equal assertion), restored exit 0 |
| S2 `utf16-order` (`names.sort()` reversed) | `canonical JSON matches RFC8785 number string and UTF16 ordering vectors` | mutant exit 1 named; restored exit 0 |
| S2 `sync-schema-refusal` (async refusal removed) | `JSON codecs require synchronous schema validation with a configuration diagnostic` | mutant exit 1 named; restored exit 0 |
| S2 `failure-redaction` (cause leaks into `toJSON`) | `command errors freeze redacted failure data and exclude trusted causes from serialization` | mutant exit 1 named; restored exit 0 |
| S2 `string-version` (`expectedVersion` widened) | real-export service type fixture | mutant exit 1 TS2578 (unused `@ts-expect-error`), restored exit 0 |
| S3 `cross-package-retry-hint` (`retryAfterMs` → 0) | new cross-package consumer test `public command consumer composes receipt codecs with opt-in transport failures` | mutant exit 1 named; restored exit 0 |
| S3 `emitted-declaration` widening (`expectedVersion?: string \| number`) | regenerated native pack → declaration consumer | pack itself exit 0; widened declaration present; **declaration consumer check exit 1 TS2578**, restore → repack → frozen check exit 0 |

All eight reproductions restored the production file byte-exactly (hash equality verified) and left `git status` clean. The remaining recorded controls in s1/s2/s3-mutation-evidence.json (4 further S1 behavioral, 8 further S2 runtime, `private-capability`, and per-slice mutant/restored reports with `originalSha256 == restoredSha256`) were verified in receipt form; the recipes, argv and named failing tests are concrete, mutually consistent, and consistent with the code as reviewed.

## Concept of Done (C1 scope)

- **Box 1 — Publish command definition, identity, envelope, literal error contracts:** `@netscript/contracts/commands` publishes the exact opt-in error map/builder and safe-failure schemas; `@netscript/service/commands` publishes opaque immutable definitions, actor/envelope/trace identity, semantic idempotency vocabulary and the codec surface. Root export maps unchanged (`mod.ts` untouched). Evidence: my publish dry-runs (exit 0 ×2), audit inventories, real-export fixtures. **PASS.**
- **Box 2 — Canonical JCS/codec deterministic and versioned:** RFC 8785 Appendix B numeric vectors, UTF-16 ordering incl. integer-like keys, bounded I-JSON snapshots, tighten-only limits, pre-parse bounds, byte-exact stored roundtrip, replay-stable synchronous schema codecs; replay boundary is the published `definitionVersion`. Evidence: 180-test suite (naming these groups) + my two independently reproduced canonical mutants. **PASS.**
- **Box 3 — Positive and negative type fixtures use real exports:** fixtures import real `@netscript/contracts/commands`, `@netscript/service/commands`, and `@netscript/sdk/client` pins (no local shims, no redeclared helpers); negatives are compile-proven with `@ts-expect-error` diagnostics that were shown to fire (string-version / status-widening mutants) and vanish when removed from healthy code. Evidence: fixtures + my mutants + both clean consumers typechecking the same assertions. **PASS.**
- **Box 4 — Runtime codec negatives and isolated-declaration/publish gates pass:** runtime negatives included in the 180-test independent run; isolated publish (my dry-runs + materialization evidence); isolated declaration consumers (my own builds); frozen prod install. **PASS.**
- **Box 5 — IMPL-EVAL passes:** this document records it for the exact head; it is not circularly included in the other boxes and requires no closing keyword.

## Fitness gates (F-1…F-19) and doctrine

`arch:check` PASS at the head (FAIL=0; only pre-existing baseline warnings). Manual review of the C1 surfaces: file sizes small; contracts/subpaths follow A1 (public contract seam with narrow API, A4 echo in builder discipline); service commands follow A4 (typed public contract, private bind/capability, no IO in public surface — `defineCommand` executes nothing); no new inheritance beyond `CommandError extends Error` (one level); no console logs; no upstream re-exports except the intentional **type-only** re-export of database-owned `IsolationLevel` (package-owned edge, doc-lint reference repaired and recorded in drift.md); no new sup barrels; folder cardinality unchanged. F-6 publishability: publish dry-runs exit 0 without overrides; the sanctioned oRPC slow-type diagnostic is retained with measured baseline. **CLEAR for new work; N/A elsewhere.** Consumer import validation (required for service): both profiles PASS above. F-13 runtime invariants: N/A (no runtime integration in C1). Release-gate class (`scaffold.runtime`/`e2e-cli-prod`): **n/a** — this run is neither a release cut nor a change of scaffold/plugin/DB-wiring surfaces; a future ready-merge handoff is supervisor work beyond this C1 head.

## Public surface security/opacity review

- Internal binding/capability symbols are exported **as types only** (`export type { commandDefinitionBinding, commandExecutorCapability }`); the runtime token values are not importable from any public manifest, and `commandHandler` is asserted absent from the public surface at runtime.
- Handler retrieval authenticates with (a) the private capability token and (b) the original object identity through a per-definition WeakMap; copy-spread and reflection attacks are refused without executing the handler (runtime test asserts zero executions; original-object-binding mutant independently verified in receipt form).
- `CommandError` freezes the redacted failure; `toJSON` excludes message/stack/cause; cross-package translation forwards only structurally validated safe payloads (all non-matching shapes rethrown with original identity — independently covered by the test suite's negative list).
- Canonical codec validates both directions before/after schema processing, refuses value-changing transforms (replayed responses cannot be re-transformed), refuses async schemas with a configuration diagnostic, and takes deeply frozen bounded snapshots before schema work.

## Anti-Pattern Check (scope-relevant)

| Pattern | Status | Evidence |
| ------- | ------ | -------- |
| AP-1 file size | CLEAR | Largest new file `canonical-json.ts` (7.3 KB); arch:check adds no new A8 warnings for C1 files. |
| AP-5 inheritance depth | CLEAR | Only `CommandError extends Error`; no deep chains in new code. |
| Other APs | N/A or covered by arch:check PASS (FAIL=0) with only pre-existing warnings; no new `Any`/cast/`deno-lint-ignore`/`@ts-ignore` in C1 product code (grep-verified); no dead-code seams. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 0 | `debt/arch-debt.md` untouched by C1 (verified in the diff); no doctrine violation unclaimed. |
| Resolved entries | 0 | None claimed. |
| Deepened violations | 0 | The contracts doc-lint delta is absorbed by the **existing documented doctrine sanction** with baseline retained (9 → 17, delta entirely the new real-oRPC binding; no missingJSDoc/other; service at 0). The open oRPC plugin debt entry is unrelated and unchanged. |
| Unrecorded violations | 0 | Found none. |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| medium (documented, non-blocking) | Native npm-format `deno pack` metadata omits type-only `@standard-schema/spec` / `@netscript/database` dependency entries, while emitted declarations keep those bare imports. The clean declaration consumer typechecks correctly against the declared JSR member dependency maps with explicit `.js → .d.ts` routing (lock-stable, independently reproduced). | s3-jsr-audit.json `packLimitation`; drift.md; my declaration consumer run | Keep as a recorded tooling limitation (already in drift.md). No npm-release-completeness claim until owner handles packaging; no repair required for C1. |
| low | Direct `.d.ts` importing initially followed relative `.js` exports as JavaScript (nonzero probe retained), resolved by explicit companion-declaration routing without emitting-file rewrites. | s3-consumer-evidence.json initial failure rows; drift.md | None — retained honestly as evidence that the checker detects declaration loss. |
| low | Initial owned lint/docs findings existed and were repaired before final sign-offs (recorded with raw exits). | s2-gate-evidence.json initial rows | None — first-party drift repaired in-slice as required. |

## Verdict

| Field | Value |
| ----- | ----- |
| **Verdict** | **PASS** |
| Rationale | Locked C1 scope (S1–S3) is complete at the attested head `e64c841bc9c1a9f967afa357b54f454445807db8`: every required static/fitness/consumer gate independently re-verified green at that head (typecheck, 180 tests, lint, format, doc-lint service, quality, architecture, exports drift, publish dry-runs without overrides, frozen prod install with unchanged lock), isolated emitted-declaration and source-consumer dependency proofs independently reproduced with recorded-identical lock hashes, eight meaningful named-failure mutation controls independently reproduced with byte-exact restoration, remaining controls verified in receipt form; the retained raw contracts doc-lint exit 1 is a measured diagnostic under the existing doctrine sanctioned exception for real oRPC builder types (baseline 9 → 17, delta only in the new binding; classified honestly, not suppressed, not equated with the separately-green publish verdict); no unrecorded doctrine violation, no scope creep into later leaves, run artifacts sanitized and sufficient for resume. A PASS certifies only C1 at this exact head; it does not merge, publish, release, close the issue, or constrain later leaves, and closing-evidence reconciliation remains supervisor work. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Catalog-only packages cannot be consumer-checked verbatim inside a `workspace: []` profile until member configs are materialized to exact ranges | publishable subpath qualification | A1/A4 | high |
| Independently pack + exotic-routing consumers is a cheap, hermetic substitute for trusting workspace resolution | declaration verification | A1/A4/A2 | high |
