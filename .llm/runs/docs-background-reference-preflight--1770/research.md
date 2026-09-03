# Research — docs-background-reference-preflight--1770

## Re-baseline

- Carried-in source: issue #1770 and the slice brief.
- Re-derived against `origin/main` and branch HEAD at
  `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` on 2026-08-30.
- Initial re-baseline found no scope drift: the source template still emitted the two stated
  messages, and `git grep -c "background reference" -- docs/site` exited 1 with no matches. Formal
  evaluation later found one behavioral qualifier the initial research missed: the emitted
  preflight sits inside the processor's `Enabled !== false` guard.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | For each background processor that is not explicitly disabled, the generated AppHost resolves every declared service and plugin reference before `builder.addExecutable()` registers the processor. A processor configured with `Enabled: false` skips the entire block, including the preflight. | Read the emitted `Enabled !== false` guard and the enclosed preflight in `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts`. |
| 2 | For a processor that is not explicitly disabled, a missing resource and a resource without an `http` endpoint both produce a falsy endpoint and are equally fatal required-configuration failures. | Compare the `_services.get(ref)?.getEndpoint('http')` and `_plugins.get(ref)?.getEndpoint('http')` preflight branches with the source comment. |
| 3 | Service and plugin references have parallel but distinct templated messages; processor and reference names are substituted during scaffold generation. | Read the two `message` constants in `generate-register-background.ts`. |
| 4 | `deploy-local-aspire.md` is the reader's startup runbook and already contains a “Footguns when `aspire start` will not boot” callout. | Read `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md` around the startup and in-production-pitfalls sections. |
| 5 | `background-processing/how-to/` contains task-runtime recipes, not an Aspire AppHost startup troubleshooting page. | List and read the four existing how-to pages under `docs/site/background-processing/how-to/`. |
| 6 | The generated asset chain is site source → `docs/site/_site` → agent-docs prose/provenance → CLI agent-docs barrel and MCP publish assets. | Read `.llm/tools/docs/build-agent-docs-bundle.ts`, `.llm/tools/generate-cli-assets-barrel.ts`, `.llm/tools/generate-publish-assets.ts`, and root `deno.json` tasks. |

## jsr-audit surface scan (package/plugin waves)

- N/A: this is a docs-only slice. The only package files allowed to change are outputs produced by
  the checked-in generators.

## Open questions

- None. Placement, message quoting, timing, causes, generator commands, and gate scope are resolved
  in the plan.
