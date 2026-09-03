use harness

Continue the SAME independent evaluator session 7ffea6b7-4401-4fec-b826-7d5e7657d88f.
Preserve the original c487e9273 verdict verbatim in evaluate-cycle-1.md. Evaluate the bounded
delta to exact 0475c32134166b9ba60ce1ea1a53c6abcc5af695 (PR #1982), in the same isolated
007-eval-1982 worktree after the coordinator advances it. Do not alter source or waive findings.

Changes since your initial head:
1. consumer-tools.json declares the shared scope helper as a support module; canonical
   agent-tools.generated.ts now embeds both helper and changed host-port checker. Quality CI
   exposed the missing carrier; the real bundle closure and asset-freshness checks now pass.
2. Existing scaffold E2E deliberately checks a generated application under scratch. The checker
   now has explicit --generated-project mode (exactly one CLI root), with scope relative to that
   selected project. Thus incidental .llm/tmp is ignored by repository scans, but a functional
   gate still detects a bad host port in the deliberately generated app. Internal .llm/runs and
   other transient state remain ignored. The existing E2E caller now passes the explicit mode.
3. Tests and AGENTS.md/plan/worklog explain this boundary. No package runtime/output change,
   lock movement, workflow edits, harness deletion, or other author changes.

Only assess these deltas plus any concrete finding from your first verdict. No need to re-review
unmodified historical runs or re-run broad package suites. Use structured wrappers (test wrapper
uses -- --allow-all FILE; check/lint/fmt use --file FILE, not positionals). For lint, --config
is the supported wrapper option. Keep root lint rules without .llm exclusions.

Author evidence: 64 focused tests PASS including generator bundle closure, scope/parity/ports/
polling/compat fixtures and scaffold-e2e-test_test.ts; both parity phases PASS (867 checked,
0 missing/fail, fresh manifest); source check/lint/fmt all12 selected files, zero errors;
check:assets-barrel PASS after commit. Independently verify the narrow regressions and freshness.
No host runtime lease, Docker/Aspire startup, full E2E, model switch, GitHub edits, commit or push.

Write evaluate.md with exact final source head, original session/model identity, narrow findings,
actual commands/results and PASS_IMPL or FAIL_FIX. Source CI is a separate coordinator-owned gate,
not grounds to fabricate PASS. If first cycle has concrete missing-carrier/scratch false-green
findings, keep them preserved and explicitly say whether this new delta closes them.
