var expect = require('expect');
var h = require('../src/helpers.js');

describe('Helpers', function() {

	describe('#color()', function() {
		it('should return a real color name from a line code', function() {
			expect(h.color('rd')).toMatch('Red');
			expect(h.color('or')).toMatch('Orange');
			expect(h.color('yl')).toMatch('Yellow');
			expect(h.color('gr')).toMatch('Green');
			expect(h.color('bl')).toMatch('Blue');
			expect(h.color('sv')).toMatch('Silver');
		});
	});

	describe('#caps()', function() {
		it('should capitalize individual words in a string', function() {
			expect(h.caps('mIxEd CaSe')).toMatch('Mixed Case');
			expect(h.caps('UPPERCASE WORDS')).toMatch('Uppercase Words');
			expect(h.caps('lowercase words')).toMatch('Lowercase Words');
		});
	});

	describe('#concat_rail()', function() {
		it('should concatenate rail lines in a station object to a single string', function() {
			var a = { Name: 'Test Station A', LineCode1: 'BL', LineCode2: 'OR', LineCode3: 'SV', LineCode4: null },
				b = { Name: 'Test Station B', LineCode1: 'YL', LineCode2: 'GR', LineCode3: null, LineCode4: null },
				c = { Name: 'Test Station C', LineCode1: 'RD', LineCode2: null, LineCode3: null, LineCode4: null },
				d = { Name: 'Test Station D', LineCode1: null, LineCode2: null, LineCode3: null, LineCode4: null };
			expect(h.concat_rail(a)).toMatch('bl,or,sv');
			expect(h.concat_rail(b)).toMatch('yl,gr');
			expect(h.concat_rail(c)).toMatch('rd');
			expect(h.concat_rail(d)).toMatch('');
		});
	});

	describe('#concat_bus()', function() {
		it('should concatenate and remove duplicate bus routes', function() {
			var a = { Name: 'Test Stop A', Routes: [ 'A1', 'A2', 'A2-1', 'A2-2', 'A3', 'A3-1' ] },
				b = { Name: 'Test Stop B', Routes: [ 'B1', 'B2', 'B2-1' ] },
				c = { Name: 'Test Stop C', Routes: [ 'C1' ] };
			expect(h.concat_bus(a)).toMatch('A1, A2, A3');
			expect(h.concat_bus(b)).toMatch('B1, B2');
			expect(h.concat_bus(c)).toMatch('C1');
		});
	});

	/*
	describe('#distance()', function() {

	});

	describe('#format_date()', function() {

	});

	describe('#plural()', function() {

	});

	describe('#time_left()', function() {

	});

	describe('#time_to_12h()', function() {

	});
	*/
});
