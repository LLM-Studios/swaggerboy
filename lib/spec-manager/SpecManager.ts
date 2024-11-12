import {
	OpenAPIObject,
	PathsObject,
	PathItemObject,
	ComponentsObject,
	OperationObject,
	SchemaObject,
	ResponseObject,
	ParameterObject,
	ExampleObject,
	RequestBodyObject,
	HeaderObject,
	SecuritySchemeObject,
	LinkObject,
	CallbackObject,
	InfoObject,
	ServerObject,
} from "openapi3-ts/oas31";
import { StorageAdapter } from "./adapters/storage-adapter";
import { stringify } from "yaml";

import ibmOpenapiRuleset from "@ibm-cloud/openapi-ruleset";
import { ISpectralDiagnostic, Spectral } from "@stoplight/spectral-core";

export type PathItemString =
	| "get"
	| "put"
	| "post"
	| "delete"
	| "options"
	| "head"
	| "patch"
	| "trace";

/**
 * SpecManager offers functionality to load, edit, and save an OpenAPI specification.
 */
export class SpecManager {
	private spec: OpenAPIObject | null = null;

	/**
	 * Constructs a SpecManager instance.
	 * @param storage - The StorageAdapter to use for reading and writing the spec.
	 */
	private constructor(private storage: StorageAdapter) {}

	static async init(storage: StorageAdapter): Promise<SpecManager> {
		const manager = new SpecManager(storage);
		await manager.loadSpec();
		return manager;
	}

	/**
	 * Loads the OpenAPI specification.
	 */
	async loadSpec(): Promise<SpecManager> {
		this.spec = await this.storage.read();
		return this;
	}

	/**
	 * Saves the OpenAPI specification.
	 */
	async saveSpec(): Promise<SpecManager> {
		if (!this.spec) {
			throw new Error("Spec is not initialized.");
		}

		const validation = await this.validateSpec();

		if (validation.find((error) => error.severity === 0)) {
			throw new Error(
				`Invalid OpenAPI spec: ${stringify(
					validation.map((v) => ({
						code: v.code,
						message: v.message,
						path: v.path,
					}))
				)}`
			);
		}

		await this.storage.write(this.spec);
		return this;
	}

	/**
	 * Validates the OpenAPI specification.
	 * @returns A boolean indicating whether the spec is valid.
	 */
	async validateSpec(): Promise<ISpectralDiagnostic[]> {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}

		const spectral = new Spectral();
		spectral.setRuleset(ibmOpenapiRuleset);
		const results = await spectral.run(JSON.stringify(this.spec));

