# Swagger Express Router

[![Build Status](https://travis-ci.org/scottie1984/swagger-express-router.svg?branch=master)](https://travis-ci.org/scottie1984/swagger-express-router)
![Dependencies](https://david-dm.org/scottie1984/swagger-express-router.svg)
[![npm version](https://badge.fury.io/js/swagger-express-router.svg)](http://badge.fury.io/js/swagger-express-router)

Takes a swagger JSON document and sets up express HTTP routes bound to middleware functions. All routing is therefore driven from the swagger documentation.

## Usage

In app's `package.json`

    "swagger-express-router": "latest" // or desired version

The following sample code will set up a **GET** endpoint with URL **http://localhost:8000/api/swagger/v1/test1** bound to the function named **swagTest** in the middleware named **middleware-name1**

Swagger document `swagger.json`

```json
{
   "swagger": "2.0",
   "info": {
     "title": "",
     "description": "",
     "version": "1.0"
   },
   "produces": ["application/json"],
   "host": "localhost:8000",
   "basePath": "/api/swagger/v1",
   "paths": {
     "/test1": {
       "get": {
         "x-swagger-router-controller": "middleware-name1",
         "operationId": "swagTest",
         "tags": ["/test"],
         "description": "",
         "parameters": [],
         "responses": {}
       }
     }
   }
}
```
Express setup `app.js`
```javascript
const app = express();
const swagger = require('swagger-express-router');
const swaggerDocument = require('./swagger.json');
const useBasePath = true; //whether to use the basePath from the swagger document when setting up the routes (defaults to false)
const middlewareObj = {
    'middleware-name1': require('./middleware/middleware-name1'),
    'middleware-name2': require('./middleware/middleware-name2')
};
swagger.setUpRoutes(middlewareObj, app, swaggerDocument, useBasePath);
```

Middleware example `middleware/middleware-name1.js`
```javascript
'use strict';

const swagTest = (req, res) => res.send('Blah1');

module.exports = {
  swagTest
};
```

## Test

This module should work with all versions of Express 3 & Express 4. It has been tested specifically tested against express versions '4.14.0', '4.7.0', '4.1.0', '3.4.0', '3.1.0'

## Requirements

* Node v4.2 or above
* Express 3 or above