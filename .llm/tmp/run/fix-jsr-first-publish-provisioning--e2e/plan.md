# Plan

## Profile

- Archetype: `ARCHETYPE-6-cli-tooling` for repo-owned Deno automation CLIs.
- Scope overlays: none.
- Doctrine verdict: tooling slice only; existing repo verdict lists `@netscript/cli` as
  restructure-needed, but this slice does not modify that package.

## Locked Decisions

- Reuse `discoverWorkspaceMembers` from `.llm/tools/publish-workspace.ts` for package discovery.
- Keep JSR publish itself on OIDC/provenance; `JSR_TOKEN` is used only for pre-publish package
  creation/linking.
- Provisioning no-ops with exit 0 when `JSR_API_TOKEN` is absent, after printing discovered members.
- `release.ts` shells out with `Deno.Command('gh', { args })`; no shell string construction.
- No real JSR POST/PATCH, no GitHub Release creation, no tag creation in this slice.

## Open Decisions

- None must resolve now.
- Whether to add root `deno.json` tasks for these helpers is safe to defer; direct `deno run`
  invocations are explicit and match the requested UX.

## Commit Slices

1. Add JSR provisioning and release helper tooling, patch publish workflow, and validate.
   Gate: targeted `deno check`, lint, fmt, workflow YAML parse, behavior probes.

## Risk Register

- Risk: provisioning accidentally logs or reads a token from the wrong place.
  Mitigation: token comes only from `JSR_API_TOKEN`; no token output; no file reads for secrets.
- Risk: dry-run path mutates JSR.
  Mitigation: `--dry-run` performs GET-only when a token exists; no-token path exits before network.
- Risk: workflow loses provenance by switching to token publish.
  Mitigation: publish step remains `.llm/tools/run-publish.ts` with `id-token: write`.
- Risk: release command quoting errors.
  Mitigation: `release.ts` prints and executes argv arrays, never shell strings.

## Gates

- Static: targeted `deno check --unstable-kv` for new tools.
- Formatting: scoped `.llm/tools/run-deno-fmt.ts` include filter for touched tools.
- Lint: root wrapper is blocked by `.llm/` lint exclude; explicit `deno lint --config /dev/null`
  on touched tools is the meaningful lint verdict.
- Workflow: no-lock YAML parse, checkout version scan, step-order scan.
- Behavior: provisioning no-token dry-run; release dry-run; release mismatch failure.

## Deferred Scope

- Real JSR provisioning and real GitHub Release creation.
- Full scaffold/runtime e2e; no scaffold output, CLI scaffold behavior, or packages/plugins runtime
  code changed.
