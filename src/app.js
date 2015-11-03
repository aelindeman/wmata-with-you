/*
 * WMATA With You
 *
 * Alex Lindeman <aelindeman@gmail.com>
 */

console.log('init app.js');

/* @group Dependencies, globals, and API URLs */

var UI = require('ui');
var Ajax = require('ajax');
var Settings = require('settings');

var wmata_api_key = 'tdzzks35mmn4qxjg9mxp324v';

var wmata_stations_url = 'https://api.wmata.com/Rail.svc/json/jStations';
var wmata_station_info_url = 'https://api.wmata.com/Rail.svc/json/jStationInfo';
var wmata_station_times_url = 'https://api.wmata.com/Rail.svc/json/jStationTimes';
var wmata_trains_url = 'https://api.wmata.com/StationPrediction.svc/json/GetPrediction/';
var wmata_incidents_url = 'https://api.wmata.com/Incidents.svc/json/Incidents';

var wmata_bus_stops_url = 'https://api.wmata.com/Bus.svc/json/jStops';
var wmata_bus_routes_url = 'https://api.wmata.com/Bus.svc/json/jRoutes';
var wmata_buses_url = 'https://api.wmata.com/NextBusService.svc/json/jPredictions';

console.log ('init finshed: globals');

/* @end */
/* @group Settings configuration */

Settings.config({
	url: 'http://aelindeman.github.io/wmata-with-you/'
}, function (e) {
	console.log('opening config: ' + JSON.stringify(e));
}, function (e) {
	console.log('closing config: ' + JSON.stringify(e));
});

var buses_first = parseInt(Settings.option('buses-first')) == 1 || false;
var highlight_color = Settings.option('selection-color') || 'cadetBlue';

console.log ('init finished: user settings');

/* @end */
/* @group Helper functions */

/*
 * Un-abbreviates train arrival times (`time`), and adds a "minute(s)" suffix.
 */
function tr_time (time)
{
	switch (String(time))
	{
		case '---': return 'Eventually';
		case '0': case 'ARR': return 'Arriving';
		case 'BRD': return 'Boarding';
		case '1': return '1 minute';
		case '60': return '1 hour';
		default: return (time < 60) ?
			time + ' minutes' : Math.floor(time / 60) + ' hr ' + (time % 60) + ' min';
	}
}

/*
 * Translates station line code (`line`) into text.
 */
function tr_line (line)
{
	switch (line.toLowerCase())
	{
		case 'rd': return 'Red';
		case 'or': return 'Orange';
		case 'yl': return 'Yellow';
		case 'gr': return 'Green';
		case 'bl': return 'Blue';
		case 'sv': return 'Silver';
	}
}

/*
 * Concatenates `s`tations' lines into one string, and (optionally) `p`rettifies it.
 */
function concat_line_codes (s, p)
{
	var l = [];
	for (var i = 1; i < 5; i ++) // LineCode[1-4]
	{
		var c = s['LineCode' + i];
		if (c) l.push(p ? tr_line(c) : c.toLowerCase());
	}
	return l;
}

/*
 * Concatenates bus `l`ines into one string, removing weirdo "alternate" routes.
 */
function concat_bus_routes (l)
{
	return l.Routes
		.join(' ')
		.replace(/((\w+v[0-9]+)(,\s)?|(,\s)?(\w+v[0-9]))/g, '') // remove "alternate" routes (ending in v[0-9]+) and commas around them
		.toUpperCase();
}

/*
 * Capitalizes individual words in a string.
 */
function capitalize (s)
{
    return s.toLowerCase().replace(/\b./g, function (a) {
		return a.toUpperCase();
	});
}

/*
 * The distance formula.
 */
function distance (x1, y1, x2, y2)
{
	var dx = Math.pow(x2 - x1, 2);
	var dy = Math.pow(y2 - y1, 2);

	return Math.pow(dx + dy, 0.5);
}

/*
 * Converts 24-hour time strings to a 12-hour one.
 */
