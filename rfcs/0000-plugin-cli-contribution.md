---
rfc: 0000
title: Typed plugin CLI contributions and generation seam
status: Draft
authors: ['@rickylabs']
created: 2026-08-15
tracking-issue: https://github.com/rickylabs/netscript/issues/1502
target-milestone: 0.0.7
---

# Typed plugin CLI contributions and generation seam

## Summary

This RFC proposes one typed, versioned way for a NetScript plugin to contribute nested CLI commands
under a host-declared mount. The public definition DSL belongs to the existing
`@netscript/plugin/cli` subpath; the Cliffy router, generated registry, bootstrap machinery, and
workspace mutation transaction remain private to `@netscript/cli`.

A contribution is immutable static data. It declares routes, arguments, options, help, examples,
aliases, capabilities, stable identifiers, and package-relative handler/generator references without
constructing a host command object or executing plugin code. The host validates the complete route
tree before parsing, derives help and shell completion from the static descriptors, and imports only
the selected handler or planner when its command is invoked.

This draft is being authored in reviewable slices. The public ownership, descriptor, router,
help/completion, error, discovery, bootstrap-isolation, capability, transactional-generation,
doctor, manifest-pointer, compatibility, migration, and later-implementation roadmap contracts are
normative below. No product implementation or issue filing is part of this RFC PR.

## Motivation

NetScript already publishes `@netscript/plugin/cli`, but the current surface is a flat helper, not a
host contribution protocol. `PluginCliCommand` contains only `name`, `description`, and an
executable `run` closure. `mountPluginCli` flattens a plugin and command into a `plugin:command`
string. There is no public nested-route definition, safe descriptor-only discovery, completion
model, capability declaration, collision diagnostic, lazy handler pointer, or generation plan.

The CLI host has also accumulated plugin-specific command groups. Adding a new deploy, DevTools,
runtime, or SDK management command therefore tends toward one of two bad outcomes: edit the host for
every plugin, or let a plugin import host internals. The first closes the extension axis; the second
exports Cliffy, filesystem, process, output, and mutation details as accidental public API.

The cost is already visible in deploy proposals #904–#908 and DevTools work: both need nested
commands and generation, but neither should own a general-purpose CLI framework or import the other.
One shared contribution contract lets them remain thin consumers while preserving one host-owned
router and one host-owned generation transaction.

### Goals

- Give plugin authors one literal-preserving, compositional definition API.
- Keep descriptors safe to load for validation, help, and completion without running handlers.
- Permit nested children only beneath an explicitly extensible host mount.
- Reject route, alias, option, and identifier collisions deterministically before parsing.
- Keep plugin failures serializable while leaving rendering, redaction, and exit mapping to the
  host.
- Leave Cliffy and all host mutation ports private to `@netscript/cli`.
- Establish a generation seam without implementing it in this RFC PR.

### Non-goals

- Arbitrary plugin-created top-level commands or shadowing of built-ins.
- Dynamic completion providers in v1.
- A universal envelope shared with frontend, SDK, runtime, or DevTools payloads.
- Exposing Cliffy commands, raw filesystem/process access, or CLI presentation objects.
- Implementing the contract, filing the later epic, publishing packages, or changing plugin source
  in this RFC PR.

## Guide-level explanation

### Define a contribution

A plugin exports one static contribution from a declared package subpath. The host owns the
top-level mount; the plugin owns its nested children.

```ts
import {
  definePluginCliContribution,
  PLUGIN_CLI_CONTRACT_FAMILY,
  PLUGIN_CLI_CONTRACT_MAJOR,
} from '@netscript/plugin/cli';

export default definePluginCliContribution({
  contract: {
    family: PLUGIN_CLI_CONTRACT_FAMILY,
    major: PLUGIN_CLI_CONTRACT_MAJOR,
  },
  plugin: '@netscript/plugin-deploy',
  mount: 'deploy',
  commands: [{
    id: 'deploy.target.plan',
    segment: 'target',
    summary: 'Plan deployment for a configured target',
    arguments: [{
      id: 'target',
      metavar: 'TARGET',
      description: 'Configured deployment target',
      required: true,
    }],
    options: [{
      id: 'preview',
      long: 'preview',
      description: 'Show the plan without side effects',
      value: { kind: 'boolean' },
    }],
    examples: ['netscript deploy target staging --preview'],
    capabilities: ['workspace:read'],
    handler: {
      module: './cli/target.ts',
      export: 'createTargetCommand',
    },
  }],
});
```

The call returns a deeply readonly definition and preserves the literal values of route segments,
command IDs, option IDs, and capability names. It does not create a Cliffy `Command`, open the
workspace, inspect environment variables, or import `./cli/target.ts`.

### Route and invoke a command

Given the definition above, the host may expose:

```text
netscript deploy target TARGET [--preview]
```

The complete path is the host mount followed by descriptor segments. A contribution attaches to
exactly one host-declared extensible mount. A child may itself contain children, but a plugin cannot
mint a new top-level mount, attach to a closed mount, shadow a built-in, or escape the mount by
using punctuation in a segment.

The host validates the full registry before parsing user arguments. If two plugins claim the same
canonical path or an alias makes two paths equivalent, registry generation fails with a diagnostic
that names both owners. There is no last-wins behavior and plugin discovery order has no semantic
effect.

### Get help and completion without booting a plugin

Help and shell completion use only the generated static registry. They may show route segments,
aliases, argument metavariables, option names, static enum values, summaries, descriptions, and
examples. They do not import handler modules, invoke factories, read a workspace, or call a plugin.

V1 completion is deliberately static. It completes command paths, aliases, option names, and values
declared as an enum. A future dynamic provider would require a separately versioned capability and
failure contract; a command handler is never used as a completion provider.

### Return values and failures

A handler returns `PluginCliInvocationResult`, a serializable success/failure union. Plugins may
return structured JSON values and domain-specific failure details. They do not select terminal
colors, print directly, or choose a process exit number. The host redacts, renders JSON or text, and
maps stable failure classes to process exits.

Thrown values are not part of the public contract. The host catches an unknown throw at the plugin
boundary and normalizes it to a redacted `plugin-failure` diagnostic. Cancellation and deadlines are
host-owned invocation facts rather than exception conventions.

### Install and refresh contributed commands

An installed plugin advertises one explicit CLI contribution pointer in its installer metadata and
the same pointer in its runtime plugin definition. Install, update, remove, and maintainer sync feed
the complete configured pointer set to the same authoritative registry generator used by
`netscript generate plugins`. The generator replaces the registry only after every pointer,
descriptor, mount, collision, and capability check passes. It never scans `node_modules` or guesses
from package names.

The live CLI already exposes `netscript generate plugins --dry-run`; the proposed lifecycle keeps
that spelling for registry preview. A missing or stale registry never silently falls back to ambient
discovery: built-ins remain available, contributed routes stay disabled, and the diagnostic
instructs the user to regenerate and run `netscript plugin doctor`.

### Preview and apply generated files

A command that changes a workspace selects a generator planner instead of a normal handler. The
planner receives parsed invocation data and a capability-scoped, read-only workspace view, then
returns a deterministic `PluginCliGenerationPlan`. It cannot write files, spawn a process, call the
network, or import CLI host internals.

The host validates the complete plan before mutation. Planner output is preview-invariant: for the
same descriptor, parsed inputs, and workspace state, the planner MUST return the same canonical plan
for preview and apply, and `invocation.preview` MUST NOT change plan construction. Only the host's
execution mode decides whether mutation occurs. Preview renders that plan without creating a stage,
journal, or file and without invoking a post-step. Apply acquires the workspace mutation lock,
stages output, validates it, commits it through the host transaction, and rolls back on failure. The
host owns text/JSON rendering and reports created, modified, deleted, and byte-identical skipped
paths after the transaction reaches a terminal state.

## Reference-level explanation

### Status and authority

This is a draft contract. It does not assert that the proposed APIs are shipped. The measured
baseline is the public export surface rendered by `deno doc` at the RFC branch base, especially
`packages/plugin/src/cli/mod.ts` and `packages/cli/mod.ts`.

