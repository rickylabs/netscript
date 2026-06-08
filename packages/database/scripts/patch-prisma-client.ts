/**
 * Patch Prisma Client Script
 *
 * Post-processes a Prisma-generated client directory for isomorphic
 * (browser + server) imports. Independent of Zod schema generation.
 *
 * Operations:
 *   Phase 1 — Back up client.ts → client.server.ts (real PrismaClient)
 *   Phase 2 — Replace client.ts with an isomorphic façade that re-exports browser.ts
 *   Phase 3 — Add `export type Decimal` to prismaNamespaceBrowser.ts (if present)
 *
 * After patching, consumers choose their import surface:
 *   import { ... } from './client.ts'        ← safe in browser / Vite SSR / Fresh
 *   import { PrismaClient } from './client.server.ts'  ← real client, server-only
 *
 * Usage (programmatic):
 *   import { patchPrismaClient } from '@netscript/database/scripts';
 *   await patchPrismaClient('./schemas/netscript/.generated');
 *
 * @module
 */

import { join } from 'jsr:@std/path@1';
import { exists } from 'jsr:@std/fs@1/exists';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for Prisma client patching.
 */
export interface PatchPrismaClientOptions {
  /** Enable console logging (default: true) */
  verbose?: boolean;
}

/**
 * Summary of Prisma client patching changes.
 */
export interface PatchPrismaClientResult {
  /** Whether client.ts was patched to an isomorphic façade */
  clientPatched: boolean;
  /** Whether export type Decimal was added to prismaNamespaceBrowser.ts */
  decimalTypeAdded: boolean;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

const ISOMORPHIC_FACADE = `// Isomorphic facade - safe for browser/Vite SSR/Fresh
// For PrismaClient, import from ./client.server.ts
export * from './browser.ts';
`;

/**
 * Patch a Prisma-generated directory for isomorphic imports.
 *
 * @param generatedDir - Absolute path to the `.generated` directory
 *   (e.g. `database/mysql/schemas/netscript/.generated`)
 * @param options - Configuration options
 */
export async function patchPrismaClient(
  generatedDir: string,
  options: PatchPrismaClientOptions = {},
): Promise<PatchPrismaClientResult> {
  const { verbose = true } = options;
  const log = verbose ? console.log.bind(console) : () => {};

  const result: PatchPrismaClientResult = {
    clientPatched: false,
    decimalTypeAdded: false,
  };

  // ============================================================================
  // PHASE 1+2: client.ts → client.server.ts + isomorphic façade
  // ============================================================================

  const clientPath = join(generatedDir, 'client.ts');
  const serverClientPath = join(generatedDir, 'client.server.ts');

  if (await exists(clientPath)) {
    log(`🔧 Patching Prisma client in: ${generatedDir}`);

    if (!await exists(serverClientPath)) {
      const originalClient = await Deno.readTextFile(clientPath);
      await Deno.writeTextFile(serverClientPath, originalClient);
      log('   📋 Backed up original → client.server.ts');
    } else {
      log('   ℹ️  client.server.ts already exists — skipping backup');
    }

    await Deno.writeTextFile(clientPath, ISOMORPHIC_FACADE);
    log('   ✅ client.ts → isomorphic re-export of browser.ts');
    result.clientPatched = true;
  } else {
    log(`   ⚠️  No client.ts found in ${generatedDir} — skipping client patch`);
  }

  // ============================================================================
  // PHASE 3: export type Decimal in prismaNamespaceBrowser.ts
  // ============================================================================

  const browserNamespacePath = join(generatedDir, 'internal', 'prismaNamespaceBrowser.ts');

  if (await exists(browserNamespacePath)) {
    let content = await Deno.readTextFile(browserNamespacePath);

    if (!content.includes('export type Decimal = runtime.Decimal')) {
      content = content.replace(
        /export const Decimal = runtime\.Decimal\n/,
        'export const Decimal = runtime.Decimal\nexport type Decimal = runtime.Decimal\n',
      );
      await Deno.writeTextFile(browserNamespacePath, content);
      log('   💎 Added "export type Decimal = runtime.Decimal" to prismaNamespaceBrowser.ts');
      result.decimalTypeAdded = true;
    }
  }

  return result;
}

/**
 * CLI runner: patch a single generated directory and log a summary.
 */
export async function runPatchPrismaClient(
  generatedDir: string,
  options: PatchPrismaClientOptions = {},
): Promise<void> {
  const result = await patchPrismaClient(generatedDir, options);

  if (!result.clientPatched && !result.decimalTypeAdded) {
    console.log(`   ℹ️  Nothing to patch in ${generatedDir}`);
  }
}
