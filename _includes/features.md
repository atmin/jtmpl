{% raw %}


## Feature breakdown

###### Templates use Mustache syntax

```html
<h3>Random Numbers</h3>

<ul>
{{#numbers}}
  <li>{{.}}</li>
{{/numbers}}
</ul>

<!-- Totals -->
<div>{{numbers.length}} number(s) in collection</div>

<button class="action-push">Push</button>
<button class="action-pop">Pop</button>

<!-- Sorted -->
<!-- ... -->
```

[Variables, sections, inverted sections and partials](https://mustache.github.io/mustache.5.html) are supported. Bindings are inferred from template structure,
so you don't declare anything (automatic [MVVM](https://en.wikipedia.org/wiki/Model_View_ViewModel#Pattern_description)).


###### Your model is a POJO

```js
{
  // Event map
  // ...

  // Array property
  items: [],

  // Computed property
  // ...
}
```

No framework-specific code needed.


###### Events

```js
{
  // Event map
  __on__: {

    // Selector map
    click: {

      '.action-push': function() {
        this('items')
          .push(
            Math.ceil(
              Math.random() * 100
            )
          );
      },

      '.action-pop': function() {
        this('items').pop();
      }

    } // end selector map

    // more event types ...
  },

  ...
}
```

Delegate events via an event map. Each event type is a selector:handler map. It's akin to [JQuery event delegation](https://learn.jquery.com/events/event-delegation/).


###### Computed properties

```html
<!-- Sorted -->
<h3>Sorted Random Numbers</h3>

<ul>
{{#sorted}}
  <li>{{.}}</li>
{{/sorted}}
</ul>
```

```js
{
  ...

  // Computed property
  sorted: function() {
    var copy = this('items').values.slice();
    copy.sort();
    return copy;
  }  
}
```

You can declare properties as functions. `this` context 
is an [accessor function](https://github.com/atmin/freak) which you use
to refer to other model properties. Dependency graph is constructed
implicitly, so whenever a model property changes, all dependencies
are recalculated automatically.

###### All together now

iframe

```html

```

code

```html
<!DOCTYPE html>

<section
  data-template="#app"
  data-model="#model">
  
  Static, indexable content to be replaced by jtmpl on page ready.

  All HTML tags having data-template and data-model attributes are automatically processed as targets.

</section>

<!-- script type="text/template" or any other tag can be used, as well -->
<template id="app">  
  <h3>Random Numbers</h3>

  <ul>
  {{#numbers}}
    <li>{{.}}</li>
  {{/numbers}}
  </ul>

  <h5>{{popped}}</h5>

  <div>Total: {{numbers.length}} number(s)</div>

  <button class="action-push">Push</button>
  <button class="action-pop">Pop</button>

  <!-- Sorted -->
  <h3>Sorted Random Numbers</h3>

  <ul>
  {{#sorted}}
    <li>{{.}}</li>
  {{/sorted}}
  </ul>
</template>

<script id="model">
  {
    // Event map
    __on__: {

      // Selector map
      click: {

        '.action-push': function() {
          // `this` is the accessor function
          // of the context where event occured

          // Get property 'items'
          this('items')
            .push(
              Math.ceil(
                Math.random() * 100
              )
            );
        },

        '.action-pop': function() {
          // Set property 'popped'
          this('popped', this('items').pop());
        }
      }
    },

    // Array property
    items: [],

    // Computed property
    sorted: function() {
      var copy = this('items').values.slice();
      copy.sort();
      return copy;
    }  
  }
</script>

<script src="build/jtmpl.js"></script>
```

Application is bootstrapped into a target tag (`<section>`)
from:

* `data-template` is the template source: "#element-id", "//url" or "//url#element-id"

* `data-model` is the model source, same format as former, contents can be object literal or a [CommonJS module](http://dailyjs.com/2010/10/18/modules/).




###### Routes

```js
{
  __routes__: {
    ''
  }
}
```

Another [dunder](https://wiki.python.org/moin/DunderAlias) property is `__routes__`,
a map of strings.



###### Requests



###### Distributed applications



{% endraw %}
