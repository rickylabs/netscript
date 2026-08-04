**[PHASE: PLAN] [STATUS: LOCKED]**

The mitigation will generate a fail-closed `.netscript/verify-node-modules.ts`, expose it as
`deno task deps:verify`, and run it before the generated Fresh/Vite dev command. It compares the
project-local npm package tree with Deno's shared cache, identifies exact missing files, and prints
project-scoped reinstall commands plus the Deno 2.9.0 fallback. A generated root `package.json`
records the exact `engines.deno` pin.

The regression contract executes the generated program against hermetic complete-cache/incomplete-
local fixtures and requires a non-zero actionable result. This is the #1250-style no-op law: a
detector that stops comparing packages cannot pass.

`Refs #1246` is intentional. Native Windows no-intervention start and Windows init→Aspire→frontend
CI remain unclaimed 0.0.6/upstream work. Locked plan and gates:
`.llm/runs/fix-windows-node-modules-materialization--1246/plan.md`.
