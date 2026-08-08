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

### S1 — Bootstrap (Stage A)

- Run dir created; `supervisor.md` written first with identity, lane table, and owner overrides.
- Waivers recorded (above). Baseline verified: `HEAD == origin/main == fac9e339042c` at start.
- Skills activated: `netscript-harness` (+ `activation.md`, `run-loop.md`, `seed-run.md`,
  `lane-policy.md`, `SCOPE-docs.md`, `templates/supervisor.md`), `netscript-pr` (full read).
  Remaining charter skills are read at the stage that needs them; each read is logged here.