function convert_time (time)
{
	var halves = time.split(':'), new_time;
	halves[0] = Math.abs(halves[0]);
	new_time = (halves[0] == 12) ?
		'12:' + halves[1] + ' PM' :
	(halves[0] === 0) ?
		'12:' + halves[1] + ' AM' :
	(halves[0] > 12) ?
		(halves[0] - 12) + ':' + halves[1] + ' PM' :
		halves[0] + ':' + halves[1] + ' AM';

	return new_time;
}

console.log('init finished: helper functions');

/* @end */
/* @group User functions */

/*
 * Finds the stations closest to the user's location.
 */
function load_closest_stations ()
{	
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
	
	// debug from the corner of K and 15th NW
	//var my_lat = 38.902394;
	//var my_lon = -77.033570;
	
	navigator.geolocation.getCurrentPosition(
		function (position) {
			var my_lat = position.coords.latitude;
			var my_lon = position.coords.longitude;
			
			var stations_url = wmata_stations_url + '?api_key=' + wmata_api_key;
			var bus_stops_url = wmata_bus_stops_url + '?api_key=' + wmata_api_key;
			// why does this functionality only exist in the bus API...
			//bus_stops_url += '&Lat=38.902394&Lon=-77.033570&Radius=1000';
			bus_stops_url += '&Lat=' + my_lat + '&Lon=' + my_lon + '&Radius=2000';
			
			function sort_by_distance (a, b) {
				return distance(my_lat, my_lon, a.Lat, a.Lon) - distance(my_lat, my_lon, b.Lat, b.Lon);
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
				if (data.Stations.length > 0)
				{
					data.Stations.sort(sort_by_distance);
					for (var s = 0; s < max; s ++)
					{
						var station = data.Stations[s];
						stations_list.item((buses_first ? 1 : 0), s, {
							title: station.Name,
							subtitle: concat_line_codes(station, true).join(', '),
							info: station // stash station info in menu element to use on select/long press
						});
					}
				}
				else
				{
					stations_list.items((buses_first ? 1 : 0), [{ title: 'No stations nearby' }]);
				}
			}, ajax_error);
			
			// load bus stations
			new Ajax({
				url: bus_stops_url,
				type: 'json'
			}, function (data) {
				if (data.Stops.length > 0)
				{
					data.Stops.sort(sort_by_distance); // not sure if they're already sorted by distance
					var added = 0;
					for (var s in data.Stops)
					{
						var stop = data.Stops[s];
						if (String(stop.StopID) != '0')
						{
							stations_list.item((buses_first ? 0 : 1), added, {
								title: capitalize(stop.Name),
								subtitle: concat_bus_routes(stop),
								info: stop
							});
							added ++;
						}
						
						if (added > max) break; 
					}
				}
				else
				{
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
		},
		{ timeout: 10000, maximumAge: 30000 }
	);
		
	stations_list.on('select', function (e) {
		if (e.item.hasOwnProperty('info'))
		{
			//console.log(JSON.stringify(e.item.info));
			switch (e.sectionIndex)
			{
				case (buses_first ? 1 : 0):
					load_trains(e.item.info);
					break;
				case (buses_first ? 0 : 1):
					load_buses(e.item.info);
					break;
			}
		}
		else console.log ('item at [' + e.sectionIndex + ',' + e.itemIndex + '] did not have "info" property');
	});
	stations_list.on('longSelect', function (e) {
		if (e.item.hasOwnProperty('info'))
		{
			//console.log(JSON.stringify(e.item.info));
			switch (e.sectionIndex)
			{
				case (buses_first ? 1 : 0):
					load_station_info(e.item.info);
					break;
				case (buses_first ? 0 : 1):
					load_bus_stop_info(e.item.info);
					break;
			}
		}
		else console.log ('item at [' + e.sectionIndex + ',' + e.itemIndex + '] did not have "info" property');
	});
}

console.log('init finished: ui function load_closest_stations');

/*
 * Loads a list of stations & bus stops according to the user's settings.
 */
function load_saved_stations()
{
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
	
	// debug with Friendship Heights and Wilson & Glebe
	//var train_debug = {"Code":"A08","Name":"Friendship Heights","StationTogether1":"","StationTogether2":"","LineCode1":"RD","LineCode2":null,"LineCode3":null,"LineCode4":null,"Lat":38.960744,"Lon":-77.085969,"Address":{"Street":"5337 Wisconsin Avenue NW","City":"Washington","State":"DC","Zip":"20015"}};
	//var bus_debug = {"StopID":"6000925","Name":"WILSON BLVD + N GLEBE RD","Lon":-77.112601,"Lat":38.880057,"Routes":["1A","1B","1E","25B","25Bv1","25Bv2","2A","38B"]};
		
	var saved_stations = JSON.parse(Settings.option('saved-rail'));
	if (saved_stations !== undefined && saved_stations.length > 0)
	{
		for (var t in saved_stations)
		{
			var station = saved_stations[t];
			saved_list.item((buses_first ? 1 : 0), t, {
				title: station.Name,
				subtitle: concat_line_codes(station, true).join(', '),
				info: station // stash station info in menu element to use on select/long press
			});
		}
	}
	else
	{
		saved_list.item((buses_first ? 1 : 0), 0, { title: 'None saved' });
	}
	
	var saved_stops = JSON.parse(Settings.option('saved-bus'));
	if (saved_stops !== undefined && saved_stops.length > 0)
	{
		for (var b in saved_stops)
		{
			var stop = saved_stops[b];
			saved_list.item((buses_first ? 0 : 1), b, {
				title: capitalize(stop.Name),
				subtitle: concat_bus_routes(stop),
				info: stop
			});
		}
	}
	else
	{
		saved_list.item((buses_first ? 0 : 1), 0, { title: 'None saved' });
	}
	
	var invalid_setting = (saved_stations === undefined && saved_stops === undefined);
	if ((!invalid_setting && saved_stations.length + saved_stops.length === 0) || invalid_setting)
	{		
		var card = new UI.Card({
			title: 'Nothing saved',
			body: 'Use the Pebble app on your phone to add stations.'
		});
		saved_list.hide();
		card.show();
	}
	
	saved_list.on('select', function (e) {
		if (e.item.hasOwnProperty('info'))
		{
			console.log(JSON.stringify(e.item.info));
			switch (e.sectionIndex)
			{
				case (buses_first ? 1 : 0):
					load_trains(e.item.info);
					break;
				case (buses_first ? 0 : 1):
					load_buses(e.item.info);
					break;
			}
		}
		else console.log ('item at [' + e.sectionIndex + ',' + e.itemIndex + '] did not have "info" property');
	});
	saved_list.on('longSelect', function (e) {
		if (e.item.hasOwnProperty('info'))
		{
			console.log(JSON.stringify(e.item.info));
			switch (e.sectionIndex)
			{
				case (buses_first ? 1 : 0):
					load_station_info(e.item.info);
					break;
				case (buses_first ? 0 : 1):
					load_bus_stop_info(e.item.info);
					break;
			}
		}
		else console.log ('item at [' + e.sectionIndex + ',' + e.itemIndex + '] did not have "info" property');
	});
}

console.log('init finished: ui function load_saved_stations');

/*
 * Loads trains passing through `station` into a menu.
 */
function load_trains(station)
{
	var trains_url = wmata_trains_url + station.Code + '?api_key=' + wmata_api_key;
	var trains_list = new UI.Menu({
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
		if (data.Trains.length > 0)
		{
			var added = 0;
			for (var t in data.Trains)
			{
				var train = data.Trains[t];
				if (train.DestinationName == 'No Passenger')
					continue;
				else if (train.DestinationName == 'Train')
					trains_list.item(0, added, { title: tr_time(train.Min), subtitle: 'Train' });
				else
					trains_list.item(0, added, { title: tr_time(train.Min), subtitle: 'to ' + train.DestinationName, icon: 'images/' + train.Line.toLowerCase() + '.png' });
				
				added ++;
			}
			trains_list.on('accelTap', function(e) {
				trains_list.hide();
				load_trains(station);
			});
		}
		else
		{
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

/*
 * Loads next arrival times for buses stopping at `stop`.
 */
function load_buses (stop)
{
	var buses_url = wmata_buses_url + '?StopID=' + stop.StopID + '&api_key=' + wmata_api_key;
	var buses_list = new UI.Menu({
		highlightBackgroundColor: highlight_color,
		sections: [{
			title: capitalize(stop.Name),
			items: [{ title: 'Loading...' }]
		}]
	});
	buses_list.show();
	
	new Ajax({
		url: buses_url,
		type: 'json'
	}, function (data) {
		if (data.Predictions.length > 0)
		{
			var added = 0;
			for (var b in data.Predictions)
			{
				var bus = data.Predictions[b];
				buses_list.item(0, added, { title: bus.RouteID + ': ' + tr_time(bus.Minutes), subtitle: bus.DirectionText });
				added ++;
			}
			buses_list.on('accelTap', function(e) {
				buses_list.hide();
				load_buses(stop);
			});
		}
		else
		{
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

console.log('init finished: ui function load_{trains,buses}');

/*
 * Loads information for a specified station.
 */
function load_station_info (station)
{
	var station_info_url = wmata_station_info_url + '?StationCode=' + station.Code + '&api_key=' + wmata_api_key;
	var station_times_url = wmata_station_times_url + '?StationCode=' + station.Code + '&api_key=' + wmata_api_key;
	var body = '';
	
	var card = new UI.Card({
		title: station.Name,
		subtitle: concat_line_codes(station, true).join(', '),
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
		var date = new Date();
		var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		var today = weekdays[date.getDay()];
		
		var opens_at = convert_time(times_data.StationTimes[0][today].OpeningTime);
		var last_train = convert_time(times_data.StationTimes[0][today].LastTrains[0].Time);
		
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
	var bus_routes_url = wmata_bus_routes_url + '?&api_key=' + wmata_api_key;
	var body = 'Routes that stop here:\n';
	
	var card = new UI.Card({
		title: capitalize(stop.Name),
		subtitle: concat_bus_routes(stop),
		scrollable: true,
		style: 'small'
	});
	card.show();
	
	// display details for routes through the stop
	new Ajax({
		url: bus_routes_url,
		type: 'json'
	}, function (data) {
		for (var r in data.Routes) // for each route
		{
			var route = data.Routes[r];
			if (stop.Routes.indexOf(route.RouteID) > -1)
			{
				body = body + capitalize(route.Name) + '\n';
				card.body(body);
			}
		}
	}, function (error, code) {
		console.log ('Error getting route info (' + code + '): ' + JSON.stringify(error));
		card.body(body);
	});
}

console.log('init finished: ui function load_{station,stop}_info');

/*
 * Loads rail incidents in the WMATA system.
 */
function load_incidents()
{
	var incidents_url = wmata_incidents_url + '?api_key=' + wmata_api_key;
	var incidents = new UI.Menu({
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
		if (data.Incidents.length > 0)
		{
			for (var i in data.Incidents)
			{
				var incident = data.Incidents[i];
				incidents.item(0, i, { title: incident.IncidentType, subtitle: incident.Description.substring(0, 31) });
			}
			
			incidents.on('select', function (e) {
				var card = new UI.Card({
					title: data.Incidents[e.itemIndex].IncidentType,
					body: data.Incidents[e.itemIndex].Description,
					scrollable: true
				});
				card.show();
			});
		}
		else
		{
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

console.log('init finished: ui function load_incidents');

/*
 * Display info about the app.
 */
function load_about()
{
	var about_card = new UI.Card({
		title: 'About',
		body: 'WMATA With You\nversion 2.0\nby Alex Lindeman\nael.me/wwy\n\nBuilt with pebble.js and the WMATA Transparent Datasets API.',
		scrollable: true
	});
	about_card.show();
}

console.log('init finished: ui function load_about');

/* @end */
/* @group Main body */

var main = new UI.Menu({
	highlightBackgroundColor: highlight_color,
	sections: [{
		// title: "WMATA With You",
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
	switch (e.itemIndex)
	{
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

console.log('init finished: primary ui');

/* @end */
