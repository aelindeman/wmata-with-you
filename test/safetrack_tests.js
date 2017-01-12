var expect = require('expect');
var s = require('../src/safetrack.js');

describe('Safetrack', function() {

	describe('.events', function() {
		it('should be an object', function() {
			expect(s.events).toBeAn(Object);
		});
	});

});
