'use strict';

let expect = require('chai').expect;
const sinon = require('sinon');

const simpleSwaggerDoc = require('./swagger-docs/simpleSwagger.json');
const complexSwaggerDoc = require('./swagger-docs/complexSwagger.json');
const multipleVerbsSwagger = require('./swagger-docs/multipleVerbsSwagger.json');
const multipleMiddlewaresSwagger = require('./swagger-docs/multipleMiddlewaresSwagger.json');
const invalidSwaggerDoc = require('./swagger-docs/invalidSwagger.json');
const functionNotFoundSwaggerDoc = require('./swagger-docs/functionNotFoundSwagger.json');
const swaggerRouter = require('../../lib');

const middleware = { test: require('./test-middleware/middleware'), testAnother: require('./test-middleware/middlewareAnother') };

describe('Swagger Router', () => {
  let mockRouter;

  beforeEach(() => {
    mockRouter = {
      get: sinon.spy(),
      post: sinon.spy()
    };
  });

  it('should set up a simple route', () => {
    swaggerRouter.setUpRoutes(middleware, mockRouter, simpleSwaggerDoc);
    expect(mockRouter.get.calledWith('/stephen', middleware.test.swagTest)).to.equal(true);
  });

  it('should set up more than one route', () => {
    swaggerRouter.setUpRoutes(middleware, mockRouter, complexSwaggerDoc);
    expect(mockRouter.get.calledWith('/stephen', middleware.test.swagTest)).to.equal(true);
    expect(mockRouter.get.calledWith('/stephen/:name', middleware.test.swagTestName)).to.equal(true);
  });

  it('should set up more than one verbs for a single route', () => {
    swaggerRouter.setUpRoutes(middleware, mockRouter, multipleVerbsSwagger);
    expect(mockRouter.get.calledWith('/stephen', middleware.test.swagTest)).to.equal(true);
    expect(mockRouter.post.calledWith('/stephen', middleware.test.swagTestPost)).to.equal(true);
    expect(mockRouter.get.calledWith('/stephen/:name', middleware.test.swagTestName)).to.equal(true);
  });

  it('should set up more than one route from different middleware', () => {
    swaggerRouter.setUpRoutes(middleware, mockRouter, multipleMiddlewaresSwagger);
    expect(mockRouter.get.calledWith('/stephen', middleware.test.swagTest)).to.equal(true);
    expect(mockRouter.get.calledWith('/stephen/:name', middleware.testAnother.anotherSwagTest)).to.equal(true);
  });

  it('should not set up an invalid route', () => {
    swaggerRouter.setUpRoutes(middleware, mockRouter, invalidSwaggerDoc);
    expect(mockRouter.get.called).to.equal(false);
  });

  it('should not set up an invalid route where function do not exist', () => {
    swaggerRouter.setUpRoutes(middleware, mockRouter, functionNotFoundSwaggerDoc);
    expect(mockRouter.get.called).to.equal(false);
  });

  it('should set up a simple route with basePath', () => {
    swaggerRouter.setUpRoutes(middleware, mockRouter, simpleSwaggerDoc, true);
  	expect(mockRouter.get.calledWith('/api/swagger/v1/stephen', middleware.test.swagTest)).to.equal(true);
  });

  it('should set up more than one route with basePath', () => {
  	swaggerRouter.setUpRoutes(middleware, mockRouter, complexSwaggerDoc, true);
 	expect(mockRouter.get.calledWith('/api/swagger/v1/stephen', middleware.test.swagTest)).to.equal(true);
  	expect(mockRouter.get.calledWith('/api/swagger/v1/stephen/:name', middleware.test.swagTestName)).to.equal(true);
  });

});