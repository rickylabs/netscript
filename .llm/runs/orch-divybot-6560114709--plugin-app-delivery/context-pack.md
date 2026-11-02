# Resume

Issue #2578; baseline 4cb0298; feature tier; supplied leaf profile. Draft PR #2582.
Implementation restores app consumer metadata, reads live AppHost reference settings, compiles
manifest-declared runtime registries during install, uses a project CLI for workers remediation,
and makes unsupported remote Docker a doctor error. The actual runtime home-page probe requires
workers and streams ready. Service-less AI retains consumer metadata without a discovery edge.

809 focused tests and six follow-up consumer regressions passed. All 15 root check:* tasks,
quality:gate, release:preflight, docs:accuracy and JSR audits passed under Deno 2.9.7. The first
root type-check found a missing composition dependency type field; it is fixed and the full 4,142-file, 35-batch type-check passed. Generated carriers are refreshed. No dependency or lockfile changes.

Next: separate read-only Claude IMPL-EVAL, address blockers in the same evaluator session,
commit/push implementation and evidence, dispatch the full scaffold.runtime CI, verify all required
checks green or skipped by workflow policy, then hand off READY through .divybot-final-report.md.
No labels, private identifiers, rebase, force push or merge. Public paths stay repository-relative.

Bounded existing install size/cardinality advisory increase is tracked as CLI-PLUGIN-INSTALL-DELIVERY-SIZE.

Independent review round 1 was FAIL_FIX. Its two blockers are repaired: installed app consumer
scope survives staged update, and worker doctor uses and proves the real local CLI with explicit
project root. 26 repair regressions and all 18 static scaffold gates passed. Same-session review
round 2 is next; Docker runtime CI remains pending.

Round 2 independent IMPL-EVAL: PASS (evaluate.md). Final focused suite: 825 passed. Final full
structured check and quality:gate: PASS. All 18 static scaffold gates passed. Commit and push this
reviewed slice, dispatch full Docker CI, then reconcile actual check results before READY.

CI repair slice: uploaded reports from the first full CI exposed stale tests in shards 3–6 and
baseline literal boolean ternaries in example-route templates. The fixtures and generation are
fixed. The same evaluator passed this repair (evaluate-ci-repair.md); 109 combined regressions,
full check, quality:gate, all 15 check:* tasks and service/no-service generated lint pass. The next
push must re-run full Docker CI. Close-gate remains pending its explicit proof checkbox.


Runtime auth repair: core required CI is green except close-gate's deliberately unchecked runtime
proof. Both manual runtime tiers reached and failed the workers overview assertion. The auth BFF's
required unmarked fallback rejects anonymous public workers reads before transport. A per-client
optional fallback now fixes workers only; guarded defaults and explicit required metadata are
preserved. 36 regressions, full check and quality pass. Same-session round 4 review, browser
conformance, all check tasks and static scaffold gates are next. No READY until full Docker runtime
and required checks pass on the reviewed head.


Round 4 review PASS; all 15 check tasks and real browser conformance (3/3) pass. Commit and push
the auth repair, dispatch full Docker runtime at that head, and reconcile close-gate only after
actual worker/stream readiness proof. Review-thread gate has no unanswered current threads.
