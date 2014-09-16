module.exports = function(events, target) {
  for (var event in events) {
    target.addEventListener(
      event,
      function(ev) {
        for (var selector in events[event]) {
          if (ev.target.matches(selector)) {
            events[event][selector].call(ev.target.__jtmpl__);
          }
        }
      }
    );
  }
}
