# Follow-up gate recipes

Structured wrappers used: package `deno task --cwd packages/fresh-ui check` (265 files), lint/fmt roots src/tokens/domain,src/tokens/adapters,scripts,tests/tokens (38 files), full token tests plus native publish-size test via run-deno-test.ts --cwd packages/fresh-ui -- --allow-all --lock=deno.lock --frozen --unstable-kv tests/tokens tests/publish-size.test.ts. Source token embedding alone changes quality.generated.ts; registry/theme outputs and the four carrier task outputs remain byte-identical for this policy-only change.

Run-gate receipt ids available: quality-gate,assets-barrel,agent-docs-prose,publish-assets,docs-accuracy. Corpus requires committed source; final corpus gate follows independent implementation review and source checkpoint. Root `check` includes7static dependencies and3996selected files. Other static rootchecks are inexpensive; review-thread checker requires --repo rickylabs/netscript --pr2500 --pretty. Root/prose generators must be sequenced when mutating outputs; readonly validation can run in parallel.

Native JSR audit still flags contracts.json missing @module and baseline folder/slow-types banner warnings. Canonical doclint still124diagnostics (96private-type-ref,28missing-jsdoc,0other); never call wholepackage publish auditgreen. Runtime attempted canonical one-pass exits1 because Dockerdaemon and Aspire doctor unavailable; report UNPROVEN.

CI does not execute required jobs on drafts. A local/evaluation-complete PR must leave draft to trigger them; this is distinct from publishing the owner's final READY report, which requires actual exact-head green contexts. Do not mistake all-skipped draft runs for a successful required gate set.

A push immediately before leaving draft can still create all-SKIPPED draft-snapshot workflow runs even after ghready succeeds. Verify real classify/quality/shard jobs materialize. A subsequent authorized run-note commit pushed while non-draft activates synchronize; it changes only run evidence, not reviewed product sources. Never equate skipped required contexts to executed greenCI.
