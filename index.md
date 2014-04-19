Mustache syntax *&nbsp;+&nbsp;* automatic data-binding *&nbsp;=&nbsp;* Live templates


<nav>
	<ul>
		<li>
			<i class="icon-file-text"></i>
			<a href="README.html">README</a>
			<a href="src/coffee/jtmpl.html">Literate CoffeeScript source code</a>
		</li>
		<li>
			<i class="icon-gears"></i>
			<a href="kitchensink.html">KitchenSink demo</a>
			<a href="http://codepen.io/atmin/full/JkmrD">TodoMVC demo</a>
		</li>
		<li>
			<i class="icon-github"></i>
			<a href="https://github.com/atmin/jtmpl">jtmpl@GitHub</a>
			<a href="https://github.com/atmin/jtmpl/issues?state=open">Issues / Planned Features</a>
		</li>
		<li>
			<i class="icon-download-alt"></i>
			<a href="js/jtmpl.js">jtmpl.js</a>
			<a href="js/jtmpl.min.js">jtmpl.min.js <em>(5.8kb gzipped)</em></a>
		</li>
	</ul>
</nav>

### Roadmap

Upcoming jtmpl 0.4.0 will be a complete rewrite. Here's what's changing:

#### Source language

New language is JavaScript, augmented with [Sweet.js](sweetjs.org), [es6macros](https://github.com/jlongster/es6-macros) and [sparkler](https://github.com/natefaubion/sparkler). CoffeeScript is an excellent prototyping language and helped develop the idea. JavaScript base would be more accessible and can be shaped with macros to fit closely jtmpl needs. 


#### Eliminate the compiler

The compiler is a major piece of complexity and code volume. Every browser already includes a HTML parser that can be leveraged. So compiler will be removed completely, Mustache tags will be parsed from the constructed (offline) DOM tree instead &ndash; a much simpler approach.


#### Immutable structures

Switching to immutable data structures eliminates a large class of bugs, will make code simpler and possible to be better optimized by a smart JS engine. The implications for the library user are routes and event handlers should refer to current `model` only via the `this` context (`this.__root__` and `this.__parent__` will be provided) and never via referencing variable.


#### Functional representation

There won't be data-jt attributes anymore. A compiled template is a function, that constructs a DOM fragment and sets up data-binding and event handling, akin to the intermediate representation you get when compiling a template via traditional engine.


#### Features target

* automatic bidirectional data-binding based on context

* computed properties with automatic dependency management

* asynchronous computed properties

* set a computed property

* mappings

* formatters

* routes &ndash; simple and regexp specified

* partials

  - literal, synchronous &ndash; `{{>"#template-by-id-to-include"}}`

  - literal, asynchronous &ndash; `{{>"//url/of/template"}}`

  - variable, can be updated at runtime &ndash; `{{>url_or_element_id}}`

* make `jtmpl('#target-id', '#template-id', model)` boilerplate optional:

      <!-- target -->
      <article data-template="#template-id" data-model="#model"></article>
      <!-- 
      Or you can use URLs instead of referencing by id, just like in partials.
      Easy distributed applications.
      -->

      <script id="template-id" type="text/template">
      	  Hello, {{who}}
      </script>

      <script id="model" type="text/model">
          {
              who: 'world'
          }
      </script>

* XHR



#### Test coverage

Include test coverage report during build process, aim for 100% test coverage.



#### Performance tests, regression warnings

Have to think some more on this.