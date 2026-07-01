# Evaluation: PR #226 - CSS-native auto-grow for prompt-input

## Verdict: PASS

## Summary

This is a minimal, well-scoped CSS-only enhancement that adds native browser auto-grow behavior to the `PromptInput` textarea using the modern `field-sizing: content` CSS property. The change preserves all existing constraints (min/max height), maintains full alignment with the generated registry, includes appropriate documentation updates, and has focused test coverage.

## Evaluation Criteria

| Criterion | Status | Evidence |
|-----------|--------|----------|
| `field-sizing: content` moved to PromptInput primitive CSS | ✅ PASS | `prompt-input.css:26` and `registry.generated.ts` template_052 |
| Existing min/max height behavior preserved | ✅ PASS | `min-height: var(--ns-control-h);` and `max-height: 12rem;` present in CSS |
| No JavaScript autosize logic | ✅ PASS | No `scrollHeight`, `useRef`, `resize`, or `onInput` handlers in TSX |
| Generated registry content aligned | ✅ PASS | `registry.generated.ts` updated to match source files |
| Adequate focused validation | ✅ PASS | New test validates CSS auto-grow with height bounds |

## Evidence Collected

### Static Validation
- **TypeCheck**: `deno check packages/fresh-ui/registry/components/ui/prompt-input.tsx` — exit 0
- **Test Suite**: `deno test packages/fresh-ui/tests/registry/components/ui/prompt-input.test.tsx` — 4/4 pass
  - New test `PromptInput field CSS auto-grows with the existing height bounds` validates:
    - `field-sizing: content;` presence
    - `min-height: var(--ns-control-h);` preservation
    - `max-height: 12rem;` preservation
- **Registry Alignment**: Verified `field-sizing: content;` in both source CSS (line 26) and generated registry (template_052)

### Code Review
- **File**: `packages/fresh-ui/registry/components/ui/prompt-input.css`
  - Added `field-sizing: content;` to `.ns-prompt-input__field` rule (line 26)
  - Positioned between `min-height` and `resize: none` — correct cascade order
  - No other CSS changes

- **File**: `packages/fresh-ui/registry/components/ui/prompt-input.tsx`
  - JSDoc updated: "textarea auto-grow is CSS-native and Enter-to-send is an app-island enhancement"
  - Import reordered: `{ type ModelOption, ModelSelector }` (alphabetical)
  - No functional changes to component logic

- **File**: `packages/fresh-ui/registry.generated.ts`
  - `template_052` (CSS): Includes `field-sizing: content;` declaration
  - `template_053` (TSX): Includes updated JSDoc comment

- **File**: `packages/fresh-ui/tests/registry/components/ui/prompt-input.test.tsx`
  - Added test reads `FRESH_UI_REGISTRY_CONTENT` to validate CSS properties
  - Asserts presence of `field-sizing: content;`, `min-height`, and `max-height`

### Archetype Assessment
- **Package**: `fresh-ui` — CSS-only component package
- **Scope**: CSS-only enhancement, no API surface changes, no new dependencies
- **Risk**: Minimal — progressive enhancement pattern

## Technical Notes

### Browser Support
`field-sizing: content` is a modern CSS property (Chromium 123+, Firefox 123+). Browsers without support will gracefully fallback to the existing fixed-height behavior due to progressive enhancement. The `resize: none` property remains in place to prevent manual resizing.

### Progressive Enhancement Pattern
The implementation follows best practices:
1. Native CSS solution preferred over JavaScript
2. Constraints preserved via min/max height
3. Fallback behavior intact for unsupported browsers
4. No runtime overhead

## Conclusion

All evaluation criteria satisfied. The change is:
- **Minimal**: Targeted CSS property addition with registry sync
- **Safe**: Preserves existing constraints and fallback behavior
- **Tested**: Focused test validates the CSS auto-grow behavior
- **Aligned**: Source and generated registry in sync
- **Documented**: JSDoc clarified to reflect CSS-native approach

**Verdict: PASS**

---
Evaluator: OpenHands IMPL-EVAL session  
Date: 2024  
Commit: b376846
