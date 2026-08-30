use harness

## SKILL

Read `AGENTS.md`, `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/aspire/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`, and `.agents/skills/netscript-pr/SKILL.md`. You are the
**S3 Phase-B implementation thread** (Codex · GPT-5.6 Sol · medium) for #1715 / PR #1741
(`test/aspire-13-5-s3-fixture-recapture`, draft, Phase A IMPL-EVAL cycle 2 = PASS at `fe4f496bd`).
The supervisor holds the **serialized host runtime lease** for this phase only; the lease is the
authorization for exactly one isolated AppHost at a time and nothing else.

## Context

- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s3` on
  `test/aspire-13-5-s3-fixture-recapture` at `fe4f496bd` (created from `origin/`; upstream unset —
  push explicitly). Base = `main`. Supervisor run dir (read-only for you):
  `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/`
  (`plan.md` D-5/D-17, `slices/s3/brief.md`, `slices/s3/evaluate-cycle-2.md`, `drift.md`
  D-25/D-31/D-33).
- Host: NAS `ai-agents`; Deno 2.9.5, Aspire CLI 13.5.3, dotnet 10.0.400 + node 24.20.0 through
  `/home/agent/.local/bin/mise exec --` (the `mise` shell function is broken; use the binary).
  `DOCKER_HOST=tcp://netscript-dind:2375` (remote dind `10.4.12.19`, Docker client/server 28.5.2;
  this container is `10.4.12.18`). **Docker client 27.5.1 is below Aspire's 28.0 minimum (warning)**
  and the AppHost/DCP path against the remote dind has **never been exercised on this host** (D-33).
  Your first `aspire start` is therefore also that probe.
- Contract for the capture is the branch's own `packages/mcp/tests/fixtures/telemetry/README.md`
  "Pending Aspire 13.5.3 capture (phase B)": start the exact 13.5.3 AppHost, wait for required
  resources, trigger the scaffolded `health-check` worker job,
  `GET <dashboardUrl>/api/telemetry/resources` and `GET <dashboardUrl>/api/telemetry/spans`, save
  raw envelopes as `aspire-13.5.3-resources.json` / `aspire-13.5.3-spans.json`, add
  `aspire-13.5.3-fixture.ts`, add the 13.5.3 case beside the kept 13.4.6 case in
  `telemetry-live-fixture_test.ts`, and promote the parity row `pending-lease →
  required`. Never
  fabricate, copy-forward, or hand-edit an envelope. Redact the dashboard URL/token in committed
  text; never commit secrets.

## Steps

1. Preflight, record verbatim in `.llm/runs/<your run dir>/worklog.md`: `aspire doctor` (expect 0
   failed), `aspire ps --format Json --nologo --non-interactive` → `[]`, `docker ps -a` → empty.
2. Generate the fixture project under the worktree's ignored `.llm/tmp/` with
   `deno run -A
   packages/cli/bin/netscript.ts init` (postgres + service + workers plugin so the
   `health-check` job exists); ensure its `aspire.config.json` is the 13.5.3 SDK (if the branch
   still pins 13.4.6 pre-S1, set the **scratch** config to 13.5.3 — scratch only, no product change)
   and `aspire restore` it.
3. `aspire start --isolated` in that scratch AppHost (one AppHost only). Register it in the run
   resource registry (`.llm/tools/agentic/teardown/run-resources.ts`) so `agentic:leak-check` /
   `agentic:teardown` can prove ownership. **If start fails on the container runtime version (Docker
   < 28) or on endpoint proxying to the remote dind:** stop, keep the exact error output as a
   receipt, tear down to zero, and report — do not work around it, do not retry, do not touch
   Docker.
4. `aspire wait` the required resources; trigger the `health-check` worker job (per README); capture
   the two envelopes from the dashboard URL reported by `aspire ps`; save them + fixture + test
   case; flip the parity row; run the scoped gates listed in Phase A (`packages/mcp`,
   `packages/telemetry`, `packages/cli/e2e`, `quality:scan`, `arch:check`,
   `check:mcp-export-corpus`, unit tests) — the parity test must be green with `required`.
5. Teardown: `aspire stop --apphost <exact appHostPath from aspire ps>`;
   `deno task
   agentic:leak-check -- --slice-dir <run dir> --worktree <worktree>` → survivors
   `[]`; `agentic:teardown` preview, `--apply` only for positively owned resources; final
   `aspire ps` → `[]` and `docker ps -a` → empty, recorded verbatim. Remove the scratch project.
6. Commit by slice (envelopes+fixture, test+parity, run artifacts), push, comment on PR #1741 with
   `## [PHASE: IMPL] S3 phase B` (commit hash, capture date, CLI 13.5.3, AppHost identity redacted,
   lease evidence, gate results). Do not mark ready, do not merge, do not relabel. Report the
   teardown proof to the supervisor as your last line.

## Amendment 2026-08-30 ~09:31Z (same-thread steering, before first runtime start)

The staged copy the thread received still carried the pre-D-39 host paragraph (Docker 27.5.1, dind
10.4.12.16, inotify 128). The correction above was sent on the same thread
`01a05200-345d-7ef0-bb18-30c4dacdaf4a` via `agentic:codex-resume` before any AppHost started; no
second thread was created. Endpoint/proxy probe and every cleanup rule are unchanged.
