/*

# jtmpl 0.4.0

&copy;Copyright Atanas Minev 2013-2014, MIT licence


Wrap in IIFE

*/

     (function(root) {
     'use strict';


/*

## Main function

Referred as `j`, exported as `jtmpl`.

*/

    function j() {
      var args = [].slice.call(arguments);
  
      // jtmpl('HTTP_METHOD', url[, parameters[, callback[, options]]]) ?
      if (['GET', 'POST'].indexOf(args[0]) > -1) {
        return j.xhr(args);
      }

      // jtmpl(template, model[, options]) ?
      else if (
        typeof args[0] === 'string' && 
        typeof args[1] === 'object' &&
        ['object', 'undefined'].indexOf(typeof args[2]) > -1
      ) {
        return j.compile.apply(null, args);
      }
    }


/*

## Constants

*/    

    var RE_IDENTIFIER = /^[\w\.\-]+$/;
    var RE_SRC_IDENTIFIER = '([\\w\\.\\-]+)';
    var RE_PIPE = /^[\w\.\-]+(?:\|[\w\.\-]+)?$/;
    var RE_NODE_ID = /^#[\w\.\-]+$/;
    var RE_ANYTHING = '[\\s\\S]*?';
    var RE_SPACE = '\\s*';


    var bookkeepingProto = {
      dependents: {},
      watchers: {},
      childContexts: [],
      initialized: false
    };


/*
  
Default options

*/
    
    var defaultOptions = {
      delimiters: ['{{', '}}']
    };


/*

### extend(a, b)

Right-biased key-value concat of objects `a` and `b`

*/

    j.extend = function(a, b) {
      var o = {};
      var i;

      for (i in a) {
        if (a.hasOwnProperty(i)) {
          o[i] = a[i];
        }
      }

      for (i in b) {
        if (b.hasOwnProperty(i)) {
          o[i] = a[b];
        }
      }

      return o;
    };



/*

### hasClass, addClass, removeClass

Element class handling utilities.

*/

    j.hasClass = function(el, name) {
      return new RegExp('(\\s|^)' + name + '(\\s|$)').test(el.className);
    };

    j.addClass = function(el, name) { 
      if (!j.hasClass(el, name)) {
        el.className += (el.className && ' ' || '') + name;
      }
    };

    j.removeClass = function(el, name) {
      if (j.hasClass(el, name)) {
        el.className = el.className
          .replace(new RegExp('(\\s|^)' + name + '(\\s|$)'), '')
          .replace(/^\s+|\s+$/g, '');
      }
    };





/**
 * https://github.com/component/path-to-regexp/blob/master/index.js

 * Normalize the given path string,
 * returning a regular expression.
 *
 * An empty array should be passed,
 * which will contain the placeholder
 * key names. For example "/user/:id" will
 * then contain ["id"].
 *
 * @param  {String|RegExp|Array} path
 * @param  {Array} keys
 * @param  {Object} options
 * @return {RegExp}
 * @api private
 */

    function pathtoRegexp(path, keys, options) {
      options = options || {};
      var strict = options.strict;
      var end = options.end !== false;
      var flags = options.sensitive ? '' : 'i';
      keys = keys || [];

      if (path instanceof RegExp) {
        return path;
      }

      if (Array.isArray(path)) {
        // Map array parts into regexps and return their source. We also pass
        // the same keys and options instance into every generation to get
        // consistent matching groups before we join the sources together.
        path = path.map(function (value) {
          return pathtoRegexp(value, keys, options).source;
        });

        return new RegExp('(?:' + path.join('|') + ')', flags);
      }

      path = ('^' + path + (strict ? '' : '/?'))
        .replace(/([\/\.\|])/g, '\\$1')
        .replace(/(\\\/)?(\\\.)?:(\w+)(\(.*?\))?(\*)?(\?)?/g, function(match, slash, format, key, capture, star, optional) {
          slash = slash || '';
          format = format || '';
          capture = capture || '([^\\/' + format + ']+?)';
          optional = optional || '';

          keys.push({ name: key, optional: !!optional });

          return '' +
            (optional ? '' : slash) +
            '(?:' +
            format + (optional ? slash : '') + capture +
            (star ? '((?:[\\/' + format + '].+?)?)' : '') +
            ')' +
            optional;
        })
        .replace(/\*/g, '(.*)');

      // If the path is non-ending, match until the end or a slash.
      path += (end ? '$' : (path[path.length - 1] === '/' ? '' : '(?=\\/|$)'));

      return new RegExp(path, flags);
    }

/*

Proxy mutable array methods

*/

    function ObservableArray(items, listener) {
      var _items, _listener;
      var method, mutableMethods = {
        pop: function() {
          var result = _items.pop();
          listener([{
            type: 'delete',
            name: _items.length,
            object: _items
          }]);
        },

        push: function(item) {

        }
      };

      function arr(i, val) {
        return (val === undefined) ?
          // Getter
          _items[i] :
          // Setter
          (_items[i] = val);
      }

      for (method in mutableMethods) {
        arr[method] = mutableMethods[method];
      }

      _items = items;
      return arr;
    }


    j.ObservableArray = ObservableArray;

/*

Initializes `obj.__these__` with factory function,
returning accessor functions for a given caller.

Accessor function is bound to `this` context when `obj` method is called.

Method can use the accessor function:


Get property value:

`this(prop)`


Get property value asynchonously:

`this(prop, function(value) {...})`


Set propety value:

`this(prop, newValue)`



Access parent context (returns accessor function):

`this('..')`


Access root context (returns accessor function):

`this('/')`


Get child context property:

`this(childContext)(childProperty)`


If current context is an Array, all standard props/methods are there:

`this.length`, `this.sort`, `this.splice`, etc



*/

    j.bind = function(obj, root, parent) {

      if (obj.__these__) return;

      var accessor = function(caller) {

        var that = function (prop, arg, refresh) {
          var i, len, result;

          // Init dependents
          if (!accessor.dependents[prop]) {
            accessor.dependents[prop] = [];
          }

          // Getter?
          if (arg === undefined || typeof arg === 'function') {

            // Parent context?
            if (prop === '..') {
              return obj.__these__.parent;
            }

            // Root context?
            if (prop === '/') {
              return obj.__these__.root;
            }

            // Update dependency tree
            if (caller && caller !== prop && accessor.dependents[prop].indexOf(caller) === -1) {
              accessor.dependents[prop].push(caller);
            }

            result = (typeof accessor.values[prop] === 'function') ?
              // Computed property. `arg` is a callback for async getters
              accessor.values[prop].call(that, arg) :
              // Static property (leaf in the dependency tree)
              accessor.values[prop];

            return typeof result === 'object' ?
              // Child context, wrap it
              (j.bind(result, obj.__these__.root, obj), result.__these__()) :
              // Simple value
              result;
          }

          else {

            // Setter?
            if (!refresh) {
              if (typeof accessor.values[prop] === 'function') {
                // Computed property
                accessor.values[prop].call(that, arg);
              }
              else {
                // Simple property. `arg` is the new value
                accessor.values[prop] = arg;
              }
            }

            // Alert dependents
            for (i = 0, len = accessor.dependents[prop].length; i < len; i++) {
              that(accessor.dependents[prop][i], undefined, true);
            }

            // Alert watchers
            if (accessor.watchers[prop]) {
              for (i = 0, len = accessor.watchers[prop].length; i < len; i++) {
                accessor.watchers[prop][i].call(that, arg);
              }
            }

          } // if getter

        }; // that function

        return that;
      };

      accessor.dependents = {};
      accessor.watchers = {};
      accessor.root = root || obj;
      accessor.parent = parent || null;
      accessor.values = {};

      // Proxy all properties with the accessor function
      Object.getOwnPropertyNames(obj).map(function(prop) {

        accessor.values[prop] = obj[prop];

        Object.defineProperty(obj, prop, {
          get: function() {
            return obj.__these__()(prop); 
          },
          set: function(val) {
            obj.__these__()(prop, val);
          }
        });

      });

      Object.defineProperty(obj, '__these__', { value: accessor });

    };


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


    function wrapTagsInHTMLComments(template, options) {
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
    }


    function matchEndBlock(block, template, options) {
      var match = template.match(
        RegExp(
          escapeRE(options.delimiters[0]) + 
          '\\/' + RE_SRC_IDENTIFIER + '?' +
          escapeRE(options.delimiters[1])
        )
      );
      return match ?
        block === '' || match[1] === undefined || match[1] === block :
        false;
    }

/*

### jtmpl.compile(template, model[, options[, openTag]])

Return documentFragment

*/

    j.compile = function (template, model, options, openTag) {

      var i, children, len, ai, alen, attr, val, buffer, pos, body, node, el, t, match, rule, token, block;
      var fragment = document.createDocumentFragment();

      options = options || defaultOptions;

      // Template can be a string or DOM structure
      if (template instanceof Node) {
        body = template;
      }
      else {
        template = wrapTagsInHTMLComments(template, options);

        body = document.createElement('body');
        body.innerHTML = template;
      }


      // Iterate child nodes.
      // Length is not precalculated (and for is used instead of map),
      // as it can mutate because of splitText()
      for (i = 0, children = body.childNodes, len = children.length ; i < len; i++) {

        node = children[i];

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
              t = tokenizer(options, 'g');

              while ( (match = t.exec(val)) ) {

                rule = matchRules(match[0], el, attr.name, model, options);

                if (rule && rule.react) {
                  // Call reactor on value change
                  j.watch(model, rule.prop, rule.react);
                  // Initial value
                  rule.react(model.__these__.values[rule.prop]);
                }

              }

            }

            // Recursively compile
            el.appendChild(j.compile(node, model, options));

            break;

          // Comment node
          case 8:
            if (matchEndBlock('', el.data, options)) {
              throw 'jtmpl: Unexpected ' + el.data;
            }

            if ( (match = el.data.match(tokenizer(options))) ) {

              rule = matchRules(el.data, match[1], null, model, options);
              if (rule) {

                // DOM replacement?
                if (rule.replace instanceof Node) {
                  el.parentNode.replaceChild(rule.replace, el);
                }

                // Fetch block tag contents?
                if (rule.block) {

                  block = document.createDocumentFragment();

                  for (i++;

                      (i < len) && 
                      !matchEndBlock(rule.block, children[i].data || '', options);

                      i++) {

                    block.appendChild(children[i].cloneNode(true));
                  }

                  if (i === len) {
                    throw 'jtmpl: Unclosed ' + el.data;
                  }
                  else {
                    el.parentNode.replaceChild(rule.replace(block, el.parentNode), el);
                  }
                }

                if (rule.react) {
                  // Call reactor on value change
                  j.watch(model, rule.prop, rule.react);
                  // Initial value
                  rule.react(model.__these__.values[rule.prop]);
                }
              }

            }
            break;

        } // switch

      } // for

      return fragment;
    };

