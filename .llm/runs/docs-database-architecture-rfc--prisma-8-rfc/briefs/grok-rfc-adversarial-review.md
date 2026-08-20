# use harness — Grok 4.6 whole-RFC adversarial review

You are an independent, bounded adversarial reviewer of NetScript's database architecture RFC. You
are not its author, editor, implementer, or final acceptance gate.

## SKILL

Use the NetScript harness discipline for this review. Preserve generator/reviewer separation,
requested-versus-observed route identity, read-only scope, evidence-backed findings, and a bounded
output. Do not invoke another skill, workflow, model, agent, or reviewer.

## Route and checkpoint

- Requested route: OpenCode via OpenRouter, model `openrouter/x-ai/grok-4.6`, variant `high`.
- Review the compact RFC checkpoint `5dfc4e8eb`
  (`docs(rfc): consolidate database architecture
  draft`). This is a post-draft adversarial review,
  not final acceptance.
- Verify the evaluated RFC bytes against `5dfc4e8eb`. If the worktree RFC differs, review the exact
  checkpoint with read-only Git inspection and report the mismatch; do not review an uncommitted
  replacement silently.
- If the requested route cannot be observed or the observed model/variant differs, return
  `ROUTE_BLOCKED` with the requested and observed identity. Do not simulate Grok or continue on an
  alternate model.

## Hard boundaries

- Do not edit, create, delete, or format any repository file.
- Do not commit, push, open or update a PR, post comments, or mutate external state.
- Do not spawn subagents, child sessions, teams, workflows, background agents, or alternate models.
- Do not ask another agent to verify claims. Work as one Grok parent session.
- Read-only shell and focused source inspection are allowed. Do not run mutation, generation,
  migration, database, network-deployment, or broad test commands.
- Do not turn this into a new research report or redesign the whole framework. Test whether the RFC
  is coherent, safe, implementable, and economical on its own terms.
- Return the complete review in the final response. The supervisor will persist and disposition it.
- Maximum output: **2,500 words**, including tables and receipt.

## Required complete reading

Read these files completely, not summaries or selected line ranges:

1. `rfcs/0000-database-architecture.md`
2. `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/plan.md`
3. `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/reviews/root-rfc-review.md`
4. If present at launch time,
   `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/reviews/qwen-rfc-focused-review.md`; if
   the expected path is absent, read any single `reviews/qwen*rfc*review*.md` artifact that exists
   and record its exact path. If no Qwen focused-review result exists, record `not present` and
   continue independently.

The plan is the locked decision and implementation-gate context. The root and optional Qwen reviews
are attack maps, not authority: independently verify their relevant claims and do not echo findings
without confirming that the checkpoint still contains the problem.

For a disputed, load-bearing statement only, you may inspect the already available research corpus
or pinned Prisma RC source. Distinguish Prisma 8 RC1 fact, post-RC observation, current NetScript
fact, and RFC proposal. Do not browse broadly or restate source audits.

## Review objective

Attempt to falsify the RFC as one architecture. Look for contradictions between examples,
interfaces, invariants, provider claims, artifact roles, operation states, ownership rules, and
implementation waves. A finding is actionable only when it identifies a concrete RFC correction,
deletion, clarification, or implementation gate. Do not manufacture findings to appear adversarial.

Review all seven axes below.

### 1. Abstraction integrity

- Is there exactly one coherent path from native schema authoring through definition, contract
  artifact, manifest, generated binding, runtime, validation, operation plan, ledger, and receipt?
- Do definition, artifact, manifest, plan, provider ledger/marker, and immutable receipt retain
  distinct authority and identity?
- Does any example make a downstream stage consume an upstream authoring value that the reference
  architecture says it must not consume?
- Are pure compilation, live inspection, mutation, verification, and recovery structurally separated
  rather than distinguished only by convention?

### 2. Provider-neutral kernel versus Prisma leakage

- Does the kernel express only provider-neutral identities, capabilities, ports, operation states,
  and artifacts while the first certified adapter remains Prisma 8/PostgreSQL?
- Does native Prisma `defineContract(scaffold, callback)` remain the schema authority without a
  NetScript schema/query DSL, copied overloads, private imports, re-exported builder, or
  type-erasing wrapper?
- Are provider-specific query, transaction, codec, migration, and contract types confined to the
  adapter/generated app-local boundary?
- Does “provider-neutral” describe an extensible kernel rather than falsely claiming portable query
  semantics or feature parity across providers?

### 3. Artifact authority, control, and recovery safety

- Can every mutating operation identify its closed target set, exact manifest/contract inputs,
  inspected baseline, executable plan, signature/expiry/staleness state, lock/fencing ownership,
  provider ledger transition, and immutable receipt?
- Are partial success, no-success, unknown outcome, resume, idempotency, lookup, and verification
  representable without guessing?
- Can recovery work after the original process and plugin package are absent?
- Does adoption preserve data and avoid silent target omission, accidental DDL/DML, unproved marker
  removal, or rollback promises that a provider cannot guarantee?

