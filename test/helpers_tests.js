var expect = require('expect');
var moment = require('moment');

// pebble provides moment as 'vendor/moment', so alias it
var mock = require('mock-require');
mock('vendor/moment', moment);

// mock the timezone to UTC too (this is a big ol hack)
moment.updateOffset = function (m) {
	return m.utcOffset(0);
};

var h = require('../src/helpers.js');

describe('Helpers', function() {

	describe('color()', function() {
		it('should return a real color name from a line code', function() {
			expect(h.color('rd')).toMatch('Red');
			expect(h.color('or')).toMatch('Orange');
			expect(h.color('yl')).toMatch('Yellow');
			expect(h.color('gr')).toMatch('Green');
			expect(h.color('bl')).toMatch('Blue');
			expect(h.color('sv')).toMatch('Silver');
			expect(h.color('other')).toNotExist();
		});
	});

	describe('caps()', function() {
		it('should capitalize individual words in a string', function() {
			expect(h.caps('mIxEd CaSe')).toMatch('Mixed Case');
			expect(h.caps('UPPERCASE WORDS')).toMatch('Uppercase Words');
			expect(h.caps('lowercase words')).toMatch('Lowercase Words');
		});
	});

	describe('concat_rail()', function() {
		var a = { LineCode1: 'BL', LineCode2: 'OR', LineCode3: 'SV', LineCode4: null },
			b = { LineCode1: 'YL', LineCode2: 'GR', LineCode3: null, LineCode4: null },
			c = { LineCode1: 'RD', LineCode2: null, LineCode3: null, LineCode4: null },
			d = { LineCode1: null, LineCode2: null, LineCode3: null, LineCode4: null };
		it('should concatenate linecode keys into an array', function() {
			expect(h.concat_rail(a)).toMatch(['bl', 'or', 'sv']);
			expect(h.concat_rail(b)).toMatch(['yl', 'gr']);
			expect(h.concat_rail(c)).toMatch(['rd']);
			expect(h.concat_rail(d)).toMatch([]);
		});
		it('should prettify linecode keys', function() {
			expect(h.concat_rail(a, true)).toMatch(['Blue', 'Orange', 'Silver']);
			expect(h.concat_rail(b, true)).toMatch(['Yellow', 'Green']);
			expect(h.concat_rail(c, true)).toMatch(['Red']);
			expect(h.concat_rail(d, true)).toMatch([]);
		});
	});

	describe('concat_bus()', function() {
		it('should concatenate and remove duplicate bus routes', function() {
			expect(h.concat_bus({ Routes: [ 'A1', 'A2', 'A2v1', 'A2v2', 'A3', 'A3v1', 'A3cv1', 'A3vS1' ] })).toMatch('A1 A2 A3');
			expect(h.concat_bus({ Routes: [ '20', '20v1', '20cv1', '22', '22v2', '22cvS2' ] })).toMatch('20 22');
			expect(h.concat_bus({ Routes: [ '3C', '3Cv2', '3CvS2' ] })).toMatch('3C');
		});
	});


	describe('distance()', function() {
		it('should apply the distance formula', function() {
			expect(h.distance(-3, 5, 1, 4)).toEqual(4.123105625617661); // hmm
			expect(h.distance(2, 3, 0, 6)).toEqual(3.605551275463989);
		});
	});

	describe('format_date()', function() {
		it('should return a date stamp as something readable', function() {
			expect(h.format_date('2016-06-01T07:00:00Z')).toMatch('Jun. 1st');
			expect(h.format_date('2016-06-01T07:00:00Z', true)).toMatch('Jun. 1st 7:00 am');
		});
	});

	describe('plural()', function() {
		it('should use plural arg when value is not 1', function() {
			expect(h.plural(0, 'puppies', 'puppy')).toMatch('puppies');
			expect(h.plural(1, 'puppies', 'puppy')).toMatch('puppy');
			expect(h.plural(2, 'puppies', 'puppy')).toMatch('puppies');
		});
	});

	describe('time_left()', function() {
		it('should translate abbreviations', function() {
			expect(h.time_left('ARR')).toMatch('Arriving');
			expect(h.time_left('BRD')).toMatch('Boarding');
			expect(h.time_left('')).toMatch('Delayed');
			expect(h.time_left('DLY')).toMatch('Delayed');
		});
		it('should add suffixes', function() {
			expect(h.time_left(1)).toMatch('1 minute');
			expect(h.time_left(2)).toMatch('2 minutes');
			expect(h.time_left(60)).toMatch('1 hour');
			expect(h.time_left(61)).toMatch('1 hr 1 min');
			expect(h.time_left(120)).toMatch('2 hr 0 min');
		});
	});

	describe('time_to_12h()', function() {
		it('should convert a 24h time to 12h format', function() {
			expect(h.time_to_12h('13:01')).toMatch('1:01 pm');
			expect(h.time_to_12h('23:59')).toMatch('11:59 pm');
			expect(h.time_to_12h('00:20')).toMatch('12:20 am');
		});
	});
});
