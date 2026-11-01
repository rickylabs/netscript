# Independent CLI documentation and census review

Requested route: `claude -p --model claude-opus-5-5 --effort high`; same evaluator session, read-only, closed stdin, blockers only.

**PASS.** I found no documentation-contract, command-count or carrier blockers in this slice. As before I couldn't run anything, so I haven't re-run `docs:accuracy` or its fixture tests; this is from reading the files.

- **Command count:** `EXPECTED_PUBLIC_DIRECT_COMMAND_COUNT = 98` (`.llm/tools/docs/check-accuracy-and-discoverability.ts:143`). The checker counts root commands plus their direct subcommands in the live command tree, and documented commands that aren't registered yet don't affect it. So documenting the approved future commands now is safe. As you noted, the number has to be recalculated once `ui:view`, `ui:search`, `ui:docs`, `ui:info`, `ui:registry` (with `add` and `validate`), `ui:preset` (with `decode` and `url`) and `ui:apply` are actually wired in.
- **`ui:build` entry:** it is written as a real invocation, so the checker counts it as documented. Its flags match the command factory (`packages/cli/src/public/features/ui/build/build-ui-command.ts:15-17`): `--registry` (default `registry.json`), `--source-root`, and `--output` (default `public/r`).
- **The approved interface the docs describe ahead of time** (checked against the continuation's command definitions):
  - **`ui:registry add <namespace> <url>`:** repeatable `--header`, plus `--index`. `ui:registry validate [reference]` matches too (`packages/cli/src/public/features/ui/protocol/registry/ui-registry-command.ts`).
  - **`ui:view <reference>`, `ui:docs <reference>`, `ui:search [query] --registry`, `ui:info`:** match the inspect command definitions (`.../protocol/inspect/inspect-ui-command.ts`).
  - **`ui:preset decode <code>` and `ui:preset url [code]`:** `--theme`, `--style`, `--font` and `--icon-library` all match (`.../protocol/preset/ui-preset-command.ts`).
  - **Behaviour text:** the descriptions of `ui:init --preset`, `ui:add --diff`, `ui:apply --only theme,font` and theme-skill installation agree with the locked plan.
  - **Header example:** it is single-quoted, so the shell doesn't expand `${ACME_REGISTRY_TOKEN}`, which matches the "resolved only by the transport" contract.
- **Prose carrier:** `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts` doesn't embed the body of `commands.md`. It contains no `ui:list`, `ui:update` or `ui:build` text and only links to `reference/cli`. So the new table needs no carrier change, and the 7/0/0 parity result is consistent with that. Without a shell I couldn't diff exactly what changed in this generated file, so I'm relying on the parity gate you reported.

## Carrier clarification

The reviewer's last carrier paragraph inferred absence from literal-string search. The page rows are encoded. Decoding the carrier with the existing decodeAgentDocsPages helper proves that `pages/reference/cli/commands/index.md` contains both ui:build and ui:apply (40,584 characters). The regenerated row is intentional and the shared parity tests pass. This corrects that explanatory statement; no independent command execution is claimed.
