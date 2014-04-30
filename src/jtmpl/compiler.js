/*

## Compiler

*/


/*

  Return list of tokens:

  [[pos0, len0], [pos1, len1], ...]

  Positions and length include delimiter size.

*/
    
    function tokenize(s, options) {
      // Regular expression to match 
      // anything between options.delimiters
      var re = 
        RegExp(
          escapeRE(options.delimiters[0]) + 
          RE_ANYTHING +
          escapeRE(options.delimiters[1]),
          'g'
        );
      var match, result = [];

      // Find all matches
      while ( (match = re.exec(s)) ) {
        result.push([match.index, match[0].length]);
      }

      return result;
    }


    function escapeRE(s) {
      return  (s + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    }


    function matchRules(tag, node, attr, model, options) {
      var i, match;
      var rules = j.rules;
      var rulesLen = j.rules.length;

      for (i = 0; i < rulesLen; i++) {
        match = rules[i](tag, node, attr, model, options);
        
        if (match) {
          return match;
        }
      }

      return {
        replace: ''
      };
    }


/*

Browsers treat table elements in a special way, so table tags
will be replaced prior constructing DOM to force standard parsing,
then restored again after templating pass.

*/

    var replaceTagRules = [
      ['<table>', '<jtmpl-table>'],
      ['<table ', '<jtmpl-table '],
      ['</table>', '</jtmpl-table>'],
      ['<tr>', '<jtmpl-tr>'],
      ['<tr ', '<jtmpl-tr '],
      ['</tr>', '</jtmpl-tr>'],
      ['<td>', '<jtmpl-td>'],
      ['<td ', '<jtmpl-td '],
      ['</td>', '</jtmpl-td>']
    ];


/*

Return [documentFragment, model]

*/

    j.compile = function (template, model, openTag) {

      var body;
      var fragment = document.createDocumentFragment();

      // Template can be a string or DOM structure
      if (template instanceof Node) {
        body = template;
      }
      else {
        // replace <table> & co with custom tags
        replaceTagRules.map(
          function (pair) {
            template = template.replace(new RegExp(escapeRE(pair[0]), 'g'), pair[1]);
          }
        );

        body = document.createElement('body');
        body.innerHTML = template;
      }

      // Iterate child nodes, tokenize text nodes
      [].slice.call(body.childNodes).map(
        
        function (node) {
          var el, match;
        }
      );

      // Iterate child nodes
      [].slice.call(body.childNodes).map(
        
        function (node) {
          var el, match;

          // Clone node and attributes only
          el = node.cloneNode(false);

          // Element node?
          if (node.nodeType === 1) {

            // Check attributes
            [].slice.call(el.attributes).map(
              function (attr) {
                console.log(attr.name + '=' + attr.value);
              }
            );

            // Recursively compile
            el.appendChild(j.compile(node, model));
          }

          // Text node
          if (node.nodeType === 3 && 
              (match = node.data.match(/\{\{(\w+)\}\}/))) {

            el.data = model[match[1]] || '';
          }


          fragment.appendChild(el);
        }
      );

      return fragment;
    };