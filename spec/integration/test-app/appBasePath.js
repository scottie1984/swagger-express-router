'use strict';

module.exports = express => {

	var app = express();
	let simpleSwaggerDoc = require('./simpleSwagger.json');
	let swaggerRouter = require('../../../lib');

	const middleware = {
		test: require('./test-middleware/middleware'),
		testAnother: require('./test-middleware/middlewareAnother')
	};

	swaggerRouter.setUpRoutes(middleware, app, simpleSwaggerDoc, true);
	return app;
}