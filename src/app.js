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
var wmata_incidents_url = 'https://api.wmata.com/Incidents.svc/json/Incidents';

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
	console.log("asking user for location");
	navigator.geolocation.getCurrentPosition(load_closest_stations);
}

/*
 * Finds the stations closest to the user's `position`.
 */
function load_closest_stations (position)
{
	var stations_url = wmata_stations_url + '?api_key=' + wmata_api_key;
	var stations_list = new UI.Menu({ sections: [{ title: 'Nearby stations', items: [{ title: 'Loading...'}] }] });
	stations_list.show();
	
	var my_lat = position.coords.latitude;
	var my_lon = position.coords.longitude;
	
	// debug from the corner of K and 15th NW
	//var my_lat = 38.902394;
	//var my_lon = -77.033570;
	
	console.log("got location: " + my_lat + " " + my_lon);
	console.log("loading stations at url: " + stations_url);
	
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
	var trains_url = wmata_trains_url + station.Code + '?api_key=' + wmata_api_key;
	var trains_list = new UI.Menu({ sections: [{ title: station.Name, items: [{ title: 'Loading...' }] }] });
	trains_list.show();
	
	console.log("loading trains from url: " + trains_url);
	
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

function load_about()
{
	var about_card = new UI.Card({
		title: "About",
		body: "WMATA With You\nversion 1.3\nby Alex Lindeman\nael.me/wwy\n\nBuilt with pebble.js and the WMATA Transparent Datasets API.",
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
