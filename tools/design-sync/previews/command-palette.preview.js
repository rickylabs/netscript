// authored stories for "command-palette"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  var groups = [
    {
      id: 'nav',
      label: 'Go to',
      items: [
        { id: 'runs', label: 'Runs', icon: '▤', hash: '/runs', kind: 'Page' },
        { id: 'services', label: 'Services', icon: '◈', hash: '/services', kind: 'Page' },
        { id: 'triggers', label: 'Triggers', icon: '⚡', hash: '/triggers', kind: 'Page' },
      ],
    },
    {
      id: 'actions',
      label: 'Actions',
      items: [
        { id: 'scale', label: 'Scale a service…', icon: '⤢', hash: '⌘S', kind: 'Action' },
        { id: 'replay', label: 'Replay failed run…', icon: '↻', hash: '⌘R', kind: 'Action' },
        { id: 'ask', label: 'Ask Ops Copilot', icon: '✦', kind: 'Agent' },
      ],
    },
  ];
  // The palette renders in a fixed/dialog overlay (ns-cmdk__backdrop); the card
  // cell collapses around it and clips. A sized, transform'd block becomes the
  // containing block and gives the ⌘K surface room to render in-card.
  function stage(node) {
    return h(
      'div',
      {
        // React rejects string style props — object form only.
        style: {
          position: 'relative',
          transform: 'translateZ(0)',
          height: '420px',
          overflow: 'hidden',
          borderRadius: '8px',
        },
      },
      node,
    );
  }
  window.__dsPreview = {
    Open: function () {
      return stage(h(NS.CommandPalette, {
        open: true,
        groups: groups,
        placeholder: 'Type a command or search…',
      }));
    },
  };
})();
