module.exports = function(events, target) {
  function addEvent(event) {
    target.addEventListener(
      event,
      function(ev) {
        for (var selector in events[event]) {
          if (ev.target.matches(selector)) {
            events[event][selector].call(ev.target.__jtmpl__, ev);
          }
        }
      }
    );
  }

  for (var event in events) {
    addEvent(event);
  }
}
