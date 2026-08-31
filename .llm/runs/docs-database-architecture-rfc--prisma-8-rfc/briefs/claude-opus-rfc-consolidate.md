# Claude Code Opus 5 high brief: consolidate the database architecture RFC

use harness

## SKILL

Read and follow:

1. `AGENTS.md`
2. `.agents/skills/netscript-harness/SKILL.md`
3. `.agents/skills/netscript-doctrine/SKILL.md`
4. `.llm/harness/workflow/activation.md`
5. `.llm/harness/workflow/run-loop.md`
6. `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/context-pack.md`

This is an RFC editor lane, not a new architecture-planning lane. PLAN-EVAL cycle 2 already passed.

## Objective

Rewrite the evidence-complete raw draft into a concise, decision-grade RFC. The owner will not read
an 18,000-word document, and the current draft is 28,194 words. Target **8,000–10,000 words** with a
hard ceiling of **12,000 words**.

The RFC must focus on the end-state API surface, developer experience, end-to-end type safety,
contract-first architecture, plugin contribution model, bounded Standard Schema validation, and safe
operational control. Link the research rather than duplicating it.

## Edit authority

Edit exactly one file:

- `rfcs/0000-database-architecture.md`

Do not edit run artifacts, research, plans, worklogs, doctrine, source code, or any other file. Do
not commit or push. The root supervisor owns review, sign-off, commit, and publication.

## Required reading

Read completely before editing:

- `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/reviews/root-rfc-review.md`
- `rfcs/0000-database-architecture.md`
- `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/plan.md`
- `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/typescript-schema-orpc-audit.md`
- `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/runtime-validation-source-audit.md`
- `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/prisma-8-deep-dive.md`
- `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/market-analysis.md`

Use the root review as the editing contract. Its ten technical corrections are blocking.

## Reader promise

The consolidated RFC should let a contributor understand, in one pass:

- native Prisma TypeScript schema authoring without a cloned NetScript ORM DSL;
- the thin NetScript definition around native contracts;
- deterministic composition into a manifest and generated app-local inferred binding;
- native provider query types reaching application-owned ports without Prisma leaking through the
  provider-neutral kernel;
- `StandardSchemaV1` input/output schemas derived from contract and operation/selection metadata,
  with explicit fail-closed limits;
- plugin-owned spaces, controlled augmentation, and one extension registration fanning into
  authoring/control/runtime/validation facets;
- explicit targets, ownership, artifacts, plan/apply/receipt/recovery, and safe multi-target saga
  semantics;
- a clean break from the old stack plus a production-data-safe adoption path.

## Editorial constraints

- Preserve the repository RFC template headings: Summary, Motivation, Guide-level explanation,
  Reference-level explanation, Drawbacks, Rationale and alternatives, Breaking changes and
  migration, Prior art, Unresolved questions, and Future possibilities.
- Shorten the title.
- Lead with the outcome and end-state developer journey. Do not lead with harness process,
  provenance, or evidence categories.
- Delete Appendices A–G. Link the approved plan and focused research artifacts instead.
- Remove inline evidence tokens such as `[PROPOSAL]`, `[RC1]`, `[NS-SRC]`, and `[INFERENCE]`. Retain
  direct links near the small number of important upstream claims.
- Prefer one strong example over several variations. Every example must use one consistent proposed
  import and naming surface.
- Keep only the interfaces necessary to lock public behavior. Do not reproduce every internal type,
  state machine, gate, package permission, or operation catalog record.
- Keep at most one Mermaid diagram.
- Replace market feature matrices with a few lessons plus the market-analysis link.
- Avoid exact current-state counts unless they materially explain a decision.
- Avoid review-process, wave-gate, JSR-publish, and session details in the public RFC. Those remain
  in run artifacts.
- Do not introduce compatibility, a dual runtime, a NetScript query DSL, runtime capability
  negotiation, a hosted control plane, or unsupported multi-namespace claims.

## Public API direction

The examples should converge on a minimal and coherent surface, not preserve every raw-draft name.
Use the current native model-first Prisma `defineContract` builder as the schema foundation, and a
thin NetScript `defineDatabase` composition around native contract values.

For validation, prefer this vocabulary unless source constraints force a better, equally small
alternative:

```ts
const users = primaryBinding.ref({ space: 'app' }).model('User');
const createUser = users.input('create', { representation: 'json' });
const publicUser = users.output(
  { select: { id: true, email: true } },
  { representation: 'json' },
);
```

State the combined acceptance promise explicitly: exact native contract inference survives into the
app-local query binding, while runtime validation is intentionally bounded and fails closed whenever
the contract plus registered operation, selection, codec, or extension metadata cannot prove the
schema.

## Technical corrections

Apply every finding R1–R10 in `reviews/root-rfc-review.md`. In particular:

- The first Prisma PostgreSQL adapter does not demonstrate or claim certified multi-namespace
  support. Logical spaces do not magically prevent physical name collisions.
- Target-key checking occurs at `defineDatabase` composition unless a contextual API can actually
  prove an earlier check.
- Pure compile/emit construction cannot receive live connection dependencies.
- Signing is not a database mutation.
- The generated binding uses one consistent generic/type association.
- Validation examples distinguish input schemas from selected output schemas.
- Persistent plugin tables default to full independent spaces; app-local native fragments and
  published contribution mechanisms are not conflated.
- Transaction and import surfaces do not overclaim unproven types or package subpaths.
- Recovery has a receipt lookup path.
- Adoption never silently skips an intended target, and marker rollback is capability-qualified.

## Evidence links to preserve

Use relative links from the RFC to these artifacts instead of copying their contents:

- approved architecture: `../.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/plan.md`
- Prisma source deep dive:
  `../.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/prisma-8-deep-dive.md`
- native TypeScript schema/oRPC audit:
  `../.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/typescript-schema-orpc-audit.md`
- runtime-validation source audit:
  `../.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/runtime-validation-source-audit.md`
- market analysis:
  `../.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/market-analysis.md`
- current-state audit:
  `../.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/netscript-current-state.md`

Keep primary GitHub/source links where they substantiate a load-bearing upstream fact.

## Completion report

Before returning:

1. Run `deno fmt rfcs/0000-database-architecture.md`.
2. Run `deno fmt --check rfcs/0000-database-architecture.md`.
3. Run `git diff --check -- rfcs/0000-database-architecture.md`.
4. Report the final word count, line count, and changed file list.
5. Confirm all R1–R10 findings were applied, naming any disposition that was not a direct edit.

Do not claim final acceptance. Qwen 3.8 Max, Grok 4.6 high, author/editor disposition, and the one
absolute-final Fable 5 high refinement still follow.
