# PLAN-EVAL — test-openapi-mcp-wave0-proofs--wave0

- Plan evaluator session: Qwen 3.7 Max / high · OpenRouter via `claude-openrouter` / `claude-print`
  · 2026-08-03 (third attempt; no subagent delegation)
- Run: `test-openapi-mcp-wave0-proofs--wave0`
- Surface / archetype: N/A — proof/measurement slice; no published-surface change
- Scope overlays: service

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` re-baselines against `origin/main` @ `fb75cf6fc`; finding 7 (MCP `maxItems=50`, `maxStringLength=2000`) re-verified at `packages/mcp/src/application/runner/truncation.ts:10`; finding 6 (auth fixture with 401/403/200) re-verified at `packages/service/tests/auth/define-service-auth_test.ts`; finding 4 (AppHost template pre-allocation helper body) re-verified at `packages/cli/src/kernel/assets/aspire/helpers/apphost.ts.template`; finding 1 (branch parity `0 0`) re-verified with `git rev-list --left-right --count HEAD...origin/main` |
| Decisions locked                        | PASS   | D1–D12 each state rationale; cover verdict paths (D1), experiment/evidence location (D2), serialized scaffolds (D3), P1 method and PASS bar (D4–D5), F1 arbitration rule (D6), P2 measurement schema (D7), P2 truncation comparison (D8), P3 re-run and ratified wording (D9), normalization (D10), separation of concerns (D11), and rescope rule (D12)                                                                                                                                                                                                             |
| Open-decision sweep                     | PASS   | Three "must resolve now" items (P1/P2/P3 empirical values) are proof outputs, not design decisions; three "safe to defer" items (production manifest S7/#1133, MCP redesign Wave 1+, authenticated-spec Wave 4) cannot force proof-artifact rework; evaluator independently found no additional deferred decision that would require rework                                                                                                                                                                                                                          |
| Commit slices (< 30, gate + files each) | PASS   | 5 slices (S0–S4); each names proving gate and files in the worklog commit-slices table; well under the 30-slice cap                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Risk register                           | PASS   | 11 risks with mitigations covering shared-host foreign resources, descendant-process survival, callback-race partial manifests, host normalization (localhost/IPv4/IPv6/wildcard), lock/source churn, P2 measurement unit accuracy, local-deref loops, error-envelope inference from one template, skipped-command false green, P3 wording overpromising, and evaluator credential route                                                                                                                                                                             |
| Gate set selected                       | PASS   | N/A archetype correctly selected; service overlay's 5 additional gates (contract check, service check, runtime health, trace/log review, consumer check) mapped in the fitness-gates table with correct NOT_RUN status; release gate correctly marked N/A (no scaffold/template product change; user explicitly prohibits `deno task e2e:cli`); static-gate validation plan lists 12 ordered verification steps                                                                                                                                                      |
| Deferred scope explicit                 | PASS   | Plan "Non-Scope" enumerates production endpoint discovery, MCP server, auth policy change, truncation redesign, `e2e:cli`, and foreign-resource mutation; worklog "Deferred Scope" maps each to S7/#1133, Wave 1+, Wave 4, or separate product work                                                                                                                                                                                                                                                                                                                  |
| jsr-audit surface scan (pkg/plugin)     | N/A    | `research.md` §jsr-audit: "This run does not change a package/plugin export, dependency, README, or publish surface." Correct for a proof-only slice; plan archetype and non-scope confirm                                                                                                                                                                                                                                                                                                                                                                           |

## Open-decision sweep (evaluator-run)

None. The plan's locked decisions D4–D9 fix every measurement method, pass/fail bar, and verdict
rule for all three proofs. The three empirical values (post-allocation callback behavior, spec sizes
and keyword subsets, auth-guarded response envelopes) are proof _outputs_ that the proofs themselves
resolve — they are not deferred design choices. The three deferred items (production
manifest/template at S7/#1133, MCP projection/truncation redesign at Wave 1+, authenticated-spec
support at Wave 4) are downstream of the proof verdicts and cannot force proof-artifact rework. I
found no additional open decision that would require rework if deferred.

## Verdict

`PASS`

## Notes

### Load-bearing research re-verification

1. **Finding 7 (MCP truncation constants):** `truncation.ts:10` reads
   `DEFAULT_TRUNCATION_POLICY: TruncationPolicy = { maxItems: 50, maxStringLength: 2000 }`. Plan D8
   correctly compares P2 measurements against these exact current bounds and explicitly reports that
   there is no whole-result byte ceiling.

2. **Finding 4 (AppHost template pre-allocation):** The `apphost.ts.template` shows
   `await createNetScriptAppHost(builder, '{{configPath}}'); await builder.build().run();` —
   resource registration happens inside the helper call, before `run()`. Helper-body endpoint reads
   are indeed pre-allocation. P1's test of `onResourceEndpointsAllocated` +
   `EndpointReference.getValueAsync()` is the correct post-allocation seam to evaluate.

3. **RFC §4 (skip-as-fail rule):** Line 260: "a skipped proof must be indistinguishable from a
   failed one, not from a passed one." Plan hidden scope and D6 both implement this correctly:
   `NOT_RUN`, missing evidence, or skipped execution maps to FAIL; P1 FAIL selects F1(b).

4. **RFC §9 (F1 proof-arbitrated fork):** Lines 367–379: option (a) stands only if P1's committed
   verdict demonstrates the post-allocation seam; a FAIL verdict legitimately selects (b). Plan D6
   correctly encodes: "P1 PASS selects F1(a); P1 FAIL, including skipped or incomplete execution,
   selects F1(b)."

### Evaluator preflight history

- First canary: `auth_required` (credential not inherited to shell). Resolved via parser-backed
  retry using `parseOpenRouterApiKey()` with isolated child environment.
- Second attempt (Qwen PLAN-EVAL): model guard denied default child `claude-opus-5` (exit 78); no
  closed request reached OpenRouter. Brief tightened to require single-session evaluation without
  subagent delegation.
- This session: no Agent/Task tool invocation; all reads and checklist steps performed inline.

### Service overlay additional-read gap

`SCOPE-service.md` references `.claude/04-services.md` and `.claude/06-infrastructure.md`, which do
not exist on this branch. This is correctly recorded as drift in `drift.md` (2026-08-03 — Service
overlay read paths absent) with accepted severity and the corrective action of using focused
package/service/Aspire source and official Aspire docs instead. Not a plan defect.

### Shared-host constraint

The plan's risk register and mitigations correctly account for two foreign AppHosts and six foreign
containers inventoried at bootstrap. D3 serializes owned scaffolds (SQLite first, no-DB second,
never concurrent). The leak reporter is invoked with the exact run/worktree and owned scratch root.
No plan step mutates a foreign resource.

### Doctrine debt delta

No new architecture debt is expected from a proof-only slice. The plan correctly states that any
required product change discovered during proofs is a `FAIL_RESCOPE` to S7/#1133, not a debt entry
in this run. Consistent with the debt registry's current open entries (none of which this run
touches or deepens).
