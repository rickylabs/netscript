# IMPL-EVAL #2570: final independent review (Claude Opus 5.5, read-only)

**Code verdict: PASS.** I found no critical or blocking defects in the final source.

**Merge readiness: NOT READY.** The runtime tier is **UNPROVEN** and no workflow policy skips it. Draft PR #2572 stays a draft. Do not post READY.

## What I reviewed

- **Brief and run files:** `.divybot-goal.md`, `plan.md` (including binding decisions B1–B6 and the S2 debt section), `supervisor.md`, `drift.md` and `worklog.md`.
- **Source:** all 49 files listed in `s4-final-source-inventory.json`, read through `.llm/tmp/scaffold-2570/final-source.diff` (baseline 0af8fd9 to the working tree).
- **Live repository code**, to check the parts the scaffold relies on:
  - the `service add` command options and which contract template it emits;
  - the auth route and `auth/bff.ts` sign-in contract;
  - where the auth and AI plugins write their files;
  - the storage key used by ThemeToggle;
  - the debt ledger entry.
- **Evidence:** `s4-gates.json`, `s4-scaffold-tests.json`, `s4-runtime.json` and its log, `visual-review.md`, `s3-browser.json`, `s4-doc-lint-baseline-comparison.json` and `leak-report.md`.

## Behaviour confirmed in the actual source

- **Commands are real.** Every rendered install or add command matches the parser:
  - `service add` takes `--name` and `--with-client` (there is a regression test for this);
  - `plugin install <kind> --name <kind>` is used for auth, workers, streams and AI;
  - `plugin doctor` takes no positional name, and the drift file records this correction.
- **Sign-in uses the existing provider flow correctly.** The page form is a `method='post'` to `/auth/signin`. The BFF template accepts only a same-origin POST for `signin` and rejects GET, so a plain link would have broken it.
- **Optional modules are found at the right paths.** The scaffold looks for `../../../auth/bff.ts`, `../../../ai/models.ts` and `../../../ai/ai.ts` from `apps/<app>/lib/`. Those are the workspace-root paths the auth and AI plugins write, per their docs and tests. The auth route check uses `apps/<app>/routes/auth/[action].ts`.
- **Server-only boundary holds.**
  - Islands receive only safe capability data (state, label, description, command) and the navigation list. `SettingsForm` imports types only.
  - The browser-session (auth) client is chosen per request and never serialized.
  - Raw errors are logged on the server and reduced to `unauthorized` or `unavailable`. Tests cover status codes 401, 403 and 503, plus missing, invalid and wrongly shaped `appsettings.json`.
- **States are honest.**
  - `ready` is set only after a successful typed read.
  - A disabled plugin shows as `absent` with the doctor command; an unlinked one shows as `installed-unwired`.
  - Memory record detail correctly separates found, missing and "lookup limit reached" (tested with 20 pages).
  - No-service apps import no contract at all.
- **Settings work as described.** They use `ns-theme`, the same storage key as ThemeToggle, and project identity is read-only.
- **#2566 is resolved.**
  - The theme comes from `appTheme().label`.
  - The page count is computed from the real route table, with `/design` excluded in production.
  - "NS One", "maintainer scaffold", "CRUD" and the static rows are gone.
  - Required runtime pages are kept: `/examples/orders/[id]` (with its `data-order-id` marker and self-link) and the development-only design links.
- **The memory-client connector is safe today.** `service add` has no database option, and the contract scaffolder picks the memory template whenever there is no database. So `connectScaffoldRecords` always renders the matching adapter. It only replaces the placeholder when the file is byte-identical to the scaffold output.
- **The accepted debt is properly recorded.** CLI-SCAFFOLD-WORKERS-CONTRACT-DEPENDENCY is in `.llm/harness/debt/arch-debt.md` with reason, cost, mitigation, owner and target. The version-parity test uses the real public resolver. I found nothing new that this debt is being used to hide.

## Findings (none block the code verdict)

