# SAME-session integration exact-combined-diff part2
HEAD88ae6fcacd36573b2f2f6244f4bebc31e49fc5e5; ordered full-content fragment.


## FULL .llm/runs/fix-security-db--integration-20261028/evidence/combined-seven-owner.diff
Raw SHA256:4100ceedfb09b3a7f42a8bc126c498c55310bfb6d93649fad54f14c78ade45b3; rawBytes:33447
diff --git a/.llm/tools/deps/check-db-alignment.ts b/.llm/tools/deps/check-db-alignment.ts
index 5ee740a82ea7a257b1cad1b6eb4721dfbce1ce23..b3b8069438197d507705e2e21d43eee05a380781 100644
--- a/.llm/tools/deps/check-db-alignment.ts
+++ b/.llm/tools/deps/check-db-alignment.ts
@@ -1,10 +1,10 @@
 /** Guard the Collection identity shared by SDK query and Fresh stream adapters. */
-import { join } from '@std/path';
+import { join, toFileUrl } from '@std/path';
 import { parseRegistrySpecifier, readJsonFile } from './workspace.ts';
 
 interface DependencyGraph {
   readonly npmPackages?: Readonly<Record<string, unknown>>;
-  readonly modules?: readonly { readonly error?: unknown }[];
+  readonly modules?: readonly { readonly kind?: string; readonly error?: unknown }[];
 }
 
 /** Cold graph verdict; identities include peer-resolution suffixes. */
