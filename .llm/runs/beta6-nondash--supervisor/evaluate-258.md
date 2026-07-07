# IMPL-EVAL: FB5 render_ui generative-UI renderer (issue #258)

**Branch:** `feat/258-fresh-ui-genui-renderer`
**Base:** `b5d09693`
**Slice commits:** `92465bfa` (renderer) + `fe05c814` (depth-guard fix)
**Evaluator role:** IMPL-EVAL (independent re-attack)

---

## Decisive Checks

### 1. Security — Depth Guard (ADVERSARIAL) ✅ PASS

**File:** `packages/fresh-ui/src/ai/render-ui.tsx`
**Constant:** `RENDER_UI_MAX_DEPTH = 6` (line 13)

**All recursive descent paths verified:**

| Descent Path                  | Depth Increment | Line |
|-------------------------------|----------------:|-----:|
| `renderChildren` → `renderNode` children | `depth + 1` | 344 |
| `renderDataBlock` list items  | `depth + 1`     | 290 |
| `renderNode` **array branch** | `depth + 1`     | **163 (A1 fix)** |
| Object branch → `renderBlock` | same depth      | 174 (guarded at 184) |

**Adversarial payload trace (50 array nestings):**
- `renderBlock` depth=0 → `renderChildren` → `renderNode` depth=1
- Array branch fires 6×: depth 1→2→3→4→5→6→7
- At depth=7 > maxDepth=6 → `renderFallback('max-depth')` ✅ **Bounded**
- **No descent path can recurse without incrementing depth.**

### 2. Security — Whitelist / XSS ✅ PASS

- `BLOCK_TYPES` hardcoded set: `stack, grid, section, chart, metric, table, list, card`
- Unknown types → `renderFallback('unknown-type')` (static div, no raw markup)
- **No `dangerouslySetInnerHTML`, no `__html`, no raw markup path**
- All user strings rendered as JSX text children (auto-escaped by Preact)
- Test 4 confirms `<script>alert("owned")</script><img src=x onerror=alert(1)>` NOT in output.

### 3. Contract Seam ✅ PASS

- **Line 7:** `import type { RenderUiToolInput } from '@netscript/ai/tools'` ✅
- Registry manifest has `render-ui` in `'ai'` collection ✅
- `registry.generated.ts` includes `RenderUiSurface` ✅

### 4. Tests + Gates + Hygiene ✅ PASS

| Gate                          | Result                                      |
|-------------------------------|---------------------------------------------|
| `deno test` (4 cases)         | ✅ 4 passed / 0 failed                      |
| `run-deno-doc-lint` (renderer)| ✅ totalErrors=0 for touched exports         |
| `deno publish --dry-run`      | ✅ exit 0, no `--allow-slow-types`          |
| `deno task arch:check`        | ✅ exit 0, warnings only, no FAIL           |
| `git diff deno.lock`          | ✅ empty (no lock churn)                    |
| `as` casts                    | ✅ 0 casts (well under 2-accepted budget)   |

### 5. Optional: Pre-fix Array Branch Regression Confirmed ✅ PASS

| Commit   | Array Branch Code                | Depth Guard? |
|----------|----------------------------------|-------------:|
| `92465bfa` (pre-fix) | `renderNode(child, depth, context)` | ❌ **Bypass** (same depth) |
| `fe05c814` (fix)     | `renderNode(child, depth + 1, context)` | ✅ Incremented |

The fix correctly increments depth on array descent, closing the bypass.

---

## PR Body Close-Gate Compliance

- ✅ `Closes #258` in body (closing keyword present)
- ✅ `gate:jsr` label present (doc-lint + publish dry-run evidence provided)
- ✅ `gate:e2e` **intentionally unchecked** (deferred to #564, noted in drift)
- ✅ Labels correct: `status:impl`, `wave:v1`, `area:fresh-ui`, `type:feat`, `epic:ai-stack`, `priority:p1`
- ✅ Milestone: `0.0.1-beta.6`

---

## Verdict

All decisive checks pass. The renderer is a robust security boundary:

1. **Depth guard is complete** — all three recursive paths increment depth.
2. **Whitelist is closed** — no arbitrary element creation, no raw HTML path.
3. **Contract seam is clean** — consumes E4 input, extends existing registry.
4. **Gates are green** — tests, doc-lint, publish, architecture, lock hygiene.
5. **A1 fix verified** — pre-fix bypass confirmed, post-fix guard confirmed.

OPENHANDS_VERDICT: PASS