The design applies the Architecture Doctrine rather than restating it: public types precede
implementation, registration replaces inheritance as the primary extension form, extension axes are
named, and the host remains the composition root. See the doctrine on
[public surfaces](../docs/architecture/doctrine/02-public-surface.md),
[modules and helpers](../docs/architecture/doctrine/04-modules-and-helpers.md),
[composition and extension](../docs/architecture/doctrine/07-composition-and-extension.md), and
[anti-patterns and fitness functions](../docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md).

### Package ownership and dependency direction

| Concern                                                                                          | Owner                   | Public to plugin authors?        |
| ------------------------------------------------------------------------------------------------ | ----------------------- | -------------------------------- |
| Definitions, literal-preserving builder, serializable result/failure vocabulary, pure validation | `@netscript/plugin/cli` | yes                              |
| Contract family/major, descriptor and capability constants                                       | `@netscript/plugin/cli` | yes                              |
| Host mount registry, generated registry reader, collision aggregation                            | `@netscript/cli`        | no                               |
| Cliffy adapter, argument parsing, help rendering, completion script rendering                    | `@netscript/cli`        | no                               |
| Handler import/bootstrap, policy grants, cancellation, deadlines                                 | `@netscript/cli`        | no                               |
| Generic CLI workspace-plan validation, staging, checks, commit/rollback, and journal diagnostics | `@netscript/cli`        | no                               |
| Domain command behavior and domain failure details                                               | contributing plugin     | only through the shared contract |

`@netscript/plugin/cli` must not import `@netscript/cli`. A contributing plugin must not import
another plugin, deploy, DevTools, or a host-internal adapter. The host may depend on the public
plugin contract, but none of its adapter types leak back through that surface.

C6 owns only generic CLI contribution workspace-plan execution: canonical UTF-8 text-plan
validation, preview/apply safety, common stage/check/commit/rollback mechanics, and generic
registry/plan/journal doctor states. [RFC 0003](./0003-command-composition-kit.md) and its live
implementation issue #1490 under #1363 exclusively own command-store provider selection; Prisma
schema, models, and indexes; migration creation, application, and refusal; the generated
command-store bridge and transaction-client types; database-specific validation; and
business-command receipt, audit, outbox, and transaction semantics. `PluginCliCapability` values are
CLI-invocation permission tokens; RFC 0003's `CommandStoreCapabilities` describes store capability
truth, and neither vocabulary grants or defines the other.

### Contract identity

```ts
export const PLUGIN_CLI_CONTRACT_FAMILY = 'plugin-cli' as const;
export const PLUGIN_CLI_CONTRACT_MAJOR = 1 as const;

export interface PluginCliContractVersion {
  readonly family: typeof PLUGIN_CLI_CONTRACT_FAMILY;
  readonly major: typeof PLUGIN_CLI_CONTRACT_MAJOR;
}
```

An additive optional descriptor field may be introduced within major 1 only when an older host can
ignore it without changing existing meaning. A grammar change, changed interpretation of an existing
field, or reassignment of a published symbol requires a new contract major and an explicit migration
window.

### Public definition surface

The signatures below are normative API shape, not implementation code for this PR. Implementers may
split them across doctrine-approved concern folders, but the export names and semantics remain one
public subpath.

```ts
export type PluginCliJson =
  | null
  | boolean
  | number
  | string
  | readonly PluginCliJson[]
  | { readonly [key: string]: PluginCliJson };

export interface PluginCliHandlerRef {
  readonly module: `./${string}`;
  readonly export: string;
}

export interface PluginCliGeneratorDefinition {
  readonly module: `./${string}`;
  readonly export: string;
}

export type PluginCliDeepReadonly<T> = T extends (...args: never[]) => unknown ? T
  : T extends object ? { readonly [K in keyof T]: PluginCliDeepReadonly<T[K]> }
  : T;

export const PLUGIN_CLI_CAPABILITIES = [
  'workspace:read',
  'network:request',
  'process:run',
  'environment:read',
  'secret:read',
] as const;

export type PluginCliCapability = typeof PLUGIN_CLI_CAPABILITIES[number];

/**
 * One host capability decision. A successful copy reaches plugin code; a denied copy is emitted
 * only as redacted host diagnostic data and prevents plugin import.
 */
export interface PluginCliCapabilityGrant {
  readonly requested: readonly PluginCliCapability[];
  readonly granted: readonly PluginCliCapability[];
  readonly denied: readonly PluginCliCapability[];
}

export interface PluginCliArgumentDefinition {
  readonly id: string;
  readonly metavar: string;
  readonly description: string;
  readonly required?: boolean;
  readonly variadic?: boolean;
  readonly values?: readonly string[];
}

export type PluginCliOptionValueDefinition =
  | { readonly kind: 'boolean' }
  | { readonly kind: 'string'; readonly values?: readonly string[] }
  | { readonly kind: 'integer' }
  | { readonly kind: 'number' }
  | { readonly kind: 'string-list'; readonly values?: readonly string[] };

export interface PluginCliOptionDefinition {
  readonly id: string;
  readonly long: string;
  readonly short?: string;
  readonly description: string;
  readonly value: PluginCliOptionValueDefinition;
  readonly required?: boolean;
  readonly repeatable?: boolean;
}

export interface PluginCliCommandDefinition {
  readonly id: string;
  readonly segment: string;
  readonly aliases?: readonly string[];
  readonly summary: string;
  readonly description?: string;
  readonly arguments?: readonly PluginCliArgumentDefinition[];
  readonly options?: readonly PluginCliOptionDefinition[];
  readonly examples?: readonly string[];
  readonly capabilities?: readonly PluginCliCapability[];
  readonly handler?: PluginCliHandlerRef;
  readonly generator?: PluginCliGeneratorDefinition;
  readonly children?: readonly PluginCliCommandDefinition[];
}

export interface PluginCliContributionDefinition {
  readonly contract: PluginCliContractVersion;
  readonly plugin: string;
  readonly mount: string;
  readonly commands: readonly PluginCliCommandDefinition[];
}

export function definePluginCliContribution<
  const TDefinition extends PluginCliContributionDefinition,
>(definition: TDefinition): PluginCliDeepReadonly<TDefinition>;
```

`PluginCliDeepReadonly` makes every returned property and nested array/object recursively readonly
to TypeScript consumers; it is not a claim that the input object was immutable before the call. The
builder must validate the input, copy it into host-owned data, and recursively freeze the returned
definition so the same guarantee holds at runtime. Token grammar, serializability, path safety, and
cross-definition collisions are validation obligations because TypeScript cannot prove them.

The `` `./${string}` `` executable-module type used by handler and generator references is only a
package-relative shape hint. It accepts values such as `./../escape.ts`; normative validation must
normalize the reference, reject every parent traversal, and prove that the resolved target remains
inside the contributing package before any import occurs.

The capability tuple and generator field are the complete contract-major-1 surface. A normal handler
may request any listed capability. A generator may request only `workspace:read`; workspace mutation
belongs to the host transaction and there is intentionally no `workspace:write` capability. Adding a
capability is additive, while broadening an existing capability's meaning is a major-version event.

#### Descriptor invariants

- `plugin`, command `id`, option `id`, and handler/generator `export` are non-empty stable
  identifiers.
- A route `segment`, alias, and option spelling is a normalized token, not a path or shell fragment.
- Handler modules are package-relative `./...` references. Absolute paths, URLs, bare specifiers,
  parent traversal, and self-import through a published JSR specifier are invalid.
- A command has a handler, a generator, children, or one executable plus children. `handler` and
  `generator` are mutually exclusive, and a leaf without either executable is invalid.
- Positional arguments are ordered. At most one is variadic; it is last. Required arguments cannot
  follow an optional argument.
- Long and short option spellings are unique over the effective command scope. Built-in host options
  are reserved and cannot be shadowed.
- Aliases are alternative spellings for one segment, never redirects to another command ID.
- Descriptor data is serializable and import-safe. Closures, class instances, Cliffy values,
  filesystem handles, and executable default-value functions are invalid.

