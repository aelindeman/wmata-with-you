/*
 * WMATA With You
 * SafeTrack events list and calculator functions
 * Alex Lindeman <aelindeman@gmail.com>
 */
(function() {
	'use strict';

	function Safetrack() {
		return this;
	}

	Safetrack.prototype = {
		events: [
			{
				"location": "Ballston-MU to East Falls Church",
				"description": "Single-tracking",
				"startDate": "2016-06-04T00:00:00-04:00",
				"endDate": "2016-06-16T23:59:59-04:00",
				"stationsAffected": ["K04", "K05"],
				"linesAffected": ["OR", "SV"]
			},
			{
				"location": "Eastern Market to Minnesota Ave and Benning Road",
				"description": "Shutdown",
				"startDate": "2016-06-18T00:00:00-04:00",
				"endDate": "2016-07-03T23:59:59-04:00",
				"stationsAffected": ["D06", "D07", "D08", "D09", "G01"],
				"linesAffected": ["OR", "SV", "BL"]
			},
			{
				"location": "Ronald Reagan Washington National Airport to Braddock Rd",
				"description": "Shutdown",
				"startDate": "2016-07-05T20:00:00-04:00",
				"endDate": "2016-07-11T23:59:59-04:00",
				"stationsAffected": ["C10", "C12"],
				"linesAffected": ["YL", "BL"]
			},
			{
				"location": "Ronald Reagan Washington National Airport to Pentagon City",
				"description": "Shutdown",
				"startDate": "2016-07-12T00:00:00-04:00",
				"endDate": "2016-07-18T23:59:59-04:00",
				"stationsAffected": ["C10", "C09", "C08"],
				"linesAffected": ["YL", "BL"]
			},
			{
				"location": "Ballston-MU to East Falls Church",
				"description": "Single-tracking",
				"startDate": "2016-07-20T00:00:00-04:00",
				"endDate": "2016-07-31T23:59:59-04:00",
				"stationsAffected": ["K04", "K05"],
				"linesAffected": ["OR", "SV"]
			},
			{
				"location": "Takoma to Silver Spring",
				"description": "Single-tracking",
				"startDate": "2016-08-01T00:00:00-04:00",
				"endDate": "2016-08-07T23:59:59-04:00",
				"stationsAffected": ["B07", "B08"],
				"linesAffected": ["RD"]
			},
			{
				"location": "Shady Grove to Twinbrook",
				"description": "Single-tracking",
				"startDate": "2016-08-09T00:00:00-04:00",
				"endDate": "2016-08-18T23:59:59-04:00",
				"stationsAffected": ["A15", "A14", "A13"],
				"linesAffected": ["RD"]
			},
			{
				"location": "Franconia-Springfield to Van Dorn Street",
				"description": "Single-tracking",
				"startDate": "2016-08-20T00:00:00-04:00",
				"endDate": "2016-09-05T23:59:59-04:00",
				"stationsAffected": ["J03", "J02"],
				"linesAffected": ["BL", "YL"]
			},
			{
				"location": "Vienna/Fairfax-GMU to West Falls Church-VT/UVA",
				"description": "Single-tracking",
				"startDate": "2016-09-09T00:00:00-04:00",
				"endDate": "2016-10-20T23:59:59-04:00",
				"stationsAffected": ["K08", "K07", "K06"],
				"linesAffected": ["OR"]
			},
			{
				"location": "Fort Totten to NoMa-Gallaudet U",
				"description": "Shutdown",
				"startDate": "2016-10-10T00:00:00-04:00",
				"endDate": "2016-11-01T23:59:59-04:00",
				"stationsAffected": ["B06", "E06", "B05", "B04", "B35"],
				"linesAffected": ["RD"]
			},
			{
				"location": "East Falls Church to West Falls Church-VT/UVA",
				"description": "Single-tracking",
				"startDate": "2016-11-02T22:00:00-04:00",
				"endDate": "2016-11-11T23:59:59-05:00",
				"stationsAffected": ["K05", "K06"],
				"linesAffected": ["OR", "SV"]
			},
			{
				"location": "Greenbelt to College Park-U of MD",
				"description": "Single-tracking",
				"startDate": "2016-11-12T00:00:00-05:00",
				"endDate": "2016-12-06T23:59:59-05:00",
				"stationsAffected": ["E10", "E09"],
				"linesAffected": ["GR", "YL"]
			},
			{
				"location": "Rosslyn to Pentagon",
				"description": "Shutdown",
				"startDate": "2016-12-07T00:00:00-05:00",
				"endDate": "2016-12-16T23:59:59-05:00",
				"stationsAffected": ["C05", "C06", "C07"],
				"linesAffected": ["BL"]
			},
			{
				"location": "Rosslyn to Pentagon",
				"description": "Shutdown",
				"startDate": "2016-12-17T10:00:00-05:00",
				"endDate": "2016-12-24T23:59:59-05:00",
				"stationsAffected": ["C05", "C06", "C07"],
				"linesAffected": ["BL"]
			},
			{
				"location": "Braddock Rd to Huntington and Van Dorn Street",
				"description": "Single-tracking",
				"startDate": "2017-01-02T00:00:00-05:00",
				"endDate": "2017-01-13T23:59:59-05:00",
				"stationsAffected": ["C12", "C13", "C14", "C15", "J02"],
				"linesAffected": ["YL", "BL"]
			},
			{
				"location": "Braddock Rd to Huntington and Van Dorn Street",
				"description": "Single-tracking",
				"startDate": "2017-01-22T22:00:00-05:00",
				"endDate": "2017-02-03T23:59:59-05:00",
				"stationsAffected": ["C12", "C13", "C14", "C15", "J02"],
				"linesAffected": ["YL", "BL"]
			},
			{
				"location": "East Falls Church to West Falls Church-VT/UVA",
				"description": "Single-tracking",
				"startDate": "2017-03-06T00:00:00-05:00",
				"endDate": "2017-03-19T23:59:59-04:00",
				"stationsAffected": ["K05", "K06"],
				"linesAffected": ["OR", "SV"]
			}
		],

		filterEvents: function(callback) {
			var events = this.events,
				e = events.length,
				found = [];

			while (e --) {
				var event = events[e],
					result = callback(event, e);

				if (result) {
					found.push(event);
				}
			}

			return found;
		},

		/**
		 * Finds an event that will be occuring on a given date.
		 */
		affectsAtDate: function(onDate, fromDate) {
			onDate = onDate || new Date();
			fromDate = fromDate || onDate;

			return this.filterEvents(function(event) {
				var begin = new Date(event.startDate),
					end = new Date(event.endDate);

				return (fromDate >= begin && onDate <= end);
			});
		},

		/**
		 * Finds an event that will be occurring at the current date.
		 */
		affectsNow: function() {
			return this.affectsAtDate();
		},

		/**
		 * Finds an event that will be occurring in the next `days` days.
		 */
		affectsSoon: function(days) {
			days = days === undefined ? 7 : days;

			var now = new Date(),
				soon = new Date(now.getTime() + (days * 24 * 3600 * 1000));

			return this.affectsAtDate(now, soon);
		},

		/**
		 * Finds events that affect a particular station (or stations).
		 */
		affectsStation: function(station) {
			var isStationObject = false;
			
			if (station instanceof Array) {
				station = station.map(function(item) {
					if (typeof station == 'object' && station.hasOwnProperty('Code')) {
						if (!isStationObject) {
							isStationObject = true;
						}
						return item;
					} else {
						return item.toUpperCase();
					}
				});
			} else if (typeof station == 'object' && station.hasOwnProperty('Code')) {
				isStationObject = true;
				station = [station.Code];
			} else {
				station = [station.toUpperCase()];
			}

			return this.filterEvents(function(event) {
				var s = station.length;
				
				while (s --) {
					if (isStationObject) {
						for (var l = 1, c; l < 5; l ++) {
							if ((c = station[s]['LineCode' + l])) {
								if (event.linesAffected.indexOf(c.toUpperCase()) > -1) {
									return true;
								}
							}
						}
					}

					if (event.stationsAffected.indexOf(station[s]) > -1) {
						return true;
					}
				}

				return false;
			});
		},

		/**
		 * Finds events that affect a particular line.
		 */
		affectsLine: function(line) {
			return this.filterEvents(function(event) {
				return event.linesAffected.indexOf(line.toUpperCase()) > -1;
			});
		},

		/**
		 * Finds if a given event is happening within the next `days` days.
		 */
		isSoon: function(event, days) {
			if (event) {
				days = days === undefined ? 7 : days;

				var now = new Date(),
					soon = new Date(now.getTime() + (days * 24 * 3600 * 1000)),
					begin = new Date(event.startDate),
					end = new Date(event.endDate);

				return (soon >= begin && now <= end);
			}

			return false;
		},
	};

	if (typeof module !== 'undefined') {
		module.exports = new Safetrack();
	}

	if (typeof window !== 'undefined') {
		window.Safetrack = new Safetrack();
	}

	return Safetrack;

})();
