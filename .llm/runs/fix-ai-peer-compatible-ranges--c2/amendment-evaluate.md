# IMPL-EVAL (amendment) — transitive AI peer holders + frozen consumer locks (#2036 / PR #2087)

- Evaluator: independent GLM max session family (opencode-go/glm-5.3-flash), 2026-10-08; separate
  from the implementation lane. Same independent session per follow-up allowance; prior
  doctrine/lane/verdict context retained; no baseline forensics repeated.
- **Actual current HEAD:** `d5c07c0874eb561f130957d1867bd84ff2c5dd6d` — "docs(harness): brief
  independent transitive peer amendment evaluation"; `git diff f413a1f6..d5c07c08` adds only run
  artifacts (brief + 4 worklog lines), working tree clean before and after this evaluation.
- **Amended source head (evaluated, immutable):** `f413a1f612683f054d44d74297627129987feff9` —
  "fix(ai): qualify transitive peer holders and frozen consumer locks".
- **Diff base:** `b462d69cc` ("docs(harness): record qualified AI amendment plan pass"); PLAN-EVAL
  PASS at `46ec3293b5f5474ab7816786d5221af536cae50f` (verified ancestor of the source head).
- **Baseline main:** `872df8e21e0a8bf06cd0796c7808068dd67e2c4e`. Superseded original PASS identity:
  source `b03385dc31cfee4df098639d5c22cd616db38d00` / record `76381639db9061222c517e2260d91daab1473ae3`.
- Archetype 2 integration (dependency tooling slice); overlays none; scope = final plan remediation
  A1–A5; slice diff is 10 files (< 30), guard/test/pins/locks/README/debt/run artifacts.

## Scoped review (diff `b462d69cc..f413a1f6`, read in full)

| Area | Finding |
| ---- | ------- |
| Pins (A1) | Exact, no ranges: packages/ai → ai 0.65.0, anthropic 0.19.5, mcp 0.8.0, openai 0.27.0; packages/fresh → ai 0.65.0, ai-preact 0.19.5. Matches the PLAN-EVAL-qualified family verbatim. |
| Guard (A2) | New exported `resolvedNpmSpecifiers`: name-independent exact-release inventory — first-`@` boundary parse (correct for scoped/unscoped names; malformed ids throw), peer-suffix `_`-stripping, Set dedupe. Cold sweep checks **every** resolved npm release (batched 8 at a time — bounded subprocess concurrency), feeds all into the retained all-admitted-version `findAiPeerConflicts` policy; exactly-one-core enforcement unchanged. Published-mode imports remain genuine (`jsr:@netscript/ai@<v>/anthropic|openai-compatible`, no consumer overrides). No prefix assumptions remain anywhere. |
| Regressions (A2) | Existing policy test retained; new "cold graph inventories transitive and external AI peer holders without prefix filtering" test covers the transitive holder (openai-base under both peer-key variants, dedupe), a non-TanStack external holder, and the exact CI conflict (`openai-base@0.10.16 requires ^0.59.0; got 0.52.3`). |
| Locks (A3) | Both `deno.lock` files: only AI-family specifiers/entries re-keyed (single core `0.65.0` in every AI key), plus graph edges belonging to the upgrade (`@modelcontextprotocol/client|core|server@2.3.1`, `fast-json-patch@3.1.1`, `@ag-ui/core 1.0.0`, ai-client 0.29.2→0.37.0, ai-event-client →0.13.1, ai-utils →0.4.1, openai-base →0.12.4) and the acknowledged exception: added `jose@6.2.12` (MCP) beside retained `6.2.3` with native disambiguation edits. Fresh UI additionally gains the necessary `jsr:@std/semver@1` workspace edge to match the root manifest. Every unrelated version identity preserved; no lock/cache deletion. |
| Bridge (A4) | **No owning-bridge change needed** — verified: zero `.ts` diffs in packages/ai or packages/fresh source; packages/ai/README.md only (documented family 0.65.0/0.19.5/0.27.0/0.8.0/0.19.5, guard description now states release-independent inventory incl. openai-base/external holders, Fresh UI private frozen-lock note, dependency-age note; non-closing shipment statement retained; remainder is table reflow/wrap churn). |
| Debt | New well-formed row `fresh-doc-baseline-2036` (reason/owner/target/linked plan/status/gate); `ai-doc-private-ref-baseline-2036` unchanged. Adjudication below. |

## Independently executed checks (this session — verdict source)

| Check | Command | Exit | Result |
| ----- | ------- | ---- | ------ |
| Structured guard regression | `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts` | 0 | 2 passed / 0 failed, frozen mode |
| Live cold guard (once) | `deno task deps:check:ai-peers` | 0 | `{"ok":true,"core":["0.65.0"],"lockFree":true}` — one core, lock-free |
| Workspace integrity | `git status --porcelain` | — | clean before and after; no source/config/lock edits, no branch/history/public-metadata change |

## Contributed evidence adjudicated (private item-2036)

