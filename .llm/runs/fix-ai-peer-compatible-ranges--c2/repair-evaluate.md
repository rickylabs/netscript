# IMPL-EVAL — PR #2087 lock repair (issue #2036)

- **Verdict:** `PASS`
- **Exact HEAD at evaluation:** `da9b3a6670d93912fc86662fe8b04dceced57853` — "fix(deps): retain main lock graph while resolving AI family"
- **Baseline:** `a7e3cc6a1ff950a085707ec47d6585413d8cda26` — "chore: refresh lockfiles after main merge"
- **Premerge source reference:** `ddb73f95655970334c9c46b7b6407a8f88531f3b` (previously reviewed premerge source had VERDICT MERGE, but coordinator merge pruned main lock and lost MCP/Zod4 cluster)
- **Evaluator:** Fresh independent session, authorized Google fallback (`Gemini 3.8 Flash (High)`, Google Gemini family); primary evaluator route (`opencode-go/glm-5.3-flash`, max) produced no verdict in bounded three-minute run (`2087-evaluator.log`, `drift.md`). Distinct vendor family and session from generator lane (`gpt-6.1-sol`, OpenAI).
- **Toolchain:** Deno 2.9.5 first on PATH.
- **Reporting constraints:** Public artifacts strictly exclude operator paths, hostnames, IPs, ports, tokens, or session identifiers; raw evidence is cited by filenames.
- **Contract & Scope:** PLAN-EVAL: N/A justified for bounded lock restoration under exact owner preservation contract. Owner requirements strictly honored: new commits only, no force push, no runtime change. No source files, manifests (`deno.json`), or Fresh UI private lock (`packages/fresh-ui/deno.lock`) were altered.

---

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| PLAN-EVAL N/A justification | PASS | Mechanical lock restoration of previously reviewed contracts under strict preservation rules (`plan.md`) |
| Design & Repair Record | PASS | Worklog records native resolution discard, preservation rules, and reconstruction trail (`worklog.md`) |
| Scope boundaries | PASS | Exactly 1 commit on top of baseline; modifies run artifacts and `deno.lock` only; zero source/manifest/private-lock drift |
| Lock hygiene | PASS | No caches or lockfiles deleted; `deno cache --reload` not run; frozen verification throughout |

---

## Semantic Preservation Evidence

Independent verification against `origin/main` lock graph confirms complete preservation of main identities and integrities:

| Metric | origin/main | HEAD (`da9b3a66...`) | Delta / Evaluation |
| --- | --- | --- | --- |
| Lock format version | 5 | 5 | Unchanged |
| Total npm package identities | 570 | 585 | +15 required AI/MCP closure records |
| Missing main npm identities | 0 | 0 | Zero main npm identities lost |
| Changed main npm integrity hashes | 0 | 0 | All 570 main npm records retain exact integrity hashes |
| Missing main JSR identities | 0 | 0 | 63/63 JSR identities retained identically |
| Missing main remote identities | 0 | 0 | 14/14 remote identities retained identically |
| Missing main specifier mappings | 0 | 0 | 190/190 main specifier mappings retained |
| Added root specifier mappings | — | 5 | Exact AI aliases: `npm:@tanstack/ai@0.65.0`, `npm:@tanstack/ai-anthropic@0.19.5`, `npm:@tanstack/ai-mcp@0.8.0`, `npm:@tanstack/ai-openai@0.27.0`, `npm:@tanstack/ai-preact@0.19.5` |
| Workspace members count | 37 | 37 | All 37 workspace members retained |
| Workspace member dependencies | 35 identical | 2 modified | `packages/ai` and `packages/fresh` updated for reviewed AI 0.65 requirements |
| Workspace root dependencies | — | +1 | `jsr:@std/semver@1` declared at root |
| Hono retention | present | present | Fully retained: `hono@4.13.5`, `@hono/node-server@2.1.1_hono@4.13.5` |
| MCP SDK & zod-to-json-schema | Zod 4 | Zod 4 | `@modelcontextprotocol/sdk@1.30.0_zod@4.4.3` and `zod-to-json-schema@3.25.2_zod@4.4.3` remain bound to `zod@4.4.3` |

### Added npm closure records (exactly 15)
1. `@ag-ui/core@1.0.0_zod@4.4.3`
2. `@modelcontextprotocol/client@2.3.1`
3. `@modelcontextprotocol/core@2.3.1`
4. `@modelcontextprotocol/server@2.3.1`
5. `@tanstack/ai-anthropic@0.19.5_@tanstack+ai@0.65.0__@opentelemetry+api@1.9.1__zod@4.4.3_@opentelemetry+api@1.9.1_zod@4.4.3`
6. `@tanstack/ai-client@0.37.0_@opentelemetry+api@1.9.1_zod@4.4.3`
7. `@tanstack/ai-event-client@0.13.1`
8. `@tanstack/ai-mcp@0.8.0_@opentelemetry+api@1.9.1_zod@4.4.3`
9. `@tanstack/ai-openai@0.27.0_@tanstack+ai@0.65.0__@opentelemetry+api@1.9.1__zod@4.4.3_@opentelemetry+api@1.9.1_zod@4.4.3`
10. `@tanstack/ai-preact@0.19.5_@tanstack+ai@0.65.0__@opentelemetry+api@1.9.1__zod@4.4.3_preact@10.29.2_@opentelemetry+api@1.9.1_zod@4.4.3`
11. `@tanstack/ai-utils@0.4.1`
12. `@tanstack/ai@0.65.0_@opentelemetry+api@1.9.1_zod@4.4.3`
13. `@tanstack/openai-base@0.12.4_@tanstack+ai@0.65.0__@opentelemetry+api@1.9.1__zod@4.4.3_@opentelemetry+api@1.9.1_zod@4.4.3`
14. `fast-json-patch@3.1.1`
15. `jose@6.2.12`

