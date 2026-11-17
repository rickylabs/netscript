# Evaluation: issue #2634 / PR #2642 — fix(auth): configure provider endpoint rate limits

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `fix-auth-sign-in-rate-limit--issue-2634` |
| Target         | branch `fix/auth-sign-in-rate-limit` head `86ffff9a61bf784840f3a744404c7cf960c14816`, base `origin/main` `b0eb079575968e843b781579673c9fe2ae250e07` |
| Archetype      | 2 — Integration (contract schema + plugin backend composition), service/docs overlays |
| Scope overlays | service, docs |
| Evaluator      | independent IMPL-EVAL session, 2026-11-16 |
| Verdict        | **PASS** |

## Route identity (protocol)

- Requested/pinned evaluator: `glm_5_3_flash/provider_default`, options `{}` (no variant override), mapped by `@harness/models` to `opencode-go/glm-5.3-flash` — observed identity matches; no silent substitution.
- Fallback `deepseek_v4_pro/provider_default` not needed; launch succeeded.
- Generator per run `supervisor.md`: Codex `gpt-6.1-sol`/xhigh (OpenAI vendor family). Evaluator vendor family differs (GLM); sessions independent (fresh evaluator session, no shared history). No lane self-certification.
- Read-only shared checkout verified: head equals `86ffff9a61bf784840f3a744404c7cf960c14816` exactly; no other worktree touched.

