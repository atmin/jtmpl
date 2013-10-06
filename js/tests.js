(function() {
  test('compile', function() {
    equal(jtmpl('tpl{{a}}xyz', {
      a: 'A'
    }), 'tpl<span data-jt="a">A</span>xyz', 'var');
    equal(jtmpl('{{#a}}{{.}}{{/a}}', {
      a: [1, 2]
    }), '<div data-jt="#a"><!-- # <<<.>>> --><span data-jt=".">1</span><span data-jt=".">2</span></div>', 'numeric array');
    equal(jtmpl('{{#a}}{{.}}{{/a}}', {
      a: []
    }), '<div data-jt="#a"><!-- # <<<.>>> --></div>', 'empty array');
    equal(jtmpl('{{#a}}{{z}}{{/a}}', {
      a: [
        {
          z: 1
        }
      ]
    }), '<div data-jt="#a"><!-- # <<<z>>> --><span data-jt="z .">1</span></div>', 'object array');
    equal(jtmpl('{{^a}}{{z}}{{/a}}', {
      a: [
        {
          z: 1
        }
      ]
    }), '<div data-jt="^a"><!-- ^ <<<z>>> --></div>', 'object array false');
    equal(jtmpl('{{#a}}1{{/a}}', {
      a: true
    }), '1', 'positive condition');
    equal(jtmpl('{{^a}}1{{/a}}', {
      a: true
    }), '', 'negative condition');
    equal(jtmpl('{{#a}}1{{/a}}', {
      a: false
    }), '', 'positive condition false');
    equal(jtmpl('{{^a}}1{{/a}}', {
      a: false
    }), '1', 'negative condition false');
    equal(jtmpl('<p>{{a}}</p>', {
      a: 1
    }), '<p data-jt="a">1</p>', 'inject var tag');
    equal(jtmpl('<p data-jt="">{{a}}</p>', {
      a: 1
    }), '<p data-jt="a">1</p>', 'inject var tag, existing `data-jt` attribute');
    equal(jtmpl('<p attr="{{a}}"></p>', {
      a: 42
    }), '<p data-jt="attr=a" attr="42"></p>', 'var on attribute');
    equal(jtmpl('<div>{{#outer}}<div>{{#inner}}{{.}}{{/inner}}</div>{{/outer}}</div>', {
      outer: [
        {
          inner: [1, 2, 3]
        }, {
          inner: [1, 2]
        }, {
          inner: [1]
        }
      ]
    }), '<div data-jt="#outer"><!-- # <div><<<#inner>>><<<.>>><<</inner>>></div> --><div data-jt="#inner ."><!-- # <<<.>>> --><span data-jt=".">1</span><span data-jt=".">2</span><span data-jt=".">3</span></div><div data-jt="#inner ."><!-- # <<<.>>> --><span data-jt=".">1</span><span data-jt=".">2</span></div><div data-jt="#inner ."><!-- # <<<.>>> --><span data-jt=".">1</span></div></div>', 'nested sections');
    equal(jtmpl('{{#outer}}{{#inner}}{{.}}{{/inner}}{{/outer}}', {
      outer: [
        {
          inner: [1, 2, 3]
        }, {
          inner: [1, 2]
        }, {
          inner: [1]
        }
      ]
    }), '<div data-jt="#outer"><!-- # <<<#inner>>><<<.>>><<</inner>>> --><div data-jt="#inner ."><!-- # <<<.>>> --><span data-jt=".">1</span><span data-jt=".">2</span><span data-jt=".">3</span></div><div data-jt="#inner ."><!-- # <<<.>>> --><span data-jt=".">1</span><span data-jt=".">2</span></div><div data-jt="#inner ."><!-- # <<<.>>> --><span data-jt=".">1</span></div></div>', 'nested sections no divs');
    equal(jtmpl('<a class="some-class {{bound-class}}">', {
      'bound-class': true
    }), '<a data-jt="class=bound-class" class="some-class bound-class">', 'class attribute true');
    equal(jtmpl('<a class="some-class {{bound-class}}">', {
      'bound-class': false
    }), '<a data-jt="class=bound-class" class="some-class ">', 'class attribute false');
    equal(jtmpl('<a prop="{{prop}}">', {
      prop: null
    }), '<a data-jt="prop=prop" >', 'output null attribute');
    return equal(jtmpl('<a prop="{{prop}}">', {
      prop: 1
    }), '<a data-jt="prop=prop" prop="1">', 'output non-null attribute');
  });

  test('bind', function() {
    var collectionDOMText;
    collectionDOMText = function() {
      var node;
      return "" + ((function() {
        var _i, _len, _ref, _results;
        _ref = jtmpl('ul li ul')[0].children;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          _results.push(parseInt(node.innerHTML));
        }
        return _results;
      })());
    };
    model.collection[0].inner[0] = 42;
    return equal(jtmpl('ul li ul li')[0].innerHTML, '42', 'nested section item innerHTML');
  });

}).call(this);
