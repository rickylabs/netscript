use harness

## SKILL

- netscript-harness — run lifecycle, slice review gate, evaluator separation (you never self-certify).
- netscript-tools — scoped check/lint/fmt wrappers, gate receipts via `.llm/tools/gates/run-gate.ts`, lock hygiene.
- netscript-deno-toolchain — `deno task deps:*` wrappers; never hand-roll registry curls.
- netscript-pr — branch/PR/labels/closing-keyword rules; draft PR on first commit.
- netscript-cli — scaffold/E2E command surface (`deno task e2e:cli …`).
- aspire — Aspire CLI facts (13.4.6 baseline); you must not start an AppHost or upgrade the host CLI.

## Context

You are the GPT-5.6 Sol implementation agent for **S1 of the Aspire 13.5 epic** (#1712):
**#1713 — [aspire-13-5 S1] Atomic Aspire 13.5.3 pin bump + `check:aspire-version-parity` phase 1**.
Supervisor: the Fable 5 research/implementation session. Coordinator (GPT-5.6 Sol high) owns merges,
canary admission, and runtime leases.

### Your worktree / branch
- Worktree: `/home/codex/repos/netscript-aspire-13-5-s1` (native ext4; work ONLY here)
- Branch: `chore/aspire-13-5-s1-pin-bump` (off `origin/main` `3b32d1628`; **no upstream** — push with
  the explicit refspec `git push origin HEAD:refs/heads/chore/aspire-13-5-s1-pin-bump`)
- Slice dir (run artifacts you own): `.llm/runs/chore-aspire-13-5-s1-pin-bump--impl/` (create it;
  start with `supervisor.md` from `.llm/harness/templates/supervisor.md`, then `worklog.md` with a
  `## Design` section, `context-pack.md`, `drift.md`)

### Required reading (in order)
1. GitHub issue #1713 (the contract: scope, boundaries, acceptance, gates, regeneration)
2. `.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md` — D-1, D-2, D-3, D-8, D-13 (phase 1), D-16
3. `.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv` (row source for the gate)
   and `tools/aspire-surface-manifest.ts` (class semantics: `archival:*` → info; `lockfile` skipped;
   `compat-fixture` special; phase 1 fails only `scaffold-constants`, `ci:*`, `root-config`)
4. `.llm/runs/research-aspire-13.5-adoption--0.0.7/research.md` §1 (13.5.3 target; no mixed trains), §4
5. `.agents/skills/netscript-harness/SKILL.md`, `.llm/harness/workflow/run-loop.md`
6. `.llm/tools/validation/check-scaffold-versions.ts` and `.llm/tools/gates/run-gate.ts` (patterns to copy)

### Locked facts (do not re-research)
- Target train: CLI/SDK/`Aspire.Hosting.*` = **13.5.3**; `Aspire.Hosting.Browsers` =
  `13.5.3-preview.1.26425.3` (OF-2a, accepted debt); `CommunityToolkit.Aspire.Hosting.Deno`/`.SQLite`
  = `13.5.0`. NuGet availability verified 2026-08-29 (research §1).
- CI installs `dotnet tool install Aspire.Cli --tool-path "$HOME/.aspire/bin" --version 13.5.3`;
  `e2e-cli-prod.yml` drops the `install.sh` + `13.5.0-preview.1.26404.10` route and its comment;
  preflight pattern `13.5.*`; NuGet cache key `nuget-aspire-${{ runner.os }}-13.5.3-v1` in all four
  places; `.github/scripts/aspire-nuget-cache-policy.test.ts` becomes single-train (no
  `FIXED_PUBLISHED_E2E_CLI`). `.openhands/setup.sh` keeps `install.sh` but reads the version from
  `.github/toolchain.env` (verify it already does; do not hardcode).
- `.github/toolchain.env`: `NETSCRIPT_ASPIRE_CLI_VERSION=13.5.3`, `NETSCRIPT_ASPIRE_SDK_VERSION=13.5.3`.

## Slices (commit in this order; each commit names what it proves)

1. **RED first — the parity gate test.** Add `.llm/tools/validation/check-aspire-version-parity.ts`
   (+ `_test.ts`) and `deno task check:aspire-version-parity`. Contract: read
   `SCAFFOLD_VERSIONS.ASPIRE_SDK`; read the manifest TSV (repo-relative path above, skip header);
   for each row, if the file contains a stale Aspire literal (`13\.[0-4]\.[0-9]+` or `Aspire 13\.[0-4]`)
   → `fail` when class ∈ {`scaffold-constants`, `ci:*`, `root-config`}, `deferred` (owner-tagged,
   non-failing) for every other non-`archival` owner, `info` for owner `archival`, skip class
   `lockfile`. `--phase 2` flag exists but is NOT enabled in CI by this slice (S13 flips it): phase 2
   fails on every non-archival row except `compat-fixture` (assert a `13.5.3` literal is present)
   and `lockfile`. Structured JSON output; exit 1 on any `fail`. Write the test first, run it against
   the current tree, and **commit the RED run's receipt** (the fail set must list the current 13.4.6
   pins) before touching any pin.
