# Context Pack — beta4-cut-A-ai--impl

## Objective

Implement issue #388 AI flagship parity on `feat/ai-flagship-parity-388`: FAI-0 through FAI-3 from
the F-ai design source.

## Current State

- Branch started clean.
- Run artifacts have been scaffolded and filled.
- PLAN-EVAL cycle 1 returned `FAIL_PLAN` because gate mapping was incomplete. Cycle 2 returned
  `PASS`.
- Slice 2 added `createAiRouter` in `packages/plugin-ai-core`, a contract soundness test, and
  generated AI stream-route output that imports `aiContractV1` and binds `createAiRouter`.

## Decisions

- Core router binding lives in `packages/plugin-ai-core`.
- `plugins/ai` remains thin wiring and generated scaffold resources.
- Six starter emitters are the truth for golden tests.
- `--mcp` scaffold.runtime variant may be a beta.4 stub and must be recorded as drift/PR body.

## Required Final Evidence

- Targeted contract/golden/doctor/e2e registry tests.
- Scoped check/lint/fmt wrappers over touched roots.
- Full export-map doc lint for `plugin-ai-core` and `plugins/ai`.
- `deno publish --dry-run --allow-dirty` for `plugins/ai` and root `deno task publish:dry-run`.
- One full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` run.
- PR URL, labels, milestone, body with `Closes #388` and `Refs #238, #260`.

## Resume Notes

Start at PLAN-EVAL. Do not implement until the separate evaluator writes a PASS or the owner waives
the gate.
