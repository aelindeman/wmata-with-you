var expect = require('expect');
var u = require('../src/urls.js');

describe('Urls', function() {

	before(function() {
		u.key = 'test-key';
	});

	describe('properties', function() {
		it('should be an object with lots of api urls', function() {
			expect(u.api).toBeAn(Object);
			expect(u.api.bus).toBeAn(Object);
			expect(u.api.rail).toBeAn(Object);
		});
	});

	describe('.api', function() {
		it('has only wmata api urls for api object properties', function() {
			for (var mode in u.api) {
				for (var endpoint in u.api[mode]) {
					expect(u.api[mode][endpoint]).toMatch(/^https:\/\/api.wmata.com\//);
				}
			}
		});
	});

	describe('make()', function() {
		it('makes urls', function() {
			expect(u.make('rail.stations')).toMatch(/^https:\/\/api.wmata.com\//);
			expect(u.make('bus.stops')).toMatch(/^https:\/\/api.wmata.com\//);
		});
		it('appends the api key', function() {
			expect(u.make('rail.stations')).toContain('?api_key=test-key');
			expect(u.make('bus.stops')).toContain('?api_key=test-key');
		});
		it('adds parameters to urls from objects', function() {
			expect(u.make('rail.stations', { a: 'foo', b: 'bar' })).toMatch(/a=foo&b=bar$/);
			expect(u.make('bus.stops', { a: 'foo', b: 'bar' })).toMatch(/a=foo&b=bar$/);
		});
	});

});
