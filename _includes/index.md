{% raw %}

## What

JTmpl is an extensible, modular, functional reactive DOM templating engine.
It makes complex GUI development fun and insanely productive.
It's also simple conceptually, so you can pick it in very short time. [&raquo;](faq#what)


## Features


* Familiar [Mustache syntax](https://mustache.github.io/mustache.5.html).

* Automatic, context-based, bi-directional data-binding.
Never touch the DOM again: it's the result of your template + current model state. [&raquo;](faq#data-binding)

* 100% declarative, zero boilerplate. [&raquo;](faq#boilerplate)

* Plain JavaScript object model, CommonJS modules support. [&raquo;](faq#modules)

* Dynamic partials, requests, distributed applications. [&raquo;](faq#requests)

* Computed properties, automatic dependency tracking. [&raquo;](faq#freak)

* Plugin support, batteries included:

  * Event handling [&raquo;](faq#events)

  * Routes [&raquo;](faq#routes)

  * Validators [&raquo;](faq#validators)

* Plays nice with others: generated DOM is stable and only necessary parts are updated
synchronously with model updates.

* Lightweight.






## Example &nbsp;<select><option>Hello</option> <option>TodoMVC</option> </select>

###### result

```html

```

###### code

```html
<!DOCTYPE html>

<!--(1) Define your target(s)

    [data-jtmpl] elements are
    automatically processed.
    
    Supported template source formats:

  * "#element-id"
  * "url"
  * "url#element-id"
-->
<div data-jtmpl="#template">
  You can provide content for search engines 
  and JavaScript-less agents here.
</div>


<!--(2) Provide a template
    
    Template is usually linked to a data model.
    [data-model] format is the same as [data-jtmpl]
-->
<script id="template" 
  data-model="#model"
  type="text/template">

  <label>
    Greet goes to
    <input value="{{who}}">
  </label>
  <h3>Hello, {{who}}</h3>
</script>


<!--(3) The data model is a POJO.

    And optional. If you don't provide one,
    an empty model is implied.

    Literal JavaScript objects and CommonJS
    modules supported 
    (though require function is not provided, for now)
-->
<script id="model" type="text/model">
  {
    who: 'world'
  }
</script>


<!--(4) Just include JTmpl somewhere,
    it will take care of the rest
-->
<script src="build/jtmpl.js"></script>
```


{% endraw %}