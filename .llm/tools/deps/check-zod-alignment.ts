#!/usr/bin/env -S deno run --allow-read
/** Enforce a single npm Zod 4 instance across workspace manifests, source, and lock data. */
import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { join, normalize, relative } from 'jsr:@std/path@^1.0.0';
import { discoverWorkspaceMembers, readJsonFile } from './workspace.ts';

const ZOD_NAME = 'zod';
const WORKSPACE_ZOD_SPECIFIER = 'catalog:';
const ORPC_ZOD_V4_SPECIFIER = '@orpc/zod/zod4';
const DOCUMENTED_V3_JSR_PARENT = '@olli/kvdex@3.6.7';
const AI_MCP_ZOD4_PACKAGES = [
  '@anthropic-ai/sdk@',
  '@modelcontextprotocol/sdk@',
  'openai@',
  'zod-to-json-schema@',
] as const;

export interface ZodMemberImport {
  path: string;
  specifier: string;
}

export interface OrpcZodImport {
  path: string;
  specifier: string;
}

export interface ZodAlignmentInput {
  catalogZod?: string;
  memberImports: ZodMemberImport[];
  legacyJsrUses?: string[];
  lockText: string;
  orpcImports: OrpcZodImport[];
}

export interface ZodAlignmentFinding {
  code:
    | 'CATALOG'
    | 'MEMBER_SPECIFIER'
    | 'LOCK_INSTANCE'
    | 'PEER_CLUSTER'
    | 'ORPC_SURFACE';
  path: string;
  message: string;
}

export interface ZodAlignmentReport {
  findings: ZodAlignmentFinding[];
  resolvedInstances: string[];
}

interface LockPackage {
  dependencies?: string[];
}

interface DenoLock {
  jsr?: Record<string, LockPackage>;
  npm?: Record<string, LockPackage>;
}

function lockZodInstances(lock: DenoLock): string[] {
  return Object.keys(lock.npm ?? {})
    .filter((key) => /^zod@\d/.test(key))
    .sort();
}

function dependenciesOf(packages: Record<string, LockPackage>, name: string): string[] {
  return packages[name]?.dependencies ?? [];
}

function v3Parents(lock: DenoLock): string[] {
  const parents: string[] = [];
  for (const name of Object.keys(lock.jsr ?? {})) {
    if (dependenciesOf(lock.jsr ?? {}, name).some((dep) => /^npm:zod@\^?3\./.test(dep))) {
      parents.push(name);
    }
  }
  for (const name of Object.keys(lock.npm ?? {})) {
    if (dependenciesOf(lock.npm ?? {}, name).some((dep) => /^zod@3\./.test(dep))) {
      parents.push(name);
    }
  }
  return parents.sort();
}

