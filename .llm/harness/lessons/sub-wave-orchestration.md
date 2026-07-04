# Lesson: Sub-wave orchestration under an umbrella branch

## Context

Source runs:

- Wave 2 umbrella `feat/package-quality-wave2-adapters` (PR #11)
- sub-waves 2a (PR #10), 2b (PR #12), 2c (PR #13)

Wave 2 bundled six packages. Doing them in one branch would have produced an
un-reviewable PR and serialized three independent IMPL-EVALs behind one merge.
Splitting into dependency-ordered sub-waves under a single umbrella made each
piece reviewable, independently evaluable, and safely mergeable.

## The branch model that worked

```
main
└── feat/package-quality                         (S1 track → main, PR #2)
    └── feat/package-quality-wave2-adapters       (umbrella / integration, PR #11)
        ├── feat/...-wave2-adapters-2a            (merged to TRACK, #10) *
        ├── feat/...-wave2-adapters-2b            (merged to UMBRELLA, #12)
        └── feat/...-wave2-adapters-2c            (merged to UMBRELLA, #13)
```

- The **umbrella** is a long-lived integration branch off the track. Sub-waves
  target the umbrella, not the track. The umbrella merges to the track **once**,
  when the whole wave is complete, with a merge commit (`--no-ff`).
- Each sub-wave gets its **own worktree + branch + Draft PR + seed run docs**, and
  its **own separate-session IMPL-EVAL**.
- `*` 2a was merged straight to the track before the umbrella existed, which
  collapsed the Wave 2 tracking surface prematurely; the umbrella had to be
  re-established and 2a base-synced into it. **Lesson: stand up the umbrella PR
  before merging the first sub-wave**, so the tracking surface survives the wave.

## Dependency-ordered splitting

Split by the unit dependency graph, then force the sub-wave order to match:

- `kv` depends on `logger` → 2b (data) comes after 2a (observability).
- `queue` consumes `@netscript/kv` → 2c (messaging) comes after 2b.

A sub-wave must therefore base off the **umbrella tip** (which already contains
the upstream sub-waves), not off the track. Confirm the upstream sub-wave tips are
ancestors of the chosen base before forking (`git merge-base --is-ancestor`).

## Separate-session discipline (hard rule)

Generator, PLAN-EVAL, and IMPL-EVAL are each a **different session**. The
evaluator independently re-runs every gate rather than trusting the worklog. This
is what caught the 2c Slice-16 worklog claim ("No isolated-declarations debt
surfaced") that was actually false — the evaluator's independent `deno check`
surfaced 3 pre-existing CLI errors the generator had not seen.

## Supervisor bookkeeping that paid off

- One commit per slice, **paired with a `docs(NN): record …` commit** that writes
  the worklog/drift row. The history reads as a ledger.
- The supervisor seeds each sub-wave's `context-pack.md` front-loading carried-in
  decisions (locked OQ-* answers, structural baseline, MEASURE-FIRST instructions,
  deferred scope) so the generator never re-litigates settled questions.
- The merge condition is written into the umbrella PR body up front and only
  flipped to "satisfied" when every sub-wave has a separate-session IMPL-EVAL PASS.

## Promotion

Promoted because this is the reusable program structure for any multi-unit wave
(every remaining package/plugin track), not a one-off. Pairs with
`package-quality-archetype.md` (what each sub-wave must achieve) and `validation.md`
(how gates are attributed across units).
