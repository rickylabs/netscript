import { assertEquals } from "@std/assert";
import { fromFileUrl } from "@std/path/from-file-url";
import { join } from "@std/path";
import {
  buildBackgroundProcessorEntry,
  buildPluginEntry,
} from "../../../../kernel/adapters/plugin/appsettings-entry-builders.ts";
import { DenoFileSystem } from "../../../../kernel/adapters/runtime/file-system/deno-file-system.ts";
import { PluginKindRegistry } from "../../../../kernel/application/registries/plugin-kind-registry.ts";
import type { PluginScaffoldResult } from "../../../../kernel/domain/plugin-kind.ts";
import { resolveLocalPluginDescriptor } from "./install-plugin.ts";

const SHIPPED_PLUGIN_NAMES: readonly string[] = [
  "ai",
  "auth",
  "sagas",
  "streams",
  "triggers",
  "workers",
];
const PLUGINS_ROOT = fromFileUrl(
  new URL("../../../../../../../plugins/", import.meta.url),
);

Deno.test("shipped manifests preserve their declared appsettings projections", async () => {
  for (const pluginName of SHIPPED_PLUGIN_NAMES) {
    const registry = new PluginKindRegistry([]);
    const resolved = await resolveLocalPluginDescriptor(
      join(PLUGINS_ROOT, pluginName),
      registry,
      new DenoFileSystem(),
    );
    if (resolved.planningKind === undefined) {
      throw new Error(`${pluginName} did not register a manifest provider`);
    }
    const provider = registry.get(resolved.planningKind);
    const serviceEntrypoint = provider.defaultServiceEntrypoint;
    const scaffoldResult: PluginScaffoldResult = {
      scaffoldResult: {
        filesCreated: [],
        directoriesCreated: [],
        filesSkipped: [],
        totalOperations: 0,
        durationMs: 0,
      },
      pluginDir: `/workspace/plugins/${pluginName}`,
      kind: provider.kind,
      port: 8124,
      servicePort: 8123,
      configSection: provider.category === "plugin"
        ? "Plugins"
        : "BackgroundProcessors",
      configKey: pluginName,
      serviceConfigKey: `${pluginName}-api`,
      backgroundWorkdir: ".",
      serviceWorkdir: ".",
    };

    if (serviceEntrypoint === null) {
      assertEquals(
        buildPluginEntry(
          { ...scaffoldResult, serviceWorkdir: undefined },
          provider,
          {},
        ),
        undefined,
        `${pluginName} service-less appsettings projection changed`,
      );
      continue;
    }

    assertEquals(buildPluginEntry(scaffoldResult, provider, {}), {
      Enabled: true,
      Runtime: "deno",
      Entrypoint: serviceEntrypoint,
      Workdir: ".",
      RequiresKv: provider.defaultRequiresKv,
      RequiresDb: provider.defaultRequiresDb,
      Permissions: [...provider.defaultPermissions],
      ...(provider.kind === "saga"
        ? { Sagas: { Store: { Backend: "kv" } } }
        : {}),
    }, `${pluginName} service appsettings projection changed`);

    assertEquals(
      buildPluginEntry(
        {
          ...scaffoldResult,
          serviceWorkdir: undefined,
        },
        provider,
        {
          packageSpecifier: resolved.descriptor.manifest.name,
          packageVersion: resolved.descriptor.manifest.version,
        },
      ),
      {
        Enabled: true,
        Runtime: "deno",
        Entrypoint:
          `jsr:${resolved.descriptor.manifest.name}@${resolved.descriptor.manifest.version}/services`,
        Workdir: ".",
        RequiresKv: provider.defaultRequiresKv,
        RequiresDb: provider.defaultRequiresDb,
        Permissions: [...provider.defaultPermissions],
        ...(provider.kind === "saga"
          ? { Sagas: { Store: { Backend: "kv" } } }
          : {}),
      },
      `${pluginName} published service appsettings projection changed`,
    );

    assertEquals(
      buildPluginEntry({ ...scaffoldResult, hostPort: 8123 }, provider, {}),
      {
        Enabled: true,
        Runtime: "deno",
        HostPort: 8123,
        Entrypoint: serviceEntrypoint,
        Workdir: ".",
        RequiresKv: provider.defaultRequiresKv,
        RequiresDb: provider.defaultRequiresDb,
        Permissions: [...provider.defaultPermissions],
        ...(provider.kind === "saga"
          ? { Sagas: { Store: { Backend: "kv" } } }
          : {}),
      },
      `${pluginName} explicit host-port projection changed`,
    );

    if (provider.category === "background-processor") {
      const expectedPluginReferences = [`${pluginName}-api`];
      assertEquals(
        buildBackgroundProcessorEntry(scaffoldResult, provider, {}),
        {
          Enabled: true,
          Runtime: "deno",
          Entrypoint: provider.defaultEntrypoint,
          Workdir: ".",
          Telemetry: provider.defaultTelemetry,
          WatchMode: true,
          RequiresDb: provider.defaultRequiresDb,
          RequiresKv: provider.defaultRequiresKv,
          Permissions: [...provider.defaultPermissions],
          ...(provider.supportsConcurrency &&
              provider.defaultConcurrency !== null
            ? { Concurrency: provider.defaultConcurrency }
            : {}),
          ...(provider.supportsConcurrency && provider.concurrencyEnvVar
            ? { ConcurrencyEnvVar: provider.concurrencyEnvVar }
            : {}),
          PluginReferences: expectedPluginReferences,
          ...(provider.kind === "saga"
            ? { Sagas: { Store: { Backend: "kv" } } }
            : {}),
        },
        `${pluginName} background appsettings projection changed`,
      );
    }
  }
});

Deno.test("manifest provider normalization converts an absent service entrypoint to null once", async () => {
  const pluginRoot = await Deno.makeTempDir();
  await Deno.writeTextFile(
    join(pluginRoot, "scaffold.plugin.json"),
    JSON.stringify({
      schemaVersion: 1,
      name: "@acme/plugin-service-less",
      version: "1.0.0",
      displayName: "Service-less plugin",
      description: "Fixture plugin without a service.",
      peerDependencies: {},
      capabilities: {
        hasDatabaseMigrations: false,
        hasRoutes: false,
        hasBackgroundWorkers: false,
      },
      scaffolder: {
        export: "./scaffold",
        requiredPermissions: { net: [], read: [], write: [] },
      },
      provider: {
        kind: "service-less",
        displayName: "Service-less plugin",
        category: "plugin",
        portRangeKey: "PLUGIN_API",
        defaultPermissions: [],
        defaultEntrypoint: "mod.ts",
        defaultRequiresDb: false,
        defaultRequiresKv: false,
        pluginType: "utility",
        supportsConcurrency: false,
        concurrencyEnvVar: null,
        defaultConcurrency: null,
        defaultTelemetry: true,
        infrastructureRequires: [],
        infrastructureOptionalDeps: [],
      },
      officialSource: {
        canonicalName: "service-less",
        backgroundPort: 8124,
      },
    }),
  );

  const registry = new PluginKindRegistry([]);
  const resolved = await resolveLocalPluginDescriptor(
    pluginRoot,
    registry,
    new DenoFileSystem(),
  );
  if (resolved.planningKind === undefined) {
    throw new Error("Service-less manifest did not register its provider");
  }

  assertEquals(
    registry.get(resolved.planningKind).defaultServiceEntrypoint,
    null,
  );
  assertEquals(
    resolved.descriptor.manifest.provider?.defaultServiceEntrypoint,
    undefined,
  );
});
