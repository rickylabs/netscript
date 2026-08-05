use harness

# Slice: root-cause the intermittent `aspire restore` cancellation (#1227)

## SKILL

Activate `netscript-harness`, `netscript-tools`, `netscript-deno-toolchain`, and the internal
`aspire` diagnostic skill (`.agents/skills/aspire`). Per D6 no local PLAN-EVAL.
Route: openai · gpt-5.6-sol · **xhigh** (owner-specified — this is an investigation, not a patch).

## Read this first: we have been treating the symptom

Two rounds of work on #1227 bounded the failure and classified it. **Neither round asked what
`aspire restore` actually does or why a task is being cancelled.** The owner has called that out
and it is correct. Your job is to UNDERSTAND the failure. A workaround that has not been
explained is not an outcome here — if you end the slice with a retry loop and no diagnosis, the
slice failed.

## The evidence you start from

Two consecutive `quickstart.walk` runs against published `0.0.5-canary.10`, same runner class:
- run **30959430176** — step 4 (`aspire restore` + `start`): **PASS in 22.3s**
- run **30961102523** — step 4: **FAIL in 180.1s**,
  `aspire restore failed (6): ❌ Failed to prepare: A task was canceled. ❌ Failed to prepare AppHost server.`
Earlier occurrences: canary.6 and canary.9 pinned E2Es, both `2×900.1s` (1800s) before the
timeout was bounded; also reproduced LOCALLY on the dev machine at the same 2×900.1s, so it is
**not CI-only**. Exit code 6.

Facts already established, do not re-derive:
- We pin **Aspire CLI 13.4.6**, which IS the newest on the stable NuGet channel
  (13.4.1→13.4.6; 13.4.6 released 2026-06-20). Set in `.github/workflows/e2e-cli-prod.yml`
  (`ASPIRE_CLI_VERSION`, plus a `nuget-aspire-…-13.4.6-v1` cache key).
- What restore does, per our own source: it downloads the TypeScript AppHost SDK modules and
  rebuilds `.aspire/modules/aspire.mts` from the NuGet packages declared in `aspire.config.json`
  (`packages/cli/src/kernel/templates/aspire/generate-aspire-config.ts`). So it is a
  NuGet-restore-shaped operation and feed-dependent.

## What to actually do

1. **Read the log we have been throwing away.** The Aspire CLI writes
   `~/.aspire/logs/cli_<timestamp>_<id>.log` and the failing run named one explicitly. PR #1305
   (draft, same issue) already added capture in its S1 — build on it, do not restart it. Get a
   failing log and read it. `aspire doctor --non-interactive --nologo` is also in scope.
2. **Determine what is cancelling, and who cancels it.** "A task was canceled" is a
   .NET `OperationCanceledException` surfacing — find whether it is an internal timeout, an HTTP
   client timeout against a NuGet feed, a container-runtime probe, or a CLI defect. Name the
   component with evidence, not a hypothesis.
3. **Check upstream properly.** Search `dotnet/aspire` issues and discussions for this signature
   (`Failed to prepare AppHost server`, `A task was canceled`, restore hangs). Check whether a
   newer build exists on their **daily/canary channel**, not only the stable NuGet feed — 13.4.6
   is ~6 weeks old. If nothing upstream describes it, say so plainly: that means **we should
   file it upstream**, and you should draft that issue (minimal repro, versions, both run ids,
   the log) as a deliverable in the slice artifacts. Do not open it yourself; hand it to the
   orchestrator.
4. **Only then** decide the fix: retry-on-signature, pinned/pre-warmed package cache, a version
   move, or an upstream-blocked verdict. Whatever you choose must follow from (1)–(3).

## Acceptance

- [ ] A failing `~/.aspire/logs/cli_*.log` is captured and READ, with the cancelling component
      named and quoted
- [ ] Upstream state established: existing issue linked, or a drafted issue body if none exists
- [ ] Version currency established including the daily/canary channel, not just stable
- [ ] A fix that follows from the diagnosis — or an honest "upstream-blocked, here is the
      mitigation and why it is only a mitigation"
- [ ] **Proof by N consecutive green published-canary walks**, not one. One green run cannot
      distinguish a fix from the lucky half of a coin flip; that is how this defect survived
      two rounds already.

Worktree `/home/codex/repos/ns005-aspireroot`, branch `research/aspire-restore-root-cause`
(NO upstream; explicit-refspec push). Coordinate with PR #1305 rather than duplicating it —
if your diagnosis supersedes it, say so and I will close it.
