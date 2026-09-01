# Qwen 3.8 Max — focused review of the consolidated database RFC

You are the owner-directed focused reviewer, not the author. Work in
`/home/codex/repos/netscript-db-rfc` on branch `docs/database-architecture-rfc` at commit
`5dfc4e8eb`.

Use one parent session only. Do not spawn children, subagents, teams, workflows, background agents,
or alternate models. Do not edit any file, commit, push, or comment on GitHub. Read-only shell and
source inspection are allowed. Return the complete review in your final response; the root will
persist it.

## Required reading

Read completely:

1. `rfcs/0000-database-architecture.md`
2. `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/plan.md`
3. `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/reviews/root-rfc-review.md`
4. `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/typescript-schema-orpc-audit.md`
5. `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/runtime-validation-source-audit.md`
6. `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/prisma-8-deep-dive.md`
7. `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/market-analysis.md`
8. `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/planned-jsr-audit.md`

Use the pinned Prisma checkout at `.llm/tmp/prisma-v8-rc1` only for a disputed load-bearing claim.
Distinguish RC1 evidence from post-RC evidence. Do not turn the review into another research report.

## Owner's editorial law

The owner will not read an 18,000-word book. The RFC is now 11,205 words after a 60% reduction. Its
final target is at most 10,000 words when cuts preserve the public API, safety invariants, and
explicit refusals. Prefer links to the research corpus over duplicated proof. Every suggested
addition must name an equal or larger deletion; otherwise recommend no addition.

The center of gravity must remain:

- end-goal API surface and developer journey;
- exact end-to-end TypeScript inference from native Prisma contract to app-local binding;
- contract-first canonical artifacts and the `DatabaseManifest` join point;
- bounded, fail-closed Standard Schema input/output validation;
- full plugin-space ownership, application-local fragments, controlled augmentation, and one
  extension bundle fanning into authoring/control/runtime/validation;
- deterministic operations, plan/apply/receipt/recovery, and data-safe clean-break adoption.

## Six review axes

Review only these six axes. Falsify the examples and invariants rather than merely summarizing them.

1. **TypeScript inference and API coherence** — native model-first Prisma surface, const/literal
   preservation, target-key checking, generated `AppBinding`, transaction type honesty, import
   subpaths, absence of type widening/private imports/re-export/query DSL, and whether every example
   is one implementable API rather than pseudocode with incompatible symbol roles.
2. **Standard Schema and trust boundaries** — `input`/`output` semantics, `runtime | json`, exact
   metadata requirements, codec/space/selection identity, fail-closed construction, path-rich value
   issues, mandatory external boundaries, no claim of full Prisma operation parity, and no generated
   validator repair pipeline in disguise.
3. **Control, recovery, and artifact authority** — pure/live/mutating separation, manifest as
   durable downstream join point, provider ledger versus receipt, plan signing/expiry/staleness,
   lock and fencing claims, unknown outcome, lookup/resume, multi-target aggregate outcomes,
   explicit target closure, and CLI/docs/agent projection from one catalog.
4. **Migration and plugin safety** — one owner per object, space independence, plugin package-free
   apply/verify, augmentation permissions, default-namespace collision refusal, detach-retain,
   marker-only adoption, no silent target subset, rollback wording, no dual runtime or compatibility
   path, and no accidental data mutation claim.
5. **Package and prospective JSR surface** — exact A1/A4/A3/A2/A2/A6 graph, dependency directions,
   provider isolation, public subpaths, application-local generated typing, `isolatedDeclarations`,
   no slow-type waiver, no unearned actual-publish-readiness claim, and whether any API example
   forces a forbidden dependency or runtime authoring import.
6. **Market/upstream claims and reader economy** — only load-bearing claims, direct official links,
   RC1 versus post-RC wording, no comparator straw man, no marketing overclaim, and concrete cuts to
   reach at most 10,000 words without removing decisions.

## Required output

Return a concise Markdown review, maximum 2,500 words, with:

- route receipt: requested model `qwen/qwen3.8-max`, requested effort `max`, evaluated commit, files
  actually read, and whether any Prisma source path was inspected;
- verdict: `PASS`, `PASS_WITH_CHANGES`, or `REVISE`;
- findings table ordered by severity, each with stable id `QF-01...`, severity
  `critical|high|medium|low`, exact RFC line(s), violated decision/invariant, why it matters, and
  the smallest correction;
- a six-axis pass/fail table including negative evidence, not praise;
- a deletion ledger identifying at least 1,200 removable words by section/line range, while naming
  any content that must not be cut;
- a final list of claims checked and found sound, so later editors do not reopen them without new
  evidence.

Do not propose backward compatibility, a second query/model DSL, a Prisma 7 fallback, a global
registry, a hosted control plane, false multi-provider parity, casts/private imports, or permissive
validation. A finding is actionable only if it can change the RFC or an explicit implementation
gate. Do not manufacture findings to appear adversarial.
