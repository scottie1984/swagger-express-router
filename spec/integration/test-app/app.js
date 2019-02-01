'use strict';

module.exports = express => {
	var app = express();
	let simpleSwaggerDoc = require('./simpleSwagger.json');
	let swaggerRouter = require('../../../lib');

	app.use(function (req, res, next) {
		var redirect = req.query && req.query.qs;
		if(redirect === 'true') {
			res.send('redirect');
		} else {
			next();
		}
	});

	app.param('id', function(req, res, next, id) {
		if (id === "redirect") {
			res.send('redirect');
		} else {
			next();
		}
	});

	const middleware = {
		test: require('./test-middleware/middleware'),
		testAnother: require('./test-middleware/middlewareAnother')
	};

	app.get('/normal', function(req, res) {
	   res.send({ ok: true });
	});
	swaggerRouter.setUpRoutes(middleware, app, simpleSwaggerDoc);

	app.get('/afterNormal', function(req, res) {
	   res.send({ after_ok: true });
	});

	return app;
};
