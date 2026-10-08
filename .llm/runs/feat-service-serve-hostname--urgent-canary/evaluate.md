# Evaluation: PR #2075 — service listener hostname (issue #2074)

Bounded independent IMPL-EVAL continuation, evidence-only per the run brief. No product source
was changed by this evaluation session. All writes remained in this checkout (run dir + `.llm/tmp/`
transients) or the provided TMPDIR.

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `feat-service-serve-hostname--urgent-canary` |
| Target         | PR #2075 (`feat(service): bind the listener to an explicit hostname`) resolving #2074 |
| Archetype      | 4 — Public DSL / Builder |
| Scope overlays | service (no frontend; docs surfaces touched) |
| Evaluator      | separate opencode session, `opencode-go/glm-5.3-flash` (owner override per HARNESS.md; Google Gemini fallback not needed) — IMPL-EVAL round 1 |
| Generator      | gpt-6.1-sol (high), Lane C API session, per `supervisor.md` — vendor/session family differs from evaluator |
| Exact HEAD     | `b05bf4c5a88ae7925e571960f63aa6f18ecfb00f` on `feat/service-serve-hostname`, clean tree, in sync with origin |
| Product-source identity | diff `fa5aa5d71..HEAD` touches only run-dir artifacts (7 files, +43 lines); product diff is `6f6cbdf03..fa5aa5d71`. The runtime proof below therefore covers HEAD's product source exactly. |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | PASS   | `plan.md` records `PLAN-EVAL: N/A` with the run-loop §4 reason (carried-in contract verified, bounded evidence refresh, no public design decision); recorded before implementation phases in `worklog.md` |
| Design section exists in worklog       | PASS   | `## Design` in `worklog.md` (public surface, chain shape, slices, contributor path) |
| Commit slices match design plan        | PASS   | PR commit list: `53cc9362b` (S1 contract+tests), `fa5aa5d71` (S2 generated carriers), `b05bf4c5a` (run-dir bootstrap only); no new product slices, matching the plan |
| Each slice has a passing gate          | PASS   | S1/S2 gates in PR-body Validation; scoped set independently re-run this session (below) |
| No speculative seams (unused files)    | PASS   | Only reachable files: 3 source edits, 2 test files (run), README, reference page, 4 regenerated carriers, run artifacts |
| Constants used for finite vocabularies | PASS   | `LOOPBACK`/`ALL_INTERFACES` test constants; no new domain vocabulary introduced |
| Commit trail integrity                 | PASS   | Draft-PR commit list + body Slices + one `[PHASE: PLAN]` comment; no per-slice comments beyond the body (noted, low) |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `.llm/tools/run-deno-check.ts --root packages/service --ext ts,tsx` | PASS | 52 files, 1 batch, 0 failed, exit 0 | wrapper-sourced |
| Slice typecheck  | same run (covers all package sources) | PASS | 52 files, 0 findings | — |
| Format           | `.llm/tools/run-deno-fmt.ts --root packages/service --ext ts,tsx` | PASS | 52 files, findings 0, exit 0 | — |
| Lint             | `.llm/tools/run-deno-lint.ts --root packages/service --ext ts,tsx` | PASS | 52 files, 0 findings, exit 0 | vendored minified Scalar asset outside ts/tsx scope; pre-existing |
| Doc lint         | `deno task doc:lint --root packages/service` | PASS | 0 errors / 0 private-type-ref / 0 missing-JSDoc across 3 entrypoints, exit 0 | — |
| Publish dry-run  | `deno task --cwd packages/service publish:dry-run` | PASS | "Success Dry run complete", no slow types | — |
| Link/path check  | `deno task docs:links`; `deno task docs:jsdoc-examples` | PASS | broken-links 0, broken-anchors 0, orphans 0; example compile exit 0 | — |

## Fitness Gates

