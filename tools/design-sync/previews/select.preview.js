// authored stories for "select"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  var services = [
    { value: 'api', label: 'api' },
    { value: 'workers', label: 'workers' },
    { value: 'sagas', label: 'sagas' },
    { value: 'triggers', label: 'triggers' },
    { value: 'streams', label: 'streams (draining)', disabled: true },
  ];
  window.__dsPreview = {
    Default: function () {
      return h(NS.Select, { options: services, value: 'workers' });
    },
    Placeholder: function () {
      return h(NS.Select, {
        options: services,
        placeholder: 'Select a service…',
      });
    },
    Error: function () {
      return h(NS.Select, {
        options: services,
        error: true,
        placeholder: 'Service is required',
      });
    },
  };
})();
