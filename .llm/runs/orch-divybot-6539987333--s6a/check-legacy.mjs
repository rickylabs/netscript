import { chromium } from '../../../tools/fresh-ui-browser/node_modules/playwright-core/index.mjs';
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
// Compare computed legacy geometry and paint with the current slice's committed baseline.
const [input, variants] = process.argv.slice(2);
const fixtures = [...JSON.parse(await readFile(input,'utf8')), ...JSON.parse(await readFile(variants,'utf8'))];
const files = [];
for (const dir of ['packages/fresh-ui/registry/components/ui','packages/fresh-ui/registry/islands']) {
 for (const name of await readdir(dir)) if(name.endsWith('.css')) files.push(`${dir}/${name}`);
}
files.push('packages/fresh-ui/registry/styles/layouts.css');
const before = files.map(f=>execFileSync('git',['show',`HEAD:${f}`],{encoding:'utf8'})).join('\n');
const after = (await Promise.all(files.map(f=>readFile(f,'utf8')))).join('\n');
const tokens = await readFile('packages/fresh-ui/registry/theme/tokens.css','utf8');
const browser = await chromium.launch();
const errors=[];
try {
 for(const scheme of ['light','dark']) {
 const page=await browser.newPage({colorScheme:scheme});
 const snapshots=[];
 for(const css of [before,after]) {
 await page.setContent(`<html data-theme="${scheme}" data-preset="ns-one"><head><style>${tokens}\n${css.replace(/@import\s+[^;]+;/g,'')}\n*{animation:none!important;transition:none!important}</style></head><body>${fixtures.map(f=>f.html).join('')}</body></html>`);
 snapshots.push(await page.locator('[data-part]').evaluateAll(els=>els.map(el=>{
 const s=getComputedStyle(el);return ['color','backgroundColor','borderColor','borderRadius','boxShadow','transform','height','width','padding','fontFamily','fontSize','fontWeight','opacity'].map(p=>s[p]);
 })));
 }
 if(JSON.stringify(snapshots[0])!==JSON.stringify(snapshots[1]))errors.push(`${scheme}: legacy computed styles changed`);
 await page.close();
 }
 console.log(JSON.stringify({fixtures:fixtures.length,schemes:2,errors}));
 if(errors.length)process.exitCode=1;
} finally {await browser.close();}
