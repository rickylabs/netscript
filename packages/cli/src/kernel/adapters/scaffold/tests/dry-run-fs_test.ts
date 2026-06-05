/**
 * @module infra/scaffold/dry-run-fs_test
 *
 * Unit tests for {@link DryRunFileSystemAdapter}.
 *
 * Verifies that all mutating operations are recorded without being forwarded
 * to the inner {@link MemoryFileSystemAdapter}, and that read operations
 * correctly delegate to the inner adapter or synthesise from recorded ops.
 */

import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { beforeEach, describe, it } from 'jsr:@std/testing@^1/bdd';
import { DryRunFileSystemAdapter } from '../dry-run-fs.ts';
import { MemoryFileSystemAdapter } from '../memory-fs.ts';

describe('DryRunFileSystemAdapter', () => {
  let inner: MemoryFileSystemAdapter;
  let dryRun: DryRunFileSystemAdapter;

  beforeEach(() => {
    inner = new MemoryFileSystemAdapter();
    dryRun = new DryRunFileSystemAdapter(inner);
  });

  // ---------------------------------------------------------------------------
  // Recording operations
  // ---------------------------------------------------------------------------

  it('should record writeFile as write operation', async () => {
    await dryRun.writeFile('/out/file.ts', 'content');
    const ops = dryRun.getOperations();
    assertEquals(ops.length, 1);
    assertEquals(ops[0].type, 'write');
    assertEquals(ops[0].path, '/out/file.ts');
    assertEquals(ops[0].content, 'content');
  });

  it('should record createDir as mkdir operation', async () => {
    await dryRun.createDir('/out/subdir');
    const ops = dryRun.getOperations();
    assertEquals(ops.length, 1);
    assertEquals(ops[0].type, 'mkdir');
    assertEquals(ops[0].path, '/out/subdir');
  });

  it('should record remove as remove operation', async () => {
    await dryRun.remove('/out/file.ts');
    const ops = dryRun.getOperations();
    assertEquals(ops[0].type, 'remove');
  });

  it('should record copy with src in content field', async () => {
    await dryRun.copy('/src/file.ts', '/out/file.ts');
    const ops = dryRun.getOperations();
    assertEquals(ops[0].type, 'copy');
    assertEquals(ops[0].path, '/out/file.ts');
    assertEquals(ops[0].content, '/src/file.ts'); // src stored in content
  });

  it('should record multiple operations in order', async () => {
    await dryRun.createDir('/out');
    await dryRun.writeFile('/out/a.ts', 'a');
    await dryRun.writeFile('/out/b.ts', 'b');
    const ops = dryRun.getOperations();
    assertEquals(ops.length, 3);
    assertEquals(ops[0].type, 'mkdir');
    assertEquals(ops[1].type, 'write');
    assertEquals(ops[2].type, 'write');
  });

  // ---------------------------------------------------------------------------
  // NOT writing to disk
  // ---------------------------------------------------------------------------

  it('should NOT write files to the inner adapter', async () => {
    await dryRun.writeFile('/out/file.ts', 'content');
    assert(!await inner.exists('/out/file.ts'));
  });

  it('should NOT create directories in the inner adapter', async () => {
    await dryRun.createDir('/out/subdir');
    assert(!await inner.exists('/out/subdir'));
  });

  // ---------------------------------------------------------------------------
  // exists() — checks recorded ops first, then inner
  // ---------------------------------------------------------------------------

  it('exists() returns true for recorded write paths', async () => {
    await dryRun.writeFile('/out/file.ts', 'content');
    assert(await dryRun.exists('/out/file.ts'));
  });

  it('exists() returns true for recorded mkdir paths', async () => {
    await dryRun.createDir('/out/subdir');
    assert(await dryRun.exists('/out/subdir'));
  });

  it('exists() delegates to inner for unknown paths', async () => {
    await inner.writeFile('/existing/file.ts', 'real content');
    assert(await dryRun.exists('/existing/file.ts'));
  });

  it('exists() returns false for truly absent paths', async () => {
    assert(!await dryRun.exists('/nonexistent/path'));
  });

  // ---------------------------------------------------------------------------
  // stat() — synthesises from recorded ops, delegates to inner otherwise
  // ---------------------------------------------------------------------------

  it('stat() returns isFile:true for recorded write paths', async () => {
    await dryRun.writeFile('/out/file.ts', 'content');
    const info = await dryRun.stat('/out/file.ts');
    assertEquals(info.isFile, true);
    assertEquals(info.isDirectory, false);
  });

  it('stat() returns isDirectory:true for recorded mkdir paths', async () => {
    await dryRun.createDir('/out/subdir');
    const info = await dryRun.stat('/out/subdir');
    assertEquals(info.isFile, false);
    assertEquals(info.isDirectory, true);
  });

  it('stat() delegates to inner for real paths', async () => {
    await inner.writeFile('/existing/file.ts', 'real');
    const info = await dryRun.stat('/existing/file.ts');
    assertEquals(info.isFile, true);
  });

  // ---------------------------------------------------------------------------
  // readFile() — delegates to inner (reads must work during dry-run)
  // ---------------------------------------------------------------------------

  it('readFile() delegates to inner adapter', async () => {
    await inner.writeFile('/templates/tmpl.template', 'hello {{name}}');
    const content = await dryRun.readFile('/templates/tmpl.template');
    assertEquals(content, 'hello {{name}}');
  });

  it('readFile() throws if file not in inner', async () => {
    await assertRejects(() => dryRun.readFile('/nonexistent'), Error);
  });

  // ---------------------------------------------------------------------------
  // getOperations() — returns a snapshot copy, not a live reference
  // ---------------------------------------------------------------------------

  it('getOperations() returns copy not reference', async () => {
    await dryRun.writeFile('/a', 'a');
    const ops1 = dryRun.getOperations();
    await dryRun.writeFile('/b', 'b');
    const ops2 = dryRun.getOperations();
    assertEquals(ops1.length, 1); // first snapshot unchanged
    assertEquals(ops2.length, 2);
  });
});