| Gate | Function | Result | Evidence | Violations |
| ---- | -------- | ------ | -------- | ---------- |
| F-1  | File-size lint | FAIL | `deno task quality:gate` exit 0 but new WARN: `packages/service/src/types.ts` 302 lines vs cap 300 (292 on main; +9 this PR) | New warning-level crossing, no debt entry — finding below |
| F-2  | Helper-reinvention scan | PASS | arch:check exit 0; no helper findings on changed files; native `Deno.serve` used directly | — |
| F-3  | Layering check | PASS | arch:check exit 0, no layering findings | — |
| F-4  | Inheritance audit | PASS | arch:check exit 0; only pre-existing generated-Scalar class warnings (Gq/dW), untouched | — |
| F-5  | Public surface audit | PASS | export map / `mod.ts` unchanged (`git diff 6f6cbdf03..HEAD -- packages/service/{deno.json,jsr.json,mod.ts}` = 0 lines); additive optional fields only | — |
| F-6  | JSR publishability gate | PASS | publish dry-run success, no slow types | — |
| F-7  | Doc-score gate | PASS | doc:lint 0; new `hostname` fields carry JSDoc + example on `ServeOptions`, `DefineServiceOptions` | — |
| F-8  | Workspace `lib` override check | PASS | arch:check exit 0 | — |
| F-9  | Permission declaration check | PASS | arch:check exit 0 | — |
| F-10 | Test-shape audit | PASS | real-socket tests assert observable behavior; non-loopback dial steps ran (3 refused / 2 accepted), none silently skipped | — |
| F-11 | Forbidden-folder lint | PASS | arch:check exit 0 | — |
| F-12 | Naming-convention lint | PASS | arch:check exit 0 | — |
| F-13 | Saga and runtime invariants | N/A | not an Arch-4 gate | — |
| F-14 | Console-log lint | PASS | arch:check/quality:scan exit 0; no new console emission (banner logging unchanged, pre-existing) | — |
| F-15 | Re-export-of-upstream lint | PASS | arch:check exit 0; no new re-exports | — |
| F-16 | Folder-cardinality lint | PASS | arch:check exit 0; only pre-existing warning in an unrelated unit (`sdk`) | — |
| F-17 | Abstract-derived co-location lint | PASS | arch:check exit 0 | — |
| F-18 | Sub-barrel lint | PASS | arch:check exit 0 | — |
| F-19 | Scoped source gate runners | PASS | all static/typecheck evidence above from `.llm/tools/run-deno-*.ts` wrappers, not raw root CLI | — |

Quality gate `deno task quality:gate` (quality:scan + arch:check): exit 0; warnings pre-existing
except the F-1 row above.

## Carrier Freshness

| Carrier | Result | Evidence |
| ------- | ------ | -------- |
| `check:agent-docs-prose` | PASS | exit 0 (`--check` regenerates and compares) |
| `check:publish-assets` | PASS | exit 0 |
| `check:assets-barrel` | PASS | exit 0 |
| `check:mcp-export-corpus` | NOT_RUN (environment) | Task form fails in this sandbox (`NotCapable` on the spawned deno path); direct run with expanded permissions flags "stale" **solely from gzip-encoder nondeterminism**: regenerated payload decompresses to JSON byte-identical to the committed carrier (2223101 chars both, diff exit 0; only compressed size 324256 vs 324250 and its sha differ). Content is fresh; no hand edit. |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| Real-listener tests (focused) | loopback-only bind, omitted-hostname controls plain+TLS, port 0 via `serve()` and config default, TLS parity with verified HTTPS request, manual stop (idempotent, `reason: 'manual'`), external signal, OS-signal install/remove, `defineService` forward | PASS | suite 165 passed / 0 failed / exit 0; focused files 19 ok; all 5 non-loopback dial steps executed, none skipped |
| Authoritative runtime CI | full `scaffold.runtime` e2e at exact product source | PASS | workflow 37188990407, conclusion success at `fa5aa5d71` (`scaffold.runtime` 104/0/0, `scaffold.runtime.sqlite` 98/0/0); product source identical at HEAD (see Metadata) |
| Local `scaffold.runtime` re-run | not re-run this session | NOT_RUN | expensive; authoritative identical-source CI proof already exists; brief bounds this review |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| `@netscript/service` export surface | additive optional field, no export/subpath change | PASS | export-map diff empty; doc-lint + publish dry-run clean |
| Generated-scaffold consumer | generated service starts through `defineService() → serve()` with `hostname` omitted | PASS | authoritative CI scaffold.runtime gates incl. generated users-service health at `fa5aa5d71` |
| Repo-wide consumers | workspace compiles with the new optional field | PASS | PR-body `deno task check` exit 0 at head + CI; scoped check re-run here |

## Shared Dependency Audit (plan gate, blocker)

| Item | Result | Evidence |
| ---- | ------ | -------- |
| Critical dependency audit | FAIL | `deno task deps:audit` on the current main lock reports **39 vulnerabilities**; still present: **proxy-addr GHSA-jqcg-44mw-7w3h** (IP spoofing via IPv4-mapped IPv6 trust subnet, vulnerable `>=1.1.0 <2.0.8`; lock pins `proxy-addr@2.0.7`). Same shared blocker as the first run; unchanged by this evidence-only run |

## CI State at HEAD

| Workflow | Result | Evidence |
| -------- | ------ | -------- |
| Full current-head CI | PENDING (skipped, not red) | all path-filtered workflows on `b05bf4c5a` report `skipped` while the PR is draft; per brief, not waited on. Moves to blocking evidence when the PR leaves draft |
| Draft-run extras | Pages deploy success at `b05bf4c5a`; `e2e-cli` success at `fa5aa5d71` (identical product source) | workflow list + run 37188990407 |

## Close-Gate Readiness

