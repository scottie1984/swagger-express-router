'use strict'

let request = require('supertest');
let assert = require('assert');
let R = require('ramda');

const expressVersions = [ '4.14.0', '4.7.0', '4.1.0', '3.4.0', '3.1.0' ];

expressVersions.map(expressVersion => {

	const app = require('./test-app/appBasePath')(require('./express' + expressVersion));
	function get(resource) {
		 return new Promise((resolve, reject) => {
			request(app)
			   .get(resource)
			   .end(function (err, res) {
					resolve(res)
			   });
		 })
	}

	describe('swagger-router version ' + expressVersion, function() {

		it('return a 404 from an endpoint that doesnt exist', function () {
		  return get('/api/not-there')
			  .then(res => {
				assert.equal(res.status, 404)
			  });
		});

		it('return a response from a swagger document', function () {
		  return get('/api/swagger/v1/stephen')
			  .then(res => {
				assert.equal(res.status, 200)
				assert.deepEqual(res.text, 'Blah1')
			  });
		});
	});

});