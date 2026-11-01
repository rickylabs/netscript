import { chromium } from '../../../tools/fresh-ui-browser/node_modules/playwright-core/index.mjs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true});
const base = process.argv[2];
const results = [];
for (const width of [1440,390]) {
  for (const scheme of ['light','dark']) {
    
    const page = await browser.newPage({viewport:{width,height:900},colorScheme:scheme});
    page.on('pageerror',error=>{throw error;});
    for (const route of ['/','/records','/settings','/sign-in']) {
      const response=await page.goto(new URL(route,base).href,{waitUntil:'networkidle'});
      assert.equal(response.status(),200,route);
      assert.equal(await page.locator('h1').count(),1);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} overflow at ${width}`);
      if(route==='/') {
        const text=await page.locator('body').innerText();
        assert(!text.includes('User CRUD'));assert(!text.includes('maintainer scaffold'));
        assert(text.includes('Studio Utility'));assert(text.includes('netscript service add --name users --with-client'));
      }
      results.push({route,width,scheme,status:response.status()});
    }
    await page.goto(new URL('/settings',base).href,{waitUntil:'networkidle'});
    await page.locator('select#appearance').selectOption('dark');
    await page.getByRole('button',{name:'Save changes'}).click();
    await page.getByText('Appearance saved for this browser.').waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem('ns-theme')),'dark');
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('select#appearance').inputValue(),'dark');
    await page.keyboard.press('Control+k');
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({state:'hidden'});
    assert.equal(await page.getByRole('button',{name:'Search pages',exact:true}).evaluate(el=>el===document.activeElement),true);
    await page.close();
  }
}
console.log(JSON.stringify({outcome:'PASS',cases:results}));
await browser.close();
