# Wave plan — 0.0.5 (stage B)

44 open issues at run start. Clustered on **acceptance text** (digest via read-only explore agent,
2026-08-03), not labels. 37 issues close through 23 PRs; 3 are observational hand-closes
(#1149, #1090, #1140); 3 are epics/tracking (#1126, #1169, #1117 — no closing keywords);
#1139 is F2-gated and out of scope unless the owner flips F2.

## Issue-disposition classes

- **PR-closable (37)** — clustered below.
- **Observational (3):** #1149 (canary label/note exercise — executed by the orchestrator at
  stage E, retro-audit of the two 0.0.4 canaries plus live evidence from this run's canaries; box
  4 gated on #1166 landing), #1090 (observational hub — receives routed boxes from #1140, #1117
  box 6, #1102 final box; hand-closed on recorded observation or moved), #1140 (S14 — routes to
  #1090, cannot close by PR).
- **Epics/tracking (3):** #1126, #1169 (umbrellas — never carry closing keywords; #1169's
  "one-pass publish" DoD box is expected to be evidenced by this run's own stable cut), #1117
  (tracking issue implemented by epic #1126 — candidate hand-verified close after S9/S12 land).
- **Gated out (1):** #1139 (S13, F2 stands at (a) — "filing ≠ green light"). Moves at cut with
  written reason unless owner flips F2.

## Mislabel corrections (skill rule: acceptance > labels)

- #1112 `type:docs` but requires database-adapter code + tests → routed as a **code** slice.
- #1110 `type:docs` but requires a `packages/contracts` JSDoc fix + test fixture → **code** slice.
- #1108 `type:docs` but core deliverable is a drift **gate** → code slice (has `area:tooling`).
- #1102 `area:docs` but deliverable is `packages/mcp` retrieval code → **code** slice.
- Labels to be corrected on GitHub at dispatch of each affected PR.

## PR clusters and waves

Lane notation per `lane-policy.md`: Sol = Codex · GPT-5.6 Sol (effort per slice); agy =
Antigravity/Gemini docs-authoring lane. Review/evaluation composes the existing triggers
(draft→ready augment + OpenHands label) — no per-PR local evaluator. ≤3 local Codex supervisors
concurrent (+1 agy remote where shown); dependencies run across waves, never inside one.

### Wave 1 — unblock everything

| PR | Issues | Scope | Lane |
| --- | --- | --- | --- |
| W1-A | #1127 #1128 #1129 | OMB wave-0 proofs; S1 arbitrates F1 — a FAIL is a legitimate verdict activating F1(b) and re-scoping S7 | Sol · high |
| W1-B | #1166 #1004 #1148 | release-lane integrity: canary payload merge-commit fix, same-semver republish path, version-residue scan | Sol · medium |
| W1-C | #1170 | `agentic:pr-checks` latest-run-per-name rollup — supersedes the manual false-red rule this run otherwise applies per merge | Sol · medium |

**→ Canary 0.0.5-canary.1.** Landing #1166 first makes canary.1 the demonstration vehicle for its
observational box and for #1149's retro-audit.

### Wave 2

| PR | Issues | Scope | Lane |
| --- | --- | --- | --- |
| W2-A | #1130 #1131 | OMB spine: projection domain (gated by S2 verdict) + directory port/adapters (gated by S1 verdict; F1(b) switches primary source, same contract) | Sol · high |
| W2-B | #1134 | S8 existing-machinery fixes — hard-blocks S10, S6 receipt semantics depend on it | Sol · medium |
| W2-C | #1174 #1142 | CI state honesty (epic #1169's own slice S4 groups them): deleted-ref guard + `$GITHUB_OUTPUT` heredoc sweep | Sol · medium |
| W2-D | #1106 #1109 | pure-docs batch: auth session lifecycles + runtime testing/replay docs. Quota contingency: if the agy cap hits, remainder re-waves — no silent model substitution | agy · low |

**→ canary.2**

### Wave 3

| PR | Issues | Scope | Lane |
| --- | --- | --- | --- |
| W3-A | #1132 | S6 three read tools (needs S4/S5/S8 — all landed) | Sol · high |
| W3-B | #1133 | S7 manifest emission — scope set by the P1 verdict (template emission vs `aspire-cli` adapter); effort re-tiered at dispatch from the verdict | Sol · medium–high |
| W3-C | #1171 #1105 | close-gate honesty: verdict carries evaluated state + PR-body checklist convention (recommendation to brief: gate fails on unticked PR-body DoD boxes — the #1088 incident argues for enforcement over convention) | Sol · medium |

**→ canary.3**

### Wave 4

| PR | Issues | Scope | Lane |
| --- | --- | --- | --- |
| W4-A | #1135 #1136 | S9 activation surfaces + S10 evidence-gate acceptance (S8 landed two waves prior) | Sol · medium |
| W4-B | #1172 | serialize `scaffold.runtime`, contention names itself; forced-collision negative case as a real run | Sol · medium |
| W4-C | #1173 #1085 | agentic refusal honesty sweep + launch-codex-slice SIGTERM — clustered because both target the same `duplicate_sender_risk` exit-0 path; #1173's audit decides how much of #1085 box 2 is already true | Sol · medium |
| W4-D | #1104 | cron retry/backoff: decision box (implement vs deprecate) + fake-clock tests across both adapters | Sol · high |

**→ canary.4**

### Wave 5

| PR | Issues | Scope | Lane |
| --- | --- | --- | --- |
| W5-A | #1102 | intent-aware capability discovery in the docs MCP (+ eval corpus); final box routes to #1090 | Sol · high |
| W5-B | #1093 | plugin discovery de-hardcoding + third-party fixture proven by a test that fails on today's main | Sol · high |
| W5-C | #1108 #1110 | docs-reference drift gate derived from `deno.json.exports` + bulk inventory repair; subsumes #1110's contracts inventory, adds its pagination walkthrough + JSDoc fix | Sol · medium |
| W5-D | #1137 #1138 | S11 contract summary enrichment (F3a, all first-party contracts) + S12 reference docs (S6 surface final after wave 3) | Sol · low |

**→ canary.5** — #1117 candidate close after this wave (all implementable boxes verifiable;
box 6 routed to #1090).

### Wave 6 — tail

| PR | Issues | Scope | Lane |
| --- | --- | --- | --- |
| W6-A | #1115 #1119 | codex-follow/live state + AI-rollout canary rename (shared surface: `.llm/tools/agentic/` + README/tooling index). Rename wanted "before the cadence hardens" — earlier if a wave-1–3 lane frees early | Sol · medium |
| W6-B | #1112 | MySQL Prisma adapter: docs + the adapter-code/test boxes (mislabel-corrected code slice) | Sol · medium |
| W6-C | #1116 | AI docs (retries/budgets/citations) + possible `packages/ai*` JSDoc touches | Sol · low |
| W6-D | #1168 #1024 | e2e retry-with-visibility + measurement box, + #1024's last box (standalone scaffold e2e) — shared e2e-tooling surface | Sol · medium |

**→ canary.6 (final) → stage F cut-time checklist → stable 0.0.5 cut (owner's publish call).**

#1175 (p3, JSR-propagation poll) is explicitly constrained to land *away from* in-flight release
activity — held as a cut-adjacent decision: post-cut if timing permits, else moved to 0.0.6 with
written reason.

## Canary points — owner-decided 2026-08-03

Both cadence open questions were put to the owner with the plan report; decisions:

1. **Density (owner: "6 if strictly needed otherwise 3-4"):** **four declared canary points** —
   **canary.1 @ wave-1 boundary** (strictly needed: it is the demonstration vehicle for #1166's
   observational box and #1149's audit), **canary.2 @ wave-3 boundary** (OMB spine + read tools —
   the release's main public-surface change), **canary.3 @ wave-5 boundary** (activation,
   enrichment, discovery), **canary.4 @ wave-6 boundary** (final canary; the green pair required
   by `netscript-release` before a stable cut). Wave-2 and wave-4 boundaries get no canary unless
   re-planning makes one strictly needed — that promotion is a recorded decision at the boundary.
2. **Failed canary (owner: "it shouldn't block — issues are fixed on the next canaries"):** a red
   canary blocks **only the cut**, never the next wave's dispatch. Failures are absorbed by
   subsequent canaries; failed-canary handling itself is `netscript-release` doctrine.

Membership stays content-derived at each point (whatever landed since the previous point,
first-parent merge history via `release:canary-label`); labels derived from the published version
through `release-canary.yml`, never typed.

## Dispatch preconditions (stage B gates — run per wave, recorded in worklog.md)

Provider quota + paid-transport verification are checked and their output recorded in `worklog.md`
immediately before each wave's dispatch — a wave dispatched without that record is a did-not-run.
Not yet run: no dispatch has occurred.

## Re-planning stance

The plan above is a dispatch schedule, not a contract. Undispatched remainder re-clusters freely
(queue-jumps land when they unblock a lane); `cut-trace.md` records what actually happens.
