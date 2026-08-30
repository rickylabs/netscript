use harness

## SKILL

- netscript-harness — run loop; commit-by-slice + push + PR comment trail; run-dir artifacts
  (`worklog.md`, `drift.md`, `context-pack.md`); `SCOPE-docs.md` overlay; you never self-certify.
- netscript-doctrine — docs describing package/plugin architecture must match doctrine; no doctrine
  changes.
- netscript-tools — `doc:lint`, `diagrams:check`/`diagrams:render`, `check:agent-docs-prose`,
  `gen:agent-docs-prose`, `gen:publish-assets`, `check:publish-assets`, `docs:links`; scoped
  wrappers.
- netscript-cli — what `netscript init` / `netscript agent init` / `netscript db` actually generate
  and print at the stack head (paste only from a fresh scaffold).
- aspire — 13.5.3 facts as **observed** in receipts: `aspire start --format Json`,
  `aspire ps --format Json` (`logFilePath`, `dashboardUrl`), `aspire wait --timeout`, `--isolated`,
  `aspire resources` alias, `stop --force`, orphan cleanup, exit 12 for bare `aspire otel` without a
  reachable dashboard, `aspire docs api search … --language typescript`, `aspire agent mcp` /
  `--dashboard-url`, the ratified **14-tool** MCP baseline (`get_integration_docs` documented but
  unobserved), `excludeFromMcp()` on `<db>-cli`, `addHealthCheck`/`withHealthCheck` listener
  readiness, typed `aspire resource <db>-cli <cmd> --<arg>`. **No AppHost start, no containers, no
  `e2e:cli` runtime.**

## Context

