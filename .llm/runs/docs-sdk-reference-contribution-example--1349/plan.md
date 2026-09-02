# Plan: SDK reference contribution example

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-sdk-reference-contribution-example--1349` |
| Branch | `docs/sdk-reference-contribution-example` |
| Phase | `plan` |
| Target | `docs/site/reference/sdk/index.md` |
| Archetype | N/A — consumer documentation only |
| Scope overlays | `docs` |

## Archetype

No package/plugin archetype applies because no framework code or export changes are in scope. The
`SCOPE-docs.md` overlay governs source alignment, terminology, and drift.

## Current Doctrine Verdict

N/A for consumer-only work. Published-surface claims are checked directly with `deno doc`.

## Goal

Close #1349's final docs/consumer gap with a concise reference entry that documents the contribution
option and descriptor surface and includes one copyable, compiling client-composition example.

## Scope

- Add one `Typed request contributions` reference section to `docs/site/reference/sdk/index.md`.
- Keep the example self-contained and typed, with no `any` or `declare` escapes.
- Run the two documentation gates and the required carrier cascade/checks without changing `deno.lock`.
- Open a non-draft PR with the owner-specified metadata, closing keyword, and one verified ten-entry evidence block.

## Non-Scope

- Do not edit `docs/site/services-sdk/sdk.md`, package/plugin source, or package READMEs.
- Do not run Aspire, Docker, browser, or `e2e:cli` gates.
- Do not hand-edit issue #1349 checkboxes or apply `status:ready-merge`.

## Hidden Scope

- Generated carrier outputs may change after the docs page changes and must be committed when the
  prescribed cascade produces them.
- The closing evidence is all-or-nothing; PR #1927's row-7 state must be current before the closing PR opens.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use a required `tenantId` context projection that owns `x-tenant-id`. | It demonstrates every descriptor field without duplicating the guide's auth/locale narrative. |
| D2 | Declare `responseCache.mode = partitioned` and partition by `tenantId`. | A varying tenant header cannot honestly be documented as cache-invariant. |
| D3 | Compose with `createServiceClient` and `[tenantHeader] as const`. | This directly demonstrates `CreateServiceClientOptions.contributions` and preserves tuple inference. |
| D4 | Keep the reference section compact: option contract, six-field table, then example. | Reference readers need surface lookup; the guide already owns explanation and policy narrative. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Example domain/name | safe to defer | Tenant terminology is conventional and fully bound. |
| Package surface changes | resolved now | None are needed; `deno doc` confirms the current public API. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Snippet compiles only through a type escape | Bind all imports and values; use no `any` or `declare`; run `docs:snippets` plus a scoped invocation of its compiler because this page is outside the tier-1 floor. |
| Reference contradicts the live export | Verify signatures and fields with `deno doc` before authoring and in IMPL-EVAL. |
| Evidence block closes incomplete issue | Recheck every row and PR #1927's merge state immediately before PR creation. |
| Generator changes protected files | Review the exact diff and reject any change outside the page/run/generated carrier scope. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| N/A | avoid | Do not invent or expose a transport/link escape hatch; document only the stable descriptor seam. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Docs snippet compilation | yes | `deno task docs:snippets` exits 0. |
| JSDoc examples | yes | `deno task docs:jsdoc-examples` exits 0 with `unboundName=116`. |
| Carrier cascade | yes | Four generators run in order; post-commit four checks exit 0. |
| Lock hygiene | yes | SHA-256 unchanged from baseline. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | Documentation-only gap closure creates no doctrine debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Snippets | `deno task docs:snippets` | exit 0 |
| 2 | JSDoc examples | `deno task docs:jsdoc-examples` | exit 0; ceiling unchanged |
| 3 | Carrier generation | `gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets` → `gen:mcp-export-corpus` | all exit 0 |
| 4 | Post-commit carrier checks | matching `check:*` tasks | all exit 0 on clean tree |
| 5 | Evidence mirror | prescribed dry-run against the opened PR | expected skip at `status:impl` |

## Dependencies

- Merged contributions work cited by #1349's existing audit, plus PR #1927 for row 7.

## Drift Watch

- Contribution counts, public signature/descriptor fields, PR #1927 merge state, evidence wording,
  generator output, lock hash, and requested non-draft PR workflow.
