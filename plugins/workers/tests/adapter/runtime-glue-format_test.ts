/** Formatting regression for the installed background runtime. @module */
import { assertEquals } from '@std/assert';
import { artifactText } from '@netscript/plugin/adapter';
import {
  DEFAULT_RUNTIME_GLUE_INPUT,
  runtimeGlueScaffolder,
} from '../../src/adapter/resources/glue/glue.ts';

Deno.test('workers runtime glue is emitted in generated-workspace formatter canonical form', async () => {
  const artifacts = runtimeGlueScaffolder.emit(DEFAULT_RUNTIME_GLUE_INPUT);
  assertEquals(artifacts.length, 1);
  const source = artifactText(artifacts[0]);
  const formatter = new Deno.Command(Deno.execPath(), {
    args: ['fmt', '--no-config', '--line-width=100', '--single-quote', '--ext=ts', '-'],
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const writer = formatter.stdin.getWriter();
  await writer.write(new TextEncoder().encode(source));
  await writer.close();
  const output = await formatter.output();
  assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
  assertEquals(source, new TextDecoder().decode(output.stdout));
});
