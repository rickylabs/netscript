# Review-fix validation recipes

The scaffold formatter changes whitespace in copied CSS, so establish byte equality
with `tokens build` output against the registry, rather than treating initial
scaffold formatting as a compiler difference. The real scaffold proof checks:
no config, init/empty override, exactly two changed primary lines, invalid inputs
exit 1 without writes, 18 explicit previews, stale source removal, and preserving
a registry-installed Utility preset across clean/rebuild.

Use structured wrappers with the repository lint rules and formatting settings,
without root path excludes: root configuration intentionally excludes CLI and tools.
The wrapper's coverage report must show every selected file processed. Generated
app checks catch template-only errors that root source checks cannot see; the
preview helper must keep its manifest-key type when returning the local AppTheme
contract.

Do not change a Vite fixture while Playwright's axe scan is running. HMR destroys
its execution context, even for a type-only template repair. The first 24-case
run had one such navigation failure; repeat the complete unchanged matrix against
a stable fixture. No axe baseline changes or waivers are needed.

Export inventory changes require docs/site/reference/fresh-ui/index.md, MCP
export corpus regeneration, then prose/publish carrier regeneration. The corpus
generator's --allow-dirty supports a preview; regenerate against committed source
before recording final freshness. All four carrier checks must stay enabled.
