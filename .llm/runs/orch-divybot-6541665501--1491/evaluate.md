# IMPL-EVAL — implementation and carrier head

Requested/observed model: claude-opus-5-5, high effort. Same separate Anthropic evaluator session across substantive slice reviews and this evaluation. Source read-only; evaluator independently ran the extracted public-consumer test (2/2 passed) without changing the tree.

This committed receipt records the implementation/carrier head below. Committing its evidence advances the branch; the final exact-head attestation is therefore posted to PR #2514's timeline after readiness and copied to the excluded final report, not committed recursively into a different head.

I found no blockers at pushed head `5f54380`.

**Head and scope**
- Local HEAD, the remote branch and the PR head all point at `5f54380147cfdb634c1926b08e0547999c8cd202`.
- The S1 commit holds the five guides, the service reference, navigation, the webhook links and the three docs-tooling files.
- The S2 commit holds only the two allowed prose carriers plus run files.
- No other `packages/` files changed, and there are no runtime, lock, barrel or scaffold changes.
- The uncommitted changes are run evidence only: the worklog, context-pack, `gate-evidence.json` and a lesson note.

**Acceptance boxes**
1. **Pages match the exports:** both slice reviews checked the five guides and the reference against source and the PostgreSQL, relay, retention and testing exports.
2. **All eight example concerns:** the proof levels are stated honestly.
   - Transaction, expected version, idempotency, audit, outbox and failure are executed as a public consumer.
   - Relay and reconciliation are compile-only, and the inspection port is labelled as owned by the application.
   - All ten command and webhook code examples are in the strictest compiled tier (Tier-1), with no exemptions.
3. **Outbox integration without mixing up directions:** links run both ways between the guides and the webhook recipe, and the relay, security and webhook pages keep inbound verification separate. I checked that the S2 carriers render this cross-reference correctly.
4. **Clean public-consumer snippets and docs gates:**
   - I ran `command-guide-example_test.ts` through the structured wrapper myself: exit 0, 2 passed, and the tree was unchanged afterwards.
   - The extracted gate records pass for accuracy, export drift, MCP corpus, publish, prose and the postcommit assets-barrel check at `5f54380`. The precommit assets-barrel failure is recorded as superseded, not hidden.
   - The worklog records the site verify, links and snippets results as passes.
   - The unrelated interruption-probe failure is reproduced on unchanged main and not suppressed.
5. **IMPL-EVAL:** the owner-specified Anthropic evaluator is a separate session from the Codex implementer. It reviewed S1 and S2 in substance, and this pass completes the evaluation.

**PR rules**
- The PR body carries `Refs` for #1491 and no closing keyword.
- Labels, milestone and issue checkboxes are left to the coordinator.
- No local scaffold.runtime was run or required.

**Privacy:** the run files, guides and test contain no private paths, hosts, endpoints or session identifiers. The public `rickylabs.github.io` docs URLs in the carriers are expected.

**Still to happen:** PR #2514 is still a draft, so CI is currently skipping. The live CI result, the review-thread check and the exact-head re-check after the evidence commit belong to the ready transition. They are not open defects at this head.

VERDICT: MERGE 5f54380147cfdb634c1926b08e0547999c8cd202
