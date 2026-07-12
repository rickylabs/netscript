// authored stories for "sidebar-toggle"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  var nav = [
    { key: 'd', label: '◱  Dashboard' },
    { key: 'r', label: '▤  Runs' },
    { key: 's', label: '◈  Services' },
    { key: 't', label: '⚡  Triggers' },
  ];
  function navPanel() {
    // data-sidebar is the toggle's default target — clicking flips its is-open
    // state on this panel, so the story shows the control wired to real content.
    return h(NS.Panel, { tone: 'muted', 'data-sidebar': true }, [
      h(NS.Panel.Header, { key: 'h' }, h(NS.Panel.Title, null, 'Navigation')),
      h(
        NS.Panel.Body,
        { key: 'b', class: 'ns-stack ns-stack--xs' },
        nav.map(function (item) {
          return h('span', { key: item.key, class: 'ns-text-sm ns-muted-fg' }, item.label);
        }),
      ),
    ]);
  }
  window.__dsPreview = {
    MobileTopbar: function () {
      return h('div', { class: 'ns-stack ns-stack--sm' }, [
        h('div', { key: 'bar', class: 'ns-cluster ns-cluster--between' }, [
          h('div', { key: 'l', class: 'ns-cluster' }, [
            h(NS.SidebarToggle, {
              key: 't',
              openLabel: 'Open navigation',
              closeLabel: 'Close navigation',
              openIcon: '☰',
              closeIcon: '✕',
            }),
            h('strong', { key: 'b', class: 'ns-text-sm' }, 'NetScript'),
          ]),
          h(NS.Badge, { key: 'env', variant: 'muted' }, 'Dev'),
        ]),
        navPanel(),
      ]);
    },
    Standalone: function () {
      return h('div', { class: 'ns-cluster' }, [
        h(NS.SidebarToggle, {
          key: 't',
          openLabel: 'Open navigation',
          closeLabel: 'Close navigation',
          openIcon: '☰',
          closeIcon: '✕',
        }),
        h('span', { key: 'l', class: 'ns-text-sm ns-muted-fg' }, 'Toggle sidebar'),
      ]);
    },
  };
})();
