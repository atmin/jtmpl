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

        model.a = [3, 2, 1];

        expect(
          body.innerHTML
        ).toBe('321<!---->');
      });



    });