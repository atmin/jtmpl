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
		<script src="js/jtmpl.js"></script>
		<script src="js/qunit.js"></script>
	</head>
	
	<body>
		<h1>Kitchen Sink</h1>
		<p>Demo of each jtmpl feature</p>

		<script src="js/jtmpl.js"></script>

		<!-- view target -->
		<div id="view-target"></div>

		<!-- view -->
		<script id="view-template" type="text/html">
			<h5>model.array</h5>
			<ul>
				{{#array}}
				<li>{{.}}</li>
				{{/array}}
				{{^array}}
				<li>&lt; empty &gt;</li>
				{{/array}}
			</ul>
			<a href="#" id="addToArray">Add random element to model.array</a>
			<a href="#" id="removeLastFromArray" disabled="disabled">Remove last model.array element</a>

			<h5>model.objArray</h5>
			<ul>
				{{#objArray}}
				<li>{ f1: "<span>{{f1}}</span>", f2: "<span>{{f2}}</span>" }</li>
				{{/objArray}}
				{{^objArray}}
				<li>&lt; empty &gt;</li>
				{{/objArray}}
			</ul>
		
			<a href="#" id="toggleDynamicTextCase">Toggle</a>
			<p>{{dynamicText}}</p>

			<label for="field">Enter something</label> <input id="field" value="{{field}}">
			{{#field}}<p>
				You entered "<span>{{field}}</span>". Delete it and this message will disappear
			</p>{{/field}}

			<h5>model.checkboxes</h5>
			<div>
				{{#checkboxes}}
				<label><input type="checkbox" {{fooCheck}}> fooCheck</label>
				<label><input type="checkbox" {{barCheck}}> barCheck</label>
				{{/checkboxes}}
			</div>

			<h5>model.radioGroupIndex == <span>{{radioGroupIndex}}</span></h5>
			<div>
				<label><input type="radio" name="radio-group" {{radioGroupIndex}}> option 1</label>
				<label><input type="radio" name="radio-group" {{radioGroupIndex}}> option 2</label>
			</div>
		</script>

		<!-- model -->
		<script>
			var model = {
				dynamicText: 'lowercase',
				array: ['one', 'two', 'three'],
				objArray: [
					{
						f1: 'A_f1',
						f2: 'A_f2'
					},
					{
						f1: 'B_f1',
						f2: 'B_f2'
					}
				],
				field: null,

				checkboxes: {
					fooCheck: true,
					barCheck: false
				},

				// "option 2" will be initially selected
				radioGroupIndex: 1,

				// event handlers
				'#toggleDynamicTextCase:click': function() {
					this.dynamicText = this.dynamicText == 'lowercase' ?
						'UPPERCASE': 'lowercase';
				},
				'#addToArray:click': function() {
					this.array.push(Math.random());
				},
				'#removeLastFromArray:click': function() {
					this.array.pop();
				}
			};

			jtmpl('#view-target', '#view-template', model);
		</script>

		<div id="qunit"></div>
		<div id="qunit-fixture"></div>
		<script src="js/jtmpl-tests.js"></script>
	</body>
	</html>
