# Preserve Preact types through its declared public namespace

Preact declares a public UMD type namespace. `preact.VNode` and `preact.JSX` name the same
upstream types as named imports, without leaking private JSXInternal aliases into Deno doc.
The retained module dependency below loads those declarations transitively; empty imports
are redundant and were removed after independent publication checks. A native Deno 2.9.7 probe passes doc-lint and type-check with these qualified
references. No namespace, shim, own VNode approximation, suppression or third-party re-export is added.
Verify exact type equivalence and real consumer callbacks in the public contract tests.

Scratch probes must run from their own config directory. Running Deno from the repository root
against an excluded nested scratch config can fail import-map resolution; that is not lint proof.

Native publication revealed a second requirement: JSR drops unused empty imports from its API
output. A type-only `Pick<typeof import('preact'), never>` intersection on the existing object-shaped
FreshUiElementProps retains the real dependency and adds zero properties. This preserves Preact's
namespace in generated declarations. Standalone native doc-lint + publish both pass, and the real
package publication dry-run passes after adding it. No public type widening or runtime import is
required. Always pair doc-lint with publication; ambient type-check alone is insufficient.
