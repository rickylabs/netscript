# Evaluation Summary: PR #72 — fix(docs): restore api-table cell contrast + preserve tabbed-code formatting

## Verdict: **PASS**

Branch `fix/docs-render-table-code` (base `origin/docs/user-site`) — merge-ready.

---

## Commits evaluated

- `17682183` fix(docs): restore api table cell contrast
- `6db4096e` fix(docs): preserve tabbed code formatting

## Changed files (diff scope: `docs/site/**` only)

| File | Insertions | Deletions |
|------|-----------|-----------|
| `docs/site/_components/tabbedCode.vto` | 24 | 8 |
| `docs/site/styles/docs.css` | 29 | 0 |

**Scope compliance:** ✅ No `packages/`, `plugins/`, `deno.lock`, or unrelated churn. Two files, both under `docs/site/`.

## Gate 1: Build — ✅ PASS

`deno task build` (from `docs/site`): 142 files generated, exit 0, no errors.

## Gate 2: api-table cell contrast — ✅ PASS

### Built HTML

`_site/capabilities/background-jobs/index.html` contains real `<code>` elements inside `<td>` cells:
```html
<td class="ns-api-table__name"><code>GET /health</code></td>
<td class="ns-api-table__type"><code>liveness</code></td>
<td class="ns-api-table__desc">Health probe for the workers API service.</td>
```

Content is **present and legible** — the fix adds contrast, it doesn't hide or remove anything.

### Built CSS

Two rule sets in `_site/styles/docs.css`:

**Dark mode** (tokens resolve to ~88% gray text on ~18% gray bg):
- `.ns-prose .ns-api-table__name code, .ns-prose .ns-api-table__type code` → `color: var(--ns-gray-1)` (#fcfaf6) on `color-mix(surface-raised 88%, primary-subtle)` (~#1b1916)
- `.ns-prose .ns-api-table__type code` → `color: var(--ns-teal-2)` (#94e8e2) — type chips get distinct teal

**Light mode** (`[data-theme="light"]` overrides):
- code chips → `color: var(--ns-gray-12)` (#090806) on `color-mix(surface-raised 82%, primary-subtle)` (#ffffff)
- type code → `color: var(--ns-teal-7)` (#026460)

| Selector | Dark contrast | Light contrast | WCAG AA |
|----------|------|------|---------|
| `name/type code` vs bg | 16.8:1 | 20.0:1 | ✅ (AAA) |
| `type code` (teal) vs bg | 12.4:1 | 7.0:1 | ✅ |
| `desc` (`ns-fg`) vs bg | ~18:1 | ~20:1 | ✅ |

The base `.ns-prose code` rule uses `color: var(--ns-copper-3)` (brownish) which could conflict with the api-table type chip color. The new rules use `.ns-prose .ns-api-table__name code` — **two-class selector** — which correctly overrides the base `.ns-prose code` rule by specificity.

**Adversarial check: is this real contrast, not hidden content?**
✅ HTML contains endpoint names (`GET /health`, `POST /api/v1/workers/jobs/{id}/trigger`) and type classifications (`liveness`, `enqueue`, `history`, `SSE`) — all rendered as `<code>` chips. Description cells show full sentences. Nothing is hidden.

## Gate 3: Tabbed/fenced code indentation — ✅ PASS

### Built CSS

`white-space: pre` is present on `.ns-prose pre code`:
```css
.ns-prose pre code {
  background: none;
  border: none;
  padding: 0;
  color: var(--ns-gray-2);
  font-size: inherit;
  white-space: pre;  /* ← key rule */
  overflow-wrap: normal;
  word-break: normal;
}
```

### `tabbedCode.vto` structure

The fix:
1. Template body starts at column 0 (no leading whitespace leak from Vento)
2. Uses `replaceAll("\n", "&#10;")` to preserve newlines as HTML entities
3. Uses `replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")` for safe HTML escaping
4. No indentation trimming or newline collapsing in the template

### Built HTML: indentation preserved

`_site/tutorials/background-jobs/index.html`:
```html
<pre><code class="language-ts hljs language-typescript"><span class="hljs-keyword">import</span> {
  createSuccessResult,
  createFailureResult,
  defineJobHandler,
} <span class="hljs-keyword">from</span> <span class="hljs-string">'@netscript/plugin-workers-core'</span>;
```

2-space indentation on `createSuccessResult,`, `createFailureResult,`, `defineJobHandler,` is preserved. Multi-line code blocks across all tabbed panels retain their source indentation.

## Gate 4: Diff scope — ✅ PASS

- 2 files changed, both under `docs/site/`
- 0 changes to `packages/`, `plugins/`, `deno.lock`
- 0 stray/junk files (only `.llm/tmp/run/openhands/pr-72/` is an untracked agent artifact, not in the diff)
- No unrelated churn

## Remaining risks

- None. The fix is scoped and correct. The `deno.lock` hygiene is preserved (0 lock changes).

---

_Evaluator: OpenHands Agent (separate adversarial session) | Branch: `fix/docs-render-table-code` vs `origin/docs/user-site`_
