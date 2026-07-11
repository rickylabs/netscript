# Research — issue #380

- Baseline preflight passed at `955b4abf639522c7da50bd15d20c6e999acb808f` on branch `feat/380-prompt-assembly`.
- Issue #380 contracts a thin ordered composition seam; contributor content remains outside the framework.
- `AgentLoopInput.system?: string` is already forwarded unchanged by `createAgentLoop` into `ChatClientRequest.system`, so the assembled string is directly consumable without changing the loop.
- `@netscript/ai` has a curated root export and no prompt composition module today.
- The slice is Archetype 1 (small contract): immutable input types, one pure composition function, one thin object wrapper, and one typed invariant error. No IO, lifecycle, adapter, or new port is needed.
- The current doctrine verdict predates `@netscript/ai`; new code must follow the doctrine without expanding this slice into package restructuring.
- No relevant `@netscript/ai` architecture-debt entry was found.
