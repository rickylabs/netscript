NetScript 0.0.1-beta.10 completes the CLI story and hardens the framework end to end.

**The agentic combo ships.** One binary, three faces: the new `@netscript/mcp` server, the public
skill bundle (`netscript`, `netscript-build`, `netscript-operate`), and the CLI spine —
`netscript agent mcp` serves the full tool surface over stdio, and `netscript agent init` wires
your agent host (Claude Code, VS Code, or both) with a versioned, working configuration in one
command.

**Complete CLI coverage, documented.** Every command group now has a verified reference derived
from the live command tree, and the tutorials use the CLI verbs instead of manual steps.

**Stabilization across the stack.** JSR specifiers emitted by the framework are always pinned on
the pre-release line (with a CI guard that keeps it that way); the scaffolded workers runtime
executes its jobs correctly; Fresh production builds are deterministic on clean machines and
correct on Windows; markdown rendering moved onto the Preact JSX runtime (dropping the React
compatibility layer, ~12% smaller island bundles); and the Aspire generator emits valid
capabilities, environment values, and paths for every resource shape.

**Honest CI.** Stacked-wave pull requests now run the full check, test, and quality lanes, with
lane-visibility summaries, a blocking type-suppression drift gate, and generated-asset freshness
checks — each new gate proven to fail before it was trusted.

The Dev Dashboard remains paused and returns in a later beta.
