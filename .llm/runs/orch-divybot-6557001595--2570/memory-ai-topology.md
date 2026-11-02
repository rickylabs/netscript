# AI installation is in-process

Current plugins/ai installs an app-owned `ai/ai.ts` composition root and
`ai/models.ts`, not a remote AI models service. `models.stub.ts` holds configured
provider/model refs; `chatModel` resolves the existing provider handle. A
`--no-samples` install does not create chat handlers or tools. The page must show
this actual configuration and supported commands, and must not call an invented
remote models endpoint or provision example workloads.

This refines S2's plan wording about a models capability: the installed topology,
not the older plugin-ai-core gateway contract, is authoritative.
