Theme B presets now resolve through Theme set instead of reusing Tonal, Glass and Signal values. Shared Theme/Theme B/Theme set WEB names are emitted once, using the selected collection's mode throughout the alias chain.

- Build all 24 presets, including separate Bloom, Cupertino, Liquid and Terminal, original Ledger/Signal/Glass, and fully resolving faithful `macos-27`, `apple-classic` and `fluent-2-web`.
- Register all 277 new WEB names (1,180 total output roles), retain the four explicit rule-width migrations, and reject duplicate names, router miswires, orphan migrations and stale snapshot provenance.
- Check chart series at 3:1 on each chart surface and code syntax at 4.5:1 on code-bg. Treat tooltip kbd as a chip fill. Regenerate exclusions from zero allowances, removing the one prior exclusion that now passes.
- Synchronize authored theme items, preview assets and copied documentation with the engine; keep all prior NS One declarations and the unchanged CSS/publish budgets. Regenerate all four carriers.

Figma contrast burn-down remains **OPEN**. The reports contain every still-failing pair, including preset, scheme, role/paint stack, ratio and threshold:

- [Complete JSON report](https://github.com/rickylabs/netscript/blob/orch/divybot-6538850770/.llm/runs/orch-divybot-6538850770--s1b/failing-pairs.json)
- [Short per-preset table](https://github.com/rickylabs/netscript/blob/orch/divybot-6538850770/.llm/runs/orch-divybot-6538850770--s1b/failing-pairs.md)

9,132 measured uses; 531 exact failing pairs remain. The six chart rows are Liquid dark series 1/3/5 on its raised surface, under both Scheme and matching dark-intermediate names. All seven syntax roles pass. Source values are retained; NS One's new compatibility surface names alias its existing S0 palette.

Validation: 41 token/build/report/publish tests, 283 registry/component tests, 10 CLI token tests, and the root 3,996-file type-check pass. All 13 root `check:*` tasks, quality/architecture, release preflight, docs accuracy, registry-template lint and all four carrier checks pass locally. Clean-source corpus regeneration is unchanged. Native published payload remains below 5,000,000 bytes; the unchanged 6,000-byte default CSS gzip test passes.

Runtime is **UNPROVEN**: the exact `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` command exited 1 at Aspire/Docker prerequisites because the Docker daemon is unavailable. Resource inspection found no owned survivors; foreign resources were left untouched. Whole-package doc lint retains the baseline's 124 diagnostics (none on tokens.ts), and the JSR auditor retains its existing contracts.json module-tag finding; these are not reported as green.

Intentional value updates: Bloom/Cupertino/Liquid/Terminal select their actual Theme B modes; Studio and Fluent core roles follow the fresh export, and Brutal reads exported shadow/x. The mixed Figma emphasis style/weight name has bounded architecture debt and a documented `sourceStyle` limitation. No Figma value correction, label change or merge action is included.

Run and independent evaluation: `.llm/runs/orch-divybot-6538850770--s1b/`. Final implementation evaluation and exact-head CI status are recorded in the phase comments; READY is posted only after required checks succeed.

Refs #2450
