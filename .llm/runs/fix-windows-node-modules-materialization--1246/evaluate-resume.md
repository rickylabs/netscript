Resume the IMPL-EVAL from the original prompt.

The open-model guard correctly denied your attempted closed-model `Agent` subtask. Do not call
`Agent`, `Task`, `Workflow`, or any subagent/delegation tool again. Perform the evaluation yourself
in this same Qwen session using direct `Read`, `Bash`, `Skill`, and other non-delegating tools only.
Read every required file directly, inspect the PR/diff directly, run only the permitted read-only
checks, and write the required tracked
`.llm/runs/fix-windows-node-modules-materialization--1246/evaluate.md` verdict artifact. All other
constraints from the original prompt remain in force, especially no source edits, no commits, no
pushes, and no `deno.lock` mutation.
