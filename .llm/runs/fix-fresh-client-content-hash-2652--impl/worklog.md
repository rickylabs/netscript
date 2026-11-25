# Worklog: Content-hashed immutable Fresh client modules in generated builds (#2652)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `fix-fresh-client-content-hash-2652--impl` |
| Branch         | `fix/fresh-client-content-hash-2652` |
| Issue          | #2652 — implementation PR; body carries `Closes #2652` |
| Classification | implementation |
| Archetype      | 6 — CLI / Tooling package, kernel scaffold assets |
| Scope overlays | `SCOPE-frontend.md` |
| Milestone      | `0.0.10` |

## Coordinator bootstrap (2026-11-24)

Baseline `main` = `87965d800b7d61312e8612c82bdb0cb98bdf5b29`; `v0.0.10-canary.4` = `7c51c7efb64cbf65c567232245c13fea69f45fe4`.

### Owner model authorization

> Owner explicitly authorized T3 dispatch, with rationale for Neon: it first found or co-found these gaps. Exact public builder model settings: providerInstanceId codex, model gpt-6.2-sol, options {reasoningEffort:'xhigh'} for N1 #2650 and N4 #2652; […]
>
> […] You, Opus, can review the Sol builds as a different-family agent; […]

Quoted verbatim from the owner's batch directive. `[…]` marks elided text that concerns lanes or parties outside this run's public record; nothing that governs this lane is elided.

### Route record

| Role | Requested identity | Transport | Family |
| ---- | ------------------ | --------- | ------ |
| Builder | providerInstanceId `codex`, model `gpt-6.2-sol`, options `{reasoningEffort: 'xhigh'}` | T3 `delegate_task`, isolation `worktree` | OpenAI |
| IMPL-EVAL | Claude Opus 5.5 (`claude-opus-5-5`, effort `xhigh`), the batch coordinator acting as a different-family reviewer (Anthropic vs OpenAI) | separate session | Anthropic |

- Workload tier: `feature`. The privileged `complex`/`architecture` rows are not authorized for
  this lane and are not selected.
- PLAN-EVAL: N/A — single bounded build-config fix with an issue-defined regression; no public API change. Escalate to the coordinator if a `@netscript/fresh` public option is needed.
- IMPL-EVAL loop: feature row — at most 5 rounds, owner notified after round 3. Every new head after changes is re-gated.
- No implementation lane self-certifies. Automated green gates are evidence, not review.
- Fallback: none without an owner report first. If the builder or reviewer provider is unavailable
  or out of quota, the coordinator reports before any fallback; no silent model or provider switch.

### Scope

- Generated production builds give **client** entry and lazy chunks content-hashed file names, so a changed immutable module gets a new URL.
- **Server** entries keep stable names; the production server launcher still loads its expected server entry.
- A two-build cold/warm regression: build A (island click shows "A"), record client entry/chunk URLs, bytes and cache headers; change to "B", rebuild, serve at the same origin; a warm browser profile with HTTP caching hydrates and shows "B"; changed modules have new URLs; unchanged server entry name is stable.

### Boundaries and shared seams

- #2577 (Northwind scaffold preset) edits `packages/cli/src/kernel/assets/northwind/**` and the generated asset carrier. Do not edit Northwind assets. Regenerate carriers only through the generator tasks; if #2577 merges first, merge `origin/main` and regenerate — never hand-merge generated carriers.
- No dependency or lock edits beyond what is strictly necessary (record any in `drift.md`).
- Ask the coordinator before touching another lane's files.

### Gates

