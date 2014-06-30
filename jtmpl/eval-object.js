/*

Evaluate object from literal or CommonJS module

*/

    module.exports = function() {
      var result, module = { exports: {} };
      return (body.match(/^\s*{.*}\s*$/)) ?
        // Literal
        eval('result=' + body) :
        // CommonJS module
        new Function('module', 'exports', body + ';return module.exports;')(module, module.exports);
    }
