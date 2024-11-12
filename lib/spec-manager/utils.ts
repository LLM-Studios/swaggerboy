import { OpenAPIObject } from "openapi3-ts/oas31";

export const baseOpenApiSpec = {
	openapi: "3.1.0",
	info: {
		title: "My API",
		version: "1.0.0",
	},
	paths: {},
	tags: [],
	servers: [],
} as OpenAPIObject;
