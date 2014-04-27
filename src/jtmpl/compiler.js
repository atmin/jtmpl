/*

## Compiler

Returns documentFragment

*/

    j.compile = function (template, model, openTag) {
      var body;

      if (!template instanceof Node) {
        body = document.createElement('body');
        body.innerHTML = template;
        template = body;
      }

      return template;
    };