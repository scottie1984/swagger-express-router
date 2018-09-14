'use strict';

const parser = require('./parser');

const convertParamToExpressFormat = (p_Param) => ((p_Param.startsWith('{') && p_Param.endsWith('}')) ? `:${p_Param.slice(1, -1)}` : p_Param);
const expressifyPaths = (p_Item) => Object.assign(p_Item, { path: p_Item.path.split('/').map(convertParamToExpressFormat).join('/') });

const attachToRouter = (router, middlewareObj, basePath, route) => {
  	const resource = basePath + route.path;
    const verb = route.verb;
    const controllerName = route.controller;
    const functionName = route.middlewareFunction;
    if (controllerName && functionName && middlewareObj[controllerName].hasOwnProperty(functionName)) {
      console.log(`SETTING UP ROUTE ${resource} ${verb} ${controllerName}.${functionName}`);
      router[verb](resource, middlewareObj[controllerName][functionName]);
    } else {
      console.log(`ERROR setting up ${resource} ${verb}: ${controllerName}.${functionName} not found`);
    }
};

const setUpRoutes = (middlewareObj, router, swaggerDoc, useBasePath) => {
	const expresified = parser(swaggerDoc).map(expressifyPaths);
	expresified.forEach((p_Route) => {
		((!/\\/.test(p_Route.path)) ? attachToRouter(router, middlewareObj, useBasePath ? swaggerDoc.basePath : '', p_Route) : console.log('SWAGGER doc contains invalid routes, no routes have been set-up'));
	});
};

module.exports = {
  setUpRoutes
};
