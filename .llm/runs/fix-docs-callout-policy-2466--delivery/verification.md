# Gate evidence

- Red structured unit run: 3 expected top-level failures (ERROR marker, supported-marker set,
  real renderer alias export); after fix: 5 passed, including20renderer fixture cases.
- Broader structured docs tool/renderer run:25passed,0failed,0ignored.
- Red real Chromium regression: --ns-primary:red falsely exempted; expected assertion fails.
- Green initial policy matrix:12passed. Rebuilt docs matrix:32passed across light/dark at390/1280,
  including all generatedMarkdowntwins, callouttones/icons/labels/geometry and existingcontrols.
- Real command-level negative controls: raw-colour,raw-custom,red-role,red-token each exit1 with
  expected raw-colour/red-outside-state findings at test-owned styles/control.css.
- Scoped structured sourcecheck:26docs tools,20siteplugins,4strictbrowserfiles; all pass.
- All6ownedTSfiles explicitly linted/formatted using docs configuration:PASS. Browserall4files
  lint:PASS. Root lint's all-excluded refusal was corrected, never treated as PASS.
- Docs build/renderedoutput, links,accuracy,releasepreflight,quality/architecture:PASS.
- Full4carrierchain and all15rootchecktasks:PASS, including0unansweredreviewthreads.
- Independent separate read-only Claude Opus5.5 high IMPL-EVALround1:PASS.
- No dependency or lockfile changes. FullCLI runtimeCI remains pending finalpush/dispatch.

Finalrepeat: check:mcp-export-corpus,check:agent-docs-prose,check:assets-barrel,check:publish-assets allPASS after control documentation. Source and locks unchanged by generation.
