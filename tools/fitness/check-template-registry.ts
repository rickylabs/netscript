import { basename } from 'jsr:@std/path@^1.0.0';
import {
  type Finding,
  normalizePath,
  parseOptions,
  report,
  sourceFiles,
  textFile,
} from './cli-fitness-shared.ts';

const options = parseOptions();
const findings: Finding[] = [];
const files = await sourceFiles(options.root);
const assetFiles = files
  .filter((path) =>
    normalizePath(path).includes('/src/kernel/assets/') && path.endsWith('.template')
  )
  .map((path) => basename(path))
  .sort();
const manifestPath = `${options.root}/src/kernel/assets/manifest.ts`;
const manifest = await textFile(manifestPath).catch(() => '');

for (const file of assetFiles) {
  if (!manifest.includes(file)) {
    findings.push({
      path: manifestPath,
      message: `Template asset is missing from manifest: ${file}`,
    });
  }
}

report('F-CLI-24 template registry', findings, options.json);
