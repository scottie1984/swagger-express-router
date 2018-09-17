"use strict";

const parser = require("./parser");

const convertParamToExpressFormat = (p_Param) => p_Param.replace(/{([^}]*)}/g, ":$1");
const expressifyPaths = (p_Item) => Object.assign(p_Item, { path: p_Item.path.split("/").map(convertParamToExpressFormat).join("/") });

const attachToRouter = (router, middlewareObj, basePath, route, validate, authenticate) => {
	const resource = basePath + route.path;
	if (route.controller && route.middlewareFunction && middlewareObj[route.controller].hasOwnProperty(route.middlewareFunction)) {
		console.log(`SETTING UP ROUTE ${resource} ${route.verb} ${route.controller}.${route.middlewareFunction}`);
		const handlers = [middlewareObj[route.controller][route.middlewareFunction]];
		if (validate) {
			handlers.unshift(function () { route.validator(validate, ...arguments) });
		}
		if (authenticate && typeof authenticate === "function" && route.mustAuthenticate) {
			handlers.unshift(authenticate);
		}
		router[route.verb](resource, ...handlers);
	} else {
		console.log(`ERROR setting up ${resource} ${route.verb}: ${route.controller}.${route.middlewareFunction} not found`);
	}
};

module.exports = {
	setUpRoutes(middlewareObj, router, swaggerDoc, useBasePath, validate, autenticate) {
		const expresified = parser(swaggerDoc, validate).map(expressifyPaths);
		expresified.forEach((p_Route) => {
			((!/\\/.test(p_Route.path)) ? attachToRouter(router, middlewareObj, useBasePath ? swaggerDoc.basePath : "", p_Route, validate, autenticate) : console.log("SWAGGER doc contains invalid routes, no routes have been set-up"));
		});
	},
};
