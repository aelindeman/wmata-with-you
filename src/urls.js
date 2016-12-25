/*
 * WMATA With You
 * URL constants
 * Alex Lindeman <aelindeman@gmail.com>
 */
(function() {
	'use strict';

	function Urls() {
		return this;
	}

	Urls.prototype = {
		key: '__WMATA_API_KEY__',
		api: {

			// WMATA API - bus endpoints
			bus: {
				stops: 'https://api.wmata.com/Bus.svc/json/jStops',
				routes: 'https://api.wmata.com/Bus.svc/json/jRoutes',
				buses: 'https://api.wmata.com/NextBusService.svc/json/jPredictions'
			},

			// WMATA API - rail endpoints
			rail: {
				stations: 'https://api.wmata.com/Rail.svc/json/jStations',
				station_info: 'https://api.wmata.com/Rail.svc/json/jStationInfo',
				station_times: 'https://api.wmata.com/Rail.svc/json/jStationTimes',
				trains: 'https://api.wmata.com/StationPrediction.svc/json/GetPrediction',
				incidents: 'https://api.wmata.com/Incidents.svc/json/Incidents'
			}

		},

		// Generates a URL string from an object of query parameters
		make: function(endpoint, options) {
			var base = endpoint.split('.'),
				url;

			if (endpoint == 'rail.trains') {
				url = this.api[base[0]][base[1]] + '/' + options.station.Code + '?api_key=' + this.key;
			} else {
				url = this.api[base[0]][base[1]] + '?api_key=' + this.key;
			}

			for (var o in options) {
				url += '&' + encodeURIComponent(o) + '=' +
					encodeURIComponent(options[o]);
			}

			return url;
		}
	};

	if (typeof module !== 'undefined') {
		module.exports = new Urls();
	}

	if (typeof window !== 'undefined') {
		window.Urls = new Urls();
	}

	return Urls;

})();
