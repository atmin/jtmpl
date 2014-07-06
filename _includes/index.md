{% raw %}



## Features


* Familiar [Mustache](https://mustache.github.io/) syntax

* Automatic, context-based data-binding

* Plain JavaScript object model

* Event handling

* Computed properties

* Routes

* Requests

* Distributed applications

* 100% declarative, zero boilerplate

* Lightweight

[Tell me more...](/features)




## Example &nbsp;<select><option>Hello</option> <option>TodoMVC</option> </select>

###### iframe

```html

```

###### code

```html
<!DOCTYPE html>

<div
  data-template="#template"
  data-model="#model">
</div>

<template id="template">
  <label>
    Greet goes to
    <input value="{{who}}">
  </label>
  <h3>Hello, {{who}}</h3>
</template>

<script id="model" type="text/model">
  {
    who: 'world'
  }
</script>

<script src="build/jtmpl.js"></script>
```


{% endraw %}