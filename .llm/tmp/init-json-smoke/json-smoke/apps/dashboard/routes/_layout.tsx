import { Partial } from 'fresh/runtime';
import ThemeToggle from '@app/islands/ui/ThemeToggle.tsx';
import { Badge, Button } from '@app/components/ui/mod.ts';
import { appRoutes } from '@app/router.ts';
import { define } from '@app/utils.ts';

export default define.layout(function RootLayout({ Component, url }) {
  const homeHref = appRoutes.home.href();
  const dashboardHref = appRoutes.dashboard.href();
  const examplesHref = appRoutes.examples.href();
  const healthHref = appRoutes.health.href();
  const designHref = '/design/components';
  const showScaffoldChrome = url.pathname === homeHref || url.pathname === dashboardHref ||
    url.pathname.startsWith(examplesHref);

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
        <div class='ns-cluster ns-cluster--sm'>
          <a href={homeHref} f-client-nav={true} class='ns-topbar__brand'>
            json-smoke
          </a>
          <Badge variant='muted'>dashboard</Badge>
        </div>
        <nav class='ns-cluster ns-cluster--sm'>
          <Button
            type='link'
            href={homeHref}
            variant='ghost'
            size='sm'
            aria-current={url.pathname === homeHref ? 'page' : undefined}
          >
            Home
          </Button>
          <Button
            type='link'
            href={dashboardHref}
            variant='ghost'
            size='sm'
            aria-current={url.pathname === dashboardHref ? 'page' : undefined}
          >
            Dashboard
          </Button>
          <Button
            type='link'
            href={examplesHref}
            variant='ghost'
            size='sm'
            aria-current={url.pathname.startsWith(examplesHref) ? 'page' : undefined}
          >
            Examples
          </Button>
          <Button
            type='link'
            href={healthHref}
            variant='ghost'
            size='sm'
            aria-current={url.pathname === healthHref ? 'page' : undefined}
          >
            Health
          </Button>
          <Button type='link' href={designHref} variant='ghost' size='sm'>
            Design
          </Button>
          <ThemeToggle />
        </nav>
      </header>
      <Component />
    </Partial>
  );
});