2. **The atomic pin commit.** Every pin listed in #1713 "Scope (files)" in one commit; generator
   assertions in `generate-aspire-config_test.ts` compare against the constants, not literals.
   Run: `deno task check:scaffold-versions`, the policy test, `deno task gen:assets-barrel` +
   `deno task check:assets-barrel`, scoped wrappers on `packages/cli`, `deno task quality:scan`,
   `deno task arch:check`, and the parity gate (now GREEN on the fail set; deferred list non-empty and
   every entry owner-tagged, no `archival` row). Wire the gate into `ci.yml` quality gates through
   `.llm/tools/gates/run-gate.ts` (phase 1).
3. **Debt + worklog.** Append the "Aspire.Hosting.Browsers preview pin (13.5 train)" entry to
   `.llm/harness/debt/arch-debt.md` (append only; never rewrite older entries). Record every gate
   result as a table in `worklog.md`; update `context-pack.md`.

## What you must NOT do
- Do not run `aspire start`, `aspire run`, `aspire update`, or upgrade/install the host Aspire CLI —
  the runtime verdict (`scaffold.runtime` on both CI tiers) runs in CI on your draft PR; a local
  runtime lease is the coordinator's to grant, not yours to assume.
- Do not touch `skills/`, `docs/site`, generated corpora other than `embedded.generated.ts`, or any
  `archival:*` manifest row (that includes `.llm/runs/research-aspire-13.5-adoption--0.0.7/**`).
- Do not edit the manifest TSV or its generator; if a row seems wrong, record it in `drift.md`.
- Do not delete lock files or run `deno cache --reload`.

## Draft PR and receipts
- After commit 1, open a **draft PR** to `main` titled
  `chore(aspire): atomic Aspire 13.5.3 pin bump + version-parity gate (phase 1)` with body per
  `.github/pull_request_template.md`: `## Scope` carries `Closes #1713` and `Part of #1712`;
  labels `type:chore`, `epic:aspire-13-5`, `area:cli`, `area:aspire`, `area:tooling`, `status:impl`;
  milestone `0.0.7`. Use `--body-file` from `.llm/tmp/<run-id>/<session>/pr-body.md`.
- After every commit: push with the explicit refspec, then post a PR comment with slice scope,
  commit SHA, and gate evidence (the commit trail). Paste the exact `git push` output line into
  `worklog.md`.
- Gate receipts through `run-gate.ts` land under `.llm/tmp/gate-receipts/`; copy the parity gate's
  RED and GREEN receipts into your slice dir as `receipts/parity-phase1-red.json` and
  `receipts/parity-phase1-green.json`.

## Stop conditions
- Finish with the final line exactly `DONE` when: all three commits are pushed, the draft PR exists
  with the commit-trail comments, all named gates are green locally, CI is running, and your
  slice-dir artifacts are committed. You do **not** mark the PR ready for review and you do **not**
  self-certify — the supervisor's Tier-A review and an independent IMPL-EVAL follow.
- If NuGet lacks a listed 13.5.3 package, a gate cannot be made green without touching a forbidden
  surface, or `scaffold.runtime` on CI fails for a reason you cannot fix inside this scope, stop with
  the final line `BLOCKED: <exact reason and evidence path>`.