### Router and collision contract

The router composes a canonical registry in two phases:

1. Validate each definition independently, bind it to a host-declared extensible mount, normalize
   its route tokens, and retain owner provenance.
2. Validate the combined tree before any user argument is parsed or any handler/generator module is
   imported.

The canonical command path is `mount + ancestor segments + segment`. Comparison uses the host's
documented token normalization and is independent of locale. Aliases participate in the same
namespace as canonical segments. A plugin cannot resolve a collision by ordering metadata.

The following collisions are fatal to the candidate registry and report both owners:

- duplicate canonical paths;
- an alias equal to another alias or canonical segment at the same parent;
- duplicate stable command IDs, including two paths within one plugin;
- duplicate long or short option spellings in an effective command;
- use of a reserved mount, route segment, alias, or host option; and
- a contribution targeting a closed or unknown mount.

Successful registry output is sorted by mount, canonical route, plugin identity, and stable command
ID. That total order is used for generated output, help, completion, and diagnostics. Source array
order may preserve argument order and example order, but plugin load order never decides routing or
presentation.

### Help and completion contract

Help is a pure projection of validated static descriptors. The host owns layout, wrapping,
localization policy, color, and output format. Plugins own factual command text, examples, and the
static values they declare. A descriptor therefore carries semantic content but no render callback.

Completion is also a pure projection. V1 may emit:

- canonical child segments and aliases valid at the current route;
- long and short option names valid for the selected command;
- statically declared argument or option enum values; and
- value-kind hints needed by the host's shell adapter.

Completion never imports a handler, evaluates a default, reads the workspace, calls the network, or
executes a plugin. Dynamic workspace-aware completion is outside v1.

### Result, failure, and diagnostic contract

```ts
export const PLUGIN_CLI_DIAGNOSTIC_CODES = [
  'descriptor-invalid',
  'mount-closed',
  'reserved-route',
  'duplicate-route',
  'duplicate-alias',
  'duplicate-option',
  'duplicate-command-id',
  'handler-unavailable',
  'plugin-absent',
  'capability-denied',
  'bootstrap-timeout',
  'plugin-failure',
  'plan-invalid',
  'commit-failed',
] as const;

export type PluginCliDiagnosticCode = typeof PLUGIN_CLI_DIAGNOSTIC_CODES[number];

export interface PluginCliMessage {
  readonly level: 'info' | 'warning';
  readonly text: string;
}

export interface PluginCliFailure {
  readonly code: PluginCliDiagnosticCode | `plugin.${string}`;
  readonly message: string;
  readonly details?: PluginCliJson;
  readonly retryable?: boolean;
}

export type PluginCliInvocationResult =
  | {
    readonly ok: true;
    readonly value?: PluginCliJson;
    readonly messages?: readonly PluginCliMessage[];
  }
  | {
    readonly ok: false;
    readonly failure: PluginCliFailure;
    readonly messages?: readonly PluginCliMessage[];
  };
```

The exported tuple is the complete framework diagnostic-code set for contract major 1. Later slices
specify the lifecycle phase and remediation data for each code without changing these ownership
rules. Adding a code is additive; changing an existing meaning is a major-version event.

Plugin domain codes use the `plugin.` namespace and are documented by their plugin. They cannot use
or imitate framework codes. The host owns redaction, JSON/text rendering, ordering of buffered
messages, and exit-code mapping. Exact numeric exits are an implementation/FCP policy choice; a
plugin-returned number is not authoritative.

#### Published `PluginCliResult` collision and migration disposition

`PluginCliResult` is already exported from `@netscript/plugin/cli` with the incompatible shape
`{ code: number; message?: string; data?: unknown }`. This RFC does **not** redefine or reuse that
name for the v1 contract. The new discriminated boundary is `PluginCliInvocationResult`.

The existing `PluginCliResult`, `PluginCliCommand`, and `PluginCli` helpers remain source-compatible
during the major-1 migration window and may be marked deprecated only when a host compatibility
adapter exists. The adapter maps `code === 0` to a successful invocation and a nonzero code to
`plugin-failure`, retaining `{ kind: 'legacy-command-failed', legacyCode: code }` only as diagnostic
details. Changing the meaning of `PluginCliResult` or removing the compatibility export requires the
next public package/contract major; the name is never silently reassigned. The later implementation
epic must carry a dedicated migration child and consumer fixtures for this boundary.

### Capability grants and invocation ports

The following execution shapes are public because plugin handlers must compile without importing a
host adapter. They are capability-scoped ports, not `@netscript/cli` internals:

```ts
export type PluginCliOutputMode = 'text' | 'json';

export interface PluginCliInvocation {
  readonly commandId: string;
  readonly route: readonly string[];
  readonly arguments: Readonly<Record<string, PluginCliJson>>;
  readonly options: Readonly<Record<string, PluginCliJson>>;
  readonly outputMode: PluginCliOutputMode;
  readonly preview: boolean;
}

export interface PluginCliWorkspaceText {
  readonly path: string;
  readonly text: string;
  readonly sha256: string;
}

export interface PluginCliWorkspaceEntry {
  readonly path: string;
  readonly kind: 'file' | 'directory';
  readonly sha256?: string;
}

export interface PluginCliWorkspaceReadPort {
  readText(path: string, signal: AbortSignal): Promise<PluginCliWorkspaceText | undefined>;
  list(path: string, signal: AbortSignal): Promise<readonly PluginCliWorkspaceEntry[]>;
}

export interface PluginCliNetworkRequest {
  readonly url: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
}

export interface PluginCliNetworkResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}

export interface PluginCliNetworkPort {
  request(
    request: PluginCliNetworkRequest,
    signal: AbortSignal,
  ): Promise<PluginCliNetworkResponse>;
}

export interface PluginCliProcessRequest {
  readonly executable: string;
  readonly arguments: readonly string[];
  readonly cwd?: string;
  readonly environment?: Readonly<Record<string, string>>;
}

export interface PluginCliProcessResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface PluginCliProcessPort {
  run(request: PluginCliProcessRequest, signal: AbortSignal): Promise<PluginCliProcessResult>;
}

export interface PluginCliEnvironmentPort {
  read(name: string, signal: AbortSignal): Promise<string | undefined>;
}

export interface PluginCliSecretPort {
  read(name: string, signal: AbortSignal): Promise<string | undefined>;
}

export interface PluginCliInvocationContext {
  readonly signal: AbortSignal;
  readonly deadline: string;
  readonly grant: PluginCliCapabilityGrant;
  readonly workspace?: PluginCliWorkspaceReadPort;
  readonly network?: PluginCliNetworkPort;
  readonly process?: PluginCliProcessPort;
  readonly environment?: PluginCliEnvironmentPort;
  readonly secrets?: PluginCliSecretPort;
}

export type PluginCliHandler = (
  invocation: PluginCliInvocation,
) => Promise<PluginCliInvocationResult>;

export type PluginCliHandlerFactory = (
  context: PluginCliInvocationContext,
) => PluginCliHandler | Promise<PluginCliHandler>;
```

Every capability has one bounded meaning:

| Capability         | Port and bound                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `workspace:read`   | Read/list normalized project-relative paths beneath the selected workspace; no arbitrary path resolution or write method.  |
| `network:request`  | Host-mediated request constrained by configured origins, methods, byte limits, deadline, and redaction policy.             |
| `process:run`      | Direct executable plus argument vector under an allowlist; never a shell string, inherited environment, or free cwd.       |
| `environment:read` | Read a named allowlisted variable; enumeration and the host's full environment are unavailable.                            |
| `secret:read`      | Read a named configured secret through a redacting port; enumeration and inclusion in output or diagnostics are forbidden. |

Here `PluginCliCapability` is a permission token for one CLI invocation. It does not redefine the
docs-site use of “capability” for a first-class NetScript product area.

The host computes the grant as the intersection of the command's declared request, the installed
manifest pointer's advertised maximum, host policy, and invocation authorization. V1 capabilities
are required rather than optional: if any requested value is denied, the host returns
`capability-denied` before importing the handler or planner. Undeclared ports are absent, and each
granted port still policy-checks every operation. Ambient Deno read, write, network, environment,
process, FFI, and subprocess permissions are denied in the plugin execution boundary; capability
names authorize only the corresponding host-mediated ports.

