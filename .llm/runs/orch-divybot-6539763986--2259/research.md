# Research — issue 2259

Baseline: `d25f65b5ead991c372592afb08b13621b5dfda46`, current assignment checkout.

The NetScript MCP was consulted in the required order: `find_guidance` with the security
intent, then `search_docs` for secret parameters and ReferenceExpression. It identifies
Aspire as the control plane but supplies no supported composed-value masking mechanism.

## Re-baselined facts

- `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` still pins Aspire SDK
  13.5.3. `scaffold-aspire.ts` also pins the PostgreSQL integration to 13.5.3.
- The same Aspire.Hosting 13.5.3 package is installed for a focused SDK diagnostic.
- The previous research PR [#2275](https://github.com/rickylabs/netscript/pull/2275) is
  closed, unmerged, and contains only an intent commit. No implementation is duplicated.
- [The owner's previous decision](https://github.com/rickylabs/netscript/issues/2259#issuecomment-6106014501)
  reports an exact-value-only redactor. The new assignment explicitly requests a fresh spike
  and prohibits an Aspire upgrade, so reproduce the relevant installed-SDK behavior.
- `packages/cli/e2e/src/application/gates/scaffold/runtime/credential-secret-surfaces.ts`
  explicitly scans health evidence, excluding resolved environment projections under #2259.
  Do not remove that exemption unless the masking prerequisite is demonstrated.

## Pinned upstream contract

The [backchannel environment projection and redactor](https://github.com/microsoft/aspire/blob/v13.5.3/src/Aspire.Hosting/Backchannel/AuxiliaryBackchannelRpcTarget.cs)
mask an environment value only if it exactly equals a resolved secret ParameterResource
value. The source explicitly describes embedded connection-string secrets as a limitation.
Its secret collector selects ParameterResource instances with Secret enabled.

[AddConnectionString with an expression](https://github.com/microsoft/aspire/blob/v13.5.3/src/Aspire.Hosting/ConnectionStringBuilderExtensions.cs)
creates a ConnectionStringResource rather than a ParameterResource. This must be checked
against the actual installed assembly, rather than inferred to acquire secret classification.

## Question the spike must settle

Does either supported composition, a secret parameter inside a ReferenceExpression or
AddConnectionString(ReferenceExpression), remove synthetic password bytes from the pinned
backchannel environment redactor while retaining those bytes in the runtime environment?

This is a capability diagnostic, not a database or dashboard acceptance verdict. A CLI leak
alone disproves the combined acceptance. A positive result would additionally require live
whole-snapshot/dashboard and runtime checks before any acceptance could be checked.

## Fresh spike result

The standalone pinned diagnostic exited 0 with `CAPABILITY: BLOCKED`; all validity controls
passed. The direct secret became null under the actual installed backchannel redactor.
Each of the four composed environment bindings retained the synthetic credential both in the
resolved consumer value and after redaction. This covers ReferenceExpression directly and
the AddConnectionString expression overload. See spike/result.txt and spike/README.md.

The result independently reproduces the earlier report, corroborated by the pinned upstream
source. It disproves the masking prerequisite for these supported composition paths. It does
not establish live dashboard behavior, a full describe snapshot, database connectivity, or
regression freedom. The owner explicitly directs stopping after this negative spike.
