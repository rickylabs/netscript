# Migration repair verification recipes

Use the structured test wrapper with `--allow-all --frozen` for the full Fresh UI tree: token-build tests now access environment through Chalk. The narrower copied-Markdown tests still use read/write/run. An initial narrower whole-tree attempt failed on TF_BUILD permission; it is not a product failure or a green verdict.

The registry guard materializes every `*.tsx.template` to a temporary `.tsx` and runs the actual Deno jsx-curly-braces rule with an explicit rules-only config. The copied-Markdown test also lints installed output under the consumer defaults. Both include a string-in-braces mutant that must fail. To reproduce the reported failure, restore the pre-repair template and run the registry-guard test; the retained negative-template report is red.

CSS matching first gathers class tokens by compound and restores outer compounds after pseudo-functions, then rewrites tokens using the complete subject context. Do not let classes in descendant/sibling selectors, selector-list branches, attribute strings or negated component bases supply a different subject's base. Tests include all five state families, both class orders and these negative controls.

Spread-only tags with remaining legacy modifier/state vocabulary fail closed after reviewed hunks and literal edits. This preserves canonical IconButton and safe spread uses; indirect producers imported from other files remain a documented manual review boundary. Whole-app preflight tests spy on writes and verify every original byte in dry-run and apply modes.

Exact 0.0.8 consumer replay needs its own source archive: maintainer init locates the monorepo by walking upward from --path, so an unrelated external target is refused. Use a fresh archive and a target beneath it; never overwrite another run's consumer. This run migrated 62 files and proved dry-run, zero-change second pass and workspace check.

The isolated browser tools have package.json outside the Deno workspace: use the saved parity config plus --no-lock --cached-only for render-migrated-css.ts, rather than creating a browser-tool lock. Two parity comparisons use 188 cases and production base tokens, native popovers, stacking order and four width/scheme pairs.

The old0.0.8 ui:add command does not route through the newer --app selector: target --project-root directly at apps/dashboard to install Markdown in the app under test. The first expanded replay installed it at workspace root; the final replay corrects this and retains an explicit changed-file list including components/ui/markdown.tsx. Old ui:add also emits unformatted app assets/tokens.css before migration; baseline fmt is red there and the hash remains identical afterward. The migrated-file fmt and whole-workspace check pass. Do not suppress or misattribute that baseline file to the migration.