This RFC chooses S2 review resolution **(a): `PluginCliCapabilityGrant` is shared with a host-side
diagnostic path**. When a request is denied, `PluginCliFailure.details` for `capability-denied`
contains a redacted `{ capabilityDecision: PluginCliCapabilityGrant }`; that is the public location
where `denied` is non-empty. The plugin module is not imported and cannot observe that decision.
When the same type reaches `PluginCliInvocationContext.grant` or `PluginCliGenerationContext.grant`,
its invariant is `denied.length === 0` and `granted` is element-for-element equal to `requested`.
Keeping one decision shape lets JSON diagnostics and successful invocation telemetry use the same
stable vocabulary without making denial recoverable inside plugin code.

Requested, granted, and denied arrays are unique and sorted in tuple order. The host includes only
capability names, never policy rules, authorization material, environment values, or secrets, in the
diagnostic copy. `deadline` is an RFC 3339 timestamp for portable diagnostics; the host enforces it
with its own monotonic timer rather than trusting plugin time or wall-clock comparisons.

### Discovery and generated-registry lifecycle

Discovery begins from the configured installed-plugin set and its explicit
`PluginCliManifestPointer` values. There is no directory convention, package-name inference,
`node_modules` traversal, or import-on-miss fallback. The pointer shape is public and parse-only:

```ts
export interface PluginCliManifestPointer {
  readonly plugin: string;
  readonly contract: PluginCliContractVersion;
  readonly module: `./${string}`;
  readonly export: string;
  readonly capabilities: readonly PluginCliCapability[];
}
```

`module` names the static contribution-definition entrypoint, not a handler. It follows the same
normalization, parent-traversal rejection, package-containment, export-map, and self-import rules as
handler and generator references. `capabilities` is the sorted union requested by every command in
the definition, allowing installation policy to be evaluated without importing the descriptor.

The host runs one full-replace registry transaction after successful plugin install, update, remove,
or maintainer sync and when the user explicitly invokes `netscript generate plugins`. That live
command remains authoritative and currently exposes `--dry-run`, `--project-root`, and `--verbose`.
Generation performs these phases in order:

1. Parse every configured installer pointer without importing plugin code.
2. Resolve and import only each static definition entrypoint in a bounded, permission-denied,
   terminable diagnostic boundary. Descriptor entrypoints may construct and export frozen data; they
   may not import a handler/planner, inspect the workspace or environment, call the network, spawn a
   process, mutate globals, or perform top-level filesystem work.
3. Validate pointer/definition identity, family and major, capability equality, descriptor grammar,
   mount openness, path containment, and the complete collision tree.
4. Canonically sort and serialize a candidate registry containing descriptor data and executable
   pointers, never imported factories or closures.
5. Commit the candidate atomically. A failed candidate leaves the previous registry file intact, but
   the previous file is not considered current when its input fingerprint differs.

The registry header records its schema version, generator version, canonical manifest-set digest,
exact package version/integrity or local-source identity, descriptor-source hashes, descriptor
digest, and generation timestamp. Startup recomputes the parse-only manifest/source fingerprint
without importing a plugin. A missing registry, unsupported registry schema, manifest newer than the
registry, changed pointer/version/integrity, or changed tracked local descriptor source marks it
stale.

Registry generation and an explicit doctor probe are the only descriptor-load phases. Validation of
the committed registry during ordinary startup, help, completion, and route selection is
import-free.

Missing or stale state fails closed for contributed routes. Built-in commands continue to work;
normal help/completion is built from built-ins plus intentional absent-owner stubs, not from an
untrusted stale registry. An attempted contributed route returns `handler-unavailable` with a
redacted detail kind such as `registry-missing` or `registry-stale` and remediation to run
`netscript generate plugins` followed by `netscript plugin doctor`. The host never silently
regenerates during startup, help, completion, or dispatch.

### Selected-handler asynchronous bootstrap

CLI startup, registry freshness validation, route parsing, help, and completion import no plugin
module. After a fresh registry selects one canonical route, the host performs this sequence:

1. Parse and validate arguments/options using the static descriptor.
2. Compute the complete capability grant and fail on any denial.
3. Create a host-owned, permission-denied, terminable execution boundary for that plugin and route.
4. Resolve, normalize, and import only the selected handler module, verify the named export is a
   `PluginCliHandlerFactory`, then invoke the factory with the narrowed context.
5. Invoke the returned handler and normalize its result at the host boundary.

A handler module may initialize immutable local constants and declare its factory at module load. It
may not read the workspace/environment, access a secret, call the network, spawn a process, write a
file, register global hooks, print, or run command behavior at import time. Those operations are
available only through granted ports after the factory is invoked.

Dynamic `import()` returns a promise but accepts no `AbortSignal`; racing that promise in the CLI
process would report a timeout without stopping module evaluation. Therefore bootstrap executes in a
boundary the host can terminate. The host owns both the user-cancellation controller and a
configurable absolute deadline, propagates the signal through the factory, handler, and every port,
and terminates the boundary when cancellation or deadline wins. If import plus factory creation does
not settle before the deadline, the host returns `bootstrap-timeout`; late resolution cannot attach
to the registry or emit output.

User cancellation is a host control outcome outside `PluginCliInvocationResult`; it terminates the
boundary and does not blame the plugin with a diagnostic code. If an already-created handler or
planner fails to settle by its invocation deadline, the host normalizes that executable failure to
`plugin-failure` with a redacted `execution-deadline` detail. `bootstrap-timeout` remains specific
to import and factory creation.

`handler-unavailable` means an installed plugin has a fresh selected registry entry but its module
cannot be resolved/imported, its export is absent, or the export has the wrong callable shape.
`plugin-failure` begins only after a callable factory or handler is reached and then throws an
unknown value. The host normalizes and redacts both classes; thrown values never become result data.
No failure removes or restarts a sibling plugin, disables a built-in, or changes the committed
registry.

### Isolation and plugin-absent UX

Each selected plugin invocation has its own cancellation, deadline, capability ports, buffered
output, and crash boundary. The host attributes diagnostics to plugin, command ID, canonical route,
and lifecycle phase without exposing secrets, raw thrown objects, host paths, or stack traces in
ordinary output. Text and JSON are rendered only after the boundary returns a normalized result.

`plugin-absent` is distinct from a broken installed plugin. It applies only when an explicitly
invoked host-declared optional route has an absent-owner stub and the owning plugin is not
installed. The diagnostic names the unavailable route and the expected plugin and includes a
host-authored, statically validated remediation command or documentation URL. The host must use a
command the installed CLI actually supports; it does not synthesize a package-install spelling.
Default help lists installed children and only those absent stubs the host intentionally marks
visible.

An installed plugin with a missing/stale registry or a bad executable pointer is
`handler-unavailable`, not `plugin-absent`. Capability refusal is `capability-denied`; a terminated
bootstrap is `bootstrap-timeout`; a post-bootstrap throw is `plugin-failure`. These stable
distinctions keep installation advice, repair advice, and plugin fault reports from collapsing into
one generic error.

### Host-owned generation plan and transaction

A generator definition points to an exported `PluginCliGeneratorFactory`. It follows the same safe
module/export validation as a handler but may declare only `workspace:read`:

```ts
export type PluginCliGenerationOperation =
  | {
    readonly kind: 'create';
    readonly path: string;
    readonly content: string;
  }
  | {
    readonly kind: 'modify';
    readonly path: string;
    readonly expectedSha256: string;
    readonly content: string;
  }
  | {
    readonly kind: 'delete';
    readonly path: string;
    readonly expectedSha256: string;
  }
  | {
    readonly kind: 'skip';
    readonly path: string;
    readonly reason: string;
  };

export interface PluginCliGenerationPlan {
  readonly planId: string;
  readonly operations: readonly PluginCliGenerationOperation[];
  readonly messages?: readonly PluginCliMessage[];
}

export interface PluginCliGenerationContext {
  readonly signal: AbortSignal;
  readonly deadline: string;
  readonly grant: PluginCliCapabilityGrant;
  readonly workspace: PluginCliWorkspaceReadPort;
}

export type PluginCliGenerationPlanner = (
  invocation: PluginCliInvocation,
) => Promise<PluginCliGenerationPlan>;

export type PluginCliGeneratorFactory = (
  context: PluginCliGenerationContext,
) => PluginCliGenerationPlanner | Promise<PluginCliGenerationPlanner>;
```

