# Delta Receipt — #1462 / PR #1758

| Field | Value |
| --- | --- |
| Head under receipt | `f1ff5557` (supervisor Tier-A re-sign-off at `8ff04903`) |
| Previously evaluated head | `83b7109c` — IMPL-EVAL cycle 1 `PASS_IMPL` (`256cb1c3`) |
| Current `main` | `952cc106` (#1748) |
| Delta evaluated | `83b7109c..f1ff5557` — 143 files, two `main` integrations + regenerated assets |
| Evaluator | fresh Claude Fable 5 session (opposite-family to the Codex `gpt-5.6-sol` author), branch `eval/delta-receipt-1462`, worktree `007-delta-1462` |
| Scope | bounded delta receipt only — the `PASS_IMPL` verdict is not re-evaluated |

## Checks

### 1. Product identity — PASS

- `git diff --name-only 83b7109c..f1ff5557 -- packages plugins | grep -v '.generated.'` → **none**.
- `git diff 83b7109c..f1ff5557 -- <p> | wc -c` → `packages/sdk/src` 0, `packages/sdk/mod.ts` 0,
  `packages/sdk/deno.json` 0, `packages/fresh/src` 0.
- Exactly two `packages/` files changed in the delta:
  `packages/cli/src/kernel/assets/agent-docs.generated.ts` (13 lines) and
  `packages/mcp/src/publish-assets.generated.ts` (8 lines).
- Stronger form: the leaf's non-generated `packages/`+`plugins/` patch is **identical** before and
  after integration — `git diff $(merge-base 83b7109c f8b4f804)=13878a80 83b7109c` vs
  `git diff 952cc106 f1ff5557`, both restricted to `':!*.generated.ts'`, hunk bodies compared with
  `diff` → no difference.

### 2. Merge, not rebase — PASS

- `git merge-base --is-ancestor <c> f1ff5557` → yes for `ddf66a6f`, `1dd64dae`, `bfad0c15`,
  `83b7109c`, and for both integrated main heads `f8b4f804`, `952cc106`.
- Merge commits in range: `d1f8afe9` (parents `72ab6411` + `f8b4f804`) and `8ff04903` (parents
  `cea45edd` + `952cc106`). Both merges carry their regeneration in the same commit
  (`publish-assets.generated.ts`, `.llm/assets/agent-docs/*`) — integration + regen, no source.
- `f1ff5557` itself touches only the run `worklog.md` (+59).

### 3. Generated files are genuinely generated — PASS

- `deno task check:assets-barrel` (runs `gen:assets-barrel` then `git diff --exit-code` over the
  seven barrel outputs) → exit 0; `git status --porcelain` empty afterwards.
- `deno task check:publish-assets` → exit 0. Additionally forced `deno task gen:publish-assets`
  (write mode) → `git status --porcelain` empty, i.e. byte-identical regeneration.
- Delta content of the two files is exclusively provenance/bytes/sha256/compressed payload plus the
  new `'./presets'` export entry; no hand-written hunks.
- Observation (cosmetic, not a finding): both files record `sourceCommit: cea45edd0`, the first
  parent of merge `8ff04903` — the generator ran inside the merge before the merge commit existed.
  `--check` compares content and passes at `f1ff5557`.

### 4. Cascade complete and green at this head — PASS

Run sequentially at `f1ff5557` (log: job tmp `gates.log`); worktree clean after all five:

| Task | Exit | Evidence |
| --- | --- | --- |
| `check:assets-barrel` | 0 | regen + `git diff --exit-code` clean |
| `check:publish-assets` | 0 | `--check` mode |
| `check:mcp-export-corpus` | 0 | 35 packages / 271 subpaths / 7668 symbols, sha `76b5d30e…` |
| `docs:exports-drift` | 0 | `Exports & Symbols drift check: PASS` |
| `check:agent-docs-prose` | 0 | Lume build 639 files; `{"fresh":true,"stalePaths":[]}`; rendered-output OK |

`check:assets-barrel` provenance: absent from `plan.md` at `83b7109c` (0 mentions); added as gate
19 by `cea45edd docs(harness): add assets barrel refresh gate`; red before the refresh because
`agent-docs.generated.ts` at `83b7109c` lacked the SDK's new `./presets` subpath (3 `'./presets'`
occurrences → 4 at head, the added line being the `EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS` entry).
`packages/sdk/deno.json:15` exports `"./presets": "./src/presets/mod.ts"`, so the entry is
legitimate and derived, not injected.

### 5. Conclusion still holds after integration — PASS

`deno info --json --no-lock <mod>` at `f1ff5557`, scanning every module specifier and every
code/type dependency specifier for `/packages/kv/`, `jsr:@netscript/kv`, `^node:`,
`/packages/logger/`:

- `packages/sdk/mod.ts` → 89 modules, **0** browser-unsafe edges.
- `packages/sdk/src/presets/mod.ts` → 75 modules, **0** browser-unsafe edges.

### 6. Nothing from #1748 reverted — PASS

- Leaf-edited `docs/site` files: `reference/sdk/index.md`, `services-sdk/sdk.md`,
  `web-layer/query-bridge.md`, `web-layer/server.md`. `git diff --name-only 952cc106 f1ff5557 --
  docs/site` → exactly those four; every other `docs/site` file equals `main`.
- `.NET Aspire` residue in those four files at head: none. Residue elsewhere in `docs/site` is
  confined to `docs/site/_plan/**` and is per-file identical between `952cc106` and `f1ff5557`
  (it is main's own state, not a revert).
- Cache-provider migration prose: all 66 non-blank lines the leaf added to `docs/site`
  (`git diff 13878a80 83b7109c -- docs/site`, `+` lines) are present verbatim at `f1ff5557`
  (`git grep -F` per line, 0 missing); all four files still mention cache-provider.

### 7. `deno.lock` — PASS

`cmp <(git show 952cc106:deno.lock) deno.lock` → identical; `git diff --stat 952cc106 f1ff5557 --
deno.lock` → empty.

## Not run (by boundary)

`e2e:cli`, Aspire, Docker, browser gates; no runtime lease requested. No PR/issue mutation.

## Verdict

**`MECHANICAL_PASS`** — the delta `83b7109c..f1ff5557` is two `main` merges plus regeneration of
the two derived asset files; the non-generated product patch, the evidence-chain ancestry, the
0-unsafe-edge conclusion, the #1748 wording, the leaf's docs prose, and `deno.lock` are all
undisturbed, and the full cascade (now including `check:assets-barrel`) is green at this head.
