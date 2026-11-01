# Syntax and state evidence

CodeBlock uses the existing repository pin `npm:highlight.js@11.11.1/lib/common`; recognize language aliases with `getLanguage`, highlight known names, retain Preact text fallback otherwise. The clipboard attribute always carries original source. Tests include hostile HTML-like source in recognized and unknown languages. Registry dependency metadata must accompany the source import.

`deno task --cwd packages/fresh-ui lock:update` is the native scoped lock writer. Compare normalized package identities and integrity values as well as textual diffs: Deno may normalize peer-qualified keys without changing their package version. S5 adds only highlight.js11.11.1 to both reviewed locks.

ModelSelector forwards native details attributes, so its props should use `JSX.DetailsHTMLAttributes<HTMLDetailsElement>`; generic HTMLAttributes rejects the already-supported open state in typed fixtures.

The private browser comparison uses real scaffold Tailwind preflight and actual component markup. Gallery-only flow overrides expose all model menus for capture; they do not prove native positioning. Source fixtures outside the package need explicit Preact imports/JSX factory. Retain the original prose payload for legacy CSS comparison when adding fenced-code content to the new fixture; compare updated markup for the other families.

Legacy isolation must include a preset whose primary-border and primary-stroke differ. NS One aliases them and misses accidental base-rule substitutions. The comparator now loads NS One, tonal and macos-27 and sets data-theme to the actual preset plus data-scheme to light/dark; setting only data-theme=dark does not select a non-NS One dark palette.

Capture family names are contract scopes, not always registry item names: desktop-tray-menu → tray-menu, desktop-window-chrome → window-chrome, desktop-update-prompt → update-prompt, markdown → prose. An incorrect family fails the coverage assertion; do not treat the remaining screenshots as a full pass.
