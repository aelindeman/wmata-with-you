/*
 * WMATA With You
 * A Pebble smartwatch app for navigating public transportation in Washington, DC
 * Alex Lindeman <aelindeman@gmail.com>
 */
(function() {
	'use strict';

	// Pebble.js dependencies
	var UI = require('ui'),
		Ajax = require('ajax'),
		Settings = require('settings');

	// WMATA API key and URLs
	var wmata = {
		key: 'tdzzks35mmn4qxjg9mxp324v',
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
				trains: 'https://api.wmata.com/StationPrediction.svc/json/GetPrediction/',
				incidents: 'https://api.wmata.com/Incidents.svc/json/Incidents'
			}
		}
	};

	var buses_first = parseInt(Settings.option('buses-first')) == 1 || false,
		highlight_color = Settings.option('selection-color') || 'cadetBlue';

	// Initialize configuration
	Settings.config({
		url: 'http://aelindeman.github.io/wmata-with-you/'
	}, function (e) {
		console.log('opening config: ' + JSON.stringify(e));
	}, function (e) {
		console.log('closing config: ' + JSON.stringify(e));

		// update global preferences on close
		buses_first = parseInt(Settings.option('buses-first')) == 1 || false;
		highlight_color = Settings.option('selection-color') || 'cadetBlue';
	});

	// Helper functions
	var Helpers = {

		// Capitalizes individual words in a string
		caps: function(str) {
			return str.toLowerCase().replace(/\b./g, function (a) {
				return a.toUpperCase();
			});
		},

		// Un-abbreviates a line name into the color
		color: function(line) {
			switch (String(line).toLowerCase()) {
				case 'rd': return 'Red';
				case 'or': return 'Orange';
				case 'yl': return 'Yellow';
				case 'gr': return 'Green';
				case 'bl': return 'Blue';
				case 'sv': return 'Silver';
			}
		},

		// Concatenates a station's lines into an array
		concat_rail: function(station, prettify) {
			var l = [];
			for (var i = 1, c; i < 5; i ++) { // LineCode[1-4]
				if ((c = station['LineCode' + i])) {
					l.push((prettify) ?
						Helpers.color(c) :
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

		// Un-abbreviates an arrival time and adds an appropriate suffix
		time_left: function(time) {
			switch (String(time).toLowerCase()) {
				case '---': return 'Eventually';
				case 'brd': return 'Boarding';
				case '0': case 'arr': return 'Arriving';
				case '1': return '1 minute';
				case '60': return '1 hour';
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
				(halves[0] - 12) + ':' + halves[1] + ' PM' :
				halves[0] + ':' + halves[1] + ' AM';
		},

		// Generates a URL string from an object of query parameters
		url: function(endpoint, options) {
			var base = endpoint.split('.'),
				url = wmata.api[base[0]][base[1]] + '?api_key=' + wmata.key;

			for (var o in options) {
				url += '&' + encodeURIComponent(o) + '=' +
					encodeURIComponent(options[o]);
			}

			return url;
		}

	};

	// Finds the stations closest to the user's location
	function load_closest_stations() {
		var stations_list = new UI.Menu({
			highlightBackgroundColor: highlight_color,
			sections: [{
				title: (buses_first ? 'Buses' : 'Trains'),
				items: [{ title: 'Loading...' }]
			}, {
				title: (buses_first ? 'Trains' : 'Buses'),
				items: [{ title: 'Loading...' }]
			}]
		});
		stations_list.show();

		navigator.geolocation.getCurrentPosition(
			function (position) {
				var my_lat = position.coords.latitude,
					my_lon = position.coords.longitude,
					stations_url = Helpers.url('rail.stations'),
					bus_stops_url = Helpers.url('bus.stops', {
						Lat: my_lat,
						Lon: my_lon,
						Radius: 2000
					});

				function sort_by_distance (a, b) {
					return Helpers.distance(my_lat, my_lon, a.Lat, a.Lon) - Helpers.distance(my_lat, my_lon, b.Lat, b.Lon);
				}

				function ajax_error (error, code) {
					console.log('Error getting stations/stops (' + code + '): ' + error);
					var card = new UI.Card({
						title: 'Error',
						body: error
					});
					stations_list.hide();
					card.show();
				}

				// maximum number of closest stations/bus stops to list (per group)
				var max = parseInt(Settings.option('closest-things')) || 6;

				// load rail stations
				new Ajax({
					url: stations_url,
					type: 'json'
				}, function (data) {
					if (data.Stations.length > 0) {
						data.Stations.sort(sort_by_distance);
						for (var s = 0; s < max; s ++) {
							var station = data.Stations[s];
							stations_list.item((buses_first ? 1 : 0), s, {
								title: station.Name,
								subtitle: Helpers.concat_rail(station, true).join(', '),
								info: station // stash station info in menu element to use on select/long press
							});
						}
					} else {
						stations_list.items((buses_first ? 1 : 0), [{ title: 'No stations nearby' }]);
					}
				}, ajax_error);

				// load bus stations
				new Ajax({
					url: bus_stops_url,
					type: 'json'
				}, function (data) {
					if (data.Stops.length > 0) {
						data.Stops.sort(sort_by_distance); // not sure if they're already sorted by distance
						var added = 0;
						for (var s in data.Stops) {
							var stop = data.Stops[s];
							if (String(stop.StopID) != '0') {
								stations_list.item((buses_first ? 0 : 1), added, {
									title: Helpers.caps(stop.Name),
									subtitle: Helpers.concat_bus(stop),
									info: stop
								});
								added ++;
							}

							if (added > max) break;
						}
					} else {
						stations_list.items((buses_first ? 0 : 1), [{ title: 'No stops nearby' }]);
					}
				}, ajax_error);
			}, function (error) {
				console.log('Location error: ' + JSON.stringify(error));
				var card = new UI.Card({
					title: 'Location error',
					body: 'Could not find your location; check your phone for warnings.',
					scrollable: true
				});
				stations_list.hide();
				card.show();
			}, {
				timeout: 10000,
				maximumAge: 30000
			}
		);

		stations_list.on('select', function (e) {
			if (e.item.hasOwnProperty('info')) {
				switch (e.sectionIndex) {
					case (buses_first ? 1 : 0):
						load_trains(e.item.info);
						break;
					case (buses_first ? 0 : 1):
						load_buses(e.item.info);
						break;
				}
			}
		});

		stations_list.on('longSelect', function (e) {
			if (e.item.hasOwnProperty('info')) {
				switch (e.sectionIndex) {
					case (buses_first ? 1 : 0):
						load_station_info(e.item.info);
						break;
					case (buses_first ? 0 : 1):
						load_bus_stop_info(e.item.info);
						break;
				}
			}
		});
	}

	// Loads a list of stations & bus stops according to the user's settings
	function load_saved_stations() {
		var saved_list = new UI.Menu({
			highlightBackgroundColor: highlight_color,
			sections: [{
				title: (buses_first ? 'Buses' : 'Trains'),
				items: [{ title: 'Loading...' }]
			}, {
				title: (buses_first ? 'Trains' : 'Buses'),
				items: [{ title: 'Loading...' }]
			}]
		});
		saved_list.show();

		var saved_stations;
		try {
			saved_stations = JSON.parse(Settings.option('saved-rail'));
		} catch (e) {
			saved_stations = [];
		}

		if (saved_stations !== undefined && saved_stations.length > 0) {
			for (var t in saved_stations) {
				var station = saved_stations[t];
				saved_list.item((buses_first ? 1 : 0), t, {
					title: station.Name,
					subtitle: Helpers.concat_rail(station, true).join(', '),
					info: station // stash station info in menu element to use on select/long press
				});
			}
		} else {
			saved_list.item((buses_first ? 1 : 0), 0, { title: 'None saved' });
		}

		var saved_stops;
		try {
			saved_stops = JSON.parse(Settings.option('saved-bus'));
		} catch (e) {
			saved_stops = [];
		}

		if (saved_stops !== undefined && saved_stops.length > 0) {
			for (var b in saved_stops) {
				var stop = saved_stops[b];
				saved_list.item((buses_first ? 0 : 1), b, {
					title: Helpers.caps(stop.Name),
					subtitle: Helpers.concat_bus(stop),
					info: stop
				});
			}
		} else {
			saved_list.item((buses_first ? 0 : 1), 0, { title: 'None saved' });
		}

		var invalid_setting = (saved_stations === undefined && saved_stops === undefined);
		if ((!invalid_setting && saved_stations.length + saved_stops.length === 0) || invalid_setting) {
			var card = new UI.Card({
				title: 'Nothing saved',
				body: 'Use the Pebble app on your phone to add stations.'
			});
			saved_list.hide();
			card.show();
		}

		saved_list.on('select', function (e) {
			if (e.item.hasOwnProperty('info')) {
				switch (e.sectionIndex) {
					case (buses_first ? 1 : 0):
						load_trains(e.item.info);
						break;
					case (buses_first ? 0 : 1):
						load_buses(e.item.info);
						break;
				}
			}
		});

		saved_list.on('longSelect', function (e) {
			if (e.item.hasOwnProperty('info')) {
				switch (e.sectionIndex) {
					case (buses_first ? 1 : 0):
						load_station_info(e.item.info);
						break;
					case (buses_first ? 0 : 1):
						load_bus_stop_info(e.item.info);
						break;
				}
			}
		});
	}

	// Loads next trains for a station
	function load_trains(station) {
		var trains_url = wmata.api.rail.trains + station.Code + '?api_key=' + wmata.key,
			trains_list = new UI.Menu({
				highlightBackgroundColor: highlight_color,
				sections: [{
					title: station.Name,
					items: [{ title: 'Loading...' }]
				}]
			});

		trains_list.show();

		new Ajax({
			url: trains_url,
			type: 'json'
		}, function (data) {
			if (data.Trains.length > 0) {
				var added = 0;

				for (var t in data.Trains) {
					var train = data.Trains[t];

					if (train.DestinationName == 'No Passenger') {
						continue;
					} else if (train.DestinationName == 'Train') {
						trains_list.item(0, added, {
							title: Helpers.time_left(train.Min),
							subtitle: 'Train'
						});
					} else {
						trains_list.item(0, added, {
							title: Helpers.time_left(train.Min),
							subtitle: 'to ' + train.DestinationName,
							icon: 'images/' + train.Line.toLowerCase() + '.png'
						});
					}

					added ++;
				}

				var reload = function(e) {
					trains_list.hide();
					load_trains(station);
				};

				trains_list.on('accelTap', reload);
				trains_list.on('select', reload);
			} else {
				trains_list.items(0, [{ title: 'None scheduled' }]);
			}
		}, function (error, code) {
			var card = new UI.Card({
				title: 'Error',
				body: JSON.stringify(error),
				scrollable: true
			});

			console.log('Error getting trains (' + code + '): ' + JSON.stringify(error));

			trains_list.hide();
			card.show();
		});
	}

	// Loads next buses for a stop
	function load_buses (stop) {
		var buses_url = Helpers.url('bus.buses', { StopID: stop.StopID }),
			buses_list = new UI.Menu({
				highlightBackgroundColor: highlight_color,
				sections: [{
					title: Helpers.caps(stop.Name),
					items: [{ title: 'Loading...' }]
				}]
			});

		buses_list.show();

		new Ajax({
			url: buses_url,
			type: 'json'
		}, function (data) {
			if (data.Predictions.length > 0) {
				var added = 0;

				for (var b in data.Predictions) {
					var bus = data.Predictions[b];
					buses_list.item(0, added, { title: bus.RouteID + ': ' + Helpers.time_left(bus.Minutes), subtitle: bus.DirectionText });
					added ++;
				}

				var reload = function(e) {
					buses_list.hide();
					load_buses(stop);
				};

				buses_list.on('accelTap', reload);
				buses_list.on('select', reload);
			} else {
				buses_list.items(0, [{ title: 'None scheduled' }]);
			}
		}, function (error, code) {
			var card = new UI.Card({
				title: 'Error',
				body: error,
				scrollable: true
			});

			console.log('Error getting buses (' + code + '): ' + JSON.stringify(error));

			buses_list.hide();
			card.show();
		});
	}

	// Loads information for a station
	function load_station_info (station) {
		var station_info_url = Helpers.url('rail.station_info', { StationCode: station.Code }),
			station_times_url = Helpers.url('rail.station_times', { StationCode: station.Code }),
			body = '',
			card = new UI.Card({
				title: station.Name,
				subtitle: Helpers.concat_rail(station, true).join(', '),
				scrollable: true,
				style: 'small'
			});

		card.show();

		new Ajax({
			url: station_info_url,
			type: 'json'
		}, function (station_data) {
			body = station_data.Address.Street + '\n' + station_data.Address.City + ', ' + station_data.Address.State + '\n' + body;
			card.body(body);
		}, function (error, code) {
			console.log('Error getting station info (' + code + '): ' + JSON.stringify(error));
			body = 'Error getting station info.\n' + body;
			card.body(body);
		});

		new Ajax({
			url: station_times_url,
			type: 'json'
		}, function (times_data) {
			// why would you make array indices this, WMATA API designer? this is a joke worse than friday night single-tracking
			var date = new Date(),
				weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
				today = weekdays[date.getDay()];

			var opens_at = Helpers.time_to_12h(times_data.StationTimes[0][today].OpeningTime),
				last_train = Helpers.time_to_12h(times_data.StationTimes[0][today].LastTrains[0].Time);

			body = body + '\nOpens: ' + opens_at  + '\nLast train: ' + last_train;
			card.body(body);
		}, function (error, code) {
			console.log('Error getting station open/close times (' + code + '): ' + error);
			body = body + '\nError getting station open/close times.';
			card.body(body);
		});
	}

	/*
	 * Loads information for a specified bus stop.
	 */
	function load_bus_stop_info (stop)
	{
		var bus_routes_url = Helpers.url('bus.routes'),
			body = 'Routes that stop here:\n',
			card = new UI.Card({
				title: Helpers.caps(stop.Name),
				subtitle: Helpers.concat_bus(stop),
				scrollable: true,
				style: 'small'
			});

		card.show();

		// display details for routes through the stop
		new Ajax({
			url: bus_routes_url,
			type: 'json'
		}, function (data) {
			for (var r in data.Routes) {
				var route = data.Routes[r];
				if (stop.Routes.indexOf(route.RouteID) > -1) {
					body = body + Helpers.caps(route.Name) + '\n';
					card.body(body);
				}
			}
		}, function (error, code) {
			console.log ('Error getting route info (' + code + '): ' + JSON.stringify(error));
			card.body(body);
		});
	}

	// Shows rail advisories
	function load_incidents() {
		var incidents_url = Helpers.url('rail.incidents'),
			incidents = new UI.Menu({
				highlightBackgroundColor: highlight_color,
				sections: [{
					title: 'Advisories',
					items: [{ title: 'Loading...' }]
				}]
			});

		incidents.show();

		new Ajax ({
			url: incidents_url,
			type: 'json'
		}, function (data) {
			if (data.Incidents.length > 0) {
				for (var i in data.Incidents) {
					var incident = data.Incidents[i];
					incidents.item(0, i, {
						title: incident.IncidentType,
						subtitle: incident.Description.substring(0, 31)
					});
				}

				incidents.on('select', function (e) {
					var card = new UI.Card({
						title: data.Incidents[e.itemIndex].IncidentType,
						body: data.Incidents[e.itemIndex].Description,
						scrollable: true
					});
					card.show();
				});
			} else {
				incidents.items(0, [{ title: 'No advisories' }]);
			}
		}, function (error, code) {
			var card = new UI.Card({
				title: 'Error',
				body: error,
				scrollable: true
			});
			console.log('Error getting advisories (' + code + '): ' + JSON.stringify(error));
			incidents.hide();
			card.show();
		});
	}

	// Displays info about the app
	function load_about() {
		var about_card = new UI.Card({
			title: 'About',
			body: 'WMATA With You\nversion 2.3\nby Alex Lindeman\nael.me/wwy\n\nBuilt with Pebble.js and the WMATA Transparent Datasets API.',
			scrollable: true
		});
		about_card.show();
	}

	// Run the main UI
	var main = new UI.Menu({
		highlightBackgroundColor: highlight_color,
		sections: [{
			items: [{
				title: 'Nearby',
				icon: 'images/location.png'
			}, {
				title: 'Saved',
				icon: 'images/star.png'
			}, {
				title: 'Advisories',
				icon: 'images/incidents.png'
			}, {
				title: 'About',
				icon: 'images/info.png'
			}]
		}]
	});
	main.show();
	main.on('select', function (e) {
		switch (e.itemIndex) {
			case 0:
				load_closest_stations();
				break;
			case 1:
				load_saved_stations();
				break;
			case 2:
				load_incidents();
				break;
			case 3:
				load_about();
				break;
		}
	});

})();