After route selection and capability approval, the host imports only that command's generator module
in the same terminable boundary used for handlers, verifies the factory, and invokes the returned
planner. A generator module has the same side-effect-free import-time rule as a handler module, and
a generator command never imports or invokes its `handler` because the fields are mutually
exclusive.

Planner output is preview-invariant. Given the same descriptor, parsed invocation fields other than
`preview`, capability grant, and workspace snapshot, a planner MUST return the same canonical
`PluginCliGenerationPlan` for preview and apply. It MUST NOT branch on `invocation.preview` while
constructing the plan; only the host execution mode controls whether the validated plan is rendered
without writes or enters mutation.

Plan contents are UTF-8 text and workspace-relative `/`-separated paths. The host rejects absolute
paths, URLs, empty segments, `.`/`..`, NULs, case-folded duplicates, symlink/reparse escapes,
conflicting operations, writes outside host-declared transaction roots, non-identical
create-over-existing, modify/delete digest mismatches, unsorted duplicate targets, and configured
size/count limits. An identical create or modify is normalized to `skip`. A plan contains no
callbacks, commands, network requests, post-scripts, binary handles, or host path. Invalid input
returns `plan-invalid` before any stage or workspace mutation exists.

This executor owns only generic plugin CLI workspace-plan mechanics. An adapter for
[RFC 0003](./0003-command-composition-kit.md) / #1490 may map consumer-owned command-store scaffold
output into `PluginCliGenerationPlan` and submit it to this shared executor. C6 MUST NOT parse
Prisma, choose provider SQL or indexes, own any part of migration creation/application/refusal, or
define command-store receipt, audit, outbox, or transaction semantics. Conversely, RFC 0003 / #1490
MUST NOT define another generic plugin CLI mount or a second workspace stage/rollback engine.

The transaction is an explicit host state machine:

```text
planned -> validated -> staged -> checked -> committing -> committed
                         |          |            |
                         +----------+------------+-> rolling-back -> rolled-back
                                                        |
                                                        +-> recovery-required
```

Preview stops after `validated`: it renders the canonical operation set and diagnostics and creates
no stage, lock, journal, file, subprocess, network request, or post-step. The current authoritative
registry command spells this mode `--dry-run`; contributed commands may expose a host-owned
`--preview`. Both select the same no-write transaction mode, and plugins never parse or implement
the flag themselves.

Apply acquires the host workspace-mutation lock, snapshots target digests, creates a host-owned
stage on the same filesystem, renders create/modify results there, represents deletes in the
journal, and runs the host-selected focused format/check/validation set against the staged view.
Immediately before commit it rechecks the source digests. A generated root that can be replaced by
one rename is swapped atomically; a multi-path commit uses a durable ordered journal and backups and
is atomic to cooperating NetScript commands under the lock. Success is reported only after every
operation is committed and the journal is cleared.

Validation is derived by the host from affected paths, never selected or suppressed by a plugin. If
a plan affects a public `packages/**` or `plugins/**` surface, apply includes structured checking,
the affected full export-map `deno doc --lint` bar, the repository's per-member publish dry-run,
exact internal `@netscript/*` dependency-pin checks, and runtime-asset/`import.meta` preflight where
applicable. Generated publish assets are checked-in TypeScript constants rather than runtime file
reads or import attributes. Preview names the gates that would run but executes no subprocess.

Any staging, validation, commit, or rollback error returns `commit-failed`. The host rolls back to
the recorded pre-commit bytes before releasing the lock. If process death prevents complete
rollback, the durable journal remains `recovery-required`; the next mutating command refuses to run
and doctor reports the exact recovery action. Byte-identical create/modify output becomes `skip`,
and final buffered output distinguishes planned, created, modified, deleted, and skipped paths in a
stable path order.

### Doctor integration and manifest-pointer ownership

The plugin publisher owns the two source declarations of `PluginCliManifestPointer` and must keep
them byte-for-byte equivalent after canonical key/capability ordering:

- the top-level parse-only `cli` block in published `scaffold.plugin.json`, which is the installer
  discovery and pre-import permission authority; and
- `PluginContributions.cli.contribution` in the runtime `definePlugin()` value, which is the runtime
  identity cross-check.

Only the pointer is repeated. The descriptor tree exists once at its exported module; handler and
planner code stay at their own referenced modules. The installer owns the installed manifest record,
and `@netscript/cli` owns the generated registry, input fingerprints, mutation journal, and doctor
report. Neither manifest is an alternate registry.

`netscript plugin doctor` checks, without repairing implicitly:

- installer/runtime pointer equality for plugin, family, major, module, export, and capabilities;
- supported family/major, normalized package-contained pointer, published export-map presence, and
  exact package version/integrity or local-source identity;
- pointer capability equality with the descriptor's sorted command-capability union;
- registry presence, schema support, input and descriptor digests, tracked-source freshness,
  canonical ordering, and absence of stale/removed entries;
- isolated descriptor-export load and shape without importing any handler or generator module;
- executable-pointer module and export-map reachability plus prior attributed load diagnostics; and
- abandoned stage/journal state, rollback/recovery requirements, and prior normalized bootstrap or
  transaction failures.

C6 doctor scope ends at generic CLI registry, workspace plan, and mutation-journal health. RFC 0003
/ #1490 exclusively reports command-store schema, migration, generated-bridge, transaction-client,
and database-specific validation health. Neither doctor surface diagnoses or repairs the other's
domain.

Doctor reports stable `ok`, `warning`, or `error` checks with remediation and a nonzero command
result when an error remains. It does not install, update, regenerate, rewrite pointers, grant a
capability, delete a journal, or execute a plugin handler. The live command currently accepts
`--project-root` and `--resource`; the latter names its diagnostic-evidence receipt and does not
change the checks.

The new top-level installer block is sequenced after the accepted manifest-forward-compatibility
prerequisite: the outer plugin manifest must permit future blocks, while the known `cli` block is
validated strictly. The live schema is still top-level `.strict()`, so this RFC describes a target
contract rather than claiming the pointer is shipped. Existing issue #1474 owns that prerequisite
and must be amended to the already-ratified `.passthrough()` outcome before implementation; this RFC
does not file or mutate it.

### Compatibility with accepted contribution RFCs

The adjacent contribution designs are compatibility authorities, not a common payload package. The
checkable rule is: reuse their lifecycle and ownership laws where the same failure class exists,
then give the `plugin-cli` axis its own family, schema, errors, and host adapter.

