/*

## Compiler

*/


/*

  Given a String and options object, return list of tokens:

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


    function tokenizer(options, flags) {
      return RegExp(
        escapeRE(options.delimiters[0]) + 
        RE_ANYTHING +
        escapeRE(options.delimiters[1]),
        flags
      );
    }


    function escapeRE(s) {
      return  (s + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    }


    function matchRules(tag, node, attr, model, options) {
      var i, match;
      var rules = j.rules;
      var rulesLen = j.rules.length;

      // Strip delimiters
      tag = tag.slice(options.delimiters[0].length, -options.delimiters[1].length);

      for (i = 0; i < rulesLen; i++) {
        match = rules[i](tag, node, attr, model, options);
        
        if (match) {
          return match;
        }
      }
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

    j.compile = function (template, model, options, openTag) {

      var i, ai, alen, body, node, el, t, match, rule, token;
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


      // Iterate child nodes.
      // Length is not precalculated (and for is used instead of map),
      // as it can mutate because of splitText()
      for (i = 0; i < body.childNodes.length; i++) {

        node = body.childNodes[i];

        // Clone node and attributes (if element) only
        el = node.cloneNode(false);
        fragment.appendChild(el);

        switch (el.nodeType) {

          // Element node
          case 1:

            // Check attributes
            for (ai = 0, alen = el.attributes.length; ai < alen; ai++) {
              console.log(attr.name + '=' + attr.value);
            }

            // Recursively compile
            el.appendChild(j.compile(node, model, options));
            break;

          // Text node
          case 3:

            t = tokenizer(options);

            while ( (match = el.data.match(t)) ) {
              token = el.splitText(match.index);
              el = token.splitText(match[0].length);
              rule = matchRules(token.data, token, null, model, options);

              if (rule) {
                token.data = rule.replace || '';
              }
            }

            break;
            
        } // switch

      } // for

      return fragment;
    };