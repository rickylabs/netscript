/**
 * Data-driven plugin manifest verification.
 *
 * `verifyPlugin` replaces the hand-rolled per-plugin verifiers: each plugin
 * supplies a {@link PluginExpectations} description of the contribution axes it
 * must expose, and this module runs only the checks whose expectation is
 * present, producing a stable, human-readable findings list plus the
 * {@link InspectionReport} from {@link inspectPlugin}.
 *
 * Each checked item carries the exact `message` it emits on failure, so plugin
 * verifiers preserve their existing finding wording verbatim while sharing one
 * implementation.
 *
 * @module
 */

import { type InspectablePluginManifest, type InspectionReport, inspectPlugin } from './mod.ts';

/**
 * Manifest shape consumed by {@link verifyPlugin}.
 *
 * Mirrors the subset of the plugin manifest the per-plugin verifiers read. All
 * contribution axes are optional so the same structural type fits every plugin
 * archetype; missing axes simply yield findings when an expectation requires
 * them.
 */
export interface VerifiablePluginManifest extends InspectablePluginManifest {
  /** Plugin dependency manifest keyed by dependency alias. */
  readonly dependencies?: Readonly<Record<string, unknown>>;
  /** Contribution groups keyed by contribution axis. */
  readonly contributions?: VerifiableContributions;
}

/** Contribution axes read by {@link verifyPlugin}. */
export interface VerifiableContributions {
  /** Service contributions. */
  readonly services?: readonly VerifiableNamedContribution[];
  /** Background processor contributions. */
  readonly backgroundProcessors?: readonly VerifiableNamedContribution[];
  /** Stream topic contributions. */
  readonly streamTopics?: readonly VerifiableNamedContribution[];
  /** Telemetry contributions. */
  readonly telemetry?: readonly VerifiableNamedContribution[];
  /** Runtime config topic contributions. */
  readonly runtimeConfigTopics?: readonly VerifiableRuntimeConfigContribution[];
  /** Database schema contributions. */
  readonly databaseSchemas?: readonly VerifiableDbSchemaContribution[];
  /** Contract version contributions. */
  readonly contractVersions?: readonly VerifiableContractContribution[];
  /** End-to-end gate contributions. */
  readonly e2e?: readonly VerifiableE2eContribution[];
  /** Aspire contribution module path. */
  readonly aspire?: string;
}

/**
 * Contribution carrying a `name`, optionally an `entrypoint` and `port`.
 *
 * All fields are optional so concrete plugin manifest contribution types
 * (whose fields may themselves be optional) remain structurally assignable;
 * {@link verifyPlugin} reads each field defensively.
 */
export interface VerifiableNamedContribution {
  /** Contribution name. */
  readonly name?: string;
  /** Optional service entrypoint module path. */
  readonly entrypoint?: string;
  /** Optional service port. */
  readonly port?: number;
}

/** Runtime config topic contribution (fields optional for structural assignability). */
export interface VerifiableRuntimeConfigContribution {
  /** Topic name. */
  readonly name?: string;
  /** Optional JSON schema module path. */
  readonly schemaPath?: string;
}

/** Database schema contribution (fields optional for structural assignability). */
export interface VerifiableDbSchemaContribution {
  /** Schema file path. */
  readonly path?: string;
  /** Database engine identifier. */
  readonly engine?: string;
}

/** Contract version contribution (fields optional for structural assignability). */
export interface VerifiableContractContribution {
  /** Contract version label. */
  readonly version?: string;
  /** Contract loader module path. */
  readonly loader?: string;
}

/** End-to-end gate contribution (fields optional for structural assignability). */
export interface VerifiableE2eContribution {
  /** Gate name. */
  readonly name?: string;
  /** Gate command. */
  readonly command?: string;
}

/** Expected service contribution, matched by name and optional entrypoint/port. */
export interface ExpectedService {
  /** Expected contribution name. */
  readonly name: string;
  /** Expected service entrypoint module path, when matched on entrypoint. */
  readonly entrypoint?: string;
  /** Expected service port, when matched on port. */
  readonly port?: number;
  /** Finding emitted when no matching service contribution is found. */
  readonly message: string;
}

/** Expected named contribution (processor, stream topic, telemetry), matched by name. */
export interface ExpectedNamed {
  /** Expected contribution name. */
  readonly name: string;
  /** Finding emitted when no matching contribution is found. */
  readonly message: string;
}

/** Expected database schema contribution, matched by path and engine. */
export interface ExpectedDbSchema {
  /** Expected schema file path. */
  readonly path: string;
  /** Expected database engine identifier. */
  readonly engine: string;
  /** Finding emitted when no matching schema contribution is found. */
  readonly message: string;
}

