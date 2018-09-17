"use strict";

const errorCodes = Object.freeze({
	REQUEST_ERROR_REQUIRED_ITEM_MISSING: "REQUEST_ERROR_REQUIRED_ITEM_MISSING",
	REQUEST_ERROR_INVALID_TYPE: "REQUEST_ERROR_INVALID_TYPE",
	REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS: "REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS",
	REQUEST_ERROR_INVALID_FORMAT: "REQUEST_ERROR_INVALID_FORMAT",
});

const parseVerbs = (p_Path) => Object.keys(p_Path).map((p_Key) => [p_Key, p_Path[p_Key]]).map((p_Pair) => ({
	verb: p_Pair[0],
	controller: p_Pair[1]["x-swagger-router-controller"],
	middlewareFunction: p_Pair[1].operationId,
	swagger: p_Pair[1],
}));

const parsePaths = (acc, path) => {
	const routes = parseVerbs(path[1]);
	const routesWithPath = routes.map((p_Route) => Object.assign({}, p_Route, { path: path[0] }));
	return [].concat(routesWithPath, acc);
};

const createBodyValidateObject = (p_Required, p_Schema) => {
	return {
		required: p_Required,
		validate(p_Request)	{
			const dataObject = p_Request.body;
			let errors = [];

			if (dataObject || (!dataObject && !this.required)) {
				if (dataObject) {
					errors = p_Schema.validate(dataObject);
				}
			} else {
				errors.push({ code: errorCodes.REQUEST_ERROR_REQUIRED_ITEM_MISSING, message: "Missing required body from request" });
			}
			return errors;
		}
	};
};

const retrieveRef = (p_Ref, p_Swagger) => {
	let result = null;
	if (!p_Ref.startsWith("#")) {
		console.log(`we only support local references, so reference ${p_Ref} cannot be handled. No schema validation will be done for this schema`);
	} else {
		const parts = p_Ref.split("/").slice(1);
		const def = parts.reduce((p_Previous, p_Part) => p_Previous[p_Part] || {}, p_Swagger);
		if (!def) {
			console.log(`we could not find ${p_Ref}. No schema validation will be done for this reference`);
		} else {
			result = def;
		}
	}

	return result;
};

