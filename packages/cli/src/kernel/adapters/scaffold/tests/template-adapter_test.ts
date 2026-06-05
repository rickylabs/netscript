/**
 * @module template-adapter_test
 * Unit tests for renderTemplate and StringTemplateAdapter.
 */

import { beforeEach, describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertThrows } from 'jsr:@std/assert@^1';
import { renderTemplate, StringTemplateAdapter } from '../template-adapter.ts';
import { MemoryFileSystemAdapter } from '../memory-fs.ts';

describe('renderTemplate', () => {
  it('should replace simple variables', () => {
    const result = renderTemplate('Hello {{name}}!', { name: 'world' });
    assertEquals(result, 'Hello world!');
  });

  it('should replace multiple variables', () => {
    const result = renderTemplate('{{a}} and {{b}}', { a: 'x', b: 'y' });
    assertEquals(result, 'x and y');
  });

  it('should apply camelCase pipe', () => {
    const result = renderTemplate('{{name | camelCase}}', { name: 'my-app' });
    assertEquals(result, 'myApp');
  });

  it('should apply pascalCase pipe', () => {
    const result = renderTemplate('{{name | pascalCase}}', { name: 'my-app' });
    assertEquals(result, 'MyApp');
  });

  it('should apply kebabCase pipe', () => {
    const result = renderTemplate('{{name | kebabCase}}', { name: 'MyApp' });
    assertEquals(result, 'my-app');
  });

  it('should apply snakeCase pipe', () => {
    const result = renderTemplate('{{name | snakeCase}}', { name: 'MyApp' });
    assertEquals(result, 'my_app');
  });

  it('should apply upperCase pipe', () => {
    const result = renderTemplate('{{name | upperCase}}', { name: 'hello' });
    assertEquals(result, 'HELLO');
  });

  it('should apply lowerCase pipe', () => {
    const result = renderTemplate('{{name | lowerCase}}', { name: 'HELLO' });
    assertEquals(result, 'hello');
  });

  it('should handle whitespace in placeholders', () => {
    const result = renderTemplate('{{ name }}', { name: 'test' });
    assertEquals(result, 'test');
  });

  it('should handle whitespace around pipe', () => {
    const result = renderTemplate('{{ name | pascalCase }}', { name: 'my-app' });
    assertEquals(result, 'MyApp');
  });

  it('should throw on undefined variable', () => {
    assertThrows(
      () => renderTemplate('{{missing}}', {}),
      Error,
      'Template variable "{{missing}}" is not defined',
    );
  });

  it('should throw on unknown pipe', () => {
    assertThrows(
      () => renderTemplate('{{name | badPipe}}', { name: 'test' }),
      Error,
      'Unknown pipe "badPipe"',
    );
  });

  it('should leave non-template content unchanged', () => {
    const result = renderTemplate('no placeholders here', { name: 'test' });
    assertEquals(result, 'no placeholders here');
  });
});

describe('StringTemplateAdapter', () => {
  let fs: MemoryFileSystemAdapter;
  let adapter: StringTemplateAdapter;

  beforeEach(() => {
    fs = new MemoryFileSystemAdapter();
    adapter = new StringTemplateAdapter(fs);
  });

  it('should have engine name', () => {
    assertEquals(adapter.engine, 'string-template');
  });

  it('should render template string', async () => {
    const result = await adapter.render('Hello {{name}}!', { name: 'world' });
    assertEquals(result, 'Hello world!');
  });

  it('should render file from filesystem', async () => {
    await fs.writeFile('/templates/test.template', 'Hello {{name | pascalCase}}!');
    const result = await adapter.renderFile('/templates/test.template', { name: 'my-app' });
    assertEquals(result, 'Hello MyApp!');
  });
});
