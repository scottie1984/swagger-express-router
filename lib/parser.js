'use strict';

const parseVerbs = (p_Path) => Object.keys(p_Path).map((p_Key) => [p_Key, p_Path[p_Key]]).map((p_Pair) => ({
	verb: p_Pair[0],
	controller: p_Pair[1]['x-swagger-router-controller'],
	middlewareFunction: p_Pair[1].operationId,
}));

const parsePaths = (acc, path) => {
	const routes = parseVerbs(path[1]);
	const routesWithPath = routes.map((p_Route) => Object.assign({}, p_Route, { path: path[0] }));
	return [].concat(routesWithPath, acc);
};

const parser = (p_Object) => {
	const pairs = Object.keys(p_Object.paths).map((p_Key) => [p_Key, p_Object.paths[p_Key]]);
	return pairs.reduce(parsePaths, []);
};

module.exports = parser;
