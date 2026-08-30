use harness

## SKILL

- netscript-harness — run loop; commit-by-slice + push + PR comment trail; run-dir artifacts; no
  self-certification.
- netscript-doctrine — `packages/mcp` and `packages/cli` are framework code: `quality:scan` +
  `arch:check` per slice; no `any`/casts/lint-ignores; A7/A11 (IO only at the runtime edge — the
  `aspire ps` read lives in the resolver's injectable port, never in templates/generators).
- netscript-tools — `check:aspire-version-parity`, `run-gate.ts` receipts, `gen:assets-barrel`,
  `agentic:sync-claude`, scoped wrappers, `tools/aspire-surface-manifest.ts`.
- netscript-cli — scaffold templates (`assets/app/routes/examples/telemetry/…`, Windows env-file
  adapters, consumer CI template), `SCAFFOLD_VERSIONS`.
- aspire — `aspire ps --format Json` `dashboardUrl` field (S2 receipt `02-v5-aspire-ps-final.json`),
  `aspire agent mcp` argv. **No AppHost start, no containers, no `e2e:cli` runtime.**

## Context

- Slice **S13 — stale version-bound surface cleanup + parity phase 2** (#1724, epic #1712; canary
  C). Contract = `sub-issues/13-stale-surface-cleanup.md` in the supervisor run dir (read fully).
  **D-17 is ratified as written (D-60):** one resolver
  `packages/mcp/src/domain/telemetry-endpoint.ts` `resolveTelemetryEndpoint` with precedence
  explicit option → `NETSCRIPT_TELEMETRY_ENDPOINT` → `ASPIRE_DASHBOARD_PORT` → **new** `aspire_ps`
  step (running AppHost `dashboardUrl` from `aspire ps --format Json`, the
  `.netscript/aspire-cli.ts` logic extracted into a shared, injectable helper) →
  `DEFAULT_TELEMETRY_ENDPOINT` (`http://localhost:18888`, `source: 'default'`); the recorded
  `source` is preserved for every step; **no bare `18888` in generated code** (templates consume the
  resolver semantics: env → running AppHost → "dashboard unavailable — run `aspire ps`").
- Supervisor run dir (read-only):
  `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/`
  — `plan.md` D-13/D-16/D-17, `aspire-surface-manifest.tsv` + `tools/aspire-surface-manifest.ts`,
  `stale-surface-inventory.md`, `drift.md` D-30/D-39/D-45/D-54/D-55/D-60,
  `slices/s{5,6,8,9,10}/handoff-phase-a.md`.

### Your worktree / branch — stacked on S10′ (→ S8 → S6 → S5 → main `3e5cbabf`)

- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s13` (NAS; work ONLY here).
- Branch: `chore/aspire-13-5-s13-stale-surface-cleanup`, based on S10′ `a46ea16d` (sibling of S11 on
  S10). No upstream — push only with
  `git push origin HEAD:refs/heads/chore/aspire-13-5-s13-stale-surface-cleanup`. Draft PR **base
  `test/aspire-13-5-s10-e2e-gate-upgrades`**; the supervisor retargets per D-58 as the stack lands.
  Never touch S5–S10 commits.

### Host (authoritative, D-39)

- Deno 2.9.5; Aspire CLI 13.5.3, dotnet 10.0.400 via `/home/agent/.local/bin/mise exec --` (the
  `mise` shell function is broken). `aspire ps --format Json --nologo --non-interactive` must read
  `[]` and `docker ps -a` empty before/after any `aspire` command; you may run `aspire ps`
  (read-only) to capture the empty-list shape for a fixture; never `aspire start`.

### Phase split

- **Phase A (this dispatch, static):**
  1. **RED-first tests** for: the resolver's `aspire_ps` step (fixture = S2's
     `02-v5-aspire-ps-final.json` shape + the empty `[]` shape; precedence over `default`, under
     `ASPIRE_DASHBOARD_PORT`; `source` values); the telemetry example route template (no bare
     `18888`; env → running AppHost → unavailable message); the Windows env-file adapters
     (`ASPIRE_DASHBOARD_PORT` emitted only when configured); the consumer CI template
     (`dotnet tool install Aspire.Cli --version {{ASPIRE_SDK}}` before `aspire restore`);
     `render-ts-apphost.ts` wording; `SCAFFOLD_COMMUNITY_TOOLKIT` removal (or a consumer if
     re-pinned); `ownership.ts` `MCP_COMMAND` = `aspire agent mcp` (S7 converged onto main but not
     merged — if S7 already changed it, do not duplicate; note it).
  2. **D-17 implementation** in `packages/mcp/src/domain/telemetry-endpoint.ts` + the shared
     `aspire ps` helper (injectable port, no IO in domain code), `packages/mcp/README.md:318`
     precedence line (one line; the `docs/site/reference/mcp/index.md` line is S11's — do not edit
     `docs/site`).
  3. **Cleanup rows** owned by S13 in the manifest (skill toolchain snapshot via
     `.agents/skills/codex-wsl-remote/SKILL.md` + `agentic:sync-claude`; `render-ts-apphost.ts:81`;
     `scaffold-aspire.ts:9-12`; consumer CI template; env-file adapters; telemetry template).
     Regenerate barrels (`gen:assets-barrel`, `gen:publish-assets`) and re-run
     `tools/aspire-surface-manifest.ts` so the committed manifest has no diff.
  4. **Parity phase 2 — implemented, not yet flipped:**
     `.llm/tools/validation/check-aspire-version-parity.ts` gains `--phase 2` (every non-`archival`
     manifest row enforced; exclusion set = `archival:*` classes + git-ignored
     `.llm/runs/**`/`.llm/tmp/**`; `compat-fixture` asserts the 13.5.3 case; `lockfile` skipped;
     stale-manifest check), with tests for both phases. **Keep phase 1 the default** and do not
     switch `ci.yml` yet: the flip is the last S13 commit and is only allowed once S1 (#1727), S9
     (#1759) and S11 (#1771) are on `main` (their rows must be current) — record that ordering in
     your run dir and PR body; if they are not on `main` when you reach that commit, end with `DONE`
     and state the flip is deferred.
  5. **Gates:** scoped check/lint/fmt + raw lint/fmt on config-excluded files; tests for
     `packages/mcp`, touched `packages/cli` roots, `.llm/tools/validation`; `quality:scan`;
     `arch:check`; `check:assets-barrel`; `check:publish-assets`; `agentic:sync-claude:check`;
     `check:emitted-samples`; the phase-2 sweep command from the acceptance section run in report
     mode (list any remaining non-archival hit with its owner).
- **Phase B:** none (S13 is static; canary C is the coordinator's).

## Boundaries

No `docs/site` prose (S11); no skill behaviour text (S9); no resource emission (S4–S8); never edit
archival rows; no pins (S1 owns `SCAFFOLD_VERSIONS`/toolchain); no runtime.

## Draft PR and receipts

- After commit 1: draft PR (base `test/aspire-13-5-s10-e2e-gate-upgrades`), title
  `chore(aspire): stale version-bound surface cleanup, D-17 telemetry resolver, parity phase 2 (S13)`;
  body per `.github/pull_request_template.md`, `## Scope` = `Closes #1724`, `Part of #1712`; labels
  `type:chore`, `epic:aspire-13-5`, `area:cli`, `area:agentic`, `area:tooling`, `priority:p2`,
  `status:impl`; milestone `0.0.7`. State the S10 stacking, the D-17 ratification, and that the
  phase-2 flip waits for S1/S9/S11 on `main`.
- Commit by slice, push with the explicit refspec, one `## [PHASE: IMPL] S13 slice N` comment per
  commit. Keep your run dir current.

## Stop conditions

- Final non-empty line exactly `DONE` when Phase-A slices are pushed, the draft PR carries the
  trail, gates green locally, run-dir artifacts committed. You do not mark ready and do not
  self-certify.
- Otherwise final non-empty line exactly `BLOCKED: <exact reason and evidence path>`.