| Evidence | Adjudication |
| -------- | ------------ |
| `amendment-mutation-selection` (exit 1) | Genuine selection kill: only the inventory test fails, with a prefix-filter-shaped diff (core/openai-base/external rows dropped). Selection layer is mutation-proven. |
| `amendment-mutation-policy` (exit 1) | Genuine policy kill: both tests' conflict assertions fail with expected conflict strings. Peer-policy layer separately mutation-proven. |
| `amendment-restored-peer-tests` (exit 0, 2/2) | Restored pass after both mutations. |
| `amendment-peer-receipt.json` + `amendment-durable-peer-receipt` | Post-source durable receipt: `gitHead == actualGitHead == f413a1f6…`, PASS, sha256-pinned 46-byte stdout — the round-1 receipt-hygiene lesson applied. |
| `amendment-frozen-source-explicit` / `amendment-frozen-fresh-ui-check` | 326 and 150 files checked, 0 occurrences, frozen mode — the CI-failing Fresh UI gate is now green on the amended tree. |
| `amendment-cold-full-peer-guard` | exit 0, `{"ok":true,"core":["0.65.0"],"lockFree":true}` (receipt-pinned, matches my independent run). |
| `amendment-provider-suite` | 165 passed / 0 failed (packages/ai/tests + plugins/ai/tests). |
| `amendment-bundle` | Production provider bundles built: 441 modules, anthropic.js 369.65KB, openai-compatible.js 389.22KB. |
| `amendment-jsr-ai` / `amendment-jsr-fresh` | exit 0; the two WARNs (F-DOCT-5 ports cardinality, F-JSR-7 slow-types probe) are byte-identical to the round-1 audit — pre-existing, not introduced. |
| `amendment-publish-ai` / `amendment-publish-fresh` | "Success Dry run complete" both. |
| `amendment-quality` / `amendment-carrier-freshness` / `amendment-fmt` / `amendment-guard-check` | exit 0. `amendment-lint` exit 2 (config-less attempt, failed before lint) transparently retained and corrected to exit 0 (`amendment-lint-corrected`); no new `// deno-lint-ignore` or `as unknown as` in the changed source. |
| `amendment-published-negative` (exit 1, intended) | `--published-version` mode still rejects the current published 0.0.7 and now names `@tanstack/openai-base@0.10.16 requires AI ^0.59.0` — the sweep's transitive reach proven against real published artifacts. |

## F-7 doc-debt adjudication (explicit, per brief)

- **`ai-doc-private-ref-baseline-2036` (existing row):** per-entry diagnostic JSON from the amended
  branch is **identical** to the round-1 baseline record entry-for-entry (agent 20, anthropic 5,
  mod 26, ollama 5, openai-compatible 8, openrouter 5, ports 35, testing 17, tools 7; others zero),
  same exit codes; the amendment changed no AI source. → Row remains **open, unchanged** existing
  baseline debt; no deepening. F-7 = DEBT_ACCEPTED for this slice.
- **`fresh-doc-baseline-2036` (new row):** the valid comparison (complete current-main archive
  preserving workspace globs, `amendment-fresh-doc-baseline-workspace`) matches the branch run
  (`amendment-doc-fresh`) **entry-for-entry in diagnostics and entrypoint exit codes** (builders 3,
  query 8, route 8+17 missing JSDoc, streams 11; AI exports `./src/runtime/ai/*` zero). The earlier
  incomplete-archive probe failed before linting (missing archive deno.json) and is superseded; no
  combined-summary green was claimed. → Valid existing-baseline record; the amendment introduces no
  Fresh doc diagnostic (no Fresh source in the diff). F-7 = DEBT_ACCEPTED for this slice; both rows
  stay open with their pre-stable-release targets.

## Fitness/anti-pattern notes

F-19 structured runners used throughout; F-5 public surface unchanged (pins + docs only; contracts/
ports untouched per README and JSR audit); AP-2/AP-5 clear (reuses `workspace.ts`, `@std/semver`,
native lock machinery; no new abstraction); guard output remains a single structured line. Slice
aggregation: A1–A4 landed as one source commit rather than four — consistent with this run's
first-round precedent (S2) and fully documented per-gate in worklog; low note only.

## Verdict

`PASS` — the amended source at `f413a1f612683f054d44d74297627129987feff9` completes the qualified
scope: exact peer-coherent default-age family, name-independent inventory of every resolved release
with bounded registry sweep, exactly one core, retained all-admitted-version policy and genuine
published-mode imports, separately mutation-proven selection and policy regressions with restored
passes, both locks selectively refreshed with unrelated identities preserved (jose exception
acknowledged), no owning-bridge change required, and both F-7 doc rows adjudicated as unchanged
existing-baseline debt with explicit evidence.

**Shipment statement:** publication, published-consumer qualification (a future coordinated release
with the fix), CI receipt on the PR head, and merge remain **unproven owner work**. This verdict
covers the amended source slice only; PR #2087 stays non-closing for #2036; do not merge or publish
on this verdict.
