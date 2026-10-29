import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

for (const kind of ["backend", "frontend"]) {
  test(
    `comparison ${kind}: native selection, fragments and keyboard`,
    async ({ page }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`comparisons/${kind}/`);
      const picker = page.locator("[data-ns-scenarios-select]");
      const panels = page.locator("[data-ns-scenario]");
      await expect(picker).toBeVisible();
      await expect(picker).toHaveAccessibleName(
        kind === "backend" ? "Backend scenario" : "Web scenario",
      );
      await expect(panels).toHaveCount(3);
      await expect(panels.nth(0)).toBeVisible();
      await expect(panels.nth(1)).toBeHidden();
      const lastKey = await panels.nth(2).getAttribute("data-ns-scenario");
      await picker.selectOption(lastKey!);
      await expect(panels.nth(2)).toBeVisible();
      await expect(panels.nth(0)).toBeHidden();
      const lastId = await panels.nth(2).getAttribute("id");
      await expect(picker).toHaveAttribute("aria-controls", lastId!);
      expect(new URL(page.url()).hash).toBe(`#${lastId}`);
      await page.reload();
      await expect(panels.nth(2)).toBeVisible();
      await picker.focus();
      await page.keyboard.press("Home");
      await page.keyboard.press("Enter");
      await expect(panels.nth(0)).toBeVisible();
      const headingId = await panels.nth(1).locator("h3").getAttribute("id");
      expect(headingId).toBeTruthy();
      await page.evaluate((id) => {
        location.hash = id!;
      }, headingId);
      await expect(panels.nth(1)).toBeVisible();
      // The select must not erase browser history while following a section link.
      expect(new URL(page.url()).hash).toBe(`#${headingId}`);
      const report = await new AxeBuilder({ page }).analyze();
      expect(
        report.violations.filter((v) =>
          ["serious", "critical"].includes(v.impact ?? "")
        ),
      )
        .toEqual([]);
      await page.screenshot({
        path: info.outputPath(`comparison-${kind}.png`),
        fullPage: true,
      });
      expect(errors).toEqual([]);
      expect(
        await page.evaluate(() =>
          document.documentElement.scrollWidth <= innerWidth
        ),
      ).toBe(
        true,
      );
    },
  );

  test(`comparison ${kind}: every scenario without JavaScript and in Markdown`, async ({ browser, baseURL, viewport, colorScheme }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      baseURL,
      viewport,
      colorScheme,
    });
    try {
      const page = await context.newPage();
      await page.goto(`comparisons/${kind}/`);
      await expect(page.locator("[data-ns-scenarios-select]")).toBeHidden();
      const panels = page.locator("[data-ns-scenario]");
      await expect(panels).toHaveCount(3);
      const response = await context.request.get(
        `comparisons/${kind}/index.md`,
      );
      expect(response.status()).toBe(200);
      const markdown = await response.text();
      for (const panel of await panels.all()) {
        await expect(panel).toBeVisible();
        await expect(panel.locator("pre").first()).toBeVisible();
        expect(markdown).toContain(await panel.locator("h3").innerText());
        expect(markdown).toContain(
          await panel.locator(".ns-scenarios__problem").innerText(),
        );
        expect(markdown).toContain("Why it matters:");
      }
    } finally {
      await context.close();
    }
  });
}
