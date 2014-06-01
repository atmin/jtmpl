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

### Store

Object-to-object map.

`store = new Store()`

#### get(object, proto)`

Returns associated object, initializes slot for `object`

`watchers = store.get(obj, { wathers: [] }).watchers`

#### release(object)

Releases the slot for `object` (if present).

`store.release(obj)`

*/

    function Store() {
      this.objs = [];
      this.store = [];
    }

    Store.prototype = {
      get: function(obj, proto) {
        var pos = this.objs.indexOf(obj);
        if (pos > -1) {
          return this.store[pos];
        }
        else {
          this.objs.push(obj);
          this.store.push(JSON.parse(JSON.stringify(proto || {})));
          return this.store[this.store.length - 1];
        }
      },

      release: function(obj) {
        var pos = this.objs.indexOf(obj);
        if (pos > -1) {
          this.objs.splice(pos, 1);
          this.store.splice(pos, 1);
        }
      }
    };


    j.store = new Store();

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

Returns a getter/setter function, which jtmpl binds to the `this` context.

Within a model handler, it's possible:


Get property value:

`this(prop)`


Get property value asynchonously:

`this(prop, function(value) {...})`


Set propety value:

`this(prop, newValue)`



Access parent context (returns getter/setter):

`this.parent`


Access root context (returns getter/setter):

`this.root`


Get child context property:

`this(childContext)(childProperty)`


If current context is an Array, all standard props/methods are there:

`this.length`, `this.sort`, `this.splice`, etc



*/

    j.bind = function(obj) {

      var dependents = {};
      var watchers = {};

      Object.defineProperty(obj, '__these__', {

        value: function(caller) {

          var that = function (prop, arg, refresh) {
            // Init dependents
            if (!dependents[prop]) {
              dependents[prop] = [];
            }

            // Getter?
            if (arg === undefined || typeof arg === 'function') {

              // Update dependency tree
              if (caller && dependents[prop].indexOf(caller) === -1) {
                dependents[prop].push(caller);
              }

              result = (typeof obj[prop] === 'function') ?
                // Computed property. `arg` is a callback for async getters
                obj[prop].call(that, arg) :
                // Static property (leaf in the dependency tree)
                obj[prop];

              return typeof result === 'object' ?
                // Child context, wrap it
                (j.bind(result), result.__these__(caller)) :
                // Simple value
                result;
            }

            else {

              // Setter?
              if (!refresh) {
                if (typeof obj[prop] === 'function') {
                  // Computed property
                  obj[prop].call(that, arg);
                }
                else {
                  // Simple property. `arg` is the new value
                  obj[prop] = arg;
                }
              }

              // Alert dependents
              for (i = 0, len = dependents[prop].length; i < len; i++) {
                that(dependents[prop][i], undefined, true);
              }

              // Alert watchers
              if (watchers[prop]) {
                for (i = 0, len = watchers[prop].length; i < len; i++) {
                  watchers[prop][i].call(that, arg);
                }
              }

            } // if getter

          }; // that function

          that.root = null;

          return that;
        }

      });

    };


    var getsetFactory = j.getsetFactory = function(obj, caller) {
      var slot = register(obj);

      function that(prop, arg, refresh) {
        var i, len, result, root;

        if (!slot.dependents[prop]) {
          // Init dependents
          slot.dependents[prop] = [];
        }

        // Getter?
        if (arg === undefined || typeof arg === 'function') {

          // Update dependency tree
          if (caller && slot.dependents[prop].indexOf(caller) === -1) {
            slot.dependents[prop].push(caller);
          }

          result = (typeof obj[prop] === 'function') ?
            // Computed property. `arg` is a callback for async getters
            obj[prop].call(that, arg) :
            // Static property (leaf in the dependency tree)
            obj[prop];

          return typeof result === 'object' ?
            // Child context, wrap it
            getsetFactory(result) :
            // Simple value
            result;
        }

        else {

          // Setter?
          if (!refresh) {
            if (typeof obj[prop] === 'function') {
              // Computed property
              obj[prop].call(that, arg);
            }
            else {
              // Simple property. `arg` is the new value
              obj[prop] = arg;
            }
          }

          // Alert dependents
          for (i = 0, len = slot.dependents[prop].length; i < len; i++) {
            that(slot.dependents[prop][i], undefined, true);
          }

          // Alert watchers
          if (slot.watchers[prop]) {
            for (i = 0, len = slot.watchers[prop].length; i < len; i++) {
              slot.watchers[prop][i].call(that, arg);
            }
          }

        } // if getter

      } // that

      that.parent = slot.parent ? getsetFactory(slot.parent) : null;

      // Find root context
      root = that.parent;
      while (root) {
        that.root = root;
        root = root.parent;
      }

      return that;
    };



    function register(obj) {
      var slot = j.store.get(obj, bookkeepingProto);
      var prop, childSlot;

      // Register child contexts
      if (!slot.initialized) {
        slot.initialized = true;

        for (prop in obj) {
          if (obj.hasOwnProperty(prop) && typeof obj[prop] === 'object') {
            childSlot = j.store.get(obj[prop], bookkeepingProto);
            childSlot.parent = obj;
            register(obj[prop]);
          }
        }
      }

      return slot;
    }


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

/*

## watch(obj, prop, callback)

Notifies `callback` passing new value, when `obj[prop]` changes.

*/

    j.watch = function(obj, prop, callback) {
      var watchers;

      // All must be specified
      if (!(obj && prop && callback)) return;

      watchers = j.store.get(obj, bookkeepingProto).watchers;

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

     {
       // Replace tag in generated content, default - ''
       replace: 'replacement'

       // Set new context, default - original model
       model: set_new_context_object

       // Parse until {{/tagName}} ...
       block: 'tagName'
       // ... then call this function with the extracted template
       callback: function continuation(template) ...
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
        
        if (match) {

          console.log(match);

          return {
            replace: document.createTextNode('.'),
            block: match[1],
            callback: function(template) {

            }
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