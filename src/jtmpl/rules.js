/*

## Rules

Each rule is a function, args passed (tag, node, attr, model, options)

tag: text between delimiters, {{tag}}
node: DOM node, where tag is found
attr: node attribute or null, if node contents
model: bound model
options: configuration options

It must return either:

* falsy value - no match

* object - match found, return (all fields optional)

     {
       // Set new context, default - original model
       model: set_new_context_object

       // Return replace block tag contents
       replace: function(tmpl, parent) { ... }

       // React on model[prop] change
       react: function(val) { ... }

       // React on insertion/deletion
       arrayReact: function(type, index, count) { ... }
     }

*/

    j.rules = [


/*

### onevent="{{handler}}"

Attach event listener for the 'event' event, remove the attribute

*/

      function (tag, node, attr, model, options) {
        var tagmatch = tag.match(RE_IDENTIFIER);
        var attrmatch = attr && attr.match(new RegExp('on' + RE_SRC_IDENTIFIER));

        if (tagmatch && attrmatch) {
          // Remove 'onevent' attribute
          node.setAttribute(attr, null);
          // TODO: use event delegation
          node.addEventListener(attrmatch[1], model[tag]);
        }
      },



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
          // console.log('arrayReact ' + type + ', ' + index + ', ' + count);
          var obj = model;
          var parent = anchor.parentNode;
          var anchorIndex = [].indexOf.call(parent.childNodes, anchor);
          var pos = anchorIndex - length + index * template.childNodes.length;
          var size = count * template.childNodes.length;
          var i, fragment;

          switch (type) {

            case 'ins':
              
              for (i = 0, fragment = document.createDocumentFragment();
                  i < count; i++) {
                fragment.appendChild(j.compile(template, obj[prop][index + i]));
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

        var update = function(i) {
          return function() {
            // arrayReact('del', i, 1);
            // arrayReact('ins', i, 1);
            // model[prop].__(i, null, true);
            var parent = anchor.parentNode;
            var anchorIndex = [].indexOf.call(parent.childNodes, anchor);
            var pos = anchorIndex - length + i * template.childNodes.length;

            parent.replaceChild(
              j.compile(template, model[prop][i]),
              parent.childNodes[pos]
            );
          };
        };

        var react = function(val) {
          var i, len, render;
          var arrayWatchers;

          if (typeof model[prop] === 'object' && model[prop].__) {
            // Capture arrayWatchers
            arrayWatchers = model[prop].__.arrayWatchers;
          }

          // Delete old rendering
          while (length) {
            anchor.parentNode.removeChild(anchor.previousSibling);
            length--;
          }

          // Array?
          if (Array.isArray(val)) {
            render = document.createDocumentFragment();
            for (i = 0, len = val.length; i < len; i++) {
              j.watch(model[prop], i, update(i), null, i);
              render.appendChild(j.compile(template, val[i]));
            }
            j.watch(model, prop, function() {
              // Restore arrayWatchers
              model[prop].__.arrayWatchers = arrayWatchers;
            });
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
        };

        if (match) {

          return {

            prop: match[1],

            replace: function(tmpl, parent) {
              fragment.appendChild(anchor);
              template = tmpl;
              return anchor;
            },

            react: react,

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