/** Expected contract version contribution, matched by version and loader. */
export interface ExpectedContractVersion {
  /** Expected contract version label. */
  readonly version: string;
  /** Expected contract loader module path. */
  readonly loader: string;
  /** Finding emitted when no matching contract contribution is found. */
  readonly message: string;
}

/** Expected runtime config topic contribution, matched by name and optional schemaPath. */
export interface ExpectedRuntimeConfigTopic {
  /** Expected topic name. */
  readonly name: string;
  /** Expected JSON schema module path, when matched on schemaPath. */
  readonly schemaPath?: string;
  /** Finding emitted when no matching topic contribution is found. */
  readonly message: string;
}

/** Expected end-to-end gate contribution, matched by name and optional command. */
export interface ExpectedE2eGate {
  /** Expected gate name. */
  readonly name: string;
  /** Expected gate command, when matched on command. */
  readonly command?: string;
  /** Finding emitted when no matching gate contribution is found. */
  readonly message: string;
}

/** Expected plugin dependency alias and the finding emitted when it is absent. */
export interface ExpectedDependency {
  /** Dependency alias that must be truthy on `manifest.dependencies`. */
  readonly alias: string;
  /** Finding emitted when the dependency is absent. */
  readonly message: string;
}

/** Expected manifest-level helper function and the finding emitted when it is absent. */
export interface ExpectedHelper {
  /** Manifest key that must be typed `function`. */
  readonly key: string;
  /** Finding emitted when the helper is absent. */
  readonly message: string;
}

/** Expected Aspire contribution module path and the finding emitted on mismatch. */
export interface ExpectedAspire {
  /** Expected Aspire contribution module path. */
  readonly module: string;
  /** Finding emitted when the Aspire module path does not match. */
  readonly message: string;
}

/**
 * Declarative description of the manifest a plugin is expected to expose.
 *
 * Only the checks whose expectation is present run; an absent field is not
 * verified. This is a pure data contract — no behavior — so each plugin's
 * `verify-plugin.ts` collapses to a single {@link verifyPlugin} call. Each
 * checked item carries the exact `message` it emits on failure to preserve
 * existing finding wording.
 */
export interface PluginExpectations {
  /** Expected plugin package name. */
  readonly name: string;
  /** Expected plugin version (derive from the plugin's `deno.json`). */
  readonly version?: string;
  /** Expected dependency aliases. */
  readonly dependencies?: readonly ExpectedDependency[];
  /** Expected service contributions. */
  readonly services?: readonly ExpectedService[];
  /** Expected background processor contributions. */
  readonly backgroundProcessors?: readonly ExpectedNamed[];
  /** Expected stream topic contributions. */
  readonly streamTopics?: readonly ExpectedNamed[];
  /** Expected telemetry contributions. */
  readonly telemetry?: readonly ExpectedNamed[];
  /** Expected runtime config topic contributions. */
  readonly runtimeConfigTopics?: readonly ExpectedRuntimeConfigTopic[];
  /** Expected database schema contributions. */
  readonly databaseSchemas?: readonly ExpectedDbSchema[];
  /** Expected contract version contributions. */
  readonly contractVersions?: readonly ExpectedContractVersion[];
  /** Expected end-to-end gate contributions. */
  readonly e2e?: readonly ExpectedE2eGate[];
  /** Expected Aspire contribution module path. */
  readonly aspire?: ExpectedAspire;
  /** Expected manifest-level helper functions. */
  readonly helpers?: readonly ExpectedHelper[];
}

/** Result returned by {@link verifyPlugin}. */
export interface PluginVerificationResult {
  /** Whether the manifest satisfied every supplied expectation. */
  readonly ok: boolean;
  /** Plugin inspector report for the manifest. */
  readonly inspection: InspectionReport;
  /** Human-readable verification findings (empty when `ok` is `true`). */
  readonly findings: readonly string[];
}

function matchesService(
  contribution: VerifiableNamedContribution,
  expected: ExpectedService,
): boolean {
  if (contribution.name !== expected.name) return false;
  if (expected.entrypoint !== undefined && contribution.entrypoint !== expected.entrypoint) {
    return false;
  }
  if (expected.port !== undefined && contribution.port !== expected.port) return false;
  return true;
}

