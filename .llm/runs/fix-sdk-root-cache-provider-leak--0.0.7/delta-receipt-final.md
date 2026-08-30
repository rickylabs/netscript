# Delta receipt (final) — #1462 / PR #1758

| Field | Value |
| --- | --- |
| Head under receipt | `1c5fa004` (`chore(harness): supervisor Tier-A final sign-off at b322bf04`) |
| Previously IMPL-EVAL'd head | `83b7109c` (`PASS_IMPL`, recorded at `256cb1c3` on `eval/impl-eval-1462-cycle-1`) |
| `main` at receipt time | `a5520e70` (`origin/main`, fetched 2026-08-30) |
| Evaluator | Claude Fable 5, fresh session, opposite-family to the Codex `gpt-5.6-sol` author; separate from supervisor and prior evaluators |
| Evaluator branch | `eval/delta-receipt-1462-final` |
| Scope | Bounded delta `83b7109c..1c5fa004`. The `PASS_IMPL` is not re-evaluated. |
| Supersedes | The prior `MECHANICAL_PASS` at `f1ff5557` — not cited as evidence here. |

## Verdict

**`MECHANICAL_PASS`**

The delta is three `main` merges, a regenerated shared-asset cascade, harness artifacts, and one
product line (`'./presets'` appended to `NETSCRIPT_WEB_RUNTIME_EXPORTS['@netscript/sdk']`). The
product line is a manifest-parity entry, not a behavioural change; nothing the `PASS_IMPL` relied
on (SDK/Fresh source, browser-safe edge count, docs prose) is disturbed. A fresh IMPL-EVAL cycle
is **not** required — reasoning in §2/§4 below.

## Checks

### 1. Product identity — the one product line is the ONLY non-generated product change

Command:

```
git diff --name-status 83b7109c 1c5fa004 -- packages plugins
```

Result — exactly three files:

```
M  packages/cli/src/kernel/assets/agent-docs.generated.ts          (generated)
M  packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure.ts
M  packages/mcp/src/publish-assets.generated.ts                    (generated)
```

`git diff 83b7109c 1c5fa004 -- packages/sdk/src packages/sdk/mod.ts packages/sdk/deno.json packages/fresh/src | wc -c` → `0` (empty diff).

The only non-generated product hunk (`git diff 83b7109c 1c5fa004 -- …/netscript-web-runtime-closure.ts`):

```
     './ports',
+    './presets',
     './query',
```

Introduced by `b322bf04 fix(cli): include sdk presets in runtime closure`, which touches that one
source line plus three run-dir artifacts (`context-pack.md`, `drift.md`, `worklog.md`).
**Enumerated: one line, one file. Confirmed.**

### 2. Semantic fit of `./presets` in the closure constant

The module comment frames `NETSCRIPT_WEB_RUNTIME_EXPORTS` as "the generated Fresh/SDK package
identities that must share one release", and the exclusion of `@netscript/fresh-ui` is a
**package-level** exclusion justified by fresh-ui importing no cache/query modules. The constant is
therefore *every subpath of every package inside the closure*, pinned so `assertCoherentNetScriptWebRuntimeImports`
can refuse a mixed-version/mixed-source import map — it is not a list of "subpaths that instantiate
a provider". The parity test (`closure export lists stay in parity with Fresh and SDK manifests`)
encodes precisely that reading.

Does `./presets` belong by that rule? Yes, on two grounds:

- It is a subpath of `@netscript/sdk`, a package already inside the closure, so manifest parity
  requires it regardless.
- Substantively: `packages/sdk/src/presets/define-services.ts` imports
  `../client/service-client.ts`, `../query/query-factory.ts`, and
  `../query-client/create-service-query-utils.ts` — the same query/query-client graph that
  `./query` and `./query-client` (already in the closure) expose. A second SDK identity reached via
  `./presets` could resolve query-client code at a different version than the app's `./query`
  identity, which is exactly the duplicate-singleton hazard the closure exists to prevent.

This is consistent with, not in tension with, the leaf's claim: the leaf claims `./presets` is
**load-time pure** and does not *instantiate* a cache provider (verified in §5 — 0 browser-unsafe
edges). The closure asks a different question — whether the subpath *participates in the
version-coherent graph* — and `./presets` does. **Semantically right, not merely green.**

### 3. Order parity

`Object.keys(sdk.exports)` from `packages/sdk/deno.json` at head:

```
[".","./auto-update","./desktop","./cache","./client","./collections","./discovery","./ports","./presets","./query","./query-client","./streams","./telemetry"]
```

The constant's `@netscript/sdk` array is the same 13 entries in the same sequence. Verified by the
order-sensitive `assertEquals` in
`packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure_test.ts:87`:

```
deno test --allow-all --no-lock packages/cli/src/kernel/domain/dependency-closures/
→ ok | 6 passed | 0 failed
```

### 4. Does `PASS_IMPL` still hold?

Yes. The `PASS_IMPL` evaluated (a) the SDK root/presets browser-safety conclusion, (b) the
`@netscript/sdk` public surface, and (c) the docs prose. Since `83b7109c`:

- (a) unchanged — `packages/sdk/**` empty diff; edge count still 0 (§5).
- (b) unchanged — `packages/sdk/deno.json` empty diff; `./presets` already existed at `83b7109c`.
- (c) leaf prose intact and upstream prose intact (§6).

