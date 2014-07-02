/*

Evaluate object from literal or CommonJS module

*/

	/* jshint evil:true */
    module.exports = function(body) {
      var result, module = { exports: {} };
      return (body.match(/^\s*{[\S\s]*}\s*$/)) ?
        // Literal
        eval('result=' + body) :
        // CommonJS module
        new Function('module', 'exports', body + ';return module.exports;')(module, module.exports);
    };