const validateProperty = (p_Property, p_PropertyName, p_Schema, p_IsParam) => {
	const errors = [];

	if (p_Schema) {
		if (p_IsParam) {
			// for params the type would always be string, only properties from objects can be properly tested for type.
			try {
				// so we convert it here to the proper type by pasing it as json
				p_Property = JSON.parse(p_Property);
			} catch (p_Error) {} // in case of a parse error it will be a string
		}
		if (typeof p_Property !== p_Schema.type && (typeof p_Property !== "number" || p_Schema.type !== "integer")) {
			errors.push({ code: errorCodes.REQUEST_ERROR_INVALID_TYPE, message: `property '${p_PropertyName}' should be of type '${p_Schema.type}' but was of type '${Array.isArray(p_Property) ? "array" : typeof p_Property}'` });
		} else {
			switch (p_Schema.type) {
				case "null":
					break;
				case "boolean":
					break;
				case "object":
					if (p_Schema.maxProperties !== undefined && Object.keys(p_Property).length > Math.max(0, p_Schema.maxProperties)) {
						errors.push({ code: errorCodes.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS, message: `property '${p_PropertyName}' has '${Object.keys(p_Property).length}' properties which is more than the maximum allowed number of ${p_Schema.maxProperties}'` });
					}
					if (p_Schema.minProperties !== undefined && Object.keys(p_Property).length < Math.max(0, p_Schema.minProperties)) {
						errors.push({ code: errorCodes.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS, message: `property '${p_PropertyName}' has '${Object.keys(p_Property).length}' properties which is less than the minimum required number of ${p_Schema.minProperties}'` });
					}
					break;
				case "array":
					if (p_Schema.maxItems !== undefined && p_Property.length > Math.max(0, p_Schema.maxItems)) {
						errors.push({ code: errorCodes.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS, message: `property '${p_PropertyName}' has '${p_Property.length}' items which is more than the maximum allowed number of ${p_Schema.maxItems}'` });
					}
					if (p_Schema.minItems !== undefined && p_Property.length < Math.max(0, p_Schema.minItems)) {
						errors.push({ code: errorCodes.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS, message: `property '${p_PropertyName}' has '${p_Property.length}' items which is less than the minimal required number of ${p_Schema.minItems}'` });
					}
					if (p_Schema.uniqueItems && !p_Property.every((p_Item, p_Index, p_Array) => p_Array.indexOf(p_Item, p_Index + 1) === -1)) {
						errors.push({ code: errorCodes.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS, message: `property '${p_PropertyName}' has duplicated items, but is required to have all unique items` });
					}
					break;
				case "number":
				case "integer":
					if (p_Schema.multipleOf !== undefined && (p_Schema.multipleOf | 0) > 0 && (p_Property % (p_Schema.multipleOf | 0) !== 0)) {
						errors.push({ code: errorCodes.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS, message: `property '${p_PropertyName}' with value '${p_Property}' is not a multiple of '${(p_Schema.multipleOf | 0)}'` });
					}
					if (p_Schema.maximum !== undefined && (p_Property > p_Schema.maximum || p_Schema.exclusiveMaximum && p_Property >= p_Schema.maximum)) {
						errors.push({ code: errorCodes.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS, message: `property '${p_PropertyName}' with value '${p_Property}' is ${(p_Schema.exclusiveMaximum && p_Property === p_Schema.maximum) ? "equal to" : "larger than"} the ${(p_Schema.exclusiveMaximum) ? "exclusive" : ""} maximum of '${p_Schema.maximum}'` });
					}
					if (p_Schema.minimum !== undefined && (p_Property < p_Schema.minimum || p_Schema.exclusiveMinimum && p_Property <= p_Schema.minimum)) {
						errors.push({ code: errorCodes.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS, message: `property '${p_PropertyName}' with value '${p_Property}' is ${(p_Schema.exclusiveMinimum && p_Property === p_Schema.minimum) ? "equal to" : "smaller than"} the ${(p_Schema.exclusiveMinimum) ? "exclusive" : ""} minimum of '${p_Schema.minimum}'` });
					}
					break;
				case "string":
					if (p_Schema.format) {
						let result = true;
						switch (p_Schema.format) {
							case "email":
								result = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i.test(p_Property);
								break;
							case "date":
								result = /^\d{4}-\d{2}-\d{2}$/.test(p_Property);
								break;
							case "dateTime":
								result = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/i.test(p_Property);
								break;
						}
						if (!result) {
							errors.push({ code: errorCodes.REQUEST_ERROR_INVALID_FORMAT, message: `property '${p_PropertyName}' did not match the format for '${p_Schema.format}' when testing this value '${p_Property}'` });
						}
					}
					if (p_Schema.pattern) {
						try {
							const regexp = new RegExp(p_Schema.pattern);
							if (!regexp.test(p_Property)) {
								errors.push({ code: errorCodes.REQUEST_ERROR_INVALID_FORMAT, message: `property '${p_PropertyName}' did not match the pattern '${p_Schema.pattern.toString()}' when testing this value '${p_Property}'` });
							}
						} catch (p_Error) {
							console.log(`the schema pattern was not a valid regexp: ${p_Error.message}`);
						}
					}
					if (p_Schema.minLength !== undefined && p_Property.length < Math.max(0, p_Schema.minLength)) {
						errors.push({ code: errorCodes.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS, message: `property '${p_PropertyName}' with length ${p_Property.length}, was shorter than the minLength of ${p_Schema.minLength}` });
					}
					if (p_Schema.maxLength !== undefined && p_Property.length > Math.max(0, p_Schema.maxLength)) {
						errors.push({ code: errorCodes.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS, message: `property '${p_PropertyName}' with length ${p_Property.length}, was longer than the maxLength of ${p_Schema.maxLength}` });
					}
					if (p_Schema.enum) {
						if (Array.isArray(p_Schema.enum) && p_Schema.enum.indexOf(p_Property) === -1) {
							errors.push({ code: errorCodes.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS, message: `property '${p_PropertyName}' with value ${p_Property}, was not found within the allowed values of '${p_Schema.enum.join("','")}'` });
						} else {
							console.log("the enum in this schema was not an array");
						}
					}
					break;
				default:
					console.log(`Invalid type: ${p_Schema.type} in schema`);
			}
		}
	}
	return errors;
};

const createParamSchemaValidator = (p_Name, p_Schema, p_Swagger) => {
	return {
		name: p_Name,
		schema: (p_Schema.$ref) ? retrieveRef(p_Schema.$ref, p_Swagger) : p_Schema,
		validate(p_Param) { return validateProperty(p_Param, this.name, this.schema, true); },
	};
};

const createBodySchemaValidator = (p_Schema, p_Swagger) => {
	return (p_Schema) ? {
		schema: (p_Schema.$ref) ? retrieveRef(p_Schema.$ref, p_Swagger) : p_Schema,
		validate(p_Object) {
			let errors = [];

			if (this.schema.properties) {
				Object.keys(this.schema.properties).forEach((p_Key) => {
					const property = this.schema.properties[p_Key];
					const propSchema = (property.$ref) ? retrieveRef(property.$ref) : property;

					if ((propSchema.required || this.schema.required.indexOf(p_Key) !== -1) && !p_Object[p_Key]) {
						errors.push({ code: errorCodes.REQUEST_ERROR_REQUIRED_ITEM_MISSING, message: `Missing required parameter: '${p_Key}'`});
					}
					if (p_Object[p_Key]) {
						errors = errors.concat(validateProperty(p_Object[p_Key], p_Key, propSchema, false));
					}
				});
			} else {
				validateProperty(p_Object, "body", this.schema, false);
			}
			return errors;
		}
	} : undefined;
};

