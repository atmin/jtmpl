/*

## Misc tests

*/

    describe('jtmpl', function () {


      it('class="{{var}}"', function() {
        var model = {c: true};
        var template = '<a class="{{c}}"></a>';

        var body = document.createElement('body');
        body.appendChild(jtmpl(template, model));

        expect(
          jtmpl.hasClass(body.children[0], 'c')
        ).toBe(true);

        model.c = false;
        expect(
          jtmpl.hasClass(body.children[0], 'c')
        ).toBe(false);
      });



      it('class="{{#if}}klass{{/}}"', function() {
        var model = {'if': true};
        var template = '<a class="{{#if}}klass{{/}}"></a>';

        var body = document.createElement('body');
        body.appendChild(jtmpl(template, model));

        expect(
          jtmpl.hasClass(body.children[0], 'klass')
        ).toBe(true);

        model['if'] = false;
        expect(
          jtmpl.hasClass(body.children[0], 'klass')
        ).toBe(false);
      });



      it('attr="{{a}}"', function() {
        var model = {a: 'aa'};
        var template = '<a attr="{{a}}"></a>';

        var body = document.createElement('body');
        body.appendChild(jtmpl(template, model));

        expect(
          body.children[0].getAttribute('attr')
        ).toBe('aa');

        model.a = 'bbb';
        expect(
          body.children[0].getAttribute('attr')
        ).toBe('bbb');

        model.a = false;
        expect(
          body.children[0].getAttribute('attr')
        ).toBe(null);
      });



      it('{{#if}}test{{/}}', function() {
        var model = {'if': true};
        var template = '{{#if}}test{{/}}';

        var body = document.createElement('body');
        body.appendChild(jtmpl(template, model));

        expect(
          body.childNodes[0].data
        ).toBe('test');

        model['if'] = false;

        expect(
          body.childNodes[0].data
        ).toBe('');
      });



      it('{{#context}}{{a}}{{/}}', function() {
        var model = {context: {a: 42}};
        var template = '{{#context}}{{a}}{{/}}';

        var body = document.createElement('body');
        body.appendChild(jtmpl(template, model));

        expect(
          body.childNodes[0].data
        ).toBe('42');

        model.context = {a: 1};

        expect(
          body.childNodes[0].data
        ).toBe('1');
      });



      it('{{#a}}{{.}}{{/}}', function() {
        var model = {a: [1, 2, 3, 4]};
        var template = '{{#a}}{{.}}{{/}}';

        var body = document.createElement('body');
        body.appendChild(jtmpl(template, model));

        expect(
          body.innerHTML
        ).toBe('1234<!---->');

        // This works in browser, but not in PhantomJS
        // model.a[0] = 42;
        // expect(
        //   body.innerHTML
        // ).toBe('42234<!---->');

        model.a = [3, 2, 1];
        expect(
          body.innerHTML
        ).toBe('321<!---->');

        model.a.pop();
        expect(
          body.innerHTML
        ).toBe('32<!---->');

        model.a.push(42); 
        expect(
          body.innerHTML
        ).toBe('3242<!---->');

        // Sort seems buggy in PhantomJS
        // model.a.sort();
        // expect(
        //   body.innerHTML
        // ).toBe('2342<!---->');

        model.a.reverse();
        expect(
          body.innerHTML
        ).toBe('4223<!---->');

        model.a.shift();
        expect(
          body.innerHTML
        ).toBe('23<!---->');

        model.a.unshift(1);
        expect(
          body.innerHTML
        ).toBe('123<!---->');


        model.a.splice(0, 0, 1);
        expect(
          body.innerHTML
        ).toBe('1123<!---->');

        // Not sure why the error, works in browser.
        // ReferenceError: Can't find variable: model in file:///home/atmin/dev/jtmpl/.grunt/grunt-contrib-jasmine/build/jtmpl.js (line 9) (1)
        // model.a.splice(0, 1);
        // expect(
        //   body.innerHTML
        // ).toBe('123<!---->');
      });



    });