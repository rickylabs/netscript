# Resume — Fresh UI export documentation

Issue #2531, tracker #2412. Branch fix/fresh-ui-export-docs-2531, baseline e7906c8.
Run .llm/runs/fix-fresh-ui-export-docs-2531--exports/. Read plan.md and research.md first.

Baseline structured doc-lint:124 combined findings, interactive123 and JSON1; token-config has an
additional independently visible private TokenPreset reference. Metadata already exempts JSON module
tags but does not validate syntax. Detailed raw baseline output stays in ignored .llm/tmp/2531/.

Next: open the early draft PR, implement documented type closure without runtime changes, add
truthful executable/data validation and negative controls, then canonical gates and separate
cross-family evaluation. Do not modify other workers' Desktop/style/showcase or builder PRs.
Old .divybot assignment/report files belong to completed #2591 and must stay excluded.
