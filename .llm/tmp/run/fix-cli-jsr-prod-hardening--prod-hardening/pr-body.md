## Why

A prod smoke test of the **published** `@netscript/cli@0.0.1-alpha.2` (pulled from JSR, not local source) found the CLI is **unusable from JSR**. Two production-only blockers, both invisible to the maintainer/local `scaffold.runtime` e2e (which loads modules from `file://` where the broken reads succeed):

- **CLI-PROD-01** — `Deno.readTextFile(new URL(..., import.meta.url))` throws `TypeError: Must be a file URL` when the module loads over `https://jsr.io/...`. `editor-config.ts:16` does this at **module top-level**, so it crashes *any* consumption (the bin and `createPublicCli()`). The core scaffold template loader (`template-registry.ts` + `template-asset.ts`) and contract templates have the same defect.
  ```
  error: Uncaught (in promise) TypeError: Must be a file URL
    at https://jsr.io/@netscript/cli/0.0.1-alpha.2/src/kernel/adapters/scaffold/editor-config.ts:16:41
  ```
- **CLI-PROD-02** — no runnable bin export: `exports` are only `.`, `./scaffolding`, `./testing`; `deno run jsr:@netscript/cli/bin/netscript.ts` → "Unknown export".

Plus **CLI-PROD-E2E**: the e2e never loads a module over https, so it cannot catch either.

## What (one prod-hardening PR — 3 slices)

1. **Portable asset loader** — fix the single chokepoint (`template-asset.ts` + registry) to load shipped assets via a `file:`/`https:`-portable mechanism (`fetch`/JSON-module import); de-top-level `editor-config.ts`; route contract templates through it. (80+ `.template` assets → fix the loader, not each asset.)
2. **Runnable bin export** from JSR (lands the dx-bin approach, #110).
3. **Production e2e Action** `on: release: published` that scaffolds from published JSR and runs the full runtime demo (aspire restore → plugins → db init/generate/seed → start → health endpoints → traces) + notify-on-fail. CI PR validation stays maintainer mode.

## Status

**Draft — PLAN-EVAL gate (OpenHands minimax-M3) pending.** No implementation until PASS. Run artifacts: `.llm/tmp/run/fix-cli-jsr-prod-hardening--prod-hardening/{research,plan}.md`. Framework source slices implemented by WSL Codex (daemon-attached).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
