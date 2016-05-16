/*
 * WMATA With You
 * SafeTrack events list and calculator functions
 * Via https://www.wmata.com/Images/Mrel/MF_Uploads/SAFETRACK-PUBLIC.pdf
 * HUGE thank you to James & Jen of @DCMetroHero for compiling this into JSON
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
				description: 'Franconia to Van Dorn',
				workType: 'Continuous single-tracking',
				startDate: '2016-06-04T00:00:00-04:00',
				endDate: '2016-06-19T23:59:59-04:00',
				directlyAffectedStations: ['J03', 'J02'],
				affectedLines: ['BL', 'YL+']
			}, {
				description: 'Greenbelt to College Park',
				workType: 'Continuous single-tracking',
				startDate: '2016-06-20T00:00:00-04:00',
				endDate: '2016-07-03T23:59:59-04:00',
				directlyAffectedStations: ['E09', 'E10'],
				affectedLines: ['GR', 'YL+']
			}, {
				description: 'National Airport to Braddock Road',
				workType: 'Full shutdown',
				startDate: '2016-07-05T22:00:00-04:00',
				endDate: '2016-07-12T23:59:59-04:00',
				directlyAffectedStations: ['C12', 'C10'],
				affectedLines: ['BL', 'YL', 'YL+']
			}, {
				description: 'National Airport to Pentagon City',
				workType: 'Full shutdown',
				startDate: '2016-07-12T00:00:00-04:00',
				endDate: '2016-07-19T23:59:59-04:00',
				directlyAffectedStations: ['C10', 'C09', 'C08'],
				affectedLines: ['BL', 'YL', 'YL+']
			}, {
				description: 'Greenbelt to College Park',
				workType: 'Continuous single-tracking',
				startDate: '2016-07-20T00:00:00-04:00',
				endDate: '2016-07-31T23:59:59-04:00',
				directlyAffectedStations: ['E09', 'E10'],
				affectedLines: ['GR', 'YL+']
			}, {
				description: 'Takoma to Silver Spring',
				workType: 'Continuous single-tracking',
				startDate: '2016-08-01T00:00:00-04:00',
				endDate: '2016-08-08T23:59:59-04:00',
				directlyAffectedStations: ['B07', 'B08'],
				affectedLines: ['RD']
			}, {
				description: 'Shady Grove to Twinbrook',
				workType: 'Continuous single-tracking',
				startDate: '2016-08-09T00:00:00-04:00',
				endDate: '2016-08-19T23:59:59-04:00',
				directlyAffectedStations: ['A15', 'A14', 'A13'],
				affectedLines: ['RD']
			}, {
				description: 'Eastern Market to Minnesota/Benning',
				workType: 'Full shutdown',
				startDate: '2016-08-20T00:00:00-04:00',
				endDate: '2016-09-06T23:59:59-04:00',
				directlyAffectedStations: ['D06', 'D07', 'D08', 'D09', 'G01'],
				affectedLines: ['OR', 'BL', 'SV']
			}, {
				description: 'Vienna to West Falls Church',
				workType: 'Continuous single-tracking',
				startDate: '2016-09-09T00:00:00-04:00',
				endDate: '2016-10-21T23:59:59-04:00',
				directlyAffectedStations: ['K08', 'K07', 'K06'],
				affectedLines: ['OR']
			}, {
				description: 'NoMa to Fort Totten',
				workType: 'Full shutdown',
				startDate: '2016-10-09T00:00:00-04:00',
				endDate: '2016-11-02T23:59:59-04:00',
				directlyAffectedStations: ['B35', 'B04', 'B05', 'B06'],
				affectedLines: ['RD']
			}, {
				description: 'West Falls Church to East Falls Church',
				workType: 'Continuous single-tracking',
				startDate: '2016-11-02T00:00:00-04:00',
				endDate: '2016-11-12T23:59:59-05:00',
				directlyAffectedStations: ['K06', 'K05'],
				affectedLines: ['OR', 'SV']
			}, {
				description: 'East Falls Church to Ballston',
				workType: 'Continuous single-tracking',
				startDate: '2016-11-12T00:00:00-05:00',
				endDate: '2016-12-05T23:59:59-05:00',
				directlyAffectedStations: ['K05', 'K04'],
				affectedLines: ['OR', 'SV']
			}, {
				description: 'Pentagon to Rosslyn',
				workType: 'Full shutdown',
				startDate: '2016-12-06T00:00:00-05:00',
				endDate: '2016-12-24T23:59:59-05:00',
				directlyAffectedStations: ['C07', 'C06', 'C05'],
				affectedLines: ['BL', 'YL', 'YL+', 'OR', 'SV']
			}, {
				description: 'Friendship Heights to Medical Center',
				workType: 'Single-tracking after 8pm',
				startDate: '2017-01-02T20:00:00-05:00',
				endDate: '2017-03-07T23:59:59-05:00',
				directlyAffectedStations: ['A10', 'A09', 'A08'],
				affectedLines: ['RD']
			}, {
				description: 'West Falls Church to East Falls Church',
				workType: 'Continuous single-tracking',
				startDate: '2017-03-06T00:00:00-05:00',
				endDate: '2017-03-14T23:59:59-04:00',
				directlyAffectedStations: ['K06', 'K05'],
				affectedLines: ['OR', 'SV']
			}, {
				description: 'Braddock Road to Huntington/Van Dorn',
				workType: 'Continuous single-tracking',
				startDate: '2017-04-16T00:00:00-04:00',
				endDate: '2017-05-08T23:59:59-04:00',
				directlyAffectedStations: ['C12', 'C13', 'C14', 'C15', 'J02'],
				affectedLines: ['YL', 'YL+', 'BL']
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
			if (station instanceof Array) {
				station = station.map(function(item) {
					return item.toUpperCase();
				});
			} else {
				station = [station.toUpperCase()];
			}

			return this.filterEvents(function(event) {
				var c = station.length;

				while (c --) {
					if (event.directlyAffectedStations.indexOf(station[c]) > -1) {
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
				return event.affectedLines.indexOf(line.toUpperCase()) > -1;
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
