**S2 re-review: PASS**

The round 2 corrections close the debt item from round 1, and the new post-init connection path is safe. This covers S2 only. S3 (visual fidelity) and S4 (final gates, runtime tier, merge readiness) are not assessed here, and this isn't the final IMPL-EVAL.

## Round 1 debt item: resolved (option a)
- **Accepted debt is recorded:** `.llm/harness/debt/arch-debt.md` (`CLI-SCAFFOLD-WORKERS-CONTRACT-DEPENDENCY`) names:
  - the cost: apps without workers still resolve the contract, and the contract can drift from the installed plugin's version;
  - the mitigation: one release-pinned resolver for both;
  - an owner, a target, and a closing gate: an optional typed adapter generated from installed-plugin metadata, with proof that no-workers apps carry no workers dependency.

  `drift.md:41-47` cross-references it.
- **Version-parity test:** `packages/cli/src/kernel/application/scaffold/writers/workspace-pages_test.ts:160-184` runs the real public `JsrImportResolver` through `generateAppDenoJson`. It asserts the app's `contracts/v1` import equals `jsr:<core>@<core.version>`, and that the workers-core version equals the shipped workers plugin manifest version.
- **Resolver entries:** both the public resolver (`public/adapters/jsr-import-resolver.ts`) and the maintainer resolver (`maintainer/adapters/local-import-resolver.ts`) now have the entries, and the public add-service test passes.

## New: post-init service connection
`connectScaffoldRecords` in `packages/cli/src/kernel/adapters/service/client-scaffolder.ts:112-135`, called from `public/features/services/add/add-service.ts:103-110`.
- **It only rewrites an untouched placeholder.** It writes `lib/scaffold-records.ts` only when the file exists and exactly equals the formatted placeholder template. Anything else is left alone: an edited file, a missing file, or one already connected to a second service. All of these are tested in `client-scaffolder_test.ts:73-96`.
- **The memory-only claim holds.** I traced it through source:
  - `hasDatabase` is set only in `kernel/application/scaffold/workspace-init.ts:70,109`.
  - Post-init `service add` never sets it, so `contract-scaffolder.ts:91-93` always emits the memory contract.
  - That matches the memory adapter the connector renders, which now imports through `{{serviceQueryModule}}` and resolves to the sibling `./<service>.ts` client.
- **Evidence:** after a real `service add --with-client`, the generated app type-checks with 0 diagnostics across 101 files (`s2-postinit-check.json`). The 90 corrected tests pass (`s2-corrections-tests.json`).
- This narrows B2. A post-init service now goes live when the placeholder is untouched, and otherwise stays honestly installed-unwired. The plan records it.

## Round 1 observations 1, 2 and 8: fixed
All three are in `packages/cli/src/kernel/assets/app/lib/scaffold-capabilities.ts.template`.
- **(1) Service state in the live variant:** `readScaffoldCapabilities(request, records)` now takes the service state, message and command from the adapter's actual read (`:38, :45-47`). The home and dashboard loaders pass `records` (`routes/index.tsx.template:9`, `routes/dashboard.tsx.template:9`).
- **(2) App references:** the rule is now strict. A plugin only counts as linked when the app's `PluginReferences` includes it (`:54`). This is tested both ways: empty references give installed-unwired, adding the reference makes it scoped (`workspace-capabilities_test.ts:46, 82-86, 103, 118`).
- **(8) Disabled vs unlinked:** the disabled/absent check now runs before the not-linked check (`:55-56`).

## Non-blocking (carry to S3/S4)
1. **The connector assumes `service add` stays memory-only.** If it ever gains a `--db` path, `connectScaffoldRecords` would emit the wrong adapter. Add an explicit guard: check that the generated contract is the memory shape, or pass `hasDatabase` through and skip otherwise. A test should pin that assumption.
2. **Still open from round 1:**
   - one malformed `scaffold.plugin.json` blanks all five capabilities;
   - the session token is forwarded to every workspace service, workers included;
   - `chatModel()` runs on every overview render;
   - a missing record renders with HTTP 200, not 404;
   - `s2-plugins-referenced-browser.json` still holds booleans only.
3. **Settings and sign-in over-fetch.** Both call `readScaffoldCapabilities()` just to read `auth`, which also triggers the workers, streams and AI probes on every render. An auth-only reader, or lazy probing, would avoid those reads.
4. **Doctor guidance for unlinked plugins.** Unlinked plugins point to `netscript plugin doctor`. In S3, confirm that its output actually names the missing app reference and the `config set` remedy. If it doesn't, render that command directly instead.

S2 can be signed off.
