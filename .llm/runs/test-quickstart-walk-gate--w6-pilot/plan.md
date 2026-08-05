# Plan — LOCKED

## Scope

Add `quickstart.walk` as an Archetype-6 semantic E2E suite, update the Quickstart command walk to the contract it verifies, and execute it beside `scaffold.runtime` in published-CLI canary validation.

## Locked decisions

1. Exactly seven critical gates map one-to-one to issue #1294's seven steps, so every failure names the broken walk step.
2. Use the existing suite runner and command/http infrastructure. A small quickstart-specific suite module owns only command composition and its seven gate definitions.
3. Initialize without a service, then execute `netscript service add --name users` and type-check immediately, directly covering #1290.
4. Run Aspire restore and start inside one gate through a bounded helper that reports `quickstart.aspire.restore.timeout:#1227` or `quickstart.aspire.start.timeout:#1227`; no real sleeps in tests.
5. Run DB init/generate/seed only after Aspire start succeeds.
6. Resolve and probe the generated users service through Aspire topology, never a guessed port.
7. Keep a finite command manifest in the suite and parse Quickstart fenced shell blocks in a drift test. The test compares normalized commands in order.
8. The suite is JSR-only. The workflow passes `--source jsr` and an exact `jsr:@netscript/cli@<version>` specifier.
9. Preserve the pre-existing `deno.lock` change and never stage it.

## Commit slices

1. **Plan contract** — run artifacts; gate: D6 composed plan rows complete.
2. **Seven-verdict suite** — CLI constants, suite, bounded Aspire helper, fake-executor tests, registry tests, docs command walk and drift test; gates: focused E2E tests plus suite listing/gates.
3. **Published canary wiring** — workflow runs `quickstart.walk` beside `scaffold.runtime`, with distinct report artifacts; gates: workflow/static inspection and focused checks.
4. **Evaluation and close-gate evidence** — full selected gates, separate IMPL-EVAL, acceptance evidence, review-thread gate, ready transition.

## Gate set

- Focused `deno test` for quickstart suite, drift, timeout classification, and registry.
- `deno task e2e:cli suites` and `deno task e2e:cli gates quickstart.walk`.
- Scoped check/lint/fmt wrappers for `packages/cli/e2e`.
- `deno task quality:gate` and `deno task arch:check` because `packages/**` changes.
- Release-gate static proof; the exact published canary execution is provided by `e2e-cli-prod.yml` after publication, not fabricated locally.
- Lockfile diff and no-new-ignore scans.

## Risks

- A combined Aspire step could hide which command hung. Mitigation: helper emits command-specific #1227 classification.
- Docs parsing could be brittle around prose/comments. Mitigation: normalized executable lines from explicitly marked walk blocks and focused drift fixtures.
- Cleanup after early failure could leak resources. Mitigation: reuse the suite cleanup tail and exact AppHost stop.
- Published CLI could accidentally fall back to local. Mitigation: constructor validation plus command-shape tests.

## Open-decision sweep

- Must resolve now: exact seven gate IDs/titles and command order — resolved above.
- Safe to defer: running the suite against an unpublished local CLI; it would weaken the issue contract and is intentionally unsupported.

## Debt and deferred scope

No new architecture debt. Clean-machine image provenance remains owned by the GitHub runner/workflow rather than the suite. Actual canary runtime evidence necessarily occurs after a version is published.

