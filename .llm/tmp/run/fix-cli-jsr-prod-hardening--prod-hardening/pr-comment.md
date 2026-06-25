## PLAN-EVAL verdict — `fix(cli): JSR production hardening` — FAIL_PLAN

> Evaluator: OpenHands minimax-m3 (OpenRouter) · run-28178494214-1 · separate session.
> Walked `.llm/harness/gates/plan-gate.md` (8 items) + A6 F-CLI-1..F-CLI-31 gates against
> `research.md` and `plan.md` on branch `fix/cli-jsr-prod-hardening`.
> Hard gate — no implementation may begin until verdict is `PASS` or user waives in writing.

**Verdict: `FAIL_PLAN`** (6/8 PASS, 2 FAIL — 5 required fixes)

### Why this fails the gate

The plan correctly identifies the chokepoint (`template-asset.ts` + `editor-config.ts` + contract templates), correctly orders slices (S1 unblocks → S2/S3 land), correctly flags the three risks (`fetch` permissions, sync→async migration, CI can't prove the https path), and correctly scopes "out of scope" (runtime-path FS reads in the user's generated project). The research is current and re-baselined against `main` @ `c0020a1b` + #126.

**The plan-gate fails because three decisions are unresolved at the level that forces a rewrite when discovered during slicing** (per `gates/plan-gate.md` §Open-decision sweep: *"If any open decision would force rework when deferred → `FAIL_PLAN`"*):

### Required fixes (cycle 1)

1. **D1 — Resolve hydration timing.** `TemplateRegistry.load()` currently only enumerates entries — no caller hydrates `content` today. The fix relies on a cache that nobody populates. Decide and document in `plan.md` §Locked Decisions D1: bootstrap site is either (a) `mod.ts` `await registry.load()` on import (Deno 2 supports top-level await) or (b) `createPublicCli` hydrates lazily on first command. Pick one; this shapes S1's design.

2. **D1 — Resolve sync→async strategy.** Plan lists 42 sync callers but defers the decision. `generateV1Mod()` (`packages/cli/src/kernel/adapters/contracts/templates/generate-v1-mod.ts:34,64`) is a sync function that reads a URL **not in `TemplateRegistry`** — the hydration-cache strategy cannot cover it. Either (a) convert all 42 sync callers to async, OR (b) keep sync via hydration cache AND migrate the call sites not on the registry path (`generateV1Mod` + the four generate*Config functions named in the research table). Document the chosen strategy and the migration list in `plan.md` §Slices S1.

3. **D2 — Use the correct JSR bin mechanism.** The example `"./bin": "./bin/netscript.ts"` is an `exports` entry, not a JSR bin field. JSR publishes a `deno.json` `"bin"` map for `deno install -g`. Replace with `"bin": { "netscript": "./bin/netscript.ts" }` in `packages/cli/deno.json`. Note: `mod.ts` is already runnable via `if (import.meta.main)`, so `deno run -A jsr:@netscript/cli` resolves today once D1 lands — the `bin` field is for `deno install -g jsr:@netscript/cli`. (Optional: also add `"./bin": "./bin/netscript.ts"` to exports for `deno run -A jsr:@netscript/cli/bin/netscript.ts`, but it is not the primary mechanism.)

4. **D1 — Commit to JSON module import for `editor-config.ts`.** Pick `import schema from '...json' with { type: 'json' }` and remove the "fetch is acceptable alternative" hedge — that's a strategy switch, not a fallback. JSON module import works file:+https: with no `--allow-net` for that asset.

5. **D3 — Enumerate `packageSource` plumbing in slice S3.** Plan says "wire the existing `packageSource` axis" but verification shows the field is **only ever defaulted to `PACKAGE_SOURCE.LOCAL`** (`create-default-runner.ts:57`, `suite-builder-options.ts:23`) and never read in any gate. Slice S3 must enumerate: (a) runner reads `packageSource` flag from `RunOptions`; (b) public init path (`importMode:'jsr'`) replaces maintainer init when `packageSource === 'jsr'`; (c) `PACKAGE_SOURCE.JSR` is threaded into the scaffolded project's `deno.json`; (d) `e2e-cli-prod.yml` installs via `deno install -g jsr:@netscript/cli@<v>` and invokes the CLI from PATH. Name the files each sub-step touches.

### Bonus recommendation (not gating)

6. **S1 — Commit to a concrete in-CI verification.** Replace "use a local file-server or the module-graph import approach" with a unit test in `packages/cli/src/kernel/adapters/templates/template-asset.test.ts` that (a) asserts `editor-config.ts` source has no top-level `Deno.read*` (regex/AST) and (b) calls `readTemplateAsset` against a URL with scheme `https:` pointing to a local file-server and asserts the body. The prod-e2e Action (D3) remains the real https proof.

### What passes the gate

| Plan-Gate item                            | Result | Notes |
| ----------------------------------------- | ------ | ----- |
| Research present and current              | PASS   | Rebaselined against `main` @ `c0020a1b` + #126 |
| Commit slices (<30, gate + files each)    | PASS   | 3 slices << 30; S1 names files + what-it-proves |
| Risk register                             | PASS   | 3 risks with mitigations |
| Gate set selected                         | PASS   | A6 F-CLI-1..F-CLI-31 + universal F-1..F-18 |
| Deferred scope explicit                   | PASS   | "Out of scope" runtime-path reads enumerated |
| jsr-audit surface scan (pkg/plugin)       | PASS   | `publish.include` ships assets + bin field to add |

### What fails the gate

| Plan-Gate item                            | Result | Reason |
| ----------------------------------------- | ------ | ------ |
| Decisions locked                          | FAIL   | D1 hydration timing + D2 JSR bin mechanism unresolved |
| Open-decision sweep                       | FAIL   | 42 sync callers + `packageSource` plumbing not enumerated — would force rework |

### Cycle policy

Per `gates/plan-gate.md` §Verdict: two `FAIL_PLAN` cycles then escalate. **This is cycle 1.**

### Artifacts

- Plan-Gate checklist + verdict: `.llm/tmp/run/fix-cli-jsr-prod-hardening--prod-hardening/plan-eval.md`
- Inputs reviewed: `research.md`, `plan.md`, the 5 named read sites, `deno.json` exports/bin, `packageSource` plumbing at the two runner defaults

This verdict was authored by an AI agent (OpenHands) on behalf of the supervisor.