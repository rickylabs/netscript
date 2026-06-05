/**
 * @module infra/scaffold/workspace-writer_test
 *
 * Unit tests for workspace mutation utilities:
 * {@link addWorkspaceMember}, {@link validateUniqueName}, and {@link allocatePort}.
 *
 * Uses {@link MemoryFileSystemAdapter} for all filesystem operations, avoiding
 * real disk I/O. Port allocation tests use {@link spy} from `@std/testing/mock`
 * with dependency injection to exercise range logic without network access.
 */

import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { beforeEach, describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertSpyCalls, spy } from 'jsr:@std/testing@^1/mock';
import { ScaffoldValidationError } from '../../../domain/errors.ts';
import { MemoryFileSystemAdapter } from '../memory-fs.ts';
import {
  addWorkspaceMember,
  allocatePort,
  validateResourceName,
  validateUniqueName,
} from '../workspace-writer.ts';

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

/**
 * Serialised root deno.json used as the workspace fixture.
 * Contains two pre-existing members so sort/dedup tests have a clear baseline.
 */
const WORKSPACE_DENO_JSON = JSON.stringify(
  {
    workspace: ['./contracts', './plugins'],
    tasks: { dev: 'deno run' },
  },
  null,
  2,
) + '\n';

// ---------------------------------------------------------------------------
// addWorkspaceMember
// ---------------------------------------------------------------------------

describe('addWorkspaceMember', () => {
  let fs: MemoryFileSystemAdapter;
  const rootPath = '/root';

  beforeEach(async () => {
    fs = new MemoryFileSystemAdapter();
    await fs.writeFile('/root/deno.json', WORKSPACE_DENO_JSON);
  });

  it('adds member and sorts alphabetically', async () => {
    await addWorkspaceMember(rootPath, 'services/users', fs);

    const config = JSON.parse(await fs.readFile('/root/deno.json')) as {
      workspace: string[];
    };
    assertEquals(config.workspace, ['./contracts', './plugins', './services/users']);
  });

  it('throws if member already exists', async () => {
    // 'contracts' normalises to './contracts', which is already in the workspace.
    await assertRejects(
      () => addWorkspaceMember(rootPath, 'contracts', fs),
      Error,
      'already exists',
    );
  });

  it('normalizes backslashes in member path', async () => {
    // The runtime string is 'services\users' (single backslash); the function
    // must convert it to './services/users' before writing.
    await addWorkspaceMember(rootPath, 'services\\users', fs);

    const config = JSON.parse(await fs.readFile('/root/deno.json')) as {
      workspace: string[];
    };
    assertEquals(config.workspace.includes('./services/users'), true);
  });

  it('normalizes member path without leading ./', async () => {
    // A bare segment like 'new-member' must be stored as './new-member'.
    await addWorkspaceMember(rootPath, 'new-member', fs);

    const config = JSON.parse(await fs.readFile('/root/deno.json')) as {
      workspace: string[];
    };
    assertEquals(config.workspace.includes('./new-member'), true);
  });
});

// ---------------------------------------------------------------------------
// validateUniqueName
// ---------------------------------------------------------------------------