### Changes to workspace member metadata
- `packages/ai`: added dependencies `npm:@tanstack/ai@0.65.0`, `npm:@tanstack/ai-anthropic@0.19.5`, `npm:@tanstack/ai-mcp@0.8.0`, `npm:@tanstack/ai-openai@0.27.0`; removed outdated `~0.18.3`, `~0.3.8`, `~0.22.3`, `0.52`.
- `packages/fresh`: added dependencies `npm:@tanstack/ai@0.65.0`, `npm:@tanstack/ai-preact@0.19.5`; removed outdated `~0.14.4`, `0.52`.
- Workspace root: added `jsr:@std/semver@1`.
- All other 35 workspace members are bitwise identical to `origin/main`.

---

## Independently Executed Gates (Evaluator Session)

All four required gates were independently executed in this session on the exact evaluated HEAD with Deno 2.9.5:

| Required Gate | Command | Raw Exit | Observed Output / Evidence |
| --- | --- | --- | --- |
| 1. Root deps check | `deno task deps:check` | `0` | Scans JSR centralization, file links, catalog compliance, and zod alignment; `zod-alignment PASS instances=zod@3.25.76,zod@4.4.3 residual-v3=@olli/kvdex@3.6.7` |
| 2. Live AI peers guard | `deno task deps:check:ai-peers` | `0` | `{"ok":true,"core":["0.65.0"],"lockFree":true}` |
| 3. Frozen install | `deno install --frozen` | `0` | Lockfile strictly verified; zero network additions or graph changes |
| 4. Fresh UI check | `deno task --cwd packages/fresh-ui check` | `0` | 150 files checked with `--lock=deno.lock --frozen`; 0 occurrences / errors |

### Additional Verified Gates & Receipts
- **Frozen Owning Check:** `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-check.ts --root packages/ai --root packages/fresh --ext ts,tsx --deno-arg --frozen` exited `0` (329 files selected across 3 batches, 0 failed batches, 0 occurrences).
- **Frozen Owning Tests:** `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --frozen --unstable-kv packages/ai packages/fresh` exited `0` (452 passed, 0 failed, 0 ignored).
- **Quality Gate:** `deno task quality:gate` (invoking `quality:scan` + `arch:check`) exited `0` (FAIL=0 across all packages; audited in `2087-quality-gate-receipt.json` and `2087-quality-gate.log`).

---

## Contributed Evidence Adjudicated

| Artifact / Receipt | Adjudication |
| --- | --- |
| `2087-preservation.json` | Verified accurate: 570 main identities, 585 final identities, 37 workspace members, 0 missing main entries, 0 changed main integrities, retained Hono. |
| `2087-gate-results.json` | Verified: all 7 gates (`deps-check`, `ai-peers`, `install-frozen`, `fresh-ui-lock`, `owning-check`, `owning-tests`, `quality-gate`) exited `0`. |
| `2087-deps-check.log` | Verified exit `0`, zod alignment clean. |
| `2087-ai-peers.log` | Verified exit `0`, exactly one core (`0.65.0`). |
| `2087-install-frozen.log` / `2087-install-frozen-final.log` | Verified exit `0`. |
| `2087-fresh-ui-lock.log` | Verified exit `0`, 150 files clean. |
| `2087-owning-check.log` | Verified exit `0`, 329 files clean. |
| `2087-owning-tests.log` | Verified exit `0`, 452 passed. |
| `2087-quality-gate-receipt.json` | Immutable gitHead `da9b3a6670d93912fc86662fe8b04dceced57853`, outcome PASS, exitCode `0`. |
| `commit-message.txt` & `pr-comment.md` | Commit message and draft PR phase comment accurately describe the lock repair and preservation boundaries. |

---

## Documentation Debt & Architecture Fitness

- **Doc Debt:** Because no source files or documentation were modified in this lock repair, existing accepted documentation debt (`ai-doc-private-ref-baseline-2036` and `fresh-doc-baseline-2036` in `arch-debt.md`) remains unchanged and accepted as previously adjudicated.
- **Architecture & Fitness:** Quality gate and doctrine fitness are verified green. AP-2/AP-5 clear; no `any`/casting or new lint suppressions introduced.

---

## Owner Work Retained (Explicit Boundaries)

1. **Final CI:** Merging requires final green CI run on PR #2087 head as the owner gate.
2. **Issue Linkage:** `Refs #2036` retained (no closing keyword until coordinated published release is qualified).
3. **No Publication / Merge:** This evaluation strictly assesses the exact head lock repair; no merge, release cut, or publication is authorized or performed by this session.

---

## Final Verdict

**`PASS`** — for exact head **`da9b3a6670d93912fc86662fe8b04dceced57853`**.

The semantic diff vs `origin/main` is verified: all 570 main npm identities, 63 JSR identities, 14 remote identities, 190 specifier mappings, and 37 workspace members are preserved with zero integrity alterations; exactly 15 AI/MCP closure records and 5 aliases are added; Hono and Zod 4 bindings for MCP SDK and zod-to-json-schema remain intact; zero source, manifest, or Fresh UI private lock changes exist; and all four required gates (`deps:check`, `deps:check:ai-peers`, `deno install --frozen`, and Fresh UI `check`) alongside owning check, owning tests, and the quality gate pass with raw exit code `0`.
