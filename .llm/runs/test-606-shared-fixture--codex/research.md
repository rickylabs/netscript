# Research

- Re-baselined on 2026-07-11 at `7790d20f`; the branch includes #597, #598, and the #621-#623 package-source fixes.
- `scaffold.ui-local-source` rewrites `@netscript/ai` inline in `ui-ai-gates.ts` after verifying generated UI files.
- `runtime.flow-b-fixture` builds a separate config/import map from explicit local entrypoints for workers-core, workers services, SDK, and telemetry.
- Both need generated-project-relative import values, but Flow-B targets the repository source root while UI targets a copied workspace member.
- The e2e test tree provides a unit seam under `packages/cli/e2e/tests/application/gates`.
- This is test infrastructure only. No package export or JSR publish surface changes; jsr-audit is N/A.

