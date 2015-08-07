/*
 * WMATA With You
 *
 * Alex Lindeman <aelindeman@gmail.com>
 */

var UI = require('ui');
var Ajax = require('ajax');

var wmata_api_key = 'tdzzks35mmn4qxjg9mxp324v';
var wmata_stations_url = 'https://api.wmata.com/Rail.svc/json/jStations';
var wmata_trains_url = 'https://api.wmata.com/StationPrediction.svc/json/GetPrediction/';
var wmata_station_info_url = 'https://api.wmata.com/Rail.svc/json/jStationInfo';
var wmata_station_times_url = 'https://api.wmata.com/Rail.svc/json/jStationTimes';
var wmata_incidents_url = 'https://api.wmata.com/Incidents.svc/json/Incidents';
var wmata_busstops_url = 'https://api.wmata.com/Bus.svc/json/jStops';
var wmata_busses_url = 'https://api.wmata.com/NextBusService.svc/json/jPredictions';

/*
 * Un-abbreviates train arrival times (`time`), and adds a "minute(s)" suffix.
 */
function tr_time (time)
{
	switch (time)
	{
		case '---': return 'Eventually';
		case 'ARR': return 'Arriving';
		case 'BRD': return 'Boarding';
		case '1': return '1 minute';
		default: return time + ' minutes';
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
	var line = s.LineCode1;
	if (p)
	{
		line = tr_line(line);
		if (s.LineCode2) line += (", " + tr_line(s.LineCode2));
		if (s.LineCode3) line += (", " + tr_line(s.LineCode3));
		if (s.LineCode4) line += (", " + tr_line(s.LineCode4));
	}
	else
	{
		line = line.toLowerCase();
		if (s.LineCode2) line += ("," + s.LineCode2.toLowerCase());
		if (s.LineCode3) line += ("," + s.LineCode3.toLowerCase());
		if (s.LineCode4) line += ("," + s.LineCode4.toLowerCase());
	}
	return line;
}

/*
 * Deduplicate bus routes such as 80, 80v1 to just 80
 */
function dedup_bus_routes (routes)
{
  var deduped_routes = [];
  for (var r in routes)
  {
    var route = routes[r].replace(/([A-Z]?[0-9]+[A-Z]?)([cv]+[1-9]?)?/, '$1');
    if (deduped_routes.indexOf(route) < 0) deduped_routes.push(route);
  }
  return deduped_routes;
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
		new_time = '12:' + halves[1] + ' PM' :
	(halves[0] === 0) ?
		new_time = '12:' + halves[1] + ' AM' :
	(halves[0] > 12) ?
		(halves[0] - 12) + ':' + halves[1] + ' PM' :
		halves[0] + ':' + halves[1] + ' AM';

	return new_time;
}

/*
 * Finds the stations closest to the user's location.
 */
function load_closest_stations ()
{
	var stations_url = wmata_stations_url + '?api_key=' + wmata_api_key;
	var stations_list = new UI.Menu({ sections: [{ title: 'Nearby stations', items: [{ title: 'Loading...'}] }] });
	stations_list.show();
	
	// debug from the corner of K and 15th NW
	//var my_lat = 38.902394;
	//var my_lon = -77.033570;
	
	navigator.geolocation.getCurrentPosition(
		function (position) {
			var my_lat = position.coords.latitude;
			var my_lon = position.coords.longitude;

			new Ajax({
				url: stations_url,
				type: 'json'
			}, function (data) {
				data.Stations.sort(function (a, b) {
					return distance(my_lat, my_lon, a.Lat, a.Lon) - distance(my_lat, my_lon, b.Lat, b.Lon);
				});
				var max = 8; // maximum number of closest stations to list
				for (var s = 0; s < max; s ++)
					stations_list.item(0, s, { title: data.Stations[s].Name, subtitle: concat_line_codes(data.Stations[s], true) });
				stations_list.on('select', function (e) {
					load_trains(data.Stations[e.itemIndex]);
				});
				stations_list.on('longSelect', function (e) {
					load_station_info(data.Stations[e.itemIndex]);
				});
			}, function (error) {
				console.log('Error getting stations: ' + error);
				var card = new UI.Card({
					title: 'Error',
					body: error
				});
				stations_list.hide();
				card.show();
			});
		}, function (error) {
			console.log("Could not get location: " + error);
			var card = new UI.Card({
				title: error.message,
				body: 'Make sure your phone has a lock on your location, and that the Pebble app has permission to access it.',
				scrollable: true
			});
			stations_list.hide();
			card.show();
		},
		{ timeout: 10000, maximumAge: 30000 });
}

/*
 * Loads trains passing through `station` into a menu.
 */
function load_trains(station)
{
	var trains_url = wmata_trains_url + station.Code + '?api_key=' + wmata_api_key;
	var trains_list = new UI.Menu({ sections: [{ title: station.Name, items: [{ title: 'Loading...' }] }] });
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
				if (data.Trains[t].DestinationName == 'No Passenger')
					continue;
				else if (data.Trains[t].DestinationName == 'Train')
					trains_list.item(0, added, { title: tr_time(data.Trains[t].Min), subtitle: 'Train' });
				else
					trains_list.item(0, added, { title: tr_time(data.Trains[t].Min), subtitle: 'to ' + data.Trains[t].DestinationName, icon: 'images/' + data.Trains[t].Line.toLowerCase() + '.png' });
				
				added ++;
			}
			trains_list.on('select', function (e) {
				trains_list.hide();
				load_trains(station);
			});
		}
		else
		{
			var card = new UI.Card({
				title: station.Name,
				body: 'No trains are currently scheduled to stop at this station.',
				scrollable: true
			});
			trains_list.hide();
			card.show();
		}
	}, function (error) {
		var card = new UI.Card({
			title: 'Error',
			body: error,
			scrollable: true
		});
		console.log('Error getting trains: ' + error);
		trains_list.hide();
		card.show();
	});
}

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
		subtitle: concat_line_codes(station, true),
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
	}, function (error) {
		console.log('Error getting station info: ' + error);
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
	}, function (error) {
		console.log('Error getting station open/close times: ' + error);
		body = body + '\nError getting station open/close times.';
		card.body(body);
	});
}

