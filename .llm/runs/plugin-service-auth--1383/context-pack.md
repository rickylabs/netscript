# Plugin service auth policy — independent plan repair

Existing issue #1383; follow-up to merged PR #2002 at baseline 6d6b3057f28e5edf1b55ff911c131c71c64dc919. Branch feat/plugin-service-auth-policy, draft PR2003. Cockpit child WIP remains #4/#9.

Revision2 plan.md received independent FAIL_FIX at570f88894; preserve plan-eval.md. The coordinator amendment plan-amendment-1.md addresses procedure-aware REST/RPC authorization, ambiguous-policy rejection, runtime-helper placement and the risk register. The composite plan has two author families. Round2 completed in the same independent evaluator session, using matrix-plan-evaluator-2.json, with PASS in plan-eval-2.md at b3576e116. Process36944 exited0. Coordinator admitted implementation. S0 baseline39 auth tests and S1 shared policy code are complete:78 auth tests,51-file check/lint/fmt,doc-lint and quality gate passed. S2 factory adoption is next; see s1-verification.json and s1-* receipts. Full generated consumer, runtime, and independent implementation gates remain outstanding.

No NetScript release, canary, tag or publication is authorized. Owner approval requires a concrete meaningful milestone bundle and evidence; prerequisite merges are not publication permission. No Cockpit installed-artifact, authorized attention or downstream native completion is inferred from this plan.
