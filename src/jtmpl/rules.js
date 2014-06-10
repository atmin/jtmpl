/*

## Rules

Each rule is a function, args passed (tag, node, attr, model, options)

It MUST return either:

* falsy value - no match

* object - match found, return (all fields optional)

     // TODO: result object doc is obsolete
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
        
        if (attr === 'class' && match) {
          j.removeClass(node, options.delimiters[0] + tag + options.delimiters[1]);

          return {
            prop: tag,
            react: function(val) {
              (!!val && j.addClass || j.removeClass)(node, tag);
            }
          };
        }
      },


/*

### {{#section}}

Can be bound to text node

*/

      function (tag, node, attr, model, options) {
        var match = tag.match(new RegExp('#' + RE_SRC_IDENTIFIER));
        var template;
        var position;
        var fragment = document.createDocumentFragment();
        var anchor = document.createComment('');
        var length = 0;
        
        if (match) {

          return {

            prop: match[1],

            replace: function(tmpl, parent) {
              fragment.appendChild(anchor);
              template = tmpl;
              position = parent.childNodes.length;
              return anchor;
            },

            react: function(val) {
              var render;

              // Delete old rendering
              while (length) {
                anchor.parentNode.removeChild(anchor.previousSibling);
                length--;
              }

              // Array?
              if (Array.isArray(val)) {

              }
              // Object?
              else if (typeof val === 'object') {
                render = j.compile(template, val);
                length = render.childNodes.length;
                anchor.parentNode.insertBefore(render, anchor);
              }
              // Cast to boolean
              else {
                if (!!val) {
                  render = j.compile(template, model);
                  length = render.childNodes.length;
                  anchor.parentNode.insertBefore(render, anchor);
                }
              }
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
        var react, target;
        
        if (tag.match(RE_IDENTIFIER)) {

          if (attr) {
            // Attribute
            return {
              prop: tag,
              react: function(val) {
                return val ?
                  node.setAttribute(attr, val) :
                  node.removeAttribute(attr);
              }
            };

          }

          else {
            // Text node
            target = document.createTextNode('');

            return {
              prop: tag,
              replace: target,
              react: function(val) {
                target.data = val || '';
              }
            };

          }

        }
      }

    ];
