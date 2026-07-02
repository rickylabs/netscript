<!--
NetScript PR conventions (see .agents/skills/netscript-pr and CONTRIBUTING.md):
- Branch: <type>/<slug> (feat|fix|chore|docs|refactor|perf|test).
- Apply exactly one status: label and the relevant type:/area: labels.
- Keep Validation honest: paste real results / exit codes. A checked box with no evidence
  is how false-green merges happen.
-->

## Summary

<!-- 1-3 sentences: what this PR changes and why. -->

## Scope

- Archetype / area: <!-- e.g. tooling, packages/fresh, plugins/workers -->
- Part of #<!-- umbrella --> · Sub-PRs: #<!-- n --> <!-- omit the side that doesn't apply -->

## Slices

- [ ] S1 <slice> — <commit>
- [ ] S2 <slice>

## Validation

<!-- Paste real results and exit codes. Note native-WSL runs where relevant. -->

- `deno task check` — <result>
- `deno task lint` / `deno task fmt:check` — <result>
- `deno task e2e:cli run scaffold.runtime --cleanup` — <result, if scaffold/plugin/db/aspire touched>

## Harness

- Run dir: `.llm/tmp/run/<run-id>/` <!-- omit for non-harnessed PRs -->
- Phase: <research|plan|plan-eval|impl|impl-eval|review> — see phase comments below.

## Drift / Debt

- <DEBT_ACCEPTED rows or "none">

## Checklist

- [ ] Branch name and labels follow the taxonomy (exactly one `status:` label).
- [ ] Docs/reference updated if public surface changed.
- [ ] Breaking changes are labelled `breaking` and, if substantial, backed by an RFC.
- [ ] No lock-file or unrelated churn committed (`deno.lock` only when a reviewed fix requires it).
