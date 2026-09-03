use harness

## SKILL

Load and follow `.agents/skills/netscript-harness`, `.agents/skills/netscript-doctrine`,
`.agents/skills/netscript-tools`, `.agents/skills/netscript-pr`, and `.agents/skills/aspire`.

Perform the formal IMPL-EVAL for PR #1975 / #1881 in
`/home/agent/projects/netscript/worktrees/007-aspire-leaf-1881-fix` at pushed head
`0650f6f7bda0f9241424cce9882b405f4e6b6d55`.

Read `.llm/harness/evaluator/protocol.md`, `verdict-definitions.md`, the Archetype 6 profile, gate
matrix, relevant doctrine/debt, and every artifact under
`.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix/`. Inspect the full diff from
base `45e57377f8e4ccf4b823c73136f1512ba379c392`, the two commits, and PR metadata/comments if
available. Verify the recorded RED/GREEN evidence and owner-locked scope.

Key acceptance points:

- index 0 removes only `<runRoot>/.deno-install`, tolerates only `NotFound`, then recreates it;
- state persists `denoInstallRoot`, and index >=1 consumes that persisted value;
- every spawned README command receives `DENO_INSTALL_ROOT` and `<root>/bin` prepended to ambient
  PATH with the platform delimiter;
- launcher permission is narrowly `--allow-env=PATH`;
- install argv is byte-identical after version substitution and contains no `-f`;
- receipts contain `environment: { denoInstallRoot, pathPrepend }`;
- `runAspireCommand(..., env?)` merges through `Deno.Command` while existing three-argument
  `quickstart.walk` calls remain unchanged;
- no README/workflow/cleanup/product/plugin/lockfile changes and no runtime gate execution.

You may run only read-only inspection and the owner-scoped static/unit/listing commands. Do NOT run
`readme.quickstart`, `quickstart.walk`, `scaffold.runtime`, Aspire, Docker, or any command that
installs or starts resources. Do not edit source, tests, plan, worklog, context-pack, drift, GitHub,
or git history. Your sole permitted file write is the formal verdict at
`.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix/evaluate.md`, using the harness
template and exactly one verdict: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.
