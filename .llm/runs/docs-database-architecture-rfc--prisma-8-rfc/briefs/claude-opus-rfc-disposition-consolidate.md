# use harness — Opus 5 RFC disposition and final consolidation

You are the bounded author/editor for NetScript's database architecture RFC. Run as **native Claude
Code Opus 5, effort high**. This is the post-review disposition pass, not a new architecture pass
and not the absolute final substantive gate.

## SKILL

Use the NetScript harness discipline for this edit. Preserve the approved plan, reviewer separation,
route identity, edit scope, evidence boundaries, and final handoff contract. Do not invoke another
skill, model, agent, team, workflow, background worker, or review surface.

## Frozen input and edit scope

Work in `/home/codex/repos/netscript-db-rfc`.

The sole editable file is:

```text
rfcs/0000-database-architecture.md
```

The RFC input is frozen to commit `5dfc4e8eb3988818fc81c6f5dc2856d551443249`, RFC blob
`f46040d8b89f94809c61371da478aeeffb68c9db`, 11,205 words. HEAD may be newer because review and brief
artifacts were committed afterward; that does not authorize using a different RFC draft.

Before editing, prove with read-only Git/hash inspection that the worktree RFC bytes equal the RFC
at `5dfc4e8eb`. If they differ, stop and return `BLOCKED_RFC_BASE_MISMATCH`; do not overwrite or
merge an unknown draft.

Do not edit bookkeeping, reviews, briefs, research, plan, context pack, supervisor, worklog, drift,
doctrine, production code, generated files, or lock files. Do not commit, push, amend, open/update a
PR, or post comments. Do not use subagents or alternate models.

## Required complete reading

Read these files completely before editing:

1. `AGENTS.md`
2. `.agents/skills/netscript-harness/SKILL.md`
3. `.llm/harness/workflow/lane-policy.md`
4. `rfcs/0000-database-architecture.md`
5. `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/plan.md`
6. `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/reviews/root-rfc-review.md`
7. `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/reviews/qwen-rfc-focused-review.md`
8. `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/reviews/grok-rfc-adversarial-review.md`

If a focused Hono/DAL progressive-adoption precedent audit has appeared under this run's `research/`
directory by launch time, read it completely before editing and use its verified NetScript public-
surface lessons. If none exists, record that absence and continue; do not create the audit or launch
new research.

The reviews already performed the source audit. Do not browse, launch new research, or expand the
research corpus. Consult an existing linked research file only to resolve an exact wording dispute.

## Locked architecture and editorial law

Decisions D-01–D-47 in the approved plan are locked except for the narrow, explicit owner override
`OWNER-DX-01` below. That override may refine or supersede D-07, D-08, D-36, and directly related
RFC prose only where the focused precedent evidence and a demonstrated type/runtime boundary support
it. All other decisions remain locked exactly in substance. Apart from this required correction,
this pass may repair examples, resolve contradictions, tighten authority/identity semantics, and
delete duplication; it may not add architecture.

Do not introduce:

- compatibility, Prisma 7 fallback, dual runtime, legacy facade, schema bridge, or migration-history
  bridge;
- a NetScript model/field/relation/query DSL, repository layer, portable query facade, provider
  switch, global registry/service locator, or hosted control plane; `OWNER-DX-01` requires a thin
  NetScript orchestration recipe/DSL, not a parallel database language;
- new packages, new chapters, new public extension axes, private Prisma imports, copied overloads,
  casts, slow-type waivers, or permissive validation;
- a merged Prisma contract across spaces, false multi-provider parity, non-default namespace claim,
  cross-database relation/transaction, automatic rollback, or destructive plugin removal claim;
- review process, route/session metadata, exhaustive gates, or new research exposition in the public
  RFC.

The final RFC must be **at most 10,000 words**. Every addition must be offset by a larger deletion
in the same pass. Preserve the repository RFC headings; do not add a chapter or appendix. Prefer
local replacement and deletion over explanatory expansion.

Keep the center of gravity on:

1. the end-goal developer API and journey;
2. exact TypeScript inference from Prisma's current native model-first
   `defineContract(scaffold, callback)` contract into sound app-local bindings, preferring source-
   native inference over generated type code where it survives the proved package/declaration
   boundary;
3. canonical provider artifacts and `DatabaseManifest` as the durable downstream join point;
4. bounded, fail-closed Standard Schema input/output validation;
5. plugin-owned spaces, app-local fragments, controlled augmentation, and single-registration
   extension bundles;
6. explicit multi-target plan/apply/receipt/recovery semantics;
7. a clean break with marker-only, data-safe adoption.