		return results.filter(
			(result) => !(result.code as string).startsWith("ibm")
		);
	}

	/**
	 * Sets the OpenAPI info object.
	 * @param info - The InfoObject to set.
	 */
	setInfo(info: InfoObject): SpecManager {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}
		this.spec.info = info;
		return this;
	}

	/**
	 * Initializes the OpenAPI specification with a given configuration.
	 * @param config - The OpenAPIObject configuration to initialize the spec.
	 */
	async initSpec(config: OpenAPIObject): Promise<SpecManager> {
		this.spec = config;
		await this.saveSpec();

		return this;
	}

	/**
	 * Sets the OpenAPI specification to a given configuration.
	 * @param config - The OpenAPIObject configuration to set the spec.
	 */
	setSpec(config: OpenAPIObject): SpecManager {
		this.spec = config;
		return this;
	}

	/**
	 * Adds an endpoint to the OpenAPI specification.
	 * @param path - The API endpoint path (e.g., '/users').
	 * @param method - The HTTP method (e.g., 'get', 'post').
	 * @param operation - The OperationObject defining the endpoint operation.
	 */
	addEndpoint(
		path: string,
		method: string,
		operation: OperationObject
	): SpecManager {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}
		if (!this.spec.paths) {
			this.spec.paths = {} as PathsObject;
		}
		if (!this.spec.paths[path]) {
			this.spec.paths[path] = {} as PathItemObject;
		}
		this.spec.paths[path][method.toLowerCase() as PathItemString] = operation;

		return this;
	}

	/**
	 * Updates an existing endpoint in the OpenAPI specification.
	 * @param path - The API endpoint path.
	 * @param method - The HTTP method.
	 * @param operation - The updated OperationObject.
	 */
	updateEndpoint(
		path: string,
		method: string,
		operation: OperationObject
	): SpecManager {
		this.addEndpoint(path, method, operation);
		return this;
	}

	/**
	 * Removes an endpoint from the OpenAPI specification.
	 * @param path - The API endpoint path.
	 * @param method - The HTTP method.
	 */
	removeEndpoint(path: string, method: string): SpecManager {
		if (!this.spec || !this.spec.paths || !this.spec.paths[path]) {
			return this;
		}
		delete this.spec.paths[path][method.toLowerCase() as PathItemString];
		if (Object.keys(this.spec.paths[path]).length === 0) {
			delete this.spec.paths[path];
		}

		return this;
	}

	/**
	 * Adds a schema component to the OpenAPI specification.
	 * @param name - The name of the schema.
	 * @param schema - The SchemaObject defining the schema.
	 */
	addSchemaComponent(name: string, schema: SchemaObject): SpecManager {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}
		if (!this.spec.components) {
			this.spec.components = {} as ComponentsObject;
		}
		if (!this.spec.components.schemas) {
			this.spec.components.schemas = {};
		}
		this.spec.components.schemas[name] = schema;

		return this;
	}

	/**
	 * Updates an existing schema component in the OpenAPI specification.
	 * @param name - The name of the schema.
	 * @param schema - The updated SchemaObject.
	 */
	updateSchemaComponent(name: string, schema: SchemaObject): SpecManager {
		this.addSchemaComponent(name, schema);
		return this;
	}

	/**
	 * Removes a schema component from the OpenAPI specification.
	 * @param name - The name of the schema.
	 */
	removeSchemaComponent(name: string): SpecManager {
		if (!this.spec || !this.spec.components?.schemas) {
			return this;
		}
		delete this.spec.components.schemas[name];

		return this;
	}

	/**
	 * Adds a response component to the OpenAPI specification.
	 * @param name - The name of the response.
	 * @param response - The ResponseObject defining the response.
	 */
	addResponseComponent(name: string, response: ResponseObject): SpecManager {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}
		if (!this.spec.components) {
			this.spec.components = {} as ComponentsObject;
		}
		if (!this.spec.components.responses) {
			this.spec.components.responses = {};
		}
		this.spec.components.responses[name] = response;

		return this;
	}

	/**
	 * Updates an existing response component in the OpenAPI specification.
	 * @param name - The name of the response.
	 * @param response - The updated ResponseObject.
	 */
	updateResponseComponent(name: string, response: ResponseObject): SpecManager {
		return this.addResponseComponent(name, response);
	}

	/**
	 * Removes a response component from the OpenAPI specification.
	 * @param name - The name of the response.
	 */
	removeResponseComponent(name: string): SpecManager {
		if (!this.spec || !this.spec.components?.responses) {
			return this;
		}
		delete this.spec.components.responses[name];

		return this;
	}

	/**
	 * Adds a parameter component to the OpenAPI specification.
	 * @param name - The name of the parameter.
	 * @param parameter - The ParameterObject defining the parameter.
	 */
	addParameterComponent(name: string, parameter: ParameterObject): SpecManager {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}
		if (!this.spec.components) {
			this.spec.components = {} as ComponentsObject;
		}
		if (!this.spec.components.parameters) {
			this.spec.components.parameters = {};
		}
		this.spec.components.parameters[name] = parameter;

		return this;
	}

	removeParameterComponent(name: string): SpecManager {
		if (!this.spec || !this.spec.components?.parameters) {
			return this;
		}
		delete this.spec.components.parameters[name];

		return this;
	}

	// Methods for examples
	addExampleComponent(name: string, example: ExampleObject): SpecManager {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}
		if (!this.spec.components) {
			this.spec.components = {} as ComponentsObject;
		}
		if (!this.spec.components.examples) {
			this.spec.components.examples = {};
		}
		this.spec.components.examples[name] = example;

		return this;
	}

	removeExampleComponent(name: string): SpecManager {
		if (!this.spec || !this.spec.components?.examples) {
			return this;
		}
		delete this.spec.components.examples[name];

		return this;
	}

	// Methods for requestBodies
	addRequestBodyComponent(
		name: string,
		requestBody: RequestBodyObject
	): SpecManager {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}
		if (!this.spec.components) {
			this.spec.components = {} as ComponentsObject;
		}
		if (!this.spec.components.requestBodies) {
			this.spec.components.requestBodies = {};
		}
		this.spec.components.requestBodies[name] = requestBody;

		return this;
	}

	removeRequestBodyComponent(name: string): SpecManager {
		if (!this.spec || !this.spec.components?.requestBodies) {
			return this;
		}
		delete this.spec.components.requestBodies[name];

		return this;
	}

	// Methods for headers
	addHeaderComponent(name: string, header: HeaderObject): SpecManager {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}
		if (!this.spec.components) {
			this.spec.components = {} as ComponentsObject;
		}
		if (!this.spec.components.headers) {
			this.spec.components.headers = {};
		}
		this.spec.components.headers[name] = header;

		return this;
	}

	removeHeaderComponent(name: string): SpecManager {
		if (!this.spec || !this.spec.components?.headers) {
			return this;
		}
		delete this.spec.components.headers[name];

		return this;
	}

	// Methods for securitySchemes
	addSecuritySchemeComponent(
		name: string,
		securityScheme: SecuritySchemeObject
	): SpecManager {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}
		if (!this.spec.components) {
			this.spec.components = {} as ComponentsObject;
		}
		if (!this.spec.components.securitySchemes) {
			this.spec.components.securitySchemes = {};
		}
		this.spec.components.securitySchemes[name] = securityScheme;

		return this;
	}

	// Methods for links
	addLinkComponent(name: string, link: LinkObject): SpecManager {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}
		if (!this.spec.components) {
			this.spec.components = {} as ComponentsObject;
		}
		if (!this.spec.components.links) {
			this.spec.components.links = {};
		}
		this.spec.components.links[name] = link;

		return this;
	}

	// Methods for callbacks
	addCallbackComponent(name: string, callback: CallbackObject): SpecManager {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}
		if (!this.spec.components) {
			this.spec.components = {} as ComponentsObject;
		}
		if (!this.spec.components.callbacks) {
			this.spec.components.callbacks = {};
		}
		this.spec.components.callbacks[name] = callback;

		return this;
	}

	/**
	 * Retrieves the current OpenAPI specification.
	 * @returns The OpenAPIObject representing the spec.
	 */
	getSpec(): OpenAPIObject | null {
		return this.spec;
	}

	/**
	 * Removes the server from the OpenAPI specification.
	 */
	removeServer(): SpecManager {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}
		this.spec.servers = [];
		return this;
	}

	/**
	 * Sets the server in the OpenAPI specification.
	 * @param servers - The ServerObject array to set.
	 */
	setServers(servers: ServerObject[]): SpecManager {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}
		this.spec.servers = servers;
		return this;
	}

	/**
	 * Sets the tags in the OpenAPI specification.
	 * @param tags - The tags to set.
	 */
	setTags(tags: { name: string; description?: string }[]): SpecManager {
		if (!this.spec) {
			throw new Error("Spec is not loaded.");
		}
		this.spec.tags = tags;
		return this;
	}
}
