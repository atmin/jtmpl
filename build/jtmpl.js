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
    var RE_PIPE = /^[\w\.\-]+(?:\|[\w\.\-]+)?$/;
    var RE_NODE_ID = /^#[\w\.\-]+$/;
    var RE_ANYTHING = '[\\s\\S]*?';
    var RE_SPACE = '\\s*';


/*

## Functional utilities, courtesy of [bilby.js](https://github.com/puffnfresh/bilby.js)

*/


/*

### singleton(k, v)

Creates a new single object using `k` as the key and `v` as the
value. Useful for creating arbitrary keyed objects without
mutation:

singleton(['Hello', 'world'].join(' '), 42) == {'Hello world': 42}

*/

    function singleton(k, v) {
      var o = {};
      o[k] = v;
      return o;
    }


/*

### extend(a, b)

Right-biased key-value concat of objects `a` and `b`:

extend({a: 1, b: 2}, {b: true, c: false}) == {a: 1, b: true, c: false}

*/

    function extend(a, b) {
      var o = {};
      var i;

      for (i in a) {
        o[i] = a[i];
      }

      for (i in b) {
        o[i] = b[i];
      }

      return o;
    }



/*

### compose(f, g)

Creates a new function that applies `f` to the result of `g` of the
input argument:

  forall f g x. compose(f, g)(x) == f(g(x))

*/

    function compose(f, g) {
      return function() {
        return f(g.apply(this, [].slice.call(arguments)));
      };
    }



/*

### getInstance(self, constructor)

Always returns an instance of constructor.

Returns self if it is an instanceof constructor, otherwise
constructs an object with the correct prototype.

*/

    function getInstance(self, ctor) {
      return self instanceof ctor ? self : Object.create(ctor.prototype);
    }


/*
  
## Lenses

Lenses allow immutable updating of nested data structures.



### store(setter, getter)

A `store` is a combined getter and setter that can be composed with
other stores.

*/

    function store(setter, getter) {
      var self = getInstance(this, store);
      self.setter = setter;
      self.getter = getter;
      self.map = function(f) {
        return store(compose(f, setter), getter);
      };
      return self;
    }



/*

### lens(f)

A total `lens` takes a function, `f`, which itself takes a value
and returns a `store`.

* run(x) - gets the lens' `store` from `x`

* compose(l) - lens composition

*/

    function lens(f) {
      var self = getInstance(this, lens);

      self.run = function(x) {
        return f(x);
      };

      self.compose = function(l) {
        var t = this;
        return lens(function(x) {
          var ls = l.run(x);
          var ts = t.run(ls.getter);

          return store(
            compose(ls.setter, ts.setter),
            ts.getter
          );
        });
      };

      return self;
    }



/*

### objectLens(k)

Creates a total `lens` over an object for the `k` key.

*/

    function objectLens(k) {
      return lens(function(o) {
        return store(function(v) {
          return extend(
            o,
            singleton(k, v)
          );
        }, o[k]);
      });
    }






/*

### jtmpl.addChangeListener(obj, prop, listener)

*/

    j.addChangeListener = function (obj, prop, listener) {

    };


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
          this.store.push(proto || {});
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

/*

*/

    var store = new Store();
    var getsetFactory;

    j.getsetFactory = getsetFactory = function(obj, caller) {
      var proto = {
        dependents: {},
        watchers: {}
      };

      function that(prop, arg, refresh) {
        var slot = store.get(obj, proto);
        var i, len;

        if (!slot.dependents[prop]) {
          // Init dependents
          slot.dependents[prop] = [];
        }

        // Getter?
        if (arg === undefined || typeof arg === 'function') {

          // Update dependency graph
          if (slot.dependents[prop].indexOf(caller) === -1) {
            slot.dependents[prop].push(caller);
          }

          return (typeof obj[prop] === 'function') ?
            // Computed property. `arg` is a callback for async getters
            obj[prop].call(that, arg) :
            // Simple property
            obj[prop];
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

      return that;
    };


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

/*

## Rules

Each rule is a function, args passed (tag, node, attr, model, options)

It MUST return either:

* falsy value - no match

* object - match found, return (all fields optional)

     {
       // Replace tag in generated content, default - ''
       replace: 'replacement'

       // Transformed model, default - original model
       model: set_new_context_object

       // Parse until {{/tagName}} ...
       block: 'tagName'
       // ... then call this function with the extracted template
       callback: function continuation(template) ...
     }

*/

    j.rules = [


/*

### {{var}}

*/

      function (tag, node, attr, model, options) {
        var match = tag.match(RE_IDENTIFIER);
        
        if (match) return {
          replace: model[tag]
        };
      }

    ];


/*

Export for browser or node, end IIFE

*/

    typeof module === 'undefined'?
      root.jtmpl = j:
      exports = module.exports = j;
    })(this);