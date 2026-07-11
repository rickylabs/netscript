import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import { cli, commandGate, denoCommand } from './gate-factory.ts';

/** Create generated-project gates for the Fresh UI AI collection. */
export function createUiAiGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.SCAFFOLD_UI_ADD_AI,
      'Install the Fresh UI AI collection',
      GATE_PHASE.SCAFFOLD,
      (context) =>
        cli(
          context,
          'ui:add',
          'ai',
          '--project-root',
          context.project.projectRoot,
          '--registry-root',
          `${context.project.repoRoot}/packages/fresh-ui`,
          '--force',
        ),
    ),
    commandGate(
      GATE.SCAFFOLD_UI_LOCAL_SOURCE,
      'Map the unpublished AI dependency to the local workspace member',
      GATE_PHASE.SCAFFOLD,
      () => ['deno', 'eval', UI_LOCAL_SOURCE_SCRIPT],
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.GENERATED_UI_AI_CHECK,
      'Type-check copied Fresh UI AI files',
      GATE_PHASE.DATABASE,
      (context) =>
        denoCommand(
          context,
          'check',
          '--unstable-kv',
          'islands/ui/McpUiWidget.tsx',
          'lib/ai/render-ui.tsx',
        ),
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.BEHAVIOR_UI_RENDER,
      'Render safe nested and fallback generative UI output',
      GATE_PHASE.BEHAVIOR,
      () => ['deno', 'eval', '--config', 'deno.json', UI_RENDER_ASSERTION_SCRIPT],
      (context) => context.project.projectRoot,
    ),
  ];
}

const UI_LOCAL_SOURCE_SCRIPT = [
  'const requiredPaths = [',
  '  "islands/ui/McpUiWidget.tsx",',
  '  "assets/ui/mcp-ui-widget.css",',
  '  "lib/ai/render-ui.tsx",',
  '  "assets/styles.css",',
  '  "assets/tokens.css",',
  '  "assets/theme-bridge.css",',
  '  "assets/tokens.json",',
  '];',
  'for (const requiredPath of requiredPaths) {',
  '  try { await Deno.stat(requiredPath); } catch (error) {',
  '    if (error instanceof Deno.errors.NotFound) throw new Error(`ui:add ai did not copy ${requiredPath}`);',
  '    throw error;',
  '  }',
  '}',
  'const path = "deno.json";',
  'const config = JSON.parse(await Deno.readTextFile(path));',
  'if (!config.imports || config.imports["@netscript/ai"] !== "jsr:@netscript/ai@^0.0.1-beta.5") {',
  '  throw new Error("ui:add ai did not merge the expected @netscript/ai dependency");',
  '}',
  'config.imports["@netscript/ai"] = "./packages/ai/mod.ts";',
  'config.compilerOptions = {',
  '  ...config.compilerOptions,',
  '  jsx: "precompile",',
  '  jsxImportSource: "preact",',
  '};',
  'await Deno.writeTextFile(path, `${JSON.stringify(config, null, 2)}\n`);',
  'console.info(`verified ${requiredPaths.length} AI/theme artifacts and configured local-source TSX`);',
].join('\n');

const UI_RENDER_ASSERTION_SCRIPT = [
  'import { render } from "npm:preact-render-to-string@^6.7.0";',
  'import { RENDER_UI_MAX_DEPTH, renderUiPayload } from "./lib/ai/render-ui.tsx";',
  'const nested = render(renderUiPayload({',
  '  component: "section",',
  '  title: "Operations <script>alert(1)</script>",',
  '  props: { children: [{ type: "grid", props: { children: [',
  '    { type: "chart", props: { title: "Traffic", data: [{ label: "ok", value: 7 }] } },',
  '    { type: "table", props: { columns: ["name", "value"], rows: [{ name: "safe", value: 7 }] } },',
  '  ] } }] },',
  '}));',
  'for (const type of ["section", "grid", "chart", "table"]) {',
  '  const marker = `data-render-ui-type="${type}"`;',
  '  if (!nested.includes(marker)) throw new Error(`missing rendered marker: ${marker}\n${nested}`);',
  '}',
  'if (nested.includes("<script>")) throw new Error(`renderer emitted raw HTML: ${nested}`);',
  'if (!nested.includes("&lt;script>alert(1)&lt;/script>")) throw new Error(`renderer did not escape text: ${nested}`);',
  'const unknown = render(renderUiPayload({ component: "raw-html", props: { html: "<img src=x onerror=alert(1)>" } }));',
  'if (!unknown.includes(`data-render-ui-fallback="unknown-type"`)) throw new Error(`missing unknown fallback: ${unknown}`);',
  'if (unknown.includes("<img")) throw new Error(`unknown fallback emitted raw HTML: ${unknown}`);',
  'let deep = { type: "metric", props: { label: "leaf", value: 1 } };',
  'for (let index = 0; index <= RENDER_UI_MAX_DEPTH; index++) deep = { type: "stack", props: { children: [deep] } };',
  'const overflow = render(renderUiPayload({ component: "stack", props: { children: [deep] } }));',
  'if (!overflow.includes(`data-render-ui-fallback="max-depth"`)) throw new Error(`missing depth fallback: ${overflow}`);',
  'if (overflow.includes("<script>") || overflow.includes("<img")) throw new Error(`fallback emitted raw HTML: ${overflow}`);',
  'console.info("nested layout/viz/data output and safe unknown/depth fallbacks verified");',
].join('\n');
