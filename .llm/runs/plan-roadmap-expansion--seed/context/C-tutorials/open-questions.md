# Open questions — Topic C (for Fable/Stage C, not resolved here)

## Q1 — Is `chat` one of "the 4," or a separate 5th track?

The site currently has 5 tutorial tracks. Git history shows storefront/workspace/erp-sync/
live-dashboard landed together (`a01722e2`, "docs-v4 IA overhaul"); `chat` landed later, separately
(`2f643f49`, "beta.2 overhaul — AI stack, durable chat, Deno Deploy"). The historical "4-tutorial"
decision (`docs/site/_plan/02-information-architecture.md` Q10) predates `chat`'s existence entirely.
Does "rewrite the 4 tutorials" mean the original 4 (chat stays as-is, untouched, or is retired in
favor of the new minimal eis-chat tutorial), or does it mean "the 4 principal tracks including chat"
(and something else drops)? See `drift-candidates.md` for the full evidence trail.

## Q2 — Does the workspace track's "Extend" aside violate the honesty/candor framing ban? (RESOLVED: compliant)

Verified by direct read of `docs/site/tutorials/workspace/index.md`. The callout ("What NetScript
ships — and what stays your code") is a plain factual statement: "NetScript ships pluggable auth
backends... It does not ship first-class organizations, tenants, or RBAC roles... Read those asides
as 'here is how you would extend it,' not 'NetScript does this for you.'" No "honest/honestly/candid"
language appears — this is exactly the "one clean factual callout instead" pattern the locked voice
rule asks for. **No rewrite needed for tone on this specific aside**; keep it as the reference example
of compliant disclosure when rewriting other tracks. (Chapter-level "Extend" asides referenced from
this index, e.g. workspace chapter 3's `orgId` note, still need Fork B's per-chapter confirmation
that the same discipline holds throughout the full chapter body, not just the index summary.)

## Q3 — How should the rewrite relate to issue #232?

#232's current actual content (fetched live) is an accuracy/coverage debt umbrella entirely
disjoint from a ground-up narrative rewrite. Topic-C's instruction to land the rewrite "under #232"
needs an explicit rescope decision: rescope #232 itself into the rewrite umbrella (and re-file its
current checklist elsewhere), open a new issue and cross-reference #232 without a closing keyword, or
nest the rewrite as a sub-issue. See `analysis/C-tutorials/03-docs-cut-logistics.md` for the full
option list.

## Q4 — Missing `0.0.1-beta.6`/`0.0.1-beta.7` milestones

Neither milestone exists yet in the repo (`gh api .../milestones` confirmed only beta.3-beta.5,
stable, and Backlog/Triage exist), but `specs/01-ratified-decisions.md`'s milestone train places the
docs cut at beta.7. Someone (Fable, or whoever executes milestone-tagging per `AGENTS.md`) needs to
create `0.0.1-beta.7` before any Topic-C GitHub issue can be correctly milestone-tagged.

## Q5 — ERP-sync's "read not run" polyglot chapter vs the exercise-first mandate (CONFIRMED, self-aware)

Verified by direct read of `docs/site/tutorials/erp-sync/index.md`. Chapter 3 ("Polyglot transform")
is explicitly and deliberately non-runnable: "Chapter 3 steps off this hands-on spine to teach the
polyglot runtime... It is the one chapter you read rather than run end-to-end — and it says so
plainly." The chapter card itself says "A documented capability, not a run-it-now step." So this is
a **known, deliberate, disclosed** exception to exercise-first, not a hidden gap. Two live questions
remain for Fable: (a) does the exercise-first *mandate* (topic-C §1) tolerate one deliberately-labeled
reference-style chapter per track, or does "ground-up rewrite, exercise-first" mean this chapter must
become runnable too (e.g., an actual local Python/shell task the reader executes); (b) if Option C
from `candidate-tutorial-mappings.md` is chosen (replacing ERP-sync with an eis-chat-literal track),
this question becomes moot for that track but the "is one read-only chapter acceptable" policy
question still generalizes to any future track.

## Q6 — Chapter granularity: keep today's ~5-6 broad chapters per track, or move toward SvelteKit's
narrower single-concept lessons?

`research/C-tutorials/other-tutorial-ecosystems.md` flags SvelteKit's atomic single-concept lesson
chunking as a candidate lever. This is a genuine IA-shape decision with real trade-offs (more/shorter
chapters improve navigability and exercise-first pacing; fewer/longer chapters better match "one
continuous real build" narrative coherence, à la Rails). Not resolved here — a design-level decision
for Stage D.

## Q7 — Does the dual-database pattern (eis-chat's org-catalog/Prisma + per-channel tursodb) belong
in a core-4 chapter, or is it reserved for the minimal/full eis-chat-equivalent tutorial only?

Flagged in `analysis/C-tutorials/02-eis-chat-build-arc.md` step 2. Including it teaches a real,
valuable NetScript pattern (not everything is one database) but adds complexity that may not fit
every domain narrative equally well (e.g., natural fit for the workspace/auth track, awkward fit for
a live-dashboard-only track).