/*

## watch(obj, prop, callback)

Notifies `callback` passing new value, when `obj[prop]` changes.

*/

    j.watch = function(obj, prop, callback) {
      var watchers;

      // All must be specified
      if (!(obj && prop && callback)) return;

      j.bind(obj);

      watchers = obj.__these__.watchers;

      // Init watchers
      if (!watchers[prop]) {
        watchers[prop] = [];
      }

      // Already registered?
      if (watchers[prop].indexOf(callback) === -1) {
        watchers[prop].push(callback);
      }
    };


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
          j.watch(model, tag, react);
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
        var react, result;
        
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
            result = document.createTextNode(model[tag] || '');

            return {
              prop: tag,
              replace: result,
              react: function(val) {
                result.data = val || '';
              }
            };

          }

        }
      }

    ];


/*

Requests API

*/

    j.xhr = function(args) {
      var i, len, prop, props, request;

      var xhr = new XMLHttpRequest();

      // Last function argument
      var callback = args.reduce(
        function (prev, curr) {
          return typeof curr === 'function' ? curr : prev;
        },
        null
      );

      var opts = args[args.length - 1];

      if (typeof opts !== 'object') {
        opts = {};
      }

      for (i = 0, props = Object.getOwnPropertyNames(opts), len = props.length;
          i < len; i++) {
        prop = props[i];
        xhr[prop] = opts[prop];
      }

      request =
        (typeof args[2] === 'string') ?

          // String parameters
          args[2] :

          (typeof args[2] === 'object') ?

            // Object parameters. Serialize to URI
            Object.keys(args[2]).map(
              function(x) {
                return x + '=' + encodeURIComponent(args[2][x]);
              } 
            ).join('&') :

            // No parameters
            '';

      xhr.onload = function(event) {
        var resp;

        if (callback) {
          try {
            resp = JSON.parse(this.responseText);
          }
          catch (e) {
            resp = this.responseText;
          }
          callback.call(this, resp, event);
        }
      };

      xhr.open(args[0], args[1],
        (opts.async !== undefined ? opts.async : true), 
        opts.user, opts.password);

      xhr.send(request);

    };


/*

Export for browser or node, end IIFE

*/

    typeof module === 'undefined'?
      root.jtmpl = j:
      exports = module.exports = j;
    })(this);