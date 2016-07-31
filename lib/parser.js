'use strict';

const R = require('ramda');

const parseVerb = v => ({
	verb: v[0],
	controller: v[1]['x-swagger-router-controller'],
	middlewareFunction: v[1].operationId
});

const parseVerbs = R.compose(R.map(parseVerb), R.toPairs);

const parsePaths = (acc, path) => {
	const routes = parseVerbs(path[1]);
	const routesWithPath = R.map(R.assoc('path', path[0]), routes);
	return R.concat(routesWithPath, acc);
};

const parser = R.compose(R.reduce(parsePaths, []), R.toPairs, R.prop('paths'));

module.exports = parser;