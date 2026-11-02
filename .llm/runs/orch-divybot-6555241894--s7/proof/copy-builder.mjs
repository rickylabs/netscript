import { chromium } from '../../../../tools/fresh-ui-browser/node_modules/playwright/index.mjs';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ headless: true });
try {
 const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
 await page.goto('http://127.0.0.1:4186/netscript/create/');
 await page.waitForSelector('html[data-builder-ready="true"]');
 await page.locator('[data-preset-choice]').selectOption('studio-cloud');
 await page.frameLocator('[data-component-preview]').locator('html[data-preview-ready="workspace"][data-flavor="cloud"]').waitFor();
 const code = await page.locator('[data-preset-code]').inputValue();
 const init = await page.locator('[data-preset-command="init"]').textContent();
 const frame = page.frames().find(f=>f.url().includes('/assets/fresh-ui/preview/'));
 const tokens = await frame.locator('html').evaluate(root=>{
  const style=getComputedStyle(root);
  return Object.fromEntries([...style].filter(k=>k.startsWith('--ns-')).map(k=>[k,style.getPropertyValue(k).trim()]));
 });
 await writeFile('.llm/tmp/s7-proof-6555241894/builder.json',JSON.stringify({code,init,tokens},null,2));
 await page.screenshot({path:'.llm/tmp/s7-proof-6555241894/builder.png',fullPage:true});
 console.log(JSON.stringify({copied:code,command:init,tokenCount:Object.keys(tokens).length}));
} finally {await browser.close();}
