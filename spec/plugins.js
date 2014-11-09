var ok = require('assert').ok;

module.exports = function() {
  it('executes __init__ plugin asynchronously', function(/*done*/) {
    //ok(jtmpl('#target')('initialized') === undefined);

    //setTimeout(function() {
      ok(jtmpl('#target')('initialized'));
      //done();
    //}, 0);
  });
};
