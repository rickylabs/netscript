# Environment and prior memory — 2026-11-01

Deno 2.9.7, gh, claude and codex are on PATH; rtk is absent. Direct CLI calls
are the fallback. Prior project memory was consulted before product source.
`packages/cli` is excluded by root lint/format: use structured wrappers with
explicit files and a temporary config preserving root rules but removing exclusions.
Native browser/build artifacts must live inside project runs because TMPDIR is
noexec. The design routes require development mode. Theme state is `ns-theme`
localStorage plus the document `data-theme` attribute.

Preflight found no PR for #2570. #2488 is OPEN at
`c5877ff8610f5fbafd5276e0115c114f92d1cb16`; do not copy its gap components.
