/*

## Rules

Each rule is a function, args passed (tag, node, attr, model, options)

It MUST return either:

* falsy value - no match

* object - match found, return (all fields optional)

     {
       // Set new context, default - original model
       model: set_new_context_object

       // Parse until {{/tagName}} ...
       block: 'tagName'
       // ... then call `replace`
       
       // Return replace block tag contents
       replace: function(tmpl, parent) { ... }
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

### class="{{#ifCondition}}some-class{{/}}"

Toggles class `some-class` in sync with boolean `model.ifCondition`

*/

      function (tag, node, attr, model, options) {
        var match = tag.match(new RegExp('#' + RE_SRC_IDENTIFIER));
        var klass;
        
        if (attr === 'class' && match) {
          return {
            prop: match[1],

            replace: function(tmpl) {
              klass = tmpl;
              return '';
            },

            react: function(val) {
              (!!val && j.addClass || j.removeClass)(node, klass);
            },

            block: match[1]
          };
        }
      },


/*

### {{#section}}

Can be bound to text node

*/

      function (tag, node, attr, model, options) {
        var match = tag.match(new RegExp('#' + RE_SRC_IDENTIFIER));
        var prop = match && match[1];
        var template;
        var fragment = document.createDocumentFragment();
        var anchor = document.createComment('');
        var length = 0;
        var arrayReact = function(type, index, count) {
          var parent = anchor.parentNode;
          var anchorIndex = [].indexOf.call(parent.childNodes, anchor);
          var pos = anchorIndex - length + index * template.childNodes.length;
          var size = count * template.childNodes.length;
          var i, fragment;

          switch (type) {

            case 'ins':
              
              for (i = 0, fragment = document.createDocumentFragment();
                  i < count; i++) {
                fragment.appendChild(j.compile(template, model[prop][index + i]));
              }
                
              parent.insertBefore(fragment, parent.childNodes[pos]);
              length = length + size;
              
              break;

            case 'del':
              
              length = length - size;

              while (size--) {
                parent.removeChild(parent.childNodes[pos]);
              }

              break;
          }
        };

        var react = function(i) {
          return function() {
            arrayReact('del', i, 1);
            arrayReact('ins', i, 1);
          };
        };

        if (match) {

          return {

            prop: match[1],

            replace: function(tmpl, parent) {
              fragment.appendChild(anchor);
              template = tmpl;
              return anchor;
            },

            react: function(val) {
              var i, len, render;

              // Delete old rendering
              while (length) {
                anchor.parentNode.removeChild(anchor.previousSibling);
                length--;
              }

              // Array?
              if (Array.isArray(val)) {
                render = document.createDocumentFragment();
                for (i = 0, len = val.length; i < len; i++) {
                  j.watch(model[prop], i, react(i), null, i);
                  render.appendChild(j.compile(template, val[i]));
                }
                length = render.childNodes.length;
                anchor.parentNode.insertBefore(render, anchor);
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

            block: match[1],

            arrayReact: arrayReact
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
