use harness

# Slice S5 — doctor aggregation: plugin doctor + inspectAspire + environment/project checks

## SKILL

Read before coding: `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-cli/SKILL.md` (plugin doctor surface),
`.agents/skills/netscript-deno-toolchain/SKILL.md` (`deno doc` first),
`.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/rtk/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent. Worktree (ABSOLUTE, every file op):
  `/home/codex/repos/ns-combo-s5`. Branch: `feat/netscript-mcp-skills-s5-doctor`.
- **Base verification preflight (mandatory, first)**: `git -C /home/codex/repos/ns-combo-s5 log
  --oneline -1` must show `30fd0288`, and
  `/home/codex/repos/ns-combo-s5/packages/mcp/src/application/flows/doctor-flow.ts` must exist.
  If not, STOP and report.
- **Harness provisioning**: you are authorized to provision this slice's run-dir artifacts
  yourself at `/home/codex/repos/ns-combo-s5/.llm/runs/mcp-skills--orchestrator/s5/`
  (pattern: committed `s1/`, `s3/` dirs), including separate-session PLAN-EVAL. After two
  PLAN-EVAL failures, escalate to the supervisor.
- GitHub issue: rickylabs/netscript#729 (epic #721, umbrella PR #715). Conventional commits
  referencing `#729` (no closing keyword).
- A sibling agent works S4 (analytics) in a different worktree; keep `cli.ts` /
  `tool-contracts.ts` diffs minimal and additive.
- Lock hygiene: workspace deps only (`@netscript/aspire`, possibly `@netscript/cli` — see
  below); no external deps.
- Scope ONLY the doctor tool. NOT analytics, docs, CLI trigger, and NO new CLI commands.

## Context

- Design: `/home/codex/repos/ns-combo-s5/.llm/runs/mcp-skills--orchestrator/design.md` §3
  (doctor row), §2 (wrap-don't-reimplement). S1/S3 landed `doctor` v0 with the shared endpoint
  resolver — READ `src/application/flows/doctor-flow.ts`, `src/domain/telemetry-endpoint.ts`,
  `src/domain/telemetry-probe-port.ts`.
- Diagnostics to aggregate (research-netscript-surfaces.md §3):
  - **Plugin doctor use-case**: `packages/cli/src/public/features/plugins/doctor/
    doctor-plugin-use-case.ts` returns typed `PluginDoctorReport[]` from `{ projectRoot }`.
    IMPORTANT dependency-direction decision: importing `@netscript/cli` into `packages/mcp`
    may be heavy or cyclic (CLI will later depend on mcp in S7). Inspect how the use-case and
    its deps are exported (`deno doc`). If a clean import is not possible without cycles,
    define a `ProjectDoctorPort` in `src/domain/` and implement an adapter in
    `src/infrastructure/` that performs the same checks the use-case performs ONLY if trivial,
    OTHERWISE leave a port with a stub adapter + record drift for S7 to inject the CLI
    use-case from the CLI side (dependency inversion: the CLI composes mcp with its own
    doctor adapter). Prefer the port+injection design — it keeps mcp free of a cli dep and S7
    wires the real implementation. Document the decision in README + drift.
  - **`inspectAspire()`** from `@netscript/aspire` (`packages/aspire/mod.ts`): validate the
    NetScript-generated Aspire graph when an apphost/config is present in the project root.
    Same injection consideration applies IF importing `@netscript/aspire` creates weight —
    but aspire is a leaf package; direct workspace dep is acceptable if clean. Verify with
    `deno why` / imports.
  - **Telemetry reachability**: already in v0 — keep, using the shared resolver, and report
    which scheme succeeded.
  - **Project wiring checks** (pure fs reads in infrastructure): deno.json presence + workspace
    sanity, generated plugin registries present when plugins configured, docs root presence
    (informational).
- Aspire's own MCP covers generic env doctor — do NOT duplicate (no .NET SDK checks etc.);
  NetScript-project-semantic checks only.

## Deliverables

1. **Check-family architecture**: `DoctorCheckFamily` port(s) in `src/domain/` — each family
   yields `DoctorCheck[]` (existing S1 shape: name, status pass/warn/fail, summary, fix?).
   Doctor flow aggregates families: overall status = worst family status; counts per severity;
   works with no running app (telemetry family warns, not fails, when unreachable AND no
   endpoint was explicitly configured).
2. **Families (≥4)**: telemetry reachability (existing, adapted), aspire graph
   (`inspectAspire` — real or injected per the decision above), project wiring (fs checks),
   plugin doctor (port + injected adapter, stub returning an informational "not wired" check
   until S7 injects the real use-case — clearly marked).
3. **Contract fit**: doctor output schema extended if needed (families array); keep tests green.
4. **Composition**: wire families in `cli.ts` (additive).
5. **Tests**: fixture-driven per family (fake ports; fs fixtures under `tests/fixtures/`),
   aggregation severity math, no-running-app behavior.

## Validation (run, paste real output into worklog)

- `.llm/tools/run-deno-check.ts --root packages/mcp --ext ts` (+ lint + fmt wrappers)
- `deno test --no-lock --allow-env --allow-net --allow-run --allow-read packages/mcp/tests/`
- `deno task arch:check`; doc lint; package publish dry-run.

## Definition of done

Deliverables + validations green with evidence in
`/home/codex/repos/ns-combo-s5/.llm/runs/mcp-skills--orchestrator/s5/worklog.md`; drift in
`s5/drift.md` (the plugin-doctor injection decision MUST be recorded). Small logical commits,
then push:
`git -C /home/codex/repos/ns-combo-s5 push origin HEAD:refs/heads/feat/netscript-mcp-skills-s5-doctor`.
Do NOT open a PR; do NOT merge — the supervisor reviews and merges into the umbrella.
