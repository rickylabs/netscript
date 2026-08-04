# Research — fix-generate-plugins-custom-job-registry--1234

## Re-baseline

- Carried-in source: live issue #1234, including the independent verifier's clean-scaffold
  transcripts for 0.0.4, 0.0.5-canary.2, and 0.0.5-canary.6.
- Re-derived against `main` @ `681fc94af3bfdecb6c2c195ac4a15f6f2178e630` on 2026-08-04.
- What changed vs the carried-in version:
  - Nothing material. The failure reproduced after fast-forwarding to the current `origin/main`.
  - The worktree already contained unrelated `deno.lock` churn; it is preserved and excluded from
    every commit.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | A fresh scaffold whose workers sample is renamed to `custom-claim-job.ts` fails `generate plugins` because no declared workers registry is written. | Run the issue transcript with `packages/cli/bin/netscript-dev.ts`; observed exit 1 with `did not write declared registry .netscript/generated/plugin-workers/job-registry.ts`. |
| 2 | The workers manifest always invokes its generator with `--profile scaffold`. | `plugins/workers/scaffold.runtime.json` → `runtimeRegistryGenerator.args`. |
| 3 | The `scaffold` profile overlays `include` and `includeWhenPresent`, creating a closed sample allow-list. | `plugins/workers/scaffold.runtime.json` → `runtimeRegistries[0].profiles.scaffold`; `plugins/workers/src/cli/runtime-registry-generator.ts` → `applyProfile` and `resolveRuntimeIncludes`. |
| 4 | With no include overlay, the existing generator already performs deterministic structural discovery of top-level `.ts` jobs while honoring explicit helper exclusions. | `plugins/workers/src/cli/runtime-registry-generator.ts` → `discoverRegistryFiles`. |
| 5 | Removing `--profile scaffold` is not equivalent: the profile also gates optional official sample configuration. | `plugins/workers/src/cli/generate-runtime-registries.ts`. |
| 6 | `--official-samples false` does not alter discovery and therefore cannot be the public override. | `plugins/workers/src/cli/generate-runtime-registries.ts` and the installed generator invocation. |
| 7 | The installed-registry integration test uses `example-job.ts`, so it cannot detect the closed sample allow-list. | `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts`. |
| 8 | Flow B mutates the generated registry to attach E2E-only import-map metadata. Its imports can instead live in the generated project's `deno.json`, after which the fixture can regenerate via the public CLI and only assert the artifact. | `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts`; default worker subprocess permissions are `--allow-all` when no permissions object is supplied. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `plugins/workers/scaffold.runtime.json`, `plugins/workers/deno.json`, package
  exports, generator entrypoint, and generated registry shape.
- Slow-type / surface risks: none. No TypeScript export or type surface changes. The published
  manifest behavior changes, so plugin doc-lint, JSR audit, and publish dry-run remain required.

## Open questions

- None. The public behavior, fixture migration, and gate set are locked in `plan.md`.
