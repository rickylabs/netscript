# Drift

- Environment: RTK absent; direct bounded commands used. Prior docs-run memory already records this limitation.
- Owner overrides: fixed existing dispatcher branch name retained; feature-tier evaluation with explicit Claude model and high effort; no labels/milestones changed; PR starts with Refs URL, never a closing keyword; local scaffold.runtime prohibited.
- Privacy: published run artifacts use repo-relative paths and omit private runtime identifiers. Raw evaluator transport data stays outside tracked source.
- Potential scope conflict: docs source changes stale the generated CLI prose carrier, but packages/** is prohibited. Preserve freshness checks and report this if encountered.

- Validation environment: root lint config excludes .llm tools. The first structured lint invocation correctly refused 4 excluded inputs. Passing an isolated empty lint config explicitly to the same wrapper checked all four inputs and passed without suppressions.
- Validation environment: existing Git-probe test could not execute its shebang from the default temporary mount (23 passed, 1 failed). Re-running under an executable project-run TMPDIR is the scoped environment correction; no test weakening.
- Public CLI proof setup: compilation passed. Compiled init failed on a missing optional Rollup module; unchanged public source init passed. No runtime services were started.
- Confirmed generated agent-docs freshness red: read-only build-agent-docs-bundle.ts --site-dir docs/site/_site --check exits 1 for agent-docs-prose.generated.ts. The required quality gate remains intact; carrier refresh is outside this lane.
