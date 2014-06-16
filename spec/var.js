/*

## Variable

*/

    describe('Variable {{variable}}', function () {

      var template = '{{a}}{{#b}}{{c}}{{/b}}{{d}}{{e}}';

      var model = {
          a: 1,
          b: {
            c: 24
          },
          d: function() {
            return this('a') * 100;
          },
          e: function() {
            return this('d') + this('b').c + this('a');
          }
      };

      var body = document.createElement('body');
      body.appendChild(jtmpl(template, model));


      it('model.a = model.a + 1', function () {
        model.a = model.a + 1;
        expect(body.innerHTML).toBe('224<!---->200226');
      });


      it('model.b = { c: 42 }', function () {
        model.b = { c: 42 };
        expect(body.innerHTML).toBe('242<!---->200244');
      });

    });