## `OWNER-DX-01` — three-level adoption and zero-manual-typegen correction

This is an owner-authorized architectural correction, not editorial polish. The current RFC over-
indexes on “do not mirror Prisma's DSL” and does not expose NetScript's established progressive-
disclosure model. Correct the meaning everywhere: NetScript must not reproduce Prisma models,
fields, relations, native types, or query operations, but it **must** own a concise orchestration
surface for the framework seams around those native contracts.

Do not add a chapter. Replace and compress the current verbose Step 1–3 prose/examples with one
concrete progressive-disclosure subsection. Show the **same small application and the same native
Prisma contract** side by side at all three levels, rather than presenting three unrelated designs:

1. **Golden-path recipe/DSL.** A few-line normal-app surface covers a single target and shows the
   minimal delta for multiple targets. It coordinates targets, connections, native contracts,
   spaces/extensions, deterministic artifacts and bindings, runtime/control wiring, and Aspire and
   agent projections. It delegates schema and query semantics to Prisma unchanged.
2. **Public factory builders.** The recipe lowers to the public NetScript factories/primitives that
   application and plugin authors use for custom logic. Customization must not opt out of manifest
   compilation, bindings, extension/plugin identity, validation, control, receipts, or safety
   policy. Derive exact names and signatures from the focused Hono/DAL audit when present, the oRPC
   precedent, the already-approved package graph, and existing database factory examples; do not
   invent arbitrary syntax merely to fill the three boxes.
3. **Native foundation.** Advanced authors compose Prisma's public native
   `defineContract(scaffold, callback)` value directly with NetScript kernel primitives/ports. This
   remains unrestricted native Prisma authoring, not a NetScript schema facade, and reaches the same
   compiler, manifest, artifact, validation, runtime, and control pipeline as the other two levels.

Include a compact API-ownership map naming, for each shown surface, its owning package, source of
truth, value it produces/lowers to, and boundary it must not cross. At minimum distinguish Prisma-
owned contract authoring/query types, NetScript-owned recipe and factories, adapter/extension-owned
provider facets, app-local binding identity, and manifest-derived CLI/Aspire/agent projections. Do
not change the locked package graph just to make the table neat.

Specify the normal development loop. A source contract or definition change must deterministically
and atomically refresh required compile artifacts and stale checks through the normal
dev/build/watch path. There may be an explicit CI emit/verify command, but a normal developer must
never discover a surprise manual “re-emit” or manual type-generation ritual. Automatic compilation
does **not** imply automatic migration planning or database mutation; plan/apply authority remains
explicit.

### Binding decision hierarchy

Challenge the current generated-binding premise instead of preserving it by inertia:

1. First try to prove that app-local source-native `typeof contract`/definition inference can feed a
   stable binding factory through type-only imports while runtime consumes only the durable manifest
   and pinned provider artifacts. The proof must cover `isolatedDeclarations`, declaration emit,
   package boundaries, plugin-owned spaces, per-target/per-space literal identity, and absence of
   Prisma type leakage from public NetScript declarations. If sound, prefer it and remove generated
   **type-code** as a required architecture step.
2. If source-native inference fails any boundary, show the minimal compile/type proof explaining
   why. A generated module is then permitted only as an automatic implementation artifact: real
   runtime values where runtime values are needed, deterministic and atomic output,
   digest/provider/per-space identity, watch/build integration, and zero manual type-gen workflow.
   It must never be the durable control authority; runtime still verifies against the manifest.

Whichever branch wins, make the binding representation and stale-refusal semantics concrete in code,
and state why the rejected branch is unsound or needlessly generated. Do not force the frozen
draft's implementation merely because QF-01/GR-01 reviewed its example.

## Mandatory dispositions

Disposition every finding `QF-01` through `QF-05` and `GR-01` through `GR-08`. Several findings
overlap; one correction may close multiple IDs, but the final response must name every ID
separately.

All corrections below are required. Do not silently decline or replace them with new architecture.

### 1. Bindings are sound values, not ambient runtime fiction — QF-01 / GR-01

Remove `export declare const` from any module consumed for runtime binding. Apply the `OWNER-DX-01`
decision hierarchy first. If source-native type inference wins, show a real binding factory value
with type-only app-contract imports while runtime consumes and verifies the manifest. If generation
is proved necessary, both binding and manifest digest must be emitted runtime values, and the
generated value must carry the target identity, manifest digest, provider pin, and per-space
snapshot identity used by bind-time stale checks.

