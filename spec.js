/*

Specification

*/

    function spec() {
      console.log(document.title);
    }


    var page = require('webpage').create();

    page.onConsoleMessage = function(msg) {
      console.log(msg);
    };

    page.onResourceRequested = function(request) {
      // console.log('Request ' + JSON.stringify(request, undefined, 4));
    };

    page.onResourceReceived = function(response) {
      // console.log('Receive ' + JSON.stringify(response, undefined, 4));
    };    

    var fs = require('fs');
    page.open('file://' + fs.workingDirectory + '/spec-test.html', function(status) {
      page.evaluate(spec);
      phantom.exit();
    });