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
				"location": "Rosslyn - Pentagon",
				"description": "Blue Line will only operate between Franconia-Springfield and National Airport",
				"startDate": "2017-02-11T00:00:00-05:00",
				"endDate": "2017-02-28T23:59:59-05:00",
				"stationsAffected": ["C05", "C06", "C07"],
				"linesAffected": ["BL"]
			},
			{
				"location": "Braddock Road - Huntington/Van Dorn Street",
				"description": "Single-tracking will reduce Yellow and Blue Line service",
				"startDate": "2017-03-04T00:00:00-05:00",
				"endDate": "2017-04-09T23:59:59-04:00",
				"stationsAffected": ["C12", "C13", "C14", "C15", "J02"],
				"linesAffected": ["BL", "YL"]
			},
			{
				"location": "Greenbelt - College Park",
				"description": "Single-tracking will reduce Green Line service",
				"startDate": "2017-04-01T20:00:00-04:00",
				"endDate": "2017-04-30T23:59:59-04:00",
				"stationsAffected": ["E10", "E09"],
				"linesAffected": ["GR"]
			},
			{
				"location": "Minnesota Avenue - New Carrollton",
				"description": "Single-tracking will reduce Orange Line service",
				"startDate": "2017-05-01T00:00:00-04:00",
				"endDate": "2017-05-31T23:59:59-04:00",
				"stationsAffected": ["D09", "D10", "D11", "D12", "D13"],
				"linesAffected": ["OR"]
			},
			{
				"location": "Shady Grove - Twinbrook",
				"description": "Single-tracking will reduce Red Line service",
				"startDate": "2017-06-01T00:00:00-04:00",
				"endDate": "2017-06-30T23:59:59-04:00",
				"stationsAffected": ["A15", "A14", "A13"],
				"linesAffected": ["RD"]
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
