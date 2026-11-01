## SKILL

Use netscript-harness, netscript-doctrine, netscript-tools, netscript-pr. Do not read profiles/.

S1 supervisor slice review, same separate Anthropic session, read-only, blockers only. Do not edit, commit, start resources, or run local scaffold.runtime. Implementation is Codex/OpenAI. Review current uncommitted delta against HEAD (main merged at c5c3ef3; source main da81516). Review the approved plan and round2 PASS, then focused changed source/tests/fixture. A live opt-in consumer proof is running; its final result/docs handoff are S2, so do not certify runtime acceptance here. S1 is implementation/consumer regression review before sign-off commit.

Evidence: the run gate-results.json records the 65, 35 and 98 passing test groups, clean structured source check/lint/fmt over 17 files, and quality:gate. The run negative-controls.json records pristine pass / mutation semantic failures. Raw local logs were available to the evaluator but remain outside Git.

Review actual correctness/scope/contracts, especially generic local service export selection + runtime package discovery, preserving public JSR pins, generated helper contracts, local consumer assertions and strict DB-free workflow proof. Ignore cosmetic preferences. The current main browser-auth reconciler reporting changes were preserved by merge. No new CI tier, label/milestone or lock changes. No source self-certification. Give a concise independent S1 sign-off or concrete blockers; end VERDICT: PASS or VERDICT: CHANGES. Do not include private host paths, endpoints or session identifiers in the review text.
