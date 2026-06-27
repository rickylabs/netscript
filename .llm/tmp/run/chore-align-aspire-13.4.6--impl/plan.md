# Plan - Aspire-core 13.4.6 alignment

## Archetype

- Selected archetype: Archetype 6 - CLI/tooling.
- Justification: the slice changes `packages/cli` scaffold constants/templates and generated output
  expectations.
- Current doctrine verdict: `@netscript/cli` is recorded as Archetype 6 with a `Restructure`
  historical verdict; this slice does not deepen that debt because it changes existing constants and
  tests only.

## Locked Decisions

1. Align only Aspire-core pins to `13.4.6`.
2. Keep CommunityToolkit Deno/SQLite pins on their independent version line for Goal A.
3. Defer Goal B unless current Aspire docs and integration search show TypeScript AppHost support for
   the CommunityToolkit Deno/SQLite APIs.
4. Run the full `scaffold.runtime` E2E last.

## Gate Set

- Scoped `packages/cli` check, lint, and fmt wrappers.
- Focused scaffold/Aspire config tests that assert version output.
- Final `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- Version sweeps for `13.4.4` and `13.4.0`.

## Commit Slice

1. Single implementation slice: align Aspire-core pins, defer CommunityToolkit re-enable if needed,
   update debt/artifacts, run gates, commit, push, and open PR.

## Risk Register

- Risk: CommunityToolkit Deno re-enable is not supported for TypeScript AppHost.
  Mitigation: use Aspire docs/integration search as the decision authority and defer if unsupported.
- Risk: E2E may collide with another Aspire process.
  Mitigation: run the full Aspire-booting E2E last.
- Risk: pre-existing OpenHands line-ending drift is accidentally staged.
  Mitigation: stage explicit paths only.

## Deferred Scope

- No package version bump, release, or merge.
- No tutorial command cleanup from `aspire run` to `aspire start`.
- No CommunityToolkit Deno/SQLite re-enable in this slice.
