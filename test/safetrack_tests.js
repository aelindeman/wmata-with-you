var expect = require('expect');
var tk = require('timekeeper');
var s = require('../src/safetrack.js');

describe('Safetrack', function() {

	var mock_events = [
		{
			"location": "foo",
			"description": "lorem ipsum",
			"startDate": "2017-01-01T00:00:00-04:00",
			"endDate": "2017-01-01T23:59:59-04:00",
			"stationsAffected": ["FOO"],
			"linesAffected": ["A"]
		},
		{
			"location": "bar",
			"description": "lorem ipsum",
			"startDate": "2017-01-02T00:00:00-04:00",
			"endDate": "2017-01-02T23:59:59-04:00",
			"stationsAffected": ["BAR"],
			"linesAffected": ["B", "C"]
		},
		{
			"location": "baz",
			"description": "lorem ipsum",
			"startDate": "2017-02-01T00:00:00-04:00",
			"endDate": "2017-02-01T23:59:59-04:00",
			"stationsAffected": ["FOO", "BAZ"],
			"linesAffected": ["C"]
		}
	];

	describe('.events', function() {
		it('should be an object', function() {
			expect(s.events).toBeAn(Object);
		});
		it('should contain safetrack information objects', function() {
			for (var e in s.events) {
				var event = s.events[e];
				expect(event).toBeAn(Object);
				expect(event).toIncludeKeys(['location', 'description', 'startDate', 'endDate', 'stationsAffected', 'linesAffected']);
			}
		})
	});

	describe('filterEvents()', function() {
		before(function() {
			s.events = mock_events;
		});
		it('should filter events using a callback', function() {
			var filtered = s.filterEvents(function(event) {
				return event.location == 'foo';
			});
			expect(filtered).toBeAn(Array);
			expect(filtered).toInclude(s.events[0])
				.toExclude(s.events[1])
				.toExclude(s.events[2]);
		});
	});

	describe('affectsAtDate()', function() {
		before(function() {
			s.events = mock_events;
			tk.travel(new Date('2017-01-01T12:00:00-04:00'));
		});
		it('should find events currently happening', function() {
			var on = s.affectsAtDate();
			expect(on.length).toBe(1);
			expect(on).toInclude(s.events[0])
				.toExclude(s.events[1])
				.toExclude(s.events[2]);
		});
		it('should find events ocurring on a date', function() {
			var on = s.affectsAtDate(new Date('2017-01-01T12:00:00-04:00'));
			expect(on.length).toBe(1);
			expect(on).toInclude(s.events[0])
				.toExclude(s.events[1])
				.toExclude(s.events[2]);
		});
		it('should find events ocurring between two dates', function() {
			var on = s.affectsAtDate(new Date('2017-01-01T00:00:00-04:00'), new Date('2017-01-14T00:00:00-04:00'));
			expect(on.length).toBe(2);
			expect(on).toInclude(s.events[0])
				.toInclude(s.events[1])
				.toExclude(s.events[2]);
		});
		after(function() {
			tk.reset();
		})
	});

	describe('affectsNow()', function() {
		before(function() {
			s.events = mock_events;
			tk.travel(new Date('2017-01-01T12:00:00-04:00'));
		});
		it('should find events currently happening', function() {
			var now = s.affectsNow();
			expect(now.length).toBe(1);
			expect(now).toInclude(s.events[0])
				.toExclude(s.events[1])
				.toExclude(s.events[2]);
		});
		after(function() {
			tk.reset();
		});
	});

	describe('affectsSoon()', function() {
		before(function() {
			s.events = mock_events;
			tk.travel(new Date('2016-12-28T00:00:00-04:00'));
		});
		it('should find events that are happening within a given amount of days', function() {
			var soon = s.affectsSoon(7);
			expect(soon.length).toBe(2);
			expect(soon).toInclude(s.events[0])
				.toInclude(s.events[1])
				.toExclude(s.events[2]);
		});
		after(function() {
			tk.reset();
		});
	});

	describe('affectsStation()', function() {
		before(function() {
			s.events = mock_events;
			tk.travel(new Date('2016-12-28T00:00:00-04:00'));
		});
		it('should find all events at a station when station given as an object', function() {
			var station = {
				"Code": "foo"
			};
			var events = s.affectsStation(station);
			expect(events.length).toBe(2);
			expect(events).toInclude(s.events[0])
				.toExclude(s.events[1])
				.toInclude(s.events[2]);
		});
		it('should find all events at a station when station given as an array of stations', function() {
			var stations = [
				{
					"Code": "foo"
				},
				{
					"Code": "baz"
				}
			];
			var events = s.affectsStation(stations);
			expect(events.length).toBe(2);
			expect(events).toInclude(s.events[0])
				.toExclude(s.events[1])
				.toInclude(s.events[2]);
		});
		it('should find all events at a station when station given as an array of station codes', function() {
			var stations = ['bar', 'baz'];
			var events = s.affectsStation(stations);
			expect(events.length).toBe(2);
			expect(events).toExclude(s.events[0])
				.toInclude(s.events[1])
				.toInclude(s.events[2]);
		});
		it('should find all events at a station when station given as a station code', function() {
			var stations = 'bar';
			var events = s.affectsStation(stations);
			expect(events.length).toBe(1);
			expect(events).toExclude(s.events[0])
				.toInclude(s.events[1])
				.toExclude(s.events[2]);
		});
		after(function() {
			tk.reset();
		});
	});

	describe('affectsLine()', function() {
		before(function() {
			s.events = mock_events;
			tk.travel(new Date('2016-12-28T00:00:00-04:00'));
		});
		it('should find all events for a line', function() {
			var line = 'c';
			var events = s.affectsLine(line);
			expect(events.length).toBe(2);
			expect(events).toExclude(s.events[0])
				.toInclude(s.events[1])
				.toInclude(s.events[2]);
		});
		after(function() {
			tk.reset();
		});
	});

	describe('isSoon()', function() {
		before(function() {
			s.events = mock_events;
			tk.travel(new Date('2016-12-28T00:00:00-04:00'));
		});
		it('should return true if an event is occuring within in a given number of days', function() {
			var soon = [s.isSoon(s.events[0], 7), s.isSoon(s.events[2], 7)];
			expect(soon).toEqual([true, false]);
		});
		it('should return false if an event is not occuring within in a given number of days', function() {
			var soon = s.isSoon(s.events[0], 1);
			expect(soon).toEqual(false);
		});
		after(function() {
			tk.reset();
		});
	});

});
