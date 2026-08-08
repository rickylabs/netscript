# Worklog — plan-fable5-remediation-roadmap--seed

## Evaluator waivers (owner, run charter 2026-08-08)

- **PLAN-EVAL: WAIVED by owner** for this research/planning run. No evaluator session launched.
- **IMPL-EVAL: WAIVED by owner** for this run (planning-only; no implementation exists).
- Owner will personally review the plan and decide whether later adversarial passes or board
  filing are needed. Mirrored in `supervisor.md` § overrides and `drift.md` D-2.

## Design

This is a planning-only seed run; the "public surface" is the artifact tree, not code.

1. **Artifact surface** — run root: `supervisor.md`, `research.md`, `plan.md`, `worklog.md`,
   `context-pack.md`, `drift.md`, `workflows/` (committed workflow scripts). Deliverables under
   `fable-5-remediation-plan/`: `MASTER-PLAN.md`, `ISSUE-DEDUP-AND-SUPERSESSION.md`,
   `MILESTONE-TRAIN.md`, per-milestone directories with issue drafts, RFC drafts,
   `EXISTING-ISSUE-AMENDMENTS.md`, `WAVE7-AND-AGENT-ADOPTION.md`, `IMPLEMENTATION-HANDOFF.md`,
   `research/` corpus + citations.
2. **Stage slices (commit plan)** — S1 bootstrap (run dir + draft PR); S2 discovery corpus
   (pre-plan package + waves + GitHub board + repo/docs audit + external comparison); S3
   synthesis; S4 design packs (milestones + issue drafts + RFCs); S5 plan lock + deliverables +
   handoff. Each slice: commit → push (`HEAD:refs/heads/plan/fable5-remediation-roadmap`) →
   draft-PR comment.
3. **Deferred scope** — Stage F adversarial, stage G PLAN-EVAL, stage H filing (owner-waived /
   owner-reserved). No GitHub board mutation of any kind.

## Slice log

### S2 — Discovery corpus (Stage B) — in progress

- Draft PR #1347 opened (labels `type:docs`, `area:docs`, `status:research`, `ci:skip-e2e`,
  `ci:skip-scaffold`); charter read-back posted as opening phase comment.
- Supervisor read the Codex pre-plan package in full; distillation committed at
  `fable-5-remediation-plan/research/preplan-package.md`.
- Tier-C workflow scripts committed **before execution** (seed-run hard rule), commit `7f52683e1`:
  - `workflows/b1-prior-and-board-workflow.js` → run `wf_e2194004-808` (7 Opus subagents:
    waves:early, waves:wave4, waves:wave5-6-plans, waves:wave6-runs, board:open, board:history,
    board:conventions).
  - `workflows/b2-repo-and-external-workflow.js` → run `wf_03b88126-e7e` (11 Opus subagents:
    repo:docs-quickstart, repo:mcp-cli, repo:web-layer, repo:services-sdk, repo:auth,
    repo:runtime-plugins, repo:observability-aspire, repo:scaffold-doctrine, ext:eis-chat,
    ext:meta-frameworks, ext:orpc).
  - Subagent model: `opus` (resolves to Claude Opus 5, the current Opus generation — owner
    directive D-3). All agents are read-only outside their single assigned research output file;
    supervisor reviews and commits their output (no self-certification).
- Supervisor skill reads this stage: `agent-milestone-orchestrator`, `netscript-doctrine`,
  `netscript-release` (canary-first + versioning doctrine), `netscript-pr` (S1). Domain skills
  (`deno-fresh`, `fresh-ui-horizontal`, `aspire`, `jsr-audit`, `netscript-cli`,
  `netscript-tools`, `netscript-deno-toolchain`, `rtk`, `claude-manager`) are exercised by the
  domain subagents and consulted by the supervisor at Stage D where an issue draft depends on
  them.

#### S2a review note (supervisor, slice review gate)