const createValidateObject = (p_Required, dataLocation, p_Name, p_Schema) => {
	return {
		required: p_Required,
		name: p_Name,
		validate(p_Request) {
			const dataObject = p_Request[dataLocation];
			let errors = [];
			if ((dataObject && dataObject[this.name] !== undefined) || !this.required){
				if (dataObject && dataObject[this.name] !== undefined) {
					errors = p_Schema.validate(dataObject[this.name]);
				}
			} else {
				errors.push({ code: errorCodes.REQUEST_ERROR_REQUIRED_ITEM_MISSING, message: `Missing required parameter: '${this.name}'`});
			}

			return errors;
		},
	};
};

const createValidator = (p_Route, p_Swagger) => {
	const validators = [];
	p_Route.validator = (p_Validate, req, res, next) => {
		const doValidate = (p_Request) => validators.reduce((p_Previous, p_Validator) => p_Previous.concat(p_Validator.validate(p_Request)), []);
		res.locals.validateErrors = doValidate(req);
		if (res.locals.validateErrors.length) {
			if (typeof p_Validate === "function") {
				// call fail handler function
				p_Validate(req, res, next);
			} else {
				// automatically send back fail
				res.status(400).send({ validationErrors: res.locals.validateErrors });
			}
		} else {
			next(); // validation passed so call next in chain
		}
	};
	// check if authentication is required, we will just check to see if a security section exists for this route and that it has at least one item
	p_Route.mustAuthenticate = p_Route.swagger.security && p_Route.swagger.security.length;
	// create validators for parameters
	if (p_Route.swagger.parameters) {
		p_Route.swagger.parameters.map((p_Parameter) => {
			if (p_Parameter.name && p_Parameter.in) {
				if (p_Parameter.allowEmptyValue && p_Parameter.in !== "query") {
					console.log("Parameter 'allowEmptyValue' is set to true, but the 'in' parameter is not 'query'. This is invalid according to the specifications, so we will ignore 'allowEmptyValue'");
				}
				const schema = createParamSchemaValidator(p_Parameter.name, p_Parameter.schema, p_Swagger);

				switch (p_Parameter.in) {
					case "path":
						if (!p_Parameter.required) {
							console.log("Parameter 'in' is set to 'path' but 'required' is missing or set to false. This is invalid according to the specifications, so we will assume required === true");
						}
						validators.push(createValidateObject(true, "params", p_Parameter.name, schema));
						break;
					case "query": validators.push(createValidateObject(p_Parameter.required, "query", p_Parameter.name, schema)); break;
					case "header": validators.push(createValidateObject(p_Parameter.required, "headers", p_Parameter.name, schema)); break;
					case "cookie": validators.push(createValidateObject(p_Parameter.required, "cookies", p_Parameter.name, schema)); break;
					default: console.log(`Cannot create validator for parameter: ${JSON.stringify(p_Parameter)} because the 'in' value is not one of 'query', 'path', 'header' or 'cookie'`); break;
				}
			} else {
				console.log(`Cannot create validator for parameter: ${JSON.stringify(p_Parameter)} because it is missing one of the required parameters 'in' or 'name'`);
			}
		});
	}
	// create validators for request body
	if (p_Route.swagger.requestBody) {
		const required = p_Route.swagger.requestBody.required;
		const content = p_Route.swagger.requestBody.content;
		if (content) {
			const schema = createBodySchemaValidator((content[Object.keys(content)[0] || ""] || {}).schema, p_Swagger);
			if (schema) {
				validators.push(createBodyValidateObject(required, schema));
			} else {
				console.log(`request body: ${JSON.stringify(p_Route.swagger.requestBody)} had no schema or it is invalid, no validator will be created for the request body`);
			}
		} else {
			console.log(`request body: ${JSON.stringify(p_Route.swagger.requestBody)} had no content, no validator will be created for the request body`);
		}
	}
};

const parser = (p_Object, p_Validate) => {
	const routes = Object.keys(p_Object.paths).map((p_Key) => [p_Key, p_Object.paths[p_Key]]).reduce(parsePaths, []);

	if (p_Validate) {
		routes.map((p_Route) => createValidator(p_Route, p_Object));
	}

	return routes;
};

module.exports = parser;
