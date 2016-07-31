'use strict';

const R = require('ramda');
const parser = require('./parser');

const isWrappedInCurlyBraces = R.and(R.compose(R.equals('{'), R.head), R.compose(R.equals('}'), R.last));
const removeBracesAndPrependColon = R.compose(R.concat(':'), R.slice(1, -1));
const convertParamToExpressFormat = R.ifElse(
  isWrappedInCurlyBraces,
  removeBracesAndPrependColon,
  R.identity
);

const getResource = R.compose(R.join('/'), R.map(convertParamToExpressFormat), R.split('/'));
const expressifyPaths = R.over(R.lensProp('path'), getResource);

const attachToRouter = R.curry((router, middlewareObj, basePath, route) => {
  	const resource = basePath + route.path;
    const verb = route.verb;
    const controllerName = route.controller;
    const functionName = route.middlewareFunction;
    if (controllerName && functionName && R.has(functionName, middlewareObj[controllerName])) {
      console.log(`SETTING UP ROUTE ${resource} ${verb} ${controllerName}.${functionName}`);
      router[verb](resource, middlewareObj[controllerName][functionName]);
    } else {
      console.log(`ERROR setting up ${resource} ${verb}: ${controllerName}.${functionName} not found`);
    }
});

const noEscapeCharsInRoutes = R.compose(R.not, R.any(R.test(/\\/)), R.pluck('path'));

const setUpRoutes = (middlewareObj, router, swaggerDoc, useBasePath) => {
	const basePath = useBasePath ? swaggerDoc.basePath : '';
	return R.compose(
		R.ifElse(
		  noEscapeCharsInRoutes,
		  R.forEach(attachToRouter(router, middlewareObj, basePath)),
		  () => console.log('SWAGGER doc contains invalid routes, no routes have been set-up')
		),
		R.map(expressifyPaths),
		parser
	)(swaggerDoc);
};

module.exports = {
  setUpRoutes
};