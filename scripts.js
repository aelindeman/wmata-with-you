"use_strict";

/* @group storage globals */

var wmata_api_key = 'tdzzks35mmn4qxjg9mxp324v';
var saved_bus = [];
var saved_rail = [];

/* @end */
/* @group element globals */

var buses_first_field = $('#buses-first');
var closest_things_field = $('#closest-things');
var selection_color_field = $('#selection-color');

/* @end */
/* @group WMATA API utils */

/* @group helpers */

// translate single line code into a real word
function tr_line (l)
{
	switch (l.toLowerCase())
	{
		case 'rd': return 'Red';
		case 'or': return 'Orange';
		case 'yl': return 'Yellow';
		case 'gr': return 'Green';
		case 'bl': return 'Blue';
		case 'sv': return 'Silver';
	}
}

// concat station LineCode# into array of lines
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

// concat bus lines into one string, removing "alternate" routes
function concat_bus_routes (l)
{
	return l.Routes
		.join(' ')
		.replace(/((\w+v[0-9]+)(,\s)?|(,\s)?(\w+v[0-9]))/g, '') // remove "alternate" routes (ending in v[0-9]+) and commas around them
		.toUpperCase();
}

/* @end */


// rail station autocomplete
var rail_ap = new Awesomplete(document.getElementById('add-saved-rail-field'), {
	replace: function(text) {
		var stop = text.indexOf('\t');
		this.input.value = text.substring(0, stop);
	}
});

$.ajax({
	url: 'https://api.wmata.com/Rail.svc/json/jStations?api_key=' + wmata_api_key,
	dataType: 'jsonp',
	cache: true,
	success: function(data) {
		var autocomplete_list = [], match_list = [];
		$.each(data.Stations, function(k, v) {
			autocomplete_list.push(v.Code + ' ' + v.Name + '\t' + concat_line_codes(v).map(function(l) {
				return '<span class="l ' + l + '"><span class="hidden">' + tr_line(l) + '</span></span>';
			}).join(''));
			match_list.push(v);
		});
		rail_ap.list = autocomplete_list;
		rail_ap.evaluate();

		var button = $('#add-saved-rail-button').click(function() {
			// now we have to match it back
			var input = $('#add-saved-rail-field');

			var find = autocomplete_list.searchFor(input.val().substring(0, 10));
			if (find > -1) {
				var match = match_list[find];
				saved_rail.push(match);
				create_save_list_entry('rail', match);
				console.log('added ' + input.val());
				input.val(null);
			} else {
				console.log('no match for ' + input.val());
			}
		});

		console.log('loaded rail autocomplete (' + data.Stations.length + ')');
	},
	error: function() {
		console.error('could not rail station autocomplete data');
	}
});

// bus stop autocomplete
var bus_ap = new Awesomplete(document.getElementById('add-saved-bus-field'), {
	replace: function(text) {
		var stop = text.indexOf('\t');
		this.input.value = text.substring(0, stop);
	}
});
$.ajax({
	url: 'https://api.wmata.com/Bus.svc/json/jStops?api_key=' + wmata_api_key,
	dataType: 'jsonp',
	cache: true,
	success: function(data) {
		var autocomplete_list = [], match_list = [];

		$.each(data.Stops, function(k, v) {
			autocomplete_list.push(v.StopID + ' ' + v.Name.capitalize().replace('+', '&') + '\t<span class="r">' + concat_bus_routes(v) + '</span>');
			match_list.push(v);
		});
		bus_ap.list = autocomplete_list;
		bus_ap.evaluate();

		var button = $('#add-saved-bus-button').click(function() {
			// now we have to match it back
			var input = $('#add-saved-bus-field');

			var find = autocomplete_list.searchFor(input.val().substring(0, 10));
			if (find > -1) {
				var match = match_list[find];
				saved_bus.push(match);
				create_save_list_entry('bus', match);
				console.log('added ' + input.val());
				input.val(null);
			} else {
				console.log('no match for ' + input.val());
			}
		});
		
		console.log('loaded bus autocomplete (' + data.Stops.length + ')');
	},
	error: function() {
		console.error('could not bus stop autocomplete data');
	}
});

/* @end */
/* @group dom listeners */