/** Analyze materialized Zod dependency inputs without mutating the repository. */
export function analyzeZodAlignment(input: ZodAlignmentInput): ZodAlignmentReport {
  const findings: ZodAlignmentFinding[] = [];
  const lock = JSON.parse(input.lockText) as DenoLock;
  if (!input.catalogZod || !/^\^?4\./.test(input.catalogZod)) {
    findings.push({
      code: 'CATALOG',
      path: 'deno.json',
      message: `root catalog zod must be an npm v4 range, got ${input.catalogZod ?? '<missing>'}`,
    });
  }

  for (const member of input.memberImports) {
    if (member.specifier !== WORKSPACE_ZOD_SPECIFIER) {
      findings.push({
        code: 'MEMBER_SPECIFIER',
        path: member.path,
        message: `workspace zod must use ${WORKSPACE_ZOD_SPECIFIER}, got ${member.specifier}`,
      });
    }
  }
  for (const path of input.legacyJsrUses ?? []) {
    findings.push({
      code: 'MEMBER_SPECIFIER',
      path,
      message: 'workspace source must not emit or import jsr:@zod/zod',
    });
  }

  const resolvedInstances = lockZodInstances(lock);
  const documentedParents = [DOCUMENTED_V3_JSR_PARENT];
  if (
    resolvedInstances.length !== 2 ||
    !resolvedInstances.some((instance) => /^zod@3\./.test(instance)) ||
    !resolvedInstances.some((instance) => /^zod@4\./.test(instance)) ||
    JSON.stringify(v3Parents(lock)) !== JSON.stringify(documentedParents)
  ) {
    findings.push({
      code: 'LOCK_INSTANCE',
      path: 'deno.lock',
      message: `expected npm Zod 4 plus only the documented v3 parents ${
        documentedParents.join(', ')
      }, got instances ${resolvedInstances.join(', ') || '<none>'} and v3 parents ${
        v3Parents(lock).join(', ') || '<none>'
      }`,
    });
  }

  for (const packagePrefix of AI_MCP_ZOD4_PACKAGES) {
    const matching = Object.entries(lock.npm ?? {}).filter(([name]) =>
      name.startsWith(packagePrefix)
    );
    if (
      matching.length === 0 ||
      matching.some(([name, pkg]) =>
        !name.includes('_zod@4.') && !(pkg.dependencies ?? []).some((dep) => /^zod@4\./.test(dep))
      )
    ) {
      findings.push({
        code: 'PEER_CLUSTER',
        path: 'deno.lock',
        message: `${packagePrefix.slice(0, -1)} must resolve through npm Zod 4`,
      });
    }
  }

  for (const imported of input.orpcImports) {
    if (imported.specifier !== ORPC_ZOD_V4_SPECIFIER) {
      findings.push({
        code: 'ORPC_SURFACE',
        path: imported.path,
        message: `source must import ${ORPC_ZOD_V4_SPECIFIER}, got ${imported.specifier}`,
      });
    }
  }

  return { findings, resolvedInstances };
}

async function collectInput(root: string): Promise<ZodAlignmentInput> {
  const rootConfig = await readJsonFile(join(root, 'deno.json'));
  const catalog = (rootConfig.catalog ?? {}) as Record<string, unknown>;
  const memberImports: ZodMemberImport[] = [];
  const legacyJsrUses: string[] = [];
  const orpcImports: OrpcZodImport[] = [];
  const members = await discoverWorkspaceMembers(root);

  for (const member of members) {
    const config = await readJsonFile(join(root, member.denoJsonPath));
    const imports = (config.imports ?? {}) as Record<string, unknown>;
    if (typeof imports[ZOD_NAME] === 'string') {
      memberImports.push({ path: member.denoJsonPath, specifier: imports[ZOD_NAME] });
    }

    for await (
      const entry of walk(join(root, member.root), {
        match: [/\.[cm]?tsx?$/],
        skip: [/node_modules/, /\.generated/, /_fresh/, /\.deploy/],
      })
    ) {
      const text = await Deno.readTextFile(entry.path);
      if (text.includes('jsr:@zod/zod')) {
        legacyJsrUses.push(normalize(relative(root, entry.path)));
      }
      for (
        const match of text.matchAll(
          /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"](@orpc\/zod(?:\/[^'"]*)?)['"]/g,
        )
      ) {
        orpcImports.push({
          path: normalize(relative(root, entry.path)),
          specifier: match[1],
        });
      }
    }
  }

  return {
    catalogZod: typeof catalog[ZOD_NAME] === 'string' ? catalog[ZOD_NAME] : undefined,
    memberImports,
    legacyJsrUses,
    lockText: await Deno.readTextFile(join(root, 'deno.lock')),
    orpcImports,
  };
}

async function main(): Promise<void> {
  const report = analyzeZodAlignment(await collectInput(Deno.cwd()));
  if (report.findings.length === 0) {
    console.log(
      `zod-alignment PASS instances=${
        report.resolvedInstances.join(',')
      } residual-v3=${DOCUMENTED_V3_JSR_PARENT}`,
    );
    return;
  }
  console.error(`zod-alignment FAIL findings=${report.findings.length}`);
  for (const finding of report.findings) {
    console.error(`${finding.code} ${finding.path} ${finding.message}`);
  }
  Deno.exit(1);
}

if (import.meta.main) await main();
