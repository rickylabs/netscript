# Context pack — Run 5c1 Composition foundation

## Scope

Implementation session for locked Wave 5c Run 1: composition foundation. Work is limited to
`packages/fresh-ui` except slices 13-14, which touch `packages/cli` for `ui:init` and `ui:add`.

## Locked Inputs

- Parent plan: `.llm/tmp/run/feat-package-quality-wave5-apps--5c-fresh-ui/plan.md`
  (LOCKED v2; PLAN-EVAL PASS 2026-06-11).
- Parent design: `.llm/tmp/run/feat-package-quality-wave5-apps--5c-fresh-ui/design.md`.
- Parent appendix: `.llm/tmp/run/feat-package-quality-wave5-apps--5c-fresh-ui/design-appendix.md`.
- Parent drift entries D-7 and D-8 bind this run's popover fallback and registry schema.

## Gate Policy

Verdict-grade evidence uses raw `deno` and raw `git`, not `rtk`. Targeted `deno check` commands that
touch workspace code include `--unstable-kv`. Root `deno.lock` is not touched; run-local config and
lock files live in this run directory.

## Current State

Bootstrap artifacts created; baseline measurement pending.
