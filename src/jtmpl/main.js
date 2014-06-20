/*

## Main function

Referred as `j`, exported as `jtmpl`.

*/

    function j() {
      var args = [].slice.call(arguments);
      var target, t, template, model;
  
      // jtmpl('HTTP_METHOD', url[, parameters[, callback[, options]]])?
      if (['GET', 'POST'].indexOf(args[0]) > -1) {
        return j.xhr.apply(null, args);
      }

      // jtmpl(template, model[, options])?
      else if (
        typeof args[0] === 'string' && 
        typeof args[1] === 'object' &&
        ['object', 'undefined'].indexOf(typeof args[2]) > -1
      ) {
        return j.compile.apply(null, args);
      }

      // jtmpl(target, model[, options])?
      // else if (
      //   args[0] instanceof Node &&
      //   typeof args[1] === 'object'
      // ) {
      //   console.log('jtmpl(target, model[, options])');
      // }

      // jtmpl(target, template, model[, options])?
      else if (
        ( args[0] instanceof Node || 
          (typeof args[0] === 'string')
        ) &&

        ( args[1] instanceof Node || 
          args[1] instanceof DocumentFragment ||
          (typeof args[1] === 'string')
        ) &&

        ( typeof args[2] === 'object' ||
          typeof args[2] === 'string'
        ) &&

        args[2] !== undefined

      ) {

        target = args[0] instanceof Node ?
          args[0] :
          document.querySelector(args[0]);

        template = args[1].match(RE_NODE_ID) ?
          document.querySelector(args[1]).innerHTML :
          args[1];

        model = 
          typeof args[2] === 'object' ?
            args[2] :
            args[2].match(RE_NODE_ID) ?
              j.loadModel(document.querySelector(model).innerHTML) :
              undefined;

        if (target.nodeName === 'SCRIPT') {
          t = document.createElement('div');
          t.id = target.id;
          target.parentNode.replaceChild(t, target);
          target = t;
        }

        // Empty target
        target.innerHTML = '';

        // Assign compiled template
        target.appendChild(j.compile(template, model, args[3]));
      }
    }



/*

On page ready, process jtmpl targets

*/

    document.addEventListener('DOMContentLoaded', function() {
      var targets = document.querySelectorAll('[data-template]');
      var t, m;

      for (var i = 0, len = targets[len]; i < len; i++) {
        t = targets[i];
        // if (src.match(RE_NODE_ID)) {
        //   return loadModel(document.querySelector(src).innerHTML);
        // }

        jtmpl(t, t.getAttribute('data-template'), t.getAttribute('data-model'));
      }
    });