# jtmpl [![Build Status](https://travis-ci.org/atmin/jtmpl.svg?branch=master)](https://travis-ci.org/atmin/jtmpl)

Extensible, modular, functional-reactive DOM template engine.

[![Sauce Test Status](https://saucelabs.com/browser-matrix/atmin.svg)](https://saucelabs.com/u/atmin)

Check official site for more information: [jtmpl.com](http://jtmpl.com)

## Quick start:

```bash
# Install via Bower
bower install jtmpl
```

or

```bash
# Install via NPM
npm install jtmpl-js
```

or

```html
<!-- Use it via unofficial CDN -->
<script src="https://cdn.rawgit.com/atmin/jtmpl/v1.1.0/jtmpl.min.js"></script>
```

## Hello, jtmpl

```html
<!DOCTYPE html>

<!-- (1) Target, references template -->
<div id="target" data-jtmpl="#template"></div>

<!-- (2) Template, references model -->
<script id="template" data-model="#model" type="text/template">
  <label>
    Greet goes to
    <input value="{{who}}">
  </label>
  <h3>Hello, {{who}}</h3>
</script>

<!--(3) Data model -->
<script id="model" type="text/model">
  {
    who: 'world'
  }
</script>

<!--(4) Include jtmpl -->
<script src="https://cdn.rawgit.com/atmin/jtmpl/v1.1.0/jtmpl.min.js"></script>
```
