**Verdict: PASS.** Both blockers from round 1 are fixed, the should-fix items you listed are resolved, and I found no new blocker. This is a source review of S1 only, not final readiness sign-off.

## Round 1 blockers
- **Layout line length is fixed.** The `appNavigation.filter(...)` chain is now wrapped the way `deno fmt` writes it.
- **Extra blank line in `ResourceIsland.tsx.template` is gone.**
- **Fixed by both checks:** with placeholders filled in, all three edited templates (layout, health view, resource island) pass `deno fmt --check` at width 100 with single quotes. The new test, "edited app and resource templates emit canonical generated source", runs the repo's formatter on each rendered template and requires the output to be unchanged. It throws if a template placeholder has no value, so it can't pass by skipping one.

## Should-fix items
- **Legacy topbar keeps its height.** It is now `min-height: 52px`, with wrapping and a little vertical padding. On a single row, a 32–36 px control plus that padding still comes to 52 px or less, so NS One apps stay at 52 px. The topbar only grows when the nav wraps on narrow screens.
- **The NS One preservation test is real.** It runs `ui:init --theme theme-ns-one`, then a plain `ui:init`, both through the dev CLI binary. It checks `theme-preset.json` is still `ns-one` after each run. That covers the "existing apps keep their preset" path.
- **Help text is updated.** `--theme` now reads "Studio Utility for new apps; custom registries use their own default", which documents the `--registry-root` behaviour.
- **The existing health-view wrapping problem is fixed** using `{' '}`, the same way `deno fmt` does it.

## Generated files and tests
- **Generated files are current.** The four edited CLI templates match `embedded.generated.ts` byte for byte, and the decoded `registry.generated.ts` contains `min-height: 52px`.
- **Tests:** I reran only the changed suites through `run-deno-test.ts` (`web-scaffold_test.ts` and `apply-ui-command_test.ts`). Result: 21 passed, 0 failed, exit code 0.
- **Formatting and lint:** the five changed TypeScript sources pass fmt and lint.
- **The docs change** in `docs/site/reference/fresh-ui/index.md` agrees with the README and the how-to page.

## Not blocking
- **The fmt and lint wrappers checked nothing on these files.** `run-deno-fmt.ts` and `run-deno-lint.ts` refused because every selected file was excluded, and native `deno fmt` reported "No target files found". The cause looks like the repo's exclusion policy matching this worktree's location. So I ran fmt and lint on copies in a temporary directory instead. That copy-based lint did not apply the repo's Fresh lint tags. Make sure the S6 gate evidence doesn't read a 0-file refusal as a pass.
- **Still not proven, as you already recorded:** `scaffold.runtime` can't run without Docker. I took the browser evidence (production shows no Design link; development shows it at 390 and 1280 px with no health-page overflow) from `worklog.md` and did not re-run it.
