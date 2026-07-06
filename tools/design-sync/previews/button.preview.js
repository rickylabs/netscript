// authored stories for "button"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Variants: function () {
      return h('div', { class: 'ns-cluster' }, [
        h(NS.Button, { key: 'p', variant: 'primary' }, 'Deploy workers'),
        h(NS.Button, { key: 's', variant: 'secondary' }, 'View runs'),
        h(NS.Button, { key: 'o', variant: 'outline' }, 'Configure'),
        h(NS.Button, { key: 'g', variant: 'ghost' }, 'Cancel'),
        h(NS.Button, { key: 'd', variant: 'destructive' }, 'Drain queue'),
      ]);
    },
    WithIcon: function () {
      return h('div', { class: 'ns-cluster' }, [
        h(NS.Button, { key: 'r', variant: 'primary', icon: '↻' }, 'Replay failed run'),
        h(
          NS.Button,
          { key: 'n', variant: 'outline', icon: '→', iconPosition: 'right' },
          'Next page',
        ),
      ]);
    },
    Sizes: function () {
      return h('div', { class: 'ns-cluster' }, [
        h(NS.Button, { key: 'sm', size: 'sm', variant: 'secondary' }, 'Small'),
        h(NS.Button, { key: 'md', size: 'md', variant: 'secondary' }, 'Medium'),
        h(NS.Button, { key: 'lg', size: 'lg', variant: 'secondary' }, 'Large'),
      ]);
    },
    States: function () {
      return h('div', { class: 'ns-cluster' }, [
        h(NS.Button, { key: 'l', variant: 'primary', loading: true }, 'Deploying…'),
        h(NS.Button, { key: 'x', variant: 'primary', disabled: true }, 'Deploy'),
      ]);
    },
  };
})();
