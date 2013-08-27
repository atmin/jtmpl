_`{{`_ `jtmpl` _`}}`_
=====================

#### Humanistic JavaScript MV framework



<br>
 _Code is work in progress (`Stage1` is mostly finished), feel free to explore concept_


What
----

`jtmpl` is a DOM-aware templating engine. It renders a [Mustache](http://mustache.github.io) HTML template using a `model` object and infers bindings from template structure, so when `model` changes DOM is updated accordingly and vice versa. 

There's never need to touch the DOM directly, `model` is the [single source of truth](http://en.wikipedia.org/wiki/Single_Source_of_Truth)

Other JavaScript MV* frameworks require you either:

* explicitly specify (via code or DOM element attributes) how to do the binding

* build DOM via code :(

`jtmpl` provides you _live_ templates that just work.



Why
---

* embrace [KISS](http://en.wikipedia.org/wiki/Keep_it_simple) and [DRY](http://en.wikipedia.org/wiki/Don't_repeat_yourself)

* write least amount of code possible

* ideas by humans, automation by computers



How
---

1. Compile template using a `model` object into a valid HTML string (with added metadata)

	`Stage1` can be processed server-side or browser-side

2. Using `Stage1` output generate DOM and bind elements properties to `model` properties 




Hello, world
------------

* `Stage1` is a template compiler
	
		> jtmpl('Hello, {{who}}', { who: 'server' })

		Hello, <span data-jt="who">server</span>



* `Stage2` is a [MV(C)](http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) framework for the browser

		<!-- View -->
		<script id="jtmpl" data-model="model" type="text/html">
			Hello, {{who}}
			<button onclick={{click}}>{{buttonText}}</button>
		</script>

		<!-- Model (View is controlled implicitly) -->
		<script>
			model = {
				who: 'browser',
				buttonText: 'Shout',
				click: function() {
					with (this) {
						if (who == 'browser') {
							who = 'BROWSER'; 
							buttonText = 'Keep quiet';
						}
						else {
							who = 'browser'; 
							buttonText = 'Shout again';
						} 
					}
				}
			}
		</script>

		<!-- that's all -->
		<script src="js/jtmpl.min.js"></script>

    * _or, to invoke manually:_ `jtmpl('#target-id', 'template contents or "#template-id"', model)` 

    * _template contents can be already prerendered by server to save the client some processing and help for SEO_



Specifications
--------------

* based on [Object.observe](http://updates.html5rocks.com/2012/11/Respond-to-change-with-Object-observe)

* no dependencies, [polyfill](https://github.com/jdarling/Object.observe) built-in

* Firefox, Chrome, Opera, IE 9 (IE8 requires Array.map polyfill)



Downloads
---------

* [jtmpl.coffee](https://github.com/atmin/jtmpl/blob/dev/src/coffee/jtmpl.coffee)

* [jtmpl.js](js/jtmpl.js)

* [jtmpl.min.js](js/jtmpl.min.js)




Details
--------

### Template specifics

* limitation by design is the contents of each [section](http://mustache.github.io/mustache.5.html) must be valid structural HTML, you cannot freely mix Mustache and HTML tags

* variables are automatically enclosed in a `<span>` if they aren't HTML tag contents already

* similarly, sections are automatically enclosed in a `<div>` if needed

* and the same goes for section items

* `data-jt` attributes containing metadata for `Stage2` are injected in HTML elements

* `Stage1` also emits section structures (with changed delimiters) embedded in HTML comments

* partials are not currently supported, plans are to support id-based and URL-based partials


### Interpretation of patterns

* `<tag>{{var}}</tag>`&mdash;Whenever `var` changes, `tag.innerHTML` changes

* `<tag prop="{{var}}"`&mdash;If `var` is null property is absent, otherwise equals `var`

* `<tag prop="{{bool_var}}"`&mdash;If `bool_var` is true property is present, otherwise absent

* `<tag class="{{class-name}} other-classes">`&mdash;`class-name` is expected to be boolean indicating if `tag` currently has this class

* `<tag value="{{var}}">`&mdash;When `var` changes `tag.value` changes and vice versa

* `<tag><!-- {{var}} --></tag>`&mdash;HTML comment is stripped when it contains one Mustache tag. This allows you to build easily templates that are valid HTML

* `<tag onevent="{{handler}}">`&mdash;`on`-prefixed properties are event handlers. `handler` is expected to be a function, `this` is the `model`. No need to add `onchange` handlers, they are already handled

* `<tag> {{#section}}...{{/section}} </tag>`&mdash;Whenever `section[i]` changes corresponding HTML element changes (you can insert or delete items via `Array.splice()` and only affected DOM elements are updated). There are no restrictions on the nesting level.



Kitchen Sink
------------

Showcase of all features, tests

[Link to example](kitchensink.html)

	$ kitchensink.html

	<!doctype html>
	<html>
	<head>
		<link rel="stylesheet" type="text/css" href="css/baseline.css">
		<link rel="stylesheet" type="text/css" href="css/qunit.css">
		<style>
			h2, h3 {margin-top: 64px}
			body {padding: 1% 7%; color:#586e75}
		</style>
		<script src="js/qunit.js"></script>
	</head>

	<body>
		<div id="jtmpl" data-model="model">

			<h1>Kitchen Sink</h1>
			<h2>Feature explorer</h2>
			<a href=#qunit>Tests</a>
			<p>
				Feel free to modify <code>model</code> from JS console and observe changes.
			</p>

			<h3>Collection&mdash;<code>model.collection</code></h3>
			<ul class="dummy-class just for the_test">
				{{#collection}}
				<li>type: <code>{{type}}</code>, value: <code>{{value}}</code></li>
				{{/collection}}
				{{^collection}}
				<li>&lt; empty &gt;</li>
				{{/collection}}
			</ul>
			<button onclick={{add}}>Add random</button>
			<button onclick="{{remove}}" disabled={{removeDisabled}}>Remove last</button>

			<h3>Toggle text&mdash;<code>model.text</code></h3>
			<a href="#" onclick='{{toggle}}'>Toggle</a>
			<p>
				{{text}}
			</p>

			<h3>innerHTML&mdash;<code>model.innerHTML</code></h3>
			<div><!-- {{{innerHTML}}} --></div>
			<!-- `jtmpl` accepts tags in HTML comments and automatically strips them -->

			<h3>Data binding&mdash;<code>model.field</code></h3>
			<label for="field">Enter something</label> <input id="field" value={{field}}>
			<p>
				{{#field}}
				You entered "{{field}}". Delete it and this message will disappear
				{{/field}}
			</p>

			<h3>Data binding, toggle class&mdash;<code>model.field</code></h3>
			<div>
				<a href=# class="existing-class {{bound-class}}">Toggle me</a>
			</div>

			<h3>Checkboxes&mdash;<code>model.checkboxes</code></h3>
			{{#checkboxes}}
				<label><input type="checkbox" checked={{fooCheck}}> check foo</label>
				<label><input type="checkbox" checked={{barCheck}}> check bar</label>
			{{/checkboxes}}

			<h3>Select&mdash;<code>model.options</code></h3>
			<select>
				{{#options}}
				<option selected={{checked}}>{{text}}</option>
				{{/options}}
			</select>

			<h3>Radio group&mdash;<code>model.options</code></h3>
			<div>
				{{#options}}
				<label><input type="radio" name="radio-group" checked={{checked}}>{{text}}</label>
				{{/options}}
			</div>
		</div>

		<script>
			model = {
				text: 'lowercase',

				collection: [
					{
						type: 'string',
						value: 'foobar'
					},
					{
						type: 'int',
						value: 1
					},
					{
						type: 'float',
						value: 0.42
					},
					{
						type: 'boolean',
						value: true
					}
				],

				removeDisabled: false,

				field: '',

				innerHTML: '<p>Hi, how are you?</p>',

				options: [
					{
						checked: true,
						text: 'one' 
					},
					{
						checked: false,
						text: 'two'
					},
					{
						checked: false,
						text: 'three'
					}
				],

				checkboxes: {
					fooCheck: true,
					barCheck: false
				},


				// event handlers
				toggle: function() {
					this.text = this.text == 'lowercase' ?
						'UPPERCASE': 'lowercase';
				},
				add: function() {
					this.collection.push({
						type: 'float',
						value: Math.random()
					});
				},
				remove: function() {
					this.collection.pop();
					this.removeDisabled = this.collection.length == 0;
				}
			};
		</script>
		<script src="js/jtmpl.js"></script>
		<!-- hey, this next line is temporarily here, it's work in progress, remember? :) -->
		<script>jtmpl('#jtmpl', '#jtmpl', model)</script>

		<h2>QUnit Blackbox Tests</h2>
		<div id="qunit"></div>
		<div id="qunit-fixture"></div>
		<script src="js/tests.js"></script>
	</body>
	</html>
