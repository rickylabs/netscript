# Focused documentation validation

- The structured source wrappers support repeated --file. Check/fmt work for .llm/tools/docs input; root lint excludes .llm, so the lint wrapper must receive an explicit scratch config with {"lint":{}} to actually process these files. Never count an all-excluded refusal as PASS.
- Existing snippet-extractor Git cancellation fixture creates a shebang executable under Deno.makeTempDir. On a noexec temporary mount it fails before the probe starts; using TMPDIR pointing into the project run's executable temporary root passes without editing tests.
- This change's focused wrapper test set is snippet-extractor_test.ts + snippet-compiler_test.ts + pages-workflow_test.ts: 24 passed, zero failures/ignores.
- docs/site verify covers source-format, Lume build, rendered output, internal links and caveats; root docs:snippets, docs:accuracy and docs:exports-drift remain independent gates.
- Test CLI examples in the original inline HTML lifecycle table as well as a shell fence. The real-page negative control restores exact bytes in finally and reruns the positive corpus.
