/*
 * WMATA With You
 *
 * Alex Lindeman <aelindeman@gmail.com>
 */

var UI = require('ui');
var Ajax = require('ajax');

var wmata_api_key = 'tdzzks35mmn4qxjg9mxp324v';
var wmata_stations_url = 'http://api.wmata.com/Rail.svc/json/JStations';
var wmata_trains_url = 'http://api.wmata.com/StationPrediction.svc/json/GetPrediction/';
var wmata_incidents_url = 'http://api.wmata.com/Incidents.svc/json/Incidents';

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
 * Concatenates `s`tations with multiple platforms into one station code.
 */
function concat_station_codes (s)
{
	var code = s.Code;
	if (s.StationTogether1 !== '') code += (',' + s.StationTogether1);
	if (s.StationTogether2 !== '') code += (',' + s.StationTogether2);
	
	console.log('concatenated station ' + s.Name + ' as ' + code);
	return code;
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
 * Determines user's physical location.
 */
function determine_location()
{
	console.log('Attempting to determine location');
	navigator.geolocation.getCurrentPosition(load_closest_station);
}

/*
 * Attempts to find which station is closest to `position`, and then shows a menu of trains going through that station.
 */
function load_closest_station (position)
{
	var my_lat = position.coords.latitude;
	var my_lon = position.coords.longitude;
	
	new Ajax({
		url: wmata_stations_url + '?api_key=' + wmata_api_key,
		type: 'json'
	}, function (data) {
		var station_dist = 180;
		var closest;
		for (var s in data.Stations)
		{
			var dist = distance(my_lat, my_lon, data.Stations[s].Lat, data.Stations[s].Lon);
			if (dist < station_dist)
			{
				station_dist = dist;
				closest = data.Stations[s];
			}
		}
		console.log('closest station is ' + closest.Name);
		load_trains(closest);
	}, function (error) {
		console.log('Error getting closest station: ' + error);
		var card = new UI.Card({
			title: 'Error',
			body: error
		});
		card.show();
	});
}

/*
 * Loads the list of rail lines into a menu.
 */
function load_lines()
{
	console.log('Showing all lines');
	
	var lines_list = new UI.Menu({ sections: [{ items: [{ title: 'Loading...'}] }] });
	lines_list.show();
	
	var lines = ['rd', 'or', 'yl', 'gr', 'bl', 'sv'];
	
	for (var l in lines)
	{
		lines_list.item (0, l, {
			title: tr_line (lines[l]) + ' Line',
			line: lines[l],
			icon: 'images/' + lines[l] + '.png'
		});
	}
	lines_list.on('select', function (e)
	{
		load_stations(e.item.line);
	});
}

/*
 * Loads the stations on `line` into a menu.
 */
function load_stations (line)
{
	console.log('Showing stations on ' + tr_line(line));
	
	var stations_list = new UI.Menu({ sections: [{ title: tr_line(line) + ' Line', items: [{ title: 'Loading...'}] }] });
	stations_list.show();
	
	new Ajax({
		url: wmata_stations_url + '?LineCode=' + line + '&api_key=' + wmata_api_key,
		type: 'json'
	}, function (data) {
		if (data.Stations.length > 0)
		{
			for (var s in data.Stations)
			{
				console.log(s + '\t' + data.Stations[s].Name);
				stations_list.item(0, s, { title: data.Stations[s].Name });
			}
			stations_list.on('select', function (e) {
				load_trains(data.Stations[e.itemIndex]);
			});
		}
		else
		{
			var card = new UI.Card({
				title: tr_line(line) + ' Line',
				body: 'No stations are on this line.',
				scrollable: true
			});
			stations_list.hide();
			card.show();
		}
	}, function (error) {
		var card = new UI.Card({
			title: 'Error',
			body: error,
			scrollable: true
		});
		console.log('Error getting stations: ' + error);
		stations_list.hide();
		card.show();
	});
}

/*
 * Loads trains passing through `station` into a menu.
 */
function load_trains(station)
{
	console.log('Showing trains through ' + station.Name + ':');
	
	var trains_list = new UI.Menu({ sections: [{ title: station.Name, items: [{ title: 'Loading...' }] }] });
	trains_list.show();
	
	new Ajax({
		url: wmata_trains_url + '/' + concat_station_codes(station) + '?api_key=' + wmata_api_key,
		type: 'json'
	}, function (data) {
		if (data.Trains.length > 0)
		{
			console.log(data.Trains.length + ' trains');
			var added = 0;
			for (var t in data.Trains)
			{
				console.log(data.Trains[t].Min + '\t' + data.Trains[t].Line + '\t' + data.Trains[t].DestinationName);
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

function load_incidents()
{
	var card = new UI.Card({
		title: 'Incidents',
		body: 'Loading...',
		scrollable: true
	});
	
	new Ajax ({
		url: wmata_incidents_url + '?api_key=' + wmata_api_key,
		type: 'json'
	}, function (data) {
		if (data.Incidents.length > 0)
		{
			var str = '';
			for (var i in data.Incidents)
			{
				str += data.Incidents[i].IncidentType + ':\n' + data.Incidents[i].Description + '\n\n';
			}
			card.body(str);
		}
		else
		{
			card.body('There are no incidents.');
		}
		card.show();
	}, function (error) {
		console.log('Error getting incidents: ' + error);
		card.title('Error');
		card.body(error);
		card.show();
	});
	
	
}

function load_about()
{
	var about_card = new UI.Card({
		title: "About",
		body: "WMATA With You 0.9 (beta)\nby Alex Lindeman\nhttp://ael.me/\n\nBuilt with pebble.js and the WMATA Transparent Datasets API.",
		scrollable: true
	});
	about_card.show();
}

/*
 * Main body
 */
var main = new UI.Menu({
	sections: [{
		items: [{
			title: 'Closest station',
			icon: 'images/location.png'
		}, {
			title: 'Pick a station',
			icon: 'images/metro.png'
		}, {
			title: 'Incidents',
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
			determine_location();
			break;
		case 1:
			load_lines();
			break;
		case 2:
			load_incidents();
			break;
		case 3:
			load_about();
			break;
	}
});