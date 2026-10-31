# Generated docs CI follow-up

The initial docs-only source correction updates the rendered docs but necessarily stales the shipped CLI prose carrier. On an owner follow-up to fix CI, regenerate with build-agent-docs-bundle.ts --site-dir docs/site/_site (or canonical gen:agent-docs-prose). Decoder comparison proves the complete change: exactly the two corrected page entries; llms-full is derived. No other generated barrels or publish metadata changed.

check:assets-barrel ends in git diff --exit-code; before committing an intentional generated carrier refresh it reports that expected difference. The meaningful final check is after commit, when regeneration must leave tracked bytes unchanged.

Never put “all required CI green” in a PR Definition-of-Done checkbox: close-gate checks that checkbox and is itself required CI, creating circular evidence. Check the actual independently provable deliverable (here carrier freshness), and report CI status separately without bypassing required branch checks.
