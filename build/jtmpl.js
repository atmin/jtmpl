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
        return j.compile.call(null, args);
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

## Compiler

*/
    
    function tokenize(s, options) {
      var seq = s.split(options.delimiters[0]);
    }


    function escapeRE(s) {
      return  (s + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
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

    j.compile = function (template, model, openTag) {

      var body;
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

      // Iterate child nodes
      [].slice.call(body.childNodes).map(
        
        function (node) {
          var el, match;

          // Clone node and attributes only
          el = node.cloneNode(false);

          // Element node?
          if (node.nodeType === 1) {

            // Check attributes
            [].slice.call(el.attributes).map(
              function (attr) {
                console.log(attr.name + '=' + attr.value);
              }
            );

            // Recursively compile
            el.appendChild(j.compile(node, model));
          }

          // Text node
          if (node.nodeType === 3 && 
              (match = node.data.match(/\{\{(\w+)\}\}/))) {

            el.data = model[match[1]] || '';
          }

          fragment.appendChild(el);
        }
      );

      return fragment;
    };

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

## Rules

Each rule is a function, args passed (tag, node, attr, model, options)

It MUST return either:

* falsy value - no match

* object - match found, return 

     {
       replace: "string to replace"
       model: set_new_context_object
     }

*/

    j.rules = [


/*

### {{var}}

*/

      function (tag, node, attr, model, options) {
        var match = tag.match(RE_IDENTIFIER);
        if (match) {
          return model;
        }
      }

    ];


/*

Export for browser or node, end IIFE

*/

    typeof module === 'undefined'?
      root.jtmpl = j:
      exports = module.exports = j;
    })(this);