// authored stories for "section-divider"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.SectionDivider, { label: 'Queue health' });
    },
    InContext: function () {
      return h('div', { class: 'ns-stack' }, [
        h(NS.SectionDivider, { key: 'a', label: 'Configuration' }),
        h(
          'p',
          { key: 'p1', class: 'ns-text-sm ns-muted-fg' },
          'Concurrency, retries, and dead-letter routing.',
        ),
        h(NS.SectionDivider, { key: 'b', label: 'Danger zone' }),
        h(
          'p',
          { key: 'p2', class: 'ns-text-sm ns-muted-fg' },
          'Drain queue and deregister the trigger.',
        ),
      ]);
    },
  };
})();