The one product line lives in the CLI's init-time closure verifier and only widens the set of
specifiers it pins; it adds no runtime path, no new import, and no new public API. It is the kind
of parity follow-up a full suite legitimately forces and does not reach into anything the verdict
was built on. No fresh IMPL-EVAL cycle is warranted.

### 5. Browser-unsafe edges (the leaf's conclusion after integration)

Command (per entry): `deno info --json --no-lock <entry>` → count module specifiers matching
`/packages/kv/`, `jsr:@netscript/kv`, `^node:`, `/packages/logger/`.

```
packages/sdk/mod.ts             -> 0 []
packages/sdk/src/presets/mod.ts -> 0 []
```

### 6. Merge history and evidence chain (no rebase)

`git merge-base --is-ancestor <sha> 1c5fa004` for each:

| SHA | Role | Ancestor of head |
| --- | --- | --- |
| `ddf66a6f` | evidence chain | yes |
| `1dd64dae` | evidence chain | yes |
| `bfad0c15` | evidence chain | yes |
| `83b7109c` | IMPL-EVAL'd head | yes |
| `f1ff5557` | prior receipt head | yes |
| `f8b4f804` | main integration 1 (#1746) | yes |
| `952cc106` | main integration 2 (#1748) | yes |
| `a5520e70` | main integration 3 (#1755), current `main` | yes |

`git log --merges --format='%h %p %s' 83b7109c..1c5fa004` shows three true merge commits, each
with the branch as first parent and a `main` commit as second parent:

```
70d82c37 f1ff5557 a5520e70  chore(sdk): refresh assets after quickstart merge
8ff04903 cea45edd 952cc106  chore(sdk): refresh assets after corpus merge
d1f8afe9 72ab6411 f8b4f804  chore(sdk): refresh generated assets after main merge
```

(`256cb1c3` is on the `eval/impl-eval-1462-cycle-1` branch and is correctly *not* an ancestor.)

### 7. Generated files are genuinely generated

- `deno task check:assets-barrel` → exit 0 (runs `gen:assets-barrel`, then
  `git diff --exit-code` over the barrel set including `agent-docs.generated.ts`). Tree clean after
  regeneration (`git status --porcelain` empty).
- `deno task check:publish-assets` → exit 0 (regenerates `publish-assets.generated.ts` in `--check`
  mode).
- `check:assets-barrel` was absent from the plan's gate table; it passes at this head, and the
  regenerated `agent-docs.generated.ts` legitimately carries the leaf's `./presets` prose
  (`grep -c presets` → 4 hits).

### 8. Cascade gates at head

| Gate | Command | Result |
| --- | --- | --- |
| assets barrel | `deno task check:assets-barrel` | exit 0 |
| publish assets | `deno task check:publish-assets` | exit 0 |
| MCP export corpus | `deno task check:mcp-export-corpus` | exit 0 (35 packages, 271 subpaths, 7668 symbols) |
| exports drift | `deno task docs:exports-drift` | `Exports & Symbols drift check: PASS`, exit 0 |
| agent docs prose | `deno task check:agent-docs-prose` | exit 0 — `{"fresh":true,"stalePaths":[]}`; rendered output OK (227 HTML files) |

### 9. Full repository suite

```
deno task test
→ {"exitCode":0,"summary":{"passed":4261,"failed":0,"ignored":19,"totalResults":4280,"uniqueFailures":0}}
```

Reproduces the supervisor's 4261 / 0 / 19 exactly. (A narrower `deno test packages/` run also
passed: 2395 passed / 0 failed / 6 ignored.)

### 10. Upstream prose survives — #1748 and #1755 not reverted

For every file changed by `952cc106` (#1748) and by `a5520e70` (#1755):
`git diff --quiet a5520e70 1c5fa004 -- <file>`.

- Every hand-authored file (all `docs/site/**` pages, `.llm/runs/docs-quickstart-skills-tree--1749/*`,
  `docs/site/quickstart.vto`) is **byte-identical to `main`** at head.
- The only files that differ are the four regenerated shared assets
  (`.llm/assets/agent-docs/prose.json.gz`, `.llm/assets/agent-docs/provenance.json`,
  `agent-docs.generated.ts`, `publish-assets.generated.ts`) — expected, since they now also embed
  the leaf's prose, and §7/§8 prove they regenerate cleanly.
- `.NET Aspire` residue count in `docs/site`: head 18, `main` 18 — identical, so #1748's
  normalisation was neither extended nor reverted.

Leaf prose survives too: `git diff --stat a5520e70 1c5fa004 -- docs/site` is exactly the four
leaf-owned pages (`reference/sdk/index.md`, `services-sdk/sdk.md`, `web-layer/query-bridge.md`,
`web-layer/server.md`), and the cache-provider migration / `./presets` prose is present in them.

### 11. `deno.lock`

`git diff --stat a5520e70 1c5fa004 -- deno.lock | wc -c` → `0`. Byte-unchanged vs `main`.

## Not reproduced / out of scope

- `e2e:cli`, Aspire, Docker, and browser gates were not run (forbidden for this receipt).
- No PR state, labels, draft flag, or acceptance boxes were touched.

## Boundaries honoured

Read-only over source; this file is the only change on `eval/delta-receipt-1462-final`. No thread
ids, rollout paths, or daemon handles recorded.
