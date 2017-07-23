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
		events: [],

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
			var stations = [];

			if (station instanceof Array) {
				stations = station.map(function(item) {
					if (typeof item == 'object' && item.hasOwnProperty('Code')) {
						return item.Code;
					} else {
						return item;
					}
				});
			} else if (typeof station == 'object' && station.hasOwnProperty('Code')) {
				stations = [station.Code];
			} else {
				stations = [station];
			}

			return this.filterEvents(function(event) {
				var s = stations.length;
				while (s --) {
					if (event.stationsAffected.indexOf(stations[s].toUpperCase()) > -1) {
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
