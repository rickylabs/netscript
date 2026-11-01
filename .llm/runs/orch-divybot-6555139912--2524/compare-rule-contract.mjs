import { chromium } from '../../../tools/fresh-ui-browser/node_modules/playwright-core/index.mjs';
import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';

// Expand the browser's parsed nested rules to verify declarations, selectors and media order.
const baseline = process.argv[2];
if (!baseline) throw new Error('Supply the baseline commit');
const files = [];
for (const dir of ['components/ui', 'islands', 'styles']) {
  for (const file of (await readdir(`packages/fresh-ui/registry/${dir}`)).sort()) {
    if (file.endsWith('.css')) files.push(`packages/fresh-ui/registry/${dir}/${file}`);
  }
}
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const reports = [];
  for (const file of files) {
    const before = execFileSync('git', ['show', `${baseline}:${file}`], { encoding: 'utf8' });
    const after = await readFile(file, 'utf8');
    reports.push(await page.evaluate(({ file, before, after }) => {
      function rules(css) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(css.replace(/@import\s+[^;]+;/g, ''));
        const result = [];
        function visit(list, parent = '', conditions = []) {
          for (const rule of list) {
            if (rule instanceof CSSStyleRule) {
              const selector = parent ? rule.selectorText.replaceAll('&', parent) : rule.selectorText;
              if (rule.style.length) result.push([conditions, selector, rule.style.cssText.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\s+/g, (match, quoted) => quoted ?? ' ')]);
              if (rule.cssRules.length) visit(rule.cssRules, selector, conditions);
            } else if (rule.cssRules) {
              visit(rule.cssRules, parent, [...conditions, rule.cssText.slice(0, rule.cssText.indexOf('{')).trim()]);
            } else {
              result.push([conditions, rule.cssText]);
            }
          }
        }
        visit(sheet.cssRules);
        return result;
      }
      const a = rules(before), b = rules(after);
      const diffs = [];
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) diffs.push({ index: i, before: a[i], after: b[i] });
      }
      return { file, rules: a.length, differences: diffs };
    }, { file, before, after }));
  }
  const differences = reports.flatMap(r => r.differences.map(d => ({ file: r.file, ...d })));
  console.log(JSON.stringify({ browser: browser.version(), baseline, files: files.length, rules: reports.reduce((n, r) => n + r.rules, 0), differences }, null, 2));
  if (!reports.length || differences.length) process.exitCode = 1;
} finally {
  await browser.close();
}