describe('validateUniqueName', () => {
  let fs: MemoryFileSystemAdapter;
  const rootPath = '/root';

  beforeEach(() => {
    fs = new MemoryFileSystemAdapter();
  });

  it('accepts valid kebab-case names', async () => {
    // No deno.json seeded — workspace check is skipped for all three names.
    await validateUniqueName(rootPath, 'my-service', 'service', fs);
    await validateUniqueName(rootPath, 'auth-v2', 'service', fs);
    await validateUniqueName(rootPath, 'users', 'service', fs);
  });

  it('validates resource names without workspace uniqueness checks', () => {
    validateResourceName('workers', 'plugin');
    validateResourceName('sagas', 'plugin');
    validateResourceName('triggers', 'plugin');
  });

  it('rejects invalid pattern — uppercase', async () => {
    await assertRejects(
      () => validateUniqueName(rootPath, 'MyService', 'service', fs),
      ScaffoldValidationError,
      'kebab-case',
    );
  });

  it('rejects invalid pattern — starts with digit', async () => {
    await assertRejects(
      () => validateUniqueName(rootPath, '0service', 'service', fs),
      ScaffoldValidationError,
    );
  });

  it('rejects invalid pattern — special chars', async () => {
    await assertRejects(
      () => validateUniqueName(rootPath, 'my@service', 'service', fs),
      ScaffoldValidationError,
    );
    await assertRejects(
      () => validateUniqueName(rootPath, 'my service', 'service', fs),
      ScaffoldValidationError,
    );
  });

  it('rejects name exceeding max length', async () => {
    // 65 characters — one over the 64-character maximum.
    await assertRejects(
      () => validateUniqueName(rootPath, 'a'.repeat(65), 'service', fs),
      ScaffoldValidationError,
    );
  });

  it('rejects reserved names', async () => {
    await assertRejects(
      () => validateUniqueName(rootPath, 'test', 'service', fs),
      ScaffoldValidationError,
      'reserved',
    );
    await assertRejects(
      () => validateUniqueName(rootPath, 'netscript', 'service', fs),
      ScaffoldValidationError,
      'reserved',
    );
    await assertRejects(
      () => validateUniqueName(rootPath, 'build', 'service', fs),
      ScaffoldValidationError,
      'reserved',
    );
  });

  it('rejects names already in workspace', async () => {
    // Seed a deno.json that contains ./services/users; the name 'users' must be
    // rejected because it matches the trailing segment of that member path.
    const config = JSON.stringify({ workspace: ['./services/users'] }, null, 2) + '\n';
    await fs.writeFile('/root/deno.json', config);

    await assertRejects(
      () => validateUniqueName(rootPath, 'users', 'service', fs),
      ScaffoldValidationError,
    );
  });
});

// ---------------------------------------------------------------------------
// allocatePort
// ---------------------------------------------------------------------------

describe('allocatePort', () => {
  it('returns preferred port when available', async () => {
    // Spy echoes back whatever preferredPort is requested, simulating the port
    // being free on the host. Injected as the third DI argument.
    const getPortSpy = spy((opts?: { preferredPort?: number }) => opts?.preferredPort ?? 3000);
    const port = await allocatePort('SERVICE', new Set(), getPortSpy);
    assertEquals(port, 3000); // first port in the SERVICE range (3000–3099)
    assertSpyCalls(getPortSpy, 1);
  });

  it('skips already used ports', async () => {
    // Spy: if the candidate is 3000 (taken at the OS level) it hands back 3001;
    // otherwise the requested port is available and echoed straight back.
    const getPortSpy = spy((opts?: { preferredPort?: number }) => {
      const p = opts?.preferredPort ?? 3000;
      return p === 3000 ? 3001 : p;
    });
    // 3000 is already claimed → allocator skips it and probes 3001 instead.
    const port = await allocatePort('SERVICE', new Set([3000]), getPortSpy);
    assertEquals(port, 3001);
    assertSpyCalls(getPortSpy, 1);
  });

  it('throws when range is exhausted', async () => {
    // All ports in the SERVICE range are pre-marked as used, so the allocator
    // exhausts the range without ever calling getPort — confirmed below.
    const getPortSpy = spy((opts?: { preferredPort?: number }) => {
      const p = opts?.preferredPort ?? 3000;
      return p + 1000; // always a different port
    });
    const usedPorts = new Set<number>();
    for (let p = 3000; p <= 3099; p++) usedPorts.add(p);

    await assertRejects(
      () => allocatePort('SERVICE', usedPorts, getPortSpy),
      Error,
      'exhausted',
    );
    assertSpyCalls(getPortSpy, 0); // all ports pre-marked; getPort never reached
  });
});
