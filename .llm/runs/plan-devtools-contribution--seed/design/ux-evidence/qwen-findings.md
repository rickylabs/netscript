[0m
> build · qwen/qwen3.8-max
[0m
[0m→ [0mSkill "netscript-harness"
[0m→ [0mSkill "design"
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m→ [0mSkill "netscript-doctrine"
[0m→ [0mSkill "fresh-ui-horizontal"
[0m
[0m$ [0mrtk ls /home/codex/repos/ns-devtools-d2-qwen 2>/dev/null || ls /home/codex/repos/ns-devtools-d2-qwen
.agents/
.claude/
.github/
.llm/
.openhands/
.zed/
docs/
ops/
packages/
plugins/
resources/
rfcs/
skills/
tools/
.gitattributes  779B
.gitignore  902B
.gitleaks.toml  100B
AGENTS-handoff.md  2.2K
AGENTS.md  12.5K
CLAUDE.md  3.0K
CODE_OF_CONDUCT.md  5.6K
CONTRIBUTING.md  6.8K
GOVERNANCE.md  1.3K
LICENSE  11.1K
NOTICE  269B
README.md  27.5K
ROLLOUT.md  8.5K
SECURITY.md  2.1K
SUPPORT.md  1.4K
deno.json  17.6K
deno.lock  156.5K
jsr-package-settings.json  2.0K
notes.md  5.8K
[0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m
[0m# [0mTodos
[•] Read RFC-0002 fully (all 15 sections)
[ ] Read run context: research.md, plan.md, drift.md, decision-brief.md
[ ] Read all 8 design packs T{1,2,3,5,6,7,8,9}
[ ] Read prior RFCs: #890 run dir, RFC-0001, RFC-A
[ ] Verify RFC claims against actual codebase (routes, seams, Aspire, Scalar, oRPC)
[ ] Adversarial analysis on 8 attack vectors
[ ] Write findings with anchors + verdict line
[0m
[0m$ [0mrtk ls -la /home/codex/repos/ns-devtools-d2-qwen/docs/architecture/rfc/ && wc -l /home/codex/repos/ns-devtools-d2-qwen/docs/architecture/rfc/*.md
444  rfc-0002-devtools-contribution.md  297.4K
3705 /home/codex/repos/ns-devtools-d2-qwen/docs/architecture/rfc/rfc-0002-devtools-contribution.md
[0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m
[0m$ [0mgrep -n "^#\{1,3\} " /home/codex/repos/ns-devtools-d2-qwen/docs/architecture/rfc/rfc-0002-devtools-contribution.md | head -120
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
[0m→ [0mRead docs/architecture/rfc/rfc-0002-devtools-contribution.md[90m [limit=450][0m
[0m→ [0mRead docs/architecture/rfc/rfc-0002-devtools-contribution.md[90m [offset=450, limit=600][0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m→ [0mRead docs/architecture/rfc/rfc-0002-devtools-contribution.md[90m [limit=650, offset=1050][0m
[0m→ [0mRead docs/architecture/rfc/rfc-0002-devtools-contribution.md[90m [limit=700, offset=1700][0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m→ [0mRead docs/architecture/rfc/rfc-0002-devtools-contribution.md[90m [limit=700, offset=2282][0m
[0m
[0m✗ [0mInvalid Tool
The arguments provided to the tool are invalid: Model tried to call unavailable tool 'unknown'. Available tools: bash, edit, glob, grep, invalid, read, skill, task, todowrite, webfetch, write.
[0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m→ [0mRead docs/architecture/rfc/rfc-0002-devtools-contribution.md[90m [offset=2951][0m
[0m→ [0mRead docs/architecture/rfc/rfc-0002-devtools-contribution.md[90m [offset=3448][0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m
[0m# [0mTodos
[✓] Read RFC-0002 fully (all 15 sections)
[•] Read run context: research.md, plan.md, drift.md, decision-brief.md
[ ] Read all 8 design packs T{1,2,3,5,6,7,8,9}
[ ] Read prior RFCs: #890 run dir, RFC-0001, RFC-A
[ ] Verify RFC claims against actual codebase (routes, seams, Aspire, Scalar, oRPC)
[ ] Adversarial analysis on 8 attack vectors
[ ] Write findings with anchors + verdict line
[0m
[0m$ [0mls -la /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/ && ls /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/
total 240
drwxrwxr-x   8 codex codex  4096 Aug 11 13:42 .
drwxrwxr-x 266 codex codex 20480 Aug 11 13:42 ..
-rw-rw-r--   1 codex codex  1814 Aug 11 13:42 RFC-AUTHORITY.md
-rw-rw-r--   1 codex codex 12956 Aug 11 13:42 adversarial-sonnet.md
-rw-rw-r--   1 codex codex  6842 Aug 11 13:42 adversarial-triage.md
-rw-rw-r--   1 codex codex  5106 Aug 11 13:42 context-pack.md
-rw-rw-r--   1 codex codex  8336 Aug 11 13:42 decision-brief.md
drwxrwxr-x  11 codex codex  4096 Aug 11 13:42 design
-rw-rw-r--   1 codex codex 25880 Aug 11 13:42 drift.md
drwxrwxr-x   4 codex codex  4096 Aug 11 13:42 filing
-rw-rw-r--   1 codex codex  8642 Aug 11 13:42 phase-registry.md
-rw-rw-r--   1 codex codex  4893 Aug 11 13:42 plan-eval-brief.md
-rw-rw-r--   1 codex codex 13422 Aug 11 13:42 plan-eval.md
-rw-rw-r--   1 codex codex 23397 Aug 11 13:42 plan.md
drwxrwxr-x   2 codex codex  4096 Aug 11 13:42 planeval
drwxrwxr-x   2 codex codex  4096 Aug 11 13:42 planeval-c2
drwxrwxr-x   3 codex codex  4096 Aug 11 13:42 research
-rw-rw-r--   1 codex codex 18144 Aug 11 13:42 research.md
-rw-rw-r--   1 codex codex  8504 Aug 11 13:42 supervisor.md
drwxrwxr-x   2 codex codex  4096 Aug 11 13:42 workflows
-rw-rw-r--   1 codex codex 17545 Aug 11 13:42 worklog.md
T1-host-shape
T2-contribution-family
T3-contribution-kinds
T5-data-plane
T6-trust-model
T7-build-dev
T8-ia-and-staging
T9-supersession
ux-evidence
[0m
Full RFC read. Now the run context and design packs.
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m→ [0mRead .llm/runs/plan-devtools-contribution--seed/drift.md
[0m→ [0mRead .llm/runs/plan-devtools-contribution--seed/research.md
[0m→ [0mRead .llm/runs/plan-devtools-contribution--seed/decision-brief.md
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m→ [0mRead .llm/runs/plan-devtools-contribution--seed/adversarial-sonnet.md
[0m→ [0mRead .llm/runs/plan-devtools-contribution--seed/adversarial-triage.md
[0m
[0m$ [0mfind /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design -type f | sort && echo '---' && wc -l /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/*/*.md 2>/dev/null | tail -40
/home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T1-host-shape/proposal.md
/home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T2-contribution-family/proposal.md
/home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T3-contribution-kinds/proposal.md
/home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T5-data-plane/proposal.md
/home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T6-trust-model/proposal.md
/home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T7-build-dev/proposal.md
/home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T8-ia-and-staging/proposal.md
/home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T9-supersession/supersession-map.md
/home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/ux-evidence/glm-attempt-1-FAILED.jsonl
/home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/ux-evidence/glm-attempt-2-FAILED.jsonl
/home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/ux-evidence/glm-prompt.md
---
   247 /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T1-host-shape/proposal.md
   426 /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T2-contribution-family/proposal.md
   304 /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T3-contribution-kinds/proposal.md
   420 /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T5-data-plane/proposal.md
   195 /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T6-trust-model/proposal.md
   407 /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T7-build-dev/proposal.md
   305 /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T8-ia-and-staging/proposal.md
   302 /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T9-supersession/supersession-map.md
    79 /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/ux-evidence/glm-prompt.md
  2685 total
[0m
Now the eight design packs. Let me survey them first.
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m→ [0mRead .llm/runs/plan-devtools-contribution--seed/design/T8-ia-and-staging/proposal.md
[0m→ [0mRead .llm/runs/plan-devtools-contribution--seed/design/T3-contribution-kinds/proposal.md
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m→ [0mRead .llm/runs/plan-devtools-contribution--seed/design/T2-contribution-family/proposal.md
Now the remaining packs — T2 (family) and T5 (data plane) first, then T1/T6/T7/T9.
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m→ [0mRead .llm/runs/plan-devtools-contribution--seed/design/T5-data-plane/proposal.md[90m [limit=200][0m
[0m→ [0mRead .llm/runs/plan-devtools-contribution--seed/design/T6-trust-model/proposal.md
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m→ [0mRead .llm/runs/plan-devtools-contribution--seed/design/T1-host-shape/proposal.md[90m [limit=130][0m
[0m→ [0mRead .llm/runs/plan-devtools-contribution--seed/design/T7-build-dev/proposal.md[90m [limit=120][0m
[0m
[0m$ [0mwc -l /home/codex/repos/ns-rfc-runtime-versioned-automation/docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md /home/codex/repos/ns-rfc-sdk-client/rfcs/0000-sdk-client-contributions.md 2>/dev/null; grep -n "P-6\|two distinct hosts\|DevTools" /home/codex/repos/ns-rfc-runtime-versioned-automation/docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md | head -40
848 /home/codex/repos/ns-rfc-runtime-versioned-automation/docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md
  1611 /home/codex/repos/ns-rfc-sdk-client/rfcs/0000-sdk-client-contributions.md
  2459 total
491:**Decision: production operator management and developer diagnostics are two distinct hosts and two
499:CLI's fresh-ui commands); (3) deferred Vite plugin contribution; (4) a first-class **DevTools
514:**Surface 2 — developer DevTools (staged behind P-6, NOT built by this RFC).** Runtime diagnostics,
516:affordances belong to a dedicated **DevTools contribution family/host** that #890 did not ratify.
519:**evidence, not a ratified DevTools architecture**. A new dedicated **DevTools RFC** (§11 P-6)
523:views; building them on the app family would pre-empt the DevTools architecture.
527:(roadmap §12 edges; P-6 for surface 2).
638:| P-6 | **DevTools RFC** (D-9): first-class DevTools contribution family/host for runtime diagnostics, live definitions/state, execution journeys, dev management affordances — re-evaluates epic #400 (+ #685 / draft PR #780 / older #506 as evidence, not ratified architecture) | #890 ratified the userland app family only; a DevTools host is a distinct surface this RFC must not design (§8.2 surface 2); it consumes this RFC's stable management/observability contracts                                                       | after A2b (management contract), A3b (history), A2d (convergence) land            |
668:| A7 **FE** | `plugins/automation/frontend/`: **production/admin automation console only** (§8.2 surface 1): list/detail/run/history + draft/validate/activate/rollback flows via the #890 `app` family + #934 gateway; extends #933's workers dogfood surface; deliberately NO diagnostics/journey views (those are §8.2 surface 2, staged behind the P-6 DevTools RFC) | S F R C P + #890 design gates                                                            | A2b, A2d, A3b, A4b, A5b, **#923–#932 + #934** |
670:| P-1..P-6  | Prerequisite RFCs / staged extensions (§11)                                                                                                                                                                                                                                                                                                                | —                                                                                        | as stated in §11                              |
[0m
Now the prior RFCs. RFC-0001's P-6 and decision sentence first.
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m→ [0mRead /home/codex/repos/ns-rfc-runtime-versioned-automation/docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md[90m [limit=70, offset=480][0m
[0m→ [0mRead /home/codex/repos/ns-rfc-runtime-versioned-automation/docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md[90m [limit=50, offset=615][0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m
[0m$ [0mgrep -n "separate named extension axes\|MessagePort\|devtool\|DevTools" /home/codex/repos/ns-rfc-sdk-client/rfcs/0000-sdk-client-contributions.md | head -30
985:RFC-A version 1 is an HTTP request-header axis. `@netscript/sdk/desktop` uses an oRPC MessagePort
994:headers over MessagePort. Auth-core and desktop docs MUST state this. If a desktop native host later
997:A future MessagePort contribution/capability seam requires a separate RFC and cannot reuse
998:`headerKeys` as if MessagePort had headers.
1183:different. UI contributions and SDK request contributions are separate named extension axes, not one
1307:- prove Fresh and Desktop MessagePort serializer parity, including browser/native framing;
1356:  MessagePort calls remain unchanged; and
1415:- the HTTP-only contribution boundary for Desktop MessagePort clients and the required rejection
[0m
[0m→ [0mRead /home/codex/repos/ns-rfc-sdk-client/rfcs/0000-sdk-client-contributions.md[90m [limit=60, offset=1150][0m
[0m
[0m✗ [0mInvalid Tool
The arguments provided to the tool are invalid: Model tried to call unavailable tool 'unknown'. Available tools: bash, edit, glob, grep, invalid, read, skill, task, todowrite, webfetch, write.
[0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m
[0m$ [0mls /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-frontend-contrib--seed/design/canonical/ 2>/dev/null && sed -n '80,115p' /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-frontend-contrib--seed/design/canonical/01-contracts.md
00-overview.md
01-contracts.md
02-authoring-dx.md
03-discovery-and-registry.md
04-host-runtime.md
05-scaffolding-and-cli.md
06-doctrine-fit.md
export interface FamilyRef { readonly family: string; readonly major: number }
```

- The **`app` family, major 1** is this document's payload schema (the five kinds below).
- The dashboard family is `{ family: 'dashboard', major: 1 }` — its own payload schema in
  `plugin-dashboard-core`, its own kinds, validated by hosts that register it. It *extends
  nothing at the schema level*; it shares the envelope, discovery pipeline, identity model, and
  host-surface negotiation. (This replaces the rev-1 "widened union" story, which was unsound.)
- **Evolution rules:** new optional field on an existing kind = minor (validators must ignore
  unknown fields — schemas are `.passthrough()` at the payload boundary); new kind or new
  discriminant = **new major** of that family; hosts declare supported `(family, major)` windows
  in their `HostSurfaceDescriptor` and quarantine outside the window. Old-host/new-plugin and
  new-host/old-plugin negotiation each get a contract test.

The envelope also carries the plugin's declared **budgets** (K-9) — asserted by the test kit,
surfaced by the doctor:

```ts
export interface FrontendBudgets {
  readonly initialJsKb?: number;
  readonly asyncChunks?: number;
  readonly cssKb?: number;
  readonly islands?: number;
  readonly zoneRenderMs?: number;
  readonly resolverMs?: number;
}
// FrontendManifestEnvelope gains: readonly budgets?: FrontendBudgets;
```

**Multi-family export form (pinned — K-16):** a plugin's `./frontend` export is one envelope or
a plain array of envelopes, one `defineFrontend` call each:

```ts
export default [defineFrontend(appDefinition), defineFrontend(dashboardDefinition)];
```
[0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m
[0m$ [0msed -n '330,350p' /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-frontend-contrib--seed/design/canonical/01-contracts.md && echo '=====03=====' && sed -n '40,100p' /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-frontend-contrib--seed/design/canonical/03-discovery-and-registry.md
collisions per the **full rules** in `03-discovery-and-registry.md §3` (route-pattern overlap,
  reserved paths, host basePath composition — not string equality); module refs present in the
  package export map.
- Quarantine (render-time) is reserved for contract-window mismatch and load failure — never for
  known-but-unmounted surfaces.

## The pointer — pure pointer, contract derived (K-10)

`@netscript/plugin` learns only `FrontendContributionRef = { export, framework: 'fresh' }`
(builder `.withFrontend()`, installer-manifest `frontend` block, parse-only). The family/major
handshake lives **once**, in the `./frontend` module's envelope; the registry derives it at
generate time, and `plugin doctor`'s frontend check prints both values if a cached/stale copy
ever disagrees — no second source of truth to drift (K-10).
`PLUGIN_MANIFEST_SCHEMA_VERSION` bumps additively; older CLIs ignore the block — and because the
older *host* also lacks the frontend generate step, ignoring is safe (no half-wired state).
=====03=====

Route loaders are **literal** (S-2):

```ts
// frontend.registry.ts (excerpt) — AUTO-GENERATED, DO NOT EDIT
import { normalizeFreshRouteModule } from '@netscript/fresh/plugins';
export const routes_crons = [
  {
    id: 'calendar',
    path: '/calendar',
    load: () => import('@acme/plugin-crons/frontend/routes/calendar').then(normalizeFreshRouteModule),
  },
] as const;
```

CSS: dependency `@import` is the primary mechanism; the copy fallback must rewrite relative
`url()` assets (S-12) — copied CSS is a transformed artifact, not equivalent bytes.

## 3. Resolution rules (generate-time, structured errors)

Deterministic order everywhere (plugins by mountId, contributions by (`order`, mountId, id)).

| Check | Failure mode |
| --- | --- |
| pluginKind ≠ owning plugin / packageName mismatch | error naming both |
| **Base/route collisions — full rules (S-20)**: route-*pattern* overlap across plugins (not string equality), reserved host paths (`/_fresh`, `/api`, gateway prefix, host `config.basePath` composition), nested/dynamic precedence conflicts | error with the colliding patterns + remap hint |
| nav `target.routeId` unknown | error |
| zone id not in the target host's `HostSurfaceDescriptor` | **unknown zone** → error (typo) |
| zone known to the contract family but absent from this host | **known-but-unmounted** → info diagnostic; contribution skipped, NOT quarantined (S-10) |
| zone capacity exceeded | deterministic overflow report naming winners/losers |
| duplicate contribution id within (plugin, family) | error |
| `(family, major)` outside the host's declared window | **quarantine** entry (fix-CLI render state), never a host crash |
| module ref absent from the package export map | error + `plugin dev`/`generate frontend` hint |
| route `path` params ≠ module filename params (`:id` vs `[id].tsx` — K-11) | error naming both syntaxes |

## 4. Install / update / remove lifecycle (S-11)

- **`netscript plugin install`** — post-scaffold wiring gains: regenerate the full replace-set →
  staged `deno check` (incl. `frontend.check.ts`) → atomic swap. A type-broken contribution
  fails install with the real diagnostic.
- **`netscript plugin update`** — same regeneration; contract drift surfaces via doctor + the
  quarantine state, remediation CLI printed.
- **`netscript plugin remove`** (the actual verb —
  `packages/cli/src/public/features/plugins/remove/remove-plugin-command.ts:39-69`; rev 1 said
  "uninstall") — regeneration emits the deterministic empty set for departed plugins, so
  registry/css/island imports can never dangle. Scaffolded **starter** files are app-owned and
  survive removal by design; each starter lands with a provenance header comment naming the
  generating plugin+resource so `plugin doctor` can report orphaned starters without ever
  deleting them.
- **`netscript plugin doctor`** — `frontend` check: envelope/window handshake, zone validity vs
  the host descriptor, export-map presence, **orphan/stale generated-output detection** (a
  registry entry with no installed plugin, a css import with no file, a starter whose plugin is
  gone). The doctor prints the **five-state diagnosis taxonomy verbatim** (unknown zone /
  known-but-unmounted / capacity-rejected / window-mismatch quarantine / load-failure
  quarantine), and every quarantine render card deep-links the doctor command — the taxonomy is
  product surface, not internal vocabulary (K-17).
- Generation is idempotent (byte-identical skip) and **transactional**: stage → check → swap or
  rollback; a failed generation leaves the previous set untouched.

## 5. Gates carried from the ratified dashboard design (unchanged)
[0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m
[0m$ [0mrtk grep -rn "triggerKind\|TriggerKind" /home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src --include=*.ts | head -10; echo '---streams contracts---'; ls /home/codex/repos/ns-devtools-d2-qwen/plugins/streams/ 2>/dev/null; ls /home/codex/repos/ns-devtools-d2-qwen/plugins/streams/src 2>/dev/null | head
/home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src/domain/constants.ts:108:export type TriggerKind = TriggerKnownKind | (string & { readonly __triggerKind?: never });
/home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src/domain/trigger-definition.ts:1:import type { TriggerDurabilityTier, TriggerKind } from './constants.ts';
/home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src/domain/trigger-definition.ts:20:  TKind extends TriggerKind,
/home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src/domain/errors.ts:59:  static kindNotImplemented(kind: string): TriggerKindNotImplementedError {
/home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src/domain/errors.ts:60:    return new TriggerKindNotImplementedError(kind);
/home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src/domain/errors.ts:120:export class TriggerKindNotImplementedError extends TriggersError {
/home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src/domain/errors.ts:130:    this.name = 'TriggerKindNotImplementedError';
/home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src/domain/mod.ts:25:  TriggerKindNotImplementedError,
/home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src/domain/mod.ts:33:  TriggerKind,
/home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src/domain/trigger-event.ts:1:import type { TriggerEventStatus, TriggerKind } from './constants.ts';
---streams contracts---
README.md
cli.ts
deno.json
mod.ts
package.json
scaffold.plugin.json
scaffold.ts
services
src
tests
verify-plugin.ts
adapter
aspire
cli
e2e
package-metadata.generated.ts
public
[0m
[0m$ [0mgrep -rn "sse" /home/codex/repos/ns-devtools-d2-qwen/packages/fresh/deno.json | head -5; echo '---query export---'; grep -n "query" /home/codex/repos/ns-devtools-d2-qwen/packages/fresh/deno.json | head -5
34:    "@std/assert": "jsr:@std/assert@^1",
47:    "@netscript/plugin-streams-core/sse": "jsr:@netscript/plugin-streams-core@0.0.5/sse",
---query export---
18:    "./query": "./src/application/query/mod.ts",
25:    "check": "deno check --unstable-kv ./mod.ts ./src/runtime/server/mod.ts ./src/runtime/desktop/mod.ts ./src/application/builders/mod.ts ./src/application/route/mod.ts ./src/application/query/mod.ts ./src/application/vite/vite.ts ./src/runtime/interactive/mod.ts ./src/application/defer/mod.ts ./src/application/form/mod.ts ./src/diagnostics/error/mod.ts ./src/runtime/streams/mod.ts ./src/runtime/ai/mod.ts ./src/runtime/ai/sandbox.ts ./src/testing/mod.ts ./tests/type-fixtures/desktop-consumer_type.ts && deno task check:streams-types",
27:    "doc-lint": "deno doc --lint ./mod.ts ./src/runtime/server/mod.ts ./src/runtime/desktop/mod.ts ./src/application/builders/mod.ts ./src/application/route/mod.ts ./src/application/defer/mod.ts ./src/application/form/mod.ts ./src/diagnostics/error/mod.ts ./src/runtime/streams/mod.ts ./src/runtime/ai/mod.ts ./src/runtime/ai/sandbox.ts ./src/application/query/mod.ts ./src/runtime/interactive/mod.ts ./src/application/vite/vite.ts ./src/testing/mod.ts",
53:    "@tanstack/preact-query": "npm:@tanstack/preact-query@^5.101.0",
54:    "@tanstack/query-core": "npm:@tanstack/query-core@^5.101.0",
[0m
Prior RFCs check out. Now verify load-bearing claims against the actual codebase.
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m
[0m$ [0msed -n '90,115p' /home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src/domain/constants.ts; echo '---sse export check---'; grep -n "sse\|SSE" /home/codex/repos/ns-devtools-d2-qwen/packages/fresh/src/runtime/server/mod.ts | head; echo '---streams core contracts---'; ls /home/codex/repos/ns-devtools-d2-qwen/packages/plugin-streams-core/ 2>/dev/null && grep -rn "contracts" /home/codex/repos/ns-devtools-d2-qwen/packages/plugin-streams-core/deno.json 2>/dev/null | head -3
'TRIGGER_UNSUPPORTED_OPERATION',
  'TRIGGER_RETRYABLE',
  'TRIGGER_NON_RETRYABLE',
];

/** Trigger durability tier. */
export type TriggerDurabilityTier = (typeof TRIGGER_DURABILITY_TIERS)[number];

/** Trigger kind implemented by the Group F T1 runtime. */
export type TriggerRuntimeKind = (typeof TRIGGER_RUNTIME_KINDS)[number];

/** Trigger kind reserved for a later runtime group. */
export type TriggerReservedKind = (typeof TRIGGER_RESERVED_KINDS)[number];

/** Canonical known trigger kind. */
export type TriggerKnownKind = (typeof TRIGGER_KINDS)[number];

/** Open trigger discriminator. */
export type TriggerKind = TriggerKnownKind | (string & { readonly __triggerKind?: never });

/** Trigger event lifecycle status. */
export type TriggerEventStatus = (typeof TRIGGER_EVENT_STATUSES)[number];

/** Triggers error code. */
export type TriggersErrorCode = (typeof TRIGGERS_ERROR_CODES)[number];
---sse export check---
---streams core contracts---
README.md
deno.json
mod.ts
package.json
src
tests
[0m
[0m$ [0msed -n '1,89p' /home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src/domain/constants.ts | grep -n "TRIGGER_KINDS\|TRIGGER_RUNTIME_KINDS\|TRIGGER_RESERVED_KINDS" ; grep -n -A 15 "TRIGGER_KINDS = \[" /home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src/domain/constants.ts | head -30
5:export const TRIGGER_RUNTIME_KINDS: readonly ['webhook', 'file-watch', 'scheduled'] = [
12:export const TRIGGER_RESERVED_KINDS: readonly ['queue', 'stream', 'manual'] = [
19:export const TRIGGER_KINDS: readonly [
27:  ...TRIGGER_RUNTIME_KINDS,
28:  ...TRIGGER_RESERVED_KINDS,
[0m
[0m✗ [0mInvalid Tool
The arguments provided to the tool are invalid: Model tried to call unavailable tool 'unknown'. Available tools: bash, edit, glob, grep, invalid, read, skill, task, todowrite, webfetch, write.
[0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m
[0m$ [0msed -n '1,40p' /home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src/domain/constants.ts
/** Durability tiers supported by trigger definitions. */
export const TRIGGER_DURABILITY_TIERS: readonly ['t1', 't2', 't3'] = ['t1', 't2', 't3'];

/** Trigger kinds implemented by the Group F T1 runtime. */
export const TRIGGER_RUNTIME_KINDS: readonly ['webhook', 'file-watch', 'scheduled'] = [
  'webhook',
  'file-watch',
  'scheduled',
];

/** Trigger kinds reserved on the public surface but deferred at runtime. */
export const TRIGGER_RESERVED_KINDS: readonly ['queue', 'stream', 'manual'] = [
  'queue',
  'stream',
  'manual',
];

/** Canonical trigger kinds known by Group F. */
export const TRIGGER_KINDS: readonly [
  'webhook',
  'file-watch',
  'scheduled',
  'queue',
  'stream',
  'manual',
] = [
  ...TRIGGER_RUNTIME_KINDS,
  ...TRIGGER_RESERVED_KINDS,
];

/** Trigger event lifecycle statuses. */
export const TRIGGER_EVENT_STATUSES: readonly [
  'pending',
  'in-flight',
  'deferred',
  'completed',
  'failed',
  'dlq',
] = ['pending', 'in-flight', 'deferred', 'completed', 'failed', 'dlq'];
[0m
[0m✗ [0mInvalid Tool
The arguments provided to the tool are invalid: Model tried to call unavailable tool 'unknown'. Available tools: bash, edit, glob, grep, invalid, read, skill, task, todowrite, webfetch, write.
[0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m
[0m$ [0mrtk grep -rn "'cron'\|\"cron\"" /home/codex/repos/ns-devtools-d2-qwen/packages/plugin-triggers-core/src /home/codex/repos/ns-devtools-d2-qwen/plugins/triggers/src 2>/dev/null | head -5; grep -rn "eight\|8 trigger" /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/research/*.md | head -5
/home/codex/repos/ns-devtools-d2-qwen/plugins/triggers/src/cli/commands.ts:124:        { name: 'cron', description: 'Five-field cron expression.', required: true },
/home/codex/repos/ns-devtools-d2-qwen/plugins/triggers/src/cli/local-runtime-backend.ts:290:    cron: flag(args, 'cron'),
/home/codex/repos/ns-devtools-d2-qwen/plugins/triggers/src/cli/triggers-cli-backend-support.ts:88:    cron: stringProperty(source, 'cron'),
/home/codex/repos/ns-devtools-d2-qwen/plugins/triggers/src/cli/management-commands.ts:34:        { name: 'cron', description: 'Replacement five-field cron expression.' },
/home/codex/repos/ns-devtools-d2-qwen/plugins/triggers/src/adapter/resources/input.ts:139:    cron: stringFlag(args, 'cron'),
/home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/research/b1-dashboard-board.md:111:| **430** | DDX-18c / S9 Triggers console | OPEN | `0.0.15` | `type:feat` `p1` | Firing-history feed across 8 trigger kinds, enable/disable with CLI-equivalent, cron preview; the management-loop reference screen. |
/home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/research/p2-rfc-1446-runtime-automation.md:263:§13's eight acceptance tests (RFC:686-720) cover live add, live update+rollback, trigger wiring,
/home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/research/p2-rfc-1446-runtime-automation.md:395:| P-6 has a defined gate class / acceptance in RFC-0001's roadmap | §12 lists P-6 only in the catch-all row `P-1..P-6 … Gates: —`, and §13's eight acceptance tests contain no DevTools journey (A8 covers "A7 for cockpit journeys") | RFC:670, RFC:686-720, RFC:669 | minor |
[0m
[0m✗ [0mInvalid Tool
The arguments provided to the tool are invalid: Model tried to call unavailable tool 'unknown'. Available tools: bash, edit, glob, grep, invalid, read, skill, task, todowrite, webfetch, write.
[0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m
[0m$ [0mgrep -n "DevToolsPanelId\|DevToolsPanelRef\|version-suffixed" /home/codex/repos/ns-devtools-d2-qwen/docs/architecture/rfc/rfc-0002-devtools-contribution.md
1153:Grafana derived its whole compatibility story from version-suffixed contribution ids
1787:/** `<pluginId>/<panel>/v<major>` — version-suffixed ids, Grafana's compatibility story (m2 F16). */
1790:export type DevToolsPanelRef = { readonly mountId: string; readonly id: string; readonly apiMajor: number };
1807:  readonly panelId: DevToolsPanelId;
1830:  readonly panelId: DevToolsPanelId;
2230:| **T-9** | Identity collision silently swaps a contribution. Baseline: duplicate plugin identity collapses last-writer-wins on a lossy local name (`r3` F9); registry-item collision is silent last-wins at three layers and the winner **flips** under `--force` (`r2` F11). | INV-8 namespaced, version-suffixed ids; duplicate id within a family is a generate-time error (`m2` F13/F16/F22). | Shipped defect. **UNPROVEN** until **G-9**. |
2969:| **Incompatible** | A contribution whose version-suffixed id falls outside the host's supported window renders a labelled card (id, declared major, host window) in place of the panel. **Never silently dropped** — a deliberate departure from every surveyed system, where bad-target failures are quiet (`m3` X-2); see **OF-IA-2**. |
3412:| A-6 | **Namespaced, version-suffixed contribution ids** (`@netscript/workers/panel/v1`) | `m2` F13, F16 (`sources/grafana/src_errors.ts:1-7`) | One string convention buys a breaking-change protocol later without a coordinated big-bang |
[0m
[0m$ [0mgrep -n "wiring home\|ranked problem\|problem feed" /home/codex/repos/ns-devtools-d2-qwen/docs/architecture/rfc/rfc-0002-devtools-contribution.md
2782:                                         second. Ranked problem feed across every seam:
2812:  H["&lt;base&gt;/ — wiring home"] --> R["/runtime/*"]
[0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m
[0m$ [0msed -n '275,286p' /home/codex/repos/ns-devtools-d2-qwen/packages/cli/src/kernel/application/ui/registry.ts; echo '---spawn flags---'; sed -n '410,420p' /home/codex/repos/ns-devtools-d2-qwen/packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts
}

function resolveTarget(projectRoot: string, target: string): string {
  for (const [prefix, directory] of TARGET_PREFIXES) {
    if (target.startsWith(prefix)) {
      return resolve(projectRoot, directory, target.slice(prefix.length));
    }
  }
  return isAbsolute(target) ? target : resolve(projectRoot, target);
}

function isTypeScriptLike(path: string): boolean {
---spawn flags---
      ? new URL(options.generator.command, options.generatorBase).href
      : join(options.generatorBase, options.generator.command);
    const result = await options.dependencies.process.exec('deno', [
      'run',
      '--config',
      join(options.projectRoot, 'deno.json'),
      '--allow-read',
      '--allow-write',
      generatorUrl,
      '--project-root',
      options.projectRoot,
[0m
[0m$ [0mrtk grep -rn "jsr:" /home/codex/repos/ns-devtools-d2-qwen/packages/cli/src/public/features/plugins/install/install-plugin.ts 2>/dev/null | head -8
335:    spec.trim().startsWith('jsr:');
364:  return `jsr:${descriptor.package.packageSpecifier}@${descriptor.version}`;
[0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m
[0m$ [0mgrep -n "export function createSSEStream\|export function createKvWatchSSE\|export function createKvPrefixWatchSSE\|export class SSEController" /home/codex/repos/ns-devtools-d2-qwen/packages/fresh/src/runtime/server/sse.ts; echo '---importers---'; rtk grep -rln "runtime/server/sse" /home/codex/repos/ns-devtools-d2-qwen/packages /home/codex/repos/ns-devtools-d2-qwen/plugins 2>/dev/null | head
148:export function createSSEStream(
339:export function createKvWatchSSE<T = unknown>(
416:export function createKvPrefixWatchSSE<T = unknown>(
---importers---
[0m
[0m$ [0mgrep -rn "oRPC\|orpc" /home/codex/repos/ns-devtools-d2-qwen/plugins/streams/scaffold.plugin.json 2>/dev/null | head -3; echo '---workers runtime registries---'; sed -n '24,55p' /home/codex/repos/ns-devtools-d2-qwen/plugins/workers/scaffold.runtime.json
---workers runtime registries---
  ],
  "runtimeRegistries": [
    {
      "kind": "workers-job",
      "dir": "workers/jobs",
      "registryPath": ".netscript/generated/plugin-workers/job-registry.ts",
      "fileSuffixes": [".ts"],
      "exclude": ["_registry.ts", "job-tools.ts", "mod.ts", "types.ts"],
      "registryKey": "id",
      "varPrefix": "job",
      "typeImport": {
        "name": "JobHandler",
        "from": "@netscript/plugin-workers-core/runtime"
      },
      "mapValueType": "JobHandler<any>",
      "preamble": ["// deno-lint-ignore-file no-explicit-any"],
      "pluginDirs": [
        {
          "dir": "plugins/workers/jobs",
          "importPrefix": "../../plugins/workers/jobs",
          "label": "plugins/workers/jobs/",
          "pluginId": "workers",
          "varPrefix": "workersPlugin",
          "exclude": ["job-tools.ts"]
        },
        {
          "dir": "plugins/triggers/jobs",
          "importPrefix": "../../plugins/triggers/jobs",
          "label": "plugins/triggers/jobs/",
          "pluginId": "triggers",
          "varPrefix": "triggersPlugin",
          "exclude": ["job-tools.ts"]
[0m
Let me verify a few remaining claims — the SSE primitives and the `@netscript/fresh/query` consumer, plus the H-2 `traces/` example.
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m→ [0mRead .llm/runs/plan-devtools-contribution--seed/RFC-AUTHORITY.md
[0m
[0m$ [0mgrep -n "dashboard.*family\|family.*dashboard\|devtools.*family\|rename" /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T9-supersession/supersession-map.md | head -10
35:   to **0.0.1-beta.18**"* — which, after the 0.0.x rename (`00e3b047f`, b1 D5), is today's
57:| PR #685 + `dashboard-design--orchestrator/` corpus | **MERGED** 2026-07-12, label frozen at `status:research`, milestone `0.0.1-beta.10` | **Committed evidence only** | Self-labelled *"analysis only / no product code changed"* (`run-eval.md:3-5`); label never advanced past `status:research`; posted 20 issue comments so its analyses are *referenced from* the board without having *rewritten* it — #427 still describes a single panel member, not the 7-member family (b1 F5; live re-check of PR labels 2026-08-11). Its routing resort and 7-member union are **inputs to re-derive, never citable as ratified** |
84:| 412 | DDX-2 `plugin-dashboard-core` seam | OPEN · 0.0.15 · plan | AMEND *(b1)* | Core package survives; its owned-model set must be re-derived from the RFC's family, not from the 7-member analysis draft (b1 D3) | RFC's contribution-family section (T2/T3 packs) locked |
128:| `.llm/runs/dashboard-design--orchestrator/` (routing resort, `plugin-extension-architecture.md`, coverage-matrix, screen catalog, prototype, prompts) | on `main` (via merged #685) | **KEEP** as committed evidence | Never cite as ratified (authority ledger); the RFC **re-derives** routing and the kind family from it. `analysis/plugin-extension-architecture.md`'s 7-member union and trust tiers are inputs to T2/T3/T6, not decisions (b1 F5, D3) |
146:| #890 / #922 (`0.0.9`) | Pointer axis `.withFrontend()` = manifest learns only `{ export, framework }`; family payload lives in the pointed-to module; dashboard family = sibling payload on the shared envelope | **Merged RFC** — the only owner-visible arbitration layer on this seam (p1 C8; `rfc.md:236-240`) |
[0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
[0m
[0m$ [0mgrep -n "devtools-core\|plugin-dashboard-core" /home/codex/repos/ns-devtools-d2-qwen/.llm/runs/plan-devtools-contribution--seed/design/T9-supersession/supersession-map.md
5:> boundary was later corrected from `A2 plugin-devtools-core` to **A1 `packages/devtools-core` +
84:| 412 | DDX-2 `plugin-dashboard-core` seam | OPEN · 0.0.15 · plan | AMEND *(b1)* | Core package survives; its owned-model set must be re-derived from the RFC's family, not from the 7-member analysis draft (b1 D3) | RFC's contribution-family section (T2/T3 packs) locked |
145:| #427 (DDX-17, `0.0.15`) | `DashboardPanelContribution` in `plugin-dashboard-core/contracts/v1`; `@netscript/plugin` gains **no** dashboard axis (thinness law) | Ratified by the 2026-07-06 rescope (tightened by comment), then re-baselined by merged #890 |
[0m
[0m✗ [0munknown Unknown failed
[91m[1mError: [0mTool execution aborted
Scope note: advisory design evidence on the D-15 substitute route; read-only throughout (RFC, 8 packs, run artifacts, three prior RFCs, and baseline source spot-checks in `/home/codex/repos/ns-devtools-d2-qwen`). Not a Plan-Gate verdict.

### [SEVERITY: critical] The trust antecedent is contradicted by the RFC's own JSR install + in-process import pipeline
**Anchor:** RFC §9 D-1 line 2122 ("A DevTools contribution is a workspace package whose *server* code the developer already runs with full permissions"); §12.4 line 3231 ("Contributions are first-party packages in one workspace, already trusted at the `import` level"); §9 D-5 sandbox row line 2269 ("The antecedent — untrusted third-party code — is absent"); vs §10 D-5 lines 2492-2493 and 2517 (`source = {kind:'jsr', …}`, `load: () => import('jsr:@acme/plugin-trace@1.4.2/devtools/trace-explorer')`); §6 line 1066 ("the generator imports the plugin's pointed-to export in-process"); §5 H-2 line 667 (`deno run -A npm:vite`).
**Finding:** The entire decline table (sandboxing, signing, capability grammars) rests on "no untrusted third-party code," but the RFC's own install model accepts arbitrary JSR packages (`install-plugin.ts:335` confirms the `jsr:` branch at baseline) and its discovery pipeline *imports the pointed-to module in-process* — module top-level code executes inside the CLI process during `plugin install` (install runs the transactional regeneration, §10 D-5) and again inside the `-A` DevTools host at render time. A contribution-only JSR plugin — one that ships no service the developer ever runs — gets full-permission code execution, including network, which is strictly more than the subprocess path the RFC criticizes in D-7 (whose *mitigating* fact is "no `--allow-net`"). Threat rows T-1…T-10 contain no row for generate-time/render-time execution of a contributed module, even though D-1's tier table says the invariants "defend against mistakes and supply-chain drift" (line 2133). The DT0 claim "a panel cannot gain what its own package already has" is false for a package whose only surface *is* the panel.
**Why it matters:** This is the threat that survives the antecedent argument the declines depend on. Ratified as written, the first malicious or merely buggy JSR devtools panel executes at install time with CLI permissions, and the RFC's own security section has no row, gate, or even vocabulary for it.
**Proposed direction:** Add a T-11 row (contribution module executes at generate/render time) with a chosen posture: (a) rule devtools contributions local-path-only until a trust ruling exists; (b) evaluate envelope modules in a permission-scoped subprocess (the seam INV-2 already designs); or (c) declare import-time execution the accepted trust boundary and say so in D-1/D-5, amending "workspace package"/"first-party packages in one workspace" to match §10's actual install model. The signing decline's antecedent ("NetScript has neither [marketplace nor untrusted distribution]") must be re-argued against the JSR channel.

### [SEVERITY: major] Home's "ranked problem feed" is a half-propagated relabel — no ranking rule, no data contract, two of six problem classes uncomputable in v1
**Anchor:** §11.3 lines 2781-2788 ("Ranked problem feed across every seam") vs line 2812 (`H["&lt;base&gt;/ — wiring home"]`), §11.4 Home row line 2844 ("Framework wiring facts — installed plugins, contribution axes, contract coverage, registry freshness"), §11.7 Home row line 2995 (empty = "all wiring facts zero → onboarding card").
**Finding:** The problem-feed redefinition exists only in the §11.3 route-tree prose. The AC-1 record, the state matrix, and the section's own mermaid still describe the wiring home. The feed itself is unspecified: no ranking function exists anywhere (the ordering section governs contributions, not problems); no data-plane procedure aggregates across seams (§8's consume/build table has no such row); and two of the six named problem classes have no v1 data source — "replicas off the current epoch" requires RFC-0001's convergence contract, which §8 D-6.9 (line 2023) stages to v3 behind A2b/A3b/A2d, and "contract-coverage regressions" implies a coverage history no v1 store provides.
**Why it matters:** The top level is the answer to the tool's founding question ("what is broken?"). An implementer of the Home surface gets three contradictory descriptions and no contract for the feed's ranking or availability — the change reads as cosmetic re-labelling of the stats page because, normatively, it still is one.
**Proposed direction:** Propagate the redefinition into §11.4's AC-1 answer (why is a problem feed NetScript-only), §11.7's Home states (feed empty vs zero-problems vs source-unavailable), and the diagram. Specify the ranking (severity → recency is the obvious candidate) and a per-class availability rule (classes whose source is absent render nothing or a "not computable until #1446" chip). Alternatively, state Home ships as wiring facts in v1 with the problem feed staged on the same criteria as `/automation/`.

### [SEVERITY: major] `DevToolsUiNode` cannot express the named v1 flagship: table cells are string-only, so per-row deep links and status badges are unrepresentable
**Anchor:** §7 lines 1490-1497 (vocabulary), specifically line 1494 (`table; rows: readonly (readonly string[])[]`); vs §11.5 Workers row line 2859 ("Per execution → `/traces/detail/{traceId}?spanId=`"); §14 W6-a line 3639 ("Workers console — the first real consumer").
**Finding:** The workers execution console — the RFC's own first consumer, the slice that "proves the family works end to end" — needs per-execution trace deep-links and attempt/status badges *inside table rows*. `table` cells are plain strings; the `link` and `badge` elements cannot appear in a cell. Two further gaps: there is no `code` element, although AC-2 (line 2696, "`netscript …` CodeBlock") and §11.7's empty-state contract (line 2967) make the CLI-equivalent line a normative render for every surface a contributed panel participates in; and the sagas worked example ("from→to transition/compensation timeline as a state machine", line 2860) has no timeline expression. No element earns nothing — the vocabulary is under-expressive, not over-built.
**Why it matters:** The zero-client-code `json-render` tier is the load-bearing claim that "most panels ship no frontend bundle." If consumer #1 outgrows the vocabulary, W6-a either forces a vocabulary growth mid-roadmap (after W4-a froze it) or pushes the first consumer onto the staged island tier — which collapses the v1 sequencing.
**Proposed direction:** Widen `table` cells to `string | DevToolsUiNode` (or a minimal `string | linkRef | badgeRef` union) and add a `code` element before W4-a's contract freeze; gate the widened vocabulary with the W4-a e2e (a panel rendering a linked, badged table row). Record the change under owner fork 5's policy (a) as the vocabulary's first growth, with the sagas timeline as the named next candidate.

### [SEVERITY: major] Zone contract versioning is specified in the descriptor but never applied to the actual vocabulary; zone context types are comment-only `unknown`
**Anchor:** §6 lines 1141-1148 ("Version-suffixed, host-owned id: `'devtools.capability.panel/v1'`. The suffix versions the ZONE's props/context contract independently of the family major") vs §7 lines 1447-1453 (`'workers.console' | …` — no suffix; `'devtools.capability.panel'` matches no zone in the vocabulary); §7 line 1483 (`readonly data?: unknown`, context types named only in comments); quarantine table lines 1244-1250 (no zone-contract-mismatch state).
**Finding:** The mechanism the RFC says it kept from Grafana "exactly where it uniquely earns its place" — versioning a zone's props/context contract — does not exist in the shipped vocabulary. Zones carry no suffix, `ctx.data` is `unknown` per-zone, and the five-state taxonomy has no arm for "zone context contract changed under a stable zone id." A host release reshaping `WorkersConsoleData` breaks every second/third-contributor panel targeting `workers.console` with no `window-mismatch`, no `incompatible` card — just render throws. Matching is also undefined: panels target `'workers.console'`, descriptor ids are documented as suffixed, and no strip/match rule is given, so `unknown-zone` detection is ambiguous on its face.
**Why it matters:** This is the compatibility story for the exact axis (host slot contracts) the RFC chose to keep versioned. Under real second/third contributors it fails silently-loud — error cards instead of a structured incompatible state — which is the failure mode the whole quarantine taxonomy exists to prevent.
**Proposed direction:** Either apply the suffix to the real vocabulary (`'workers.console/v1'`), specify anchor/panel matching against suffixed descriptor ids, and add a zone-mismatch quarantine/incompatible state; or delete the version-suffix claim from §6 and state that zone context contracts evolve only with the family major. Both are one-paragraph fixes; the current split is not a design.

### [SEVERITY: major] Two conflicting "fully-qualified" id formats — anchors can never match identity, and multi-instance installs are unaddressable
**Anchor:** §6 line 1146 (anchors: "fully-qualified `'<pluginKind>/<contributionId>'` entries") vs line 998 ("Fully-qualified form: `<mountId>/<id>/v<apiMajor>`"); line 975 (`installationId` "= pluginKind unless multi-instance"); `orderContributions` lines 1187-1199 (`rank.has(item.fullyQualifiedId)`).
**Finding:** The ordering algorithm — the RFC's flagship net-new design, "the one thing no surveyed system solved" — matches `item.fullyQualifiedId` against `zone.anchors`, but the spec defines those two strings in two incompatible formats. If the item form is `<mountId>/<id>/v<apiMajor>` as §6 defines, no anchor of the form `<pluginKind>/<contributionId>` ever matches; any implementer must invent the reconciliation. Additionally, anchors keyed by `pluginKind` cannot distinguish instances of a multi-instance install — a case the identity quartet explicitly supports.
**Why it matters:** Tier-1 anchoring is how the tab strip stays a host product decision. If the matching rule is undefined, the first implementation picks one, and a second contributor's anchored panel silently drops to tier-2 ordering — the exact "arbitrary load order" outcome the design exists to kill.
**Proposed direction:** Define one canonical fully-qualified form, used by both identity and anchors (mountId-based, so instances are addressable), and state whether anchors include the `apiMajor` segment or match across majors. One sentence plus a comment fix in `orderContributions`.

### [SEVERITY: major] The state matrix omits the one state the adopted launcher design requires: backing process not running
**Anchor:** §11.7 `PanelState` union lines 2951-2960 (no `unavailable`/`not-running` arm) vs §7 `PanelAvailability` lines 1466-1476 (`state: 'unavailable'` + launch card) and §12.8 P-7 line 3429 (launcher adopted as "a first-class view state"); §11.7 Plugins row line 3002 handles "no AppHost running" while the Workers/Sagas/Triggers/Streams rows do not.
**Finding:** The most common real condition in a dev loop — developer starts DevTools before the app/AppHost/Aspire — has no surface state. `PanelAvailability.unavailable` exists only as a contributed panel's probe result; host-owned surfaces (all four `/runtime` consoles are host-owned) have no arm for it. `failure` is the wrong semantics (nothing failed), `empty` lies, `degraded` needs data. The matrix already knows this condition is real — the Plugins surface degrades for it ad hoc — but leaves the four runtime surfaces without it, and the P-7 launcher card adopted in §12.8 has no `PanelState` arm to render into.
**Why it matters:** §11.7 is normative ("a surface ships only with all six states specified") and is the SCOPE-frontend checklist (§13.3). A state the launcher design depends on being absent from the normative contract means every runtime surface improvises its own "app not running" UI — the fragmentation the matrix exists to prevent.
**Proposed direction:** Add a shared `not-running` (or `unavailable`) arm to `PanelState` carrying `reason` + `remedy.cliEquivalent` (shown, never executed), with a shared contract row and per-surface deltas naming which process each runtime surface needs; or explicitly state the runtime surfaces inherit the Plugins delta and generalize it.

### [SEVERITY: minor] Identity-unification leftovers: `DevToolsPanelId` is referenced but never defined, and pre-fix "version-suffixed id" wording survives in four normative places
**Anchor:** §8 lines 1787-1790 (comment: "`<pluginId>/<panel>/v<major>` — version-suffixed ids"; defines `DevToolsPanelRef`) vs lines 1807 and 1830 (`readonly panelId: DevToolsPanelId` — no such type is defined anywhere); line 2230 (T-9: "INV-8 namespaced, version-suffixed ids"); line 2969 ("A contribution whose version-suffixed id falls outside the host's supported window"); line 3412 (A-6 adopt row: "`@netscript/workers/panel/v1`").
**Finding:** The stage-F fix that moved the major from the id string into the `apiMajor` field was not propagated to §8's context contracts or to T-9/§11.7/A-6. The host→panel context — the seam this RFC exists to define — references an undefined type, and three normative passages still describe the identity model the RFC explicitly rejected ("as a field, not baked into `id`", line 994).
**Why it matters:** An implementer of W5-a (devtools read contract) cannot type-check §8 against §6; a reviewer checking INV-8's gate against T-9 sees two different identity models.
**Proposed direction:** One editorial pass: define or delete `DevToolsPanelId` (alias to `DevToolsPanelRef`), fix the line-1787 comment, and restate T-9, §11.7's incompatible row, and A-6 in the `(mountId, id, apiMajor)` vocabulary.

### [SEVERITY: minor] §5 H-2's normative example lists a `traces/` host route that §11 drops and AC-1 forbids
**Anchor:** §5 H-2 lines 660-662 (`traces/  runtime/  contracts/`) and line 675 ("`http://127.0.0.1:5199/`, `/traces`, …") vs §11.3 lines 2789-2808 (no `/traces` segment) and §11.2 lines 2736-2737 (Traces list & detail: owner Aspire, `DL? yes`); also line 657 (`vite.config.ts # fresh({ islandSpecifiers }) + createNetScriptVitePlugin`) vs H-3's generated config lines 701-709 (no `createNetScriptVitePlugin`).
**Finding:** The host-shape section is labelled "(normative)" and its example route tree contains a segment the final IA does not have and the ownership table assigns to Aspire — an owned `/traces` surface fails the RFC's own non-duplication line. The `createNetScriptVitePlugin` in the H-2 comment likewise contradicts the H-3 generated config.
**Why it matters:** W3-a builds the CLI-generated host root from this section; a stale example inside normative text is how a killed surface re-enters.
**Proposed direction:** Replace the example tree with §11.3's segments and delete `/traces` from line 675; state whether the devtools host's vite config includes `createNetScriptVitePlugin` at all.

### [SEVERITY: minor] Worked-example fact stale at baseline: "8 trigger kinds" — the canonical set is six
**Anchor:** §11.5 line 2861 ("Firing history across 8 trigger kinds") vs `packages/plugin-triggers-core/src/domain/constants.ts:5-29` at baseline (`TRIGGER_RUNTIME_KINDS` = webhook, file-watch, scheduled; `TRIGGER_RESERVED_KINDS` = queue, stream, manual; `TRIGGER_KINDS` = the six).
**Finding:** The number was imported verbatim from issue #430's body (`b1` F4) without the baseline verification the RFC otherwise demands of its claims. Three of the six are additionally reserved-not-implemented, so "firing history across 8 kinds" overstates twice: the count and the runtime reality.
**Why it matters:** Small, but it is the worked example the charter asks to show "something only NetScript can show" — its numbers should survive a grep, and this one is the pattern's proof.
**Proposed direction:** Restate as "firing history across the 6 canonical kinds (3 runtime-implemented at baseline)" with the constants citation.

### [SEVERITY: minor] The closed zone vocabulary has no home for the RFC's own worked third-party contributor
**Anchor:** §6 line 1117 (`load: () => import('@acme/plugin-crons/devtools/panels/queue')`) vs §7 `DevToolsZone` lines 1447-1453 (four primitive consoles + `plugin.detail` + `run.detail`) and §11.3 lines 2789-2797 (route tree hardcodes workers/sagas/triggers/streams).
**Finding:** The only third-party panel the RFC exhibits — a crons queue panel — targets no zone in the vocabulary the same RFC closes, and no route in the tree. Zone growth is "a data change," but the route tree is host code, and both are enumerated from today's four first-party plugins. The IA is genuinely framework-specific (the opposite of generic filler) — but it is over-fit to the current plugin set, and the discovery example contradicts the mounting model.
**Why it matters:** Under a real second/third contributor whose primitive is not one of the four, the contribution model offers discovery without a mount point. That quietly re-scopes "contribution architecture" to "first-party extension architecture" — which may be the right call, but it is not the call the §9 antecedent wording or the crons example advertises.
**Proposed direction:** Either introduce a data-extensible primitive-zone shape (e.g. `runtime.<kind>.console` admitted by descriptor data with a matching route convention), or state normatively that new primitives require a host release and mark the crons example as discovery-illustrative — then align §9's "workspace package" language with the first-party-only reality.

### [SEVERITY: minor] The supersession record §15.2 points to still keeps `plugin-dashboard-core` alive beside the RFC's new `packages/devtools-core`
**Anchor:** §15.2 lines 3670-3673 (full dispositions "committed at `design/T9-supersession/supersession-map.md`") + `supersession-map.md:84` ("| 412 | DDX-2 `plugin-dashboard-core` seam | … AMEND … Core package survives") vs §13.1 line 3470 (contracts live in `packages/devtools-core`).
**Finding:** The map's #412 row predates the final A1+A6+A5 boundary correction (its own banner says so) and still dispositions `plugin-dashboard-core` as surviving, while §13.1 creates a different contracts package and §6 O-1 says "#427 folds in." Ratifying §15.2 wholesale plus §13.1 yields two contracts packages for one family.
**Why it matters:** Board dispositions are what the owner ratifies in one motion; a stale row is how a fourth seam on the same axis — the exact defect this RFC exists to end — survives ratification.
**Proposed direction:** Reconcile the map's #412 row before filing: re-target #412 to become `packages/devtools-core` (rename/retask), or state its fold-in and close disposition, consistent with §13.1.

## Strongest part

The single best decision is the promotion of epic #400's ownership thesis from prose to a normative, checkable acceptance gate — AC-1's "why can't this just deep-link to Aspire/Scalar?" with the typed deep-link helper as its enforcement seam, the killed-surfaces list carried as non-goals, and §11.2's `DL?` column as the reviewer's evidence table. It is the one mechanism in the RFC that disciplines every other section: it is why the route tree reads as NetScript's (not a generic admin tree), why the worked examples survive the non-duplication test, why "contribute into Aspire/Scalar" is a declined non-goal instead of a roadmap item, and it is also what makes the `traces/` leftover in §5 detectable at all. Do not weaken the gate, the killed list, or the helper's "degrade, never hardcode" invariants while fixing the rest — they are the design's spine.

## Verdict line

DESIGN-FINDINGS: 1 critical, 5 major, 5 minor

DESIGN-REVIEW-COMPLETE
