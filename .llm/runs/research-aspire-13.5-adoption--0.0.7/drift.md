# Drift log

## D-1 — Owner route override

- Severity: intentional
- Baseline policy: planning orchestration normally routes to Opus 5 high; Fable 5 medium is the
  deep-analysis lane.
- Owner decision: this standalone harness research orchestrator must use Fable 5 medium.
- Action: record requested and observed identity and keep the route for the run.

## D-2 — Scope expanded beyond migration

- Severity: plan-shaping
- Owner correction: the epic must cover Aspire MCP plus all static resources and docs so NetScript
  is fully aligned with the latest Aspire release.
- Action: `supervisor.md` makes canonical-source and regeneration-chain coverage mandatory.

## D-3 — `?aspire-lang=typescript` has no effect on the Markdown form

- Severity: minor (method)
- Observation: aspire.dev serves Markdown at `<page>.md`; the query string does not change the
  response (byte-identical for the What's New page). The Markdown contains both C# and `apphost.mts`
  tabs.
- Action: TypeScript claims are taken from the `apphost.mts`/`twoslash` fences and from the
  generated TypeScript API reference (`reference/api/typescript/aspire.hosting`), which is the
  authoritative TS surface. Recorded in `sources/README.md`.

## D-4 — Upstream documentation contradicts itself on TypeScript feature availability

- Severity: minor (evidence)
- Observation: `app-host/container-files` and `fundamentals/health-checks` still say the TS APIs are
  "not yet available"; the 13.5 What's New and the 13.5.1 TS API reference expose them.
- Action: trust the API reference; `research.md` §11 lists every discrepancy so nobody "fixes"
  NetScript to match a stale page.

## D-5 — Remote Control cannot be enabled from inside the turn

- Severity: process
- Observation: `/rc` is a user-side slash command; the orchestrator can only record the observed
  session URL (`https://claude.ai/code/session_011Ng6hnMLyY8vzM8EJo2XKg`). Effort level is not
  introspectable from inside the session.
- Action: recorded in `supervisor.md`; the owner verifies `/status` and keeps `/rc` on.

## D-6 — Repo already partially on 13.5

- Severity: plan-shaping
- Observation: `.github/workflows/e2e-cli-prod.yml` pins Aspire CLI `13.5.0-preview.1.26404.10` (for
  aspire#18948/#18958) while every other pin is 13.4.6 and the NuGet cache key is `13.4.6-v1`; the
  policy test asserts both literals.
- Action: plan D-1/D-8 converge everything on 13.5.3 in S1; the preview's rationale shipped in
  13.5.0.

## D-7 — Standing scaffold assumption about CommunityToolkit projection is stale

- Severity: plan-shaping
- Observation: `generate-aspire-config.ts:44-56` and the arch-debt entry assume `[AspireExport]`
  from external NuGets is not projected into the TS SDK; the aspire.dev TS API reference lists
  `CommunityToolkit.Aspire.Hosting.Deno` (`addDenoApp`, `addDenoTask`).
- Action: not adopted in 0.0.7 (D-4); S2 V9 proves it at restore time, S12 spikes it in 0.0.8.

## D-8 — Coordinator scope expansion to whole-ecosystem alignment

- Severity: plan-shaping
- Owner/coordinator correction (2026-08-29): audit and dispose every Aspire-bound surface (MCP
  server/client, static resources, generated snapshots/schemas, skills/corpora/prompts, CI
  workflows/fixtures, examples/templates, dashboard/telemetry bridge, all docs) with one
  authoritative source and one repo-path disposition; include cleanup in the issue graph.
- Action: `stale-surface-inventory.md` (7 surface classes, archival exemption list), research
  C26–C31 + §12a, plan D-11/D-12, new slice S-13, epic pillar 7.

## D-9 — S-09 acceptance was prose-only

- Severity: acceptance
- Correction: S-09 must prove the MCP upgrade behaviour with a structured receipt tied to S-01/S-02.
- Action: `sub-issues/09` rewritten (Part A smoke gate `agent.aspire-mcp-smoke`, JSON receipt path
  `.llm/tmp/gate-receipts/<job>/agent.aspire-mcp-smoke.json`, committed copy
  `receipts/aspire-13.5-mcp-smoke.json`); 13.4.6 baseline captured now in
  `receipts/aspire-13.4.6-mcp-baseline.json` (executed via the session's Aspire MCP server —
  `doctor` + tool discovery; no AppHost started).

## D-10 — Shipped skill's 13.4.6 MCP table is already incomplete

- Severity: minor (evidence)
- Observation: the 13.4.6 server exposes `refresh_tools`, which the "verified tool set on 13.4.6"
  table in `skills/aspire/SKILL.md` omits. Not a 13.5 change; S-09's receipt-driven table fixes it.

## D-11 — PLAN-EVAL cycle 1 FAIL_PLAN and bounded repair

- Severity: plan-shaping
- Verdict: `plan-eval.md` (head `d8caa507e`, evaluator Codex · Sol · high) — F1 health contract, F2
  canary/stable admission, F3 MCP ownership/lifecycle, F4 parity phases, F5 wave completeness +
  manifest, F6 jsr-audit, F7 rendering/staleness.
- Action: all seven corrected in one research-only commit (mapping in `worklog.md`); decisions
  D-5/D-6/D-10 revised, D-13/D-14 added, D-17 opened (dashboard-port assumption, resolve before
  S-13); S6b (protocol-level readiness) deferred to 0.0.8; `aspire-surface-manifest.tsv` + generator
  committed. No second evaluation cycle was launched.

## D-12 — PLAN-EVAL cycle 2 (final) FAIL_PLAN and consistency repair

- Severity: plan-shaping
- Verdict: `plan-eval-cycle-2.md` (head `1bfe60b05`) — six consistency findings; root cause of most
  of them: the cycle-1 repair's scripted `plan.md` replacements silently missed after `deno fmt`
  re-padded table cells (the exact `fmt-rewrap-breaks-string-patches` trap), so D-10/slice table/
  rollback/risk/ratification stayed on the two-canary/12-slice text while the DAG and canary table
  were already correct.
- Action: `plan.md` rewritten in full; MCP semantics corrected (`excludeFromMcp()` ≠
  `withHidden()`); parity phases made executable with the run dir + debt registry archival and
  compat fixtures / lock files special-cased; S13 everywhere; `SAGAS_API_DEFAULT_PORT` retained as
  deprecated compat export; truncated rows reconstructed; deployment owned by S4 (D-15); D-17
  default locked. Every scripted edit was re-verified by grep before commit. No third ordinary
  PLAN-EVAL; next step is coordinator ratification.

## D-13 — Resume turns drop the requested effort

- Severity: minor (route)
- Observation: `launch-codex-slice` matched openai · gpt-5.6-sol · medium for S1, but
  `run-codex-slice` → `codex-resume` (`codex exec resume`) carries no `--effort`, so `codex-status`
  reports the later turns at the profile default `high`.
- Action: recorded; review pairing unchanged (Fable, medium+); agentic-suite follow-up to propagate
  effort on resume (not an S1 concern).

## D-14 — Baseline Fresh type error blocks the CI runtime verdict

- Severity: significant (blocker for S1 draft→ready; not S1-caused)
- Observation: `packages/fresh/src/application/query/hydration.ts:43` TS2345 fails generated-project
  `deno task check` (`generated.quality-negative`, `generated.service-check`) at base `3b32d1628`;
  blob identical at S1 head. Aspire-specific gates through `runtime.aspire-restore` are green on
  13.5.3.
- Action: surfaced to the primary coordinator for the 0.0.7 fixes lane; S1 stays draft until the
  baseline is green or the coordinator admits S1 on the Aspire-specific evidence.

## D-15 — Aspire MCP 13.5.3 exposes 14 tools; `get_integration_docs` is documented but absent

- Severity: plan-shaping (S-09 acceptance)
- Observation (S2 V8, exact host CLI 13.5.3+b5f1433, stdio `aspire agent mcp` from the generated
  project root, 2026-08-29T22:47Z): `tools/list` = the same 14 tools as the committed 13.4.6
  baseline (`refresh_tools` present); `get_integration_docs` — listed by
  `sources/aspiredev-get-started_aspire-mcp-server.md` — is **not** exposed. Receipts:
  `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/03-v8-*` on
  `test/aspire-13-5-s2-runtime-verification`.
- Action: S-09's smoke expectation becomes the **executed** 13.5.3 set (14 tools; `baselineDiff`
  empty); the receipt records `get_integration_docs` as a documented-but-absent tool (upstream doc
  discrepancy §11 item 6) and treats its later appearance as `info`, not `fail`. Issue #1721 gets a
  comment; `research.md` C16/C27 get an errata line at the next research-dir edit.

## D-16 — Isolated starts reuse the generated Postgres host port (S2 V3)

- Severity: significant (product; S5 scope)
- Observation: two consecutive `aspire start --isolated` runs of the same generated project both
  bound Postgres to host port 14428; `verify-live-db-endpoint` exited 1.
  `DcpPublisher__RandomizePorts` does not cover the generated infrastructure `withHostPort`/endpoint
  pins.
- Action: S5 (#1717) must include infrastructure host-port pins in the literal-port removal / opt-in
  policy; S10 keeps the gate; noted on #1717.

## D-17b — Cold start 38.6 s and web readiness timeout on 13.5.3 (S2 V2)

- Severity: minor (evidence)
- Observation: time-to-`dashboardUrl` 38.6 s cold / 24.8 s warm on this host (skill baseline 13 s on
  13.4.6, different machine state); web readiness timed out because Prisma/Zod generated output was
  absent until `db generate` ran; browser-log child `NotStarted`.
- Action: S9 replaces the skill timing claim with measured ranges; S10 orders db codegen before the
  readiness wait; not an Aspire regression claim without a same-host 13.4.6 control.

## D-18 — 2026-08-30 — S5 does not close #1365 (OF-3a drift)

- **What:** Ratified OF-3a / #1717 box 6 had S5's PR close #1365, #1370, #979. At IMPL-EVAL PASS
  (`slices/s5/evaluate-cycle-2.md` F-2) the #1365 acceptance boxes for docs-site embedding (S11),
  "discarding a publish result fails type-check/lint" (declined by locked D-14), and
  restart/duplicate/out-of-order/OTEL-correlation proofs are not met by S5.
- **Action:** PR #1740 references `Part of #1365` with the remaining scope listed; #1370 and #979
  keep closing keywords. Coordinator to either amend #1365's boxes (D-14 decision) or route the
  remainder to S11 + a sagas follow-up. Severity: minor (scope honesty, no code impact).

## D-19 — 2026-08-30 — S6 endpoint projection API corrected against restored 13.5.3 module

- **What:** Issue #1718 (line 44) and plan D3 locked host/port resolution at check time via
  `getEndpoint('tcp').property(EndpointProperty.Host|Port)` ("13.4+ thenable chain"). S6 IMPL-EVAL
  cycle 1 compiled a generated AppHost against S2's restored 13.5.3 `.aspire/modules/aspire.mts` and
  found `property()` yields `EndpointReferenceExpression` handles; the value API is
  `getEndpoint('tcp').host()` / `.port()`. `HealthCheckResult.data` is `Record<string, string>`.
- **Action:** intent unchanged (live host/port per invocation, no credentials); projection call and
  `data` typing corrected in S6 slice 6. **Process:** a consumer type-check of a generated AppHost
  against the restored 13.5.3 modules is now a mandatory Tier-A + IMPL-EVAL gate for every generator
  slice (S4/S5 to be re-checked retroactively by the supervisor). Severity: significant (would have
  shipped rejecting health checks).

## D-20 — 2026-08-30 — S5 is red on live CI; its IMPL-EVAL PASS is void

- **Severity:** significant (product; blocks S5 and, by stacking, S6).
- **What:** the context pack recorded S5 (#1717 / PR #1740) as Tier-A ×3 + IMPL-EVAL cycle 2 PASS,
  `status:ready-merge`, close-gate PASS. Live GitHub at `0bd8ba832` says otherwise:
  `mergeStateStatus=BLOCKED`, `check-test` FAIL and `close-gate` FAIL in run `33286543750`.
- **Evidence (four verified defects, all confirmed by supervisor read, not inferred):**
  - **F-1** `check-test` fails at `plugins/ai/tests/manifest_test.ts:56` —
    `AssertionError: actual 0 / expected 8095`. S5 removed `officialSource.backgroundPort: 8095`
    from `plugins/ai/scaffold.plugin.json` but left the assertion in place. 4279 passed / 1 failed.
  - **F-2** `plugins/{workers,auth,sagas,triggers}/streams/factory.ts` replaced the
    `options.baseUrl ?? 'http://localhost:4437'` literal with a `requiredStreamsBaseUrl()` that
    **throws** on an omitted `baseUrl`. `buildStreamUrl(path, baseUrl?)` already falls back to
    `getStreamsUrl()` (`DURABLE_STREAMS_URL` → `services__streams__http__0` →
    `VITE_services__streams__http__0`/`VITE_STREAMS_URL`), so S5 deleted the working
    Aspire-discovery path along with the literal. Valid Aspire-wired callers now fail.
  - **F-3** `packages/cli/.../install/install-plugin.ts:574` leaves `hostPort` unset on a normal
    install while the CLI completion still announces `plugin.servicePort` — post-S5 that is only a
    deterministic template port, never the endpoint Aspire allocates.
  - **F-4** `.llm/tools/validation/check-aspire-host-ports.ts:50` evaluates
    `CONTRIBUTION_PORT_FALLBACK` one line at a time, so a multiline `ctx.port(resource,\n port)`
    escapes the fitness gate it exists to enforce.
  - F-2..F-4 are the three unanswered `augmentcode` review threads that fail
    `agentic:review-threads` (`threads=3 unanswered=3`).
- **Action:** S5 repair dispatched as a new Codex slice (thread
  `01a0515b-8f4a-7412-a151-42d5fb4258d7`, worktree `007-aspire-s5`, brief
  `slices/s5/repair/brief.md`). The prior IMPL-EVAL PASS does not carry to the repaired head — S5
  needs a fresh Tier-A review and a fresh independent IMPL-EVAL before it can be considered
  merge-ready again. **Coordinator decision required:** `status:ready-merge` and `impl-eval:skip`
  are currently live on a red PR; this session does not relabel.
- **Process lesson:** a recorded IMPL-EVAL PASS is not a durable merge signal — live CI and the
  review-thread gate must be re-read at reconciliation time, because both can go red after the
  verdict was written.

## D-21 — 2026-08-30 — Codex agentic lane needed `--user node` on the NAS

- **Severity:** minor (tooling; recovered).
- **What:** `.llm/tools/agentic/lib/agentic-lib.ts` defaults the WSL identity to user `codex`. On
  the NAS the Linux user is `node`, so every agentic Codex command aborted with
  `Cannot run WSL command locally as requested user "codex"`.
- **Action:** all agentic Codex invocations on the NAS pass `--user node` (`NETSCRIPT_WSL_USER` is
  not readable by `agentic:codex-status`, which runs without `--allow-env`). The daemon itself
  survived the migration: app-server `0.151.0`, control socket
  `/home/agent/.codex/app-server-control/app-server-control.sock`, `remoteControlEnabled: true`. Not
  an Aspire-scope defect; recorded so later slices do not rediscover it.

## D-22 — 2026-08-30 — stray `aspire ps` core dump in the supervisor worktree

- **Severity:** minor (hygiene).
- **What:** a 116 MB untracked `core` (ELF core dump from `aspire ps --no-logo`, execfn
  `/home/agent/.local/aspire/aspire`) was sitting in the supervisor worktree after migration.
  `--no-logo` is not a valid 13.5.3 flag; the correct form is `--nologo`.
- **Action:** archived to `/home/agent/observability/aspire-13.5/` (never committed). The runtime
  precondition proof uses `aspire ps --format Json --nologo --non-interactive`, which returns `[]`
  cleanly with no dump. S9's skill/doc line should carry the `--nologo` spelling.

## D-23 — 2026-08-30 — S5 repair left the agent-tools barrel stale (brief defect, not author error)

- **Severity:** minor (gate evidence; blocks S5 CI).
- **What:** PR #1740 at repair head `f3b3e75e` is red on the `quality` job step "Generated asset
  freshness" (run `33297719237`, job `99220213430`). `check:assets-barrel` runs
  `gen:assets-barrel && git diff --exit-code` over the seven generated barrels and exits 1: the
  receipt diff is confined to `packages/cli/src/kernel/assets/agent-tools.generated.ts`, where
  `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` moves
  `2549200359d6e12f89eb9d9df1d5b88df6154042b8c0b86bf3f3d06cb98abf26` →
  `01b5b9b43a008d21c2dc49fc035358a63f9582156b4af81083f427a9860e7b89`. Verified at the branch head:
  the committed constant is still the pre-edit `2549…` and no `*.generated.ts` was touched between
  `0bd8ba83` and the current head. `check-test` is green — F-1…F-4 themselves landed correctly.
- **Cause:** repair slice 4 edited `.llm/tools/validation/check-aspire-host-ports.ts`, and
  `.llm/tools` sources are embedded in the agent-tools corpus. The repair brief's slice-5 gate list
  said "`check:assets-barrel` **if any generated asset moved**", which understates the coupling —
  _any_ `.llm/tools` source edit moves that barrel. **This is a supervisor brief defect**, not an
  implementation error; S6's brief already carried the correct unconditional form.
- **Action:** the same author thread (`01a0515b-8f4a-7412-a151-42d5fb4258d7`) is steered to run
  `gen:assets-barrel`, commit only the authoritative regenerated barrels, **re-cut the slice-5 gate
  evidence at the new exact head** (the `f3b3e75e` table is stale the moment the fix lands), push,
  and drive CI green. Green CI is a precondition for Tier-A and the independent IMPL-EVAL, not a
  substitute for either. No runtime lease granted.
- **Lesson (for the run's brief template):** any slice touching `.llm/tools/**`,
  `.agents/skills/**`, or an embedded-asset source must list `gen:assets-barrel` +
  `check:assets-barrel` as **unconditional** slice gates.

## D-24 — 2026-08-30 — S7 phase-B evidence gap flagged by IMPL-EVAL cycle 2 (non-blocking)

- **Severity:** minor (evidence provenance; phase B only).
- **What:** the cycle-2 IMPL-EVAL `PASS` carries one non-blocking note: `ASPIRE_DCP_APPHOST_PATH`
  has no receipt provenance, and process `cwd` is not ownership evidence.
- **Action:** the S7 phase-B lease brief must capture a **real** orphaned descendant's `environ` /
  `cmdline` / `cwd` / `fd` set and cite it as the receipt behind the ownership classification,
  rather than resting on the synthetic fixture. Folded into the lease queue; does not affect the
  phase-A verdict.

## D-25 — 2026-08-30 — NAS container PID 1 is not reaping; 7.7k zombies produce false process-survival reds

- **Severity:** significant (environment, not product). **Not fixable by any agent.**
- **What (independently verified in this session, read-only):** `ps -eo stat=` reports **7,734
  zombie processes out of 7,844 total** in the `ai-agents` container. **7,562 are PPID-1-owned
  `sshd`** children; the remainder are `git` (61), `node-MainThread` (22), `esbuild` (22), `sleep`,
  `deno`, `sh`, `codex-code-mode`. Container PID 1 is not reaping, and an unprivileged agent cannot
  reap another process's children.
- **Consequence:** any gate that asserts "no surviving/leaked child process" reports a false red.
  The coordinator attributes the hybrid-launcher **cancellation-survivor root test** red to exactly
  this. **Classification: environment artifact, not a code defect.**
- **Standing rule for this run:** do not re-run or chase that root test, and do not attribute it to
  any Aspire slice. **Scoped product gates are judged independently of it** — a slice's verdict
  rests on its own scoped wrappers, `quality:scan`, `arch:check`, `check:assets-barrel`, and its
  targeted suites, never on the root process-survival suite while this condition holds.
- **Carried into evaluator briefs:** every Aspire IMPL-EVAL brief from this point must name this red
  as known-infra so the evaluator does not return `FAIL_FIX` on it.
- **Owner action (agent-blocked):** the container needs a reaping init (or a restart) on the host.
  Secondary risk: ~7.8k processes is within reach of PID/thread limits, which would start failing
  unrelated spawns. This is a human/host action — flagged, not attempted.

## D-26 — 2026-08-30 — `check:publish-assets` is a second derived-asset trap; S5 verified clear

- **Severity:** minor (gate coverage; no S5 impact).
- **Source:** the 0.0.7 docs lane hit this on PR #1746 — `check:assets-barrel` and
  `check:agent-docs-prose` were green at the pushed head, Tier-A re-ran them, and an independent
  IMPL-EVAL re-ran them; CI still failed on "Publish asset freshness". Their brief had barred
  regenerating `packages/mcp/src/publish-assets.generated.ts` on a lane rule claiming it "embeds
  `packages/mcp/README.md` only" — a false premise, so the gate never reached the list and no amount
  of independent review could catch it. Repair was one line, `'sourceCommit'`.
- **Input set** (`.llm/tools/generate-publish-assets.ts:34-40`):
  `.llm/assets/agent-docs/{prose.json.gz,provenance.json}`,
  `packages/cli/src/kernel/assets/{agent-tools,agent-docs,embedded,skills}.generated.ts`,
  `packages/plugin/src/kernel/assets/embedded.generated.ts`.
- **Verified for S5 (negative result, taken at the exact head):** S5's `59728705` regenerates
  `agent-tools.generated.ts`, which _is_ on that input list, yet `deno task check:publish-assets`
  **exits 0** at `f0de60a1`. Run in a throwaway detached worktree so the author's tree was never
  touched. **S5 needs no publish-assets commit.**
- **Refined rule:** the trigger is not "an input path changed" but "an input whose content actually
  reaches the emitted output". The docs lane's failure came from **agent-docs corpus regeneration**
  moving `provenance.json`'s `sourceCommit`, which is embedded; S5 moved
  `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` and embedded tool bodies without touching the agent-docs corpus,
  so nothing emitted moved.
- **Action:** `gen:publish-assets` + `check:publish-assets` join `gen:assets-barrel` +
  `check:assets-barrel` as **unconditional** slice gates for every corpus-touching slice — S9
  (corpora/skills), S13, and the S7 playbook rows are the exposed ones. Generalises D-23: the brief
  rule is **"any generated asset whose _inputs_ your diff touches"**, never a memorised file list. A
  conditional phrasing ("if any generated asset moved") is what let both D-23 and #1746 through.

## D-27 — 2026-08-30 — Mermaid `%%` comments do not reach the rendered SVG (terminology rows are diagram-safe)

- **Severity:** trivial (unblocks an S11 row).
- **Question:** the docs lane asked whether changing the `.NET Aspire` string in the `%%` comment at
  `docs/site/_diagrams/aspire-resource-graph.mmd:2` would move the rendered artifact and hand this
  run a spurious diagram diff.
- **Evidence:** `docs/site/assets/diagrams/aspire-resource-graph.svg` (21,680 bytes) contains
  **zero** occurrences of `.NET Aspire`, of the comment line text, of `%%`, and of `Theme-neutral` —
  all four `%%` header lines are absent. Only generic `aria-roledescription="flowchart-v2"`
  metadata; no embedded source digest, no timestamp. `diagrams:check`
  (`docs/site/_diagrams/render.ts`) renders to a temp SVG and byte-compares against the committed
  one, so a comment-only edit renders identically.
- **Limitation stated:** proven from the committed artifact, not from an executed A/B render —
  `mmdc` cannot run in this container (`Permission denied`, noexec scratch, and mermaid-cli needs
  headless Chromium).
- **Answer given:** the terminology row is safe to sweep; it does not need to be deferred, and it
  does not interact with the manifest's "diagrams:render if S6/S8 add nodes" condition (which is
  separately proven NO for S6 — 2 `addContainer` emissions before and after).

## D-25a — 2026-08-30 — second symptom of the same host pressure: inotify instance exhaustion

- Addendum to **D-25**. S5's exact-head `deno task test` run surfaced a **second** host-process
  failure alongside the zombie one: `codex-follow_test.ts` could not create an inotify watcher —
  `Too many open files`, against a host maximum of **128 inotify instances**.
- Both failures reproduce on a clean local retry and **both pass on CI's clean runner**
  (`check-test` green at `aa822069`), which independently confirms they are host-local rather than
  code defects.
- Mechanism is distinct from the zombie count but shares the cause: an over-subscribed container.
  The zombie backlog (7,734 procs) and the watcher-instance ceiling are two faces of the same
  resource pressure, and the watcher ceiling is the **leading indicator** — it bites long before PID
  exhaustion does.
- **Standing rule extended:** classify BOTH `hybrid-launcher_test.ts` cancellation-survivor and
  `codex-follow_test.ts` inotify failures as known-infra. Do not chase, do not suppress, do not
  attribute to a slice — but **do** report them in the evidence table, as S5's author correctly did.
- Owner action unchanged and still agent-blocked: the container needs a reaping init (or a restart);
  raising `fs.inotify.max_user_instances` would relieve the watcher ceiling. Both are host actions.

## D-28 — 2026-08-30 — S5 IMPL-EVAL cycle 3 `PASS`; five coordinator-owned follow-ups

- **Verdict:** `PASS` at `aa822069` (content head `2e8c6f4f`), base `13878a80a`. Evaluator: fresh
  Claude · Fable 5 · medium session `e100ce32`, independent of this supervisor, of the Codex author
  thread `01a0515b…`, and of the S7 evaluator. Cycle 2's `PASS` was explicitly **not** inherited
  (D-20). Record: `slices/s5/evaluate-cycle-3.md`; PR comment `#issuecomment-5467470320`.
- **Verified by this supervisor before acceptance:** branch head unchanged at `aa822069`, eval
  worktree clean at the same head, labels and draft state untouched — the evaluator reported PR
  hygiene rather than fixing it, as instructed.
- **Quality of the pass:** the evaluator reproduced RED **itself** at `0bd8ba83` in a throwaway
  worktree (F-1 `4 passed/1 failed`; F-2 `0/4`; F-3 `1/1`; F-4 `16 passed/2 failed`, matching the
  worklog verbatim), re-ran every static, derived-asset, and scoped gate, re-verified the Tier-A
  claims instead of adopting them, and confirmed `review-threads … unanswered=0`.
- **Follow-ups — all coordinator-owned, none require an S5 code change:**
  - **F-A (medium, gates merge).** No runtime verdict exists at the final head: `e2e-cli` was
    _skipped by classification_ at every repair head, and the only `scaffold.runtime` evidence is
    run `33286544110` at `0bd8ba832` (26/27, red on the #1734 baseline; PR #1736 still open). The
    repair diff is runtime-monotonic, so this is not a new S5 risk — but the sign-off condition
    "runtime verdict = CI `scaffold.runtime` on this head" is unmet. Coordinator dispatches
    `e2e-cli.yml` at the merge head after #1736 lands/rebase and records the run id.
  - **F-B (low).** `README.md:135` and `plugins/ai/README.md:72` still document the pre-F-3
    completion line (`Installed … on port <n>`), which F-3 removed for unpinned installs. Handed to
    the 0.0.7 docs lane as an S11 (#1723) row.
  - **F-C (low).** `status:ready-merge` + `impl-eval:skip` are live on #1740 from the **voided**
    cycle-2 verdict, and the PR is not draft. Coordinator decides whether this cycle-3 `PASS`
    re-grounds those labels or whether they are stripped and re-applied. This session does not
    relabel.
  - **F-D (low).** #1717 box 6 reads "Will close … #1365" while the PR body correctly carries
    `Part of #1365` per D-18. Coordinator amends the box text.
  - **F-E (low).** The named 0.0.8 removal issue cited by all four `@deprecated` JSDocs
    (auth/sagas/triggers/streams) is **not filed** — `gh issue list --search` returns nothing, so
    D-14's "named issue" does not yet resolve to a number. A draft exists
    (`deprecation-issue-draft.md`) and the PR body says the supervisor files it. **Not filed by this
    session:** creating a GitHub issue is central-state mutation, which this run's mandate reserves
    to the coordinator. Surfaced as an explicit ask instead.
- **Lesson worth promoting (evaluator's, endorsed):** a `pull_request`-triggered `e2e-cli` run that
  is _skipped at classification_ is **not** runtime evidence. "Runtime verdict = CI on this head"
  must be re-earned per head via an explicit workflow dispatch with the run id recorded. This is the
  same class of error as D-23/D-26 — a gate believed covered that never actually executed.

## D-29 — 2026-08-30 — S6 rebased onto the settled S5 head (validated before force-push)

- **What:** S6 (#1718 / PR #1743, draft) was stacked on S5 at `0bd8ba832`. S5's repair advanced that
  branch to `aa822069`, so S6 was rebased `--onto aa822069 0bd8ba832`.
- **Validated in a throwaway worktree BEFORE touching the real branch** — all six commits replayed
  with **zero conflicts**, then at the rebased head:
  - `deno task check` → exit 0
  - `deno task check:aspire-host-ports` → exit 0 (957 files, no pinned host ports)
  - `deno task check:assets-barrel` → exit 0 (no regeneration needed)
  - `deno task check:publish-assets` → exit 0
- **The specific risk that had to be cleared:** S5's F-4 hardened `check-aspire-host-ports.ts` from
  per-line to **full-text** matching, which can newly catch multiline
  `withHttpEndpoint({ port: … })` and `ctx.port(a,\n b)` shapes. S6 is a generator slice that emits
  endpoint code, so the hardened gate was the plausible break. It scans clean — S6 emits no pinned
  host port. Checking this before the force-push, rather than after CI, is the direct application of
  the D-23/D-26 lesson.
- **Applied:** `1fa5aeec` → `564d465c`, force-pushed with
  `--force-with-lease=…:1fa5aeec13d965ddd20806fa373f090e427cf5f4`. Draft state and base branch
  unchanged. Rewriting published commits is normally barred for implementation lanes; this is the
  supervisor deliberately restacking his own topic's draft branch after its base moved, with no
  active S6 author thread (the pre-migration thread `01a0506f…` did not survive), and it is recorded
  here for that reason.
- **Next for S6:** Tier-A slice review at `564d465c`, then Phase-B runtime receipts under a
  serialized lease, then an independent IMPL-EVAL. Phase A alone does not earn ready state.

## D-30 — 2026-08-30 — `doc:lint` is not a valid gate for prose-only slices (affects S11 and S13 acceptance)

- **Reported by the 0.0.7 docs lane; verified here.** `deno task doc:lint` bare → **exit 1**; the
  task is `.llm/tools/run-deno-doc-lint.ts`, which **requires `--root`** and wraps
  `deno doc --lint`, i.e. it lints **TypeScript JSDoc**, not Markdown prose.
- **Consequence:** #1723 (S11) lists `doc:lint` as a required acceptance gate, but S11 consists
  mostly of prose-only diffs, for which the gate is **not applicable at all**. Inventing a `--root`
  to make it run would manufacture a green that proves nothing.
- **Action:** the docs lane records it as `N/A` with that reason and flags it to the coordinator.
  **S13 inherits the same acceptance text and needs the same note** — recorded here so the S13 brief
  carries it rather than rediscovering it. Any Aspire slice whose diff is prose-only should record
  `doc:lint: N/A (requires --root; lints TS JSDoc, not prose)` rather than skipping it silently.
- **Same failure family as D-23/D-26 and the evaluator's `skipped ≠ pass` lesson:** a gate that is
  listed but cannot execute is as misleading as a gate that is omitted. Three lanes have now hit
  "believed covered, never executed" in three different shapes.

## D-31 — 2026-08-30 — S5 F-A host runtime lease cannot be exercised on the NAS `ai-agents` container

- **Severity:** significant (environment, not product). **Lease granted, preflight FAILED, no
  runtime started, lease returned unused.**
- **What was granted:** the coordinator's first serialized host runtime lease, scoped to S5 F-A
  only: one-pass `deno task e2e:cli` (`scaffold.runtime --cleanup`) from
  `/home/agent/projects/netscript/worktrees/007-aspire-s5` at exact head `aa822069`.
- **Preflight facts (all read-only, 2026-08-30T08:3xZ):**
  - S5 worktree clean at `aa822069e10f…`, equal to `origin/fix/aspire-13-5-s5-literal-ports`.
  - Zero-state re-proven: `aspire ps --format Json --nologo --non-interactive` → `[]` exit 0;
    `docker ps -a` on `tcp://netscript-dind:2375` → header only.
  - `aspire doctor --non-interactive` → **`Summary: 3 passed, 4 warnings, 1 failed`**. The failure
    is **`.NET SDK not found`** (`dotnet` is on no PATH entry; no `~/.dotnet`, `/usr/share/dotnet`,
    `/usr/lib/dotnet`, `/opt/dotnet`; `.mise.toml` pins only `deno` and `aspire`;
    `mise ls-remote dotnet` returns nothing). `aspire start` for the generated AppHost cannot boot
    without the SDK, so the suite would fail at the AppHost step by construction.
  - Second prerequisite gap: `Docker client version 27.5.1 is below minimum required 28.0.0` (Aspire
    warning, flagged `← active`).
  - Third, unproven layer: containers live in the remote `netscript-dind` sandbox (`10.4.12.16`)
    while this container is `10.4.12.18`, so published container ports are **not** on `localhost`.
    Every runtime gate in `packages/cli/e2e/src/application/gates/scaffold/*` probes `127.0.0.1` /
    `localhost`, and DCP endpoint proxying against a remote Docker host has never been exercised
    here. Even with the SDK installed, a green is not assured.
  - S2's runtime probes (V1–V12, `slices/s2/review-tier-a.md`) were taken **pre-migration on WSL**
    (`netscript-aspire-13-5-s2/.llm/tmp` paths). No `scaffold.runtime` run has ever executed on the
    NAS; the only NAS "runtime" evidence to date is the zero-state proof itself.
- **Why the supervisor did not self-remedy:** installing a .NET 10 SDK and a Docker ≥ 28 client are
  host-provisioning actions on a container already flagged over-subscribed (D-25/D-25a: 7.7k
  zombies, inotify ceiling) — the same class the run classifies as "human/host action — flagged, not
  attempted". A user-local `dotnet-install.sh` would also be an unpinned toolchain outside
  `.mise.toml`, i.e. a second source of truth for a version the repo pins in 14 places.
- **Why the run was not attempted anyway:** a suite that must fail at AppHost boot yields an
  environment red, not the F-A runtime verdict; D-23/D-26/D-28 already record that a gate which did
  not really execute is not evidence. Burning the lease on a known-red would also create scaffold
  dirs and Postgres containers to tear down for nothing.
- **Options for the coordinator (one decision):**
  1. **CI dispatch (the F-A wording in D-28):**
     `gh workflow run e2e-cli.yml --ref
     fix/aspire-13-5-s5-literal-ports` — the runner installs
     .NET 10 + Aspire CLI 13.4.6 (the exact toolchain `main` pins) with local Docker;
     `scaffold-runtime` uses the `e2e-scaffold-runtime-global` mutex with
     `cancel-in-progress: false`, so it **queues** behind other lanes rather than cancelling them.
     Record the run id as the F-A receipt. Not executed by this session: expensive-gate dispatch is
     coordinator-owned.
  2. **Provision the NAS** (host action): .NET 10 SDK on PATH (ideally pinned in `.mise.toml`),
     Docker client ≥ 28, then re-prove `aspire doctor` 0 failed and one throwaway `-p` container
     reachable on `localhost` before re-granting the lease. This unblocks S6/S3/S7 Phase-B too,
     which need the same stack.
  3. **Retarget the host lease** to the WSL host that ran S2, if it still exists.
- **Consequence for the queue:** every Phase-B workstream (S6 listener-unreachable fixture, S3
  telemetry envelopes, S7 live #1429 reproduction) is blocked by the same prerequisites; leases
  granted against this host will fail preflight identically until option 2 is done.

## D-32 — 2026-08-30 — `e2e:cli` is not in the durable gate catalog

- `.llm/tools/gates/catalog.ts` (`GATE_CATALOG`) allowlists check/lint/test/quality/docs gates but
  **not** `e2e:cli`, so `run-gate.ts` cannot wrap the runtime suite and no atomic
  `.llm/tmp/gate-receipts/<job>/` receipt can be produced for it locally.
- Durable evidence for a local runtime run is therefore the runner's own report:
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty --report <path>.json` (the same
  file CI uploads as `e2e-cli-scaffold-runtime-report`), copied into `slices/s5/receipts/` with its
  SHA-256 and the exact head. The plain `deno task e2e:cli` form writes no report and is not a
  receipt.
- Adding an `e2e-scaffold-runtime` catalog entry is a natural **S10 (#1722)** row (E2E gate
  upgrades), not something to slip in under a lease. Recorded here so the next lease holder does not
  rediscover it.

## D-33 — 2026-08-30 — S5 F-A executed on the NAS: 26/27, the one red is baseline #1734 (Fresh hydration), AppHost never reached

- **Lease:** the single authorized `e2e:cli` attempt at exact head `aa822069` from
  `worktrees/007-aspire-s5` (clean, equals origin), after the coordinator provisioned the parent
  mise toolchain (dotnet `10.0.400`, node `24.20.0`). Re-run preflight under
  `~/.local/bin/mise exec`: `aspire doctor` → **4 passed, 4 warnings, 0 failed** (.NET PASS, DCP
  ephemeral cert PASS; Docker client 27.5.1 < 28.0 remains a warning); `aspire ps` → `[]`; dind
  `docker ps -a` → empty. (`mise` is a broken shell function in the supervisor session; the binary
  path works — recorded so the next lease holder does not lose ten minutes on it.)
- **Command:**
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty --report
  .llm/tmp/e2e-report-scaffold-runtime-aa822069.json`
  — `08:41:36Z` → `08:43:35Z`, **exit 1**, `summary passed=26 failed=1 skipped=0`.
- **Exact failing gate:** `generated.quality-negative` (critical, `failureClass: assertion`, one
  attempt, not retried). The generated workspace's `deno task check` fails with **`TS2345`** at
  generated `packages/fresh/src/application/query/hydration.ts:43`
  (`hydrate(queryClient, dehydratedState)`: `readonly unknown[]` mutations not assignable to
  `DehydratedMutation[]`). This is byte-for-byte the baseline Fresh defect **#1734**, whose fix PR
  **#1736** (`fix/fresh-query-hydration-readonly-state`, still draft at `eb7656292`) rewrites
  exactly that file (+193/−1). Same shape as CI run `33286544110` (26/27 at `0bd8ba832`) and the
  S1/S4 park reason. **Not an Aspire, Docker, S5, or host defect.**
- **What the run did prove on this host:** 26 gates green including `scaffold.init`, all four
  official plugin installs, DB init/generate/seed against the dind Postgres (`runtime.*` DB gates),
  generated typecheck of the Aspire helpers (`aspire/.helpers/*.mts` + `apphost.mts` exit 0), and
  `cleanup.aspire-stop`. The NAS can now execute the suite up to the critical gate.
- **What it did not reach:** the critical gate aborts the suite before `aspire start`, so the
  AppHost boot / DCP / endpoint-proxy path against the remote dind (`10.4.12.16` ≠ `10.4.12.18`) and
  the Docker-27.5.1-vs-28 question are **still unexercised**. No Docker-version-specific failure
  occurred, so no sandbox upgrade boundary is surfaced by this run — it stays an open risk for the
  first Phase-B lease.
- **Receipt (durable):** `slices/s5/receipts/e2e-scaffold-runtime-aa822069-nas.{json,log,meta.txt}`
  — SHA-256 `93b0bc68…6730` (json), `537c5535…198e` (log), `f269ee14…f392` (meta). Runner `--report`
  form per D-32; the generated-project log is archived outside the repo at
  `/home/agent/observability/aspire-13.5/s5-fa-plugin-smoke-20260830-104136.log`.
- **Cleanup to zero:** suite `--cleanup` ran;
  `agentic:leak-check --slice-dir slices/s5 --worktree
  007-aspire-s5` →
  `probes aspire ok / docker ok, survivors []` (exit 0); `agentic:teardown` preview → nothing to
  apply, nothing escalated. The run-owned 534 MB generated project under the S5 worktree's ignored
  `.llm/tmp/cli-e2e/` was removed (path-contained, created by this run). Final proof: `aspire ps` →
  `[]`, `docker ps -a` → empty. **Lease released.** No unknown resource touched; no retry.
- **F-A verdict:** `aa822069` is runtime-**BLOCKED on the #1734 baseline**, exactly like S1 and S4 —
  not red on its own diff. The merge-head runtime verdict becomes obtainable only after #1736 merges
  and S5 rebases (or on a throwaway S5+#1736 merge head, which would be a second attempt and
  therefore a new coordinator grant, not a retry of this one).

## D-34 — 2026-08-30 — S6 IMPL-EVAL cycle 2 `PASS` (phase A); inotify ceiling now hits `aspire restore`

- **Verdict:** `PASS — phase A only` at `564d465c` (base S5 `aa822069`), independent Claude · Fable
  5 · medium session `988f2cdc…` (`slices/s6/evaluate-cycle-2.md`, PR #1743 comment
  2026-08-30T08:58:43Z). All cycle-1 findings H-1/H-2/M-1/M-2 closed on executed evidence; L-2 (no
  slice-6 comment) noted, non-blocking. Evaluator verified the supervisor's D-19 receipt (module
  SHA-256s, raw tsc, emitted lines byte-identical to its own generator render and its own scratch
  `init`). Supervisor verified non-mutation: eval worktree clean, PR draft, labels unchanged, head
  unchanged.
- **New host finding:** the evaluator's own `aspire restore` reproduction aborted twice with
  `AppHost server process exited … Exit code: 134`, CLI log root cause
  `IOException: The
  configured user limit (128) on the number of inotify instances has been reached`
  — D-25a, minutes after the supervisor's restore succeeded on the same host. **Consequence for
  Phase-B leases:** `aspire start` needs more watchers than `restore`; a lease granted while the
  ceiling is saturated will fail as environment, not product. **Host action (human):** raise
  `fs.inotify.max_user_instances` (and reap the D-25 zombies) before the S3 Phase-B lease is
  granted; the lease holder must record `cat /proc/sys/fs/inotify/max_user_instances` and the
  current instance count in preflight.
- **Not covered by the PASS:** Phase B (`runtime.health.listener-unreachable`, both-tier
  `healthReports` receipts, `scaffold.runtime`/`quickstart`) remains lease-gated; #1718 boxes
  unchecked and `status:blocked` stay until then. S6 is now the **settled base for S8**.

## D-35 — 2026-08-30 — `/home/codex` is gone on the NAS; `launch-codex-slice` needs `--dest`

- The launcher stages the brief at `/home/codex/<slug>-brief.md` by default; that path was a symlink
  to `/home/agent` after the migration and no longer exists, so the S8 launch failed at `stage` ("No
  such file or directory") until `--dest /home/agent/<slug>-brief.md` was passed. `--user node`
  remains required (D-21). Tooling follow-up: default the staging dir from the resolved user home
  instead of a fixed `/home/codex` (candidate for the agentic-suite backlog, not an Aspire slice).
- Also this checkpoint: the coordinator released the S3 Phase-B lease unused because the shared
  inotify ceiling is hit (D-34). Standing rule until infrastructure repairs the quota and a fresh
  serialized lease is granted: **no Phase-B runtime; Aspire/DinD stay at zero; S8 static only.**

## D-36 — 2026-08-30 — D-25 zombie prerequisite retired; Phase-B blocker is the inotify ceiling only

- **Coordinator probe (2026-08-30T09:08Z), verified read-only by this supervisor:** container PID 1
  is `tini`; `ps -eo stat= | grep -c '^Z'` → **0**; 115 processes total (was 7,844 with 7,734
  zombies at D-25); `aspire ps` → `[]`; dind `docker ps -a` → empty.
- **Effect:** the D-25 "reap the zombies" host prerequisite (restated in D-34/D-35 and in
  evaluator/implementer briefs as known infra) is **retired** and must not be carried forward.
  `hybrid-launcher_test.ts` cancellation-survivor reds can no longer be attributed to zombie
  pressure; if one recurs it is a fresh finding, not known infra.
- **Remaining Phase-B blocker:** the shared inotify-instance ceiling only
  (`fs.inotify.max_user_instances` = **128**, D-25a/D-34; hit by `aspire restore` during the S6
  evaluation) plus ordinary branch dependencies (S6 Phase B after S5/S1 land; S7 Phase B stacked on
  S3). A fresh serialized lease is granted by the coordinator after infrastructure raises the quota;
  nothing else is required from the host side for S3 Phase B.
- Briefs already dispatched with the D-25 wording (S8 thread `01a051e6…`) are unaffected: the
  wording only told the thread to report and not chase such reds, which remains correct.

## D-37 — 2026-08-30 — zombie-waived gate re-run green on the repaired host; dind authoritative; Docker < 28 = warning only

- **Environment authority (coordinator):** `netscript-dind` restarted and fully operational —
  verified here: `getent hosts netscript-dind` → `10.4.12.16`, `docker version` client/server
  27.5.1, `docker info` containers 0; project mise sets `DOCKER_HOST=tcp://netscript-dind:2375`. All
  Aspire/Docker work uses this sandbox with exact owned cleanup. The `aspire doctor` "Docker client
  27.5.1 < 28.0" line is **a warning only — not a failure and not a dispatch blocker** (supersedes
  the D-31/D-33 framing of it as an open risk).
- **Re-run of the gate previously classified red on zombies (D-25), at S5 exact head `aa822069`, PID
  1 `tini`, 0 zombies:** `.llm/tools/agentic/claude/hybrid-launcher_test.ts` → **10 passed / 0
  failed** (`slices/s5/receipts/hybrid-launcher-rerun-aa822069-tini.json`, SHA-256 `bdf43aa5…e033`).
  The D-25 classification is closed by a fresh green, not by waiver.
- **Still red, still the inotify ceiling:** `.llm/tools/agentic/codex/codex-follow_test.ts` → 2
  passed / 1 failed, `Too many open files (os error 24)` at `Deno.watchFs`
  (`slices/s5/receipts/codex-follow-rerun-aa822069-tini.json`, SHA-256 `ba2253c3…c75a`). This is
  D-25a, the **only** remaining host quota blocker (`fs.inotify.max_user_instances` = 128); it gates
  Phase-B runtime and this one watcher test, nothing else.
- Worktree `007-aspire-s5` stayed clean; Aspire `[]`, dind empty after the runs.

## D-38 — 2026-08-30 — S8 first turn cut by the launcher client's timeout; resumed on the same thread

- **What:** `agentic:launch-codex-slice` was wrapped in `timeout 300` by this supervisor. The
  launcher streams the child's turn; at 09:05:55Z (≈300 s after the 09:00:59Z start) the client was
  killed and the S8 thread's turn stopped mid-survey — rollout ends on a `custom_tool_call_output` +
  `token_count` with **no** `task_complete` and no `turn_aborted`, worktree `007-aspire-s8`
  untouched at `564d465c`, and `codex-status --pretty` no longer lists the thread (8-row recency
  cap), which is why the monitor reported "not listed".
- **Fix applied:**
  `agentic:codex-resume --thread-id 01a051e6-90d4-7e50-a91e-ac4bd23b880c
  --worktree …/007-aspire-s8 --user node --message "<steering>"`
  run **in the background without a timeout** (steering text: resume the brief, static only,
  restore-only D-19 with the inotify stop rule, tini/0-zombie host so no zombie-infra
  classification, end with a status line). Same thread — never a second launch at that worktree.
- **Rule for this run:** never wrap `launch-codex-slice` / `codex-resume` in `timeout`; run them
  backgrounded and wake on the rollout (`task_complete` / `turn_aborted`) or the worktree head. Use
  `codex-status --sessions <n>` larger than the default when more than 5–8 threads are live.
