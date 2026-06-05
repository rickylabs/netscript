/**
 * @module scaffolder_test
 *
 * Integration tests for the Scaffolder using MemoryFileSystemAdapter.
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { beforeEach, describe, it } from 'jsr:@std/testing@^1/bdd';
import { MemoryFileSystemAdapter } from '../memory-fs.ts';
import { StringTemplateAdapter } from '../template-adapter.ts';
import { Scaffolder } from '../scaffolder.ts';

describe('Scaffolder integration', () => {
  let fs: MemoryFileSystemAdapter;
  let scaffolder: Scaffolder;

  beforeEach(() => {
    fs = new MemoryFileSystemAdapter();
    const template = new StringTemplateAdapter(fs);
    scaffolder = new Scaffolder(template, fs);
  });

  it('should scaffold a single file from template content', async () => {
    const written = await scaffolder.scaffoldFile(
      '{ "name": "{{name}}" }',
      '/output/deno.json',
      { name: 'my-app' },
    );
    assert(written);
    const content = await fs.readFile('/output/deno.json');
    assertEquals(content, '{ "name": "my-app" }');
  });

  it('should write pre-rendered content directly', async () => {
    const written = await scaffolder.writeFile(
      '/output/config.ts',
      'export const x = 1;\n',
    );
    assert(written);
    const content = await fs.readFile('/output/config.ts');
    assertEquals(content, 'export const x = 1;\n');
  });

  it('should skip existing files without overwrite', async () => {
    await fs.writeFile('/output/file.txt', 'original');

    const written = await scaffolder.writeFile(
      '/output/file.txt',
      'new content',
      false,
    );
    assert(!written);
    const content = await fs.readFile('/output/file.txt');
    assertEquals(content, 'original');
  });

  it('should overwrite existing files with overwrite flag', async () => {
    await fs.writeFile('/output/file.txt', 'original');

    const written = await scaffolder.writeFile(
      '/output/file.txt',
      'new content',
      true,
    );
    assert(written);
    const content = await fs.readFile('/output/file.txt');
    assertEquals(content, 'new content');
  });

  it('should scaffold directory tree from templates', async () => {
    // Seed template directory
    await fs.createDir('/templates/workspace');
    await fs.writeFile(
      '/templates/workspace/deno.json.template',
      '{ "name": "{{name}}" }',
    );
    await fs.writeFile(
      '/templates/workspace/gitignore.template',
      'node_modules/',
    );

    const result = await scaffolder.scaffold({
      templatePath: '/templates/workspace',
      targetPath: '/output/my-app',
      variables: { name: 'my-app' },
    });

    // Assert files created
    assert(result.filesCreated.length >= 2);
    assert(await fs.exists('/output/my-app/deno.json'));
    assert(await fs.exists('/output/my-app/.gitignore'));

    // Assert .template stripped and dotfile mapped
    const denoJson = await fs.readFile('/output/my-app/deno.json');
    assertEquals(denoJson, '{ "name": "my-app" }');

    const gitignore = await fs.readFile('/output/my-app/.gitignore');
    assertEquals(gitignore, 'node_modules/');
  });

  it('should report skipped files in result', async () => {
    await fs.createDir('/templates');
    await fs.writeFile('/templates/file.template', 'new');
    await fs.createDir('/output');
    await fs.writeFile('/output/file', 'existing');

    const result = await scaffolder.scaffold({
      templatePath: '/templates',
      targetPath: '/output',
      variables: {},
      overwrite: false,
    });

    assertEquals(result.filesSkipped.length, 1);
    const content = await fs.readFile('/output/file');
    assertEquals(content, 'existing');
  });

  it('should create directories and report them', async () => {
    await fs.createDir('/templates');
    await fs.createDir('/templates/subdir');
    await fs.writeFile('/templates/subdir/file.txt', 'hello');

    const result = await scaffolder.scaffold({
      templatePath: '/templates',
      targetPath: '/output',
      variables: {},
    });

    assert(result.directoriesCreated.length >= 1);
    assert(await fs.exists('/output/subdir'));
    assert(await fs.exists('/output/subdir/file.txt'));
  });

  it('should check existence via the scaffolder', async () => {
    await fs.writeFile('/some/file', 'content');
    assert(await scaffolder.exists('/some/file'));
    assert(!await scaffolder.exists('/other/file'));
  });
});
