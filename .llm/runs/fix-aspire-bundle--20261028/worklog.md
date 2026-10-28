# Aspire workflow bundle closure implementation

Implemented for independent review; the root-approved consumer fixture refresh is complete and
the canonical dogfood freshness check passes. No commit or push was made. Base:
`88ae6fcacd36573b2f2f6244f4bebc31e49fc5e5`.

The canonical selection now includes `aspireify`. Existing four-skill trees delegate once to repair
the missing workflow. Claude still receives one discovery bridge. The dogfood validator imports
the canonical selection and requires its five canonical skill files plus the sole Claude bridge.

The root approved two necessary scope amendments after observed failures:

- Refresh the existing guidance template's workflow bullet and its generated CLI carrier. The
  unchanged combined-guidance test required the fifth skill name.
- Normalize CRLF to LF in the existing generator asset reader before stringification. This is a
  one-line correction in a 549-line pre-existing owner; it adds no lines or public API.

Seven semantic source owners changed. Their final hashes and line counts are in
`source-manifest.json`; the complete diff is `source.patch`. All initial MCP/docs installation files
remain untouched. The two generated helper templates match HEAD byte for byte, although Windows
Git still reports their stat changes; they must not be added as source changes.

## Verified evidence

- `tests-red.json`: unchanged production failed the exact five-skill command oracle and the
  explicit prior-four upgrade test. The existing symlink test also failed with Windows error 1314.
- `owning-tests-final.json`: full init owner directory, adapter tests, and unchanged generator tests:
  90 pass, 3 fail, 0 ignored. Both new regressions and the combined-guidance control pass. The three
  failures are the unchanged linked-tree privilege test and two host-restart tests in unchanged
  `init-agent_test.ts` (Windows path conversion and missing `@std/path` mapping). No assertions,
  sanitizer settings, filters, or OS settings were changed.
- `source-check-final.json`, `source-lint-final.json`, `source-fmt-final.json`: six TypeScript
  owners selected and processed, all pass. The seventh owner is a Markdown template, validated by
  actual generation and guidance tests. `source-policy.json` retains root lint rules and formatting
  values while making the explicitly selected, root-excluded paths eligible.
- `quality-gate.json`: canonical `quality:gate` passes. `quality-scan-final.json`: canonical
  changed-file scan after the generator correction passes with no findings or allowances. The
  scanner's existing policy excludes tests, generated strings, and Markdown templates; the source
  wrappers and native pipeline cover those files separately.
- `publish-dry-run.json`: canonical CLI member publication dry-run passes. It ran before the final
  LF regeneration; publication shape was unchanged by that later normalization.
- `exports-drift.json`: real canonical gate fails on Windows backslash reference-page
  classification. Root identified the pending prerequisite PR #2424. Its pass is not borrowed here.
- `native-generation-final.json`: actual Windows worktree canonical generation, full native
  generator `--check`, and repeat generation all pass. CLI carrier differs only in the approved
  workflow bullet; plugin and Fresh UI carriers are byte-identical HEAD. No carrier was hand edited.
- `native-adoption.json`: actual Aspire 13.5.3 installation through the production adapter passes.
  All five existing hrefs resolve; the canonical NetScript Aspire hash is preserved; only the Claude
  bridge is installed; second init has no changes, no second delegation, and identical tree hashes.
  Native invalid-workspace exit is 21. Cancellation child exits 1; status, stdout and stderr settle.
  The owned project is removed in `finally`.
- `dogfood-check.json`: actual consumer surface assertion passes, but full snapshot comparison fails
  on 55 stale files. Its owned scratch directory is removed (before and after lists are empty).
  The broad tracked consumer tree was not refreshed or exempted.

## Generation investigation and correction

The first actual-worktree generator invocation exited 0 and added encoded CRLF to 9,515 CLI,
463 plugin, and 5,036 Fresh UI asset lines. Its full three output carriers are retained as
`first-generation-carrier-0.ts.txt` through `first-generation-carrier-2.ts.txt`; the measured
normalized deltas are in `generated-delta.json`. The initial invocation's status was observed in
the tool transcript; it was not run through the durable gate runner.

