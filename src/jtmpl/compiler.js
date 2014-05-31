/*

## Compiler

*/

    function escapeRE(s) {
      return  (s + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    }


    function tokenizer(options, flags) {
      return RegExp(
        escapeRE(options.delimiters[0]) + 
        '(' + RE_ANYTHING + ')' +
        escapeRE(options.delimiters[1]),
        flags
      );
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


    j.wrapTagsInHTMLComments = function(template, options) {
      return template.replace(
        tokenizer(options, 'g'),
        function(match, match1, pos) {
          var head = template.slice(0, pos);
          var insideTag = !!head.match(RegExp('<' + RE_SRC_IDENTIFIER + '[^>]*?$'));
          var insideComment = !!head.match(/<!--\s*$/);
          return insideTag || insideComment ?
            match :
            '<!--' + match + '-->';
        }
      );
    };



/*

### jtmpl.compile(template, model[, options[, openTag]])

Return documentFragment

*/

    j.compile = function (template, model, options, openTag) {

      var i, ai, alen, attr, val, buffer, pos, body, node, el, t, match, rule, token;
      var fragment = document.createDocumentFragment();

      options = options || defaultOptions;

      // Template can be a string or DOM structure
      if (template instanceof Node) {
        body = template;
      }
      else {
        template = j.wrapTagsInHTMLComments(template, options);

        body = document.createElement('body');
        body.innerHTML = template;
      }


      // Iterate child nodes.
      // Length is not precalculated (and for is used instead of map),
      // as it can mutate because of splitText()
      for (i = 0; i < body.childNodes.length; i++) {

        node = body.childNodes[i];

        // Shallow copy of node and attributes (if element)
        el = node.cloneNode(false);
        fragment.appendChild(el);

        switch (el.nodeType) {

          // Element node
          case 1:

            // Check attributes
            for (ai = 0, alen = el.attributes.length; ai < alen; ai++) {
              attr = el.attributes[ai];
              val = attr.value;
              // Accumulate templated output
              // buffer = '';
              // pos = 0;
              // console.log('found attr ' + attr.name + '=' + attr.value);

              t = tokenizer(options, 'g');

              while ( (match = t.exec(val)) ) {
                rule = matchRules(match[0], el, attr.name, model, options);

                // buffer +=
                //   val.slice(pos, match.index) +
                //   (rule ? rule.replace || '' : match[0]);

                // pos = t.lastIndex;
              }
              // buffer += val.slice(pos);

              // if (buffer != val) {
              //   attr.value = buffer;
              // }
            }

            // Recursively compile
            el.appendChild(j.compile(node, model, options));
            break;

          // Comment node
          case 8:
            if ( (match = el.data.match(tokenizer(options))) ) {
              rule = matchRules(el.data, match[1], null, model, options);
              if (rule) {
                // DOM replacement
                if (rule.replace instanceof Node) {
                  el.parentNode.replaceChild(rule.replace, el);
                }
              }
            }
            break;
/*
          // Text node
          case 3:

            t = tokenizer(options);

            while ( (match = el.data.match(t)) ) {
              token = el.splitText(match.index);
              el = token.splitText(match[0].length);
              rule = matchRules(token.data, token, null, model, options);

              if (rule) {

                // Text replacement
                if (typeof rule.replace === 'string' || !rule.replace) {
                  token.data = rule.replace || '';
                }

                // DOM replacement
                if (rule.replace instanceof Node) {
                  token.parentNode.replaceChild(rule.replace, token);
                }

                if (rule.block) {
                  // TODO: get template
                  // TODO: call rule.callback(template)
                }
              }
            }

            break;
            */



        } // switch

      } // for

      return fragment;
    };