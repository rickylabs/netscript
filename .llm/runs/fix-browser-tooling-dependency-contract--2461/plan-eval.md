**Verdict: PASS**

The revised plan resolves all twelve items from the first review. It also covers the full #2461 scope and its acceptance criteria without changing any versions, import maps or locks. Implementation may proceed. The conditions below are details for the implementation to follow; IMPL-EVAL will check them, but they don't block the plan.

### How each item was resolved

| Item | Resolution |
|---|---|
| R1 shipped consumer tools | Option (a). `outdated.ts` and `why.ts` stay byte-identical. Only the root `deps:outdated` and `deps:why` task commands are pointed at a new internal `standalone-deps.ts`. Generated consumer files and `consumer-tools.json` metadata are untouched, and the assets-barrel, publish-freshness and release-preflight checks confirm the consumer bundle is unchanged. |
| R2 Aspire manifest | The new rule goes in `aspire-surface-manifest.ts`, ahead of the general workflow rule. It keeps `ci:workflow` and a non-archival owner. The fixture is rebuilt by the generator (0 unmatched) and rebuilt again after staging. No exemption is added. |
| R3 lock-only native commands | Good correction: research shows that `npm outdated --package-lock-only` returns `{}` with no `node_modules`, on both npm 11 and 12. Selected `outdated` now uses a `locked-stable` method: locked versions compared through the existing stable-channel resolver. It never calls `npm outdated` and claims no "wanted" version. `why` uses `npm ls … --package-lock-only` and `audit` uses `npm audit --package-lock-only --include=dev`, both tested with no install. |
| R4 census | Reads the manifest and the v3 lock (`packages[""]`, `packages["node_modules/<name>"]`) directly. It never runs npm, so `--allow-read` is enough. The new data goes in separate `standaloneProjects` fields and counts, and a declared/locked mismatch fails. |
| R5 no YAML dependency | The workflow test reuses simple indentation/block parsing inside the existing test file. `deno.lock` and the private Deno locks are hashed before and after. |
| R6 exit codes | 0 / 1 / 2 / 3 contract is defined. Default mode keeps the original wrapper exit codes. |
| R7 `why` arguments | `--project` is parsed and removed before the package name is taken. Duplicate or unknown selectors exit 2. Source-usage inference is explicitly unsupported in project mode. |
| R8 latest | `fetchLatestStable` and `basePinnedVersion` are exported and injected, so there is no import cycle and no third resolver. Default resolution is unchanged. |
| R9 hermetic tests | npm runs and registry fetches are injected in tests. Live probes run outside the root test suite. |
| R10 workflow gate | All nine bypass types are listed, there is a positive control, the gate ID is checked against the catalog, and every existing assertion is kept. |
| R11 Dependabot | `/tools/fresh-ui-browser`, weekly, `increase`, `labels: []`, Playwright pair and axe pair grouped, directory tied to the project registry, and a wrong-directory control. |
| R12 coverage notices | Shown in both JSON and pretty output, `--behind-only` cannot hide them, census includes the inventory, and consumer tools get no repo-specific notices. |

### Conditions for the implementation

1. **Failed lookups must not look up to date.** In `locked-stable` outdated and project-mode latest, if the stable version can't be fetched for any package, return exit 3 or mark the result non-clean. Never report `behind: false` for that package. Default-mode latest keeps its current behavior.
2. **State the coverage scope in the report.** Selected freshness covers direct declarations only, so say so in a field (for example `scope: "direct"`). It must not suggest transitive coverage, which the default `deno outdated` view does provide.
3. **Default-mode shim behavior.**
   - Start the original wrapper with no broader permissions than the original task gave it.
   - Pass the child's exit code through unchanged.
   - Use exit 3 only when the child's JSON can't be parsed.
   - Tests use an injected runner and never run the real `deno outdated`.
4. **Negative controls run on copies.** Apply them to in-memory copies of the workflow text, never to the tracked file.
5. **Keep reviewable evidence in the tracked run directory.** Live probes can stay private, but put a summary in the run directory: npm versions, the exact commands, exit codes and the key output fields. Use repository-relative paths and no identifiers, so IMPL-EVAL can check the `locked-stable`, `ls` and `audit` claims.
6. **Make the write set consistent.** `supervisor.md` currently disagrees with itself:
   - Line 7 says only `latest.ts` is edited ("exports only").
   - Line 9 says census, latest, audit and prod-install use the library directly.
   - The original line 5 still mentions a single manifest row and an optional new helper.

   Line 9 is the one to follow; record that in the worklog.
7. **Internal docs (recommended).** `.llm/tools/README.md`, `.llm/tools/entry.md` and `.agents/skills/netscript-deno-toolchain/SKILL.md` describe `deps:outdated` and `deps:why` as direct wrappers. Add the `--project` selector, the `locked-stable` method and the unsupported modes there; under AGENTS.md the skill is the canonical command map. Don't edit the shipped consumer docs (`consumer-README.md`, `skills/netscript-build`).

The deferred work is still kept out of scope: severity/baselines (#2460), fingerprints (#2462), screenshots and axe policy, and any release.
