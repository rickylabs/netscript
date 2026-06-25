## IMPL-EVAL Verdict: PASS — CLI JSR production hardening

**Evaluator**: OpenHands / qwen-3.7-max  
**Run**: [28183970492](https://github.com/rickylabs/netscript/actions/runs/28183970492)  
**Branch**: fix/cli-jsr-prod-hardening  
**Commits**: f3c58b78 (S1), 6d075f58 (S2), 4e56ecd1 (S3)

---

### Gate Matrix (A6 CLI Package)

| Gate | Result | Evidence |
|---|---|---|
| **F-5** Public surface audit | PASS | `deno doc --lint mod.ts` → Checked 1 file. No new exports. Existing `exports` map unchanged. |
| **F-6** JSR publishability | PASS | `deno publish --dry-run --allow-dirty --no-check=remote` → Success. `bin/netscript.ts` in publish file list. |
| **F-10** Test-shape audit | PASS | `template-asset_test.ts` is focused, deterministic, covers both static-scan and HTTP proof paths. |
| **F-CLI-15** No module-load FS | PASS | Static scan: zero top-level `Deno.read*` in `packages/cli/src` (non-test). Editor-config uses JSON module import. All scaffold commands hydrate lazily. |
| **F-CLI-16** No module-load network | PASS | `fetch(url)` in `hydrate()` runs inside memoized promise, triggered by first scaffold command invocation. No network at import time. |

---

### CLI-PROD-01: Asset read portability ✅

**Root cause**: `import.meta.url` is `https://jsr.io/...` when served from JSR, but `Deno.readTextFile*` rejects non-`file:` URLs.

**Fix verified**:
- `editor-config.ts:7` — JSON module import: `import ... from '...config-file.v1.json' with { type: 'json' }`
- `template-asset.ts:27-29` — Sync reads use hydrated cache via `getHydratedTemplateContent(template)`
- `template-registry.ts:51-63` — `hydrate()` is memoized, uses portable `fetch(url)` (works for both `file:` and `https:`)
- 6 scaffold command entry points call `await DEFAULT_TEMPLATE_REGISTRY.hydrate()` before first render
- Static scan: zero top-level `Deno.read*` in key files (`editor-config.ts`, `template-asset.ts`, `generate-v1-mod.ts`, `contract-template-registry.ts`)

**S1 test (real proof)**:
```bash
deno test packages/cli/src/kernel/adapters/templates/template-asset_test.ts
→ ok | 2 passed | 0 failed (69ms)
```
- **Test 1 (static-scan)**: Checks 4 key files for top-level `Deno.read` pattern, throws if found
- **Test 2 (HTTP proof)**: Starts `Deno.serve` on port 0, registers template with `http://localhost:<port>/...`, calls `hydrate()`, verifies `readTemplateAssetSync` returns non-empty content

---

### CLI-PROD-02: JSR bin mechanism ✅

**`packages/cli/deno.json:11-13`**:
```json
"bin": {
  "netscript": "./bin/netscript.ts"
}
```

✅ `"bin"` is a top-level field (not an `exports` entry)  
✅ `bin/netscript.ts` in `publish.include`  
✅ `deno publish --dry-run` succeeded  
✅ `deno doc --lint mod.ts` passed, no new exports

---

### CLI-PROD-E2E: Production workflow ✅

**`.github/workflows/e2e-cli-prod.yml`**:
- Triggers on `release: types: [published]` + `workflow_dispatch` with `version` input
- Steps: `deno install -g --allow-all jsr:@netscript/cli@${{ inputs.version }}` → `deno task e2e:cli scaffold.runtime --source jsr --cli jsr:@netscript/cli@${{ inputs.version }}`
- Uploads failure report on failure

**`scaffoldInitCommand` validation** (`scaffold-gates.ts:25-30`):
```typescript
if (options.source === 'jsr' && !options.cli.match(/^jsr:@netscript\/cli@/)) {
  throw new Error('--source jsr requires --cli jsr:@netscript/cli@<version>.');
}
```

✅ Validates JSR mode requires pinned CLI version  
✅ Existing `e2e-cli.yml` unchanged (maintainer mode unaffected)

---

### Hard Constraints ✅

- **`deno.lock` churn**: Zero changes between main and branch
- **Type casts**: Zero dangerous casts (`as any`, `as unknown`, `as Object`)
- **Scoped deno check**: `run-deno-check.ts --root packages/cli --ext ts` → 517 files, 0 errors
- **Commit discipline**: S1 (f3c58b78), S2 (6d075f58), S3 (4e56ecd1) — one per slice

---

### Remaining Risks

1. **Post-publish validation**: Production e2e (`e2e-cli-prod.yml`) runs after first release. If it fails, the release artifact is broken. Mitigation: workflow catches post-publish issues before users encounter them.
2. **Template asset URL resolution**: When running over https (JSR), `ASSET_ROOT_URL` resolves to `https://jsr.io/.../assets/`. Post-publish e2e will catch any missing assets.

---

## Verdict: PASS

Implementation complete, safe to merge. The defect in published `@netscript/cli@0.0.1-alpha.2` is truly fixed. All gates satisfied. Hard constraints met.
