**[PHASE: IMPL]**

S1: `913ae5dbd990a31a48b34be0a2822f07d1b24fb8` adds the shared first-line registry opt-out to every triggers/workers writer, saga registry selection, and AI tool/agent selection. Read-only inspection validates optional excluded paths and doctor names them on healthy and stale outputs.

Validation: 60 focused tests passed; check/lint/format covered all 19 changed TypeScript files with zero findings; `quality:gate` and the new selector's documentation lint passed. Full shared-package doc lint retains 18 existing private-type references in unchanged contract/service/auth sources; the audit's publish dry-run passed with inherited metadata findings recorded.

[Independent slice sign-off and run evidence](https://github.com/rickylabs/netscript/tree/913ae5dbd990a31a48b34be0a2822f07d1b24fb8/.llm/runs/orch-divybot-6539498806--2161).

S2 is documenting the per-plugin registry contract and testing the actual installation sequence. The coordinator-owned `scaffold.runtime` CI verdict is still required.
