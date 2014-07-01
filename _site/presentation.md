# Template engine as functional reactive programming language


There's been a boom of using reactive programming techniques in front-end frameworks - Angular, Ember, Knockout and React are notable examples. That's not surprizing as these techniques are fundamental for scalable, maintainable and robust user interfaces.

I've been tinkering with a templating engine, that understands template structure and continuously keeps resulting DOM synchronized with the data model. A browser framework emerged, that naturally extends Mustache templates semantics and does distributed, live templates, without requiring any boilerplate or framework-specific learning curve.

I'll present you JTmpl and show you how to build a non-trivial spreadsheet application using it.