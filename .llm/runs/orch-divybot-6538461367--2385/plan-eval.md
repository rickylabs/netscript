## PLAN-EVAL: issue #2385 / draft PR #2489

This was a read-only review. I edited nothing and ran nothing except file reads and searches. I couldn't see the issue text itself, so I checked the issue requirements against the run's `research.md` and the source code.

### Spot-checks against the source
- **The wrong guidance is in one place.** It's the lifecycle table in `docs/site/orchestration-runtime/how-to/add-a-plugin.md:208`, which uses `&lt;pkg&gt;`, the example `@netscript/plugin-workers`, and the sentence "The argument is a JSR package specifier". No other source file outside the generated carriers has a package specifier after `plugin update`. `reference/cli/commands.md:217` and `cli-reference.md:226` already say `<name>`. Research is correct.
- **The command really takes an installed name.** `packages/cli/src/public/features/plugins/update/update-plugin-command.ts:31` declares `<name:string>` and passes it to `installPlugin` as both `kind` and `pluginName`. It then regenerates the registries and commits the staged changes. The plan describes the host behaviour correctly.
- **Choosing to extend the existing snippet check is sound.** `snippet-policy.ts` already reads every `.md` and `.vto` file, but only checks TypeScript code blocks. A check limited to code blocks would miss this bug, which sits in an inline HTML table. Negative fixtures are registered in `check-snippets-worker.ts`, and `pages.yml:180` runs `docs:snippets`. The plan targets the right places.
- **The carrier conflict is real, and the plan describes it honestly.** `ci.yml:495` runs the `agent-docs-prose` gate in the required `quality` job. The stored copy of the docs prose is generated into a file under `packages/cli`, so changing `docs/site` will make that copy out of date. The plan keeps the gate as it is and reports the conflict instead of weakening it. That matches the owner's limits.

### Checklist
| Box | Status |
|---|---|
| Research present and checked against current main | ✔ main `2f426b9`, issue still open, no competing PR |
| Decisions locked | ✔ plan.md "Locked decisions" 1–5 |
| Open-decision sweep | ✔ none left that would force rework; carrier work deferred to the coordinator because of the owner's scope |
| Commit slices | ✔ S0, S1, S2, each well under 30 files, with gates named (see N3) |
| Risk register | ✔ five risks, each with a mitigation |
| Gate set | ✔ structured check/test/lint/fmt, `docs:snippets`, a negative fixture plus putting the bad example back on the real page, docs build/links/caveats, and a run of the real CLI |
| Deferred scope explicit | ✔ |
| jsr-audit | N/A: no package or plugin public surface changes (packages/** is forbidden) |

### Blocking findings
None.

### Nonblocking findings
1. **N1: the carrier failure is near-certain, not conditional.** Risk 4 says "if CI requires" the carrier update, but `quality` / `agent-docs-prose` is a required gate and will go red on this PR. S1 and S2 should expect that red result. Each report should name the exact failing gate and ask the coordinator to regenerate the carrier, either through the main-branch safety net or an authorized follow-up. It should not count the PR as merge-ready because the other gates passed.
2. **N2: placeholder gap in the new check.** Decision 2 allows placeholders after `plugin update`, so the misleading `plugin update <pkg>` / `&lt;pkg&gt;` wording would pass. Consider rejecting package-style placeholders such as `<pkg>`, `<package>` and `<specifier>`, in raw or HTML-escaped form. Also test the escaped HTML version of the real table row.
3. **N3: S1 describes its files instead of listing paths.** Each item maps to one existing file, so this is acceptable. Still, list the actual paths and choose the negative fixture's name before implementation, so IMPL-EVAL can check the change against the plan.
4. **N4: the docs scope's terminology gate isn't named.** It requires "installed name" vs "package specifier" to match the glossary or doctrine. Add it to the S1 gates or note it as N/A.
5. **N5: where the CLI run happens, and what it publishes.** The scratch CLI project should go in `$TMPDIR`. Published evidence should show only the exit code, the CLI output and the registry count, with no temporary paths or host details. If installing needs registry or network access that isn't available, record that as unproven. Don't call it a pass.

VERDICT: PASS