## Process Verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| PLAN-EVAL disposition recorded before implementation | PASS | `worklog.md` §Design records justified `PLAN-EVAL: N/A` (narrow native JSON passthrough, locked defaults); plan.md §Contract locks the decision set |
| Design checkpoint exists in worklog | PASS | `worklog.md` `## Design` (surface, validation, forwarding, oracle, docs) |
| Commit slices match plan | PASS | S1 red `c70f6e564` (tests committed before source), S2 contract+forwarding+docs `e1a608511`, S3 generated consumers `86ffff9a6` — matches plan S1–S3 |
| Each slice has named gate evidence | PASS | worklog red-baseline/contract sections + PR IMPL comments; gates re-run independently below |
| No speculative seams | PASS | No production factory/test hook added; only an observability wrapper inside the disposable test; diff is 18 files, all serving contract/test/docs/generated refresh |
| Issue read in full | PASS | `gh issue view 2634` (summary, evidence, expected behavior, 4 acceptance boxes, related #883/#882) |

## Change-scope verification (against plan and PR claims)

- Contract: optional `AuthConfig`/`AuthConfigInput.rateLimit` with `AuthRateLimitConfig`/`AuthRateLimitRule`; native `customRules` record; `window`/`max` positive integers; slash-prefixed keys; absent stays omitted (`...(raw.rateLimit === undefined ? {} : { rateLimit: raw.rateLimit })` and registry conditional spread). Confirmed in `packages/plugin-auth-core/src/config/mod.ts`.
- Registry: `plugins/auth/services/src/backend-registry.ts` reads lower `auth.rateLimit` with upper `Auth.RateLimit` fallback (`??` — lower wins), validates through shared `AuthConfigSchema`, forwards only `customRules` via the existing `betterAuthOptions` passthrough. No enabled/global/storage override added.
- Provider forwarding verified in source: `packages/auth-better-auth/src/better-auth.ts` spreads `...betterAuthOptions` into the composed options passed to `betterAuth(...)` (spread before explicit NetScript-owned keys, after model-name defaults). Installed provider resolves to `better-auth@1.7.14` per `deno.lock` — matches research claim.
- Exports: new types exported from `src/public/mod.ts` (root) and config module. Reference docs table updated.
- Docs: auth guide section, better-auth plugins page, core README, reference index — state default 3/10 production, seconds/requests units, first-match, slash-prefixed relative patterns, per-process memory storage, missing-IP shared bucket, provider-owned endpoint boundary, and the host-created `betterAuthOptions` path.
- No scaffold/Aspire/executable/lock changes in the diff — full `scaffold.runtime` non-applicability claim **verified**; the focused real-provider test is the correct boundary proof for this fix.

## Test-oracle validity (independently assessed, not taken on trust)

- The wrapper in `plugins/auth/tests/services/rate-limit-production_test.ts` maps `@netscript/auth-better-auth` **only within the scope of the real registry module** (`plugins/auth/services/src/backend-registry.ts`, which is confirmed as the import site), re-exports the real provider module, and its intercepted `createNetscriptBetterAuth` always calls the original factory. The captured options and the real constructed provider instance exist only inside the disposable child process.
- Requests are real Fetch POSTs to the real provider handler (`/api/auth/sign-in/email`). No fake limiter, no product injection hook, no external resources. The initial unscoped loader mapping is excluded from the committed test (only the scoped map ships).
- Status semantics verified: configured `max:1` → `[400, 429]` (429 counted before the endpoint's 400 email/password-disabled response — no database/account state needed); absent → `[400, 400, 400, 429]` (built-in production 3/10); development → unthrottled; `both` styles → lower-case section wins (upper `max:5` ignored). The invalid-config case rejects before provider construction.

## Independent test runs (evaluator's own, pinned Deno 2.9.7 via mise)

| Suite | Command (repo-relative) | Result |
| ----- | ----------------------- | ------ |
| Schema tests | `.llm/tools/run-deno-test.ts --cwd packages/plugin-auth-core -- --allow-all src/config/config_test.ts` | 10/10 PASS |
| Real-provider rate-limit test | `.llm/tools/run-deno-test.ts --cwd plugins/auth -- --allow-all tests/services/rate-limit-production_test.ts` | 6/6 PASS |
| plugin-auth-core full | same wrapper, package root | 54/54 PASS |
| Adjacent plugin tests (control) | `deno test --allow-all --unstable-kv plugins/auth/tests/services/{documented-cookie-jar,workos-observer,workos-composition}_test.ts` from repo root | 8/8 PASS (a `--cwd plugins/auth` invocation of the full plugin suite produced 5 cwd-relative path failures; all pass from repo root — environmental, not product) |

## Static/fitness/docs gates (evaluator's own runs)

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Targeted typecheck | PASS | `deno check --unstable-kv` over the five changed source/test files |
| Lint wrapper | PASS | `run-deno-lint.ts --root packages/plugin-auth-core --root plugins/auth` → 0 occurrences (110 files) |
| Fmt check wrapper | PASS | `run-deno-fmt.ts` same roots → 0 findings |
| quality:scan | PASS | 0 findings; 7 pre-existing allowances (all issue #1276, unrelated files) |
| Doctrine fitness (arch:check body) | PASS | `check-doctrine.ts --all-roots` exit 0, FAIL=0, pre-existing WARNs only |
| release:preflight | PASS | import-attributes / file-url-import-meta / self-imports all PASS (0 findings) |
| docs:accuracy | PASS | 216 published pages, 287 shipped corpus files, 111/111 commands |
| JSR publish dry-run | PASS | `deno publish --dry-run --allow-dirty --no-check` in `packages/plugin-auth-core` → "Dry run complete" |
| Doc lint (changed entrypoint) | PASS | `run-deno-doc-lint.ts --root packages/plugin-auth-core`: `./src/config/mod.ts` entrypoint 0 findings; package totals 3 private-type refs — consistent with claimed measured base core=3 |
| MCP export corpus freshness | PASS | `deno task check:mcp-export-corpus` exit 0 |
| CLI assets barrel freshness | PASS | `deno task check:assets-barrel` exit 0 (no CLI asset diff) |
| Review-thread gate | PASS | `deno task check:review-threads -- --repo rickylabs/netscript --pr 2642 --pretty` → threads=0 unanswered=0 |

## Issue acceptance / close-gate pre-check

- All four #2634 acceptance boxes are checked with a linked evidence comment on the PR.
- PR body carries `Closes #2634` and exactly one `acceptance-evidence` fenced YAML block (4 entries, one per box).
- Milestone `0.0.10`; labels `type:fix`, `area:auth`, `priority:p2`, `status:impl-eval` (exactly one `status:`); no forbidden `status:ready-merge` label present.
- Remaining unchecked PR DoD row is this independent evaluation plus required head checks — expected pre-merge state for `status:impl-eval`; the generator transitions the PR after review and verifies required checks at the current head. Merge/release actions intentionally not performed by the evaluator.

## Checks / reviews state at evaluated head

- Draft PR #2642, head `86ffff9a6`. Required draft checks currently policy-skipped; `build` and `classify docs-site changes` SUCCESS; "Utility docs browser and style policy" was in progress at evaluation time. Review threads: 0 open / 0 unanswered.

## Findings

- No blocking findings. No unrecorded doctrine violation introduced (AP-25 not triggered: side effects are confined to adapter/composition and disposable test files; defaults remain provider-owned, consistent with composition-root doctrine).
- Non-blocking observation: issue acceptance evidence links to the S2 IMPL phase comment rather than a dedicated evidence comment; the linked comment contains the test summaries and the PR body carries the structured acceptance-evidence block, so the evidence requirement is satisfied.

## Verdict

**PASS** — approved scope complete, required static/fitness/docs gates independently green, genuine-oracle runtime evidence independently reproduced, docs and run artifacts sufficient for resume. Straightforward tier IMPL-EVAL loop maximum five (owner-notification after three) applies to any re-steer; none needed.
