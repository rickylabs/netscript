# Drift — docs-cross-host-skills--1745

## D-1 · Issue #1745 names a source path that does not exist — corrected in the run

**Expected (per the issue's acceptance):** the three pages agree with
`packages/cli/src/commands/init-agent.ts`.
**Actual:** that path does not exist at `13878a80`. The authoritative file is
`packages/cli/src/public/features/agent/init/init-agent.ts`.
**Resolution:** the run treats the real path as the acceptance target. No scope change — the intent
is unambiguous. Recorded so the evaluator does not read the substitution as drift from the issue.

## D-2 · One word corrected outside the issue's literal scope list — authorized, declared

`docs/site/reference/ai/skills.md:19-21` calls the bundle "a set of **three** ready-made skills",
directly above a table listing **five**, and `skills/` on main ships five skills plus `help.md`. The
issue's scope list does not name this sentence. Shipping a rewrite of the section immediately below a
known-false count would be a knowing false-fact ship, which this lane does not do.

**Supervisor ruling:** correct `three` → `five`, that word only. Declared here before implementation
rather than discovered in review. Everything else in that callout is untouched.

## D-3 · Observations deliberately not acted on

- The #1728 unresolved background-reference error is undocumented anywhere in `docs/site`. Parked by
  coordinator instruction (docs-lane observation D-2); not part of this leaf.
- The host/editor axis is blurred across all three pages (Zed is an editor, not a host). The rewrite
  must not deepen the confusion, but a full host-vs-editor restructuring is **not** in this leaf.
  Candidate for the coordinator if it survives review.
