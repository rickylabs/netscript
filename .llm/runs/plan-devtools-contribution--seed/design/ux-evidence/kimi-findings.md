[0m
> build · moonshotai/kimi-k3
[0m
[0m→ [0mSkill "design"
[0m→ [0mSkill "fresh-ui-horizontal"
[0m→ [0mSkill "netscript-harness"
[0m
[0m$ [0mls /home/codex/repos/ns-devtools-d2-kimi/docs/architecture/rfc/ && wc -l /home/codex/repos/ns-devtools-d2-kimi/docs/architecture/rfc/rfc-0002-devtools-contribution.md
rfc-0002-devtools-contribution.md
3705 /home/codex/repos/ns-devtools-d2-kimi/docs/architecture/rfc/rfc-0002-devtools-contribution.md
[0m
[0m$ [0mgrep -n '^#\{1,3\} ' /home/codex/repos/ns-devtools-d2-kimi/docs/architecture/rfc/rfc-0002-devtools-contribution.md
1:# RFC-0002 — NetScript DevTools contribution architecture
14:## 1. Abstract
52:## 2. Motivation
54:### 2.1 The cost of having no seam
74:### 2.2 Why now, and why this shape
89:### 2.3 What this RFC deliberately does not assume
108:### 2.4 Non-goals
117:## 3. Current state — what exists, what does not
124:### 1. There is no plugin→UI channel of any kind
164:### 2. The plugin manifest is two disjoint shapes
189:### 3. The contribution-axis model, and its provable closedness
237:### 4. What a contributor must edit today to add a kind
256:### 5. Generation: two divergent generators, a regex "AstExtractor", non-transactional writes
310:### 6. The `/design` precedent
332:### 7. The data plane that already exists — consume, do not rebuild
372:### 8. Capability matrix
407:## 4. The five frontend contribution surfaces
409:### The taxonomy is the owner's, not this RFC's
438:### The map
448:### Why the seams do not overlap
476:### The two hard dependencies
550:### Dependency diagram
589:### What "defer" means here — no vague deferrals
612:### Owner forks surfaced by this section
620:## 5. The DevTools host
638:### Why a separate process, not the two alternatives
651:### H-2 — Local development behavior (normative)
696:### H-3 — Package-shipped panel islands ride the upstream seam
720:### H-4 — Deployed production: absent, by two independent mechanisms
763:### H-5 — Remote exposure
784:### H-6 — Decided fact: the Vite-injection mount was never available
810:### H-7 — Vite 8 is an explicit non-goal, with a re-entry condition
827:### H-8 — `/design` is recorded as an existing ungated surface, not fixed here
840:### Owner forks raised by this section
850:## 6. The DevTools contribution family
865:### Decision
880:### Owner fork O-1 (restated) and Owner fork O-2 — the #890 dependency decision
915:### The envelope
967:### Identity and the family binding
1013:### Negotiation
1030:### The pointer — and the manifest-strictness precondition
1064:### Discovery and the generated registry
1126:### Host capabilities — the descriptor
1158:### Ordering
1214:### Collision
1239:### Quarantine
1276:### Budgets
1294:### Install, update, remove
1315:### Owner forks raised by this section
1326:### Open risks
1336:## 7. Contribution kinds
1340:### Decision
1377:### Evaluation of every candidate
1400:### Cross-kind rules
1424:### Retained kind contracts
1578:### Read-only by default
1625:### Why `ai-tool` is rejected
1645:### Staged and rejected, with entry criteria
1674:### Open owner forks
1696:## 8. The data plane
1706:### D-6.1 — The host is the single data edge
1724:### D-6.2 — The confused-deputy shape is removed by construction
1775:### D-6.3 — Contracts: host→panel server context
1823:### D-6.4 — Contracts: host→panel client context
1892:### D-6.5 — Transport decision
1916:### D-6.6 — Live updates
1966:### D-6.7 — Caching, invalidation, provenance
1981:### D-6.8 — OTel correlation
2001:### D-6.9 — Auth sequencing: the blocking dependency, stated honestly
2044:### D-6.10 — Consume vs build
2067:### D-6.11 — Manifest precondition, inherited from drift
2077:### D-6.12 — Rejected alternatives
2098:### D-6.13 — Owner forks raised by this section
2109:## 9. Trust, security, and the threat model
2117:### D-1. Trust is graded by exposure, not by contributor
2168:### D-2. The two invariants that are non-negotiable
2216:### D-3. Threat model
2233:### D-4. Normative invariants and their gates
2262:### D-5. Declined, each with its cited antecedent
2279:### D-6. Owner forks raised by this section
2297:## 10. Build and development mechanics
2309:### D-1 — Contributions enter the build as generated source modules, never as Vite plugins
2346:### D-2 — Panels ship as source; islands and source maps follow from that
2384:### D-3 — The registry transaction
2448:### D-4 — Dev-loop verdict: **no watch loop in v1**
2483:### D-5 — Install / update / remove
2550:### D-6 — Doctor diagnostics wired to the contribution taxonomy
2580:### D-7 — Production exclusion: two independent mechanisms, fail-safe polarity
2605:### D-8 — The Vite-contribution verdict: deferred, with entry criteria
2651:### Owner forks raised by this section
2662:## 11. Information architecture
2675:### 11.1 Normative acceptance criteria
2722:### 11.2 Ownership boundary (Q5)
2763:### 11.3 Route tree
2840:### 11.4 The AC-1 record: why each surface is NetScript-only
2852:### 11.5 Worked first-party examples
2868:### 11.6 Deep-link helper
2943:### 11.7 State matrix
3006:### 11.8 Owner forks raised by this section
3019:## 12. Prior art and market architecture study
3030:### 12.1 The headline: the closest analogue deleted its own shell, and its replacement is out of reach
3090:### 12.2 Category 1 — developer tooling (Vite DevTools / Nuxt DevTools, TanStack Devtools, vite-plugin-inspect)
3146:### 12.3 Category 2 — production admin consoles (Medusa, Directus, Strapi, Backstage, Grafana)
3222:### 12.4 The separation verdict (Q4) — why admin-console mechanisms do not transfer
3266:### 12.5 Category 3 — the upstream surfaces NetScript deep-links to (Aspire Dashboard, Scalar)
3333:### 12.6 Comparison table
3352:### 12.7 Three overturned assumptions
3397:### 12.8 Adopt / adapt / decline
3461:## 13. Packages, archetypes, and gates
3466:### 13.1 Proposed package ownership
3507:### 13.2 Public API sketch — the planned surface
3547:### 13.3 Gate set
3579:### 13.4 Doctrine anti-patterns this design is most at risk of
3593:## 14. Implementation roadmap
3650:## 15. Owner decision brief
3655:### 15.1 Must resolve before implementation begins
3668:### 15.2 Board decisions (no mutation until ratified)
3684:### 15.3 Scope boundaries to confirm
3696:### 15.4 Accepted risks, stated as risks
[0m
[0m→ [0mRead docs/architecture/rfc/rfc-0002-devtools-contribution.md[90m [offset=2662, limit=360][0m
[0m→ [0mRead docs/architecture/rfc/rfc-0002-devtools-contribution.md[90m [limit=362, offset=1336][0m
[0m→ [0mRead docs/architecture/rfc/rfc-0002-devtools-contribution.md[90m [limit=232, offset=620][0m
Now let me read the historical context proposal for cross-reference.
[0m
[0m$ [0mls /home/codex/repos/ns-devtools-d2-kimi/.llm/runs/plan-devtools-contribution--seed/design/ 2>/dev/null && wc -l /home/codex/repos/ns-devtools-d2-kimi/.llm/runs/plan-devtools-contribution--seed/design/T8-ia-and-staging/proposal.md 2>/dev/null
T1-host-shape
T2-contribution-family
T3-contribution-kinds
T5-data-plane
T6-trust-model
T7-build-dev
T8-ia-and-staging
T9-supersession
ux-evidence
305 /home/codex/repos/ns-devtools-d2-kimi/.llm/runs/plan-devtools-contribution--seed/design/T8-ia-and-staging/proposal.md
[0m
[0m→ [0mRead .llm/runs/plan-devtools-contribution--seed/design/T8-ia-and-staging/proposal.md
[0m→ [0mRead docs/architecture/rfc/rfc-0002-devtools-contribution.md[90m [limit=36, offset=2448][0m
[0m→ [0mRead docs/architecture/rfc/rfc-0002-devtools-contribution.md[90m [limit=30, offset=1706][0m
[0m→ [0mRead docs/architecture/rfc/rfc-0002-devtools-contribution.md[90m [limit=75, offset=1823][0m
[0m→ [0mRead docs/architecture/rfc/rfc-0002-devtools-contribution.md[90m [limit=66, offset=1916][0m
One more verification pass on the live-update/caching sections so my staleness finding is accurate.
UX review complete. I read §11 (all of it), §7, §5, the §8 data-plane client context and live-update/caching subsections, §10 D-4, and the T8 historical pack (RFC wins on conflict; noted where the RFC already corrected it). No files were touched. Findings only, advisory, no Plan-Gate verdict.

### [SEVERITY: critical] Home cannot distinguish "nothing is broken" from "DevTools is blind"
**Anchor:** §11.3, lines 2781-2788 — "Ranked problem feed across every seam"; §11.7 Home row, line 2995 — "First run, all wiring facts zero → onboarding card with `netscript plugin add …`"
**Finding:** The redefined `<base>/` is a real triage surface in intent — feed first, stats below, per-card error boundaries, rows deep-link to owners. But the matrix specifies exactly two Home states: first-run onboarding and "never generated" chips. The steady state of a *healthy* app — zero problems — has no specified rendering, and neither does the dangerous twin: zero rows because feed sources are down. Doctor "requires running app" (line 3002), run-state needs the app's telemetry, registry freshness needs a generator to have run — every feed source is independently partial, yet there is no feed-source availability model and no "last evaluated at" timestamp. First ten seconds: the developer opens Home, sees an empty feed, and cannot tell whether to relax or panic.
**Why it matters:** A triage feed that silently shows nothing when its sources are degraded fails the one job `<base>/` was redefined to do. This is precisely the "shows stale data" false-done mode §11.7 quotes as its guard (lines 2946-2948) and then doesn't catch.
**Proposed direction:** Add two things to the Home row of §11.7: (a) an explicit all-clear state — "no known problems as of `<timestamp>`", reusing the endpoint-and-source provenance affordance from the Loading contract (line 2966); (b) a feed-source strip naming each contributing source (doctor, run-state, registry freshness, quarantine) with its availability, so a blind feed renders as degraded, never as empty.

### [SEVERITY: minor] "Ranked" has no ranking rule, severity vocabulary, or row schema
**Anchor:** §11.3, line 2782 — "Ranked problem feed across every seam"
**Finding:** Nothing in §11 defines what a feed row *is* (severity? source surface? timestamp? one-line summary?) or what orders it — severity-then-recency, pure recency, quarantine-first? "Ranked" is a load-bearing adjective with no contract behind it.
**Why it matters:** Six feed sources (quarantine, failed runs, drift, doctor, epoch, coverage) with no ordering rule means six implementers make six ranking choices, and the feed's top row — the thing a developer acts on first — becomes arbitrary.
**Proposed direction:** Define a `FeedRow` contract (severity enum shared with `badge` tones, source surface id, `at` timestamp, summary, destination link) and one deterministic rank rule. Two sentences in §11.3 closes it.

### [SEVERITY: major] The flagship journey view has no index route and inconsistent in-links
**Anchor:** §11.3, line 2798 — `<base>/flows/:correlationId` is the only flows route; §11.5 — the Sagas row links "instance's journey → `<base>/flows/:correlationId` (internal)" (line 2860) but the Workers row (line 2859) lists only Aspire out-links
**Finding:** The S13 journey view — the surface AC-3 exists to protect, the most NetScript-specific thing in the product — is reachable only with a correlation id already in hand. There is no `/flows/` index, no nav entry, and the in-linking is asymmetric: a saga instance links to its journey, a worker execution does not. Path today: Home feed row → runtime execution → (maybe) journey. That's the flagship sitting two clicks deep with an unmarked door.
**Why it matters:** The developer's actual question — "what did this failed job *cause*?" — is the journey's entire purpose, and from the highest-traffic runtime surface (workers) there is no way to reach it.
**Proposed direction:** Add `<base>/flows/` as a recent-journeys index (correlation id, root primitive, status, age — sourced from the same `netscript.correlation.id` join), and make the journey link uniform across all four primitive rows in §11.5.

### [SEVERITY: major] Two panel-state vocabularies, no mapping — and read-only v1's central affordance falls between them
**Anchor:** §7, lines 1466-1476 — `PanelAvailability` with `'unavailable'` + `remedy.cliEquivalent`; §11.7, line 2945 — "a surface ships only with **all six states** specified" against a seven-arm `PanelState` (lines 2952-2960)
**Finding:** §7 gives contributors `ready | empty | unavailable`; §11.7 gives surfaces `loading | empty | ready | degraded | incompatible | unauthorized | failure`. No text maps one to the other. The casualty is the launch card: §7 makes `unavailable` + `remedy.cliEquivalent` the honest form of every mutation in read-only v1 (line 1612-1613 — "shows the command and does not run it"), yet no `PanelState` arm can carry a remedy — `degraded` has `label` + `citation` only. The §11.7 plugins row quietly re-implements it as degraded ("Doctor unavailable (no AppHost running)", line 3002), proving the mapping is needed and undefined. Separately, "six states" counts seven arms; a surface author speccing six will skip one.
**Why it matters:** The state matrix is the normative merge gate; the remedy card is v1's single most important contributor-facing UX pattern. A contributor who implements `availability() → unavailable` cannot tell which matrix row they just triggered or whether their `cliEquivalent` will render.
**Proposed direction:** Either add `{ kind: 'unavailable'; reason; remedy? }` to `PanelState`, or state the explicit mapping table (`unavailable` → `degraded` with remedy rendered). Fix the count wording while there.

### [SEVERITY: major] Staleness — the matrix's own quoted guard — is unrepresentable in the normative state contract
**Anchor:** §11.7, lines 2946-2948 — quoting "shows stale data" as the false-done mode being guarded; §8 D-6.7, lines 1973-1974 — "Per-panel polling fallback with a visible staleness indicator when the feed is `latched-off`"
**Finding:** The data plane promises a visible staleness indicator and a `latched-off` feed state (D-6.6, line 1952), but `PanelState` has no staleness arm and no freshness field on `ready` — the only place it can exist is per-panel ad-hoc, and exactly one surface row mentions a stale-data timestamp (workers, line 2996). The merge gate cannot enforce what the type cannot express.
**Why it matters:** Diagnostic surfaces die by stale data that looks live. A saga timeline or firing history that is 40 seconds old is *wrong*, not old — and the contract that every surface must satisfy before merge has no way to require the disclosure.
**Proposed direction:** Add an `asOf: string` (ISO-8601) to `ready`/`degraded`, and a per-surface matrix line: "feed `latched-off` ⇒ polling fallback with staleness chip" as a shared contract row, not a workers-only delta.

### [SEVERITY: major] `DevToolsUiNode` tables are string-only — the canonical devtools table is the first inexpressible panel
**Anchor:** §7, line 1494 — `table` rows are `readonly (readonly string[])[]`; §7, line 1385 — "most plugin panels are key/value + table + list"; §11.1, line 2696 — "renders its CLI-equivalent line (`netscript …` CodeBlock)"
**Finding:** Three concrete gaps in the closed vocabulary. (a) **First inexpressible panel:** any entity list with drill-down — "recent failed jobs, status badge, link to each execution" — because table cells cannot contain `link` or `badge`, only strings. That is the single most common devtools table shape, and the workaround (a stack of row-stacks) loses columnar scan-ability. (b) **No `code`/`pre` node**, despite AC-2 making the CLI-equivalent `CodeBlock` the most-repeated render requirement in the RFC and §7's own prose listing "list" as a common case the vocabulary also lacks. A contributed panel showing a payload, cron expression, or remedy command renders it as prose. (c) **Cut/merge candidate:** nothing earns literally zero, but the two divergent tone scales — `text.tone: 'default'|'muted'|'danger'` (line 1492) vs `badge.tone: 'ok'|'warn'|'error'` (line 1495) — are one severity model wearing two vocabularies; unify on the badge scale and let `text` reference it.
**Why it matters:** OF-5 (line 1686) recommends growing the vocabulary by host release rather than accelerating islands — which makes each vocabulary hole a host release cycle of contributor pain. These two holes will be hit by the first third-party panel, not the tenth.
**Proposed direction:** Add `code` (monospace block, copy affordance) and `list` to v1; extend `table` rows to accept `string | badge | link` cells (host-rendered, still closed). Merge the tone scales. Each is a one-release vocabulary addition consistent with the OF-5 recommendation.

### [SEVERITY: major] Contributor walkthrough dead-ends at data: §7 never shows how a panel gets its own runtime state
**Anchor:** §7, lines 1478-1484 — `DevToolsPanelContext` carries only `data?: unknown` with "full shape owned by *Data plane*"; §11.5, line 2852 — "Worked **first-party** examples"; the actual mechanism, §8 D-6.4 `DevToolsProcedureReference` (lines 1860-1871), is never signposted from §7
**Finding:** Walk the plugin author's path from the RFC alone: they write a `DevToolsPanelContribution`, pick a zone — the only viable one for their own state is `plugin.detail`, and that guidance exists nowhere — then hit `render(ctx)`. Their runtime state isn't in the host-typed `PluginDetailData`, and §7 gives no hint that the answer is declaring a `<pluginId>:`-prefixed read procedure via `DevToolsProcedureReference` three sections later. Then: no third-party worked example exists (§11.5 is eight first-party seams), and the manifest pointer is `.strict()`-gated behind a schema-evolution slice stated as drift D-6, not in the author path. The dev loop itself is fine (content edits HMR, contribution-set changes command-triggered — §10 D-4) — the hole is purely discoverability of the data story.
**Why it matters:** "A plugin author wants a panel showing their own runtime state" is *the* contribution use case this RFC exists to enable, and it cannot be completed from the document without reading §8 and inferring the wiring.
**Proposed direction:** One subsection in §7 — "Where a panel's data comes from" — naming `DevToolsProcedureReference`, recommending `plugin.detail` as the default zone for third-party state, and one worked third-party example (a cache plugin's stats panel) alongside §11.5's first-party eight.

### [SEVERITY: minor] The two most common DevTools sessions have no shell-level state: app down, and stale generated host
**Anchor:** §5, line 654 — `<projectRoot>/.netscript/devtools/ # CLI-generated, CLI-owned`; §10 D-4, line 2458 — contribution-set changes are command-triggered; §11.7 — the only acknowledgement is the plugins row's "requires running app" (line 3002)
**Finding:** (a) The single most likely reason to open DevTools is that the app won't boot — and with the app down, every data edge fails simultaneously, rendering N independent failure cards instead of one shell-level "cannot reach the app at `<origin>` (source: `<source>`)" state. (b) The host is generated userland regenerated only by command, so "host generated by an older CLI" is a guaranteed recurring condition with no surface anywhere — `/generated/` tracks registry drift, not the host's own skew.
**Why it matters:** In the app-down case the answer to "what is broken?" exists (every panel names the failed endpoint) but the developer must assemble it from a wall of redundant failure cards; in the stale-host case, panels silently render against an old contract.
**Proposed direction:** Add a shell-level connectivity banner state to §11.7's shared contracts, and a host-generation-age chip on Home (same "never generated" chip pattern, one level up).

### [SEVERITY: minor] §5's generated route listing contradicts §11's tree — it promises a Traces surface §11.1 killed
**Anchor:** §5 H-2, line 661 — `routes/ _layout.tsx index.tsx traces/ runtime/ contracts/`; vs §11.3 lines 2780-2808 (no `traces/`; `plugins/`, `generated/`, `automation/`, `flows/` absent from H-2's sketch); §11.1 line 2714 killed the raw trace renderer
**Finding:** A reader building their mental nav model from §5 expects a top-level Traces surface — the exact surface the killed-surfaces list forbids — and never sees three of the six real segments.
**Why it matters:** The two normative sections disagree about the top-level navigation; whichever an implementer believes, one section's readers build the wrong tree.
**Proposed direction:** Correct H-2's sketch to mirror §11.3 verbatim, or replace it with a pointer to §11.3 as the single authority.

### [SEVERITY: minor] `/automation/` is the one filler segment — a permanent placeholder holding a top-level nav seat
**Anchor:** §11.3, decision 3, lines 2837-2838 — "`/automation/` exists from day one as a staged placeholder"; OF-IA-4, line 3013
**Finding:** Q2's "could you paste this tree into another framework" test: no — `runtime/`, `contracts/`, `generated/`, `flows/` are genuinely NetScript-seamed. The exception is `/automation/`, which until #1446's contracts land renders one card naming an RFC. That is documentation wearing a nav seat; a top-level segment that always says "nothing here yet" trains developers to stop scanning the nav.
**Why it matters:** Nav trust is cumulative; one dead seat devalues the other six.
**Proposed direction:** Keep the URL (the boundary documentation is valuable) but render it in nav with a visible "staged" marker, or omit it from nav until the first contract lands and let the placeholder live at the known URL.

### [SEVERITY: minor] No density contract: unbounded histories, string tables, no sort/filter/pagination story
**Anchor:** §7, line 1494 (table definition is the only dense element); §11.5, line 2861 — "Firing history across 8 trigger kinds"; §11.2, line 2755 — Aspire's own store caps at 10,000 entries
**Finding:** Diagnostic surfaces live on scan-ability, and neither the vocabulary nor the matrix says anything about row caps, pagination, sort, or filter for the surfaces whose rows grow unboundedly (firings, deliveries, executions). The prior-art eviction evidence (Aspire's 10k shared cap) shows the RFC knows these tables get large.
**Why it matters:** A 4,000-row firing history rendered as a flat string table is unusable precisely when the developer needs it — during a misfire storm.
**Proposed direction:** Add one density line to §11.7's shared contracts: default row caps with explicit "showing N of M" affordances; sort/filter can be deferred, the disclosure cannot.

## Strongest UX decision

The thing not to break while fixing the rest is the **honesty architecture**: the decision that every degradation is *labelled and cited* rather than silent — `degraded` carrying a `citation` to its debt entry, incompatible cards that are "never silently dropped", deep-links typed as `{ ok: false, reason }` values so a missing base renders a disabled affordance naming the missing setting instead of a 404, and the refusal to ever emit a `?filters=` link the product cannot honor. The polarity inversion behind it — loud because the operator *is* the author — is the one choice that makes this a developer tool rather than a demo dashboard, and it is applied with unusual consistency across §7, §11.6, and §11.7. Most of my findings (all-clear state, staleness arm, unavailable mapping) are extensions of this principle to places it hasn't yet reached — the fix direction is *more* of this decision, not less.

## Verdict line
UX-FINDINGS: 1 critical, 5 major, 5 minor

UX-REVIEW-COMPLETE
