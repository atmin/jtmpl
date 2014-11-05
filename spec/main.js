// Inline main.html contents into testling bundle
/* jshint evil:true */
document.write(
  require('atob')(
    require('fs')
    .readFileSync(
      __dirname + '/main.html',
      'base64'
    )
  )
);

// Tests via tape
var test = require('tape');

test('jtmpl is a function', function(t) {
  t.ok(typeof jtmpl === 'function', 'jtmpl is a function');
  t.ok(typeof jtmpl === 'function', 'jtmpl is a function 22222');
  console.log('# window.location is ' + window.location);
  t.end();
});
