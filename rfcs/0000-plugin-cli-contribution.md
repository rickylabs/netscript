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
aliases, capabilities, stable identifiers, and package-relative handler references without
constructing a host command object or executing plugin code. The host validates the complete route
tree before parsing, derives help and shell completion from the static descriptors, and imports only
the selected handler when a command is invoked.

This draft is being authored in reviewable slices. The public ownership, descriptor, router,
help/completion, and error contract are normative below. Discovery, bootstrap isolation,
transactional generation, doctor integration, compatibility with adjacent RFCs, and the later
implementation roadmap are completed by the following RFC slices; no product implementation is part
of this RFC PR.

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
| Workspace staging, validation, atomic commit/rollback, process execution                         | `@netscript/cli`        | no                               |
| Domain command behavior and domain failure details                                               | contributing plugin     | only through the shared contract |

`@netscript/plugin/cli` must not import `@netscript/cli`. A contributing plugin must not import
another plugin, deploy, DevTools, or a host-internal adapter. The host may depend on the public
plugin contract, but none of its adapter types leak back through that surface.

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
>(definition: TDefinition): Readonly<TDefinition>;
```

The concrete `PluginCliCapability` union and generation fields are completed with the S2 security
and transaction model. Their placement is fixed here; their values are not improvised in S1.

#### Descriptor invariants

- `plugin`, command `id`, option `id`, and handler `export` are non-empty stable identifiers.
- A route `segment`, alias, and option spelling is a normalized token, not a path or shell fragment.
- Handler modules are package-relative `./...` references. Absolute paths, URLs, bare specifiers,
  parent traversal, and self-import through a published JSR specifier are invalid.
- A command has a handler, children, or both. A leaf without a handler is invalid.
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
2. Validate the combined tree before any user argument is parsed or any handler module is imported.

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

Framework diagnostic codes form a finite exported tuple with a derived union. S1 reserves at least
these stable meanings: `descriptor-invalid`, `mount-closed`, `reserved-route`, `duplicate-route`,
`duplicate-alias`, `duplicate-option`, `duplicate-command-id`, `handler-unavailable`,
`plugin-absent`, `capability-denied`, `bootstrap-timeout`, `plugin-failure`, `plan-invalid`, and
`commit-failed`. Later slices specify the lifecycle phase and remediation data for each code without
changing these ownership rules.

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
adapter exists. The adapter maps `code === 0` to a successful invocation and a nonzero code to a
stable `legacy-command-failed` failure while retaining the legacy code only as diagnostic details.
Changing the meaning of `PluginCliResult` or removing the compatibility export requires the next
public package/contract major; the name is never silently reassigned. The later implementation epic
must carry a dedicated migration child and consumer fixtures for this boundary.

### S2 and S3 normative sections still to be completed

The next RFC slices complete, without changing the S1 ownership boundary:

- discovery and generated-registry lifecycle;
- selected-handler async bootstrap, cancellation, isolation, and plugin-absent UX;
- capability grants and the host-owned generation transaction, preview/no-write, rollback, doctor,
  and manifest pointer contract;
- compatibility with accepted frontend, SDK, runtime, command-composition, and DevTools RFCs;
- deploy #904–#908 supersession, duplicate audit, JSR obligations, and the later epic roadmap.

These are explicit draft gaps, not implementation discretion.

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
not redefine the published name. Broader migration mechanics and the hardcoded host-command audit
are completed in S3.

## Prior art

- [RFC 0003](./0003-command-composition-kit.md) keeps business-command execution and persistence
  semantics distinct from CLI presentation; this RFC treats it as a handler-level consumer.
- [RFC 0005](./0005-devtools-contribution.md) establishes explicit family/version identity, static
  pointers, generated registries, collision provenance, and transaction ownership for another named
  contribution axis. This RFC reuses those laws, not its payloads.
- The accepted frontend, SDK, and runtime contribution designs similarly separate static discovery
  from executable behavior. Their compatibility relationship is made explicit in S3.

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