`Closes #2074` is wired in the PR body; #2074 contains no close-gated checkboxes (plain-bullet
request list), so no acceptance mirror is needed. PR DoD boxes are all checked with evidence.
`status:impl` with draft state is correct — merge readiness remains blocked (see Verdict).

## Anti-Pattern Check

| AP | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | VIOLATION | `types.ts` 302/300 lines (new warning), no debt entry | warning-level; see finding 2 |
| AP-2  | CLEAR | native `Deno.serve` used directly, no renaming wrapper | — |
| AP-3  | N/A | no interface added | — |
| AP-4  | N/A | no inheritance introduced | — |
| AP-5  | N/A | no base-class change | — |
| AP-6  | N/A | no base class touched | — |
| AP-7  | CLEAR | options-object factory preserved; no positional telescoping | — |
| AP-8  | CLEAR | no DI container introduced | — |
| AP-9  | CLEAR | plain optional field; no speculative typestate/generics | — |
| AP-10 | N/A | no handler try/catch touched | — |
| AP-11 | CLEAR | no new module-level mutable state | — |
| AP-12 | N/A | no handler timing code touched | — |
| AP-13 | CLEAR | no new console emission; banner unchanged | — |
| AP-14 | CLEAR | no upstream re-export added | — |
| AP-15 | CLEAR | `hostname` is caller vocabulary, no `IFoo`-style names | — |
| AP-16 | CLEAR | no new `utils/`-class folder | — |
| AP-17 | N/A | no `interfaces/` folder | — |
| AP-18 | N/A | no snapshot of giant generated string added | — |
| AP-19 | CLEAR | no silently assumed permission | — |
| AP-20 | CLEAR | arch:check lib-override gate green | — |
| AP-21 | N/A | no command surface | — |
| AP-22 | N/A | no sub-builder barrel added | — |
| AP-23 | N/A | no composition body | — |
| AP-24 | N/A | no variant-tag switch | — |
| AP-25 | CLEAR | forwarding is pure; TLS config resolution stays lazy in the listener edge | — |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | `debt/arch-debt.md` unchanged this session; no entry covers the new `types.ts` cap crossing (finding 2) |
| Resolved entries      | 0     | — |
| Deepened violations   | 1 (warning-level) | F-1/AP-1 on `packages/service/src/types.ts`, introduced by the +9 lines of this PR |
| Unrecorded violations | 1 | the same crossing lacks a debt entry |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| high | Shared main-lock critical dependency advisory unresolved: proxy-addr `2.0.7` < fixed `2.0.8` (GHSA-jqcg-44mw-7w3h); audit reports 39 vulnerabilities overall | `deno task deps:audit` output; `deno.lock` `proxy-addr@2.0.7` | Owner-directed dependency maintenance before readiness, as planned; not bundled into this PR |
| low | `packages/service/src/types.ts` crossed the F-1 cap (292 → 302 lines, cap 300): new arch:check warning, no debt entry | quality-gate log; `wc -l` vs `git show 6f6cbdf03` | Split or record debt entry in a follow-up; gate still exits 0 |
| low | PR body Harness section is stale ("Not a harnessed run (no `.llm/runs/` directory)") — the run dir now exists and is committed at `b05bf4c5a` | PR body vs HEAD tree | Update the Harness section on the next PR touch (no source change needed) |
| low | Issue #2074 carries no labels and no milestone, against the taxonomy rule | issue JSON | Separate triage; not a defect of this PR |
| info | `check:mcp-export-corpus` is environment-fragile: sandbox `NotCapable` on task form, and its verdict keys on gzip-compressed bytes, which are not byte-stable across deno builds | probe evidence above | Consider comparing gunzipped JSON (or a content sha) instead of compressed bytes; potential lesson below |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Freshness gates that hash compressed carriers misreport as stale on differently-built runtimes | compare decompressed content (or content sha), not compressed bytes | `.llm/tools/docs/generate-export-surface-corpus.ts`, any gzip-based carrier gate | medium |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | **FAIL_FIX** |
| Rationale | Truthful per the run brief: the change itself is complete against #2074 (contract, both `Deno.serve` branches, preset parity, real-listener tests incl. executed non-loopback dial steps, docs/JSDoc/README, carrier content fresh) and every locally-runnable gate re-run this session is green with wrapper-sourced evidence, including the authoritative identical-source runtime CI (workflow 37188990407 at `fa5aa5d71`). But the plan's audit gate remains blocked by the shared, still-unresolved main-lock critical dependency advisory (proxy-addr GHSA-jqcg-44mw-7w3h: lock `2.0.7` < `2.0.8`; 39 findings), and full current-head CI cannot be evidenced while the PR is draft (workflows skipped). The low-severity F-1 cap crossing and the stale PR-body Harness note are additional fix items. Readiness (`status:ready-merge`) must not be claimed until the owner's dependency-maintenance decision resolves the shared blocker, the PR leaves draft, and full current-head CI runs green. |