Workflow `wf_e2194004-808` completed 7/7 (796k subagent tokens, 184 tool calls; per-agent
identities in the workflow journal — all `claude-opus-5[1m]`). Supervisor reviewed all seven
corpus files (3,816 lines total): abstracts cross-checked against file contents; citation bar met
(file+line / issue-number / live-`gh` provenance headers); milestone counters reconciled (GitHub
API counts include PRs; issue-only columns measured separately). Material corrections to the
carried-in pre-plan captured: 259 open issues / 13 open milestones (pre-plan said 265/11); #1328
and #1184 CLOSED; duplicate umbrella pairs #1276≈#1278 and #1275≈#1279; 0.0.5 continuation plan
~40% delivered with W2–W5 undispached (p0s #1326/#1329/#1333/#1208 open); milestone-shift house
pattern = rename-in-place highest→lowest; RFC practice = RFC-shaped tracking issues (#1123
exemplar), not `rfcs/NNNN` files; `wave:*` labels dead; `status:close-gate-override` +
`docs-eval:skip` missing from live label set. Notable subagent-report divergence: 0.0.6 open
count 22 vs 23 between two agents (GH counter includes a PR) — resolved, not a defect.

#### S2b review note (supervisor, slice review gate)

Workflow `wf_03b88126-e7e` completed 11/11 (1.78M subagent tokens, 905 tool calls, all
`claude-opus-5[1m]`). Supervisor reviewed all 11 files (5,163 lines): citation bar met
(file:line, executed `deno check`/`deno doc`/`deno eval` probes, live URLs); several defect
verdicts are execution-verified, not read-only inference (#1249 reproduced byte-identical; the
`isDefinedError`→`never` type defect proven by an executed `deno check`). Highest-leverage
findings for the plan: (1) the SDK client is a **closed 9-field record** — no
headers/interceptors/plugins/link seam, `createHttpClientLink` unexported, so auth composition is
an absent API (confirms and sharpens pre-plan RFC A); (2) oRPC pin 1.14.6 blocks nothing — every
extension gap is NetScript wrapper erasure (public export diff vs 1.14.15 identical); oRPC v2
beta threatens the GET-based method inference; (3) docs' four P0 breaks all sit on the same
contract→client→page seam, and `docs:accuracy` is a needle-checker that passes through them; (4)
`ui:add page` emits a counter stub + empty `queryLoaders` while `resolveProjectRoot` targets the
wrong tree — the generation seams are missing AND the one existing verb is mis-rooted; (5)
runtime-plugin audit: saga publish receipt discarded in the shipped sample (new uncovered p0),
`STREAMS_DATA_DIR` referenced by nothing, background children have zero health checks (the root
enabler of green-but-dead); (6) #1245 is ~75% fixed by merged #1265 — must be RESCOPED not
re-implemented; #1278's inventory is stale (one `as unknown as` left in web layer); (7) eis-chat
proves the APIs exist and app-space conventions close the gap — scaffold/generation + discovery
failure, not missing API; (8) competitive bar: SvelteKit remote functions + TanStack Start
serialization checks are the typed-data frontier; genuine differentiation = first-party
saga/compensation + Aspire graph + plugin-seam uniformity + agent-native surface. Divergences
between agents (e.g. meta-frameworks agent's "MCP tool count not enumerated" vs mcp-cli agent's
authoritative 21-tool enumeration) resolved in favor of the domain agent with source citations.

### S3/S4 — Synthesis + design packs (Stages C–D)

- Stage C: `SYNTHESIS.md` committed (`831a05285`) — supervisor-authored; gap taxonomy,
  7 adjudications, T1–T8 pack map, milestone-train direction.
- Supervisor drafts committed while packs ran: `MILESTONE-TRAIN.md`, `WAVE7-AND-AGENT-ADOPTION.md`
  (`54dedf59a`), existing-issue dispositions (`cca74212e`).
- Stage D: workflow `wf_ebfe8327-306` (7 Opus 5 agents, 1.25M tokens, 297 tool calls) → 40 issue
  drafts across `milestones/{0.0.6,0.0.7,0.0.8}-*/`, RFC-A (755 ln) + RFC-B (314 ln) in `rfcs/`,
  `EXISTING-ISSUE-AMENDMENTS.md` (929 ln, 16 amendment blocks). Supervisor added T7-01 (Wave-7
  smoke) — 41 drafts total, all DRAFT-marked (grep-verified).

#### S4 review note (supervisor, slice review gate)

Reviewed all pack manifests + spot-read drafts (T4-01 full). Every pack re-verified corpus claims
against the worktree before drafting; the packs surfaced **six corpus corrections** now recorded
in `ISSUE-DEDUP-AND-SUPERSESSION.md` §3.1 (T4-07 counter-evidence → drafted verify-first; sagas
health-check partial coverage; auth arch-debt anchors exist; #1278 inventories 80%-discharged/
mis-counted; quality:scan scope already repo-wide; arch:check:repo red = 2 mechanical causes).
Pack deviations accepted with rationale: TA-03 split into a/b/c (different owner surfaces);
TA-03a/TA-03b raised to p0 (security/runtime-correctness law); TA-05 raised to p2→p1 after the
docs half was refuted; G8 remote authenticator folded into TA-02. Ownerless finds + filing-time
checks recorded as the Stage-E ledger (§3.2–3.5). No lane self-certified: all pack output
supervisor-reviewed before this sign-off commit.

### S5 — Plan lock (Stage E)

- Re-fetched `origin/main` read-only: unchanged at `fac9e339042c` — no re-baseline needed.
- `MASTER-PLAN.md` (12-fork owner sweep, DAG, risks, exclusions) and
  `IMPLEMENTATION-HANDOFF.md` (filing gate, groups A–D, profiles, brief skeleton) written by the
  supervisor. `plan.md` locked; `context-pack.md` finalized as the resume surface.
- Close-out: no runtime resources were started by this run (no AppHost, no containers) —
  leak-check N/A. Session record: `.llm/2026-08-08-fable5-remediation-seed-run.md`.
- Final statement: **no GitHub issue, epic, milestone, project, label-set, or comment mutation
  occurred in this run** outside draft PR #1347's own body/comments/PR-labels. All deliverables
  are drafts pending owner ratification.

### S1 — Bootstrap (Stage A)

- Run dir created; `supervisor.md` written first with identity, lane table, and owner overrides.
- Waivers recorded (above). Baseline verified: `HEAD == origin/main == fac9e339042c` at start.
- Skills activated: `netscript-harness` (+ `activation.md`, `run-loop.md`, `seed-run.md`,
  `lane-policy.md`, `SCOPE-docs.md`, `templates/supervisor.md`), `netscript-pr` (full read).
  Remaining charter skills are read at the stage that needs them; each read is logged here.

### S6 — Owner-ratified filing (Stage H, 2026-08-08)

- Owner explicitly ratified the roadmap and instructed the milestone insertion plus complete issue
  filing. The one-shot `FILING-MANIFEST.md` was committed before board mutation.
- Shifted the existing 0.0.6–0.0.13 milestone objects to 0.0.8–0.0.15, created fresh 0.0.6 and
  0.0.7 milestones, and restored the complete old-0.0.6 membership before applying the explicit
  move ledger.
- Filed 41 issues (#1348–#1388), reconciled all internal dependency references to live numbers,
  and applied 20 additive amendments to existing owner issues. No issue was closed.
- Post-filing audit: 41/41 new issues open; milestone distribution 10/12/19 for 0.0.6/0.0.7/0.0.8;
  zero status/type/area/priority/milestone metadata violations. Full receipt: `fable-5-remediation-plan/FILING-LOG.md`.