Two bounded archive-snapshot attempts also ran the same native generator successfully but failed
the exact expected carrier comparison; cleanup completed. The second attempt's full process
receipt and output are retained in `canonical-generation.json` and `lf-attempt-*.ts.txt`. The
initial inference that HEAD itself stored CRLF was corrected: `template-inputs.json` proves native
Git blobs have LF, while the working files have CRLF and `.template` attributes are unspecified.
Windows `core.autocrlf=true` also converts `git archive` output. Git's upstream regular-file archive
path calls `convert_to_working_tree`:
<https://raw.githubusercontent.com/git/git/v2.51.0/archive.c>.

The accepted correction fixes the actual generator rather than relying on a snapshot transport
workaround. Its `readAssetLiteral` is the common CLI/plugin/Fresh UI reader. Actual freshness is
the generator's `writeOrCheckGeneratedAsset` exact byte check; the root `check:assets-barrel` task
also regenerates and compares against Git. The full native `--check` passes with the final source.

## Remaining acceptance work

Root review and independent evaluation remain required. Genuine Linux CI can qualify the unchanged
symlink control; the three Windows failures are now qualified against actual HEAD as described
below. The consumer snapshot refresh is complete, and the pending
docs classifier prerequisite must be integrated. Full CLI runtime E2E was not run in
this leaf: this task authorized native agent initialization only, with no AppHost or installer.

Aspire's explicit opt-in support for `aspireify` is documented by its pinned primary implementation:
<https://raw.githubusercontent.com/dotnet/aspire/v13.5.3/src/Aspire.Cli/Commands/AgentInitCommand.cs>.

## Deterministic consumer candidate and Windows baseline qualification

Root approved two further changes in the existing dogfood owner, now 164 lines: pass explicit
`--editor none`, and use a stable `consumer-skills` child basename beneath the unique scratch
parent. Native generation exposed the random bridge heading after removing editor drift; the
producer now creates a stable heading without modifying generated text afterward. The unique
outer scratch directory is removed in the existing `finally` on both paths.

The original 55-stale result and the first random-heading 49-file candidate remain retained. Two
fresh production CLI generations now have all 57 file hashes identical, with no VS Code files and
the stable `# consumer-skills repository skills` bridge heading. Both producer scratch directories
were removed. The tracked fixture remains untouched pending root review.

The candidates are in ignored scratch as `consumer-skills-candidate-a/` and
`consumer-skills-candidate-b/`. Their complete manifests and diff are archived as
`consumer-skills-candidate-a.json`, `consumer-skills-candidate-b.json`, and `consumer-candidate.patch`.
`consumer-candidate-proof.json` binds 22 tool/first-party-skill/guidance files to the actual canonical
source producer and records the native Aspire binary version/hash. The remaining upstream workflow
files were emitted by that pinned native CLI in both independent generations.

The exact 49-file candidate delta is 13 additions (11 native aspireify files, CLAUDE.md, and the
single bridge), 29 obsolete Claude mirror deletions, and seven modifications: native monitoring
reference, two canonical NetScript skill files, three current copied tools, and AGENTS.md guidance.
No tracked fixture file has yet been written. Six-TypeScript check/lint/fmt wrappers were rerun on
the final 164-line producer and all pass.

`windows-baseline-qualification.json` records a bounded native Git HEAD archive and targeted runs
of the exact three failing test names using the same Deno 2.9.7/cache on baseline and current
source. Each run reports 0 pass, 3 fail, 0 ignored with the same native error classes. The three test
blocks hash identically; the relevant application, filesystem, adapter, and public binary owners
also hash identically. The snapshot was removed after child and pipe completion. This qualifies
the failures as baseline; it does not turn the wider owning suite green or claim symlink support.

## Approved canonical fixture refresh completed

After reviewing the complete candidate and its provenance, root authorized the exact 49-file
refresh through `deno task maint:dogfood-skills` only. The absolute fixture directory and each
ancestor were checked as directories without symlinks before the canonical producer removed the
old fixture. The resolved target remained inside the exact repository `.agents/generated/consumer-skills`
boundary.

`approved-consumer-refresh.json` records both native canonical commands exiting 0. All 57 resulting
file bytes match the reviewed candidate; actual changes are exactly 13 additions, 29 deletions,
and seven modifications. `maint:dogfood-skills:check` reports `OK` with `stale: []` while ambient
VS Code detection is present and the producer explicitly selects editor none. The stable bridge
heading remains `# consumer-skills repository skills`, producer scratch is empty before and after,
and all seven authored source hashes remain unchanged. `final-consumer-fixture.json` provides the
complete final file hashes and exact native Git name/status delta. Historical failures and both
reviewed candidates remain retained. Independent implementation evaluation is still pending.
