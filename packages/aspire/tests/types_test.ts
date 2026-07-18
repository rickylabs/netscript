import { assertEquals, assertExists } from '@std/assert';
import { z } from 'zod';
import { NetScriptConfigSchema, ServiceEntrySchema } from '../config.ts';
import type { AppEntry, AppType, KnownDatabases, KnownServices, ServiceEntry } from '../types.ts';

Deno.test('types', async (t) => {
  await t.step('z.infer shapes match expected structure', () => {
    const config = NetScriptConfigSchema.parse({
      Name: 'test-app',
      Services: {
        users: { Port: 3000 },
      },
      Databases: {
        postgres: { Engine: 'Postgres' },
      },
    });

    assertEquals(config.Name, 'test-app');
    assertEquals(config.Version, '1.0.0'); // default
    assertExists(config.Services.users);
    assertEquals(config.Services.users.Port, 3000);
    assertEquals(config.Services.users.Runtime, 'deno'); // default
    assertExists(config.Databases.postgres);
    assertEquals(config.Databases.postgres.Engine, 'Postgres');
  });

  await t.step('narrowed schema provides literal key types', () => {
    // Simulate what the CLI generator would produce
    const NarrowedSchema = z.object({
      Name: z.string(),
      Version: z.string().default('1.0.0'),
      Services: z.object({
        users: ServiceEntrySchema,
        products: ServiceEntrySchema,
      }),
      Apps: z.record(z.string(), z.never()).default({}),
      Plugins: z.record(z.string(), z.never()).default({}),
      BackgroundProcessors: z.record(z.string(), z.never()).default({}),
      Databases: z.record(z.string(), z.never()).default({}),
      Cache: z.record(z.string(), z.never()).default({}),
      Tools: z.record(z.string(), z.never()).default({}),
      Otel: z.object({
        HttpEndpoint: z.string(),
        Protocol: z.string(),
      }),
      Defaults: z.object({
        Deno: z.object({
          Permissions: z.array(z.string()),
          WatchMode: z.boolean(),
        }),
      }),
    });

    type NarrowedConfig = z.infer<typeof NarrowedSchema>;

    // Type-level test: KnownServices<NarrowedConfig> should be "users" | "products"
    const _typeCheck: KnownServices<NarrowedConfig> = 'users';
    assertEquals(_typeCheck, 'users');

    const parsed = NarrowedSchema.parse({
      Name: 'test',
      Services: {
        users: { Port: 3000 },
        products: { Port: 3001 },
      },
      Otel: {
        HttpEndpoint: 'http://localhost:4318',
        Protocol: 'http/protobuf',
      },
      Defaults: {
        Deno: {
          Permissions: [],
          WatchMode: false,
        },
      },
    });

    // Runtime: narrowed schema gives typed access
    assertEquals(parsed.Services.users.Port, 3000);
    assertEquals(parsed.Services.products.Port, 3001);
  });

  await t.step('ServiceEntry type matches schema output', () => {
    const entry: ServiceEntry = {
      Enabled: true,
      Runtime: 'deno',
      Port: 3000,
      Entrypoint: 'src/main.ts',
    };

    assertEquals(entry.Port, 3000);
    assertEquals(entry.Runtime, 'deno');
  });

  await t.step('AppType and AppEntry expose the desktop contract', () => {
    const type: AppType = 'desktop';
    const entry: AppEntry = {
      Enabled: false,
      Runtime: 'deno',
      Type: type,
      WatchMode: false,
      PackageTaskName: 'desktop:package',
      RequiresKv: false,
    };

    assertEquals(entry.Type, 'desktop');
    assertEquals(entry.PackageTaskName, 'desktop:package');
  });

  await t.step('generic utilities resolve correctly at type level', () => {
    // These are compile-time assertions — if they compile, the types work
    type TestConfig = {
      Name: string;
      Version: string;
      Services: { api: ServiceEntry; web: ServiceEntry };
      Apps: Record<string, never>;
      Plugins: Record<string, never>;
      BackgroundProcessors: Record<string, never>;
      Databases: {
        pg: { Engine: 'Postgres'; Enabled: boolean; Mode: 'Container'; Persistent: boolean };
      };
      Cache: Record<string, never>;
      Tools: Record<string, never>;
      Otel: { HttpEndpoint: string; Protocol: string };
      Defaults: { Deno: { Permissions: string[]; WatchMode: boolean } };
    };

    // These type assignments confirm the utility types work
    const _svc: KnownServices<TestConfig> = 'api';
    const _db: KnownDatabases<TestConfig> = 'pg';
    assertEquals(_svc, 'api');
    assertEquals(_db, 'pg');
  });
});
