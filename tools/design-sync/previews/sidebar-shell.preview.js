// authored stories for "sidebar-shell"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  var navigation = [
    {
      label: 'Overview',
      items: [
        { href: '/', label: 'Dashboard', icon: '◱' },
        { href: '/runs', label: 'Runs', icon: '▤', matchPrefix: true },
      ],
    },
    {
      label: 'Services',
      items: [
        { href: '/services/api', label: 'api', icon: '◈' },
        { href: '/services/workers', label: 'workers', icon: '⚙' },
        { href: '/services/sagas', label: 'sagas', icon: '⤿' },
        { href: '/services/triggers', label: 'triggers', icon: '⚡' },
        { href: '/services/streams', label: 'streams', icon: '≋' },
      ],
    },
  ];
  window.__dsPreview = {
    Dashboard: function () {
      return h(
        NS.SidebarShell,
        {
          pathname: '/services/workers',
          navigation: navigation,
          brand: 'NetScript',
          brandBadge: 'Dev',
          footer: h('span', { class: 'ns-text-2xs ns-muted-fg' }, 'v0.0.1-beta.5'),
          topbarStart: h(NS.Breadcrumb, {
            items: [
              { label: 'Services', href: '/services' },
              { label: 'workers' },
            ],
          }),
          topbarEnd: h(NS.Avatar, { name: 'Ada Reeves', size: 'sm', presence: 'online' }),
        },
        h('div', { class: 'ns-stack' }, [
          h(NS.SectionDivider, { key: 'd', label: 'Queue health' }),
          h(
            'p',
            { key: 'p', class: 'ns-text-sm ns-muted-fg' },
            'workers · depth 812 · 24 inflight · p95 168ms',
          ),
        ]),
      );
    },
  };
})();
