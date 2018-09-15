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
You can now optionally use the swagger document to also validate your API inputs, both in your middleware or before your middleware is called.
### Validation within your middleware
This method will pass in an extra validator parameter as the first parameter of your middleware handler function. Change the above example in the following manner:
```javascript
const validate = true;
swagger.setUpRoutes(middlewareObj, app, swaggerDocument, useBasePath, validate);
```
You will have to change your middleware function like so:
```javascript
const swagTest = (validator, req, res) => { 
    const result = validator(req);
    if (result.valid) {
        res.send('Blah1');
    } else {
    	console.log(result.errors);
    }
};
```
The advantage of this method is that you can use the validator as you see fit within your middleware. 
The disadvantage is that it will add the extra parameter, making your middleware functions incompatible with the standard behavior.
### Validation before your middleware
This method will validate the request before sending to your middleware. This means that if the call reaches your middleware, it has already been swagger validated.
You do this by passing in a function instead of a boolean for the validate parameter when first setting up your routes.
This function will only be called when validation errors where found.
```javascript
const validate = (validateErrors, middlewareFunction, req, res, next) => {
    // this function only gets called when there is validation errors, in this case we return a bad request result when validation errors occurred
    res.status(400).send({ code: "INVALID_API_PARAMETERS", errors: p_ValidateErrors });
};
swagger.setUpRoutes(middlewareObj, app, swaggerDocument, useBasePath, validate);
```
No changes are needed in your middleware in this case.

If you still want to call the middleware after this function gets hit, you can use the middlewareFunction parameter, for example:
```javascript
const validate = (validateErrors, middlewareFunction, req, res, next) => {
	if (fixErrors(validateErrors, req)) { // maybe I can fix some of the errors here
		// call the middleware if the fixes were successful
		middlewareFunction(req, res, next);
	} else {
        res.status(400).send({ code: "INVALID_API_PARAMETERS", errors: p_ValidateErrors });
	}
};
swagger.setUpRoutes(middlewareObj, app, swaggerDocument, useBasePath, validate);
```
### Notes on validation support
At the moment the validator has the following restrictions and missing features.
* Only local references can be used for schemas. It does not support loading schemas from outside the swagger document.
* It does not yet support recursive validation (e.g. validating items within arrays or objects within objects, where schemas within schemas are needed)
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
* object
    * maxProperties
    * minProperties

## Test

This module should work with all versions of Express 3 & Express 4. It has been tested specifically tested against express versions '4.14.0', '4.7.0', '4.1.0', '3.4.0', '3.1.0'

## Requirements

* Node v4.7 or above
* Express 3 or above
