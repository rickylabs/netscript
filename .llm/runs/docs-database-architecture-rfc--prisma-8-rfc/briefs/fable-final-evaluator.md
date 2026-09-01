use harness

# Final Fable 5 high RFC evaluator and refinement gate

Run one fresh native Claude Code session as the absolute-final substantive gate for the NetScript
database architecture RFC. The owner explicitly reinstated this single Fable 5 high launch on
2026-08-14; that instruction supersedes the earlier Claude/Fable freeze only for this gate.

## SKILL

- Read `AGENTS.md`, `.agents/skills/netscript-harness/SKILL.md`,
  `.llm/harness/evaluator/protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`, and
  `.llm/harness/archetypes/SCOPE-docs.md`.
- This is an owner-authorized final **evaluation plus refinement** exception to the protocol's
  read-only evaluator rule. It does not authorize package/plugin implementation or a broader
  redesign.
- Do not spawn subagents, start workflows, resume an earlier Claude session, or use a fallback
  model. If native Fable cannot run, record the failure and stop.

## Target and authority

- Worktree: `/home/codex/repos/netscript-db-rfc`
- Branch: `docs/database-architecture-rfc`
- Draft PR: <https://github.com/rickylabs/netscript/pull/1640>
- Canonical RFC: `rfcs/0000-database-architecture.md`
- Run: `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/`
- The launcher fast-forwards to the exact remote branch before this session. Record that starting
  commit in `evaluate.md`; evaluate the checked-out content, not a remembered draft.

Read the complete RFC. Then read the compact governing evidence rather than reproducing the full
research corpus:

1. `plan.md`, `plan-eval.md`, `worklog.md`, `context-pack.md`, and `drift.md`;
2. `reviews/root-semantic-closure.md`, `reviews/qwen-rfc-focused-review.md`, and
   `reviews/grok-rfc-adversarial-review.md`;
3. `research/layered-dx-api-audit.md`, `research/typescript-schema-orpc-audit.md`, and
   `research/runtime-validation-source-audit.md`;
4. pinned or official sources linked by the RFC when a claim needs verification.

Do not restart the market study, duplicate source extracts into the RFC, or optimize for a word
count. Content, clarity, and implementability are the criteria.

## Evaluation focus

Judge whether an implementer can build the intended system without inventing missing architecture,
with special weight on the owner's end goal:

1. A fantastic, low-ceremony developer experience built as one progressive surface: concise L1
   preset/DSL, public L2 factories, and unfenced L3 native Prisma plus NetScript primitives.
2. Prisma Next's current native TypeScript contract builder remains the schema authority. NetScript
   adds adoption seams and policy; it does not mirror or fork Prisma's schema/query vocabulary.
3. Contract-first end-to-end type safety: source-native app inference by default, precise branded
   values, and generated declarations only at proven publish/artifact boundaries.
4. One plugin contribution value registered once and fanning out authoring, runtime, control,
   validation, CLI/docs/agent, ownership, and migration facets without a live service locator.
5. Runtime and JSON Standard Schema validation derived from the contract where metadata is
   sufficient, with explicit operation/codec contributions and deterministic fail-closed refusal
   elsewhere.
6. Coherent manifest -> plan -> receipt authority, locks, recovery, retained rollback, multi-space
   identity, and honest PostgreSQL-first scope without pretending full multi-engine parity.
7. A clean break: no backward-compatibility requirement or compatibility shim. Migration guidance,
   tests, and an optional parallel branch provide adoption safety instead.
8. API examples that are internally complete at their stated level and match pinned Prisma 8 RC
   surfaces, package boundaries, emitted artifacts, and runtime value flow.

Attack abstraction cost and manual steps particularly hard. A simple application must not pay
enterprise ceremony before it benefits from it, while advanced users and plugins must retain full
power. Verify that automated watch/compile/emit/staleness behavior makes the happy path feel native
rather than like a sequence of manual generators and adapters.

## Refinement authority

- If the RFC is already sound, do not rewrite it for style or manufacture findings.
- Correct factual contradictions, incomplete value/type flows, misleading API examples, or missing
  DX commitments directly in the RFC when the repair stays within D-01–D-47 and `OWNER-DX-01`.
- Prefer clearer API contracts and links to evidence over duplicated explanation. Consolidate only
  when it improves comprehension; there is no minimum, maximum, or target word count.
- Do not reopen the package graph, compatibility posture, native-Prisma authority, or fail-closed
  validation boundary without a demonstrated blocker. A material architectural rescope receives
  `FAIL_RESCOPE`; do not improvise it in this final pass.
- Do not edit `packages/**`, `plugins/**`, generated evidence, or the verbatim Qwen/Grok review
  artifacts.

## Required outputs and close gate

1. Create `evaluate.md` from `.llm/harness/templates/evaluate.md`. Keep it decision-grade and cite
   concrete file sections, commands, commits, or primary-source links for every substantive result.
2. If you refine the RFC, record each material disposition in `evaluate.md`; then reread the
   affected end-to-end flows so a local correction does not create a cross-section contradiction.
3. Update `worklog.md`, `context-pack.md`, `supervisor.md`, and `drift.md` with the actual fresh
   route, starting commit, verdict, refinements, and the fact that this one gate superseded the
   earlier cancellation. Preserve the cancellation as historical provenance.
4. Run the docs-only mechanical gates: targeted `deno fmt --check` for the mutable Markdown files,
   `deno task docs:links`, `git diff --check`, balanced-fence verification, and a clean status
   check. Do not run package/runtime E2E for this RFC-only gate.
5. Use exactly one formal verdict: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`. A `PASS` may
   include evaluator-owned narrow refinements only when all resulting claims and gates are green.
6. Commit the complete final-evaluator gate with a message naming what it proves, push
   `docs/database-architecture-rfc`, and comment on draft PR #1640 with the commit, verdict,
   refinements, and command evidence. Keep the PR draft; do not merge or mark it ready.
7. Finish with a clean worktree whose local HEAD equals the remote branch. If any required step
   fails, leave an honest failure receipt and do not claim the gate passed.
