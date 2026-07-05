# Release Gates

Release gates prove a **cut or release-gating run** is safe to publish. They are the hard gates a
run calls in the Release phase (`workflow/run-loop.md` § 8) — distinct from the per-slice static,
fitness, runtime, and consumer gates that prove ordinary implementation work.

This file is the **single source** for the release-gate class inside the harness. The run-loop,
evaluator protocol, and archetype gate matrix may name the gates, but they reference it rather than
redefining sequencing, requiredness, or the evidence bar.

## Ownership boundary (do not redefine here)

The **definitions, sequencing, and race-free production verification** of these gates are owned by
**#309 release engineering** and documented in the **netscript-release** skill. This file names them,
says when a harness run must call them, and sets the evidence bar. It does **not** define how they
run, in what order, or how the JSR publish race is avoided — read `netscript-release` for that.

## The release-gate class

| Gate               | Proves                                                                                  | Canonical command / owner                                      |
| ------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `scaffold.runtime` | Local-source merge-readiness: scaffold → first-party plugins → DB → registries → typecheck → Aspire → endpoints | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` |
| `e2e-cli-prod`     | The **published** `jsr:@netscript/cli` user path: install + official plugin scaffold + runtime over the real remote graph | `e2e-cli-prod.yml` (`workflow_run` after `publish`, or manual `workflow_dispatch` with `published-version`); see netscript-release |
| release-gate class | A release cut is complete: `publish.yml` all-green **and** `e2e-cli-prod` green         | `netscript-release` skill (`release:cut` + the release skill)  |

`scaffold.runtime` is a merge-readiness gate that also runs pre-release; `e2e-cli-prod` is
**post-publish only** — it exercises the JSR graph that a dry-run cannot (see `jsr-audit` on why
`deno publish --dry-run` is not publish-equivalent). Treat a red `e2e-cli-prod` as a real defect to
fix forward, never as flake.

## Required when

- **The run cuts a release** (`release:cut`, a version bump that publishes, or a release-gating PR):
  the full release-gate class is `required`.
- **The run changes scaffold output, plugin scaffolding, DB wiring, Aspire helper generation, or
  official plugin copy mode:** `scaffold.runtime` is `required` before merge-readiness (run the full
  one-pass command, not split `gates`/individual scaffold commands).
- **The run changes the published CLI surface or plugin publish shape:** `e2e-cli-prod` is the
  post-publish authority; pre-merge, record it as `DEBT_ACCEPTED` with an alpha/beta post-publish
  target (the #167 pattern) when the published packages do not yet exist.
- **The run is not a release cut and does not touch the above surfaces:** the release-gate class is a
  **no-op** (matching run-loop § 8).

## Evidence bar

Release-gate evidence is the **raw exit code plus failing suite/test names**, sourced from the named
command or Action — not "it should pass" and not a green dry-run. `deno publish --dry-run` is a
static gate, never a substitute for `e2e-cli-prod`: the dry-run does not exercise the remote
`https:`/`jsr:` graph where self-referential subpath imports, top-level `import.meta`/`fromFileUrl`,
and filesystem asset reads fail (see `jsr-audit` § JSR publish gotchas). The gate is expensive — run
it during the evaluator / merge-readiness pass or when explicitly requested, not every
implementation loop.

## Failure handling

A release-gate failure is `FAIL_FIX` and blocks the cut: fix forward, re-run, and record the raw
exit code. It becomes `FAIL_RESCOPE` only when the failure proves the release plan omitted necessary
publish or packaging work. A run may not carry `status:ready-merge` on a release cut while any
release-gate is red or unrun.