- Scoped check/lint/fmt/test over changed roots (`packages/cli` needs the temp no-exclude config pattern for fmt/lint).
- Generated carrier chain: prose → corpus → assets barrel → publish assets (`gen:*` tasks) all clean.
- `deno task quality:scan`, `deno task arch:check`, `deno task release:preflight`, `deno task docs:accuracy`.
- Scaffold output changes, so the documented gate applies: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` (Docker only via `mise exec -- docker`), plus the two-build browser regression.

## Design

- Surface: `netscript init` emits the production Vite config. Its app-level build and start tasks keep their existing interfaces. Package exports and dependencies have no changes.
- Model: Vite's `client` and `ssr` environments, client manifest records, and the generated server launcher. The production regression uses those records and one Chromium profile to observe the client entry, the fixture island and its lazy dependency.
- Edges: reuse the maintainer scaffold, generated build task, Deno production launcher and existing CDP browser fixture. The regression adds no product ports or configuration.
- S1 implements and proves the filename policy in the app Vite template and its generated carrier. The browser regression under `packages/cli/e2e/tests/application/gates/scaffold/` exercises the baseline and corrected assets. Scoped validation, generator checks and the one-pass scaffold runtime gate cover the slice.
- S2 records the final implementation checkout's one-pass scaffold runtime and ownership results in the run log.
- Contributor path: edit the Vite template, run the generator chain and run the focused generated-browser test. Existing projects' local Vite files and unrelated scaffold presets are outside this issue.
- PLAN-EVAL: N/A per the bootstrap. This bounded config change uses upstream environment options and keeps the public API intact.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-11-24 | S0 | bootstrap | Coordinator bootstrap commit: `supervisor.md`, `worklog.md`, `drift.md`. |
| 2026-11-24 | S1 | research | Verified the assigned bootstrap and baseline, read #2652, and consulted the checkout's MCP `find_guidance` and `deno doc`. Source-inspected Fresh's client-first manifest and launcher paths. A generated local-source baseline app built successfully. |

| 2026-11-24 | S1 | validation | Baseline carrier reproduced stale A JavaScript on build B. Corrected carrier passed with B in the same Chromium profile and hashed client URLs. Scoped and generator results below. |
| 2026-11-24 | S1 | reconcile | #2652 is open and its Acceptance text matches the PR criteria. #2577 is open. The carrier diff contains the app Vite template alone. |

| 2026-11-24 | S2 | runtime preflight | First one-pass command exited 1 at `preflight.aspire` because the worktree shell could not resolve the installed .NET SDK. `cleanup.aspire-stop` then had no AppHost to stop. The ownership reporter found zero owned resources. |
| 2026-11-24 | S2 | runtime retry | Exposed the dedicated project's installed .NET SDK to the gate process. `aspire doctor --format Json --non-interactive --nologo` passed (0). Retried the same one-pass command at S1. |
| 2026-11-24 | S2 | runtime result | `behavior.documented-scaffold` failed. The Postgres listener reported `ECONNREFUSED` and database init timed out after 300 seconds (`aspire wait` exit 17). Deno and Aspire preflight, scaffold init, and Aspire cleanup passed. |
| 2026-11-24 | S2 | reconcile | The ownership reporter found no run-owned resources after cleanup. The three acceptance mappings matched the live issue using the repository validator. #2577 remains open. Draft #2655 carries the measured evidence and the open runtime gate. |

## Measured validation

The focused browser command was `deno test --no-lock --unstable-kv --allow-all packages/cli/e2e/tests/application/gates/scaffold/generated-client-cache_test.ts`. The baseline product files matched `main` at `87965d800b7d61312e8612c82bdb0cb98bdf5b29`, verified with `git diff --exit-code <main> <bootstrap> -- packages` (0). The baseline exit was 1 at “changed immutable entry reused its URL.” The fixed scaffold exit was 0 (1 passed).

The profile had HTTP caching enabled. Both production launches served the same origin, and the second navigation was a normal reload. Fresh served all measured module responses with `Cache-Control: public, max-age=31536000, immutable`. The production launcher loaded `server-entry.mjs` in both builds. The baseline browser received build B's HTML and still ran A for both the client marker and the island click. The fixed browser ran A on the cold load and B on the warm reload.

### Module responses

SHA-256 identifies the bytes independently of the URL.

| Scaffold | Build | URL path | Bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| Baseline | A | `/client-entry.mjs` | 24031 | `58f8bb7b4e1b2781f09fed1cda5d0a81ef8ccbdd7c5c5fd74ad4d300753aba72` |
| Baseline | A | `/fresh-island__CacheButton.mjs` | 1471 | `0536aeff03d900a01aa53eb0ca2a3fdc5b1eda45f1604f8a026e35a22bdb09d7` |
| Baseline | A | `/cache-result.mjs` | 33 | `1380b25f40d9446788339613265d773ced4b98354fc30c1bfb7ac1c6c9158163` |
| Baseline | B | `/client-entry.mjs` | 24031 | `10ec72d029662a941ea549c3d7a573b2660a27760087c90810fc69ca95b27288` |
| Baseline | B | `/fresh-island__CacheButton.mjs` | 1471 | `0536aeff03d900a01aa53eb0ca2a3fdc5b1eda45f1604f8a026e35a22bdb09d7` |
| Baseline | B | `/cache-result.mjs` | 33 | `9ab3b388f85033de99019cdc48008e62cd646a8a9c3c0b6d6b1375ec8a31f6c7` |
| Fixed | A | `/client-entry-D-eYQCQl.mjs` | 24067 | `8212bf3973be99d10dac58f4b2eb20ff9d25ce35594054c10c01e8d1889b1ad8` |
| Fixed | A | `/fresh-island__CacheButton-BpOCHg69.mjs` | 1498 | `d77bc61bac46e10f36f6de210a803bd19eecac286baf48c01c76d18c10082b6b` |
| Fixed | A | `/cache-result-DlUUXXlJ.mjs` | 33 | `1380b25f40d9446788339613265d773ced4b98354fc30c1bfb7ac1c6c9158163` |
| Fixed | B | `/client-entry-DOQzkjcO.mjs` | 24067 | `db1b36e7768408d35d574b9c952b8d731f38e7c86174871b11e4aa959aa89adc` |
| Fixed | B | `/fresh-island__CacheButton-BsDjPpum.mjs` | 1498 | `d028937c54794e3fa9bd1b9a957015ca6d90452e7f2a16d2b1dcc8065359d59f` |
| Fixed | B | `/cache-result-cBB7H4lI.mjs` | 33 | `9ab3b388f85033de99019cdc48008e62cd646a8a9c3c0b6d6b1375ec8a31f6c7` |

### Other commands

| Gate | Command | Exit |
| --- | --- | ---: |
| Type check | `.llm/tools/run-deno-check.ts --file <browser test> --file <embedded carrier> --deno-arg --no-lock` with implicit `--unstable-kv` | 0 |
| Lint | `.llm/tools/run-deno-lint.ts` on the browser test, embedded carrier and Vite template staged as TypeScript, with a temporary config stripped of root exclusions | 0 |
| Format check | `.llm/tools/run-deno-fmt.ts` on the browser test and Vite template staged as TypeScript, with a temporary config stripped of root exclusions | 0 |
| Scoped tests | `.llm/tools/run-deno-test.ts` on the browser regression and template tests (22 passed) | 0 |
| Template tests | `.llm/tools/run-deno-test.ts -- --no-lock --unstable-kv --allow-all packages/cli/src/kernel/templates/app/generators-config_test.ts` (21 passed) | 0 |
| Generation, in order | `deno task gen:agent-docs-prose`, `deno task gen:mcp-export-corpus`, `deno task gen:assets-barrel`, `deno task gen:publish-assets` | 0 each |
| Carrier consistency | `deno task check:agent-docs-prose`, `deno task check:mcp-export-corpus`, `deno task check:assets-barrel`, `deno task check:publish-assets` | 0 each |
| Quality | `deno task quality:scan` | 0 |
| Architecture | `deno task arch:check` | 0 |
| Release preflight | `deno task release:preflight` | 0 |
| Docs accuracy | `deno task docs:accuracy` | 0 |
| Aspire static scan | `deno task check:aspire-host-ports` | 0 |
| Scaffold runtime | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` at `7ad9fc836c0a7904a1b80e4eb80e0788f6e601ae` with Deno 2.9.7 and the dedicated Docker and Aspire configuration. The first invocation exited 1 at Aspire preflight. After exposing the installed .NET SDK, the one-pass rerun finished with 4 passes and 1 failure at `behavior.documented-scaffold`. | 1 |
| Ownership | `deno task maint:leak-check -- --slice-dir .llm/runs/fix-fresh-client-content-hash-2652--impl --worktree .` after the runtime rerun. All probes succeeded and zero resources belonged to the run. Unproven resources were left alone. | 0 |
| Acceptance mapping | Repository `validateEvidenceMapping` matched all three live acceptance boxes. The mirror command in dry-run mode exited 0 at the draft's current status. | 0 |

Environment notes. Deno 2.9.7. The initial full Chrome executable could not load `libcups.so.2` (browser version probe exit 127). Retried with the installed Chromium headless browser. RTK was unavailable. A read-only Deno inspection briefly added a redundant root lock entry and its own change was reverted before staging. No dependency or lock changes in the slice. S2 records evidence only, so its product and test files match the S1 checkout used for the runtime gate.

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Set output names under `environments.client`. | Vite inherits the existing top-level naming policy where no environment override exists. Fresh registers the resolved client filenames through the emitted manifest. | Fresh plugin `src/mod.ts`, `src/plugins/server_snapshot.ts` and `src/plugins/server_entry.ts` at 1.1.2. |

## Drift

See `drift.md`.