| Authority                                                                                     | Laws this RFC reuses                                                                                                                                                                                                                                                                | Payloads and behavior deliberately not shared                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accepted frontend design from PR #890                                                         | Parse-only explicit pointer; `(family, major)` negotiation; host-owned identity and collision checks; deterministic generated full replace-set including empty output; stage, check, atomic swap or rollback; stale/orphan doctor checks.                                           | No `FrontendManifestEnvelope`, route/island/zone/nav/theme union, Fresh host descriptor, gateway, CSS, or UI quarantine taxonomy appears in `@netscript/plugin/cli`. CLI mount/route identity and executable pointers remain CLI-owned.                                                                                                                                                                                        |
| [RFC 0001 — SDK client contributions](./0001-sdk-client-contributions.md)                     | NetScript-owned upstream-free public types; explicit module/export references; named family/major; duplicate rejection with both owners; order-independent successful composition; generated literal imports; stable redacted errors; activation is explicit rather than automatic. | An SDK `prepare()` callback, header/context/cache ownership, transport retry epoch, and SDK error class are not command descriptors or handlers. A CLI handler may call an SDK client, but the CLI router never imports SDK contributor types or treats install order as execution order.                                                                                                                                      |
| [RFC 0002 — runtime-versioned automation](./0002-runtime-versioned-automation.md)             | Registered families replace hardcoded topic/plugin switches; schemas and stable identities drive generation; one management contract serves multiple presentation callers; thin connector plugins compose rather than own host infrastructure.                                      | Runtime definitions, revision activation, stores, execution boundaries, and the `netscript automation` management contract stay runtime-owned. They may sit behind a CLI handler; they do not become `PluginCliCommandDefinition` fields or use the workspace generation transaction for durable runtime state.                                                                                                                |
| [RFC 0003 — command composition kit](./0003-command-composition-kit.md) and #1490 under #1363 | Contract-first definitions; `@netscript/service/commands` execution with consumer-owned composition; explicit cancellation; stable redacted failures; previewable scaffold output; and one implementation behind multiple callers.                                                  | A `CommandDefinition` is transactional business intent with idempotency, database receipt/audit/outbox, and same-commit laws. A `PluginCliInvocation` is presentation/dispatch input and promises none of those. An RFC-0003 adapter may map command-store scaffold output into a generic CLI workspace plan, but C6 does not own its provider, Prisma, migration, bridge, database-validation, or business-command semantics. |
| [RFC 0005 — DevTools contributions](./0005-devtools-contribution.md)                          | Named family/major, explicit pointer, generated static registry, provenance-aware collision diagnostics, order independent of discovery, host-owned replace-set transaction, empty removal output, byte-identical skip, and doctor visibility.                                      | No `ContributionEnvelope`, DevTools kind registry, panel/link/diagnostic payload, generated host process, host zone, or quarantine card crosses into the CLI axis. DevTools may contribute `devtools` commands through this seam, while its panels and generated host remain RFC 0005-owned.                                                                                                                                   |

These mappings are conformance obligations. Cross-consumer fixtures must prove the common laws with
each consumer's own payload type. Their envelope, definition, and result payload types must remain
distinct; assignability across those domain-bearing types is a failure, not reuse. Structurally
identical plain-JSON value aliases such as `PluginCliJson` and RFC 0003's `CommandJson` are expected
to be mutually assignable and are not evidence of coupling. The only dependency shared by deploy and
DevTools is the public `@netscript/plugin/cli` contract plus the private host adapter in
`@netscript/cli`. Neither imports the other's plugin, generator, or diagnostic types.

There are two intentional lifecycle differences. First, frontend and DevTools can quarantine one bad
visual contribution while retaining a host shell; a missing or stale CLI registry disables its
contributed routes because presenting an executable route the host cannot safely dispatch is worse
than omission. Second, RFC 0003 owns durable business rollback; this RFC's rollback restores
workspace bytes only. Tests must preserve those differences instead of forcing a universal envelope
or transaction abstraction.

### Deploy #904–#908 migration and supersession

The deploy proposal remains a first consumer, not a second general CLI architecture. After this RFC
is accepted, maintainers reconcile the already-open issues in place:

| Issue                                | Disposition after this RFC                                                                                                                                                                                                                                                                                             | Scope that remains deploy-owned                                                                                                                                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #904 — mount-children contract       | **General contract superseded.** Remove its deploy-local `CliCommandContribution`, builder, merger, and verifier ownership; amend it to a deploy conformance issue using `PluginCliContributionDefinition`.                                                                                                            | A `deploy` host mount fixture, reserved-name/duplicate-owner negatives, and deploy `verify-plugin` expectations.                                                                                                     |
| #905 — bootstrap/isolation/absent UX | **General host lifecycle superseded.** Fold its loader/bootstrap implementation into the shared host lifecycle child instead of creating a deploy loader.                                                                                                                                                              | Deploy-specific startup-budget, broken-deploy-plugin isolation, and absent-deploy-plugin remediation fixtures.                                                                                                       |
| #906 — doctor/tooling/axes           | **Split, not closed wholesale.** The CLI pointer, capabilities, and contribution doctor states are superseded by this RFC. Its independent installer `officialSource: tooling`, generic doctor-check migration, and broader contribution-axis questions remain only if a focused re-audit shows they are still needed. | Deploy tooling install/copy behavior and compatibility of any retained auth-doctor migration; no deploy-specific CLI pointer field.                                                                                  |
| #907 — deploy plugin composition     | **Migrated, not superseded.** Keep it as the thin deploy plugin implementation.                                                                                                                                                                                                                                        | Deploy target descriptors, permission profiles, credential/adapter diagnosis, core-only dependency, and deploy registry consumer proof. It declares the shared CLI pointer and imports only `@netscript/plugin/cli`. |
| #908 — deploy command children       | **Router mechanics superseded; command behavior retained.** It no longer defines a mount/router/capability API.                                                                                                                                                                                                        | `target add/remove`, `capabilities`, `cells apply`, secrets/rollback/emit/down grammar and deploy-domain behavior, expressed as shared descriptors, handlers, and generation plans.                                  |

Thus #904–#906 lose or split their general-host portions; #907 and #908 remain delivery work. No
issue closes merely because this RFC is merged. The deploy epic amends those issue bodies before
implementation so one PR cannot silently satisfy both a superseded host API and the accepted seam.

DevTools follows the same rule. Existing #1477 retains the generated DevTools host and
`devtools generate|start` behavior, but its command group is described through this seam. RFC 0005
continues to own the host process, panels, production exclusion, and DevTools registry. Deploy and
DevTools can therefore appear in the same CLI registry without either package importing the other;
the host detects collisions before importing either executable.

### Hardcoded host-command audit and migration

The audit distinguishes direct plugin coupling from generic legacy dispatch. At accepted S2 head
`7a5eb580a`, the real production occurrences are:

| Surface                                                                            | Finding                                                                                                                                                                                                           | Required disposition                                                                                                                                                                     |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/cli/src/public/features/plugins/plugins-group.ts:17-18,66-72,117-125`    | The public host imports and registers first-party `ai` and `auth` command factories directly. Adding another peer command group requires a host edit.                                                             | Migrate behavior-equivalent descriptors/handlers under the appropriate host-declared mount; retain help/exit/output snapshots; remove the direct imports only after those fixtures pass. |
| `packages/cli/src/local/features/plugins/plugins-group.ts:3,81-89`                 | The local contributor host separately hardcodes `auth`, so the two composition roots already disagree.                                                                                                            | Consume the same generated descriptor registry with local source resolution; no second local-only contribution API.                                                                      |
| `packages/plugin/src/sdk/discovery/ast-extractor.ts:4-8,29-31`                     | Core discovery recognizes only `defineJob`, `defineSaga`, and `defineWebhook`. This is builder/axis coupling rather than a CLI route, but it is the same closed-extension failure.                                | Existing #1093 remains the owner. The CLI epic depends on or amends its explicit-pointer outcome and does not add another walker rule.                                                   |
| `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts:96-130` | Generic framework verbs execute an entire package `./cli` subprocess with `-A`. This is not a hardcoded plugin name, but it is the legacy broad-permission execution seam the selected-handler boundary replaces. | Keep a compatibility adapter until install/info/update/remove consumers migrate; do not equate generic dispatch with safe selected-handler bootstrap.                                    |

The repository-wide `deno task quality:scan:repo` audit was run for S3 and returned zero findings
with seven existing allowances. That result proves the scanner's current equality/predicate rules,
not the absence of direct command coupling: the scanner does not flag a plugin-specific factory
import followed by `.command('ai' | 'auth', ...)`. The future migration child must add a focused
guard for direct host imports/registrations (or extend the scanner with a fixture) before deleting
the manual audit. Closed #745 is the enforcement precedent; open #1542 concerns scan-root coverage,
not this rule-shape gap, so neither is silently treated as an implementation owner.

### Amend/fold-first duplicate audit

This audit was refreshed from live GitHub state before proposing the roadmap. It is a board
reconciliation contract, not authorization to mutate the board:

| Existing issue              | Overlap with the later epic                                                             | Amend/fold-first result                                                                                                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #904–#908                   | Contract, bootstrap, doctor, deploy consumer, and deploy commands.                      | Apply the supersession table above; reuse all five issues rather than file deploy replacements.                                                                                                                       |
| #1093                       | Third-party explicit discovery and removal of the hardcoded builder table.              | Amend or depend on its generic discovery outcome; do not create another discovery child.                                                                                                                              |
| #1473                       | Path containment and scoped generator subprocesses.                                     | Reuse its resolver/permission gates in the shared generation child; do not duplicate its security fix.                                                                                                                |
| #1474                       | Top-level manifest `.passthrough()` prerequisite.                                       | Amend its now-stale “owner fork” wording to the already-ratified outcome, then use it as the prerequisite; do not file a replacement.                                                                                 |
| #1475                       | Transactional generated replace-set.                                                    | Amend/fold the host transaction primitive so CLI and DevTools share one host-owned implementation while keeping DevTools payload emission separate. Do not create a second transaction engine.                        |
| #1476                       | DevTools-specific doctor/quarantine states.                                             | Keep its payload diagnoses in RFC 0005; share only generic registry-freshness and transaction-residue checks.                                                                                                         |
| #1477                       | Generated DevTools host and command group.                                              | Amend the CLI-group portion to consume this seam; keep host generation/launch in the issue.                                                                                                                           |
| #1490 under #1363           | RFC-0003 command-store package, schema, migration, generated bridge, and provider work. | Keep those domain/database semantics exclusively in RFC 0003/#1490. Its adapter may emit `PluginCliGenerationPlan` for C6 execution; it must not define another generic CLI mount or workspace stage/rollback engine. |
| #946                        | Optional frontend convention discovery.                                                 | Keep separate. It may call the host generation transaction but cannot replace explicit pointers or own CLI discovery.                                                                                                 |
| #1354                       | Re-runnable resource-route slice generator with dry-run/idempotence/no-write negatives. | Keep separate as a generation-plan consumer. Only its optional plugin-contribution clause depends on contribution work.                                                                                               |
| #424 (closed)               | Historical dashboard CLI/auto-launch and flat URLs.                                     | Do not revive. RFC 0005 successors #1472/#1477 already own the surviving behavior.                                                                                                                                    |
| #745 (closed), #1542 (open) | Quality enforcement precedent and scan-root completeness.                               | Reuse #745's rule vocabulary; decide whether direct-registration detection amends #1542 or stays in the migration child. Do not mislabel a clean scan as a clean coupling audit.                                      |

Searches for `plugin CLI`, `CLI contribution`, `command contribution`, `generated registry`,
`transactional generator`, `manifest pointer`, and hardcoded plugin commands found no second open
general CLI-contribution RFC. A later epic author repeats the search immediately before filing,
because live GitHub wins over this snapshot. If an owner already exists, the proposed row is
amended/folded or becomes a dependency; “different epic” is not a reason to duplicate
infrastructure.

### JSR and publish-surface obligations

`jsrAudit.applicable` is true because the implementation changes published plugin contracts even
though this RFC leaf changes only documentation. The S0R measurements are the baseline; S3 carries
them forward without relabelling existing failures as success:

| Publishable surface                                 | Measured baseline                                                                                                                                                                                                                                                                           | Required implementation exit                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@netscript/plugin/cli`                             | The plugin package has 13 export-map entries. Full-map doc lint has 15 existing `private-type-ref` findings, including `applyScaffoldPlan` exposing private `ScaffoldArtifact`; `./cli` also lacks an `@module` tag. The package dry-run succeeds under its sanctioned slow-type carve-out. | The touched subpath has zero doc-lint diagnostics, explicit isolated-declaration-safe annotations on recursive builders/factories, module and symbol docs with runnable examples, a reviewed clean publish file list, ESM-only code, and no new package-wide diagnostic. The carve-out is not permission to add slow types. |
| `@netscript/plugin/protocol` and `./config`         | Exported and published today; installer schema is top-level `.strict()` and runtime `cli` contribution is shallow. Internal `@netscript/*` pins measured exact.                                                                                                                             | Forward-compat and malformed-pointer phase fixtures, documented family/major/errors, exact release-matched internal pins, and consumer imports from every new/changed export. Known pointer blocks stay strict even when the outer manifest passes through unknown keys.                                                    |
| `@netscript/cli`                                    | Three export-map entries, full-map doc lint clean, per-member dry-run green, but `isolatedDeclarations` is disabled. Templates/assets are part of the publish set.                                                                                                                          | Registry, Cliffy, bootstrap, and transaction adapters remain private. Any public testing helper has explicit declarations and docs. Dry-run file lists, `deno doc --lint`, and a packed/JSR consumer prove no accidental host-internal export.                                                                              |
| First-party deploy/DevTools/other consumer subpaths | Not one homogeneous package surface; each plugin's export map and publish include differ.                                                                                                                                                                                                   | Each consumer audits its complete export map and publish list, exact internal pins, README permissions/examples, import-side-effect safety, no self-import, and clean consumer import. A consumer cannot inherit the core package receipt.                                                                                  |

Every publishable child runs the repository JSR audit, full export-map doc lint, canonical
per-member publish dry-run, and a clean consumer install/import. Recursive generics and inferred
async factories receive explicit annotations. Internal imports within `@netscript/plugin` are
relative, never the package's own bare JSR subpath. Generated descriptor/registry assets are
checked-in TypeScript constants or intentionally published source; runtime `Deno.read*`, import
attributes, and unguarded `import.meta.url` filesystem resolution are release blockers even when
local dry-run passes. A dry run is static evidence, not publication or remote-graph proof.

Exact internal `@netscript/*` versions are release-matched pins, not ranges. The implementation uses
the repository dependency/publish wrappers and runs an isolated-declaration probe for the new public
symbols. It never uses an ad-hoc registry query, local publication, or a green package-wide baseline
to waive a touched-subpath failure.

### Later implementation epic and PR-sized children

This RFC proposes, but does **not file**, an epic titled **“Epic: Typed plugin CLI contributions”**.
If filed later, it uses `type:umbrella`, `epic:cli-contrib`, `area:cli`, `area:plugins`, the
coordinator-selected priority and milestone, and **no closing keyword**. It closes manually only
after every child is complete. Every child body says `Part of #<epic>`; exactly one PR resolves each
child issue and that PR uses `Closes #<child>`. This RFC PR's `Closes #1502` completes only the RFC
tracking issue and does not close or pre-file future implementation work.

The dependency-ordered work proposal is below. C1–C7 and C10 are each one new PR-sized child. C8 and
C9 are reuse groups, not mega-children: after their bodies are amended, every referenced open issue
remains one PR-sized child with one resolving PR. The grouping only makes the cross-consumer
dependency order legible.

