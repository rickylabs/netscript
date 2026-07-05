# Candidate mappings — real project per rewritten tutorial (NOT decisions)

Per topic spec §4, the real-project-backing decision is delegated to Fable. This file lays out
options with evidence; it does not choose.

## Constraint recap

- D3 (ratified) already names eis-chat as *a* real project reference for the docs cut, with a
  "Medusa-inspired" writing bar.
- Owner's brief: rewrite 4 tutorials from scratch, exercise-first, following the eis-chat build
  approach, PLUS a new minimal eis-chat-equivalent tutorial.
- Drift candidate (see `drift-candidates.md`): the site currently has 5 tracks, not 4, and "the 4"
  historically meant storefront/workspace/erp-sync/live-dashboard per
  `docs/site/_plan/02-information-architecture.md` Q10 ("core 4-tutorial track: workspace → service →
  jobs → workflow; webhook = wave-2"). Whether `chat` is one of "the 4" or is being folded into/
  replaced by the new minimal eis-chat tutorial is unresolved — see `open-questions.md` Q1.

## Option A — eis-chat backs all 4 rewrites directly (single real project, per-chapter seam slices)

Rebuild all 4 tracks as sequential slices of the *same* eis-chat-derived build, Rails-Guides-style
(one continuous app, not one app per track). Concretely: track 1 = scaffold + contracts + SDK client
(eis-chat's foundation phase); track 2 = auth/workspace/org-catalog (eis-chat's dual-database +
identity phase); track 3 = workers/jobs/durable delivery (eis-chat's message-fanout phase); track 4 =
streams/live-dashboard (eis-chat's durable live-query + desktop-shell phase). The separately-requested
"minimal eis-chat tutorial" would then be a *fifth*, deliberately smaller, standalone artifact that
compresses the same arc into one sitting.

- Pro: maximum narrative coherence; matches Rails' "one continuous app" pattern (research finding);
  directly satisfies "follow the eis-chat approach."
- Con: loses the topical variety of today's 5 tracks (storefront/commerce domain, ERP polyglot
  interop, live dashboard, chat, workspace-auth each currently teach a different NetScript-adjacent
  domain problem) — a reader who only cares about e.g. background jobs would have to wade through an
  unrelated chat-app narrative to reach that chapter.
- Evidence: eis-chat's own phase sequence (per Fork A's findings) already reads as: scaffold → oRPC
  contracts/SDK → dual-DB persistence → workers/job fanout → streams/durable live-query → desktop
  shell. That is naturally a 4-5 chapter arc already.

## Option B — keep 4 distinct domain narratives, each independently "eis-chat-approach" but not
eis-chat-literal (status quo domain diversity, new writing/exercise discipline)

Keep something like today's 4 non-chat tracks' *domains* (storefront/commerce, team workspace/auth,
ERP polyglot sync, live dashboard) but rewrite each chapter-by-chapter using the eis-chat *build
discipline* (exercise-first, seam-per-phase, literal checkpoints) rather than lifting eis-chat's
literal domain into each track. `chat` becomes exactly the new "minimal eis-chat-equivalent tutorial"
requested — i.e., today's `chat` track is superseded/absorbed by the new minimal-eis-chat build,
resolving the "4 vs 5" tension by retirement rather than addition.

- Pro: preserves reader-facing topical diversity (useful for the capability-hub cross-linking found
  in `analysis/C-tutorials/03-docs-cut-logistics.md` — 8 hub sections each expect a distinctly-themed
  quickstart chapter); lower nav blast-radius if slugs are kept stable.
- Con: "follow the eis-chat approach" is honored at the level of writing discipline and seam
  ordering, not literal domain-for-domain reuse — slightly weaker fidelity to "the same way eis-chat
  docs are built" if that phrase is read as domain-literal rather than discipline-literal.

## Option C — hybrid: 3 domain-diverse tracks + 1 eis-chat-literal track + minimal eis-chat as the
5th/onboarding tutorial

Keep storefront + workspace + live-dashboard as domain-diverse rewrites (discipline-only reuse, per
Option B), replace ERP-sync (today's weakest/most "read not run" track per the current index.md —
its polyglot-transform chapter is explicitly framework-adjacent Python/Node interop, least
NetScript-idiomatic) with a direct eis-chat-literal track (workers/streams-heavy, matches eis-chat's
actual strongest NetScript dogfooding surface), and add the minimal eis-chat tutorial as a 5th,
separate, shorter on-ramp.

- Pro: replaces the track with the weakest gap-list (once Fork B's per-chapter audit confirms this;
  provisional based on my own index.md-level read) with the track that has the strongest real-project
  backing (eis-chat workers/streams usage is deep and dogfooded, per Fork A's findings); minimal
  eis-chat tutorial serves as the "quickest full-stack path" onboarding lane distinct from the 4 deep
  tracks.
- Con: introduces a 5-track (now 6 with the new minimal one) surface again, arguably re-inflating
  scope the "4 tutorials" framing was trying to bound.

## Minimal eis-chat tutorial — shape candidates (independent of which option above is chosen)

- **Shape 1 — single-sitting build**: scaffold → one contract → one worker → one stream → done. No
  auth, no desktop shell, no multi-database. Targets "prove NetScript's core loop in under an hour."
- **Shape 2 — architecture-tour build**: same single-sitting length, but explicitly narrated as "this
  is the smallest possible slice of what eis-chat actually is" with an explicit closing map back to
  eis-chat's full architecture (ARCHITECTURE.md) for the reader who wants to go deeper — positions it
  as a funnel into the 4 deep tracks rather than a standalone toy.
- Evidence for both: eis-chat's own `BUILD-PLAN.md` "Foundation decision" section (per Fork A) already
  reconciles a pre-NetScript build with a post-scaffold NetScript story — the minimal tutorial should
  tell the **post-scaffold** story only, per Fork A's explicit finding, not lift the PHASE-*.md docs
  verbatim (those read as pre-NetScript/Turso-native).

## Recommendation weighting (evidence-based, not a decision)

Option C is the best-evidenced middle path: it directly uses the weakest-track/strongest-real-project
mismatch as the lever for *where* eis-chat literally replaces content, while preserving the
capability-hub nav diversity that 8 different site sections currently depend on. This should be
treated as the leading candidate for Fable to ratify or reject, contingent on Fork B's confirmation
that ERP-sync is in fact the weakest track (pending at time of writing — see `open-questions.md`).
