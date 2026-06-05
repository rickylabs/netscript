# Drift Log: NetScript Public Release Program (master)

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine,
or current-state documentation.

## 2026-06-04 — Extraction mechanism reframed: reuse maintainer CLI

- **What:** S0 extraction will reuse the existing `netscript-dev` maintainer CLI
  (`init` from local sources, `sync packages`, `sync plugin`, `sync templates`,
  `probe monorepo`, `test scaffold`) composed into a `release eject` orchestrator,
  rather than a bespoke `genesis.ts` copy script proposed in the first brainstorm.
- **Source:** `packages/cli/docs/maintainer-cli.md`; `packages/cli/maintainer.ts`;
  `packages/cli/src/maintainer/` layout.
- **Expected:** First brainstorm proposed adding a new eject command from scratch.
- **Actual:** The producer source-copy engine already exists; the public-vs-
  maintainer (consumer-vs-producer) split is already encoded in the CLI.
- **Severity:** significant
- **Action:** propose-update (folded into RELEASE-PROGRAM § 4 and S0 run card)
- **Evidence:** `maintainer-cli.md` commands `sync packages` = "Copies local
  package sources into an existing scaffolded workspace"; `public-cli.md` =
  generated workspaces "do not copy package source from a local monorepo".

## 2026-06-04 — Aspire reframed: bump, not C#→TS migration

- **What:** S4 is a version bump `Aspire.AppHost.Sdk 13.2.2 → 13.4.x` (+
  `CommunityToolkit.Aspire.Hosting.Deno 13.1.0 → 13.4.x`), not a C#→TypeScript
  apphost migration. The CLI already scaffolds a TS apphost. The "full runtime,
  less generated artifact" refactor lands with the native Deno apphost at 13.5.
- **Source:** user direction; `dotnet/AppHost/AppHost.csproj` (SDK 13.2.2,
  `net10.0`, CommunityToolkit Deno 13.1.0); `microsoft/aspire#16218` (milestone 13.5).
- **Expected:** First brainstorm framed S4 as a C#→TS apphost migration (Aspire 13.4 GA).
- **Actual:** TS apphost already in use via the scaffold; only the version bump is
  needed now; the runtime refactor is gated on 13.5.
- **Severity:** significant
- **Action:** propose-update (folded into RELEASE-PROGRAM § 6 and S4 run card,
  detailed in `notes/ASPIRE-13.4-13.5.md`)
- **Evidence:** `AppHost.csproj` package references; #16218 work-to-track list.

## 2026-06-04 — Version line confirmed `0.0.1-alpha.0` (not `0.9.0-alpha.1`)

- **What:** The program adopts lockstep `0.0.1-alpha.0`, matching the prior
  package-quality run, not the `0.9.0-alpha.1` alternative floated in brainstorm.
- **Source:** user direction.
- **Expected:** Brainstorm recommended `0.9.0-alpha.1` to signal near-1.0 maturity.
- **Actual:** User locked `0.0.1-alpha`.
- **Severity:** minor
- **Action:** accept. Consequence: the CLI's drifted `1.0.0` must be reset to
  `0.0.1-alpha.0` during S0; no other unit forks its line.
- **Evidence:** `packages/cli/deno.json` `"version": "1.0.0"`; prior run cadence
  table (`PLAN.md` § 10).

## 2026-06-04 — Branch grain corrected: phase groups, not task sub-branches

- **What:** RELEASE-PROGRAM § 9–11 rewritten so each supervisor decomposes into
  a small number of **phase groups** (capability-scoped, one sub-PR + evaluator
  pass each), not the fine task-level sub-branch lists in the first draft (e.g.
  a branch per CLI command). The program now adopts the proven
  `supervisor-workflow.md` + `phase-registry.md` model verbatim.
- **Source:** user review of RELEASE-PROGRAM; PR #96
  (`feat/plugin-platform-impl`); `feat-plugin-platform-impl--supervisor/`
  `phase-registry.md` (groups A–H) + `supervisor-workflow.md`.
