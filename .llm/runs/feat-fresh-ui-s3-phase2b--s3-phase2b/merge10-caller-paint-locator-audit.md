# Generic selector audit for the caller-control correction

All listed generic data selectors were inspected against the18changed fixtures.
Button can add only root/label parts, button scope and rest/disabled state here;
no other candidate part name is added. Named component scopes/descendants retain
their ownership. The complete conservative scan includes untouched fixture routes.

- DocsPrimitive direct root selectors at50/140 would have matched four new
  sentinel roots. Those four controls now have ordinary unnamed div parents,
  preserving position/order/native behavior. Existing specs are unchanged.
- Fidelity88's syntax matrix has no converted controls inside it.
- Calendar82's closest root runs on untouched day cells inside Calendar.
- DesktopControls191 and Stats/Shell/DataTable candidates have no changed fixture
  descendants; their fixtures remain unchanged.
- Other listed part/scope/state values cannot match the converted Button's added
  markers, or their component owners do not contain a converted control.

Each generic reference below uses a repo-relative source path and line. This is
selector audit data, not leak-check output. No test locator/assertion is changed.

```text
tools/fresh-ui-browser/gap-tests/code-block.spec.ts:27:  await expect(source.getByRole('tabpanel').locator('[data-part="line"]')).toHaveCount(2);
tools/fresh-ui-browser/gap-tests/code-block.spec.ts:164:    const component = page.locator(`#${id} > [data-scope="code-block"]`);
tools/fresh-ui-browser/gap-tests/code-block.spec.ts:179:  const rows = panel.locator('[data-part="line"]');
tools/fresh-ui-browser/gap-tests/code-block.spec.ts:180:  expect(await rows.locator('> [data-part="code"]').allTextContents()).toEqual(
tools/fresh-ui-browser/gap-tests/code-block.spec.ts:187:  await expect(rows.locator('[data-part="line-number"]')).toHaveText(['1', '2', '3', '4']);
tools/fresh-ui-browser/gap-tests/code-block.spec.ts:207:  expect(await source.getByRole('tabpanel').locator('[data-part="code"]').allTextContents())
tools/fresh-ui-browser/gap-tests/code-block.spec.ts:221:  expect(await source.getByRole('tabpanel').locator('[data-part="code"]').allTextContents())
tools/fresh-ui-browser/gap-tests/code-block.spec.ts:229:  expect(await source.getByRole('tabpanel').locator('[data-part="code"]').allTextContents())
tools/fresh-ui-browser/gap-tests/code-block.spec.ts:237:    expect(await explicit.locator('[data-part="code"]').allTextContents()).toEqual([
tools/fresh-ui-browser/gap-tests/code-block.spec.ts:244:    await expect(unknown.locator('[data-part="code"]')).toHaveText('<div>Literal &amp; text</div>');
tools/fresh-ui-browser/gap-tests/code-block.spec.ts:247:    expect(await nested.locator('[data-part="code"]').allTextContents()).toEqual([
tools/fresh-ui-browser/gap-tests/code-block.spec.ts:255:    await expect(nested.locator('[data-part="line"]').nth(1).locator('.hljs-subst')).toHaveText(
tools/fresh-ui-browser/gap-tests/command-palette.spec.ts:30:  await expect(dialog.locator('[data-part="empty"]')).toHaveCount(0);
tools/fresh-ui-browser/gap-tests/command-palette.spec.ts:33:  await expect(dialog.locator('[data-part="empty"]')).toHaveText('No matching commands');
tools/fresh-ui-browser/gap-tests/command-palette.spec.ts:132:  await expect(inline.locator('[data-part="item-excerpt"] strong')).toHaveText('scaffold');
tools/fresh-ui-browser/gap-tests/command-palette.spec.ts:203:  await expect(inline.locator('[data-part="item-excerpt"] strong')).toHaveText('a.b(c)');
tools/fresh-ui-browser/gap-tests/ai.spec.ts:170:          '#attachment-variants .ns-attachment[data-state="' + state +
tools/fresh-ui-browser/gap-tests/ai.spec.ts:176:          await expect(item.locator('[data-part="state-label"]')).toHaveText(
tools/fresh-ui-browser/gap-tests/ai.spec.ts:180:          await expect(item.locator('[data-part="state-icon"]'))
tools/fresh-ui-browser/gap-tests/ai.spec.ts:183:        const description = item.locator('[data-part="description"]');
tools/fresh-ui-browser/gap-tests/ai.spec.ts:224:        '#attachment-variants [data-state="idle"][data-size="' + size +
tools/fresh-ui-browser/gap-tests/ai.spec.ts:225:          '"][data-orientation="horizontal"] > [data-part="media"]',
tools/fresh-ui-browser/gap-tests/ai.spec.ts:236:      '#attachment-variants [data-state="uploading"] .ns-attachment__state > span',
tools/fresh-ui-browser/gap-tests/desktop-controls.spec.ts:191:          const root = page.locator('#window-' + platform + '-' + state + ' [data-part="root"]');
tools/fresh-ui-browser/gap-tests/desktop-controls.spec.ts:227:            element.querySelector('[data-part="leading"]')!.getBoundingClientRect().width,
tools/fresh-ui-browser/gap-tests/stats-grid.spec.ts:28:    await expect(section.locator(`[data-part='${part}']`)).toHaveCSS('display', 'none');
tools/fresh-ui-browser/gap-tests/stats-grid.spec.ts:29:    await expect(section.locator(`[data-part='${part}']`)).toHaveAttribute('inert', '');
tools/fresh-ui-browser/gap-tests/stats-grid.spec.ts:155:    await expect(hero.locator(`[data-part='${part}']`)).toHaveCSS('color', resolved.foreground);
tools/fresh-ui-browser/gap-tests/stats-grid.spec.ts:158:    const indicator = page.locator(`#stats-3-false [data-delta='${delta}'] [data-part='delta']`)
tools/fresh-ui-browser/gap-tests/stats-grid.spec.ts:170:    await expect(card.locator(`[data-part='${part}']`)).toHaveCSS('display', 'block');
tools/fresh-ui-browser/gap-tests/stats-grid.spec.ts:171:    await expect(card.locator(`[data-part='${part}']`)).toHaveAttribute('aria-hidden', 'true');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:26:  await expect(figure.locator('[data-part="tooltip"]')).toContainText('March');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:30:  await expect(figure.locator('[data-part="axis-y"]')).toContainText('28,8');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:32:  await expect(page.locator('#series-chart-states [data-state="empty"]')).toContainText(
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:42:  const counter = carousel.locator('[data-part="counter"]');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:46:  await expect(carousel.locator('[data-part="viewport"]')).toBeFocused();
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:54:  await expect(carousel.locator('[data-part="slide"]').nth(0)).toHaveAttribute('inert');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:78:  const viewport = carousel.locator('[data-part="viewport"]');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:84:  await expect(carousel.locator('[data-part="counter"]')).toHaveText('2 / 3');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:89:      const active = element.querySelector('[data-part="slide"]:not([inert])');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:97:  await expect(vertical.locator('[data-part="counter"]')).toHaveText('2 / 3');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:99:    vertical.locator('[data-part="viewport"]').evaluate((element) => {
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:100:      const active = element.querySelector('[data-part="slide"]:not([inert])');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:109:  await expect(rtl.locator('[data-part="counter"]')).toHaveText('2 / 3');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:112:  await expect(empty.locator('[data-part="counter"]')).toHaveText('0 / 0');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:136:  const viewport = carousel.locator('[data-part="viewport"]');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:155:    await expect(carousel.locator('[data-part="counter"]')).not.toHaveText('1 / 3');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:156:    await expect(carousel.locator('[data-part="slide"]').first()).toHaveAttribute('inert');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:159:        const active = element.querySelector('[data-part="slide"]:not([inert])');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:166:    await expect(carousel.locator('[data-part="counter"]')).toHaveText('1 / 3');
tools/fresh-ui-browser/gap-tests/display-motion.spec.ts:168:    await expect(carousel.locator('[data-part="counter"]')).toHaveText('2 / 3');
tools/fresh-ui-browser/gap-tests/fidelity.spec.ts:73:  await expect(matrix.locator('[data-part="syntax"]')).toHaveCount(28);
tools/fresh-ui-browser/gap-tests/fidelity.spec.ts:75:  const measured = await measureSyntax(matrix, '[data-part="syntax"]');
tools/fresh-ui-browser/gap-tests/fidelity.spec.ts:88:  await matrix.locator('[data-part="root"]').screenshot({
tools/fresh-ui-browser/gap-tests/docs-structure.spec.ts:186:    await expect(chips.nth(i + 2).locator('[data-part="value"]')).toHaveText(
tools/fresh-ui-browser/gap-tests/docs-structure.spec.ts:217:        '[data-part="row"][data-type="' + type + '"][data-ownership="' + ownership + '"]',
tools/fresh-ui-browser/gap-tests/docs-structure.spec.ts:231:  for (const row of await tree.locator('[data-part="row"]').all()) await expect(row).toBeVisible();
tools/fresh-ui-browser/gap-tests/docs-structure.spec.ts:248:  for (const tag of await hidden.locator('[data-part="tag"]').all()) {
tools/fresh-ui-browser/gap-tests/docs-structure.spec.ts:287:      await expect(figure.locator('[data-part="media"]')).toHaveCSS('border-radius', '0px');
tools/fresh-ui-browser/gap-tests/page-header.spec.ts:55:  const intro = await header.locator('[data-part="intro"]').boundingBox();
tools/fresh-ui-browser/gap-tests/page-header.spec.ts:56:  const actions = await header.locator('[data-part="actions"]').boundingBox();
tools/fresh-ui-browser/gap-tests/page-header.spec.ts:60:  await expect(page.locator('#page-header-title-only [data-part="title"]')).toHaveText('Settings');
tools/fresh-ui-browser/gap-tests/page-header.spec.ts:61:  await expect(page.locator('#page-header-title-only [data-part="actions"]')).toHaveCount(0);
tools/fresh-ui-browser/gap-tests/page-header.spec.ts:62:  await expect(page.locator('#page-header-title-only [data-part="status-bar"]')).toHaveCount(0);
tools/fresh-ui-browser/gap-tests/ai-interaction.spec.ts:97:  const view = root.locator('[data-part="viewport"]');
tools/fresh-ui-browser/gap-tests/ai-interaction.spec.ts:98:  const other = page.locator('#secondary-scroller [data-part="viewport"]');
tools/fresh-ui-browser/gap-tests/calendar.spec.ts:35:  await expect(root.locator('[data-part="day"][tabindex="0"]')).toHaveCount(1);
tools/fresh-ui-browser/gap-tests/calendar.spec.ts:82:    const endpoint = middle.closest('[data-part="root"]')!
tools/fresh-ui-browser/gap-tests/calendar.spec.ts:106:  await expect(dialog.locator('[data-part="day"][tabindex="0"]')).toBeFocused();
tools/fresh-ui-browser/gap-tests/native-close.spec.ts:20:  await expect(shell.locator('[data-scope="sidebar-toggle"]')).toHaveAttribute(
tools/fresh-ui-browser/gap-tests/native-close.spec.ts:32:  await expect(shell.locator('[data-scope="sidebar-toggle"]')).toHaveAttribute(
tools/fresh-ui-browser/gap-tests/resizable.spec.ts:90:  await expect(plain.locator('[data-part="grip"]')).toHaveCount(0);
tools/fresh-ui-browser/gap-tests/resizable.spec.ts:227:  const grip = page.locator('#resize-horizontal [data-part="grip"] svg');
tools/fresh-ui-browser/gap-tests/alert.spec.ts:61:    await expect(banner.locator('[data-part="title"]')).toHaveText(
tools/fresh-ui-browser/gap-tests/alert.spec.ts:101:  const localized = page.locator('#alert-localized [data-part="title"]');
tools/fresh-ui-browser/gap-tests/alert.spec.ts:107:    has: page.locator('[data-part="title"]', { hasText: 'Important' }),
tools/fresh-ui-browser/gap-tests/shell.spec.ts:62:      await expect(shell.locator('[data-scope="sidebar-toggle"]')).toBeHidden();
tools/fresh-ui-browser/gap-tests/shell.spec.ts:67:    const toggle = shell.locator('[data-scope="sidebar-toggle"]');
tools/fresh-ui-browser/gap-tests/shell.spec.ts:122:  const toggle = shell.locator('[data-scope="sidebar-toggle"]');
tools/fresh-ui-browser/gap-tests/shell.spec.ts:167:        centers: Array.from(element.querySelectorAll('[data-part="nav-item"]')).flatMap((item) => {
tools/fresh-ui-browser/gap-tests/shell.spec.ts:168:          const icon = item.querySelector('[data-part="nav-icon"]');
tools/fresh-ui-browser/gap-tests/shell.spec.ts:186:    await expect(shell.locator('[data-scope="sidebar-toggle"]')).toBeHidden();
tools/fresh-ui-browser/gap-tests/shell.spec.ts:227:  const ownedToggle = page.locator('#shell-example [data-scope="sidebar-toggle"]');
tools/fresh-ui-browser/gap-tests/shell.spec.ts:252:  const firstToggle = first.locator('[data-scope="sidebar-toggle"]');
tools/fresh-ui-browser/gap-tests/shell.spec.ts:253:  const secondToggle = second.locator('[data-scope="sidebar-toggle"]');
tools/fresh-ui-browser/gap-tests/shell.spec.ts:300:  const toggle = shell.locator('[data-scope="sidebar-toggle"]');
tools/fresh-ui-browser/gap-tests/shell.spec.ts:346:  await shell.locator('[data-scope="sidebar-toggle"]').click();
tools/fresh-ui-browser/gap-tests/docs-composition.spec.ts:69:          ':scope > [data-part="grid"]',
tools/fresh-ui-browser/gap-tests/docs-composition.spec.ts:121:        ':scope > [data-part="layout"]',
tools/fresh-ui-browser/gap-tests/docs-composition.spec.ts:128:      const display = element.querySelector('[data-part="display"]')!
tools/fresh-ui-browser/gap-tests/docs-composition.spec.ts:130:      const aside = element.querySelector('[data-part="aside"]')!
tools/fresh-ui-browser/gap-tests/docs-composition.spec.ts:220:  await expect(hero.locator('[data-scope="hero"][tabindex]')).toHaveCount(0);
tools/fresh-ui-browser/gap-tests/docs-composition.spec.ts:275:        const inner = hero.locator(':scope > [data-part="layout"]');
tools/fresh-ui-browser/gap-tests/docs-composition.spec.ts:287:    await expect(page.locator('#hero-minimal [data-part="aside"]')).toHaveCount(
tools/fresh-ui-browser/gap-tests/docs-composition.spec.ts:292:        '#hero-paths-only [data-part="aside"] [data-part="path-stack"]',
tools/fresh-ui-browser/gap-tests/docs-composition.spec.ts:365:        const card = root.locator('[data-part="card"]').first();
tools/fresh-ui-browser/gap-tests/docs-composition.spec.ts:396:  await expect(page.locator('#contained-grid [data-part="title"]')).toHaveCSS(
tools/fresh-ui-browser/gap-tests/docs-composition.spec.ts:400:  await expect(page.locator('#contained-desktop-hero [data-part="title"]'))
tools/fresh-ui-browser/gap-tests/docs-composition.spec.ts:404:      '#hero-containment > [data-part="layout"] > [data-part="display"] > [data-part="title"]',
tools/fresh-ui-browser/gap-tests/docs-primitives.spec.ts:50:  const card = page.locator('#docs-card > [data-part="root"]');
tools/fresh-ui-browser/gap-tests/docs-primitives.spec.ts:116:  const previous = pager.locator('[data-part="previous"]');
tools/fresh-ui-browser/gap-tests/docs-primitives.spec.ts:117:  const next = pager.locator('[data-part="next"]');
tools/fresh-ui-browser/gap-tests/docs-primitives.spec.ts:122:  await expect(previous.locator('[data-part="icon"]')).toHaveCSS(
tools/fresh-ui-browser/gap-tests/docs-primitives.spec.ts:140:      id === 'docs-labels' ? '#docs-label-display' : `#${id} > [data-part="root"]`,
tools/fresh-ui-browser/gap-tests/forms.spec.ts:71:  await expect(page.locator('#otp-form [data-part="slot"]')).toHaveText([
tools/fresh-ui-browser/gap-tests/data-table.spec.ts:189:  const cell = page.locator('#table-keyboard .ns-data-grid__body [data-part="cell"]').first();
tools/fresh-ui-browser/gap-tests/data-table.spec.ts:213:  await row.locator('[data-part="cell"]').first().click();
tools/fresh-ui-browser/gap-tests/data-table.spec.ts:225:      '#table-keyboard .ns-data-grid__body [data-type="link"] [data-part="cell"]',
tools/fresh-ui-browser/gap-tests/data-table.spec.ts:461:  const cells = await row.locator('td[data-part="cell"]').evaluateAll((elements) =>
tools/fresh-ui-browser/gap-tests/data-table.spec.ts:476:  const cell = page.locator('#table-keyboard tbody td[data-part="cell"]').first();
tools/fresh-ui-browser/gap-tests/data-table.spec.ts:517:  const body = page.locator('#table-keyboard tbody tr[data-type="link"] td[data-part="cell"]')
tools/fresh-ui-browser/gap-tests/data-table.spec.ts:546:  await section.locator('tbody tr[data-type="link"] td[data-part="cell"]').first().click({
tools/fresh-ui-browser/gap-tests/data-table.spec.ts:549:  await section.locator('tbody tr[data-type="button"] td[data-part="cell"]').first().click({
tools/fresh-ui-browser/gap-tests/data-table.spec.ts:961:    const cells = await fixture.locator('tbody tr').first().locator("td[data-part='cell']")
tools/fresh-ui-browser/gap-tests/docs-navigation.spec.ts:74:  await expect(nav.locator('[data-part="current"]')).toHaveText('Details');
tools/fresh-ui-browser/gap-tests/docs-navigation.spec.ts:85:  await expect(nav.locator('[data-part="marker"]')).toHaveCount(0);
tools/fresh-ui-browser/gap-tests/docs-navigation.spec.ts:86:  await expect(nav.locator('[data-part="current"]')).toHaveText('Controlled outline');
tools/fresh-ui-browser/gap-tests/docs-navigation.spec.ts:330:      await expect(desktop.locator('[data-part="marker"]')).toHaveCount(0);
tools/fresh-ui-browser/gap-tests/docs-navigation.spec.ts:390:      await expect(responsive.locator('[data-part="item"]').first()).toHaveCSS('font-size', '13px');
tools/fresh-ui-browser/gap-tests/docs-navigation.spec.ts:391:      await expect(responsive.locator('[data-part="item"]').first()).toHaveCSS(
tools/fresh-ui-browser/gap-tests/docs-navigation.spec.ts:415:    narrow ? '[data-part="mobile-rail"] .ns-toc' : '[data-part="rail"] .ns-toc',
```
