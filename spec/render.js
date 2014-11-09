var qs = function() { return document.querySelector.apply(document, arguments); };
var qsa = function() { return document.querySelectorAll.apply(document, arguments); };
var map = function(arr, func) { return [].map.call(arr, func); };
var ok = require('assert').ok;
var deepEqual = require('assert').deepEqual;


module.exports = function() {
  it('<input value="{{variable}}">', function() {
    ok(qs('input').value === '42');
  });

  it('<input value="{{nonExistentVariable}}">', function() {
    ok(qsa('input')[1].value === '');
  });

  it('{{variable}}', function() {
    ok(qs('#variable').innerHTML === '42');
  });

  it('{{{innerHTML}}}', function() {
    ok(
      qs('#innerHTML').innerHTML.trim() ===
        'Try <code>jtmpl("#target")("innerHTML", "&lt;p&gt;new content&lt;/p&gt;")' +
        '</code> on the console to replace me.<!---->' ||
      // IE is special...
      qs('#innerHTML').innerHTML.trim() ===
        'Try <CODE>jtmpl("#target")("innerHTML", "&lt;p&gt;new content&lt;/p&gt;")' +
        '</CODE> on the console to replace me.<!---->'
    );
  });

  it('{{{nonExistentVariable}}}', function() {
    ok(qs('#nonExistentVariable').innerHTML.trim() === '<!---->');
  });

  it('{{#numbers}}', function() {
    deepEqual(
      map(
        qs('ul').querySelectorAll('li'),
        function(el) { return parseInt(el.innerHTML); }
      ),
      [1, 2, 3]
    );
  });

  it('{{#table}}', function() {
    deepEqual(
      map(
        qs('table').querySelectorAll('td'),
        function(el) { return parseInt(el.innerHTML); }
      ),
      [1, 2, 3, 4, 5, 6, 7, 8, 9]
    );
  });

  it('class="{{#condition}}red-class{{/}}"', function() {
    ok(qsa('.red-class').length === 1);
  });

  it('class="{{^condition}}bordered-class{{/}}"', function() {
    ok(qsa('.bordered-class').length === 0);
  });

  it('<select> with bound options', function() {
    ok(qs('select').selectedIndex === 0);
  });

  it('radio group with same bound options', function() {
    ok(qs('input[name="radio-group"]').checked);
    ok(!qsa('input[name="radio-group"]')[1].checked);
    ok(!qsa('input[name="radio-group"]')[2].checked);
  });

  it('<select multiple> with bound options', function() {
    deepEqual(
      map(
        qsa('select[multiple] option'),
        function(el) { return el.selected; }
      ),
      [true, false, true, false]
    );
  });

  it('.checkbox-group with same bound options', function() {
    deepEqual(
      map(
        qsa('.checkbox-group'),
        function(el) { return el.checked; }
      ),
      [true, false, true, false]
    );
  });

  it('.checkbox-group-all', function() {
    ok(!qsa('.checkbox-group-all')[0].checked);
  });

  it('local recursive partial', function(done) {
    // Partials are processed async, give it time
    // to resolve
    setTimeout(function() {
      deepEqual(
        map(
          qsa('.tree-node-value'),
          function(el) { return parseInt(el.innerHTML); }
      ),
      [1, 2, 3, 4, 5, 6]
      );
      done();
    });
  });
};
