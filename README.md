# Swagger Express Router and Validator

Takes a swagger JSON document and sets up express HTTP routes bound to middleware functions. All routing is therefore driven from the swagger documentation. In this new version you can also optionally setup validation of the API input using the property and parameter definitions in your swagger Document.

## Usage

In app's `package.json`

    "swagger-express-router-validator": "git+https://github.com/virtualcodewarrior/swagger-express-router.git"

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
## Validation
You can now optionally use the swagger document to also validate your API inputs, before your middleware is called.
If this is enabled, the input will have been fully swaggered validated by the time it reaches your middleware. Depending on which of the two methods you use,
your middleware either never gets called if validation fails or it gets called after going through your own error handler function.

### Fully automatic
In this method the API input is fully automatically handled and your middleware will never gets called when any of the validations fails.
To use this methid, just pass in true for the validation parameter when calling setUpRoutes, e.g. 
```javascript
swagger.setUpRoutes(middlewareObj, app, swaggerDocument, useBasePath, true);
```
If validation succeeds, your middleware function will get called. If it fails, your middleware function will never get called and a 400: BAD REQUEST result will be returned containing a json object with the validation errors.

### Providing your own handler function
With this method the validation results will be send to a function you provide and you can then decide how to handle it. 
To use this, you specify a function as the validate parameter when calling setUpRoutes e.g.
```javascript
const validate = (req, res, next) => {
    // this function only gets called when there is validation errors, in this case we return a bad request result when validation errors occurred
    res.status(400).send({ code: "INVALID_API_PARAMETERS", errors: res.locals.validateErrors });
};
swagger.setUpRoutes(middlewareObj, app, swaggerDocument, useBasePath, validate);
```
The validation errors can be found in res.locals.validateErrors.

If you still want to call the middleware after this function gets hit, you can call the next function e.g.
```javascript
const validate = (req, res, next) => {
	if (fixErrors(req, res.status.validateErrors)) { // maybe I can fix some of the errors here
		// call the middleware if the fixes were successful
		next();
	} else {
        res.status(400).send({ code: "INVALID_API_PARAMETERS", errors: res.locals.validateErrors });
	}
};
swagger.setUpRoutes(middlewareObj, app, swaggerDocument, useBasePath, validate);
```
### Notes on validation support
At the moment the validator has the following restrictions and missing features.
* Only local references can be used for schemas. It does not support loading schemas from outside the swagger document.
* It does not support inheritance constructs like "allOf", "oneOf", "anyOf", "discriminator"
* It does not support checking for additional properties as defined in the additionalProperties member of schema
* It does not enforce readOnly, so no error is shown when a readOnly element is in the request.

Support for some of these might be added in the future. 

The following should be supported
* Type checking
* string 
    * minLength
    * maxLength
    * format
        * email
        * date
        * date-time
    * pattern
    * enum
* number
    * maximum
    * exclusiveMaximum
    * minimum
    * exclusiveMinimum
    * multipleOf
* array
    * maxItems
    * minItems
    * uniqueItems
    * per item validation
* object
    * maxProperties
    * minProperties
    * required
    * per property validation

## Autentication
You can also automatically handle your authentication for any swagger API which has been setup with a security array with at least one element e.g.
```text
{
    "openapi": "3.0.0",
     ...
     "paths": {
        "/restricted/someapi": {
            "post": {
                ...
                "security": [{
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT"
                }]
            }
        }   
    }
}
```
You can pass in an authentication function to the setUpRoutes like this:
```javascript
const authenticate = async(req, res, next) => {
	const result = await authenticateUser(req);
	if (result.isAuthenticated) {
		res.locals.userInfo = result.userInfo;
		next(); // don't forget to call next if authentication was successful, so the next middleware function will be called
	} else {
		res.status(401).send("Not authenticated");
	}
};
swagger.setUpRoutes(middlewareObj, app, swaggerDocument, useBasePath, true, authenticate);
```
At this time, there is no special handling that is depended on the type of authentication that was specified in swagger.
The authentication will be done after the validation, just in case your authentication depends on your api inputs.
If you want to continue to your middleware even if authentication fails, just call next in that case also. 

## Test

This module should work with all versions of Express 3 & Express 4. It has been tested specifically tested against express versions '4.14.0', '4.7.0', '4.1.0', '3.4.0', '3.1.0'

## Requirements

* Node v4.7 or above
* Express 3 or above
