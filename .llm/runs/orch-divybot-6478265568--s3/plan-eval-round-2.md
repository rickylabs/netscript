**PASS**

I re-checked only the four round-1 blockers. All four are now fixed in the plan artifacts. I did not edit any files.

1. **Registry embed refresh: fixed.**
   - Slice 3 now explicitly includes the regenerated registry embed (`plan.md:19`).
   - `plan.md:30` requires running `deno task gen:assets-barrel` whenever registry sources change, committing the result, and gating it with `check:assets-barrel`. It also states that this only re-runs existing tooling, with no changes to the registry schema or to `ui:build`/`ui:add`/`ui:apply`.
   - `deno.json:120` runs that generator with `--no-lock`, so it doesn't conflict with the no-lockfile-changes rule.
   - `supervisor.md:5`, `research.md:9` and `drift.md:8` all agree with this.

2. **Parser versus the no-new-dependency rule: fixed.**
   - The plan now chooses a small, bounded tokenizer that keeps the original bytes unchanged (`plan.md:27`), and adds no new parser dependency or lockfile change.
   - The "Tokenizer contract" section (`plan.md:47-49`) says exactly which forms it supports. It only removes legacy class names it has positively identified. A file it can't fully handle is reported and left completely unchanged.
   - Before writing anything, it checks the whole app and collects every problem. Dry-run does the same analysis.
   - Tests cover the risky inputs: strings, comments, URLs, nested expressions, running it twice, unsupported input, and app copies that were already customised.
   - `research.md:13` gives the reason no existing parser could be used.

3. **Gates taken from `gates/archetype-gate-matrix.md`: fixed.**
   - The Archetype 1 (contracts) gates listed at `plan.md:40` match the matrix's required set exactly.
   - For the new `ui:migrate` command, the plan covers the Archetype 6 (CLI) universal gates and lists F-CLI-1…31 as `PENDING_SCRIPT` with named manual evidence. That is a status the matrix's reporting rules allow (`archetype-gate-matrix.md:85-91`).
   - Archetype 6 requires consumer import validation. The plan covers it by running the migration on a real copied 0.0.8 app, running that app's `deno task check`, and importing and parsing the contract facade and its JSON.
   - It also adds the Fresh UI CI gates I flagged: `check:assets-barrel`, the generated-registry suites, and `fresh-ui-browser-contract`. Accessibility (axe) allowances may not be loosened to hide new failures.
   - The scaffold-output release gate (`scaffold.runtime`) is included as well.

4. **Scope of the published contracts: fixed.**
   - The owner's approval is now recorded verbatim at `drift.md:9`: "Write the contracts for every component that ships in Fresh UI today, plus the six built Figma categories (P0 and P1 first)." This is the explicit owner approval my round-1 fix asked for.
   - The published contracts are limited to components that ship today plus those six categories. Components outside them stay as research inventory only (`plan.md:8`).
   - Parts and axes that aren't implemented yet are marked as planned (`plan.md:29`, `naming-decisions.md`).

Nothing new blocks the plan, and I have not reopened any non-blocking preferences.
