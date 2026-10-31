import { chromium } from '../../../tools/fresh-ui-browser/node_modules/playwright-core/index.mjs';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

// Capture the real shipped fixture markup. Output stays outside Git.
const [input, variantInput, output, ...families] = process.argv.slice(2);
const root = resolve('packages/fresh-ui');
const all = [...JSON.parse(await readFile(input, 'utf8')), ...JSON.parse(await readFile(variantInput, 'utf8'))];
const selected = all.filter(x => families.includes(x.component ?? x.name.split('/')[0]));
if (!selected.length) throw new Error('No fixtures selected');
await mkdir(output, { recursive: true });
const paths = [join(root, 'registry/styles/layouts.css')];
for (const dir of ['registry/components/ui', 'registry/islands']) {
 for (const name of (await readdir(join(root, dir))).sort()) if (name.endsWith('.css')) paths.push(join(root, dir, name));
}
const css = (await Promise.all(paths.map(p => readFile(p, 'utf8')))).join('\n').replace(/@import\s+[^;]+;/g, '');
const tokens = await readFile(join(root, 'registry/theme/presets/studio-utility.css'), 'utf8');
const fonts = JSON.parse(await readFile(join(root,'registry/theme/fonts.json'),'utf8')).imports['studio-utility'];
const preflight = process.env.UTILITY_PREFLIGHT ? await readFile(process.env.UTILITY_PREFLIGHT,'utf8') : '';
const browser = await chromium.launch({ headless: true });
const results = [];
const errors = [];
const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
try {
 for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
  await page.setContent(`<!doctype html><html data-theme="studio" data-flavor="utility" data-scheme="${scheme}" data-density="compact"><head>${fonts.map(x=>`<link rel="stylesheet" href="${escape(x)}">`).join('')}<style>${preflight}\n${tokens}\n${css}\nhtml{font-family:var(--ns-font-sans);color:var(--ns-fg);background:var(--ns-bg)}body{margin:0;padding:var(--ns-space-6)}*{box-sizing:border-box}h2{font-size:var(--ns-text-heading)}.specimen{padding:var(--ns-space-4);margin-block:var(--ns-space-3);min-width:0;border:var(--ns-border-width) solid var(--ns-border)}.specimen-label{font:var(--ns-text-caption) var(--ns-font-mono);margin-block-end:var(--ns-space-3)}.specimen .ns-toast-wrapper{position:static;width:100%;animation:none}.specimen [data-scope=toast][data-part=progress-bar]{animation:none!important}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--ns-space-4)}</style></head><body><h1>Utility ${scheme}</h1><div class="grid">${selected.map((x,i)=>`<section class="specimen" id="case-${i}"><div class="specimen-label">${escape(x.name)}</div><div class="content">${x.html}</div></section>`).join('')}</div></body></html>`);
  await page.evaluate(()=>{
   document.addEventListener('click',event=>{if(event.target.closest('a,button'))event.preventDefault();},true);
   document.addEventListener('submit',event=>event.preventDefault(),true);
   return document.fonts.ready;
  });
  for (let i=0;i<selected.length;i++) {
   const row = selected[i];
   const container = page.locator(`#case-${i}`);
   const control = container.locator('button,a[href],input,select,textarea,[tabindex="0"]').first();
   const measure = async state => {
    await container.evaluate(el=>Promise.all(el.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getTiming().iterations)).map(a=>a.finished.catch(()=>{}))));
    const values = await container.evaluate(el => [...el.querySelectorAll('[data-part],input')].map(node=>{
     const s=getComputedStyle(node);
     const probe=document.createElement('span');probe.style.color='var(--ns-destructive)';node.parentElement.append(probe);const errorColor=getComputedStyle(probe).color;probe.style.color='var(--ns-ring)';const ringColor=getComputedStyle(probe).color;
     const scope=node.dataset.scope,part=node.dataset.part,root=node.closest(`[data-scope='${scope}'][data-part='root']`);
     let tone=root?.dataset.variant??root?.dataset.type;if(tone==='error')tone='destructive';
     const status=['info','success','warning','destructive'].includes(tone);
     const role=(['badge','alert','inline-notice','toast'].includes(scope)&&status)?tone:undefined;
     probe.style.color=role?`var(--ns-${role}-text)`:'var(--ns-fg)';const toneText=getComputedStyle(probe).color;
     probe.style.color=role?`var(--ns-${role}-subtle)`:'var(--ns-card)';const toneFill=getComputedStyle(probe).color;
     probe.style.color=role?`var(--ns-${role}-border)`:'var(--ns-border)';const toneBorder=getComputedStyle(probe).color;
     probe.remove();
     return {scope:node.dataset.scope,part:node.dataset.part,tag:node.tagName,state:node.dataset.state,size:node.dataset.size,variant:node.dataset.variant,toneText,toneFill,toneBorder,status,errorColor,ringColor,invalid:node.closest('[data-invalid=true]')?'true':undefined,focused:node.matches(':focus-visible'),disabled:node.matches(':disabled'),radius:s.borderRadius,sideBorder:s.borderInlineStartWidth,bottomBorder:s.borderBottomWidth,shadow:s.boxShadow,transform:s.transform,height:s.height,color:s.color,background:s.backgroundColor,border:s.borderColor,outline:s.outlineColor,outlineStyle:s.outlineStyle,outlineWidth:s.outlineWidth,opacity:s.opacity,font:s.fontFamily,fontSize:s.fontSize,transition:s.transitionDuration,animation:s.animationName};
    }));
    results.push({name:row.name,scheme,state,values});
    await container.screenshot({path:join(output,`state-${i}-${scheme}-${state}.png`),animations:'disabled'});
    for (const v of values) {
     if(v.status&&['alert','inline-notice','toast','badge'].includes(v.scope)) {
      if(v.part==='root'&&(v.background!==v.toneFill||v.border!==v.toneBorder))errors.push(`${row.name}/${scheme}: status surface`);
      if(['title','icon','symbol'].includes(v.part)&&v.color!==v.toneText)errors.push(`${row.name}/${scheme}: status text`);
     }
     if(['card','panel','alert','inline-notice','toast','empty-state'].includes(v.scope)&&v.part==='root'&&(v.radius!=='0px'||v.shadow!=='none'))errors.push(`${row.name}/${scheme}: surface geometry`);
     if(v.scope==='card'&&v.part==='root'&&(v.sideBorder!=='0px'||v.bottomBorder!=='0px'))errors.push(`${row.name}/${scheme}: card must have only top rule`);
     if(v.scope==='avatar'&&v.part==='root'&&v.radius!=='0px')errors.push(`${row.name}/${scheme}: avatar radius`);
     if(v.invalid==='true'&&!v.disabled&&(['input','select','textarea'].includes(v.scope)&&v.part==='root'||['checkbox','switch'].includes(v.scope)&&['indicator','track'].includes(v.part))&&v.border!==v.errorColor)errors.push(`${row.name}/${scheme}/${state}: invalid border lost`);
     if(v.focused&&['button','icon-button','input','select','textarea','search'].includes(v.scope)&&(v.outlineStyle!=='solid'||v.outlineWidth!=='2px'||v.outline!==v.ringColor))errors.push(`${row.name}/${scheme}: focus-visible outline absent`);
     if(['button','icon-button'].includes(v.scope)&&v.part==='root'&&v.height!==({sm:'28px',md:'32px',lg:'40px',icon:'32px'}[v.size]??'32px'))errors.push(`${row.name}/${scheme}/${state}: control height`);
     if(['button','icon-button','checkbox','switch'].includes(v.scope)&&v.part==='root'&&v.state==='disabled'&&v.opacity!=='0.38')errors.push(`${row.name}/${scheme}: disabled opacity`);
     if(['button','icon-button'].includes(v.scope) && v.part==='root' && (v.shadow!=='none'||v.transform!=='none'||v.radius!=='0px')) errors.push(`${row.name}/${scheme}/${state}: Utility button geometry`);
     if(['input','select','textarea'].includes(v.scope)&&v.part==='root'&&v.radius!=='0px')errors.push(`${row.name}/${scheme}: input radius`);
    }
   };
   await measure('rest');
   if (await control.count() && await control.isVisible() && await control.isEnabled()) {
    const target = ['checkbox','switch'].includes(await control.getAttribute('data-scope')) ? container.locator('[data-part=label]').first() : control;
    await target.hover({force:true}); await measure('hover');
    const rest=results.at(-2)?.values.find(v=>v.part==='root');const hover=results.at(-1)?.values.find(v=>v.part==='root');
    if(['button','icon-button'].includes(rest?.scope)&&rest.background===hover.background)errors.push(`${row.name}/${scheme}: hover paint unchanged`);
    await page.keyboard.press('Tab'); await control.focus(); await measure('focus-visible');
    await page.mouse.down(); await measure('active'); await page.mouse.up();
    await control.evaluate(el=>{el.blur();if(el.type==='checkbox')el.checked=el.defaultChecked;});
   }
  }
  for (const component of families) {
   const indexes=selected.flatMap((x,i)=>(x.component??x.name.split('/')[0])===component?[i]:[]);
   if(!indexes.length) { errors.push(`Missing component ${component}`); continue; }
   await page.locator('.specimen').evaluateAll((els,keep)=>els.forEach((el,i)=>el.hidden=!keep.includes(i)),indexes);
   await page.screenshot({path:join(output,`${component}-${scheme}.png`),fullPage:true});
  }
  await page.locator('.specimen').evaluateAll(els=>els.forEach(el=>el.hidden=false));
  await page.evaluate(()=>document.documentElement.dir='rtl');
  await page.emulateMedia({reducedMotion:'reduce'});
  for(let i=0;i<selected.length;i++) {
   const control=page.locator(`#case-${i} input[type=checkbox]`).first();
   if(await control.count()&&await control.isEnabled())await control.evaluate(el=>{el.checked=true;});
  }
  const rtl = await page.locator('[data-scope=switch][data-part=thumb]').evaluateAll(els=>els.map(el=>({transform:getComputedStyle(el).transform,transition:getComputedStyle(el).transitionDuration})));
  for(const v of rtl) if(v.transform !== 'none' && Number(v.transform.split(',')[4]) > 0 || v.transition !== '0s') errors.push(`RTL/reduced switch: ${JSON.stringify(v)}`);
  const reduced=await page.locator('[data-scope=progress] [data-part=bar],[data-scope=skeleton]').evaluateAll(els=>els.map(el=>({scope:el.dataset.scope,animation:getComputedStyle(el).animationName,transition:getComputedStyle(el).transitionDuration})));
  for(const v of reduced)if(v.animation!=='none'||v.transition!=='0s')errors.push(`${scheme}: reduced motion ${v.scope}`);
  results.push({scheme,state:'rtl-reduced',values:[...rtl,...reduced]});
  await page.screenshot({path:join(output,`rtl-reduced-${scheme}.png`),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.addStyleTag({content:'.grid{grid-template-columns:1fr}'});
  await page.screenshot({path:join(output,`mobile-${scheme}.png`),fullPage:true});
  await page.close();
 }
 if(families.includes('toast')) {
  const specimen=selected.find(x=>(x.component??x.name.split('/')[0])==='toast');
  for(const scheme of ['light','dark'])for(const dir of ['ltr','rtl'])for(const width of [390,1280]) {
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   await page.setContent(`<html dir='${dir}' data-theme='studio' data-flavor='utility' data-scheme='${scheme}'><style>${preflight}\n${tokens}\n${css}</style><body>${specimen.html}</body></html>`);
   await page.screenshot({path:join(output,`toast-runtime-${scheme}-${dir}-${width}.png`),animations:'disabled'});
   const b=await page.locator('.ns-toast-wrapper').boundingBox();
   if(!b||Math.abs(b.y+b.height-884)>1||Math.abs((dir==='rtl'?b.x:width-b.x-b.width)-16)>1)errors.push(`toast runtime placement: ${scheme}/${dir}/${width}`);
   results.push({scheme,state:`toast-runtime-${dir}-${width}`,values:[b]});await page.close();
  }
 }
 await writeFile(join(output,'measurements.json'),JSON.stringify({browser:browser.version(),fixtures:selected.length,measurements:results.length,errors,results},null,2));
 console.log(JSON.stringify({fixtures:selected.length,measurements:results.length,errors}));
 if(errors.length)process.exitCode=1;
} finally {await browser.close();}
