var qs = function() { return document.querySelector.apply(document, arguments); };
var ok = require('assert').ok;

module.exports = function() {
  it('is a function', function() {
    ok(typeof jtmpl === 'function');
  });

  it('processes [data-jtmpl] elements', function() {
    ok(qs('#target').childNodes.length > 0);
  });

  it('returns wrapped model', function() {
    ok(Array.isArray(jtmpl('#target')('numbers').values));
  });
};
