**Verdict: FAIL_FIX**

Slice 1's callout behaviour is correct, but there is one blocker: the new internal gallery is published as a normal documentation page.

### Blocker 1: the internal callout gallery leaks into search, the AI index and the CLI agent docs

- **Where:** `docs/site/fixtures/callouts.md`, which renders at `/internal/callouts/`.
- **Problem:** `nav_hide: true` only hides the page from the sidebar. Nothing else keeps it out of public output:
  - `docs/site/_config.ts` has no ignore rule for `fixtures/`, so Lume builds the page.
  - `docs/site/_includes/layouts/base.vto:96` wraps every article in `data-pagefind-body`, so Pagefind indexes the gallery and it shows up in search.
  - `docs/site/_plugins/ai-tooling.ts:88-113` creates a Markdown twin for every HTML page with `article.ns-prose` and adds it to `llms.txt` and `llms-full.txt`. Because `docs/site/_plugins/llms-policy.ts:36-43` puts unmatched URLs in the `start` section, the gallery lands there.
  - `.llm/tools/docs/build-agent-docs-bundle.ts` builds the CLI carriers under `packages/cli/src/kernel/assets/` from those rendered twins and `llms-full.txt`. So "Callout gallery — Internal visual fixtures" would ship in the CLI agent docs and change the generated-docs freshness baseline.
  - The plan requires Markdown twins and real Pagefind behaviour to be preserved, and this breaks that.
- **Fix:** Keep the page reachable for the browser test, but exclude it from public output:
  - Add a front-matter flag, such as `internal: true`. Have `ai-tooling.ts` skip twin and `llms` collection for flagged pages. Have `base.vto` omit `data-pagefind-body` and emit `<meta name="robots" content="noindex">` for them.
  - Add assertions to the callout test:
    - `internal/callouts/index.md` is not built.
    - `llms.txt` and `llms-full.txt` don't contain `/internal/callouts/`.
    - A Pagefind search for "Callout gallery" returns no result.

### Checked and passing (no blockers)

- **The existing error alias still works.** `error` keeps `data-variant="error"` and maps to the destructive tone (`docs/site/_components/callout.vto:3`). The gallery and the test both cover it.
- **Type names are case-insensitive.** `(type || "note").toLowerCase()`, and unknown types fall back to `note` (`callout.vto:2-4`). The gallery covers upper case and unknown types.
- **Tone mapping is right.** NOTE is info, TIP is success, WARNING is warning, and CAUTION and ERROR are destructive. IMPORTANT stays neutral for slice 6.
- **Head, body and link colours are split correctly.** Only the background, border and head get the tone (`docs/site/styles/components.css:429-456`). The body keeps `--ns-fg`, and the eyebrow and icon inherit the head colour. The test (`tools/fresh-ui-browser/docs-tests/docs.spec.ts:517-557`) compares computed background, border, head, body and link colours against probes of the actual roles.
- **The style policy handles it properly.** `tools/docs-site/style-policy.ts:181` adds `tone` to the allowed destructive selectors, and every selector part must still name the destructive state. Red outside a state is still flagged, and the existing negative controls are unchanged. All colour comes from existing status tokens, with no new values.
- **Accessibility is covered.** The `callouts` route is in the axe and screenshot matrix, which requires zero serious or critical findings (`docs.spec.ts:17`, `docs.spec.ts:33-43`).

The browser re-run you mentioned is still in progress, so I haven't seen its result. My verdict rests only on the source above.
