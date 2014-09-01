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
	return code;
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
	navigator.geolocation.getCurrentPosition(load_closest_stations);
}

/*
 * Finds the stations closest to the user's `position`.
 */
function load_closest_stations (position)
{
	var stations_list = new UI.Menu({ sections: [{ title: 'Nearby stations', items: [{ title: 'Loading...'}] }] });
	stations_list.show();
	
	var my_lat = position.coords.latitude;
	var my_lon = position.coords.longitude;
	
	new Ajax({
		url: wmata_stations_url + '?api_key=' + wmata_api_key,
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
	}, function (error) {
		console.log('Error getting stations: ' + error);
		var card = new UI.Card({
			title: 'Error',
			body: error
		});
		stations_list.hide();
		card.show();
	});
}

/*
 * Loads trains passing through `station` into a menu.
 */
function load_trains(station)
{
	var trains_list = new UI.Menu({ sections: [{ title: station.Name, items: [{ title: 'Loading...' }] }] });
	trains_list.show();
	
	new Ajax({
		url: wmata_trains_url + '/' + concat_station_codes(station) + '?api_key=' + wmata_api_key,
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

function load_incidents()
{
	var card = new UI.Card({
		title: 'Advisories',
		body: 'Loading...',
		scrollable: true
	});
	card.show();
	
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
			card.body('There are no advisories.');
		}
		card.show();
	}, function (error) {
		console.log('Error getting advisories: ' + error);
		card.title('Error');
		card.body(error);
	});
	
	
}

function load_about()
{
	var about_card = new UI.Card({
		title: "About",
		body: "WMATA With You\nversion 1.0\nby Alex Lindeman\nhttp://ael.me/\n\nBuilt with pebble.js and the WMATA Transparent Datasets API.",
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
			title: 'Stations',
			icon: 'images/location.png'
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
			determine_location();
			break;
		case 1:
			load_incidents();
			break;
		case 2:
			load_about();
			break;
	}
});