/**
 * Verify a plugin manifest against a declarative set of expectations.
 *
 * Runs only the checks whose expectation is present, then attaches the
 * {@link inspectPlugin} report. Findings reuse each expectation's `message`
 * verbatim; `ok` is `true` only when every supplied expectation holds.
 *
 * @param manifest - The plugin manifest to verify.
 * @param expectations - Declarative description of the expected manifest.
 * @returns A {@link PluginVerificationResult} with `ok`, `inspection`, and `findings`.
 *
 * @example Verify a plugin manifest
 * ```ts
 * import { definePlugin, verifyPlugin } from "@netscript/plugin";
 *
 * const plugin = definePlugin("@example/plugin", "0.0.1-alpha.0").build();
 * const result = verifyPlugin(plugin, {
 *   name: "@example/plugin",
 *   version: "0.0.1-alpha.0",
 * });
 *
 * console.log(result.ok, result.findings);
 * ```
 */
export function verifyPlugin(
  manifest: VerifiablePluginManifest,
  expectations: PluginExpectations,
): PluginVerificationResult {
  const findings: string[] = [];
  const inspection = inspectPlugin(manifest);
  const contributions: VerifiableContributions = manifest.contributions ?? {};

  if (manifest.name !== expectations.name) {
    findings.push(`expected plugin name ${expectations.name}, got ${manifest.name}`);
  }

  if (expectations.version !== undefined && manifest.version !== expectations.version) {
    findings.push(`expected version ${expectations.version}, got ${manifest.version}`);
  }

  for (const dependency of expectations.dependencies ?? []) {
    if (!manifest.dependencies?.[dependency.alias]) {
      findings.push(dependency.message);
    }
  }

  for (const expected of expectations.services ?? []) {
    const services = contributions.services ?? [];
    if (!services.some((service) => matchesService(service, expected))) {
      findings.push(expected.message);
    }
  }

  for (const expected of expectations.backgroundProcessors ?? []) {
    const processors = contributions.backgroundProcessors ?? [];
    if (!processors.some((processor) => processor.name === expected.name)) {
      findings.push(expected.message);
    }
  }

  for (const expected of expectations.streamTopics ?? []) {
    const topics = contributions.streamTopics ?? [];
    if (!topics.some((topic) => topic.name === expected.name)) {
      findings.push(expected.message);
    }
  }

  for (const expected of expectations.telemetry ?? []) {
    const telemetry = contributions.telemetry ?? [];
    if (!telemetry.some((entry) => entry.name === expected.name)) {
      findings.push(expected.message);
    }
  }

  for (const expected of expectations.runtimeConfigTopics ?? []) {
    const topics = contributions.runtimeConfigTopics ?? [];
    const matched = topics.some((topic) => {
      if (topic.name !== expected.name) return false;
      if (expected.schemaPath !== undefined && topic.schemaPath !== expected.schemaPath) {
        return false;
      }
      return true;
    });
    if (!matched) findings.push(expected.message);
  }

  for (const expected of expectations.databaseSchemas ?? []) {
    const schemas = contributions.databaseSchemas ?? [];
    const matched = schemas.some(
      (schema) => schema.path === expected.path && schema.engine === expected.engine,
    );
    if (!matched) findings.push(expected.message);
  }

  for (const expected of expectations.contractVersions ?? []) {
    const contracts = contributions.contractVersions ?? [];
    const matched = contracts.some(
      (contract) => contract.version === expected.version && contract.loader === expected.loader,
    );
    if (!matched) findings.push(expected.message);
  }

  for (const expected of expectations.e2e ?? []) {
    const gates = contributions.e2e ?? [];
    const matched = gates.some((gate) => {
      if (gate.name !== expected.name) return false;
      if (expected.command !== undefined && gate.command !== expected.command) return false;
      return true;
    });
    if (!matched) findings.push(expected.message);
  }

  if (expectations.aspire !== undefined && contributions.aspire !== expectations.aspire.module) {
    findings.push(expectations.aspire.message);
  }

  for (const helper of expectations.helpers ?? []) {
    if (typeof Reflect.get(manifest, helper.key) !== 'function') {
      findings.push(helper.message);
    }
  }

  return {
    ok: findings.length === 0,
    inspection,
    findings,
  };
}

/**
 * Print a {@link PluginVerificationResult} as JSON and set the process exit code.
 *
 * Collapses each plugin `verify-plugin.ts` `import.meta.main` block to a single
 * call. Sets `Deno.exitCode` to `0` when `result.ok` is `true`, else `1`.
 *
 * @param result - The verification result to render and signal.
 *
 * @example Run a verifier as a CLI
 * ```ts
 * if (import.meta.main) {
 *   runPluginVerificationCli(verifyMyPlugin());
 * }
 * ```
 */
export function runPluginVerificationCli(result: PluginVerificationResult): void {
  console.log(JSON.stringify(result, null, 2));
  Deno.exitCode = result.ok ? 0 : 1;
}
