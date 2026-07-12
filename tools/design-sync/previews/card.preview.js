// authored stories for "card"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    RunSummary: function () {
      return h(NS.Card, null, [
        h(NS.Card.Header, { key: 'h' }, [
          h('div', { key: 'hd', class: 'ns-cluster ns-cluster--between' }, [
            h(NS.Card.Title, { key: 't' }, 'order.fulfillment'),
            h(NS.Badge, { key: 'b', variant: 'success' }, 'completed'),
          ]),
          h(NS.Card.Description, { key: 'd' }, 'sagas · run 4f2a · trace tr_9c1d40'),
        ]),
        h(
          NS.Card.Body,
          { key: 'b', class: 'ns-stack ns-stack--sm' },
          h(
            'p',
            { class: 'ns-text-sm ns-muted-fg' },
            'Completed 6 of 6 steps in 142ms. No retries. Dead-letter queue empty.',
          ),
        ),
        h(NS.Card.Footer, { key: 'f' }, [
          h('div', { key: 'c', class: 'ns-cluster' }, [
            h(NS.Button, { key: 'v', variant: 'outline', size: 'sm' }, 'View trace'),
            h(NS.Button, { key: 'r', variant: 'ghost', size: 'sm', icon: '↻' }, 'Replay'),
          ]),
        ]),
      ]);
    },
    Interactive: function () {
      return h(NS.Card, { interactive: true }, [
        h(NS.Card.Header, { key: 'h' }, [
          h(NS.Card.Title, { key: 't' }, 'streams'),
          h(NS.Card.Description, { key: 'd' }, 'Event fan-out service'),
        ]),
        h(
          NS.Card.Body,
          { key: 'b' },
          h('p', { class: 'ns-text-sm ns-muted-fg' }, 'depth 1.2k · p95 96ms · 3 consumers'),
        ),
      ]);
    },
  };
})();
