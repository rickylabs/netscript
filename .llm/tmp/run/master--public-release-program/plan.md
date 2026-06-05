# Plan: NetScript Public Release Program (master)

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `master--public-release-program` |
| Branch | `master` |
| Phase | `plan` |
| Target | Program orchestration / docs (drives S0–S6 package, plugin, service, docs runs) |
| Archetype | N/A — each supervisor selects its own per its run card |
| Scope overlays | `SCOPE-docs.md` |

## Archetype

N/A at the program level. This run produces orchestration documentation, not
package code. Each supervisor (S0–S6) selects its archetype from its run card in
`RELEASE-PROGRAM.md` § 10 (S0/S3 → ARCHETYPE-6, S1 → per-package, S4 →
SCOPE-service + ARCHETYPE-6, S5 → SCOPE-docs+frontend, S7 → ARCHETYPE-4).

## Current Doctrine Verdict

N/A for this meta-run. The package/plugin doctrine verdict and headline action
are owned per supervisor surface; the prior package-quality run already captured
the slow-type/license verdict (`audit/JSR-DRY-RUN-MATRIX.md`: 7/24 publish-clean,
17/24 need slow-type refactor). Each supervisor reads
`doctrine/10-codebase-verdict-and-handoff.md` for its surface.

## Axioms in Play

| Axiom | Why it matters |
|-------|----------------|
| Program invariant — lockstep version | All 29 units march at `0.0.1-alpha.0`; no fork (RELEASE-PROGRAM § 1, § 11) |
| Program invariant — no backcompat | Alpha = pre-stability; doctrine no-backcompat rule holds across supervisors |
| Program invariant — slow-type-clean | `isolatedDeclarations` + `deno doc --lint` enforced as the publish gate |
| Per-supervisor axioms | Carried into each supervisor's own `plan.md` (A3 chained path, A4 stub-only base, A12 runtime state machines, etc.) |

## Goal

Produce the master program document (`RELEASE-PROGRAM.md`) and supporting
toolchain notes that drive the transition from the `netscript-start` playground
to the public `rickylabs/netscript` framework repo, JSR-ready at `0.0.1-alpha.0`,
decomposed into 7 supervisor harness runs (S0–S6 + tracked S7) that a separate
agent can produce by reading the handover protocol.

## Scope

- `RELEASE-PROGRAM.md` — umbrella program: framing, locked decisions, target
  repo shape, extraction mechanism, toolchain/Aspire leverage, CI/CD, docs
  strategy, supervisor decomposition + diagram, run cards, handover protocol.
- `notes/TOOLCHAIN-2.8.md` — Deno 2.8 leverage analysis (requested addition).
- `notes/ASPIRE-13.4-13.5.md` — Aspire 13.4 bump + 13.5 native-Deno-apphost
  readiness (requested addition).
- The harness wrapper artifacts for this master run.

## Non-Scope

- No framework code, no package edits, no repo extraction executed here. Those
  are S0–S6 supervisor runs.
- No git commits unless the user requests them.
- No rewrite of the prior package-quality run — it is nested as S1.

## Hidden Scope

- The producer/consumer extraction split is already encoded in `netscript-dev`;
  S0 must reuse it, not reinvent it (RELEASE-PROGRAM § 4).
- Deno 2.8 deletes most of the bespoke release machinery the prior plan assumed
  (S2 simplifies S3 and S1's handoff).
- `.agents/rules/*.mdc` is a new machine-enforcement layer distinct from skills
  and doctrine; it must be seeded in S0 and grown thereafter.

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
|----|--------|------|
| Second "production surface" definition | risk | Avoid — S0 dogfoods `netscript-dev release eject`; one engine, two targets |
| Big-bang fork at end | existing (prior §11) | Resolve — "extract early, harden in place" |
| Docs duplicating doctrine | risk | Avoid — RELEASE-PROGRAM references doctrine/standards, does not restate them |
| Version drift | existing (CLI `1.0.0`) | Resolve in S0 — lockstep reset to `0.0.1-alpha.0` |

## Fitness Gates

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| Source alignment (SCOPE-docs) | yes | Every prescriptive claim cites doctrine, prior run, code, or a fetched primary source |
| Scope separation (SCOPE-docs) | yes | Program doc declares target-state; does not silently become doctrine |
| Link integrity (SCOPE-docs) | yes | Referenced local paths exist (`packages/cli/docs/maintainer-cli.md`, prior run dir, harness paths) |
| Terminology (SCOPE-docs) | yes | Archetype/gate/overlay names match `.llm/harness/archetypes` and doctrine |
| Drift log (SCOPE-docs) | yes | Material decisions recorded in `drift.md` |

## Arch-Debt Implications

| Entry | Action | Notes |
|-------|--------|-------|
| `debt/arch-debt.md` | none here | Per-supervisor runs create/close entries (e.g. `--allow-slow-types` on heavy-generic packages) |

## Validation Plan

| Order | Gate | Command or check | Expected result |
|-------|------|------------------|-----------------|
| 1 | Link integrity | Verify cited local paths exist | All resolve |
| 2 | Terminology | Cross-check archetype/overlay names vs `.llm/harness/archetypes/` | Match |
| 3 | Source alignment | Spot-check claims vs `maintainer-cli.md`, `AppHost.csproj`, Deno 2.8 notes | Grounded |
| 4 | Format | `deno fmt` on markdown is advisory; manual skim for harness-template conformance | Conformant |

## Risks

- **Supervisor sprawl** — too many parallel supervisors. Mitigation: S0 is the
  hard gate; only S2/S3/S5 parallelize under S1.
- **prisma-next timing** — adoption (S7) depends on an external release.
  Mitigation: tracked as watch-only, post-alpha.
- **Aspire 13.5 slip** — native Deno apphost may land later than planned.
  Mitigation: S4-now (13.4) is self-sufficient; 13.5 is an upgrade, not a gate.

## Dependencies

- Prior run `copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release`
  (S1 canonical plan).
- `netscript-dev` maintainer CLI (extraction engine).
- External: Deno 2.8, Aspire 13.4 (+ #16218 for 13.5), JSR, prisma-next.

## Drift Watch

- Aspire pin (`13.2.2` today) — log when bumped.
- CLI version (`1.0.0` today) — log when reset to `0.0.1-alpha.0`.
- prisma-next release status — log when it ships (triggers S7).
- Any change to the closed-set assumption for `packages/` + `plugins/`.
