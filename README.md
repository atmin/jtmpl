_`{{`_ `jtmpl` _`}}`_
=====================

#### Humanistic JavaScript MV framework

<br>
 _Code is work in progress, feel free to explore concept_

Why
---

* embrace [KISS](http://en.wikipedia.org/wiki/Keep_it_simple) and [DRY](http://en.wikipedia.org/wiki/Don't_repeat_yourself)

* write least amount of code possible

* ideas by humans, automation by computers


How
---

In a nutshell:

1. Compile Mustache-compatible template using a `model` object into a valid HTML string (with added metadata)

	`Stage1` can be processed server-side or browser-side

2. Using `Stage1` output generate DOM and bind elements properties to `model` properties, so your model is the [single source of truth](http://en.wikipedia.org/wiki/Single_Source_of_Truth)

<br>
`jtmpl` _takes care of the conversion of_ `template`_s to_ `DOM element`_s and all the event handling needed to keep them in sync with_ `model`.

<br>
Other JavaScript MV* frameworks require you either:

* explicitly specify (via code or DOM element attributes) how to do the binding

* build DOM via code :(

`jtmpl` enables you to assume you just have live templates.

It's still explicit&mdash;tags have types and names. And the boilerplate is gone.


Details
-------

* it's a template compiler of a simple, but powerful [syntax](http://mustache.github.io)
	
		> jtmpl('Hello, {{who}}', { who: 'server' })

		Hello, <span data-jt="{{who}}">server</span>

	* _limitation by design is the contents of each [section](http://mustache.github.io/mustache.5.html) must be valid structural HTML, you cannot freely mix Mustache and HTML tags_

	* _variables are automatically enclosed in a_ `<span>` _if they aren't HTML tag contents already_

	* _similarly, sections are automatically enclosed in a_ `<div>` _if needed_

	* `data-jt` _attributes containing metadata for_ `Stage2` _are injected in HTML elements_

	* _partials are not currently supported, plans are to support id-based and URL-based partials_

	* _setting a new delimiter is not currently supported_


* it's a [MV(C)](http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) micro-framework for the browser

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
						if (field == 'browser') {
							field = 'BROWSER'; 
							buttonText = 'Keep quiet';
						}
						else {
							field = 'browser'; 
							buttonText = 'Shout again';
						} 
					}
				}
			}
		</script>

		<!-- do the dirty work (`jtmpl` will detect `*[id=jtmpl][data-model]`) -->
		<script src="js/jtmpl.min.js"></script>

    * _or, to invoke manually:_ `jtmpl('#target-id', 'template contents or "#template-id"', model)` 

    * _template contents can be already prerendered by server to save the client some processing and help for SEO_


* based on [Object.observe](http://updates.html5rocks.com/2012/11/Respond-to-change-with-Object-observe)

* no dependencies, [polyfill](https://github.com/jdarling/Object.observe) built-in

* IE 8+, Firefox, Chrome, Opera

* Downloads: [jtmpl.coffee](src/coffee/jtmpl.coffee), [jtmpl.js](js/jtmpl.js), [jtmpl.min.js](js/jtmpl.min.js)




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
			<ul>
				{{#collection}}
				<li>type <code>{{type}}</code>, value <code>{{value}}</code></li>
				{{/collection}}
				{{^collection}}
				<li>&lt; empty &gt;</li>
				{{/collection}}
			</ul>
			<button onclick={{add}}>Add random</button>
			<button onclick="{{remove}}">Remove last</button>

			<h3>Toggle text&mdash;<code>model.text</code></h3>
			<a href="#" onclick='{{toggle}}'>Toggle</a>
			<p>
				{{text}}
			</p>

			<h3>innerHTML&mdash;<code>model.innerHTML</code></h3>
			<!-- {{{innerHTML}}} -->     
			<!-- `jtmpl` accepts tags in HTML comments and automatically strips them -->

			<h3>Data binding&mdash;<code>model.field</code></h3>
			<label for="field">Enter something</label> <input id="field" value={{field}}>
			<p>
				{{#field}}
				You entered "{{field}}". Delete it and this message will disappear
				{{/field}}
			</p>

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

				field: null,

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
