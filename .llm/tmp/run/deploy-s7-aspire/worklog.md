# Worklog: Deploy-S7 — Aspire Docker/Compose adapter (#343)

## Design checkpoint (Plan & Design phase — 2026-07-03)

- **Archetype:** 7 (composite A2 core + A6 router). Deploy core stays in `packages/cli` for beta;
  `@netscript/deploy` extraction deferred (arch-debt).
- **Contract:** targets the LOCKED 7-op uniform contract (`plan`/`emit` · `up` · `down` · `status` ·
  `logs` · `rollback` · `secrets`); adapter declares its supported subset; delegates `plan`/`up` to
  the Aspire CLI (A7).
- **Design locked** in `plan.md` §Design + §Locked Decisions (L1–L8). Open decisions swept — none
  force rework when deferred (port-expansion ownership is merge-order only; E2E depth + key-count
  resolved now).
- **Slices:** 8 ordered slices (config → port → core conventions → apphost gen → adapter → router →
  docs/debt → e2e), all < 30, each with a proving gate.
- **State:** PLANNING-ONLY. No product code written. Awaiting **PLAN-EVAL** (separate session,
  OpenHands / minimax M3 per harness rule) before any implementation slice.

## Implementation log (2026-07-03)

- **S1 (config member)** — `8438b7d6`. `DockerComposeDeployTargetSchema` spreads
  `deployTargetBaseShape`; explicit `z.ZodType<…>`; base image default `denoland/deno:2`.
  Wired `docker`+`compose` into `DeployConfigSchema.targets`, mirrored types + public exports.
  Gate: `deno check` clean; 4 schema tests pass (config package IS gated by lint/fmt — clean).
- **S2 (port expansion)** — reconciled to a no-op verification: S0 (#370, `95576c44`) already
  landed the 7-op port. See drift **D1**. No port/windows/registry/test edits.
- **S3 (secrets/rollback core)** — BLOCKED cross-slice dependency (core conventions land with
  #341/#364). Adapter omits `rollback`/`secrets` per the port doc sanction. See drift **D2**.
- **S5 (adapter)** — `e7dcfa33`. `AspireComposeDeployTarget`: one delegation shell over
  `ProcessPort`, authors no YAML (A7/F-2). plan/emit→`aspire publish --output-path`; compose
  up→`docker compose up -d`, docker up→`aspire deploy`; down/status/logs→`docker compose`.
  Registered under 2 keys in the composition root (drift **D5**). Gate: cli `deno check` clean;
  6 fake-ProcessPort tests pass.
- **S6 (thin router)** — `10f4eba9`. `createTargetDeployCommand` parses flags, resolves the
  registry adapter, routes the verb straight through (no target logic, R-DEPLOY-2); verbs derived
  from the adapter's `operations`; output via the reporter. Wired `docker`/`compose` into the
  deploy group (additive). Gate: cli `deno check` clean (23 files); 3 router tests pass.

## Validation notes

- **cli lint/fmt exclusion (drift D6):** `packages/cli` is excluded from `deno task lint` +
  `fmt:check` at the config level, so the scoped lint/fmt wrappers exit non-zero with **zero
  findings** for cli paths — a scoping artifact, not a failure. The authoritative cli gate is
  `deno check` (clean for all slices) + co-located unit tests. `packages/config` (S1) is fully
  gated and clean.

## Gate results

| Slice | Gate | Result |
| --- | --- | --- |
| S1 | `deno check` + schema tests (config, lint/fmt gated) | PASS (4/4 tests) |
| S5 | cli `deno check` + adapter tests | PASS (6/6 tests) |
| S6 | cli `deno check` (23 files) + router tests | PASS (3/3 tests) |

_Pending: S4 (apphost-gen snapshots), S7 (docs/debt), S8 (compose-artifact E2E — needs Docker/
evaluator env)._