Use the adapter-owned `/binding` seam for the provider-specific value factory. Do not expose that
factory as a provider-neutral query API, and do not hand-wave a `.d.ts` value into existence. Keep
the soundness rule: type identity, runtime construction, manifest, and provider artifacts resolve to
the same target/space identities, and bind refuses digest mismatch before the first query.

### 2. Bindings are per target and per space; contracts remain disjoint — GR-03

Remove the single merged `AppContract` / single `cs:` implication. Prisma contract spaces remain
separate contracts and artifacts; the binding must not merge their Prisma values or query types.

Show a target-level binding containing a literal, space-keyed type/value map, whether its types are
source-native or its module is automatically generated under the proved fallback. Each space entry
has its own contract declaration type and `ContractSnapshotId`; the target binding also carries the
`ManifestDigest` and provider pin. Query and validator lookup select an explicit `SpaceId`.

The example may use a compact space-keyed type such as `PrimaryQueries['app']`, but it must preserve
each native contract's exact type and must not widen the map to a generic record. Update the session
query example coherently so it cannot imply that plugin and app contracts were combined into one
Prisma contract. Preserve separate per-target output roots, bindings, artifacts, lineages, locks,
and receipts.

### 3. Multi-facet extension bundles are provider-owned opaque values — QF-02 / GR-02

The application must not construct a bundle by importing Prisma authoring, control, and runtime
facets. State and show that the Prisma adapter or the extension-pack publisher defines the complete
identity/version-checked bundle inside the controlled provider boundary. Consumers import one opaque
configured extension value; the provider fans it into authoring, control, runtime, and validation.

The provider-neutral kernel sees only identity, version, provider/capability requirements, and
opaque facet handles. Preserve the dependency law: applications may import Prisma's public authoring
builder for native schema authoring, while only the adapter/extension publisher imports Prisma
runtime and control modules.

### 4. Definition compilation and control execution have distinct owners — GR-04

Clarify that `compileDatabase`/composition is the pure A4 responsibility of `@netscript/database`.
The operation catalog may project a `compose` command, but `@netscript/database-control` does not
own the compiler and live control does not consume a `DatabaseDefinition`.

The authored definition is consumed only by the pure compiler. Runtime, emit-after-compilation,
inspect, plan, apply, verify, and recovery consume the resolved manifest and pinned artifacts as
appropriate. Correct the authority table and operation-class prose without collapsing definition,
manifest, plan, ledger, or receipt.

### 5. `adopted` management is not a detach tombstone — GR-05

Keep `adopted` as the manage-forward ownership policy established by reviewed `db adopt`: it may be
planned and mutated against its baseline. A detached-and-retained plugin space instead loses its
runtime binding and active migration owner while preserving data, provider marker, lineage,
ownership history, and a **verify-only tombstone**. It is not planned or mutated until a new
explicit space re-adopts it.

Do not add a fifth ownership policy merely to encode lifecycle. Express the tombstone as retained
space lifecycle state/evidence, distinct from the active `adopted` policy. Preserve retain as the
only guaranteed removal behavior.

### 6. Define space → target → run outcome rollup — GR-06

Add one compact deterministic rollup rule near the multi-target saga:

- every selected space records a terminal outcome;
- a target is `succeeded` only when every selected space for that target succeeds;
- `outcome-unknown` and `cleanup-required` dominate target rollup, followed by failed/refused/
  cancelled according to the catalog's closed precedence;
- mixed space outcomes never make that target “partially successful”;
- run-level `partial-success` exists only when at least one target succeeds and at least one
  selected target has a non-success terminal outcome;
- when no target succeeds, the run uses the deterministic non-success outcome, never
  `partial-success`.

Do not add a second state diagram or a large status catalog.

### 7. Use one configured provider value and bind/mark every elision — QF-03 / GR-07

Use one unambiguous role for `prismaPostgres`: either name the factory and the configured immutable
provider descriptor separately, or show a single configured value reused by target definition,
runtime, and control. Do not alternate between `prismaPostgres({ minVersion: 15 })` and
`providers: [prismaPostgres]` as if they were the same value.

Bind `connections`, `runId`, and `policy` through function parameters or explicit declarations, or
mark a snippet as an intentional excerpt. Do the same for application-owned `AccountStore` /
`PrismaAccountStore`. A snippet presented as a complete file cannot contain undeclared values. Keep
the API examples compact; do not add a framework helper merely to fill an example variable.

### 8. Correct the two Prisma evidence sentences — QF-04 / QF-05 / GR-08

