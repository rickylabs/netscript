# Spec-vs-reality drift candidates — Topic C

These are contradictions between the topic spec's framing and what the repo actually contains today.
Presented as findings for Fable to adjudicate, not resolved here.

## D1 — "4 tutorials" vs 5 existing tracks (highest-confidence drift)

**Spec framing** (topic-C §1, repeated in the task prompt): "rewrite the 4 tutorials from scratch."
**Repo reality**: `docs/site/tutorials/index.md` lists and links 5 tracks — storefront, workspace,
erp-sync, live-dashboard, chat.

**Evidence chain establishing provenance**:
- `docs/site/_plan/02-information-architecture.md`, decision Q10: "core 4-tutorial track (workspace →
  service → jobs → workflow); webhook = wave-2" — this is the historical origin of "the 4."
- `git log --diff-filter=A --name-only -- docs/site/tutorials`: storefront, workspace, erp-sync,
  live-dashboard were added together in commit `a01722e2` ("docs-v4 IA overhaul"). `chat` was added
  later, separately, in commit `2f643f49` ("beta.2 overhaul — AI stack, durable chat, Deno Deploy
  (#383)").
- Conclusion: "the 4" is a real, dated decision that predates `chat`'s existence. The topic spec's
  "4 tutorials" phrasing is consistent with the *original* set, but the current site has moved past
  that baseline without the spec being updated to reflect it. This is not a spec error so much as
  spec staleness — the spec's author may not have accounted for `chat` when writing "4." Recorded as
  `open-questions.md` Q1.

## D2 — "Land under #232" vs #232's actual current scope

**Spec framing** (topic-C §7, inferred from task prompt's docs-cut logistics ask): rewrite work
should land "under #232."
**Repo reality**: #232's live body (fetched via `gh issue view 232 --json title,body,state,labels,
comments`) is an accuracy/coverage debt umbrella (Run-2 grounding, DataGrid/Dropzone reference depth,
Aspire telemetry gaps, streams scoping, workers verification) with zero content overlap with a
ground-up narrative rewrite. Filing a rewrite epic "under" #232 without rescoping it would conflate
two materially different work programs under one issue. Recorded as `open-questions.md` Q3.

## D3 — Nav wiring assumes chapter-level URL stability that a "ground-up rewrite" implicitly threatens

**Spec framing**: "ground-up rewrite" implies IA/structure is fully up for change.
**Repo reality**: `docs/site/_data.ts` wires 6 specific tutorial **chapter** URLs (not track
indexes) into 8 unrelated capability-hub nav sections as their "Quickstart" anchors. A ground-up
rewrite that changes chapter slugs/filenames — which "ground-up" strongly implies it will — has wide
blast radius that isn't visible from inside the tutorials folder alone. Not a contradiction in the
spec itself, but a load-bearing logistics fact the spec doesn't mention and Stage D's design must
account for. Full detail in `analysis/C-tutorials/03-docs-cut-logistics.md`.

## D4 — Missing milestone for the stated release train position

**Spec/ratified-decisions framing**: docs cut ships at `0.0.1-beta.7`.
**Repo reality**: no `0.0.1-beta.6` or `0.0.1-beta.7` GitHub milestone exists yet (confirmed via
`gh api repos/rickylabs/netscript/milestones`). Not a contradiction in intent, but a concrete gap
that will block correct issue-filing per `AGENTS.md`'s mandatory milestone-tagging obligation until
someone creates it.

## D5 — "Follow the eis-chat approach" is ambiguous between domain-literal and discipline-literal reuse

**Spec framing**: "the way eis-chat docs are built" as the reference approach for all 4 rewrites.
**Repo reality**: eis-chat is a single coherent chat/messaging domain project. Read literally
("domain-for-domain"), this would mean all 4 rewritten tracks converge on chat-adjacent domains,
which conflicts with the separate ask for topical diversity implied by today's 5-track capability-hub
cross-linking (storefront/commerce, ERP/interop, live-dashboard, workspace/auth are 4 genuinely
different domains). Read as "discipline-literal" (seam ordering, exercise-first pacing, checkpoint
style), no conflict exists. This is very likely intended as discipline-literal, but the spec text
does not disambiguate explicitly — flagged so Stage C/D make the reading explicit rather than assume
it. See `candidate-tutorial-mappings.md` Options A/B/C for how this ambiguity plays out concretely.
