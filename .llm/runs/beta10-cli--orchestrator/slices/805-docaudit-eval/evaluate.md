# Evaluation: PR #805 — doc-audit profile as routing data

## Metadata

| Field | Value |
| --- | --- |
| Target | `/home/codex/repos/b10-docaudit`, `harness/doc-audit-profile` |
| Evaluated commit | `a7caf172c0fa7852c79b6400c32bf8da39064962` |
| Base | `origin/main` at `4d438ce1a0a29f9e8bc666f7e2c35d78a5458093` |
| Diff | `git diff origin/main...HEAD` (6 files, 283 insertions, 1 deletion) |
| Scope overlay | docs |
| Evaluator route | `review_claude`: Codex · GPT-5.6 Sol · xhigh; separate from the Claude generator |
| Date | 2026-07-17 |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | `FAIL_FIX` |
| Rationale | The owner-ratified scope remains valid, and every requested automated gate passes, but the machine policy does not enforce the audit lane's no-cross-family-fallback invariant, the large-changeset `high` audit effort is present only in prose/comments rather than routing data, and `lane-policy.md` retains global GLM scope claims that contradict the new last-resort docs-polish route. These are implementation/documentation defects within the approved scope, so `FAIL_FIX` is the applicable verdict. |

## Spec and probe results

| Probe | Result | Evidence |
| --- | --- | --- |
| `docs_audit` primary | PASS | `routing-policy.ts:211-219` binds Codex/OpenAI, `MODEL_IDS.codexSol`, effort `medium`, and a changeset-wide audit condition. |
| `docs_audit` opposite-family/no configured fallback | PASS (static table only) | `routing-policy_test.ts:459-473` requires exactly one `docs_audit` entry and requires that entry to be Codex/OpenAI. Operational fallback enforcement fails; see Finding 1. |
| Large-changeset `high` audit effort | FAIL | `doc-audit.md:42-45` and `lane-policy.md:37,124-130` permit `high`, but the only machine entry is the `medium` route at `routing-policy.ts:211-219`; see Finding 2. |
| `docs_polish` primary | PASS | `routing-policy.ts:229-238` binds Claude/Anthropic, `MODEL_IDS.fable`, effort `medium`, edit-only condition. |
| `docs_polish` fallback identity and order | PASS | Policy order is Opus/xhigh/token-limit (`routing-policy.ts:239-247`) then GLM/xhigh/`claude-openrouter`/no-Claude-surface (`routing-policy.ts:248-258`). |
| Fallback-order test sensitivity | PASS | `routing-policy_test.ts:493-513` filters in policy-array order, destructures `[tokenLimit, noClaude]`, and asserts each slot's condition and identity. Flipping the two policy entries would make the first condition assertion fail. |
| Fix-session rule | PASS | `doc-audit.md:18-22` requires the same resumed generator/model and makes a fresh fixer a justified exception. |
| Gate log and mining lifecycle | PASS | `doc-audit.md:103-122` requires the structured `## Gate log` and promotion of repeated procedures into `.llm/tools/docs/`. |
| Two-failure escalation | PASS | `doc-audit.md:124-128`. |
| Skill source/mirror drift | PASS | `diff -u` is empty; both files have SHA-256 `494c7bf20cf3d467ec02c13b73e9cdc3e7d2a73657f92a20af221dd291445683`. |
| Existing `review_codex*` / `review_claude` lanes | PASS | The full runtime suite's review-ladder and opposite-family tests pass; the new routes do not change those bindings. |
| Existing GLM scope prose | FAIL | `lane-policy.md:49-50,185-195` says GLM is pure-design/UI-UX only, contradicting `docs_polish`; see Finding 3. |

## Independent gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Runtime suite | PASS | `deno test --no-lock -A .llm/tools/agentic/runtime/` — 151 passed, 0 failed; raw exit 0. |
| Config suite / no-hardcoded-volatile guard | PASS | `deno test --no-lock -A .llm/tools/agentic/config/` — 4 passed, 0 failed; raw exit 0. This includes both exact-value and structural volatile-literal guards. |
| Claude mirror sync | PASS | `deno task agentic:sync-claude:check` — 17 skills and 21 mirrored files in sync; raw exit 0. |
| Internal docs links | PASS | `deno task docs:links` — 97 docs, 0 broken links, 0 broken anchors, 0 orphans; raw exit 0. |
| Scoped agentic typecheck | PASS | `.llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx` — 110 files, 0 failed batches/findings; raw exit 0. |
| Scoped agentic lint | PASS | `.llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts,tsx` — 110 files, 0 findings; raw exit 0. |
| Scoped agentic TypeScript format | PASS | `.llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx` — 110 files, 0 findings; raw exit 0. |
| Subject worktree integrity | PASS | Raw `git status --short` was empty before and after evaluation; HEAD remained `a7caf172c0fa7852c79b6400c32bf8da39064962`. |

