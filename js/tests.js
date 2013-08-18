(function() {
  var $;

  $ = function(s) {
    return Array.prototype.slice.call(document.querySelectorAll(s));
  };

  test('tests', function() {
    equal(jtmpl('tpl{{a}}', {
      a: 'A'
    }), 'tplA', 'var OK');
    equal(jtmpl('{{#a}}{{.}}{{/a}}', {
      a: [1, 2, 3]
    }), '123', 'numeric array OK');
    equal(jtmpl('{{#a}}{{.}}{{/a}}', {
      a: []
    }), '', 'empty array OK');
    equal(jtmpl('{{#a}}{{z}}{{/a}}', {
      a: [
        {
          z: 1
        }
      ]
    }), '1', 'object array OK');
    equal(jtmpl('{{^a}}{{z}}{{/a}}', {
      a: [
        {
          z: 1
        }
      ]
    }), '', 'object array false OK');
    equal(jtmpl('{{#a}}1{{/a}}', {
      a: true
    }), '1', 'positive condition OK');
    equal(jtmpl('{{^a}}1{{/a}}', {
      a: true
    }), '', 'negative condition OK');
    equal(jtmpl('{{#a}}1{{/a}}', {
      a: false
    }), '', 'positive condition false OK');
    return equal(jtmpl('{{^a}}1{{/a}}', {
      a: false
    }), '1', 'negative condition false OK');
  });

}).call(this);
