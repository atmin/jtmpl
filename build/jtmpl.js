/*

# jtmpl 0.4.0

&copy;Copyright Atanas Minev 2013-2014, MIT licence


IIFE begin, strict mode

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


/*
  
Default options

*/
    
    var defaultOptions = {
      delimiters: ['{{', '}}']
    };


/*

### identity(a)

*/

  j.identity = function(a) {
    return a;
  };



/*

### isDefined(a)

*/

  j.isDefined = function(a) {
    return a !== null && a !== undefined;
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





/*

https://github.com/component/path-to-regexp/blob/master/index.js

Normalize the given path string, returning a regular expression.

An empty array should be passed, which will contain the placeholder
key names. For example "/user/:id" will then contain ["id"].

@param  {String|RegExp|Array} path
@param  {Array} keys
@param  {Object} options
@return {RegExp}
@api private

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
          match.index = i;
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

      var i, children, len, ai, alen, attr, val, ruleVal, buffer, pos, beginPos, bodyBeginPos, body, node, el, t, match, rule, token, block;
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

      // Initialize dunder function
      j.bind(model);

      // Iterate child nodes.
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

                if (rule) {

                  if (rule.block) {

                    block = match[0];
                    beginPos = match.index;
                    bodyBeginPos = match.index + match[0].length;

                    // Find closing tag
                    for (;
                        match &&
                        !matchEndBlock(rule.block, match[0], options);
                        match = t.exec(val));

                    if (!match) {
                      throw 'Unclosed' + block;
                    }
                    else {
                      // Replace full block tag body with rule contents
                      attr.value = 
                        attr.value.slice(0, beginPos) +
                        rule.replace(attr.value.slice(bodyBeginPos, match.index)) +
                        attr.value.slice(match.index + match[0].length);
                    }
                  }

                  if (rule.react && typeof model === 'object' && model.__) {
                    // Call reactor on value change
                    j.watch(model, rule.prop, rule.react, rule.arrayReact || null, rule.prop + i + '.' + ai);
                    // Initial value
                    ruleVal = model.__(rule.prop, rule.react);
                    if (ruleVal !== undefined) {
                      rule.react(ruleVal);
                    }
                  }

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
                    // Replace `el` with `rule.replace()` result
                    el.parentNode.replaceChild(rule.replace(block, el.parentNode), el);
                  }
                }

                if (rule.react) {
                  // Call reactor on value change
                  j.watch(model, rule.prop, rule.react, rule.arrayReact || null, rule.prop + i);
                  // Initial value
                  ruleVal = model.__(rule.prop, rule.react);
                  if (ruleVal !== undefined) {
                    rule.react(ruleVal);
                  }
                }
              }

            }
            break;

        } // switch

      } // for

      return fragment;
    };

/*

Initialize `obj.__`.

Dunder function is bound to `this` context when `obj` method is called.

Uses of the dunder function:


Get property value:

`this(prop)`


Get property value asynchonously:

`this(prop, function(value) {...})`


Set propety value:

`this(prop, newValueNonFunction)`



Access current context (returns non-function value):

`this('.')`


Access parent context (returns dunder function):

`this('..')`


Access root context (returns dunder function):

`this('/')`


Get child context property:

`this('childContext')('childProperty')`


If current context is an Array, all standard props/methods are there:

`this.length`, `this.sort`, `this.splice`, etc



*/

    j.bind = function(obj, root, parent) {

      var method, mutableMethods, values;

      // Guard
      if (typeof obj !== 'object' || obj.__) return;

      // The dunder function, `obj.__`
      var dunder = function(prop, arg, refresh, formatter, mapping) {

        var i, len, result, val;

        var getter = function(prop) {
          var result = obj.__.values[prop];
          return formatter(
            typeof result === 'function' ?
              result.call(getter) : 
              result
          );
        };

        var dependencyTracker = function(propToReturn) {
          // Update dependency tree
          if (obj.__.dependents[propToReturn].indexOf(prop) === -1) {
            obj.__.dependents[propToReturn].push(prop);
          }
          return getter(propToReturn);
        };

        formatter = formatter || j.identity;

        // Init dependents
        if (!dunder.dependents[prop]) {
          dunder.dependents[prop] = [];
        }

        // Getter?
        if ((arg === undefined || typeof arg === 'function') && !refresh) {

          // {{.}}
          if (prop === '.') {
            return formatter(model);
          }

          // Parent context?
          if (prop === '..') {
            return obj.__.parent.__;
          }

          // Root context?
          if (prop === '/') {
            return obj.__.root.__;
          }

          val = obj.__.values[prop];

          result = (typeof val === 'function') ?
            // Computed property
            val.call(dependencyTracker) :
            // Static property (leaf in the dependency tree)
            val;

          return Array.isArray(result) ?
            // Collection
            typeof mapping === 'function' ?
              // Mapping provided, map, then filter not defined values
              result.map(mapping).filter(j.isDefined) :
              // No mapping
              result :

            // Single value
            formatter(result);          
        }

        else {

          // Setter?
          if (!refresh) {
            if (typeof dunder.values[prop] === 'function') {
              // Computed property
              dunder.values[prop].call(obj.__, arg);
            }
            else {
              // Simple property. `arg` is the new value
              dunder.values[prop] = arg;
            }
          }

          // Alert dependents
          for (i = 0, len = dunder.dependents[prop].length; i < len; i++) {
            obj.__(dunder.dependents[prop][i], arg, true);
          }

          // Alert watchers
          if (dunder.watchers[prop]) {
            for (i = 0, len = dunder.watchers[prop].length; i < len; i++) {
              dunder.watchers[prop][i](obj.__(prop));
            }
          }

        } // if getter
      }; // dunder

      dunder.dependents = {};
      dunder.watchers = {};
      dunder.arrayWatchers = {};
      dunder.root = root || obj;
      dunder.parent = parent || null;
      dunder.values = typeof obj === 'object' ? {} : [];
      dunder.bound = {};

      // Proxy all properties with the dunder function
      Object.getOwnPropertyNames(obj).map(function(prop) {

        dunder.values[prop] = obj[prop];

        Object.defineProperty(obj, prop, {
          get: function() {
            // return j.get(obj, prop);
            return obj.__(prop); 
          },
          set: function(val) {
            obj.__(prop, val);
          }
        });

      });

      if (Array.isArray(obj)) {

        // Proxy mutable array methods

        values = obj.__.values;

        mutableMethods = {

          pop: function() {
            var result = values.pop();
            listener([{
              type: 'delete',
              name: values.length,
              object: values
            }]);
          },

          push: function(item) {

          }
        };

        for (method in mutableMethods) {
          dunder[method] = obj[method] = mutableMethods[method];
        }
      }

      Object.defineProperty(obj, '__', { value: dunder });

    };


/*

## watch(obj, prop, callback)

Notifies `callback` passing new value, when `obj[prop]` changes.

*/

    j.watch = function(obj, prop, callback, arrayCallback, key) {
      var watchers, arrayWatchers;
    
      // Must be specified
      if (!(obj && prop && callback) ||
          typeof obj !== 'object') return;

      // Already bound?
      if (key && obj.__ && obj.__.bound[key]) return;

      j.bind(obj);

      // Mark bound
      if (key) {
        obj.__.bound[key] = true;
      }

      watchers = obj.__.watchers;

      // Init watchers
      if (!watchers[prop]) {
        watchers[prop] = [];
      }

      // Already registered?
      if (watchers[prop].indexOf(callback) === -1) {
        watchers[prop].push(callback);
      }

      //
      if (arrayCallback) {
        arrayWatchers = obj.__.arrayWatchers;

        // Init watchers
        if (!arrayWatchers[prop]) {
          arrayWatchers[prop] = [];
        }

        // Already registered?
        if (arrayWatchers[prop].indexOf(arrayCallback) === -1) {
          arrayWatchers[prop].push(arrayCallback);
        }
      }
    };


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

            arrayReact: function(changes) {
              console.log(changes);
            }
            
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







    j.loadModel = function(body) {
      var result;
      return (body.match(/^\s*{.*}\s*$/)) ?
        // Literal
        eval('result=' + body) :
        // CommonJS module
        new Function('module', 'exports', body + ';return module.exports;')({}, {});
    };

    // evalCJS=function(b){return new Function('module','exports',b+';return module.exports')({})}

/*

Export for browser or node, end IIFE

*/

    typeof module === 'undefined'?
      root.jtmpl = j:
      exports = module.exports = j;
    })(this);