| # | Severity | Finding |
| --- | --- | --- |
| 1 | Low (performance) | **Settings and sign-in fetch more than they need.** They call `readScaffoldCapabilities()` without the request, only to read the auth state. That still probes workers (`listJobs` without credentials), streams `/health/ready` and AI `runtime.chatModel()` in parallel, each with a 3-second timeout. Suggested follow-up: an auth-only read. |
| 2 | Low (robustness) | **One bad plugin manifest hides everything.** A malformed `scaffold.plugin.json` in any top-level or `plugins/` folder throws out of `installedPlugins`, and all five capabilities become `unavailable`. This is safe and logged, but coarse. Skipping and logging the bad entry would be better. |
| 3 | Info | **The user's session is forwarded to first-party services.** When auth is installed, the workers read carries the request's own session through the existing BFF client. This matches the documented BFF pattern, is server-side only and is never serialized. Acceptable. |
| 4 | Low | **A missing record returns HTTP 200** (a "soft 404"). The page renders correctly, but the status code is wrong. |
| 5 | Low (accessibility) | **Shared palette footer label.** `<footer aria-label='Command keyboard help'>` sits inside the dialog, where it has no landmark role. ARIA 1.2 does not allow naming such an element. Remove the label, or use `role='note'` or `aria-describedby`. |
| 6 | Low (maintainability) | **Sidebar icons and grouping depend on wording and order.** `_layout.tsx` picks icons by display label and splits the menu with `navigation.slice(0, 4)`. Renaming or reordering `navigation.ts` silently changes icons and groups. |
| 7 | Low (new) | **A bad date crashes the page.** `record-table.tsx` formats `new Date(row.createdAt)` with `Intl.DateTimeFormat`. An unparseable value throws `RangeError` (a page 500) instead of showing "—". Current contracts guarantee a valid value, so the risk is low. |
| 8 | Info | **Shared CommandPalette behaviour changed for every consumer.** It now filters internally, selects through `onValueChange`, no longer uses `onClick`, and resets on reopen. Render tests and browser checks cover this. It is a likely merge conflict when #2488 lands, as noted in the drift file. The test imports `npm:preact-render-to-string@^6.7.0` inline; it passes with `--frozen`, but an import-map entry would be cleaner. |
| 9 | Info | **The connector is tied to the memory contract.** If `service add` gains a database option, `connectScaffoldRecords` must check the storage type before writing. |

## Acceptance coverage

| Acceptance item | Status |
| --- | --- |
| No-db, memory-service and plugin variants, 1440/390 widths, light/dark | Proven: 72 browser cases and 12 interaction sets with 0 page errors (`s3-browser.json`) |
| Each shown capability is live or an exact-command empty state, with no static rows | Proven in source and tests. In the plugin variant, workers and streams render `unavailable` and AI renders `empty` (no samples). A live `ready` for workers and streams is shown only by tests with fakes. |
| Independent visual score ≥ 8/10 per page | Proven: Astra round 2 PASS; worst scores are 8/8 per page across all 96 images |
| CLI scaffold and template tests, including #2566 | Proven: 302/302 across 43 files. Round 1 had one obsolete layout assertion; the corrected test checks the real `_app` and SidebarShell `Partial` boundary. |
| All 15 `check:*` tasks, `release:preflight`, `docs:accuracy`, `quality:gate`, `publish:dry-run` on Deno 2.9.7 | Exit 0 per `s4-gates.json`, head 7d9fd6a |
| Scoped check, lint and fmt | Pass for 19 sources plus the test fix |
| CSS budgets | Unchanged and passing, per the supplied evidence |
| `scaffold.runtime` | **UNPROVEN.** `preflight.aspire` failed (Docker daemon unavailable), the suite stopped before creating a scaffold, and `cleanup.aspire-stop` also failed. Exit 1. |

## Remaining risks for merge

1. **Runtime is UNPROVEN.** This includes live workers `listJobs` through the BFF and streams readiness against real services, which have never run against real services. Neither has container cleanup. With no workflow-policy skip, this blocks READY.
2. **The test fix is not committed.** The `template-asset_test.ts` change is in the working tree only; all gate receipts are for head 7d9fd6a. Commit and push it normally (no rebase or force-push), and get the required remote checks green on the new head. I did not verify remote CI status.
3. **#2488 is still open.** Rebuilding against its components and reconciling the shared palette are still to do.
4. **#2571 showcase** is correctly left out.
5. **Doc-lint is not fully clean.** Fresh UI's full-export doc-lint reports 124 diagnostics, all in unchanged files and matching the baseline. That is not a claim of a clean doc-lint.

**Process:** the owner's instructions apply: draft PR, Refs #2570 and Refs #2566, no labels, and READY only when every required check is green or skipped by workflow policy. That condition is not met.
