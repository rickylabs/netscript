# Plan: properly type `packages/plugin-workers-core` quality boundaries

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `quality-q751-workers-core--codex` |
| Branch | `quality/q751-workers-core-h` |
| Phase | `plan` |
| Target | `packages/plugin-workers-core` |
| Archetype | `3 — Runtime / Behavior` |
| Scope overlays | `none` |

## Archetype

Archetype 3 is the smallest fit: this package owns worker lifecycle, dispatch, execution, retry, workflow state, shutdown, and durable-stream integration. Its builder concern is folded into the runtime archetype rather than selecting Archetype 4 for the same package.

## Current Doctrine Verdict

The doctrine’s historical `@netscript/workers` verdict is **Restructure**, led by the executor/supervisor split. The successor package has already removed the cited 1,287-line executor monolith. This slice does not claim to close unrelated runtime debt; it removes type erasure at existing boundaries without reorganizing behavior.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | Public schema, builder, stream, and runtime types drive each implementation change. |
| A2 | Boundary types remain simple and precise instead of hiding incompatibility behind casts. |
| A10 | Composition consumes canonical ports; it does not bridge duplicate structural contracts post hoc. |
| A14 | Scanner, scoped wrappers, tests, docs, and publish dry-run prove the result. |

## Goal

Reduce the rejected attempt’s 14 suppressions to the lowest possible count (target 0), produce 0 scanner findings under `--max-allow 5`, preserve behavior and public exports, pass all requested package gates, commit, and force-push the superseding branch.

## Scope

- Derive config and contract IO from concrete Zod schemas using `z.input`/`z.output` and generic structural facades.
- Reuse precise upstream streams schema/producer types.
- Make builder state transitions create correctly parameterized values rather than rebranding one mutable generic instance.
- Consolidate duplicate builder/domain and runtime/port types where required for direct assignability.
- Add concrete runtime identity fields or narrow adapters where actual default implementations need to satisfy ports.
- Update fixtures and the root facade to consume the canonical types without erasure.
- Record complete gate and allowance evidence in this run directory.

## Non-Scope

- No behavior redesign, export-map change, dependency/version change, release cut, PR, or issue mutation.
- No fix for the four pre-existing oRPC doc-lint private-type diagnostics unless a directly-owned type change removes them naturally.
- No resolution of unrelated sandbox, scaffold-helper, cron-unification, or runtime-relocation debt.

## Hidden Scope

- Type-soundness tests must cover Zod default/input variance and builder typestate transitions; existing runtime tests protect behavioral equivalence.
- The package’s root facade duplicates builder signatures and must reference the canonical builder exports to prevent another cast layer.
- `deno.lock` must remain byte-identical despite Deno validation.

## Locked Decisions

| ID | Decision | Rationale |
| --- | -------- | --------- |
| D1 | Internal allowance target is 0; allowances are considered only after a concrete failed typing design is documented. | Owner rejected suppression as strategy. |
| D2 | Schema public output/input types are derived from the schema value (`z.output`/`z.input`) and structural schema facades carry both parameters. | Expresses default/coercion variance rather than erasing it. |
| D3 | Builder transitions return newly parameterized builder instances over copied state; canonical domain handler/definition types replace duplicate public shapes where compatible. | A single mutable class instance cannot honestly change invariant payload/result parameters. |
| D4 | Stream integration imports `StateSchema`/`DurableStreamProducer` and derives entities from concrete Zod output. | Upstream generics already model the boundary. |
| D5 | Runtime composition uses canonical package ports; missing capability metadata is added to actual implementations or handled by a typed adapter object. | Removes parallel-interface casts while preserving behavior. |
| D6 | Ordinary single casts are not used as a scanner loophole at the affected boundaries. | Acceptance requires typing, not merely avoiding the scanner token. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Whether any allowance survives | safe to defer | Only decidable after real typing attempts; ceiling 5, target 0, each survivor requires structural proof. |
| Whether pre-existing oRPC doc-lint debt is fixed | safe to defer | Acceptance requires the command recorded; widening scope would be unrelated unless the contract typing slice naturally closes it. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Zod default/coerce input differs from output. | Export or annotate both `z.input<typeof S>` and `z.output<typeof S>`; add parse/type assertions. |
| Immutable builders accidentally lose accumulated state or handlers. | Copy all state explicitly and run builder/runtime package tests plus focused typestate tests. |
| Canonicalizing duplicate types breaks connector consumers. | Preserve export names and structural shapes; run package tests/check plus root public-surface check and affected consumer checks if the compiler identifies them. |
| Upstream producer overloads are narrower than the hand facade. | Instantiate upstream `DurableStreamProducer<WorkersStreamDefinition>` and let its collection-key/entity mapping drive the wrapper type. |
| Validation changes `deno.lock`. | Compare `deno.lock` to baseline after every gate; never commit churn. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-3 | risk | Replace parallel god/structural facades with canonical narrow generic ports. |
| AP-8 | clear/avoid | Keep explicit constructor/factory composition; no container. |
| AP-11 | clear/avoid | No new globals; state remains per builder/runtime instance. |
| AP-13 | clear/avoid | No console calls in published code. |
| AP-19 | existing debt | Do not change runtime permissions or claim sandbox closure. |
| AP-20 | clear/avoid | No compiler-lib override change. |
| AP-22 | existing package shape | No new sub-barrels. |
| AP-25 | clear/avoid | No new side effects outside adapters/edges. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1–F-19 | yes for Archetype 3 | `deno task arch:check` plus manual slice review where scripts do not cover a gate |
| Code quality | yes | scoped scanner reports 0 findings and `allowCount <= 5` (target 0) |
| JSR/docs | yes | publish dry-run PASS; doc-lint recorded with no regression from baseline 4 |
| Runtime/consumer | yes | package tests; focused root/consumer checks when exported types move |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `workers-contract-structural-server-export` | preserve/reassess | Baseline doc-lint debt; do not deepen it. |
| other plugin-workers-core debt | none | Unrelated to type-quality scope. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Scanner | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/plugin-workers-core --max-allow 5` | `ok:true`, 0 findings, target allowCount 0 |
| 2 | Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --ext ts,tsx` | 0 errors |
| 3 | Lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-workers-core --ext ts,tsx` | 0 errors; no new ignore |
| 4 | Format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-workers-core --ext ts,tsx` | 0 errors |
| 5 | Tests | `(cd packages/plugin-workers-core && deno task test)` | PASS |
| 6 | Publish | `(cd packages/plugin-workers-core && deno publish --dry-run --allow-dirty)` | PASS, no slow types |
| 7 | Docs | `deno task doc:lint --root packages/plugin-workers-core --pretty` | recorded; no regression from baseline 4 |
| 8 | Fitness | `deno task arch:check` | PASS or unchanged pre-existing evidence |
| 9 | Lock | direct `git diff --exit-code 3b3d615b -- deno.lock` | no churn |

## Deferred Scope

- Broader workers architecture debt, release E2E, and connector redesign are excluded because this slice neither changes scaffold/publish shape nor runtime behavior.

## Dependencies

- Zod 4.4.3, oRPC 1.14.x, and the workspace `@netscript/plugin-streams-core` public generics; no dependency mutation.

## Drift Watch

- Log any required export change, behavioral change, allowance candidate, consumer break, doc-lint regression, or new debt before proceeding.