Supplemental diagnostic: targeted `deno fmt --check` over the four changed Markdown files exited 1. This is not used as a verdict gate because the repository instructions explicitly reject raw Markdown/root formatting as a package-quality verdict source; the scoped TypeScript formatter is green.

## Numbered findings

1. **High — `docs_audit` can still cross model families through the generic fallback selector, and the new test does not catch it.**

   `docs_audit` was added as its own `RoutingLanePurpose`, but `candidateAllowed()` applies the author-family exclusion only when `context.purpose === 'evaluation'` (`routing-policy.ts:537-545`). A read-only probe passed a Claude/Anthropic candidate with purpose `docs_audit` and author family `anthropic` to `selectFallbackCandidate()`; it returned `{"status":"selected", ...}` with raw exit 0. That violates the ratified requirement that the Codex audit has no cross-family fallback. The added test at `routing-policy_test.ts:459-473` checks only that the canonical array currently contains one Codex route; it does not exercise fallback selection, so it stays green while the operational invariant fails.

   **Required action:** fail closed for fallback selection on `docs_audit` (or otherwise encode an equivalent guard in the canonical resolution path), and add a regression test that supplies a Claude-family `docs_audit` fallback candidate and requires a blocked result. Preserve the exactly-one canonical Codex route assertion.

2. **Medium — the large-changeset `high` audit effort is prose, not routing data.**

   The ratified profile allows `docs_audit` to use `high` for a large changeset (`doc-audit.md:42-45`; `lane-policy.md:37,124-130`), but `CANONICAL_ROUTE_POLICY` contains exactly one audit entry and it is always `medium` (`routing-policy.ts:211-219`). A direct policy dump returns only that entry, and the new test asserts exactly one entry at medium. Consequently, neither a resolver nor a regression test can validate the large-changeset effort choice; the route's `high` behavior survives only in comments, contrary to this PR's routing-as-data objective.

   **Required action:** encode and validate the large-changeset `high` selection as machine-readable policy without turning it into a cross-family fallback, then test both the default-medium and large-high cases. If the intended implementation is an explicit effort override rather than a second route, represent that override in the policy contract and validate it at resolution/launch time.

3. **Medium — `lane-policy.md` still says GLM is design/UI-UX-only after adding it as the docs-polish last resort.**

   The new route and doc-audit section correctly scope GLM as the final `docs_polish` fallback only (`lane-policy.md:38,131-138`; `routing-policy.ts:248-258`). However, the older global statements still say GLM "stays scoped to pure design work" (`lane-policy.md:49-50` and `185-186`), the capability table labels it "design/UI-UX only" (`lane-policy.md:191-195`), and the caveat remains described solely as a design-verification-lane concern (`lane-policy.md:200-203`). That is direct prose-to-policy drift of the class this change is meant to prevent.

   **Required action:** amend each global GLM scope statement/table row to name the single docs-polish last-resort exception while keeping GLM prohibited for implementation and general/formal evaluation. Do not broaden the exception beyond `docs_polish`.

4. **Low — the profile's compact pipeline summary omits the Fable authoring path that the same document and lane policy explicitly include.**

   `doc-audit.md:14-15,36-38` and `lane-policy.md:120-122` include single/few Fable 5 · high authoring sub-agents, but `doc-audit.md:27-29` abbreviates the generation stage as `generate (Opus/Sonnet)`. A reader following the bold canonical sequence can incorrectly infer that Fable-authored changesets are outside the trigger.

   **Required action:** make the compact sequence include Fable (or use a family-level label such as "Claude authoring lanes") so the trigger and pipeline summary cannot diverge.

## Debt and release classification

