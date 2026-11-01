# Cheap liveness and configuration — 2026-11-01

The Aspire app probe sends no Accept header. Preserve the SSR fall-through from #954, but never build the dependency payload before negotiation. The local payload and layer fallback perform no filesystem discovery or network I/O; explicit HTML/JSON requests build the status report once. The emitted handler/helper test counts both topology reads and dependency fetches. An intentional regression mutation must turn it red.

Settings/sign-in project local configuration, with `configured` distinct from runtime `ready`; loading records or probing plugins there delays unrelated pages. Worker panels use fixed bounded list calls and label a missing execution unknown when the shared history window is incomplete. Never infer no past runs from a truncated window.
