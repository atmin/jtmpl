_{{_ jtmpl _}}_<br>MVVM Templating Engine for the Browser
=========================================================

_Code is work in progress, feel free to explore concept_

`jtmpl` renders [Mustache](https://github.com/janl/mustache.js)-compatible template using a `model` object and automatically binds fields and events to DOM elements. When model changes, DOM is updated and vice versa.


What
-----

* it's a templating engine

* it's a [MVVM](http://en.wikipedia.org/wiki/Model_View_ViewModel) micro-framework

* based on [Object.observe](http://updates.html5rocks.com/2012/11/Respond-to-change-with-Object-observe)

* no external dependencies

* IE 8+, Firefox, Chrome, Opera ([polyfill](https://github.com/jdarling/Object.observe) built-in)

* [Kitchen Sink](kitchensink.html) (extracted from this file) enumerates features and executes automated tests

* Downloads: [jtmpl.js](js/jtmpl.js), [jtmpl.min.js](js/jtmpl.min.js)



Kitchen Sink
------------

	<!doctype html>
	<html>
	<head>
		<link rel="stylesheet" type="text/css" href="css/baseline.css">
		<link rel="stylesheet" type="text/css" href="css/qunit.css">
		<script src="js/qunit.js"></script>
	</head>
	
	<body>
		<div id="jtmpl" data-model="model">
			<h1>Kitchen Sink</h1>
			<p>Feel free to modify <code>model</code> from JS console and observe changes</p>
			<h3>Collection <code>model.collection</code></h3>
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

			<h3>Toggle text <code>model.text</code></h3>
			<a href="#" onclick='{{toggle}}'>Toggle</a>
			<p>{{text}}</p>

			<h3>Bidirectional data binding <code>model.field</code></h3>
			<label for="field">Enter something</label> <input id="field" value={{field}}>
			<p>{{#field}}
				You entered "<span>{{field}}</span>". Delete it and this message will disappear
			{{/field}}</p>

			<h3>Checkboxes</h3>
			<div>
				{{#checkboxes}}
				<label><input type="checkbox" checked={{fooCheck}}> check foo</label>
				<label><input type="checkbox" checked={{barCheck}}> check bar</label>
				{{/checkboxes}}
			</div>

			<h3>Select <code>model.selectedIndex</code></h3>
			<select selectedIndex={{selectedIndex}}>
				{{#options}}
				<option>{{text}}</option>
				{{/options}}
			</select>

			<h5>Radio group <code>model.options</code></h5>
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
					this.array.push(Math.random());
				},
				remove: function() {
					this.array.pop();
				}
			};
		</script>
		<!-- if jtmpl finds #jtmpl[data-model], it automatically does
			jtmpl('#jtmpl', '#jtmpl', <the value of #jtmpl[data-model]>) -->
		<script src="js/jtmpl.js"></script>

		<div id="qunit"></div>
		<div id="qunit-fixture"></div>
		<script src="js/jtmpl-tests.js"></script>
	</body>
	</html>