| Order/group    | Proposed work item                                                                                                              | Board disposition before filing                                                                                                                                                                                                                                                                               | Primary exit evidence                                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1             | Manifest forward compatibility and strict `cli` pointer validation.                                                             | Amend/use #1474; no new issue unless it closes independently before adoption.                                                                                                                                                                                                                                 | Old CLI ignores unknown outer block; malformed known pointer fails at generation; plugin package gates and JSR audit.                                                                                                                        |
| C2             | `@netscript/plugin/cli` v1 descriptor, builder, result, diagnostic, capability, handler, and generator contracts.               | New shared-contract child only after #904/#906 are narrowed; it must not duplicate their deploy-local types.                                                                                                                                                                                                  | Archetype-4 type/conformance suite, full export-map docs, isolated-declaration probe, dry-run and consumer import.                                                                                                                           |
| C3             | Runtime `PluginContributions.cli` axis, installer/runtime equality, owner-aware merger, mount registry, and collision verifier. | Amend/fold generic portions of #904/#906 and depend on #1093's discovery outcome.                                                                                                                                                                                                                             | Permutation/collision/owner-provenance fixtures; no host plugin-name switch; plugin protocol/config gates.                                                                                                                                   |
| C4             | Generated CLI registry and install/update/remove/sync lifecycle.                                                                | Amend/fold shared infrastructure with #1475; keep its DevTools emitter payload separate.                                                                                                                                                                                                                      | Full replace-set, empty removal, fingerprint freshness, byte-identical skip, staged validation and atomic swap.                                                                                                                              |
| C5             | Selected-only bootstrap, isolation, cancellation/deadline, import-free help/completion, and absent UX.                          | Amend/use #905 rather than filing an equivalent host-bootstrap issue.                                                                                                                                                                                                                                         | Plugin-less startup budget; sibling isolation; denial-before-import; timeout/cancel; help/completion no-load fixtures.                                                                                                                       |
| C6             | Generic plugin CLI workspace-plan executor and registry/plan/journal doctor integration.                                        | Reuse #1473 containment/scoping and #1475 transaction. RFC 0003/#1490 under #1363 exclusively owns command-store provider, Prisma, migration, bridge, database-validation, and business-transaction semantics; its adapter may submit a plan but neither side creates a second generic stage/rollback engine. | Preview-invariant canonical text plan; preview zero-effect; path/symlink/digest negatives; common stage/check/commit/rollback and crash recovery; generic registry/plan/journal doctor states; separate RFC-0003 command-store doctor proof. |
| C7             | Legacy CLI compatibility: current `PluginCli*`, direct public/local `ai`/`auth` groups, and broad `./cli -A` dispatch.          | New migration child only if a final search finds no owner; decide whether the direct-registration guard amends #1542.                                                                                                                                                                                         | Help/output/exit snapshots, adapter parity, zero direct plugin factory imports in host composition, strengthened quality guard, deprecation window.                                                                                          |
| C8 reuse group | Deploy consumer conformance, partitioned along the five existing #904–#908 issue boundaries.                                    | Amend and deliver each existing issue independently; file no replacement deploy child.                                                                                                                                                                                                                        | Shared descriptors under `deploy`; target grammar/generation behavior; no DevTools import; per-issue deploy package JSR/conformance gates.                                                                                                   |
| C9 reuse group | DevTools consumer conformance, partitioned along existing #1475, #1476, and #1477 boundaries.                                   | Amend and deliver each existing issue independently; file no replacement DevTools command child.                                                                                                                                                                                                              | Shared `devtools` descriptors/generation caller; generated host remains RFC 0005-owned; no deploy import; per-issue DevTools gates.                                                                                                          |
| C10            | Documentation, public testing kit, JSR consumer matrix, and cross-consumer conformance.                                         | New only after searching for a docs/testing owner; fold any matching accepted issue.                                                                                                                                                                                                                          | Executable author guide, testing exports, deploy+DevTools synthetic consumers, full JSR/docs/compatibility evidence.                                                                                                                         |

C1 precedes all manifest-visible work. C2 precedes C3–C7. C3 and the transaction prerequisites
precede consumers. C8/C9 can proceed in parallel only after the shared contracts and host lifecycle
they consume are merged. C10 is the integration proof, not a substitute for per-child gates.

Every implementation child carries the complete applicable Archetype-4 fitness manifest: F-1 file
size, F-2 helper reinvention, F-3 layering, F-4 inheritance, F-5 public surface, F-6 JSR
publishability, F-7 documentation score, F-8 workspace `lib` override, F-9 permissions, F-10 test
shape, F-11 forbidden folders, F-12 naming, F-14 console use, F-15 upstream re-exports, F-16 folder
cardinality, F-17 abstract/derived co-location, F-18 sub-barrels, and F-19 scoped runners. A child
may mark one inapplicable only with a path-based reason in its own locked plan. CLI-host children
also run the Archetype-6/quality gates required by their actual files. No child inherits another
child's JSR or publish receipt.

Nothing in this roadmap is filed, assigned a milestone, or added to an existing epic by this RFC
leaf. The authorized later epic owner repeats the duplicate audit, obtains coordinator scope, then
amends/folds existing issues before creating only the genuinely missing children.

## Drawbacks

- A static descriptor duplicates some information a CLI library could infer from executable command
  objects. That duplication is intentional: help, completion, validation, and discovery must not
  execute plugin code.
- Host-declared mounts constrain experimentation. The constraint prevents namespace capture and
  makes top-level CLI growth an explicit host compatibility decision.
- A versioned public DSL increases documentation and migration cost. It also makes the cost visible
  instead of exporting host implementation details accidentally.
- Keeping a compatibility adapter temporarily preserves two authoring models. The alternative is an
  unannounced breaking redefinition of published symbols.
- Generation plans are UTF-8 text only in contract major 1. A plugin cannot emit an image, archive,
  font, or other binary asset through this seam; binary assets must already ship in a package or be
  handled by a later explicitly bounded binary operation with its own size, digest, preview, and
  publishability rules.

## Rationale and alternatives

### Why this design

The design follows the doctrine's public-types-first and composition-root rules while using the
existing package owner. Static data gives the host one safe input for routing, help, completion,
doctor, and registry generation. Lazy handler references keep executable behavior outside that
input, and a narrow serializable result keeps presentation and process policy at the edge.

### Rejected alternatives

- **Expose Cliffy commands to plugins.** This couples every plugin to a host dependency and leaks
  parsing/rendering lifecycle into the public contract.
- **Keep extending the abstract `PluginCli` base.** Inheritance makes the executable object the
  discovery unit and cannot provide import-safe help or completion.
- **Allow arbitrary top-level plugin commands.** This creates global namespace capture and makes
  built-in compatibility depend on install order.
- **Scan packages or `node_modules` at runtime.** Discovery becomes ambient, slow, and difficult to
  audit. The accepted NetScript contribution designs use explicit pointers and generated registries.
- **Reuse a frontend or DevTools envelope.** Their family and payload semantics are different named
  extension axes. Sharing lifecycle laws does not justify cross-domain types.
- **Redefine `PluginCliResult` in place.** It is a live JSR-published symbol. Reassignment would be
  a breaking compatibility event disguised as spelling.

### Impact of not doing this

New plugin command families continue to require host edits or private imports, deploy and DevTools
grow parallel generators, help and completion execute too much code, and collision/error semantics
remain consumer-specific.

## Breaking changes and migration

The proposal is additive at the initial major-1 introduction because existing helpers remain
exported and adapted. It becomes breaking only when those helpers are removed, when an existing
descriptor field changes meaning, or when a published symbol is reassigned. Those changes require a
new public major, documented compatibility window, deprecation evidence, and consumer migration.

The `PluginCliResult` collision is resolved now: v1 introduces `PluginCliInvocationResult`; it does
not redefine the published name. The later C7 migration retains adapters and behavior snapshots
until direct `ai`/`auth` registrations and broad package-CLI dispatch have equivalent shared-seam
coverage; removal or semantic reassignment waits for the next public major.

## Prior art

- [RFC 0003](./0003-command-composition-kit.md) and #1490 keep business-command execution in
  `@netscript/service/commands` with consumer-owned composition and exclusively own command-store
  persistence, schema, migration, bridge, and database-validation semantics. This RFC treats that
  domain as a handler-level consumer whose scaffold adapter may submit a generic workspace plan.
- [RFC 0005](./0005-devtools-contribution.md) establishes explicit family/version identity, static
  pointers, generated registries, collision provenance, and transaction ownership for another named
  contribution axis. This RFC reuses those laws, not its payloads.
- The accepted frontend, SDK, and runtime contribution designs similarly separate static discovery
  from executable behavior. The compatibility matrix above fixes the reused laws and rejected
  payload sharing.

## Unresolved questions

The architecture is locked. Discussion may still choose the initial host extensible-mount list,
exact numeric exit mapping, default descriptor size/depth budgets, and wording for unavailable
optional commands. None may change public ownership, permit arbitrary top-level mounts, make help or
completion execute plugin code, or move mutation into a plugin.

## Future possibilities

- Capability-gated dynamic completion under a later contract major.
- New host-declared extensible mounts added through ordinary host compatibility review.
- Additional static value kinds after older-host ignore behavior is proven.
- A testing kit that renders descriptor fixtures through multiple shell adapters.
