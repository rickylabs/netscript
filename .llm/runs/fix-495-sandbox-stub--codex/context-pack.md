# Context pack — #495

Issue #495 is resolved locally by removing the published, always-throwing
`createNetScriptMcpSandbox` placeholder and its incoherent placeholder types. The implemented
`createMcpSandboxHandler` remains published at `@netscript/fresh/ai/sandbox`. A regression test
asserts the real handler remains present and the skeleton symbol is absent. All requested static,
unit, documentation, and publish gates pass. PLAN-EVAL was explicitly owner-waived; IMPL-EVAL is a
separate-session supervisor responsibility and was not self-certified here.
