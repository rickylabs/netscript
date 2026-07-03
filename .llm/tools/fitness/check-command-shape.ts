import {
  type Finding,
  lineOf,
  normalizePath,
  parseOptions,
  report,
  isTestOrFixture,
  sourceFiles,
  textFile,
} from './cli-fitness-shared.ts';

const options = parseOptions();
const findings: Finding[] = [];
const commandExtends = /extends\s+(CliCommand|ScaffoldCommand|DeployStepCommand)\b/;
const commandFactory = /export\s+function\s+create[A-Z][A-Za-z0-9]*Command\b/;
const commandConstant =
  /export\s+const\s+[A-Za-z0-9_]*Command(?:\s*:\s*[^=]+)?\s*=\s*new\s+Command\b/;
const useCaseExtends = /extends\s+(UseCase|Pipeline|Registry)(\b|<)/;

for (const path of await sourceFiles(options.root)) {
  if (!path.endsWith('.ts')) continue;
  const normalized = normalizePath(path);
  const text = await textFile(path);
  if (
    normalized.includes('/features/') &&
    normalized.endsWith('-command.ts') &&
    !commandExtends.test(text) &&
    !commandFactory.test(text) &&
    !commandConstant.test(text)
  ) {
    findings.push({
      path,
      line: lineOf(text, text.indexOf('export')),
      message:
        'Feature command files must export a class extending CliCommand or a layer-2 command abstract.',
    });
  }
  if (
    normalized.includes('/src/kernel/application/') &&
    !normalized.includes('/abstracts/') &&
    !normalized.includes('/registries/') &&
    !normalized.includes('/testing/') &&
    !isTestOrFixture(normalized) &&
    !normalized.endsWith('_test.ts') &&
    /\bexport\s+class\b/.test(text) &&
    !useCaseExtends.test(text)
  ) {
    findings.push({
      path,
      line: lineOf(text, text.indexOf('export class')),
      message: 'Application classes must extend UseCase, Pipeline, or Registry.',
    });
  }
}

report('F-CLI-17/F-CLI-18 command and application shape', findings, options.json);
