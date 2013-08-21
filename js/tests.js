(function() {
  var $;

  $ = function(s) {
    return Array.prototype.slice.call(document.querySelectorAll(s));
  };

  test('compile', function() {
    equal(jtmpl('tpl{{a}}xyz', {
      a: 'A'
    }), 'tpl<span data-jt="a">A</span>xyz', 'var');
    equal(jtmpl('{{#a}}{{.}}{{/a}}', {
      a: [1, 2]
    }), '<span data-jt=".">1</span><span data-jt=".">2</span>', 'numeric array');
    equal(jtmpl('{{#a}}{{.}}{{/a}}', {
      a: []
    }), '', 'empty array');
    equal(jtmpl('{{#a}}{{z}}{{/a}}', {
      a: [
        {
          z: 1
        }
      ]
    }), '<span data-jt="z">1</span>', 'object array');
    equal(jtmpl('{{^a}}{{z}}{{/a}}', {
      a: [
        {
          z: 1
        }
      ]
    }), '', 'object array false');
    equal(jtmpl('{{#a}}1{{/a}}', {
      a: true
    }), '1', 'positive condition');
    equal(jtmpl('{{^a}}1{{/a}}', {
      a: true
    }), '', 'negative condition');
    equal(jtmpl('{{#a}}1{{/a}}', {
      a: false
    }), '', 'positive condition false');
    return equal(jtmpl('{{^a}}1{{/a}}', {
      a: false
    }), '1', 'negative condition false');
  });

}).call(this);