- Attribute `packages/3-extensions/postgres/src/contract/define-contract.ts:46-121` explicitly to
  the **Prisma RC1 checkout** or link the existing deep dive, so it is not mistaken for a NetScript
  path.
- State separately that Prisma's Standard Schema `paramsSchema` validates codec **parameters**, not
  model values, and that Prisma codecs define three **conversion representations**: application
  runtime, driver wire, and target JSON. Only `runtime | json` are NetScript's public validation
  representations; driver wire remains adapter-internal. Conversion success is not validation.

Do not change the bounded-validation decision or reopen the audited fail-closed list.

## Deletion ledger: apply, validate, and finish below 10,000 words — GR-08

Start at 11,205 words. The corrections above add some words, so delete **more than 1,205 plus every
added word**. Measure; do not rely on estimates. The primary funding source for `OWNER-DX-01` is
replacement of the current verbose Step 1–3 walkthrough with its smaller side-by-side three-level
surface—not a new chapter appended elsewhere. Then use the Qwen and Grok ledgers as one prioritized
ledger:

| Priority | Candidate content                                                                                                     | Preserve                                                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Motivation's `resolveTarget` mechanics and repair-pipeline enumeration                                                | The two-target collision, non-atomic conclusion, and linked current-state audit                                                          |
| 2        | The six-item “Prisma 8 attacks the pain points” restatement                                                           | Contract/control/space opportunity and deep-dive link                                                                                    |
| 3        | “Three things NetScript will not do” paragraph                                                                        | One short sentence preserving no obsolete fluent **schema/query** API or re-export, without forbidding the required orchestration recipe |
| 4        | “What you stop doing” eight-item repetition                                                                           | Refusal table and one transition sentence                                                                                                |
| 5        | Five/six-value explanatory prose duplicated by the authority table                                                    | The authority table and all distinct artifact roles                                                                                      |
| 6        | Composition-validation laundry list                                                                                   | Determinism, diagnostics, and negative-test requirement                                                                                  |
| 7        | Prose that repeats edges already visible in the one Mermaid diagram                                                   | Never-replay, checkpoint granularity, lock scope, certified-lock refusal                                                                 |
| 8        | Positive `ValidationIR` inventory duplicated by the schema-class table/fail-closed list                               | Bounded algebra, construction-time refusal, value issues, representations, cache identity                                                |
| 9        | Refusal-boundary compatibility/re-export repetition                                                                   | One canonical clean-break law, no arbitrary TS/text repair, no implicit/cross-target claims                                              |
| 10       | Early-Access, indirection, and conformance-cost drawback repetition                                                   | Real costs and the adapter-boundary mitigation                                                                                           |
| 11       | “Why this shape” operational-gap lists already in the deep dive                                                       | Manifest join point, target identity, app-local type constraint                                                                          |
| 12       | Market-lessons and Prior-art repetition                                                                               | Direct official links, the adopted lessons once, and the oRPC transfer paragraph                                                         |
| 13       | Scope-law paragraph repeated by D-31/non-goals/alternatives                                                           | One local-kernel refusal                                                                                                                 |
| 14       | Unresolved-question implementation sweep already owned by the plan                                                    | Only the few genuinely reader-relevant W3/W5/W10/upstream gates                                                                          |
| 15       | Future policy-factory bullet                                                                                          | Remove it; Candidate A is the v1 decision                                                                                                |
| 16       | Repeated target-default, target-isolation, two-phase, serverless-precedent, summary-withhold, and package-count prose | Each unique invariant once                                                                                                               |

Continue tightening only within those duplicate zones until `wc -w` reports **≤10,000**. If a line
range changed after earlier edits, follow the content, not stale line numbers. Do not delete unique
safety or public-contract content to make the number.

### Must not cut

Preserve, while updating only where a mandatory correction above requires it:

- the native Prisma model-first authoring example and
  current-builder/no-parallel-schema-or-query-DSL decision;
- the compact three-level adoption surface, same-app side-by-side examples, API-ownership map,
  automated dev loop, one coherent factory/runtime/query example, validation example,
  plugin-space/extension example, and plan/apply example;
- the refusal table and one canonical clean-break/no-compatibility law;
- authority and identity tables, inference rules, binding soundness seam, and package boundaries;
- the first-adapter namespace-withhold paragraph and physical-collision refusal;
- Standard Schema classes, bounded/fail-closed inventory, mandatory trust boundaries, codec/value
  schema and cache/version identity;
- one-owner/object rule, space independence, augmentation grant, package-free pinned artifacts, and
  corrected detach-and-retain semantics;
