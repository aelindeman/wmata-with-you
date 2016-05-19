/*
 * WMATA With You
 * Helper functions
 * Alex Lindeman <aelindeman@gmail.com>
 */
(function() {
	'use strict';

	// apparently Pebble.js ships with Moment as well, neato
	var Moment = require('vendor/moment');

	function Helpers() {
		return this;
	}

	Helpers.prototype = {

		// Capitalizes individual words in a string
		caps: function(str) {
			return str.toLowerCase().replace(/\b./g, function (a) {
				return a.toUpperCase();
			});
		},

		// Un-abbreviates a line name into the color
		color: function(line) {
			switch (String(line).toLowerCase()) {
				case 'rd':
					return 'Red';
				case 'or':
					return 'Orange';
				case 'yl':
					return 'Yellow';
				case 'gr':
					return 'Green';
				case 'bl':
					return 'Blue';
				case 'sv':
					return 'Silver';
			}
		},

		// Concatenates a station's lines into an array
		concat_rail: function(station, prettify) {
			var l = [];
			for (var i = 1, c; i < 5; i ++) { // LineCode[1-4]
				if ((c = station['LineCode' + i])) {
					l.push((prettify) ?
						this.color(c) :
						c.toLowerCase()
					);
				}
			}
			return l;
		},

		// Concatenates bus routes together
		// Also removes suffixes from alternate routes
		concat_bus: function(stop) {
			return stop.Routes
				.join(' ')
				.replace(/((\w+v[0-9]+)(,\s)?|(,\s)?(\w+v[0-9]))/g, '')
				.toUpperCase();
		},

		// Calculates distance between coordinate points
		distance: function(x1, y1, x2, y2) {
			var dx = Math.pow(x2 - x1, 2),
				dy = Math.pow(y2 - y1, 2);
			return Math.pow(dx + dy, 0.5);
		},

		// Formats a date object and returns it in a human-readable format.
		format_date: function(date, with_time) {
			return Moment(date).format('MMM. Do' + (with_time ? ' h:mm a' : ''));
		},
		
		// Returns the second argument if the first is equal to 1, or the third if it is not
		plural: function(number, if_plural, if_not_plural) {
			return number == 1 ? if_not_plural : if_plural;
		},

		// Un-abbreviates an arrival time and adds an appropriate suffix
		time_left: function(time) {
			switch (String(time).toLowerCase()) {
				case 'brd':
					return 'Boarding';
				case '0':
				case 'arr':
					return 'Arriving';

				case '1':
					return '1 minute';
				case '60':
					return '1 hour';

				// WMATA sometimes doesn't supply a time when the train hasn't moved in a while
				// Apparently this is intentional, but will be changed in favor of a new 'IsDelayed' object property in mid-2017
				case '':

				// WMATA may also add the 'DLY' status in summer 2016 for SafeTrack rebuilding
				case 'dly':
					return 'Delayed';
			}

			return (time < 60) ?
				time + ' minutes' :
				Math.floor(time / 60) + ' hr ' + (time % 60) + ' min';
		},

		// Converts a 24-hour time to a 12-hour one
		time_to_12h: function(time) {
			var halves = time.split(':');

			return (halves[0] == 12) ?
				'12:' + halves[1] + ' PM' :
			(halves[0] === 0) ?
				'12:' + halves[1] + ' AM' :
			(halves[0] > 12) ?
				String(halves[0] - 12).replace(/00/, '12') + ':' + halves[1] + ' PM' :
				String(halves[0]).replace('00', '12').replace(/^0/, '') + ':' + halves[1] + ' AM';
		},

	};

	if (typeof module !== 'undefined') {
		module.exports = new Helpers();
	}

	if (typeof window !== 'undefined') {
		window.Helpers = new Helpers();
	}

	return Helpers;

})();
