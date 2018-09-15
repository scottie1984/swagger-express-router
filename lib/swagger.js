"use strict";

const parser = require("./parser");

const convertParamToExpressFormat = (p_Param) => ((p_Param.startsWith("{") && p_Param.endsWith("}")) ? `:${p_Param.slice(1, -1)}` : p_Param);
const expressifyPaths = (p_Item) => Object.assign(p_Item, { path: p_Item.path.split("/").map(convertParamToExpressFormat).join("/") });

const attachToRouter = (router, middlewareObj, basePath, route, validate) => {
	const resource = basePath + route.path;
	if (route.controller && route.middlewareFunction && middlewareObj[route.controller].hasOwnProperty(route.middlewareFunction)) {
		console.log(`SETTING UP ROUTE ${resource} ${route.verb} ${route.controller}.${route.middlewareFunction}`);
		if (validate) {
			if (typeof validate === "function") {
				router[route.verb](resource, function (req, res) {
					const result = route.validator(req, res);
					if (result.valid) {
						middlewareObj[route.controller][route.middlewareFunction](...arguments);
					} else {
						validate(result.errors, middlewareObj[route.controller][route.middlewareFunction], ...arguments);
					}
				});
			} else {
				router[route.verb](resource, function () { middlewareObj[route.controller][route.middlewareFunction](route.validator, ...arguments); });
			}
		} else {
			router[route.verb](resource, middlewareObj[route.controller][route.middlewareFunction]);
		}
	} else {
		console.log(`ERROR setting up ${resource} ${route.verb}: ${route.controller}.${route.middlewareFunction} not found`);
	}
};

const setUpRoutes = (middlewareObj, router, swaggerDoc, useBasePath, validate) => {
	const expresified = parser(swaggerDoc, validate).map(expressifyPaths);
	expresified.forEach((p_Route) => {
		((!/\\/.test(p_Route.path)) ? attachToRouter(router, middlewareObj, useBasePath ? swaggerDoc.basePath : "", p_Route, validate) : console.log("SWAGGER doc contains invalid routes, no routes have been set-up"));
	});
};

module.exports = {
	setUpRoutes
};
