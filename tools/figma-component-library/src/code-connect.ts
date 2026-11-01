import { z } from 'npm:zod@^4.6.5';
import type { ImportReceipt, LibraryBundle, LibraryComponent, LibraryInput } from './contract.ts';
import { libraryHash, serializeLibrary, validateLibrary } from './validate-library.ts';

const receiptSchema: z.ZodType<ImportReceipt> = z.object({
  schemaVersion: z.literal(1),
  provenance: z.enum(['figma-editor', 'fixture']),
  bundleHash: z.string().regex(/^[0-9a-f]{64}$/),
  fileKey: z.string().regex(/^[A-Za-z0-9_-]{6,128}$/),
  pageId: z.string().regex(/^[0-9]+:[0-9]+$/),
  components: z.array(
    z.object({
      item: z.string().min(1),
      registryItem: z.string().min(1),
      nodeId: z.string().regex(/^[0-9]+:[0-9]+$/),
    }).strict(),
  ).min(1),
}).strict();

/** Refuse fixture-tagged, stale, incomplete, duplicate and mismatched native receipts. */
export async function validateReceipt(
  input: unknown,
  bundle: LibraryBundle,
  options: { readonly dryRun?: boolean } = {},
): Promise<ImportReceipt> {
  const receipt = receiptSchema.parse(input);
  if (receipt.provenance !== 'figma-editor' && !options.dryRun) {
    throw new Error('Fixture receipt cannot produce publication output; use a real editor import');
  }
  if (receipt.bundleHash !== await libraryHash(bundle)) {
    throw new Error('Stale receipt bundle hash');
  }
  const byItem = new Map(receipt.components.map((c) => [c.item, c]));
  const nodeIds = new Set(receipt.components.map((c) => c.nodeId));
  if (
    byItem.size !== receipt.components.length || nodeIds.size !== receipt.components.length ||
    nodeIds.has(receipt.pageId)
  ) {
    throw new Error('Duplicate receipt mapping or node identity');
  }
  if (receipt.components.length !== bundle.components.length) {
    throw new Error('Missing receipt mapping coverage');
  }
  for (const component of bundle.components) {
    const entry = byItem.get(component.item);
    if (!entry || entry.registryItem !== component.registryItem) {
      throw new Error(`Unknown or mismatched receipt item: ${component.item}`);
    }
  }
  return receipt;
}

function html(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function template(
  component: LibraryComponent,
  url: string,
  style: string,
  dryRun: boolean,
): string {
  const lines = [
    `// url=${url}`,
    `// source=${component.source}`,
    `// component=${component.contract.name}`,
  ];
  if (dryRun) {
    lines.push('// DRY RUN: fixture provenance; not evidence of editor execution or publication.');
  }
  lines.push("import figma from 'figma';");
  if (component.axes.length) lines.push('const instance = figma.selectedInstance;');
  component.axes.forEach((axis, index) => {
    const mapping = Object.fromEntries(axis.values.map((value) => [value, html(value)]));
    lines.push(
      `const p${index} = instance.getEnum(${JSON.stringify(axis.property)}, ${
        JSON.stringify(mapping)
      });`,
    );
  });
  const attrs = (part: string): string =>
    component.axes.map((axis, index) =>
      axis.parts.includes(part) ? ` ${axis.property}="\${p${index}}"` : ''
    ).join('');
  const root = component.contract.parts.find((part) => part.name === 'root');
  const children = component.contract.parts.filter((part) => part.name !== 'root').map((part) => {
    if (part.representation && part.representation !== 'element') {
      return `  <!-- ${part.representation}: data-part="${part.name}"${attrs(part.name)} -->`;
    }
    return `  <div data-part="${part.name}"${attrs(part.name)}></div>`;
  });
  const markup = root?.representation && root.representation !== 'element'
    ? `<!-- ${root.representation}: data-part="root"${attrs('root')} -->\n${children.join('\n')}`
    : `<div data-part="root"${attrs('root')}>\n${children.join('\n')}\n</div>`;
  lines.push(
    'export default {',
    `  id: ${JSON.stringify(`netscript/${style}/${component.item}`)},`,
    `  example: figma.code\`\n${markup}\n\`,`,
    `  imports: [${
      JSON.stringify(`// Registry source: netscript ui:add ${component.registryItem}`)
    }],`,
    `  metadata: { nestable: true, props: ${
      JSON.stringify({
        registryItem: component.registryItem,
        contract: component.contract.name,
        specId: component.contract.specId,
      })
    } },`,
    '};',
    '',
  );
  return lines.join('\n');
}

/** Render maintained framework-agnostic Code Connect templates entirely before filesystem writes. */
export async function codeConnectFiles(
  input: unknown,
  receiptInput: unknown,
  sources: LibraryInput,
  options: { readonly dryRun?: boolean } = {},
): Promise<Readonly<Record<string, string>>> {
  const bundle = validateLibrary(input, sources);
  const receipt = await validateReceipt(receiptInput, bundle, options);
  const files: Record<string, string> = {};
  const mappings = bundle.components.map((component) => {
    const native = receipt.components.find((c) => c.item === component.item);
    if (!native) throw new Error(`Missing receipt item: ${component.item}`);
    const url = `https://www.figma.com/design/${receipt.fileKey}/NetScript?node-id=${
      native.nodeId.replace(':', '-')
    }`;
    // Fixture previews deliberately do not match the publisher's *.figma.ts discovery glob.
    const path = `${component.item}.figma${options.dryRun ? '.preview' : ''}.ts`;
    files[path] = template(component, url, bundle.style, options.dryRun === true);
    return {
      item: component.item,
      registryItem: component.registryItem,
      contract: component.contract.name,
      source: component.source,
      nodeId: native.nodeId,
      url,
      template: path,
    };
  });
  files['figma.config.json'] = serializeLibrary({
    codeConnect: {
      include: ['*.figma.ts'],
      label: 'HTML',
      language: 'html',
    },
  });
  files['mappings.json'] = serializeLibrary({
    schemaVersion: 1,
    bundleHash: receipt.bundleHash,
    provenance: receipt.provenance,
    dryRun: options.dryRun === true,
    coverage: bundle.coverage,
    mappings,
  });
  return files;
}