@@ -22,7 +22,11 @@ export function analyzeDbGraph(graph: DependencyGraph): DbAlignmentReport {
   if (identities.length !== 1) {
     findings.push('Expected exactly one complete @tanstack/db identity');
   }
-  if ((graph.modules ?? []).some((module) => module.error !== undefined)) {
+  const modules = graph.modules ?? [];
+  if (!modules.some((module) => typeof module.kind === 'string' && module.kind !== 'external')) {
+    findings.push('Consumer graph contains no resolved modules');
+  }
+  if (modules.some((module) => module.error !== undefined)) {
     findings.push('Consumer graph contains unresolved modules');
   }
   return { identities, findings };
@@ -60,7 +64,14 @@ async function checkColdConsumer(root: string, freshOnly: boolean): Promise<bool
       ).join('\n'),
     );
     const result = await new Deno.Command(Deno.execPath(), {
-      args: ['info', '--json', '--no-config', '--no-lock', '--node-modules-dir=none', entry],
+      args: [
+        'info',
+        '--json',
+        '--no-config',
+        '--no-lock',
+        '--node-modules-dir=none',
+        toFileUrl(entry).href,
+      ],
       env: { DENO_DIR: join(directory, 'cache') },
       stdout: 'piped',
       stderr: 'piped',
diff --git a/.llm/tools/deps/check-db-alignment_test.ts b/.llm/tools/deps/check-db-alignment_test.ts
index 8ea3ab1c78fb5350802b90ac6af6ca3b7ca232c7..7c3fe34b0b4f224a2214ca73593ad66dac3b25a1 100644
--- a/.llm/tools/deps/check-db-alignment_test.ts
+++ b/.llm/tools/deps/check-db-alignment_test.ts
@@ -1,21 +1,86 @@
 import { assertEquals } from '@std/assert';
+import { join, toFileUrl } from '@std/path';
 import { analyzeDbGraph } from './check-db-alignment.ts';
 
 Deno.test('DB guard requires one complete Collection identity and a resolved graph', () => {
   const core = '@tanstack/db@0.6.17_typescript@7.0.2';
-  assertEquals(analyzeDbGraph({ npmPackages: { [core]: {} } }).findings, []);
+  const modules = [{ kind: 'esm', error: undefined }];
+  assertEquals(analyzeDbGraph({ npmPackages: { [core]: {} }, modules }).findings, []);
   for (
     const other of [
       '@tanstack/db@0.7.0_typescript@7.0.2',
       '@tanstack/db@0.6.17_typescript@6.0.2',
     ]
   ) {
-    assertEquals(analyzeDbGraph({ npmPackages: { [core]: {}, [other]: {} } }).findings.length, 1);
+    assertEquals(
+      analyzeDbGraph({ npmPackages: { [core]: {}, [other]: {} }, modules }).findings.length,
+      1,
+    );
   }
-  assertEquals(analyzeDbGraph({ npmPackages: {} }).findings.length, 1);
+  assertEquals(analyzeDbGraph({ npmPackages: {}, modules }).findings.length, 1);
   assertEquals(
-    analyzeDbGraph({ npmPackages: { [core]: {} }, modules: [{ error: 'not resolved' }] })
+    analyzeDbGraph({
+      npmPackages: { [core]: {} },
+      modules: [{ ...modules[0], error: 'not resolved' }],
+    })
       .findings.length,
     1,
   );
 });
+
+for (
+  const [name, modules] of [
+    ['missing', undefined],
+    ['empty', []],
+    ['external-only', [{ kind: 'external', error: undefined }]],
+    ['kind-less', [{}]],
+  ] as const
+) {
+  Deno.test({
+    name: `DB guard rejects ${name} module graphs despite identity metadata`,
+    sanitizeOps: true,
+    sanitizeResources: true,
+    sanitizeExit: true,
+    fn: () => {
+      const graph = { npmPackages: { '@tanstack/db@0.13.0_typescript@7.0.2': {} }, modules };
+      assertEquals(analyzeDbGraph(graph).findings, ['Consumer graph contains no resolved modules']);
+    },
+  });
+}
+
+Deno.test({
+  name: 'native info resolves a cold local file URL with spaces and a fragment character',
+  sanitizeOps: true,
+  sanitizeResources: true,
+  sanitizeExit: true,
+  fn: async () => {
+    const directory = await Deno.makeTempDir({ prefix: 'netscript-db-info-' });
+    const controller = new AbortController();
+    const deadline = setTimeout(() => controller.abort(), 10_000);
+    try {
+      const entry = join(directory, 'consumer space #.ts');
+      await Deno.writeTextFile(entry, 'export const value = 1;\n');
+      const fileUrl = toFileUrl(entry).href;
+      const result = await new Deno.Command(Deno.execPath(), {
+        args: ['info', '--json', '--no-config', '--no-lock', '--node-modules-dir=none', fileUrl],
+        env: { DENO_DIR: join(directory, 'cache') },
+        signal: controller.signal,
+        stdout: 'piped',
+        stderr: 'piped',
+      }).output();
+      assertEquals(result.success, true, new TextDecoder().decode(result.stderr));
+      const graph: {
+        roots: string[];
+        modules: { kind: string; specifier: string; error?: unknown }[];
+      } = JSON.parse(new TextDecoder().decode(result.stdout));
+      assertEquals(graph.roots, [fileUrl]);
+      assertEquals(graph.modules.map(({ kind, specifier }) => ({ kind, specifier })), [
+        { kind: 'esm', specifier: fileUrl },
+      ]);
+      assertEquals(graph.modules.filter((module) => module.error !== undefined), []);
+    } finally {
+      clearTimeout(deadline);
+      await Deno.remove(directory, { recursive: true });
+    }
+  },
+});
diff --git a/deno.json b/deno.json
index fc4d72cd1e5e97dd89e77b12eaee939600277e26..46a3d76c436362382650a3b0e2a7a9e51b687003 100644
--- a/deno.json
+++ b/deno.json
@@ -271,7 +271,7 @@
     "@tanstack/react-db": "0.5.8",
     "@tailwindcss/vite": "^4.3.3",
     "amqplib": "^2.2.0",
-    "better-auth": "^1.6.20",
+    "better-auth": "^1.7.7",
     "clsx": "^2.1.1",
     "ioredis": "^5.11.1",
     "jose": "^6.2.12",
diff --git a/deno.lock b/deno.lock
index 1665f7e40afa576deab4dd25b2c408e647383d8c..e6e27b71b67afe586759f8e344ef02b738ac4c2f 100644
--- a/deno.lock
+++ b/deno.lock
@@ -185,8 +185,7 @@
     "npm:amqplib@^2.2.0": "2.2.0",
     "npm:amqplib@~0.10.3": "0.10.9",
     "npm:asn1js@^3.0.10": "3.0.10",
-    "npm:better-auth@1.6.20": "1.6.20_@prisma+client@7.10.0_mysql2@3.24.5_pg@8.23.1_react@19.2.8_typescript@7.0.2",
-    "npm:better-auth@^1.6.20": "1.6.20_@prisma+client@7.10.0_mysql2@3.24.5_pg@8.23.1_react@19.2.8_typescript@7.0.2",
+    "npm:better-auth@^1.7.7": "1.7.14_@prisma+client@7.10.0_mysql2@3.24.5_pg@8.23.1_react@19.2.8_@opentelemetry+api@1.9.1",
     "npm:byte-encodings@^1.0.11": "1.0.11",
     "npm:clsx@^2.1.1": "2.1.1",
     "npm:devalue@^5.8.1": "5.9.4",
@@ -1016,13 +1015,12 @@
         "@babel/helper-validator-identifier"
       ]
     },
