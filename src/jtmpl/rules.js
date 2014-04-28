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