- Slice **S11 — Public docs + README refresh for Aspire 13.5** (#1723; closes #1642 detached/non-TTY
  start how-to, #1000 ".NET Aspire" → "Aspire"; epic #1712). Contract =
  `sub-issues/11-public-docs-refresh.md` in the supervisor run dir (read fully; the scope rows come
  from `aspire-surface-manifest.tsv` classes `doc:*`). Lane: OF-4 **(b)** `documentation_authoring`;
  then `docs_audit` (Codex Sol single pass) and `docs_polish` (Fable) are mandatory and
  supervisor-dispatched.
- Supervisor run dir (read-only):
  `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/`
  — `plan.md` (D-5, D-6, D-7, D-10, D-15/D-45 baseline, D-17 pending), `drift.md`
  D-39/D-42/D-43/D-45/D-49/D-50, `aspire-surface-manifest.tsv`, `stale-surface-inventory.md`,
  `slices/s{5,6,8,9,10}/handoff-phase-a.md` (what each slice ships), `sources/` (upstream Markdown,
  use `?aspire-lang=typescript` views), receipts: S2
  (`origin/test/aspire-13-5-s2-runtime-verification` run dir), S9 static MCP receipt and CLI help
  receipts (S9 branch run dir).
- **Truth boundary:** main is `a5520e70` and still pins Aspire 13.4.6 (S1 #1727 parked on #1734).
  Your branch sits on top of the Aspire stack so the prose can describe the **stack's** behaviour
  (S5 literal-port removal, S6 listener health checks, S8 typed commands + `excludeFromMcp`, S9
  skills/MCP, S10 gates). Every version snippet targets **13.5.3** (Browsers
  `13.5.3-preview.1.26425.3`, OF-2(a)). Where a behaviour is only proven by a Phase-B/runtime
  receipt that does not exist yet (D-42/D-43), write what the receipts prove and mark nothing as
  observed that was not — cite the receipt path in the page's evidence note or in your worklog per
  page.

### Your worktree / branch — STACKED ON S10 (→ S8 → S6 → S5)

- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s11` (NAS; work ONLY here).
- Branch: `docs/aspire-13-5-s11-public-docs-refresh`, based on S10's settled phase-A head
  `c61b1626`. No upstream — push only with
  `git push origin HEAD:refs/heads/docs/aspire-13-5-s11-public-docs-refresh`. Draft PR **base
  `test/aspire-13-5-s10-e2e-gate-upgrades`**; the supervisor retargets as the stack lands (D-50).
  Never touch S5–S10 commits.

### Host (authoritative, D-39)

- Deno 2.9.5; Aspire CLI 13.5.3, dotnet 10.0.400, node 24.20.0 via
  `/home/agent/.local/bin/mise exec --` (the `mise` shell function is broken).
  `aspire ps --format Json --nologo --non-interactive` must read `[]` and `docker ps -a` empty
  before/after any `aspire` command. Allowed: `netscript init` scaffolds under `.llm/tmp/` for
  verbatim snippets; non-runtime `aspire … --help` reads; `aspire docs get/search`.

## Slices (commit in order; one `## [PHASE: IMPL] S11 slice N` PR comment each)

1. **Manifest sweep + plan.** Regenerate the `doc:*` row list from the manifest; for each row decide
   edit / "no change needed" (with the grep that proves it); record the table in your run dir and
   the PR body.
2. **Dedicated Aspire pages** (`explanation/aspire.md` snippet → 13.5.3; `quickstart/aspire.md`;
   `reference/aspire/index.md`: health checks, typed resource commands, `excludeFromMcp`;
   `deploy-local-aspire.md` line 58 + CLI/SDK pairing + `aspire update --self` npm note).
3. **#1642 how-to** "Detached start for agents and CI": `aspire start --format Json` fields,
   `aspire ps --format Json` (`logFilePath`, `dashboardUrl` — redact tokens in examples),
   `ASPIRE_CLI_START_TIMEOUT` vs `aspire wait --timeout`, `--isolated`; cite S2/S10 receipts.
4. **Observability + skills + reference** (`observability/*`: `aspire otel … --search timestamp:>=`,
   `aspire export` layout — only what receipts show; `reference/ai/skills.md`: upstream workflow
   skills beside NetScript `aspire`; `cli-reference.md`; `glossary.md`; tutorial tracks'
   scaffold/deploy chapters; `quickstart.vto`/`index.vto`/`why.vto`/`concepts.vto`; README (~20
   lines); `CONTRIBUTING.md:57,86`).
5. **Terminology check (#1000 shipped in #1748):** verify no ".NET Aspire" regression in the pages
   you touch and in any page #1748 missed; do not undo or duplicate #1748 (diff against
   `origin/main`). Dashboard: no AI-Assistant mentions; VS Code auto-launch note if present. Diagram
   `_diagrams/aspire-resource-graph.mmd` if S6/S8 added nodes → `diagrams:render`.
6. **Regeneration + gates:** `gen:agent-docs-prose`, `gen:publish-assets`, `diagrams:render`; then
   `doc:lint` (`--root` form — record `N/A` reasoning if it lints TS JSDoc only, D-30),
   `diagrams:check`, `check:agent-docs-prose`, `check:publish-assets`, `docs:links`, Lume
   `deno task build` from `docs/site`; parity gate phase-1 report must show zero `doc:*` deferred
   rows (record the command + output).

## Boundaries

No code samples not generated by the current CLI; no doctrine changes; no product code; no changes
to skills (S9 owns `skills/aspire`); no pins (S1); no runtime; archival manifest rows untouched.

## Draft PR and receipts

- After commit 1: draft PR (base `test/aspire-13-5-s10-e2e-gate-upgrades`), title
  `docs(aspire): public docs + README refresh for Aspire 13.5 (S11)`; body per
  `.github/pull_request_template.md`, `## Scope` = `Closes #1723`, `Closes #1642` (#1642 is in the
  Backlog/Triage milestone — the supervisor asks the coordinator to move it to 0.0.7), `Refs #1000`
  (already shipped on main via #1748 — no closing keyword), `Part of #1712`; labels `type:docs`,
  `epic:aspire-13-5`, `area:docs`, `area:aspire`, `priority:p2`, `status:impl`, plus `ci:skip-e2e`
  (docs-only) and record that choice in the opening comment; milestone `0.0.7`. State the S10
  stacking and that docs_audit + docs_polish follow.

## Stop conditions

- Final non-empty line exactly `DONE` when slices 1–6 are pushed, the draft PR carries the commit
  trail, gates green locally, run-dir artifacts committed. You do not mark ready and do not
  self-certify.
- Otherwise final non-empty line exactly `BLOCKED: <exact reason and evidence path>`.