- **Expected:** First draft listed 5–6 micro sub-branches per supervisor.
- **Actual:** The merged precedent uses ~8 capability groups across the whole
  platform; a single command/file is a commit slice, not a branch.
- **Severity:** significant
- **Action:** propose-update (applied to § 9, § 10, § 11). Follow-on: promote
  `supervisor-workflow.md` → `.llm/harness/workflow/supervisor.md` and the
  `phase-registry.md` template per its § 8 promotion criteria.
- **Evidence:** PR #96 body ("Merged implementation/history PRs #86–#95");
  `phase-registry.md` outline (Group A Foundation … Group G Polish);
  `supervisor-workflow.md` §§ 2–7.

## 2026-06-04 — Supervisor workflow promoted into the harness

- **What:** Generalized the proven supervisor model into reusable harness docs so
  every future supervisor inherits it without referencing a buried run dir:
  created `.llm/harness/workflow/supervisor.md`,
  `.llm/harness/workflow/escalation.md`,
  `.llm/harness/templates/phase-registry.md`,
  `.llm/harness/templates/agent-briefing.md`; wired pointers into
  `workflow/activation.md` and the `netscript-harness` SKILL; updated
  RELEASE-PROGRAM § 9 / § 11 to reference the harness paths.
- **Source:** user request ("wire that in"); plugin-platform
  `supervisor-workflow.md` § 8 promotion criteria (PR #96 satisfied them).
- **Expected:** Prior draft left this as a follow-on / possible S0 task.
- **Actual:** Executed in the master run; promotion is complete.
- **Severity:** significant
- **Action:** accept (done). The plugin-platform run dir remains for history only.
- **Evidence:** new files under `.llm/harness/workflow/` + `.llm/harness/templates/`;
  edits to `.llm/harness/workflow/activation.md` and
  `.agents/skills/netscript-harness/SKILL.md`.

## 2026-06-04 — Two-repo execution model + gitignored eject target

- **What:** Clarified that **S0 is the only supervisor that runs in this repo**
  (`netscript-start`); it ejects into a **gitignored `.genesis/netscript`** (not
  `../netscript` above the workspace) and pushes to `rickylabs/netscript`. **S1–S6
  run in the new repo**; the `netscript-start` supervisor PR (#97) is the tracker.
  S0 work is isolated on a worktree (`worktrees/repo-genesis`, branch
  `feat/repo-genesis`).
- **Source:** user direction.
- **Expected:** Earlier drafts ejected to `../netscript` and implied all S0–S6 ran here.
- **Actual:** Ejecting above the workspace risks tooling/path issues; only S0 belongs here.
- **Severity:** significant
- **Action:** propose-update — applied to RELEASE-PROGRAM § 4 + § 9, S0 `plan.md` +
  `phase-registry.md`, `.gitignore` (`.genesis/`), and PR #97 body.
- **Evidence:** `.gitignore` already ignores `worktrees/`; added `.genesis/`.

## 2026-06-04 — S0 gate raised to a working scaffold E2E (CI baseline)

- **What:** S0's exit gate now requires the **new repo's scaffold E2E to fully
  pass** (`netscript init` → enable plugins → generate registries →
  `deno task check` + `deno task test` against the local workspace) — the
  baseline for the S3/S4 scaffolded-project CI. Also removed the erroneous "29
  created+linked on JSR" from the S0 card exit (that is S3).
- **Source:** user direction.
- **Expected:** S0 exit was closure + dry-run + `test scaffold`.
- **Actual:** The real proof the extraction worked is a *runnable* scaffold from
  the new repo; it doubles as the future CI baseline.
- **Severity:** significant
- **Action:** applied to RELEASE-PROGRAM § 7 + § 10 S0 card; S0 `plan.md` +
  `phase-registry.md`.
- **Evidence:** PR #96 body "CI Gate Gap" (scaffolded-project CI recommendation).