- the sole Mermaid lifecycle diagram, closed-target/no-silent-omission law, corrected rollup,
  unknown-outcome/inspect-before-resume, locking, receipt lookup, and saga semantics;
- adoption steps, pre-cutover safety list, rollback-boundary table, marker-only zero-DDL/DML
  guarantee, and explicit selected-target closure;
- alternatives table, incident table, structured JSON/stale-plan examples, and direct official
  upstream/comparator links;
- unsupported-provider and no-false-portability statements.

Do not copy D-01–D-47 or W0–W11 into the RFC; keep their direct plan link.

## Claims already checked: no silent reopenings

Do not alter these claims without new contradictory evidence, which this pass is not authorized to
seek:

- RC1 exposes the current model-first `defineContract(scaffold, callback)` const-generic overload
  and composed helpers. Whether NetScript needs generated type code around it is deliberately
  reopened only by `OWNER-DX-01` and must be settled by the required type/package-boundary proof.
- RC1 Prisma spaces remain separate contracts; its aggregate does not merge them.
- RC1 namespace authoring type maps flatten into the default namespace; the capability remains
  withheld with no cast/private-import workaround.
- `@prisma/orm-postgres` has 138 audited top-level export keys at the RC1 pin.
- Prisma operation/type maps needed for full runtime validation are phantom/erased.
- Public validation modes remain `runtime | json`; driver wire remains internal.
- Current NetScript target/workspace collapse, plugin-fragment doctrine, AP-24, and the oRPC-only
  slow-types carve-out are source-verified.
- Root R1–R10 remain resolved.
- No database package receives a slow-types waiver, and no public NetScript declaration leaks Prisma
  types.

## Required checks

After editing only the RFC, run:

```bash
deno fmt rfcs/0000-database-architecture.md
deno fmt --check rfcs/0000-database-architecture.md
deno task docs:links
git diff --check -- rfcs/0000-database-architecture.md
wc -w rfcs/0000-database-architecture.md
```

Inspect the scoped diff against `5dfc4e8eb` and verify:

- only `rfcs/0000-database-architecture.md` changed during this session;
- the word count is at most 10,000;
- every addition has a larger deletion;
- `OWNER-DX-01` is visibly satisfied with all three levels, the same-app comparison, an explicit API
  ownership map, a no-surprise-manual-emit development loop, and a binding proof/decision;
- every QF/GR correction is visible;
- no decision outside the named D-07/D-08/D-36 owner-override envelope, must-not-cut contract,
  direct link, or safety/refusal guarantee disappeared;
- no new chapter, compatibility path, architecture beyond `OWNER-DX-01`, unsupported claim, or
  unresolved must-decide-now item was introduced.

Do not commit or push after checks.

## Final response contract

Return a concise Markdown handoff containing:

1. **Route receipt:** native Claude Code, requested/observed `claude-opus-5`, high effort, session
   ID, frozen input commit/blob, and confirmation that no subagent/workflow/alternate model ran.
2. **Counts:** before and after words and lines, gross additions/deletions from the scoped Git diff,
   and net word reduction.
3. **Stable disposition table:** one row for `OWNER-DX-01` and one row for each `QF-01`–`QF-05` and
   `GR-01`–`GR-08`, with status `applied`, `merged-with <ID>`, or `declined`; exact RFC
   section/line; and a one-sentence rationale. For `OWNER-DX-01`, name the selected binding branch,
   the evidence supporting it, and any precise D-07/D-08/D-36 refinement. The required corrections
   above should be applied or explicitly reported blocked, never silently omitted.
4. **Deletion ledger actually applied:** sections/content removed, approximate word savings, and the
   resulting final count.
5. **Locked-content confirmation:** every decision except the explicitly dispositioned `OWNER-DX-01`
   refinements to D-07/D-08/D-36 preserved, root R1–R10 preserved, must-not-cut content present, and
   checked-sound claims not otherwise reopened.
6. **Files changed:** must list only `rfcs/0000-database-architecture.md`.
7. **Checks:** exact command and exit status for format, `docs:links`, diff check, and word-count
   gate.
8. **Residual risks:** only genuine implementation/upstream gates already present in the RFC/plan;
   do not create new architecture questions.

End with `READY_FOR_FABLE_FINAL_REFINEMENT` only if every required correction is dispositioned, all
checks pass, the RFC is ≤10,000 words, and no out-of-scope file changed. Otherwise end with
`BLOCKED: <precise reason>`.

Do not claim final RFC acceptance. The owner-directed Fable 5 high in-place refinement remains the
absolute last substantive gate; after that, only mechanical verification may follow.
