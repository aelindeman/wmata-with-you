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
			expect(h.color('rd')).toEqual('Red');
			expect(h.color('or')).toEqual('Orange');
			expect(h.color('yl')).toEqual('Yellow');
			expect(h.color('gr')).toEqual('Green');
			expect(h.color('bl')).toEqual('Blue');
			expect(h.color('sv')).toEqual('Silver');
			expect(h.color('other')).toNotExist();
		});
	});

	describe('caps()', function() {
		it('should capitalize individual words in a string', function() {
			expect(h.caps('mIxEd CaSe')).toEqual('Mixed Case');
			expect(h.caps('UPPERCASE WORDS')).toEqual('Uppercase Words');
			expect(h.caps('lowercase words')).toEqual('Lowercase Words');
		});
	});

	describe('concat_rail()', function() {
		var a = { LineCode1: 'BL', LineCode2: 'OR', LineCode3: 'SV', LineCode4: null },
			b = { LineCode1: 'YL', LineCode2: 'GR', LineCode3: null, LineCode4: null },
			c = { LineCode1: 'RD', LineCode2: null, LineCode3: null, LineCode4: null },
			d = { LineCode1: null, LineCode2: null, LineCode3: null, LineCode4: null };
		it('should concatenate linecode keys into an array', function() {
			expect(h.concat_rail(a)).toEqual(['bl', 'or', 'sv']);
			expect(h.concat_rail(b)).toEqual(['yl', 'gr']);
			expect(h.concat_rail(c)).toEqual(['rd']);
			expect(h.concat_rail(d)).toEqual([]);
		});
		it('should prettify linecode keys', function() {
			expect(h.concat_rail(a, true)).toEqual(['Blue', 'Orange', 'Silver']);
			expect(h.concat_rail(b, true)).toEqual(['Yellow', 'Green']);
			expect(h.concat_rail(c, true)).toEqual(['Red']);
			expect(h.concat_rail(d, true)).toEqual([]);
		});
	});

	describe('concat_bus()', function() {
		it('should concatenate and remove duplicate bus routes', function() {
			expect(h.concat_bus({ Routes: [ 'A1', 'A2', 'A2v1', 'A2v2', 'A3', 'A3v1', 'A3cv1', 'A3vS1' ] })).toEqual('A1 A2 A3');
			expect(h.concat_bus({ Routes: [ '20', '20v1', '20cv1', '22', '22v2', '22cvS2' ] })).toEqual('20 22');
			expect(h.concat_bus({ Routes: [ '3C', '3Cv2', '3CvS2' ] })).toEqual('3C');
		});
	});


	describe('distance()', function() {
		it('should apply the distance formula', function() {
			expect(h.distance(0, 0, 0, 0)).toEqual(0);
			expect(h.distance(0, 0, 1, 1)).toEqual(Math.sqrt(2));
			expect(h.distance(-1, -1, 1, 1)).toEqual(2 * Math.sqrt(2));
			expect(h.distance(1, -2, 4, -6)).toEqual(5);
			expect(h.distance(-3, 5, 1, 4)).toEqual(Math.sqrt(17));
		});
	});

	describe('format_date()', function() {
		it('should return a date stamp as something readable', function() {
			expect(h.format_date('2016-06-01T07:00:00Z')).toEqual('Jun. 1st');
			expect(h.format_date('2016-06-01T07:00:00Z', true)).toEqual('Jun. 1st 7:00 am');
		});
	});

	describe('plural()', function() {
		it('should use plural arg when value is not 1', function() {
			expect(h.plural(0, 'puppies', 'puppy')).toEqual('puppies');
			expect(h.plural(1, 'puppies', 'puppy')).toEqual('puppy');
			expect(h.plural(2, 'puppies', 'puppy')).toEqual('puppies');
		});
	});

	describe('time_left()', function() {
		it('should translate abbreviations', function() {
			expect(h.time_left('ARR')).toEqual('Arriving');
			expect(h.time_left('BRD')).toEqual('Boarding');
			expect(h.time_left('')).toEqual('Delayed');
			expect(h.time_left('DLY')).toEqual('Delayed');
		});
		it('should add suffixes', function() {
			expect(h.time_left(1)).toEqual('1 minute');
			expect(h.time_left(2)).toEqual('2 minutes');
			expect(h.time_left(60)).toEqual('1 hour');
			expect(h.time_left(61)).toEqual('1 hr 1 min');
			expect(h.time_left(120)).toEqual('2 hr 0 min');
		});
	});

	describe('time_to_12h()', function() {
		it('should convert a 24h time to 12h format', function() {
			expect(h.time_to_12h('13:01')).toEqual('1:01 pm');
			expect(h.time_to_12h('23:59')).toEqual('11:59 pm');
			expect(h.time_to_12h('00:20')).toEqual('12:20 am');
		});
	});
});
