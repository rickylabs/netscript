# Main integration quality gate

quality:gate scans docs/site as well as packages/plugins. Main had a double cast in the Markdown renderer fixture that fails the scanner. Use Lume Page.create(...).document instead of casting DOMParser nodes to global Element; the original renderer tests pass and the scanner needs no allowance. check:assets-barrel invokes generators and compares to committed files, so it reports red while regenerated prose is intentionally uncommitted. Commit the regeneration before its final freshness verdict.
