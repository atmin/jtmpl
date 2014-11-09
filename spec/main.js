// Inline main.html contents
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


describe('jtmpl test suite', function() {

  var proceed = false;

  beforeEach(function(done) {
    setTimeout(function() {
      proceed = true;
      done();
    }, 1000);
    if (proceed) done();
  });

  describe('jtmpl', require('./base'));
  describe('plugins', require('./plugins'));
  describe('render', require('./render'));
});
