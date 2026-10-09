# IMPL-EVAL (final review/CI follow-up) — B1–B3 exact-source delta (issue #2036 / PR #2087)

- Evaluator: fresh independent session, owner-directed GLM max route
  (`opencode-go/glm-5.3-flash`, max), 2026-10-08; separate session and vendor family from the
  generator lane (OpenAI `gpt-6.1-sol`). No delegation, no CI polling or sleeps; no
  source/config/lock/history/public writes, branches, or broad gates. Evaluation confined to this
  checkout and private sibling evidence `/…/unblock-1007/evidence/c2/item-2036` (operator paths
  omitted from public artifacts as required). `rtk` unavailable; native tools preserved raw exit
  codes. Working tree clean before and after; the only write of this session is this report.
- **Exact HEAD at evaluation:** `3a71fbeab427df7b8aaacddc90f88b7705dc5d1a` — "docs(harness): brief
  exact-source independent AI guard review" (run-dir brief only, +3; docs-only, so the
  exact-source tree equals the source commit).
- **Exact source head (evaluated, immutable):** `93220ff73c17c3edb66f22293c97ee9c1c2a0cb4` —
  "fix(deps): reject ambiguous AI probes and preserve every admitted peer".
- Diff base: `f9ba4e3515000c45f2ac7ec0456fe06ad8fe4590` (B PLAN-EVAL record commit; the PASS report
  itself was authored at that HEAD and verified "no source edits yet" there);
  `git merge-base --is-ancestor` confirms the PLAN-EVAL record is an ancestor of the source commit.
  Prior identities retained: qualified-family source `f413a1f6…` (IMPL-EVAL PASS head `d5c07c08…`),
  amendment PLAN-EVAL PASS `46ec3293b5f5474ab7816786d5221af536cae50f`, baseline `872df8e21e0a8bf06cd0796c7808068dd67e2c4e`.
- Delta scope verified: exactly 4 source files (`check-ai-peers.ts` +173/−, `check-ai-peers_test.ts`
  +91/−, `import-resolver.ts` +15/−, `import-resolver_test.ts` +39/−) plus 4 run artifacts. **No
  family/lock/API changes**: no `deno.json`, no `deno.lock`, no `packages/ai|fresh` source in the
  delta; full diff read, zero `deno-lint-ignore` / `as unknown as` introduced. Archetype 2;
  overlays none.

## Process verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Plan-Gate passed before implementation | PASS | `review-plan-evaluate.md` verdict `PASS` at `f9ba4e351…`; record is an ancestor of the source commit (verified) |
| Design checkpoint in worklog | PASS | worklog `## Design` (surface, ports, slices, PLAN-EVAL record) |
| Commit slices match design | PASS | one source slice naming what it proves ("reject ambiguous AI probes and preserve every admitted peer"); ≤10 files as planned |
| Each named gate evidence | PASS | per-gate receipts below; failed-required-gate evidence retained (runtime section) |

## Scoped review of B1–B3 (diff read in full)

| Item | Adjudication |
| ---- | ------------ |
| B1 parser | New exported `parsePublishedVersion` via `jsr:@std/cli@1/parse-args` (locked in `deno.lock`, no lock churn): `string`+`collect` on `published-version`; `unknown` callback throws (typo'd flags rejected before workspace reads); positional/missing/duplicate (`_.length`, `length>1`) rejected; regex + `@std/semver parse` validation; both `--published-version=v` and space forms return the value, none → workspace mode. Regression covers both accepted forms and all seven unsafe inputs (missing, `=`, range, invalid, typo'd flag, positional, duplicate). |
| B2 loader | New exported `loadRegistryVersions(specifier, view)`: enums `version` only; per-exact-release `peerDependencies` queries; batch `index += 8` (bounded); blank/empty stdout → `undefined` → peerless (peer-less first release forced by fixture and real output); npm singleton-array wrap normalized explicitly (`length===1 ? [0] : metadata`) with fixture coverage; malformed shapes throw with named specifiers. Cold inventory (`resolvedNpmSpecifiers`, batch-8 cold sweep, exactly-one-core) untouched. Regression asserts the exact query sequence and that an incompatible middle release (`0.3.1 ^0.53.0` vs core `0.52.3`) is retained, causing the conflict. |
| B3 CLI pin | Sole constant `TANSTACK_AI_MCP_SPECIFIER` = `npm:@tanstack/ai-mcp@0.8.0` (`import-resolver.ts:18`; no other `ai-mcp@` pin remains in non-test CLI source), matching owning `packages/ai/deno.json:33` and lock resolution `0.8.0_@opentelemetry+api@1.9.1_zod@4.4.3`; all four existing assertions updated to exact `0.8.0` (`import-resolver_test.ts` jsr/local resolver-map and both default cases); remainder of both CLI files is fmt reflow only. The adjacent workspace-mutator regression compares against the live owning manifest (self-enforcing). |

