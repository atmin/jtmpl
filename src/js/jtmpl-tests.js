function $(s) {
	return Array.prototype.slice.call(document.querySelectorAll(s));
}

test('tests', function() {
 
	equal($('ul')[0].querySelectorAll('li').length, 3, '3 model.array items found');
	equal($('ul')[1].querySelectorAll('li').length, 2, '2 model.objArray items found');
	equal($('input')[0].value, '', 'input should be empty string');

	// ok(true, 'true is truthy');
	// equal(1, true, '1 is truthy');
	// notEqual(0, true, '0 is NOT truthy');
});