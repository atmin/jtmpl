/*

## Main function

*/

    describe('jtmpl', function () {
      var model = {c: true};
      var template = '<a class="{{c}}"></a>';

      var body = document.createElement('body');
      body.appendChild(jtmpl(template, model));


      // Misc

      it('renders class', function() {
        expect(
          jtmpl.hasClass(body.children[0], 'c')
        ).toBe(true);

        model.c = false;
        expect(
          jtmpl.hasClass(body.children[0], 'c')
        ).toBe(false);
      });

    });