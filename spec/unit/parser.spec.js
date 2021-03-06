'use strict';

let expect = require('chai').expect;

const simpleSwaggerDoc = require('./swagger-docs/simpleSwagger.json');
const multipleVerbsSwagger = require('./swagger-docs/multipleVerbsSwagger.json');
const parser = require('../../lib/parser');

describe('Parse swagger doc', () => {

  it('should parse a simple swagger doc', () => {
    const expectedDoc = parser(simpleSwaggerDoc);
    expect(expectedDoc).to.deep.equal([
		{
			path: '/stephen',
			verb: 'get',
			controller: 'test',
			middlewareFunction: 'swagTest'
		}
    ]);
  });

  it('should parse a swagger doc with multiple verbs', () => {
	  const expectedDoc = parser(multipleVerbsSwagger);
	  expect(expectedDoc).to.deep.equal([
		{
			path: '/stephen/{name}',
			verb: 'get',
			controller: 'test',
			middlewareFunction: 'swagTestName'
		},
		{
			path: '/stephen',
			verb: 'get',
			controller: 'test',
			middlewareFunction: 'swagTest'
		},
		{
			path: '/stephen',
			verb: 'post',
			controller: 'test',
			middlewareFunction: 'swagTestPost'
		}
	  ]);
  });

});