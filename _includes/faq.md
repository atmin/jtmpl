{% raw %}

## Frequently Asked Questions





### Why another framework?

I didn't find an existing one, that implements well the concept of a templating engine,
that updates its result continuously and predictably as data model evolves, 
thus completely automating the most error-prone process in GUI development: 
managing state.




### Is it used in production?

Not yet. And tests currently are not very comprehensive. However, the codebase is quite small
and written in a modular way. There were two prototype versions and I consider the API and behavior now stable, hence the 1.0.0 release.




<h3 id="data-binding"> How is data-binding handled?</h3>

`jtmpl` operates on the DOM level. For each Mustache tag, it figures out how data model changes can affect the DOM and vice-versa, and registers reactors and event listeners, which keep data and view synchronized at all times.




<h3 id="boilerplate"> How to use it?</h3>

Define a target element, a template source, an optional model source via `data-` attributes and include `jtmpl` somewhere in your page. Template source is Mustache + HTML, model is a plain JavaScript object.

Template describes the _what_ of your application, Mustache tags serve much like instructions in a functional language.

Model describes the _how_ of the data fields by simple values or functions for dynamic behavior.

`jtmpl` is the glue and doesn't get into your way. It's just a natural generalization of the 
Mustache templating engine into the web applications realm.

Example: [Hello](/#hello)




### How do the model functions refer to model itself?

Traditionally, object methods refer to properties and other methods via the `this`
context, like `this.foo`. `jtmpl` takes a functional approach: `this` is the current
context accessor function, so `this('foo')` returns `foo` value and `this('foo', 'bar')`
sets it to "bar". It works recursively all the way down, so `this('nestedContext')('deeperNestedContext')('someProperty')` would be equivalent to traditional
`this.nestedContext.deeperNestedContext.someProperty`. You have access to parent and
root contexts, too.

This allows interesting possibilities:

```js
{
  prop: 'a simple property',

  getProp: function() {
    // A computed property.
    // Dependency graph is constructed automatically,
    // so when `prop` changes, `getProp` change
    // listeners will be notified, too
    return this('prop');
  },

  getPropAsync: function(callback) {
    // Functional properties can be asynchronous
    var that = this;
    setTimeout(function() {
      return that('prop');
    });
  },

  setProp: function(newValue) {
    // And they can also be setters
    // `newValue` can be anything, but a function
    // (so it's distinguished from async get)
    this('prop', newValue);
  },

  propPlusProp: function() {
    // Simple and computed properties are
    // treated the same way
    return this('prop') + this('getProp');
  }
}
```

Interested only on this part? It's a separate project:
[Freak](https://github.com/atmin/freak),
functional reactive object wrapper.





### How do I structure my application?

Use partials. Unlike Mustache, you have the option to attach a data object to any partial (via the `data-model` attribute of the container tag). When partial is included, current context inherits partial's context, so partials serve as components. There's no difference between
the program and a partial, a component can serve both roles.




### Tell me more about partials

Partials can be static (provide string literal as source) or dynamic (variable source, partial is reloaded on change). Partials can be referenced by id, loaded from an URL or referenced by id from external document.

You can go low-level and construct HTML yourself, too, just use the triple Mustache tag to
output an unescaped var.








{% endraw %}