- Architecture debt delta: no relevant `doc-audit`, `docs_audit`, `docs_polish`, routing-policy, or GLM entry exists or changed in `.llm/harness/debt/arch-debt.md`; these findings require in-scope fixes rather than debt bookkeeping.
- Release-gate class: N/A. The diff does not cut a release or change scaffold/plugin/DB/Aspire/published CLI shape.

## Cycle 2

### Verdict

`PASS`

Commit `5c4aec4a4bfa5f23086a1603d8ca2de12d9f3b4b` genuinely resolves all four cycle-1 findings. The subject worktree was fetched from the explicit remote branch and hard-reset to `origin/harness/doc-audit-profile`; the fetched origin tip and evaluated HEAD both resolved to that commit.

### Finding closure

1. **Resolved — `docs_audit` fallback selection now fails closed across model families.** `candidateAllowed()` rejects every non-OpenAI-family candidate when `purpose === 'docs_audit'` (`routing-policy.ts:573-585`). An independent probe supplied a Claude/Anthropic audit candidate and received `{ status: "blocked", reason: "route_unavailable" }`; adding an OpenAI/Codex candidate selected the Codex candidate. The regression at `routing-policy_test.ts:488-512` is enforcement-sensitive: removing the new family guard restores the cycle-1 `selected` result and fails its exact blocked-result assertion.

2. **Resolved — large-changeset audit effort is machine-readable and fail-closed.** `CanonicalRoutePolicy` now owns typed `effortEscalations` data (`routing-policy.ts:57-86`), `docs_audit` declares `large_changeset → high` (`routing-policy.ts:224-233`), and `resolveCanonicalRouteEffort()` returns the default effort, resolves declared escalations, and throws for undeclared conditions (`routing-policy.ts:512-532`). Independent results were `medium`, `high`, and throw, respectively. The regression at `routing-policy_test.ts:477-486` would fail if the declaration, resolver, or undeclared-condition rejection were removed.

3. **Resolved — GLM scope prose consistently names the sole docs-polish exception.** The global scope rule (`lane-policy.md:47-51`), Claude Code transport note (`lane-policy.md:181-189`), capability table (`lane-policy.md:194-198`), and reasoning caveat (`lane-policy.md:203-207`) all preserve design/UI-UX as GLM's normal scope while naming only the `docs_polish` no-Claude-surface last-resort exception. No implementation or general/formal-evaluation broadening was introduced.

4. **Resolved — compact pipeline summary covers every Claude authoring lane.** `doc-audit.md:27-29` now says `generate (Claude authoring lanes)`, consistent with the Fable and Opus/Sonnet generator paths at `doc-audit.md:14-15,36-39` and `lane-policy.md:121-123`.

### Independent cycle-2 gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Runtime suite | PASS | `deno test --no-lock -A .llm/tools/agentic/runtime/` — 153 passed, 0 failed; raw exit 0. |
| Config / volatile-value suite | PASS | `deno test --no-lock -A .llm/tools/agentic/config/` — 4 passed, 0 failed; raw exit 0. Runtime + config aggregate: **157 passed, 0 failed**. |
| Claude mirror sync | PASS | `deno task agentic:sync-claude:check` — 17 skills and 21 mirrored files synchronized; raw exit 0. Source and mirror retain identical SHA-256 `494c7bf20cf3d467ec02c13b73e9cdc3e7d2a73657f92a20af221dd291445683`. |
| Docs links | PASS | `deno task docs:links` — 97 docs, 0 broken links, 0 broken anchors, 0 orphans; raw exit 0. |
| Scoped agentic typecheck | PASS | `.llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx` — 110 files, 0 failed batches/findings; raw exit 0. |
| Scoped agentic lint | PASS | `.llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts,tsx` — 110 files, 0 findings; raw exit 0. |
| Scoped agentic TypeScript format | PASS | `.llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx` — 110 files, 0 findings; raw exit 0. |

### Drift and final rationale

The cycle-2 diff is limited to the four files needed to close the findings: `doc-audit.md`, `lane-policy.md`, `routing-policy.ts`, and `routing-policy_test.ts`. Route identities, effort, conditions, fallback order, GLM exception scope, and pipeline terminology agree across prose and TypeScript. The existing `review_claude`, `review_codex*`, major-UI/UX, formal-evaluator, and volatile-value guards remain green. No blocking finding remains; under `verdict-definitions.md`, the final cycle-2 verdict is `PASS`.
