The S1 changes look correct and match the approved plan, with no blockers. I sign off S1 for commit once the scoped check, lint, format and aggregate focused tests you're finalizing pass.

## Plan alignment and correctness

- **Shared selector:** `registry-source-selection.ts` reads each file and checks only the first line, so no module is ever imported. A leading BOM, surrounding spaces or tabs, and a CRLF line ending are accepted. File order is preserved, a missing file stays selected, and a read error is raised rather than silently skipping the module.
- **Tests on the marker:** they cover the directive inside a string, on a later line, after a blank line, with a suffix, with a trailing reason, and inside a block comment. None of these exclude the module.
- **Every writer is covered:**
  - Triggers: both the `generate plugins` generator and the command-line compiler.
  - Workers: both writers, including the local jobs folder and every plugin-provided jobs folder.
  - Sagas: filtered after the existing definition scan.
  - AI: the marker is checked before its existing definition-shape check, for both tools and agents.
- **Unchanged behaviour:** the fixed manifest exclusions, the strict loaders inside the generated registries, and the empty-registry paths all stay as they were. Excluded-file evidence is only added when it is non-empty.
- **Older plugins:** when nothing is excluded, the plugin output is byte-identical to before.

## Host validation and doctor

- **Protocol check:** the field-checking helper still requires every mandatory field and now accepts only `excludedSourceFiles` as an extra. The top-level inspection document keeps its exact-field check.
- **Excluded paths get the same checks as selected sources:** project-relative, not generated output, unique, disjoint from selected files without regard to case, existing on disk, and capped in count.
- **New renderer test:** it confirms older output with no exclusions still validates. It also rejects a string, null, a number, paths that escape the project, a generated-output path, a missing file, duplicates, overlap with a selected file, too many entries and an unknown field.
- **Doctor:** it names the excluded modules in both the healthy and the drift message. Its comparison still uses only the selected files, so excluded files cause no false drift.

## Evidence

The installed-project test is meaningful:
- It covers triggers, workers (local folder plus both plugin-provided folders) and sagas.
- Each marked helper throws if it is ever imported, and each fixture keeps one valid definition.
- The test runs generate and then inspection, imports each generated registry, and checks it holds exactly one entry.
- It then rewrites the registries with both command-line compilers, checks they select the same files as `generate plugins`, and imports the rewritten registries.

The negative control keeps the original path-specific load errors for unmarked trigger and worker helpers. The doctor test confirms doctor names the excluded modules, writes no project files, and still reports drift.

## Scope and JSR

- **#2162:** no empty-registry behaviour changed, and every fixture keeps a valid definition.
- **JSR:** the export added under `@netscript/plugin/cli` is additive, with explicit types and full documentation. No dependencies or export-map entries changed, and the module tag was added.
- **Inherited findings:** the doc-lint private-type references and the audit's missing module tags are in unchanged files and are recorded honestly. They are not blockers for this change.

## Not blocking

- **Version coupling:** a newer plugin used with an older CLI is rejected cleanly, but only when a module is marked. Since the plugins now import a new export from `@netscript/plugin`, they must be released together with it; that's a release-time concern.
- **Untested risk:** the plan says worker config pointing at an excluded job must keep its existing error. The code does this by filtering the jobs, but no test covers it. A test in S2 would be worth adding.
- **Run files:** the new worklog and memory notes contain no private operational details.

VERDICT: PASS