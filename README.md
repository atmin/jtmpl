_`{{`_ `jtmpl` _`}}`_
=====================

#### Humanistic JavaScript MV framework

.  
 _Code is work in progress, feel free to explore concept_

Why
---

* embrace [KISS](http://en.wikipedia.org/wiki/Keep_it_simple) and [DRY](http://en.wikipedia.org/wiki/Don't_repeat_yourself)

* write least amount of code possible

* ideas by humans, automation by computers


How
---

1. Render Mustache-compatible template using a `model` object into a valid HTML with added metadata (generated `span` tags where necessary, `data-jtmpl` attributes)

	`Stage1` can be processed server-side or browser-side

2. Using metadata from `Stage1` bind DOM elements properties to `model` properties, so your model is the [single source of truth](http://en.wikipedia.org/wiki/Single_Source_of_Truth)

.

 `jtmpl` _takes care of the conversion of templates to DOM elements and all the event handling needed to keep them in sync with_ `model`


Details
-------

* it's a templating engine with simple, but powerful [syntax](http://mustache.github.io)
	
		> jtmpl('Hello, {{who}}', { who: 'server' })

		Hello, <span data-jtmpl="innerHTML=who">server</span>

	_Fundamental limitation is the contents of each [section](http://mustache.github.io/mustache.5.html) must be valid structural HTML, you cannot freely mix Mustache and HTML tags_

	_Temporary limitation is partials are not currently supported, plans are to support id-based and URL-based partials_


* it's a [MV(C)](http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) micro-framework for the browser

		<!-- View -->
		<div id=jtmpl data-model=model>
			Hello, {{field}}
			<button onclick={{eventHandler}}>Shout</button>
		<div>

		<!-- Model (View is controlled implicitly) -->
		<script>
			model = {
				field: 'browser',
				eventHandler: function() {
					this.field = 'BROWSER';
				}
			}
		</script>

		<!-- do the dirty work (`jtmpl` will detect `div[id=jtmpl][data-model=model]`) -->
		<script src="js/jtmpl.min.js"></script>

    _Or, to invoke manually:_ `jtmpl('#target-id', 'template contents or "#template-id"', model)` 

    _Template contents can be already prerendered by server, this will save the client some processing_


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
			<div>
				<!-- {{{innerHTML}}} -->     
				<!-- `jtmpl` accepts tags in HTML comments and automatically strips them -->
			</div>

			<h3>Data binding&mdash;<code>model.field</code></h3>
			<label for="field">Enter something</label> <input id="field" value={{field}}>
			<p>
				{{#field}}
				You entered "{{field}}". Delete it and this message will disappear
				{{/field}}
			</p>

			<h3>Checkboxes&mdash;<code>model.checkboxes</code></h3>
			<div>
				{{#checkboxes}}
				<label><input type="checkbox" checked={{fooCheck}}> check foo</label>
				<label><input type="checkbox" checked={{barCheck}}> check bar</label>
				{{/checkboxes}}
			</div>

			<h3>Select&mdash;<code>model.selectedIndex</code></h3>
			<select selectedIndex={{selectedIndex}}>
				{{#options}}
				<option>{{text}}</option>
				{{/options}}
			</select>

			<h3>Radio group&mdash;<code>model.options</code></h3>
			<p>
				<em>&lt;select&gt; is bound to</em> <code>model.options</code>
			</p>
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

				selectedIndex: 0,

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
		<script>/*jtmpl('#jtmpl', '#jtmpl', model)*/</script>

		<h2>QUnit Blackbox Tests</h2>
		<div id="qunit"></div>
		<div id="qunit-fixture"></div>
		<script src="js/tests.js"></script>
	</body>
	</html>
