'use strict'

let request = require('supertest');
let assert = require('assert');
let R = require('ramda');

const expressVersions = [ '4.14.0', '4.7.0', '4.1.0', '3.4.0', '3.1.0' ];

expressVersions.map(expressVersion => {

	const app = require('./test-app/app')(require('./express' + expressVersion));
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

		it('return a response from a normal endpoint', function () {
		  return get('/normal')
			  .then(res => {
				assert.equal(res.status, 200)
				assert.deepEqual(res.body, { ok: true })
			  });
		});

		it('return a response from a swagger document', function () {
		  return get('/stephen')
			  .then(res => {
				assert.equal(res.status, 200)
				assert.deepEqual(res.text, 'Blah1')
			  });
		});

		it('return a response from a normal endpoint after the swagger doc', function () {
		  return get('/afterNormal')
			  .then(res => {
				assert.equal(res.status, 200)
				assert.deepEqual(res.body, { after_ok: true })
			  });
		});

		it('return a response a swagger endpoint with custom middleware', function () {
		  return get('/stephen/work')
			  .then(res => {
				assert.equal(res.status, 200)
				assert.deepEqual(res.text, 'Blah2')
			  });
		});

		it('return a response a swagger endpoint with custom middleware that redirects', function () {
		  return get('/stephen/redirect')
			  .then(res => {
				assert.equal(res.status, 200)
				assert.deepEqual(res.text, 'redirect')
			  });
		});

		it('return a response a swagger endpoint with custom middleware that redirects with qs', function () {
		  return get('/stephen/qs?qs=true')
			  .then(res => {
				assert.equal(res.status, 200)
				assert.deepEqual(res.text, 'redirect')
			  });
		});

		it('return a response a swagger endpoint with custom middleware that does not redirect with qs', function () {
		  return get('/stephen/qs?qs=false')
			  .then(res => {
				assert.equal(res.status, 200)
				assert.deepEqual(res.text, 'Blah2')
			  });
		});
	});

})