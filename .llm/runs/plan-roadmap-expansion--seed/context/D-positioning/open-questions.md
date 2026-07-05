# Open questions — Topic D (per-feature storytelling / positioning docs)

Mandatory B4 deliverable. These are decision points the Fable supervisor / Opus deep-dive design
pass needs to resolve before or during per-feature authoring-brief writing. Each includes the
evidence gathered so far and, where possible, a recommended default.

## 1. `capabilities/` vs. the 9 domain-pillar folders — which IA does the per-feature rework land in?

**Finding (resolved, decision still open):** these are two unreconciled information architectures
from different eras, not an intentional two-tier design — confirmed via `docs/site/_data.ts` nav
wiring and `index.vto` homepage links (neither references `capabilities/`), plus inconsistent
cross-linking across the 9 pillar index pages. Full evidence in
`analysis/D-positioning/current-docs-audit.md` §3.

**Decision needed:** does the per-feature storytelling rework (a) fold into the 9 pillar folders
(the zone that's actually in nav — lowest risk, no new orphaned content), (b) revive `capabilities/`
as a deliberate second tier (Capability-Hub pattern, matching the Medusa/Astro prior-art research in
`_plan/06-reference-site-teardown.md`) and wire it into nav, or (c) delete/merge `capabilities/`
content into the pillar folders and treat this as one IA going forward? Recommend (a) or (c) unless
the deep-dive design pass has a specific reason to keep two tiers — a silent orphan zone is worse
than either alternative.

## 2. CLI/scaffold, deployment, and MCP have no dedicated hub-level page today

All three are named directly in adjacent specs/owner language (CLI/scaffold and deployment are
core NetScript surfaces; MCP grounding is a first-class eis-chat proof point per
`context/D-positioning/elevator-pitch-raw-material.md` item 8) but have no capability-hub-equivalent
landing page in either `capabilities/` or the 9 pillar folders today (see
`analysis/D-positioning/current-docs-audit.md` §1 asymmetry callouts). **Decision needed:** should
Topic D's per-feature supervisor fan-out include net-new hub pages for these three, or are they
explicitly out of scope (CLI covered by `cli-reference.md` + how-tos; deployment covered by the
separate deployment epic per MEMORY `netscript-deployment-epic`; MCP covered only as a sub-topic
inside the AI pillar)? This changes the feature count the "one supervisor per feature" fan-out needs
to plan for.

## 3. Elevator-pitch source of truth when eis-chat and the master positioning brief conflict

`_plan/01-positioning-brief.md`'s master pitch and 7 USPs were written before this session's eis-chat
extraction. Spot-check: no direct conflicts found, but the master pitch is generic/aspirational while
the eis-chat material is concrete/evidenced. **Decision needed:** should per-feature pitches be
rewritten to lead with the eis-chat evidence (recommended — it's real, falsifiable, and matches the
locked AI-agent-build-efficiency positioning better than generic USP language), or should the master
brief's language be preserved as the "voice" template with eis-chat evidence used only as supporting
proof? Recommend leading with eis-chat evidence per feature, master brief as tone/structure guide
only.

## 4. Auth is a confirmed total gap in the eis-chat proof corpus

No feature story can honestly cite eis-chat as proof for NetScript's auth capability (`auth-better-
auth`, `auth-kv-oauth`, `auth-workos`, `plugin-auth-core`) — the elevator-pitch extraction found zero
real usage. **Decision needed:** does the auth feature's per-feature story get written from the
package's own reference docs/tests only (no dogfooding proof point), get deprioritized in the
fan-out ordering, or does the design pass want a fast eis-chat auth-adoption follow-up before that
page ships? Recommend: write it from package docs, explicitly note (internally, not on the page) that
it lacks a dogfooding proof point, and don't block the rest of the fan-out on it.

## 5. `netscript-bench` (#302) is not yet available — how do measured build-efficiency claims work without it?

The locked positioning centers on AI-agent build-efficiency (turns-to-green), but the instrument
that would measure it (`netscript-bench`) is ratified as a post-stable fast-follow, not built yet.
**Decision needed:** do per-feature pages make qualitative build-efficiency claims only (e.g., "one
contract change updates the server, client, and DB shape at once" — mechanism-level, falsifiable by
reading the code) until real numbers exist, or does the design pass want to hold specific "fewer
turns" language until #302 ships? Recommend qualitative/mechanism-level claims now (fully supported
by the eis-chat evidence gathered), explicit avoidance of any invented percentage/turn-count, and a
follow-up pass once #302 ships real numbers.

## 6. Two landmine bugs discovered — whose slice fixes them?

- `explanation/plugin-system.md` contradicts `explanation/auth-model.md`/`explanation/observability.md`
  about whether an auth audit/telemetry surface exists (factual bug, not a positioning issue —
  `analysis/D-positioning/current-docs-audit.md` §5).
- `concepts.vto` says "Still alpha... targeting late 2026" while the rest of the site says "beta"
  (drift — `context/D-positioning/authoring-constraints.md`).

**Decision needed:** fold these fixes into whichever per-feature supervisor touches those pages
(plugin-system/auth/observability owns the first; whoever touches the front door owns the second), or
route them as small standalone side-fixes ahead of the main fan-out? Recommend folding into the
owning per-feature slice — both are small, in-scope edits, not separate epics.

## 7. Residual eis-chat research gap (screenshots/design-system cross-reference)

The elevator-pitch extraction flagged `docs/assets/README.md` (screenshot filenames/captions) and
`docs/design/*.md` (design-system cross-reference against the generative-UI catalog in
`builtin-skills.ts`) as not re-verified to the literal-string level in its final pass. **Decision
needed:** does any per-feature page (most likely the AI/generative-UI or Fresh-UI pillar) need actual
screenshot assets, in which case a short targeted follow-up read of those two files is worth doing
before that specific page is authored? Low cost, low risk — recommend doing this opportunistically
when that specific page's supervisor is briefed, not as a blocking step for the whole topic.

## 8. Remaining unresolved items from `_plan/07-questions-for-user.md` (pre-`specs/01` era)

Most of Q1-Q14 there are superseded by `specs/01-ratified-decisions.md`. Two still look live for
Topic D specifically: Q4 (competitive framing — now answered by the locked positioning + this
session's competitor teardown, but the pre-existing "single honest table" phrasing must not be
copied — see `authoring-constraints.md`) and Q7 (Aspire emphasis — how much should the Aspire
orchestration story lean on ".NET Aspire adjacency" vs. standing fully on its own; the eis-chat
material item 6 supports a strong standalone "generated helpers, real end-to-end wiring" story
without needing the .NET Aspire comparison at all). **Decision needed:** confirm with the design pass
whether Q7's framing choice is still open or whether `specs/01` already closed it — not fully
confirmed in this research pass.

## Spec contradictions / drift candidates (summary — full detail in analysis + matrix files)

- `_plan/00-README.md` describes a barer site than currently exists — stale baseline, do not use.
- `_plan/09-research-integration.md`'s 21-package/4-plugin inventory is stale — current is 28
  packages / 6 plugins (confirmed via direct `Get-ChildItem`).
- "Honesty/candor" framing appears in several unshipped `_plan/` files (`market-fit.md`,
  `08-decisions-locked.md` Q4/Q5, `07-questions-for-user.md`) but has **not** leaked into any live
  docs page — contained, but a landmine for any agent that copies `_plan/` prose verbatim.
- `_plan/research/market-fit.md` contains a "high-throughput" phrase that conflicts with the locked
  no-throughput-claims rule — another verbatim-copy landmine.