-    "@better-auth/core@1.6.20_@better-auth+utils@0.4.2_@better-fetch+fetch@1.3.1_@opentelemetry+api@1.9.1_better-call@1.3.6_jose@6.2.12_kysely@0.29.2_nanostores@1.3.0": {
-      "integrity": "sha512-y73I1xNXuNYiHBFduWGRcJ2ro2rNuVDEYkgVMJtIaRXtbosdXHs9gfyQrHecgeHMHKx1SYSBT/CExak0vVMTng==",
+    "@better-auth/core@1.7.14_@better-auth+utils@0.5.1_@better-fetch+fetch@1.3.3_@opentelemetry+api@1.9.1_better-call@1.4.4_jose@6.2.12_kysely@0.29.7_nanostores@1.5.5": {
+      "integrity": "sha512-ByhdrGVwp/el+hoTYKSVOHIH23/lQj9TQ1txdGcWOg22tnfr3hJ6ukzySooeYj/R36XsQgBhkJqIp8mKsNeErA==",
       "dependencies": [
         "@better-auth/utils",
         "@better-fetch/fetch",
         "@opentelemetry/api",
-        "@opentelemetry/semantic-conventions@1.43.0",
         "@standard-schema/spec",
         "better-call",
         "jose",
@@ -1034,15 +1032,15 @@
         "@opentelemetry/api"
       ]
     },
-    "@better-auth/drizzle-adapter@1.6.20_@better-auth+core@1.6.20_@better-auth+utils@0.4.2_jose@6.2.12": {
-      "integrity": "sha512-hJHfCdAiZrC7EmZAt3NAiGgcNo9Y5Qz3PLL+a9rODXaAJGCMvzUJniqef9wHuJBwU0SWW+2f4wXe8xQmaC/IKQ==",
+    "@better-auth/drizzle-adapter@1.7.14_@better-auth+core@1.7.14_@better-auth+utils@0.5.1_@better-fetch+fetch@1.3.3_@opentelemetry+api@1.9.1_better-call@1.4.4_jose@6.2.12_kysely@0.29.7_nanostores@1.5.5": {
+      "integrity": "sha512-5RC8Ec5Ur15FWsS4As9/VrlRbB3+9EfShxIpA5A1FcD6IgPxFvzQNkAm2+FYx9LUSqx47NPf9hBTG2GUCMP9Ig==",
       "dependencies": [
         "@better-auth/core",
         "@better-auth/utils"
       ]
     },
-    "@better-auth/kysely-adapter@1.6.20_@better-auth+core@1.6.20_@better-auth+utils@0.4.2_kysely@0.29.2_jose@6.2.12": {
-      "integrity": "sha512-Uvpmgbx5y8JqXroVanNzDdKzOl3HojoTz+/X6MR6zOUr25IzlYz660mjnu0rxKiIF55kD3CroqFsDzjNUw7ERw==",
+    "@better-auth/kysely-adapter@1.7.14_@better-auth+core@1.7.14_@better-auth+utils@0.5.1_kysely@0.29.7_@better-fetch+fetch@1.3.3_@opentelemetry+api@1.9.1_better-call@1.4.4_jose@6.2.12_nanostores@1.5.5": {
+      "integrity": "sha512-4wkqj8a8JVpWDYLlgzfbk7eOaWCFkL6HHQd6CLamFKaC8vNsXew1x4v5dE5O6dGr8j4g5qMISS+BAvOuIvBevg==",
       "dependencies": [
         "@better-auth/core",
         "@better-auth/utils",
@@ -1052,22 +1050,22 @@
         "kysely"
       ]
     },
-    "@better-auth/memory-adapter@1.6.20_@better-auth+core@1.6.20_@better-auth+utils@0.4.2_jose@6.2.12": {
-      "integrity": "sha512-J5Ni0LlFijbzXlwu2rFHaD8zEFocmajyzWkRnHsq8LhV/Dk4iWQwwnqzLrPoDQEj8roECAUF03hrIeMzqWRqJQ==",
+    "@better-auth/memory-adapter@1.7.14_@better-auth+core@1.7.14_@better-auth+utils@0.5.1_@better-fetch+fetch@1.3.3_@opentelemetry+api@1.9.1_better-call@1.4.4_jose@6.2.12_kysely@0.29.7_nanostores@1.5.5": {
+      "integrity": "sha512-Ojv9BcmFyHuTHha9ZM/NUW1ut9J84wLngta+07Es0Ejn8kekqP5aHBpZd5Z8AvADs5iJUOWvQGFmGlPWAKJgBg==",
       "dependencies": [
         "@better-auth/core",
         "@better-auth/utils"
       ]
     },
-    "@better-auth/mongo-adapter@1.6.20_@better-auth+core@1.6.20_@better-auth+utils@0.4.2_jose@6.2.12": {
-      "integrity": "sha512-ClDBJf6h4g85WJswxwQwxLaiyRU67Gmz/uaIf19tY1gqlLJDykSGjmqRNSBMG5rWABNzcNqbO4KG31rYUldbIw==",
+    "@better-auth/mongo-adapter@1.7.14_@better-auth+core@1.7.14_@better-auth+utils@0.5.1_@better-fetch+fetch@1.3.3_@opentelemetry+api@1.9.1_better-call@1.4.4_jose@6.2.12_kysely@0.29.7_nanostores@1.5.5": {
+      "integrity": "sha512-6IA0RSPZFMdRwwnLZ9oWnDIiD0y0o0azTHUfa01BNU2AFJgMDkeiASUV3bKcJBskzQoyQrff74eFYTsTSeeVUQ==",
       "dependencies": [
         "@better-auth/core",
         "@better-auth/utils"
       ]
     },
-    "@better-auth/prisma-adapter@1.6.20_@better-auth+core@1.6.20_@better-auth+utils@0.4.2_@prisma+client@7.10.0_typescript@7.0.2": {
-      "integrity": "sha512-WhYdhSGuVSfu1peCSf2snmmVzfWjRaEvbSrsNCusiwGE9l94HlES4mjSPM48fed24hL7yg4j1dYK/yjEt87FpQ==",
+    "@better-auth/prisma-adapter@1.7.14_@better-auth+core@1.7.14_@better-auth+utils@0.5.1_@prisma+client@7.10.0_@better-fetch+fetch@1.3.3_@opentelemetry+api@1.9.1_better-call@1.4.4_jose@6.2.12_kysely@0.29.7_nanostores@1.5.5": {
+      "integrity": "sha512-mF6t5xqeZNWzUe0ErmrSdzQmtslJscmu9X8Mp5QmROlpnnAzvSc70RILu8lHms8CePt7N34+KRH1QvYjGFrVGQ==",
       "dependencies": [
         "@better-auth/core",
         "@better-auth/utils",
@@ -1077,22 +1075,22 @@
         "@prisma/client"
       ]
     },
-    "@better-auth/telemetry@1.6.20_@better-auth+core@1.6.20_@better-auth+utils@0.4.2_@better-fetch+fetch@1.3.1_jose@6.2.12": {
-      "integrity": "sha512-3BhbY3naQDERvdJvJ7fGszVY6rpsVfc6c9uyBVZlC1coVEF/rkM0rIcjtMVI1GUH7vWy1wjR6qF5vQnMun3XNQ==",
+    "@better-auth/telemetry@1.7.14_@better-auth+core@1.7.14_@better-auth+utils@0.5.1_@better-fetch+fetch@1.3.3_@opentelemetry+api@1.9.1_better-call@1.4.4_jose@6.2.12_kysely@0.29.7_nanostores@1.5.5": {
+      "integrity": "sha512-PtKFzsH7gje/WJuUPDjckOoNFazsq8NMt3AdiXIPzHl7tZULcNGTKAX8K7+yn0rG6cO/4mtMgpOjhtilElOnmg==",
       "dependencies": [
         "@better-auth/core",
         "@better-auth/utils",
         "@better-fetch/fetch"
       ]
     },
-    "@better-auth/utils@0.4.2": {
-      "integrity": "sha512-AUxrvu+HaaODsUyzDxFgwd/8RZ1yZaYo42LXKSrU2oGgR38pS1ij8nqQKNgtTWoYGpNevNXtCfgTy6loHveW9A==",
+    "@better-auth/utils@0.5.1": {
+      "integrity": "sha512-WETqw5vQ52uQ/xwWR4E8rTgT6fDEr/wnS+otDNkBCa/69281FCF32OKDdQUcahMCnjsvqXBNiEvAQHFB0EVRRg==",
       "dependencies": [
-        "@noble/hashes@2.2.0"
+        "@noble/hashes@2.4.0"
       ]
     },
-    "@better-fetch/fetch@1.3.1": {
-      "integrity": "sha512-ABkD1WhyfPZprKRQI3bhATjeiFuNWC9PXhfGWqL+sg/gKrM977oFrYkdb4msM3hgUGonr7KlOsOFT5TU2rht9g=="
+    "@better-fetch/fetch@1.3.3": {
+      "integrity": "sha512-U6SlDt/GUWtK2JAxS/NhdoYTEim+EL1G5byz2TUj83KjLZBUpYzb5SmX0aXaCnbGkAjFKnV/o/0+cyXMbEcqqg=="
     },
     "@bundled-es-modules/deepmerge@4.3.2": {
       "integrity": "sha512-q8doe7ndrY2IolUOFIn0A0++JBX38pMhN7kFhTF4cnjIcILf6X6H2yWczInyv8ZFdR0lrE8088X8XS5efxXz8A==",
@@ -1631,14 +1629,14 @@
     "@neophi/sieve-cache@1.5.0": {
       "integrity": "sha512-9T3nD5q51X1d4QYW6vouKW9hBSb2Tb/wB/2XoTr4oP5SCGtp3a7aTHHewQFylred1B21/Bhev6gy4x01FPBcbQ=="
     },
-    "@noble/ciphers@2.2.0": {
-      "integrity": "sha512-Z6pjIZ/8IJcCGzb2S/0Px5J81yij85xASuk1teLNeg75bfT07MV3a/O2Mtn1I2se43k3lkVEcFaR10N4cgQcZA=="
+    "@noble/ciphers@2.4.0": {
+      "integrity": "sha512-AnjFn0Jv92laAkvMrghlFZq4qQCIN/4DxFV/eooqtC2YTjB7kBeLMS2T9KJX4Dn+ZVXLOwK0lSgqDtx9gvxtiw=="
     },
     "@noble/hashes@1.8.0": {
       "integrity": "sha512-jCs9ldd7NwzpgXDIf6P3+NrHh9/sD6CQdxHyjQI+h/6rDNo88ypBxxz45UDuZHz9r3tNz7N/VInSVoVdtXEI4A=="
     },
-    "@noble/hashes@2.2.0": {
-      "integrity": "sha512-IYqDGiTXab6FniAgnSdZwgWbomxpy9FtYvLKs7wCUs2a8RkITG+DFGO1DM9cr+E3/RgADRpFjrKVaJ1z6sjtEg=="
+    "@noble/hashes@2.4.0": {
+      "integrity": "sha512-X5XaVWZIBCT7HHZGm5I7ZQXDwLG+bGXuSrMQAW+7Zvl87h1kmc1ZB1VSRJcpUfoUrGQp4Fkoxm5kZ+Ms+aW+eA=="
     },
     "@opentelemetry/api-logs@0.223.0": {
       "integrity": "sha512-Oepm6etVPFCn0VWB1t833iOTgz1eYBDUPxcrOR/XvwzD1+Ag9VzSPSrrKAFNJ/haatj+8CXbG47pZXvdNQKDJw==",
@@ -1709,7 +1707,8 @@
         "@opentelemetry/core@2.8.0_@opentelemetry+api@1.9.1",
         "@opentelemetry/resources@2.8.0_@opentelemetry+api@1.9.1",
         "@opentelemetry/semantic-conventions@1.43.0"
-      ]
+      ],
+      "deprecated": true
     },
     "@opentelemetry/semantic-conventions@1.41.1": {
       "integrity": "sha512-/UhIkaZgPutTFmQ7RnIJGgDXZmtEJ7Dvi86xNTFWcnRxVRNk/aotsqDJYeEvDP+FSMB2SdW+pQzNMcWP0rwuNA=="
@@ -1778,7 +1777,7 @@
         "@orpc/shared",
         "@orpc/standard-server",
         "json-schema-typed",
-        "rou3"
+        "rou3@0.7.12"
       ]
     },
     "@orpc/otel@1.15.5_@opentelemetry+api@1.9.1_@opentelemetry+instrumentation@0.223.0": {
@@ -2575,8 +2574,8 @@
       "integrity": "sha512-br0LOmjJqr6Rt4AEkadbcNf67Zpo7EPwKsWbjnRrJIa1QYFHQBqM4C7F2WTbV8ahTEcg1Eo+Y0aWjjORInYFyA==",
       "bin": true
     },
-    "better-auth@1.6.20_@prisma+client@7.10.0_mysql2@3.24.5_pg@8.23.1_react@19.2.8_typescript@7.0.2": {
-      "integrity": "sha512-fSpGHGRKiGRiYVd3QTQtuVZ8oxpiSe/7ip0Rpvt/Sy8zQbEbVKUPMOhE0gLXg+FjqTUsIo7582hxUYxtEcqUpA==",
+    "better-auth@1.7.14_@prisma+client@7.10.0_mysql2@3.24.5_pg@8.23.1_react@19.2.8_@opentelemetry+api@1.9.1": {
+      "integrity": "sha512-QxDCI0pOCCHDYmruisKhKyrvOJ6Icv9xg0RA6ZUysfKFXENYwhNNpwUlkE/NmViH2nDMgkKcymmLr55pnpR9vw==",
       "dependencies": [
         "@better-auth/core",
         "@better-auth/drizzle-adapter",
@@ -2588,7 +2587,7 @@
         "@better-auth/utils",
         "@better-fetch/fetch",
         "@noble/ciphers",
-        "@noble/hashes@2.2.0",
+        "@noble/hashes@2.4.0",
         "@prisma/client",
         "better-call",
         "defu",
@@ -2607,12 +2606,12 @@
         "react"
       ]
     },
-    "better-call@1.3.6_zod@4.6.5": {
-      "integrity": "sha512-no1jI+h6Bkxs1NVBo4rONbVIzsPjZ8IUu7IHaJBiFwVX1XEQGN8KpHots5fSWmXe9nNyLuLIcgx6WEUcE6EDaA==",
+    "better-call@1.4.4_zod@4.6.5": {
+      "integrity": "sha512-Gq4XdGFy4dmUxFEAX2nj0ycFcFbD9ZWh8YROouZoyXeF1M11TpYbplk0pDByTFF8Wz+MYa6W9052c9m7dD+mfw==",
       "dependencies": [
         "@better-auth/utils",
         "@better-fetch/fetch",
-        "rou3",
+        "rou3@0.9.2",
         "set-cookie-parser",
         "zod@4.6.5"
       ],
@@ -3330,8 +3329,8 @@
     "ky@1.14.3": {
       "integrity": "sha512-9zy9lkjac+TR1c2tG+mkNSVlyOpInnWdSMiue4F+kq8TwJSgv6o8jhLRg8Ho6SnZ9wOYUq/yozts9qQCfk7bIw=="
     },
-    "kysely@0.29.2": {
-      "integrity": "sha512-s6WVJyEZrbm6jhBpiKHsGHyePMrVQKJ85wZCFCr9W4QHv6WTjWIrdvTmO9hDEA3bNK0xkrE2DqrHsXMLWuZpQg=="
+    "kysely@0.29.7": {
+      "integrity": "sha512-fmIq+7kv4WbFm2tcfznRzikqB4cuNpgZ40PSU2fAJ2/OO5XhojqnTPrmgrCjYSRJVwBln03XcRXJGnw9H099IQ=="
     },
     "lmdb@3.5.7": {
       "integrity": "sha512-cSXt4RnfRAaGRXVI3hiJS3fQPQebj/c7RCRBvUL2cH5gTLpgvuGFqGJbH+ZkI2sFgvSlzwJw3GTw6ffFmN/uUw==",
@@ -3505,8 +3504,8 @@
       "integrity": "sha512-uKdg2G3GNCKQn9byYOpxbGqrT2fGO5KRt5J/8b3pok8rT6qxGWF6hxMyJiEYtAf+FVyYuD9hRaDqX5uPFYJ4ZQ==",
       "bin": true
     },
-    "nanostores@1.3.0": {
-      "integrity": "sha512-XPUa/jz+P1oJvN9VBxw4L9MtdFfaH3DAryqPssqhb2kXjmb9npz0dly6rCsgFWOPr4Yg9mTfM3MDZgZZ+7A3lA=="
+    "nanostores@1.5.5": {
+      "integrity": "sha512-FixtE239Gl6Gz0ZGCK0WzvNwObNCIwVT+L7zQcf1QgcA6AzBxblzqe9OT88qiucNkhsjSOqiogSaF5jVbJiqSA=="
     },
     "native-duplexpair@1.0.0": {
       "integrity": "sha512-E7QQoM+3jvNtlmyfqRZ0/U75VFgCls+fSkbml2MpgWkWyz3ox8Y58gNhfuziuQYGNNQAbFZJQck55LHCnCK6CA=="
@@ -3870,6 +3869,9 @@
     "rou3@0.7.12": {
       "integrity": "sha512-iFE4hLDuloSWcD7mjdCDhx2bKcIsYbtOTpfH5MHHLSKMOUyjqQXTeZVa289uuwEGEKFoE/BAPbhaU4B774nceg=="
     },
+    "rou3@0.9.2": {
+      "integrity": "sha512-3SOzvaAg8rkHrXtRjpCvCvbyO5to9oOO27Z/XqHEYXfMRVSw/qMIVdmaOk9W2lcRLtR6dlqTjo9hDeJk70QBYQ=="
+    },
     "router@2.2.0": {
       "integrity": "sha512-nLTrUKm2UyiL7rlhapu/Zl45FwNgkZGaCpZbIHajDYgwlJCOzLSk+cIPAnsEqV955GjILJnKbdQC1nVPz+gAYQ==",
       "dependencies": [
@@ -3930,8 +3932,8 @@
         "send"
       ]
     },
-    "set-cookie-parser@3.1.0": {
-      "integrity": "sha512-kjnC1DXBHcxaOaOXBHBeRtltsDG2nUiUni+jP92M9gYdW12rsmx92UsfpH7o5tDRs7I1ZZPSQJQGv3UaRfCiuw=="
+    "set-cookie-parser@3.2.1": {
+      "integrity": "sha512-Npd1Pt+4zb3BrSZDPd2qFwRpS6b1EUEasRrO8xS0zMJi0fApXXK5YuzP0minyJnxwnFHoVoJwA55q0A0cu63gQ=="
     },
     "set-function-length@1.2.2": {
       "integrity": "sha512-pgRc4hJ4/sNjWCSS9AmnS40x3bNMDTknHgL5UaMBTMyJnU90EgWh1Rz+MC9eFu4BuN/UwZjKQuY/1v3rM7HMfg==",
@@ -4322,7 +4324,7 @@
         ],
         "packageJson": {
           "dependencies": [
-            "npm:better-auth@^1.6.20"
+            "npm:better-auth@^1.7.7"
           ]
         }
       },
diff --git a/packages/fresh-ui/deno.lock b/packages/fresh-ui/deno.lock
index dbe3c6ae659cad665810f9fb74e9956fbc63014e..c24c707dd78beccdda2683cf0d0166f61892406c 100644
--- a/packages/fresh-ui/deno.lock
+++ b/packages/fresh-ui/deno.lock
@@ -152,7 +152,7 @@
     "npm:amqplib@^2.0.1": "2.2.0",
     "npm:amqplib@^2.2.0": "2.2.0",
     "npm:asn1js@^3.0.10": "3.0.10",
-    "npm:better-auth@^1.6.20": "1.6.20_@prisma+client@7.10.0_mysql2@3.24.5_pg@8.23.1_react@19.2.8_typescript@7.0.2",
+    "npm:better-auth@^1.7.7": "1.7.14_@prisma+client@7.10.0_mysql2@3.24.5_pg@8.23.1_react@19.2.8_@opentelemetry+api@1.9.1",
     "npm:byte-encodings@^1.0.11": "1.0.11",
     "npm:clsx@^2.1.1": "2.1.1",
     "npm:es-toolkit@^1.46.1": "1.49.0",
@@ -726,13 +726,12 @@
     "@babel/runtime@7.29.7": {
       "integrity": "sha512-Nq8OhGWiZIZGV6hLHoyAKLLcJihP/xFeBMGJoUrxTX2psI8dCifzLhZISFb+VWS3wFMRDmCGw5R+dOySCqPLhw=="
     },
-    "@better-auth/core@1.6.20_@better-auth+utils@0.4.2_@better-fetch+fetch@1.3.1_@opentelemetry+api@1.9.1_better-call@1.3.6__zod@4.6.5_jose@6.2.12_kysely@0.29.2_nanostores@1.3.0": {
-      "integrity": "sha512-y73I1xNXuNYiHBFduWGRcJ2ro2rNuVDEYkgVMJtIaRXtbosdXHs9gfyQrHecgeHMHKx1SYSBT/CExak0vVMTng==",
+    "@better-auth/core@1.7.14_@better-auth+utils@0.5.1_@better-fetch+fetch@1.3.3_@opentelemetry+api@1.9.1_better-call@1.4.4_jose@6.2.12_kysely@0.29.7_nanostores@1.5.5": {
+      "integrity": "sha512-ByhdrGVwp/el+hoTYKSVOHIH23/lQj9TQ1txdGcWOg22tnfr3hJ6ukzySooeYj/R36XsQgBhkJqIp8mKsNeErA==",
       "dependencies": [
         "@better-auth/utils",
         "@better-fetch/fetch",
         "@opentelemetry/api",
-        "@opentelemetry/semantic-conventions@1.43.0",
         "@standard-schema/spec",
         "better-call",
         "jose",
@@ -744,15 +743,15 @@
         "@opentelemetry/api"
       ]
     },
-    "@better-auth/drizzle-adapter@1.6.20_@better-auth+core@1.6.20_@better-auth+utils@0.4.2_jose@6.2.12": {
-      "integrity": "sha512-hJHfCdAiZrC7EmZAt3NAiGgcNo9Y5Qz3PLL+a9rODXaAJGCMvzUJniqef9wHuJBwU0SWW+2f4wXe8xQmaC/IKQ==",
+    "@better-auth/drizzle-adapter@1.7.14_@better-auth+core@1.7.14_@better-auth+utils@0.5.1_@better-fetch+fetch@1.3.3_@opentelemetry+api@1.9.1_better-call@1.4.4_jose@6.2.12_kysely@0.29.7_nanostores@1.5.5": {
+      "integrity": "sha512-5RC8Ec5Ur15FWsS4As9/VrlRbB3+9EfShxIpA5A1FcD6IgPxFvzQNkAm2+FYx9LUSqx47NPf9hBTG2GUCMP9Ig==",
       "dependencies": [
         "@better-auth/core",
         "@better-auth/utils"
       ]
     },
-    "@better-auth/kysely-adapter@1.6.20_@better-auth+core@1.6.20_@better-auth+utils@0.4.2_kysely@0.29.2_jose@6.2.12": {
-      "integrity": "sha512-Uvpmgbx5y8JqXroVanNzDdKzOl3HojoTz+/X6MR6zOUr25IzlYz660mjnu0rxKiIF55kD3CroqFsDzjNUw7ERw==",
+    "@better-auth/kysely-adapter@1.7.14_@better-auth+core@1.7.14_@better-auth+utils@0.5.1_kysely@0.29.7_@better-fetch+fetch@1.3.3_@opentelemetry+api@1.9.1_better-call@1.4.4_jose@6.2.12_nanostores@1.5.5": {
+      "integrity": "sha512-4wkqj8a8JVpWDYLlgzfbk7eOaWCFkL6HHQd6CLamFKaC8vNsXew1x4v5dE5O6dGr8j4g5qMISS+BAvOuIvBevg==",
       "dependencies": [
         "@better-auth/core",
         "@better-auth/utils",
@@ -762,22 +761,22 @@
         "kysely"
       ]
     },
-    "@better-auth/memory-adapter@1.6.20_@better-auth+core@1.6.20_@better-auth+utils@0.4.2_jose@6.2.12": {
-      "integrity": "sha512-J5Ni0LlFijbzXlwu2rFHaD8zEFocmajyzWkRnHsq8LhV/Dk4iWQwwnqzLrPoDQEj8roECAUF03hrIeMzqWRqJQ==",
+    "@better-auth/memory-adapter@1.7.14_@better-auth+core@1.7.14_@better-auth+utils@0.5.1_@better-fetch+fetch@1.3.3_@opentelemetry+api@1.9.1_better-call@1.4.4_jose@6.2.12_kysely@0.29.7_nanostores@1.5.5": {
+      "integrity": "sha512-Ojv9BcmFyHuTHha9ZM/NUW1ut9J84wLngta+07Es0Ejn8kekqP5aHBpZd5Z8AvADs5iJUOWvQGFmGlPWAKJgBg==",
       "dependencies": [
         "@better-auth/core",
         "@better-auth/utils"
       ]
     },
-    "@better-auth/mongo-adapter@1.6.20_@better-auth+core@1.6.20_@better-auth+utils@0.4.2_jose@6.2.12": {
-      "integrity": "sha512-ClDBJf6h4g85WJswxwQwxLaiyRU67Gmz/uaIf19tY1gqlLJDykSGjmqRNSBMG5rWABNzcNqbO4KG31rYUldbIw==",
+    "@better-auth/mongo-adapter@1.7.14_@better-auth+core@1.7.14_@better-auth+utils@0.5.1_@better-fetch+fetch@1.3.3_@opentelemetry+api@1.9.1_better-call@1.4.4_jose@6.2.12_kysely@0.29.7_nanostores@1.5.5": {
+      "integrity": "sha512-6IA0RSPZFMdRwwnLZ9oWnDIiD0y0o0azTHUfa01BNU2AFJgMDkeiASUV3bKcJBskzQoyQrff74eFYTsTSeeVUQ==",
       "dependencies": [
         "@better-auth/core",
         "@better-auth/utils"
       ]
     },
-    "@better-auth/prisma-adapter@1.6.20_@better-auth+core@1.6.20_@better-auth+utils@0.4.2_@prisma+client@7.10.0_typescript@7.0.2": {
-      "integrity": "sha512-WhYdhSGuVSfu1peCSf2snmmVzfWjRaEvbSrsNCusiwGE9l94HlES4mjSPM48fed24hL7yg4j1dYK/yjEt87FpQ==",
+    "@better-auth/prisma-adapter@1.7.14_@better-auth+core@1.7.14_@better-auth+utils@0.5.1_@prisma+client@7.10.0_@better-fetch+fetch@1.3.3_@opentelemetry+api@1.9.1_better-call@1.4.4_jose@6.2.12_kysely@0.29.7_nanostores@1.5.5": {
+      "integrity": "sha512-mF6t5xqeZNWzUe0ErmrSdzQmtslJscmu9X8Mp5QmROlpnnAzvSc70RILu8lHms8CePt7N34+KRH1QvYjGFrVGQ==",
       "dependencies": [
         "@better-auth/core",
         "@better-auth/utils",
@@ -787,22 +786,22 @@
         "@prisma/client"
       ]
     },
-    "@better-auth/telemetry@1.6.20_@better-auth+core@1.6.20_@better-auth+utils@0.4.2_@better-fetch+fetch@1.3.1_jose@6.2.12": {
-      "integrity": "sha512-3BhbY3naQDERvdJvJ7fGszVY6rpsVfc6c9uyBVZlC1coVEF/rkM0rIcjtMVI1GUH7vWy1wjR6qF5vQnMun3XNQ==",
+    "@better-auth/telemetry@1.7.14_@better-auth+core@1.7.14_@better-auth+utils@0.5.1_@better-fetch+fetch@1.3.3_@opentelemetry+api@1.9.1_better-call@1.4.4_jose@6.2.12_kysely@0.29.7_nanostores@1.5.5": {
+      "integrity": "sha512-PtKFzsH7gje/WJuUPDjckOoNFazsq8NMt3AdiXIPzHl7tZULcNGTKAX8K7+yn0rG6cO/4mtMgpOjhtilElOnmg==",
       "dependencies": [
         "@better-auth/core",
         "@better-auth/utils",
         "@better-fetch/fetch"
       ]
     },
