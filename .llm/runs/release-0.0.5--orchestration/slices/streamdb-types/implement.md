use harness

# Slice W5-V2: createNetScriptStreamDB type erasure — #1235 (p2, verified)

You are the implementation supervisor for the PR resolving #1235. Read the live issue body
FIRST — independent verifier transcripts from clean scaffolds on 0.0.4/canary.2/canary.6.
Long-standing, not a regression.

## The defect (verified) and its control

`createNetScriptStreamDB` erases collection value types to `unknown`, so the documented
`query.from({ alias: db.collections.x })` call does not type-check against a custom stream
schema. **Control:** the same schema through the underlying package's `createStreamDB` infers
correctly — the framework wrapper alone loses the types, and following the docs pushes users
off the wrapper onto the raw package. canary.6 docs still promise typed collections via the
exact failing call.

## Scope guard (binding)

The original reporter also alleged multi-`from` returns flat union rows — that claim was
**refuted by the verifier and deliberately excluded** from the issue. Do not touch multi-from
row typing; do not "fix" refuted behavior. Wrapper generics only.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/netscript-doctrine` (wrap-don't-reinvent: the fix restores the underlying
  package's inference through the wrapper, never forks it)
- `.agents/skills/deno-fresh` (if the wrapper surface touches Fresh integration types)

## Milestone-run evaluator rule

Composed per milestone-run.md + D6; mark the gate row accordingly; lock plan, implement same
run.

## Deliverable = the gates

1. RED-first: a type-level test (compile-time assertion fixture) reproducing the erasure —
   the documented call fails to type-check against a custom schema on today's main, and the
   underlying `createStreamDB` control infers correctly in the same fixture.
2. The fix: generic parameters flow through `createNetScriptStreamDB` so the documented call
   type-checks with full value types; the control and wrapper now agree. No runtime behavior
   change; `isolatedDeclarations`/slow-types constraints respected (this is a published
   package — `deno doc --lint` + publish dry-run are part of the bar).
3. Docs: the canary docs promising typed collections stay true through the wrapper — verify
   the documented snippet compiles as written (compile-checked doc fixture if the docs lane
   has one; otherwise a test mirroring the snippet).
4. Archetype gates on touched packages; no new lint ignores; no `deno.lock` churn.

## PR

Branch `fix/streamdb-wrapper-type-erasure`; body `Closes #1235`; labels `type:fix` +
`area:fresh` + `area:streams` + `priority:p2` + exactly one `status:`; milestone 0.0.5. Draft
while implementing; ready when green; explicit-refspec pushes only. End DONE when ready, or
BLOCKED: <reason>.
