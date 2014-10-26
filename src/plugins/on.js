module.exports = function(events, target) {
  function addEvent(event) {
    target.addEventListener(
      event,
      function(ev) {
        for (var selector in events[event]) {
          if (ev.target.matches(selector)) {
            var node = ev.target;
            while (!node.__jtmpl__ && node.parentNode) {
              node = node.parentNode;
            }
            events[event][selector].call(node.__jtmpl__, ev);
          }
        }
      }
    );
  }

  for (var event in events) {
    addEvent(event);
  }
};