// restore settings/set defaults when the page loads
$(document).ready(function() {
	console.log(localStorage.length > 0 ? 'loading existing settings' : 'loading default settings');
	buses_first_field.val(localStorage['buses-first'] || 0);
	closest_things_field.val(localStorage['closest-things'] || 6);
	selection_color_field.val(localStorage['selection-color'] || 'cadetBlue');
	try {
		saved_bus = JSON.parse(localStorage['saved-bus']);
		saved_rail = JSON.parse(localStorage['saved-rail']);
	} catch (e) {
		console.warn('could not load saved rail/bus, probably malformed json: ' + e);
	}

	if (saved_rail.length > 0) {
		for (var r = 0; r < saved_rail.length; r ++) {
			create_save_list_entry('rail', saved_rail[r]);
		}
	}

	if (saved_bus.length > 0) {
		for (var b = 0; b < saved_bus.length; b ++) {
			create_save_list_entry('bus', saved_bus[b]);
		}
	}

	$('#selection-color-preview').attr('class', $('#selection-color').val());
	$('#selection-color').on('change', function() {
		$('#selection-color-preview').attr('class', $('#selection-color').val());
	});

	// discard changes button
	$(document).on('click', '#do-discard', function() {
		console.log('canceling');
		var return_to = get_query_param('return_to', 'pebblejs://close#');
		if (confirm('Are you sure? Your changes will not be saved.')) {
			document.location = return_to;
		}
	});

	// save button
	$(document).on('click', '#do-submit', function() {
		console.log('submitting');
		var errors = validate();
		if (errors) {
			alert('Fix these things first:\n* ' + errors.join('\n* '));
			return false;
		}
		var data = save_config_data();
		var return_to = get_query_param('return_to', 'pebblejs://close#');
		document.location = return_to + encodeURIComponent(JSON.stringify(data));
	});

	// defaults button
	$(document).on('click', '#do-defaults', function() {
		if (confirm('Are you sure? Your settings will be cleared.')) {
			localStorage.clear();
			window.location.reload();
		}
	});

	// move-up arrows
	$(document).on('click', '.actions .move-up', function() {
		var dom_el = $(this).parents('.saved-list > li');

		// what's being moved?
		switch (dom_el.parent().attr('id')) {
			case 'saved-rail':
				data_el = saved_rail;
				prop = 'Code';
				break;
			case 'saved-bus':
				data_el = saved_bus;
				prop = 'StopID';
				break;
		}

		// find it
		for (var i = 0; i < data_el.length; i ++) {
			if (data_el[i][prop] == dom_el.data('id')) {
				console.log ('move up ' + data_el[i].Name);
				data_el = data_el.move(i, --i);

				// move the dom element
				var previous = dom_el.prev('li');
				if (previous.length !== 0) {
					dom_el.insertBefore(previous);
				}
				break;
			}
		}
	});

	// move-down arrows
	$(document).on('click', '.actions .move-down', function() {
		var dom_el = $(this).parents('.saved-list > li');
		
		// what type of thing is being moved?
		switch (dom_el.parent().attr('id')) {
			case 'saved-rail':
				data_el = saved_rail;
				prop = 'Code';
				break;
			case 'saved-bus':
				data_el = saved_bus;
				prop = 'StopID';
				break;
		}

		// find it
		for (var i = 0; i < data_el.length; i ++) {
			if (data_el[i][prop] == dom_el.data('id')) {
				console.log ('move down ' + data_el[i].Name);
				data_el = data_el.move(i, ++i);
				
				// move the dom element
				var next = dom_el.next('li');
				if (next.length !== 0) {
					dom_el.insertAfter(next);
				}
				break;
			}
		}
	});

	// remove buttons
	$(document).on('click', '.actions .remove', function() {
		var dom_el = $(this).parents('.saved-list > li');
		var data_el, prop;

		// what's being removed?
		switch (dom_el.parent().attr('id')) {
			case 'saved-rail':
				data_el = saved_rail;
				prop = 'Code';
				break;
			case 'saved-bus':
				data_el = saved_bus;
				prop = 'StopID';
				break;
		}

		// find it
		for (var i = 0; i < data_el.length; i ++) {
			if (data_el[i][prop] == dom_el.data('id')) {
				console.log ('deleted ' + data_el[i][prop]);
				data_el = data_el.splice(i, 1);
				dom_el.remove();
				break;
			}
		}
	});
});

/* @end */
/* @group helpers */

// prototype for moving array elements around
// stolen from http://stackoverflow.com/a/5306832
Array.prototype.move = function(old_index, new_index) {
	if (new_index >= this.length) {
		var k = new_index - this.length;
		while ((k --) + 1) {
			this.push(undefined);
		}
	}
	this.splice(new_index, 0, this.splice(old_index, 1)[0]);
	return this;
};

// find by case-insensitive string in array
Array.prototype.searchFor = function(term) {
	for (var i = 0; i < this.length; i ++) {
		if (this[i].toLowerCase().indexOf(term.toLowerCase()) === 0) {
			return i;
		}
	}
	return -1;
};

// recapitalize names
String.prototype.capitalize = function()
{
    return this.toLowerCase().replace(/\b./g, function (a) {
		return a.toUpperCase();
	});
};

// passes station/stop data through Jade to create list entries
function create_save_list_entry(type, item) {
	var locals = {};
	switch (type) {
		case 'rail':
			locals = {
				n: item.Name,
				i: item.Code,
				l: concat_line_codes(item)
			};
			break;
		case 'bus':
			locals = {
				n: item.Name.capitalize().replace('+', '&'),
				i: item.StopID,
				b: concat_bus_routes(item)
			};
			break;
	}
	var content = template(locals);
	$('#saved-' + type).append(content);
}

// validation
function validate() {
	var errors = [];

	var closest_things = parseInt(closest_things_field.val());
	if (!closest_things || closest_things > 20 || closest_things < 2)
		errors.push('Closest things must be between 2 and 20');

	return (errors.length > 0) ? errors : false;
}

/* @end */
/* @group pebble-specific */

// gets parameter from url
// stolen from http://github.com/pebble-examples/slate-config-example : config/index.html
function get_query_param(variable, default_value) {
	var query = location.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		if (pair[0] === variable) {
			return decodeURIComponent(pair[1]);
		}
	}
	return default_value || false;
}

// gathers configuration from the page
function get_config_data() {
	var options = {
		'buses-first': buses_first_field.val(),
		'closest-things': closest_things_field.val(),
		'selection-color': selection_color_field.val(),
		'saved-bus': JSON.stringify(saved_bus),
		'saved-rail': JSON.stringify(saved_rail),
		'date': new Date()
	};
	return options;
}

// puts config in local storage so we don't have to fetch later
function save_config_data() {
	var options = get_config_data();
	for (var v in options) {
		if (options[v] !== undefined) {
			localStorage[v] = options[v];
		}
	}
	return options;
}

/* @end */
