// authored stories for "avatar"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.Avatar, { name: 'Ada Reeves', presence: 'online' });
    },
    Sizes: function () {
      return h('div', { class: 'ns-cluster' }, [
        h(NS.Avatar, { key: 'sm', name: 'Ravi Okonkwo', size: 'sm' }),
        h(NS.Avatar, { key: 'md', name: 'Ravi Okonkwo', size: 'md' }),
        h(NS.Avatar, { key: 'lg', name: 'Ravi Okonkwo', size: 'lg' }),
      ]);
    },
    PresenceAndAgent: function () {
      return h('div', { class: 'ns-cluster' }, [
        h(NS.Avatar, { key: 'on', name: 'Mei Sato', presence: 'online' }),
        h(NS.Avatar, { key: 'aw', name: 'Jonas Vidal', presence: 'away' }),
        h(NS.Avatar, { key: 'off', name: 'Priya Nair', presence: 'offline' }),
        h(NS.Avatar, { key: 'agent', name: 'Ops Copilot', initials: 'AI', agent: true }),
      ]);
    },
  };
})();
