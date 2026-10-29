# Comparison refresh supervisor

Implementation: Codex, OpenAI family. Baseline: 4219e033b3050ef1559d21d7cc12fcf391db09c4; integrate main only after content PR #2471 merges. Branch docs/comparisons-refresh.

Writable surface: docs/site/comparisons/**, docs/site/_components/scenarioPicker.vto, docs/site/_plugins/scenario-picker_test.ts, docs/site/styles/components.css, docs/site/why.vto (table removal only), tools/fresh-ui-browser/docs-tests/**, comparison API snippet verification under tools/docs-site/**, generated docs carriers and manifest, this run directory, and final outcome reconciliation in the preceding docs-finish run records. No framework runtime changes.

Owner override (verbatim): "Claude is at its weekly limit." "Evaluate with Gemini 4 Argon, read-only: agy -p --mode plan --model gemini-4-argon-high, given the PR diff and these acceptance points, blockers only. Fix once and re-evaluate."

Evaluation: separate Google session, same conversation across repairs. Owner permits ordinary squash merge only after MERGE and fully green CI. No admin or bypass.
