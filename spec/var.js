/*

## Variable

*/

    describe('Variable {{variable}}', function () {

      var template = '{{a}}{{#b}}{{c}}{{/b}}';

      var model = {
          a: 1,
          b: {
            c: 24
          }
      };

      var body = document.createElement('body');
      body.appendChild(jtmpl(template, model));

      var result;


      it('model.a = model.a + 1', function () {
        model.a = model.a + 1;
        expect(body.innerHTML).toBe('224<!---->');
      });


      it('model.b = { c: 42 }', function () {
        model.b = { c: 42 };
        expect(body.innerHTML).toBe('242<!---->');
      });

    });
