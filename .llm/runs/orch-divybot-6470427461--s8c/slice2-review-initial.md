**Verdict: FAIL_FIX**

There are two blockers. Everything else you asked me to check passes.

### Blocker 1: the kind-tag transform also rewrites an unrelated generic table

- **Where:** `docs/site/_config.ts:168-192`.
- **Problem:** The transform selects every `.ns-prose table` that has a `Kind` header. It then adds `ns-api-table` and unconditionally sets `data-variant="symbols"`. That pass also sees tables rendered by the `apiTable` component.
  - `docs/site/orchestration-runtime/how-to/add-a-plugin.md:67-77` renders a generic `apiTable` ("Official plugins"). Its `Kind` column holds plugin kinds (`worker`, `saga`, `trigger`, `auth`, `stream`), not API kinds.
  - Those cells don't get tagged, because `apiKind` returns `undefined` for them. But the table's `data-variant="generic"` is overwritten with `symbols`.
  - As a result, `.ns-api-table[data-variant="generic"] .ns-api-table__name` (`docs/site/styles/components.css:524-527`) no longer matches, and the first column loses its generic mono styling. That breaks the requirement that generic and unrelated tables stay unmodified.
- **Fix:**
  - Skip tables the component already rendered (for example, `if (table.classList.contains('ns-api-table')) continue;`). Only add the `symbols` variant to plain Markdown tables, and only when at least one `Kind` cell resolves through `apiKind`.
  - In the API reference browser test, add an assertion that the add-a-plugin table keeps `data-variant="generic"` and has no `.ns-api-kind`.

### Blocker 2: the `component` kind has no locked final role

- **Where:** `tools/docs-site/api-kinds.ts:11` and `docs/site/styles/components.css:512`.
- **Problem:** Slice 2 adds `component` as a kind and gives it the intermediate success tone. Real content uses it in three rows of `docs/site/reference/fresh-ui/index.md` (the `Icon`, `DataGrid` and `RenderUiSurface` rows). But the locked slice 6 mapping in `.llm/runs/orch-divybot-6470427461--s8c/plan.md` only covers class/interface/type/enum, function/method and const/variable. So slice 6 would hit a kind with no decided final role, which reopens a decision the plan says is locked.
- **Fix:** Record this in `.llm/runs/orch-divybot-6470427461--s8c/drift.md` and in the slice 6 mapping in `plan.md`. For example, map `component` to the syntax function role, which matches its current grouping with function/method. Also add `component` to slice 6's checks of colour against the generated role and AA contrast.

### Checked and passing

- **Names and signatures keep the full text colour.** `.ns-api-table__name` and `.ns-api-table__type`, and `code` inside API tables, all resolve to `--ns-fg` (`components.css:487-497`). The new test checks every name and type cell, and every `code` inside them, against a probe of `--ns-fg` (`tools/fresh-ui-browser/docs-tests/docs.spec.ts:698-721`).
- **Each kind has a visible label.** The tag text is the original cell label (`_config.ts:186-190`), and component rows render `row.kind` as text (`docs/site/_components/apiTable.vto:14`). Labels that don't map to a kind stay as plain text. Twins keep the same text, because this pass runs before `aiTooling` captures them.
- **Kind matching handles the real labels.** `apiKind` normalizes the spellings used in the docs, such as `type alias`, `variable` and `X / Y`, and it rejects arbitrary text rather than guessing.
- **Object tables are unchanged apart from the optional tag.** Generic rows from the component itself don't get tags.
- **The intermediate colours are approved and come only from tokens.** Tags use info/success/warning text on the matching subtle background, with no red and no authored values. The reference route is in the axe matrix, so contrast is checked there.
- **Test coverage is in place.** The reference screenshot moving to `reference/database/` is fine, and that page exercises class, function, interface and type.