/*
 * Loads rail incidents in the WMATA system.
 */
function load_incidents()
{
	var incidents_url = wmata_incidents_url + '?api_key=' + wmata_api_key;
	var incidents = new UI.Menu({ sections: [{ title: 'Advisories', items: [{ title: 'Loading...' }] }] });
	incidents.show();
	
	var card = new UI.Card({
		title: 'Advisory',
		body: 'Loading...',
		scrollable: true
	});
	
	new Ajax ({
		url: incidents_url,
		type: 'json'
	}, function (data) {
		if (data.Incidents.length > 0)
		{
			for (var t in data.Incidents)
				incidents.item(0, t, { title: data.Incidents[t].IncidentType, subtitle: data.Incidents[t].Description.substring(0, 31) });

			incidents.on('select', function (e) {
				card.title(data.Incidents[e.itemIndex].IncidentType);
				card.body(data.Incidents[e.itemIndex].Description);
				card.show();
			});
		}
		else
		{
			card.title('Advisories');
			card.body('There are no advisories.');
			incidents.hide();
			card.show();
		}
	}, function (error) {
		console.log('Error getting advisories: ' + error);
		card.title('Error');
		card.body(error);
		incidents.hide();
		card.show();
	});
	
	
}

/*
 * Finds the bus stops closest to the user's location.
 */
function load_closest_busstops ()
{
	var busstops_list = new UI.Menu({ sections: [{ title: 'Nearby bus stops', items: [{ title: 'Loading...'}] }] });
	busstops_list.show();

	// debug from the corner of K and 15th NW
	//var my_lat = 38.902394;
	//var my_lon = -77.033570;

	navigator.geolocation.getCurrentPosition(
		function (position) {
			var my_lat = position.coords.latitude;
			var my_lon = position.coords.longitude;
			var busstops_url = wmata_busstops_url + '?Radius=500&api_key=' + wmata_api_key + '&Lat=' + my_lat + '&Lon=' + my_lon;

			new Ajax({
				url: busstops_url,
				type: 'json'
			}, function (data) {
				var max = 8; // maximum number of closest stations to list
				for (var s = 0; s < max; s ++)
					busstops_list.item(0, s, { title: data.Stops[s].Name, subtitle: dedup_bus_routes(data.Stops[s].Routes).join(',') });
				busstops_list.on('select', function (e) {
					load_busses(data.Stops[e.itemIndex]);
				});
			}, function (error) {
				console.log('Error getting bus stops: ' + error);
				var card = new UI.Card({
					title: 'Error',
					body: error
				});
				busstops_list.hide();
				card.show();
			});
		}, function (error) {
			console.log("Could not get location: " + error);
			var card = new UI.Card({
				title: error.message,
				body: 'Make sure your phone has a lock on your location, and that the Pebble app has permission to access it.',
				scrollable: true
			});
			busstops_list.hide();
			card.show();
		},
		{ timeout: 10000, maximumAge: 30000 });
}

/*
 * Loads busses stoping at `stop` into a menu.
 */
function load_busses(stop)
{
	var busses_url = wmata_busses_url + '?api_key=' + wmata_api_key + '&StopID=' + stop.StopID;
	var busses_list = new UI.Menu({ sections: [{ title: stop.Name, items: [{ title: 'Loading...' }] }] });
	busses_list.show();

	new Ajax({
		url: busses_url,
		type: 'json'
	}, function (data) {
		if (data.Predictions.length > 0)
		{
			var added = 0;
			for (var b in data.Predictions)
			{
        busses_list.item(0, added, { title: data.Predictions[b].RouteID + ': ' + tr_time(data.Predictions[b].Minutes), subtitle: data.Predictions[b].DirectionText });

				added ++;
			}
			busses_list.on('select', function (e) {
				busses_list.hide();
				load_busses(stop);
			});
		}
		else
		{
			var card = new UI.Card({
				title: stop.Name,
				body: 'No busses are currently scheduled to stop at this stop.',
				scrollable: true
			});
			busses_list.hide();
			card.show();
		}
	}, function (error) {
		var card = new UI.Card({
			title: 'Error',
			body: error,
			scrollable: true
		});
		console.log('Error getting busses: ' + error);
		busses_list.hide();
		card.show();
	});
}


function load_about()
{
	var about_card = new UI.Card({
		title: "About",
		body: "WMATA With You\nversion 1.6\nby Alex Lindeman and Daniel Schep\nael.me/wwy\n\nBuilt with pebble.js and the WMATA Transparent Datasets API.",
		scrollable: true
	});
	about_card.show();
}

/*
 * Main body
 */
var main = new UI.Menu({
	sections: [{
		title: "WMATA With You",
		items: [{
			title: 'Stations',
			icon: 'images/location.png'
		}, {
			title: 'Advisories',
			icon: 'images/incidents.png'
		}, {
			title: 'Bus Stops',
			icon: 'images/bus.png'
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
			load_incidents();
			break;
		case 2:
			load_closest_busstops();
			break;
		case 3:
			load_about();
			break;
	}
});
