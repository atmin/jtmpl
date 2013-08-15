function $(s) {
	return Array.prototype.slice.call(document.querySelectorAll(s));
}

test('tests', function() {
 
	equal($('ul')[0].querySelectorAll('li').length, model.array.length, 'ul[0] model.array.length items found');
	equal($('ul')[1].querySelectorAll('li').length, model.objArray.length, 'ul[1] model.objArray.length items found');
	equal($('input')[0].value, '', 'input.value = model.field');

	// ok(true, 'true is truthy');
	// equal(1, true, '1 is truthy');
	// notEqual(0, true, '0 is NOT truthy');
});