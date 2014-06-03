/*

## Rules

Each rule is a function, args passed (tag, node, attr, model, options)

It MUST return either:

* falsy value - no match

* object - match found, return (all fields optional)

     {
       // Replace tag in generated content, default - ''
       replace: 'replacement'

       // Set new context, default - original model
       model: set_new_context_object

       // Parse until {{/tagName}} ...
       block: 'tagName'
       // ... then `replace` must be a function and it will be called with the extracted template
       
     }

*/

    j.rules = [


/*

### class="{{some-class}}"

Toggles class `some-class` in sync with boolean `model['some-class']`

*/

      function (tag, node, attr, model, options) {
        var match = tag.match(RE_IDENTIFIER);
        var react = function(val) {
          (!!val && j.addClass || j.removeClass)(node, tag);
        };
        
        if (attr === 'class' && match) {
          j.watch(model, tag, react);
          j.removeClass(node, options.delimiters[0] + tag + options.delimiters[1]);
          return {};
        }
      },


/*

### {{#section}}

Can be bound to text node

*/

      function (tag, node, attr, model, options) {
        var match = tag.match(new RegExp('#' + RE_SRC_IDENTIFIER));
        var prop;
        var template;
        var position;
        var anchor = document.createComment('');
        var length = 0;

        var react = function(val) {
          var render;

          // Delete old rendering
          while (length) {
            anchor.parentNode.removeChild(anchor.previousSibling);
            length--;
          }

          if (val) {
            render = j.compile(template, model);
            length = render.childNodes.length;
            anchor.parentNode.insertBefore(render, anchor);
          }
        };
        
        if (match) {
          prop = match[1];

          j.watch(model, prop, react);

          return {
            replace: function(tmpl, parent) {
              template = tmpl;
              position = parent.childNodes.length;
              react(model[prop]);
              return anchor;
            },
            block: match[1]
          };

        }
      },



/*

### {{var}}

Can be bound to text node data or attribute

*/

      function (tag, node, attr, model, options) {
        var react, result;
        
        if (tag.match(RE_IDENTIFIER)) {

          if (attr) {
            // Attribute
            react = function(val) {
              return val ?
                node.setAttribute(attr, val) :
                node.removeAttribute(attr);
            };
            j.watch(model, tag, react);
            react(model[tag]);
            return {};
          }

          else {
            // Text node
            result = document.createTextNode(model[tag] || '');
            
            j.watch(model, tag, function(val) {
              result.data = val;
            });
            
            return {
              replace: result
            };
          }

        }
      }

    ];