### 4. Plugin, multi-space, and multi-database extensibility

- Is one owner responsible for every persistent object and migration history?
- Are plugin-owned spaces independently versioned and deployable from pinned artifacts, while
  application-local fragments remain const-preserving native values composed in two phases?
- Are augmentation permissions explicit and collision/ownership checked?
- Do extension authoring, control, runtime, and validation facets share one verified identity and
  version?
- Are `TargetId`, `SpaceId`, physical namespace, provider, resource, contract hash, and migration
  head distinct? Are cross-space and cross-database references treated differently?
- Does the first adapter refuse uncertified multi-namespace behavior and physical collisions rather
  than masking them?

### 5. Public API, developer experience, and type safety

- Can an implementer reconcile all imports, symbol roles, generics, generated files, lifecycle
  calls, and error behavior into one implementable API?
- Does exact native contract inference survive into the app-local binding without casts, widening,
  private imports, or phantom NetScript mirrors?
- Are transaction types honest, target-key checking placed at the composition point, and extension
  helper availability target/pack-sensitive?
- Is Standard Schema validation selection-aware, `runtime | json`, bounded by explicit metadata, and
  fail-closed at construction without pretending full Prisma operation parity?
- Does the normal path eliminate manual copying, generation repair, repeated extension wiring, and
  Aspire-dependent pure work?

### 6. Implementation feasibility and release gates

- Do package boundaries and dependency directions permit the shown API without circular or forbidden
  dependencies?
- Are W0–W11 ordered so each wave has the inputs and proof needed by the next?
- Are Prisma RC volatility, contract decoding, multi-namespace type gaps, custom codec predicates,
  operation metadata, type-check performance, and prospective JSR constraints gated rather than
  wished away?
- Are kill/switch criteria strong enough to narrow or stop an unsound implementation?
- Can the proposed conformance suite prove the public claims without relying on the implementation's
  own types or permissive decoders?

### 7. Editorial economy

- Does each section make or constrain a decision, API, invariant, refusal, migration guarantee, or
  unresolved gate?
- Identify duplicated proof, repeated refusals, process detail, speculative future work, oversized
  declarations, and market/upstream prose that can become links.
- Prefer correction by replacement or deletion. Any proposed addition must name an equal or larger
  deletion.
- The RFC is 11,205 words at the checkpoint. Propose a **net reduction**, targeting at most 10,000
  words without deleting public APIs, safety invariants, explicit refusals, or clean-break/data-safe
  adoption guarantees.

## Severity and disposition law

Use stable finding IDs `GR-01`, `GR-02`, and so on, ordered by severity.

- **blocker**: permits data loss/corruption, breaks an authority or ownership invariant, makes the
  public API/type promise unimplementable, introduces hidden Prisma coupling into the neutral
  kernel, contradicts the clean break, or makes apply/recovery unsafe.
- **refinement**: improves precision, coherence, implementability, DX, or economy without changing
  the accepted architecture.

Do not upgrade editorial preference to a blocker. Do not recommend backward compatibility, Prisma 7
fallback, dual runtime, a second schema/query DSL, a global registry/service locator, hosted control
plane, casts/private imports, permissive validation, false provider parity, destructive uninstall,
or silent target subsets.

## Required output contract

Return one concise Markdown document in this order:

### Route receipt

Include requested and observed provider/model/variant, OpenCode session identifier if exposed,
evaluated commit and RFC byte identity, every required file actually read, optional Qwen artifact
status/path, any extra source path inspected, and explicit confirmation that no subagent was used.

### Verdict

Use exactly one:

- `PASS` — no actionable blocker or refinement remains;
- `PASS_WITH_REFINEMENTS` — no blocker; bounded corrections/deletions remain;
- `REVISE_BLOCKERS` — one or more blockers must be dispositioned before final refinement;
- `ROUTE_BLOCKED` — requested route identity could not be proved.

Give a two-sentence rationale and counts by class.

### Findings

Provide one table with:

| ID | Class | Axis | RFC lines | Violated invariant/decision | Consequence | Smallest correction | Offset deletion |
| -- | ----- | ---- | --------- | --------------------------- | ----------- | ------------------- | --------------- |

Use only `blocker` or `refinement` in `Class`. Every addition must identify an equal-or-larger
offset deletion. If there are no findings, say so; do not invent one.

### Axis verdicts

For all seven axes, give `PASS` or `FAIL`, the strongest negative evidence tested, and the result.
Do not fill this section with praise.

### Net deletion ledger

Name concrete RFC sections/line ranges, estimated removable words, and why removal preserves the
decision. Sum additions and deletions and report the expected **net word change**. The proposal must
be net negative; target at least 1,205 words of net reduction when this can be done without
weakening the architecture or safety contract. Also list content that must not be cut.

### Sound claims not to reopen

List only claims you actively checked and found sound. This prevents later editors from reopening
settled architecture without new evidence.

### Final gate statement

End with one line stating whether the RFC may proceed to author/editor disposition. Do not claim
final acceptance; the owner-directed Fable 5 high refinement remains the last substantive gate.