## Independently executed checks (this session — verdict source)

| Check | Command | Result |
| ----- | ------- | ------ |
| Guard regressions (all four) | `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts` | exit 0, **4 passed / 0 failed**, frozen |
| Adjacent CLI suites (both) | same runner on `import-resolver_test.ts` + `workspace-mutator_test.ts` | exit 0, **28 passed / 0 failed**, frozen — but see env note below |
| Live cold guard (once) | `deno task deps:check:ai-peers` | exit 0, `{"ok":true,"core":["0.65.0"],"lockFree":true}` |
| Real-registry shape probe | `npm view @tanstack/ai@0.65.0 peerDependencies --json` | `[{"@opentelemetry/api": ">=1.9.0"}]` — **singleton array** |
| Working-tree integrity | `git status --porcelain` | clean before/after; zero edits |

**CLI-suite env note (honesty):** first rerun attempt reported 27/28 with exit 1 — the failing test
(`first-party control-plane modules are import-safe…`) is a subprocess-spawn test, and its spawned
`deno` resolved through a mise shim with no configured version in my shell
("mise ERROR No version is set for shim: deno") — a session toolchain fault, not a source
assertion. Re-run process-locally with the real binary on the child `PATH`
(`qualified Deno executable directory`, deno 2.9.7; no config/system write) reproduced the generator receipt
exactly: 28/28, exit 0. `review-cli-tests` (exit 0, 28/28, durationMs 16230) adjudicated genuine.

## Contributed evidence adjudicated (private item-2036)

| Evidence | Adjudication |
| -------- | ------------ |
| `review-mutation-equals` (exit 1, durationMs 674) | Genuine parser kill: the equals-form assertion failed (`undefined` vs `"0.0.7"`) — disabling equals parsing is caught by the new test only. |
| `review-mutation-mixed-peers` (exit 1, durationMs 670) | Genuine metadata kill: expected conflict `['@tanstack/ai-mcp@0.3.1 requires AI ^0.53.0; got 0.52.3']` was **lost** (`[]`) — omitting exact per-release peer metadata fails the new test. Worklog transparently retains the first attempt's invalid zero exit (mutation not applied after fmt) as superseded. |
| `review-restored-guard-tests` (exit 0, 4/4) | Restored pass after both mutations; causal pairs complete (4/4 mutation+restored). |
| `review-live-cold` (exit 1, retained) | Explained: "Malformed registry peers for @tanstack/ai@0.65.0" — my own probe proves npm wraps even exact-release peer output in a singleton array, which the pre-normalization loader rejected; drift.md records the B follow-up. Superseded by the normalized final loader. Kept as failed-intermediate evidence. |
| `review-live-cold-final` (exit 0) | `{"ok":true,"core":["0.65.0"],"lockFree":true}` — independently reproduced by my live run above. |
| `review-published-negative-equals` / `…-space` (both exit 1, intended) | Both forms parse `0.0.7` correctly and fail at the same genuine conflict throw in `coldResolution`: `@tanstack/ai-anthropic@0.18.13 requires AI ^0.59.0`, `@tanstack/ai-openai@0.22.8 requires AI ^0.55.0`, `@tanstack/openai-base@0.10.16 requires AI ^0.59.0` vs core 0.52.3 — the real published 0.0.7 peer conflicts (ctag line numbers match the final source). Negative reproduction only, no fixed-published claim. |
| `review-final-lint` / `review-final-fmt` / `review-final-check` (exit 0) | 4 files, 0 findings, coverage complete, no refusals; earlier `review-fmt-write` partial-exclusion refusal transparently superseded by `review-fmt-final` (4/4, full coverage). No new lint suppressions in delta (verified). |
| `review-cli-doc` (exit 0) | packages/cli all-export doc lint: every entrypoint 0, combined totals all zero — genuinely green, no combined-summary claim issue. |
| `review-cli-jsr` (exit 0) / `review-cli-publish` | JSR audit exit 0 (F-DOCT-5 cardinality WARNs pre-existing baseline); "Success Dry run complete". |
| `review-quality` / `review-carrier` / `review-guard-check` | quality:gate `FAIL=0` per file, `allowanceFailures:[]`, allowances only pre-existing issue-1276 rows; carrier freshness exit 0; frozen guard check exit 0. |

## Runtime qualification — required gate RUN and FAILED (retained, not waived)

`review-scaffold-runtime`: the required full one-pass `deno task e2e:cli run scaffold.runtime
--cleanup --format pretty` (not split gates) has task-level raw exit **1**; per-gate receipts show
exactly two failed gates:

- `preflight.aspire` — FAIL, exit 1: `aspire doctor failed (1)` (Aspire environment unavailable).
- `cleanup.aspire-stop` — FAIL, exit 1: `docker ps -aq failed (1): Cannot connect to the Docker
  daemon at unix:///var/run/docker.sock` (Docker unavailable).

Infrastructure unavailability only; no source assertion failure. `preflight.deno` passed (info
line) and **no suite or gate is reported green or skipped-green** in the run output. Per the
plan ("preserve raw failed gate names if unavailable") and this brief: **scaffold.runtime remains
failing at preflight.aspire and cleanup.aspire-stop on the as-yet-uncommitted-tree receipt; a
successful runtime receipt on the exact source head (CI or qualified local re-run with available
infrastructure) is required before any merge-readiness claim. The requirement is NOT waived and
runtime/merge readiness is NOT claimed.**

## F-7 doc-debt adjudication (carried forward)

No `packages/ai` / `packages/fresh` source changed in the delta, so
`ai-doc-private-ref-baseline-2036` and `fresh-doc-baseline-2036` (arch-debt.md, last touched at
`f413a1f61`) are **unchanged** — the prior acceptance premised on an unchanged baseline remains
**applicable**: both rows stay open with unchanged diagnostics (AI per-entry baseline; Fresh
per-entry baseline; Fresh AI exports zero). packages/cli doc lint is independently green (above),
so no new CLI doc finding; the "new CLI doc findings fixed" plan condition is satisfied (none
found). Debt delta: 0 new, 0 resolved, 0 deepened, 0 unrecorded.

## Fitness / anti-pattern notes

F-19 structured runners and receipts throughout; F-5 public surface unchanged (non-exported
constant string + guard/tool-internal exports; contracts/ports untouched); AP-2/AP-5 clear
(standard `@std/cli` parseArgs, `@std/semver`, no new abstraction); no prefix assumptions, no
`any`/casting in the delta; the quality scan (`review-quality`) covers `packages`/`plugins`/`docs`
with `ok:true` and only pre-existing allowances.

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low (process note, non-blocking) | The dispatch brief for this evaluation omits the harness `## SKILL` chapter (as did the two preceding run briefs, unlike `impl-eval-brief.md`). | `.llm/runs/…/review-impl-brief.md` (3-line brief) | Owner's compact dispatch-brief convention; skill-loading obligation was satisfied in effect ("use harness" opener → netscript-harness skill and protocol/verdict docs loaded). Record-only; no rework. |
| low (transparency) | Evaluator's first CLI-suite rerun hit a session-only mise-shim toolchain failure, resolved process-locally without config writes; final rerun reproduces the generator receipt exactly. | env note above | None. |

## Owner work retained after this verdict (explicit)

1. Successful one-pass `scaffold.runtime --cleanup --format pretty` on the exact source head
   (`93220ff73…`) with available Aspire/Docker infrastructure — or a green CI gate receipt on the
   PR head; raw failed gates today: `preflight.aspire`, `cleanup.aspire-stop`.
2. `e2e-cli-prod` post-publish verification remains owner authority; the CLI source pin
   (`0.8.0`) cannot ship independently of a coordinated release containing the AI family.
3. Publication/consuming-release qualification and the fixed published-consumer receipt remain
   open — `Refs #2036` only, no closing keyword; do not merge or publish on this verdict.

## Verdict

`PASS` — for the **B1–B3 exact-source slice at `93220ff73c17c3edb66f22293c97ee9c1c2a0cb4`**,
evaluated at docs-only HEAD `3a71fbeab427df7b8aaacddc90f88b7705dc5d1a`. The approved scope is
complete: strict both-form argument parsing that rejects unsafe selection before workspace reads;
enumerate-then-exact-release peer queries that eliminate the combined-output metadata-loss class
(independently confirmed against real npm output, including the singleton-array wrap and
peer-less blank releases) with bounded concurrency and the cold inventory unchanged; the sole CLI
MCP scalar pin and all adjacent assertions corrected to the owning exact `0.8.0`; both new
regressions separately mutation-proven with restored passes; both genuine published negatives
reject the same actual baseline conflicts through both argument forms; all static selected
check/lint/fmt, quality, carrier, CLI JSR/doc/publish checks pass as recorded; no family/lock/API
change and no doctrine violation introduced; the required runtime gate was genuinely run and its
failure (two named infrastructure gates) is retained rather than waived, keeping runtime/merge
readiness and publication **blocked as owner work**.

Proof of source behavior by this verdict is **distinct and only distinct** from the open runtime,
merge, and publication qualification listed above.

No release, merge, or publication is authorized or implied by this evaluation.
