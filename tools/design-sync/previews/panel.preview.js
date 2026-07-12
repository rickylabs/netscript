// authored stories for "panel"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    FilterRail: function () {
      return h(NS.Panel, null, [
        h(NS.Panel.Header, { key: 'h' }, [
          h(NS.Panel.Title, { key: 't' }, 'Filters'),
          h(NS.Panel.Description, { key: 'd' }, 'Narrow the run list'),
        ]),
        h(
          NS.Panel.Body,
          { key: 'b', class: 'ns-stack ns-stack--sm' },
          [
            h(NS.Checkbox, { key: 'f', name: 'failed', defaultChecked: true }, 'Failed only'),
            h(NS.Checkbox, { key: 'r', name: 'retrying' }, 'Retrying'),
            h(NS.Checkbox, { key: 'q', name: 'queued' }, 'Queued'),
          ],
        ),
        h(
          NS.Panel.Footer,
          { key: 'f' },
          h(NS.Button, { variant: 'outline', size: 'sm' }, 'Reset filters'),
        ),
      ]);
    },
    Tones: function () {
      return h('div', { class: 'ns-stack ns-stack--sm' }, [
        h(
          NS.Panel,
          { key: 'm', tone: 'muted' },
          h(
            NS.Panel.Body,
            null,
            h('p', { class: 'ns-text-sm ns-muted-fg' }, 'muted · dead-letter queue empty'),
          ),
        ),
        h(
          NS.Panel,
          { key: 'r', tone: 'raised' },
          h(
            NS.Panel.Body,
            null,
            h('p', { class: 'ns-text-sm ns-muted-fg' }, 'raised · 3 consumers attached'),
          ),
        ),
      ]);
    },
  };
})();
