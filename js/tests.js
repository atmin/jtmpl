(function() {
  var $;

  $ = function(s) {
    return Array.prototype.slice.call(document.querySelectorAll(s));
  };

  test('tests', function() {
    return equal(jtmpl('tpl{{a}}', {
      a: 'A'
    }), 'tplA', 'var substitution OK');
  });

}).call(this);
