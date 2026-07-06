// authored stories for "icon-button"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.IconButton, { icon: '↻', label: 'Restart api service' });
    },
    Variants: function () {
      return h('div', { class: 'ns-cluster' }, [
        h(NS.IconButton, { key: 'p', icon: '▶', label: 'Resume workers', variant: 'primary' }),
        h(NS.IconButton, { key: 's', icon: '⏸', label: 'Pause sagas', variant: 'secondary' }),
        h(NS.IconButton, { key: 'o', icon: '↻', label: 'Retry trigger', variant: 'outline' }),
        h(NS.IconButton, { key: 'g', icon: '⚙', label: 'Configure streams', variant: 'ghost' }),
        h(NS.IconButton, {
          key: 'd',
          icon: '✕',
          label: 'Cancel run',
          variant: 'destructive',
        }),
      ]);
    },
    States: function () {
      return h('div', { class: 'ns-cluster' }, [
        h(NS.IconButton, { key: 'l', icon: '↻', label: 'Redeploying', loading: true }),
        h(NS.IconButton, { key: 'x', icon: '⚙', label: 'Locked', disabled: true }),
      ]);
    },
  };
})();
