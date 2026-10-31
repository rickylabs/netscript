# Independent S1 implementation review

**Verdict: PASS.** I found no blockers in the S1 working tree. The red carrier freshness gate does block merge; it doesn't block this lane's sign-off.

I reviewed read-only with Read/Glob/Grep, made no edits and ran nothing. Because the S1 changes aren't committed yet, this verdict is not tied to a SHA. The later resumed review still has to check the exact pushed head.

**Process and scope**
- **Plan review came first:** PLAN-EVAL passed before implementation, and its refinements were adopted. These were the placeholder guard (N2), the exact file list (N3) and the terminology wording (N4). The worklog has a Design section.
- **Files changed:** they match the N3 list exactly: the two docs pages, `cli-example-policy.ts`, `snippet-policy.ts`, `snippet-extractor_test.ts`, `check-snippets-worker.ts`, `snippet-coverage.md`, one fixture, and run artifacts. Nothing under `packages/**` or `plugins/**` changed, no lock files changed, and local `scaffold.runtime` was not run.
- **Run artifacts are clean:** they use repo-relative paths and contain no absolute paths or private runtime identifiers.

**Correctness against the source**
- **The command really takes an installed name.** `update-plugin-command.ts:31` declares `<name:string>` and passes it to `installPlugin` as both `kind` and `pluginName`. A package specifier would therefore end up as the plugin's installed name, so the correction is right.
- **Both pages now say the right thing.** The guide's lifecycle table (`add-a-plugin.md:208`) shows `update <name>` with the example `netscript plugin update workers`. The command reference (`commands.md:225-232`) adds the example and separates `update` from the verbs that do take packages (`enable`, `disable`, `setup`).
- **Every page is checked.** The new check runs on the full Markdown/Vento source of every page, before the TypeScript coverage floor applies. That catches inline code, HTML tables, quoted and HTML-escaped operands, operands wrapped across lines, `jsr:` operands and the `<pkg>`/`<package>`/`<specifier>` placeholders. Legitimate forms still pass: installed names, `<name>`, flags, and package operands on `install`/`enable`/`setup`.
- **Tests:** they cover both rejected and accepted forms, line reporting with CRLF line endings, enforcement outside the coverage floor for both `.md` and `.vto`, and the real negative-fixture CLI exiting 1.
- **Fixture documentation:** the `snippet-coverage.md` text now says "the first four are red controls". That matches the actual fixtures, since `dialect-a-object-input` was already a red control.

**Negative controls and evidence**
- **Named fixture:** it fails as required, raw exit 1, at `page.md:4`.
- **Bad example put back on the real page:** it fails at `add-a-plugin.md:208` with raw exit 1. After the original bytes were restored, the same run exits 0 with the same counts.
- **Real CLI run:** `plugin update workers`, run through the ordinary public entrypoint, exits 0 with "generated 0 registries". The evidence states honestly that this was a sample-free workspace with no services started. The setup is in `memory-cli-proof.md`.
- **Gate workarounds are recorded in `drift.md`.** Lint needed an explicit empty config because the root lint config excludes `.llm` tools. Tests needed a TMPDIR that allows execution because of an existing shebang test. Neither one weakens a check.

**Non-blocking notes (optional follow-ups)**
1. **Custom installed names:** since `update` treats the name as the plugin kind, "use the installed plugin name shown by `plugin list`" only clearly works for the conventional names (or aliases). The guide already tells readers to keep those, so this matches the command source, but updating a custom-named install is unproven.
2. **Gaps in the check:** it misses a package operand placed after flags, and it doesn't decode `&#x27;` or uppercase placeholders. Both are outside this bounded defect.
3. **Usage-list test:** the test at `snippet-extractor_test.ts:252-262` doesn't assert the new fixture name. The usage text is built from the same list of fixture names, so this is coverage only.
4. **Old baseline line:** `snippet-coverage.md:31` still shows `scanned=578`, while the current count is 667. That drift predates this lane.

**Carrier merge dependency**
- **The required gate fails as expected.** The required `quality` job runs `agent-docs-prose` (`ci.yml:495`). The docs bundle builder's `--check` reports `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts` as stale and exits 1. Changing `docs/site` was bound to cause this.
- **It can't be fixed in this lane:** refreshing the file means touching `packages/**`, which the owner prohibits. The run records it honestly, keeps the gate intact, and says the PR must not be called merge-ready while it is red.
- **It blocks merge.** The coordinator has to authorize or perform the carrier refresh before merging. It is not a defect in the scoped implementation.

**Scope review verdict: PASS.** The final SHA-specific MERGE/CHANGES line is left for the resumed review.

I couldn't write a plan file or end with ExitPlanMode, because only Read/Glob/Grep are available in this session. This report is the whole deliverable.
