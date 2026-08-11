# RFC authority — one corpus, not two

**`rfcs/0000-devtools-contribution.md` is the single normative authority.**

## Why `rfc-sections/` no longer exists

Stage E drafted the RFC as ten section files, assembled them into the canonical document, and then
— during the stage-F and PLAN-EVAL fix cycles — **edited the assembled document**. The section
sources were not re-synced, so the repository carried **two corpora that disagreed**: the RFC said
`A1 + A6 + A5` while `rfc-sections/13-integration.md` still said `A2`, and identity/ordering
variants survived in the sources after being fixed in the RFC.

PLAN-EVAL cycle 2 found exactly this and was right to fail on it. A normative document with a stale
parallel source is worse than having no source at all, because a reader cannot tell which one binds.

**Fix applied: the assembly scaffold is deleted, not re-synced.** Re-syncing would restore the same
divergence the next time the RFC is edited — the defect is *having two corpora*, not *this
particular skew*. Drafting provenance is preserved in git history (see the stage-E authoring commits
and `workflows/stage-e-rfc-authoring-workflow.js`, which is committed and re-runnable).

## Authority order, for anything that disagrees

1. `rfcs/0000-devtools-contribution.md` — normative.
2. `plan.md` — the run's locked decisions and gates.
3. `drift.md` — **wins over the stage-B corpus and the stage-D packs** wherever they conflict; that
   is what drift is for.
4. `design/T*/` and `research/` — **historical evidence**, frozen at the time they were written.
   They are not rewritten when a decision changes; they carry a banner pointing here instead.
5. After board filing: **GitHub wins over all of the above**, per the seed-run authority rule.
