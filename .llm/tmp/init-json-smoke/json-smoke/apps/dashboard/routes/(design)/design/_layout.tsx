import { Badge, Breadcrumb, SidebarShell } from '@app/components/ui/mod.ts';
import SidebarToggle from '@app/islands/ui/SidebarToggle.tsx';
import ThemeToggle from '@app/islands/ui/ThemeToggle.tsx';
import { appRoutes } from '@app/router.ts';
import { define } from '@app/utils.ts';

const DESIGN_NAVIGATION = [
  {
    label: 'Reference',
    items: [
      { href: appRoutes.designTokens.href(), label: 'Tokens', icon: '◧', matchPrefix: true },
      {
        href: appRoutes.designComponents.href(),
        label: 'Components',
        icon: '▣',
        matchPrefix: true,
      },
      {
        href: appRoutes.designComposition.href(),
        label: 'Composition',
        icon: '◰',
        matchPrefix: true,
      },
    ],
  },
  {
    label: 'App',
    items: [
      { href: appRoutes.home.href(), label: 'Home', icon: '◫', matchPrefix: false },
    ],
  },
] as const;

function buildDesignBreadcrumbs(pathname: string) {
  const crumbs = [{ label: 'Design', href: '/design' }];
  const section = pathname.replace(/^\/design\/?/, '').split('/')[0];
  if (section) {
    crumbs.push({
      label: section.charAt(0).toUpperCase() + section.slice(1),
      href: `/design/${section}`,
    });
  }
  return crumbs.map((item, index) => index === crumbs.length - 1 ? { label: item.label } : item);
}

export default define.layout(function DesignLayout({ Component, url }) {
  return (
    <SidebarShell
      pathname={url.pathname}
      navigation={DESIGN_NAVIGATION}
      brand={
        <a href='/' class='ns-topbar-brand'>
          json-smoke
        </a>
      }
      brandBadge={<Badge variant='secondary'>design system</Badge>}
      topbarStart={
        <>
          <SidebarToggle />
          <Breadcrumb items={buildDesignBreadcrumbs(url.pathname)} />
        </>
      }
      topbarEnd={<ThemeToggle />}
      footer={
        <div class='ns-dashboard__sidebar-env'>
          <span class='ns-dot-active' />
          <span class='ns-dashboard__sidebar-env-label'>NS One theme</span>
        </div>
      }
    >
      <Component />
    </SidebarShell>
  );
});
