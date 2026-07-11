# Context Pack — issue #380

Status: implementation and generator gates complete; commit/push pending.

The slice adds a pure prompt assembler to the `@netscript/ai` root surface. Lower numeric precedence renders first, ties retain insertion order, blank content is omitted, retained content is trimmed and joined with `\n\n`, and duplicate names raise a typed error. The existing `AgentLoopInput.system?: string` accepts the result without loop changes.

Scoped format/check/lint, the full package test suite, full-export doc lint, and publish dry-run pass.
The publish dry-run retains three pre-existing dynamic-import warnings in the MCP connector.
