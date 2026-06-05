import { Partial } from 'fresh/runtime';
import ThemeToggle from '@app/islands/ThemeToggle.tsx';
import { appRoutes } from '@app/router.ts';
import { define } from '@app/utils.ts';

export default define.layout(function RootLayout({ Component, url }) {
  const homeHref = appRoutes.home.href();
  const examplesHref = appRoutes.examples.href();
  const healthHref = appRoutes.health.href();
  const navLinkClass = 'ns-btn ns-btn--ghost ns-btn--sm';
  const showScaffoldChrome = url.pathname === homeHref || url.pathname.startsWith(examplesHref);

  if (!showScaffoldChrome) {
    return (
      <Partial name='page'>
        <Component />
      </Partial>
    );
  }

  return (
    <Partial name='page'>
      <header class='ns-topbar'>
        <div class='flex items-center gap-4'>
          <a
            href={homeHref}
            f-client-nav={true}
            class='font-mono text-sm font-medium tracking-tight text-ns-fg no-underline'
          >
            playground
          </a>
          <span class='text-[0.68rem] font-mono uppercase tracking-[0.18em] text-ns-muted-fg'>
            dashboard
          </span>
        </div>
        <nav class='flex items-center gap-2'>
          <a
            href={homeHref}
            f-client-nav={true}
            class={navLinkClass}
            aria-current={url.pathname === homeHref ? 'page' : undefined}
          >
            Home
          </a>
          <a
            href={examplesHref}
            f-client-nav={true}
            class={navLinkClass}
            aria-current={url.pathname.startsWith(examplesHref) ? 'page' : undefined}
          >
            Examples
          </a>
          <a
            href={healthHref}
            f-client-nav={true}
            class={navLinkClass}
            aria-current={url.pathname === healthHref ? 'page' : undefined}
          >
            Health
          </a>
          <ThemeToggle />
        </nav>
      </header>
      <Component />
    </Partial>
  );
});
